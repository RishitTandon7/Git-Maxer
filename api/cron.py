from http.server import BaseHTTPRequestHandler
import os
import datetime
import pytz
import hashlib
from github import Github
from supabase import create_client, Client
from utils.content_generator import get_random_content

# Configuration
# These should be in Vercel Env Vars
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") # MUST use Service Role to bypass RLS for cron

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            if not SUPABASE_URL or not SUPABASE_KEY:
                self.send_response(500)
                self.wfile.write("Missing Supabase credentials.".encode('utf-8'))
                return

            supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
            
            # 1. Fetch all active users who haven't paused
            # Note: In a real app, you'd paginate this.
            response = supabase.table("user_settings").select("*").eq("pause_bot", False).execute()
            users = response.data
            
            logs = []

            for user_setting in users:
                username = user_setting.get("github_username")
                user_id = user_setting.get("id")
                min_contributions = user_setting.get("min_contributions", 1)
                
                # TODO: Handle custom timezone/deadline per user. 
                # For now, defaulting to IST as per original request.
                IST = pytz.timezone('Asia/Kolkata')
                now_ist = datetime.datetime.now(IST)
                today_start = now_ist.replace(hour=0, minute=0, second=0, microsecond=0)

                # 2. Check GitHub Contributions
                # We need a GitHub Token. Ideally, stored in DB or user auth provider.
                # For this MVP, we are still using the single env var GITHUB_TOKEN 
                # assuming the bot commits on behalf of itself (or the user if it's a PAT).
                # If this is a SaaS, we'd need the USER'S OAuth token.
                # For now, falling back to the global GITHUB_TOKEN for the single user.
                
                github_token = os.environ.get("GITHUB_TOKEN")
                repo_name = "RishitTandon7/random_repo" # Hardcoded for now, or fetch from DB if we add a column
                
                if not github_token:
                    logs.append("Skipping: Missing GITHUB_TOKEN")
                    continue

                g = Github(github_token)
                gh_user = g.get_user(username)
                
                has_contributed = False
                contribution_count = 0
                
                # Check events
                for event in gh_user.get_events():
                    event_date = event.created_at.replace(tzinfo=pytz.utc).astimezone(IST)
                    if event_date < today_start:
                        break
                    if event_date.date() == now_ist.date():
                        contribution_count += 1
                
                if contribution_count >= min_contributions:
                    logs.append(f"User {username}: Already has {contribution_count} contributions.")
                    continue

                # 3. Generate Content
                gemini_key = os.environ.get("GEMINI_API_KEY")
                content = get_random_content(gemini_key)
                
                # 4. Check Uniqueness (History)
                content_hash = hashlib.sha256(content.encode('utf-8')).hexdigest()
                
                # Check if this hash exists for this user
                history_check = supabase.table("generated_history").select("id").eq("user_id", user_id).eq("content_hash", content_hash).execute()
                
                if history_check.data:
                    # Duplicate found! Retry once (simple retry logic)
                    content = get_random_content(gemini_key)
                    content_hash = hashlib.sha256(content.encode('utf-8')).hexdigest()
                
                # 5. Commit to GitHub
                repo = g.get_repo(repo_name)
                file_path = "daily_content.txt"
                commit_message = f"Daily contribution: {now_ist.strftime('%Y-%m-%d')}"
                
                try:
                    try:
                        file_contents = repo.get_contents(file_path)
                        repo.update_file(file_path, commit_message, content, file_contents.sha)
                        action = "Updated"
                    except:
                        repo.create_file(file_path, commit_message, content)
                        action = "Created"
                    
                    # 6. Log to DB
                    supabase.table("generated_history").insert({
                        "user_id": user_id,
                        "content_snippet": content[:50],
                        "content_hash": content_hash,
                        "language": "Unknown" # Generator doesn't return lang yet, can parse later
                    }).execute()
                    
                    logs.append(f"User {username}: {action} contribution.")
                    
                except Exception as e:
                    logs.append(f"User {username}: Error committing - {str(e)}")

            self.send_response(200)
            self.end_headers()
            self.wfile.write(("\n".join(logs)).encode('utf-8'))
            
        except Exception as e:
            self.send_response(500)
            self.end_headers()
            self.wfile.write(str(e).encode('utf-8'))
