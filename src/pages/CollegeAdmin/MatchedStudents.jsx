// src/pages/CollegeAdmin/MatchedStudents.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Target, Users, CheckCircle, XCircle, Star,
  Search, Download, TrendingUp, BookOpen, GraduationCap,
  Filter, ChevronDown, ChevronUp, Award, Briefcase, X,
} from 'lucide-react';
import CollegeAdminLayout from '../../components/layout/CollegeAdminLayout';
import { TableSkeleton } from '../../components/common/SkeletonLoader';
import { jobAPI } from '../../api/Api';

const fmt = (n) => {
  if (n === undefined || n === null) return '0';
  return String(n);
};
const pct = (a, b) => (b > 0 ? Math.min(100, Math.round((a / b) * 100)) : 0);

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 ${className}`}>
    {children}
  </div>
);

const MatchCircle = ({ pct: p }) => {
  const color = p >= 80 ? '#22c55e' : p >= 60 ? '#f59e0b' : p >= 40 ? '#3b82f6' : '#ef4444';
  const size = 40, r = 16, circ = 2 * Math.PI * r;
  const offset = circ - (p / 100) * circ;
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth="3" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="3"
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central"
        fill={color} fontSize="10" fontWeight="800"
        style={{ transform: 'rotate(90deg)', transformOrigin: `${size / 2}px ${size / 2}px` }}>
        {p}%
      </text>
    </svg>
  );
};

const ScoreBar = ({ label, value, max, color }) => (
  <div className="flex items-center gap-2 text-[11px]">
    <span className="w-[60px] text-gray-500 font-semibold shrink-0">{label}</span>
    <div className="flex-1 bg-gray-100 rounded-full h-2">
      <div className={`h-2 rounded-full ${color}`}
        style={{ width: `${Math.min((value / max) * 100, 100)}%`, transition: 'width 0.5s ease' }} />
    </div>
    <span className="w-[30px] text-right font-black text-gray-700">{value}/{max}</span>
  </div>
);

const StudentRow = ({ student, rank }) => {
  const [expanded, setExpanded] = useState(false);
  const p = student.matchPercentage;
  const badgeCls = p >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : p >= 60 ? 'bg-amber-50 text-amber-700 border-amber-200' : p >= 40 ? 'bg-[#003399]/5 text-[#003399] border-[#003399]/20' : 'bg-red-50 text-red-600 border-red-200';
  const badgeLabel = p >= 80 ? 'Excellent' : p >= 60 ? 'Good' : p >= 40 ? 'Fair' : 'Low';
  const bd = student.breakdown || {};

  return (
    <>
      <tr className={`hover:bg-slate-50/30 transition-colors border-b border-slate-50 ${rank <= 3 ? 'bg-[#fffdf5]' : 'bg-white'} group`}>
        <td className="px-5 py-4 text-xs font-bold text-slate-400">
          {rank <= 3 ? (
            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-[12px] font-black ${['bg-amber-100 text-amber-700', 'bg-gray-200 text-gray-700', 'bg-amber-50 text-amber-900'][rank - 1]}`}>
              #{rank}
            </span>
          ) : (
            String(rank).padStart(2, '0')
          )}
        </td>
        <td className="px-5 py-4">
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-800 truncate w-full group-hover:text-[#003399] transition-colors">{student.fullName}</p>
            <p className="text-[10px] text-slate-400 truncate w-full">{student.email}</p>
          </div>
        </td>
        <td className="px-5 py-4">
          <p className="text-xs font-bold text-slate-700">{student.studentInfo?.branch || '—'}</p>
          <p className="text-[10px] text-slate-400 font-medium">Batch: {student.studentInfo?.batch || '—'}</p>
        </td>
        <td className="px-5 py-4 text-center">
          <span className="text-xs font-black text-slate-700">{student.studentInfo?.cgpa ?? '—'}</span>
        </td>
        <td className="px-5 py-4">
          <div className="flex flex-wrap gap-1 max-w-[200px]">
            {(student.matchedSkills || []).slice(0, 3).map(s => (
              <span key={s} className="px-2 py-0.5 bg-[#003399]/5 text-[#003399] text-[9px] rounded-md border border-[#003399]/10 font-black uppercase tracking-wider">{s}</span>
            ))}
            {(student.matchedSkills || []).length > 3 && (
              <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] rounded-md font-bold">+{student.matchedSkills.length - 3}</span>
            )}
            {!student.matchedSkills?.length && <span className="text-[12px] text-slate-400">—</span>}
          </div>
        </td>
        <td className="px-5 py-4 text-center">
          {student.isEligible ? <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto" /> : <XCircle className="w-5 h-5 text-red-500 mx-auto" />}
        </td>
        <td className="px-5 py-4">
          <div className="flex items-center gap-2">
            <MatchCircle pct={p} />
            <span className={`px-2 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg border ${badgeCls}`}>{badgeLabel}</span>
          </div>
        </td>
        <td className="px-5 py-4 text-center">
          <button onClick={() => setExpanded(!expanded)} className="p-1.5 text-slate-400 hover:text-[#003399] hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-[#003399]/10">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </td>
      </tr>

      {expanded && (
        <tr className="bg-slate-50/50">
          <td colSpan={8} className="px-5 py-6">
            <div className="ml-10 max-w-4xl bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-5">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Score Breakdown</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                  <ScoreBar label="Skills" value={Math.round(bd.skills || 0)} max={30} color="bg-[#003399]" />
                  <ScoreBar label="Branch" value={Math.round(bd.branch || 0)} max={25} color="bg-cyan-500" />
                  <ScoreBar label="CGPA" value={Math.round(bd.cgpa || 0)} max={20} color="bg-indigo-500" />
                  <ScoreBar label="Batch" value={Math.round(bd.batch || 0)} max={15} color="bg-sky-500" />
                  <ScoreBar label="Hygiene" value={Math.round(bd.hygiene || 0)} max={10} color="bg-teal-500" />
                </div>
              </div>
              
              {student.skills?.length > 0 && (
                <div className="pt-5 border-t border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Student's Full Skillset</p>
                  <div className="flex flex-wrap gap-1.5">
                    {student.skills.map(s => (
                      <span key={s} className={`px-2.5 py-1 text-[10px] rounded-lg font-black uppercase tracking-wider border ${
                        (student.matchedSkills || []).includes(s) ? 'bg-[#003399]/5 text-[#003399] border-[#003399]/10' : 'bg-slate-50 text-slate-500 border-slate-100'
                      }`}>{s}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-5 text-[11px] font-bold text-slate-400 pt-5 border-t border-slate-100">
                {student.studentInfo?.rollNumber && <span>Roll No: <b className="text-slate-800 font-mono tracking-tight">{student.studentInfo.rollNumber}</b></span>}
                <span>Active Backlogs: <b className="text-red-600">{student.studentInfo?.activeBacklogs ?? 0}</b></span>
                <span>Already Placed: <b className={student.studentInfo?.isPlaced ? 'text-emerald-600' : 'text-slate-800'}>{student.studentInfo?.isPlaced ? 'Yes' : 'No'}</b></span>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

const MatchedStudents = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState(null);
  const [allStudents, setAllStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEligible, setFilterEligible] = useState('all');
  const [filterMinPct, setFilterMinPct] = useState(0);
  const [error, setError] = useState('');
  const [summaryStats, setSummaryStats] = useState({ total: 0, eligible: 0, avg: 0, above70: 0 });

  useEffect(() => { if (jobId) loadData(); }, [jobId]);

  const loadData = async () => {
    try {
      setLoading(true); setError('');
      const [jobRes, matchRes] = await Promise.all([jobAPI.getJobById(jobId), jobAPI.getMatchedStudents(jobId)]);
      if (jobRes.success) setJob(jobRes.job);
      if (matchRes.success) {
        const s = matchRes.matchedStudents || [];
        setAllStudents(s);
        setSummaryStats({
          total: s.length,
          eligible: s.filter(x => x.isEligible).length,
          avg: s.length ? Math.round(s.reduce((a, x) => a + x.matchPercentage, 0) / s.length) : 0,
          above70: s.filter(x => x.matchPercentage >= 70).length,
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to load matched students');
    } finally {
      setLoading(false);
    }
  };

  const filtered = allStudents.filter(s => {
    const matchSearch = !searchTerm ||
      s.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentInfo?.branch?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentInfo?.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchElig = filterEligible === 'all' ? true : filterEligible === 'eligible' ? s.isEligible : !s.isEligible;
    return matchSearch && matchElig && s.matchPercentage >= filterMinPct;
  });

  const handleExportCSV = () => {
    const rows = [
      ['Rank', 'Name', 'Email', 'Branch', 'Batch', 'CGPA', 'Match%', 'Eligible', 'Matched Skills'],
      ...filtered.map((s, i) => [
        i + 1, s.fullName, s.email,
        s.studentInfo?.branch || '', s.studentInfo?.batch || '', s.studentInfo?.cgpa || '',
        s.matchPercentage, s.isEligible ? 'Yes' : 'No',
        (s.matchedSkills || []).join('; '),
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `matched-students-${job?.jobCode || jobId}.csv`;
    a.click();
  };

  if (loading) return <TableSkeleton layout={CollegeAdminLayout} />;

  const companyName = typeof job?.companyId === 'object' ? job?.companyId?.name : '—';

  return (
    <CollegeAdminLayout>
      <div className="px-6 py-4 md:px-8 md:py-6 space-y-5 font-sans">
        <div className="max-w-[1240px] mx-auto space-y-3 sm:space-y-4">

          <button onClick={() => navigate('/dashboard/college-admin/jobs')} className="flex items-center gap-1.5 text-slate-400 hover:text-[#003399] transition-colors text-xs font-bold mb-2 w-max">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Jobs
          </button>

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2 h-8 bg-gradient-to-b from-[#003399] to-[#00A9CE] rounded-full inline-block flex-shrink-0" />
                Skill Match <span className="text-[#003399]">Analysis</span>
              </h1>
              {job && (
                <p className="text-[12px] md:text-[14px] text-slate-400 mt-1 uppercase tracking-wider font-bold">
                  {job.jobTitle} • {companyName} • {job.jobCode}
                </p>
              )}
            </div>
            <button onClick={handleExportCSV} className="inline-flex items-center gap-1.5 bg-white border border-slate-100 text-slate-500 hover:border-[#003399]/30 hover:text-[#003399] text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>

          {/* Stats Pills */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
            {[
              { label: 'Total Students', value: summaryStats.total,    bg: 'bg-[#003399]/5',    tc: 'text-[#003399]',   Icon: Users },
              { label: 'Eligible',       value: summaryStats.eligible, bg: 'bg-emerald-50', tc: 'text-emerald-700',Icon: CheckCircle },
              { label: 'Avg Match %',    value: `${summaryStats.avg}%`,bg: 'bg-indigo-50',  tc: 'text-indigo-700', Icon: TrendingUp },
              { label: 'High Score (≥70%)',value: summaryStats.above70,cg: 'bg-cyan-50',    tc: 'text-cyan-700',   bg: 'bg-cyan-50', Icon: Award },
            ].map(({ label, value, bg, tc, Icon }) => (
              <Card key={label} className="p-4 flex items-center justify-between border-slate-100 shadow-sm">
                <div>
                  <p className="text-[12px] font-bold text-gray-500 mb-0.5">{label}</p>
                  <p className={`text-[24px] font-black ${tc} leading-none`}>{value}</p>
                </div>
                <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${tc}`} />
                </div>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            {job?.preferredSkills?.length > 0 && (
              <Card className="p-5 md:col-span-2 border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-4 h-4 text-amber-500" />
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Required Skills from JD</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {job.preferredSkills.map(s => (
                    <span key={s} className="px-3 py-1 bg-amber-50 text-amber-700 text-[11px] rounded-lg font-black border border-amber-100 uppercase tracking-wider">{s}</span>
                  ))}
                </div>
              </Card>
            )}
            {job && (
              <Card className="p-5 md:col-span-1 border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Filter className="w-4 h-4 text-[#00A9CE]" />
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Eligibility Filters</p>
                </div>
                <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-wider">
                  <span className="px-3 py-1.5 bg-slate-50 text-slate-700 rounded-lg border border-slate-100">Min CGPA: {job.eligibility?.minCGPA || 0}</span>
                  <span className="px-3 py-1.5 bg-slate-50 text-slate-700 rounded-lg border border-slate-100">Branches: {(job.eligibility?.branches || []).join(', ') || 'All'}</span>
                </div>
              </Card>
            )}
          </div>

          {/* Table Panel */}
          <Card className="flex flex-col overflow-hidden border-slate-100 shadow-sm">
            <div className="p-4 border-b border-slate-100 bg-white flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Search by name, email, branch..."
                  value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-8 py-2.5 text-xs font-bold border border-slate-100 rounded-xl focus:outline-none focus:border-[#003399]/30 bg-white" />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-gray-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <select value={filterEligible} onChange={e => setFilterEligible(e.target.value)}
                  className="px-4 py-2.5 text-xs font-bold border border-slate-100 rounded-xl focus:outline-none focus:border-[#003399]/30 bg-white appearance-none cursor-pointer min-w-[140px]">
                  <option value="all">All Students</option>
                  <option value="eligible">Eligible Only</option>
                  <option value="ineligible">Ineligible Only</option>
                </select>
                <select value={filterMinPct} onChange={e => setFilterMinPct(Number(e.target.value))}
                  className="px-4 py-2.5 text-xs font-bold border border-slate-100 rounded-xl focus:outline-none focus:border-[#003399]/30 bg-white appearance-none cursor-pointer min-w-[160px]">
                  <option value={0}>Min Score 0%</option>
                  <option value={40}>Min Score 40%+</option>
                  <option value={60}>Min Score 60%+</option>
                  <option value={70}>Min Score 70%+</option>
                  <option value={80}>Min Score 80%+</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto min-h-[300px]">
              {filtered.length > 0 ? (
                <table className="w-full table-fixed">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-[60px]">Rank</th>
                      <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-[220px]">Student</th>
                      <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-[140px]">Branch/Batch</th>
                      <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-[80px]">CGPA</th>
                      <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-[200px]">Matched Skills</th>
                      <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-[100px]">Eligible</th>
                      <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-[150px]">Match %</th>
                      <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-[80px]">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((student, i) => (
                      <StudentRow key={student._id} student={student} rank={i + 1} />
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex flex-col items-center justify-center py-20">
                  <GraduationCap className="w-12 h-12 text-slate-200 mb-3" />
                  <p className="text-sm font-black text-slate-800 tracking-tight">No students match filters</p>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 rounded-b-xl flex flex-col sm:flex-row justify-between items-center gap-3">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Showing <b className="text-slate-700">{filtered.length}</b> of <b className="text-slate-700">{allStudents.length}</b></p>
              <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#003399]" /> Skills 30%</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-500" /> Branch 25%</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> CGPA 20%</span>
              </div>
            </div>
          </Card>
          
        </div>
      </div>
    </CollegeAdminLayout>
  );
};

export default MatchedStudents;