// pages/CollegeAdmin/Assessments/AssessmentAttempts.jsx
// Renamed "Student Attempts" → "Leaderboard"
// • Sorts by score desc, then time_taken_seconds asc (tiebreaker)
// • JD-based: publish with top-N selection, shows eligibility message to students
// • Non-JD: publish reveals individual student's own result only
// • Publish button enabled only when status === 'completed'
// • Passing threshold: 50% (updated from 70%)
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Users, AlertCircle, RefreshCw, Download, CheckCircle2,
  BarChart2, ChevronRight, ClipboardList, Clock,
  X, ChevronDown, ChevronUp, Check, FileText,
  Eye, Trophy, Send, ShieldAlert, ShieldCheck, Shield,
  AlertTriangle, Flag, Monitor, Loader,
} from 'lucide-react';
import CollegeAdminLayout from '../../../components/layout/CollegeAdminLayout';
import { InlineSkeleton } from '../../../components/common/SkeletonLoader';
import ActionMenu from '../../../components/common/ActionMenu';
import { assessmentAPI, assessmentAttemptAPI } from '../../../api/Api';
import apiCall from '../../../api/Api';

// ── Proctoring helpers ─────────────────────────────────────────────────────
const VIOLATION_LABELS = {
  FULLSCREEN_EXIT   : 'Fullscreen Exit',
  TAB_SWITCH        : 'Tab Switch',
  WINDOW_BLUR       : 'Window Blur',
  COPY_ATTEMPT      : 'Copy Attempt',
  PASTE_ATTEMPT     : 'Paste Attempt',
  CUT_ATTEMPT       : 'Cut Attempt',
  CONTEXT_MENU      : 'Right-click',
  DEVTOOLS_OPEN     : 'DevTools',
  KEYBOARD_SHORTCUT : 'Key Shortcut',
  PRINT_ATTEMPT     : 'Print Attempt',
  // camera — original
  NO_FACE_DETECTED  : 'No Face Detected',
  MULTIPLE_FACES    : 'Multiple Faces',
  FACE_TURNED_AWAY  : 'Face Turned Away',
  FACE_LOOKING_DOWN : 'Looking Down',
  EYES_CLOSED       : 'Eyes Closed',
  FACE_TOO_SMALL    : 'Face Too Small',
  CAMERA_DARK       : 'Camera Too Dark',
  FACE_OBSCURED     : 'Face Obscured',
  // camera — v3.0 new
  NO_FACE_WARNING   : 'No Face — Warning',
  GAZE_AWAY         : 'Eyes Not on Screen',
  CAMERA_COVERED    : 'Camera Covered/Blocked',
  MOBILE_DETECTED   : 'Mobile Device Detected',
};
const CRITICAL_TYPES = new Set([
  'FULLSCREEN_EXIT','TAB_SWITCH','WINDOW_BLUR','DEVTOOLS_OPEN',
  // v3.0 camera critical
  'NO_FACE_DETECTED','MULTIPLE_FACES','CAMERA_DARK','CAMERA_COVERED','MOBILE_DETECTED',
]);

const fetchViolations = (submissionId) =>
  apiCall(`/proctoring/violations/${submissionId}`);

