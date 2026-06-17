/**
 * /components/Certificate.tsx
 *
 * The Cloudinary image IS the certificate. We only overlay the name, centered.
 */

'use client'

import { useRef, useState, useCallback } from 'react'

interface CertificateProps {
  studentName: string
}

const CERT_BG =
  'https://res.cloudinary.com/dreuglb2j/image/upload/v1781724634/certificate_bx5krp.png'

export default function Certificate({ studentName }: CertificateProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState(false)

  // Download: paint image + name to a canvas, export PNG.
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

      // Name centered, sized relative to image width
      ctx.fillStyle = '#0D3135'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = `700 ${img.naturalWidth * 0.05}px "Cormorant Garamond", Georgia, serif`
      ctx.fillText(studentName, canvas.width / 2, canvas.height / 2)

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
      {/* Certificate: image background + centered name overlay */}
      <div ref={wrapRef} className="relative w-full">
        <img
          src={CERT_BG}
          alt="Certificate"
          crossOrigin="anonymous"
          draggable={false}
          className="w-full h-auto block rounded shadow-lg"
        />
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{
            fontFamily: '"Cormorant Garamond", Georgia, serif',
            fontWeight: 700,
            fontSize: '5vw',
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
