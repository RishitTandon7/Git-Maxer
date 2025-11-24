from http.server import BaseHTTPRequestHandler
import os
import datetime
import pytz
from github import Github
from utils.content_generator import get_random_content

# Configuration
GITHUB_USERNAME = "rishittandon7"
# Timezone for "end of day" calculation
IST = pytz.timezone('Asia/Kolkata')

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            token = os.environ.get("GITHUB_TOKEN")
            repo_name = "RishitTandon7/random_repo"

            if not token:
                self.send_response(500)
                self.end_headers()
                self.wfile.write("Missing GITHUB_TOKEN env var.".encode('utf-8'))
                return

            g = Github(token)
            user = g.get_user(GITHUB_USERNAME)
            
            # Check for contributions today (IST)
            now_ist = datetime.datetime.now(IST)
            today_start = now_ist.replace(hour=0, minute=0, second=0, microsecond=0)
            
            has_contributed = False
            
            # Check public events
            # Note: This checks the last 30 events (default page size). 
            # If the user is extremely active, we might need to fetch more pages, 
            # but for the purpose of "keeping the streak", checking recent activity is usually enough.
            for event in user.get_events():
                event_date = event.created_at.replace(tzinfo=pytz.utc).astimezone(IST)
                if event_date < today_start:
                    break # Events are ordered by time, so we can stop once we go past today
                
                if event_date.date() == now_ist.date():
                    has_contributed = True
                    break
            
            if has_contributed:
                message = f"User {GITHUB_USERNAME} has already contributed today."
            else:
                # No contributions found, let's commit!
                repo = g.get_repo(repo_name)
                
                gemini_key = os.environ.get("GEMINI_API_KEY")
                content = get_random_content(gemini_key)
                
                file_path = "daily_content.txt"
                commit_message = f"Daily contribution: {now_ist.strftime('%Y-%m-%d')}"
                
                try:
                    # Try to get existing file to update it
                    file_contents = repo.get_contents(file_path)
                    repo.update_file(file_path, commit_message, content, file_contents.sha)
                    action = "Updated"
                except:
                    # File doesn't exist, create it
                    repo.create_file(file_path, commit_message, content)
                    action = "Created"
                
                message = f"No contributions found. {action} {file_path} with new content."

            self.send_response(200)
            self.end_headers()
            self.wfile.write(message.encode('utf-8'))
            
        except Exception as e:
            self.send_response(500)
            self.end_headers()
            self.wfile.write(str(e).encode('utf-8'))

