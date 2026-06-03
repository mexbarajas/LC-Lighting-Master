'use client'

import React, { useState, useEffect, useRef, useCallback } from "react"
import { createClient } from '@/lib/supabase/client'
import PricingCard from '@/components/PricingCard'

const supabase = createClient()

/* ══ LEARNER APP ══ */

/* ── FONTS ── */
const FONT_URL = "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Inter:wght@400;500;600&family=DM+Serif+Display&display=swap"

/* ── TOKENS ── */
const C = {
  ink:"#16120e", inkSoft:"#352c22", inkMute:"#8a7a6a",
  cream:"#f8f3ec", creamWarm:"#f0e8db", paper:"#fdfaf6",
  rule:"#e4d9ca", ruleStrong:"#cfc3b0",
  accent:"#b85835", accentLight:"#f5ebe4",
  forest:"#2a6048", forestLight:"#e4f0ea",
  tan:"#c9a87c", amber:"#e8a020", white:"#fff",
}
const F = { display:"'Space Grotesk',sans-serif", body:"'Inter',sans-serif", mono:"'JetBrains Mono',monospace" }
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
  const colors = ["","#c0392b","#e67e22","#e8a020","#2a6048","#1a7a52"]
  return(
    <div style={{marginTop:8}}>
      <div style={{display:"flex",gap:3,marginBottom:5}}>
        {[1,2,3,4,5].map(i=>(
          <div key={i} style={{flex:1,height:3,borderRadius:2,
            background:i<=score?colors[score]:"#e4d9ca",
            transition:"background 0.2s"}}/>
        ))}
      </div>
      <div style={{fontFamily:"'Inter',sans-serif",fontSize:11,color:colors[score]||"#8a7a6a",fontWeight:500}}>
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

function AuthModal({mode, onClose, onAuth}){
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
  const [contactOk, setContactOk] = useState(false)
  // reset
  const [resetEmail, setResetEmail] = useState("")
  // shared
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState("")
  const [success, setSuccess] = useState("")
  const [touched, setTouched] = useState({})

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
    if(pwStrength(suPw)<3){ setError("Password is too weak. Add uppercase letters, numbers, or symbols."); return false }
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
      const { data, error } = await supabase.auth.signInWithPassword({ email:siEmail, password:siPw })
      if(error){ setLoading(false); setError(error.message); return }
      const u = data.user
      const { data:sub } = await supabase.from("subscriptions").select("*").eq("user_id", u.id).single()
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
        background:"rgba(22,18,14,0.76)",
        display:"flex",alignItems:"center",justifyContent:"center",padding:"16px",
        overflowY:"auto"}}>

      <div style={{background:C.paper,borderRadius:18,padding:"32px 30px",
        width:"100%",maxWidth: tab==="signup"?520:400,
        position:"relative",border:`1px solid ${C.rule}`,
        margin:"auto", flexShrink:0}}>

        <button onClick={onClose} style={{position:"absolute",top:14,right:16,
          background:"none",border:"none",cursor:"pointer",fontSize:22,color:C.inkMute,lineHeight:1}}>×</button>

        {/* logo */}
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
          <div style={{width:30,height:30,borderRadius:7,background:C.accent,
            display:"flex",alignItems:"center",justifyContent:"center",
            fontFamily:F.display,fontWeight:800,fontSize:11,color:"#fff"}}>LC</div>
          <div style={d({fontWeight:700,fontSize:15,color:C.ink})}>Lighting Master</div>
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
              <PwStrengthBar pw={suPw}/>
            </Field>

            {/* requirements checklist */}
            {suPw&&(
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"3px 12px",
                background:C.creamWarm,borderRadius:7,padding:"10px 12px"}}>
                {[
                  [suPw.length>=8,           "8+ characters"],
                  [/[A-Z]/.test(suPw),       "Uppercase letter"],
                  [/[0-9]/.test(suPw),       "Number"],
                  [/[^A-Za-z0-9]/.test(suPw),"Symbol (!@#$…)"],
                ].map(([ok,label])=>(
                  <div key={label} style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontSize:11,color:ok?C.forest:"#cfc3b0",flexShrink:0}}>{ok?"✓":"○"}</span>
                    <span style={{fontFamily:F.body,fontSize:11,color:ok?C.inkSoft:C.inkMute}}>{label}</span>
                  </div>
                ))}
              </div>
            )}

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
      background:scrolled?"rgba(253,250,246,0.97)":"rgba(22,18,14,0.35)",
      backdropFilter:"blur(12px)",
      borderBottom:scrolled?`1px solid ${C.rule}`:"1px solid rgba(249,244,237,0.08)",
      transition:"background 280ms, border-color 280ms"}}>
      <div style={{maxWidth:1180,margin:"0 auto",padding:"0 32px",
        display:"flex",alignItems:"center",height:68,gap:32}}>
        <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
          <div style={{width:32,height:32,borderRadius:6,background:C.accent,
            display:"flex",alignItems:"center",justifyContent:"center",
            fontFamily:F.display,fontWeight:800,fontSize:12,color:"#fff"}}>LC</div>
          <div>
            <div style={d({fontWeight:700,fontSize:14,color:scrolled?C.ink:"#fff",lineHeight:1.1,transition:"color 280ms"})}>
              Lighting Master
            </div>
            <div style={m({fontSize:7,letterSpacing:"0.18em",textTransform:"uppercase",
              color:scrolled?C.inkMute:"rgba(249,244,237,0.45)",transition:"color 280ms"})}>
              by Luxartmedia
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
  const stats=[["74","lessons across 12 modules"],["24","CEU credit hours"],["129","LC exam practice questions"],["3","pricing tiers · start free"]]
  return(
    <section style={{background:C.ink,minHeight:"100vh",display:"flex",flexDirection:"column",
      alignItems:"center",justifyContent:"center",padding:"100px 32px 80px",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",inset:0,pointerEvents:"none",opacity:0.04}}>
        {[...Array(12)].map((_,i)=>(
          <div key={i} style={{position:"absolute",left:0,right:0,top:`${8.33*(i+1)}%`,height:1,background:"rgba(249,244,237,1)"}}/>
        ))}
      </div>
      <div style={{position:"absolute",top:"30%",left:"50%",transform:"translate(-50%,-50%)",
        width:600,height:400,background:"radial-gradient(ellipse, rgba(184,88,53,0.18) 0%, transparent 70%)",pointerEvents:"none"}}/>
      <div style={{maxWidth:880,margin:"0 auto",textAlign:"center",position:"relative",zIndex:1}}>
        <Kicker light center>LC Exam Prep · Lighting Design</Kicker>
        <h1 style={{fontFamily:F.display,fontWeight:700,fontSize:"clamp(42px,7vw,80px)",
          letterSpacing:"-0.03em",lineHeight:1,color:"#f8f3ec",margin:"0 0 24px"}}>
          Become the{" "}<em style={{fontStyle:"normal",color:C.accent}}>lighting expert</em>
          <br/>your clients expect.
        </h1>
        <p style={{fontFamily:F.body,fontSize:"clamp(15px,1.8vw,18px)",lineHeight:1.75,
          color:"rgba(249,244,237,0.65)",margin:"0 auto 40px",maxWidth:580}}>
          The only structured online program built specifically to prepare North American
          lighting designers for the LC exam — 74 lessons, 129 practice questions, 24 CEU hours.
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
    {icon:"⚡",title:"Timed LC practice exam",body:"129 questions across 13 topics with a 25-second clock, speed bonuses, and streak multipliers. See exactly which topics need work before exam day."},
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
            129 questions.<br/><em style={{fontStyle:"normal",color:C.accent}}>25 seconds each.</em>
          </Heading>
          <p style={{fontFamily:F.body,fontSize:15,color:"rgba(249,244,237,0.65)",lineHeight:1.75,margin:"0 0 28px"}}>
            Our LC exam practice engine simulates real test pressure — a timed ring, speed bonuses, and streak multipliers.
            After each session, see your accuracy broken down by topic.
          </p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:32}}>
            {[["129","questions across 13 topics"],["25 sec","per question — timed"],["85%","accuracy needed to pass"],["Unlimited","attempts included"]].map(([v,l])=>(
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

/* ── SEASONAL PRICING LOGIC ── */
function useSeason(){
  const mo = new Date().getMonth() // 0-indexed: Jan=0 … Dec=11
  if(mo===4||mo===5) return "earlybird"   // May–Jun
  if(mo>=6&&mo<=8)   return "peak"        // Jul–Sep
  if(mo===9)         return "lastminute"  // Oct
  return "standard"                       // Nov–Apr off-season
}
const SEASON_META = {
  earlybird:  {label:"Early Bird",color:"#2a6048",bg:"#e4f0ea",border:"#2a6048",ends:"Jun 30",msg:"Early Bird pricing ends June 30 — lock in the lowest rate of the year."},
  peak:       {label:"Peak Season",color:"#b85835",bg:"#f5ebe4",border:"#b85835",ends:"Sep 30",msg:"Exam window approaching — most designers enroll now. Prices hold through September."},
  lastminute: {label:"Last-Minute Prep",color:"#16120e",bg:"#f0e8db",border:"#cfc3b0",ends:"Oct 31",msg:"Exam window open. The Test Engine gives you the most accurate final mock — one shot to find your gaps."},
  standard:   {label:"Standard",color:"#8a7a6a",bg:"#f8f3ec",border:"#e4d9ca",ends:null,msg:"Exam season runs October–November. Enroll early and use the full study window."},
}

/* ── PRICING ── */
function Pricing({onSignUp}){
  const season   = useSeason()
  const meta     = SEASON_META[season]
  const tier2Price = season==="earlybird"?395:season==="peak"?495:595
  const tier3Price = season==="earlybird"?595:season==="peak"?695:695
  const tier1Visible = season==="lastminute"||season==="standard"

  // Team slider state
  const [seats, setSeats] = useState(5)
  const teamPrice = seats<=5 ? seats*360 : seats<=10 ? seats*280 : null
  const perSeat   = seats<=5 ? 360 : seats<=10 ? 280 : null
  const savings   = seats<=5 ? Math.round((seats*tier3Price - teamPrice)/seats) : seats<=10 ? Math.round((seats*tier3Price - teamPrice)/seats) : null

  const [teamTab, setTeamTab] = useState("individual") // "individual" | "team"

  const individualPlans = [
    ...(tier1Visible ? [{
      id:"t1",label:"Test Engine",tag:"Tier 1",price:250,priceNote:"one-time",
      badge:season==="lastminute"?"🎯 Last-Minute":null,badgeColor:C.ink,
      dim:false,dark:false,
      desc:"Already studied? Use our LC practice engine as your final accuracy check before exam day.",
      includes:["129 LC practice questions","13 topic breakdown","25-sec timed exam","Speed bonuses & streaks","Per-topic accuracy report","Unlimited attempts"],
      cta:"Get Test Engine →",
    }] : [{
      id:"t1",label:"Test Engine",tag:"Tier 1",price:250,priceNote:"one-time",
      badge:null,dim:true,dark:false,
      desc:"Available in October — final exam prep for last-minute candidates.",
      includes:["129 LC practice questions","13 topic breakdown","25-sec timed exam","Speed bonuses & streaks","Per-topic accuracy report","Unlimited attempts"],
      cta:"Available in October",
    }]),
    {
      id:"t2",label:"Full Course",tag:"Tier 2",
      price:tier2Price,wasPrice:season==="earlybird"?495:null,priceNote:"one-time",
      badge:season==="earlybird"?"Early Bird":season==="peak"?"Peak Season":null,
      badgeColor:season==="earlybird"?C.forest:C.accent,
      dim:false,dark:false,
      desc:"All 12 modules structured around the LC exam blueprint. Certificate + 24 CEU hours.",
      includes:["All 12 modules · 74 lessons","Audio narration every lesson","Bookmarks & notes hub","Certificate of completion","24 CEU credit hours"],
      addon:"+ Test Engine add-on for $200",
      cta:"Start Full Course →",
    },
    {
      id:"t3",label:"Course + Exam",tag:"Tier 3",
      price:tier3Price,wasPrice:season==="earlybird"?695:null,priceNote:"one-time",
      badge:"Best value",badgeColor:C.accent,
      dim:false,dark:true,
      desc:"The complete package — full course access plus the LC practice exam. Best path to passing.",
      includes:["Everything in Full Course","Test engine included","129 LC practice questions","Unlimited exam attempts","Topic accuracy analytics","Priority support"],
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
                  padding:"2px 7px",borderRadius:99}}>Save 40%+</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Seasonal banner */}
        <div style={{maxWidth:1000,margin:"0 auto 28px",background:meta.bg,
          border:`1px solid ${meta.border}`,borderRadius:10,
          padding:"13px 20px",display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:meta.color}}/>
            <span style={{fontFamily:F.mono,fontSize:9,letterSpacing:"0.22em",textTransform:"uppercase",color:meta.color,fontWeight:700}}>{meta.label}</span>
            {meta.ends&&<span style={{fontFamily:F.body,fontSize:11,color:meta.color,background:"rgba(255,255,255,0.6)",borderRadius:99,padding:"2px 9px",border:`1px solid ${meta.border}`}}>ends {meta.ends}</span>}
          </div>
          <p style={{fontFamily:F.body,fontSize:13,color:C.inkSoft,margin:0,lineHeight:1.5,flex:1}}>{meta.msg}</p>
        </div>

        {/* ── INDIVIDUAL PLANS ── */}
        {teamTab==="individual"&&(
          <div style={{maxWidth:1000,margin:"0 auto"}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:1,
              border:`1px solid ${C.rule}`,borderRadius:8,overflow:"hidden"}}>
              {individualPlans.map((plan,i)=>(
                <div key={plan.id} style={{background:plan.dark?C.ink:C.paper,
                  padding:"28px 22px",borderRight:i<individualPlans.length-1?`1px solid ${C.rule}`:"none",
                  position:"relative",display:"flex",flexDirection:"column",
                  opacity:plan.dim?0.5:1,transition:"opacity 0.2s"}}>
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
                    {plan.wasPrice&&<span style={{fontFamily:F.mono,fontSize:11,
                      color:plan.dark?"rgba(249,244,237,0.35)":C.inkMute,
                      textDecoration:"line-through",marginRight:5}}>${plan.wasPrice}</span>}
                    <span style={{fontFamily:F.display,fontWeight:700,fontSize:34,
                      color:plan.dark?"#fff":plan.wasPrice?C.forest:C.ink,
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
                        <span style={{color:plan.dim?C.inkMute:plan.dark?"rgba(249,244,237,0.4)":C.forest,fontSize:11,flexShrink:0}}>
                          {plan.dim?"·":"✓"}
                        </span>
                        <span style={{fontFamily:F.display,fontSize:11,
                          color:plan.dim?C.inkMute:plan.dark?"rgba(249,244,237,0.75)":C.inkSoft,lineHeight:1.5}}>{item}</span>
                      </div>
                    ))}
                    {plan.addon&&<div style={{marginTop:8,fontFamily:F.body,fontSize:10.5,
                      color:plan.dark?"rgba(249,244,237,0.38)":C.inkMute,fontStyle:"italic"}}>
                      {plan.addon}
                    </div>}
                  </div>
                  {plan.dim?(
                    <div style={{fontFamily:F.body,fontSize:12,color:C.inkMute,
                      fontStyle:"italic",textAlign:"center",padding:"8px 0"}}>
                      {plan.cta}
                    </div>
                  ):(
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
                  )}
                </div>
              ))}
            </div>
            <p style={{textAlign:"center",fontFamily:F.body,fontSize:13,color:C.inkMute,marginTop:20,lineHeight:1.7}}>
              All plans include a <strong style={{color:C.inkSoft}}>free trial</strong> — Module 01 in full + 10 LC practice questions. No card required.
              {season==="earlybird"&&<><br/><span style={{color:C.forest,fontWeight:500}}>Early Bird rate locks in at signup — price won't increase mid-course.</span></>}
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
                    color:"#fff",letterSpacing:"-0.03em",lineHeight:1}}>{seats>=11?"10+":seats}</span>
                  <span style={{fontFamily:F.mono,fontSize:12,color:"rgba(249,244,237,0.45)"}}>
                    {seats>=11?"+ seats":"seats"}
                  </span>
                </div>

                {/* Price display */}
                {seats<=10?(
                  <div style={{marginBottom:20}}>
                    <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:4}}>
                      <span style={{fontFamily:F.display,fontWeight:700,fontSize:38,
                        color:C.accent,letterSpacing:"-0.02em",lineHeight:1}}>
                        ${teamPrice?.toLocaleString()}
                      </span>
                      <span style={{fontFamily:F.mono,fontSize:10,color:"rgba(249,244,237,0.4)"}}>one-time</span>
                    </div>
                    <div style={{display:"flex",gap:16}}>
                      <div style={{fontFamily:F.mono,fontSize:11,color:"rgba(249,244,237,0.5)"}}>
                        ${perSeat}/seat
                      </div>
                      <div style={{fontFamily:F.mono,fontSize:11,color:C.forest}}>
                        Save ${savings}/seat vs individual
                      </div>
                    </div>
                  </div>
                ):(
                  <div style={{marginBottom:20}}>
                    <div style={{fontFamily:F.display,fontWeight:700,fontSize:28,
                      color:C.accent,marginBottom:6}}>Custom pricing</div>
                    <div style={{fontFamily:F.mono,fontSize:11,color:"rgba(249,244,237,0.5)"}}>
                      Studios of 10+ get dedicated pricing and onboarding
                    </div>
                  </div>
                )}

                {/* Slider */}
                <div style={{marginBottom:24}}>
                  <style>{`
                    .seat-slider{width:100%;-webkit-appearance:none;appearance:none;
                      height:4px;background:rgba(249,244,237,0.15);border-radius:2px;outline:none;cursor:pointer}
                    .seat-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;
                      width:20px;height:20px;border-radius:50%;background:#b85835;cursor:pointer;
                      border:2px solid rgba(249,244,237,0.3);transition:transform 0.1s}
                    .seat-slider::-webkit-slider-thumb:hover{transform:scale(1.2)}
                    .seat-slider::-moz-range-thumb{width:20px;height:20px;border-radius:50%;
                      background:#b85835;cursor:pointer;border:2px solid rgba(249,244,237,0.3)}
                  `}</style>
                  <input type="range" min={2} max={11} value={seats===11?11:seats}
                    onChange={e=>setSeats(parseInt(e.target.value))}
                    className="seat-slider"/>
                  <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
                    <span style={{fontFamily:F.mono,fontSize:9,color:"rgba(249,244,237,0.3)"}}>2 seats</span>
                    <span style={{fontFamily:F.mono,fontSize:9,color:"rgba(249,244,237,0.3)"}}>10+ seats</span>
                  </div>
                </div>

                {/* Pricing tiers legend */}
                <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:24}}>
                  {[
                    {range:"2–5 seats",price:"$360/seat",active:seats<=5},
                    {range:"6–10 seats",price:"$280/seat",active:seats>=6&&seats<=10},
                    {range:"10+ seats",price:"Custom",active:seats>=11},
                  ].map(tier=>(
                    <div key={tier.range} style={{display:"flex",alignItems:"center",
                      justifyContent:"space-between",padding:"6px 10px",borderRadius:6,
                      background:tier.active?"rgba(184,88,53,0.2)":"rgba(255,255,255,0.03)",
                      border:`1px solid ${tier.active?C.accent+"60":"rgba(255,255,255,0.06)"}`,
                      transition:"all 0.2s"}}>
                      <span style={{fontFamily:F.mono,fontSize:11,
                        color:tier.active?"#fff":"rgba(249,244,237,0.4)"}}>{tier.range}</span>
                      <span style={{fontFamily:F.display,fontWeight:700,fontSize:13,
                        color:tier.active?C.accent:"rgba(249,244,237,0.3)"}}>{tier.price}</span>
                    </div>
                  ))}
                </div>

                {seats<=10?(
                  <button onClick={onSignUp}
                    style={{width:"100%",padding:"13px",borderRadius:99,border:"none",
                      background:C.accent,color:"#fff",fontFamily:F.display,
                      fontWeight:700,fontSize:14,cursor:"pointer",transition:"opacity 0.15s"}}
                    onMouseEnter={e=>e.currentTarget.style.opacity="0.88"}
                    onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                    Start team plan — ${teamPrice?.toLocaleString()} →
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
                  {["All 12 modules · 74 lessons","Audio narration every lesson","LC practice exam · 129 questions","Unlimited exam attempts","Bookmarks, notes & progress tracking","Certificate of completion","24 CEU credit hours"].map((item,i,arr)=>(
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
                {seats<=10&&(
                  <div style={{marginTop:"auto",background:C.forestLight,
                    border:`1px solid ${C.forest}`,borderRadius:10,padding:"14px 16px"}}>
                    <div style={{fontFamily:F.display,fontWeight:700,fontSize:13,
                      color:C.forest,marginBottom:4}}>
                      vs. {seats} individual Course+Exam plans
                    </div>
                    <div style={{display:"flex",alignItems:"baseline",gap:10}}>
                      <span style={{fontFamily:F.mono,fontSize:11,
                        color:C.inkMute,textDecoration:"line-through"}}>
                        ${(seats*tier3Price).toLocaleString()}
                      </span>
                      <span style={{fontFamily:F.display,fontWeight:700,fontSize:18,color:C.forest}}>
                        ${teamPrice?.toLocaleString()}
                      </span>
                      <span style={{fontFamily:F.mono,fontSize:11,color:C.forest}}>
                        Save ${((seats*tier3Price)-teamPrice).toLocaleString()}
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
    ["What's included in the practice exam?","129 timed multiple-choice questions across 13 topics, aligned with the LC exam topic blueprint. A 25-second timer, speed bonuses, streak multipliers, and per-topic accuracy analytics after each session."],
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
      style={{position:"fixed",inset:0,background:"rgba(22,18,14,0.72)",
        zIndex:9999,display:"flex",alignItems:"flex-start",justifyContent:"center",
        padding:"40px 20px",overflowY:"auto"}}>
      <div style={{background:C.paper,borderRadius:8,width:"100%",maxWidth:720,
        border:`1px solid ${C.rule}`,position:"relative",
        boxShadow:"0 24px 64px rgba(22,18,14,0.28)"}}>
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
              <p style={{fontFamily:F.body,fontSize:13,lineHeight:1.75,
                color:C.inkSoft,margin:0}}>
                {s.body}
              </p>
            </div>
          ))}
          <div style={{marginTop:32,paddingTop:20,borderTop:`1px solid ${C.rule}`}}>
            <p style={mono({fontSize:9,color:C.inkMute,lineHeight:1.6})}>
              © 2025 Luxart LLC · LC · Lighting Master · {data.title} {data.version}
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
            © 2025 Luxartmedia LLC · Lighting Master · All rights reserved
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
    {ref:"3.8",title:"LED selection guide",tag:"LED"},
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
    {ref:"7.1",title:"IES outdoor types I–V",tag:"exterior"},{ref:"7.2",title:"BUG ratings & lighting zones",tag:"exterior"},
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
    {ref:"12.1",title:"Kitchen & bath lighting",tag:"residential"},{ref:"12.2",title:"Living & bedroom lighting",tag:"residential"},
    {ref:"12.3",title:"Office & workplace",tag:"commercial"},{ref:"12.4",title:"Retail & hospitality",tag:"commercial"},
    {ref:"12.5",title:"Healthcare & education",tag:"commercial"},{ref:"12.6",title:"Integrated project review",tag:"application"},
  ]},
]

const ALL_LESSONS = MODULES.flatMap(m => m.lessons.map(l=>({...l,module:m.n,moduleTitle:m.title,part:m.part})))

const PARTS = [
  {id:1,title:"Fundamentals · light, sources, math",modules:[1,2,3,4]},
  {id:2,title:"Systems & applications",modules:[5,6,7,8]},
  {id:3,title:"Design practice & sustainability",modules:[9,10,11,12]},
]

const BOOKMARKS = [
  {ref:"1.4",note:"Kruithof curve relationship — review before exam"},
  {ref:"1.5",note:"CRI vs TM-30 tradeoffs for retail projects"},
  {ref:"2.3",note:"Three retrofit paths — client keeps asking about this"},
  {ref:"3.1",note:"P-N junction — always on the exam"},
  {ref:"3.3",note:"Thermal path diagram is brilliant for explaining to clients"},
  {ref:"4.1",note:"IES LM-63 field format — memorize the structure"},
  {ref:"4.4",note:"Inverse-square law derivation"},
]

const NOTES = [
  {ref:"1.4",body:"CCT is the temperature of a blackbody radiator matching the source chromaticity. Not the actual lamp temp! Planckian locus is the path on the CIE diagram.",edited:"2 days ago",chars:161},
  {ref:"1.5",body:"TM-30 Rf = fidelity (like CRI but better), Rg = gamut. Rg>100 means colors look MORE saturated, Rg<100 means less. Use both numbers together.",edited:"3 days ago",chars:141},
  {ref:"3.1",body:"P-N junction — electrons fall from n-layer to p-layer, release photon at bandgap energy. Bandgap determines wavelength = color. Blue chip + phosphor = white LED.",edited:"4 days ago",chars:162},
  {ref:"3.3",body:"Driver = the four parts. Locked-in last bit: thermal management lives between the chip and the heat sink, not ON the heat sink. Junction → solder → MCPCB → TIM → heat sink → ambient.",edited:"18 hr ago",chars:182},
  {ref:"4.1",body:"LM-63 IES file: header block (TILT, lamp data), then candela values by vertical then horizontal angles. The photometric web is sampled at discrete angle pairs.",edited:"5 days ago",chars:159},
  {ref:"2.2",body:"Magnetic ballasts run at 60Hz — cause visible flicker. Electronic run at 20–50kHz — no flicker, 10-15% better efficacy. Always specify electronic for dimming.",edited:"1 week ago",chars:158},
  {ref:"2.3",body:"Three LED retrofit paths: (1) direct lamp swap — easiest, (2) lamp + driver swap — better, (3) full fixture replacement — best optical performance.",edited:"1 week ago",chars:143},
  {ref:"4.2",body:"Polar plot: intensity (cd) radially, angle around. The 'blob' shape shows the beam. Cartesian is the same data unrolled flat — better for comparing distributions.",edited:"6 days ago",chars:165},
  {ref:"3.2",body:"Four parts of a luminaire: (1) LED package/module, (2) driver, (3) heatsink/thermal path, (4) optical system. All four must work together for system performance.",edited:"4 days ago",chars:162},
  {ref:"1.3",body:"Scotopic = rods = low light. Photopic = cones = bright light. Mesopic = transition zone. S/P ratio matters in parking — high S/P LED looks brighter at low levels.",edited:"1 week ago",chars:162},
]

const QUESTIONS = [
  {id:"q001",topic:"Light Sources & Lamps",prompt:"Which lamp type produces light through electroluminescence at a P-N semiconductor junction?",choices:["High-pressure sodium (HPS)","LED","Compact fluorescent (CFL)","Metal halide"],correct:"LED",explanation:"LEDs produce light through electroluminescence when current passes through a P-N semiconductor junction, exciting electrons that release photons."},
  {id:"q002",topic:"Photometry & Calculations",prompt:"According to the inverse-square law, if the distance from a point source doubles, illuminance:",choices:["Doubles","Halves","Reduces to one-quarter","Remains the same"],correct:"Reduces to one-quarter",explanation:"E = I/d². When distance doubles, E = I/(2d)² = I/4d² — illuminance reduces to 1/4 of the original value."},
  {id:"q003",topic:"Color & Vision",prompt:"Correlated color temperature (CCT) describes:",choices:["The actual temperature of a light source","The perceived warmth or coolness of a light source","The color rendering ability","The luminous efficacy at different temperatures"],correct:"The perceived warmth or coolness of a light source",explanation:"CCT is the temperature of a blackbody radiator that best matches the chromaticity of the light source. Lower CCT = warm/amber; higher CCT = cool/blue-white."},
  {id:"q004",topic:"Energy & Controls",prompt:"Lighting Power Density (LPD) is expressed in:",choices:["Watts per lumen","Watts per square foot","Lumens per watt","Foot-candles per watt"],correct:"Watts per square foot",explanation:"LPD (W/ft²) = total connected lighting load ÷ gross floor area. ASHRAE 90.1 uses LPD as the primary energy code compliance metric."},
  {id:"q005",topic:"Luminaire Design & Optics",prompt:"A luminaire's coefficient of utilization (CU) accounts for:",choices:["Lamp lumen depreciation only","Both room geometry and luminaire efficiency","Only the luminaire's optical efficiency","Maintenance factors and lamp life"],correct:"Both room geometry and luminaire efficiency",explanation:"The CU combines luminaire efficiency with room cavity ratio (RCR) to represent the fraction of lamp lumens that reach the work plane."},
  {id:"q006",topic:"Color & Vision",prompt:"IES TM-30 improves upon CRI by providing:",choices:["A single number above 100","Both fidelity (Rf) and gamut (Rg) measures","Only a gamut area metric","A measure of flicker performance"],correct:"Both fidelity (Rf) and gamut (Rg) measures",explanation:"TM-30 uses 99 color evaluation samples and provides Rf (fidelity) and Rg (gamut index) — two complementary metrics that together characterize color rendering."},
  {id:"q007",topic:"Emergency & Exit Lighting",prompt:"NFPA 101 requires emergency lighting to maintain illuminance for a minimum of:",choices:["30 minutes","60 minutes","90 minutes","120 minutes"],correct:"90 minutes",explanation:"NFPA 101 requires emergency lighting systems to provide maintained illuminance for a minimum of 90 minutes following normal power failure."},
  {id:"q008",topic:"Exterior & Outdoor Lighting",prompt:"What does the BUG rating system evaluate for outdoor luminaires?",choices:["Brightness, Uniformity, and Glare","Backlight, Uplight, and Glare","Beam angle, Uniformity, and Geometry","Brightness, Usage, and Generation"],correct:"Backlight, Uplight, and Glare",explanation:"The IES BUG (Backlight-Uplight-Glare) rating system quantifies outdoor luminaire light distribution to help minimize light pollution and trespass."},
  {id:"q009",topic:"Energy & Controls",prompt:"A vacancy sensor differs from an occupancy sensor in that it:",choices:["Detects occupancy more accurately","Requires manual activation but turns off automatically","Turns on and off automatically","Only works with daylight harvesting"],correct:"Requires manual activation but turns off automatically",explanation:"Vacancy sensors require occupants to manually switch lights ON but automatically switch OFF — saving more energy than occupancy sensors (which auto-on)."},
  {id:"q010",topic:"Photometry & Calculations",prompt:"Illuminance (lux) is equivalent to:",choices:["Candelas per square meter","Lumens per square meter","Watts per square meter","Candelas per steradian"],correct:"Lumens per square meter",explanation:"1 lux = 1 lumen per square meter (lm/m²). Illuminance measures the quantity of luminous flux falling on a surface per unit area."},
  {id:"q011",topic:"Light Sources & Lamps",prompt:"A lamp rated at 1000 lumens consuming 10 watts has an efficacy of:",choices:["10 lm/W","100 lm/W","1000 lm/W","0.1 lm/W"],correct:"100 lm/W",explanation:"Luminous efficacy = lumens ÷ watts = 1000 ÷ 10 = 100 lm/W."},
  {id:"q012",topic:"Codes, Standards & Sustainability",prompt:"LEED v4.1 lighting quality credits address:",choices:["Only energy savings from lighting","Interior lighting quality including glare control, color quality, and controllability","Exterior lighting trespass only","Emergency lighting compliance"],correct:"Interior lighting quality including glare control, color quality, and controllability",explanation:"LEED v4.1 Interior Lighting credits address glare control, CRI ≥90, R9 ≥50, and occupant lighting controls for at least 90% of regularly occupied spaces."},
  {id:"q013",topic:"Daylighting",prompt:"Spatial daylight autonomy (sDA) measures:",choices:["Peak daylight illuminance","The percentage of floor area receiving sufficient daylight for a specified percentage of occupied hours","Annual direct sunlight exposure","Glare probability from windows"],correct:"The percentage of floor area receiving sufficient daylight for a specified percentage of occupied hours",explanation:"sDA300/50% quantifies the percentage of floor area receiving ≥300 lux for at least 50% of annual occupied hours — the primary LEED daylighting metric."},
  {id:"q014",topic:"Interior Lighting Design",prompt:"The IES illuminance recommendation for a general office task area is approximately:",choices:["10–15 fc (100–150 lux)","30–50 fc (300–500 lux)","75–100 fc (750–1000 lux)","150–200 fc (1500–2000 lux)"],correct:"30–50 fc (300–500 lux)",explanation:"IES RP-1 recommends 300–500 lux (30–50 fc) for general office tasks."},
  {id:"q015",topic:"Lighting Design Process",prompt:"The Owner's Project Requirements (OPR) document establishes:",choices:["Fixture specifications and quantities","The owner's goals, functional requirements, and performance criteria","Electrical load calculations","Lamp replacement schedules"],correct:"The owner's goals, functional requirements, and performance criteria",explanation:"The OPR is a foundational commissioning document capturing the owner's operational needs, energy targets, and performance expectations."},
  {id:"q016",topic:"Human Factors & Health",prompt:"Melanopic illuminance relates to the effect of lighting on:",choices:["Cone photoreceptors and color vision","ipRGC cells and circadian regulation","Rod photoreceptors and scotopic vision","Pupillary light reflex only"],correct:"ipRGC cells and circadian regulation",explanation:"Melanopic illuminance weights light according to the sensitivity of ipRGCs containing melanopsin, which drive circadian entrainment and melatonin suppression. Peak sensitivity ~480nm."},
  {id:"q017",topic:"Luminaire Design & Optics",prompt:"Luminaire efficacy is calculated as:",choices:["Source lumens ÷ luminaire watts","Delivered lumens ÷ luminaire watts","Source lumens ÷ driver watts","Delivered lumens ÷ source lumens"],correct:"Delivered lumens ÷ luminaire watts",explanation:"Luminaire efficacy (lm/W) = total delivered lumens ÷ total luminaire input watts (including driver losses)."},
  {id:"q018",topic:"Energy & Controls",prompt:"DALI-2 is best described as:",choices:["A wireless mesh lighting control protocol","A standardized digital protocol for addressable dimming control","A motion sensor communication standard","An emergency lighting test system"],correct:"A standardized digital protocol for addressable dimming control",explanation:"DALI-2 is an IEC 62386 open protocol for digital communication between lighting control devices, allowing individual addressing, scene setting, and status feedback."},
  {id:"q019",topic:"Light Sources & Lamps",prompt:"What does 'T8' refer to in a fluorescent lamp designation?",choices:["Tube length of 8 feet","Tube diameter of 8/8 inch (1 inch)","Wattage of 8 watts","Color temperature of 8000K"],correct:"Tube diameter of 8/8 inch (1 inch)",explanation:"The 'T' designation indicates tubular shape; the number indicates diameter in eighths of an inch. T8 = 8/8 = 1 inch diameter."},
  {id:"q020",topic:"Photometry & Calculations",prompt:"The light loss factor (LLF) accounts for:",choices:["Only lamp lumen depreciation","Multiple factors reducing maintained illuminance over time","Only luminaire dirt depreciation","Only voltage fluctuations"],correct:"Multiple factors reducing maintained illuminance over time",explanation:"LLF = product of all recoverable and non-recoverable factors including lamp lumen depreciation (LLD), luminaire dirt depreciation (LDD), room surface dirt depreciation (RSDD), and others."},
  {id:"q021",topic:"Accent Lighting",prompt:"Which of the following best describes the purpose of accent lighting in a space?",choices:["Providing uniform horizontal illuminance","Creating visual interest, drawing attention, and supporting wayfinding","Supplementing daylight during overcast conditions","Meeting minimum egress illuminance requirements"],correct:"Creating visual interest, drawing attention, and supporting wayfinding",explanation:"Accent lighting is designed to positively affect brightness perception, provide visual relief, and direct attention to specific elements — it is not a general illuminance strategy."},
  {id:"q022",topic:"Conservation Lighting",prompt:"In a museum task lighting system for conservation labs, what minimum CRI is required for lamps?",choices:["80","85","90","100"],correct:"100",explanation:"Task lighting in conservation labs requires a CRI of 100 (perfect colour rendering) to ensure accurate assessment of artefact condition. Ambient systems require CRI 85 as a minimum."},
  {id:"q023",topic:"UV & Radiation",prompt:"What is the primary concern with ultraviolet radiation when applied to museum artefacts?",choices:["It generates excessive heat on surfaces","It causes irreversible photochemical damage such as colour change and physical deterioration","It reflects off surfaces and creates glare","It interferes with occupancy sensor operation"],correct:"It causes irreversible photochemical damage such as colour change and physical deterioration",explanation:"UV radiation induces photochemical damage to many organic materials. This damage is evidenced by colour change and physical deterioration and is irreversible. When UV data is unavailable, UV filters should be used."},
  {id:"q024",topic:"UV & Radiation",prompt:"Ultraviolet radiation generally causes more damage to sensitive materials than visible radiation because its damage mechanism is:",choices:["Thermal — heating the surface","Photochemical — altering molecular bonds irreversibly","Mechanical — causing surface abrasion","Electrical — inducing current in conductive materials"],correct:"Photochemical — altering molecular bonds irreversibly",explanation:"UV radiation induces photochemical damage, which is wavelength dependent and irreversible. Visible radiation can also cause damage but is generally less destructive than UV at comparable exposure levels."},
  {id:"q025",topic:"Color Rendering",prompt:"A lamp with a CRI greater than 80 is generally preferred for occupied spaces because:",choices:["It produces more lumens per watt","It helps occupants better identify and distinguish colours","It has a longer rated life","It operates at a lower correlated colour temperature"],correct:"It helps occupants better identify and distinguish colours",explanation:"CRI above 80 is the IES threshold for spaces where accurate colour discrimination is important. Higher CRI sources more faithfully reproduce object colours as they would appear under reference illuminants."},
  {id:"q026",topic:"Conservation Lighting",prompt:"For conservation purposes, preservation-worthy objects are classified according to:",choices:["Their monetary value","Their sensitivity to light exposure (high, low, or no sensitivity)","The country of origin","Whether they are displayed indoors or outdoors"],correct:"Their sensitivity to light exposure (high, low, or no sensitivity)",explanation:"IES and conservation guidelines categorise objects by light sensitivity. Highly sensitive items (textiles, watercolours, photographs) require lower illuminance and stricter annual lux-hour limits than moderately sensitive or insensitive objects."},
  {id:"q027",topic:"Exterior Lighting",prompt:"For luminaires used in outdoor applications subject to extreme temperatures, what components must be specifically rated for those conditions?",choices:["Only the lamp","Only the driver","Lamps, ballasts or drivers, transformers, and control devices","The housing and lens only"],correct:"Lamps, ballasts or drivers, transformers, and control devices",explanation:"All active electrical components — lamps, ballasts/drivers, transformers, and controls — must be rated for the expected ambient temperature range when used in outdoor conditions with temperature extremes."},
  {id:"q028",topic:"Exterior Lighting",prompt:"When designing a parking lot lighting layout, which sequence of steps is most appropriate?",choices:["Select luminaires first, then calculate illuminance","Define activity zones, establish horizontal illuminance and uniformity criteria, then define any accent lighting requirements","Calculate LPD compliance first, then position fixtures","Choose poles, then select luminaire distribution"],correct:"Define activity zones, establish horizontal illuminance and uniformity criteria, then define any accent lighting requirements",explanation:"The correct strategy is to first define the activities and tasks in the space, then establish illuminance and uniformity criteria, and finally incorporate accent or wayfinding lighting where needed."},
  {id:"q029",topic:"Exterior Lighting",prompt:"For pedestrian and bicycle pathway lighting, the design is primarily influenced by:",choices:["Architectural style of adjacent buildings","Proximity to vehicular traffic, activity level, and nighttime outdoor lighting zone","The number of streetlight poles available","Average daily temperature"],correct:"Proximity to vehicular traffic, activity level, and nighttime outdoor lighting zone",explanation:"IES guidance for pedestrian and bike ways requires the designer to define activities, surface reflectances, and any needed accent lighting, with design influenced by traffic proximity, activity level, and the applicable lighting zone."},
  {id:"q030",topic:"Retinal Safety",prompt:"Radiant energy in the 400–1400 nm range can cause retinal damage through which mechanisms?",choices:["Only thermal damage","Only photochemical damage","Photochemical, thermal, and mechanical mechanisms","Electrical and chemical mechanisms only"],correct:"Photochemical, thermal, and mechanical mechanisms",explanation:"Research confirms at least three mechanisms of retinal damage for radiant energy between 400 and 1400 nm: photochemical damage (wavelength-dependent), thermal damage (from pulse durations of microseconds to seconds), and mechanical shock-wave damage from ultrashort laser pulses."},
  {id:"q031",topic:"LED Technology",prompt:"An individual LED chip within a luminaire typically operates at a forward voltage of approximately:",choices:["12 volts","24 volts","2 to 3 volts","110 volts"],correct:"2 to 3 volts",explanation:"Individual LED junctions operate at forward voltages of approximately 2 to 3 volts. Multiple LEDs are arranged in series/parallel arrays, and a constant-current driver regulates the total voltage applied to the array."},
  {id:"q032",topic:"Ballasts",prompt:"The ballast factor is best defined as:",choices:["The ratio of actual delivered lumens on a specific ballast versus lumens on a reference ballast","The number of lamps a ballast can operate","The ballast's power factor","The ratio of ballast watts to lamp watts"],correct:"The ratio of actual delivered lumens on a specific ballast versus lumens on a reference ballast",explanation:"Ballast factor (BF) is the ratio of light output produced by a specific lamp-ballast combination to the output of that same lamp on a standardised ANSI reference ballast. It varies by ballast type and lamp."},
  {id:"q033",topic:"Luminaire Optics",prompt:"Which of the following physical processes are used to control the direction and quality of light emitted from a luminaire?",choices:["Reflection, absorption, and diffraction","Conduction, convection, and radiation","Refraction, dispersion, and fluorescence","Diffraction, polarisation, and scattering only"],correct:"Reflection, absorption, and diffraction",explanation:"Luminaire optical systems rely on reflection (mirrors, reflectors), absorption (baffles, finishes), and diffraction (prismatic lenses, diffusers) to redirect and redistribute emitted light."},
  {id:"q034",topic:"Optics",prompt:"Specular reflection is the phenomenon where:",choices:["Light scatters in all directions equally","The angle of incidence equals the angle of reflection","Light is completely absorbed by the surface","The reflected beam spreads wider than the incident beam"],correct:"The angle of incidence equals the angle of reflection",explanation:"Specular reflection follows the law of reflection: the angle of incidence equals the angle of reflection. It produces mirror-like images and is characteristic of polished metal and glass surfaces."},
  {id:"q035",topic:"Photometry",prompt:"Photometric testing of a luminaire measures:",choices:["Only the wattage consumed","Light output from multiple viewing planes at various angles through the luminaire","The lamp's spectral power distribution only","The thermal performance of the driver"],correct:"Light output from multiple viewing planes at various angles through the luminaire",explanation:"Photometric testing, typically performed with a goniophotometer or large integrating sphere per IES LM-79, measures luminous intensity from many viewing planes to build a complete three-dimensional light distribution."},
  {id:"q036",topic:"Luminaire Classification",prompt:"Which terms describe the general distribution character of luminaires?",choices:["Efficient, moderate, and inefficient","Downward, multidirectional, and concentrated","Static, dynamic, and adaptive","Recessed, surface, and pendant"],correct:"Downward, multidirectional, and concentrated",explanation:"IES luminaire classification uses terms like downward (direct), multidirectional, and concentrated to describe how a luminaire distributes its output spatially."},
  {id:"q037",topic:"Color & Vision",prompt:"The human eye sees better in low-level light conditions when the source contains:",choices:["Dominant long-wavelength red light","Short-wavelength blue-rich light","Only green wavelengths","Infrared radiation"],correct:"Short-wavelength blue-rich light",explanation:"Under mesopic and scotopic conditions, the eye shifts its peak sensitivity toward shorter wavelengths (scotopic peak ~507 nm). Blue-rich sources with high S/P ratios appear brighter at low light levels."},
  {id:"q038",topic:"Exterior Lighting",prompt:"Proper exterior lighting of a building site contributes to safety and security by:",choices:["Eliminating all shadows","Aiding police protection, facilitating traffic flow, and promoting business activity","Maximising illuminance uniformity above all else","Preventing all light from leaving the site boundary"],correct:"Aiding police protection, facilitating traffic flow, and promoting business activity",explanation:"Well-designed exterior lighting serves multiple functions: supporting personal security, aiding law enforcement presence, facilitating safe traffic and pedestrian movement, and encouraging commerce."},
  {id:"q039",topic:"Design Process",prompt:"Which sequence best represents the standard lighting design process?",choices:["Bidding, construction, commissioning, and closeout","Programming, schematic design, contract documentation, and bidding","Concept, feasibility, testing, and delivery","Installation, testing, approval, and handover"],correct:"Programming, schematic design, contract documentation, and bidding",explanation:"The standard design process follows programming (OPR), schematic design (SD), design development and contract documentation (CD), then the construction and bidding phase."},
  {id:"q040",topic:"Human Factors & Health",prompt:"The ipRGC (intrinsically photosensitive retinal ganglion cell) plays a key role in:",choices:["Providing high-resolution colour vision","Synchronising the circadian rhythm and regulating melatonin release from the pineal gland","Detecting motion in peripheral vision","Controlling pupil size exclusively"],correct:"Synchronising the circadian rhythm and regulating melatonin release from the pineal gland",explanation:"ipRGCs contain melanopsin and respond to light independently of rods and cones. They drive circadian entrainment via the SCN and regulate acute photic suppression of melatonin from the pineal gland. Peak sensitivity is approximately 480 nm."},
  {id:"q041",topic:"Exterior Lighting",prompt:"In the IES BUG outdoor luminaire rating system, the letter U stands for:",choices:["Uniformity","Uplight","Usage","UV output"],correct:"Uplight",explanation:"BUG stands for Backlight, Uplight, and Glare. Uplight (U) quantifies the flux emitted above the horizontal plane, which is the primary contributor to sky glow. U0 indicates zero uplight."},
  {id:"q042",topic:"Emergency Lighting",prompt:"Per NFPA 70, emergency lighting must provide a minimum average of how many foot-candles along the egress path?",choices:["0.5 fc average, 0.05 fc minimum","1.0 fc average, 0.1 fc minimum","2.0 fc average, 0.5 fc minimum","5.0 fc average, 1.0 fc minimum"],correct:"1.0 fc average, 0.1 fc minimum",explanation:"NFPA 70 and NFPA 101 require emergency lighting to provide an initial average of at least 1.0 fc along the egress path, with no point falling below 0.1 fc."},
  {id:"q043",topic:"Color Rendering",prompt:"The Color Rendering Index (CRI) measures:",choices:["How warm or cool a light source appears","The degree of colour shift test samples undergo when illuminated by a source compared to a reference illuminant of the same CCT","The total light output of a source","The efficiency of converting electrical energy to light"],correct:"The degree of colour shift test samples undergo when illuminated by a source compared to a reference illuminant of the same CCT",explanation:"CRI quantifies how faithfully a light source renders a set of standardised test colour samples relative to a reference light source of the same correlated colour temperature. A perfect score is Ra 100."},
  {id:"q044",topic:"Photometry",prompt:"Photometric calculations for LED luminaires should use which type of photometry?",choices:["Relative photometry","Absolute photometry","Comparative photometry","Relative spectral photometry"],correct:"Absolute photometry",explanation:"LED luminaires must use absolute photometry (IES LM-79), which measures actual lumens output at a stabilised operating temperature — not relative photometry referenced to an external source standard."},
  {id:"q045",topic:"Emergency Lighting",prompt:"Functional testing of emergency lighting shall be conducted monthly, with a maximum interval of how many weeks between tests?",choices:["4 weeks","5 weeks","6 weeks","8 weeks"],correct:"5 weeks",explanation:"NFPA 101 requires monthly functional tests with a minimum spacing of 3 weeks and a maximum of 5 weeks between tests, unless the local authority having jurisdiction approves otherwise."},
  {id:"q046",topic:"LED Technology",prompt:"LED stands for which of the following?",choices:["Lumen-Efficacy Device","Light Emitting Diode","Low-Energy Downlight","Laser-Enhanced Diffuser"],correct:"Light Emitting Diode",explanation:"LED stands for Light Emitting Diode — a semiconductor device that emits light through electroluminescence when current flows through the P-N junction."},
  {id:"q047",topic:"Design Standards",prompt:"IES uses three age groups to account for differences in visual capability. These groups are:",choices:["Children, adults, elderly","Under 25, 25–65, over 65","Under 18, 18–50, over 50","Under 30, 30–60, over 60"],correct:"Under 25, 25–65, over 65",explanation:"IES Handbook 10th edition uses three target age groups — under 25, 25–65, and over 65 — to address the wide variation in visual sensitivity and recommend appropriate illuminance adjustments."},
  {id:"q048",topic:"Product Labelling",prompt:"US DOE Lighting Facts labels for luminaires are required to include which of the following?",choices:["CCT, CRI, and rated life only","Watts, IESNA LM-79-2008 test data, and CRI","Lumens, efficacy, and beam angle","Wattage, input voltage, and power factor"],correct:"Watts, IESNA LM-79-2008 test data, and CRI",explanation:"US DOE Lighting Facts programme requires labels to state wattage, confirm compliance with LM-79-2008 testing, and report CRI — ensuring consumers have comparable, verified performance data."},
  {id:"q049",topic:"Lamp Life",prompt:"Average rated lamp life is defined as the operating time at which:",choices:["All lamps in a large group have failed","50% of a large group of lamps are still burning","The lamp reaches 70% of its initial lumen output","The lamp first shows visible colour shift"],correct:"50% of a large group of lamps are still burning",explanation:"Average rated life is a statistical value — the elapsed operating time at which exactly half of a large sample of identically tested lamps have failed. Individual lamps may fail earlier or later."},
  {id:"q050",topic:"Photometry",prompt:"Foot-candles are a unit of:",choices:["Luminous flux","Luminance","Illuminance when area is measured in square feet","Luminous intensity"],correct:"Illuminance when area is measured in square feet",explanation:"Illuminance is the density of luminous flux incident on a surface. When area is in square feet, the unit is foot-candles (fc). When area is in square metres, the unit is lux (lx). 1 fc = 10.76 lux."}
]
const LC_VISUALS = {
"1.1":`<svg viewBox="0 0 520 120" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto"><defs><linearGradient id="sp1" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#7B00FF"/><stop offset="20%" stop-color="#0044FF"/><stop offset="40%" stop-color="#00AAFF"/><stop offset="58%" stop-color="#00EE44"/><stop offset="74%" stop-color="#AAFF00"/><stop offset="86%" stop-color="#FFAA00"/><stop offset="100%" stop-color="#FF2200"/></linearGradient></defs><rect x="8" y="28" width="60" height="16" rx="3" fill="#f0ece4"/><text x="38" y="22" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace">RADIO/UV</text><rect x="68" y="20" width="380" height="30" rx="4" fill="url(#sp1)"/><text x="258" y="14" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".08em">VISIBLE SPECTRUM  380–780 nm</text><rect x="448" y="28" width="60" height="16" rx="3" fill="#FF4400" opacity=".18"/><text x="478" y="22" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace">INFRARED</text><line x1="68" y1="50" x2="68" y2="60" stroke="#cfc3b0" stroke-width=".7"/><text x="68" y="69" text-anchor="middle" font-size="8" fill="#352c22">380 nm</text><text x="68" y="79" text-anchor="middle" font-size="7" fill="#7B00FF">Violet</text><line x1="168" y1="50" x2="168" y2="60" stroke="#cfc3b0" stroke-width=".7"/><text x="168" y="69" text-anchor="middle" font-size="8" fill="#352c22">480 nm</text><text x="168" y="79" text-anchor="middle" font-size="7" fill="#0088FF">ipRGC</text><line x1="232" y1="50" x2="232" y2="60" stroke="#cfc3b0" stroke-width=".7"/><text x="232" y="69" text-anchor="middle" font-size="8" fill="#352c22">507 nm</text><text x="232" y="79" text-anchor="middle" font-size="7" fill="#00AA44">Rod peak</text><line x1="316" y1="50" x2="316" y2="60" stroke="#cfc3b0" stroke-width=".7"/><text x="316" y="69" text-anchor="middle" font-size="8" fill="#352c22">555 nm</text><text x="316" y="79" text-anchor="middle" font-size="7" fill="#88AA00">Cone peak</text><line x1="448" y1="50" x2="448" y2="60" stroke="#cfc3b0" stroke-width=".7"/><text x="448" y="69" text-anchor="middle" font-size="8" fill="#352c22">780 nm</text><text x="258" y="104" text-anchor="middle" font-size="10" fill="#16120e" font-weight="500">Wavelength determines colour · SPD is the fingerprint of every light source</text><text x="258" y="116" text-anchor="middle" font-size="9" fill="#8a7a6a">CCT · CRI · TM-30 · Melanopic lux — all derived from the SPD</text></svg>`,
"1.2":`<svg viewBox="0 0 520 130" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto"><defs><marker id="ar1" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3z" fill="#8a7a6a"/></marker></defs><rect x="8" y="18" width="108" height="66" rx="5" fill="#fff5ee" stroke="#b85835" stroke-width=".8"/><text x="62" y="36" text-anchor="middle" font-size="10" fill="#b85835" font-family="monospace" font-weight="500">Φ FLUX</text><text x="62" y="49" text-anchor="middle" font-size="9" fill="#16120e">Lumens (lm)</text><text x="62" y="62" text-anchor="middle" font-size="8" fill="#8a7a6a">Total output</text><text x="62" y="74" text-anchor="middle" font-size="8" fill="#8a7a6a">all directions</text><line x1="116" y1="51" x2="134" y2="51" stroke="#8a7a6a" stroke-width="1" marker-end="url(#ar1)"/><rect x="136" y="18" width="108" height="66" rx="5" fill="#e8f5ee" stroke="#2a6048" stroke-width=".8"/><text x="190" y="36" text-anchor="middle" font-size="10" fill="#2a6048" font-family="monospace" font-weight="500">I INTENSITY</text><text x="190" y="49" text-anchor="middle" font-size="9" fill="#16120e">Candelas (cd)</text><text x="190" y="62" text-anchor="middle" font-size="8" fill="#8a7a6a">Directional</text><text x="190" y="74" text-anchor="middle" font-size="8" fill="#8a7a6a">beam intensity</text><line x1="244" y1="51" x2="262" y2="51" stroke="#8a7a6a" stroke-width="1" marker-end="url(#ar1)"/><rect x="264" y="18" width="108" height="66" rx="5" fill="#e8eef8" stroke="#1857a0" stroke-width=".8"/><text x="318" y="36" text-anchor="middle" font-size="10" fill="#1857a0" font-family="monospace" font-weight="500">E ILLUM.</text><text x="318" y="49" text-anchor="middle" font-size="9" fill="#16120e">Lux / fc</text><text x="318" y="62" text-anchor="middle" font-size="8" fill="#8a7a6a">Flux per</text><text x="318" y="74" text-anchor="middle" font-size="8" fill="#8a7a6a">unit area</text><line x1="372" y1="51" x2="390" y2="51" stroke="#8a7a6a" stroke-width="1" marker-end="url(#ar1)"/><rect x="392" y="18" width="120" height="66" rx="5" fill="#f3eef8" stroke="#7a3a9a" stroke-width=".8"/><text x="452" y="36" text-anchor="middle" font-size="10" fill="#7a3a9a" font-family="monospace" font-weight="500">L LUMIN.</text><text x="452" y="49" text-anchor="middle" font-size="9" fill="#16120e">cd / m²</text><text x="452" y="62" text-anchor="middle" font-size="8" fill="#7a3a9a">Perceived</text><text x="452" y="74" text-anchor="middle" font-size="8" fill="#7a3a9a">causes glare</text><text x="62" y="100" text-anchor="middle" font-size="8" fill="#8a7a6a">Integ. sphere</text><text x="190" y="100" text-anchor="middle" font-size="8" fill="#8a7a6a">Goniophotometer</text><text x="318" y="100" text-anchor="middle" font-size="8" fill="#8a7a6a">Illum. meter</text><text x="452" y="100" text-anchor="middle" font-size="8" fill="#8a7a6a">Luminance cam.</text><text x="260" y="120" text-anchor="middle" font-size="10" fill="#16120e" font-weight="500">E = I / d²  ·  double distance → ¼ illuminance  ·  1 fc = 10.76 lux</text></svg>`,
"1.3":`<svg viewBox="0 0 520 140" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto"><line x1="36" y1="14" x2="36" y2="112" stroke="#e4d9ca" stroke-width=".8"/><line x1="36" y1="112" x2="500" y2="112" stroke="#e4d9ca" stroke-width=".8"/><text x="32" y="18" text-anchor="end" font-size="7" fill="#8a7a6a">100%</text><text x="32" y="63" text-anchor="end" font-size="7" fill="#8a7a6a">50%</text><polyline points="55,110 95,107 136,95 162,66 182,38 200,20 218,38 240,66 272,95 314,107 365,110" fill="none" stroke="#1857a0" stroke-width="1.5" stroke-dasharray="5,3" opacity=".75"/><polyline points="66,110 106,106 148,93 174,62 196,35 214,18 232,35 256,62 290,93 336,106 384,110" fill="none" stroke="#2a6048" stroke-width="2"/><polyline points="82,110 126,105 166,84 208,52 246,26 272,13 302,26 342,52 386,84 430,105 476,110" fill="none" stroke="#b85835" stroke-width="2.5"/><line x1="200" y1="20" x2="200" y2="112" stroke="#1857a0" stroke-width=".6" stroke-dasharray="3,4" opacity=".6"/><line x1="214" y1="18" x2="214" y2="112" stroke="#2a6048" stroke-width=".6" stroke-dasharray="3,4"/><line x1="272" y1="13" x2="272" y2="112" stroke="#b85835" stroke-width=".6" stroke-dasharray="3,4"/><text x="140" y="124" text-anchor="middle" font-size="8" fill="#8a7a6a">400</text><text x="200" y="124" text-anchor="middle" font-size="8" fill="#1857a0">480</text><text x="236" y="124" text-anchor="middle" font-size="8" fill="#2a6048">507</text><text x="272" y="124" text-anchor="middle" font-size="8" fill="#b85835">555</text><text x="410" y="124" text-anchor="middle" font-size="8" fill="#8a7a6a">700nm</text><rect x="356" y="16" width="8" height="8" rx="2" fill="#b85835"/><text x="368" y="23" font-size="9" fill="#16120e">Photopic cones 555nm</text><rect x="356" y="30" width="8" height="8" rx="2" fill="#2a6048"/><text x="368" y="37" font-size="9" fill="#16120e">Scotopic rods 507nm</text><rect x="356" y="44" width="8" height="8" rx="2" fill="#1857a0" opacity=".75"/><text x="368" y="51" font-size="9" fill="#16120e">ipRGC melanopsin 480nm</text><text x="258" y="138" text-anchor="middle" font-size="9" fill="#8a7a6a">Three separate receptor systems — each drives different responses</text></svg>`,
"1.4":`<svg viewBox="0 0 520 128" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto"><defs><linearGradient id="cg1" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#FF9020"/><stop offset="30%" stop-color="#FFD888"/><stop offset="55%" stop-color="#FFFAF4"/><stop offset="80%" stop-color="#EEF2FF"/><stop offset="100%" stop-color="#BBCCFF"/></linearGradient></defs><text x="16" y="16" font-size="8" fill="#b85835" font-weight="500">◀ Warm</text><text x="504" y="16" text-anchor="end" font-size="8" fill="#4455bb" font-weight="500">Cool ▶</text><rect x="16" y="20" width="488" height="28" rx="4" fill="url(#cg1)" stroke="#e4d9ca" stroke-width=".5"/><line x1="16" y1="48" x2="16" y2="58" stroke="#cfc3b0" stroke-width=".7"/><text x="16" y="66" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace">1900K</text><text x="16" y="76" text-anchor="middle" font-size="7" fill="#8a7a6a">Candle</text><line x1="82" y1="48" x2="82" y2="58" stroke="#cfc3b0" stroke-width=".7"/><text x="82" y="66" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace">2700K</text><text x="82" y="76" text-anchor="middle" font-size="7" fill="#8a7a6a">Incandescent</text><line x1="192" y1="48" x2="192" y2="58" stroke="#cfc3b0" stroke-width=".7"/><text x="192" y="66" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace">3500K</text><text x="192" y="76" text-anchor="middle" font-size="7" fill="#8a7a6a">Neutral</text><line x1="288" y1="48" x2="288" y2="58" stroke="#cfc3b0" stroke-width=".7"/><text x="288" y="66" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace">4000K</text><text x="192" y="89" text-anchor="middle" font-size="7" fill="#8a7a6a">Cool white</text><line x1="414" y1="48" x2="414" y2="58" stroke="#cfc3b0" stroke-width=".7"/><text x="414" y="66" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace">5800K</text><text x="414" y="76" text-anchor="middle" font-size="7" fill="#8a7a6a">Noon daylight</text><line x1="504" y1="48" x2="504" y2="58" stroke="#cfc3b0" stroke-width=".7"/><text x="504" y="66" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace">6500K</text><text x="504" y="76" text-anchor="middle" font-size="7" fill="#8a7a6a">Overcast</text><rect x="16" y="90" width="142" height="34" rx="4" fill="#fff5ee" stroke="#b85835" stroke-width=".7"/><text x="87" y="106" text-anchor="middle" font-size="9" fill="#b85835" font-weight="500">2700–3000K</text><text x="87" y="118" text-anchor="middle" font-size="8" fill="#8a7a6a">Restaurant · Home</text><rect x="168" y="90" width="178" height="34" rx="4" fill="#fdfaf6" stroke="#e4d9ca" stroke-width=".7"/><text x="257" y="106" text-anchor="middle" font-size="9" fill="#16120e" font-weight="500">3500–4000K</text><text x="257" y="118" text-anchor="middle" font-size="8" fill="#8a7a6a">Office · School · Retail</text><rect x="356" y="90" width="162" height="34" rx="4" fill="#eef0ff" stroke="#4455bb" stroke-width=".7"/><text x="437" y="106" text-anchor="middle" font-size="9" fill="#4455bb" font-weight="500">5000–6500K</text><text x="437" y="118" text-anchor="middle" font-size="8" fill="#8a7a6a">Healthcare · Lab</text></svg>`,
"1.5":`<svg viewBox="0 0 520 148" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto"><rect x="8" y="8" width="228" height="132" rx="5" fill="#fdfaf6" stroke="#e4d9ca" stroke-width=".5"/><text x="122" y="25" text-anchor="middle" font-size="10" fill="#16120e" font-weight="500">CRI scale (Ra)</text><rect x="20" y="32" width="200" height="12" rx="2" fill="#2a6048"/><text x="226" y="41" text-anchor="end" font-size="8" fill="#fff" font-weight="500">Ra 100 perfect</text><rect x="20" y="48" width="176" height="12" rx="2" fill="#2a6048" opacity=".65"/><text x="202" y="57" text-anchor="end" font-size="8" fill="#fff">Ra 90 excellent</text><rect x="20" y="64" width="140" height="12" rx="2" fill="#b85835" opacity=".8"/><text x="166" y="73" text-anchor="end" font-size="8" fill="#fff">Ra 80 good</text><rect x="20" y="80" width="108" height="12" rx="2" fill="#e8a020" opacity=".8"/><text x="134" y="89" text-anchor="end" font-size="8" fill="#fff">Ra 70 acceptable</text><rect x="20" y="96" width="76" height="12" rx="2" fill="#cc3333" opacity=".65"/><text x="102" y="105" text-anchor="end" font-size="8" fill="#fff">Ra 60 poor</text><rect x="20" y="115" width="200" height="20" rx="3" fill="#b85835" opacity=".08" stroke="#b85835" stroke-width=".6"/><text x="120" y="126" text-anchor="middle" font-size="8" fill="#b85835" font-weight="500">R9 NOT in Ra — specify ≥50 separately</text><rect x="248" y="8" width="264" height="132" rx="5" fill="#fdfaf6" stroke="#e4d9ca" stroke-width=".5"/><text x="380" y="25" text-anchor="middle" font-size="10" fill="#16120e" font-weight="500">TM-30 — two metrics</text><rect x="260" y="32" width="112" height="50" rx="4" fill="#fff" stroke="#2a6048" stroke-width=".8"/><text x="316" y="52" text-anchor="middle" font-size="14" fill="#2a6048" font-weight="500">Rf</text><text x="316" y="65" text-anchor="middle" font-size="8" fill="#8a7a6a">Fidelity · 99 samples</text><text x="316" y="76" text-anchor="middle" font-size="8" fill="#2a6048">0–100 like CRI</text><rect x="382" y="32" width="120" height="50" rx="4" fill="#fff" stroke="#b85835" stroke-width=".8"/><text x="442" y="52" text-anchor="middle" font-size="14" fill="#b85835" font-weight="500">Rg</text><text x="442" y="65" text-anchor="middle" font-size="8" fill="#8a7a6a">Gamut index</text><text x="442" y="76" text-anchor="middle" font-size="8" fill="#b85835">>100 vivid <100 flat</text><rect x="260" y="90" width="112" height="44" rx="4" fill="#e8f5ee" stroke="#2a6048" stroke-width=".5"/><text x="316" y="106" text-anchor="middle" font-size="8" fill="#2a6048" font-weight="500">Museum / Hospital</text><text x="316" y="118" text-anchor="middle" font-size="8" fill="#8a7a6a">Rf ≥90 · Rg ~100</text><rect x="382" y="90" width="120" height="44" rx="4" fill="#fff5ee" stroke="#b85835" stroke-width=".5"/><text x="442" y="106" text-anchor="middle" font-size="8" fill="#b85835" font-weight="500">Grocery / Fashion</text><text x="442" y="118" text-anchor="middle" font-size="8" fill="#8a7a6a">Rf ≥85 · Rg >105</text></svg>`,
"1.6":`<svg viewBox="0 0 520 130" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">COMPLETE COLOUR RENDERING SPECIFICATION</text><rect x="8" y="18" width="112" height="84" rx="5" fill="#fff5ee" stroke="#b85835" stroke-width="1"/><text x="64" y="36" text-anchor="middle" font-size="9" fill="#b85835" font-family="monospace" font-weight="500">CCT</text><text x="64" y="50" text-anchor="middle" font-size="8" fill="#16120e">Appearance</text><text x="64" y="63" text-anchor="middle" font-size="8" fill="#8a7a6a">2700K warm</text><text x="64" y="75" text-anchor="middle" font-size="8" fill="#8a7a6a">4000K neutral</text><text x="64" y="87" text-anchor="middle" font-size="8" fill="#8a7a6a">6500K cool</text><text x="124" y="64" text-anchor="middle" font-size="15" fill="#8a7a6a" opacity=".35">+</text><rect x="130" y="18" width="112" height="84" rx="5" fill="#e8f5ee" stroke="#2a6048" stroke-width="1"/><text x="186" y="36" text-anchor="middle" font-size="9" fill="#2a6048" font-family="monospace" font-weight="500">Min Ra</text><text x="186" y="50" text-anchor="middle" font-size="8" fill="#16120e">Colour fidelity</text><text x="186" y="63" text-anchor="middle" font-size="8" fill="#8a7a6a">≥70 industrial</text><text x="186" y="75" text-anchor="middle" font-size="8" fill="#8a7a6a">≥80 offices</text><text x="186" y="87" text-anchor="middle" font-size="8" fill="#2a6048" font-weight="500">≥90 critical</text><text x="246" y="64" text-anchor="middle" font-size="15" fill="#8a7a6a" opacity=".35">+</text><rect x="252" y="18" width="112" height="84" rx="5" fill="#ffeef0" stroke="#cc3344" stroke-width="1"/><text x="308" y="36" text-anchor="middle" font-size="9" fill="#cc3344" font-family="monospace" font-weight="500">Min R9</text><text x="308" y="50" text-anchor="middle" font-size="8" fill="#16120e">Saturated red</text><text x="308" y="63" text-anchor="middle" font-size="8" fill="#8a7a6a">NOT in Ra</text><text x="308" y="75" text-anchor="middle" font-size="8" fill="#cc3344" font-weight="500">Specify ≥ 50</text><text x="308" y="87" text-anchor="middle" font-size="8" fill="#8a7a6a">retail/health</text><text x="368" y="64" text-anchor="middle" font-size="15" fill="#8a7a6a" opacity=".35">+</text><rect x="374" y="18" width="138" height="84" rx="5" fill="#eef0ff" stroke="#4455bb" stroke-width="1"/><text x="443" y="36" text-anchor="middle" font-size="9" fill="#4455bb" font-family="monospace" font-weight="500">SDCM</text><text x="443" y="50" text-anchor="middle" font-size="8" fill="#16120e">Consistency</text><text x="443" y="63" text-anchor="middle" font-size="8" fill="#4455bb" font-weight="500">≤ 3-step</text><text x="443" y="75" text-anchor="middle" font-size="8" fill="#8a7a6a">adjacent fixtures</text><text x="443" y="87" text-anchor="middle" font-size="8" fill="#8a7a6a">look identical</text><rect x="8" y="108" width="504" height="18" rx="4" fill="#fdfaf6" stroke="#e4d9ca" stroke-width=".5"/><text x="260" y="121" text-anchor="middle" font-size="9" fill="#16120e" font-weight="500">None alone is sufficient — always specify all four together</text></svg>`,
"2.1":`<svg viewBox="0 0 520 130" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">FLUORESCENT LAMP — HOW IT WORKS</text><rect x="28" y="20" width="464" height="36" rx="18" fill="none" stroke="#e4d9ca" stroke-width="1.5"/><rect x="34" y="26" width="452" height="24" rx="12" fill="#e8eef8" opacity=".5"/><text x="260" y="42" text-anchor="middle" font-size="9" fill="#1857a0" font-weight="500">Mercury vapour discharge tube — low pressure</text><circle cx="28" cy="38" r="9" fill="#e8eef8" stroke="#1857a0" stroke-width="1"/><circle cx="492" cy="38" r="9" fill="#e8eef8" stroke="#1857a0" stroke-width="1"/><text x="260" y="72" text-anchor="middle" font-size="8" fill="#8a7a6a">↓  Mercury discharge emits UV at 254 nm  ↓</text><rect x="28" y="80" width="464" height="18" rx="3" fill="#b85835" opacity=".12" stroke="#b85835" stroke-width=".6"/><text x="260" y="93" text-anchor="middle" font-size="8" fill="#b85835" font-weight="500">Phosphor coating converts UV → visible light (CCT &amp; CRI set by phosphor mix)</text><rect x="68" y="108" width="96" height="16" rx="3" fill="#FFD080" opacity=".8"/><text x="116" y="120" text-anchor="middle" font-size="8" fill="#7a5a00">2700K warm</text><rect x="212" y="108" width="96" height="16" rx="3" fill="#FFFAF4" stroke="#e4d9ca" stroke-width=".5"/><text x="260" y="120" text-anchor="middle" font-size="8" fill="#8a7a6a">4000K neutral</text><rect x="356" y="108" width="96" height="16" rx="3" fill="#E8EEFF"/><text x="404" y="120" text-anchor="middle" font-size="8" fill="#4455bb">6500K cool</text></svg>`,
"2.2":`<svg viewBox="0 0 520 138" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">MAGNETIC vs ELECTRONIC BALLAST</text><rect x="8" y="18" width="242" height="112" rx="5" fill="#fdfaf6" stroke="#e4d9ca" stroke-width=".5"/><text x="129" y="36" text-anchor="middle" font-size="10" fill="#16120e" font-weight="500">Magnetic ballast</text><text x="129" y="51" text-anchor="middle" font-size="9" fill="#8a7a6a">Operates at 50 / 60 Hz</text><text x="129" y="65" text-anchor="middle" font-size="9" fill="#cc3344">100 / 120 Hz flicker</text><text x="129" y="79" text-anchor="middle" font-size="9" fill="#cc3344">Stroboscopic on machinery</text><text x="129" y="93" text-anchor="middle" font-size="9" fill="#8a7a6a">Heavy · inefficient</text><text x="129" y="107" text-anchor="middle" font-size="9" fill="#8a7a6a">Cannot dim smoothly</text><text x="129" y="121" text-anchor="middle" font-size="8" fill="#8a7a6a">~15% efficacy penalty</text><rect x="270" y="18" width="242" height="112" rx="5" fill="#e8f5ee" stroke="#2a6048" stroke-width=".8"/><text x="391" y="36" text-anchor="middle" font-size="10" fill="#2a6048" font-weight="500">Electronic ballast</text><text x="391" y="51" text-anchor="middle" font-size="9" fill="#8a7a6a">Operates at 20k–50k Hz</text><text x="391" y="65" text-anchor="middle" font-size="9" fill="#2a6048">No perceptible flicker</text><text x="391" y="79" text-anchor="middle" font-size="9" fill="#2a6048">10–30% more efficient</text><text x="391" y="93" text-anchor="middle" font-size="9" fill="#8a7a6a">Compact · lighter</text><text x="391" y="107" text-anchor="middle" font-size="9" fill="#2a6048">Dimmable (0–10V/DALI)</text><text x="391" y="121" text-anchor="middle" font-size="8" fill="#8a7a6a">Longer lamp life</text></svg>`,
"2.3":`<svg viewBox="0 0 520 138" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">THREE LED RETROFIT PATHS</text><rect x="8" y="18" width="154" height="112" rx="5" fill="#fdfaf6" stroke="#e4d9ca" stroke-width=".5"/><text x="85" y="35" text-anchor="middle" font-size="9" fill="#16120e" font-weight="500">Path 1 — Type A</text><text x="85" y="49" text-anchor="middle" font-size="8" fill="#b85835" font-weight="500">Lamp swap only</text><text x="85" y="63" text-anchor="middle" font-size="8" fill="#8a7a6a">LED tube into</text><text x="85" y="75" text-anchor="middle" font-size="8" fill="#8a7a6a">existing ballast</text><text x="85" y="87" text-anchor="middle" font-size="8" fill="#8a7a6a">No electrical work</text><text x="85" y="99" text-anchor="middle" font-size="8" fill="#cc3344">Limited by ballast</text><text x="85" y="121" text-anchor="middle" font-size="8" fill="#8a7a6a">Lowest first cost</text><rect x="182" y="18" width="154" height="112" rx="5" fill="#e8eef8" stroke="#1857a0" stroke-width=".8"/><text x="259" y="35" text-anchor="middle" font-size="9" fill="#1857a0" font-weight="500">Path 2 — Type B</text><text x="259" y="49" text-anchor="middle" font-size="8" fill="#1857a0" font-weight="500">Ballast bypass</text><text x="259" y="63" text-anchor="middle" font-size="8" fill="#8a7a6a">Remove ballast</text><text x="259" y="75" text-anchor="middle" font-size="8" fill="#8a7a6a">Wire direct to mains</text><text x="259" y="87" text-anchor="middle" font-size="8" fill="#8a7a6a">Needs electrician</text><text x="259" y="99" text-anchor="middle" font-size="8" fill="#2a6048">No ballast failure</text><text x="259" y="121" text-anchor="middle" font-size="8" fill="#8a7a6a">Medium first cost</text><rect x="356" y="18" width="156" height="112" rx="5" fill="#e8f5ee" stroke="#2a6048" stroke-width=".8"/><text x="434" y="35" text-anchor="middle" font-size="9" fill="#2a6048" font-weight="500">Path 3 — Type C</text><text x="434" y="49" text-anchor="middle" font-size="8" fill="#2a6048" font-weight="500">Full fixture replace</text><text x="434" y="63" text-anchor="middle" font-size="8" fill="#8a7a6a">New complete LED</text><text x="434" y="75" text-anchor="middle" font-size="8" fill="#2a6048">Best photometrics</text><text x="434" y="87" text-anchor="middle" font-size="8" fill="#2a6048">DLC rebate eligible</text><text x="434" y="99" text-anchor="middle" font-size="8" fill="#2a6048">Best 10-yr TCO</text><text x="434" y="121" text-anchor="middle" font-size="8" fill="#8a7a6a">Highest first cost</text></svg>`,
"2.4":`<svg viewBox="0 0 520 138" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">HID LAMP TYPES COMPARED</text><rect x="8" y="18" width="154" height="112" rx="5" fill="#fdfaf6" stroke="#e4d9ca" stroke-width=".5"/><text x="85" y="35" text-anchor="middle" font-size="9" fill="#16120e" font-weight="500">High-Pressure Sodium</text><text x="85" y="48" text-anchor="middle" font-size="8" fill="#b85835" font-weight="500">HPS (SON)</text><text x="85" y="62" text-anchor="middle" font-size="8" fill="#8a7a6a">CCT 2000–2500K</text><text x="85" y="75" text-anchor="middle" font-size="8" fill="#cc3344">Ra 10–80 poor</text><text x="85" y="88" text-anchor="middle" font-size="8" fill="#2a6048">50–130 lm/W</text><text x="85" y="101" text-anchor="middle" font-size="8" fill="#8a7a6a">Amber-yellow</text><text x="85" y="121" text-anchor="middle" font-size="8" fill="#cc3344">10–20 min restrike</text><rect x="182" y="18" width="154" height="112" rx="5" fill="#e8eef8" stroke="#1857a0" stroke-width=".8"/><text x="259" y="35" text-anchor="middle" font-size="9" fill="#1857a0" font-weight="500">Metal Halide</text><text x="259" y="48" text-anchor="middle" font-size="8" fill="#1857a0" font-weight="500">MH / CMH</text><text x="259" y="62" text-anchor="middle" font-size="8" fill="#8a7a6a">CCT 3000–5600K</text><text x="259" y="75" text-anchor="middle" font-size="8" fill="#2a6048">Ra 65–95 good</text><text x="259" y="88" text-anchor="middle" font-size="8" fill="#2a6048">75–140 lm/W</text><text x="259" y="101" text-anchor="middle" font-size="8" fill="#8a7a6a">Neutral-cool white</text><text x="259" y="121" text-anchor="middle" font-size="8" fill="#cc3344">10–20 min restrike</text><rect x="356" y="18" width="156" height="112" rx="5" fill="#fff8ee" stroke="#b85835" stroke-width=".8"/><text x="434" y="35" text-anchor="middle" font-size="9" fill="#b85835" font-weight="500">Compact Fluor.</text><text x="434" y="48" text-anchor="middle" font-size="8" fill="#b85835" font-weight="500">CFL</text><text x="434" y="62" text-anchor="middle" font-size="8" fill="#8a7a6a">CCT 2700–6500K</text><text x="434" y="75" text-anchor="middle" font-size="8" fill="#8a7a6a">Ra ~80</text><text x="434" y="88" text-anchor="middle" font-size="8" fill="#8a7a6a">50–85 lm/W</text><text x="434" y="101" text-anchor="middle" font-size="8" fill="#cc3344">1–3 min warm-up</text><text x="434" y="121" text-anchor="middle" font-size="8" fill="#cc3344">Mercury disposal</text></svg>`,
"2.5":`<svg viewBox="0 0 520 138" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">LUMINOUS EFFICACY — lm/W AT LUMINAIRE LEVEL</text><line x1="120" y1="18" x2="120" y2="118" stroke="#e4d9ca" stroke-width=".8"/><line x1="120" y1="118" x2="510" y2="118" stroke="#e4d9ca" stroke-width=".8"/><text x="116" y="22" text-anchor="end" font-size="7" fill="#8a7a6a">170</text><text x="116" y="52" text-anchor="end" font-size="7" fill="#8a7a6a">130</text><text x="116" y="82" text-anchor="end" font-size="7" fill="#8a7a6a">80</text><text x="116" y="112" text-anchor="end" font-size="7" fill="#8a7a6a">15</text><rect x="138" y="104" width="36" height="14" rx="2" fill="#cc3344" opacity=".7"/><text x="156" y="128" text-anchor="middle" font-size="7" fill="#8a7a6a">Incand.</text><rect x="192" y="72" width="36" height="46" rx="2" fill="#e8a020" opacity=".8"/><text x="210" y="128" text-anchor="middle" font-size="7" fill="#8a7a6a">CFL</text><rect x="246" y="56" width="36" height="62" rx="2" fill="#b85835" opacity=".8"/><text x="264" y="128" text-anchor="middle" font-size="7" fill="#8a7a6a">T8 Fl.</text><rect x="300" y="50" width="36" height="68" rx="2" fill="#1857a0" opacity=".8"/><text x="318" y="128" text-anchor="middle" font-size="7" fill="#8a7a6a">HPS</text><rect x="354" y="42" width="36" height="76" rx="2" fill="#7a3a9a" opacity=".8"/><text x="372" y="128" text-anchor="middle" font-size="7" fill="#8a7a6a">Metal H.</text><rect x="408" y="18" width="36" height="100" rx="2" fill="#2a6048"/><text x="426" y="128" text-anchor="middle" font-size="7" fill="#8a7a6a">LED</text><text x="156" y="101" text-anchor="middle" font-size="7" fill="#fff">15</text><text x="210" y="69" text-anchor="middle" font-size="7" fill="#fff">68</text><text x="264" y="53" text-anchor="middle" font-size="7" fill="#fff">85</text><text x="318" y="47" text-anchor="middle" font-size="7" fill="#fff">105</text><text x="372" y="39" text-anchor="middle" font-size="7" fill="#fff">120</text><text x="426" y="15" text-anchor="middle" font-size="8" fill="#2a6048" font-weight="500">150+</text><text x="260" y="138" text-anchor="middle" font-size="8" fill="#8a7a6a">Always compare at luminaire level — not bare lamp efficacy</text></svg>`,
"2.6":`<svg viewBox="0 0 520 130" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">SOURCE SELECTION DECISION FRAMEWORK</text><rect x="8" y="18" width="504" height="28" rx="4" fill="#fff5ee" stroke="#b85835" stroke-width=".8"/><text x="260" y="30" text-anchor="middle" font-size="9" fill="#b85835" font-weight="500">Step 1 — Hard constraint filter</text><text x="260" y="41" text-anchor="middle" font-size="8" fill="#8a7a6a">Ra requirement · Instant restrike · Cold temperature · Dimmability required</text><text x="260" y="58" text-anchor="middle" font-size="16" fill="#8a7a6a" opacity=".3">↓</text><rect x="8" y="62" width="504" height="28" rx="4" fill="#e8f5ee" stroke="#2a6048" stroke-width=".8"/><text x="260" y="74" text-anchor="middle" font-size="9" fill="#2a6048" font-weight="500">Step 2 — Compare remaining options on 10-year TCO</text><text x="260" y="85" text-anchor="middle" font-size="8" fill="#8a7a6a">First cost + PV(energy) + PV(maintenance) + disposal</text><text x="260" y="102" text-anchor="middle" font-size="16" fill="#8a7a6a" opacity=".3">↓</text><rect x="8" y="106" width="504" height="22" rx="4" fill="#fdfaf6" stroke="#e4d9ca" stroke-width=".5"/><text x="260" y="121" text-anchor="middle" font-size="8" fill="#16120e" font-weight="500">Traps: HID + instant restrike · Lamp efficacy for LPD calc · Low-CRI for colour-critical task</text></svg>`,
"3.1":`<svg viewBox="0 0 520 130" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">P-N JUNCTION — LED LIGHT EMISSION</text><rect x="40" y="20" width="180" height="80" rx="5" fill="#e8eef8" stroke="#1857a0" stroke-width=".8"/><text x="130" y="42" text-anchor="middle" font-size="11" fill="#1857a0" font-weight="500">N-type</text><text x="130" y="57" text-anchor="middle" font-size="9" fill="#8a7a6a">Free electrons (−)</text><text x="130" y="70" text-anchor="middle" font-size="8" fill="#8a7a6a">e⁻  e⁻  e⁻  e⁻</text><text x="130" y="83" text-anchor="middle" font-size="8" fill="#8a7a6a">Donor atoms doped in</text><rect x="300" y="20" width="180" height="80" rx="5" fill="#fff5ee" stroke="#b85835" stroke-width=".8"/><text x="390" y="42" text-anchor="middle" font-size="11" fill="#b85835" font-weight="500">P-type</text><text x="390" y="57" text-anchor="middle" font-size="9" fill="#8a7a6a">Holes (+)</text><text x="390" y="70" text-anchor="middle" font-size="8" fill="#8a7a6a">○  ○  ○  ○</text><text x="390" y="83" text-anchor="middle" font-size="8" fill="#8a7a6a">Acceptor atoms doped in</text><line x1="220" y1="60" x2="300" y2="60" stroke="#e4d9ca" stroke-width="1.5" stroke-dasharray="4,3"/><text x="260" y="56" text-anchor="middle" font-size="8" fill="#8a7a6a">Junction</text><text x="260" y="74" text-anchor="middle" font-size="18" fill="#b85835">→</text><circle cx="260" cy="60" r="16" fill="#FFD700" opacity=".3" stroke="#FFD700" stroke-width="1"/><text x="260" y="64" text-anchor="middle" font-size="9" fill="#b85835" font-weight="500">hν</text><text x="260" y="106" text-anchor="middle" font-size="9" fill="#16120e" font-weight="500">Electron falls from N to P → releases photon (hν)</text><text x="260" y="120" text-anchor="middle" font-size="8" fill="#8a7a6a">Bandgap energy determines wavelength · Bandgap determines colour</text></svg>`,
"3.2":`<svg viewBox="0 0 520 128" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">FOUR PARTS OF A LUMINAIRE</text><rect x="8" y="18" width="114" height="90" rx="5" fill="#fff5ee" stroke="#b85835" stroke-width="1"/><text x="65" y="36" text-anchor="middle" font-size="8" fill="#b85835" font-family="monospace" font-weight="500">① LED SOURCE</text><text x="65" y="50" text-anchor="middle" font-size="8" fill="#16120e">Package / module</text><text x="65" y="63" text-anchor="middle" font-size="8" fill="#8a7a6a">Generates photons</text><text x="65" y="76" text-anchor="middle" font-size="8" fill="#8a7a6a">Bandgap sets colour</text><text x="65" y="100" text-anchor="middle" font-size="8" fill="#b85835">Tested: LM-79</text><rect x="134" y="18" width="114" height="90" rx="5" fill="#e8eef8" stroke="#1857a0" stroke-width="1"/><text x="191" y="36" text-anchor="middle" font-size="8" fill="#1857a0" font-family="monospace" font-weight="500">② DRIVER</text><text x="191" y="50" text-anchor="middle" font-size="8" fill="#16120e">AC → DC converter</text><text x="191" y="63" text-anchor="middle" font-size="8" fill="#8a7a6a">Controls current</text><text x="191" y="76" text-anchor="middle" font-size="8" fill="#8a7a6a">Handles dimming</text><text x="191" y="100" text-anchor="middle" font-size="8" fill="#cc3344">Top failure cause</text><rect x="260" y="18" width="114" height="90" rx="5" fill="#e8f5ee" stroke="#2a6048" stroke-width="1"/><text x="317" y="36" text-anchor="middle" font-size="8" fill="#2a6048" font-family="monospace" font-weight="500">③ THERMAL</text><text x="317" y="50" text-anchor="middle" font-size="8" fill="#16120e">Heat sink + TIM</text><text x="317" y="63" text-anchor="middle" font-size="8" fill="#8a7a6a">Junction→ambient</text><text x="317" y="76" text-anchor="middle" font-size="8" fill="#8a7a6a">path critical</text><text x="317" y="100" text-anchor="middle" font-size="8" fill="#2a6048">Tested: LM-80</text><rect x="386" y="18" width="126" height="90" rx="5" fill="#f3eef8" stroke="#7a3a9a" stroke-width="1"/><text x="449" y="36" text-anchor="middle" font-size="8" fill="#7a3a9a" font-family="monospace" font-weight="500">④ OPTICS</text><text x="449" y="50" text-anchor="middle" font-size="8" fill="#16120e">Lens/reflector</text><text x="449" y="63" text-anchor="middle" font-size="8" fill="#8a7a6a">Diffuser / baffle</text><text x="449" y="76" text-anchor="middle" font-size="8" fill="#8a7a6a">Shapes distribution</text><text x="449" y="100" text-anchor="middle" font-size="8" fill="#7a3a9a">IES file output</text><text x="260" y="120" text-anchor="middle" font-size="9" fill="#16120e" font-weight="500">All four must be tested together as a system — LM-79 on complete luminaire</text></svg>`,
"3.3":`<svg viewBox="0 0 520 128" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">THERMAL PATH — LED JUNCTION TO AMBIENT AIR</text><rect x="8" y="20" width="504" height="26" rx="3" fill="#b85835" opacity=".15" stroke="#b85835" stroke-width=".8"/><text x="260" y="37" text-anchor="middle" font-size="10" fill="#b85835" font-weight="500">LED Junction (highest temp — target ≤85°C)</text><text x="260" y="55" text-anchor="middle" font-size="10" fill="#8a7a6a">↓  conduction  ↓</text><rect x="8" y="60" width="504" height="16" rx="3" fill="#e8a020" opacity=".2" stroke="#e8a020" stroke-width=".6"/><text x="260" y="72" text-anchor="middle" font-size="8" fill="#7a5a00">Solder pad → MCPCB (metal-core PCB)</text><text x="260" y="85" text-anchor="middle" font-size="10" fill="#8a7a6a">↓  TIM (thermal interface material)  ↓</text><rect x="8" y="90" width="504" height="16" rx="3" fill="#2a6048" opacity=".15" stroke="#2a6048" stroke-width=".6"/><text x="260" y="102" text-anchor="middle" font-size="8" fill="#2a6048">Heat sink — aluminium fins dissipate to ambient by convection</text><text x="260" y="118" text-anchor="middle" font-size="9" fill="#16120e" font-weight="500">Every 10°C rise in junction temp → flux drops, colour shifts blue, L70 life ~halves</text></svg>`,
"3.4":`<svg viewBox="0 0 520 138" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">CC vs CV DRIVER — WHEN TO USE EACH</text><rect x="8" y="18" width="242" height="110" rx="5" fill="#e8f5ee" stroke="#2a6048" stroke-width=".8"/><text x="129" y="36" text-anchor="middle" font-size="10" fill="#2a6048" font-weight="500">Constant Current (CC)</text><text x="129" y="50" text-anchor="middle" font-size="8" fill="#8a7a6a">Fixed output: 350/700/1050 mA</text><text x="129" y="63" text-anchor="middle" font-size="8" fill="#16120e">Single fixture applications</text><text x="129" y="76" text-anchor="middle" font-size="8" fill="#16120e">Downlights · track · high-bay</text><text x="129" y="89" text-anchor="middle" font-size="8" fill="#2a6048">Prevents thermal runaway</text><text x="129" y="102" text-anchor="middle" font-size="8" fill="#2a6048">Consistent lumen output</text><text x="129" y="118" text-anchor="middle" font-size="8" fill="#8a7a6a">Most common driver type</text><rect x="270" y="18" width="242" height="110" rx="5" fill="#e8eef8" stroke="#1857a0" stroke-width=".8"/><text x="391" y="36" text-anchor="middle" font-size="10" fill="#1857a0" font-weight="500">Constant Voltage (CV)</text><text x="391" y="50" text-anchor="middle" font-size="8" fill="#8a7a6a">Fixed output: 12V or 24V DC</text><text x="391" y="63" text-anchor="middle" font-size="8" fill="#16120e">Distributed load systems</text><text x="391" y="76" text-anchor="middle" font-size="8" fill="#16120e">LED strip · signage · coves</text><text x="391" y="89" text-anchor="middle" font-size="8" fill="#8a7a6a">Strip has own resistors</text><text x="391" y="102" text-anchor="middle" font-size="8" fill="#8a7a6a">Layout flexibility</text><text x="391" y="118" text-anchor="middle" font-size="8" fill="#8a7a6a">Less efficient than CC</text></svg>`,
"3.5":`<svg viewBox="0 0 520 138" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">DIMMING PROTOCOL COMPARISON</text><rect x="8" y="18" width="118" height="112" rx="5" fill="#fdfaf6" stroke="#e4d9ca" stroke-width=".5"/><text x="67" y="34" text-anchor="middle" font-size="9" fill="#16120e" font-weight="500">0–10V</text><text x="67" y="48" text-anchor="middle" font-size="8" fill="#8a7a6a">1–10V = dim range</text><text x="67" y="61" text-anchor="middle" font-size="8" fill="#8a7a6a">0V = lamp off</text><text x="67" y="74" text-anchor="middle" font-size="8" fill="#8a7a6a">Separate wire</text><text x="67" y="87" text-anchor="middle" font-size="8" fill="#cc3344">No feedback</text><text x="67" y="100" text-anchor="middle" font-size="8" fill="#cc3344">Zone only</text><text x="67" y="113" text-anchor="middle" font-size="8" fill="#2a6048">Simple/cheap</text><rect x="136" y="18" width="118" height="112" rx="5" fill="#e8f5ee" stroke="#2a6048" stroke-width=".8"/><text x="195" y="34" text-anchor="middle" font-size="9" fill="#2a6048" font-weight="500">DALI-2</text><text x="195" y="48" text-anchor="middle" font-size="8" fill="#8a7a6a">IEC 62386</text><text x="195" y="61" text-anchor="middle" font-size="8" fill="#16120e">64 devices/bus</text><text x="195" y="74" text-anchor="middle" font-size="8" fill="#2a6048">Individual address</text><text x="195" y="87" text-anchor="middle" font-size="8" fill="#2a6048">Bidirectional</text><text x="195" y="100" text-anchor="middle" font-size="8" fill="#2a6048">Scene memory</text><text x="195" y="113" text-anchor="middle" font-size="8" fill="#2a6048">Fault reporting</text><rect x="264" y="18" width="118" height="112" rx="5" fill="#e8eef8" stroke="#1857a0" stroke-width=".8"/><text x="323" y="34" text-anchor="middle" font-size="9" fill="#1857a0" font-weight="500">PWM</text><text x="323" y="48" text-anchor="middle" font-size="8" fill="#8a7a6a">Duty-cycle switch</text><text x="323" y="61" text-anchor="middle" font-size="8" fill="#16120e">High freq (1kHz+)</text><text x="323" y="74" text-anchor="middle" font-size="8" fill="#2a6048">Stable colour</text><text x="323" y="87" text-anchor="middle" font-size="8" fill="#cc3344">Low freq = flicker</text><text x="323" y="100" text-anchor="middle" font-size="8" fill="#8a7a6a">Theatrical/retail</text><text x="323" y="113" text-anchor="middle" font-size="8" fill="#8a7a6a">TM-30/WELL metric</text><rect x="392" y="18" width="120" height="112" rx="5" fill="#fff5ee" stroke="#b85835" stroke-width=".8"/><text x="452" y="34" text-anchor="middle" font-size="9" fill="#b85835" font-weight="500">Triac/Phase</text><text x="452" y="48" text-anchor="middle" font-size="8" fill="#8a7a6a">Wallbox dimmer</text><text x="452" y="61" text-anchor="middle" font-size="8" fill="#16120e">Easy retrofit</text><text x="452" y="74" text-anchor="middle" font-size="8" fill="#cc3344">Driver compat.</text><text x="452" y="87" text-anchor="middle" font-size="8" fill="#cc3344">test required</text><text x="452" y="100" text-anchor="middle" font-size="8" fill="#8a7a6a">Residential</text><text x="452" y="113" text-anchor="middle" font-size="8" fill="#8a7a6a">common</text></svg>`,
"3.6":`<svg viewBox="0 0 520 128" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">POWER FACTOR &amp; THD — WHY THEY MATTER</text><rect x="8" y="18" width="242" height="96" rx="5" fill="#fdfaf6" stroke="#e4d9ca" stroke-width=".5"/><text x="129" y="34" text-anchor="middle" font-size="10" fill="#16120e" font-weight="500">Power Factor (PF)</text><text x="129" y="49" text-anchor="middle" font-size="8" fill="#8a7a6a">PF = Real power (W) ÷ Apparent (VA)</text><text x="129" y="63" text-anchor="middle" font-size="8" fill="#8a7a6a">PF 1.0 = ideal (resistive load)</text><text x="129" y="77" text-anchor="middle" font-size="8" fill="#cc3344">PF 0.7 = 43% extra current drawn</text><text x="129" y="91" text-anchor="middle" font-size="8" fill="#2a6048">Commercial spec: PF ≥ 0.90</text><text x="129" y="105" text-anchor="middle" font-size="8" fill="#2a6048">DLC QPL requires PF ≥ 0.90</text><rect x="270" y="18" width="242" height="96" rx="5" fill="#fdfaf6" stroke="#e4d9ca" stroke-width=".5"/><text x="391" y="34" text-anchor="middle" font-size="10" fill="#16120e" font-weight="500">Total Harmonic Distortion</text><text x="391" y="49" text-anchor="middle" font-size="8" fill="#8a7a6a">Deviation from pure 60 Hz sine</text><text x="391" y="63" text-anchor="middle" font-size="8" fill="#cc3344">3rd harmonics add in neutral wire</text><text x="391" y="77" text-anchor="middle" font-size="8" fill="#cc3344">Can overheat neutral conductor</text><text x="391" y="91" text-anchor="middle" font-size="8" fill="#2a6048">Specify THD &lt; 20%</text><text x="391" y="105" text-anchor="middle" font-size="8" fill="#2a6048">Premium: THD &lt; 10%</text><text x="260" y="122" text-anchor="middle" font-size="9" fill="#16120e" font-weight="500">Specify PF ≥ 0.90 and THD &lt; 20% for all commercial LED installations</text></svg>`
};
const LC_DATA = {
"1.1":{body:["Light is a form of <strong>electromagnetic energy</strong> — the same family as radio waves, microwaves, infrared radiation, ultraviolet light, and X-rays. What separates them is wavelength. Human vision responds to a narrow slice of this spectrum: approximately <strong>380 nanometres</strong> (deep violet) to <strong>780 nanometres</strong> (deep red). Everything within that window is perceived as light; everything outside is invisible, though it still carries energy — ultraviolet causes sunburn, infrared is felt as radiant warmth.","Light behaves simultaneously as a wave and as a particle — the <strong>wave-particle duality</strong> described by quantum theory. Its wave nature explains interference, diffraction, and refraction. Its particle nature — photons, discrete packets of energy — explains the photoelectric effect and, crucially, how LEDs emit light at a wavelength determined entirely by the semiconductor's bandgap energy.","For the lighting designer, the practical foundation is this: <strong>wavelength determines colour</strong>, and the mixture of wavelengths in a beam — the <strong>Spectral Power Distribution (SPD)</strong> — is the physical fingerprint of every light source. Every colour quality metric (CCT, CRI, TM-30) and every human health metric (melanopic lux) is derived directly from the SPD."],lp:["The visible spectrum runs from 380 nm (violet) to 780 nm (red). Below is UV; above is infrared — both invisible, both with biological effects.","The SPD is the complete fingerprint of a light source. Every colour rendering, circadian, and consistency metric is computed from it.","Wave behaviour explains reflection and refraction. Photon behaviour explains LED emission and phosphor conversion."],tts:"Lesson 1.1. What is light. Light is a form of electromagnetic energy — same family as radio waves, microwaves, and X-rays. Human vision responds to roughly 380 to 780 nanometres. Wavelength determines colour. The Spectral Power Distribution — the SPD — is the fingerprint of every source. CCT, CRI, TM-30, and melanopic lux are all derived from the SPD."},
"1.2":{body:["Photometry measures light as perceived by the human eye. Four quantities form the complete vocabulary. <strong>Luminous flux (Φ)</strong>, in lumens (lm), is total light output in all directions per second. <strong>Luminous intensity (I)</strong>, in candelas (cd), is flux concentrated into a specific direction. A narrow spotlight and a wide flood can share identical lumen outputs yet have vastly different candela values.","<strong>Illuminance (E)</strong>, in lux (lx) or foot-candles (fc), is the quantity of light falling on a unit area of surface. One lux = one lumen per square metre; 1 fc ≈ 10.76 lux. Illuminance follows the <strong>inverse-square law</strong>: double the distance from a point source and illuminance drops to one-quarter. <strong>Luminance (L)</strong>, in cd/m², describes the apparent brightness perceived by an observer — it is the quantity that causes glare.","These form two chains. The <strong>source chain</strong> runs Φ → I: from total lumens to directional intensity. The <strong>surface chain</strong> runs E → L: from incident flux per unit area to perceived brightness. Confusing these four quantities is the most common conceptual error on lighting examinations."],lp:["Φ = lumens (total flux), I = candelas (directional), E = lux/fc (per unit area), L = cd/m² (perceived brightness, causes glare).","E = I/d². Double distance → ¼ illuminance. 1 fc = 10.76 lux. Luminance (not illuminance) is what UGR controls.","Instruments: integrating sphere for Φ; goniophotometer for I; illuminance meter for E; luminance camera for L."],tts:"Lesson 1.2. The four photometric quantities. Phi equals lumens — total flux. I equals candelas — directional intensity. E equals lux — flux per unit area. L equals candelas per square metre — perceived brightness and glare. E equals I divided by d-squared. Double the distance gives one quarter the illuminance. One foot-candle equals 10.76 lux."},
"1.3":{body:["The retina contains two photoreceptors. <strong>Cones</strong>, active above ~3 cd/m², provide colour vision with photopic sensitivity peaking at <strong>555 nm</strong>. <strong>Rods</strong> are 1,000× more sensitive, achromatic, and peak at <strong>507 nm</strong>. Rods dominate below ~0.001 cd/m². Between these extremes lies the <strong>mesopic range</strong> where both are simultaneously active.","The 48 nm peak difference creates the <strong>S/P ratio</strong> effect. Under mesopic conditions — roadways, parking — a cool-white LED, rich in blue-green content, stimulates rods more effectively per photopic lux. High S/P sources (S/P > 1.5) can appear 20–40% brighter than warm-white at equivalent lux, allowing wattage reductions while maintaining perceived safety.","The retina also contains <strong>ipRGCs</strong> — intrinsically photosensitive retinal ganglion cells — containing <strong>melanopsin</strong> with peak sensitivity at ~<strong>480 nm</strong>. They drive circadian rhythm synchronisation via the SCN, alertness, and melatonin suppression. Because their peak differs from both rods and cones, <strong>melanopic lux (EML)</strong> is a completely separate calculation from photopic lux. WELL v2 requires ≥200 EML at the eye during morning hours."],lp:["Three modes: photopic (cones, >3 cd/m², 555 nm), scotopic (rods, <0.001 cd/m², 507 nm, achromatic), mesopic (both active, roadway/parking design).","S/P ratio: cool-white LEDs stimulate rods more per photopic lux under mesopic conditions — enables wattage reductions while maintaining perceived brightness.","ipRGCs (melanopsin, ~480 nm) drive circadian health, not image vision. Melanopic lux ≠ photopic lux. WELL v2 requires ≥200 EML during morning hours."],tts:"Lesson 1.3. Photopic and scotopic vision. Cones peak at 555 nanometres, active above 3 candelas per square metre, provide colour vision. Rods peak at 507 nanometres, 1000 times more sensitive, achromatic. The mesopic range is where both are active — relevant for roadway design. The S-P ratio: cool-white LEDs appear brighter per photopic lux under mesopic conditions. ipRGCs with melanopsin at 480 nanometres drive circadian health. Melanopic lux is separate from photopic lux."},
"1.4":{body:["CCT describes the perceived hue of white light by analogy to a <strong>blackbody radiator</strong>. At ~2700–3000 K: warm amber-white. At 4000 K: neutral white. At 5000–7000 K: cool bluish-white. CCT describes only colour <em>appearance</em> — it says nothing about spectral composition or colour rendering ability.","The <strong>Kruithof principle</strong>: warm CCT (2700–3000 K) pairs comfortably with lower illuminance (50–300 lux), mirroring evening daylight. Cool CCT (4000–6500 K) pairs with higher illuminance (300–1000+ lux), mirroring midday daylight. Crossing these pairings typically feels unnatural — very cool light at low illuminance, or very warm light at very high illuminance.","Two supplementary specifications always accompany CCT. <strong>Duv</strong> measures deviation from the Planckian locus: positive = greenish cast; negative = pinkish. ANSI requires |Duv| ≤ 0.006. <strong>SDCM bins</strong> (MacAdam ellipses) quantify manufacturing variation — 3-step SDCM is the threshold for visually consistent adjacent fixtures."],lp:["CCT describes colour appearance only — not rendering. <3000K = warm. 3500–4000K = neutral. >4500K = cool.","Kruithof: warm CCT + low lux comfortable; cool CCT + high lux comfortable. Mismatching often feels wrong.","Always specify Duv (≤±0.006) and SDCM ≤ 3-step alongside CCT."],tts:"Lesson 1.4. Correlated Colour Temperature. CCT describes colour appearance only — not rendering. Below 3000 Kelvin is warm. 3500 to 4000 Kelvin is neutral. Above 4500 Kelvin is cool. Kruithof principle: warm CCT with low illuminance, cool CCT with high illuminance. Always specify Duv at plus or minus 0.006 maximum and SDCM of 3-step or better."},
"1.5":{body:["<strong>CRI (Ra)</strong> averages the colour shift of eight muted test colour samples (R1–R8) on a 0–100 scale. Ra ≥ 80 adequate; Ra ≥ 90 required for surgical, galleries, premium retail. Critical weakness: all eight samples are muted pastels — vivid saturated colours are ignored. <strong>R9 (saturated red)</strong> must always be specified separately. R9 ≥ 50 is the standard minimum for colour-critical applications.","IES <strong>TM-30</strong> uses 99 colour evaluation samples spanning the full real-world gamut. It produces two metrics: <strong>Rf (Fidelity Index)</strong> — accuracy on 0–100 scale, analogous to Ra but more rigorous — and <strong>Rg (Gamut Index)</strong>, which measures whether the source makes colours appear more or less saturated. Rg > 100 means more vivid; Rg < 100 means flatter. Always specify and report both.","A grocery store might target Rf 85 / Rg 108 for vivid produce. A museum targets Rf 95 / Rg 100 for faithful reproduction. LEED v4.1 EQ Interior Lighting requires CRI ≥ 90 and R9 ≥ 50 for the quality credit. Always verify from independent third-party LM-79 test reports."],lp:["CRI (Ra): average of 8 muted colours, 0–100. Ra ≥ 80 adequate; Ra ≥ 90 excellent. R9 (saturated red) NOT in Ra — specify R9 ≥ 50 separately.","TM-30 Rf = fidelity (99 samples). Rg = gamut (>100 vivid, <100 flat). Specify and report both together.","Metamerism: surfaces match under one source, differ under another. Control with broadspectrum sources and Ra ≥ 90 in critical spaces."],tts:"Lesson 1.5. Colour Rendering — CRI and TM-30. CRI or Ra averages 8 muted test colours on a scale of 0 to 100. Ra 80 is adequate; Ra 90 is excellent. R9 for saturated red is not included in Ra — always specify R9 of 50 or greater. TM-30 uses 99 samples and gives Rf for fidelity and Rg for gamut. Rg above 100 means more vivid; below 100 means flatter. Specify both together."},
"1.6":{body:["The rendering hierarchy: <strong>Ra ≥ 95+</strong> for surgical and gemological work. <strong>Ra ≥ 90</strong> for museums, galleries, fashion retail, healthcare exam rooms. <strong>Ra ≥ 80</strong> for general offices and standard retail. <strong>Ra ≥ 70</strong> for warehouses and industrial. Specifying Ra 95 throughout an office is wasteful; Ra 70 in a paint showroom is a design error.","<strong>Metamerism</strong> occurs when two surfaces match under one source but diverge under another — caused by different spectral reflectance curves reacting differently to different SPDs. Engineering controls: specify broadspectrum sources; Ra ≥ 90 for colour-critical QC spaces; evaluate colour matches under D65 illumination.","A complete colour rendering specification bundles four items: <strong>CCT + minimum Ra + minimum R9 + SDCM ≤ 3-step</strong>. Each controls a different dimension of colour quality — none alone is sufficient. For tunable white, verify Ra and Rg stability across the full CCT range. Confirm Ra and R9 from independent LM-79 test data."],lp:["Hierarchy: Ra ≥ 95 surgical → Ra ≥ 90 museum/retail/healthcare → Ra ≥ 80 offices → Ra ≥ 70 warehouse. Match to task — don't over-specify.","Complete spec = CCT + min Ra + min R9 + SDCM ≤ 3-step. Each controls a different dimension.","Always verify Ra and R9 from independent LM-79 test data. Confirm rendering stability for tunable white."],tts:"Lesson 1.6. Colour Rendering in Practice. Match rendering to task: Ra 95 for surgical, Ra 90 for museum and healthcare, Ra 80 for offices, Ra 70 for industrial. Metamerism is two surfaces matching under one source but not another. Specify CCT plus minimum Ra plus minimum R9 plus SDCM of 3-step or better. Verify from independent LM-79 test data."},
"2.1":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 2.1."},
"2.2":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 2.2."},
"2.3":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 2.3."},
"2.4":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 2.4."},
"2.5":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 2.5."},
"2.6":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 2.6."},
"3.1":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 3.1."},
"3.2":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 3.2."},
"3.3":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 3.3."},
"3.4":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 3.4."},
"3.5":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 3.5."},
"3.6":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 3.6."},
"3.7":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 3.7."},
"3.8":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 3.8."},
"4.1":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 4.1."},
"4.2":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 4.2."},
"4.3":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 4.3."},
"4.4":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 4.4."},
"4.5":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 4.5."},
"4.6":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 4.6."},
"5.1":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 5.1."},
"5.2":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 5.2."},
"5.3":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 5.3."},
"5.4":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 5.4."},
"5.5":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 5.5."},
"5.6":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 5.6."},
"6.1":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 6.1."},
"6.2":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 6.2."},
"6.3":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 6.3."},
"6.4":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 6.4."},
"6.5":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 6.5."},
"6.6":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 6.6."},
"7.1":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 7.1."},
"7.2":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 7.2."},
"7.3":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 7.3."},
"7.4":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 7.4."},
"7.5":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 7.5."},
"7.6":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 7.6."},
"8.1":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 8.1."},
"8.2":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 8.2."},
"8.3":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 8.3."},
"8.4":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 8.4."},
"8.5":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 8.5."},
"8.6":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 8.6."},
"9.1":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 9.1."},
"9.2":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 9.2."},
"9.3":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 9.3."},
"9.4":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 9.4."},
"9.5":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 9.5."},
"9.6":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 9.6."},
"10.1":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 10.1."},
"10.2":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 10.2."},
"10.3":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 10.3."},
"10.4":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 10.4."},
"10.5":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 10.5."},
"10.6":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 10.6."},
"11.1":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 11.1."},
"11.2":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 11.2."},
"11.3":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 11.3."},
"11.4":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 11.4."},
"11.5":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 11.5."},
"11.6":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 11.6."},
"12.1":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 12.1."},
"12.2":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 12.2."},
"12.3":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 12.3."},
"12.4":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 12.4."},
"12.5":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 12.5."},
"12.6":{"body":["Full lesson content in production build."],"lp":["Key concept 1","Key concept 2"],"tts":"Lesson 12.6."}
};

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
  const lessonRef=document.getElementById('_lesson_ref')?.dataset?.ref;
  const content=lessonRef&&LC_DATA[lessonRef];
  if(!content)return;
  const utt=new SpeechSynthesisUtterance(content.tts);
  utt.rate=_speeds[_spdIdx];utt.pitch=1.0;utt.volume=1.0;
  if(_voices.length)utt.voice=_voices[_voiceIdx];
  _estMs=(content.tts.split(' ').length/2.8)*1000/_speeds[_spdIdx];
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
  return <>{text.slice(0,i)}<mark style={{background:"rgba(184,88,53,0.22)",color:"inherit",borderRadius:2,padding:"0 1px"}}>{text.slice(i,i+q.length)}</mark>{text.slice(i+q.length)}</>
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

/* ── SEARCH PAGE ─────────────────────────────────────────────── */
function SearchPage({setRoute}) {
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
            {p.lessons.map(l=>(
              <div key={l.ref} onClick={()=>setRoute("lesson-"+l.ref)} style={{display:"grid",gridTemplateColumns:"52px 1fr auto",gap:14,alignItems:"center",background:C.cream,padding:"14px 16px",cursor:"pointer",transition:"background 140ms"}}
                onMouseEnter={e=>e.currentTarget.style.background=C.creamWarm} onMouseLeave={e=>e.currentTarget.style.background=C.cream}>
                <span style={{fontFamily:F.display,fontWeight:700,fontSize:17,letterSpacing:"-0.02em",color:l.done?C.inkMute:C.forest}}>{l.ref}</span>
                <span>
                  <span style={{display:"block",fontFamily:F.display,fontWeight:600,fontSize:14,color:C.ink,lineHeight:1.25}}><Mark text={l.title} q={q}/></span>
                  <span style={mono({display:"block",fontSize:9,letterSpacing:"0.14em",textTransform:"uppercase",color:C.inkMute,marginTop:4})}><em style={{fontStyle:"normal",color:C.accent}}>M{l.module}</em> · {l.moduleTitle?.slice(0,28)} · <Mark text={l.tag} q={q}/></span>
                </span>
                <span style={mono({fontSize:9,letterSpacing:"0.16em",textTransform:"uppercase",color:l.done?C.forest:C.inkMute,whiteSpace:"nowrap"})}>{l.done?"✓ Done":"Open →"}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}


/* ── BOOKMARKS PAGE ──────────────────────────────────────────── */
function BookmarksPage({setRoute}) {
  const items = BOOKMARKS.map(bm=>({...bm,lesson:ALL_LESSONS.find(l=>l.ref===bm.ref)})).filter(b=>b.lesson)
  return (
    <div style={{padding:"0 36px 48px"}}>
      <PageHead eyebrow="Library · Saved for review" title="Your" em="bookmarks."
        right={<div style={{textAlign:"right"}}>
          <div style={{fontFamily:F.display,fontWeight:700,fontSize:32,letterSpacing:"-0.02em",color:C.forest,lineHeight:1}}>{items.length}</div>
          <div style={mono({fontSize:9,letterSpacing:"0.18em",textTransform:"uppercase",color:C.inkMute,marginTop:6})}>lessons flagged</div>
        </div>}
      />
      <p style={{fontFamily:F.body,fontSize:14,lineHeight:1.55,color:C.inkMute,margin:"20px 0 24px",maxWidth:620}}>Lessons you starred to revisit before the exam. These are the concepts that earned a second look.</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:16}}>
        {items.map(({ref,note,lesson:l})=>(
          <article key={ref} onClick={()=>setRoute("lesson-"+ref)} style={{display:"flex",flexDirection:"column",background:C.paper,border:`1px solid ${C.rule}`,borderRadius:4,overflow:"hidden",cursor:"pointer",transition:"border-color 150ms,transform 150ms"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=C.inkMute;e.currentTarget.style.transform="translateY(-2px)"}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=C.rule;e.currentTarget.style.transform="translateY(0)"}}>
            <div style={{display:"grid",gridTemplateColumns:"auto 1fr auto",gap:14,alignItems:"start",padding:"20px 22px 16px"}}>
              <span style={{fontFamily:F.display,fontWeight:700,fontSize:28,letterSpacing:"-0.03em",color:C.forest,lineHeight:0.9}}>{l.ref}</span>
              <span>
                <span style={mono({display:"block",fontSize:9,letterSpacing:"0.16em",textTransform:"uppercase",color:C.inkMute,marginBottom:6})}><em style={{fontStyle:"normal",color:C.accent}}>M{l.module}</em> · {l.moduleTitle}</span>
                <span style={{display:"block",fontFamily:F.display,fontWeight:700,fontSize:18,letterSpacing:"-0.01em",color:C.ink,lineHeight:1.15}}>{l.title}</span>
              </span>
              <span style={{fontSize:15,color:C.accent}}>★</span>
            </div>
            <p style={{fontFamily:F.body,fontSize:13,lineHeight:1.55,color:C.inkSoft,padding:"0 22px 14px",margin:0}}>"{note}"</p>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 22px",borderTop:`1px solid ${C.rule}`,marginTop:"auto",background:`color-mix(in srgb,${C.creamWarm} 60%,transparent)`}}>
              <span style={{display:"flex",alignItems:"center",gap:7,fontFamily:F.mono,fontSize:9,letterSpacing:"0.18em",textTransform:"uppercase",color:C.inkMute}}>
                <span style={{width:7,height:7,borderRadius:"50%",background:l.done?C.forest:C.accent}}/>
                {l.done?"Completed":"Not started"} · {l.tag}
              </span>
              <span style={{fontFamily:F.display,fontWeight:600,fontSize:13,color:C.ink}}>Open lesson →</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}


/* ── NOTES PAGE ──────────────────────────────────────────────── */
function NotesPage({setRoute}) {
  const [q,setQ] = useState("")
  const [sort,setSort] = useState("recent")
  const notes = NOTES.map(n=>({...n,lesson:ALL_LESSONS.find(l=>l.ref===n.ref)}))
  const filtered = notes.filter(n=>{
    if (!q) return true
    return [n.body,n.lesson?.title,n.lesson?.moduleTitle,n.ref].join(" ").toLowerCase().includes(q.toLowerCase())
  })
  const sorted = sort==="module"?[...filtered].sort((a,b)=>parseInt(a.lesson?.module||99)-parseInt(b.lesson?.module||99)):filtered
  const distinctLessons = new Set(notes.map(n=>n.ref)).size

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
          return (
            <article key={i} onClick={()=>l&&setRoute("lesson-"+l.ref)} style={{breakInside:"avoid",marginBottom:16,background:C.paper,border:`1px solid ${C.rule}`,borderRadius:4,borderLeft:`3px solid ${l?.done?C.forest:C.accent}`,padding:"18px 20px",cursor:"pointer",transition:"box-shadow 150ms"}}
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
    </div>
  )
}


/* ── CERTIFICATE PAGE ────────────────────────────────────────── */
function CertPage() {
  const reqs = [
    {label:"Complete all 74 lessons",detail:"23 of 74 lessons done across all 12 modules",pct:31,done:false},
    {label:"Earn 24 CEU contact hours",detail:"7.5 of 24 hours logged",pct:31,done:false},
    {label:"Pass practice exam (≥ 85%)",detail:"No attempts recorded yet",pct:0,done:false},
    {label:"Within access window",detail:"97 days remaining in 6-month window",pct:100,done:true},
  ]
  const metCount = reqs.filter(r=>r.done).length
  const readinessPct = Math.round(reqs.reduce((s,r)=>s+r.pct,0)/reqs.length)
  const partProgress = [
    {n:"01",title:"Fundamentals",modules:"01–04",done:12,total:26,pct:46},
    {n:"02",title:"Systems & applications",modules:"05–08",done:0,total:24,pct:0},
    {n:"03",title:"Design practice",modules:"09–12",done:0,total:24,pct:0},
  ]
  return (
    <div style={{padding:"0 36px 48px"}}>
      <PageHead eyebrow="My progress · Course completion" title="Your" em="certificate."/>
      <section style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:40,margin:"32px 0 0",alignItems:"start"}}>
        {/* Certificate preview */}
        <div>
          <div style={{border:`1px solid ${C.rule}`,borderRadius:4,padding:32,background:C.paper,position:"relative",overflow:"hidden"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
              <div style={{width:24,height:24,borderRadius:4,background:C.accent,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:F.display,fontWeight:800,fontSize:9,color:"#fff"}}>LC</div>
              <span style={{fontFamily:F.display,fontWeight:700,fontSize:13,color:C.ink}}>LC · Lighting Master</span>
            </div>
            <div style={mono({fontSize:9,letterSpacing:"0.22em",textTransform:"uppercase",color:C.accent,marginBottom:12})}>Certificate of Completion</div>
            <h2 style={{fontFamily:"'DM Serif Display',serif",fontSize:26,fontWeight:400,color:C.ink,lineHeight:1.15,margin:"0 0 14px"}}>Certified Lighting<br/>Designer · Exam Prep</h2>
            <div style={{fontFamily:F.display,fontWeight:700,fontSize:18,color:C.inkSoft,marginBottom:10}}>Reema Menon</div>
            <p style={{fontFamily:F.body,fontSize:12,lineHeight:1.6,color:C.inkMute,marginBottom:20}}>For completing all 74 lessons across 12 modules and passing the NCQLP practice exam, earning 24 CEU contact hours of professional development.</p>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
              <div style={{fontFamily:F.body,fontSize:11,color:C.inkMute}}>Issued · pending completion</div>
              <div style={{width:52,height:52,borderRadius:"50%",background:C.accent,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:F.display,fontWeight:700,fontSize:11,color:"#fff",textAlign:"center",lineHeight:1.2}}>LC<br/>PREP</div>
            </div>
            {/* Lock overlay */}
            <div style={{position:"absolute",inset:0,background:"rgba(248,243,236,0.92)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10,backdropFilter:"blur(2px)"}}>
              <div style={{fontSize:28}}>🔒</div>
              <div style={{fontFamily:F.display,fontWeight:700,fontSize:16,color:C.ink}}>Not unlocked yet</div>
              <div style={{fontFamily:F.body,fontSize:13,color:C.inkMute,textAlign:"center",maxWidth:240}}>Finish the four requirements to issue and download your certificate.</div>
            </div>
          </div>
        </div>

        {/* Readiness panel */}
        <div style={{background:C.ink,borderRadius:6,padding:"28px 32px",color:"#fff"}}>
          <div style={mono({fontSize:9,letterSpacing:"0.22em",textTransform:"uppercase",color:C.tan,marginBottom:12})}>Certificate readiness</div>
          <div style={{fontFamily:F.display,fontWeight:700,fontSize:52,letterSpacing:"-0.03em",lineHeight:1,marginBottom:6}}>{readinessPct}<em style={{fontStyle:"normal",fontSize:24,color:C.tan}}>%</em></div>
          <div style={mono({fontSize:10,letterSpacing:"0.16em",color:"rgba(255,255,255,0.5)",marginBottom:16})}>{metCount} of 4 requirements met</div>
          <div style={{height:4,background:"rgba(255,255,255,0.12)",borderRadius:99,overflow:"hidden",marginBottom:20}}>
            <div style={{height:"100%",width:`${readinessPct}%`,background:C.accent,borderRadius:99,transition:"width 700ms cubic-bezier(.4,0,.2,1)"}}/>
          </div>
          {reqs.map((r,i)=>(
            <div key={i} style={{display:"flex",alignItems:"flex-start",gap:12,padding:"10px 0",borderBottom:i<3?`1px solid rgba(255,255,255,0.08)`:"none"}}>
              <span style={{width:18,height:18,borderRadius:"50%",border:`1px solid ${r.done?"transparent":"rgba(255,255,255,0.3)"}`,background:r.done?C.forest:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#fff",flexShrink:0,marginTop:2}}>{r.done?"✓":""}</span>
              <div>
                <div style={{fontFamily:F.display,fontWeight:600,fontSize:13,color:r.done?"#fff":"rgba(255,255,255,0.7)",marginBottom:3}}>{r.label}</div>
                <div style={mono({fontSize:9,letterSpacing:"0.1em",color:"rgba(255,255,255,0.38)"})}>{r.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Metrics strip */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:0,border:`1px solid ${C.rule}`,borderRadius:4,overflow:"hidden",margin:"32px 0 0"}}>
        {[{n:"Lessons",val:"23",sub:"/74"},{n:"CEU hours",val:"7.5",sub:"/24"},{n:"Practice exam",val:"—",sub:""},{n:"Window",val:"97",sub:"d"}].map((m,i)=>(
          <div key={m.n} style={{padding:"22px 24px",borderRight:i<3?`1px solid ${C.rule}`:"none",background:C.paper}}>
            <div style={mono({fontSize:9,letterSpacing:"0.18em",textTransform:"uppercase",color:C.inkMute,marginBottom:8})}>{m.n}</div>
            <div style={{fontFamily:F.display,fontWeight:700,fontSize:28,letterSpacing:"-0.02em",color:C.ink,lineHeight:1}}>
              {m.val}<em style={{fontStyle:"normal",color:C.accent,fontSize:16}}>{m.sub}</em>
            </div>
          </div>
        ))}
      </div>

      {/* Part progress */}
      <div style={{margin:"32px 0 0",background:C.paper,border:`1px solid ${C.rule}`,borderRadius:4,padding:"24px 28px"}}>
        <div style={mono({fontSize:9,letterSpacing:"0.22em",textTransform:"uppercase",color:C.inkMute,marginBottom:18})}>Progress by part</div>
        {partProgress.map(p=>(
          <div key={p.n} style={{marginBottom:18}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:8}}>
              <div>
                <span style={{fontFamily:F.display,fontWeight:700,fontSize:13,color:C.ink}}>Part {p.n} · {p.title}</span>
                <span style={mono({fontSize:9,letterSpacing:"0.14em",color:C.inkMute,marginLeft:10})}>Modules {p.modules}</span>
              </div>
              <span style={mono({fontSize:9,letterSpacing:"0.14em",color:p.pct>0?C.accent:C.inkMute})}>{p.pct>0?`${p.done}/${p.total} lessons`:"Not started"}</span>
            </div>
            <FilamentBar pct={p.pct} color={p.pct===100?C.forest:C.accent} glow={p.pct>0&&p.pct<100}/>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── EXAM PAGE ───────────────────────────────────────────────── */

function ExamPage({setRoute}) {
  const [examState,setExamState] = useState("addon") // addon | purchased | playing
  const [screen,setScreen] = useState("landing") // landing | start | play | results
  const [session,setSession] = useState({questions:[],idx:0,answers:[],score:0,streak:0,bestStreak:0,startTime:Date.now()})
  const [timeLeft,setTimeLeft] = useState(25)
  const [answered,setAnswered] = useState(null)
  const [chosen,setChosen] = useState(null)
  const [floatPts,setFloatPts] = useState(null)
  const timerRef = useRef(null)
  const deadlineRef = useRef(null)

  const topicCounts = QUESTIONS.reduce((acc,q)=>{acc[q.topic]=(acc[q.topic]||0)+1;return acc},{})
  const TOPIC_COLORS = {"Light Sources & Lamps":"#A06A38","Photometry & Calculations":"#2F4A3F","Color & Vision":"#C67A38","Energy & Controls":"#B84030","Luminaire Design & Optics":"#2D7A8A","Codes, Standards & Sustainability":"#6B4E8A","Daylighting":"#2D7A8A","Interior Lighting Design":"#4A7A52","Emergency & Exit Lighting":"#C65A3A","Exterior & Outdoor Lighting":"#3A7A5A","Lighting Design Process":"#7E9B86","Human Factors & Health":"#4A6A2F","Technology & Innovation":"#7A4A9A","Commissioning & Maintenance":"#8A4A2F","Electrical & Installation":"#5A5A8A","Sports & Special Applications":"#8A6A3A"}

  function startSession(count) {
    const shuffled = [...QUESTIONS].sort(()=>Math.random()-0.5).slice(0,count)
    setSession({questions:shuffled,idx:0,answers:[],score:0,streak:0,bestStreak:0,startTime:Date.now()})
    setScreen("play")
    setAnswered(null)
    setChosen(null)
    startTimer()
  }

  function startTimer() {
    clearInterval(timerRef.current)
    deadlineRef.current = Date.now()+25000
    setTimeLeft(25)
    timerRef.current = setInterval(()=>{
      const left = Math.max(0,Math.ceil((deadlineRef.current-Date.now())/1000))
      setTimeLeft(left)
      if (left===0) { clearInterval(timerRef.current); handleAnswer(null) }
    },100)
  }

  function handleAnswer(choice) {
    clearInterval(timerRef.current)
    if (answered!==null) return
    const q = session.questions[session.idx]
    const correct = choice===q.correct
    const sLeft = Math.ceil((deadlineRef.current-Date.now())/1000)
    const newStreak = correct ? session.streak+1 : 0
    const mult = newStreak>=2 ? 1+newStreak*0.1 : 1
    const pts = correct ? Math.round((100+Math.max(0,sLeft)*10)*mult) : 0
    const newScore = session.score+pts
    const newBest = Math.max(session.bestStreak,newStreak)
    setAnswered({correct,choice,pts,sLeft})
    setChosen(choice)
    setSession(s=>({...s,score:newScore,streak:newStreak,bestStreak:newBest,answers:[...s.answers,{correct,pts,time:25-sLeft}]}))
    if (pts>0) {setFloatPts("+"+pts);setTimeout(()=>setFloatPts(null),1200)}
  }

  function nextQuestion() {
    const {questions,idx} = session
    if (idx+1>=questions.length) { setScreen("results"); return }
    setSession(s=>({...s,idx:s.idx+1}))
    setAnswered(null)
    setChosen(null)
    startTimer()
  }

  useEffect(()=>()=>clearInterval(timerRef.current),[])

  const timerColor = timeLeft>14?"#2a6048":timeLeft>7?"#e8a020":C.accent
  const timerPct = (timeLeft/25)*100
  const circumference = 2*Math.PI*22
  const dashOffset = circumference*(1-timerPct/100)

  if (screen==="play") {
    const q = session.questions[session.idx]
    const qNum = session.idx+1
    const total = session.questions.length
    return (
      <div style={{padding:"28px 36px 48px"}}>
        <style>{`@keyframes floatUp{0%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-40px)}}`}</style>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <div style={mono({fontSize:9,letterSpacing:"0.22em",textTransform:"uppercase",color:C.accent})}>Question {qNum}/{total}</div>
          <div style={{display:"flex",alignItems:"center",gap:20}}>
            <div style={{fontFamily:F.display,fontWeight:700,fontSize:22,color:C.ink}}>{session.score.toLocaleString()}</div>
            <div style={{position:"relative",width:52,height:52,flexShrink:0}}>
              <svg width="52" height="52" viewBox="0 0 52 52" style={{transform:"rotate(-90deg)"}}>
                <circle cx="26" cy="26" r="22" fill="none" stroke={C.rule} strokeWidth="4"/>
                <circle cx="26" cy="26" r="22" fill="none" stroke={timerColor} strokeWidth="4" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset} style={{transition:"stroke-dashoffset 0.1s,stroke 0.3s"}}/>
              </svg>
              <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:F.display,fontWeight:700,fontSize:16,color:timerColor}}>{timeLeft}</div>
              {floatPts&&<div style={{position:"absolute",top:-8,right:-8,fontFamily:F.display,fontWeight:700,fontSize:14,color:C.forest,animation:"floatUp 1.2s ease-out forwards",pointerEvents:"none",whiteSpace:"nowrap"}}>{floatPts}</div>}
            </div>
          </div>
        </div>

        {/* Progress rail */}
        <div style={{display:"flex",gap:2,marginBottom:28}}>
          {session.questions.map((_,i)=>{
            const ans = session.answers[i]
            return <span key={i} style={{flex:1,height:3,borderRadius:2,background:i<session.answers.length?(ans?.correct?C.forest:C.accent):i===session.idx?C.inkMute:C.rule}}/>
          })}
        </div>

        {/* Question */}
        <div style={{background:C.paper,border:`1px solid ${C.rule}`,borderRadius:6,padding:"28px 32px",marginBottom:20}}>
          <div style={mono({fontSize:9,letterSpacing:"0.16em",textTransform:"uppercase",color:TOPIC_COLORS[q.topic]||C.inkMute,marginBottom:14})}>{q.topic}</div>
          <p style={{fontFamily:F.display,fontWeight:700,fontSize:20,lineHeight:1.3,color:C.ink,margin:0}}>{q.prompt}</p>
        </div>

        {/* Choices */}
        <div style={{display:"grid",gap:10}}>
          {q.choices.map((c,i)=>{
            let bg=C.paper,border=`1px solid ${C.rule}`,color=C.ink
            if (answered) {
              if (c===q.correct) {bg=C.forestLight;border=`1px solid ${C.forest}`;color=C.forest}
              else if (c===chosen&&c!==q.correct) {bg="rgba(184,88,53,0.1)";border=`1px solid ${C.accent}`;color=C.accent}
            } else if (c===chosen) {bg=C.accentLight;border=`1px solid ${C.accent}`}
            return (
              <button key={i} onClick={()=>!answered&&handleAnswer(c)} disabled={!!answered}
                style={{display:"flex",alignItems:"center",gap:14,padding:"14px 18px",background:answered&&c===q.correct?C.forestLight:answered&&c===chosen&&c!==q.correct?"rgba(184,88,53,0.08)":bg,border:answered&&c===q.correct?`1px solid ${C.forest}`:answered&&c===chosen&&c!==q.correct?`1px solid ${C.accent}`:border,borderRadius:4,cursor:answered?"default":"pointer",fontFamily:F.display,fontWeight:600,fontSize:14,color:answered&&c===q.correct?C.forest:answered&&c===chosen&&c!==q.correct?C.accent:color,textAlign:"left",transition:"all 140ms",width:"100%"}}>
                <span style={mono({fontSize:11,color:C.inkMute,flexShrink:0})}>{["A","B","C","D"][i]}</span>
                {c}
                {answered&&c===q.correct&&<span style={{marginLeft:"auto",color:C.forest}}>✓</span>}
                {answered&&c===chosen&&c!==q.correct&&<span style={{marginLeft:"auto",color:C.accent}}>✗</span>}
              </button>
            )
          })}
        </div>

        {/* Feedback */}
        {answered&&(
          <div style={{marginTop:16,background:answered.correct?C.forestLight:"rgba(184,88,53,0.08)",border:`1px solid ${answered.correct?C.forest:C.accent}`,borderRadius:4,padding:"16px 20px"}}>
            <div style={{fontFamily:F.display,fontWeight:700,fontSize:16,color:answered.correct?C.forest:C.accent,marginBottom:6}}>
              {answered.choice===null?"Time's up ⏱":answered.correct?"Correct ✓":"Not quite ✗"}
              {answered.pts>0&&<span style={mono({fontSize:10,letterSpacing:"0.1em",marginLeft:12,color:C.forest})}>+{answered.pts} pts</span>}
            </div>
            <p style={{fontFamily:F.body,fontSize:13,lineHeight:1.6,color:C.inkSoft,margin:0}}>{session.questions[session.idx].explanation}</p>
            <button onClick={nextQuestion} style={{marginTop:12,fontFamily:F.display,fontWeight:700,fontSize:13,background:C.ink,color:"#fff",border:"none",borderRadius:99,padding:"9px 20px",cursor:"pointer"}}>
              {session.idx+1>=session.questions.length?"See results →":"Next question →"}
            </button>
          </div>
        )}
      </div>
    )
  }

  if (screen==="results") {
    const {answers,score,bestStreak,questions} = session
    const correct = answers.filter(a=>a.correct).length
    const accuracy = Math.round(correct/answers.length*100)
    const grade = accuracy>=85?"Exam ready 🎉":accuracy>=70?"On track ✓":accuracy>=50?"Keep studying":"Review fundamentals"
    const gradeColor = accuracy>=85?C.forest:accuracy>=70?C.amber:C.accent
    const topicResults = questions.reduce((acc,q,i)=>{
      if (!acc[q.topic]) acc[q.topic]={correct:0,total:0}
      acc[q.topic].total++
      if (answers[i]?.correct) acc[q.topic].correct++
      return acc
    },{})
    return (
      <div style={{padding:"28px 36px 48px"}}>
        <div style={mono({fontSize:9,letterSpacing:"0.22em",textTransform:"uppercase",color:C.accent,marginBottom:12})}>Exam results</div>
        <h1 style={{fontFamily:F.display,fontWeight:700,fontSize:"clamp(36px,5vw,56px)",letterSpacing:"-0.025em",lineHeight:1,color:C.ink,margin:"0 0 8px"}}>{score.toLocaleString()}<em style={{fontStyle:"normal",color:C.accent,fontSize:"0.4em"}}> pts</em></h1>
        <div style={{fontFamily:F.display,fontWeight:700,fontSize:20,color:gradeColor,marginBottom:24}}>{grade}</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:0,border:`1px solid ${C.rule}`,borderRadius:4,overflow:"hidden",marginBottom:32}}>
          {[{n:"Accuracy",v:accuracy+"%"},{n:"Correct",v:`${correct}/${answers.length}`},{n:"Best streak",v:bestStreak+"x"},{n:"Avg time",v:Math.round(answers.reduce((s,a)=>s+a.time,0)/answers.length)+"s"}].map((m,i)=>(
            <div key={m.n} style={{padding:"18px 22px",borderRight:i<3?`1px solid ${C.rule}`:"none",background:C.paper}}>
              <div style={mono({fontSize:9,letterSpacing:"0.18em",textTransform:"uppercase",color:C.inkMute,marginBottom:6})}>{m.n}</div>
              <div style={{fontFamily:F.display,fontWeight:700,fontSize:24,letterSpacing:"-0.02em",color:C.ink}}>{m.v}</div>
            </div>
          ))}
        </div>
        <div style={mono({fontSize:9,letterSpacing:"0.22em",textTransform:"uppercase",color:C.inkMute,marginBottom:14})}>Per-topic accuracy</div>
        <div style={{display:"grid",gap:10,marginBottom:28}}>
          {Object.entries(topicResults).map(([topic,{correct:c,total:t}])=>(
            <div key={topic} style={{display:"grid",gridTemplateColumns:"1fr 80px 60px",gap:12,alignItems:"center"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{width:8,height:8,borderRadius:"50%",background:TOPIC_COLORS[topic]||C.inkMute,flexShrink:0}}/>
                <span style={{fontFamily:F.body,fontSize:13,color:C.ink}}>{topic}</span>
              </div>
              <div style={{height:4,background:C.rule,borderRadius:99,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${Math.round(c/t*100)}%`,background:TOPIC_COLORS[topic]||C.inkMute,borderRadius:99}}/>
              </div>
              <span style={mono({fontSize:10,color:C.inkMute,textAlign:"right"})}>{c}/{t}</span>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:12}}>
          <button onClick={()=>{setScreen("start")}} style={{fontFamily:F.display,fontWeight:700,fontSize:14,background:C.accent,color:"#fff",border:"none",borderRadius:99,padding:"12px 24px",cursor:"pointer"}}>Try again →</button>
          <button onClick={()=>setScreen("landing")} style={{fontFamily:F.display,fontWeight:600,fontSize:14,background:"none",color:C.inkSoft,border:`1px solid ${C.rule}`,borderRadius:99,padding:"12px 24px",cursor:"pointer"}}>← Exam home</button>
        </div>
      </div>
    )
  }

  if (screen==="start") {
    return (
      <div style={{padding:"28px 36px 48px",maxWidth:640}}>
        <PageHead eyebrow="Practice exam · Configure session" title="Configure your" em="session."/>
        <div style={{margin:"28px 0"}}>
          <div style={mono({fontSize:9,letterSpacing:"0.22em",textTransform:"uppercase",color:C.inkMute,marginBottom:14})}>Session length</div>
          <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
            {[[10,"Quick · 10 questions"],[20,"Standard · 20 questions"],[129,"Full exam · all 129"]].map(([n,label])=>(
              <button key={n} onClick={()=>startSession(Math.min(n,QUESTIONS.length))} style={{fontFamily:F.display,fontWeight:600,fontSize:14,background:C.ink,color:"#fff",border:"none",borderRadius:4,padding:"14px 24px",cursor:"pointer",transition:"background 140ms"}}
                onMouseEnter={e=>e.currentTarget.style.background=C.accent}
                onMouseLeave={e=>e.currentTarget.style.background=C.ink}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Landing
  return (
    <div style={{padding:"0 36px 48px"}}>
      <PageHead eyebrow="My progress · Certification capstone" title="NCQLP Practice" em="Exam."/>
      {/* Access hero */}
      <div style={{background:C.ink,borderRadius:6,display:"grid",gridTemplateColumns:"1.5fr 1fr",gap:40,padding:"32px 36px",margin:"32px 0 0"}}>
        <div>
          {examState==="addon"&&<>
            <div style={mono({fontSize:9,letterSpacing:"0.22em",textTransform:"uppercase",color:C.tan,marginBottom:12})}>Add-on · not yet included</div>
            <h2 style={{fontFamily:F.display,fontWeight:700,fontSize:26,letterSpacing:"-0.02em",lineHeight:1.1,margin:"0 0 12px",color:"#fff"}}>Add the <em style={{fontStyle:"normal",color:C.accent}}>certification exam</em> to your window.</h2>
            <div style={{display:"flex",alignItems:"baseline",gap:10,marginBottom:12}}>
              <span style={{fontFamily:F.display,fontWeight:700,fontSize:28,color:"#fff",letterSpacing:"-0.02em"}}>$200</span>
              <span style={mono({fontSize:10,letterSpacing:"0.16em",textTransform:"uppercase",color:"rgba(249,244,237,0.6)"})}>one-time · 6-Month plan</span>
            </div>
            <p style={{fontFamily:F.body,fontSize:14,lineHeight:1.55,color:"rgba(249,244,237,0.75)",margin:"0 0 16px",maxWidth:420}}>129 timed questions across 13 topics. Keep it for the life of your window with unlimited attempts.</p>
            <button onClick={()=>setExamState("purchased")} style={{fontFamily:F.display,fontWeight:700,fontSize:14,background:C.accent,color:"#fff",border:"none",borderRadius:99,padding:"12px 24px",cursor:"pointer"}}>Add the exam — $200 →</button>
          </>}
          {(examState==="purchased"||examState==="included")&&<>
            <div style={mono({fontSize:9,letterSpacing:"0.22em",textTransform:"uppercase",color:C.tan,marginBottom:12})}>{examState==="included"?"Included with 12-Month plan":"Add-on active · unlocked"}</div>
            <h2 style={{fontFamily:F.display,fontWeight:700,fontSize:26,letterSpacing:"-0.02em",lineHeight:1.1,margin:"0 0 12px",color:"#fff"}}>Your practice exam is <em style={{fontStyle:"normal",color:C.accent}}>ready.</em></h2>
            <p style={{fontFamily:F.body,fontSize:14,lineHeight:1.55,color:"rgba(249,244,237,0.75)",margin:"0 0 16px",maxWidth:420}}>129 questions · 13 topics · 25 seconds each. Unlimited attempts, fresh order every run.</p>
            <button onClick={()=>setScreen("start")} style={{fontFamily:F.display,fontWeight:700,fontSize:14,background:C.accent,color:"#fff",border:"none",borderRadius:99,padding:"12px 24px",cursor:"pointer"}}>Launch exam →</button>
          </>}
        </div>
        <div style={{background:"rgba(248,243,236,0.06)",border:`1px solid rgba(248,243,236,0.12)`,borderRadius:4,padding:22}}>
          <div style={mono({fontSize:9,letterSpacing:"0.22em",textTransform:"uppercase",color:C.tan,marginBottom:12})}>At a glance</div>
          {[["Questions","129"],["Topics","13"],["Per question","25 sec"],["Speed bonus","up to +250"],["Streak multiplier","×1.1 per answer"],["Pass threshold","85% accuracy"]].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",fontFamily:F.body,fontSize:13,color:"rgba(249,244,237,0.75)",padding:"6px 0",borderBottom:`1px dashed rgba(249,244,237,0.10)`}}>
              <span>{k}</span><span style={{fontFamily:F.display,fontWeight:600,color:"#fff"}}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Topics */}
      <div style={{margin:"32px 0 0",background:C.paper,border:`1px solid ${C.rule}`,borderRadius:4,padding:"24px 28px"}}>
        <div style={mono({fontSize:9,letterSpacing:"0.22em",textTransform:"uppercase",color:C.inkMute,marginBottom:16})}>Topics covered ({Object.keys(topicCounts).length} topics · {QUESTIONS.length} questions shown)</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8}}>
          {Object.entries(topicCounts).map(([topic,count])=>(
            <div key={topic} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",background:C.cream,borderRadius:4}}>
              <span style={{width:8,height:8,borderRadius:"50%",background:TOPIC_COLORS[topic]||C.inkMute,flexShrink:0}}/>
              <span style={{fontFamily:F.body,fontSize:13,color:C.ink,flex:1}}>{topic}</span>
              <span style={mono({fontSize:9,color:C.inkMute})}>{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── LESSON CONTENT DATA ───────────────────────────────────────── */

/* ── MODULE LESSON VIEW ── */
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
function ModuleCompleteModal({module, courseComplete, onClose}){
  const [copied,setCopied]=useState(false)
  const shareUrl="https://master-lighting.vercel.app"
  const shareText=courseComplete
    ?"I just completed all 12 modules of LC · Lighting Master and I'm ready for my NCQLP exam! 74 lessons, 24 CEU credit hours. 💡 #NCQLP #LightingDesign #LightingCertified #LC"
    :`I just completed Module ${module.n}: ${module.label} in LC · Lighting Master — studying for my NCQLP exam. ${module.ceu} CEU credit hours earned. 💡 #NCQLP #LightingDesign #LC`

  useEffect(()=>{
    function onKey(e){ if(e.key==="Escape") onClose() }
    window.addEventListener("keydown",onKey)
    return ()=>window.removeEventListener("keydown",onKey)
  },[onClose])

  const linkedInUrl=`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&summary=${encodeURIComponent(shareText)}`
  const twitterUrl=`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
  const facebookUrl=`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`

  async function copyLink(){
    await navigator.clipboard.writeText(shareText+" "+shareUrl)
    setCopied(true)
    setTimeout(()=>setCopied(false),2000)
  }

  return(
    <div onClick={e=>{if(e.target===e.currentTarget)onClose()}}
      style={{position:"fixed",inset:0,zIndex:3000,background:"rgba(22,18,14,0.82)",
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
          <p style={{fontFamily:F.body,fontSize:12.5,color:C.inkSoft,lineHeight:1.65,margin:0,fontStyle:"italic"}}>
            "{shareText}"
          </p>
        </div>

        <div style={mono({fontSize:9,letterSpacing:"0.22em",textTransform:"uppercase",color:C.inkMute,marginBottom:12})}>
          Share your achievement:
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:22}}>
          <ShareBtn icon="in" label="LinkedIn"
            hoverBg="#0077B5" hoverColor="#fff" defaultColor="#0077B5"
            onClick={()=>window.open(linkedInUrl,"_blank","width=600,height=600")}/>
          <ShareBtn icon="𝕏" label="X / Twitter"
            hoverBg="#000" hoverColor="#fff"
            onClick={()=>window.open(twitterUrl,"_blank","width=600,height=400")}/>
          <ShareBtn icon="f" label="Facebook"
            hoverBg="#1877F2" hoverColor="#fff" defaultColor="#1877F2"
            onClick={()=>window.open(facebookUrl,"_blank","width=600,height=400")}/>
          <ShareBtn icon="⎘" label={copied?"Copied! ✓":"Copy link"}
            hoverBg="#2d4a3e" hoverColor="#fff"
            onClick={copyLink}/>
        </div>

        <button onClick={onClose}
          style={{width:"100%",padding:"12px",borderRadius:99,
            background:C.ink,color:"#fff",border:"none",
            fontFamily:F.display,fontWeight:700,fontSize:13,cursor:"pointer",transition:"opacity 0.15s"}}
          onMouseEnter={e=>e.currentTarget.style.opacity="0.82"}
          onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
          Continue to dashboard →
        </button>
      </div>
    </div>
  )
}

function LessonPage({lessonRef,setRoute}) {
  const [showShareModal,setShowShareModal]=useState(false)
  const lesson = ALL_LESSONS.find(l=>l.ref===lessonRef)
  const module = MODULES.find(m=>m.n===lesson?.module)
  if (!lesson||!module) return <div style={{padding:"40px 36px",color:C.inkMute}}>Lesson not found.</div>
  const idx = module.lessons.findIndex(l=>l.ref===lessonRef)
  const prev = module.lessons[idx-1]
  const next = module.lessons[idx+1]
  const courseComplete = !next && module.n==="12"
  const content = LC_DATA[lessonRef]
  const visual = LC_VISUALS[lessonRef]
  const voiceName = typeof _voices!=='undefined'&&_voices.length?(_voices[_voiceIdx]?.name?.split(' ').slice(0,2).join(' ')||'Default'):'Default'

  return (
    <div style={{padding:"0 36px 48px"}}>
      <PageHead eyebrow={`Module ${module.n} · ${module.label}`} title={`Lesson ${lesson.ref} —`} em={lesson.title+"."}/>
      <div style={{display:"flex",gap:8,alignItems:"center",marginTop:14,marginBottom:18}}>
        <Tag label={lesson.tag}/>
        <span style={mono({fontSize:9,letterSpacing:"0.12em",textTransform:"uppercase",color:C.inkMute})}>{module.ceu} CEU hrs</span>
        {lesson.done&&<span style={mono({fontSize:9,letterSpacing:"0.12em",textTransform:"uppercase",color:C.forest})}>✓ Complete</span>}
        {lesson.active&&<span style={mono({fontSize:9,letterSpacing:"0.12em",textTransform:"uppercase",color:C.accent})}>▶ In progress</span>}
      </div>

      {/* Hidden ref store for TTS */}
      <span id="_lesson_ref" data-ref={lessonRef} style={{display:"none"}}/>

      {/* TTS Player */}
      <div style={{display:"flex",alignItems:"center",gap:10,border:`1px solid ${C.rule}`,borderRadius:6,padding:"10px 14px",marginBottom:18,background:C.paper}}>
        <button id="_ttsbtn" onClick={()=>window._toggleTTS()} style={{width:34,height:34,borderRadius:"50%",border:"none",background:C.accent,color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"opacity 140ms"}}
          onMouseEnter={e=>e.currentTarget.style.opacity=".82"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
          <svg viewBox="0 0 24 24" style={{width:14,height:14,fill:"currentColor"}}><path d="M8 5v14l11-7z"/></svg>
        </button>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontFamily:F.display,fontSize:12,fontWeight:600,color:C.ink,lineHeight:1.2}}>Audio narration</div>
          <div id="_ttsst" style={mono({fontSize:9,color:C.inkMute,marginTop:2})}>Click to listen</div>
        </div>
        <div style={{width:120,height:3,background:C.rule,borderRadius:99,overflow:"hidden",flexShrink:0}}>
          <div id="_pfill" style={{height:"100%",background:C.accent,width:"0%",borderRadius:99,transition:"width .4s linear"}}/>
        </div>
        <button id="_pspd" onClick={()=>window._cycleSpeed()} style={mono({fontSize:10,color:C.inkMute,padding:"3px 8px",borderRadius:99,border:`1px solid ${C.rule}`,background:"none",cursor:"pointer",minWidth:34,textAlign:"center"})}>{_speeds[_spdIdx]}×</button>
        <button id="_pvc" onClick={()=>window._cycleVoice()} style={mono({fontSize:9,color:C.inkMute,padding:"3px 8px",borderRadius:99,border:`1px solid ${C.rule}`,background:"none",cursor:"pointer",maxWidth:90,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"})}>{voiceName}</button>
      </div>

      {/* Media placeholder */}
      <div style={{border:`1.5px dashed ${C.rule}`,borderRadius:6,marginBottom:14,overflow:"hidden",background:C.creamWarm}}>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:200,gap:10,padding:"28px 24px"}}>
          <div style={{width:48,height:48,borderRadius:"50%",border:`1.5px dashed ${C.ruleStrong}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <svg viewBox="0 0 24 24" style={{width:22,height:22,fill:"none",stroke:C.inkMute,strokeWidth:1.5,strokeLinecap:"round",strokeLinejoin:"round"}}>
              <rect x="2" y="2" width="20" height="20" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/><path d="M14 8l3 3"/>
            </svg>
          </div>
          <div style={{textAlign:"center"}}>
            <div style={{fontFamily:F.display,fontSize:13,fontWeight:600,color:C.inkMute,marginBottom:4}}>Photo or video</div>
            <div style={mono({fontSize:9,letterSpacing:"0.14em",textTransform:"uppercase",color:C.inkMute})}>Add media for lesson {lessonRef}</div>
          </div>
        </div>
      </div>

      {/* Visual */}
      {visual&&(
        <div style={{background:C.paper,border:`1px solid ${C.rule}`,borderRadius:6,padding:"16px 18px",marginBottom:14,overflow:"hidden"}}>
          <div style={mono({fontSize:9,letterSpacing:"0.2em",textTransform:"uppercase",color:C.inkMute,marginBottom:12})}>Visual overview</div>
          <div dangerouslySetInnerHTML={{__html:visual}}/>
        </div>
      )}

      {/* Content */}
      {content?(
        <>
          <div style={{background:C.paper,border:`1px solid ${C.rule}`,borderRadius:6,padding:"24px 28px",marginBottom:14}}>
            <div style={mono({fontSize:9,letterSpacing:"0.2em",textTransform:"uppercase",color:C.inkMute,marginBottom:14})}>Lesson content</div>
            {content.body.map((p,i)=>(
              <p key={i} style={{fontFamily:F.body,fontSize:14,lineHeight:1.78,color:C.inkSoft,marginTop:i>0?15:0}} dangerouslySetInnerHTML={{__html:p}}/>
            ))}
          </div>
          <div style={{background:C.creamWarm,border:`1px solid ${C.rule}`,borderRadius:6,padding:"16px 20px",marginBottom:18}}>
            <div style={mono({fontSize:9,letterSpacing:"0.2em",textTransform:"uppercase",color:C.inkMute,marginBottom:11})}>Key learning points</div>
            {content.lp.map((t,i)=>(
              <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"7px 0",borderBottom:i<content.lp.length-1?`1px solid ${C.rule}`:"none"}}>
                <span style={{width:6,height:6,borderRadius:"50%",background:C.accent,flexShrink:0,marginTop:6}}/>
                <span style={{fontFamily:F.display,fontSize:13,lineHeight:1.6,color:C.ink,fontWeight:600}}>{t}</span>
              </div>
            ))}
          </div>
        </>
      ):(
        <div style={{background:C.paper,border:`1px solid ${C.rule}`,borderRadius:6,padding:"28px 32px",marginBottom:18}}>
          <p style={{fontFamily:F.body,fontSize:14,lineHeight:1.7,color:C.inkSoft}}>Lesson <strong>{lesson.title}</strong> · Module {module.n}: {module.title}</p>
        </div>
      )}

      <div style={{display:"flex",justifyContent:"space-between",gap:12}}>
        {prev?<button onClick={()=>{if(typeof _stopTTS!=='undefined')_stopTTS();setRoute("lesson-"+prev.ref)}} style={{fontFamily:F.display,fontWeight:600,fontSize:13,background:"none",color:C.inkSoft,border:`1px solid ${C.rule}`,borderRadius:99,padding:"9px 18px",cursor:"pointer"}}>← {prev.ref} · {prev.title}</button>:<div/>}
        {next?<button onClick={()=>{if(typeof _stopTTS!=='undefined')_stopTTS();setRoute("lesson-"+next.ref)}} style={{fontFamily:F.display,fontWeight:700,fontSize:13,background:C.ink,color:"#fff",border:"none",borderRadius:99,padding:"9px 18px",cursor:"pointer"}}>{next.ref} · {next.title} →</button>:(
          <button onClick={()=>{if(typeof _stopTTS!=='undefined')_stopTTS();setShowShareModal(true)}}
            style={{fontFamily:F.display,fontWeight:700,fontSize:13,
              background:C.accent,color:"#fff",border:"none",
              borderRadius:99,padding:"9px 18px",cursor:"pointer"}}>
            Module complete 🎉
          </button>
        )}
      </div>

      {showShareModal&&(
        <ModuleCompleteModal
          module={module}
          courseComplete={courseComplete}
          onClose={()=>{setShowShareModal(false);setRoute("home")}}
        />
      )}
    </div>
  )
}


/* ── CONTINUE PAGE ───────────────────────────────────────────── */
function ContinuePage({setRoute}) {
  return (
    <div style={{padding:"0 36px 48px"}}>
      <PageHead eyebrow="My progress · Resume" title="Resume" em="Module 3."/>
      <div style={{background:C.ink,borderRadius:6,padding:"32px 36px",margin:"28px 0 0",cursor:"pointer"}} onClick={()=>setRoute("lesson-3.4")}>
        <div style={mono({fontSize:9,letterSpacing:"0.24em",textTransform:"uppercase",color:C.tan,marginBottom:12})}>— pick up where you left off</div>
        <h2 style={{fontFamily:F.display,fontWeight:700,fontSize:26,letterSpacing:"-0.02em",lineHeight:1.1,margin:"0 0 12px",color:"#fff"}}>Module 03 · Lesson 3.4 — <em style={{fontStyle:"normal",color:C.accent}}>CC vs CV drivers.</em></h2>
        <p style={{fontFamily:F.body,fontSize:14,lineHeight:1.6,color:"rgba(248,243,236,0.72)",margin:"0 0 20px",maxWidth:500}}>You read through 3.3 yesterday. Next: how constant-current vs constant-voltage drivers shape your fixture choice.</p>
        <div style={{display:"flex",gap:3,maxWidth:380,marginBottom:20}}>
          {[1,1,1,0.5,0,0,0,0].map((v,i)=><span key={i} style={{flex:1,height:4,borderRadius:2,background:v===1?"rgba(248,243,236,0.85)":v===0.5?C.accent:"rgba(248,243,236,0.14)",boxShadow:v===0.5?`0 0 7px ${C.accent}`:"none"}}/>)}
        </div>
        <button style={{fontFamily:F.display,fontWeight:700,fontSize:14,background:C.accent,color:"#fff",border:"none",borderRadius:99,padding:"11px 22px",cursor:"pointer",display:"inline-flex",alignItems:"center",gap:8}}>
          <span style={{width:7,height:7,borderRadius:"50%",background:"#fff",flexShrink:0}}/>Resume lesson →
        </button>
      </div>
      <div style={{margin:"24px 0 0"}}>
        <div style={mono({fontSize:9,letterSpacing:"0.22em",textTransform:"uppercase",color:C.inkMute,marginBottom:14})}>Module 3 lessons</div>
        <div style={{display:"grid",gap:1,background:C.rule,border:`1px solid ${C.rule}`,borderRadius:4,overflow:"hidden"}}>
          {MODULES[2].lessons.map(l=>(
            <div key={l.ref} onClick={()=>setRoute("lesson-"+l.ref)} style={{display:"grid",gridTemplateColumns:"52px 1fr auto",gap:14,alignItems:"center",background:l.active?`color-mix(in srgb,${C.accent} 5%,${C.cream})`:C.cream,padding:"13px 18px",cursor:"pointer",transition:"background 140ms"}}
              onMouseEnter={e=>e.currentTarget.style.background=C.creamWarm}
              onMouseLeave={e=>e.currentTarget.style.background=l.active?`color-mix(in srgb,${C.accent} 5%,${C.cream})`:C.cream}>
              <span style={{fontFamily:F.display,fontWeight:700,fontSize:17,color:l.done?C.inkMute:l.active?C.accent:C.forest}}>{l.ref}</span>
              <span style={{fontFamily:F.display,fontWeight:600,fontSize:14,color:C.ink}}>{l.title}</span>
              <span style={mono({fontSize:9,letterSpacing:"0.14em",textTransform:"uppercase",color:l.done?C.forest:l.active?C.accent:C.inkMute,whiteSpace:"nowrap"})}>{l.done?"✓ Done":l.active?"▶ Active":"Open →"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}


/* ── ACCOUNT PAGE ────────────────────────────────────────────── */
function AccountPage() {
  const [tab,setTab] = useState("profile")
  const [form,setForm] = useState({name:"Reema Malhotra",firm:"Atelier Vue",email:"reema@atelier-vue.in",role:"Principal · Lighting Lead",location:"Mumbai, IN"})
  const [saved,setSaved] = useState(false)
  function save() {setSaved(true);setTimeout(()=>setSaved(false),2000)}
  const tabs = [["profile","Profile"],["billing","Billing"],["notifications","Notifications"],["export","Export data"]]
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
            {[{key:"name",label:"Display name"},{key:"firm",label:"Firm"},{key:"email",label:"Email",type:"email"},{key:"role",label:"Role"},{key:"location",label:"Location"}].map(({key,label,type="text"})=>(
              <div key={key}>
                <label style={{display:"block",fontFamily:F.mono,fontSize:9,letterSpacing:"0.18em",textTransform:"uppercase",color:C.inkMute,marginBottom:8}}>{label}</label>
                <input type={type} value={form[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))}
                  style={{width:"100%",boxSizing:"border-box",padding:"12px 14px",fontFamily:F.display,fontSize:14,color:C.ink,background:C.paper,border:`1px solid ${C.ruleStrong}`,borderRadius:4,outline:"none"}}
                  onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.ruleStrong}/>
              </div>
            ))}
            <div>
              <label style={{display:"block",fontFamily:F.mono,fontSize:9,letterSpacing:"0.18em",textTransform:"uppercase",color:C.inkMute,marginBottom:8}}>New password</label>
              <input type="password" placeholder="At least 10 characters"
                style={{width:"100%",boxSizing:"border-box",padding:"12px 14px",fontFamily:F.display,fontSize:14,color:C.ink,background:C.paper,border:`1px solid ${C.ruleStrong}`,borderRadius:4,outline:"none"}}
                onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.ruleStrong}/>
            </div>
          </div>
          <button onClick={save} style={{marginTop:24,fontFamily:F.display,fontWeight:700,fontSize:14,background:saved?C.forest:C.accent,color:"#fff",border:"none",borderRadius:99,padding:"12px 28px",cursor:"pointer",transition:"background 200ms"}}>
            {saved?"Saved ✓":"Save changes"}
          </button>
        </div>
      )}

      {tab==="billing"&&(
        <div style={{maxWidth:640}}>
          <div style={{background:C.ink,borderRadius:6,padding:"28px 32px",marginBottom:24}}>
            <div style={mono({fontSize:9,letterSpacing:"0.22em",textTransform:"uppercase",color:C.tan,marginBottom:10})}>Current plan</div>
            <div style={{fontFamily:F.display,fontWeight:700,fontSize:24,color:"#fff",marginBottom:6}}>6-Month plan</div>
            <div style={mono({fontSize:10,letterSpacing:"0.14em",color:"rgba(249,244,237,0.5)",marginBottom:18})}>Expires 28 Aug 2026 · 97 days remaining</div>
            <div style={{display:"flex",gap:12}}>
              <button style={{fontFamily:F.display,fontWeight:600,fontSize:13,background:C.accent,color:"#fff",border:"none",borderRadius:99,padding:"10px 20px",cursor:"pointer"}}>Upgrade to 12-Month →</button>
              <button style={{fontFamily:F.display,fontWeight:600,fontSize:13,background:"none",color:"rgba(249,244,237,0.7)",border:`1px solid rgba(249,244,237,0.3)`,borderRadius:99,padding:"10px 20px",cursor:"pointer"}}>Add exam ($200)</button>
            </div>
          </div>
          <div style={{background:C.paper,border:`1px solid ${C.rule}`,borderRadius:4,padding:"24px 28px"}}>
            <div style={mono({fontSize:9,letterSpacing:"0.18em",textTransform:"uppercase",color:C.inkMute,marginBottom:14})}>Payment method</div>
            <div style={{display:"flex",alignItems:"center",gap:12,fontFamily:F.display,fontSize:14,color:C.ink}}>
              <span style={{background:C.rule,borderRadius:3,padding:"4px 10px",fontFamily:F.mono,fontSize:11}}>VISA</span>
              {"**** **** **** 4242 - expires 12/27"}
            </div>
          </div>
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

      {tab==="export"&&(
        <div style={{maxWidth:480}}>
          <p style={{fontFamily:F.body,fontSize:14,lineHeight:1.6,color:C.inkMute,marginBottom:24}}>Export all your learning data — notes, bookmarks, progress, and exam attempts — as a JSON file.</p>
          <button style={{fontFamily:F.display,fontWeight:700,fontSize:14,background:C.ink,color:"#fff",border:"none",borderRadius:99,padding:"12px 24px",cursor:"pointer"}}>Export data →</button>
        </div>
      )}
    </div>
  )
}



function useBeam(){const ref=useRef(null);const [b,setB]=useState({x:"50%",on:false});const onMove=useCallback(e=>{const r=ref.current?.getBoundingClientRect();if(!r)return;setB({x:((e.clientX-r.left)/r.width*100).toFixed(1)+"%",on:true})},[]);const onLeave=useCallback(()=>setB(b=>({...b,on:false})),[]);return{ref,beam:b,onMove,onLeave}}
function DarkCard({children,style,onClick}){const{ref,beam,onMove,onLeave}=useBeam();return(<div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} onClick={onClick} style={{background:C.ink,borderRadius:6,position:"relative",overflow:"hidden",...style}}><div style={{position:"absolute",inset:0,pointerEvents:"none",background:`conic-gradient(from -12deg at ${beam.x} -20%,transparent 0deg,rgba(255,255,255,0.09) 22deg,transparent 44deg)`,opacity:beam.on?1:0,transition:"opacity 280ms ease"}}/>{children}</div>)}
function LessonDots({lessons,hoveredIdx,setHoveredIdx}){return(<div style={{display:"flex",flexWrap:"wrap",gap:4}}>{lessons.map((l,i)=>(<div key={i} onMouseEnter={()=>setHoveredIdx(i)} onMouseLeave={()=>setHoveredIdx(null)} style={{width:9,height:9,borderRadius:"50%",cursor:"pointer",background:l.done?C.forest:l.active?C.accent:hoveredIdx===i?C.tan:C.rule,transition:"background 160ms,box-shadow 160ms",boxShadow:l.active?`0 0 0 3px rgba(184,88,53,0.28),0 0 8px rgba(184,88,53,0.55)`:l.done&&hoveredIdx===i?`0 0 0 3px rgba(42,96,72,0.3)`:"none",animation:l.active?"bulbPulse 2s ease-in-out infinite":"none"}}/>))}</div>)}

function ModuleRow({mod,oddCol,setRoute}){const[hov,setHov]=useState(false);const[dotIdx,setDotIdx]=useState(null);const{ref,beam,onMove,onLeave:bLeave}=useBeam();const numColor=mod.done?hov?"#4a9068":C.forest:mod.active?hov?C.amber:C.accent:hov?"rgba(232,160,32,0.80)":"rgba(232,160,32,0.11)";const barColor=mod.done?C.forest:mod.active?C.accent:C.ruleStrong;const hovL=dotIdx!==null?mod.lessons[dotIdx]:null;return(<div ref={ref} onMouseMove={e=>{onMove(e);setHov(true)}} onMouseEnter={()=>setHov(true)} onMouseLeave={e=>{bLeave(e);setHov(false)}} onClick={()=>setRoute("lesson-"+mod.lessons[0].ref)} style={{display:"grid",gridTemplateColumns:"80px 1fr auto",gap:20,padding:`24px 24px 24px ${hov?30:24}px`,borderBottom:`1px solid ${C.rule}`,borderRight:oddCol?`1px solid ${C.rule}`:"none",background:hov?mod.active?`color-mix(in srgb,${C.accent} 5%,${C.cream})`:C.creamWarm:"transparent",transition:"background 200ms,padding-left 180ms",cursor:"pointer",position:"relative",overflow:"hidden"}}>
  {hov&&<div style={{position:"absolute",inset:0,pointerEvents:"none",background:`radial-gradient(ellipse 55% 80% at ${beam.x} -5%,rgba(232,160,32,0.07) 0%,transparent 65%)`}}/>}
  <div style={{fontFamily:F.display,fontWeight:800,fontSize:56,lineHeight:0.9,letterSpacing:"-0.04em",color:numColor,transition:"color 220ms ease",position:"relative",flexShrink:0,textShadow:hov&&!mod.done&&!mod.active?`0 0 24px rgba(232,160,32,0.45),0 0 48px rgba(232,160,32,0.18)`:"none"}}>
    {mod.n}
    {mod.done&&<span style={{position:"absolute",top:-6,right:-3,width:18,height:18,borderRadius:"50%",background:C.forest,color:C.cream,display:"grid",placeItems:"center",fontSize:9,fontWeight:700,fontFamily:F.display}}>✓</span>}
  </div>
  <div style={{display:"flex",flexDirection:"column",gap:6,minWidth:0}}>
    <span style={mono({fontSize:9,letterSpacing:"0.22em",textTransform:"uppercase",color:mod.done?C.forest:mod.active?C.accent:C.inkMute})}>{mod.active?"In progress · ":""}{mod.label}</span>
    <span style={{fontFamily:F.display,fontWeight:700,fontSize:18,letterSpacing:"-0.01em",lineHeight:1.2,color:C.ink}}>{mod.title}</span>
    <span style={{fontFamily:F.body,fontSize:12,color:C.inkMute,lineHeight:1.55}}>{mod.lessons.slice(0,4).map(l=>l.title).join(" · ")}…</span>
    {mod.active&&<div style={{marginTop:4}}><LessonDots lessons={mod.lessons} hoveredIdx={dotIdx} setHoveredIdx={setDotIdx}/><div style={mono({marginTop:5,fontSize:9,color:C.inkMute,minHeight:13})}>{hovL?`${hovL.active?"▶ ":hovL.done?"✓ ":""}${hovL.title}`:"Hover a dot to preview"}</div></div>}
  </div>
  <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:8,minWidth:110}}>
    <span style={mono({fontSize:9,color:C.inkMute,letterSpacing:"0.14em"})}>{mod.count}</span>
    <div style={{width:100}}><FilamentBar pct={mod.pct} color={barColor} glow={mod.active||mod.done}/></div>
    <span style={mono({fontSize:9,letterSpacing:"0.12em",color:C.inkMute})}>{mod.done?<span style={{color:C.forest,fontWeight:600}}>Complete</span>:mod.active?<span style={{color:C.accent,fontWeight:600}}>In progress</span>:mod.pct>0?`${mod.pct}%`:"Not started"}</span>
    <div style={{width:28,height:28,borderRadius:"50%",border:`1px solid ${mod.active?C.accent:C.inkSoft}`,display:"grid",placeItems:"center",opacity:hov||mod.active?1:0,transform:hov||mod.active?"translateX(0)":"translateX(-6px)",transition:"opacity 180ms,transform 180ms",color:mod.active?C.accent:C.inkSoft}}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
    </div>
  </div>
</div>)}



function Sidebar({route, setRoute, user, onSignOut}){
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
    {section:"Account", items:[
      {glyph:"○",label:"Settings",route:"account"},
    ]},
  ]
  return (
    <aside style={{background:C.ink,display:"flex",flexDirection:"column",
      position:"sticky",top:0,height:"100vh",overflowY:"auto",scrollbarWidth:"none",minWidth:220}}>
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"18px 16px 14px",
        borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
        <div style={{width:28,height:28,borderRadius:5,background:C.accent,
          display:"flex",alignItems:"center",justifyContent:"center",
          fontFamily:F.display,fontWeight:800,fontSize:11,color:"#fff",flexShrink:0}}>LM</div>
        <div>
          <div style={{fontFamily:F.display,fontWeight:700,fontSize:13,color:"#fff",lineHeight:1.2}}>Lighting Master</div>
          <div style={m({fontSize:8,letterSpacing:"0.18em",textTransform:"uppercase",color:"rgba(255,255,255,0.28)",marginTop:1})}>LC Exam Prep · Luxartmedia</div>
        </div>
      </div>

      {nav.map(({section,items})=>(
        <div key={section} style={{paddingTop:14}}>
          <div style={m({fontSize:8,letterSpacing:"0.26em",textTransform:"uppercase",
            color:"rgba(255,255,255,0.22)",padding:"0 16px 5px"})}>{section}</div>
          {items.map(item=>(
            <button key={item.route} onClick={()=>setRoute(item.route)}
              style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"9px 16px",
                background:route===item.route?"rgba(184,88,53,0.18)":"none",border:"none",
                borderLeft:route===item.route?`2px solid ${C.accent}`:"2px solid transparent",
                cursor:"pointer",textAlign:"left"}}>
              <span style={m({fontSize:11,color:route===item.route?C.accent:"rgba(255,255,255,0.45)",
                flexShrink:0,width:14,textAlign:"center"})}>{item.glyph}</span>
              <span style={{fontFamily:F.display,fontSize:13,fontWeight:route===item.route?600:400,
                color:route===item.route?"#fff":"rgba(255,255,255,0.65)"}}>{item.label}</span>
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
      </div>
    </aside>
  )
}

/* ── PLAN HELPERS ── */
const PLAN_LABELS = { free:"Free trial", t1:"Test Engine", t2:"Full Course", t3:"Course + Exam", team_admin:"Team Admin", team_member:"Team Member" }

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
      style={{position:"fixed",inset:0,zIndex:2000,background:"rgba(22,18,14,0.82)",
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
              return(<div key={i} onClick={()=>setRoute(`lesson-${i+1}.1`)} style={{background:done?C.forest+"18":current?C.accentLight:C.creamWarm,border:`1px solid ${done?C.forest:current?C.accent:C.rule}`,borderRadius:8,padding:"10px 8px",textAlign:"center",cursor:"pointer",transition:"all 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background=done?C.forestLight:C.accentLight} onMouseLeave={e=>e.currentTarget.style.background=done?C.forest+"18":current?C.accentLight:C.creamWarm}>
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
function Dashboard({setRoute, user}){
  const plan   = user?.plan||"free"
  const isFree = plan==="free"
  const isT1   = plan==="t1"
  const isT2   = plan==="t2"
  const [showUpgrade, setShowUpgrade] = useState(false)
  const canUpgrade = plan!=="t3" && plan!=="team_admin" && plan!=="team_member"

  return(
    <div style={{padding:"40px 36px",minHeight:"100vh"}}>
      {showUpgrade&&<UpgradeModal user={user} onClose={()=>setShowUpgrade(false)}/>}
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:32,flexWrap:"wrap",gap:16}}>
        <div>
          <div style={m({fontSize:9,letterSpacing:"0.24em",textTransform:"uppercase",color:C.accent,marginBottom:8})}>Welcome back</div>
          <h1 style={{fontFamily:F.display,fontWeight:700,fontSize:32,letterSpacing:"-0.02em",color:C.ink,margin:0,lineHeight:1.1}}>{user?.name?.split(" ")[0]||"Designer"}'s Dashboard</h1>
          {user?.company&&<div style={m({fontSize:9,letterSpacing:"0.12em",textTransform:"uppercase",color:C.inkMute,marginTop:6})}>{user.company}{user.state&&` · ${user.state}`}</div>}
        </div>
        {isFree&&(<div style={{background:C.accentLight,border:`1px solid ${C.ruleStrong}`,borderRadius:10,padding:"14px 18px",maxWidth:280}}>
          <div style={d({fontWeight:700,fontSize:13,color:C.accent,marginBottom:4})}>Free trial</div>
          <p style={{fontFamily:F.body,fontSize:12,color:C.inkMute,margin:"0 0 10px",lineHeight:1.5}}>Module 01 and 10 practice questions unlocked. Upgrade to access all 12 modules and the full exam.</p>
          <button onClick={()=>setShowUpgrade(true)} style={{width:"100%",padding:"8px",background:C.accent,color:"#fff",border:"none",borderRadius:6,fontFamily:F.display,fontWeight:700,fontSize:12,cursor:"pointer"}}>Upgrade now →</button>
        </div>)}
        {isT1&&(<div style={{background:C.forestLight,border:`1px solid ${C.forest}`,borderRadius:10,padding:"14px 18px",maxWidth:280}}>
          <div style={d({fontWeight:700,fontSize:13,color:C.forest,marginBottom:4})}>Test Engine plan</div>
          <p style={{fontFamily:F.body,fontSize:12,color:C.inkMute,margin:"0 0 10px",lineHeight:1.5}}>Full LC practice exam unlocked — 129 questions, unlimited attempts.</p>
          <button onClick={()=>setShowUpgrade(true)} style={{width:"100%",padding:"8px",background:C.forest,color:"#fff",border:"none",borderRadius:6,fontFamily:F.display,fontWeight:700,fontSize:12,cursor:"pointer"}}>Add full course →</button>
        </div>)}
        {isT2&&(<div style={{background:C.creamWarm,border:`1px solid ${C.rule}`,borderRadius:10,padding:"14px 18px",maxWidth:280}}>
          <div style={d({fontWeight:700,fontSize:13,color:C.ink,marginBottom:4})}>Full Course plan</div>
          <p style={{fontFamily:F.body,fontSize:12,color:C.inkMute,margin:"0 0 10px",lineHeight:1.5}}>Add the LC practice exam to test your readiness before exam day.</p>
          <button onClick={()=>setShowUpgrade(true)} style={{width:"100%",padding:"8px",background:C.ink,color:"#fff",border:"none",borderRadius:6,fontFamily:F.display,fontWeight:700,fontSize:12,cursor:"pointer"}}>Add exam engine →</button>
        </div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:32}}>
        {[["Your plan",PLAN_LABELS[plan]||plan],["Modules unlocked",isFree?"1 / 12":isT1?"0 / 12":"12 / 12"],["CEU hours",isFree||isT1?"—":"24.0"],["Access expires",`Dec 31, ${new Date().getFullYear()}`]].map(([label,val])=>(
          <div key={label} style={{background:C.paper,border:`1px solid ${C.rule}`,borderRadius:10,padding:"16px 18px"}}>
            <div style={m({fontSize:8,letterSpacing:"0.18em",textTransform:"uppercase",color:C.inkMute,marginBottom:8})}>{label}</div>
            <div style={d({fontWeight:700,fontSize:val.length>10?16:22,color:C.ink,letterSpacing:"-0.01em",lineHeight:1.2})}>{val}</div>
          </div>
        ))}
      </div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
        <div style={d({fontWeight:700,fontSize:15,color:C.ink})}>All modules</div>
        {canUpgrade&&(<button onClick={()=>setShowUpgrade(true)} style={{fontFamily:F.display,fontWeight:600,fontSize:12,background:"none",border:`1px solid ${C.ruleStrong}`,borderRadius:99,padding:"6px 16px",cursor:"pointer",color:C.inkSoft}} onMouseEnter={e=>{e.currentTarget.style.borderColor=C.accent;e.currentTarget.style.color=C.accent}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.ruleStrong;e.currentTarget.style.color=C.inkSoft}}>Unlock all modules →</button>)}
      </div>
      <div style={{display:"grid",gap:1,border:`1px solid ${C.rule}`,borderRadius:6,overflow:"hidden"}}>
        {APP_MODULES.map((mod,i)=>{
          const unlocked=moduleAccess(plan,mod.free),locked=!unlocked
          return(<div key={mod.n} onClick={locked?()=>setShowUpgrade(true):()=>setRoute(`lesson-${parseInt(mod.n)}.1`)}
            style={{display:"grid",gridTemplateColumns:"48px 1fr 80px 100px",gap:16,alignItems:"center",padding:"14px 20px",background:mod.active&&!locked?C.accentLight:locked?"rgba(0,0,0,0.02)":C.paper,borderBottom:i<APP_MODULES.length-1?`1px solid ${C.rule}`:"none",cursor:"pointer",transition:"background 140ms",opacity:locked?0.5:1}}
            onMouseEnter={e=>e.currentTarget.style.background=locked?C.accentLight:C.creamWarm}
            onMouseLeave={e=>{e.currentTarget.style.background=mod.active&&!locked?C.accentLight:locked?"rgba(0,0,0,0.02)":C.paper}}>
            <span style={d({fontWeight:700,fontSize:16,color:locked?C.inkMute:C.accent})}>M{mod.n}</span>
            <div>
              <div style={d({fontWeight:600,fontSize:13,color:locked?C.inkMute:C.ink})}>{mod.title}</div>
              <div style={m({fontSize:8,letterSpacing:"0.1em",textTransform:"uppercase",color:C.inkMute,marginTop:2})}>{mod.label}{locked&&isT1&&" · Requires Full Course"}{locked&&(isFree||isT1)&&mod.n!=="01"&&" · Click to upgrade"}</div>
            </div>
            <div style={{textAlign:"right"}}><div style={m({fontSize:9,color:C.inkMute})}>{mod.count} lessons</div></div>
            <div><div style={{background:C.rule,borderRadius:3,height:5,overflow:"hidden"}}><div style={{background:mod.pct===100?C.forest:C.accent,height:5,borderRadius:3,width:`${locked?0:mod.pct}%`,transition:"width 0.5s"}}/></div><div style={m({fontSize:8,color:C.inkMute,marginTop:4,textAlign:"right"})}>{locked?"—":mod.pct+"%"}</div></div>
          </div>)
        })}
      </div>
    </div>
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

function AppShell({user, onSignOut}){
  const [route, setRoute] = useState("home")
  return(
    <div style={{display:"grid",gridTemplateColumns:"220px 1fr",minHeight:"100vh",
      fontFamily:F.body,background:C.cream}}>
      <style>{`@import url('${FONT_URL}');*{box-sizing:border-box}code{font-family:${F.mono};font-size:0.9em;background:rgba(0,0,0,0.06);padding:1px 5px;border-radius:3px}`}</style>
      <Sidebar route={route} setRoute={setRoute} user={user} onSignOut={onSignOut}/>
      <main style={{background:C.cream,minHeight:"100vh",overflowX:"hidden"}}>
        {route==="home"&&user?.plan==="team_admin"  && <TeamAdminDashboard user={user} setRoute={setRoute}/>}
        {route==="home"&&user?.plan==="team_member" && <TeamMemberView user={user} setRoute={setRoute}/>}
        {route==="home"&&user?.plan!=="team_admin"&&user?.plan!=="team_member" && <Dashboard setRoute={setRoute} user={user}/>}
        {route==="search"    && <SearchPage setRoute={setRoute}/>}
        {route==="bookmarks" && <BookmarksPage setRoute={setRoute}/>}
        {route==="notes"     && <NotesPage setRoute={setRoute}/>}
        {route==="continue"  && <ContinuePage setRoute={setRoute}/>}
        {route==="exam"      && <ExamPage setRoute={setRoute}/>}
        {route==="cert"      && <CertPage/>}
        {route==="account"   && <AccountPage/>}
        {route.startsWith("lesson-") && <LessonPage lessonRef={route.replace("lesson-","")} setRoute={setRoute}/>}
      </main>
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
  const [legalDoc, setLegalDoc] = useState(null) // null | privacy | terms | cookies | refund
  const [successToast, setSuccessToast] = useState(null)

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

  // Re-fetch subscription on payment=success redirect
  useEffect(()=>{
    if(typeof window==="undefined") return
    const params = new URLSearchParams(window.location.search)
    if(params.get("payment")!=="success") return
    // Small delay to allow webhook to process
    const t = setTimeout(async ()=>{
      const { data:{ session } } = await supabase.auth.getSession()
      if(!session) return
      const u = session.user
      const { data:sub } = await supabase.from("subscriptions").select("*").eq("user_id", u.id).single()
      if(sub){
        setUser(prev=>prev?{...prev,plan:sub.plan,examAddon:sub.exam_addon||false}:prev)
        setSuccessToast("Access unlocked! Welcome to LC · Lighting Master.")
        setTimeout(()=>setSuccessToast(null), 6000)
      }
      // Remove query param without reload
      window.history.replaceState({}, "", window.location.pathname)
    }, 2000)
    return ()=>clearTimeout(t)
  },[])

  async function handleSignOut(){
    await supabase.auth.signOut()
    setUser(null)
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
        <AuthModal mode={authMode} onClose={closeAuth} onAuth={handleAuth}/>
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

      {page==="app"&&(
        <AppShell user={user} onSignOut={handleSignOut}/>
      )}
    </>
  )
}


/* ══ ADMIN PORTAL ══ */

/* ── DESIGN TOKENS — LC brand palette ──────────── */
const AT = {
  bg0:"#f8f3ec",    // page background  → LC cream
  bg1:"#16120e",    // sidebar          → LC ink (stays dark, matches learner app)
  bg2:"#f8f3ec",    // main canvas      → LC cream
  bg3:"#fdfaf6",    // card surface     → LC paper
  bg4:"#f0e8db",    // elevated / hover → LC cream-warm
  border:"#e4d9ca", // default border   → LC rule
  borderHi:"#cfc3b0",// highlighted     → LC rule-strong
  ink:"#16120e",    // primary text     → LC ink
  inkSoft:"#352c22",// secondary text   → LC ink-soft
  inkMute:"#8a7a6a",// muted / labels   → LC ink-mute
  accent:"#b85835", // brand rust       → unchanged
  accentDim:"rgba(184,88,53,0.10)",
  green:"#2a6048",  // success / active → LC forest
  greenDim:"rgba(42,96,72,0.10)",
  amber:"#e8a020",  // warning          → LC amber
  amberDim:"rgba(232,160,32,0.10)",
  red:"#c0392b",    // danger / flagged → deeper red on cream
  redDim:"rgba(192,57,43,0.08)",
  blue:"#2563eb",   // info
  blueDim:"rgba(37,99,235,0.08)",
  purple:"#7c3aed", // exam tier
  purpleDim:"rgba(124,58,237,0.08)",
  tan:"#c9a87c",    // sidebar accent labels → LC tan
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
const A_PLAN_LABELS ={free:"Free",t1:"Test Engine",t2:"Full Course",t3:"Course+Exam"}
const PLAN_COLORS={free:AT.inkMute,t1:AT.blue,t2:AT.green,t3:AT.purple}
const STATUS_COLORS={active:AT.green,past_due:AT.amber,canceled:AT.red,trialing:AT.blue,free:AT.inkMute}

function rnd(min,max){return Math.floor(Math.random()*(max-min+1))+min}
function pick(arr){return arr[Math.floor(Math.random()*arr.length)]}
function daysAgo(n){const d=new Date();d.setDate(d.getDate()-n);return d.toISOString().split("T")[0]}
function fmtDate(iso){return new Date(iso).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}
function fmtMoney(n){return"$"+n.toLocaleString()}

// Seed with fixed values for determinism
const SEED_USERS = [
  {id:"u001",firstName:"Marcus",lastName:"Thompson",email:"m.thompson@gensler.com",company:"Gensler",state:"California",plan:"t3",status:"active",joinDate:daysAgo(142),lastActive:daysAgo(1),modulesCompleted:9,examAttempts:3,examBestScore:91,progress:75,stripeId:"cus_abc001",amount:695,flagged:false,notes:""},
  {id:"u002",firstName:"Priya",lastName:"Kapoor",email:"p.kapoor@hlb.com",company:"HLB Lighting",state:"New York",plan:"t2",status:"active",joinDate:daysAgo(98),lastActive:daysAgo(3),modulesCompleted:6,examAttempts:0,examBestScore:null,progress:50,stripeId:"cus_abc002",amount:495,flagged:false,notes:""},
  {id:"u003",firstName:"Sarah",lastName:"Lindqvist",email:"sarah.l@aecom.com",company:"AECOM",state:"Texas",plan:"t3",status:"active",joinDate:daysAgo(200),lastActive:daysAgo(0),modulesCompleted:12,examAttempts:5,examBestScore:97,progress:100,stripeId:"cus_abc003",amount:695,flagged:false,notes:"Top performer. Potential testimonial."},
  {id:"u004",firstName:"Devon",lastName:"Walsh",email:"d.walsh@arup.com",company:"Arup",state:"Illinois",plan:"t1",status:"active",joinDate:daysAgo(22),lastActive:daysAgo(5),modulesCompleted:0,examAttempts:2,examBestScore:74,progress:0,stripeId:"cus_abc004",amount:250,flagged:false,notes:""},
  {id:"u005",firstName:"Amara",lastName:"Osei",email:"amara@selfemployed.com",company:"Self-employed",state:"Florida",plan:"free",status:"free",joinDate:daysAgo(12),lastActive:daysAgo(2),modulesCompleted:1,examAttempts:0,examBestScore:null,progress:8,stripeId:null,amount:0,flagged:false,notes:""},
  {id:"u006",firstName:"James",lastName:"Park",email:"j.park@wsp.com",company:"WSP",state:"Washington",plan:"t3",status:"past_due",joinDate:daysAgo(167),lastActive:daysAgo(18),modulesCompleted:7,examAttempts:1,examBestScore:68,progress:58,stripeId:"cus_abc006",amount:695,flagged:true,notes:"Payment failed twice. Follow up."},
  {id:"u007",firstName:"Elena",lastName:"Rossi",email:"e.rossi@lam.com",company:"Lam Partners",state:"Massachusetts",plan:"t2",status:"active",joinDate:daysAgo(55),lastActive:daysAgo(1),modulesCompleted:8,examAttempts:0,examBestScore:null,progress:67,stripeId:"cus_abc007",amount:395,flagged:false,notes:""},
  {id:"u008",firstName:"Carlos",lastName:"Mendez",email:"c.mendez@stantec.com",company:"Stantec",state:"Arizona",plan:"t2",status:"canceled",joinDate:daysAgo(210),lastActive:daysAgo(45),modulesCompleted:3,examAttempts:0,examBestScore:null,progress:25,stripeId:"cus_abc008",amount:495,flagged:false,notes:"Canceled mid-course. Potential win-back."},
  {id:"u009",firstName:"Nina",lastName:"Volkova",email:"n.volkova@hdr.com",company:"HDR",state:"Colorado",plan:"t3",status:"active",joinDate:daysAgo(88),lastActive:daysAgo(0),modulesCompleted:11,examAttempts:4,examBestScore:88,progress:92,stripeId:"cus_abc009",amount:595,flagged:false,notes:""},
  {id:"u010",firstName:"Tyler",lastName:"Brooks",email:"t.brooks@arcadis.com",company:"Arcadis",state:"Georgia",plan:"free",status:"free",joinDate:daysAgo(4),lastActive:daysAgo(4),modulesCompleted:1,examAttempts:0,examBestScore:null,progress:12,stripeId:null,amount:0,flagged:false,notes:""},
  {id:"u011",firstName:"Hana",lastName:"Suzuki",email:"h.suzuki@atelier10.com",company:"Atelier Ten",state:"New York",plan:"t3",status:"active",joinDate:daysAgo(130),lastActive:daysAgo(2),modulesCompleted:10,examAttempts:3,examBestScore:85,progress:83,stripeId:"cus_abc011",amount:695,flagged:false,notes:""},
  {id:"u012",firstName:"Kwame",lastName:"Asante",email:"k.asante@gensler.com",company:"Gensler",state:"California",plan:"t2",status:"active",joinDate:daysAgo(71),lastActive:daysAgo(6),modulesCompleted:5,examAttempts:0,examBestScore:null,progress:42,stripeId:"cus_abc012",amount:495,flagged:false,notes:""},
  {id:"u013",firstName:"Rachel",lastName:"Kim",email:"r.kim@lumenpulse.com",company:"Lumenpulse",state:"Pennsylvania",plan:"t1",status:"active",joinDate:daysAgo(9),lastActive:daysAgo(1),modulesCompleted:0,examAttempts:1,examBestScore:61,progress:0,stripeId:"cus_abc013",amount:250,flagged:false,notes:""},
  {id:"u014",firstName:"Omar",lastName:"Hassan",email:"o.hassan@wsp.com",company:"WSP",state:"Ohio",plan:"t3",status:"trialing",joinDate:daysAgo(3),lastActive:daysAgo(0),modulesCompleted:1,examAttempts:0,examBestScore:null,progress:8,stripeId:"cus_abc014",amount:695,flagged:false,notes:""},
  {id:"u015",firstName:"Isabelle",lastName:"Dubois",email:"i.dubois@arup.com",company:"Arup",state:"Texas",plan:"t2",status:"active",joinDate:daysAgo(44),lastActive:daysAgo(3),modulesCompleted:4,examAttempts:0,examBestScore:null,progress:33,stripeId:"cus_abc015",amount:395,flagged:false,notes:""},
  {id:"u016",firstName:"Marcus",lastName:"Reid",email:"m.reid@hdr.com",company:"HDR",state:"Florida",plan:"free",status:"free",joinDate:daysAgo(7),lastActive:daysAgo(7),modulesCompleted:1,examAttempts:0,examBestScore:null,progress:5,stripeId:null,amount:0,flagged:true,notes:"Suspicious signup — duplicate IP."},
  {id:"u017",firstName:"Yuki",lastName:"Tanaka",email:"y.tanaka@stantec.com",company:"Stantec",state:"Washington",plan:"t3",status:"active",joinDate:daysAgo(115),lastActive:daysAgo(1),modulesCompleted:9,examAttempts:2,examBestScore:82,progress:75,stripeId:"cus_abc017",amount:695,flagged:false,notes:""},
  {id:"u018",firstName:"Bianca",lastName:"Ferreira",email:"b.ferreira@arcadis.com",company:"Arcadis",state:"Colorado",plan:"t2",status:"active",joinDate:daysAgo(33),lastActive:daysAgo(4),modulesCompleted:3,examAttempts:0,examBestScore:null,progress:25,stripeId:"cus_abc018",amount:395,flagged:false,notes:""},
  {id:"u019",firstName:"Alex",lastName:"Chen",email:"a.chen@lam.com",company:"Lam Partners",state:"California",plan:"t3",status:"active",joinDate:daysAgo(180),lastActive:daysAgo(0),modulesCompleted:12,examAttempts:6,examBestScore:99,progress:100,stripeId:"cus_abc019",amount:695,flagged:false,notes:"Perfect score. Great testimonial candidate."},
  {id:"u020",firstName:"Diana",lastName:"Okafor",email:"d.okafor@selfemployed.com",company:"Self-employed",state:"Georgia",plan:"t1",status:"active",joinDate:daysAgo(18),lastActive:daysAgo(2),modulesCompleted:0,examAttempts:3,examBestScore:79,progress:0,stripeId:"cus_abc020",amount:250,flagged:false,notes:""},
  {id:"u021",firstName:"Lucas",lastName:"Andersen",email:"l.andersen@gensler.com",company:"Gensler",state:"New York",plan:"t3",status:"canceled",joinDate:daysAgo(290),lastActive:daysAgo(120),modulesCompleted:12,examAttempts:2,examBestScore:90,progress:100,stripeId:"cus_abc021",amount:695,flagged:false,notes:"Completed course. Passed exam. Access expired."},
  {id:"u022",firstName:"Mia",lastName:"Johansson",email:"m.jo@atelier10.com",company:"Atelier Ten",state:"Massachusetts",plan:"free",status:"free",joinDate:daysAgo(1),lastActive:daysAgo(0),modulesCompleted:0,examAttempts:0,examBestScore:null,progress:2,stripeId:null,amount:0,flagged:false,notes:""},
  {id:"u023",firstName:"Theo",lastName:"Papadopoulos",email:"t.papa@hlb.com",company:"HLB Lighting",state:"Pennsylvania",plan:"t2",status:"past_due",joinDate:daysAgo(160),lastActive:daysAgo(30),modulesCompleted:5,examAttempts:0,examBestScore:null,progress:42,stripeId:"cus_abc023",amount:495,flagged:true,notes:"Payment past due 30 days."},
  {id:"u024",firstName:"Sofia",lastName:"Martinez",email:"s.martinez@luxartmedia.com",company:"Luxartmedia",state:"Florida",plan:"t3",status:"active",joinDate:daysAgo(250),lastActive:daysAgo(0),modulesCompleted:12,examAttempts:4,examBestScore:95,progress:100,stripeId:"cus_abc024",amount:695,flagged:false,notes:"Internal test account."},
]

const SEED_TEAMS = [
  {
    id:"team_001",
    name:"Gensler LA Studio",
    adminUserId:"ta_001",
    adminName:"Marcus Thompson",
    adminEmail:"m.thompson@gensler.com",
    company:"Gensler",
    state:"California",
    seats:5,
    stripeId:"cus_team_001",
    amount:1800,
    status:"active",
    joinDate:daysAgo(98),
    members:[
      {id:"tm1",name:"Priya Kapoor",  email:"p.kapoor@gensler.com",  progress:72,modulesCompleted:8, examBestScore:88,lastActive:daysAgo(1), status:"active"},
      {id:"tm2",name:"Devon Walsh",   email:"d.walsh@gensler.com",   progress:45,modulesCompleted:5, examBestScore:71,lastActive:daysAgo(3), status:"active"},
      {id:"tm3",name:"Elena Rossi",   email:"e.rossi@gensler.com",   progress:91,modulesCompleted:11,examBestScore:94,lastActive:daysAgo(0), status:"active"},
      {id:"tm4",name:"Invite pending",email:"c.jones@gensler.com",   progress:0, modulesCompleted:0, examBestScore:null,lastActive:null,     status:"invited"},
      {id:"tm5",name:"Seat available",email:null,                    progress:0, modulesCompleted:0, examBestScore:null,lastActive:null,     status:"empty"},
    ]
  },
  {
    id:"team_002",
    name:"HLB SF Office",
    adminUserId:"ta_002",
    adminName:"Hana Suzuki",
    adminEmail:"h.suzuki@hlb.com",
    company:"HLB Lighting",
    state:"California",
    seats:3,
    stripeId:"cus_team_002",
    amount:1080,
    status:"active",
    joinDate:daysAgo(44),
    members:[
      {id:"tm6",name:"Kwame Asante",   email:"k.asante@hlb.com",    progress:42,modulesCompleted:5, examBestScore:null,lastActive:daysAgo(4), status:"active"},
      {id:"tm7",name:"Rachel Kim",     email:"r.kim@hlb.com",       progress:17,modulesCompleted:2, examBestScore:null,lastActive:daysAgo(7), status:"active"},
      {id:"tm8",name:"Invite pending", email:"t.wong@hlb.com",      progress:0, modulesCompleted:0, examBestScore:null,lastActive:null,      status:"invited"},
    ]
  },
  {
    id:"team_003",
    name:"Arup Global Lighting",
    adminUserId:"ta_003",
    adminName:"Isabelle Dubois",
    adminEmail:"i.dubois@arup.com",
    company:"Arup",
    state:"New York",
    seats:8,
    stripeId:"cus_team_003",
    amount:2240,
    status:"past_due",
    joinDate:daysAgo(180),
    members:[
      {id:"tm9", name:"Omar Hassan",  email:"o.hassan@arup.com",   progress:83,modulesCompleted:10,examBestScore:87, lastActive:daysAgo(2), status:"active"},
      {id:"tm10",name:"Bianca Ferr.", email:"b.f@arup.com",        progress:58,modulesCompleted:7, examBestScore:74, lastActive:daysAgo(5), status:"active"},
      {id:"tm11",name:"Theo Papa.",   email:"t.p@arup.com",        progress:33,modulesCompleted:4, examBestScore:null,lastActive:daysAgo(11),status:"active"},
      {id:"tm12",name:"Seat available",email:null,                 progress:0, modulesCompleted:0, examBestScore:null,lastActive:null,      status:"empty"},
      {id:"tm13",name:"Seat available",email:null,                 progress:0, modulesCompleted:0, examBestScore:null,lastActive:null,      status:"empty"},
      {id:"tm14",name:"Seat available",email:null,                 progress:0, modulesCompleted:0, examBestScore:null,lastActive:null,      status:"empty"},
      {id:"tm15",name:"Seat available",email:null,                 progress:0, modulesCompleted:0, examBestScore:null,lastActive:null,      status:"empty"},
      {id:"tm16",name:"Seat available",email:null,                 progress:0, modulesCompleted:0, examBestScore:null,lastActive:null,      status:"empty"},
    ]
  },
]


const REVENUE_MONTHS = [
  {month:"Jul 2024",mrr:2840,t1:0,t2:1440,t3:1400,users:6},
  {month:"Aug 2024",mrr:5290,t1:0,t2:2370,t3:2920,users:11},
  {month:"Sep 2024",mrr:7650,t1:0,t2:3465,t3:4185,users:16},
  {month:"Oct 2024",mrr:4200,t1:1500,t2:1395,t3:1305,users:14},
  {month:"Nov 2024",mrr:1390,t1:250,t2:790,t3:350,users:4},
  {month:"Dec 2024",mrr:980,t1:0,t2:590,t3:390,users:3},
  {month:"Jan 2025",mrr:590,t1:0,t2:395,t3:195,users:2},
  {month:"Feb 2025",mrr:790,t1:0,t2:395,t3:395,users:2},
  {month:"Mar 2025",mrr:1185,t1:0,t2:790,t3:395,users:3},
  {month:"Apr 2025",mrr:1580,t1:0,t2:790,t3:790,users:4},
  {month:"May 2025",mrr:3560,t1:0,t2:1580,t3:1980,users:9},
  {month:"Jun 2025",mrr:5330,t1:0,t2:2370,t3:2960,users:13},
]

const MODULE_STATS = [
  {n:"01",title:"Theory, Light, Sight & Color",completions:22,dropoffs:0,avgTime:38},
  {n:"02",title:"Light Sources & Ballasts",completions:18,dropoffs:4,avgTime:42},
  {n:"03",title:"LED Technology Deep Dive",completions:14,dropoffs:4,avgTime:55},
  {n:"04",title:"Photometry & IES Files",completions:11,dropoffs:3,avgTime:61},
  {n:"05",title:"Lighting Controls",completions:10,dropoffs:1,avgTime:44},
  {n:"06",title:"Downlighting & Interior Design",completions:10,dropoffs:0,avgTime:39},
  {n:"07",title:"Exterior, Emergency & Codes",completions:9,dropoffs:1,avgTime:48},
  {n:"08",title:"Industrial Lighting & Human Health",completions:9,dropoffs:0,avgTime:41},
  {n:"09",title:"Energy, Environment & Sustainable",completions:8,dropoffs:1,avgTime:52},
  {n:"10",title:"Design Process I: Planning to DD",completions:8,dropoffs:0,avgTime:46},
  {n:"11",title:"Design Process II: Documents to POE",completions:8,dropoffs:0,avgTime:43},
  {n:"12",title:"LC Exam Strategy & Practice",completions:7,dropoffs:1,avgTime:58},
]

const EXAM_TOPIC_STATS = [
  {topic:"Photometry",avgScore:72,attempts:14},
  {topic:"Color & Vision",avgScore:81,attempts:14},
  {topic:"Light Sources",avgScore:78,attempts:14},
  {topic:"Controls",avgScore:65,attempts:14},
  {topic:"Daylighting",avgScore:70,attempts:14},
  {topic:"Energy Codes",avgScore:61,attempts:14},
  {topic:"Glare",avgScore:74,attempts:14},
  {topic:"Optics",avgScore:68,attempts:14},
  {topic:"Design Standards",avgScore:75,attempts:14},
  {topic:"Exterior Lighting",avgScore:77,attempts:14},
  {topic:"Ballasts",avgScore:83,attempts:14},
  {topic:"Conservation",avgScore:69,attempts:14},
  {topic:"Sustainability",avgScore:71,attempts:14},
]

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
const ADMIN_CREDS={email:"admin@lightingmaster.com",pw:"Admin@2025!"}

function AdminLogin({onLogin}){
  const [email,setEmail]=useState("")
  const [pw,setPw]=useState("")
  const [show,setShow]=useState(false)
  const [err,setErr]=useState("")
  const [loading,setLoading]=useState(false)

  async function submit(){
    if(!email||!pw){setErr("Both fields required.");return}
    setLoading(true);setErr("")
    await new Promise(r=>setTimeout(r,600))
    setLoading(false)
    if(email.toLowerCase()===ADMIN_CREDS.email&&pw===ADMIN_CREDS.pw){
      onLogin()
    } else {
      setErr("Invalid credentials.")
    }
  }

  return(
    <div style={{minHeight:"100vh",background:AT.bg0,display:"flex",
      alignItems:"center",justifyContent:"center",fontFamily:AF.sans}}>
      <div style={{background:AT.bg3,border:`1px solid ${AT.border}`,
        borderRadius:12,padding:"40px 36px",width:"100%",maxWidth:380}}>
        <div style={{marginBottom:28}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
            <div style={{width:32,height:32,borderRadius:7,background:AT.accent,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontFamily:AF.display,fontWeight:800,fontSize:12,color:"#fff"}}>LC</div>
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
              placeholder="admin@lightingmaster.com" style={{width:"100%"}}/>
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

        <div style={{background:AT.bg4,border:`1px solid ${AT.border}`,borderRadius:6,
          padding:"8px 12px",marginBottom:16}}>
          <div style={amono({fontSize:9,letterSpacing:"0.14em",textTransform:"uppercase",
            color:AT.inkMute,marginBottom:4})}>Demo credentials</div>
          <div style={amono({fontSize:10,color:AT.inkSoft,cursor:"pointer"})}
            onClick={()=>{setEmail(ADMIN_CREDS.email);setPw(ADMIN_CREDS.pw)}}>
            {ADMIN_CREDS.email} / {ADMIN_CREDS.pw}
          </div>
          <div style={amono({fontSize:9,color:AT.inkMute,marginTop:3})}>Click to autofill</div>
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
function Overview({users,onNavigate}){
  const active=users.filter(u=>u.status==="active").length
  const flagged=users.filter(u=>u.flagged).length
  const pastDue=users.filter(u=>u.status==="past_due").length
  const totalRev=users.reduce((s,u)=>s+u.amount,0)
  const thisMonth=REVENUE_MONTHS[REVENUE_MONTHS.length-1]
  const lastMonth=REVENUE_MONTHS[REVENUE_MONTHS.length-2]
  const revTrend=Math.round(((thisMonth.mrr-lastMonth.mrr)/lastMonth.mrr)*100)

  const recentUsers=[...users].sort((a,b)=>new Date(b.joinDate)-new Date(a.joinDate)).slice(0,5)

  return(
    <div>
      <div style={{marginBottom:28}}>
        <div style={adisp({fontWeight:700,fontSize:22,color:AT.ink,marginBottom:4})}>Overview</div>
        <div style={amono({fontSize:11,color:AT.inkMute})}>
          {new Date().toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}
        </div>
      </div>

      {/* Alert bar */}
      {(flagged>0||pastDue>0)&&(
        <div style={{display:"flex",gap:10,marginBottom:24,flexWrap:"wrap"}}>
          {flagged>0&&(
            <div onClick={()=>onNavigate("flags")}
              style={{background:AT.redDim,border:`1px solid ${AT.red}`,borderRadius:8,
                padding:"10px 16px",display:"flex",alignItems:"center",gap:10,cursor:"pointer",
                flex:1,minWidth:220}}>
              <span style={{color:AT.red,fontSize:16}}>⚑</span>
              <div>
                <div style={amono({fontSize:11,color:AT.red,fontWeight:700})}>{flagged} flagged account{flagged>1?"s":""}</div>
                <div style={amono({fontSize:10,color:AT.red,opacity:0.7})}>Requires review</div>
              </div>
              <span style={{color:AT.red,marginLeft:"auto",fontSize:12}}>→</span>
            </div>
          )}
          {pastDue>0&&(
            <div onClick={()=>onNavigate("subscriptions")}
              style={{background:AT.amberDim,border:`1px solid ${AT.amber}`,borderRadius:8,
                padding:"10px 16px",display:"flex",alignItems:"center",gap:10,cursor:"pointer",
                flex:1,minWidth:220}}>
              <span style={{color:AT.amber,fontSize:16}}>⚠</span>
              <div>
                <div style={amono({fontSize:11,color:AT.amber,fontWeight:700})}>{pastDue} payment{pastDue>1?"s":""} past due</div>
                <div style={amono({fontSize:10,color:AT.amber,opacity:0.7})}>Stripe follow-up needed</div>
              </div>
              <span style={{color:AT.amber,marginLeft:"auto",fontSize:12}}>→</span>
            </div>
          )}
        </div>
      )}

      {/* Stat cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:28}}>
        <StatCard label="Total Revenue" value={fmtMoney(totalRev)} sub="all time" color={AT.green} trend={revTrend}/>
        <StatCard label="This Month" value={fmtMoney(thisMonth.mrr)} sub={`${thisMonth.users} new enrollments`} color={AT.accent}/>
        <StatCard label="Active Users" value={active} sub={`${users.length} total accounts`}/>
        <StatCard label="Flagged" value={flagged+pastDue} sub={`${flagged} flags · ${pastDue} past due`} color={flagged+pastDue>0?AT.red:AT.green}/>
      </div>

      {/* Plan breakdown */}
      <div style={{display:"grid",gridTemplateColumns:"1.4fr 1fr",gap:16,marginBottom:28}}>
        <div style={{background:AT.bg3,border:`1px solid ${AT.border}`,borderRadius:8,padding:"20px"}}>
          <SectionTitle>Plan distribution</SectionTitle>
          {PLANS.map(plan=>{
            const count=users.filter(u=>u.plan===plan).length
            const pct=Math.round((count/users.length)*100)
            return(
              <div key={plan} style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
                <div style={{width:80,flexShrink:0}}>
                  <PlanBadge plan={plan}/>
                </div>
                <MiniBar value={count} max={users.length} color={PLAN_COLORS[plan]}/>
                <div style={amono({fontSize:11,color:AT.inkSoft,width:40,textAlign:"right",flexShrink:0})}>
                  {count} <span style={{color:AT.inkMute}}>({pct}%)</span>
                </div>
              </div>
            )
          })}
        </div>

        <div style={{background:AT.bg3,border:`1px solid ${AT.border}`,borderRadius:8,padding:"20px"}}>
          <SectionTitle>Status breakdown</SectionTitle>
          {["active","free","past_due","canceled","trialing"].map(s=>{
            const count=users.filter(u=>u.status===s).length
            if(count===0) return null
            return(
              <div key={s} style={{display:"flex",alignItems:"center",
                justifyContent:"space-between",padding:"6px 0",
                borderBottom:`1px solid ${AT.border}`}}>
                <StatusBadge status={s}/>
                <div style={amono({fontSize:12,color:AT.inkSoft})}>{count}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent signups */}
      <div style={{background:AT.bg3,border:`1px solid ${AT.border}`,borderRadius:8,padding:"20px"}}>
        <SectionTitle>
          Recent signups
          <Btn small onClick={()=>onNavigate("users")}>View all →</Btn>
        </SectionTitle>
        <TableHeader cols={[
          {label:"User",w:"2fr"},{label:"Plan",w:"100px"},
          {label:"Status",w:"100px"},{label:"Joined",w:"120px"},{label:"",w:"60px"}
        ]}/>
        {recentUsers.map(u=>(
          <div key={u.id} style={{display:"grid",gridTemplateColumns:"2fr 100px 100px 120px 60px",
            gap:0,padding:"10px 16px",borderBottom:`1px solid ${AT.border}`,
            transition:"background 0.1s"}}
            onMouseEnter={e=>e.currentTarget.style.background=AT.bg4}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <div>
              <div style={asans({fontSize:13,color:AT.ink,fontWeight:500})}>
                {u.firstName} {u.lastName}
              </div>
              <div style={amono({fontSize:10,color:AT.inkMute})}>{u.email}</div>
            </div>
            <div style={{paddingTop:2}}><PlanBadge plan={u.plan}/></div>
            <div style={{paddingTop:2}}><StatusBadge status={u.status}/></div>
            <div style={amono({fontSize:11,color:AT.inkMute,paddingTop:4})}>{fmtDate(u.joinDate)}</div>
            <div style={{paddingTop:2}}>
              {u.flagged&&<span style={{color:AT.red,fontSize:12}}>⚑</span>}
            </div>
          </div>
        ))}
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
      return !q||u.firstName.toLowerCase().includes(q)||
        u.lastName.toLowerCase().includes(q)||
        u.email.toLowerCase().includes(q)||
        u.company.toLowerCase().includes(q)||
        u.state.toLowerCase().includes(q)
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
                  {u.firstName[0]}{u.lastName[0]}
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
            {user.firstName[0]}{user.lastName[0]}
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
            ["Company",user.company],
            ["State",user.state],
            ["Joined",fmtDate(user.joinDate)],
            ["Last active",fmtDate(user.lastActive)],
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
          {Array.from({length:12},(_,i)=>{
            const done=i<user.modulesCompleted
            return(
              <div key={i} style={{background:done?AT.green+"20":AT.bg4,
                border:`1px solid ${done?AT.green+"40":AT.border}`,
                borderRadius:4,padding:"6px",textAlign:"center"}}>
                <div style={amono({fontSize:9,color:done?AT.green:AT.inkMute})}>M{String(i+1).padStart(2,"0")}</div>
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
function Revenue(){
  const totalAll=REVENUE_MONTHS.reduce((s,m)=>s+m.mrr,0)
  const thisM=REVENUE_MONTHS[REVENUE_MONTHS.length-1]
  const maxMrr=Math.max(...REVENUE_MONTHS.map(m=>m.mrr))

  return(
    <div>
      <div style={adisp({fontWeight:700,fontSize:22,color:AT.ink,marginBottom:24})}>Revenue</div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:28}}>
        <StatCard label="All-time revenue" value={fmtMoney(totalAll)} color={AT.green}/>
        <StatCard label="This month" value={fmtMoney(thisM.mrr)} sub={`${thisM.users} enrollments`} color={AT.accent}/>
        <StatCard label="Peak month" value={fmtMoney(maxMrr)} sub="Oct 2024"/>
        <StatCard label="Avg per user" value={fmtMoney(Math.round(totalAll/REVENUE_MONTHS.reduce((s,m)=>s+m.users,0)))}/>
      </div>

      {/* Revenue chart */}
      <div style={{background:AT.bg3,border:`1px solid ${AT.border}`,borderRadius:8,padding:"24px",marginBottom:20}}>
        <SectionTitle>Monthly revenue — 12 months</SectionTitle>
        <div style={{display:"flex",alignItems:"flex-end",gap:6,height:160,marginBottom:8}}>
          {REVENUE_MONTHS.map((mo,i)=>{
            const h=Math.round((mo.mrr/maxMrr)*140)
            const isLast=i===REVENUE_MONTHS.length-1
            return(
              <div key={mo.month} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                <div style={amono({fontSize:9,color:AT.inkMute})}>{fmtMoney(mo.mrr)}</div>
                <div style={{width:"100%",height:h,background:isLast?AT.accent:
                  mo.month.includes("Oct")?AT.amber:AT.blue+"80",
                  borderRadius:"3px 3px 0 0",position:"relative",
                  transition:"height 0.4s"}}/>
              </div>
            )
          })}
        </div>
        <div style={{display:"flex",gap:6}}>
          {REVENUE_MONTHS.map(mo=>(
            <div key={mo.month} style={{flex:1,textAlign:"center"}}>
              <div style={amono({fontSize:8,color:AT.inkMute})}>{mo.month.split(" ")[0]}</div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:16,marginTop:12}}>
          {[["Current month",AT.accent],["Oct (Last-Minute)",AT.amber],["Other months",AT.blue+"80"]].map(([label,color])=>(
            <div key={label} style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{width:10,height:10,borderRadius:2,background:color}}/>
              <span style={amono({fontSize:9,color:AT.inkMute})}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tier breakdown */}
      <div style={{background:AT.bg3,border:`1px solid ${AT.border}`,borderRadius:8,padding:"24px"}}>
        <SectionTitle>Revenue by tier</SectionTitle>
        <TableHeader cols={[{label:"Month",w:"120px"},{label:"Test Engine",w:"1fr"},
          {label:"Full Course",w:"1fr"},{label:"Course+Exam",w:"1fr"},{label:"Total",w:"100px",right:true},{label:"Users",w:"70px",right:true}]}/>
        {[...REVENUE_MONTHS].reverse().map((mo,i)=>(
          <div key={mo.month} style={{display:"grid",
            gridTemplateColumns:"120px 1fr 1fr 1fr 100px 70px",
            gap:0,padding:"8px 16px",
            borderBottom:i<REVENUE_MONTHS.length-1?`1px solid ${AT.border}`:"none",
            transition:"background 0.1s"}}
            onMouseEnter={e=>e.currentTarget.style.background=AT.bg4}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <div style={amono({fontSize:11,color:AT.ink})}>{mo.month}</div>
            <div style={amono({fontSize:11,color:mo.t1>0?AT.blue:AT.inkMute})}>{mo.t1>0?fmtMoney(mo.t1):"—"}</div>
            <div style={amono({fontSize:11,color:mo.t2>0?AT.green:AT.inkMute})}>{mo.t2>0?fmtMoney(mo.t2):"—"}</div>
            <div style={amono({fontSize:11,color:mo.t3>0?AT.purple:AT.inkMute})}>{mo.t3>0?fmtMoney(mo.t3):"—"}</div>
            <div style={amono({fontSize:12,color:AT.accent,textAlign:"right",fontWeight:700})}>{fmtMoney(mo.mrr)}</div>
            <div style={amono({fontSize:11,color:AT.inkMute,textAlign:"right"})}>{mo.users}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── CONTENT & PROGRESS ────────────────────────── */
function ContentView(){
  const maxComp=Math.max(...MODULE_STATS.map(m=>m.completions))
  return(
    <div>
      <div style={adisp({fontWeight:700,fontSize:22,color:AT.ink,marginBottom:24})}>Content & Progress</div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:28}}>
        <StatCard label="Avg completion" value={`${Math.round(MODULE_STATS.reduce((s,m)=>s+m.completions,0)/MODULE_STATS.length/SEED_USERS.length*100)}%`}/>
        <StatCard label="Full completions" value={SEED_USERS.filter(u=>u.progress===100).length} sub="completed all 12 modules" color={AT.green}/>
        <StatCard label="Exam pass rate" value={`${Math.round(SEED_USERS.filter(u=>u.examBestScore&&u.examBestScore>=85).length/SEED_USERS.filter(u=>u.examAttempts>0).length*100)}%`} sub="≥85% accuracy" color={AT.purple}/>
        <StatCard label="Avg exam score" value={`${Math.round(SEED_USERS.filter(u=>u.examBestScore).reduce((s,u)=>s+u.examBestScore,0)/SEED_USERS.filter(u=>u.examBestScore).length)}%`}/>
      </div>

      {/* Module funnel */}
      <div style={{background:AT.bg3,border:`1px solid ${AT.border}`,borderRadius:8,padding:"24px",marginBottom:20}}>
        <SectionTitle>Module completion funnel</SectionTitle>
        <TableHeader cols={[{label:"Module",w:"2fr"},{label:"Completions",w:"120px"},
          {label:"Drop-offs",w:"100px"},{label:"Avg time (min)",w:"120px"},{label:"",w:"1fr"}]}/>
        {MODULE_STATS.map((mod,i)=>(
          <div key={mod.n} style={{display:"grid",gridTemplateColumns:"2fr 120px 100px 120px 1fr",
            gap:0,padding:"10px 16px",borderBottom:i<MODULE_STATS.length-1?`1px solid ${AT.border}`:"none"}}>
            <div><span style={amono({fontSize:11,color:AT.accent,marginRight:10})}>M{mod.n}</span><span style={asans({fontSize:12,color:AT.ink})}>{mod.title}</span></div>
            <div style={{display:"flex",alignItems:"center",gap:8,paddingTop:2}}>
              <MiniBar value={mod.completions} max={maxComp} color={AT.green}/>
              <span style={amono({fontSize:11,color:AT.green,width:20,flexShrink:0})}>{mod.completions}</span>
            </div>
            <div style={amono({fontSize:12,color:mod.dropoffs>0?AT.red:AT.inkMute,paddingTop:4})}>
              {mod.dropoffs>0?`-${mod.dropoffs}`:"—"}
            </div>
            <div style={amono({fontSize:12,color:AT.inkSoft,paddingTop:4})}>{mod.avgTime}m</div>
            <div/>
          </div>
        ))}
      </div>

      {/* Exam topic breakdown */}
      <div style={{background:AT.bg3,border:`1px solid ${AT.border}`,borderRadius:8,padding:"24px"}}>
        <SectionTitle>
          Exam topic accuracy
          <span style={amono({fontSize:10,color:AT.inkMute})}>Average across all attempts</span>
        </SectionTitle>
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:1}}>
          {EXAM_TOPIC_STATS.sort((a,b)=>a.avgScore-b.avgScore).map((t,i)=>(
            <div key={t.topic} style={{display:"flex",alignItems:"center",gap:12,
              padding:"10px 16px",background:i%2===0?AT.bg3:AT.bg4}}>
              <div style={{width:140,flexShrink:0}}>
                <span style={asans({fontSize:12,color:AT.ink})}>{t.topic}</span>
              </div>
              <MiniBar value={t.avgScore} max={100}
                color={t.avgScore>=80?AT.green:t.avgScore>=70?AT.amber:AT.red}/>
              <div style={amono({fontSize:12,
                color:t.avgScore>=80?AT.green:t.avgScore>=70?AT.amber:AT.red,
                width:36,textAlign:"right",flexShrink:0})}>
                {t.avgScore}%
              </div>
            </div>
          ))}
        </div>
        <div style={{marginTop:12,padding:"10px 16px",background:AT.redDim,
          border:`1px solid ${AT.red}20`,borderRadius:6}}>
          <span style={amono({fontSize:10,color:AT.red})}>⚠ Weak topics (below 70%): </span>
          <span style={amono({fontSize:10,color:AT.inkSoft})}>
            {EXAM_TOPIC_STATS.filter(t=>t.avgScore<70).map(t=>t.topic).join(", ")}
          </span>
          <span style={amono({fontSize:10,color:AT.inkMute})}> — consider adding more content</span>
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
function TeamsView(){
  const [teams,setTeams]=useState(SEED_TEAMS)
  const [selected,setSelected]=useState(null)
  const [inviteEmail,setInviteEmail]=useState("")
  const [inviteSent,setInviteSent]=useState(false)

  const totalTeamRev=teams.reduce((s,t)=>s+t.amount,0)
  const totalSeats=teams.reduce((s,t)=>s+t.seats,0)
  const usedSeats=teams.reduce((s,t)=>s+t.members.filter(m=>m.status==="active").length,0)
  const pastDueTeams=teams.filter(t=>t.status==="past_due")

  function sendInvite(teamId){
    if(!inviteEmail.includes("@"))return
    const updated=teams.map(t=>{
      if(t.id!==teamId)return t
      const empties=t.members.filter(m=>m.status==="empty")
      if(!empties.length)return t
      const newMember={id:"ni_"+Date.now(),name:"Invite pending",email:inviteEmail,progress:0,modulesCompleted:0,examBestScore:null,lastActive:null,status:"invited"}
      return{...t,members:t.members.map((m,i)=>m.id===empties[0].id?newMember:m)}
    })
    setTeams(updated)
    setSelected(updated.find(t=>t.id===teamId)||null)
    setInviteEmail("");setInviteSent(true);setTimeout(()=>setInviteSent(false),2500)
  }

  function adjustSeats(teamId,delta){
    setTeams(prev=>prev.map(t=>{
      if(t.id!==teamId)return t
      const min=t.members.filter(m=>m.status!=="empty").length
      const newSeats=Math.max(min,t.seats+delta)
      const newAmt=newSeats<=5?newSeats*360:newSeats<=10?newSeats*280:t.amount
      return{...t,seats:newSeats,amount:newAmt}
    }))
    if(selected?.id===teamId)setSelected(prev=>{
      const min=prev.members.filter(m=>m.status!=="empty").length
      return{...prev,seats:Math.max(min,prev.seats+delta)}
    })
  }

  if(selected){
    const activeM=selected.members.filter(m=>m.status==="active")
    const avgP=activeM.length?Math.round(activeM.reduce((s,m)=>s+m.progress,0)/activeM.length):0
    const topScore=activeM.filter(m=>m.examBestScore).length?Math.max(...activeM.filter(m=>m.examBestScore).map(m=>m.examBestScore)):null

    return(<div>
      <button onClick={()=>{setSelected(null);setInviteSent(false)}} style={{background:"none",border:"none",color:AT.inkSoft,cursor:"pointer",fontFamily:AF.mono,fontSize:11,marginBottom:18,display:"flex",alignItems:"center",gap:5}}>← Back to teams</button>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:22,flexWrap:"wrap",gap:14}}>
        <div>
          <div style={amono({fontSize:9,letterSpacing:"0.2em",textTransform:"uppercase",color:AT.accent,marginBottom:6})}>Team detail</div>
          <div style={adisp({fontWeight:700,fontSize:22,color:AT.ink,marginBottom:4})}>{selected.name}</div>
          <div style={amono({fontSize:11,color:AT.inkMute})}>{selected.adminName} · {selected.company} · {selected.state}</div>
        </div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          <div style={{background:AT.bg3,border:`1px solid ${AT.border}`,borderRadius:8,padding:"12px 16px",textAlign:"center"}}>
            <div style={amono({fontSize:9,color:AT.inkMute,marginBottom:6})}>SEATS</div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <button onClick={()=>adjustSeats(selected.id,-1)} style={{background:AT.bg4,border:`1px solid ${AT.border}`,borderRadius:4,width:22,height:22,cursor:"pointer",color:AT.inkSoft,fontFamily:AF.mono,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
              <span style={adisp({fontWeight:700,fontSize:20,color:AT.ink})}>{selected.seats}</span>
              <button onClick={()=>adjustSeats(selected.id,1)} style={{background:AT.bg4,border:`1px solid ${AT.border}`,borderRadius:4,width:22,height:22,cursor:"pointer",color:AT.inkSoft,fontFamily:AF.mono,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
            </div>
            <div style={amono({fontSize:9,color:AT.inkMute,marginTop:3})}>{activeM.length} active</div>
          </div>
          <div style={{background:selected.status==="active"?AT.greenDim:AT.amberDim,border:`1px solid ${selected.status==="active"?AT.green:AT.amber}`,borderRadius:8,padding:"12px 16px",textAlign:"center"}}>
            <div style={amono({fontSize:9,color:AT.inkMute,marginBottom:4})}>REVENUE</div>
            <div style={adisp({fontWeight:700,fontSize:20,color:selected.status==="active"?AT.green:AT.amber,marginBottom:4})}>{fmtMoney(selected.amount)}</div>
            <StatusBadge status={selected.status}/>
          </div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:18}}>
        {[["Active members",activeM.length,`of ${selected.seats} seats`],["Avg progress",`${avgP}%`,"across members"],["Top exam score",topScore?`${topScore}%`:"—","best result"],["Access expires","Dec 31",`${new Date().getFullYear()}`]].map(([l,v,s])=>(<div key={l} style={{background:AT.bg3,border:`1px solid ${AT.border}`,borderRadius:8,padding:"13px 15px"}}><div style={amono({fontSize:8,letterSpacing:"0.18em",textTransform:"uppercase",color:AT.inkMute,marginBottom:6})}>{l}</div><div style={adisp({fontWeight:700,fontSize:20,color:AT.ink,marginBottom:2})}>{v}</div><div style={amono({fontSize:10,color:AT.inkMute})}>{s}</div></div>))}
      </div>
      <div style={{background:AT.bg3,border:`1px solid ${AT.border}`,borderRadius:8,overflow:"hidden",marginBottom:14}}>
        <div style={{padding:"13px 16px",borderBottom:`1px solid ${AT.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={adisp({fontWeight:700,fontSize:14,color:AT.ink})}>Members</div>
          <div style={amono({fontSize:10,color:AT.inkMute})}>{activeM.length} active · {selected.members.filter(m=>m.status==="invited").length} invited · {selected.members.filter(m=>m.status==="empty").length} available</div>
        </div>
        <TableHeader cols={[{label:"Member",w:"2fr"},{label:"Status",w:"90px"},{label:"Modules",w:"80px"},{label:"Exam",w:"80px"},{label:"Progress",w:"1fr"},{label:"Last active",w:"100px"},{label:"",w:"80px"}]}/>
        {selected.members.map((m,i)=>(<div key={m.id} style={{display:"grid",gridTemplateColumns:"2fr 90px 80px 80px 1fr 100px 80px",padding:"10px 16px",borderBottom:i<selected.members.length-1?`1px solid ${AT.border}`:"none",opacity:m.status==="empty"?0.3:1}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:24,height:24,borderRadius:"50%",background:m.status==="active"?AT.accent+"25":AT.border,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:AF.display,fontWeight:700,fontSize:8,color:AT.accent,flexShrink:0}}>{m.name.split(" ").map(w=>w[0]).join("").slice(0,2)}</div>
            <div><div style={asans({fontSize:12,color:AT.ink,fontWeight:500})}>{m.name}</div>{m.email&&<div style={amono({fontSize:9,color:AT.inkMute})}>{m.email}</div>}</div>
          </div>
          <div style={{paddingTop:3}}>{m.status==="active"&&<Badge label="Active" color={AT.green}/>}{m.status==="invited"&&<Badge label="Invited" color={AT.amber}/>}{m.status==="empty"&&<span style={amono({fontSize:10,color:AT.inkMute})}>—</span>}</div>
          <div style={amono({fontSize:11,color:AT.inkSoft,paddingTop:3})}>{m.status==="active"?`${m.modulesCompleted}/12`:"—"}</div>
          <div style={amono({fontSize:11,color:m.examBestScore>=85?AT.green:m.examBestScore?AT.amber:AT.inkMute,paddingTop:3})}>{m.examBestScore?`${m.examBestScore}%`:"—"}</div>
          <div style={{paddingTop:7,paddingRight:14}}>{m.status==="active"?(<div style={{display:"flex",alignItems:"center",gap:6}}><MiniBar value={m.progress} max={100} color={m.progress===100?AT.green:AT.accent}/><span style={amono({fontSize:9,color:AT.inkMute,flexShrink:0,width:28,textAlign:"right"})}>{m.progress}%</span></div>):<span style={amono({fontSize:11,color:AT.inkMute})}>—</span>}</div>
          <div style={amono({fontSize:10,color:AT.inkMute,paddingTop:3})}>{m.lastActive?`${Math.round((new Date()-new Date(m.lastActive))/(1000*60*60*24))}d ago`:"—"}</div>
          <div style={{paddingTop:2}}>{m.status==="active"&&<Btn small variant="danger" onClick={()=>alert(`Remove ${m.name}`)}>Remove</Btn>}{m.status==="invited"&&<Btn small onClick={()=>alert(`Resend to ${m.email}`)}>Resend</Btn>}</div>
        </div>))}
      </div>
      {selected.members.some(m=>m.status==="empty")&&(<div style={{background:AT.bg3,border:`1px solid ${AT.border}`,borderRadius:8,padding:"16px"}}>
        <div style={adisp({fontWeight:600,fontSize:13,color:AT.ink,marginBottom:10})}>Invite a member ({selected.members.filter(m=>m.status==="empty").length} seat{selected.members.filter(m=>m.status==="empty").length!==1?"s":""} available)</div>
        {inviteSent&&<div style={{background:AT.greenDim,border:`1px solid ${AT.green}`,borderRadius:6,padding:"8px 12px",fontFamily:AF.mono,fontSize:11,color:AT.green,marginBottom:10}}>✓ Invite sent</div>}
        <div style={{display:"flex",gap:8}}>
          <input type="email" value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} placeholder="colleague@firm.com" onKeyDown={e=>e.key==="Enter"&&sendInvite(selected.id)} style={{flex:1,background:AT.bg4,border:`1px solid ${AT.border}`,borderRadius:6,padding:"8px 12px",fontFamily:AF.mono,fontSize:12,color:AT.ink,outline:"none"}} onFocus={e=>e.target.style.borderColor=AT.accent} onBlur={e=>e.target.style.borderColor=AT.border}/>
          <Btn variant="primary" onClick={()=>sendInvite(selected.id)}>Send invite</Btn>
        </div>
      </div>)}
    </div>)
  }

  return(<div>
    <div style={adisp({fontWeight:700,fontSize:22,color:AT.ink,marginBottom:22})}>Teams</div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:20}}>
      <StatCard label="Active teams" value={teams.filter(t=>t.status==="active").length} color={AT.green}/>
      <StatCard label="Total seats" value={totalSeats} sub={`${usedSeats} in use`}/>
      <StatCard label="Team revenue" value={fmtMoney(totalTeamRev)} color={AT.purple}/>
      <StatCard label="Past due" value={pastDueTeams.length} color={pastDueTeams.length>0?AT.amber:AT.green}/>
    </div>
    {pastDueTeams.length>0&&<div style={{background:AT.amberDim,border:`1px solid ${AT.amber}`,borderRadius:8,padding:"11px 14px",marginBottom:16,display:"flex",alignItems:"center",gap:8}}><span style={{color:AT.amber}}>⚠</span><span style={amono({fontSize:11,color:AT.amber})}>{pastDueTeams.length} team{pastDueTeams.length>1?"s":""} with past due payments</span></div>}
    <div style={{background:AT.bg3,border:`1px solid ${AT.border}`,borderRadius:8,overflow:"hidden"}}>
      <TableHeader cols={[{label:"Team",w:"2fr"},{label:"Admin",w:"150px"},{label:"Seats",w:"70px"},{label:"Active",w:"70px"},{label:"Avg progress",w:"1fr"},{label:"Revenue",w:"95px",right:true},{label:"Status",w:"95px"},{label:"",w:"40px"}]}/>
      {teams.map((team,i)=>{
        const am=team.members.filter(m=>m.status==="active")
        const ap=am.length?Math.round(am.reduce((s,m)=>s+m.progress,0)/am.length):0
        return(<div key={team.id} onClick={()=>setSelected(team)} style={{display:"grid",gridTemplateColumns:"2fr 150px 70px 70px 1fr 95px 95px 40px",padding:"11px 16px",borderBottom:i<teams.length-1?`1px solid ${AT.border}`:"none",cursor:"pointer",transition:"background 0.1s"}} onMouseEnter={e=>e.currentTarget.style.background=AT.bg4} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
          <div><div style={asans({fontSize:13,color:AT.ink,fontWeight:500})}>{team.name}</div><div style={amono({fontSize:9,color:AT.inkMute})}>{team.company} · {team.state}</div></div>
          <div style={amono({fontSize:11,color:AT.inkSoft,paddingTop:3})}>{team.adminName}</div>
          <div style={amono({fontSize:12,color:AT.inkSoft,paddingTop:3})}>{team.seats}</div>
          <div style={amono({fontSize:12,color:AT.green,paddingTop:3})}>{am.length}</div>
          <div style={{paddingTop:7,paddingRight:14}}><div style={{display:"flex",alignItems:"center",gap:7}}><MiniBar value={ap} max={100} color={ap>70?AT.green:AT.accent}/><span style={amono({fontSize:9,color:AT.inkMute,flexShrink:0,width:28,textAlign:"right"})}>{ap}%</span></div></div>
          <div style={amono({fontSize:12,color:AT.purple,textAlign:"right",paddingTop:3})}>{fmtMoney(team.amount)}</div>
          <div style={{paddingTop:3}}><StatusBadge status={team.status}/></div>
          <div style={{paddingTop:3,textAlign:"center",color:AT.inkMute,fontSize:12}}>→</div>
        </div>)
      })}
    </div>
  </div>)
}

/* ── REPORTS ───────────────────────────────────── */
function Reports({users}){
  const byState={}
  users.forEach(u=>{byState[u.state]=(byState[u.state]||0)+1})
  const stateList=Object.entries(byState).sort((a,b)=>b[1]-a[1])
  const byCompany={}
  users.forEach(u=>{byCompany[u.company]=(byCompany[u.company]||0)+1})
  const companyList=Object.entries(byCompany).sort((a,b)=>b[1]-a[1]).slice(0,8)
  const conversionRate=Math.round(users.filter(u=>u.plan!=="free").length/users.length*100)

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
            {season:"Oct",label:"Last-Minute",users:REVENUE_MONTHS.filter(m=>m.month.includes("Oct")).reduce((s,m)=>s+m.users,0),color:AT.amber,note:"Test Engine spike"},
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
  const [adminPw,setAdminPw]=useState("")
  const [saved,setSaved]=useState(false)
  return(
    <div>
      <div style={adisp({fontWeight:700,fontSize:22,color:AT.ink,marginBottom:24})}>Settings</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div style={{background:AT.bg3,border:`1px solid ${AT.border}`,borderRadius:8,padding:"24px"}}>
          <div style={amono({fontSize:9,letterSpacing:"0.18em",textTransform:"uppercase",color:AT.inkMute,marginBottom:16})}>Admin credentials</div>
          <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:16}}>
            <div>
              <div style={amono({fontSize:10,color:AT.inkMute,marginBottom:6})}>Admin email</div>
              <Input value={ADMIN_CREDS.email} style={{width:"100%",opacity:0.6}} onChange={()=>{}}/>
            </div>
            <div>
              <div style={amono({fontSize:10,color:AT.inkMute,marginBottom:6})}>New password</div>
              <Input value={adminPw} onChange={e=>setAdminPw(e.target.value)}
                placeholder="Enter new password" style={{width:"100%"}}/>
            </div>
          </div>
          <Btn variant="primary" onClick={()=>{setSaved(true);setTimeout(()=>setSaved(false),2000)}}>
            {saved?"✓ Saved":"Update credentials"}
          </Btn>
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

function AdminSidebar({route,setRoute,flagCount,onSignOut,onBack=()=>{}}){
  return(
    <aside style={{background:AT.bg1,width:220,flexShrink:0,display:"flex",
      flexDirection:"column",borderRight:`1px solid ${AT.border}`,
      position:"sticky",top:0,height:"100vh",overflowY:"auto"}}>
      <div style={{padding:"20px 16px 16px",borderBottom:`1px solid ${AT.border}`}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
          <div style={{width:26,height:26,borderRadius:6,background:AT.accent,
            display:"flex",alignItems:"center",justifyContent:"center",
            fontFamily:AF.display,fontWeight:800,fontSize:10,color:"#fff"}}>LC</div>
          <div style={adisp({fontWeight:700,fontSize:13,color:AT.ink})}>Admin Console</div>
        </div>
        <div style={amono({fontSize:8,letterSpacing:"0.16em",textTransform:"uppercase",
          color:AT.inkMute})}>Lighting Master · Luxartmedia</div>
      </div>

      <nav style={{padding:"8px 0",flex:1}}>
        {NAV.map(item=>{
          const active=route===item.id||(route==="user-detail"&&item.id==="users")
          const isFlag=item.id==="flags"
          return(
            <button key={item.id} onClick={()=>setRoute(item.id)}
              style={{display:"flex",alignItems:"center",gap:10,width:"100%",
                padding:"9px 16px",background:active?"rgba(184,88,53,0.12)":"none",
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
        <div style={amono({fontSize:10,color:AT.inkSoft,marginBottom:10})}>{ADMIN_CREDS.email}</div>
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
  const [route, setRoute] = useState("overview")
  const [users, setUsers] = useState(SEED_USERS)
  const [selectedUser, setSelectedUser] = useState(null)

  const flagCount = users.filter(u=>u.flagged||u.status==="past_due").length

  function handleSelectUser(user){
    setSelectedUser(user)
    setRoute("user-detail")
  }
  function handleUpdateUser(updated){
    setUsers(prev=>prev.map(u=>u.id===updated.id?updated:u))
    setSelectedUser(updated)
  }
  function handleSignOut(){
    setAuthed(false)
    setRoute("overview")
    setSelectedUser(null)
  }
  function navigate(r){
    setRoute(r)
    setSelectedUser(null)
  }

  if(!authed) return <AdminLogin onLogin={()=>setAuthed(true)}/>

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
      <AdminSidebar route={route} setRoute={navigate} flagCount={flagCount} onSignOut={handleSignOut} onBack={onBack}/>
      <main style={{flex:1,padding:"32px 36px",overflowY:"auto",minHeight:"100vh"}}>
        {route==="overview"     && <Overview users={users} onNavigate={navigate}/>}
        {route==="users"        && <UsersView users={users} setUsers={setUsers} onSelectUser={handleSelectUser}/>}
        {route==="user-detail"  && selectedUser && <UserDetail user={selectedUser} onBack={()=>navigate("users")} onUpdate={handleUpdateUser}/>}
        {route==="subscriptions"&& <Subscriptions users={users}/>}
        {route==="revenue"      && <Revenue/>}
        {route==="content"      && <ContentView/>}
        {route==="flags"        && <SupportFlags users={users} setUsers={setUsers} onSelectUser={handleSelectUser}/>}
        {route==="teams"        && <TeamsView/>}
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
