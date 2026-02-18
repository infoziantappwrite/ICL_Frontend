// src/pages/CollegeAdmin/GroupManagement.jsx
import { useToast } from '../../context/ToastContext';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import ExcelLikeGrid from '../../components/StudentGrid/ExcelLikeGrid';
import axios from 'axios';
import {
  Users, Plus, Search, Edit2, Trash2, X, AlertCircle,
  CheckCircle, UserCheck, Copy, Hash, Info, Calendar,
  Crown, Star, Zap, ArrowRight, Mail,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('token');
const getUser = () => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } };

const PLAN_LIMITS = {
  free:       { totalStudents: 100,     perGroup: 100,     label: 'Free',       color: 'gray' },
  basic:      { totalStudents: 500,     perGroup: 150,     label: 'Basic',      color: 'blue' },
  pro:        { totalStudents: 999999,  perGroup: 999999,  label: 'Pro',        color: 'purple' },
  enterprise: { totalStudents: 999999,  perGroup: 999999,  label: 'Enterprise', color: 'amber' },
};

const planBadge = {
  free:       'bg-gray-100 text-gray-600',
  basic:      'bg-blue-100 text-blue-700',
  pro:        'bg-purple-100 text-purple-700',
  enterprise: 'bg-amber-100 text-amber-700',
};

