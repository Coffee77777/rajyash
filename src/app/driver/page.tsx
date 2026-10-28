'use client';

import { useState, useEffect, useCallback } from 'react';

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
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a2e1e 0%, #1a4731 50%, #0d3d24 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px', fontFamily: 'Inter, system-ui, sans-serif',
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '20px', padding: '48px 40px', width: '100%', maxWidth: '420px',
          backdropFilter: 'blur(20px)',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '16px',
              background: 'linear-gradient(135deg, #f97316, #fb923c)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', fontSize: '26px',
            }}>🚗</div>
            <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: 700, margin: 0 }}>Driver Portal</h1>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px', marginTop: '6px' }}>Rajyash Foundation</p>
          </div>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Phone Number</label>
              <input
                type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="10-digit mobile number"
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: '10px', boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                  color: '#fff', fontSize: '15px', outline: 'none',
                }}
              />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: '10px', boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                  color: '#fff', fontSize: '15px', outline: 'none',
                }}
              />
            </div>

            {loginErr && (
              <div style={{
                background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '8px', padding: '10px 14px', color: '#fca5a5',
                fontSize: '14px', marginBottom: '16px',
              }}>{loginErr}</div>
            )}

            <button type="submit" disabled={logging} style={{
              width: '100%', padding: '14px', borderRadius: '10px', border: 'none',
              background: 'linear-gradient(135deg, #f97316, #fb923c)',
              color: '#fff', fontWeight: 700, fontSize: '15px', cursor: 'pointer',
              opacity: logging ? 0.7 : 1,
            }}>{logging ? 'Signing in…' : 'Sign In'}</button>
          </form>
        </div>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '20px' }}>🚗</span>
          <div>
            <span style={{ fontWeight: 700, color: '#fff', fontSize: '15px' }}>
              {driverName || 'Driver'}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', display: 'block', lineHeight: 1.2 }}>Rajyash Driver</span>
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
