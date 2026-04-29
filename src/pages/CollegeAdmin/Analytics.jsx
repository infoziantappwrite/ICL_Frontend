// src/pages/CollegeAdmin/Analytics.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, Users, Briefcase, FileText, Building2, Award,
  BarChart3, Target, GraduationCap, DollarSign, RefreshCw,
  ChevronRight, Star,
} from 'lucide-react';
import CollegeAdminLayout from '../../components/layout/CollegeAdminLayout';
import { AnalyticsSkeleton } from '../../components/common/SkeletonLoader';
import { collegeAdminAPI, jobAPI, applicationAPI } from '../../api/Api';

const fmt = (n) => {
  if (n === undefined || n === null) return '0';
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
};
const pct = (a, b) => (b > 0 ? Math.min(100, Math.round((a / b) * 100)) : 0);

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-lg shadow-sm border border-slate-100 ${className}`}>
    {children}
  </div>
);

const SectionHeader = ({ title, action, onAction }) => (
  <div className="flex items-center justify-between mb-3 border-b border-gray-50 pb-2">
    <h2 className="text-[15px] sm:text-[17px] md:text-[20px] font-bold text-gray-900">{title}</h2>
    {action && (
      <button onClick={onAction} className="text-[12px] font-semibold text-[#003399] hover:text-[#003399] flex items-center gap-1">
        {action} <ChevronRight className="w-3 h-3" />
      </button>
    )}
  </div>
);

const MiniBar = ({ label, value, max, sub, color }) => {
  const w = pct(value, max);
  return (
    <div className="px-2 py-1.5 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-gray-100 mb-1">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[12px] text-gray-700 font-medium truncate max-w-[160px]">{label}</span>
        <span className="text-[12px] font-bold text-gray-900 ml-2">{sub || fmt(value)}</span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(w, value > 0 ? 4 : 0)}%`, background: color }} />
      </div>
    </div>
  );
};

