// src/pages/jobs/JobDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeft, Briefcase, MapPin, DollarSign, Clock,
  Building2, Users, Award, CheckCircle, XCircle,
  AlertCircle, TrendingUp, Target, GraduationCap,
  Home, Search, ChevronDown, ChevronUp, FileText, Zap,
  BarChart3, ClipboardList,
} from 'lucide-react';
import { assessmentAPI, assessmentAttemptAPI } from '../../api/Api';

// ─────────────────────────────────────────────────────────────
// SVG Circular Match Ring
// ─────────────────────────────────────────────────────────────
const MatchRing = ({ pct }) => {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const filled = circ * (pct / 100);
  const color =
    pct >= 80 ? '#16a34a' :
    pct >= 60 ? '#2563eb' :
    pct >= 40 ? '#f59e0b' : '#dc2626';
  return (
    <svg width="56" height="56" className="shrink-0" viewBox="0 0 56 56">
      <circle cx="28" cy="28" r={r} fill="none" stroke="#e5e7eb" strokeWidth="4" />
      <circle
        cx="28" cy="28" r={r}
        fill="none" stroke={color} strokeWidth="4"
        strokeDasharray={`${filled} ${circ - filled}`}
        strokeLinecap="round"
        transform="rotate(-90 28 28)"
      />
      <text x="28" y="33" textAnchor="middle" fontSize="10" fontWeight="700" fill={color}>
        {pct}%
      </text>
    </svg>
  );
};

