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

const AssignCourseBatch = () => {
  const navigate = useNavigate();
  const [courses, setCourses]                   = useState([]);
  const [students, setStudents]                 = useState([]);
  const [selectedCourse, setSelectedCourse]     = useState('');
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

  useEffect(() => { fetchCourses(); }, []);

  useEffect(() => {
    if (!selectedCourse) { setStudents([]); setSelectedStudents([]); return; }
    const course = courses.find(c => c._id === selectedCourse);
    // Only fetch students if this course belongs to the college admin's college
    // (isPlatformWide = empty collegeIds → cannot assign)
    if (course && !isPlatformWide(course)) {
      fetchAssignableStudents(selectedCourse);
    } else {
      setStudents([]);
      setSelectedStudents([]);
    }
  }, [selectedCourse]);

  // Platform-wide = collegeIds is empty/null
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
      if (res?.success) {
        setStudents(res.data || []);
      } else {
        showToast(res?.message || 'Failed to load students', 'error');
      }
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

  const selectedCourseObj   = courses.find(c => c._id === selectedCourse);
  const courseIsPlatformWide = selectedCourseObj ? isPlatformWide(selectedCourseObj) : false;

  if (loading) return <DetailSkeleton layout={CollegeAdminLayout} />;

  return (
    <CollegeAdminLayout>
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-medium ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <div className="min-h-screen bg-[#f0f4f8] px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4">
        <div className="max-w-[1400px] mx-auto space-y-3 sm:space-y-4">

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div>
          <h1 className="text-[20px] md:text-[26px] font-bold text-gray-900 tracking-tight">
            Assign Course <span className="text-blue-600">to Students</span>
          </h1>
          <p className="text-[12px] md:text-[14px] text-gray-500 mt-1">
            Only college-specific courses can be assigned to students
          </p>
        </div>
        <button
          onClick={() => navigate('/dashboard/college-admin/courses')}
          className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 text-[13px] font-bold px-4 py-2.5 rounded-lg shadow-sm hover:bg-gray-50 transition-colors flex-shrink-0"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Courses
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* ── Course Selection ── */}
        <div className="bg-white rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-50">
            <div className="w-7 h-7 bg-[#003399] rounded-lg flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">Select Course</h3>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {courses.length === 0 ? (
              <div className="text-center py-10">
                <BookOpen className="w-12 h-12 text-white/70 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No courses found</p>
              </div>
            ) : courses.map(c => {
              const platWide = isPlatformWide(c);
              const isSel = selectedCourse === c._id;
              return (
                <button
                  key={c._id}
                  onClick={() => setSelectedCourse(c._id)}
                  className={`w-full text-left p-3.5 rounded-xl border-2 transition-all ${isSel ? 'border-[#003399] bg-[#003399]/5' : 'border-gray-100 hover:border-[#003399]/20 hover:bg-slate-50'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isSel ? 'bg-[#003399]' : 'bg-gray-100'}`}>
                      {isSel ? <CheckCircle2 className="w-4 h-4 text-white" /> : <BookOpen className="w-4 h-4 text-slate-400" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`font-semibold text-sm truncate ${isSel ? 'text-[#003399]' : 'text-gray-800'}`}>{c.title}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <p className="text-xs text-slate-400">{c.category} · {c.level}</p>
                        {platWide && (
                          <span className="text-[9px] bg-gray-100 text-gray-500 border border-gray-200 px-1.5 py-0.5 rounded-full font-semibold flex items-center gap-0.5 flex-shrink-0">
                            <Globe className="w-2.5 h-2.5" /> Platform-wide
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Lock icon for platform-wide */}
                    {platWide && (
                      <Lock className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Student Selection ── */}
        <div className="bg-white rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg flex items-center justify-center">
                <Users className="w-3.5 h-3.5 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                Select Students
                {selectedStudents.length > 0 && (
                  <span className="text-xs bg-[#003399]/10 text-[#003399] px-2 py-0.5 rounded-full font-semibold">{selectedStudents.length} selected</span>
                )}
              </h3>
            </div>
            {!courseIsPlatformWide && filteredStudents.length > 0 && (
              <button onClick={selectAll} className="text-xs text-[#003399] font-semibold hover:text-[#003399] transition-colors">
                {allVisibleSelected ? 'Deselect All' : 'Select All'}
              </button>
            )}
          </div>

          {/* Platform-wide blocked state */}
          {selectedCourse && courseIsPlatformWide ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-14 h-14 bg-gray-50 border-2 border-gray-200 rounded-2xl flex items-center justify-center mb-3">
                <Lock className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm font-bold text-gray-700 mb-1">Assignment Disabled</p>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                This is a <span className="font-semibold text-gray-600">platform-wide course</span> — it is automatically accessible to all students. Individual assignment is not allowed.
              </p>
              <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[#003399] bg-[#003399]/5 border border-[#003399]/20 rounded-lg px-3 py-1.5">
                <Globe className="w-3 h-3" /> All your students can already access this course
              </div>
            </div>

          ) : selectedCourse ? (
            <>
              {/* Already-enrolled notice */}
              <div className="flex items-center gap-1.5 p-2.5 bg-[#003399]/5 border border-[#003399]/20 rounded-xl text-[11px] text-[#003399] mb-3">
                <Info className="w-3 h-3 flex-shrink-0" />
                Students already enrolled in this course are hidden from the list.
              </div>

              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[#003399] text-sm"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {studentsLoading ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="w-5 h-5 text-[#00A9CE] animate-spin" />
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-10 h-10 text-gray-200 mx-auto mb-2" />
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
                      <div className={`w-5 h-5 flex-shrink-0 rounded flex items-center justify-center ${isSelected ? 'text-[#003399]' : 'text-gray-300'}`}>
                        {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{s.fullName || s.name || s.email}</p>
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
            <div className="text-center py-8">
              <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Select a course first</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Assign Action Bar ── */}
      <div className="bg-white rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-100 p-4 flex items-center justify-between gap-4">
        <div className="text-sm text-gray-600">
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
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#003399] to-[#00A9CE] text-white font-semibold rounded-xl hover:opacity-90 shadow-lg shadow-[#003399]/15 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {assigning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {assigning ? 'Assigning...' : `Assign to ${selectedStudents.length || 0} Students`}
        </button>
      </div>
        </div>
      </div>
    </CollegeAdminLayout>
  );
};

export default AssignCourseBatch;