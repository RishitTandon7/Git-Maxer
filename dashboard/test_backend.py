import os
from dotenv import load_dotenv
from github import Github
from supabase import create_client
from datetime import datetime as dt
import pytz
from utils.content_generator import get_random_content, get_extension
import httpx

# Monkeypatch httpx.Client to handle potential version mismatches with 'proxy' arg
_original_client_init = httpx.Client.__init__

def _patched_client_init(self, *args, **kwargs):
    try:
        _original_client_init(self, *args, **kwargs)
    except TypeError as e:
        if "proxy" in str(e) and "unexpected keyword argument" in str(e):
            print(f"Warning: Dropping 'proxy' argument from httpx.Client to fix TypeError: {e}")
            if 'proxy' in kwargs:
                del kwargs['proxy']
            _original_client_init(self, *args, **kwargs)
        else:
            raise e

httpx.Client.__init__ = _patched_client_init

# Load env vars
load_dotenv('.env.local')

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
GITHUB_TOKEN = os.getenv("GITHUB_ACCESS_TOKEN") or os.getenv("GITHUB_TOKEN")
GEMINI_KEY = os.getenv("GEMINI_API_KEY")

print(f"SUPABASE_URL: {SUPABASE_URL}")
for key in os.environ:
    if key.startswith("GITHUB"):
        print(f"Found env key: {key}")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Missing Supabase credentials")
    exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def test_run():
    print("Fetching users...")
    response = supabase.table("user_settings").select("*").eq("pause_bot", False).execute()
    users = response.data
    
    if not users:
        print("No active users found.")
        return

    for user in users:
        print(f"\nProcessing user: {user.get('github_username')}")
        
        repo_name = user.get('repo_name', 'auto-contributions')
        repo_visibility = user.get('repo_visibility', 'public')
        full_repo_name = f"{user['github_username']}/{repo_name}"
        
        print(f"Target Repo: {full_repo_name} ({repo_visibility})")
        
        try:
            token = user.get('github_access_token')
            if not token:
                print("Skipping: No GitHub Usage Token found in user settings.")
                continue
                
            g = Github(token)
            
            # Check/Create Repo
            try:
                repo = g.get_repo(full_repo_name)
                print(f"Repository exists")
            except Exception as e:
                print(f"Repository not found or access denied: {e}")
                print("Attempting to create...")
                try:
                    user_obj = g.get_user()
                    private = (repo_visibility == 'private')
                    repo = user_obj.create_repo(
                        repo_name,
                        private=private,
                        description="Auto-generated contributions by GitMaxer",
                        auto_init=True
                    )
                    print(f"Created repository {full_repo_name}")
                except Exception as create_e:
                    print(f"Failed to create repo: {create_e}")
                    continue

            # Check contributions
            IST = pytz.timezone('Asia/Kolkata')
            now_ist = dt.now(IST)
            today_start = now_ist.replace(hour=0, minute=0, second=0, microsecond=0)
            
            commits = repo.get_commits(since=today_start)
            count = commits.totalCount
            print(f"Contributions today: {count}")
            
            if count >= user['min_contributions']:
                print("Skipping: Enough contributions today.")
                # Force run for testing? Uncomment next line to force
                # pass 
                continue

            # Generate and Commit
            print("Generating content...")
            content = get_random_content(GEMINI_KEY)
            ext = get_extension(user['preferred_language'])
            file_name = f"daily_contribution_{now_ist.date()}_{now_ist.strftime('%H%M%S')}.{ext}"
            
            print(f"Committing file: {file_name}")
            repo.create_file(
                path=file_name,
                message=f"Daily contribution: {now_ist.strftime('%Y-%m-%d')}",
                content=content,
                branch="main"
            )
            
            print("Successfully committed!")
            
            # Log to DB
            supabase.table("generated_history").insert({
                "user_id": user['id'],
                "content_snippet": content[:100],
                "language": user['preferred_language'],
                "repo_name": full_repo_name
            }).execute()
            
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    test_run()