// ─────────────────────────────────────────────────────────────
// Breakdown Bar (per-criterion score display)
// ─────────────────────────────────────────────────────────────
const BreakdownBar = ({ label, pts, max, emoji }) => {
  const pct = max > 0 ? Math.round(((pts || 0) / max) * 100) : 0;
  const barColor =
    pct >= 80 ? 'bg-green-500' :
    pct >= 50 ? 'bg-blue-500' :
    pct >= 30 ? 'bg-yellow-500' : 'bg-red-400';
  return (
    <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs font-semibold text-gray-600">{emoji} {label}</span>
        <span className="text-xs font-bold text-gray-800">{pts ?? 0}/{max}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Assessment Results Panel — College Admin only
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
  const scoreBg    = (pct) => pct >= 70 ? 'bg-emerald-50 border-emerald-100' : pct >= 40 ? 'bg-blue-50 border-blue-100' : 'bg-red-50 border-red-100';

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      <p className="text-gray-500 font-medium">Loading assessment results…</p>
    </div>
  );

  if (!assessments.length) return (
    <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
      <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
      <p className="text-gray-500 font-medium">No assessments linked to this JD</p>
      <p className="text-gray-400 text-sm mt-1">Create an assessment and link it to this job description to see results here.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-blue-700">{assessments.length}</p>
          <p className="text-xs text-blue-600 mt-1 font-medium">Linked Assessments</p>
        </div>
        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-purple-700">{assessments.reduce((s,a) => s + (a.eligible_students?.length || 0), 0)}</p>
          <p className="text-xs text-purple-600 mt-1 font-medium">Total Assigned</p>
        </div>
        <div className="bg-cyan-50 border border-cyan-100 rounded-xl p-4 text-center col-span-2 md:col-span-1">
          <p className="text-2xl font-bold text-cyan-700">{assessments.reduce((s,a) => s + (a.questions_id?.length || 0), 0)}</p>
          <p className="text-xs text-cyan-600 mt-1 font-medium">Total Questions</p>
        </div>
      </div>

      {/* Assessment list */}
      {assessments.map(a => {
        const attempts = attemptMap[a._id] || [];
        const isOpen   = expanded === a._id;
        const avgScore = attempts.length
          ? Math.round(attempts.reduce((s, at) => s + (at.score_percentage || 0), 0) / attempts.length)
          : null;
        const passed   = attempts.filter(at => (at.score_percentage || 0) >= 70).length;

        return (
          <div key={a._id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Assessment header */}
            <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shrink-0">
                  <ClipboardList className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm">
                    {a.skill_id?.name || a.tags?.[0] || 'Assessment'}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium
                      ${a.level === 'Beginner' ? 'bg-green-100 text-green-700'
                        : a.level === 'Intermediate' ? 'bg-blue-100 text-blue-700'
                        : 'bg-purple-100 text-purple-700'}`}>{a.level}</span>
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
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-all"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  {isOpen ? 'Hide' : 'View Results'}
                </button>
              </div>
            </div>

            {/* Attempts table */}
            {isOpen && (
              <div className="p-4">
                {/* Quick stats */}
                {attempts.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <div className="text-xl font-bold text-gray-700">{attempts.length}</div>
                      <div className="text-xs text-gray-500">Attempts</div>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-3 text-center">
                      <div className="text-xl font-bold text-emerald-600">{passed}</div>
                      <div className="text-xs text-gray-500">Passed ≥70%</div>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-3 text-center">
                      <div className="text-xl font-bold text-blue-600">{avgScore ?? '—'}%</div>
                      <div className="text-xs text-gray-500">Avg Score</div>
                    </div>
                  </div>
                )}

                {attempts.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">No students have attempted this assessment yet.</div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-gray-100">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Student</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Score</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Correct</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Marks</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Submitted</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {[...attempts].sort((a,b) => (b.score_percentage||0)-(a.score_percentage||0)).map((at, idx) => (
                          <tr key={at._id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                            <td className="px-4 py-3 text-xs font-bold text-gray-400">
                              {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx+1}`}
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
                              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${scoreBg(at.score_percentage||0)}`}>
                                <span className={scoreColor(at.score_percentage||0)}>{at.score_percentage || 0}%</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center text-xs font-semibold text-gray-600">{at.correct_answers||0}/{at.total_questions||0}</td>
                            <td className="px-4 py-3 text-center text-xs font-semibold text-gray-600">{at.earned_marks||0}/{at.total_marks||0}</td>
                            <td className="px-4 py-3 text-xs text-gray-400">
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
// Matched Students Panel — College Admin only
// ─────────────────────────────────────────────────────────────
const MatchedStudentsPanel = ({ jobId, job }) => {
  const [students, setStudents]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [summary, setSummary]         = useState({ total: 0, eligible: 0 });
  const [search, setSearch]           = useState('');
  const [filterMode, setFilterMode]   = useState('all');   // all | eligible | ineligible
  const [sortField, setSortField]     = useState('matchPercentage');
  const [sortDir, setSortDir]         = useState('desc');
  const [expandedId, setExpandedId]   = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await window.jobAPI.getMatchedStudents(jobId);
        if (res.success) {
          setStudents(res.matchedStudents || []);
          setSummary({ total: res.total || 0, eligible: res.eligible || 0 });
        }
      } catch (e) {
        console.error('Matched students fetch error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [jobId]);

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const SortBtn = ({ field, children }) => (
    <button onClick={() => toggleSort(field)} className="flex items-center gap-1">
      {children}
      {sortField === field
        ? sortDir === 'desc'
          ? <ChevronDown className="w-3 h-3 text-blue-600" />
          : <ChevronUp className="w-3 h-3 text-blue-600" />
        : <ChevronUp className="w-3 h-3 opacity-25" />}
    </button>
  );

  const displayed = students
    .filter(s => {
      const q = search.toLowerCase();
      const ok = !q ||
        s.fullName?.toLowerCase().includes(q) ||
        s.studentInfo?.rollNumber?.toLowerCase().includes(q) ||
        s.studentInfo?.branch?.toLowerCase().includes(q);
      if (!ok) return false;
      if (filterMode === 'eligible')   return s.isEligible;
      if (filterMode === 'ineligible') return !s.isEligible;
      return true;
    })
    .sort((a, b) => {
      let av, bv;
      if (sortField === 'cgpa') {
        av = a.studentInfo?.cgpa || 0;
        bv = b.studentInfo?.cgpa || 0;
      } else if (sortField === 'name') {
        return sortDir === 'asc'
          ? (a.fullName || '').localeCompare(b.fullName || '')
          : (b.fullName || '').localeCompare(a.fullName || '');
      } else {
        av = a.matchPercentage;
        bv = b.matchPercentage;
      }
      return sortDir === 'desc' ? bv - av : av - bv;
    });

  const high75 = students.filter(s => s.matchPercentage >= 75).length;
  const avgPct = students.length
    ? Math.round(students.reduce((sum, s) => sum + s.matchPercentage, 0) / students.length)
    : 0;

  // Scoring weights — kept in sync with backend
  const WEIGHTS = { branch: 25, batch: 15, cgpa: 20, skills: 30, hygiene: 10 };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      <p className="text-gray-500 font-medium">Computing student matches…</p>
      <p className="text-gray-400 text-sm">Analysing skills, CGPA, branch & batch</p>
    </div>
  );

  return (
    <div>
      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Students',    value: summary.total,   color: 'blue'   },
          { label: 'Fully Eligible',    value: summary.eligible, color: 'green' },
          { label: 'High Match ≥75%',   value: high75,           color: 'purple' },
          { label: 'Avg Match %',       value: `${avgPct}%`,     color: 'cyan'  },
        ].map(({ label, value, color }) => (
          <div key={label} className={`bg-${color}-50 border border-${color}-100 rounded-xl p-4 text-center`}>
            <p className={`text-2xl font-bold text-${color}-700`}>{value}</p>
            <p className={`text-xs text-${color}-600 mt-1 font-medium`}>{label}</p>
          </div>
        ))}
      </div>

      {/* ── Controls ── */}
      <div className="flex flex-col md:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, roll no, branch…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { id: 'all',        label: `All (${students.length})` },
            { id: 'eligible',   label: `✅ Eligible (${summary.eligible})` },
            { id: 'ineligible', label: `❌ Ineligible (${summary.total - summary.eligible})` },
          ].map(({ id, label }) => (
            <button key={id} onClick={() => setFilterMode(id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                filterMode === id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── JD Required Skills chips (for reference) ── */}
      {job?.preferredSkills?.length > 0 && (
        <div className="mb-5 p-3 bg-gray-50 rounded-xl border border-gray-100">
          <p className="text-xs font-semibold text-gray-500 mb-2">JD Required Skills:</p>
          <div className="flex flex-wrap gap-1.5">
            {job.preferredSkills.map((sk, i) => (
              <span key={i} className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                {sk}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Table ── */}
      {displayed.length === 0 ? (
        <div className="text-center py-14 border-2 border-dashed border-gray-200 rounded-2xl">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No students found</p>
          <p className="text-gray-400 text-sm mt-1">
            {students.length === 0
              ? 'No students registered in this college yet'
              : 'Try adjusting your search or filter'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-blue-50 to-cyan-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <SortBtn field="name">Student</SortBtn>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Branch / Batch</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <SortBtn field="cgpa">CGPA</SortBtn>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Matched Skills</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Eligible</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <SortBtn field="matchPercentage">Match %</SortBtn>
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayed.map((s, idx) => {
                const si = s.studentInfo || {};
                const isOpen = expandedId === s._id;

                const rowBg = s.isEligible
                  ? idx % 2 === 0 ? 'bg-green-50/30' : 'bg-green-50/50'
                  : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40';

                return (
                  <>
                    <tr key={s._id} className={`${rowBg} hover:bg-blue-50/50 transition-colors`}>
                      {/* Rank */}
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-bold ${
                          idx === 0 ? 'text-yellow-600' :
                          idx === 1 ? 'text-gray-500' :
                          idx === 2 ? 'text-orange-500' : 'text-gray-400'
                        }`}>
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                        </span>
                      </td>

                      {/* Student */}
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

                      {/* Branch / Batch */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className={`px-2 py-0.5 rounded-md text-xs font-semibold w-fit ${
                            job?.eligibility?.branches?.includes(si.branch)
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-600'
                          }`}>{si.branch || '—'}</span>
                          <span className={`px-2 py-0.5 rounded-md text-xs font-medium w-fit ${
                            job?.eligibility?.batches?.includes(String(si.batch))
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-orange-100 text-orange-600'
                          }`}>{si.batch || '—'}</span>
                        </div>
                      </td>

                      {/* CGPA */}
                      <td className="px-4 py-3 text-center">
                        <span className={`text-base font-bold ${
                          si.cgpa >= (job?.eligibility?.minCGPA || 0)
                            ? 'text-green-700' : 'text-red-600'
                        }`}>
                          {si.cgpa ?? '—'}
                        </span>
                        {job?.eligibility?.minCGPA > 0 && (
                          <p className="text-xs text-gray-400">min {job.eligibility.minCGPA}</p>
                        )}
                      </td>

                      {/* Matched Skills */}
                      <td className="px-4 py-3 max-w-[200px]">
                        {s.matchedSkills?.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {s.matchedSkills.slice(0, 3).map((sk, i) => (
                              <span key={i} className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                ✓ {sk}
                              </span>
                            ))}
                            {s.matchedSkills.length > 3 && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs">
                                +{s.matchedSkills.length - 3} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs italic">No profile skills</span>
                        )}
                      </td>

                      {/* Eligible */}
                      <td className="px-4 py-3 text-center">
                        {s.isEligible
                          ? <div className="flex flex-col items-center"><CheckCircle className="w-5 h-5 text-green-600" /><span className="text-xs text-green-600 font-medium mt-0.5">Yes</span></div>
                          : <div className="flex flex-col items-center"><XCircle className="w-5 h-5 text-red-400" /><span className="text-xs text-red-400 font-medium mt-0.5">No</span></div>}
                      </td>

                      {/* Match Ring */}
                      <td className="px-4 py-3">
                        <div className="flex justify-center">
                          <MatchRing pct={s.matchPercentage} />
                        </div>
                      </td>

                      {/* Expand */}
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setExpandedId(isOpen ? null : s._id)}
                          className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600 transition-colors"
                        >
                          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>

                    {/* ── Expanded Breakdown Row ── */}
                    {isOpen && (
                      <tr key={`${s._id}-expand`} className="bg-gradient-to-br from-blue-50/80 to-cyan-50/80">
                        <td colSpan={8} className="px-6 py-5">
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                            <BreakdownBar label="Branch" pts={s.breakdown?.branch} max={WEIGHTS.branch} emoji="🏫" />
                            <BreakdownBar label="Batch"  pts={s.breakdown?.batch}  max={WEIGHTS.batch}  emoji="📅" />
                            <BreakdownBar label="CGPA"   pts={s.breakdown?.cgpa}   max={WEIGHTS.cgpa}   emoji="📊" />
                            <BreakdownBar label="Skills" pts={s.breakdown?.skills} max={WEIGHTS.skills} emoji="💡" />
                            <BreakdownBar label="Hygiene" pts={s.breakdown?.hygiene} max={WEIGHTS.hygiene} emoji="✅" />
                          </div>

                          {/* All student skills */}
                          {s.skills?.length > 0 && (
                            <div className="mb-3">
                              <p className="text-xs font-semibold text-gray-500 mb-2">All skills on student profile:</p>
                              <div className="flex flex-wrap gap-1.5">
                                {s.skills.map((sk, i) => {
                                  const isMatch = s.matchedSkills?.some(m => m.toLowerCase() === sk.toLowerCase());
                                  return (
                                    <span key={i} className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                      isMatch
                                        ? 'bg-green-100 text-green-700 border border-green-300 font-semibold'
                                        : 'bg-gray-100 text-gray-600'
                                    }`}>
                                      {isMatch ? '✓ ' : ''}{sk}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Warnings */}
                          {((si.activeBacklogs || 0) > 0 || (si.totalBacklogs || 0) > 0 || (si.gapYears || 0) > 0 || si.isPlaced) && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {si.isPlaced && <span className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">🎓 Already Placed</span>}
                              {(si.activeBacklogs || 0) > 0 && <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs">⚠ Active Backlogs: {si.activeBacklogs}</span>}
                              {(si.totalBacklogs || 0) > 0  && <span className="px-2.5 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">Total Backlogs: {si.totalBacklogs}</span>}
                              {(si.gapYears || 0) > 0       && <span className="px-2.5 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">Gap Years: {si.gapYears}</span>}
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

      <p className="text-xs text-gray-400 mt-3 text-right">
        Showing {displayed.length} of {students.length} students · Sorted by {sortField} ({sortDir})
      </p>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Main JobDetail Component
// ─────────────────────────────────────────────────────────────
const JobDetail = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const isCollegeAdmin = location.pathname.startsWith('/dashboard/college-admin');
  const isSuperAdmin   = location.pathname.startsWith('/dashboard/super-admin');

  const backToJobsPath = isSuperAdmin   ? '/dashboard/super-admin/companies'
    : isCollegeAdmin   ? '/dashboard/college-admin/jobs'
    : '/dashboard/student/jobs';
  const dashboardPath  = isSuperAdmin   ? '/dashboard/super-admin'
    : isCollegeAdmin   ? '/dashboard/college-admin'
    : '/dashboard/student';

  const [job, setJob]                              = useState(null);
  const [loading, setLoading]                      = useState(true);
  const [error, setError]                          = useState(null);
  const [hasApplied, setHasApplied]               = useState(false);
  const [activeTab, setActiveTab]                  = useState('details'); // 'details' | 'matched' | 'results'

  useEffect(() => { fetchJobDetails(); }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true); setError(null);
      const response = await window.jobAPI.getJobById(jobId);
      if (response.success) { setJob(response.job); setHasApplied(response.hasApplied); }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const formatDeadline = (deadline) => {
    const date = new Date(deadline);
    const daysLeft = Math.ceil((date - new Date()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return { text: 'Expired',             cls: 'text-red-600 bg-red-50' };
    if (daysLeft === 0) return { text: 'Today',             cls: 'text-orange-600 bg-orange-50' };
    if (daysLeft === 1) return { text: '1 day left',        cls: 'text-orange-600 bg-orange-50' };
    if (daysLeft <= 7)  return { text: `${daysLeft}d left`, cls: 'text-yellow-600 bg-yellow-50' };
    return { text: `${daysLeft} days left`,                  cls: 'text-green-600 bg-green-50' };
  };

  // ── Loading ──
  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
    </div>
  );

  // ── Error ──
  if (error || !job) return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate(backToJobsPath)} className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-5 h-5" /> Back to Jobs
        </button>
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <p className="text-red-800 text-lg">{error || 'Job not found'}</p>
        </div>
      </div>
    </div>
  );

  const deadline  = formatDeadline(job.dates.applicationDeadline);
  const isExpired = deadline.text === 'Expired';
  const isClosed  = job.status === 'Closed' || job.status === 'Cancelled';

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">

        {/* ── Nav ── */}
        <div className="mb-6 flex items-center gap-4">
          <button onClick={() => navigate(backToJobsPath)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors">
            <ArrowLeft className="w-5 h-5" /> Back to Jobs
          </button>
          <span className="text-gray-300">|</span>
          <button onClick={() => navigate(dashboardPath)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors">
            <Home className="w-5 h-5" /> Dashboard
          </button>
        </div>

        {/* ── Main Card ── */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-white">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                {job.companyId?.logo
                  ? <img src={job.companyId.logo} alt="" className="w-16 h-16 rounded-xl bg-white p-2 object-contain" />
                  : <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center text-blue-600 font-bold text-2xl">
                      {job.companyId?.name?.charAt(0) || 'C'}
                    </div>}
                <div>
                  <h1 className="text-3xl font-bold mb-1">{job.jobTitle}</h1>
                  <p className="text-blue-100 text-lg">{job.companyId?.displayName || job.companyId?.name}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm">{job.jobType}</span>
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm">{job.jobRole}</span>
                  </div>
                </div>
              </div>
              {job.isPinned && (
                <div className="px-4 py-2 bg-yellow-400 text-yellow-900 rounded-lg flex items-center gap-2 font-medium">
                  <TrendingUp className="w-5 h-5" /> Featured
                </div>
              )}
            </div>
          </div>

          {/* Quick Info */}
          <div className="border-b border-gray-200 px-8 py-4 bg-gray-50">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg"><DollarSign className="w-5 h-5 text-green-600" /></div>
                <div>
                  <p className="text-xs text-gray-500">CTC</p>
                  <p className="font-semibold text-gray-900">₹{job.package.ctc.min}{job.package.ctc.max ? ` – ${job.package.ctc.max}` : ''} LPA</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg"><MapPin className="w-5 h-5 text-blue-600" /></div>
                <div>
                  <p className="text-xs text-gray-500">Location</p>
                  <p className="font-semibold text-gray-900 truncate">{job.locations?.[0]?.city || 'Multiple'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg"><Building2 className="w-5 h-5 text-purple-600" /></div>
                <div>
                  <p className="text-xs text-gray-500">Work Mode</p>
                  <p className="font-semibold text-gray-900">{job.locations?.[0]?.workMode || 'On-site'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${deadline.cls.split(' ')[1]}`}>
                  <Clock className={`w-5 h-5 ${deadline.cls.split(' ')[0]}`} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Deadline</p>
                  <p className={`font-semibold ${deadline.cls.split(' ')[0]}`}>{deadline.text}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── TABS (College Admin only) ── */}
          {isCollegeAdmin && (
            <div className="border-b border-gray-200 bg-white px-6">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition-all ${
                    activeTab === 'details'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Job Details
                </button>
                <button
                  onClick={() => setActiveTab('matched')}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition-all ${
                    activeTab === 'matched'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  Matched Students
                  <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-bold">
                    AI
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('results')}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition-all ${
                    activeTab === 'results'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  Assessment Results
                </button>
              </div>
            </div>
          )}

          {/* ── Content ── */}
          <div className="p-8">

            {/* MATCHED STUDENTS TAB */}
            {isCollegeAdmin && activeTab === 'results' ? (
              <AssessmentResultsPanel jobId={jobId} />
            ) : isCollegeAdmin && activeTab === 'matched' ? (
              <MatchedStudentsPanel jobId={jobId} job={job} />
            ) : (

            /* JOB DETAILS TAB */
            <>
              {/* View-only notice — students */}
              {!isCollegeAdmin && !isSuperAdmin && !isExpired && !isClosed && (
                <div className="mb-8 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-5 flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg shrink-0">
                    <Briefcase className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-blue-900">Application via College Portal</p>
                    <p className="text-blue-700 text-sm">Contact your college placement cell to apply for this position.</p>
                  </div>
                </div>
              )}

              {!isCollegeAdmin && !isSuperAdmin && (isExpired || isClosed) && !hasApplied && (
                <div className="mb-8 bg-red-50 border border-red-200 rounded-xl p-5 flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                  <div><p className="font-semibold text-red-900">Applications Closed</p><p className="text-red-700 text-sm">This job is no longer accepting applications</p></div>
                </div>
              )}

              {/* Description */}
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Briefcase className="w-6 h-6 text-blue-600" /> Job Description
                </h2>
                <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">{job.description}</div>
              </section>

              {/* Responsibilities */}
              {job.responsibilities?.length > 0 && (
                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Target className="w-6 h-6 text-blue-600" /> Key Responsibilities
                  </h2>
                  <ul className="space-y-2">
                    {job.responsibilities.map((r, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-gray-700">{r}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Requirements */}
              {job.requirements?.length > 0 && (
                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Award className="w-6 h-6 text-blue-600" /> Requirements
                  </h2>
                  <ul className="space-y-2">
                    {job.requirements.map((r, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                        <span className="text-gray-700">{r}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Preferred Skills */}
              {job.preferredSkills?.length > 0 && (
                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Preferred Skills</h2>
                  <div className="flex flex-wrap gap-2">
                    {job.preferredSkills.map((sk, i) => (
                      <span key={i} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">{sk}</span>
                    ))}
                  </div>
                </section>
              )}

              {/* Eligibility */}
              <section className="mb-8 bg-gray-50 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <GraduationCap className="w-6 h-6 text-blue-600" /> Eligibility Criteria
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Minimum CGPA</p>
                    <p className="text-lg font-semibold text-gray-900">{job.eligibility.minCGPA}/10</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Max Backlogs</p>
                    <p className="text-lg font-semibold text-gray-900">{job.eligibility.maxBacklogs}</p>
                  </div>
                  {job.eligibility.branches?.length > 0 && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-500 mb-2">Eligible Branches</p>
                      <div className="flex flex-wrap gap-2">
                        {job.eligibility.branches.map((b, i) => (
                          <span key={i} className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-sm">{b}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {job.eligibility.batches?.length > 0 && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-500 mb-2">Eligible Batches</p>
                      <div className="flex flex-wrap gap-2">
                        {job.eligibility.batches.map((b, i) => (
                          <span key={i} className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-sm">{b}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Selection Process */}
              {job.selectionProcess?.rounds?.length > 0 && (
                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Selection Process</h2>
                  <div className="space-y-3">
                    {job.selectionProcess.rounds.map((round, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold shrink-0">{i + 1}</div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{round.name}</p>
                          {round.description && <p className="text-sm text-gray-600 mt-0.5">{round.description}</p>}
                        </div>
                        {round.duration && <span className="text-sm text-gray-500">{round.duration}</span>}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Company */}
              {job.companyId && (
                <section className="mb-8 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">About {job.companyId.name}</h2>
                  {job.companyId.description && <p className="text-gray-700 mb-3">{job.companyId.description}</p>}
                  {job.companyId.website && (
                    <a href={job.companyId.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 font-medium">
                      Visit Website →
                    </a>
                  )}
                </section>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-6 bg-gray-50 rounded-xl">
                {[
                  { label: 'Applications', value: job.stats.totalApplications, color: 'text-blue-600' },
                  { label: 'Shortlisted',  value: job.stats.shortlisted,       color: 'text-green-600' },
                  { label: 'Selected',     value: job.stats.selected,          color: 'text-purple-600' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="text-center">
                    <p className={`text-3xl font-bold ${color}`}>{value}</p>
                    <p className="text-sm text-gray-500 mt-1">{label}</p>
                  </div>
                ))}
              </div>
            </>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default JobDetail;