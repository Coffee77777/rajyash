'use client';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const API = 'https://slipms.com/rajyash-api';

const STEPS = [
  { key: 'requested',    label: 'Request Received',   desc: 'Your request is safely in our system.',       icon: '📋', color: '#6366f1' },
  { key: 'under_review', label: 'Under Review',        desc: 'Our team is reviewing your request now.',     icon: '🔍', color: '#f59e0b' },
  { key: 'assigned',     label: 'Driver Assigned',     desc: 'A driver has been assigned to your pickup.',  icon: '🧑‍✈️', color: '#8b5cf6' },
  { key: 'accepted', label: 'Driver Accepted', desc: 'Driver has confirmed and is preparing to depart.', icon: '✅', color: '#6366f1' },
  { key: 'ride_started', label: 'On the Way',          desc: 'Driver is en route to your location.',        icon: '🚗', color: '#f97316' },
  { key: 'picked_up',    label: 'Food Picked Up',      desc: 'Driver has collected the food successfully.', icon: '📦', color: '#06b6d4' },
  { key: 'delivered',    label: 'Delivered',           desc: 'Food has reached the drop point.',            icon: '🏠', color: '#22c55e' },
  { key: 'closed',       label: 'Trip Closed',         desc: 'All done. Thank you for your generosity! 🙏', icon: '✅', color: '#22c55e' },
];

