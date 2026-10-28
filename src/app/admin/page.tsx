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
    <div style={{ minHeight:'100vh', fontFamily:'Inter,system-ui,sans-serif',
      background:'linear-gradient(135deg,#0A2E1E 0%,#145C3A 60%,#0d3a25 100%)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>

      {/* Decorative blobs */}
      <div style={{ position:'fixed', top:-100, right:-100, width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle,rgba(245,151,19,0.12),transparent 70%)', pointerEvents:'none' }}/>
      <div style={{ position:'fixed', bottom:-80, left:-80, width:320, height:320, borderRadius:'50%', background:'radial-gradient(circle,rgba(34,197,94,0.08),transparent 70%)', pointerEvents:'none' }}/>

      <div style={{ width:'100%', maxWidth:420, position:'relative' }}>
        {/* Card */}
        <div style={{ background:'rgba(255,255,255,0.97)', borderRadius:24, padding:'48px 40px', boxShadow:'0 40px 100px rgba(0,0,0,0.35)' }}>
          {/* Logo */}
          <div style={{ textAlign:'center', marginBottom:36 }}>
            <div style={{ width:64, height:64, borderRadius:20, margin:'0 auto 18px', display:'flex', alignItems:'center', justifyContent:'center',
              background:'linear-gradient(145deg,#0A2E1E,#145C3A)', boxShadow:'0 8px 24px rgba(10,46,30,0.35)' }}>
              <svg width="28" height="28" viewBox="0 0 22 22" fill="none">
                <path d="M11 2C11 2 5 6 5 12C5 15.3 7.7 18 11 18C14.3 18 17 15.3 17 12C17 6 11 2 11 2Z" fill="white"/>
                <path d="M11 18V21M8 21H14" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>
            <div style={{ fontSize:22, fontWeight:800, color:'#0A2E1E', letterSpacing:'-0.5px' }}>Admin Portal</div>
            <div style={{ fontSize:13, color:'#94a3b8', marginTop:4 }}>Rajyash Foundation</div>
          </div>

          <form onSubmit={doLogin}>
            {['Phone Number','Password'].map((label, i) => (
              <div key={label} style={{ marginBottom: i===0 ? 14 : 22 }}>
                <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#64748b', letterSpacing:'0.03em', textTransform:'uppercase', marginBottom:7 }}>{label}</label>
                <input
                  type={i===0?'tel':'password'} required
                  value={i===0?phone:password}
                  onChange={e => i===0?setPhone(e.target.value):setPassword(e.target.value)}
                  placeholder={i===0?'10-digit number':'••••••••'}
                  style={inp}
                  onFocus={e=>{e.target.style.borderColor='#0A2E1E';e.target.style.boxShadow='0 0 0 3px rgba(10,46,30,0.1)';}}
                  onBlur={e=>{e.target.style.borderColor='#e2e8f0';e.target.style.boxShadow='none';}}
                />
              </div>
            ))}

            {loginErr && (
              <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, padding:'10px 14px', color:'#dc2626', fontSize:13, fontWeight:500, marginBottom:16 }}>
                {loginErr}
              </div>
            )}

            <button type="submit" disabled={logging} style={{
              width:'100%', padding:'14px', borderRadius:12, border:'none',
              background:'linear-gradient(135deg,#0A2E1E,#145C3A)',
              color:'#fff', fontWeight:700, fontSize:15, cursor:'pointer',
              boxShadow:'0 4px 20px rgba(10,46,30,0.3)',
              opacity:logging?0.7:1, transition:'opacity 0.2s, transform 0.2s',
            }}
            onMouseEnter={e=>{if(!logging)(e.currentTarget.style.transform='translateY(-1px)');}}
            onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';}}
            >{logging?'Signing in…':'Sign In'}</button>
          </form>
        </div>

        <div style={{ textAlign:'center', marginTop:20, color:'rgba(255,255,255,0.3)', fontSize:12 }}>
          Rajyash Foundation · Secure Admin Access
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
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(145deg,#0A2E1E,#145C3A)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
              <path d="M11 2C11 2 5 6 5 12C5 15.3 7.7 18 11 18C14.3 18 17 15.3 17 12C17 6 11 2 11 2Z" fill="white"/>
              <path d="M11 18V21M8 21H14" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <div style={{ fontWeight:700, color:'#0f172a', fontSize:15, lineHeight:1.1 }}>Rajyash Admin</div>
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
              return (
                <div key={req.id} style={{
                  background:'#fff', borderRadius:14,
                  border:'1px solid #f1f5f9',
                  borderLeft:`4px solid ${lc}`,
                  padding:'18px 20px 18px 22px',
                  display:'flex', alignItems:'center', gap:18, flexWrap:'wrap',
                  boxShadow:'0 1px 3px rgba(0,0,0,0.05)',
                  transition:'box-shadow 0.2s, transform 0.2s',
                }}
                onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.09)';e.currentTarget.style.transform='translateY(-1px)';}}
                onMouseLeave={e=>{e.currentTarget.style.boxShadow='0 1px 3px rgba(0,0,0,0.05)';e.currentTarget.style.transform='translateY(0)';}}>

                  {/* ID */}
                  <div style={{ minWidth:88 }}>
                    <div style={{ fontWeight:800, color:'#0f172a', fontSize:14, letterSpacing:'-0.3px' }}>
                      RJ-{String(req.id).padStart(5,'0')}
                    </div>
                    <div style={{ marginTop:6, display:'inline-flex', alignItems:'center', gap:5, padding:'3px 9px', borderRadius:20, background:sc.bg }}>
                      <div style={{ width:5, height:5, borderRadius:'50%', background:sc.dot, boxShadow:`0 0 4px ${sc.dot}` }}/>
                      <span style={{ fontSize:11, fontWeight:700, color:sc.text }}>{S_LABEL[req.status]||req.status}</span>
                    </div>
                  </div>

                  {/* Donor avatar + info */}
                  <div style={{ display:'flex', alignItems:'center', gap:12, flex:1, minWidth:200 }}>
                    <div style={{ width:40, height:40, borderRadius:12, background:`${lc}18`, border:`1.5px solid ${lc}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:700, color:lc, flexShrink:0 }}>
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
                  <div style={{ display:'flex', gap:8 }}>
                    <button onClick={()=>{setStatusMod(req);setNewStatus(req.status);}} style={{
                      padding:'7px 14px', borderRadius:8, border:'1.5px solid #e2e8f0',
                      background:'#fff', color:'#64748b', fontSize:12, cursor:'pointer', fontWeight:500,
                      transition:'all 0.15s',
                    }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor='#cbd5e1';e.currentTarget.style.background='#f8fafc';}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor='#e2e8f0';e.currentTarget.style.background='#fff';}}>
                      Edit Status
                    </button>
                    {['requested','under_review','assigned'].includes(req.status) && (
                      <button onClick={()=>{setAssign(req);setAssignDrv('');}} style={{
                        padding:'7px 16px', borderRadius:8, border:'1.5px solid #F59713',
                        background:'linear-gradient(135deg,#fff9ec,#fffdf5)', color:'#b45309',
                        fontSize:12, cursor:'pointer', fontWeight:700,
                        transition:'all 0.15s', display:'flex', alignItems:'center', gap:5,
                        boxShadow:'0 1px 4px rgba(245,151,19,0.15)',
                      }}
                      onMouseEnter={e=>{e.currentTarget.style.background='linear-gradient(135deg,#F59713,#FDB944)';e.currentTarget.style.color='#fff';}}
                      onMouseLeave={e=>{e.currentTarget.style.background='linear-gradient(135deg,#fff9ec,#fffdf5)';e.currentTarget.style.color='#b45309';}}>
                        🚗 Assign Driver
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
    </div>
  );
}
