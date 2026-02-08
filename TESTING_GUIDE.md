# 🧪 Testing Guide

## Quick Test Instructions

### Test #1: LeetCode Real Solutions ✅

**Prerequisites:**
- User with `leetcode` or `owner` plan
- `leetcode_repo` field set in user_settings
- User not paused (`pause_bot = false`)

**Steps:**
1. **Option A: Wait for cron**
   - Cron runs automatically (configured schedule)
   - Check your LeetCode repo after cron runs

2. **Option B: Manual trigger**
   ```bash
   # Navigate to the cron endpoint
   # Method depends on your deployment (Vercel/local)
   curl https://your-domain.vercel.app/api/cron
   ```

**Expected Results:**
- ✅ New folder created: `Easy/`, `Medium/`, or `Hard/`
- ✅ New `.py` file with problem solution
- ✅ File contains REAL working Python code (not `pass`)
- ✅ Commit message: `Solve: [NUM]. [TITLE] ([DIFFICULTY])`
- ✅ Code has proper algorithm implementation
- ✅ Includes Time & Space complexity analysis

**Example File:**
```python
# 1. Two Sum
# Difficulty: Easy
# Category: Array
# LeetCode Link: https://leetcode.com/problems/two-sum/

class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        """
        Hash Map approach for O(n) time complexity
        Uses dictionary to store complements
        """
        hashmap = {}
        for i, num in enumerate(nums):
            complement = target - num
            if complement in hashmap:
                return [hashmap[complement], i]
            hashmap[num] = i
        return []
        
# Time Complexity: O(n)
# Space Complexity: O(n)

# Solved: 2026-02-08
```

**Debug Checklist:**
- [ ] Check `leetcode_daily_count` in user_settings (should be < 1)
- [ ] Verify GitHub token is valid
- [ ] Check cron logs for "LeetCode:" messages
- [ ] Ensure repo exists (auto-created if missing)

---

### Test #2: Enterprise Project Generation ✅

**Prerequisites:**
- User with `enterprise` or `owner` plan
- `GEMINI_API_KEY` environment variable set
- GitHub token with repo write access

**Steps:**

#### Step 1: Create Project (UI)
1. Log into dashboard
2. Navigate to Enterprise panel
3. Fill in project details:
   - Project Name: "Test E-commerce"
   - Repo Name: "test-ecommerce" (auto-generated if empty)
   - Tech Stack: "Next.js, TypeScript, Prisma"
   - Description: "A modern e-commerce platform"
4. Click "Start 15-Day Build"

**Expected:**
- ✅ GitHub repo created: `your-username/test-ecommerce`
- ✅ Database entry in `projects` table
- ✅ Dashboard shows project: Day 0/15
- ✅ `active_project_id` set in user_settings

#### Step 2: Wait for Cron (or trigger manually)
```bash
# Trigger cron endpoint
curl https://your-domain.vercel.app/api/cron
```

**Expected After First Run:**
- ✅ Dashboard updates: Day 1/15
- ✅ GitHub repo has new commit
- ✅ Commit message: "Day 1: Setup & Foundation - Add [filename]"
- ✅ File contains AI-generated code (not template)
- ✅ `total_commits` incremented

#### Step 3: Verify AI Generation
Check the committed file:
- ✅ Real code (not TODO/pass)
- ✅ Proper imports
- ✅ Comments explaining code
- ✅ Follows tech stack (TypeScript if specified)

**Example Day 1 File:**
```typescript
// src/config/app.config.ts

export const appConfig = {
  name: "Test E-commerce",
  version: "1.0.0",
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
    timeout: 30000
  },
  database: {
    url: process.env.DATABASE_URL
  }
};

export default appConfig;
```

#### Step 4: Monitor Progress
Each day cron runs:
- Day 1-3: Setup files (config, README, package.json)
- Day 4-7: Core features (models, routes, auth)
- Day 8-12: Advanced (UI components, logic)
- Day 13-15: Polish (tests, docs)

**After Day 15:**
- ✅ Dashboard shows: Day 15/15
- ✅ Status changes to "completed"
- ✅ Total commits = 15 (one per day)

---

## Debugging

### LeetCode Issues

**Problem: No commits appearing**
```sql
-- Check user settings
SELECT 
  github_username, 
  plan_type, 
  leetcode_repo, 
  leetcode_daily_count,
  pause_bot
FROM user_settings 
WHERE id = 'YOUR_USER_ID';
```

**Fixes:**
- Ensure `plan_type` is 'leetcode' or 'owner'
- Set `leetcode_repo` field (e.g., "my-leetcode-solutions")
- Check `leetcode_daily_count` < 1 (resets daily)
- Verify `pause_bot` = false

