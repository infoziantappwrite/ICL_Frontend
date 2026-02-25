// pages/CollegeAdmin/MatchedStudents.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Target, Users, CheckCircle, XCircle, Star,
  Search, Download, TrendingUp, BookOpen, GraduationCap,
  Filter, ChevronDown, ChevronUp, Award,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { jobAPI } from '../../api/Api';

// ─── Circular match % ring ─────────────────────────────────────────────────────
const MatchCircle = ({ pct }) => {
  const color = pct >= 80 ? '#22c55e' : pct >= 60 ? '#f59e0b' : pct >= 40 ? '#3b82f6' : '#ef4444';
  const size = 52, r = 22, circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth="4"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="4"
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}/>
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central"
        fill={color} fontSize="10" fontWeight="700"
        style={{ transform: 'rotate(90deg)', transformOrigin: `${size/2}px ${size/2}px` }}>
        {pct}%
      </text>
    </svg>
  );
};

// ─── Score breakdown bar ───────────────────────────────────────────────────────
const ScoreBar = ({ label, value, max, color }) => (
  <div className="flex items-center gap-2 text-xs">
    <span className="w-16 text-gray-500 shrink-0">{label}</span>
    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
      <div className={`h-1.5 rounded-full ${color}`}
        style={{ width: `${Math.min((value/max)*100, 100)}%`, transition: 'width 0.5s ease' }} />
    </div>
    <span className="w-8 text-right font-medium text-gray-700">{value}/{max}</span>
  </div>
);

