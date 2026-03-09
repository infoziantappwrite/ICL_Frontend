// pages/SuperAdmin/Courses/SuperAdminAssignCourseBatch.jsx
// Super Admin: Assign courses to students — loads colleges first, then per-college students
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send, BookOpen, Users, Search, CheckCircle2, ChevronLeft, AlertCircle,
  RefreshCw, X, CheckSquare, Square, Building2, ChevronDown
} from 'lucide-react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { superAdminCourseAPI } from '../../../api/Api';
import { superAdminStudentAPI } from '../../../api/studentAPI';
import apiCall from '../../../api/Api';

const SuperAdminAssignCourseBatch = () => {
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

  if (loading) return <LoadingSpinner message="Loading..." icon={Send} />;

  return (
    <DashboardLayout title="Assign Course to Batch">
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-medium ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <button onClick={() => navigate('/dashboard/super-admin/courses')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 mb-6">
        <ChevronLeft className="w-4 h-4" /> Back to Courses
      </button>

      <div className="relative bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 rounded-3xl p-8 shadow-2xl mb-8 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute w-64 h-64 bg-white rounded-full -top-20 -right-20" />
          <div className="absolute w-40 h-40 bg-white rounded-full bottom-0 left-20" />
        </div>
        <div className="relative text-white flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Send className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Assign Course to Batch</h1>
            <p className="text-blue-100 text-sm mt-0.5">Select a college, then enroll students into a course</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Course Picker */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-500" />
            Step 1 — Select Course
          </h3>
          {courses.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-10">No active courses available</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {courses.map(c => (
                <button
                  key={c._id}
                  onClick={() => setSelectedCourse(c._id)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${selectedCourse === c._id ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-blue-200 hover:bg-gray-50'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${selectedCourse === c._id ? 'bg-blue-500' : 'bg-gray-100'}`}>
                      {selectedCourse === c._id
                        ? <CheckCircle2 className="w-4 h-4 text-white" />
                        : <BookOpen className="w-4 h-4 text-gray-400" />}
                    </div>
                    <div className="min-w-0">
                      <p className={`font-semibold text-sm truncate ${selectedCourse === c._id ? 'text-blue-700' : 'text-gray-800'}`}>{c.title}</p>
                      <p className="text-xs text-gray-400 truncate">{c.category} • {c.level} • {c.enrollmentCount || 0} enrolled</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* College + Students */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-500" />
            Step 2 — Select College &amp; Students
            {selectedStudents.length > 0 && (
              <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{selectedStudents.length} selected</span>
            )}
          </h3>

          <div className="relative mb-4">
            <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={selectedCollege}
              onChange={e => { setSelectedCollege(e.target.value); setSearch(''); }}
              className="w-full pl-10 pr-9 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 text-sm text-gray-700 appearance-none bg-white"
            >
              <option value="">— Select a College —</option>
              {colleges.map(col => (
                <option key={col._id} value={col._id}>{col.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {selectedCollege ? (
            <>
              <div className="flex items-center gap-2 mb-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 text-sm"
                  />
                  {search && (
                    <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {filteredStudents.length > 0 && (
                  <button onClick={toggleAll} className="text-xs text-blue-600 font-medium whitespace-nowrap hover:text-blue-700">
                    {allSelected ? 'Deselect All' : 'Select All'}
                  </button>
                )}
              </div>

              {studentsLoading ? (
                <div className="flex justify-center py-8"><RefreshCw className="w-6 h-6 text-blue-500 animate-spin" /></div>
              ) : filteredStudents.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">
                  {students.length === 0 ? 'No students in this college' : 'No students match search'}
                </p>
              ) : (
                <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                  {filteredStudents.map(s => {
                    const isSel = selectedStudents.includes(s._id);
                    return (
                      <button
                        key={s._id}
                        onClick={() => toggleStudent(s._id)}
                        className={`w-full text-left flex items-center gap-3 p-3 rounded-xl transition-all ${isSel ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'}`}
                      >
                        <div className={`w-5 h-5 flex-shrink-0 ${isSel ? 'text-blue-600' : 'text-gray-300'}`}>
                          {isSel ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{s.fullName || s.email}</p>
                          <p className="text-xs text-gray-400 truncate">
                            {s.studentInfo?.rollNumber ? `${s.studentInfo.rollNumber} • ` : ''}{s.email}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-10">
              <Building2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Select a college to see students</p>
            </div>
          )}
        </div>
      </div>

      {/* Assign footer */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          {selectedCourse && selectedStudents.length > 0 ? (
            <p className="text-sm font-medium text-gray-700">
              Ready to assign{' '}
              <span className="text-blue-600">{courses.find(c => c._id === selectedCourse)?.title}</span>
              {' '}to{' '}
              <span className="text-blue-600">{selectedStudents.length} student(s)</span>
            </p>
          ) : (
            <p className="text-sm text-gray-400">Select a course and students to proceed</p>
          )}
        </div>
        <button
          onClick={handleAssign}
          disabled={assigning || !selectedCourse || selectedStudents.length === 0}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-700 hover:to-cyan-700 transition-all"
        >
          {assigning
            ? <><RefreshCw className="w-4 h-4 animate-spin" /> Assigning...</>
            : <><Send className="w-4 h-4" /> Assign to {selectedStudents.length || 0} Students</>}
        </button>
      </div>
    </DashboardLayout>
  );
};

export default SuperAdminAssignCourseBatch;