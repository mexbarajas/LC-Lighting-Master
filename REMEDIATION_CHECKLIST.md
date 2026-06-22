# SECURITY REMEDIATION CHECKLIST

---

## CRITICAL ISSUES (Deploy Blockers — Complete Before Any Production Deployment)

### Phase 1: Secrets Rotation & Repository Cleanup (Target: 1-2 hours)

- [ ] **1.1 Rotate Supabase Anon Key**
  - Task: Visit `https://app.supabase.com` → Project Settings → API Keys
  - Rotate `anon public` key
  - Update `.env.local` with new key
  - Verify no builds reference old key
  - Estimated: 15 min
  - Owner: DevOps / Tech Lead
  - Validation: `grep -r "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvanFwd3dndXJvd3dkZWhyY2F5Iiwicm9sZSI6ImFub24i" .`
  
- [ ] **1.2 Rotate Supabase Service Role Key (CRITICAL)**
  - Task: Visit Supabase → Project Settings → API Keys
  - Rotate `service role` key
  - Update `.env.local`
  - Update all references in API routes (check all `process.env.SUPABASE_SERVICE_ROLE_KEY`)
  - Estimated: 20 min
  - Owner: DevOps / Tech Lead
  - Files to update: 
    - `.env.local`
    - Vercel environment variables (if deployed)
  
- [ ] **1.3 Rotate Stripe Live Secret Key**
  - Task: Visit `https://dashboard.stripe.com` → Developers → API Keys
  - Click "Roll key" on Secret Key (sk_live_*)
  - Copy new key: `sk_live_...`
  - Update `.env.local`
  - Update all Stripe API client instantiation
  - Estimated: 20 min
  - Owner: Payments Engineer / Tech Lead
  - Validation: `grep -r "sk_live_" --include="*.js" --include="*.ts" app/` (should be empty)
  
- [ ] **1.4 Rotate Stripe Webhook Secret**
  - Task: Visit Stripe Dashboard → Webhooks
  - Find webhook endpoint for `https://lightingmasterlc.com/api/stripe/webhook`
  - Click "Signing secret" → Rotate secret
  - Copy new secret: `whsec_...`
  - Update `.env.local`
  - Update all webhook signature verification code
  - Estimated: 20 min
  - Owner: Payments Engineer
  - Files: `app/api/stripe/webhook/route.js`
  
