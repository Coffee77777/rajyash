'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
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
    const obs = new IntersectionObserver(e => e.forEach(en => { if (en.isIntersecting) en.target.classList.add('visible'); }), { threshold: 0.08 });
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  useReveal();
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  const meals  = useCounter(365000);
  const trips  = useCounter(1240);
  const donors = useCounter(380);
  const pts    = useCounter(18);

  return (
    <>
      {/* ══ NAV ══════════════════════════════════════════════════ */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: 72, padding: '0 48px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        transition: 'all 0.4s ease',
        ...(scrolled ? {
          background: 'rgba(15,61,31,0.97)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 2px 24px rgba(0,0,0,0.2)',
        } : { background: 'transparent' }),
      }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <Image src="/rajyash-logo.png" alt="Rajyash Foundation" width={180} height={56} style={{ objectFit: 'contain', filter: scrolled ? 'brightness(0) invert(1)' : 'brightness(0) invert(1)' }} priority />
        </Link>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link href="/track" style={{
            color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 500,
            textDecoration: 'none', padding: '8px 18px', borderRadius: 4,
            letterSpacing: '0.03em', transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.color='#fff'; e.currentTarget.style.background='rgba(255,255,255,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.color='rgba(255,255,255,0.8)'; e.currentTarget.style.background='transparent'; }}>
            Track Request
          </Link>
          <Link href="/give" className="btn-gold" style={{ padding: '10px 24px', fontSize: 12, borderRadius: 4 }}>
            Donate Food
          </Link>
        </div>
      </nav>

      {/* ══ HERO ══════════════════════════════════════════════════ */}
      <section style={{
        minHeight: '100vh', position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '140px 24px 100px',
      }}>
        {/* Background photo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/hero-bg.jpg" alt="" aria-hidden style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover', objectPosition: 'center 30%',
          pointerEvents: 'none', zIndex: 0,
        }}/>

        {/* Deep green overlay — visible but lets photo show through */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          background: 'linear-gradient(160deg, rgba(10,40,18,0.82) 0%, rgba(15,61,31,0.72) 40%, rgba(10,40,18,0.88) 100%)',
        }}/>

        {/* Gold vignette glow */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(ellipse at 50% 60%, rgba(196,150,60,0.10) 0%, transparent 65%)',
        }}/>

        <div style={{ position: 'relative', zIndex: 3, maxWidth: 820 }}>
          {/* Logo */}
          <div className="animate-fade-up" style={{ marginBottom: 32 }}>
            <Image src="/rajyash-logo.png" alt="Rajyash Foundation" width={220} height={70} style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)' }} priority />
          </div>

          {/* Tag */}
          <div className="animate-fade-up delay-100" style={{
            display: 'inline-flex', alignItems: 'center', gap: 14, marginBottom: 32,
          }}>
            <div style={{ width: 32, height: 1, background: 'linear-gradient(90deg, transparent, rgba(196,150,60,0.6))' }}/>
            <span style={{ color: 'rgba(196,150,60,0.75)', fontSize: 13, fontWeight: 300, fontStyle: 'italic', letterSpacing: '0.02em' }}>
              We rise by lifting others
            </span>
            <div style={{ width: 32, height: 1, background: 'linear-gradient(90deg, rgba(196,150,60,0.6), transparent)' }}/>
          </div>

          <h1 className="animate-fade-up delay-200" style={{
            fontSize: 'clamp(40px,6.5vw,84px)', fontWeight: 900,
            color: '#fff', lineHeight: 1.06, letterSpacing: '-2px', marginBottom: 8,
            textShadow: '0 2px 24px rgba(0,0,0,0.4)',
          }}>
            Every meal saved
          </h1>
          <h1 className="animate-fade-up delay-300" style={{
            fontSize: 'clamp(40px,6.5vw,84px)', fontWeight: 900,
            lineHeight: 1.06, letterSpacing: '-2px', marginBottom: 32,
          }}>
            <span className="text-gold-shimmer">is a life touched.</span>
          </h1>

          <p className="animate-fade-up delay-400" style={{
            fontSize: 'clamp(15px,1.8vw,19px)', color: 'rgba(255,255,255,0.72)',
            maxWidth: 520, lineHeight: 1.75, margin: '0 auto 48px',
            textShadow: '0 1px 8px rgba(0,0,0,0.3)',
          }}>
            Rajyash Foundation connects hotels, restaurants &amp; event venues with surplus food to families who need it — same day, across Ahmedabad.
          </p>

          <div className="animate-fade-up delay-500" style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/give" className="btn-gold" style={{ fontSize: 14, padding: '15px 40px' }}>
              Donate Surplus Food
            </Link>
            <Link href="/track" className="btn-outline" style={{ fontSize: 13, padding: '15px 32px' }}>
              Track a Request
            </Link>
          </div>

          {/* Stats strip */}
          <div className="animate-fade-up delay-600" style={{
            display: 'flex', gap: 0, justifyContent: 'center', marginTop: 72,
            borderTop: '1px solid rgba(196,150,60,0.25)', paddingTop: 36, flexWrap: 'wrap',
          }}>
            {[['365,000+','People Helped'],['1,240+','Trips Completed'],['18','Drop Points'],['380+','Donors']].map(([n,l],i,arr) => (
              <div key={l} style={{
                textAlign: 'center', padding: '0 36px',
                borderRight: i < arr.length-1 ? '1px solid rgba(196,150,60,0.2)' : 'none',
              }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: '#D4A84B', letterSpacing: '-0.5px' }}>{n}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4, letterSpacing: '0.05em' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll arrow */}
        <div className="animate-bounce-arrow" style={{ position: 'absolute', bottom: 32, left: '50%', zIndex: 3 }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M7 10l5 5 5-5" stroke="rgba(196,150,60,0.6)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </section>

      {/* ══ IMPACT ════════════════════════════════════════════════ */}
      <section style={{ background: '#fff', padding: '96px 24px' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div className="reveal section-tag">Our Impact</div>
            <h2 className="reveal" style={{ fontSize: 'clamp(28px,3.5vw,42px)', fontWeight: 900, color: '#0F3D1F', letterSpacing: '-1px', marginBottom: 16 }}>
              Numbers that matter
            </h2>
            <div className="reveal gold-rule" style={{ margin: '0 auto' }}/>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))', gap: 24 }}>
            {[
              { refObj: meals,  num: '365,000', suffix: '+', label: 'People Helped',      icon: '🍱', sub: 'meals distributed' },
              { refObj: trips,  num: '1,240',   suffix: '+', label: 'Trips Completed',    icon: '🚐', sub: 'successful pickups' },
              { refObj: donors, num: '380',      suffix: '+', label: 'Food Donors',        icon: '🏨', sub: 'hotels & restaurants' },
              { refObj: pts,    num: '18',       suffix: '',  label: 'Drop Points Active', icon: '📍', sub: 'across Ahmedabad' },
            ].map((s, i) => (
              <div key={i} className="reveal card-hover" ref={s.refObj.ref} style={{
                background: i % 2 === 0 ? '#FDFBF7' : '#fff',
                border: '1.5px solid #EDE8DB',
                borderRadius: 8, padding: '36px 28px', textAlign: 'center',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                  background: 'linear-gradient(90deg, #C4963C, #D4A84B)',
                }}/>
                <div style={{ fontSize: 36, marginBottom: 14 }}>{s.icon}</div>
                <div style={{
                  fontSize: 'clamp(28px,3.5vw,44px)', fontWeight: 900,
                  color: '#1B5E38', lineHeight: 1, letterSpacing: '-1px',
                  whiteSpace: 'nowrap',
                }}>
                  {s.refObj.count.toLocaleString('en-IN')}{s.suffix}
                </div>
                <div style={{ fontSize: 15, color: '#0F3D1F', fontWeight: 700, marginTop: 10 }}>{s.label}</div>
                <div style={{ fontSize: 12, color: '#7A9A7A', marginTop: 4 }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ STORY SECTION (children photo) ════════════════════════ */}
      <section style={{ background: '#0F3D1F', padding: '0', overflow: 'hidden', position: 'relative' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 520 }}>
          {/* Photo side */}
          <div style={{ position: 'relative', minHeight: 400 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/impact-children.jpg" alt="Children at school smiling" style={{
              width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block',
            }}/>
            {/* Gradient blend into green on right edge */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(90deg, transparent 60%, #0F3D1F 100%)',
              pointerEvents: 'none',
            }}/>
            {/* Bottom fade */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
              background: 'linear-gradient(to top, #0F3D1F, transparent)',
              pointerEvents: 'none',
            }}/>
            {/* Caption badge */}
            <div style={{
              position: 'absolute', bottom: 24, left: 24,
              background: 'rgba(10,40,18,0.75)', backdropFilter: 'blur(12px)',
              border: '1px solid rgba(196,150,60,0.3)', borderRadius: 10,
              padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e', flexShrink: 0 }}/>
              <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: 600 }}>Real children. Real impact.</span>
            </div>
          </div>

          {/* Text side */}
          <div style={{
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            padding: 'clamp(40px,6vw,80px) clamp(32px,5vw,72px)',
          }}>
            <div className="reveal" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(196,150,60,0.12)', border: '1px solid rgba(196,150,60,0.3)',
              borderRadius: 2, padding: '5px 14px', marginBottom: 24, alignSelf: 'flex-start',
            }}>
              <span style={{ color: '#D4A84B', fontSize: 10, fontWeight: 700, letterSpacing: '2px' }}>OUR STORY</span>
            </div>

            <h2 className="reveal" style={{
              fontSize: 'clamp(28px,3.5vw,46px)', fontWeight: 900, color: '#fff',
              lineHeight: 1.1, letterSpacing: '-1px', marginBottom: 20,
            }}>
              From surplus plates<br/>
              <span style={{ color: '#D4A84B' }}>to smiling faces.</span>
            </h2>

            <p className="reveal" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, lineHeight: 1.85, marginBottom: 28 }}>
              Since 2021, Rajyash Foundation has been turning excess food into nourishment for children, daily-wage families, and communities in need across Ahmedabad — same-day, every day.
            </p>

            <div className="reveal" style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 36 }}>
              {[['🏫','Schools & shelters fed'],['👨‍👩‍👧','Families reached daily'],['♻️','Zero waste mission']].map(([icon,text]) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(196,150,60,0.12)', border: '1px solid rgba(196,150,60,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{icon}</div>
                  <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: 500 }}>{text}</span>
                </div>
              ))}
            </div>

            <div className="reveal">
              <Link href="/give" className="btn-gold" style={{ fontSize: 13, padding: '13px 32px', display: 'inline-block' }}>
                Be Part of the Story →
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile: stack photo on top */}
        <style>{`
          @media (max-width: 700px) {
            .story-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </section>

      {/* ══ HOW IT WORKS ══════════════════════════════════════════ */}
      <section style={{ background: '#F4EFE4', padding: '100px 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 72 }}>
            <div className="reveal section-tag">How It Works</div>
            <h2 className="reveal" style={{ fontSize: 'clamp(28px,3.5vw,42px)', fontWeight: 900, color: '#0F3D1F', letterSpacing: '-1px', marginBottom: 16 }}>
              Three steps. One full plate.
            </h2>
            <div className="reveal gold-rule"/>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))', gap: 24 }}>
            {[
              { step: '01', icon: '📝', title: 'Submit a Request', desc: 'Fill a quick form — food type, how many people it serves, pickup address, and when it\'s ready. Takes 90 seconds.', color: '#C4963C' },
              { step: '02', icon: '🧑‍✈️', title: 'We Assign a Driver', desc: 'Our admin team reviews and dispatches the nearest available driver immediately. You get a live tracking ID.', color: '#1B5E38' },
              { step: '03', icon: '🍱', title: 'Food Reaches Families', desc: 'Driver picks up and delivers to a verified drop point. Trip closed with full confirmation.', color: '#0F3D1F' },
            ].map((s, i) => (
              <div key={i} className="reveal card-hover" style={{
                background: '#fff', borderRadius: 8, padding: '44px 36px',
                border: '1.5px solid #EDE8DB',
                boxShadow: '0 2px 16px rgba(15,61,31,0.06)',
                position: 'relative',
              }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 8,
                  background: `${s.color}15`, border: `2px solid ${s.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 26, marginBottom: 24,
                }}>{s.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: s.color, letterSpacing: '2px', marginBottom: 10 }}>STEP {s.step}</div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0F3D1F', marginBottom: 12, letterSpacing: '-0.3px' }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: '#4A6A4A', lineHeight: 1.75 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ WHO CAN DONATE ════════════════════════════════════════ */}
      <section style={{ background: '#fff', padding: '100px 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div className="reveal section-tag">Who Can Donate</div>
            <h2 className="reveal" style={{ fontSize: 'clamp(28px,3.5vw,42px)', fontWeight: 900, color: '#0F3D1F', letterSpacing: '-1px', marginBottom: 16 }}>
              You already have what we need.
            </h2>
            <div className="reveal gold-rule"/>
            <p className="reveal" style={{ color: '#7A9A7A', fontSize: 15, marginTop: 20, maxWidth: 420, margin: '20px auto 0' }}>
              No registration fees. No complex process. Just good food, put to good use.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px,1fr))', gap: 20 }}>
            {[
              { emoji: '🏨', type: 'Hotels', desc: 'Buffet surplus, banquet leftovers' },
              { emoji: '🍽️', type: 'Restaurants', desc: 'End-of-day prepared food' },
              { emoji: '🎪', type: 'Event Venues', desc: 'Post-event catered food' },
              { emoji: '🏫', type: 'Canteens', desc: 'School & office cafeterias' },
            ].map((item, i) => (
              <div key={i} className="reveal card-hover" style={{
                borderRadius: 8, padding: '36px 24px', textAlign: 'center',
                background: '#FDFBF7', border: '1.5px solid #EDE8DB', cursor: 'default',
                transition: 'all 0.25s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='#C4963C'; e.currentTarget.style.background='#FFF8EC'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='#EDE8DB'; e.currentTarget.style.background='#FDFBF7'; }}>
                <div style={{
                  width: 68, height: 68, borderRadius: 12, margin: '0 auto 18px',
                  background: 'rgba(196,150,60,0.1)', border: '1.5px solid rgba(196,150,60,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32,
                }}>{item.emoji}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0F3D1F', marginBottom: 6 }}>{item.type}</div>
                <div style={{ fontSize: 13, color: '#7A9A7A', lineHeight: 1.6 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA BAND ══════════════════════════════════════════════ */}
      <section style={{ position: 'relative', overflow: 'hidden', padding: '120px 24px', textAlign: 'center' }}>
        {/* Volunteer photo background */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/volunteer.jpg" alt="" aria-hidden style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover', objectPosition: 'center 25%',
          pointerEvents: 'none', zIndex: 0,
        }}/>
        {/* Dark green overlay */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          background: 'linear-gradient(135deg, rgba(10,40,18,0.86) 0%, rgba(15,61,31,0.78) 50%, rgba(10,40,18,0.90) 100%)',
        }}/>
        {/* Gold glow */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 2, backgroundImage: 'radial-gradient(ellipse at 50% 50%, rgba(196,150,60,0.12) 0%, transparent 65%)', pointerEvents: 'none' }}/>

        <div style={{ position: 'relative', zIndex: 3, maxWidth: 640, margin: '0 auto' }}>
          <div className="reveal section-tag">Join Us</div>
          <h2 className="reveal" style={{ fontSize: 'clamp(28px,4.5vw,52px)', fontWeight: 900, color: '#fff', letterSpacing: '-1.5px', marginBottom: 18, lineHeight: 1.1, textShadow: '0 2px 20px rgba(0,0,0,0.4)' }}>
            Ready to make a difference?
          </h2>
          <div className="reveal gold-rule" style={{ margin: '0 auto 28px' }}/>
          <p className="reveal" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, marginBottom: 44, lineHeight: 1.7 }}>
            It takes less than 2 minutes to submit a food pickup request.<br />Your surplus meal can be someone&apos;s only meal today.
          </p>
          <div className="reveal" style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/give" className="btn-gold" style={{ fontSize: 14, padding: '16px 44px' }}>
              Donate Surplus Food
            </Link>
            <Link href="/track" className="btn-outline" style={{ fontSize: 13, padding: '16px 36px' }}>
              Track a Request
            </Link>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ════════════════════════════════════════════════ */}
      <footer style={{ background: '#0A2910', padding: '60px 48px 32px' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 48, marginBottom: 56 }}>
            {/* Brand */}
            <div style={{ maxWidth: 280 }}>
              <Image src="/rajyash-logo.png" alt="Rajyash Foundation" width={160} height={50} style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)', marginBottom: 16, opacity: 0.9 }} />
              <p style={{ fontSize: 13, lineHeight: 1.8, color: 'rgba(255,255,255,0.35)' }}>
                Rescuing surplus food and feeding families in need across Ahmedabad. We rise by lifting others.
              </p>
              <div style={{ marginTop: 20, display: 'flex', gap: 3 }}>
                <div style={{ width: 28, height: 2, background: '#C4963C', borderRadius: 2 }}/>
                <div style={{ width: 10, height: 2, background: 'rgba(196,150,60,0.4)', borderRadius: 2 }}/>
              </div>
            </div>

            {/* Links */}
            <div style={{ display: 'flex', gap: 56, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', color: '#C4963C', marginBottom: 18, textTransform: 'uppercase' }}>Donate</div>
                {[['Submit Request', '/give'], ['Track Status', '/track']].map(([l, h]) => (
                  <div key={l} style={{ marginBottom: 12 }}>
                    <Link href={h} style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textDecoration: 'none', transition: 'color 0.2s' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#C4963C')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}>{l}</Link>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', color: '#C4963C', marginBottom: 18, textTransform: 'uppercase' }}>Portals</div>
                {[['Admin Panel', '/admin'], ['Driver Portal', '/driver']].map(([l, h]) => (
                  <div key={l} style={{ marginBottom: 12 }}>
                    <Link href={h} style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textDecoration: 'none', transition: 'color 0.2s' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#C4963C')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}>{l}</Link>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '2px', color: '#C4963C', marginBottom: 18, textTransform: 'uppercase' }}>Contact</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>Ahmedabad, Gujarat</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>info@rajyashfoundation.org</div>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>© 2026 Rajyash Foundation. All rights reserved.</span>
            <span style={{ fontSize: 12, color: 'rgba(196,150,60,0.35)', fontStyle: 'italic', fontWeight: 300 }}>We rise by lifting others</span>
          </div>
        </div>
      </footer>
    </>
  );
}
