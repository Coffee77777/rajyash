'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';

const API = 'https://slipms.com/rajyash-api';
// Default center: Ahmedabad
const DEFAULT_LAT = 23.0225;
const DEFAULT_LNG = 72.5714;

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

  // ── Map pin picker ────────────────────────────────────────────────
  const [mapOpen, setMapOpen]           = useState(false);
  const [mapReady, setMapReady]         = useState(false);
  const [mapAddr, setMapAddr]           = useState('');
  const [mapLoading, setMapLoading]     = useState(false);
  const [gpsLoading, setGpsLoading]     = useState(false);
  const [pinLat, setPinLat]             = useState<number | null>(null);
  const [pinLng, setPinLng]             = useState<number | null>(null);
  const mapDivRef  = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletRef = useRef<any>(null);   // L instance
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef     = useRef<any>(null);   // map instance
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef  = useRef<any>(null);   // draggable marker
  const latLngRef  = useRef<[number,number]>([DEFAULT_LAT, DEFAULT_LNG]);

  // Load Leaflet assets once
  useEffect(() => {
    if (mapReady || typeof window === 'undefined') return;
    const linkEl = document.createElement('link');
    linkEl.rel = 'stylesheet';
    linkEl.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(linkEl);
    const scriptEl = document.createElement('script');
    scriptEl.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    scriptEl.onload = () => setMapReady(true);
    document.body.appendChild(scriptEl);
  }, [mapReady]);

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setMapLoading(true);
    setMapAddr('');
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const d = await r.json();
      const a = d.address || {};
      const parts = [a.road||a.pedestrian||a.footway, a.neighbourhood||a.suburb, a.city||a.town||a.village, a.state].filter(Boolean);
      setMapAddr(parts.join(', ') || d.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    } catch { setMapAddr(`${lat.toFixed(5)}, ${lng.toFixed(5)}`); }
    finally { setMapLoading(false); }
  }, []);

  // Initialise map when modal opens
  useEffect(() => {
    if (!mapOpen || !mapReady || !mapDivRef.current) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const L = (window as any).L;
    leafletRef.current = L;
    if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }

    const map = L.map(mapDivRef.current, { zoomControl: true }).setView(latLngRef.current, 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors', maxZoom: 19
    }).addTo(map);

    // Custom green pin icon
    const icon = L.divIcon({
      html: '<div style="width:28px;height:28px;background:#0F3D1F;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>',
      className: '', iconSize: [28,28], iconAnchor: [14,28], popupAnchor: [0,-30],
    });
    const marker = L.marker(latLngRef.current, { draggable: true, icon }).addTo(map);
    markerRef.current = marker;

    const onMove = (latlng: {lat:number;lng:number}) => {
      latLngRef.current = [latlng.lat, latlng.lng];
      reverseGeocode(latlng.lat, latlng.lng);
    };
    marker.on('dragend', (e: {target:{getLatLng:()=>{lat:number;lng:number}}}) => onMove(e.target.getLatLng()));
    map.on('click', (e: {latlng:{lat:number;lng:number}}) => { marker.setLatLng(e.latlng); onMove(e.latlng); });
    mapRef.current = map;

    // Initial reverse geocode
    reverseGeocode(latLngRef.current[0], latLngRef.current[1]);

    return () => { /* keep map; removed when modal re-renders */ };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapOpen, mapReady]);

  const useGPS = useCallback(() => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        latLngRef.current = [lat, lng];
        if (mapRef.current && markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
          mapRef.current.setView([lat, lng], 17);
        }
        reverseGeocode(lat, lng);
        setGpsLoading(false);
      },
      () => setGpsLoading(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [reverseGeocode]);

  const confirmPin = useCallback(() => {
    if (mapAddr) set('pickup_address', mapAddr);
    setPinLat(latLngRef.current[0]);
    setPinLng(latLngRef.current[1]);
    setMapOpen(false);
  }, [mapAddr]); // eslint-disable-line react-hooks/exhaustive-deps

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  function handlePhotos(files: FileList | null) {
    if (!files || files.length === 0) return;
    const newFiles = Array.from(files).filter(f => f.size <= 10 * 1024 * 1024);
    const combined = [...photos, ...newFiles].slice(0, 5); // max 5
    setPhotos(combined);
    combined.forEach((file, i) => {
      if (photoPreviews[i]) return;
      const reader = new FileReader();
      reader.onload = e => setPhotoPreviews(prev => { const a = [...prev]; a[i] = e.target?.result as string; return a; });
      reader.readAsDataURL(file);
    });
    // rebuild previews for all
    const previews: string[] = [];
    combined.forEach((file, i) => {
      const reader = new FileReader();
      reader.onload = e => { previews[i] = e.target?.result as string; if (previews.filter(Boolean).length === combined.length) setPhotoPreviews([...previews]); };
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
          <button onClick={() => { setStep('form'); setForm({ donor_name:'',donor_phone:'',donor_address:'',food_type:'',approx_kg:'',ready_by:'',pickup_address:'' }); setPhotos([]); setPhotoPreviews([]); }}
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
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#1B5E38' }}>Pickup Address *</label>
                <button type="button" onClick={() => setMapOpen(true)}
                  style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 12px', borderRadius:20, border:'1.5px solid #1B5E38', background:'#f0fdf4', color:'#1B5E38', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                  📍 Drop Pin
                </button>
              </div>
              <input required value={form.pickup_address} onChange={e => set('pickup_address', e.target.value)}
                placeholder="Type address or use Drop Pin →" style={inputStyle}
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

          <hr style={{ border: 'none', borderTop: '1.5px solid #f0ebe5', margin: '28px 0' }} />

          {/* Photo upload */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', color: '#C4963C', textTransform: 'uppercase' }}>Food Photos (Optional)</div>
              {photos.length > 0 && photos.length < 5 && (
                <span style={{ fontSize: 12, color: '#1B5E38', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }} onClick={() => { if (fileRef.current) { fileRef.current.value = ''; fileRef.current.click(); } }}>+ Add more</span>
              )}
            </div>
            <input
              ref={fileRef} type="file" accept="image/*" multiple
              style={{ display: 'none' }}
              onChange={e => handlePhotos(e.target.files)}
            />
            {photos.length === 0 ? (
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor='#0F3D1F'; e.currentTarget.style.background='#f0f7f0'; }}
                onDragLeave={e => { e.currentTarget.style.borderColor='#DDE8D8'; e.currentTarget.style.background='#FDFBF7'; }}
                onDrop={e => { e.preventDefault(); handlePhotos(e.dataTransfer.files); e.currentTarget.style.borderColor='#DDE8D8'; e.currentTarget.style.background='#FDFBF7'; }}
                style={{
                  border: '2px dashed #DDE8D8', borderRadius: 14, padding: '28px 20px',
                  textAlign: 'center', cursor: 'pointer', background: '#FDFBF7', transition: 'all 0.2s',
                }}>
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

          <button type="submit" disabled={loading} className="btn-gold" style={{ width: '100%', justifyContent: 'center', marginTop: 28, fontSize: 16, padding: '16px', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Submitting…' : 'Submit Pickup Request →'}
          </button>

          <p style={{ textAlign: 'center', fontSize: 12, color: '#A8B5AD', marginTop: 14 }}>
            No login required · Your data is kept private
          </p>
        </form>
      </div>

      {/* ── MAP PIN PICKER MODAL ── */}
      {mapOpen && (
        <div style={{ position:'fixed', inset:0, zIndex:300, display:'flex', flexDirection:'column' }}
          onClick={e => { if (e.target === e.currentTarget) setMapOpen(false); }}>
          {/* Header bar */}
          <div style={{ background:'#0F3D1F', padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
            <div>
              <div style={{ color:'#fff', fontWeight:800, fontSize:16 }}>📍 Drop Pin — Pickup Location</div>
              <div style={{ color:'rgba(255,255,255,0.55)', fontSize:12, marginTop:2 }}>Tap the map or drag the pin</div>
            </div>
            <button onClick={() => setMapOpen(false)} style={{ background:'rgba(255,255,255,0.12)', border:'none', color:'#fff', fontSize:20, width:36, height:36, borderRadius:'50%', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
          </div>

          {/* Map */}
          <div ref={mapDivRef} style={{ flex:1, minHeight:0 }} />

          {/* Bottom sheet */}
          <div style={{ background:'#fff', padding:'16px 20px 24px', borderTop:'1.5px solid #e0ebe5', flexShrink:0, boxShadow:'0 -4px 20px rgba(0,0,0,0.12)' }}>
            <div style={{ display:'flex', gap:10, marginBottom:14 }}>
              <button type="button" onClick={useGPS} disabled={gpsLoading}
                style={{ flex:1, padding:'10px', borderRadius:10, border:'1.5px solid #1B5E38', background:'#f0fdf4', color:'#1B5E38', fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                {gpsLoading ? '…' : '🎯 Use My Location'}
              </button>
            </div>
            <div style={{ background:'#FDFBF7', border:'1.5px solid #e0ebe5', borderRadius:10, padding:'10px 14px', marginBottom:14, minHeight:42, fontSize:13, color:'#0F3D1F', fontWeight:500 }}>
              {mapLoading ? <span style={{ color:'#A8B5AD' }}>Getting address…</span> : mapAddr || <span style={{ color:'#A8B5AD' }}>Tap map to pick location</span>}
            </div>
            <button type="button" onClick={confirmPin} disabled={!mapAddr || mapLoading}
              style={{ width:'100%', padding:'14px', borderRadius:12, border:'none', background: (!mapAddr||mapLoading)?'#e0ebe5':'linear-gradient(135deg,#1B5E38,#0F3D1F)', color:(!mapAddr||mapLoading)?'#A8B5AD':'#fff', fontSize:15, fontWeight:800, cursor:(!mapAddr||mapLoading)?'not-allowed':'pointer' }}>
              Confirm This Location →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
