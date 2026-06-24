import { Suspense } from 'react'
import TeamJoinClient from './TeamJoinClient'

export default function JoinPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#F2E6DA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#7A9688', fontFamily: 'system-ui' }}>Loading…</p>
      </div>
    }>
      <TeamJoinClient />
    </Suspense>
  )
}
