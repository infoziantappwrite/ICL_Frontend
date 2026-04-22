// src/pages/SuperAdmin/SubscriptionManagement.jsx
import { useState } from 'react';
import {
  CreditCard, Building2, Pencil, X, CircleCheck,
  Crown, Shield, Zap, ChevronDown, TrendingUp, Users,
  CheckCircle, AlertTriangle, Clock, Star,
} from 'lucide-react';
import SuperAdminDashboardLayout from '../../components/layout/SuperAdminDashboardLayout';
import ActionMenu from '../../components/common/ActionMenu';

/* ── plan config ── */
const PLANS = {
  free: { label: 'Free', icon: Shield, badge: 'bg-gray-100 text-gray-600 border-gray-200', ring: 'border-gray-200', dot: 'bg-gray-400' },
  pro: { label: 'Pro', icon: Zap, badge: 'bg-blue-100 text-blue-700 border-blue-200', ring: 'border-blue-300', dot: 'bg-blue-500' },
  pro_plus: { label: 'Pro Plus', icon: Crown, badge: 'bg-indigo-100 text-indigo-700 border-indigo-200', ring: 'border-indigo-300', dot: 'bg-indigo-500' },
};

const planOf = (p) => PLANS[p] || PLANS.free;
const fmt = (v) => (v >= 999999) ? '∞' : (v ?? 0).toLocaleString();
const usePct = (used, lim) => lim >= 999999 ? 0 : Math.min(100, Math.round((used / (lim || 1)) * 100));

/* ── mock colleges ── */
const MOCK_COLLEGES = [
  { _id: '1', name: 'ABC Engineering College', code: 'ABC123', plan: 'pro_plus', students: { used: 982, limit: 999999 }, groups: { used: 28, limit: 999999 }, admins: 3, lastPaid: 'Mar 1, 2026', nextDue: 'Apr 1, 2026', amount: '₹4,999/mo' },
  { _id: '2', name: 'Karpagam Institute of Technology', code: '7212', plan: 'pro', students: { used: 248, limit: 1000 }, groups: { used: 14, limit: 250 }, admins: 2, lastPaid: 'Feb 15, 2026', nextDue: 'Mar 15, 2026', amount: '₹1,999/mo' },
  { _id: '3', name: 'Madras Christian College', code: 'MCC2024', plan: 'pro', students: { used: 189, limit: 1000 }, groups: { used: 10, limit: 250 }, admins: 1, lastPaid: 'Feb 20, 2026', nextDue: 'Mar 20, 2026', amount: '₹1,999/mo' },
  { _id: '4', name: 'Anna University RC', code: 'AURC2024', plan: 'free', students: { used: 0, limit: 500 }, groups: { used: 0, limit: 100 }, admins: 1, lastPaid: '—', nextDue: '—', amount: 'Free' },
  { _id: '5', name: 'PSG College of Technology', code: 'PSG2024', plan: 'pro_plus', students: { used: 1420, limit: 999999 }, groups: { used: 45, limit: 999999 }, admins: 4, lastPaid: 'Mar 5, 2026', nextDue: 'Apr 5, 2026', amount: '₹4,999/mo' },
  { _id: '6', name: 'Coimbatore Institute of Tech', code: 'CIT2024', plan: 'pro', students: { used: 612, limit: 1000 }, groups: { used: 32, limit: 250 }, admins: 2, lastPaid: 'Feb 28, 2026', nextDue: 'Mar 28, 2026', amount: '₹1,999/mo' },
];

