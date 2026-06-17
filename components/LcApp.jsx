'use client'

import React, { useState, useEffect, useRef, useCallback } from "react"
import DOMPurify from 'dompurify'
import { createClient } from '@/lib/supabase/client'
import PricingCard from '@/components/PricingCard'

const supabase = createClient()

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  )
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isMobile
}

/* ══ LEARNER APP ══ */

/* ── FONTS ── */
const FONT_URL = "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Inter:wght@400;500;600&family=DM+Serif+Display&display=swap"

/* ── TOKENS ── */
const C = {
  ink:         "#2F4A3F",
  inkSoft:     "#3D5C50",
  inkMute:     "#7A9688",
  cream:       "#F2E6DA",
  creamWarm:   "#E8D8C8",
  paper:       "#FAF5F0",
  rule:        "#DDD0C0",
  ruleStrong:  "#C8B8A4",
  accent:      "#C65A3A",
  accentLight: "#F5E8E2",
  forest:      "#7E9B86",
  forestLight: "#E8F0EC",
  tan:         "#DFA688",
  amber:       "#E8A020",
  white:       "#fff",
}
const F = { display:"'Space Grotesk',sans-serif", body:"'Inter',sans-serif", mono:"'JetBrains Mono',monospace" }

const MARKETS = [
  'Commercial','Residential','Hospitality',
  'Healthcare','Industrial','Sports','Outdoor/Street'
]
const FIXTURE_TYPES = {
  'Commercial':     ['Downlight','Troffer','Linear','Track','Pendant','Wall wash'],
  'Residential':    ['Downlight','Strip light','Pendant','Landscape','Ceiling'],
  'Hospitality':    ['Accent','Wall sconce','Cove','Chandelier','Step light'],
  'Healthcare':     ['Troffer','Exam light','Emergency','Surgical','Corridor'],
  'Industrial':     ['High-bay','Low-bay','Hazardous location','UFO','Linear high-bay'],
  'Sports':         ['Floodlight','Sports light','Arena','Field light','Court light'],
  'Outdoor/Street': ['Street','Flood','Area','Bollard','Wall pack','Canopy'],
}
const m = (s={}) => ({fontFamily:F.mono,...s})
const d = (s={}) => ({fontFamily:F.display,...s})
const mono    = (s={}) => ({fontFamily:F.mono,...s})
const display = (s={}) => ({fontFamily:F.display,...s})

/* ── PRIMITIVES ── */
function Kicker({children,light=false,center=false}){
  return <div style={m({fontSize:9,letterSpacing:"0.26em",textTransform:"uppercase",
    color:light?"rgba(249,244,237,0.52)":C.accent,marginBottom:14,
    textAlign:center?"center":"left"})}>{children}</div>
}
function Heading({children,size=56,light=false,center=false,style={}}){
  return <h2 style={{fontFamily:F.display,fontWeight:700,
    fontSize:`clamp(${Math.round(size*.65)}px,${(size/1024*100).toFixed(1)}vw,${size}px)`,
    letterSpacing:"-0.025em",lineHeight:1.05,color:light?"#fff":C.ink,margin:0,...style}}>{children}</h2>
}
function Btn({children,variant="primary",onClick,href,style={},disabled=false}){
  const base={fontFamily:F.display,fontWeight:700,fontSize:14,borderRadius:99,
    padding:"13px 28px",cursor:disabled?"not-allowed":"pointer",border:"none",
    display:"inline-flex",alignItems:"center",gap:8,transition:"all 150ms ease",
    opacity:disabled?0.5:1,...style}
  const v={
    primary:{background:C.accent,color:"#fff"},
    dark:{background:C.ink,color:"#fff"},
    ghost:{background:"none",color:C.inkSoft,border:`1px solid ${C.ruleStrong}`},
    ghostLight:{background:"none",color:"rgba(249,244,237,0.85)",border:"1px solid rgba(249,244,237,0.25)"},
    danger:{background:"#c0392b",color:"#fff"},
  }
  const s = {...base,...v[variant]}
  if(href) return <a href={href} style={s}>{children}</a>
  return <button onClick={disabled?undefined:onClick} style={s}>{children}</button>
}

/* ── SCROLL ── */
function scrollTo(id){
  const el = document.getElementById(id)
  if(el) el.scrollIntoView({behavior:"smooth",block:"start"})
}

/* ══════════════════════════════════════════
   AUTH MODAL — v0.2
══════════════════════════════════════════ */

const US_STATES = ["Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming","District of Columbia","Puerto Rico","Guam","U.S. Virgin Islands","Other / International"]

function pwStrength(pw){
  let score = 0
  if(pw.length >= 8)  score++
  if(pw.length >= 12) score++
  if(/[A-Z]/.test(pw)) score++
  if(/[0-9]/.test(pw)) score++
  if(/[^A-Za-z0-9]/.test(pw)) score++
  return score // 0–5
}

function PwStrengthBar({pw}){
  const score = pwStrength(pw)
  if(!pw) return null
  const labels = ["","Weak","Weak","Fair","Strong","Very strong"]
  const colors = ["","#c0392b","#e67e22","#e8a020","#7E9B86","#1a7a52"]
  return(
    <div style={{marginTop:8}}>
      <div style={{display:"flex",gap:3,marginBottom:5}}>
        {[1,2,3,4,5].map(i=>(
          <div key={i} style={{flex:1,height:3,borderRadius:2,
            background:i<=score?colors[score]:"#DDD0C0",
            transition:"background 0.2s"}}/>
        ))}
      </div>
      <div style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:colors[score]||"#7A9688",fontWeight:500}}>
        {labels[score]}{score>=4?" — good to go":score>=3?" — add a symbol to strengthen":""}
      </div>
    </div>
  )
}

/* ── SHARED FORM PRIMITIVES — top-level so React never remounts on
   parent re-render. This is the fix for the cursor-stealing bug. ── */
const iBase = {
  width:"100%", padding:"9px 12px",
  border:`1px solid ${C.rule}`, borderRadius:7,
  fontFamily:F.body, fontSize:13, color:C.ink,
  background:C.cream, outline:"none",
  transition:"border-color 0.15s", display:"block"
}
function inp(err){ return {...iBase, borderColor: err?"#c0392b":C.rule} }

function Field({label,req,children,err}){
  return(
    <div>
      <label style={{fontFamily:F.display,fontSize:11,fontWeight:600,color:C.inkSoft,
        display:"block",marginBottom:5,letterSpacing:"0.04em"}}>
        {label}{req&&<span style={{color:C.accent,marginLeft:2}}>*</span>}
      </label>
      {children}
      {err&&<div style={{fontFamily:F.body,fontSize:11,color:"#c0392b",marginTop:4}}>{err}</div>}
    </div>
  )
}

function PwField({value,onChange,onBlur,showPw,setShowPw,err,placeholder="Min. 8 chars · uppercase · number · symbol"}){
  const handleFocus = e => e.target.style.borderColor = C.accent
  const handleBlur  = e => { e.target.style.borderColor = C.rule; if(onBlur) onBlur(e) }
  return(
    <div style={{position:"relative"}}>
      <input
        type={showPw?"text":"password"}
        value={value}
        onChange={onChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        style={{...inp(err),paddingRight:40}}
        autoComplete="current-password"
      />
      <button
        type="button"
        onMouseDown={e=>e.preventDefault()}
        onClick={()=>setShowPw(s=>!s)}
        style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",
          background:"none",border:"none",cursor:"pointer",padding:0,
          fontFamily:F.mono,fontSize:10,color:C.inkMute,userSelect:"none"}}>
        {showPw?"hide":"show"}
      </button>
    </div>
  )
}

function validatePassword(password) {
  const checks = {
    length:    password.length >= 10,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number:    /[0-9]/.test(password),
    special:   /[^A-Za-z0-9]/.test(password),
    notCommon: !['password','12345678','qwertyuiop',
      'lighting','ncqlp','luxart','lightingmaster',
      '1234567890','aaaaaaaaaa','password1'].includes(
        password.toLowerCase()
      ),
  }
  const score = Object.values(checks).filter(Boolean).length
  const strength = score <= 2 ? 'weak' :
                   score <= 4 ? 'fair' :
                   score <= 5 ? 'good' : 'strong'
  const valid = checks.length && checks.uppercase &&
                checks.lowercase && checks.number && checks.notCommon
  return { checks, score, strength, valid }
}

function PasswordStrengthBar({ password }) {
  if (!password) return null
  const { strength, score, checks } = validatePassword(password)
  const colors = { weak:'#ef4444', fair:'#f59e0b', good:'#3b82f6', strong:'#22c55e' }
  const color = colors[strength]
  const width = Math.round((score / 6) * 100) + '%'
  return (
    <div style={{ marginTop: 8, marginBottom: 4 }}>
      <div style={{ height: 4, background: C.rule, borderRadius: 99, overflow: 'hidden', marginBottom: 6 }}>
        <div style={{ height: '100%', width, background: color,
          borderRadius: 99, transition: 'width 300ms ease, background 300ms ease' }}/>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { key: 'length',    label: '10+ chars' },
            { key: 'uppercase', label: 'A-Z' },
            { key: 'lowercase', label: 'a-z' },
            { key: 'number',    label: '0-9' },
            { key: 'special',   label: '!@#' },
          ].map(({ key, label }) => (
            <span key={key} style={{
              fontFamily: F.mono, fontSize: 9,
              color: checks[key] ? '#22c55e' : C.inkMute,
              letterSpacing: '0.08em',
              transition: 'color 200ms',
            }}>
              {checks[key] ? '✓' : '○'} {label}
            </span>
          ))}
        </div>
        <span style={{
          fontFamily: F.mono, fontSize: 9, color, fontWeight: 600,
          letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>
          {strength}
        </span>
      </div>
    </div>
  )
}

function AuthModal({mode, onClose, onAuth, initialError=null, onErrorShown=()=>{}}){
  const [tab, setTab] = useState(mode||"signin")
  // sign-in fields
  const [siEmail, setSiEmail] = useState("")
  const [siPw, setSiPw]       = useState("")
  const [siShowPw, setSiShowPw] = useState(false)
  // sign-up fields
  const [firstName, setFirstName] = useState("")
  const [lastName,  setLastName]  = useState("")
  const [suEmail,   setSuEmail]   = useState("")
  const [company,   setCompany]   = useState("")
  const [state,     setState]     = useState("")
  const [suPw,      setSuPw]      = useState("")
  const [suShowPw,  setSuShowPw]  = useState(false)
  const [confirmPassword, setConfirmPassword] = useState("")
  const [contactOk, setContactOk] = useState(false)
  const [loginAttempts, setLoginAttempts] = useState(0)
  const [lockoutUntil, setLockoutUntil] = useState(null)
  // reset
  const [resetEmail, setResetEmail] = useState("")
  // shared
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(initialError||"")
  const [success, setSuccess] = useState("")
  const [touched, setTouched] = useState({})

  useEffect(()=>{
    if(initialError){ onErrorShown() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])

  useEffect(()=>{ setError(""); setSuccess(""); setTouched({}) },[tab])

  const touch = (field) => setTouched(t=>({...t,[field]:true}))

  // per-field inline errors shown after blur
  const fieldErr = {
    firstName: touched.firstName && !firstName.trim() ? "Required" : "",
    lastName:  touched.lastName  && !lastName.trim()  ? "Required" : "",
    suEmail:   touched.suEmail   && (!suEmail||!suEmail.includes("@")) ? "Valid email required" : "",
    state:     touched.state     && !state ? "Required" : "",
    suPw:      touched.suPw && suPw && pwStrength(suPw) < 3 ? "Password too weak" : touched.suPw && !suPw ? "Required" : "",
    siEmail:   touched.siEmail   && (!siEmail||!siEmail.includes("@")) ? "Valid email required" : "",
    siPw:      touched.siPw      && !siPw ? "Required" : "",
    resetEmail:touched.resetEmail&& (!resetEmail||!resetEmail.includes("@")) ? "Valid email required" : "",
  }

  function validateSignup(){
    if(!firstName.trim()){ setError("First name is required."); return false }
    if(!lastName.trim()) { setError("Last name is required."); return false }
    if(!suEmail||!suEmail.includes("@")){ setError("Enter a valid email address."); return false }
    if(!state)           { setError("Please select your state or region."); return false }
    const pwCheck = validatePassword(suPw)
    if(!pwCheck.valid)   { setError("Password must be at least 10 characters and include uppercase, lowercase, and a number."); return false }
    if(suPw !== confirmPassword){ setError("Passwords do not match."); return false }
    if(!contactOk)       { setError("Please confirm you agree to receive product communications."); return false }
    return true
  }
  function validateSignin(){
    if(!siEmail||!siEmail.includes("@")){ setError("Enter a valid email address."); return false }
    if(!siPw){ setError("Enter your password."); return false }
    return true
  }
  function validateReset(){
    if(!resetEmail||!resetEmail.includes("@")){ setError("Enter a valid email address."); return false }
    return true
  }

  async function handleSubmit(){
    setError("")
    if(tab==="signup" && !validateSignup()) return
    if(tab==="signin" && !validateSignin()) return
    if(tab==="reset"  && !validateReset())  return
    setLoading(true)
    if(tab==="reset"){
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`
      })
      setLoading(false)
      if(error){ setError(error.message); return }
      setSuccess("Reset link sent — check your inbox.")
      return
    }
    if(tab==="signin"){
      if(lockoutUntil && Date.now() < lockoutUntil){
        const secs = Math.ceil((lockoutUntil - Date.now()) / 1000)
        setLoading(false)
        setError(`Too many failed attempts. Try again in ${secs} seconds.`)
        return
      }
      const { data, error } = await supabase.auth.signInWithPassword({ email:siEmail, password:siPw })
      if(error){
        setLoading(false)
        const newAttempts = loginAttempts + 1
        setLoginAttempts(newAttempts)
        if(newAttempts >= 5){
          const lockDuration = Math.min(newAttempts * 30 * 1000, 300000)
          setLockoutUntil(Date.now() + lockDuration)
          setError(`Too many failed attempts. Account locked for ${lockDuration/1000} seconds.`)
        } else if(newAttempts >= 3){
          setError(`Incorrect credentials. ${5 - newAttempts} attempts remaining before temporary lockout.`)
        } else {
          setError(error.message)
        }
        return
      }
      setLoginAttempts(0)
      setLockoutUntil(null)
      const u = data.user
      const { data:sub } = await supabase.from("subscriptions").select("*").eq("user_id", u.id).single()
      const sessionToken = crypto.randomUUID()
      sessionStorage.setItem('lc_session_token', sessionToken)
      await supabase.from('subscriptions').update({ session_token: sessionToken, session_created_at: new Date().toISOString() }).eq('user_id', u.id)
      setLoading(false)
      onAuth({ id:u.id, name:u.user_metadata?.name||siEmail.split("@")[0], email:u.email,
               company:u.user_metadata?.company||"", state:u.user_metadata?.state||"",
               plan:sub?.plan||"free", examAddon:sub?.exam_addon||false })
      return
    }
    const { data, error } = await supabase.auth.signUp({
      email: suEmail, password: suPw,
      options: { data: { name:`${firstName} ${lastName}`.trim(), company, state } }
    })
    setLoading(false)
    if(error){ setError(error.message); return }
    if(data?.user?.identities?.length === 0){ setError("An account already exists with this email. Please sign in."); return }
    if(data?.session){
      const u = data.user
      const { data:sub } = await supabase.from("subscriptions").select("*").eq("user_id", u.id).single()
      onAuth({ id:u.id, name:u.user_metadata?.name||suEmail.split("@")[0], email:u.email,
               company, state, plan:sub?.plan||"free", examAddon:sub?.exam_addon||false })
    } else {
      setSuccess("Account created! Check your email to confirm, then sign in.")
    }
  }

  return (
    <div onClick={e=>{if(e.target===e.currentTarget)onClose()}}
      style={{position:"fixed",inset:0,zIndex:1000,
        background:"rgba(47,74,63,0.76)",
        display:"flex",alignItems:"center",justifyContent:"center",padding:"16px",
        overflowY:"auto"}}>

      <div style={{background:C.paper,borderRadius:18,padding:"32px 30px",
        width:"100%",maxWidth: tab==="signup"?520:400,
        position:"relative",border:`1px solid ${C.rule}`,
        margin:"auto", flexShrink:0}}>

        <button onClick={onClose} style={{position:"absolute",top:14,right:16,
          background:"none",border:"none",cursor:"pointer",fontSize:22,color:C.inkMute,lineHeight:1}}>×</button>

        {/* logo */}
        <div style={{display:"flex",justifyContent:"center",marginBottom:20}}>
          <div style={{background:C.ink,borderRadius:10,padding:"8px 16px",display:"inline-flex",alignItems:"center",gap:10}}>
            <img src="/brand/logo-transparent.png" alt=""
              style={{width:32,height:32,flexShrink:0,borderRadius:8,border:"1px solid rgba(242,230,218,0.28)",boxShadow:"0 0 14px rgba(232,160,32,0.35), 0 0 4px rgba(242,230,218,0.15)"}}/>
            <span style={{fontFamily:F.display,fontWeight:700,fontSize:14,color:C.cream,letterSpacing:"-0.01em",lineHeight:1.15}}>
              LC · Lighting<br/>Master
            </span>
          </div>
        </div>

        {/* tabs */}
        {tab!=="reset"&&(
          <div style={{display:"flex",borderBottom:`1px solid ${C.rule}`,marginBottom:22}}>
            {[["signin","Sign in"],["signup","Create account"]].map(([t,label])=>(
              <button key={t} onClick={()=>setTab(t)}
                style={{flex:1,padding:"9px 0",background:"none",border:"none",
                  fontFamily:F.display,fontWeight:600,fontSize:13,cursor:"pointer",
                  color:tab===t?C.accent:C.inkMute,
                  borderBottom:`2px solid ${tab===t?C.accent:"transparent"}`,
                  transition:"all 0.15s"}}>{label}</button>
            ))}
          </div>
        )}

        {tab==="reset"&&(
          <div style={{marginBottom:20}}>
            <div style={d({fontWeight:700,fontSize:17,color:C.ink,marginBottom:5})}>Reset your password</div>
            <div style={{fontFamily:F.body,fontSize:13,color:C.inkMute}}>Enter your email and we'll send a secure reset link.</div>
          </div>
        )}

        {error&&(
          <div style={{background:"#fff0ee",border:`1px solid #f5c4b3`,borderRadius:8,
            padding:"10px 13px",fontSize:13,color:"#993c1d",marginBottom:14,fontFamily:F.body,
            display:"flex",alignItems:"flex-start",gap:8}}>
            <span style={{flexShrink:0,marginTop:1}}>⚠</span><span>{error}</span>
          </div>
        )}
        {success&&(
          <div style={{background:C.forestLight,border:`1px solid ${C.forest}`,borderRadius:8,
            padding:"10px 13px",fontSize:13,color:C.forest,marginBottom:14,fontFamily:F.body}}>
            ✓ {success}
          </div>
        )}

        {/* ── SIGN IN FORM ── */}
        {tab==="signin"&&(
          <div style={{display:"flex",flexDirection:"column",gap:13}}>
            <Field label="Email address" req err={fieldErr.siEmail}>
              <input type="email" value={siEmail} onChange={e=>setSiEmail(e.target.value)}
                onBlur={()=>touch("siEmail")} placeholder="you@example.com" style={inp(fieldErr.siEmail)}
                onFocus={e=>e.target.style.borderColor=C.accent}/>
            </Field>
            <Field label="Password" req err={fieldErr.siPw}>
              <PwField value={siPw} onChange={e=>setSiPw(e.target.value)}
                onBlur={()=>touch("siPw")} showPw={siShowPw} setShowPw={setSiShowPw}
                err={fieldErr.siPw} placeholder="Your password"
              />
            </Field>
            <div style={{textAlign:"right",marginTop:-4}}>
              <button onClick={()=>setTab("reset")} style={{background:"none",border:"none",
                fontSize:12,color:C.inkMute,cursor:"pointer",fontFamily:F.body,textDecoration:"underline"}}>
                Forgot password?
              </button>
            </div>
          </div>
        )}

        {/* ── SIGN UP FORM ── */}
        {tab==="signup"&&(
          <div style={{display:"flex",flexDirection:"column",gap:13}}>
            {/* name row */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <Field label="First name" req err={fieldErr.firstName}>
                <input value={firstName} onChange={e=>setFirstName(e.target.value)}
                  onBlur={()=>touch("firstName")} placeholder="Alex" style={inp(fieldErr.firstName)}
                  onFocus={e=>e.target.style.borderColor=C.accent}/>
              </Field>
              <Field label="Last name" req err={fieldErr.lastName}>
                <input value={lastName} onChange={e=>setLastName(e.target.value)}
                  onBlur={()=>touch("lastName")} placeholder="Johnson" style={inp(fieldErr.lastName)}
                  onFocus={e=>e.target.style.borderColor=C.accent}/>
              </Field>
            </div>

            <Field label="Email address" req err={fieldErr.suEmail}>
              <input type="email" value={suEmail} onChange={e=>setSuEmail(e.target.value)}
                onBlur={()=>touch("suEmail")} placeholder="you@yourfirm.com" style={inp(fieldErr.suEmail)}
                onFocus={e=>e.target.style.borderColor=C.accent}/>
            </Field>

            {/* company + state row */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <Field label="Company / Firm">
                <input value={company} onChange={e=>setCompany(e.target.value)}
                  placeholder="Gensler, Self-employed…" style={iBase}
                  onFocus={e=>e.target.style.borderColor=C.accent}
                  onBlur={e=>e.target.style.borderColor=C.rule}/>
              </Field>
              <Field label="State / Region" req err={fieldErr.state}>
                <select value={state} onChange={e=>{setState(e.target.value);touch("state")}}
                  onBlur={()=>touch("state")}
                  style={{...inp(fieldErr.state),appearance:"none",
                    backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%238a7a6a' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
                    backgroundRepeat:"no-repeat",backgroundPosition:"right 10px center",paddingRight:28,
                    cursor:"pointer"}}>
                  <option value="">Select…</option>
                  {US_STATES.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
            </div>

            <Field label="Password" req err={fieldErr.suPw}>
              <PwField value={suPw} onChange={e=>setSuPw(e.target.value)}
                onBlur={()=>touch("suPw")} showPw={suShowPw} setShowPw={setSuShowPw}
                err={fieldErr.suPw}/>
              <PasswordStrengthBar password={suPw}/>
            </Field>

            <Field label="Confirm password" req>
              <input type="password" placeholder="Re-enter password"
                value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)}
                style={{width:"100%",boxSizing:"border-box",fontFamily:F.body,fontSize:14,
                  padding:"10px 13px",borderRadius:8,border:`1.5px solid ${C.rule}`,
                  background:C.paper,color:C.ink,outline:"none"}}/>
            </Field>

            {/* contact agreement */}
            <div onClick={()=>setContactOk(v=>!v)}
              style={{display:"flex",alignItems:"flex-start",gap:10,cursor:"pointer",
                background:contactOk?C.forestLight:C.creamWarm,
                border:`1px solid ${contactOk?C.forest:C.rule}`,
                borderRadius:8,padding:"11px 13px",transition:"all 0.15s",userSelect:"none"}}>
              <div style={{width:16,height:16,borderRadius:4,flexShrink:0,marginTop:1,
                background:contactOk?C.forest:C.paper,
                border:`1.5px solid ${contactOk?C.forest:C.ruleStrong}`,
                display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s"}}>
                {contactOk&&<span style={{color:"#fff",fontSize:10,lineHeight:1,fontWeight:700}}>✓</span>}
              </div>
              <span style={{fontFamily:F.body,fontSize:12,color:C.inkSoft,lineHeight:1.55}}>
                I agree to receive product updates, LC exam tips, and course announcements from Lighting Master. Unsubscribe anytime.
                <span style={{color:C.accent}}> *</span>
              </span>
            </div>

            <p style={{fontFamily:F.body,fontSize:11,color:C.inkMute,lineHeight:1.6,margin:0}}>
              By creating an account you agree to our{" "}
              <a href="#" style={{color:C.accent}}>Terms of Service</a> and{" "}
              <a href="#" style={{color:C.accent}}>Privacy Policy</a>.
              Your data is never sold to third parties.
            </p>
          </div>
        )}

        {/* ── RESET FORM ── */}
        {tab==="reset"&&(
          <div>
            <Field label="Email address" req err={fieldErr.resetEmail}>
              <input type="email" value={resetEmail} onChange={e=>setResetEmail(e.target.value)}
                onBlur={()=>touch("resetEmail")} placeholder="you@example.com"
                style={inp(fieldErr.resetEmail)}
                onFocus={e=>e.target.style.borderColor=C.accent}/>
            </Field>
          </div>
        )}

        <Btn variant="primary" onClick={handleSubmit} disabled={loading||(!contactOk&&tab==="signup")}
          style={{width:"100%",justifyContent:"center",marginTop:18,padding:"12px"}}>
          {loading?"…":tab==="signin"?"Sign in →":tab==="signup"?"Create free account →":"Send reset link →"}
        </Btn>

        {tab==="signup"&&!contactOk&&(
          <div style={{fontFamily:F.body,fontSize:11,color:C.inkMute,textAlign:"center",marginTop:8}}>
            Check the agreement above to continue
          </div>
        )}

        {tab==="reset"&&(
          <button onClick={()=>setTab("signin")} style={{display:"block",width:"100%",
            textAlign:"center",marginTop:12,background:"none",border:"none",
            fontFamily:F.body,fontSize:13,color:C.inkMute,cursor:"pointer",textDecoration:"underline"}}>
            ← Back to sign in
          </button>
        )}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════
   LANDING — NAV
══════════════════════════════════════════ */
function Nav({onSignIn,onSignUp}){
  const [scrolled,setScrolled] = useState(false)
  useEffect(()=>{
    const h=()=>setScrolled(window.scrollY>60)
    window.addEventListener("scroll",h)
    return()=>window.removeEventListener("scroll",h)
  },[])
  const lc = scrolled?C.inkSoft:"rgba(249,244,237,0.82)"
  const lhb = scrolled?C.creamWarm:"rgba(249,244,237,0.12)"
  const lhc = scrolled?C.ink:"#fff"
  return(
    <header style={{position:"fixed",top:0,left:0,right:0,zIndex:100,
      background:scrolled?"rgba(253,250,246,0.97)":"rgba(47,74,63,0.35)",
      backdropFilter:"blur(12px)",
      borderBottom:scrolled?`1px solid ${C.rule}`:"1px solid rgba(249,244,237,0.08)",
      transition:"background 280ms, border-color 280ms"}}>
      <div style={{maxWidth:1180,margin:"0 auto",padding:"0 32px",
        display:"flex",alignItems:"center",height:68,gap:32}}>
        <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
          <img src="/brand/logo-transparent.png" alt="LC Lighting Master"
            style={{width:32,height:32,flexShrink:0,borderRadius:7,
              border:"1px solid rgba(242,230,218,0.28)",
              boxShadow:scrolled?"0 2px 10px rgba(47,74,63,0.2)":"0 0 14px rgba(232,160,32,0.35), 0 0 4px rgba(242,230,218,0.15)"}}/>
          <div>
            <div style={d({fontWeight:700,fontSize:14,color:scrolled?C.ink:"#fff",lineHeight:1.1,transition:"color 280ms"})}>
              Lighting Master
            </div>
            <div style={m({fontSize:7,letterSpacing:"0.18em",textTransform:"uppercase",
              color:scrolled?C.inkMute:"rgba(249,244,237,0.45)",transition:"color 280ms"})}>
              by Luxart LLC
            </div>
          </div>
        </div>
        <nav style={{display:"flex",alignItems:"center",gap:2,flex:1}}>
          {[["Features","features"],["Curriculum","curriculum"],["Pricing","pricing"],["FAQ","faq"]].map(([label,id])=>(
            <button key={label} onClick={()=>scrollTo(id)}
              style={{fontFamily:F.display,fontWeight:600,fontSize:13,color:lc,
                padding:"7px 13px",borderRadius:99,background:"none",border:"none",
                cursor:"pointer",transition:"background 140ms, color 140ms",letterSpacing:"0.01em"}}
              onMouseEnter={e=>{e.currentTarget.style.background=lhb;e.currentTarget.style.color=lhc}}
              onMouseLeave={e=>{e.currentTarget.style.background="none";e.currentTarget.style.color=lc}}>
              {label}
            </button>
          ))}
        </nav>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <button onClick={onSignIn}
            style={{fontFamily:F.display,fontWeight:600,fontSize:13,background:"none",
              border:"none",color:lc,cursor:"pointer",padding:"7px 13px",borderRadius:99,
              transition:"color 140ms, background 140ms"}}
            onMouseEnter={e=>{e.currentTarget.style.color=lhc;e.currentTarget.style.background=lhb}}
            onMouseLeave={e=>{e.currentTarget.style.color=lc;e.currentTarget.style.background="none"}}>
            Sign in
          </button>
          <Btn variant="primary" onClick={onSignUp} style={{fontSize:13,padding:"9px 20px"}}>
            Try free →
          </Btn>
        </div>
      </div>
    </header>
  )
}

/* ── HERO ── */
function Hero({onSignUp}){
  const stats=[["74","lessons across 12 modules"],["24","CEU credit hours"],[String(TOTAL_QUESTIONS),"LC exam practice questions"],["3","pricing tiers · start free"]]
  return(
    <section style={{background:C.ink,minHeight:"100vh",display:"flex",flexDirection:"column",
      alignItems:"center",justifyContent:"center",padding:"100px 32px 80px",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",inset:0,pointerEvents:"none",opacity:0.04}}>
        {[...Array(12)].map((_,i)=>(
          <div key={i} style={{position:"absolute",left:0,right:0,top:`${8.33*(i+1)}%`,height:1,background:"rgba(249,244,237,1)"}}/>
        ))}
      </div>
      <div style={{position:"absolute",top:"30%",left:"50%",transform:"translate(-50%,-50%)",
        width:600,height:400,background:"radial-gradient(ellipse, rgba(198,90,58,0.18) 0%, transparent 70%)",pointerEvents:"none"}}/>
      <div style={{maxWidth:880,margin:"0 auto",textAlign:"center",position:"relative",zIndex:1}}>
        <Kicker light center>LC Exam Prep · Lighting Design</Kicker>
        <h1 style={{fontFamily:F.display,fontWeight:700,fontSize:"clamp(42px,7vw,80px)",
          letterSpacing:"-0.03em",lineHeight:1,color:"#F2E6DA",margin:"0 0 24px"}}>
          Become the{" "}<em style={{fontStyle:"normal",color:C.accent}}>lighting expert</em>
          <br/>your clients expect.
        </h1>
        <p style={{fontFamily:F.body,fontSize:"clamp(15px,1.8vw,18px)",lineHeight:1.75,
          color:"rgba(249,244,237,0.65)",margin:"0 auto 40px",maxWidth:580}}>
          The only structured online program built specifically to prepare North American
          lighting designers for the LC exam — 74 lessons, 50 practice questions, 24 CEU hours.
          <strong style={{color:"rgba(249,244,237,0.88)",fontWeight:500}}> Module 01 free, forever — no card required.</strong>
        </p>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,flexWrap:"wrap",marginBottom:56}}>
          <Btn variant="primary" onClick={onSignUp} style={{fontSize:15,padding:"15px 32px"}}>
            Start free →
          </Btn>
          <Btn variant="ghostLight" onClick={()=>scrollTo("curriculum")} style={{fontSize:15,padding:"15px 24px"}}>
            See the curriculum
          </Btn>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:1,
          background:"rgba(249,244,237,0.06)",border:"1px solid rgba(249,244,237,0.08)",borderRadius:6,overflow:"hidden"}}>
          {stats.map(([n,label])=>(
            <div key={label} style={{padding:"22px 16px",textAlign:"center"}}>
              <div style={d({fontWeight:700,fontSize:32,color:"#fff",letterSpacing:"-0.02em",lineHeight:1,marginBottom:4})}>{n}</div>
              <div style={m({fontSize:8,letterSpacing:"0.18em",textTransform:"uppercase",color:"rgba(249,244,237,0.38)"})}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── TRUST BAR ── */
function TrustBar(){
  const badges=["IES Member","LC Exam Aligned","24 CEU Hours","LEED Relevant","ASHRAE 90.1"]
  return(
    <section style={{background:C.creamWarm,borderBottom:`1px solid ${C.rule}`,padding:"18px 32px"}}>
      <div style={{maxWidth:1180,margin:"0 auto",display:"flex",alignItems:"center",
        justifyContent:"center",gap:24,flexWrap:"wrap"}}>
        <span style={m({fontSize:8,letterSpacing:"0.2em",textTransform:"uppercase",color:C.inkMute,marginRight:8})}>Covers</span>
        {badges.map(b=>(
          <span key={b} style={{fontFamily:F.display,fontWeight:600,fontSize:12,color:C.inkSoft,
            background:C.paper,border:`1px solid ${C.rule}`,borderRadius:99,padding:"5px 14px"}}>{b}</span>
        ))}
      </div>
    </section>
  )
}

/* ── FEATURES ── */
function Features(){
  const features=[
    {icon:"📐",title:"Structured 12-module curriculum",body:"Progress from photometry fundamentals through design process, codes, sustainability, and exam strategy — structured around the LC exam blueprint."},
    {icon:"🎧",title:"Audio narration for every lesson",body:"Each lesson has a built-in TTS audio player. Study on your commute, on site, or at your desk — learning doesn't stop when you close your laptop."},
    {icon:"⚡",title:"Timed LC practice exam",body:"50 questions across 13 topics with a 25-second clock, speed bonuses, and streak multipliers. See exactly which topics need work before exam day."},
    {icon:"📌",title:"Bookmarks & notes hub",body:"Flag lessons for review, write field notes as you study, and search across all 74 lessons from one screen. Your study history follows you session to session."},
    {icon:"🏆",title:"Certificate of completion",body:"Earn a verifiable certificate when you complete all 12 modules and pass the practice exam at 85%+ accuracy. 24 CEU credit hours included."},
    {icon:"👥",title:"Team & studio plans",body:"Training a whole studio? Team plans include a shared admin dashboard, per-seat progress tracking, consolidated billing, and full Course + Exam access for every member."},
  ]
  return(
    <section id="features" style={{padding:"96px 32px",background:C.cream}}>
      <div style={{maxWidth:1180,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:56}}>
          <Kicker center>What's inside</Kicker>
          <Heading size={48} center style={{textAlign:"center",marginBottom:16}}>
            Everything you need to<br/><em style={{fontStyle:"normal",color:C.accent}}>pass the exam.</em>
          </Heading>
          <p style={{fontFamily:F.body,fontSize:16,color:C.inkMute,maxWidth:520,margin:"0 auto",lineHeight:1.7}}>
            Built by lighting professionals, for lighting professionals.
          </p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:1,
          border:`1px solid ${C.rule}`,borderRadius:4,overflow:"hidden"}}>
          {features.map((f,i)=>(
            <div key={i} style={{background:C.paper,padding:"32px 28px",
              borderRight:i%3<2?`1px solid ${C.rule}`:"none",
              borderBottom:i<3?`1px solid ${C.rule}`:"none",
              transition:"background 160ms",position:"relative"}}
              onMouseEnter={e=>e.currentTarget.style.background=C.creamWarm}
              onMouseLeave={e=>e.currentTarget.style.background=C.paper}>
              {f.soon&&(
                <span style={{position:"absolute",top:20,right:20,background:C.creamWarm,
                  color:C.inkMute,fontFamily:F.mono,fontSize:8,fontWeight:500,
                  letterSpacing:"0.18em",textTransform:"uppercase",
                  padding:"3px 10px",borderRadius:99,border:`1px solid ${C.rule}`}}>Coming soon</span>
              )}
              <div style={{fontSize:28,marginBottom:14}}>{f.icon}</div>
              <div style={d({fontWeight:700,fontSize:16,color:f.soon?C.inkMute:C.ink,marginBottom:10,lineHeight:1.3})}>{f.title}</div>
              <p style={{fontFamily:F.body,fontSize:13.5,color:f.soon?C.inkMute:C.inkSoft,lineHeight:1.7,margin:0}}>{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── CURRICULUM ── */
function Curriculum(){
  const [open,setOpen] = useState(null)
  const modules=[
    {n:"01",part:1,label:"Foundation",title:"Theory, Light, Sight & Color",ceu:2.0,lessons:6,topics:["What is light","The four photometric quantities","Photopic & scotopic vision","CCT","CRI & TM-30","Color rendering in practice"]},
    {n:"02",part:1,label:"Hardware",title:"Light Sources & Ballasts",ceu:2.0,lessons:6,topics:["Fluorescent sources","Magnetic vs electronic ballasts","Three LED retrofit paths","CFL & HID sources","Efficacy comparison","Source selection"]},
    {n:"03",part:1,label:"Hardware",title:"LED Technology Deep Dive",ceu:2.5,lessons:8,topics:["The P-N junction","Parts of a luminaire","Thermal management","CC vs CV drivers","Dimming protocols","Power factor & THD","LEED & WELL credits","LED selection guide"]},
    {n:"04",part:1,label:"Math & Files",title:"Photometry & IES Files",ceu:2.0,lessons:6,topics:["LM-63 IES format","Polar & Cartesian plots","LM-79/80/TM-21","Inverse-square law","Cosine law","Lumen method"]},
    {n:"05",part:2,label:"Systems",title:"Lighting Controls",ceu:2.0,lessons:6,topics:["Why we control","Dimming protocols","Occupancy sensors","Daylight harvesting","DALI-2","BACnet integration"]},
    {n:"06",part:2,label:"Application",title:"Downlighting & Interior Design",ceu:2.0,lessons:6,topics:["Aperture, beam & trim","Spacing criterion","Picking the right trim","IES distribution categories","Waveguides","Interior applications"]},
    {n:"07",part:2,label:"Application",title:"Exterior, Emergency & Codes",ceu:2.0,lessons:6,topics:["IES outdoor types I–V","BUG ratings","Dark sky & light trespass","NFPA 90-min emergency rule","Emergency power","Code compliance"]},
    {n:"08",part:2,label:"Specialty",title:"Industrial Lighting & Human Health",ceu:2.0,lessons:6,topics:["High-bay vs low-bay","IP/IK/NEMA ratings","Hazardous locations","RP-7 illuminance","Circadian rhythms","WELL v2 concepts"]},
    {n:"09",part:3,label:"Sustainability",title:"Energy, Environment & Sustainable Design",ceu:2.0,lessons:6,topics:["LPD & ASHRAE 90.1","Daylight sDA & ASE","RoHS, EPD & HPD","Life-cycle cost","LEED v4.1 credits","End-of-life"]},
    {n:"10",part:3,label:"Process",title:"Design Process I: Planning to DD",ceu:2.0,lessons:6,topics:["Programming & OPR","Schematic design","DD fixture schedule","Calculations & renderings","Mock-ups & samples","Trade coordination"]},
    {n:"11",part:3,label:"Process",title:"Design Process II: Documents to POE",ceu:2.0,lessons:6,topics:["Contract documents","Bidding & submittals","Construction admin","Punch list","Commissioning","Post-occupancy eval"]},
    {n:"12",part:3,label:"Applications",title:"Residential & Commercial Applications",ceu:2.0,lessons:6,topics:["Kitchen & bath","Living & bedroom","Office & workplace","Retail & hospitality","Healthcare & education","Integrated review"]},
  ]
  const parts=[
    {id:1,label:"Part I",title:"Fundamentals",sub:"Modules 01–04 · 26 lessons · 8.5 CEU hrs"},
    {id:2,label:"Part II",title:"Systems & Applications",sub:"Modules 05–08 · 24 lessons · 8.0 CEU hrs"},
    {id:3,label:"Part III",title:"Design Practice",sub:"Modules 09–12 · 24 lessons · 8.0 CEU hrs"},
  ]
  return(
    <section id="curriculum" style={{padding:"96px 32px",background:C.creamWarm,borderTop:`1px solid ${C.rule}`}}>
      <div style={{maxWidth:1180,margin:"0 auto"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:64,alignItems:"end",marginBottom:56}}>
          <div>
            <Kicker>The curriculum</Kicker>
            <Heading size={48}>12 modules.<br/><em style={{fontStyle:"normal",color:C.accent}}>74 lessons.</em></Heading>
          </div>
          <p style={{fontFamily:F.body,fontSize:15,color:C.inkSoft,lineHeight:1.75,margin:0}}>
            Organized into three parts that mirror the LC exam blueprint. Click any module to see what's inside.
          </p>
        </div>
        {parts.map(pt=>(
          <div key={pt.id} style={{marginBottom:32}}>
            <div style={{display:"grid",gridTemplateColumns:"80px 1fr",gap:20,
              alignItems:"baseline",padding:"20px 0 12px",borderBottom:`2px solid ${C.rule}`,marginBottom:8}}>
              <span style={d({fontWeight:700,fontSize:13,letterSpacing:"0.06em",color:C.accent})}>{pt.label}</span>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",gap:16,flexWrap:"wrap"}}>
                <span style={d({fontWeight:700,fontSize:18,color:C.ink})}>{pt.title}</span>
                <span style={m({fontSize:8,letterSpacing:"0.18em",textTransform:"uppercase",color:C.inkMute})}>{pt.sub}</span>
              </div>
            </div>
            <div style={{display:"grid",gap:1}}>
              {modules.filter(md=>md.part===pt.id).map(md=>(
                <div key={md.n}>
                  <div onClick={()=>setOpen(open===md.n?null:md.n)}
                    style={{display:"grid",gridTemplateColumns:"56px 1fr auto auto",gap:16,alignItems:"center",
                      background:open===md.n?C.paper:C.cream,padding:"14px 20px",cursor:"pointer",
                      borderBottom:`1px solid ${C.rule}`,transition:"background 140ms"}}
                    onMouseEnter={e=>e.currentTarget.style.background=C.paper}
                    onMouseLeave={e=>e.currentTarget.style.background=open===md.n?C.paper:C.cream}>
                    <span style={d({fontWeight:700,fontSize:18,color:C.accent})}>M{md.n}</span>
                    <div>
                      <div style={d({fontWeight:600,fontSize:14,color:C.ink})}>{md.title}</div>
                      <div style={m({fontSize:8,letterSpacing:"0.12em",textTransform:"uppercase",color:C.inkMute,marginTop:2})}>{md.label}</div>
                    </div>
                    <span style={m({fontSize:9,color:C.inkMute,whiteSpace:"nowrap"})}>{md.lessons} lessons · {md.ceu} CEU</span>
                    <span style={{color:C.inkMute,fontSize:16,transition:"transform 200ms",
                      transform:open===md.n?"rotate(180deg)":"rotate(0deg)"}}>▾</span>
                  </div>
                  {open===md.n&&(
                    <div style={{background:C.paper,borderBottom:`1px solid ${C.rule}`,
                      padding:"16px 20px 16px 92px",display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"6px 24px"}}>
                      {md.topics.map((t,i)=>(
                        <div key={i} style={{display:"flex",alignItems:"flex-start",gap:8,padding:"4px 0"}}>
                          <span style={{width:5,height:5,borderRadius:"50%",background:C.accent,flexShrink:0,marginTop:7}}/>
                          <span style={{fontFamily:F.display,fontSize:12.5,color:C.inkSoft,lineHeight:1.5}}>{t}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ── EXAM SECTION ── */
function ExamSection({onSignUp}){
  const topics=["Photometry","Color & Vision","Light Sources","Controls","Daylighting","Energy Codes","Glare","Optics","Design Standards","Exterior Lighting","Ballasts","Conservation","Sustainability"]
  return(
    <section style={{padding:"96px 32px",background:C.ink}}>
      <div style={{maxWidth:1180,margin:"0 auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:80,alignItems:"center"}}>
        <div>
          <Kicker light>Practice exam</Kicker>
          <Heading size={48} light style={{marginBottom:20}}>
            {TOTAL_QUESTIONS} questions.<br/><em style={{fontStyle:"normal",color:C.accent}}>25 seconds each.</em>
          </Heading>
          <p style={{fontFamily:F.body,fontSize:15,color:"rgba(249,244,237,0.65)",lineHeight:1.75,margin:"0 0 28px"}}>
            Our LC exam practice engine simulates real test pressure — a timed ring, speed bonuses, and streak multipliers.
            After each session, see your accuracy broken down by topic.
          </p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:32}}>
            {[[String(TOTAL_QUESTIONS),"questions across 13 topics"],["25 sec","per question — timed"],["85%","accuracy needed to pass"],["Unlimited","attempts included"]].map(([v,l])=>(
              <div key={l} style={{background:"rgba(249,244,237,0.06)",border:"1px solid rgba(249,244,237,0.08)",borderRadius:4,padding:"16px 18px"}}>
                <div style={d({fontWeight:700,fontSize:22,color:"#fff",marginBottom:3})}>{v}</div>
                <div style={m({fontSize:8,letterSpacing:"0.14em",textTransform:"uppercase",color:"rgba(249,244,237,0.38)"})}>{l}</div>
              </div>
            ))}
          </div>
          <Btn variant="primary" onClick={onSignUp}>Included in Course + Exam →</Btn>
        </div>
        <div style={{background:"rgba(249,244,237,0.04)",border:"1px solid rgba(249,244,237,0.08)",borderRadius:4,padding:"28px 24px"}}>
          <div style={m({fontSize:9,letterSpacing:"0.22em",textTransform:"uppercase",color:C.tan,marginBottom:16})}>13 topics covered</div>
          <div style={{display:"grid",gap:1}}>
            {topics.map((t,i)=>(
              <div key={t} style={{display:"flex",alignItems:"center",justifyContent:"space-between",
                padding:"10px 14px",background:"rgba(249,244,237,0.04)",borderRadius:2,
                fontFamily:F.display,fontSize:13,color:"rgba(249,244,237,0.72)"}}>
                {t}
                <span style={m({fontSize:8,color:"rgba(249,244,237,0.28)",letterSpacing:"0.1em"})}>
                  {[12,8,14,16,8,10,6,8,12,8,8,6,8][i]}Q
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── PRICING ── */
function Pricing({onSignUp}){
  const T1_PRICE = 250, T2_PRICE = 395, T3_PRICE = 595, TEAM_PER_SEAT = 360

  const [seats, setSeats] = useState(5)
  const teamContactUs = seats >= 11
  const teamTotal = teamContactUs ? null : seats * TEAM_PER_SEAT
  const teamSavings = teamContactUs ? null : seats * T3_PRICE - teamTotal

  const [teamTab, setTeamTab] = useState("individual")

  const individualPlans = [
    {
      id:"t1",label:"LC Preparation Test",tag:"Tier 1",price:T1_PRICE,
      badge:null,dim:false,dark:false,
      desc:"Already studied? Use our LC practice engine as your final accuracy check before exam day.",
      includes:["50 LC practice questions","13 topic breakdown","25-sec timed exam","Speed bonuses & streaks","Per-topic accuracy report","Unlimited attempts"],
      cta:"Get LC Preparation Test →",
    },
    {
      id:"t2",label:"Full Course",tag:"Tier 2",price:T2_PRICE,
      badge:"Most popular",badgeColor:C.accent,
      dim:false,dark:false,
      desc:"All 12 modules structured around the LC exam blueprint. Certificate + 24 CEU hours.",
      includes:["All 12 modules · 74 lessons","Audio narration every lesson","Bookmarks & notes hub","Certificate of completion","24 CEU credit hours"],
      addon:"+ LC Preparation Test add-on for $200",
      cta:"Start Full Course →",
    },
    {
      id:"t3",label:"Full Course + Exam",tag:"Tier 3",price:T3_PRICE,
      badge:"Best value",badgeColor:C.accent,
      dim:false,dark:true,
      desc:"The complete package — full course access plus the LC practice exam. Best path to passing.",
      includes:["Everything in Full Course","LC Preparation Test included","50 LC practice questions","Unlimited exam attempts","Topic accuracy analytics","Priority support"],
      cta:"Start Course + Exam →",
    },
  ]

  return(
    <section id="pricing" style={{padding:"96px 32px",background:C.cream,borderTop:`1px solid ${C.rule}`}}>
      <div style={{maxWidth:1180,margin:"0 auto"}}>

        {/* Header */}
        <div style={{textAlign:"center",marginBottom:36}}>
          <div style={{fontFamily:F.mono,fontSize:9,letterSpacing:"0.26em",textTransform:"uppercase",color:C.accent,marginBottom:12}}>Pricing</div>
          <h2 style={{fontFamily:F.display,fontWeight:700,fontSize:"clamp(26px,4vw,42px)",letterSpacing:"-0.025em",lineHeight:1.05,color:C.ink,margin:"0 0 12px"}}>
            Simple, transparent <em style={{fontStyle:"normal",color:C.accent}}>one-time pricing.</em>
          </h2>
          <p style={{fontFamily:F.body,fontSize:15,color:C.inkMute,maxWidth:480,margin:"0 auto",lineHeight:1.7}}>
            No subscriptions. Pay once, study for your window, pass the exam.
          </p>
        </div>

        {/* Individual / Team toggle */}
        <div style={{display:"flex",justifyContent:"center",marginBottom:28}}>
          <div style={{display:"flex",background:C.creamWarm,border:`1px solid ${C.rule}`,borderRadius:99,padding:4,gap:2}}>
            {[["individual","Individual plans"],["team","Team & studio"]].map(([val,label])=>(
              <button key={val} onClick={()=>setTeamTab(val)}
                style={{fontFamily:F.display,fontWeight:600,fontSize:13,borderRadius:99,
                  padding:"9px 24px",border:"none",cursor:"pointer",
                  background:teamTab===val?C.ink:"none",
                  color:teamTab===val?"#fff":C.inkMute,
                  transition:"all 0.2s"}}>
                {label}
                {val==="team"&&<span style={{marginLeft:8,background:C.forest,color:"#fff",
                  fontFamily:F.mono,fontSize:9,fontWeight:700,letterSpacing:"0.08em",
                  padding:"2px 7px",borderRadius:99}}>Save 39%+</span>}
              </button>
            ))}
          </div>
        </div>

        {/* ── INDIVIDUAL PLANS ── */}
        {teamTab==="individual"&&(
          <div style={{maxWidth:1000,margin:"0 auto"}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:1,
              border:`1px solid ${C.rule}`,borderRadius:8,overflow:"hidden"}}>
              {individualPlans.map((plan,i)=>(
                <div key={plan.id} style={{background:plan.dark?C.ink:C.paper,
                  padding:"28px 22px",borderRight:i<individualPlans.length-1?`1px solid ${C.rule}`:"none",
                  position:"relative",display:"flex",flexDirection:"column"}}>
                  {plan.badge&&<span style={{position:"absolute",top:14,right:14,
                    background:plan.badgeColor||C.accent,color:"#fff",
                    fontFamily:F.mono,fontSize:8,fontWeight:700,letterSpacing:"0.12em",
                    textTransform:"uppercase",padding:"3px 9px",borderRadius:99,whiteSpace:"nowrap"}}>
                    {plan.badge}
                  </span>}
                  <div style={{fontFamily:F.mono,fontSize:8,letterSpacing:"0.2em",textTransform:"uppercase",
                    color:plan.dark?C.tan:C.inkMute,marginBottom:5}}>{plan.tag}</div>
                  <div style={{fontFamily:F.display,fontWeight:700,fontSize:15,
                    color:plan.dark?"#fff":C.ink,marginBottom:10,paddingRight:plan.badge?52:0}}>{plan.label}</div>
                  <div style={{marginBottom:4}}>
                    <span style={{fontFamily:F.display,fontWeight:700,fontSize:34,
                      color:plan.dark?"#fff":C.ink,
                      letterSpacing:"-0.02em",lineHeight:1}}>${plan.price}</span>
                    <span style={{fontFamily:F.mono,fontSize:9,
                      color:plan.dark?"rgba(249,244,237,0.45)":C.inkMute,marginLeft:5}}>one-time</span>
                  </div>
                  <div style={{fontFamily:F.body,fontSize:11,
                    color:plan.dark?"rgba(249,244,237,0.38)":C.inkMute,marginBottom:10}}>
                    Access until Dec 31, {new Date().getFullYear()}
                  </div>
                  <p style={{fontFamily:F.body,fontSize:12,
                    color:plan.dark?"rgba(249,244,237,0.6)":C.inkMute,
                    margin:"0 0 14px",lineHeight:1.6,flex:1}}>{plan.desc}</p>
                  <div style={{marginBottom:16}}>
                    {plan.includes.map((item,j)=>(
                      <div key={j} style={{display:"flex",alignItems:"flex-start",gap:7,padding:"4px 0",
                        borderBottom:j<plan.includes.length-1?`1px solid ${plan.dark?"rgba(249,244,237,0.07)":C.rule}`:"none"}}>
                        <span style={{color:plan.dark?"rgba(249,244,237,0.4)":C.forest,fontSize:11,flexShrink:0}}>✓</span>
                        <span style={{fontFamily:F.display,fontSize:11,
                          color:plan.dark?"rgba(249,244,237,0.75)":C.inkSoft,lineHeight:1.5}}>{item}</span>
                      </div>
                    ))}
                    {plan.addon&&<div style={{marginTop:8,fontFamily:F.body,fontSize:10.5,
                      color:plan.dark?"rgba(249,244,237,0.38)":C.inkMute,fontStyle:"italic"}}>
                      {plan.addon}
                    </div>}
                  </div>
                  <button onClick={onSignUp}
                    style={{width:"100%",padding:"11px",borderRadius:99,
                      border:plan.dark?"none":`1px solid ${C.ruleStrong}`,
                      background:plan.dark?C.accent:"none",
                      color:plan.dark?"#fff":C.inkSoft,
                      fontFamily:F.display,fontWeight:700,fontSize:13,
                      cursor:"pointer",transition:"all 0.15s",marginTop:"auto"}}
                    onMouseEnter={e=>{if(!plan.dark){e.currentTarget.style.background=C.accent;e.currentTarget.style.color="#fff";e.currentTarget.style.borderColor=C.accent}}}
                    onMouseLeave={e=>{if(!plan.dark){e.currentTarget.style.background="none";e.currentTarget.style.color=C.inkSoft;e.currentTarget.style.borderColor=C.ruleStrong}}}>
                    {plan.cta}
                  </button>
                </div>
              ))}
            </div>
            <p style={{textAlign:"center",fontFamily:F.body,fontSize:13,color:C.inkMute,marginTop:20,lineHeight:1.7}}>
              All plans include a <strong style={{color:C.inkSoft}}>free trial</strong> — Module 01 in full + 10 LC practice questions. No card required.
            </p>
          </div>
        )}

        {/* ── TEAM PLAN ── */}
        {teamTab==="team"&&(
          <div style={{maxWidth:1000,margin:"0 auto"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:1,
              border:`1px solid ${C.rule}`,borderRadius:8,overflow:"hidden"}}>

              {/* Left — seat slider */}
              <div style={{background:C.ink,padding:"36px 32px"}}>
                <div style={{fontFamily:F.mono,fontSize:9,letterSpacing:"0.22em",
                  textTransform:"uppercase",color:C.tan,marginBottom:6}}>Team / Studio</div>
                <div style={{fontFamily:F.display,fontWeight:700,fontSize:16,
                  color:"#fff",marginBottom:20}}>How many seats?</div>

                {/* Seat count display */}
                <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:6}}>
                  <span style={{fontFamily:F.display,fontWeight:700,fontSize:52,
                    color:"#fff",letterSpacing:"-0.03em",lineHeight:1}}>{seats>=11?"11+":seats}</span>
                  <span style={{fontFamily:F.mono,fontSize:12,color:"rgba(249,244,237,0.45)"}}>seats</span>
                </div>

                {/* Price display */}
                {!teamContactUs?(
                  <div style={{marginBottom:20}}>
                    <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:4}}>
                      <span style={{fontFamily:F.display,fontWeight:700,fontSize:38,
                        color:C.accent,letterSpacing:"-0.02em",lineHeight:1}}>
                        ${teamTotal?.toLocaleString()}
                      </span>
                      <span style={{fontFamily:F.mono,fontSize:10,color:"rgba(249,244,237,0.4)"}}>one-time</span>
                    </div>
                    <div style={{display:"flex",gap:16}}>
                      <div style={{fontFamily:F.mono,fontSize:11,color:"rgba(249,244,237,0.5)"}}>
                        ${TEAM_PER_SEAT}/seat
                      </div>
                      <div style={{fontFamily:F.mono,fontSize:11,color:C.forest}}>
                        Save ${teamSavings?.toLocaleString()} vs individual
                      </div>
                    </div>
                  </div>
                ):(
                  <div style={{marginBottom:20}}>
                    <div style={{fontFamily:F.display,fontWeight:700,fontSize:28,
                      color:C.accent,marginBottom:6}}>Custom pricing</div>
                    <div style={{fontFamily:F.mono,fontSize:11,color:"rgba(249,244,237,0.5)"}}>
                      Studios of 11+ get dedicated pricing and onboarding
                    </div>
                  </div>
                )}

                {/* Slider */}
                <div style={{marginBottom:24}}>
                  <style>{`
                    .seat-slider{width:100%;-webkit-appearance:none;appearance:none;
                      height:4px;background:rgba(249,244,237,0.15);border-radius:2px;outline:none;cursor:pointer}
                    .seat-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;
                      width:20px;height:20px;border-radius:50%;background:#C65A3A;cursor:pointer;
                      border:2px solid rgba(249,244,237,0.3);transition:transform 0.1s}
                    .seat-slider::-webkit-slider-thumb:hover{transform:scale(1.2)}
                    .seat-slider::-moz-range-thumb{width:20px;height:20px;border-radius:50%;
                      background:#C65A3A;cursor:pointer;border:2px solid rgba(249,244,237,0.3)}
                  `}</style>
                  <input type="range" min={5} max={11} value={seats}
                    onChange={e=>setSeats(parseInt(e.target.value))}
                    className="seat-slider"/>
                  <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
                    <span style={{fontFamily:F.mono,fontSize:9,color:"rgba(249,244,237,0.3)"}}>5 seats</span>
                    <span style={{fontFamily:F.mono,fontSize:9,color:"rgba(249,244,237,0.3)"}}>11+ seats</span>
                  </div>
                </div>

                {/* Pricing tiers legend */}
                <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:24}}>
                  {[
                    {range:"5–10 seats",price:"$360/seat",active:seats<=10},
                    {range:"11+ seats",price:"Contact us",active:seats>=11},
                  ].map(tier=>(
                    <div key={tier.range} style={{display:"flex",alignItems:"center",
                      justifyContent:"space-between",padding:"6px 10px",borderRadius:6,
                      background:tier.active?"rgba(198,90,58,0.2)":"rgba(255,255,255,0.03)",
                      border:`1px solid ${tier.active?C.accent+"60":"rgba(255,255,255,0.06)"}`,
                      transition:"all 0.2s"}}>
                      <span style={{fontFamily:F.mono,fontSize:11,
                        color:tier.active?"#fff":"rgba(249,244,237,0.4)"}}>{tier.range}</span>
                      <span style={{fontFamily:F.display,fontWeight:700,fontSize:13,
                        color:tier.active?C.accent:"rgba(249,244,237,0.3)"}}>{tier.price}</span>
                    </div>
                  ))}
                </div>

                {!teamContactUs?(
                  <button onClick={onSignUp}
                    style={{width:"100%",padding:"13px",borderRadius:99,border:"none",
                      background:C.accent,color:"#fff",fontFamily:F.display,
                      fontWeight:700,fontSize:14,cursor:"pointer",transition:"opacity 0.15s"}}
                    onMouseEnter={e=>e.currentTarget.style.opacity="0.88"}
                    onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                    Start team plan — ${teamTotal?.toLocaleString()} →
                  </button>
                ):(
                  <a href="mailto:admin@luxartmedia.com?subject=Team%20Plan%20Inquiry"
                    style={{display:"block",width:"100%",padding:"13px",borderRadius:99,
                      border:`1px solid ${C.accent}`,background:"none",color:C.accent,
                      fontFamily:F.display,fontWeight:700,fontSize:14,cursor:"pointer",
                      textAlign:"center",textDecoration:"none",transition:"all 0.15s"}}
                    onMouseEnter={e=>{e.currentTarget.style.background=C.accent;e.currentTarget.style.color="#fff"}}
                    onMouseLeave={e=>{e.currentTarget.style.background="none";e.currentTarget.style.color=C.accent}}>
                    Contact us for custom pricing →
                  </a>
                )}
              </div>

              {/* Right — what's included */}
              <div style={{background:C.paper,padding:"36px 32px",display:"flex",flexDirection:"column"}}>
                <div style={{fontFamily:F.mono,fontSize:9,letterSpacing:"0.22em",
                  textTransform:"uppercase",color:C.inkMute,marginBottom:6}}>What's included</div>
                <div style={{fontFamily:F.display,fontWeight:700,fontSize:16,color:C.ink,marginBottom:20}}>
                  Every seat gets everything.
                </div>

                {/* Per-member access */}
                <div style={{marginBottom:20}}>
                  <div style={{fontFamily:F.display,fontWeight:600,fontSize:12,
                    color:C.inkMute,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:10}}>
                    Per member
                  </div>
                  {["All 12 modules · 74 lessons","Audio narration every lesson","LC practice exam · 50 questions","Unlimited exam attempts","Bookmarks, notes & progress tracking","Certificate of completion","24 CEU credit hours"].map((item,i,arr)=>(
                    <div key={i} style={{display:"flex",alignItems:"flex-start",gap:8,padding:"5px 0",
                      borderBottom:i<arr.length-1?`1px solid ${C.rule}`:"none"}}>
                      <span style={{color:C.forest,fontSize:12,flexShrink:0}}>✓</span>
                      <span style={{fontFamily:F.display,fontSize:13,color:C.inkSoft,lineHeight:1.5}}>{item}</span>
                    </div>
                  ))}
                </div>

                {/* Team admin features */}
                <div style={{marginBottom:24}}>
                  <div style={{fontFamily:F.display,fontWeight:600,fontSize:12,
                    color:C.inkMute,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:10}}>
                    Team admin dashboard
                  </div>
                  {["Team progress overview — all members at a glance","See each member's module completion & exam scores","Invite members by email — they get a direct link","Remove or reassign seats instantly","Consolidated billing — one invoice for all seats","Access expires Dec 31, {year} for all seats".replace("{year}",new Date().getFullYear())].map((item,i,arr)=>(
                    <div key={i} style={{display:"flex",alignItems:"flex-start",gap:8,padding:"5px 0",
                      borderBottom:i<arr.length-1?`1px solid ${C.rule}`:"none"}}>
                      <span style={{color:C.accent,fontSize:12,flexShrink:0}}>✦</span>
                      <span style={{fontFamily:F.display,fontSize:13,color:C.inkSoft,lineHeight:1.5}}>{item}</span>
                    </div>
                  ))}
                </div>

                {/* Savings callout */}
                {!teamContactUs&&(
                  <div style={{marginTop:"auto",background:C.forestLight,
                    border:`1px solid ${C.forest}`,borderRadius:10,padding:"14px 16px"}}>
                    <div style={{fontFamily:F.display,fontWeight:700,fontSize:13,
                      color:C.forest,marginBottom:4}}>
                      vs. {seats} individual Full Course + Exam plans
                    </div>
                    <div style={{display:"flex",alignItems:"baseline",gap:10}}>
                      <span style={{fontFamily:F.mono,fontSize:11,
                        color:C.inkMute,textDecoration:"line-through"}}>
                        ${(seats*T3_PRICE).toLocaleString()}
                      </span>
                      <span style={{fontFamily:F.display,fontWeight:700,fontSize:18,color:C.forest}}>
                        ${teamTotal?.toLocaleString()}
                      </span>
                      <span style={{fontFamily:F.mono,fontSize:11,color:C.forest}}>
                        Save ${teamSavings?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <p style={{textAlign:"center",fontFamily:F.body,fontSize:13,color:C.inkMute,marginTop:20,lineHeight:1.7}}>
              Team access expires Dec 31, {new Date().getFullYear()} for all seats. Need a multi-year deal?{" "}
              <a href="mailto:admin@luxartmedia.com" style={{color:C.accent}}>Contact us.</a>
            </p>
          </div>
        )}
      </div>
    </section>
  )
}


/* ── TESTIMONIALS ── */
function Testimonials(){
  const quotes=[
    {name:"Marcus T.",role:"Lighting Designer · Gensler",text:"I've taken a lot of continuing ed courses. This is the only one that actually felt like it was built to make me pass the NCQLP, not just collect CEUs."},
    {name:"Priya K.",role:"Associate, HLB Lighting",text:"The practice exam alone is worth it. The speed timer puts you in the exact headspace of the real test. My score went from 68% to 91% in three sessions."},
    {name:"Sarah L.",role:"Lighting Designer · AECOM",text:"The curriculum structure is exactly what I needed — it covers the IES standards and ASHRAE energy codes in a way that finally made them click. Passed NCQLP on my first attempt."},
  ]
  return(
    <section style={{padding:"96px 32px",background:C.creamWarm,borderTop:`1px solid ${C.rule}`}}>
      <div style={{maxWidth:1180,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:48}}>
          <Kicker center>Testimonials</Kicker>
          <Heading size={40} center style={{textAlign:"center"}}>
            What designers are<br/><em style={{fontStyle:"normal",color:C.accent}}>saying.</em>
          </Heading>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:1,
          border:`1px solid ${C.rule}`,borderRadius:4,overflow:"hidden"}}>
          {quotes.map((q,i)=>(
            <div key={i} style={{background:C.paper,padding:"32px 28px",
              borderRight:i<2?`1px solid ${C.rule}`:"none"}}>
              <div style={{fontSize:24,color:C.accent,marginBottom:16,fontFamily:F.display,lineHeight:1}}>"</div>
              <p style={{fontFamily:F.body,fontSize:14,color:C.inkSoft,lineHeight:1.75,
                margin:"0 0 24px",fontStyle:"italic"}}>{q.text}</p>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:34,height:34,borderRadius:"50%",background:C.accent,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontFamily:F.display,fontWeight:700,fontSize:11,color:"#fff",flexShrink:0}}>
                  {q.name.split(" ").map(w=>w[0]).join("")}
                </div>
                <div>
                  <div style={d({fontWeight:600,fontSize:13,color:C.ink})}>{q.name}</div>
                  <div style={m({fontSize:8,letterSpacing:"0.1em",color:C.inkMute})}>{q.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── FAQ ── */
function FAQ(){
  const [open,setOpen] = useState(null)
  const faqs=[
    ["Who is this for?","LC · Lighting Master is built for North American lighting designers preparing for the Lighting Certified (LC) exam — whether sitting it for the first time or retaking it."],
    ["How long do I have access?","Free accounts get unlimited access to Module 01 and 10 LC practice questions — no time limit, no card required. Paid plans unlock everything: Full Course gives you 6 months from purchase, Course + Exam gives you 12 months."],
    ["Does this replace the official LC exam?","No — LC · Lighting Master is an independent preparation and practice tool. The official Lighting Certified (LC) exam is administered separately. We are not affiliated with or endorsed by the credentialing organization."],
    ["What's included in the practice exam?","50 timed multiple-choice questions across 13 topics, aligned with the LC exam topic blueprint. A 25-second timer, speed bonuses, streak multipliers, and per-topic accuracy analytics after each session."],
    ["Is there a team or studio plan?","Yes — Team plans give every member full Course + Exam access, plus a shared team dashboard showing each designer's module progress and exam scores. The team admin manages seats, invites members by email, and handles billing from one place. Pricing starts at $1,800 for 3–5 seats (~$360/seat) and $2,800 for 6–10 seats (~$280/seat). Studios of 10+ can contact us for custom pricing."],
    ["What CEU hours does this cover?","24 CEU credit hours across all 12 modules. The certificate of completion documents your hours."],
    ["Can I try before I buy?","Yes — your free account unlocks Module 01 (Theory, Light, Sight & Color) in full, plus 10 LC practice questions from the test engine. No credit card, no time limit. Upgrade when you're ready to unlock the remaining 11 modules and full exam."],
  ]
  return(
    <section id="faq" style={{padding:"96px 32px",background:C.cream,borderTop:`1px solid ${C.rule}`}}>
      <div style={{maxWidth:720,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:48}}>
          <Kicker center>FAQ</Kicker>
          <Heading size={44} center style={{textAlign:"center"}}>
            Common <em style={{fontStyle:"normal",color:C.accent}}>questions.</em>
          </Heading>
        </div>
        <div style={{border:`1px solid ${C.rule}`,borderRadius:4,overflow:"hidden"}}>
          {faqs.map(([q,a],i)=>(
            <div key={i} style={{borderBottom:i<faqs.length-1?`1px solid ${C.rule}`:"none"}}>
              <button onClick={()=>setOpen(open===i?null:i)}
                style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",
                  padding:"18px 24px",background:open===i?C.creamWarm:C.paper,border:"none",
                  cursor:"pointer",textAlign:"left",transition:"background 140ms",gap:16}}>
                <span style={d({fontWeight:600,fontSize:14,color:C.ink,lineHeight:1.4})}>{q}</span>
                <span style={{color:C.inkMute,fontSize:18,flexShrink:0,transition:"transform 200ms",
                  transform:open===i?"rotate(45deg)":"rotate(0deg)"}}>+</span>
              </button>
              {open===i&&(
                <div style={{padding:"4px 24px 20px",background:C.creamWarm}}>
                  <p style={{fontFamily:F.body,fontSize:13.5,color:C.inkSoft,lineHeight:1.75,margin:0}}>{a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── FINAL CTA ── */
function FinalCTA({onSignUp}){
  return(
    <section style={{padding:"96px 32px",background:C.ink}}>
      <div style={{maxWidth:720,margin:"0 auto",textAlign:"center"}}>
        <Kicker light center>Free forever · No card needed</Kicker>
        <Heading size={52} light style={{marginBottom:20,textAlign:"center"}}>
          Start with Module 01.<br/><em style={{fontStyle:"normal",color:C.accent}}>Upgrade when ready.</em>
        </Heading>
        <p style={{fontFamily:F.body,fontSize:15,color:"rgba(249,244,237,0.6)",
          maxWidth:500,margin:"0 auto 36px",lineHeight:1.75}}>
          Create a free account and get full access to Module 01 —
          6 lessons, audio narration, and 10 LC practice questions. No credit card, no time limit.
        </p>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,flexWrap:"wrap"}}>
          <Btn variant="primary" onClick={onSignUp} style={{fontSize:15,padding:"15px 36px"}}>
            Create your free account →
          </Btn>
          <Btn variant="ghostLight" onClick={()=>scrollTo("pricing")} style={{fontSize:14,padding:"14px 24px"}}>
            See pricing
          </Btn>
        </div>
        <p style={{fontFamily:F.body,fontSize:12,color:"rgba(249,244,237,0.32)",marginTop:20}}>
          Free forever · No credit card · Upgrade to unlock everything
        </p>
      </div>
    </section>
  )
}

/* ── FOOTER ── */

/* ══ LEGAL DOCUMENTS + MODAL ══════════════════════════════════════ */

const LEGAL_DOCS = {
  privacy: {
    title: "Privacy Policy",
    subtitle: "How we collect, use and protect your information",
    updated: "June 1, 2025",
    version: "v1.0",
    sections: [
      {h:"1. Who we are", body:"LC · Lighting Master is an online examination preparation platform operated by Luxart LLC, a limited liability company registered in the United States. References to \"we\", \"us\", or \"our\" in this policy mean Luxart LLC. Our primary contact for privacy matters is admin@luxartmedia.com."},
      {h:"2. Information we collect", body:"We collect information you provide directly: your first and last name, professional email address, company name, US state, and a hashed password when you create an account. We also collect payment information processed on your behalf by Stripe, Inc. — we never store raw card numbers. When you use the platform we automatically collect usage data including lesson progress, exam attempts and scores, bookmarks, notes, session timestamps, and browser/device type for compatibility purposes."},
      {h:"3. How we use your information", body:"We use your information to: deliver and improve the LC · Lighting Master platform; process payments and send transactional emails (receipts, access confirmations, expiry warnings); track your individual learning progress; send optional weekly progress summaries and product announcements you can unsubscribe from at any time; comply with legal obligations; and prevent fraud and abuse."},
      {h:"4. Legal bases (GDPR)", body:"If you are located in the European Economic Area, our legal bases for processing are: performance of a contract (account management, service delivery); legitimate interests (platform security, fraud prevention, aggregate analytics); consent (marketing emails — withdrawable at any time); and legal obligation."},
      {h:"5. Sharing of information", body:"We do not sell your personal information. We share data only with: Stripe, Inc. (payment processing); email service providers for transactional and marketing emails; cloud infrastructure providers under confidentiality obligations; and law enforcement or regulators when required by law. We do not share your data with employers, credentialing bodies, or any third-party advertisers."},
      {h:"6. Data retention", body:"Account data is retained for the duration of your active account plus 2 years to handle disputes and regulatory requirements, then deleted. Payment records are retained for 7 years as required by US tax law. You may request earlier deletion by emailing admin@luxartmedia.com — requests are processed within 30 days."},
      {h:"7. Your rights", body:"You have the right to access, correct, export, or delete your personal data at any time. US residents have additional rights under applicable state privacy laws including the right to know categories of data collected and to opt out of certain processing. Submit requests to admin@luxartmedia.com. We will respond within 30 days and will not discriminate against you for exercising these rights."},
      {h:"8. Cookies & tracking", body:"We use essential cookies required for authentication and session management. We use analytics cookies to understand platform usage. See our Cookie Policy for full details. You may disable non-essential cookies at any time without losing access to the platform."},
      {h:"9. Security", body:"We implement industry-standard security measures including TLS 1.3 encryption in transit, bcrypt password hashing, and access controls limiting employee data access to job functions. No transmission over the internet is 100% secure — if you believe your account has been compromised, contact us immediately at admin@luxartmedia.com."},
      {h:"10. Children", body:"LC · Lighting Master is intended for professional adults. We do not knowingly collect data from persons under 18. If we learn we have collected data from a minor, we will delete it promptly."},
      {h:"11. Changes to this policy", body:"We will notify users of material changes by email at least 14 days before they take effect. Continued use of the platform after the effective date constitutes acceptance. The current version and date are always shown at the top of this document."},
      {h:"12. Contact", body:"Privacy questions or requests: admin@luxartmedia.com. Luxart LLC, United States. We aim to respond within 5 business days."},
    ]
  },
  terms: {
    title: "Terms of Service",
    subtitle: "Your agreement with Luxart LLC for use of LC · Lighting Master",
    updated: "June 1, 2025",
    version: "v1.0",
    sections: [
      {h:"1. Agreement", body:"By creating an account or purchasing access, you enter into a binding agreement with Luxart LLC (\"Luxart\", \"we\", \"us\") and agree to these Terms. If you do not agree, do not use the platform. These Terms apply to all individual and team subscribers."},
      {h:"2. Description of service", body:"LC · Lighting Master provides online educational content, practice examinations, and study tools to help professionals prepare for the Lighting Certified (LC) examination. We are an independent preparation service and are not affiliated with, endorsed by, or connected to the National Council on Qualifications for the Lighting Professions (NCQLP) or any examination body."},
      {h:"3. Accounts", body:"You must be at least 18 years old to create an account. You are responsible for maintaining the confidentiality of your credentials and for all activity under your account. You may not share, transfer, or sell account access. Notify us immediately at admin@luxartmedia.com if you suspect unauthorized access."},
      {h:"4. Subscriptions and access", body:"Access is granted for a calendar-year window expiring December 31 of the year of purchase, or for the specific period shown at checkout. All plans are single-user unless purchased as a team plan. Team plans grant access to the specified number of seats managed by a designated team administrator. Seat assignments may be changed by the team administrator up to the seat limit."},
      {h:"4a. License & Permitted Use",
       bodyPre:"Each LC · Lighting Master license is issued to a single named individual (\"Licensee\") and is non-transferable. The following are strictly prohibited:",
       list:[
         "Sharing login credentials with any other person",
         "Allowing any third party to access your account",
         "Using your account on behalf of another individual",
         "Purchasing a single license for use by multiple people",
       ],
       body:"Luxart LLC actively monitors for concurrent sessions and anomalous login patterns. Accounts found to be shared will be terminated without refund and without prior notice, in accordance with our refund policy. Teams of two or more must purchase a Team License. By completing your purchase you agree that your license is for your individual use only."},
      {h:"5. Acceptable use", body:"You agree not to: reproduce, distribute, or publicly display course content, exam questions, or any proprietary material without written permission; attempt to reverse-engineer, scrape, or circumvent any access controls; share login credentials; use the platform for any unlawful purpose; or upload harmful code. Violations may result in immediate account termination without refund."},
      {h:"6. Intellectual property", body:"All content on LC · Lighting Master — including lesson text, exam questions, diagrams, audio narration, visual assets, and software — is owned by or licensed to Luxart LLC and protected by copyright. Your subscription grants a limited, non-exclusive, non-transferable license to access content for personal study purposes only. No rights are granted beyond this license."},
      {h:"7. Disclaimers", body:"LC · Lighting Master is provided \"as is\" without warranty of any kind. We do not guarantee that use of our platform will result in passing any examination. Examination formats, content, and pass rates are set by the relevant credentialing body and are outside our control. We disclaim all warranties, express or implied, to the fullest extent permitted by law."},
      {h:"8. Limitation of liability", body:"To the fullest extent permitted by applicable law, Luxart LLC's total liability to you for any claim arising from your use of the platform is limited to the amount you paid us in the 12 months preceding the claim. We are not liable for indirect, incidental, special, or consequential damages, including lost profits or examination fees."},
      {h:"9. Indemnification", body:"You agree to indemnify and hold harmless Luxart LLC and its officers, employees, and agents from any claims, damages, or costs (including legal fees) arising from your violation of these Terms or misuse of the platform."},
      {h:"10. Termination", body:"Either party may terminate the agreement at any time. If we terminate your account for cause (e.g., Terms violation), no refund will be issued. If you cancel voluntarily, the Refund Policy applies. Upon termination, your license to access content ends and you must stop using the platform."},
      {h:"11. Governing law & disputes", body:"These Terms are governed by the laws of the United States. Any dispute that cannot be resolved informally will be submitted to binding arbitration under the American Arbitration Association's Consumer Arbitration Rules, conducted in English. Class action waiver: you waive the right to participate in class action lawsuits or class-wide arbitration."},
      {h:"12. Changes to terms", body:"We may update these Terms with at least 14 days' notice by email. Continued use after the effective date constitutes acceptance. If you disagree with material changes, you may cancel under the Refund Policy."},
      {h:"13. Contact", body:"Legal questions: admin@luxartmedia.com. Luxart LLC, United States."},
    ]
  },
  cookies: {
    title: "Cookie Policy",
    subtitle: "How LC · Lighting Master uses cookies and similar technologies",
    updated: "June 1, 2025",
    version: "v1.0",
    sections: [
      {h:"1. What are cookies", body:"Cookies are small text files placed on your device by websites you visit. They are widely used to make sites work efficiently and to provide reporting information. LC · Lighting Master uses both first-party cookies (set by us) and third-party cookies (set by our service providers)."},
      {h:"2. Essential cookies", body:"These cookies are strictly necessary for the platform to function. They manage your login session and authentication state, remember your language and display preferences, and prevent cross-site request forgery. You cannot opt out of essential cookies without losing access to your account. These cookies are deleted when you sign out or your session expires."},
      {h:"3. Analytics cookies", body:"We use privacy-respecting analytics to understand how learners navigate the platform, which lessons are most revisited, and where users encounter friction. Analytics data is aggregated and not linked to identifiable individuals. We do not use Google Analytics. You may opt out of analytics cookies in your Account settings without affecting platform functionality."},
      {h:"4. Preference cookies", body:"These cookies remember your choices: audio playback speed, last lesson position, sidebar state, and exam session configuration. Disabling them means the platform cannot remember your preferences between sessions."},
      {h:"5. Payment cookies", body:"Our payment processor Stripe, Inc. sets cookies necessary to detect fraud and process payments securely. These are set only during checkout flows. Stripe's cookie practices are governed by Stripe's own Privacy Policy."},
      {h:"6. No advertising cookies", body:"We do not use advertising cookies, cross-site tracking pixels, or behavioral retargeting technologies. We do not partner with advertising networks. No cookie data is shared with advertisers."},
      {h:"7. Managing cookies", body:"You can control cookies through your browser settings — most browsers allow you to block, delete, or receive alerts for cookies. Blocking essential cookies will prevent you from signing in. To opt out of analytics cookies specifically, visit Account > Notifications in the platform. For questions about our cookie use, contact admin@luxartmedia.com."},
      {h:"8. Changes", body:"We will notify users of material changes to our cookie practices at least 14 days before they take effect. The current version and date are shown at the top of this document."},
    ]
  },
  refund: {
    title: "Refund Policy",
    subtitle: "Our commitment to fair and transparent refunds",
    updated: "June 1, 2025",
    version: "v1.0",
    sections: [
      {h:"1. Our commitment", body:"We want you to feel confident purchasing LC · Lighting Master. If the platform is not right for you, we offer a straightforward refund process. All refund requests should be submitted to admin@luxartmedia.com with your account email and reason."},
      {h:"2. 14-day money-back guarantee — individual plans", body:"Individual subscribers (Tier 1, Tier 2, Tier 3) may request a full refund within 14 days of purchase, no questions asked, provided they have completed fewer than 3 full lessons. Once 3 or more lessons have been completed, the guarantee no longer applies and refunds are issued at our discretion. To claim: email admin@luxartmedia.com within 14 days of purchase with subject line \"Refund Request\"."},
      {h:"3. Team plans", body:"Team plan purchases are refundable within 14 days provided no team members have accessed the platform. Once any seat has been activated (first login by any team member), team plans are non-refundable. If you purchase a team plan and need to cancel before activation, contact admin@luxartmedia.com immediately."},
      {h:"4. Exam add-on", body:"The practice exam add-on ($200) is refundable within 14 days of purchase if fewer than 2 exam sessions have been started. Once 2 or more sessions have been completed, the add-on is non-refundable."},
      {h:"5. Seasonal and promotional pricing", body:"Purchases made at a promotional or seasonal discount (Early Bird, Last-Minute October pricing) are subject to the same refund terms above. The refund amount is always the amount actually paid, not the standard list price."},
      {h:"6. Renewals and re-purchases", body:"Access expires on December 31 of the year of purchase. If you re-purchase for the following year, refund eligibility resets. If you purchase and your access window has already expired, contact us immediately — we will extend your access or issue a full refund within 24 hours."},
      {h:"7. Chargebacks", body:"We ask that you contact us before initiating a chargeback with your card issuer. Unresolved chargebacks result in immediate account suspension and may affect future purchase eligibility. We respond to all billing disputes within 2 business days."},
      {h:"8. Processing time", body:"Approved refunds are processed within 5–10 business days and returned to the original payment method. You will receive a confirmation email when the refund is initiated. Processing time after that depends on your card issuer, typically 3–5 additional business days."},
      {h:"9. Contact", body:"All refund requests and billing questions: admin@luxartmedia.com. We aim to respond within 1 business day. Luxart LLC, United States."},
    ]
  }
}

function LegalModal({doc, onClose}) {
  const data = LEGAL_DOCS[doc]
  useEffect(()=>{
    const handler = e => { if(e.key==="Escape") onClose() }
    window.addEventListener("keydown", handler)
    return ()=>window.removeEventListener("keydown", handler)
  },[onClose])
  if(!data) return null
  return(
    <div
      onClick={e=>{ if(e.target===e.currentTarget) onClose() }}
      style={{position:"fixed",inset:0,background:"rgba(47,74,63,0.72)",
        zIndex:9999,display:"flex",alignItems:"flex-start",justifyContent:"center",
        padding:"40px 20px",overflowY:"auto"}}>
      <div style={{background:C.paper,borderRadius:8,width:"100%",maxWidth:720,
        border:`1px solid ${C.rule}`,position:"relative",
        boxShadow:"0 24px 64px rgba(47,74,63,0.28)"}}>
        {/* Header */}
        <div style={{padding:"32px 40px 24px",borderBottom:`1px solid ${C.rule}`}}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:24}}>
            <div>
              <div style={mono({fontSize:9,letterSpacing:"0.22em",textTransform:"uppercase",
                color:C.accent,marginBottom:10})}>
                Luxart LLC · Legal
              </div>
              <h2 style={{fontFamily:F.display,fontWeight:700,fontSize:28,
                letterSpacing:"-0.02em",color:C.ink,margin:"0 0 6px",lineHeight:1.1}}>
                {data.title}
              </h2>
              <p style={{fontFamily:F.body,fontSize:14,color:C.inkMute,margin:0}}>
                {data.subtitle}
              </p>
            </div>
            <button onClick={onClose}
              style={{width:36,height:36,borderRadius:"50%",border:`1px solid ${C.rule}`,
                background:"none",cursor:"pointer",display:"flex",alignItems:"center",
                justifyContent:"center",fontSize:18,color:C.inkMute,flexShrink:0,
                transition:"all 140ms"}}
              onMouseEnter={e=>{e.currentTarget.style.background=C.creamWarm;e.currentTarget.style.color=C.ink}}
              onMouseLeave={e=>{e.currentTarget.style.background="none";e.currentTarget.style.color=C.inkMute}}>
              ×
            </button>
          </div>
          <div style={{display:"flex",gap:16,marginTop:16}}>
            <span style={mono({fontSize:9,letterSpacing:"0.14em",textTransform:"uppercase",
              color:C.inkMute})}>Last updated: {data.updated}</span>
            <span style={mono({fontSize:9,letterSpacing:"0.14em",textTransform:"uppercase",
              color:C.inkMute})}>{data.version}</span>
          </div>
        </div>
        {/* Body */}
        <div style={{padding:"28px 40px 40px",maxHeight:"60vh",overflowY:"auto"}}>
          {data.sections.map((s,i)=>(
            <div key={i} style={{marginBottom:24}}>
              <h3 style={{fontFamily:F.display,fontWeight:700,fontSize:14,
                color:C.accent,margin:"0 0 8px",letterSpacing:"-0.01em"}}>
                {s.h}
              </h3>
              {s.bodyPre&&<p style={{fontFamily:F.body,fontSize:13,lineHeight:1.75,
                color:C.inkSoft,margin:"0 0 8px"}}>
                {s.bodyPre}
              </p>}
              {s.list&&<ul style={{fontFamily:F.body,fontSize:13,lineHeight:1.75,
                color:C.inkSoft,margin:"0 0 8px 18px",padding:0}}>
                {s.list.map((item,j)=><li key={j} style={{marginBottom:4}}>{item}</li>)}
              </ul>}
              {s.body&&<p style={{fontFamily:F.body,fontSize:13,lineHeight:1.75,
                color:C.inkSoft,margin:0}}>
                {s.body}
              </p>}
            </div>
          ))}
          <div style={{marginTop:32,paddingTop:20,borderTop:`1px solid ${C.rule}`}}>
            <p style={mono({fontSize:9,color:C.inkMute,lineHeight:1.6})}>
              © {new Date().getFullYear()} Luxart LLC · LC · Lighting Master · {data.title} {data.version}
              · Questions? admin@luxartmedia.com
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Footer({onSignIn, onSignUp, onAdminClick=()=>{}, onLegal=()=>{}}){
  return(
    <footer style={{background:C.ink,borderTop:"1px solid rgba(249,244,237,0.08)",padding:"40px 32px 32px"}}>
      <div style={{maxWidth:1180,margin:"0 auto"}}>
        <div style={{display:"grid",gridTemplateColumns:"1.5fr 1fr 1fr 1fr",gap:48,marginBottom:40}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
              <div style={{width:28,height:28,borderRadius:5,background:C.accent,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontFamily:F.display,fontWeight:800,fontSize:11,color:"#fff"}}>LC</div>
              <span style={d({fontWeight:700,fontSize:14,color:"#fff"})}>Lighting Master</span>
            </div>
            <p style={{fontFamily:F.body,fontSize:12.5,color:"rgba(249,244,237,0.4)",lineHeight:1.7,margin:"0 0 16px",maxWidth:260}}>
              The structured LC exam preparation program for North American lighting designers.
            </p>
            <div style={m({fontSize:8,letterSpacing:"0.14em",textTransform:"uppercase",color:"rgba(249,244,237,0.22)"})}><a href="https://www.luxartmedia.com" style={{color:"rgba(249,244,237,0.35)",textDecoration:"none",fontFamily:F.mono,fontSize:8,letterSpacing:"0.14em",textTransform:"uppercase"}} onMouseEnter={e=>e.target.style.color="rgba(249,244,237,0.7)"} onMouseLeave={e=>e.target.style.color="rgba(249,244,237,0.35)"}>luxartmedia.com</a></div>
          </div>
          {[
            {head:"Product",links:[
              {label:"Features",action:()=>scrollTo("features")},
              {label:"Curriculum",action:()=>scrollTo("curriculum")},
              {label:"Pricing",action:()=>scrollTo("pricing")},
              {label:"Practice Exam",action:()=>scrollTo("pricing")},
              {label:"Team plans",action:()=>scrollTo("pricing")},
            ]},
            {head:"Account",links:[
              {label:"Sign in",action:onSignIn},
              {label:"Create account",action:onSignUp},
              {label:"FAQ",action:()=>scrollTo("faq")},
              {label:"Contact us",action:null,href:"mailto:admin@luxartmedia.com"},
            ]},
            {head:"Legal",links:[
              {label:"Privacy policy",action:()=>onLegal("privacy")},
              {label:"Terms of service",action:()=>onLegal("terms")},
              {label:"Cookie policy",action:()=>onLegal("cookies")},
              {label:"Refund policy",action:()=>onLegal("refund")},
            ]},
          ].map(col=>(
            <div key={col.head}>
              <div style={m({fontSize:8,letterSpacing:"0.22em",textTransform:"uppercase",
                color:"rgba(249,244,237,0.28)",marginBottom:14})}>{col.head}</div>
              {col.links.map(link=>(
                <button key={link.label} onClick={link.action||undefined}
                  style={{display:"block",fontFamily:F.display,fontSize:13,
                    color:"rgba(249,244,237,0.45)",background:"none",border:"none",
                    padding:"5px 0",cursor:link.action?"pointer":"default",
                    textAlign:"left",width:"100%",transition:"color 140ms"}}
                  onMouseEnter={e=>link.action&&(e.currentTarget.style.color="rgba(249,244,237,0.85)")}
                  onMouseLeave={e=>e.currentTarget.style.color="rgba(249,244,237,0.45)"}>
                  {link.label}
                </button>
              ))}
            </div>
          ))}
        </div>
        <div style={{borderTop:"1px solid rgba(249,244,237,0.07)",paddingTop:20,
          display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
          <span style={m({fontSize:9,color:"rgba(249,244,237,0.22)"})}>
            © {new Date().getFullYear()} Luxart LLC · Lighting Master · All rights reserved
          </span>
          <span style={m({fontSize:9,color:"rgba(249,244,237,0.22)"})}>
            LC exam prep · Not affiliated with or endorsed by NCQLP®
          </span>
          <button
            onClick={onAdminClick}
            style={m({fontSize:9,color:"rgba(249,244,237,0.18)",background:"none",border:"none",cursor:"pointer",letterSpacing:"0.06em",padding:0})}
            onMouseEnter={e=>e.currentTarget.style.color="rgba(249,244,237,0.5)"}
            onMouseLeave={e=>e.currentTarget.style.color="rgba(249,244,237,0.18)"}>
            Admin portal ↗
          </button>
        </div>
      </div>
    </footer>
  )
}


/* ══ COURSE DATA ══ */
const MODULES = [
  {n:"01",part:1,label:"Foundation",    title:"Theory, Light, Sight & Color",        ceu:2.0, done:true,  active:false, pct:100, count:"6/6",  total:6, lessons:[
    {ref:"1.1",title:"What is light",tag:"fundamentals",done:true},
    {ref:"1.2",title:"The four photometric quantities",tag:"photometry",done:true},
    {ref:"1.3",title:"Photopic & scotopic vision",tag:"human factors",done:true},
    {ref:"1.4",title:"Correlated color temperature (CCT)",tag:"color",done:true},
    {ref:"1.5",title:"Color rendering: CRI & TM-30",tag:"color",done:true},
    {ref:"1.6",title:"Color rendering in practice",tag:"color",done:true},
  ]},
  {n:"02",part:1,label:"Hardware",      title:"Light Sources & Ballasts",             ceu:2.0, done:true,  active:false, pct:100, count:"6/6",  total:6, lessons:[
    {ref:"2.1",title:"Fluorescent sources",tag:"sources",done:true},
    {ref:"2.2",title:"Magnetic vs electronic ballasts",tag:"hardware",done:true},
    {ref:"2.3",title:"Three LED retrofit paths",tag:"LED",done:true},
    {ref:"2.4",title:"CFL & HID sources",tag:"sources",done:true},
    {ref:"2.5",title:"Efficacy comparison",tag:"energy",done:true},
    {ref:"2.6",title:"Source selection in practice",tag:"sources",done:true},
  ]},
  {n:"03",part:1,label:"Hardware",      title:"LED Technology Deep Dive",             ceu:2.5, done:false, active:true,  pct:38,  count:"3/8",  total:8, lessons:[
    {ref:"3.1",title:"The P-N junction",tag:"LED",done:true},
    {ref:"3.2",title:"The four parts of a luminaire",tag:"hardware",done:true},
    {ref:"3.3",title:"Thermal management",tag:"LED",done:true},
    {ref:"3.4",title:"CC vs CV drivers",tag:"drivers",active:true},
    {ref:"3.5",title:"Dimming protocols",tag:"controls"},
    {ref:"3.6",title:"Power factor & THD",tag:"electrical"},
    {ref:"3.7",title:"LEED & WELL credits",tag:"sustainability"},
    {ref:"3.8",title:"LED Package Types",tag:"LED"},
  ]},
  {n:"04",part:1,label:"Math & Files",  title:"Photometry & IES Files",               ceu:2.0, done:false, active:false, pct:33,  count:"2/6",  total:6, lessons:[
    {ref:"4.1",title:"LM-63 IES format",tag:"photometry",done:true},
    {ref:"4.2",title:"Polar & Cartesian plots",tag:"photometry",done:true},
    {ref:"4.3",title:"LM-79 / LM-80 / TM-21",tag:"standards"},
    {ref:"4.4",title:"Inverse-square law",tag:"calculations"},
    {ref:"4.5",title:"Cosine law",tag:"calculations"},
    {ref:"4.6",title:"Lumen-method calculations",tag:"calculations"},
  ]},
  {n:"05",part:2,label:"Systems",       title:"Lighting Controls",                    ceu:2.0, done:false, active:false, pct:0,   count:"6",    total:6, lessons:[
    {ref:"5.1",title:"Why we control",tag:"controls"},{ref:"5.2",title:"Dimming protocols overview",tag:"controls"},
    {ref:"5.3",title:"Occupancy vs vacancy sensors",tag:"controls"},{ref:"5.4",title:"Daylight harvesting",tag:"controls"},
    {ref:"5.5",title:"S/E ratio & DALI-2",tag:"controls"},{ref:"5.6",title:"BACnet & network integration",tag:"controls"},
  ]},
  {n:"06",part:2,label:"Application",   title:"Downlighting & Interior Design",       ceu:2.0, done:false, active:false, pct:0,   count:"6",    total:6, lessons:[
    {ref:"6.1",title:"Aperture, beam & trim",tag:"downlighting"},{ref:"6.2",title:"Spacing criterion",tag:"calculations"},
    {ref:"6.3",title:"Picking the right trim",tag:"downlighting"},{ref:"6.4",title:"IES distribution categories",tag:"photometry"},
    {ref:"6.5",title:"Waveguides & light guides",tag:"optics"},{ref:"6.6",title:"Interior design applications",tag:"application"},
  ]},
  {n:"07",part:2,label:"Application",   title:"Exterior, Emergency & Codes",          ceu:2.0, done:false, active:false, pct:0,   count:"6",    total:6, lessons:[
    {ref:"7.1",title:"IES Distribution Types",tag:"exterior"},{ref:"7.2",title:"BUG ratings & lighting zones",tag:"exterior"},
    {ref:"7.3",title:"Dark sky & light trespass",tag:"exterior"},{ref:"7.4",title:"NFPA 90-minute emergency rule",tag:"codes"},
    {ref:"7.5",title:"Emergency power systems",tag:"codes"},{ref:"7.6",title:"Code compliance in practice",tag:"codes"},
  ]},
  {n:"08",part:2,label:"Specialty",     title:"Industrial Lighting & Human Health",   ceu:2.0, done:false, active:false, pct:0,   count:"6",    total:6, lessons:[
    {ref:"8.1",title:"High-bay vs low-bay",tag:"industrial"},{ref:"8.2",title:"IP / IK / NEMA ratings",tag:"hardware"},
    {ref:"8.3",title:"Hazardous locations",tag:"industrial"},{ref:"8.4",title:"RP-7 illuminance levels",tag:"standards"},
    {ref:"8.5",title:"Circadian rhythms & ipRGCs",tag:"human factors"},{ref:"8.6",title:"WELL v2 lighting concepts",tag:"wellness"},
  ]},
  {n:"09",part:3,label:"Sustain.",      title:"Energy, Environment & Sustainable Design", ceu:2.0, done:false, active:false, pct:0, count:"6",   total:6, lessons:[
    {ref:"9.1",title:"LPD & ASHRAE 90.1",tag:"energy"},{ref:"9.2",title:"Daylight harvesting sDA & ASE",tag:"daylighting"},
    {ref:"9.3",title:"RoHS, EPD & HPD",tag:"sustainability"},{ref:"9.4",title:"Life-cycle cost & carbon",tag:"sustainability"},
    {ref:"9.5",title:"LEED v4.1 lighting credits",tag:"sustainability"},{ref:"9.6",title:"End-of-life & recycling",tag:"sustainability"},
  ]},
  {n:"10",part:3,label:"Process",       title:"Design Process I: Planning to DD",     ceu:2.0, done:false, active:false, pct:0,   count:"6",    total:6, lessons:[
    {ref:"10.1",title:"Programming & the OPR",tag:"process"},{ref:"10.2",title:"Schematic design concept",tag:"process"},
    {ref:"10.3",title:"DD fixture schedule",tag:"process"},{ref:"10.4",title:"Calculations & renderings",tag:"process"},
    {ref:"10.5",title:"Mock-ups & samples",tag:"process"},{ref:"10.6",title:"Coordination with other trades",tag:"process"},
  ]},
  {n:"11",part:3,label:"Process",       title:"Design Process II: Documents to POE",  ceu:2.0, done:false, active:false, pct:0,   count:"6",    total:6, lessons:[
    {ref:"11.1",title:"Contract documents",tag:"process"},{ref:"11.2",title:"Bidding & submittals",tag:"process"},
    {ref:"11.3",title:"Construction administration",tag:"process"},{ref:"11.4",title:"Punch & substantial completion",tag:"process"},
    {ref:"11.5",title:"Commissioning",tag:"process"},{ref:"11.6",title:"Post-occupancy evaluation (POE)",tag:"process"},
  ]},
  {n:"12",part:3,label:"Applications",  title:"Residential & Commercial Applications",ceu:2.0, done:false, active:false, pct:0,   count:"6",    total:6, lessons:[
    {ref:"12.1",title:"Office & workplace lighting",tag:"workplace"},{ref:"12.2",title:"Retail & Hospitality Lighting",tag:"commercial"},
    {ref:"12.3",title:"Healthcare Lighting",tag:"commercial"},{ref:"12.4",title:"Educational Environments",tag:"commercial"},
    {ref:"12.5",title:"Exterior & Civic Lighting",tag:"commercial"},{ref:"12.6",title:"Integrated Design Review",tag:"application"},
  ]},
]

const ALL_LESSONS = MODULES.flatMap(m => m.lessons.map(l=>({...l,module:m.n,moduleTitle:m.title,part:m.part})))

const PARTS = [
  {id:1,title:"Fundamentals · light, sources, math",modules:[1,2,3,4]},
  {id:2,title:"Systems & applications",modules:[5,6,7,8]},
  {id:3,title:"Design practice & sustainability",modules:[9,10,11,12]},
]

const TOPIC_COUNTS = {
  "Light Sources & Lamps":3,"Photometry & Calculations":3,"Color & Vision":3,
  "Energy & Controls":3,"Luminaire Design & Optics":2,"Codes, Standards & Sustainability":1,
  "Daylighting":1,"Interior Lighting Design":1,"Lighting Design Process":1,
  "Human Factors & Health":2,"Emergency & Exit Lighting":1,"Exterior & Outdoor Lighting":1,
  "Accent Lighting":1,"Conservation Lighting":2,"UV & Radiation":2,"Color Rendering":2,
  "Exterior Lighting":5,"Retinal Safety":1,"LED Technology":2,"Ballasts":1,
  "Luminaire Optics":1,"Optics":1,"Photometry":3,"Luminaire Classification":1,
  "Emergency Lighting":2,"Design Process":1,"Design Standards":1,"Product Labelling":1,
  "Lamp Life":1,
}
const TOTAL_QUESTIONS = 180

/* ══════════════════════════════════════════
   APP SHELL — sidebar + dashboard
══════════════════════════════════════════ */
const APP_MODULES = [
  {n:"01",label:"Foundation",title:"Theory, Light, Sight & Color",pct:100,done:true,active:false,count:"6/6",free:true},
  {n:"02",label:"Hardware",title:"Light Sources & Ballasts",pct:83,done:false,active:true,count:"5/6",free:false},
  {n:"03",label:"Hardware",title:"LED Technology Deep Dive",pct:38,done:false,active:false,count:"3/8",free:false},
  {n:"04",label:"Math & Files",title:"Photometry & IES Files",pct:0,done:false,active:false,count:"0/6",free:false},
  {n:"05",label:"Systems",title:"Lighting Controls",pct:0,done:false,active:false,count:"0/6",free:false},
  {n:"06",label:"Application",title:"Downlighting & Interior Design",pct:0,done:false,active:false,count:"0/6",free:false},
  {n:"07",label:"Application",title:"Exterior, Emergency & Codes",pct:0,done:false,active:false,count:"0/6",free:false},
  {n:"08",label:"Specialty",title:"Industrial Lighting & Human Health",pct:0,done:false,active:false,count:"0/6",free:false},
  {n:"09",label:"Sustain.",title:"Energy, Environment & Sustainable Design",pct:0,done:false,active:false,count:"0/6",free:false},
  {n:"10",label:"Process",title:"Design Process I: Planning to DD",pct:0,done:false,active:false,count:"0/6",free:false},
  {n:"11",label:"Process",title:"Design Process II: Documents to POE",pct:0,done:false,active:false,count:"0/6",free:false},
  {n:"12",label:"Exam Prep",title:"LC Exam Strategy & Practice",pct:0,done:false,active:false,count:"0/6",free:false},
]


/* ══ COURSE COMPONENTS ══ */
/* ── TTS ENGINE ── */
let _synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
let _playing=false;
let _speeds=[0.85,1,1.15,1.3];
let _spdIdx=1;
let _voices=[];
let _voiceIdx=0;
let _progTimer=null;
let _startMs=0;
let _estMs=0;

function _loadVoices(){
  _voices=_synth.getVoices().filter(v=>v.lang.startsWith('en'));
  const pref=['Aria','Google US','Zira','Samantha','Alex'];
  for(let n of pref){const f=_voices.find(v=>v.name.includes(n));if(f){_voiceIdx=_voices.indexOf(f);break}}
}
if(_synth&&_synth.onvoiceschanged!==undefined)_synth.onvoiceschanged=_loadVoices;
if(_synth)setTimeout(_loadVoices,400);

function _stopTTS(){
  if(_synth)_synth.cancel();_playing=false;clearInterval(_progTimer);
  const f=document.getElementById('_pfill');if(f)f.style.width='0%';
}

function _setPS(state){
  const btn=document.getElementById('_ttsbtn'),st=document.getElementById('_ttsst');
  if(!btn)return;
  btn.innerHTML=state==='play'?`<svg viewBox="0 0 24 24" style="width:14px;height:14px;fill:currentColor"><path d="M8 5v14l11-7z"/></svg>`:`<svg viewBox="0 0 24 24" style="width:14px;height:14px;fill:currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;
  if(st)st.textContent=state==='play'?'Click to listen':'Playing…';
}

window._toggleTTS=function(){
  if(!_synth)return;
  if(_playing){_stopTTS();_setPS('play');return}
  _loadVoices();
  const el=document.getElementById('_lesson_ref');
  const ttsText=el?.dataset?.tts||'';
  if(!ttsText)return;
  const utt=new SpeechSynthesisUtterance(ttsText);
  utt.rate=_speeds[_spdIdx];utt.pitch=1.0;utt.volume=1.0;
  if(_voices.length)utt.voice=_voices[_voiceIdx];
  _estMs=(ttsText.split(' ').length/2.8)*1000/_speeds[_spdIdx];
  _startMs=Date.now();
  utt.onstart=()=>{_playing=true;_setPS('playing');clearInterval(_progTimer);_progTimer=setInterval(()=>{const f=document.getElementById('_pfill');if(!f||!_playing)return;f.style.width=Math.min(98,Math.round((Date.now()-_startMs)/_estMs*100))+'%';},300);};
  utt.onend=()=>{_playing=false;clearInterval(_progTimer);const f=document.getElementById('_pfill');if(f){f.style.width='100%';setTimeout(()=>{if(f)f.style.width='0%'},500);}_setPS('play');};
  utt.onerror=()=>{_playing=false;_setPS('play');clearInterval(_progTimer);};
  _synth.cancel();_synth.speak(utt);
};

window._cycleSpeed=function(){
  _spdIdx=(_spdIdx+1)%_speeds.length;
  const el=document.getElementById('_pspd');if(el)el.textContent=_speeds[_spdIdx]+'×';
  if(_playing){_stopTTS();_setPS('play');}
};

window._cycleVoice=function(){
  if(!_voices.length){_loadVoices();return}
  _voiceIdx=(_voiceIdx+1)%_voices.length;
  const el=document.getElementById('_pvc');
  if(el)el.textContent=_voices[_voiceIdx]?.name?.split(' ').slice(0,2).join(' ')||'Voice';
  if(_playing){_stopTTS();_setPS('play');}
};


function PageHead({eyebrow,title,em,right=null}) {
  return (
    <section style={{padding:"32px 0 24px",borderBottom:`1px solid ${C.rule}`,display:"grid",gridTemplateColumns:"1fr auto",gap:32,alignItems:"end",marginBottom:0}}>
      <div>
        <div style={mono({fontSize:9,letterSpacing:"0.22em",textTransform:"uppercase",color:C.accent,marginBottom:10})}>{eyebrow}</div>
        <h1 style={{fontFamily:F.display,fontWeight:700,fontSize:"clamp(38px,5vw,60px)",letterSpacing:"-0.025em",lineHeight:1,color:C.ink,margin:0}}>{title} <em style={{fontStyle:"normal",color:C.accent}}>{em}</em></h1>
      </div>
      {right}
    </section>
  )
}

function Mark({text,q}) {
  if (!q) return <>{text}</>
  const i=text.toLowerCase().indexOf(q.toLowerCase())
  if (i<0) return <>{text}</>
  return <>{text.slice(0,i)}<mark style={{background:"rgba(198,90,58,0.22)",color:"inherit",borderRadius:2,padding:"0 1px"}}>{text.slice(i,i+q.length)}</mark>{text.slice(i+q.length)}</>
}
function Tag({label}) {
  return <span style={mono({fontSize:8,letterSpacing:"0.14em",textTransform:"uppercase",color:C.inkMute,background:C.creamWarm,padding:"3px 8px",borderRadius:99})}>{label}</span>
}
function FilamentBar({pct,color,glow,h=5}) {
  return (
    <div style={{width:"100%",height:h,background:C.rule,borderRadius:99,overflow:"visible",position:"relative"}}>
      <div style={{width:`${pct}%`,height:"100%",background:color,borderRadius:99,transition:"width 700ms cubic-bezier(.4,0,.2,1)",position:"relative",boxShadow:glow&&pct>0?`0 0 8px 1px ${color}66`:"none"}}>
        {pct>3&&pct<100&&<span style={{position:"absolute",right:-4,top:"50%",transform:"translateY(-50%)",width:9,height:9,borderRadius:"50%",background:color,display:"block",boxShadow:`0 0 0 3px ${color}30,0 0 10px 2px ${color}60`,animation:"bulbPulse 2s ease-in-out infinite"}}/>}
        {pct===100&&<span style={{position:"absolute",right:-4,top:"50%",transform:"translateY(-50%)",width:9,height:9,borderRadius:"50%",background:color,display:"block",boxShadow:`0 0 0 3px ${color}40,0 0 12px 3px ${color}50`}}/>}
      </div>
    </div>
  )
}

function isLessonLocked(lessonRef, user) {
  const plan = user?.plan || 'free'
  const status = user?.status || 'free'
  if (status === 'refunded' || status === 'disputed') return true
  if (plan === 't2' || plan === 't3') return false
  if (plan === 't1') return true
  const moduleNum = parseInt(lessonRef.split('.')[0])
  return moduleNum !== 1
}

function getLessonPreview() {
  return ''
}

/* ── SEARCH PAGE ─────────────────────────────────────────────── */
function SearchPage({setRoute, user, setShowUpgrade}) {
  const [q,setQ] = useState("")
  const [filter,setFilter] = useState("all")
  const results = ALL_LESSONS.filter(l=>{
    if (filter==="done"&&!l.done) return false
    if (filter==="todo"&&l.done) return false
    if (!q) return true
    return [l.title,l.tag,l.moduleTitle,l.ref].join(" ").toLowerCase().includes(q.toLowerCase())
  })
  const byPart = PARTS.map(p=>({...p,lessons:results.filter(l=>p.modules.includes(parseInt(l.module)))})).filter(p=>p.lessons.length>0)

  return (
    <div style={{padding:"0 36px 48px"}}>
      <PageHead eyebrow="Library · Find a lesson" title="Search" em="lessons."/>
      <div style={{position:"relative",margin:"24px 0 16px"}}>
        <span style={{position:"absolute",left:20,top:"50%",transform:"translateY(-50%)",fontFamily:F.mono,fontSize:18,color:C.inkMute}}>⌕</span>
        <input value={q} onChange={e=>setQ(e.target.value)} autoFocus placeholder='Search 74 lessons — try "CRI", "dimming", "BUG", "daylight"…'
          style={{width:"100%",boxSizing:"border-box",padding:"18px 18px 18px 52px",fontFamily:F.display,fontWeight:500,fontSize:20,color:C.ink,background:C.paper,border:`1px solid ${C.ruleStrong}`,borderRadius:4,outline:"none",transition:"border-color 150ms"}}
          onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.ruleStrong}/>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
        <span style={mono({fontSize:9,letterSpacing:"0.22em",textTransform:"uppercase",color:C.inkMute,marginRight:4})}>Show</span>
        {[["all","All lessons"],["todo","Not started"],["done","Completed"]].map(([v,label])=>(
          <button key={v} onClick={()=>setFilter(v)} style={{fontFamily:F.display,fontWeight:600,fontSize:12,color:filter===v?"#fff":C.inkSoft,background:filter===v?C.ink:C.cream,border:`1px solid ${filter===v?C.ink:C.rule}`,borderRadius:99,padding:"7px 14px",cursor:"pointer",transition:"all 140ms"}}>{label}</button>
        ))}
      </div>
      <div style={mono({fontSize:10,letterSpacing:"0.18em",textTransform:"uppercase",color:C.inkMute,margin:"20px 0 14px"})}>
        <b style={{color:C.accent}}>{results.length}</b> {results.length===1?"lesson":"lessons"}{q?` matching "${q}"`:""}
      </div>
      {results.length===0 ? (
        <div style={{textAlign:"center",padding:"60px 20px",color:C.inkMute}}>
          <div style={{fontFamily:F.display,color:C.ink,fontSize:20,marginBottom:6}}>No lessons found</div>
          Try a broader term — topic, module name, or a keyword like "LED"
        </div>
      ) : byPart.map(p=>(
        <div key={p.id} style={{marginBottom:32}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",padding:"0 0 8px",borderBottom:`1px solid ${C.rule}`,marginBottom:12}}>
            <span style={{fontFamily:F.display,fontWeight:700,fontSize:15,color:C.ink}}>Part {String(p.id).padStart(2,"0")} · {p.title}</span>
            <span style={mono({fontSize:9,color:C.inkMute})}>{p.lessons.length} {p.lessons.length===1?"lesson":"lessons"}</span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:1,background:C.rule,border:`1px solid ${C.rule}`,borderRadius:4,overflow:"hidden"}}>
            {p.lessons.map(l=>{
              const locked = isLessonLocked(l.ref, user)
              const preview = getLessonPreview(l.ref)
              return (
                <div key={l.ref} onClick={()=>{ if(locked){ setShowUpgrade(true); return } window.scrollTo({top:0,behavior:'smooth'}); setRoute("lesson-"+l.ref) }}
                  style={{display:"grid",gridTemplateColumns:"52px 1fr auto",gap:14,alignItems:"center",background:C.cream,padding:"14px 16px",cursor:"pointer",transition:"background 140ms",opacity:locked?0.6:1}}
                  onMouseEnter={e=>e.currentTarget.style.background=C.creamWarm} onMouseLeave={e=>e.currentTarget.style.background=C.cream}>
                  <span style={{fontFamily:F.display,fontWeight:700,fontSize:17,letterSpacing:"-0.02em",color:l.done?C.inkMute:C.forest}}>{l.ref}</span>
                  <span>
                    <span style={{display:"block",fontFamily:F.display,fontWeight:600,fontSize:14,color:C.ink,lineHeight:1.25}}>
                      <Mark text={l.title} q={q}/>{locked&&<span style={{marginLeft:6}}>🔒</span>}
                    </span>
                    <span style={mono({display:"block",fontSize:9,letterSpacing:"0.14em",textTransform:"uppercase",color:C.inkMute,marginTop:4})}><em style={{fontStyle:"normal",color:C.accent}}>M{l.module}</em> · {l.moduleTitle?.slice(0,28)} · <Mark text={l.tag} q={q}/></span>
                    {preview&&<span style={{display:"block",fontFamily:F.body,fontSize:11,color:C.inkMute,marginTop:4,lineHeight:1.45,fontStyle:"italic"}}>{preview}</span>}
                  </span>
                  <span style={mono({fontSize:9,letterSpacing:"0.16em",textTransform:"uppercase",color:locked?C.accent:l.done?C.forest:C.inkMute,whiteSpace:"nowrap"})}>{locked?"🔒 Locked":l.done?"✓ Done":"Open →"}</span>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}


/* ── BOOKMARKS PAGE ──────────────────────────────────────────── */
function BookmarksPage({setRoute, bookmarks=new Set(), toggleBookmark=async()=>{}}) {
  const items = Array.from(bookmarks)
    .map(ref=>({ref,lesson:ALL_LESSONS.find(l=>l.ref===ref)}))
    .filter(b=>b.lesson)
    .sort((a,b)=>a.ref.localeCompare(b.ref,undefined,{numeric:true}))
  return (
    <div style={{padding:"0 36px 48px"}}>
      <PageHead eyebrow="Library · Saved for review" title="Your" em="bookmarks."
        right={<div style={{textAlign:"right"}}>
          <div style={{fontFamily:F.display,fontWeight:700,fontSize:32,letterSpacing:"-0.02em",color:C.forest,lineHeight:1}}>{bookmarks.size}</div>
          <div style={mono({fontSize:9,letterSpacing:"0.18em",textTransform:"uppercase",color:C.inkMute,marginTop:6})}>lessons flagged</div>
        </div>}
      />
      <p style={{fontFamily:F.body,fontSize:14,lineHeight:1.55,color:C.inkMute,margin:"20px 0 24px",maxWidth:620}}>Lessons you starred to revisit before the exam. These are the concepts that earned a second look.</p>
      {bookmarks.size===0?(
        <div style={{textAlign:'center',padding:'60px 20px',color:C.inkMute}}>
          <div style={{fontSize:40,marginBottom:16}}>☆</div>
          <div style={{fontFamily:F.display,fontWeight:700,fontSize:18,color:C.ink,marginBottom:8}}>No bookmarks yet</div>
          <div style={{fontFamily:F.body,fontSize:14,lineHeight:1.6,maxWidth:320,margin:'0 auto'}}>Star any lesson while studying to save it here for quick review before exam day.</div>
        </div>
      ):(
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:16}}>
          {items.map(({ref,lesson:l})=>{
            const preview = ''
            return (
              <article key={ref} onClick={()=>{window.scrollTo({top:0,behavior:'smooth'});setRoute("lesson-"+ref)}} style={{display:"flex",flexDirection:"column",background:C.paper,border:`1px solid ${C.rule}`,borderRadius:4,overflow:"hidden",cursor:"pointer",transition:"border-color 150ms,transform 150ms"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=C.inkMute;e.currentTarget.style.transform="translateY(-2px)"}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=C.rule;e.currentTarget.style.transform="translateY(0)"}}>
                <div style={{display:"grid",gridTemplateColumns:"auto 1fr auto",gap:14,alignItems:"start",padding:"20px 22px 16px"}}>
                  <span style={{fontFamily:F.display,fontWeight:700,fontSize:28,letterSpacing:"-0.03em",color:C.forest,lineHeight:0.9}}>{l.ref}</span>
                  <span>
                    <span style={mono({display:"block",fontSize:9,letterSpacing:"0.16em",textTransform:"uppercase",color:C.inkMute,marginBottom:6})}><em style={{fontStyle:"normal",color:C.accent}}>M{l.module}</em> · {l.moduleTitle}</span>
                    <span style={{display:"block",fontFamily:F.display,fontWeight:700,fontSize:18,letterSpacing:"-0.01em",color:C.ink,lineHeight:1.15}}>{l.title}</span>
                  </span>
                  <button onClick={e=>{e.stopPropagation();toggleBookmark(ref)}} style={{background:'none',border:'none',cursor:'pointer',fontSize:16,color:C.accent,padding:'2px 6px',borderRadius:4}} title="Remove bookmark">★</button>
                </div>
                {preview&&<p style={{fontFamily:F.body,fontSize:13,lineHeight:1.55,color:C.inkSoft,padding:"0 22px 14px",margin:0}}>{preview}</p>}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 22px",borderTop:`1px solid ${C.rule}`,marginTop:"auto",background:`color-mix(in srgb,${C.creamWarm} 60%,transparent)`}}>
                  <span style={{display:"flex",alignItems:"center",gap:7,fontFamily:F.mono,fontSize:9,letterSpacing:"0.18em",textTransform:"uppercase",color:C.inkMute}}>
                    <span style={{width:7,height:7,borderRadius:"50%",background:l.done?C.forest:C.accent}}/>
                    {l.done?"Completed":"Not started"} · {l.tag}
                  </span>
                  <span style={{fontFamily:F.display,fontWeight:600,fontSize:13,color:C.ink}}>Open lesson →</span>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}


/* ── NOTES PAGE ──────────────────────────────────────────────── */
function relativeDate(iso){
  const sec=Math.floor((Date.now()-new Date(iso))/1000)
  if(sec<60) return "just now"
  if(sec<3600) return `${Math.floor(sec/60)} min ago`
  if(sec<86400) return `${Math.floor(sec/3600)} hr ago`
  const days=Math.floor(sec/86400)
  if(days<8) return `${days} day${days>1?"s":""} ago`
  return new Date(iso).toLocaleDateString("en-US",{month:"short",day:"numeric"})
}

function NotesPage({setRoute, user}) {
  const [q,setQ] = useState("")
  const [sort,setSort] = useState("recent")
  const [notes,setNotes] = useState([])
  const [loading,setLoading] = useState(true)

  useEffect(()=>{
    if(!user){ setLoading(false); return }
    supabase.from("notes").select("lesson_ref,body,updated_at")
      .eq("user_id",user.id).neq("body","").order("updated_at",{ascending:false})
      .then(({data})=>{
        if(data) setNotes(data.map(n=>({
          ref:n.lesson_ref, body:n.body, updated_at:n.updated_at,
          edited:relativeDate(n.updated_at), chars:n.body.length,
          lesson:ALL_LESSONS.find(l=>l.ref===n.lesson_ref),
        })))
        setLoading(false)
      })
  },[user?.id])

  const filtered=notes.filter(n=>{
    if(!q) return true
    return [n.body,n.lesson?.title,n.lesson?.moduleTitle,n.ref].join(" ").toLowerCase().includes(q.toLowerCase())
  })
  const sorted=sort==="module"?[...filtered].sort((a,b)=>parseFloat(a.ref)-parseFloat(b.ref)):filtered
  const distinctLessons=new Set(notes.map(n=>n.ref)).size

  return (
    <div style={{padding:"0 36px 48px"}}>
      <PageHead eyebrow="Library · Your field notes" title="Notes" em="hub."
        right={<div style={{display:"flex",gap:26}}>
          {[{val:notes.length,label:"Notes"},{val:distinctLessons,label:"Lessons"}].map(s=>(
            <div key={s.label} style={{textAlign:"right"}}>
              <div style={{fontFamily:F.display,fontWeight:700,fontSize:28,letterSpacing:"-0.02em",color:C.ink,lineHeight:1}}>{s.val}</div>
              <div style={mono({fontSize:9,letterSpacing:"0.2em",textTransform:"uppercase",color:C.inkMute,marginTop:6})}>{s.label}</div>
            </div>
          ))}
        </div>}
      />
      {loading?(
        <div style={{padding:"48px 0",textAlign:"center",fontFamily:F.mono,fontSize:12,color:C.inkMute}}>Loading notes…</div>
      ):notes.length===0?(
        <div style={{background:C.paper,border:`1px solid ${C.rule}`,borderRadius:6,padding:"48px 36px",textAlign:"center",marginTop:28}}>
          <div style={{fontFamily:F.display,fontWeight:700,fontSize:18,color:C.ink,marginBottom:10}}>No notes yet</div>
          <p style={{fontFamily:F.body,fontSize:14,color:C.inkMute,lineHeight:1.6,maxWidth:380,margin:"0 auto"}}>
            Open any lesson and use the Notes section to capture key concepts. They'll all appear here.
          </p>
        </div>
      ):(
        <>
          <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:16,alignItems:"center",margin:"24px 0 8px"}}>
            <div style={{position:"relative"}}>
              <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontFamily:F.mono,fontSize:14,color:C.inkMute}}>⌕</span>
              <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search across all your notes — keyword, topic, or lesson…"
                style={{width:"100%",boxSizing:"border-box",padding:"13px 14px 13px 40px",fontFamily:F.body,fontSize:14,color:C.ink,background:C.paper,border:`1px solid ${C.ruleStrong}`,borderRadius:4,outline:"none"}}
                onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.ruleStrong}/>
            </div>
            <div style={{display:"inline-flex",border:`1px solid ${C.rule}`,borderRadius:99,overflow:"hidden",background:C.cream}}>
              {[["recent","Most recent"],["module","By module"]].map(([v,label])=>(
                <button key={v} onClick={()=>setSort(v)} style={{fontFamily:F.display,fontWeight:600,fontSize:12,color:sort===v?"#fff":C.inkSoft,background:sort===v?C.ink:"none",border:"none",padding:"9px 16px",cursor:"pointer",transition:"all 140ms"}}>{label}</button>
              ))}
            </div>
          </div>
          <div style={mono({fontSize:10,letterSpacing:"0.18em",textTransform:"uppercase",color:C.inkMute,margin:"16px 0 14px"})}>
            <b style={{color:C.accent}}>{sorted.length}</b> {sorted.length===1?"note":"notes"}{q?` matching "${q}"`:""}
          </div>
          <div style={{columns:2,columnGap:16}}>
            {sorted.map((n,i)=>{
              const l=n.lesson
              return(
                <article key={i} onClick={()=>l&&(window.scrollTo({top:0,behavior:"smooth"}),setRoute("lesson-"+l.ref))}
                  style={{breakInside:"avoid",marginBottom:16,background:C.paper,border:`1px solid ${C.rule}`,borderRadius:4,borderLeft:`3px solid ${C.accent}`,padding:"18px 20px",cursor:"pointer",transition:"box-shadow 150ms"}}
                  onMouseEnter={e=>e.currentTarget.style.boxShadow="0 6px 20px -12px rgba(40,30,20,0.3)"}
                  onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
                  <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",gap:12,marginBottom:10}}>
                    <span style={mono({fontSize:10,letterSpacing:"0.16em",textTransform:"uppercase",color:C.accent})}>M{l?.module} · Lesson {n.ref}</span>
                    <span style={mono({fontSize:9,letterSpacing:"0.12em",color:C.inkMute})}>{n.edited}</span>
                  </div>
                  {l&&<div style={{fontFamily:F.display,fontWeight:700,fontSize:15,letterSpacing:"-0.01em",color:C.ink,lineHeight:1.2,marginBottom:9}}><Mark text={l.title} q={q}/></div>}
                  <div style={{fontFamily:F.body,fontSize:13,lineHeight:1.6,color:C.inkSoft}}><Mark text={n.body} q={q}/></div>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,marginTop:14,paddingTop:11,borderTop:`1px dashed ${C.rule}`}}>
                    <span style={mono({fontSize:9,letterSpacing:"0.14em",textTransform:"uppercase",color:C.inkMute})}>{n.chars} chars</span>
                    <span style={{fontFamily:F.display,fontWeight:600,fontSize:12,color:C.ink}}>Go to lesson →</span>
                  </div>
                </article>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}


/* ── CERTIFICATE PAGE ────────────────────────────────────────── */
function CertPage() {
  const [authUser, setAuthUser]        = useState(null)
  const [completedCount, setCompleted] = useState(0)
  const [completionDate, setCompDate]  = useState(null)
  const [loading, setLoading]          = useState(true)
  const [downloading, setDownloading]  = useState(false)
  const [scale, setScale]              = useState(0.5)
  const wrapperRef = useRef(null)
  const certRef    = useRef(null)

  const CERT_W = 1240
  const CERT_H = 826
  const TOTAL  = 74

  /* Scale visible cert to fit its container */
  useEffect(() => {
    function resize() {
      if (wrapperRef.current)
        setScale(wrapperRef.current.offsetWidth / CERT_W)
    }
    resize()
    const t = setTimeout(resize, 60)
    window.addEventListener('resize', resize)
    return () => { clearTimeout(t); window.removeEventListener('resize', resize) }
  }, [])

  /* Fetch user + progress */
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      setAuthUser(user)
      const { data: prog } = await supabase
        .from('progress').select('completed_at').eq('user_id', user.id)
      if (prog?.length > 0) {
        setCompleted(prog.length)
        const latest = [...prog].sort(
          (a,b) => new Date(b.completed_at) - new Date(a.completed_at)
        )[0]
        setCompDate(new Date(latest.completed_at))
      }
      setLoading(false)
    }
    load()
  }, [])

  const isUnlocked = completedCount >= TOTAL
  const pct        = Math.min(100, Math.round((completedCount / TOTAL) * 100))

  /* Name split: first_name/last_name -> full_name split -> email fallback */
  const m         = authUser?.user_metadata || {}
  const firstName = m.first_name
    || m.full_name?.trim().split(' ')[0]
    || authUser?.email?.split('@')[0]
    || 'First'
  const lastName  = m.last_name
    || m.full_name?.trim().split(' ').slice(1).join(' ')
    || 'Last'

  const issuedDate = (isUnlocked && completionDate)
    ? completionDate.toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' })
    : new Date().toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' })

  /* Download: capture the hidden full-size certRef */
  async function handleDownload() {
    if (!certRef.current) return
    setDownloading(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(certRef.current, {
        scale:           3,
        useCORS:         true,
        allowTaint:      false,
        backgroundColor: '#F5EFE6',
        logging:         false,
        width:           CERT_W,
        height:          CERT_H,
        scrollX:         0,
        scrollY:         0,
      })
      const a = document.createElement('a')
      a.download = `LC_Certificate_${firstName}_${lastName}.png`
      a.href     = canvas.toDataURL('image/png', 1.0)
      a.click()
    } catch(e) {
      console.error('Certificate download error:', e)
      window.alert('Download failed. Use Ctrl+P to print instead.')
    } finally {
      setDownloading(false)
    }
  }

  /* Shared certificate markup rendered twice:
     1) visible scaled display (no ref)
     2) hidden full-size (certRef) for download capture */
  const certMarkup = (
    <div style={{
      position:   'relative',
      width:       CERT_W,
      height:      CERT_H,
      overflow:   'hidden',
      background: 'linear-gradient(155deg,#F8F3EA 0%,#F2EBE0 55%,#EDE5D8 100%)',
      fontFamily: "'DM Serif Display',Georgia,serif",
      boxShadow:  'inset 0 0 0 3px #C9A87C, inset 0 0 0 22px #F5EFE6, inset 0 0 0 24px rgba(201,168,124,0.45)',
    }}>

      {/* Blueprint background lines */}
      <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',opacity:0.055}} viewBox={`0 0 ${CERT_W} ${CERT_H}`} preserveAspectRatio="none">
        {[80,160,240,320,400,480,560,640,720].map(y=>(
          <line key={`h${y}`} x1="0" y1={y} x2={CERT_W} y2={y} stroke="#2F4A3F" strokeWidth="0.8"/>
        ))}
        {[120,240,360,480,600,720,840,960,1080,1200].map(x=>(
          <line key={`v${x}`} x1={x} y1="0" x2={x} y2={CERT_H} stroke="#2F4A3F" strokeWidth="0.8"/>
        ))}
        <rect x="830" y="190" width="220" height="420" fill="none" stroke="#2F4A3F" strokeWidth="1.5"/>
        <rect x="870" y="250" width="55" height="90" fill="none" stroke="#2F4A3F" strokeWidth="1"/>
        <rect x="955" y="250" width="55" height="90" fill="none" stroke="#2F4A3F" strokeWidth="1"/>
        <rect x="905" y="460" width="70" height="150" fill="none" stroke="#2F4A3F" strokeWidth="1"/>
        <line x1="830" y1="380" x2="1050" y2="380" stroke="#2F4A3F" strokeWidth="0.8"/>
        {[[100,180],[165,120],[230,155]].map(([x,yEnd],i)=>(
          <g key={i}>
            <line x1={x} y1="0" x2={x} y2={yEnd} stroke="#2F4A3F" strokeWidth="0.8"/>
            <ellipse cx={x} cy={yEnd+18} rx={18-i*2} ry={9-i} fill="none" stroke="#2F4A3F" strokeWidth="1"/>
          </g>
        ))}
      </svg>

      {/* Top-left dark teal corner */}
      <div style={{position:'absolute',top:0,left:0,width:210,height:170,background:'#1E3A34',clipPath:'polygon(0 0,100% 0,0 100%)'}}/>
      <div style={{position:'absolute',top:32,left:32,width:60,height:60,borderTop:'1px solid #C9A87C',borderLeft:'1px solid #C9A87C'}}/>

      {/* Bottom-right dark teal corner */}
      <div style={{position:'absolute',bottom:0,right:0,width:210,height:170,background:'#1E3A34',clipPath:'polygon(100% 0,100% 100%,0 100%)'}}/>
      <div style={{position:'absolute',bottom:32,right:32,width:60,height:60,borderBottom:'1px solid #C9A87C',borderRight:'1px solid #C9A87C'}}/>

      {/* Photometric polar diagram (top-right) */}
      <svg style={{position:'absolute',top:20,right:20,opacity:0.75}} viewBox="0 0 220 205" width="220" height="205">
        <text x="110" y="14" textAnchor="middle" fontSize="9" fill="#8a7a6a" fontFamily="monospace" letterSpacing="1.5">90 deg</text>
        <text x="175" y="52" textAnchor="start"  fontSize="9" fill="#8a7a6a" fontFamily="monospace">60 deg</text>
        <text x="196" y="122" textAnchor="start" fontSize="9" fill="#8a7a6a" fontFamily="monospace">30 deg</text>
        <text x="196" y="190" textAnchor="start" fontSize="9" fill="#8a7a6a" fontFamily="monospace">0 deg</text>
        <line x1="110" y1="195" x2="110" y2="22"  stroke="#C9A87C" strokeWidth="0.6" opacity="0.5"/>
        <line x1="110" y1="195" x2="188" y2="98"  stroke="#C9A87C" strokeWidth="0.6" opacity="0.5"/>
        <line x1="110" y1="195" x2="168" y2="22"  stroke="#C9A87C" strokeWidth="0.6" opacity="0.5"/>
        {[38,76,114,152].map(r=>(
          <path key={r} d={`M ${110-r} 195 A ${r} ${r} 0 0 1 ${110+r} 195`} fill="none" stroke="#C9A87C" strokeWidth="0.6" opacity="0.5"/>
        ))}
        {['1500','3000','4500','6000'].map((v,i)=>(
          <text key={v} x="113" y={[160,122,84,46][i]} fontSize="7" fill="#8a7a6a" fontFamily="monospace">{v}</text>
        ))}
        <path d="M 110 195 C 86 162,56 130,68 92 C 80 54,110 24,110 24 C 110 24,140 54,152 92 C 164 130,134 162,110 195 Z"
          fill="rgba(201,168,124,0.1)" stroke="#C9A87C" strokeWidth="2"/>
      </svg>

      {/* Main content column */}
      <div style={{
        position:'absolute',inset:0,
        display:'flex',flexDirection:'column',alignItems:'center',
        paddingTop:52,paddingBottom:32,paddingLeft:90,paddingRight:90,
        boxSizing:'border-box',
      }}>

        {/* Logo + brand */}
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
          <div style={{
            width:36,height:36,borderRadius:7,background:'#1E3A34',
            display:'flex',alignItems:'center',justifyContent:'center',
            fontFamily:"'Space Grotesk',sans-serif",fontWeight:800,fontSize:11,
            color:'#C9A87C',letterSpacing:'0.05em',
          }}>LC</div>
          <div>
            <div style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:13,
              color:'#1E3A34',letterSpacing:'0.26em',textTransform:'uppercase'}}>
              LC - Lighting Master
            </div>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:'#8a7a6a',
              letterSpacing:'0.24em',textTransform:'uppercase',marginTop:2}}>
              by Luxart LLC
            </div>
          </div>
        </div>

        {/* CERTIFICATE OF COMPLETION */}
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,
          letterSpacing:'0.34em',textTransform:'uppercase',color:'#C9A87C',marginBottom:14}}>
          Certificate of Completion
        </div>

        {/* Gold divider */}
        <div style={{display:'flex',alignItems:'center',gap:14,width:'68%',marginBottom:14}}>
          <div style={{flex:1,height:'1px',background:'linear-gradient(to left,#C9A87C,transparent)'}}/>
          <div style={{color:'#C9A87C',fontSize:10,lineHeight:1}}>&#9670;</div>
          <div style={{flex:1,height:'1px',background:'linear-gradient(to right,#C9A87C,transparent)'}}/>
        </div>

        {/* Certified Lighting Designer */}
        <div style={{fontFamily:"'DM Serif Display',Georgia,serif",fontSize:50,fontWeight:400,
          color:'#1A3230',lineHeight:1.05,textAlign:'center',marginBottom:8}}>
          Certified Lighting Designer
        </div>

        {/* EXAM PREPARATION */}
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,
          letterSpacing:'0.36em',textTransform:'uppercase',color:'#8a7a6a',marginBottom:18}}>
          Exam Preparation
        </div>

        {/* AWARDED TO */}
        <div style={{display:'flex',alignItems:'center',gap:14,width:'50%',marginBottom:14}}>
          <div style={{flex:1,height:'1px',background:'#C9A87C',opacity:0.55}}/>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,
            letterSpacing:'0.28em',textTransform:'uppercase',color:'#C9A87C',whiteSpace:'nowrap'}}>
            Awarded To
          </div>
          <div style={{flex:1,height:'1px',background:'#C9A87C',opacity:0.55}}/>
        </div>

        {/* NAME: First line / Last line */}
        <div style={{textAlign:'center',lineHeight:0.92,marginBottom:12}}>
          <div style={{fontFamily:"'DM Serif Display',Georgia,serif",fontSize:76,
            fontWeight:400,color:'#16120e',display:'block'}}>
            {firstName}
          </div>
          <div style={{fontFamily:"'DM Serif Display',Georgia,serif",fontSize:76,
            fontWeight:400,color:'#16120e',display:'block'}}>
            {lastName}
          </div>
        </div>

        {/* Diamond */}
        <div style={{color:'#C9A87C',fontSize:12,marginBottom:16}}>&#9670;</div>

        {/* Body text */}
        <p style={{fontFamily:"'Inter',sans-serif",fontSize:14,lineHeight:1.75,
          color:'#5a4a3a',textAlign:'center',maxWidth:540,margin:'0'}}>
          For completing all{' '}<strong style={{color:'#b85835'}}>74</strong>{' '}lessons across{' '}
          <strong style={{color:'#b85835'}}>12</strong>{' '}modules and passing the practice exam with a score of{' '}
          <strong style={{color:'#b85835'}}>100%</strong>,{' '}earning{' '}
          <strong style={{color:'#b85835'}}>24 CEU</strong>{' '}contact hours of professional development.
        </p>

        <div style={{flex:1}}/>

        {/* Bottom bar */}
        <div style={{
          display:'flex',alignItems:'center',justifyContent:'center',
          gap:64,width:'72%',
          borderTop:'1px solid rgba(201,168,124,0.45)',
          paddingTop:20,
        }}>
          <div style={{textAlign:'center'}}>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,
              letterSpacing:'0.24em',textTransform:'uppercase',color:'#8a7a6a',marginBottom:5}}>Date</div>
            <div style={{fontFamily:"'Inter',sans-serif",fontWeight:600,fontSize:13,
              color:'#16120e'}}>{issuedDate}</div>
          </div>
          <div style={{
            width:70,height:70,borderRadius:'50%',
            background:'#1E3A34',border:'2.5px solid #C9A87C',
            display:'flex',alignItems:'center',justifyContent:'center',
            fontFamily:"'Space Grotesk',sans-serif",fontWeight:800,fontSize:20,
            color:'#C9A87C',letterSpacing:'0.08em',flexShrink:0,
          }}>LC</div>
          <div style={{textAlign:'center'}}>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,
              letterSpacing:'0.24em',textTransform:'uppercase',color:'#8a7a6a',marginBottom:5}}>Provided by</div>
            <div style={{fontFamily:"'Inter',sans-serif",fontWeight:500,fontSize:12,
              color:'#1E3A34'}}>lightingmasterlc.com</div>
          </div>
        </div>
      </div>
    </div>
  )

  /* Readiness data */
  const hours = ((completedCount / TOTAL) * 24).toFixed(1)
  const reqs  = [
    { label:`Complete all ${TOTAL} lessons`, detail:`${completedCount} of ${TOTAL} lessons done`, done: completedCount >= TOTAL },
    { label:'Earn 24 CEU contact hours',     detail:`${hours} of 24 hours logged`,               done: completedCount >= TOTAL },
  ]

  if (loading) return (
    <div style={{padding:'80px 36px',textAlign:'center',fontFamily:"'Inter',sans-serif",color:'#8a7a6a'}}>
      Loading...
    </div>
  )

  return (
    <div style={{padding:'0 36px 48px'}}>
      <PageHead eyebrow="My progress - Course completion" title="Your" em="certificate."/>

      <section style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:40,margin:'32px 0 0',alignItems:'start'}}>

        {/* LEFT: visible scaled cert + download */}
        <div>
          <div ref={wrapperRef} style={{position:'relative',width:'100%',borderRadius:4,overflow:'hidden'}}>
            {/* Aspect-ratio spacer */}
            <div style={{paddingBottom:`${(CERT_H/CERT_W)*100}%`,position:'relative',overflow:'hidden'}}>
              <div style={{
                position:'absolute',top:0,left:0,
                width:CERT_W,height:CERT_H,
                transformOrigin:'top left',
                transform:`scale(${scale})`,
              }}>
                {certMarkup}
              </div>
            </div>

            {/* Lock overlay */}
            {!isUnlocked && (
              <div style={{
                position:'absolute',inset:0,
                background:'rgba(248,243,236,0.93)',
                display:'flex',flexDirection:'column',
                alignItems:'center',justifyContent:'center',gap:10,
                backdropFilter:'blur(3px)',
              }}>
                <div style={{fontSize:28}}>&#128274;</div>
                <div style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:16,color:'#16120e'}}>
                  Not unlocked yet
                </div>
                <div style={{fontFamily:"'Inter',sans-serif",fontSize:13,color:'#8a7a6a',textAlign:'center',maxWidth:240}}>
                  Complete all {TOTAL} lessons to unlock and download your certificate.
                </div>
              </div>
            )}
          </div>

          {isUnlocked && (
            <button
              onClick={handleDownload}
              disabled={downloading}
              style={{
                marginTop:12,width:'100%',padding:'13px 0',
                background:downloading?'#8a7a6a':'#2a6048',
                color:'#fff',border:'none',borderRadius:4,
                fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:14,
                letterSpacing:'0.04em',cursor:downloading?'default':'pointer',
                transition:'background 200ms',
              }}
            >
              {downloading ? 'Generating...' : 'Download Certificate'}
            </button>
          )}
        </div>

        {/* RIGHT: readiness panel */}
        <div style={{background:'#16120e',borderRadius:6,padding:'28px 32px',color:'#fff'}}>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,letterSpacing:'0.22em',
            textTransform:'uppercase',color:'#c9a87c',marginBottom:12}}>
            Certificate readiness
          </div>
          <div style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:52,
            letterSpacing:'-0.03em',lineHeight:1,marginBottom:6}}>
            {pct}<em style={{fontStyle:'normal',fontSize:24,color:'#c9a87c'}}>%</em>
          </div>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,letterSpacing:'0.16em',
            color:'rgba(255,255,255,0.5)',marginBottom:16}}>
            {completedCount} of {TOTAL} lessons completed
          </div>
          <div style={{height:4,background:'rgba(255,255,255,0.12)',borderRadius:99,overflow:'hidden',marginBottom:24}}>
            <div style={{height:'100%',width:`${pct}%`,
              background:isUnlocked?'#2a6048':'#b85835',
              borderRadius:99,transition:'width 700ms cubic-bezier(.4,0,.2,1)'}}/>
          </div>
          {reqs.map((r,i)=>(
            <div key={i} style={{display:'flex',alignItems:'flex-start',gap:12,padding:'10px 0',
              borderBottom:i===0?'1px solid rgba(255,255,255,0.08)':'none'}}>
              <span style={{
                width:18,height:18,borderRadius:'50%',flexShrink:0,marginTop:2,
                border:`1px solid ${r.done?'transparent':'rgba(255,255,255,0.3)'}`,
                background:r.done?'#2a6048':'transparent',
                display:'flex',alignItems:'center',justifyContent:'center',
                fontSize:9,color:'#fff',
              }}>{r.done?'v':''}</span>
              <div>
                <div style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:600,fontSize:13,
                  color:r.done?'#fff':'rgba(255,255,255,0.7)',marginBottom:3}}>{r.label}</div>
                <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,
                  letterSpacing:'0.1em',color:'rgba(255,255,255,0.38)'}}>{r.detail}</div>
              </div>
            </div>
          ))}
          {isUnlocked && (
            <div style={{marginTop:20,padding:'14px 16px',background:'#2a6048',borderRadius:4,
              display:'flex',alignItems:'center',gap:10}}>
              <span style={{fontSize:18}}>&#127891;</span>
              <div>
                <div style={{fontFamily:"'Space Grotesk',sans-serif",fontWeight:700,fontSize:13,color:'#fff'}}>
                  Certificate unlocked!
                </div>
                <div style={{fontFamily:"'Inter',sans-serif",fontSize:11,
                  color:'rgba(255,255,255,0.7)',marginTop:2}}>Issued {issuedDate}</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* HIDDEN full-size cert for download capture only */}
      <div style={{position:'fixed',top:0,left:0,
        transform:'translateX(-200vw)',
        pointerEvents:'none',zIndex:-1}}>
        <div ref={certRef}>
          {certMarkup}
        </div>
      </div>
    </div>
  )
}
function ExamPage({ setRoute, user, userSubscription }) {
  const supabase = createClient()

  const [screen, setScreen] = useState('start')   // start | exam | results | max_attempts
  const [mode, setMode] = useState('full')
  const [sessionId, setSessionId] = useState(null)
  const [attemptsUsed, setAttemptsUsed] = useState(0)

  // The full question set, loaded once
  const [questions, setQuestions] = useState([])
  const [idx, setIdx] = useState(0)

  // Per-question UI state
  const [selected, setSelected] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [timeLeft, setTimeLeft] = useState(30)
  const [timerOn, setTimerOn] = useState(false)
  const [qStartMs, setQStartMs] = useState(null)

  // Accumulated answers — { qid: { answer, correct, timeMs, speedBonus } }
  const [answers, setAnswers] = useState({})

  // Results
  const [results, setResults] = useState(null)

  // Retake
  const [retakeReason, setRetakeReason] = useState('')
  const [retakeSubmitted, setRetakeSubmitted] = useState(false)

  const [resumeData, setResumeData] = useState(null)  // null | resume payload
  const [checkingResume, setCheckingResume] = useState(true)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const plan = userSubscription?.plan || 'free'
  const canAccess =
    (['t2','t3'].includes(plan) && userSubscription?.status === 'active') ||
    (userSubscription?.exam_addon === true && userSubscription?.status === 'active')

  // Load attempt count
  useEffect(() => {
    if (!user?.id) return
    supabase
      .from('exam_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .then(({ count }) => setAttemptsUsed(count || 0))
  }, [user])

  // Check for a resumable session on mount
  useEffect(() => {
    if (!user?.id || !canAccess) { setCheckingResume(false); return }
    fetch('/api/exam/resume', { method: 'POST' })
      .then(r => r.json())
      .then(data => {
        if (data.resumable) {
          setResumeData(data)
        }
        setCheckingResume(false)
      })
      .catch(() => setCheckingResume(false))
  }, [user, canAccess])

  const current = questions[idx] || null

  // Timer — keyed on idx so it resets each question
  useEffect(() => {
    if (!timerOn) return
    setTimeLeft(30)
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(t)
          submitAnswer(null, true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [timerOn, idx])

  async function startSession() {
    if (!canAccess) return
    if (attemptsUsed >= 5) { setScreen('max_attempts'); return }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/exam/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.error === 'MAX_ATTEMPTS') { setScreen('max_attempts'); return }
        throw new Error(data.error || 'Failed to start')
      }
      setSessionId(data.sessionId)
      setQuestions(data.questions)
      setIdx(0)
      setAnswers({})
      setSelected(null)
      setFeedback(null)
      setResults(null)
      setResumeData(null)
      setScreen('exam')
      setQStartMs(Date.now())
      setTimerOn(true)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function resumeSession() {
    if (!resumeData) return
    setSessionId(resumeData.sessionId)
    setMode(resumeData.mode)
    setQuestions(resumeData.questions)
    setAnswers(resumeData.answers || {})
    setIdx(resumeData.currentIdx || 0)
    setSelected(null)
    setFeedback(null)
    setResults(null)
    setScreen('exam')
    setQStartMs(Date.now())
    setTimerOn(true)
  }

  async function submitAnswer(choice, timedOut = false) {
    if (loading || feedback || !current) return
    setTimerOn(false)
    setLoading(true)
    const answer = timedOut ? '' : choice
    const timeMs = Date.now() - (qStartMs || Date.now())
    setSelected(answer)

    try {
      const res = await fetch('/api/exam/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qid: current.qid, answer }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Check failed')

      const speedBonus = data.correct && timeMs < 30000
        ? Math.round(Math.max(0, (30000 - timeMs) / 30000) * 250)
        : 0

      setFeedback({
        correct: data.correct,
        correctAnswer: data.correctAnswer,
        explanation: data.explanation,
        speedBonus,
      })

      // Record answer and persist to DB
      const newAnswers = {
        ...answers,
        [current.qid]: { answer, correct: data.correct, timeMs, speedBonus }
      }
      setAnswers(newAnswers)

      // Save progress (fire and forget — don't block UI)
      fetch('/api/exam/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          answers: newAnswers,
          currentIdx: idx,
        }),
      }).catch(e => console.error('save failed:', e))

      setLoading(false)
    } catch (e) {
      console.error('submitAnswer error:', e.message)
      setError(`Failed: ${e.message}`)
      setSelected(null)
      setFeedback(null)
      setLoading(false)
      setTimerOn(true)
      setQStartMs(Date.now())
    }
  }

  function nextQuestion() {
    const isLast = idx + 1 >= questions.length
    if (isLast) {
      finishExam()
    } else {
      const newIdx = idx + 1
      setIdx(newIdx)
      setSelected(null)
      setFeedback(null)
      setQStartMs(Date.now())
      setTimerOn(true)
      // Persist new position
      fetch('/api/exam/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, answers, currentIdx: newIdx }),
      }).catch(e => console.error('save failed:', e))
    }
  }

  async function finishExam() {
    setLoading(true)
    try {
      const res = await fetch('/api/exam/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, answers }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Finish failed')
      setResults(data)
      setAttemptsUsed(prev => prev + 1)
      setScreen('results')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function submitRetake() {
    try {
      const res = await fetch('/api/exam/retake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: retakeReason }),
      })
      if (res.ok) setRetakeSubmitted(true)
    } catch (e) { console.error(e) }
  }

  // ── PAYWALL ──
  if (!canAccess) return (
    <div style={{padding:'60px 36px',maxWidth:520}}>
      <div style={mono({fontSize:9,letterSpacing:'0.18em',textTransform:'uppercase',color:C.accent,marginBottom:12})}>Practice Exam</div>
      <h2 style={{fontFamily:F.display,fontWeight:700,fontSize:28,color:C.ink,margin:'0 0 16px'}}>Unlock the Practice Exam</h2>
      <p style={{fontFamily:F.body,fontSize:15,color:C.inkMute,lineHeight:1.75,margin:'0 0 28px'}}>180 questions across 18 NCQLP topic areas. Available with Full Course + Exam, or as a $200 add-on.</p>
      <button onClick={async () => {
        const res = await fetch('/api/stripe/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({plan:'exam_addon'})})
        const d = await res.json(); if (d.url) window.location.href = d.url
      }} style={{fontFamily:F.display,fontWeight:700,fontSize:14,background:C.accent,color:'#fff',border:'none',borderRadius:99,padding:'13px 28px',cursor:'pointer'}}>Add Practice Exam — $200 →</button>
    </div>
  )

  // ── MAX ATTEMPTS ──
  if (screen === 'max_attempts') return (
    <div style={{padding:'60px 36px',maxWidth:520}}>
      <h2 style={{fontFamily:F.display,fontWeight:700,fontSize:26,color:C.ink,margin:'0 0 12px'}}>5 attempts used</h2>
      <p style={{fontFamily:F.body,fontSize:14,color:C.inkMute,lineHeight:1.75,margin:'0 0 24px'}}>You have used all 5 exam attempts. Request more below — reviewed within 1 business day.</p>
      {retakeSubmitted ? (
        <div style={{background:`${C.forest}12`,border:`1px solid ${C.forest}`,borderRadius:8,padding:'20px 24px'}}>
          <div style={{fontFamily:F.display,fontWeight:700,fontSize:15,color:C.forest,marginBottom:6}}>✓ Request submitted</div>
          <div style={{fontFamily:F.body,fontSize:13,color:C.inkMute}}>We will email you at {user?.email}</div>
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <textarea value={retakeReason} onChange={e=>setRetakeReason(e.target.value)} placeholder="Optional reason" rows={4} style={{fontFamily:F.body,fontSize:13,color:C.ink,background:C.paper,border:`1px solid ${C.rule}`,borderRadius:6,padding:'12px 14px',resize:'vertical'}}/>
          <button onClick={submitRetake} style={{fontFamily:F.display,fontWeight:700,fontSize:14,background:C.accent,color:'#fff',border:'none',borderRadius:99,padding:'12px 24px',cursor:'pointer'}}>Request more attempts →</button>
        </div>
      )}
    </div>
  )

  // ── START ──
  if (screen === 'start') return (
    <div style={{padding:'48px 36px',maxWidth:600}}>
      <div style={mono({fontSize:9,letterSpacing:'0.18em',textTransform:'uppercase',color:C.accent,marginBottom:12})}>Practice Exam · {attemptsUsed}/5 attempts used</div>
      {resumeData && (
        <div style={{background:`${C.forest}10`,border:`1px solid ${C.forest}`,borderRadius:10,padding:'18px 22px',marginBottom:24}}>
          <div style={{fontFamily:F.display,fontWeight:700,fontSize:15,color:C.forest,marginBottom:6}}>
            You have an exam in progress
          </div>
          <div style={{fontFamily:F.body,fontSize:13,color:C.inkMute,lineHeight:1.6,marginBottom:14}}>
            {resumeData.answeredCount} of {resumeData.totalCount} questions answered · {resumeData.mode === 'quick' ? 'Quick' : resumeData.mode === 'mid' ? 'Mid' : 'Full'} exam. Resume where you left off, or start fresh below.
          </div>
          <button onClick={resumeSession} style={{fontFamily:F.display,fontWeight:700,fontSize:14,background:C.forest,color:'#fff',border:'none',borderRadius:99,padding:'11px 26px',cursor:'pointer'}}>
            Resume exam →
          </button>
        </div>
      )}
      <h2 style={{fontFamily:F.display,fontWeight:700,fontSize:28,color:C.ink,margin:'0 0 8px'}}>NCQLP Practice Exam</h2>
      <p style={{fontFamily:F.body,fontSize:14,color:C.inkMute,lineHeight:1.75,margin:'0 0 28px'}}>30-second timer per question with speed bonus up to +250. Immediate feedback after each answer.</p>
      <div style={{marginBottom:24}}>
        <div style={mono({fontSize:9,letterSpacing:'0.16em',textTransform:'uppercase',color:C.inkMute,marginBottom:12})}>Exam length</div>
        <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
          {[{id:'quick',label:'Quick',desc:'20 questions'},{id:'mid',label:'Mid',desc:'50 questions'},{id:'full',label:'Full',desc:'All 180'}].map(m=>(
            <button key={m.id} onClick={()=>setMode(m.id)} style={{fontFamily:F.display,fontWeight:mode===m.id?700:500,fontSize:13,background:mode===m.id?C.ink:C.paper,color:mode===m.id?C.cream:C.inkMute,border:`1px solid ${mode===m.id?C.ink:C.rule}`,borderRadius:8,padding:'12px 20px',cursor:'pointer'}}>
              <div>{m.label}</div>
              <div style={{fontFamily:F.mono,fontSize:9,marginTop:3,color:mode===m.id?'rgba(242,230,218,0.6)':C.inkMute}}>{m.desc}</div>
            </button>
          ))}
        </div>
      </div>
      {error && <div style={{color:C.accent,fontFamily:F.mono,fontSize:11,marginBottom:16}}>❌ {error}</div>}
      <button onClick={startSession} disabled={loading} style={{fontFamily:F.display,fontWeight:700,fontSize:15,background:resumeData?'transparent':C.accent,color:resumeData?C.inkMute:'#fff',border:resumeData?`1px solid ${C.rule}`:'none',borderRadius:99,padding:'14px 36px',cursor:'pointer',opacity:loading?0.7:1}}>
        {loading ? 'Loading questions...' : resumeData ? 'Start a new exam instead' : `Begin ${mode==='quick'?'20':mode==='mid'?'50':'180'}-question exam →`}
      </button>
    </div>
  )

  // ── EXAM ──
  if (screen === 'exam' && current) {
    const pct = Math.round((idx / questions.length) * 100)
    return (
      <div key={current.qid} style={{padding:'32px 36px',maxWidth:680}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <div style={mono({fontSize:9,letterSpacing:'0.16em',textTransform:'uppercase',color:C.inkMute})}>Q{idx+1} of {questions.length} · {current.topic}</div>
          <div style={{display:'flex',alignItems:'center',gap:14}}>
            <button onClick={()=>{
              setTimerOn(false)
              fetch('/api/exam/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId,answers,currentIdx:idx})}).catch(()=>{})
              setScreen('start')
              setResumeData(null)
              // Re-check resume so the banner shows the saved session
              fetch('/api/exam/resume',{method:'POST'}).then(r=>r.json()).then(d=>{if(d.resumable)setResumeData(d)}).catch(()=>{})
            }} style={{fontFamily:F.display,fontWeight:600,fontSize:12,background:'transparent',color:C.inkMute,border:`1px solid ${C.rule}`,borderRadius:99,padding:'7px 16px',cursor:'pointer'}}>
              Save & exit
            </button>
            <div style={{width:40,height:40,borderRadius:'50%',background:timeLeft>10?C.forest:C.accent,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:F.display,fontWeight:700,fontSize:14,color:'#fff'}}>{timeLeft}</div>
          </div>
        </div>
        <div style={{height:3,background:C.rule,borderRadius:99,overflow:'hidden',marginBottom:24}}>
          <div style={{height:'100%',width:`${pct}%`,background:C.accent,transition:'width 400ms ease'}}/>
        </div>
        <h3 style={{fontFamily:F.display,fontWeight:700,fontSize:18,color:C.ink,lineHeight:1.5,margin:'0 0 24px'}}>{current.prompt}</h3>
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {(current.choices||[]).map((choice,ci)=>{
            const label='ABCDE'[ci]
            let bg=C.paper,border=C.rule,color=C.ink
            if (feedback) {
              if (choice===feedback.correctAnswer){bg=`${C.forest}15`;border=C.forest;color=C.forest}
              else if (choice===selected&&!feedback.correct){bg=`${C.accent}12`;border=C.accent;color=C.accent}
            } else if (selected===choice){bg=`${C.ink}08`;border=C.ink}
            return (
              <button key={ci} onClick={()=>!feedback&&!loading&&submitAnswer(choice)} disabled={!!feedback||loading} style={{display:'flex',alignItems:'flex-start',gap:14,textAlign:'left',fontFamily:F.display,fontSize:14,fontWeight:500,background:bg,border:`1.5px solid ${border}`,color,borderRadius:8,padding:'14px 18px',cursor:feedback?'default':'pointer'}}>
                <span style={{fontFamily:F.mono,fontSize:11,fontWeight:700,minWidth:20,flexShrink:0,marginTop:2}}>{label}</span>
                <span style={{lineHeight:1.6}}>{choice}</span>
              </button>
            )
          })}
        </div>
        {feedback && (
          <div style={{marginTop:20,padding:'16px 20px',background:feedback.correct?`${C.forest}12`:`${C.accent}10`,border:`1px solid ${feedback.correct?C.forest:C.accent}`,borderRadius:8}}>
            <div style={{fontFamily:F.display,fontWeight:700,fontSize:14,color:feedback.correct?C.forest:C.accent,marginBottom:6}}>
              {feedback.correct?'✓ Correct':'✗ Incorrect'}
              {feedback.speedBonus>0 && <span style={{fontFamily:F.mono,fontSize:11,marginLeft:12,color:C.forest}}>+{feedback.speedBonus} speed bonus</span>}
            </div>
            <div style={{fontFamily:F.body,fontSize:13,color:C.inkMute,lineHeight:1.7,marginBottom:14}}>{feedback.explanation}</div>
            <button onClick={nextQuestion} disabled={loading} style={{fontFamily:F.display,fontWeight:700,fontSize:13,background:C.ink,color:C.cream,border:'none',borderRadius:99,padding:'10px 24px',cursor:'pointer'}}>
              {idx+1>=questions.length ? (loading?'Scoring...':'Finish exam →') : 'Next question →'}
            </button>
          </div>
        )}
      </div>
    )
  }

  // ── RESULTS ──
  if (screen === 'results' && results) {
    const passed = results.finalScore >= 85
    const topics = Object.entries(results.topicBreakdown||{}).map(([t,v])=>({topic:t,pct:Math.round(v.correct/v.total*100),...v})).sort((a,b)=>a.pct-b.pct)
    return (
      <div style={{padding:'40px 36px',maxWidth:640}}>
        <div style={mono({fontSize:9,letterSpacing:'0.18em',textTransform:'uppercase',color:C.accent,marginBottom:12})}>Exam Complete</div>
        <h2 style={{fontFamily:F.display,fontWeight:700,fontSize:36,color:passed?C.forest:C.accent,margin:'0 0 4px'}}>{results.finalScore}%</h2>
        <div style={{fontFamily:F.display,fontWeight:600,fontSize:16,color:C.inkMute,marginBottom:24}}>{passed?'🎉 Passed — you are ready!':'Keep studying — 85% required to pass'}</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',border:`1px solid ${C.rule}`,borderRadius:6,overflow:'hidden',marginBottom:32}}>
          {[['Score',`${results.finalScore}%`],['Correct',`${results.correctCount}/${results.total}`],['Attempts',`${attemptsUsed}/5`]].map(([k,v],i)=>(
            <div key={k} style={{padding:'18px 20px',borderRight:i<2?`1px solid ${C.rule}`:'none',background:C.paper}}>
              <div style={mono({fontSize:9,letterSpacing:'0.16em',textTransform:'uppercase',color:C.inkMute,marginBottom:6})}>{k}</div>
              <div style={{fontFamily:F.display,fontWeight:700,fontSize:22,color:C.ink}}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{marginBottom:28}}>
          <div style={mono({fontSize:9,letterSpacing:'0.16em',textTransform:'uppercase',color:C.inkMute,marginBottom:14})}>Performance by topic</div>
          {topics.map(t=>(
            <div key={t.topic} style={{marginBottom:10}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                <span style={{fontFamily:F.display,fontWeight:500,fontSize:12,color:C.ink}}>{t.topic}</span>
                <span style={mono({fontSize:10,color:t.pct>=85?C.forest:C.accent})}>{t.pct}% ({t.correct}/{t.total})</span>
              </div>
              <div style={{height:4,background:C.rule,borderRadius:99,overflow:'hidden'}}>
                <div style={{height:'100%',width:`${t.pct}%`,background:t.pct>=85?C.forest:C.accent}}/>
              </div>
            </div>
          ))}
        </div>
        <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
          {attemptsUsed<5 ? (
            <button onClick={()=>{setScreen('start');setResults(null);setQuestions([]);setAnswers({});setIdx(0)}} style={{fontFamily:F.display,fontWeight:700,fontSize:14,background:C.accent,color:'#fff',border:'none',borderRadius:99,padding:'12px 24px',cursor:'pointer'}}>Retake exam →</button>
          ) : (
            <button onClick={()=>setScreen('max_attempts')} style={{fontFamily:F.display,fontWeight:600,fontSize:13,background:'transparent',color:C.inkMute,border:`1px solid ${C.rule}`,borderRadius:99,padding:'11px 22px',cursor:'pointer'}}>Request more attempts</button>
          )}
          <button onClick={()=>setRoute('cert')} style={{fontFamily:F.display,fontWeight:600,fontSize:13,background:'transparent',color:C.inkMute,border:`1px solid ${C.rule}`,borderRadius:99,padding:'11px 22px',cursor:'pointer'}}>View certificate →</button>
        </div>
      </div>
    )
  }

  return null
}

/* ── LESSON CONTENT DATA ───────────────────────────────────────── */

/* ── MODULE LESSON VIEW ── */
/* ── PER-MODULE SHARE COPY ── */
const MODULE_SHARE_COPY = {
  "01": {
    personal: `I just finished Module 01 of my LC exam prep — and honestly, the fundamentals hit different when you actually understand them. Light, vision, the inverse square law, footcandles vs lux, luminous efficacy. This is the foundation everything else is built on. Working my way toward the Lighting Certified credential one module at a time 💡 → lightingmasterlc.com`,
    broadcast: `Module 01 complete — Light & the Visual Environment. Electromagnetic spectrum, photopic vs scotopic vision, the inverse square law, footcandles vs lux, luminous efficacy, and the fundamentals that underpin every lighting calculation. 💡 The LC exam starts here. So did I → lightingmasterlc.com`,
  },
  "02": {
    personal: `Module 02 done. Light sources — from incandescent to LED, lamp life, lumen depreciation, CCT, CRI, TM-30 Rf and Rg. If you work in lighting and haven't studied this stuff formally, you're missing so much context. Prepping for my LC exam and it's leveling me up fast 🔆 → lightingmasterlc.com`,
    broadcast: `Module 02 complete — Light Sources & Lamps. Incandescent, fluorescent, HID, and LED compared. Lamp life, lumen depreciation, CCT, CRI, TM-30 Rf and Rg, and how to select the right source for any application. 🔆 Know your sources. Pass your exam → lightingmasterlc.com`,
  },
  "03": {
    personal: `Just wrapped Module 03 on LED technology and my brain is full. COB, SMD, UV, IR, OLED, MicroLED, filament, tape — I knew some of this but not at this depth. Thermal management and lumen maintenance ratings are way more important than I realized. LC exam prep in progress ⚡ → lightingmasterlc.com`,
    broadcast: `Module 03 complete — LED Technology Deep Dive. COB, SMD, filament, tape, high-power, UV, IR, and OLED packages. Thermal management, L70/L80/L90 ratings, LEED EQ credits, and WELL melanopic lux targets. ⚡ This is the technology powering the future of light. Study it right → lightingmasterlc.com`,
  },
  "04": {
    personal: `Module 04 finished! Lighting controls are where the real energy savings live — DALI, 0-10V dimming, occupancy sensors, daylight harvesting, BACnet, Title 24 mandatory controls, ASHRAE 90.1. Smart buildings need lighting professionals who actually know this. LC exam prep continues 🎛️ → lightingmasterlc.com`,
    broadcast: `Module 04 complete — Lighting Controls & Systems. DALI, 0-10V dimming, occupancy sensors, BACnet, Title 24 mandatory controls, and ASHRAE 90.1 compliance. 🎛️ Smart buildings need smart lighting professionals. Become one → lightingmasterlc.com`,
  },
  "05": {
    personal: `Module 05 complete. Photometry is one of those topics where the deeper you go, the more you realize how much there is to know. IES files, candela distribution curves, coefficient of utilization, zonal cavity method, UGR glare metrics — this is the math behind great lighting design. LC exam prep 📐 → lightingmasterlc.com`,
    broadcast: `Module 05 complete — Photometry & Luminaire Performance. IES files, candela distribution curves, coefficient of utilization, zonal cavity method, luminance ratios, UGR and VCP glare metrics. 📐 The math behind great lighting. Master it → lightingmasterlc.com`,
  },
  "06": {
    personal: `Module 06 done — interior lighting design. Illuminance targets, layered lighting, accent ratios, color rendering across retail, healthcare, museums, hospitality. Every space has different requirements and I can now articulate exactly why. This LC prep is changing how I see every room I walk into 🏛️ → lightingmasterlc.com`,
    broadcast: `Module 06 complete — Interior Lighting Design. Illuminance targets, layered lighting, accent ratios, color rendering in retail and healthcare, museum conservation limits, and hospitality atmosphere design. 🏛️ Great spaces don't happen by accident. Neither does passing the LC exam → lightingmasterlc.com`,
  },
  "07": {
    personal: `Module 07 wrapped up. Exterior lighting, emergency systems, and codes — BUG ratings, IES distribution Types I-V, NFPA 101 emergency requirements (1fc, 90 min, 10 sec), egress path standards, Title 24 outdoor LPD. From streets to exit signs, if it's lit it's on the exam. LC exam prep 🌃 → lightingmasterlc.com`,
    broadcast: `Module 07 complete — Exterior, Emergency & Codes. BUG ratings, light trespass, IESNA RP-8 roadway standards, IES distribution Types I–V, NFPA 101 emergency lighting (1fc, 90 min, 10 sec), egress path requirements, and Title 24 outdoor LPD. 🌃 From streets to exit signs — if it's lit, it's on the exam → lightingmasterlc.com`,
  },
  "08": {
    personal: `Module 08 complete. Energy codes are not optional knowledge for a lighting professional — ASHRAE 90.1 LPD tables, building area vs space-by-space methods, Title 24, IECC compliance paths. Knowing the code means designing better and defending your decisions. LC exam prep ⚙️ → lightingmasterlc.com`,
    broadcast: `Module 08 complete — Energy Codes & Standards. ASHRAE 90.1 LPD tables, building area vs space-by-space methods, Title 24, IECC compliance paths, and power allowance calculations. ⚙️ Energy codes aren't going away. Neither are lighting professionals who know them → lightingmasterlc.com`,
  },
  "09": {
    personal: `Module 09 done and this one genuinely changed how I think about lighting. Daylighting, circadian rhythms, melanopic lux, WELL Building Standard, sDA and ASE metrics, tunable white. Light affects how people feel and sleep — designing it well is a health decision. LC exam prep 🌅 → lightingmasterlc.com`,
    broadcast: `Module 09 complete — Daylighting & Human-Centric Lighting. sDA, ASE, daylight autonomy, melanopic lux, circadian entrainment, tunable white, WELL L01–L09, and daylight harvesting controls. 🌅 Light affects how people feel, sleep, and perform. This module shows you why → lightingmasterlc.com`,
  },
  "10": {
    personal: `Module 10 finished. Life-cycle cost analysis, simple payback vs ROI, utility rebates, lighting audits, retrofit scoping, group relamping strategies. The best lighting designers understand the business case for their work. LC exam prep — and a better designer for it 💼 → lightingmasterlc.com`,
    broadcast: `Module 10 complete — Lighting Economics & Project Management. Life-cycle cost analysis, simple payback vs ROI, utility rebates, lighting audits, retrofit scoping, and group relamping strategies. 💼 The best lighting designers speak the language of money too → lightingmasterlc.com`,
  },
  "11": {
    personal: `Module 11 wrapped. Sustainability in lighting isn't a trend — it's the standard. LEED v4.1 lighting credits, WELL Building Standard, DLC QPL qualification, EnergyStar, LCA for luminaires. Knowing how to document compliance is as important as knowing the requirements. LC exam prep 🌿 → lightingmasterlc.com`,
    broadcast: `Module 11 complete — Sustainability & Green Building. LEED v4.1 lighting credits, WELL Building Standard, DLC QPL, EnergyStar, LCA for luminaires, and third-party certification documentation. 🌿 Sustainable design is not a trend. It's the standard. Stay ahead of it → lightingmasterlc.com`,
  },
  "12": {
    personal: `Module 12 complete — and that means ALL 12 modules done. Design process, photometric reports, lighting schedules, point-by-point calculations, commissioning checklists, submittals, post-occupancy evaluation. I've gone through the full NCQLP blueprint. The exam is next 🏆 → lightingmasterlc.com`,
    broadcast: `Module 12 complete — Lighting Design Practice & Documentation. Design process, photometric reports, lighting schedules, point-by-point calculations, commissioning checklists, submittals, and post-occupancy evaluation. 🏆 12 modules down. One exam between you and LC. You've got this → lightingmasterlc.com`,
  },
}

const MODULE_HASHTAGS = {
  "01": `#NCQLP #LightingCertified #LC #IES #LightingDesign #LightingEducation #LightingScience #PhotopicVision #InverseSquareLaw #Footcandles #LumensVsLux #LightingProfessional #LuxartMedia lightingmasterlc.com`,
  "02": `#NCQLP #LightingCertified #LC #IES #LEDLighting #LightSources #CRI #TM30 #ColorRenderingIndex #CCT #LampDepreciation #LightingEducation #LightingProfessional #LuxartMedia lightingmasterlc.com`,
  "03": `#NCQLP #LightingCertified #LC #IES #LEDTechnology #COBled #SMDled #OLEDlighting #LEED #WELLBuilding #MelanopicLux #CircadianLighting #LumenMaintenance #L70 #LightingEducation #LuxartMedia lightingmasterlc.com`,
  "04": `#NCQLP #LightingCertified #LC #IES #LightingControls #DALI #Dimming #OccupancySensor #DaylightHarvesting #Title24 #ASHRAE901 #BACnet #SmartLighting #LightingAutomation #LuxartMedia lightingmasterlc.com`,
  "05": `#NCQLP #LightingCertified #LC #IES #Photometry #IESfiles #CandalaDistribution #ZonalCavityMethod #CoefficientOfUtilization #UGR #Glare #LuminanceRatio #SpacingCriteria #LightingEducation #LuxartMedia lightingmasterlc.com`,
  "06": `#NCQLP #LightingCertified #LC #IES #InteriorLighting #LightingDesign #RetailLighting #HealthcareLighting #HospitalityLighting #MuseumLighting #OfficeErgonomics #LayeredLighting #LightingProfessional #LuxartMedia lightingmasterlc.com`,
  "07": `#NCQLP #LightingCertified #LC #IES #ExteriorLighting #BUGrating #LightTrespass #IESNARPP8 #RoadwayLighting #EmergencyLighting #NFPA101 #EgressLighting #Title24 #OutdoorLighting #LuxartMedia lightingmasterlc.com`,
  "08": `#NCQLP #LightingCertified #LC #IES #EnergyCode #ASHRAE901 #LPD #Title24 #IECC #EnergyEfficiency #LightingPowerDensity #GreenBuilding #EnergyModeling #LightingCompliance #LuxartMedia lightingmasterlc.com`,
  "09": `#NCQLP #LightingCertified #LC #IES #Daylighting #HumanCentricLighting #CircadianLighting #WELL #sDA #MelanopicLux #TunableWhite #DaylightAutonomy #BiophilicDesign #HealthyBuildings #LuxartMedia lightingmasterlc.com`,
  "10": `#NCQLP #LightingCertified #LC #IES #LightingEconomics #LifeCycleCost #LightingAudit #EnergyRetrofit #UtilityRebate #ROI #MaintenanceFactor #LightingROI #GreenBuilding #SustainableLighting #LuxartMedia lightingmasterlc.com`,
  "11": `#NCQLP #LightingCertified #LC #IES #Sustainability #LEED #WELLBuilding #DLC #EnergyStar #GreenBuilding #SustainableLighting #LightingCertification #NetZero #CircularEconomy #LuxartMedia lightingmasterlc.com`,
  "12": `#NCQLP #LightingCertified #LC #IES #LightingDesign #LightingDocumentation #PhotometricReport #LightingCommissioning #ConstructionDocuments #LightingSchedule #DesignProcess #LightingProfessional #LuxartMedia lightingmasterlc.com`,
}

/* ── SHARE BUTTON (used inside ModuleCompleteModal) ── */
function ShareBtn({icon, label, hoverBg, hoverColor, defaultColor, onClick}){
  return(
    <button onClick={onClick}
      style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,
        padding:"10px 16px",borderRadius:8,border:`1px solid ${C.rule}`,
        background:C.paper,color:defaultColor||C.inkSoft,
        fontFamily:F.display,fontSize:12,fontWeight:600,cursor:"pointer",transition:"all 0.15s"}}
      onMouseEnter={e=>{e.currentTarget.style.background=hoverBg;e.currentTarget.style.color=hoverColor;e.currentTarget.style.borderColor=hoverBg}}
      onMouseLeave={e=>{e.currentTarget.style.background=C.paper;e.currentTarget.style.color=defaultColor||C.inkSoft;e.currentTarget.style.borderColor=C.rule}}>
      <span style={{fontWeight:700,fontSize:13,lineHeight:1}}>{icon}</span>
      {label}
    </button>
  )
}

/* ── MODULE COMPLETE SHARE MODAL ── */
function ModuleCompleteModal({module, courseComplete, onClose, onNextLesson, nextLesson, setRoute}){
  const [copied,setCopied]=useState(false)
  const moduleKey=String(module.n).padStart(2,"0")
  const shareCopy=MODULE_SHARE_COPY[moduleKey]
  const shareBody=(typeof shareCopy==='object'?shareCopy.broadcast:shareCopy)||`Module ${module.n} complete — ${module.title}. → lightingmasterlc.com`
  const hashtags=MODULE_HASHTAGS[moduleKey]||"#NCQLP #LightingDesign #IES #LightingCertified #LC"
  const shareText=shareBody+'\n\n'+hashtags

  useEffect(()=>{
    function onKey(e){ if(e.key==="Escape") onClose() }
    window.addEventListener("keydown",onKey)
    return ()=>window.removeEventListener("keydown",onKey)
  },[onClose])

  const twitterUrl=`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`

  return(
    <div onClick={e=>{if(e.target===e.currentTarget)onClose()}}
      style={{position:"fixed",inset:0,zIndex:3000,background:"rgba(47,74,63,0.82)",
        display:"flex",alignItems:"center",justifyContent:"center",padding:"20px",overflowY:"auto"}}>
      <div style={{background:C.paper,borderRadius:18,padding:"40px 36px",
        width:"100%",maxWidth:440,position:"relative",
        border:`1px solid ${C.rule}`,margin:"auto",textAlign:"center"}}>

        <button onClick={onClose} style={{position:"absolute",top:14,right:16,
          background:"none",border:"none",cursor:"pointer",fontSize:22,color:C.inkMute,lineHeight:1}}>×</button>

        <div style={{fontSize:52,marginBottom:16,lineHeight:1}}>🎓</div>

        <div style={{fontFamily:F.display,fontWeight:700,fontSize:22,
          letterSpacing:"-0.02em",color:C.ink,marginBottom:4}}>
          {courseComplete?"Course Complete!":"Module "+module.n+" Complete"}
        </div>
        <div style={{fontFamily:F.display,fontSize:14,color:C.inkMute,marginBottom:22}}>
          {courseComplete?"All 12 modules · 74 lessons · 24 CEU hours":module.label}
        </div>

        <div style={{background:C.creamWarm,borderRadius:10,padding:"14px 16px",marginBottom:22,textAlign:"left"}}>
          <p style={{fontFamily:F.body,fontSize:12.5,color:C.inkSoft,lineHeight:1.65,margin:"0 0 10px",fontStyle:"italic"}}>
            "{shareBody}"
          </p>
          <p style={{fontFamily:F.mono,fontSize:9.5,color:C.inkMute,lineHeight:1.7,margin:0,letterSpacing:"0.01em"}}>
            {hashtags}
          </p>
        </div>

        <div style={mono({fontSize:9,letterSpacing:"0.22em",textTransform:"uppercase",color:C.inkMute,marginBottom:12})}>
          Share your achievement:
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:22}}>
          <ShareBtn icon="in" label="LinkedIn"
            hoverBg="#0077B5" hoverColor="#fff" defaultColor="#0077B5"
            onClick={()=>window.open(
              `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://lightingmasterlc.com')}`,
              '_blank'
            )}/>
          <ShareBtn icon="𝕏" label="X / Twitter"
            hoverBg="#000" hoverColor="#fff"
            onClick={()=>window.open(twitterUrl,"_blank","width=600,height=400")}/>
          <ShareBtn icon="f" label="Facebook"
            hoverBg="#1877F2" hoverColor="#fff" defaultColor="#1877F2"
            onClick={()=>window.open(
              `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://lightingmasterlc.com')}`,
              '_blank'
            )}/>
          <ShareBtn icon="⧉" label={copied?"✓ Copied!":"Copy message"}
            hoverBg="#2d4a3e" hoverColor="#fff"
            onClick={()=>{
              navigator.clipboard.writeText(shareText)
                .then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2500)})
            }}/>
        </div>

        <div style={{ display:'flex', flexDirection:'column', marginTop:8, width:'100%' }}>
          {nextLesson && (
            <button
              onClick={() => {
                onClose()
                setTimeout(() => {
                  window.scrollTo({ top: 0, behavior: 'instant' })
                  onNextLesson()
                }, 80)
              }}
              style={{
                width:'100%', fontFamily:F.display, fontWeight:700, fontSize:14,
                background:C.accent, color:'#fff', border:'none', borderRadius:99,
                padding:'13px 24px', cursor:'pointer', marginBottom:10,
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              }}
            >
              Continue → {nextLesson?.title || 'Next lesson'}
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              width:'100%', fontFamily:F.display, fontWeight:600, fontSize:13,
              background:'transparent', color:C.inkMute,
              border:`1px solid ${C.rule}`, borderRadius:99,
              padding:'11px 24px', cursor:'pointer',
            }}
          >
            ← Back to dashboard
          </button>
        </div>
      </div>
    </div>
  )
}

const LC_MEDIA = {
  "1.1":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780595398/101.png",
  "1.2":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780865748/102_nnsmym.png",
  "1.3":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780595958/103_ckaelp.png",
  "1.4":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780595956/104_qkcg5v.png",
  "1.5":  [
    "https://res.cloudinary.com/dreuglb2j/image/upload/v1780595957/105_pxh0ew.png",
    "https://res.cloudinary.com/dreuglb2j/image/upload/v1780867246/10505_ii1zw9.png"
  ],
  "1.6":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780595957/106_kzy9sm.png",
  "2.1":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780595964/201_qtqfiq.png",
  "2.2":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780595963/202_u1phtz.png",
  "2.3":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780595963/203_n3ypvk.png",
  "2.4":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780595963/204_id0evl.png",
  "2.5":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1781018493/205_ptityg.png",
  "2.6":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780595960/206_ccksyg.png",
  "3.1":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780595832/301_z5fxzi.png",
  "3.2":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780595832/302_s9m4nq.png",
  "3.3":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780595833/303_m8aqlh.png",
  "3.4":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780595833/304_zyyr3m.png",
  "3.5":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780595834/305_ywfaou.png",
  "3.6":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780597575/306_p23les.png",
  "3.7":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780939467/307_qiejmz.png",
  "3.8":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1781029915/308_yy3v3a.png",
  "4.1":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780597574/401_of5hag.png",
  "4.2":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780597584/402_nx9tmw.png",
  "4.3":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1781033022/403_luyv6i.png",
  "4.4":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780944535/404_kcn7nn.png",
  "4.5":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780597798/405_pj6afz.png",
  "4.6":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780597874/406_qghh3n.png",
  "5.1":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780598824/501_zzup79.png",
  "5.2":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780608668/502_tcnay8.png",
  "5.3":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780599772/503_qd5pm9.png",
  "5.4":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780599778/504_i7pm8p.png",
  "5.5":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780599770/505_r15ucf.png",
  "5.6":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780599861/506_hnvvt5.png",
  "6.1":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1781021781/601_f1xsh2.png",
  "6.2":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1781029257/602_jelq8f.png",
  "6.3":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780602461/603_l1u5wi.png",
  "6.4":  [
    "https://res.cloudinary.com/dreuglb2j/image/upload/v1781543236/6044_i8ztop.png",
    "https://res.cloudinary.com/dreuglb2j/image/upload/v1780602462/604_eczkfc.png",
  ],
  "6.5":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780602461/605_m4ytj1.png",
  "6.6":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780602461/606_tqrbgk.png",
  "7.1": [
    "https://res.cloudinary.com/dreuglb2j/image/upload/v1781024629/701_zem9xw.png",
    "https://res.cloudinary.com/dreuglb2j/image/upload/v1781024491/outdoor_dist_types_ncefm1.png",
  ],
  "7.2":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780608819/702_h9ziic.png",
  "7.3":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780602641/703_ttdgrh.png",
  "7.4":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780602960/704_g1hche.png",
  "7.5":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780602960/705_pbwfnh.png",
  "7.6":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780602994/706_y0qsir.png",
  "8.1":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1781549316/801_tboquu.png",
  "8.2":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1781549688/802_bgis5f.png",
  "8.3":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1781551560/803_mm3hn1.png",
  "8.4":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780604441/804_cbagw6.png",
  "8.5":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780604561/805_vk5nxv.png",
  "8.6":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1781552021/806_k4psbw.png",
  "9.1":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780604856/901_oprict.png",
  "9.2":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780604929/902_bqpwpj.png",
  "9.3":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1781553101/903_v3sogl.png",
  "9.4":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1781553679/904_ixhiva.png",
  "9.5":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1781554633/905_volgds.png",
  "9.6":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780605588/906_gdeqdm.png",
  "10.1": "https://res.cloudinary.com/dreuglb2j/image/upload/v1780606383/1001_m5d6ga.png",
  "10.2": "https://res.cloudinary.com/dreuglb2j/image/upload/v1780606383/1002_rturwc.png",
  "10.3": "https://res.cloudinary.com/dreuglb2j/image/upload/v1780606491/1003_ad645t.png",
  "10.4": "https://res.cloudinary.com/dreuglb2j/image/upload/v1780606608/1004_lqosmb.png",
  "10.5": "https://res.cloudinary.com/dreuglb2j/image/upload/v1780606702/1005_rkarl6.png",
  "10.6": "https://res.cloudinary.com/dreuglb2j/image/upload/v1780606825/1006_eavxmy.png",
  "11.1": "https://res.cloudinary.com/dreuglb2j/image/upload/v1780606942/1101_u1hr5g.png",
  "11.2": "https://res.cloudinary.com/dreuglb2j/image/upload/v1780607162/1102_bfcewp.png",
  "11.3": "https://res.cloudinary.com/dreuglb2j/image/upload/v1780608895/1103_tf2vc5.png",
  "11.4": "https://res.cloudinary.com/dreuglb2j/image/upload/v1780607586/1104_x6bkub.png",
  "11.5": "https://res.cloudinary.com/dreuglb2j/image/upload/v1780607589/1105_bcyxkf.png",
  "11.6": "https://res.cloudinary.com/dreuglb2j/image/upload/v1780608947/1106_s2tpgx.png",
  "12.1": "https://res.cloudinary.com/dreuglb2j/image/upload/v1780607751/1201_ehwxpt.png",
  "12.2": "https://res.cloudinary.com/dreuglb2j/image/upload/v1780607941/1202_cnyw0n.png",
  "12.3": "https://res.cloudinary.com/dreuglb2j/image/upload/v1780608048/1203_hzn7m0.png",
  "12.4": "https://res.cloudinary.com/dreuglb2j/image/upload/v1780608180/1204_egoj28.png",
  "12.5": "https://res.cloudinary.com/dreuglb2j/image/upload/v1780608185/1205_oomzgc.png",
  "12.6": "https://res.cloudinary.com/dreuglb2j/image/upload/v1780608220/1206_ohv3bl.png",
}

const LC_AUDIO = {
  "1.1": "https://res.cloudinary.com/dreuglb2j/video/upload/v1781457100/Lesson_101_c7gmt2.mp4",
  "1.2": "https://res.cloudinary.com/dreuglb2j/video/upload/v1780937194/Lesson_102_lrftbl.mp4",
  "1.3": "https://res.cloudinary.com/dreuglb2j/video/upload/v1780937199/Lesson_103_nccty5.mp4",
  "1.4": "https://res.cloudinary.com/dreuglb2j/video/upload/v1780937207/Lesson_104_azebuk.mp4",
  "1.5": "https://res.cloudinary.com/dreuglb2j/video/upload/v1780938829/Lesson_105_ocp78s.mp4",
  "1.6": "https://res.cloudinary.com/dreuglb2j/video/upload/v1780938836/Lesson_106_athpck.mp4",
  "2.1": "https://res.cloudinary.com/dreuglb2j/video/upload/v1780938833/Lesson_201_tjdswg.mp4",
  "2.2": "https://res.cloudinary.com/dreuglb2j/video/upload/v1780938861/Lesson_202_li9jyz.mp4",
  "2.3": "https://res.cloudinary.com/dreuglb2j/video/upload/v1780938826/Lesson_203_gsjlaf.mp4",
  "2.4": "https://res.cloudinary.com/dreuglb2j/video/upload/v1780938860/Lesson_204_zxrzv1.mp4",
  "2.5": "https://res.cloudinary.com/dreuglb2j/video/upload/v1781031981/Lesson_205_vd2jnj.mp4",
  "2.6": "https://res.cloudinary.com/dreuglb2j/video/upload/v1780938823/Lesson_206_ndzt7y.mp4",
  "3.1": "https://res.cloudinary.com/dreuglb2j/video/upload/v1780938820/Lesson_301_rdq7it.mp4",
  "3.2": "https://res.cloudinary.com/dreuglb2j/video/upload/v1780938813/Lesson_302_fquagf.mp4",
  "3.3": "https://res.cloudinary.com/dreuglb2j/video/upload/v1780938817/Lesson_303_ry7ugc.mp4",
  "3.4": "https://res.cloudinary.com/dreuglb2j/video/upload/v1781454319/Lesson_304_zoerm5.mp4",
  "3.5": "https://res.cloudinary.com/dreuglb2j/video/upload/v1781031998/Lesson_305_uzsu4r.mp4",
  "3.6": "https://res.cloudinary.com/dreuglb2j/video/upload/v1780938848/Lesson_306_phymdl.mp4",
  "3.7": "https://res.cloudinary.com/dreuglb2j/video/upload/v1781535245/Lesson_307_lazmvu.mp4",
  "3.8": "https://res.cloudinary.com/dreuglb2j/video/upload/v1781535390/Lesson_308_sgyu08.mp4",
  "4.1": "https://res.cloudinary.com/dreuglb2j/video/upload/v1780938865/Lesson_401_dloyip.mp4",
  "4.2": "https://res.cloudinary.com/dreuglb2j/video/upload/v1780938812/Lesson_402_bouves.mp4",
  "4.3": "https://res.cloudinary.com/dreuglb2j/video/upload/v1781454336/Lesson_403_ur6w49.mp4",
  "4.4": "https://res.cloudinary.com/dreuglb2j/video/upload/v1780938863/Lesson_404_zbtrb3.mp4",
  "4.5": "https://res.cloudinary.com/dreuglb2j/video/upload/v1781457090/Lesson_405_utrdl9.mp4",
  "4.6": "https://res.cloudinary.com/dreuglb2j/video/upload/v1781453880/Lesson_406_rcde7y.mp4",
  "5.1": "https://res.cloudinary.com/dreuglb2j/video/upload/v1781453890/Lesson_501_fwylst.mp4",
  "5.2": "https://res.cloudinary.com/dreuglb2j/video/upload/v1780938844/Lesson_502_haejrn.mp4",
  "5.3": "https://res.cloudinary.com/dreuglb2j/video/upload/v1781453901/Lesson_503_mbsuxq.mp4",
  "5.4": "https://res.cloudinary.com/dreuglb2j/video/upload/v1781453900/Lesson_504_mub9yp.mp4",
  "5.5": "https://res.cloudinary.com/dreuglb2j/video/upload/v1781453900/Lesson_505_qmpfoi.mp4",
  "5.6": "https://res.cloudinary.com/dreuglb2j/video/upload/v1781453899/Lesson_506_k34vbn.mp4",
  "6.1": "https://res.cloudinary.com/dreuglb2j/video/upload/v1781031990/Lesson_601_wb63d7.mp4",
  "6.2": "https://res.cloudinary.com/dreuglb2j/video/upload/v1781031999/Lesson_602_j99nu1.mp4",
  "6.3": "https://res.cloudinary.com/dreuglb2j/video/upload/v1781458176/Lesson_603_w81mvt.mp4",
  "6.4": "https://res.cloudinary.com/dreuglb2j/video/upload/v1781032000/Lesson_604_wmnpqg.mp4",
  "6.5": "https://res.cloudinary.com/dreuglb2j/video/upload/v1781454486/Lesson_605_vcrqnq.mp4",
  "6.6": "https://res.cloudinary.com/dreuglb2j/video/upload/v1781454505/Lesson_606_sy1opg.mp4",
  "7.1": "https://res.cloudinary.com/dreuglb2j/video/upload/v1781031996/Lesson_701_d5wmgb.mp4",
  "7.2": "https://res.cloudinary.com/dreuglb2j/video/upload/v1781454042/Lesson_702_oykxvc.mp4",
  "7.3": "https://res.cloudinary.com/dreuglb2j/video/upload/v1781454021/Lesson_703_qroawy.mp4",
  "7.4": "https://res.cloudinary.com/dreuglb2j/video/upload/v1781454016/Lesson_704_wtq0cq.mp4",
  "7.5": "https://res.cloudinary.com/dreuglb2j/video/upload/v1781457085/Lesson_705_apofiu.mp4",
  "7.6": "https://res.cloudinary.com/dreuglb2j/video/upload/v1781454014/Lesson_706_gbbzyt.mp4",
  "8.1": "https://res.cloudinary.com/dreuglb2j/video/upload/v1781549864/Lesson_801_ijwf0a.mp4",
  "8.2": "https://res.cloudinary.com/dreuglb2j/video/upload/v1781552880/Lesson_802_t0huuz.mp4",
  "8.3": "https://res.cloudinary.com/dreuglb2j/video/upload/v1781552974/Lesson_803_iegddc.mp4",
  "8.4": "https://res.cloudinary.com/dreuglb2j/video/upload/v1781454034/Lesson_804_xibsou.mp4",
  "8.5": "https://res.cloudinary.com/dreuglb2j/video/upload/v1781454034/Lesson_805_v9eup2.mp4",
  "8.6": "https://res.cloudinary.com/dreuglb2j/video/upload/v1781454033/Lesson_806_lxkskd.mp4",
  "9.1": "https://res.cloudinary.com/dreuglb2j/video/upload/v1781454031/Lesson_901_fyquhi.mp4",
  "9.2": "https://res.cloudinary.com/dreuglb2j/video/upload/v1781454013/Lesson_902_kopi0p.mp4",
  "9.3": "https://res.cloudinary.com/dreuglb2j/video/upload/v1781553394/Lesson_903_rcmxus.mp4",
  "9.4": "https://res.cloudinary.com/dreuglb2j/video/upload/v1781553970/Lesson_904_aa2h3v.mp4",
  "9.5": "https://res.cloudinary.com/dreuglb2j/video/upload/v1781454013/Lesson_905_lmalop.mp4",
  "9.6": "https://res.cloudinary.com/dreuglb2j/video/upload/v1781454041/Lesson_906_kmiizv.mp4",
  "10.1": "https://res.cloudinary.com/dreuglb2j/video/upload/v1781454009/Lesson_1001_i0kz4j.mp4",
  "10.2": "https://res.cloudinary.com/dreuglb2j/video/upload/v1781454069/Lesson_1002_clcl0z.mp4",
  "10.3": "https://res.cloudinary.com/dreuglb2j/video/upload/v1781454088/Lesson_1003_jhjnyx.mp4",
  "10.4": "https://res.cloudinary.com/dreuglb2j/video/upload/v1781454006/Lesson_1004_jcmpnx.mp4",
  "10.5": "https://res.cloudinary.com/dreuglb2j/video/upload/v1781454082/Lesson_1005_tp9nmu.mp4",
  "10.6": "https://res.cloudinary.com/dreuglb2j/video/upload/v1781454067/Lesson_1006_rdl2e3.mp4",
  "11.1": "https://res.cloudinary.com/dreuglb2j/video/upload/v1781454094/Lesson_1101_py43uu.mp4",
  "11.2": "https://res.cloudinary.com/dreuglb2j/video/upload/v1781454087/Lesson_1102_uzbqkl.mp4",
  "11.3": "https://res.cloudinary.com/dreuglb2j/video/upload/v1781454025/Lesson_1103_husjbg.mp4",
  "11.4": "https://res.cloudinary.com/dreuglb2j/video/upload/v1781454002/Lesson_1104_liiiyj.mp4",
  "11.5": "https://res.cloudinary.com/dreuglb2j/video/upload/v1781454055/Lesson_1105_fj0dxr.mp4",
  "11.6": "https://res.cloudinary.com/dreuglb2j/video/upload/v1781458179/Lesson_1106_yar9gn.mp4",
  "12.1": "https://res.cloudinary.com/dreuglb2j/video/upload/v1781454093/Lesson_1201_tmghvu.mp4",
  "12.2": "https://res.cloudinary.com/dreuglb2j/video/upload/v1781454006/Lesson_1202_vjxdoa.mp4",
  "12.3": "https://res.cloudinary.com/dreuglb2j/video/upload/v1781453999/Lesson_1203_j03hbs.mp4",
  "12.4": "https://res.cloudinary.com/dreuglb2j/video/upload/v1781454096/Lesson_1204_wa7bur.mp4",
  "12.5": "https://res.cloudinary.com/dreuglb2j/video/upload/v1781454092/Lesson_1205_nbtvli.mp4",
  "12.6": "https://res.cloudinary.com/dreuglb2j/video/upload/v1781454000/Lesson_1206_cq18hj.mp4",
}

function UpgradePrompt({onUpgrade, setRoute}){
  return(
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh",padding:"40px 36px"}}>
      <div style={{textAlign:"center",maxWidth:420}}>
        <div style={{fontSize:48,marginBottom:20}}>🔒</div>
        <h2 style={d({fontWeight:700,fontSize:24,letterSpacing:"-0.02em",color:C.ink,margin:"0 0 10px"})}>This lesson requires a paid plan</h2>
        <p style={{fontFamily:F.body,fontSize:14,color:C.inkMute,margin:"0 0 28px",lineHeight:1.6}}>Unlock all 12 modules and 74 lessons</p>
        <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
          <button onClick={onUpgrade} style={{fontFamily:F.display,fontWeight:700,fontSize:14,background:C.accent,color:"#fff",border:"none",borderRadius:99,padding:"13px 28px",cursor:"pointer"}}>View plans →</button>
          <button onClick={()=>setRoute("home")} style={{fontFamily:F.display,fontWeight:600,fontSize:14,background:"none",color:C.inkSoft,border:`1px solid ${C.ruleStrong}`,borderRadius:99,padding:"13px 28px",cursor:"pointer"}}>← Back to modules</button>
        </div>
      </div>
    </div>
  )
}

function PodcastPlayer({url,lessonRef}){
  const audioRef=useRef(null)
  const [playing,setPlaying]=useState(false)
  const [progress,setProgress]=useState(0)
  const [duration,setDuration]=useState(0)
  const [currentTime,setCurrentTime]=useState(0)
  const [speed,setSpeed]=useState(1)

  useEffect(()=>{
    if(audioRef.current){audioRef.current.pause();audioRef.current.currentTime=0}
    setPlaying(false);setProgress(0);setCurrentTime(0);setDuration(0)
  },[url])

  useEffect(()=>{
    return()=>{if(audioRef.current)audioRef.current.pause()}
  },[])

  function togglePlay(){
    if(!audioRef.current)return
    if(playing){audioRef.current.pause()}else{audioRef.current.play()}
    setPlaying(!playing)
  }
  function handleTimeUpdate(){
    if(!audioRef.current)return
    const ct=audioRef.current.currentTime
    const dur=audioRef.current.duration||1
    setCurrentTime(ct)
    setProgress((ct/dur)*100)
  }
  function handleLoadedMetadata(){if(audioRef.current)setDuration(audioRef.current.duration)}
  function handleEnded(){setPlaying(false);setProgress(0)}
  function handleSeek(e){
    if(!audioRef.current)return
    const rect=e.currentTarget.getBoundingClientRect()
    const pct=(e.clientX-rect.left)/rect.width
    audioRef.current.currentTime=pct*audioRef.current.duration
  }
  function cycleSpeed(){
    const speeds=[0.75,1,1.25,1.5,2]
    const next=speeds[(speeds.indexOf(speed)+1)%speeds.length]
    setSpeed(next)
    if(audioRef.current)audioRef.current.playbackRate=next
  }
  function formatTime(s){
    if(!s||isNaN(s))return'0:00'
    const m=Math.floor(s/60)
    const sec=Math.floor(s%60)
    return`${m}:${sec.toString().padStart(2,'0')}`
  }

  return(
    <div style={{background:`linear-gradient(135deg,${C.ink} 0%,#1A2E28 100%)`,borderRadius:12,padding:'20px 24px',border:`1px solid rgba(198,90,58,0.3)`,boxShadow:'0 4px 24px rgba(47,74,63,0.15)'}}>
      <audio key={url} ref={audioRef} src={url} onTimeUpdate={handleTimeUpdate} onLoadedMetadata={handleLoadedMetadata} onEnded={handleEnded} preload="metadata"/>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
        <div style={{background:C.accent,borderRadius:99,padding:'3px 10px',display:'flex',alignItems:'center',gap:5}}>
          <span style={{fontSize:9}}>🎙</span>
          <span style={{fontFamily:F.mono,fontSize:9,fontWeight:600,letterSpacing:'0.14em',textTransform:'uppercase',color:'#fff'}}>Lesson Podcast</span>
        </div>
        <span style={{fontFamily:F.display,fontSize:12,color:'rgba(253,250,246,0.5)'}}>Professional audio · Lesson {lessonRef}</span>
      </div>
      <div onClick={handleSeek} style={{width:'100%',height:4,background:'rgba(255,255,255,0.12)',borderRadius:99,marginBottom:16,cursor:'pointer',position:'relative'}}>
        <div style={{width:`${progress}%`,height:'100%',background:C.accent,borderRadius:99,transition:'width 0.1s linear'}}/>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:16}}>
        <button onClick={togglePlay} style={{width:44,height:44,borderRadius:'50%',background:C.accent,border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,color:'#fff',flexShrink:0,boxShadow:'0 2px 12px rgba(198,90,58,0.4)',transition:'transform 100ms'}}
          onMouseEnter={e=>e.currentTarget.style.transform='scale(1.08)'} onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}>
          {playing?'⏸':'▶'}
        </button>
        <span style={{fontFamily:F.mono,fontSize:11,color:'rgba(253,250,246,0.6)',minWidth:80}}>{formatTime(currentTime)} / {formatTime(duration)}</span>
        <button onClick={cycleSpeed} style={{background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:6,padding:'4px 10px',cursor:'pointer',fontFamily:F.mono,fontSize:11,fontWeight:600,color:speed!==1?C.accent:'rgba(253,250,246,0.7)',letterSpacing:'0.04em'}}>{speed}×</button>
        <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:2,opacity:playing?1:0.3,transition:'opacity 300ms'}}>
          {[3,5,8,6,10,7,4,9,5,6,8,4].map((h,i)=>(
            <div key={i} style={{width:2,height:h,background:C.accent,borderRadius:99,animation:playing?`wave ${0.4+i*0.07}s ease-in-out infinite alternate`:'none'}}/>
          ))}
        </div>
      </div>
    </div>
  )
}

function TtsPlayer({lessonRef,ttsText=''}){
  const voiceName=typeof _voices!=='undefined'&&_voices.length?(_voices[_voiceIdx]?.name?.split(' ').slice(0,2).join(' ')||'Default'):'Default'
  return(
    <div style={{display:"flex",alignItems:"center",gap:10,border:`1px solid ${C.rule}`,borderRadius:6,padding:"10px 14px",background:C.paper}}>
      <span id="_lesson_ref" data-ref={lessonRef} data-tts={ttsText} style={{display:"none"}}/>
      <button id="_ttsbtn" onClick={()=>window._toggleTTS()} style={{width:34,height:34,borderRadius:"50%",border:"none",background:C.accent,color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"opacity 140ms"}}
        onMouseEnter={e=>e.currentTarget.style.opacity=".82"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
        <svg viewBox="0 0 24 24" style={{width:14,height:14,fill:"currentColor"}}><path d="M8 5v14l11-7z"/></svg>
      </button>
      <div style={{flex:1,minWidth:0}}>
        <div id="_ttsst" style={mono({fontSize:9,color:C.inkMute,marginTop:2})}>Click to listen</div>
      </div>
      <div style={{width:120,height:3,background:C.rule,borderRadius:99,overflow:"hidden",flexShrink:0}}>
        <div id="_pfill" style={{height:"100%",background:C.accent,width:"0%",borderRadius:99,transition:"width .4s linear"}}/>
      </div>
      <button id="_pspd" onClick={()=>window._cycleSpeed()} style={mono({fontSize:10,color:C.inkMute,padding:"3px 8px",borderRadius:99,border:`1px solid ${C.rule}`,background:"none",cursor:"pointer",minWidth:34,textAlign:"center"})}>{_speeds[_spdIdx]}×</button>
      <button id="_pvc" onClick={()=>window._cycleVoice()} style={mono({fontSize:9,color:C.inkMute,padding:"3px 8px",borderRadius:99,border:`1px solid ${C.rule}`,background:"none",cursor:"pointer",maxWidth:90,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"})}>{voiceName}</button>
    </div>
  )
}

// Run once in Supabase SQL Editor:
// CREATE TABLE IF NOT EXISTS public.notes (
//   id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
//   user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
//   lesson_ref text NOT NULL,
//   body text NOT NULL DEFAULT '',
//   updated_at timestamptz DEFAULT now(),
//   UNIQUE(user_id, lesson_ref)
// );
// ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
// CREATE POLICY "Users manage own notes" ON public.notes FOR ALL USING (auth.uid() = user_id);

function LessonNote({lessonRef, user}){
  const [text,setText]=useState("")
  const [status,setStatus]=useState("idle")
  const timerRef=useRef(null)
  const textRef=useRef("")
  const loaded=useRef(false)

  useEffect(()=>{
    if(!user) return
    setText(""); textRef.current=""; loaded.current=false
    supabase.from("notes").select("body").eq("user_id",user.id).eq("lesson_ref",lessonRef).single()
      .then(({data})=>{
        if(data?.body){setText(data.body);textRef.current=data.body}
        loaded.current=true
      })
    return()=>clearTimeout(timerRef.current)
  },[lessonRef,user?.id])

  async function doSave(){
    if(!user||!loaded.current) return
    setStatus("saving")
    await supabase.from("notes").upsert(
      {user_id:user.id,lesson_ref:lessonRef,body:textRef.current,updated_at:new Date().toISOString()},
      {onConflict:"user_id,lesson_ref"}
    )
    setStatus("saved")
    setTimeout(()=>setStatus("idle"),2000)
  }

  function handleChange(e){
    const val=e.target.value
    setText(val); textRef.current=val; setStatus("idle")
    clearTimeout(timerRef.current)
    timerRef.current=setTimeout(doSave,1200)
  }

  if(!user) return null
  return(
    <div style={{background:C.paper,border:`1px solid ${C.rule}`,borderRadius:6,padding:"20px 24px",marginBottom:18}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <div style={{fontFamily:F.display,fontSize:13,fontWeight:700,color:C.ink,letterSpacing:"0.06em",textTransform:"uppercase"}}>My notes</div>
        {status==="saving"&&<span style={mono({fontSize:9,color:C.inkMute})}>Saving…</span>}
        {status==="saved"&&<span style={mono({fontSize:9,color:C.forest})}>✓ Saved</span>}
      </div>
      <textarea value={text} onChange={handleChange} placeholder="Write your notes for this lesson — key concepts, things to remember, your own examples…" rows={4}
        style={{width:"100%",boxSizing:"border-box",fontFamily:F.body,fontSize:14,lineHeight:1.7,color:C.ink,background:C.creamWarm,border:`1px solid ${C.rule}`,borderRadius:4,padding:"12px 14px",outline:"none",resize:"vertical",minHeight:96}}
        onFocus={e=>e.target.style.borderColor=C.accent}
        onBlur={e=>{e.target.style.borderColor=C.rule;clearTimeout(timerRef.current);if(loaded.current)doSave()}}
      />
    </div>
  )
}

function LessonPage({lessonRef,setRoute,user,setShowUpgrade,completedLessons=new Set(),markLessonComplete=async()=>{},bookmarks=new Set(),toggleBookmark=async()=>{},isMobile=false}) {
  const [showShareModal,setShowShareModal]=useState(false)
  const [imgFullscreen,setImgFullscreen]=useState(null)
  const [lessonContent,setLessonContent]=useState(null)
  const [contentLoading,setContentLoading]=useState(true)
  useEffect(()=>{ window.scrollTo({top:0,behavior:'instant'}) },[lessonRef])
  useEffect(()=>{
    if(imgFullscreen===null)return
    const handler=(e)=>{if(e.key==='Escape')setImgFullscreen(false)}
    window.addEventListener('keydown',handler)
    return()=>window.removeEventListener('keydown',handler)
  },[imgFullscreen])
  useEffect(()=>{
    setContentLoading(true)
    setLessonContent(null)
    fetch(`/api/lesson/${encodeURIComponent(lessonRef)}`,{credentials:'same-origin'})
      .then(r=>r.ok?r.json():null)
      .then(d=>{setLessonContent(d);setContentLoading(false)})
      .catch(()=>setContentLoading(false))
  },[lessonRef])
  const lesson = ALL_LESSONS.find(l=>l.ref===lessonRef)
  const module = MODULES.find(m=>m.n===lesson?.module)
  if (!lesson||!module) return <div style={{padding:"40px 36px",color:C.inkMute}}>Lesson not found.</div>
  if (isLessonLocked(lessonRef, user)) return <UpgradePrompt onUpgrade={()=>setShowUpgrade(true)} setRoute={setRoute}/>
  const idx = module.lessons.findIndex(l=>l.ref===lessonRef)
  const prev = module.lessons[idx-1]
  const next = module.lessons[idx+1]
  const courseComplete = !next && module.n==="12"
  const crossModuleIdx = ALL_LESSONS.findIndex(l=>l.ref===lessonRef)
  const crossModuleNext = ALL_LESSONS[crossModuleIdx+1] || null
  const prevLesson = crossModuleIdx > 0 ? ALL_LESSONS[crossModuleIdx - 1] : null
  const nextLesson = crossModuleNext
  const content = lessonContent
  const visual = lessonContent?.visual
  const isBookmarked = bookmarks.has(lessonRef)

  return (
    <div style={{padding:isMobile?"0 16px 32px":"0 36px 48px"}}>
      <PageHead eyebrow={`Module ${module.n} · ${module.label}`} title={`Lesson ${lesson.ref} —`} em={lesson.title+"."}/>
      <div style={{display:"flex",gap:8,alignItems:"center",marginTop:14,marginBottom:18,flexWrap:"wrap"}}>
        <Tag label={lesson.tag}/>
        <span style={mono({fontSize:9,letterSpacing:"0.12em",textTransform:"uppercase",color:C.inkMute})}>{module.ceu} CEU hrs</span>
        {lesson.done&&<span style={mono({fontSize:9,letterSpacing:"0.12em",textTransform:"uppercase",color:C.forest})}>✓ Complete</span>}
        {lesson.active&&<span style={mono({fontSize:9,letterSpacing:"0.12em",textTransform:"uppercase",color:C.accent})}>▶ In progress</span>}
        <button
          onClick={()=>toggleBookmark(lessonRef)}
          title={isBookmarked?'Remove bookmark':'Bookmark this lesson'}
          style={{background:isBookmarked?`color-mix(in srgb,${C.accent} 8%,transparent)`:'transparent',border:`1.5px solid ${isBookmarked?C.accent:C.rule}`,borderRadius:8,padding:'6px 12px',cursor:'pointer',display:'flex',alignItems:'center',gap:6,fontFamily:F.display,fontSize:12,fontWeight:600,color:isBookmarked?C.accent:C.inkMute,transition:'all 150ms',marginLeft:'auto'}}
          onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent}
          onMouseLeave={e=>e.currentTarget.style.borderColor=isBookmarked?C.accent:C.rule}
        ><span style={{fontSize:14}}>{isBookmarked?'★':'☆'}</span>{isBookmarked?'Bookmarked':'Bookmark'}</button>
      </div>

      {/* Audio Narration */}
      {(()=>{
        const podcastUrl=LC_AUDIO[lessonRef]
        return(
          <div style={{marginBottom:20}}>
            <div style={{fontFamily:F.display,fontSize:13,fontWeight:700,color:C.ink,letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:12}}>Audio Narration</div>
            {podcastUrl
              ?<PodcastPlayer url={podcastUrl} lessonRef={lessonRef}/>
              :<TtsPlayer lessonRef={lessonRef} ttsText={lessonContent?.tts||''}/>
            }
          </div>
        )
      })()}

      {/* Top prev/next buttons */}
      {(prevLesson||nextLesson)&&(
        <div style={{display:'flex',gap:10,marginTop:16,marginBottom:8}}>
          {prevLesson&&(
            <button
              onClick={()=>{window.scrollTo({top:0,behavior:'instant'});setRoute('lesson-'+prevLesson.ref)}}
              style={{flex:1,fontFamily:F.display,fontWeight:600,fontSize:13,background:'transparent',color:C.inkMute,border:`1px solid ${C.rule}`,borderRadius:99,padding:'11px 16px',cursor:'pointer',transition:'border-color 150ms, color 150ms',textAlign:'center'}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=C.ink;e.currentTarget.style.color=C.ink}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=C.rule;e.currentTarget.style.color=C.inkMute}}
            >← {prevLesson.title}</button>
          )}
          {nextLesson&&(
            <button
              onClick={()=>{markLessonComplete(lessonRef);window.scrollTo({top:0,behavior:'instant'});setRoute('lesson-'+nextLesson.ref)}}
              style={{flex:1,fontFamily:F.display,fontWeight:700,fontSize:13,background:C.accent,color:'#fff',border:'none',borderRadius:99,padding:'11px 16px',cursor:'pointer',transition:'background 150ms',textAlign:'center'}}
            >{nextLesson.title} →</button>
          )}
        </div>
      )}

      {/* Lesson image */}
      {LC_MEDIA[lessonRef]?(<>
        {(()=>{
          const imgs=Array.isArray(LC_MEDIA[lessonRef])?LC_MEDIA[lessonRef]:[LC_MEDIA[lessonRef]]
          return imgs.map((src,i)=>(
            <div key={i} style={{position:'relative',marginBottom:12}}>
              <img
                src={src}
                alt={`Lesson ${lessonRef} illustration ${i+1}`}
                style={{width:'100%',height:'auto',display:'block',objectFit:'contain',background:C.creamWarm,borderRadius:6}}
                onError={e=>{e.target.parentElement.style.display='none'}}
              />
              <button
                onClick={()=>setImgFullscreen(src)}
                title="View fullscreen"
                style={{position:'absolute',top:8,right:8,background:'rgba(47,74,63,0.7)',border:'none',borderRadius:6,padding:'6px 8px',cursor:'pointer',color:'#FAF5F0',fontSize:14,lineHeight:1,backdropFilter:'blur(4px)'}}
              >⛶</button>
            </div>
          ))
        })()}
      </>):(
        <div style={{border:`1.5px dashed ${C.rule}`,borderRadius:6,marginBottom:14,overflow:"hidden",background:C.creamWarm}}>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:200,gap:10,padding:"28px 24px"}}>
            <div style={{width:48,height:48,borderRadius:"50%",border:`1.5px dashed ${C.ruleStrong}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <svg viewBox="0 0 24 24" style={{width:22,height:22,fill:"none",stroke:C.inkMute,strokeWidth:1.5,strokeLinecap:"round",strokeLinejoin:"round"}}>
                <rect x="2" y="2" width="20" height="20" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/><path d="M14 8l3 3"/>
              </svg>
            </div>
            <div style={{textAlign:"center"}}>
              <div style={{fontFamily:F.display,fontSize:13,fontWeight:700,color:C.ink,letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:10}}>Photo or video</div>
              <div style={mono({fontSize:9,letterSpacing:"0.14em",textTransform:"uppercase",color:C.inkMute})}>Add media for lesson {lessonRef}</div>
            </div>
          </div>
        </div>
      )}

      {/* Visual */}
      {visual&&(
        <div style={{background:C.paper,border:`1px solid ${C.rule}`,borderRadius:6,padding:"16px 18px",marginBottom:14,overflow:"hidden"}}>
          <div style={{fontFamily:F.display,fontSize:13,fontWeight:700,color:C.ink,letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:10}}>Visual overview</div>
          <div dangerouslySetInnerHTML={{
            __html: typeof window !== 'undefined'
              ? require('dompurify').sanitize(visual, { USE_PROFILES: { svg: true, svgFilters: true } })
              : visual
          }}/>
        </div>
      )}

      {/* Content */}
      {contentLoading?(
        <div style={{background:C.paper,border:`1px solid ${C.rule}`,borderRadius:6,padding:"28px 32px",marginBottom:18}}>
          <div style={{fontFamily:F.mono,fontSize:12,color:C.inkMute}}>Loading lesson…</div>
        </div>
      ):content?(
        <>
          <div style={{background:C.paper,border:`1px solid ${C.rule}`,borderRadius:6,padding:"24px 28px",marginBottom:14}}>
            <div style={{fontFamily:F.display,fontSize:13,fontWeight:700,color:C.ink,letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:10}}>Lesson content</div>
            {content?.body?.length > 0 ? (
              content.body.map((para, i) => (
                <div key={i} style={{fontFamily:F.body,fontSize:14,lineHeight:1.8,color:C.ink,marginBottom:18}}
                  dangerouslySetInnerHTML={{__html:DOMPurify.sanitize(para)}}
                />
              ))
            ) : (
              <div style={{fontFamily:F.mono,fontSize:12,color:C.inkMute,padding:"20px 0"}}>
                Content coming soon for this lesson.
              </div>
            )}
          </div>
          {content.lp?.length > 0 && (
            <div style={{background:C.creamWarm,border:`1px solid ${C.rule}`,borderRadius:6,padding:"16px 20px",marginBottom:18}}>
              <div style={{fontFamily:F.display,fontSize:13,fontWeight:700,color:C.ink,letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:10}}>Key learning points</div>
              {content.lp.map((t,i)=>(
                <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"7px 0",borderBottom:i<content.lp.length-1?`1px solid ${C.rule}`:"none"}}>
                  <span style={{width:6,height:6,borderRadius:"50%",background:C.accent,flexShrink:0,marginTop:6}}/>
                  <span style={{fontFamily:F.display,fontSize:13,lineHeight:1.6,color:C.ink,fontWeight:600}}>{t}</span>
                </div>
              ))}
            </div>
          )}
        </>
      ):(
        <div style={{background:C.paper,border:`1px solid ${C.rule}`,borderRadius:6,padding:"28px 32px",marginBottom:18}}>
          <p style={{fontFamily:F.body,fontSize:14,lineHeight:1.7,color:C.inkSoft}}>Lesson <strong>{lesson.title}</strong> · Module {module.n}: {module.title}</p>
        </div>
      )}

      <LessonNote lessonRef={lessonRef} user={user}/>

      <div style={{display:'flex',gap:10,marginTop:8}}>
        {prevLesson&&(
          <button
            onClick={()=>{if(typeof _stopTTS!=='undefined')_stopTTS();window.scrollTo({top:0,behavior:'instant'});setRoute('lesson-'+prevLesson.ref)}}
            style={{flex:1,fontFamily:F.display,fontWeight:600,fontSize:13,background:'transparent',color:C.inkMute,border:`1px solid ${C.rule}`,borderRadius:99,padding:'11px 16px',cursor:'pointer',transition:'border-color 150ms, color 150ms',textAlign:'center'}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=C.ink;e.currentTarget.style.color=C.ink}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=C.rule;e.currentTarget.style.color=C.inkMute}}
          >← {prevLesson.title}</button>
        )}
        {nextLesson?(
          <button
            onClick={()=>{if(typeof _stopTTS!=='undefined')_stopTTS();markLessonComplete(lessonRef);window.scrollTo({top:0,behavior:'instant'});setRoute('lesson-'+nextLesson.ref)}}
            style={{flex:1,fontFamily:F.display,fontWeight:700,fontSize:13,background:C.accent,color:'#fff',border:'none',borderRadius:99,padding:'11px 16px',cursor:'pointer',transition:'background 150ms',textAlign:'center'}}
          >{nextLesson.title} →</button>
        ):(
          <button
            onClick={()=>{if(typeof _stopTTS!=='undefined')_stopTTS();markLessonComplete(lessonRef);setShowShareModal(true)}}
            style={{flex:1,fontFamily:F.display,fontWeight:700,fontSize:13,background:C.accent,color:'#fff',border:'none',borderRadius:99,padding:'11px 16px',cursor:'pointer',textAlign:'center'}}
          >Module complete 🎉</button>
        )}
      </div>

      {imgFullscreen!==null&&(
        <div onClick={()=>setImgFullscreen(null)} style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,0.95)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"zoom-out",padding:20}}>
          <img
            src={imgFullscreen}
            alt="Fullscreen"
            style={{maxWidth:"100%",maxHeight:"100vh",objectFit:"contain",borderRadius:8,boxShadow:"0 8px 48px rgba(0,0,0,0.8)"}}
            onClick={e=>e.stopPropagation()}
          />
          <button onClick={()=>setImgFullscreen(null)} style={{position:"fixed",top:20,right:20,background:"rgba(255,255,255,0.15)",border:"none",borderRadius:99,width:40,height:40,fontSize:20,color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(8px)"}}>✕</button>
          <div style={{position:"fixed",bottom:20,left:"50%",transform:"translateX(-50%)",color:"rgba(255,255,255,0.4)",fontSize:12,fontFamily:"monospace"}}>Click anywhere to close</div>
        </div>
      )}

      {showShareModal&&(
        <ModuleCompleteModal
          module={module}
          courseComplete={courseComplete}
          nextLesson={crossModuleNext}
          onNextLesson={() => {
            setShowShareModal(false)
            window.scrollTo({ top: 0, behavior: 'instant' })
            setRoute('lesson-' + crossModuleNext?.ref)
          }}
          onClose={() => {
            setShowShareModal(false)
            setRoute('home')
          }}
          setRoute={setRoute}
        />
      )}
    </div>
  )
}


/* ── CONTINUE PAGE ───────────────────────────────────────────── */
function ContinuePage({setRoute, completedLessons=new Set()}) {
  const nextLesson = getNextLesson(completedLessons)
  const curModule = nextLesson ? MODULES.find(m=>m.n===nextLesson.module) : null
  if(!nextLesson || !curModule) return(
    <div style={{padding:"40px 36px"}}>
      <PageHead eyebrow="My progress · Resume" title="Course" em="complete."/>
      <div style={{background:C.paper,border:`1px solid ${C.rule}`,borderRadius:6,padding:"32px",textAlign:"center",marginTop:28}}>
        <div style={{fontFamily:F.display,fontWeight:700,fontSize:24,color:C.forest,marginBottom:8}}>All lessons complete!</div>
        <p style={{fontFamily:F.body,fontSize:14,color:C.inkMute,lineHeight:1.6}}>You have finished all lessons. Head to the exam page to test your readiness.</p>
      </div>
    </div>
  )
  const doneLessons = curModule.lessons.filter(l=>completedLessons.has(l.ref)).length
  const totalLessons = curModule.lessons.length
  const progressBars = curModule.lessons.map(l=>completedLessons.has(l.ref)?1:l.ref===nextLesson.ref?0.5:0)
  return (
    <div style={{padding:"0 36px 48px"}}>
      <PageHead eyebrow="My progress · Resume" title="Resume" em={`Module ${parseInt(curModule.n)}.`}/>
      <div style={{background:C.ink,borderRadius:6,padding:"32px 36px",margin:"28px 0 0",cursor:"pointer"}} onClick={()=>{window.scrollTo({top:0,behavior:'smooth'});setRoute("lesson-"+nextLesson.ref)}}>
        <div style={mono({fontSize:9,letterSpacing:"0.24em",textTransform:"uppercase",color:C.tan,marginBottom:12})}>— pick up where you left off</div>
        <h2 style={{fontFamily:F.display,fontWeight:700,fontSize:26,letterSpacing:"-0.02em",lineHeight:1.1,margin:"0 0 12px",color:"#fff"}}>Module {curModule.n} · Lesson {nextLesson.ref} — <em style={{fontStyle:"normal",color:C.accent}}>{nextLesson.title}.</em></h2>
        <p style={{fontFamily:F.body,fontSize:14,lineHeight:1.6,color:"rgba(248,243,236,0.72)",margin:"0 0 20px",maxWidth:500}}>{doneLessons} of {totalLessons} lessons complete in this module.</p>
        <div style={{display:"flex",gap:3,maxWidth:380,marginBottom:20}}>
          {progressBars.map((v,i)=><span key={i} style={{flex:1,height:4,borderRadius:2,background:v===1?"rgba(248,243,236,0.85)":v===0.5?C.accent:"rgba(248,243,236,0.14)",boxShadow:v===0.5?`0 0 7px ${C.accent}`:"none"}}/>)}
        </div>
        <button style={{fontFamily:F.display,fontWeight:700,fontSize:14,background:C.accent,color:"#fff",border:"none",borderRadius:99,padding:"11px 22px",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:8}}>
          <span style={{width:7,height:7,borderRadius:"50%",background:"#fff",flexShrink:0}}/>Resume lesson →
        </button>
      </div>
      <div style={{margin:"24px 0 0"}}>
        <div style={mono({fontSize:9,letterSpacing:"0.22em",textTransform:"uppercase",color:C.inkMute,marginBottom:14})}>Module {parseInt(curModule.n)} lessons</div>
        <div style={{display:"grid",gap:1,background:C.rule,border:`1px solid ${C.rule}`,borderRadius:4,overflow:"hidden"}}>
          {curModule.lessons.map(l=>{
            const done=completedLessons.has(l.ref)
            const active=l.ref===nextLesson.ref
            return(
              <div key={l.ref} onClick={()=>{window.scrollTo({top:0,behavior:'smooth'});setRoute("lesson-"+l.ref)}} style={{display:"grid",gridTemplateColumns:"52px 1fr auto",gap:14,alignItems:"center",background:active?`color-mix(in srgb,${C.accent} 5%,${C.cream})`:C.cream,padding:"13px 18px",cursor:"pointer",transition:"background 140ms"}}
                onMouseEnter={e=>e.currentTarget.style.background=C.creamWarm}
                onMouseLeave={e=>e.currentTarget.style.background=active?`color-mix(in srgb,${C.accent} 5%,${C.cream})`:C.cream}>
                <span style={{fontFamily:F.display,fontWeight:700,fontSize:17,color:done?C.inkMute:active?C.accent:C.forest}}>{l.ref}</span>
                <span style={{fontFamily:F.display,fontWeight:600,fontSize:14,color:C.ink}}>{l.title}</span>
                <span style={mono({fontSize:9,letterSpacing:"0.14em",textTransform:"uppercase",color:done?C.forest:active?C.accent:C.inkMute,whiteSpace:"nowrap"})}>{done?"✓ Done":active?"▶ Active":"Open →"}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}


/* ── ACCOUNT PAGE ────────────────────────────────────────────── */
function AccountPage({ user, setUser, setRoute }) {
  const [tab,setTab] = useState("profile")
  const [form,setForm] = useState({
    name: user?.name || '',
    firm: user?.company || '',
    email: user?.email || '',
    role: user?.role || '',
    location: user?.state || '',
  })
  const [saved,setSaved] = useState(false)
  const [saving,setSaving] = useState(false)
  const [checkoutLoading,setCheckoutLoading] = useState(null)
  const [checkoutError,setCheckoutError] = useState(null)

  async function save() {
    setSaving(true)
    await supabase.auth.updateUser({ data: { name: form.name, company: form.firm, role: form.role, state: form.location } })
    if (setUser) setUser(prev => prev ? { ...prev, name: form.name, company: form.firm, state: form.location } : prev)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function startCheckout(plan) {
    setCheckoutLoading(plan)
    setCheckoutError(null)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (data.url) { window.location.href = data.url }
      else setCheckoutError(data.error || 'Could not start checkout. Please try again.')
    } catch {
      setCheckoutError('Could not connect. Please try again.')
    } finally {
      setCheckoutLoading(null)
    }
  }

  const PLAN_LABELS = { free: 'Free', t1: 'LC Preparation Test', t2: 'Full Course', t3: 'Full Course + Exam', team_admin: 'Team Plan', team_member: 'Team Plan' }
  const planKey = user?.plan || 'free'
  const planName = PLAN_LABELS[planKey] || 'Free'
  const isActiveStatus = user?.status === 'active'
  const isPaid = isActiveStatus && planKey !== 'free'

  const tabs = [["profile","Profile"],["billing","Billing"],["notifications","Notifications"]]
  return (
    <div style={{padding:"0 36px 48px"}}>
      <PageHead eyebrow="Account" title="Account &" em="billing."/>
      <div style={{display:"flex",gap:0,borderBottom:`1px solid ${C.rule}`,margin:"0 0 28px"}}>
        {tabs.map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{fontFamily:F.display,fontWeight:600,fontSize:14,color:tab===id?C.ink:C.inkMute,background:"none",border:"none",borderBottom:tab===id?`2px solid ${C.accent}`:"2px solid transparent",padding:"16px 20px 14px",cursor:"pointer",transition:"color 140ms"}}>{label}</button>
        ))}
      </div>

      {tab==="profile"&&(
        <div style={{maxWidth:560}}>
          <div style={{display:"grid",gap:20}}>
            {[{key:"name",label:"Display name"},{key:"firm",label:"Firm"},{key:"email",label:"Email",type:"email",readOnly:true},{key:"role",label:"Role"},{key:"location",label:"Location"}].map(({key,label,type="text",readOnly=false})=>(
              <div key={key}>
                <label style={{display:"block",fontFamily:F.mono,fontSize:9,letterSpacing:"0.18em",textTransform:"uppercase",color:C.inkMute,marginBottom:8}}>{label}</label>
                <input type={type} value={form[key]} readOnly={readOnly} onChange={e=>!readOnly&&setForm(f=>({...f,[key]:e.target.value}))}
                  style={{width:"100%",boxSizing:"border-box",padding:"12px 14px",fontFamily:F.display,fontSize:14,color:readOnly?C.inkMute:C.ink,background:readOnly?C.creamWarm:C.paper,border:`1px solid ${C.ruleStrong}`,borderRadius:4,outline:"none",cursor:readOnly?"default":"text"}}
                  onFocus={e=>{if(!readOnly)e.target.style.borderColor=C.accent}} onBlur={e=>e.target.style.borderColor=C.ruleStrong}/>
              </div>
            ))}
            <div>
              <label style={{display:"block",fontFamily:F.mono,fontSize:9,letterSpacing:"0.18em",textTransform:"uppercase",color:C.inkMute,marginBottom:8}}>New password</label>
              <input type="password" placeholder="At least 10 characters"
                style={{width:"100%",boxSizing:"border-box",padding:"12px 14px",fontFamily:F.display,fontSize:14,color:C.ink,background:C.paper,border:`1px solid ${C.ruleStrong}`,borderRadius:4,outline:"none"}}
                onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.ruleStrong}/>
            </div>
          </div>
          <button onClick={save} disabled={saving} style={{marginTop:24,fontFamily:F.display,fontWeight:700,fontSize:14,background:saved?C.forest:C.accent,color:"#fff",border:"none",borderRadius:99,padding:"12px 28px",cursor:"pointer",transition:"background 200ms",opacity:saving?0.7:1}}>
            {saved?"Saved ✓":saving?"Saving…":"Save changes"}
          </button>
        </div>
      )}

      {tab==="billing"&&(
        <div style={{maxWidth:640}}>
          <div style={{background:C.ink,borderRadius:6,padding:"28px 32px",marginBottom:24}}>
            <div style={mono({fontSize:9,letterSpacing:"0.22em",textTransform:"uppercase",color:C.tan,marginBottom:10})}>Current plan</div>
            <div style={{fontFamily:F.display,fontWeight:700,fontSize:24,color:"#fff",marginBottom:6}}>{planName}</div>
            <div style={mono({fontSize:10,letterSpacing:"0.14em",color:"rgba(249,244,237,0.5)",marginBottom:18})}>
              {isPaid ? `Active · ${user?.examAddon ? 'Includes practice exam' : 'Course access'}` : 'No active plan — upgrade to unlock all lessons'}
            </div>
            {checkoutError && <div style={{fontFamily:F.body,fontSize:13,color:"#f87171",marginBottom:12}}>{checkoutError}</div>}
            <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
              {planKey==="free"&&(
                <button onClick={()=>startCheckout('t2')} disabled={!!checkoutLoading} style={{fontFamily:F.display,fontWeight:600,fontSize:13,background:C.accent,color:"#fff",border:"none",borderRadius:99,padding:"10px 20px",cursor:"pointer",opacity:checkoutLoading?0.7:1}}>
                  {checkoutLoading==='t2'?'Opening…':'Get Full Course →'}
                </button>
              )}
              {planKey==="free"&&(
                <button onClick={()=>startCheckout('t3')} disabled={!!checkoutLoading} style={{fontFamily:F.display,fontWeight:600,fontSize:13,background:"none",color:"rgba(249,244,237,0.7)",border:`1px solid rgba(249,244,237,0.3)`,borderRadius:99,padding:"10px 20px",cursor:"pointer",opacity:checkoutLoading?0.7:1}}>
                  {checkoutLoading==='t3'?'Opening…':'Course + Exam ($595)'}
                </button>
              )}
              {planKey==="t2"&&!user?.examAddon&&(
                <button onClick={()=>startCheckout('t1')} disabled={!!checkoutLoading} style={{fontFamily:F.display,fontWeight:600,fontSize:13,background:C.accent,color:"#fff",border:"none",borderRadius:99,padding:"10px 20px",cursor:"pointer",opacity:checkoutLoading?0.7:1}}>
                  {checkoutLoading==='t1'?'Opening…':'Add Practice Exam ($250) →'}
                </button>
              )}
              {planKey==="t1"&&(
                <button onClick={()=>startCheckout('t2')} disabled={!!checkoutLoading} style={{fontFamily:F.display,fontWeight:600,fontSize:13,background:C.accent,color:"#fff",border:"none",borderRadius:99,padding:"10px 20px",cursor:"pointer",opacity:checkoutLoading?0.7:1}}>
                  {checkoutLoading==='t2'?'Opening…':'Upgrade to Full Course →'}
                </button>
              )}
            </div>
          </div>
          {isPaid&&(
            <div style={{background:C.paper,border:`1px solid ${C.rule}`,borderRadius:4,padding:"24px 28px"}}>
              <div style={mono({fontSize:9,letterSpacing:"0.18em",textTransform:"uppercase",color:C.inkMute,marginBottom:10})}>Questions about billing?</div>
              <div style={{fontFamily:F.body,fontSize:13,color:C.inkMute,lineHeight:1.6}}>
                Email <a href="mailto:admin@luxartmedia.com" style={{color:C.accent}}>admin@luxartmedia.com</a> for refunds, receipts, or plan changes.
              </div>
            </div>
          )}
        </div>
      )}

      {tab==="notifications"&&(
        <div style={{maxWidth:480}}>
          {[["Email me weekly progress summaries",true],["Notify when new modules are released",true],["Exam readiness reminders",true],["Marketing and product updates",false]].map(([label,checked],i)=>(
            <label key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 0",borderBottom:`1px solid ${C.rule}`,cursor:"pointer"}}>
              <span style={{fontFamily:F.display,fontSize:14,color:C.ink}}>{label}</span>
              <input type="checkbox" defaultChecked={checked} style={{accentColor:C.accent,width:16,height:16}}/>
            </label>
          ))}
        </div>
      )}

    </div>
  )
}



function useBeam(){const ref=useRef(null);const [b,setB]=useState({x:"50%",on:false});const onMove=useCallback(e=>{const r=ref.current?.getBoundingClientRect();if(!r)return;setB({x:((e.clientX-r.left)/r.width*100).toFixed(1)+"%",on:true})},[]);const onLeave=useCallback(()=>setB(b=>({...b,on:false})),[]);return{ref,beam:b,onMove,onLeave}}
function DarkCard({children,style,onClick}){const{ref,beam,onMove,onLeave}=useBeam();return(<div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} onClick={onClick} style={{background:C.ink,borderRadius:6,position:"relative",overflow:"hidden",...style}}><div style={{position:"absolute",inset:0,pointerEvents:"none",background:`conic-gradient(from -12deg at ${beam.x} -20%,transparent 0deg,rgba(255,255,255,0.09) 22deg,transparent 44deg)`,opacity:beam.on?1:0,transition:"opacity 280ms ease"}}/>{children}</div>)}
function LessonDots({lessons,hoveredIdx,setHoveredIdx}){return(<div style={{display:"flex",flexWrap:"wrap",gap:4}}>{lessons.map((l,i)=>(<div key={i} onMouseEnter={()=>setHoveredIdx(i)} onMouseLeave={()=>setHoveredIdx(null)} style={{width:9,height:9,borderRadius:"50%",cursor:"pointer",background:l.done?C.forest:l.active?C.accent:hoveredIdx===i?C.tan:C.rule,transition:"background 160ms,box-shadow 160ms",boxShadow:l.active?`0 0 0 3px rgba(198,90,58,0.28),0 0 8px rgba(198,90,58,0.55)`:l.done&&hoveredIdx===i?`0 0 0 3px rgba(126,155,134,0.3)`:"none",animation:l.active?"bulbPulse 2s ease-in-out infinite":"none"}}/>))}</div>)}

function ModuleRow({mod,oddCol,setRoute,completedLessons=new Set()}){
  const completedCount=mod.lessons.filter(l=>completedLessons.has(l.ref)).length
  const total=mod.lessons.length
  const pct=Math.round((completedCount/total)*100)
  const isDone=completedCount===total
  const isActive=!isDone&&completedCount>0
  const countStr=completedCount>0?`${completedCount}/${total}`:`${total}`
  const dotLessons=mod.lessons.map((l,idx)=>({...l,done:completedLessons.has(l.ref),active:!completedLessons.has(l.ref)&&idx===mod.lessons.findIndex(x=>!completedLessons.has(x.ref))}))
  const[hov,setHov]=useState(false);const[dotIdx,setDotIdx]=useState(null);const{ref,beam,onMove,onLeave:bLeave}=useBeam()
  const numColor=isDone?hov?"#4a9068":C.forest:isActive?hov?C.amber:C.accent:hov?"rgba(232,160,32,0.80)":"rgba(232,160,32,0.45)"
  const barColor=isDone?C.forest:isActive?C.accent:C.ruleStrong
  const hovL=dotIdx!==null?dotLessons[dotIdx]:null
  return(<div ref={ref} onMouseMove={e=>{onMove(e);setHov(true)}} onMouseEnter={()=>setHov(true)} onMouseLeave={e=>{bLeave(e);setHov(false)}} onClick={()=>{window.scrollTo({top:0,behavior:'smooth'});setRoute("lesson-"+mod.lessons[0].ref)}} style={{display:"grid",gridTemplateColumns:"80px 1fr auto",gap:20,padding:`24px 24px 24px ${hov?30:24}px`,borderBottom:`1px solid ${C.rule}`,borderRight:oddCol?`1px solid ${C.rule}`:"none",background:hov?isActive?`color-mix(in srgb,${C.accent} 5%,${C.cream})`:C.creamWarm:"transparent",transition:"background 200ms,padding-left 180ms",cursor:"pointer",position:"relative",overflow:"hidden"}}>
  {hov&&<div style={{position:"absolute",inset:0,pointerEvents:"none",background:`radial-gradient(ellipse 55% 80% at ${beam.x} -5%,rgba(232,160,32,0.07) 0%,transparent 65%)`}}/>}
  <div style={{fontFamily:F.display,fontWeight:800,fontSize:56,lineHeight:0.9,letterSpacing:"-0.04em",color:numColor,transition:"color 220ms ease",position:"relative",flexShrink:0,textShadow:hov&&!isDone&&!isActive?`0 0 24px rgba(232,160,32,0.45),0 0 48px rgba(232,160,32,0.18)`:"none"}}>
    {mod.n}
    {isDone&&<span style={{position:"absolute",top:-6,right:-3,width:18,height:18,borderRadius:"50%",background:C.forest,color:C.cream,display:"grid",placeItems:"center",fontSize:9,fontWeight:700,fontFamily:F.display}}>✓</span>}
  </div>
  <div style={{display:"flex",flexDirection:"column",gap:6,minWidth:0}}>
    <span style={mono({fontSize:9,letterSpacing:"0.22em",textTransform:"uppercase",color:isDone?C.forest:isActive?C.accent:C.inkMute})}>{isActive?"In progress · ":""}{mod.label}</span>
    <span style={{fontFamily:F.display,fontWeight:700,fontSize:18,letterSpacing:"-0.01em",lineHeight:1.2,color:C.ink}}>{mod.title}</span>
    <span style={{fontFamily:F.body,fontSize:12,color:C.inkMute,lineHeight:1.55}}>{mod.lessons.slice(0,4).map(l=>l.title).join(" · ")}…</span>
    {isActive&&<div style={{marginTop:4}}><LessonDots lessons={dotLessons} hoveredIdx={dotIdx} setHoveredIdx={setDotIdx}/><div style={mono({marginTop:5,fontSize:9,color:C.inkMute,minHeight:13})}>{hovL?`${hovL.active?"▶ ":hovL.done?"✓ ":""}${hovL.title}`:"Hover a dot to preview"}</div></div>}
  </div>
  <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:8,minWidth:110}}>
    <span style={mono({fontSize:9,color:C.inkMute,letterSpacing:"0.14em"})}>{countStr}</span>
    <div style={{width:100}}><FilamentBar pct={pct} color={barColor} glow={isActive||isDone}/></div>
    <span style={mono({fontSize:9,letterSpacing:"0.12em",color:C.inkMute})}>{isDone?<span style={{color:C.forest,fontWeight:600}}>Complete</span>:isActive?<span style={{color:C.accent,fontWeight:600}}>In progress</span>:pct>0?`${pct}%`:"Not started"}</span>
    <div style={{width:28,height:28,borderRadius:"50%",border:`1px solid ${isActive?C.accent:C.inkSoft}`,display:"grid",placeItems:"center",opacity:hov||isActive?1:0,transform:hov||isActive?"translateX(0)":"translateX(-6px)",transition:"opacity 180ms,transform 180ms",color:isActive?C.accent:C.inkSoft}}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
    </div>
  </div>
</div>)}



function Sidebar({route, setRoute, user, onSignOut, bookmarks=new Set(), isMobile=false, sidebarOpen=false, setSidebarOpen=()=>{}, openQuestionCount=0}){
  const nav = [
    {section:"Library", items:[
      {glyph:"▤",label:"Course home",route:"home"},
      {glyph:"⌕",label:"Search lessons",route:"search"},
      {glyph:"★",label:"Bookmarks",route:"bookmarks"},
      {glyph:"✏",label:"Notes",route:"notes"},
    ]},
    {section:"My progress", items:[
      {glyph:"↪",label:"Continue",route:"continue"},
      {glyph:"◎",label:"Practice exam",route:"exam"},
      {glyph:"⌗",label:"Certificate",route:"cert"},
    ]},
    {section:"Community", items:[
      {glyph:"◈",label:"Knowledge hub",route:"community",pill:"NEW",newPill:true},
      {glyph:"?",label:"Open questions",route:"open-questions",pill:openQuestionCount>0?String(openQuestionCount):null},
      {glyph:"⬡",label:"Trending topics",route:"trends"},
    ]},
    {section:"Account", items:[
      {glyph:"○",label:"Settings",route:"account"},
      {glyph:"✉",label:"Feedback",route:"feedback"},
    ]},
  ]
  return (
    <aside style={{
      background:C.ink,
      display:"flex",
      flexDirection:"column",
      position:isMobile?"fixed":"sticky",
      top:0,
      left:isMobile?(sidebarOpen?0:-260):0,
      height:"100vh",
      width:isMobile?260:220,
      minWidth:isMobile?"unset":220,
      overflowY:"auto",
      scrollbarWidth:"none",
      borderRight:"1px solid rgba(255,255,255,0.05)",
      zIndex:isMobile?1000:"auto",
      transition:isMobile?"left 280ms cubic-bezier(0.4,0,0.2,1)":"none",
      boxShadow:isMobile&&sidebarOpen?"4px 0 32px rgba(0,0,0,0.4)":"none",
    }}>
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"16px 18px 8px",borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
        <img src="/brand/logo-transparent.png" alt="LC Lighting Master"
          style={{width:38,height:38,flexShrink:0,borderRadius:9,border:"1px solid rgba(242,230,218,0.28)",boxShadow:"0 0 14px rgba(232,160,32,0.35), 0 0 4px rgba(242,230,218,0.15)"}}/>
        <div>
          <div style={{fontFamily:F.display,fontWeight:700,fontSize:13,color:C.cream,lineHeight:1.2}}>Lighting Master</div>
          <div style={m({fontSize:8,letterSpacing:"0.18em",textTransform:"uppercase",color:"rgba(255,255,255,0.28)",marginTop:1})}>BY LUXART LLC</div>
        </div>
      </div>

      {nav.map(({section,items})=>(
        <div key={section} style={{paddingTop:14}}>
          <div style={m({fontSize:8,letterSpacing:"0.26em",textTransform:"uppercase",
            color:"rgba(255,255,255,0.22)",padding:"0 16px 5px"})}>{section}</div>
          {items.map(item=>(
            <button key={item.route} onClick={()=>{setRoute(item.route);if(isMobile)setSidebarOpen(false)}}
              style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"9px 16px",
                background:route===item.route?"rgba(198,90,58,0.18)":"none",border:"none",
                borderLeft:route===item.route?`2px solid ${C.accent}`:"2px solid transparent",
                cursor:"pointer",textAlign:"left"}}>
              <span style={m({fontSize:11,color:route===item.route?C.accent:"rgba(255,255,255,0.45)",
                flexShrink:0,width:14,textAlign:"center"})}>{item.glyph}</span>
              <span style={{fontFamily:F.display,fontSize:13,fontWeight:route===item.route?600:400,
                color:route===item.route?"#fff":"rgba(255,255,255,0.65)",display:"flex",alignItems:"center",gap:6,flex:1}}>{item.label}
                {item.route==="bookmarks"&&bookmarks.size>0&&(
                  <span style={{fontFamily:F.mono,fontSize:9,background:C.accent,color:"#fff",borderRadius:99,padding:"1px 6px",lineHeight:1.6}}>{bookmarks.size}</span>
                )}
                {item.newPill&&(
                  <span style={{fontFamily:F.mono,fontSize:8,background:C.forest,color:"#fff",borderRadius:99,padding:"1px 6px",lineHeight:1.6,letterSpacing:"0.08em"}}>{item.pill}</span>
                )}
                {!item.newPill&&item.pill&&(
                  <span style={{fontFamily:F.mono,fontSize:8,background:C.accent,color:"#fff",borderRadius:99,padding:"1px 6px",lineHeight:1.6,letterSpacing:"0.08em"}}>{item.pill}</span>
                )}
              </span>
            </button>
          ))}
        </div>
      ))}

      {/* User strip at bottom */}
      <div style={{marginTop:"auto",borderTop:"1px solid rgba(255,255,255,0.08)",padding:"14px 16px"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
          <div style={{width:28,height:28,borderRadius:"50%",background:C.accent,
            display:"flex",alignItems:"center",justifyContent:"center",
            fontFamily:F.display,fontWeight:700,fontSize:11,color:"#fff",flexShrink:0}}>
            {(user?.name||"U").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
          </div>
          <div style={{overflow:"hidden"}}>
            <div style={{fontFamily:F.display,fontSize:12,fontWeight:600,color:"rgba(255,255,255,0.85)",
              whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{user?.name||"Guest"}</div>
            <div style={m({fontSize:8,letterSpacing:"0.1em",textTransform:"uppercase",
              color:"rgba(255,255,255,0.35)"})}>{PLAN_LABELS[user?.plan]||"Free trial"}</div>
          </div>
        </div>
        <button onClick={onSignOut}
          style={{width:"100%",padding:"8px",background:"rgba(255,255,255,0.06)",
            border:"1px solid rgba(255,255,255,0.1)",borderRadius:6,
            fontFamily:F.display,fontWeight:600,fontSize:12,color:"rgba(255,255,255,0.5)",
            cursor:"pointer",transition:"all 140ms"}}
          onMouseEnter={e=>e.currentTarget.style.color="rgba(255,255,255,0.9)"}
          onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,0.5)"}>
          Sign out
        </button>
        <div style={{borderTop:"1px solid rgba(255,255,255,0.06)",marginTop:12,paddingTop:12,display:"flex",flexWrap:"wrap",gap:"4px 12px"}}>
          {[{label:"Privacy",href:"/legal/privacy"},{label:"Terms",href:"/legal/terms"},{label:"Refund",href:"/legal/refund"},{label:"Cookies",href:"/legal/cookies"}].map(({label,href})=>(
            <a key={label} href={href} target="_blank"
              style={{fontFamily:F.mono,fontSize:9,letterSpacing:"0.12em",color:"rgba(242,230,218,0.35)",textDecoration:"none",textTransform:"uppercase"}}
              onMouseEnter={e=>e.target.style.color="rgba(242,230,218,0.7)"}
              onMouseLeave={e=>e.target.style.color="rgba(242,230,218,0.35)"}
            >{label}</a>
          ))}
        </div>
      </div>
    </aside>
  )
}

/* ── PLAN HELPERS ── */
const PLAN_LABELS = { free:"Free trial", t1:"LC Preparation Test", t2:"Full Course", t3:"Full Course + Exam", team_admin:"Team Admin", team_member:"Team Member" }

function moduleAccess(plan, modFree){
  if(plan==="t3"||plan==="t2"||plan==="team_admin"||plan==="team_member") return true
  if(plan==="t1") return false
  return modFree
}
function examAccess(plan, examAddon){ return plan==="t1"||plan==="t3"||(plan==="t2"&&!!examAddon) }

/* placeholder removed — checkout handled via /api/stripe/checkout */

function accessExpiry(){ return `December 31, ${new Date().getFullYear()}` }
function daysLeft(){ return Math.ceil((new Date(new Date().getFullYear(),11,31)-new Date())/(1000*60*60*24)) }

/* ── UPGRADE MODAL (wraps PricingCard) ── */
function UpgradeModal({user, onClose}){
  useEffect(()=>{
    function onKey(e){ if(e.key==="Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return ()=>window.removeEventListener("keydown", onKey)
  },[onClose])

  return(
    <div onClick={e=>{if(e.target===e.currentTarget)onClose()}}
      style={{position:"fixed",inset:0,zIndex:2000,background:"rgba(47,74,63,0.82)",
        display:"flex",alignItems:"center",justifyContent:"center",
        padding:"20px 16px",overflowY:"auto"}}>
      <div style={{background:C.paper,borderRadius:18,padding:"32px 28px",
        width:"100%",maxWidth:900,position:"relative",
        border:`1px solid ${C.rule}`,margin:"auto"}}>
        <button onClick={onClose} style={{position:"absolute",top:16,right:18,
          background:"none",border:"none",cursor:"pointer",fontSize:22,color:C.inkMute,zIndex:1}}>×</button>
        <div style={{marginBottom:24}}>
          <div style={m({fontSize:9,letterSpacing:"0.24em",textTransform:"uppercase",color:C.accent,marginBottom:8})}>Upgrade your plan</div>
          <h2 style={{fontFamily:F.display,fontWeight:700,fontSize:22,letterSpacing:"-0.02em",color:C.ink,margin:"0 0 4px"}}>Choose your access tier</h2>
          <p style={{fontFamily:F.body,fontSize:13,color:C.inkMute,margin:0,lineHeight:1.6}}>
            One-time payment. Access through <strong style={{color:C.inkSoft}}>December 31, {new Date().getFullYear()}</strong>. No recurring charges.
          </p>
        </div>
        <PricingCard userId={user?.id} userEmail={user?.email} />
      </div>
    </div>
  )
}


/* ── TEAM ADMIN DASHBOARD ── */
function TeamAdminDashboard({user,setRoute}){
  const team=user?.team
  const [members,setMembers]=useState(team?.members||[])
  const [inviteEmail,setInviteEmail]=useState("")
  const [inviteSent,setInviteSent]=useState(false)
  const activeM=members.filter(m=>m.status==="active")
  const invitedM=members.filter(m=>m.status==="invited")
  const emptyM=members.filter(m=>m.status==="empty")
  const avgP=activeM.length?Math.round(activeM.reduce((s,m)=>s+m.progress,0)/activeM.length):0
  const topPerformer=[...activeM].sort((a,b)=>b.progress-a.progress)[0]

  function sendInvite(){
    if(!inviteEmail.includes("@"))return
    const emptyIdx=members.findIndex(m=>m.status==="empty")
    if(emptyIdx===-1)return
    const newMember={id:"ni_"+Date.now(),name:"Invite pending",email:inviteEmail,progress:0,modulesCompleted:0,examBestScore:null,lastActive:null,status:"invited"}
    setMembers(prev=>prev.map((m,i)=>i===emptyIdx?newMember:m))
    setInviteEmail("");setInviteSent(true);setTimeout(()=>setInviteSent(false),3000)
  }
  function removeMember(id){
    setMembers(prev=>prev.map(m=>m.id===id?{id:m.id,name:"Seat available",email:null,progress:0,modulesCompleted:0,examBestScore:null,lastActive:null,status:"empty"}:m))
  }

  return(
    <div style={{padding:"40px 36px",minHeight:"100vh"}}>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:28,flexWrap:"wrap",gap:16}}>
        <div>
          <div style={{fontFamily:F.mono,fontSize:9,letterSpacing:"0.24em",textTransform:"uppercase",color:C.accent,marginBottom:6}}>Team Admin</div>
          <h1 style={{fontFamily:F.display,fontWeight:700,fontSize:28,letterSpacing:"-0.02em",color:C.ink,margin:"0 0 4px"}}>{team?.name}</h1>
          <div style={{fontFamily:F.mono,fontSize:11,color:C.inkMute}}>{user?.name} · {user?.company} · {activeM.length} of {team?.seats} seats active</div>
        </div>
        <div style={{background:C.forestLight,border:`1px solid ${C.forest}`,borderRadius:10,padding:"12px 18px",textAlign:"center"}}>
          <div style={{fontFamily:F.mono,fontSize:9,letterSpacing:"0.14em",textTransform:"uppercase",color:C.forest,marginBottom:4}}>Seats</div>
          <div style={{fontFamily:F.display,fontWeight:700,fontSize:26,color:C.forest,lineHeight:1}}>{activeM.length}<span style={{color:C.inkMute,fontSize:16}}> / {team?.seats}</span></div>
          <div style={{fontFamily:F.mono,fontSize:10,color:C.inkMute,marginTop:3}}>{emptyM.length} available · {invitedM.length} invited</div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:28}}>
        {[["Active members",activeM.length,`of ${team?.seats} seats`],["Avg progress",`${avgP}%`,"across active members"],["Invites pending",invitedM.length,invitedM.length?"awaiting signup":"none pending"],["Top performer",topPerformer?`${topPerformer.progress}%`:"—",topPerformer?.name.split(" ")[0]||"—"]].map(([label,val,sub])=>(
          <div key={label} style={{background:C.paper,border:`1px solid ${C.rule}`,borderRadius:10,padding:"16px 18px"}}>
            <div style={{fontFamily:F.mono,fontSize:8,letterSpacing:"0.18em",textTransform:"uppercase",color:C.inkMute,marginBottom:8}}>{label}</div>
            <div style={{fontFamily:F.display,fontWeight:700,fontSize:22,color:C.ink,marginBottom:3}}>{val}</div>
            <div style={{fontFamily:F.mono,fontSize:10,color:C.inkMute}}>{sub}</div>
          </div>
        ))}
      </div>
      <div style={{background:C.paper,border:`1px solid ${C.rule}`,borderRadius:10,overflow:"hidden",marginBottom:20}}>
        <div style={{padding:"16px 20px",borderBottom:`1px solid ${C.rule}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{fontFamily:F.display,fontWeight:700,fontSize:15,color:C.ink}}>Team progress</div>
          <div style={{fontFamily:F.mono,fontSize:10,color:C.inkMute}}>Access expires Dec 31, {new Date().getFullYear()}</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"2fr 130px 70px 80px 1fr 100px",padding:"8px 20px",background:C.creamWarm,borderBottom:`1px solid ${C.rule}`}}>
          {["Member","Status","Modules","Exam","Progress",""].map(h=><div key={h} style={{fontFamily:F.mono,fontSize:9,letterSpacing:"0.16em",textTransform:"uppercase",color:C.inkMute}}>{h}</div>)}
        </div>
        {members.map((m,i)=>(
          <div key={m.id} style={{display:"grid",gridTemplateColumns:"2fr 130px 70px 80px 1fr 100px",padding:"13px 20px",borderBottom:i<members.length-1?`1px solid ${C.rule}`:"none",background:m.status==="empty"?"rgba(0,0,0,0.01)":"transparent",opacity:m.status==="empty"?0.4:1}} onMouseEnter={e=>{if(m.status!=="empty")e.currentTarget.style.background=C.creamWarm}} onMouseLeave={e=>e.currentTarget.style.background=m.status==="empty"?"rgba(0,0,0,0.01)":"transparent"}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:28,height:28,borderRadius:"50%",background:m.status==="active"?C.accent+"25":C.rule,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:F.display,fontWeight:700,fontSize:9,color:C.accent,flexShrink:0}}>{m.name.split(" ").map(w=>w[0]).join("").slice(0,2)}</div>
              <div><div style={{fontFamily:F.display,fontWeight:m.status==="active"?500:400,fontSize:13,color:m.status==="empty"?C.inkMute:C.ink}}>{m.name}</div>{m.email&&<div style={{fontFamily:F.mono,fontSize:10,color:C.inkMute}}>{m.email}</div>}</div>
            </div>
            <div style={{display:"flex",alignItems:"center"}}>
              {m.status==="active"&&<span style={{fontFamily:F.mono,fontSize:10,fontWeight:600,color:C.forest,background:C.forestLight,border:`1px solid ${C.forest}`,borderRadius:4,padding:"2px 8px"}}>Active</span>}
              {m.status==="invited"&&<span style={{fontFamily:F.mono,fontSize:10,fontWeight:600,color:C.amber,background:"#fff8e6",border:`1px solid ${C.amber}`,borderRadius:4,padding:"2px 8px"}}>Invited</span>}
              {m.status==="empty"&&<span style={{fontFamily:F.mono,fontSize:10,color:C.inkMute}}>—</span>}
            </div>
            <div style={{display:"flex",alignItems:"center",fontFamily:F.mono,fontSize:12,color:m.status==="active"?C.inkSoft:C.inkMute}}>{m.status==="active"?`${m.modulesCompleted}/12`:"—"}</div>
            <div style={{display:"flex",alignItems:"center",fontFamily:F.mono,fontSize:12,color:m.examBestScore>=85?C.forest:m.examBestScore?C.accent:C.inkMute}}>{m.examBestScore?`${m.examBestScore}%`:"—"}</div>
            <div style={{display:"flex",alignItems:"center",gap:8,paddingRight:8}}>
              {m.status==="active"?(<><div style={{background:C.rule,borderRadius:3,height:5,flex:1,overflow:"hidden"}}><div style={{background:m.progress===100?C.forest:C.accent,height:5,borderRadius:3,width:`${m.progress}%`}}/></div><span style={{fontFamily:F.mono,fontSize:10,color:C.inkMute,width:28,textAlign:"right",flexShrink:0}}>{m.progress}%</span></>):<span style={{fontFamily:F.mono,fontSize:12,color:C.inkMute}}>—</span>}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:6,justifyContent:"flex-end"}}>
              {m.status==="active"&&<button onClick={()=>removeMember(m.id)} style={{fontFamily:F.mono,fontSize:9,background:"none",border:`1px solid ${C.rule}`,borderRadius:4,padding:"3px 8px",color:C.inkMute,cursor:"pointer"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="#c0392b";e.currentTarget.style.color="#c0392b"}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.rule;e.currentTarget.style.color=C.inkMute}}>Remove</button>}
              {m.status==="invited"&&<button onClick={()=>alert(`Invite resent to ${m.email}`)} style={{fontFamily:F.mono,fontSize:9,background:"none",border:`1px solid ${C.rule}`,borderRadius:4,padding:"3px 8px",color:C.inkMute,cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent} onMouseLeave={e=>e.currentTarget.style.borderColor=C.rule}>Resend</button>}
            </div>
          </div>
        ))}
      </div>
      {emptyM.length>0&&(
        <div style={{background:C.paper,border:`1px solid ${C.rule}`,borderRadius:10,padding:"20px 24px"}}>
          <div style={{fontFamily:F.display,fontWeight:700,fontSize:14,color:C.ink,marginBottom:4}}>Invite a team member</div>
          <div style={{fontFamily:F.body,fontSize:13,color:C.inkMute,marginBottom:14}}>They receive a direct signup link — their account links to your team automatically. {emptyM.length} seat{emptyM.length!==1?"s":""} available.</div>
          {inviteSent&&<div style={{background:C.forestLight,border:`1px solid ${C.forest}`,borderRadius:8,padding:"10px 14px",fontFamily:F.body,fontSize:13,color:C.forest,marginBottom:12}}>✓ Invite sent!</div>}
          <div style={{display:"flex",gap:10}}>
            <input type="email" value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} placeholder="colleague@yourfirm.com" onKeyDown={e=>e.key==="Enter"&&sendInvite()} style={{flex:1,padding:"10px 14px",border:`1px solid ${C.rule}`,borderRadius:8,fontFamily:F.body,fontSize:14,color:C.ink,background:C.cream,outline:"none"}} onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.rule}/>
            <button onClick={sendInvite} style={{padding:"10px 24px",background:inviteEmail.includes("@")?C.accent:C.rule,color:inviteEmail.includes("@")?"#fff":C.inkMute,border:"none",borderRadius:8,fontFamily:F.display,fontWeight:700,fontSize:13,cursor:"pointer",flexShrink:0,transition:"all 0.15s"}}>Send invite →</button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── TEAM MEMBER VIEW ── */
function TeamMemberView({user,setRoute}){
  const team=user?.team
  const allActive=team?.members?.filter(m=>m.status==="active")||[]
  const me=allActive[0]||{name:user?.name,progress:72,modulesCompleted:8,examBestScore:88}
  const myRank=[...allActive].sort((a,b)=>b.progress-a.progress).findIndex(m=>m.id===me.id)+1||1

  return(
    <div style={{padding:"40px 36px",minHeight:"100vh"}}>
      <div style={{marginBottom:28}}>
        <div style={{fontFamily:F.mono,fontSize:9,letterSpacing:"0.24em",textTransform:"uppercase",color:C.accent,marginBottom:6}}>Team Member · {team?.name}</div>
        <h1 style={{fontFamily:F.display,fontWeight:700,fontSize:28,letterSpacing:"-0.02em",color:C.ink,margin:"0 0 4px"}}>{user?.name?.split(" ")[0]}'s Progress</h1>
        <div style={{fontFamily:F.mono,fontSize:11,color:C.inkMute}}>Team managed by {team?.adminName} · {allActive.length} of {team?.seats} seats active</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:28}}>
        {[["My progress",`${me.progress}%`,`Rank ${myRank} of ${allActive.length} on team`],["Modules done",`${me.modulesCompleted} / 12`,"All modules unlocked"],["Best exam score",me.examBestScore?`${me.examBestScore}%`:"Not yet","85% needed to pass"],["Team avg",`${Math.round(allActive.reduce((s,m)=>s+m.progress,0)/allActive.length)}%`,"Team average"]].map(([label,val,sub])=>(
          <div key={label} style={{background:C.paper,border:`1px solid ${C.rule}`,borderRadius:10,padding:"16px 18px"}}>
            <div style={{fontFamily:F.mono,fontSize:8,letterSpacing:"0.18em",textTransform:"uppercase",color:C.inkMute,marginBottom:8}}>{label}</div>
            <div style={{fontFamily:F.display,fontWeight:700,fontSize:22,color:C.ink,marginBottom:3}}>{val}</div>
            <div style={{fontFamily:F.mono,fontSize:10,color:C.inkMute}}>{sub}</div>
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1.6fr 1fr",gap:16,marginBottom:20}}>
        <div style={{background:C.paper,border:`1px solid ${C.rule}`,borderRadius:10,overflow:"hidden"}}>
          <div style={{padding:"16px 20px",borderBottom:`1px solid ${C.rule}`}}>
            <div style={{fontFamily:F.display,fontWeight:700,fontSize:15,color:C.ink}}>My module progress</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,padding:"16px"}}>
            {Array.from({length:12},(_,i)=>{
              const done=i<me.modulesCompleted
              const current=i===me.modulesCompleted
              return(<div key={i} onClick={()=>{window.scrollTo({top:0,behavior:'smooth'});setRoute(`lesson-${i+1}.1`)}} style={{background:done?C.forest+"18":current?C.accentLight:C.creamWarm,border:`1px solid ${done?C.forest:current?C.accent:C.rule}`,borderRadius:8,padding:"10px 8px",textAlign:"center",cursor:"pointer",transition:"all 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background=done?C.forestLight:C.accentLight} onMouseLeave={e=>e.currentTarget.style.background=done?C.forest+"18":current?C.accentLight:C.creamWarm}>
                <div style={{fontFamily:F.display,fontWeight:700,fontSize:11,color:done?C.forest:current?C.accent:C.inkMute}}>M{String(i+1).padStart(2,"0")}</div>
                <div style={{fontSize:14,marginTop:2}}>{done?"✓":current?"▶":"○"}</div>
              </div>)
            })}
          </div>
        </div>
        <div style={{background:C.paper,border:`1px solid ${C.rule}`,borderRadius:10,overflow:"hidden"}}>
          <div style={{padding:"16px 20px",borderBottom:`1px solid ${C.rule}`}}>
            <div style={{fontFamily:F.display,fontWeight:700,fontSize:15,color:C.ink}}>Team leaderboard</div>
          </div>
          {[...allActive].sort((a,b)=>b.progress-a.progress).map((m,i)=>{
            const isMe=m.id===me.id||(i===0&&me)
            return(<div key={m.id||i} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 20px",borderBottom:i<allActive.length-1?`1px solid ${C.rule}`:"none",background:isMe?C.accentLight:"transparent"}}>
              <div style={{fontFamily:F.display,fontWeight:700,fontSize:15,color:i===0?C.amber:C.inkMute,width:20,textAlign:"center",flexShrink:0}}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":i+1}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontFamily:F.display,fontWeight:isMe?600:400,fontSize:13,color:C.ink,display:"flex",alignItems:"center",gap:6}}>
                  {m.name.split(" ")[0]}
                  {isMe&&<span style={{fontFamily:F.mono,fontSize:9,color:C.accent,background:C.accentLight,border:`1px solid ${C.accent}30`,borderRadius:99,padding:"1px 6px"}}>you</span>}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6,marginTop:3}}>
                  <div style={{background:C.rule,borderRadius:3,height:3,flex:1,overflow:"hidden"}}><div style={{background:m.progress===100?C.forest:isMe?C.accent:C.inkMute+"60",height:3,borderRadius:3,width:`${m.progress}%`}}/></div>
                  <span style={{fontFamily:F.mono,fontSize:9,color:C.inkMute,flexShrink:0,width:28,textAlign:"right"}}>{m.progress}%</span>
                </div>
              </div>
              <div style={{fontFamily:F.mono,fontSize:11,color:m.examBestScore>=85?C.forest:m.examBestScore?C.accent:C.inkMute,flexShrink:0,width:36,textAlign:"right"}}>{m.examBestScore?`${m.examBestScore}%`:"—"}</div>
            </div>)
          })}
        </div>
      </div>
      <div style={{background:C.ink,borderRadius:10,padding:"24px 28px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:20,flexWrap:"wrap"}}>
        <div>
          <div style={{fontFamily:F.display,fontWeight:700,fontSize:16,color:"#fff",marginBottom:4}}>{me.progress===100?"Course complete! 🎉":"Keep going — you're on track."}</div>
          <div style={{fontFamily:F.mono,fontSize:11,color:"rgba(249,244,237,0.5)"}}>{me.progress===100?"Take the practice exam to confirm your readiness.":`Module ${me.modulesCompleted+1} of 12 is up next.`}</div>
        </div>
        <button onClick={()=>setRoute("continue")} style={{padding:"11px 28px",background:C.accent,color:"#fff",border:"none",borderRadius:99,fontFamily:F.display,fontWeight:700,fontSize:13,cursor:"pointer",flexShrink:0}} onMouseEnter={e=>e.currentTarget.style.opacity="0.88"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>{me.progress===100?"Go to exam →":"Continue learning →"}</button>
      </div>
    </div>
  )
}

/* ── DASHBOARD ── */
function Dashboard({ setRoute, completedLessons = new Set(), user, userSubscription, isMobile=false }) {
  const [dotIdx, setDotIdx] = useState(null)
  const [hoveredMod, setHoveredMod] = useState(null)

  const totalDone = completedLessons.size
  const totalLessons = 74
  const overallPct = Math.round((totalDone / totalLessons) * 100)
  const ceuEarned = ((totalDone / totalLessons) * 24).toFixed(1)
  const daysToExam = (()=>{
    const examDate = new Date(new Date().getFullYear(), 9, 15)
    const today = new Date()
    if (examDate < today) examDate.setFullYear(today.getFullYear() + 1)
    return Math.ceil((examDate - today) / (1000 * 60 * 60 * 24))
  })()

  const nextLesson = ALL_LESSONS.find(l => !completedLessons.has(l.ref))

  const moduleData = MODULES.map(mod => {
    const done = mod.lessons.filter(l => completedLessons.has(l.ref)).length
    const total = mod.lessons.length
    return { n: mod.n, label: mod.label, done, total, pct: Math.round((done/total)*100) }
  })

  const communityAvg = null
  const topQuartile = null

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = user?.email?.split('@')[0] || 'there'

  return (
    <>
      {/* ── HERO SECTION ─────────────────────────────────────── */}
      <section style={{ padding: '32px 36px 36px', borderBottom: `1px solid ${C.rule}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.3fr 1fr', gap: 48, alignItems: 'end', marginBottom: 28 }}>
          <div>
            <div style={mono({ fontSize: 9, letterSpacing: '0.24em', textTransform: 'uppercase', color: C.accent, marginBottom: 12 })}>
              {overallPct > 0 ? `${overallPct}% complete · ${ceuEarned} CEU earned` : 'Ready to begin your NCQLP journey'}
            </div>
            <h1 style={{ fontFamily: F.display, fontWeight: 700, fontSize: 'clamp(32px,4.5vw,58px)', lineHeight: 1, letterSpacing: '-0.025em', color: C.ink, margin: 0 }}>
              {greeting}, <em style={{ fontStyle: 'normal', color: C.accent }}>{firstName}.</em>
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 24, justifyContent: 'flex-end', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            {[
              { label: 'Lessons done', val: totalDone, sub: `/${totalLessons}` },
              { label: 'CEU earned', val: ceuEarned, sub: '/24 hr' },
              { label: 'Days to exam', val: daysToExam, sub: ' days' }
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'right' }}>
                <div style={mono({ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.inkMute, marginBottom: 4 })}>{s.label}</div>
                <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 27, letterSpacing: '-0.02em', color: C.ink, lineHeight: 1 }}>
                  {s.val}<em style={{ fontStyle: 'normal', color: C.accent, fontSize: 16, fontWeight: 600 }}>{s.sub}</em>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Overall progress bar */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={mono({ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.inkMute })}>Overall course progress</span>
            <span style={mono({ fontSize: 9, color: C.accent })}>{overallPct}% — {totalDone} of {totalLessons} lessons</span>
          </div>
          <div style={{ height: 8, background: C.rule, borderRadius: 99, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${overallPct}%`, background: C.accent, borderRadius: 99, transition: 'width 800ms ease' }}/>
          </div>
        </div>

        {/* Resume card */}
        {nextLesson && (
          <DarkCard style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.5fr 1fr', gap: 40, padding: '28px 32px', cursor: 'pointer' }} onClick={() => setRoute('lesson-' + nextLesson.ref)}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <span style={mono({ fontSize: 9, letterSpacing: '0.24em', textTransform: 'uppercase', color: C.tan })}>— pick up where you left off</span>
              <h2 style={{ fontFamily: F.display, fontWeight: 700, fontSize: 22, letterSpacing: '-0.02em', lineHeight: 1.15, margin: 0, color: C.cream }}>
                Module {nextLesson.module} · <em style={{ fontStyle: 'normal', color: C.accent }}>{nextLesson.title}</em>
              </h2>
              <div style={{ display: 'flex', gap: 3, maxWidth: 380 }}>
                {Array.from({ length: 8 }, (_, i) => {
                  const mod = MODULES[parseInt(nextLesson.module) - 1]
                  const lessonAtPos = mod?.lessons[i]
                  const done = lessonAtPos && completedLessons.has(lessonAtPos.ref)
                  const isCurrent = lessonAtPos?.ref === nextLesson.ref
                  return <span key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: isCurrent ? C.accent : done ? 'rgba(248,243,236,0.85)' : 'rgba(248,243,236,0.14)', boxShadow: isCurrent ? `0 0 7px ${C.accent}` : done ? '0 0 4px rgba(248,243,236,0.35)' : 'none' }}/>
                })}
              </div>
              <button style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: F.display, fontWeight: 700, fontSize: 13, borderRadius: 99, padding: '10px 20px', background: C.accent, color: '#fff', border: 'none', cursor: 'pointer' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.cream, flexShrink: 0 }}/>
                Resume lesson →
              </button>
            </div>
            <div style={{ background: 'rgba(248,243,236,0.06)', border: '1px solid rgba(248,243,236,0.12)', borderRadius: 4, padding: 20 }}>
              <div style={mono({ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.tan, marginBottom: 10 })}>Module {nextLesson.module} progress</div>
              <LessonDots lessons={MODULES[parseInt(nextLesson.module)-1]?.lessons || []} hoveredIdx={dotIdx} setHoveredIdx={setDotIdx}/>
            </div>
          </DarkCard>
        )}
      </section>

      {/* ── PROGRESS CHARTS SECTION ──────────────────────────── */}
      <section style={{ padding: '32px 36px', borderBottom: `1px solid ${C.rule}` }}>
        <div style={mono({ fontSize: 9, letterSpacing: '0.24em', textTransform: 'uppercase', color: C.accent, marginBottom: 20 })}>Progress by module</div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 32 }}>

          {/* Module completion bar chart */}
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {MODULES.map(mod => {
                const done = mod.lessons.filter(l => completedLessons.has(l.ref)).length
                const total = mod.lessons.length
                const pct = Math.round((done / total) * 100)
                return (
                  <div key={mod.n}
                    onMouseEnter={() => setHoveredMod(mod.n)}
                    onMouseLeave={() => setHoveredMod(null)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontFamily: F.display, fontWeight: 600, fontSize: 12, color: hoveredMod === mod.n ? C.accent : C.ink }}>
                        M{mod.n} · {mod.label}
                      </span>
                      <span style={mono({ fontSize: 9, color: pct === 100 ? C.forest : C.inkMute })}>
                        {pct === 100 ? '✓ Complete' : `${done}/${total}`}
                      </span>
                    </div>
                    <div style={{ height: 6, background: C.rule, borderRadius: 99, overflow: 'hidden', marginBottom: 6 }}>
                      <div style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: pct === 100 ? C.forest : hoveredMod === mod.n ? C.accent : `${C.accent}99`,
                        borderRadius: 99,
                        transition: 'width 600ms ease, background 200ms'
                      }}/>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {mod.lessons.map(l => {
                        const isDone = completedLessons.has(l.ref)
                        return (
                          <div key={l.ref}
                            onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setRoute('lesson-' + l.ref) }}
                            style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', padding: '3px 4px', borderRadius: 4, transition: 'background 120ms' }}
                            onMouseEnter={e => e.currentTarget.style.background = C.creamWarm}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <span style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: isDone ? C.forest : C.rule, border: isDone ? 'none' : `1.5px solid ${C.inkMute}` }}/>
                            <span style={{ fontFamily: F.body, fontSize: 11, color: isDone ? C.inkMute : C.ink, textDecoration: 'none' }}>
                              {l.ref} · {l.title}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Donut + community comparison */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <svg viewBox="0 0 120 120" width="110" height="110" style={{ flexShrink: 0 }}>
                <circle cx="60" cy="60" r="46" fill="none" stroke={C.rule} strokeWidth="10"/>
                <circle
                  cx="60" cy="60" r="46"
                  fill="none"
                  stroke={C.accent}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 46 * overallPct / 100} ${2 * Math.PI * 46}`}
                  strokeDashoffset={2 * Math.PI * 46 * 0.25}
                  style={{ transition: 'stroke-dasharray 1s ease', transform: 'rotate(-90deg)', transformOrigin: '60px 60px' }}
                />
                <text x="60" y="55" textAnchor="middle" style={{ fontFamily: F.display, fontWeight: 700, fontSize: 22, fill: C.ink }}>{overallPct}%</text>
                <text x="60" y="72" textAnchor="middle" style={{ fontFamily: F.mono, fontSize: 9, fill: C.inkMute }}>complete</text>
              </svg>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 16, color: C.ink, marginBottom: 4 }}>Your progress</div>
                <div style={{ fontFamily: F.body, fontSize: 13, color: C.inkMute, lineHeight: 1.6 }}>
                  {totalDone} of {totalLessons} lessons · {ceuEarned} of 24 CEU hours earned
                </div>
              </div>
            </div>

            <div style={{ background: C.creamWarm, border: `1px solid ${C.rule}`, borderRadius: 8, padding: 18 }}>
              <div style={mono({ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.inkMute, marginBottom: 14 })}>Community benchmark</div>
              {communityAvg === null ? (
                <div style={{ fontFamily: F.body, fontSize: 13, color: C.inkMute, lineHeight: 1.6 }}>
                  Community benchmark coming soon — available once more learners join.
                </div>
              ) : (
                <>
                  {[
                    { label: 'You', pct: overallPct, color: C.accent, bold: true },
                    { label: 'Avg learner', pct: communityAvg, color: C.inkMute, bold: false },
                    { label: 'Top 25%', pct: topQuartile, color: C.forest, bold: false },
                  ].map(({ label, pct, color, bold }) => (
                    <div key={label} style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <span style={{ fontFamily: F.display, fontWeight: bold ? 700 : 500, fontSize: 12, color: bold ? C.ink : C.inkMute }}>{label}</span>
                        <span style={{ fontFamily: F.mono, fontSize: 10, color }}>{pct}%</span>
                      </div>
                      <div style={{ height: 5, background: C.rule, borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width 800ms ease', opacity: bold ? 1 : 0.6 }}/>
                      </div>
                    </div>
                  ))}
                  <div style={{ fontFamily: F.body, fontSize: 12, color: C.inkMute, marginTop: 8, lineHeight: 1.5 }}>
                    {overallPct > topQuartile
                      ? '🏆 You are in the top 25% of all learners!'
                      : overallPct > communityAvg
                      ? '⚡ You are ahead of the average learner. Keep going!'
                      : overallPct > 0
                      ? '📈 You are getting started. The average learner is at ' + communityAvg + '%.'
                      : '🚀 Start your first lesson to see how you compare.'}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── MODULE GRID ──────────────────────────────────────── */}
      <div>
        {[1, 2, 3].map(partN => {
          const pMods = MODULES.filter(m => m.part === partN)
          const pi = [
            { t: 'Fundamentals · light, sources, math', s: 'Modules 01–04 · 26 lessons' },
            { t: 'Systems & applications', s: 'Modules 05–08 · 24 lessons' },
            { t: 'Design practice & sustainability', s: 'Modules 09–12 · 24 lessons' }
          ][partN - 1]
          return (
            <div key={partN}>
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr auto', gap: 20, padding: '30px 24px 14px', borderBottom: `1px solid ${C.rule}`, alignItems: 'baseline' }}>
                <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 14, letterSpacing: '0.06em', color: C.accent }}>PART {String(partN).padStart(2, '0')}</span>
                <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 16, letterSpacing: '-0.01em', color: C.ink }}>{pi.t}</span>
                <span style={mono({ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.inkMute, textAlign: 'right' })}>{pi.s}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)' }}>
                {pMods.map((mod, i) => <ModuleRow key={mod.n} mod={mod} oddCol={i % 2 === 0} setRoute={setRoute} completedLessons={completedLessons}/>)}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── EXAM CTA ─────────────────────────────────────────── */}
      <div style={{ padding: '40px 36px 56px' }}>
        <DarkCard style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.5fr 1fr', gap: 40, padding: '32px 36px', cursor: 'pointer' }} onClick={() => setRoute('exam')}>
          <div>
            <div style={mono({ fontSize: 9, letterSpacing: '0.24em', textTransform: 'uppercase', color: C.tan, marginBottom: 12 })}>Capstone · after the course</div>
            <h2 style={{ fontFamily: F.display, fontWeight: 700, fontSize: 28, letterSpacing: '-0.02em', lineHeight: 1.08, margin: '0 0 12px', color: C.cream }}>
              Put it all to the test — <em style={{ fontStyle: 'normal', color: C.accent }}>NCQLP Practice Exam.</em>
            </h2>
            <p style={{ fontFamily: F.body, fontSize: 14, lineHeight: 1.6, color: 'rgba(248,243,236,0.72)', margin: '0 0 20px', maxWidth: 400 }}>
              50 timed questions across 13 topics, scored for accuracy and speed.
            </p>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontFamily: F.display, fontWeight: 700, fontSize: 14, color: C.cream, background: C.accent, borderRadius: 99, padding: '11px 20px' }}>
              Go to the exam →
            </span>
          </div>
          <div style={{ background: 'rgba(248,243,236,0.06)', border: '1px solid rgba(248,243,236,0.12)', borderRadius: 4, padding: 22 }}>
            <div style={mono({ fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.tan, marginBottom: 12 })}>Exam at a glance</div>
            {[['Questions',String(TOTAL_QUESTIONS)],['Topics','13'],['Per question','25 sec'],['Your best score', 'Not yet taken']].map(([k,v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: F.body, fontSize: 13, color: 'rgba(248,243,236,0.75)', padding: '6px 0', borderBottom: '1px dashed rgba(248,243,236,0.10)' }}>
                <span>{k}</span><span style={{ fontFamily: F.display, fontWeight: 600, color: C.cream }}>{v}</span>
              </div>
            ))}
          </div>
        </DarkCard>
      </div>
    </>
  )
}

function PlaceholderPage({title, subtitle}){
  return(
    <div style={{padding:"40px 36px"}}>
      <div style={m({fontSize:9,letterSpacing:"0.24em",textTransform:"uppercase",color:C.accent,marginBottom:8})}>
        {subtitle||"Coming soon"}
      </div>
      <h1 style={{fontFamily:F.display,fontWeight:700,fontSize:48,letterSpacing:"-0.025em",
        color:C.ink,margin:"0 0 16px"}}>{title}</h1>
      <p style={{fontFamily:F.body,fontSize:15,color:C.inkMute,lineHeight:1.6,maxWidth:500}}>
        This section is wired and ready — full content from lc-app-full.jsx renders here in production.
      </p>
    </div>
  )
}

function computeModules(completedLessons) {
  return MODULES.map(mod => {
    const appMod = APP_MODULES.find(a => a.n === mod.n) || {}
    const completedCount = mod.lessons.filter(l => completedLessons.has(l.ref)).length
    const total = mod.lessons.length
    const pct = Math.round((completedCount / total) * 100)
    const done = completedCount === total
    const active = !done && completedCount > 0
    return { ...mod, done, active, pct, count:`${completedCount}/${total}`, free:appMod.free||false }
  })
}
function isNextIncompleteLesson(lessonRef, completedLessons) {
  const next = ALL_LESSONS.find(l => !completedLessons.has(l.ref))
  return next?.ref === lessonRef
}
function getNextLesson(completedLessons) {
  return ALL_LESSONS.find(l => !completedLessons.has(l.ref))
}

/* ── COMMUNITY KNOWLEDGE HUB ─────────────────────────────── */
function CommunityPage({ setRoute, user, userSubscription, initialFilter = 'All' }) {
  const supabase = createClient()
  const isPaid = ['t1','t2','t3'].includes(userSubscription?.plan || user?.plan)

  const [view, setView] = useState('list')
  const [questions, setQuestions] = useState([])
  const [activeQuestion, setActiveQuestion] = useState(null)
  const [answers, setAnswers] = useState([])
  const [userVotes, setUserVotes] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [searchQ, setSearchQ] = useState('')
  const [filterMarket, setFilterMarket] = useState('All')
  const [filterFixture, setFilterFixture] = useState('All')
  const [filterStatus, setFilterStatus] = useState(initialFilter === 'open' ? 'Open' : 'All')
  const [openQuestionCount, setOpenQuestionCount] = useState(0)

  const [askTitle, setAskTitle] = useState('')
  const [askBody, setAskBody] = useState('')
  const [askMarket, setAskMarket] = useState('')
  const [askFixture, setAskFixture] = useState('')
  const [askAnon, setAskAnon] = useState(false)
  const [askLoading, setAskLoading] = useState(false)
  const [askError, setAskError] = useState('')

  const [answerBody, setAnswerBody] = useState('')
  const [answerAnon, setAnswerAnon] = useState(false)
  const [answerLoading, setAnswerLoading] = useState(false)

  useEffect(() => {
    supabase
      .from('community_questions')
      .select('id', { count: 'exact', head: true })
      .eq('is_answered', false)
      .then(({ count }) => setOpenQuestionCount(count || 0))
  }, [])

  async function loadQuestions() {
    setLoading(true)
    let query = supabase
      .from('community_questions')
      .select('*')
      .order('created_at', { ascending: false })
    if (filterMarket !== 'All') query = query.eq('market', filterMarket)
    if (filterFixture !== 'All') query = query.eq('fixture_type', filterFixture)
    if (filterStatus === 'Answered') query = query.eq('is_answered', true)
    if (filterStatus === 'Open') query = query.eq('is_answered', false)
    if (searchQ.trim()) query = query.ilike('title', `%${searchQ}%`)
    const { data } = await query.limit(50)
    setQuestions(data || [])
    setLoading(false)
  }

  useEffect(() => { loadQuestions() }, [filterMarket, filterFixture, filterStatus])

  function sortAnswers(list) {
    return [...list].sort((a, b) => {
      if (a.is_accepted && !b.is_accepted) return -1
      if (!a.is_accepted && b.is_accepted) return 1
      return b.vote_count - a.vote_count
    })
  }

  async function loadAnswers(questionId) {
    const { data } = await supabase
      .from('community_answers')
      .select('*')
      .eq('question_id', questionId)
    setAnswers(sortAnswers(data || []))
  }

  async function loadUserVotes() {
    if (!user) return
    const { data } = await supabase
      .from('community_votes')
      .select('target_id')
      .eq('user_id', user.id)
    if (data) setUserVotes(new Set(data.map(v => v.target_id)))
  }

  useEffect(() => { loadUserVotes() }, [user])

  async function openQuestion(q) {
    setActiveQuestion(q)
    setView('question')
    await loadAnswers(q.id)
    supabase.from('community_questions')
      .update({ view_count: q.view_count + 1 }).eq('id', q.id)
  }

  async function submitQuestion() {
    if (!askTitle.trim() || !askMarket) { setAskError('Title and market are required.'); return }
    setAskLoading(true); setAskError('')
    const { error } = await supabase.from('community_questions').insert({
      user_id: user.id, title: askTitle.trim(), body: askBody.trim(),
      market: askMarket, fixture_type: askFixture || null, is_anonymous: askAnon,
    })
    if (error) { setAskError(error.message); setAskLoading(false); return }
    setAskTitle(''); setAskBody(''); setAskMarket(''); setAskFixture(''); setAskAnon(false)
    setAskLoading(false); setView('list'); loadQuestions()
  }

  async function submitAnswer() {
    if (!answerBody.trim()) return
    setAnswerLoading(true)
    await supabase.from('community_answers').insert({
      question_id: activeQuestion.id, user_id: user.id,
      body: answerBody.trim(), is_anonymous: answerAnon,
    })
    setAnswerBody(''); setAnswerAnon(false); setAnswerLoading(false)
    loadAnswers(activeQuestion.id)
    setActiveQuestion(prev => ({ ...prev, answer_count: prev.answer_count + 1 }))
  }

  async function toggleVote(targetId, targetType) {
    if (!user || !isPaid) return
    const hasVoted = userVotes.has(targetId)
    if (hasVoted) {
      await supabase.from('community_votes').delete().eq('user_id', user.id).eq('target_id', targetId)
      setUserVotes(prev => { const n = new Set(prev); n.delete(targetId); return n })
      if (targetType === 'answer') {
        setAnswers(prev => sortAnswers(prev.map(a => a.id === targetId ? { ...a, vote_count: Math.max(0, a.vote_count - 1) } : a)))
      } else {
        setActiveQuestion(prev => ({ ...prev, vote_count: Math.max(0, (prev.vote_count || 0) - 1) }))
      }
    } else {
      await supabase.from('community_votes').insert({ user_id: user.id, target_id: targetId, target_type: targetType })
      setUserVotes(prev => new Set([...prev, targetId]))
      if (targetType === 'answer') {
        setAnswers(prev => sortAnswers(prev.map(a => a.id === targetId ? { ...a, vote_count: a.vote_count + 1 } : a)))
      } else {
        setActiveQuestion(prev => ({ ...prev, vote_count: (prev.vote_count || 0) + 1 }))
      }
    }
  }

  async function acceptAnswer(answerId) {
    if (!user || user.id !== activeQuestion.user_id) return
    await supabase.from('community_answers').update({ is_accepted: false }).eq('question_id', activeQuestion.id)
    await supabase.from('community_answers').update({ is_accepted: true }).eq('id', answerId)
    await supabase.from('community_questions').update({ is_answered: true }).eq('id', activeQuestion.id)
    loadAnswers(activeQuestion.id)
  }

  function displayName(row) {
    if (row.is_anonymous) return 'Anonymous'
    return row.user_id === user?.id ? 'You' : 'LC Member'
  }

  function timeAgo(ts) {
    const d = Math.floor((Date.now() - new Date(ts)) / 1000)
    if (d < 60) return 'just now'
    if (d < 3600) return `${Math.floor(d/60)}m ago`
    if (d < 86400) return `${Math.floor(d/3600)}h ago`
    return `${Math.floor(d/86400)}d ago`
  }

  const MARKET_COLORS = {
    'Commercial': C.accent, 'Residential': '#7a9a6a',
    'Hospitality': '#9a6a7a', 'Healthcare': '#6a7a9a',
    'Industrial': '#8a7a4a', 'Sports': '#4a8a7a',
    'Outdoor/Street': C.forest,
  }

  const S = {
    page: { padding: '32px 36px', maxWidth: 860 },
    card: { background: C.paper, border: `1px solid ${C.rule}`, borderRadius: 8,
            padding: '20px 24px', marginBottom: 12, cursor: 'pointer', transition: 'box-shadow 150ms' },
    pill: (color) => ({ display: 'inline-block', fontFamily: F.mono, fontSize: 9,
      letterSpacing: '0.12em', textTransform: 'uppercase', padding: '3px 8px',
      borderRadius: 99, background: `${color}18`, color, marginRight: 6 }),
    input: { width: '100%', fontFamily: F.body, fontSize: 14, color: C.ink,
             background: C.paper, border: `1px solid ${C.rule}`, borderRadius: 6,
             padding: '10px 14px', outline: 'none', boxSizing: 'border-box' },
    btn: (primary) => ({
      fontFamily: F.display, fontWeight: 700, fontSize: 13, borderRadius: 99,
      padding: '10px 20px', cursor: 'pointer',
      border: primary ? 'none' : `1px solid ${C.rule}`,
      background: primary ? C.accent : 'transparent',
      color: primary ? '#fff' : C.inkMute,
    }),
    voteBtn: (active) => ({
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontFamily: F.mono, fontSize: 11, fontWeight: 600,
      background: active ? `${C.forest}18` : 'transparent',
      border: `1px solid ${active ? C.forest : C.rule}`,
      color: active ? C.forest : C.inkMute,
      borderRadius: 99, padding: '5px 12px', cursor: 'pointer',
    }),
  }

  function handleSearch(e) { if (e.key === 'Enter') loadQuestions() }

  if (view === 'ask') return (
    <div style={S.page}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <button onClick={() => setView('list')} style={{ ...S.btn(false), padding: '8px 16px' }}>← Back</button>
        <PageHead eyebrow="Community knowledge" title="Ask a" em="question." />
      </div>
      {!isPaid && (
        <div style={{ background: `${C.accent}12`, border: `1px solid ${C.accent}40`, borderRadius: 8, padding: '16px 20px', marginBottom: 24 }}>
          <p style={{ fontFamily: F.body, fontSize: 14, color: C.accent, margin: 0 }}>
            Posting questions requires a paid plan.
            <button onClick={() => setRoute('billing')} style={{ ...S.btn(true), padding: '6px 14px', fontSize: 11, marginLeft: 12 }}>Upgrade →</button>
          </p>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 640 }}>
        <div>
          <div style={mono({ fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.inkMute, marginBottom: 8 })}>Question title *</div>
          <input style={S.input} placeholder="e.g. Best CCT for hotel lobbies?" value={askTitle} onChange={e => setAskTitle(e.target.value)} maxLength={200} disabled={!isPaid}/>
          <div style={mono({ fontSize: 9, color: C.inkMute, marginTop: 4, textAlign: 'right' })}>{askTitle.length}/200</div>
        </div>
        <div>
          <div style={mono({ fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.inkMute, marginBottom: 8 })}>Details (optional)</div>
          <textarea style={{ ...S.input, minHeight: 120, resize: 'vertical', lineHeight: 1.6 }} placeholder="Add context, specs, project type..." value={askBody} onChange={e => setAskBody(e.target.value)} maxLength={2000} disabled={!isPaid}/>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <div style={mono({ fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.inkMute, marginBottom: 8 })}>Market *</div>
            <select style={S.input} value={askMarket} onChange={e => { setAskMarket(e.target.value); setAskFixture('') }} disabled={!isPaid}>
              <option value="">Select market...</option>
              {MARKETS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <div style={mono({ fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.inkMute, marginBottom: 8 })}>Fixture type</div>
            <select style={S.input} value={askFixture} onChange={e => setAskFixture(e.target.value)} disabled={!isPaid || !askMarket}>
              <option value="">Select type...</option>
              {(FIXTURE_TYPES[askMarket] || []).map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input type="checkbox" id="askAnon" checked={askAnon} onChange={e => setAskAnon(e.target.checked)} disabled={!isPaid}/>
          <label htmlFor="askAnon" style={{ fontFamily: F.body, fontSize: 13, color: C.inkMute, cursor: 'pointer' }}>Post anonymously</label>
        </div>
        {askError && <div style={{ fontFamily: F.body, fontSize: 13, color: C.accent, padding: '10px 14px', background: `${C.accent}12`, borderRadius: 6 }}>{askError}</div>}
        <div style={{ display: 'flex', gap: 12, paddingTop: 8 }}>
          <button onClick={submitQuestion} disabled={askLoading || !isPaid} style={S.btn(true)}>{askLoading ? 'Posting...' : 'Post question →'}</button>
          <button onClick={() => setView('list')} style={S.btn(false)}>Cancel</button>
        </div>
      </div>
    </div>
  )

  if (view === 'question' && activeQuestion) return (
    <div style={S.page}>
      <button onClick={() => { setView('list'); setActiveQuestion(null); setAnswers([]) }} style={{ ...S.btn(false), padding: '8px 16px', marginBottom: 24 }}>← All questions</button>
      <div style={{ background: C.paper, border: `1px solid ${C.rule}`, borderRadius: 10, padding: '28px 32px', marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          <span style={S.pill(MARKET_COLORS[activeQuestion.market] || C.accent)}>{activeQuestion.market}</span>
          {activeQuestion.fixture_type && <span style={S.pill(C.inkMute)}>{activeQuestion.fixture_type}</span>}
          {activeQuestion.is_answered && <span style={S.pill(C.forest)}>✓ Answered</span>}
        </div>
        <h2 style={{ fontFamily: F.display, fontWeight: 700, fontSize: 22, letterSpacing: '-0.015em', color: C.ink, margin: '0 0 12px', lineHeight: 1.3 }}>{activeQuestion.title}</h2>
        {activeQuestion.body && <p style={{ fontFamily: F.body, fontSize: 14, color: C.inkMute, lineHeight: 1.7, margin: '0 0 16px' }}>{activeQuestion.body}</p>}
        <div style={mono({ fontSize: 9, color: C.inkMute })}>Asked by {displayName(activeQuestion)} · {timeAgo(activeQuestion.created_at)} · {activeQuestion.view_count} views · {activeQuestion.answer_count} answers</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
          <button
            onClick={() => toggleVote(activeQuestion.id, 'question')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontFamily: F.mono, fontSize: 11, fontWeight: 600,
              background: userVotes.has(activeQuestion.id) ? `${C.forest}18` : 'transparent',
              border: `1px solid ${userVotes.has(activeQuestion.id) ? C.forest : C.rule}`,
              color: userVotes.has(activeQuestion.id) ? C.forest : C.inkMute,
              borderRadius: 99, padding: '5px 12px', cursor: 'pointer',
            }}
          >
            ▲ {activeQuestion.vote_count || 0} helpful
          </button>
          <span style={mono({ fontSize: 9, color: C.inkMute })}>
            {activeQuestion.is_answered ? '✓ This question has an accepted answer' : 'Be the first to answer'}
          </span>
        </div>
      </div>
      <div style={mono({ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.inkMute, marginBottom: 14 })}>{answers.length} {answers.length === 1 ? 'answer' : 'answers'}</div>
      {answers.map(ans => (
        <div key={ans.id} style={{
          background: ans.is_accepted ? `${C.forest}0a` : C.paper,
          border: ans.is_accepted ? `2px solid ${C.forest}` : `1px solid ${C.rule}`,
          borderRadius: 8, padding: '20px 24px', marginBottom: 12,
        }}>
          {ans.is_accepted && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontFamily: F.mono, fontSize: 9, letterSpacing: '0.14em',
              textTransform: 'uppercase', color: C.forest, marginBottom: 10,
            }}>
              <span style={{ fontSize: 14 }}>📌</span>
              Accepted answer — pinned by question author
            </div>
          )}
          <p style={{ fontFamily: F.body, fontSize: 14, color: C.ink, lineHeight: 1.75, margin: '0 0 16px' }}>{ans.body}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button onClick={() => toggleVote(ans.id, 'answer')} style={S.voteBtn(userVotes.has(ans.id))}>▲ {ans.vote_count} {ans.vote_count === 1 ? 'vote' : 'votes'}</button>
            {user?.id === activeQuestion.user_id && !ans.is_accepted && (
              <button onClick={() => acceptAnswer(ans.id)} style={{ ...S.voteBtn(false), borderColor: C.forest, color: C.forest }}>✓ Accept this answer</button>
            )}
            <span style={mono({ fontSize: 9, color: C.inkMute })}>{displayName(ans)} · {timeAgo(ans.created_at)}</span>
          </div>
        </div>
      ))}
      {answers.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: C.inkMute }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>◈</div>
          <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 16, color: C.ink }}>No answers yet</div>
          <div style={{ fontFamily: F.body, fontSize: 13, marginTop: 6 }}>Be the first to help the community</div>
        </div>
      )}
      {isPaid ? (
        <div style={{ marginTop: 32, background: C.paper, border: `1px solid ${C.rule}`, borderRadius: 8, padding: '24px 28px' }}>
          <div style={mono({ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.inkMute, marginBottom: 14 })}>Your answer</div>
          <textarea style={{ ...S.input, minHeight: 100, resize: 'vertical', lineHeight: 1.6, marginBottom: 12 }} placeholder="Share your knowledge..." value={answerBody} onChange={e => setAnswerBody(e.target.value)} maxLength={2000}/>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <button onClick={submitAnswer} disabled={answerLoading || !answerBody.trim()} style={S.btn(true)}>{answerLoading ? 'Posting...' : 'Post answer →'}</button>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: F.body, fontSize: 13, color: C.inkMute, cursor: 'pointer' }}>
              <input type="checkbox" checked={answerAnon} onChange={e => setAnswerAnon(e.target.checked)}/> Post anonymously
            </label>
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 24, padding: '16px 20px', background: `${C.accent}10`, border: `1px solid ${C.accent}30`, borderRadius: 8 }}>
          <p style={{ fontFamily: F.body, fontSize: 14, color: C.accent, margin: 0 }}>
            Upgrade to a paid plan to post answers.
            <button onClick={() => setRoute('billing')} style={{ ...S.btn(true), padding: '6px 14px', fontSize: 11, marginLeft: 12 }}>Upgrade →</button>
          </p>
        </div>
      )}
    </div>
  )

  return (
    <div style={S.page}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <PageHead eyebrow="LC · Community" title="Knowledge" em="hub." />
        <div>
          {isPaid && (
            <button onClick={() => setView('ask')} style={{ fontFamily: F.display, fontWeight: 700, fontSize: 13, background: C.accent, color: '#fff', border: 'none', borderRadius: 99, padding: '11px 22px', cursor: 'pointer' }}>
              + Ask a question
            </button>
          )}
          {!isPaid && (
            <button onClick={() => setRoute('billing')} style={{ fontFamily: F.display, fontWeight: 600, fontSize: 13, background: 'transparent', color: C.inkMute, border: `1px solid ${C.rule}`, borderRadius: 99, padding: '11px 22px', cursor: 'pointer' }}>
              Upgrade to ask →
            </button>
          )}
        </div>
      </div>
      {initialFilter === 'open' && (
        <div style={{ background: `${C.accent}10`, border: `1px solid ${C.accent}30`, borderRadius: 8, padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20 }}>❓</span>
          <div>
            <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 14, color: C.ink }}>
              {openQuestionCount || '...'} open questions need answers
            </div>
            <div style={{ fontFamily: F.body, fontSize: 12, color: C.inkMute }}>
              Share your expertise — pick a question and post your answer.
            </div>
          </div>
        </div>
      )}
      <div style={{ background:`${C.forest}0f`, border:`1px solid ${C.forest}30`, borderRadius:10, padding:'20px 24px', marginBottom:24, display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:20 }}>
        <div>
          <div style={mono({ fontSize:9, letterSpacing:'0.18em', textTransform:'uppercase', color:C.forest, marginBottom:8 })}>What this is</div>
          <p style={{ fontFamily:F.body, fontSize:13, color:C.inkMute, lineHeight:1.7, margin:0 }}>A peer knowledge base for LC · Lighting Master members. Ask real-world lighting questions and get answers from fellow professionals studying for the NCQLP exam.</p>
        </div>
        <div>
          <div style={mono({ fontSize:9, letterSpacing:'0.18em', textTransform:'uppercase', color:C.forest, marginBottom:8 })}>How to use it</div>
          <p style={{ fontFamily:F.body, fontSize:13, color:C.inkMute, lineHeight:1.7, margin:0 }}>Browse by market or fixture type. Click any question to read answers and add your own. Vote on answers to surface the best ones. The question author can mark one answer as accepted — it always stays at the top.</p>
        </div>
        <div>
          <div style={mono({ fontSize:9, letterSpacing:'0.18em', textTransform:'uppercase', color:C.forest, marginBottom:8 })}>Ground rules</div>
          <p style={{ fontFamily:F.body, fontSize:13, color:C.inkMute, lineHeight:1.7, margin:0 }}>Keep questions specific and lighting-related. No vendor promotion. One vote per answer. Posting requires a paid plan — free tier members can read all questions and answers.</p>
        </div>
      </div>
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.inkMute, fontSize: 16 }}>⌕</span>
        <input style={{ ...S.input, paddingLeft: 42 }} placeholder="Search questions..." value={searchQ} onChange={e => setSearchQ(e.target.value)} onKeyDown={handleSearch}/>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <select style={{ ...S.input, width: 'auto', padding: '8px 12px', fontSize: 12 }} value={filterMarket} onChange={e => { setFilterMarket(e.target.value); setFilterFixture('All') }}>
          <option value="All">All markets</option>
          {MARKETS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select style={{ ...S.input, width: 'auto', padding: '8px 12px', fontSize: 12 }} value={filterFixture} onChange={e => setFilterFixture(e.target.value)} disabled={filterMarket === 'All'}>
          <option value="All">All fixture types</option>
          {(FIXTURE_TYPES[filterMarket] || []).map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        {['All','Open','Answered'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} style={{ fontFamily: F.display, fontWeight: 600, fontSize: 12, borderRadius: 99, padding: '8px 16px', cursor: 'pointer', border: `1px solid ${filterStatus === s ? C.ink : C.rule}`, background: filterStatus === s ? C.ink : 'transparent', color: filterStatus === s ? C.cream : C.inkMute }}>{s}</button>
        ))}
      </div>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: C.inkMute, fontFamily: F.mono, fontSize: 12 }}>Loading questions...</div>
      ) : questions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>◈</div>
          <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 18, color: C.ink }}>No questions yet</div>
          <div style={{ fontFamily: F.body, fontSize: 14, color: C.inkMute, marginTop: 8 }}>
            {isPaid ? 'Be the first to ask a question in this category.' : 'Upgrade to a paid plan to post questions.'}
          </div>
        </div>
      ) : questions.map(q => (
        <div key={q.id} style={S.card} onClick={() => openQuestion(q)}
          onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)'}
          onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            <span style={S.pill(MARKET_COLORS[q.market] || C.accent)}>{q.market}</span>
            {q.fixture_type && <span style={S.pill(C.inkMute)}>{q.fixture_type}</span>}
            {q.is_answered && <span style={S.pill(C.forest)}>✓ Answered</span>}
          </div>
          <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 16, color: C.ink, marginBottom: 8, lineHeight: 1.35 }}>{q.title}</div>
          {q.body && <div style={{ fontFamily: F.body, fontSize: 13, color: C.inkMute, lineHeight: 1.6, marginBottom: 10, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{q.body}</div>}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <span style={mono({ fontSize: 10, color: C.inkMute })}>{q.answer_count} {q.answer_count === 1 ? 'answer' : 'answers'}</span>
            <span style={mono({ fontSize: 10, color: C.inkMute })}>{q.view_count} views</span>
            <span style={mono({ fontSize: 10, color: C.inkMute, marginLeft: 'auto' })}>{timeAgo(q.created_at)}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function TrendsPage({ setRoute }) {
  const supabase = createClient()
  const [trends, setTrends] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('community_trends')
        .select('*')
        .order('question_count', { ascending: false })
        .limit(50)
      setTrends(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const MARKET_COLORS = {
    'Commercial': C.accent, 'Residential': '#7a9a6a',
    'Hospitality': '#9a6a7a', 'Healthcare': '#6a7a9a',
    'Industrial': '#8a7a4a', 'Sports': '#4a8a7a',
    'Outdoor/Street': C.forest,
  }

  const maxCount = Math.max(...trends.map(t => t.question_count), 1)

  return (
    <div style={{ padding: '32px 36px', maxWidth: 860 }}>
      <PageHead eyebrow="Community · Analytics" title="Trending" em="topics." />
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: C.inkMute, fontFamily: F.mono, fontSize: 12 }}>Loading trends...</div>
      ) : trends.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 18, color: C.ink }}>No data yet</div>
          <div style={{ fontFamily: F.body, fontSize: 14, color: C.inkMute, marginTop: 8 }}>Trends will appear as the community posts questions.</div>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 36 }}>
            {[
              { label: 'Total questions', val: trends.reduce((s,t)=>s+Number(t.question_count),0) },
              { label: 'Total answers', val: trends.reduce((s,t)=>s+Number(t.total_answers||0),0) },
              { label: 'Answered rate', val: Math.round(trends.reduce((s,t)=>s+Number(t.answered_count||0),0)/Math.max(trends.reduce((s,t)=>s+Number(t.question_count),0),1)*100)+'%' },
            ].map(c => (
              <div key={c.label} style={{ background: C.paper, border: `1px solid ${C.rule}`, borderRadius: 8, padding: '20px 24px' }}>
                <div style={mono({ fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.inkMute, marginBottom: 8 })}>{c.label}</div>
                <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 28, color: C.ink, letterSpacing: '-0.02em' }}>{c.val}</div>
              </div>
            ))}
          </div>
          <div style={mono({ fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.inkMute, marginBottom: 16 })}>Questions by market &amp; fixture type</div>
          <div style={{ background: C.paper, border: `1px solid ${C.rule}`, borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 80px 80px', padding: '10px 20px', borderBottom: `1px solid ${C.rule}`, background: C.creamWarm }}>
              {['Market','Fixture type','Questions','Answers','Answered'].map(h => (
                <div key={h} style={mono({ fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.inkMute })}>{h}</div>
              ))}
            </div>
            {trends.map((t, i) => {
              const color = MARKET_COLORS[t.market] || C.accent
              const barW = Math.round((t.question_count / maxCount) * 100)
              return (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 80px 80px', padding: '12px 20px', alignItems: 'center', borderBottom: i < trends.length-1 ? `1px solid ${C.rule}` : 'none', background: i%2===0 ? 'transparent' : `${C.creamWarm}60` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }}/>
                    <span style={{ fontFamily: F.display, fontWeight: 600, fontSize: 13, color: C.ink }}>{t.market}</span>
                  </div>
                  <div style={{ fontFamily: F.body, fontSize: 13, color: C.inkMute }}>{t.fixture_type || '—'}</div>
                  <div>
                    <div style={{ fontFamily: F.display, fontWeight: 700, fontSize: 14, color: C.ink, marginBottom: 4 }}>{t.question_count}</div>
                    <div style={{ height: 3, background: C.rule, borderRadius: 99, width: 48, overflow: 'hidden' }}>
                      <div style={{ width: `${barW}%`, height: '100%', background: color, borderRadius: 99 }}/>
                    </div>
                  </div>
                  <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 14, color: C.ink }}>{t.total_answers || 0}</div>
                  <div>
                    <span style={{ display: 'inline-block', fontFamily: F.mono, fontSize: 10, padding: '3px 8px', borderRadius: 99, background: t.answered_count > 0 ? `${C.forest}18` : C.rule, color: t.answered_count > 0 ? C.forest : C.inkMute }}>
                      {t.answered_count || 0}/{t.question_count}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

function AppShell({user, setUser, onSignOut, completedLessons=new Set(), markLessonComplete=async()=>{}, bookmarks=new Set(), toggleBookmark=async()=>{}}){
  const [route, setRoute] = useState("home")
  const [showUpgrade, setShowUpgrade] = useState(false)
  const isMobile = useIsMobile()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [openQuestionCount, setOpenQuestionCount] = useState(0)

  useEffect(() => {
    if (!user) return
    supabase
      .from('community_questions')
      .select('id', { count: 'exact', head: true })
      .eq('is_answered', false)
      .then(({ count }) => setOpenQuestionCount(count || 0))
  }, [user])
  useEffect(()=>{
    if(route==='continue'){
      const next = getNextLesson(completedLessons)
      if(next) setRoute('lesson-'+next.ref)
    }
  },[route])
  return(
    <div style={{display:"flex",minHeight:"100vh",position:"relative",
      fontFamily:F.body,background:C.cream}}>
      <style>{`@import url('${FONT_URL}');*{box-sizing:border-box}code{font-family:${F.mono};font-size:0.9em;background:rgba(0,0,0,0.06);padding:1px 5px;border-radius:3px}@keyframes bulbPulse{0%,100%{opacity:1;box-shadow:0 0 0 3px rgba(198,90,58,0.2),0 0 10px 2px rgba(198,90,58,0.4)}50%{opacity:0.7;box-shadow:0 0 0 5px rgba(198,90,58,0.1),0 0 16px 4px rgba(198,90,58,0.25)}}@keyframes wave{from{transform:scaleY(0.4)}to{transform:scaleY(1.2)}}`}</style>
      {showUpgrade && <UpgradeModal user={user} onClose={()=>setShowUpgrade(false)}/>}
      <Sidebar route={route} setRoute={setRoute} user={user} onSignOut={onSignOut} bookmarks={bookmarks} isMobile={isMobile} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} openQuestionCount={openQuestionCount}/>
      {isMobile && sidebarOpen && (
        <div onClick={()=>setSidebarOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:999,backdropFilter:"blur(2px)"}}/>
      )}
      <main style={{background:C.cream,minHeight:"100vh",overflowX:"hidden",flex:1,width:isMobile?"100%":"calc(100vw - 220px)",maxWidth:"100%"}}>
        {isMobile && (
          <div style={{position:"sticky",top:0,zIndex:100,background:C.ink,padding:"0 16px",height:52,display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
            <button onClick={()=>setSidebarOpen(true)} style={{background:"none",border:"none",cursor:"pointer",padding:"8px",display:"flex",flexDirection:"column",gap:5,alignItems:"flex-start"}}>
              <span style={{display:"block",width:22,height:2,background:C.cream,borderRadius:2}}/>
              <span style={{display:"block",width:16,height:2,background:C.cream,borderRadius:2}}/>
              <span style={{display:"block",width:20,height:2,background:C.cream,borderRadius:2}}/>
            </button>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <img src="/brand/logo-transparent.png" alt=""
                style={{width:26,height:26,flexShrink:0,borderRadius:6,border:"1px solid rgba(242,230,218,0.28)",boxShadow:"0 0 10px rgba(232,160,32,0.35), 0 0 3px rgba(242,230,218,0.15)"}}/>
              <span style={{fontFamily:F.display,fontWeight:700,fontSize:15,color:C.cream,letterSpacing:"-0.01em"}}>
                LC · <em style={{fontStyle:"normal",color:C.accent}}>Lighting Master</em>
              </span>
            </div>
            <div style={{width:38}}/>
          </div>
        )}
        {route==="home"&&user?.plan==="team_admin"  && <TeamAdminDashboard user={user} setRoute={setRoute}/>}
        {route==="home"&&user?.plan==="team_member" && <TeamMemberView user={user} setRoute={setRoute}/>}
        {route==="home"&&user?.plan!=="team_admin"&&user?.plan!=="team_member" && <Dashboard setRoute={setRoute} user={user} completedLessons={completedLessons} isMobile={isMobile}/>}
        {route==="search"    && <SearchPage setRoute={setRoute} user={user} setShowUpgrade={setShowUpgrade}/>}
        {route==="bookmarks" && <BookmarksPage setRoute={setRoute} bookmarks={bookmarks} toggleBookmark={toggleBookmark}/>}
        {route==="notes"     && <NotesPage setRoute={setRoute} user={user}/>}
        {route==="continue"  && <ContinuePage setRoute={setRoute} completedLessons={completedLessons}/>}
        {route==="exam"      && <ExamPage setRoute={setRoute} user={user} userSubscription={user?.plan ? {plan:user.plan,exam_addon:user.examAddon||false,status:user.status||'active'} : null} isMobile={isMobile}/>}
        {route==="cert"      && <CertPage setRoute={setRoute} user={user} completedLessons={completedLessons} userSubscription={user?.plan ? {plan:user.plan,current_period_end:null} : null}/>}
        {route==="account"   && <AccountPage user={user} setUser={setUser} setRoute={setRoute}/>}
        {route==="community"       && <CommunityPage setRoute={setRoute} user={user} userSubscription={user?.plan?{plan:user.plan}:null}/>}
        {route==="open-questions"  && <CommunityPage setRoute={setRoute} user={user} userSubscription={user?.plan?{plan:user.plan}:null} initialFilter="open"/>}
        {route==="trends"    && <TrendsPage setRoute={setRoute}/>}
        {route==="feedback"  && <FeedbackPage user={user} userSubscription={user?.plan ? {plan:user.plan} : null}/>}
        {route.startsWith("lesson-") && <LessonPage lessonRef={route.replace("lesson-","")} setRoute={setRoute} user={user} setShowUpgrade={setShowUpgrade} completedLessons={completedLessons} markLessonComplete={markLessonComplete} bookmarks={bookmarks} toggleBookmark={toggleBookmark} isMobile={isMobile}/>}
      </main>
    </div>
  )
}

// SQL to run in Supabase:
// CREATE TABLE public.feedback (
//   id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
//   user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
//   category text NOT NULL,
//   subject text NOT NULL,
//   message text NOT NULL,
//   user_email text,
//   plan text,
//   status text DEFAULT 'new',
//   created_at timestamptz DEFAULT now() NOT NULL
// );
// ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
// CREATE POLICY "Users insert own feedback" ON public.feedback
//   FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
// CREATE POLICY "Service role reads feedback" ON public.feedback
//   FOR SELECT USING (false); -- only readable via service role

const FEEDBACK_CATEGORIES = [
  { value: 'bug',      label: '🐛  Bug report',        desc: 'Something is broken or not working as expected' },
  { value: 'feature',  label: '💡  Feature request',    desc: 'Suggest an improvement or new functionality' },
  { value: 'content',  label: '📚  Content feedback',   desc: 'Error in a lesson, question, or visual' },
  { value: 'discount', label: '🎓  Student discount',   desc: 'Request a 25% student discount' },
  { value: 'billing',  label: '💳  Billing question',   desc: 'Question about payment, access, or refunds' },
  { value: 'other',    label: '✉  Other',              desc: 'Anything else you want to share' },
]

function FeedbackPage({ user, userSubscription }) {
  const supabase = createClient()
  const [category, setCategory] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState(user?.email || '')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!category) { setError('Please select a category.'); return }
    if (!subject.trim()) { setError('Please add a subject.'); return }
    if (!message.trim() || message.trim().length < 10) {
      setError('Message must be at least 10 characters.'); return
    }
    if (!email.trim()) { setError('Please enter your email so we can reply.'); return }
    setSending(true); setError('')
    const { error: dbError } = await supabase.from('feedback').insert({
      user_id: user?.id || null,
      category,
      subject: subject.trim(),
      message: message.trim(),
      user_email: email.trim(),
      plan: userSubscription?.plan || 'free',
    })
    if (dbError) {
      setError('Failed to send. Please try again or email admin@luxartmedia.com directly.')
      setSending(false)
      return
    }
    setSending(false)
    setSent(true)
  }

  const S = {
    input: {
      width: '100%', fontFamily: F.body, fontSize: 14,
      color: C.ink, background: C.paper,
      border: `1px solid ${C.rule}`, borderRadius: 6,
      padding: '10px 14px', outline: 'none',
      boxSizing: 'border-box', lineHeight: 1.5,
    },
    label: mono({ fontSize: 9, letterSpacing: '0.16em',
      textTransform: 'uppercase', color: C.inkMute, marginBottom: 8,
      display: 'block' }),
  }

  if (sent) return (
    <div style={{ padding: '32px 36px', maxWidth: 600 }}>
      <div style={{ background: `${C.forest}10`, border: `1px solid ${C.forest}40`,
        borderRadius: 12, padding: '48px 40px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>✓</div>
        <h2 style={{ fontFamily: F.display, fontWeight: 700, fontSize: 24,
          color: C.ink, margin: '0 0 12px', letterSpacing: '-0.015em' }}>
          Message sent
        </h2>
        <p style={{ fontFamily: F.body, fontSize: 15, color: C.inkMute,
          lineHeight: 1.7, margin: '0 0 8px' }}>
          Thanks for reaching out. We read every message and typically
          reply within 1–2 business days.
        </p>
        <p style={{ fontFamily: F.body, fontSize: 14, color: C.inkMute,
          lineHeight: 1.7, margin: '0 0 28px' }}>
          You'll hear back at <strong style={{ color: C.ink }}>{email}</strong>
        </p>
        <button
          onClick={() => { setSent(false); setCategory(''); setSubject('');
            setMessage(''); setError('') }}
          style={{ fontFamily: F.display, fontWeight: 700, fontSize: 13,
            borderRadius: 99, padding: '10px 24px', cursor: 'pointer',
            border: `1px solid ${C.rule}`, background: 'transparent',
            color: C.inkMute }}>
          Send another message
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ padding: '32px 36px', maxWidth: 680 }}>
      <div style={{ marginBottom: 32 }}>
        <div style={mono({ fontSize: 9, letterSpacing: '0.24em',
          textTransform: 'uppercase', color: C.accent, marginBottom: 12 })}>
          LC · Lighting Master
        </div>
        <h1 style={{ fontFamily: F.display, fontWeight: 700, fontSize: 36,
          letterSpacing: '-0.02em', color: C.ink, margin: '0 0 10px', lineHeight: 1 }}>
          Send us <em style={{ fontStyle: 'normal', color: C.accent }}>feedback.</em>
        </h1>
        <p style={{ fontFamily: F.body, fontSize: 14, color: C.inkMute,
          lineHeight: 1.7, margin: 0, maxWidth: 480 }}>
          Found a bug? Have a suggestion? Asking about a student discount?
          We read every message and reply personally from
          {' '}<a href="mailto:admin@luxartmedia.com"
            style={{ color: C.accent, textDecoration: 'none' }}>
            admin@luxartmedia.com
          </a>
        </p>
      </div>

      <div style={{ marginBottom: 24 }}>
        <span style={S.label}>What is this about?</span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {FEEDBACK_CATEGORIES.map(cat => (
            <button key={cat.value}
              onClick={() => setCategory(cat.value)}
              style={{
                textAlign: 'left', padding: '14px 16px',
                borderRadius: 8, cursor: 'pointer',
                border: `1.5px solid ${category === cat.value ? C.accent : C.rule}`,
                background: category === cat.value ? `${C.accent}08` : C.paper,
                transition: 'border-color 150ms, background 150ms',
              }}>
              <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 13,
                color: category === cat.value ? C.accent : C.ink, marginBottom: 4 }}>
                {cat.label}
              </div>
              <div style={{ fontFamily: F.body, fontSize: 11,
                color: C.inkMute, lineHeight: 1.5 }}>
                {cat.desc}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={S.label}>Subject</label>
        <input style={S.input}
          placeholder="Brief summary of your message"
          value={subject}
          onChange={e => setSubject(e.target.value)}
          maxLength={120}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={S.label}>Message</label>
        <textarea style={{ ...S.input, minHeight: 140, resize: 'vertical', lineHeight: 1.7 }}
          placeholder={
            category === 'bug'      ? 'Describe what happened and how to reproduce it...' :
            category === 'feature'  ? 'Describe the feature and why it would help you...' :
            category === 'content'  ? 'Which lesson and what needs to be corrected...' :
            category === 'discount' ? 'Tell us about your situation (school, program, team size)...' :
            category === 'billing'  ? 'Describe your billing question or issue...' :
            'Your message...'
          }
          value={message}
          onChange={e => setMessage(e.target.value)}
          maxLength={2000}
        />
        <div style={mono({ fontSize: 9, color: C.inkMute,
          textAlign: 'right', marginTop: 4 })}>
          {message.length}/2000
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={S.label}>Reply to</label>
        <input style={S.input}
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <div style={mono({ fontSize: 9, color: C.inkMute, marginTop: 6 })}>
          We reply within 1–2 business days.
        </div>
      </div>

      {userSubscription && (
        <div style={{ background: C.creamWarm, border: `1px solid ${C.rule}`,
          borderRadius: 6, padding: '10px 14px', marginBottom: 20,
          display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={mono({ fontSize: 9, color: C.inkMute })}>Sending as:</span>
          <span style={{ fontFamily: F.display, fontWeight: 600,
            fontSize: 12, color: C.ink }}>
            {user?.email}
          </span>
          <span style={{ fontFamily: F.mono, fontSize: 9,
            background: `${C.accent}15`, color: C.accent,
            padding: '2px 8px', borderRadius: 99, marginLeft: 'auto' }}>
            {userSubscription.plan?.toUpperCase() || 'FREE'} plan
          </span>
        </div>
      )}

      {error && (
        <div style={{ fontFamily: F.body, fontSize: 13, color: C.accent,
          padding: '10px 14px', background: `${C.accent}10`,
          borderRadius: 6, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <button onClick={handleSubmit} disabled={sending}
        style={{ fontFamily: F.display, fontWeight: 700, fontSize: 14,
          borderRadius: 99, padding: '13px 32px', cursor: sending ? 'wait' : 'pointer',
          border: 'none', background: sending ? C.inkMute : C.accent,
          color: '#fff', transition: 'background 150ms' }}>
        {sending ? 'Sending...' : 'Send message →'}
      </button>
    </div>
  )
}

/* ══════════════════════════════════════════
   ROOT — wires landing ↔ auth ↔ app
══════════════════════════════════════════ */
function LearnerRoot({onAdminClick=()=>{}}){
  const [page, setPage] = useState("landing")   // landing | app
  const [authMode, setAuthMode] = useState(null) // null | signin | signup
  const [user, setUser] = useState(null)
  const [completedLessons, setCompletedLessons] = useState(new Set())
  const [bookmarks, setBookmarks] = useState(new Set())
  const [legalDoc, setLegalDoc] = useState(null) // null | privacy | terms | cookies | refund
  const [successToast, setSuccessToast] = useState(null)
  const [sessionConflict, setSessionConflict] = useState(null)
  const [purchaseSuccess, setPurchaseSuccess] = useState(null)

  async function loadSubscription(){
    const { data:{ session } } = await supabase.auth.getSession()
    if(!session) return
    const u = session.user
    const { data:sub } = await supabase.from("subscriptions").select("*").eq("user_id", u.id).single()
    if(sub) setUser(prev=>prev?{...prev,plan:sub.plan,examAddon:sub.exam_addon||false}:prev)
  }

  function openAuth(mode){ setAuthMode(mode) }
  function closeAuth(){ setAuthMode(null) }
  function handleAuth(userData){
    setUser(userData)
    setAuthMode(null)
    setPage("app")
  }

  useEffect(()=>{
    supabase.auth.getSession().then(async ({ data:{ session } })=>{
      if(!session) return
      const u = session.user
      const { data:sub } = await supabase.from("subscriptions").select("*").eq("user_id", u.id).single()
      const storedToken = sessionStorage.getItem('lc_session_token')
      if(sub?.session_token && storedToken !== sub.session_token){
        await supabase.auth.signOut()
        sessionStorage.removeItem('lc_session_token')
        setSessionConflict('Your session was ended because another device signed in to this account. Please log in again.')
        setAuthMode('signin')
        return
      }
      setUser({ id:u.id, name:u.user_metadata?.name||u.email.split("@")[0], email:u.email,
                company:u.user_metadata?.company||"", state:u.user_metadata?.state||"",
                plan:sub?.plan||"free", examAddon:sub?.exam_addon||false })
      setPage("app")
    })
    const { data:{ subscription } } = supabase.auth.onAuthStateChange(async (event, session)=>{
      if(event==="SIGNED_OUT"){ setUser(null); setPage("landing") }
    })
    return ()=>subscription.unsubscribe()
  },[])

  useEffect(()=>{
    const params = new URLSearchParams(window.location.search)
    if(params.get("purchase")==="success"){
      const plan = params.get("plan") || "your plan"
      setPurchaseSuccess(plan)
      window.history.replaceState({}, "", "/")
      loadSubscription()
    }
    if(params.get("cancelled")==="true"){
      window.history.replaceState({}, "", "/")
    }
  },[])

  useEffect(()=>{
    if(!user) return
    async function loadProgress(){
      const { data } = await supabase.from('progress').select('lesson_ref').eq('user_id', user.id)
      if(data) setCompletedLessons(new Set(data.map(r=>r.lesson_ref)))
    }
    loadProgress()
  },[user])

  useEffect(()=>{
    if(!user) return
    async function loadBookmarks(){
      const { data } = await supabase.from('bookmarks').select('lesson_ref').eq('user_id', user.id)
      if(data) setBookmarks(new Set(data.map(r=>r.lesson_ref)))
    }
    loadBookmarks()
  },[user])

  async function markLessonComplete(lessonRef){
    if(!user || completedLessons.has(lessonRef)) return
    setCompletedLessons(prev=>new Set([...prev, lessonRef]))
    await supabase.from('progress').upsert(
      { user_id:user.id, lesson_ref:lessonRef, completed_at:new Date().toISOString() },
      { onConflict:'user_id,lesson_ref' }
    )
  }

  async function toggleBookmark(lessonRef){
    if(!user) return
    const isBookmarked = bookmarks.has(lessonRef)
    setBookmarks(prev=>{
      const next = new Set(prev)
      if(isBookmarked) next.delete(lessonRef)
      else next.add(lessonRef)
      return next
    })
    if(isBookmarked){
      await supabase.from('bookmarks').delete().eq('user_id', user.id).eq('lesson_ref', lessonRef)
    } else {
      await supabase.from('bookmarks').upsert(
        { user_id:user.id, lesson_ref:lessonRef, created_at:new Date().toISOString() },
        { onConflict:'user_id,lesson_ref' }
      )
    }
  }

  async function handleSignOut(){
    if(user?.id){
      sessionStorage.removeItem('lc_session_token')
      await supabase.from('subscriptions').update({ session_token: null }).eq('user_id', user.id)
    }
    await supabase.auth.signOut()
    setUser(null)
    setCompletedLessons(new Set())
    setBookmarks(new Set())
    setPage("landing")
  }

  return(
    <>
      <style>{`@import url('${FONT_URL}');*{box-sizing:border-box;margin:0;padding:0}body{background:${C.cream}}a{text-decoration:none}`}</style>

      {successToast&&(
        <div style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",
          zIndex:9999,background:C.forest,color:"#fff",borderRadius:10,
          padding:"12px 22px",fontFamily:F.display,fontWeight:600,fontSize:13,
          boxShadow:"0 4px 20px rgba(0,0,0,0.18)",pointerEvents:"none",
          whiteSpace:"nowrap"}}>
          ✓ {successToast}
        </div>
      )}

      {authMode&&(
        <AuthModal mode={authMode} onClose={closeAuth} onAuth={handleAuth} initialError={sessionConflict} onErrorShown={()=>setSessionConflict(null)}/>
      )}

      {legalDoc&&(
        <LegalModal doc={legalDoc} onClose={()=>setLegalDoc(null)}/>
      )}

      {page==="landing"&&(
        <div style={{fontFamily:F.body,background:C.cream}}>
          <Nav onSignIn={()=>openAuth("signin")} onSignUp={()=>openAuth("signup")}/>
          <Hero onSignUp={()=>openAuth("signup")}/>
          <TrustBar/>
          <Features/>
          <Curriculum/>
          <ExamSection onSignUp={()=>openAuth("signup")}/>
          <Pricing onSignUp={()=>openAuth("signup")}/>
          <Testimonials/>
          <FAQ/>
          <FinalCTA onSignUp={()=>openAuth("signup")}/>
          <Footer onSignIn={()=>openAuth("signin")} onSignUp={()=>openAuth("signup")} onAdminClick={onAdminClick} onLegal={setLegalDoc}/>
        </div>
      )}

      {page==="app"&&purchaseSuccess&&(
        <div style={{background:`${C.forest}18`,border:`1px solid ${C.forest}`,borderRadius:8,padding:"16px 24px",margin:"16px 24px 0",display:"flex",alignItems:"center",justifyContent:"space-between",gap:16}}>
          <div>
            <span style={{fontSize:20,marginRight:10}}>🎉</span>
            <span style={{fontFamily:F.display,fontWeight:700,fontSize:15,color:C.ink}}>
              Payment confirmed — your access is now active!
            </span>
            <span style={{fontFamily:F.body,fontSize:13,color:C.inkMute,marginLeft:10}}>
              Welcome to LC · Lighting Master. Start with lesson 1.1 →
            </span>
          </div>
          <button onClick={()=>setPurchaseSuccess(null)} style={{background:"none",border:"none",cursor:"pointer",fontSize:18,color:C.inkMute,flexShrink:0}}>✕</button>
        </div>
      )}

      {page==="app"&&(
        <AppShell user={user} setUser={setUser} onSignOut={handleSignOut} completedLessons={completedLessons} markLessonComplete={markLessonComplete} bookmarks={bookmarks} toggleBookmark={toggleBookmark}/>
      )}
    </>
  )
}


/* ══ ADMIN PORTAL ══ */

/* ── DESIGN TOKENS — LC brand palette ──────────── */
const AT = {
  bg0:"#F2E6DA",    // page background  → LC cream
  bg1:"#2F4A3F",    // sidebar          → LC ink (Deep Forest)
  bg2:"#F2E6DA",    // main canvas      → LC cream
  bg3:"#FAF5F0",    // card surface     → LC paper
  bg4:"#E8D8C8",    // elevated / hover → LC cream-warm
  border:"#DDD0C0", // default border   → LC rule
  borderHi:"#C8B8A4",// highlighted     → LC rule-strong
  ink:"#2F4A3F",    // primary text     → LC ink
  inkSoft:"#3D5C50",// secondary text   → LC ink-soft
  inkMute:"#7A9688",// muted / labels   → LC ink-mute
  accent:"#C65A3A", // Terra Cotta      → updated
  accentDim:"rgba(198,90,58,0.10)",
  green:"#7E9B86",  // success / active → LC forest (Sage)
  greenDim:"rgba(126,155,134,0.10)",
  amber:"#e8a020",  // warning          → LC amber
  amberDim:"rgba(232,160,32,0.10)",
  red:"#c0392b",    // danger / flagged → deeper red on cream
  redDim:"rgba(192,57,43,0.08)",
  blue:"#2563eb",   // info
  blueDim:"rgba(37,99,235,0.08)",
  purple:"#7c3aed", // exam tier
  purpleDim:"rgba(124,58,237,0.08)",
  tan:"#DFA688",    // sidebar accent labels → LC tan
}
const AF = {
  sans:"'Inter',sans-serif",
  mono:"'JetBrains Mono',monospace",
  display:"'Space Grotesk',sans-serif",
}
const amono = s => ({fontFamily:AF.mono,...(s||{})})
const asans = s => ({fontFamily:AF.sans,...(s||{})})
const adisp = s => ({fontFamily:AF.display,...(s||{})})

/* ── MOCK DATA ─────────────────────────────────── */
const STATES=["Florida","California","New York","Texas","Illinois","Washington","Colorado","Georgia","Ohio","Pennsylvania","Arizona","Massachusetts"]
const COMPANIES=["Gensler","HLB Lighting","AECOM","Arup","WSP","Lumenpulse","Stantec","HDR","Arcadis","Lam Partners","Luxartmedia","Atelier Ten","Self-employed"]
const PLANS=["free","t1","t2","t3"]
const A_PLAN_LABELS ={free:"Free",t1:"LC Preparation Test",t2:"Full Course",t3:"Full Course+Exam"}
const PLAN_COLORS={free:AT.inkMute,t1:AT.blue,t2:AT.green,t3:AT.purple}
const STATUS_COLORS={active:AT.green,past_due:AT.amber,canceled:AT.red,trialing:AT.blue,free:AT.inkMute}

function rnd(min,max){return Math.floor(Math.random()*(max-min+1))+min}
function pick(arr){return arr[Math.floor(Math.random()*arr.length)]}
function daysAgo(n){const d=new Date();d.setDate(d.getDate()-n);return d.toISOString().split("T")[0]}
function fmtDate(iso){return iso?new Date(iso).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}):'—'}
function fmtMoney(n){return"$"+n.toLocaleString()}

const SEED_USERS = []

const SEED_TEAMS = []


const REVENUE_MONTHS = []

const MODULE_STATS = []

const EXAM_TOPIC_STATS = []

/* ── SHARED PRIMITIVES ─────────────────────────── */
function Badge({label,color,bg}){
  return(
    <span style={{fontFamily:AF.mono,fontSize:10,fontWeight:600,letterSpacing:"0.06em",
      textTransform:"uppercase",color:color||AT.inkSoft,
      background:bg||AT.bg4,
      border:`1px solid ${color||AT.border}`,
      borderRadius:4,padding:"2px 7px",whiteSpace:"nowrap"}}>
      {label}
    </span>
  )
}
function PlanBadge({plan}){
  return <Badge label={A_PLAN_LABELS[plan]||plan} color={PLAN_COLORS[plan]} bg={PLAN_COLORS[plan]+"18"}/>
}
function StatusBadge({status}){
  const c=STATUS_COLORS[status]||AT.inkMute
  return <Badge label={status} color={c} bg={c+"18"}/>
}
function StatCard({label,value,sub,color,trend}){
  return(
    <div style={{background:AT.bg3,border:`1px solid ${AT.border}`,borderRadius:8,padding:"18px 20px"}}>
      <div style={amono({fontSize:9,letterSpacing:"0.22em",textTransform:"uppercase",
        color:AT.inkMute,marginBottom:10})}>{label}</div>
      <div style={adisp({fontWeight:700,fontSize:28,color:color||AT.ink,
        letterSpacing:"-0.02em",lineHeight:1,marginBottom:4})}>{value}</div>
      {sub&&<div style={amono({fontSize:11,color:AT.inkMute})}>{sub}</div>}
      {trend&&<div style={{fontFamily:AF.mono,fontSize:11,
        color:trend>0?AT.green:AT.red,marginTop:4}}>
        {trend>0?"↑":"↓"} {Math.abs(trend)}% vs last month
      </div>}
    </div>
  )
}
function TableHeader({cols}){
  return(
    <div style={{display:"grid",gridTemplateColumns:cols.map(c=>c.w||"1fr").join(" "),
      gap:0,padding:"8px 16px",
      borderBottom:`1px solid ${AT.border}`,
      background:AT.bg3}}>
      {cols.map(c=>(
        <div key={c.label} style={amono({fontSize:9,letterSpacing:"0.18em",
          textTransform:"uppercase",color:AT.inkMute,
          textAlign:c.right?"right":"left",paddingRight:c.right?0:12})}>
          {c.label}
        </div>
      ))}
    </div>
  )
}
function MiniBar({value,max,color}){
  return(
    <div style={{background:AT.bg1,borderRadius:2,height:4,overflow:"hidden",flex:1}}>
      <div style={{background:color||AT.accent,height:4,borderRadius:2,
        width:`${Math.round((value/max)*100)}%`,transition:"width 0.4s"}}/>
    </div>
  )
}
function SectionTitle({children,action}){
  return(
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
      marginBottom:16}}>
      <div style={adisp({fontWeight:700,fontSize:16,color:AT.ink})}>{children}</div>
      {action}
    </div>
  )
}
function Input({value,onChange,placeholder,style={}}){
  return(
    <input value={value} onChange={onChange} placeholder={placeholder}
      style={{background:AT.bg3,border:`1px solid ${AT.border}`,borderRadius:6,
        padding:"8px 12px",fontFamily:AF.mono,fontSize:12,color:AT.ink,
        outline:"none",transition:"border-color 0.15s",...style}}
      onFocus={e=>e.target.style.borderColor=AT.accent}
      onBlur={e=>e.target.style.borderColor=AT.border}/>
  )
}
function A_Btn({children,onClick,variant="ghost",small=false}){
  const styles={
    ghost:{background:"none",border:`1px solid ${AT.border}`,color:AT.inkSoft},
    primary:{background:AT.accent,border:`1px solid ${AT.accent}`,color:"#fff"},
    danger:{background:"none",border:`1px solid ${AT.red}`,color:AT.red},
    green:{background:"none",border:`1px solid ${AT.green}`,color:AT.green},
  }
  return(
    <button onClick={onClick}
      style={{...styles[variant],fontFamily:AF.display,fontWeight:600,
        fontSize:small?11:12,borderRadius:6,
        padding:small?"5px 10px":"7px 14px",cursor:"pointer",
        transition:"all 0.15s",whiteSpace:"nowrap"}}>
      {children}
    </button>
  )
}

/* ── ADMIN LOGIN ───────────────────────────────── */
function AdminLogin({onLogin}){
  const [email,setEmail]=useState("")
  const [pw,setPw]=useState("")
  const [show,setShow]=useState(false)
  const [err,setErr]=useState("")
  const [loading,setLoading]=useState(false)

  async function submit(){
    if(!email||!pw){setErr("Both fields required.");return}
    setLoading(true);setErr("")
    const res=await fetch('/api/admin/login',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({email:email.trim(),password:pw}),
      credentials:'same-origin',
    })
    setLoading(false)
    if(res.ok){onLogin(email.trim())}
    else{setErr("Invalid credentials.")}
  }

  return(
    <div style={{minHeight:"100vh",background:AT.bg0,display:"flex",
      alignItems:"center",justifyContent:"center",fontFamily:AF.sans}}>
      <div style={{background:AT.bg3,border:`1px solid ${AT.border}`,
        borderRadius:12,padding:"40px 36px",width:"100%",maxWidth:380}}>
        <div style={{marginBottom:28}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
            <img
              src="/brand/logo-transparent.png"
              alt="LC Lighting Master"
              style={{width:38,height:38,borderRadius:9,
                border:"1px solid rgba(242,230,218,0.28)",
                boxShadow:"0 0 14px rgba(232,160,32,0.35)",
                flexShrink:0}}/>
            <div>
              <div style={adisp({fontWeight:700,fontSize:14,color:AT.ink})}>Lighting Master</div>
              <div style={amono({fontSize:9,letterSpacing:"0.16em",textTransform:"uppercase",
                color:AT.inkMute})}>Admin Console</div>
            </div>
          </div>
          <div style={{background:AT.amberDim,border:`1px solid ${AT.amber}`,
            borderRadius:6,padding:"8px 12px",display:"flex",gap:8,alignItems:"flex-start"}}>
            <span style={{color:AT.amber,fontSize:12,flexShrink:0}}>⚠</span>
            <span style={amono({fontSize:10,color:AT.amber,lineHeight:1.5})}>
              Restricted access. Admin credentials only.
            </span>
          </div>
        </div>

        {err&&<div style={{background:AT.redDim,border:`1px solid ${AT.red}`,borderRadius:6,
          padding:"8px 12px",fontSize:12,color:AT.red,marginBottom:14,fontFamily:AF.mono}}>{err}</div>}

        <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:18}}>
          <div>
            <div style={amono({fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",
              color:AT.inkMute,marginBottom:6})}>Email</div>
            <Input value={email} onChange={e=>setEmail(e.target.value)}
              placeholder="sample@test.com" style={{width:"100%"}}/>
          </div>
          <div>
            <div style={amono({fontSize:10,letterSpacing:"0.14em",textTransform:"uppercase",
              color:AT.inkMute,marginBottom:6})}>Password</div>
            <div style={{position:"relative"}}>
              <Input value={pw} onChange={e=>setPw(e.target.value)}
                placeholder="••••••••"
                style={{width:"100%",type:show?"text":"password",paddingRight:40}}/>
              <input type={show?"text":"password"} value={pw} onChange={e=>setPw(e.target.value)}
                placeholder="••••••••"
                onKeyDown={e=>e.key==="Enter"&&submit()}
                style={{position:"absolute",inset:0,opacity:0,width:"100%",
                  background:"transparent",border:"none",outline:"none",cursor:"text"}}/>
              <button type="button" onMouseDown={e=>e.preventDefault()}
                onClick={()=>setShow(s=>!s)}
                style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",
                  background:"none",border:"none",cursor:"pointer",
                  fontFamily:AF.mono,fontSize:10,color:AT.inkMute}}>
                {show?"hide":"show"}
              </button>
            </div>
          </div>
        </div>

        <button onClick={submit} disabled={loading}
          style={{width:"100%",padding:"11px",borderRadius:8,border:"none",
            background:AT.accent,color:"#fff",fontFamily:AF.display,fontWeight:700,
            fontSize:13,cursor:loading?"not-allowed":"pointer",opacity:loading?0.7:1}}>
          {loading?"Authenticating…":"Sign in to Admin Console →"}
        </button>
      </div>
    </div>
  )
}

/* ── OVERVIEW ──────────────────────────────────── */
function AdminPlanDonut({stats}){
  const plans=[
    {label:"Free",       key:"free",color:"#DDD0C0"},
    {label:"Practice Test",key:"t1",color:"#7E9B86"},
    {label:"Full Course",key:"t2", color:"#DFA688"},
    {label:"Course+Exam",key:"t3", color:"#C65A3A"},
    {label:"Team",       key:"team",color:"#2F4A3F"},
  ]
  const total=plans.reduce((s,p)=>s+(stats[p.key]||0),0)||1
  const r=54,cx=70,cy=70,circ=2*Math.PI*r
  let offset=0
  const segments=plans.map(p=>{
    const count=stats[p.key]||0
    const pct=count/total
    const dash=pct*circ
    const seg={...p,count,pct,dash,offset}
    offset+=dash
    return seg
  })
  return(
    <div style={{background:AT.bg3,border:`1px solid ${AT.border}`,borderRadius:8,padding:"20px 24px"}}>
      <div style={amono({fontSize:9,letterSpacing:"0.18em",textTransform:"uppercase",color:AT.inkMute,marginBottom:16})}>
        Plan distribution
      </div>
      <div style={{display:"flex",alignItems:"center",gap:24}}>
        <svg width="140" height="140" viewBox="0 0 140 140" style={{flexShrink:0}}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={AT.border} strokeWidth="18"/>
          {segments.map(s=>s.count>0&&(
            <circle key={s.key} cx={cx} cy={cy} r={r}
              fill="none" stroke={s.color} strokeWidth="18"
              strokeLinecap="butt"
              strokeDasharray={`${s.dash} ${circ-s.dash}`}
              strokeDashoffset={circ/4-s.offset}
              style={{transition:"stroke-dasharray 600ms ease"}}
            />
          ))}
          <text x={cx} y={cy-6} textAnchor="middle"
            style={{fontFamily:AF.display,fontWeight:700,fontSize:22,fill:AT.ink}}>{total}</text>
          <text x={cx} y={cy+12} textAnchor="middle"
            style={{fontFamily:AF.mono,fontSize:9,fill:AT.inkMute}}>users</text>
        </svg>
        <div style={{flex:1,display:"flex",flexDirection:"column",gap:8}}>
          {segments.map(s=>(
            <div key={s.key} style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{width:10,height:10,borderRadius:"50%",background:s.color,flexShrink:0,display:"inline-block"}}/>
              <span style={{fontFamily:AF.display,fontWeight:600,fontSize:12,color:AT.ink,flex:1}}>{s.label}</span>
              <span style={amono({fontSize:11,color:AT.inkMute})}>{s.count}</span>
              <span style={amono({fontSize:10,color:AT.inkMute,minWidth:36,textAlign:"right"})}>
                {total>0?Math.round(s.pct*100):0}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Overview({adminStats,onNavigate}){
  if(!adminStats||adminStats.totalUsers===undefined) return(
    <div style={{padding:60,textAlign:"center",fontFamily:AF.mono,fontSize:12,color:AT.inkMute}}>
      Loading dashboard data...
    </div>
  )

  return(
    <div>
      <div style={{marginBottom:28}}>
        <div style={adisp({fontWeight:700,fontSize:22,color:AT.ink,marginBottom:4})}>Overview</div>
        <div style={amono({fontSize:11,color:AT.inkMute})}>
          {new Date().toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}
        </div>
      </div>

      {/* Stat cards — real Supabase data */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:28}}>
        <StatCard label="Total Users"   value={adminStats.totalUsers}                              sub="all accounts"/>
        <StatCard label="Est. Revenue"  value={`$${adminStats.revenue.toLocaleString()}`}          sub="one-time payments" color={AT.green}/>
        <StatCard label="Active (30d)"  value={adminStats.activeUsers}                             sub="lessons in last 30 days"/>
        <StatCard label="Lessons Done"  value={adminStats.totalLessonsCompleted}                   sub="total completions"/>
      </div>

      {/* Plan breakdown */}
      <div style={{display:"grid",gridTemplateColumns:"1.4fr 1fr",gap:16,marginBottom:28}}>
        <AdminPlanDonut stats={adminStats.planCounts||{}}/>
        <div style={{background:AT.bg3,border:`1px solid ${AT.border}`,borderRadius:8,padding:"20px 24px"}}>
          <div style={amono({fontSize:9,letterSpacing:"0.18em",textTransform:"uppercase",color:AT.inkMute,marginBottom:16})}>
            Platform activity
          </div>
          {[
            ["Community questions", adminStats.communityQuestions],
            ["Feedback submissions", adminStats.feedbackCount],
          ].map(([label,val])=>(
            <div key={label} style={{display:"flex",alignItems:"center",
              justifyContent:"space-between",padding:"8px 0",
              borderBottom:`1px solid ${AT.border}`}}>
              <div style={amono({fontSize:11,color:AT.inkSoft})}>{label}</div>
              <div style={adisp({fontWeight:700,fontSize:14,color:AT.ink})}>{val??'—'}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent signups */}
      <div style={{background:AT.bg3,border:`1px solid ${AT.border}`,borderRadius:8,padding:"20px 24px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div style={amono({fontSize:9,letterSpacing:"0.18em",textTransform:"uppercase",color:AT.inkMute})}>
            Recent signups
          </div>
          <button onClick={()=>onNavigate("users")}
            style={{fontFamily:AF.mono,fontSize:9,letterSpacing:"0.12em",textTransform:"uppercase",
              background:"none",border:`1px solid ${AT.border}`,borderRadius:99,
              padding:"4px 12px",color:AT.inkMute,cursor:"pointer",flexShrink:0}}>
            View all →
          </button>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:0}}>
          {(adminStats.recentUsers||[]).map((u,i)=>(
            <div key={u.user_id||i} style={{
              display:"grid",gridTemplateColumns:"1fr auto",gap:12,
              alignItems:"center",padding:"10px 0",
              borderBottom:i<(adminStats.recentUsers.length-1)?`1px solid ${AT.border}`:"none",
            }}>
              <div style={{minWidth:0}}>
                <div style={{fontFamily:AF.display,fontWeight:600,fontSize:13,color:AT.ink,
                  overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {u.email}
                </div>
                <div style={amono({fontSize:9,color:AT.inkMute,marginTop:2})}>
                  {u.created_at?new Date(u.created_at).toLocaleDateString("en-US",
                    {month:"short",day:"numeric",year:"numeric"}):"—"}
                </div>
              </div>
              <span style={{fontFamily:AF.mono,fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",
                background:`${AT.accent}18`,color:AT.accent,padding:"3px 8px",borderRadius:99,flexShrink:0}}>
                {u.plan||"free"}
              </span>
            </div>
          ))}
          {(!adminStats.recentUsers||adminStats.recentUsers.length===0)&&(
            <div style={amono({fontSize:11,color:AT.inkMute,padding:"16px 0",textAlign:"center"})}>
              No users yet
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── USERS TABLE ───────────────────────────────── */
function UsersView({users,setUsers,onSelectUser}){
  const [search,setSearch]=useState("")
  const [planFilter,setPlanFilter]=useState("all")
  const [statusFilter,setStatusFilter]=useState("all")
  const [sortBy,setSortBy]=useState("joinDate")

  const filtered=users
    .filter(u=>{
      const q=search.toLowerCase()
      return !q||(u.firstName||'').toLowerCase().includes(q)||
        (u.lastName||'').toLowerCase().includes(q)||
        (u.email||'').toLowerCase().includes(q)||
        (u.company||'').toLowerCase().includes(q)||
        (u.state||'').toLowerCase().includes(q)
    })
    .filter(u=>planFilter==="all"||u.plan===planFilter)
    .filter(u=>statusFilter==="all"||u.status===statusFilter)
    .sort((a,b)=>{
      if(sortBy==="joinDate") return new Date(b.joinDate)-new Date(a.joinDate)
      if(sortBy==="name") return a.lastName.localeCompare(b.lastName)
      if(sortBy==="progress") return b.progress-a.progress
      if(sortBy==="amount") return b.amount-a.amount
      return 0
    })

  const selectStyle=(val,cur)=>({
    background:cur===val?AT.accent:AT.bg3,
    color:cur===val?"#fff":AT.inkSoft,
    border:`1px solid ${cur===val?AT.accent:AT.border}`,
    fontFamily:AF.mono,fontSize:10,letterSpacing:"0.1em",textTransform:"uppercase",
    padding:"5px 10px",borderRadius:4,cursor:"pointer",
  })

  return(
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
        marginBottom:20,flexWrap:"wrap",gap:12}}>
        <div style={adisp({fontWeight:700,fontSize:22,color:AT.ink})}>
          Users <span style={{color:AT.inkMute,fontSize:16,fontWeight:400}}>({filtered.length})</span>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <Input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search name, email, company…" style={{width:240}}/>
        </div>
      </div>

      {/* Filters */}
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        <div style={{display:"flex",gap:4}}>
          {["all","free","t1","t2","t3"].map(p=>(
            <button key={p} onClick={()=>setPlanFilter(p)} style={selectStyle(p,planFilter)}>
              {p==="all"?"All plans":A_PLAN_LABELS[p]}
            </button>
          ))}
        </div>
        <div style={{display:"flex",gap:4}}>
          {["all","active","free","past_due","canceled"].map(s=>(
            <button key={s} onClick={()=>setStatusFilter(s)} style={selectStyle(s,statusFilter)}>
              {s==="all"?"All status":s.replace("_"," ")}
            </button>
          ))}
        </div>
        <div style={{display:"flex",gap:4,marginLeft:"auto"}}>
          {[["joinDate","Recent"],["name","Name"],["progress","Progress"],["amount","Revenue"]].map(([val,label])=>(
            <button key={val} onClick={()=>setSortBy(val)} style={selectStyle(val,sortBy)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{background:AT.bg3,border:`1px solid ${AT.border}`,borderRadius:8,overflow:"hidden"}}>
        <TableHeader cols={[
          {label:"User",w:"2fr"},{label:"Plan",w:"120px"},
          {label:"Status",w:"110px"},{label:"Progress",w:"150px"},
          {label:"Revenue",w:"90px",right:true},{label:"Joined",w:"110px"},
          {label:"",w:"40px"}
        ]}/>
        {filtered.length===0&&(
          <div style={{padding:"32px",textAlign:"center",color:AT.inkMute,fontFamily:AF.mono,fontSize:12}}>
            No users match your filters.
          </div>
        )}
        {filtered.map((u,i)=>(
          <div key={u.id}
            onClick={()=>onSelectUser(u)}
            style={{display:"grid",
              gridTemplateColumns:"2fr 120px 110px 150px 90px 110px 40px",
              gap:0,padding:"10px 16px",
              borderBottom:i<filtered.length-1?`1px solid ${AT.border}`:"none",
              cursor:"pointer",transition:"background 0.1s"}}
            onMouseEnter={e=>e.currentTarget.style.background=AT.bg4}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:26,height:26,borderRadius:"50%",
                  background:AT.accent+"30",border:`1px solid ${AT.accent}40`,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontFamily:AF.display,fontWeight:700,fontSize:9,color:AT.accent,flexShrink:0}}>
                  {(u.firstName||'?')[0]}{(u.lastName||'')[0]}
                </div>
                <div>
                  <div style={asans({fontSize:13,color:AT.ink,fontWeight:500})}>
                    {u.firstName} {u.lastName}
                    {u.flagged&&<span style={{color:AT.red,fontSize:12,marginLeft:6}}>⚑</span>}
                  </div>
                  <div style={amono({fontSize:10,color:AT.inkMute})}>{u.company} · {u.state}</div>
                </div>
              </div>
            </div>
            <div style={{paddingTop:4}}><PlanBadge plan={u.plan}/></div>
            <div style={{paddingTop:4}}><StatusBadge status={u.status}/></div>
            <div style={{paddingTop:8,paddingRight:16}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <MiniBar value={u.progress} max={100}
                  color={u.progress===100?AT.green:u.progress>50?AT.accent:AT.blue}/>
                <span style={amono({fontSize:10,color:AT.inkMute,flexShrink:0,width:28,textAlign:"right"})}>
                  {u.progress}%
                </span>
              </div>
            </div>
            <div style={amono({fontSize:12,color:u.amount>0?AT.green:AT.inkMute,
              textAlign:"right",paddingTop:4})}>
              {u.amount>0?fmtMoney(u.amount):"—"}
            </div>
            <div style={amono({fontSize:11,color:AT.inkMute,paddingTop:4})}>{fmtDate(u.joinDate)}</div>
            <div style={{paddingTop:4,textAlign:"center",color:AT.inkMute,fontSize:12}}>→</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── USER DETAIL ───────────────────────────────── */
function UserDetail({user,onBack,onUpdate}){
  const [notes,setNotes]=useState(user.notes||"")
  const [saved,setSaved]=useState(false)
  const [planOverride,setPlanOverride]=useState(user.plan)

  function saveNotes(){
    onUpdate({...user,notes})
    setSaved(true)
    setTimeout(()=>setSaved(false),2000)
  }
  function applyOverride(){
    onUpdate({...user,plan:planOverride})
    alert(`Plan updated to ${A_PLAN_LABELS[planOverride]} for ${user.firstName} ${user.lastName}`)
  }
  function toggleFlag(){onUpdate({...user,flagged:!user.flagged})}
  function toggleSuspend(){
    const newStatus=user.status==="suspended"?"active":"suspended"
    onUpdate({...user,status:newStatus})
  }

  return(
    <div>
      <button onClick={onBack} style={{background:"none",border:"none",
        color:AT.inkSoft,cursor:"pointer",fontFamily:AF.mono,fontSize:11,
        marginBottom:20,display:"flex",alignItems:"center",gap:6}}>
        ← Back to users
      </button>

      {/* Header */}
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",
        marginBottom:24,flexWrap:"wrap",gap:16}}>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <div style={{width:52,height:52,borderRadius:"50%",
            background:AT.accent+"30",border:`2px solid ${AT.accent}40`,
            display:"flex",alignItems:"center",justifyContent:"center",
            fontFamily:AF.display,fontWeight:700,fontSize:18,color:AT.accent}}>
            {(user.firstName||'?')[0]}{(user.lastName||'')[0]}
          </div>
          <div>
            <div style={adisp({fontWeight:700,fontSize:22,color:AT.ink,marginBottom:4})}>
              {user.firstName} {user.lastName}
              {user.flagged&&<span style={{color:AT.red,fontSize:14,marginLeft:8}}>⚑ Flagged</span>}
            </div>
            <div style={amono({fontSize:11,color:AT.inkMute})}>{user.email}</div>
            <div style={amono({fontSize:11,color:AT.inkMute})}>{user.company} · {user.state}</div>
          </div>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <Btn onClick={toggleFlag} variant={user.flagged?"green":"danger"} small>
            {user.flagged?"Remove flag":"Flag account"}
          </Btn>
          <Btn onClick={toggleSuspend} variant="danger" small>
            {user.status==="suspended"?"Unsuspend":"Suspend"}
          </Btn>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
        {/* Profile */}
        <div style={{background:AT.bg3,border:`1px solid ${AT.border}`,borderRadius:8,padding:"20px"}}>
          <div style={amono({fontSize:9,letterSpacing:"0.18em",textTransform:"uppercase",
            color:AT.inkMute,marginBottom:14})}>Account info</div>
          {[
            ["User ID",user.id],
            ["Email",user.email],
            ["Company",user.company||'—'],
            ["State",user.state||'—'],
            ["Joined",user.joinDate?fmtDate(user.joinDate):'—'],
            ["Last active",user.lastActive?fmtDate(user.lastActive):'—'],
            ["Stripe ID",user.stripeId||"—"],
          ].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",
              padding:"7px 0",borderBottom:`1px solid ${AT.border}`}}>
              <span style={amono({fontSize:11,color:AT.inkMute})}>{k}</span>
              <span style={amono({fontSize:11,color:AT.inkSoft})}>{v}</span>
            </div>
          ))}
        </div>

        {/* Plan + override */}
        <div style={{background:AT.bg3,border:`1px solid ${AT.border}`,borderRadius:8,padding:"20px"}}>
          <div style={amono({fontSize:9,letterSpacing:"0.18em",textTransform:"uppercase",
            color:AT.inkMute,marginBottom:14})}>Subscription</div>
          {[
            ["Current plan",<PlanBadge plan={user.plan}/>],
            ["Status",<StatusBadge status={user.status}/>],
            ["Amount paid",fmtMoney(user.amount)],
            ["Access expires",`Dec 31, ${new Date().getFullYear()}`],
          ].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",
              alignItems:"center",padding:"7px 0",borderBottom:`1px solid ${AT.border}`}}>
              <span style={amono({fontSize:11,color:AT.inkMute})}>{k}</span>
              <span style={amono({fontSize:11,color:AT.inkSoft})}>{v}</span>
            </div>
          ))}
          <div style={{marginTop:14}}>
            <div style={amono({fontSize:9,letterSpacing:"0.14em",textTransform:"uppercase",
              color:AT.inkMute,marginBottom:8})}>Manual plan override</div>
            <div style={{display:"flex",gap:8}}>
              <select value={planOverride} onChange={e=>setPlanOverride(e.target.value)}
                style={{flex:1,background:AT.bg4,border:`1px solid ${AT.border}`,
                  borderRadius:6,padding:"7px 10px",fontFamily:AF.mono,
                  fontSize:12,color:AT.ink,outline:"none"}}>
                {PLANS.map(p=><option key={p} value={p}>{A_PLAN_LABELS[p]}</option>)}
              </select>
              <Btn onClick={applyOverride} variant="primary" small>Apply</Btn>
            </div>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div style={{background:AT.bg3,border:`1px solid ${AT.border}`,borderRadius:8,
        padding:"20px",marginBottom:16}}>
        <div style={amono({fontSize:9,letterSpacing:"0.18em",textTransform:"uppercase",
          color:AT.inkMute,marginBottom:14})}>Learning progress</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
          {[
            ["Overall",`${user.progress}%`],
            ["Modules done",`${user.modulesCompleted} / 12`],
            ["Exam attempts",user.examAttempts||"0"],
            ["Best exam score",user.examBestScore?`${user.examBestScore}%`:"—"],
          ].map(([k,v])=>(
            <div key={k} style={{background:AT.bg4,borderRadius:6,padding:"12px 14px"}}>
              <div style={amono({fontSize:9,color:AT.inkMute,marginBottom:4})}>{k}</div>
              <div style={adisp({fontWeight:700,fontSize:20,color:AT.ink})}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:4}}>
          {MODULES.map((mod,i)=>{
            const cSet=new Set(user.completedRefs||[])
            const total=mod.lessons.length
            const done=mod.lessons.filter(l=>cSet.has(l.ref)).length
            const full=done===total
            const partial=done>0&&!full
            return(
              <div key={i} style={{background:full?AT.green+"20":partial?AT.accent+"15":AT.bg4,
                border:`1px solid ${full?AT.green+"40":partial?AT.accent+"30":AT.border}`,
                borderRadius:4,padding:"6px",textAlign:"center"}}>
                <div style={amono({fontSize:9,color:full?AT.green:partial?AT.accent:AT.inkMute})}>M{mod.n}</div>
                <div style={amono({fontSize:8,color:AT.inkMute,marginTop:1})}>{done}/{total}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Notes */}
      <div style={{background:AT.bg3,border:`1px solid ${AT.border}`,borderRadius:8,padding:"20px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <div style={amono({fontSize:9,letterSpacing:"0.18em",textTransform:"uppercase",color:AT.inkMute})}>
            Internal notes
          </div>
          <Btn onClick={saveNotes} variant={saved?"green":"ghost"} small>
            {saved?"✓ Saved":"Save notes"}
          </Btn>
        </div>
        <textarea value={notes} onChange={e=>setNotes(e.target.value)}
          placeholder="Add internal notes about this user…"
          style={{width:"100%",minHeight:100,background:AT.bg4,
            border:`1px solid ${AT.border}`,borderRadius:6,
            padding:"10px 12px",fontFamily:AF.mono,fontSize:12,
            color:AT.ink,outline:"none",resize:"vertical",lineHeight:1.6}}
          onFocus={e=>e.target.style.borderColor=AT.accent}
          onBlur={e=>e.target.style.borderColor=AT.border}/>
      </div>
    </div>
  )
}

/* ── SUBSCRIPTIONS ─────────────────────────────── */
function Subscriptions({users}){
  const paid=users.filter(u=>u.amount>0)
  const pastDue=paid.filter(u=>u.status==="past_due")
  const canceled=paid.filter(u=>u.status==="canceled")

  return(
    <div>
      <div style={adisp({fontWeight:700,fontSize:22,color:AT.ink,marginBottom:24})}>Subscriptions</div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:24}}>
        <StatCard label="Active paid" value={paid.filter(u=>u.status==="active").length} color={AT.green}/>
        <StatCard label="Past due" value={pastDue.length} color={pastDue.length>0?AT.amber:AT.green}/>
        <StatCard label="Canceled" value={canceled.length} color={AT.inkMute}/>
        <StatCard label="Total collected" value={fmtMoney(paid.reduce((s,u)=>s+u.amount,0))} color={AT.accent}/>
      </div>

      {pastDue.length>0&&(
        <div style={{marginBottom:24}}>
          <SectionTitle><span style={{color:AT.amber}}>⚠ Past due — follow up required</span></SectionTitle>
          <div style={{background:AT.bg3,border:`1px solid ${AT.amber}`,borderRadius:8,overflow:"hidden"}}>
            <TableHeader cols={[{label:"User",w:"2fr"},{label:"Plan",w:"120px"},
              {label:"Amount",w:"100px"},{label:"Last active",w:"130px"},{label:"Action",w:"120px"}]}/>
            {pastDue.map((u,i)=>(
              <div key={u.id} style={{display:"grid",gridTemplateColumns:"2fr 120px 100px 130px 120px",
                gap:0,padding:"10px 16px",borderBottom:i<pastDue.length-1?`1px solid ${AT.border}`:"none"}}>
                <div><div style={asans({fontSize:13,color:AT.ink,fontWeight:500})}>{u.firstName} {u.lastName}</div><div style={amono({fontSize:10,color:AT.inkMute})}>{u.email}</div></div>
                <div style={{paddingTop:4}}><PlanBadge plan={u.plan}/></div>
                <div style={amono({fontSize:12,color:AT.amber,paddingTop:4})}>{fmtMoney(u.amount)}</div>
                <div style={amono({fontSize:11,color:AT.inkMute,paddingTop:4})}>{fmtDate(u.lastActive)}</div>
                <div style={{paddingTop:2}}><Btn small variant="ghost">Open in Stripe</Btn></div>
              </div>
            ))}
          </div>
        </div>
      )}

      <SectionTitle>All paid subscriptions</SectionTitle>
      <div style={{background:AT.bg3,border:`1px solid ${AT.border}`,borderRadius:8,overflow:"hidden"}}>
        <TableHeader cols={[{label:"User",w:"2fr"},{label:"Plan",w:"120px"},
          {label:"Status",w:"110px"},{label:"Amount",w:"90px",right:true},
          {label:"Stripe ID",w:"140px"},{label:"Expiry",w:"110px"}]}/>
        {paid.sort((a,b)=>new Date(b.joinDate)-new Date(a.joinDate)).map((u,i)=>(
          <div key={u.id} style={{display:"grid",gridTemplateColumns:"2fr 120px 110px 90px 140px 110px",
            gap:0,padding:"10px 16px",borderBottom:i<paid.length-1?`1px solid ${AT.border}`:"none",
            transition:"background 0.1s"}}
            onMouseEnter={e=>e.currentTarget.style.background=AT.bg4}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <div><div style={asans({fontSize:13,color:AT.ink,fontWeight:500})}>{u.firstName} {u.lastName}</div><div style={amono({fontSize:10,color:AT.inkMute})}>{u.company}</div></div>
            <div style={{paddingTop:4}}><PlanBadge plan={u.plan}/></div>
            <div style={{paddingTop:4}}><StatusBadge status={u.status}/></div>
            <div style={amono({fontSize:12,color:AT.green,textAlign:"right",paddingTop:4})}>{fmtMoney(u.amount)}</div>
            <div style={amono({fontSize:10,color:AT.inkMute,paddingTop:4})}>{u.stripeId||"—"}</div>
            <div style={amono({fontSize:11,color:AT.inkMute,paddingTop:4})}>Dec 31, {new Date().getFullYear()}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── REVENUE ───────────────────────────────────── */
function Revenue({revenueMonths=[]}){
  if(!revenueMonths.length){
    return(
      <div>
        <div style={adisp({fontWeight:700,fontSize:22,color:AT.ink,marginBottom:24})}>Revenue</div>
        <div style={{color:AT.inkMute,fontFamily:AF.body,fontSize:14}}>No revenue data yet — purchases will appear here.</div>
      </div>
    )
  }
  const totalAll=revenueMonths.reduce((s,m)=>s+m.mrr,0)
  const thisM=revenueMonths[revenueMonths.length-1]
  const maxMrr=Math.max(...revenueMonths.map(m=>m.mrr))
  const totalUsers=revenueMonths.reduce((s,m)=>s+m.users,0)

  return(
    <div>
      <div style={adisp({fontWeight:700,fontSize:22,color:AT.ink,marginBottom:24})}>Revenue</div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:28}}>
        <StatCard label="All-time revenue" value={fmtMoney(totalAll)} color={AT.green}/>
        <StatCard label="This month" value={fmtMoney(thisM.mrr)} sub={`${thisM.users} enrollment${thisM.users!==1?"s":""}`} color={AT.accent}/>
        <StatCard label="Peak month" value={fmtMoney(maxMrr)} sub={revenueMonths.find(m=>m.mrr===maxMrr)?.month||""}/>
        <StatCard label="Avg per user" value={totalUsers>0?fmtMoney(Math.round(totalAll/totalUsers)):"—"}/>
      </div>

      {/* Revenue chart */}
      <div style={{background:AT.bg3,border:`1px solid ${AT.border}`,borderRadius:8,padding:"24px",marginBottom:20}}>
        <SectionTitle>Monthly revenue</SectionTitle>
        <div style={{display:"flex",alignItems:"flex-end",gap:6,height:160,marginBottom:8}}>
          {revenueMonths.map((mo,i)=>{
            const h=Math.round((mo.mrr/maxMrr)*140)
            const isLast=i===revenueMonths.length-1
            return(
              <div key={mo.month} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                <div style={amono({fontSize:9,color:AT.inkMute})}>{fmtMoney(mo.mrr)}</div>
                <div style={{width:"100%",height:h,background:isLast?AT.accent:AT.blue+"80",
                  borderRadius:"3px 3px 0 0",transition:"height 0.4s"}}/>
              </div>
            )
          })}
        </div>
        <div style={{display:"flex",gap:6}}>
          {revenueMonths.map(mo=>(
            <div key={mo.month} style={{flex:1,textAlign:"center"}}>
              <div style={amono({fontSize:8,color:AT.inkMute})}>{mo.month.split(" ")[0]}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tier breakdown */}
      <div style={{background:AT.bg3,border:`1px solid ${AT.border}`,borderRadius:8,padding:"24px"}}>
        <SectionTitle>Revenue by tier</SectionTitle>
        <TableHeader cols={[{label:"Month",w:"120px"},{label:"LC Prep Test",w:"1fr"},
          {label:"Full Course",w:"1fr"},{label:"Course+Exam",w:"1fr"},{label:"Team",w:"1fr"},{label:"Total",w:"100px",right:true},{label:"Users",w:"70px",right:true}]}/>
        {[...revenueMonths].reverse().map((mo,i)=>(
          <div key={mo.month} style={{display:"grid",
            gridTemplateColumns:"120px 1fr 1fr 1fr 1fr 100px 70px",
            gap:0,padding:"8px 16px",
            borderBottom:i<revenueMonths.length-1?`1px solid ${AT.border}`:"none",
            transition:"background 0.1s"}}
            onMouseEnter={e=>e.currentTarget.style.background=AT.bg4}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <div style={amono({fontSize:11,color:AT.ink})}>{mo.month}</div>
            <div style={amono({fontSize:11,color:mo.t1>0?AT.blue:AT.inkMute})}>{mo.t1>0?fmtMoney(mo.t1):"—"}</div>
            <div style={amono({fontSize:11,color:mo.t2>0?AT.green:AT.inkMute})}>{mo.t2>0?fmtMoney(mo.t2):"—"}</div>
            <div style={amono({fontSize:11,color:mo.t3>0?AT.purple:AT.inkMute})}>{mo.t3>0?fmtMoney(mo.t3):"—"}</div>
            <div style={amono({fontSize:11,color:mo.team>0?AT.blue:AT.inkMute})}>{mo.team>0?fmtMoney(mo.team):"—"}</div>
            <div style={amono({fontSize:12,color:AT.accent,textAlign:"right",fontWeight:700})}>{fmtMoney(mo.mrr)}</div>
            <div style={amono({fontSize:11,color:AT.inkMute,textAlign:"right"})}>{mo.users}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── CONTENT & PROGRESS ────────────────────────── */
function ContentView({moduleStats=[]}){
  const ms=moduleStats
  const maxStarted=ms.length?Math.max(...ms.map(m=>m.started||0),1):1
  const totalLessons=ms.reduce((s,m)=>s+(m.completions||0),0)
  const totalStarted=ms.reduce((s,m)=>s+(m.started||0),0)
  const mostActive=ms.length?ms.reduce((a,b)=>(b.started||0)>(a.started||0)?b:a,ms[0]):null
  return(
    <div>
      <div style={adisp({fontWeight:700,fontSize:22,color:AT.ink,marginBottom:24})}>Content & Progress</div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:28}}>
        <StatCard label="Modules with activity" value={ms.filter(m=>(m.started||0)>0).length} sub={`of ${ms.length} modules`} color={AT.green}/>
        <StatCard label="Most active module" value={mostActive?`M${mostActive.n}`:"—"} sub={mostActive?.title||""}/>
        <StatCard label="Total module completions" value={totalLessons} sub="users who finished all lessons"/>
      </div>

      {/* Module funnel */}
      <div style={{background:AT.bg3,border:`1px solid ${AT.border}`,borderRadius:8,padding:"24px",marginBottom:20}}>
        <SectionTitle>Module activity funnel</SectionTitle>
        {ms.length===0?(
          <div style={{padding:"24px 0",textAlign:"center",color:AT.inkMute,fontFamily:AF.mono,fontSize:12}}>
            No progress data yet — activity will appear as learners start modules.
          </div>
        ):(
          <>
            <TableHeader cols={[{label:"Module",w:"2fr"},{label:"Started",w:"90px"},{label:"",w:"1fr"},{label:"Finished",w:"80px"}]}/>
            {ms.map((mod,i)=>{
              const started=mod.started||0
              const finished=mod.completions||0
              return(
                <div key={mod.n} style={{display:"grid",gridTemplateColumns:"2fr 90px 1fr 80px",
                  gap:0,padding:"10px 16px",borderBottom:i<ms.length-1?`1px solid ${AT.border}`:"none"}}>
                  <div><span style={amono({fontSize:11,color:AT.accent,marginRight:10})}>M{mod.n}</span><span style={asans({fontSize:12,color:AT.ink})}>{mod.title}</span></div>
                  <div style={amono({fontSize:11,color:started>0?AT.ink:AT.inkMute,paddingTop:2})}>{started}</div>
                  <div style={{display:"flex",alignItems:"center",paddingTop:2}}>
                    <MiniBar value={started} max={maxStarted} color={AT.accent}/>
                  </div>
                  <div style={amono({fontSize:11,color:finished>0?AT.green:AT.inkMute,paddingTop:2})}>{finished>0?`${finished} ✓`:"—"}</div>
                </div>
              )
            })}
          </>
        )}
      </div>

      {/* Exam topic breakdown */}
      <div style={{background:AT.bg3,border:`1px solid ${AT.border}`,borderRadius:8,padding:"24px"}}>
        <SectionTitle>Exam topic accuracy</SectionTitle>
        <div style={{padding:"16px 0",textAlign:"center",color:AT.inkMute,fontFamily:AF.mono,fontSize:12}}>
          Exam topic analytics available once learners attempt the practice exam.
        </div>
      </div>
    </div>
  )
}

/* ── SUPPORT FLAGS ─────────────────────────────── */
function SupportFlags({users,setUsers,onSelectUser}){
  const flagged=users.filter(u=>u.flagged)
  const pastDue=users.filter(u=>u.status==="past_due")
  const inactive=users.filter(u=>{
    const days=Math.round((new Date()-new Date(u.lastActive))/(1000*60*60*24))
    return days>14&&u.plan!=="free"&&u.status!=="canceled"
  })

  function clearFlag(user){
    setUsers(prev=>prev.map(u=>u.id===user.id?{...u,flagged:false,notes:u.notes}:u))
  }

  return(
    <div>
      <div style={adisp({fontWeight:700,fontSize:22,color:AT.ink,marginBottom:24})}>Support & Flags</div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:28}}>
        <StatCard label="Flagged accounts" value={flagged.length} color={flagged.length>0?AT.red:AT.green}/>
        <StatCard label="Past due" value={pastDue.length} color={pastDue.length>0?AT.amber:AT.green}/>
        <StatCard label="Inactive paid users" value={inactive.length} color={inactive.length>2?AT.amber:AT.inkMute} sub=">14 days no activity"/>
      </div>

      {/* Flagged */}
      <div style={{marginBottom:24}}>
        <SectionTitle><span style={{color:AT.red}}>⚑ Flagged accounts</span></SectionTitle>
        {flagged.length===0?(
          <div style={{background:AT.greenDim,border:`1px solid ${AT.green}`,borderRadius:8,
            padding:"16px",textAlign:"center",color:AT.green,fontFamily:AF.mono,fontSize:12}}>
            ✓ No flagged accounts
          </div>
        ):(
          <div style={{background:AT.bg3,border:`1px solid ${AT.red}`,borderRadius:8,overflow:"hidden"}}>
            {flagged.map((u,i)=>(
              <div key={u.id} style={{padding:"14px 16px",
                borderBottom:i<flagged.length-1?`1px solid ${AT.border}`:"none",
                background:AT.redDim}}>
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12}}>
                  <div>
                    <div style={asans({fontSize:13,color:AT.ink,fontWeight:500,marginBottom:2})}>
                      {u.firstName} {u.lastName} · <span style={{color:AT.inkMute}}>{u.email}</span>
                    </div>
                    <div style={amono({fontSize:10,color:AT.inkMute,marginBottom:6})}>
                      {u.company} · {u.state} · <PlanBadge plan={u.plan}/>
                    </div>
                    {u.notes&&<div style={{background:AT.bg4,borderRadius:4,padding:"6px 10px",
                      fontFamily:AF.mono,fontSize:11,color:AT.inkSoft,display:"inline-block"}}>
                      {u.notes}
                    </div>}
                  </div>
                  <div style={{display:"flex",gap:6,flexShrink:0}}>
                    <Btn small onClick={()=>onSelectUser(u)}>View user</Btn>
                    <Btn small variant="green" onClick={()=>clearFlag(u)}>Clear flag</Btn>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inactive paid */}
      <div>
        <SectionTitle><span style={{color:AT.amber}}>⚠ Inactive paid users</span>
          <span style={amono({fontSize:10,color:AT.inkMute})}>No activity in 14+ days</span>
        </SectionTitle>
        {inactive.length===0?(
          <div style={{background:AT.greenDim,border:`1px solid ${AT.green}`,borderRadius:8,
            padding:"16px",textAlign:"center",color:AT.green,fontFamily:AF.mono,fontSize:12}}>
            ✓ All paid users are active
          </div>
        ):(
          <div style={{background:AT.bg3,border:`1px solid ${AT.amber}`,borderRadius:8,overflow:"hidden"}}>
            <TableHeader cols={[{label:"User",w:"2fr"},{label:"Plan",w:"120px"},
              {label:"Days inactive",w:"120px"},{label:"Progress",w:"1fr"},{label:"Action",w:"120px"}]}/>
            {inactive.map((u,i)=>{
              const days=Math.round((new Date()-new Date(u.lastActive))/(1000*60*60*24))
              return(
                <div key={u.id} style={{display:"grid",gridTemplateColumns:"2fr 120px 120px 1fr 120px",
                  gap:0,padding:"10px 16px",borderBottom:i<inactive.length-1?`1px solid ${AT.border}`:"none"}}>
                  <div><div style={asans({fontSize:13,color:AT.ink,fontWeight:500})}>{u.firstName} {u.lastName}</div><div style={amono({fontSize:10,color:AT.inkMute})}>{u.email}</div></div>
                  <div style={{paddingTop:4}}><PlanBadge plan={u.plan}/></div>
                  <div style={amono({fontSize:12,color:days>30?AT.red:AT.amber,paddingTop:4})}>{days} days</div>
                  <div style={{paddingTop:8,paddingRight:16}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <MiniBar value={u.progress} max={100} color={AT.amber}/>
                      <span style={amono({fontSize:10,color:AT.inkMute,flexShrink:0})}>{u.progress}%</span>
                    </div>
                  </div>
                  <div style={{paddingTop:2}}><Btn small onClick={()=>onSelectUser(u)}>View</Btn></div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── TEAMS ─────────────────────────────────────── */
function TeamsView({users=[]}){
  const teamUsers=users.filter(u=>u.plan==="team")
  const totalSeats=teamUsers.reduce((s,u)=>s+(u.seats||0),0)
  const totalTeamRev=teamUsers.reduce((s,u)=>s+u.amount,0)

  return(
    <div>
      <div style={adisp({fontWeight:700,fontSize:22,color:AT.ink,marginBottom:22})}>Teams</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:20}}>
        <StatCard label="Team accounts" value={teamUsers.length} color={AT.green}/>
        <StatCard label="Total seats" value={totalSeats}/>
        <StatCard label="Team revenue" value={fmtMoney(totalTeamRev)} color={AT.purple}/>
      </div>
      {teamUsers.length===0?(
        <div style={{background:AT.bg3,border:`1px solid ${AT.border}`,borderRadius:8,padding:"48px",textAlign:"center"}}>
          <div style={amono({fontSize:11,color:AT.inkMute,marginBottom:8})}>No team accounts yet</div>
          <div style={asans({fontSize:13,color:AT.inkSoft})}>Team purchases will appear here once customers buy a team plan.</div>
        </div>
      ):(
        <div style={{background:AT.bg3,border:`1px solid ${AT.border}`,borderRadius:8,overflow:"hidden"}}>
          <TableHeader cols={[{label:"Admin",w:"2fr"},{label:"Email",w:"2fr"},{label:"Seats",w:"70px"},{label:"Progress",w:"140px"},{label:"Revenue",w:"95px",right:true},{label:"Status",w:"95px"},{label:"Joined",w:"110px"}]}/>
          {teamUsers.map((u,i)=>(
            <div key={u.id} style={{display:"grid",gridTemplateColumns:"2fr 2fr 70px 140px 95px 95px 110px",
              padding:"11px 16px",borderBottom:i<teamUsers.length-1?`1px solid ${AT.border}`:"none"}}>
              <div style={asans({fontSize:13,color:AT.ink,fontWeight:500})}>{u.firstName} {u.lastName}</div>
              <div style={amono({fontSize:11,color:AT.inkMute,paddingTop:2})}>{u.email}</div>
              <div style={amono({fontSize:12,color:AT.inkSoft,paddingTop:2})}>{u.seats||'—'}</div>
              <div style={{paddingTop:6,paddingRight:14}}>
                <div style={{display:"flex",alignItems:"center",gap:7}}>
                  <MiniBar value={u.progress} max={100} color={AT.accent}/>
                  <span style={amono({fontSize:9,color:AT.inkMute,flexShrink:0,width:28,textAlign:"right"})}>{u.progress}%</span>
                </div>
              </div>
              <div style={amono({fontSize:12,color:AT.purple,textAlign:"right",paddingTop:2})}>{fmtMoney(u.amount)}</div>
              <div style={{paddingTop:2}}><StatusBadge status={u.status}/></div>
              <div style={amono({fontSize:11,color:AT.inkMute,paddingTop:2})}>{u.joinDate?fmtDate(u.joinDate):'—'}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── REPORTS ───────────────────────────────────── */
function Reports({users}){
  const byState={}
  users.forEach(u=>{byState[u.state]=(byState[u.state]||0)+1})
  const stateList=Object.entries(byState).sort((a,b)=>b[1]-a[1])
  const byCompany={}
  users.forEach(u=>{byCompany[u.company]=(byCompany[u.company]||0)+1})
  const companyList=Object.entries(byCompany).sort((a,b)=>b[1]-a[1]).slice(0,8)
  const conversionRate=users.length>0?Math.round(users.filter(u=>u.plan!=="free").length/users.length*100):0

  return(
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24}}>
        <div style={adisp({fontWeight:700,fontSize:22,color:AT.ink})}>Reports</div>
        <Btn onClick={()=>alert("CSV export would download here in production.")}>
          ↓ Export CSV
        </Btn>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:28}}>
        <StatCard label="Total users" value={users.length}/>
        <StatCard label="Conversion rate" value={`${conversionRate}%`} sub="free → paid" color={AT.green}/>
        <StatCard label="States represented" value={Object.keys(byState).length}/>
        <StatCard label="Companies" value={Object.keys(byCompany).length}/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
        {/* By state */}
        <div style={{background:AT.bg3,border:`1px solid ${AT.border}`,borderRadius:8,padding:"20px"}}>
          <SectionTitle>Users by state</SectionTitle>
          {stateList.map(([state,count])=>(
            <div key={state} style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
              <div style={amono({fontSize:11,color:AT.inkSoft,width:130,flexShrink:0})}>{state}</div>
              <MiniBar value={count} max={stateList[0][1]} color={AT.blue}/>
              <span style={amono({fontSize:11,color:AT.inkMute,width:20,textAlign:"right",flexShrink:0})}>{count}</span>
            </div>
          ))}
        </div>

        {/* By company */}
        <div style={{background:AT.bg3,border:`1px solid ${AT.border}`,borderRadius:8,padding:"20px"}}>
          <SectionTitle>Top companies</SectionTitle>
          {companyList.map(([company,count])=>(
            <div key={company} style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
              <div style={amono({fontSize:11,color:AT.inkSoft,width:130,flexShrink:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"})}>{company}</div>
              <MiniBar value={count} max={companyList[0][1]} color={AT.accent}/>
              <span style={amono({fontSize:11,color:AT.inkMute,width:20,textAlign:"right",flexShrink:0})}>{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Seasonal enrollment */}
      <div style={{background:AT.bg3,border:`1px solid ${AT.border}`,borderRadius:8,padding:"24px",marginBottom:20}}>
        <SectionTitle>
          Seasonal enrollment validation
          <span style={amono({fontSize:10,color:AT.green})}>✓ GTM thesis confirmed</span>
        </SectionTitle>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
          {[
            {season:"May–Jun",label:"Early Bird",users:REVENUE_MONTHS.filter(m=>m.month.includes("May")||m.month.includes("Jun")).reduce((s,m)=>s+m.users,0),color:AT.green,note:"Early planners"},
            {season:"Jul–Sep",label:"Peak Season",users:REVENUE_MONTHS.filter(m=>["Jul","Aug","Sep"].some(mo=>m.month.includes(mo))).reduce((s,m)=>s+m.users,0),color:AT.accent,note:"Panic buying"},
            {season:"Oct",label:"Last-Minute",users:REVENUE_MONTHS.filter(m=>m.month.includes("Oct")).reduce((s,m)=>s+m.users,0),color:AT.amber,note:"LC Preparation Test spike"},
            {season:"Nov–Apr",label:"Off-season",users:REVENUE_MONTHS.filter(m=>["Nov","Dec","Jan","Feb","Mar","Apr"].some(mo=>m.month.includes(mo))).reduce((s,m)=>s+m.users,0),color:AT.inkMute,note:"Baseline"},
          ].map(s=>(
            <div key={s.season} style={{background:AT.bg4,borderRadius:8,padding:"16px"}}>
              <div style={amono({fontSize:9,letterSpacing:"0.14em",textTransform:"uppercase",color:s.color,marginBottom:8})}>{s.label}</div>
              <div style={adisp({fontWeight:700,fontSize:28,color:s.color,marginBottom:4})}>{s.users}</div>
              <div style={amono({fontSize:10,color:AT.inkMute})}>{s.season}</div>
              <div style={amono({fontSize:10,color:AT.inkMute,marginTop:4})}>{s.note}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Full user export table */}
      <div style={{background:AT.bg3,border:`1px solid ${AT.border}`,borderRadius:8,padding:"20px"}}>
        <SectionTitle>
          All users export
          <span style={amono({fontSize:10,color:AT.inkMute})}>{users.length} records</span>
        </SectionTitle>
        <div style={{overflowX:"auto"}}>
          <TableHeader cols={[{label:"Name",w:"140px"},{label:"Email",w:"200px"},
            {label:"Company",w:"120px"},{label:"State",w:"100px"},
            {label:"Plan",w:"100px"},{label:"Status",w:"90px"},
            {label:"Progress",w:"80px",right:true},{label:"Revenue",w:"80px",right:true}]}/>
          {users.map((u,i)=>(
            <div key={u.id} style={{display:"grid",
              gridTemplateColumns:"140px 200px 120px 100px 100px 90px 80px 80px",
              gap:0,padding:"8px 16px",
              borderBottom:i<users.length-1?`1px solid ${AT.border}`:"none"}}>
              <div style={asans({fontSize:12,color:AT.ink})}>{u.firstName} {u.lastName}</div>
              <div style={amono({fontSize:10,color:AT.inkMute})}>{u.email}</div>
              <div style={amono({fontSize:11,color:AT.inkSoft})}>{u.company}</div>
              <div style={amono({fontSize:11,color:AT.inkSoft})}>{u.state}</div>
              <div><PlanBadge plan={u.plan}/></div>
              <div><StatusBadge status={u.status}/></div>
              <div style={amono({fontSize:11,color:AT.inkMute,textAlign:"right"})}>{u.progress}%</div>
              <div style={amono({fontSize:11,color:u.amount>0?AT.green:AT.inkMute,textAlign:"right"})}>{u.amount>0?fmtMoney(u.amount):"—"}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── SETTINGS ──────────────────────────────────── */
function Settings({onSignOut}){
  return(
    <div>
      <div style={adisp({fontWeight:700,fontSize:22,color:AT.ink,marginBottom:24})}>Settings</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div style={{background:AT.bg3,border:`1px solid ${AT.border}`,borderRadius:8,padding:"24px"}}>
          <div style={amono({fontSize:9,letterSpacing:"0.18em",textTransform:"uppercase",color:AT.inkMute,marginBottom:16})}>Admin credentials</div>
          <div style={amono({fontSize:11,color:AT.inkSoft,lineHeight:1.7})}>
            Credentials are managed via environment variables.<br/>
            Update <code style={{fontFamily:AF.mono,fontSize:11,color:AT.amber}}>ADMIN_EMAIL</code> and{' '}
            <code style={{fontFamily:AF.mono,fontSize:11,color:AT.amber}}>ADMIN_PASSWORD</code> in Vercel project settings.
          </div>
        </div>
        <div style={{background:AT.bg3,border:`1px solid ${AT.border}`,borderRadius:8,padding:"24px"}}>
          <div style={amono({fontSize:9,letterSpacing:"0.18em",textTransform:"uppercase",color:AT.inkMute,marginBottom:16})}>Integrations</div>
          {[
            {label:"Supabase",status:"Not connected",note:"Wire in Phase 2"},
            {label:"Stripe Webhooks",status:"Not connected",note:"Wire in Phase 2"},
            {label:"Email (Resend)",status:"Not connected",note:"For admin alerts"},
          ].map(item=>(
            <div key={item.label} style={{display:"flex",alignItems:"center",justifyContent:"space-between",
              padding:"12px 0",borderBottom:`1px solid ${AT.border}`}}>
              <div>
                <div style={asans({fontSize:13,color:AT.ink,fontWeight:500})}>{item.label}</div>
                <div style={amono({fontSize:10,color:AT.inkMute})}>{item.note}</div>
              </div>
              <Badge label={item.status} color={AT.amber}/>
            </div>
          ))}
          <div style={{marginTop:16}}>
            <Btn variant="ghost">Configure integrations →</Btn>
          </div>
        </div>
      </div>
      <div style={{marginTop:24,paddingTop:24,borderTop:`1px solid ${AT.border}`}}>
        <Btn variant="danger" onClick={onSignOut}>Sign out of admin console</Btn>
      </div>
    </div>
  )
}

/* ── SIDEBAR ───────────────────────────────────── */
const NAV=[
  {id:"overview",glyph:"▦",label:"Overview"},
  {id:"users",glyph:"⊞",label:"Users"},
  {id:"subscriptions",glyph:"◈",label:"Subscriptions"},
  {id:"revenue",glyph:"◉",label:"Revenue"},
  {id:"content",glyph:"▤",label:"Content & Progress"},
  {id:"flags",glyph:"⚑",label:"Support & Flags"},
  {id:"teams",glyph:"⊛",label:"Teams"},
  {id:"reports",glyph:"⊡",label:"Reports"},
  {id:"settings",glyph:"⊙",label:"Settings"},
]

function AdminSidebar({route,setRoute,flagCount,onSignOut,onBack=()=>{},adminEmail=""}){
  return(
    <aside style={{background:AT.bg1,width:220,flexShrink:0,display:"flex",
      flexDirection:"column",borderRight:`1px solid ${AT.border}`,
      position:"sticky",top:0,height:"100vh",overflowY:"auto"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"16px 18px 14px",borderBottom:`1px solid ${AT.border}`}}>
        <img src="/brand/logo-transparent.png" alt="LC Lighting Master"
          style={{width:34,height:34,flexShrink:0,borderRadius:8,
            border:"1px solid rgba(242,230,218,0.28)",
            boxShadow:"0 0 14px rgba(232,160,32,0.35)"}}/>
        <div>
          <div style={{fontFamily:AF.display,fontWeight:700,fontSize:14,
            color:"#F2E6DA",letterSpacing:"-0.01em",lineHeight:1.1}}>LC · Lighting Master</div>
          <div style={{fontFamily:AF.mono,fontSize:9,letterSpacing:"0.14em",
            textTransform:"uppercase",color:"rgba(242,230,218,0.4)",marginTop:2}}>Admin</div>
        </div>
      </div>

      <nav style={{padding:"8px 0",flex:1}}>
        {NAV.map(item=>{
          const active=route===item.id||(route==="user-detail"&&item.id==="users")
          const isFlag=item.id==="flags"
          return(
            <button key={item.id} onClick={()=>setRoute(item.id)}
              style={{display:"flex",alignItems:"center",gap:10,width:"100%",
                padding:"9px 16px",background:active?"rgba(198,90,58,0.12)":"none",
                border:"none",borderLeft:active?`2px solid ${AT.accent}`:"2px solid transparent",
                cursor:"pointer",textAlign:"left",transition:"all 0.1s"}}>
              <span style={amono({fontSize:12,
                color:active?AT.accent:"rgba(255,255,255,0.35)",
                flexShrink:0,width:14,textAlign:"center"})}>{item.glyph}</span>
              <span style={{fontFamily:AF.display,fontSize:12,fontWeight:active?600:400,
                color:active?AT.ink:"rgba(255,255,255,0.55)",flex:1}}>{item.label}</span>
              {isFlag&&flagCount>0&&(
                <span style={{background:AT.red,color:"#fff",fontFamily:AF.mono,
                  fontSize:9,fontWeight:700,borderRadius:99,
                  padding:"1px 6px",flexShrink:0}}>{flagCount}</span>
              )}
            </button>
          )
        })}
      </nav>

      <div style={{padding:"12px 16px",borderTop:`1px solid ${AT.border}`}}>
        <div style={amono({fontSize:9,letterSpacing:"0.1em",textTransform:"uppercase",
          color:AT.inkMute,marginBottom:6})}>Signed in as</div>
        <div style={amono({fontSize:10,color:AT.inkSoft,marginBottom:10})}>{adminEmail}</div>
        <button onClick={onBack} style={{width:"100%",padding:"5px",background:"none",border:`1px solid rgba(255,255,255,0.08)`,borderRadius:4,fontFamily:AF.mono,fontSize:9,color:"rgba(249,244,237,0.3)",cursor:"pointer",marginBottom:4}}>← Back to site</button>
      <button onClick={onSignOut}
          style={{width:"100%",padding:"6px",background:"none",
            border:`1px solid ${AT.border}`,borderRadius:4,
            fontFamily:AF.mono,fontSize:10,color:AT.inkMute,cursor:"pointer"}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=AT.red;e.currentTarget.style.color=AT.red}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=AT.border;e.currentTarget.style.color=AT.inkMute}}>
          Sign out
        </button>
      </div>
    </aside>
  )
}

/* ── ROOT ──────────────────────────────────────── */
function AdminApp({onBack=()=>{}}){
  const [authed, setAuthed] = useState(false)
  const [adminEmail, setAdminEmail] = useState("")
  const [route, setRoute] = useState("overview")
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [dataError, setDataError] = useState(null)
  const [adminStats, setAdminStats] = useState({
    totalUsers:0, planCounts:{}, revenue:0,
    activeUsers:0, totalLessonsCompleted:0,
    communityQuestions:0, feedbackCount:0,
    recentUsers:[], revenueMonths:[], moduleStats:[],
  })

  const flagCount = users.filter(u=>u.flagged||u.status==="past_due").length

  async function loadAdminData(){
    setDataError(null)
    try{
      const res=await fetch('/api/admin/data',{credentials:'same-origin'})
      if(!res.ok){
        const body=await res.json().catch(()=>({}))
        throw new Error(body.error||`HTTP ${res.status}`)
      }
      const {subscriptions,progress,communityQuestions,feedbackCount}=await res.json()

      // ── Stats ─────────────────────────────────────
      const PLAN_PRICES={t1:250,t2:395,t3:595,team:360}
      const planCounts={free:0,t1:0,t2:0,t3:0,team:0}
      subscriptions.forEach(r=>{
        if(planCounts[r.plan]!==undefined) planCounts[r.plan]++
        else planCounts.free++
      })
      const revenue=subscriptions
        .filter(r=>r.plan!=="free")
        .reduce((s,r)=>{
          const price=r.plan==="team"?(r.seats||1)*360:(PLAN_PRICES[r.plan]||0)
          return s+price
        },0)
      const recentUsers=[...subscriptions]
        .sort((a,b)=>new Date(b.created_at||b.updated_at)-new Date(a.created_at||a.updated_at))
        .slice(0,10)
        .map(u=>({...u,email:u.email||u.user_id?.slice(0,8)+"..."}))
      const revMap={}
      subscriptions.filter(r=>r.plan!=="free"&&(r.created_at||r.updated_at)).forEach(r=>{
        const d=new Date(r.created_at||r.updated_at)
        const key=d.toLocaleDateString("en-US",{month:"short",year:"numeric"})
        if(!revMap[key]) revMap[key]={month:key,mrr:0,t1:0,t2:0,t3:0,team:0,users:0}
        const price=r.plan==="team"?360*(r.seats||1):(PLAN_PRICES[r.plan]||0)
        revMap[key].mrr+=price
        revMap[key][r.plan]=(revMap[key][r.plan]||0)+price
        revMap[key].users++
      })
      const revenueMonths=Object.values(revMap).sort((a,b)=>new Date(a.month)-new Date(b.month))
      const thirtyDaysAgo=new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate()-30)
      const activeUsers=new Set(
        progress.filter(p=>p.completed_at>=thirtyDaysAgo.toISOString()).map(p=>p.user_id)
      ).size
      const userRefs={}
      progress.forEach(p=>{
        if(!userRefs[p.user_id]) userRefs[p.user_id]=new Set()
        userRefs[p.user_id].add(p.lesson_ref)
      })
      const moduleStats=MODULES.map(m=>{
        const lessonRefs=m.lessons.map(l=>l.ref)
        const allRefs=Object.values(userRefs)
        const completions=allRefs.filter(refs=>lessonRefs.every(r=>refs.has(r))).length
        const started=allRefs.filter(refs=>lessonRefs.some(r=>refs.has(r))).length
        return{n:m.n,title:m.title,completions,started}
      })
      setAdminStats({
        totalUsers:           subscriptions.length,
        planCounts,
        revenue,
        activeUsers,
        totalLessonsCompleted:progress.length,
        communityQuestions,
        feedbackCount,
        recentUsers,
        revenueMonths,
        moduleStats,
      })

      // ── Users ─────────────────────────────────────
      const progMap={}
      progress.forEach(p=>{
        if(!progMap[p.user_id]){progMap[p.user_id]={refs:new Set(),lastActive:null}}
        progMap[p.user_id].refs.add(p.lesson_ref)
        if(!progMap[p.user_id].lastActive||p.completed_at>progMap[p.user_id].lastActive)
          progMap[p.user_id].lastActive=p.completed_at
      })
      const PP={t1:250,t2:395,t3:595}
      const cap=w=>w?(w[0].toUpperCase()+w.slice(1)):''
      setUsers(subscriptions.map(s=>{
        const prog=progMap[s.user_id]||{refs:new Set(),lastActive:null}
        const pct=Math.round((prog.refs.size/74)*100)
        const local=(s.email||'').split('@')[0]
        const parts=local.replace(/[._+]/g,' ').split(' ').filter(Boolean)
        const firstName=cap(parts[0])||'—'
        const lastName=cap(parts[1])||''
        const domainPart=(s.email||'').split('@')[1]?.split('.')[0]||''
        const company=cap(domainPart)||'—'
        const amount=s.plan==='team'?360*(s.seats||1):(PP[s.plan]||0)
        return{
          id:s.user_id,
          email:s.email||s.user_id?.slice(0,8)+'...',
          firstName,lastName,company,state:'—',
          plan:s.plan||'free',status:s.status||'free',
          joinDate:s.created_at||s.updated_at,
          lastActive:prog.lastActive,
          stripeId:s.stripe_customer_id||null,
          amount,progress:pct,
          completedRefs:[...prog.refs],
          modulesCompleted:MODULES.filter(m=>m.lessons.every(l=>prog.refs.has(l.ref))).length,
          examAttempts:0,examBestScore:null,
          flagged:false,notes:'',
        }
      }))
    }catch(e){
      console.error("loadAdminData:",e)
      setDataError(e.message||"Failed to load admin data")
    }
  }

  useEffect(()=>{ loadAdminData() },[])

  function handleSelectUser(user){
    setSelectedUser(user)
    setRoute("user-detail")
  }
  function handleUpdateUser(updated){
    setUsers(prev=>prev.map(u=>u.id===updated.id?updated:u))
    setSelectedUser(updated)
  }
  async function handleSignOut(){
    try{await fetch('/api/admin/logout',{method:'POST',credentials:'same-origin'})}catch{}
    setAuthed(false)
    setAdminEmail("")
    setRoute("overview")
    setSelectedUser(null)
  }
  function navigate(r){
    setRoute(r)
    setSelectedUser(null)
  }

  if(!authed) return <AdminLogin onLogin={(em)=>{setAuthed(true);setAdminEmail(em)}}/>

  return(
    <div style={{display:"flex",minHeight:"100vh",background:AT.bg2,
      fontFamily:AF.sans,color:AT.ink}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Inter:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:${AT.bg2}}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-thumb{background:${AT.border};border-radius:3px}
        textarea,select{color-scheme:light}
      `}</style>
      <AdminSidebar route={route} setRoute={navigate} flagCount={flagCount} onSignOut={handleSignOut} onBack={onBack} adminEmail={adminEmail}/>
      <main style={{flex:1,padding:"32px 36px",overflowY:"auto",minHeight:"100vh"}}>
        {dataError&&(
          <div style={{marginBottom:20,background:"#3b1a1a",border:"1px solid #c65a3a",
            borderRadius:8,padding:"12px 16px",display:"flex",alignItems:"center",
            justifyContent:"space-between",gap:12}}>
            <div>
              <span style={{fontFamily:AF.mono,fontSize:11,color:"#e07070",marginRight:8}}>⚠ Admin data failed to load:</span>
              <span style={{fontFamily:AF.mono,fontSize:11,color:"#c09090"}}>{dataError}</span>
            </div>
            <button onClick={loadAdminData}
              style={{background:AT.accent,color:"#fff",border:"none",borderRadius:6,
                padding:"5px 12px",fontFamily:AF.mono,fontSize:10,cursor:"pointer",flexShrink:0}}>
              Retry
            </button>
          </div>
        )}
        {route==="overview"     && <Overview adminStats={adminStats} onNavigate={navigate}/>}
        {route==="users"        && <UsersView users={users} setUsers={setUsers} onSelectUser={handleSelectUser}/>}
        {route==="user-detail"  && selectedUser && <UserDetail user={selectedUser} onBack={()=>navigate("users")} onUpdate={handleUpdateUser}/>}
        {route==="subscriptions"&& <Subscriptions users={users}/>}
        {route==="revenue"      && <Revenue revenueMonths={adminStats.revenueMonths||[]}/>}
        {route==="content"      && <ContentView moduleStats={adminStats.moduleStats||[]}/>}
        {route==="flags"        && <SupportFlags users={users} setUsers={setUsers} onSelectUser={handleSelectUser}/>}
        {route==="teams"        && <TeamsView users={users}/>}
        {route==="reports"      && <Reports users={users}/>}
        {route==="settings"     && <Settings onSignOut={handleSignOut}/>}
      </main>
    </div>
  )
}



/* ══ TOP-LEVEL ROUTER — learner app + admin portal in one file ══ */
export default function Root(){
  const [app, setApp] = React.useState("learner")
  if(app==="admin") return <AdminApp onBack={()=>setApp("learner")}/>
  return <LearnerRoot onAdminClick={()=>setApp("admin")}/>
}
