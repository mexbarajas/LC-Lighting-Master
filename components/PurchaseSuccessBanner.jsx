'use client'

import { useEffect } from 'react'

export default function PurchaseSuccessBanner() {
  useEffect(() => {
    // Strip the purchase param so a refresh doesn't re-show the banner
    const url = new URL(window.location.href)
    url.searchParams.delete('purchase')
    url.searchParams.delete('plan')
    window.history.replaceState({}, '', url.toString())
  }, [])

  return (
    <div style={{
      background: 'rgba(45,74,62,0.08)',
      border: '1px solid #2d4a3e',
      borderRadius: 10,
      padding: '16px 20px',
      marginBottom: 24,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    }}>
      <span style={{ fontSize: 20 }}>🎉</span>
      <div>
        <div style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 700, fontSize: 14, color: '#2d4a3e', marginBottom: 2,
        }}>
          Payment confirmed — your access is now active!
        </div>
        <div style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 12, color: '#8a7a6a',
        }}>
          Your plan has been unlocked. Open the course to start studying.
        </div>
      </div>
    </div>
  )
}
