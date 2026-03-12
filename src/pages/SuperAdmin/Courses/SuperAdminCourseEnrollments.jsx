// pages/SuperAdmin/Courses/SuperAdminAssignCourseBatch.jsx
// Super Admin: Assign courses to students — loads colleges first, then per-college students
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send, BookOpen, Users, Search, CheckCircle2, ChevronLeft, AlertCircle,
  RefreshCw, X, CheckSquare, Square, Building2, ChevronDown, ArrowLeft,
} from 'lucide-react';
import SuperAdminDashboardLayout from '../../../components/layout/SuperAdminDashboardLayout';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { superAdminCourseAPI } from '../../../api/Api';
import { superAdminStudentAPI } from '../../../api/studentAPI';
import apiCall from '../../../api/Api';

/* ─── Section heading ─────────────────────── */
const SHead = ({ icon: Icon, title, sub, badge }) => (
  <div className="flex items-center gap-2 mb-3">
    <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
      <Icon className="w-3 h-3 text-white" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-bold text-gray-800 leading-none">{title}</h3>
        {badge != null && (
          <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-100">{badge}</span>
        )}
      </div>
      {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const SuperAdminCourseEnrollments = () => {
  const navigate = useNavigate();
  const [courses, setCourses]           = useState([]);
  const [colleges, setColleges]         = useState([]);
  const [students, setStudents]         = useState([]);
  const [selectedCourse, setSelectedCourse]     = useState('');
  const [selectedCollege, setSelectedCollege]   = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [search, setSearch]       = useState('');
  const [loading, setLoading]     = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [toast, setToast]         = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => { fetchInitialData(); }, []);

  useEffect(() => {
    if (selectedCollege) fetchStudents(selectedCollege);
    else { setStudents([]); setSelectedStudents([]); }
  }, [selectedCollege]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [coursesRes, collegesRes] = await Promise.allSettled([
        superAdminCourseAPI.getAllCourses({ limit: 100, status: 'Active' }),
        superAdminStudentAPI.getColleges(),
      ]);
      if (coursesRes.status === 'fulfilled' && coursesRes.value?.success)
        setCourses(coursesRes.value.data || []);
      if (collegesRes.status === 'fulfilled' && collegesRes.value?.success)
        setColleges(collegesRes.value.data || collegesRes.value.colleges || []);
    } catch {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async (collegeId) => {
    setStudentsLoading(true);
    setStudents([]);
    setSelectedStudents([]);
    try {
      const res = await apiCall(`/super-admin/colleges/${collegeId}/students?limit=300`);
      if (res?.success) setStudents(res.students || res.data || []);
    } catch {
      showToast('Failed to load students', 'error');
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedCourse || selectedStudents.length === 0) {
      showToast('Select a course and at least one student', 'error');
      return;
    }
    setAssigning(true);
    try {
      const res = await superAdminCourseAPI.assignCourseToBatch({
        courseId: selectedCourse,
        userIds: selectedStudents,
      });
      if (res?.success) {
        showToast(`Assigned to ${res.enrolled ?? selectedStudents.length} student(s)!${res.skipped ? ` (${res.skipped} already enrolled)` : ''}`);
        setSelectedStudents([]);
        setSelectedCourse('');
      } else {
        showToast(res?.message || 'Assignment failed', 'error');
      }
    } catch (err) {
      showToast(err?.message || 'Assignment failed', 'error');
    } finally {
      setAssigning(false);
    }
  };

  const toggleStudent = (id) =>
    setSelectedStudents(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );

  const filteredStudents = students.filter(s => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.fullName?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.studentInfo?.rollNumber?.toLowerCase().includes(q)
    );
  });

  const allSelected =
    filteredStudents.length > 0 &&
    filteredStudents.every(s => selectedStudents.includes(s._id));

  const toggleAll = () => {
    const ids = filteredStudents.map(s => s._id);
    setSelectedStudents(prev =>
      allSelected
        ? prev.filter(id => !ids.includes(id))
        : [...new Set([...prev, ...ids])]
    );
  };

  const selectedCourseObj = courses.find(c => c._id === selectedCourse);

  if (loading) return <LoadingSpinner message="Loading..." icon={Send} />;

  return (
    <SuperAdminDashboardLayout>

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl text-xs font-bold border backdrop-blur-xl ${
          toast.type === 'error'
            ? 'bg-red-50 text-red-700 border-red-200'
            : 'bg-blue-50 text-blue-700 border-blue-200'
        }`}>
          {toast.type === 'error'
            ? <AlertCircle className="w-4 h-4 flex-shrink-0" />
            : <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
          {toast.msg}
        </div>
      )}

      {/* ══ HERO BANNER ══ */}
      <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 rounded-2xl px-5 py-4 mb-4 shadow-xl shadow-blue-500/20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-10 -right-10 w-44 h-44 bg-white/10 rounded-full" />
          <div className="absolute -bottom-8 left-1/3 w-28 h-28 bg-white/10 rounded-full" />
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: 'radial-gradient(circle,white 1px,transparent 1px)', backgroundSize: '18px 18px' }} />
        </div>
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Send className="w-5 h-5 text-white" />
          </div>
          <div>
            <button
              onClick={() => navigate('/dashboard/super-admin/courses')}
              className="text-blue-200 hover:text-white text-[11px] font-semibold flex items-center gap-1 mb-1 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" /> Back to Courses
            </button>
            <h1 className="text-white font-black text-lg leading-tight">Assign Course to Batch</h1>
            <p className="text-blue-200 text-[11px] mt-0.5">Select a college, then enroll students into a course</p>
          </div>
        </div>
      </div>

      {/* ══ TWO-PANEL GRID ══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

        {/* ── Step 1: Course Picker ── */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4">
          <SHead icon={BookOpen} title="Step 1 — Select Course" sub="Pick an active course to assign" badge={courses.length} />

          {courses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center mb-2">
                <BookOpen className="w-5 h-5 text-blue-200" />
              </div>
              <p className="text-xs text-gray-400 font-medium">No active courses available</p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-80 overflow-y-auto pr-0.5">
              {courses.map(c => {
                const isSel = selectedCourse === c._id;
                return (
                  <button
                    key={c._id}
                    onClick={() => setSelectedCourse(c._id)}
                    className={`w-full text-left flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      isSel
                        ? 'border-blue-300 bg-blue-50 shadow-sm'
                        : 'border-gray-100 hover:border-blue-100 hover:bg-gray-50/60'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                      isSel ? 'bg-gradient-to-br from-blue-500 to-cyan-500' : 'bg-gray-100'
                    }`}>
                      {isSel
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        : <BookOpen className="w-3.5 h-3.5 text-gray-400" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-bold truncate leading-tight ${isSel ? 'text-blue-700' : 'text-gray-800'}`}>{c.title}</p>
                      <p className="text-[10px] text-gray-400 truncate mt-0.5">{c.category} · {c.level} · {c.enrollmentCount || 0} enrolled</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Step 2: College + Students ── */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4">
          <SHead
            icon={Users}
            title="Step 2 — Select College & Students"
            sub="Filter students by college"
            badge={selectedStudents.length > 0 ? `${selectedStudents.length} selected` : undefined}
          />

          {/* College dropdown */}
          <div className="relative mb-3">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <select
              value={selectedCollege}
              onChange={e => { setSelectedCollege(e.target.value); setSearch(''); }}
              className="w-full pl-9 pr-8 py-2.5 border border-gray-200 hover:border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-xs text-gray-700 appearance-none bg-white"
            >
              <option value="">— Select a College —</option>
              {colleges.map(col => (
                <option key={col._id} value={col._id}>{col.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>

          {selectedCollege ? (
            <>
              {/* Search + Select All */}
              <div className="flex items-center gap-2 mb-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search students…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 border border-gray-200 hover:border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-xs"
                  />
                  {search && (
                    <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {filteredStudents.length > 0 && (
                  <button
                    onClick={toggleAll}
                    className="text-[11px] text-blue-600 font-bold whitespace-nowrap hover:text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    {allSelected ? 'Deselect All' : 'Select All'}
                  </button>
                )}
              </div>

              {studentsLoading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Users className="w-8 h-8 text-gray-200 mb-2" />
                  <p className="text-xs text-gray-400 font-medium">
                    {students.length === 0 ? 'No students in this college' : 'No students match search'}
                  </p>
                </div>
              ) : (
                <div className="space-y-1 max-h-64 overflow-y-auto pr-0.5">
                  {filteredStudents.map(s => {
                    const isSel = selectedStudents.includes(s._id);
                    return (
                      <button
                        key={s._id}
                        onClick={() => toggleStudent(s._id)}
                        className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all border ${
                          isSel ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50/60 border-transparent'
                        }`}
                      >
                        <div className={`flex-shrink-0 transition-colors ${isSel ? 'text-blue-600' : 'text-gray-300'}`}>
                          {isSel ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-900 truncate">{s.fullName || s.email}</p>
                          <p className="text-[10px] text-gray-400 truncate">
                            {s.studentInfo?.rollNumber ? `${s.studentInfo.rollNumber} · ` : ''}{s.email}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center mb-2">
                <Building2 className="w-5 h-5 text-blue-200" />
              </div>
              <p className="text-xs text-gray-400 font-medium">Select a college to see students</p>
            </div>
          )}
        </div>
      </div>

      {/* ══ ASSIGN FOOTER ══ */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          {selectedCourse && selectedStudents.length > 0 ? (
            <p className="text-xs font-medium text-gray-700 leading-relaxed">
              Ready to assign{' '}
              <span className="font-bold text-blue-600">{selectedCourseObj?.title}</span>
              {' '}to{' '}
              <span className="font-bold text-blue-600">{selectedStudents.length} student(s)</span>
            </p>
          ) : (
            <p className="text-xs text-gray-400">Select a course and at least one student to proceed</p>
          )}
        </div>
        <button
          onClick={handleAssign}
          disabled={assigning || !selectedCourse || selectedStudents.length === 0}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-bold rounded-xl shadow-sm hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex-shrink-0"
        >
          {assigning
            ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Assigning…</>
            : <><Send className="w-3.5 h-3.5" /> Assign to {selectedStudents.length || 0} Students</>}
        </button>
      </div>

    </SuperAdminDashboardLayout>
  );
};

export default SuperAdminCourseEnrollments;