import { useState, useEffect, useCallback } from 'react';
import {
  Users, Search, ChevronRight, ChevronLeft, ChevronDown,
  BookOpen, BarChart2, Target, TrendingUp, Award,
  ClipboardList, UserCheck, AlertCircle, Layers,
} from 'lucide-react';
import TrainerDashboardLayout from '../../../components/layout/Trainerdashboardlayout';
import { trainerAPI } from '../../../api/Api';

// ─── Tiny helpers ────────────────────────────────────────────────────────────

const Avatar = ({ name }) => {
  const parts = (name || 'U').split(' ');
  const initials = parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : (name || 'U').substring(0, 2).toUpperCase();
  return (
    <div
      className="w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black text-white flex-shrink-0"
      style={{ background: 'linear-gradient(135deg, #003399, #00A9CE)' }}
    >
      {initials}
    </div>
  );
};

const ProgressBar = ({ value = 0 }) => {
  const color = value >= 75 ? '#059669' : value >= 40 ? '#D97706' : '#E11D48';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden w-16">
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(value, 100)}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-black w-8 text-right" style={{ color }}>{value}%</span>
    </div>
  );
};

const StatPill = ({ icon: Icon, label, value, color = '#003399' }) => (
  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-100 shadow-sm">
    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
      style={{ background: `${color}15` }}>
      <Icon className="w-3.5 h-3.5" style={{ color }} />
    </div>
    <div>
      <p className="text-[10px] text-slate-400 leading-none mb-0.5">{label}</p>
      <p className="text-sm font-black text-slate-800 leading-none">{value ?? '—'}</p>
    </div>
  </div>
);

// ─── Group sidebar item ───────────────────────────────────────────────────────

const GroupItem = ({ group, selected, onSelect }) => (
  <button
    onClick={() => onSelect(group)}
    className="w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center justify-between gap-2 group"
    style={selected
      ? { background: 'linear-gradient(135deg, #003399, #00A9CE)', color: '#fff' }
      : { background: 'transparent' }
    }
  >
    <div className="flex items-center gap-2 min-w-0">
      <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
        style={selected ? { background: 'rgba(255,255,255,0.2)' } : { background: '#003399' + '12' }}>
        <Users className="w-3 h-3" style={{ color: selected ? '#fff' : '#003399' }} />
      </div>
      <span className="text-xs font-bold truncate" style={{ color: selected ? '#fff' : '#334155' }}>
        {group.group_name}
      </span>
    </div>
    <span
      className="text-[10px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0"
      style={selected
        ? { background: 'rgba(255,255,255,0.25)', color: '#fff' }
        : { background: '#003399' + '12', color: '#003399' }
      }
    >
      {group.student_count}
    </span>
  </button>
);

// ─── Course group section in sidebar ─────────────────────────────────────────

