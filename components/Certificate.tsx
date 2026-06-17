'use client'

import { useRef, useState, useCallback } from 'react'

interface CertificateProps {
  studentName: string
}

const CERT_BG =
  'https://res.cloudinary.com/dreuglb2j/image/upload/v1781724634/certificate_bx5krp.png'

const NAME_Y = 0.70
const NAME_VW = 2.5
const NAME_SCALE = 0.025
const MAX_LEN = 60

function cleanName(raw: string): string {
  return Array.from(raw ?? '')
    .filter(ch => {
      const cp = ch.codePointAt(0) ?? 0
      if (cp <= 0x1f || (cp >= 0x7f && cp <= 0x9f)) return false
      if (cp >= 0x202a && cp <= 0x202e) return false
      if (cp >= 0x2066 && cp <= 0x2069) return false
      return true
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_LEN)
}

function safeFilename(name: string): string {
  const base = name.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '')
  return `LC_Certificate_${base || 'student'}.png`
}

export default function Certificate({ studentName }: CertificateProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState(false)

  const name = cleanName(studentName)

  const download = useCallback(async () => {
    if (!name) {
      alert('No name to display on the certificate.')
      return
    }
    setBusy(true)
    try {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      await new Promise<void>((res, rej) => {
        img.onload = () => res()
        img.onerror = () => rej(new Error('Certificate image failed to load'))
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
      ctx.fillText(name, canvas.width / 2, canvas.height * NAME_Y)

      const link = document.createElement('a')
      link.download = safeFilename(name)
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.error('[Certificate] download failed:', err)
      alert('Download failed — please try again.')
    } finally {
      setBusy(false)
    }
  }, [name])

  if (!name) {
    return (
      <div className="text-sm text-[#8a7a6a] py-8 text-center">
        Certificate unavailable — missing display name.
      </div>
    )
  }

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
          {name}
        </div>
      </div>

      <button
        onClick={download}
        disabled={busy}
        className="px-8 py-3 rounded-lg bg-[#0D3135] text-white text-sm font-semibold hover:bg-[#0a2529] active:scale-95 transition disabled:opacity-50"
      >
        {busy ? 'Generating…' : 'Download Certificate'}
      </button>
    </div>
  )
}
