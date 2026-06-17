import { NextResponse } from 'next/server'
import satori from 'satori'
import sharp from 'sharp'
import React from 'react'

// Node.js runtime — needs sharp + fs
export const runtime = 'nodejs'

const W = 1240
const H = 826
const GOLD = '#C9A87C'
const TEAL = '#1E3A34'
const CREAM = '#F5EFE6'
const INK = '#16120e'

/* Fetch a Google Font as TTF ArrayBuffer via the CSS1 API (returns TTF links) */
async function loadFont(family, weight = 400) {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css?family=${encodeURIComponent(family)}:${weight}&subset=latin`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; bot)' } }
    ).then(r => r.text())
    const url = css.match(/url\(([^)]+\.ttf)\)/)?.[1]
    if (!url) return null
    const buf = await fetch(url).then(r => r.arrayBuffer())
    return buf
  } catch {
    return null
  }
}

function CertSvg({ firstName, lastName, issuedDate }) {
  const gold  = GOLD
  const teal  = TEAL
  const cream = CREAM

  return React.createElement('div', {
    style: {
      width: W, height: H,
      display: 'flex',
      background: `linear-gradient(150deg, #FAF5EE 0%, #F2EAD9 60%, #EBE0CA 100%)`,
      position: 'relative',
      fontFamily: '"DM Serif Display", Georgia, serif',
    }
  },

    /* ── Outer gold border ── */
    React.createElement('div', { style: {
      position: 'absolute', inset: 18,
      border: `2px solid ${gold}`,
      display: 'flex',
    }}),

    /* ── Inner cream mat ── */
    React.createElement('div', { style: {
      position: 'absolute', inset: 22,
      border: `8px solid ${cream}`,
      display: 'flex',
    }}),

    /* ── Top-left teal corner block ── */
    React.createElement('div', { style: {
      position: 'absolute', top: 0, left: 0,
      display: 'flex', flexDirection: 'column',
    }},
      React.createElement('div', { style: { width: 180, height: 3, background: teal, display: 'flex' } }),
      React.createElement('div', { style: { width: 3, height: 140, background: teal, display: 'flex' } }),
    ),
    /* inner gold accent */
    React.createElement('div', { style: {
      position: 'absolute', top: 34, left: 34,
      width: 52, height: 52,
      borderTop: `1.5px solid ${gold}`,
      borderLeft: `1.5px solid ${gold}`,
      display: 'flex',
    }}),

    /* ── Bottom-right teal corner block ── */
    React.createElement('div', { style: {
      position: 'absolute', bottom: 0, right: 0,
      display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
    }},
      React.createElement('div', { style: { width: 3, height: 140, background: teal, display: 'flex' } }),
      React.createElement('div', { style: { width: 180, height: 3, background: teal, display: 'flex' } }),
    ),
    /* inner gold accent */
    React.createElement('div', { style: {
      position: 'absolute', bottom: 34, right: 34,
      width: 52, height: 52,
      borderBottom: `1.5px solid ${gold}`,
      borderRight: `1.5px solid ${gold}`,
      display: 'flex',
    }}),

    /* ── Blueprint SVG background ── */
    React.createElement('svg', {
      style: { position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.04 },
      viewBox: `0 0 ${W} ${H}`,
    },
      /* horizontal lines */
      ...[80,160,240,320,400,480,560,640,720].map(y =>
        React.createElement('line', { key: `h${y}`, x1: 0, y1: y, x2: W, y2: y, stroke: teal, strokeWidth: 1 })
      ),
      /* vertical lines */
      ...[120,240,360,480,600,720,840,960,1080,1200].map(x =>
        React.createElement('line', { key: `v${x}`, x1: x, y1: 0, x2: x, y2: H, stroke: teal, strokeWidth: 1 })
      ),
      /* building outline right */
      React.createElement('rect', { x: 840, y: 200, width: 200, height: 400, fill: 'none', stroke: teal, strokeWidth: 1.5 }),
      React.createElement('rect', { x: 878, y: 258, width: 50, height: 80, fill: 'none', stroke: teal, strokeWidth: 1 }),
      React.createElement('rect', { x: 958, y: 258, width: 50, height: 80, fill: 'none', stroke: teal, strokeWidth: 1 }),
      React.createElement('rect', { x: 910, y: 468, width: 60, height: 132, fill: 'none', stroke: teal, strokeWidth: 1 }),
      React.createElement('line', { x1: 840, y1: 390, x2: 1040, y2: 390, stroke: teal, strokeWidth: 0.8 }),
      /* pendant lights left */
      React.createElement('line', { x1: 110, y1: 0, x2: 110, y2: 180, stroke: teal, strokeWidth: 1 }),
      React.createElement('ellipse', { cx: 110, cy: 198, rx: 18, ry: 10, fill: 'none', stroke: teal, strokeWidth: 1 }),
      React.createElement('line', { x1: 180, y1: 0, x2: 180, y2: 120, stroke: teal, strokeWidth: 1 }),
      React.createElement('ellipse', { cx: 180, cy: 136, rx: 14, ry: 8, fill: 'none', stroke: teal, strokeWidth: 1 }),
      React.createElement('line', { x1: 246, y1: 0, x2: 246, y2: 155, stroke: teal, strokeWidth: 1 }),
      React.createElement('ellipse', { cx: 246, cy: 169, rx: 11, ry: 6, fill: 'none', stroke: teal, strokeWidth: 1 }),
    ),

    /* ── Photometric polar diagram — top-right ── */
    React.createElement('svg', {
      style: { position: 'absolute', top: 28, right: 28, opacity: 0.7 },
      viewBox: '0 0 200 190', width: 200, height: 190,
    },
      ...[35,70,105,140].map(r =>
        React.createElement('path', {
          key: r,
          d: `M ${100 - r} 180 A ${r} ${r} 0 0 1 ${100 + r} 180`,
          fill: 'none', stroke: gold, strokeWidth: 0.7, opacity: 0.6,
        })
      ),
      React.createElement('line', { x1: 100, y1: 180, x2: 100, y2: 10, stroke: gold, strokeWidth: 0.7, opacity: 0.5 }),
      React.createElement('line', { x1: 100, y1: 180, x2: 174, y2: 87, stroke: gold, strokeWidth: 0.7, opacity: 0.5 }),
      React.createElement('line', { x1: 100, y1: 180, x2: 26, y2: 87, stroke: gold, strokeWidth: 0.7, opacity: 0.5 }),
      React.createElement('path', {
        d: 'M 100 180 C 78 150, 52 122, 64 88 C 76 54, 100 18, 100 18 C 100 18, 124 54, 136 88 C 148 122, 122 150, 100 180 Z',
        fill: `rgba(201,168,124,0.12)`, stroke: gold, strokeWidth: 2,
      }),
      React.createElement('text', { x: 103, y: 148, fontSize: 7, fill: '#8a7a6a', fontFamily: 'monospace' }, '1500'),
      React.createElement('text', { x: 103, y: 110, fontSize: 7, fill: '#8a7a6a', fontFamily: 'monospace' }, '3000'),
      React.createElement('text', { x: 103, y: 72, fontSize: 7, fill: '#8a7a6a', fontFamily: 'monospace' }, '4500'),
      React.createElement('text', { x: 103, y: 34, fontSize: 7, fill: '#8a7a6a', fontFamily: 'monospace' }, '6000'),
    ),

    /* ── Main content ── */
    React.createElement('div', {
      style: {
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '52px 110px 40px',
      }
    },

      /* Logo row */
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 } },
        React.createElement('div', { style: {
          width: 34, height: 34, borderRadius: 7,
          background: teal,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: '"Inter", sans-serif', fontWeight: 800, fontSize: 11,
          color: gold,
        }}, 'LC'),
        React.createElement('div', { style: { display: 'flex', flexDirection: 'column' } },
          React.createElement('div', { style: {
            fontFamily: '"Inter", sans-serif', fontWeight: 700, fontSize: 13,
            color: teal, letterSpacing: '0.24em',
          }}, 'LC · LIGHTING MASTER'),
          React.createElement('div', { style: {
            fontFamily: '"Inter", sans-serif', fontSize: 8, color: '#8a7a6a', letterSpacing: '0.22em', marginTop: 2,
          }}, 'BY LUXART LLC'),
        ),
      ),

      /* Certificate of Completion */
      React.createElement('div', { style: {
        fontFamily: '"Inter", sans-serif', fontSize: 11,
        letterSpacing: '0.32em', color: gold, marginBottom: 16,
      }}, 'CERTIFICATE OF COMPLETION'),

      /* Gold divider */
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', width: '68%', marginBottom: 16 } },
        React.createElement('div', { style: { flex: 1, height: 1, background: `linear-gradient(to left, ${gold}, transparent)` } }),
        React.createElement('div', { style: { color: gold, margin: '0 14px', fontSize: 10 } }, '◆'),
        React.createElement('div', { style: { flex: 1, height: 1, background: `linear-gradient(to right, ${gold}, transparent)` } }),
      ),

      /* Title */
      React.createElement('div', { style: {
        fontSize: 52, fontWeight: 400, color: '#1A3230',
        lineHeight: 1.05, marginBottom: 8, textAlign: 'center',
      }}, 'Certified Lighting Designer'),

      React.createElement('div', { style: {
        fontFamily: '"Inter", sans-serif', fontSize: 10,
        letterSpacing: '0.34em', color: '#8a7a6a', marginBottom: 20,
      }}, 'EXAM PREPARATION'),

      /* Awarded To */
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', width: '50%', marginBottom: 16 } },
        React.createElement('div', { style: { flex: 1, height: 1, background: gold, opacity: 0.5 } }),
        React.createElement('div', { style: {
          fontFamily: '"Inter", sans-serif', fontSize: 9,
          letterSpacing: '0.28em', color: gold, margin: '0 14px', whiteSpace: 'nowrap',
        }}, 'AWARDED TO'),
        React.createElement('div', { style: { flex: 1, height: 1, background: gold, opacity: 0.5 } }),
      ),

      /* Name — two lines */
      React.createElement('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 10 } },
        React.createElement('div', { style: { fontSize: 78, fontWeight: 400, color: INK, lineHeight: 1.0 } }, firstName),
        React.createElement('div', { style: { fontSize: 78, fontWeight: 400, color: INK, lineHeight: 1.0 } }, lastName),
      ),

      /* Diamond */
      React.createElement('div', { style: { color: gold, fontSize: 12, marginBottom: 16 } }, '◆'),

      /* Body */
      React.createElement('div', { style: {
        fontFamily: '"Inter", sans-serif', fontSize: 14, lineHeight: 1.75,
        color: '#5a4a3a', textAlign: 'center', maxWidth: 520, marginBottom: 0,
      }},
        'For completing all 74 lessons across 12 modules and passing the practice exam, earning 24 CEU contact hours of professional development.'
      ),

      /* Spacer */
      React.createElement('div', { style: { flex: 1 } }),

      /* Bottom bar */
      React.createElement('div', { style: {
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 64, width: '75%',
        borderTop: `1px solid rgba(201,168,124,0.5)`,
        paddingTop: 22,
      }},
        /* Date */
        React.createElement('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center' } },
          React.createElement('div', { style: {
            fontFamily: '"Inter", sans-serif', fontSize: 8,
            letterSpacing: '0.24em', color: '#8a7a6a', marginBottom: 5,
          }}, 'DATE'),
          React.createElement('div', { style: {
            fontFamily: '"Inter", sans-serif', fontWeight: 600,
            fontSize: 13, color: INK,
          }}, issuedDate),
        ),
        /* Seal */
        React.createElement('div', { style: {
          width: 70, height: 70, borderRadius: '50%',
          background: teal, border: `2.5px solid ${gold}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: '"Inter", sans-serif', fontWeight: 800, fontSize: 20,
          color: gold, flexShrink: 0,
        }}, 'LC'),
        /* Website */
        React.createElement('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center' } },
          React.createElement('div', { style: {
            fontFamily: '"Inter", sans-serif', fontSize: 8,
            letterSpacing: '0.24em', color: '#8a7a6a', marginBottom: 5,
          }}, 'PROVIDED BY'),
          React.createElement('div', { style: {
            fontFamily: '"Inter", sans-serif', fontWeight: 500,
            fontSize: 12, color: teal,
          }}, 'lightingmasterlc.com'),
        ),
      ),
    ),
  )
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const firstName  = searchParams.get('fn')   || 'First'
    const lastName   = searchParams.get('ln')   || 'Last'
    const issuedDate = searchParams.get('date') || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

    /* Load fonts in parallel */
    const [serifData, interData] = await Promise.all([
      loadFont('DM Serif Display', 400),
      loadFont('Inter', 400),
    ])

    const fonts = [
      ...(serifData ? [{ name: 'DM Serif Display', data: serifData, weight: 400, style: 'normal' }] : []),
      ...(interData ? [{ name: 'Inter', data: interData, weight: 400, style: 'normal' }] : []),
      ...(interData ? [{ name: 'Inter', data: interData, weight: 600, style: 'normal' }] : []),
      ...(interData ? [{ name: 'Inter', data: interData, weight: 700, style: 'normal' }] : []),
      ...(interData ? [{ name: 'Inter', data: interData, weight: 800, style: 'normal' }] : []),
    ]

    /* Render SVG via Satori */
    const svg = await satori(
      React.createElement(CertSvg, { firstName, lastName, issuedDate }),
      { width: W, height: H, fonts }
    )

    /* Convert SVG → PNG via sharp */
    const png = await sharp(Buffer.from(svg)).png({ quality: 100 }).toBuffer()

    return new NextResponse(png, {
      status: 200,
      headers: {
        'Content-Type':        'image/png',
        'Content-Disposition': `attachment; filename="LC_Certificate_${firstName}_${lastName}.png"`,
        'Cache-Control':       'no-store',
      },
    })

  } catch (err) {
    console.error('[/api/cert] error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
