# Security Audit Deployment Checklist
**LC Lighting Master — Production Deployment**

**Date:** June 22, 2026  
**Status:** Ready for deployment after completing steps below

---

## CRITICAL: Actions You Must Do Manually (BEFORE Deploying)

---

## SECTION 1: Stripe API Keys Rotation
### ⏱️ Estimated Time: 10 minutes

### Step 1.1: Go to Stripe Dashboard
1. Open https://dashboard.stripe.com
2. Log in with your Stripe account
3. In the left sidebar, go to **Developers**
4. Click **API keys**

### Step 1.2: Revoke Old Keys
1. Find your **Secret Key** that starts with `sk_live_51TdVxBCD...`
2. Click the **Reveal** button next to it
3. Copy the full key and **SAVE IT IN A NOTE** (you'll need it for verification)
4. Click the **⋮ (three dots)** menu → **Deactivate**
5. Confirm: "Deactivate API Key"

✅ **Wait for confirmation** that the key is deactivated (it may take a few seconds)

### Step 1.3: Generate New Secret Key
1. Still on the **API keys** page
2. Click **Create restricted key**
3. For the **Name**, enter: `Production Secret Key - LC Lighting Master`
4. For **Permissions**, select:
   - ✅ `write_customers`
   - ✅ `write_charges`
   - ✅ `read_charges`
   - ✅ `read_customers`
   - ✅ `write_payouts`
   - ✅ `read_payouts`
5. Click **Create key**
6. **COPY the new key** — it looks like `sk_live_...`
7. **SAVE IT SECURELY** in a text file for step 2.1

### Step 1.4: Verify Webhook Secret (Should Already Be Correct)
1. Still in **Developers** → **API keys** tab
2. Scroll down to find **Webhook signing secret**
3. It should be `whsec_lsCCCB1nQvGbul4ptRf1m5jH7FS2mgZb`
4. If it's different, note it — you'll need it for Vercel environment variables

---

## SECTION 2: Update Vercel Environment Variables
### ⏱️ Estimated Time: 15 minutes

### Step 2.1: Open Vercel Project Settings
1. Go to https://vercel.com
2. Log in with your Vercel account
3. Select your **LC Lighting Master** project
4. Click **Settings** (top menu bar)
5. In left sidebar, click **Environment Variables**

### Step 2.2: Update Stripe Secret Key
1. Find the variable named `STRIPE_SECRET_KEY`
2. Click the **three dots (⋮)** → **Delete**
3. Confirm deletion
4. Click **Add New** button
5. Fill in:
   - **Name:** `STRIPE_SECRET_KEY`
   - **Value:** [Paste the NEW key from Step 1.3]
   - **Environments:** Check all three:
     - ✅ Production
     - ✅ Preview
     - ✅ Development
6. Click **Save**

### Step 2.3: Update Stripe Webhook Secret (if changed)
1. Find the variable named `STRIPE_WEBHOOK_SECRET`
2. If the value from Step 1.4 is different, update it:
   - Click **three dots (⋮)** → **Delete**
   - Click **Add New**
   - **Name:** `STRIPE_WEBHOOK_SECRET`
   - **Value:** [Your webhook secret]
   - **Environments:** ✅ All three
   - Click **Save**

### Step 2.4: Add Admin Credentials
1. Click **Add New** button
2. Fill in:
   - **Name:** `ADMIN_PASSWORD_HASH`
   - **Value:** `$2b$12$jWZ95Fw2r5ldkpcSU80fyOlbiXonE19XN2Y0ZQeeGsvkaMJsvsYz2`
   - **Environments:** ✅ All three
3. Click **Save**

4. Click **Add New** button again
5. Fill in:
   - **Name:** `ADMIN_JWT_SECRET`
   - **Value:** `09e714c43544be5af33d23c0ce1357595a8bf8dc9b85511c598c69eb3b824ce4`
   - **Environments:** ✅ All three
6. Click **Save**

### Step 2.5: Verify All Variables Are Set
Your Vercel environment variables should now have:
- ✅ `ADMIN_EMAIL` = `admin@luxartmedia.com`
- ✅ `ADMIN_JWT_SECRET` = (32-char hex string from step 2.4)
- ✅ `ADMIN_PASSWORD_HASH` = (bcrypt hash from step 2.4)
- ✅ `NEXT_PUBLIC_SITE_URL` = `https://lightingmasterlc.com` (if set)
- ✅ `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = `pk_live_...`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (your anon key)
- ✅ `NEXT_PUBLIC_SUPABASE_URL` = (your Supabase URL)
- ✅ `STRIPE_SECRET_KEY` = `sk_live_...` (NEW key from step 2.3)
- ✅ `STRIPE_WEBHOOK_SECRET` = `whsec_...`
- ✅ `SUPABASE_SERVICE_ROLE_KEY` = (your service role key)

---

## SECTION 3: Rotate Supabase Service Role Key (OPTIONAL but Recommended)
### ⏱️ Estimated Time: 5 minutes

**⚠️ Only do this if the old key was exposed. Otherwise, skip to Section 4.**

### Step 3.1: Go to Supabase Project
1. Open https://app.supabase.com
2. Select your **LC Lighting Master** project
3. Go to **Project Settings** → **API** (left sidebar)

### Step 3.2: Revoke Old Service Role Key
1. Find **service_role** (anon has the other key)
2. Click **Reveal** to see the full key
3. Click the **⋮ (menu)** → **Rotate**
4. Confirm: "Rotate this API key"
5. ⏳ **Wait for rotation** (usually 30 seconds - 2 minutes)

### Step 3.3: Copy New Service Role Key
1. Once rotated, the new key appears
2. Click **Copy** 
3. **SAVE IT SECURELY**

### Step 3.4: Update in Vercel
1. Go back to Vercel → Project Settings → Environment Variables
2. Find `SUPABASE_SERVICE_ROLE_KEY`
3. Click **three dots (⋮)** → **Delete**
4. Click **Add New**
5. Fill in:
   - **Name:** `SUPABASE_SERVICE_ROLE_KEY`
   - **Value:** [NEW key from step 3.3]
   - **Environments:** ✅ All three
6. Click **Save**

---

## SECTION 4: Apply Supabase Database Migration
### ⏱️ Estimated Time: 5 minutes

**⚠️ This prevents the Stripe webhook race condition. MUST DO.**

### Step 4.1: Open Supabase SQL Editor
1. Go to https://app.supabase.com
2. Select your **LC Lighting Master** project
3. In left sidebar, click **SQL Editor**
4. Click **New Query** button

### Step 4.2: Paste and Run Migration
1. In the SQL editor, paste this exactly:

```sql
ALTER TABLE public.subscriptions
  ADD CONSTRAINT uq_stripe_payment_intent UNIQUE (stripe_payment_intent)
    WHERE stripe_payment_intent IS NOT NULL;
```

2. Click the **▶ Run** button (top right)
3. ✅ Wait for success message: `"execute query successfully"`

**If you get an error:**
- `"constraint already exists"` = OK, constraint is already there, continue
- Any other error = Contact support before proceeding

---

## SECTION 5: Update Local .env.local (Optional - for testing)
### ⏱️ Estimated Time: 2 minutes

**⚠️ Optional. Only do this if you want to test locally before deployment.**

### Step 5.1: Open .env.local
1. Open your text editor
2. Open file: `C:\Users\670246060\lc-lighting-master\.env.local`

### Step 5.2: Add New Credentials
Add these two lines (or update if they already exist):

```
ADMIN_PASSWORD_HASH=$2b$12$jWZ95Fw2r5ldkpcSU80fyOlbiXonE19XN2Y0ZQeeGsvkaMJsvsYz2
ADMIN_JWT_SECRET=09e714c43544be5af33d23c0ce1357595a8bf8dc9b85511c598c69eb3b824ce4
```

### Step 5.3: Save File
1. Save the file (Ctrl+S)
2. Keep this file **SECURE** — do NOT commit to git

---

## SECTION 6: Deploy to Production
### ⏱️ Estimated Time: 3 minutes

**⚠️ Do not skip — this pushes the security fixes to production.**

### Step 6.1: Open Terminal/Command Prompt
1. Open PowerShell or Command Prompt
2. Navigate to project:
```bash
cd C:\Users\670246060\lc-lighting-master
```

### Step 6.2: Verify Git Status
```bash
git status
```

You should see:
```
On branch main
nothing to commit, working tree clean
```

If you see changes:
- **Do NOT proceed yet** — the code should already be committed
- Check what changed: `git diff`
- If unexpected, contact support

### Step 6.3: Push Latest Code
```bash
git log --oneline | head -1
```

This shows your latest commit. Should include "security" or "OWASP" fixes.

If you need to commit changes:
```bash
git add .
git commit -m "security: apply OWASP audit fixes with secure authentication and encryption"
git push origin main
```

### Step 6.4: Verify Vercel Deployment
1. Go to https://vercel.com
2. Open your **LC Lighting Master** project
3. Look for a new deployment starting
4. ⏳ **Wait 2-3 minutes** for deployment to complete
5. ✅ Status should say **"Ready"** in green

---

## SECTION 7: Test Admin Login (Post-Deployment)
### ⏱️ Estimated Time: 5 minutes

**⚠️ Critical: Verify the new credentials work before finishing.**

### Step 7.1: Test on Production
1. Open https://lightingmasterlc.com (or your domain)
2. Look for admin panel login (if accessible from UI)
3. Or go directly to admin page (URL depends on your setup)

### Step 7.2: Test Login Credentials
- **Email:** `admin@luxartmedia.com`
- **Password:** `Maestrodeluz00@`

**Expected result:** ✅ Login succeeds, session created

**If login fails:**
- ❌ Check environment variables are saved in Vercel
- ❌ Verify no typos in `ADMIN_PASSWORD_HASH` or `ADMIN_JWT_SECRET`
- ❌ Clear browser cache and try again
- ❌ Contact support if still failing

### Step 7.3: Test Rate Limiting
1. Open developer console (F12)
2. Try to login with wrong password 6+ times
3. **Expected:** Get "Too many requests" or "try again in X minutes"
4. ✅ Rate limiting is working

### Step 7.4: Test Stripe Webhook (Optional)
1. Go to https://dashboard.stripe.com
2. Developers → Webhooks
3. Find your webhook endpoint (ends in `/api/stripe/webhook`)
4. Click **Send test event**
5. Select **charge.succeeded** event
6. Click **Send test event**
7. ✅ Should see "Success" response

---

## SECTION 8: Verify No Secrets in Repository
### ⏱️ Estimated Time: 3 minutes

**⚠️ Double-check: ensure old secrets are not in git history.**

### Step 8.1: Search for Old Secrets
```bash
git log --all --oneline | grep -i "secret\|password\|key"
```

Should return nothing or only commit messages about "secure" or "encryption".

### Step 8.2: Verify .env.local Not Committed
```bash
git log --all -- .env.local
```

Should show it was **never committed** (no output or only deletions).

### Step 8.3: Verify .gitignore
```bash
cat .gitignore | grep -E "\.env|secret"
```

Should show:
```
.env*
```

---

## SECTION 9: Final Verification Checklist
### ⏱️ Estimated Time: 5 minutes

Go through this list and confirm everything:

### Security Fixes Deployed
- [ ] Admin login uses bcrypt passwords (tested in 7.2)
- [ ] Rate limiting active (tested in 7.3)
- [ ] Stripe webhook working (tested in 7.4)
- [ ] No secrets in environment (.local or git)
- [ ] Supabase migration applied (step 4.2)

### Environment Variables
- [ ] `ADMIN_PASSWORD_HASH` set in Vercel (all environments)
- [ ] `ADMIN_JWT_SECRET` set in Vercel (all environments)
- [ ] `STRIPE_SECRET_KEY` updated to NEW key (all environments)
- [ ] `STRIPE_WEBHOOK_SECRET` correct (all environments)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set (all environments)

### Code Deployed
- [ ] Latest security fixes pushed to `main` branch
- [ ] Vercel deployment shows **"Ready"** status
- [ ] Admin login works with new password
- [ ] No build errors in Vercel logs

### Credentials Secured
- [ ] Old Stripe key deactivated (not deleted, deactivated)
- [ ] Old Supabase key rotated (if done in section 3)
- [ ] New credentials saved securely (password manager)
- [ ] Credentials NOT shared in email or Slack

---

## SECTION 10: Post-Deployment Cleanup
### ⏱️ Estimated Time: 5 minutes

**⚠️ Do this after verifying everything works.**

### Step 10.1: Secure Credential Storage
1. Open your password manager (1Password, LastPass, etc.)
2. Create a new entry:
   - **Title:** `LC Lighting Master Admin - Maestrodeluz00@`
   - **Username:** `admin@luxartmedia.com`
   - **Password:** `Maestrodeluz00@`
   - **Notes:** 
     ```
     ADMIN_PASSWORD_HASH: $2b$12$jWZ95Fw2r5ldkpcSU80fyOlbiXonE19XN2Y0ZQeeGsvkaMJsvsYz2
     ADMIN_JWT_SECRET: 09e714c43544be5af33d23c0ce1357595a8bf8dc9b85511c598c69eb3b824ce4
     Deployed: June 22, 2026
     ```
3. **DELETE** any text files with credentials
4. **DELETE** any email drafts with credentials

### Step 10.2: Remove Local Credentials (if added)
1. Open `.env.local`
2. Delete the `ADMIN_PASSWORD_HASH` and `ADMIN_JWT_SECRET` lines
3. Save file
4. ✅ Local dev can now login with credentials from Vercel

### Step 10.3: Document Changes
1. Create a ticket or note:
   ```
   COMPLETED: Security audit deployment
   Date: June 22, 2026
   Changes:
   - Rotated Stripe secret key
   - Updated admin authentication to bcrypt
   - Applied rate limiting
   - Added webhook idempotency constraint
   - Deployed comprehensive OWASP fixes
   Status: READY FOR PRODUCTION
   ```

---

## SECTION 11: Monitoring (First 24 Hours)
### ⏱️ Estimated Time: 1 minute (initial setup)

### Step 11.1: Watch Vercel Logs
1. Go to https://vercel.com → Your project
2. Click **Deployments** tab
3. Click the latest deployment
4. Monitor the **Logs** for errors
5. Look for:
   - ❌ Authentication errors
   - ❌ Rate limit exceptions
   - ❌ Database constraint violations

### Step 11.2: Test Key Features
Monitor these for 24 hours:
- [ ] Admin logins successful
- [ ] No sudden errors in logs
- [ ] Stripe webhooks processing
- [ ] Certificate generation working
- [ ] Email sending working

---

## TROUBLESHOOTING

### Problem: Admin Login Fails
**Solution:**
1. Verify `ADMIN_PASSWORD_HASH` in Vercel matches exactly (no spaces, no typos)
2. Verify `ADMIN_JWT_SECRET` is set in Vercel
3. Clear browser cache (Ctrl+Shift+Del)
4. Try incognito/private window
5. If still failing: Check Vercel deployment logs for errors

### Problem: Rate Limiting Blocks Legitimate Users
**Solution:**
1. This is expected after 5 failed attempts
2. Wait 15 minutes before trying again
3. Check IP address is not being rate-limited across multiple users
4. If needed, adjust rate limit in `lib/rate-limit.js`

### Problem: Stripe Webhook Tests Fail
**Solution:**
1. Verify `STRIPE_WEBHOOK_SECRET` matches exactly
2. Verify webhook endpoint URL is correct in Stripe dashboard
3. Check Vercel logs for errors
4. If endpoint URL changed, update in Stripe dashboard

### Problem: Supabase Migration Fails
**Solution:**
- **Error: "constraint already exists"** → This is OK, constraint is already applied
- **Error: "column does not exist"** → Supabase schema mismatch, contact support
- **Error: "syntax error"** → Re-check SQL copy/paste, no extra characters

---

## SUCCESS CRITERIA

You're done when:

✅ All 11 steps completed without errors  
✅ Admin login works with new password  
✅ Vercel deployment shows "Ready" status  
✅ No sensitive data in git history  
✅ All environment variables set in Vercel  
✅ Credentials securely stored in password manager  
✅ Supabase migration applied  
✅ Stripe webhook tested successfully  

---

## ESTIMATED TOTAL TIME: ~60 minutes

If you get stuck on any step, **STOP** and contact support before proceeding.

**Deployment Status: READY TO BEGIN** 🚀

