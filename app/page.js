'use client'
import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LandingPage() {
  const canvasRef = useRef(null)
  const stageRef = useRef(null)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/dashboard')
    })
  }, [])

  useEffect(() => {
    const cv = canvasRef.current
    const stage = stageRef.current
    if (!cv || !stage) return
    const cx = cv.getContext('2d')
    let animId

    function rsz() { cv.width = stage.offsetWidth; cv.height = stage.offsetHeight; }
    rsz()
    window.addEventListener('resize', rsz)
    const W = () => cv.width, H = () => cv.height

    const CCT = [
      { r:255, g:169, b: 87, spd:0.0031, ph:0,   srcFrac:0.18, swing:0.55, width:0.055 },
      { r:255, g:187, b:111, spd:0.0044, ph:1.8,  srcFrac:0.38, swing:0.50, width:0.048 },
      { r:255, g:219, b:172, spd:0.0037, ph:3.6,  srcFrac:0.60, swing:0.48, width:0.044 },
      { r:244, g:233, b:220, spd:0.0052, ph:5.1,  srcFrac:0.82, swing:0.45, width:0.040 },
    ]

    function drawBeam(srcX, srcY, tx, ty, r, g, b, spreadFrac, intensity) {
      const dx = tx - srcX, dy = ty - srcY
      const ang = Math.atan2(dy, dx)
      const perp = ang + Math.PI / 2
      const spread = W() * spreadFrac

      const steps = 28
      for (let i = 0; i < steps; i++) {
        const frac = i / steps
        const px = srcX + dx * frac
        const py = srcY + dy * frac
        const hw = spread * frac * 1.1
        const falloff = Math.pow(1 - frac, 0.35) * frac * 2.2
        const a = intensity * falloff * 0.09
        if (a < 0.002) continue
        const g2 = cx.createRadialGradient(px, py, 0, px, py, hw)
        g2.addColorStop(0, `rgba(${r},${g},${b},${a})`)
        g2.addColorStop(1, `rgba(${r},${g},${b},0)`)
        cx.beginPath()
        cx.arc(px, py, hw, 0, Math.PI * 2)
        cx.fillStyle = g2
        cx.fill()
      }

      const ex = srcX + dx, ey = srcY + dy
      const edgeGrad = cx.createLinearGradient(srcX, srcY, ex, ey)
      edgeGrad.addColorStop(0,    `rgba(${r},${g},${b},0)`)
      edgeGrad.addColorStop(0.2,  `rgba(${r},${g},${b},${intensity * 0.18})`)
      edgeGrad.addColorStop(0.65, `rgba(${r},${g},${b},${intensity * 0.06})`)
      edgeGrad.addColorStop(1,    `rgba(${r},${g},${b},0)`)
      for (const side of [-1, 1]) {
        const ox = Math.cos(perp) * 2 * side
        const oy = Math.sin(perp) * 2 * side
        cx.beginPath()
        cx.moveTo(srcX + ox, srcY + oy)
        cx.lineTo(ex + Math.cos(perp) * spread * side, ey + Math.sin(perp) * spread * side)
        cx.strokeStyle = edgeGrad
        cx.lineWidth = 1.2
        cx.stroke()
      }

      const poolR = spread * 1.05
      const pool = cx.createRadialGradient(tx, ty, 0, tx, ty, poolR)
      pool.addColorStop(0,   `rgba(${r},${g},${b},${intensity * 0.28})`)
      pool.addColorStop(0.3, `rgba(${r},${g},${b},${intensity * 0.14})`)
      pool.addColorStop(0.7, `rgba(${r},${g},${b},${intensity * 0.04})`)
      pool.addColorStop(1,   `rgba(${r},${g},${b},0)`)
      cx.beginPath()
      cx.ellipse(tx, ty, poolR, poolR * 0.36, ang, 0, Math.PI * 2)
      cx.fillStyle = pool
      cx.fill()

      const src = cx.createRadialGradient(srcX, srcY, 0, srcX, srcY, 14)
      src.addColorStop(0, `rgba(${r},${g},${b},${intensity * 0.6})`)
      src.addColorStop(1, `rgba(${r},${g},${b},0)`)
      cx.beginPath(); cx.arc(srcX, srcY, 14, 0, Math.PI * 2)
      cx.fillStyle = src; cx.fill()
    }

    function drawDust(t) {
      for (let i = 0; i < 28; i++) {
        const s = i * 137.5
        const x = (Math.sin(s * 0.09 + t * 0.00022) * 0.5 + 0.5) * W()
        const y = ((Math.sin(s * 0.06 + t * 0.00016) * 0.5 + 0.5) * 1.25 - 0.12) * H()
        const a = 0.025 + Math.abs(Math.sin(s * 0.5 + t * 0.0007)) * 0.055
        cx.beginPath(); cx.arc(x, y, 1, 0, Math.PI * 2)
        cx.fillStyle = `rgba(255,228,160,${a})`; cx.fill()
      }
    }

    let t = 0
    function frame() {
      animId = requestAnimationFrame(frame)
      t++
      cx.fillStyle = 'rgba(6,5,3,0.3)'
      cx.fillRect(0, 0, W(), H())
      for (const B of CCT) {
        const fl = 0.88 + Math.sin(t * 0.045 + B.ph) * 0.07 + Math.cos(t * 0.031 + B.ph * 0.7) * 0.04
        const sweepAng = Math.sin(t * B.spd + B.ph) * B.swing
        const srcX = B.srcFrac * W()
        const beamLen = H() * 1.6
        const tx = srcX + Math.sin(sweepAng) * beamLen
        const ty = -8 + Math.cos(sweepAng) * beamLen
        drawBeam(srcX, -8, tx, ty, B.r, B.g, B.b, B.width, fl)
      }
      drawDust(t)
      cx.fillStyle = 'rgba(6,5,3,0.08)'
      cx.fillRect(0, 0, W(), H())
    }
    frame()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', rsz)
    }
  }, [])

  const kelvins = [
    { hex:'#ff9a3c', label:'2700K' },
    { hex:'#ffb86c', label:'3000K' },
    { hex:'#fffaf4', label:'4000K' },
    { hex:'#c8e4ff', label:'5000K' },
  ]

  return (
    <div
      ref={stageRef}
      style={{
        width: '100%',
        minHeight: '100vh',
        background: '#060503',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'crosshair',
        fontFamily: '"Space Grotesk","Helvetica Neue",sans-serif',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ position:'absolute',inset:0,width:'100%',height:'100%',display:'block' }}
      />

      {/* Content */}
      <div style={{
        position:'relative',zIndex:10,
        display:'flex',flexDirection:'column',
        alignItems:'center',justifyContent:'center',
        minHeight:'100vh',textAlign:'center',padding:'0 24px',
      }}>
        <p style={{
          fontFamily:'"JetBrains Mono",monospace',
          fontSize:10,letterSpacing:'0.22em',textTransform:'uppercase',
          color:'#c87840',marginBottom:16,
        }}>Luxart LLC · NCQLP Exam Prep</p>

        <h1 style={{
          fontFamily:'"DM Serif Display",Georgia,serif',
          fontWeight:700,fontSize:'clamp(40px,7vw,82px)',
          lineHeight:1.02,letterSpacing:'-0.025em',
          color:'#fdfaf6',margin:'0 0 16px',
        }}>
          LC · Lighting<br/>
          <em style={{fontStyle:'normal',color:'#c87840'}}>Master.</em>
        </h1>

        <p style={{
          fontFamily:'"JetBrains Mono",monospace',fontSize:12,
          color:'rgba(253,250,246,0.42)',letterSpacing:'0.05em',
          lineHeight:1.85,maxWidth:460,margin:'0 0 36px',
        }}>
          12 modules · 74 lessons · 24 CEU hours<br/>
          Built for the North American commercial lighting market
        </p>

        <div style={{display:'flex',gap:14,flexWrap:'wrap',justifyContent:'center',marginBottom:64}}>
          <button
            onClick={() => router.push('/login')}
            style={{
              background:'#c87840',color:'#fff',border:'none',
              borderRadius:99,padding:'14px 32px',
              fontFamily:'"JetBrains Mono",monospace',
              fontSize:11,fontWeight:700,letterSpacing:'0.1em',
              textTransform:'uppercase',cursor:'pointer',
            }}
          >Start for free →</button>
          <button
            onClick={() => router.push('/pricing')}
            style={{
              background:'transparent',color:'rgba(253,250,246,0.6)',
              border:'1px solid rgba(253,250,246,0.16)',borderRadius:99,
              padding:'14px 32px',fontFamily:'"JetBrains Mono",monospace',
              fontSize:11,letterSpacing:'0.1em',textTransform:'uppercase',cursor:'pointer',
            }}
          >View plans</button>
        </div>

        <div style={{display:'flex',gap:44,flexWrap:'wrap',justifyContent:'center'}}>
          {[
            {val:'74',label:'Lessons'},
            {val:'129',label:'Practice questions'},
            {val:'24',label:'CEU hours'},
            {val:'13',label:'Exam topics'},
          ].map(s => (
            <div key={s.label} style={{textAlign:'center'}}>
              <div style={{
                fontFamily:'"Space Grotesk",sans-serif',fontWeight:700,
                fontSize:28,letterSpacing:'-0.02em',color:'#fdfaf6',lineHeight:1,
              }}>{s.val}</div>
              <div style={{
                fontFamily:'"JetBrains Mono",monospace',fontSize:9,
                letterSpacing:'0.16em',textTransform:'uppercase',
                color:'rgba(253,250,246,0.3)',marginTop:5,
              }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Kelvin bar at bottom */}
      <div style={{
        position:'absolute',bottom:0,left:0,right:0,
        height:3,display:'flex',zIndex:10,
      }}>
        {['#ff9a3c','#ffb068','#ffe4b8','#fff8f0','#f8faff','#e8f2ff','#d4e8ff','#c0dcff'].map((c,i) => (
          <div key={i} style={{flex:1,background:c,opacity:0.6}}/>
        ))}
      </div>

      {/* Kelvin labels */}
      <div style={{
        position:'absolute',bottom:12,left:0,right:0,
        display:'flex',justifyContent:'space-around',
        zIndex:10,padding:'0 5%',
      }}>
        {kelvins.map(k => (
          <div key={k.label} style={{
            fontFamily:'"JetBrains Mono",monospace',
            fontSize:9,letterSpacing:'0.14em',
            color:k.hex,opacity:0.7,textAlign:'center',
          }}>{k.label}</div>
        ))}
      </div>

      <p style={{
        position:'absolute',bottom:32,left:'50%',
        transform:'translateX(-50%)',
        fontFamily:'"JetBrains Mono",monospace',
        fontSize:9,letterSpacing:'0.18em',textTransform:'uppercase',
        color:'rgba(253,250,246,0.15)',zIndex:10,whiteSpace:'nowrap',
      }}>✦ &nbsp; The light knows where to find you &nbsp; ✦</p>
    </div>
  )
}
