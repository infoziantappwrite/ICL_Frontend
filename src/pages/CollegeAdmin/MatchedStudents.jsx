// pages/CollegeAdmin/MatchedStudents.jsx — redesigned to match SuperAdmin/CollegeAdmin theme
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

/* ─── helpers ─────────────────────────────── */
const fmt = (n) => {
  if (n === undefined || n === null) return '0';
  return String(n);
};
const pct = (a, b) => (b > 0 ? Math.min(100, Math.round((a / b) * 100)) : 0);

/* ─── Circular match % ring ─────────────────── */
const MatchCircle = ({ pct: p }) => {
  const color  = p >= 80 ? '#22c55e' : p >= 60 ? '#f59e0b' : p >= 40 ? '#3b82f6' : '#ef4444';
  const size   = 48, r = 20, circ = 2 * Math.PI * r;
  const offset = circ - (p / 100) * circ;
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth="3.5" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="3.5"
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central"
        fill={color} fontSize="9" fontWeight="700"
        style={{ transform: 'rotate(90deg)', transformOrigin: `${size / 2}px ${size / 2}px` }}>
        {p}%
      </text>
    </svg>
  );
};

/* ─── Score bar ────────────────────────────── */
const ScoreBar = ({ label, value, max, color }) => (
  <div className="flex items-center gap-2 text-xs">
    <span className="w-14 text-gray-500 shrink-0 text-[10px]">{label}</span>
    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
      <div className={`h-1.5 rounded-full ${color}`}
        style={{ width: `${Math.min((value / max) * 100, 100)}%`, transition: 'width 0.5s ease' }} />
    </div>
    <span className="w-10 text-right font-semibold text-gray-700 text-[10px]">{value}/{max}</span>
  </div>
);

