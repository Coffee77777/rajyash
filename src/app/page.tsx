'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

function useCounter(target: number, duration = 2400) {
  const [count, setCount] = useState(0);
  const started = useRef(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        let s = 0; const step = target / (duration / 16);
        const t = setInterval(() => {
          s += step;
          if (s >= target) { setCount(target); clearInterval(t); }
          else setCount(Math.floor(s));
        }, 16);
      }
    }, { threshold: 0.4 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, duration]);
  return { count, ref };
}

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const obs = new IntersectionObserver(e => e.forEach(en => { if (en.isIntersecting) en.target.classList.add('visible'); }), { threshold: 0.1 });
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

const FLOATERS = [
  { emoji: '🍱', top: '15%', left: '8%',  size: 32, delay: '0s',   dur: '7s' },
  { emoji: '🌾', top: '25%', right: '9%', size: 28, delay: '1.2s', dur: '9s' },
  { emoji: '🥘', top: '55%', left: '5%',  size: 26, delay: '0.5s', dur: '8s' },
  { emoji: '🍛', top: '65%', right: '7%', size: 30, delay: '2s',   dur: '6s' },
  { emoji: '🥗', top: '40%', left: '3%',  size: 24, delay: '1.8s', dur: '10s' },
  { emoji: '🍞', top: '78%', right: '12%',size: 22, delay: '0.8s', dur: '7.5s' },
];

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  useReveal();
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  const kg    = useCounter(3241);
  const trips = useCounter(847);
  const meals = useCounter(9700);
  const pts   = useCounter(12);

  return (
    <>
      {/* ══ NAV ══════════════════════════════════════════════════ */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: 68, padding: '0 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        transition: 'all 0.4s ease',
        ...(scrolled ? {
          background: 'rgba(8,36,22,0.88)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(168,197,181,0.1)',
        } : { background: 'transparent' }),
      }}>
        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, position: 'relative',
            background: 'linear-gradient(145deg, #F59713 0%, #e07c10 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(245,151,19,0.35)',
            flexShrink: 0,
          }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M11 2C11 2 5 6 5 12C5 15.3 7.7 18 11 18C14.3 18 17 15.3 17 12C17 6 11 2 11 2Z" fill="white" opacity="0.95"/>
              <path d="M11 18V21" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M8 21H14" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 15, letterSpacing: '-0.3px', lineHeight: 1.1 }}>Rajyash Foundation</div>
            <div style={{ color: 'rgba(168,197,181,0.6)', fontSize: 10, letterSpacing: '0.8px', fontWeight: 500 }}>FOOD RESCUE · AHMEDABAD</div>
          </div>
        </Link>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <Link href="/track" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: 500, textDecoration: 'none', padding: '8px 16px', borderRadius: 50, transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.color='#fff'; e.currentTarget.style.background='rgba(255,255,255,0.07)'; }}
            onMouseLeave={e => { e.currentTarget.style.color='rgba(255,255,255,0.7)'; e.currentTarget.style.background='transparent'; }}>
            Track Request
          </Link>
          <Link href="/give" className="btn-saffron" style={{ padding: '9px 22px', fontSize: 13 }}>
            Donate Food →
          </Link>
        </div>
      </nav>

      {/* ══ HERO ══════════════════════════════════════════════════ */}
      <section className="grain" style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse 80% 60% at 50% 0%, #1a4731 0%, #0A2E1E 55%, #071a10 100%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '140px 24px 100px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Ambient blobs */}
        <div style={{ position:'absolute', width:700, height:700, borderRadius:'50%', background:'radial-gradient(circle, rgba(245,151,19,0.07) 0%, transparent 65%)', top:'5%', left:'50%', transform:'translateX(-50%)', pointerEvents:'none', zIndex:1 }}/>
        <div style={{ position:'absolute', width:320, height:320, borderRadius:'50%', background:'rgba(20,92,58,0.35)', bottom:'8%', right:'3%', filter:'blur(90px)', pointerEvents:'none', zIndex:1 }}/>
        <div style={{ position:'absolute', width:240, height:240, borderRadius:'50%', background:'rgba(245,151,19,0.07)', top:'18%', left:'6%', filter:'blur(70px)', pointerEvents:'none', zIndex:1 }}/>

        {/* Floating food particles */}
        {FLOATERS.map((f, i) => (
          <div key={i} style={{
            position:'absolute', fontSize: f.size, opacity: 0.18,
            top: f.top, left: f.left ?? undefined, right: (f as {right?:string}).right ?? undefined,
            animation: `${i % 2 === 0 ? 'float' : 'float2'} ${f.dur} ease-in-out infinite`,
            animationDelay: f.delay, pointerEvents:'none', zIndex:1, filter:'blur(0.5px)',
            userSelect:'none',
          }}>{f.emoji}</div>
        ))}

        {/* Content */}
        <div style={{ position:'relative', zIndex:2 }}>
          {/* Badge */}
          <div className="animate-fade-up" style={{
            display:'inline-flex', alignItems:'center', gap:8,
            background:'rgba(245,151,19,0.1)', border:'1px solid rgba(245,151,19,0.28)',
            borderRadius:50, padding:'7px 18px', marginBottom:32,
            backdropFilter:'blur(8px)',
          }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background:'#F59713', boxShadow:'0 0 10px #F59713' }}/>
            <span style={{ color:'#FDB944', fontSize:12, fontWeight:600, letterSpacing:'0.8px' }}>RESCUING FOOD · FEEDING FAMILIES</span>
          </div>

          <h1 className="animate-fade-up delay-100" style={{
            fontSize:'clamp(44px,7.5vw,92px)', fontWeight:900, color:'#fff',
            lineHeight:1.04, letterSpacing:'-2.5px', marginBottom:8, maxWidth:820,
          }}>Every meal saved</h1>

          <h1 className="animate-fade-up delay-200" style={{
            fontSize:'clamp(44px,7.5vw,92px)', fontWeight:900,
            lineHeight:1.04, letterSpacing:'-2.5px', marginBottom:32,
          }}>
            <span className="text-shimmer">is a life touched.</span>
          </h1>

          <p className="animate-fade-up delay-300" style={{
            fontSize:'clamp(16px,2vw,20px)', color:'rgba(168,197,181,0.85)',
            maxWidth:520, lineHeight:1.7, marginBottom:48, fontWeight:400,
          }}>
            We connect hotels, restaurants &amp; caterers with surplus food to families who need it — same day, across Ahmedabad.
          </p>

          <div className="animate-fade-up delay-400" style={{ display:'flex', gap:14, flexWrap:'wrap', justifyContent:'center' }}>
            <Link href="/give" className="btn-saffron" style={{ fontSize:16, padding:'17px 40px' }}>
              Donate Surplus Food →
            </Link>
            <Link href="/track" className="btn-ghost" style={{ fontSize:15, padding:'17px 34px' }}>
              Track a Request
            </Link>
          </div>

          {/* Mini stats strip */}
          <div className="animate-fade-up delay-600" style={{
            display:'flex', gap:32, justifyContent:'center', marginTop:64,
            flexWrap:'wrap',
          }}>
            {[['3,241+', 'kg rescued'], ['847+', 'trips done'], ['9,700+', 'meals served']].map(([n, l]) => (
              <div key={l} style={{ textAlign:'center' }}>
                <div style={{ fontSize:22, fontWeight:900, color:'#FDB944', letterSpacing:'-0.5px' }}>{n}</div>
                <div style={{ fontSize:12, color:'rgba(168,197,181,0.5)', fontWeight:500, marginTop:3 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll arrow */}
        <div className="animate-bounce-arrow" style={{ position:'absolute', bottom:36, left:'50%', zIndex:2 }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M7 10l5 5 5-5" stroke="rgba(168,197,181,0.4)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </section>

      {/* ══ IMPACT ════════════════════════════════════════════════ */}
      <section style={{ background:'#0A2E1E', padding:'88px 24px' }}>
        <div style={{ maxWidth:1040, margin:'0 auto' }}>
          <p className="reveal" style={{ textAlign:'center', fontSize:11, fontWeight:700, letterSpacing:'2.5px', color:'#F59713', marginBottom:10, textTransform:'uppercase' }}>
            Our Impact
          </p>
          <h2 className="reveal" style={{ textAlign:'center', fontSize:'clamp(28px,4vw,44px)', fontWeight:900, color:'#fff', marginBottom:60, letterSpacing:'-1.2px' }}>
            Numbers that matter
          </h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:16 }}>
            {[
              { refObj:kg,    num:'3,241', suffix:' kg',  label:'Food Rescued',       icon:'🌾', color:'#F59713' },
              { refObj:trips, num:'847',   suffix:'',     label:'Trips Completed',    icon:'🚐', color:'#22c55e' },
              { refObj:meals, num:'9,700', suffix:'+',    label:'Meals Served',       icon:'🍱', color:'#06b6d4' },
              { refObj:pts,   num:'12',    suffix:'',     label:'Drop Points Active', icon:'📍', color:'#a78bfa' },
            ].map((s, i) => (
              <div key={i} className="reveal card-hover" ref={s.refObj.ref} style={{
                textAlign:'center', padding:'40px 28px',
                borderRadius:24,
                background:'rgba(255,255,255,0.04)',
                border:'1px solid rgba(255,255,255,0.08)',
                backdropFilter:'blur(12px)',
                position:'relative', overflow:'hidden',
              }}>
                <div style={{
                  position:'absolute', top:-30, right:-30, width:120, height:120,
                  borderRadius:'50%', background:`radial-gradient(circle, ${s.color}18 0%, transparent 70%)`,
                  pointerEvents:'none',
                }}/>
                <div style={{ fontSize:40, marginBottom:14 }}>{s.icon}</div>
                <div style={{
                  fontSize:'clamp(38px,5vw,58px)', fontWeight:900,
                  color:'#fff', lineHeight:1, letterSpacing:'-2px',
                }}>
                  {s.refObj.count.toLocaleString('en-IN')}{s.suffix}
                </div>
                <div style={{ fontSize:13, color:'rgba(168,197,181,0.6)', fontWeight:500, marginTop:10 }}>{s.label}</div>
                <div style={{ width:40, height:3, background:`linear-gradient(90deg, ${s.color}, transparent)`, borderRadius:2, margin:'14px auto 0' }}/>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══════════════════════════════════════════ */}
      <section style={{ background:'#fff', padding:'100px 24px' }}>
        <div style={{ maxWidth:1000, margin:'0 auto' }}>
          <p className="reveal" style={{ textAlign:'center', fontSize:11, fontWeight:700, letterSpacing:'2.5px', color:'#F59713', marginBottom:10, textTransform:'uppercase' }}>
            How It Works
          </p>
          <h2 className="reveal" style={{ textAlign:'center', fontSize:'clamp(28px,4vw,44px)', fontWeight:900, color:'#0A2E1E', marginBottom:12, letterSpacing:'-1.2px' }}>
            Three steps. One full plate.
          </h2>
          <p className="reveal" style={{ textAlign:'center', color:'#6B8A7A', fontSize:16, marginBottom:72, maxWidth:460, margin:'0 auto 72px' }}>
            From your kitchen to a family&apos;s table, same day.
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:24 }}>
            {[
              { step:'01', icon:'📝', title:'Submit a Request', desc:'Fill a quick form — food type, how many it serves, pickup address, and when it\'s ready. 90 seconds.', accent:'#F59713' },
              { step:'02', icon:'🧑‍✈️', title:'We Assign a Driver', desc:'Our admin reviews and dispatches the nearest available driver immediately. You get a live tracking ID.', accent:'#22c55e' },
              { step:'03', icon:'🍱', title:'Food Reaches Families', desc:'Driver picks up, photographs, and delivers to a verified drop point. Trip closed with full proof.', accent:'#06b6d4' },
            ].map((s, i) => (
              <div key={i} className="reveal card-hover" style={{
                background:'#fff', borderRadius:24, padding:'40px 32px',
                border:'1.5px solid #f0ebe5',
                boxShadow:'0 4px 28px rgba(10,46,30,0.06)',
                position:'relative', overflow:'hidden',
              }}>
                <div style={{
                  position:'absolute', top:0, left:0, right:0, height:4,
                  background:`linear-gradient(90deg, ${s.accent}, transparent)`, borderRadius:'24px 24px 0 0',
                }}/>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
                  <div style={{
                    width:52, height:52, borderRadius:16,
                    background:`${s.accent}15`, border:`1.5px solid ${s.accent}30`,
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:24,
                  }}>{s.icon}</div>
                  <span style={{ fontSize:40, fontWeight:900, color:'rgba(10,46,30,0.07)', letterSpacing:'-2px' }}>{s.step}</span>
                </div>
                <h3 style={{ fontSize:20, fontWeight:800, color:'#0A2E1E', marginBottom:12, letterSpacing:'-0.3px' }}>{s.title}</h3>
                <p style={{ fontSize:15, color:'#6B8A7A', lineHeight:1.7 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ WHO CAN DONATE ════════════════════════════════════════ */}
      <section style={{ background:'#FDFAF6', padding:'100px 24px' }}>
        <div style={{ maxWidth:1000, margin:'0 auto' }}>
          <p className="reveal" style={{ textAlign:'center', fontSize:11, fontWeight:700, letterSpacing:'2.5px', color:'#F59713', marginBottom:10, textTransform:'uppercase' }}>
            Who Can Donate
          </p>
          <h2 className="reveal" style={{ textAlign:'center', fontSize:'clamp(28px,4vw,44px)', fontWeight:900, color:'#0A2E1E', marginBottom:12, letterSpacing:'-1.2px' }}>
            You already have what we need.
          </h2>
          <p className="reveal" style={{ textAlign:'center', color:'#6B8A7A', fontSize:16, marginBottom:64, maxWidth:400, margin:'0 auto 64px' }}>
            No registration fees. No complex process. Just good food, put to good use.
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:16 }}>
            {[
              { emoji:'🏨', type:'Hotels', desc:'Buffet surplus, banquet leftovers', color:'#F59713' },
              { emoji:'🍽️', type:'Restaurants', desc:'End-of-day prepared food', color:'#22c55e' },
              { emoji:'🎪', type:'Event Venues', desc:'Post-event catered food', color:'#06b6d4' },
              { emoji:'🏫', type:'Canteens', desc:'School & office cafeterias', color:'#a78bfa' },
            ].map((item, i) => (
              <div key={i} className="reveal card-hover" style={{
                borderRadius:20, padding:'36px 24px', textAlign:'center',
                background:'#fff', cursor:'default',
                border:'1.5px solid #f0ebe5',
                position:'relative', overflow:'hidden',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = item.color; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#f0ebe5'; }}>
                <div style={{
                  width:64, height:64, borderRadius:20, margin:'0 auto 18px',
                  background:`${item.color}12`, display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:32,
                }}>{item.emoji}</div>
                <div style={{ fontSize:16, fontWeight:800, color:'#0A2E1E', marginBottom:6 }}>{item.type}</div>
                <div style={{ fontSize:13, color:'#6B8A7A', lineHeight:1.55 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA BAND ══════════════════════════════════════════════ */}
      <section className="grain" style={{
        background:'radial-gradient(ellipse 70% 80% at 50% 50%, #1a4731 0%, #0A2E1E 100%)',
        padding:'100px 24px', textAlign:'center',
        position:'relative',
      }}>
        <div style={{ position:'absolute', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle, rgba(245,151,19,0.08) 0%, transparent 65%)', top:'50%', left:'50%', transform:'translate(-50%,-50%)', pointerEvents:'none', zIndex:1 }}/>
        <div style={{ position:'relative', zIndex:2 }}>
          <h2 className="reveal" style={{ fontSize:'clamp(30px,5vw,54px)', fontWeight:900, color:'#fff', letterSpacing:'-1.5px', marginBottom:18, lineHeight:1.1 }}>
            Ready to make a difference?
          </h2>
          <p className="reveal" style={{ color:'rgba(168,197,181,0.75)', fontSize:18, marginBottom:44, maxWidth:440, margin:'0 auto 44px' }}>
            It takes less than 2 minutes to submit a pickup request.
          </p>
          <div className="reveal" style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
            <Link href="/give" className="btn-saffron" style={{ fontSize:16, padding:'18px 44px' }}>
              Donate Surplus Food →
            </Link>
            <Link href="/track" className="btn-ghost" style={{ fontSize:15, padding:'18px 36px' }}>
              Track a Request
            </Link>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ════════════════════════════════════════════════ */}
      <footer style={{ background:'#071A10', padding:'56px 40px 32px', color:'#A8C5B5' }}>
        <div style={{ maxWidth:1040, margin:'0 auto' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:40, marginBottom:48 }}>
            {/* Brand */}
            <div style={{ maxWidth:280 }}>
              <div style={{ display:'flex', alignItems:'center', gap:11, marginBottom:14 }}>
                <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(145deg,#F59713,#e07c10)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
                    <path d="M11 2C11 2 5 6 5 12C5 15.3 7.7 18 11 18C14.3 18 17 15.3 17 12C17 6 11 2 11 2Z" fill="white" opacity="0.95"/>
                    <path d="M11 18V21" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                    <path d="M8 21H14" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                </div>
                <div>
                  <div style={{ color:'#fff', fontWeight:700, fontSize:15, lineHeight:1.1 }}>Rajyash Foundation</div>
                  <div style={{ color:'rgba(168,197,181,0.4)', fontSize:10, letterSpacing:'0.8px' }}>FOOD RESCUE · AHMEDABAD</div>
                </div>
              </div>
              <p style={{ fontSize:13, lineHeight:1.7, color:'#4A6B5A' }}>
                Rescuing surplus food and feeding families in need across Ahmedabad since 2024.
              </p>
            </div>

            {/* Links */}
            <div style={{ display:'flex', gap:56, flexWrap:'wrap' }}>
              <div>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:'2px', color:'#3A5C4A', marginBottom:16, textTransform:'uppercase' }}>Donate</div>
                {[['Submit Request', '/give'], ['Track Status', '/track']].map(([l,h]) => (
                  <div key={l} style={{ marginBottom:10 }}>
                    <Link href={h} style={{ color:'#6B8A7A', fontSize:14, textDecoration:'none', transition:'color 0.2s' }}
                      onMouseEnter={e => (e.currentTarget.style.color='#F59713')}
                      onMouseLeave={e => (e.currentTarget.style.color='#6B8A7A')}>{l}</Link>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:'2px', color:'#3A5C4A', marginBottom:16, textTransform:'uppercase' }}>Portals</div>
                {[['Admin Panel', '/admin'], ['Driver Portal', '/driver']].map(([l,h]) => (
                  <div key={l} style={{ marginBottom:10 }}>
                    <Link href={h} style={{ color:'#6B8A7A', fontSize:14, textDecoration:'none', transition:'color 0.2s' }}
                      onMouseEnter={e => (e.currentTarget.style.color='#F59713')}
                      onMouseLeave={e => (e.currentTarget.style.color='#6B8A7A')}>{l}</Link>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:'2px', color:'#3A5C4A', marginBottom:16, textTransform:'uppercase' }}>Contact</div>
                <div style={{ fontSize:13, color:'#4A6B5A', marginBottom:8 }}>Ahmedabad, Gujarat</div>
                <div style={{ fontSize:13, color:'#4A6B5A' }}>info@rajyashfoundation.org</div>
              </div>
            </div>
          </div>
          <div style={{ borderTop:'1px solid rgba(255,255,255,0.05)', paddingTop:24, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
            <span style={{ fontSize:12, color:'#2A4A3A' }}>© 2026 Rajyash Foundation. All rights reserved.</span>
            <span style={{ fontSize:12, color:'#2A4A3A' }}>Built with purpose 🌱</span>
          </div>
        </div>
      </footer>
    </>
  );
}
