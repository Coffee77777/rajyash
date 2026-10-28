'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';

const API = 'https://slipms.com/rajyash-api';

type Trip = {
  id: number;
  status: string;
  created_at: string;
  food_type: string;
  approx_kg: number | null;
  pickup_address: string;
  ready_by: string;
  donor_name: string;
  donor_phone: string;
  donor_address: string;
};

const STEPS = [
  { status: 'assigned',     label: 'Assigned',    icon: '📋' },
  { status: 'ride_started', label: 'Ride Started', icon: '🚗' },
  { status: 'picked_up',    label: 'Picked Up',    icon: '📦' },
  { status: 'delivered',    label: 'Delivered',    icon: '✅' },
];

const NEXT_ACTION: Record<string, { label: string; next: string; color: string }> = {
  assigned:     { label: 'Start Ride',      next: 'ride_started', color: '#f97316' },
  ride_started: { label: 'Mark Picked Up',  next: 'picked_up',    color: '#06b6d4' },
  picked_up:    { label: 'Mark Delivered',  next: 'delivered',    color: '#22c55e' },
};

export default function DriverPage() {
  const [token, setToken] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loginErr, setLoginErr] = useState('');
  const [logging, setLogging] = useState(false);
  const [driverName, setDriverName] = useState('');

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [advancing, setAdvancing] = useState<number | null>(null);

  // Pickup photo modal
  const [pickupModal, setPickupModal] = useState<Trip | null>(null);
  const [pickupPhoto, setPickupPhoto] = useState<File | null>(null);
  const [pickupPreview, setPickupPreview] = useState<string | null>(null);
  const [pickupErr, setPickupErr] = useState('');
  const pickupFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = sessionStorage.getItem('rj_driver_token');
    const n = sessionStorage.getItem('rj_driver_name');
    if (t) { setToken(t); setDriverName(n || ''); }
  }, []);

  const fetchTrips = useCallback(async (tok: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/trips.php`, {
        headers: { Authorization: `Bearer ${tok}` },
      });
      if (res.ok) setTrips(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) fetchTrips(token);
  }, [token, fetchTrips]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginErr('');
    setLogging(true);
    try {
      const res = await fetch(`${API}/auth.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json();
      if (!res.ok) { setLoginErr(data.error || 'Login failed'); return; }
      if (data.user?.role !== 'driver') { setLoginErr('Driver access only'); return; }
      sessionStorage.setItem('rj_driver_token', data.token);
      sessionStorage.setItem('rj_driver_name', data.user.name);
      setToken(data.token);
      setDriverName(data.user.name);
    } finally {
      setLogging(false);
    }
  }

  async function advanceTrip(trip: Trip, photoFile?: File) {
    const action = NEXT_ACTION[trip.status];
    if (!action) return;

    // Intercept picked_up — require photo
    if (action.next === 'picked_up' && !photoFile) {
      setPickupModal(trip);
      setPickupPhoto(null);
      setPickupPreview(null);
      setPickupErr('');
      return;
    }

    setAdvancing(trip.id);
    try {
      let res: Response;
      if (photoFile) {
        const fd = new FormData();
        fd.append('status', action.next);
        fd.append('pickup_photo', photoFile);
        res = await fetch(`${API}/trips.php?id=${trip.id}&status=${action.next}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
      } else {
        res = await fetch(`${API}/trips.php?id=${trip.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ status: action.next }),
        });
      }
      if (res.ok) {
        setPickupModal(null);
        setPickupPhoto(null);
        setPickupPreview(null);
        fetchTrips(token!);
      }
    } finally {
      setAdvancing(null);
    }
  }

  function handlePickupPhoto(file: File | null) {
    if (!file) return;
    setPickupPhoto(file);
    const reader = new FileReader();
    reader.onload = e => setPickupPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function submitPickup() {
    if (!pickupModal) return;
    if (!pickupPhoto) { setPickupErr('Please take or upload a photo of the food before marking as picked up.'); return; }
    setPickupErr('');
    await advanceTrip(pickupModal, pickupPhoto);
  }

  function logout() {
    sessionStorage.removeItem('rj_driver_token');
    sessionStorage.removeItem('rj_driver_name');
    setToken(null);
    setTrips([]);
  }

  // ── LOGIN ─────────────────────────────────────────────────────────
  if (!token) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'Inter, system-ui, sans-serif' }}>

        {/* ── LEFT BRAND PANEL ── */}
        <div style={{
          flex: '0 0 45%', background: 'linear-gradient(160deg, #0F3D1F 0%, #1B5E38 60%, #0F3D1F 100%)',
          display: 'flex', flexDirection: 'column', padding: '52px 48px',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Dot pattern overlay */}
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.06, pointerEvents: 'none',
            backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}/>
          {/* Decorative circle */}
          <div style={{
            position: 'absolute', bottom: -80, right: -80,
            width: 320, height: 320, borderRadius: '50%',
            background: 'rgba(196,150,60,0.08)', pointerEvents: 'none',
          }}/>

          {/* Logo */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <Image
              src="/rajyash-logo.png" alt="Rajyash Foundation" width={160} height={60}
              style={{ objectFit: 'contain', objectPosition: 'left', filter: 'brightness(0) invert(1)' }}
            />
          </div>

          {/* Center content */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2px', color: 'rgba(196,150,60,0.9)', textTransform: 'uppercase', marginBottom: 16 }}>
              DRIVER PORTAL
            </div>
            <h2 style={{ fontSize: 'clamp(26px,3vw,36px)', fontWeight: 900, color: '#fff', lineHeight: 1.15, letterSpacing: '-1px', marginBottom: 16 }}>
              Your trips,<br />ready to roll.
            </h2>
            <p style={{ color: 'rgba(168,197,181,0.75)', fontSize: 15, lineHeight: 1.7, maxWidth: 280, marginBottom: 40 }}>
              See your assigned pickups, update trip status in one tap, and help meals reach the right hands.
            </p>

            {/* Feature list */}
            {[
              { icon: '📋', label: 'View Assigned Trips' },
              { icon: '🚗', label: 'Start & Track Rides' },
              { icon: '📦', label: 'Confirm Deliveries' },
            ].map(f => (
              <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0,
                }}>{f.icon}</div>
                <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: 500 }}>{f.label}</span>
              </div>
            ))}
          </div>

          {/* Bottom tagline */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ width: 40, height: 2, background: 'linear-gradient(90deg,#C4963C,#D4A84B)', borderRadius: 2, marginBottom: 12 }}/>
            <p style={{ color: 'rgba(168,197,181,0.45)', fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              WE RISE BY LIFTING OTHERS
            </p>
          </div>
        </div>

        {/* ── RIGHT FORM PANEL ── */}
        <div style={{
          flex: 1, background: '#FDFBF7', display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '48px 40px', position: 'relative',
        }}>
          {/* Accent bar */}
          <div style={{
            position: 'absolute', left: 0, top: '15%', bottom: '15%', width: 4,
            background: 'linear-gradient(to bottom, #C4963C, #f97316)',
            borderRadius: '0 4px 4px 0',
          }}/>

          <div style={{ width: '100%', maxWidth: 380 }}>
            <div style={{ marginBottom: 36 }}>
              <h1 style={{ fontSize: 30, fontWeight: 900, color: '#0F3D1F', letterSpacing: '-0.8px', marginBottom: 6 }}>
                Welcome back
              </h1>
              <p style={{ color: '#6B8A7A', fontSize: 14 }}>Sign in to your driver dashboard</p>
            </div>

            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#1B5E38', letterSpacing: '0.5px', marginBottom: 7, textTransform: 'uppercase' }}>
                  Phone Number
                </label>
                <input
                  type="tel" required value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  style={{
                    width: '100%', padding: '13px 16px', boxSizing: 'border-box',
                    border: '1.5px solid #DDE8D8', borderRadius: 12,
                    fontSize: 15, fontFamily: 'inherit', color: '#0F3D1F',
                    background: '#fff', outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#1B5E38'; e.target.style.boxShadow = '0 0 0 3px rgba(27,94,56,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = '#DDE8D8'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              <div style={{ marginBottom: 28 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#1B5E38', letterSpacing: '0.5px', marginBottom: 7, textTransform: 'uppercase' }}>
                  Password
                </label>
                <input
                  type="password" required value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: '100%', padding: '13px 16px', boxSizing: 'border-box',
                    border: '1.5px solid #DDE8D8', borderRadius: 12,
                    fontSize: 15, fontFamily: 'inherit', color: '#0F3D1F',
                    background: '#fff', outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#1B5E38'; e.target.style.boxShadow = '0 0 0 3px rgba(27,94,56,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = '#DDE8D8'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              {loginErr && (
                <div style={{
                  background: '#fef2f2', border: '1px solid #fca5a5',
                  borderRadius: 10, padding: '10px 14px', color: '#dc2626',
                  fontSize: 13, fontWeight: 600, marginBottom: 20,
                }}>
                  ⚠️ {loginErr}
                </div>
              )}

              <button type="submit" disabled={logging} style={{
                width: '100%', padding: '15px', border: 'none', borderRadius: 12,
                background: logging ? '#9ca3af' : 'linear-gradient(135deg, #f97316, #fb923c)',
                color: '#fff', fontSize: 15, fontWeight: 800, letterSpacing: '0.3px',
                cursor: logging ? 'not-allowed' : 'pointer',
                boxShadow: logging ? 'none' : '0 4px 20px rgba(249,115,22,0.35)',
                transition: 'all 0.2s',
              }}>
                {logging ? 'Signing in…' : 'Sign In to Driver Portal →'}
              </button>
            </form>

            <p style={{ textAlign: 'center', fontSize: 12, color: '#A8B5AD', marginTop: 24 }}>
              Driver access only · Contact admin for credentials
            </p>
          </div>
        </div>

        <style>{`
          @media (max-width: 640px) {
            .driver-login-left { display: none !important; }
          }
        `}</style>
      </div>
    );
  }

  // ── DRIVER DASHBOARD ──────────────────────────────────────────────
  const activeTrips   = trips.filter(t => t.status !== 'delivered' && t.status !== 'cancelled');
  const completedTrips = trips.filter(t => t.status === 'delivered' || t.status === 'cancelled');

  const TRIP_STATUS_COLOR: Record<string, { bg: string; text: string; dot: string }> = {
    assigned:     { bg:'#fef9ec', text:'#92400e', dot:'#f59e0b' },
    ride_started: { bg:'#fff7ed', text:'#9a3412', dot:'#f97316' },
    picked_up:    { bg:'#ecfeff', text:'#155e75', dot:'#06b6d4' },
    delivered:    { bg:'#f0fdf4', text:'#166534', dot:'#22c55e' },
    cancelled:    { bg:'#f9fafb', text:'#4b5563', dot:'#9ca3af' },
  };
  const TRIP_STATUS_LABEL: Record<string, string> = {
    assigned:'Assigned', ride_started:'On the Way', picked_up:'Picked Up',
    delivered:'Delivered', cancelled:'Cancelled',
  };

  return (
    <div style={{ minHeight:'100vh', background:'#f1f5f9', fontFamily:'Inter,system-ui,sans-serif' }}>

      {/* ── HEADER ── */}
      <div style={{
        background:'#fff', borderBottom:'1px solid #e2e8f0',
        padding:'0 24px', height:64,
        display:'flex', alignItems:'center', justifyContent:'space-between',
        position:'sticky', top:0, zIndex:100,
        boxShadow:'0 1px 3px rgba(0,0,0,0.06)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <Image src="/rajyash-logo.png" alt="Rajyash Foundation" width={120} height={40} style={{ objectFit:'contain' }} priority />
          <div style={{ width:1, height:28, background:'#e2e8f0' }}/>
          <div>
            <div style={{ fontWeight:700, color:'#0f172a', fontSize:14, lineHeight:1.1 }}>{driverName || 'Driver'}</div>
            <div style={{ fontSize:11, color:'#94a3b8' }}>Driver Portal</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={()=>fetchTrips(token!)} style={{
            padding:'7px 14px', borderRadius:8, border:'1.5px solid #e2e8f0',
            background:'#fff', color:'#64748b', cursor:'pointer', fontSize:13, fontWeight:500,
          }}>↻</button>
          <button onClick={logout} style={{
            padding:'7px 14px', borderRadius:8, border:'1.5px solid #e2e8f0',
            background:'#fff', color:'#64748b', cursor:'pointer', fontSize:13, fontWeight:500,
          }}>Sign Out</button>
        </div>
      </div>

      <div style={{ maxWidth:640, margin:'0 auto', padding:'24px 16px 80px' }}>
        {loading ? (
          <div style={{ textAlign:'center', padding:'80px 0', color:'#94a3b8' }}>
            <div style={{ fontSize:32, marginBottom:12 }}>⏳</div>
            <div style={{ fontSize:14 }}>Loading trips…</div>
          </div>
        ) : trips.length === 0 ? (
          <div style={{ textAlign:'center', padding:'64px 24px', background:'#fff', borderRadius:20, border:'1px solid #f1f5f9', boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize:48, marginBottom:16 }}>🌿</div>
            <div style={{ fontSize:18, fontWeight:700, color:'#0f172a', marginBottom:8 }}>No trips yet</div>
            <div style={{ fontSize:14, color:'#94a3b8' }}>Admin will assign a pickup to you shortly</div>
          </div>
        ) : (
          <>
            {/* ── ACTIVE TRIPS ── */}
            {activeTrips.length > 0 && (
              <div style={{ marginBottom:28 }}>
                <div style={{ fontSize:11, fontWeight:700, letterSpacing:'1.5px', color:'#C4963C', textTransform:'uppercase', marginBottom:14 }}>
                  Active · {activeTrips.length}
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                  {activeTrips.map(trip => {
                    const action   = NEXT_ACTION[trip.status];
                    const stepIdx  = STEPS.findIndex(s => s.status === trip.status);
                    const sc       = TRIP_STATUS_COLOR[trip.status] || TRIP_STATUS_COLOR.assigned;
                    return (
                      <div key={trip.id} style={{
                        background:'#fff', borderRadius:20,
                        boxShadow:'0 2px 12px rgba(0,0,0,0.07)',
                        border:'1px solid #f1f5f9',
                        overflow:'hidden',
                      }}>
                        {/* Green accent top bar */}
                        <div style={{ height:4, background:'linear-gradient(90deg,#0F3D1F,#1B5E38,#C4963C)' }}/>

                        <div style={{ padding:'20px 22px 22px' }}>
                          {/* Header row */}
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
                            <div>
                              <div style={{ fontSize:18, fontWeight:800, color:'#0f172a', letterSpacing:'-0.3px' }}>{trip.food_type}</div>
                              {trip.approx_kg ? <div style={{ fontSize:13, color:'#64748b', marginTop:2 }}>~{trip.approx_kg} people</div> : null}
                            </div>
                            <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6 }}>
                              <div style={{ fontSize:12, fontWeight:700, color:'#C4963C', background:'#fef9ec', border:'1px solid #fde68a', borderRadius:20, padding:'3px 10px' }}>
                                RJ-{String(trip.id).padStart(5,'0')}
                              </div>
                              <div style={{ display:'inline-flex', alignItems:'center', gap:5, background:sc.bg, borderRadius:20, padding:'3px 10px' }}>
                                <div style={{ width:6, height:6, borderRadius:'50%', background:sc.dot, boxShadow:`0 0 5px ${sc.dot}` }}/>
                                <span style={{ fontSize:11, fontWeight:700, color:sc.text }}>{TRIP_STATUS_LABEL[trip.status]||trip.status}</span>
                              </div>
                            </div>
                          </div>

                          {/* Progress steps */}
                          <div style={{ display:'flex', gap:6, marginBottom:20 }}>
                            {STEPS.map((step, i) => {
                              const done = i < stepIdx, active = i === stepIdx;
                              return (
                                <div key={step.status} style={{ flex:1, textAlign:'center' }}>
                                  <div style={{ height:5, borderRadius:3, background: done||active ? (done?'#1B5E38':'#C4963C') : '#e2e8f0', transition:'background 0.3s' }}/>
                                  <div style={{ fontSize:9, fontWeight:600, color: done||active ? (done?'#1B5E38':'#C4963C') : '#cbd5e1', marginTop:4, textTransform:'uppercase', letterSpacing:'0.3px' }}>
                                    {step.label}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Details grid */}
                          <div style={{ background:'#f8fafc', borderRadius:14, padding:'14px 16px', marginBottom:16, display:'flex', flexDirection:'column', gap:10 }}>
                            <DetailRow icon="👤" label="Donor" value={trip.donor_name} badge={trip.donor_phone} />
                            <DetailRow icon="📍" label="Pickup" value={trip.pickup_address} />
                            {trip.donor_address && <DetailRow icon="🏠" label="Address" value={trip.donor_address} />}
                            <DetailRow icon="🕐" label="Ready by" value={new Date(trip.ready_by).toLocaleString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})} />
                          </div>

                          {/* Actions */}
                          <div style={{ display:'flex', gap:10 }}>
                            <a href={`tel:${trip.donor_phone}`} style={{
                              flex:1, padding:'13px', borderRadius:12, textDecoration:'none',
                              background:'#f8fafc', border:'1.5px solid #e2e8f0',
                              color:'#334155', fontSize:14, fontWeight:600,
                              display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                            }}>📞 Call</a>
                            {action && (
                              <button onClick={()=>advanceTrip(trip)} disabled={advancing===trip.id} style={{
                                flex:2, padding:'13px', borderRadius:12, border:'none',
                                background: advancing===trip.id ? '#e2e8f0' : `linear-gradient(135deg,${action.color},${action.color}dd)`,
                                color: advancing===trip.id ? '#94a3b8' : '#fff',
                                fontWeight:800, fontSize:14, cursor: advancing===trip.id ? 'not-allowed' : 'pointer',
                                boxShadow: advancing===trip.id ? 'none' : `0 4px 16px ${action.color}40`,
                                transition:'all 0.2s',
                              }}>{advancing===trip.id ? '…' : action.label}</button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── COMPLETED TRIPS ── */}
            {completedTrips.length > 0 && (
              <div>
                <div style={{ fontSize:11, fontWeight:700, letterSpacing:'1.5px', color:'#94a3b8', textTransform:'uppercase', marginBottom:14 }}>
                  Completed · {completedTrips.length}
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {completedTrips.map(trip => {
                    const sc = TRIP_STATUS_COLOR[trip.status] || TRIP_STATUS_COLOR.delivered;
                    return (
                      <div key={trip.id} style={{
                        background:'#fff', borderRadius:16,
                        border:'1px solid #f1f5f9', borderLeft:'4px solid #22c55e',
                        padding:'18px 20px',
                        boxShadow:'0 1px 4px rgba(0,0,0,0.04)',
                      }}>
                        {/* Top */}
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                          <div>
                            <div style={{ fontSize:16, fontWeight:700, color:'#0f172a' }}>{trip.food_type}</div>
                            {trip.approx_kg ? <div style={{ fontSize:12, color:'#94a3b8', marginTop:1 }}>~{trip.approx_kg} people</div> : null}
                          </div>
                          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:5 }}>
                            <span style={{ fontSize:11, fontWeight:700, color:'#C4963C', background:'#fef9ec', border:'1px solid #fde68a', borderRadius:20, padding:'2px 9px' }}>
                              RJ-{String(trip.id).padStart(5,'0')}
                            </span>
                            <div style={{ display:'inline-flex', alignItems:'center', gap:4, background:sc.bg, borderRadius:20, padding:'2px 9px' }}>
                              <div style={{ width:5, height:5, borderRadius:'50%', background:sc.dot }}/>
                              <span style={{ fontSize:10, fontWeight:700, color:sc.text }}>{TRIP_STATUS_LABEL[trip.status]||trip.status}</span>
                            </div>
                          </div>
                        </div>
                        {/* Details */}
                        <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                          <DetailRow icon="👤" label="Donor" value={trip.donor_name} badge={trip.donor_phone} muted />
                          <DetailRow icon="📍" label="Pickup" value={trip.pickup_address} muted />
                          {trip.donor_address && <DetailRow icon="🏠" label="Address" value={trip.donor_address} muted />}
                          <DetailRow icon="🕐" label="Ready by" value={new Date(trip.ready_by).toLocaleString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})} muted />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── PICKUP PHOTO MODAL ── */}
      {pickupModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200,
          padding: '0',
        }} onClick={() => { setPickupModal(null); }}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#1a1f2e', borderRadius: '24px 24px 0 0', padding: '28px 24px 40px',
              width: '100%', maxWidth: 520,
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
            {/* Handle bar */}
            <div style={{ width: 40, height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 2, margin: '0 auto 24px' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>📦</div>
              <div>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: 17 }}>Confirm Food Pickup</div>
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, marginTop: 2 }}>{pickupModal.food_type} · {pickupModal.donor_name}</div>
              </div>
            </div>

            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
              Take a clear photo of the food you&apos;re collecting. This confirms pickup and is visible to the admin.
            </div>

            {/* Hidden file input */}
            <input
              ref={pickupFileRef} type="file" accept="image/*" capture="environment"
              style={{ display: 'none' }}
              onChange={e => handlePickupPhoto(e.target.files?.[0] ?? null)}
            />

            {/* Photo area */}
            {!pickupPreview ? (
              <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                <button
                  onClick={() => pickupFileRef.current?.click()}
                  style={{
                    flex: 1, padding: '16px 12px', borderRadius: 14, border: '2px dashed rgba(6,182,212,0.4)',
                    background: 'rgba(6,182,212,0.06)', color: '#06b6d4',
                    fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  }}>
                  <span style={{ fontSize: 28 }}>📸</span>
                  Take Photo
                </button>
                <button
                  onClick={() => { if (pickupFileRef.current) { pickupFileRef.current.removeAttribute('capture'); pickupFileRef.current.click(); } }}
                  style={{
                    flex: 1, padding: '16px 12px', borderRadius: 14, border: '2px dashed rgba(255,255,255,0.12)',
                    background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.5)',
                    fontSize: 14, fontWeight: 600, cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  }}>
                  <span style={{ fontSize: 28 }}>🖼️</span>
                  Choose File
                </button>
              </div>
            ) : (
              <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', marginBottom: 20, border: '2px solid rgba(6,182,212,0.4)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={pickupPreview} alt="Pickup" style={{ width: '100%', maxHeight: 240, objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 6 }}>
                  <button onClick={() => { setPickupPhoto(null); setPickupPreview(null); }} style={{
                    background: 'rgba(0,0,0,0.65)', border: 'none', color: '#fff', borderRadius: 8,
                    padding: '5px 10px', fontSize: 12, cursor: 'pointer', fontWeight: 600,
                  }}>Retake</button>
                </div>
                <div style={{ background: 'rgba(6,182,212,0.15)', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: '#06b6d4', fontSize: 14 }}>✓</span>
                  <span style={{ color: '#06b6d4', fontSize: 12, fontWeight: 600 }}>Photo ready</span>
                </div>
              </div>
            )}

            {pickupErr && (
              <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', color: '#fca5a5', fontSize: 13, marginBottom: 16 }}>
                ⚠️ {pickupErr}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setPickupModal(null)} style={{
                flex: 1, padding: '14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}>Cancel</button>
              <button
                onClick={submitPickup}
                disabled={advancing === pickupModal.id}
                style={{
                  flex: 2, padding: '14px', borderRadius: 12, border: 'none',
                  background: pickupPhoto ? 'linear-gradient(135deg,#06b6d4,#0891b2)' : 'rgba(255,255,255,0.08)',
                  color: pickupPhoto ? '#fff' : 'rgba(255,255,255,0.3)',
                  fontSize: 14, fontWeight: 800, cursor: pickupPhoto ? 'pointer' : 'not-allowed',
                  boxShadow: pickupPhoto ? '0 4px 20px rgba(6,182,212,0.35)' : 'none',
                  transition: 'all 0.2s',
                }}>
                {advancing === pickupModal.id ? 'Confirming…' : '📦 Confirm Pickup'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function DetailRow({ icon, label, value, badge, muted }: {
  icon: string; label: string; value: string; badge?: string; muted?: boolean;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
      <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: muted ? '#b0bec5' : '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 1 }}>{label}</div>
        <div style={{ fontSize: 13, color: muted ? '#64748b' : '#1e293b', fontWeight: 500, wordBreak: 'break-word' }}>{value}</div>
      </div>
      {badge && (
        <a href={`tel:${badge}`} style={{
          flexShrink: 0, fontSize: 11, fontWeight: 700,
          color: muted ? '#64748b' : '#1B5E38',
          background: muted ? '#f1f5f9' : '#f0fdf4',
          border: `1px solid ${muted ? '#e2e8f0' : '#bbf7d0'}`,
          borderRadius: 20, padding: '2px 8px',
          textDecoration: 'none',
        }}>{badge}</a>
      )}
    </div>
  );
}
