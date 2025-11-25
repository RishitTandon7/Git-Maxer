import os
from dotenv import load_dotenv
from github import Github
from supabase import create_client
from datetime import datetime as dt
import pytz
from utils.content_generator import get_random_content, get_extension

# Load env vars
load_dotenv('.env.local')

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
GITHUB_TOKEN = os.getenv("GITHUB_ACCESS_TOKEN")
GEMINI_KEY = os.getenv("GEMINI_API_KEY")

print(f"SUPABASE_URL: {SUPABASE_URL}")
print(f"GITHUB_TOKEN: {'Found' if GITHUB_TOKEN else 'Missing'}")

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
            g = Github(GITHUB_TOKEN)
            
            # Check/Create Repo
            try:
                repo = g.get_repo(full_repo_name)
                print(f"✅ Repository exists")
            except Exception:
                print(f"⚠️ Repository not found, creating...")
                try:
                    user_obj = g.get_user()
                    private = (repo_visibility == 'private')
                    repo = user_obj.create_repo(
                        repo_name,
                        private=private,
                        description="Auto-generated contributions by GitMaxer",
                        auto_init=True
                    )
                    print(f"✅ Created repository {full_repo_name}")
                except Exception as e:
                    print(f"❌ Failed to create repo: {e}")
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
            
            print("✅ Successfully committed!")
            
            # Log to DB
            supabase.table("generated_history").insert({
                "user_id": user['user_id'],
                "content_snippet": content[:100],
                "language": user['preferred_language'],
                "repo_name": full_repo_name
            }).execute()
            
        except Exception as e:
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_run()