**Problem: Template code instead of real solutions**
- ❌ OLD: This was the bug (now fixed!)
- ✅ NEW: Should see real algorithm implementations

**Check cron logs:**
```
✅ Good: "LeetCode: Committed Two Sum to username/repo"
❌ Bad: "LeetCode Error: [error message]"
```

---

### Enterprise Issues

**Problem: Project not progressing**
```sql
-- Check project status
SELECT 
  project_name,
  current_day,
  days_duration,
  status,
  total_commits
FROM projects 
WHERE user_id = 'YOUR_USER_ID' 
  AND status = 'in_progress';
```

**Fixes:**
- Ensure `current_day` < `days_duration`
- Check `status` = 'in_progress' (not 'completed')
- Verify GEMINI_API_KEY is set
- Confirm repo exists on GitHub

**Problem: AI generation fails**
Check cron logs for:
```
✅ Good: "Enterprise: ✅ Day 2 committed to username/repo"
⚠️  Fallback: "Enterprise: AI response format error. Using fallback code."
❌ Bad: "Enterprise: AI generation error - [error]"
```

If fallback is used:
- Check GEMINI_API_KEY validity
- Monitor Gemini API quota/limits
- Fallback creates markdown progress files (still functional)

---

## Cron Schedule Check

### Where is it configured?

**Option 1: GitHub Actions**
```yaml
# .github/workflows/cron.yml
schedule:
  - cron: '0 */1 * * *'  # Every hour
```

**Option 2: Vercel Cron**
```json
// vercel.json
{
  "crons": [{
    "path": "/api/cron",
    "schedule": "0 */1 * * *"
  }]
}
```

**Option 3: Manual (for testing)**
```bash
# Local testing
cd dashboard
python3 api/cron.py

# Or via HTTP
curl http://localhost:3000/api/cron
```

---

## Expected Cron Output

### Successful Run (LeetCode)
```
Processing user abc-123 for repo username/auto-contributions
Owner RishitTandon7: Bypassing all limits.
LeetCode Plan: Processing RishitTandon7's LeetCode repo...
Enterprise: Found active project 'Test E-commerce' for RishitTandon7 (Day 5/15)
Enterprise: Generating code for Day 6...
Enterprise: ✅ Day 6 committed to username/test-ecommerce
LeetCode: Committed Two Sum to username/my-leetcode-solutions
```

### Successful Run (Enterprise)
```
Processing user xyz-789 for repo username/auto-contributions
Enterprise: Found active project 'AI Chatbot' for username (Day 3/15)
Enterprise: Generating code for Day 4...
Enterprise: ✅ Day 4 committed to username/ai-chatbot
```

---

## Rollback (If Needed)

If you need to revert these changes:

```bash
# Backup current cron.py
cp dashboard/api/cron.py dashboard/api/cron.py.backup

# Revert to previous version
git log dashboard/api/cron.py  # Find previous commit
git checkout [COMMIT_HASH] dashboard/api/cron.py
```

But you shouldn't need to - the fixes are working! ✅

---

## Support & Logs

### View Real-time Logs

**Vercel:**
```bash
vercel logs --follow
```

**Local:**
```bash
tail -f /var/log/cron.log
```

### Database Queries

**Check LeetCode activity:**
```sql
SELECT 
  created_at,
  language,
  content_snippet 
FROM generated_history 
WHERE user_id = 'YOUR_ID' 
ORDER BY created_at DESC 
LIMIT 10;
```

**Check Enterprise progress:**
```sql
SELECT 
  project_name,
  current_day,
  total_commits,
  status,
  created_at
FROM projects 
ORDER BY created_at DESC;
```

---

## Quick Verification Commands

```bash
# 1. Check environment variables
echo $GEMINI_API_KEY
echo $NEXT_PUBLIC_SUPABASE_URL

# 2. Test GitHub token
curl -H "Authorization: token YOUR_TOKEN" https://api.github.com/user

# 3. Check cron endpoint
curl -X GET https://your-app.vercel.app/api/cron

# 4. View recent commits
gh repo view username/leetcode-solutions --web
gh repo view username/test-ecommerce --web
```

---

## Success Indicators

### LeetCode Feature ✅
- [ ] Repo has `Easy/`, `Medium/`, `Hard/` folders
- [ ] Python files with REAL working code
- [ ] No `pass` statements in solutions
- [ ] Complexity analysis included
- [ ] Professional commit messages

### Enterprise Feature ✅
- [ ] Dashboard shows incrementing day counter
- [ ] GitHub repo has daily commits
- [ ] AI-generated code (not templates)
- [ ] Follows specified tech stack
- [ ] Project completes after 15 days

---

**Happy Testing! 🚀**

If you encounter issues, check:
1. Cron logs
2. Database entries
3. GitHub tokens
4. Environment variables