- [ ] **1.5 Regenerate Stripe Publishable Key**
  - Task: Stripe Dashboard → Developers → API Keys
  - Click "Restrict key" on Publishable Key
  - Set restrictions: Checkout Sessions → Create
  - Update `.env.local` (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  - Update frontend Stripe initialization
  - Estimated: 15 min
  - Owner: Payments Engineer

- [ ] **1.6 Remove .env.local from Git History**
  - Command: `git filter-branch --tree-filter 'rm -f .env.local' HEAD`
  - Then: `git push --force --all`
  - Verify: `git log --all --full-history --oneline -- .env.local` (should show no commits)
  - Estimated: 10 min
  - Owner: Tech Lead
  - ⚠️ WARNING: Force push — coordinate with team
  
- [ ] **1.7 Verify .env.local in .gitignore**
  - Command: `git check-ignore -v .env.local`
  - Should output: `.env.local	.gitignore:34	.env*`
  - Create fresh .env.local with new secrets (never commit)
  - Add pre-commit hook to prevent accidental commits:
    ```bash
    #!/bin/bash
    git diff --cached | grep -E "ADMIN_PASSWORD|STRIPE_SECRET|SERVICE_ROLE" && {
      echo "ERROR: Secrets detected in staged changes"
      exit 1
    }
    ```
  - Estimated: 15 min
  - Owner: DevOps / Tech Lead
  
- [ ] **1.8 Audit for Unintended Commits**
  - Command: `git log --all --source --remotes -p | grep -i "password\|secret\|key" | head -20`
  - If found, use git-filter-branch to remove
  - Notify all developers of re-based history
  - Estimated: 30 min
  - Owner: Tech Lead

---

### Phase 2: Authentication System Hardening (Target: 2-3 hours)

- [ ] **2.1 Implement Admin Session Token Validation**
  - Location: Create `lib/admin-middleware.js` or extend `lib/admin-auth.js`
  - Task: 
    ```javascript
    export function withAdminAuth(handler) {
      return async (request) => {
        const token = request.cookies.get('admin_session')?.value
        if (!token || !verifyAdminToken(token)) {
          return new Response('Unauthorized', { status: 401 })
        }
        return handler(request)
      }
    }
    ```
  - Files to modify:
    - `app/api/admin/data/route.js`
    - `app/api/admin/team/create/route.js`
    - `app/api/admin/team/invite/route.js`
    - `app/api/admin/team/revoke/route.js`
  - Test: Verify requests without valid token are rejected
  - Estimated: 1 hour
  - Owner: Backend Engineer
  - PR Review: Security team must review

- [ ] **2.2 Generate Strong Admin Password**
  - Command: `openssl rand -base64 24` or `node -e "console.log(require('crypto').randomBytes(24).toString('base64'))"`
  - Example output: `kR7mP9xK2wB4vD8nJ3sL5qQ1zU6tM9fXwP2sQ3r`
  - Store in `.env.local` ONLY (never commit): `ADMIN_PASSWORD=kR7mP...`
  - Communicate to admin via secure channel (1Password, LastPass, Signal)
  - Estimated: 10 min
  - Owner: Tech Lead

- [ ] **2.3 Implement Exponential Backoff Rate Limiting on Admin Login**
  - Package: `npm install @upstash/ratelimit`
  - Location: `app/api/admin/login/route.js`
  - Code:
    ```javascript
    import { Ratelimit } from '@upstash/ratelimit'
    
    const ratelimit = new Ratelimit({
      redis: process.env.UPSTASH_REDIS_REST_URL,
      limiter: Ratelimit.slidingWindow(5, '15 m'),  // 5 attempts per 15 min
    })
    
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const { success } = await ratelimit.limit(`login:${ip}`)
    
    if (!success) {
      return new Response('Too many attempts. Try again in 15 minutes.', { status: 429 })
    }
    ```
  - Requires: Upstash Redis account (free tier available)
  - Test: Send 6 login requests, 6th should get 429
  - Estimated: 45 min
  - Owner: Backend Engineer

- [ ] **2.4 Use Bcrypt or Argon2 for Password Hashing**
  - Package: `npm install bcryptjs` (or `argon2`)
  - Update `/api/admin/login/route.js`:
    ```javascript
    import bcrypt from 'bcryptjs'
    
    // On password change:
    const hashedPassword = await bcrypt.hash(plainPassword, 12)
    
    // On login:
    const match = await bcrypt.compare(submittedPassword, hashedPassword)
    ```
  - Store hashed password in database (new admin_credentials table)
  - Estimated: 1 hour
  - Owner: Backend Engineer
  - DB Migration: Create `admin_credentials` table with hashed password + salt

---

### Phase 3: CSRF Protection (Target: 1-2 hours)

- [ ] **3.1 Create CSRF Token Generation & Validation Library**
  - Location: `lib/csrf.ts`
  - Code:
    ```typescript
    import crypto from 'crypto'
    
    export function generateCSRFToken(sessionId: string): { token: string; hash: string } {
      const token = crypto.randomBytes(32).toString('hex')
      const hash = crypto.createHash('sha256').update(token).digest('hex')
      return { token, hash }
    }
    
    export function validateCSRFToken(token: string, hash: string): boolean {
      const computedHash = crypto.createHash('sha256').update(token).digest('hex')
      return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(computedHash))
    }
    ```
  - Estimated: 30 min
  - Owner: Backend Engineer

- [ ] **3.2 Generate CSRF Token on Admin Form Load**
  - Location: Admin dashboard components
  - Task: On form mount, fetch CSRF token from `/api/csrf-token` endpoint
  - Code:
    ```javascript
    export async function GET(request) {
      const user = await verifyAdminAuth(request)
      if (!user) return new Response('Unauthorized', { status: 401 })
      
      const { token, hash } = generateCSRFToken(user.id)
      
      // Store hash in session/Redis with 1-hour expiry
      await redis.set(`csrf:${hash}`, user.id, 'EX', 3600)
      
      return Response.json({ token })
    }
    ```
  - Estimated: 30 min
  - Owner: Backend Engineer

- [ ] **3.3 Validate CSRF Token on State-Change Admin Endpoints**
  - Endpoints to update:
    - `POST /api/admin/team/create`
    - `POST /api/admin/team/invite`
    - `POST /api/admin/team/revoke`
  - Code:
    ```javascript
    export async function POST(request) {
      const body = await request.json()
      const csrfToken = body.csrfToken
      const csrfHash = body.csrfHash
      
      // Validate token
      if (!validateCSRFToken(csrfToken, csrfHash)) {
        return new Response('CSRF validation failed', { status: 403 })
      }
      
      // Verify hash is in session (not reused)
      const storedUserId = await redis.get(`csrf:${csrfHash}`)
      if (!storedUserId) {
        return new Response('CSRF token expired or invalid', { status: 403 })
      }
      
      // Delete token after use (one-time use)
      await redis.del(`csrf:${csrfHash}`)
      
      // Proceed with request
    }
    ```
  - Estimated: 1 hour
  - Owner: Backend Engineer

- [ ] **3.4 Add CSRF Token Field to Admin Forms**
  - Update all admin form components
  - Example:
    ```html
    <form>
      <input type="hidden" name="csrfToken" value={csrfToken} />
      <input type="hidden" name="csrfHash" value={csrfHash} />
      <!-- other fields -->
    </form>
    ```
  - Estimated: 30 min
  - Owner: Frontend Engineer

---

### Phase 4: Critical Validation Fixes (Target: 2-3 hours)

- [ ] **4.1 Add Stripe Amount Verification in Webhook**
  - Location: `app/api/stripe/webhook/route.js`
  - Code:
    ```javascript
    const PLANS = {
      't1': { amount: 25000 },    // $250
      't2': { amount: 39500 },    // $395
      't3': { amount: 59500 }     // $595
    }
    
    if (event.type === 'checkout.session.completed') {
      const plan = session.metadata?.plan
      const seats = parseInt(session.metadata?.seats || '1')
      
      // Validate plan
      if (!PLANS[plan]) {
        console.error('Invalid plan:', plan)
        return new Response('Invalid plan', { status: 400 })
      }
      
      // Calculate expected amount
      const expectedAmount = plan === 'team' 
        ? PLANS[plan].amount * seats
        : PLANS[plan].amount
      
      // Verify amount matches
      if (session.amount_total !== expectedAmount) {
        console.error('Amount mismatch', {
          plan, seats, expected: expectedAmount, actual: session.amount_total
        })
        return new Response('Amount mismatch', { status: 400 })
      }
      
      // Safe to grant access
    }
    ```
  - Test: Send webhook with mismatched amount, verify rejection
  - Estimated: 45 min
  - Owner: Payments Engineer

- [ ] **4.2 Add Database Constraint for Webhook Idempotency**
  - Database migration:
    ```sql
    -- Add unique constraint on stripe_payment_intent
    ALTER TABLE subscriptions ADD CONSTRAINT unique_payment_intent UNIQUE (stripe_payment_intent);
    ```
  - Update webhook code to catch constraint violation:
    ```javascript
    const { error } = await supabase
      .from('subscriptions')
      .upsert({...}, { onConflict: 'stripe_payment_intent' })
    
    if (error?.code === '23505') {  // Unique constraint violation
      console.log('Webhook already processed')
      return new Response('Already processed', { status: 200 })
    }
    ```
  - Test: Send duplicate webhooks, verify only first succeeds
  - Estimated: 30 min
  - Owner: Backend Engineer

- [ ] **4.3 Fix Webhook Error Response Leakage**
  - Location: `app/api/stripe/webhook/route.js` line 65
  - Change:
    ```javascript
    // From:
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
    
    // To:
    return new Response('Unauthorized', { status: 401 })
    ```
  - Test: Send invalid webhook, verify generic error message
  - Estimated: 5 min
  - Owner: Backend Engineer

- [ ] **4.4 Validate Plan Parameter in Webhook**
  - Location: `app/api/stripe/webhook/route.js` line 77
  - Add validation:
    ```javascript
    const VALID_PLANS = ['t1', 't2', 't3', 'team']
    
    if (!VALID_PLANS.includes(plan)) {
      console.error('Invalid plan:', plan)
      return new Response('Invalid plan', { status: 400 })
    }
    ```
  - Test: Send webhook with invalid plan, verify rejection
  - Estimated: 10 min
  - Owner: Backend Engineer

- [ ] **4.5 Sanitize Email Templates**
  - Package: `npm install he`
  - Files to update:
    - `app/api/contact/route.ts`
    - `app/api/exam/retake/route.js`
    - `app/api/team/invite/route.js`
  - Code:
    ```javascript
    import he from 'he'
    
    htmlContent: `
      <tr><td>Name</td><td>${he.encode(name)}</td></tr>
      <tr><td>Email</td><td><a href="mailto:${he.encode(email)}">${he.encode(email)}</a></tr>
      <tr><td>Subject</td><td>${he.encode(subject)}</td></tr>
      <tr><td>Message</td><td><p>${he.encode(message)}</p></td></tr>
    `
    ```
  - Test: Submit contact form with `<script>alert('xss')</script>`, verify encoding
  - Estimated: 30 min
  - Owner: Backend Engineer

---

## HIGH SEVERITY ISSUES (Complete This Week)

### Phase 5: Dependency Security (Target: 30 min)

- [ ] **5.1 Upgrade DOMPurify**
  - Command: `npm install dompurify@latest`
  - Current: 3.4.10 (has GHSA-cmwh-pvxp-8882)
  - Target: 3.4.11+
  - Verify: `npm list dompurify` shows >=3.4.11
  - Test: Run existing sanitization tests
  - Estimated: 10 min
  - Owner: DevOps / Package Manager

- [ ] **5.2 Upgrade Next.js**
  - Command: `npm install next@latest eslint-config-next@latest`
  - Current: 16.2.7 (bundles postcss <8.5.10)
  - Target: 16.2.9+
  - Verify: `npm list next` and `npm ls postcss | grep -A1 postcss` show >=8.5.10
  - Test: `npm run build` succeeds
  - Estimated: 20 min
  - Owner: DevOps / Package Manager

---

### Phase 6: Middleware & Error Handling (Target: 1 hour)

- [ ] **6.1 Fix Middleware Auth Error Handling**
  - Location: `middleware.js` (lines 44-46)
  - Change:
    ```javascript
    // From:
    } catch {
      // If Supabase is unreachable, let the request through
    }
    
    // To:
    } catch (err) {
      console.error('Auth middleware error:', err)
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    ```
  - Test: Disable Supabase connection, verify redirect to /login
  - Estimated: 15 min
  - Owner: Backend Engineer

- [ ] **6.2 Add Admin Operations Audit Logging**
  - Create database table:
    ```sql
    CREATE TABLE admin_audit_log (
      id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      admin_id uuid NOT NULL REFERENCES auth.users(id),
      action text NOT NULL,
      resource_type text,
      resource_id text,
      details jsonb,
      ip_address inet,
      user_agent text,
      created_at timestamp DEFAULT now()
    );
    ```
  - Update admin endpoints to log actions:
    ```javascript
    await supabase.from('admin_audit_log').insert({
      admin_id: user.id,
      action: 'team_created',
      resource_type: 'team',
      resource_id: teamId,
      ip_address: request.headers.get('x-forwarded-for'),
    })
    ```
  - Files: All `/api/admin/*` routes
  - Estimated: 1 hour
  - Owner: Backend Engineer

- [ ] **6.3 Implement Rate Limiting on Admin Data Endpoint**
  - Location: `app/api/admin/data/route.js`
  - Use Upstash Ratelimit (same as login rate limiting in Phase 2.3)
  - Config: 10 requests per minute per IP
  - Test: Send 11 requests, 11th should get 429
  - Estimated: 20 min
  - Owner: Backend Engineer

---

### Phase 7: Authorization Hardening (Target: 2-3 hours)

- [ ] **7.1 Implement Role-Based Admin Authorization**
  - Create database table:
    ```sql
    CREATE TABLE admin_roles (
      id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      role text NOT NULL DEFAULT 'admin',
      granted_at timestamp DEFAULT now(),
      granted_by uuid,
      CONSTRAINT unique_admin_role UNIQUE(user_id, role)
    );
    
    CREATE POLICY "only_service_role_can_read"
      ON admin_roles
      FOR SELECT
      USING (auth.role() = 'service_role');
    ```
  - Create helper function:
    ```javascript
    export async function isAdmin(userId) {
      const { data } = await supabase
        .from('admin_roles')
        .select('id')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .single()
      return !!data
    }
    ```
  - Update all admin endpoints:
    ```javascript
    const isAdminUser = await isAdmin(user.id)
    if (!isAdminUser) {
      return new Response('Forbidden', { status: 403 })
    }
    ```
  - Estimated: 1.5 hours
  - Owner: Backend Engineer

- [ ] **7.2 Create Initial Admin User**
  - Task: Create entry in `admin_roles` table for current admin
  - Command (in Supabase): 
    ```sql
    INSERT INTO admin_roles (user_id, role)
    SELECT id, 'admin' FROM auth.users WHERE email = 'actual-admin-email@company.com';
    ```
  - Remove hardcoded `ADMIN_EMAIL` from code
  - Estimated: 15 min
  - Owner: Tech Lead

- [ ] **7.3 Implement Cryptographically Secure Team Invite Tokens**
  - Location: `app/api/team/invite/route.js`
  - Update code:
    ```javascript
    import crypto from 'crypto'
    
    // Generate token
    const token = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    
    // Store only hash in database
    await supabase.from('team_invites').insert({
      team_id: teamId,
      email: inviteeEmail,
      token_hash: tokenHash,
      expires_at: new Date(Date.now() + 7*24*60*60*1000)
    })
    
    // Send token (not hash) in email
    const joinUrl = `${siteUrl}/team/join?token=${token}`
    ```
  - Update accept logic:
    ```javascript
    // Verify token hash
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    const { data: invite } = await supabase
      .from('team_invites')
      .select('*')
      .eq('token_hash', tokenHash)
      .eq('email', userEmail)
      .eq('status', 'pending')
      .single()
    
    if (!invite) {
      return new Response('Invalid invite', { status: 400 })
    }
    ```
  - Estimated: 1 hour
  - Owner: Backend Engineer

---

## MEDIUM SEVERITY ISSUES (Complete This Sprint)

### Phase 8: Content Security & Sanitization (Target: 2-3 hours)

- [ ] **8.1 Implement Nonce-Based CSP**
  - Location: `middleware.js`
  - Code:
    ```javascript
    import crypto from 'crypto'
    
    export async function middleware(request) {
      const response = NextResponse.next()
      
      // Generate nonce for this request
      const nonce = crypto.randomBytes(16).toString('base64')
      response.headers.set('X-CSP-Nonce', nonce)
      
      // Set CSP header (remove 'unsafe-inline')
      response.headers.set('Content-Security-Policy',
        `default-src 'self'; ` +
        `script-src 'self' 'nonce-${nonce}' https://js.stripe.com; ` +
        `style-src 'self' https://fonts.googleapis.com; ` +
        `img-src 'self' data: https:; ` +
        `font-src https://fonts.gstatic.com; ` +
        `connect-src 'self' https://*.supabase.co https://api.stripe.com; ` +
        `frame-src 'self' https://js.stripe.com; ` +
        `report-uri /api/security/csp-report`
      )
      
      return response
    }
    ```
  - Update layout.js:
    ```javascript
    const nonce = headers().get('X-CSP-Nonce')
    <script nonce={nonce} dangerouslySetInnerHTML={{__html: inlineCode}} />
    ```
  - Remove `'unsafe-inline'` and `'unsafe-eval'` from CSP
  - Test: Send inline script in body, verify rejection in console
  - Estimated: 1 hour
  - Owner: Frontend/Security Engineer

- [ ] **8.2 Create CSP Violation Reporting Endpoint**
  - Location: `app/api/security/csp-report/route.js`
  - Code:
    ```javascript
    export async function POST(request) {
      const body = await request.json()
      
      // Log violation
      console.error('CSP Violation:', {
        'document-uri': body['document-uri'],
        'violated-directive': body['violated-directive'],
        'blocked-uri': body['blocked-uri'],
      })
      
      // Store for analysis
      await supabase.from('csp_violations').insert({
        document_uri: body['document-uri'],
        violated_directive: body['violated-directive'],
        blocked_uri: body['blocked-uri'],
        source_file: body['source-file'],
        timestamp: new Date()
      })
      
      return new Response('', { status: 204 })
    }
    ```
  - Estimated: 30 min
  - Owner: Backend Engineer

- [ ] **8.3 Input Length Validation on Certificate URL Params**
  - Location: `app/api/cert/route.js`
  - Code:
    ```javascript
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
  - Test: Send 10MB parameter, verify handled gracefully
  - Estimated: 20 min
  - Owner: Backend Engineer

