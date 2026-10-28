'use client';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

const API = 'https://slipms.com/rajyash-api';
const UPLOADS = 'https://slipms.com/rajyash-api/';

type Request = {
  id: number;
  donor_name: string;
  donor_phone: string;
  donor_address: string;
  pickup_address: string;
  food_type: string;
  approx_kg: number | null;
  ready_by: string;
  status: string;
  created_at: string;
  requester_name: string;
  photo_path?: string;    // comma-separated food photos (from give form)
  pickup_photo?: string;  // driver pickup photo (from trips table)
};
type Driver = { id: number; name: string; phone: string; vehicle_type: string; vehicle_number: string; };

const S_LABEL: Record<string, string> = {
  requested:'Requested', under_review:'Under Review', assigned:'Assigned',
  accepted:'Accepted', declined:'Declined', ride_started:'On the Way',
  picked_up:'Picked Up', delivered:'Delivered', closed:'Closed', cancelled:'Cancelled',
};
const S_COLOR: Record<string, { bg: string; text: string; dot: string }> = {
  requested:    { bg:'#fef9ec', text:'#92400e', dot:'#f59e0b' },
  under_review: { bg:'#eff6ff', text:'#1e40af', dot:'#3b82f6' },
  assigned:     { bg:'#f5f3ff', text:'#5b21b6', dot:'#8b5cf6' },
  accepted:     { bg:'#eef2ff', text:'#3730a3', dot:'#6366f1' },
  declined:     { bg:'#fef2f2', text:'#991b1b', dot:'#ef4444' },
  ride_started: { bg:'#fff7ed', text:'#9a3412', dot:'#f97316' },
  picked_up:    { bg:'#ecfeff', text:'#155e75', dot:'#06b6d4' },
  delivered:    { bg:'#f0fdf4', text:'#166534', dot:'#22c55e' },
  closed:       { bg:'#f9fafb', text:'#374151', dot:'#6b7280' },
  cancelled:    { bg:'#f9fafb', text:'#4b5563', dot:'#9ca3af' },
};
const S_LEFT: Record<string, string> = {
  requested:'#f59e0b', under_review:'#3b82f6', assigned:'#8b5cf6',
  accepted:'#6366f1', declined:'#ef4444', ride_started:'#f97316',
  picked_up:'#06b6d4', delivered:'#22c55e', closed:'#9ca3af', cancelled:'#d1d5db',
};

const inp: React.CSSProperties = {
  width:'100%', padding:'11px 14px', border:'1.5px solid #e2e8f0', borderRadius:10,
  fontSize:14, fontFamily:'inherit', color:'#0f172a', background:'#fff', outline:'none',
  boxSizing:'border-box', transition:'border-color 0.2s, box-shadow 0.2s',
};

