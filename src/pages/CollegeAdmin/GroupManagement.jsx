// src/pages/CollegeAdmin/GroupManagement.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import CollegeAdminLayout from '../../components/layout/CollegeAdminLayout';
import { useToast } from '../../context/ToastContext';
import { groupAPI } from '../../api/groupAPI';
import { collegeAdminStudentAPI } from '../../api/studentAPI';
import ActionMenu from '../../components/common/ActionMenu';
import {
  Users, Layers, Search, Plus, Trash2, Edit2, 
  UserPlus, UserMinus, ChevronLeft, ChevronRight, 
  CheckCircle2, AlertCircle, Info, MoreVertical,
  X, RefreshCw, Filter, ArrowRight, GraduationCap
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════
   ATOMS & COMPONENTS
 ══════════════════════════════════════════════════════════ */

const Spin = ({ size = 'md', color = 'blue' }) => {
  const sz = { sm: 'w-3.5 h-3.5', md: 'w-5 h-5', lg: 'w-8 h-8' }[size];
  const cl = { 
    white: 'border-white', 
    blue: 'border-[#003399]', 
    slate: 'border-slate-400',
    emerald: 'border-emerald-500'
  }[color];
  return <div className={`${sz} ${cl} border-2 border-t-transparent rounded-full animate-spin flex-shrink-0`} />;
};

const Tag = ({ children, variant = 'default' }) => {
  const v = {
    default: 'bg-slate-100 text-slate-600',
    blue:    'bg-[#003399]/10 text-[#003399] border border-[#003399]/20',
    emerald: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    rose:    'bg-rose-50 text-rose-600 border border-rose-200',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${v[variant]}`}>
      {children}
    </span>
  );
};

const Modal = ({ children, onClose, size = 'lg' }) => {
  const w = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' }[size];
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${w} bg-white rounded-[32px] shadow-2xl border border-slate-100/20 flex flex-col max-h-[92vh] overflow-hidden`}>
        {children}
      </div>
    </div>
  );
};