/* ─── Student Row ─────────────────────────── */
const StudentRow = ({ student, rank }) => {
  const [expanded, setExpanded] = useState(false);
  const p           = student.matchPercentage;
  const badgeCls    = p >= 80 ? 'bg-green-50 text-green-700 border-green-100' : p >= 60 ? 'bg-amber-50 text-amber-700 border-amber-100' : p >= 40 ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-red-50 text-red-500 border-red-100';
  const badgeLabel  = p >= 80 ? 'Excellent' : p >= 60 ? 'Good' : p >= 40 ? 'Fair' : 'Low';
  const bd          = student.breakdown || {};

  return (
    <>
      <tr className={`hover:bg-blue-50/30 transition-colors ${rank <= 3 ? 'bg-gradient-to-r from-amber-50/30 to-transparent' : ''}`}>
        {/* Rank */}
        <td className="px-3 py-3 text-center">
          {rank <= 3 ? (
            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black
              ${['bg-yellow-400 text-white', 'bg-gray-300 text-gray-700', 'bg-amber-600 text-white'][rank - 1]}`}>
              {rank}
            </span>
          ) : (
            <span className="text-xs text-gray-400 font-medium">#{rank}</span>
          )}
        </td>

        {/* Student */}
        <td className="px-3 py-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm shadow-blue-500/30">
              {student.fullName?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-900">{student.fullName}</p>
              <p className="text-[10px] text-gray-400">{student.email}</p>
            </div>
          </div>
        </td>

        {/* Branch / Batch */}
        <td className="px-3 py-3">
          <p className="text-xs font-semibold text-gray-800">{student.studentInfo?.branch || '—'}</p>
          <p className="text-[10px] text-gray-500">Batch: {student.studentInfo?.batch || '—'}</p>
        </td>

        {/* CGPA */}
        <td className="px-3 py-3 text-center">
          <span className="text-xs font-black text-gray-800">{student.studentInfo?.cgpa ?? '—'}</span>
        </td>

        {/* Matched Skills */}
        <td className="px-3 py-3">
          <div className="flex flex-wrap gap-1 max-w-[180px]">
            {(student.matchedSkills || []).slice(0, 3).map(s => (
              <span key={s} className="px-2 py-0.5 bg-cyan-50 text-cyan-700 text-[9px] rounded-full font-semibold border border-cyan-100">{s}</span>
            ))}
            {(student.matchedSkills || []).length > 3 && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[9px] rounded-full">+{student.matchedSkills.length - 3}</span>
            )}
            {!student.matchedSkills?.length && <span className="text-[10px] text-gray-400 italic">—</span>}
          </div>
        </td>

        {/* Eligible */}
        <td className="px-3 py-3 text-center">
          {student.isEligible
            ? <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
            : <XCircle className="w-4 h-4 text-red-400 mx-auto" />}
        </td>

        {/* Match % */}
        <td className="px-3 py-3">
          <div className="flex items-center gap-2">
            <MatchCircle pct={p} />
            <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full border ${badgeCls}`}>{badgeLabel}</span>
          </div>
        </td>

        {/* Expand */}
        <td className="px-3 py-3 text-center">
          <button onClick={() => setExpanded(!expanded)}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </td>
      </tr>

      {/* Expanded breakdown */}
      {expanded && (
        <tr>
          <td colSpan={8} className="px-3 pb-4 bg-gradient-to-r from-blue-50/40 to-cyan-50/20">
            <div className="ml-10 p-4 bg-white/80 backdrop-blur-xl rounded-xl border border-white/60 shadow-sm">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">Score Breakdown</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 mb-3">
                <ScoreBar label="Skills"  value={Math.round(bd.skills  || 0)} max={30} color="bg-blue-500"   />
                <ScoreBar label="Branch"  value={Math.round(bd.branch  || 0)} max={25} color="bg-cyan-500"   />
                <ScoreBar label="CGPA"    value={Math.round(bd.cgpa    || 0)} max={20} color="bg-indigo-500" />
                <ScoreBar label="Batch"   value={Math.round(bd.batch   || 0)} max={15} color="bg-sky-500"    />
                <ScoreBar label="Hygiene" value={Math.round(bd.hygiene || 0)} max={10} color="bg-teal-500"   />
              </div>

              {student.skills?.length > 0 && (
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 mb-2">All Student Skills</p>
                  <div className="flex flex-wrap gap-1">
                    {student.skills.map(s => (
                      <span key={s} className={`px-2 py-0.5 text-[9px] rounded-full font-semibold ${
                        (student.matchedSkills || []).includes(s) ? 'bg-cyan-50 text-cyan-700 border border-cyan-100' : 'bg-gray-100 text-gray-500'
                      }`}>{s}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-4 text-[10px] text-gray-500 pt-3 mt-2 border-t border-gray-100">
                {student.studentInfo?.rollNumber && <span>Roll: <b className="text-gray-700">{student.studentInfo.rollNumber}</b></span>}
                <span>Active Backlogs: <b className="text-gray-700">{student.studentInfo?.activeBacklogs ?? 0}</b></span>
                <span>Total Backlogs: <b className="text-gray-700">{student.studentInfo?.totalBacklogs ?? 0}</b></span>
                <span>Placed: <b className={student.studentInfo?.isPlaced ? 'text-green-600' : 'text-gray-700'}>{student.studentInfo?.isPlaced ? 'Yes' : 'No'}</b></span>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

/* ══════════════════════════════════════════ */
const MatchedStudents = () => {
  const { jobId } = useParams();
  const navigate  = useNavigate();
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
      const [jobRes, matchRes] = await Promise.all([jobAPI.getJobById(jobId), jobAPI.getMatchedStudents(jobId)]);
      if (jobRes.success) setJob(jobRes.job);
      if (matchRes.success) {
        const s = matchRes.matchedStudents || [];
        setAllStudents(s);
        setSummaryStats({
          total:   s.length,
          eligible: s.filter(x => x.isEligible).length,
          avg:     s.length ? Math.round(s.reduce((a, x) => a + x.matchPercentage, 0) / s.length) : 0,
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

      {/* Back button */}
      <button onClick={() => navigate('/dashboard/college-admin/jobs')}
        className="flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-4 transition-colors group text-sm font-medium">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Job Management
      </button>

      {/* ══ HERO BANNER ══ */}
      <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 rounded-2xl px-5 py-4 mb-4 shadow-xl shadow-blue-500/20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-10 -right-10 w-44 h-44 bg-white/10 rounded-full" />
          <div className="absolute -bottom-8 left-1/3 w-28 h-28 bg-white/10 rounded-full" />
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: 'radial-gradient(circle,white 1px,transparent 1px)', backgroundSize: '18px 18px' }} />
        </div>
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-blue-200 text-[11px] font-semibold">AI-Powered Matching</p>
              <h1 className="text-white font-black text-lg leading-tight">Skill Match Analysis</h1>
              {job && (
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  <span className="inline-flex items-center gap-1 bg-white/15 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white border border-white/20">
                    <Briefcase className="w-3 h-3" /> {job.jobTitle}
                  </span>
                  <span className="inline-flex items-center gap-1 bg-white/15 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white border border-white/20">
                    {companyName} · {job.jobCode}
                  </span>
                </div>
              )}
            </div>
          </div>
          <button onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 bg-white text-blue-600 text-xs font-bold px-3 py-2 rounded-xl hover:bg-blue-50 transition-all shadow-sm hover:scale-105 shrink-0">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {/* ══ STATS PILLS ══ */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-3 mb-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { icon: Users,       label: 'Total Students', value: summaryStats.total,         color: 'bg-blue-50 border-blue-100 text-blue-600'   },
            { icon: CheckCircle, label: 'Eligible',        value: summaryStats.eligible,      color: 'bg-green-50 border-green-100 text-green-600' },
            { icon: TrendingUp,  label: 'Avg Match %',     value: `${summaryStats.avg}%`,     color: 'bg-indigo-50 border-indigo-100 text-indigo-600' },
            { icon: Award,       label: 'Score ≥ 70%',     value: summaryStats.above70,       color: 'bg-cyan-50 border-cyan-100 text-cyan-600'   },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${color}`}>
              <Icon className="w-4 h-4 flex-shrink-0 opacity-70" />
              <div>
                <p className="text-sm font-black leading-none">{typeof value === 'string' ? value : fmt(value)}</p>
                <p className="text-[9px] font-medium opacity-60 mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* JD Skills Reference */}
      {job?.preferredSkills?.length > 0 && (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-3 h-3 text-white" />
            </div>
            <p className="text-xs font-bold text-gray-700">Preferred / Required Skills from JD</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {job.preferredSkills.map(s => (
              <span key={s} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[10px] rounded-full font-semibold border border-blue-100">{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 flex items-center gap-2">
          <XCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      {/* Job eligibility chips */}
      {job && (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm px-4 py-3 mb-4">
          <div className="flex flex-wrap gap-2 text-[10px]">
            <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg font-semibold border border-blue-100">
              Min CGPA: {job.eligibility?.minCGPA || 0}
            </span>
            <span className="px-2.5 py-1 bg-cyan-50 text-cyan-600 rounded-lg font-semibold border border-cyan-100">
              Branches: {(job.eligibility?.branches || []).join(', ') || 'All'}
            </span>
            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg font-semibold border border-indigo-100">
              Batches: {(job.eligibility?.batches || []).join(', ') || 'All'}
            </span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-3 mb-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search by name, email, branch, roll number..."
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <select value={filterEligible} onChange={e => setFilterEligible(e.target.value)}
              className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white">
              <option value="all">All Students</option>
              <option value="eligible">Eligible Only</option>
              <option value="ineligible">Ineligible Only</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 shrink-0">Min %:</span>
            <select value={filterMinPct} onChange={e => setFilterMinPct(Number(e.target.value))}
              className="px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white">
              <option value={0}>0% (All)</option>
              <option value={40}>40%+</option>
              <option value={60}>60%+</option>
              <option value={70}>70%+</option>
              <option value={80}>80%+</option>
            </select>
          </div>
        </div>
        <p className="text-[10px] text-gray-400 mt-2">
          Showing <b className="text-gray-600">{filtered.length}</b> of <b className="text-gray-600">{allStudents.length}</b> students
        </p>
      </div>

      {/* Student Table */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm overflow-hidden mb-4">
        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gradient-to-r from-blue-50 to-cyan-50">
                  {['#', 'Student', 'Branch/Batch', 'CGPA', 'Matched Skills', 'Eligible', 'Match %', ''].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-[9px] font-black text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((student, i) => (
                  <StudentRow key={student._id} student={student} rank={i + 1} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-3">
              <GraduationCap className="w-6 h-6 text-blue-300" />
            </div>
            <p className="text-sm font-semibold text-gray-600 mb-1">
              {allStudents.length === 0 ? 'No students found in your college' : 'No students match the current filters'}
            </p>
            <p className="text-[10px] text-gray-400">
              {allStudents.length === 0
                ? 'Make sure students have been registered under your college'
                : 'Try adjusting search or filter criteria'}
            </p>
          </div>
        )}
      </div>

      {/* Scoring legend */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-2.5">
          <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <Star className="w-3 h-3 text-white" />
          </div>
          <p className="text-xs font-bold text-gray-700">Scoring Weights</p>
        </div>
        <div className="flex flex-wrap gap-4 text-xs text-gray-600">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> Skills 30%</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-cyan-500 inline-block" /> Branch 25%</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-indigo-500 inline-block" /> CGPA 20%</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-sky-500 inline-block" /> Batch 15%</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-teal-500 inline-block" /> No Backlogs 10%</span>
        </div>
      </div>

    </CollegeAdminLayout>
  );
};

export default MatchedStudents;