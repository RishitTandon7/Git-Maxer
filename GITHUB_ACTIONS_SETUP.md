# 🚀 GitHub Actions Cron Setup Guide

## Why GitHub Actions?

✅ **100% FREE** unlimited cron jobs  
✅ **No Vercel limitations** (Vercel Hobby = 1 cron only)  
✅ **Better reliability** - runs every 15 minutes if needed  
✅ **Multiple workflows** - different schedules for different tasks  
✅ **Built-in GitHub authentication**  
✅ **Better logging** and monitoring  

---

## 🎯 What We've Set Up

### 1️⃣ **Main Bot Runner** (`auto-commit-cron.yml`)
- ⏰ **Runs every 15 minutes**
- 🤖 Triggers all active users
- 📊 Best for frequent commits

### 2️⃣ **Hourly Check** (`hourly-commit.yml`)
- ⏰ **Runs every hour**
- 🔍 Good for less aggressive scheduling
- ⚡ Lighter load on your API

### 3️⃣ **Daily Premium** (`daily-premium.yml`)
- ⏰ **Runs once daily at midnight IST**
- 💎 Processes premium users
- 🌟 Enterprise features

---

## 📝 Setup Instructions

### Step 1: Add GitHub Secrets

Go to your GitHub repository:  
`Settings` → `Secrets and variables` → `Actions` → `New repository secret`

Add these secrets:

#### **CRON_SECRET**
```
your-secure-random-string-here
```
*This protects your API from unauthorized access*

#### **VERCEL_CRON_URL**
```
https://your-app.vercel.app/api/cron
```
*Your Vercel deployment URL + `/api/cron`*

### Step 2: Update Your `.env.local`

Add the same CRON_SECRET to your Vercel environment:

```env
CRON_SECRET=your-secure-random-string-here
```

### Step 3: Deploy to Vercel

Add the secret in Vercel dashboard:
1. Go to your project settings
2. Environment Variables
3. Add `CRON_SECRET` with the same value

### Step 4: Push to GitHub

```bash
git add .github/workflows/
git commit -m "feat: Add GitHub Actions cron workflows"
git push origin main
```

✅ **Done!** Your cron jobs will start running automatically!

---

## 🔥 Advantages Over Vercel Cron

| Feature | Vercel (Hobby) | GitHub Actions |
|---------|----------------|----------------|
| **Number of Crons** | 1 only | Unlimited FREE |
| **Frequency** | Once per day | Every minute if needed |
| **Cost** | FREE (limited) | 100% FREE |
| **Reliability** | Good | Excellent |
| **Logs** | Limited | Full workflow logs |
| **Manual Trigger** | No | Yes (workflow_dispatch) |

---

## 🎛️ Customizing Schedules

### Cron Syntax Examples:

```yaml
# Every 15 minutes
schedule:
  - cron: '*/15 * * * *'

# Every hour
schedule:
  - cron: '0 * * * *'

# Every day at 3 AM UTC
schedule:
  - cron: '0 3 * * *'

# Every Monday at 9 AM
schedule:
  - cron: '0 9 * * 1'

# Multiple times per day
schedule:
  - cron: '0 0,6,12,18 * * *'  # 4 times: midnight, 6AM, noon, 6PM
```

---

## 🧪 Testing Your Workflows

### Manual Trigger:
1. Go to **Actions** tab in your GitHub repo
2. Select a workflow (e.g., "GitMaxer Auto Commit Bot")
3. Click **"Run workflow"** → **"Run workflow"**
4. Check the logs in real-time!

### Check Logs:
- Click on any workflow run
- See detailed execution logs
- Debug any issues easily

---

## 🔐 Security Best Practices

1. ✅ **Always use secrets** - Never hardcode URLs or tokens
2. ✅ **Verify requests** - Check `Authorization` header in your API
3. ✅ **Rate limiting** - GitHub Actions has generous limits, but be reasonable
4. ✅ **Monitor usage** - Check Actions tab for failed runs

---

## 🚨 Troubleshooting

### Workflow not running?
- Check if Actions are enabled: `Settings` → `Actions` → `General`
- Verify cron syntax: Use [crontab.guru](https://crontab.guru)

### 401 Unauthorized?
- Double-check `CRON_SECRET` matches in both GitHub and Vercel
- Ensure `VERCEL_CRON_URL` is correct

### Timeout errors?
- Increase `timeout-minutes` in workflow file
- Optimize your bot logic in `api/cron.py`

---

## 🎉 Next Steps

Now you have **3 free cron jobs** running:
1. ✅ Every 15 minutes (main bot)
2. ✅ Every hour (lighter check)
3. ✅ Daily at midnight (premium users)

**Want more?** Just duplicate a workflow file and change the schedule! No limits! 🚀

---

## 💡 Pro Tips

### Use Different Endpoints
Instead of calling the same `/api/cron`, you can create:
- `/api/cron/premium` - For premium users only
- `/api/cron/enterprise` - For enterprise features
- `/api/cron/cleanup` - Daily maintenance

### Add Notifications
Use GitHub Actions to send Slack/Discord notifications:
```yaml
- name: Notify on failure
  if: failure()
  run: |
    curl -X POST ${{ secrets.DISCORD_WEBHOOK }} \
      -d '{"content": "⚠️ Cron job failed!"}'
```

### Monitor Performance
Add timing logs:
```yaml
- name: Record execution time
  run: |
    START_TIME=$(date +%s)
    # ... your curl command ...
    END_TIME=$(date +%s)
    echo "⏱️ Execution took $((END_TIME - START_TIME)) seconds"
```

---

**Developed by Rishit Tandon** 🚀
