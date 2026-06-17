/**
 * /app/certificates/[id]/page.tsx
 *
 * Next.js 15 server component. Closes the HIGH (access control) and
 * LOW (display-name sourcing) findings from the OWASP audit.
 *
 * Defense in depth:
 *   1. UUID format guard      → reject malformed ids before any DB call
 *   2. Server-side auth       → must be signed in
 *   3. Ownership-scoped query → row is fetched WHERE user_id = auth uid
 *   4. RLS in Supabase        → enforced again at the database layer
 *   5. notFound() for all     → missing AND unauthorized return the SAME 404,
 *      failure modes            so an attacker cannot enumerate which ids exist
 */

import { notFound } from 'next/navigation'
import { Cormorant_Garamond, Inter } from 'next/font/google'
import { createClient } from '@/lib/supabase/server'
import Certificate from '@/components/Certificate'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'], weight: ['700'], variable: '--font-cormorant', display: 'swap',
})
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })

// RFC 4122 UUID — blocks path tricks and pointless DB lookups on junk ids.
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

interface PageProps {
  params: Promise<{ id: string }>
}

interface CertRow {
  id: string
  student_name: string | null
  full_name: string | null
  created_at: string
}

export default async function CertificatePage({ params }: PageProps) {
  const { id } = await params

  // 1. Reject anything that isn't a well-formed UUID.
  if (!UUID_RE.test(id)) notFound()

  const supabase = await createClient()

  // 2. Require an authenticated user.
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) notFound()

  // 3. Fetch the certificate scoped to THIS user. Even if RLS were
  //    misconfigured, the explicit user_id filter prevents cross-user reads.
  const { data, error } = await supabase
    .from('certificates')
    .select('id, student_name, full_name, created_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .single<CertRow>()

  // 4. Missing OR not-owned → identical 404. No existence leak.
  if (error || !data) notFound()

  // 5. Display Name source of truth: full_name first, then student_name,
  //    then the auth metadata. Never the email local-part.
  const displayName =
    data.full_name?.trim() ||
    data.student_name?.trim() ||
    (user.user_metadata?.full_name as string | undefined)?.trim() ||
    ''

  if (!displayName) notFound()

  return (
    <main
      className={`${cormorant.variable} ${inter.variable}
        min-h-screen bg-[#f5f0e8] flex flex-col items-center px-4 py-12 md:py-16`}
    >
      <header className="w-full max-w-5xl mb-8 text-center">
        <p className="text-xs font-mono tracking-[0.22em] uppercase text-[#8a7a6a] mb-2">
          LC · Lighting Master
        </p>
        <h1 className="text-2xl font-semibold text-[#16120e]">Certificate of Completion</h1>
      </header>

      <div className="w-full max-w-5xl">
        <Certificate studentName={displayName} />
      </div>

      <p className="mt-8 text-xs text-[#8a7a6a] text-center max-w-md">
        Issued by Luxart LLC · Verify at{' '}
        <a href="https://lightingmasterlc.com" target="_blank" rel="noopener noreferrer"
           className="underline hover:text-[#16120e] transition-colors">
          lightingmasterlc.com
        </a>
      </p>
    </main>
  )
}
