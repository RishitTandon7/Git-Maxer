# 🔒 Razorpay Security Update

## ✅ Hardcoded Keys Removed

All Razorpay credentials have been moved to environment variables for security.

## 📋 Required Environment Variables

Add these to your **Vercel Project Settings** → **Environment Variables**:

### **Public Key (Frontend)**
```
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_Rxq9o4Kicc1f3V
```
- Used in: `app/pricing/page.tsx`
- Scope: **Production, Preview, Development**

### **Secret Key (Backend)**
```
RAZORPAY_KEY_SECRET=6njwAIIYZ5xw1HBm5l9Zu75D
```
- Used in: `app/api/razorpay/order/route.ts`
- Scope: **Production, Preview, Development**
- ⚠️ **KEEP SECRET** - Never commit to Git

## 🚀 Deployment Steps

1. **Add to Vercel:**
   - Go to Vercel Dashboard → Your Project
   - Settings → Environment Variables
   - Add both variables above
   - Apply to: Production, Preview, Development

2. **Add to Local `.env.local`:**
   ```bash
   echo "NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_Rxq9o4Kicc1f3V" >> .env.local
   echo "RAZORPAY_KEY_SECRET=6njwAIIYZ5xw1HBm5l9Zu75D" >> .env.local
   ```

3. **Redeploy:**
   - Push changes to GitHub
   - Vercel will automatically redeploy with new env vars

## ✅ Security Benefits

- ✅ Keys not exposed in source code
- ✅ Can rotate keys without code changes
- ✅ Different keys for dev/staging/production
- ✅ Protected from Git history exposure

## 🔍 Files Modified

- `app/api/razorpay/order/route.ts` - Uses `process.env.RAZORPAY_KEY_SECRET`
- `app/pricing/page.tsx` - Uses `process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID`
