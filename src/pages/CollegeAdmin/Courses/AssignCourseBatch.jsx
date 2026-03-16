// pages/CollegeAdmin/Courses/AssignCourseBatch.jsx
// Admin: Assign a course to a batch/group of students
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send, BookOpen, Users, Search, CheckCircle2, ChevronLeft,
  AlertCircle, RefreshCw, X, CheckSquare, Square
} from 'lucide-react';
import CollegeAdminLayout from '../../../components/layout/CollegeAdminLayout';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { collegeAdminCourseAPI as courseAPI, collegeAdminAPI } from '../../../api/Api';

const AssignCourseBatch = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [coursesRes, studentsRes] = await Promise.allSettled([
        courseAPI.getAllCourses({ limit: 100, status: 'Active' }),
        collegeAdminAPI.getStudents({ limit: 200 }),
      ]);
      if (coursesRes.status === 'fulfilled' && coursesRes.value.success) {
        setCourses(coursesRes.value.data || []);
      }
      if (studentsRes.status === 'fulfilled' && studentsRes.value.success) {
        setStudents(studentsRes.value.students || studentsRes.value.data || []);
      }
    } catch (err) {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
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
      if (res.success) {
        showToast(`Course assigned to ${res.enrolled} student(s)! ${res.skipped ? `(${res.skipped} already enrolled)` : ''}`);
        setSelectedStudents([]);
        setSelectedCourse('');
      } else {
        showToast(res.message || 'Assignment failed', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Assignment failed', 'error');
    } finally {
      setAssigning(false);
    }
  };

  const toggleStudent = (id) => {
    setSelectedStudents(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    const visible = filteredStudents.map(s => s._id);
    setSelectedStudents(prev =>
      visible.every(id => prev.includes(id))
        ? prev.filter(id => !visible.includes(id))
        : [...new Set([...prev, ...visible])]
    );
  };

  const filteredStudents = students.filter(s => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.fullName?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.studentInfo?.rollNumber?.toLowerCase().includes(q) ||
      s.studentInfo?.branch?.toLowerCase().includes(q)
    );
  });

  const allVisibleSelected = filteredStudents.length > 0 && filteredStudents.every(s => selectedStudents.includes(s._id));

  if (loading) {
    return <LoadingSpinner message="Loading..." submessage="Fetching courses and students" icon={Send} />;
  }

  return (
    <CollegeAdminLayout>
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-medium ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Hero Banner */}
      <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 rounded-2xl px-5 py-4 mb-4 shadow-xl shadow-blue-500/20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-10 -right-10 w-44 h-44 bg-white/10 rounded-full" />
          <div className="absolute -bottom-8 left-1/3 w-28 h-28 bg-white/10 rounded-full" />
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle,white 1px,transparent 1px)', backgroundSize: '18px 18px' }} />
        </div>
        <div className="relative flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Send className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-black text-lg leading-tight">Assign Course to Batch</h1>
              <p className="text-blue-200 text-[11px] mt-0.5">Select a course and students to enroll them</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/dashboard/college-admin/courses')}
            className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex-shrink-0"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Courses
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Course Selection */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-50">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">Select Course</h3>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {courses.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-2">
                  <BookOpen className="w-6 h-6 text-blue-300" />
                </div>
                <p className="text-sm text-gray-400">No active courses found</p>
              </div>
            ) : courses.map(c => (
              <button
                key={c._id}
                onClick={() => setSelectedCourse(c._id)}
                className={`w-full text-left p-3.5 rounded-xl border-2 transition-all ${
                  selectedCourse === c._id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-100 hover:border-blue-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${selectedCourse === c._id ? 'bg-gradient-to-br from-blue-500 to-cyan-500' : 'bg-gray-100'}`}>
                    {selectedCourse === c._id
                      ? <CheckCircle2 className="w-4 h-4 text-white" />
                      : <BookOpen className="w-4 h-4 text-gray-400" />
                    }
                  </div>
                  <div className="min-w-0">
                    <p className={`font-semibold text-sm truncate ${selectedCourse === c._id ? 'text-blue-700' : 'text-gray-800'}`}>{c.title}</p>
                    <p className="text-xs text-gray-400">{c.category} · {c.level} · {c.enrollmentCount || 0} enrolled</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Student Selection */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-violet-500 rounded-lg flex items-center justify-center">
                <Users className="w-3.5 h-3.5 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                Select Students
                {selectedStudents.length > 0 && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">{selectedStudents.length} selected</span>
                )}
              </h3>
            </div>
            <button onClick={selectAll} className="text-xs text-blue-600 font-semibold hover:text-blue-700 transition-colors">
              {allVisibleSelected ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search students..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 text-sm"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            {filteredStudents.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <Users className="w-5 h-5 text-gray-300" />
                </div>
                <p className="text-sm text-gray-400">No students found</p>
              </div>
            ) : filteredStudents.map(s => {
              const isSelected = selectedStudents.includes(s._id);
              return (
                <button
                  key={s._id}
                  onClick={() => toggleStudent(s._id)}
                  className={`w-full text-left flex items-center gap-3 p-3 rounded-xl transition-all ${
                    isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <div className={`w-5 h-5 flex-shrink-0 rounded flex items-center justify-center ${isSelected ? 'text-blue-600' : 'text-gray-300'}`}>
                    {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{s.fullName || s.email}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {s.studentInfo?.rollNumber && <span>{s.studentInfo.rollNumber} · </span>}
                      {s.studentInfo?.branch || s.email}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Assign Action Bar */}
      <div className="mt-4 bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4 flex items-center justify-between gap-4">
        <div className="text-sm text-gray-600">
          {selectedCourse && selectedStudents.length > 0 ? (
            <span className="flex items-center gap-2 text-blue-700 font-medium">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Ready to assign course to <strong>{selectedStudents.length}</strong> student(s)
            </span>
          ) : (
            <span className="text-gray-400">Select a course and students to proceed</span>
          )}
        </div>
        <button
          onClick={handleAssign}
          disabled={assigning || !selectedCourse || selectedStudents.length === 0}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-xl hover:opacity-90 shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {assigning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {assigning ? 'Assigning...' : `Assign to ${selectedStudents.length || 0} Students`}
        </button>
      </div>
    </CollegeAdminLayout>
  );
};

export default AssignCourseBatch;