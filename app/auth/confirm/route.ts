import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') || '/reset-password'

  if (token_hash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })
    if (!error) {
      // When confirming email for a team invite, append ?confirmed=true so the
      // join page can auto-trigger acceptance without requiring a button click.
      const redirectPath = next.includes('/team/join')
        ? (next.includes('?') ? `${next}&confirmed=true` : `${next}?confirmed=true`)
        : next
      return NextResponse.redirect(`${origin}${redirectPath}`)
    }
    console.error('[auth/confirm] verifyOtp failed:', error.message)
  }

  return NextResponse.redirect(`${origin}/reset-password?error=expired`)
}