const CourseSection = ({ courseTitle, groups, selectedGroup, onSelect }) => {
  const [open, setOpen] = useState(true);
  return (
    <div className="mb-3">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-all mb-1"
      >
        <BookOpen className="w-3 h-3 text-slate-400 flex-shrink-0" />
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 truncate flex-1 text-left">
          {courseTitle}
        </span>
        <ChevronDown className={`w-3 h-3 text-slate-300 transition-transform flex-shrink-0 ${open ? '' : '-rotate-90'}`} />
      </button>
      {open && (
        <div className="space-y-1 pl-1">
          {groups.map(g => (
            <GroupItem
              key={g.group_id}
              group={g}
              selected={selectedGroup?.group_id === g.group_id}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Analytics strip for selected group ──────────────────────────────────────

const GroupAnalyticsStrip = ({ group }) => (
  <div
    className="rounded-2xl p-4 mb-4"
    style={{ background: 'linear-gradient(135deg, #003399 0%, #0066CC 50%, #00A9CE 100%)' }}
  >
    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
      <div>
        <h2 className="text-sm font-black text-white">{group.group_name}</h2>
        <p className="text-[11px] text-blue-200 mt-0.5">{group.course_title || 'No course linked'}</p>
      </div>
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20">
        <Users className="w-3 h-3 text-white" />
        <span className="text-xs font-black text-white">{group.student_count} students</span>
      </div>
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {[
        { icon: ClipboardList, label: 'Assessments', value: group.total_assessments ?? 0, color: '#60A5FA' },
        { icon: Target, label: 'Total attempts', value: group.total_attempts ?? 0, color: '#34D399' },
        { icon: TrendingUp, label: 'Pass rate', value: `${group.pass_rate ?? 0}%`, color: '#FBBF24' },
        { icon: Award, label: 'Avg score', value: `${group.avg_score ?? 0}%`, color: '#F472B6' },
      ].map(({ icon: Icon, label, value, color }) => (
        <div key={label} className="rounded-xl bg-white/10 px-3 py-2 flex items-center gap-2">
          <Icon className="w-4 h-4 flex-shrink-0" style={{ color }} />
          <div>
            <p className="text-[10px] text-blue-200 leading-none mb-1">{label}</p>
            <p className="text-sm font-black text-white leading-none">{value}</p>
          </div>
        </div>
      ))}
    </div>
    {group.course_completion_rate != null && (
      <div className="mt-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-blue-200">Course completion</span>
          <span className="text-[10px] font-black text-white">{group.course_completion_rate}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
          <div
            className="h-full rounded-full bg-white/80"
            style={{ width: `${Math.min(group.course_completion_rate, 100)}%` }}
          />
        </div>
      </div>
    )}
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

const TrainerStudents = () => {
  // ── State ──────────────────────────────────────────────────────────────────
  const [groups, setGroups]               = useState([]);    // flat list from API
  const [courseMap, setCourseMap]         = useState({});    // courseTitle → [group]
  const [selectedGroup, setSelectedGroup] = useState(null);

  const [students, setStudents]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [error, setError]         = useState('');
  const [search, setSearch]       = useState('');
  const [page, setPage]           = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]         = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const LIMIT = 15;

  // ── Load groups once ───────────────────────────────────────────────────────
  useEffect(() => {
    const loadGroups = async () => {
      setGroupsLoading(true);
      try {
        const res = await trainerAPI.getGroupAnalytics();
        const data = res.data || [];
        setGroups(data);

        // Build courseTitle → [groups] map for the sidebar
        const map = {};
        for (const g of data) {
          const key = g.course_title || 'No course';
          if (!map[key]) map[key] = [];
          map[key].push(g);
        }
        setCourseMap(map);

        // Auto-select first group if any exist
        if (data.length > 0) {
          setSelectedGroup(data[0]);
        }
      } catch {
        // Groups fail silently — student table still works without a filter
      } finally {
        setGroupsLoading(false);
      }
    };
    loadGroups();
  }, []);

  // ── Load students ──────────────────────────────────────────────────────────
  const fetchStudents = useCallback(async (p = 1, s = '', groupId = null) => {
    setLoading(true);
    setError('');
    try {
      const params = { page: p, limit: LIMIT };
      if (s) params.search = s;
      if (groupId) params.group_id = groupId;

      const res = await trainerAPI.getStudents(params);
      setStudents(res.data || []);
      setTotalPages(res.totalPages || 1);
      setTotal(res.total || 0);
    } catch (e) {
      setError('Failed to load students.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload when selected group changes
  useEffect(() => {
    setPage(1);
    setSearch('');
    fetchStudents(1, '', selectedGroup?.group_id || null);
  }, [selectedGroup]);

  const handleSearch = (val) => {
    setSearch(val);
    setPage(1);
    fetchStudents(1, val, selectedGroup?.group_id || null);
  };

  const handlePage = (p) => {
    setPage(p);
    fetchStudents(p, search, selectedGroup?.group_id || null);
  };

  const handleGroupSelect = (group) => {
    setSelectedGroup(group);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <TrainerDashboardLayout>
      <div className="max-w-screen-xl mx-auto py-2">
        <div className="flex gap-4 items-start">

          {/* ── SIDEBAR ── */}
          <div
            className="flex-shrink-0 transition-all duration-300"
            style={{ width: sidebarOpen ? 220 : 0, overflow: 'hidden' }}
          >
            <div style={{ width: 220 }}>
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 sticky top-4">
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#003399]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">My Groups</span>
                  </div>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-1 rounded-lg hover:bg-slate-50 text-slate-300 hover:text-slate-500 transition-all"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                </div>

                {groupsLoading ? (
                  <div className="space-y-2">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-9 bg-slate-100 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : Object.keys(courseMap).length === 0 ? (
                  <div className="text-center py-6">
                    <Layers className="w-8 h-8 mx-auto text-slate-200 mb-2" />
                    <p className="text-xs text-slate-400">No groups assigned</p>
                  </div>
                ) : (
                  <div>
                    {/* "All students" option */}
                    <GroupItem
                      group={{ group_id: null, group_name: 'All students', student_count: total }}
                      selected={selectedGroup === null}
                      onSelect={() => setSelectedGroup(null)}
                    />
                    <div className="my-2 border-t border-slate-100" />
                    {Object.entries(courseMap).map(([courseTitle, grps]) => (
                      <CourseSection
                        key={courseTitle}
                        courseTitle={courseTitle}
                        groups={grps}
                        selectedGroup={selectedGroup}
                        onSelect={handleGroupSelect}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── MAIN CONTENT ── */}
          <div className="flex-1 min-w-0">

            {/* Header */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              {!sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-[#003399] hover:border-[#003399]/30 transition-all"
                >
                  <Layers className="w-4 h-4" />
                </button>
              )}
              <div className="flex-1">
                <h1 className="text-xl font-black text-slate-800">My Students</h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedGroup
                    ? `Viewing ${selectedGroup.group_name}`
                    : `${total} students across all your groups`}
                </p>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#003399]/5 border border-[#003399]/10">
                <UserCheck className="w-4 h-4 text-[#003399]" />
                <span className="text-xs font-black text-[#003399]">{total} Students</span>
              </div>
            </div>

            {/* Group analytics strip */}
            {selectedGroup && selectedGroup.group_id && (
              <GroupAnalyticsStrip group={selectedGroup} />
            )}

            {/* No-group summary stats */}
            {!selectedGroup && groups.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <StatPill icon={Layers} label="Total groups" value={groups.length} color="#003399" />
                <StatPill icon={ClipboardList} label="Assessments"
                  value={groups.reduce((s, g) => s + (g.total_assessments || 0), 0)} color="#7C3AED" />
                <StatPill icon={Target} label="Total attempts"
                  value={groups.reduce((s, g) => s + (g.total_attempts || 0), 0)} color="#059669" />
                <StatPill icon={BarChart2} label="Avg pass rate"
                  value={groups.length
                    ? `${(groups.reduce((s, g) => s + (g.pass_rate || 0), 0) / groups.length).toFixed(1)}%`
                    : '—'}
                  color="#D97706"
                />
              </div>
            )}

            {/* Search */}
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-slate-200 max-w-sm mb-4">
              <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <input
                value={search}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Search by name or email…"
                className="bg-transparent text-sm outline-none flex-1 text-slate-700 placeholder:text-slate-400"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600 mb-4">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Student table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {['Student', 'Email', 'Group / Course', 'Avg progress', 'Attempts', 'Avg score', 'Pass rate'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      [...Array(8)].map((_, i) => (
                        <tr key={i} className="border-b border-slate-50">
                          {[...Array(7)].map((_, j) => (
                            <td key={j} className="px-4 py-3">
                              <div className="h-4 bg-slate-100 rounded animate-pulse" style={{ width: j === 0 ? 120 : j === 1 ? 160 : 80 }} />
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : students.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-16">
                          <Users className="w-10 h-10 mx-auto text-slate-200 mb-3" />
                          <p className="text-slate-400 text-sm font-bold">No students found</p>
                          {selectedGroup && (
                            <p className="text-slate-300 text-xs mt-1">This group has no students yet</p>
                          )}
                        </td>
                      </tr>
                    ) : students.map((s) => {
                      const primaryGroup = s.groups?.[0];
                      return (
                        <tr
                          key={s.student_id}
                          className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors"
                        >
                          {/* Student name + branch/batch */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <Avatar name={s.full_name} />
                              <div>
                                <p className="text-sm font-bold text-slate-800 whitespace-nowrap">
                                  {s.full_name || '—'}
                                </p>
                                {(s.branch || s.batch) && (
                                  <p className="text-[10px] text-slate-400">
                                    {[s.branch, s.batch].filter(Boolean).join(' · ')}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Email */}
                          <td className="px-4 py-3">
                            <span className="text-xs text-slate-500">{s.email || '—'}</span>
                          </td>

                          {/* Group / Course */}
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                                {primaryGroup?.group_name || '—'}
                              </p>
                              {primaryGroup?.course_title && (
                                <p className="text-[10px] text-slate-400 whitespace-nowrap">
                                  {primaryGroup.course_title}
                                </p>
                              )}
                              {s.groups?.length > 1 && (
                                <span className="text-[10px] text-[#003399] font-bold">
                                  +{s.groups.length - 1} more
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Avg progress */}
                          <td className="px-4 py-3 min-w-[120px]">
                            <ProgressBar value={s.avg_progress ?? 0} />
                          </td>

                          {/* Attempts */}
                          <td className="px-4 py-3 text-center">
                            <span className="text-sm font-black text-slate-700">{s.total_attempts ?? 0}</span>
                          </td>

                          {/* Avg score */}
                          <td className="px-4 py-3">
                            <span className={`text-sm font-black ${
                              (s.avg_score ?? 0) >= 60 ? 'text-emerald-600'
                              : (s.avg_score ?? 0) >= 40 ? 'text-amber-500'
                              : 'text-rose-500'
                            }`}>
                              {s.avg_score ?? 0}%
                            </span>
                          </td>

                          {/* Pass rate */}
                          <td className="px-4 py-3">
                            <span
                              className="text-[10px] font-black px-2 py-0.5 rounded-full"
                              style={
                                (s.pass_rate ?? 0) >= 60
                                  ? { background: '#ECFDF5', color: '#059669' }
                                  : (s.pass_rate ?? 0) >= 40
                                  ? { background: '#FFFBEB', color: '#D97706' }
                                  : { background: '#FFF1F2', color: '#E11D48' }
                              }
                            >
                              {s.pass_rate ?? 0}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                  <p className="text-xs text-slate-400">
                    Page {page} of {totalPages} · {total} students
                  </p>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handlePage(page - 1)}
                      disabled={page === 1}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-[#003399] hover:border-[#003399]/30 disabled:opacity-40 transition-all"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                      const pg = i + 1;
                      return (
                        <button
                          key={pg}
                          onClick={() => handlePage(pg)}
                          className="w-7 h-7 rounded-lg text-xs font-bold transition-all border"
                          style={pg === page
                            ? { background: '#003399', color: '#fff', borderColor: '#003399' }
                            : { borderColor: '#e2e8f0', color: '#94a3b8' }
                          }
                        >
                          {pg}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => handlePage(page + 1)}
                      disabled={page === totalPages}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-[#003399] hover:border-[#003399]/30 disabled:opacity-40 transition-all"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </TrainerDashboardLayout>
  );
};

export default TrainerStudents;