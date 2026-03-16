// src/pages/jobs/JobDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeft, Briefcase, MapPin, DollarSign, Clock,
  Building2, Users, Award, CheckCircle, XCircle,
  AlertCircle, TrendingUp, Target, GraduationCap,
  Home, Search, ChevronDown, ChevronUp, FileText, Zap,
  BarChart3, ClipboardList, Star, Calendar, Hash,
  Shield, Globe, BookOpen, ChevronRight,
  Trophy, Info, AlertTriangle,
  Mail, Paperclip, Layers,
  Lightbulb, SlidersHorizontal, UserCheck,
} from 'lucide-react';
import { assessmentAPI, assessmentAttemptAPI } from '../../api/Api';

// ─────────────────────────────────────────────────────────────
// Role Detection Helper
// ─────────────────────────────────────────────────────────────
const useRole = () => {
  const location = useLocation();
  const isCollegeAdmin = location.pathname.startsWith('/dashboard/college-admin');
  const isSuperAdmin   = location.pathname.startsWith('/dashboard/super-admin');
  const isStudent      = !isCollegeAdmin && !isSuperAdmin;
  return { isCollegeAdmin, isSuperAdmin, isStudent };
};

// ─────────────────────────────────────────────────────────────
// SVG Circular Match Ring
// ─────────────────────────────────────────────────────────────
const MatchRing = ({ pct, size = 56 }) => {
  const r = size * 0.39;
  const circ = 2 * Math.PI * r;
  const filled = circ * (pct / 100);
  const color =
    pct >= 80 ? '#16a34a' :
    pct >= 60 ? '#2563eb' :
    pct >= 40 ? '#f59e0b' : '#dc2626';
  const cx = size / 2, cy = size / 2;
  return (
    <svg width={size} height={size} className="shrink-0" viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth="4" />
      <circle
        cx={cx} cy={cy} r={r}
        fill="none" stroke={color} strokeWidth="4"
        strokeDasharray={`${filled} ${circ - filled}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize={size * 0.18} fontWeight="700" fill={color}>
        {pct}%
      </text>
    </svg>
  );
};

// ─────────────────────────────────────────────────────────────
// Breakdown Bar
// ─────────────────────────────────────────────────────────────
const BreakdownBar = ({ label, pts, max, icon: Icon }) => {
  const pct = max > 0 ? Math.round(((pts || 0) / max) * 100) : 0;
  const barColor =
    pct >= 80 ? 'bg-emerald-500' :
    pct >= 50 ? 'bg-blue-500' :
    pct >= 30 ? 'bg-amber-500' : 'bg-red-400';
  return (
    <div className="bg-white/70 rounded-xl p-3 border border-white/80 shadow-sm backdrop-blur-sm">
      <div className="flex justify-between items-center mb-1.5">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
          {Icon && <Icon className="w-3.5 h-3.5 text-gray-400" />}
          {label}
        </span>
        <span className="text-xs font-bold text-gray-800">{pts ?? 0}/{max}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Assessment Results Panel — Admin only
// ─────────────────────────────────────────────────────────────
const AssessmentResultsPanel = ({ jobId }) => {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [expanded, setExpanded]       = useState(null);
  const [attemptMap, setAttemptMap]   = useState({});

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await assessmentAPI.getAllAssessments();
        if (res.success) {
          const linked = (res.assessments || []).filter(a => a.jd_id?._id === jobId || a.jd_id === jobId);
          setAssessments(linked);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [jobId]);

  const loadAttempts = async (assessmentId) => {
    if (attemptMap[assessmentId]) { setExpanded(assessmentId); return; }
    try {
      const res = await assessmentAttemptAPI.getAssessmentAttempts(assessmentId);
      setAttemptMap(p => ({ ...p, [assessmentId]: res.attempts || [] }));
      setExpanded(assessmentId);
    } catch (e) {}
  };

  const scoreColor = (pct) => pct >= 70 ? 'text-emerald-600' : pct >= 40 ? 'text-blue-600' : 'text-red-500';
  const scoreBg    = (pct) => pct >= 70 ? 'bg-emerald-50 border-emerald-200' : pct >= 40 ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200';

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      <p className="text-gray-500 font-medium">Loading assessment results…</p>
    </div>
  );

  if (!assessments.length) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 border-2 border-dashed border-gray-200 rounded-2xl">
      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
        <ClipboardList className="w-8 h-8 text-gray-300" />
      </div>
      <p className="text-gray-600 font-semibold">No assessments linked to this JD</p>
      <p className="text-gray-400 text-sm">Create an assessment and link it to this job to see results here.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Linked Assessments', value: assessments.length, color: 'blue' },
          { label: 'Total Assigned', value: assessments.reduce((s,a) => s + (a.eligible_students?.length || 0), 0), color: 'violet' },
          { label: 'Total Questions', value: assessments.reduce((s,a) => s + (a.questions_id?.length || 0), 0), color: 'cyan' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`bg-${color}-50 border border-${color}-100 rounded-2xl p-4 text-center`}>
            <p className={`text-2xl font-black text-${color}-700`}>{value}</p>
            <p className={`text-xs text-${color}-500 mt-1 font-semibold`}>{label}</p>
          </div>
        ))}
      </div>

      {assessments.map(a => {
        const attempts = attemptMap[a._id] || [];
        const isOpen   = expanded === a._id;
        const avgScore = attempts.length
          ? Math.round(attempts.reduce((s, at) => s + (at.score_percentage || 0), 0) / attempts.length) : null;
        const passed   = attempts.filter(at => (at.score_percentage || 0) >= 70).length;

        return (
          <div key={a._id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-slate-50 to-blue-50/60 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-blue-200">
                  <ClipboardList className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">{a.skill_id?.name || a.tags?.[0] || 'Assessment'}</h4>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold
                      ${a.level === 'Beginner' ? 'bg-emerald-100 text-emerald-700'
                        : a.level === 'Intermediate' ? 'bg-blue-100 text-blue-700'
                        : 'bg-violet-100 text-violet-700'}`}>{a.level}</span>
                    <span className="text-xs text-gray-400">{a.questions_id?.length || 0} Qs · {a.duration_minutes}m</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${a.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{a.status}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-xs text-gray-400">{a.eligible_students?.length || 0} assigned</div>
                  {avgScore !== null && <div className={`text-sm font-bold ${scoreColor(avgScore)}`}>{avgScore}% avg</div>}
                </div>
                <button
                  onClick={() => isOpen ? setExpanded(null) : loadAttempts(a._id)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-sm"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  {isOpen ? 'Hide' : 'View Results'}
                </button>
              </div>
            </div>

            {isOpen && (
              <div className="p-5">
                {attempts.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 mb-5">
                    {[
                      { label: 'Attempts', value: attempts.length, cls: 'bg-gray-50 text-gray-700' },
                      { label: 'Passed ≥70%', value: passed, cls: 'bg-emerald-50 text-emerald-700' },
                      { label: 'Avg Score', value: `${avgScore ?? '—'}%`, cls: 'bg-blue-50 text-blue-700' },
                    ].map(({ label, value, cls }) => (
                      <div key={label} className={`${cls} rounded-xl p-3 text-center`}>
                        <div className="text-xl font-black">{value}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{label}</div>
                      </div>
                    ))}
                  </div>
                )}

                {attempts.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">No students have attempted this assessment yet.</div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-gray-100">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          {['#','Student','Score','Correct','Marks','Submitted'].map(h => (
                            <th key={h} className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase ${h === 'Student' ? 'text-left' : 'text-center'}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {[...attempts].sort((a,b) => (b.score_percentage||0)-(a.score_percentage||0)).map((at, idx) => (
                          <tr key={at._id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}>
                            <td className="px-4 py-3 text-center">
                              {idx === 0
                                ? <Award className="w-4 h-4 text-yellow-500 mx-auto" />
                                : idx === 1
                                ? <Award className="w-4 h-4 text-gray-400 mx-auto" />
                                : idx === 2
                                ? <Award className="w-4 h-4 text-orange-400 mx-auto" />
                                : <span className="text-xs font-bold text-gray-400">#{idx+1}</span>}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                  {(at.student_id?.fullName || '?').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900 text-xs">{at.student_id?.fullName || 'Unknown'}</p>
                                  <p className="text-[11px] text-gray-400">{at.student_id?.email || ''}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-xs font-bold ${scoreBg(at.score_percentage||0)} ${scoreColor(at.score_percentage||0)}`}>
                                {at.score_percentage || 0}%
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center text-xs font-semibold text-gray-600">{at.correct_answers||0}/{at.total_questions||0}</td>
                            <td className="px-4 py-3 text-center text-xs font-semibold text-gray-600">{at.earned_marks||0}/{at.total_marks||0}</td>
                            <td className="px-4 py-3 text-center text-xs text-gray-400">
                              {at.submitted_at ? new Date(at.submitted_at).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Matched Students Panel — Admin only
// ─────────────────────────────────────────────────────────────
const MatchedStudentsPanel = ({ jobId, job }) => {
  const [students, setStudents]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [summary, setSummary]       = useState({ total: 0, eligible: 0 });
  const [search, setSearch]         = useState('');
  const [filterMode, setFilterMode] = useState('all');
  const [sortField, setSortField]   = useState('matchPercentage');
  const [sortDir, setSortDir]       = useState('desc');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await window.jobAPI.getMatchedStudents(jobId);
        if (res.success) {
          setStudents(res.matchedStudents || []);
          setSummary({ total: res.total || 0, eligible: res.eligible || 0 });
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [jobId]);

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const SortBtn = ({ field, children }) => (
    <button onClick={() => toggleSort(field)} className="flex items-center gap-1 hover:text-blue-600 transition-colors">
      {children}
      {sortField === field
        ? sortDir === 'desc' ? <ChevronDown className="w-3 h-3 text-blue-600" /> : <ChevronUp className="w-3 h-3 text-blue-600" />
        : <ChevronDown className="w-3 h-3 opacity-20" />}
    </button>
  );

  const displayed = students
    .filter(s => {
      const q = search.toLowerCase();
      const ok = !q || s.fullName?.toLowerCase().includes(q) || s.studentInfo?.rollNumber?.toLowerCase().includes(q) || s.studentInfo?.branch?.toLowerCase().includes(q);
      if (!ok) return false;
      if (filterMode === 'eligible')   return s.isEligible;
      if (filterMode === 'ineligible') return !s.isEligible;
      return true;
    })
    .sort((a, b) => {
      if (sortField === 'cgpa') { const av = a.studentInfo?.cgpa || 0, bv = b.studentInfo?.cgpa || 0; return sortDir === 'desc' ? bv - av : av - bv; }
      if (sortField === 'name') return sortDir === 'asc' ? (a.fullName || '').localeCompare(b.fullName || '') : (b.fullName || '').localeCompare(a.fullName || '');
      return sortDir === 'desc' ? b.matchPercentage - a.matchPercentage : a.matchPercentage - b.matchPercentage;
    });

  const high75 = students.filter(s => s.matchPercentage >= 75).length;
  const avgPct = students.length ? Math.round(students.reduce((sum, s) => sum + s.matchPercentage, 0) / students.length) : 0;
  const WEIGHTS = { branch: 25, batch: 15, cgpa: 20, skills: 30, hygiene: 10 };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      <p className="text-gray-500 font-medium">Computing student matches…</p>
      <p className="text-gray-400 text-sm">Analysing skills, CGPA, branch & batch</p>
    </div>
  );

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Students', value: summary.total, color: 'blue' },
          { label: 'Fully Eligible', value: summary.eligible, color: 'emerald' },
          { label: 'High Match ≥75%', value: high75, color: 'violet' },
          { label: 'Avg Match', value: `${avgPct}%`, color: 'cyan' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`bg-${color}-50 border border-${color}-100 rounded-2xl p-4 text-center`}>
            <p className={`text-2xl font-black text-${color}-700`}>{value}</p>
            <p className={`text-xs text-${color}-500 mt-1 font-semibold`}>{label}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, roll no, branch…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          />
        </div>
        <div className="flex gap-2">
          {[
            { id: 'all',        icon: SlidersHorizontal,  label: `All (${students.length})`,                        active: 'bg-blue-600 text-white' },
            { id: 'eligible',   icon: UserCheck,   label: `Eligible (${summary.eligible})`,                  active: 'bg-emerald-600 text-white' },
            { id: 'ineligible', icon: XCircle,     label: `Ineligible (${summary.total - summary.eligible})`, active: 'bg-red-500 text-white' },
          ].map(({ id, icon: Ic, label, active }) => (
            <button key={id} onClick={() => setFilterMode(id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                filterMode === id ? active + ' shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              <Ic className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>
      </div>

      {/* Required Skills */}
      {job?.preferredSkills?.length > 0 && (
        <div className="mb-5 p-3 bg-blue-50/60 rounded-xl border border-blue-100">
          <p className="text-xs font-bold text-blue-600 mb-2 uppercase tracking-wide">JD Required Skills</p>
          <div className="flex flex-wrap gap-1.5">
            {job.preferredSkills.map((sk, i) => (
              <span key={i} className="px-2.5 py-1 bg-white border border-blue-200 text-blue-700 rounded-full text-xs font-medium">{sk}</span>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      {displayed.length === 0 ? (
        <div className="text-center py-14 border-2 border-dashed border-gray-200 rounded-2xl">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-semibold">No students found</p>
          <p className="text-gray-400 text-sm mt-1">{students.length === 0 ? 'No students registered yet' : 'Try adjusting your search or filter'}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-blue-50 to-cyan-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase"><SortBtn field="name">Student</SortBtn></th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Branch / Batch</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase"><SortBtn field="cgpa">CGPA</SortBtn></th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Matched Skills</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Eligible</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase"><SortBtn field="matchPercentage">Match %</SortBtn></th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayed.map((s, idx) => {
                const si = s.studentInfo || {};
                const isOpen = expandedId === s._id;
                const rowBg = s.isEligible ? idx % 2 === 0 ? 'bg-emerald-50/20' : 'bg-emerald-50/40' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40';
                return (
                  <>
                    <tr key={s._id} className={`${rowBg} hover:bg-blue-50/50 transition-colors`}>
                      <td className="px-4 py-3 text-center">
                        {idx === 0
                          ? <Award className="w-4 h-4 text-yellow-500 mx-auto" />
                          : idx === 1
                          ? <Award className="w-4 h-4 text-gray-400 mx-auto" />
                          : idx === 2
                          ? <Award className="w-4 h-4 text-orange-400 mx-auto" />
                          : <span className="text-xs font-bold text-gray-400">#{idx+1}</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                            {s.fullName?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 leading-tight">{s.fullName}</p>
                            <p className="text-xs text-gray-400">{si.rollNumber || s.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className={`px-2 py-0.5 rounded-md text-xs font-semibold w-fit ${job?.eligibility?.branches?.includes(si.branch) ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>{si.branch || '—'}</span>
                          <span className={`px-2 py-0.5 rounded-md text-xs font-medium w-fit ${job?.eligibility?.batches?.includes(String(si.batch)) ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-600'}`}>{si.batch || '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-base font-black ${si.cgpa >= (job?.eligibility?.minCGPA || 0) ? 'text-emerald-700' : 'text-red-600'}`}>{si.cgpa ?? '—'}</span>
                        {job?.eligibility?.minCGPA > 0 && <p className="text-[11px] text-gray-400">min {job.eligibility.minCGPA}</p>}
                      </td>
                      <td className="px-4 py-3 max-w-[200px]">
                        {s.matchedSkills?.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {s.matchedSkills.slice(0, 3).map((sk, i) => (
                              <span key={i} className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium"><CheckCircle className="w-3 h-3" />{sk}</span>
                            ))}
                            {s.matchedSkills.length > 3 && <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs">+{s.matchedSkills.length - 3}</span>}
                          </div>
                        ) : <span className="text-gray-400 text-xs italic">No profile skills</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {s.isEligible
                          ? <div className="flex flex-col items-center"><CheckCircle className="w-5 h-5 text-emerald-600" /><span className="text-xs text-emerald-600 font-medium mt-0.5">Yes</span></div>
                          : <div className="flex flex-col items-center"><XCircle className="w-5 h-5 text-red-400" /><span className="text-xs text-red-400 font-medium mt-0.5">No</span></div>}
                      </td>
                      <td className="px-4 py-3"><div className="flex justify-center"><MatchRing pct={s.matchPercentage} /></div></td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => setExpandedId(isOpen ? null : s._id)} className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600 transition-colors">
                          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr key={`${s._id}-expand`} className="bg-gradient-to-br from-blue-50/70 to-cyan-50/70">
                        <td colSpan={8} className="px-6 py-5">
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                            <BreakdownBar label="Branch" pts={s.breakdown?.branch} max={WEIGHTS.branch} icon={Building2} />
                            <BreakdownBar label="Batch"  pts={s.breakdown?.batch}  max={WEIGHTS.batch}  icon={Calendar} />
                            <BreakdownBar label="CGPA"   pts={s.breakdown?.cgpa}   max={WEIGHTS.cgpa}   icon={Star} />
                            <BreakdownBar label="Skills" pts={s.breakdown?.skills} max={WEIGHTS.skills} icon={Lightbulb} />
                            <BreakdownBar label="Hygiene" pts={s.breakdown?.hygiene} max={WEIGHTS.hygiene} icon={CheckCircle} />
                          </div>
                          {s.skills?.length > 0 && (
                            <div className="mb-3">
                              <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">All Profile Skills</p>
                              <div className="flex flex-wrap gap-1.5">
                                {s.skills.map((sk, i) => {
                                  const isMatch = s.matchedSkills?.some(m => m.toLowerCase() === sk.toLowerCase());
                                  return (
                                    <span key={i} className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${isMatch ? 'bg-emerald-100 text-emerald-700 border border-emerald-300 font-semibold' : 'bg-white border border-gray-200 text-gray-600'}`}>
                                      {isMatch && <CheckCircle className="w-3 h-3" />}{sk}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          {((si.activeBacklogs||0) > 0 || (si.totalBacklogs||0) > 0 || (si.gapYears||0) > 0 || si.isPlaced) && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {si.isPlaced && <span className="flex items-center gap-1.5 px-2.5 py-1 bg-violet-100 text-violet-700 rounded-full text-xs font-semibold"><GraduationCap className="w-3 h-3" /> Already Placed</span>}
                              {(si.activeBacklogs||0) > 0 && <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs"><AlertTriangle className="w-3 h-3" /> Active Backlogs: {si.activeBacklogs}</span>}
                              {(si.totalBacklogs||0) > 0  && <span className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-100 text-orange-700 rounded-full text-xs"><Layers className="w-3 h-3" /> Total Backlogs: {si.totalBacklogs}</span>}
                              {(si.gapYears||0) > 0       && <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs">Gap Years: {si.gapYears}</span>}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-gray-400 mt-3 text-right">Showing {displayed.length} of {students.length} students</p>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Job Details Content (shared, role-aware)
// ─────────────────────────────────────────────────────────────
const JobDetailsContent = ({ job, deadline, isStudent }) => {
  const isExpired = deadline.text === 'Expired';
  const isClosed  = job.status === 'Closed' || job.status === 'Cancelled';

  return (
    <div className="space-y-8">
      {/* Student notice */}
      {isStudent && !isExpired && !isClosed && (
        <div className="flex items-start gap-4 p-5 rounded-2xl bg-blue-50 border border-blue-200">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
            <Info className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="font-bold text-blue-900 text-sm">Application via College Portal</p>
            <p className="text-blue-700 text-sm mt-0.5">Contact your college placement cell to apply for this position.</p>
          </div>
        </div>
      )}
      {isStudent && (isExpired || isClosed) && (
        <div className="flex items-start gap-4 p-5 rounded-2xl bg-red-50 border border-red-200">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-red-900 text-sm">Applications Closed</p>
            <p className="text-red-700 text-sm mt-0.5">This job is no longer accepting applications.</p>
          </div>
        </div>
      )}

      {/* Description */}
      <section>
        <h3 className="text-base font-black text-gray-900 mb-3 flex items-center gap-2">
          <div className="w-1 h-5 rounded-full bg-blue-600" />
          Job Description
        </h3>
        <div className="text-gray-600 leading-relaxed whitespace-pre-wrap text-sm bg-gray-50/60 rounded-xl p-5 border border-gray-100">{job.description}</div>
      </section>

      {/* Responsibilities */}
      {job.responsibilities?.length > 0 && (
        <section>
          <h3 className="text-base font-black text-gray-900 mb-3 flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-emerald-500" />
            Key Responsibilities
          </h3>
          <ul className="space-y-2.5">
            {job.responsibilities.map((r, i) => (
              <li key={i} className="flex items-start gap-3 group">
                <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-emerald-500 transition-colors">
                  <CheckCircle className="w-3 h-3 text-emerald-600 group-hover:text-white transition-colors" />
                </div>
                <span className="text-gray-700 text-sm leading-relaxed">{r}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Requirements */}
      {job.requirements?.length > 0 && (
        <section>
          <h3 className="text-base font-black text-gray-900 mb-3 flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-violet-500" />
            Requirements
          </h3>
          <ul className="space-y-2.5">
            {job.requirements.map((r, i) => (
              <li key={i} className="flex items-start gap-3 group">
                <div className="w-5 h-5 bg-violet-100 rounded-full flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-violet-500 transition-colors">
                  <CheckCircle className="w-3 h-3 text-violet-600 group-hover:text-white transition-colors" />
                </div>
                <span className="text-gray-700 text-sm leading-relaxed">{r}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Preferred Skills */}
      {job.preferredSkills?.length > 0 && (
        <section>
          <h3 className="text-base font-black text-gray-900 mb-3 flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-cyan-500" />
            Preferred Skills
          </h3>
          <div className="flex flex-wrap gap-2">
            {job.preferredSkills.map((sk, i) => (
              <span key={i} className="px-3.5 py-1.5 bg-cyan-50 border border-cyan-200 text-cyan-700 rounded-xl text-sm font-semibold hover:bg-cyan-100 transition-colors cursor-default">
                {sk}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Eligibility */}
      <section>
        <h3 className="text-base font-black text-gray-900 mb-3 flex items-center gap-2">
          <div className="w-1 h-5 rounded-full bg-amber-500" />
          Eligibility Criteria
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Min CGPA', value: `${job.eligibility.minCGPA}/10`, icon: Star },
            { label: 'Max Backlogs', value: job.eligibility.maxBacklogs, icon: Shield },
            ...(job.eligibility.maxGapYears > 0 ? [{ label: 'Max Gap Years', value: job.eligibility.maxGapYears, icon: Calendar }] : []),
            { label: 'Active Backlogs', value: job.eligibility.activeBacklogsAllowed ? 'Allowed' : 'Not Allowed', icon: AlertCircle },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-amber-50/70 border border-amber-100 rounded-xl p-3 text-center">
              <Icon className="w-4 h-4 text-amber-500 mx-auto mb-1" />
              <p className="text-base font-black text-amber-800">{value}</p>
              <p className="text-xs text-amber-600 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
        {job.eligibility.branches?.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Eligible Branches</p>
            <div className="flex flex-wrap gap-2">
              {job.eligibility.branches.map((b, i) => (
                <span key={i} className="px-3 py-1 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium">{b}</span>
              ))}
            </div>
          </div>
        )}
        {job.eligibility.batches?.length > 0 && (
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Eligible Batches</p>
            <div className="flex flex-wrap gap-2">
              {job.eligibility.batches.map((b, i) => (
                <span key={i} className="px-3 py-1 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium">{b}</span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Selection Process */}
      {job.selectionProcess?.rounds?.length > 0 && (
        <section>
          <h3 className="text-base font-black text-gray-900 mb-3 flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-blue-500" />
            Selection Process
          </h3>
          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-300 to-transparent" />
            <div className="space-y-3">
              {job.selectionProcess.rounds.map((round, i) => (
                <div key={i} className="flex items-start gap-4 pl-2">
                  <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-cyan-500 text-white rounded-full flex items-center justify-center font-black text-xs shrink-0 shadow-md shadow-blue-200 relative z-10">
                    {i + 1}
                  </div>
                  <div className="flex-1 bg-white border border-gray-200 rounded-xl p-3.5 shadow-sm">
                    <p className="font-bold text-gray-900 text-sm">{round.name}</p>
                    {round.description && <p className="text-xs text-gray-500 mt-0.5">{round.description}</p>}
                    {round.duration && <p className="flex items-center gap-1 text-xs text-blue-500 mt-1 font-medium"><Clock className="w-3 h-3" /> {round.duration}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Package Breakdown */}
      {(job.package.fixedPay || job.package.variablePay || job.package.joiningBonus || job.package.otherBenefits) && (
        <section>
          <h3 className="text-base font-black text-gray-900 mb-3 flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-emerald-600" />
            Package Breakdown
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: 'Fixed Pay', value: job.package.fixedPay ? `₹${job.package.fixedPay} LPA` : null },
              { label: 'Variable Pay', value: job.package.variablePay ? `₹${job.package.variablePay} LPA` : null },
              { label: 'Joining Bonus', value: job.package.joiningBonus ? `₹${job.package.joiningBonus}` : null },
            ].filter(x => x.value).map(({ label, value }) => (
              <div key={label} className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
                <p className="font-black text-emerald-700">{value}</p>
                <p className="text-xs text-emerald-600 mt-0.5">{label}</p>
              </div>
            ))}
            {job.package.otherBenefits && (
              <div className="col-span-2 md:col-span-3 bg-gray-50 border border-gray-200 rounded-xl p-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Other Benefits</p>
                <p className="text-sm text-gray-700">{job.package.otherBenefits}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Documents Required */}
      <section>
        <h3 className="text-base font-black text-gray-900 mb-3 flex items-center gap-2">
          <div className="w-1 h-5 rounded-full bg-gray-400" />
          Documents Required
        </h3>
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'resume',      icon: FileText,     label: 'Resume' },
            { key: 'coverLetter', icon: Mail,          label: 'Cover Letter' },
            { key: 'marksheets',  icon: FileText,    label: 'Marksheets' },
            { key: 'certificates',icon: Award,     label: 'Certificates' },
          ].filter(d => job.documentsRequired?.[d.key]).map(({ key, icon: Ic, label }) => (
            <span key={key} className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium">
              <Ic className="w-4 h-4 text-gray-400" />{label}
            </span>
          ))}
          {job.documentsRequired?.other && (
            <span className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium">
              <Paperclip className="w-4 h-4 text-gray-400" />{job.documentsRequired.other}
            </span>
          )}
        </div>
      </section>

      {/* About Company */}
      {job.companyId && (
        <section className="bg-gradient-to-br from-gray-50 to-blue-50/40 rounded-2xl p-5 border border-gray-100">
          <h3 className="text-base font-black text-gray-900 mb-3">About {job.companyId.name}</h3>
          {job.companyId.description && <p className="text-gray-600 text-sm leading-relaxed mb-3">{job.companyId.description}</p>}
          {job.companyId.website && (
            <a href={job.companyId.website} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-semibold hover:underline">
              <Globe className="w-4 h-4" /> Visit Website
            </a>
          )}
        </section>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100">
        {[
          { label: 'Applications', value: job.stats.totalApplications, color: 'blue' },
          { label: 'Shortlisted', value: job.stats.shortlisted, color: 'amber' },
          { label: 'Selected', value: job.stats.selected, color: 'emerald' },
        ].map(({ label, value, color }) => (
          <div key={label} className="text-center">
            <p className={`text-3xl font-black text-${color}-600`}>{value}</p>
            <p className="text-xs text-gray-500 mt-1 font-medium">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// ── STUDENT VIEW ──────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
const StudentJobDetail = ({ job, deadline, navigate, backPath, dashPath }) => {
  const isExpired = deadline.text === 'Expired';
  const isClosed  = job.status === 'Closed' || job.status === 'Cancelled';

  return (
    <div className="min-h-screen bg-[#f0f4f8]" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* Top nav strip */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center gap-3">
        <button onClick={() => navigate(backPath)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 font-medium transition-colors">
          <ArrowLeft className="w-4 h-4" /> Jobs
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
        <span className="text-sm font-semibold text-gray-800 truncate max-w-[220px]">{job.jobTitle}</span>
        <div className="flex-1" />
        <button onClick={() => navigate(dashPath)} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors">
          <Home className="w-4 h-4" /> Dashboard
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-5">

        {/* ── Hero Card ── */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">

          {/* Colorful top band */}
          <div className="h-2 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600" />

          <div className="p-6">
            <div className="flex items-start gap-5">
              {/* Company Logo */}
              <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                {job.companyId?.logo
                  ? <img src={job.companyId.logo} alt="" className="w-full h-full object-contain p-1" />
                  : <span className="text-2xl font-black text-blue-600">{job.companyId?.name?.charAt(0) || 'C'}</span>}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">{job.jobTitle}</h1>
                    <p className="text-base text-gray-500 font-semibold mt-0.5">{job.companyId?.displayName || job.companyId?.name}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {job.isPinned && (
                      <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full border border-amber-200">
                        <Star className="w-3 h-3 fill-current" /> Featured
                      </span>
                    )}
                    <span className={`px-3 py-1 text-xs font-bold rounded-full border ${
                      isClosed || isExpired ? 'bg-red-50 text-red-600 border-red-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {isClosed ? 'Closed' : isExpired ? 'Expired' : 'Active'}
                    </span>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg border border-blue-100">{job.jobType}</span>
                  <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-lg">{job.jobRole}</span>
                  {job.jobCode && <span className="flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-500 text-xs rounded-lg"><Hash className="w-3 h-3" />{job.jobCode}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Quick stats bar */}
          <div className="border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-100">
            {[
              { icon: DollarSign, label: 'CTC', value: `₹${job.package.ctc.min}${job.package.ctc.max ? `–${job.package.ctc.max}` : ''} LPA`, color: 'text-emerald-600' },
              { icon: MapPin, label: 'Location', value: job.locations?.[0]?.city || 'Multiple', color: 'text-blue-600' },
              { icon: Building2, label: 'Work Mode', value: job.locations?.[0]?.workMode || 'On-site', color: 'text-violet-600' },
              { icon: Clock, label: 'Deadline', value: deadline.text, color: deadline.text === 'Expired' ? 'text-red-500' : 'text-orange-500' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="flex items-center gap-3 px-5 py-4">
                <Icon className={`w-4 h-4 shrink-0 ${color}`} />
                <div>
                  <p className="text-[11px] text-gray-400 font-medium">{label}</p>
                  <p className={`text-sm font-bold ${color}`}>{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Dates card ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Important Dates</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Posted', val: job.dates.posted },
              { label: 'Deadline', val: job.dates.applicationDeadline },
              { label: 'Interview', val: job.dates.interviewDate },
              { label: 'Result', val: job.dates.resultDate },
            ].filter(d => d.val).map(({ label, val }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">{label}</p>
                <p className="text-sm font-bold text-gray-800 mt-0.5">
                  {new Date(val).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Details ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <JobDetailsContent job={job} deadline={deadline} isStudent />
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// ── ADMIN VIEW (CollegeAdmin + SuperAdmin) ────────────────────
// ─────────────────────────────────────────────────────────────
const AdminJobDetail = ({ job, deadline, navigate, backPath, dashPath, isCollegeAdmin, jobId }) => {
  const [activeTab, setActiveTab] = useState('details');
  const isExpired = deadline.text === 'Expired';
  const isClosed  = job.status === 'Closed' || job.status === 'Cancelled';

  const accentFrom = isCollegeAdmin ? 'from-blue-600 via-blue-500 to-cyan-500' : 'from-blue-700 via-blue-600 to-cyan-600';

  const tabs = [
    { id: 'details', label: 'Job Details', icon: FileText },
    ...(isCollegeAdmin ? [
      { id: 'matched', label: 'Matched Students', icon: Zap, badge: 'AI' },
      { id: 'results', label: 'Assessment Results', icon: BarChart3 },
    ] : []),
  ];

  return (
    <div className="space-y-5">

      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-2 text-sm">
        <button onClick={() => navigate(dashPath)} className="text-gray-400 hover:text-gray-600 font-medium transition-colors flex items-center gap-1">
          <Home className="w-3.5 h-3.5" /> Dashboard
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
        <button onClick={() => navigate(backPath)} className="text-gray-400 hover:text-gray-600 font-medium transition-colors">Jobs</button>
        <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
        <span className="text-gray-700 font-semibold truncate max-w-[200px]">{job.jobTitle}</span>
      </div>

      {/* ── Hero Header Card ── */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">

        {/* Gradient Header */}
        <div className={`bg-gradient-to-r ${accentFrom} px-6 py-6`}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-4">
              {/* Logo */}
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shrink-0 overflow-hidden">
                {job.companyId?.logo
                  ? <img src={job.companyId.logo} alt="" className="w-full h-full object-contain p-1" />
                  : <span className="text-2xl font-black text-white">{job.companyId?.name?.charAt(0) || 'C'}</span>}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  {job.isPinned && (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-400/90 text-yellow-900 text-xs font-black rounded-full">
                      <Star className="w-3 h-3 fill-current" /> FEATURED
                    </span>
                  )}
                  <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${isClosed || isExpired ? 'bg-red-400/80 text-white' : 'bg-emerald-400/80 text-white'}`}>
                    {isClosed ? 'CLOSED' : isExpired ? 'EXPIRED' : 'ACTIVE'}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">{job.jobTitle}</h1>
                <p className="text-blue-100 text-base font-semibold mt-0.5">{job.companyId?.displayName || job.companyId?.name}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="px-2.5 py-1 bg-white/20 text-white text-xs font-semibold rounded-full">{job.jobType}</span>
                  <span className="px-2.5 py-1 bg-white/20 text-white text-xs font-semibold rounded-full">{job.jobRole}</span>
                  {job.jobCode && <span className="flex items-center gap-1 px-2.5 py-1 bg-white/15 text-white/80 text-xs rounded-full"><Hash className="w-3 h-3" />{job.jobCode}</span>}
                </div>
              </div>
            </div>

            {/* Stats mini */}
            <div className="flex gap-3 shrink-0">
              {[
                { label: 'Applications', val: job.stats.totalApplications },
                { label: 'Shortlisted', val: job.stats.shortlisted },
                { label: 'Selected', val: job.stats.selected },
              ].map(({ label, val }) => (
                <div key={label} className="text-center bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/20">
                  <p className="text-xl font-black text-white">{val}</p>
                  <p className="text-[10px] text-blue-100 font-medium">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick info bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-100 border-t border-gray-100">
          {[
            { icon: DollarSign, label: 'CTC', value: `₹${job.package.ctc.min}${job.package.ctc.max ? `–${job.package.ctc.max}` : ''} LPA`, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { icon: MapPin, label: 'Location', value: job.locations?.[0]?.city || 'Multiple', color: 'text-blue-600', bg: 'bg-blue-50' },
            { icon: Building2, label: 'Work Mode', value: job.locations?.[0]?.workMode || 'On-site', color: 'text-violet-600', bg: 'bg-violet-50' },
            { icon: Clock, label: 'Deadline', value: deadline.text, color: isExpired ? 'text-red-500' : 'text-amber-600', bg: isExpired ? 'bg-red-50' : 'bg-amber-50' },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className="flex items-center gap-3 px-5 py-4">
              <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center shrink-0`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div>
                <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide">{label}</p>
                <p className={`text-sm font-bold ${color}`}>{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Dates Strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Posted', val: job.dates.posted, icon: Calendar },
          { label: 'Deadline', val: job.dates.applicationDeadline, icon: Clock },
          { label: 'Interview', val: job.dates.interviewDate, icon: Users },
          { label: 'Result', val: job.dates.resultDate, icon: Trophy },
        ].filter(d => d.val).map(({ label, val, icon: Icon }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">{label}</p>
              <p className="text-xs font-bold text-gray-800">
                {new Date(val).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs Card ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        {/* Tab bar */}
        <div className="flex border-b border-gray-100 bg-gray-50/60 px-2 pt-2 gap-1">
          {tabs.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-t-xl text-sm font-bold transition-all relative ${
                activeTab === id
                  ? 'bg-white text-blue-600 shadow-sm border border-gray-100 border-b-white -mb-px z-10'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-white/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {badge && (
                <span className="px-1.5 py-0.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-[10px] font-black rounded-full">{badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-6">
          {activeTab === 'results' && isCollegeAdmin ? (
            <AssessmentResultsPanel jobId={jobId} />
          ) : activeTab === 'matched' && isCollegeAdmin ? (
            <MatchedStudentsPanel jobId={jobId} job={job} />
          ) : (
            <JobDetailsContent job={job} deadline={deadline} isStudent={false} />
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// ── Main JobDetail Component ──────────────────────────────────
// ─────────────────────────────────────────────────────────────
const JobDetail = () => {
  const { jobId }  = useParams();
  const navigate   = useNavigate();
  const location   = useLocation();
  const { user }   = useAuth();
  const { isCollegeAdmin, isSuperAdmin, isStudent } = useRole();

  const backPath = isSuperAdmin ? '/dashboard/super-admin/companies'
    : isCollegeAdmin ? '/dashboard/college-admin/jobs'
    : '/dashboard/student/jobs';

  const dashPath = isSuperAdmin ? '/dashboard/super-admin'
    : isCollegeAdmin ? '/dashboard/college-admin'
    : '/dashboard/student';

  const [job, setJob]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true); setError(null);
        const res = await window.jobAPI.getJobById(jobId);
        if (res.success) setJob(res.job);
        else setError('Job not found');
      } catch (err) { setError(err.message); }
      finally { setLoading(false); }
    })();
  }, [jobId]);

  const formatDeadline = (d) => {
    const date = new Date(d);
    const days = Math.ceil((date - new Date()) / (1000 * 60 * 60 * 24));
    if (days < 0) return { text: 'Expired', cls: 'text-red-600' };
    if (days === 0) return { text: 'Today', cls: 'text-orange-600' };
    if (days === 1) return { text: '1 day left', cls: 'text-orange-500' };
    if (days <= 7)  return { text: `${days}d left`, cls: 'text-yellow-600' };
    return { text: `${days} days left`, cls: 'text-emerald-600' };
  };

  // Loading
  if (loading) {
    const isAdm = !isStudent;
    return (
      <div className={`min-h-screen flex items-center justify-center ${isAdm ? 'bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50' : 'bg-[#f0f4f8]'}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-gray-500 font-semibold text-sm">Loading job details…</p>
        </div>
      </div>
    );
  }

  // Error
  if (error || !job) {
    return (
      <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-red-200 p-10 text-center max-w-md w-full shadow-sm">
          <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <h3 className="text-lg font-black text-gray-900 mb-1">Job Not Found</h3>
          <p className="text-gray-500 text-sm mb-5">{error || 'This job posting is unavailable.'}</p>
          <button onClick={() => navigate(backPath)}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors">
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  const deadline = formatDeadline(job.dates.applicationDeadline);

  // Render based on role
  if (isStudent) {
    return <StudentJobDetail job={job} deadline={deadline} navigate={navigate} backPath={backPath} dashPath={dashPath} />;
  }

  return (
    <div className="bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 min-h-screen py-6 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <AdminJobDetail
          job={job}
          deadline={deadline}
          navigate={navigate}
          backPath={backPath}
          dashPath={dashPath}
          isCollegeAdmin={isCollegeAdmin}
          jobId={jobId}
        />
      </div>
    </div>
  );
};

export default JobDetail;