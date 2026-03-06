// pages/CollegeAdmin/Courses/AssignCourseBatch.jsx
// Admin: Assign a course to a batch/group of students
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send, BookOpen, Users, Search, CheckCircle2, ChevronLeft,
  AlertCircle, RefreshCw, X, CheckSquare, Square
} from 'lucide-react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
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

  useEffect(() => {
    fetchData();
  }, []);

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
    <DashboardLayout title="Assign Course to Batch">
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-medium ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <button
        onClick={() => navigate('/dashboard/college-admin/courses')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> Back to Courses
      </button>

      <div className="mb-6">
        <div className="relative bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 rounded-3xl p-8 shadow-2xl overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute w-64 h-64 bg-white rounded-full -top-20 -right-20" />
          </div>
          <div className="relative text-white">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center">
                <Send className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Assign Course to Batch</h1>
                <p className="text-blue-100 text-sm">Select a course and students to enroll them</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Selection */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-500" />
            Select Course
          </h3>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {courses.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No active courses found</p>
            ) : courses.map(c => (
              <button
                key={c._id}
                onClick={() => setSelectedCourse(c._id)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  selectedCourse === c._id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-100 hover:border-blue-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedCourse === c._id ? 'bg-blue-500' : 'bg-gray-100'}`}>
                    {selectedCourse === c._id ? <CheckCircle2 className="w-4 h-4 text-white" /> : <BookOpen className="w-4 h-4 text-gray-400" />}
                  </div>
                  <div>
                    <p className={`font-semibold text-sm ${selectedCourse === c._id ? 'text-blue-700' : 'text-gray-800'}`}>{c.title}</p>
                    <p className="text-xs text-gray-400">{c.category} • {c.level} • {c.enrollmentCount || 0} enrolled</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Student Selection */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-500" />
              Select Students
              {selectedStudents.length > 0 && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">{selectedStudents.length} selected</span>
              )}
            </h3>
            <button onClick={selectAll} className="text-xs text-blue-600 font-medium hover:text-blue-700">
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

          <div className="space-y-1.5 max-h-72 overflow-y-auto">
            {filteredStudents.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No students found</p>
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
                      {s.studentInfo?.rollNumber && <span>{s.studentInfo.rollNumber} • </span>}
                      {s.studentInfo?.branch || s.email}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Assign Button */}
      <div className="mt-6 flex items-center justify-between bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="text-sm text-gray-600">
          {selectedCourse && selectedStudents.length > 0
            ? `Ready to assign course to ${selectedStudents.length} student(s)`
            : 'Select a course and students to proceed'}
        </div>
        <button
          onClick={handleAssign}
          disabled={assigning || !selectedCourse || selectedStudents.length === 0}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-cyan-700 shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {assigning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {assigning ? 'Assigning...' : `Assign to ${selectedStudents.length || 0} Students`}
        </button>
      </div>
    </DashboardLayout>
  );
};

export default AssignCourseBatch;