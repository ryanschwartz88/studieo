# Email Verification Debug Guide

## Current Issue
- Email verification redirects to `/auth/login` instead of appropriate dashboard
- Verify-email page isn't detecting confirmed users
- Console logs in `/auth/confirm` route aren't appearing

## Understanding the Flow

### Server vs Client Logging
**IMPORTANT**: The `/auth/confirm` route is a **server-side route**, so:
- ✅ Console logs appear in your **terminal/server logs** (where you run `npm run dev`)
- ❌ Console logs DO NOT appear in the browser console
- Look for logs prefixed with `[CONFIRM]` in your terminal

### Email Verification Flow
```
1. User signs up → Supabase sends verification email
2. User clicks link → Opens `/auth/confirm?token_hash=xxx&type=signup`
3. Server route verifies token → Creates session
4. Server checks user role → Redirects to appropriate page
```

## Debugging Steps

### Step 1: Check Server Logs
When you click the email verification link, watch your **terminal** (not browser console) for:
```
# PKCE flow (most likely what you'll see):
[CONFIRM] Starting verification process { token_hash: false, type: null, code: true }
[CONFIRM] Using PKCE flow with code
[CONFIRM] Code exchange result: { success: true, hasSession: true }
[CONFIRM] User from code exchange: { id: '...', email: '...' }
[CONFIRM] User data: { role: 'STUDENT' }
[CONFIRM] Student profile: { hasGradDate: false }
[CONFIRM] Redirecting to onboarding

# OR legacy flow:
[CONFIRM] Starting verification process { token_hash: true, type: 'signup', code: false }
[CONFIRM] Using legacy token_hash flow
[CONFIRM] Verify result: { success: true, hasSession: true }
[CONFIRM] User from session: { id: '...', email: '...' }
...
```

### Step 2: Check Browser Console
On the `/auth/verify-email` page, you should see:
```
[VERIFY] Initial user check: { hasUser: true, email: '...', confirmed: false }
[VERIFY] Polling check: { hasUser: true, confirmed: false }
[VERIFY] Polling check: { hasUser: true, confirmed: true }
[VERIFY] Email confirmed! Getting user role...
[VERIFY] Redirecting based on role: STUDENT
```

### Step 3: Verify Environment Variables
Check your `.env.local` file has:
```bash
NEXT_PUBLIC_URL=http://localhost:3000  # or your deployed URL
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJxxx...
```

### Step 4: Check Supabase Email Settings
In Supabase Dashboard:
1. Go to Authentication → Email Templates
2. Find "Confirm signup" template
3. Verify the redirect URL is: `{{ .SiteURL }}/auth/confirm`

## Common Issues & Fixes

### Issue 1: Logs show "No user in session"
**Cause**: Session isn't being created after verification
**Fix**: 
```typescript
// In route.ts, we now use:
const user = verifyData.session.user;
// Instead of:
const { data: { user } } = await supabase.auth.getUser();
```

### Issue 2: "Unknown role" or no role found
**Cause**: The `handle_new_user()` database trigger might not be working
**Check**:
1. Go to Supabase Dashboard → Database → Functions
2. Verify `handle_new_user` trigger exists
3. Check if user has a record in `users` table with correct `role`

**Test Query**:
```sql
SELECT u.id, u.email, us.role, sp.grad_date
FROM auth.users u
LEFT JOIN public.users us ON u.id = us.id
LEFT JOIN public.student_profiles sp ON u.id = sp.user_id
WHERE u.email = 'your-test-email@example.edu';
```

### Issue 3: Verification link goes to wrong URL
**Cause**: `NEXT_PUBLIC_URL` is incorrect or pointing to studieo.com
**Fix**: 
- Set `NEXT_PUBLIC_URL=http://localhost:3000` for local dev
- Set to your actual app URL in production (not studieo.com marketing site)

### Issue 4: "No token_hash or type" error (FIXED - Now using PKCE)
**What happened**: Supabase now uses PKCE flow which sends a `code` parameter instead
**Email link format**:
- Old: `/auth/confirm?token_hash=xxx&type=signup`
- New (PKCE): `/auth/confirm?code=99e2fffc-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

**The route now handles BOTH formats automatically!**

## Testing Checklist

### For Students:
- [ ] Sign up with .edu email
- [ ] Check terminal logs when clicking verification link
- [ ] Should redirect to `/auth/onboarding`
- [ ] After completing onboarding, should go to `/student/browse`

### For Companies:
- [ ] Sign up with work email
- [ ] Check terminal logs when clicking verification link  
- [ ] Should redirect directly to `/company/dashboard`
- [ ] No onboarding required

## What to Check Right Now

1. **Terminal Output**: Start your dev server and watch the terminal when clicking the email link
2. **Browser Console**: Open DevTools and watch for `[VERIFY]` logs on the verify-email page
3. **Database**: Check if user exists in `users` table with correct `role`
4. **Email Link**: The URL should look like one of these:
   ```
   # PKCE flow (current/preferred):
   http://localhost:3000/auth/confirm?code=99e2fffc-60cd-46c7-91f9-c1d485ac6509
   
   # Legacy flow:
   http://localhost:3000/auth/confirm?token_hash=pkce_xxx&type=signup
   ```

## Quick Fix Commands

### Clear all sessions and start fresh:
```bash
# 1. Delete user from Supabase Dashboard → Authentication → Users
# 2. Clear browser cookies/local storage
# 3. Sign up again with the same email
```

### Check current session in browser console:
```javascript
const supabase = createClient();
const { data } = await supabase.auth.getSession();
console.log('Current session:', data);
```

## Need More Help?

If none of the above works, please share:
1. **Terminal logs** when clicking the email link (the `[CONFIRM]` logs)
2. **Browser console logs** from `/auth/verify-email` page (the `[VERIFY]` logs)
3. **SQL query result** showing the user's data
4. **Environment**: Are you on localhost or deployed?