const ScoreBar = ({ pct }) => {
  const color = pct >= 50 ? 'from-green-500 to-emerald-400' : pct >= 35 ? 'from-[#003399] to-[#003399]/80' : 'from-red-400 to-red-500';
  const textColor = pct >= 50 ? 'text-green-700' : pct >= 35 ? 'text-[#003399]' : 'text-red-600';
  return (
    <div className="flex items-center gap-2 w-36">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full bg-gradient-to-r ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-sm font-bold ${textColor} tabular-nums w-10 text-right`}>{pct}%</span>
    </div>
  );
};

const fmtTime = (secs) => {
  if (!secs && secs !== 0) return '—';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};


// ── Proctoring Detail Modal (popup for CollegeAdmin) ──────────────────────────
const ProctoringModal = ({ attempt, onClose }) => {
  const [violations, setViolations] = useState(null);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchViolations(attempt._id);
        setViolations(res.violations || []);
      } catch {
        setViolations([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [attempt._id]);

  const flagged  = attempt.proctoring_flagged;
  const count    = attempt.proctoring_violations_count || 0;
  const critical = violations?.filter(v => CRITICAL_TYPES.has(v.event_type)).length ?? 0;
  const camera   = violations?.filter(v => v.source === 'camera').length ?? 0;
  const browser  = violations?.filter(v => v.source === 'browser').length ?? 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${flagged ? 'bg-red-100' : count > 0 ? 'bg-amber-100' : 'bg-green-100'}`}>
              {flagged ? <ShieldAlert className="w-5 h-5 text-red-600" /> : count > 0 ? <AlertTriangle className="w-5 h-5 text-amber-600" /> : <ShieldCheck className="w-5 h-5 text-green-600" />}
            </div>
            <div>
              <h2 className="font-black text-gray-900 text-sm">Proctoring Report</h2>
              <p className="text-xs text-slate-400 mt-0.5">{attempt.student_id?.fullName || '—'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-slate-400 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>


        {/* Summary stats */}
        <div className="px-5 py-4 grid grid-cols-4 gap-3 border-b border-slate-100 shrink-0">
          {[
            { label: 'Total Events', value: violations?.length ?? '—', color: 'bg-gray-50 border-gray-200 text-gray-700' },
            { label: 'Critical',     value: loading ? '—' : critical, color: critical > 0 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-gray-50 border-gray-200 text-slate-400' },
            { label: 'Camera',       value: loading ? '—' : camera,   color: camera > 0 ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-gray-50 border-gray-200 text-slate-400' },
            { label: 'Browser',      value: loading ? '—' : browser,  color: browser > 0 ? 'bg-[#003399]/5 border-[#003399]/20 text-[#003399]' : 'bg-gray-50 border-gray-200 text-slate-400' },
          ].map(s => (
            <div key={s.label} className={`rounded-xl border px-3 py-2.5 text-center ${s.color}`}>
              <p className="text-lg font-black tabular-nums">{s.value}</p>
              <p className="text-[9px] font-semibold opacity-60 mt-0.5 uppercase tracking-wide">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Status badge */}
        <div className="px-5 py-3 flex items-center gap-2 border-b border-slate-100 shrink-0">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border
            ${flagged ? 'bg-red-50 border-red-200 text-red-700' : count > 0 ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
            {flagged ? <><ShieldAlert className="w-3 h-3" /> Flagged</> : count > 0 ? <><AlertTriangle className="w-3 h-3" /> {count} violation{count !== 1 ? 's' : ''}</> : <><ShieldCheck className="w-3 h-3" /> Clean</>}
          </span>
          <span className="text-xs text-slate-400 ml-1">Risk Score: <strong className="text-gray-700">{attempt.proctoring_risk_score ?? 0}/100</strong></span>
        </div>

        {/* Violation list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-5 h-5 animate-spin text-slate-400" />
            </div>
          ) : violations?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-green-600 gap-2">
              <ShieldCheck className="w-8 h-8" />
              <p className="text-sm font-semibold">No violations recorded</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              <div className="px-5 py-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Event Log</p>
              </div>
              {violations.map((v, i) => (
                <div key={i} className="px-5 py-3 hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${CRITICAL_TYPES.has(v.event_type) ? 'bg-red-500' : 'bg-amber-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold truncate ${CRITICAL_TYPES.has(v.event_type) ? 'text-red-700' : 'text-amber-700'}`}>
                        {VIOLATION_LABELS[v.event_type] || v.event_type}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5 capitalize">{v.source || 'system'} · {v.severity}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                      {v.client_timestamp
                        ? new Date(v.client_timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                        : new Date(v.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  {/* ── Evidence snapshot (camera violations only) ── */}
                  {v.evidence_snapshot && (
                    <div className="mt-2 ml-5">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest tracking-wider mb-1">📷 Evidence Photo</p>
                      <img
                        src={v.evidence_snapshot}
                        alt="violation evidence"
                        className="rounded-lg border border-red-200 shadow-sm"
                        style={{ width: 160, height: 120, objectFit: 'cover' }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100 shrink-0">
          <button onClick={onClose}
            className="w-full py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-slate-50 font-semibold text-sm transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Proctoring Badge Button (triggers modal) ──────────────────────────────────
const ProctoringPanel = ({ attempt, onViewDetails }) => {
  const flagged = attempt.proctoring_flagged;
  const count   = attempt.proctoring_violations_count || 0;

  return (
    <div className="mt-2">
      <button
        onClick={() => onViewDetails(attempt)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all
          ${flagged
            ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
            : count > 0
            ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
            : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'}`}
      >
        {flagged ? (
          <ShieldAlert className="w-3 h-3" />
        ) : count > 0 ? (
          <AlertTriangle className="w-3 h-3" />
        ) : (
          <ShieldCheck className="w-3 h-3" />
        )}
        {flagged ? 'Flagged' : count > 0 ? `${count} violation${count !== 1 ? 's' : ''}` : 'Clean'}
        <Eye className="w-3 h-3 ml-0.5 opacity-60" />
      </button>
    </div>
  );
};

const AttemptDetailModal = ({ attempt, assessmentId, onClose }) => {
  const [detail, setDetail]             = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [expandedQ, setExpandedQ]       = useState(new Set());
  const [recalculating, setRecalculating] = useState(false);
  const [recalcMsg, setRecalcMsg]       = useState('');

  const loadDetail = async () => {
    setLoading(true); setError('');
    try {
      const res = await assessmentAPI.getAttemptDetail(assessmentId, attempt._id);
      if (res.success) {
        setDetail(res);
        // Expand all questions by default so answers are immediately visible
        const allIndexes = new Set((res.answers || []).map((_, i) => i));
        setExpandedQ(allIndexes);
      }
      else setError(res.message || 'Failed to load');
    } catch (e) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDetail(); }, [assessmentId, attempt._id]);

  const handleRecalculate = async () => {
    setRecalculating(true); setRecalcMsg('');
    try {
      const res = await assessmentAPI.recalculateAttemptMarks(assessmentId, attempt._id);
      if (res.success) {
        setRecalcMsg(`✓ Marks updated: ${res.data.earned_marks}/${res.data.total_marks} (${res.data.score_percentage}%)`);
        await loadDetail(); // reload the detail with fresh marks
      } else {
        setRecalcMsg('Recalculation failed: ' + (res.message || 'Unknown error'));
      }
    } catch (e) {
      setRecalcMsg('Error: ' + (e.message || 'Unknown error'));
    } finally {
      setRecalculating(false);
    }
  };

  const formatAnswer = (ans) => {
    if (!ans && ans !== 0) return <span className="text-slate-400 italic">Not answered</span>;
    if (Array.isArray(ans)) return ans.join(', ');
    return String(ans);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
          <div>
            <h2 className="font-black text-gray-900">Answer Sheet</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {attempt.student_id?.fullName || '—'} · {detail?.summary.score_percentage ?? attempt.score_percentage ?? 0}% · {detail?.summary.earned_marks ?? attempt.earned_marks ?? 0}/{detail?.summary.total_marks ?? attempt.total_marks ?? 0} marks
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRecalculate}
              disabled={recalculating || loading}
              title="Recalculate marks from submitted code results"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#003399]/5 hover:bg-slate-100 border border-[#003399]/20 text-[#003399] rounded-lg text-xs font-bold transition-all disabled:opacity-50"
            >
              {recalculating
                ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Recalculating…</>
                : <><RefreshCw className="w-3.5 h-3.5" /> Recalculate Marks</>}
            </button>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-slate-400 transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        {recalcMsg && (
          <div className={`px-5 py-2 text-xs font-semibold border-b ${recalcMsg.startsWith('✓') ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
            {recalcMsg}
          </div>
        )}
        <div className="p-5">
          {/* FIX: fullScreen={false} prevents gradient box artifact inside modal */}
          {loading && <InlineSkeleton rows={4} className="py-10" />}
          {error && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}
          {detail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Total Qs', value: detail.summary.total_questions, color: 'bg-[#003399]/5 text-[#003399] border-[#003399]/10' },
                  { label: 'Correct', value: detail.summary.correct_answers, color: 'bg-green-50 text-green-700 border-green-100' },
                  { label: 'Marks', value: `${detail.summary.earned_marks}/${detail.summary.total_marks}`, color: 'bg-amber-50 text-amber-700 border-amber-100' },
                  { label: 'Score', value: `${detail.summary.score_percentage}%`, color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
                ].map(s => (
                  <div key={s.label} className={`px-4 py-3 rounded-xl border text-center ${s.color}`}>
                    <p className="text-lg font-black">{s.value}</p>
                    <p className="text-[10px] font-semibold opacity-60">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                {detail.answers.map((ans, idx) => {
                  const isOpen = expandedQ.has(idx);
                  return (
                    <div key={idx} className={`rounded-xl border-2 overflow-hidden transition-all ${ans.is_correct ? 'border-green-200 bg-green-50/40' : 'border-red-200 bg-red-50/40'}`}>
                      <button className="w-full flex items-start gap-3 p-4 text-left" onClick={() => setExpandedQ(prev => { const s = new Set(prev); s.has(idx) ? s.delete(idx) : s.add(idx); return s; })}>
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5 ${ans.is_correct ? 'bg-green-500' : 'bg-red-500'}`}>
                          {ans.is_correct ? <Check className="w-4 h-4" /> : idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 leading-snug">{ans.question_text}</p>
                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              ans.marks_earned > 0
                                ? ans.is_correct ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                : 'bg-red-100 text-red-600'
                            }`}>
                              {ans.marks_earned > 0 ? `+${ans.marks_earned} marks` : '0 marks'}
                              {['coding','sql'].includes(ans.question_type) && ` (${ans.passed_count ?? 0}/${ans.total_count ?? 0} tests)`}
                            </span>
                            {!['coding','sql'].includes(ans.question_type) && (
                              <span className="text-[10px] text-slate-300 italic">Student: <strong className="text-gray-700">{formatAnswer(ans.student_answer)}</strong></span>
                            )}
                            {['coding','sql'].includes(ans.question_type) && (
                              <span className="text-[10px] text-slate-300 italic">
                                Code: <strong className="text-gray-700">{ans.student_code ? `${ans.code_language || 'submitted'}` : 'not submitted'}</strong>
                              </span>
                            )}
                            {!['coding','sql'].includes(ans.question_type) && !ans.is_correct && (
                              <span className="text-[10px] text-slate-300 italic">Correct: <strong className="text-green-700">{formatAnswer(ans.correct_answer)}</strong></span>
                            )}
                          </div>
                        </div>
                        <div className="shrink-0 text-slate-400 mt-1">{isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</div>
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 space-y-3">
                          {/* ── Coding question: submitted code + test results ── */}
                          {['coding','sql'].includes(ans.question_type) && (
                            <div className="space-y-3">
                              {/* Summary bar */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-semibold text-gray-600">
                                  Tests passed:&nbsp;
                                  <strong className={ans.passed_count === ans.total_count && ans.total_count > 0 ? 'text-green-700' : 'text-amber-700'}>
                                    {ans.passed_count ?? 0}/{ans.total_count ?? 0}
                                  </strong>
                                </span>
                                {ans.code_language && (
                                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-[10px] font-bold uppercase">
                                    {ans.code_language}
                                  </span>
                                )}
                                {ans.execution_status && ans.execution_status !== 'success' && (
                                  <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[10px] font-bold uppercase">
                                    ⚠ {ans.execution_status.replace(/_/g, ' ')}
                                  </span>
                                )}
                              </div>

                              {/* Overall error message (compile error / first runtime error) */}
                              {ans.error_message && (
                                <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                                  <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-1">
                                    {ans.execution_status === 'compile_error' ? 'Compilation Error' : 'Runtime Error'}
                                  </p>
                                  <pre className="text-xs text-red-800 font-mono whitespace-pre-wrap leading-relaxed">
                                    {ans.error_message}
                                  </pre>
                                </div>
                              )}

                              {/* Submitted code */}
                              {ans.student_code ? (
                                <div>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest tracking-wider mb-1">Submitted Code</p>
                                  <pre className="text-xs bg-gray-900 text-green-300 font-mono rounded-xl px-4 py-3 overflow-x-auto whitespace-pre-wrap max-h-64 border border-gray-700 leading-relaxed">
                                    {ans.student_code}
                                  </pre>
                                </div>
                              ) : (
                                <p className="text-xs text-slate-400 italic bg-gray-50 px-3 py-2 rounded-xl border border-slate-100">
                                  No code submitted for this question
                                </p>
                              )}

                              {/* Test case breakdown */}
                              {ans.test_results?.length > 0 && (
                                <div>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest tracking-wider mb-1.5">Test Case Results</p>
                                  <div className="space-y-1.5">
                                    {ans.test_results.map((tc, ti) => {
                                      const hasError = tc.stderr && tc.stderr.trim();
                                      const isRuntimeErr = (tc.judge0_status_id ?? 0) >= 7;
                                      const isTLE        = tc.judge0_status_id === 5;
                                      const isCompileErr = tc.judge0_status_id === 6;
                                      return (
                                        <div key={ti} className={`rounded-xl border text-xs overflow-hidden ${
                                          tc.passed ? 'border-green-200' : hasError ? 'border-red-200' : 'border-orange-200'
                                        }`}>
                                          {/* Test header */}
                                          <div className={`flex items-center gap-2 px-3 py-2 ${
                                            tc.passed ? 'bg-green-50' : hasError ? 'bg-red-50' : 'bg-orange-50'
                                          }`}>
                                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0 ${tc.passed ? 'bg-green-500' : hasError ? 'bg-red-500' : 'bg-orange-400'}`}>
                                              {ti + 1}
                                            </span>
                                            <span className={`font-bold text-[10px] flex-1 ${tc.passed ? 'text-green-700' : hasError ? 'text-red-700' : 'text-orange-700'}`}>
                                              {tc.passed ? '✓ Passed'
                                                : isCompileErr ? '✗ Compilation Error'
                                                : isRuntimeErr ? '✗ Runtime Error'
                                                : isTLE        ? '✗ Time Limit Exceeded'
                                                : '✗ Wrong Answer'}
                                            </span>
                                            <span className="text-[9px] text-slate-400 px-1.5 py-0.5 bg-white/70 rounded-full border border-gray-200">
                                              {tc.is_hidden ? '🔒 Hidden' : '👁 Visible'}
                                            </span>
                                            {tc.execution_time && (
                                              <span className="text-[9px] text-slate-400">⏱ {tc.execution_time}s</span>
                                            )}
                                          </div>
                                          {/* Test body */}
                                          <div className="px-3 py-2 space-y-1.5 bg-white">
                                            {!tc.is_hidden && tc.input != null && (
                                              <div className="flex gap-2 items-start">
                                                <span className="text-[10px] text-slate-400 w-16 shrink-0 pt-0.5">Input</span>
                                                <code className="text-gray-800 bg-gray-50 border border-slate-100 px-2 py-0.5 rounded font-mono text-[11px] whitespace-pre-wrap">{tc.input || '(empty)'}</code>
                                              </div>
                                            )}
                                            <div className="flex gap-2 items-start">
                                              <span className="text-[10px] text-slate-400 w-16 shrink-0 pt-0.5">Expected</span>
                                              <code className="text-gray-700 bg-gray-50 border border-slate-100 px-2 py-0.5 rounded font-mono text-[11px]">{tc.expected_output}</code>
                                            </div>
                                            <div className="flex gap-2 items-start">
                                              <span className="text-[10px] text-slate-400 w-16 shrink-0 pt-0.5">Got</span>
                                              <code className={`px-2 py-0.5 rounded font-mono text-[11px] border ${
                                                tc.passed
                                                  ? 'text-green-800 bg-green-50 border-green-200'
                                                  : tc.actual_output
                                                  ? 'text-red-800 bg-red-50 border-red-200'
                                                  : 'text-slate-400 bg-gray-50 border-gray-200 italic'
                                              }`}>
                                                {tc.actual_output ?? '(no output)'}
                                              </code>
                                            </div>
                                            {hasError && (
                                              <div className="flex gap-2 items-start">
                                                <span className="text-[10px] text-red-400 w-16 shrink-0 pt-0.5 font-bold">Error</span>
                                                <pre className="text-red-700 bg-red-50 border border-red-200 px-2 py-1 rounded font-mono text-[10px] whitespace-pre-wrap flex-1 leading-relaxed">
                                                  {tc.stderr}
                                                </pre>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* ── MCQ / fill-up: options grid ── */}
                          {!['coding','sql'].includes(ans.question_type) && ans.options?.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {ans.options.map(opt => {
                                const isCorrectOpt = Array.isArray(ans.correct_answer) ? ans.correct_answer.includes(opt.label) : ans.correct_answer === opt.label;
                                const isStudentOpt = Array.isArray(ans.student_answer) ? ans.student_answer.includes(opt.label) : ans.student_answer === opt.label;
                                return (
                                  <div key={opt.label} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs border ${isCorrectOpt ? 'bg-green-50 border-green-200 text-green-800' : isStudentOpt ? 'bg-red-50 border-red-200 text-red-700' : 'bg-gray-50 border-gray-100 text-gray-600'}`}>
                                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${isCorrectOpt ? 'bg-green-500 text-white' : isStudentOpt ? 'bg-red-400 text-white' : 'bg-gray-200 text-gray-500'}`}>{opt.label}</span>
                                    <span className="flex-1">{opt.text}</span>
                                    {isCorrectOpt && <Check className="w-3 h-3 text-green-600" />}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          {ans.explanation && (
                            <div className="flex items-start gap-2 bg-[#003399]/5/80 border border-[#003399]/10 rounded-xl p-3">
                              <span className="text-base shrink-0">💡</span>
                              <p className="text-xs text-[#003399] leading-relaxed">{ans.explanation}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PublishModal = ({ assessment, onClose, onPublished }) => {
  const isJD = !!assessment?.jd_id;
  const totalAttempts = assessment?._attemptCount || 0;
  const [topN, setTopN] = useState(assessment?.leaderboard_top_n || '');
  const [publishing, setPublishing] = useState(false);
  const [err, setErr] = useState('');

  const handlePublish = async () => {
    setErr('');
    if (isJD && (!topN || isNaN(topN) || parseInt(topN) < 1)) {
      setErr('Please enter a valid number of top students.');
      return;
    }
    setPublishing(true);
    try {
      const payload = isJD ? { top_n: parseInt(topN) } : {};
      const res = await assessmentAttemptAPI.publishLeaderboard(assessment._id, payload);
      if (res.success) { onPublished(); onClose(); }
      else setErr(res.message || 'Failed to publish');
    } catch (e) {
      setErr(e.message || 'Failed to publish');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#003399] rounded-xl flex items-center justify-center">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <h2 className="font-black text-gray-900">Publish Leaderboard</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-slate-400"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          {isJD ? (
            <>
              <div className="bg-[#003399]/5 border border-[#003399]/20 rounded-xl p-4 text-sm text-[#003399]">
                <p className="font-bold mb-1">JD-Based Assessment</p>
                <p>Select how many top students to shortlist. All students who attempted will see the ranked list (names only, no marks). Students outside the top selection will see they are not shortlisted.</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Number of Top Students to Shortlist</label>
                <input
                  type="number" min="1" max={totalAttempts || 9999} value={topN}
                  onChange={e => setTopN(e.target.value)}
                  placeholder={`e.g. 20 (out of ${totalAttempts} attempts)`}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#003399]/30 focus:border-[#003399] outline-none"
                />
                <p className="text-xs text-slate-400 mt-1">Students will see: "Top {topN || '?'} students are only eligible"</p>
              </div>
            </>
          ) : (
            <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-sm text-green-800">
              <p className="font-bold mb-1">Non-JD Assessment</p>
              <p>Each student will only see their own marks and score after publishing. No group leaderboard is shown.</p>
            </div>
          )}
          {err && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" /> {err}
            </div>
          )}
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-slate-50 font-semibold text-sm">Cancel</button>
          <button onClick={handlePublish} disabled={publishing}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-[#003399] to-[#00A9CE] text-white rounded-xl font-bold text-sm hover:opacity-90 disabled:opacity-60 shadow-md shadow-[#003399]/15">
            {publishing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {publishing ? 'Publishing…' : 'Publish Now'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════ */
/* ─── Live elapsed timer (re-renders every second) ──────────────────── */
const ElapsedTimer = ({ startedAt }) => {
  const [elapsed, setElapsed] = useState(() =>
    startedAt ? Math.floor((Date.now() - new Date(startedAt)) / 1000) : 0
  );
  useEffect(() => {
    if (!startedAt) return;
    const id = setInterval(() =>
      setElapsed(Math.floor((Date.now() - new Date(startedAt)) / 1000)), 1000);
    return () => clearInterval(id);
  }, [startedAt]);
  return <span>{fmtTime(elapsed)}</span>;
};

/* ─── In-Progress students panel ─────────────────────────────────────── */
const InProgressSection = ({ students, onViewDetails }) => {
  if (!students || students.length === 0) return null;
  return (
    <div className="bg-white rounded-xl shadow-sm border border-amber-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-100 flex items-center gap-2">
        <div className="w-6 h-6 bg-amber-400 rounded-lg flex items-center justify-center">
          <Loader className="w-3.5 h-3.5 text-white animate-spin" />
        </div>
        <p className="font-bold text-amber-800 text-sm">
          {students.length} Student{students.length !== 1 ? 's' : ''} Currently Taking Assessment
        </p>
        <span className="ml-auto flex items-center gap-1.5 text-[10px] font-bold text-amber-600 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse inline-block" />
          LIVE
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-amber-100 bg-amber-50/40">
              {['#', 'Student', 'Email', 'Started At', 'Elapsed Time', 'Proctoring'].map(h => (
                <th key={h} className="text-left text-[10px] font-black text-amber-500 uppercase tracking-wider px-4 py-2.5 bg-amber-50/40 first:pl-5">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-amber-50">
            {students.map((a, idx) => (
              <tr key={a._id} className="hover:bg-amber-50/30 transition-colors">
                <td className="px-4 py-3">
                  <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-black flex items-center justify-center">
                    {idx + 1}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <p className="text-[14px] font-bold text-gray-900">{a.student_id?.fullName || '—'}</p>
                  <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">In Progress</span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-400">{a.student_id?.email || '—'}</td>
                <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                  {a.started_at
                    ? new Date(a.started_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })
                    : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 text-sm font-bold text-amber-700">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    {a.started_at ? <ElapsedTimer startedAt={a.started_at} /> : '—'}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <ProctoringPanel attempt={a} onViewDetails={onViewDetails} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════ */
const AssessmentAttempts = () => {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [inProgress, setInProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [proctoringModalAttempt, setProctoringModalAttempt] = useState(null);

  useEffect(() => {
    fetchData();                                          // initial load (shows spinner)
    const pollId = setInterval(() => fetchData(true), 10_000); // silent poll every 10s
    return () => clearInterval(pollId);
  }, [assessmentId, page]);

  const fetchData = async (silent = false) => {
    if (!silent) { setLoading(true); }
    setError('');
    try {
      const [assRes, attRes] = await Promise.all([
        assessmentAPI.getAssessment(assessmentId),
        assessmentAttemptAPI.getAssessmentAttempts(assessmentId, { page, limit: 20 }),
      ]);
      if (assRes.success) setAssessment(assRes.assessment);
      if (attRes.success) {
        setAttempts(attRes.attempts || []);
        setInProgress(attRes.in_progress || []);
        setTotal(attRes.total || 0);
        setTotalPages(attRes.pages || 1);
      }
    } catch (err) {
      setError(err.message || 'Failed to load data');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Sort: score desc, then time_taken_seconds asc (less time = better rank)
  const sortedAttempts = [...attempts].sort((a, b) => {
    const scoreDiff = (b.score_percentage || 0) - (a.score_percentage || 0);
    if (scoreDiff !== 0) return scoreDiff;
    const aTime = a.time_taken_seconds ?? Infinity;
    const bTime = b.time_taken_seconds ?? Infinity;
    return aTime - bTime;
  });

  const stats = {
    total,
    inProgressCount: inProgress.length,
    avg: attempts.length > 0 ? Math.round(attempts.reduce((s, a) => s + (a.score_percentage || 0), 0) / attempts.length) : 0,
    passed: attempts.filter(a => (a.score_percentage || 0) >= 50).length,
    topScore: attempts.length > 0 ? Math.max(...attempts.map(a => a.score_percentage || 0)) : 0,
    flagged: attempts.filter(a => a.proctoring_flagged).length,
  };

  const isCompleted = assessment?.status === 'completed';
  const isPublished = assessment?.leaderboard_published;
  const isJD = !!assessment?.jd_id;

  const handleExportCSV = () => {
    const headers = ['Rank', 'Name', 'Email', 'Score(%)', 'Correct', 'Total Qs', 'Earned Marks', 'Total Marks', 'Time Taken', 'Submitted', 'Violations', 'Flagged'];
    const rows = sortedAttempts.map((a, i) => [
      i + 1,
      a.student_id?.fullName || '—',
      a.student_id?.email || '—',
      a.score_percentage ?? 0,
      a.correct_answers ?? 0,
      a.total_questions ?? 0,
      a.earned_marks ?? 0,
      a.total_marks ?? 0,
      fmtTime(a.time_taken_seconds),
      a.submitted_at ? new Date(a.submitted_at).toLocaleString() : '—',
      a.proctoring_violations_count ?? 0,
      a.proctoring_flagged ? 'Yes' : 'No',
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leaderboard-${assessment?.title || assessmentId}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadReport = async () => {
    setGeneratingReport(true);
    try {
      const res = await assessmentAPI.getAssessmentReport(assessmentId);
      if (!res.success) { alert(res.message || 'Report failed'); return; }
      const { assessment: meta, report } = res;
      const sorted = [...report].sort((a, b) => {
        const sd = b.score_percentage - a.score_percentage;
        if (sd !== 0) return sd;
        return (a.time_taken_seconds ?? Infinity) - (b.time_taken_seconds ?? Infinity);
      });
      const passCount = sorted.filter(r => r.score_percentage >= 50).length;
      const avgScore = sorted.length > 0 ? Math.round(sorted.reduce((s, r) => s + (r.score_percentage || 0), 0) / sorted.length) : 0;
      const topScore = sorted.length > 0 ? Math.max(...sorted.map(r => r.score_percentage || 0)) : 0;
      const assessTitle = meta.title || assessment?.title || 'Assessment';
      const totalQs = meta.total_questions || '—';
      const totalMarks = meta.total_marks || '—';
      const rows = sorted.map(r => `
        <tr class="${r.rank % 2 === 0 ? 'even' : ''}">
          <td class="rank-cell">${r.rank}</td>
          <td><strong>${r.student_name}</strong><br><span style="color:#94a3b8;font-size:11px">${r.email}</span></td>
          <td>${r.correct_answers} / ${r.total_questions || totalQs}</td>
          <td>${r.earned_marks} / ${r.total_marks || totalMarks}</td>
          <td>
            <div class="score-bar"><div class="score-fill ${r.score_percentage >= 50 ? 'pass' : r.score_percentage >= 35 ? 'avg' : 'fail'}" style="width:${r.score_percentage}%"></div></div>
            <span class="${r.score_percentage >= 50 ? 'badge-pass' : r.score_percentage >= 35 ? 'badge-avg' : 'badge-fail'}">${r.score_percentage}%</span>
          </td>
          <td>${r.submitted_at ? new Date(r.submitted_at).toLocaleDateString('en-IN') : '—'}</td>
        </tr>`).join('');
      const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Leaderboard — ${assessTitle}</title>
      <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;background:#f8fafc;color:#1e293b;padding:32px}.header{background:linear-gradient(135deg,#1d4ed8,#0891b2);color:white;padding:24px 32px;border-radius:16px;margin-bottom:24px}.header h1{font-size:20px;font-weight:900}.header p{font-size:12px;opacity:.8;margin-top:4px}.meta{display:flex;gap:10px;margin-top:12px;flex-wrap:wrap}.meta span{background:rgba(255,255,255,.2);padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px}.stat{background:white;border-radius:12px;padding:16px;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,.06);border:1px solid #e2e8f0}.stat .val{font-size:28px;font-weight:900;color:#1d4ed8}.stat .lbl{font-size:11px;color:#94a3b8;font-weight:600;margin-top:2px}table{width:100%;border-collapse:collapse;background:white;border-radius:14px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.06)}thead tr{background:linear-gradient(135deg,#1d4ed8,#0891b2);color:white}th{padding:12px 14px;text-align:left;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.05em}td{padding:11px 14px;font-size:12px;border-bottom:1px solid #f1f5f9;vertical-align:middle}tr.even td{background:#f8fafc}.rank-cell{font-weight:900;font-size:14px;color:#1d4ed8;text-align:center}.score-bar{height:6px;background:#e2e8f0;border-radius:3px;width:70px;display:inline-block;vertical-align:middle;margin-right:8px;overflow:hidden}.score-fill{height:100%;border-radius:3px}.score-fill.pass{background:linear-gradient(90deg,#22c55e,#16a34a)}.score-fill.avg{background:linear-gradient(90deg,#3b82f6,#1d4ed8)}.score-fill.fail{background:linear-gradient(90deg,#ef4444,#dc2626)}.badge-pass{background:#dcfce7;color:#16a34a;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700}.badge-avg{background:#dbeafe;color:#1d4ed8;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700}.badge-fail{background:#fee2e2;color:#dc2626;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700}.footer{text-align:center;margin-top:24px;font-size:11px;color:#94a3b8}@media print{body{padding:16px}.header{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body>
      <div class="header"><h1>🏆 ${assessTitle} — Leaderboard Report</h1><p>Generated on ${new Date().toLocaleString('en-IN')}</p><div class="meta"><span>Level: ${meta.level}</span>${meta.jd ? `<span>JD: ${meta.jd}</span>` : ''}${meta.scheduled_date ? `<span>Date: ${new Date(meta.scheduled_date).toLocaleDateString('en-IN')}</span>` : ''}<span>Total Questions: ${totalQs}</span><span>Total Marks: ${totalMarks}</span></div></div>
      <div class="stats"><div class="stat"><div class="val">${sorted.length}</div><div class="lbl">Total Attempts</div></div><div class="stat"><div class="val">${avgScore}%</div><div class="lbl">Average Score</div></div><div class="stat"><div class="val">${passCount}</div><div class="lbl">Passed (≥50%)</div></div><div class="stat"><div class="val">${topScore}%</div><div class="lbl">Top Score</div></div></div>
      <table><thead><tr><th style="text-align:center">Rank</th><th>Student</th><th>Correct Answers</th><th>Marks Earned</th><th>Score %</th><th>Submitted</th></tr></thead><tbody>${rows}</tbody></table>
      <div class="footer">ICL Assessment System · ${assessTitle} · Leaderboard</div></body></html>`;
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const w = window.open(url, '_blank');
      if (w) setTimeout(() => w.print(), 800);
    } catch (e) {
      alert(e.message || 'Report generation failed');
    } finally {
      setGeneratingReport(false);
    }
  };

  // FIX: fullScreen={false} prevents the full-screen gradient box artifact
  // inside CollegeAdminLayout during initial page load
  if (loading) return (
    <CollegeAdminLayout>
      <div className="flex items-center justify-center py-24">
        <InlineSkeleton rows={5} />
      </div>
    </CollegeAdminLayout>
  );

  const assessmentTitle = assessment?.title || `${assessment?.skill_id?.name || 'Assessment'} — ${assessment?.level || ''}`;

  return (
    <CollegeAdminLayout>
      <div className="px-6 py-4 md:px-8 md:py-6 space-y-5 font-sans">

        {/* Back */}
        <button onClick={() => navigate('/dashboard/college-admin/assessments')}
          className="flex items-center gap-2 text-gray-500 hover:text-[#003399] mb-2 transition-colors group text-[13px] font-bold">
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Back to Assessments
        </button>

        {/* ── HEADER ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2 h-8 bg-gradient-to-b from-[#003399] to-[#00A9CE] rounded-full inline-block flex-shrink-0" />
              Leaderboard
            </h1>
            <p className="text-[12px] md:text-[14px] text-gray-500 mt-1 max-w-xs md:max-w-md truncate">
              {assessmentTitle}
            </p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {assessment?.status && (
                <span className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-full ${isCompleted ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {assessment.status.charAt(0).toUpperCase() + assessment.status.slice(1)}
                </span>
              )}
              {isJD && <span className="inline-block text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700">JD-Based</span>}
              {isPublished && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-green-50 border border-green-200 text-green-700">
                  <CheckCircle2 className="w-3 h-3" /> Published
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={handleExportCSV} disabled={attempts.length === 0}
              className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 text-[13px] font-bold px-4 py-2 rounded-lg hover:bg-slate-50/30 transition-colors shadow-sm disabled:opacity-40">
              <Download className="w-4 h-4" /> CSV
            </button>
            <button onClick={handleDownloadReport} disabled={attempts.length === 0 || generatingReport}
              className="inline-flex items-center gap-1.5 bg-[#003399] hover:bg-[#002d8b] text-white text-[11px] font-black uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-500/10 active:scale-95 disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-[#003399]/30 focus:ring-offset-1">
              {generatingReport ? <><RefreshCw className="w-4 h-4 animate-spin" /> Generating…</> : <><FileText className="w-4 h-4" /> Full Report</>}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
          {[
            { label: 'In Progress',    value: stats.inProgressCount, color: stats.inProgressCount > 0 ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-gray-50 border-gray-100 text-slate-400', live: stats.inProgressCount > 0 },
            { label: 'Submitted',      value: stats.total,           color: 'bg-[#003399]/5 border-[#003399]/10 text-[#003399]' },
            { label: 'Avg Score',      value: `${stats.avg}%`,       color: 'bg-cyan-50 border-cyan-100 text-cyan-700' },
            { label: 'Passed (≥50%)',  value: stats.passed,          color: 'bg-green-50 border-green-100 text-green-700' },
            { label: 'Top Score',      value: `${stats.topScore}%`,  color: 'bg-indigo-50 border-indigo-100 text-indigo-700' },
            { label: 'Flagged', value: stats.flagged, icon: true, color: stats.flagged > 0 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-gray-50 border-gray-100 text-slate-400' },
          ].map(s => (
            <div key={s.label} className={`px-4 py-3 rounded-xl border ${s.color} text-center relative overflow-hidden`}>
              {s.live && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
              {s.icon && s.value > 0
                ? <div className="flex items-center justify-center gap-1"><ShieldAlert className="w-5 h-5" /><p className="text-2xl font-black tabular-nums">{s.value}</p></div>
                : <p className="text-2xl font-black tabular-nums">{s.value}</p>}
              <p className="text-[10px] font-semibold opacity-60 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {/* In-Progress students */}
        <InProgressSection students={inProgress} onViewDetails={setProctoringModalAttempt} />

        {/* Table */}
        {attempts.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-16 text-center">
            <div className="w-14 h-14 bg-[#003399]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-7 h-7 text-[#003399]/40" />
            </div>
            <h3 className="text-lg font-bold text-gray-700 mb-1">No Submitted Attempts Yet</h3>
            <p className="text-slate-400 text-sm">
              {inProgress.length > 0
                ? `${inProgress.length} student${inProgress.length !== 1 ? 's are' : ' is'} currently taking the assessment.`
                : "Students haven't taken this assessment yet."}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden min-h-[400px] flex flex-col">
            <div className="px-5 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-[#003399]/5 rounded-md flex items-center justify-center">
                  <Trophy className="w-3 h-3 text-[#003399]" />
                </div>
                <p className="font-bold text-gray-800 text-sm">{total} Attempt{total !== 1 ? 's' : ''}</p>
              </div>
              {isJD && assessment?.leaderboard_top_n && isPublished && (
                <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">
                  Top {assessment.leaderboard_top_n} shortlisted
                </span>
              )}
            </div>
            <div className="flex-1 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/40">
                    {['Rank', 'Student', 'Score %', 'Marks', 'Correct', 'Time', 'Submitted', 'Proctoring', 'Actions'].map(h => (
                      <th key={h} className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest bg-gray-50/40 px-4 py-3 last:text-right last:pr-5 first:pl-5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {sortedAttempts.map((a, idx) => {
                    const isTopN = isJD && assessment?.leaderboard_top_n && idx < assessment.leaderboard_top_n;
                    return (
                      <tr key={a._id} className={`hover:bg-slate-50/20 transition-colors group ${isTopN ? 'bg-amber-50/30' : ''}`}>
                        <td className="px-4 py-3 first:pl-5 last:pr-5">
                          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black
                            ${idx === 0 ? 'bg-amber-100 text-amber-700' : idx === 1 ? 'bg-gray-100 text-gray-600' : idx === 2 ? 'bg-orange-100 text-orange-600' : 'bg-gray-50 text-slate-400'}`}>
                            {idx + 1}
                          </span>
                        </td>
                        <td className="px-4 py-3 first:pl-5 last:pr-5">
                          <p className="text-[14px] font-bold text-gray-900">{a.student_id?.fullName || '—'}</p>
                          <p className="text-[10px] text-slate-300 italic">{a.student_id?.email || '—'}</p>
                        </td>
                        <td className="px-4 py-3"><ScoreBar pct={a.score_percentage || 0} /></td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-bold text-gray-900">{a.earned_marks ?? 0}<span className="text-slate-400 font-normal">/{a.total_marks ?? 0}</span></div>
                          <div className="text-[10px] text-slate-300 italic">marks</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-bold text-gray-900">{a.correct_answers ?? 0}<span className="text-slate-400 font-normal">/{a.total_questions ?? 0}</span></div>
                          <div className="text-[10px] text-slate-300 italic">questions</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 text-sm font-semibold text-gray-700">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {fmtTime(a.time_taken_seconds)}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-xs text-slate-400 whitespace-nowrap">
                          {a.submitted_at ? new Date(a.submitted_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                        </td>
                        <td className="px-4 py-3 first:pl-5 last:pr-5">
                          <ProctoringPanel attempt={a} onViewDetails={setProctoringModalAttempt} />
                        </td>
                        <td className="px-4 py-3 text-right last:pr-5">
                          <ActionMenu actions={[
                            { label: 'View Answers', icon: Eye, onClick: () => setSelectedAttempt(a), color: 'text-[#003399] hover:bg-slate-50' },
                          ]} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-gray-50/40">
                <span className="text-xs text-slate-400">Page {page} of {totalPages}</span>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:border-[#003399]/30 disabled:opacity-40 transition-colors">
                    <ChevronLeft className="w-3.5 h-3.5" /> Prev
                  </button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:border-[#003399]/30 disabled:opacity-40 transition-colors">
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Publish Leaderboard Footer Section */}
        <div className={`rounded-xl shadow-sm border p-5 mt-4 ${isPublished ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100'}`}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isPublished ? 'bg-green-100' : 'bg-[#003399]/5'}`}>
                {isPublished ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <Send className="w-5 h-5 text-[#00A9CE]" />}
              </div>
              <div>
                <p className={`font-bold text-sm ${isPublished ? 'text-green-800' : 'text-gray-800'}`}>
                  {isPublished ? 'Leaderboard Published' : 'Publish Leaderboard'}
                </p>
                {isPublished ? (
                  <p className="text-xs text-green-700 mt-0.5">
                    {isJD
                      ? `Top ${assessment?.leaderboard_top_n || '?'} students shortlisted. Results are now visible to all students who attempted.`
                      : 'Each student can now view their own marks and score.'}
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {!isCompleted
                      ? 'Available once the assessment status is Completed.'
                      : isJD
                        ? 'Select top-N students to shortlist and publish results to students.'
                        : "Publish to release each student's individual result to them."}
                  </p>
                )}
              </div>
            </div>
            {!isPublished && (
              <button
                onClick={() => setShowPublishModal(true)}
                disabled={!isCompleted || attempts.length === 0}
                title={!isCompleted ? 'Assessment must be completed first' : ''}
                className="flex items-center flex-shrink-0 gap-2 px-5 py-2.5 bg-[#003399] text-white rounded-lg text-[13px] font-bold hover:bg-[#003399] disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-colors">
                <Trophy className="w-4 h-4" />
                Publish Leaderboard
              </button>
            )}
          </div>
        </div>

      </div>

      {selectedAttempt && (
        <AttemptDetailModal attempt={selectedAttempt} assessmentId={assessmentId} onClose={() => setSelectedAttempt(null)} />
      )}
      {proctoringModalAttempt && (
        <ProctoringModal attempt={proctoringModalAttempt} onClose={() => setProctoringModalAttempt(null)} />
      )}
      {showPublishModal && assessment && (
        <PublishModal
          assessment={{ ...assessment, _attemptCount: total }}
          onClose={() => setShowPublishModal(false)}
          onPublished={fetchData}
        />
      )}

    </CollegeAdminLayout>
  );
};

export default AssessmentAttempts;