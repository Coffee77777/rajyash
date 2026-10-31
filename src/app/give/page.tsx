'use client';
import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';

const API = 'https://slipms.com/rajyash-api';

export default function GivePage() {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [trackingId, setTrackingId] = useState('');
  const [form, setForm] = useState({
    donor_name: '', donor_phone: '', donor_address: '',
    food_type: '', approx_kg: '', ready_by: '', pickup_address: '',
  });
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  // GPS / location state
  const [gpsLoading, setGpsLoading]   = useState(false);
  const [gpsConfirmed, setGpsConfirmed] = useState(false);
  const [gpsError, setGpsError]       = useState('');
  const [pinLat, setPinLat]           = useState<number | null>(null);
  const [pinLng, setPinLng]           = useState<number | null>(null);

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError('GPS not available on this device. Please type the address.');
      return;
    }
    setGpsLoading(true);
    setGpsError('');
    setGpsConfirmed(false);
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setPinLat(lat);
        setPinLng(lng);
        // Reverse geocode via Nominatim for a human-readable label
        try {
          const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const d = await r.json();
          const a = d.address || {};
          const parts = [
            a.road || a.pedestrian || a.footway || a.amenity,
            a.neighbourhood || a.suburb,
            a.city || a.town || a.village,
            a.state,
          ].filter(Boolean);
          const addr = parts.join(', ') || d.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          setForm(f => ({ ...f, pickup_address: addr }));
          setGpsConfirmed(true);
        } catch {
          setForm(f => ({ ...f, pickup_address: `${lat.toFixed(5)}, ${lng.toFixed(5)}` }));
          setGpsConfirmed(true);
        }
        setGpsLoading(false);
      },
      err => {
        setGpsLoading(false);
        if (err.code === 1) setGpsError('Location permission denied. Please allow location access and try again.');
        else setGpsError('Could not get your location. Please type the address manually.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  function handlePhotos(files: FileList | null) {
    if (!files || files.length === 0) return;
    const newFiles = Array.from(files).filter(f => f.size <= 10 * 1024 * 1024);
    const combined = [...photos, ...newFiles].slice(0, 5);
    setPhotos(combined);
    const previews: string[] = [];
    combined.forEach((file, i) => {
      const reader = new FileReader();
      reader.onload = e => {
        previews[i] = e.target?.result as string;
        if (previews.filter(Boolean).length === combined.length) setPhotoPreviews([...previews]);
      };
      reader.readAsDataURL(file);
    });
  }

  function removePhoto(idx: number) {
    setPhotos(p => p.filter((_, i) => i !== idx));
    setPhotoPreviews(p => p.filter((_, i) => i !== idx));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));
      if (pinLat !== null) fd.append('pickup_lat', String(pinLat));
      if (pinLng !== null) fd.append('pickup_lng', String(pinLng));
      photos.forEach(p => fd.append('photos[]', p));
      const res = await fetch(`${API}/requests.php`, { method: 'POST', body: fd });
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
          <button onClick={() => {
            setStep('form');
            setForm({ donor_name:'', donor_phone:'', donor_address:'', food_type:'', approx_kg:'', ready_by:'', pickup_address:'' });
            setPhotos([]); setPhotoPreviews([]);
            setPinLat(null); setPinLng(null); setGpsConfirmed(false);
          }} style={{ padding: '13px 24px', borderRadius: 50, border: '1.5px solid #e0ebe5', background: '#fff', color: '#0F3D1F', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
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

          {/* ── YOUR INFORMATION ── */}
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

          {/* ── FOOD DETAILS ── */}
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

            {/* ── PICKUP ADDRESS with GPS ── */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#1B5E38', marginBottom: 8 }}>
                Pickup Address *
              </label>

              {/* GPS detect button */}
              <button type="button" onClick={detectLocation} disabled={gpsLoading}
                style={{
                  width: '100%', padding: '12px 16px', marginBottom: 10,
                  borderRadius: 12, border: '1.5px solid #1B5E38',
                  background: gpsLoading ? '#f0fdf4' : 'linear-gradient(135deg,#f0fdf4,#dcfce7)',
                  color: '#1B5E38', fontSize: 14, fontWeight: 700,
                  cursor: gpsLoading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'all 0.2s', boxSizing: 'border-box',
                }}>
                {gpsLoading
                  ? <><span style={{ fontSize: 16 }}>⏳</span> Detecting your location…</>
                  : <><span style={{ fontSize: 16 }}>🎯</span> Detect My Location (GPS)</>}
              </button>

              {/* GPS confirmed banner */}
              {gpsConfirmed && pinLat && pinLng && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10,
                  padding: '9px 14px', marginBottom: 10, gap: 8,
                }}>
                  <span style={{ color: '#166534', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                    ✅ GPS location set
                  </span>
                  <a
                    href={`https://www.google.com/maps?q=${pinLat},${pinLng}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ color: '#1B5E38', fontSize: 12, fontWeight: 700, textDecoration: 'underline', flexShrink: 0 }}>
                    Verify on Google Maps ↗
                  </a>
                </div>
              )}

              {/* GPS error */}
              {gpsError && (
                <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '9px 14px', color: '#dc2626', fontSize: 12, fontWeight: 600, marginBottom: 10 }}>
                  ⚠️ {gpsError}
                </div>
              )}

              {/* Address text field */}
              <input required value={form.pickup_address}
                onChange={e => {
                  set('pickup_address', e.target.value);
                  // If user edits manually after GPS, clear pin coords
                  if (gpsConfirmed) { setPinLat(null); setPinLng(null); setGpsConfirmed(false); }
                }}
                placeholder="Or type address: Building, Street, Area, City"
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor='#0F3D1F'; e.target.style.boxShadow='0 0 0 3px rgba(10,46,30,0.08)'; }}
                onBlur={e => { e.target.style.borderColor='#e0ebe5'; e.target.style.boxShadow='none'; }} />
              <p style={{ fontSize: 11, color: '#A8B5AD', marginTop: 5 }}>
                GPS gives the driver your exact location. You can also type or edit the address above.
              </p>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#1B5E38', marginBottom: 6 }}>Ready for Pickup By *</label>
              <input required type="datetime-local" value={form.ready_by} onChange={e => set('ready_by', e.target.value)}
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor='#0F3D1F'; e.target.style.boxShadow='0 0 0 3px rgba(10,46,30,0.08)'; }}
                onBlur={e => { e.target.style.borderColor='#e0ebe5'; e.target.style.boxShadow='none'; }} />
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1.5px solid #f0ebe5', margin: '28px 0' }} />

          {/* ── FOOD PHOTOS ── */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', color: '#C4963C', textTransform: 'uppercase' }}>Food Photos (Optional)</div>
              {photos.length > 0 && photos.length < 5 && (
                <span style={{ fontSize: 12, color: '#1B5E38', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => { if (fileRef.current) { fileRef.current.value = ''; fileRef.current.click(); } }}>+ Add more</span>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
              onChange={e => handlePhotos(e.target.files)} />
            {photos.length === 0 ? (
              <div onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor='#0F3D1F'; e.currentTarget.style.background='#f0f7f0'; }}
                onDragLeave={e => { e.currentTarget.style.borderColor='#DDE8D8'; e.currentTarget.style.background='#FDFBF7'; }}
                onDrop={e => { e.preventDefault(); handlePhotos(e.dataTransfer.files); e.currentTarget.style.borderColor='#DDE8D8'; e.currentTarget.style.background='#FDFBF7'; }}
                style={{ border: '2px dashed #DDE8D8', borderRadius: 14, padding: '28px 20px', textAlign: 'center', cursor: 'pointer', background: '#FDFBF7', transition: 'all 0.2s' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📸</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#0F3D1F', marginBottom: 4 }}>Tap to add photos</div>
                <div style={{ fontSize: 12, color: '#A8B5AD' }}>Up to 5 photos · JPG, PNG or WebP · Max 10 MB each</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))', gap: 10 }}>
                {photoPreviews.map((src, i) => src && (
                  <div key={i} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1.5px solid #DDE8D8', aspectRatio: '1', background: '#f0ebe5' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`Photo ${i+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    <button type="button" onClick={() => removePhoto(i)}
                      style={{ position: 'absolute', top: 5, right: 5, width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                  </div>
                ))}
                {photos.length < 5 && (
                  <div onClick={() => { if (fileRef.current) { fileRef.current.value = ''; fileRef.current.click(); } }}
                    style={{ borderRadius: 10, border: '2px dashed #DDE8D8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', aspectRatio: '1', cursor: 'pointer', background: '#FDFBF7', gap: 4 }}>
                    <span style={{ fontSize: 22, color: '#A8B5AD' }}>+</span>
                    <span style={{ fontSize: 11, color: '#A8B5AD' }}>Add</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '12px 16px', color: '#dc2626', fontSize: 13, fontWeight: 600, marginTop: 16 }}>
              ⚠️ {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-gold"
            style={{ width: '100%', justifyContent: 'center', marginTop: 28, fontSize: 16, padding: '16px', opacity: loading ? 0.7 : 1 }}>
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
