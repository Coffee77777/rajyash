'use client';

import { useState, useEffect, useCallback } from 'react';
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

  async function advanceTrip(trip: Trip) {
    const action = NEXT_ACTION[trip.status];
    if (!action) return;
    setAdvancing(trip.id);
    try {
      const res = await fetch(`${API}/trips.php?id=${trip.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: action.next }),
      });
      if (res.ok) fetchTrips(token!);
    } finally {
      setAdvancing(null);
    }
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
  const activeTrips = trips.filter(t => t.status !== 'delivered');
  const completedTrips = trips.filter(t => t.status === 'delivered');

  return (
    <div style={{
      minHeight: '100vh', background: '#0f1117',
      fontFamily: 'Inter, system-ui, sans-serif', color: '#e5e7eb',
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(10,46,30,0.95)', borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: '64px', position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(20px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Image src="/rajyash-logo.png" alt="Rajyash Foundation" width={110} height={38}
            style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)', opacity: 0.92 }} />
          <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.12)' }} />
          <div>
            <span style={{ fontWeight: 700, color: '#fff', fontSize: '15px' }}>
              {driverName || 'Driver'}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', display: 'block', lineHeight: 1.2 }}>Driver Portal</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={() => fetchTrips(token!)} style={{
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
            color: '#9ca3af', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px',
          }}>↻</button>
          <button onClick={logout} style={{
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
            color: '#9ca3af', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px',
          }}>Sign Out</button>
        </div>
      </div>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '28px 20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px', color: 'rgba(255,255,255,0.3)' }}>Loading trips…</div>
        ) : activeTrips.length === 0 && completedTrips.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 24px',
            background: 'rgba(255,255,255,0.02)', borderRadius: '20px',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌿</div>
            <div style={{ color: '#fff', fontSize: '18px', fontWeight: 600 }}>No trips assigned yet</div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '14px', marginTop: '8px' }}>
              Check back soon — the admin will assign a pickup to you
            </div>
          </div>
        ) : (
          <>
            {/* Active trips */}
            {activeTrips.length > 0 && (
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ color: '#fff', fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>
                  Active Trips <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>({activeTrips.length})</span>
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {activeTrips.map(trip => {
                    const action = NEXT_ACTION[trip.status];
                    const stepIdx = STEPS.findIndex(s => s.status === trip.status);
                    return (
                      <div key={trip.id} style={{
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
                        borderRadius: '18px', padding: '24px', overflow: 'hidden',
                      }}>
                        {/* Progress bar */}
                        <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
                          {STEPS.map((step, i) => (
                            <div key={step.status} style={{ flex: 1 }}>
                              <div style={{
                                height: '4px', borderRadius: '2px',
                                background: i <= stepIdx ? '#22c55e' : 'rgba(255,255,255,0.1)',
                                transition: 'background 0.3s',
                              }} />
                              <div style={{
                                fontSize: '10px', color: i <= stepIdx ? '#22c55e' : 'rgba(255,255,255,0.25)',
                                marginTop: '5px', textAlign: 'center',
                              }}>{step.label}</div>
                            </div>
                          ))}
                        </div>

                        {/* Trip info */}
                        <div style={{ marginBottom: '20px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                            <span style={{ color: '#fff', fontWeight: 700, fontSize: '16px' }}>
                              {trip.food_type}
                              {trip.approx_kg ? <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 400, fontSize: '14px' }}> · ~{trip.approx_kg} kg</span> : null}
                            </span>
                            <span style={{ color: '#f59e0b', fontSize: '12px', fontWeight: 600, background: 'rgba(245,158,11,0.1)', padding: '3px 10px', borderRadius: '12px', border: '1px solid rgba(245,158,11,0.25)' }}>
                              #{String(trip.id).padStart(4, '0')}
                            </span>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <InfoRow icon="👤" label={trip.donor_name} sub={trip.donor_phone} />
                            <InfoRow icon="📍" label={trip.pickup_address} />
                            <InfoRow icon="🏠" label={trip.donor_address} />
                            <InfoRow icon="🕐" label={`Ready by: ${new Date(trip.ready_by).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`} />
                          </div>
                        </div>

                        {/* Call button + action */}
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <a
                            href={`tel:${trip.donor_phone}`}
                            style={{
                              flex: 1, padding: '13px', borderRadius: '10px', textDecoration: 'none',
                              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                              color: '#9ca3af', fontSize: '14px', fontWeight: 500,
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                            }}
                          >📞 Call Donor</a>
                          {action && (
                            <button
                              onClick={() => advanceTrip(trip)}
                              disabled={advancing === trip.id}
                              style={{
                                flex: 2, padding: '13px', borderRadius: '10px', border: 'none',
                                background: `linear-gradient(135deg, ${action.color}, ${action.color}cc)`,
                                color: '#fff', fontWeight: 700, fontSize: '14px',
                                cursor: 'pointer', opacity: advancing === trip.id ? 0.7 : 1,
                              }}
                            >{advancing === trip.id ? '…' : action.label}</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Completed trips */}
            {completedTrips.length > 0 && (
              <div>
                <h2 style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px', fontWeight: 600, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Completed ({completedTrips.length})
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {completedTrips.slice(0, 5).map(trip => (
                    <div key={trip.id} style={{
                      background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.12)',
                      borderRadius: '12px', padding: '16px 20px',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <div>
                        <div style={{ color: '#d1fae5', fontWeight: 600, fontSize: '14px' }}>{trip.food_type}</div>
                        <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', marginTop: '2px' }}>{trip.donor_name} · {trip.pickup_address}</div>
                      </div>
                      <div style={{
                        color: '#22c55e', fontSize: '11px', fontWeight: 600,
                        background: 'rgba(34,197,94,0.1)', padding: '4px 10px',
                        borderRadius: '12px', border: '1px solid rgba(34,197,94,0.2)',
                      }}>Delivered</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function InfoRow({ icon, label, sub }: { icon: string; label: string; sub?: string }) {
  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
      <span style={{ fontSize: '14px', flexShrink: 0, marginTop: '1px' }}>{icon}</span>
      <div>
        <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '13px', lineHeight: '1.4' }}>{label}</div>
        {sub && <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>{sub}</div>}
      </div>
    </div>
  );
}
