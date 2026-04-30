// pages/CollegeAdmin/Courses/AssignCourseBatch.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send, BookOpen, Users, Search, CheckCircle2,
  AlertCircle, RefreshCw, X, CheckSquare, Square,
  ChevronLeft, Globe, Info, Lock,
} from 'lucide-react';
import CollegeAdminLayout from '../../../components/layout/CollegeAdminLayout';
import { DetailSkeleton } from '../../../components/common/SkeletonLoader';
import { collegeAdminCourseAPI as courseAPI } from '../../../api/Api';

const SHead = ({ icon: Icon, title, badge, color = '#003399' }) => (
  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
    <div
      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 border"
      style={{ backgroundColor: `${color}15`, borderColor: `${color}30` }}
    >
      <Icon className="w-3.5 h-3.5" style={{ color }} />
    </div>
    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
      {title}
      {badge != null && (
        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-100">{badge}</span>
      )}
    </h3>
  </div>
);

const AssignCourseBatch = () => {
  const navigate = useNavigate();
  const [courses, setCourses]                   = useState([]);
  const [students, setStudents]                 = useState([]);
  const [selectedCourse, setSelectedCourse]     = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [search, setSearch]                     = useState('');
  const [loading, setLoading]                   = useState(true);
  const [studentsLoading, setStudentsLoading]   = useState(false);
  const [assigning, setAssigning]               = useState(false);
  const [toast, setToast]                       = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => { fetchCourses(); }, []);
  useEffect(() => {
    if (!selectedCourse) { setStudents([]); setSelectedStudents([]); return; }
    const course = courses.find(c => c._id === selectedCourse);
    if (course && !isPlatformWide(course)) {
      fetchAssignableStudents(selectedCourse);
    } else {
      setStudents([]);
      setSelectedStudents([]);
    }
  }, [selectedCourse]);

  const isPlatformWide = (course) => !course?.collegeIds || course.collegeIds.length === 0;

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await courseAPI.getAllCourses({ limit: 200 });
      if (res?.success) setCourses(res.data || []);
    } catch {
      showToast('Failed to load courses', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignableStudents = async (courseId) => {
    setStudentsLoading(true);
    setStudents([]);
    setSelectedStudents([]);
    try {
      const res = await courseAPI.getAssignableStudents(courseId);
      if (res?.success) setStudents(res.data || []);
      else showToast(res?.message || 'Failed to load students', 'error');
    } catch (err) {
      showToast(err?.message || 'Failed to load students', 'error');
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedCourse || selectedStudents.length === 0) {
      showToast('Please select a course and at least one student', 'error');
      return;
    }
    setAssigning(true);
    try {
      const res = await courseAPI.assignCourseToBatch({ courseId: selectedCourse, userIds: selectedStudents });
      if (res?.success) {
        showToast(`Course assigned to ${res.enrolled} student(s)!${res.skipped ? ` (${res.skipped} already enrolled)` : ''}`);
        setSelectedStudents([]);
        fetchAssignableStudents(selectedCourse);
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
    setSelectedStudents(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);

  const filteredStudents = students.filter(s => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.fullName?.toLowerCase().includes(q) ||
      s.name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.studentInfo?.rollNumber?.toLowerCase().includes(q) ||
      s.studentInfo?.branch?.toLowerCase().includes(q)
    );
  });

  const allVisibleSelected = filteredStudents.length > 0 && filteredStudents.every(s => selectedStudents.includes(s._id));
  const selectAll = () => {
    const visible = filteredStudents.map(s => s._id);
    setSelectedStudents(prev =>
      visible.every(id => prev.includes(id))
        ? prev.filter(id => !visible.includes(id))
        : [...new Set([...prev, ...visible])]
    );
  };

  const selectedCourseObj    = courses.find(c => c._id === selectedCourse);
  const courseIsPlatformWide = selectedCourseObj ? isPlatformWide(selectedCourseObj) : false;

  if (loading) return <DetailSkeleton layout={CollegeAdminLayout} />;

  return (
    <CollegeAdminLayout>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-medium ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <div className="px-6 py-4 md:px-8 md:py-6 space-y-5 font-sans">

        {/* ── Header ─────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2 h-8 bg-gradient-to-b from-[#003399] to-[#00A9CE] rounded-full" />
              Assign Course to Students
            </h1>
            <p className="text-sm text-slate-400 mt-1 font-medium">
              Only college-specific courses can be assigned to students
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard/college-admin/courses')}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 text-[11px] font-black uppercase tracking-wider px-5 py-3 rounded-xl hover:bg-slate-50 transition-all shadow-sm active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Courses
          </button>
        </div>

        {/* ── Selection Grid ─────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Course Selection */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <SHead icon={BookOpen} title="Select Course" badge={courses.length} />
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {courses.length === 0 ? (
                <div className="text-center py-10">
                  <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">No courses found</p>
                </div>
              ) : courses.map(c => {
                const platWide = isPlatformWide(c);
                const isSel    = selectedCourse === c._id;
                return (
                  <button
                    key={c._id}
                    onClick={() => setSelectedCourse(c._id)}
                    className={`w-full text-left p-3.5 rounded-xl border-2 transition-all ${isSel ? 'border-[#003399] bg-[#003399]/5' : 'border-slate-100 hover:border-[#003399]/20 hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${isSel ? 'bg-[#003399]' : 'bg-slate-100'}`}>
                        {isSel
                          ? <CheckCircle2 className="w-4 h-4 text-white" />
                          : <BookOpen className="w-4 h-4 text-slate-400" />
                        }
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`font-semibold text-sm truncate ${isSel ? 'text-[#003399]' : 'text-slate-800'}`}>{c.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <p className="text-xs text-slate-400">{c.category} · {c.level}</p>
                          {platWide && (
                            <span className="text-[9px] bg-slate-100 text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5 flex-shrink-0">
                              <Globe className="w-2.5 h-2.5" /> Platform
                            </span>
                          )}
                        </div>
                      </div>
                      {platWide && <Lock className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Student Selection */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 border" style={{ backgroundColor: '#00339915', borderColor: '#00339930' }}>
                  <Users className="w-3.5 h-3.5" style={{ color: '#003399' }} />
                </div>
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  Select Students
                  {selectedStudents.length > 0 && (
                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-100">{selectedStudents.length} selected</span>
                  )}
                </h3>
              </div>
              {!courseIsPlatformWide && filteredStudents.length > 0 && (
                <button onClick={selectAll} className="text-xs text-[#003399] font-black hover:text-[#002d8b] transition-colors uppercase tracking-wider">
                  {allVisibleSelected ? 'Deselect All' : 'Select All'}
                </button>
              )}
            </div>

            {/* Platform-wide blocked */}
            {selectedCourse && courseIsPlatformWide ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-14 h-14 bg-slate-50 border-2 border-slate-200 rounded-2xl flex items-center justify-center mb-3">
                  <Lock className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-sm font-bold text-slate-700 mb-1">Assignment Disabled</p>
                <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                  This is a <span className="font-semibold text-slate-600">platform-wide course</span> — automatically accessible to all students.
                </p>
                <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[#003399] bg-[#003399]/5 border border-[#003399]/20 rounded-lg px-3 py-1.5">
                  <Globe className="w-3 h-3" /> All your students can already access this course
                </div>
              </div>

            ) : selectedCourse ? (
              <>
                <div className="flex items-center gap-1.5 p-2.5 bg-[#003399]/5 border border-[#003399]/20 rounded-xl text-[11px] text-[#003399] mb-3">
                  <Info className="w-3 h-3 flex-shrink-0" />
                  Students already enrolled in this course are hidden from the list.
                </div>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-8 py-2.5 border border-slate-100 hover:border-slate-200 rounded-xl focus:outline-none focus:border-[#003399]/30 text-xs font-bold bg-white transition-all"
                  />
                  {search && (
                    <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {studentsLoading ? (
                    <div className="flex justify-center py-8">
                      <RefreshCw className="w-5 h-5 text-[#003399] animate-spin" />
                    </div>
                  ) : filteredStudents.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                      <p className="text-sm text-slate-400">
                        {students.length === 0 ? 'All students are already enrolled' : 'No students match search'}
                      </p>
                    </div>
                  ) : filteredStudents.map(s => {
                    const isSelected = selectedStudents.includes(s._id);
                    return (
                      <button
                        key={s._id}
                        onClick={() => toggleStudent(s._id)}
                        className={`w-full text-left flex items-center gap-3 p-3 rounded-xl transition-all ${isSelected ? 'bg-[#003399]/5 border border-[#003399]/20' : 'hover:bg-slate-50 border border-transparent'}`}
                      >
                        <div className={`w-5 h-5 flex-shrink-0 rounded flex items-center justify-center ${isSelected ? 'text-[#003399]' : 'text-slate-300'}`}>
                          {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{s.fullName || s.name || s.email}</p>
                          <p className="text-xs text-slate-400 truncate">
                            {s.studentInfo?.rollNumber && <span>{s.studentInfo.rollNumber} · </span>}
                            {s.studentInfo?.branch || s.email}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
                  <BookOpen className="w-7 h-7 text-slate-200" />
                </div>
                <p className="text-sm text-slate-400">Select a course first</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Action Bar ─────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center justify-between gap-4">
          <div className="text-sm text-slate-600">
            {selectedCourse && courseIsPlatformWide ? (
              <span className="flex items-center gap-2 text-slate-400">
                <Lock className="w-4 h-4" /> Platform-wide course — assignment is disabled
              </span>
            ) : selectedCourse && selectedStudents.length > 0 ? (
              <span className="flex items-center gap-2 text-[#003399] font-medium">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Ready to assign to <strong>{selectedStudents.length}</strong> student(s)
              </span>
            ) : (
              <span className="text-slate-400">Select a college-specific course and students to proceed</span>
            )}
          </div>
          <button
            onClick={handleAssign}
            disabled={assigning || !selectedCourse || selectedStudents.length === 0 || courseIsPlatformWide}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#003399] text-white font-black text-[11px] uppercase tracking-wider rounded-xl hover:bg-[#002d8b] shadow-lg shadow-blue-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            {assigning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {assigning ? 'Assigning...' : `Assign to ${selectedStudents.length || 0} Students`}
          </button>
        </div>

      </div>
    </CollegeAdminLayout>
  );
};

export default AssignCourseBatch;