'use client';

import { useState, useEffect, useCallback } from 'react';

const API = 'https://slipms.com/rajyash-api';

type Request = {
  id: number;
  donor_name: string;
  donor_phone: string;
  pickup_address: string;
  food_type: string;
  approx_kg: number | null;
  ready_by: string;
  status: string;
  created_at: string;
  requester_name: string;
};

type Driver = {
  id: number;
  name: string;
  phone: string;
  vehicle_type: string;
  vehicle_number: string;
};

const STATUS_LABELS: Record<string, string> = {
  requested: 'Requested',
  under_review: 'Under Review',
  assigned: 'Assigned',
  accepted: 'Accepted',
  declined: 'Declined',
  ride_started: 'Ride Started',
  picked_up: 'Picked Up',
  delivered: 'Delivered',
  closed: 'Closed',
  cancelled: 'Cancelled',
};

const STATUS_COLOR: Record<string, string> = {
  requested: '#f59e0b',
  under_review: '#3b82f6',
  assigned: '#8b5cf6',
  accepted: '#6366f1',
  declined: '#ef4444',
  ride_started: '#f97316',
  picked_up: '#06b6d4',
  delivered: '#22c55e',
  closed: '#6b7280',
  cancelled: '#9ca3af',
};

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loginErr, setLoginErr] = useState('');
  const [logging, setLogging] = useState(false);

  const [requests, setRequests] = useState<Request[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const [assignModal, setAssignModal] = useState<Request | null>(null);
  const [assignDriverId, setAssignDriverId] = useState('');
  const [assigning, setAssigning] = useState(false);

  const [detailModal, setDetailModal] = useState<Request | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Persist login across page reload
  useEffect(() => {
    const t = sessionStorage.getItem('rj_admin_token');
    if (t) setToken(t);
  }, []);

  const fetchAll = useCallback(async (tok: string, status: string) => {
    setLoading(true);
    try {
      const url = `${API}/requests.php${status ? `?status=${status}` : ''}`;
      const [rRes, dRes] = await Promise.all([
        fetch(url, { headers: { Authorization: `Bearer ${tok}` } }),
        fetch(`${API}/drivers.php`, { headers: { Authorization: `Bearer ${tok}` } }),
      ]);
      if (rRes.ok) setRequests(await rRes.json());
      if (dRes.ok) setDrivers(await dRes.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) fetchAll(token, filterStatus);
  }, [token, filterStatus, fetchAll]);

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
      if (data.user?.role !== 'admin') { setLoginErr('Admin access only'); return; }
      sessionStorage.setItem('rj_admin_token', data.token);
      setToken(data.token);
    } finally {
      setLogging(false);
    }
  }

  async function handleAssign() {
    if (!assignModal || !assignDriverId) return;
    setAssigning(true);
    try {
      const res = await fetch(`${API}/requests.php?id=${assignModal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ driver_id: parseInt(assignDriverId) }),
      });
      if (res.ok) {
        setAssignModal(null);
        setAssignDriverId('');
        fetchAll(token!, filterStatus);
      }
    } finally {
      setAssigning(false);
    }
  }

  async function handleStatusUpdate() {
    if (!detailModal || !newStatus) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`${API}/requests.php?id=${detailModal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setDetailModal(null);
        setNewStatus('');
        fetchAll(token!, filterStatus);
      }
    } finally {
      setUpdatingStatus(false);
    }
  }

  function logout() {
    sessionStorage.removeItem('rj_admin_token');
    setToken(null);
  }

  // ── LOGIN SCREEN ──────────────────────────────────────────────────
  if (!token) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a2e1e 0%, #1a4731 50%, #0d3d24 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '20px',
          padding: '48px 40px',
          width: '100%',
          maxWidth: '420px',
          backdropFilter: 'blur(20px)',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '16px',
              background: 'linear-gradient(135deg, #e8a020, #f0c060)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', fontSize: '26px',
            }}>🛡️</div>
            <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: 700, margin: 0 }}>Admin Portal</h1>
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

            <button
              type="submit" disabled={logging}
              style={{
                width: '100%', padding: '14px', borderRadius: '10px', border: 'none',
                background: 'linear-gradient(135deg, #e8a020, #f0c060)',
                color: '#1a0a00', fontWeight: 700, fontSize: '15px', cursor: 'pointer',
                opacity: logging ? 0.7 : 1,
              }}
            >{logging ? 'Signing in…' : 'Sign In'}</button>
          </form>
        </div>
      </div>
    );
  }

  // ── DASHBOARD ─────────────────────────────────────────────────────
  const filters = ['', 'requested', 'under_review', 'assigned', 'ride_started', 'delivered', 'cancelled'];

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f1117',
      fontFamily: 'Inter, system-ui, sans-serif',
      color: '#e5e7eb',
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(10,46,30,0.95)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '0 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: '64px',
        position: 'sticky', top: 0, zIndex: 100,
        backdropFilter: 'blur(20px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '20px' }}>🛡️</span>
          <span style={{ fontWeight: 700, color: '#fff', fontSize: '16px' }}>Rajyash Admin</span>
        </div>
        <button onClick={logout} style={{
          background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
          color: '#9ca3af', padding: '6px 16px', borderRadius: '8px', cursor: 'pointer',
          fontSize: '13px',
        }}>Sign Out</button>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          {[
            { label: 'Total', count: requests.length, color: '#6366f1' },
            { label: 'Pending', count: requests.filter(r => r.status === 'requested').length, color: '#f59e0b' },
            { label: 'Assigned', count: requests.filter(r => r.status === 'assigned').length, color: '#8b5cf6' },
            { label: 'Delivered', count: requests.filter(r => r.status === 'delivered').length, color: '#22c55e' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '14px', padding: '20px',
            }}>
              <div style={{ fontSize: '28px', fontWeight: 800, color: s.color }}>{s.count}</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px', alignItems: 'center' }}>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginRight: '4px' }}>Filter:</span>
          {filters.map(f => (
            <button
              key={f || 'all'}
              onClick={() => setFilterStatus(f)}
              style={{
                padding: '6px 14px', borderRadius: '20px', border: '1px solid',
                borderColor: filterStatus === f ? '#e8a020' : 'rgba(255,255,255,0.12)',
                background: filterStatus === f ? 'rgba(232,160,32,0.15)' : 'transparent',
                color: filterStatus === f ? '#f0c060' : 'rgba(255,255,255,0.5)',
                fontSize: '12px', cursor: 'pointer', fontWeight: 500,
              }}
            >{f ? STATUS_LABELS[f] : 'All'}</button>
          ))}
          <button onClick={() => fetchAll(token!, filterStatus)} style={{
            marginLeft: 'auto', padding: '6px 16px', borderRadius: '8px',
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#9ca3af', fontSize: '13px', cursor: 'pointer',
          }}>↻ Refresh</button>
        </div>

        {/* Requests table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px', color: 'rgba(255,255,255,0.3)' }}>Loading…</div>
        ) : requests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px', color: 'rgba(255,255,255,0.3)' }}>No requests found</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {requests.map(req => (
              <div key={req.id} style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '14px', padding: '20px 24px',
                display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap',
              }}>
                {/* ID + status */}
                <div style={{ minWidth: '100px' }}>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: '15px' }}>
                    RJ{String(req.id).padStart(5, '0')}
                  </div>
                  <div style={{
                    marginTop: '6px', display: 'inline-block',
                    padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                    background: `${STATUS_COLOR[req.status]}20`,
                    color: STATUS_COLOR[req.status] || '#9ca3af',
                    border: `1px solid ${STATUS_COLOR[req.status]}40`,
                  }}>{STATUS_LABELS[req.status] || req.status}</div>
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ fontWeight: 600, color: '#e5e7eb', fontSize: '14px' }}>{req.donor_name}</div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginTop: '2px' }}>
                    {req.food_type}{req.approx_kg ? ` · ~${req.approx_kg} kg` : ''}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', marginTop: '2px' }}>
                    📍 {req.pickup_address}
                  </div>
                </div>

                {/* Time */}
                <div style={{ minWidth: '120px', textAlign: 'right' }}>
                  <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px' }}>
                    {new Date(req.ready_by).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px', marginTop: '3px' }}>
                    {new Date(req.created_at).toLocaleDateString('en-IN')}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => { setDetailModal(req); setNewStatus(req.status); }} style={{
                    padding: '7px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(255,255,255,0.05)', color: '#9ca3af',
                    fontSize: '12px', cursor: 'pointer',
                  }}>Status</button>
                  {['requested','under_review','assigned'].includes(req.status) && (
                    <button onClick={() => { setAssignModal(req); setAssignDriverId(''); }} style={{
                      padding: '7px 14px', borderRadius: '8px', border: '1px solid rgba(232,160,32,0.4)',
                      background: 'rgba(232,160,32,0.1)', color: '#f0c060',
                      fontSize: '12px', cursor: 'pointer', fontWeight: 600,
                    }}>Assign Driver</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assign Driver Modal */}
      {assignModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '24px',
        }} onClick={() => setAssignModal(null)}>
          <div style={{
            background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '440px',
          }} onClick={e => e.stopPropagation()}>
            <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: 700, margin: '0 0 6px' }}>Assign Driver</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: '0 0 24px' }}>
              RJ{String(assignModal.id).padStart(5, '0')} · {assignModal.donor_name} · {assignModal.food_type}
            </p>

            <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>Select Driver</label>
            <select
              value={assignDriverId}
              onChange={e => setAssignDriverId(e.target.value)}
              style={{
                width: '100%', padding: '12px 16px', borderRadius: '10px', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                color: '#fff', fontSize: '15px', outline: 'none', marginBottom: '24px',
              }}
            >
              <option value="">-- Choose a driver --</option>
              {drivers.map(d => (
                <option key={d.id} value={d.id} style={{ background: '#1a1f2e' }}>
                  {d.name} · {d.phone} {d.vehicle_number ? `(${d.vehicle_number})` : ''}
                </option>
              ))}
            </select>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setAssignModal(null)} style={{
                flex: 1, padding: '12px', borderRadius: '10px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#9ca3af', cursor: 'pointer', fontSize: '14px',
              }}>Cancel</button>
              <button onClick={handleAssign} disabled={!assignDriverId || assigning} style={{
                flex: 2, padding: '12px', borderRadius: '10px', border: 'none',
                background: 'linear-gradient(135deg, #e8a020, #f0c060)',
                color: '#1a0a00', fontWeight: 700, cursor: 'pointer', fontSize: '14px',
                opacity: (!assignDriverId || assigning) ? 0.6 : 1,
              }}>{assigning ? 'Assigning…' : 'Assign & Notify'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {detailModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '24px',
        }} onClick={() => setDetailModal(null)}>
          <div style={{
            background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '440px',
          }} onClick={e => e.stopPropagation()}>
            <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: 700, margin: '0 0 6px' }}>Update Status</h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', margin: '0 0 24px' }}>
              RJ{String(detailModal.id).padStart(5, '0')} · {detailModal.donor_name}
            </p>

            <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>Status</label>
            <select
              value={newStatus}
              onChange={e => setNewStatus(e.target.value)}
              style={{
                width: '100%', padding: '12px 16px', borderRadius: '10px', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                color: '#fff', fontSize: '15px', outline: 'none', marginBottom: '24px',
              }}
            >
              {Object.entries(STATUS_LABELS).map(([val, label]) => (
                <option key={val} value={val} style={{ background: '#1a1f2e' }}>{label}</option>
              ))}
            </select>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setDetailModal(null)} style={{
                flex: 1, padding: '12px', borderRadius: '10px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#9ca3af', cursor: 'pointer', fontSize: '14px',
              }}>Cancel</button>
              <button onClick={handleStatusUpdate} disabled={updatingStatus} style={{
                flex: 2, padding: '12px', borderRadius: '10px', border: 'none',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '14px',
                opacity: updatingStatus ? 0.6 : 1,
              }}>{updatingStatus ? 'Updating…' : 'Update Status'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
