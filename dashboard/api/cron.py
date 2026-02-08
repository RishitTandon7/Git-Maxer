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
                    
                    # === DAILY RESET CHECK ===
                    # Reset daily_commit_count if last commit was on a different day
                    last_commit_str = user.get('last_commit_ts')
                    if last_commit_str:
                        try:
                            last_commit_dt = datetime.datetime.fromisoformat(last_commit_str.replace('Z', '+00:00'))
                            today_utc = datetime.datetime.now(datetime.timezone.utc).date()
                            if last_commit_dt.date() < today_utc:
                                # It's a new day! Reset the counter
                                supabase.table("user_settings").update({
                                    "daily_commit_count": 0,
                                    "leetcode_daily_count": 0
                                }).eq("id", user['id']).execute()
                                user['daily_commit_count'] = 0
                                user['leetcode_daily_count'] = 0
                                logs.append(f"Reset daily counts for {github_username} (new day)")
                        except Exception as reset_error:
                            logs.append(f"Warning: Could not reset daily count for {github_username}: {reset_error}")

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
                                description="Daily contributions",
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
                            # Parse "HH:MM" or "HH:MM:SS" format
                            time_parts = commit_time_str.split(':')
                            target_hour = int(time_parts[0])
                            target_minute = int(time_parts[1]) if len(time_parts) > 1 else 0
                            # Ignore seconds if present
                            target_time = now_ist.replace(hour=target_hour, minute=target_minute, second=0, microsecond=0)
                            
                            # Run if current time is past the target time
                            # AND we haven't hit the daily limit (checked below)
                            if now_ist >= target_time:
                                should_run_now = True
                            else:
                                logs.append(f"User {user['github_username']}: Too early ({now_ist.strftime('%H:%M')} < {commit_time_str})")
                        except (ValueError, IndexError) as e:
                             logs.append(f"User {user['github_username']}: Invalid time format {commit_time_str} - {e}")
                    else:
                        # No specific time set - run between 8 PM to 12 AM IST
                        # Daily limit (daily_commit_count) will prevent duplicates
                        if now_ist.hour >= 20 and now_ist.hour < 24:
                            should_run_now = True
                        else:
                            logs.append(f"User {user['github_username']}: Default schedule - Waiting for 8 PM - 12 AM IST window")

                    if not should_run_now:
                        continue

                    try:
                        commits = repo.get_commits(since=today_start)
                        commit_count = commits.totalCount
                    except Exception as e:
                        if "409" in str(e) or "empty" in str(e).lower():
                            logs.append(f"Repository is empty (new), starting fresh.")
                            commit_count = 0
                        else:
                            logs.append(f"Error fetching commits: {e}")
                            continue
                    
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
                        # FREE TIER: 1 Commit per Week
                        if plan == 'free':
                            last_commit_str = user.get('last_commit_ts')
                            if last_commit_str:
                                last_commit_dt = datetime.datetime.fromisoformat(last_commit_str.replace('Z', '+00:00'))
                                days_diff = (datetime.datetime.now(datetime.timezone.utc) - last_commit_dt).days
                                if days_diff < 7:
                                    logs.append(f"Free Plan Limit: User {username} already committed {days_diff} days ago. Skipping (Wait 7 days).")
                                    skip_regular_commit = True
                        else:
                            # PRO/LEETCODE: 1 Commit per Day
                            commits_today = user.get('daily_commit_count', 0)
                            if commits_today >= 1:
                                logs.append(f"{plan.title()} Plan Limit: User {username} reached 1 commit today.")
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
                            
                            # All users get clean code without watermarks
                            final_content = content
                            
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
                    # But respect daily limits - LeetCode users get max 1 commit per day (unless owner)
                    leetcode_repo_name = user.get('leetcode_repo')
                    if (is_owner or plan == 'leetcode') and leetcode_repo_name:
                        # Check if we should skip LeetCode too (for non-owners)
                        leetcode_commits_today = user.get('leetcode_daily_count', 0)
                        max_leetcode_commits = 50 if is_owner else 1  # Owner gets unlimited, others get 1
                        
                        if leetcode_commits_today >= max_leetcode_commits and not is_owner:
                            logs.append(f"LeetCode Limit: User {username} already committed today to LeetCode repo")
                        else:
                            try:
                                logs.append(f"LeetCode Plan: Processing {username}'s LeetCode repo...")
                                
                                # Get or create the LeetCode repo
                                leetcode_full = f"{github_username}/{leetcode_repo_name}"
                                repo_exists = True
                                try:
                                    leetcode_repo = g.get_repo(leetcode_full)
                                except Exception:
                                    # Create if doesn't exist
                                    logs.append(f"Creating LeetCode repo: {leetcode_full}")
                                    user_obj = g.get_user()
                                    leetcode_repo = user_obj.create_repo(
                                        leetcode_repo_name,
                                        private=False,
                                        description="My Daily LeetCode Solutions 🚀",
                                        auto_init=True
                                    )
                                    repo_exists = False  # Just created, skip content commit to avoid 2 commits
                                
                                # If repo was just created, skip adding content (auto_init already made 1 commit)
                                if not repo_exists:
                                    logs.append(f"LeetCode: Repo {leetcode_full} created. Skipping content to avoid double commit.")
                                else:
                                    # 🚀 AI-POWERED LEETCODE: Generate solution for ANY problem (3000+)
                                    import random
                                    import hashlib
                                    
                                    # Pick a random LeetCode problem number (1-3000)
                                    # Gemini knows ALL problems - no need to hardcode them!
                                    problem_number = random.randint(1, 3000)
                                    
                                    # Use Gemini AI to solve ANY LeetCode problem
                                    try:
                                        import google.generativeai as genai
                                        gemini_key = os.environ.get("GEMINI_API_KEY")
                                        genai.configure(api_key=gemini_key)
                                        model = genai.GenerativeModel('gemini-2.0-flash')
                                        
                                        # Simple prompt: just send the problem number!
                                        ai_prompt = f"""You are a LeetCode expert. Solve LeetCode Problem #{problem_number}.

**Instructions:**
1. First, identify the problem title and difficulty
2. Generate a COMPLETE, WORKING Python solution
3. Use the OPTIMAL algorithm (best time/space complexity)
4. Include detailed docstring explaining the approach
5. Add inline comments for key steps
6. Include Time & Space Complexity analysis

**Output Format:**
```python
# Problem Title
# Difficulty: [Easy/Medium/Hard]
# Category: [Array/String/DP/etc]

class Solution:
    def methodName(self, params) -> ReturnType:
        \"\"\"
        [Clear explanation of approach and algorithm]
        \"\"\"
        # Your optimal solution here
        
# Time Complexity: O(?)
# Space Complexity: O(?)
```

Generate production-ready code that passes all test cases!"""

                                        response = model.generate_content(ai_prompt)
                                        ai_output = response.text
                                        
                                        # Clean up markdown code blocks
                                        if "```python" in ai_output:
                                            code_start = ai_output.find("```python") + 9
                                            code_end = ai_output.rfind("```")
                                            ai_solution = ai_output[code_start:code_end].strip()
                                        elif "```" in ai_output:
                                            code_start = ai_output.find("```") + 3
                                            code_end = ai_output.rfind("```")
                                            ai_solution = ai_output[code_start:code_end].strip()
                                        else:
                                            ai_solution = ai_output.strip()
                                        
                                        # Extract title and difficulty from AI response
                                        problem_title = "Problem"
                                        difficulty = "Unknown"
                                        
                                        # Parse first few lines for metadata
                                        lines = ai_solution.split('\n')
                                        for line in lines[:5]:
                                            if '# ' in line and 'Difficulty:' not in line and 'Category:' not in line:
                                                # First comment line is usually the title
                                                problem_title = line.replace('#', '').strip()
                                                if problem_title.startswith(str(problem_number)):
                                                    problem_title = problem_title[len(str(problem_number)):].strip('. ')
                                            if 'Difficulty:' in line:
                                                difficulty = line.split(':')[1].strip()
                                        
                                        leetcode_content = f'''# {problem_number}. {problem_title}
# LeetCode Link: https://leetcode.com/problems/

{ai_solution}

# Solved: {datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d")}
'''
                                        logs.append(f"LeetCode: ✅ AI solved Problem #{problem_number} - {problem_title} ({difficulty})")
                                        
                                    except Exception as ai_error:
                                        logs.append(f"LeetCode: ❌ AI failed for Problem #{problem_number} - {ai_error}")
                                        # Fallback: Create placeholder
                                        leetcode_content = f'''# {problem_number}. LeetCode Problem
# LeetCode Link: https://leetcode.com/problems/

class Solution:
    def solve(self):
        """
        LeetCode Problem #{problem_number}
        
        AI generation temporarily unavailable.
        Visit LeetCode to solve this problem manually.
        """
        pass

# Solved: {datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d")}
'''
                                    
                                    # Create folder structure: difficulty/problem_title.py
                                    # Use the extracted values from AI response (not undefined 'problem' dict)
                                    folder = difficulty if difficulty != "Unknown" else "Medium"
                                    safe_title = problem_title.replace(' ', '_').replace('/', '_').lower()[:50]
                                    content_hash = hashlib.md5(leetcode_content.encode()).hexdigest()[:6]
                                    file_path = f"{folder}/{problem_number}_{safe_title}_{content_hash}.py"
                                    
                                    leetcode_repo.create_file(
                                        path=file_path,
                                        message=f"Solve: {problem_number}. {problem_title} ({difficulty})",
                                        content=leetcode_content,
                                        branch="main"
                                    )
                                    
                                    # Update LeetCode daily count
                                    supabase.table("user_settings").update({
                                        "leetcode_daily_count": leetcode_commits_today + 1
                                    }).eq("id", user['id']).execute()
                                    
                                    logs.append(f"LeetCode: Committed {problem_title} to {leetcode_full}")
                                
                            except Exception as lc_error:
                                logs.append(f"LeetCode Error for {username}: {lc_error}")
                    
                    # === ENTERPRISE PROJECT GENERATION ===
                    # If user is owner or has enterprise plan, check for active projects
                    if (is_owner or plan == 'enterprise'):
                        try:
                            # Get user's active project
                            project_response = supabase.table("projects").select("*").eq("user_id", user['id']).eq("status", "in_progress").execute()
                            
                            if project_response.data and len(project_response.data) > 0:
                                active_project = project_response.data[0]
                                project_id = active_project['id']
                                current_day = active_project.get('current_day', 0)
                                days_duration = active_project.get('days_duration', 15)
                                project_name = active_project.get('project_name', 'Untitled Project')
                                repo_name = active_project.get('repo_name', 'project')
                                tech_stack = active_project.get('tech_stack', [])
                                description = active_project.get('project_description', '')
                                
                                logs.append(f"Enterprise: Found active project '{project_name}' for {username} (Day {current_day}/{days_duration})")
                                
                                # Check if we need to make today's commit
                                if current_day < days_duration:
                                    next_day = current_day + 1
                                    logs.append(f"Enterprise: Generating code for Day {next_day}...")
                                    
                                    # Get GitHub repo
                                    enterprise_repo_full = f"{github_username}/{repo_name}"
                                    try:
                                        enterprise_repo = g.get_repo(enterprise_repo_full)
                                    except Exception:
                                        logs.append(f"Enterprise: ERROR - Repository {enterprise_repo_full} not found!")
                                        raise Exception(f"Repository {enterprise_repo_full} not found. Please ensure it was created.")
                                    
                                    # Generate day-specific code using Gemini AI
                                    gemini_key = os.environ.get("GEMINI_API_KEY")
                                    
                                    # Create phase-based prompts
                                    if next_day <= 3:
                                        phase = "Setup & Foundation"
                                        focus = "project structure, configuration files, README, package.json/requirements.txt"
                                    elif next_day <= 7:
                                        phase = "Core Features"
                                        focus = "main components, models, API routes, authentication"
                                    elif next_day <= 12:
                                        phase = "Advanced Features"
                                        focus = "UI components, business logic, integrations, state management"
                                    else:
                                        phase = "Polish & Finish"
                                        focus = "testing, documentation, optimization, deployment setup"
                                    
                                    # Use Gemini to generate realistic project code
                                    try:
                                        import google.generativeai as genai
                                        genai.configure(api_key=gemini_key)
                                        model = genai.GenerativeModel('gemini-2.0-flash')
                                        
                                        prompt = f"""Generate realistic, production-quality code for Day {next_day} of a 15-day project build.

Project: {project_name}
Description: {description}
Tech Stack: {', '.join(tech_stack) if tech_stack else 'Modern web stack'}
Phase: {phase} (Day {next_day}/15)
Focus: {focus}

Generate ONE complete, functional file that would be created on Day {next_day}.
Include:
1. Proper file path (e.g., src/components/Header.tsx or backend/routes/auth.js)
2. Complete, working code with proper imports
3. Comments explaining key parts
4. Follow best practices for the tech stack

Format your response EXACTLY as:
FILEPATH: path/to/file.ext
CODE:
[complete code here]

Generate actual working code, not templates or placeholders."""

                                        response = model.generate_content(prompt)
                                        ai_output = response.text
                                        
                                        # Parse AI response
                                        if "FILEPATH:" in ai_output and "CODE:" in ai_output:
                                            parts = ai_output.split("CODE:")
                                            filepath_line = parts[0].replace("FILEPATH:", "").strip()
                                            code_content = parts[1].strip()
                                            
                                            # Clean up code content (remove markdown if present)
                                            if code_content.startswith("```"):
                                                lines = code_content.split("\n")
                                                code_content = "\n".join(lines[1:-1]) if len(lines) > 2 else code_content
                                            
                                            # Commit to GitHub
                                            enterprise_repo.create_file(
                                                path=filepath_line,
                                                message=f"Day {next_day}: {phase} - Add {filepath_line.split('/')[-1]}",
                                                content=code_content,
                                                branch="main"
                                            )
                                            
                                            # Update project progress
                                            current_commits = active_project.get('total_commits', 0)
                                            update_data = {
                                                'current_day': next_day,
                                                'total_commits': current_commits + 1
                                            }
                                            
                                            # Mark as completed if we reached the final day
                                            if next_day >= days_duration:
                                                update_data['status'] = 'completed'
                                                logs.append(f"Enterprise: 🎉 Project '{project_name}' COMPLETED!")
                                            
                                            supabase.table("projects").update(update_data).eq("id", project_id).execute()
                                            
                                            logs.append(f"Enterprise: ✅ Day {next_day} committed to {enterprise_repo_full}")
                                        else:
                                            logs.append(f"Enterprise: AI response format error. Using fallback code.")
                                            # Fallback: Create a simple README update
                                            fallback_content = f"""# {project_name}

Day {next_day} - {phase}

## Progress Update
- Current Phase: {phase}
- Focus Areas: {focus}
- Tech Stack: {', '.join(tech_stack) if tech_stack else 'TBD'}

This project is being built incrementally over 15 days.
"""
                                            enterprise_repo.create_file(
                                                path=f"day_{next_day}_progress.md",
                                                message=f"Day {next_day}: {phase} progress update",
                                                content=fallback_content,
                                                branch="main"
                                            )
                                            
                                            current_commits = active_project.get('total_commits', 0)
                                            supabase.table("projects").update({
                                                'current_day': next_day,
                                                'total_commits': current_commits + 1
                                            }).eq("id", project_id).execute()
                                            
                                            logs.append(f"Enterprise: Fallback commit made for Day {next_day}")
                                    
                                    except Exception as ai_error:
                                        logs.append(f"Enterprise: AI generation error - {ai_error}")
                                
                                else:
                                    logs.append(f"Enterprise: Project '{project_name}' already at day {current_day}/{days_duration}")
                            
                        except Exception as enterprise_error:
                            logs.append(f"Enterprise Error for {username}: {enterprise_error}")
                
                except Exception as user_error:
                    logs.append(f"Error processing user {user.get('github_username')}: {user_error}")

            self.send_response(200)
            self.end_headers()
            self.wfile.write(("\n".join(logs)).encode('utf-8'))
            
        except Exception as e:
            self.send_response(500)
            self.end_headers()
            self.wfile.write(str(e).encode('utf-8'))
