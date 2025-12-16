from http.server import BaseHTTPRequestHandler
import os
import datetime
from datetime import datetime as dt
import pytz
import hashlib
from github import Github
from supabase import create_client, Client
from utils.content_generator import get_random_content, get_extension

# Configuration
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            if not SUPABASE_URL or not SUPABASE_KEY:
                self.send_response(500)
                self.wfile.write("Missing Supabase credentials.".encode('utf-8'))
                return

            supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
            
            # 1. Fetch active users
            response = supabase.table("user_settings").select("*").eq("pause_bot", False).execute()
            users = response.data
            
            logs = []

            for user in users:
                try:
                    # Get user settings
                    github_username = user['github_username']
                    repo_name = user.get('repo_name', 'auto-contributions')
                    repo_visibility = user.get('repo_visibility', 'public')
                    full_repo_name = f"{github_username}/{repo_name}"
                    
                    logs.append(f"Processing user {user['id']} for repo {full_repo_name}")

                    # Initialize Github with user's stored OAuth token
                    user_token = user.get('github_access_token')
                    if not user_token:
                        logs.append(f"Skipping user {user['id']}: No GitHub token found")
                        continue
                    g = Github(user_token)
                    
                    # Check if repo exists, create if not
                    try:
                        repo = g.get_repo(full_repo_name)
                        logs.append(f"Repository {full_repo_name} exists")
                    except Exception:
                        logs.append(f"Repository {full_repo_name} not found, creating...")
                        try:
                            user_obj = g.get_user()
                            private = (repo_visibility == 'private')
                            repo = user_obj.create_repo(
                                repo_name,
                                private=private,
                                description="Auto-generated contributions by GitMaxer",
                                auto_init=True
                            )
                            logs.append(f"Created repository {full_repo_name}")
                        except Exception as create_error:
                            logs.append(f"Failed to create repository: {create_error}")
                            continue

                    # Check contributions on github

                    # Defaulting to IST
                    IST = pytz.timezone('Asia/Kolkata')
                    now_ist = dt.now(IST)
                    today_start = now_ist.replace(hour=0, minute=0, second=0, microsecond=0)
                    
                    commits = repo.get_commits(since=today_start)
                    commit_count = commits.totalCount

                    if commit_count >= user['min_contributions']:
                        logs.append(f"User {user['id']} has enough contributions ({commit_count})")
                        continue

                    # Generate content
                    prompt = f"Write a short, meaningful code snippet or documentation update in {user['preferred_language']}. It should be valid code or text."
                    # Assuming generate_content is available from utils
                    # We need to pass the API key if get_random_content expects it, 
                    # or if we are using a different generator function.
                    # The previous code used get_random_content(gemini_key)
                    gemini_key = os.environ.get("GEMINI_API_KEY")
                    content = get_random_content(gemini_key) 
                    
                    # Create file
                    file_name = f"daily_contribution_{now_ist.date()}_{now_ist.strftime('%H%M%S')}.{get_extension(user['preferred_language'])}"
                    
                    try:
                        repo.create_file(
                            path=file_name,
                            message=f"Daily contribution: {now_ist.strftime('%Y-%m-%d')}",
                            content=content,
                            branch="main"
                        )
                        
                        # Log success
                        supabase.table("generated_history").insert({
                            "user_id": user['id'],
                            "content_snippet": content[:100],
                            "language": user['preferred_language'],
                            "repo_name": full_repo_name
                        }).execute()
                        
                        logs.append(f"Successfully committed to {full_repo_name}")
                        
                    except Exception as e:
                        logs.append(f"Failed to commit: {e}")
                
                except Exception as user_error:
                    logs.append(f"Error processing user {user.get('github_username')}: {user_error}")

            self.send_response(200)
            self.end_headers()
            self.wfile.write(("\n".join(logs)).encode('utf-8'))
            
        except Exception as e:
            self.send_response(500)
            self.end_headers()
            self.wfile.write(str(e).encode('utf-8'))