const Pill = ({ icon: Icon, label, value, color }) => {
  const c = {
    blue:   'bg-[#003399]/5 text-[#003399] border-transparent',
    cyan:   'bg-cyan-50 text-cyan-700 border-transparent',
    indigo: 'bg-indigo-50 text-indigo-700 border-transparent',
    violet: 'bg-violet-50 text-violet-700 border-transparent',
    green:  'bg-emerald-50 text-emerald-700 border-transparent',
    amber:  'bg-amber-50 text-amber-700 border-transparent',
  }[color] || 'bg-gray-50 text-gray-700 border-transparent';
  return (
    <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${c} w-full`}>
      <Icon className="w-5 h-5 flex-shrink-0 opacity-80" />
      <div className="min-w-0 flex-1">
        <p className="text-[16px] font-black leading-none">{typeof value === 'string' ? value : fmt(value)}</p>
        <p className="text-[11px] font-medium opacity-70 mt-1 leading-none truncate">{label}</p>
      </div>
    </div>
  );
};

const StatusBadge = ({ count, label, dotColor, bg, textColor, borderColor }) => (
  <div className={`text-center p-3 ${bg} rounded-xl border ${borderColor}`}>
    <p className={`text-[20px] font-black ${textColor} leading-none`}>{count}</p>
    <div className="flex items-center justify-center gap-1 mt-1.5">
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <p className="text-[10px] font-bold text-gray-600">{label}</p>
    </div>
  </div>
);

const Analytics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('all');

  const [overviewStats, setOverviewStats] = useState({
    totalStudents: 0, totalCompanies: 0, totalJDs: 0, activeJDs: 0,
    totalApplications: 0, selectedStudents: 0, placedStudents: 0, placementPercentage: 0,
  });
  const [jobStats, setJobStats] = useState({ active: 0, closed: 0, draft: 0, cancelled: 0 });
  const [applicationStats, setApplicationStats] = useState({ pending: 0, shortlisted: 0, selected: 0, rejected: 0 });
  const [branchStats, setBranchStats] = useState([]);
  const [companyStats, setCompanyStats] = useState([]);
  const [packageStats, setPackageStats] = useState({ avgPackage: 0, maxPackage: 0, minPackage: 0 });

  const fetchAllData = async () => {
    try {
      setRefreshing(true);
      const [dashboardData, analyticsData, jobsData, applicationsData] = await Promise.all([
        collegeAdminAPI.getDashboard().catch(() => ({ success: false })),
        collegeAdminAPI.getAnalytics().catch(() => ({ success: false })),
        jobAPI.getAllJobs().catch(() => ({ success: false, jobs: [] })),
        applicationAPI.getAllApplications().catch(() => ({ success: false, applications: [] })),
      ]);

      if (dashboardData.success && dashboardData.stats) setOverviewStats(dashboardData.stats);

      if (jobsData.success && jobsData.jobs) {
        const jobs = jobsData.jobs;
        setJobStats({
          active:    jobs.filter(j => j.status === 'Active').length,
          closed:    jobs.filter(j => j.status === 'Closed').length,
          draft:     jobs.filter(j => j.status === 'Draft').length,
          cancelled: jobs.filter(j => j.status === 'Cancelled').length,
        });
      }

      if (applicationsData.success && applicationsData.applications) {
        const apps = applicationsData.applications;
        setApplicationStats({
          pending:     apps.filter(a => a.status === 'Pending' || a.status === 'Applied').length,
          shortlisted: apps.filter(a => a.status === 'Shortlisted').length,
          selected:    apps.filter(a => a.status === 'Selected').length,
          rejected:    apps.filter(a => a.status === 'Rejected').length,
        });
      }

      if (analyticsData.success) {
        if (analyticsData.branchStats)  setBranchStats(analyticsData.branchStats);
        if (analyticsData.companyStats) setCompanyStats(analyticsData.companyStats);
        if (analyticsData.packageStats) setPackageStats(analyticsData.packageStats);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchAllData(); }, [timeRange]);

  if (loading) return <AnalyticsSkeleton layout={CollegeAdminLayout} />;

  const placementRate = overviewStats.placementPercentage ?? pct(overviewStats.placedStudents ?? 0, overviewStats.totalStudents ?? 0);
  const maxCompany = Math.max(...companyStats.map(c => c.studentsHired || 0), 1);
  const totalApps = applicationStats.pending + applicationStats.shortlisted + applicationStats.selected + applicationStats.rejected;

  return (
    <CollegeAdminLayout>
      <div className="px-6 py-4 md:px-8 md:py-6 space-y-5 font-sans">
        <div className="max-w-[1240px] mx-auto space-y-3 sm:space-y-4">

          {/* ═════════ HEADER AND FILTERS ═════════ */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2 h-8 bg-gradient-to-b from-[#003399] to-[#00A9CE] rounded-full inline-block flex-shrink-0" />
                Placement <span className="text-[#003399]">Analytics</span>
              </h1>
              <p className="text-sm text-slate-400 mt-1 font-medium">
                Data-driven insights into your college's recruitment performance.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-2 bg-white text-gray-700 text-[13px] border border-gray-200 rounded-lg font-semibold focus:outline-none shadow-sm"
              >
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="year">Last Year</option>
                <option value="all">All Time</option>
              </select>
              <button onClick={fetchAllData} disabled={refreshing} className="flex items-center gap-1.5 bg-[#003399] hover:bg-[#003399] text-white text-[13px] font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm disabled:opacity-50">
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>
          </div>

          {/* ═════════ STATS PILLS ═════════ */}
          <Card className="p-3 sm:p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              <Pill icon={Users} label="Students" value={overviewStats.totalStudents} color="blue" />
              <Pill icon={Award} label="Placed" value={overviewStats.placedStudents} color="green" />
              <Pill icon={Building2} label="Companies" value={overviewStats.totalCompanies} color="cyan" />
              <Pill icon={Briefcase} label="Total JDs" value={overviewStats.totalJDs} color="indigo" />
              <Pill icon={TrendingUp} label="Active JDs" value={overviewStats.activeJDs} color="violet" />
              <Pill icon={FileText} label="Applications" value={overviewStats.totalApplications} color="blue" />
              <Pill icon={Target} label="Placed %" value={`${placementRate}%`} color="amber" />
              <Pill icon={DollarSign} label="Avg Package" value={packageStats.avgPackage > 0 ? `₹${packageStats.avgPackage.toFixed(1)}L` : '—'} color="cyan" />
            </div>
          </Card>

          {/* ═════════ MAIN GRID ═════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 md:gap-5">

            {/* ── LEFT (8 cols) ── */}
            <div className="lg:col-span-8 flex flex-col gap-4">

              {/* Placement Overview */}
              <Card className="p-4 md:p-5">
                <SectionHeader title="Placement Overview" />
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                  <div className="bg-gray-50 rounded-xl p-4 border border-slate-100">
                    <p className="text-[20px] md:text-[24px] font-black text-[#003399] leading-none">{placementRate}%</p>
                    <p className="text-[12px] font-bold text-gray-700 mt-2">Placement Rate</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">Overall success</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 border border-slate-100">
                    <p className="text-[20px] md:text-[24px] font-black text-emerald-600 leading-none">{fmt(overviewStats.placedStudents)}</p>
                    <p className="text-[12px] font-bold text-gray-700 mt-2">Students Placed</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">of {fmt(overviewStats.totalStudents)} total</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 border border-slate-100">
                    <p className="text-[20px] md:text-[24px] font-black text-cyan-600 leading-none">{packageStats.avgPackage > 0 ? `₹${packageStats.avgPackage.toFixed(1)}L` : '—'}</p>
                    <p className="text-[12px] font-bold text-gray-700 mt-2">Avg Package</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{packageStats.maxPackage > 0 ? `Max ₹${packageStats.maxPackage.toFixed(1)}L` : 'No data'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 border border-slate-100">
                    <p className="text-[20px] md:text-[24px] font-black text-indigo-600 leading-none">{fmt(overviewStats.selectedStudents ?? 0)}</p>
                    <p className="text-[12px] font-bold text-gray-700 mt-2">Selected Students</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">Offers received</p>
                  </div>
                </div>
              </Card>

              {/* Status Breakdown Grid (Jobs & Apps) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Job Statistics */}
                <Card className="p-4 md:p-5">
                  <SectionHeader title="Job Statistics" />
                  <div className="grid grid-cols-2 gap-3 mb-4 mt-2">
                    <StatusBadge count={jobStats.active} label="Active" dotColor="bg-[#003399]" bg="bg-white" textColor="text-gray-900" borderColor="border-gray-100 shadow-sm" />
                    <StatusBadge count={jobStats.closed} label="Closed" dotColor="bg-gray-400" bg="bg-white" textColor="text-gray-900" borderColor="border-gray-100 shadow-sm" />
                  </div>
                  <div className="space-y-1">
                    {[
                      { label: 'Active', value: jobStats.active, color: '#3b82f6' },
                      { label: 'Draft', value: jobStats.draft, color: '#f59e0b' },
                      { label: 'Closed', value: jobStats.closed, color: '#9ca3af' },
                      { label: 'Cancelled', value: jobStats.cancelled, color: '#ef4444' },
                    ].map(item => (
                      <MiniBar key={item.label} label={item.label} value={item.value} max={Math.max(jobStats.active + jobStats.draft + jobStats.closed + jobStats.cancelled, 1)} color={item.color} />
                    ))}
                  </div>
                </Card>

                {/* Application Status */}
                <Card className="p-4 md:p-5">
                  <SectionHeader title="Application Status" action="View All" onAction={() => navigate('/dashboard/college-admin/applications')} />
                  <div className="grid grid-cols-2 gap-3 mb-4 mt-2">
                    <StatusBadge count={applicationStats.pending} label="Pending" dotColor="bg-amber-400" bg="bg-white" textColor="text-gray-900" borderColor="border-gray-100 shadow-sm" />
                    <StatusBadge count={applicationStats.selected} label="Selected" dotColor="bg-green-500" bg="bg-white" textColor="text-gray-900" borderColor="border-gray-100 shadow-sm" />
                  </div>
                  {totalApps > 0 && (
                    <div className="space-y-1">
                      {[
                        { label: 'Pending', value: applicationStats.pending, color: '#f59e0b' },
                        { label: 'Shortlisted', value: applicationStats.shortlisted, color: '#3b82f6' },
                        { label: 'Selected', value: applicationStats.selected, color: '#10b981' },
                        { label: 'Rejected', value: applicationStats.rejected, color: '#ef4444' },
                      ].map(item => (
                        <MiniBar key={item.label} label={item.label} value={item.value} max={totalApps} color={item.color} sub={`${item.value} (${pct(item.value, totalApps)}%)`} />
                      ))}
                    </div>
                  )}
                </Card>
              </div>

              {/* Branch-wise Placement & Package Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4 md:p-5">
                  <SectionHeader title="Branch-wise Placement" />
                  {branchStats.length > 0 ? (
                    <div className="space-y-1 mt-2">
                      {branchStats.map((branch, index) => (
                        <MiniBar key={index} label={branch.branch || branch._id || 'N/A'} value={branch.placed || 0} max={Math.max(branch.total || 0, 1)} color="#3b82f6" sub={`${branch.placed || 0}/${branch.total || 0} (${Math.round(branch.placementPercentage || 0)}%)`} />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400">
                      <GraduationCap className="w-8 h-8 mb-2 opacity-50" />
                      <p className="text-[12px]">No branch data yet</p>
                    </div>
                  )}
                </Card>

                {packageStats.maxPackage > 0 ? (
                  <Card className="p-4 md:p-5">
                    <SectionHeader title="Package Stats (CTC)" />
                    <div className="grid grid-cols-1 gap-3 mt-2">
                      <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm flex items-center justify-between">
                        <div>
                          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Highest</p>
                          <p className="text-[18px] font-black text-green-600 mt-1">₹{packageStats.maxPackage.toFixed(1)}L</p>
                        </div>
                        <DollarSign className="w-6 h-6 text-green-200" />
                      </div>
                      <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm flex items-center justify-between">
                        <div>
                          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Average</p>
                          <p className="text-[18px] font-black text-[#003399] mt-1">₹{packageStats.avgPackage.toFixed(1)}L</p>
                        </div>
                        <TrendingUp className="w-6 h-6 text-white/60" />
                      </div>
                      <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm flex items-center justify-between">
                        <div>
                          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Lowest</p>
                          <p className="text-[18px] font-black text-amber-600 mt-1">₹{packageStats.minPackage.toFixed(1)}L</p>
                        </div>
                        <Target className="w-6 h-6 text-amber-200" />
                      </div>
                    </div>
                  </Card>
                ) : (
                  <Card className="p-4 md:p-5 flex flex-col items-center justify-center text-slate-400">
                    <DollarSign className="w-8 h-8 mb-2 opacity-50" />
                    <p className="text-[12px]">No package data available</p>
                  </Card>
                )}
              </div>

            </div>

            {/* ── RIGHT (4 cols) ── */}
            <div className="lg:col-span-4 flex flex-col gap-4">

              {/* Donut Snapshot */}
              <Card className="p-4 md:p-5">
                <SectionHeader title="Snapshot" />
                <div className="flex items-center gap-4 mb-5 mt-2">
                  <div className="relative w-20 h-20 flex-shrink-0">
                    <svg viewBox="0 0 36 36" className="w-20 h-20 transform -rotate-90">
                      <circle cx="18" cy="18" r="15.9" stroke="#f1f5f9" strokeWidth="3.5" fill="none" />
                      <circle cx="18" cy="18" r="15.9" stroke="#3b82f6" strokeWidth="3.5" fill="none" strokeDasharray={`${placementRate} ${100 - placementRate}`} strokeLinecap="round" className="transition-all duration-1000" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[16px] font-black text-gray-900">{placementRate}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Placement Rate</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{fmt(overviewStats.placedStudents)} out of {fmt(overviewStats.totalStudents)} placed</p>
                  </div>
                </div>
                <div className="space-y-0 text-[13px]">
                  {[
                    { label: 'Total Students', value: overviewStats.totalStudents, col: 'text-[#003399]' },
                    { label: 'Placed Students', value: overviewStats.placedStudents, col: 'text-emerald-600' },
                    { label: 'Selected Students', value: overviewStats.selectedStudents ?? 0, col: 'text-cyan-600' },
                    { label: 'Total Companies', value: overviewStats.totalCompanies, col: 'text-indigo-600' },
                    { label: 'Total JDs', value: overviewStats.totalJDs, col: 'text-violet-600' },
                    { label: 'Total Applications', value: overviewStats.totalApplications, col: 'text-gray-900' },
                  ].map(({ label, value, col }) => (
                    <div key={label} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                      <span className="text-gray-600">{label}</span>
                      <span className={`font-bold ${col}`}>{fmt(value)}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Top Companies */}
              <Card className="p-4 md:p-5">
                <SectionHeader title="Top Hiring Companies" action="View All" onAction={() => navigate('/dashboard/college-admin/companies')} />
                {companyStats.length > 0 ? (
                  <div className="space-y-2 mt-2">
                    {companyStats.slice(0, 6).map((comp, idx) => {
                      const count = comp.studentsHired || 0;
                      return (
                        <div key={idx} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50/30 transition-colors border border-transparent hover:border-gray-100">
                          <span className="text-[13px] font-black text-gray-300 w-4 pl-1">{idx < 3 ? ['🥇', '🥈', '🥉'][idx] : `#${idx + 1}`}</span>
                          <div className="w-8 h-8 rounded-lg bg-[#003399]/5 text-[#003399] flex items-center justify-center text-[10px] font-black flex-shrink-0">
                            {(comp.companyName || comp._id || 'C').substring(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-bold text-gray-900 truncate">{comp.companyName || comp._id}</p>
                            <div className="w-full bg-gray-100 h-1.5 rounded-full mt-1.5">
                              <div className="h-full bg-[#003399] rounded-full" style={{ width: `${pct(count, maxCompany)}%` }} />
                            </div>
                          </div>
                          <span className="text-[12px] font-bold text-gray-900">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                    <Building2 className="w-8 h-8 mb-2 opacity-50" />
                    <p className="text-[12px]">No hiring data yet</p>
                  </div>
                )}
              </Card>

              {/* Quick Actions (Replacing Placement Goals CTA inside right col) */}
              <Card className="p-4 md:p-5">
                <SectionHeader title="Quick Actions" />
                <div className="grid grid-cols-1 gap-2 mt-2">
                  <button onClick={() => navigate('/dashboard/college-admin/jobs')} className="w-full px-4 py-3 bg-[#003399]/5 hover:bg-slate-100 text-[#003399] text-[13px] font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                    <Briefcase className="w-4 h-4" /> Manage Job Drives
                  </button>
                  <button onClick={() => navigate('/dashboard/college-admin/applications')} className="w-full px-4 py-3 bg-white hover:bg-slate-50 border border-gray-200 text-gray-700 text-[13px] font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                    <FileText className="w-4 h-4" /> Review Applications
                  </button>
                </div>
              </Card>

            </div>

          </div>
        </div>
      </div>
    </CollegeAdminLayout>
  );
};

export default Analytics;