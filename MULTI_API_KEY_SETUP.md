# 🔑 Multi-API-Key Setup Guide for GitMaxer

## 🎯 What's New

Your bot now supports:
- ✅ **Multiple Gemini API keys** (unlimited rotation)
- ✅ **5 Different Gemini models** (automatic fallback)
- ✅ **Smart retry system** (tries all combinations)
- ✅ **Zero downtime** (if one fails, tries next)

---

## 🚀 How It Works

### **Rotation Strategy:**

```
User 1 → API Key 1 + gemini-2.0-flash-exp
User 2 → API Key 1 + gemini-1.5-flash-latest
User 3 → API Key 1 + gemini-1.5-pro-latest
User 4 → API Key 1 + gemini-1.5-flash
User 5 → API Key 1 + gemini-pro
User 6 → API Key 2 + gemini-2.0-flash-exp (starts rotating keys)
...
```

### **If Error Occurs:**
```
Try gemini-2.0-flash-exp → 404 Error
  ↓
Try gemini-1.5-flash-latest → Success! ✅
```

---

## ⚙️ Setup Instructions

### **Step 1: Get Multiple Gemini API Keys**

1. Go to: https://aistudio.google.com/app/apikey
2. Click **"Create API Key"**
3. Repeat 3-5 times (use different Google accounts if needed)
4. Copy all your API keys

### **Step 2: Add to Vercel Environment Variables**

Go to: **Vercel Dashboard → Project → Settings → Environment Variables**

Add these variables:

| Variable Name | Value | Description |
|---------------|-------|-------------|
| `GEMINI_API_KEY` | `AIzaSy...` | Primary key (already set) |
| `GEMINI_API_KEY_2` | `AIzaSy...` | Second key |
| `GEMINI_API_KEY_3` | `AIzaSy...` | Third key |
| `GEMINI_API_KEY_4` | `AIzaSy...` | Fourth key (optional) |
| `GEMINI_API_KEY_5` | `AIzaSy...` | Fifth key (optional) |

**You can add up to 10 keys** (`GEMINI_API_KEY_2` through `GEMINI_API_KEY_10`)

---

## 🎨 Available Models (Ordered by Preference)

| Model | Description | Best For |
|-------|-------------|----------|
| `gemini-2.0-flash-exp` | Latest experimental | Speed & quality |
| `gemini-1.5-flash-latest` | Stable latest | Reliability |
| `gemini-1.5-pro-latest` | Most capable | Complex code |
| `gemini-1.5-flash` | Standard flash | Fallback |
| `gemini-pro` | Legacy | Ultimate fallback |

The system automatically tries each in order!

---

## 📊 Example Scenario

**With 3 API keys + 5 models = 15 total attempts before failure!**

```
Attempt 1: Key 1 + gemini-2.0-flash-exp → 404 (model not found)
Attempt 2: Key 1 + gemini-1.5-flash-latest → SUCCESS! ✅
```

**Benefits:**
- Never get rate-limited (switches keys automatically)
- Works even if some models are unavailable
- Spreads load across multiple API quotas

---

## 🔧 Testing Your Setup

### **Quick Test (Local):**

```python
from utils.content_generator import get_random_content

# Test with rotation
code = get_random_content(language='python')
print(code)
```

### **Test via API:**

Visit: `https://your-app.vercel.app/api/test-bot` (POST request)

Check logs for:
```
⚠️ Model gemini-2.0-flash-exp not available, trying next...
✅ Successfully generated with gemini-1.5-flash-latest
```

---

## 📋 Current API Status

After adding keys, check which ones work:

```bash
# Test each key manually
curl https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_API_KEY
```

**Expected response:**
```json
{
  "models": [
    {"name": "models/gemini-1.5-flash-latest"},
    {"name": "models/gemini-1.5-pro-latest"},
    ...
  ]
}
```

---

## 🎯 Error Messages Explained

### **404 Model Not Found**
```
Error: 404 models/gemini-1.5-flash is not found for API version v1beta
```
**Solution**: System automatically tries next model ✅

### **429 Quota Exceeded**
```
Error: 429 Resource has been exhausted (e.g. check quota)
```
**Solution**: System rotates to next API key ✅

### **403 Permission Denied**
```
Error: 403 API key not valid
```
**Solution**: That key is skipped, tries next ✅

---

## ✅ Deployment Steps

### **1. Update Code** (Already done!)
```bash
cd f:\automatic contri\dashboard
git add utils/content_generator.py
git commit -m "feat: Add multi-API-key rotation with fallback models"
git push origin main
```

### **2. Add Environment Variables** (Vercel)
- Add `GEMINI_API_KEY_2`, `GEMINI_API_KEY_3`, etc.
- Make sure all are set for "Production, Preview, Development"

### **3. Redeploy**
- Vercel auto-deploys on push
- Or manually trigger deployment

### **4. Test**
- Visit `/api/cron` or trigger test bot
- Check logs for successful generation

---

## 🔥 Pro Tips

### **Get More API Keys:**
1. Use multiple Google accounts
2. Each account gets separate quota
3. Free tier = 15 RPM per key
4. With 5 keys = 75 RPM total! 🚀

### **Monitor Usage:**
- Check Google AI Studio dashboard for each key
- See which keys are hitting limits
- Add more keys as needed

### **Optimize Rotation:**
Models are tried in this order:
1. `gemini-2.0-flash-exp` (fastest, but experimental)
2. `gemini-1.5-flash-latest` (recommended default)
3. `gemini-1.5-pro-latest` (if you need quality)
4. Fallbacks...

---

## 📊 Expected Results

**Before (Single Key):**
```
✅ User 1: Success
✅ User 2: Success
❌ User 3: 429 Quota exceeded (stops here)
❌ User 4: Skipped
❌ User 5: Skipped
```

**After (Multi-Key):**
```
✅ User 1: Key 1 + Model 1
✅ User 2: Key 1 + Model 2
✅ User 3: Key 1 + Model 3 (would have failed before)
✅ User 4: Key 1 + Model 4
✅ User 5: Key 1 + Model 5
✅ User 6: Key 2 + Model 1 (rotates to next key)
✅ User 7: Key 2 + Model 2
... (continues for all users!)
```

---

## 🎉 Summary

**Your GitMaxer bot now has:**
- ✅ Multi-API-key rotation (up to 10 keys)
- ✅ Multi-model fallback (5 models)
- ✅ Automatic retry (tries all combinations)
- ✅ Zero downtime (one fails, next succeeds)

**Next Steps:**
1. Add 2-5 Gemini API keys to Vercel
2. Push the updated code
3. Wait for deployment
4. Test with `/api/cron`
5. Watch all users get commits! 🟩

---

**Developed by Rishit Tandon** 🚀
