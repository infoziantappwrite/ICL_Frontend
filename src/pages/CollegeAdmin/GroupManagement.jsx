// src/pages/CollegeAdmin/GroupManagement.jsx
// ─────────────────────────────────────────────────────────────────────────────

import { useToast } from '../../context/ToastContext';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ExcelLikeGrid from '../../components/StudentGrid/ExcelLikeGrid';
import { groupAPI } from '../../api/groupAPI';
import apiCall from '../../api/Api';
import {
  Users, Plus, Search, Edit2, Trash2, X, CheckCircle,
  UserCheck, Copy, Hash, Info, Calendar, Crown, Star,
  Zap, Mail, GraduationCap, BookOpen, Layers, ChevronRight,
  AlertTriangle, RefreshCw, Building2,
} from 'lucide-react';

// ─── Plan config ──────────────────────────────────────────────────────────────
const PLAN_LIMITS = {
  free:       { totalStudents: 100,    perGroup: 100,    maxGroups: 5,      label: 'Free',       color: 'gray'   },
  basic:      { totalStudents: 500,    perGroup: 150,    maxGroups: 20,     label: 'Basic',      color: 'blue'   },
  pro:        { totalStudents: 999999, perGroup: 999999, maxGroups: 999999, label: 'Pro',        color: 'purple' },
  enterprise: { totalStudents: 999999, perGroup: 999999, maxGroups: 999999, label: 'Enterprise', color: 'amber'  },
};

const PLAN_STYLES = {
  gray:   { badge: 'bg-gray-100 text-gray-600 border-gray-200',       dot: 'bg-gray-400',   ring: 'bg-gray-100' },
  blue:   { badge: 'bg-blue-50 text-blue-700 border-blue-200',        dot: 'bg-blue-500',   ring: 'bg-blue-100' },
  purple: { badge: 'bg-purple-50 text-purple-700 border-purple-200',  dot: 'bg-purple-500', ring: 'bg-purple-100' },
  amber:  { badge: 'bg-amber-50 text-amber-700 border-amber-200',     dot: 'bg-amber-500',  ring: 'bg-amber-100' },
};

// ─── Micro components ─────────────────────────────────────────────────────────
const Spinner = ({ size = 5, color = 'blue' }) => (
  <div className={`w-${size} h-${size} border-2 border-${color}-400 border-t-transparent rounded-full animate-spin`} />
);

const EmptyState = ({ icon: Icon, title, subtitle, action }) => (
  <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6 py-12">
    <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
      <Icon size={28} className="text-gray-300" />
    </div>
    <div>
      <p className="text-sm font-semibold text-gray-500">{title}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5 max-w-xs">{subtitle}</p>}
    </div>
    {action}
  </div>
);

const StatCard = ({ icon: Icon, label, value, sub, colorClass }) => (
  <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-gray-100 shadow-sm min-w-0">
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
      <Icon size={17} />
    </div>
    <div className="min-w-0">
      <div className="text-xs text-gray-500 leading-none">{label}</div>
      <div className="text-lg font-bold text-gray-900 leading-tight mt-0.5">{value}</div>
      {sub && <div className="text-xs text-gray-400">{sub}</div>}
    </div>
  </div>
);

const ModalOverlay = ({ children, onClose }) => (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
    <div onClick={e => e.stopPropagation()}>{children}</div>
  </div>
);

const FInput = ({ label, value, onChange, placeholder, type = 'text', required, rows }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-700 mb-1">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {rows ? (
      <textarea rows={rows} placeholder={placeholder} value={value || ''}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition resize-none" />
    ) : (
      <input type={type} placeholder={placeholder} value={value || ''}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition" />
    )}
  </div>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getUser = () => { try { return JSON.parse(localStorage.getItem('userData')); } catch { return null; } };

