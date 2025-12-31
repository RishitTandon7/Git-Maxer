# ===================================
# RAZORPAY INTEGRATION - SETUP GUIDE
# ===================================

## 🚀 QUICK START

### Step 1: Update Environment Variables

You need to add the Razorpay credentials to your `.env.local` file.

**Open the file:** `f:\automatic contri\dashboard\.env.local`

**Add these lines:**
```
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_Rxq9o4Kicc1f3V
RAZORPAY_KEY_SECRET=6njwAIIYZ5xw1HBm5l9Zu75D
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**Note:** Make sure you also have these existing variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### Step 2: Restart the Development Server

After adding the environment variables, restart your dev server:

```powershell
# Stop the current server (Ctrl+C)
# Then restart:
cd "f:\automatic contri\dashboard"
npm run dev
```

### Step 3: Test the Payment Flow

1. **Navigate to** `http://localhost:3000/pricing`
2. **Click** "Upgrade to Pro" (₹30) or "Get Enterprise" (₹90)
3. **Complete payment** using any of these test cards (if in test mode) or real card (LIVE mode):
   - **Test Card:** 4111 1111 1111 1111
   - **CVV:** Any 3 digits
   - **Expiry:** Any future date

4. **After successful payment:**
   - User will be redirected to `/dashboard`
   - User's plan will be updated in `user_settings` table
   - Payment record will be stored in `payments` table

---

## 📊 DATABASE SCHEMA

Make sure your Supabase database has these tables:

### `user_settings` Table
```sql
-- Should already exist, but verify it has these columns:
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS plan_expiry TIMESTAMP WITH TIME ZONE;
```

### `payments` Table  
```sql
-- Should already exist from supabase_schema.sql
-- Verify it exists:
SELECT * FROM payments LIMIT 1;
```

---

## 🔍 API ENDPOINTS

### 1. Create Order
**Endpoint:** `POST /api/razorpay/order`
**Request Body:**
```json
{
  "amount": 3000,  // 3000 = ₹30, 9000 = ₹90 (in paise)
  "plan": "pro"    // or "enterprise"
}
```

**Response:**
```json
{
  "id": "order_xxxxx",
  "amount": 3000,
  "currency": "INR"
}
```

### 2. Verify Payment
**Endpoint:** `POST /api/razorpay/verify`
**Request Body:**
```json
{
  "razorpay_payment_id": "pay_xxxxx",
  "razorpay_order_id": "order_xxxxx",
  "razorpay_signature": "signature_xxxxx",
  "plan": "pro"
}
```

**Response:**
```json
{
  "success": true,
  "plan": "pro",
  "expiry": "2025-01-30T..."
}
```

---

## 🎨 INTEGRATION POINTS

### Frontend:
- **Pricing Page:** `/app/pricing/page.tsx` ✅ UPDATED
- **Payment Button Handlers:** Already integrated
- **Razorpay Checkout Script:** Loaded via Next.js Script component

### Backend:
- **Order Creation:** `/app/api/razorpay/order/route.ts` ✅ READY
- **Payment Verification:** `/app/api/razorpay/verify/route.ts` ✅ UPDATED

---

## ✨ FEATURES IMPLEMENTED

✅ **Live Razorpay Integration**
   - Live key: `rzp_live_Rxq9o4Kicc1f3V`
   - Hardcoded in pricing page for reliability

✅ **Payment Plans**
   - Pro: ₹30/month (3 commits/day)
   - Enterprise: ₹90/month (Project mode, 15 days)

✅ **Security**
   - HMAC SHA256 signature verification
   - User authentication via Supabase cookies
   - Service role for database updates

✅ **User Experience**
   - Pre-filled user info in checkout
   - Plan-specific theme colors (Gold for Pro, Blue for Enterprise)
   - Success/failure alerts
   - Auto-redirect to dashboard

✅ **Database Updates**
   - User plan updated to 'pro' or 'enterprise'
   - Plan expiry set to 30 days from payment
   - Payment logged with user_id, order_id, payment_id

---

## 🔐 SECURITY NOTES

1. **Environment Variables:** 
   - NEVER commit `.env.local` to git
   - Already protected by `.gitignore`

2. **API Keys:**
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID` is safe to expose (public key)
   - `RAZORPAY_KEY_SECRET` must stay server-side only ✅

3. **Payment Verification:**
   - Signature verification prevents tampering
   - User authenticated via session cookies
   - Service client bypasses RLS for admin updates

---

## 📱 QUICK PAYMENT LINK

Your direct payment link (for external use):
**https://razorpay.me/@rishittandon**

This can be shared anywhere for quick payments.

---

## 🐛 TROUBLESHOOTING

### Error: "Razorpay is not defined"
**Solution:** Make sure the Razorpay script is loaded:
```tsx
<Script src="https://checkout.razorpay.com/v1/checkout.js" />
```
Already added in `/app/pricing/page.tsx` ✅

### Error: "Failed to create order"
**Solution:** 
1. Check if `RAZORPAY_KEY_SECRET` is in `.env.local`
2. Restart dev server
3. Check console for errors

### Error: "User not authenticated"
**Solution:**
1. Make sure you're logged in
2. Check Supabase session is active
3. Clear cookies and re-login

### Payment succeeds but plan not updated
**Solution:**
1. Check Supabase logs
2. Verify `user_settings` table has `plan_type` column
3. Check `SUPABASE_SERVICE_ROLE_KEY` is correct

---

## 📈 TESTING CHECKLIST

- [ ] Pro plan purchase (₹30)
- [ ] Enterprise plan purchase (₹90)
- [ ] Payment verification
- [ ] Database update (user_settings.plan_type)
- [ ] Payment logging (payments table)
- [ ] Redirect to dashboard
- [ ] Plan expiry calculation

---

## 🎯 NEXT STEPS

1. **Add Plan Badge to Dashboard** - Show user's current plan
2. **Plan Expiry Check** - Cron job to downgrade expired plans
3. **Payment History** - Show past payments in dashboard
4. **Webhook Integration** - Handle payment failures/refunds
5. **Invoice Generation** - Email receipts to users

---

## 📞 SUPPORT

- **Razorpay Dashboard:** https://dashboard.razorpay.com
- **Razorpay Docs:** https://razorpay.com/docs/
- **Test Cards:** https://razorpay.com/docs/payments/payments/test-card-details/

---

✅ **INTEGRATION COMPLETE!**

All code changes have been made. Just update your `.env.local` file and restart the server!