const BarUsage = ({ pct }) => {
  const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-400' : 'bg-gradient-to-r from-blue-500 to-cyan-500';
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
      <div className={`h-1.5 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
};

/* ── Update Modal ── */
const UpdateModal = ({ college, onClose, onSaved }) => {
  const [plan, setPlan] = useState(college.plan || 'free');
  const [perGroup, setPerGroup] = useState(college.groups.limit >= 999999 ? 999999 : college.groups.limit);
  const [total, setTotal] = useState(college.students.limit >= 999999 ? 999999 : college.students.limit);

  const handlePlanChange = (p) => {
    setPlan(p);
    if (p === 'free') { setPerGroup(100); setTotal(500); }
    if (p === 'pro') { setPerGroup(250); setTotal(1000); }
    if (p === 'pro_plus') { setPerGroup(999999); setTotal(999999); }
  };

  const handleSubmit = () => { onSaved(college._id, { plan, perGroup, total }); onClose(); };

  const planArr = [
    { key: 'free', label: 'Free', price: '₹0/mo', desc: 'Up to 500 students · 100/group', icon: Shield, color: 'border-gray-200 hover:border-gray-400' },
    { key: 'pro', label: 'Pro', price: '₹1,999/mo', desc: 'Up to 1,000 students · 250/group', icon: Zap, color: 'border-blue-200 hover:border-blue-500' },
    { key: 'pro_plus', label: 'Pro Plus', price: '₹4,999/mo', desc: 'Unlimited students & groups', icon: Crown, color: 'border-indigo-200 hover:border-indigo-500' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-4 flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold text-sm">Update Subscription</h3>
            <p className="text-blue-200 text-[11px] mt-0.5">{college.name}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors"><X className="w-4 h-4 text-white" /></button>
        </div>
        <div className="p-5">
          <p className="text-xs font-bold text-gray-700 mb-3">Select Plan</p>
          <div className="space-y-2 mb-4">
            {planArr.map(p => {
              const Icon = p.icon;
              return (
                <button key={p.key} onClick={() => handlePlanChange(p.key)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${plan === p.key ? 'border-blue-500 bg-blue-50' : p.color + ' bg-white'}`}>
                  <Icon className={`w-4 h-4 flex-shrink-0 ${plan === p.key ? 'text-blue-600' : 'text-gray-400'}`} />
                  <div className="flex-1">
                    <p className={`text-xs font-bold ${plan === p.key ? 'text-blue-700' : 'text-gray-800'}`}>{p.label}</p>
                    <p className="text-[10px] text-gray-400">{p.desc}</p>
                  </div>
                  <span className={`text-xs font-black ${plan === p.key ? 'text-blue-700' : 'text-gray-500'}`}>{p.price}</span>
                  {plan === p.key && <CircleCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
          {plan !== 'pro_plus' && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-[10px] font-bold text-gray-600 block mb-1">Students per Group</label>
                <input type="number" value={perGroup} onChange={e => setPerGroup(+e.target.value)} min={1}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-600 block mb-1">Total Students</label>
                <input type="number" value={total} onChange={e => setTotal(+e.target.value)} min={1}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white" />
              </div>
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors">Cancel</button>
            <button onClick={handleSubmit} className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-sm">Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════ */
const SubscriptionManagement = () => {
  const [colleges, setColleges] = useState(MOCK_COLLEGES);
  const [editing, setEditing] = useState(null);
  const [filterPlan, setFilterPlan] = useState('all');

  const handleSaved = (id, { plan, perGroup, total }) => {
    setColleges(prev => prev.map(c => c._id === id ? {
      ...c, plan,
      students: { ...c.students, limit: total },
      groups: { ...c.groups, limit: perGroup },
      amount: plan === 'free' ? 'Free' : plan === 'pro' ? '₹1,999/mo' : '₹4,999/mo',
    } : c));
  };

  const filtered = filterPlan === 'all' ? colleges : colleges.filter(c => c.plan === filterPlan);

  const totalRevenue = colleges.reduce((s, c) => s + (c.plan === 'pro' ? 1999 : c.plan === 'pro_plus' ? 4999 : 0), 0);
  const planCounts = { free: colleges.filter(c => c.plan === 'free').length, pro: colleges.filter(c => c.plan === 'pro').length, pro_plus: colleges.filter(c => c.plan === 'pro_plus').length };

  return (
    <SuperAdminDashboardLayout>
      <div className="px-6 py-4 md:px-8 md:py-6 space-y-5 font-sans">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2 h-8 bg-gradient-to-b from-[#003399] to-[#00A9CE] rounded-full" />
              Subscriptions
            </h1>
            <p className="text-sm text-slate-400 mt-1 font-medium">Manage college plans, limits & billing — {colleges.length} colleges</p>
          </div>
          <div className="flex-shrink-0 text-right">
            <p className="text-2xl font-black text-[#003399] leading-none">₹{totalRevenue.toLocaleString()}</p>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">Monthly Revenue</p>
          </div>
        </div>

        {/* Plan stat pills */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Colleges', value: colleges.length, color: 'text-[#003399]', bg: 'bg-[#003399]/5', border: 'border-[#003399]/10', icon: Building2 },
            { label: 'Free Plan', value: planCounts.free, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-100', icon: Shield },
            { label: 'Pro Plan', value: planCounts.pro, color: 'text-[#00A9CE]', bg: 'bg-[#00A9CE]/5', border: 'border-[#00A9CE]/10', icon: Zap },
            { label: 'Pro Plus', value: planCounts.pro_plus, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', icon: Crown },
          ].map(({ label, value, color, bg, border, icon: Icon }) => (
            <div key={label} className={`flex items-center gap-4 p-5 rounded-2xl border ${bg} ${border} bg-white shadow-sm`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg} border ${border}`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <p className={`text-[26px] font-black leading-none ${color}`}>{value}</p>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight mt-1">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Plan filter */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="flex gap-2 flex-wrap">
            {[['all', 'All Plans'], ['free', 'Free'], ['pro', 'Pro'], ['pro_plus', 'Pro Plus']].map(([key, label]) => (
              <button key={key} onClick={() => setFilterPlan(key)}
                className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${filterPlan === key
                    ? 'bg-[#003399] text-white shadow-md shadow-blue-500/10'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-100'
                  }`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* College subscription cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-2">
          {filtered.map(college => {
            const cfg = planOf(college.plan);
            const PlanIcon = cfg.icon;
            const sPct = usePct(college.students.used, college.students.limit);
            const gPct = usePct(college.groups.used, college.groups.limit);

            return (
              <div key={college._id}
                className={`bg-white rounded-2xl border shadow-sm p-5 transition-all hover:shadow-md ${cfg.ring}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate max-w-[180px]">{college.name}</p>
                      <p className="text-[10px] text-gray-400">{college.admins} admin{college.admins !== 1 ? 's' : ''} · Code: {college.code}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-full border ${cfg.badge}`}>
                      <PlanIcon className="w-3 h-3" />{cfg.label}
                    </span>
                    <ActionMenu
                      actions={[
                        {
                          icon: Pencil,
                          label: 'Edit Subscription',
                          onClick: () => setEditing(college),
                          color: 'text-blue-500 hover:bg-blue-50'
                        },
                        {
                          icon: CreditCard,
                          label: 'View Billing',
                          onClick: () => { }, // Placeholder
                          color: 'text-slate-600 hover:bg-slate-50'
                        },
                      ]}
                    />
                  </div>
                </div>

                {/* Usage bars */}
                <div className="space-y-2 mb-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-[10px] text-gray-500 font-medium">Students</span>
                      <span className={`text-[10px] font-black ${sPct >= 90 ? 'text-red-500' : sPct >= 70 ? 'text-amber-500' : 'text-blue-600'}`}>
                        {college.students.used.toLocaleString()} / {fmt(college.students.limit)}
                      </span>
                    </div>
                    <BarUsage pct={sPct} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-[10px] text-gray-500 font-medium">Groups</span>
                      <span className={`text-[10px] font-black ${gPct >= 90 ? 'text-red-500' : gPct >= 70 ? 'text-amber-500' : 'text-blue-600'}`}>
                        {college.groups.used} / {fmt(college.groups.limit)}
                      </span>
                    </div>
                    <BarUsage pct={gPct} />
                  </div>
                </div>

                {/* Billing info */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-[9px] text-gray-400">Last paid</p>
                      <p className="text-[10px] font-semibold text-gray-700">{college.lastPaid}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-400">Next due</p>
                      <p className="text-[10px] font-semibold text-gray-700">{college.nextDue}</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-[#003399] bg-[#003399]/5 px-2.5 py-1 rounded-lg border border-[#003399]/10">{college.amount}</span>
                </div>

                {sPct >= 80 && (
                  <div className="mt-2 flex items-center gap-1.5 p-2 bg-amber-50 rounded-xl border border-amber-100">
                    <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0" />
                    <p className="text-[10px] text-amber-700 font-medium">Student limit {sPct >= 100 ? 'reached' : 'nearly reached'} — consider upgrading</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Revenue summary */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Revenue Overview</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Monthly MRR', value: `₹${totalRevenue.toLocaleString()}`, color: 'text-[#003399]' },
              { label: 'Annual ARR', value: `₹${(totalRevenue * 12).toLocaleString()}`, color: 'text-[#00A9CE]' },
              { label: 'Paid Colleges', value: planCounts.pro + planCounts.pro_plus, color: 'text-emerald-600' },
              { label: 'Conversion', value: `${colleges.length > 0 ? Math.round(((planCounts.pro + planCounts.pro_plus) / colleges.length) * 100) : 0}%`, color: 'text-amber-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 text-center">
                <p className={`text-2xl font-black ${color} leading-none`}>{value}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {editing && <UpdateModal college={editing} onClose={() => setEditing(null)} onSaved={handleSaved} />}
      </div>
    </SuperAdminDashboardLayout>
  );
};

export default SubscriptionManagement;