---

### Phase 9: Privacy & Data Security (Target: 2-4 hours)

- [ ] **9.1 Review Google Analytics Consent**
  - Location: `app/layout.js`
  - Task: Add explicit consent banner before loading GA
  - Implement:
    ```javascript
    const [gaConsent, setGaConsent] = useState(false)
    
    useEffect(() => {
      if (gaConsent) {
        // Load GA script
        window.dataLayer = window.dataLayer || []
        gtag.consent('update', { analytics_storage: 'granted' })
      }
    }, [gaConsent])
    
    return (
      <>
        {!gaConsent && <AnalyticsConsentBanner onAccept={() => setGaConsent(true)} />}
        {gaConsent && <GoogleAnalyticsScript />}
      </>
    )
    ```
  - Estimated: 1 hour
  - Owner: Frontend Engineer / Privacy Officer

- [ ] **9.2 Implement Field-Level Encryption for Sensitive Data**
  - Package: `npm install tweetnacl` or use Supabase's column encryption
  - For exam answers: Encrypt before storing
    ```javascript
    import nacl from 'tweetnacl'
    
    const encryptedAnswers = nacl.secretbox(
      Buffer.from(JSON.stringify(answers)),
      nonce,
      key
    )
    
    await supabase.from('exam_sessions').insert({
      answers: Buffer.from(encryptedAnswers).toString('base64'),
    })
    ```
  - Estimated: 2 hours
  - Owner: Backend / Security Engineer

