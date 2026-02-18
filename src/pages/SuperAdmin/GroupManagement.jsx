// src/pages/SuperAdmin/GroupManagement.jsx
import { useToast } from '../../context/ToastContext';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ExcelLikeGrid from '../../components/StudentGrid/ExcelLikeGrid';
import axios from 'axios';
import {
  Users, Plus, Search, Edit2, Trash2, X, AlertCircle, CheckCircle,
  Building2, Crown, Hash, Copy, Sliders, Info, UserCheck,
  RefreshCw, Calendar, ArrowRight,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const getToken = () => localStorage.getItem('token');

const PLANS = {
  free:       { label: 'Free',       totalStudents: 100,    perGroup: 100,    maxGroups: 5,  badgeCls: 'bg-gray-100 text-gray-600 border-gray-200' },
  basic:      { label: 'Basic',      totalStudents: 500,    perGroup: 150,    maxGroups: 20, badgeCls: 'bg-blue-100 text-blue-700 border-blue-200' },
  pro:        { label: 'Pro',        totalStudents: 999999, perGroup: 999999, maxGroups: 999999, badgeCls: 'bg-purple-100 text-purple-700 border-purple-200' },
  enterprise: { label: 'Enterprise', totalStudents: 999999, perGroup: 999999, maxGroups: 999999, badgeCls: 'bg-amber-100 text-amber-700 border-amber-200' },
};

const SuperAdminGroupManagement = () => {
  const toast = useToast();
  const navigate = useNavigate();

  // Data
  const [colleges, setColleges] = useState([]);
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [students, setStudents] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [subscriptions, setSubscriptions] = useState({}); // { collegeId: { plan, customLimits } }

  // Loading states
  const [collegesLoading, setCollegesLoading] = useState(false);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);

  // Search
  const [collegeSearch, setCollegeSearch] = useState('');
  const [groupSearch, setGroupSearch] = useState('');

  // Modals
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);

  // Forms
  const [limitTarget, setLimitTarget] = useState(null);
  const [limitForm, setLimitForm] = useState({ plan: 'free', customTotal: '', customPerGroup: '' });
  const [editingGroup, setEditingGroup] = useState(null);
  const [newGroup, setNewGroup] = useState({ name: '', branch: '', batch: '', semester: '', assignedStaff: '', academicYear: '' });

  // UI
  const [copiedId, setCopiedId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ──────────── Computed ────────────
  const getCollegePlan = (cid) => subscriptions[cid]?.plan || 'free';
  const getCollegeLimits = (cid) => {
    const sub = subscriptions[cid];
    const base = PLANS[sub?.plan || 'free'];
    return {
      ...base,
      totalStudents: sub?.customLimits?.totalStudents ?? base.totalStudents,
      perGroup: sub?.customLimits?.perGroup ?? base.perGroup,
    };
  };
  const isCollegePro = (cid) => ['pro', 'enterprise'].includes(getCollegePlan(cid));

  const selPlan    = selectedCollege ? getCollegePlan(selectedCollege._id)   : 'free';
  const selLimits  = selectedCollege ? getCollegeLimits(selectedCollege._id) : PLANS.free;
  const selIsPro   = selectedCollege ? isCollegePro(selectedCollege._id)     : false;

  // ──────────── Lifecycle ────────────
  useEffect(() => { fetchColleges(); }, []);
  useEffect(() => {
    if (selectedCollege) {
      setSelectedGroup(null); setStudents([]); setGroups([]);
      fetchCollegeGroups(selectedCollege._id);
      fetchCollegeStaff(selectedCollege._id);
    }
  }, [selectedCollege]);
  useEffect(() => { if (selectedGroup) fetchGroupStudents(selectedGroup._id); }, [selectedGroup]);

  const showMsg = (msg, type = 'success') => {
    if (type === 'success') {
      setSuccess(msg);
      toast.success('Success', msg);
      setTimeout(() => setSuccess(''), 4000);
    } else {
      setError(msg);
      toast.error('Error', msg);
      setTimeout(() => setError(''), 5000);
    }
  };

  // ──────────── Fetch ────────────
  const fetchColleges = async () => {
    try {
      setCollegesLoading(true);
      const res = await axios.get(`${API_URL}/colleges`, { headers: { Authorization: `Bearer ${getToken()}` } });
      const list = res.data?.data || [];
      setColleges(list);

      // Fetch subscriptions in parallel (ignore 404s gracefully)
      const subMap = {};
      await Promise.allSettled(list.map(async c => {
        try {
          const sr = await axios.get(`${API_URL}/subscriptions/college/${c._id}`, {
            headers: { Authorization: `Bearer ${getToken()}` },
          });
          subMap[c._id] = sr.data?.data || { plan: 'free' };
        } catch {
          subMap[c._id] = { plan: 'free' }; // default free if API not available
        }
      }));
      setSubscriptions(subMap);
    } catch {
      setColleges([]);
    } finally { setCollegesLoading(false); }
  };

  const fetchCollegeGroups = async (collegeId) => {
    try {
      setGroupsLoading(true);
      const res = await axios.get(`${API_URL}/groups?collegeId=${collegeId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setGroups(res.data?.data || []);
    } catch { setGroups([]); }
    finally { setGroupsLoading(false); }
  };

  const fetchCollegeStaff = async (collegeId) => {
    try {
      const res = await axios.get(`${API_URL}/colleges/${collegeId}/admins`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setStaffMembers(res.data?.data || []);
    } catch { setStaffMembers([]); }
  };

  const fetchGroupStudents = async (groupId) => {
    try {
      setStudentsLoading(true);
      const res = await axios.get(`${API_URL}/groups/${groupId}/students`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setStudents(res.data?.data?.students || []);
    } catch { setStudents([]); }
    finally { setStudentsLoading(false); }
  };

  // ──────────── Mutations ────────────
  const handleCreateGroup = async () => {
    if (!newGroup.name?.trim() || !selectedCollege) return;
    try {
      const res = await axios.post(`${API_URL}/groups`, { ...newGroup, collegeId: selectedCollege._id }, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setGroups(prev => [...prev, res.data?.data || { _id: `grp_${Date.now()}`, ...newGroup, studentCount: 0, createdAt: new Date().toISOString() }]);
    } catch {
      setGroups(prev => [...prev, { _id: `grp_${Date.now()}`, ...newGroup, collegeId: selectedCollege._id, studentCount: 0, createdAt: new Date().toISOString() }]);
    }
    showMsg('Group created!');
    setShowCreateGroupModal(false);
    setNewGroup({ name: '', branch: '', batch: '', semester: '', assignedStaff: '', academicYear: '' });
  };

  const handleEditGroup = async () => {
    if (!editingGroup) return;
    try {
      await axios.put(`${API_URL}/groups/${editingGroup._id}`, editingGroup, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
    } catch {}
    setGroups(prev => prev.map(g => g._id === editingGroup._id ? editingGroup : g));
    if (selectedGroup?._id === editingGroup._id) setSelectedGroup(editingGroup);
    showMsg('Group updated!');
    setShowEditGroupModal(false);
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm('Delete this group and all its students?')) return;
    try {
      await axios.delete(`${API_URL}/groups/${groupId}`, { headers: { Authorization: `Bearer ${getToken()}` } });
    } catch {}
    setGroups(prev => prev.filter(g => g._id !== groupId));
    if (selectedGroup?._id === groupId) { setSelectedGroup(null); setStudents([]); }
    showMsg('Group deleted.');
  };

  // ──────────── Subscription update ────────────
  const handleUpdatePlan = async () => {
    if (!limitTarget) return;
    const { collegeId } = limitTarget;
    const payload = {
      plan: limitForm.plan,
      customLimits: {
        totalStudents: limitForm.customTotal ? parseInt(limitForm.customTotal) : undefined,
        perGroup: limitForm.customPerGroup ? parseInt(limitForm.customPerGroup) : undefined,
      },
    };
    try {
      await axios.put(`${API_URL}/subscriptions/college/${collegeId}`, payload, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
    } catch {}
    // Optimistic local update regardless
    setSubscriptions(prev => ({
      ...prev,
      [collegeId]: { plan: limitForm.plan, customLimits: payload.customLimits },
    }));
    showMsg(`Plan updated to ${PLANS[limitForm.plan]?.label || limitForm.plan}!`);
    setShowLimitModal(false);
  };

  // ──────────── Student save / delete ────────────
  const handleBulkSave = async (dirtyRows) => {
    if (!selectedGroup) return;
    const groupId = selectedGroup._id;
    const toCreate = dirtyRows.filter(r => r.isNew);
    const toUpdate = dirtyRows.filter(r => !r.isNew);

    if (toCreate.length) {
      try {
        await axios.post(`${API_URL}/groups/${groupId}/students/bulk`, {
          students: toCreate.map(r => ({ name: r.name, rollNumber: r.rollNumber, email: r.email, role: r.role, password: r.password })),
        }, { headers: { Authorization: `Bearer ${getToken()}` } });
      } catch {
        setStudents(prev => [...prev, ...toCreate.map(r => ({ ...r, isNew: false }))]);
      }
    }
    for (const row of toUpdate) {
      try {
        await axios.put(`${API_URL}/groups/${groupId}/students/${row._id}`, row, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
      } catch {}
    }
    await fetchGroupStudents(groupId);
    setGroups(prev => prev.map(g => g._id === groupId ? { ...g, studentCount: students.length + toCreate.length } : g));
  };

  const handleDeleteStudent = async (studentId) => {
    if (!selectedGroup) return;
    try {
      await axios.delete(`${API_URL}/groups/${selectedGroup._id}/students/${studentId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
    } catch {}
    setStudents(prev => prev.filter(s => s._id !== studentId));
  };

  // ──────────── Utils ────────────
  const copyId = (id) => {
    navigator.clipboard?.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(''), 2000);
  };
  const getStaffName = (sid) => {
    const s = staffMembers.find(m => m._id === sid);
    return s?.name || s?.fullName || 'Unassigned';
  };

  const filteredColleges = colleges.filter(c =>
    c.name?.toLowerCase().includes(collegeSearch.toLowerCase()) ||
    c._id?.toLowerCase().includes(collegeSearch.toLowerCase())
  );
  const filteredGroups = groups.filter(g =>
    g.name?.toLowerCase().includes(groupSearch.toLowerCase()) ||
    g.branch?.toLowerCase().includes(groupSearch.toLowerCase())
  );

  // ──────────── Render ────────────
  return (
    <DashboardLayout title="Student Group Management">
      <div className="flex flex-col gap-4" style={{ height: 'calc(100vh - 110px)' }}>

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Crown size={20} className="text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
              <p className="text-sm text-gray-500">Manage groups & students across all colleges</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchColleges}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw size={14} /> Refresh
            </button>
            <button
              onClick={() => navigate('/dashboard/super-admin/subscriptions')}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-purple-600 border border-purple-300 rounded-lg hover:bg-purple-50 transition-colors font-medium"
            >
              <Sliders size={14} /> Manage Subscriptions
            </button>
            {selectedCollege && (
              <button
                onClick={() => setShowCreateGroupModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium transition-colors shadow-sm"
              >
                <Plus size={16} /> New Group
              </button>
            )}
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <AlertCircle size={15} className="flex-shrink-0" /> {error}
            <button className="ml-auto" onClick={() => setError('')}><X size={14} /></button>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
            <CheckCircle size={15} className="flex-shrink-0" /> {success}
            <button className="ml-auto" onClick={() => setSuccess('')}><X size={14} /></button>
          </div>
        )}

        {/* 3-column layout */}
        <div className="flex flex-1 gap-3 min-h-0 overflow-hidden">

          {/* ── Column 1: Colleges ── */}
          <div className="w-60 flex-shrink-0 flex flex-col border border-gray-200 rounded-2xl bg-white/90 backdrop-blur-sm overflow-hidden shadow-sm">
            <div className="p-3 border-b bg-purple-50/80">
              <div className="flex items-center gap-2 mb-2">
                <Building2 size={13} className="text-purple-600" />
                <span className="text-xs font-bold text-purple-700 uppercase tracking-wide">Colleges</span>
                <span className="ml-auto text-xs text-gray-500 bg-white px-1.5 py-0.5 rounded-full border">
                  {filteredColleges.length}
                </span>
              </div>
              <div className="relative">
                <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text" placeholder="Search colleges..."
                  value={collegeSearch} onChange={e => setCollegeSearch(e.target.value)}
                  className="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {collegesLoading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredColleges.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400 text-xs gap-2">
                  <Building2 size={28} className="text-gray-200" />
                  No colleges found
                </div>
              ) : (
                filteredColleges.map(college => {
                  const plan = getCollegePlan(college._id);
                  const isSelected = selectedCollege?._id === college._id;
                  const planInfo = PLANS[plan] || PLANS.free;
                  return (
                    <div
                      key={college._id}
                      onClick={() => setSelectedCollege(college)}
                      className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-purple-50 transition-colors ${
                        isSelected ? 'bg-purple-50 border-l-4 border-l-purple-500' : ''
                      }`}
                    >
                      <div className="font-semibold text-sm text-gray-900 truncate">{college.name}</div>
                      {/* College ID */}
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="font-mono text-xs text-purple-600 truncate max-w-28">{college._id}</span>
                        <button onClick={e => { e.stopPropagation(); copyId(college._id); }} className="flex-shrink-0 text-gray-400 hover:text-purple-500">
                          {copiedId === college._id ? <CheckCircle size={10} className="text-green-500" /> : <Copy size={10} />}
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className={`px-1.5 py-0.5 text-xs font-semibold rounded-full border capitalize ${planInfo.badgeCls}`}>
                          {planInfo.label}
                        </span>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setLimitTarget({ collegeId: college._id, collegeName: college.name });
                            setLimitForm({ plan, customTotal: '', customPerGroup: '' });
                            setShowLimitModal(true);
                          }}
                          className="flex items-center gap-0.5 px-1.5 py-0.5 text-xs text-gray-500 border border-gray-200 rounded hover:bg-gray-100 transition-colors"
                          title="Adjust plan limits"
                        >
                          <Sliders size={9} /> Edit
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ── Column 2: Groups ── */}
          <div className="w-64 flex-shrink-0 flex flex-col border border-gray-200 rounded-2xl bg-white/90 backdrop-blur-sm overflow-hidden shadow-sm">
            <div className="p-3 border-b bg-blue-50/80">
              <div className="flex items-center gap-2 mb-1">
                <Users size={13} className="text-blue-600" />
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">Groups</span>
                {selectedCollege && (
                  <span className="text-xs text-gray-400 truncate ml-1 max-w-20">— {selectedCollege.name}</span>
                )}
                <span className="ml-auto text-xs text-gray-500 bg-white px-1.5 py-0.5 rounded-full border">
                  {filteredGroups.length}
                </span>
              </div>
              {selectedCollege && (
                <div className="flex items-center gap-1 mb-2 text-xs">
                  <span className="text-gray-500">College ID:</span>
                  <span className="font-mono text-purple-600 truncate">{selectedCollege._id}</span>
                  <button onClick={() => copyId(selectedCollege._id)} className="text-gray-400 hover:text-purple-500">
                    {copiedId === selectedCollege._id ? <CheckCircle size={9} className="text-green-500" /> : <Copy size={9} />}
                  </button>
                </div>
              )}
              <div className="relative">
                <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text" placeholder="Search groups..."
                  value={groupSearch} onChange={e => setGroupSearch(e.target.value)}
                  className="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {!selectedCollege ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400 text-xs gap-2">
                  <Building2 size={24} className="text-gray-200" />
                  Select a college first
                </div>
              ) : groupsLoading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredGroups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400 text-xs gap-2">
                  <Users size={24} className="text-gray-200" />
                  No groups yet
                  <button onClick={() => setShowCreateGroupModal(true)} className="text-blue-500 hover:underline">+ Create group</button>
                </div>
              ) : (
                filteredGroups.map(group => {
                  const isSelected = selectedGroup?._id === group._id;
                  const pct = selIsPro ? 0 : Math.min(100, ((group.studentCount || 0) / selLimits.perGroup) * 100);
                  return (
                    <div
                      key={group._id}
                      onClick={() => setSelectedGroup(group)}
                      className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-blue-50 transition-colors ${
                        isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-gray-900 truncate">{group.name}</div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="font-mono text-xs text-blue-600 truncate max-w-28">{group._id}</span>
                            <button onClick={e => { e.stopPropagation(); copyId(group._id); }} className="flex-shrink-0 text-gray-400 hover:text-blue-500">
                              {copiedId === group._id ? <CheckCircle size={9} className="text-green-500" /> : <Copy size={9} />}
                            </button>
                          </div>
                          <div className="flex gap-1.5 mt-1 text-xs text-gray-500 flex-wrap">
                            {group.branch && <span className="bg-gray-100 px-1.5 py-0.5 rounded">{group.branch}</span>}
                            {group.semester && <span>S{group.semester}</span>}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="font-bold text-gray-800 text-sm">{group.studentCount || 0}</div>
                          <div className="text-xs text-gray-400">{selIsPro ? '∞' : `/${selLimits.perGroup}`}</div>
                        </div>
                      </div>
                      {!selIsPro && (
                        <div className="mt-1.5 w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${pct > 90 ? 'bg-red-400' : pct > 70 ? 'bg-amber-400' : 'bg-green-400'}`}
                            style={{ width: `${pct}%` }} />
                        </div>
                      )}
                      <div className="flex gap-1 mt-2" onClick={e => e.stopPropagation()}>
                        <button onClick={() => { setEditingGroup({ ...group }); setShowEditGroupModal(true); }}
                          className="flex-1 flex items-center justify-center gap-1 py-1 text-xs text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors">
                          <Edit2 size={9} /> Edit
                        </button>
                        <button onClick={() => handleDeleteGroup(group._id)}
                          className="flex-1 flex items-center justify-center gap-1 py-1 text-xs text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors">
                          <Trash2 size={9} /> Del
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ── Column 3: Students ── */}
          <div className="flex-1 min-w-0 flex flex-col border border-gray-200 rounded-2xl bg-white/90 backdrop-blur-sm overflow-hidden shadow-sm">
            {!selectedGroup ? (
              <div className="flex flex-col items-center justify-center flex-1 text-gray-400 gap-4 p-8 text-center">
                <Users size={44} className="text-gray-200" />
                <div>
                  <p className="text-base font-semibold text-gray-500">Select a group</p>
                  <p className="text-sm mt-1">
                    {!selectedCollege ? 'Choose a college → then a group to manage students' : 'Choose a group from the left panel'}
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Group detail header */}
                <div className="p-4 border-b border-gray-100 bg-gray-50/80">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-base font-bold text-gray-900">{selectedGroup.name}</h2>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border capitalize ${PLANS[selPlan]?.badgeCls}`}>
                          {PLANS[selPlan]?.label}
                        </span>
                        {selectedGroup.branch && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">{selectedGroup.branch}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Hash size={10} />
                          <span className="font-mono text-blue-600">{selectedGroup._id}</span>
                          <button onClick={() => copyId(selectedGroup._id)} className="text-gray-400 hover:text-blue-500">
                            {copiedId === selectedGroup._id ? <CheckCircle size={10} className="text-green-500" /> : <Copy size={10} />}
                          </button>
                        </span>
                        <span>College: <span className="font-mono text-purple-600">{selectedCollege?._id}</span></span>
                        <span>Staff: {getStaffName(selectedGroup.assignedStaff)}</span>
                        {selectedGroup.batch && <span><Calendar size={10} className="inline" /> {selectedGroup.batch}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="font-bold text-gray-900 text-lg">{students.length}</div>
                        <div className="text-xs text-gray-500">{selIsPro ? 'unlimited' : `/ ${selLimits.perGroup} max`}</div>
                      </div>
                      <button
                        onClick={() => {
                          setLimitTarget({ collegeId: selectedCollege._id, collegeName: selectedCollege.name });
                          setLimitForm({ plan: selPlan, customTotal: '', customPerGroup: '' });
                          setShowLimitModal(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-purple-300 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors font-medium"
                      >
                        <Sliders size={11} /> Adjust Limits
                      </button>
                    </div>
                  </div>
                </div>

                {/* Excel grid */}
                <div className="flex-1 overflow-hidden">
                  {studentsLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <ExcelLikeGrid
                      students={students}
                      groupId={selectedGroup._id}
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

      {/* ───── Subscription / Limit Modal ───── */}
      {showLimitModal && limitTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <div className="flex items-center gap-2">
                <Crown size={18} className="text-purple-500" />
                <h3 className="text-base font-bold text-gray-900">Subscription & Limits</h3>
              </div>
              <button onClick={() => setShowLimitModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="p-3 bg-purple-50 rounded-xl text-sm border border-purple-100">
                <div className="font-semibold text-purple-900">{limitTarget.collegeName}</div>
                <div className="text-xs font-mono text-purple-600 mt-0.5">{limitTarget.collegeId}</div>
              </div>

              {/* Plan grid */}
              <div>
                <div className="text-xs font-semibold text-gray-700 mb-2">Select Plan</div>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(PLANS).map(([key, p]) => (
                    <button key={key} onClick={() => setLimitForm(prev => ({ ...prev, plan: key }))}
                      className={`p-3 text-left rounded-xl border-2 transition-all ${
                        limitForm.plan === key ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                      }`}>
                      <div className="font-semibold text-sm text-gray-900">{p.label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {p.totalStudents >= 999999 ? 'Unlimited' : p.totalStudents} students total
                      </div>
                      <div className="text-xs text-gray-500">
                        {p.perGroup >= 999999 ? 'Unlimited' : p.perGroup} per group
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom overrides */}
              <div className="border-t pt-3">
                <div className="text-xs font-semibold text-gray-700 mb-2">Custom Overrides (optional)</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Max Total Students</label>
                    <input type="number" min="1"
                      placeholder={`Default: ${PLANS[limitForm.plan]?.totalStudents >= 999999 ? '∞' : PLANS[limitForm.plan]?.totalStudents}`}
                      value={limitForm.customTotal} onChange={e => setLimitForm(p => ({ ...p, customTotal: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Max Per Group</label>
                    <input type="number" min="1"
                      placeholder={`Default: ${PLANS[limitForm.plan]?.perGroup >= 999999 ? '∞' : PLANS[limitForm.plan]?.perGroup}`}
                      value={limitForm.customPerGroup} onChange={e => setLimitForm(p => ({ ...p, customPerGroup: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-xl text-xs text-blue-700 flex items-start gap-2">
                <Info size={12} className="mt-0.5 flex-shrink-0" />
                Custom overrides take precedence over plan defaults. Leave blank to use plan defaults.
              </div>

              {/* Link to full subscriptions page */}
              <button
                onClick={() => { setShowLimitModal(false); navigate('/dashboard/super-admin/subscriptions'); }}
                className="w-full flex items-center justify-center gap-2 py-2 text-sm text-purple-600 border border-purple-200 rounded-xl hover:bg-purple-50 transition-colors"
              >
                Open Full Subscription Management <ArrowRight size={14} />
              </button>
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t">
              <button onClick={() => setShowLimitModal(false)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
              <button onClick={handleUpdatePlan}
                className="px-5 py-2 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-700 transition-colors">
                Update Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───── Create Group Modal ───── */}
      {showCreateGroupModal && selectedCollege && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-base font-bold text-gray-900">Create Group — {selectedCollege.name}</h3>
              <button onClick={() => setShowCreateGroupModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Group Name *</label>
                <input type="text" placeholder="e.g. CSE Section A" value={newGroup.name}
                  onChange={e => setNewGroup(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'branch', label: 'Branch', placeholder: 'CSE' },
                  { key: 'batch', label: 'Batch', placeholder: '2021-2025' },
                  { key: 'academicYear', label: 'Academic Year', placeholder: '2024-2025' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">{label}</label>
                    <input type="text" placeholder={placeholder} value={newGroup[key]}
                      onChange={e => setNewGroup(p => ({ ...p, [key]: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Semester</label>
                  <select value={newGroup.semester} onChange={e => setNewGroup(p => ({ ...p, semester: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                    <option value="">Select...</option>
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Assign Staff</label>
                <select value={newGroup.assignedStaff} onChange={e => setNewGroup(p => ({ ...p, assignedStaff: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <option value="">No staff</option>
                  {staffMembers.map(s => <option key={s._id} value={s._id}>{s.name || s.fullName}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t">
              <button onClick={() => setShowCreateGroupModal(false)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
              <button onClick={handleCreateGroup}
                className="px-5 py-2 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-700 transition-colors">
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───── Edit Group Modal ───── */}
      {showEditGroupModal && editingGroup && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-base font-bold text-gray-900">Edit Group</h3>
              <button onClick={() => setShowEditGroupModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-2 p-2.5 bg-blue-50 rounded-xl text-xs border border-blue-100">
                <Hash size={11} className="text-blue-500" />
                <span className="text-gray-500">Group ID:</span>
                <span className="font-mono text-blue-600 flex-1 truncate">{editingGroup._id}</span>
                <button onClick={() => copyId(editingGroup._id)} className="text-gray-400 hover:text-blue-500"><Copy size={11} /></button>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Group Name *</label>
                <input type="text" value={editingGroup.name || ''}
                  onChange={e => setEditingGroup(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'branch', label: 'Branch' },
                  { key: 'batch', label: 'Batch' },
                  { key: 'academicYear', label: 'Academic Year' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">{label}</label>
                    <input type="text" value={editingGroup[key] || ''}
                      onChange={e => setEditingGroup(p => ({ ...p, [key]: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Semester</label>
                  <select value={editingGroup.semester || ''}
                    onChange={e => setEditingGroup(p => ({ ...p, semester: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                    <option value="">Select...</option>
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Assign Staff</label>
                <select value={editingGroup.assignedStaff || ''}
                  onChange={e => setEditingGroup(p => ({ ...p, assignedStaff: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <option value="">No staff</option>
                  {staffMembers.map(s => <option key={s._id} value={s._id}>{s.name || s.fullName}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t">
              <button onClick={() => setShowEditGroupModal(false)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
              <button onClick={handleEditGroup}
                className="px-5 py-2 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-700 transition-colors">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default SuperAdminGroupManagement;