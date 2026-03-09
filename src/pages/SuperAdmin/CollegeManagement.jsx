import { useToast } from '../../context/ToastContext';
// pages/SuperAdmin/CollegeManagement.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiCall from '../../api/Api';
import {
  Building2, Plus, Search, Eye, SquarePen, Trash2, MapPin,
  Users, Briefcase, CircleCheck, RefreshCw, Clock, FileText,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';

/* ─── Reusable toggle — uses inline-flex so transform is always relative to track start ─── */
const Toggle = ({ checked, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    title={checked ? 'Click to deactivate' : 'Click to activate'}
    className={`relative inline-flex items-center w-9 h-5 rounded-full flex-shrink-0
      transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
      ${checked
        ? 'bg-gradient-to-r from-blue-500 to-cyan-400'
        : 'bg-gray-300 hover:bg-gray-400'}`}
  >
    <span
      className={`inline-block w-4 h-4 bg-white rounded-full shadow-sm
        transform transition-transform duration-200
        ${checked ? 'translate-x-[18px]' : 'translate-x-[2px]'}`}
    />
  </button>
);

/* ─── Stat card ─── */
const StatCard = ({ label, value, icon: Icon, gradient, valueColor }) => (
  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-white/60 flex items-center justify-between">
    <div>
      <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-black ${valueColor ?? 'text-gray-900'}`}>{value}</p>
    </div>
    <div className={`w-11 h-11 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-md flex-shrink-0`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
  </div>
);

const CollegeManagement = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalColleges, setTotalColleges] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchColleges = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...(searchTerm && { search: searchTerm }),
        ...(filterStatus !== 'all' && { isActive: filterStatus === 'active' }),
        sort: '-createdAt',
      });
      const data = await apiCall(`/super-admin/colleges?${params}`);
      if (data.success) {
        setColleges(data.colleges || []);
        setTotalPages(data.totalPages || 1);
        setTotalColleges(data.total || 0);
        setLastUpdated(new Date());
      } else {
        toast.error('Error', data.message || 'Failed to fetch colleges');
      }
    } catch {
      toast.error('Error', 'Error fetching colleges');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, filterStatus]);

  useEffect(() => { fetchColleges(); }, [fetchColleges]);
  useEffect(() => {
    const interval = setInterval(fetchColleges, 30000);
    return () => clearInterval(interval);
  }, [fetchColleges]);

  const handleDeleteCollege = async (collegeId) => {
    try {
      const data = await apiCall(`/super-admin/colleges/${collegeId}`, { method: 'DELETE' });
      if (data.success) {
        toast.success('Deleted', 'College deleted successfully');
        setColleges(prev => prev.filter(c => c._id !== collegeId));
        setTotalColleges(prev => prev - 1);
      } else {
        toast.error('Error', data.message || 'Failed to delete college');
      }
    } catch {
      toast.error('Error', 'Error deleting college');
    }
  };

  const handleToggleStatus = async (collegeId, currentStatus, collegeName) => {
    const action = currentStatus ? 'deactivate' : 'activate';
    try {
      const data = await apiCall(`/super-admin/colleges/${collegeId}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      if (data.success) {
        toast.success('Updated', `${collegeName} ${action}d`);
        setColleges(prev =>
          prev.map(c => c._id === collegeId ? { ...c, isActive: !currentStatus } : c)
        );
      } else {
        toast.error('Error', data.message || `Failed to ${action}`);
      }
    } catch {
      toast.error('Error', `Error ${action}ing college`);
    }
  };

  const totalStudents  = colleges.reduce((s, c) => s + (c.liveCounts?.studentsCount  || 0), 0);
  const totalCompanies = colleges.reduce((s, c) => s + (c.liveCounts?.companiesCount || 0), 0);
  const activeCount    = colleges.filter(c => c.isActive).length;

  if (loading && colleges.length === 0) {
    return <LoadingSpinner message="Loading Colleges..." submessage="Fetching college data" />;
  }

  return (
    <DashboardLayout title="College Management">

      {/* ── Banner ── */}
      <div className="mb-6">
        <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 rounded-2xl p-6 shadow-xl overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute w-56 h-56 bg-white rounded-full -top-16 -right-16" />
            <div className="absolute w-40 h-40 bg-white rounded-full -bottom-12 -left-12" />
          </div>
          <div className="relative flex items-center justify-between flex-wrap gap-4">
            <div className="text-white">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <h1 className="text-xl font-bold">College Management</h1>
              </div>
              <p className="text-blue-100 text-sm">Manage all colleges registered on the platform</p>
              <p className="text-blue-200 text-xs mt-1 flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                Updated {lastUpdated.toLocaleTimeString()}
              </p>
            </div>
            <button
              onClick={() => navigate('/dashboard/super-admin/colleges/new')}
              className="flex items-center gap-2 bg-white text-blue-600 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-50 transition-all shadow-md hover:shadow-lg hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              Add College
            </button>
          </div>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Colleges"  value={totalColleges} icon={Building2}    gradient="from-blue-600 to-blue-700"    valueColor="text-gray-900" />
        <StatCard label="Active"          value={activeCount}   icon={CircleCheck}  gradient="from-blue-500 to-cyan-500"    valueColor="text-blue-600" />
        <StatCard label="Total Students"  value={totalStudents} icon={Users}        gradient="from-blue-600 to-indigo-600"  valueColor="text-indigo-600" />
        <StatCard label="Companies"       value={totalCompanies}icon={Briefcase}    gradient="from-cyan-500 to-blue-500"    valueColor="text-cyan-700" />
      </div>

      {/* ── Search & filter ── */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm p-4 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search colleges by name or code..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <button
              onClick={fetchColleges}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl hover:opacity-90 disabled:opacity-60 transition-all shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {colleges.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-100">
                  {['College', 'Code', 'Location', 'Students', 'Companies', 'JDs', 'Admins', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {colleges.map(college => {
                  const lc = college.liveCounts || {};
                  return (
                    <tr key={college._id} className="hover:bg-blue-50/40 transition-colors">

                      {/* College */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-sm flex-shrink-0">
                            {college.code.substring(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-gray-900 truncate max-w-[160px]">{college.name}</div>
                            <div className="text-xs text-gray-400 truncate max-w-[160px]">{college.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Code */}
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 text-xs font-bold bg-blue-100 text-blue-700 rounded-lg">
                          {college.code}
                        </span>
                      </td>

                      {/* Location */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-gray-600 text-xs">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <span>{college.address?.city}, {college.address?.state}</span>
                        </div>
                      </td>

                      {/* Students */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => navigate(`/dashboard/super-admin/colleges/${college._id}/students`)}
                          className="flex items-center gap-1.5 group"
                          title="View students"
                        >
                          <Users className="w-3.5 h-3.5 text-blue-400 group-hover:text-blue-600" />
                          <span className="font-semibold text-gray-900 group-hover:text-blue-600">{lc.studentsCount ?? 0}</span>
                        </button>
                      </td>

                      {/* Companies */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-cyan-500" />
                          <span className="font-semibold text-gray-900">{lc.companiesCount ?? 0}</span>
                        </div>
                      </td>

                      {/* JDs */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-blue-400" />
                          <span className="font-semibold text-gray-900">{lc.jdsCount ?? 0}</span>
                        </div>
                      </td>

                      {/* Admins */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-indigo-400" />
                          <span className="font-semibold text-gray-900">{lc.adminsCount ?? 0}</span>
                        </div>
                      </td>

                      {/* Status toggle */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Toggle
                            checked={college.isActive}
                            onToggle={() => handleToggleStatus(college._id, college.isActive, college.name)}
                          />
                          <span className={`text-xs font-semibold ${college.isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                            {college.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => navigate(`/dashboard/super-admin/colleges/${college._id}`)}
                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => navigate(`/dashboard/super-admin/colleges/${college._id}/edit`)}
                            className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <SquarePen className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCollege(college._id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-16">
              <Building2 className="w-14 h-14 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No colleges found</p>
              <p className="text-gray-400 text-sm mt-1">
                {searchTerm ? 'Try adjusting your search' : 'Start by adding a new college'}
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between text-sm">
            <span className="text-gray-500">Page {currentPage} of {totalPages} · {totalColleges} total</span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-gray-200 text-gray-600 disabled:opacity-40 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-gray-200 text-gray-600 disabled:opacity-40 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile FAB */}
      <button
        onClick={() => navigate('/dashboard/super-admin/colleges/new')}
        className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-full shadow-xl z-50 flex items-center justify-center hover:scale-110 transition-all"
      >
        <Plus className="w-6 h-6" />
      </button>
    </DashboardLayout>
  );
};

export default CollegeManagement;