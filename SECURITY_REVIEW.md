# Security Review — LC Lighting Master (lightingmasterlc.com)

**Date:** 2026-06-14  
**Reviewer:** Senior Application Security Engineer  
**Scope:** Full codebase — Next.js 15 App Router, Supabase auth, Stripe payments, admin portal  

---

## Executive Summary

**Overall Risk Rating: CRITICAL**

Three critical vulnerabilities exist that together form a complete attack chain executable by any user who visits the homepage. The most severe is that all 74 lessons of paid course content are bundled in the client-side JavaScript and fully accessible to anyone with a browser DevTools session — no account required. Simultaneously, the admin password is hardcoded in the same client bundle, meaning any visitor can authenticate to the admin API and retrieve every user's email, plan, and Stripe identifiers.

### Top 5 Issues

| # | Issue | Severity |
|---|---|---|
| 1 | All course content (`LC_DATA`, 74 lessons) bundled in client JS — accessible without payment | CRITICAL |
| 2 | Admin password `Master00@` hardcoded in `LcApp.jsx` client bundle — visible to every visitor | CRITICAL |
| 3 | Live production secrets (`sk_live_`, `whsec_`, service role key) in `.env.local` on developer workstation | CRITICAL |
| 4 | `/api/admin/data` has no rate limiting — brute-forceable (moot given #2, but standalone risk) | HIGH |
| 5 | Middleware `catch` block silently allows requests through on Supabase errors — auth bypass under failure conditions | HIGH |

### What Is Well Implemented

- Stripe price and seat count are determined **entirely server-side** — no client-supplied amounts reach Stripe
- Stripe webhook signature is verified via `stripe.webhooks.constructEvent()` before any processing
- Service role key is server-only (`SUPABASE_SERVICE_ROLE_KEY`, no `NEXT_PUBLIC_` prefix) — not exposed in the bundle
- CSRF origin check (`checkOrigin`) is applied to the Stripe checkout `POST` route
- Access revocation on refund and dispute events is implemented in the webhook handler
- Refund handler has a 3-fallback lookup chain (customer ID → payment intent → email)
- `.gitignore` correctly excludes `.env*` and `*.backup.*` files

---

## Application Map

| Component | Technology |
|---|---|
| Framework | Next.js 15 (App Router, Turbopack) |
| Deployment | Vercel |
| Auth | Supabase Auth (email/password, magic link) |
| Database | Supabase (PostgreSQL + RLS) |
| Payments | Stripe (one-time checkout, webhooks) |
| Admin portal | Client-side SPA inside `LcApp.jsx` — password-gated |

### Key Routes

| Path | Auth Required | Notes |
|---|---|---|
| `/` | No | Homepage — loads full `LC_DATA` bundle |
| `/dashboard` | Yes (Supabase session) | Main learner app |
| `/pricing` | No | Stripe checkout initiation |
| `/login` | No | Supabase auth |
| `/legal/*` | No | Static pages |
| `/resources/*` | No | Public blog articles |

### Key API Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/stripe/checkout` | Supabase session | Create Stripe checkout session |
| POST | `/api/stripe/webhook` | Stripe signature | Handle payment events |
| GET | `/api/admin/data` | `x-admin-password` header | Return all subscriptions + progress |

---

## Findings

---

### CRIT-1: All Paid Course Content Bundled in Client JavaScript

**Severity:** CRITICAL  
**Category:** Broken Access Control — Content Entitlement  
**Affected files:** `components/LcApp.jsx` (approximately lines 1750–1940)

**Description:**  
The entire paid course — 74 lessons (`LC_DATA`) and SVG module visuals (`LC_VISUALS`) — is a JavaScript constant defined inside a `'use client'` component. This means the complete content of plans T1 ($250), T2 ($395), and T3 ($595) is downloaded to every visitor's browser before any authentication or payment check occurs. The access controls (`isLessonLocked`, plan checks) only prevent the UI from *displaying* content. The data is already present in the browser.

**Evidence:**
```javascript
// components/LcApp.jsx ~line 1915
const LC_DATA = {
  "1.1": { body: ["Light is a form of <strong>electromagnetic energy</strong>..."], lp: [...], tts: "..." },
  "1.2": { ... },
  // ... all 74 lessons in full
}
```

**Exploit scenario:**  
1. Visit `https://lightingmasterlc.com` with no account.  
2. Open DevTools → Console.  
3. Type `LC_DATA["5.1"].body` → full Module 5 lesson text is printed.  
4. Loop over all keys to extract all 74 lessons in seconds.  
No account, no payment, no technical skill beyond opening a browser.

**Recommended fix:**  
Move lesson content to a server-side API route (`GET /api/lesson/[ref]`) that validates session and plan entitlement before returning content. Ship only lesson metadata (title, ref, tags) to the client bundle.

```javascript
// app/api/lesson/[ref]/route.js
export async function GET(request, { params }) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan, status')
    .eq('user_id', user.id)
    .single()

  if (!isEntitled(sub, params.ref)) {
    return new Response('Forbidden', { status: 403 })
  }

  const content = await fetchLessonContent(params.ref) // from DB or filesystem
  return Response.json(content)
}
```

**Verification:** After fix, load the homepage unauthenticated and confirm `LC_DATA` is absent from the JS bundle (`grep -r "LC_DATA" .next/static/`).

---

### CRIT-2: Admin Password Hardcoded in Client-Side JavaScript Bundle

**Severity:** CRITICAL  
**Category:** Insecure Authentication — Secrets Exposure  
**Affected files:** `components/LcApp.jsx` line 5393; `app/api/admin/data/route.js` line 3

**Description:**  
The admin password is defined as a constant inside a `'use client'` React component and shipped verbatim to every browser. Any visitor who opens DevTools can read it.

**Evidence:**
```javascript
// components/LcApp.jsx line 5393
const ADMIN_CREDS = {email:"admin@luxartmedia.com", pw:"Master00@"}

// Used client-side for login gate:
if(email.toLowerCase()===ADMIN_CREDS.email && pw===ADMIN_CREDS.pw){ onLogin() }

// Also sent in API header:
headers:{'x-admin-password': ADMIN_CREDS.pw}
```

```javascript
// app/api/admin/data/route.js line 3
const ADMIN_PW = process.env.ADMIN_PASSWORD || 'Master00@'
```

The API route has a correct fallback, but the password used to call it is already in the bundle. Additionally, the API returns `subscriptions: select('*')` — every user's email, plan, Stripe customer ID, payment intent, and session token.

**Exploit scenario:**  
1. Visit the site, open DevTools → Sources → search for `ADMIN_CREDS`.  
2. Read `pw: "Master00@"`.  
3. `curl https://lightingmasterlc.com/api/admin/data -H "x-admin-password: Master00@"` → full database dump of all users.

**Recommended fix:**  
Replace the client-side password gate with a Supabase-authenticated admin session. Create a dedicated admin user in Supabase Auth (`admin@luxartmedia.com`), check `user.email` server-side in the API route, and remove `ADMIN_CREDS` from the client bundle entirely.

```javascript
// app/api/admin/data/route.js
export async function GET(request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }
  // ... rest of handler
}
```

**Verification:** After fix, search the built bundle: `grep -r "Master00" .next/static/` should return no matches.

---

### CRIT-3: Live Production Secrets in `.env.local` — Rotation Required

**Severity:** CRITICAL  
**Category:** Secrets Management  
**Affected files:** `.env.local`

**Description:**  
`.env.local` contains live Stripe secret key (`sk_live_`), Stripe webhook secret (`whsec_`), and Supabase service role key. The `.gitignore` correctly excludes this file, but its presence on a developer workstation represents an exposure risk. More critically, these are all production credentials — a compromise of the development machine or this file's accidental commitment compromises the live platform.

**Evidence (redacted):**
```
STRIPE_SECRET_KEY=sk_live_51TdV...          # Full Stripe account access
STRIPE_WEBHOOK_SECRET=whsec_lsCC...        # Forge any Stripe event
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...      # Bypass all RLS, full DB access
```

**Impact of each secret if compromised:**  
- `sk_live_` — Create charges, issue refunds, access all customer PII, cancel subscriptions  
- `whsec_` — Forge `checkout.session.completed` events, grant any user any plan for free  
- Service role key — Read/write all Supabase tables with no RLS restrictions  

**Required immediate actions:**  
1. Rotate `STRIPE_SECRET_KEY` in Stripe Dashboard → Developers → API Keys  
2. Rotate `STRIPE_WEBHOOK_SECRET` by deleting and recreating the webhook endpoint  
3. Rotate `SUPABASE_SERVICE_ROLE_KEY` in Supabase Dashboard → Settings → API  
4. Audit git history: `git log --all --oneline -- .env.local` — if any commit touches this file, the keys in that commit must be rotated regardless of current state  
5. Update all new keys in Vercel Environment Variables before redeploying  

**Verification:** After rotation, confirm old keys return 401/403 from Stripe and Supabase.

---

### HIGH-1: Admin API Has No Rate Limiting — Full Brute-Force Surface

**Severity:** HIGH  
**Category:** Missing Rate Limiting  
**Affected files:** `app/api/admin/data/route.js`

**Description:**  
The admin endpoint checks only a single header value with no rate limiting, lockout, delay, or IP throttling. Even if the password were not in the client bundle, this endpoint is trivially brute-forceable.

**Evidence:**
```javascript
if (request.headers.get('x-admin-password') !== ADMIN_PW) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
}
// No delay, no counter, no lockout
```

**Recommended fix:**  
Add Vercel Edge rate limiting in middleware, or use Upstash Redis rate limiter:
```javascript
import { Ratelimit } from '@upstash/ratelimit'
const ratelimit = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, '60 s') })
const { success } = await ratelimit.limit(request.ip)
if (!success) return new Response('Too many requests', { status: 429 })
```

---

### HIGH-2: Middleware `catch` Block Allows Requests Through on Supabase Error

**Severity:** HIGH  
**Category:** Authentication Bypass Under Failure Conditions  
**Affected files:** `middleware.js` lines 44–46

**Description:**  
If Supabase is unreachable during session validation, the middleware silently swallows the exception and allows the request to proceed to protected routes.

**Evidence:**
```javascript
} catch {
  // If Supabase is unreachable, let the request through — pages handle auth securely.
}
```

**Exploit scenario:**  
An attacker disrupts DNS resolution for `zojqpwwgurowwdehrcay.supabase.co` (or triggers a Supabase regional outage) and then accesses `/dashboard`. The middleware allows the request through.

**Recommended fix:**
```javascript
} catch {
  const url = request.nextUrl.clone()
  url.pathname = '/login'
  return NextResponse.redirect(url)
}
```

---

### HIGH-3: Community `acceptAnswer` Authorization Is Client-Side Only

**Severity:** HIGH  
**Category:** Broken Access Control — Horizontal Privilege Escalation  
**Affected files:** `components/LcApp.jsx` lines 4437–4443

**Description:**  
The check preventing users from marking other users' answers as accepted (`user.id !== activeQuestion.user_id`) is performed in React state only. A logged-in user can bypass it by calling the Supabase client directly from DevTools.

**Evidence:**
```javascript
async function acceptAnswer(answerId) {
  if (!user || user.id !== activeQuestion.user_id) return  // CLIENT-SIDE ONLY
  await supabase.from('community_answers').update({ is_accepted: true }).eq('id', answerId)
```

**Recommended fix:**  
Add Supabase RLS policy on `community_answers`:
```sql
CREATE POLICY "Only question owner can accept answers"
ON community_answers FOR UPDATE
USING (
  auth.uid() = (SELECT user_id FROM community_questions WHERE id = question_id)
)
WITH CHECK (
  auth.uid() = (SELECT user_id FROM community_questions WHERE id = question_id)
);
```

---

### HIGH-4: CSRF Check Allows Requests With No `Origin` Header

**Severity:** HIGH  
**Category:** CSRF / Authentication Bypass  
**Affected files:** `lib/csrf.js`

**Description:**  
The `checkOrigin` function used in the checkout route explicitly returns `true` (allows the request) when no `Origin` header is present:

**Evidence:**
```javascript
export function checkOrigin(request) {
  const origin = request.headers.get('origin')
  if (!origin) return true   // ← curl and non-browser requests bypass CSRF check
  // ...
}
```

This means `curl -X POST https://lightingmasterlc.com/api/stripe/checkout -d '{"plan":"t1"}'` bypasses origin validation entirely. A logged-in user's session cookie (which Next.js Auth sets as `HttpOnly`) cannot be read by `curl`, but if an attacker can get a user's session token by other means (e.g., via XSS), they can forge requests with no Origin header.

**Recommended fix:**  
For server-to-server calls that legitimately have no `Origin`, use a separate API key. For browser-initiated requests, reject missing `Origin`:
```javascript
if (!origin) return false  // Reject requests with no Origin header
```
Or implement CSRF tokens stored in a non-HttpOnly cookie.

---

### MED-1: `dangerouslySetInnerHTML` Without Sanitization — XSS Risk on Content Migration

**Severity:** MEDIUM  
**Category:** XSS  
**Affected files:** `components/LcApp.jsx` lines 3361, 3372–3374

**Description:**  
Lesson body HTML and SVG visual content are rendered via `dangerouslySetInnerHTML` without sanitization. Currently safe (content is hardcoded), but becomes a Critical XSS vector if content moves to Supabase (see CRIT-1 remediation).

**Evidence:**
```javascript
<div dangerouslySetInnerHTML={{__html: visual}}/>
content.body.map((para, i) => (
  <div key={i} dangerouslySetInnerHTML={{__html: para}}/>
))
```

**Recommended fix:**
```javascript
import DOMPurify from 'isomorphic-dompurify'
<div dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(para)}}/>
```

---

### MED-2: Content Security Policy Contains `'unsafe-inline'` and `'unsafe-eval'`

**Severity:** MEDIUM  
**Category:** Security Headers  
**Affected files:** `next.config.ts` lines 40–41

**Description:**  
Both `'unsafe-inline'` and `'unsafe-eval'` in `script-src` render the CSP ineffective against XSS. Any injected script tag will execute regardless of source.

**Evidence:**
```javascript
"script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com ..."
```

**Recommended fix:**  
Use nonce-based CSP via Next.js middleware (supported in Next.js 13+). Remove `'unsafe-eval'` unless a specific dependency requires it (audit with `require-trusted-types-for`).

---

### MED-3: Login Rate Limiting Is Client-Side React State Only

**Severity:** MEDIUM  
**Category:** Brute Force Protection  
**Affected files:** `components/LcApp.jsx` lines 335–355

**Description:**  
The 5-attempt lockout and progressive delay are stored in React component state (`useState`). Any page refresh resets the counter. Supabase Auth has its own server-side rate limiting, but the client-side UI gives a false sense of protection.

**Recommended fix:**  
Remove the client-side rate limiting state and rely solely on Supabase Auth's built-in rate limiter. Enable Supabase Auth → Settings → "Enable email confirmations" and consider enabling MFA for admin accounts.

---

### MED-4: Student Discount Verification Is Unimplemented — `isStudentEmail()` Is Dead Code

**Severity:** MEDIUM  
**Category:** Business Logic  
**Affected files:** `lib/pricing.js` lines 54–60; `app/api/stripe/checkout/route.js` line 77

**Description:**  
`isStudentEmail()` exists and validates `.edu` domains server-side, but is never called in the checkout flow. Student discounts are commented as "applied manually via Stripe coupon codes sent by email." Additionally, `STUDENT_TEST_EMAIL=mexbarajas@hotmail.com` bypasses the `.edu` check for that specific address — if shared or leaked, it grants student-rate access.

**Recommended fix:**  
Either wire `isStudentEmail(user.email)` into the checkout route and apply a Stripe discount automatically, or remove the dead function and the `STUDENT_TEST_EMAIL` variable.

---

### MED-5: Community View Count Writable by Any Authenticated User

**Severity:** MEDIUM  
**Category:** Broken Access Control  
**Affected files:** `components/LcApp.jsx` line 4395

**Evidence:**
```javascript
supabase.from('community_questions')
  .update({ view_count: q.view_count + 1 })
  .eq('id', q.id)
```

No ownership check. Any logged-in user can call this directly from DevTools to set arbitrary view counts on any question. Depends on RLS — if UPDATE on `view_count` is unrestricted, this is exploitable.

**Recommended fix:**  
Use a Supabase database function with `SECURITY DEFINER` to increment view counts atomically with no client-supplied value:
```sql
CREATE FUNCTION increment_view_count(question_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE community_questions SET view_count = view_count + 1 WHERE id = question_id;
$$;
```

---

### LOW-1: Admin API Response Includes Session Tokens for All Users

**Severity:** LOW  
**Category:** Information Disclosure  
**Affected files:** `app/api/admin/data/route.js` line 18

**Description:**  
`supabase.from('subscriptions').select('*')` returns every column, including `session_token` (the single-session enforcement token). Anyone who can call the admin API receives a map of every active user's current session token, enabling session hijacking if combined with Supabase API access.

**Recommended fix:**  
Explicitly select only the columns needed in the admin view — exclude `session_token`.

---

### LOW-2: PostCSS Moderate XSS Vulnerability in `next` Dependency (Build-Time)

**Severity:** LOW (build-time only)  
**Category:** Dependency Vulnerability  
**Package:** `postcss < 8.5.10` (transitive via `next@16.2.7`)  
**Advisory:** GHSA-qx2v-qp2m-jg93

**Description:**  
`postcss` versions below 8.5.10 have an XSS vulnerability in CSS stringification. Affects build-time tooling, not runtime production users, so practical exploitability is very low.

**Recommended fix:**  
Monitor for a Next.js stable release that bumps postcss to ≥ 8.5.10. Do not auto-upgrade `next` in production without testing.

---

### LOW-3: Supabase Auth Error Messages Enable User Enumeration

**Severity:** LOW  
**Category:** Information Disclosure  
**Affected files:** `components/LcApp.jsx` lines 330, 354, 376

**Description:**  
Raw Supabase error messages (e.g., "Email already registered") are displayed directly to users, enabling email enumeration.

**Recommended fix:**  
Map all Supabase auth errors to generic messages: "Invalid email or password" for all sign-in failures.

---

### LOW-4: Backup Files Exist on Disk Outside of Git

**Severity:** LOW  
**Category:** Operational Security  
**Affected files:** `components/LcApp.backup.jsx`, `app/api/stripe/webhook/route.backup.js`

**Description:**  
Backup files containing full copies of application logic exist on the developer workstation. The `.gitignore` correctly excludes them, but if accidentally committed or transferred, they expose application logic and any secrets present at backup time.

**Recommended fix:**  
Delete backup files after use. Rely on git history for rollback.

---

## Payment and Access Control Review

| Check | Status | Notes |
|---|---|---|
| Price determined server-side | PASS | `PLANS` object in `lib/pricing.js`; client cannot supply amount |
| Plan validated against allowlist | PASS | `VALID_PLANS` check before processing |
| Seat count validated server-side | PASS | Min 5, max 10 enforced in checkout route |
| Webhook signature verified | PASS | `stripe.webhooks.constructEvent()` called before all processing |
| Paid access granted only after payment | PASS | Only `checkout.session.completed` with `payment_status === 'paid'` grants access |
| Duplicate webhook protection | PASS | `stripe_payment_intent` idempotency check |
| Refund revokes access | PASS | `charge.refunded` handler with 3-fallback lookup |
| Dispute suspends access | PASS | `charge.dispute.created` handler |
| Paid content gated server-side | **FAIL** | `LC_DATA` is in client bundle — no server entitlement check (CRIT-1) |
| `.edu` discount verified server-side | **FAIL** | `isStudentEmail()` exists but is never called — manual process only |

---

## Admin Security Review

| Check | Status | Notes |
|---|---|---|
| Admin UI requires password | PASS (weak) | Password gate exists in `AdminLogin` component |
| Admin password is secret | **FAIL** | `ADMIN_CREDS.pw` is in client bundle (CRIT-2) |
| Admin API requires authorization | PASS (weak) | `x-admin-password` header check on `/api/admin/data` |
| Admin API server-side only | PASS | API route, not client-side |
| Admin API rate limited | **FAIL** | No rate limiting (HIGH-1) |
| Admin uses service role (RLS bypass) | PASS | `createServiceClient()` correct for admin use case |
| Admin session is server-authenticated | **FAIL** | Login is client-side state only; no server session |
| Admin code excluded from public bundle | **FAIL** | All admin JS shipped to every visitor |
| Horizontal privilege escalation possible | **YES** | Any user can call admin API with the bundled password |

---

## Secrets Review

| Secret | Location | Risk | Action |
|---|---|---|---|
| `sk_live_51TdV...` (Stripe secret key) | `.env.local` | High — full Stripe account access if file exposed | Rotate immediately |
| `whsec_lsCC...` (Stripe webhook secret) | `.env.local` | High — forge any payment event | Rotate immediately |
| `eyJhbGci...service_role...` (Supabase) | `.env.local` | High — bypass all RLS | Rotate immediately |
| `Master00@` (admin password) | `LcApp.jsx` line 5393 | **Critical — in client bundle** | Remove from client; rotate |
| `pk_live_51TdV...` (Stripe publishable key) | `.env.local`, bundle | Acceptable — public by design | No action needed |
| `eyJhbGci...anon...` (Supabase anon key) | `.env.local`, bundle | Acceptable — public by design, RLS applies | No action needed |
| `mexbarajas@hotmail.com` (test email) | `.env.local` | Low — bypasses `.edu` check | Remove if `.edu` discount is unused |
| `G-1HPMLXWF51` (Google Analytics ID) | `app/layout.js` | Info — public by design | No action needed |

**No secrets were found committed to the git repository in the current HEAD.** Verify with: `git log --all --oneline -- .env.local` and `git log -S "sk_live_" --all`.

---

## Dependency Review

| Package | Vulnerability | Severity | Advisory | Recommended Action |
|---|---|---|---|---|
| `postcss < 8.5.10` (via `next@16.2.7`) | XSS in CSS stringify | Moderate | GHSA-qx2v-qp2m-jg93 | Upgrade `next` when stable release resolves this |

Run `npm audit` for a full current list. No Critical dependency vulnerabilities were found at time of review.

---

## Security Header Review

| Header | Status | Current Value / Notes |
|---|---|---|
| `Content-Security-Policy` | PARTIAL | Set, but `'unsafe-inline'` and `'unsafe-eval'` in `script-src` negate XSS protection |
| `Strict-Transport-Security` | PASS | `max-age=63072000; includeSubDomains; preload` |
| `X-Frame-Options` | PASS | `DENY` |
| `X-Content-Type-Options` | PASS | `nosniff` |
| `Referrer-Policy` | PASS | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | PASS | Camera, microphone, geolocation disabled |
| `CSP report-uri` | MISSING | No violation reporting configured |
| Secure cookies | ASSUMED | Supabase Auth SDK sets cookies — verify `Secure` and `SameSite=Lax` in browser DevTools |

---

## Prioritized Remediation Plan

### 1. Fix Immediately (Within 24 Hours)

| # | Action | Finding |
|---|---|---|
| 1 | **Rotate** Stripe secret key, webhook secret, and Supabase service role key | CRIT-3 |
| 2 | **Remove** `ADMIN_CREDS` from `LcApp.jsx` — implement server-side admin auth via Supabase session | CRIT-2 |
| 3 | **Update** Vercel environment variables with rotated secrets | CRIT-3 |
| 4 | **Audit** git history for any committed `.env` files | CRIT-3 |

### 2. Fix This Week

| # | Action | Finding |
|---|---|---|
| 5 | **Move** `LC_DATA` and `LC_VISUALS` to a server-side API route with session + plan entitlement checks | CRIT-1 |
| 6 | **Fix** middleware `catch` block to redirect to `/login` instead of allowing through | HIGH-2 |
| 7 | **Audit** Supabase RLS policies for `community_answers`, `community_questions` UPDATE permissions | HIGH-3 |
| 8 | **Add** rate limiting to `/api/admin/data` | HIGH-1 |
| 9 | **Add** DOMPurify to all `dangerouslySetInnerHTML` call sites | MED-1 |
| 10 | **Fix** admin API to exclude `session_token` from `select('*')` response | LOW-1 |

### 3. Improve Later

| # | Action | Finding |
|---|---|---|
| 11 | Implement nonce-based CSP — remove `'unsafe-inline'` and `'unsafe-eval'` | MED-2 |
| 12 | Add CSP `report-uri` endpoint for violation monitoring | INFO-4 |
| 13 | Move admin portal to a separate route/bundle excluded from public JS | INFO-3 |
| 14 | Wire `isStudentEmail()` into checkout, or remove dead code + `STUDENT_TEST_EMAIL` | MED-4 |
| 15 | Replace `view_count` client update with a `SECURITY DEFINER` Supabase function | MED-5 |
| 16 | Move Google Analytics ID to environment variable | LOW-4 |
| 17 | Add Supabase RLS policy for `view_count` column updates | MED-5 |

---

*This review was performed via static code analysis and safe local configuration inspection. No external systems were probed, no production data was accessed, and no exploits were executed.*
