# ⏰ Cron Schedule Examples - GitHub Actions

## Common Schedules (Copy & Paste Ready!)

### Every X Minutes
```yaml
# Every 15 minutes (RECOMMENDED for GitMaxer)
schedule:
  - cron: '*/15 * * * *'

# Every 30 minutes
schedule:
  - cron: '*/30 * * * *'

# Every 5 minutes (very frequent!)
schedule:
  - cron: '*/5 * * * *'
```

### Hourly
```yaml
# Every hour
schedule:
  - cron: '0 * * * *'

# Every 2 hours
schedule:
  - cron: '0 */2 * * *'

# Every 6 hours (4 times a day)
schedule:
  - cron: '0 */6 * * *'
```

### Daily Schedules
```yaml
# Every day at midnight UTC
schedule:
  - cron: '0 0 * * *'

# Every day at 6 AM UTC
schedule:
  - cron: '0 6 * * *'

# Every day at midnight IST (18:30 UTC)
schedule:
  - cron: '30 18 * * *'

# Every day at 3 PM IST (9:30 UTC)
schedule:
  - cron: '30 9 * * *'
```

### Multiple Times Per Day
```yaml
# Twice a day: 9 AM and 9 PM UTC
schedule:
  - cron: '0 9,21 * * *'

# Four times: midnight, 6AM, noon, 6PM UTC
schedule:
  - cron: '0 0,6,12,18 * * *'

# Every 4 hours
schedule:
  - cron: '0 */4 * * *'
```

### Weekly
```yaml
# Every Monday at 9 AM UTC
schedule:
  - cron: '0 9 * * 1'

# Every Sunday at midnight
schedule:
  - cron: '0 0 * * 0'

# Monday through Friday at 9 AM (weekdays only)
schedule:
  - cron: '0 9 * * 1-5'
```

### Monthly
```yaml
# First day of every month at midnight
schedule:
  - cron: '0 0 1 * *'

# 15th of every month at noon
schedule:
  - cron: '0 12 15 * *'

# Last day of month (use Day 28-31 carefully)
schedule:
  - cron: '0 0 28-31 * *'
```

---

## 🌍 Timezone Conversion (IST to UTC)

GitHub Actions uses **UTC** timezone. Convert IST (India Standard Time = UTC+5:30):

| IST Time | UTC Time | Cron Expression |
|----------|----------|-----------------|
| 12:00 AM | 6:30 PM prev day | `30 18 * * *` |
| 1:00 AM | 7:30 PM prev day | `30 19 * * *` |
| 6:00 AM | 12:30 AM | `30 0 * * *` |
| 12:00 PM | 6:30 AM | `30 6 * * *` |
| 6:00 PM | 12:30 PM | `30 12 * * *` |
| 11:00 PM | 5:30 PM | `30 17 * * *` |

**Formula**: IST - 5 hours 30 minutes = UTC

---

## 📋 Recommended Schedules for GitMaxer

### Conservative (Battery Friendly)
```yaml
# Once every hour
schedule:
  - cron: '0 * * * *'
```

### Balanced (Recommended)
```yaml
# Every 15 minutes
schedule:
  - cron: '*/15 * * * *'
```

### Aggressive (Maximum Coverage)
```yaml
# Every 5 minutes
schedule:
  - cron: '*/5 * * * *'
```

### Peak Hours Only (9 AM - 11 PM IST)
```yaml
# Every 15 min during peak hours (3:30 AM - 5:30 PM UTC)
schedule:
  - cron: '*/15 3-17 * * *'
```

---

## 🎯 Multiple Workflows Strategy

Create different workflows for different user tiers:

### `free-users.yml`
```yaml
name: Free Tier Bot
on:
  schedule:
    - cron: '0 18 * * 0'  # Once a week, Sunday midnight IST
```

### `pro-users.yml`
```yaml
name: Pro Tier Bot
on:
  schedule:
    - cron: '0 */8 * * *'  # Every 8 hours (3 times daily)
```

### `enterprise-users.yml`
```yaml
name: Enterprise Tier Bot
on:
  schedule:
    - cron: '*/15 * * * *'  # Every 15 minutes
```