// ─── Student Row ──────────────────────────────────────────────────────────────
const StudentRow = ({ student, rank }) => {
  const [expanded, setExpanded] = useState(false);
  const pct = student.matchPercentage;
  const badgeColor =
    pct >= 80 ? 'bg-green-100 text-green-700' :
    pct >= 60 ? 'bg-yellow-100 text-yellow-700' :
    pct >= 40 ? 'bg-blue-100 text-blue-700' :
                'bg-red-100 text-red-700';
  const bd = student.breakdown || {};

  return (
    <>
      <tr className={`hover:bg-blue-50/40 transition-colors ${rank <= 3 ? 'bg-gradient-to-r from-yellow-50/40 to-transparent' : ''}`}>
        {/* Rank */}
        <td className="px-4 py-3 text-center">
          {rank <= 3 ? (
            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold
              ${['bg-yellow-400 text-white','bg-gray-300 text-gray-700','bg-amber-600 text-white'][rank-1]}`}>
              {rank}
            </span>
          ) : (
            <span className="text-sm text-gray-400 font-medium">#{rank}</span>
          )}
        </td>

        {/* Student */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white font-semibold text-sm shrink-0 shadow-md shadow-blue-500/30">
              {student.fullName?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{student.fullName}</p>
              <p className="text-xs text-gray-400">{student.email}</p>
            </div>
          </div>
        </td>

        {/* Branch / Batch */}
        <td className="px-4 py-3">
          <p className="font-medium text-gray-800 text-sm">{student.studentInfo?.branch || '—'}</p>
          <p className="text-xs text-gray-500">Batch: {student.studentInfo?.batch || '—'}</p>
        </td>

        {/* CGPA */}
        <td className="px-4 py-3 text-center">
          <span className="text-sm font-bold text-gray-800">{student.studentInfo?.cgpa ?? '—'}</span>
        </td>

        {/* Matched Skills */}
        <td className="px-4 py-3">
          <div className="flex flex-wrap gap-1 max-w-[200px]">
            {(student.matchedSkills || []).slice(0, 4).map(s => (
              <span key={s} className="px-2 py-0.5 bg-cyan-100 text-cyan-700 text-xs rounded-full font-medium">{s}</span>
            ))}
            {(student.matchedSkills || []).length > 4 && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                +{student.matchedSkills.length - 4}
              </span>
            )}
            {(!student.matchedSkills?.length) && (
              <span className="text-xs text-gray-400 italic">—</span>
            )}
          </div>
        </td>

        {/* Eligible */}
        <td className="px-4 py-3 text-center">
          {student.isEligible
            ? <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
            : <XCircle className="w-5 h-5 text-red-400 mx-auto" />}
        </td>

        {/* Match % */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <MatchCircle pct={pct} />
            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${badgeColor}`}>
              {pct >= 80 ? 'Excellent' : pct >= 60 ? 'Good' : pct >= 40 ? 'Fair' : 'Low'}
            </span>
          </div>
        </td>

        {/* Expand toggle */}
        <td className="px-4 py-3 text-center">
          <button onClick={() => setExpanded(!expanded)}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </td>
      </tr>

      {/* Expanded breakdown */}
      {expanded && (
        <tr>
          <td colSpan={8} className="px-4 pb-4 bg-gradient-to-r from-blue-50/50 to-cyan-50/30">
            <div className="ml-14 p-4 bg-white/80 backdrop-blur-xl rounded-xl border border-white/50 shadow-sm">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Score Breakdown</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                <ScoreBar label="Skills"  value={Math.round(bd.skills  || 0)} max={30} color="bg-blue-500"    />
                <ScoreBar label="Branch"  value={Math.round(bd.branch  || 0)} max={25} color="bg-cyan-500"    />
                <ScoreBar label="CGPA"    value={Math.round(bd.cgpa    || 0)} max={20} color="bg-indigo-500"  />
                <ScoreBar label="Batch"   value={Math.round(bd.batch   || 0)} max={15} color="bg-sky-500"     />
                <ScoreBar label="Hygiene" value={Math.round(bd.hygiene || 0)} max={10} color="bg-teal-500"    />
              </div>

              {/* All student skills */}
              {student.skills?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 mb-2">All Student Skills</p>
                  <div className="flex flex-wrap gap-1">
                    {student.skills.map(s => (
                      <span key={s} className={`px-2 py-0.5 text-xs rounded-full font-medium
                        ${(student.matchedSkills||[]).includes(s)
                          ? 'bg-cyan-100 text-cyan-700'
                          : 'bg-gray-100 text-gray-500'}`}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Extra info */}
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500 pt-2 border-t border-gray-100">
                {student.studentInfo?.rollNumber && (
                  <span>Roll: <b className="text-gray-700">{student.studentInfo.rollNumber}</b></span>
                )}
                <span>Active Backlogs: <b className="text-gray-700">{student.studentInfo?.activeBacklogs ?? 0}</b></span>
                <span>Total Backlogs: <b className="text-gray-700">{student.studentInfo?.totalBacklogs ?? 0}</b></span>
                <span>Placed: <b className={student.studentInfo?.isPlaced ? 'text-green-600' : 'text-gray-700'}>
                  {student.studentInfo?.isPlaced ? 'Yes' : 'No'}
                </b></span>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const MatchedStudents = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading]               = useState(true);
  const [job, setJob]                       = useState(null);
  const [allStudents, setAllStudents]       = useState([]);
  const [searchTerm, setSearchTerm]         = useState('');
  const [filterEligible, setFilterEligible] = useState('all');
  const [filterMinPct, setFilterMinPct]     = useState(0);
  const [error, setError]                   = useState('');
  const [summaryStats, setSummaryStats]     = useState({ total: 0, eligible: 0, avg: 0, above70: 0 });

  useEffect(() => { if (jobId) loadData(); }, [jobId]);

  const loadData = async () => {
    try {
      setLoading(true); setError('');
      const [jobRes, matchRes] = await Promise.all([
        jobAPI.getJobById(jobId),
        jobAPI.getMatchedStudents(jobId),
      ]);
      if (jobRes.success) setJob(jobRes.job);
      if (matchRes.success) {
        const s = matchRes.matchedStudents || [];
        setAllStudents(s);
        setSummaryStats({
          total:   s.length,
          eligible: s.filter(x => x.isEligible).length,
          avg:     s.length ? Math.round(s.reduce((a,x) => a + x.matchPercentage, 0) / s.length) : 0,
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
    const matchElig =
      filterEligible === 'all'        ? true :
      filterEligible === 'eligible'   ? s.isEligible :
      !s.isEligible;
    return matchSearch && matchElig && s.matchPercentage >= filterMinPct;
  });

  const handleExportCSV = () => {
    const rows = [
      ['Rank','Name','Email','Branch','Batch','CGPA','Match%','Eligible','Matched Skills'],
      ...filtered.map((s,i) => [
        i+1, s.fullName, s.email,
        s.studentInfo?.branch||'', s.studentInfo?.batch||'', s.studentInfo?.cgpa||'',
        s.matchPercentage, s.isEligible ? 'Yes' : 'No',
        (s.matchedSkills||[]).join('; ')
      ])
    ];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `matched-students-${job?.jobCode || jobId}.csv`;
    a.click();
  };

  if (loading) return <LoadingSpinner message="Calculating skill matches..." />;

  const companyName = typeof job?.companyId === 'object' ? job?.companyId?.name : '—';

  const topCards = [
    { label: 'Total Students', value: summaryStats.total,     Icon: Users,       grad: 'from-blue-600 via-blue-500 to-cyan-500',  tc: 'text-gray-900'   },
    { label: 'Eligible',       value: summaryStats.eligible,  Icon: CheckCircle, grad: 'from-green-500 to-emerald-500',           tc: 'text-green-700'  },
    { label: 'Avg Match %',    value: summaryStats.avg + '%', Icon: TrendingUp,  grad: 'from-blue-600 to-indigo-500',             tc: 'text-blue-700'   },
    { label: 'Score ≥ 70%',    value: summaryStats.above70,   Icon: Award,       grad: 'from-cyan-500 to-blue-500',               tc: 'text-cyan-700'   },
  ];

  return (
    // ── Same background as Login ──────────────────────────────────────────────
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 relative">

      {/* Animated blob orbs — same as AuthBackground */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-20 w-96 h-96 bg-gradient-to-br from-cyan-200 to-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
        <div className="absolute top-40 -right-20 w-96 h-96 bg-gradient-to-br from-blue-300 to-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-br from-cyan-300 to-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />
      </div>

      <div className="relative z-10">
        <DashboardLayout title="Matched Students">

          {/* Back */}
          <button onClick={() => navigate('/dashboard/college-admin/jobs')}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6 transition-colors group">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back to Job Management
          </button>

          {/* ── Header card — same gradient as Login's submit button ── */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 rounded-3xl p-8 shadow-2xl shadow-blue-500/30 mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="text-white">
                <div className="flex items-center gap-3 mb-2">
                  <Target className="w-8 h-8" />
                  <h1 className="text-2xl font-bold">Skill Match Analysis</h1>
                </div>
                {job && (
                  <div className="text-blue-100 space-y-1">
                    <p className="text-lg font-semibold text-white">{job.jobTitle}</p>
                    <p className="text-sm">{companyName} · {job.jobCode} · {job.jobType}</p>
                    <div className="flex flex-wrap gap-2 mt-2 text-sm">
                      <span className="bg-white/20 px-3 py-1 rounded-full">Min CGPA: {job.eligibility?.minCGPA || 0}</span>
                      <span className="bg-white/20 px-3 py-1 rounded-full">
                        Branches: {(job.eligibility?.branches||[]).join(', ')||'All'}
                      </span>
                      <span className="bg-white/20 px-3 py-1 rounded-full">
                        Batches: {(job.eligibility?.batches||[]).join(', ')||'All'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <button onClick={handleExportCSV}
                className="bg-white text-blue-600 px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-blue-50 transition-all shadow-lg hover:scale-105 shrink-0">
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 flex items-center gap-3">
              <XCircle className="w-5 h-5 shrink-0" /><span>{error}</span>
            </div>
          )}

          {/* Summary Stats — frosted glass same as Login card */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {topCards.map(({ label, value, Icon, grad, tc }) => (
              <div key={label} className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 shadow-xl shadow-blue-500/10 border border-white/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-xs font-medium mb-1">{label}</p>
                    <p className={`text-2xl font-bold ${tc}`}>{value}</p>
                  </div>
                  <div className={`w-11 h-11 bg-gradient-to-br ${grad} rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/40`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* JD Skills Reference */}
          {job?.preferredSkills?.length > 0 && (
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 shadow-xl shadow-blue-500/10 border border-white/50 mb-6">
              <p className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-500" /> Preferred / Required Skills from JD
              </p>
              <div className="flex flex-wrap gap-2">
                {job.preferredSkills.map(s => (
                  <span key={s} className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 shadow-xl shadow-blue-500/10 border border-white/50 mb-6">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text"
                  placeholder="Search by name, email, branch, roll number..."
                  value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select value={filterEligible} onChange={e => setFilterEligible(e.target.value)}
                  className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="all">All Students</option>
                  <option value="eligible">Eligible Only</option>
                  <option value="ineligible">Ineligible Only</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 shrink-0">Min %:</span>
                <select value={filterMinPct} onChange={e => setFilterMinPct(Number(e.target.value))}
                  className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value={0}>0% (All)</option>
                  <option value={40}>40%+</option>
                  <option value={60}>60%+</option>
                  <option value={70}>70%+</option>
                  <option value={80}>80%+</option>
                </select>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Showing <b className="text-gray-600">{filtered.length}</b> of <b className="text-gray-600">{allStudents.length}</b> students
            </p>
          </div>

          {/* Table */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl shadow-blue-500/10 border border-white/50 overflow-hidden">
            {filtered.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-200">
                    <tr>
                      {['#','Student','Branch/Batch','CGPA','Matched Skills','Eligible','Match %',''].map(h => (
                        <th key={h} className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map((student, i) => (
                      <StudentRow key={student._id} student={student} rank={i + 1} />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-16">
                <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium mb-2">
                  {allStudents.length === 0 ? 'No students found in your college' : 'No students match the current filters'}
                </p>
                <p className="text-gray-400 text-sm">
                  {allStudents.length === 0
                    ? 'Make sure students have been registered under your college'
                    : 'Try adjusting search or filter criteria'}
                </p>
              </div>
            )}
          </div>

          {/* Scoring legend */}
          <div className="mt-6 bg-white/60 backdrop-blur-xl rounded-2xl p-5 border border-white/50 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400" /> Scoring Weights
            </p>
            <div className="flex flex-wrap gap-4 text-xs text-gray-600">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> Skills 30%</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-cyan-500 inline-block" /> Branch 25%</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-indigo-500 inline-block" /> CGPA 20%</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-sky-500 inline-block" /> Batch 15%</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-teal-500 inline-block" /> No Backlogs 10%</span>
            </div>
          </div>

        </DashboardLayout>
      </div>

      {/* Blob animation styles — same as AuthBackground */}
      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%       { transform: translate(30px, -50px) scale(1.1); }
          66%       { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob            { animation: blob 7s infinite; }
        .animation-delay-2000   { animation-delay: 2s; }
        .animation-delay-4000   { animation-delay: 4s; }
      `}</style>
    </div>
  );
};

export default MatchedStudents;