export default function AdminPage() {
  const [token, setToken]           = useState<string|null>(null);
  const [adminName, setAdminName]   = useState('');
  const [phone, setPhone]           = useState('');
  const [password, setPassword]     = useState('');
  const [loginErr, setLoginErr]     = useState('');
  const [logging, setLogging]       = useState(false);
  const [requests, setRequests]     = useState<Request[]>([]);
  const [drivers, setDrivers]       = useState<Driver[]>([]);
  const [filterStatus, setFilter]   = useState('');
  const [loading, setLoading]       = useState(false);
  const [assignModal, setAssign]    = useState<Request|null>(null);
  const [assignDrv, setAssignDrv]   = useState('');
  const [assigning, setAssigning]   = useState(false);
  const [statusModal, setStatusMod] = useState<Request|null>(null);
  const [newStatus, setNewStatus]   = useState('');
  const [updating, setUpdating]     = useState(false);
  const [lightbox, setLightbox]     = useState<string|null>(null);
  const [detailModal, setDetail]    = useState<Request|null>(null);

  useEffect(() => {
    const t = sessionStorage.getItem('rj_admin_token');
    const n = sessionStorage.getItem('rj_admin_name');
    if (t) { setToken(t); setAdminName(n || 'Admin'); }
  }, []);

  const fetchAll = useCallback(async (tok: string, status: string) => {
    setLoading(true);
    try {
      const url = `${API}/requests.php${status ? `?status=${status}` : ''}`;
      const [rR, dR] = await Promise.all([
        fetch(url, { headers: { Authorization:`Bearer ${tok}` } }),
        fetch(`${API}/drivers.php`, { headers: { Authorization:`Bearer ${tok}` } }),
      ]);
      if (rR.ok) setRequests(await rR.json());
      if (dR.ok) setDrivers(await dR.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (token) fetchAll(token, filterStatus); }, [token, filterStatus, fetchAll]);

  async function doLogin(e: React.FormEvent) {
    e.preventDefault(); setLoginErr(''); setLogging(true);
    try {
      const res = await fetch(`${API}/auth.php`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({phone,password}) });
      const d = await res.json();
      if (!res.ok) { setLoginErr(d.error||'Login failed'); return; }
      if (d.user?.role !== 'admin') { setLoginErr('Admin access only'); return; }
      sessionStorage.setItem('rj_admin_token', d.token);
      sessionStorage.setItem('rj_admin_name', d.user.name);
      setToken(d.token); setAdminName(d.user.name);
    } finally { setLogging(false); }
  }

  async function doAssign() {
    if (!assignModal || !assignDrv) return;
    setAssigning(true);
    try {
      const res = await fetch(`${API}/requests.php?id=${assignModal.id}`, {
        method:'PATCH', headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},
        body: JSON.stringify({driver_id:parseInt(assignDrv)}),
      });
      if (res.ok) { setAssign(null); setAssignDrv(''); fetchAll(token!, filterStatus); }
    } finally { setAssigning(false); }
  }

  async function doStatus() {
    if (!statusModal||!newStatus) return;
    setUpdating(true);
    try {
      const res = await fetch(`${API}/requests.php?id=${statusModal.id}`, {
        method:'PUT', headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},
        body: JSON.stringify({status:newStatus}),
      });
      if (res.ok) { setStatusMod(null); setNewStatus(''); fetchAll(token!, filterStatus); }
    } finally { setUpdating(false); }
  }

  function logout() { sessionStorage.removeItem('rj_admin_token'); sessionStorage.removeItem('rj_admin_name'); setToken(null); }

  // ── LOGIN ────────────────────────────────────────────────────────
  if (!token) return (
    <div style={{ minHeight:'100vh', fontFamily:'Inter,system-ui,sans-serif', display:'flex' }}>

      {/* LEFT PANEL */}
      <div style={{
        flex:'0 0 46%', background:'linear-gradient(160deg,#0F3D1F 0%,#1B5E38 60%,#0F3D1F 100%)',
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        padding:'60px 48px', position:'relative', overflow:'hidden',
      }}>
        {/* Decorative radial */}
        <div style={{ position:'absolute', top:-80, right:-80, width:360, height:360, borderRadius:'50%', background:'radial-gradient(circle,rgba(196,150,60,0.12),transparent 70%)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:-60, left:-60, width:280, height:280, borderRadius:'50%', background:'radial-gradient(circle,rgba(196,150,60,0.07),transparent 70%)', pointerEvents:'none' }}/>
        {/* Subtle pattern dots */}
        <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize:'28px 28px', pointerEvents:'none' }}/>

        <div style={{ position:'relative', textAlign:'center', zIndex:1 }}>
          <Image src="/rajyash-logo.png" alt="Rajyash Foundation" width={200} height={64} style={{ objectFit:'contain', filter:'brightness(0) invert(1)', marginBottom:40 }} priority />

          <div style={{ width:48, height:2, background:'linear-gradient(90deg,transparent,#C4963C,transparent)', margin:'0 auto 32px' }}/>

          <h2 style={{ color:'#fff', fontSize:28, fontWeight:800, letterSpacing:'-0.5px', lineHeight:1.2, marginBottom:12 }}>
            Admin Portal
          </h2>
          <p style={{ color:'rgba(255,255,255,0.45)', fontSize:14, lineHeight:1.7, maxWidth:260 }}>
            Manage food rescue requests, assign drivers, and track deliveries across Ahmedabad.
          </p>

          <div style={{ marginTop:48, display:'flex', flexDirection:'column', gap:14 }}>
            {[['📋','Manage Requests'],['🚗','Assign Drivers'],['📊','Track Deliveries']].map(([icon,text]) => (
              <div key={text} style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:36, height:36, borderRadius:10, background:'rgba(196,150,60,0.15)', border:'1px solid rgba(196,150,60,0.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>{icon}</div>
                <span style={{ color:'rgba(255,255,255,0.6)', fontSize:13 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position:'absolute', bottom:28, color:'rgba(255,255,255,0.2)', fontSize:11, letterSpacing:'1px' }}>
          WE RISE BY LIFTING OTHERS
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{
        flex:1, background:'#FDFBF7', display:'flex', alignItems:'center', justifyContent:'center', padding:'48px 40px',
      }}>
        <div style={{ width:'100%', maxWidth:400 }}>
          <div style={{ marginBottom:40 }}>
            <div style={{ width:4, height:40, background:'linear-gradient(180deg,#C4963C,#1B5E38)', borderRadius:2, marginBottom:20 }}/>
            <h1 style={{ fontSize:28, fontWeight:800, color:'#0F3D1F', letterSpacing:'-0.5px', marginBottom:6 }}>Welcome back</h1>
            <p style={{ color:'#7A9A7A', fontSize:14 }}>Sign in to your admin account to continue</p>
          </div>

          <form onSubmit={doLogin}>
            <div style={{ marginBottom:18 }}>
              <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#4A6A4A', letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:8 }}>Phone Number</label>
              <input
                type="tel" required value={phone} onChange={e=>setPhone(e.target.value)}
                placeholder="Enter your mobile number"
                style={{ width:'100%', padding:'13px 16px', border:'1.5px solid #DDE8D8', borderRadius:8, fontSize:14, fontFamily:'inherit', color:'#0F3D1F', background:'#fff', outline:'none', boxSizing:'border-box', transition:'border-color 0.2s, box-shadow 0.2s' }}
                onFocus={e=>{e.target.style.borderColor='#1B5E38';e.target.style.boxShadow='0 0 0 3px rgba(27,94,56,0.1)';}}
                onBlur={e=>{e.target.style.borderColor='#DDE8D8';e.target.style.boxShadow='none';}}
              />
            </div>
            <div style={{ marginBottom:28 }}>
              <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#4A6A4A', letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:8 }}>Password</label>
              <input
                type="password" required value={password} onChange={e=>setPassword(e.target.value)}
                placeholder="Enter your password"
                style={{ width:'100%', padding:'13px 16px', border:'1.5px solid #DDE8D8', borderRadius:8, fontSize:14, fontFamily:'inherit', color:'#0F3D1F', background:'#fff', outline:'none', boxSizing:'border-box', transition:'border-color 0.2s, box-shadow 0.2s' }}
                onFocus={e=>{e.target.style.borderColor='#1B5E38';e.target.style.boxShadow='0 0 0 3px rgba(27,94,56,0.1)';}}
                onBlur={e=>{e.target.style.borderColor='#DDE8D8';e.target.style.boxShadow='none';}}
              />
            </div>

            {loginErr && (
              <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, padding:'11px 14px', color:'#dc2626', fontSize:13, marginBottom:20, display:'flex', alignItems:'center', gap:8 }}>
                <span>⚠️</span> {loginErr}
              </div>
            )}

            <button type="submit" disabled={logging} style={{
              width:'100%', padding:'14px', borderRadius:8, border:'none',
              background:'linear-gradient(135deg,#1B5E38,#266B44)',
              color:'#fff', fontWeight:700, fontSize:14, letterSpacing:'0.03em',
              cursor:logging?'not-allowed':'pointer',
              boxShadow:'0 4px 20px rgba(27,94,56,0.28)',
              opacity:logging?0.7:1, transition:'all 0.2s',
            }}
            onMouseEnter={e=>{if(!logging){e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow='0 8px 28px rgba(27,94,56,0.35)';}}}
            onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 4px 20px rgba(27,94,56,0.28)';}}
            >{logging?'Signing in…':'Sign In to Admin'}</button>
          </form>

          <div style={{ marginTop:32, paddingTop:24, borderTop:'1px solid #EDE8DB', textAlign:'center', color:'#B0C4B0', fontSize:12 }}>
            Rajyash Foundation · Secure Admin Access
          </div>
        </div>
      </div>
    </div>
  );

  // ── DASHBOARD ────────────────────────────────────────────────────
  const filters = ['','requested','under_review','assigned','ride_started','delivered','cancelled'];
  const stats = [
    { label:'Total Requests', count:requests.length,                                               icon:'📋', color:'#6366f1', light:'#eef2ff' },
    { label:'Pending Review',  count:requests.filter(r=>r.status==='requested').length,             icon:'⏳', color:'#f59e0b', light:'#fefce8' },
    { label:'Active Trips',    count:requests.filter(r=>['assigned','ride_started','picked_up'].includes(r.status)).length, icon:'🚗', color:'#f97316', light:'#fff7ed' },
    { label:'Delivered',       count:requests.filter(r=>r.status==='delivered'||r.status==='closed').length, icon:'✅', color:'#22c55e', light:'#f0fdf4' },
  ];

  return (
    <div style={{ minHeight:'100vh', background:'#f1f5f9', fontFamily:'Inter,system-ui,sans-serif', color:'#0f172a' }}>

      {/* ── HEADER ── */}
      <div style={{
        background:'#fff', borderBottom:'1px solid #e2e8f0',
        padding:'0 32px', height:64,
        display:'flex', alignItems:'center', justifyContent:'space-between',
        position:'sticky', top:0, zIndex:100,
        boxShadow:'0 1px 3px rgba(0,0,0,0.06)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <Image src="/rajyash-logo.png" alt="Rajyash Foundation" width={130} height={44} style={{ objectFit:'contain' }} priority />
          <div style={{ width:1, height:28, background:'#e2e8f0' }}/>
          <div>
            <div style={{ fontWeight:700, color:'#0f172a', fontSize:14, lineHeight:1.1 }}>Admin Portal</div>
            <div style={{ fontSize:11, color:'#94a3b8' }}>Food Rescue Dashboard</div>
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:13, fontWeight:600, color:'#334155' }}>{adminName}</div>
            <div style={{ fontSize:11, color:'#94a3b8' }}>Administrator</div>
          </div>
          <div style={{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,#0A2E1E,#145C3A)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:14 }}>
            {adminName.charAt(0).toUpperCase()}
          </div>
          <button onClick={logout} style={{
            padding:'7px 16px', borderRadius:8, border:'1.5px solid #e2e8f0',
            background:'#fff', color:'#64748b', cursor:'pointer', fontSize:13, fontWeight:500,
            transition:'all 0.2s',
          }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor='#cbd5e1';e.currentTarget.style.background='#f8fafc';}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor='#e2e8f0';e.currentTarget.style.background='#fff';}}>
            Sign Out
          </button>
        </div>
      </div>

      <div style={{ maxWidth:1200, margin:'0 auto', padding:'28px 24px' }}>

        {/* ── PAGE TITLE ── */}
        <div style={{ marginBottom:28 }}>
          <h1 style={{ fontSize:24, fontWeight:800, color:'#0f172a', letterSpacing:'-0.5px', marginBottom:4 }}>
            Requests Dashboard
          </h1>
          <p style={{ fontSize:14, color:'#64748b' }}>Manage and track all food pickup requests</p>
        </div>

        {/* ── STATS ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16, marginBottom:28 }}>
          {stats.map(s => (
            <div key={s.label} style={{
              background:'#fff', borderRadius:16, padding:'20px 22px',
              boxShadow:'0 1px 4px rgba(0,0,0,0.06)', border:'1px solid #f1f5f9',
              display:'flex', alignItems:'center', gap:16,
              transition:'box-shadow 0.2s, transform 0.2s',
            }}
            onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.1)';e.currentTarget.style.transform='translateY(-2px)';}}
            onMouseLeave={e=>{e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,0.06)';e.currentTarget.style.transform='translateY(0)';}}>
              <div style={{ width:48, height:48, borderRadius:14, background:s.light, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>
                {s.icon}
              </div>
              <div>
                <div style={{ fontSize:28, fontWeight:800, color:s.color, lineHeight:1, letterSpacing:'-1px' }}>{s.count}</div>
                <div style={{ fontSize:12, color:'#94a3b8', marginTop:3, fontWeight:500 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── FILTERS + TOOLBAR ── */}
        <div style={{ background:'#fff', borderRadius:14, padding:'16px 20px', marginBottom:20, boxShadow:'0 1px 4px rgba(0,0,0,0.05)', border:'1px solid #f1f5f9', display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
          <span style={{ fontSize:12, color:'#94a3b8', fontWeight:500, marginRight:4 }}>Filter</span>
          {filters.map(f => {
            const active = filterStatus === f;
            const col = f ? S_COLOR[f] : null;
            return (
              <button key={f||'all'} onClick={()=>setFilter(f)} style={{
                padding:'5px 14px', borderRadius:20, border:'1.5px solid',
                borderColor: active ? (col?.dot||'#0A2E1E') : '#e2e8f0',
                background: active ? (col?.bg||'#f0fdf4') : '#fff',
                color: active ? (col?.text||'#166534') : '#64748b',
                fontSize:12, cursor:'pointer', fontWeight: active?700:500,
                transition:'all 0.15s',
              }}>
                {f ? S_LABEL[f] : 'All'}
              </button>
            );
          })}
          <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
            <button onClick={()=>fetchAll(token!,filterStatus)} style={{
              padding:'7px 16px', borderRadius:8, border:'1.5px solid #e2e8f0',
              background:'#fff', color:'#64748b', cursor:'pointer', fontSize:13, fontWeight:500,
              display:'flex', alignItems:'center', gap:6,
            }}>
              <span style={{ fontSize:14 }}>↻</span> Refresh
            </button>
          </div>
        </div>

        {/* ── REQUEST CARDS ── */}
        {loading ? (
          <div style={{ textAlign:'center', padding:80, color:'#94a3b8' }}>
            <div style={{ fontSize:32, marginBottom:12 }}>⏳</div>
            <div style={{ fontSize:14 }}>Loading requests…</div>
          </div>
        ) : requests.length === 0 ? (
          <div style={{ textAlign:'center', padding:80, color:'#94a3b8', background:'#fff', borderRadius:16, border:'1px solid #f1f5f9' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>📭</div>
            <div style={{ fontSize:16, fontWeight:600, color:'#64748b' }}>No requests found</div>
            <div style={{ fontSize:13, marginTop:4 }}>Try a different filter or refresh</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {requests.map(req => {
              const sc = S_COLOR[req.status] || { bg:'#f9fafb', text:'#374151', dot:'#9ca3af' };
              const lc = S_LEFT[req.status] || '#e2e8f0';
              const thumbs = req.photo_path ? req.photo_path.split(',').map(p => UPLOADS + p) : [];
              return (
                <div key={req.id} style={{
                  background:'#fff', borderRadius:16,
                  border:'1px solid #f1f5f9',
                  borderLeft:`4px solid ${lc}`,
                  padding:'16px 18px 16px 20px',
                  display:'flex', alignItems:'center', gap:16, flexWrap:'wrap',
                  boxShadow:'0 1px 4px rgba(0,0,0,0.05)',
                  transition:'box-shadow 0.2s, transform 0.2s',
                  cursor:'pointer',
                }}
                onClick={()=>setDetail(req)}
                onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 6px 20px rgba(0,0,0,0.1)';e.currentTarget.style.transform='translateY(-1px)';}}
                onMouseLeave={e=>{e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,0.05)';e.currentTarget.style.transform='translateY(0)';}}>

                  {/* Photo thumbnails */}
                  {thumbs.length > 0 && (
                    <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                      {thumbs.slice(0,2).map((url,i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={i} src={url} alt="" onClick={e=>{e.stopPropagation();setLightbox(url);}}
                          style={{ width:52, height:52, borderRadius:10, objectFit:'cover', border:'2px solid #f0f4f8', cursor:'zoom-in', flexShrink:0 }}
                        />
                      ))}
                      {thumbs.length > 2 && (
                        <div style={{ width:52, height:52, borderRadius:10, background:'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:'#64748b', fontWeight:700, flexShrink:0 }}>
                          +{thumbs.length-2}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ID + status */}
                  <div style={{ minWidth:92 }}>
                    <div style={{ fontWeight:800, color:'#0f172a', fontSize:14, letterSpacing:'-0.3px' }}>
                      RJ-{String(req.id).padStart(5,'0')}
                    </div>
                    <div style={{ marginTop:5, display:'inline-flex', alignItems:'center', gap:5, padding:'3px 9px', borderRadius:20, background:sc.bg }}>
                      <div style={{ width:5, height:5, borderRadius:'50%', background:sc.dot, boxShadow:`0 0 4px ${sc.dot}` }}/>
                      <span style={{ fontSize:11, fontWeight:700, color:sc.text }}>{S_LABEL[req.status]||req.status}</span>
                    </div>
                  </div>

                  {/* Donor avatar + info */}
                  <div style={{ display:'flex', alignItems:'center', gap:12, flex:1, minWidth:200 }}>
                    <div style={{ width:40, height:40, borderRadius:12, background:`${lc}18`, border:`1.5px solid ${lc}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:800, color:lc, flexShrink:0 }}>
                      {req.donor_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight:700, color:'#0f172a', fontSize:14 }}>{req.donor_name}</div>
                      <div style={{ color:'#64748b', fontSize:13, marginTop:1 }}>
                        {req.food_type}
                        {req.approx_kg ? <span style={{ color:'#94a3b8' }}> · {req.approx_kg} people</span> : ''}
                      </div>
                      <div style={{ color:'#94a3b8', fontSize:12, marginTop:2, display:'flex', alignItems:'center', gap:4 }}>
                        <span>📍</span>{req.pickup_address}
                      </div>
                    </div>
                  </div>

                  {/* Time */}
                  <div style={{ minWidth:110, textAlign:'right' }}>
                    <div style={{ fontSize:12, color:'#64748b', fontWeight:500 }}>
                      {new Date(req.ready_by).toLocaleDateString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}
                    </div>
                    <div style={{ fontSize:11, color:'#94a3b8', marginTop:3 }}>
                      {new Date(req.created_at).toLocaleDateString('en-IN')}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display:'flex', gap:8 }} onClick={e=>e.stopPropagation()}>
                    <button onClick={e=>{e.stopPropagation();setStatusMod(req);setNewStatus(req.status);}} style={{
                      padding:'7px 14px', borderRadius:8, border:'1.5px solid #e2e8f0',
                      background:'#fff', color:'#64748b', fontSize:12, cursor:'pointer', fontWeight:500,
                      transition:'all 0.15s',
                    }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor='#cbd5e1';e.currentTarget.style.background='#f8fafc';}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor='#e2e8f0';e.currentTarget.style.background='#fff';}}>
                      Edit Status
                    </button>
                    {['requested','under_review'].includes(req.status) && (
                      <button onClick={e=>{e.stopPropagation();setAssign(req);setAssignDrv('');}} style={{
                        padding:'7px 16px', borderRadius:8, border:'1.5px solid #C4963C',
                        background:'linear-gradient(135deg,#fffbf2,#fff8e8)', color:'#92400e',
                        fontSize:12, cursor:'pointer', fontWeight:700,
                        transition:'all 0.15s', display:'flex', alignItems:'center', gap:5,
                        boxShadow:'0 1px 4px rgba(196,150,60,0.15)',
                      }}
                      onMouseEnter={e=>{e.currentTarget.style.background='linear-gradient(135deg,#C4963C,#D4A84B)';e.currentTarget.style.color='#fff';e.currentTarget.style.borderColor='#C4963C';}}
                      onMouseLeave={e=>{e.currentTarget.style.background='linear-gradient(135deg,#fffbf2,#fff8e8)';e.currentTarget.style.color='#92400e';e.currentTarget.style.borderColor='#C4963C';}}>
                        🚗 Assign Driver
                      </button>
                    )}
                    {req.status === 'assigned' && (
                      <button onClick={e=>{e.stopPropagation();setAssign(req);setAssignDrv('');}} style={{
                        padding:'7px 14px', borderRadius:8, border:'1.5px solid #8b5cf6',
                        background:'#f5f3ff', color:'#5b21b6',
                        fontSize:12, cursor:'pointer', fontWeight:600,
                        transition:'all 0.15s', display:'flex', alignItems:'center', gap:5,
                      }}
                      onMouseEnter={e=>{e.currentTarget.style.background='#ede9fe';}}
                      onMouseLeave={e=>{e.currentTarget.style.background='#f5f3ff';}}>
                        ↺ Reassign
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── ASSIGN MODAL ── */}
      {assignModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.6)', backdropFilter:'blur(12px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:24 }}
          onClick={()=>setAssign(null)}>
          <div style={{ background:'#fff', borderRadius:24, padding:'36px', width:'100%', maxWidth:460, boxShadow:'0 40px 80px rgba(0,0,0,0.25)' }} onClick={e=>e.stopPropagation()}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:14, marginBottom:24 }}>
              <div style={{ width:48, height:48, borderRadius:14, background:'#fff9ec', border:'1.5px solid #fde68a', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>🚗</div>
              <div>
                <h2 style={{ fontSize:18, fontWeight:800, color:'#0f172a', margin:0, letterSpacing:'-0.3px' }}>Assign a Driver</h2>
                <p style={{ color:'#64748b', fontSize:13, margin:'4px 0 0' }}>
                  RJ-{String(assignModal.id).padStart(5,'0')} · {assignModal.food_type}
                  {assignModal.approx_kg ? ` · ${assignModal.approx_kg} people` : ''}
                </p>
              </div>
            </div>

            <div style={{ background:'#f8fafc', borderRadius:12, padding:'12px 16px', marginBottom:20, display:'flex', gap:10 }}>
              <span style={{ fontSize:14 }}>📍</span>
              <div>
                <div style={{ fontSize:11, fontWeight:600, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.05em' }}>Pickup Location</div>
                <div style={{ fontSize:13, color:'#334155', marginTop:2 }}>{assignModal.pickup_address}</div>
              </div>
            </div>

            <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#64748b', letterSpacing:'0.03em', textTransform:'uppercase', marginBottom:8 }}>Select Driver</label>
            <select value={assignDrv} onChange={e=>setAssignDrv(e.target.value)} style={{...inp, marginBottom:24}}>
              <option value="">— Choose a driver —</option>
              {drivers.map(d=>(
                <option key={d.id} value={d.id}>{d.name} · {d.phone}{d.vehicle_number?` · ${d.vehicle_number}`:''}</option>
              ))}
            </select>

            <div style={{ display:'flex', gap:10 }}>
              <button onClick={()=>setAssign(null)} style={{ flex:1, padding:'12px', borderRadius:10, border:'1.5px solid #e2e8f0', background:'#fff', color:'#64748b', cursor:'pointer', fontSize:14, fontWeight:500 }}>Cancel</button>
              <button onClick={doAssign} disabled={!assignDrv||assigning} style={{
                flex:2, padding:'12px', borderRadius:10, border:'none',
                background: assignDrv ? 'linear-gradient(135deg,#F59713,#FDB944)' : '#f1f5f9',
                color: assignDrv ? '#fff' : '#94a3b8',
                fontWeight:700, cursor: assignDrv?'pointer':'not-allowed', fontSize:14,
                boxShadow: assignDrv ? '0 4px 16px rgba(245,151,19,0.3)' : 'none',
                transition:'all 0.2s',
              }}>{assigning?'Assigning…':'Assign & Dispatch 🚗'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── STATUS MODAL ── */}
      {statusModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.6)', backdropFilter:'blur(12px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:24 }}
          onClick={()=>setStatusMod(null)}>
          <div style={{ background:'#fff', borderRadius:24, padding:'36px', width:'100%', maxWidth:440, boxShadow:'0 40px 80px rgba(0,0,0,0.25)' }} onClick={e=>e.stopPropagation()}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:14, marginBottom:24 }}>
              <div style={{ width:48, height:48, borderRadius:14, background:S_COLOR[statusModal.status]?.bg||'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>📋</div>
              <div>
                <h2 style={{ fontSize:18, fontWeight:800, color:'#0f172a', margin:0, letterSpacing:'-0.3px' }}>Update Status</h2>
                <p style={{ color:'#64748b', fontSize:13, margin:'4px 0 0' }}>
                  RJ-{String(statusModal.id).padStart(5,'0')} · {statusModal.donor_name}
                </p>
              </div>
            </div>

            <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#64748b', letterSpacing:'0.03em', textTransform:'uppercase', marginBottom:8 }}>New Status</label>
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:24 }}>
              {Object.entries(S_LABEL).map(([val, label]) => {
                const selected = newStatus === val;
                const sc = S_COLOR[val];
                return (
                  <button key={val} onClick={()=>setNewStatus(val)} style={{
                    padding:'11px 16px', borderRadius:10, border:'1.5px solid',
                    borderColor: selected ? sc?.dot||'#0A2E1E' : '#e2e8f0',
                    background: selected ? sc?.bg||'#f0fdf4' : '#fff',
                    color: selected ? sc?.text||'#166534' : '#334155',
                    fontSize:13, cursor:'pointer', fontWeight: selected?700:500,
                    textAlign:'left', display:'flex', alignItems:'center', gap:10,
                    transition:'all 0.15s',
                  }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background: selected?sc?.dot:'#e2e8f0', transition:'background 0.15s', flexShrink:0 }}/>
                    {label}
                    {selected && <span style={{ marginLeft:'auto', fontSize:16 }}>✓</span>}
                  </button>
                );
              })}
            </div>

            <div style={{ display:'flex', gap:10 }}>
              <button onClick={()=>setStatusMod(null)} style={{ flex:1, padding:'12px', borderRadius:10, border:'1.5px solid #e2e8f0', background:'#fff', color:'#64748b', cursor:'pointer', fontSize:14, fontWeight:500 }}>Cancel</button>
              <button onClick={doStatus} disabled={updating} style={{
                flex:2, padding:'12px', borderRadius:10, border:'none',
                background:'linear-gradient(135deg,#0A2E1E,#145C3A)',
                color:'#fff', fontWeight:700, cursor:'pointer', fontSize:14,
                boxShadow:'0 4px 16px rgba(10,46,30,0.25)',
                opacity:updating?0.7:1,
              }}>{updating?'Updating…':'Save Status'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── DETAIL MODAL ── */}
      {detailModal && (() => {
        const req = detailModal;
        const sc = S_COLOR[req.status] || { bg:'#f9fafb', text:'#374151', dot:'#9ca3af' };
        const lc = S_LEFT[req.status] || '#e2e8f0';
        const thumbs = req.photo_path ? req.photo_path.split(',').map(p => UPLOADS + p) : [];
        return (
          <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.65)', backdropFilter:'blur(14px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:24 }}
            onClick={()=>setDetail(null)}>
            <div style={{ background:'#fff', borderRadius:24, width:'100%', maxWidth:540, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 40px 80px rgba(0,0,0,0.3)' }} onClick={e=>e.stopPropagation()}>

              {/* Header band */}
              <div style={{ background:`linear-gradient(135deg,#0F3D1F,#1B5E38)`, padding:'28px 28px 24px', borderRadius:'24px 24px 0 0', position:'relative' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 }}>
                  <div>
                    <div style={{ fontSize:11, fontWeight:700, letterSpacing:'2px', color:'rgba(196,150,60,0.9)', marginBottom:4 }}>REQUEST DETAILS</div>
                    <div style={{ fontSize:26, fontWeight:900, color:'#fff', letterSpacing:'-0.5px' }}>RJ-{String(req.id).padStart(5,'0')}</div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8 }}>
                    <button onClick={()=>setDetail(null)} style={{ background:'rgba(255,255,255,0.12)', border:'none', color:'#fff', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:13 }}>✕ Close</button>
                    <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:`${sc.dot}25`, border:`1px solid ${sc.dot}50`, borderRadius:50, padding:'5px 13px' }}>
                      <div style={{ width:6, height:6, borderRadius:'50%', background:sc.dot }}/>
                      <span style={{ fontSize:12, fontWeight:700, color:sc.dot }}>{S_LABEL[req.status]||req.status}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ padding:'24px 28px 32px' }}>

                {/* Food photos (submitted with request) */}
                {thumbs.length > 0 && (
                  <div style={{ marginBottom:20 }}>
                    <div style={{ fontSize:11, fontWeight:700, letterSpacing:'1.5px', color:'#94a3b8', textTransform:'uppercase', marginBottom:10 }}>Food Photos</div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(110px,1fr))', gap:8 }}>
                      {thumbs.map((url,i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={i} src={url} alt={`Photo ${i+1}`} onClick={()=>setLightbox(url)}
                          style={{ width:'100%', aspectRatio:'1', objectFit:'cover', borderRadius:12, cursor:'zoom-in', border:'1.5px solid #f0f4f8' }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Pickup photo (taken by driver) */}
                {req.pickup_photo && (
                  <div style={{ marginBottom:20 }}>
                    <div style={{ fontSize:11, fontWeight:700, letterSpacing:'1.5px', color:'#06b6d4', textTransform:'uppercase', marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
                      <span>📦</span> Pickup Photo · Driver
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={UPLOADS + req.pickup_photo}
                      alt="Driver pickup photo"
                      onClick={()=>setLightbox(UPLOADS + req.pickup_photo!)}
                      style={{ width:'100%', maxHeight:260, objectFit:'cover', borderRadius:14, cursor:'zoom-in', border:'2px solid #cffafe', display:'block' }}
                    />
                  </div>
                )}

                {/* Info grid */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px 24px', marginBottom:20 }}>
                  {[
                    { label:'Donor / Organisation', value: req.donor_name, span: false },
                    { label:'Phone', value: req.donor_phone || '—', link: req.donor_phone ? `tel:${req.donor_phone}` : undefined, span: false },
                    { label:'Food Type', value: req.food_type, span: false },
                    { label:'Serves', value: req.approx_kg ? `~${req.approx_kg} people` : '—', span: false },
                    { label:'Donor Address', value: req.donor_address || '—', span: true },
                    { label:'Pickup Address', value: req.pickup_address, span: true },
                    { label:'Ready By', value: req.ready_by ? new Date(req.ready_by).toLocaleString('en-IN',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—', span: false },
                    { label:'Submitted On', value: req.created_at ? new Date(req.created_at).toLocaleString('en-IN',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—', span: false },
                  ].map(item => (
                    <div key={item.label} style={{ gridColumn: item.span ? 'span 2' : undefined }}>
                      <div style={{ fontSize:10, fontWeight:700, letterSpacing:'1px', color:'#94a3b8', textTransform:'uppercase', marginBottom:3 }}>{item.label}</div>
                      {item.link
                        ? <a href={item.link} style={{ fontSize:14, color:'#1B5E38', fontWeight:600, textDecoration:'none' }}>{item.value}</a>
                        : <div style={{ fontSize:14, color:'#0f172a', fontWeight:500, lineHeight:1.4 }}>{item.value}</div>
                      }
                    </div>
                  ))}
                </div>

                {/* WhatsApp share */}
                {(() => {
                  const trackUrl = `https://rajyash.vercel.app/track?id=RJ-${String(req.id).padStart(5,'0')}`;
                  const msg = `Your Rajyash food pickup request (RJ-${String(req.id).padStart(5,'0')}) is being processed. Track live status here: ${trackUrl}`;
                  const waUrl = `https://wa.me/${(req.donor_phone||'').replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`;
                  return (
                    <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:12, padding:'12px 16px', marginBottom:20, display:'flex', alignItems:'center', gap:12 }}>
                      <span style={{ fontSize:20 }}>📲</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:12, fontWeight:700, color:'#166534', marginBottom:2 }}>Share Tracking Link</div>
                        <div style={{ fontSize:11, color:'#6B8A7A', wordBreak:'break-all' }}>{trackUrl}</div>
                      </div>
                      <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                        <a href={waUrl} target="_blank" rel="noopener noreferrer" style={{
                          padding:'7px 14px', borderRadius:8, background:'#25D366', color:'#fff',
                          fontSize:12, fontWeight:700, textDecoration:'none', display:'flex', alignItems:'center', gap:5,
                        }}>WhatsApp</a>
                        <button onClick={()=>navigator.clipboard.writeText(trackUrl)} style={{
                          padding:'7px 12px', borderRadius:8, border:'1.5px solid #bbf7d0',
                          background:'#fff', color:'#166534', fontSize:12, cursor:'pointer', fontWeight:600,
                        }}>Copy</button>
                      </div>
                    </div>
                  );
                })()}

                {/* Divider */}
                <div style={{ borderTop:'1.5px solid #f0ebe5', margin:'4px 0 16px' }}/>

                {/* Action buttons */}
                <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                  <button onClick={()=>{setStatusMod(req);setNewStatus(req.status);setDetail(null);}} style={{
                    flex:1, minWidth:120, padding:'11px 16px', borderRadius:10, border:'1.5px solid #e2e8f0',
                    background:'#fff', color:'#334155', fontSize:13, cursor:'pointer', fontWeight:600,
                  }}>✏️ Edit Status</button>
                  {['requested','under_review'].includes(req.status) && (
                    <button onClick={()=>{setAssign(req);setAssignDrv('');setDetail(null);}} style={{
                      flex:2, minWidth:160, padding:'11px 20px', borderRadius:10, border:'none',
                      background:'linear-gradient(135deg,#C4963C,#D4A84B)', color:'#fff',
                      fontSize:13, cursor:'pointer', fontWeight:700,
                      boxShadow:'0 4px 16px rgba(196,150,60,0.3)',
                    }}>🚗 Assign Driver</button>
                  )}
                  {req.status === 'assigned' && (
                    <button onClick={()=>{setAssign(req);setAssignDrv('');setDetail(null);}} style={{
                      flex:2, minWidth:160, padding:'11px 20px', borderRadius:10,
                      border:'1.5px solid #8b5cf6', background:'#f5f3ff', color:'#5b21b6',
                      fontSize:13, cursor:'pointer', fontWeight:700,
                    }}>↺ Reassign Driver</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── LIGHTBOX ── */}
      {lightbox && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.92)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:300, padding:24 }}
          onClick={()=>setLightbox(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="Full view" style={{ maxWidth:'90vw', maxHeight:'88vh', objectFit:'contain', borderRadius:12 }}/>
          <button onClick={()=>setLightbox(null)} style={{ position:'absolute', top:20, right:20, background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', color:'#fff', borderRadius:10, padding:'8px 16px', cursor:'pointer', fontSize:14, fontWeight:600 }}>✕ Close</button>
        </div>
      )}

    </div>
  );
}