---

## 🔧 Cron Syntax Reference

```
 ┌───────────── minute (0 - 59)
 │ ┌───────────── hour (0 - 23)
 │ │ ┌───────────── day of month (1 - 31)
 │ │ │ ┌───────────── month (1 - 12 or JAN-DEC)
 │ │ │ │ ┌───────────── day of week (0 - 6 or SUN-SAT)
 │ │ │ │ │
 * * * * *
```

### Special Characters:
- `*` = Any value
- `*/15` = Every 15 units
- `5,10,15` = At 5, 10, and 15
- `5-10` = From 5 to 10
- `0-23/2` = Every 2 hours

---

## 🧪 Test Your Cron Expression

Use these tools:
- **[crontab.guru](https://crontab.guru)** - Visual cron editor
- **[crontab-generator.org](https://crontab-generator.org)** - Generate expressions

---

## 💡 Pro Tips

### 1. Stagger Multiple Workflows
Instead of all running at `:00`, stagger them:
```yaml
# Workflow 1
- cron: '0 * * * *'   # On the hour

# Workflow 2  
- cron: '15 * * * *'  # 15 minutes past

# Workflow 3
- cron: '30 * * * *'  # 30 minutes past
```

### 2. Avoid Peak Times
Don't hammer GitHub at midnight UTC (popular time):
```yaml
# Instead of 0 0 * * * (midnight)
# Use 7 0 * * * (12:07 AM)
```

### 3. Use Randomization
Add minute offset to avoid collisions:
```yaml
# Not just every 15 min
- cron: '*/15 * * * *'

# But offset slightly
- cron: '3,18,33,48 * * * *'  # Every 15 min starting at :03
```

---

## 🎮 Example: Complete Setup

File: `.github/workflows/smart-schedule.yml`

```yaml
name: Smart GitMaxer Schedule

on:
  # Morning rush (6 AM - 12 PM IST = 12:30 AM - 6:30 AM UTC)
  schedule:
    - cron: '*/10 0-6 * * *'  # Every 10 min
  
  # Afternoon (12 PM - 6 PM IST = 6:30 AM - 12:30 PM UTC)
  schedule:
    - cron: '*/20 6-12 * * *'  # Every 20 min
  
  # Evening (6 PM - 12 AM IST = 12:30 PM - 6:30 PM UTC)
  schedule:
    - cron: '*/15 12-18 * * *'  # Every 15 min
  
  # Night (12 AM - 6 AM IST = 6:30 PM - 12:30 AM UTC)
  schedule:
    - cron: '0 19-23,0 * * *'  # Once an hour (less active)
  
  # Manual trigger always available
  workflow_dispatch:

jobs:
  smart-bot:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Bot
        run: |
          echo "Running at $(date)"
          # Your cron logic here
```

---

## 🚀 Quick Copy-Paste Templates

### Template 1: Simple 15-Minute
```yaml
name: My Cron Job
on:
  schedule:
    - cron: '*/15 * * * *'
  workflow_dispatch:
jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - run: echo "Running!"
```

### Template 2: Daily at Specific Time
```yaml
name: Daily at Midnight IST
on:
  schedule:
    - cron: '30 18 * * *'  # 12 AM IST
  workflow_dispatch:
jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - run: echo "Daily run!"
```

### Template 3: Multiple Times
```yaml
name: Multiple Schedules
on:
  schedule:
    - cron: '0 6 * * *'    # 6 AM UTC
    - cron: '0 12 * * *'   # Noon UTC
    - cron: '0 18 * * *'   # 6 PM UTC
  workflow_dispatch:
jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - run: echo "Multi-schedule!"
```

---

## ✅ Validation Checklist

Before deploying your cron:
- [ ] Verified timezone (UTC vs IST)
- [ ] Tested expression on crontab.guru
- [ ] Added `workflow_dispatch` for manual testing
- [ ] Set reasonable frequency (not too aggressive)
- [ ] Added timeout limits
- [ ] Configured secrets properly

---

**Need help?** Check `GITHUB_ACTIONS_SETUP.md` for full guide!

**Developed by Rishit Tandon** ⏰