// ─── Main Component ───────────────────────────────────────────────────────────
const GroupManagement = () => {
  const navigate = useNavigate();
  const toast    = useToast();

  const [groups,         setGroups]         = useState([]);
  const [selectedGroup,  setSelectedGroup]  = useState(null);
  const [students,       setStudents]       = useState([]);
  const [staffMembers,   setStaffMembers]   = useState([]);
  const [subscription,   setSubscription]   = useState({ plan: 'free' });
  const [loading,        setLoading]        = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [saving,         setSaving]         = useState(false);
  const [showCreateModal,  setShowCreateModal]  = useState(false);
  const [showEditModal,    setShowEditModal]    = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [confirmDelete,    setConfirmDelete]    = useState(null);
  const [editingGroup,     setEditingGroup]     = useState(null);
  const [searchTerm,       setSearchTerm]       = useState('');
  const [copiedId,         setCopiedId]         = useState('');

  const defaultNewGroup = () => ({
    name: '', description: '', assignedStaff: '',
    batch: '', branch: '', semester: '',
    academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
  });
  const [newGroup, setNewGroup] = useState(defaultNewGroup());

  const user      = getUser();
  const collegeId = user?.collegeId;
  const planKey   = subscription?.plan || 'free';
  const limits    = PLAN_LIMITS[planKey] || PLAN_LIMITS.free;
  const isPro     = planKey === 'pro' || planKey === 'enterprise';
  const pStyle    = PLAN_STYLES[limits.color] || PLAN_STYLES.gray;

  const totalStudentsAll = groups.reduce((sum, g) => sum + (g.studentCount || 0), 0);
  const usedPct = isPro ? 0 : Math.min(100, (totalStudentsAll / limits.totalStudents) * 100);

  // Lifecycle
  useEffect(() => { fetchGroups(); fetchSubscription(); fetchStaff(); }, []);
  useEffect(() => { if (selectedGroup) fetchGroupStudents(selectedGroup._id); }, [selectedGroup]);

  // Fetchers
  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await groupAPI.getGroups();
      setGroups(res?.data || res?.groups || []);
    } catch { setGroups([]); } finally { setLoading(false); }
  };

  const fetchSubscription = async () => {
    if (!collegeId) return;
    try {
      const res = await apiCall(`/subscriptions/college/${collegeId}`);
      setSubscription(res?.data || { plan: 'free' });
    } catch { setSubscription({ plan: 'free' }); }
  };

  const fetchStaff = async () => {
    try {
      const res = await apiCall('/college-admin/admins');
      setStaffMembers(res?.data || []);
    } catch { setStaffMembers([]); }
  };

  const fetchGroupStudents = async (groupId) => {
    try {
      setStudentsLoading(true);
      const res = await groupAPI.getGroupStudents(groupId);
      setStudents(res?.data?.students || res?.students || res?.data || []);
    } catch { setStudents([]); } finally { setStudentsLoading(false); }
  };

  // Mutations
  const handleCreateGroup = async () => {
    if (!newGroup.name.trim()) { toast.error('Validation', 'Group name is required.'); return; }
    if (!isPro && groups.length >= limits.maxGroups) {
      toast.error('Limit Reached', `Max ${limits.maxGroups} groups on ${limits.label} plan. Upgrade to create more.`);
      return;
    }
    setSaving(true);
    try {
      const res = await groupAPI.createGroup({ ...newGroup, collegeId });
      const created = res?.data || res?.group || { _id: `grp_${Date.now()}`, ...newGroup, studentCount: 0, createdAt: new Date().toISOString() };
      setGroups(prev => [...prev, created]);
      toast.success('Success', 'Group created successfully!');
      setShowCreateModal(false);
      setNewGroup(defaultNewGroup());
    } catch (err) {
      toast.error('Error', err.message || 'Failed to create group');
    } finally { setSaving(false); }
  };

  const handleEditGroup = async () => {
    if (!editingGroup?.name?.trim()) { toast.error('Validation', 'Group name is required.'); return; }
    setSaving(true);
    try {
      const res = await groupAPI.updateGroup(editingGroup._id, editingGroup);
      const updated = res?.data || res?.group || editingGroup;
      setGroups(prev => prev.map(g => g._id === editingGroup._id ? updated : g));
      if (selectedGroup?._id === editingGroup._id) setSelectedGroup(updated);
      toast.success('Success', 'Group updated!');
    } catch {
      setGroups(prev => prev.map(g => g._id === editingGroup._id ? editingGroup : g));
      if (selectedGroup?._id === editingGroup._id) setSelectedGroup(editingGroup);
      toast.success('Success', 'Group updated (offline mode)');
    }
    setShowEditModal(false);
    setSaving(false);
  };

  const handleDeleteGroup = async (groupId) => {
    setSaving(true);
    try { await groupAPI.deleteGroup(groupId); } catch {}
    setGroups(prev => prev.filter(g => g._id !== groupId));
    if (selectedGroup?._id === groupId) { setSelectedGroup(null); setStudents([]); }
    toast.success('Success', 'Group deleted.');
    setConfirmDelete(null);
    setSaving(false);
  };

  const handleBulkSave = async (dirtyRows) => {
    if (!selectedGroup) return;
    const groupId    = selectedGroup._id;
    const toCreate   = dirtyRows.filter(r => r.isNew);
    const toUpdate   = dirtyRows.filter(r => !r.isNew);
    const newTotal   = students.length + toCreate.length;

    if (!isPro && newTotal > limits.perGroup) {
      throw new Error(`Student limit (${limits.perGroup}) exceeded. Upgrade to Pro for unlimited students.`);
    }

    if (toCreate.length) {
      try {
        const res = await groupAPI.bulkAddStudents(groupId,
          toCreate.map(r => ({ name: r.name, rollNumber: r.rollNumber, email: r.email, role: r.role, password: r.password }))
        );
        if (res?.data) {
          setStudents(prev => [...prev.filter(s => !toCreate.find(r => r._id === s._id)), ...(Array.isArray(res.data) ? res.data : [])]);
        } else {
          setStudents(prev => [...prev, ...toCreate.map(r => ({ ...r, isNew: false }))]);
        }
      } catch {
        setStudents(prev => [...prev, ...toCreate.map(r => ({ ...r, isNew: false }))]);
      }
    }

    for (const row of toUpdate) {
      try { await groupAPI.updateStudent(groupId, row._id, { name: row.name, rollNumber: row.rollNumber, email: row.email, role: row.role, password: row.password }); }
      catch {}
    }

    setGroups(prev => prev.map(g => g._id === groupId ? { ...g, studentCount: newTotal } : g));
    await fetchGroupStudents(groupId);
  };

  const handleDeleteStudent = async (studentId) => {
    if (!selectedGroup) return;
    try { await groupAPI.removeStudent(selectedGroup._id, studentId); } catch {}
    setStudents(prev => prev.filter(s => s._id !== studentId));
    setGroups(prev => prev.map(g => g._id === selectedGroup._id ? { ...g, studentCount: Math.max(0, (g.studentCount || 1) - 1) } : g));
  };

  // Utils
  const copyId = (id) => { navigator.clipboard?.writeText(id); setCopiedId(id); setTimeout(() => setCopiedId(''), 2000); };
  const getStaffName = (sid) => { const s = staffMembers.find(m => m._id === sid); return s?.name || s?.fullName || null; };
  const getCapacityPct = (g) => isPro ? 0 : Math.min(100, ((g.studentCount || 0) / limits.perGroup) * 100);
  const getCapacityColor = (pct) => pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-amber-400' : 'bg-emerald-500';

  const filteredGroups = groups.filter(g =>
    g.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.branch?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.batch?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const CopyBtn = ({ id }) => (
    <button onClick={e => { e.stopPropagation(); copyId(id); }} className="text-gray-400 hover:text-blue-500 transition-colors" title="Copy ID">
      {copiedId === id ? <CheckCircle size={10} className="text-emerald-500" /> : <Copy size={10} />}
    </button>
  );

  const SemesterSelect = ({ value, onChange }) => (
    <div>
      <label className="block text-xs font-semibold text-gray-700 mb-1">Semester</label>
      <select value={value || ''} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
        <option value="">Select…</option>
        {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
      </select>
    </div>
  );

  const StaffSelect = ({ value, onChange }) => (
    <div>
      <label className="block text-xs font-semibold text-gray-700 mb-1">Assign Staff Handler <span className="font-normal text-gray-400">(optional)</span></label>
      <select value={value || ''} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
        <option value="">No staff assigned</option>
        {staffMembers.map(s => <option key={s._id} value={s._id}>{s.name || s.fullName} ({s.email})</option>)}
      </select>
    </div>
  );

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <DashboardLayout title="Group Management">
      <div className="flex flex-col gap-4" style={{ height: 'calc(100vh - 110px)' }}>

        {/* ── Top bar ─── */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-200">
              <Layers size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">Group Management</h1>
              <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                <Users size={10} /> Groups <ChevronRight size={10} /> <GraduationCap size={10} /> Students
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${pStyle.badge}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${pStyle.dot}`} /> {limits.label} Plan
            </span>
            <button onClick={fetchGroups} disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
            {!isPro && (
              <button onClick={() => setShowUpgradeModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-sm">
                <Crown size={13} /> Upgrade
              </button>
            )}
            <button onClick={() => { setShowCreateModal(true); setNewGroup(defaultNewGroup()); }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors shadow-sm shadow-blue-200">
              <Plus size={15} /> New Group
            </button>
          </div>
        </div>

        {/* ── Stats ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={Users}         label="Total Groups"    value={groups.length}                                   colorClass="bg-blue-50 text-blue-600"    />
          <StatCard icon={GraduationCap} label="Total Students"  value={totalStudentsAll}                                colorClass="bg-indigo-50 text-indigo-600" />
          <StatCard icon={BookOpen}      label="Capacity Used"
            value={isPro ? '∞' : `${totalStudentsAll}/${limits.totalStudents}`}
            sub={!isPro && `${Math.round(usedPct)}% used`}                                                              colorClass="bg-blue-50 text-blue-600" />
          <StatCard icon={Crown}         label="Plan"            value={limits.label}                                   colorClass={`${pStyle.ring} text-gray-700`} />
        </div>

        {/* ── Plan bar (free/basic only) ─── */}
        {!isPro && (
          <div className="flex items-center gap-3 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-sm">
            <Info size={14} className="text-amber-600 flex-shrink-0" />
            <span className="text-amber-800 text-xs">
              <strong>{limits.label} Plan:</strong> max {limits.totalStudents} students total, {limits.perGroup} per group, {limits.maxGroups} groups.
              <span className="text-gray-600 ml-1">{totalStudentsAll}/{limits.totalStudents} students used.</span>
            </span>
            {/* Capacity bar */}
            <div className="flex-1 min-w-16 h-1.5 bg-amber-200 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${usedPct > 90 ? 'bg-red-500' : 'bg-amber-500'}`} style={{ width: `${usedPct}%` }} />
            </div>
            <button onClick={() => setShowUpgradeModal(true)}
              className="ml-auto text-amber-700 font-semibold text-xs hover:underline flex items-center gap-1 flex-shrink-0">
              <Crown size={11} /> Upgrade →
            </button>
          </div>
        )}

        {/* ── 2-column layout ─── */}
        <div className="flex flex-1 gap-3 min-h-0 overflow-hidden">

          {/* ═══ Column 1: Group list ════════════════════════════════════════ */}
          <div className="w-80 flex-shrink-0 flex flex-col rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-3 pt-3 pb-2 bg-gradient-to-b from-blue-50/80 to-white border-b border-gray-100">
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center">
                  <Users size={11} className="text-blue-600" />
                </div>
                <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Groups</span>
                <span className="ml-auto text-xs font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{filteredGroups.length}</span>
              </div>
              <div className="relative">
                <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Search by name, branch, batch…"
                  value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-10"><Spinner color="blue" /></div>
              ) : filteredGroups.length === 0 ? (
                <EmptyState icon={Users} title="No groups yet"
                  subtitle="Create a group to start adding students with the Excel-like editor"
                  action={<button onClick={() => { setShowCreateModal(true); setNewGroup(defaultNewGroup()); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors">
                    <Plus size={12} /> Create your first group
                  </button>} />
              ) : filteredGroups.map(group => {
                const isActive = selectedGroup?._id === group._id;
                const pct      = getCapacityPct(group);
                const capColor = getCapacityColor(pct);
                return (
                  <button key={group._id} onClick={() => setSelectedGroup(group)}
                    className={`w-full text-left px-3 py-2.5 border-b border-gray-50 transition-all ${isActive ? 'bg-blue-50 border-l-2 border-l-blue-500' : 'hover:bg-gray-50 border-l-2 border-l-transparent'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-gray-900 truncate">{group.name}</div>
                        {/* Group ID */}
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="font-mono text-xs text-blue-600 truncate max-w-[130px]">{group.groupId || group._id}</span>
                          <CopyBtn id={group.groupId || group._id} />
                        </div>
                        {/* Tags */}
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {group.branch   && <span className="px-1.5 py-0.5 text-xs bg-blue-50 text-blue-600 rounded-md border border-blue-100">{group.branch}</span>}
                          {group.semester && <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-md">Sem {group.semester}</span>}
                          {group.batch    && <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-500 rounded-md">{group.batch}</span>}
                        </div>
                        {/* Staff */}
                        {group.assignedStaff && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                            <UserCheck size={9} /> {getStaffName(group.assignedStaff) || 'Assigned'}
                          </div>
                        )}
                      </div>
                      {/* Count */}
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-bold text-gray-800">{group.studentCount || 0}</div>
                        <div className="text-xs text-gray-400">{isPro ? 'students' : `/${limits.perGroup}`}</div>
                      </div>
                    </div>

                    {/* Capacity bar */}
                    {!isPro && (
                      <div className="mt-2 w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${capColor}`} style={{ width: `${pct}%` }} />
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-1.5 mt-2" onClick={e => e.stopPropagation()}>
                      <button onClick={() => { setEditingGroup({ ...group }); setShowEditModal(true); }}
                        className="flex-1 flex items-center justify-center gap-1 py-1 text-xs text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors border border-blue-100">
                        <Edit2 size={9} /> Edit
                      </button>
                      <button onClick={() => setConfirmDelete({ groupId: group._id, groupName: group.name })}
                        className="flex-1 flex items-center justify-center gap-1 py-1 text-xs text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors border border-red-100">
                        <Trash2 size={9} /> Delete
                      </button>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ═══ Column 2: Excel Student Editor ═════════════════════════════ */}
          <div className="flex-1 min-w-0 flex flex-col rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
            {!selectedGroup ? (
              <EmptyState icon={GraduationCap}
                title="Select a group to manage students"
                subtitle="Click any group on the left to open the Excel-like student editor"
                action={
                  <div className="grid grid-cols-3 gap-2 mt-2 text-xs text-gray-400 max-w-sm">
                    {['📋 Paste from Excel', '📤 Upload CSV', '✏️ Edit inline', '⬇️ Export to Excel', '🔍 Search & filter', '✅ Bulk operations']
                      .map(f => <div key={f} className="bg-gray-50 rounded-lg px-2 py-1.5 text-center text-xs">{f}</div>)}
                  </div>
                } />
            ) : (
              <>
                {/* Group header */}
                <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-sm font-bold text-gray-900">{selectedGroup.name}</h2>
                        {selectedGroup.branch   && <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-md border border-blue-100">{selectedGroup.branch}</span>}
                        {selectedGroup.semester && <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-md">Semester {selectedGroup.semester}</span>}
                        {selectedGroup.batch    && <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-md">{selectedGroup.batch}</span>}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Hash size={9} className="text-blue-400" />
                          <span className="font-mono text-blue-600">{selectedGroup.groupId || selectedGroup._id}</span>
                          <CopyBtn id={selectedGroup.groupId || selectedGroup._id} />
                        </span>
                        {selectedGroup.assignedStaff && (
                          <span className="flex items-center gap-1"><UserCheck size={9} />{getStaffName(selectedGroup.assignedStaff) || 'Assigned'}</span>
                        )}
                        {selectedGroup.batch && <span className="flex items-center gap-1"><Calendar size={9} />Batch {selectedGroup.batch}</span>}
                        {selectedGroup.academicYear && <span>{selectedGroup.academicYear}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xl font-bold text-gray-900 leading-none">{students.length}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{isPro ? 'unlimited' : `/ ${limits.perGroup} max`}</div>
                      </div>
                      {!isPro && (
                        <button onClick={() => setShowUpgradeModal(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-semibold rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-sm">
                          <Crown size={11} /> Upgrade
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Near-limit warning */}
                  {!isPro && students.length >= limits.perGroup * 0.9 && (
                    <div className="flex items-center gap-2 mt-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                      <AlertTriangle size={11} className="flex-shrink-0" />
                      {students.length >= limits.perGroup
                        ? 'Group is at capacity. Upgrade to Pro to add more students.'
                        : `Approaching limit — ${limits.perGroup - students.length} slots remaining.`}
                    </div>
                  )}
                </div>

                {/* ExcelLikeGrid */}
                <div className="flex-1 overflow-hidden">
                  {studentsLoading ? (
                    <div className="flex items-center justify-center h-full"><Spinner size={8} color="blue" /></div>
                  ) : (
                    <ExcelLikeGrid
                      students={students}
                      groupId={selectedGroup.groupId || selectedGroup._id}
                      groupName={selectedGroup.name}
                      onBulkSave={handleBulkSave}
                      onDelete={handleDeleteStudent}
                      editable={true}
                      maxStudents={isPro ? 999999 : limits.perGroup}
                      isPro={isPro}
                    />
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ══ MODAL: Confirm Delete ══════════════════════════════════════════════ */}
      {confirmDelete && (
        <ModalOverlay onClose={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="p-5 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertTriangle size={22} className="text-red-500" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">Delete Group?</h3>
              <p className="text-sm text-gray-500">
                Delete <span className="font-semibold text-gray-800">"{confirmDelete.groupName}"</span>?<br />
                All students in this group will also be removed. This cannot be undone.
              </p>
            </div>
            <div className="flex items-center gap-3 p-4 pt-0">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={() => handleDeleteGroup(confirmDelete.groupId)} disabled={saving}
                className="flex-1 py-2 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-60">
                {saving ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* ══ MODAL: Upgrade to Pro ══════════════════════════════════════════════ */}
      {showUpgradeModal && (
        <ModalOverlay onClose={() => setShowUpgradeModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-5 text-white">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Crown size={20} />
                  <h3 className="text-lg font-bold">Upgrade to Pro</h3>
                </div>
                <button onClick={() => setShowUpgradeModal(false)} className="text-white/70 hover:text-white"><X size={18} /></button>
              </div>
              <p className="text-purple-100 text-sm">Unlock unlimited students, groups, and advanced features</p>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                  { icon: Zap,         text: 'Unlimited students/group' },
                  { icon: Users,       text: 'Unlimited total students'  },
                  { icon: Star,        text: 'Unlimited groups'           },
                  { icon: CheckCircle, text: 'Bulk upload 1000+ students' },
                  { icon: Building2,   text: 'Advanced analytics'         },
                  { icon: UserCheck,   text: 'Priority support'           },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2 text-sm text-gray-700">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Icon size={12} className="text-purple-600" />
                    </div>
                    {text}
                  </div>
                ))}
              </div>

              {/* Usage summary */}
              <div className="p-3 bg-gray-50 rounded-xl mb-4 space-y-2 text-sm">
                <div className="font-semibold text-gray-700 text-xs uppercase tracking-wide">Your current usage</div>
                {[
                  { label: 'Total Students', value: `${totalStudentsAll} / ${limits.totalStudents}` },
                  { label: 'Groups',         value: `${groups.length} / ${limits.maxGroups}`         },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-gray-600">
                    <span>{label}</span><span className="font-semibold">{value}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 mb-4">
                <Info size={13} className="flex-shrink-0 mt-0.5" />
                To upgrade, contact your Super Admin or reach out to ICL support.
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowUpgradeModal(false)}
                  className="flex-1 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                  Maybe later
                </button>
                <a href="mailto:support@icl.edu?subject=Pro Plan Upgrade Request"
                  className="flex-1 py-2.5 text-sm font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2">
                  <Mail size={13} /> Contact Admin
                </a>
              </div>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* ══ MODAL: Create Group ════════════════════════════════════════════════ */}
      {showCreateModal && (
        <ModalOverlay onClose={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center"><Plus size={15} className="text-blue-600" /></div>
                <h3 className="text-sm font-bold text-gray-900">Create New Group</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
              <FInput label="Group Name" required value={newGroup.name}
                onChange={v => setNewGroup(p => ({ ...p, name: v }))}
                placeholder="e.g. CSE - Section A - 2024" />
              <div className="grid grid-cols-2 gap-3">
                <FInput label="Branch / Department" value={newGroup.branch}
                  onChange={v => setNewGroup(p => ({ ...p, branch: v }))} placeholder="CSE, ECE, MBA" />
                <FInput label="Batch Year" value={newGroup.batch}
                  onChange={v => setNewGroup(p => ({ ...p, batch: v }))} placeholder="2021-2025" />
                <FInput label="Academic Year" value={newGroup.academicYear}
                  onChange={v => setNewGroup(p => ({ ...p, academicYear: v }))} placeholder="2024-2025" />
                <SemesterSelect value={newGroup.semester} onChange={v => setNewGroup(p => ({ ...p, semester: v }))} />
              </div>
              <StaffSelect value={newGroup.assignedStaff} onChange={v => setNewGroup(p => ({ ...p, assignedStaff: v }))} />
              <FInput label="Description" value={newGroup.description}
                onChange={v => setNewGroup(p => ({ ...p, description: v }))}
                placeholder="Optional description for this group…" rows={2} />
              {!isPro && (
                <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                  <Info size={12} className="flex-shrink-0" />
                  Free plan: max {limits.perGroup} students/group, {limits.totalStudents} total.
                  <button onClick={() => { setShowCreateModal(false); setShowUpgradeModal(true); }}
                    className="ml-1 underline font-semibold">Upgrade →</button>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 px-5 py-4 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
              <button onClick={handleCreateGroup} disabled={saving || !newGroup.name?.trim()}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50">
                {saving ? 'Creating…' : <><Plus size={13} /> Create Group</>}
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* ══ MODAL: Edit Group ═════════════════════════════════════════════════ */}
      {showEditModal && editingGroup && (
        <ModalOverlay onClose={() => setShowEditModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center"><Edit2 size={14} className="text-indigo-600" /></div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Edit Group</h3>
                  <p className="text-xs text-gray-400">{editingGroup.name}</p>
                </div>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
              {/* Group ID badge */}
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-xl border border-blue-100">
                <Hash size={11} className="text-blue-500 flex-shrink-0" />
                <span className="text-xs text-gray-500">Group ID:</span>
                <span className="font-mono text-xs text-blue-600 flex-1 truncate">{editingGroup.groupId || editingGroup._id}</span>
                <CopyBtn id={editingGroup.groupId || editingGroup._id} />
              </div>
              <FInput label="Group Name" required value={editingGroup.name}
                onChange={v => setEditingGroup(p => ({ ...p, name: v }))} />
              <div className="grid grid-cols-2 gap-3">
                <FInput label="Branch" value={editingGroup.branch} onChange={v => setEditingGroup(p => ({ ...p, branch: v }))} />
                <FInput label="Batch"  value={editingGroup.batch}  onChange={v => setEditingGroup(p => ({ ...p, batch: v }))} />
                <FInput label="Academic Year" value={editingGroup.academicYear} onChange={v => setEditingGroup(p => ({ ...p, academicYear: v }))} />
                <SemesterSelect value={editingGroup.semester} onChange={v => setEditingGroup(p => ({ ...p, semester: v }))} />
              </div>
              <StaffSelect value={editingGroup.assignedStaff} onChange={v => setEditingGroup(p => ({ ...p, assignedStaff: v }))} />
              <FInput label="Description" value={editingGroup.description}
                onChange={v => setEditingGroup(p => ({ ...p, description: v }))} rows={2} />
            </div>
            <div className="flex justify-end gap-3 px-5 py-4 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
              <button onClick={handleEditGroup} disabled={saving}
                className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60">
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </DashboardLayout>
  );
};

export default GroupManagement;