function TrackContent() {
  const params = useSearchParams();
  const [inputId, setInputId] = useState(params.get('id') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [request, setRequest] = useState<Record<string, string> | null>(null);
  const [searchMode, setSearchMode] = useState<'id'|'phone'>('id');
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneResults, setPhoneResults] = useState<Record<string,string>[]|null>(null);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  async function search(id?: string) {
    const raw = (id || inputId).trim();
    const trackId = raw.replace(/^RJ[-\s]?0*/i, '') || raw;
    if (!trackId) return;
    setLoading(true); setError(''); setRequest(null);
    try {
      const res = await fetch(`${API}/requests.php?id=${encodeURIComponent(trackId)}`);
      const data = await res.json();
      if (!res.ok || data.error) { setError('No request found with that ID. Please check and try again.'); return; }
      setRequest(data);
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  }

  async function searchByPhone() {
    const ph = phoneInput.trim().replace(/\D/g, '');
    if (!ph || ph.length < 7) return;
    setPhoneLoading(true); setPhoneError(''); setPhoneResults(null);
    try {
      const res = await fetch(`${API}/requests.php?phone=${encodeURIComponent(ph)}`);
      const data = await res.json();
      if (!res.ok || data.error) { setPhoneError('No requests found for this phone number.'); return; }
      if (!Array.isArray(data) || data.length === 0) { setPhoneError('No requests found for this phone number.'); return; }
      setPhoneResults(data);
    } catch { setPhoneError('Network error. Please try again.'); }
    finally { setPhoneLoading(false); }
  }

  useEffect(() => {
    const id = params.get('id');
    if (id) { setInputId(id); search(id.replace(/^RJ[-\s]?/i, '')); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentStep = request ? STEPS.findIndex(s => s.key === request.status) : -1;
  const activeStep = currentStep >= 0 ? STEPS[currentStep] : null;

  return (
    <div style={{ minHeight:'100vh', background:'#0F3D1F', fontFamily:'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ padding:'28px 24px 0', maxWidth:600, margin:'0 auto' }}>
        <Link href="/" style={{ color:'rgba(168,197,181,0.6)', fontSize:13, textDecoration:'none', display:'inline-flex', alignItems:'center', gap:6, transition:'color 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.color='rgba(255,255,255,0.55)')}
          onMouseLeave={e => (e.currentTarget.style.color='rgba(168,197,181,0.6)')}>
          ← Home
        </Link>
      </div>

      <div style={{ maxWidth:600, margin:'0 auto', padding:'40px 24px 80px' }}>
        {/* Title */}
        <div style={{ marginBottom:36 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(245,151,19,0.1)', border:'1px solid rgba(245,151,19,0.25)', borderRadius:50, padding:'6px 16px', marginBottom:18 }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:'#C4963C', boxShadow:'0 0 8px #C4963C' }}/>
            <span style={{ color:'#D4A84B', fontSize:11, fontWeight:600, letterSpacing:'0.8px' }}>LIVE TRACKING</span>
          </div>
          <h1 style={{ fontSize:'clamp(30px,5vw,48px)', fontWeight:900, color:'#fff', letterSpacing:'-1.5px', marginBottom:10 }}>
            Where&apos;s your food going?
          </h1>
          <p style={{ color:'rgba(168,197,181,0.65)', fontSize:15 }}>Track your donation in real-time.</p>
        </div>

        {/* Mode toggle */}
        <div style={{ display:'flex', background:'rgba(255,255,255,0.08)', borderRadius:12, padding:4, marginBottom:16, gap:4 }}>
          {([['id','🔍 By Tracking ID'],['phone','📱 By Phone Number']] as const).map(([mode, label]) => (
            <button key={mode} onClick={()=>{setSearchMode(mode);setPhoneResults(null);setPhoneError('');setError('');setRequest(null);}}
              style={{
                flex:1, padding:'9px 16px', borderRadius:9, border:'none', fontSize:13, fontWeight:600,
                cursor:'pointer', transition:'all 0.2s',
                background: searchMode===mode ? '#fff' : 'transparent',
                color: searchMode===mode ? '#0F3D1F' : 'rgba(168,197,181,0.7)',
                boxShadow: searchMode===mode ? '0 2px 8px rgba(0,0,0,0.12)' : 'none',
              }}>
              {label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:20, padding:'24px', marginBottom:28, backdropFilter:'blur(12px)' }}>
          {searchMode === 'id' ? (
            <div style={{ display:'flex', gap:10 }}>
              <input
                value={inputId} onChange={e => setInputId(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && search()}
                placeholder="e.g. RJ-00142"
                style={{
                  flex:1, padding:'13px 18px', border:'1.5px solid rgba(255,255,255,0.15)', borderRadius:12,
                  fontSize:15, fontFamily:'inherit', color:'#fff',
                  background:'rgba(255,255,255,0.07)', outline:'none', transition:'border-color 0.2s',
                }}
                onFocus={e => (e.target.style.borderColor='rgba(245,151,19,0.6)')}
                onBlur={e => (e.target.style.borderColor='rgba(255,255,255,0.15)')}
              />
              <button onClick={() => search()} disabled={loading} className="btn-gold"
                style={{ padding:'13px 24px', fontSize:14, whiteSpace:'nowrap', opacity:loading ? 0.7 : 1 }}>
                {loading ? '…' : 'Track →'}
              </button>
            </div>
          ) : (
            <div style={{ display:'flex', gap:10 }}>
              <input
                value={phoneInput} onChange={e => setPhoneInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchByPhone()}
                placeholder="Your mobile number e.g. 9876543210"
                type="tel"
                style={{
                  flex:1, padding:'13px 18px', border:'1.5px solid rgba(255,255,255,0.15)', borderRadius:12,
                  fontSize:15, fontFamily:'inherit', color:'#fff',
                  background:'rgba(255,255,255,0.07)', outline:'none', transition:'border-color 0.2s',
                }}
                onFocus={e => (e.target.style.borderColor='rgba(245,151,19,0.6)')}
                onBlur={e => (e.target.style.borderColor='rgba(255,255,255,0.15)')}
              />
              <button onClick={searchByPhone} disabled={phoneLoading} className="btn-gold"
                style={{ padding:'13px 24px', fontSize:14, whiteSpace:'nowrap', opacity:phoneLoading ? 0.7 : 1 }}>
                {phoneLoading ? '…' : 'Find →'}
              </button>
            </div>
          )}
          {(error || phoneError) && (
            <div style={{ background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:10, padding:'10px 14px', color:'#fca5a5', fontSize:13, marginTop:14 }}>
              ⚠️ {error || phoneError}
            </div>
          )}
        </div>

        {/* Result card */}
        {request && (
          <div style={{ borderRadius:24, overflow:'hidden', background:'#fff', boxShadow:'0 32px 80px rgba(0,0,0,0.35)' }}>
            {/* Card header */}
            <div style={{
              background: activeStep ? `linear-gradient(135deg, #0F3D1F, #1B5E38)` : '#0F3D1F',
              padding:'28px 28px 32px', position:'relative', overflow:'hidden',
            }}>
              <div style={{ position:'absolute', top:-40, right:-40, width:180, height:180, borderRadius:'50%', background:'rgba(255,255,255,0.03)', pointerEvents:'none' }}/>

              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12, marginBottom:20 }}>
                <div>
                  <div style={{ fontSize:11, fontWeight:600, color:'rgba(168,197,181,0.5)', letterSpacing:'1.5px', marginBottom:4 }}>TRACKING ID</div>
                  <div style={{ fontSize:26, fontWeight:900, color:'#fff', letterSpacing:'-0.5px' }}>
                    RJ-{String(request.id).padStart(5,'0')}
                  </div>
                </div>
                {activeStep && (
                  <div style={{
                    background:`${activeStep.color}25`, border:`1px solid ${activeStep.color}50`,
                    borderRadius:50, padding:'7px 16px',
                    display:'flex', alignItems:'center', gap:7,
                  }}>
                    <span style={{ fontSize:14 }}>{activeStep.icon}</span>
                    <span style={{ color:activeStep.color, fontSize:12, fontWeight:700 }}>{activeStep.label}</span>
                  </div>
                )}
              </div>

              {/* Details grid */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px 24px' }}>
                {[
                  { label:'Food Type', value: request.food_type },
                  request.approx_kg ? { label:'Serves', value: `~${request.approx_kg} people` } : null,
                  { label:'Pickup Location', value: request.pickup_address },
                  request.donor_name ? { label:'Donated By', value: request.donor_name } : null,
                ].filter(Boolean).map((d, i) => d && (
                  <div key={i}>
                    <div style={{ fontSize:10, color:'rgba(168,197,181,0.45)', fontWeight:600, letterSpacing:'1px', marginBottom:3 }}>{d.label.toUpperCase()}</div>
                    <div style={{ fontSize:13, color:'rgba(255,255,255,0.8)', fontWeight:500, lineHeight:1.4 }}>{d.value}</div>
                  </div>
                ))}
              </div>

              {/* Driver info — show when assigned */}
              {request.driver_name && (
                <div style={{ marginTop:16, padding:'12px 16px', background:'rgba(255,255,255,0.07)', borderRadius:12, border:'1px solid rgba(255,255,255,0.1)', display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:38, height:38, borderRadius:'50%', background:'linear-gradient(135deg,#C4963C,#D4A84B)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>🚗</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:11, color:'rgba(168,197,181,0.5)', fontWeight:600, letterSpacing:'1px', marginBottom:2 }}>ASSIGNED DRIVER</div>
                    <div style={{ fontSize:14, fontWeight:700, color:'#fff' }}>{request.driver_name}</div>
                  </div>
                  {request.driver_phone && (
                    <a href={`tel:${request.driver_phone}`} style={{ padding:'6px 14px', borderRadius:8, background:'rgba(196,150,60,0.2)', border:'1px solid rgba(196,150,60,0.35)', color:'#D4A84B', fontSize:12, fontWeight:700, textDecoration:'none', flexShrink:0 }}>
                      Call Driver
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Timeline */}
            <div style={{ padding:'32px 28px 36px' }}>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:'2px', color:'#C4963C', marginBottom:28, textTransform:'uppercase' }}>
                Live Status Timeline
              </div>

              <div style={{ position:'relative' }}>
                {/* Vertical connecting line */}
                <div style={{
                  position:'absolute', left:19, top:20, bottom:20, width:2,
                  background:'#f0ebe5', zIndex:0, borderRadius:2,
                }}/>
                {/* Progress fill */}
                <div style={{
                  position:'absolute', left:19, top:20, width:2,
                  height: currentStep >= 0 ? `${Math.min((currentStep / (STEPS.length - 1)) * 100, 100)}%` : '0%',
                  background:'linear-gradient(to bottom, #0F3D1F, #1B5E38)',
                  zIndex:1, borderRadius:2,
                  transition:'height 0.8s cubic-bezier(0.4,0,0.2,1)',
                }}/>

                <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
                  {STEPS.map((step, i) => {
                    const done   = i < currentStep;
                    const active = i === currentStep;
                    const future = i > currentStep;

                    return (
                      <div key={step.key} style={{
                        display:'flex', gap:16, alignItems:'flex-start',
                        paddingBottom: i < STEPS.length - 1 ? 24 : 0,
                        position:'relative', zIndex:2,
                        opacity: future ? 0.38 : 1,
                        transition:'opacity 0.3s',
                      }}>
                        {/* Dot */}
                        <div style={{
                          width:40, height:40, borderRadius:'50%', flexShrink:0,
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontSize:16,
                          position:'relative',
                          ...(done ? {
                            background:'#0F3D1F',
                          } : active ? {
                            background:`linear-gradient(135deg, ${step.color}, ${step.color}cc)`,
                            boxShadow:`0 0 0 4px ${step.color}20, 0 0 20px ${step.color}30`,
                          } : {
                            background:'#f5f0eb',
                          }),
                        }}>
                          {/* Active pulse ring */}
                          {active && (
                            <div style={{
                              position:'absolute', inset:-6, borderRadius:'50%',
                              border:`2px solid ${step.color}`,
                              animation:'ping-slow 1.8s ease-in-out infinite',
                            }}/>
                          )}
                          {done ? (
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <path d="M3 8L6.5 11.5L13 4.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          ) : (
                            <span style={{ filter: future ? 'grayscale(1)' : 'none' }}>{step.icon}</span>
                          )}
                        </div>

                        {/* Text */}
                        <div style={{ paddingTop:8 }}>
                          <div style={{
                            fontSize:15, fontWeight: active ? 800 : done ? 600 : 500,
                            color: active ? '#0F3D1F' : done ? '#1B5E38' : '#9ca3af',
                            marginBottom: (done || active) ? 3 : 0,
                            lineHeight:1.2,
                          }}>{step.label}</div>
                          {(done || active) && (
                            <div style={{ fontSize:12, color:'#6B8A7A', lineHeight:1.5 }}>{step.desc}</div>
                          )}
                          {active && (
                            <div style={{
                              display:'inline-flex', alignItems:'center', gap:5, marginTop:6,
                              background:`${step.color}12`, border:`1px solid ${step.color}30`,
                              borderRadius:50, padding:'3px 10px',
                            }}>
                              <div style={{ width:5, height:5, borderRadius:'50%', background:step.color, boxShadow:`0 0 6px ${step.color}` }}/>
                              <span style={{ fontSize:11, color:step.color, fontWeight:700 }}>CURRENT STATUS</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pickup photo */}
              {request.pickup_photo && (
                <div style={{ marginTop:24, paddingTop:20, borderTop:'1.5px solid #f0ebe5' }}>
                  <div style={{ fontSize:10, fontWeight:700, letterSpacing:'2px', color:'#06b6d4', marginBottom:10, textTransform:'uppercase' }}>
                    📦 Pickup Photo
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={'https://slipms.com/rajyash-api/' + request.pickup_photo} alt="Pickup confirmation"
                    style={{ width:'100%', borderRadius:12, objectFit:'cover', maxHeight:240, display:'block', border:'2px solid #cffafe' }}
                  />
                </div>
              )}

              {/* Footer action */}
              <div style={{ marginTop:32, paddingTop:24, borderTop:'1.5px solid #f0ebe5', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
                <div style={{ fontSize:12, color:'#9ca3af' }}>
                  Submitted {request.created_at ? new Date(request.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) : ''}
                </div>
                <Link href="/give" style={{
                  fontSize:13, color:'#C4963C', textDecoration:'none', fontWeight:600,
                  display:'inline-flex', alignItems:'center', gap:5,
                }}
                  onMouseEnter={e => (e.currentTarget.style.opacity='0.75')}
                  onMouseLeave={e => (e.currentTarget.style.opacity='1')}>
                  Submit another request →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Phone search results */}
        {phoneResults && (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ fontSize:13, color:'rgba(168,197,181,0.6)', marginBottom:4 }}>
              Found {phoneResults.length} request{phoneResults.length !== 1 ? 's' : ''} for this number
            </div>
            {phoneResults.map(r => {
              const stepIdx = STEPS.findIndex(s => s.key === r.status);
              const step = stepIdx >= 0 ? STEPS[stepIdx] : null;
              return (
                <div key={r.id} style={{ background:'#fff', borderRadius:16, overflow:'hidden', boxShadow:'0 8px 32px rgba(0,0,0,0.2)', cursor:'pointer' }}
                  onClick={() => { setSearchMode('id'); setInputId(`RJ-${String(r.id).padStart(5,'0')}`); search(String(r.id)); }}>
                  <div style={{ background:'linear-gradient(135deg,#0F3D1F,#1B5E38)', padding:'14px 18px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div style={{ fontSize:15, fontWeight:800, color:'#fff', letterSpacing:'-0.3px' }}>
                      RJ-{String(r.id).padStart(5,'0')}
                    </div>
                    {step && (
                      <div style={{ display:'inline-flex', alignItems:'center', gap:5, background:`${step.color}25`, border:`1px solid ${step.color}50`, borderRadius:50, padding:'4px 10px' }}>
                        <span style={{ fontSize:12 }}>{step.icon}</span>
                        <span style={{ color:step.color, fontSize:11, fontWeight:700 }}>{step.label}</span>
                      </div>
                    )}
                  </div>
                  <div style={{ padding:'12px 18px', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
                    <div>
                      <div style={{ fontSize:14, fontWeight:600, color:'#0F3D1F' }}>{r.food_type}</div>
                      <div style={{ fontSize:12, color:'#6B8A7A', marginTop:2 }}>
                        {r.pickup_address} {r.approx_kg ? `· ${r.approx_kg} people` : ''}
                      </div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:12, color:'#9ca3af' }}>
                        {r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : ''}
                      </div>
                      <div style={{ fontSize:11, color:'#C4963C', fontWeight:600, marginTop:2 }}>Tap for details →</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes ping-slow {
          0%   { transform: scale(1); opacity: 0.6; }
          70%  { transform: scale(1.5); opacity: 0; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight:'100vh', background:'#0F3D1F', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ color:'rgba(168,197,181,0.5)', fontSize:14 }}>Loading…</div>
      </div>
    }>
      <TrackContent />
    </Suspense>
  );
}