- [ ] **9.3 Set Up Data Retention & Deletion Policies**
  - Create database function:
    ```sql
    CREATE OR REPLACE FUNCTION cleanup_old_sessions()
    RETURNS void AS $$
    BEGIN
      DELETE FROM exam_sessions
      WHERE created_at < NOW() - INTERVAL '1 year'
      AND status IN ('completed', 'abandoned');
    END;
    $$ LANGUAGE plpgsql;
    
    -- Schedule via cron extension or serverless function
    SELECT cron.schedule('cleanup-sessions', '0 2 * * *', 'SELECT cleanup_old_sessions()');
    ```
  - Document in privacy policy: "Exam data retained for 1 year, then deleted"
  - Estimated: 1 hour
  - Owner: Backend Engineer / Privacy Officer

- [ ] **9.4 Implement Email Lookups via User ID (Not Direct Email)**
  - Update refund handler in webhook:
    ```javascript
    // Primary lookup: stripe_customer_id
    if (charge.customer) {
      const { error } = await supabase
        .from('subscriptions')
        .update(revokePayload)
        .eq('stripe_customer_id', charge.customer)
    }
    
    // Secondary: payment_intent
    if (!updated && charge.payment_intent) {
      const { error } = await supabase
        .from('subscriptions')
        .update(revokePayload)
        .eq('stripe_payment_intent', charge.payment_intent)
    }
    
    // Don't use email for lookups (mutable, many-to-one)
    ```
  - Estimated: 30 min
  - Owner: Payments Engineer

