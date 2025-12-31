# Razorpay Payment Gateway Setup

## 🔐 Environment Variables

Add these variables to your `.env.local` file:

```bash
# Razorpay Live Credentials
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_Rxq9o4Kicc1f3V
RAZORPAY_KEY_SECRET=6njwAIIYZ5xw1HBm5l9Zu75D
```

## 📋 Complete `.env.local` File

Make sure your `.env.local` file contains all these variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Razorpay Configuration (LIVE)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_Rxq9o4Kicc1f3V
RAZORPAY_KEY_SECRET=6njwAIIYZ5xw1HBm5l9Zu75D

# GitHub OAuth (if using)
GITHUB_PAT=your_github_personal_access_token

# Backend API URL
BACKEND_API_URL=your_backend_api_url
```

## 🚀 Quick Payment Link

Your Razorpay payment link: https://razorpay.me/@rishittandon

## ✅ Setup Steps

1. **Update Environment Variables**
   - Open `.env.local` in your dashboard folder
   - Add the Razorpay credentials shown above
   - Save the file

2. **Restart Development Server**
   ```bash
   npm run dev
   ```

3. **Test Payment Flow**
   - Navigate to `/pricing` page
   - Click "Upgrade to Pro" or "Get Enterprise"
   - Complete payment using Razorpay checkout
   - Payment will be verified and user plan will be updated

## 📊 Database Setup (if not done)

Make sure you have a `payments` table in Supabase:

```sql
CREATE TABLE payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    order_id TEXT NOT NULL,
    payment_id TEXT NOT NULL,
    amount INTEGER NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔍 API Routes

- **Create Order**: `/api/razorpay/order` - Creates a new Razorpay order
- **Verify Payment**: `/api/razorpay/verify` - Verifies payment signature and updates user plan

## 🎨 Integration Points

- **Pricing Page**: `/app/pricing/page.tsx` - Displays plans with payment buttons
- **Dashboard**: Payment status can be shown in dashboard

## 📝 Notes

- Using LIVE credentials (not test mode)
- Amounts are in paise (₹30 = 3000 paise, ₹90 = 9000 paise)
- Payment verification uses SHA256 HMAC signature
- User plan updates happen after successful payment verification
