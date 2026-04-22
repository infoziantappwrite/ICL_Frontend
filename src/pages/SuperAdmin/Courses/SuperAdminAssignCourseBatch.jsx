// pages/SuperAdmin/Courses/SuperAdminAssignCourseBatch.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send, BookOpen, Users, Search, CheckCircle2, AlertCircle,
  RefreshCw, X, CheckSquare, Square, Building2, ChevronDown,
  ArrowLeft, Globe, Info, Lock,
} from 'lucide-react';
import SuperAdminDashboardLayout from '../../../components/layout/SuperAdminDashboardLayout';
import { DetailSkeleton } from '../../../components/common/SkeletonLoader';
import { superAdminCourseAPI } from '../../../api/Api';
import { superAdminStudentAPI } from '../../../api/studentAPI';

const SHead = ({ icon: Icon, title, sub, badge, color = '#003399' }) => (
  <div className="flex items-center gap-2 mb-4">
    <div
      className="w-6 h-6 rounded-lg flex items-center justify-center border flex-shrink-0"
      style={{
        backgroundColor: `${color}15`,
        borderColor: `${color}30`,
      }}
    >
      <Icon className="w-3.5 h-3.5" style={{ color }} />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-bold text-slate-800 leading-none">{title}</h3>
        {badge != null && (
          <span className="text-[10px] font-black text-[#003399] bg-[#003399]/5 px-1.5 py-0.5 rounded-md border border-[#003399]/10">{badge}</span>
        )}
      </div>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const SuperAdminAssignCourseBatch = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedCollege, setSelectedCollege] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => { fetchInitialData(); }, []);

  useEffect(() => {
    if (selectedCourse && selectedCollege) {
      fetchAssignableStudents(selectedCourse, selectedCollege);
    } else {
      setStudents([]);
      setSelectedStudents([]);
    }
  }, [selectedCourse, selectedCollege]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [coursesRes, collegesRes] = await Promise.allSettled([
        superAdminCourseAPI.getAllCourses({ limit: 200 }),
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

  const fetchAssignableStudents = async (courseId, collegeId) => {
    setStudentsLoading(true);
    setStudents([]);
    setSelectedStudents([]);
    try {
      const res = await superAdminCourseAPI.getAssignableStudents(courseId, collegeId);
      if (res?.success) {
        setStudents(res.data || []);
      } else if (res?.isPlatformWide) {
        // Platform-wide — already handled in UI
        setStudents([]);
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
        // Re-fetch to remove newly enrolled students from list
        fetchAssignableStudents(selectedCourse, selectedCollege);
      } else if (res?.isPlatformWide) {
        showToast('Platform-wide courses cannot be individually assigned.', 'error');
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
      s.name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.studentInfo?.rollNumber?.toLowerCase().includes(q)
    );
  });

  const allSelected = filteredStudents.length > 0 && filteredStudents.every(s => selectedStudents.includes(s._id));

  const toggleAll = () => {
    const ids = filteredStudents.map(s => s._id);
    setSelectedStudents(prev =>
      allSelected ? prev.filter(id => !ids.includes(id)) : [...new Set([...prev, ...ids])]
    );
  };

  const selectedCourseObj = courses.find(c => c._id === selectedCourse);
  const isPlatformWide = selectedCourseObj?.isPlatformWide || (selectedCourseObj && (!selectedCourseObj.collegeIds || selectedCourseObj.collegeIds.length === 0));

  // Filter colleges to only those that have this course (when a course is selected)
  const eligibleColleges = selectedCourse && selectedCourseObj
    ? colleges.filter(col => {
      if (isPlatformWide) return false; // platform-wide → no colleges to pick
      const courseColleges = (selectedCourseObj.collegeIds || []).map(c => c._id || c);
      return courseColleges.includes(col._id);
    })
    : colleges;

  if (loading) return <DetailSkeleton layout={SuperAdminDashboardLayout} />;

  return (
    <SuperAdminDashboardLayout>
      <div className="px-6 py-4 md:px-8 md:py-6 space-y-5 font-sans">

        {/* Brand Header */}
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2 h-8 bg-gradient-to-b from-[#003399] to-[#00A9CE] rounded-full" />
              Assign Course to Batch
            </h1>
            <p className="text-sm text-slate-400 mt-1 font-medium">Select a course and students to begin batch enrollment</p>
          </div>
        </div>

        <div className="space-y-6">
          {toast && (
            <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl text-xs font-bold border backdrop-blur-xl ${toast.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
              {toast.type === 'error' ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
              {toast.msg}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

            {/* Step 1: Course Picker */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <SHead icon={BookOpen} title="Step 1 — Select Course" sub="Pick a course to assign" badge={courses.length} />

              {courses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <BookOpen className="w-8 h-8 text-gray-200 mb-2" />
                  <p className="text-xs text-gray-400 font-medium">No courses available</p>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-80 overflow-y-auto pr-0.5">
                  {courses.map(c => {
                    const coursePlatformWide = !c.collegeIds || c.collegeIds.length === 0;
                    const isSel = selectedCourse === c._id;
                    return (
                      <button
                        key={c._id}
                        onClick={() => { setSelectedCourse(c._id); setSelectedCollege(''); }}
                        className={`w-full text-left flex items-center gap-3 p-3 rounded-xl border transition-all ${isSel ? 'border-blue-300 bg-blue-50 shadow-sm' : 'border-gray-100 hover:border-blue-100 hover:bg-gray-50/60'}`}
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${isSel ? 'bg-gradient-to-br from-blue-500 to-cyan-500' : 'bg-gray-100'}`}>
                          {isSel ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : <BookOpen className="w-3.5 h-3.5 text-gray-400" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-bold truncate leading-tight ${isSel ? 'text-blue-700' : 'text-gray-800'}`}>{c.title}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <p className="text-[10px] text-gray-400 truncate">{c.category} · {c.level}</p>
                            {coursePlatformWide ? (
                              <span className="text-[9px] bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded-full font-semibold flex items-center gap-0.5 flex-shrink-0">
                                <Globe className="w-2.5 h-2.5" /> Platform
                              </span>
                            ) : (
                              <span className="text-[9px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded-full font-semibold flex items-center gap-0.5 flex-shrink-0">
                                <Building2 className="w-2.5 h-2.5" /> {c.collegeIds?.length || 0} college(s)
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Step 2: College + Students */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <SHead icon={Users} title="Step 2 — Select Students"
                sub="Only students not yet enrolled are shown"
                badge={selectedStudents.length > 0 ? `${selectedStudents.length} selected` : undefined}
              />

              {/* Platform-wide block */}
              {selectedCourse && isPlatformWide ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-12 h-12 bg-green-50 border border-green-200 rounded-2xl flex items-center justify-center mb-3">
                    <Globe className="w-6 h-6 text-green-500" />
                  </div>
                  <p className="text-xs font-bold text-green-700 mb-1">Platform-Wide Course</p>
                  <p className="text-[11px] text-gray-500 max-w-xs leading-relaxed">
                    This course is accessible to all college students automatically. Individual assignment is disabled.
                  </p>
                </div>
              ) : selectedCourse ? (
                <>
                  {/* College dropdown — filtered to only colleges in course.collegeIds */}
                  <div className="relative mb-3">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    <select
                      value={selectedCollege}
                      onChange={e => { setSelectedCollege(e.target.value); setSearch(''); }}
                      className="w-full pl-9 pr-8 py-2.5 border border-gray-200 hover:border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-xs text-gray-700 appearance-none bg-white"
                    >
                      <option value="">— Select a College —</option>
                      {eligibleColleges.map(col => (
                        <option key={col._id} value={col._id}>{col.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  </div>

                  {eligibleColleges.length === 0 && (
                    <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-700 mb-3">
                      <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      No colleges are assigned to this course. Edit the course to add colleges.
                    </div>
                  )}

                  {selectedCollege ? (
                    <>
                      {/* Already-enrolled note */}
                      <div className="flex items-center gap-1.5 p-2 bg-blue-50 border border-blue-100 rounded-lg text-[10px] text-blue-600 mb-2">
                        <Info className="w-3 h-3 flex-shrink-0" />
                        Students already enrolled in this course are hidden from the list below.
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                          <input type="text" placeholder="Search students…" value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-8 py-2 border border-gray-200 hover:border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-xs" />
                          {search && (
                            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        {filteredStudents.length > 0 && (
                          <button onClick={toggleAll}
                            className="text-[11px] text-blue-600 font-bold whitespace-nowrap hover:text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors">
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
                            {students.length === 0 ? 'All students are already enrolled' : 'No students match search'}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1 max-h-56 overflow-y-auto pr-0.5">
                          {filteredStudents.map(s => {
                            const isSel = selectedStudents.includes(s._id);
                            return (
                              <button key={s._id} onClick={() => toggleStudent(s._id)}
                                className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all border ${isSel ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50/60 border-transparent'}`}>
                                <div className={`flex-shrink-0 transition-colors ${isSel ? 'text-blue-600' : 'text-gray-300'}`}>
                                  {isSel ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-gray-900 truncate">{s.fullName || s.name || s.email}</p>
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
                      <Building2 className="w-8 h-8 text-gray-200 mb-2" />
                      <p className="text-xs text-gray-400 font-medium">Select a college to see students</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-10">
                  <BookOpen className="w-8 h-8 text-gray-200 mb-2" />
                  <p className="text-xs text-gray-400 font-medium">Select a course first</p>
                </div>
              )}
            </div>
          </div>

          {/* ══ ASSIGN FOOTER ══ */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              {isPlatformWide && selectedCourse ? (
                <p className="text-xs text-gray-500 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-gray-400" /> Platform-wide course — assignment disabled
                </p>
              ) : selectedCourse && selectedStudents.length > 0 ? (
                <p className="text-xs font-medium text-gray-700 leading-relaxed">
                  Ready to assign{' '}
                  <span className="font-bold text-blue-600">{selectedCourseObj?.title}</span>
                  {' '}to{' '}
                  <span className="font-bold text-blue-600">{selectedStudents.length} student(s)</span>
                </p>
              ) : (
                <p className="text-xs text-gray-400">Select a college-specific course and at least one student</p>
              )}
            </div>
            <button
              onClick={handleAssign}
              disabled={assigning || !selectedCourse || selectedStudents.length === 0 || isPlatformWide}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#003399] hover:bg-[#002d8b] text-white text-xs font-black rounded-xl shadow-sm hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex-shrink-0"
            >
              {assigning ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Assigning…</> : <><Send className="w-3.5 h-3.5" /> Assign to {selectedStudents.length || 0} Students</>}
            </button>
          </div>
        </div>
      </div>
    </SuperAdminDashboardLayout>
  );
};

export default SuperAdminAssignCourseBatch;