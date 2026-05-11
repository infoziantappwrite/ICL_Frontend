// pages/Trainer/pages/TrainerResultsPage.jsx
// Trainer view of student attempts for an assessment.
// Route: /dashboard/trainer/assessments/:assessmentId/results
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Users, AlertCircle, RefreshCw, CheckCircle2,
  BarChart2, Clock, ClipboardList, Trophy, Eye,
  ChevronLeft as ChevronLeftIcon, ChevronRight, BookOpen,
  X, Medal, TrendingUp, Award, ShieldAlert, Shield, Send,
  Loader, AlertTriangle, Check, Camera, Monitor, Zap,
} from 'lucide-react';
import TrainerDashboardLayout from '../../../components/layout/Trainerdashboardlayout';
import { InlineSkeleton } from '../../../components/common/SkeletonLoader';
import { assessmentAPI, assessmentAttemptAPI } from '../../../api/Api';
import { getViolations } from '../../../services/proctoringService';

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmtTime = (secs) => {
  if (!secs && secs !== 0) return '—';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

const fmtTs = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const ScoreBar = ({ pct }) => {
  const color =
    pct >= 50 ? 'from-green-500 to-emerald-400'
    : pct >= 35 ? 'from-[#003399] to-[#003399]/80'
    : 'from-red-400 to-red-500';
  const textColor =
    pct >= 50 ? 'text-green-700'
    : pct >= 35 ? 'text-[#003399]'
    : 'text-red-600';
  return (
    <div className="flex items-center gap-2 w-36">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${color} rounded-full transition-all`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <span className={`text-sm font-bold ${textColor} tabular-nums w-10 text-right`}>
        {pct}%
      </span>
    </div>
  );
};

const RankBadge = ({ rank }) => {
  if (rank === 1) return <span className="text-yellow-500 font-bold text-lg">🥇</span>;
  if (rank === 2) return <span className="text-slate-400 font-bold text-lg">🥈</span>;
  if (rank === 3) return <span className="text-amber-600 font-bold text-lg">🥉</span>;
  return <span className="text-slate-500 font-semibold text-sm">#{rank}</span>;
};

// ── Risk level helpers ────────────────────────────────────────────────────────
const getRiskLevel = (score) => {
  if (score >= 70) return { label: 'High Risk',   color: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-200',    dot: 'bg-red-500' };
  if (score >= 35) return { label: 'Medium Risk',  color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200',  dot: 'bg-amber-500' };
  if (score > 0)   return { label: 'Low Risk',     color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200',   dot: 'bg-blue-500' };
  return              { label: 'Clean',           color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200',  dot: 'bg-green-500' };
};

const getSeverityStyle = (severity) => {
  if (severity === 'CRITICAL') return 'bg-red-100 text-red-700 border border-red-200';
  if (severity === 'WARNING')  return 'bg-amber-100 text-amber-700 border border-amber-200';
  return 'bg-slate-100 text-slate-600';
};

const getSourceIcon = (source) => {
  if (source === 'camera')  return <Camera size={11} className="shrink-0" />;
  if (source === 'browser') return <Monitor size={11} className="shrink-0" />;
  return <Zap size={11} className="shrink-0" />;
};

// ── Full Proctoring Panel (lazy-loaded when tab opened) ───────────────────────
const ProctoringPanel = ({ attemptId, summary }) => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [preview, setPreview] = useState(null); // snapshot preview URL

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await getViolations(attemptId);
        setData(res);
      } catch (e) {
        setError(e.message || 'Failed to load proctoring events');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [attemptId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader size={24} className="animate-spin text-[#003399]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-600 p-4 bg-red-50 rounded-xl text-sm">
        <AlertCircle size={16} /> {error}
      </div>
    );
  }

  const riskScore = data?.total_risk ?? summary?.risk_score ?? 0;
  const risk = getRiskLevel(riskScore);
  const violations = data?.violations || [];
  const byType = data?.by_type || {};

  // Separate camera snapshots
  const snapshots = violations.filter(v => v.evidence_snapshot);

  return (
    <div className="space-y-5">
      {/* Risk banner */}
      <div className={`flex items-center justify-between gap-3 p-4 rounded-xl border ${risk.bg} ${risk.border}`}>
        <div className="flex items-center gap-3">
          {riskScore > 0
            ? <ShieldAlert size={22} className={risk.color} />
            : <Shield size={22} className={risk.color} />}
          <div>
            <p className={`font-bold text-sm ${risk.color}`}>{risk.label}</p>
            <p className="text-xs text-slate-500">
              {violations.length} event{violations.length !== 1 ? 's' : ''} recorded
            </p>
          </div>
        </div>
        {/* Risk score bar */}
        <div className="flex items-center gap-2">
          <div className="w-32 h-2.5 bg-white/70 rounded-full overflow-hidden border border-slate-200">
            <div
              className={`h-full rounded-full ${riskScore >= 70 ? 'bg-red-500' : riskScore >= 35 ? 'bg-amber-500' : 'bg-blue-400'}`}
              style={{ width: `${Math.min(riskScore, 100)}%` }}
            />
          </div>
          <span className={`text-sm font-bold ${risk.color} tabular-nums`}>{riskScore}/100</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Events',  value: data?.count ?? 0,           icon: <Zap size={14} className="text-slate-500" /> },
          { label: 'Critical',      value: data?.critical_count ?? 0,   icon: <AlertTriangle size={14} className="text-red-500" /> },
          { label: 'Camera Events', value: data?.camera_count ?? 0,     icon: <Camera size={14} className="text-violet-500" /> },
          { label: 'Browser Events',value: data?.browser_count ?? 0,    icon: <Monitor size={14} className="text-blue-500" /> },
        ].map(({ label, value, icon }) => (
          <div key={label} className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
            <div className="flex justify-center mb-1">{icon}</div>
            <p className="text-lg font-bold text-slate-800 tabular-nums">{value}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Event type breakdown */}
      {Object.keys(byType).length > 0 && (
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Event Breakdown</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(byType)
              .sort(([, a], [, b]) => b - a)
              .map(([type, count]) => (
                <span
                  key={type}
                  className="inline-flex items-center gap-1.5 bg-white text-slate-700 text-xs font-medium px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm"
                >
                  <span className="font-bold text-[#003399]">{count}×</span>
                  {type.replace(/_/g, ' ')}
                </span>
              ))}
          </div>
        </div>
      )}

      {/* Evidence snapshots */}
      {snapshots.length > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">
            Camera Evidence ({snapshots.length})
          </p>
          <div className="flex flex-wrap gap-3">
            {snapshots.slice(0, 12).map((v, i) => (
              <button
                key={i}
                onClick={() => setPreview(v.evidence_snapshot)}
                className="relative group"
                title={`${v.event_type} at ${fmtTs(v.createdAt)}`}
              >
                <img
                  src={v.evidence_snapshot}
                  alt={v.event_type}
                  className="w-20 h-14 object-cover rounded-lg border-2 border-slate-200 group-hover:border-[#003399] transition"
                />
                <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 rounded-lg transition text-white text-[9px] font-bold opacity-0 group-hover:opacity-100">
                  View
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Event timeline */}
      {violations.length > 0 ? (
        <div>
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">
            Event Timeline
          </p>
          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
            {violations.map((v, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100 hover:border-slate-200 transition"
              >
                <div className={`mt-0.5 flex items-center gap-1 shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded ${getSeverityStyle(v.severity)}`}>
                  {getSourceIcon(v.source)}
                  {v.severity}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-700 truncate">
                    {v.event_type?.replace(/_/g, ' ')}
                  </p>
                  {v.details && Object.keys(v.details).length > 0 && (
                    <p className="text-[10px] text-slate-400 truncate">
                      {Object.entries(v.details).map(([k, val]) => `${k}: ${val}`).join(' · ')}
                    </p>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 shrink-0 tabular-nums">
                  {fmtTs(v.createdAt || v.client_timestamp)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-center text-slate-400 py-8 text-sm">No proctoring events recorded.</p>
      )}

      {/* Snapshot lightbox */}
      {preview && (
        <div
          className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <div className="relative max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setPreview(null)}
              className="absolute -top-10 right-0 text-white hover:text-slate-300"
            >
              <X size={22} />
            </button>
            <img src={preview} alt="Evidence snapshot" className="w-full rounded-xl shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  );
};

// ── Attempt Detail Modal ─────────────────────────────────────────────────────
const AttemptDetailModal = ({ attempt, assessmentId, courseId, groupId, onClose }) => {
  const [detail, setDetail]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [tab, setTab]         = useState('answers'); // 'answers' | 'proctoring'

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await assessmentAttemptAPI.getTrainerAttemptDetail(attempt._id, {
          assessment_id: assessmentId,
          course_id:     courseId,
          group_id:      groupId,
        });
        setDetail(res);
      } catch (e) {
        setError(e.message || 'Failed to load attempt detail');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [attempt._id, assessmentId, courseId, groupId]);

  const student = detail?.student || attempt.student_id || {};
  const summary = detail?.summary || {};
  const answers = detail?.answers || [];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {student.fullName || '—'}
            </h2>
            <p className="text-xs text-slate-500">{student.email}</p>
          </div>
          <div className="flex items-center gap-3">
            {summary.score_percentage !== undefined && (
              <div className={`px-3 py-1 rounded-full text-sm font-bold border ${
                summary.score_percentage >= 50
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-red-50 text-red-600 border-red-200'
              }`}>
                {summary.score_percentage}% — {summary.score_percentage >= 50 ? 'Pass' : 'Fail'}
              </div>
            )}
            {/* Proctoring quick flag in header */}
            {attempt.proctoring_flagged && (
              <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 text-xs font-semibold px-2.5 py-1 rounded-full border border-red-200">
                <ShieldAlert size={12} /> Flagged
              </span>
            )}
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-3">
          {['answers', 'proctoring'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                tab === t
                  ? 'bg-[#003399] text-white'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {t === 'answers' ? 'Answer Sheet' : (
                <span className="flex items-center gap-1.5">
                  Proctoring
                  {attempt.proctoring_flagged && (
                    <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                  )}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader size={28} className="animate-spin text-[#003399]" />
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 text-red-600 p-4 bg-red-50 rounded-xl">
              <AlertCircle size={18} /> {error}
            </div>
          ) : tab === 'answers' ? (
            <>
              {/* Summary row */}
              <div className="grid grid-cols-4 gap-3 mb-5">
                {[
                  { label: 'Score', value: `${summary.earned_marks || 0} / ${summary.total_marks || 0}` },
                  { label: 'Correct', value: `${summary.correct_answers || 0} / ${summary.total_questions || 0}` },
                  { label: 'Time', value: fmtTime(summary.time_taken_seconds) },
                  { label: 'Submitted', value: fmtDate(summary.submitted_at) },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-slate-500 mb-1">{label}</p>
                    <p className="text-sm font-bold text-slate-800">{value}</p>
                  </div>
                ))}
              </div>

              {/* Answers list */}
              <div className="space-y-4">
                {answers.length === 0 ? (
                  <p className="text-center text-slate-400 py-8">No answers recorded.</p>
                ) : (
                  answers.map((ans, i) => (
                    <div
                      key={i}
                      className={`rounded-xl border p-4 ${
                        ans.is_correct
                          ? 'border-green-200 bg-green-50/40'
                          : 'border-red-200 bg-red-50/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <p className="text-sm font-medium text-slate-800 flex-1">
                          <span className="font-bold text-slate-500 mr-2">Q{i + 1}.</span>
                          {ans.question_text}
                        </p>
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold shrink-0 ${
                          ans.is_correct
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-600'
                        }`}>
                          {ans.is_correct ? <Check size={11} /> : <X size={11} />}
                          {ans.marks_earned}/{ans.marks}
                        </div>
                      </div>

                      {ans.question_type === 'coding' || ans.question_type === 'sql' ? (
                        <div className="mt-2 space-y-1">
                          <p className="text-xs text-slate-500">
                            Test Cases: <span className="font-bold text-slate-700">{ans.passed_count}/{ans.total_count} passed</span>
                            {ans.code_language && <span className="ml-2 text-slate-400">({ans.code_language})</span>}
                          </p>
                          {ans.student_code && (
                            <pre className="mt-2 p-3 bg-slate-800 text-green-300 rounded-lg text-xs overflow-x-auto max-h-40">
                              {ans.student_code}
                            </pre>
                          )}
                        </div>
                      ) : (
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-slate-500">Student answer: </span>
                            <span className={`font-semibold ${ans.is_correct ? 'text-green-700' : 'text-red-600'}`}>
                              {Array.isArray(ans.student_answer)
                                ? ans.student_answer.join(', ')
                                : (ans.student_answer ?? '—')}
                            </span>
                          </div>
                          {!ans.is_correct && (
                            <div>
                              <span className="text-slate-500">Correct answer: </span>
                              <span className="font-semibold text-green-700">
                                {Array.isArray(ans.correct_answer)
                                  ? ans.correct_answer.join(', ')
                                  : (ans.correct_answer ?? '—')}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            /* ── Proctoring Tab ── */
            <ProctoringPanel
              attemptId={attempt._id}
              summary={detail?.proctoring}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main Page ────────────────────────────────────────────────────────────────
export default function TrainerResultsPage() {
  const { assessmentId } = useParams();
  const navigate = useNavigate();

  // Assessment meta (loaded first to extract course_id and group_id)
  const [assessment, setAssessment]     = useState(null);
  const [courseId, setCourseId]         = useState('');
  const [groupId, setGroupId]           = useState('');

  // Results data
  const [results, setResults]           = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [page, setPage]                 = useState(1);

  // UI state
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [publishing, setPublishing]           = useState(false);
  const [publishMsg, setPublishMsg]           = useState('');

  // ── Load assessment meta ─────────────────────────────────────────────────
  useEffect(() => {
    const loadMeta = async () => {
      try {
        const res = await assessmentAPI.getAssessment(assessmentId);
        const a = res?.assessment || res;
        setAssessment(a);

        // Extract course_id
        const cid = a?.course_id?._id || a?.course_id || '';
        setCourseId(String(cid));

        // Extract group_id (first group)
        const gid = a?.groups?.[0]?._id || a?.groups?.[0] || '';
        setGroupId(String(gid));
      } catch (e) {
        setError('Failed to load assessment details: ' + (e.message || ''));
        setLoading(false);
      }
    };
    loadMeta();
  }, [assessmentId]);

  // ── Load results when we have course+group ───────────────────────────────
  const loadResults = useCallback(async (pg = 1) => {
    if (!courseId || !groupId) return;
    try {
      setLoading(true);
      setError('');
      const res = await assessmentAttemptAPI.getTrainerResults({
        assessment_id: assessmentId,
        course_id:     courseId,
        group_id:      groupId,
        page:          pg,
        limit:         20,
      });
      setResults(res);
      setPage(pg);
    } catch (e) {
      setError(e.message || 'Failed to load results');
    } finally {
      setLoading(false);
    }
  }, [assessmentId, courseId, groupId]);

  useEffect(() => {
    if (courseId && groupId) loadResults(1);
  }, [courseId, groupId, loadResults]);

  // ── Publish results ──────────────────────────────────────────────────────
  const handlePublish = async () => {
    if (!window.confirm('Publish results to all students in this group?')) return;
    try {
      setPublishing(true);
      await assessmentAttemptAPI.publishResults({
        assessment_id: assessmentId,
        course_id:     courseId,
        group_id:      groupId,
        publish_all:   true,
      });
      setPublishMsg('Results published successfully!');
      loadResults(page);
    } catch (e) {
      setPublishMsg('Error: ' + (e.message || 'Failed to publish'));
    } finally {
      setPublishing(false);
      setTimeout(() => setPublishMsg(''), 4000);
    }
  };

  // ── Derived data ─────────────────────────────────────────────────────────
  const meta         = results?.assessment || {};
  const group        = results?.group || {};
  const attempts     = results?.attempts || [];
  const inProgress   = results?.in_progress || [];
  const totalPages   = results?.pages || 1;
  const totalSubmitted = results?.total_submitted ?? 0;
  const totalInProgress = results?.total_in_progress ?? 0;
  const published    = meta.results_published;

  const passCount    = attempts.filter(a => (a.score_percentage || 0) >= 50).length;
  const avgScore     = attempts.length
    ? (attempts.reduce((sum, a) => sum + (a.score_percentage || 0), 0) / attempts.length).toFixed(1)
    : 0;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <TrainerDashboardLayout>
      <div className="min-h-screen bg-slate-50/40 pb-16">
        {/* Top bar */}
        <div className="bg-white border-b border-slate-100 px-8 py-4 flex items-center gap-4 sticky top-0 z-10">
          <button
            onClick={() => navigate('/dashboard/trainer/assessments')}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#003399] transition-colors"
          >
            <ChevronLeft size={18} /> Back to Assessments
          </button>
          <div className="h-4 w-px bg-slate-200" />
          <div className="flex-1">
            <h1 className="text-base font-bold text-slate-800">
              {assessment?.title || <InlineSkeleton className="w-40 h-4" />}
            </h1>
            <p className="text-xs text-slate-500">
              {group?.name ? `Group: ${group.name}` : ''}
              {assessment?.level ? ` · ${assessment.level}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => loadResults(page)}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#003399] px-3 py-2 rounded-lg hover:bg-slate-50 transition"
            >
              <RefreshCw size={15} /> Refresh
            </button>
            {!published && totalSubmitted > 0 && (
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="flex items-center gap-1.5 bg-[#003399] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#002277] transition disabled:opacity-60"
              >
                {publishing ? <Loader size={14} className="animate-spin" /> : <Send size={14} />}
                Publish Results
              </button>
            )}
            {published && (
              <div className="flex items-center gap-1.5 text-sm text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded-lg">
                <CheckCircle2 size={15} /> Results Published
              </div>
            )}
          </div>
        </div>

        {publishMsg && (
          <div className={`mx-8 mt-4 p-3 rounded-xl text-sm font-medium flex items-center gap-2 ${
            publishMsg.startsWith('Error')
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}>
            {publishMsg.startsWith('Error') ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            {publishMsg}
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="mx-8 mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
            <AlertCircle size={18} />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* No course/group config */}
        {!loading && !error && (!courseId || !groupId) && (
          <div className="mx-8 mt-12 flex flex-col items-center justify-center text-center">
            <BookOpen size={48} className="text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-700 mb-2">No Group Linked</h3>
            <p className="text-slate-500 text-sm max-w-sm">
              This assessment doesn't have a course or group linked to it.
              Student results can only be viewed for group-based assessments.
            </p>
          </div>
        )}

        {courseId && groupId && (
          <div className="px-8 mt-6 space-y-6">
            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  icon: <Users size={18} className="text-[#003399]" />,
                  label: 'Total Students',
                  value: loading ? '—' : (group?.total_students ?? '—'),
                  bg: 'bg-[#003399]/5',
                },
                {
                  icon: <ClipboardList size={18} className="text-violet-600" />,
                  label: 'Submitted',
                  value: loading ? '—' : totalSubmitted,
                  bg: 'bg-violet-50',
                },
                {
                  icon: <TrendingUp size={18} className="text-green-600" />,
                  label: 'Avg Score',
                  value: loading ? '—' : `${avgScore}%`,
                  bg: 'bg-green-50',
                },
                {
                  icon: <Award size={18} className="text-amber-600" />,
                  label: 'Passed (≥50%)',
                  value: loading ? '—' : `${passCount} / ${totalSubmitted}`,
                  bg: 'bg-amber-50',
                },
              ].map(({ icon, label, value, bg }) => (
                <div key={label} className={`${bg} rounded-2xl p-4 flex items-center gap-3`}>
                  <div className="p-2 bg-white rounded-lg shadow-sm">{icon}</div>
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">{label}</p>
                    <p className="text-xl font-bold text-slate-800">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* In-Progress notice */}
            {!loading && totalInProgress > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-2 text-amber-700 text-sm">
                <Clock size={16} />
                <span><strong>{totalInProgress}</strong> student{totalInProgress !== 1 ? 's are' : ' is'} currently taking the assessment.</span>
              </div>
            )}

            {/* Submitted attempts table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart2 size={18} className="text-[#003399]" />
                  <h2 className="font-bold text-slate-800">Submitted Attempts</h2>
                  {!loading && (
                    <span className="ml-1 bg-slate-100 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">
                      {totalSubmitted}
                    </span>
                  )}
                </div>
                {/* Pagination controls */}
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => loadResults(page - 1)}
                      disabled={page === 1}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:border-[#003399]/40 disabled:opacity-40"
                    >
                      <ChevronLeftIcon size={15} />
                    </button>
                    <span className="text-xs text-slate-500">{page} / {totalPages}</span>
                    <button
                      onClick={() => loadResults(page + 1)}
                      disabled={page === totalPages}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:border-[#003399]/40 disabled:opacity-40"
                    >
                      <ChevronRight size={15} />
                    </button>
                  </div>
                )}
              </div>

              {loading ? (
                <div className="p-6 space-y-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex items-center gap-4">
                      <InlineSkeleton className="w-8 h-4" />
                      <InlineSkeleton className="w-32 h-4" />
                      <InlineSkeleton className="flex-1 h-4" />
                      <InlineSkeleton className="w-20 h-4" />
                    </div>
                  ))}
                </div>
              ) : attempts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Trophy size={40} className="text-slate-300 mb-3" />
                  <h3 className="text-slate-700 font-semibold mb-1">No Submissions Yet</h3>
                  <p className="text-slate-400 text-sm">
                    {totalInProgress > 0
                      ? 'Students are currently taking the assessment.'
                      : 'No students have submitted this assessment yet.'}
                  </p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/60">
                      <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-12">Rank</th>
                      <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Student</th>
                      <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Score</th>
                      <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Marks</th>
                      <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Time</th>
                      <th className="px-5 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Submitted</th>
                      <th className="px-5 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Proctoring</th>
                      <th className="px-5 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {attempts.map((attempt, idx) => {
                      const student = attempt.student_id || {};
                      const rank = (page - 1) * 20 + idx + 1;
                      const pct  = attempt.score_percentage || 0;
                      const riskScore = attempt.proctoring_risk_score || 0;
                      const riskLevel = getRiskLevel(riskScore);
                      return (
                        <tr key={attempt._id} className="hover:bg-slate-50/40 transition-colors">
                          <td className="px-5 py-4">
                            <RankBadge rank={rank} />
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-semibold text-slate-800">{student.fullName || '—'}</p>
                            <p className="text-xs text-slate-400">{student.email || ''}</p>
                          </td>
                          <td className="px-5 py-4">
                            <ScoreBar pct={pct} />
                          </td>
                          <td className="px-5 py-4 text-slate-700 font-medium">
                            {attempt.earned_marks ?? '—'} / {attempt.total_marks ?? meta.total_marks ?? '—'}
                          </td>
                          <td className="px-5 py-4 text-slate-500">
                            {fmtTime(attempt.time_taken_seconds)}
                          </td>
                          <td className="px-5 py-4 text-slate-500 text-xs">
                            {fmtDate(attempt.submitted_at)}
                          </td>
                          <td className="px-5 py-4 text-center">
                            {attempt.proctoring_flagged ? (
                              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${riskLevel.bg} ${riskLevel.color} ${riskLevel.border}`}>
                                <AlertTriangle size={11} />
                                {attempt.proctoring_violations_count || 0} · {riskScore}pts
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-green-50 text-green-600 text-xs font-semibold px-2 py-0.5 rounded-full border border-green-200">
                                <Shield size={11} /> Clean
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <button
                              onClick={() => setSelectedAttempt(attempt)}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#003399] hover:bg-[#003399]/5 px-3 py-1.5 rounded-lg transition"
                            >
                              <Eye size={13} /> View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* In-Progress students */}
            {!loading && inProgress.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                  <Clock size={18} className="text-amber-500" />
                  <h2 className="font-bold text-slate-800">In Progress</h2>
                  <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    {inProgress.length}
                  </span>
                </div>
                <div className="divide-y divide-slate-50">
                  {inProgress.map(a => {
                    const s = a.student_id || {};
                    return (
                      <div key={a._id} className="px-6 py-3 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-800 text-sm">{s.fullName || '—'}</p>
                          <p className="text-xs text-slate-400">{s.email}</p>
                        </div>
                        <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                          In Progress
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Attempt Detail Modal */}
      {selectedAttempt && (
        <AttemptDetailModal
          attempt={selectedAttempt}
          assessmentId={assessmentId}
          courseId={courseId}
          groupId={groupId}
          onClose={() => setSelectedAttempt(null)}
        />
      )}
    </TrainerDashboardLayout>
  );
}