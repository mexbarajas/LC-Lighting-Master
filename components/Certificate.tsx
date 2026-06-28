'use client'

import { useRef, useState, useCallback } from 'react'

interface CertificateProps {
  studentName: string
  issuedDate?: string
}

const CERT_BG =
  'https://res.cloudinary.com/dreuglb2j/image/upload/v1781724634/certificate_bx5krp.png'

// Vertical position of the recipient name (fraction of canvas height)
// 0.50 = just below the vertical midpoint, in the AWARDED TO zone
const NAME_Y = 0.50

// Date value position — bottom-left DATE slot in the footer bar
const DATE_X = 0.232
const DATE_Y = 0.893

const MAX_LEN = 60
const SERIF   = '"Cormorant Garamond", Georgia, serif'

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

// Shrink font size until text fits within maxWidth
function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  startSize: number
): number {
  let size = startSize
  ctx.font = `700 ${size}px ${SERIF}`
  while (ctx.measureText(text).width > maxWidth && size > 24) {
    size -= 2
    ctx.font = `700 ${size}px ${SERIF}`
  }
  return size
}

export default function Certificate({ studentName, issuedDate }: CertificateProps) {
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
        img.onload  = () => res()
        img.onerror = () => rej(new Error('Certificate image failed to load'))
        img.src = CERT_BG
      })

      const canvas = document.createElement('canvas')
      canvas.width  = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)

      ctx.fillStyle    = '#0D3135'
      ctx.textBaseline = 'middle'

      // ── Recipient name — auto-shrink to fit 66% of canvas width ──
      ctx.textAlign = 'center'
      const maxNameWidth = canvas.width * 0.66
      const startSize    = Math.round(canvas.width * 0.038)
      fitText(ctx, name, maxNameWidth, startSize)
      ctx.fillText(name, canvas.width / 2, canvas.height * NAME_Y)

      // ── Completion date ──
      const dateStr = issuedDate ||
        new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      ctx.font      = `400 ${Math.round(canvas.width * 0.012)}px ${SERIF}`
      ctx.textAlign = 'center'
      ctx.fillText(dateStr, canvas.width * DATE_X, canvas.height * DATE_Y)

      const link     = document.createElement('a')
      link.download  = safeFilename(name)
      link.href      = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.error('[Certificate] download failed:', err)
      alert('Download failed — please try again.')
    } finally {
      setBusy(false)
    }
  }, [name, issuedDate])

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
        {/* Preview overlay — matches NAME_Y */}
        <div
          className="absolute pointer-events-none"
          style={{
            top:        `${NAME_Y * 100}%`,
            left:       '50%',
            transform:  'translate(-50%, -50%)',
            whiteSpace: 'nowrap',
            fontFamily: SERIF,
            fontWeight: 700,
            fontSize:   '2.2vw',
            color:      '#0D3135',
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
