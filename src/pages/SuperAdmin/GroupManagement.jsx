// src/pages/SuperAdmin/GroupManagement.jsx
// ─────────────────────────────────────────────────────────────────────────────

import { useToast } from '../../context/ToastContext';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ExcelLikeGrid from '../../components/StudentGrid/ExcelLikeGrid';
import { superAdminGroupAPI } from '../../api/groupAPI';
import apiCall from '../../api/Api';
import {
  Users, Plus, Search, Edit2, Trash2, X, AlertCircle, CheckCircle,
  Building2, Crown, Hash, Copy, Sliders, Info, RefreshCw, Calendar,
  ArrowRight, ChevronRight, GraduationCap, BookOpen,
  UserCheck, Layers, AlertTriangle,
} from 'lucide-react';

// ─── Plan config ──────────────────────────────────────────────────────────────
const PLANS = {
  free:       { label: 'Free',       totalStudents: 100,    perGroup: 100,    maxGroups: 5,      color: 'gray'   },
  basic:      { label: 'Basic',      totalStudents: 500,    perGroup: 150,    maxGroups: 20,     color: 'blue'   },
  pro:        { label: 'Pro',        totalStudents: 999999, perGroup: 999999, maxGroups: 999999, color: 'purple' },
  enterprise: { label: 'Enterprise', totalStudents: 999999, perGroup: 999999, maxGroups: 999999, color: 'amber'  },
};

const PLAN_STYLES = {
  gray:   { badge: 'bg-gray-100 text-gray-600 border-gray-200',     dot: 'bg-gray-400',   },
  blue:   { badge: 'bg-blue-50 text-blue-700 border-blue-200',      dot: 'bg-blue-500',   },
  purple: { badge: 'bg-purple-50 text-purple-700 border-purple-200',dot: 'bg-purple-500', },
  amber:  { badge: 'bg-amber-50 text-amber-700 border-amber-200',   dot: 'bg-amber-500',  },
};

// ─── Micro components ─────────────────────────────────────────────────────────
const Spinner = ({ size = 5, color = 'indigo' }) => (
  <div className={`w-${size} h-${size} border-2 border-${color}-400 border-t-transparent rounded-full animate-spin`} />
);

const EmptyState = ({ icon: Icon, title, subtitle, action }) => (
  <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6 py-12">
    <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
      <Icon size={28} className="text-gray-300" />
    </div>
    <div>
      <p className="text-sm font-semibold text-gray-500">{title}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
    {action}
  </div>
);

const StatCard = ({ icon: Icon, label, value, colorClass }) => (
  <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-gray-100 shadow-sm min-w-0">
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
      <Icon size={17} />
    </div>
    <div className="min-w-0">
      <div className="text-xs text-gray-500 leading-none">{label}</div>
      <div className="text-lg font-bold text-gray-900 leading-tight mt-0.5">{value}</div>
    </div>
  </div>
);

const ModalOverlay = ({ children, onClose }) => (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
    <div onClick={e => e.stopPropagation()}>{children}</div>
  </div>
);

