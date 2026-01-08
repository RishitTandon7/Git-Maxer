# 🔧 Vercel Environment Variables Checklist

## ⚠️ Login Issue Fix

**Problem**: Supabase connection timeout preventing login  
**Solution**: Added timeout handling + verify environment variables

---

## ✅ Required Environment Variables

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

### 1. **Supabase Variables** (CRITICAL for login)

| Variable Name | Where to Find | Required |
|---------------|---------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API | ✅ YES |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API (anon/public key) | ✅ YES |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API (service_role secret) | ✅ YES |

### 2. **GitHub OAuth Variables** (For GitHub login)

| Variable Name | Where to Find | Required |
|---------------|---------------|----------|
| `GITHUB_CLIENT_ID` | GitHub OAuth App settings | ✅ YES |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App settings | ✅ YES |

### 3. **Razorpay Variables** (For payments)

| Variable Name | Where to Find | Required |
|---------------|---------------|----------|
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay Dashboard | ✅ YES |
| `RAZORPAY_KEY_SECRET` | Razorpay Dashboard | ✅ YES |

### 4. **AI/Bot Variables** (For code generation)

| Variable Name | Where to Find | Required |
|---------------|---------------|----------|
| `GEMINI_API_KEY` | Google AI Studio | ✅ YES |

### 5. **Cron Security** (NEW - for GitHub Actions)

| Variable Name | Value | Required |
|---------------|-------|----------|
| `CRON_SECRET` | `2FRjASalo8wOvyx69WNKGPcYDVp3sJtZ` | ✅ YES |

---

## 🔍 How to Check Your Supabase URL

1. Go to: https://supabase.com/dashboard/project/_/settings/api
2. Copy **Project URL** (looks like: `https://xxxxx.supabase.co`)
3. Copy **anon public** key (long string starting with `eyJ...`)
4. Copy **service_role** key (long string starting with `eyJ...`)

---

## 🚨 Common Mistakes

### ❌ Wrong:
- Using placeholder values
- Missing `https://` in SUPABASE_URL
- Using the wrong key (project key vs anon key)
- Environment variables not set for all environments

### ✅ Correct:
- Real Supabase URL: `https://abcdefgh.supabase.co`
- Real anon key: `eyJhbGciOiJIUzI1NiIsInR...`
- Variables set for: Production, Preview, Development

---

## 🔄 After Updating Variables

1. **Redeploy** your project in Vercel
2. **Wait** 1-2 minutes for deployment
3. **Clear browser cache** and try logging in again
4. Check **Function Logs** in Vercel for any errors

---

## 🧪 Test Your Setup

### Test 1: Check if Variables Are Loaded
Add this to any API route temporarily:
```typescript
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20))
console.log('Has Anon Key:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
```

### Test 2: Direct Supabase Connection
```bash
curl https://YOUR-PROJECT.supabase.co/rest/v1/ \
  -H "apikey: YOUR-ANON-KEY"
```
Should return: `{"message":"Welcome to PostgREST"}`

---

## 🆘 Still Getting Timeout?

### Check These:

1. **Supabase Project Status**
   - Go to Supabase Dashboard
   - Check if project is paused or has issues
   - Verify it's on a paid plan if needed

2. **Network/Firewall**
   - Vercel might be blocked from accessing Supabase
   - Check Supabase logs for connection attempts

3. **Environment Variables**
   - Verify they're set for **ALL** environments
   - No trailing spaces or quote marks
   - Redeploy after adding them

4. **Middleware Logs**
   - Check Vercel Function Logs for middleware errors
   - Look for "Middleware auth check error" messages

---

## 📝 Quick Fix Command

If you need to update all environment variables at once, use Vercel CLI:

```bash
vercel env pull .env.local
# Edit .env.local with correct values
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add CRON_SECRET
# ... add others
```

---

## ✅ Expected Behavior After Fix

1. ✅ Login page loads quickly (no timeout)
2. ✅ GitHub OAuth redirects properly
3. ✅ Dashboard accessible after login
4. ✅ No "Supabase Connection Timeout" errors

---

**Need Help?** Check Vercel Function Logs:
- Vercel Dashboard → Deployments → [Latest] → Functions → View Logs

**Developed by Rishit Tandon** 🔧
