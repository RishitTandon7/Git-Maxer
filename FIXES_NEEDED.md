# 🎯 THREE FIXES NEEDED

## ✅ **Issue 1 SOLVED: Bot Works Now!**
- GitHub token updated with correct permissions
- Bot can now create commits ✅

---

## ❌ **Issue 2: New Users Can't Login (Unauthorized)**

**Problem:** Setup page shows "Failed to save settings: Unauthorized"

**Root Cause:** OAuth session not persisting properly in `/api/save-settings`

**Fix:** Change line 42 in `/dashboard/app/api/save-settings/route.ts` from:
```typescript
const { data: { user }, error: authError } = await supabase.auth.getUser()
```

To use session instead:
```typescript
const { data: { session }, error: authError } = await supabase.auth.getSession()
const user = session?.user

if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

---

## ❌ **Issue 3: Non-Owners Can Change Contribution Count**

**Problem:** All users see slider and can change "Minimum Daily Contributions"

**Requirements:**
- Non-owners: LOCKED at 1 contribution/day (no slider visible)
- Owner (rishittandon7): Can change from 1-10

**Fix:** Update `/dashboard/app/dashboard/page.tsx` around line 440 (where slider is):

Add conditional rendering:
```typescript
{/* Minimum Contributions Slider - OWNER ONLY */}
{userPlan === 'owner' && (
    <div>
        <label className="block text-sm font-medium mb-2">
            Minimum Daily Contributions: {config.min_contributions}
        </label>
        <input
            type="range"
            min="1"
            max="10"
            value={config.min_contributions}
            onChange={(e) => setConfig({ ...config, min_contributions: parseInt(e.target.value) })}
            className="w-full"
        />
    </div>
)}

{/* For non-owners, show locked value */}
{userPlan !== 'owner' && (
    <div className="opacity-60">
        <label className="block text-sm font-medium mb-2">
            Daily Contributions: 1 (Free Plan)
        </label>
        <div className="text-xs text-gray-400 mt-1">
            🔒 Upgrade to Pro to customize contributions per day
        </div>
    </div>
)}
```

**Also force value to 1 in backend:**
Update `/dashboard/api/cron.py` to check plan before using `min_contributions`.

---

## 🎯 **Apply Fixes in This Order:**

1. **Fix new user login** (change getUser → getSession)
2. **Hide slider for non-owners** (add conditional rendering)
3. **Enforce 1/day in cron** (backend validation)

Then test!
