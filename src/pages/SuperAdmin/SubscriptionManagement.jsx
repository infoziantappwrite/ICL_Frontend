// src/pages/SuperAdmin/SubscriptionManagement.jsx
import { useState, useEffect, useCallback } from 'react';
import apiCall from '../../api/Api';
import {
  CreditCard, Building2, Users, RefreshCw, Pencil, X,
  CircleCheck, CircleX, Crown, Shield, Zap, Infinity,
  AlertCircle, ChevronDown,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useToast } from '../../context/ToastContext';

/* ── helpers ──────────────────────────────────────────────── */
const PLANS = {
  free:     { label: 'Free',     icon: Shield, badge: 'bg-gray-100 text-gray-700',   ring: 'border-gray-200'   },
  pro:      { label: 'Pro',      icon: Zap,    badge: 'bg-blue-100 text-blue-700',   ring: 'border-blue-300'   },
  pro_plus: { label: 'Pro Plus', icon: Crown,  badge: 'bg-indigo-100 text-indigo-700', ring: 'border-indigo-300' },
};

const planOf   = p => PLANS[p] || PLANS.free;
const fmt      = v => (v === Infinity || v >= 999_999) ? '∞' : (v ?? 0).toLocaleString();
const usePct   = (used, limit) => limit >= 999_999 ? 0 : Math.min(100, Math.round((used / (limit || 1)) * 100));

