// src/pages/CollegeAdmin/StudentManagement.jsx
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const StudentManagement = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [group, setGroup] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [subscriptionLimits, setSubscriptionLimits] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [newStudent, setNewStudent] = useState({
    fullName: '',
    email: '',
    rollNumber: '',
    password: 'temp123',
    role: 'student'
  });

  useEffect(() => {
    fetchGroupAndStudents();
  }, [groupId]);

  const fetchGroupAndStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch group details
      const groupResponse = await axios.get(`${API_URL}/groups/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGroup(groupResponse.data.data);
      setSubscriptionLimits(groupResponse.data.subscriptionLimits);

      // Fetch students
      const studentsResponse = await axios.get(`${API_URL}/groups/${groupId}/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(studentsResponse.data.data || []);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch data');
      setLoading(false);
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/groups/${groupId}/students`,
        newStudent,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setStudents([...students, response.data.data]);
      setShowAddModal(false);
      setNewStudent({ fullName: '', email: '', rollNumber: '', password: 'temp123', role: 'student' });
      alert('Student added successfully!');
      fetchGroupAndStudents(); // Refresh to get updated counts
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add student');
    }
  };

  const handleUpdateStudent = async (studentId, updatedData) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/groups/${groupId}/students/${studentId}`,
        updatedData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setStudents(students.map(s => s._id === studentId ? { ...s, ...updatedData } : s));
      setEditingId(null);
      alert('Student updated successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update student');
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/groups/${groupId}/students/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setStudents(students.filter(s => s._id !== studentId));
      alert('Student deleted successfully');
      fetchGroupAndStudents();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete student');
    }
  };

  const handleExcelImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/groups/${groupId}/students/import`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      alert(response.data.message);
      fetchGroupAndStudents();
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to import students');
    }
  };

  const handleExcelExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/groups/${groupId}/students/export`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Students_${group?.groupId}_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to export students');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/groups/${groupId}/students/template`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Student_Template_${group?.groupId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to download template');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const canAddMore = group && group.studentCount < group.maxStudents;
  const usagePercent = group ? (group.studentCount / group.maxStudents) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/college-admin/groups')}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{group?.name}</h1>
                <p className="text-gray-600 mt-1">Group ID: {group?.groupId}</p>
              </div>
            </div>
          </div>

          {/* Capacity Warning */}
          {usagePercent >= 90 && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-red-800 font-medium">
                  Group capacity at {Math.round(usagePercent)}%. 
                  {!canAddMore && ' Maximum capacity reached. Please upgrade your subscription to add more students.'}
                </span>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Total Students</div>
              <div className="text-2xl font-bold text-blue-600">{group?.studentCount || 0}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Max Capacity</div>
              <div className="text-2xl font-bold text-green-600">{group?.maxStudents || 0}</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Available Slots</div>
              <div className="text-2xl font-bold text-purple-600">
                {(group?.maxStudents || 0) - (group?.studentCount || 0)}
              </div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Batch</div>
              <div className="text-2xl font-bold text-orange-600">{group?.batch}</div>
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              disabled={!canAddMore}
              className={`px-4 py-2 rounded-lg transition font-medium ${
                canAddMore
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              + Add Student
            </button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleExcelImport}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={!canAddMore}
              className={`px-4 py-2 rounded-lg transition font-medium ${
                canAddMore
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              📤 Import Excel
            </button>

            <button
              onClick={handleExcelExport}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
            >
              📥 Export Excel
            </button>

            <button
              onClick={handleDownloadTemplate}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
            >
              📋 Download Template
            </button>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    S.No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Roll No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student, index) => (
                  <tr key={student._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === student._id ? (
                        <input
                          type="text"
                          defaultValue={student.fullName}
                          onBlur={(e) => handleUpdateStudent(student._id, { fullName: e.target.value })}
                          className="px-2 py-1 border border-gray-300 rounded"
                        />
                      ) : (
                        <div className="text-sm font-medium text-gray-900">{student.fullName}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{student.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === student._id ? (
                        <input
                          type="text"
                          defaultValue={student.studentInfo?.rollNumber}
                          onBlur={(e) => handleUpdateStudent(student._id, { rollNumber: e.target.value })}
                          className="px-2 py-1 border border-gray-300 rounded"
                        />
                      ) : (
                        <div className="text-sm text-gray-900">{student.studentInfo?.rollNumber || 'N/A'}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        student.role === 'staff' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {student.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => setEditingId(editingId === student._id ? null : student._id)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        {editingId === student._id ? 'Save' : 'Edit'}
                      </button>
                      <button
                        onClick={() => handleDeleteStudent(student._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {students.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No students found. Add your first student to get started!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-6">Add Student</h2>
            <form onSubmit={handleAddStudent}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newStudent.fullName}
                    onChange={(e) => setNewStudent({ ...newStudent, fullName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={newStudent.email}
                    onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number *</label>
                  <input
                    type="text"
                    required
                    value={newStudent.rollNumber}
                    onChange={(e) => setNewStudent({ ...newStudent, rollNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="2024001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <input
                    type="text"
                    required
                    value={newStudent.password}
                    onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="temp123"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={newStudent.role}
                    onChange={(e) => setNewStudent({ ...newStudent, role: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="student">Student</option>
                    <option value="staff">Staff</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;