// ─── Shared form input ────────────────────────────────────────────────────────
const FInput = ({ label, value, onChange, placeholder, type = 'text', required }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-700 mb-1">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    <input
      type={type} placeholder={placeholder} value={value || ''}
      onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white transition"
    />
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────
const SuperAdminGroupManagement = () => {
  const toast    = useToast();
  const navigate = useNavigate();

  const [colleges,         setColleges]         = useState([]);
  const [selectedCollege,  setSelectedCollege]  = useState(null);
  const [groups,           setGroups]           = useState([]);
  const [selectedGroup,    setSelectedGroup]    = useState(null);
  const [students,         setStudents]         = useState([]);
  const [staffMembers,     setStaffMembers]     = useState([]);
  const [subscriptions,    setSubscriptions]    = useState({});
  const [collegesLoading,  setCollegesLoading]  = useState(false);
  const [groupsLoading,    setGroupsLoading]    = useState(false);
  const [studentsLoading,  setStudentsLoading]  = useState(false);
  const [saving,           setSaving]           = useState(false);
  const [collegeSearch,    setCollegeSearch]    = useState('');
  const [groupSearch,      setGroupSearch]      = useState('');
  const [showLimitModal,   setShowLimitModal]   = useState(false);
  const [showCreateModal,  setShowCreateModal]  = useState(false);
  const [showEditModal,    setShowEditModal]    = useState(false);
  const [confirmDelete,    setConfirmDelete]    = useState(null);
  const [limitTarget,      setLimitTarget]      = useState(null);
  const [limitForm,        setLimitForm]        = useState({ plan: 'free', customTotal: '', customPerGroup: '' });
  const [editingGroup,     setEditingGroup]     = useState(null);
  const [newGroup,         setNewGroup]         = useState({ name: '', branch: '', batch: '', semester: '', assignedStaff: '', academicYear: '' });
  const [copiedId,         setCopiedId]         = useState('');

  // Plan helpers
  const getCollegePlan   = (cid) => subscriptions[cid]?.plan || 'free';
  const getCollegeLimits = (cid) => {
    const sub = subscriptions[cid]; const base = PLANS[sub?.plan || 'free'];
    return { ...base, totalStudents: sub?.customLimits?.totalStudents ?? base.totalStudents, perGroup: sub?.customLimits?.perGroup ?? base.perGroup };
  };
  const isCollegePro = (cid) => ['pro','enterprise'].includes(getCollegePlan(cid));
  const selPlan    = selectedCollege ? getCollegePlan(selectedCollege._id)   : 'free';
  const selLimits  = selectedCollege ? getCollegeLimits(selectedCollege._id) : PLANS.free;
  const selIsPro   = selectedCollege ? isCollegePro(selectedCollege._id)     : false;
  const totalGroups   = groups.length;
  const totalStudents = groups.reduce((a, g) => a + (g.studentCount || 0), 0);

  // Lifecycle
  useEffect(() => { fetchColleges(); }, []);
  useEffect(() => {
    if (selectedCollege) { setSelectedGroup(null); setStudents([]); setGroups([]); fetchCollegeGroups(selectedCollege._id); fetchCollegeStaff(selectedCollege._id); }
  }, [selectedCollege]);
  useEffect(() => { if (selectedGroup) fetchGroupStudents(selectedGroup._id); }, [selectedGroup]);

  // Fetch
  const fetchColleges = async () => {
    try {
      setCollegesLoading(true);
      const res  = await apiCall('/super-admin/colleges');
      const list = res?.data || res?.colleges || [];
      setColleges(list);
      const subMap = {};
      await Promise.allSettled(list.map(async c => {
        try { const sr = await superAdminGroupAPI.getSubscription(c._id); subMap[c._id] = sr?.data || { plan: 'free' }; }
        catch { subMap[c._id] = { plan: 'free' }; }
      }));
      setSubscriptions(subMap);
    } catch { setColleges([]); } finally { setCollegesLoading(false); }
  };

  const fetchCollegeGroups = async (cid) => {
    try { setGroupsLoading(true); const res = await superAdminGroupAPI.getGroups({ collegeId: cid }); setGroups(res?.data || res?.groups || []); }
    catch { setGroups([]); } finally { setGroupsLoading(false); }
  };

  const fetchCollegeStaff = async (cid) => {
    try { const res = await apiCall(`/super-admin/colleges/${cid}/admins`); setStaffMembers(res?.data || []); }
    catch { setStaffMembers([]); }
  };

  const fetchGroupStudents = async (gid) => {
    try { setStudentsLoading(true); const res = await superAdminGroupAPI.getGroupStudents(gid); setStudents(res?.data?.students || res?.students || res?.data || []); }
    catch { setStudents([]); } finally { setStudentsLoading(false); }
  };

  // Mutations
  const handleCreateGroup = async () => {
    if (!newGroup.name?.trim() || !selectedCollege) return;
    setSaving(true);
    try {
      const res = await superAdminGroupAPI.createGroup({ ...newGroup, collegeId: selectedCollege._id });
      setGroups(prev => [...prev, res?.data || res?.group || { _id: `grp_${Date.now()}`, ...newGroup, studentCount: 0, createdAt: new Date().toISOString() }]);
      toast.success('Success', 'Group created!');
      setShowCreateModal(false);
      setNewGroup({ name: '', branch: '', batch: '', semester: '', assignedStaff: '', academicYear: '' });
    } catch { toast.error('Error', 'Failed to create group.'); } finally { setSaving(false); }
  };

  const handleEditGroup = async () => {
    if (!editingGroup) return; setSaving(true);
    try { await superAdminGroupAPI.updateGroup(editingGroup._id, editingGroup); } catch {}
    setGroups(prev => prev.map(g => g._id === editingGroup._id ? editingGroup : g));
    if (selectedGroup?._id === editingGroup._id) setSelectedGroup(editingGroup);
    toast.success('Success', 'Group updated!');
    setShowEditModal(false); setSaving(false);
  };

  const handleDeleteGroup = async (groupId) => {
    setSaving(true);
    try { await superAdminGroupAPI.deleteGroup(groupId); } catch {}
    setGroups(prev => prev.filter(g => g._id !== groupId));
    if (selectedGroup?._id === groupId) { setSelectedGroup(null); setStudents([]); }
    toast.success('Success', 'Group deleted.');
    setConfirmDelete(null); setSaving(false);
  };

  const handleUpdatePlan = async () => {
    if (!limitTarget) return; setSaving(true);
    const payload = { plan: limitForm.plan, customLimits: { totalStudents: limitForm.customTotal ? parseInt(limitForm.customTotal) : undefined, perGroup: limitForm.customPerGroup ? parseInt(limitForm.customPerGroup) : undefined } };
    try { await superAdminGroupAPI.updateSubscription(limitTarget.collegeId, payload); } catch {}
    setSubscriptions(prev => ({ ...prev, [limitTarget.collegeId]: { plan: limitForm.plan, customLimits: payload.customLimits } }));
    toast.success('Success', `Plan updated to ${PLANS[limitForm.plan]?.label}!`);
    setShowLimitModal(false); setSaving(false);
  };

  const handleBulkSave = async (dirtyRows) => {
    if (!selectedGroup) return;
    const groupId = selectedGroup._id;
    const toCreate = dirtyRows.filter(r => r.isNew);
    const toUpdate = dirtyRows.filter(r => !r.isNew);
    if (toCreate.length) {
      try { await superAdminGroupAPI.bulkAddStudents(groupId, toCreate.map(r => ({ name: r.name, rollNumber: r.rollNumber, email: r.email, role: r.role, password: r.password }))); }
      catch { setStudents(prev => [...prev, ...toCreate.map(r => ({ ...r, isNew: false }))]); }
    }
    for (const row of toUpdate) { try { await superAdminGroupAPI.updateStudent(groupId, row._id, row); } catch {} }
    await fetchGroupStudents(groupId);
    setGroups(prev => prev.map(g => g._id === groupId ? { ...g, studentCount: students.length + toCreate.length } : g));
  };

  const handleDeleteStudent = async (studentId) => {
    if (!selectedGroup) return;
    try { await superAdminGroupAPI.deleteStudent(selectedGroup._id, studentId); } catch {}
    setStudents(prev => prev.filter(s => s._id !== studentId));
  };

  // Utils
  const copyId = (id) => { navigator.clipboard?.writeText(id); setCopiedId(id); setTimeout(() => setCopiedId(''), 2000); };
  const getStaffName = (sid) => { const s = staffMembers.find(m => m._id === sid); return s?.name || s?.fullName || null; };
  const getCapacityPct = (g) => selIsPro ? 0 : Math.min(100, ((g.studentCount || 0) / selLimits.perGroup) * 100);
  const getCapacityColor = (pct) => pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-amber-400' : 'bg-emerald-500';

  const filteredColleges = colleges.filter(c => c.name?.toLowerCase().includes(collegeSearch.toLowerCase()) || c._id?.toLowerCase().includes(collegeSearch.toLowerCase()));
  const filteredGroups   = groups.filter(g => g.name?.toLowerCase().includes(groupSearch.toLowerCase()) || g.branch?.toLowerCase().includes(groupSearch.toLowerCase()));

  const CopyBtn = ({ id }) => (
    <button onClick={e => { e.stopPropagation(); copyId(id); }} className="text-gray-400 hover:text-indigo-500 transition-colors" title="Copy ID">
      {copiedId === id ? <CheckCircle size={10} className="text-emerald-500" /> : <Copy size={10} />}
    </button>
  );

  const SemesterSelect = ({ value, onChange }) => (
    <div>
      <label className="block text-xs font-semibold text-gray-700 mb-1">Semester</label>
      <select value={value || ''} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
        <option value="">Select…</option>
        {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
      </select>
    </div>
  );

  const StaffSelect = ({ value, onChange }) => (
    <div>
      <label className="block text-xs font-semibold text-gray-700 mb-1">Assign Staff <span className="font-normal text-gray-400">(optional)</span></label>
      <select value={value || ''} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
        <option value="">No staff assigned</option>
        {staffMembers.map(s => <option key={s._id} value={s._id}>{s.name || s.fullName}</option>)}
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
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-md shadow-blue-200">
              <Layers size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">Group Management</h1>
              <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                <Building2 size={10}/> Colleges <ChevronRight size={10}/> <Users size={10}/> Groups <ChevronRight size={10}/> <GraduationCap size={10}/> Students
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={fetchColleges} disabled={collegesLoading}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
              <RefreshCw size={13} className={collegesLoading ? 'animate-spin' : ''} /> Refresh
            </button>
            <button onClick={() => navigate('/dashboard/super-admin/subscriptions')}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors font-medium">
              <Crown size={13}/> Subscriptions
            </button>
            {selectedCollege && (
              <button onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors shadow-sm shadow-blue-200">
                <Plus size={15}/> New Group
              </button>
            )}
          </div>
        </div>

        {/* ── Stats (when college selected) ─── */}
        {selectedCollege && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard icon={Users}        label="Groups"         value={totalGroups}                                          colorClass="bg-indigo-50 text-indigo-600"  />
            <StatCard icon={GraduationCap} label="Total Students" value={totalStudents}                                       colorClass="bg-blue-50 text-blue-600"     />
            <StatCard icon={BookOpen}     label="Capacity Used"  value={selIsPro ? '∞' : `${totalStudents}/${selLimits.totalStudents}`} colorClass="bg-blue-50 text-blue-600" />
            <StatCard icon={Crown}        label="Plan"           value={PLANS[selPlan]?.label || 'Free'}                     colorClass="bg-amber-50 text-amber-600"   />
          </div>
        )}

        {/* ── 3-column layout ─── */}
        <div className="flex flex-1 gap-3 min-h-0 overflow-hidden">

          {/* ═══ Column 1: Colleges ═══════════════════════════════════════════ */}
          <div className="w-60 flex-shrink-0 flex flex-col rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-3 pt-3 pb-2 bg-gradient-to-b from-indigo-50/80 to-white border-b border-gray-100">
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-5 h-5 bg-indigo-100 rounded flex items-center justify-center">
                  <Building2 size={11} className="text-indigo-600"/>
                </div>
                <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Colleges</span>
                <span className="ml-auto text-xs font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{filteredColleges.length}</span>
              </div>
              <div className="relative">
                <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"/>
                <input type="text" placeholder="Search colleges..." value={collegeSearch} onChange={e => setCollegeSearch(e.target.value)}
                  className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"/>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {collegesLoading ? (
                <div className="flex items-center justify-center py-10"><Spinner color="indigo"/></div>
              ) : filteredColleges.length === 0 ? (
                <EmptyState icon={Building2} title="No colleges" subtitle="No results match your search"/>
              ) : filteredColleges.map(college => {
                const plan     = getCollegePlan(college._id);
                const planInfo = PLANS[plan] || PLANS.free;
                const pStyle   = PLAN_STYLES[planInfo.color] || PLAN_STYLES.gray;
                const isActive = selectedCollege?._id === college._id;
                return (
                  <button key={college._id} onClick={() => setSelectedCollege(college)}
                    className={`w-full text-left px-3 py-2.5 border-b border-gray-50 transition-all ${isActive ? 'bg-indigo-50 border-l-2 border-l-indigo-500' : 'hover:bg-gray-50 border-l-2 border-l-transparent'}`}>
                    <div className="flex items-start gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${pStyle.dot}`}/>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-sm text-gray-900 truncate leading-tight">{college.name}</div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="font-mono text-xs text-indigo-500 truncate max-w-[100px]">{college._id?.slice(-8)}</span>
                          <CopyBtn id={college._id}/>
                        </div>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className={`inline-flex items-center px-1.5 py-0.5 text-xs font-semibold rounded-md border ${pStyle.badge}`}>{planInfo.label}</span>
                          <button
                            onClick={e => { e.stopPropagation(); setLimitTarget({ collegeId: college._id, collegeName: college.name }); setLimitForm({ plan, customTotal: '', customPerGroup: '' }); setShowLimitModal(true); }}
                            className="flex items-center gap-0.5 px-1.5 py-0.5 text-xs text-gray-500 border border-gray-200 rounded hover:bg-gray-100 transition-colors">
                            <Sliders size={8}/> Plan
                          </button>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ═══ Column 2: Groups ════════════════════════════════════════════ */}
          <div className="w-64 flex-shrink-0 flex flex-col rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-3 pt-3 pb-2 bg-gradient-to-b from-blue-50/80 to-white border-b border-gray-100">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-5 h-5 bg-violet-100 rounded flex items-center justify-center">
                  <Users size={11} className="text-blue-600"/>
                </div>
                <span className="text-xs font-bold text-violet-800 uppercase tracking-wider">Groups</span>
                {selectedCollege && <span className="text-xs text-gray-400 truncate max-w-[70px] ml-0.5">· {selectedCollege.name}</span>}
                <span className="ml-auto text-xs font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{filteredGroups.length}</span>
              </div>
              {selectedCollege && (
                <div className="flex items-center gap-1 mb-2 px-2 py-1 bg-white rounded-lg border border-indigo-100">
                  <Hash size={9} className="text-indigo-400 flex-shrink-0"/>
                  <span className="font-mono text-xs text-indigo-600 truncate flex-1">{selectedCollege._id}</span>
                  <CopyBtn id={selectedCollege._id}/>
                </div>
              )}
              <div className="relative">
                <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"/>
                <input type="text" placeholder="Search groups..." value={groupSearch} onChange={e => setGroupSearch(e.target.value)}
                  className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"/>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {!selectedCollege ? (
                <EmptyState icon={Building2} title="No college selected" subtitle="Pick a college to see its groups"/>
              ) : groupsLoading ? (
                <div className="flex items-center justify-center py-10"><Spinner color="violet"/></div>
              ) : filteredGroups.length === 0 ? (
                <EmptyState icon={Users} title="No groups yet" subtitle="Create the first group for this college"
                  action={<button onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white text-xs rounded-lg hover:bg-violet-700 transition-colors">
                    <Plus size={12}/> Create group</button>}/>
              ) : filteredGroups.map(group => {
                const isActive = selectedGroup?._id === group._id;
                const pct      = getCapacityPct(group);
                const capColor = getCapacityColor(pct);
                return (
                  <button key={group._id} onClick={() => setSelectedGroup(group)}
                    className={`w-full text-left px-3 py-2.5 border-b border-gray-50 transition-all ${isActive ? 'bg-blue-50 border-l-2 border-l-violet-500' : 'hover:bg-gray-50 border-l-2 border-l-transparent'}`}>
                    <div className="flex items-start justify-between gap-1">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-sm text-gray-900 truncate">{group.name}</div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="font-mono text-xs text-violet-500 truncate max-w-[90px]">{(group.groupId || group._id)?.slice(-10)}</span>
                          <CopyBtn id={group.groupId || group._id}/>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {group.branch && <span className="px-1.5 py-0.5 text-xs bg-blue-50 text-blue-600 rounded-md border border-blue-100">{group.branch}</span>}
                          {group.semester && <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-md">Sem {group.semester}</span>}
                          {group.batch   && <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-500 rounded-md">{group.batch}</span>}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-bold text-gray-800">{group.studentCount || 0}</div>
                        <div className="text-xs text-gray-400">{selIsPro ? '∞' : `/${selLimits.perGroup}`}</div>
                      </div>
                    </div>
                    {!selIsPro && (
                      <div className="mt-2 w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${capColor}`} style={{ width: `${pct}%` }}/>
                      </div>
                    )}
                    <div className="flex gap-1.5 mt-2" onClick={e => e.stopPropagation()}>
                      <button onClick={() => { setEditingGroup({ ...group }); setShowEditModal(true); }}
                        className="flex-1 flex items-center justify-center gap-1 py-1 text-xs text-violet-700 bg-blue-50 rounded-md hover:bg-violet-100 transition-colors border border-violet-100">
                        <Edit2 size={9}/> Edit
                      </button>
                      <button onClick={() => setConfirmDelete({ groupId: group._id, groupName: group.name })}
                        className="flex-1 flex items-center justify-center gap-1 py-1 text-xs text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors border border-red-100">
                        <Trash2 size={9}/> Delete
                      </button>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ═══ Column 3: Students ══════════════════════════════════════════ */}
          <div className="flex-1 min-w-0 flex flex-col rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
            {!selectedGroup ? (
              <EmptyState icon={GraduationCap}
                title={!selectedCollege ? 'Select a college to get started' : 'Select a group to manage students'}
                subtitle={!selectedCollege ? 'Colleges → Groups → Students' : 'Choose a group from the left panel'}/>
            ) : (
              <>
                {/* Group header */}
                <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-sm font-bold text-gray-900">{selectedGroup.name}</h2>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-md border ${PLAN_STYLES[PLANS[selPlan]?.color || 'gray']?.badge}`}>
                          {PLANS[selPlan]?.label}
                        </span>
                        {selectedGroup.branch   && <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-md border border-blue-100">{selectedGroup.branch}</span>}
                        {selectedGroup.semester && <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-md">Semester {selectedGroup.semester}</span>}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Hash size={9} className="text-indigo-400"/>
                          <span className="font-mono text-indigo-600">{selectedGroup.groupId || selectedGroup._id}</span>
                          <CopyBtn id={selectedGroup.groupId || selectedGroup._id}/>
                        </span>
                        {selectedCollege && (
                          <span className="flex items-center gap-1">
                            <Building2 size={9}/>
                            <span className="font-mono text-indigo-500">{selectedCollege._id?.slice(-10)}…</span>
                            <CopyBtn id={selectedCollege._id}/>
                          </span>
                        )}
                        {selectedGroup.assignedStaff && (
                          <span className="flex items-center gap-1"><UserCheck size={9}/>{getStaffName(selectedGroup.assignedStaff) || 'Unassigned'}</span>
                        )}
                        {selectedGroup.batch && <span className="flex items-center gap-1"><Calendar size={9}/>{selectedGroup.batch}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xl font-bold text-gray-900 leading-none">{students.length}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{selIsPro ? 'unlimited' : `/ ${selLimits.perGroup} max`}</div>
                      </div>
                      <button
                        onClick={() => { setLimitTarget({ collegeId: selectedCollege._id, collegeName: selectedCollege.name }); setLimitForm({ plan: selPlan, customTotal: '', customPerGroup: '' }); setShowLimitModal(true); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-purple-200 text-purple-700 rounded-lg hover:bg-purple-50 transition-colors font-medium">
                        <Sliders size={11}/> Adjust Limits
                      </button>
                    </div>
                  </div>
                  {/* Near-limit warning */}
                  {!selIsPro && students.length >= selLimits.perGroup * 0.9 && (
                    <div className="flex items-center gap-2 mt-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                      <AlertTriangle size={11} className="flex-shrink-0"/>
                      {students.length >= selLimits.perGroup
                        ? 'Group is at capacity. Upgrade or adjust limits to add more students.'
                        : `Approaching limit — ${selLimits.perGroup - students.length} slots remaining.`}
                    </div>
                  )}
                </div>
                {/* ExcelLikeGrid */}
                <div className="flex-1 overflow-hidden">
                  {studentsLoading ? (
                    <div className="flex items-center justify-center h-full"><Spinner size={8} color="indigo"/></div>
                  ) : (
                    <ExcelLikeGrid
                      students={students}
                      groupId={selectedGroup.groupId || selectedGroup._id}
                      groupName={selectedGroup.name}
                      onBulkSave={handleBulkSave}
                      onDelete={handleDeleteStudent}
                      editable={true}
                      maxStudents={selIsPro ? 999999 : selLimits.perGroup}
                      isPro={selIsPro}
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
                <AlertTriangle size={22} className="text-red-500"/>
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">Delete Group?</h3>
              <p className="text-sm text-gray-500">
                Are you sure you want to delete <span className="font-semibold text-gray-800">"{confirmDelete.groupName}"</span>?<br/>
                All students in this group will also be removed.
              </p>
            </div>
            <div className="flex items-center gap-3 p-4 pt-0">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={() => handleDeleteGroup(confirmDelete.groupId)} disabled={saving}
                className="flex-1 py-2 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-60">
                {saving ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* ══ MODAL: Subscription & Limits ══════════════════════════════════════ */}
      {showLimitModal && limitTarget && (
        <ModalOverlay onClose={() => setShowLimitModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center"><Crown size={15} className="text-purple-600"/></div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Subscription & Limits</h3>
                  <p className="text-xs text-gray-400">{limitTarget.collegeName}</p>
                </div>
              </div>
              <button onClick={() => setShowLimitModal(false)} className="text-gray-400 hover:text-gray-600"><X size={18}/></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-2 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                <Building2 size={14} className="text-indigo-500 flex-shrink-0"/>
                <div className="min-w-0">
                  <div className="font-semibold text-sm text-gray-900 truncate">{limitTarget.collegeName}</div>
                  <div className="font-mono text-xs text-indigo-500">{limitTarget.collegeId}</div>
                </div>
              </div>
              <div>
                <div className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Select Plan</div>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(PLANS).map(([key, p]) => {
                    const pStyle = PLAN_STYLES[p.color];
                    return (
                      <button key={key} onClick={() => setLimitForm(prev => ({ ...prev, plan: key }))}
                        className={`p-3 text-left rounded-xl border-2 transition-all ${limitForm.plan === key ? 'border-indigo-500 bg-indigo-50 shadow-sm' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <div className={`w-2 h-2 rounded-full ${pStyle.dot}`}/>
                          <span className="font-bold text-sm text-gray-900">{p.label}</span>
                        </div>
                        <div className="text-xs text-gray-500">{p.totalStudents >= 999999 ? 'Unlimited' : p.totalStudents} students</div>
                        <div className="text-xs text-gray-400">{p.perGroup >= 999999 ? 'Unlimited' : p.perGroup}/group · {p.maxGroups >= 999999 ? '∞' : p.maxGroups} groups</div>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="border-t pt-4">
                <div className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Custom Overrides <span className="font-normal normal-case text-gray-400">(optional)</span></div>
                <div className="grid grid-cols-2 gap-3">
                  <FInput label="Max Total Students" value={limitForm.customTotal} onChange={v => setLimitForm(p => ({ ...p, customTotal: v }))} type="number"
                    placeholder={`Default: ${PLANS[limitForm.plan]?.totalStudents >= 999999 ? '∞' : PLANS[limitForm.plan]?.totalStudents}`}/>
                  <FInput label="Max Per Group" value={limitForm.customPerGroup} onChange={v => setLimitForm(p => ({ ...p, customPerGroup: v }))} type="number"
                    placeholder={`Default: ${PLANS[limitForm.plan]?.perGroup >= 999999 ? '∞' : PLANS[limitForm.plan]?.perGroup}`}/>
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl text-xs text-blue-700 border border-blue-100">
                <Info size={12} className="mt-0.5 flex-shrink-0"/>
                Custom overrides take precedence over plan defaults. Leave blank to use plan defaults.
              </div>
              <button onClick={() => { setShowLimitModal(false); navigate('/dashboard/super-admin/subscriptions'); }}
                className="w-full flex items-center justify-center gap-2 py-2 text-sm text-purple-600 border border-purple-200 rounded-xl hover:bg-purple-50 transition-colors">
                Open Full Subscription Management <ArrowRight size={13}/>
              </button>
            </div>
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowLimitModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
              <button onClick={handleUpdatePlan} disabled={saving}
                className="px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60">
                {saving ? 'Saving…' : 'Update Plan'}
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* ══ MODAL: Create Group ════════════════════════════════════════════════ */}
      {showCreateModal && selectedCollege && (
        <ModalOverlay onClose={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center"><Plus size={15} className="text-indigo-600"/></div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Create New Group</h3>
                  <p className="text-xs text-gray-400">{selectedCollege.name}</p>
                </div>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600"><X size={18}/></button>
            </div>
            <div className="p-5 space-y-3">
              <FInput label="Group Name" required value={newGroup.name} onChange={v => setNewGroup(p => ({ ...p, name: v }))} placeholder="e.g. CSE Section A"/>
              <div className="grid grid-cols-2 gap-3">
                <FInput label="Branch"        value={newGroup.branch}       onChange={v => setNewGroup(p => ({ ...p, branch: v }))}       placeholder="CSE"/>
                <FInput label="Batch"         value={newGroup.batch}        onChange={v => setNewGroup(p => ({ ...p, batch: v }))}        placeholder="2021-2025"/>
                <FInput label="Academic Year" value={newGroup.academicYear} onChange={v => setNewGroup(p => ({ ...p, academicYear: v }))} placeholder="2024-2025"/>
                <SemesterSelect value={newGroup.semester} onChange={v => setNewGroup(p => ({ ...p, semester: v }))}/>
              </div>
              <StaffSelect value={newGroup.assignedStaff} onChange={v => setNewGroup(p => ({ ...p, assignedStaff: v }))}/>
            </div>
            <div className="flex justify-end gap-3 px-5 py-4 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
              <button onClick={handleCreateGroup} disabled={saving || !newGroup.name?.trim()}
                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50">
                {saving ? 'Creating…' : <><Plus size={14}/> Create Group</>}
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* ══ MODAL: Edit Group ═════════════════════════════════════════════════ */}
      {showEditModal && editingGroup && (
        <ModalOverlay onClose={() => setShowEditModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center"><Edit2 size={14} className="text-blue-600"/></div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Edit Group</h3>
                  <p className="text-xs text-gray-400">{editingGroup.name}</p>
                </div>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600"><X size={18}/></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 rounded-xl border border-indigo-100">
                <Hash size={11} className="text-indigo-500 flex-shrink-0"/>
                <span className="text-xs text-gray-500">Group ID:</span>
                <span className="font-mono text-xs text-indigo-600 flex-1 truncate">{editingGroup.groupId || editingGroup._id}</span>
                <CopyBtn id={editingGroup.groupId || editingGroup._id}/>
              </div>
              <FInput label="Group Name" required value={editingGroup.name} onChange={v => setEditingGroup(p => ({ ...p, name: v }))}/>
              <div className="grid grid-cols-2 gap-3">
                <FInput label="Branch"        value={editingGroup.branch}       onChange={v => setEditingGroup(p => ({ ...p, branch: v }))}/>
                <FInput label="Batch"         value={editingGroup.batch}        onChange={v => setEditingGroup(p => ({ ...p, batch: v }))}/>
                <FInput label="Academic Year" value={editingGroup.academicYear} onChange={v => setEditingGroup(p => ({ ...p, academicYear: v }))}/>
                <SemesterSelect value={editingGroup.semester} onChange={v => setEditingGroup(p => ({ ...p, semester: v }))}/>
              </div>
              <StaffSelect value={editingGroup.assignedStaff} onChange={v => setEditingGroup(p => ({ ...p, assignedStaff: v }))}/>
            </div>
            <div className="flex justify-end gap-3 px-5 py-4 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
              <button onClick={handleEditGroup} disabled={saving}
                className="px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60">
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </DashboardLayout>
  );
};

export default SuperAdminGroupManagement;