const GroupManagement = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [students, setStudents] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [subscription, setSubscription] = useState({ plan: 'free' });
  const [loading, setLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [newGroup, setNewGroup] = useState({
    name: '', description: '', assignedStaff: '',
    batch: '', branch: '', semester: '',
    academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
  });

  const user = getUser();
  const collegeId = user?.collegeId;
  const planKey = subscription?.plan || 'free';
  const limits = PLAN_LIMITS[planKey] || PLAN_LIMITS.free;
  const isPro = planKey === 'pro' || planKey === 'enterprise';

  useEffect(() => { fetchGroups(); fetchSubscription(); fetchStaff(); }, []);
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

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/groups`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setGroups(res.data?.data || []);
    } catch (err) {
      // API not connected — use local state only
      setGroups([]);
    } finally { setLoading(false); }
  };

  const fetchSubscription = async () => {
    if (!collegeId) return;
    try {
      const res = await axios.get(`${API_URL}/subscriptions/college/${collegeId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setSubscription(res.data?.data || { plan: 'free' });
    } catch {
      // API not connected — default to free plan
      setSubscription({ plan: 'free' });
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await axios.get(`${API_URL}/college-admin/admins`, {
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

  const handleCreateGroup = async () => {
    if (!newGroup.name.trim()) { showMsg('Group name is required', 'error'); return; }

    const totalStudents = groups.reduce((s, g) => s + (g.studentCount || 0), 0);
    if (!isPro && groups.length >= 20) {
      showMsg('Group limit reached. Upgrade to Pro for unlimited groups.', 'error');
      return;
    }

    try {
      setLoading(true);
      const payload = { ...newGroup, collegeId };
      const res = await axios.post(`${API_URL}/groups`, payload, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const created = res.data?.data || { _id: `grp_${Date.now()}`, ...payload, studentCount: 0, createdAt: new Date().toISOString() };
      setGroups(prev => [...prev, created]);
      showMsg('Group created successfully!');
      setShowCreateModal(false);
      resetNewGroup();
    } catch (err) {
      // Optimistic local create when backend not connected
      const mock = { _id: `grp_${Date.now()}`, ...newGroup, collegeId, studentCount: 0, createdAt: new Date().toISOString() };
      setGroups(prev => [...prev, mock]);
      showMsg('Group created!');
      setShowCreateModal(false);
      resetNewGroup();
    } finally { setLoading(false); }
  };

  const handleEditGroup = async () => {
    if (!editingGroup?.name?.trim()) { showMsg('Group name required', 'error'); return; }
    try {
      const res = await axios.put(`${API_URL}/groups/${editingGroup._id}`, editingGroup, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const updated = res.data?.data || editingGroup;
      setGroups(prev => prev.map(g => g._id === editingGroup._id ? updated : g));
      if (selectedGroup?._id === editingGroup._id) setSelectedGroup(updated);
    } catch {
      setGroups(prev => prev.map(g => g._id === editingGroup._id ? editingGroup : g));
      if (selectedGroup?._id === editingGroup._id) setSelectedGroup(editingGroup);
    }
    showMsg('Group updated!');
    setShowEditModal(false);
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm('Delete this group and all its students? This cannot be undone.')) return;
    try {
      await axios.delete(`${API_URL}/groups/${groupId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
    } catch {}
    setGroups(prev => prev.filter(g => g._id !== groupId));
    if (selectedGroup?._id === groupId) { setSelectedGroup(null); setStudents([]); }
    showMsg('Group deleted.');
  };

  const handleBulkSave = async (dirtyRows) => {
    if (!selectedGroup) return;
    const groupId = selectedGroup._id;

    // Check student limit
    const existingCount = students.filter(s => !dirtyRows.find(r => r._id === s._id && r.isNew)).length;
    const newCount = dirtyRows.filter(r => r.isNew).length;
    const totalAfter = existingCount + newCount;

    if (!isPro && totalAfter > limits.perGroup) {
      throw new Error(`Student limit (${limits.perGroup}) exceeded. Upgrade to Pro for unlimited students.`);
    }

    const toCreate = dirtyRows.filter(r => r.isNew);
    const toUpdate = dirtyRows.filter(r => !r.isNew);

    if (toCreate.length) {
      try {
        const res = await axios.post(`${API_URL}/groups/${groupId}/students/bulk`, {
          students: toCreate.map(r => ({
            name: r.name, rollNumber: r.rollNumber,
            email: r.email, role: r.role, password: r.password,
          })),
        }, { headers: { Authorization: `Bearer ${getToken()}` } });
        if (res.data?.data) {
          setStudents(prev => [...prev.filter(s => !toCreate.find(r => r._id === s._id)), ...res.data.data]);
        } else {
          setStudents(prev => [...prev, ...toCreate.map(r => ({ ...r, isNew: false }))]);
        }
      } catch {
        setStudents(prev => [...prev, ...toCreate.map(r => ({ ...r, isNew: false }))]);
      }
    }

    for (const row of toUpdate) {
      try {
        await axios.put(`${API_URL}/groups/${groupId}/students/${row._id}`, {
          name: row.name, rollNumber: row.rollNumber,
          email: row.email, role: row.role, password: row.password,
        }, { headers: { Authorization: `Bearer ${getToken()}` } });
      } catch {}
    }

    // Update group student count
    const newTotal = students.length + toCreate.length;
    setGroups(prev => prev.map(g => g._id === groupId ? { ...g, studentCount: newTotal } : g));
    await fetchGroupStudents(groupId);
  };

  const handleDeleteStudent = async (studentId) => {
    if (!selectedGroup) return;
    try {
      await axios.delete(`${API_URL}/groups/${selectedGroup._id}/students/${studentId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
    } catch {}
    setStudents(prev => prev.filter(s => s._id !== studentId));
    setGroups(prev => prev.map(g => g._id === selectedGroup._id
      ? { ...g, studentCount: Math.max(0, (g.studentCount || 1) - 1) } : g
    ));
  };

  const resetNewGroup = () => setNewGroup({
    name: '', description: '', assignedStaff: '',
    batch: '', branch: '', semester: '',
    academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
  });

  const copyId = (id) => {
    navigator.clipboard?.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(''), 2000);
  };

  const getStaffName = (staffId) => {
    const s = staffMembers.find(m => m._id === staffId);
    return s?.name || s?.fullName || 'Unassigned';
  };

  const filteredGroups = groups.filter(g =>
    g.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.branch?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.batch?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalStudents = groups.reduce((sum, g) => sum + (g.studentCount || 0), 0);

  return (
    <DashboardLayout title="Group Management">
      <div className="flex flex-col gap-4" style={{ height: 'calc(100vh - 110px)' }}>

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Group Management</h1>
            <p className="text-sm text-gray-500 mt-0.5">Create groups, assign staff, and manage students</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${planBadge[planKey]}`}>
              {limits.label} Plan
            </span>
            <button
              onClick={() => { setShowCreateModal(true); resetNewGroup(); }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm"
            >
              <Plus size={16} /> New Group
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <AlertCircle size={15} className="flex-shrink-0" /> {error}
            <button className="ml-auto flex-shrink-0" onClick={() => setError('')}><X size={14} /></button>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
            <CheckCircle size={15} className="flex-shrink-0" /> {success}
            <button className="ml-auto flex-shrink-0" onClick={() => setSuccess('')}><X size={14} /></button>
          </div>
        )}

        {/* Plan info bar */}
        {!isPro && (
          <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm">
            <Info size={15} className="text-amber-600 flex-shrink-0" />
            <span className="text-amber-800">
              <strong>Free Plan:</strong> Max {limits.totalStudents} students total, {limits.perGroup} per group.{' '}
              <span className="text-gray-600">{totalStudents}/{limits.totalStudents} used.</span>
            </span>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="ml-auto text-amber-700 font-semibold text-xs hover:underline flex items-center gap-1 flex-shrink-0"
            >
              <Crown size={12} /> Upgrade to Pro →
            </button>
          </div>
        )}

        {/* Main 2-panel layout */}
        <div className="flex flex-1 gap-4 min-h-0 overflow-hidden">

          {/* LEFT: Group list */}
          <div className="w-80 flex-shrink-0 flex flex-col border border-gray-200 rounded-2xl bg-white/90 backdrop-blur-sm overflow-hidden shadow-sm">
            <div className="p-3 border-b border-gray-100 bg-gray-50/80">
              <div className="relative mb-2">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text" placeholder="Search groups..."
                  value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div className="text-xs text-gray-500">{filteredGroups.length} groups · {totalStudents} students total</div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredGroups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-3 px-4 text-center">
                  <Users size={36} className="text-gray-200" />
                  <p className="text-sm font-medium">No groups yet</p>
                  <p className="text-xs text-gray-400">Create a group to start adding students with the Excel-like editor</p>
                  <button
                    onClick={() => { setShowCreateModal(true); resetNewGroup(); }}
                    className="text-blue-500 font-medium text-xs hover:underline flex items-center gap-1"
                  >
                    <Plus size={12} /> Create your first group
                  </button>
                </div>
              ) : (
                filteredGroups.map(group => {
                  const isSelected = selectedGroup?._id === group._id;
                  const pct = isPro ? 0 : Math.min(100, ((group.studentCount || 0) / limits.perGroup) * 100);
                  return (
                    <div
                      key={group._id}
                      onClick={() => setSelectedGroup(group)}
                      className={`p-3 border-b border-gray-100 cursor-pointer transition-all hover:bg-blue-50 ${
                        isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 text-sm truncate">{group.name}</div>
                          {/* Group ID badge */}
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="font-mono text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded truncate max-w-36">
                              {group._id}
                            </span>
                            <button
                              onClick={e => { e.stopPropagation(); copyId(group._id); }}
                              className="text-gray-400 hover:text-blue-500 flex-shrink-0"
                            >
                              {copiedId === group._id
                                ? <CheckCircle size={10} className="text-green-500" />
                                : <Copy size={10} />}
                            </button>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 flex-wrap">
                            {group.branch && <span className="bg-gray-100 px-1.5 py-0.5 rounded">{group.branch}</span>}
                            {group.batch && <span>Batch {group.batch}</span>}
                            {group.semester && <span>Sem {group.semester}</span>}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-base font-bold text-gray-800">{group.studentCount || 0}</div>
                          <div className="text-xs text-gray-400">
                            {isPro ? 'students' : `/${limits.perGroup}`}
                          </div>
                        </div>
                      </div>

                      {!isPro && (
                        <div className="mt-2 w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              pct > 90 ? 'bg-red-400' : pct > 70 ? 'bg-amber-400' : 'bg-green-400'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      )}

                      <div className="flex items-center gap-1 mt-1.5">
                        <UserCheck size={10} className="text-gray-400" />
                        <span className="text-xs text-gray-500 truncate">{getStaffName(group.assignedStaff)}</span>
                      </div>

                      {/* Row actions */}
                      <div className="flex gap-1 mt-2" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => { setEditingGroup({ ...group }); setShowEditModal(true); }}
                          className="flex-1 flex items-center justify-center gap-1 py-1 text-xs text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <Edit2 size={10} /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteGroup(group._id)}
                          className="flex-1 flex items-center justify-center gap-1 py-1 text-xs text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          <Trash2 size={10} /> Delete
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT: Excel Grid */}
          <div className="flex-1 min-w-0 flex flex-col border border-gray-200 rounded-2xl bg-white/90 backdrop-blur-sm overflow-hidden shadow-sm">
            {!selectedGroup ? (
              <div className="flex flex-col items-center justify-center flex-1 text-gray-400 gap-4 p-8 text-center">
                <Users size={52} className="text-gray-200" />
                <div>
                  <p className="text-lg font-semibold text-gray-500">Select a group</p>
                  <p className="text-sm mt-1">Click any group on the left to manage its students using the Excel-like editor</p>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-2 text-xs text-gray-400 max-w-md">
                  {[
                    '📋 Paste from Excel/Sheets',
                    '📤 Upload CSV file',
                    '✏️ Type directly in cells',
                    '⬇️ Download as Excel',
                    '🔍 Search & filter',
                    '✅ Full CRUD operations',
                  ].map(f => (
                    <div key={f} className="bg-gray-50 rounded-lg p-2 text-center">{f}</div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* Group header */}
                <div className="p-4 border-b border-gray-100 bg-gray-50/80">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-base font-bold text-gray-900">{selectedGroup.name}</h2>
                        {selectedGroup.branch && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                            {selectedGroup.branch}
                          </span>
                        )}
                        {selectedGroup.semester && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                            Sem {selectedGroup.semester}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Hash size={11} />
                          <span className="font-mono text-blue-600 font-medium">{selectedGroup._id}</span>
                          <button onClick={() => copyId(selectedGroup._id)} className="text-gray-400 hover:text-blue-500">
                            {copiedId === selectedGroup._id
                              ? <CheckCircle size={11} className="text-green-500" />
                              : <Copy size={11} />}
                          </button>
                        </span>
                        {selectedGroup.batch && (
                          <span className="flex items-center gap-1"><Calendar size={11} /> Batch {selectedGroup.batch}</span>
                        )}
                        {selectedGroup.assignedStaff && (
                          <span className="flex items-center gap-1">
                            <UserCheck size={11} /> {getStaffName(selectedGroup.assignedStaff)}
                          </span>
                        )}
                        {selectedGroup.academicYear && (
                          <span>{selectedGroup.academicYear}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-bold text-gray-900 text-lg">{students.length}</div>
                        <div className="text-xs text-gray-500">
                          {isPro ? 'students (unlimited)' : `/ ${limits.perGroup} max`}
                        </div>
                      </div>
                      {!isPro && (
                        <button
                          onClick={() => setShowUpgradeModal(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-semibold rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-sm"
                        >
                          <Crown size={12} /> Upgrade
                        </button>
                      )}
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

      {/* ===== UPGRADE MODAL ===== */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Crown size={22} />
                  <h3 className="text-xl font-bold">Upgrade to Pro</h3>
                </div>
                <button onClick={() => setShowUpgradeModal(false)} className="text-white/70 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <p className="text-purple-100 text-sm">Unlock unlimited students, groups, and advanced features</p>
            </div>

            {/* Benefits */}
            <div className="p-5">
              <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                  { icon: Zap, text: 'Unlimited students per group' },
                  { icon: Users, text: 'Unlimited total students' },
                  { icon: Star, text: 'Unlimited groups' },
                  { icon: CheckCircle, text: 'Bulk upload 1000+ students' },
                  { icon: Hash, text: 'Advanced analytics' },
                  { icon: UserCheck, text: 'Priority support' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2 text-sm text-gray-700">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Icon size={12} className="text-purple-600" />
                    </div>
                    {text}
                  </div>
                ))}
              </div>

              {/* Current usage */}
              <div className="p-3 bg-gray-50 rounded-xl mb-5 text-sm">
                <div className="font-semibold text-gray-700 mb-2">Your current usage</div>
                <div className="flex justify-between text-gray-600 mb-1">
                  <span>Total Students</span>
                  <span className="font-medium">{totalStudents} / {limits.totalStudents}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Groups</span>
                  <span className="font-medium">{groups.length}</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 mb-5 flex items-start gap-2">
                <Info size={14} className="flex-shrink-0 mt-0.5" />
                To upgrade your plan, please contact your Super Admin or reach out to ICL support.
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Maybe later
                </button>
                <a
                  href="mailto:support@icl.edu?subject=Pro Plan Upgrade Request"
                  className="flex-1 py-2.5 text-sm text-center font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2"
                >
                  <Mail size={14} /> Contact Admin
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== CREATE GROUP MODAL ===== */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-bold text-gray-900">Create New Group</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Group Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text" placeholder="e.g. CSE - Section A - 2024"
                  value={newGroup.name} onChange={e => setNewGroup(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Branch / Department</label>
                  <input
                    type="text" placeholder="e.g. CSE, ECE, MBA"
                    value={newGroup.branch} onChange={e => setNewGroup(p => ({ ...p, branch: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Batch Year</label>
                  <input
                    type="text" placeholder="e.g. 2021-2025"
                    value={newGroup.batch} onChange={e => setNewGroup(p => ({ ...p, batch: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Semester</label>
                  <select
                    value={newGroup.semester} onChange={e => setNewGroup(p => ({ ...p, semester: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select semester...</option>
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Academic Year</label>
                  <input
                    type="text" placeholder="2024-2025"
                    value={newGroup.academicYear} onChange={e => setNewGroup(p => ({ ...p, academicYear: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Assign Staff Handler</label>
                <select
                  value={newGroup.assignedStaff} onChange={e => setNewGroup(p => ({ ...p, assignedStaff: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No staff assigned</option>
                  {staffMembers.map(s => (
                    <option key={s._id} value={s._id}>{s.name || s.fullName} ({s.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description (optional)</label>
                <textarea
                  placeholder="Optional description for this group..."
                  value={newGroup.description} onChange={e => setNewGroup(p => ({ ...p, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              {!isPro && (
                <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                  <Info size={13} className="flex-shrink-0" />
                  Free plan: max {limits.perGroup} students per group, {limits.totalStudents} total.
                  <button onClick={() => { setShowCreateModal(false); setShowUpgradeModal(true); }}
                    className="ml-1 underline font-semibold">Upgrade →</button>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
              <button
                onClick={handleCreateGroup}
                disabled={loading}
                className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Creating...' : 'Create Group'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== EDIT GROUP MODAL ===== */}
      {showEditModal && editingGroup && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-bold text-gray-900">Edit Group</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              {/* Group ID display */}
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                <Hash size={14} className="text-blue-500" />
                <span className="text-xs text-gray-500">Group ID:</span>
                <span className="font-mono text-sm text-blue-600 font-medium flex-1 truncate">{editingGroup._id}</span>
                <button onClick={() => copyId(editingGroup._id)} className="text-gray-400 hover:text-blue-500 flex-shrink-0">
                  {copiedId === editingGroup._id ? <CheckCircle size={13} className="text-green-500" /> : <Copy size={13} />}
                </button>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Group Name *</label>
                <input type="text" value={editingGroup.name || ''}
                  onChange={e => setEditingGroup(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'branch', label: 'Branch', placeholder: 'CSE' },
                  { key: 'batch', label: 'Batch', placeholder: '2021-2025' },
                  { key: 'academicYear', label: 'Academic Year', placeholder: '2024-2025' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">{label}</label>
                    <input type="text" placeholder={placeholder} value={editingGroup[key] || ''}
                      onChange={e => setEditingGroup(p => ({ ...p, [key]: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Semester</label>
                  <select value={editingGroup.semester || ''}
                    onChange={e => setEditingGroup(p => ({ ...p, semester: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select...</option>
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Assign Staff</label>
                <select value={editingGroup.assignedStaff || ''}
                  onChange={e => setEditingGroup(p => ({ ...p, assignedStaff: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">No staff assigned</option>
                  {staffMembers.map(s => (
                    <option key={s._id} value={s._id}>{s.name || s.fullName} ({s.email})</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t">
              <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
              <button onClick={handleEditGroup}
                className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default GroupManagement;