const MHead = ({ icon: Icon, title, sub, onClose }) => (
  <div className="px-6 py-5 border-b border-slate-100 flex-shrink-0 bg-white">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0 shadow-sm bg-[#003399]/10 border-[#003399]/20 text-[#003399]">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-slate-900 font-black text-lg tracking-tight leading-tight">{title}</h2>
          {sub && <p className="text-slate-400 text-xs font-medium mt-0.5">{sub}</p>}
        </div>
      </div>
      {onClose && (
        <button onClick={onClose} className="w-8 h-8 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all border border-slate-200/50">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════════
   GROUP FORM MODAL (Create/Edit)
 ══════════════════════════════════════════════════════════ */
function GroupFormModal({ group, onClose, onDone }) {
  const toast = useToast();
  const [form, setForm] = useState({
    name: group?.name || '',
    description: group?.description || '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setErrors({ name: 'Group name is required' });
      return;
    }

    setLoading(true);
    try {
      if (group) {
        await groupAPI.updateGroup(group._id, form);
        toast.success('Group Updated', 'Changes saved successfully.');
      } else {
        await groupAPI.createGroup(form);
        toast.success('Group Created', 'New group added to the system.');
      }
      onDone();
      onClose();
    } catch (err) {
      toast.error('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal onClose={onClose} size="sm">
      <MHead 
        icon={group ? Edit2 : Plus} 
        title={group ? 'Edit Group' : 'Create New Group'} 
        sub="Groups help you organize students for assessments" 
        onClose={onClose} 
      />
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">Group Name *</label>
          <input
            autoFocus
            className={`w-full px-4 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all ${
              errors.name ? 'border-rose-300 ring-rose-100 bg-rose-50' : 'border-slate-200 focus:ring-[#003399]/10 focus:border-[#003399]'
            }`}
            placeholder="e.g. Final Year CSE-A"
            value={form.name}
            onChange={e => { setForm({ ...form, name: e.target.value }); setErrors({}); }}
          />
          {errors.name && <p className="text-[10px] text-rose-500 font-bold mt-1.5 flex items-center gap-1"><AlertCircle size={10}/>{errors.name}</p>}
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">Description (Optional)</label>
          <textarea
            className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003399]/10 focus:border-[#003399] transition-all min-h-[100px] resize-none"
            placeholder="Briefly describe the purpose of this group..."
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-[2] py-3 bg-[#003399] hover:bg-[#002266] text-white text-sm font-bold rounded-xl shadow-lg shadow-[#003399]/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Spin size="sm" color="white" /> : group ? <Edit2 size={14} /> : <CheckCircle2 size={14} />}
            {group ? 'Save Changes' : 'Create Group'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════════════
   MANAGE STUDENTS MODAL
 ══════════════════════════════════════════════════════════ */
function ManageStudentsModal({ group, onClose, onDone }) {
  const toast = useToast();
  const [allStudents, setAllStudents] = useState([]);
  const [groupStudents, setGroupStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState(null); // studentId being added/removed

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [allRes, groupRes] = await Promise.all([
        collegeAdminStudentAPI.getStudents({ limit: 1000 }), // Simplified for now
        groupAPI.getGroupStudents(group._id)
      ]);
      
      setAllStudents(allRes.students || []);
      setGroupStudents(groupRes.students || []);
    } catch (err) {
      toast.error('Error loading data', err.message);
    } finally {
      setLoading(false);
    }
  }, [group._id, toast]);

  useEffect(() => { loadData(); }, [loadData]);

  const toggleStudent = async (student) => {
    const isMember = groupStudents.some(s => s._id === student._id);
    setUpdating(student._id);
    try {
      if (isMember) {
        await groupAPI.removeStudents(group._id, [student._id]);
        setGroupStudents(prev => prev.filter(s => s._id !== student._id));
        toast.success('Removed', `${student.fullName} removed from group.`);
      } else {
        await groupAPI.addStudents(group._id, [{ userId: student._id }]);
        setGroupStudents(prev => [...prev, student]);
        toast.success('Added', `${student.fullName} added to group.`);
      }
      onDone(); // Refresh group list stats
    } catch (err) {
      toast.error('Action Failed', err.message);
    } finally {
      setUpdating(null);
    }
  };

  const filtered = allStudents.filter(s => {
    const q = search.toLowerCase();
    return s.fullName?.toLowerCase().includes(q) || 
           s.email?.toLowerCase().includes(q) || 
           s.studentInfo?.rollNumber?.toLowerCase().includes(q);
  });

  return (
    <Modal onClose={onClose} size="lg">
      <MHead 
        icon={Users} 
        title={`Manage Students — ${group.name}`} 
        sub={`Total: ${groupStudents.length} student(s) assigned`} 
        onClose={onClose} 
      />
      
      <div className="p-5 border-b border-slate-100 bg-slate-50/50">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="w-full pl-10 pr-4 py-2.5 text-xs font-bold border border-slate-200 rounded-xl focus:outline-none focus:border-[#003399]/30 bg-white transition-all"
            placeholder="Search by name, email or roll number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-[400px] max-h-[600px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <Spin size="lg" />
            <p className="text-sm font-medium">Fetching students list...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
              <Search className="w-8 h-8 opacity-20" />
            </div>
            <p className="text-sm font-medium">No students found matching "{search}"</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filtered.map(s => {
              const isMember = groupStudents.some(gs => gs._id === s._id);
              return (
                <div key={s._id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/80 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${
                      isMember ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {(s.fullName || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 leading-none">{s.fullName}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[11px] text-slate-400 font-medium">{s.email}</span>
                        {s.studentInfo?.rollNumber && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-slate-200" />
                            <span className="text-[11px] font-mono text-[#003399] font-bold uppercase">{s.studentInfo.rollNumber}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => toggleStudent(s)}
                    disabled={updating === s._id}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                      isMember 
                        ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100'
                    } disabled:opacity-50`}
                  >
                    {updating === s._id ? <Spin size="sm" color={isMember ? 'rose' : 'emerald'} /> : (isMember ? <UserMinus size={13} /> : <UserPlus size={13} />)}
                    {isMember ? 'Remove' : 'Add to Group'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
        <button
          onClick={onClose}
          className="px-6 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
        >
          Close & Finish
        </button>
      </div>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
 ══════════════════════════════════════════════════════════ */
export default function GroupManagement() {
  const toast = useToast();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // { type: 'form'|'students'|'delete', data: group }

  const loadGroups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await groupAPI.getGroups();
      setGroups(res.groups || res.data || []);
    } catch (err) {
      toast.error('Failed to load groups', err.message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadGroups(); }, [loadGroups]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this group? Students will not be deleted.')) return;
    try {
      await groupAPI.deleteGroup(id);
      toast.success('Group Deleted', 'The group has been removed.');
      loadGroups();
    } catch (err) {
      toast.error('Delete Failed', err.message);
    }
  };

  const filtered = groups.filter(g => 
    g.name?.toLowerCase().includes(search.toLowerCase()) || 
    g.description?.toLowerCase().includes(search.toLowerCase())
  );

  const totalStudentsInGroups = groups.reduce((acc, curr) => acc + (curr.student_count || curr.students?.length || 0), 0);

  return (
    <CollegeAdminLayout>
      <div className="px-6 py-4 md:px-8 md:py-6 space-y-5 font-sans">
        <div className="max-w-[1240px] mx-auto space-y-6">
          
          {/* ── HEADER ── */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2 h-8 bg-gradient-to-b from-[#003399] to-[#00A9CE] rounded-full inline-block flex-shrink-0" />
                Group <span className="text-[#003399]">Management</span>
              </h1>
              <p className="text-sm text-slate-400 mt-1 font-medium">Create and organize student clusters for specific assessments — {groups.length} total.</p>
            </div>
            <button
              onClick={() => setModal({ type: 'form', data: null })}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#003399] hover:bg-[#002d8b] text-white text-[11px] font-black uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-blue-500/10 active:scale-95"
            >
              <Plus size={16} />
              Create New Group
            </button>
          </div>

          {/* ── STATS ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: 'Total Groups', value: groups.length, icon: Layers, color: 'text-[#003399]', bg: 'bg-[#003399]/5' },
              { label: 'Assigned Students', value: totalStudentsInGroups, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Average Size', value: groups.length ? Math.round(totalStudentsInGroups / groups.length) : 0, icon: GraduationCap, color: 'text-indigo-600', bg: 'bg-indigo-50' }
            ].map((stat, i) => (
              <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center ${stat.color}`}>
                  <stat.icon size={20} />
                </div>
                <div>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">{stat.label}</p>
                  <p className={`text-2xl font-black ${stat.color} leading-none mt-1`}>{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── FILTERS & TABLE ── */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  className="w-full pl-10 pr-8 py-2.5 text-xs font-bold border border-slate-100 rounded-xl focus:outline-none focus:border-[#003399]/30 bg-white"
                  placeholder="Search groups by name..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-gray-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={loadGroups} 
                  disabled={loading}
                  className="p-2.5 text-slate-400 hover:text-[#003399] hover:bg-slate-50 rounded-xl transition-all border border-slate-100"
                >
                  <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
                <Tag variant="blue">{filtered.length} Groups Found</Tag>
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
                  <Spin size="lg" />
                  <p className="text-sm font-medium">Syncing your groups...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-400">
                  <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center">
                    <Layers className="w-10 h-10 opacity-10" />
                  </div>
                  <div className="text-center">
                    <p className="text-base font-bold text-slate-600">No groups found</p>
                    <p className="text-sm font-medium mt-1">Start by creating a new group or clearing filters.</p>
                  </div>
                </div>
              ) : (
                <table className="w-full table-fixed">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-[60px]">S.No</th>
                      <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-[250px]">Group Name</th>
                      <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-[300px]">Description</th>
                      <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-[150px]">Students</th>
                      <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-[120px]">Status</th>
                      <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-[100px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((g, index) => (
                      <tr key={g._id} className="hover:bg-slate-50/30 transition-colors group">
                        <td className="px-5 py-4 text-xs font-bold text-slate-400">
                          {String(index + 1).padStart(2, '0')}
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm font-bold text-slate-800 truncate w-full group-hover:text-[#003399] transition-colors">{g.name}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-xs text-slate-500 font-medium line-clamp-1 w-full">
                            {g.description || <span className="text-slate-300 italic">No description provided.</span>}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <Users size={14} className="text-[#00A9CE]" />
                            <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                              {g.student_count || g.students?.length || 0} Members
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <Tag variant={g.status === 'inactive' ? 'rose' : 'emerald'}>
                            {g.status || 'active'}
                          </Tag>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <div className="flex items-center justify-center">
                            <ActionMenu actions={[
                              { label: 'Manage Students', icon: UserPlus, onClick: () => setModal({ type: 'students', data: g }), color: 'text-[#003399]' },
                              { label: 'Edit Details', icon: Edit2, onClick: () => setModal({ type: 'form', data: g }), color: 'text-slate-600' },
                              { label: 'Delete Group', icon: Trash2, onClick: () => handleDelete(g._id), color: 'text-rose-600' },
                            ]} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── MODALS ── */}
      {modal?.type === 'form' && (
        <GroupFormModal 
          group={modal.data} 
          onClose={() => setModal(null)} 
          onDone={loadGroups} 
        />
      )}
      
      {modal?.type === 'students' && (
        <ManageStudentsModal 
          group={modal.data} 
          onClose={() => setModal(null)} 
          onDone={loadGroups} 
        />
      )}

    </CollegeAdminLayout>
  );
}