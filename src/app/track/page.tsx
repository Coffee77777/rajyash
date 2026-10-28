'use client';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const API = 'https://slipms.com/rajyash-api';

const STATUSES = [
  { key: 'requested',    label: 'Request Received',   desc: 'Your request is in our system.' },
  { key: 'under_review', label: 'Under Review',        desc: 'Our team is reviewing your request.' },
  { key: 'assigned',     label: 'Driver Assigned',     desc: 'A driver is heading your way.' },
  { key: 'ride_started', label: 'On the Way',          desc: 'Driver is en route to pickup.' },
  { key: 'picked_up',    label: 'Food Picked Up',      desc: 'Driver has collected the food.' },
  { key: 'delivered',    label: 'Delivered',           desc: 'Food has reached the drop point.' },
  { key: 'closed',       label: 'Trip Closed',         desc: 'All done. Thank you! 🙏' },
];

function TrackContent() {
  const params = useSearchParams();
  const [inputId, setInputId] = useState(params.get('id') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [request, setRequest] = useState<Record<string,string> | null>(null);

  async function search(id?: string) {
    const trackId = (id || inputId).trim().replace(/^RJ-?/i, '');
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

  useEffect(() => {
    const id = params.get('id');
    if (id) { setInputId(id); search(id.replace(/^RJ-?/i, '')); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentStep = request ? STATUSES.findIndex(s => s.key === request.status) : -1;

  return (
    <div style={{ minHeight: '100vh', background: '#0A2E1E', padding: '80px 24px 60px' }}>
      <div style={{ maxWidth: 580, margin: '0 auto 32px' }}>
        <Link href="/" style={{ color: '#A8C5B5', fontSize: 14, textDecoration: 'none' }}
          onMouseEnter={e => (e.currentTarget.style.color='#fff')}
          onMouseLeave={e => (e.currentTarget.style.color='#A8C5B5')}>← Back to Home</Link>
      </div>

      <div style={{ maxWidth: 580, margin: '0 auto' }}>
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'inline-block', background: 'rgba(245,151,19,0.12)', border: '1px solid rgba(245,151,19,0.3)', borderRadius: 50, padding: '5px 14px', marginBottom: 18 }}>
            <span style={{ color: '#F59713', fontSize: 12, fontWeight: 700, letterSpacing: '0.5px' }}>TRACK YOUR REQUEST</span>
          </div>
          <h1 style={{ fontSize: 'clamp(30px,5vw,46px)', fontWeight: 900, color: '#fff', letterSpacing: '-1.5px', marginBottom: 12 }}>Where&apos;s your food going?</h1>
          <p style={{ color: '#A8C5B5', fontSize: 15 }}>Enter your tracking ID to see real-time status.</p>
        </div>

        {/* Search box */}
        <div style={{ background: '#fff', borderRadius: 20, padding: '28px 28px', marginBottom: 24, boxShadow: '0 24px 80px rgba(0,0,0,0.25)' }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              value={inputId} onChange={e => setInputId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search()}
              placeholder="Enter tracking ID (e.g. RJ-00142)"
              style={{ flex: 1, padding: '13px 16px', border: '1.5px solid #e0ebe5', borderRadius: 12, fontSize: 15, fontFamily: 'inherit', color: '#0A2E1E', background: '#FDFAF6', outline: 'none' }}
              onFocus={e => { e.target.style.borderColor='#0A2E1E'; }}
              onBlur={e => { e.target.style.borderColor='#e0ebe5'; }}
            />
            <button onClick={() => search()} disabled={loading} className="btn-saffron" style={{ padding: '13px 22px', fontSize: 14, whiteSpace: 'nowrap', opacity: loading ? 0.7 : 1 }}>
              {loading ? '…' : 'Track →'}
            </button>
          </div>
          {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '10px 14px', color: '#dc2626', fontSize: 13, fontWeight: 600, marginTop: 14 }}>⚠️ {error}</div>}
        </div>

        {/* Result */}
        {request && (
          <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.25)' }}>
            {/* Header */}
            <div style={{ background: '#0A2E1E', padding: '24px 28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#A8C5B5', letterSpacing: '0.5px', marginBottom: 4 }}>REQUEST</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>RJ-{String(request.id).padStart(5,'0')}</div>
                </div>
                <div style={{ background: 'rgba(245,151,19,0.15)', border: '1px solid rgba(245,151,19,0.4)', borderRadius: 50, padding: '6px 16px' }}>
                  <span style={{ color: '#F59713', fontSize: 12, fontWeight: 700 }}>
                    {STATUSES.find(s => s.key === request.status)?.label || request.status}
                  </span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#6B8A7A', marginBottom: 2 }}>Food Type</div>
                  <div style={{ fontSize: 14, color: '#fff', fontWeight: 600 }}>{request.food_type}</div>
                </div>
                {request.approx_kg && <div>
                  <div style={{ fontSize: 11, color: '#6B8A7A', marginBottom: 2 }}>Quantity</div>
                  <div style={{ fontSize: 14, color: '#fff', fontWeight: 600 }}>{request.approx_kg} kg</div>
                </div>}
                <div>
                  <div style={{ fontSize: 11, color: '#6B8A7A', marginBottom: 2 }}>Pickup Address</div>
                  <div style={{ fontSize: 13, color: '#A8C5B5' }}>{request.pickup_address}</div>
                </div>
                {request.donor_name && <div>
                  <div style={{ fontSize: 11, color: '#6B8A7A', marginBottom: 2 }}>From</div>
                  <div style={{ fontSize: 13, color: '#A8C5B5' }}>{request.donor_name}</div>
                </div>}
              </div>
            </div>

            {/* Timeline */}
            <div style={{ padding: '28px 28px 32px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '1px', color: '#F59713', marginBottom: 20, textTransform: 'uppercase' }}>Live Status</div>
              {STATUSES.filter(s => !['declined','cancelled'].includes(s.key)).map((s, i) => {
                const done = i < currentStep;
                const active = i === currentStep;
                const future = i > currentStep;
                return (
                  <div key={s.key} style={{ display: 'flex', gap: 16, marginBottom: i < STATUSES.length - 1 ? 0 : 0 }}>
                    {/* Line + dot */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                        background: done ? '#0A2E1E' : active ? '#F59713' : '#f0ebe5',
                        border: active ? '3px solid #FDB944' : 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: active ? '0 0 0 4px rgba(245,151,19,0.2)' : 'none',
                        transition: 'all 0.3s',
                        fontSize: 12,
                      }}>
                        {done ? <span style={{ color: '#fff', fontSize: 12 }}>✓</span> :
                         active ? <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} /> :
                         <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ccc' }} />}
                      </div>
                      {i < STATUSES.length - 2 && (
                        <div style={{ width: 2, height: 32, background: done ? '#0A2E1E' : '#f0ebe5', margin: '4px 0', transition: 'background 0.3s' }} />
                      )}
                    </div>
                    {/* Content */}
                    <div style={{ paddingBottom: i < STATUSES.length - 2 ? 0 : 0, marginBottom: i < STATUSES.length - 2 ? 4 : 0, paddingTop: 2 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: future ? '#ccc' : '#0A2E1E', marginBottom: 2 }}>{s.label}</div>
                      {(done || active) && <div style={{ fontSize: 12, color: '#6B8A7A' }}>{s.desc}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0A2E1E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ color: '#A8C5B5' }}>Loading…</div></div>}>
      <TrackContent />
    </Suspense>
  );
}
