// pages/SuperAdmin/GroupManagement.jsx
// Super Admin view of all platform groups — can see auto-created course groups
// and create course groups by triggering POST /api/courses/:courseId/create-group

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Plus, Search, Trash2, RefreshCw, AlertCircle,
  CircleCheck, X, ChevronLeft, ChevronRight, Eye,
  BookOpen, Layers, Zap, UserCheck, Info, BadgeCheck,
  GraduationCap
} from 'lucide-react';
import SuperAdminDashboardLayout from '../../components/layout/SuperAdminDashboardLayout';
import { TableSkeleton } from '../../components/common/SkeletonLoader';
import ActionMenu from '../../components/common/ActionMenu';
import apiCall from '../../api/Api';

const PAGE_SIZE = 10;

// ── Toast ──────────────────────────────────────────────────────────────────────
const Toast = ({ toast }) => {
  if (!toast) return null;
  return (
    <div className={`fixed top-5 right-5 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-medium transition-all ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
      {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CircleCheck className="w-4 h-4" />}
      {toast.msg}
    </div>
  );
};

// ── Delete Modal ───────────────────────────────────────────────────────────────
const DeleteModal = ({ group, onConfirm, onCancel, loading }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
      <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
        <Trash2 className="w-6 h-6 text-red-600" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Group?</h3>
      <p className="text-sm text-gray-600 mb-6">
        Delete <strong>{group.name}</strong>? This soft-deletes the group and removes trainer access for assessments linked to it.
      </p>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 text-sm font-medium hover:bg-gray-50 transition-all">Cancel</button>
        <button onClick={onConfirm} disabled={loading} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-60 transition-all">
          {loading ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  </div>
);

// ── Create Course Group Modal ──────────────────────────────────────────────────
const CreateCourseGroupModal = ({ courses, onClose, onDone, showToast }) => {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingCourses, setFetchingCourses] = useState(false);
  const [eligibleCourses, setEligibleCourses] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchEligible = async () => {
      setFetchingCourses(true);
      try {
        const res = await apiCall('/super-admin/courses/eligible-for-group');
        if (res.success) {
          setEligibleCourses(res.data || []);
        }
      } catch {
        setEligibleCourses([]);
      } finally {
        setFetchingCourses(false);
      }
    };
    fetchEligible();
  }, []);

  const handleCreate = async () => {
    if (!selectedCourse) return;
    setLoading(true);
    try {
      const res = await apiCall(`/courses/${selectedCourse._id}/create-group`, { method: 'POST' });
      if (res.success) {
        showToast(`Group "${res.group?.name}" created with ${res.group?.student_count} students`);
        onDone();
        onClose();
      } else {
        showToast(res.message || 'Failed to create group', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Failed to create group', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filtered = eligibleCourses.filter(c =>
    c.title?.toLowerCase().includes(search.toLowerCase()) ||
    c.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#003399]/10 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-[#003399]" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Create Course Group</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Auto-generates a group from enrolled students</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="mx-6 mt-4 bg-blue-50 border border-blue-200 rounded-xl p-3 flex gap-2.5 flex-shrink-0">
          <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-[11px] text-blue-700 leading-relaxed">
            Only courses with <strong>closed registration</strong>, an <strong>assigned trainer</strong>, and <strong>not yet started</strong> are shown. Courses that already have a group are excluded.
          </div>
        </div>

        {/* Search */}
        <div className="px-6 pt-4 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search courses..."
              className="w-full pl-9 pr-4 py-2.5 text-xs font-bold border border-slate-100 rounded-xl focus:outline-none focus:border-[#003399]/30 bg-slate-50"
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wider">Select Course</p>
        </div>

        {/* Course List */}
        <div className="flex-1 overflow-y-auto px-6 pb-2 mt-2 space-y-2">
          {fetchingCourses ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="w-5 h-5 text-[#003399] animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-500 font-medium">No eligible courses</p>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed px-4">
                {search ? 'No courses match your search.' : 'All courses either have registration open, no trainer assigned, have already started, or already have a group.'}
              </p>
            </div>
          ) : (
            filtered.map(course => {
              const selected = selectedCourse?._id === course._id;
              return (
                <button
                  key={course._id}
                  onClick={() => setSelectedCourse(course)}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${selected
                    ? 'border-[#003399] bg-[#003399]/5'
                    : 'border-slate-100 hover:border-slate-200 bg-white'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className={`text-sm font-bold truncate ${selected ? 'text-[#003399]' : 'text-slate-800'}`}>
                        {course.title}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{course.category}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${course.status === 'Active'
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-violet-50 text-violet-700 border-violet-200'
                        }`}>
                        {course.status}
                      </span>
                      {selected && <BadgeCheck className="w-4 h-4 text-[#003399]" />}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3 flex-shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 text-sm font-medium hover:bg-gray-50 transition-all">
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!selectedCourse || loading}
            className="flex-1 py-2.5 bg-[#003399] text-white rounded-xl text-sm font-black hover:bg-[#002d8b] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Creating...</> : <><Zap className="w-4 h-4" /> Create Group</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── View Students Modal ────────────────────────────────────────────────────────
const ViewStudentsModal = ({ group, onClose }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await apiCall(`/group/${group._id}/students`);
        if (res.success) setStudents(res.data || res.students || []);
      } catch {
        setStudents(group.students || []);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [group._id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-[#003399]" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">{group.name}</h2>
              <p className="text-[11px] text-slate-400">{group.student_count} students</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
          {loading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="w-5 h-5 text-[#003399] animate-spin" />
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-8">
              <GraduationCap className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-400 font-medium">No students in this group</p>
            </div>
          ) : (
            students.map((s, i) => {
              const user = s.userId || s;
              const name = user.fullName || user.name || 'Student';
              const email = user.email || '';
              const dept = user.department || user.dept || '';
              return (
                <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-8 h-8 bg-[#003399]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-[11px] font-black text-[#003399]">{name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{email || dept}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="w-full py-2.5 border border-gray-200 rounded-xl text-gray-700 text-sm font-medium hover:bg-gray-50 transition-all">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Pagination ─────────────────────────────────────────────────────────────────
const Pagination = ({ page, totalPages, total, pageSize, onPageChange }) => {
  if (totalPages <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce((acc, p, i, arr) => {
      if (i > 0 && p - arr[i - 1] > 1) acc.push('…');
      acc.push(p);
      return acc;
    }, []);

  return (
    <div className="px-6 py-4 bg-white border-t border-slate-100 flex items-center justify-between">
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
        Showing {from}–{to} of {total} groups
      </span>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(page - 1)} disabled={page === 1}
          className="p-1.5 rounded-lg border border-slate-100 text-slate-400 hover:border-[#003399]/30 hover:text-[#003399] disabled:opacity-40 transition-all">
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        {pages.map((p, i) =>
          p === '…'
            ? <span key={`e${i}`} className="px-1.5 text-slate-300 text-xs">…</span>
            : <button key={p} onClick={() => onPageChange(p)}
              className={`w-7 h-7 rounded-lg text-xs font-black transition-all ${p === page ? 'bg-[#003399] text-white shadow-md' : 'border border-slate-100 text-slate-500 hover:border-[#003399]/30 hover:text-[#003399]'}`}>
              {p}
            </button>
        )}
        <button onClick={() => onPageChange(page + 1)} disabled={page === totalPages}
          className="p-1.5 rounded-lg border border-slate-100 text-slate-400 hover:border-[#003399]/30 hover:text-[#003399] disabled:opacity-40 transition-all">
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

// ── Group Row ──────────────────────────────────────────────────────────────────
const GroupRow = ({ group, index, page, onDelete, onViewStudents }) => {
  const sNo = (page - 1) * PAGE_SIZE + index + 1;
  const isAuto = group.creation_type === 'auto';

  const actions = [
    { label: 'View Students', icon: Eye, onClick: () => onViewStudents(group) },
    { label: 'Delete', icon: Trash2, onClick: () => onDelete(group), variant: 'danger' },
  ];

  const trainerName = group.trainer_id?.fullName || group.trainer_id?.name || null;
  const courseName = group.course_id?.title || null;

  return (
    <tr className="hover:bg-slate-50/30 transition-colors group">
      <td className="px-3 py-3 text-xs font-bold text-slate-400 w-12">
        {String(sNo).padStart(2, '0')}
      </td>

      <td className="px-3 py-3 min-w-[160px]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#003399]/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Layers className="w-4 h-4 text-[#003399]" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-800 truncate max-w-[180px]">{group.name}</p>
            {group.description && (
              <p className="text-[11px] text-slate-400 truncate max-w-[180px]">{group.description}</p>
            )}
          </div>
        </div>
      </td>

      <td className="px-3 py-3">
        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${isAuto
          ? 'bg-violet-50 text-violet-700 border-violet-200'
          : 'bg-slate-50 text-slate-600 border-slate-200'
          }`}>
          {isAuto ? <Zap className="w-2.5 h-2.5" /> : <Users className="w-2.5 h-2.5" />}
          {isAuto ? 'Auto' : 'Manual'}
        </span>
      </td>

      <td className="px-3 py-3 text-xs text-slate-600">
        {courseName ? (
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-3 h-3 text-slate-400" />
            <span className="truncate max-w-[130px]">{courseName}</span>
          </div>
        ) : (
          <span className="text-slate-300">—</span>
        )}
      </td>

      <td className="px-3 py-3 text-xs text-slate-600">
        {trainerName ? (
          <div className="flex items-center gap-1.5">
            <UserCheck className="w-3 h-3 text-slate-400" />
            <span className="truncate max-w-[120px]">{trainerName}</span>
          </div>
        ) : (
          <span className="text-slate-300">—</span>
        )}
      </td>

      <td className="px-3 py-3 text-sm font-bold text-slate-700 text-center w-20">
        {group.student_count ?? 0}
      </td>

      <td className="px-3 py-3 text-center w-16">
        <ActionMenu actions={actions} />
      </td>
    </tr>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const SuperAdminGroupManagement = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewStudentsGroup, setViewStudentsGroup] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiCall('/group');
      if (res.success) setGroups(res.groups || []);
      else setError(res.message || 'Failed to load groups');
    } catch (err) {
      setError(err.message || 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      const res = await apiCall(`/group/${deleteConfirm._id}`, { method: 'DELETE' });
      if (res.success) {
        showToast('Group deleted');
        setGroups(p => p.filter(g => g._id !== deleteConfirm._id));
        setDeleteConfirm(null);
      } else showToast(res.message || 'Delete failed', 'error');
    } catch (err) {
      showToast(err.message || 'Delete failed', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Show only auto-created course groups on this page
  const courseGroups = groups.filter(g => g.creation_type === 'auto');

  // Client-side filtering on course groups only
  const filtered = courseGroups.filter(g => {
    const matchSearch = !search ||
      g.name?.toLowerCase().includes(search.toLowerCase()) ||
      g.course_id?.title?.toLowerCase().includes(search.toLowerCase()) ||
      g.trainer_id?.fullName?.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = {
    total: courseGroups.length,
    totalStudents: courseGroups.reduce((sum, g) => sum + (g.student_count || 0), 0),
  };

  if (loading && groups.length === 0)
    return <TableSkeleton layout={SuperAdminDashboardLayout} />;

  return (
    <SuperAdminDashboardLayout>
      <div className="px-6 py-4 md:px-8 md:py-6 space-y-5 font-sans">

        <Toast toast={toast} />

        {deleteConfirm && (
          <DeleteModal
            group={deleteConfirm}
            onConfirm={handleDelete}
            onCancel={() => setDeleteConfirm(null)}
            loading={deleting}
          />
        )}

        {showCreateModal && (
          <CreateCourseGroupModal
            onClose={() => setShowCreateModal(false)}
            onDone={fetchGroups}
            showToast={showToast}
          />
        )}

        {viewStudentsGroup && (
          <ViewStudentsModal
            group={viewStudentsGroup}
            onClose={() => setViewStudentsGroup(null)}
          />
        )}

        {/* Header */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span className="w-2 h-8 bg-gradient-to-b from-[#003399] to-[#00A9CE] rounded-full" />
                Group Management
              </h1>
              <p className="text-sm text-slate-400 mt-1 font-medium">
                Auto-generated course groups — {stats.total} total · {stats.totalStudents} students enrolled
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-[#003399] text-white text-[11px] font-black uppercase tracking-wider px-6 py-3 rounded-xl hover:bg-[#002d8b] transition-all shadow-lg shadow-blue-500/10 active:scale-95"
            >
              <Zap className="w-4 h-4" /> Create Course Group
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Course Groups', value: stats.total, icon: Layers, color: 'text-[#003399] bg-[#003399]/10' },
              { label: 'Total Students', value: stats.totalStudents, icon: GraduationCap, color: 'text-green-600 bg-green-50' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xl font-black text-slate-800">{s.value}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[280px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
              <input
                type="text"
                placeholder="Search group name, course, trainer..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-4 py-2.5 text-xs font-bold border border-slate-100 rounded-xl focus:outline-none focus:border-[#003399]/30 bg-white"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
            <button onClick={fetchGroups} className="ml-auto text-xs font-bold text-red-600 hover:underline flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
              {filtered.length} Groups
            </span>
            <button onClick={fetchGroups} className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-400 hover:text-[#003399] transition-colors">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="w-6 h-6 text-[#003399] animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Layers className="w-7 h-7 text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium text-sm">No groups found</p>
              <p className="text-slate-400 text-xs mt-1">
                {search || typeFilter ? 'Try adjusting your filters' : 'Create a course group to get started'}
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#003399] text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-[#002d8b] transition-all"
              >
                <Zap className="w-3.5 h-3.5" /> Create Course Group
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-3 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-12">S.No</th>
                    <th className="px-3 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Group</th>
                    <th className="px-3 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-24">Type</th>
                    <th className="px-3 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Course</th>
                    <th className="px-3 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Trainer</th>
                    <th className="px-3 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-20">Students</th>
                    <th className="px-3 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-16">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginated.map((group, index) => (
                    <GroupRow
                      key={group._id}
                      group={group}
                      index={index}
                      page={page}
                      onDelete={setDeleteConfirm}
                      onViewStudents={setViewStudentsGroup}
                    />
                  ))}
                </tbody>
              </table>
              <Pagination
                page={page}
                totalPages={totalPages}
                total={filtered.length}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>

      </div>
    </SuperAdminDashboardLayout>
  );
};

export default SuperAdminGroupManagement;