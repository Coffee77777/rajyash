'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
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
  photo_path?: string;
  pickup_photo?: string;
  delivery_photo?: string;
  driver_name?: string;
  driver_phone?: string;
  driver_id?: number;
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
  const [search, setSearch]         = useState('');
  const [dateFrom, setDateFrom]     = useState('');
  const [dateTo, setDateTo]         = useState('');
  const [activeTab, setActiveTab]   = useState<'requests'|'drivers'|'analytics'|'deliveries'>('requests');
  const [analytics, setAnalytics]   = useState<Record<string,unknown>|null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [newCount, setNewCount]     = useState(0);
  const lastCountRef                = useRef(0);
  const [notes, setNotes]           = useState<{id:number;note:string;created_at:string;admin_name:string}[]>([]);
  const [noteText, setNoteText]     = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [driverModal, setDriverModal]   = useState(false);
  const [driverForm, setDriverForm]     = useState({ name:'', phone:'', password:'', vehicle_number:'' });
  const [driverSaving, setDriverSaving] = useState(false);
  const [driverErr, setDriverErr]       = useState('');
  const [driverCreated, setDriverCreated] = useState<{name:string;phone:string;password:string}|null>(null);

  useEffect(() => {
    const t = sessionStorage.getItem('rj_admin_token');
    const n = sessionStorage.getItem('rj_admin_name');
    if (t) { setToken(t); setAdminName(n || 'Admin'); }
  }, []);

  const fetchAll = useCallback(async (tok: string) => {
    setLoading(true);
    try {
      const url = `${API}/requests.php`;
      const [rR, dR] = await Promise.all([
        fetch(url, { headers: { Authorization:`Bearer ${tok}` } }),
        fetch(`${API}/drivers.php`, { headers: { Authorization:`Bearer ${tok}` } }),
      ]);
      if (rR.ok) setRequests(await rR.json());
      if (dR.ok) setDrivers(await dR.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (token) fetchAll(token); }, [token, fetchAll]);

  // Auto-refresh every 60 s — show banner if new requests arrived
  useEffect(() => {
    if (!token) return;
    const iv = setInterval(async () => {
      try {
        const res = await fetch(`${API}/requests.php`, { headers: { Authorization:`Bearer ${token}` } });
        if (!res.ok) return;
        const data = await res.json();
        const incoming = data.filter((r: Request) => r.status === 'requested').length;
        if (lastCountRef.current > 0 && incoming > lastCountRef.current) {
          setNewCount(incoming - lastCountRef.current);
        }
        lastCountRef.current = incoming;
      } catch { /* silent */ }
    }, 60000);
    return () => clearInterval(iv);
  }, [token]);

  async function fetchNotes(requestId: number) {
    if (!token) return;
    try {
      const res = await fetch(`${API}/notes.php?request_id=${requestId}`, { headers: { Authorization:`Bearer ${token}` } });
      if (res.ok) setNotes(await res.json());
    } catch { /* silent */ }
  }

  async function addNote() {
    if (!detailModal || !noteText.trim()) return;
    setSavingNote(true);
    try {
      const res = await fetch(`${API}/notes.php?request_id=${detailModal.id}`, {
        method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`},
        body: JSON.stringify({ note: noteText.trim() }),
      });
      if (res.ok) { setNoteText(''); fetchNotes(detailModal.id); }
    } finally { setSavingNote(false); }
  }

  function exportCSV() {
    const headers = ['ID','Donor','Phone','Food Type','Serves','Pickup Address','Status','Driver','Ready By','Submitted On'];
    const rows = requests.map(r => [
      `RJ-${String(r.id).padStart(5,'0')}`,
      r.donor_name, r.donor_phone||'', r.food_type,
      r.approx_kg||'', r.pickup_address,
      S_LABEL[r.status]||r.status, r.driver_name||'',
      r.ready_by ? new Date(r.ready_by).toLocaleString('en-IN') : '',
      r.created_at ? new Date(r.created_at).toLocaleString('en-IN') : '',
    ].map(v => `"${String(v).replace(/"/g,'""')}"`));
    const csv = [headers.join(','), ...rows.map(r=>r.join(','))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type:'text/csv' }));
    a.download = `rajyash-requests-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  }

  async function addDriver() {
    setDriverErr('');
    if (!driverForm.name || !driverForm.phone || !driverForm.password || !driverForm.vehicle_number) {
      setDriverErr('Name, phone, password, and vehicle number are required'); return;
    }
    if (driverForm.password.length < 6) { setDriverErr('Password must be at least 6 characters'); return; }
    setDriverSaving(true);
    try {
      // 1. Create user with driver role
      const res = await fetch(`${API}/auth.php?action=register`, {
        method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`},
        body: JSON.stringify({ name: driverForm.name, phone: driverForm.phone, password: driverForm.password, role:'driver' }),
      });
      const d = await res.json();
      if (!res.ok) { setDriverErr(d.error || 'Failed to create driver'); return; }
      // 2. Create drivers record
      await fetch(`${API}/drivers.php`, {
        method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`},
        body: JSON.stringify({ user_id: d.id, vehicle_number: driverForm.vehicle_number }),
      });
      setDriverCreated({ name: driverForm.name, phone: driverForm.phone, password: driverForm.password });
      setDriverModal(false);
      setDriverForm({ name:'', phone:'', password:'', vehicle_number:'' });
      fetchAll(token!);
    } finally { setDriverSaving(false); }
  }

  const fetchAnalytics = useCallback(async (tok: string) => {
    setAnalyticsLoading(true);
    try {
      const res = await fetch(`${API}/analytics.php`, { headers: { Authorization:`Bearer ${tok}` } });
      if (res.ok) setAnalytics(await res.json());
    } finally { setAnalyticsLoading(false); }
  }, []);

  useEffect(() => {
    if (token && activeTab === 'analytics') fetchAnalytics(token);
  }, [token, activeTab, fetchAnalytics]);

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
      if (res.ok) { setAssign(null); setAssignDrv(''); fetchAll(token!); }
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
      if (res.ok) { setStatusMod(null); setNewStatus(''); fetchAll(token!); }
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

        <div style={{ position:'absolute', bottom:28, display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:24, height:1, background:'rgba(196,150,60,0.4)' }}/>
          <p style={{ color:'rgba(196,150,60,0.5)', fontSize:12, fontWeight:300, fontStyle:'italic', margin:0 }}>
            We rise by lifting others
          </p>
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
  const filters = ['','requested','under_review','assigned','accepted','ride_started','picked_up','delivered','closed','cancelled'];
  const stats = [
    { label:'Total Active',    count:requests.filter(r=>!['delivered','closed','cancelled'].includes(r.status)).length, icon:'📋', color:'#6366f1', light:'#eef2ff', filterKey:'' },
    { label:'Pending Review',  count:requests.filter(r=>r.status==='requested').length,  icon:'⏳', color:'#f59e0b', light:'#fefce8', filterKey:'requested' },
    { label:'Active Trips',    count:requests.filter(r=>['assigned','accepted','ride_started','picked_up'].includes(r.status)).length, icon:'🚗', color:'#f97316', light:'#fff7ed', filterKey:'assigned' },
    { label:'Delivered',       count:requests.filter(r=>r.status==='delivered').length,  icon:'✅', color:'#22c55e', light:'#f0fdf4', filterKey:'delivered' },
    { label:'Closed',          count:requests.filter(r=>r.status==='closed').length,     icon:'🔒', color:'#64748b', light:'#f9fafb', filterKey:'closed' },
  ];

  // Client-side filter: status + date range + search
  const q = search.toLowerCase();
  const DONE = ['delivered','closed'];
  const filtered = requests.filter(r => {
    // In requests tab, hide completed (they live in deliveries tab)
    if (activeTab === 'requests' && DONE.includes(r.status)) return false;
    // In deliveries tab, show only completed
    if (activeTab === 'deliveries' && !DONE.includes(r.status)) return false;
    // Status filter pill
    if (filterStatus && r.status !== filterStatus) return false;
    // Date range
    if (dateFrom && new Date(r.created_at) < new Date(dateFrom)) return false;
    if (dateTo && new Date(r.created_at) > new Date(dateTo + 'T23:59:59')) return false;
    // Text search
    if (!q) return true;
    return (
      r.donor_name.toLowerCase().includes(q) ||
      r.food_type.toLowerCase().includes(q) ||
      r.pickup_address.toLowerCase().includes(q) ||
      (r.donor_phone||'').includes(q) ||
      (r.driver_name||'').toLowerCase().includes(q) ||
      `rj-${String(r.id).padStart(5,'0')}`.includes(q)
    );
  });

  // Per-driver grouping for Drivers tab
  type DriverStat = { id: number; name: string; phone: string; total: number; delivered: number; active: number; reqs: Request[] };
  const driverMap: Record<number, DriverStat> = {};
  requests.forEach(r => {
    if (!r.driver_id || !r.driver_name) return;
    if (!driverMap[r.driver_id]) {
      driverMap[r.driver_id] = { id: r.driver_id, name: r.driver_name, phone: r.driver_phone||'', total:0, delivered:0, active:0, reqs:[] };
    }
    driverMap[r.driver_id].total++;
    driverMap[r.driver_id].reqs.push(r);
    if (r.status === 'delivered' || r.status === 'closed') driverMap[r.driver_id].delivered++;
    else if (['assigned','accepted','ride_started','picked_up'].includes(r.status)) driverMap[r.driver_id].active++;
  });
  const driverStats = Object.values(driverMap).sort((a,b) => b.delivered - a.delivered);

  return (
    <div style={{ minHeight:'100vh', background:'#f1f5f9', fontFamily:'Inter,system-ui,sans-serif', color:'#0f172a' }}>
      <style>{`
        @media (max-width: 640px) {
          .rj-admin-name-col { display: none !important; }
          .rj-header-subtitle { display: none !important; }
          .rj-tab-label { font-size: 11px !important; padding: 7px 10px !important; }
          .rj-page-pad { padding: 16px 12px !important; }
          .rj-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .rj-header-inner { padding: 0 12px !important; }
        }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{
        background:'#fff', borderBottom:'1px solid #e2e8f0',
        padding:'0 16px', height:64,
        display:'flex', alignItems:'center', justifyContent:'space-between',
        position:'sticky', top:0, zIndex:100,
        boxShadow:'0 1px 3px rgba(0,0,0,0.06)',
      }}>
        <div className="rj-header-inner" style={{ display:'flex', alignItems:'center', gap:14 }}>
          <Image src="/rajyash-logo.png" alt="Rajyash Foundation" width={130} height={44} style={{ objectFit:'contain' }} priority />
          <div style={{ width:1, height:28, background:'#e2e8f0' }}/>
          <div>
            <div style={{ fontWeight:700, color:'#0f172a', fontSize:14, lineHeight:1.1 }}>Admin Portal</div>
            <div className="rj-header-subtitle" style={{ fontSize:11, color:'#94a3b8' }}>Food Rescue Dashboard</div>
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div className="rj-admin-name-col" style={{ textAlign:'right' }}>
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

      <div className="rj-page-pad" style={{ maxWidth:1200, margin:'0 auto', padding:'28px 24px' }}>

        {/* ── PAGE TITLE + TABS ── */}
        <div style={{ marginBottom:24, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div>
            <h1 style={{ fontSize:24, fontWeight:800, color:'#0f172a', letterSpacing:'-0.5px', marginBottom:4 }}>
              {activeTab === 'requests' ? 'Requests Dashboard' : activeTab === 'deliveries' ? 'All Deliveries' : activeTab === 'drivers' ? 'Driver Deliveries' : 'Analytics'}
            </h1>
            <p style={{ fontSize:14, color:'#64748b' }}>
              {activeTab === 'requests' ? 'Active and pending food pickup requests' : activeTab === 'deliveries' ? 'Completed and closed deliveries' : activeTab === 'drivers' ? 'Per-driver delivery history and stats' : 'Impact metrics and operational data'}
            </p>
          </div>
          <div style={{ display:'flex', gap:6 }}>
            {(['requests','deliveries','drivers','analytics'] as const).map(tab => (
              <button key={tab} onClick={()=>setActiveTab(tab)} className="rj-tab-label" style={{
                padding:'8px 20px', borderRadius:10, border:'1.5px solid',
                borderColor: activeTab===tab ? '#1B5E38' : '#e2e8f0',
                background: activeTab===tab ? '#f0fdf4' : '#fff',
                color: activeTab===tab ? '#166534' : '#64748b',
                fontSize:13, cursor:'pointer', fontWeight: activeTab===tab ? 700 : 500,
                transition:'all 0.15s',
              }}>
                {tab === 'requests' ? '📋 Requests' : tab === 'deliveries' ? '📦 All Deliveries' : tab === 'drivers' ? '🚗 Drivers' : '📊 Analytics'}
              </button>
            ))}
          </div>
        </div>

        {/* ── NEW REQUEST BANNER ── */}
        {newCount > 0 && (
          <div style={{ background:'#fef9ec', border:'1.5px solid #fde68a', borderRadius:12, padding:'12px 16px', marginBottom:16, display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:'#f59e0b', boxShadow:'0 0 8px #f59e0b', flexShrink:0, animation:'pulse 1.5s infinite' }}/>
            <span style={{ fontSize:13, fontWeight:700, color:'#92400e', flex:1 }}>🔔 {newCount} new request{newCount>1?'s':''} arrived since you loaded</span>
            <button onClick={()=>{setNewCount(0);fetchAll(token!);}} style={{
              padding:'6px 14px', borderRadius:8, border:'1.5px solid #f59e0b', background:'#fff',
              color:'#92400e', fontSize:12, fontWeight:700, cursor:'pointer',
            }}>Refresh Now</button>
            <button onClick={()=>setNewCount(0)} style={{ background:'none', border:'none', color:'#b45309', cursor:'pointer', fontSize:16, padding:'0 4px' }}>✕</button>
          </div>
        )}

        {/* ── STATS ── */}
        <div className="rj-stats-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16, marginBottom:28 }}>
          {stats.map(s => (
            <div key={s.label} onClick={()=>{
            if (s.filterKey === 'delivered' || s.filterKey === 'closed') {
              setFilter(s.filterKey); setActiveTab('deliveries');
            } else if (s.filterKey) {
              setFilter(s.filterKey); setActiveTab('requests');
            }
          }} style={{
              background:'#fff', borderRadius:16, padding:'20px 22px',
              boxShadow:'0 1px 4px rgba(0,0,0,0.06)', border:'1px solid #f1f5f9',
              display:'flex', alignItems:'center', gap:16,
              transition:'box-shadow 0.2s, transform 0.2s',
              cursor: s.filterKey ? 'pointer' : 'default',
            }}
            onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.1)';e.currentTarget.style.transform='translateY(-2px)';}}
            onMouseLeave={e=>{e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,0.06)';e.currentTarget.style.transform='translateY(0)';}}>
              <div style={{ width:48, height:48, borderRadius:14, background:s.light, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>
                {s.icon}
              </div>
              <div>
                <div style={{ fontSize:28, fontWeight:800, color:s.color, lineHeight:1, letterSpacing:'-1px' }}>{s.count}</div>
                <div style={{ fontSize:12, color:'#94a3b8', marginTop:3, fontWeight:500 }}>{s.label}</div>
                {s.filterKey && <div style={{ fontSize:10, color:s.color, marginTop:2, fontWeight:600 }}>Click to filter →</div>}
              </div>
            </div>
          ))}
        </div>

        {/* ── SEARCH + FILTERS ── */}
        {(activeTab === 'requests' || activeTab === 'deliveries') && (
          <>
            <div style={{ background:'#fff', borderRadius:14, padding:'12px 16px', marginBottom:12, boxShadow:'0 1px 4px rgba(0,0,0,0.05)', border:'1px solid #f1f5f9', display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:16 }}>🔍</span>
              <input
                type="text" placeholder="Search by donor, food type, address, driver, RJ-ID…"
                value={search} onChange={e=>setSearch(e.target.value)}
                style={{ flex:1, border:'none', outline:'none', fontSize:14, color:'#0f172a', background:'transparent', fontFamily:'inherit' }}
              />
              {search && <button onClick={()=>setSearch('')} style={{ background:'none', border:'none', color:'#94a3b8', cursor:'pointer', fontSize:16, padding:'0 4px' }}>✕</button>}
            </div>

            <div style={{ background:'#fff', borderRadius:14, padding:'14px 16px', marginBottom:20, boxShadow:'0 1px 4px rgba(0,0,0,0.05)', border:'1px solid #f1f5f9', display:'flex', flexDirection:'column', gap:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
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
                  <button onClick={exportCSV} style={{
                    padding:'7px 14px', borderRadius:8, border:'1.5px solid #bbf7d0',
                    background:'#f0fdf4', color:'#166534', cursor:'pointer', fontSize:12, fontWeight:600,
                    display:'flex', alignItems:'center', gap:5,
                  }}>⬇ CSV</button>
                  <button onClick={()=>fetchAll(token!)} style={{
                    padding:'7px 16px', borderRadius:8, border:'1.5px solid #e2e8f0',
                    background:'#fff', color:'#64748b', cursor:'pointer', fontSize:13, fontWeight:500,
                    display:'flex', alignItems:'center', gap:6,
                  }}>
                    <span style={{ fontSize:14 }}>↻</span> Refresh
                  </button>
                </div>
              </div>
              <div style={{ width:'100%', display:'flex', alignItems:'center', gap:8, marginTop:10, paddingTop:10, borderTop:'1px solid #f1f5f9' }}>
                <span style={{ fontSize:11, color:'#94a3b8', fontWeight:500, whiteSpace:'nowrap' }}>Date</span>
                <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)}
                  style={{ flex:1, padding:'5px 10px', border:'1.5px solid #e2e8f0', borderRadius:8, fontSize:12, color:'#334155', background:'#fff', fontFamily:'inherit', outline:'none' }}/>
                <span style={{ fontSize:11, color:'#94a3b8' }}>to</span>
                <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)}
                  style={{ flex:1, padding:'5px 10px', border:'1.5px solid #e2e8f0', borderRadius:8, fontSize:12, color:'#334155', background:'#fff', fontFamily:'inherit', outline:'none' }}/>
                {(dateFrom||dateTo) && <button onClick={()=>{setDateFrom('');setDateTo('');}} style={{ padding:'5px 10px', borderRadius:8, border:'1.5px solid #e2e8f0', background:'#fff', color:'#94a3b8', cursor:'pointer', fontSize:12 }}>✕ Clear</button>}
              </div>
            </div>
          </>
        )}

        {/* ── DRIVERS TAB ── */}
        {activeTab === 'drivers' && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {/* All Registered Drivers */}
            <div style={{ background:'#fff', borderRadius:16, border:'1px solid #f1f5f9', boxShadow:'0 1px 4px rgba(0,0,0,0.05)', overflow:'hidden', marginBottom:8 }}>
              <div style={{ padding:'16px 20px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ fontWeight:700, color:'#0f172a', fontSize:15 }}>Registered Drivers <span style={{ fontSize:13, color:'#94a3b8', fontWeight:400 }}>({drivers.length})</span></div>
              </div>
              {drivers.length === 0 ? (
                <div style={{ padding:'28px', textAlign:'center', color:'#94a3b8', fontSize:14 }}>No drivers registered yet</div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column' }}>
                  {drivers.map((drv, i) => (
                    <div key={drv.id} style={{ padding:'14px 20px', display:'flex', alignItems:'center', gap:14, borderTop: i===0?'none':'1px solid #f8fafc' }}>
                      <div style={{ width:38, height:38, borderRadius:12, background:'linear-gradient(135deg,#0F3D1F,#1B5E38)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:15, flexShrink:0 }}>
                        {drv.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:700, color:'#0f172a', fontSize:14 }}>{drv.name}</div>
                        <div style={{ fontSize:12, color:'#64748b', marginTop:1 }}>
                          <a href={`tel:${drv.phone}`} style={{ color:'#1B5E38', textDecoration:'none' }}>{drv.phone}</a>
                          {drv.vehicle_number ? <span style={{ color:'#94a3b8' }}> · {drv.vehicle_number}</span> : <span style={{ color:'#cbd5e1' }}> · no vehicle#</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const newVehicle = window.prompt('Update vehicle number:', drv.vehicle_number || '');
                          if (newVehicle === null) return;
                          fetch(`${API}/drivers.php?id=${drv.id}`, {
                            method:'PUT', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`},
                            body: JSON.stringify({ vehicle_number: newVehicle }),
                          }).then(() => fetchAll(token!));
                        }}
                        style={{ padding:'6px 12px', borderRadius:8, border:'1.5px solid #e2e8f0', background:'#fff', color:'#64748b', fontSize:12, cursor:'pointer', fontWeight:500, flexShrink:0 }}>
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (!window.confirm(`Deactivate ${drv.name}? They won't be able to log in.`)) return;
                          fetch(`${API}/drivers.php?id=${drv.id}`, {
                            method:'PUT', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`},
                            body: JSON.stringify({ is_active: false }),
                          }).then(() => fetchAll(token!));
                        }}
                        style={{ padding:'6px 12px', borderRadius:8, border:'1.5px solid #fecaca', background:'#fef2f2', color:'#dc2626', fontSize:12, cursor:'pointer', fontWeight:600, flexShrink:0 }}>
                        Deactivate
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Add Driver button */}
            <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:8 }}>
              <button onClick={()=>{setDriverModal(true);setDriverErr('');}} style={{
                padding:'9px 20px', borderRadius:10, border:'none',
                background:'linear-gradient(135deg,#0F3D1F,#1B5E38)',
                color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer',
                display:'flex', alignItems:'center', gap:6,
                boxShadow:'0 4px 14px rgba(15,61,31,0.25)',
              }}>
                + Add Driver
              </button>
            </div>
            {driverStats.length === 0 ? (
              <div style={{ textAlign:'center', padding:60, background:'#fff', borderRadius:16, color:'#94a3b8' }}>
                <div style={{ fontSize:40, marginBottom:12 }}>🚗</div>
                <div style={{ fontSize:15, fontWeight:600, color:'#64748b' }}>No driver assignments yet</div>
              </div>
            ) : driverStats.map(drv => (
              <div key={drv.id} style={{ background:'#fff', borderRadius:18, border:'1px solid #f1f5f9', boxShadow:'0 1px 4px rgba(0,0,0,0.05)', overflow:'hidden' }}>
                {/* Driver header */}
                <div style={{ padding:'18px 20px', display:'flex', alignItems:'center', gap:14, borderBottom:'1px solid #f1f5f9' }}>
                  <div style={{ width:44, height:44, borderRadius:14, background:'linear-gradient(135deg,#0F3D1F,#1B5E38)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:18, flexShrink:0 }}>
                    {drv.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:800, color:'#0f172a', fontSize:16 }}>{drv.name}</div>
                    <a href={`tel:${drv.phone}`} style={{ fontSize:13, color:'#1B5E38', textDecoration:'none' }}>{drv.phone}</a>
                  </div>
                  <div style={{ display:'flex', gap:10 }}>
                    <div style={{ textAlign:'center', background:'#f0fdf4', borderRadius:10, padding:'8px 14px' }}>
                      <div style={{ fontSize:20, fontWeight:800, color:'#22c55e', lineHeight:1 }}>{drv.delivered}</div>
                      <div style={{ fontSize:10, color:'#6B8A7A', marginTop:2 }}>Delivered</div>
                    </div>
                    <div style={{ textAlign:'center', background:'#fff7ed', borderRadius:10, padding:'8px 14px' }}>
                      <div style={{ fontSize:20, fontWeight:800, color:'#f97316', lineHeight:1 }}>{drv.active}</div>
                      <div style={{ fontSize:10, color:'#9a3412', marginTop:2 }}>Active</div>
                    </div>
                    <div style={{ textAlign:'center', background:'#f8fafc', borderRadius:10, padding:'8px 14px' }}>
                      <div style={{ fontSize:20, fontWeight:800, color:'#64748b', lineHeight:1 }}>{drv.total}</div>
                      <div style={{ fontSize:10, color:'#94a3b8', marginTop:2 }}>Total</div>
                    </div>
                  </div>
                </div>
                {/* Trip list for this driver */}
                <div style={{ display:'flex', flexDirection:'column' }}>
                  {drv.reqs.map((req,i) => {
                    const sc = S_COLOR[req.status] || { bg:'#f9fafb', text:'#374151', dot:'#9ca3af' };
                    return (
                      <div key={req.id} onClick={()=>{ setDetail(req); setNotes([]); setNoteText(''); fetchNotes(req.id); }} style={{
                        padding:'12px 20px', display:'flex', alignItems:'center', gap:12,
                        borderTop: i===0 ? 'none' : '1px solid #f8fafc',
                        cursor:'pointer', transition:'background 0.15s',
                      }}
                      onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                        <div style={{ fontSize:12, fontWeight:700, color:'#C4963C', background:'#fef9ec', border:'1px solid #fde68a', borderRadius:20, padding:'2px 8px', flexShrink:0 }}>
                          RJ-{String(req.id).padStart(5,'0')}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:13, fontWeight:600, color:'#0f172a' }}>{req.donor_name}</div>
                          <div style={{ fontSize:12, color:'#94a3b8' }}>{req.food_type}{req.approx_kg ? ` · ${req.approx_kg} ppl` : ''}</div>
                        </div>
                        <div style={{ display:'inline-flex', alignItems:'center', gap:4, background:sc.bg, borderRadius:20, padding:'3px 9px', flexShrink:0 }}>
                          <div style={{ width:5, height:5, borderRadius:'50%', background:sc.dot }}/>
                          <span style={{ fontSize:11, fontWeight:700, color:sc.text }}>{S_LABEL[req.status]||req.status}</span>
                        </div>
                        <div style={{ fontSize:11, color:'#94a3b8', flexShrink:0 }}>
                          {new Date(req.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}
                        </div>
                        {req.pickup_photo && <span style={{ fontSize:14 }}>📷</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── ANALYTICS TAB ── */}
        {activeTab === 'analytics' && (
          analyticsLoading || !analytics ? (
            <div style={{ textAlign:'center', padding:80, color:'#94a3b8' }}>
              <div style={{ fontSize:32, marginBottom:12 }}>📊</div>
              <div style={{ fontSize:14 }}>Loading analytics…</div>
            </div>
          ) : (() => {
            const tm = analytics.this_month as Record<string,number> ?? {};
            const at = analytics.all_time as Record<string,number> ?? {};
            const dow = analytics.by_dow as {day:string;count:number}[] ?? [];
            const donors = analytics.top_donors as {name:string;trips:number;total_kg:number}[] ?? [];
            const monthly = analytics.monthly_trend as {month:string;total:number;delivered:number}[] ?? [];
            const breakdown = analytics.status_breakdown as Record<string,number> ?? {};
            const maxDow = Math.max(...dow.map(d=>d.count), 1);
            const maxMonthly = Math.max(...monthly.map(m=>m.total), 1);

            return (
              <div style={{ display:'flex', flexDirection:'column', gap:24 }}>

                {/* This Month stat cards */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:16 }}>
                  {[
                    { label:'This Month', value:tm.total??0, icon:'📋', color:'#6366f1', light:'#eef2ff' },
                    { label:'Delivered', value:tm.delivered??0, icon:'✅', color:'#22c55e', light:'#f0fdf4' },
                    { label:'People Served', value:Math.round(Number(tm.kg_rescued??0)), icon:'🙏', color:'#f59e0b', light:'#fefce8' },
                    { label:'Active Now', value:tm.active??0, icon:'🚗', color:'#f97316', light:'#fff7ed' },
                  ].map(s => (
                    <div key={s.label} style={{ background:'#fff', borderRadius:16, padding:'20px 22px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', border:'1px solid #f1f5f9', display:'flex', alignItems:'center', gap:14 }}>
                      <div style={{ width:44, height:44, borderRadius:12, background:s.light, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>{s.icon}</div>
                      <div>
                        <div style={{ fontSize:26, fontWeight:800, color:s.color, lineHeight:1, letterSpacing:'-0.5px' }}>{s.value.toLocaleString('en-IN')}</div>
                        <div style={{ fontSize:12, color:'#94a3b8', marginTop:3, fontWeight:500 }}>{s.label}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>

                  {/* Day of week chart */}
                  <div style={{ background:'#fff', borderRadius:16, padding:'24px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', border:'1px solid #f1f5f9' }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'#0f172a', marginBottom:20 }}>Requests by Day of Week <span style={{ fontSize:11, color:'#94a3b8', fontWeight:400 }}>(last 90 days)</span></div>
                    <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:100 }}>
                      {dow.map(d => (
                        <div key={d.day} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
                          <div style={{ fontSize:10, color:'#64748b', fontWeight:600 }}>{d.count}</div>
                          <div style={{
                            width:'100%', borderRadius:'4px 4px 0 0',
                            height:`${Math.max((d.count/maxDow)*80, 4)}px`,
                            background:'linear-gradient(180deg,#1B5E38,#2D8A56)',
                            transition:'height 0.5s',
                          }}/>
                          <div style={{ fontSize:10, color:'#94a3b8' }}>{d.day}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Monthly trend */}
                  <div style={{ background:'#fff', borderRadius:16, padding:'24px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', border:'1px solid #f1f5f9' }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'#0f172a', marginBottom:20 }}>Monthly Trend <span style={{ fontSize:11, color:'#94a3b8', fontWeight:400 }}>(last 6 months)</span></div>
                    <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:100 }}>
                      {monthly.map(m => (
                        <div key={m.month} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
                          <div style={{ fontSize:10, color:'#64748b', fontWeight:600 }}>{m.total}</div>
                          <div style={{ width:'100%', position:'relative', borderRadius:'4px 4px 0 0', height:`${Math.max((m.total/maxMonthly)*80, 4)}px`, background:'#e2e8f0' }}>
                            <div style={{ position:'absolute', bottom:0, left:0, right:0, borderRadius:'4px 4px 0 0', height:`${Math.max((Number(m.delivered)/maxMonthly)*80, 2)}px`, background:'linear-gradient(180deg,#22c55e,#16a34a)' }}/>
                          </div>
                          <div style={{ fontSize:10, color:'#94a3b8' }}>{m.month?.slice(5)}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display:'flex', gap:14, marginTop:12 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'#94a3b8' }}><div style={{ width:10, height:10, borderRadius:2, background:'#e2e8f0' }}/> Total</div>
                      <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'#94a3b8' }}><div style={{ width:10, height:10, borderRadius:2, background:'#22c55e' }}/> Delivered</div>
                    </div>
                  </div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>

                  {/* Top donors */}
                  <div style={{ background:'#fff', borderRadius:16, padding:'24px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', border:'1px solid #f1f5f9' }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'#0f172a', marginBottom:16 }}>Top Donors (All Time)</div>
                    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                      {donors.map((d,i) => (
                        <div key={i} style={{ display:'flex', alignItems:'center', gap:12 }}>
                          <div style={{ width:26, height:26, borderRadius:8, background: i===0?'#fef9ec':i===1?'#f1f5f9':'#f8fafc', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color: i===0?'#C4963C':i===1?'#94a3b8':'#cbd5e1', flexShrink:0 }}>{i+1}</div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:13, fontWeight:600, color:'#0f172a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.name}</div>
                            <div style={{ fontSize:11, color:'#94a3b8' }}>{d.trips} trips · {Math.round(d.total_kg)} kg</div>
                          </div>
                          <div style={{ fontSize:14, fontWeight:800, color:'#1B5E38' }}>{d.trips}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Status breakdown */}
                  <div style={{ background:'#fff', borderRadius:16, padding:'24px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', border:'1px solid #f1f5f9' }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'#0f172a', marginBottom:16 }}>All-Time Status Breakdown</div>
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      {Object.entries(S_LABEL).filter(([k]) => breakdown[k] > 0).sort(([,a],[,b])=>(breakdown[b]||0)-(breakdown[a]||0)).map(([status, label]) => {
                        const total = Object.values(breakdown).reduce((a,b)=>a+b,0)||1;
                        const pct = Math.round(((breakdown[status]||0)/total)*100);
                        const sc = S_COLOR[status];
                        return (
                          <div key={status}>
                            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                              <span style={{ fontSize:12, color:'#334155', fontWeight:500 }}>{label}</span>
                              <span style={{ fontSize:12, color:'#64748b' }}>{breakdown[status]||0} <span style={{ color:'#94a3b8' }}>({pct}%)</span></span>
                            </div>
                            <div style={{ height:6, borderRadius:3, background:'#f1f5f9', overflow:'hidden' }}>
                              <div style={{ height:'100%', width:`${pct}%`, borderRadius:3, background:sc?.dot||'#94a3b8', transition:'width 0.6s' }}/>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ marginTop:16, paddingTop:14, borderTop:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between' }}>
                      <span style={{ fontSize:12, color:'#94a3b8' }}>All time total</span>
                      <span style={{ fontSize:14, fontWeight:800, color:'#0f172a' }}>{at.total?.toLocaleString('en-IN') ?? 0} requests</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()
        )}

        {/* ── REQUEST CARDS ── */}
        {(activeTab === 'requests' || activeTab === 'deliveries') && (loading ? (
          <div style={{ textAlign:'center', padding:80, color:'#94a3b8' }}>
            <div style={{ fontSize:32, marginBottom:12 }}>⏳</div>
            <div style={{ fontSize:14 }}>Loading requests…</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:80, color:'#94a3b8', background:'#fff', borderRadius:16, border:'1px solid #f1f5f9' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>📭</div>
            <div style={{ fontSize:16, fontWeight:600, color:'#64748b' }}>{search ? 'No matches found' : 'No requests found'}</div>
            <div style={{ fontSize:13, marginTop:4 }}>{search ? 'Try different keywords' : 'Try a different filter or refresh'}</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {filtered.map(req => {
              const sc = S_COLOR[req.status] || { bg:'#f9fafb', text:'#374151', dot:'#9ca3af' };
              const lc = S_LEFT[req.status] || '#e2e8f0';
              const thumbs = req.photo_path ? req.photo_path.split(',').map(p => UPLOADS + p) : [];
              const isOverdue = ['requested','under_review'].includes(req.status) && req.ready_by && new Date(req.ready_by) < new Date();
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
                onClick={()=>{ setDetail(req); setNotes([]); setNoteText(''); fetchNotes(req.id); }}
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
                    {isOverdue && (
                      <div style={{ marginTop:4, display:'inline-flex', alignItems:'center', gap:4, background:'#fef2f2', border:'1px solid #fecaca', borderRadius:20, padding:'2px 8px' }}>
                        <span style={{ fontSize:10 }}>🔴</span>
                        <span style={{ fontSize:10, fontWeight:800, color:'#dc2626' }}>OVERDUE</span>
                      </div>
                    )}
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

                  {/* Time + driver */}
                  <div style={{ minWidth:110, textAlign:'right' }}>
                    <div style={{ fontSize:12, color:'#64748b', fontWeight:500 }}>
                      {new Date(req.ready_by).toLocaleDateString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}
                    </div>
                    <div style={{ fontSize:11, color:'#94a3b8', marginTop:3 }}>
                      {new Date(req.created_at).toLocaleDateString('en-IN')}
                    </div>
                    {req.driver_name && (
                      <div style={{ fontSize:11, color:'#1B5E38', marginTop:3, fontWeight:600 }}>🚗 {req.driver_name}</div>
                    )}
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
        ))}
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
                  <div style={{ marginBottom:16 }}>
                    <div style={{ fontSize:11, fontWeight:700, letterSpacing:'1.5px', color:'#06b6d4', textTransform:'uppercase', marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
                      <span>📦</span> Pickup Photo · Driver
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={UPLOADS + req.pickup_photo} alt="Pickup" onClick={()=>setLightbox(UPLOADS + req.pickup_photo!)}
                      style={{ width:'100%', maxHeight:220, objectFit:'cover', borderRadius:14, cursor:'zoom-in', border:'2px solid #cffafe', display:'block' }}
                    />
                  </div>
                )}

                {/* Delivery photos (comma-separated paths) */}
                {req.delivery_photo && (() => {
                  const photos = req.delivery_photo.split(',').map(p => p.trim()).filter(Boolean);
                  return (
                    <div style={{ marginBottom:20 }}>
                      <div style={{ fontSize:11, fontWeight:700, letterSpacing:'1.5px', color:'#22c55e', textTransform:'uppercase', marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
                        <span>✅</span> Delivery Photo{photos.length > 1 ? `s (${photos.length})` : ''} · Driver
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns: photos.length > 1 ? '1fr 1fr' : '1fr', gap:8 }}>
                        {photos.map((p, i) => (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img key={i} src={UPLOADS + p} alt={`Delivery ${i+1}`} onClick={()=>setLightbox(UPLOADS + p)}
                            style={{ width:'100%', maxHeight:220, objectFit:'cover', borderRadius:14, cursor:'zoom-in', border:'2px solid #bbf7d0', display:'block' }}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })()}

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
                    ...(req.driver_name ? [
                      { label:'Assigned Driver', value: req.driver_name, span: false },
                      { label:'Driver Phone', value: req.driver_phone||'—', link: req.driver_phone ? `tel:${req.driver_phone}` : undefined, span: false },
                    ] : []),
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

                {/* Thank-you WhatsApp — shown when delivered */}
                {(req.status === 'delivered' || req.status === 'closed') && (() => {
                  const kg = req.approx_kg ? ` serving approximately ${req.approx_kg} people` : '';
                  const msg = `Dear ${req.donor_name},\n\nThank you so much for your generous donation of ${req.food_type}${kg}! 🙏\n\nYour surplus food has reached families in need today through Rajyash Foundation. Every meal you give changes a life.\n\nTrack your impact: https://rajyash.vercel.app/track?id=RJ-${String(req.id).padStart(5,'0')}\n\n— Team Rajyash`;
                  const waUrl = `https://wa.me/${(req.donor_phone||'').replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`;
                  return (
                    <div style={{ background:'linear-gradient(135deg,#f0fdf4,#dcfce7)', border:'1.5px solid #86efac', borderRadius:12, padding:'14px 18px', marginBottom:20, display:'flex', alignItems:'center', gap:14 }}>
                      <span style={{ fontSize:24, flexShrink:0 }}>💛</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:700, color:'#166534', marginBottom:2 }}>Send a Thank You</div>
                        <div style={{ fontSize:11, color:'#6B8A7A', lineHeight:1.4 }}>Let {req.donor_name} know their food made a difference today.</div>
                      </div>
                      <a href={waUrl} target="_blank" rel="noopener noreferrer" style={{
                        padding:'9px 18px', borderRadius:10, background:'#25D366', color:'#fff',
                        fontSize:13, fontWeight:700, textDecoration:'none', display:'flex', alignItems:'center', gap:6,
                        flexShrink:0, boxShadow:'0 4px 12px rgba(37,211,102,0.3)',
                      }}>
                        WhatsApp 💚
                      </a>
                    </div>
                  );
                })()}

                {/* Notes */}
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontSize:11, fontWeight:700, letterSpacing:'1.5px', color:'#94a3b8', textTransform:'uppercase', marginBottom:10 }}>Internal Notes</div>
                  {notes.length > 0 && (
                    <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:12 }}>
                      {notes.map(n => (
                        <div key={n.id} style={{ background:'#f8fafc', borderRadius:10, padding:'10px 14px', borderLeft:'3px solid #e2e8f0' }}>
                          <div style={{ fontSize:13, color:'#334155', lineHeight:1.5 }}>{n.note}</div>
                          <div style={{ fontSize:11, color:'#94a3b8', marginTop:4 }}>{n.admin_name} · {new Date(n.created_at).toLocaleString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ display:'flex', gap:8 }}>
                    <input
                      type="text" placeholder="Add a note… (e.g. called donor, ready at 6pm)"
                      value={noteText} onChange={e=>setNoteText(e.target.value)}
                      onKeyDown={e=>{ if(e.key==='Enter') addNote(); }}
                      style={{ flex:1, padding:'9px 12px', border:'1.5px solid #e2e8f0', borderRadius:10, fontSize:13, fontFamily:'inherit', color:'#0f172a', background:'#fff', outline:'none' }}
                    />
                    <button onClick={addNote} disabled={savingNote||!noteText.trim()} style={{
                      padding:'9px 16px', borderRadius:10, border:'none',
                      background: noteText.trim() ? '#0f172a' : '#f1f5f9',
                      color: noteText.trim() ? '#fff' : '#94a3b8',
                      fontSize:13, fontWeight:700, cursor: noteText.trim()?'pointer':'not-allowed', flexShrink:0,
                    }}>{savingNote ? '…' : 'Save'}</button>
                  </div>
                </div>

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

      {/* ── ADD DRIVER MODAL ── */}
      {driverCreated && (
        <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.7)', backdropFilter:'blur(12px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:210, padding:24 }}
          onClick={()=>setDriverCreated(null)}>
          <div style={{ background:'#fff', borderRadius:24, padding:'36px', width:'100%', maxWidth:400, boxShadow:'0 40px 80px rgba(0,0,0,0.25)', textAlign:'center' }} onClick={e=>e.stopPropagation()}>
            <div style={{ fontSize:48, marginBottom:12 }}>✅</div>
            <h2 style={{ fontSize:20, fontWeight:800, color:'#0f172a', margin:'0 0 6px' }}>Driver Created!</h2>
            <p style={{ color:'#64748b', fontSize:13, margin:'0 0 24px' }}>Share these credentials with the driver</p>
            <div style={{ background:'#f8fafc', border:'1.5px solid #e2e8f0', borderRadius:14, padding:'20px', textAlign:'left', marginBottom:20, fontFamily:'monospace', fontSize:14 }}>
              <div style={{ marginBottom:10 }}><span style={{ color:'#64748b', fontFamily:'sans-serif', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em' }}>Name</span><br/><strong style={{ color:'#0f172a', fontSize:15 }}>{driverCreated.name}</strong></div>
              <div style={{ marginBottom:10 }}><span style={{ color:'#64748b', fontFamily:'sans-serif', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em' }}>Phone</span><br/><strong style={{ color:'#0f172a', fontSize:15 }}>{driverCreated.phone}</strong></div>
              <div><span style={{ color:'#64748b', fontFamily:'sans-serif', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em' }}>Password</span><br/><strong style={{ color:'#0f172a', fontSize:15 }}>{driverCreated.password}</strong></div>
            </div>
            <a href="/driver" target="_blank" rel="noopener noreferrer"
              style={{ display:'block', padding:'13px', borderRadius:12, background:'linear-gradient(135deg,#0F3D1F,#1B5E38)', color:'#fff', fontWeight:700, fontSize:14, textDecoration:'none', marginBottom:12, boxShadow:'0 4px 16px rgba(10,46,30,0.25)' }}>
              🚗 Open Driver Portal
            </a>
            <button onClick={()=>setDriverCreated(null)} style={{ width:'100%', padding:'11px', borderRadius:10, border:'1.5px solid #e2e8f0', background:'transparent', color:'#64748b', cursor:'pointer', fontSize:14, fontWeight:500 }}>Close</button>
          </div>
        </div>
      )}

      {driverModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.6)', backdropFilter:'blur(12px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:24 }}
          onClick={()=>setDriverModal(false)}>
          <div style={{ background:'#fff', borderRadius:24, padding:'36px', width:'100%', maxWidth:440, boxShadow:'0 40px 80px rgba(0,0,0,0.25)' }} onClick={e=>e.stopPropagation()}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:14, marginBottom:24 }}>
              <div style={{ width:48, height:48, borderRadius:14, background:'#f0fdf4', border:'1.5px solid #bbf7d0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>🚗</div>
              <div>
                <h2 style={{ fontSize:18, fontWeight:800, color:'#0f172a', margin:0, letterSpacing:'-0.3px' }}>Add New Driver</h2>
                <p style={{ color:'#64748b', fontSize:13, margin:'4px 0 0' }}>Driver can log in with phone + password</p>
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {[
                { key:'name', label:'Full Name', placeholder:'e.g. Ramesh Patel', type:'text' },
                { key:'phone', label:'Phone Number', placeholder:'e.g. 9876543210', type:'tel' },
                { key:'password', label:'Password', placeholder:'Min. 6 characters', type:'password' },
                { key:'vehicle_number', label:'Vehicle Number', placeholder:'e.g. GJ-01-AB-1234', type:'text' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:6 }}>{f.label}</label>
                  <input
                    type={f.type} placeholder={f.placeholder}
                    value={driverForm[f.key as keyof typeof driverForm]}
                    onChange={e => setDriverForm(p => ({...p, [f.key]: e.target.value}))}
                    style={{ ...inp }}
                    onFocus={e=>{e.target.style.borderColor='#1B5E38';e.target.style.boxShadow='0 0 0 3px rgba(27,94,56,0.1)';}}
                    onBlur={e=>{e.target.style.borderColor='#e2e8f0';e.target.style.boxShadow='none';}}
                  />
                </div>
              ))}
            </div>
            {driverErr && (
              <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, padding:'10px 14px', color:'#dc2626', fontSize:13, marginTop:14 }}>
                ⚠️ {driverErr}
              </div>
            )}
            <div style={{ display:'flex', gap:10, marginTop:24 }}>
              <button onClick={()=>setDriverModal(false)} style={{ flex:1, padding:'12px', borderRadius:10, border:'1.5px solid #e2e8f0', background:'#fff', color:'#64748b', cursor:'pointer', fontSize:14, fontWeight:500 }}>Cancel</button>
              <button onClick={addDriver} disabled={driverSaving} style={{
                flex:2, padding:'12px', borderRadius:10, border:'none',
                background:'linear-gradient(135deg,#0F3D1F,#1B5E38)',
                color:'#fff', fontWeight:700, cursor:'pointer', fontSize:14,
                boxShadow:'0 4px 16px rgba(10,46,30,0.25)',
                opacity:driverSaving?0.7:1,
              }}>{driverSaving ? 'Creating…' : 'Create Driver Account'}</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
