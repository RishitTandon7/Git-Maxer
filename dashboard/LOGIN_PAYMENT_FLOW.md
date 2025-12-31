# 🔐 AUTHENTICATION & PAYMENT FLOW

## ✅ How Users Login Before Payment

You're absolutely right! Users **MUST login first** before they can make payments. Here's the complete flow:

---

## 📋 **Complete User Journey:**

### Step 1: User Visits Homepage
**URL:** http://localhost:3000

**What they see:**
- Landing page with "Keep your streak alive forever"
- Two login buttons:
  - **"Continue with GitHub"** (Primary - needs repo access)
  - **"Continue with Google"** (Alternative)

### Step 2: User Logs In
**Options:**
1. **GitHub OAuth** (Recommended)
   - Grants repo access for auto-commits
   - Required for the bot to work
   
2. **Google OAuth** (Alternative)
   - For users who prefer Google login
   - Still need to connect GitHub later for bot functionality

### Step 3: First-Time Setup
After login, users are redirected to **`/setup`** where they configure:
- GitHub username
- Target repository name
- Repository visibility (public/private)
- Preferred programming language
- Daily commit time (optional)

### Step 4: Access Dashboard
Now logged in, users can access **`/dashboard`** where they see:
- Bot status (active/paused)
- Contribution stats
- Recent activity
- Settings

### Step 5: Upgrade to Paid Plan
**Users navigate to:** `/pricing`

**What happens:**
- Login status is checked (using Supabase session)
- If logged in: Payment button works
- If NOT logged in: Need to login first

**Payment process:**
1. Click "Upgrade to Pro" (₹30) or "Get Enterprise" (₹90)
2. Razorpay checkout opens (user details pre-filled from session)
3. Complete payment
4. Database updated: `plan_type = 'pro'/'enterprise'`
5. Redirected to `/dashboard` with new theme!

---

## 🚀 **Testing the Complete Flow:**

### For a NEW User:

```
1. Go to: http://localhost:3000
   👉 Click "Continue with GitHub" or "Continue with Google"
   
2. Authorize OAuth
   👉 Grant permissions to the app
   
3. Redirected to: /setup
   👉 Enter your GitHub username
   👉 Configure your settings
   👉 Click "Start Bot"
   
4. Now at: /dashboard
   👉 See your free plan dashboard
   
5. Navigate to: /pricing (or click nav link)
   👉 Click "Upgrade to Pro"
   👉 Complete Razorpay payment
   
6. Back at: /dashboard
   👉 See your new GOLD theme! ⭐
   👉 "PRO" badge visible
```

---

## 🔒 **Authentication Details:**

### How It Works:
- **Supabase Auth** manages sessions
- **OAuth providers:** GitHub, Google
- **Session stored in:** Browser cookies
- **Protected routes:** Dashboard, Pricing (payment requires auth)

### Session Check:
The pricing page checks if user is logged in:
```typescript
const { user: sessionUser } = useAuth()

// If logged in:
- Payment buttons work
- User info pre-filled in Razorpay

// If NOT logged in:
- Still see pricing info
- But need to login to purchase
```

---

## 🎯 **Current User Flow States:**

### State 1: Anonymous Visitor
- See homepage
- See pricing page
- **CANNOT** make payment
- **Action:** Must login first

### State 2: Logged In (Free)
- Access dashboard
- Bot works (1 commit/week)
- **CAN** upgrade to Pro/Enterprise
- **Action:** Go to /pricing to upgrade

### State 3: Logged In (Pro)  
- Access dashboard with GOLD theme ⭐
- Bot works (3 commits/day)
- See "PRO" badge
- **Status:** Premium user!

### State 4: Logged In (Enterprise)
- Access dashboard with BLUE theme 💼
- Bot works (Project mode)
- See "ENTERPRISE" badge
- **Status:** Top tier user!

---

## 📱 **Quick Test Login:**

### If You're NOT Logged In:

1. **Visit:** http://localhost:3000
2. **Click:** "Continue with GitHub" (or Google)
3. **Authorize** the OAuth app
4. **Complete** /setup if first time
5. **Now** you can purchase plans!

### If You're Already Logged In:

1. **Visit:** http://localhost:3000/pricing directly
2. **Click:** "Upgrade to Pro"
3. **Pay** and enjoy!

---

## 🔐 **Security Flow:**

```
User Login (OAuth)
       ↓
Supabase creates session
       ↓
Session stored in cookies
       ↓
Protected routes check session
       ↓
Pricing page: user authenticated ✓
       ↓
Payment: user_id attached to transaction
       ↓
Database: plan updated for that user_id
       ↓
Dashboard: shows new plan theme
```

---

## ⚠️ **Important Notes:**

### You NEED to Login to:
- ✅ Configure the bot (/setup)
- ✅ Access dashboard (/dashboard)
- ✅ Make payments (/pricing)
- ✅ See your contribution history

### You DON'T NEED Login to:
- ✅ View homepage
- ✅ View pricing (but can't purchase)
- ✅ View features page

---

## 🎯 **Test Right Now:**

### Quick Login Test:

1. **Open:** http://localhost:3000
2. **Check:** Are you logged in?
   - If YES: You'll see "View Dashboard" button
   - If NO: You'll see "Sign In" and "Sign Up" buttons

3. **If not logged in:**
   - Click "Continue with GitHub"
   - Complete OAuth
   - You're now logged in!

4. **Then:**
   - Go to /pricing
   - Click "Upgrade to Pro"
   - Payment will work! (user session active)

---

## 🚀 **Summary:**

**YES, login is required for payment!**

The flow is:
1. **Login** (GitHub/Google OAuth)
2. **Setup** bot configuration
3. **Dashboard** access (free plan)
4. **Upgrade** on pricing page (payment)
5. **Dashboard** with new theme (paid plan)

**Your server is running: http://localhost:3000**

**Try logging in now!** 🔐
