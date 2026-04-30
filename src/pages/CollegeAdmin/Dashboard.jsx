// src/pages/CollegeAdmin/Dashboard.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Building2, Users, Briefcase, BookOpen, GraduationCap,
  UserCheck, RefreshCw, Eye, SquarePen, Plus,
  BarChart3, TrendingUp, Clock, CheckCircle2,
  ChevronRight, Settings, Bell, Zap, AlertCircle,
  Star, Target, Shield, ClipboardList, MapPin, Award
} from 'lucide-react';
import CollegeAdminLayout from '../../components/layout/CollegeAdminLayout';
import { DashboardSkeleton } from '../../components/common/SkeletonLoader';
import { collegeAdminAPI, collegeAdminCourseAPI, assessmentAPI } from '../../api/Api';

const fmt = (n) => {
  if (n === undefined || n === null) return '0';
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
};
const pct = (a, b) => (b > 0 ? Math.min(100, Math.round((a / b) * 100)) : 0);
const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return `${String(d.getDate()).padStart(2, '0')} ${d.toLocaleString('default', { month: 'short' })}, ${d.getFullYear()}`;
};

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 ${className}`}>
    {children}
  </div>
);

const SectionHeader = ({ title, action, onAction }) => (
  <div className="flex items-center justify-between mb-3">
    <h2 className="text-[15px] sm:text-[17px] md:text-[20px] font-black text-gray-900 tracking-tight">{title}</h2>
    {action && (
      <button onClick={onAction} className="text-[11px] font-black text-[#003399] flex items-center gap-0.5 px-2 py-1 rounded-lg hover:bg-slate-50 transition-colors uppercase tracking-tight">
        {action} <ChevronRight className="w-3 h-3" />
      </button>
    )}
  </div>
);

const MiniBar = ({ label, value, max, color, onClick }) => {
  const w = pct(value, max);
  return (
    <button onClick={onClick} className="group w-full text-left hover:bg-gray-50 px-2 py-1.5 rounded-xl transition-colors">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-600 font-medium truncate max-w-[130px] group-hover:text-[#003399]">{label}</span>
        <span className="text-xs font-black text-gray-800 ml-2">{fmt(value)}</span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(w, value > 0 ? 4 : 0)}%`, backgroundColor: color }} />
      </div>
    </button>
  );
};

const ActivityItem = ({ icon: Icon, color, title, sub, time }) => (
  <div className="flex items-start gap-2.5 py-2 border-b border-gray-50 last:border-0">
    <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 bg-gray-50 border border-gray-200">
      <Icon className="w-3 h-3" style={{ color: color?.includes('#') ? color : undefined }} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-semibold text-gray-800 leading-none">{title}</p>
      <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>
    </div>
    <span className="text-[9px] text-gray-300 flex-shrink-0 mt-0.5 font-mono">{time}</span>
  </div>
);

const CollegeAdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({});
  const [college, setCollege] = useState(null);
  const [recentJDs, setRecentJDs] = useState([]);
  const [recentCompanies, setRecentCompanies] = useState([]);
  const [courseCount, setCourseCount] = useState(0);
  const [assessmentCount, setAssessmentCount] = useState(0);
  const [jobsByCompany, setJobsByCompany] = useState({});
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      const [dashRes, collegeRes, companiesRes, coursesRes, assessRes, jobsRes] =
        await Promise.allSettled([
          collegeAdminAPI.getDashboard(),
          collegeAdminAPI.getMyCollegeProfile(),
          collegeAdminAPI.getCompanies({ limit: 50 }),
          collegeAdminCourseAPI.getAllCourses({ limit: 1 }),
          assessmentAPI.getAllAssessments({ limit: 1 }),
          collegeAdminAPI.getJobs({ limit: 500 }),
        ]);

      if (dashRes.status === 'fulfilled' && dashRes.value?.success) {
        setStats(dashRes.value.stats || {});
        setRecentJDs(dashRes.value.recentJDs || []);
      }
      if (collegeRes.status === 'fulfilled' && collegeRes.value?.success) {
        setCollege(collegeRes.value.college);
      }
      if (companiesRes.status === 'fulfilled' && companiesRes.value?.success) {
        const sorted = (companiesRes.value.companies || [])
          .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
          .slice(0, 8);
        setRecentCompanies(sorted);
      }
      if (coursesRes.status === 'fulfilled' && coursesRes.value?.success) {
        setCourseCount(coursesRes.value.count ?? coursesRes.value.total ?? (coursesRes.value.courses?.length ?? 0));
      }
      if (assessRes.status === 'fulfilled' && assessRes.value?.success) {
        setAssessmentCount(assessRes.value.count ?? assessRes.value.total ?? (assessRes.value.assessments?.length ?? 0));
      }
      if (jobsRes.status === 'fulfilled' && jobsRes.value?.success) {
        const jobs = jobsRes.value.jobs || [];
        const map = {};
        jobs.forEach(j => {
          const cid = typeof j.companyId === 'object' ? j.companyId?._id : j.companyId;
          if (cid) map[cid] = (map[cid] || 0) + 1;
        });
        setJobsByCompany(map);
      }
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const t = setInterval(fetchData, 30000);
    return () => clearInterval(t);
  }, [fetchData]);

  if (loading && !Object.keys(stats).length) return <DashboardSkeleton layout={CollegeAdminLayout} />;

  const placementRate = stats.placementPercentage ?? pct(stats.placedStudents ?? 0, stats.totalStudents ?? 0);
  const firstName = user?.fullName?.split(' ')[0] || user?.name?.split(' ')[0] || 'Admin';
  const collegeName = college?.name || user?.college?.name || 'Your College';

  const companiesRanked = [...recentCompanies]
    .map(c => ({ ...c, liveJobCount: jobsByCompany[c._id] ?? 0 }))
    .sort((a, b) => b.liveJobCount - a.liveJobCount);
  const maxJobs = Math.max(...companiesRanked.map(c => c.liveJobCount), 1);

  const activityFeed = [
    ...recentJDs.slice(0, 3).map((jd, i) => ({
      icon: Briefcase,
      color: 'bg-[#003399]/5 text-[#003399]',
      title: `${jd.jobTitle || jd.title || 'New JD'} posted`,
      sub: `${jd.companyId?.name || jd.company || 'Company'} · ${jd.status || 'Draft'}`,
      time: `${i + 1}d ago`,
    })),
    {
      icon: Users,
      color: 'bg-green-50 text-green-600',
      title: 'Student roster updated',
      sub: `${fmt(stats.totalStudents)} enrolled · ${fmt(stats.placedStudents)} placed`,
      time: 'recent',
    },
  ];

  return (
    <CollegeAdminLayout>
      <div className="px-6 py-4 md:px-8 md:py-6 space-y-5 font-sans">
        <div className="max-w-[1240px] mx-auto space-y-3 sm:space-y-4">

          {/* ═════════ MOBILE HERO (hidden on md+) ═════════ */}
          <div className="md:hidden">
            <Card className="p-3">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-12 h-12 rounded-full bg-[#003399]/10 border-2 border-[#003399]/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold text-[#003399]">{firstName[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-[15px] font-bold text-gray-900 leading-tight truncate">{collegeName}</h2>
                  <p className="text-[11px] text-gray-500 leading-snug mt-0.5 truncate">Welcome back, {firstName}</p>
                </div>
                <button onClick={fetchData} className="flex-shrink-0 w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-slate-50">
                  <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-1">
                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${placementRate}%`, background: placementRate >= 80 ? '#22c55e' : '#3b82f6' }} />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Placement Rate</span>
                <span className={`font-bold ${placementRate >= 80 ? 'text-green-600' : 'text-[#003399]'}`}>{placementRate}%</span>
              </div>
              <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center gap-3">
                <div className="flex gap-4 flex-1">
                  <div className="text-center">
                    <p className="text-[16px] font-bold text-gray-900">{fmt(stats.totalStudents)}</p>
                    <p className="text-[10px] text-gray-500">Students</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[16px] font-bold text-gray-900">{fmt(stats.totalCompanies)}</p>
                    <p className="text-[10px] text-gray-500">Companies</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* ═════════ SINGLE COLUMN FEED ═════════ */}
          <div className="space-y-4 sm:space-y-5">

            {/* Welcome Note */}
            <div className="mb-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2 h-8 bg-gradient-to-b from-[#003399] to-[#00A9CE] rounded-full inline-block flex-shrink-0" />
                Hi, <span className="text-[#003399]">Welcome {firstName}!</span>
              </h1>
              <p className="text-sm text-slate-400 mt-1 font-medium flex items-center gap-2">
                Here's what's happening on your campus recruitment portal today.
                <span className="text-[#00A9CE] font-mono text-[10px] hidden sm:inline-flex items-center font-bold">
                  <Clock className="w-3 h-3 mr-1" />
                  {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </p>
            </div>

            {/* ═════════ STATS ROW ═════════ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {[
                { icon: Users, label: 'Students', value: fmt(stats.totalStudents), color: 'navy' },
                { icon: UserCheck, label: 'Placed', value: fmt(stats.placedStudents), color: 'green' },
                { icon: Briefcase, label: 'Live JDs', value: fmt(stats.activeJDs), color: 'teal' },
                { icon: Building2, label: 'Companies', value: fmt(stats.totalCompanies), color: 'indigo' },
                { icon: BookOpen, label: 'Courses', value: fmt(courseCount), color: 'yellow', onClick: () => navigate('/dashboard/college-admin/courses') },
                { icon: ClipboardList, label: 'Assessments', value: fmt(assessmentCount), color: 'purple', onClick: () => navigate('/dashboard/college-admin/assessments') },
              ].map(({ icon: Icon, label, value, color, onClick }) => {
                const themes = {
                  navy:   { wrap: 'bg-[#003399]/5 text-[#003399] border-[#003399]/10', val: '#003399' },
                  teal:   { wrap: 'bg-[#00A9CE]/5 text-[#00A9CE] border-[#00A9CE]/10', val: '#00A9CE' },
                  green:  { wrap: 'bg-emerald-50 text-emerald-600 border-emerald-100', val: '#059669' },
                  yellow: { wrap: 'bg-amber-50 text-amber-600 border-amber-100', val: '#d97706' },
                  indigo: { wrap: 'bg-indigo-50 text-indigo-600 border-indigo-100', val: '#4338ca' },
                  purple: { wrap: 'bg-purple-50 text-purple-600 border-purple-100', val: '#7c3aed' },
                };
                const t = themes[color] || themes.navy;
                return (
                  <button key={label} onClick={onClick}
                    className={`group bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 text-left w-full flex items-center gap-4 ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${t.wrap} transition-transform group-hover:scale-110`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[28px] font-black leading-none mb-1" style={{ color: t.val }}>{value}</p>
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">{label}</p>
                    </div>
                  </button>
                );
              })}
            </div>



            {/* Fast Action Banner */}
            <div className="rounded-xl bg-gradient-to-r from-[#003399] to-[#00A9CE] p-5 md:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-[15px] md:text-[17px] font-bold text-white">Placement Drive Goals</h3>
                  <p className="text-[11px] md:text-[12px] text-white/70 mt-1 leading-relaxed max-w-md">
                    Current drive targets to place all eligible students. You have {fmt(stats.activeJDs)} active jobs driving engagement.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => navigate('/dashboard/college-admin/jobs/create')} className="inline-flex items-center gap-2 bg-white text-[#003399] font-black text-[12px] uppercase tracking-wider px-5 py-2.5 rounded-xl hover:bg-slate-50 transition-all shadow-sm active:scale-95">
                  Post New Job
                </button>
              </div>
            </div>

            {/* Placement Progress Bar */}
            <Card className="p-4 md:p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center border" style={{ backgroundColor: '#003399' + '15', borderColor: '#003399' + '30', color: '#003399' }}>
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-800 leading-none">Placement Rate</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5 font-bold uppercase tracking-tight">
                      {fmt(stats.placedStudents)} of {fmt(stats.totalStudents)} students placed
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[20px] font-black ${placementRate >= 80 ? 'text-green-600' : 'text-[#003399]'}`}>{placementRate}%</span>
                  <button onClick={fetchData} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-slate-50/30 transition-colors">
                    <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${placementRate}%`, background: placementRate >= 80 ? '#22c55e' : '#3b82f6' }} />
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </Card>

            {/* ═════════ LIST SECTIONS ═════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

              {/* Recent Companies */}
              <Card className="p-4">
                <SectionHeader title="Recent Companies" action="View All" onAction={() => navigate('/dashboard/college-admin/companies')} />
                {recentCompanies.length > 0 ? (
                  <div className="space-y-3">
                    {recentCompanies.slice(0, 5).map(company => (
                      <div key={company._id} onClick={() => navigate(`/dashboard/college-admin/companies/${company._id}`)} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer border border-transparent hover:border-gray-100 transition-all">
                        <div className="w-10 h-10 rounded-lg bg-[#003399]/5 text-[#003399] flex items-center justify-center text-[12px] font-bold flex-shrink-0">
                          {company.name?.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[13px] font-bold text-gray-900 truncate">{company.name}</h4>
                          <p className="text-[11px] text-gray-500 mt-0.5 truncate">{company.industry || 'No Industry'} · {company.location || company.headquarters?.city || 'HQ'}</p>
                        </div>
                        <div className="flex-shrink-0">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${company.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                            {company.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-[12px] text-gray-500">No companies registered yet</div>
                )}
              </Card>

              {/* Top Job Descriptions / Active */}
              <Card className="p-4">
                <SectionHeader title="Top Job Drives" action="All Jobs" onAction={() => navigate('/dashboard/college-admin/jobs')} />
                {recentJDs.length > 0 ? (
                  <div className="space-y-3">
                    {recentJDs.slice(0, 5).map((jd) => (
                      <MiniBar
                        key={jd._id}
                        label={`${jd.jobTitle || jd.title || 'Untitled'} - ${jd.companyId?.name || jd.company || ''}`}
                        value={jd.stats?.totalApplications ?? jd.matchedCount ?? 0}
                        max={Math.max(...recentJDs.map(j => j.stats?.totalApplications ?? j.matchedCount ?? 0), 1)}
                        color="#3b82f6"
                        onClick={() => navigate(`/dashboard/college-admin/jobs/view/${jd._id}`)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-[12px] text-gray-500 flex flex-col items-center">
                    <Briefcase className="w-8 h-8 text-gray-300 mb-2" />
                    No job drives running
                  </div>
                )}
              </Card>

            </div>

            {/* Placement Funnel & Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

              <Card className="p-4">
                <SectionHeader title="Placement Funnel" />
                {(() => {
                  const total = stats.totalStudents ?? 0;
                  const selected = stats.selectedStudents ?? stats.placedStudents ?? 0;
                  const placed = stats.placedStudents ?? 0;
                  const steps = [
                    { label: 'Enrolled', value: total, color: 'bg-[#003399]', text: 'text-[#003399]', w: 100 },
                    { label: 'Selected', value: selected, color: 'bg-cyan-500', text: 'text-cyan-700', w: total > 0 ? pct(selected, total) : 0 },
                    { label: 'Placed', value: placed, color: 'bg-emerald-500', text: 'text-emerald-700', w: total > 0 ? pct(placed, total) : 0 },
                  ];
                  return (
                    <div className="space-y-4 mt-2">
                      {steps.map(s => (
                        <div key={s.label}>
                          <div className="flex justify-between text-[12px] mb-1">
                            <span className="font-semibold text-gray-700">{s.label}</span>
                            <span className={`font-bold ${s.text}`}>{fmt(s.value)}</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-700 ${s.color}`} style={{ width: `${Math.max(s.w, s.value > 0 ? 5 : 0)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </Card>

              <Card className="p-4">
                <SectionHeader title="Recent Activity" />
                <div className="space-y-1">
                  {activityFeed.map((item, i) => <ActivityItem key={i} {...item} />)}
                </div>
              </Card>

            </div>

          </div>
        </div>
      </div>
    </CollegeAdminLayout>
  );
};

export default CollegeAdminDashboard;