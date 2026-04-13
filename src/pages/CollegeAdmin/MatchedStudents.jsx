// src/pages/CollegeAdmin/MatchedStudents.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Target, Users, CheckCircle, XCircle, Star,
  Search, Download, TrendingUp, BookOpen, GraduationCap,
  Filter, ChevronDown, ChevronUp, Award, Briefcase,
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
  <div className={`bg-white rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-100 ${className}`}>
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
  const badgeCls = p >= 80 ? 'bg-emerald-50 text-emerald-700' : p >= 60 ? 'bg-amber-50 text-amber-700' : p >= 40 ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-600';
  const badgeLabel = p >= 80 ? 'Excellent' : p >= 60 ? 'Good' : p >= 40 ? 'Fair' : 'Low';
  const bd = student.breakdown || {};

  return (
    <>
      <tr className={`hover:bg-gray-50/50 transition-colors border-b border-gray-50 ${rank <= 3 ? 'bg-[#fffdf5]' : 'bg-white'} group`}>
        <td className="px-5 py-3 text-center w-10">
          {rank <= 3 ? (
            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-sm text-[12px] font-black ${['bg-amber-100 text-amber-700', 'bg-gray-200 text-gray-700', 'bg-amber-50 text-amber-900'][rank - 1]}`}>
              #{rank}
            </span>
          ) : (
            <span className="text-[12px] text-gray-400 font-bold">#{rank}</span>
          )}
        </td>
        <td className="px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-black text-[13px] shrink-0">
              {student.fullName?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="text-[13px] font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{student.fullName}</p>
              <p className="text-[11px] text-gray-500">{student.email}</p>
            </div>
          </div>
        </td>
        <td className="px-5 py-3">
          <p className="text-[12px] font-bold text-gray-800">{student.studentInfo?.branch || '—'}</p>
          <p className="text-[10px] text-gray-500">Batch: {student.studentInfo?.batch || '—'}</p>
        </td>
        <td className="px-5 py-3 text-center">
          <span className="text-[13px] font-black text-gray-800">{student.studentInfo?.cgpa ?? '—'}</span>
        </td>
        <td className="px-5 py-3">
          <div className="flex flex-wrap gap-1 max-w-[200px]">
            {(student.matchedSkills || []).slice(0, 3).map(s => (
              <span key={s} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] rounded border border-transparent font-semibold">{s}</span>
            ))}
            {(student.matchedSkills || []).length > 3 && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded font-semibold">+{student.matchedSkills.length - 3}</span>
            )}
            {!student.matchedSkills?.length && <span className="text-[12px] text-gray-400">—</span>}
          </div>
        </td>
        <td className="px-5 py-3 text-center">
          {student.isEligible ? <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto" /> : <XCircle className="w-5 h-5 text-red-500 mx-auto" />}
        </td>
        <td className="px-5 py-3">
          <div className="flex items-center gap-2">
            <MatchCircle pct={p} />
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${badgeCls}`}>{badgeLabel}</span>
          </div>
        </td>
        <td className="px-5 py-3 text-center">
          <button onClick={() => setExpanded(!expanded)} className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors border border-transparent hover:border-blue-100">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </td>
      </tr>

      {expanded && (
        <tr className="bg-gray-50/50">
          <td colSpan={8} className="px-5 py-4 border-b border-gray-100">
            <div className="ml-14 max-w-4xl bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">Score Breakdown</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-3 mb-4">
                <ScoreBar label="Skills" value={Math.round(bd.skills || 0)} max={30} color="bg-blue-500" />
                <ScoreBar label="Branch" value={Math.round(bd.branch || 0)} max={25} color="bg-cyan-500" />
                <ScoreBar label="CGPA" value={Math.round(bd.cgpa || 0)} max={20} color="bg-indigo-500" />
                <ScoreBar label="Batch" value={Math.round(bd.batch || 0)} max={15} color="bg-sky-500" />
                <ScoreBar label="Hygiene" value={Math.round(bd.hygiene || 0)} max={10} color="bg-teal-500" />
              </div>
              
              {student.skills?.length > 0 && (
                <div className="pt-3 border-t border-gray-100 mb-3">
                  <p className="text-[10px] font-bold text-gray-500 mb-2">Student's Full Skillset</p>
                  <div className="flex flex-wrap gap-1.5">
                    {student.skills.map(s => (
                      <span key={s} className={`px-2 py-1 text-[10px] rounded font-bold ${
                        (student.matchedSkills || []).includes(s) ? 'bg-cyan-50 text-cyan-700 border border-transparent' : 'bg-gray-100 text-gray-600'
                      }`}>{s}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-4 text-[11px] text-gray-500 pt-3 border-t border-gray-100">
                {student.studentInfo?.rollNumber && <span>Roll No: <b className="text-gray-900">{student.studentInfo.rollNumber}</b></span>}
                <span>Active Backlogs: <b className="text-red-600">{student.studentInfo?.activeBacklogs ?? 0}</b></span>
                <span>Total Backlogs: <b className="text-gray-900">{student.studentInfo?.totalBacklogs ?? 0}</b></span>
                <span>Already Placed: <b className={student.studentInfo?.isPlaced ? 'text-emerald-600' : 'text-gray-900'}>{student.studentInfo?.isPlaced ? 'Yes' : 'No'}</b></span>
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
      <div className="min-h-screen bg-[#f0f4f8] px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4">
        <div className="max-w-[1240px] mx-auto space-y-3 sm:space-y-4">

          <button onClick={() => navigate('/dashboard/college-admin/jobs')} className="flex items-center gap-1.5 text-gray-500 hover:text-blue-600 transition-colors text-[13px] font-bold mb-2 w-max">
            <ArrowLeft className="w-4 h-4" /> Back to Jobs
          </button>

          {/* ═════════ HEADER ═════════ */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
            <div>
              <h1 className="text-[20px] md:text-[26px] font-bold text-gray-900 tracking-tight">
                Skill Match <span className="text-blue-600">Analysis</span>
              </h1>
              {job && (
                <p className="text-[12px] md:text-[14px] text-gray-500 mt-1 uppercase tracking-wider font-semibold">
                  {job.jobTitle} • {companyName} • {job.jobCode}
                </p>
              )}
            </div>
            <button onClick={handleExportCSV} className="bg-white border border-gray-200 text-blue-700 font-bold text-[13px] px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors shadow-sm flex flex-shrink-0 items-center justify-center gap-1.5">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>

          {/* Error display */}
          {error && (
            <Card className="px-4 py-3 bg-red-50 border-red-100 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500 shrink-0" />
              <span className="text-[13px] font-semibold text-red-700">{error}</span>
            </Card>
          )}

          {/* ═════════ STATS PILLS ═════════ */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
            {[
              { label: 'Total Students', value: summaryStats.total,    bg: 'bg-blue-50',    tc: 'text-blue-700',   Icon: Users },
              { label: 'Eligible',       value: summaryStats.eligible, bg: 'bg-emerald-50', tc: 'text-emerald-700',Icon: CheckCircle },
              { label: 'Avg Match %',    value: `${summaryStats.avg}%`,bg: 'bg-indigo-50',  tc: 'text-indigo-700', Icon: TrendingUp },
              { label: 'High Score (≥70%)',value: summaryStats.above70,cg: 'bg-cyan-50',    tc: 'text-cyan-700',   bg: 'bg-cyan-50', Icon: Award },
            ].map(({ label, value, bg, tc, Icon }) => (
              <Card key={label} className="p-4 flex items-center justify-between">
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
            {/* Preferred Skills */}
            {job?.preferredSkills?.length > 0 && (
              <Card className="p-4 md:col-span-2">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-4 h-4 text-amber-500" />
                  <p className="text-[13px] font-bold text-gray-900">Required Skills from JD</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {job.preferredSkills.map(s => (
                    <span key={s} className="px-2.5 py-1 bg-amber-50 text-amber-700 text-[11px] rounded font-bold">{s}</span>
                  ))}
                </div>
              </Card>
            )}

            {/* Eligibility Criteria */}
            {job && (
              <Card className="p-4 md:col-span-1">
                <div className="flex items-center gap-2 mb-3">
                  <Filter className="w-4 h-4 text-blue-500" />
                  <p className="text-[13px] font-bold text-gray-900">Eligibility Filters</p>
                </div>
                <div className="flex flex-wrap gap-2 text-[11px]">
                  <span className="px-3 py-1 bg-gray-50 text-gray-700 rounded font-bold border border-gray-100">Min CGPA: {job.eligibility?.minCGPA || 0}</span>
                  <span className="px-3 py-1 bg-gray-50 text-gray-700 rounded font-bold border border-gray-100">Branches: {(job.eligibility?.branches || []).join(', ') || 'All'}</span>
                </div>
              </Card>
            )}
          </div>

          {/* ═════════ TABLE & CONTROLS ═════════ */}
          <Card className="flex flex-col overflow-hidden">
            
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-100 bg-white flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search by name, email, branch..."
                  value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-shadow" />
              </div>
              <div className="flex items-center gap-2">
                <select value={filterEligible} onChange={e => setFilterEligible(e.target.value)}
                  className="px-4 py-2.5 text-[13px] font-bold text-gray-700 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm cursor-pointer bg-white">
                  <option value="all">All Students</option>
                  <option value="eligible">Eligible Only</option>
                  <option value="ineligible">Ineligible Only</option>
                </select>
                <select value={filterMinPct} onChange={e => setFilterMinPct(Number(e.target.value))}
                  className="px-4 py-2.5 text-[13px] font-bold text-gray-700 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm cursor-pointer bg-white">
                  <option value={0}>Min Score 0% (All)</option>
                  <option value={40}>Min Score 40%+</option>
                  <option value={60}>Min Score 60%+</option>
                  <option value={70}>Min Score 70%+</option>
                  <option value={80}>Min Score 80%+</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto min-h-[300px]">
              {filtered.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {['#', 'Student', 'Branch/Batch', 'CGPA', 'Matched Skills', 'Eligible', 'Match %', ''].map(h => (
                        <th key={h} className="px-5 py-3 text-[11px] font-black text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {filtered.map((student, i) => (
                      <StudentRow key={student._id} student={student} rank={i + 1} />
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex flex-col items-center justify-center py-20">
                  <GraduationCap className="w-12 h-12 text-gray-300 mb-3" />
                  <p className="text-[15px] font-bold text-gray-900 mb-1">
                    {allStudents.length === 0 ? 'No matched students' : 'No students match filters'}
                  </p>
                  <p className="text-[13px] text-gray-500">
                    {allStudents.length === 0 ? 'Ensure students are registered in the system.' : 'Try adjusting the search query or minimum score.'}
                  </p>
                </div>
              )}
            </div>
            
            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 rounded-b-xl flex justify-between items-center text-[11px] font-bold text-gray-500">
              <p>Showing {filtered.length} of {allStudents.length} students</p>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> Skills 30%</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block" /> Branch 25%</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" /> CGPA 20%</span>
              </div>
            </div>
          </Card>
          
        </div>
      </div>
    </CollegeAdminLayout>
  );
};

export default MatchedStudents;