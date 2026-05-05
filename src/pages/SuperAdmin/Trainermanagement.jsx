// src/pages/SuperAdmin/TrainerManagement.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Plus, Search, SquarePen, Trash2, Eye,
  Phone, Mail, BookOpen, Award, ChevronLeft, ChevronRight, X,
} from 'lucide-react';
import SuperAdminDashboardLayout from '../../components/layout/SuperAdminDashboardLayout';
import ActionMenu from '../../components/common/ActionMenu';

/* ─── Inline Toast ─────────────────────────────────── */
let _tid = 0;
const useLocalToast = () => {
  const [toasts, setToasts] = useState([]);
  const add = (type, title, message) => {
    const id = ++_tid;
    setToasts(p => [...p, { id, type, title, message }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  };
  return {
    toasts,
    success: (title, msg) => add('success', title, msg),
    error:   (title, msg) => add('error',   title, msg),
    info:    (title, msg) => add('info',    title, msg),
  };
};

const TOAST_STYLES = {
  success: { bar: '#10b981', bg: '#f0fdf4', text: '#065f46', icon: '✓' },
  error:   { bar: '#ef4444', bg: '#fef2f2', text: '#991b1b', icon: '✕' },
  info:    { bar: '#003399', bg: '#eff6ff', text: '#1e3a8a', icon: 'i' },
};

const ToastContainer = ({ toasts }) => {
  if (!toasts.length) return null;
  return (
    <div className="fixed top-5 right-5 z-[999] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => {
        const c = TOAST_STYLES[t.type] || TOAST_STYLES.info;
        return (
          <div key={t.id}
            className="pointer-events-auto flex items-start gap-3 rounded-xl border shadow-lg px-4 py-3 min-w-[260px] max-w-[320px]"
            style={{ background: c.bg, borderColor: `${c.bar}30`, animation: 'tmSlide .25s ease' }}>
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white flex-shrink-0 mt-0.5"
              style={{ background: c.bar }}>{c.icon}</span>
            <div>
              <p className="text-xs font-black" style={{ color: c.text }}>{t.title}</p>
              {t.message && <p className="text-[11px] mt-0.5" style={{ color: c.text, opacity: 0.75 }}>{t.message}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ─── Static Data ──────────────────────────────────── */
const SEED_TRAINERS = [
  { _id:'1',  fullName:'Arjun Kumar',        email:'arjun@trainpro.in',     phone:'+91 98765 43210', specialization:'React & Node.js',      experienceYears:5, isActive:true,  createdAt:'2024-06-01' },
  { _id:'2',  fullName:'Priya Sharma',        email:'priya.s@trainpro.in',   phone:'+91 91234 56780', specialization:'Data Science',         experienceYears:7, isActive:true,  createdAt:'2024-05-15' },
  { _id:'3',  fullName:'Rahul Verma',         email:'rahul.v@trainpro.in',   phone:'+91 87654 32190', specialization:'DevOps & Cloud',       experienceYears:4, isActive:false, createdAt:'2024-04-20' },
  { _id:'4',  fullName:'Nithya Raj',          email:'nithya.r@trainpro.in',  phone:'+91 99887 76654', specialization:'UI/UX Design',         experienceYears:3, isActive:true,  createdAt:'2024-03-10' },
  { _id:'5',  fullName:'Suresh Mohan',        email:'suresh.m@trainpro.in',  phone:'+91 77665 54432', specialization:'Java & Spring',        experienceYears:8, isActive:false, createdAt:'2024-02-28' },
  { _id:'6',  fullName:'Deepika Krishnan',    email:'deepika.k@trainpro.in', phone:'+91 88990 01122', specialization:'ML & Python',          experienceYears:6, isActive:true,  createdAt:'2024-01-05' },
  { _id:'7',  fullName:'Karthik Rajan',       email:'karthik.r@trainpro.in', phone:'+91 95544 33211', specialization:'Angular & TypeScript', experienceYears:5, isActive:true,  createdAt:'2023-12-15' },
  { _id:'8',  fullName:'Meena Sundaram',      email:'meena.s@trainpro.in',   phone:'+91 80011 22334', specialization:'Cybersecurity',        experienceYears:9, isActive:true,  createdAt:'2023-11-01' },
  { _id:'9',  fullName:'Vijay Anand',         email:'vijay.a@trainpro.in',   phone:'+91 70022 11445', specialization:'Blockchain',           experienceYears:2, isActive:false, createdAt:'2023-10-20' },
  { _id:'10', fullName:'Lakshmi Narayanan',   email:'lakshmi.n@trainpro.in', phone:'+91 63300 44556', specialization:'QA & Automation',      experienceYears:6, isActive:true,  createdAt:'2023-09-08' },
  { _id:'11', fullName:'Arun Prasad',         email:'arun.p@trainpro.in',    phone:'+91 99001 22333', specialization:'Flutter & Dart',       experienceYears:3, isActive:true,  createdAt:'2023-08-14' },
  { _id:'12', fullName:'Divya Subramanian',   email:'divya.s@trainpro.in',   phone:'+91 88123 99001', specialization:'Cloud Architecture',   experienceYears:7, isActive:false, createdAt:'2023-07-01' },
];

const PAGE_SIZE = 10;
const calcStats = list => { const a = list.filter(t => t.isActive).length; return { total: list.length, active: a, inactive: list.length - a }; };

/* ─── Sub-components ───────────────────────────────── */
const StatPill = ({ label, value, color }) => (
  <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-4 py-3 flex items-center gap-3">
    <span className={`w-2 h-8 rounded-full flex-shrink-0 ${color}`} />
    <div>
      <p className="text-xl font-black text-slate-900 leading-none">{value}</p>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{label}</p>
    </div>
  </div>
);

const Pagination = ({ page, total, totalPages, pageSize, onPageChange }) => {
  if (totalPages <= 1) return null;
  const from = (page - 1) * pageSize + 1, to = Math.min(page * pageSize, total);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce((acc, p, i, arr) => { if (i > 0 && p - arr[i-1] > 1) acc.push('…'); acc.push(p); return acc; }, []);
  return (
    <div className="px-4 sm:px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white">
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Showing {from}–{to} of {total}</span>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(page-1)} disabled={page===1} className="p-1.5 rounded-lg border border-slate-100 text-slate-400 hover:border-[#003399]/30 hover:text-[#003399] disabled:opacity-40 transition-all"><ChevronLeft className="w-3.5 h-3.5"/></button>
        {pages.map((p,i) => p==='…' ? <span key={`e${i}`} className="px-1.5 text-slate-300 text-xs">…</span>
          : <button key={p} onClick={()=>onPageChange(p)} className={`w-7 h-7 rounded-lg text-xs font-black transition-all ${p===page?'bg-[#003399] text-white shadow-md':'border border-slate-100 text-slate-500 hover:border-[#003399]/30 hover:text-[#003399]'}`}>{p}</button>)}
        <button onClick={()=>onPageChange(page+1)} disabled={page===totalPages} className="p-1.5 rounded-lg border border-slate-100 text-slate-400 hover:border-[#003399]/30 hover:text-[#003399] disabled:opacity-40 transition-all"><ChevronRight className="w-3.5 h-3.5"/></button>
      </div>
    </div>
  );
};

const TrainerMobileCard = ({ trainer, onToggle, onDelete, navigate }) => (
  <div className="p-4 border-b border-slate-100 last:border-0">
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#003399] to-[#00A9CE] flex items-center justify-center flex-shrink-0 shadow-sm">
          <span className="text-[10px] font-black text-white">{(trainer.fullName||'T').substring(0,2).toUpperCase()}</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-800 truncate">{trainer.fullName}</p>
          <p className="text-[11px] text-slate-400 truncate">{trainer.email}</p>
        </div>
      </div>
      <button onClick={() => onToggle(trainer._id, trainer.isActive)}
        className={`inline-flex items-center px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-md border flex-shrink-0 transition-all ${trainer.isActive?'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20':'bg-rose-50 text-rose-500 border-rose-100'}`}>
        {trainer.isActive?'Active':'Inactive'}
      </button>
    </div>
    <div className="mt-2.5 flex flex-wrap gap-2 text-[11px] text-slate-500">
      {trainer.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3"/>{trainer.phone}</span>}
      {trainer.specialization && <span className="flex items-center gap-1 text-[#0077a8]"><BookOpen className="w-3 h-3"/>{trainer.specialization}</span>}
      {trainer.experienceYears!=null && <span className="flex items-center gap-1 text-amber-500"><Award className="w-3 h-3"/>{trainer.experienceYears}y exp</span>}
    </div>
    <div className="mt-3 flex gap-2">
      <button onClick={()=>navigate(`/dashboard/super-admin/trainers/${trainer._id}`)} className="flex items-center gap-1 text-[11px] font-bold text-slate-600 px-3 py-1.5 rounded-lg border border-slate-100 hover:bg-slate-50 transition-all"><Eye className="w-3 h-3"/>View</button>
      <button onClick={()=>navigate(`/dashboard/super-admin/trainers/edit/${trainer._id}`)} className="flex items-center gap-1 text-[11px] font-bold text-[#00A9CE] px-3 py-1.5 rounded-lg border border-[#00A9CE]/20 hover:bg-[#00A9CE]/5 transition-all"><SquarePen className="w-3 h-3"/>Edit</button>
      <button onClick={()=>onDelete(trainer._id, trainer.fullName)} className="flex items-center gap-1 text-[11px] font-bold text-rose-500 px-3 py-1.5 rounded-lg border border-rose-100 hover:bg-rose-50 transition-all"><Trash2 className="w-3 h-3"/>Delete</button>
    </div>
  </div>
);

/* ─── Main ─────────────────────────────────────────── */
const TrainerManagement = () => {
  const navigate = useNavigate();
  const toast    = useLocalToast();

  const [trainers,     setTrainers]     = useState(SEED_TRAINERS);
  const [searchTerm,   setSearchTerm]   = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page,         setPage]         = useState(1);

  const stats = calcStats(trainers);

  const handleDelete = (id, name) => {
    if (!window.confirm(`Delete ${name}?`)) return;
    setTrainers(p => p.filter(t => t._id !== id));
    toast.success('Deleted', `${name} removed successfully`);
  };

  const handleToggle = (id, current) => {
    setTrainers(p => p.map(t => t._id === id ? { ...t, isActive: !current } : t));
    toast.info('Updated', `Trainer ${current ? 'deactivated' : 'activated'}`);
  };

  const filtered = trainers.filter(t => {
    const q = searchTerm.toLowerCase();
    return (t.fullName?.toLowerCase().includes(q) || t.email?.toLowerCase().includes(q) || t.specialization?.toLowerCase().includes(q))
      && (filterStatus === 'all' || (filterStatus === 'active' && t.isActive) || (filterStatus === 'inactive' && !t.isActive));
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  return (
    <SuperAdminDashboardLayout>
      <style>{`@keyframes tmSlide{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}`}</style>
      <ToastContainer toasts={toast.toasts} />

      <div className="px-4 py-4 sm:px-6 md:px-8 md:py-6 space-y-5 font-sans">

        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2 h-8 bg-gradient-to-b from-[#003399] to-[#00A9CE] rounded-full"/>
              Manage Trainers
            </h1>
            <p className="text-sm text-slate-400 mt-1 font-medium">Manage platform trainers — {stats.total} total</p>
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 sm:min-w-[240px] lg:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4"/>
              <input type="text" placeholder="Search by name, email or specialization…" value={searchTerm}
                onChange={e=>{setSearchTerm(e.target.value);setPage(1);}}
                className="w-full pl-9 pr-8 py-2.5 text-xs font-bold border border-slate-100 rounded-xl focus:outline-none focus:border-[#003399]/30 bg-white"/>
              {searchTerm && <button onClick={()=>setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"><X className="w-3.5 h-3.5"/></button>}
            </div>
            <select value={filterStatus} onChange={e=>{setFilterStatus(e.target.value);setPage(1);}}
              className="pl-4 pr-8 py-2.5 text-xs font-black uppercase tracking-wider border border-slate-100 rounded-xl focus:outline-none focus:border-[#003399]/30 bg-white appearance-none cursor-pointer text-slate-600">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <button onClick={()=>navigate('/dashboard/super-admin/trainers/create')}
              className="inline-flex items-center justify-center gap-2 bg-[#003399] text-white text-[11px] font-black uppercase tracking-wider px-5 py-2.5 rounded-xl hover:bg-[#002d8b] transition-all shadow-lg shadow-blue-500/10 active:scale-95">
              <Plus className="w-4 h-4"/> Add Trainer
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatPill label="Total"    value={stats.total}    color="bg-gradient-to-b from-[#003399] to-[#00A9CE]"/>
          <StatPill label="Active"   value={stats.active}   color="bg-gradient-to-b from-emerald-400 to-emerald-500"/>
          <StatPill label="Inactive" value={stats.inactive} color="bg-gradient-to-b from-slate-300 to-slate-400"/>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {paginated.length > 0 ? (<>
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full table-fixed">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    {[['S.No','w-[55px]'],['Trainer Name','w-[170px]'],['Email','w-[190px]'],['Phone','w-[140px]'],['Specialization','w-[160px]'],['Exp.','w-[65px]'],['Status','w-[100px]'],['Actions','w-[80px]']].map(([h,w],i)=>(
                      <th key={h} className={`px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest ${i===7?'text-center':'text-left'} ${w}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginated.map((trainer, index) => {
                    const sNo = (page-1)*PAGE_SIZE + index + 1;
                    return (
                      <tr key={trainer._id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-4 py-4 text-xs font-bold text-slate-400">{String(sNo).padStart(2,'0')}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#003399] to-[#00A9CE] flex items-center justify-center flex-shrink-0 shadow-sm">
                              <span className="text-[10px] font-black text-white">{(trainer.fullName||'T').substring(0,2).toUpperCase()}</span>
                            </div>
                            <p className="text-sm font-bold text-slate-800 truncate">{trainer.fullName||'N/A'}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1.5 truncate">
                            <Mail className="w-3 h-3 text-slate-300 flex-shrink-0"/>
                            <span className="text-xs font-medium text-slate-500 truncate">{trainer.email||'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {trainer.phone
                            ? <div className="flex items-center gap-1 text-[11px] text-slate-500 truncate"><Phone className="w-3 h-3 text-slate-400 flex-shrink-0"/><span className="truncate">{trainer.phone}</span></div>
                            : <span className="text-[10px] text-slate-300 italic">N/A</span>}
                        </td>
                        <td className="px-4 py-4">
                          {trainer.specialization
                            ? <div className="flex items-center gap-1.5 truncate"><BookOpen className="w-3 h-3 text-[#00A9CE] flex-shrink-0"/><span className="text-xs font-medium text-slate-700 truncate">{trainer.specialization}</span></div>
                            : <span className="text-[10px] text-slate-300 italic">N/A</span>}
                        </td>
                        <td className="px-4 py-4">
                          {trainer.experienceYears!=null
                            ? <div className="flex items-center gap-1"><Award className="w-3 h-3 text-amber-400 flex-shrink-0"/><span className="text-xs font-bold text-slate-700">{trainer.experienceYears}y</span></div>
                            : <span className="text-[10px] text-slate-300 italic">—</span>}
                        </td>
                        <td className="px-4 py-4">
                          <button onClick={()=>handleToggle(trainer._id, trainer.isActive)}
                            className={`inline-flex items-center px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-md border transition-all ${trainer.isActive?'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20 hover:bg-[#10b981]/20':'bg-rose-50 text-rose-500 border-rose-100 hover:bg-rose-100'}`}>
                            {trainer.isActive?'Active':'Inactive'}
                          </button>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center">
                            <ActionMenu actions={[
                              { icon:Eye,       label:'View Details',   onClick:()=>navigate(`/dashboard/super-admin/trainers/${trainer._id}`),      color:'text-slate-700 hover:bg-slate-50' },
                              { icon:SquarePen, label:'Edit Trainer',   onClick:()=>navigate(`/dashboard/super-admin/trainers/edit/${trainer._id}`), color:'text-[#00A9CE] hover:bg-[#00A9CE]/5' },
                              { icon:Trash2,    label:'Delete Trainer', danger:true, onClick:()=>handleDelete(trainer._id, trainer.fullName) },
                            ]}/>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Mobile */}
            <div className="md:hidden">
              {paginated.map(t=><TrainerMobileCard key={t._id} trainer={t} onToggle={handleToggle} onDelete={handleDelete} navigate={navigate}/>)}
            </div>
          </>) : (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-50/20 px-4 text-center">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 border border-slate-100 shadow-sm">
                <Users className="w-8 h-8 text-slate-200"/>
              </div>
              <p className="text-sm font-black text-slate-800 tracking-tight">No trainers found</p>
              <p className="text-xs text-slate-400 font-medium mt-1">{searchTerm||filterStatus!=='all'?'Try adjusting your filters':'Add your first trainer to get started'}</p>
              {!searchTerm && filterStatus==='all' && (
                <button onClick={()=>navigate('/dashboard/super-admin/trainers/create')}
                  className="mt-4 inline-flex items-center gap-2 bg-[#003399] text-white text-[11px] font-black uppercase tracking-wider px-5 py-2.5 rounded-xl hover:bg-[#002d8b] transition-all">
                  <Plus className="w-4 h-4"/> Add First Trainer
                </button>
              )}
            </div>
          )}
          <Pagination page={page} total={filtered.length} totalPages={totalPages} pageSize={PAGE_SIZE} onPageChange={setPage}/>
        </div>
      </div>

      {/* Mobile FAB */}
      <button onClick={()=>navigate('/dashboard/super-admin/trainers/create')}
        className="md:hidden fixed bottom-8 right-8 w-14 h-14 bg-[#003399] text-white rounded-2xl shadow-xl shadow-blue-500/30 z-50 flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
        <Plus className="w-7 h-7"/>
      </button>
    </SuperAdminDashboardLayout>
  );
};

export default TrainerManagement;