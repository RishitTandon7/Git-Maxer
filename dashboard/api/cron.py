from http.server import BaseHTTPRequestHandler
import os
import datetime
from datetime import datetime as dt
import pytz
import hashlib
from github import Github
from supabase import create_client, Client
from utils.content_generator import get_random_content, get_extension

# Configuration ok

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

# Add utils to sys.path for Vercel
import sys
try:
    sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
    sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
except:
    pass

import httpx
# Monkeypatch httpx.Client to handle potential version mismatches with 'proxy' arg
_original_client_init = httpx.Client.__init__

def _patched_client_init(self, *args, **kwargs):
    try:
        _original_client_init(self, *args, **kwargs)
    except TypeError as e:
        if "proxy" in str(e) and "unexpected keyword argument" in str(e):
            # print(f"Warning: Dropping 'proxy' argument from httpx.Client to fix TypeError: {e}")
            if 'proxy' in kwargs:
                del kwargs['proxy']
            _original_client_init(self, *args, **kwargs)
        else:
            raise e

httpx.Client.__init__ = _patched_client_init

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            if not SUPABASE_URL or not SUPABASE_KEY:
                self.send_response(500)
                self.wfile.write("Missing Supabase credentials.".encode('utf-8'))
                return

            from supabase.lib.client_options import ClientOptions

            # Increase timeout to avoid ReadTimeout
            options = ClientOptions(postgrest_client_timeout=60)
            supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY, options=options)
            
            # 1. Fetch active users
            response = supabase.table("user_settings").select("*").eq("pause_bot", False).execute()
            users = response.data
            
            logs = []

            for user in users:
                try:
                    # Get user settings
                    github_username = user['github_username']
                    repo_name = user.get('repo_name', 'auto-contributions')
                    
                    # Sanitize repo name (remove spaces and invalid characters)
                    repo_name = repo_name.strip().replace(' ', '-').replace('_', '-')
                    repo_name = ''.join(c for c in repo_name if c.isalnum() or c == '-')
                    if not repo_name:
                        repo_name = 'auto-contributions'
                    
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
                    
                    # Check Time Preference (New Logic)
                    commit_time_str = user.get('commit_time')
                    should_run_now = False

                    if commit_time_str:
                        try:
                            # Parse "HH:MM"
                            target_hour, target_minute = map(int, commit_time_str.split(':'))
                            target_time = now_ist.replace(hour=target_hour, minute=target_minute, second=0, microsecond=0)
                            
                            # Run if current time is past the target time
                            # AND we haven't hit the daily limit (checked below)
                            if now_ist >= target_time:
                                should_run_now = True
                            else:
                                logs.append(f"User {user['github_username']}: Too early ({now_ist.strftime('%H:%M')} < {commit_time_str})")
                        except ValueError:
                             logs.append(f"User {user['github_username']}: Invalid time format {commit_time_str}")
                    else:
                        # Default behavior for random time: Run nicely around the default deadline (23:45)
                        # OR if we want random distribution, we'd need a different mechanism. 
                        # For now, let's keep the original logic: Run whenever cron hits if no time set,
                        # BUT since cron hits every 15m, this might imply running at 00:00 every day immediately.
                        # Default behavior: Run after 11 PM IST (23:00) OR Early morning (until 4 AM)
                        if now_ist.hour >= 23 or now_ist.hour < 4:
                            should_run_now = True
                        else:
                            logs.append(f"User {user['github_username']}: Default schedule - Sleeping until 11 PM IST")

                    if not should_run_now:
                        continue

                    commits = repo.get_commits(since=today_start)
                    commit_count = commits.totalCount
                    
                    # OWNER OVERRIDE: Unlimited Access (case-insensitive check)
                    username = user.get('github_username', '')
                    plan = user.get('plan_type', 'free')
                    is_owner = username.lower() == 'rishittandon7'
                    
                    # If Owner, allow them to set high targets (handled in UI) but respect their setting here
                    target_contributions = user['min_contributions']
                    
                    # Flag to skip regular commits but still process LeetCode
                    skip_regular_commit = False
                    
                    if commit_count >= target_contributions:
                        logs.append(f"User {user['github_username']} has enough contributions ({commit_count})")
                        skip_regular_commit = True  # Don't skip LeetCode for owner/leetcode plan!
                    
                    if is_owner:
                        logs.append(f"Owner {username}: Bypassing all limits.")
                    elif not skip_regular_commit:
                        # 1. FREE TIER: 1 Commit per Week
                        if plan == 'free':
                            last_commit_str = user.get('last_commit_ts')
                            if last_commit_str:
                                last_commit_dt = datetime.datetime.fromisoformat(last_commit_str.replace('Z', '+00:00'))
                                days_diff = (datetime.datetime.now(datetime.timezone.utc) - last_commit_dt).days
                                if days_diff < 7:
                                    logs.append(f"Free Plan Limit: User {username} already committed {days_diff} days ago. Skipping (Wait 7 days).")
                                    skip_regular_commit = True

                        # 2. PRO TIER: 3 Commits per Day
                        elif plan == 'pro':
                            commits_today = user.get('daily_commit_count', 0)
                            if commits_today >= 3:
                                logs.append(f"Pro Plan Limit: User {username} reached 3 commits today.")
                                skip_regular_commit = True
                    
                    # === REGULAR COMMIT (if not skipped) ===
                    if not skip_regular_commit:
                        # === GENERATION ===
                        # Handle 'any' language logic here to get correct extension
                        lang_for_generation = user['preferred_language']
                        if lang_for_generation == 'any':
                            from utils.content_generator import get_random_language
                            lang_for_generation = get_random_language()

                        gemini_key = os.environ.get("GEMINI_API_KEY")
                        # Pass the specific language to generator
                        content = get_random_content(gemini_key, lang_for_generation) 
                        
                        # Guard against API errors
                        if not content.startswith("Error") and "not found" not in content:
                            # Extract filename from code if available, or generate creative one
                            ext = get_extension(lang_for_generation)
                            file_name = None
                            
                            # Try to find filename in comments (AI might include it)
                            for line in content.split('\n')[:5]:
                                if 'file:' in line.lower() or 'filename:' in line.lower():
                                    parts = line.lower().split(':')
                                    if len(parts) > 1:
                                        potential_name = parts[1].strip().replace('.py', '').replace('.js', '')
                                        if potential_name and len(potential_name) < 50:
                                            file_name = f"{potential_name}.{ext}"
                                            break
                            
                            # If no filename found, generate creative one based on content
                            if not file_name:
                                import hashlib
                                content_hash = hashlib.md5(content.encode()).hexdigest()[:6]
                                topics = ['tutorial', 'example', 'guide', 'demo', 'learning']
                                import random
                                topic = random.choice(topics)
                                file_name = f"{lang_for_generation}_{topic}_{content_hash}.{ext}"
                            
                            # Clean filename
                            file_name = file_name.replace(' ', '_').replace('-', '_').lower()
                            
                            # Add GitMaxer watermark ONLY for FREE users
                            # Pro, Enterprise, LeetCode, and Owner users get clean code
                            final_content = content
                            if plan == 'free':
                                watermark = f"""
# ═══════════════════════════════════════════════════════════════
# 🚀 Generated by GitMaxer (Free Plan)
# 🔗 Upgrade at https://gitmaxer.vercel.app for watermark-free code
# ═══════════════════════════════════════════════════════════════

"""
                                final_content = watermark + content
                            
                            try:
                                repo.create_file(
                                    path=file_name,
                                    message=f"Add {lang_for_generation} learning example",
                                    content=final_content,
                                    branch="main"
                                )
                                
                                # Log success & Update Limits
                                try:
                                    import hashlib
                                    content_hash = hashlib.sha256(content.encode('utf-8')).hexdigest()
                                    supabase.table("generated_history").insert({
                                        "user_id": user['id'],
                                        "content_snippet": content[:100],
                                        "language": lang_for_generation, 
                                        "content_hash": content_hash
                                    }).execute()
                                    
                                    # Increment Counters / Update TS
                                    supabase.table("user_settings").update({
                                        "last_commit_ts": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                                        "daily_commit_count": user.get('daily_commit_count', 0) + 1
                                    }).eq("id", user['id']).execute()

                                except Exception as db_error:
                                    logs.append(f"Warning: DB Log failed: {db_error}")

                                logs.append(f"Successfully committed to {full_repo_name}")
                                
                            except Exception as e:
                                logs.append(f"Failed to commit: {e}")
                        else:
                            logs.append(f"Skipping commit for user {username}: Generation failed - {content}")

                    # === LEETCODE PLAN BONUS ===
                    # If user is owner or has leetcode plan, also commit to their leetcode repo
                    leetcode_repo_name = user.get('leetcode_repo')
                    if (is_owner or plan == 'leetcode') and leetcode_repo_name:
                        try:
                            logs.append(f"LeetCode Plan: Processing {username}'s LeetCode repo...")
                            
                            # Get or create the LeetCode repo
                            leetcode_full = f"{github_username}/{leetcode_repo_name}"
                            try:
                                leetcode_repo = g.get_repo(leetcode_full)
                            except Exception:
                                # Create if doesn't exist
                                logs.append(f"Creating LeetCode repo: {leetcode_full}")
                                user_obj = g.get_user()
                                leetcode_repo = user_obj.create_repo(
                                    leetcode_repo_name,
                                    private=False,
                                    description="My Daily LeetCode Solutions - Auto-generated by GitMaxer 🚀",
                                    auto_init=True
                                )
                            
                            # Generate LeetCode solution (simple template for now)
                            import random
                            import hashlib
                            problems = [
                                {"num": 1, "title": "Two Sum", "difficulty": "Easy"},
                                {"num": 9, "title": "Palindrome Number", "difficulty": "Easy"},
                                {"num": 20, "title": "Valid Parentheses", "difficulty": "Easy"},
                                {"num": 21, "title": "Merge Two Sorted Lists", "difficulty": "Easy"},
                                {"num": 53, "title": "Maximum Subarray", "difficulty": "Medium"},
                                {"num": 70, "title": "Climbing Stairs", "difficulty": "Easy"},
                                {"num": 121, "title": "Best Time to Buy and Sell Stock", "difficulty": "Easy"},
                                {"num": 200, "title": "Number of Islands", "difficulty": "Medium"},
                                {"num": 206, "title": "Reverse Linked List", "difficulty": "Easy"},
                                {"num": 238, "title": "Product of Array Except Self", "difficulty": "Medium"},
                            ]
                            problem = random.choice(problems)
                            
                            leetcode_content = f'''# {problem["num"]}. {problem["title"]}
# Difficulty: {problem["difficulty"]}
# LeetCode Link: https://leetcode.com/problems/{problem["title"].lower().replace(" ", "-")}/

class Solution:
    def solve(self):
        """
        Problem: {problem["title"]}
        Difficulty: {problem["difficulty"]}
        
        Approach:
        - Analyze the problem requirements
        - Consider edge cases
        - Implement optimal solution
        
        Time Complexity: O(n)
        Space Complexity: O(1)
        """
        # Solution implementation
        pass

# Solved: {datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d")}
'''
                            
                            # Create folder structure: difficulty/problem_title.py
                            folder = problem["difficulty"]
                            content_hash = hashlib.md5(leetcode_content.encode()).hexdigest()[:6]
                            file_path = f"{folder}/{problem['num']}_{problem['title'].replace(' ', '_').lower()}_{content_hash}.py"
                            
                            leetcode_repo.create_file(
                                path=file_path,
                                message=f"Solve: {problem['num']}. {problem['title']} ({problem['difficulty']})",
                                content=leetcode_content,
                                branch="main"
                            )
                            
                            logs.append(f"LeetCode: Committed {problem['title']} to {leetcode_full}")
                            
                        except Exception as lc_error:
                            logs.append(f"LeetCode Error for {username}: {lc_error}")
                
                except Exception as user_error:
                    logs.append(f"Error processing user {user.get('github_username')}: {user_error}")

            self.send_response(200)
            self.end_headers()
            self.wfile.write(("\n".join(logs)).encode('utf-8'))
            
        except Exception as e:
            self.send_response(500)
            self.end_headers()
            self.wfile.write(str(e).encode('utf-8'))
