'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

/* ── Animated counter hook ───────────────────────────── */
function useCounter(target: number, duration = 2200) {
  const [count, setCount] = useState(0);
  const started = useRef(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        let s = 0;
        const step = target / (duration / 16);
        const t = setInterval(() => {
          s += step;
          if (s >= target) { setCount(target); clearInterval(t); }
          else setCount(Math.floor(s));
        }, 16);
      }
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, duration]);
  return { count, ref };
}

/* ── Reveal on scroll hook ────────────────────────────── */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.12 });
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useReveal();

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  const kg    = useCounter(3241);
  const trips = useCounter(847);
  const pts   = useCounter(12);
  const meals = useCounter(9700);

  return (
    <>
      {/* ═══ NAV ═══════════════════════════════════════════ */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        transition: 'all 0.35s ease',
        padding: '0 32px',
        height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        ...(scrolled ? {
          background: 'rgba(10,46,30,0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(168,197,181,0.14)',
        } : {
          background: 'transparent',
        }),
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #F59713, #e08810)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: 14, color: '#fff', letterSpacing: '-0.5px',
          }}>RF</div>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 16, letterSpacing: '-0.3px' }}>
            Rajyash Foundation
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link href="/track" style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, fontWeight: 500, textDecoration: 'none', padding: '6px 14px', transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color='#fff')}
            onMouseLeave={e => (e.currentTarget.style.color='rgba(255,255,255,0.75)')}>
            Track Request
          </Link>
          <Link href="/give" className="btn-saffron" style={{ padding: '9px 22px', fontSize: 13, borderRadius: 50 }}>
            Donate Food →
          </Link>
        </div>
      </nav>

      {/* ═══ HERO ══════════════════════════════════════════ */}
      <section className="grain" style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #0A2E1E 0%, #0d3a25 50%, #0A2E1E 100%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center',
        padding: '120px 24px 80px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Background circles */}
        <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,151,19,0.06) 0%, transparent 70%)', top: '10%', left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'rgba(20,92,58,0.3)', bottom: '5%', right: '5%', filter: 'blur(80px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: 'rgba(245,151,19,0.08)', top: '20%', left: '8%', filter: 'blur(60px)', pointerEvents: 'none' }} />

        {/* Pill badge */}
        <div className="animate-fade-up" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(245,151,19,0.12)', border: '1px solid rgba(245,151,19,0.3)',
          borderRadius: 50, padding: '6px 16px', marginBottom: 28,
        }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#F59713', boxShadow: '0 0 8px #F59713' }} />
          <span style={{ color: '#F59713', fontSize: 12, fontWeight: 600, letterSpacing: '0.5px' }}>
            RAJYASH FOUNDATION · AHMEDABAD
          </span>
        </div>

        <h1 className="animate-fade-up delay-100" style={{
          fontSize: 'clamp(42px, 7vw, 88px)',
          fontWeight: 900,
          color: '#fff',
          lineHeight: 1.05,
          letterSpacing: '-2px',
          marginBottom: 10,
          maxWidth: 800,
        }}>
          Every meal saved
        </h1>
        <h1 className="animate-fade-up delay-200" style={{
          fontSize: 'clamp(42px, 7vw, 88px)',
          fontWeight: 900,
          background: 'linear-gradient(90deg, #F59713, #FDB944)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          lineHeight: 1.05,
          letterSpacing: '-2px',
          marginBottom: 28,
        }}>
          is a life touched.
        </h1>
        <p className="animate-fade-up delay-300" style={{
          fontSize: 'clamp(16px, 2vw, 20px)',
          color: '#A8C5B5',
          maxWidth: 520,
          lineHeight: 1.6,
          marginBottom: 44,
          fontWeight: 400,
        }}>
          We connect restaurants, hotels and caterers with surplus food to families who need it — same day, across Ahmedabad.
        </p>
        <div className="animate-fade-up delay-400" style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/give" className="btn-saffron" style={{ fontSize: 16, padding: '16px 36px' }}>
            Donate Surplus Food →
          </Link>
          <Link href="/track" className="btn-ghost" style={{ fontSize: 15, padding: '16px 32px' }}>
            Track a Request
          </Link>
        </div>

        {/* Scroll indicator */}
        <div className="animate-bounce-arrow" style={{ position: 'absolute', bottom: 36, left: '50%', transform: 'translateX(-50%)' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M7 10l5 5 5-5" stroke="rgba(168,197,181,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </section>

      {/* ═══ IMPACT COUNTERS ═══════════════════════════════ */}
      <section style={{ background: '#fff', padding: '72px 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <p className="reveal" style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, letterSpacing: '2px', color: '#F59713', marginBottom: 12, textTransform: 'uppercase' }}>
            Our Impact
          </p>
          <h2 className="reveal" style={{ textAlign: 'center', fontSize: 'clamp(28px,4vw,42px)', fontWeight: 900, color: '#0A2E1E', marginBottom: 56, letterSpacing: '-1px' }}>
            Numbers that matter
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
            {[
              { refObj: kg,    num: '3,241', suffix: ' kg',    label: 'Food Rescued',      icon: '🌾' },
              { refObj: trips, num: '847',   suffix: '',        label: 'Trips Completed',   icon: '🚐' },
              { refObj: meals, num: '9,700', suffix: '+',       label: 'Meals Served',      icon: '🍱' },
              { refObj: pts,   num: '12',    suffix: '',        label: 'Drop Points Active', icon: '📍' },
            ].map((s, i) => (
              <div key={i} className="reveal" ref={s.refObj.ref} style={{
                textAlign: 'center', padding: '36px 24px',
                borderRadius: 20,
                background: i % 2 === 0 ? '#FDFAF6' : '#fff',
                transition: 'transform 0.25s',
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-4px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>{s.icon}</div>
                <div style={{
                  fontSize: 'clamp(36px,5vw,56px)', fontWeight: 900,
                  color: '#0A2E1E', lineHeight: 1,
                  letterSpacing: '-2px',
                }}>
                  {s.refObj.count.toLocaleString('en-IN')}{s.suffix}
                </div>
                <div style={{ fontSize: 14, color: '#6B8A7A', fontWeight: 500, marginTop: 8 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ══════════════════════════════════ */}
      <section style={{ background: '#FDFAF6', padding: '96px 24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <p className="reveal" style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, letterSpacing: '2px', color: '#F59713', marginBottom: 12, textTransform: 'uppercase' }}>
            How It Works
          </p>
          <h2 className="reveal" style={{ textAlign: 'center', fontSize: 'clamp(28px,4vw,42px)', fontWeight: 900, color: '#0A2E1E', marginBottom: 16, letterSpacing: '-1px' }}>
            Three steps. One full plate.
          </h2>
          <p className="reveal" style={{ textAlign: 'center', color: '#6B8A7A', fontSize: 16, marginBottom: 72, maxWidth: 480, margin: '0 auto 72px' }}>
            From your kitchen to a family&apos;s table in the same day.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
            {[
              { step: '01', icon: '📝', title: 'Submit a Request', desc: 'Fill a quick form — food type, quantity, pickup address, and when it\'s ready. Takes 90 seconds.', color: '#F59713' },
              { step: '02', icon: '🧑‍✈️', title: 'We Assign a Driver', desc: 'Our admin team reviews and assigns the nearest available driver immediately. You get a tracking ID.', color: '#0A2E1E' },
              { step: '03', icon: '🍱', title: 'Food Reaches Families', desc: 'Driver picks up, photographs, and delivers to a verified drop point. Trip closed with proof.', color: '#145C3A' },
            ].map((s, i) => (
              <div key={i} className="reveal card-hover" style={{
                background: '#fff',
                borderRadius: 24,
                padding: '40px 32px',
                border: '1px solid rgba(10,46,30,0.06)',
                boxShadow: '0 4px 24px rgba(10,46,30,0.06)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                  <div style={{ fontSize: 40 }}>{s.icon}</div>
                  <span style={{ fontSize: 13, fontWeight: 800, color: 'rgba(10,46,30,0.15)', letterSpacing: '1px' }}>{s.step}</span>
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0A2E1E', marginBottom: 12, letterSpacing: '-0.3px' }}>{s.title}</h3>
                <p style={{ fontSize: 15, color: '#6B8A7A', lineHeight: 1.65 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ WHO CAN DONATE ════════════════════════════════ */}
      <section style={{ background: '#fff', padding: '96px 24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <p className="reveal" style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, letterSpacing: '2px', color: '#F59713', marginBottom: 12, textTransform: 'uppercase' }}>
            Who Can Donate
          </p>
          <h2 className="reveal" style={{ textAlign: 'center', fontSize: 'clamp(28px,4vw,42px)', fontWeight: 900, color: '#0A2E1E', marginBottom: 16, letterSpacing: '-1px' }}>
            You already have what we need.
          </h2>
          <p className="reveal" style={{ textAlign: 'center', color: '#6B8A7A', fontSize: 16, marginBottom: 64, maxWidth: 400, margin: '0 auto 64px' }}>
            No registration fees. No complex process. Just good food, put to good use.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {[
              { emoji: '🏨', type: 'Hotels', desc: 'Buffet surplus, banquet leftovers' },
              { emoji: '🍽️', type: 'Restaurants', desc: 'End-of-day prepared food' },
              { emoji: '🎪', type: 'Event Venues', desc: 'Post-event catered food' },
              { emoji: '🏫', type: 'Canteens', desc: 'School & office cafeterias' },
            ].map((item, i) => (
              <div key={i} className="reveal card-hover" style={{
                borderRadius: 20, padding: '32px 24px', textAlign: 'center',
                background: '#FDFAF6',
                border: '1.5px solid transparent',
                transition: 'all 0.25s',
                cursor: 'default',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#F59713'; e.currentTarget.style.background = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = '#FDFAF6'; }}>
                <div style={{ fontSize: 44, marginBottom: 14 }}>{item.emoji}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0A2E1E', marginBottom: 6 }}>{item.type}</div>
                <div style={{ fontSize: 13, color: '#6B8A7A', lineHeight: 1.5 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA BAND ═══════════════════════════════════════ */}
      <section className="grain" style={{
        background: '#0A2E1E',
        padding: '96px 24px',
        textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,151,19,0.07) 0%, transparent 70%)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h2 className="reveal" style={{ fontSize: 'clamp(28px,5vw,52px)', fontWeight: 900, color: '#fff', letterSpacing: '-1.5px', marginBottom: 18, lineHeight: 1.1 }}>
            Ready to make a difference?
          </h2>
          <p className="reveal" style={{ color: '#A8C5B5', fontSize: 18, marginBottom: 40, maxWidth: 440, margin: '0 auto 40px' }}>
            It takes less than 2 minutes to submit a pickup request.
          </p>
          <div className="reveal" style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/give" className="btn-saffron" style={{ fontSize: 16, padding: '17px 40px' }}>
              Donate Surplus Food →
            </Link>
            <Link href="/track" className="btn-ghost" style={{ fontSize: 15, padding: '17px 32px' }}>
              Track a Request
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ══════════════════════════════════════════ */}
      <footer style={{ background: '#071A10', padding: '48px 32px 32px', color: '#A8C5B5' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 32, marginBottom: 40 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#F59713,#e08810)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 12, color: '#fff' }}>RF</div>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Rajyash Foundation</span>
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.6, maxWidth: 280, color: '#6B8A7A' }}>
                Rescuing surplus food and feeding families in need across Ahmedabad since 2024.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', color: '#6B8A7A', marginBottom: 14, textTransform: 'uppercase' }}>Quick Links</div>
                {[['Donate Food', '/give'], ['Track Request', '/track'], ['Admin Panel', '/admin']].map(([label, href]) => (
                  <div key={label} style={{ marginBottom: 10 }}>
                    <Link href={href} style={{ color: '#A8C5B5', fontSize: 14, textDecoration: 'none', transition: 'color 0.2s' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#F59713')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#A8C5B5')}>{label}</Link>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', color: '#6B8A7A', marginBottom: 14, textTransform: 'uppercase' }}>Contact</div>
                <div style={{ fontSize: 14, color: '#A8C5B5', marginBottom: 8 }}>Ahmedabad, Gujarat</div>
                <div style={{ fontSize: 14, color: '#A8C5B5' }}>info@rajyashfoundation.org</div>
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(168,197,181,0.1)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <span style={{ fontSize: 12, color: '#3A5C4A' }}>© 2026 Rajyash Foundation. All rights reserved.</span>
            <span style={{ fontSize: 12, color: '#3A5C4A' }}>Built with purpose 🌱</span>
          </div>
        </div>
      </footer>
    </>
  );
}
