/**
 * /components/Certificate.tsx
 *
 * The Cloudinary image IS the certificate. We only overlay the display name.
 *
 * Usage — pass the user's profile display name:
 *   <Certificate studentName={user.user_metadata.full_name} />
 *   <Certificate studentName={profile.displayName} />
 */

'use client'

import { useRef, useState, useCallback } from 'react'

interface CertificateProps {
  /** The user's Display Name from their profile */
  studentName: string
}

const CERT_BG =
  'https://res.cloudinary.com/dreuglb2j/image/upload/v1781724634/certificate_bx5krp.png'

// Vertical center of the name: 65% down
const NAME_Y = 0.65
// On-screen font size as % of image width (was 5vw → now 2.5vw, 50% smaller)
const NAME_VW = 2.5
// Canvas font size as fraction of image width (was 0.05 → now 0.025)
const NAME_SCALE = 0.025

export default function Certificate({ studentName }: CertificateProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState(false)

  const download = useCallback(async () => {
    setBusy(true)
    try {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      await new Promise<void>((res, rej) => {
        img.onload = () => res()
        img.onerror = () => rej(new Error('image load failed'))
        img.src = CERT_BG
      })

      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)

      ctx.fillStyle = '#0D3135'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = `700 ${img.naturalWidth * NAME_SCALE}px "Cormorant Garamond", Georgia, serif`
      ctx.fillText(studentName, canvas.width / 2, canvas.height * NAME_Y)

      const link = document.createElement('a')
      link.download = `LC_Certificate_${studentName.replace(/\s+/g, '_')}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch {
      alert('Download failed — try again.')
    } finally {
      setBusy(false)
    }
  }, [studentName])

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div ref={wrapRef} className="relative w-full">
        <img
          src={CERT_BG}
          alt="Certificate"
          crossOrigin="anonymous"
          draggable={false}
          className="w-full h-auto block rounded shadow-lg"
        />
        {/* Display name — centered horizontally, 70% down vertically */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: `${NAME_Y * 100}%`,
            left: '50%',
            transform: 'translate(-50%, -50%)',
            whiteSpace: 'nowrap',
            fontFamily: '"Cormorant Garamond", Georgia, serif',
            fontWeight: 700,
            fontSize: `${NAME_VW}vw`,
            color: '#0D3135',
          }}
        >
          {studentName}
        </div>
      </div>

      <button
        onClick={download}
        disabled={busy}
        className="px-8 py-3 rounded-lg bg-[#0D3135] text-white text-sm font-semibold
                   hover:bg-[#0a2529] active:scale-95 transition disabled:opacity-50"
      >
        {busy ? 'Generating…' : 'Download Certificate'}
      </button>
    </div>
  )
}
