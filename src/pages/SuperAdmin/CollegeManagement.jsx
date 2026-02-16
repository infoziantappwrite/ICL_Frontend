// pages/SuperAdmin/CollegeManagement.jsx - College Management Page
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Filter,
  MapPin,
  Users,
  Briefcase,
  GraduationCap,
  CheckCircle,
  XCircle,
  RefreshCw,
  Clock,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const CollegeManagement = () => {
  const navigate = useNavigate();
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalColleges, setTotalColleges] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    fetchColleges();
  }, [currentPage, searchTerm, filterStatus]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchColleges();
    }, 30000);

    return () => clearInterval(interval);
  }, [currentPage, searchTerm, filterStatus]);

  const fetchColleges = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...(searchTerm && { search: searchTerm }),
        ...(filterStatus !== 'all' && { isActive: filterStatus === 'active' }),
      });

      const response = await fetch(
        `http://localhost:5000/api/super-admin/colleges?${params}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      if (data.success) {
        setColleges(data.colleges || []);
        setTotalPages(data.totalPages || 1);
        setTotalColleges(data.total || 0);
        setLastUpdated(new Date());
      } else {
        console.error('Failed to fetch colleges:', data.message);
      }
    } catch (error) {
      console.error('Error fetching colleges:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCollege = async (collegeId, collegeName) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${collegeName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/super-admin/colleges/${collegeId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
        }
      );
      const data = await response.json();

      if (data.success) {
        alert('College deleted successfully');
        fetchColleges();
      } else {
        alert(data.message || 'Failed to delete college');
      }
    } catch (error) {
      console.error('Error deleting college:', error);
      alert('Error deleting college');
    }
  };

  const handleToggleStatus = async (collegeId, currentStatus, collegeName) => {
    const action = currentStatus ? 'deactivate' : 'activate';
    if (
      !window.confirm(
        `Are you sure you want to ${action} "${collegeName}"?`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/super-admin/colleges/${collegeId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ isActive: !currentStatus }),
        }
      );
      const data = await response.json();

      if (data.success) {
        alert(`College ${action}d successfully`);
        fetchColleges();
      } else {
        alert(data.message || `Failed to ${action} college`);
      }
    } catch (error) {
      console.error(`Error ${action}ing college:`, error);
      alert(`Error ${action}ing college`);
    }
  };

  if (loading && colleges.length === 0) {
    return (
      <LoadingSpinner
        message="Loading Colleges..."
        submessage="Fetching college data"
      />
    );
  }

  return (
    <DashboardLayout title="College Management">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <div className="relative bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 rounded-3xl p-8 shadow-2xl shadow-blue-500/30 overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full -ml-32 -mb-32"></div>
          </div>
          
          <div className="relative flex items-center justify-between">
            <div className="text-white">
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <Building2 className="w-8 h-8" />
                College Management
              </h1>
              <p className="text-blue-100 text-lg">
                Manage all colleges registered on the platform
              </p>
              <p className="text-blue-200 text-sm mt-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            </div>
            <button
              onClick={() => navigate('/dashboard/super-admin/colleges/new')}
              className="hidden md:flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              Add New College
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Total Colleges</p>
              <p className="text-3xl font-bold text-blue-600">{totalColleges}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Active Colleges</p>
              <p className="text-3xl font-bold text-green-600">
                {colleges.filter((c) => c.isActive).length}
              </p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Total Students</p>
              <p className="text-3xl font-bold text-purple-600">
                {colleges.reduce((sum, c) => sum + (c.stats?.totalStudents || 0), 0)}
              </p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Users className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Total Companies</p>
              <p className="text-3xl font-bold text-orange-600">
                {colleges.reduce((sum, c) => sum + (c.stats?.totalCompanies || 0), 0)}
              </p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Briefcase className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search colleges by name or code..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filter */}
          <div className="flex gap-3">
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <button
              onClick={fetchColleges}
              className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Add Button */}
      <button
        onClick={() => navigate('/dashboard/super-admin/colleges/new')}
        className="md:hidden fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all z-50 hover:scale-110"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Colleges Table */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          {colleges.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-50 via-cyan-50 to-blue-50 border-b border-gray-200">
                <tr>
                  {['College', 'Code', 'Location', 'Students', 'Companies', 'Status', 'Actions'].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {colleges.map((college) => (
                  <tr key={college._id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg">
                          {college.code.substring(0, 2)}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{college.name}</div>
                          <div className="text-sm text-gray-500">{college.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 text-xs font-bold bg-blue-100 text-blue-700 rounded-full">
                        {college.code}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-700">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">
                          {college.address?.city}, {college.address?.state}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-purple-500" />
                        <span className="font-medium text-gray-900">
                          {college.stats?.totalStudents || 0}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-orange-500" />
                        <span className="font-medium text-gray-900">
                          {college.stats?.totalCompanies || 0}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(college._id, college.isActive, college.name)}
                        className={`px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1 w-fit cursor-pointer transition-all hover:scale-105 ${
                          college.isActive
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        {college.isActive ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        {college.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            navigate(`/dashboard/super-admin/colleges/${college._id}`)
                          }
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            navigate(`/dashboard/super-admin/colleges/${college._id}/edit`)
                          }
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCollege(college._id, college.name)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-16">
              <Building2 className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-xl font-medium">No colleges found</p>
              <p className="text-gray-400 text-sm mt-2">
                {searchTerm
                  ? 'Try adjusting your search criteria'
                  : 'Start by adding a new college to the platform'}
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentPage === 1
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentPage === totalPages
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </DashboardLayout>
  );
};

export default CollegeManagement;