---

### Phase 10: Testing & Validation (Target: 4-6 hours)

- [ ] **10.1 Create Security-Focused Unit Tests**
  - Test: Admin token validation
    ```javascript
    test('admin endpoint rejects requests without valid token', async () => {
      const res = await POST('/api/admin/data', { noToken: true })
      expect(res.status).toBe(401)
    })
    ```
  - Test: CSRF protection
    ```javascript
    test('POST without CSRF token is rejected', async () => {
      const res = await POST('/api/admin/team/create', { noCsrf: true })
      expect(res.status).toBe(403)
    })
    ```
  - Test: Webhook amount verification
    ```javascript
    test('webhook with mismatched amount is rejected', async () => {
      const webhook = constructEvent(mismatcedAmountPayload, sig, secret)
      const res = await POST('/api/stripe/webhook', webhook)
      expect(res.status).toBe(400)
    })
    ```
  - Estimated: 2 hours
  - Owner: QA Engineer / Backend Engineer

- [ ] **10.2 Create Integration Tests**
  - Test full admin workflow (login → CSRF → create team → audit log)
  - Test full payment workflow (checkout → webhook → access granted)
  - Test full refund workflow (refund event → access revoked)
  - Estimated: 2 hours
  - Owner: QA Engineer

- [ ] **10.3 Perform Manual Security Testing**
  - [ ] Attempt admin operations without session token
  - [ ] Attempt CSRF attacks using curl/postman
  - [ ] Send malicious email content
  - [ ] Try rate limit evasion
  - [ ] Verify CSP blocks inline scripts
  - [ ] Confirm gitignore prevents .env.local commits
  - Estimated: 2 hours
  - Owner: Security Engineer

