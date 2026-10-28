'use client';
import { useState } from 'react';
import Link from 'next/link';

const API = 'https://slipms.com/rajyash-api';

export default function GivePage() {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [trackingId, setTrackingId] = useState('');
  const [form, setForm] = useState({
    donor_name: '', donor_phone: '', donor_address: '',
    food_type: '', approx_kg: '', serves: '', ready_by: '', pickup_address: '',
  });

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch(`${API}/requests.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || data.error) { setError(data.error || 'Something went wrong. Please try again.'); return; }
      setTrackingId(data.tracking_id || 'RJ-' + String(data.id).padStart(5, '0'));
      setStep('success');
    } catch { setError('Network error. Please check your connection.'); }
    finally { setLoading(false); }
  }

  const inputStyle = {
    width: '100%', padding: '13px 16px',
    border: '1.5px solid #e0ebe5', borderRadius: 12,
    fontSize: 15, fontFamily: 'inherit', color: '#0F3D1F',
    background: '#FDFBF7', outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };

  if (step === 'success') return (
    <div style={{ minHeight: '100vh', background: '#0F3D1F', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 28, padding: '56px 48px', maxWidth: 480, width: '100%', textAlign: 'center', boxShadow: '0 40px 120px rgba(0,0,0,0.3)' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #1B5E38, #0F3D1F)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 36 }}>✅</div>
        <h2 style={{ fontSize: 28, fontWeight: 900, color: '#0F3D1F', marginBottom: 10, letterSpacing: '-0.5px' }}>Request Submitted!</h2>
        <p style={{ color: '#6B8A7A', fontSize: 16, lineHeight: 1.6, marginBottom: 32 }}>
          Thank you. Our team will review and assign a driver shortly. Use your tracking ID to check status.
        </p>
        <div style={{ background: '#FDFBF7', border: '2px dashed #C4963C', borderRadius: 16, padding: '20px 24px', marginBottom: 32 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#C4963C', letterSpacing: '1px', marginBottom: 6, textTransform: 'uppercase' }}>Your Tracking ID</div>
          <div style={{ fontSize: 36, fontWeight: 900, color: '#0F3D1F', letterSpacing: '-1px' }}>{trackingId}</div>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href={`/track?id=${trackingId}`} className="btn-gold" style={{ fontSize: 15 }}>Track Status →</Link>
          <button onClick={() => { setStep('form'); setForm({ donor_name:'',donor_phone:'',donor_address:'',food_type:'',approx_kg:'',serves:'',ready_by:'',pickup_address:'' }); }}
            style={{ padding: '13px 24px', borderRadius: 50, border: '1.5px solid #e0ebe5', background: '#fff', color: '#0F3D1F', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            Submit Another
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0F3D1F', padding: '80px 24px 60px' }}>
      {/* Back nav */}
      <div style={{ maxWidth: 600, margin: '0 auto 32px' }}>
        <Link href="/" style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          onMouseEnter={e => (e.currentTarget.style.color='#fff')}
          onMouseLeave={e => (e.currentTarget.style.color='rgba(255,255,255,0.55)')}>
          ← Back to Home
        </Link>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'inline-block', background: 'rgba(245,151,19,0.12)', border: '1px solid rgba(245,151,19,0.3)', borderRadius: 50, padding: '5px 14px', marginBottom: 18 }}>
            <span style={{ color: '#C4963C', fontSize: 12, fontWeight: 700, letterSpacing: '0.5px' }}>DONATE SURPLUS FOOD</span>
          </div>
          <h1 style={{ fontSize: 'clamp(32px,5vw,48px)', fontWeight: 900, color: '#fff', lineHeight: 1.05, letterSpacing: '-1.5px', marginBottom: 14 }}>
            Your surplus food.<br />Someone&apos;s full plate.
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 16, lineHeight: 1.6 }}>No registration needed. Fill this form and we&apos;ll handle the rest.</p>
        </div>

        {/* Form card */}
        <form onSubmit={submit} style={{ background: '#fff', borderRadius: 24, padding: '40px 36px', boxShadow: '0 24px 80px rgba(0,0,0,0.3)' }}>
          {/* Donor info */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', color: '#C4963C', marginBottom: 18, textTransform: 'uppercase' }}>Your Information</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#1B5E38', marginBottom: 6 }}>Full Name / Organisation *</label>
                <input required value={form.donor_name} onChange={e => set('donor_name', e.target.value)}
                  placeholder="e.g. Grand Bhagwati Hotel" style={inputStyle}
                  onFocus={e => { e.target.style.borderColor='#0F3D1F'; e.target.style.boxShadow='0 0 0 3px rgba(10,46,30,0.08)'; }}
                  onBlur={e => { e.target.style.borderColor='#e0ebe5'; e.target.style.boxShadow='none'; }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#1B5E38', marginBottom: 6 }}>Phone Number *</label>
                <input required type="tel" value={form.donor_phone} onChange={e => set('donor_phone', e.target.value)}
                  placeholder="+91 XXXXXXXXXX" style={inputStyle}
                  onFocus={e => { e.target.style.borderColor='#0F3D1F'; e.target.style.boxShadow='0 0 0 3px rgba(10,46,30,0.08)'; }}
                  onBlur={e => { e.target.style.borderColor='#e0ebe5'; e.target.style.boxShadow='none'; }} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#1B5E38', marginBottom: 6 }}>Your Address *</label>
              <input required value={form.donor_address} onChange={e => set('donor_address', e.target.value)}
                placeholder="Street, Area, City" style={inputStyle}
                onFocus={e => { e.target.style.borderColor='#0F3D1F'; e.target.style.boxShadow='0 0 0 3px rgba(10,46,30,0.08)'; }}
                onBlur={e => { e.target.style.borderColor='#e0ebe5'; e.target.style.boxShadow='none'; }} />
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1.5px solid #f0ebe5', margin: '28px 0' }} />

          {/* Food info */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', color: '#C4963C', marginBottom: 18, textTransform: 'uppercase' }}>Food Details</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#1B5E38', marginBottom: 6 }}>Food Type *</label>
                <input required value={form.food_type} onChange={e => set('food_type', e.target.value)}
                  placeholder="e.g. Dal Rice, Roti, Biryani" style={inputStyle}
                  onFocus={e => { e.target.style.borderColor='#0F3D1F'; e.target.style.boxShadow='0 0 0 3px rgba(10,46,30,0.08)'; }}
                  onBlur={e => { e.target.style.borderColor='#e0ebe5'; e.target.style.boxShadow='none'; }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#1B5E38', marginBottom: 6 }}>Serves (no. of people)</label>
                <input type="number" min="1" step="1" value={form.approx_kg} onChange={e => set('approx_kg', e.target.value)}
                  placeholder="e.g. 50" style={inputStyle}
                  onFocus={e => { e.target.style.borderColor='#0F3D1F'; e.target.style.boxShadow='0 0 0 3px rgba(10,46,30,0.08)'; }}
                  onBlur={e => { e.target.style.borderColor='#e0ebe5'; e.target.style.boxShadow='none'; }} />
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#1B5E38', marginBottom: 6 }}>Pickup Address *</label>
              <input required value={form.pickup_address} onChange={e => set('pickup_address', e.target.value)}
                placeholder="Where should the driver come?" style={inputStyle}
                onFocus={e => { e.target.style.borderColor='#0F3D1F'; e.target.style.boxShadow='0 0 0 3px rgba(10,46,30,0.08)'; }}
                onBlur={e => { e.target.style.borderColor='#e0ebe5'; e.target.style.boxShadow='none'; }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#1B5E38', marginBottom: 6 }}>Ready for Pickup By *</label>
              <input required type="datetime-local" value={form.ready_by} onChange={e => set('ready_by', e.target.value)}
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor='#0F3D1F'; e.target.style.boxShadow='0 0 0 3px rgba(10,46,30,0.08)'; }}
                onBlur={e => { e.target.style.borderColor='#e0ebe5'; e.target.style.boxShadow='none'; }} />
            </div>
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '12px 16px', color: '#dc2626', fontSize: 13, fontWeight: 600, marginTop: 16 }}>
              ⚠️ {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-gold" style={{ width: '100%', justifyContent: 'center', marginTop: 28, fontSize: 16, padding: '16px', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Submitting…' : 'Submit Pickup Request →'}
          </button>

          <p style={{ textAlign: 'center', fontSize: 12, color: '#A8B5AD', marginTop: 14 }}>
            No login required · Your data is kept private
          </p>
        </form>
      </div>
    </div>
  );
}