const BarUsage = ({ pct }) => {
  const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-400' : 'bg-gradient-to-r from-blue-500 to-cyan-500';
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
      <div className={`h-1.5 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
};

/* ── modal ────────────────────────────────────────────────── */
const UpdateModal = ({ college, onClose, onSaved }) => {
  const toast = useToast();
  const [plan,      setPlan]      = useState(college.plan || 'free');
  const [perGroup,  setPerGroup]  = useState(college.limits?.perGroup >= 999_999 ? 999999 : college.limits?.perGroup || 100);
  const [total,     setTotal]     = useState(college.limits?.total    >= 999_999 ? 999999 : college.limits?.total    || 500);
  const [saving,    setSaving]    = useState(false);

  const handlePlanChange = (p) => {
    setPlan(p);
    if (p === 'free')     { setPerGroup(100);    setTotal(500);    }
    if (p === 'pro')      { setPerGroup(250);    setTotal(1000);   }
    if (p === 'pro_plus') { setPerGroup(999999); setTotal(999999); }
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await apiCall(`/subscriptions/${college._id}`, {
        method: 'PUT',
        body: JSON.stringify({ plan, perGroupLimit: perGroup, totalStudentLimit: total }),
      });
      toast.success('Updated', `${college.name} subscription updated.`);
      onSaved();
      onClose();
    } catch (err) {
      toast.error('Failed', err.message || 'Could not update subscription.');
    } finally {
      setSaving(false);
    }
  };

  const PlanBtn = ({ id }) => {
    const p = PLANS[id];
    const active = plan === id;
    return (
      <button
        onClick={() => handlePlanChange(id)}
        className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 transition-all ${
          active ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-200'
        }`}
      >
        <p.icon className={`w-5 h-5 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
        <span className={`text-xs font-bold ${active ? 'text-blue-700' : 'text-gray-500'}`}>{p.label}</span>
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Update Subscription</h2>
            <p className="text-xs text-blue-100 mt-0.5 truncate max-w-[240px]">{college.name}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Usage info */}
          <div className="bg-blue-50 rounded-xl p-3 text-sm text-blue-800 border border-blue-100">
            <strong>Current usage:</strong> {college.usage?.students ?? 0} students
            in {college.usage?.groups ?? 0} groups
          </div>

          {/* Plan selector */}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-2">Select Plan</label>
            <div className="flex gap-2">
              {['free','pro','pro_plus'].map(id => <PlanBtn key={id} id={id} />)}
            </div>
          </div>

          {/* Limits */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1.5">Per-Group Limit</label>
              <input
                type="number" min={1} value={perGroup}
                onChange={e => setPerGroup(parseInt(e.target.value) || 1)}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <p className="text-xs text-gray-400 mt-1">Max students per group</p>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1.5">Total Student Limit</label>
              <input
                type="number" min={1} value={total}
                onChange={e => setTotal(parseInt(e.target.value) || 1)}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <p className="text-xs text-gray-400 mt-1">Max students total</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── main page ────────────────────────────────────────────── */
const SubscriptionManagement = () => {
  const toast = useToast();
  const [colleges,  setColleges]  = useState([]);
  const [summary,   setSummary]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [selected,  setSelected]  = useState(null);
  const [search,    setSearch]    = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiCall('/subscriptions');
      setColleges(res.data || []);
      setSummary(res.analytics || null);
    } catch (err) {
      toast.error('Error', err.message || 'Failed to load subscriptions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = colleges.filter(c =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.code?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading && !colleges.length) {
    return <LoadingSpinner message="Loading Subscriptions…" />;
  }

  return (
    <DashboardLayout title="Subscriptions">

      {/* Banner */}
      <div className="mb-5">
        <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 rounded-2xl p-6 shadow-xl overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute w-64 h-64 bg-white rounded-full -top-20 -right-20" />
          </div>
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Subscription Management</h1>
                  <p className="text-blue-100 text-xs mt-0.5">Manage college plans and student quotas</p>
                </div>
              </div>
            </div>
            <button onClick={load} disabled={loading}
              className="self-start sm:self-auto flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-4 py-2 rounded-xl transition disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          {[
            { icon: Building2, label: 'Total Colleges', value: summary.totalColleges, bg: 'from-blue-600 to-blue-700' },
            { icon: Shield,    label: 'Free Plan',      value: summary.byPlan?.free     ?? 0, bg: 'from-gray-500 to-gray-600' },
            { icon: Zap,       label: 'Pro Plan',       value: summary.byPlan?.pro      ?? 0, bg: 'from-blue-500 to-cyan-500' },
            { icon: Crown,     label: 'Pro Plus',       value: summary.byPlan?.pro_plus ?? 0, bg: 'from-indigo-500 to-blue-600' },
          ].map(({ icon: Icon, label, value, bg }) => (
            <div key={label} className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/60 shadow-sm">
              <div className={`w-10 h-10 bg-gradient-to-br ${bg} rounded-xl flex items-center justify-center mb-3 shadow-md`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-black text-gray-900">{value}</p>
              <p className="text-sm text-gray-600">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by college name or code…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full sm:w-80 text-sm border border-gray-200 rounded-xl px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {/* Table card */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-100">
                {['College', 'Plan', 'Per Group', 'Total Limit', 'Usage', 'Groups', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(col => {
                const p    = planOf(col.plan);
                const pct  = usePct(col.usage?.students ?? 0, col.limits?.total ?? 500);
                const warn = pct >= 90 ? 'text-red-600' : pct >= 70 ? 'text-amber-500' : 'text-emerald-600';
                return (
                  <tr key={col._id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900 truncate max-w-[180px]">{col.name}</p>
                      <p className="text-xs text-gray-400">{col.code}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${p.badge}`}>
                        <p.icon className="w-3 h-3" />
                        {p.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-700">{fmt(col.limits?.perGroup)}</td>
                    <td className="px-4 py-3 font-semibold text-gray-700">{fmt(col.limits?.total)}</td>
                    <td className="px-4 py-3 w-36">
                      <div className="flex items-center justify-between mb-1 text-xs">
                        <span className={`font-bold ${warn}`}>{col.usage?.students ?? 0}</span>
                        <span className="text-gray-400">/ {fmt(col.limits?.total)}</span>
                      </div>
                      <BarUsage pct={pct} />
                      <p className={`text-xs mt-0.5 font-medium ${warn}`}>{pct}% used</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700 font-medium">{col.usage?.groups ?? 0}</td>
                    <td className="px-4 py-3">
                      {col.isActive
                        ? <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full"><CircleCheck className="w-3 h-3" />Active</span>
                        : <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-600 text-xs font-bold rounded-full"><CircleX className="w-3 h-3" />Inactive</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelected(col)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-bold rounded-lg hover:opacity-90 transition"
                      >
                        <Pencil className="w-3 h-3" />
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <CreditCard className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400">{search ? 'No colleges match your search.' : 'No subscription data found.'}</p>
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50 text-xs text-gray-400">
          Showing {filtered.length} of {colleges.length} colleges
        </div>
      </div>

      {/* Update modal */}
      {selected && (
        <UpdateModal
          college={selected}
          onClose={() => setSelected(null)}
          onSaved={load}
        />
      )}
    </DashboardLayout>
  );
};

export default SubscriptionManagement;