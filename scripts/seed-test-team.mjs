import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const OWNER_ID = '1688caa2-96e9-4e25-8bbb-9215c0d489a0' // admin@luxartmedia.com

const members = [
  { email: 'sarah.chen@brightpath.com',   name: 'Sarah Chen',   role: 'team_admin',  exam: false, status: 'active',      addon: false },
  { email: 'marcus.bell@brightpath.com',  name: 'Marcus Bell',  role: 'team_member', exam: false, status: 'active',      addon: false },
  { email: 'priya.nair@brightpath.com',   name: 'Priya Nair',   role: 'team_member', exam: true,  status: 'active',      addon: true  },
  { email: 'james.okafor@brightpath.com', name: 'James Okafor', role: 'team_member', exam: false, status: 'active',      addon: false },
  { email: 'elena.rossi@brightpath.com',  name: 'Elena Rossi',  role: 'team_member', exam: false, status: 'deactivated', addon: false },
  { email: 'david.kim@brightpath.com',    name: 'David Kim',    role: 'team_member', exam: false, status: 'active',      addon: false },
]

async function run() {
  // 1. Create the team
  const { data: team, error: teamErr } = await supabase
    .from('teams')
    .insert({
      owner_id: OWNER_ID,
      tier: 'team',
      seat_count: 8,
      seats_purchased: 8,
      plan_type: 'course_only',
      price_per_seat: 349,
      total_team_price: 2792,
      access_expiry: '2026-12-31',
      stripe_ref: 'pi_test_fake_team_002',
    })
    .select('id')
    .single()

  if (teamErr) { console.error('Team create failed:', teamErr); process.exit(1) }
  console.log('Created team:', team.id)

  // 2. Create auth users + team_members for each fake member
  for (const m of members) {
    // Create auth user (confirmed, random password — these are test accounts)
    const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
      email: m.email,
      email_confirm: true,
      password: 'TestPass!' + Math.random().toString(36).slice(2, 10),
      user_metadata: { full_name: m.name },
    })

    if (authErr) {
      // If user already exists, look them up
      if (authErr.message?.includes('already')) {
        const { data: list } = await supabase.auth.admin.listUsers()
        const existing = list?.users?.find(u => u.email === m.email)
        if (!existing) { console.error('Could not resolve existing user', m.email); continue }
        authUser.user = existing
      } else {
        console.error('Auth create failed for', m.email, authErr); continue
      }
    }

    const userId = authUser.user.id

    // Insert team_members row
    const { error: memErr } = await supabase.from('team_members').insert({
      team_id: team.id,
      user_id: userId,
      email: m.email,
      display_name: m.name,
      role: m.role,
      license_type: 'course_only',
      has_exam_access: m.exam,
      exam_access_source: m.addon ? 'member_add_on' : 'none',
      member_exam_add_on_paid: m.addon,
      member_exam_add_on_payment_id: m.addon ? 'pi_test_addon_priya' : null,
      status: m.status,
      deactivated_at: m.status === 'deactivated' ? new Date(Date.now() - 5*86400000).toISOString() : null,
    })

    if (memErr) console.error('Member insert failed for', m.email, memErr)
    else console.log('Added member:', m.email)
  }

  // 3. One pending invite
  const token = [...crypto.getRandomValues(new Uint8Array(32))].map(b => b.toString(16).padStart(2,'0')).join('')
  await supabase.from('team_invites').insert({
    team_id: team.id,
    email: 'newhire@brightpath.com',
    token,
    status: 'pending',
    invited_by: OWNER_ID,
    expires_at: new Date(Date.now() + 12*86400000).toISOString(),
  })
  console.log('Added pending invite: newhire@brightpath.com')

  console.log('\nDone. Test team ready:', team.id)
}

run()
