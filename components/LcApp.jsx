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
"1.1":`<svg viewBox="0 0 520 120" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto"><defs><linearGradient id="sp1" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#7B00FF"/><stop offset="20%" stop-color="#0044FF"/><stop offset="40%" stop-color="#00AAFF"/><stop offset="58%" stop-color="#00EE44"/><stop offset="74%" stop-color="#AAFF00"/><stop offset="86%" stop-color="#FFAA00"/><stop offset="100%" stop-color="#FF2200"/></linearGradient></defs><rect x="8" y="28" width="60" height="16" rx="3" fill="#f0ece4"/><text x="38" y="22" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace">RADIO/UV</text><rect x="68" y="20" width="380" height="30" rx="4" fill="url(#sp1)"/><text x="258" y="14" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".08em">VISIBLE SPECTRUM  380–780 nm</text><rect x="448" y="28" width="60" height="16" rx="3" fill="#FF4400" opacity=".18"/><text x="478" y="22" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace">INFRARED</text><line x1="68" y1="50" x2="68" y2="60" stroke="#cfc3b0" stroke-width=".7"/><text x="68" y="69" text-anchor="middle" font-size="8" fill="#352c22">380 nm</text><text x="68" y="79" text-anchor="middle" font-size="9" fill="#7B00FF">Violet</text><line x1="168" y1="50" x2="168" y2="60" stroke="#cfc3b0" stroke-width=".7"/><text x="168" y="69" text-anchor="middle" font-size="8" fill="#352c22">480 nm</text><text x="168" y="79" text-anchor="middle" font-size="9" fill="#0088FF">ipRGC</text><line x1="232" y1="50" x2="232" y2="60" stroke="#cfc3b0" stroke-width=".7"/><text x="232" y="69" text-anchor="middle" font-size="8" fill="#352c22">507 nm</text><text x="232" y="79" text-anchor="middle" font-size="9" fill="#00AA44">Rod peak</text><line x1="316" y1="50" x2="316" y2="60" stroke="#cfc3b0" stroke-width=".7"/><text x="316" y="69" text-anchor="middle" font-size="8" fill="#352c22">555 nm</text><text x="316" y="79" text-anchor="middle" font-size="9" fill="#88AA00">Cone peak</text><line x1="448" y1="50" x2="448" y2="60" stroke="#cfc3b0" stroke-width=".7"/><text x="448" y="69" text-anchor="middle" font-size="8" fill="#352c22">780 nm</text><text x="258" y="104" text-anchor="middle" font-size="10" fill="#16120e" font-weight="500">Wavelength determines colour · SPD is the fingerprint of every light source</text><text x="258" y="116" text-anchor="middle" font-size="9" fill="#8a7a6a">CCT · CRI · TM-30 · Melanopic lux — all derived from the SPD</text></svg>`,
"1.2":`<svg viewBox="0 0 520 130" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto"><defs><marker id="ar1" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3z" fill="#8a7a6a"/></marker></defs><rect x="8" y="18" width="108" height="66" rx="5" fill="#fff5ee" stroke="#b85835" stroke-width=".8"/><text x="62" y="36" text-anchor="middle" font-size="10" fill="#b85835" font-family="monospace" font-weight="500">Φ FLUX</text><text x="62" y="49" text-anchor="middle" font-size="9" fill="#16120e">Lumens (lm)</text><text x="62" y="62" text-anchor="middle" font-size="8" fill="#8a7a6a">Total output</text><text x="62" y="74" text-anchor="middle" font-size="8" fill="#8a7a6a">all directions</text><line x1="116" y1="51" x2="134" y2="51" stroke="#8a7a6a" stroke-width="1" marker-end="url(#ar1)"/><rect x="136" y="18" width="108" height="66" rx="5" fill="#e8f5ee" stroke="#2a6048" stroke-width=".8"/><text x="190" y="36" text-anchor="middle" font-size="10" fill="#2a6048" font-family="monospace" font-weight="500">I INTENSITY</text><text x="190" y="49" text-anchor="middle" font-size="9" fill="#16120e">Candelas (cd)</text><text x="190" y="62" text-anchor="middle" font-size="8" fill="#8a7a6a">Directional</text><text x="190" y="74" text-anchor="middle" font-size="8" fill="#8a7a6a">beam intensity</text><line x1="244" y1="51" x2="262" y2="51" stroke="#8a7a6a" stroke-width="1" marker-end="url(#ar1)"/><rect x="264" y="18" width="108" height="66" rx="5" fill="#e8eef8" stroke="#1857a0" stroke-width=".8"/><text x="318" y="36" text-anchor="middle" font-size="10" fill="#1857a0" font-family="monospace" font-weight="500">E ILLUM.</text><text x="318" y="49" text-anchor="middle" font-size="9" fill="#16120e">Lux / fc</text><text x="318" y="62" text-anchor="middle" font-size="8" fill="#8a7a6a">Flux per</text><text x="318" y="74" text-anchor="middle" font-size="8" fill="#8a7a6a">unit area</text><line x1="372" y1="51" x2="390" y2="51" stroke="#8a7a6a" stroke-width="1" marker-end="url(#ar1)"/><rect x="392" y="18" width="120" height="66" rx="5" fill="#f3eef8" stroke="#7a3a9a" stroke-width=".8"/><text x="452" y="36" text-anchor="middle" font-size="10" fill="#7a3a9a" font-family="monospace" font-weight="500">L LUMIN.</text><text x="452" y="49" text-anchor="middle" font-size="9" fill="#16120e">cd / m²</text><text x="452" y="62" text-anchor="middle" font-size="8" fill="#7a3a9a">Perceived</text><text x="452" y="74" text-anchor="middle" font-size="8" fill="#7a3a9a">causes glare</text><text x="62" y="100" text-anchor="middle" font-size="8" fill="#8a7a6a">Integ. sphere</text><text x="190" y="100" text-anchor="middle" font-size="8" fill="#8a7a6a">Goniophotometer</text><text x="318" y="100" text-anchor="middle" font-size="8" fill="#8a7a6a">Illum. meter</text><text x="452" y="100" text-anchor="middle" font-size="8" fill="#8a7a6a">Luminance cam.</text><text x="260" y="120" text-anchor="middle" font-size="10" fill="#16120e" font-weight="500">E = I / d²  ·  double distance → ¼ illuminance  ·  1 fc = 10.76 lux</text></svg>`,
"1.3":`<svg viewBox="0 0 520 140" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto"><line x1="36" y1="14" x2="36" y2="112" stroke="#e4d9ca" stroke-width=".8"/><line x1="36" y1="112" x2="500" y2="112" stroke="#e4d9ca" stroke-width=".8"/><text x="32" y="18" text-anchor="end" font-size="9" fill="#8a7a6a">100%</text><text x="32" y="63" text-anchor="end" font-size="9" fill="#8a7a6a">50%</text><polyline points="55,110 95,107 136,95 162,66 182,38 200,20 218,38 240,66 272,95 314,107 365,110" fill="none" stroke="#1857a0" stroke-width="1.5" stroke-dasharray="5,3" opacity=".75"/><polyline points="66,110 106,106 148,93 174,62 196,35 214,18 232,35 256,62 290,93 336,106 384,110" fill="none" stroke="#2a6048" stroke-width="2"/><polyline points="82,110 126,105 166,84 208,52 246,26 272,13 302,26 342,52 386,84 430,105 476,110" fill="none" stroke="#b85835" stroke-width="2.5"/><line x1="200" y1="20" x2="200" y2="112" stroke="#1857a0" stroke-width=".6" stroke-dasharray="3,4" opacity=".6"/><line x1="214" y1="18" x2="214" y2="112" stroke="#2a6048" stroke-width=".6" stroke-dasharray="3,4"/><line x1="272" y1="13" x2="272" y2="112" stroke="#b85835" stroke-width=".6" stroke-dasharray="3,4"/><text x="140" y="124" text-anchor="middle" font-size="8" fill="#8a7a6a">400</text><text x="200" y="124" text-anchor="middle" font-size="8" fill="#1857a0">480</text><text x="236" y="124" text-anchor="middle" font-size="8" fill="#2a6048">507</text><text x="272" y="124" text-anchor="middle" font-size="8" fill="#b85835">555</text><text x="410" y="124" text-anchor="middle" font-size="8" fill="#8a7a6a">700nm</text><rect x="356" y="16" width="8" height="8" rx="2" fill="#b85835"/><text x="368" y="23" font-size="9" fill="#16120e">Photopic cones 555nm</text><rect x="356" y="30" width="8" height="8" rx="2" fill="#2a6048"/><text x="368" y="37" font-size="9" fill="#16120e">Scotopic rods 507nm</text><rect x="356" y="44" width="8" height="8" rx="2" fill="#1857a0" opacity=".75"/><text x="368" y="51" font-size="9" fill="#16120e">ipRGC melanopsin 480nm</text><text x="258" y="138" text-anchor="middle" font-size="9" fill="#8a7a6a">Three separate receptor systems — each drives different responses</text></svg>`,
"1.4":`<svg viewBox="0 0 520 128" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto"><defs><linearGradient id="cg1" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#FF9020"/><stop offset="30%" stop-color="#FFD888"/><stop offset="55%" stop-color="#FFFAF4"/><stop offset="80%" stop-color="#EEF2FF"/><stop offset="100%" stop-color="#BBCCFF"/></linearGradient></defs><text x="16" y="16" font-size="8" fill="#b85835" font-weight="500">◀ Warm</text><text x="504" y="16" text-anchor="end" font-size="8" fill="#4455bb" font-weight="500">Cool ▶</text><rect x="16" y="20" width="488" height="28" rx="4" fill="url(#cg1)" stroke="#e4d9ca" stroke-width=".5"/><line x1="16" y1="48" x2="16" y2="58" stroke="#cfc3b0" stroke-width=".7"/><text x="16" y="66" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace">1900K</text><text x="16" y="76" text-anchor="middle" font-size="9" fill="#8a7a6a">Candle</text><line x1="82" y1="48" x2="82" y2="58" stroke="#cfc3b0" stroke-width=".7"/><text x="82" y="66" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace">2700K</text><text x="82" y="76" text-anchor="middle" font-size="9" fill="#8a7a6a">Incandescent</text><line x1="192" y1="48" x2="192" y2="58" stroke="#cfc3b0" stroke-width=".7"/><text x="192" y="66" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace">3500K</text><text x="192" y="76" text-anchor="middle" font-size="9" fill="#8a7a6a">Neutral</text><line x1="288" y1="48" x2="288" y2="58" stroke="#cfc3b0" stroke-width=".7"/><text x="288" y="66" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace">4000K</text><text x="192" y="89" text-anchor="middle" font-size="9" fill="#8a7a6a">Cool white</text><line x1="414" y1="48" x2="414" y2="58" stroke="#cfc3b0" stroke-width=".7"/><text x="414" y="66" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace">5800K</text><text x="414" y="76" text-anchor="middle" font-size="9" fill="#8a7a6a">Noon daylight</text><line x1="504" y1="48" x2="504" y2="58" stroke="#cfc3b0" stroke-width=".7"/><text x="504" y="66" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace">6500K</text><text x="504" y="76" text-anchor="middle" font-size="9" fill="#8a7a6a">Overcast</text><rect x="16" y="90" width="142" height="34" rx="4" fill="#fff5ee" stroke="#b85835" stroke-width=".7"/><text x="87" y="106" text-anchor="middle" font-size="9" fill="#b85835" font-weight="500">2700–3000K</text><text x="87" y="118" text-anchor="middle" font-size="8" fill="#8a7a6a">Restaurant · Home</text><rect x="168" y="90" width="178" height="34" rx="4" fill="#fdfaf6" stroke="#e4d9ca" stroke-width=".7"/><text x="257" y="106" text-anchor="middle" font-size="9" fill="#16120e" font-weight="500">3500–4000K</text><text x="257" y="118" text-anchor="middle" font-size="8" fill="#8a7a6a">Office · School · Retail</text><rect x="356" y="90" width="162" height="34" rx="4" fill="#eef0ff" stroke="#4455bb" stroke-width=".7"/><text x="437" y="106" text-anchor="middle" font-size="9" fill="#4455bb" font-weight="500">5000–6500K</text><text x="437" y="118" text-anchor="middle" font-size="8" fill="#8a7a6a">Healthcare · Lab</text></svg>`,
"1.5":`<svg viewBox="0 0 520 155" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto"><rect x="8" y="8" width="228" height="139" rx="5" fill="#fdfaf6" stroke="#e4d9ca" stroke-width=".5"/><text x="122" y="26" text-anchor="middle" font-size="10" fill="#16120e" font-weight="600">CRI scale (Ra)</text><rect x="20" y="33" width="200" height="16" rx="2" fill="#2a6048"/><text x="28" y="45" text-anchor="start" font-size="9" fill="#fdfaf6" font-weight="700">Ra 100 — perfect</text><rect x="20" y="53" width="174" height="16" rx="2" fill="#2a6048" opacity=".75"/><text x="28" y="65" text-anchor="start" font-size="9" fill="#fdfaf6" font-weight="700">Ra 90 — excellent</text><rect x="20" y="73" width="148" height="16" rx="2" fill="#b85835" opacity=".9"/><text x="28" y="85" text-anchor="start" font-size="9" fill="#fdfaf6" font-weight="700">Ra 80 — good</text><rect x="20" y="93" width="118" height="16" rx="2" fill="#e8a020"/><text x="28" y="105" text-anchor="start" font-size="9" fill="#16120e" font-weight="700">Ra 70 — acceptable</text><rect x="20" y="113" width="80" height="16" rx="2" fill="#cc4444" opacity=".8"/><text x="28" y="125" text-anchor="start" font-size="9" fill="#fdfaf6" font-weight="700">Ra 60 — poor</text><rect x="20" y="133" width="200" height="18" rx="3" fill="#b85835" opacity=".1" stroke="#b85835" stroke-width=".8"/><text x="120" y="145" text-anchor="middle" font-size="9" fill="#b85835" font-weight="600">R9 NOT in Ra — specify ≥50 separately</text><rect x="248" y="8" width="264" height="139" rx="5" fill="#fdfaf6" stroke="#e4d9ca" stroke-width=".5"/><text x="380" y="26" text-anchor="middle" font-size="10" fill="#16120e" font-weight="600">TM-30 — two metrics</text><rect x="260" y="34" width="112" height="52" rx="4" fill="#fff" stroke="#2a6048" stroke-width="1"/><text x="316" y="56" text-anchor="middle" font-size="16" fill="#2a6048" font-weight="700">Rf</text><text x="316" y="68" text-anchor="middle" font-size="8" fill="#8a7a6a">Fidelity · 99 samples</text><text x="316" y="79" text-anchor="middle" font-size="8" fill="#2a6048">0–100 like CRI</text><rect x="382" y="34" width="120" height="52" rx="4" fill="#fff" stroke="#b85835" stroke-width="1"/><text x="442" y="56" text-anchor="middle" font-size="16" fill="#b85835" font-weight="700">Rg</text><text x="442" y="68" text-anchor="middle" font-size="8" fill="#8a7a6a">Gamut index</text><text x="442" y="79" text-anchor="middle" font-size="8" fill="#b85835">&gt;100 vivid · &lt;100 flat</text><rect x="260" y="94" width="112" height="46" rx="4" fill="#e8f5ee" stroke="#2a6048" stroke-width=".5"/><text x="316" y="112" text-anchor="middle" font-size="9" fill="#2a6048" font-weight="600">Museum / Hospital</text><text x="316" y="126" text-anchor="middle" font-size="9" fill="#8a7a6a">Rf ≥90 · Rg ~100</text><rect x="382" y="94" width="120" height="46" rx="4" fill="#fff5ee" stroke="#b85835" stroke-width=".5"/><text x="442" y="112" text-anchor="middle" font-size="9" fill="#b85835" font-weight="600">Grocery / Fashion</text><text x="442" y="126" text-anchor="middle" font-size="9" fill="#8a7a6a">Rf ≥85 · Rg &gt;105</text></svg>`,
"1.6":`<svg viewBox="0 0 520 130" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">COMPLETE COLOUR RENDERING SPECIFICATION</text><rect x="8" y="18" width="112" height="84" rx="5" fill="#fff5ee" stroke="#b85835" stroke-width="1"/><text x="64" y="36" text-anchor="middle" font-size="9" fill="#b85835" font-family="monospace" font-weight="500">CCT</text><text x="64" y="50" text-anchor="middle" font-size="8" fill="#16120e">Appearance</text><text x="64" y="63" text-anchor="middle" font-size="8" fill="#8a7a6a">2700K warm</text><text x="64" y="75" text-anchor="middle" font-size="8" fill="#8a7a6a">4000K neutral</text><text x="64" y="87" text-anchor="middle" font-size="8" fill="#8a7a6a">6500K cool</text><text x="124" y="64" text-anchor="middle" font-size="15" fill="#8a7a6a" opacity=".35">+</text><rect x="130" y="18" width="112" height="84" rx="5" fill="#e8f5ee" stroke="#2a6048" stroke-width="1"/><text x="186" y="36" text-anchor="middle" font-size="9" fill="#2a6048" font-family="monospace" font-weight="500">Min Ra</text><text x="186" y="50" text-anchor="middle" font-size="8" fill="#16120e">Colour fidelity</text><text x="186" y="63" text-anchor="middle" font-size="8" fill="#8a7a6a">≥70 industrial</text><text x="186" y="75" text-anchor="middle" font-size="8" fill="#8a7a6a">≥80 offices</text><text x="186" y="87" text-anchor="middle" font-size="8" fill="#2a6048" font-weight="500">≥90 critical</text><text x="246" y="64" text-anchor="middle" font-size="15" fill="#8a7a6a" opacity=".35">+</text><rect x="252" y="18" width="112" height="84" rx="5" fill="#ffeef0" stroke="#cc3344" stroke-width="1"/><text x="308" y="36" text-anchor="middle" font-size="9" fill="#cc3344" font-family="monospace" font-weight="500">Min R9</text><text x="308" y="50" text-anchor="middle" font-size="8" fill="#16120e">Saturated red</text><text x="308" y="63" text-anchor="middle" font-size="8" fill="#8a7a6a">NOT in Ra</text><text x="308" y="75" text-anchor="middle" font-size="8" fill="#cc3344" font-weight="500">Specify ≥ 50</text><text x="308" y="87" text-anchor="middle" font-size="8" fill="#8a7a6a">retail/health</text><text x="368" y="64" text-anchor="middle" font-size="15" fill="#8a7a6a" opacity=".35">+</text><rect x="374" y="18" width="138" height="84" rx="5" fill="#eef0ff" stroke="#4455bb" stroke-width="1"/><text x="443" y="36" text-anchor="middle" font-size="9" fill="#4455bb" font-family="monospace" font-weight="500">SDCM</text><text x="443" y="50" text-anchor="middle" font-size="8" fill="#16120e">Consistency</text><text x="443" y="63" text-anchor="middle" font-size="8" fill="#4455bb" font-weight="500">≤ 3-step</text><text x="443" y="75" text-anchor="middle" font-size="8" fill="#8a7a6a">adjacent fixtures</text><text x="443" y="87" text-anchor="middle" font-size="8" fill="#8a7a6a">look identical</text><rect x="8" y="108" width="504" height="18" rx="4" fill="#fdfaf6" stroke="#e4d9ca" stroke-width=".5"/><text x="260" y="121" text-anchor="middle" font-size="9" fill="#16120e" font-weight="500">None alone is sufficient — always specify all four together</text></svg>`,
"2.1":`<svg viewBox="0 0 520 130" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">FLUORESCENT LAMP — HOW IT WORKS</text><rect x="28" y="20" width="464" height="36" rx="18" fill="none" stroke="#e4d9ca" stroke-width="1.5"/><rect x="34" y="26" width="452" height="24" rx="12" fill="#e8eef8" opacity=".5"/><text x="260" y="42" text-anchor="middle" font-size="9" fill="#1857a0" font-weight="500">Mercury vapour discharge tube — low pressure</text><circle cx="28" cy="38" r="9" fill="#e8eef8" stroke="#1857a0" stroke-width="1"/><circle cx="492" cy="38" r="9" fill="#e8eef8" stroke="#1857a0" stroke-width="1"/><text x="260" y="72" text-anchor="middle" font-size="8" fill="#8a7a6a">↓  Mercury discharge emits UV at 254 nm  ↓</text><rect x="28" y="80" width="464" height="18" rx="3" fill="#b85835" opacity=".12" stroke="#b85835" stroke-width=".6"/><text x="260" y="93" text-anchor="middle" font-size="8" fill="#b85835" font-weight="500">Phosphor coating converts UV → visible light (CCT &amp; CRI set by phosphor mix)</text><rect x="68" y="108" width="96" height="16" rx="3" fill="#FFD080" opacity=".8"/><text x="116" y="120" text-anchor="middle" font-size="8" fill="#7a5a00">2700K warm</text><rect x="212" y="108" width="96" height="16" rx="3" fill="#FFFAF4" stroke="#e4d9ca" stroke-width=".5"/><text x="260" y="120" text-anchor="middle" font-size="8" fill="#8a7a6a">4000K neutral</text><rect x="356" y="108" width="96" height="16" rx="3" fill="#E8EEFF"/><text x="404" y="120" text-anchor="middle" font-size="8" fill="#4455bb">6500K cool</text></svg>`,
"2.2":`<svg viewBox="0 0 520 138" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">MAGNETIC vs ELECTRONIC BALLAST</text><rect x="8" y="18" width="242" height="112" rx="5" fill="#fdfaf6" stroke="#e4d9ca" stroke-width=".5"/><text x="129" y="36" text-anchor="middle" font-size="10" fill="#16120e" font-weight="500">Magnetic ballast</text><text x="129" y="51" text-anchor="middle" font-size="9" fill="#8a7a6a">Operates at 50 / 60 Hz</text><text x="129" y="65" text-anchor="middle" font-size="9" fill="#cc3344">100 / 120 Hz flicker</text><text x="129" y="79" text-anchor="middle" font-size="9" fill="#cc3344">Stroboscopic on machinery</text><text x="129" y="93" text-anchor="middle" font-size="9" fill="#8a7a6a">Heavy · inefficient</text><text x="129" y="107" text-anchor="middle" font-size="9" fill="#8a7a6a">Cannot dim smoothly</text><text x="129" y="121" text-anchor="middle" font-size="8" fill="#8a7a6a">~15% efficacy penalty</text><rect x="270" y="18" width="242" height="112" rx="5" fill="#e8f5ee" stroke="#2a6048" stroke-width=".8"/><text x="391" y="36" text-anchor="middle" font-size="10" fill="#2a6048" font-weight="500">Electronic ballast</text><text x="391" y="51" text-anchor="middle" font-size="9" fill="#8a7a6a">Operates at 20k–50k Hz</text><text x="391" y="65" text-anchor="middle" font-size="9" fill="#2a6048">No perceptible flicker</text><text x="391" y="79" text-anchor="middle" font-size="9" fill="#2a6048">10–30% more efficient</text><text x="391" y="93" text-anchor="middle" font-size="9" fill="#8a7a6a">Compact · lighter</text><text x="391" y="107" text-anchor="middle" font-size="9" fill="#2a6048">Dimmable (0–10V/DALI)</text><text x="391" y="121" text-anchor="middle" font-size="8" fill="#8a7a6a">Longer lamp life</text></svg>`,
"2.3":`<svg viewBox="0 0 520 138" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">THREE LED RETROFIT PATHS</text><rect x="8" y="18" width="154" height="112" rx="5" fill="#fdfaf6" stroke="#e4d9ca" stroke-width=".5"/><text x="85" y="35" text-anchor="middle" font-size="9" fill="#16120e" font-weight="500">Path 1 — Type A</text><text x="85" y="49" text-anchor="middle" font-size="8" fill="#b85835" font-weight="500">Lamp swap only</text><text x="85" y="63" text-anchor="middle" font-size="8" fill="#8a7a6a">LED tube into</text><text x="85" y="75" text-anchor="middle" font-size="8" fill="#8a7a6a">existing ballast</text><text x="85" y="87" text-anchor="middle" font-size="8" fill="#8a7a6a">No electrical work</text><text x="85" y="99" text-anchor="middle" font-size="8" fill="#cc3344">Limited by ballast</text><text x="85" y="121" text-anchor="middle" font-size="8" fill="#8a7a6a">Lowest first cost</text><rect x="182" y="18" width="154" height="112" rx="5" fill="#e8eef8" stroke="#1857a0" stroke-width=".8"/><text x="259" y="35" text-anchor="middle" font-size="9" fill="#1857a0" font-weight="500">Path 2 — Type B</text><text x="259" y="49" text-anchor="middle" font-size="8" fill="#1857a0" font-weight="500">Ballast bypass</text><text x="259" y="63" text-anchor="middle" font-size="8" fill="#8a7a6a">Remove ballast</text><text x="259" y="75" text-anchor="middle" font-size="8" fill="#8a7a6a">Wire direct to mains</text><text x="259" y="87" text-anchor="middle" font-size="8" fill="#8a7a6a">Needs electrician</text><text x="259" y="99" text-anchor="middle" font-size="8" fill="#2a6048">No ballast failure</text><text x="259" y="121" text-anchor="middle" font-size="8" fill="#8a7a6a">Medium first cost</text><rect x="356" y="18" width="156" height="112" rx="5" fill="#e8f5ee" stroke="#2a6048" stroke-width=".8"/><text x="434" y="35" text-anchor="middle" font-size="9" fill="#2a6048" font-weight="500">Path 3 — Type C</text><text x="434" y="49" text-anchor="middle" font-size="8" fill="#2a6048" font-weight="500">Full fixture replace</text><text x="434" y="63" text-anchor="middle" font-size="8" fill="#8a7a6a">New complete LED</text><text x="434" y="75" text-anchor="middle" font-size="8" fill="#2a6048">Best photometrics</text><text x="434" y="87" text-anchor="middle" font-size="8" fill="#2a6048">DLC rebate eligible</text><text x="434" y="99" text-anchor="middle" font-size="8" fill="#2a6048">Best 10-yr TCO</text><text x="434" y="121" text-anchor="middle" font-size="8" fill="#8a7a6a">Highest first cost</text></svg>`,
"2.4":`<svg viewBox="0 0 520 138" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">HID LAMP TYPES COMPARED</text><rect x="8" y="18" width="154" height="112" rx="5" fill="#fdfaf6" stroke="#e4d9ca" stroke-width=".5"/><text x="85" y="35" text-anchor="middle" font-size="9" fill="#16120e" font-weight="500">High-Pressure Sodium</text><text x="85" y="48" text-anchor="middle" font-size="8" fill="#b85835" font-weight="500">HPS (SON)</text><text x="85" y="62" text-anchor="middle" font-size="8" fill="#8a7a6a">CCT 2000–2500K</text><text x="85" y="75" text-anchor="middle" font-size="8" fill="#cc3344">Ra 10–80 poor</text><text x="85" y="88" text-anchor="middle" font-size="8" fill="#2a6048">50–130 lm/W</text><text x="85" y="101" text-anchor="middle" font-size="8" fill="#8a7a6a">Amber-yellow</text><text x="85" y="121" text-anchor="middle" font-size="8" fill="#cc3344">10–20 min restrike</text><rect x="182" y="18" width="154" height="112" rx="5" fill="#e8eef8" stroke="#1857a0" stroke-width=".8"/><text x="259" y="35" text-anchor="middle" font-size="9" fill="#1857a0" font-weight="500">Metal Halide</text><text x="259" y="48" text-anchor="middle" font-size="8" fill="#1857a0" font-weight="500">MH / CMH</text><text x="259" y="62" text-anchor="middle" font-size="8" fill="#8a7a6a">CCT 3000–5600K</text><text x="259" y="75" text-anchor="middle" font-size="8" fill="#2a6048">Ra 65–95 good</text><text x="259" y="88" text-anchor="middle" font-size="8" fill="#2a6048">75–140 lm/W</text><text x="259" y="101" text-anchor="middle" font-size="8" fill="#8a7a6a">Neutral-cool white</text><text x="259" y="121" text-anchor="middle" font-size="8" fill="#cc3344">10–20 min restrike</text><rect x="356" y="18" width="156" height="112" rx="5" fill="#fff8ee" stroke="#b85835" stroke-width=".8"/><text x="434" y="35" text-anchor="middle" font-size="9" fill="#b85835" font-weight="500">Compact Fluor.</text><text x="434" y="48" text-anchor="middle" font-size="8" fill="#b85835" font-weight="500">CFL</text><text x="434" y="62" text-anchor="middle" font-size="8" fill="#8a7a6a">CCT 2700–6500K</text><text x="434" y="75" text-anchor="middle" font-size="8" fill="#8a7a6a">Ra ~80</text><text x="434" y="88" text-anchor="middle" font-size="8" fill="#8a7a6a">50–85 lm/W</text><text x="434" y="101" text-anchor="middle" font-size="8" fill="#cc3344">1–3 min warm-up</text><text x="434" y="121" text-anchor="middle" font-size="8" fill="#cc3344">Mercury disposal</text></svg>`,
"2.5":`<svg viewBox="0 0 520 138" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">LUMINOUS EFFICACY — lm/W AT LUMINAIRE LEVEL</text><line x1="120" y1="18" x2="120" y2="118" stroke="#e4d9ca" stroke-width=".8"/><line x1="120" y1="118" x2="510" y2="118" stroke="#e4d9ca" stroke-width=".8"/><text x="116" y="22" text-anchor="end" font-size="9" fill="#8a7a6a">170</text><text x="116" y="52" text-anchor="end" font-size="9" fill="#8a7a6a">130</text><text x="116" y="82" text-anchor="end" font-size="9" fill="#8a7a6a">80</text><text x="116" y="112" text-anchor="end" font-size="9" fill="#8a7a6a">15</text><rect x="138" y="104" width="36" height="14" rx="2" fill="#cc3344" opacity=".7"/><text x="156" y="128" text-anchor="middle" font-size="9" fill="#8a7a6a">Incand.</text><rect x="192" y="72" width="36" height="46" rx="2" fill="#e8a020" opacity=".8"/><text x="210" y="128" text-anchor="middle" font-size="9" fill="#8a7a6a">CFL</text><rect x="246" y="56" width="36" height="62" rx="2" fill="#b85835" opacity=".8"/><text x="264" y="128" text-anchor="middle" font-size="9" fill="#8a7a6a">T8 Fl.</text><rect x="300" y="50" width="36" height="68" rx="2" fill="#1857a0" opacity=".8"/><text x="318" y="128" text-anchor="middle" font-size="9" fill="#8a7a6a">HPS</text><rect x="354" y="42" width="36" height="76" rx="2" fill="#7a3a9a" opacity=".8"/><text x="372" y="128" text-anchor="middle" font-size="9" fill="#8a7a6a">Metal H.</text><rect x="408" y="18" width="36" height="100" rx="2" fill="#2a6048"/><text x="426" y="128" text-anchor="middle" font-size="9" fill="#8a7a6a">LED</text><text x="156" y="101" text-anchor="middle" font-size="9" fill="#16120e" font-weight="600">15</text><text x="210" y="69" text-anchor="middle" font-size="9" fill="#16120e" font-weight="600">68</text><text x="264" y="53" text-anchor="middle" font-size="9" fill="#16120e" font-weight="600">85</text><text x="318" y="47" text-anchor="middle" font-size="9" fill="#16120e" font-weight="600">105</text><text x="372" y="39" text-anchor="middle" font-size="9" fill="#16120e" font-weight="600">120</text><text x="426" y="15" text-anchor="middle" font-size="8" fill="#2a6048" font-weight="500">150+</text><text x="260" y="138" text-anchor="middle" font-size="8" fill="#8a7a6a">Always compare at luminaire level — not bare lamp efficacy</text></svg>`,
"2.6":`<svg viewBox="0 0 520 130" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">SOURCE SELECTION DECISION FRAMEWORK</text><rect x="8" y="18" width="504" height="28" rx="4" fill="#fff5ee" stroke="#b85835" stroke-width=".8"/><text x="260" y="30" text-anchor="middle" font-size="9" fill="#b85835" font-weight="500">Step 1 — Hard constraint filter</text><text x="260" y="41" text-anchor="middle" font-size="8" fill="#8a7a6a">Ra requirement · Instant restrike · Cold temperature · Dimmability required</text><text x="260" y="58" text-anchor="middle" font-size="16" fill="#8a7a6a" opacity=".3">↓</text><rect x="8" y="62" width="504" height="28" rx="4" fill="#e8f5ee" stroke="#2a6048" stroke-width=".8"/><text x="260" y="74" text-anchor="middle" font-size="9" fill="#2a6048" font-weight="500">Step 2 — Compare remaining options on 10-year TCO</text><text x="260" y="85" text-anchor="middle" font-size="8" fill="#8a7a6a">First cost + PV(energy) + PV(maintenance) + disposal</text><text x="260" y="102" text-anchor="middle" font-size="16" fill="#8a7a6a" opacity=".3">↓</text><rect x="8" y="106" width="504" height="22" rx="4" fill="#fdfaf6" stroke="#e4d9ca" stroke-width=".5"/><text x="260" y="121" text-anchor="middle" font-size="8" fill="#16120e" font-weight="500">Traps: HID + instant restrike · Lamp efficacy for LPD calc · Low-CRI for colour-critical task</text></svg>`,
"3.1":`<svg viewBox="0 0 520 130" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">P-N JUNCTION — LED LIGHT EMISSION</text><rect x="40" y="20" width="180" height="80" rx="5" fill="#e8eef8" stroke="#1857a0" stroke-width=".8"/><text x="130" y="42" text-anchor="middle" font-size="11" fill="#1857a0" font-weight="500">N-type</text><text x="130" y="57" text-anchor="middle" font-size="9" fill="#8a7a6a">Free electrons (−)</text><text x="130" y="70" text-anchor="middle" font-size="8" fill="#8a7a6a">e⁻  e⁻  e⁻  e⁻</text><text x="130" y="83" text-anchor="middle" font-size="8" fill="#8a7a6a">Donor atoms doped in</text><rect x="300" y="20" width="180" height="80" rx="5" fill="#fff5ee" stroke="#b85835" stroke-width=".8"/><text x="390" y="42" text-anchor="middle" font-size="11" fill="#b85835" font-weight="500">P-type</text><text x="390" y="57" text-anchor="middle" font-size="9" fill="#8a7a6a">Holes (+)</text><text x="390" y="70" text-anchor="middle" font-size="8" fill="#8a7a6a">○  ○  ○  ○</text><text x="390" y="83" text-anchor="middle" font-size="8" fill="#8a7a6a">Acceptor atoms doped in</text><line x1="220" y1="60" x2="300" y2="60" stroke="#e4d9ca" stroke-width="1.5" stroke-dasharray="4,3"/><text x="260" y="56" text-anchor="middle" font-size="8" fill="#8a7a6a">Junction</text><text x="260" y="74" text-anchor="middle" font-size="18" fill="#b85835">→</text><circle cx="260" cy="60" r="16" fill="#FFD700" opacity=".3" stroke="#FFD700" stroke-width="1"/><text x="260" y="64" text-anchor="middle" font-size="9" fill="#b85835" font-weight="500">hν</text><text x="260" y="106" text-anchor="middle" font-size="9" fill="#16120e" font-weight="500">Electron falls from N to P → releases photon (hν)</text><text x="260" y="120" text-anchor="middle" font-size="8" fill="#8a7a6a">Bandgap energy determines wavelength · Bandgap determines colour</text></svg>`,
"3.2":`<svg viewBox="0 0 520 128" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">FOUR PARTS OF A LUMINAIRE</text><rect x="8" y="18" width="114" height="90" rx="5" fill="#fff5ee" stroke="#b85835" stroke-width="1"/><text x="65" y="36" text-anchor="middle" font-size="8" fill="#b85835" font-family="monospace" font-weight="500">① LED SOURCE</text><text x="65" y="50" text-anchor="middle" font-size="8" fill="#16120e">Package / module</text><text x="65" y="63" text-anchor="middle" font-size="8" fill="#8a7a6a">Generates photons</text><text x="65" y="76" text-anchor="middle" font-size="8" fill="#8a7a6a">Bandgap sets colour</text><text x="65" y="100" text-anchor="middle" font-size="8" fill="#b85835">Tested: LM-79</text><rect x="134" y="18" width="114" height="90" rx="5" fill="#e8eef8" stroke="#1857a0" stroke-width="1"/><text x="191" y="36" text-anchor="middle" font-size="8" fill="#1857a0" font-family="monospace" font-weight="500">② DRIVER</text><text x="191" y="50" text-anchor="middle" font-size="8" fill="#16120e">AC → DC converter</text><text x="191" y="63" text-anchor="middle" font-size="8" fill="#8a7a6a">Controls current</text><text x="191" y="76" text-anchor="middle" font-size="8" fill="#8a7a6a">Handles dimming</text><text x="191" y="100" text-anchor="middle" font-size="8" fill="#cc3344">Top failure cause</text><rect x="260" y="18" width="114" height="90" rx="5" fill="#e8f5ee" stroke="#2a6048" stroke-width="1"/><text x="317" y="36" text-anchor="middle" font-size="8" fill="#2a6048" font-family="monospace" font-weight="500">③ THERMAL</text><text x="317" y="50" text-anchor="middle" font-size="8" fill="#16120e">Heat sink + TIM</text><text x="317" y="63" text-anchor="middle" font-size="8" fill="#8a7a6a">Junction→ambient</text><text x="317" y="76" text-anchor="middle" font-size="8" fill="#8a7a6a">path critical</text><text x="317" y="100" text-anchor="middle" font-size="8" fill="#2a6048">Tested: LM-80</text><rect x="386" y="18" width="126" height="90" rx="5" fill="#f3eef8" stroke="#7a3a9a" stroke-width="1"/><text x="449" y="36" text-anchor="middle" font-size="8" fill="#7a3a9a" font-family="monospace" font-weight="500">④ OPTICS</text><text x="449" y="50" text-anchor="middle" font-size="8" fill="#16120e">Lens/reflector</text><text x="449" y="63" text-anchor="middle" font-size="8" fill="#8a7a6a">Diffuser / baffle</text><text x="449" y="76" text-anchor="middle" font-size="8" fill="#8a7a6a">Shapes distribution</text><text x="449" y="100" text-anchor="middle" font-size="8" fill="#7a3a9a">IES file output</text><text x="260" y="120" text-anchor="middle" font-size="9" fill="#16120e" font-weight="500">All four must be tested together as a system — LM-79 on complete luminaire</text></svg>`,
"3.3":`<svg viewBox="0 0 520 128" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">THERMAL PATH — LED JUNCTION TO AMBIENT AIR</text><rect x="8" y="20" width="504" height="26" rx="3" fill="#b85835" opacity=".15" stroke="#b85835" stroke-width=".8"/><text x="260" y="37" text-anchor="middle" font-size="10" fill="#b85835" font-weight="500">LED Junction (highest temp — target ≤85°C)</text><text x="260" y="55" text-anchor="middle" font-size="10" fill="#8a7a6a">↓  conduction  ↓</text><rect x="8" y="60" width="504" height="16" rx="3" fill="#e8a020" opacity=".2" stroke="#e8a020" stroke-width=".6"/><text x="260" y="72" text-anchor="middle" font-size="8" fill="#7a5a00">Solder pad → MCPCB (metal-core PCB)</text><text x="260" y="85" text-anchor="middle" font-size="10" fill="#8a7a6a">↓  TIM (thermal interface material)  ↓</text><rect x="8" y="90" width="504" height="16" rx="3" fill="#2a6048" opacity=".15" stroke="#2a6048" stroke-width=".6"/><text x="260" y="102" text-anchor="middle" font-size="8" fill="#2a6048">Heat sink — aluminium fins dissipate to ambient by convection</text><text x="260" y="118" text-anchor="middle" font-size="9" fill="#16120e" font-weight="500">Every 10°C rise in junction temp → flux drops, colour shifts blue, L70 life ~halves</text></svg>`,
"3.4":`<svg viewBox="0 0 520 138" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">CC vs CV DRIVER — WHEN TO USE EACH</text><rect x="8" y="18" width="242" height="110" rx="5" fill="#e8f5ee" stroke="#2a6048" stroke-width=".8"/><text x="129" y="36" text-anchor="middle" font-size="10" fill="#2a6048" font-weight="500">Constant Current (CC)</text><text x="129" y="50" text-anchor="middle" font-size="8" fill="#8a7a6a">Fixed output: 350/700/1050 mA</text><text x="129" y="63" text-anchor="middle" font-size="8" fill="#16120e">Single fixture applications</text><text x="129" y="76" text-anchor="middle" font-size="8" fill="#16120e">Downlights · track · high-bay</text><text x="129" y="89" text-anchor="middle" font-size="8" fill="#2a6048">Prevents thermal runaway</text><text x="129" y="102" text-anchor="middle" font-size="8" fill="#2a6048">Consistent lumen output</text><text x="129" y="118" text-anchor="middle" font-size="8" fill="#8a7a6a">Most common driver type</text><rect x="270" y="18" width="242" height="110" rx="5" fill="#e8eef8" stroke="#1857a0" stroke-width=".8"/><text x="391" y="36" text-anchor="middle" font-size="10" fill="#1857a0" font-weight="500">Constant Voltage (CV)</text><text x="391" y="50" text-anchor="middle" font-size="8" fill="#8a7a6a">Fixed output: 12V or 24V DC</text><text x="391" y="63" text-anchor="middle" font-size="8" fill="#16120e">Distributed load systems</text><text x="391" y="76" text-anchor="middle" font-size="8" fill="#16120e">LED strip · signage · coves</text><text x="391" y="89" text-anchor="middle" font-size="8" fill="#8a7a6a">Strip has own resistors</text><text x="391" y="102" text-anchor="middle" font-size="8" fill="#8a7a6a">Layout flexibility</text><text x="391" y="118" text-anchor="middle" font-size="8" fill="#8a7a6a">Less efficient than CC</text></svg>`,
"3.5":`<svg viewBox="0 0 520 138" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">DIMMING PROTOCOL COMPARISON</text><rect x="8" y="18" width="118" height="112" rx="5" fill="#fdfaf6" stroke="#e4d9ca" stroke-width=".5"/><text x="67" y="34" text-anchor="middle" font-size="9" fill="#16120e" font-weight="500">0–10V</text><text x="67" y="48" text-anchor="middle" font-size="8" fill="#8a7a6a">1–10V = dim range</text><text x="67" y="61" text-anchor="middle" font-size="8" fill="#8a7a6a">0V = lamp off</text><text x="67" y="74" text-anchor="middle" font-size="8" fill="#8a7a6a">Separate wire</text><text x="67" y="87" text-anchor="middle" font-size="8" fill="#cc3344">No feedback</text><text x="67" y="100" text-anchor="middle" font-size="8" fill="#cc3344">Zone only</text><text x="67" y="113" text-anchor="middle" font-size="8" fill="#2a6048">Simple/cheap</text><rect x="136" y="18" width="118" height="112" rx="5" fill="#e8f5ee" stroke="#2a6048" stroke-width=".8"/><text x="195" y="34" text-anchor="middle" font-size="9" fill="#2a6048" font-weight="500">DALI-2</text><text x="195" y="48" text-anchor="middle" font-size="8" fill="#8a7a6a">IEC 62386</text><text x="195" y="61" text-anchor="middle" font-size="8" fill="#16120e">64 devices/bus</text><text x="195" y="74" text-anchor="middle" font-size="8" fill="#2a6048">Individual address</text><text x="195" y="87" text-anchor="middle" font-size="8" fill="#2a6048">Bidirectional</text><text x="195" y="100" text-anchor="middle" font-size="8" fill="#2a6048">Scene memory</text><text x="195" y="113" text-anchor="middle" font-size="8" fill="#2a6048">Fault reporting</text><rect x="264" y="18" width="118" height="112" rx="5" fill="#e8eef8" stroke="#1857a0" stroke-width=".8"/><text x="323" y="34" text-anchor="middle" font-size="9" fill="#1857a0" font-weight="500">PWM</text><text x="323" y="48" text-anchor="middle" font-size="8" fill="#8a7a6a">Duty-cycle switch</text><text x="323" y="61" text-anchor="middle" font-size="8" fill="#16120e">High freq (1kHz+)</text><text x="323" y="74" text-anchor="middle" font-size="8" fill="#2a6048">Stable colour</text><text x="323" y="87" text-anchor="middle" font-size="8" fill="#cc3344">Low freq = flicker</text><text x="323" y="100" text-anchor="middle" font-size="8" fill="#8a7a6a">Theatrical/retail</text><text x="323" y="113" text-anchor="middle" font-size="8" fill="#8a7a6a">TM-30/WELL metric</text><rect x="392" y="18" width="120" height="112" rx="5" fill="#fff5ee" stroke="#b85835" stroke-width=".8"/><text x="452" y="34" text-anchor="middle" font-size="9" fill="#b85835" font-weight="500">Triac/Phase</text><text x="452" y="48" text-anchor="middle" font-size="8" fill="#8a7a6a">Wallbox dimmer</text><text x="452" y="61" text-anchor="middle" font-size="8" fill="#16120e">Easy retrofit</text><text x="452" y="74" text-anchor="middle" font-size="8" fill="#cc3344">Driver compat.</text><text x="452" y="87" text-anchor="middle" font-size="8" fill="#cc3344">test required</text><text x="452" y="100" text-anchor="middle" font-size="8" fill="#8a7a6a">Residential</text><text x="452" y="113" text-anchor="middle" font-size="8" fill="#8a7a6a">common</text></svg>`,
"3.6":`<svg viewBox="0 0 520 128" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">POWER FACTOR &amp; THD — WHY THEY MATTER</text><rect x="8" y="18" width="242" height="96" rx="5" fill="#fdfaf6" stroke="#e4d9ca" stroke-width=".5"/><text x="129" y="34" text-anchor="middle" font-size="10" fill="#16120e" font-weight="500">Power Factor (PF)</text><text x="129" y="49" text-anchor="middle" font-size="8" fill="#8a7a6a">PF = Real power (W) ÷ Apparent (VA)</text><text x="129" y="63" text-anchor="middle" font-size="8" fill="#8a7a6a">PF 1.0 = ideal (resistive load)</text><text x="129" y="77" text-anchor="middle" font-size="8" fill="#cc3344">PF 0.7 = 43% extra current drawn</text><text x="129" y="91" text-anchor="middle" font-size="8" fill="#2a6048">Commercial spec: PF ≥ 0.90</text><text x="129" y="105" text-anchor="middle" font-size="8" fill="#2a6048">DLC QPL requires PF ≥ 0.90</text><rect x="270" y="18" width="242" height="96" rx="5" fill="#fdfaf6" stroke="#e4d9ca" stroke-width=".5"/><text x="391" y="34" text-anchor="middle" font-size="10" fill="#16120e" font-weight="500">Total Harmonic Distortion</text><text x="391" y="49" text-anchor="middle" font-size="8" fill="#8a7a6a">Deviation from pure 60 Hz sine</text><text x="391" y="63" text-anchor="middle" font-size="8" fill="#cc3344">3rd harmonics add in neutral wire</text><text x="391" y="77" text-anchor="middle" font-size="8" fill="#cc3344">Can overheat neutral conductor</text><text x="391" y="91" text-anchor="middle" font-size="8" fill="#2a6048">Specify THD &lt; 20%</text><text x="391" y="105" text-anchor="middle" font-size="8" fill="#2a6048">Premium: THD &lt; 10%</text><text x="260" y="122" text-anchor="middle" font-size="9" fill="#16120e" font-weight="500">Specify PF ≥ 0.90 and THD &lt; 20% for all commercial LED installations</text></svg>`
,"4.1":`<svg viewBox="0 0 520 148" style="width:100%;height:auto" xmlns="http://www.w3.org/2000/svg"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">IES LM-63 FILE STRUCTURE</text><rect x="8" y="18" width="504" height="22" rx="3" fill="#fff5ee" stroke="#b85835" stroke-width=".8"/><text x="16" y="33" font-size="9" fill="#b85835" font-weight="500">HEADER</text><text x="80" y="33" font-size="8" fill="#8a7a6a">Manufacturer, Catalogue number, Lamp lumens, Test date, Multiplying factor</text><rect x="8" y="44" width="504" height="22" rx="3" fill="#e8eef8" stroke="#1857a0" stroke-width=".8"/><text x="16" y="59" font-size="9" fill="#1857a0" font-weight="500">TILT</text><text x="56" y="59" font-size="8" fill="#8a7a6a">TILT=NONE for most luminaires</text><rect x="8" y="70" width="504" height="22" rx="3" fill="#e8f5ee" stroke="#2a6048" stroke-width=".8"/><text x="16" y="85" font-size="9" fill="#2a6048" font-weight="500">LAMP AND ELECTRICAL</text><text x="160" y="85" font-size="8" fill="#8a7a6a">Lamp count, Lumens, Candela multiplier, Watts</text><rect x="8" y="96" width="504" height="34" rx="3" fill="#f3eef8" stroke="#7a3a9a" stroke-width=".8"/><text x="16" y="111" font-size="9" fill="#7a3a9a" font-weight="500">CANDELA DATA</text><text x="120" y="111" font-size="8" fill="#8a7a6a">Vertical: 0 deg nadir to 180 deg zenith</text><text x="120" y="123" font-size="8" fill="#8a7a6a">Horizontal planes: 0 to 360 degrees</text><text x="260" y="142" text-anchor="middle" font-size="9" fill="#16120e" font-weight="500">All candela times multiplying factor equals complete 3D distribution</text></svg>`
,"4.2":`<svg viewBox="0 0 520 148" style="width:100%;height:auto" xmlns="http://www.w3.org/2000/svg"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">POLAR AND CARTESIAN PHOTOMETRIC PLOTS</text><circle cx="118" cy="88" r="54" fill="none" stroke="#e4d9ca" stroke-width=".6" stroke-dasharray="3,3"/><circle cx="118" cy="88" r="36" fill="none" stroke="#e4d9ca" stroke-width=".4"/><line x1="118" y1="34" x2="118" y2="142" stroke="#e4d9ca" stroke-width=".6"/><line x1="64" y1="88" x2="172" y2="88" stroke="#e4d9ca" stroke-width=".6"/><path d="M118,88 L107,42 Q118,32 129,42 Z" fill="#b85835" opacity=".2" stroke="#b85835" stroke-width="1.5"/><text x="118" y="28" text-anchor="middle" font-size="8" fill="#b85835">0 deg nadir</text><text x="175" y="92" font-size="8" fill="#8a7a6a">90</text><text x="118" y="156" text-anchor="middle" font-size="9" fill="#16120e" font-weight="500">Polar: radial equals cd, angle sweeps</text><line x1="278" y1="30" x2="278" y2="126" stroke="#e4d9ca" stroke-width=".8"/><line x1="278" y1="126" x2="508" y2="126" stroke="#e4d9ca" stroke-width=".8"/><polyline points="278,126 292,124 306,116 320,94 335,58 350,32 365,58 380,94 394,116 408,124 422,126" fill="none" stroke="#b85835" stroke-width="2"/><polyline points="278,106 292,88 306,70 320,62 335,70 350,94 365,70 380,62 394,70 408,88 422,106" fill="none" stroke="#2a6048" stroke-width="1.5" stroke-dasharray="4,2"/><text x="448" y="48" font-size="8" fill="#b85835">narrow</text><text x="448" y="64" font-size="8" fill="#2a6048">bat-wing</text><text x="393" y="148" text-anchor="middle" font-size="9" fill="#16120e" font-weight="500">Cartesian: X equals angle, Y equals cd</text></svg>`
,"4.3":`<svg viewBox="0 0 520 140" style="width:100%;height:auto" xmlns="http://www.w3.org/2000/svg"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">LM-79 AND LM-80 AND TM-21</text><rect x="8" y="20" width="156" height="110" rx="5" fill="#fff5ee" stroke="#b85835" stroke-width="1"/><text x="86" y="38" text-anchor="middle" font-size="10" fill="#b85835" font-family="monospace" font-weight="500">LM-79</text><text x="86" y="53" text-anchor="middle" font-size="9" fill="#16120e">Complete luminaire</text><text x="86" y="66" text-anchor="middle" font-size="8" fill="#8a7a6a">Lumens, efficacy, CCT</text><text x="86" y="79" text-anchor="middle" font-size="8" fill="#8a7a6a">CRI, distribution</text><text x="86" y="121" text-anchor="middle" font-size="8" fill="#b85835" font-weight="500">Required for DLC</text><rect x="182" y="20" width="156" height="110" rx="5" fill="#e8eef8" stroke="#1857a0" stroke-width="1"/><text x="260" y="38" text-anchor="middle" font-size="10" fill="#1857a0" font-family="monospace" font-weight="500">LM-80</text><text x="260" y="53" text-anchor="middle" font-size="9" fill="#16120e">LED package only</text><text x="260" y="66" text-anchor="middle" font-size="8" fill="#8a7a6a">Lumen maintenance</text><text x="260" y="79" text-anchor="middle" font-size="8" fill="#8a7a6a">3 temps over 6000 hrs</text><text x="260" y="121" text-anchor="middle" font-size="8" fill="#1857a0" font-weight="500">NOT full luminaire</text><rect x="356" y="20" width="156" height="110" rx="5" fill="#e8f5ee" stroke="#2a6048" stroke-width="1"/><text x="434" y="38" text-anchor="middle" font-size="10" fill="#2a6048" font-family="monospace" font-weight="500">TM-21</text><text x="434" y="53" text-anchor="middle" font-size="9" fill="#16120e">Lifetime projection</text><text x="434" y="66" text-anchor="middle" font-size="8" fill="#8a7a6a">Extrapolates LM-80 data</text><text x="434" y="79" text-anchor="middle" font-size="8" fill="#8a7a6a">Projects L70 and L80</text><text x="434" y="92" text-anchor="middle" font-size="8" fill="#cc3344" font-weight="500">Max equals 6x LM-80 hrs</text></svg>`
,"4.4":`<svg viewBox="0 0 520 148" style="width:100%;height:auto" xmlns="http://www.w3.org/2000/svg"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">INVERSE-SQUARE LAW</text><circle cx="58" cy="74" r="12" fill="#FFD700" opacity=".45" stroke="#b85835" stroke-width="1"/><text x="58" y="78" text-anchor="middle" font-size="8" fill="#b85835" font-weight="500">I cd</text><line x1="70" y1="74" x2="176" y2="74" stroke="#b85835" stroke-width="1.2"/><line x1="70" y1="74" x2="176" y2="50" stroke="#b85835" stroke-width=".7" opacity=".5"/><line x1="70" y1="74" x2="176" y2="98" stroke="#b85835" stroke-width=".7" opacity=".5"/><line x1="70" y1="74" x2="316" y2="74" stroke="#b85835" stroke-width=".8" opacity=".45"/><rect x="174" y="44" width="6" height="60" rx="2" fill="#1857a0" opacity=".7"/><text x="177" y="118" text-anchor="middle" font-size="8" fill="#1857a0">d</text><text x="177" y="130" text-anchor="middle" font-size="9" fill="#1857a0" font-weight="500">E=I/d2</text><rect x="314" y="28" width="6" height="92" rx="2" fill="#2a6048" opacity=".55"/><text x="317" y="130" text-anchor="middle" font-size="8" fill="#2a6048">2d</text><text x="317" y="142" text-anchor="middle" font-size="9" fill="#2a6048" font-weight="500">E=quarter</text><rect x="366" y="28" width="146" height="92" rx="5" fill="#fdfaf6" stroke="#e4d9ca" stroke-width=".5"/><text x="439" y="48" text-anchor="middle" font-size="10" fill="#16120e" font-weight="500">E = I divided by d2</text><text x="439" y="64" text-anchor="middle" font-size="8" fill="#8a7a6a">E = illuminance lux</text><text x="439" y="77" text-anchor="middle" font-size="8" fill="#8a7a6a">I = intensity candelas</text><text x="439" y="90" text-anchor="middle" font-size="8" fill="#8a7a6a">d = distance metres</text><text x="439" y="107" text-anchor="middle" font-size="9" fill="#b85835" font-weight="500">2d gives E div 4</text><text x="439" y="119" text-anchor="middle" font-size="9" fill="#2a6048" font-weight="500">3d gives E div 9</text></svg>`
,"4.5":`<svg viewBox="0 0 520 148" style="width:100%;height:auto" xmlns="http://www.w3.org/2000/svg"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">COSINE LAW</text><circle cx="126" cy="36" r="11" fill="#FFD700" opacity=".45" stroke="#b85835" stroke-width="1"/><text x="126" y="40" text-anchor="middle" font-size="8" fill="#b85835">I cd</text><rect x="194" y="16" width="6" height="78" rx="2" fill="#2a6048" opacity=".7"/><line x1="137" y1="36" x2="194" y2="36" stroke="#2a6048" stroke-width="1.2"/><text x="165" y="32" text-anchor="middle" font-size="8" fill="#2a6048">d</text><text x="197" y="108" text-anchor="middle" font-size="8" fill="#2a6048">theta=0 cos=1.0</text><text x="197" y="120" text-anchor="middle" font-size="9" fill="#2a6048" font-weight="500">E=I/d2</text><line x1="137" y1="36" x2="334" y2="90" stroke="#1857a0" stroke-width="1.2"/><line x1="318" y1="62" x2="350" y2="116" stroke="#1857a0" stroke-width="4" stroke-linecap="round" opacity=".65"/><text x="356" y="90" font-size="8" fill="#1857a0">theta=45</text><text x="356" y="102" font-size="8" fill="#1857a0">cos=0.707</text><text x="356" y="116" font-size="9" fill="#1857a0" font-weight="500">E=0.71 I/d2</text><rect x="8" y="100" width="290" height="44" rx="4" fill="#fdfaf6" stroke="#e4d9ca" stroke-width=".5"/><text x="16" y="116" font-size="8" fill="#8a7a6a">cos 0=1.000  cos 30=0.866  cos 45=0.707</text><text x="16" y="130" font-size="8" fill="#8a7a6a">cos 60=0.500  cos 75=0.259  cos 90=0</text></svg>`
,"4.6":`<svg viewBox="0 0 520 148" style="width:100%;height:auto" xmlns="http://www.w3.org/2000/svg"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">LUMEN METHOD ZONAL CAVITY</text><rect x="8" y="20" width="504" height="28" rx="4" fill="#fff5ee" stroke="#b85835" stroke-width=".8"/><text x="260" y="32" text-anchor="middle" font-size="10" fill="#b85835" font-weight="500">E avg = N times Phi times CU times LLF divided by A</text><text x="260" y="43" text-anchor="middle" font-size="8" fill="#8a7a6a">For design: N = E times A divided by Phi times CU times LLF</text><rect x="8" y="56" width="116" height="82" rx="4" fill="#fdfaf6" stroke="#e4d9ca" stroke-width=".5"/><text x="66" y="73" text-anchor="middle" font-size="9" fill="#16120e" font-weight="500">N and Phi and A</text><text x="66" y="87" text-anchor="middle" font-size="8" fill="#8a7a6a">N = luminaires</text><text x="66" y="100" text-anchor="middle" font-size="8" fill="#8a7a6a">Phi = lamp lumens</text><text x="66" y="113" text-anchor="middle" font-size="8" fill="#8a7a6a">A = floor area</text><rect x="132" y="56" width="116" height="82" rx="4" fill="#e8f5ee" stroke="#2a6048" stroke-width=".8"/><text x="190" y="73" text-anchor="middle" font-size="9" fill="#2a6048" font-weight="500">CU</text><text x="190" y="87" text-anchor="middle" font-size="8" fill="#8a7a6a">From photometric table</text><text x="190" y="100" text-anchor="middle" font-size="8" fill="#2a6048">RCR = 5h(L+W) div LW</text><text x="190" y="113" text-anchor="middle" font-size="8" fill="#8a7a6a">plus reflectances</text><rect x="256" y="56" width="116" height="82" rx="4" fill="#e8eef8" stroke="#1857a0" stroke-width=".8"/><text x="314" y="73" text-anchor="middle" font-size="9" fill="#1857a0" font-weight="500">LLF</text><text x="314" y="87" text-anchor="middle" font-size="8" fill="#8a7a6a">= LLD times LDD</text><text x="314" y="100" text-anchor="middle" font-size="8" fill="#1857a0">LED clean space</text><text x="314" y="113" text-anchor="middle" font-size="8" fill="#1857a0">0.80 to 0.90</text><rect x="380" y="56" width="132" height="82" rx="4" fill="#f3eef8" stroke="#7a3a9a" stroke-width=".8"/><text x="446" y="73" text-anchor="middle" font-size="9" fill="#7a3a9a" font-weight="500">Dark walls impact</text><text x="446" y="87" text-anchor="middle" font-size="8" fill="#8a7a6a">High RCR = lower CU</text><text x="446" y="100" text-anchor="middle" font-size="8" fill="#7a3a9a">30pct walls needs 44pct</text><text x="446" y="113" text-anchor="middle" font-size="8" fill="#7a3a9a">more fixtures than 50pct</text></svg>`
,"5.1":`<svg viewBox="0 0 520 128" style="width:100%;height:auto" xmlns="http://www.w3.org/2000/svg"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">WHY WE CONTROL: ENERGY WELLBEING COMPLIANCE</text><rect x="8" y="20" width="154" height="98" rx="5" fill="#e8f5ee" stroke="#2a6048" stroke-width=".8"/><text x="85" y="38" text-anchor="middle" font-size="10" fill="#2a6048" font-weight="500">Energy</text><text x="85" y="53" text-anchor="middle" font-size="9" fill="#8a7a6a">30-50 pct more savings</text><text x="85" y="67" text-anchor="middle" font-size="9" fill="#8a7a6a">beyond efficient sources</text><text x="85" y="95" text-anchor="middle" font-size="8" fill="#2a6048">ASHRAE 90.1 and Title 24</text><rect x="182" y="20" width="154" height="98" rx="5" fill="#e8eef8" stroke="#1857a0" stroke-width=".8"/><text x="259" y="38" text-anchor="middle" font-size="10" fill="#1857a0" font-weight="500">Wellbeing</text><text x="259" y="53" text-anchor="middle" font-size="9" fill="#8a7a6a">Individual dimming</text><text x="259" y="67" text-anchor="middle" font-size="9" fill="#8a7a6a">Tunable white CCT</text><text x="259" y="81" text-anchor="middle" font-size="9" fill="#8a7a6a">Circadian support</text><text x="259" y="95" text-anchor="middle" font-size="8" fill="#1857a0">WELL v2 and LEED</text><rect x="356" y="20" width="154" height="98" rx="5" fill="#fff5ee" stroke="#b85835" stroke-width=".8"/><text x="433" y="38" text-anchor="middle" font-size="10" fill="#b85835" font-weight="500">Compliance</text><text x="433" y="53" text-anchor="middle" font-size="9" fill="#8a7a6a">Occupancy sensing</text><text x="433" y="67" text-anchor="middle" font-size="9" fill="#8a7a6a">Daylight controls</text><text x="433" y="81" text-anchor="middle" font-size="9" fill="#8a7a6a">Manual dimming</text><text x="433" y="95" text-anchor="middle" font-size="8" fill="#b85835">ASHRAE 90.1 IECC</text></svg>`
,"5.2":`<svg viewBox="0 0 520 128" style="width:100%;height:auto" xmlns="http://www.w3.org/2000/svg"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">OCCUPANCY vs VACANCY AND SENSOR TYPES</text><rect x="8" y="20" width="154" height="98" rx="5" fill="#fdfaf6" stroke="#e4d9ca" stroke-width=".5"/><text x="85" y="37" text-anchor="middle" font-size="9" fill="#16120e" font-weight="500">Occupancy sensor</text><text x="85" y="52" text-anchor="middle" font-size="8" fill="#8a7a6a">Auto ON and Auto OFF</text><text x="85" y="66" text-anchor="middle" font-size="8" fill="#8a7a6a">Convenient</text><text x="85" y="92" text-anchor="middle" font-size="9" fill="#b85835">Less saving</text><rect x="172" y="20" width="154" height="98" rx="5" fill="#e8f5ee" stroke="#2a6048" stroke-width=".8"/><text x="249" y="37" text-anchor="middle" font-size="9" fill="#2a6048" font-weight="500">Vacancy sensor</text><text x="249" y="52" text-anchor="middle" font-size="8" fill="#8a7a6a">Manual ON and Auto OFF</text><text x="249" y="66" text-anchor="middle" font-size="8" fill="#2a6048">5-10 pct more savings</text><text x="249" y="80" text-anchor="middle" font-size="8" fill="#2a6048">ASHRAE 90.1 required</text><text x="249" y="92" text-anchor="middle" font-size="8" fill="#2a6048">offices meetings classrooms</text><rect x="336" y="20" width="176" height="98" rx="5" fill="#e8eef8" stroke="#1857a0" stroke-width=".8"/><text x="424" y="37" text-anchor="middle" font-size="9" fill="#1857a0" font-weight="500">Technologies</text><text x="424" y="52" text-anchor="middle" font-size="8" fill="#8a7a6a">PIR: heat and large motion</text><text x="424" y="66" text-anchor="middle" font-size="8" fill="#8a7a6a">Ultrasonic: fine motion</text><text x="424" y="80" text-anchor="middle" font-size="8" fill="#2a6048">Dual-tech: both must agree</text><text x="424" y="92" text-anchor="middle" font-size="8" fill="#2a6048">Best for offices</text></svg>`
,"5.3":`<svg viewBox="0 0 520 128" style="width:100%;height:auto" xmlns="http://www.w3.org/2000/svg"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">DAYLIGHT HARVESTING: CLOSED AND OPEN LOOP</text><rect x="8" y="20" width="242" height="98" rx="5" fill="#e8f5ee" stroke="#2a6048" stroke-width=".8"/><text x="129" y="38" text-anchor="middle" font-size="10" fill="#2a6048" font-weight="500">Closed-loop</text><text x="129" y="53" text-anchor="middle" font-size="9" fill="#8a7a6a">Measures daylight plus electric</text><text x="129" y="67" text-anchor="middle" font-size="9" fill="#8a7a6a">at the work plane</text><text x="129" y="81" text-anchor="middle" font-size="9" fill="#2a6048">Most accurate</text><text x="129" y="95" text-anchor="middle" font-size="8" fill="#2a6048">ASHRAE 90.1 requires Cx</text><rect x="270" y="20" width="242" height="98" rx="5" fill="#fdfaf6" stroke="#e4d9ca" stroke-width=".5"/><text x="391" y="38" text-anchor="middle" font-size="10" fill="#16120e" font-weight="500">Open-loop</text><text x="391" y="53" text-anchor="middle" font-size="9" fill="#8a7a6a">Measures incoming</text><text x="391" y="67" text-anchor="middle" font-size="9" fill="#8a7a6a">daylight only and estimates</text><text x="391" y="81" text-anchor="middle" font-size="9" fill="#8a7a6a">Simpler install</text><text x="391" y="95" text-anchor="middle" font-size="8" fill="#cc3344">Less precise and drifts</text><text x="260" y="122" text-anchor="middle" font-size="9" fill="#16120e" font-weight="500">LEED v4.1: sDA 55 pct or more and ASE 10 pct or less</text></svg>`
,"5.4":`<svg viewBox="0 0 520 128" style="width:100%;height:auto" xmlns="http://www.w3.org/2000/svg"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">LEED v4.1 AND WELL v2 LIGHTING REQUIREMENTS</text><rect x="8" y="20" width="242" height="98" rx="5" fill="#e8f5ee" stroke="#2a6048" stroke-width=".8"/><text x="129" y="38" text-anchor="middle" font-size="10" fill="#2a6048" font-weight="500">LEED v4.1 EQ</text><text x="129" y="53" text-anchor="middle" font-size="9" fill="#8a7a6a">Individual controls 90pct of</text><text x="129" y="67" text-anchor="middle" font-size="9" fill="#8a7a6a">occupant positions is 1 pt</text><text x="129" y="81" text-anchor="middle" font-size="9" fill="#2a6048">CRI 90 or more and R9 50 or more</text><text x="129" y="95" text-anchor="middle" font-size="8" fill="#2a6048">sDA 55pct or more for credit</text><rect x="270" y="20" width="242" height="98" rx="5" fill="#e8eef8" stroke="#1857a0" stroke-width=".8"/><text x="391" y="38" text-anchor="middle" font-size="10" fill="#1857a0" font-weight="500">WELL v2 Light</text><text x="391" y="53" text-anchor="middle" font-size="9" fill="#8a7a6a">200 EML or more morning</text><text x="391" y="67" text-anchor="middle" font-size="9" fill="#8a7a6a">UGR 22 or less occupied</text><text x="391" y="81" text-anchor="middle" font-size="9" fill="#1857a0">Flicker limits per L03</text><text x="391" y="95" text-anchor="middle" font-size="8" fill="#1857a0">CRI 90 and R9 50 per L05</text></svg>`
,"5.5":`<svg viewBox="0 0 520 128" style="width:100%;height:auto" xmlns="http://www.w3.org/2000/svg"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">S/P RATIO AND DALI-2 PROTOCOL</text><rect x="8" y="20" width="242" height="98" rx="5" fill="#fdfaf6" stroke="#e4d9ca" stroke-width=".5"/><text x="129" y="38" text-anchor="middle" font-size="10" fill="#16120e" font-weight="500">S/P Ratio</text><text x="129" y="53" text-anchor="middle" font-size="9" fill="#8a7a6a">Scotopic divided by Photopic</text><text x="129" y="67" text-anchor="middle" font-size="9" fill="#8a7a6a">Cool LED S/P above 1.5</text><text x="129" y="81" text-anchor="middle" font-size="9" fill="#2a6048">20-40 pct brighter appearance</text><text x="129" y="95" text-anchor="middle" font-size="8" fill="#8a7a6a">under mesopic conditions</text><rect x="270" y="20" width="242" height="98" rx="5" fill="#e8f5ee" stroke="#2a6048" stroke-width=".8"/><text x="391" y="38" text-anchor="middle" font-size="10" fill="#2a6048" font-weight="500">DALI-2 IEC 62386</text><text x="391" y="53" text-anchor="middle" font-size="9" fill="#8a7a6a">64 devices per bus</text><text x="391" y="67" text-anchor="middle" font-size="9" fill="#2a6048">Individual addressing</text><text x="391" y="81" text-anchor="middle" font-size="9" fill="#2a6048">Scene memory at driver</text><text x="391" y="95" text-anchor="middle" font-size="8" fill="#2a6048">Fault reporting and BACnet</text></svg>`
,"5.6":`<svg viewBox="0 0 520 128" style="width:100%;height:auto" xmlns="http://www.w3.org/2000/svg"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">BACnet AND IoT AND PoE LIGHTING</text><rect x="8" y="20" width="154" height="98" rx="5" fill="#fdfaf6" stroke="#e4d9ca" stroke-width=".5"/><text x="85" y="38" text-anchor="middle" font-size="10" fill="#16120e" font-weight="500">BACnet</text><text x="85" y="53" text-anchor="middle" font-size="9" fill="#8a7a6a">ASHRAE 135 open protocol</text><text x="85" y="67" text-anchor="middle" font-size="9" fill="#16120e">Lighting plus HVAC unified</text><text x="85" y="81" text-anchor="middle" font-size="9" fill="#16120e">Demand response</text><text x="85" y="95" text-anchor="middle" font-size="8" fill="#8a7a6a">Emergency override</text><rect x="182" y="20" width="154" height="98" rx="5" fill="#e8eef8" stroke="#1857a0" stroke-width=".8"/><text x="259" y="38" text-anchor="middle" font-size="10" fill="#1857a0" font-weight="500">IoT Lighting</text><text x="259" y="53" text-anchor="middle" font-size="9" fill="#8a7a6a">Each fixture is a data node</text><text x="259" y="67" text-anchor="middle" font-size="9" fill="#1857a0">Occupancy analytics</text><text x="259" y="81" text-anchor="middle" font-size="9" fill="#1857a0">Predictive maintenance</text><text x="259" y="95" text-anchor="middle" font-size="8" fill="#8a7a6a">Continuous commissioning</text><rect x="356" y="20" width="154" height="98" rx="5" fill="#e8f5ee" stroke="#2a6048" stroke-width=".8"/><text x="433" y="38" text-anchor="middle" font-size="10" fill="#2a6048" font-weight="500">PoE Lighting</text><text x="433" y="53" text-anchor="middle" font-size="9" fill="#8a7a6a">Power plus data Cat cable</text><text x="433" y="67" text-anchor="middle" font-size="9" fill="#2a6048">90W per port 802.3bt</text><text x="433" y="81" text-anchor="middle" font-size="9" fill="#2a6048">Fixture-level metering</text><text x="433" y="95" text-anchor="middle" font-size="8" fill="#8a7a6a">100m segment limit</text></svg>`
,"6.1":`<svg viewBox="0 0 520 148" style="width:100%;height:auto" xmlns="http://www.w3.org/2000/svg"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">DOWNLIGHT: APERTURE, BEAM AND TRIM</text><rect x="160" y="18" width="200" height="14" rx="3" fill="#e4d9ca" stroke="#8a7a6a" stroke-width=".8"/><text x="260" y="29" text-anchor="middle" font-size="8" fill="#8a7a6a">Ceiling plane</text><rect x="200" y="32" width="120" height="28" rx="4" fill="#fdfaf6" stroke="#b85835" stroke-width="1"/><text x="260" y="51" text-anchor="middle" font-size="9" fill="#b85835" font-weight="500">Aperture</text><line x1="260" y1="60" x2="178" y2="128" stroke="#b85835" stroke-width="1" stroke-dasharray="4,3"/><line x1="260" y1="60" x2="342" y2="128" stroke="#b85835" stroke-width="1" stroke-dasharray="4,3"/><line x1="178" y1="128" x2="342" y2="128" stroke="#e4d9ca" stroke-width=".8"/><path d="M 260,60 A 28,28 0 0,1 278,70" fill="none" stroke="#b85835" stroke-width="1"/><text x="284" y="70" font-size="8" fill="#b85835">beam angle</text><rect x="8" y="72" width="148" height="68" rx="4" fill="#fdfaf6" stroke="#e4d9ca" stroke-width=".5"/><text x="82" y="90" text-anchor="middle" font-size="9" fill="#16120e" font-weight="500">Aperture sizes</text><text x="82" y="104" text-anchor="middle" font-size="8" fill="#8a7a6a">2 in accent</text><text x="82" y="117" text-anchor="middle" font-size="8" fill="#8a7a6a">4 in task</text><text x="82" y="130" text-anchor="middle" font-size="8" fill="#8a7a6a">6 in high-output</text><text x="260" y="142" text-anchor="middle" font-size="9" fill="#16120e" font-weight="500">Diameter = 2 x height x tan(beam / 2)</text></svg>`
,"6.2":`<svg viewBox="0 0 520 138" style="width:100%;height:auto" xmlns="http://www.w3.org/2000/svg"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">IES DISTRIBUTION TYPES I THROUGH V</text><rect x="8" y="20" width="86" height="108" rx="4" fill="#fdfaf6" stroke="#b85835" stroke-width=".8"/><text x="51" y="37" text-anchor="middle" font-size="9" fill="#b85835" font-weight="500">Type I</text><text x="51" y="51" text-anchor="middle" font-size="8" fill="#8a7a6a">Two-way</text><text x="51" y="65" text-anchor="middle" font-size="8" fill="#8a7a6a">along road</text><text x="51" y="79" text-anchor="middle" font-size="8" fill="#16120e">Walkways</text><text x="51" y="93" text-anchor="middle" font-size="8" fill="#8a7a6a">narrow paths</text><rect x="102" y="20" width="86" height="108" rx="4" fill="#fdfaf6" stroke="#1857a0" stroke-width=".8"/><text x="145" y="37" text-anchor="middle" font-size="9" fill="#1857a0" font-weight="500">Type II</text><text x="145" y="51" text-anchor="middle" font-size="8" fill="#8a7a6a">Short lateral</text><text x="145" y="65" text-anchor="middle" font-size="8" fill="#8a7a6a">reach</text><text x="145" y="79" text-anchor="middle" font-size="8" fill="#16120e">Side-of-road</text><text x="145" y="93" text-anchor="middle" font-size="8" fill="#8a7a6a">driveways</text><rect x="196" y="20" width="86" height="108" rx="4" fill="#e8f5ee" stroke="#2a6048" stroke-width="1"/><text x="239" y="37" text-anchor="middle" font-size="9" fill="#2a6048" font-weight="500">Type III</text><text x="239" y="51" text-anchor="middle" font-size="8" fill="#8a7a6a">Medium lateral</text><text x="239" y="65" text-anchor="middle" font-size="8" fill="#2a6048">Most common</text><text x="239" y="79" text-anchor="middle" font-size="8" fill="#2a6048">Parking lots</text><text x="239" y="93" text-anchor="middle" font-size="8" fill="#2a6048">roadways</text><rect x="290" y="20" width="86" height="108" rx="4" fill="#fdfaf6" stroke="#7a3a9a" stroke-width=".8"/><text x="333" y="37" text-anchor="middle" font-size="9" fill="#7a3a9a" font-weight="500">Type IV</text><text x="333" y="51" text-anchor="middle" font-size="8" fill="#8a7a6a">Forward throw</text><text x="333" y="65" text-anchor="middle" font-size="8" fill="#8a7a6a">asymmetric</text><text x="333" y="79" text-anchor="middle" font-size="8" fill="#16120e">Perimeter</text><text x="333" y="93" text-anchor="middle" font-size="8" fill="#7a3a9a">wall mount</text><rect x="384" y="20" width="128" height="108" rx="4" fill="#e8eef8" stroke="#1857a0" stroke-width="1"/><text x="448" y="37" text-anchor="middle" font-size="9" fill="#1857a0" font-weight="500">Type V</text><text x="448" y="51" text-anchor="middle" font-size="8" fill="#8a7a6a">Circular</text><text x="448" y="65" text-anchor="middle" font-size="8" fill="#8a7a6a">symmetric</text><text x="448" y="79" text-anchor="middle" font-size="8" fill="#16120e">Pole-mounted</text><text x="448" y="93" text-anchor="middle" font-size="8" fill="#1857a0">centre of area</text><text x="448" y="107" text-anchor="middle" font-size="8" fill="#1857a0">parking lots</text></svg>`
,"6.3":`<svg viewBox="0 0 520 128" style="width:100%;height:auto" xmlns="http://www.w3.org/2000/svg"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">SPACING CRITERION AND UNIFORMITY</text><rect x="8" y="20" width="504" height="24" rx="4" fill="#fff5ee" stroke="#b85835" stroke-width=".8"/><text x="260" y="30" text-anchor="middle" font-size="10" fill="#b85835" font-weight="500">SC = Max spacing / Mounting height</text><text x="260" y="40" text-anchor="middle" font-size="8" fill="#8a7a6a">SC 1.3 at 3 m mounting height means max spacing = 3.9 m</text><rect x="8" y="52" width="242" height="68" rx="4" fill="#fdfaf6" stroke="#e4d9ca" stroke-width=".5"/><text x="129" y="69" text-anchor="middle" font-size="9" fill="#16120e" font-weight="500">Uniformity Emin / Eavg</text><text x="129" y="83" text-anchor="middle" font-size="8" fill="#2a6048">1:3 recommended offices</text><text x="129" y="97" text-anchor="middle" font-size="8" fill="#2a6048">1:5 acceptable general</text><text x="129" y="111" text-anchor="middle" font-size="8" fill="#8a7a6a">Verify with point-by-point calc</text><rect x="260" y="52" width="252" height="68" rx="4" fill="#e8f5ee" stroke="#2a6048" stroke-width=".8"/><text x="386" y="69" text-anchor="middle" font-size="9" fill="#2a6048" font-weight="500">SC typical values</text><text x="386" y="83" text-anchor="middle" font-size="8" fill="#8a7a6a">Narrow spot: SC 0.8 to 1.0</text><text x="386" y="97" text-anchor="middle" font-size="8" fill="#8a7a6a">Medium: SC 1.0 to 1.3</text><text x="386" y="111" text-anchor="middle" font-size="8" fill="#2a6048">Bat-wing: SC 1.3 to 1.5</text></svg>`
,"6.4":`<svg viewBox="0 0 520 128" style="width:100%;height:auto" xmlns="http://www.w3.org/2000/svg"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">TRIM TYPES: OPEN, BAFFLE, LENS / DIFFUSER</text><rect x="8" y="20" width="154" height="98" rx="5" fill="#fdfaf6" stroke="#e4d9ca" stroke-width=".5"/><text x="85" y="38" text-anchor="middle" font-size="9" fill="#16120e" font-weight="500">Open trim</text><text x="85" y="53" text-anchor="middle" font-size="8" fill="#8a7a6a">Source visible</text><text x="85" y="67" text-anchor="middle" font-size="8" fill="#8a7a6a">Highest output</text><text x="85" y="81" text-anchor="middle" font-size="8" fill="#cc3344">Highest glare</text><text x="85" y="95" text-anchor="middle" font-size="8" fill="#8a7a6a">Utility spaces only</text><rect x="172" y="20" width="154" height="98" rx="5" fill="#e8f5ee" stroke="#2a6048" stroke-width=".8"/><text x="249" y="38" text-anchor="middle" font-size="9" fill="#2a6048" font-weight="500">Baffle trim</text><text x="249" y="53" text-anchor="middle" font-size="8" fill="#8a7a6a">Black grooved cone</text><text x="249" y="67" text-anchor="middle" font-size="8" fill="#2a6048">Hides source</text><text x="249" y="81" text-anchor="middle" font-size="8" fill="#2a6048">Controls glare</text><text x="249" y="95" text-anchor="middle" font-size="8" fill="#8a7a6a">Office standard</text><rect x="336" y="20" width="176" height="98" rx="5" fill="#e8eef8" stroke="#1857a0" stroke-width=".8"/><text x="424" y="38" text-anchor="middle" font-size="9" fill="#1857a0" font-weight="500">Lens / Diffuser</text><text x="424" y="53" text-anchor="middle" font-size="8" fill="#8a7a6a">Frosted or prismatic</text><text x="424" y="67" text-anchor="middle" font-size="8" fill="#1857a0">Lowest luminance</text><text x="424" y="81" text-anchor="middle" font-size="8" fill="#1857a0">Soft distribution</text><text x="424" y="95" text-anchor="middle" font-size="8" fill="#8a7a6a">Healthcare, classrooms</text></svg>`
,"6.5":`<svg viewBox="0 0 520 128" style="width:100%;height:auto" xmlns="http://www.w3.org/2000/svg"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">EDGE-LIT PANEL VS WAVEGUIDE PANEL</text><rect x="8" y="20" width="242" height="98" rx="5" fill="#fdfaf6" stroke="#e4d9ca" stroke-width=".5"/><text x="129" y="38" text-anchor="middle" font-size="9" fill="#16120e" font-weight="500">Traditional edge-lit</text><text x="129" y="53" text-anchor="middle" font-size="8" fill="#8a7a6a">LEDs at perimeter edge</text><text x="129" y="67" text-anchor="middle" font-size="8" fill="#8a7a6a">LGP total internal reflection</text><text x="129" y="81" text-anchor="middle" font-size="8" fill="#cc3344">Bright edges vs dark centre</text><text x="129" y="95" text-anchor="middle" font-size="8" fill="#cc3344">30-40 pct uniformity</text><rect x="270" y="20" width="242" height="98" rx="5" fill="#e8f5ee" stroke="#2a6048" stroke-width=".8"/><text x="391" y="38" text-anchor="middle" font-size="9" fill="#2a6048" font-weight="500">Waveguide panel</text><text x="391" y="53" text-anchor="middle" font-size="8" fill="#8a7a6a">Micro-optic extraction dots</text><text x="391" y="67" text-anchor="middle" font-size="8" fill="#8a7a6a">engineered density gradient</text><text x="391" y="81" text-anchor="middle" font-size="8" fill="#2a6048">Uniform corner to corner</text><text x="391" y="95" text-anchor="middle" font-size="8" fill="#2a6048">60-80 pct or better uniformity</text></svg>`
,"6.6":`<svg viewBox="0 0 520 128" style="width:100%;height:auto" xmlns="http://www.w3.org/2000/svg"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">INTERIOR LIGHTING BY APPLICATION TYPE</text><rect x="8" y="20" width="154" height="98" rx="5" fill="#fdfaf6" stroke="#e4d9ca" stroke-width=".5"/><text x="85" y="38" text-anchor="middle" font-size="9" fill="#16120e" font-weight="500">Open Office</text><text x="85" y="53" text-anchor="middle" font-size="8" fill="#8a7a6a">300-500 lux</text><text x="85" y="67" text-anchor="middle" font-size="8" fill="#2a6048">UGR 19 or less</text><text x="85" y="81" text-anchor="middle" font-size="8" fill="#2a6048">Uniformity 1:3</text><text x="85" y="95" text-anchor="middle" font-size="8" fill="#8a7a6a">Controls integration</text><rect x="172" y="20" width="154" height="98" rx="5" fill="#e8f5ee" stroke="#2a6048" stroke-width=".8"/><text x="249" y="38" text-anchor="middle" font-size="9" fill="#2a6048" font-weight="500">Retail</text><text x="249" y="53" text-anchor="middle" font-size="8" fill="#8a7a6a">Ambient 300-500 lux</text><text x="249" y="67" text-anchor="middle" font-size="8" fill="#2a6048">Accent 3-5x ambient</text><text x="249" y="81" text-anchor="middle" font-size="8" fill="#2a6048">CRI 90 and R9 50 or more</text><text x="249" y="95" text-anchor="middle" font-size="8" fill="#8a7a6a">Adjustable track</text><rect x="336" y="20" width="176" height="98" rx="5" fill="#fff5ee" stroke="#b85835" stroke-width=".8"/><text x="424" y="38" text-anchor="middle" font-size="9" fill="#b85835" font-weight="500">Hospitality</text><text x="424" y="53" text-anchor="middle" font-size="8" fill="#8a7a6a">50-100 lux ambient</text><text x="424" y="67" text-anchor="middle" font-size="8" fill="#b85835">5:1 to 10:1 contrast</text><text x="424" y="81" text-anchor="middle" font-size="8" fill="#b85835">2700-3000K warm</text><text x="424" y="95" text-anchor="middle" font-size="8" fill="#8a7a6a">Dimming essential</text></svg>`
,"7.1":`<svg viewBox="0 0 520 128" style="width:100%;height:auto" xmlns="http://www.w3.org/2000/svg"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">BUG RATING: BACKLIGHT, UPLIGHT, GLARE</text><rect x="8" y="20" width="154" height="98" rx="5" fill="#fdfaf6" stroke="#e4d9ca" stroke-width=".5"/><text x="85" y="38" text-anchor="middle" font-size="9" fill="#b85835" font-weight="500">Backlight (B)</text><text x="85" y="53" text-anchor="middle" font-size="8" fill="#8a7a6a">Light behind fixture</text><text x="85" y="67" text-anchor="middle" font-size="8" fill="#8a7a6a">Spill onto property</text><text x="85" y="81" text-anchor="middle" font-size="8" fill="#cc3344">Rating B0-B5</text><text x="85" y="95" text-anchor="middle" font-size="8" fill="#8a7a6a">B0 = zero backlight</text><rect x="172" y="20" width="154" height="98" rx="5" fill="#e8eef8" stroke="#1857a0" stroke-width=".8"/><text x="249" y="38" text-anchor="middle" font-size="9" fill="#1857a0" font-weight="500">Uplight (U)</text><text x="249" y="53" text-anchor="middle" font-size="8" fill="#8a7a6a">Light above 90 deg</text><text x="249" y="67" text-anchor="middle" font-size="8" fill="#8a7a6a">Sky glow driver</text><text x="249" y="81" text-anchor="middle" font-size="8" fill="#1857a0">Rating U0-U5</text><text x="249" y="95" text-anchor="middle" font-size="8" fill="#1857a0">U0 = dark-sky safe</text><rect x="336" y="20" width="176" height="98" rx="5" fill="#e8f5ee" stroke="#2a6048" stroke-width=".8"/><text x="424" y="38" text-anchor="middle" font-size="9" fill="#2a6048" font-weight="500">Glare (G)</text><text x="424" y="53" text-anchor="middle" font-size="8" fill="#8a7a6a">High-angle forward light</text><text x="424" y="67" text-anchor="middle" font-size="8" fill="#8a7a6a">Discomfort to drivers</text><text x="424" y="81" text-anchor="middle" font-size="8" fill="#2a6048">Rating G0-G5</text><text x="424" y="95" text-anchor="middle" font-size="8" fill="#2a6048">Lower = less glare</text></svg>`
,"7.2":`<svg viewBox="0 0 520 128" style="width:100%;height:auto" xmlns="http://www.w3.org/2000/svg"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">DARK-SKY LIGHTING PRINCIPLES</text><rect x="8" y="20" width="504" height="98" rx="5" fill="#fdfaf6" stroke="#e4d9ca" stroke-width=".5"/><text x="260" y="38" text-anchor="middle" font-size="10" fill="#16120e" font-weight="500">Five dark-sky principles (IDA/IES Model Lighting Ordinance)</text><text x="260" y="54" text-anchor="middle" font-size="9" fill="#2a6048">1. Useful: light only what needs lighting</text><text x="260" y="68" text-anchor="middle" font-size="9" fill="#2a6048">2. Targeted: direct light downward, minimise spill</text><text x="260" y="82" text-anchor="middle" font-size="9" fill="#1857a0">3. Low level: use minimum light needed for the task</text><text x="260" y="96" text-anchor="middle" font-size="9" fill="#1857a0">4. Controlled: use timers, sensors, dimming at night</text><text x="260" y="110" text-anchor="middle" font-size="9" fill="#b85835">5. Warm colour: CCT 3000K or less reduces scatter and impact on wildlife</text></svg>`
,"7.3":`<svg viewBox="0 0 520 128" style="width:100%;height:auto" xmlns="http://www.w3.org/2000/svg"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">NFPA 101 EMERGENCY LIGHTING REQUIREMENTS</text><rect x="8" y="20" width="242" height="98" rx="5" fill="#fff5ee" stroke="#b85835" stroke-width=".8"/><text x="129" y="38" text-anchor="middle" font-size="10" fill="#b85835" font-weight="500">Illuminance levels</text><text x="129" y="53" text-anchor="middle" font-size="8" fill="#8a7a6a">Along egress path: 1 fc min (10 lux)</text><text x="129" y="67" text-anchor="middle" font-size="8" fill="#8a7a6a">Open floor areas: 0.1 fc avg (1 lux)</text><text x="129" y="81" text-anchor="middle" font-size="8" fill="#b85835">Max:min ratio 40:1</text><text x="129" y="95" text-anchor="middle" font-size="8" fill="#8a7a6a">At floor level</text><rect x="260" y="20" width="252" height="98" rx="5" fill="#e8eef8" stroke="#1857a0" stroke-width=".8"/><text x="386" y="38" text-anchor="middle" font-size="10" fill="#1857a0" font-weight="500">Duration and testing</text><text x="386" y="53" text-anchor="middle" font-size="8" fill="#8a7a6a">90-minute rated duration</text><text x="386" y="67" text-anchor="middle" font-size="8" fill="#8a7a6a">30-second functional test monthly</text><text x="386" y="81" text-anchor="middle" font-size="8" fill="#1857a0">90-minute load test annually</text><text x="386" y="95" text-anchor="middle" font-size="8" fill="#8a7a6a">Self-test / self-diagnostic units</text></svg>`
,"7.4":`<svg viewBox="0 0 520 128" style="width:100%;height:auto" xmlns="http://www.w3.org/2000/svg"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">EMERGENCY POWER SYSTEMS</text><rect x="8" y="20" width="154" height="98" rx="5" fill="#fdfaf6" stroke="#e4d9ca" stroke-width=".5"/><text x="85" y="38" text-anchor="middle" font-size="9" fill="#16120e" font-weight="500">Self-contained</text><text x="85" y="53" text-anchor="middle" font-size="8" fill="#8a7a6a">Battery in fixture</text><text x="85" y="67" text-anchor="middle" font-size="8" fill="#8a7a6a">Automatic on outage</text><text x="85" y="81" text-anchor="middle" font-size="8" fill="#2a6048">No special wiring</text><text x="85" y="95" text-anchor="middle" font-size="8" fill="#cc3344">Battery maintenance</text><rect x="172" y="20" width="154" height="98" rx="5" fill="#e8f5ee" stroke="#2a6048" stroke-width=".8"/><text x="249" y="38" text-anchor="middle" font-size="9" fill="#2a6048" font-weight="500">Central battery</text><text x="249" y="53" text-anchor="middle" font-size="8" fill="#8a7a6a">Central battery plant</text><text x="249" y="67" text-anchor="middle" font-size="8" fill="#8a7a6a">feeds emergency circuit</text><text x="249" y="81" text-anchor="middle" font-size="8" fill="#2a6048">Central maintenance</text><text x="249" y="95" text-anchor="middle" font-size="8" fill="#2a6048">Large buildings</text><rect x="336" y="20" width="176" height="98" rx="5" fill="#e8eef8" stroke="#1857a0" stroke-width=".8"/><text x="424" y="38" text-anchor="middle" font-size="9" fill="#1857a0" font-weight="500">Generator transfer</text><text x="424" y="53" text-anchor="middle" font-size="8" fill="#8a7a6a">Generator with ATS</text><text x="424" y="67" text-anchor="middle" font-size="8" fill="#8a7a6a">10-second transfer req.</text><text x="424" y="81" text-anchor="middle" font-size="8" fill="#1857a0">Hospitals and critical</text><text x="424" y="95" text-anchor="middle" font-size="8" fill="#1857a0">NEC Art 700</text></svg>`
,"7.5":`<svg viewBox="0 0 520 128" style="width:100%;height:auto" xmlns="http://www.w3.org/2000/svg"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">EXIT SIGNS AND EGRESS LIGHTING CODE</text><rect x="8" y="20" width="242" height="98" rx="5" fill="#fdfaf6" stroke="#e4d9ca" stroke-width=".5"/><text x="129" y="38" text-anchor="middle" font-size="9" fill="#16120e" font-weight="500">Exit sign requirements</text><text x="129" y="53" text-anchor="middle" font-size="8" fill="#8a7a6a">Visible from any point on egress path</text><text x="129" y="67" text-anchor="middle" font-size="8" fill="#8a7a6a">Max viewing distance 100 ft (6-in letters)</text><text x="129" y="81" text-anchor="middle" font-size="8" fill="#b85835">Battery or 2-circuit wiring</text><text x="129" y="95" text-anchor="middle" font-size="8" fill="#b85835">IBC and NFPA 101 required</text><rect x="260" y="20" width="252" height="98" rx="5" fill="#e8f5ee" stroke="#2a6048" stroke-width=".8"/><text x="386" y="38" text-anchor="middle" font-size="9" fill="#2a6048" font-weight="500">Egress lighting path</text><text x="386" y="53" text-anchor="middle" font-size="8" fill="#8a7a6a">Corridors, stairs, exits</text><text x="386" y="67" text-anchor="middle" font-size="8" fill="#2a6048">1 fc at floor (NFPA 101)</text><text x="386" y="81" text-anchor="middle" font-size="8" fill="#2a6048">Instant on at power loss</text><text x="386" y="95" text-anchor="middle" font-size="8" fill="#8a7a6a">LED now dominant</text></svg>`
,"7.6":`<svg viewBox="0 0 520 128" style="width:100%;height:auto" xmlns="http://www.w3.org/2000/svg"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">EXTERIOR LIGHTING CODE COMPLIANCE</text><rect x="8" y="20" width="504" height="26" rx="4" fill="#fff5ee" stroke="#b85835" stroke-width=".8"/><text x="260" y="31" text-anchor="middle" font-size="9" fill="#b85835" font-weight="500">ASHRAE 90.1 Exterior LPD allowances by application</text><text x="260" y="41" text-anchor="middle" font-size="8" fill="#8a7a6a">Parking lots: 0.15 W/sqft max. Walkways: 1.0 W/linft max. Building facades: 1.0 W/sqft max</text><rect x="8" y="54" width="242" height="68" rx="4" fill="#fdfaf6" stroke="#e4d9ca" stroke-width=".5"/><text x="129" y="72" text-anchor="middle" font-size="9" fill="#16120e" font-weight="500">Lighting zones LZ0-LZ4</text><text x="129" y="86" text-anchor="middle" font-size="8" fill="#8a7a6a">LZ0 = natural dark wilderness</text><text x="129" y="100" text-anchor="middle" font-size="8" fill="#8a7a6a">LZ4 = high-density commercial</text><text x="129" y="114" text-anchor="middle" font-size="8" fill="#8a7a6a">Sets max luminaire flux</text><rect x="260" y="54" width="252" height="68" rx="4" fill="#e8eef8" stroke="#1857a0" stroke-width=".8"/><text x="386" y="72" text-anchor="middle" font-size="9" fill="#1857a0" font-weight="500">Curfew provisions</text><text x="386" y="86" text-anchor="middle" font-size="8" fill="#1857a0">Dim or off after 11pm</text><text x="386" y="100" text-anchor="middle" font-size="8" fill="#8a7a6a">Reduces energy and sky glow</text><text x="386" y="114" text-anchor="middle" font-size="8" fill="#8a7a6a">IECC and many local codes</text></svg>`
,"8.1":`<svg viewBox="0 0 520 128" style="width:100%;height:auto" xmlns="http://www.w3.org/2000/svg"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">HIGH-BAY VS LOW-BAY MOUNTING</text><rect x="8" y="20" width="242" height="98" rx="5" fill="#fdfaf6" stroke="#e4d9ca" stroke-width=".5"/><text x="129" y="38" text-anchor="middle" font-size="9" fill="#16120e" font-weight="500">Low-bay</text><text x="129" y="53" text-anchor="middle" font-size="8" fill="#8a7a6a">Mounting 4.5-7.5 m (15-25 ft)</text><text x="129" y="67" text-anchor="middle" font-size="8" fill="#2a6048">Wide-distribution optic</text><text x="129" y="81" text-anchor="middle" font-size="8" fill="#8a7a6a">Retail back-of-house</text><text x="129" y="95" text-anchor="middle" font-size="8" fill="#8a7a6a">Light manufacturing</text><rect x="270" y="20" width="242" height="98" rx="5" fill="#e8f5ee" stroke="#2a6048" stroke-width=".8"/><text x="391" y="38" text-anchor="middle" font-size="9" fill="#2a6048" font-weight="500">High-bay</text><text x="391" y="53" text-anchor="middle" font-size="8" fill="#8a7a6a">Mounting 7.5 m and above (25 ft+)</text><text x="391" y="67" text-anchor="middle" font-size="8" fill="#2a6048">Narrow-to-medium optic</text><text x="391" y="81" text-anchor="middle" font-size="8" fill="#2a6048">Warehouses, manufacturing</text><text x="391" y="95" text-anchor="middle" font-size="8" fill="#2a6048">Sports halls, arenas</text></svg>`
,"8.2":`<svg viewBox="0 0 520 128" style="width:100%;height:auto" xmlns="http://www.w3.org/2000/svg"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">IP, IK AND NEMA RATINGS</text><rect x="8" y="20" width="154" height="98" rx="5" fill="#fdfaf6" stroke="#e4d9ca" stroke-width=".5"/><text x="85" y="38" text-anchor="middle" font-size="9" fill="#b85835" font-weight="500">IP rating</text><text x="85" y="53" text-anchor="middle" font-size="8" fill="#8a7a6a">IP XX: dust + water</text><text x="85" y="67" text-anchor="middle" font-size="8" fill="#16120e">IP65 = dust-tight</text><text x="85" y="81" text-anchor="middle" font-size="8" fill="#16120e">+ low-pressure jet</text><text x="85" y="95" text-anchor="middle" font-size="8" fill="#8a7a6a">Wet locations min</text><rect x="172" y="20" width="154" height="98" rx="5" fill="#e8eef8" stroke="#1857a0" stroke-width=".8"/><text x="249" y="38" text-anchor="middle" font-size="9" fill="#1857a0" font-weight="500">IK rating</text><text x="249" y="53" text-anchor="middle" font-size="8" fill="#8a7a6a">Impact protection</text><text x="249" y="67" text-anchor="middle" font-size="8" fill="#1857a0">IK08 = 5 J impact</text><text x="249" y="81" text-anchor="middle" font-size="8" fill="#1857a0">IK10 = 20 J impact</text><text x="249" y="95" text-anchor="middle" font-size="8" fill="#8a7a6a">Industrial/sports</text><rect x="336" y="20" width="176" height="98" rx="5" fill="#e8f5ee" stroke="#2a6048" stroke-width=".8"/><text x="424" y="38" text-anchor="middle" font-size="9" fill="#2a6048" font-weight="500">NEMA enclosure</text><text x="424" y="53" text-anchor="middle" font-size="8" fill="#8a7a6a">NEMA 3R = rain</text><text x="424" y="67" text-anchor="middle" font-size="8" fill="#8a7a6a">NEMA 4 = hose-down</text><text x="424" y="81" text-anchor="middle" font-size="8" fill="#2a6048">NEMA 4X = corrosive</text><text x="424" y="95" text-anchor="middle" font-size="8" fill="#8a7a6a">North American std</text></svg>`
,"8.3":`<svg viewBox="0 0 520 128" style="width:100%;height:auto" xmlns="http://www.w3.org/2000/svg"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">HAZARDOUS LOCATIONS: CLASS AND DIVISION</text><rect x="8" y="20" width="242" height="98" rx="5" fill="#fff5ee" stroke="#b85835" stroke-width=".8"/><text x="129" y="38" text-anchor="middle" font-size="9" fill="#b85835" font-weight="500">Class I</text><text x="129" y="53" text-anchor="middle" font-size="8" fill="#8a7a6a">Flammable gases or vapours</text><text x="129" y="67" text-anchor="middle" font-size="8" fill="#8a7a6a">Petroleum, paint, chemicals</text><text x="129" y="81" text-anchor="middle" font-size="8" fill="#b85835">Div 1: hazard present normally</text><text x="129" y="95" text-anchor="middle" font-size="8" fill="#8a7a6a">Div 2: hazard only if fault</text><rect x="270" y="20" width="242" height="98" rx="5" fill="#fdfaf6" stroke="#e4d9ca" stroke-width=".5"/><text x="391" y="38" text-anchor="middle" font-size="9" fill="#16120e" font-weight="500">Class II and III</text><text x="391" y="53" text-anchor="middle" font-size="8" fill="#8a7a6a">Class II: combustible dust</text><text x="391" y="67" text-anchor="middle" font-size="8" fill="#8a7a6a">Grain, flour, coal dust</text><text x="391" y="81" text-anchor="middle" font-size="8" fill="#8a7a6a">Class III: ignitable fibres</text><text x="391" y="95" text-anchor="middle" font-size="8" fill="#8a7a6a">Textiles, woodworking</text></svg>`
,"8.4":`<svg viewBox="0 0 520 128" style="width:100%;height:auto" xmlns="http://www.w3.org/2000/svg"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">CIRCADIAN RHYTHMS AND ipRGC LIGHTING</text><rect x="8" y="20" width="504" height="26" rx="4" fill="#e8eef8" stroke="#1857a0" stroke-width=".8"/><text x="260" y="31" text-anchor="middle" font-size="9" fill="#1857a0" font-weight="500">ipRGC melanopsin pathway: light input at 480 nm drives SCN circadian clock</text><text x="260" y="41" text-anchor="middle" font-size="8" fill="#8a7a6a">High EML morning = alertness and cortisol. Low EML evening = melatonin release for sleep onset</text><rect x="8" y="54" width="242" height="68" rx="4" fill="#fdfaf6" stroke="#e4d9ca" stroke-width=".5"/><text x="129" y="72" text-anchor="middle" font-size="9" fill="#16120e" font-weight="500">Morning protocol</text><text x="129" y="86" text-anchor="middle" font-size="8" fill="#2a6048">200 EML or more at eye</text><text x="129" y="100" text-anchor="middle" font-size="8" fill="#2a6048">CCT 4000-6500K preferred</text><text x="129" y="114" text-anchor="middle" font-size="8" fill="#8a7a6a">Supports alertness onset</text><rect x="260" y="54" width="252" height="68" rx="4" fill="#fff5ee" stroke="#b85835" stroke-width=".8"/><text x="386" y="72" text-anchor="middle" font-size="9" fill="#b85835" font-weight="500">Evening protocol</text><text x="386" y="86" text-anchor="middle" font-size="8" fill="#b85835">Low EML, CCT 2700K or less</text><text x="386" y="100" text-anchor="middle" font-size="8" fill="#8a7a6a">Allows melatonin production</text><text x="386" y="114" text-anchor="middle" font-size="8" fill="#8a7a6a">Tunable white system</text></svg>`
,"8.5":`<svg viewBox="0 0 520 128" style="width:100%;height:auto" xmlns="http://www.w3.org/2000/svg"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">WELL v2 LIGHT CONCEPT REQUIREMENTS</text><rect x="8" y="20" width="242" height="98" rx="5" fill="#e8eef8" stroke="#1857a0" stroke-width=".8"/><text x="129" y="38" text-anchor="middle" font-size="9" fill="#1857a0" font-weight="500">Preconditions (mandatory)</text><text x="129" y="53" text-anchor="middle" font-size="8" fill="#8a7a6a">L01: Light design documentation</text><text x="129" y="67" text-anchor="middle" font-size="8" fill="#1857a0">L02: Min illuminance + UGR 22 or less</text><text x="129" y="81" text-anchor="middle" font-size="8" fill="#1857a0">L03: Flicker limits per spec</text><text x="129" y="95" text-anchor="middle" font-size="8" fill="#8a7a6a">All must be met for certification</text><rect x="270" y="20" width="242" height="98" rx="5" fill="#e8f5ee" stroke="#2a6048" stroke-width=".8"/><text x="391" y="38" text-anchor="middle" font-size="9" fill="#2a6048" font-weight="500">Optimizations (scored)</text><text x="391" y="53" text-anchor="middle" font-size="8" fill="#2a6048">L04: 200 EML or more at eye AM</text><text x="391" y="67" text-anchor="middle" font-size="8" fill="#2a6048">L05: CRI 90 and R9 50 or more</text><text x="391" y="81" text-anchor="middle" font-size="8" fill="#2a6048">L06: sDA 55% and ASE 10% or less</text><text x="391" y="95" text-anchor="middle" font-size="8" fill="#8a7a6a">Each earns additional points</text></svg>`
,"8.6":`<svg viewBox="0 0 520 128" style="width:100%;height:auto" xmlns="http://www.w3.org/2000/svg"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">INDUSTRIAL LIGHTING: IES RP-7 RECOMMENDATIONS</text><rect x="8" y="20" width="154" height="98" rx="5" fill="#fdfaf6" stroke="#e4d9ca" stroke-width=".5"/><text x="85" y="38" text-anchor="middle" font-size="9" fill="#16120e" font-weight="500">Rough service</text><text x="85" y="53" text-anchor="middle" font-size="8" fill="#8a7a6a">Warehouse storage</text><text x="85" y="67" text-anchor="middle" font-size="8" fill="#8a7a6a">200-300 lux</text><text x="85" y="81" text-anchor="middle" font-size="8" fill="#8a7a6a">Ra 60-70 acceptable</text><text x="85" y="95" text-anchor="middle" font-size="8" fill="#8a7a6a">IP65 minimum</text><rect x="172" y="20" width="154" height="98" rx="5" fill="#e8f5ee" stroke="#2a6048" stroke-width=".8"/><text x="249" y="38" text-anchor="middle" font-size="9" fill="#2a6048" font-weight="500">Manufacturing</text><text x="249" y="53" text-anchor="middle" font-size="8" fill="#8a7a6a">Assembly, machining</text><text x="249" y="67" text-anchor="middle" font-size="8" fill="#2a6048">500-1000 lux task</text><text x="249" y="81" text-anchor="middle" font-size="8" fill="#2a6048">Ra 80 minimum</text><text x="249" y="95" text-anchor="middle" font-size="8" fill="#8a7a6a">Glare control critical</text><rect x="336" y="20" width="176" height="98" rx="5" fill="#fff5ee" stroke="#b85835" stroke-width=".8"/><text x="424" y="38" text-anchor="middle" font-size="9" fill="#b85835" font-weight="500">Critical inspection</text><text x="424" y="53" text-anchor="middle" font-size="8" fill="#8a7a6a">QC, colour matching</text><text x="424" y="67" text-anchor="middle" font-size="8" fill="#b85835">1000-2000 lux</text><text x="424" y="81" text-anchor="middle" font-size="8" fill="#b85835">Ra 90 minimum</text><text x="424" y="95" text-anchor="middle" font-size="8" fill="#b85835">D65 evaluation source</text></svg>`
,"9.1":`<svg viewBox="0 0 520 128" style="width:100%;height:auto" xmlns="http://www.w3.org/2000/svg"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">ASHRAE 90.1 LPD ALLOWANCES</text><rect x="8" y="20" width="504" height="22" rx="3" fill="#fff5ee" stroke="#b85835" stroke-width=".8"/><text x="260" y="35" text-anchor="middle" font-size="9" fill="#b85835" font-weight="500">Interior LPD limits W/sqft, Building Area Method, 90.1-2019</text><rect x="8" y="48" width="116" height="70" rx="4" fill="#fdfaf6" stroke="#e4d9ca" stroke-width=".5"/><text x="66" y="65" text-anchor="middle" font-size="8" fill="#16120e" font-weight="500">Office</text><text x="66" y="79" text-anchor="middle" font-size="9" fill="#b85835" font-weight="500">0.82 W/sqft</text><rect x="132" y="48" width="116" height="70" rx="4" fill="#fdfaf6" stroke="#e4d9ca" stroke-width=".5"/><text x="190" y="65" text-anchor="middle" font-size="8" fill="#16120e" font-weight="500">Retail</text><text x="190" y="79" text-anchor="middle" font-size="9" fill="#b85835" font-weight="500">1.26 W/sqft</text><rect x="256" y="48" width="116" height="70" rx="4" fill="#fdfaf6" stroke="#e4d9ca" stroke-width=".5"/><text x="314" y="65" text-anchor="middle" font-size="8" fill="#16120e" font-weight="500">Warehouse</text><text x="314" y="79" text-anchor="middle" font-size="9" fill="#2a6048" font-weight="500">0.60 W/sqft</text><rect x="380" y="48" width="132" height="70" rx="4" fill="#fdfaf6" stroke="#e4d9ca" stroke-width=".5"/><text x="446" y="65" text-anchor="middle" font-size="8" fill="#16120e" font-weight="500">Healthcare</text><text x="446" y="79" text-anchor="middle" font-size="9" fill="#1857a0" font-weight="500">1.05 W/sqft</text></svg>`
,"9.2":`<svg viewBox="0 0 520 128" style="width:100%;height:auto" xmlns="http://www.w3.org/2000/svg"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">TITLE 24 PART 6: CALIFORNIA ENERGY CODE</text><rect x="8" y="20" width="242" height="98" rx="5" fill="#fff5ee" stroke="#b85835" stroke-width=".8"/><text x="129" y="38" text-anchor="middle" font-size="9" fill="#b85835" font-weight="500">Prescriptive path</text><text x="129" y="53" text-anchor="middle" font-size="8" fill="#8a7a6a">Space-by-space LPA limits</text><text x="129" y="67" text-anchor="middle" font-size="8" fill="#8a7a6a">W/sqft by space type</text><text x="129" y="81" text-anchor="middle" font-size="8" fill="#b85835">Mandatory controls</text><text x="129" y="95" text-anchor="middle" font-size="8" fill="#8a7a6a">Occupancy and daylighting</text><rect x="270" y="20" width="242" height="98" rx="5" fill="#e8f5ee" stroke="#2a6048" stroke-width=".8"/><text x="391" y="38" text-anchor="middle" font-size="9" fill="#2a6048" font-weight="500">Performance path</text><text x="391" y="53" text-anchor="middle" font-size="8" fill="#8a7a6a">Whole-building energy model</text><text x="391" y="67" text-anchor="middle" font-size="8" fill="#8a7a6a">TDV energy budget</text><text x="391" y="81" text-anchor="middle" font-size="8" fill="#2a6048">More design flexibility</text><text x="391" y="95" text-anchor="middle" font-size="8" fill="#8a7a6a">Requires certified analyst</text></svg>`
,"9.3":`<svg viewBox="0 0 520 128" style="width:100%;height:auto" xmlns="http://www.w3.org/2000/svg"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">sDA AND ASE DAYLIGHT METRICS</text><rect x="8" y="20" width="242" height="98" rx="5" fill="#e8eef8" stroke="#1857a0" stroke-width=".8"/><text x="129" y="38" text-anchor="middle" font-size="9" fill="#1857a0" font-weight="500">sDA</text><text x="129" y="53" text-anchor="middle" font-size="8" fill="#8a7a6a">Pct floor area at 300 lux or more</text><text x="129" y="67" text-anchor="middle" font-size="8" fill="#8a7a6a">for 50 pct of occupied hours</text><text x="129" y="81" text-anchor="middle" font-size="8" fill="#1857a0">sDA 55 pct = LEED 1 pt</text><text x="129" y="95" text-anchor="middle" font-size="8" fill="#1857a0">sDA 75 pct = LEED 2 pts</text><rect x="270" y="20" width="242" height="98" rx="5" fill="#fff5ee" stroke="#b85835" stroke-width=".8"/><text x="391" y="38" text-anchor="middle" font-size="9" fill="#b85835" font-weight="500">ASE</text><text x="391" y="53" text-anchor="middle" font-size="8" fill="#8a7a6a">Pct floor area at 1000 lux or more</text><text x="391" y="67" text-anchor="middle" font-size="8" fill="#8a7a6a">for 250 or more occupied hours</text><text x="391" y="81" text-anchor="middle" font-size="8" fill="#b85835">ASE 10 pct max for LEED</text><text x="391" y="95" text-anchor="middle" font-size="8" fill="#b85835">Limits glare and heat gain</text></svg>`
,"9.4":`<svg viewBox="0 0 520 128" style="width:100%;height:auto" xmlns="http://www.w3.org/2000/svg"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">RoHS, EPD AND HPD DECLARATIONS</text><rect x="8" y="20" width="154" height="98" rx="5" fill="#fdfaf6" stroke="#e4d9ca" stroke-width=".5"/><text x="85" y="38" text-anchor="middle" font-size="9" fill="#b85835" font-weight="500">RoHS</text><text x="85" y="53" text-anchor="middle" font-size="8" fill="#8a7a6a">Restricts Pb, Hg, Cd, Cr6+</text><text x="85" y="67" text-anchor="middle" font-size="8" fill="#8a7a6a">in electronic equipment</text><text x="85" y="81" text-anchor="middle" font-size="8" fill="#b85835">Mandatory EU and UK</text><text x="85" y="95" text-anchor="middle" font-size="8" fill="#8a7a6a">Global baseline standard</text><rect x="172" y="20" width="154" height="98" rx="5" fill="#e8f5ee" stroke="#2a6048" stroke-width=".8"/><text x="249" y="38" text-anchor="middle" font-size="9" fill="#2a6048" font-weight="500">EPD</text><text x="249" y="53" text-anchor="middle" font-size="8" fill="#8a7a6a">Environmental Product Decl.</text><text x="249" y="67" text-anchor="middle" font-size="8" fill="#8a7a6a">ISO 14025 lifecycle</text><text x="249" y="81" text-anchor="middle" font-size="8" fill="#2a6048">GWP carbon footprint</text><text x="249" y="95" text-anchor="middle" font-size="8" fill="#2a6048">LEED MR credit</text><rect x="336" y="20" width="176" height="98" rx="5" fill="#e8eef8" stroke="#1857a0" stroke-width=".8"/><text x="424" y="38" text-anchor="middle" font-size="9" fill="#1857a0" font-weight="500">HPD</text><text x="424" y="53" text-anchor="middle" font-size="8" fill="#8a7a6a">Health Product Declaration</text><text x="424" y="67" text-anchor="middle" font-size="8" fill="#8a7a6a">All ingredients 100 ppm or more</text><text x="424" y="81" text-anchor="middle" font-size="8" fill="#1857a0">Material health disclosure</text><text x="424" y="95" text-anchor="middle" font-size="8" fill="#1857a0">LEED MR credit</text></svg>`
,"9.5":`<svg viewBox="0 0 520 128" style="width:100%;height:auto" xmlns="http://www.w3.org/2000/svg"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">LIFE-CYCLE COST ANALYSIS</text><rect x="8" y="20" width="504" height="24" rx="4" fill="#fff5ee" stroke="#b85835" stroke-width=".8"/><text x="260" y="31" text-anchor="middle" font-size="9" fill="#b85835" font-weight="500">LCC = First cost + PV(energy) + PV(maintenance) + PV(disposal)</text><text x="260" y="41" text-anchor="middle" font-size="8" fill="#8a7a6a">Present value over 10-20 year analysis period</text><rect x="8" y="52" width="116" height="68" rx="4" fill="#fdfaf6" stroke="#e4d9ca" stroke-width=".5"/><text x="66" y="70" text-anchor="middle" font-size="9" fill="#16120e" font-weight="500">First cost</text><text x="66" y="84" text-anchor="middle" font-size="8" fill="#8a7a6a">Luminaires, install</text><text x="66" y="98" text-anchor="middle" font-size="8" fill="#8a7a6a">Controls, commissioning</text><rect x="132" y="52" width="116" height="68" rx="4" fill="#e8f5ee" stroke="#2a6048" stroke-width=".8"/><text x="190" y="70" text-anchor="middle" font-size="9" fill="#2a6048" font-weight="500">Energy</text><text x="190" y="84" text-anchor="middle" font-size="8" fill="#2a6048">kWh x utility rate</text><text x="190" y="98" text-anchor="middle" font-size="8" fill="#2a6048">Largest LCC component</text><rect x="256" y="52" width="116" height="68" rx="4" fill="#e8eef8" stroke="#1857a0" stroke-width=".8"/><text x="314" y="70" text-anchor="middle" font-size="9" fill="#1857a0" font-weight="500">Maintenance</text><text x="314" y="84" text-anchor="middle" font-size="8" fill="#1857a0">Lamp replacements</text><text x="314" y="98" text-anchor="middle" font-size="8" fill="#1857a0">Cleaning and labour</text><rect x="380" y="52" width="132" height="68" rx="4" fill="#fdfaf6" stroke="#e4d9ca" stroke-width=".5"/><text x="446" y="70" text-anchor="middle" font-size="9" fill="#16120e" font-weight="500">Rebates</text><text x="446" y="84" text-anchor="middle" font-size="8" fill="#8a7a6a">Utility incentives</text><text x="446" y="98" text-anchor="middle" font-size="8" fill="#8a7a6a">Reduce first cost 30-70 pct</text></svg>`
,"9.6":`<svg viewBox="0 0 520 128" style="width:100%;height:auto" xmlns="http://www.w3.org/2000/svg"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">LEED v4.1 LIGHTING CREDITS SUMMARY</text><rect x="8" y="20" width="504" height="98" rx="5" fill="#fdfaf6" stroke="#e4d9ca" stroke-width=".5"/><text x="260" y="38" text-anchor="middle" font-size="10" fill="#16120e" font-weight="500">LEED v4.1 BD+C Lighting-related credits</text><text x="260" y="54" text-anchor="middle" font-size="8" fill="#2a6048">EQ Interior Lighting: individual controls 90 pct and quality metrics CRI 90 R9 50</text><text x="260" y="68" text-anchor="middle" font-size="8" fill="#2a6048">Daylight: sDA 55 pct = 1 pt, sDA 75 pct = 2 pts with ASE 10 pct max</text><text x="260" y="82" text-anchor="middle" font-size="8" fill="#1857a0">EA Energy: LPD reduction contributes to energy savings percentage credits</text><text x="260" y="96" text-anchor="middle" font-size="8" fill="#b85835">MR Materials: EPD and HPD for luminaires count toward disclosure credits</text><text x="260" y="110" text-anchor="middle" font-size="8" fill="#8a7a6a">SS Light Pollution: full cutoff, U0, warm CCT below 3000K</text></svg>`
,"10.1":`<svg viewBox="0 0 520 128" style="width:100%;height:auto" xmlns="http://www.w3.org/2000/svg"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">DESIGN PHASES: PROGRAMMING AND SCHEMATIC</text><rect x="8" y="20" width="242" height="98" rx="5" fill="#fff5ee" stroke="#b85835" stroke-width=".8"/><text x="129" y="38" text-anchor="middle" font-size="9" fill="#b85835" font-weight="500">Programming and Pre-design</text><text x="129" y="53" text-anchor="middle" font-size="8" fill="#8a7a6a">Owner Project Requirements</text><text x="129" y="67" text-anchor="middle" font-size="8" fill="#8a7a6a">CCT, Ra, budget, certifications</text><text x="129" y="81" text-anchor="middle" font-size="8" fill="#8a7a6a">Controls and aesthetic intent</text><text x="129" y="95" text-anchor="middle" font-size="8" fill="#b85835">Engage LD at this phase</text><rect x="270" y="20" width="242" height="98" rx="5" fill="#e8f5ee" stroke="#2a6048" stroke-width=".8"/><text x="391" y="38" text-anchor="middle" font-size="9" fill="#2a6048" font-weight="500">Schematic Design (SD)</text><text x="391" y="53" text-anchor="middle" font-size="8" fill="#8a7a6a">Concept luminaire families</text><text x="391" y="67" text-anchor="middle" font-size="8" fill="#2a6048">Preliminary photometric layouts</text><text x="391" y="81" text-anchor="middle" font-size="8" fill="#2a6048">Code compliance strategy</text><text x="391" y="95" text-anchor="middle" font-size="8" fill="#8a7a6a">Owner presentation and approval</text></svg>`
,"10.2":`<svg viewBox="0 0 520 128" style="width:100%;height:auto" xmlns="http://www.w3.org/2000/svg"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">DESIGN DEVELOPMENT: SCHEDULE AND CALCULATIONS</text><rect x="8" y="20" width="242" height="98" rx="5" fill="#e8eef8" stroke="#1857a0" stroke-width=".8"/><text x="129" y="38" text-anchor="middle" font-size="9" fill="#1857a0" font-weight="500">DD Fixture Schedule</text><text x="129" y="53" text-anchor="middle" font-size="8" fill="#8a7a6a">Type, manufacturer, wattage</text><text x="129" y="67" text-anchor="middle" font-size="8" fill="#8a7a6a">CCT, CRI, dimming, IP, mount</text><text x="129" y="81" text-anchor="middle" font-size="8" fill="#1857a0">LM-79 and DLC referenced</text><text x="129" y="95" text-anchor="middle" font-size="8" fill="#8a7a6a">Equal-or-better criteria defined</text><rect x="270" y="20" width="242" height="98" rx="5" fill="#e8f5ee" stroke="#2a6048" stroke-width=".8"/><text x="391" y="38" text-anchor="middle" font-size="9" fill="#2a6048" font-weight="500">DD Calculations</text><text x="391" y="53" text-anchor="middle" font-size="8" fill="#8a7a6a">AGi32 or DIALux with actual IES</text><text x="391" y="67" text-anchor="middle" font-size="8" fill="#2a6048">Verify illuminance, uniformity</text><text x="391" y="81" text-anchor="middle" font-size="8" fill="#2a6048">LPD, UGR, EML against spec</text><text x="391" y="95" text-anchor="middle" font-size="8" fill="#8a7a6a">LEED and code compliance check</text></svg>`
,"10.3":`<svg viewBox="0 0 520 128" style="width:100%;height:auto" xmlns="http://www.w3.org/2000/svg"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">MOCK-UPS AND FIELD REVIEW</text><rect x="8" y="20" width="242" height="98" rx="5" fill="#fdfaf6" stroke="#e4d9ca" stroke-width=".5"/><text x="129" y="38" text-anchor="middle" font-size="9" fill="#16120e" font-weight="500">Why mock-ups matter</text><text x="129" y="53" text-anchor="middle" font-size="8" fill="#8a7a6a">Confirm CCT and CRI in context</text><text x="129" y="67" text-anchor="middle" font-size="8" fill="#8a7a6a">Verify dimming performance</text><text x="129" y="81" text-anchor="middle" font-size="8" fill="#b85835">Reveal glare problems early</text><text x="129" y="95" text-anchor="middle" font-size="8" fill="#8a7a6a">Owner sign-off before purchase</text><rect x="270" y="20" width="242" height="98" rx="5" fill="#e8f5ee" stroke="#2a6048" stroke-width=".8"/><text x="391" y="38" text-anchor="middle" font-size="9" fill="#2a6048" font-weight="500">Mock-up protocol</text><text x="391" y="53" text-anchor="middle" font-size="8" fill="#8a7a6a">Full-size section, all finalists</text><text x="391" y="67" text-anchor="middle" font-size="8" fill="#2a6048">Measure actual illuminance</text><text x="391" y="81" text-anchor="middle" font-size="8" fill="#2a6048">Document and photograph</text><text x="391" y="95" text-anchor="middle" font-size="8" fill="#8a7a6a">Owner sign-off on record</text></svg>`
,"10.4":`<svg viewBox="0 0 520 128" style="width:100%;height:auto" xmlns="http://www.w3.org/2000/svg"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">MEP AND STRUCTURAL COORDINATION</text><rect x="8" y="20" width="504" height="98" rx="5" fill="#fdfaf6" stroke="#e4d9ca" stroke-width=".5"/><text x="260" y="38" text-anchor="middle" font-size="10" fill="#16120e" font-weight="500">Common coordination conflicts</text><text x="260" y="54" text-anchor="middle" font-size="8" fill="#b85835">Structural: downlights conflict with beams, joists, or post-tensioned slabs</text><text x="260" y="68" text-anchor="middle" font-size="8" fill="#1857a0">Mechanical: luminaires blocked by ductwork, diffusers, or sprinkler heads</text><text x="260" y="82" text-anchor="middle" font-size="8" fill="#2a6048">Ceiling grid: luminaire module must align with 2x2 or 2x4 grid</text><text x="260" y="96" text-anchor="middle" font-size="8" fill="#8a7a6a">Electrical: circuit loading, neutral sizing for THD, AFCI compatibility</text><text x="260" y="110" text-anchor="middle" font-size="8" fill="#8a7a6a">BIM clash detection before permit drawings issued</text></svg>`
,"10.5":`<svg viewBox="0 0 520 128" style="width:100%;height:auto" xmlns="http://www.w3.org/2000/svg"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">CONTROLS SEQUENCE OF OPERATIONS</text><rect x="8" y="20" width="242" height="98" rx="5" fill="#e8eef8" stroke="#1857a0" stroke-width=".8"/><text x="129" y="38" text-anchor="middle" font-size="9" fill="#1857a0" font-weight="500">Controls documentation</text><text x="129" y="53" text-anchor="middle" font-size="8" fill="#8a7a6a">Sequence of operations narrative</text><text x="129" y="67" text-anchor="middle" font-size="8" fill="#8a7a6a">Control zone drawings</text><text x="129" y="81" text-anchor="middle" font-size="8" fill="#1857a0">Scene levels and emergency modes</text><text x="129" y="95" text-anchor="middle" font-size="8" fill="#8a7a6a">Programming reference document</text><rect x="270" y="20" width="242" height="98" rx="5" fill="#e8f5ee" stroke="#2a6048" stroke-width=".8"/><text x="391" y="38" text-anchor="middle" font-size="9" fill="#2a6048" font-weight="500">ASHRAE 90.1 mandatory controls</text><text x="391" y="53" text-anchor="middle" font-size="8" fill="#8a7a6a">Automatic shutoff required</text><text x="391" y="67" text-anchor="middle" font-size="8" fill="#2a6048">Occupancy sensing per Table 9.4.1</text><text x="391" y="81" text-anchor="middle" font-size="8" fill="#2a6048">Daylight zones: photosensors</text><text x="391" y="95" text-anchor="middle" font-size="8" fill="#2a6048">Demand response capability</text></svg>`
,"10.6":`<svg viewBox="0 0 520 128" style="width:100%;height:auto" xmlns="http://www.w3.org/2000/svg"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">CONSTRUCTION DOCUMENTS: CD SET COMPONENTS</text><rect x="8" y="20" width="504" height="98" rx="5" fill="#fdfaf6" stroke="#e4d9ca" stroke-width=".5"/><text x="260" y="38" text-anchor="middle" font-size="10" fill="#16120e" font-weight="500">A complete lighting CD set</text><text x="260" y="54" text-anchor="middle" font-size="8" fill="#2a6048">RCP: fixture locations, types, circuiting, switching assignments</text><text x="260" y="68" text-anchor="middle" font-size="8" fill="#2a6048">Fixture schedule: type tag, full desc, wattage, LM-79 ref, DLC listing</text><text x="260" y="82" text-anchor="middle" font-size="8" fill="#1857a0">Controls drawings: zone plan, sequences of operation, riser</text><text x="260" y="96" text-anchor="middle" font-size="8" fill="#1857a0">Photometric calcs: illuminance plans, LPD summary, LEED compliance</text><text x="260" y="110" text-anchor="middle" font-size="8" fill="#8a7a6a">Details: section details for coves, slots, and wall-wash reveals</text></svg>`
,"11.1":`<svg viewBox="0 0 520 128" style="width:100%;height:auto" xmlns="http://www.w3.org/2000/svg"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">SUBMITTALS AND SUBSTITUTION REVIEW</text><rect x="8" y="20" width="242" height="98" rx="5" fill="#fdfaf6" stroke="#e4d9ca" stroke-width=".5"/><text x="129" y="38" text-anchor="middle" font-size="9" fill="#16120e" font-weight="500">Required submittal data</text><text x="129" y="53" text-anchor="middle" font-size="8" fill="#8a7a6a">Product data sheets</text><text x="129" y="67" text-anchor="middle" font-size="8" fill="#1857a0">LM-79 test report full copy</text><text x="129" y="81" text-anchor="middle" font-size="8" fill="#1857a0">DLC QPL listing confirmation</text><text x="129" y="95" text-anchor="middle" font-size="8" fill="#8a7a6a">IES photometric file</text><rect x="270" y="20" width="242" height="98" rx="5" fill="#e8f5ee" stroke="#2a6048" stroke-width=".8"/><text x="391" y="38" text-anchor="middle" font-size="9" fill="#2a6048" font-weight="500">Substitution review</text><text x="391" y="53" text-anchor="middle" font-size="8" fill="#8a7a6a">Compare against spec criteria</text><text x="391" y="67" text-anchor="middle" font-size="8" fill="#2a6048">Wattage, CCT, CRI, R9</text><text x="391" y="81" text-anchor="middle" font-size="8" fill="#2a6048">Lumen output, efficacy</text><text x="391" y="95" text-anchor="middle" font-size="8" fill="#8a7a6a">Dimming protocol, IP, mounting</text></svg>`
,"11.2":`<svg viewBox="0 0 520 128" style="width:100%;height:auto" xmlns="http://www.w3.org/2000/svg"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">CONSTRUCTION ADMINISTRATION PHASES</text><rect x="8" y="20" width="154" height="98" rx="5" fill="#fdfaf6" stroke="#e4d9ca" stroke-width=".5"/><text x="85" y="38" text-anchor="middle" font-size="9" fill="#16120e" font-weight="500">Bidding</text><text x="85" y="53" text-anchor="middle" font-size="8" fill="#8a7a6a">RFI response</text><text x="85" y="67" text-anchor="middle" font-size="8" fill="#8a7a6a">Addenda issued</text><text x="85" y="81" text-anchor="middle" font-size="8" fill="#8a7a6a">Substitution requests</text><text x="85" y="95" text-anchor="middle" font-size="8" fill="#8a7a6a">Bid levelling support</text><rect x="172" y="20" width="154" height="98" rx="5" fill="#e8f5ee" stroke="#2a6048" stroke-width=".8"/><text x="249" y="38" text-anchor="middle" font-size="9" fill="#2a6048" font-weight="500">Construction</text><text x="249" y="53" text-anchor="middle" font-size="8" fill="#8a7a6a">Submittal review</text><text x="249" y="67" text-anchor="middle" font-size="8" fill="#2a6048">Site visits</text><text x="249" y="81" text-anchor="middle" font-size="8" fill="#2a6048">RFI responses</text><text x="249" y="95" text-anchor="middle" font-size="8" fill="#8a7a6a">Change order review</text><rect x="336" y="20" width="176" height="98" rx="5" fill="#fff5ee" stroke="#b85835" stroke-width=".8"/><text x="424" y="38" text-anchor="middle" font-size="9" fill="#b85835" font-weight="500">Closeout</text><text x="424" y="53" text-anchor="middle" font-size="8" fill="#8a7a6a">Punch list</text><text x="424" y="67" text-anchor="middle" font-size="8" fill="#b85835">Commissioning</text><text x="424" y="81" text-anchor="middle" font-size="8" fill="#b85835">As-built drawings</text><text x="424" y="95" text-anchor="middle" font-size="8" fill="#8a7a6a">O and M manuals</text></svg>`
,"11.3":`<svg viewBox="0 0 520 128" style="width:100%;height:auto" xmlns="http://www.w3.org/2000/svg"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">PUNCH LIST AND SUBSTANTIAL COMPLETION</text><rect x="8" y="20" width="242" height="98" rx="5" fill="#fdfaf6" stroke="#e4d9ca" stroke-width=".5"/><text x="129" y="38" text-anchor="middle" font-size="9" fill="#16120e" font-weight="500">Punch list items typical</text><text x="129" y="53" text-anchor="middle" font-size="8" fill="#8a7a6a">Wrong luminaire type installed</text><text x="129" y="67" text-anchor="middle" font-size="8" fill="#cc3344">Non-approved substitution used</text><text x="129" y="81" text-anchor="middle" font-size="8" fill="#8a7a6a">Fixture not level or plumb</text><text x="129" y="95" text-anchor="middle" font-size="8" fill="#8a7a6a">Dimming not functioning</text><rect x="270" y="20" width="242" height="98" rx="5" fill="#e8f5ee" stroke="#2a6048" stroke-width=".8"/><text x="391" y="38" text-anchor="middle" font-size="9" fill="#2a6048" font-weight="500">Substantial completion</text><text x="391" y="53" text-anchor="middle" font-size="8" fill="#8a7a6a">Building is usable</text><text x="391" y="67" text-anchor="middle" font-size="8" fill="#2a6048">Certificate issued</text><text x="391" y="81" text-anchor="middle" font-size="8" fill="#2a6048">Warranty period begins</text><text x="391" y="95" text-anchor="middle" font-size="8" fill="#8a7a6a">Punch list remains open</text></svg>`
,"11.4":`<svg viewBox="0 0 520 128" style="width:100%;height:auto" xmlns="http://www.w3.org/2000/svg"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">LIGHTING COMMISSIONING PROCESS</text><rect x="8" y="20" width="504" height="98" rx="5" fill="#fdfaf6" stroke="#e4d9ca" stroke-width=".5"/><text x="260" y="38" text-anchor="middle" font-size="10" fill="#16120e" font-weight="500">Commissioning sequence</text><text x="260" y="54" text-anchor="middle" font-size="8" fill="#2a6048">1. Verify all luminaires installed per RCP and fixture schedule</text><text x="260" y="68" text-anchor="middle" font-size="8" fill="#2a6048">2. Verify controls zones wired per zone plan</text><text x="260" y="82" text-anchor="middle" font-size="8" fill="#1857a0">3. Program sequences of operation per narrative</text><text x="260" y="96" text-anchor="middle" font-size="8" fill="#1857a0">4. Verify occupancy sensors, photosensors, and scene setpoints</text><text x="260" y="110" text-anchor="middle" font-size="8" fill="#b85835">5. Measure and document actual illuminance against specification</text></svg>`
,"11.5":`<svg viewBox="0 0 520 128" style="width:100%;height:auto" xmlns="http://www.w3.org/2000/svg"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">POST-OCCUPANCY EVALUATION</text><rect x="8" y="20" width="242" height="98" rx="5" fill="#e8eef8" stroke="#1857a0" stroke-width=".8"/><text x="129" y="38" text-anchor="middle" font-size="9" fill="#1857a0" font-weight="500">POE measures</text><text x="129" y="53" text-anchor="middle" font-size="8" fill="#8a7a6a">Occupant satisfaction surveys</text><text x="129" y="67" text-anchor="middle" font-size="8" fill="#1857a0">Actual energy use vs model</text><text x="129" y="81" text-anchor="middle" font-size="8" fill="#1857a0">Illuminance measurements</text><text x="129" y="95" text-anchor="middle" font-size="8" fill="#8a7a6a">Controls performance logs</text><rect x="270" y="20" width="242" height="98" rx="5" fill="#e8f5ee" stroke="#2a6048" stroke-width=".8"/><text x="391" y="38" text-anchor="middle" font-size="9" fill="#2a6048" font-weight="500">Common POE findings</text><text x="391" y="53" text-anchor="middle" font-size="8" fill="#8a7a6a">Controls reprogrammed by FM</text><text x="391" y="67" text-anchor="middle" font-size="8" fill="#cc3344">Sensors mis-aimed or failed</text><text x="391" y="81" text-anchor="middle" font-size="8" fill="#cc3344">Energy savings not achieved</text><text x="391" y="95" text-anchor="middle" font-size="8" fill="#2a6048">Informs next project design</text></svg>`
,"11.6":`<svg viewBox="0 0 520 128" style="width:100%;height:auto" xmlns="http://www.w3.org/2000/svg"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">MAINTENANCE PLANNING AND LUMEN DEPRECIATION</text><rect x="8" y="20" width="242" height="98" rx="5" fill="#fdfaf6" stroke="#e4d9ca" stroke-width=".5"/><text x="129" y="38" text-anchor="middle" font-size="9" fill="#16120e" font-weight="500">Maintenance cycle planning</text><text x="129" y="53" text-anchor="middle" font-size="8" fill="#8a7a6a">LLD: lumen depreciation over life</text><text x="129" y="67" text-anchor="middle" font-size="8" fill="#8a7a6a">LDD: dirt on optical surfaces</text><text x="129" y="81" text-anchor="middle" font-size="8" fill="#b85835">Combined = Light Loss Factor</text><text x="129" y="95" text-anchor="middle" font-size="8" fill="#8a7a6a">LLF drives fixture count</text><rect x="270" y="20" width="242" height="98" rx="5" fill="#e8f5ee" stroke="#2a6048" stroke-width=".8"/><text x="391" y="38" text-anchor="middle" font-size="9" fill="#2a6048" font-weight="500">Group relamping strategy</text><text x="391" y="53" text-anchor="middle" font-size="8" fill="#8a7a6a">Replace all at interval</text><text x="391" y="67" text-anchor="middle" font-size="8" fill="#2a6048">vs spot replacement</text><text x="391" y="81" text-anchor="middle" font-size="8" fill="#2a6048">LED: longer intervals</text><text x="391" y="95" text-anchor="middle" font-size="8" fill="#8a7a6a">Driver failure monitoring</text></svg>`
,"12.1":`<svg viewBox="0 0 520 128" style="width:100%;height:auto" xmlns="http://www.w3.org/2000/svg"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">OFFICE AND WORKPLACE LIGHTING</text><rect x="8" y="20" width="242" height="98" rx="5" fill="#fdfaf6" stroke="#e4d9ca" stroke-width=".5"/><text x="129" y="38" text-anchor="middle" font-size="9" fill="#16120e" font-weight="500">Workplace standards</text><text x="129" y="53" text-anchor="middle" font-size="8" fill="#8a7a6a">300-500 lux task plane</text><text x="129" y="67" text-anchor="middle" font-size="8" fill="#2a6048">UGR 19 or less</text><text x="129" y="81" text-anchor="middle" font-size="8" fill="#2a6048">Uniformity 1:3</text><text x="129" y="95" text-anchor="middle" font-size="8" fill="#8a7a6a">Individual dimming LEED</text><rect x="270" y="20" width="242" height="98" rx="5" fill="#e8f5ee" stroke="#2a6048" stroke-width=".8"/><text x="391" y="38" text-anchor="middle" font-size="9" fill="#2a6048" font-weight="500">Activity-based working</text><text x="391" y="53" text-anchor="middle" font-size="8" fill="#8a7a6a">Focus zones: 500 lux</text><text x="391" y="67" text-anchor="middle" font-size="8" fill="#2a6048">Collaboration: 300 lux</text><text x="391" y="81" text-anchor="middle" font-size="8" fill="#2a6048">Lounge: 100-200 lux</text><text x="391" y="95" text-anchor="middle" font-size="8" fill="#8a7a6a">Tunable white circadian</text></svg>`
,"12.2":`<svg viewBox="0 0 520 128" style="width:100%;height:auto" xmlns="http://www.w3.org/2000/svg"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">RETAIL AND HOSPITALITY LIGHTING</text><rect x="8" y="20" width="242" height="98" rx="5" fill="#fdfaf6" stroke="#e4d9ca" stroke-width=".5"/><text x="129" y="38" text-anchor="middle" font-size="9" fill="#b85835" font-weight="500">Retail</text><text x="129" y="53" text-anchor="middle" font-size="8" fill="#8a7a6a">Ambient 300-500 lux</text><text x="129" y="67" text-anchor="middle" font-size="8" fill="#b85835">Accent 3-5x ambient</text><text x="129" y="81" text-anchor="middle" font-size="8" fill="#b85835">CRI 90 and R9 50 min</text><text x="129" y="95" text-anchor="middle" font-size="8" fill="#8a7a6a">Adjustable track for change</text><rect x="270" y="20" width="242" height="98" rx="5" fill="#fff5ee" stroke="#b85835" stroke-width=".8"/><text x="391" y="38" text-anchor="middle" font-size="9" fill="#b85835" font-weight="500">Hospitality and restaurant</text><text x="391" y="53" text-anchor="middle" font-size="8" fill="#8a7a6a">50-100 lux ambient</text><text x="391" y="67" text-anchor="middle" font-size="8" fill="#b85835">5:1 to 10:1 contrast ratio</text><text x="391" y="81" text-anchor="middle" font-size="8" fill="#b85835">2700-3000K warm CCT</text><text x="391" y="95" text-anchor="middle" font-size="8" fill="#8a7a6a">Dimming to 1 pct or below</text></svg>`
,"12.3":`<svg viewBox="0 0 520 128" style="width:100%;height:auto" xmlns="http://www.w3.org/2000/svg"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">HEALTHCARE AND EDUCATION LIGHTING</text><rect x="8" y="20" width="242" height="98" rx="5" fill="#e8eef8" stroke="#1857a0" stroke-width=".8"/><text x="129" y="38" text-anchor="middle" font-size="9" fill="#1857a0" font-weight="500">Healthcare</text><text x="129" y="53" text-anchor="middle" font-size="8" fill="#8a7a6a">Patient room: 100-300 lux</text><text x="129" y="67" text-anchor="middle" font-size="8" fill="#1857a0">Exam: 1000 lux task</text><text x="129" y="81" text-anchor="middle" font-size="8" fill="#1857a0">Ra 90 and R9 50 min</text><text x="129" y="95" text-anchor="middle" font-size="8" fill="#8a7a6a">UGR 19 max, lens trim</text><rect x="270" y="20" width="242" height="98" rx="5" fill="#e8f5ee" stroke="#2a6048" stroke-width=".8"/><text x="391" y="38" text-anchor="middle" font-size="9" fill="#2a6048" font-weight="500">Education</text><text x="391" y="53" text-anchor="middle" font-size="8" fill="#8a7a6a">Classroom: 300-500 lux</text><text x="391" y="67" text-anchor="middle" font-size="8" fill="#2a6048">Board: 500 lux vertical</text><text x="391" y="81" text-anchor="middle" font-size="8" fill="#2a6048">Ra 80 minimum</text><text x="391" y="95" text-anchor="middle" font-size="8" fill="#8a7a6a">Daylight harvesting priority</text></svg>`
,"12.4":`<svg viewBox="0 0 520 128" style="width:100%;height:auto" xmlns="http://www.w3.org/2000/svg"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">RESIDENTIAL: KITCHEN AND BATH</text><rect x="8" y="20" width="242" height="98" rx="5" fill="#fdfaf6" stroke="#e4d9ca" stroke-width=".5"/><text x="129" y="38" text-anchor="middle" font-size="9" fill="#b85835" font-weight="500">Kitchen lighting layers</text><text x="129" y="53" text-anchor="middle" font-size="8" fill="#8a7a6a">General: 300 lux ceiling</text><text x="129" y="67" text-anchor="middle" font-size="8" fill="#b85835">Task: 500 lux countertop</text><text x="129" y="81" text-anchor="middle" font-size="8" fill="#8a7a6a">Under-cabinet for prep</text><text x="129" y="95" text-anchor="middle" font-size="8" fill="#8a7a6a">CCT 2700-3000K</text><rect x="270" y="20" width="242" height="98" rx="5" fill="#e8eef8" stroke="#1857a0" stroke-width=".8"/><text x="391" y="38" text-anchor="middle" font-size="9" fill="#1857a0" font-weight="500">Bath and vanity</text><text x="391" y="53" text-anchor="middle" font-size="8" fill="#8a7a6a">Side-lit mirror preferred</text><text x="391" y="67" text-anchor="middle" font-size="8" fill="#1857a0">Ra 90 for grooming</text><text x="391" y="81" text-anchor="middle" font-size="8" fill="#1857a0">500 lux at face height</text><text x="391" y="95" text-anchor="middle" font-size="8" fill="#8a7a6a">IP44 minimum wet zones</text></svg>`
,"12.5":`<svg viewBox="0 0 520 128" style="width:100%;height:auto" xmlns="http://www.w3.org/2000/svg"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">MUSEUM AND GALLERY LIGHTING</text><rect x="8" y="20" width="242" height="98" rx="5" fill="#fdfaf6" stroke="#e4d9ca" stroke-width=".5"/><text x="129" y="38" text-anchor="middle" font-size="9" fill="#16120e" font-weight="500">Conservation requirements</text><text x="129" y="53" text-anchor="middle" font-size="8" fill="#b85835">Annual lux-hours limit</text><text x="129" y="67" text-anchor="middle" font-size="8" fill="#b85835">UV below 75 microwatts/lm</text><text x="129" y="81" text-anchor="middle" font-size="8" fill="#8a7a6a">Sensitive: 50 lux max</text><text x="129" y="95" text-anchor="middle" font-size="8" fill="#8a7a6a">Robust: 200 lux max</text><rect x="270" y="20" width="242" height="98" rx="5" fill="#e8f5ee" stroke="#2a6048" stroke-width=".8"/><text x="391" y="38" text-anchor="middle" font-size="9" fill="#2a6048" font-weight="500">Display lighting spec</text><text x="391" y="53" text-anchor="middle" font-size="8" fill="#2a6048">Ra 95 or above</text><text x="391" y="67" text-anchor="middle" font-size="8" fill="#2a6048">R9 50 or above</text><text x="391" y="81" text-anchor="middle" font-size="8" fill="#8a7a6a">Adjustable track accent</text><text x="391" y="95" text-anchor="middle" font-size="8" fill="#8a7a6a">Dimming for lux-hour control</text></svg>`
,"12.6":`<svg viewBox="0 0 520 128" style="width:100%;height:auto" xmlns="http://www.w3.org/2000/svg"><text x="260" y="12" text-anchor="middle" font-size="8" fill="#8a7a6a" font-family="monospace" letter-spacing=".1em">NCQLP EXAM INTEGRATED REVIEW</text><rect x="8" y="20" width="504" height="98" rx="5" fill="#fdfaf6" stroke="#e4d9ca" stroke-width=".5"/><text x="260" y="38" text-anchor="middle" font-size="10" fill="#16120e" font-weight="500">Key calculation formulas</text><text x="260" y="54" text-anchor="middle" font-size="8" fill="#b85835">E = I/d2 (inverse-square) and E = (I x cos theta)/d2 (cosine law)</text><text x="260" y="68" text-anchor="middle" font-size="8" fill="#2a6048">E avg = (N x Phi x CU x LLF) / A and RCR = 5h(L+W)/(LxW)</text><text x="260" y="82" text-anchor="middle" font-size="8" fill="#1857a0">SC = max spacing / mounting height and Beam diam = 2 x h x tan(beam/2)</text><text x="260" y="96" text-anchor="middle" font-size="8" fill="#8a7a6a">LPD = total installed watts / floor area (use system wattage, not lamp)</text><text x="260" y="110" text-anchor="middle" font-size="8" fill="#8a7a6a">TM-21 max projection = 6x LM-80 test duration</text></svg>`
};
const LC_DATA = {
"1.1":{body:["Light is a form of <strong>electromagnetic energy</strong> — the same family as radio waves, microwaves, infrared radiation, ultraviolet light, and X-rays. What separates them is wavelength. Human vision responds to a narrow slice of this spectrum: approximately <strong>380 nanometres</strong> (deep violet) to <strong>780 nanometres</strong> (deep red). Everything within that window is perceived as light; everything outside is invisible, though it still carries energy — ultraviolet causes sunburn, infrared is felt as radiant warmth.","Light behaves simultaneously as a wave and as a particle — the <strong>wave-particle duality</strong> described by quantum theory. Its wave nature explains interference, diffraction, and refraction. Its particle nature — photons, discrete packets of energy — explains the photoelectric effect and, crucially, how LEDs emit light at a wavelength determined entirely by the semiconductor's bandgap energy.","For the lighting designer, the practical foundation is this: <strong>wavelength determines colour</strong>, and the mixture of wavelengths in a beam — the <strong>Spectral Power Distribution (SPD)</strong> — is the physical fingerprint of every light source. Every colour quality metric (CCT, CRI, TM-30) and every human health metric (melanopic lux) is derived directly from the SPD."],lp:["The visible spectrum runs from 380 nm (violet) to 780 nm (red). Below is UV; above is infrared — both invisible, both with biological effects.","The SPD is the complete fingerprint of a light source. Every colour rendering, circadian, and consistency metric is computed from it.","Wave behaviour explains reflection and refraction. Photon behaviour explains LED emission and phosphor conversion."],tts:"Lesson 1.1. What is light. Light is a form of electromagnetic energy — same family as radio waves, microwaves, and X-rays. Human vision responds to roughly 380 to 780 nanometres. Wavelength determines colour. The Spectral Power Distribution — the SPD — is the fingerprint of every source. CCT, CRI, TM-30, and melanopic lux are all derived from the SPD."},
"1.2":{body:["Photometry measures light as perceived by the human eye. Four quantities form the complete vocabulary. <strong>Luminous flux (Φ)</strong>, in lumens (lm), is total light output in all directions per second. <strong>Luminous intensity (I)</strong>, in candelas (cd), is flux concentrated into a specific direction. A narrow spotlight and a wide flood can share identical lumen outputs yet have vastly different candela values.","<strong>Illuminance (E)</strong>, in lux (lx) or foot-candles (fc), is the quantity of light falling on a unit area of surface. One lux = one lumen per square metre; 1 fc ≈ 10.76 lux. Illuminance follows the <strong>inverse-square law</strong>: double the distance from a point source and illuminance drops to one-quarter. <strong>Luminance (L)</strong>, in cd/m², describes the apparent brightness perceived by an observer — it is the quantity that causes glare.","These form two chains. The <strong>source chain</strong> runs Φ → I: from total lumens to directional intensity. The <strong>surface chain</strong> runs E → L: from incident flux per unit area to perceived brightness. Confusing these four quantities is the most common conceptual error on lighting examinations."],lp:["Φ = lumens (total flux), I = candelas (directional), E = lux/fc (per unit area), L = cd/m² (perceived brightness, causes glare).","E = I/d². Double distance → ¼ illuminance. 1 fc = 10.76 lux. Luminance (not illuminance) is what UGR controls.","Instruments: integrating sphere for Φ; goniophotometer for I; illuminance meter for E; luminance camera for L."],tts:"Lesson 1.2. The four photometric quantities. Phi equals lumens — total flux. I equals candelas — directional intensity. E equals lux — flux per unit area. L equals candelas per square metre — perceived brightness and glare. E equals I divided by d-squared. Double the distance gives one quarter the illuminance. One foot-candle equals 10.76 lux."},
"1.3":{body:["The retina contains two photoreceptors. <strong>Cones</strong>, active above ~3 cd/m², provide colour vision with photopic sensitivity peaking at <strong>555 nm</strong>. <strong>Rods</strong> are 1,000× more sensitive, achromatic, and peak at <strong>507 nm</strong>. Rods dominate below ~0.001 cd/m². Between these extremes lies the <strong>mesopic range</strong> where both are simultaneously active.","The 48 nm peak difference creates the <strong>S/P ratio</strong> effect. Under mesopic conditions — roadways, parking — a cool-white LED, rich in blue-green content, stimulates rods more effectively per photopic lux. High S/P sources (S/P > 1.5) can appear 20–40% brighter than warm-white at equivalent lux, allowing wattage reductions while maintaining perceived safety.","The retina also contains <strong>ipRGCs</strong> — intrinsically photosensitive retinal ganglion cells — containing <strong>melanopsin</strong> with peak sensitivity at ~<strong>480 nm</strong>. They drive circadian rhythm synchronisation via the SCN, alertness, and melatonin suppression. Because their peak differs from both rods and cones, <strong>melanopic lux (EML)</strong> is a completely separate calculation from photopic lux. WELL v2 requires ≥200 EML at the eye during morning hours."],lp:["Three modes: photopic (cones, >3 cd/m², 555 nm), scotopic (rods, <0.001 cd/m², 507 nm, achromatic), mesopic (both active, roadway/parking design).","S/P ratio: cool-white LEDs stimulate rods more per photopic lux under mesopic conditions — enables wattage reductions while maintaining perceived brightness.","ipRGCs (melanopsin, ~480 nm) drive circadian health, not image vision. Melanopic lux ≠ photopic lux. WELL v2 requires ≥200 EML during morning hours."],tts:"Lesson 1.3. Photopic and scotopic vision. Cones peak at 555 nanometres, active above 3 candelas per square metre, provide colour vision. Rods peak at 507 nanometres, 1000 times more sensitive, achromatic. The mesopic range is where both are active — relevant for roadway design. The S-P ratio: cool-white LEDs appear brighter per photopic lux under mesopic conditions. ipRGCs with melanopsin at 480 nanometres drive circadian health. Melanopic lux is separate from photopic lux."},
"1.4":{body:["CCT describes the perceived hue of white light by analogy to a <strong>blackbody radiator</strong>. At ~2700–3000 K: warm amber-white. At 4000 K: neutral white. At 5000–7000 K: cool bluish-white. CCT describes only colour <em>appearance</em> — it says nothing about spectral composition or colour rendering ability.","The <strong>Kruithof principle</strong>: warm CCT (2700–3000 K) pairs comfortably with lower illuminance (50–300 lux), mirroring evening daylight. Cool CCT (4000–6500 K) pairs with higher illuminance (300–1000+ lux), mirroring midday daylight. Crossing these pairings typically feels unnatural — very cool light at low illuminance, or very warm light at very high illuminance.","Two supplementary specifications always accompany CCT. <strong>Duv</strong> measures deviation from the Planckian locus: positive = greenish cast; negative = pinkish. ANSI requires |Duv| ≤ 0.006. <strong>SDCM bins</strong> (MacAdam ellipses) quantify manufacturing variation — 3-step SDCM is the threshold for visually consistent adjacent fixtures."],lp:["CCT describes colour appearance only — not rendering. <3000K = warm. 3500–4000K = neutral. >4500K = cool.","Kruithof: warm CCT + low lux comfortable; cool CCT + high lux comfortable. Mismatching often feels wrong.","Always specify Duv (≤±0.006) and SDCM ≤ 3-step alongside CCT."],tts:"Lesson 1.4. Correlated Colour Temperature. CCT describes colour appearance only — not rendering. Below 3000 Kelvin is warm. 3500 to 4000 Kelvin is neutral. Above 4500 Kelvin is cool. Kruithof principle: warm CCT with low illuminance, cool CCT with high illuminance. Always specify Duv at plus or minus 0.006 maximum and SDCM of 3-step or better."},
"1.5":{body:["<strong>CRI (Ra)</strong> averages the colour shift of eight muted test colour samples (R1–R8) on a 0–100 scale. Ra ≥ 80 adequate; Ra ≥ 90 required for surgical, galleries, premium retail. Critical weakness: all eight samples are muted pastels — vivid saturated colours are ignored. <strong>R9 (saturated red)</strong> must always be specified separately. R9 ≥ 50 is the standard minimum for colour-critical applications.","IES <strong>TM-30</strong> uses 99 colour evaluation samples spanning the full real-world gamut. It produces two metrics: <strong>Rf (Fidelity Index)</strong> — accuracy on 0–100 scale, analogous to Ra but more rigorous — and <strong>Rg (Gamut Index)</strong>, which measures whether the source makes colours appear more or less saturated. Rg > 100 means more vivid; Rg < 100 means flatter. Always specify and report both.","A grocery store might target Rf 85 / Rg 108 for vivid produce. A museum targets Rf 95 / Rg 100 for faithful reproduction. LEED v4.1 EQ Interior Lighting requires CRI ≥ 90 and R9 ≥ 50 for the quality credit. Always verify from independent third-party LM-79 test reports."],lp:["CRI (Ra): average of 8 muted colours, 0–100. Ra ≥ 80 adequate; Ra ≥ 90 excellent. R9 (saturated red) NOT in Ra — specify R9 ≥ 50 separately.","TM-30 Rf = fidelity (99 samples). Rg = gamut (>100 vivid, <100 flat). Specify and report both together.","Metamerism: surfaces match under one source, differ under another. Control with broadspectrum sources and Ra ≥ 90 in critical spaces."],tts:"Lesson 1.5. Colour Rendering — CRI and TM-30. CRI or Ra averages 8 muted test colours on a scale of 0 to 100. Ra 80 is adequate; Ra 90 is excellent. R9 for saturated red is not included in Ra — always specify R9 of 50 or greater. TM-30 uses 99 samples and gives Rf for fidelity and Rg for gamut. Rg above 100 means more vivid; below 100 means flatter. Specify both together."},
"1.6":{body:["The rendering hierarchy: <strong>Ra ≥ 95+</strong> for surgical and gemological work. <strong>Ra ≥ 90</strong> for museums, galleries, fashion retail, healthcare exam rooms. <strong>Ra ≥ 80</strong> for general offices and standard retail. <strong>Ra ≥ 70</strong> for warehouses and industrial. Specifying Ra 95 throughout an office is wasteful; Ra 70 in a paint showroom is a design error.","<strong>Metamerism</strong> occurs when two surfaces match under one source but diverge under another — caused by different spectral reflectance curves reacting differently to different SPDs. Engineering controls: specify broadspectrum sources; Ra ≥ 90 for colour-critical QC spaces; evaluate colour matches under D65 illumination.","A complete colour rendering specification bundles four items: <strong>CCT + minimum Ra + minimum R9 + SDCM ≤ 3-step</strong>. Each controls a different dimension of colour quality — none alone is sufficient. For tunable white, verify Ra and Rg stability across the full CCT range. Confirm Ra and R9 from independent LM-79 test data."],lp:["Hierarchy: Ra ≥ 95 surgical → Ra ≥ 90 museum/retail/healthcare → Ra ≥ 80 offices → Ra ≥ 70 warehouse. Match to task — don't over-specify.","Complete spec = CCT + min Ra + min R9 + SDCM ≤ 3-step. Each controls a different dimension.","Always verify Ra and R9 from independent LM-79 test data. Confirm rendering stability for tunable white."],tts:"Lesson 1.6. Colour Rendering in Practice. Match rendering to task: Ra 95 for surgical, Ra 90 for museum and healthcare, Ra 80 for offices, Ra 70 for industrial. Metamerism is two surfaces matching under one source but not another. Specify CCT plus minimum Ra plus minimum R9 plus SDCM of 3-step or better. Verify from independent LM-79 test data."},
"2.1":{body:["Fluorescent lamps are <strong>low-pressure mercury vapour discharge lamps</strong>. An electric current passes between heated cathodes in a sealed tube containing mercury vapour. The mercury discharge produces <strong>UV at 254 nm</strong>. That UV strikes the <strong>phosphor coating</strong> on the inside of the tube, which re-emits it as visible light — photoluminescence. The phosphor mixture sets the lamp's CCT and CRI: different phosphor formulations produce 2700 K to 6500 K and Ra 60 to Ra 98.","The <strong>T designation</strong> is tube diameter in eighths of an inch: T12 = 1.5 in, T8 = 1 in, T5 = 5/8 in. Smaller diameter = more efficient arc control = higher efficacy. T8 lamps achieve <strong>60–105 lm/W</strong> — a dramatic improvement over the 10–15 lm/W of incandescent. T5HO (High Output) variants suit high-bay applications.","The SPD is <strong>discontinuous</strong> — sharp mercury emission peaks (405, 436, 546, 578 nm) superimposed on phosphor bands. A lamp can achieve Ra 84 while having a weak R9 because the deep red region (660+ nm) often falls between phosphor emission peaks. Understanding this explains why LED sources with engineered, fuller spectra are increasingly preferred."],lp:["Mechanism: mercury discharge → UV at 254 nm → phosphor coating converts to visible light. Phosphor mix sets CCT and CRI.","T8 = 1 inch diameter, achieves 60–105 lm/W. T5 = 5/8 inch, higher efficacy. Smaller diameter = more efficient arc = higher efficacy.","Discontinuous SPD explains weak R9 in fluorescent — deep red region often falls between phosphor peaks."],tts:"Lesson 2.1. Fluorescent sources. Mercury discharge creates UV at 254 nanometres. Phosphor coating converts UV to visible light. The phosphor mix sets CCT and CRI. T8 is 1 inch diameter and achieves 60 to 105 lumens per watt. T5 at five eighths of an inch is more efficient. The discontinuous SPD explains why R9 is often weak — the deep red region falls between phosphor peaks."},
"2.2":{body:["Gas discharge lamps have a <strong>negative resistance characteristic</strong> — as current increases, resistance drops — so they cannot be connected directly to mains power. A ballast limits current, provides starting voltage, and preheats cathodes. <strong>Magnetic ballasts</strong> use an iron-core transformer operating at 50–60 Hz. The lamp extinguishes and re-ignites each AC cycle, creating <strong>100–120 Hz flicker</strong> — a stroboscopic effect on rotating machinery that is a documented safety hazard in IES RP-7.","<strong>Electronic ballasts</strong> convert mains power to 20,000–50,000 Hz output. At these frequencies the lamp operates continuously — no perceptible flicker. Benefits: <strong>10–30% better efficiency</strong>, smooth dimming via 0–10V or DALI, quieter operation (no 120 Hz hum), and longer lamp life from reduced cathode thermal stress. This was one of the most impactful energy-saving advances in commercial lighting.","Key specification parameters: <strong>Ballast Factor (BF)</strong> = lamp output with the ballast ÷ rated output with reference ballast. BF = 0.77 = energy-saving mode; BF = 1.18 = high-output. <strong>Power factor</strong> must exceed 0.90 for commercial use. <strong>THD</strong> below 20% prevents neutral conductor overloading in three-phase systems."],lp:["Gas discharge lamps need a ballast to limit current. Magnetic ballasts at 50–60 Hz cause 100–120 Hz flicker — stroboscopic safety hazard on rotating machinery (IES RP-7).","Electronic ballasts at 20,000–50,000 Hz: no flicker, 10–30% more efficient, dimmable (0–10V/DALI), longer lamp life.","BF: <1.0 = energy-saving mode; >1.0 = high-output. Also specify PF >0.90 and THD <20%."],tts:"Lesson 2.2. Magnetic versus electronic ballasts. Gas discharge lamps need a ballast to limit current. Magnetic ballasts operate at 50 to 60 hertz, causing 100 to 120 hertz flicker and a stroboscopic safety hazard on rotating machinery. Electronic ballasts operate at 20,000 to 50,000 hertz — no flicker, 10 to 30 percent more efficient, dimmable. Ballast factor below 1.0 is energy-saving mode; above 1.0 is high-output mode."},
"2.3":{body:["Converting fluorescent to LED follows three paths. <strong>Type A (lamp swap)</strong>: LED tube into existing ballast. Lowest cost, no electrical work. Trade-off: performance depends entirely on the legacy ballast — check the manufacturer's compatibility list before specifying. <strong>Type B (ballast bypass)</strong>: ballast removed, fixture rewired to mains. Requires an electrician. Eliminates the most common failure point and delivers 10–20% better savings. <strong>Type C (full fixture replacement)</strong>: entire luminaire replaced with a purpose-built LED fixture whose driver, optics, and thermal system are engineered as an integrated unit.","Type C luminaires are eligible for <strong>DLC listing</strong> and therefore utility rebates — often covering 30–70% of first cost in commercial projects. A 10-year <strong>Total Cost of Ownership (TCO)</strong> analysis almost always shows Type C winning despite higher first cost, because energy savings and rebates more than compensate.","Choosing the right path requires a lifecycle analysis. For high-use commercial spaces (offices, retail, industrial operating 16+ hours per day), Type C wins on TCO. For lightly used storage rooms with functional fixtures and no rebate programme, Type A or B may be appropriate. Present all three paths with lifecycle cost analysis — not just first-cost comparison."],lp:["Type A: LED tube into existing ballast. No electrical work. Lowest cost. Performance limited by ballast — always check compatibility list.","Type B: remove ballast, wire direct to mains. Requires electrician. Better efficacy and life. No ballast failure risk.","Type C: full luminaire replacement. Best photometrics, DLC eligible for rebates, best 10-year TCO for high-use spaces."],tts:"Lesson 2.3. Three LED retrofit paths. Type A is a lamp swap into the existing ballast — lowest cost, no electrical work, but performance limited by the old ballast. Type B removes the ballast and wires direct to mains — requires an electrician but better efficacy. Type C replaces the full luminaire — highest first cost, best performance, DLC eligible for utility rebates, and best 10-year total cost of ownership."},
"2.4":{body:["<strong>Compact Fluorescent Lamps (CFLs)</strong>: 50–85 lm/W, Ra ~80, 8,000–15,000-hour life. Key limitations: 1–3 minute warm-up, poor cold-temperature performance, mercury content requiring RoHS-compliant disposal. LED has replaced CFLs in virtually all residential and commercial applications due to instant-on, longer life, and better dimmability.","<strong>HID lamps</strong> encompass three main types. <strong>HPS (High-Pressure Sodium/SON)</strong>: warm amber-yellow, CCT 2000–2500 K, Ra 10–80, excellent efficacy 50–130 lm/W — historically dominant for roadway and high-bay industrial. <strong>Metal Halide (MH/CMH)</strong>: CCT 3000–5600 K, Ra 65–95, 75–140 lm/W — much better colour rendering than HPS. <strong>Ceramic Metal Halide (CMH)</strong>: superior colour consistency (Ra 80–95) through a ceramic arc tube.","All HID lamps share a critical characteristic: they require a <strong>warm-up period of 2–5 minutes</strong> and a <strong>restrike time of 10–20 minutes</strong> after being switched off — the hot arc tube pressure is too high to re-ignite immediately. This makes HID <strong>completely unsuitable for emergency lighting</strong> and frequently switched areas. LED high-bays have largely supplanted HID in new installations."],lp:["CFLs: 50–85 lm/W, Ra ~80, 1–3 min warm-up, mercury requires disposal. LED has replaced them in most applications.","HPS: 50–130 lm/W, Ra 10–80, warm amber. Metal Halide: 75–140 lm/W, Ra 65–95, much better colour than HPS.","All HID: 10–20 min restrike time — cannot be used for emergency lighting or frequently switched areas."],tts:"Lesson 2.4. CFL and HID sources. CFLs give 50 to 85 lumens per watt and Ra 80 but have a 1 to 3 minute warm-up and mercury requiring disposal. LED has replaced them. High pressure sodium gives 50 to 130 lumens per watt but poor colour at Ra 10 to 80. Metal halide gives 75 to 140 lumens per watt with much better colour at Ra 65 to 95. All HID lamps require 10 to 20 minutes restrike time after switching off — they cannot be used for emergency lighting."},
"2.5":{body:["<strong>Luminous efficacy (lm/W)</strong> measures how efficiently electrical power converts to visible light. Historical progression: incandescent 3–15 lm/W → T8 fluorescent 60–105 → HPS 50–130 → metal halide 75–140 → LED luminaire 120–170+ lm/W. The key constraint: LED packages now exceed 200 lm/W at the chip level, but commercial luminaire efficacy is 120–170 after accounting for optical and driver losses.","Critical distinction: <strong>lamp efficacy</strong> vs <strong>luminaire (system) efficacy</strong>. Luminaire efficacy = delivered lumens ÷ total watts including driver losses (typically 85–92% efficient). A 200 lm/W LED chip may deliver only 150 lm/W from the complete luminaire after optical losses. <strong>ASHRAE 90.1, Title 24, DLC, and ENERGY STAR all base compliance on luminaire efficacy</strong> — using lamp-level numbers for code compliance is a common and costly specification error.","Efficacy must be weighed against performance requirements. <strong>Low-pressure sodium</strong> achieves 100–200 lm/W — the highest efficacy of any practical source — but Ra < 20 makes colour discrimination nearly impossible. Efficacy is not the only criterion: specifying high-efficacy sources that sacrifice colour rendering in colour-critical applications is a false economy."],lp:["Always compare at luminaire level: delivered lumens ÷ total watts including driver. Lamp efficacy is always higher — do not use it for code compliance or rebate claims.","Efficacy ladder (luminaire): incandescent 5–27 → CFL 50–85 → T8 60–105 → metal halide 75–140 → LED 100–170+ lm/W.","Low-pressure sodium: highest efficacy (100–200 lm/W) but Ra <20. Never specify where colour matters. Efficacy is not the only criterion."],tts:"Lesson 2.5. Efficacy comparison. Always compare at luminaire level — delivered lumens divided by total watts including the driver. Lamp efficacy is always higher than luminaire efficacy. ASHRAE 90.1, DLC, and energy codes all require luminaire-level efficacy. The efficacy ladder from lowest to highest: incandescent 5 to 27, CFL 50 to 85, T8 fluorescent 60 to 105, metal halide 75 to 140, LED 100 to 170 or more lumens per watt."},
"2.6":{body:["Source selection begins with a <strong>hard-constraint filter</strong>. Work through each requirement and eliminate non-qualifying sources. If Ra ≥ 90 is required (surgical suite, art gallery), most HPS and lower-grade LEDs are eliminated. If <strong>instant restrike is required</strong> (emergency lighting, frequently switched areas), all HID sources are eliminated. If outdoor operation to −20°C is required, some LED drivers and most fluorescent types are excluded. Only after this filter should you compare remaining options.","Compare surviving options using a <strong>10-year TCO analysis</strong>: first cost + present value of energy costs + present value of maintenance + disposal. A T12 magnetic fluorescent system installed today will consume 40–50% more energy than an LED equivalent and require lamp replacements every 2–3 years. Even at lower purchase price, its 10-year TCO is typically 30–50% higher. Utility rebates frequently reduce LED first cost by 30–70%, often bringing payback under two years.","Three most common specification errors: specifying <strong>HID where instant restrike is required</strong>; using <strong>lamp-level efficacy</strong> instead of luminaire-level efficacy when calculating LPD compliance; and recommending a <strong>low-CRI source for a colour-critical space</strong>. Each is an immediate disqualifier in a specification review."],lp:["Source selection: first eliminate by hard constraints (Ra, instant restrike, dimmability, cold-temp), then compare survivors by 10-year TCO.","TCO = first cost + PV(energy) + PV(maintenance) + disposal. LED wins 10-year TCO by 30–50% over HPS/fluorescent baselines in high-use commercial spaces.","Three exam traps: HID + instant restrike (wrong); lamp efficacy for LPD (wrong, use luminaire); low-CRI for colour-critical task (wrong)."],tts:"Lesson 2.6. Source selection in practice. Start by eliminating sources that fail hard constraints — Ra requirement, instant restrike, dimmability, cold temperature. Then compare remaining options on 10-year total cost of ownership. LED wins by 30 to 50 percent in high-use commercial spaces. Three common traps: HID where instant restrike is required; using lamp efficacy instead of luminaire efficacy for LPD calculations; and low-CRI for a colour-critical task."},
"3.1":{body:["An LED is a semiconductor device that converts electrical energy directly into light — <strong>electroluminescence</strong>. At its heart is a <strong>P-N junction</strong>: a boundary between p-type semiconductor (positive 'holes') and n-type semiconductor (free electrons). When a forward voltage is applied, electrons from the n-side and holes from the p-side are pushed toward each other. When an electron recombines with a hole at the junction, it releases its energy as a <strong>photon of light</strong>.","The wavelength — and therefore colour — of the photon is determined by the semiconductor material's <strong>bandgap energy</strong>. A large bandgap produces short-wavelength (blue) photons; a small bandgap produces longer-wavelength (red) photons. Gallium nitride (GaN) produces blue light (~450 nm). White LEDs use a <strong>blue GaN chip + YAG:Ce phosphor</strong>: the phosphor converts some blue to yellow, and the combination appears white.","Modern white LED packages achieve <strong>60–70% wall-plug efficiency</strong> (optical power out ÷ electrical power in), compared to ~5% for incandescent. The remaining energy converts to heat at the junction — making thermal management the central engineering challenge of LED system design. Every degree of junction temperature rise degrades efficacy, shifts colour, and shortens life."],lp:["P-N junction: electron recombines with hole → photon released. Bandgap energy determines wavelength and colour.","White LED: blue GaN chip + YAG:Ce phosphor. Blue partially converts to yellow; combined = white. CCT set by phosphor formulation.","Wall-plug efficiency ~60–70% for white LEDs vs ~5% for incandescent. Remaining energy = heat at junction — thermal management is critical."],tts:"Lesson 3.1. The P-N junction. An LED converts electricity to light through electroluminescence at the P-N junction. When an electron recombines with a hole, it releases a photon. The bandgap energy determines the photon's wavelength and colour. White LEDs use a blue GaN chip coated with a yellow phosphor — the combination appears white. Wall-plug efficiency is 60 to 70 percent for modern LEDs versus 5 percent for incandescent. Remaining energy becomes heat at the junction."},
"3.2":{body:["A luminaire is a complete light delivery system with four interdependent subsystems. <strong>① LED source</strong> (package/module) generates photons. <strong>② Driver</strong> converts mains AC to controlled DC current — the equivalent of a ballast for discharge lamps. <strong>③ Thermal management</strong> (heat sink + thermal interface materials) conducts heat away from the junction. <strong>④ Optics</strong> (lens, reflector, diffuser, baffles) shapes and directs the light distribution toward the task.","These four must be engineered and <strong>tested as a unit</strong>. A high-performance LED chip paired with an inadequate heat sink runs hot, reducing flux and shortening life. A premium driver paired with a poorly designed reflector wastes lumens. This is why <strong>IES LM-79 mandates testing on the complete luminaire</strong> — not just the LED package. Mixing components from different manufacturers without validation invalidates warranty and photometric claims.","Understanding all four parts is essential for maintenance planning. <strong>Driver failure is the most common cause</strong> of premature LED luminaire failure — accounting for 60–80% of field failures. Thermal degradation (dust on heat sinks, dried TIM) gradually reduces LED life without causing immediate visible failure. Optical degradation (yellowing diffusers, dusty reflectors) reduces delivered lumens over time."],lp:["Four parts: ① LED source, ② driver, ③ thermal management (heat sink + TIM), ④ optics. All must be engineered and tested as a system.","LM-79: complete luminaire photometric test — not just the LED package. Must test as-built system.","Driver failure = most common LED field failure (60–80% of cases). Thermal and optical degradation also reduce performance over time."],tts:"Lesson 3.2. The four parts of a luminaire. Part 1 is the LED source. Part 2 is the driver. Part 3 is the thermal management system — heat sink and thermal interface material. Part 4 is the optics — lens, reflector, and diffuser. All four must be engineered and tested together. IES LM-79 requires testing on the complete luminaire. Driver failure is the most common cause of premature LED failure, accounting for 60 to 80 percent of field failures."},
"3.3":{body:["Thermal management is the most critical performance factor in LED system design. Unlike incandescent lamps that radiate waste energy as infrared, LEDs generate heat at the semiconductor junction — and that heat can only leave by conduction. The <strong>thermal path</strong> runs: LED junction → solder pad → MCPCB (metal-core PCB) → thermal interface material (TIM) → heat sink → ambient air by convection. Every step in this path must be efficient. If any interface is inadequate, junction temperature rises.","The relationship between junction temperature and LED performance is well-established: for every <strong>10°C rise above the rated operating point</strong>, lumen output drops ~1–3%, colour point shifts toward blue (phosphor efficiency changes), and the statistical L70 lifetime roughly <strong>halves</strong>. A white LED rated for 50,000 hours at 85°C junction temperature may deliver only 25,000 hours if the junction runs at 105°C. This is why thermal management must be engineered for actual installation conditions — not just laboratory test conditions.","<strong>Thermal Interface Materials (TIMs)</strong> fill microscopic air gaps between the LED package and heat sink. Types: thermal grease (best conductivity, requires re-application), phase-change materials (melt to conform, resolidify), and thermal pads (easiest assembly, slightly lower performance). <strong>IES LM-80</strong> tests LED lumen maintenance at three case temperatures (55°C, 85°C, elevated) over 6,000+ hours — this data feeds <strong>IES TM-21</strong> lifetime projections."],lp:["Thermal path: junction → solder → MCPCB → TIM → heat sink → ambient. Every interface must be optimised.","Every 10°C rise in junction temp: flux drops, colour shifts blue, L70 life roughly halves. Engineer for actual installation temp — not lab conditions.","LM-80: lumen maintenance at 3 temperatures over 6,000+ hours. TM-21: projects L70 lifetime. Maximum TM-21 projection = 6× LM-80 test duration."],tts:"Lesson 3.3. Thermal management. Heat travels from the LED junction through solder, MCPCB, thermal interface material, and heat sink to ambient air. Every 10 degrees Celsius rise in junction temperature causes flux to drop, colour to shift blue, and L70 lifetime to roughly halve. Engineer for actual installation conditions, not lab test conditions. LM-80 tests lumen maintenance at three temperatures over 6,000 hours. TM-21 extrapolates L70 lifetime — the maximum projection is 6 times the LM-80 test duration."},
"3.4":{body:["LED drivers convert mains AC power to regulated DC power. Because an LED's light output is proportional to current — and small voltage variations cause large current changes — most LED drivers regulate current rather than voltage. A <strong>Constant Current (CC) driver</strong> maintains a fixed output current (350 mA, 700 mA, or 1050 mA are common) regardless of input voltage variation. This ensures consistent lumen output, prevents thermal runaway, and extends LED life. CC drivers are used for most single-fixture applications: downlights, track heads, high-bays.","<strong>Constant Voltage (CV) drivers</strong> maintain a fixed output voltage — most commonly 12V DC or 24V DC — while current varies with the load. CV drivers are used where the LED load is distributed: LED strip lights, signage, and linear cove systems where multiple LED segments connect in parallel across a common voltage rail. The strips contain their own current-limiting resistors. CV systems offer layout flexibility but are less energy-efficient than purpose-designed CC systems.","Dimming is integrated into the driver. Common protocols: <strong>0–10V</strong> — separate wire carrying 1–10V signal (10V = max, 1V = minimum dim, 0V = lamp off); <strong>DALI</strong> — digital, individually addressable, bidirectional; <strong>PWM</strong> — high-frequency duty-cycle switching; <strong>Triac/phase-cut</strong> — compatible with wallbox dimmers. Mismatching driver dimming type with the control system causes flicker, noise, or shortened driver life."],lp:["CC driver: fixed current output (350/700/1050 mA). Used for individual fixtures. Prevents thermal runaway. Most common type.","CV driver: fixed voltage (12V or 24V DC). Used for LED strip and distributed loads. Less efficient than CC systems.","Dimming: 0–10V (zone, no feedback), DALI (individual address, bidirectional), PWM (colour-stable, needs >1 kHz), Triac (wallbox, needs compatibility check)."],tts:"Lesson 3.4. Constant current versus constant voltage drivers. CC drivers maintain fixed current — 350, 700, or 1050 milliamps — for individual fixtures like downlights and high-bays. CV drivers maintain fixed voltage — 12 or 24 volts DC — for distributed loads like LED strip. Dimming protocols: 0 to 10V for zone dimming, DALI for individual addressing, PWM for colour-stable dimming above 1 kilohertz, and Triac for wallbox compatibility."},
"3.5":{body:["<strong>0–10V</strong> is the most widely used analogue dimming interface. A separate low-voltage wire carries a 1–10V signal: 10V = 100% output, 1V = minimum dim (typically 1–10%), 0V = lamp off. Simple, inexpensive, near-universally compatible. Limitation: one-way signal (no feedback from driver to controller), all fixtures on a zone dim together — no individual addressing. <strong>DALI-2 (IEC 62386 Edition 2)</strong> is the digital alternative: a two-wire bidirectional bus supporting up to 64 individually addressable devices per segment. DALI-2 enables scene programming, fault reporting, fixture-level energy monitoring, and integration with BACnet/IP building management systems.","<strong>PWM (Pulse Width Modulation)</strong> switches the LED on and off at high frequency (typically 1,000–50,000 Hz) with varying duty cycle to control brightness without changing peak current. At 50% duty cycle the LED is on half the time; at 10%, one-tenth of the time. PWM inherently preserves colour consistency better than analogue current reduction — making it preferred for high-CRI theatrical and retail applications. However, <strong>PWM at low frequencies</strong> (<200 Hz) causes perceptible stroboscopic flicker. WELL v2 and IES TM-30 both specify flicker metrics — PWM above 1 kHz is generally considered safe.","<strong>Wireless dimming</strong> (Zigbee, Bluetooth mesh, EnOcean) eliminates new control wiring runs — valuable in retrofit projects. Tradeoff: requires careful RF planning to avoid dead zones, and commissioning is more complex than wired systems. The most common field failure in lighting control systems is <strong>driver-dimming protocol mismatch</strong>: a 0–10V driver connected to a Triac dimmer produces flicker, noise, or failure. Verifying compatibility before purchasing is mandatory."],lp:["0–10V: simple, zone-only, no feedback, no individual addressing. DALI-2: 64 devices per bus, bidirectional, scene memory, fault reporting.","PWM: duty-cycle modulation preserves colour stability. Frequency must be >1 kHz to avoid health-relevant flicker (WELL v2, IES TM-30).","Always verify driver-dimming protocol compatibility before specifying. Mismatch = flicker, noise, or driver failure."],tts:"Lesson 3.5. Dimming protocols. 0 to 10 volt is simple zone dimming — no individual addressing or feedback. DALI-2 per IEC 62386 provides 64 individually addressable devices per bus with bidirectional communication, scene memory, and fault reporting. PWM uses duty-cycle switching — above 1 kilohertz is safe; below 200 hertz causes health-relevant flicker. Always verify driver and dimming protocol compatibility before specifying. Mismatches cause flicker, noise, or driver failure."},
"3.6":{body:["<strong>Power Factor (PF)</strong> is the ratio of real power consumed (watts) to apparent power supplied by the utility (volt-amperes, VA). A purely resistive load has PF = 1.0 — all current does useful work. LED drivers and electronic ballasts draw current in pulses, creating phase shift and waveform distortion. A driver with PF = 0.7 draws <strong>43% more current</strong> from the distribution system than a PF = 1.0 load of equivalent wattage. For a commercial building with hundreds of LED fixtures, low PF adds measurable current to branch circuits, panels, and transformers — potentially requiring infrastructure upsizing. <strong>DLC QPL requires PF ≥ 0.90</strong> for most commercial products.","<strong>Total Harmonic Distortion (THD)</strong> describes how much a driver's input current waveform deviates from a pure sinusoid due to harmonic current components. In a three-phase distribution system, <strong>third-harmonic currents (180 Hz)</strong> are additive in the neutral conductor — meaning the neutral can carry overload current even when each phase is within its rated ampacity. High THD (>20%) can cause transformer overheating, interference with communications equipment, and nuisance tripping of sensitive protective devices.","For commercial LED specifications, verify both PF and THD from manufacturer test data at rated load. High-end LED drivers for office and retail use typically achieve PF > 0.95 and THD < 10%. Specify <strong>PF ≥ 0.90 and THD ≤ 20%</strong> for all commercial installations — and <strong>THD ≤ 10%</strong> when the installation includes sensitive electronic equipment on shared circuits or when neutral conductor capacity is a concern."],lp:["PF = real power (W) ÷ apparent power (VA). PF 0.7 means 43% extra current. Commercial spec: PF ≥ 0.90 (DLC QPL requirement).","THD: 3rd harmonics add in neutral conductor of 3-phase systems — can overheat neutral even when phases are within rating.","Specify PF ≥ 0.90 and THD ≤ 20% (ideally ≤ 10%) for all commercial LED installations."],tts:"Lesson 3.6. Power factor and THD. Power factor is real power divided by apparent power. A PF of 0.7 means 43 percent extra current is drawn from the utility. DLC QPL requires PF of 0.90 or better for commercial products. Total harmonic distortion describes current waveform deviation from a pure sine wave. In three-phase systems, third-harmonic currents at 180 hertz add in the neutral conductor, potentially overheating it. Specify PF of 0.90 or better and THD below 20 percent for all commercial installations."}
,"4.1":{body:["An <strong>IES file</strong> (ANSI/IES LM-63) is a standardised text file containing candela values at a matrix of vertical and horizontal angles — the universal photometric data format in North America. All major lighting design software imports it. Every DLC QPL product must have LM-79 test data with IES files available. The header contains manufacturer, catalogue number, lamp type, lumens, test date, and multiplying factor.","Vertical angles run from 0° (nadir, straight down) to 90° (horizontal) to 180° (zenith). Horizontal planes sweep 0°–360°. Software multiplies all candela values by the multiplying factor (usually 1.0) to reconstruct the complete 3D distribution. TILT=NONE for most standard luminaires indicates they were tested in their normal operating orientation.","Always cross-reference the IES implied lumen output against the LM-79 test report — they should agree within 5%. Red flags for data quality problems: unrealistically high total lumen output; sharp distribution discontinuities; candela values not tapering to zero at 90° for a nominally downward fixture."],lp:["LM-63 IES file: candela values at every vertical angle (0 nadir, 90 horizontal, 180 zenith) and horizontal plane (0-360). All major software imports it.","Cross-check IES implied lumens against LM-79 report. Discrepancy greater than 5 percent signals data quality problems.","Red flags: unrealistically high lumens, sharp discontinuities, candela not tapering at 90 degrees."],tts:"Lesson 4.1. The LM-63 IES file. An IES file is the universal text file for photometric data in North America. All major lighting design software imports it. The header contains manufacturer name, lamp lumens, test date, and a multiplying factor. Candela data covers every vertical angle from 0 degrees nadir to 180 degrees zenith, and every horizontal plane from 0 to 360 degrees. Cross-check IES implied lumen output against the LM-79 test report. They should agree within 5 percent."}
,"4.2":{body:["A <strong>polar intensity diagram</strong> plots candela as the radial distance from the origin, with angle sweeping around (0° = nadir). The shape reveals beam character: narrow teardrop = narrow-beam downlight; <strong>bat-wing</strong> (peaks at 35–55° from nadir) = spacing-efficient troffer for uniform horizontal work-plane illumination.","A <strong>Cartesian photometric diagram</strong> plots angle on the horizontal axis and candela on the vertical axis — easier for comparing intensity at specific angles and identifying secondary lobes. For <strong>asymmetric luminaires</strong> — wall washers, linear indirect, sports — Cartesian plots for multiple planes (0°, 45°, 90°) are essential.","The <strong>beam angle</strong> is the full angle between the two directions where intensity drops to 50% of peak. The <strong>field angle</strong> is often defined at 10% of peak. These values allow rapid assessment of beam concentration and glare potential before running a full simulation."],lp:["Polar: radial distance equals candela. Bat-wing shape peaking at 35-55 degrees from nadir indicates a troffer optimised for horizontal work-plane uniformity.","Cartesian: angle on X, candela on Y. Better for specific angles and secondary lobes. Essential for asymmetric distributions.","Beam angle: full angle between two 50-percent-of-peak directions. Field angle often at 10 percent."],tts:"Lesson 4.2. Polar and Cartesian photometric plots. A polar diagram plots candela as the radial distance. Zero degrees is nadir. The bat-wing shape peaking at 35 to 55 degrees is characteristic of a troffer designed for horizontal work-plane uniformity. A Cartesian plot has angle on the X axis and candela on the Y axis. The beam angle is the full angle between the two 50-percent-of-peak intensity directions."}
,"4.3":{body:["Three IES standards govern SSL performance. <strong>IES LM-79</strong> measures total luminous flux, efficacy, CCT, CRI, and chromaticity of the <strong>complete luminaire</strong> under stabilised thermal conditions using a goniophotometer or integrating sphere. The resulting test report is the foundation for DLC qualification. Never accept lumen or efficacy claims without a complete LM-79 report on the actual production luminaire.","<strong>IES LM-80</strong> covers long-term lumen maintenance testing of LED packages, arrays, and modules — not complete luminaires. Products are tested at three case temperatures (55°C, 85°C, elevated) for a minimum of 6,000 hours. The raw data is a time-series of lumen output at each temperature — not a lifetime value, but the empirical basis for projections.","<strong>IES TM-21</strong> extrapolates LM-80 data to project L70, L80, or L90 lifetimes using an exponential decay curve fit. The critical rule: <strong>the projection cannot exceed 6 times the LM-80 test duration</strong>. A product with 6,000 hours of LM-80 data can project at most 36,000 hours L70. Always request both the LM-80 test duration and the TM-21 L70 at the actual installation operating temperature."],lp:["LM-79: complete luminaire test for lumens, efficacy, CCT, CRI, and distribution. Required for DLC qualification.","LM-80: LED package at 3 temperatures over 6,000 or more hours. NOT the full luminaire. More hours means more reliable projections.","TM-21: L70 projection from LM-80 data. Maximum projection equals 6 times the LM-80 test duration."],tts:"Lesson 4.3. LM-79, LM-80, and TM-21. LM-79 tests the complete luminaire and is required for DLC qualification. LM-80 tests the LED package at three temperatures over a minimum of 6,000 hours. TM-21 extrapolates LM-80 data to project L70 lifetime. The maximum TM-21 projection is 6 times the LM-80 test duration."}
,"4.4":{body:["The <strong>inverse-square law</strong>: <strong>E = I / d²</strong>, where E is illuminance in lux, I is luminous intensity in candelas, and d is distance in metres. When distance doubles, the same flux covers four times the area — illuminance drops to one-quarter. At triple the distance, one-ninth.","The law applies only to a true <strong>point source</strong> — where source dimensions are negligible compared to d. Practical accuracy: within about 5% when d is at least 5 times the largest source dimension. For large linear strips or area sources, the inverse-square law does not apply — using it for an area source is a common exam trap.","Rearranged to find intensity: <strong>I = E × d²</strong>. To find distance: <strong>d = √(I/E)</strong>. NCQLP exam questions typically give two of the three variables and ask for the third. The surface is assumed perpendicular to the light ray — when tilted, apply the cosine correction."],lp:["E equals I divided by d-squared. Double distance gives one quarter illuminance. Triple gives one ninth. Rearranged: I equals E times d-squared.","Valid only for point sources where d is at least 5 times source dimension. NOT valid for linear or area sources.","Perpendicular incidence assumed. For tilted surfaces multiply by cosine theta."],tts:"Lesson 4.4. The inverse-square law. E equals I divided by d-squared. Double the distance gives one quarter illuminance. Triple gives one ninth. Valid only for point sources where d is at least 5 times the largest source dimension. For linear or area sources the formula does not apply. Rearranged: I equals E times d-squared. Distance equals the square root of I divided by E."}
,"4.5":{body:["The <strong>cosine law</strong>: <strong>E = (I × cosθ) / d²</strong>, where θ is the angle between the light direction and the surface normal. At θ = 0° the formula reduces to the pure inverse-square law. At θ = 45°, cosθ = 0.707. At θ = 60°, cosθ = 0.500. At θ = 90°, cosθ = 0 and illuminance is zero.","The physical reason: at oblique incidence a flux bundle is spread over a larger area, so each unit of area receives less flux. This explains why vertical surfaces receive much less illuminance from ceiling fixtures than horizontal surfaces — the incidence angle is near 90°.","The complete point-by-point formula: E = (I_θφ × cosθ) / d², where I_θφ is the intensity from the IES file in the direction of the calculation point. Key cosines to memorise: 0° = 1.000, 30° = 0.866, 45° = 0.707, 60° = 0.500, 90° = 0."],lp:["E equals I times cosine theta divided by d-squared. Theta is the angle between light direction and surface normal. At theta zero it reduces to E equals I over d-squared.","Key cosines: 0 degrees equals 1.0, 30 degrees equals 0.866, 45 degrees equals 0.707, 60 degrees equals 0.500, 90 degrees equals 0.","Vertical illuminance from ceiling fixtures is always lower than horizontal — near-90-degree cosine is very small."],tts:"Lesson 4.5. The cosine law. E equals I times cosine theta divided by d-squared. Theta is the angle between the light direction and the surface normal. At theta zero it reduces to the inverse-square law. At 45 degrees cosine is 0.707. At 60 degrees it is 0.500. At 90 degrees it is zero. Memorise: 0 equals 1.0, 30 equals 0.866, 45 equals 0.707, 60 equals 0.500."}
,"4.6":{body:["The <strong>lumen method</strong>: <strong>E_avg = (N × Φ × CU × LLF) / A</strong>. For design: <strong>N = (E × A) / (Φ × CU × LLF)</strong>. This method yields average illuminance only — not point-by-point variation or uniformity. For uniformity analysis, point calculations using the inverse-square and cosine laws are required.","The <strong>Coefficient of Utilization (CU)</strong> is the fraction of total lamp lumens reaching the work plane, derived from the photometric zonal flux table at a given <strong>Room Cavity Ratio (RCR)</strong> and surface reflectances. <strong>RCR = 5h(L+W)/(L×W)</strong> where h is mounting height above the work plane. A direct luminaire with 90/50/20% ceiling/wall/floor reflectances might have CU = 0.75. With 30% walls the same luminaire might have CU = 0.52 — requiring about 44% more fixtures.","The <strong>Light Loss Factor (LLF)</strong> is the product of Lamp Lumen Depreciation (LLD), Luminaire Dirt Depreciation (LDD), and other sub-factors. Typical combined LLF for LED in a clean commercial space: 0.80 to 0.90. Lower LLF requires more fixtures to meet maintained illuminance targets."],lp:["E avg equals N times Phi times CU times LLF divided by A. For design: N equals E times A divided by Phi times CU times LLF. Gives average illuminance only.","CU from photometric table at the RCR and reflectances. RCR equals 5h times L plus W divided by L times W. Dark walls dramatically reduce CU.","LLF equals LLD times LDD and other factors. Typical LED clean space: 0.80 to 0.90. Lower LLF means more fixtures needed."],tts:"Lesson 4.6. The lumen method. E average equals N times Phi times CU times LLF divided by A. For design rearrange to find N. CU comes from the photometric table at the Room Cavity Ratio and surface reflectances. RCR equals 5 times h times L plus W, divided by L times W. LLF for LED in clean commercial spaces is typically 0.80 to 0.90."}
,"5.1":{body:["Lighting controls reduce energy by matching output to actual occupancy and available daylight. <strong>ASHRAE 90.1</strong> and <strong>Title 24</strong> mandate automatic controls in most commercial space types. Well-designed controls reduce lighting energy by <strong>30–50% beyond</strong> the savings achieved by efficient sources alone. The combination of LED sources with smart controls is the foundation of modern energy-efficient commercial lighting.","Beyond energy, controls serve occupant comfort. Individual dimming allows users to adjust levels to preference. <strong>Tunable white</strong> systems vary CCT through the day — high CCT/high EML in the morning, warm CCT/low EML in the evening — supporting circadian rhythms. Emergency lighting controls integrate with fire alarm systems to illuminate exit paths.","<strong>LEED v4.1 EQ Interior Lighting</strong> awards a credit point for individual dimming controls for at least 90% of occupant positions. <strong>WELL v2</strong> requires minimum EML levels of 200 or more, flicker limits, and glare control with UGR of 22 or less as preconditions. Both rating systems require commissioning evidence with verifiable, measurable thresholds."],lp:["Controls deliver 30-50 percent additional savings beyond efficient sources. ASHRAE 90.1 and Title 24 require occupancy sensing and daylight controls in most commercial spaces.","Individual dimming plus tunable white supports wellbeing. LEED v4.1 requires individual controls for 90 percent or more of occupant positions for 1 credit point.","Both LEED and WELL require commissioning evidence with verifiable thresholds."],tts:"Lesson 5.1. Why we control. Lighting controls reduce energy by matching output to actual need. ASHRAE 90.1 and Title 24 mandate occupancy sensing and daylight controls in most commercial spaces. Controls deliver 30 to 50 percent additional savings beyond efficient sources alone. Individual dimming and tunable white support wellbeing and circadian rhythms. LEED v4.1 requires individual controls for 90 percent or more of occupant positions. WELL v2 requires minimum melanopic lux, flicker limits, and UGR of 22 or less."}
,"5.2":{body:["<strong>Occupancy sensors</strong> automatically turn lights ON when motion is detected and OFF after a set time-out. <strong>Vacancy sensors</strong> require manual-ON but automatic OFF — saving <strong>5–10% more energy</strong> by avoiding lit spaces when occupants enter briefly. <strong>ASHRAE 90.1-2019</strong> requires vacancy sensors in private offices, meeting rooms, and classrooms.","The two dominant sensor technologies are <strong>PIR (Passive Infrared)</strong> — detects infrared heat pattern changes, works well for large motion but may miss desk typing — and <strong>ultrasonic</strong> — detects motion via Doppler shift, catches fine motion but prone to HVAC airflow false triggers. <strong>Dual-technology sensors</strong> combine both and require both to agree before switching — reducing false-offs. Dual-tech is recommended for private offices.","Standard time-out guidance: 5 to 15 minutes for offices and conference rooms; 2 to 5 minutes for restrooms and storage. Field commissioning and adjustment after installation is essential — uncalibrated sensors consistently underperform."],lp:["Occupancy: auto ON and auto OFF. Vacancy: manual ON and auto OFF. Vacancy saves 5-10 percent more. ASHRAE 90.1-2019 requires vacancy sensors in offices, meeting rooms, and classrooms.","PIR: large motion, misses desk typing. Ultrasonic: fine motion, HVAC triggers. Dual-tech: both must agree — best for offices.","Timeout: 5-15 minutes for offices, 2-5 minutes for restrooms. Field commission and adjust after installation."],tts:"Lesson 5.2. Occupancy versus vacancy sensors. Occupancy sensors auto-ON and auto-OFF. Vacancy sensors require manual-ON and auto-OFF. Vacancy saves 5 to 10 percent more energy. ASHRAE 90.1-2019 requires vacancy sensors in private offices, meeting rooms, and classrooms. PIR detects heat patterns and is good for large motion but misses desk typing. Ultrasonic detects fine motion but is prone to HVAC false triggers. Dual-technology requires both to agree and is best for offices."}
,"5.3":{body:["Daylight harvesting continuously measures illuminance and dims electric lights to maintain the target setpoint. A <strong>closed-loop system</strong> measures the combined daylight-plus-electric illuminance at the work plane and adjusts electric output in real time — the most accurate approach. An <strong>open-loop system</strong> measures incoming daylight only and estimates the dimming needed — simpler but less precise and subject to calibration drift.","<strong>Commissioning</strong> is the most critical element of daylight harvesting success. Even well-designed systems underperform if sensors are not calibrated to actual space conditions. <strong>ASHRAE 90.1</strong> requires photosensor commissioning documentation. <strong>LEED v4.1</strong> daylight credits require annual climate-based daylight modelling using <strong>sDA</strong> (Spatial Daylight Autonomy) and <strong>ASE</strong> (Annual Sunlight Exposure). Credits are awarded for sDA of 55 percent or more and ASE of 10 percent or less.","Common field failures: sensors placed too close to windows; setpoints too low; hysteresis not configured — causing lights to visibly hunt as clouds pass. The specification must require hysteresis settings, time-delay parameters, and specific commissioning verification procedures."],lp:["Closed-loop: measures combined daylight plus electric at work plane — most accurate. Open-loop: measures incoming daylight only — simpler, less precise, drifts.","LEED v4.1: sDA 55 percent or more and ASE 10 percent or less for daylight credits. ASHRAE 90.1 requires commissioning documentation.","Configure hysteresis to prevent light hunting. Commission sensors for actual space conditions after installation."],tts:"Lesson 5.3. Daylight harvesting. Closed-loop systems measure combined daylight and electric at the work plane. Open-loop systems measure incoming daylight only. Commissioning is critical. ASHRAE 90.1 requires photosensor commissioning documentation. LEED v4.1 awards daylight credits for Spatial Daylight Autonomy of 55 percent or more and Annual Sunlight Exposure of 10 percent or less. Configure hysteresis to prevent lights from hunting."}
,"5.4":{body:["<strong>LEED v4.1 EQ Interior Lighting</strong> awards two credit points. The first rewards individual occupant lighting controls for at least 90% of occupant positions. The second rewards meeting at least three of six lighting quality metrics including CRI of 90 or better, R9 of 50 or better, no direct view of sources above 2,500 cd/m², and BUG uplight rating U0. Daylight credits are awarded separately for sDA of 55% or more with ASE of 10% or less required.","<strong>WELL v2 Light</strong> Preconditions: L02 sets minimum illuminance at the eye and UGR of 22 or less for occupied spaces; L03 limits flicker — Percent Flicker of 30% or less for sources below 10,000 cd/m². Optimizations: L04 awards points for 200 EML or more during morning hours; L05 rewards CRI of 90 or better and R9 of 50 or better; L06 rewards sDA of 55% or more and ASE of 10% or less.","For projects pursuing both certifications: verify CRI, R9, Rf, and Rg thresholds from actual test data; run photometric simulations early to verify EML targets; document flicker from independent test reports; and ensure the controls specification includes all commissioning verification procedures for formal credit documentation."],lp:["LEED v4.1: individual controls at 90 percent or more positions earns 1 point. Lighting quality metrics including CRI 90 or better earns 1 point.","WELL v2 Preconditions: L02 minimum illuminance plus UGR 22 or less, L03 flicker. Optimizations: L04 200 EML or more, L05 CRI 90 and R9 50, L06 daylight.","Both require commissioning evidence. Verify CRI, R9, and EML from actual test data."],tts:"Lesson 5.4. LEED and WELL lighting controls. LEED v4.1 EQ awards 1 point for individual controls at 90 percent or more of occupant positions, and 1 point for lighting quality metrics including CRI 90 or better and R9 50 or better. WELL v2 preconditions require minimum illuminance, UGR of 22 or less, and flicker limits. Optimizations award points for 200 EML or more in the morning, CRI 90 or better, and daylight autonomy. Both require commissioning evidence."}
,"5.5":{body:["The <strong>S/P (scotopic-to-photopic) ratio</strong> quantifies rod stimulation versus cone stimulation. Cool-white LEDs at 5000K or above have S/P greater than 1.5 because their richer short-wavelength content stimulates rods more effectively per photopic lumen. Under mesopic conditions — roadways, parking structures — a high-S/P source appears <strong>20–40% brighter</strong> than a warm-white source at identical photopic lux, enabling wattage reductions while maintaining perceived safety.","<strong>DALI-2 (IEC 62386 Edition 2)</strong> is the digital control protocol that surpasses 0–10V analogue. A two-wire bus individually addresses up to 64 devices per segment. Key advantages: scene programming stored at the driver level and surviving power outages; bidirectional fault reporting identifying which fixture has failed; automatic address assignment; and BACnet/IP integration.","DALI-2 Edition 2 adds mandatory compliance testing and standardised device profiles for sensors, switches, and push-buttons, enabling genuine interoperability between products from different manufacturers. The higher cost and complexity is justified for large office campuses, healthcare facilities, and any project requiring individual fault monitoring, scene programming, or BMS integration."],lp:["S/P ratio: cool-white LEDs with S/P above 1.5 appear 20-40 percent brighter per photopic lux under mesopic conditions. Enables wattage reductions in roadway and parking.","DALI-2 per IEC 62386 Edition 2: 64 devices per bus, bidirectional, scene memory at driver, fault reporting, BACnet-IP integration.","DALI-2 is justified for large projects needing individual fault monitoring, scene programming, or BMS integration."],tts:"Lesson 5.5. S-P ratio and DALI-2. The scotopic-to-photopic ratio quantifies rod versus cone stimulation. Cool-white LEDs with S-P above 1.5 appear 20 to 40 percent brighter per photopic lux under mesopic conditions. DALI-2 per IEC 62386 Edition 2 provides 64 individually addressable devices per bus, bidirectional communication, scene memory stored at the driver level, fault reporting per fixture, and BACnet-IP integration. Mandatory compliance testing ensures interoperability between manufacturers."}
,"5.6":{body:["<strong>BACnet (ASHRAE 135)</strong> is the dominant open protocol for building automation systems, enabling lighting, HVAC, security, and other systems to share data on a common network. Lighting controllers speaking BACnet/IP can send energy data to the BAS for dashboard monitoring, receive occupancy schedules, integrate with fire alarm panels for emergency override, and participate in <strong>demand response programmes</strong> where utilities compensate buildings for automatically reducing lighting load during peak grid demand.","The <strong>Internet of Things (IoT)</strong> is transforming commercial lighting into a data platform. Each networked luminaire or sensor node generates data: occupancy patterns, actual illuminance levels, energy consumption, and fault alerts. This enables <strong>space utilisation analytics</strong>, <strong>predictive maintenance</strong> by flagging drivers nearing end of life, and <strong>continuous commissioning</strong> by detecting when daylight sensors drift out of calibration.","<strong>Power over Ethernet (PoE)</strong> delivers both power and data over a single CAT cable. IEEE 802.3bt supports up to 90W per port — sufficient for most LED ceiling fixtures. Advantages: centralised power management, real-time energy metering at fixture level, and plug-and-play installation. Limitation: runs limited to about 100 metres per segment."],lp:["BACnet per ASHRAE 135 links lighting, HVAC, and security on one open-protocol network. Demand response allows utilities to compensate buildings for reducing load during peak grid demand.","IoT lighting: each fixture is a data node for occupancy analytics, predictive maintenance, and continuous commissioning.","PoE per IEEE 802.3bt: power plus data over Cat cable, 90W maximum per port, fixture-level metering, 100 metre segment limit."],tts:"Lesson 5.6. BACnet, IoT, and PoE lighting. BACnet per ASHRAE 135 links lighting, HVAC, and security on one open-protocol network. Demand response allows utilities to compensate buildings for reducing lighting load during peak grid demand. IoT lighting turns each luminaire into a data node for occupancy analytics, predictive maintenance, and continuous commissioning. Power over Ethernet per IEEE 802.3bt delivers power and data over one Cat cable — 90 watts per port maximum with fixture-level metering."}
,"6.1":{body:["A downlight is a luminaire designed to direct light downward from a ceiling-mounted or recessed position. Its performance is defined by three interdependent parameters: the <strong>aperture</strong>, the <strong>beam angle</strong>, and the <strong>trim</strong>. The aperture is the visible opening through which light exits. Standard sizes range from 2 in (50 mm) for tight accent to 3–4 in for task and general applications to 6 in for high-output commercial spaces. Smaller apertures constrain the optical cavity, generally producing narrower, more controlled beams with higher peak candela per lumen.","The <strong>beam angle</strong> is the full angle between the two directions where intensity drops to 50% of peak. A 25° beam is a narrow spot for artwork accent. A 38° beam is a medium flood for general retail or residential accent. A 60°+ beam produces flood coverage for general illuminance. The beam angle combined with mounting height determines the illuminated diameter: <strong>diameter = 2 × h × tan(beam angle / 2)</strong>. At 3 m mounting height, a 36° beam produces an illuminated circle approximately 2 m in diameter.","The <strong>trim</strong> is the visible finishing component integrating the luminaire into the ceiling plane. An <strong>open trim</strong> leaves the lamp or module visible — highest output, highest glare potential. A <strong>baffle trim</strong> uses a grooved absorptive cone to hide the source and reduce perceived luminance — the standard commercial choice. A <strong>lens or diffuser trim</strong> covers the aperture with a frosted or prismatic element, softening distribution and minimising luminance for glare-sensitive environments such as healthcare exam rooms."],lp:["Aperture size and beam: smaller aperture = tighter beam, higher peak cd/lm. Illuminated diameter = 2 x h x tan(beam/2). At 3 m, 36 deg beam = 2 m diameter.","Beam angles: below 25 deg = narrow spot for accent. 25-40 deg = medium flood. Above 40 deg = flood for general illuminance.","Trim: open (highest output, highest glare) = utility only. Baffle (hides source, office standard). Lens/diffuser (lowest luminance, healthcare)."],tts:"Lesson 6.1. Aperture, beam, and trim. A downlight directs light downward from a recessed ceiling position. Aperture sizes range from 2 inches for accent to 6 inches for high-output commercial. The beam angle is the full angle between the two 50-percent-of-peak intensity directions. Beam angle combined with mounting height determines the illuminated diameter: diameter equals 2 times height times tangent of half the beam angle. Trim types: open trim has highest output but highest glare; baffle trim hides the source and is the office standard; lens or diffuser trim gives lowest luminance for healthcare and classrooms."}
,"6.2":{body:["The IES defines five standardised <strong>distribution types for roadway and area luminaires</strong> based on lateral and longitudinal coverage. <strong>Type I</strong> produces a two-way elongated distribution along the road axis — used for narrow walkways and paths where the luminaire is mounted near the centre of the travel lane. <strong>Type II</strong> produces a short lateral reach (~0.5× mounting height) — used for side-of-road luminaires on driveways and entrance lanes.","<strong>Type III</strong> produces a medium lateral reach (~1.5× mounting height) and is the most commonly specified type for roadway, parking lot, and general area lighting. <strong>Type IV</strong> produces a forward-throw asymmetric distribution for mounting at the perimeter of an area or on a building facade — most flux directed forward and away from the mounting structure. Used for building perimeter lighting and wall-mounted area lights. <strong>Type V</strong> produces a circular, symmetric distribution identical in all azimuthal planes — used for pole-mounted area lighting where uniform coverage is needed in all directions.","These types are determined from the luminaire's IES file and guide fixture selection for specific roadway geometries. The IES classification interacts with the <strong>BUG rating</strong> (Backlight, Uplight, Glare) used in dark-sky ordinances to quantify spill light. Always verify that the stated distribution type matches the actual photometric data — manufacturers occasionally mislabel distribution types."],lp:["Type I: two-way along road, walkways. Type II: short lateral, side-of-road. Type III: medium lateral, most common for parking and roadway.","Type IV: forward-throw asymmetric, building perimeter and wall-mount. Type V: circular symmetric, pole-mounted centre-of-area.","Distribution types interact with BUG rating for dark-sky compliance. Verify IES file matches stated type."],tts:"Lesson 6.2. IES distribution types one through five. Type I is two-way along the road axis — used for narrow walkways. Type II has short lateral reach — used for side-of-road applications. Type III has medium lateral reach and is the most common type for parking lots and roadways. Type IV has forward-throw asymmetric distribution — used for building perimeter and wall-mounted applications. Type V is circular and symmetric — used for pole-mounted centre-of-area applications. Distribution types interact with the BUG rating for dark-sky compliance."}
,"6.3":{body:["The <strong>Spacing Criterion (SC)</strong> is a dimensionless ratio published in a luminaire's photometric data that defines the maximum fixture spacing as a multiple of the mounting height for acceptable illuminance uniformity. The formula: <strong>SC = maximum spacing / mounting height</strong>. If SC = 1.3 and mounting height is 3 m, the maximum centre-to-centre spacing is 1.3 × 3 = 3.9 m. Exceeding this spacing produces noticeable scalloping or dark zones between fixture footprints.","The SC is derived from the photometric distribution and quantifies how wide the effective coverage is relative to height. A <strong>bat-wing distribution</strong> (peak intensity at 35–55°) has high SC — typically 1.3–1.5 — because it throws substantial flux to the side. A narrow spot downlight may have SC = 0.8, requiring fixtures closer together than the mounting height. The SC applies separately in the along-fixture and cross-fixture directions for asymmetric luminaires.","<strong>Uniformity</strong> is quantified by Emin/Eavg on the reference plane. For office general lighting, uniformity of <strong>1:3</strong> (minimum ≥ one-third of average) is the IES-recommended threshold. For industrial and outdoor general lighting, <strong>1:5</strong> is acceptable. The SC is a planning rule of thumb — always verify uniformity with a point-by-point calculation in lighting software."],lp:["SC = max spacing / mounting height. SC 1.3 at 3 m = 3.9 m max spacing. Exceeding SC produces dark zones between fixtures.","Bat-wing: SC 1.3-1.5. Narrow spot: SC below 1.0. SC applies separately in each direction for asymmetric luminaires.","Uniformity Emin/Eavg: 1:3 for offices. 1:5 for industrial and outdoor. Always verify with point-by-point calculation."],tts:"Lesson 6.3. Spacing criterion. SC equals maximum spacing divided by mounting height. If SC is 1.3 and mounting height is 3 metres, maximum spacing is 3.9 metres. Exceeding SC produces dark zones between fixtures. Bat-wing distributions have SC of 1.3 to 1.5. Narrow spots have SC below 1.0. Uniformity ratio Emin divided by Eavg: 1 to 3 is recommended for offices. 1 to 5 is acceptable for industrial and outdoor. Always verify with a point-by-point calculation."}
,"6.4":{body:["The trim is the visible finished component that integrates the luminaire into the ceiling plane. Its selection affects glare, aesthetics, and optical efficiency. <strong>Open trims</strong> leave the LED module visible from normal viewing angles. They deliver the highest light output — no additional absorbing surfaces — but create the highest luminance at the aperture. Appropriate for utilitarian spaces: warehouses, garages, and storage areas where glare control is not a priority. Rarely appropriate for occupied offices, hospitality, or healthcare.","<strong>Baffle trims</strong> use a grooved, absorptive cone — usually black — that surrounds the aperture and hides the LED module from oblique viewing angles. The baffling reduces the solid angle from which the source is visible, dramatically reducing perceived luminance at typical viewing angles. Deeper baffles provide better cutoff at lower angles but slightly reduce total output. Baffle trims are the standard choice for commercial offices and retail — offices typically require UGR ≤ 19 per EN 12464-1.","<strong>Lens and diffuser trims</strong> cover the aperture with a frosted or prismatic element, spreading flux and reducing peak luminance. Appropriate for healthcare environments, classrooms, and any space where occupants spend significant time in reclined positions looking directly upward — patient wards, recovery rooms, and examination rooms. A prismatic lens maintains reasonable output efficiency while reducing source visibility; a frosted diffuser produces the lowest luminance but greatest light loss."],lp:["Open trim: highest output, source visible, highest glare. For utilitarian spaces only.","Baffle trim: absorptive grooved cone hides source. Standard for offices (UGR 19 or less). Deeper baffle = better cutoff, slightly lower output.","Lens/diffuser: frosted or prismatic cover, lowest luminance. For healthcare patient rooms, exam rooms, and classrooms."],tts:"Lesson 6.4. Trim selection. Open trims leave the LED module visible — highest output, highest glare, for utility spaces only. Baffle trims use a grooved absorptive cone to hide the source and control glare. The baffle is the standard choice for commercial offices where UGR of 19 or less is required. Lens and diffuser trims cover the aperture with frosted or prismatic elements, producing the lowest luminance. Used for healthcare patient rooms, examination rooms, and classrooms where occupants look directly upward."}
,"6.5":{body:["An <strong>edge-lit panel</strong> uses LEDs mounted at the perimeter edges of a flat <strong>Light Guide Plate (LGP)</strong> — typically clear acrylic or polycarbonate. The LGP conducts light across its face through total internal reflection, with extraction features on the back redirecting light downward. Traditional edge-lit panels suffer from a characteristic optical flaw: they are significantly brighter near the LED edges than at the centre. This luminance gradient — visible as a bright ring around the perimeter — detracts from perceived quality and can fail glare specifications.","A <strong>waveguide panel</strong> addresses this by engineering the density and geometry of micro-optic extraction features across the LGP to precisely counterbalance the fall-off in guided light intensity from edge to centre. The extraction pattern is denser at the centre and sparser near the edges, producing nominally uniform luminance across the full panel face. Premium waveguide panels achieve <strong>luminance uniformity of 60–80%+</strong> (minimum ≥ 60–80% of maximum), compared to 30–40% for traditional edge-lit panels.","For open office environments, healthcare, and premium commercial applications, a <strong>maximum luminance specification</strong> — typically ≤ 3,000 cd/m² when viewed at 65° from vertical — is increasingly specified in conjunction with UGR calculations to ensure glare compliance. The UGR 19 limit common in European office standards (EN 12464-1) requires careful panel selection; many standard commercial panels cannot achieve this without additional baffling or reduced loading."],lp:["Traditional edge-lit: LEDs at edge, LGP via total internal reflection, bright edges vs dark centre, 30-40 percent luminance uniformity.","Waveguide: engineered micro-optic extraction density gradient, uniform corner-to-corner, 60-80 percent or better uniformity.","Specify max luminance 3,000 cd/m2 or less at 65 degrees from vertical alongside UGR 19 or less for open office and healthcare."],tts:"Lesson 6.5. Waveguides and edge-lit panels. A traditional edge-lit panel uses LEDs at the perimeter of a light guide plate. Light conducts across the panel by total internal reflection. The result is bright edges and a darker centre — typically only 30 to 40 percent luminance uniformity. A waveguide panel engineers the density of micro-optic extraction features across the panel face to counterbalance this — denser at the centre, sparser at the edges. Premium waveguide panels achieve 60 to 80 percent or better luminance uniformity. For open office and healthcare, specify maximum luminance of 3,000 cd/m2 or less at 65 degrees from vertical alongside UGR of 19 or less."}
,"6.6":{body:["Matching luminaire type to application is the central competency of lighting design. For <strong>open office environments</strong>, the critical requirements are: horizontal illuminance of 300–500 lux at the work plane (IES RP-1); UGR ≤ 19 to avoid discomfort glare on monitor screens; ceiling luminance ≤ 3,000 cd/m² at 65° for visual comfort; and controls integration for occupancy sensing and daylight harvesting. Recessed direct-indirect or direct luminaires with low-glare optics and waveguide panels are the standard choice.","For <strong>retail environments</strong>, the goal is to attract attention and present merchandise attractively. This requires a <strong>layered approach</strong>: ambient illuminance from ceiling luminaires for basic orientation (300–500 lux), accent lighting from adjustable track or recessed fixtures at <strong>3–5× the ambient level</strong> creating visual interest and drawing the eye to key merchandise. High CCT (3000–4000 K for general retail), Ra ≥ 90, and R9 ≥ 50 are critical for merchandise colour presentation.","<strong>Hospitality and restaurant</strong> lighting prioritises atmosphere over uniformity. Warm CCT (2700–3000 K), dimming flexibility, and a layered approach creating zones of brightness and intimate shadow are the key design drivers. Average illuminance may be as low as 50–100 lux, with accent peaks at 300–500 lux on surfaces of interest. The key performance metric is the <strong>contrast ratio</strong> between ambient and accent — typically 5:1 to 10:1 for premium dining environments."],lp:["Open office: 300-500 lux, UGR 19 or less, ceiling luminance 3,000 cd/m2 or less at 65 degrees, uniformity 1:3, with controls integration.","Retail: ambient 300-500 lux plus accent at 3-5 times ambient. Ra 90 or better, R9 50 or better, adjustable track for flexibility.","Hospitality: 50-100 lux ambient with 5:1 to 10:1 accent contrast ratio. Warm CCT 2700-3000K, dimming essential."],tts:"Lesson 6.6. Interior lighting design applications. Open office requires 300 to 500 lux, UGR of 19 or less, ceiling luminance of 3,000 cd/m2 or less at 65 degrees, uniformity of 1 to 3, and controls integration. Retail requires a layered approach: ambient at 300 to 500 lux plus accent at 3 to 5 times the ambient level. Use Ra 90 or better and R9 50 or better for merchandise presentation. Hospitality prioritises atmosphere — 50 to 100 lux ambient with a contrast ratio of 5:1 to 10:1 between ambient and accent. Use warm CCT of 2700 to 3000 Kelvin with dimming flexibility."}
,"7.1":{body:["The IES <strong>BUG rating</strong> (Backlight, Uplight, Glare) is the standardised system for quantifying the spill light characteristics of outdoor luminaires. Each metric is rated on a scale of 0–5, where 0 represents no light in that zone and higher numbers indicate more spill. <strong>Backlight (B)</strong> quantifies light directed behind the luminaire, onto adjacent properties, buildings, or streets — the primary measure of light trespass. <strong>Uplight (U)</strong> quantifies light directed above the horizontal plane (above 90°) — the primary driver of sky glow and the main concern for dark-sky ordinances. <strong>Glare (G)</strong> quantifies high-angle forward light that causes discomfort glare to pedestrians, drivers, and residents.","BUG ratings are derived from the luminaire's IES photometric data by integrating candela values in each angular zone. The IDA/IES Model Lighting Ordinance uses BUG ratings to set maximum allowable values by lighting zone — for example, a dark residential zone might require B1U0G1 while a commercial zone might permit B3U1G3. Specifying by BUG rating is more precise than specifying by distribution type alone, because it quantifies the actual flux in each zone rather than just the general shape of the distribution.","In practice, full-cutoff or flat-glass luminaires with the optical axis aimed straight down (0° tilt) minimise both U and B ratings. Tilting a luminaire forward or backward to improve coverage often increases backlight and uplight. Shielding accessories — house-side shields, visors — can reduce B ratings without changing the optical system. Dark-sky compliance typically requires U0 (zero uplight) and specific B and G limits based on the lighting zone designation."],lp:["BUG rating: B=Backlight (trespass), U=Uplight (sky glow), G=Glare (discomfort). Each rated 0-5. Lower numbers = less spill.","U0 = zero uplight = dark-sky safe. IDA/IES Model Lighting Ordinance sets max BUG by lighting zone LZ0-LZ4.","Full-cutoff flat-glass luminaires minimise U and B. Tilting increases both. Shielding accessories reduce B without changing optics."],tts:"Lesson 7.1. BUG rating. The BUG rating system quantifies outdoor luminaire spill light. B is Backlight — light behind the fixture that causes trespass onto adjacent properties. U is Uplight — light above 90 degrees that drives sky glow. G is Glare — high-angle forward light causing discomfort. Each is rated 0 to 5, where 0 means no light in that zone. The IDA and IES Model Lighting Ordinance sets maximum BUG values by lighting zone. U0 means zero uplight and is required for dark-sky compliance. Full-cutoff flat-glass luminaires minimise both U and B ratings."}
,"7.2":{body:["Dark-sky lighting follows five principles established by the <strong>International Dark-Sky Association (IDA)</strong> and codified in the IDA/IES Model Lighting Ordinance. First: <strong>Useful</strong> — only light what needs to be lit, for the time it needs to be lit. Second: <strong>Targeted</strong> — direct light only where needed; use full-cutoff luminaires and shielding to prevent spill. Third: <strong>Low level</strong> — use the minimum illuminance necessary for the visual task; exceed minimum requirements only with documented justification. Fourth: <strong>Controlled</strong> — use timers, occupancy sensors, and dimming to reduce light levels during late-night curfew hours when activity drops. Fifth: <strong>Warm colour</strong> — use CCT ≤ 3000 K to reduce short-wavelength blue-rich scatter in the atmosphere (Rayleigh scattering), which has a disproportionate contribution to sky glow; additionally, cool white light disrupts nocturnal wildlife more severely than warm sources.","Lighting zones LZ0 through LZ4 classify the ambient environment from natural darkness (LZ0: national parks, wilderness areas) through rural residential (LZ1), neighbourhood residential (LZ2), suburban commercial (LZ3), to high-activity commercial (LZ4). Each zone has prescribed maximum luminaire lumens, BUG limits, and curfew requirements. Projects in or adjacent to sensitive natural areas should design to LZ0 or LZ1 standards regardless of local code requirements.","The most common compliance failure in exterior lighting is excessive uplight from tilted or poorly aimed luminaires, and from luminaires with clear-glass lower hemispheres that allow flux to escape at high angles. Specifying flat-lens full-cutoff optics with zero tilt, appropriate BUG ratings, and automatic curfew dimming addresses the majority of dark-sky compliance requirements."],lp:["Five IDA dark-sky principles: Useful, Targeted, Low level, Controlled, Warm colour. CCT 3000K or less reduces atmospheric scatter and wildlife impact.","Lighting zones LZ0 (wilderness) through LZ4 (dense commercial) set max luminaire lumens, BUG limits, and curfew requirements.","Most common compliance failure: uplight from tilted luminaires or clear-glass hemispheres. Fix with flat-lens full-cutoff optics, zero tilt, and curfew dimming."],tts:"Lesson 7.2. Dark-sky lighting. The five IDA dark-sky principles are: Useful — only light what needs lighting. Targeted — direct light downward and minimise spill. Low level — use the minimum illuminance needed. Controlled — use timers and sensors to reduce output late at night. Warm colour — CCT of 3000 Kelvin or less reduces atmospheric scatter and wildlife disruption. Lighting zones LZ0 through LZ4 classify environments from wilderness to dense commercial and set maximum flux, BUG limits, and curfew requirements. The most common compliance failure is uplight from tilted luminaires or clear-glass lower hemispheres."}
,"7.3":{body:["<strong>NFPA 101</strong> (Life Safety Code) and the <strong>International Building Code (IBC)</strong> establish the minimum requirements for emergency egress lighting in the United States. Emergency illumination must be provided along all means of egress — corridors, stairwells, exit passageways, and areas of refuge — for a minimum duration of <strong>90 minutes</strong> after loss of normal power. The prescribed illuminance levels are: a minimum of <strong>1 foot-candle (10 lux) along the egress path</strong> measured at floor level, with an average of at least 0.1 fc (1 lux) in open areas of the floor; and a maximum-to-minimum ratio of <strong>40:1</strong> to prevent excessively dark pockets between luminaires.","All emergency lighting must be capable of activating <strong>within 10 seconds</strong> of normal power loss. LED emergency luminaires with battery backup are now the dominant solution — they activate instantly at full output, whereas fluorescent emergency systems often had delayed start or reduced initial output. Self-contained units with integral batteries are common in smaller installations; central battery systems serve larger facilities with many emergency luminaires on a common circuit.","Testing requirements: a <strong>30-second functional test</strong> must be performed monthly on every emergency luminaire to verify battery condition and lamp operation. An <strong>annual 90-minute full-duration load test</strong> must be performed to confirm that the battery can sustain rated output for the full required duration. Many modern emergency units incorporate self-testing and self-diagnostic circuitry that automatically performs these tests and records results — simplifying compliance documentation."],lp:["NFPA 101: 1 fc (10 lux) min along egress path at floor level. 0.1 fc avg open areas. Max:min ratio 40:1. Duration: 90 minutes.","Activate within 10 seconds of power loss. LED emergency units activate instantly — advantage over fluorescent delayed-start systems.","Testing: 30-second functional test monthly. 90-minute full load test annually. Self-testing units simplify compliance documentation."],tts:"Lesson 7.3. NFPA 101 emergency lighting. NFPA 101 requires emergency illumination along all means of egress for a minimum of 90 minutes after power loss. The minimum illuminance is 1 foot-candle — 10 lux — at floor level along the egress path. Open floor areas require 0.1 foot-candle average. The maximum to minimum ratio must not exceed 40 to 1. Emergency lighting must activate within 10 seconds of power loss. LED emergency units activate instantly. Testing requirements: 30-second functional test monthly and a 90-minute full load test annually."}
,"7.4":{body:["Emergency lighting power can be provided by three main systems. <strong>Self-contained emergency units</strong> incorporate a battery, charger, and inverter in each individual luminaire. When normal power fails, the unit detects the outage and switches to battery power within seconds, maintaining light output at or above the NFPA 101 minimum for 90 minutes. Self-contained units are the most common choice for smaller facilities — they require no separate emergency circuit and are easily added to existing installations. The trade-off is distributed battery maintenance across many individual units.","<strong>Central battery systems</strong> use a single large battery plant — typically sealed lead-acid or lithium-iron phosphate — with a dedicated emergency circuit feeding multiple luminaires throughout the facility. Central systems simplify battery maintenance (single location), extend battery life compared to small self-contained units, and are typically lower cost per luminaire in large installations. They require dedicated emergency circuit wiring from a central battery room and are most cost-effective for large commercial, institutional, or healthcare facilities.","<strong>Generator-backed emergency circuits</strong> use an automatic transfer switch (ATS) to connect critical loads to a standby generator within a required transfer time after power loss. NEC Article 700 (Emergency Systems) requires transfer in not more than <strong>10 seconds</strong> for life-safety loads. Healthcare facilities (NEC Article 517) require even more stringent requirements, including Type 1 Essential Electrical Systems with redundant power feeds. Generators are used where extended power outages are likely, where battery capacity would be impractical, or where code requires continuous (not just 90-minute) power for specific loads."],lp:["Self-contained: battery in each fixture, activates automatically, no special wiring. Common for small facilities. Distributed battery maintenance.","Central battery: single battery plant, dedicated emergency circuit, lower cost per fixture at scale, central maintenance. Best for large facilities.","Generator with ATS: NEC Article 700 requires 10-second transfer for life-safety loads. Healthcare NEC Article 517 has additional requirements."],tts:"Lesson 7.4. Emergency power systems. Self-contained units have a battery inside each luminaire — they activate automatically, require no special wiring, and are common for small facilities. The trade-off is distributed battery maintenance. Central battery systems use a single battery plant feeding a dedicated emergency circuit throughout the building — lower cost per luminaire at scale and centralised maintenance. Generator systems use an automatic transfer switch to connect life-safety loads to a standby generator. NEC Article 700 requires transfer within 10 seconds for emergency systems. Healthcare facilities must comply with NEC Article 517."}
,"7.5":{body:["<strong>Exit signs</strong> are required by NFPA 101 and the IBC at every exit, at every point where the egress path changes direction, and at any point on the egress path from which the next exit sign is not clearly visible. Signs must be visible from any point on the means of egress that they serve. For 6-inch letter height (the standard), the maximum viewing distance is approximately <strong>100 feet (30 m)</strong>. Exit signs must be internally illuminated or externally illuminated to a minimum of 5 fc (54 lux) on the face under normal conditions, and must maintain illumination for at least 90 minutes on emergency power.","LED exit signs have almost entirely replaced fluorescent and incandescent types. LED exit signs consume 2–5 watts compared to 15–20 watts for fluorescent signs — a direct energy saving. LED signs also have longer lamp life (50,000+ hours), reducing maintenance frequency. Battery-backed LED exit signs provide 90-minute emergency duration and incorporate the self-test provisions of NFPA 101. <strong>Photoluminescent</strong> exit signs — which absorb ambient light and glow in the dark — require no electrical power at all and are permitted in certain low-risk occupancies as an alternative to electrically powered signs.","The <strong>egress lighting path</strong> must provide continuous illumination from the occupied space to the public way. This includes corridors, aisles, ramps, escalators, stairwells, exit passageways, and exterior exit discharge paths. Adequate luminaire spacing ensures the 1 fc minimum and the 40:1 max:min ratio are maintained along the entire path. Stairwells require careful photometric analysis because the geometry of treads and risers creates complex illuminance patterns — the 1 fc minimum must be maintained on the horizontal plane of each tread."],lp:["Exit signs: required at every exit, direction change, and wherever next sign is not visible. 6-inch letters have 100 ft (30 m) max viewing distance.","LED exit signs: 2-5 watts vs 15-20 W for fluorescent. 50,000+ hour life. 90-minute battery backup. Self-test provisions.","Egress lighting: 1 fc min at floor along full path from occupied space to public way. Stairwell treads need individual photometric analysis."],tts:"Lesson 7.5. Exit signs and egress lighting. NFPA 101 requires exit signs at every exit and at every direction change on the egress path. For 6-inch letter height, the maximum viewing distance is 100 feet or 30 metres. LED exit signs consume 2 to 5 watts compared to 15 to 20 watts for fluorescent — a major energy saving with 50,000 hour or more life. Battery-backed LED signs provide 90-minute emergency duration. Photoluminescent signs require no electrical power and are permitted in certain occupancies. The egress lighting path must provide 1 foot-candle minimum at floor level continuously from occupied space to the public way."}
,"7.6":{body:["<strong>ASHRAE 90.1</strong> sets <strong>Exterior Lighting Power Density (LPD)</strong> allowances for common exterior application types. Key limits: parking lots — 0.15 W/ft² maximum; covered parking structures — 0.19 W/ft²; walkways — 1.0 W/linear ft; building facades (decorative) — 1.0 W/ft² of illuminated area; service and entry canopies — 1.25 W/ft². These limits apply to the luminaire wattage used in the calculation, not the total area. ASHRAE 90.1 allows up to 5% additional wattage for specific features (emergency use, flag lighting, etc.).","The <strong>IDA/IES Model Lighting Ordinance (MLO)</strong> classifies outdoor lighting zones LZ0 through LZ4 based on ambient brightness. Each zone sets maximum initial lumens per area and BUG rating limits. The MLO also includes <strong>curfew provisions</strong> — typically requiring that luminaire output be reduced by 50% or more, or shut off entirely, after a specified hour (often 11 PM or midnight) when pedestrian activity substantially decreases. IECC and many local ordinances have adopted similar curfew provisions for non-24-hour applications such as retail parking lots and office campuses.","The combination of energy codes (LPD limits), dark-sky codes (BUG/zone limits and curfew), and safety codes (egress minimums) creates a multi-constraint specification environment for exterior lighting. Designers must simultaneously satisfy the LPD upper bounds, the BUG maximum values, the egress minimum illuminance floors, and the curfew control requirements — while achieving the owner's aesthetic and safety goals. The design process starts with the most restrictive constraint and works outward."],lp:["ASHRAE 90.1 exterior LPD: parking 0.15 W/sqft, walkways 1.0 W/linft, building facades 1.0 W/sqft, service canopies 1.25 W/sqft.","MLO lighting zones LZ0-LZ4 set max lumens per area and BUG limits. Curfew provisions require 50%+ dimming or shutoff after late evening.","Design process: satisfy LPD upper bounds + BUG limits + egress minimums + curfew controls simultaneously."],tts:"Lesson 7.6. Exterior lighting code compliance. ASHRAE 90.1 sets exterior LPD allowances: parking lots at 0.15 watts per square foot, walkways at 1.0 watt per linear foot, building facades at 1.0 watt per square foot, and service canopies at 1.25 watts per square foot. The IDA and IES Model Lighting Ordinance defines lighting zones LZ0 through LZ4. Each zone sets maximum lumens per area and BUG rating limits. Curfew provisions typically require 50 percent or more dimming after late evening. Exterior lighting design must simultaneously satisfy LPD upper limits, BUG maximums, egress minimums, and curfew control requirements."}
,"8.1":{body:["High-bay and low-bay luminaires are defined by their intended mounting height range. <strong>Low-bay luminaires</strong> are designed for mounting heights of 4.5–7.5 m (15–25 ft) and typically use wide-distribution optics that spread light over a large area from a relatively close distance. They are used in retail back-of-house areas, light manufacturing, assembly areas, and commercial kitchens. <strong>High-bay luminaires</strong> are designed for mounting heights of 7.5 m (25 ft) and above, requiring optics that concentrate light to maintain adequate illuminance levels on the floor or work plane from a greater distance.","High-bay LED luminaires have largely replaced metal halide and HID high-bays in new construction and retrofit. LED high-bays offer: instant-on (no warm-up time), compatibility with occupancy sensors and daylight harvesting controls, significantly higher efficacy (100–170 lm/W vs 75–120 lm/W for metal halide), and substantially longer maintenance-free life. The transition from HID to LED high-bay is one of the largest single sources of industrial energy savings available today, with payback periods of 2–4 years in high-utilisation facilities.","The optic selection for high-bay applications follows the mounting height and aisle geometry. For very high mounting (12+ m), narrow optics (60° beam) maintain adequate illuminance. For medium heights (7.5–10 m), medium-distribution optics (90–120°) provide good uniformity. Wide-distribution symmetric optics are used for lower mounting heights or for applications requiring high uniformity ratios, such as sports halls where the uniformity ratio may be specified at 1:2 or better."],lp:["Low-bay: 4.5-7.5 m mounting, wide distribution. High-bay: 7.5 m and above, narrow-to-medium optic needed.","LED high-bays: instant-on, controls-compatible, 100-170 lm/W. Replaced HID high-bays in most new and retrofit applications.","Optic selection: narrow (60 deg) for 12 m+, medium (90-120 deg) for 7.5-10 m, wide for lower mounting or sports uniformity."],tts:"Lesson 8.1. High-bay versus low-bay mounting. Low-bay luminaires mount at 4.5 to 7.5 metres and use wide-distribution optics. High-bay luminaires mount at 7.5 metres or above and require narrower optics to maintain adequate illuminance at floor level. LED high-bays have largely replaced metal halide in industrial applications — they are instant-on, controls-compatible, and achieve 100 to 170 lumens per watt versus 75 to 120 for metal halide, with much longer life. Optic selection follows mounting height: narrow 60-degree optics for 12 metres or more, medium 90 to 120 degree for 7.5 to 10 metres."}
,"8.2":{body:["<strong>IP ratings (Ingress Protection, IEC 60529)</strong> quantify a luminaire's resistance to solid particle and liquid ingress using a two-digit code. The first digit (0–6) describes solid particle protection: 5 = dust-protected, 6 = dust-tight. The second digit (0–9) describes liquid protection: 4 = splash from any direction, 5 = low-pressure water jets, 6 = high-pressure water jets, 7 = temporary immersion, 8 = continuous immersion. For exterior and wet locations, <strong>IP65</strong> (dust-tight + low-pressure water jet) is the standard minimum. For hose-down applications such as food processing or car washes, <strong>IP66</strong> or IP67 is required.","<strong>IK ratings (IEC 62262)</strong> describe impact resistance. IK08 withstands 5 joules of impact; IK10 withstands 20 joules — equivalent to a 5 kg mass dropped from 400 mm. IK10 is specified for vandal-resistant fixtures in sports facilities, correctional institutions, transportation, and public spaces. <strong>NEMA enclosure ratings</strong> are the North American equivalent for electrical enclosures. NEMA 3R = rainproof; NEMA 4 = watertight and hose-down resistant; NEMA 4X = NEMA 4 plus corrosion resistance (stainless steel or fibreglass housing) for marine, chemical processing, and food processing environments.","Selecting the correct IP, IK, and NEMA rating for the installation environment is a mandatory step in industrial and exterior luminaire specification. Underrating an enclosure results in premature failure, safety hazards, and warranty voidance. Overrating adds cost unnecessarily. For food processing areas: IP66 or IP67 minimum; IK10 for fixture protection; NEMA 4X for corrosion resistance. For sports: IP65 + IK10. For general exterior: IP65. For offices and dry interiors: IP20 is typically sufficient."],lp:["IP rating: first digit = solid (6=dust-tight), second digit = liquid (5=low-pressure jet, 6=high-pressure jet). IP65 = exterior standard minimum.","IK rating: impact resistance. IK08 = 5 joule. IK10 = 20 joule. Required for vandal-resistant sports, corrections, and public space fixtures.","NEMA 3R = rain. NEMA 4 = hose-down. NEMA 4X = hose-down plus corrosion resistance. North American enclosure standard."],tts:"Lesson 8.2. IP, IK, and NEMA ratings. The IP rating uses two digits: the first for solid particle protection, the second for liquid. IP65 is dust-tight and low-pressure water jet resistant — the standard minimum for exterior and wet locations. IP66 adds high-pressure water jet resistance for food processing and car washes. The IK rating describes impact resistance: IK08 withstands 5 joules, IK10 withstands 20 joules — required for sports, corrections, and public spaces. NEMA 3R is rainproof. NEMA 4 is hose-down resistant. NEMA 4X adds corrosion resistance for marine and chemical environments."}
,"8.3":{body:["NEC Article 500 classifies hazardous locations by the type of hazardous material present and the likelihood of hazard occurrence. <strong>Class I</strong> locations contain flammable gases, vapours, or liquids: petroleum refineries, paint spray booths, dry-cleaning facilities, and chemical plants. <strong>Class II</strong> locations contain combustible dust: grain elevators, flour mills, coal handling facilities, and metal powder processing. <strong>Class III</strong> locations contain ignitable fibres or flyings: textile mills, woodworking facilities, and cotton gins.","Within each Class, two <strong>Divisions</strong> describe the probability of hazardous conditions. <strong>Division 1</strong> means the hazardous material is present under normal operating conditions — the atmosphere is routinely ignitable. <strong>Division 2</strong> means the hazardous material is present only under abnormal conditions such as equipment failure or accident — the atmosphere is not normally ignitable. Division 1 requires explosion-proof or intrinsically safe luminaires; Division 2 permits a wider range of protected luminaires. The NEC also incorporates the IEC Zone classification system (Zone 0/1/2 for gases, Zone 20/21/22 for dusts) which is common in international projects.","Luminaires for hazardous locations must be specifically listed (UL, CSA) for the Class and Division of the installation. The listing agency verifies that the luminaire cannot ignite the specific hazardous atmosphere. <strong>Explosion-proof</strong> luminaires are constructed to contain any internal explosion without igniting the surrounding atmosphere. <strong>Intrinsically safe</strong> circuits are designed so that electrical energy is too low to ignite the hazardous atmosphere even under fault conditions. Using a standard luminaire — even IP65 rated — in a Class I Division 1 environment is a code violation and a serious safety hazard."],lp:["Class I: flammable gases/vapours (petroleum, paint, chemicals). Class II: combustible dust (grain, flour, coal). Class III: ignitable fibres (textile, woodworking).","Division 1: hazard present under normal conditions — explosion-proof or intrinsically safe luminaires required. Division 2: hazard only under abnormal conditions.","Luminaires must be specifically listed for the Class and Division. IP65 alone is NOT sufficient for hazardous locations."],tts:"Lesson 8.3. Hazardous location classification. NEC Article 500 defines three classes. Class I is flammable gases or vapours — petroleum refineries, paint spray booths, chemical plants. Class II is combustible dust — grain elevators, flour mills, coal handling. Class III is ignitable fibres — textile mills and woodworking. Division 1 means the hazard is present under normal operation — explosion-proof or intrinsically safe luminaires are required. Division 2 means the hazard occurs only under abnormal conditions. Luminaires must be specifically UL or CSA listed for the Class and Division. An IP65 rating alone is not sufficient for hazardous locations."}
,"8.4":{body:["The <strong>circadian rhythm</strong> is the approximately 24-hour internal biological clock that regulates sleep-wake cycles, hormone secretion, metabolism, and cell repair. It is synchronised to local time primarily by light received through the eyes via the <strong>ipRGC (intrinsically photosensitive retinal ganglion cells)</strong> — photoreceptors containing the photopigment melanopsin, with peak sensitivity at approximately 480 nm (blue-cyan). High levels of short-wavelength light in the morning suppress melatonin and promote cortisol, supporting alertness and daytime performance. Low levels of short-wavelength light in the evening allow melatonin production, facilitating sleep onset.","For architectural lighting, circadian support is implemented through dynamic lighting systems that provide <strong>high EML (equivalent melanopic lux)</strong> — typically ≥ 200 EML at the eye — during morning hours, then transition to lower EML and warmer CCT in the late afternoon and evening. This is achieved with <strong>tunable white</strong> luminaires that allow independent adjustment of blue-channel and phosphor-channel output, shifting the spectrum from high-CCT blue-rich to warm CCT with reduced melanopic stimulus. WELL v2 Credit L04 requires ≥ 200 EML at the eye for ≥ 75% of workstations during standard morning business hours.","Circadian lighting design requires calculating EML — not photopic lux — at the eye level of occupants in their typical working positions. EML calculations require the full spectral power distribution (SPD) of the luminaire weighted by the melanopic action spectrum. Lighting software such as ALFA, DIALux with WELL plugins, or Litestar can perform these calculations. The most common specification error is confusing photopic lux with EML: a high-lux warm-white source may have very low EML despite its high illuminance, while a lower-lux high-CCT source may satisfy EML requirements at reduced power."],lp:["ipRGC with melanopsin at 480 nm drives circadian rhythm via SCN. High EML morning = alertness. Low EML evening = melatonin, sleep onset.","WELL v2 L04: 200 EML or more at the eye for 75 percent or more of workstations during morning hours. Requires tunable white system.","Calculate EML separately from photopic lux using the melanopic action spectrum and the full SPD. High lux warm-white can have very low EML."],tts:"Lesson 8.4. Circadian rhythms and ipRGC lighting. The circadian rhythm is the internal biological clock synchronised by light received through the ipRGC cells. These contain melanopsin with peak sensitivity at 480 nanometres — blue-cyan. High equivalent melanopic lux in the morning suppresses melatonin and supports alertness. Low EML in the evening allows melatonin production for sleep. WELL v2 Credit L04 requires 200 EML or more at the eye for 75 percent or more of workstations during morning hours. This requires tunable white luminaires. EML must be calculated separately from photopic lux using the melanopic action spectrum — a high-lux warm-white source can have very low EML."}
,"8.5":{body:["<strong>WELL v2</strong> is the second edition of the WELL Building Standard, published by the International WELL Building Institute (IWBI). The Light concept addresses both the quantity and quality of light that reaches building occupants. It is structured as mandatory <strong>Preconditions</strong> — which must all be met for any level of certification — and optional <strong>Optimizations</strong> — which earn points toward Silver, Gold, and Platinum certification levels.","Preconditions: <strong>L01</strong> requires lighting design documentation submitted for review. <strong>L02</strong> (Visual Lighting Design) sets minimum illuminance requirements at the eye level (not desk level) for each space type, and requires UGR ≤ 22 for most regularly occupied spaces, ≤ 19 for work-intensive areas. <strong>L03</strong> (Circadian Lighting Design) limits flicker — Percent Flicker ≤ 30% and Flicker Index ≤ 0.10 for sources below 10,000 cd/m², and similar limits for higher-luminance sources. Optimizations: <strong>L04</strong> awards points for ≥ 200 EML at the eye for ≥ 75% of workstations during morning hours. <strong>L05</strong> awards points for specifying CRI ≥ 90 and R9 ≥ 50. <strong>L06</strong> awards points for achieving sDA ≥ 55% and ASE ≤ 10% from daylight.","In practice, achieving WELL v2 Light certification requires: tunable white luminaires (for L04 EML + L02 illuminance balance); photometric simulations confirming UGR and EML values; flicker measurements from independent test reports (not manufacturer datasheets); daylight simulation for L06; and a robust commissioning process to verify all targets are achieved at occupancy. The most common WELL Light failure is specifying luminaires that satisfy CCT and lumen requirements but have insufficient blue channel to achieve 200 EML at the eye."],lp:["WELL v2 Preconditions: L01 documentation, L02 min illuminance + UGR 22 or less, L03 flicker limits (Percent Flicker 30% max). All must be met.","Optimizations: L04 = 200 EML or more at eye, L05 = CRI 90 and R9 50 or better, L06 = sDA 55% or more and ASE 10% or less.","Common failure: luminaires meeting lumen and CCT targets but lacking sufficient blue channel to achieve 200 EML. Verify with melanopic action spectrum calculation."],tts:"Lesson 8.5. WELL v2 Light concept. WELL v2 Light has mandatory Preconditions and optional Optimizations. Preconditions: L01 requires design documentation. L02 requires minimum illuminance at the eye and UGR of 22 or less. L03 limits flicker — Percent Flicker of 30 percent maximum. Optimizations: L04 awards points for 200 EML or more at the eye during morning hours. L05 rewards CRI 90 or better and R9 50 or better. L06 rewards daylight autonomy of 55 percent or more with Annual Sunlight Exposure of 10 percent or less. The most common failure is specifying luminaires that meet lumen targets but lack sufficient blue channel to achieve 200 equivalent melanopic lux."}
,"8.6":{body:["<strong>IES RP-7</strong> (Recommended Practice for Lighting Industrial Facilities) provides illuminance recommendations for a wide range of industrial task types, grouped by visual difficulty and colour discrimination requirement. Key target levels: <strong>rough service areas and warehouses</strong> — 200–300 lux general illuminance, Ra ≥ 60 acceptable where colour discrimination is not required. <strong>Manufacturing and assembly</strong> — 500–750 lux for medium-difficulty assembly, 750–1,000 lux for fine assembly and precision work, Ra ≥ 80 minimum for tasks requiring colour judgement. <strong>Critical inspection and quality control</strong> — 1,000–2,000 lux at the inspection surface, Ra ≥ 90 minimum, R9 ≥ 50, and D65 evaluation source for colour-critical work.","Glare control in industrial environments is particularly important because workers are often stationary and performing sustained visual tasks at fixed workstations. Disabling glare (direct glare from luminaires in the upper visual field) causes headaches, eye strain, and increased error rates in precision work. Industrial luminaires should provide a luminous intensity of less than 1,000 cd at 85° from nadir to comply with typical industrial glare criteria. For computer-assisted manufacturing (CAM) workstations, the same UGR ≤ 19 criteria that apply to office environments should be applied.","The stroboscopic effect — whereby rotating machinery appears stationary under light flickering at specific frequencies — is a documented safety hazard in industrial environments (IES RP-7, OSHA standards). Electronic ballasts and LED drivers operating at high frequency essentially eliminate the stroboscopic risk. However, LED drivers with low-quality PWM dimming at frequencies below 200 Hz can re-introduce it. Always verify that industrial LED drivers operate at >1,000 Hz or use non-PWM current regulation to confirm stroboscopic safety for rotating machinery environments."],lp:["IES RP-7 levels: warehouse 200-300 lux Ra 60+. Assembly 500-1000 lux Ra 80+. Critical inspection 1000-2000 lux Ra 90+ R9 50+ with D65 evaluation source.","Glare control: luminous intensity less than 1,000 cd at 85 deg from nadir for industrial. UGR 19 or less for computer-aided workstations.","Stroboscopic risk: LED drivers below 200 Hz PWM can cause stroboscopic effect on rotating machinery. Verify driver frequency above 1,000 Hz or use non-PWM regulation."],tts:"Lesson 8.6. Industrial lighting and IES RP-7. IES RP-7 recommends illuminance levels by task difficulty. Warehouses and rough service areas: 200 to 300 lux, Ra 60 or better acceptable. Manufacturing and assembly: 500 to 1,000 lux, Ra 80 minimum. Critical inspection and quality control: 1,000 to 2,000 lux at the inspection surface, Ra 90 or better, R9 50 or better, with a D65 evaluation source for colour-critical work. Glare control requires luminous intensity below 1,000 cd at 85 degrees from nadir. The stroboscopic effect — rotating machinery appearing stationary — is a safety hazard. Verify LED drivers operate above 1,000 hertz or use non-PWM current regulation to eliminate stroboscopic risk."}
,"9.1":{body:["<strong>ASHRAE 90.1</strong> (Energy Standard for Buildings) is the primary energy code for commercial buildings in the United States, adopted by reference in the IECC and by most states. The lighting chapter sets <strong>Interior Lighting Power Density (LPD)</strong> limits. The <strong>Building Area Method</strong> assigns a single W/sqft allowance based on building type. ASHRAE 90.1-2019 key limits: Office = 0.82 W/sqft, Retail = 1.26 W/sqft, Warehouse = 0.60 W/sqft, Healthcare = 1.05 W/sqft. The <strong>Space-by-Space Method</strong> allows different allowances for each individual space type within a building.","LPD compliance is verified by calculating the total installed wattage of all luminaires in the applicable area divided by the floor area. Luminaires must be specified with accurate system wattage including driver losses. The LPD calculation uses luminaire-level wattage, not bare lamp wattage. Portable lamps and furniture-mounted task lighting are excluded.","ASHRAE 90.1 also mandates <strong>automatic lighting controls</strong> as an integral part of compliance. Required provisions include: occupancy sensing in most space types, automatic time-of-day shutoff, daylight responsive controls in daylit zones, and demand-responsive controls. Meeting only the LPD limit without the required controls does not constitute compliance."],lp:["ASHRAE 90.1-2019 Building Area Method: Office 0.82, Retail 1.26, Warehouse 0.60, Healthcare 1.05 W/sqft.","LPD = total installed watts including driver losses divided by floor area. Use luminaire system wattage, not bare lamp wattage.","Both LPD limits AND automatic controls requirements must be satisfied. Controls alone or LPD alone is not sufficient."],tts:"Lesson 9.1. ASHRAE 90.1 lighting power density. ASHRAE 90.1 is the primary commercial energy code in the United States. The Building Area Method assigns LPD limits by building type: office is 0.82, retail is 1.26, warehouse is 0.60, healthcare is 1.05 W per square foot under the 2019 edition. LPD equals total installed watts including driver losses divided by floor area. Use luminaire system wattage, not bare lamp wattage. Both LPD limits and automatic controls requirements must be satisfied simultaneously."}
,"9.2":{body:["<strong>California Title 24 Part 6</strong> is one of the most stringent energy codes in the world, updated on a three-year cycle. Title 24 uses <strong>Lighting Power Allowances (LPA)</strong> on a space-by-space basis. The prescriptive compliance path requires meeting the LPA for each space type while satisfying mandatory control requirements: automatic shutoff timers, occupancy sensing in most spaces, and multi-level dimming in certain space types. Title 24 controls requirements are generally more demanding than ASHRAE 90.1.","The <strong>performance compliance path</strong> uses a whole-building energy simulation model using the TDV (Time Dependent Valuation) energy metric, which weights energy by time of day and season to reflect actual grid impact. Performance compliance gives designers more flexibility but requires a certified Title 24 energy model and a compliance form signed by a certified energy analyst.","Title 24 has specific provisions: <strong>required luminaire efficacy minimums</strong> by space type, <strong>mandatory indoor receptacle controls</strong>, and <strong>demand responsive controls (DRC)</strong> requiring the ability to reduce lighting power by at least 15% upon utility demand response signals. Title 24 also has some of the strictest exterior lighting requirements in the US."],lp:["Title 24 Part 6: California energy code, space-by-space LPA, updated every 3 years. More stringent than ASHRAE 90.1.","Performance path: whole-building TDV energy model, requires certified Title 24 analyst. More flexible but requires full energy simulation.","Title 24 extras: luminaire efficacy minimums, demand responsive controls for 15 pct reduction capability, strict exterior LPA and curfew."],tts:"Lesson 9.2. California Title 24 Part 6. Title 24 is one of the strictest energy codes in the world, updated every three years. It uses Lighting Power Allowances on a space-by-space basis. The prescriptive path requires meeting LPA limits and mandatory controls including occupancy sensing, automatic shutoff, and multi-level dimming. The performance path uses a whole-building TDV energy simulation and requires a certified Title 24 energy analyst. Title 24 additionally requires luminaire efficacy minimums, demand responsive controls capable of 15 percent reduction, and strict exterior lighting limits with curfew provisions."}
,"9.3":{body:["Climate-based daylight modelling (CBDM) uses annual weather data and building geometry to calculate actual daylight availability at every point in a space over a full year. <strong>sDA (Spatial Daylight Autonomy)</strong> measures the percentage of floor area that receives at least 300 lux from daylight alone for at least 50% of occupied hours in a typical meteorological year. LEED v4.1 awards <strong>1 point for sDA 55%</strong> and <strong>2 points for sDA 75%</strong> across the regularly occupied floor area.","<strong>ASE (Annual Sunlight Exposure)</strong> measures the percentage of floor area that receives 1,000 lux or more of direct sunlight for 250 or more occupied hours per year. High ASE indicates excessive direct solar penetration causing visual discomfort glare, overheating, and fabric degradation. LEED v4.1 requires <strong>ASE 10% or less</strong> as a prerequisite for earning daylight credits.","CBDM calculations require accurate building geometry, window-to-wall ratios and glazing spectral properties, exterior obstructions, internal reflectances, occupancy schedules, and location-specific TMY weather data. Tools include Radiance, DAYSIM, ClimateStudio, and DIALux. The spatial analysis output informs which areas need supplemental electric lighting and where daylight harvesting zones should be defined."],lp:["sDA: pct of floor area at 300 lux or more for 50 pct of occupied hours. LEED: sDA 55 pct = 1 pt, sDA 75 pct = 2 pts.","ASE: pct at 1,000 lux or more for 250+ occupied hours. LEED requires ASE 10 pct max to earn daylight credits.","CBDM needs TMY weather data, accurate geometry, glazing properties, and reflectances. Tools: Radiance, DAYSIM, ClimateStudio."],tts:"Lesson 9.3. sDA and ASE daylight metrics. Spatial Daylight Autonomy measures the percentage of floor area receiving 300 lux or more from daylight alone for at least 50 percent of occupied hours. LEED v4.1 awards 1 point for sDA of 55 percent and 2 points for 75 percent. Annual Sunlight Exposure measures the percentage of floor area receiving 1,000 lux or more from direct sun for 250 or more occupied hours per year. LEED requires ASE of 10 percent or less to earn any daylight credits. CBDM calculations require TMY weather data, accurate geometry, glazing properties, and internal reflectances."}
,"9.4":{body:["Environmental and material health declarations are increasingly required by LEED, WELL, and project specifications. <strong>RoHS (Restriction of Hazardous Substances)</strong> is an EU directive that prohibits specific hazardous materials including lead, mercury, cadmium, hexavalent chromium, and flame retardants in electrical and electronic equipment. RoHS compliance is mandatory for all luminaires sold in the EU and UK, and is effectively the global baseline standard. LED luminaires are generally RoHS-compliant but must be verified.","An <strong>Environmental Product Declaration (EPD)</strong> is a standardised, third-party-verified document reporting a product's environmental impact across its full life cycle. EPDs quantify key environmental indicators including Global Warming Potential (GWP, in kg CO2-equivalent), which represents the product's carbon footprint. LEED v4.1 MR Materials credits award points for products with EPDs.","A <strong>Health Product Declaration (HPD)</strong> is a standardised document disclosing all ingredients in a product at concentrations of 100 parts per million or greater, with health hazard assessments for each. HPDs allow building owners and specifiers to make informed decisions about material health risks. LEED v4.1 MR credits also award points for products with HPDs."],lp:["RoHS: restricts lead, mercury, cadmium, and other hazardous substances in electronic equipment. Mandatory EU and UK. LED generally compliant but verify.","EPD (ISO 14025): third-party verified lifecycle environmental impact including GWP (carbon footprint). LEED MR credits require EPDs.","HPD: discloses all ingredients at 100 ppm or more with health hazard data. LEED MR credits require HPDs. Both publicly available."],tts:"Lesson 9.4. Product sustainability declarations. RoHS restricts hazardous substances including lead, mercury, and cadmium in electrical equipment and is mandatory in the EU and UK. LED luminaires are generally RoHS-compliant but must be verified. An Environmental Product Declaration, or EPD, is a third-party-verified document reporting a product's life-cycle environmental impact including Global Warming Potential in kilograms of CO2-equivalent. LEED v4.1 MR credits require EPDs. A Health Product Declaration, or HPD, discloses all ingredients at 100 parts per million or more with health hazard data. LEED MR credits require HPDs alongside EPDs."}
,"9.5":{body:["<strong>Life-Cycle Cost Analysis (LCCA)</strong> is the comprehensive economic evaluation of competing alternatives over a defined analysis period. The formula: <strong>LCC = First cost + PV(energy) + PV(maintenance) + PV(disposal) minus PV(rebates)</strong>. All future costs are converted to present value using a discount rate. LCCA is the financially sound basis for comparing LED systems against legacy HID or fluorescent systems.","The dominant LCC component for most lighting systems is <strong>present value of energy costs</strong>, which depends on: annual kWh consumption from the photometric simulation, the current utility rate, projected annual energy cost escalation (typically 2-4%), and the discount rate. A 50% reduction in lighting wattage translates directly to a 50% reduction in lighting energy cost, compounded over the analysis period.","<strong>Utility rebates</strong> are a critical input that dramatically reduces LED payback periods. Utility DSM programmes in most US jurisdictions offer per-watt or per-luminaire incentives for replacing inefficient sources with DLC-listed LED alternatives, typically covering 30-70% of the incremental first cost. Rebate programmes require DLC QPL listing and may require pre-approval before purchase."],lp:["LCC = first cost + PV(energy) + PV(maintenance) + PV(disposal) minus PV(rebates). Use discount rate and energy escalation over 10-20 year period.","Energy is the dominant LCC component. 50 pct wattage reduction equals 50 pct energy cost reduction compounded over the analysis period.","Utility rebates cover 30-70 pct of incremental LED first cost. Require DLC QPL listing. Can reduce payback to under 2 years."],tts:"Lesson 9.5. Life-cycle cost analysis. LCC equals first cost plus present value of energy plus present value of maintenance plus disposal minus present value of rebates. Use a discount rate and energy escalation rate over a 10 to 20 year analysis period. Energy cost is the dominant LCC component for lighting. A 50 percent wattage reduction means 50 percent lower energy cost compounded over the analysis period. Utility DSM rebates cover 30 to 70 percent of incremental LED first cost and require DLC QPL listing. Rebates can reduce payback to under 2 years for high-utilisation spaces."}
,"9.6":{body:["<strong>LEED v4.1 BD+C</strong> addresses lighting through multiple credit categories. <strong>EQ Indoor Environmental Quality</strong> contains the most directly lighting-specific credits: EQ Indoor Lighting (1 point for individual occupant controls at 90% or more of positions; 1 point for meeting 3 of 6 lighting quality metrics including CRI 90 and R9 50) and EQ Daylight (1-2 points for sDA compliance with ASE 10% max). The <strong>EA Energy and Atmosphere</strong> credits award points for percentage energy savings relative to the ASHRAE 90.1 baseline.","The <strong>MR Materials and Resources</strong> credits include Environmental Product Declarations (1 point for 20 or more permanently installed products with EPDs) and Material Ingredients (1 point for 20 or more products with HPDs). Luminaires, drivers, and control devices count toward these material credits. The <strong>SS Site</strong> category includes Light Pollution Reduction credit (1 point) requiring full-cutoff exterior luminaires with U0 uplight rating and BUG limits appropriate to the lighting zone.","For a typical commercial office project, lighting-related credits can contribute: EQ Indoor Lighting (0-2 pts), EQ Daylight (0-2 pts), EA Energy Performance (several pts from LPD reduction), MR EPD and HPD contributions, and SS Light Pollution Reduction (1 pt). The integrated lighting specification can realistically contribute 5-8 credit points toward LEED certification."],lp:["LEED v4.1 EQ Indoor Lighting: individual controls 90 pct+ positions (1 pt) + quality metrics CRI 90 and R9 50 (1 pt).","LEED Daylight: sDA 55 pct = 1 pt, sDA 75 pct = 2 pts. ASE 10 pct max required. SS Light Pollution: full cutoff plus U0 plus BUG limits.","Lighting contributes to EA energy credits, MR EPD and HPD credits, and EQ credits. Total lighting contribution can reach 5-8 points."],tts:"Lesson 9.6. LEED v4.1 lighting credits. EQ Indoor Lighting awards 1 point for individual controls at 90 percent or more of positions, and 1 point for quality metrics including CRI 90 and R9 50. EQ Daylight awards 1 point for sDA of 55 percent and 2 points for 75 percent, with ASE of 10 percent or less required. EA Energy Performance awards points based on percentage energy savings relative to ASHRAE 90.1. MR credits require EPDs and HPDs for 20 or more luminaire products. SS Light Pollution Reduction requires full cutoff optics, U0 uplight rating, and BUG limits. Lighting-related credits can contribute 5 to 8 points toward LEED certification."}
,"10.1":{body:["The lighting design process mirrors the overall architectural project delivery process. During <strong>Programming and Pre-design</strong>, the lighting designer participates in establishing the <strong>Owner Project Requirements (OPR)</strong>: the documented statement of the owner's goals, functional needs, and success criteria. The OPR records key parameters: target CCT, minimum CRI, sustainability certifications being pursued (LEED, WELL), budget range, maintenance philosophy, controls sophistication desired, and aesthetic guidelines.","<strong>Schematic Design (SD)</strong> is the phase where major design directions are established. The lighting designer develops concept luminaire families for each space type, prepares preliminary photometric layouts to verify feasibility, identifies code compliance strategy, and prepares a presentation for owner approval. SD establishes the overall design vocabulary: architectural vs decorative, exposed vs concealed, direct vs indirect.","The quality of programming and SD work directly determines the efficiency of all subsequent phases. A vague OPR leads to design changes and cost escalation in DD and CD. An SD that establishes clear luminaire families and space-type strategies enables the DD team to produce detailed construction documents efficiently. The most expensive time to discover that the owner dislikes a luminaire type is during construction."],lp:["Programming: establish OPR documenting CCT, Ra, controls, sustainability targets, budget, and aesthetic intent. Engage lighting designer at this phase.","Schematic Design: concept luminaire families, preliminary photometric layouts, code compliance strategy, owner presentation and approval.","Early design investment prevents late changes. Discovering luminaire preference issues at SD costs far less than finding them in construction."],tts:"Lesson 10.1. Design phases, programming through schematic design. During programming, the lighting designer helps establish the Owner Project Requirements documenting CCT targets, CRI, sustainability certifications, budget, controls sophistication, and aesthetic intent. Schematic Design establishes concept luminaire families, preliminary photometric layouts to verify feasibility, and the energy compliance strategy. The owner presents and approves the SD direction before DD begins. Engaging the lighting designer during programming and establishing clear requirements at SD prevents expensive design changes in later phases."}
,"10.2":{body:["<strong>Design Development (DD)</strong> is the phase where schematic concepts are developed into coordinated, detailed design. The most important DD lighting deliverable is the <strong>fixture schedule</strong>: a tabulated list of every luminaire type in the project, with Type designation, full description, manufacturer and catalogue number, wattage, CCT, CRI, dimming protocol, IP rating, and mounting method. Each type should be cross-referenced to an LM-79 test report and a DLC QPL listing. An equal-or-better clause must define specific performance thresholds for substitution review.","DD-phase photometric calculations move from preliminary to coordinated. The designer produces <strong>AGi32 or DIALux simulation</strong> files for each representative space type, verifying: average illuminance and uniformity against IES RP targets; LPD compliance against the applicable energy code; UGR compliance against the specified limit; and EML values if WELL v2 is being pursued. Calculations must be performed with the actual luminaire IES files, not generic profiles.","DD is also the phase for resolving <strong>MEP and structural coordination</strong> conflicts: confirming that downlights do not conflict with structural members, that linear luminaires clear ductwork and sprinkler heads, that luminaire module sizes align with ceiling grid modules, and that electrical panel capacity is adequate for the calculated loads."],lp:["DD fixture schedule: type tag, manufacturer, wattage, CCT, CRI, dimming, IP, mounting. Reference LM-79 and DLC. Define equal-or-better criteria with thresholds.","DD calculations: AGi32 or DIALux with actual luminaire IES files. Verify illuminance, uniformity, LPD, UGR, and EML against code and spec targets.","Resolve MEP and structural conflicts in DD before permit. Downlights vs beams, linear vs ductwork, module vs grid, electrical panel capacity."],tts:"Lesson 10.2. Design development. The DD fixture schedule tabulates every luminaire type with manufacturer, wattage, CCT, CRI, dimming protocol, IP rating, and mounting. Each type references LM-79 and DLC. Define equal-or-better criteria with measurable thresholds. DD calculations use AGi32 or DIALux with actual luminaire IES files to verify illuminance, uniformity, LPD compliance, UGR, and EML values. Resolve MEP and structural coordination conflicts in DD before permit drawings are issued."}
,"10.3":{body:["A <strong>mock-up</strong> is a full-size installation of representative luminaires in actual or simulated project conditions, built before bulk ordering to allow the design team and owner to evaluate real-world performance. Mock-ups reveal information that IES files cannot: how the luminaire looks in the context of actual ceiling materials, how wall-washing performance varies with actual wall finishes, how dimming performance appears across the full range, and whether glare is visible at typical occupant viewing angles.","An effective mock-up builds a full-size section of the representative space with all luminaire finalists present simultaneously for direct comparison. The mock-up should be evaluated at the intended dimming level and time of day with representative furniture and finishes in place. Measurements should be taken with a calibrated illuminance meter at the specified measurement planes, and results documented against the specification targets.","Common mock-up discoveries that prevent expensive field problems: <strong>colour shift at low dim</strong> where warm-dimming was not verified against the actual driver; <strong>visible flicker</strong> at intermediate dim levels indicating driver-dimmer incompatibility; <strong>unacceptable luminaire appearance</strong> against the actual ceiling finish; and <strong>aperture reveal visibility</strong> in semi-recessed conditions. Each discovered at mock-up costs hours to resolve; discovered after installation, each costs tens of thousands of dollars."],lp:["Mock-up: full-size installation before bulk order, all finalists simultaneously, under realistic conditions.","Measure actual illuminance with calibrated meter. Document results against specification targets and photograph for the record.","Common discoveries: colour shift at low dim, visible flicker (driver-dimmer mismatch), ceiling appearance, reveal visibility. Far cheaper to fix at mock-up."],tts:"Lesson 10.3. Mock-ups and field review. A mock-up is a full-size installation of representative luminaires built before bulk ordering. Build a full-size section of the representative space with all finalists present simultaneously. Measure actual illuminance with a calibrated meter and document against specification targets. Common discoveries at mock-up include colour shift at low dim, visible flicker from driver-dimmer incompatibility, and unacceptable ceiling appearance. Each of these costs far less to fix at mock-up stage than after installation."}
,"10.4":{body:["Lighting design must be coordinated with structural, mechanical, plumbing, and electrical systems throughout the design process. The most common <strong>structural conflicts</strong> are downlights conflicting with structural beams, joists, or post-tensioned slab transfer beams that cannot be penetrated; and pendant or surface-mounted luminaires conflicting with structural grid patterns.","<strong>Mechanical conflicts</strong> are the most frequent source of RFIs and field changes in lighting. HVAC supply and return air diffusers, fire suppression sprinkler heads, and ductwork runs must all be coordinated with luminaire locations before permit drawings are issued. BIM clash detection between the lighting model and the MEP model is now standard practice on commercial projects.","<strong>Electrical coordination</strong> covers circuit loading, panel capacity, neutral conductor sizing (particularly important for LED drivers with high THD), conduit routing, and AFCI compatibility. The lighting designer prepares a <strong>circuit and panel schedule</strong> that lists every circuit, its luminaire load, and its panel assignment. The electrical engineer verifies panel capacity and conductor sizing."],lp:["Structural: coordinate downlights with beams, joists, post-tensioned slabs before permit. Pendant locations must clear structural grid.","Mechanical: most common RFI source. Coordinate luminaire locations with sprinklers, HVAC diffusers, and ductwork. BIM clash detection is standard practice.","Electrical: circuit loading, panel capacity, neutral sizing for THD, AFCI compatibility. Lighting designer provides circuit and panel schedule."],tts:"Lesson 10.4. MEP and structural coordination. Structural conflicts most commonly involve downlights conflicting with beams, joists, or post-tensioned slabs. Mechanical coordination is the most frequent source of field RFIs. HVAC diffusers, sprinkler heads, and ductwork must be coordinated with luminaire locations before permit drawings. BIM clash detection between the lighting and MEP models is now standard practice. Electrical coordination covers circuit loading, panel capacity, neutral conductor sizing for high-THD LED drivers, and AFCI breaker compatibility."}
,"10.5":{body:["The lighting controls documentation is as critical as the luminaire schedule. The controls documentation package must include: a <strong>controls zone plan</strong> showing the boundaries of each zone with device locations; a <strong>sequence of operations</strong> narrative describing exactly what happens under every condition (normal occupied, after-hours, cleaning mode, emergency, demand response); and <strong>scene level tables</strong> specifying the dimming level for each circuit in each defined scene.","<strong>ASHRAE 90.1 mandatory controls requirements</strong> must be documented and verified by the commissioning authority. Required provisions: <strong>automatic shutoff</strong> based on scheduled time and occupancy; <strong>occupancy sensing</strong> per ASHRAE 90.1-2019 Table 9.4.1.1 for each space type; <strong>daylight responsive controls</strong> in daylit zones with continuous dimming or stepped switching; and <strong>demand response capability</strong> allowing automated reduction of lighting power upon utility signals.","The <strong>controls narrative</strong> is one of the most valuable deliverables the lighting designer produces. It is the reference document that the controls contractor uses for programming, the commissioning agent uses for verification, and the facilities manager uses for ongoing operation. A well-written sequence of operations reduces commissioning time and prevents sophisticated systems from operating in default mode."],lp:["Controls documentation: zone plan, sequence of operations narrative, scene level tables. Underdocumented controls lead to commissioning failures.","ASHRAE 90.1 mandatory: automatic shutoff, occupancy sensing per Table 9.4.1.1, daylight responsive controls, demand response capability.","The controls narrative is the programming reference for the contractor, the verification guide for the Cx agent, and the operating manual for facilities."],tts:"Lesson 10.5. Lighting controls documentation. The controls package must include a zone plan showing control zone boundaries and device locations, a sequence of operations narrative describing what happens under every condition, and scene level tables specifying dimming levels. ASHRAE 90.1 mandatory requirements include automatic shutoff, occupancy sensing per Table 9.4.1.1, daylight responsive controls in daylit zones, and demand response capability. A well-written controls narrative reduces commissioning time and prevents sophisticated systems from operating in default mode because nobody programmed them correctly."}
,"10.6":{body:["<strong>Construction Documents (CDs)</strong> are the full set of drawings and specifications issued for permit and construction. The core lighting CD deliverables are the <strong>Reflected Ceiling Plan (RCP)</strong>, the <strong>fixture schedule</strong>, the <strong>controls drawings</strong>, the <strong>photometric calculations summary</strong>, and the <strong>specification sections</strong>.","The <strong>Reflected Ceiling Plan</strong> shows every luminaire by type designation, exact location, circuit assignment, switching group, and any special mounting notes. The RCP must coordinate with the structural, mechanical, and finish ceiling plans. <strong>Lighting specifications</strong> (typically CSI Division 26) describe performance requirements, acceptable manufacturers, testing data required, substitution procedures, installation standards, and commissioning requirements.","CD-phase coordination checklist: confirm all luminaire types have LM-79 reports and DLC listings attached; verify LPD compliance is documented; confirm all ASHRAE 90.1 controls requirements are shown; verify egress and emergency lighting is fully documented per NFPA 101 and IBC; confirm luminaire clearances are satisfied; and verify specification substitution criteria define measurable thresholds for objective submittal evaluation."],lp:["CD set: RCP with fixture locations, circuit and switching; fixture schedule with LM-79 and DLC refs; controls drawings with sequences; photometric calc summary.","RCP coordinates against structural, mechanical, and finish ceiling drawings. BIM final clash check before permit.","CD checklist: LM-79 attached, LPD documented, ASHRAE 90.1 controls shown, emergency lighting complete, substitution criteria defined with thresholds."],tts:"Lesson 10.6. Construction documents for lighting. A complete lighting CD set includes the Reflected Ceiling Plan showing every luminaire by type, location, circuit, and switching; the fixture schedule referencing LM-79 and DLC; controls drawings with zone plans and sequences of operation; photometric calculations summary; and CSI Division 26 specification sections. The RCP must be coordinated against structural, mechanical, and finish ceiling plans with a final BIM clash check before permit. CD checklist: LM-79 attached, LPD compliance documented, ASHRAE 90.1 controls shown, emergency lighting complete, substitution criteria defined with measurable thresholds."}
,"11.1":{body:["During the bidding phase, the lighting designer responds to contractor <strong>Requests for Information (RFIs)</strong> and reviews <strong>substitution requests</strong>. When a contractor proposes a substitute product, the lighting designer evaluates it against the criteria defined in the specification. A well-written spec defines substitution thresholds: maximum wattage, minimum lumens, minimum CRI and R9, required CCT range, required dimming protocol, required DLC QPL listing, and required LM-79 test data. Without defined thresholds, substitution review is subjective and legally vulnerable.","During the construction phase, the designer reviews <strong>submittals</strong> from the electrical contractor: product data sheets, cut sheets, LM-79 test reports, DLC QPL confirmation, IES photometric files, and shop drawings for custom luminaires or control panels. The designer marks each submittal as Approved, Approved as Noted (with specific corrections required), or Revise and Resubmit. The submittal process is the last line of defence before materials are ordered — a thorough review prevents the most common field problems.","The most common submittal failures are: <strong>missing LM-79 test report</strong> (manufacturer provides only a datasheet with claimed performance); <strong>wrong CCT submitted</strong> (contractor orders 4000K where 3000K was specified); <strong>unapproved substitution</strong> where the contractor changes to a lower-cost product without formal substitution request; and <strong>incorrect dimming protocol</strong> where the submitted luminaire uses 0-10V but the control system is DALI. Each of these caught at submittal saves a change order."],lp:["Substitution review criteria must be defined in the spec with measurable thresholds: wattage, lumens, CRI, R9, CCT, dimming protocol, DLC, LM-79.","Required submittals: product data, LM-79 test report, DLC QPL confirmation, IES file. Mark as Approved, Approved as Noted, or Revise and Resubmit.","Most common submittal failures: missing LM-79, wrong CCT, unapproved substitution, incorrect dimming protocol. Each caught at submittal saves a change order."],tts:"Lesson 11.1. Submittals and substitution review. Substitution review criteria must be defined in the specification with measurable thresholds: maximum wattage, minimum lumens, minimum CRI and R9, required CCT range, dimming protocol, DLC QPL listing, and LM-79 test data. Required submittals include product data sheets, LM-79 test reports, DLC QPL confirmation, and IES photometric files. Review submittals carefully and mark as Approved, Approved as Noted, or Revise and Resubmit. The most common submittal failures are missing LM-79 reports, wrong CCT, unapproved substitutions, and incorrect dimming protocols."}
,"11.2":{body:["<strong>Construction Administration (CA)</strong> covers all designer activities during bidding, construction, and closeout. During the <strong>bidding phase</strong>, the designer responds to contractor RFIs, issues addenda with clarifications, reviews substitution requests against specification criteria, and provides bid levelling support to the owner. Clear, complete construction documents minimise bidding RFIs — ambiguous specs generate change orders.","During the <strong>construction phase</strong>, the designer makes periodic site visits to observe the installation, reviews submittals, responds to field RFIs, and reviews proposed change orders. Site visits have two goals: quality verification (are luminaires installed correctly, at the right locations, with the correct trim and accessories?) and relationship maintenance (the installer is more likely to call before making a questionable decision if they have a relationship with the designer). The frequency of site visits depends on project scale and complexity.","<strong>Closeout</strong> includes the punch list walk-through, commissioning verification, review and approval of as-built drawings, review of Operations and Maintenance (O+M) manuals, and formal project closeout documentation. The designer signs off that the installed work matches the contract documents. For projects with LEED or WELL certification goals, closeout also includes assembling the documentation package for the certification review."],lp:["Bidding CA: RFI response, addenda, substitution review, bid levelling. Clear documents reduce bidding RFIs and subsequent change orders.","Construction CA: site visits (quality check and relationship), submittal review, field RFI response, change order review.","Closeout: punch list, commissioning sign-off, as-built drawing review, O+M manuals, LEED/WELL documentation assembly."],tts:"Lesson 11.2. Construction administration phases. During bidding, the designer responds to RFIs, issues addenda, reviews substitution requests, and supports bid levelling. Clear complete documents reduce RFIs. During construction, the designer makes site visits to observe installation quality, reviews submittals, responds to field RFIs, and reviews change orders. Closeout includes the punch list walk-through, commissioning verification, approval of as-built drawings, review of O and M manuals, and assembling LEED or WELL certification documentation."}
,"11.3":{body:["A <strong>punch list</strong> is a list of incomplete or defective work items identified during the pre-substantial completion walk-through, which the contractor must correct before the project can receive a Certificate of Substantial Completion. The lighting designer participates in the punch list walk by verifying that all luminaires are installed per the RCP and fixture schedule, that controls zones are wired correctly, and that dimming performance is functional. The punch list is a contractual document — items on it must be corrected by the contractor at no additional cost.","<strong>Substantial Completion</strong> is the point at which the project is sufficiently complete that the owner can occupy or use it for its intended purpose, even if minor items remain incomplete. The Certificate of Substantial Completion is a formal contractual document that starts the countdown for the warranty period and transfers care, custody, and control of the building to the owner. After substantial completion, any design changes become Change Orders that cost the owner money.","Common lighting punch list items: wrong luminaire type installed (contractor used a substitution that was not approved); non-functioning dimming (driver-dimmer incompatibility not caught at submittal); luminaire not plumb or level; missing trim or accessories; lamp outages; and controls sequences not functioning as specified. A pre-punch walk by the lighting designer before the formal punch list walk allows the designer to identify and document issues before the official walk, improving the efficiency of the closeout process."],lp:["Punch list: formal list of incomplete or defective items requiring correction before Certificate of Substantial Completion is issued.","Substantial Completion: project usable for intended purpose. Starts warranty period. Care and custody transfers to owner. Design changes become COs.","Common lighting punch items: wrong luminaire type, non-functioning dimming, unlevel fixture, missing trim, failed controls sequences."],tts:"Lesson 11.3. Punch list and substantial completion. A punch list identifies incomplete or defective work items requiring correction before the Certificate of Substantial Completion is issued. The lighting designer verifies that all luminaires match the RCP and fixture schedule, controls zones are wired correctly, and dimming is functional. Substantial Completion means the project is usable for its intended purpose. It starts the warranty period and transfers care and custody to the owner. Any design changes after substantial completion become change orders. Common lighting punch items include wrong luminaire types, non-functioning dimming, and controls sequences not working as specified."}
,"11.4":{body:["<strong>Lighting commissioning</strong> is the process of verifying that the installed lighting system performs as designed and specified. For projects pursuing ASHRAE 90.1 compliance, LEED certification, or WELL certification, formal commissioning documentation is required. The commissioning process involves: verifying that all luminaires are installed per the reflected ceiling plan and fixture schedule; verifying that control zone wiring matches the controls zone plan; programming the controls system sequences of operation per the commissioning narrative; and measuring and documenting actual illuminance levels against specification targets.","Controls commissioning requires systematic verification: every occupancy sensor must be tested in both auto-on and manual-on modes; every daylight photosensor must be calibrated to its target setpoint; every dimming curve must be verified across the full range from 100% to minimum; and every emergency circuit must be tested to confirm it activates within 10 seconds of power loss and maintains minimum illuminance for the required duration. For DALI systems, every device address must be confirmed and scene memory verified after a simulated power cycle.","<strong>Functional performance testing (FPT)</strong> is the formal commissioning step required for ASHRAE 90.1 and for many LEED credits. The commissioning agent — typically an independent third party — develops a test plan, observes tests, and certifies results. The FPT report documents that every required control function was tested and passed. This documentation is the permanent record that the building code compliance officer and the LEED certification reviewer will examine."],lp:["Commissioning sequence: verify luminaires match RCP, verify zone wiring, program sequences per narrative, measure illuminance against spec targets.","Controls commissioning: test every sensor mode, calibrate photosensors, verify full dimming range, test emergency circuits. DALI: verify addresses and scene memory.","Functional Performance Testing (FPT): independent Cx agent develops test plan, observes tests, certifies results. Required for ASHRAE 90.1 and LEED compliance."],tts:"Lesson 11.4. Lighting commissioning. The commissioning process verifies that the installed system performs as designed. Steps: verify luminaires match the RCP and fixture schedule, verify control zone wiring, program sequences of operation per the commissioning narrative, and measure illuminance against specification targets. Controls commissioning tests every occupancy sensor mode, calibrates photosensors, verifies the full dimming range, and tests emergency circuits. Functional Performance Testing requires an independent commissioning agent who develops a test plan, observes all tests, and certifies results. FPT documentation is required for ASHRAE 90.1 and LEED compliance."}
,"11.5":{body:["<strong>Post-Occupancy Evaluation (POE)</strong> is the systematic assessment of a building's performance after it has been occupied for a period of time — typically 6 months to 1 year after occupancy. For lighting systems, POE covers both objective measurements and subjective occupant assessments. Objective measurements include: actual illuminance levels at representative points compared to the specification targets; actual energy consumption compared to the design model predictions; and controls system performance logs showing whether occupancy sensors, daylight sensors, and scheduling are functioning as intended.","Subjective assessments come from <strong>occupant satisfaction surveys</strong>. Typical questions cover: overall satisfaction with lighting quality; adequacy of light levels for tasks; frequency of glare complaints; ease of use of controls; and whether the lighting supports different work modes. Survey responses frequently reveal problems that objective measurements miss: occupants may routinely override controls, disable sensors, or use task lighting to compensate for inadequate ambient illuminance.","POE findings feed directly into the design of future projects. Consistent POE findings across multiple projects reveal systematic specification weaknesses: perhaps the standard sensor time-out period is consistently too short for private offices, or the standard task illuminance target is consistently rated as inadequate by healthcare workers. Building a POE database over multiple projects significantly improves design decision-making and allows the lighting designer to quantify the performance of their design decisions with real-world data."],lp:["POE: systematic assessment 6-12 months after occupancy. Objective: illuminance measurements, energy vs model, controls performance logs.","Subjective: occupant satisfaction surveys covering lighting quality, glare, task adequacy, controls usability.","POE findings improve future design decisions. Build a database across projects to quantify real-world performance of specification choices."],tts:"Lesson 11.5. Post-occupancy evaluation. POE systematically assesses building performance 6 to 12 months after occupancy. Objective measurements include actual illuminance compared to specification targets, actual energy consumption versus the design model, and controls system performance logs. Subjective assessments come from occupant satisfaction surveys covering lighting quality, glare, task adequacy, and controls usability. Survey responses reveal problems that measurements miss, such as occupants overriding controls or disabling sensors. POE findings feed into future project design. Building a database across multiple projects quantifies real-world performance of specification choices."}
,"11.6":{body:["A <strong>maintenance plan</strong> for a lighting installation must account for two types of depreciation: <strong>Lamp Lumen Depreciation (LLD)</strong> — the gradual reduction in lumen output as the LED ages — and <strong>Luminaire Dirt Depreciation (LDD)</strong> — the gradual reduction in delivered lumens as dust and contaminants accumulate on optical surfaces. Together, LLD x LDD (and other minor factors) constitute the <strong>Light Loss Factor (LLF)</strong> used in illuminance calculations. A lower LLF requires more fixtures to meet the maintained illuminance target — directly increasing capital cost.","For LED systems, LLD is characterised by the LM-80 and TM-21 data. An LED specified to L80 (maintains 80% of initial output) at the design case temperature will have an LLD of 0.80 at end of life. LDD depends on the installation environment and cleaning frequency. In a clean commercial office cleaned monthly, LDD may be 0.95. In a dusty manufacturing environment cleaned quarterly, LDD may be 0.80. The designer must use realistic LLF values based on actual operating conditions, not optimistic assumptions.","<strong>Group relamping</strong> — replacing all luminaires or drivers in a space at a scheduled interval before they fail — can be more cost-effective than spot replacement because it reduces labour cost per unit and allows maintenance to be scheduled during off-hours. For LED systems, group relamping typically replaces drivers rather than LED modules, because drivers fail earlier. The maintenance strategy should be documented in the O+M manual and communicated to the facilities manager at project turnover."],lp:["LLD x LDD = LLF. LLD: LED lumen output decline per LM-80/TM-21. LDD: dirt on optics per environment and cleaning frequency.","Realistic LLF values: clean commercial office 0.85-0.90. Dusty industrial 0.70-0.80. Lower LLF = more fixtures = higher capital cost.","Group relamping strategy: replace all drivers at interval rather than spot replacement. Lower labour cost per unit, schedulable during off-hours."],tts:"Lesson 11.6. Maintenance planning and lumen depreciation. The Light Loss Factor equals Lamp Lumen Depreciation times Luminaire Dirt Depreciation times other factors. LLD is characterised by LM-80 and TM-21 data. For an LED specified to L80, the LLD at end of life is 0.80. LDD depends on the environment and cleaning frequency: a clean commercial office cleaned monthly may have LDD of 0.95, while a dusty manufacturing environment cleaned quarterly may have LDD of 0.80. Use realistic LLF values based on actual conditions. Group relamping replaces all drivers at a scheduled interval rather than spot-replacing individual failures, reducing labour cost per unit and allowing scheduled maintenance during off-hours."}
,"12.1":{body:["<strong>Office and workplace lighting</strong> must balance visual performance, energy compliance, comfort, and flexible functionality for diverse work modes. For <strong>open-plan offices</strong>, the foundational requirements are: 300–500 lux on the horizontal work plane (IES RP-1); UGR ≤ 19 to prevent discomfort glare on computer screens; ceiling luminance ≤ 3,000 cd/m² at 65° from vertical; uniformity of 1:3; and integration with occupancy sensing and daylight harvesting controls. Low-glare luminaires — waveguide panels, direct-indirect, or parabolic troffers — are the standard ceiling solution.","Modern <strong>activity-based working (ABW)</strong> environments have differentiated zones with different lighting requirements: focus zones require higher illuminance (500 lux) and maximum glare control; collaboration zones work at 300–400 lux with slightly warmer CCT; lounge and informal meeting areas function at 100–200 lux with very warm CCT and dimming. The lighting specification must anticipate this range and provide the luminaire types, control zones, and scene-setting capability to support all activity modes.","<strong>Circadian lighting</strong> in offices is increasingly specified, particularly for projects pursuing WELL v2 certification. A tunable white system that provides high EML (200+ EML) at 5000–6500 K during morning peak work hours, then shifts to lower EML at 3000 K by late afternoon, supports alertness during the work day and allows natural melatonin onset in the evening. The system must be coordinated with the building automation system to adjust automatically based on time of day."],lp:["Open office: 300-500 lux, UGR 19 max, ceiling luminance 3,000 cd/m2 max at 65 deg, uniformity 1:3, controls integration required.","ABW zones: focus 500 lux, collaboration 300-400 lux, lounge 100-200 lux. Scene-setting and dimming across all zones.","Circadian tunable white: 200 EML or more at 5000-6500K morning, shift to low EML at 3000K afternoon. Required for WELL v2 L04."],tts:"Lesson 12.1. Office and workplace lighting. Open-plan offices require 300 to 500 lux on the horizontal work plane, UGR of 19 or less, ceiling luminance of 3,000 cd per square metre or less at 65 degrees, uniformity of 1 to 3, and controls integration. Activity-based working environments have differentiated zones: focus zones at 500 lux, collaboration at 300 to 400 lux, and lounge areas at 100 to 200 lux with warmer CCT. Circadian tunable white systems provide 200 EML or more at high CCT during morning hours, shifting to low EML and warm CCT in the afternoon."}
,"12.2":{body:["<strong>Retail lighting</strong> has a single overriding goal: make merchandise look appealing and draw customers toward it. This requires a <strong>layered approach</strong>: ambient general illuminance from ceiling luminaires provides orientation (300–500 lux); accent lighting from adjustable track or recessed luminaires at <strong>3–5 times the ambient level</strong> creates visual hierarchy and draws the eye to key displays; and integrated display case lighting provides task illuminance for inspecting merchandise up close. High CCT (3000–4000 K for general retail), Ra ≥ 90, and R9 ≥ 50 are critical for merchandise colour. Adjustable track provides the flexibility needed for seasonal and promotional reconfiguration.","<strong>Hospitality and restaurant lighting</strong> is fundamentally different from retail — it prioritises atmosphere, intimacy, and perception of quality over task performance. Ambient illuminance is intentionally low (50–100 lux), with accent highlights at 300–500 lux on specific surfaces creating contrast. The contrast ratio between accent and ambient — typically 5:1 to 10:1 — is the primary design tool. Warm CCT (2700–3000 K), smooth dimming to 1% or below, and layered sources (pendants, wall sconces, table lamps, recessed accents) build the depth and visual interest that distinguishes a quality hospitality environment.","<strong>Luxury retail</strong> combines elements of both: high colour rendering (Ra 95+, R9 50+) for accurate merchandise presentation, carefully controlled accent ratios to create drama, and warm CCT to create a premium feeling that generic commercial lighting destroys. The lighting specification for a luxury retail environment typically requires mock-ups with competing products, photometric validation of beam angles and illuminance levels at merchandise height, and strict maintenance standards to preserve the design intent over time."],lp:["Retail: ambient 300-500 lux ceiling plus accent at 3-5x ambient. Ra 90 and R9 50 minimum. Adjustable track for seasonal reconfiguration.","Hospitality: 50-100 lux ambient, 5:1 to 10:1 accent contrast ratio, 2700-3000K warm, dimming to 1 pct or below. Layers of sources.","Luxury retail: Ra 95 or above, R9 50 or above, carefully controlled accent drama, warm CCT. Mock-up required for product selection."],tts:"Lesson 12.2. Retail and hospitality lighting. Retail requires a layered approach: ambient at 300 to 500 lux plus accent at 3 to 5 times the ambient level, Ra 90 and R9 50 minimum, and adjustable track for seasonal reconfiguration. Hospitality prioritises atmosphere: 50 to 100 lux ambient with a contrast ratio of 5 to 1 through 10 to 1 between accent and ambient, warm CCT of 2700 to 3000 Kelvin, and smooth dimming to 1 percent or below. Luxury retail requires Ra 95 or above with carefully controlled accent drama and warm CCT. Mock-ups are required for product selection in luxury environments."}
,"12.3":{body:["<strong>Healthcare lighting</strong> must serve multiple conflicting requirements simultaneously: providing high illuminance for clinical examination tasks, minimising glare for patients in supine positions looking directly at the ceiling, supporting circadian health in long-stay patients, and meeting infection control requirements for surface cleanability. Patient rooms typically require 100–300 lux for general illuminance, with a dedicated examination light capable of 1,000+ lux at the bed. Ra ≥ 90 and R9 ≥ 50 are required in patient care areas to correctly assess skin colour, wound condition, and mucous membrane appearance.","Healthcare luminaire specification requires attention to clinical-specific details: IP65 or better for washdown areas, IK08 for vandalism-resistant zones in psychiatric and dementia care, lens or diffuser trim to minimise glare for supine patients, sealed housing to prevent dust accumulation in critical-care environments, and minimum luminance at high angles. ANSI/ASHRAE/ASHE Standard 170 provides detailed illuminance recommendations by healthcare space type. Emergency circuits per NFPA 99 and NEC Article 517 are required in all patient care areas.","<strong>Educational lighting</strong> serves students from kindergarten through post-secondary. Key requirements for classrooms: 300–500 lux at desktops, 500 lux of vertical illuminance on the teaching wall and whiteboard (to avoid luminance contrast problems when looking between the board and the room), Ra ≥ 80, UGR ≤ 19 for screen-based learning, and daylight harvesting from windows. For STEM labs and art studios requiring accurate colour judgement, Ra ≥ 90 is appropriate. Controls must support multiple modes: full on for lecture, reduced for AV presentations, and a night mode for after-hours occupancy."],lp:["Healthcare: patient room 100-300 lux, exam 1,000 lux task. Ra 90 and R9 50 in patient care areas. IP65 for washdown, lens trim for supine patients.","ANSI/ASHRAE/ASHE 170 for healthcare illuminance by space type. Emergency circuits per NFPA 99 and NEC Article 517.","Education: classroom 300-500 lux, whiteboard 500 lux vertical, Ra 80 min, UGR 19 max, daylight harvesting, multi-mode controls for lecture and AV."],tts:"Lesson 12.3. Healthcare and education lighting. Healthcare patient rooms require 100 to 300 lux general illuminance with a dedicated examination light at 1,000 or more lux. Ra 90 and R9 50 or better are required in patient care areas for accurate assessment of skin colour and wound condition. Use lens trim to minimise glare for supine patients, IP65 for washdown areas, and follow ANSI/ASHRAE/ASHE Standard 170 for illuminance by space type. Healthcare emergency circuits must comply with NFPA 99 and NEC Article 517. Education classrooms require 300 to 500 lux at desktops, 500 lux vertical illuminance on the whiteboard, Ra 80 minimum, UGR 19 or less, and multi-mode controls for lecture and AV."}
,"12.4":{body:["<strong>Residential kitchen lighting</strong> must serve multiple functions with a single installation: general ambient illuminance for navigation and casual use, task lighting for food preparation at the countertop, and accent lighting for display of objects or architectural features. A layered approach is essential. General illuminance of 300 lux is provided by ceiling luminaires — recessed downlights or a central pendant. <strong>Task lighting</strong> of 500 lux at the countertop is critical for safe food preparation and should be provided by under-cabinet LED strip light or dedicated task luminaires, completely separate from the general ceiling system. CCT of 2700–3000 K is preferred for kitchen environments.","<strong>Bathroom and vanity lighting</strong> has a specific ergonomic requirement: light should come from the sides of the mirror, not from above. An overhead downlight positioned directly above the mirror produces deep shadow under the nose, chin, and eye sockets — the opposite of what is needed for grooming, makeup application, or medical self-examination. Side-lit mirror fixtures or vertical strip lights flanking the mirror at face height provide uniform, shadow-free illumination of the face. Ra ≥ 90 is required for accurate skin tone assessment. Minimum illuminance of 500 lux at face height. IP44 is the minimum for luminaires within Zone 2 (splash zone) per IEC 60598.","<strong>Living and bedroom lighting</strong> in residential design follows a layered strategy similar to hospitality: low ambient illuminance (100–200 lux) from ceiling sources supplemented by task lighting (400 lux) at reading areas and accent lighting (5:1 contrast ratio) for visual interest. Warm CCT (2700–3000 K) and smooth dimming to below 1% are essential for bedrooms. For circadian health, the bedroom lighting system should be capable of very low EML in the hour before sleep and should avoid blue-rich sources in the evening hours."],lp:["Kitchen: general 300 lux ceiling, task 500 lux at countertop via under-cabinet LED. Separate systems. CCT 2700-3000K.","Bathroom/vanity: side-lit mirror preferred over overhead. Ra 90 for skin tone accuracy. 500 lux at face height. IP44 min for splash zone (IEC Zone 2).","Bedroom: 100-200 lux ambient, 400 lux reading task, smooth dim to below 1 pct. Low EML in the hour before sleep. Warm CCT 2700K."],tts:"Lesson 12.4. Residential kitchen and bath. Kitchens require two separate lighting systems: general ambient at 300 lux from ceiling luminaires, and task lighting at 500 lux at the countertop from under-cabinet LED strip. Use 2700 to 3000 Kelvin CCT. Bathroom and vanity lighting should come from the sides of the mirror, not from above. Overhead downlights produce deep shadows for grooming. Side-lit mirror fixtures provide uniform shadow-free illumination at face height. Ra 90 is required for accurate skin tone. 500 lux minimum at face height. IP44 minimum for Zone 2 splash zones per IEC 60598. Bedrooms need smooth dimming to below 1 percent and low EML in the hour before sleep."}
,"12.5":{body:["<strong>Museum and gallery lighting</strong> must serve two fundamentally competing requirements: illuminating artworks to high visual quality for the viewing experience, while simultaneously protecting sensitive materials from light-induced damage. All light causes photochemical degradation — yellowing, fading, embrittlement — in organic materials including textiles, watercolours, prints, and photographs. The rate of damage is proportional to irradiance (W/m²) and duration, making the concept of <strong>annual lux-hours</strong> the critical metric for conservation.","IES RP-30 and IESNA museum guidelines categorise sensitive materials into groups with maximum illuminance limits: highly sensitive materials (watercolours, textiles, prints, photographs) should receive no more than 50 lux; moderately sensitive materials (oil paintings on canvas, undyed leather) can tolerate up to 200 lux; and insensitive materials (stone, metal, ceramics, glass) can tolerate higher levels. UV radiation is particularly damaging — the specification must ensure that UV output is below 75 microwatts per lumen (equivalent to daylight filtered through window glass). LED sources are inherently nearly UV-free but must be specified with UV output verified.","Lighting quality requirements for museum and gallery applications are among the highest in the industry: Ra ≥ 95 is the standard minimum (often Ra 98 for colour-critical applications), R9 ≥ 50, CCT 3000–4000 K. Adjustable track luminaires allow aiming and beam adjustment as collections change. Dimming systems controlled by calibrated illuminance meters maintain the conservation target throughout operating hours. For temporary exhibitions, the lighting system must be easily reconfigurable. For permanent collections, maintenance planning must account for driver replacement without exposing collections to contamination."],lp:["Conservation: annual lux-hours metric. Highly sensitive materials (watercolours, textiles): 50 lux max. Moderately sensitive: 200 lux max. UV below 75 microwatts/lm.","Museum quality spec: Ra 95 or above, R9 50 or above, CCT 3000-4000K. Adjustable track for collection changes. Illuminance-meter-controlled dimming.","IES RP-30 categorises materials by sensitivity. LED is inherently near UV-free but verify. Maintenance must not contaminate collections."],tts:"Lesson 12.5. Museum and gallery lighting. All light causes photochemical degradation in organic materials. The critical metric is annual lux-hours. IES RP-30 categorises sensitivity: highly sensitive materials including watercolours, textiles, and photographs should receive no more than 50 lux. Moderately sensitive materials such as oil paintings can tolerate up to 200 lux. UV output must be below 75 microwatts per lumen. LED sources are inherently near UV-free but must be verified. Museum quality specification requires Ra 95 or above, R9 50 or above, and CCT 3000 to 4000 Kelvin. Use adjustable track luminaires for collection changes, with illuminance-meter-controlled dimming to maintain conservation targets."}
,"12.6":{body:["This final lesson integrates the key quantitative relationships and specification thresholds from all 12 modules into a consolidated review. These are the values and formulas most frequently tested on the NCQLP examination. <strong>Photometric formulas</strong>: E = I/d² (inverse-square law, point source only); E = (I × cosθ)/d² (cosine law, tilted surface); E_avg = (N × Φ × CU × LLF)/A (lumen method); RCR = 5h(L+W)/(L×W); SC = max spacing / mounting height; beam diameter = 2 × h × tan(beam angle / 2). <strong>Testing standards</strong>: LM-79 tests the complete luminaire; LM-80 tests the LED package at 3 temperatures over 6,000+ hours; TM-21 projects L70 lifetime with a maximum of 6× LM-80 test duration.","<strong>Colour and quality thresholds</strong>: Ra ≥ 80 for offices; Ra ≥ 90 for museums, healthcare, premium retail, and LEED credit; R9 ≥ 50 always specified separately alongside Ra; SDCM ≤ 3-step for consistent adjacent fixtures; Duv ≤ ±0.006 (ANSI). <strong>Controls and codes</strong>: ASHRAE 90.1-2019 Office LPD = 0.82 W/sqft; WELL v2 L04 requires ≥ 200 EML at the eye during morning hours; LEED v4.1 daylight credit sDA ≥ 55% (1 pt) and ≥ 75% (2 pts) with ASE ≤ 10%; NFPA 101 emergency lighting: 1 fc minimum at floor, 90-minute duration, 40:1 max:min ratio, 10-second activation.","<strong>Product protection ratings</strong>: IP65 = exterior standard minimum; IP66 = hose-down applications; IK10 = vandal-resistant impact protection; NEMA 4X = hose-down plus corrosion resistance. <strong>Hazardous locations</strong>: Class I = flammable gases; Class II = combustible dust; Class III = ignitable fibres; Division 1 = normally present (explosion-proof required). The NCQLP exam tests application of these values in realistic calculation and specification scenarios — not just recall."],lp:["Formulas: E=I/d2, E=(I cos theta)/d2, E avg=(N Phi CU LLF)/A, RCR=5h(L+W)/(LxW), SC=spacing/height, beam diam=2h tan(beam/2).","Standards: LM-79=complete luminaire, LM-80=LED package 3 temps 6k hrs min, TM-21 max=6x LM-80 duration. IP65=exterior min. IK10=vandal resist.","Colour thresholds: Ra 80 offices, Ra 90 museums/healthcare/LEED, R9 50 always separate. WELL 200 EML. NFPA 101: 1fc, 90 min, 40:1, 10 sec."],tts:"Lesson 12.6. NCQLP integrated review. Key formulas: E equals I divided by d-squared; E equals I times cosine theta divided by d-squared; E average equals N times Phi times CU times LLF divided by A; RCR equals 5h times L plus W divided by L times W; SC equals spacing divided by mounting height. Testing: LM-79 tests the complete luminaire; LM-80 tests the LED package at three temperatures over 6,000 hours minimum; TM-21 maximum projection equals 6 times the LM-80 test duration. Colour: Ra 80 for offices, Ra 90 for museums and healthcare and LEED credit, R9 50 always specified separately. WELL v2 requires 200 EML or more. NFPA 101 emergency lighting: 1 foot-candle minimum at floor, 90-minute duration, 40 to 1 max-to-min ratio, 10-second activation."}
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

function isLessonLocked(lessonRef, user) {
  const plan = user?.plan || 'free'
  if (plan === 't2' || plan === 't3') return false
  if (plan === 't1') return true
  const moduleNum = parseInt(lessonRef.split('.')[0])
  return moduleNum !== 1
}

function getLessonPreview(lessonRef) {
  const content = LC_DATA[lessonRef]
  if (!content || !content.body || !content.body[0]) return ''
  const plain = content.body[0].replace(/<[^>]+>/g, '')
  return plain.length > 120 ? plain.slice(0, 120) + '…' : plain
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
          <article key={ref} onClick={()=>{window.scrollTo({top:0,behavior:'smooth'});setRoute("lesson-"+ref)}} style={{display:"flex",flexDirection:"column",background:C.paper,border:`1px solid ${C.rule}`,borderRadius:4,overflow:"hidden",cursor:"pointer",transition:"border-color 150ms,transform 150ms"}}
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
            <article key={i} onClick={()=>l&&(window.scrollTo({top:0,behavior:'smooth'}),setRoute("lesson-"+l.ref))} style={{breakInside:"avoid",marginBottom:16,background:C.paper,border:`1px solid ${C.rule}`,borderRadius:4,borderLeft:`3px solid ${l?.done?C.forest:C.accent}`,padding:"18px 20px",cursor:"pointer",transition:"box-shadow 150ms"}}
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
/* ── PER-MODULE SHARE COPY ── */
const MODULE_SHARE_COPY = {
  '01': "Just completed Module 01 of LC · Lighting Master: Theory, Light, Sight & Color. Covered the visible spectrum, SPD, photopic vs scotopic vision, color rendering (CRI, TM-30), CCT, and the four photometric quantities — lumens, candelas, lux, and luminance. NCQLP prep in progress. 💡",
  '02': "Module 02 done — Light Sources & Ballasts. Deep dive into fluorescent, HID, HPS, metal halide, and LED fundamentals. Covered efficacy, lumen maintenance, ballast types, and source selection criteria for commercial specs. 2 CEU hrs earned. 💡",
  '03': "Module 03 complete — LED Technology Deep Dive. Junction physics, phosphor conversion, binning, SDCM, driver types, dimming protocols (0-10V, DALI, PWM), LM-80 lumen maintenance, and TM-21 lifetime projections. The technical backbone of modern lighting. 💡",
  '04': "Module 04 done — Photometry & IES Files. Covered LM-79 full luminaire testing, LM-63 IES file structure, point-by-point calculations, the cosine law, zonal cavity method, and DLC qualification requirements. NCQLP math section covered. 💡",
  '05': "Module 05 complete — Lighting Controls. Covered occupancy vs vacancy sensors, photosensors, DALI vs 0-10V, daylight harvesting (closed-loop vs open-loop), ASHRAE 90.1 controls requirements, and LEED v4.1 sDA/ASE metrics. 💡",
  '06': "Module 06 done — Downlighting & Interior Design. Trim selection, beam spread, spacing criteria, wall washing vs wall grazing, glare control (UGR), layered lighting design, and hospitality vs office application strategies. 💡",
  '07': "Module 07 complete — Exterior, Emergency & Codes. BUG ratings, light trespass, IESNA RP-8 roadway standards, NFPA 101 emergency lighting (1fc, 90 min, 10 sec), egress path requirements, and Title 24 outdoor LPD. 💡",
  '08': "Module 08 done — Industrial Lighting & Human Health. High-bay design, IP/IK ratings, hazardous location classifications (Class I/II/III), circadian entrainment, melanopic lux (EML), WELL v2 L04, and flicker standards. 💡",
  '09': "Module 09 complete — Energy, Environment & Sustainable Design. ASHRAE 90.1 LPD compliance, LEED v4.1 credits, Title 24 whole-building approach, DLC QPL, energy modeling, and sustainable material spec for luminaires. 💡",
  '10': "Module 10 done — Design Process I: Programming to Design Development. Covered lighting programming, schematic design deliverables, photometric software workflow, mock-up strategy, DD submittal requirements, and client presentation techniques. 💡",
  '11': "Module 11 complete — Design Process II: Construction Documents to POE. CD set components (RCP, fixture schedule, controls drawings), specification writing (CSI Div 26), construction administration, punch lists, and post-occupancy evaluation. 💡",
  '12': "All 12 modules of LC · Lighting Master — COMPLETE. 74 lessons, 24 CEU credit hours, and the full NCQLP blueprint covered: photometry, LED tech, controls, codes, energy compliance, and design process. Exam ready. 💡",
}

const MODULE_HASHTAGS = {
  '01': "#NCQLP #LightingDesign #ColorRendering #CRI #TM30 #Photometry #LightingCertified #IES #IESNA #LightingEducation #LC #Luxart",
  '02': "#NCQLP #LightingDesign #LEDLighting #LightSources #HID #MetalHalide #LightingSpec #IES #LightingCertified #LC #Luxart",
  '03': "#NCQLP #LEDTechnology #DALIDimming #LM80 #TM21 #LumenMaintenance #LEDDrivers #IES #LightingDesign #LightingCertified #LC #Luxart",
  '04': "#NCQLP #Photometry #IESFile #LM79 #DLC #ZonalCavity #LightingMath #IES #IESNA #LightingDesign #LightingCertified #LC #Luxart",
  '05': "#NCQLP #LightingControls #DALI #DaylightHarvesting #ASHRAE901 #LEEDv4 #SmartLighting #IES #LightingDesign #LightingCertified #LC #Luxart",
  '06': "#NCQLP #LightingDesign #Downlighting #UGR #GlareControl #InteriorDesign #WallWash #IES #IESNA #LightingCertified #LC #Luxart",
  '07': "#NCQLP #ExteriorLighting #BUGRating #NFPA101 #EmergencyLighting #Title24 #LightTrespass #IES #LightingDesign #LightingCertified #LC #Luxart",
  '08': "#NCQLP #IndustrialLighting #CircadianLighting #WELLBuilding #MelanopicLux #HazardousLocation #HighBay #IES #LightingDesign #LightingCertified #LC #Luxart",
  '09': "#NCQLP #SustainableLighting #ASHRAE901 #LEEDv4 #DLC #EnergyEfficiency #GreenBuilding #IES #LightingDesign #LightingCertified #LC #Luxart",
  '10': "#NCQLP #LightingDesign #DesignProcess #Photometrics #LightingSpec #ArchitecturalLighting #IES #IESNA #LightingCertified #LC #Luxart",
  '11': "#NCQLP #LightingDesign #ConstructionDocuments #CSISpec #LightingCA #RCP #IES #ArchitecturalLighting #LightingCertified #LC #Luxart",
  '12': "#NCQLP #LightingCertified #LightingDesign #IES #IESNA #DALI #ASHRAE #LEEDv4 #WELLBuilding #DLC #Title24 #LC #Luxart #ExamReady",
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
function ModuleCompleteModal({module, courseComplete, onClose}){
  const [copied,setCopied]=useState(false)
  const moduleKey=String(module.n).padStart(2,"0")
  const shareBody=MODULE_SHARE_COPY[moduleKey]||`I just completed Module ${module.n}: ${module.title} in LC · Lighting Master. ${module.ceu} CEU credit hours earned. 💡`
  const hashtags=MODULE_HASHTAGS[moduleKey]||"#NCQLP #LightingDesign #IES #LightingCertified #LC"
  const shareText=shareBody+"\n\n"+hashtags
  const shareUrl="https://master-lighting.vercel.app"

  useEffect(()=>{
    function onKey(e){ if(e.key==="Escape") onClose() }
    window.addEventListener("keydown",onKey)
    return ()=>window.removeEventListener("keydown",onKey)
  },[onClose])

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
            onClick={()=>window.open("https://www.linkedin.com/sharing/share-offsite/?url="+encodeURIComponent(shareUrl)+"&summary="+encodeURIComponent(shareText),"_blank","width=600,height=600")}/>
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

const LC_MEDIA = {
  "1.1":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780595398/101.png",
  "1.2":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780595959/102_kye8ru.png",
  "1.3":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780595958/103_ckaelp.png",
  "1.4":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780595956/104_qkcg5v.png",
  "1.5":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780595957/105_pxh0ew.png",
  "1.6":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780595957/106_kzy9sm.png",
  "2.1":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780595964/201_qtqfiq.png",
  "2.2":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780595963/202_u1phtz.png",
  "2.3":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780595963/203_n3ypvk.png",
  "2.4":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780595963/204_id0evl.png",
  "2.5":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780595963/205_t8bdsj.png",
  "2.6":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780595960/206_ccksyg.png",
  "3.1":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780595832/301_z5fxzi.png",
  "3.2":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780595832/302_s9m4nq.png",
  "3.3":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780595833/303_m8aqlh.png",
  "3.4":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780595833/304_zyyr3m.png",
  "3.5":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780595834/305_ywfaou.png",
  "3.6":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780597575/306_p23les.png",
  "4.1":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780597574/401_of5hag.png",
  "4.2":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780597584/402_nx9tmw.png",
  "4.3":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780597580/403_daykb7.png",
  "4.4":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780597582/404_twrax5.png",
  "4.5":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780597798/405_pj6afz.png",
  "4.6":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780597874/406_qghh3n.png",
  "5.1":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780598824/501_zzup79.png",
  "5.2":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780608668/502_tcnay8.png",
  "5.3":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780599772/503_qd5pm9.png",
  "5.4":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780599778/504_i7pm8p.png",
  "5.5":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780599770/505_r15ucf.png",
  "5.6":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780599861/506_hnvvt5.png",
  "6.1":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780599836/601_f1xsh2.png",
  "6.2":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780602460/602_jelq8f.png",
  "6.3":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780602461/603_l1u5wi.png",
  "6.4":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780602462/604_eczkfc.png",
  "6.5":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780602461/605_m4ytj1.png",
  "6.6":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780602461/606_tqrbgk.png",
  "7.2":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780602463/702_iquzfm.png",
  "7.3":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780602641/703_ttdgrh.png",
  "7.4":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780602960/704_g1hche.png",
  "7.5":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780602960/705_pbwfnh.png",
  "7.6":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780602994/706_y0qsir.png",
  "8.1":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780604072/801_edhabc.png",
  "8.2":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780604072/802_tghiz2.png",
  "8.3":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780604441/803_jnbwty.png",
  "8.4":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780604441/804_cbagw6.png",
  "8.5":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780604561/805_vk5nxv.png",
  "8.6":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780604711/806_h6zytb.png",
  "9.1":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780604856/901_oprict.png",
  "9.2":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780604929/902_bqpwpj.png",
  "9.3":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780605313/903_pymyou.png",
  "9.4":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780605314/904_aq6hlw.png",
  "9.5":  "https://res.cloudinary.com/dreuglb2j/image/upload/v1780605535/905_grvn5d.png",
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

function LessonPage({lessonRef,setRoute,user,setShowUpgrade}) {
  const [showShareModal,setShowShareModal]=useState(false)
  const [imgFullscreen,setImgFullscreen]=useState(false)
  useEffect(()=>{ window.scrollTo({top:0,behavior:'instant'}) },[lessonRef])
  useEffect(()=>{
    if(!imgFullscreen)return
    const handler=(e)=>{if(e.key==='Escape')setImgFullscreen(false)}
    window.addEventListener('keydown',handler)
    return()=>window.removeEventListener('keydown',handler)
  },[imgFullscreen])
  const lesson = ALL_LESSONS.find(l=>l.ref===lessonRef)
  const module = MODULES.find(m=>m.n===lesson?.module)
  if (!lesson||!module) return <div style={{padding:"40px 36px",color:C.inkMute}}>Lesson not found.</div>
  if (isLessonLocked(lessonRef, user)) return <UpgradePrompt onUpgrade={()=>setShowUpgrade(true)} setRoute={setRoute}/>
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
          <div style={{fontFamily:F.display,fontSize:13,fontWeight:700,color:C.ink,letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:10}}>Audio narration</div>
          <div id="_ttsst" style={mono({fontSize:9,color:C.inkMute,marginTop:2})}>Click to listen</div>
        </div>
        <div style={{width:120,height:3,background:C.rule,borderRadius:99,overflow:"hidden",flexShrink:0}}>
          <div id="_pfill" style={{height:"100%",background:C.accent,width:"0%",borderRadius:99,transition:"width .4s linear"}}/>
        </div>
        <button id="_pspd" onClick={()=>window._cycleSpeed()} style={mono({fontSize:10,color:C.inkMute,padding:"3px 8px",borderRadius:99,border:`1px solid ${C.rule}`,background:"none",cursor:"pointer",minWidth:34,textAlign:"center"})}>{_speeds[_spdIdx]}×</button>
        <button id="_pvc" onClick={()=>window._cycleVoice()} style={mono({fontSize:9,color:C.inkMute,padding:"3px 8px",borderRadius:99,border:`1px solid ${C.rule}`,background:"none",cursor:"pointer",maxWidth:90,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"})}>{voiceName}</button>
      </div>

      {/* Top next button */}
      {next&&(
        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:14}}>
          <button onClick={()=>{if(typeof _stopTTS!=='undefined')_stopTTS();window.scrollTo({top:0,behavior:'smooth'});setRoute("lesson-"+next.ref)}} style={{fontFamily:F.display,fontWeight:700,fontSize:13,background:C.ink,color:"#fff",border:"none",borderRadius:99,padding:"9px 18px",cursor:"pointer"}}>Next lesson →</button>
        </div>
      )}

      {/* Lesson image */}
      {LC_MEDIA[lessonRef]?(
        <div style={{borderRadius:6,marginBottom:14,overflow:"hidden",background:C.creamWarm}}>
          <div style={{position:"relative"}}>
            <img
              src={LC_MEDIA[lessonRef]}
              alt={`Lesson ${lessonRef} — ${lesson.title}`}
              style={{width:"100%",height:"auto",display:"block",objectFit:"contain",background:C.creamWarm,borderRadius:6}}
              onError={e=>{ e.target.parentElement.parentElement.style.display="none" }}
            />
            <button
              onClick={()=>setImgFullscreen(true)}
              title="View fullscreen"
              style={{position:"absolute",top:8,right:8,background:"rgba(22,18,14,0.7)",border:"none",borderRadius:6,padding:"6px 8px",cursor:"pointer",color:"#fdfaf6",fontSize:14,lineHeight:1,backdropFilter:"blur(4px)"}}
            >⛶</button>
          </div>
        </div>
      ):(
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
          <div dangerouslySetInnerHTML={{__html:visual}}/>
        </div>
      )}

      {/* Content */}
      {content?(
        <>
          <div style={{background:C.paper,border:`1px solid ${C.rule}`,borderRadius:6,padding:"24px 28px",marginBottom:14}}>
            <div style={{fontFamily:F.display,fontSize:13,fontWeight:700,color:C.ink,letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:10}}>Lesson content</div>
            {content?.body?.length > 0 ? (
              content.body.map((para, i) => (
                <div key={i} style={{fontFamily:F.body,fontSize:14,lineHeight:1.8,color:C.ink,marginBottom:18}}
                  dangerouslySetInnerHTML={{__html:para}}
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

      <div style={{display:"flex",justifyContent:"space-between",gap:12}}>
        {prev?<button onClick={()=>{if(typeof _stopTTS!=='undefined')_stopTTS();window.scrollTo({top:0,behavior:'smooth'});setRoute("lesson-"+prev.ref)}} style={{fontFamily:F.display,fontWeight:600,fontSize:13,background:"none",color:C.inkSoft,border:`1px solid ${C.rule}`,borderRadius:99,padding:"9px 18px",cursor:"pointer"}}>← {prev.ref} · {prev.title}</button>:<div/>}
        {next?<button onClick={()=>{if(typeof _stopTTS!=='undefined')_stopTTS();window.scrollTo({top:0,behavior:'smooth'});setRoute("lesson-"+next.ref)}} style={{fontFamily:F.display,fontWeight:700,fontSize:13,background:C.ink,color:"#fff",border:"none",borderRadius:99,padding:"9px 18px",cursor:"pointer"}}>{next.ref} · {next.title} →</button>:(
          <button onClick={()=>{if(typeof _stopTTS!=='undefined')_stopTTS();setShowShareModal(true)}}
            style={{fontFamily:F.display,fontWeight:700,fontSize:13,
              background:C.accent,color:"#fff",border:"none",
              borderRadius:99,padding:"9px 18px",cursor:"pointer"}}>
            Module complete 🎉
          </button>
        )}
      </div>

      {imgFullscreen&&(
        <div onClick={()=>setImgFullscreen(false)} style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,0.95)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"zoom-out",padding:20}}>
          <img
            src={LC_MEDIA[lessonRef]}
            alt="Fullscreen"
            style={{maxWidth:"100%",maxHeight:"100vh",objectFit:"contain",borderRadius:8,boxShadow:"0 8px 48px rgba(0,0,0,0.8)"}}
            onClick={e=>e.stopPropagation()}
          />
          <button onClick={()=>setImgFullscreen(false)} style={{position:"fixed",top:20,right:20,background:"rgba(255,255,255,0.15)",border:"none",borderRadius:99,width:40,height:40,fontSize:20,color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(8px)"}}>✕</button>
          <div style={{position:"fixed",bottom:20,left:"50%",transform:"translateX(-50%)",color:"rgba(255,255,255,0.4)",fontSize:12,fontFamily:"monospace"}}>Click anywhere to close</div>
        </div>
      )}

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
      <div style={{background:C.ink,borderRadius:6,padding:"32px 36px",margin:"28px 0 0",cursor:"pointer"}} onClick={()=>{window.scrollTo({top:0,behavior:'smooth'});setRoute("lesson-3.4")}}>
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
            <div key={l.ref} onClick={()=>{window.scrollTo({top:0,behavior:'smooth'});setRoute("lesson-"+l.ref)}} style={{display:"grid",gridTemplateColumns:"52px 1fr auto",gap:14,alignItems:"center",background:l.active?`color-mix(in srgb,${C.accent} 5%,${C.cream})`:C.cream,padding:"13px 18px",cursor:"pointer",transition:"background 140ms"}}
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

function ModuleRow({mod,oddCol,setRoute}){const[hov,setHov]=useState(false);const[dotIdx,setDotIdx]=useState(null);const{ref,beam,onMove,onLeave:bLeave}=useBeam();const numColor=mod.done?hov?"#4a9068":C.forest:mod.active?hov?C.amber:C.accent:hov?"rgba(232,160,32,0.80)":"rgba(232,160,32,0.11)";const barColor=mod.done?C.forest:mod.active?C.accent:C.ruleStrong;const hovL=dotIdx!==null?mod.lessons[dotIdx]:null;return(<div ref={ref} onMouseMove={e=>{onMove(e);setHov(true)}} onMouseEnter={()=>setHov(true)} onMouseLeave={e=>{bLeave(e);setHov(false)}} onClick={()=>{window.scrollTo({top:0,behavior:'smooth'});setRoute("lesson-"+mod.lessons[0].ref)}} style={{display:"grid",gridTemplateColumns:"80px 1fr auto",gap:20,padding:`24px 24px 24px ${hov?30:24}px`,borderBottom:`1px solid ${C.rule}`,borderRight:oddCol?`1px solid ${C.rule}`:"none",background:hov?mod.active?`color-mix(in srgb,${C.accent} 5%,${C.cream})`:C.creamWarm:"transparent",transition:"background 200ms,padding-left 180ms",cursor:"pointer",position:"relative",overflow:"hidden"}}>
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
          return(<div key={mod.n} onClick={locked?()=>setShowUpgrade(true):()=>{window.scrollTo({top:0,behavior:'smooth'});setRoute(`lesson-${parseInt(mod.n)}.1`)}}
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
  const [showUpgrade, setShowUpgrade] = useState(false)
  return(
    <div style={{display:"grid",gridTemplateColumns:"220px 1fr",minHeight:"100vh",
      fontFamily:F.body,background:C.cream}}>
      <style>{`@import url('${FONT_URL}');*{box-sizing:border-box}code{font-family:${F.mono};font-size:0.9em;background:rgba(0,0,0,0.06);padding:1px 5px;border-radius:3px}`}</style>
      {showUpgrade && <UpgradeModal user={user} onClose={()=>setShowUpgrade(false)}/>}
      <Sidebar route={route} setRoute={setRoute} user={user} onSignOut={onSignOut}/>
      <main style={{background:C.cream,minHeight:"100vh",overflowX:"hidden"}}>
        {route==="home"&&user?.plan==="team_admin"  && <TeamAdminDashboard user={user} setRoute={setRoute}/>}
        {route==="home"&&user?.plan==="team_member" && <TeamMemberView user={user} setRoute={setRoute}/>}
        {route==="home"&&user?.plan!=="team_admin"&&user?.plan!=="team_member" && <Dashboard setRoute={setRoute} user={user}/>}
        {route==="search"    && <SearchPage setRoute={setRoute} user={user} setShowUpgrade={setShowUpgrade}/>}
        {route==="bookmarks" && <BookmarksPage setRoute={setRoute}/>}
        {route==="notes"     && <NotesPage setRoute={setRoute}/>}
        {route==="continue"  && <ContinuePage setRoute={setRoute}/>}
        {route==="exam"      && <ExamPage setRoute={setRoute}/>}
        {route==="cert"      && <CertPage/>}
        {route==="account"   && <AccountPage/>}
        {route.startsWith("lesson-") && <LessonPage lessonRef={route.replace("lesson-","")} setRoute={setRoute} user={user} setShowUpgrade={setShowUpgrade}/>}
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