---

## METRICS & VALIDATION

### Pre-Deployment Checklist
- [ ] All CRITICAL issues resolved
- [ ] All HIGH issues resolved
- [ ] Security tests passing (100% coverage of critical paths)
- [ ] Dependency vulnerabilities resolved (`npm audit` shows 0 critical/high)
- [ ] Git history cleaned (.env.local not in any commit)
- [ ] Secrets rotated and verified in production systems
- [ ] Code review approved by 2+ senior engineers
- [ ] Penetration test (internal or external) passed
- [ ] Security audit report signed off by CTO/Security Lead

### Post-Deployment Monitoring
- [ ] Monitor admin audit logs for unauthorized access
- [ ] Monitor CSP violation reports for injection attempts
- [ ] Monitor unmatched refund webhook events
- [ ] Monitor rate limiting metrics
- [ ] Monitor error logs for sensitive data leakage
- [ ] Weekly security log review
- [ ] Monthly dependency updates
- [ ] Quarterly penetration testing

---

## Timeline Summary

| Phase | Issues | Duration | Dependencies |
|-------|--------|----------|--------------|
| Phase 1-2 | CRIT-1,2 | 3-4h | None |
| Phase 3 | CRIT-4 | 2-3h | Phase 1 complete |
| Phase 4 | CRIT-1,3 HIGH-1,2,3 | 3-4h | Phase 1 complete |
| Phase 5 | HIGH-7,8 | 30m | None (parallel) |
| Phase 6 | HIGH-4 MED-10 | 1-2h | Phase 2 complete |
| Phase 7 | CRIT-5 HIGH-6 | 2-3h | Phase 1,3 complete |
| Phase 8 | MED-3,9 | 2-3h | None (parallel) |
| Phase 9 | MED-1,2,7 | 2-4h | Phase 1 complete |
| Phase 10 | Testing | 4-6h | All phases complete |
| **TOTAL** | **24 issues** | **20-30h** | **See dependencies** |

---

## Risk Management

### If Deployment Needed Before Full Remediation

**Minimum Deployable State:**
- ✅ Phase 1 (Secrets rotation) — CRITICAL
- ✅ Phase 2 (Admin token validation) — CRITICAL
- ✅ Phase 5 (Dependency updates) — HIGH
- ⚠️ Phase 3 (CSRF) — Can deploy with mitigation (SameSite=Strict)
- ⚠️ Phase 4.1 (Webhook amount verification) — CRITICAL for payments
- ❌ Phase 7 (Role-based auth) — Cannot deploy without

**Mitigation Strategies:**
- Keep app in private beta (limited users)
- Require MFA for admin operations
- Monitor all admin actions closely
- Keep detailed backup of database
- Implement manual payment verification process
- Have immediate rollback plan ready

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Security Lead | _____ | _____ | _____ |
| Engineering Lead | _____ | _____ | _____ |
| Product Lead | _____ | _____ | _____ |
| CTO / Tech Lead | _____ | _____ | _____ |

---

**Report Date:** June 22, 2026  
**Estimated Completion:** June 29-30, 2026  
**Priority Level:** CRITICAL — Do Not Deploy Without Completion of Phase 1-4
