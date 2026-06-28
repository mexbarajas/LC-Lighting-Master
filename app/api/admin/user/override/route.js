import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

const SITE_ADMIN_EMAILS = ['admin@luxartmedia.com', 'mexbarajas@hotmail.com']

export async function POST(req) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!SITE_ADMIN_EMAILS.includes(user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let body
    try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }

    const { user_id, plan, exam_addon } = body
    if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 })

    const validPlans = ['free', 't1', 't2', 't3']
    if (!validPlans.includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan. Must be free, t1, t2, or t3.' }, { status: 400 })
    }

    const admin = createAdminClient()

    const examAddonValue = typeof exam_addon === 'boolean'
      ? exam_addon
      : ['t1', 't2', 't3'].includes(plan)

    const { error } = await admin
      .from('subscriptions')
      .upsert(
        {
          user_id,
          plan,
          exam_addon: examAddonValue,
          status: 'active',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )

    if (error) {
      console.error('[admin/user/override] update error:', error)
      return NextResponse.json({ error: 'Failed to save: ' + error.message }, { status: 500 })
    }

    console.log(`[admin/user/override] ${user.email} set ${user_id} -> plan=${plan}, exam=${examAddonValue}`)
    return NextResponse.json({ success: true, plan, exam_addon: examAddonValue })
  } catch (err) {
    console.error('[admin/user/override] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
