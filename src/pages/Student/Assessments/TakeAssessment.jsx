// src/pages/assessment/TakeAssessment.jsx
// Redesigned: HackerEarth/HackerRank-style layout — WHITE THEME
// Layout: Fixed left sidebar (question numbers) | Scrollable middle (question content) | Fixed right (code editor)

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Clock, Flag, Send, ChevronLeft, ChevronRight,
  AlertTriangle, BookOpen, Shield, CheckCircle2,
  Loader2, SkipForward
} from 'lucide-react';
import { assessmentAPI, assessmentAttemptAPI } from '../../../api/Api';
import CodeEditor from '../../../components/assessment/CodeEditor';

// ── Utility: format seconds → MM:SS ────────────────────────────
const formatTime = (seconds) => {
  if (seconds <= 0) return '00:00';
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

// ── Question Status Pill (left sidebar) ──────────────────────────
const QuestionPill = ({ number, status, onClick, isCurrent }) => {
  const base = 'w-9 h-9 rounded-lg flex items-center justify-center text-[13px] font-bold cursor-pointer transition-all duration-150 select-none border';
  const styles = {
    current: 'bg-blue-600 text-white border-blue-600 shadow-[0_0_0_2px_rgba(37,99,235,0.25)]',
    answered: 'bg-blue-50 text-blue-700 border-blue-200 hover:border-blue-400',
    unanswered: 'bg-white text-gray-400 border-gray-200 hover:border-gray-400 hover:text-gray-600',
    flagged: 'bg-amber-50 text-amber-600 border-amber-300',
    skipped: 'bg-orange-50 text-orange-500 border-orange-200 hover:border-orange-400',
  };
  const style = isCurrent ? styles.current : styles[status] || styles.unanswered;
  return (
    <button onClick={onClick} className={`${base} ${style}`} title={`Question ${number}`}>
      {number}
    </button>
  );
};

// ── Complexity Badge ──────────────────────────────────────────────
const ComplexityBadge = ({ label, value }) => (
  <div className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-md bg-gray-50 border border-gray-200">
    <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
    <span className="text-[11px] font-bold text-blue-600 font-mono">{value}</span>
  </div>
);

// ── Tag Chip ─────────────────────────────────────────────────────
const TagChip = ({ label }) => {
  const colors = {
    'coding question': 'bg-blue-50 text-blue-700 border-blue-200',
    coding: 'bg-blue-50 text-blue-700 border-blue-200',
    strings: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    arrays: 'bg-purple-50 text-purple-700 border-purple-200',
    default: 'bg-gray-100 text-gray-600 border-gray-200',
  };
  const cls = colors[label?.toLowerCase()] || colors.default;
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${cls}`}>
      {label}
    </span>
  );
};

// ── Sample Test Case Card ─────────────────────────────────────────
const SampleCase = ({ index, input, output, explanation }) => (
  <div className="rounded-lg border border-gray-200 overflow-hidden bg-white shadow-sm">
    <div className="bg-gray-50 px-3 py-1.5 border-b border-gray-200">
      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Sample Case {index}</span>
    </div>
    <div className="grid grid-cols-2 divide-x divide-gray-200">
      <div className="p-3">
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Input</p>
        <pre className="text-[12px] font-mono text-gray-800 whitespace-pre-wrap leading-relaxed">{input}</pre>
      </div>
      <div className="p-3">
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Output</p>
        <pre className="text-[12px] font-mono text-emerald-600 whitespace-pre-wrap leading-relaxed">{output}</pre>
      </div>
    </div>
    {explanation && (
      <div className="px-3 py-2 border-t border-gray-100 bg-gray-50/50">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Explanation</p>
        <p className="text-[12px] text-gray-600 italic leading-relaxed">{explanation}</p>
      </div>
    )}
  </div>
);

// ── Full-screen Loader ────────────────────────────────────────────
const FullLoader = ({ title, sub, pct }) => (
  <div className="h-screen w-screen bg-white flex items-center justify-center">
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
      </div>
      <h2 className="text-[16px] font-bold text-gray-900">{title}</h2>
      {sub && <p className="text-[13px] text-gray-500">{sub}</p>}
      {pct !== undefined && (
        <div className="w-48">
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-1.5 bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-[11px] font-bold text-gray-400 mt-2">{pct}% loaded</p>
        </div>
      )}
    </div>
  </div>
);

// ── Main TakeAssessment ───────────────────────────────────────────
const TakeAssessment = () => {
  const { assessmentId } = useParams();
  const navigate = useNavigate();

  // ── State ─────────────────────────────────────────────────────
  const [phase, setPhase] = useState('loading');       // 'loading' | 'fetching' | 'in_progress' | 'submitting' | 'done'
  const [briefingInfo, setBriefingInfo] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});              // qid → answer value
  const [statuses, setStatuses] = useState({});              // qid → 'unanswered'|'answered'|'skipped'|'flagged'
  const [flagged, setFlagged] = useState({});              // qid → bool
  const [error, setError] = useState('');
  const [submissionId, setSubmissionId] = useState(null);
  const [fetchProgress, setFetchProgress] = useState({ loaded: 0, total: 0 });
  const [submitConfirm, setSubmitConfirm] = useState(false);
  const questionScrollRef = useRef(null);

  // ── Timer state ───────────────────────────────────────────────
  const [remaining, setRemaining] = useState(0);
  const timerRef = useRef(null);

  // ── Scroll to top on question change ──────────────────────────
  useEffect(() => {
    if (questionScrollRef.current) questionScrollRef.current.scrollTop = 0;
  }, [currentIdx]);

  // ── Check for existing attempts & fetch briefing info ─────────
  useEffect(() => {
    assessmentAttemptAPI.getMyAttempts(assessmentId)
      .then(res => {
        if (res.success && res.attempts?.some(a => a.status === 'submitted')) {
          navigate('/dashboard/student/assessments/history', { replace: true });
          return;
        }
      })
      .catch(() => { });

    assessmentAPI.getAssessmentDetails(assessmentId)
      .then(res => {
        if (res.success) {
          setBriefingInfo(res.assessment);
          setPhase('briefing');
        }
      })
      .catch(e => {
        setError(e.message || 'Failed to load assessment');
        setPhase('loading');
      });
  }, [assessmentId]);

  // ── Start timer ───────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'in_progress' || remaining <= 0) return;
    timerRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleSubmit('timer_expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  const isTimeLow = remaining > 0 && remaining < 300;

  // ── Begin assessment: start attempt + fetch questions ──────────
  const handleBegin = async (info) => {
    setPhase('loading');
    setError('');
    try {
      const startRes = await assessmentAPI.startAssessment(assessmentId);
      if (!startRes.success) throw new Error(startRes.message || 'Failed to start');

      const { attempt_id, total_questions } = startRes;
      if (!total_questions) throw new Error('This assessment has no questions.');

      setSubmissionId(attempt_id);
      setPhase('fetching');
      setFetchProgress({ loaded: 0, total: total_questions });

      // Fetch all questions in parallel
      const qs = (await Promise.all(
        Array.from({ length: total_questions }, (_, i) =>
          assessmentAPI.getQuestion(attempt_id, i + 1)
            .then(res => {
              setFetchProgress(p => ({ ...p, loaded: p.loaded + 1 }));
              return res.success ? res.question : null;
            })
            .catch(() => null)
        )
      )).filter(Boolean);

      if (!qs.length) throw new Error('Failed to load questions.');

      setQuestions(qs);

      // Initialize statuses
      const initStatuses = {};
      qs.forEach(q => { initStatuses[q.question_id] = 'unanswered'; });
      setStatuses(initStatuses);

      // Set timer
      const duration = info?.duration_minutes || briefingInfo?.duration_minutes || 60;
      setRemaining(duration * 60);

      setPhase('in_progress');
    } catch (e) {
      setError(e.message);
      setPhase('loading');
    }
  };

  // ── Answer helpers ────────────────────────────────────────────
  const setAnswer = (qid, val) => {
    setAnswers(p => ({ ...p, [qid]: val }));
    setStatuses(p => ({ ...p, [qid]: flagged[qid] ? 'flagged' : 'answered' }));
  };

  const toggleFlag = (qid) => {
    const now = !flagged[qid];
    setFlagged(p => ({ ...p, [qid]: now }));
    setStatuses(p => ({ ...p, [qid]: now ? 'flagged' : answers[qid] != null ? 'answered' : 'unanswered' }));
  };

  const handleSkip = (qid) => {
    if (answers[qid] == null) setStatuses(p => ({ ...p, [qid]: 'skipped' }));
    setCurrentIdx(i => Math.min(i + 1, questions.length - 1));
  };

  // ── Submit assessment ─────────────────────────────────────────
  const handleSubmit = useCallback(async (reason = 'manual') => {
    setSubmitConfirm(false);
    setPhase('submitting');
    clearInterval(timerRef.current);
    try {
      const res = await assessmentAttemptAPI.submitAssessment(
        assessmentId,
        questions.map(q => ({
          question_id: q.question_id,
          selected_answer: answers[q.question_id] ?? null,
        }))
      );
      if (!res.success) throw new Error(res.message);
      setPhase('done');
    } catch (e) {
      setError(e.message);
      setPhase('in_progress');
    }
  }, [assessmentId, questions, answers]);

  // ── Question status helper ────────────────────────────────────
  const getStatus = (q) => statuses[q.question_id] || 'unanswered';

  // ── Phase: Briefing (Instructions) ────────────────────────────
  if (phase === 'briefing') {
    return (
      <div className="min-h-screen bg-[#F8F9fa] font-sans text-gray-800 flex flex-col" style={{ fontFamily: "'Inter', 'IBM Plex Sans', sans-serif" }}>
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-3 max-w-[70%]">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-[16px] font-bold text-gray-900 truncate">
              {briefingInfo?.skill_id?.name || briefingInfo?.skill || 'Assessment Instructions'}
            </h1>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 border border-green-200 shrink-0">
            <Shield className="w-3.5 h-3.5 text-green-600" />
            <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider">Secured</span>
          </div>
        </header>

        {/* Main Content Box */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
            
            {/* Left Column: Instructions */}
            <div className="flex-1 w-full bg-white p-6 lg:p-8 rounded-2xl border border-gray-200 shadow-sm">
              <h2 className="text-[22px] font-bold text-gray-900 mb-6">Instructions</h2>
              
              <div className="space-y-8">
                <section>
                  <h3 className="text-[13px] font-bold text-blue-800 bg-blue-50 px-3 py-1.5 inline-flex items-center gap-2 rounded-lg mb-4">
                    <Clock className="w-4 h-4" /> TIMING & NAVIGATION
                  </h3>
                  <ul className="text-[14px] text-gray-600 space-y-3">
                    <li className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 shrink-0" />
                      <div>The assessment duration is <strong className="text-gray-900">{briefingInfo?.duration_minutes || 60} minutes</strong>.</div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 shrink-0" />
                      <div>The timer will start the moment you click on "Start Assessment".</div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 shrink-0" />
                      <div>You can skip questions and navigate between them using the right panel during the test.</div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 shrink-0" />
                      <div>Answers are continuously saved automatically.</div>
                    </li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-[13px] font-bold text-blue-800 bg-blue-50 px-3 py-1.5 inline-flex items-center gap-2 rounded-lg mb-4">
                    <Shield className="w-4 h-4" /> PROCTORING & INTEGRITY
                  </h3>
                  <ul className="text-[14px] text-gray-600 space-y-3">
                    <li className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 shrink-0" />
                      <div>Ensure you are in a quiet, properly lit room with a stable internet connection.</div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 shrink-0" />
                      <div><strong>Do not switch tabs or minimize the browser.</strong> Navigating away may lead to automatic test submission or penalty.</div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 shrink-0" />
                      <div>Any form of unauthorized material or suspicious activity will instantly flag your session directly to the admin.</div>
                    </li>
                  </ul>
                </section>

                {briefingInfo?.instructions && (
                  <section>
                    <h3 className="text-[13px] font-bold text-blue-800 bg-blue-50 px-3 py-1.5 inline-flex items-center gap-2 rounded-lg mb-4">
                      <BookOpen className="w-4 h-4" /> SPECIFIC GUIDELINES
                    </h3>
                    <div className="text-[14px] text-gray-700 bg-gray-50/80 p-5 rounded-xl border border-gray-100 whitespace-pre-wrap leading-relaxed">
                      {briefingInfo.instructions}
                    </div>
                  </section>
                )}
              </div>

              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5 mt-8 flex gap-4">
                <AlertTriangle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-blue-900 text-[14px] mb-1">Important Note</h4>
                  <p className="text-blue-800/80 text-[13px] leading-relaxed">
                    Make sure you have blocked out at least {briefingInfo?.duration_minutes || 60} minutes for this assessment. Once started, you cannot pause the timer. Please do not press F5 or the Back button during the test.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Summary Card */}
            <div className="w-full lg:w-[360px] shrink-0 sticky top-24">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-100">
                  <h3 className="font-bold text-gray-900 text-[15px]">Assessment details</h3>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center justify-between py-3.5 border-b border-gray-100">
                    <div className="flex items-center gap-2 text-[13px] text-gray-500 font-medium">
                      <BookOpen className="w-4 h-4 text-gray-400" /> Total Questions
                    </div>
                    <span className="font-bold text-gray-900 text-[14px]">{briefingInfo?.total_questions || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between py-3.5 border-b border-gray-100">
                    <div className="flex items-center gap-2 text-[13px] text-gray-500 font-medium">
                      <Clock className="w-4 h-4 text-gray-400" /> Duration
                    </div>
                    <span className="font-bold text-gray-900 text-[14px]">{briefingInfo?.duration_minutes || 60} mins</span>
                  </div>
                  <div className="flex items-center justify-between py-3.5 border-b border-gray-100">
                    <div className="flex items-center gap-2 text-[13px] text-gray-500 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-gray-400" /> Pass Mark
                    </div>
                    <span className="font-bold text-gray-900 text-[14px]">{briefingInfo?.passing_score || 50}%</span>
                  </div>
                  <div className="flex items-center justify-between py-3.5 mb-2">
                    <div className="flex items-center gap-2 text-[13px] text-gray-500 font-medium">
                      <Shield className="w-4 h-4 text-gray-400" /> Security
                    </div>
                    <span className="flex items-center gap-1 font-bold text-green-700 bg-green-50 px-2.5 py-0.5 rounded border border-green-200 text-[10px] uppercase tracking-wider">
                      Enabled
                    </span>
                  </div>

                  <div className="mt-6 space-y-3">
                    <button 
                      onClick={() => handleBegin(briefingInfo)}
                      className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm text-[14px]"
                    >
                      <Send className="w-4 h-4" /> Start Assessment
                    </button>
                    <button 
                      onClick={() => navigate('/dashboard/student/assessments')}
                      className="w-full py-3 text-gray-500 font-bold hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors text-[13px]"
                    >
                      Cancel
                    </button>
                  </div>
                  
                  <div className="mt-6 pt-5 border-t border-gray-100 flex items-start gap-2.5 text-[11px] text-gray-400 leading-relaxed font-medium">
                    <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5 text-gray-300" />
                    <p>By starting, you agree to the Academic Integrity Policy and terms of service. Disciplinary actions apply to violations.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    );
  }

  // ── Phase: Loading ────────────────────────────────────────────
  if (phase === 'loading') {
    if (error) {
      return (
        <div className="h-screen w-screen bg-white flex items-center justify-center">
          <div className="text-center max-w-sm">
            <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-4" />
            <h2 className="text-[16px] font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-[13px] text-gray-500 mb-4">{error}</p>
            <button onClick={() => navigate(-1)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-[13px] font-bold">
              Go Back
            </button>
          </div>
        </div>
      );
    }
    return <FullLoader title="Starting Assessment" sub="Preparing your environment..." />;
  }

  if (phase === 'fetching') {
    const pct = fetchProgress.total > 0 ? Math.round((fetchProgress.loaded / fetchProgress.total) * 100) : 0;
    return <FullLoader title="Loading Questions" sub={`Fetching ${fetchProgress.loaded} of ${fetchProgress.total}`} pct={pct} />;
  }

  if (phase === 'submitting') return <FullLoader title="Submitting Assessment" sub="Please do not close this tab." />;

  // ── Phase: Done ───────────────────────────────────────────────
  if (phase === 'done') {
    const answeredCount = Object.values(answers).filter(v => v != null && (!Array.isArray(v) || v.length > 0)).length;
    return (
      <div className="h-screen w-screen bg-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-green-50 border border-green-200 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-[20px] font-bold text-gray-900 mb-2">Assessment Submitted!</h2>
          <p className="text-[14px] text-gray-500 mb-6">
            You answered {answeredCount} of {questions.length} questions. Results will be available once published.
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate('/dashboard/student/assessments/history')}
              className="px-5 py-2.5 border border-gray-200 rounded-xl text-[13px] font-bold text-gray-700 hover:bg-gray-50">
              View History
            </button>
            <button onClick={() => navigate('/dashboard/student/assessments')}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-[13px] font-bold hover:bg-blue-700">
              Back to Assessments
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Phase: In Progress ────────────────────────────────────────
  const q = questions[currentIdx];
  if (!q) return null;

  const total = questions.length;
  const qid = q.question_id;
  const questionText = q.question_text || q.question || '(Question text unavailable)';
  const opts = q.options || [];
  const answeredCount = Object.values(answers).filter(v => v != null && (!Array.isArray(v) || v.length > 0)).length;

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-white" style={{ fontFamily: "'Inter', 'IBM Plex Sans', sans-serif" }}>

      {/* ═══════════════════════════════════════════════════════
          TOP NAV BAR
      ═══════════════════════════════════════════════════════ */}
      <header className="flex items-center justify-between px-5 shrink-0 border-b border-gray-200 bg-white shadow-sm" style={{ height: '52px' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-[14px] font-bold text-gray-900 truncate max-w-[240px] block leading-tight">
              {briefingInfo?.skill_id?.name || briefingInfo?.skill || 'Assessment'}
            </span>
            <span className="text-[11px] text-gray-400 font-medium">
              Question {currentIdx + 1} of {total} <span className="mx-1">·</span> {answeredCount} Answered
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 border border-green-200">
          <Shield className="w-3.5 h-3.5 text-green-600" />
          <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider">Secured</span>
        </div>

        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-mono text-[13px] font-bold border transition-colors ${isTimeLow ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-gray-50 text-gray-900 border-gray-200'
            }`}>
            <Clock className={`w-3.5 h-3.5 ${isTimeLow ? 'text-red-500' : 'text-blue-600'}`} />
            {formatTime(remaining)}
          </div>
          <button onClick={() => setSubmitConfirm(true)}
            className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold transition-colors shadow-sm">
            <Send className="w-3.5 h-3.5" /> Submit Assessment
          </button>
        </div>
      </header>

      {/* Error bar */}
      {error && (
        <div className="px-5 py-2 bg-red-50 border-b border-red-100 flex items-center gap-2 text-[12px] font-medium text-red-700">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {error}
          <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600 text-[11px] font-bold">Dismiss</button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          MAIN 3-COLUMN BODY
      ═══════════════════════════════════════════════════════ */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* LEFT SIDEBAR — Question number navigator */}
        <aside className="flex flex-col items-center py-3 gap-2 shrink-0 overflow-y-auto border-r border-gray-200 bg-gray-50" style={{ width: '56px' }}>
          {questions.map((sq, idx) => (
            <QuestionPill
              key={sq.question_id}
              number={idx + 1}
              status={getStatus(sq)}
              isCurrent={idx === currentIdx}
              onClick={() => setCurrentIdx(idx)}
            />
          ))}
          <div className="mt-auto pt-3 border-t border-gray-200 w-full flex flex-col items-center gap-2 pb-2">
            <div className="w-2 h-2 rounded-sm bg-blue-600" title="Current" />
            <div className="w-2 h-2 rounded-sm bg-blue-100 border border-blue-300" title="Answered" />
            <div className="w-2 h-2 rounded-sm bg-white border border-gray-300" title="Unanswered" />
            <div className="w-2 h-2 rounded-sm bg-amber-100 border border-amber-400" title="Flagged" />
          </div>
        </aside>

        {/* MIDDLE — Question content (scrollable) */}
        <main ref={questionScrollRef} className="flex-1 overflow-y-auto min-h-0 bg-white">
          <div className="max-w-[680px] mx-auto px-6 py-5 pb-16">

            {/* Question header */}
            <div className="mb-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                      Q{currentIdx + 1}
                    </span>
                    <span className="text-[11px] text-gray-400 font-medium">{q.marks ?? 1} Mark{(q.marks ?? 1) !== 1 ? 's' : ''}</span>
                  </div>
                  <h1 className="text-[20px] font-bold text-gray-900 leading-snug">{questionText}</h1>
                </div>
                <button onClick={() => toggleFlag(qid)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition-colors shrink-0 ${flagged[qid] ? 'bg-amber-50 text-amber-600 border-amber-300' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                    }`}>
                  <Flag className="w-3.5 h-3.5" /> {flagged[qid] ? 'Flagged' : 'Flag'}
                </button>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                {q.type === 'coding' && <TagChip label="Coding Question" />}
                {q.algorithm_tags?.map(t => <TagChip key={t} label={t} />)}
              </div>
            </div>

            {/* ── For CODING questions: show problem details ── */}
            {q.type === 'coding' && (
              <>
                {q.problem_description && (
                  <section className="mb-5">
                    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
                      <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
                        <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Problem Description</span>
                      </div>
                      <div className="p-4">
                        <p className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-wrap">{q.problem_description}</p>
                      </div>
                    </div>
                  </section>
                )}

                {(q.input_format || q.output_format) && (
                  <section className="mb-5 grid grid-cols-2 gap-3">
                    {q.input_format && (
                      <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
                        <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Input Format</span>
                        </div>
                        <div className="p-3">
                          <p className="text-[12px] text-gray-600 leading-relaxed font-mono whitespace-pre-wrap">{q.input_format}</p>
                        </div>
                      </div>
                    )}
                    {q.output_format && (
                      <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
                        <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Output Format</span>
                        </div>
                        <div className="p-3">
                          <p className="text-[12px] text-gray-600 leading-relaxed font-mono whitespace-pre-wrap">{q.output_format}</p>
                        </div>
                      </div>
                    )}
                  </section>
                )}

                {q.constraints && (
                  <section className="mb-5">
                    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
                      <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Constraints</span>
                        <div className="flex items-center gap-2">
                          {q.time_complexity && <ComplexityBadge label="Time" value={q.time_complexity} />}
                          {q.space_complexity && <ComplexityBadge label="Space" value={q.space_complexity} />}
                        </div>
                      </div>
                      <div className="p-4">
                        <pre className="text-[12px] font-mono text-gray-600 whitespace-pre-wrap">{q.constraints}</pre>
                      </div>
                    </div>
                  </section>
                )}

                {q.test_cases?.filter(tc => !tc.is_hidden).length > 0 && (
                  <section className="mb-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[12px] font-bold text-gray-900">Sample Test Cases</span>
                      <span className="text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-full">
                        {q.test_cases.filter(tc => !tc.is_hidden).length} cases
                      </span>
                    </div>
                    <div className="flex flex-col gap-3">
                      {q.test_cases.filter(tc => !tc.is_hidden).map((tc, i) => (
                        <SampleCase key={i} index={i + 1} input={tc.input} output={tc.expected_output} explanation={tc.explanation} />
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}

            {/* ── For MCQ / FILL-UP questions ── */}
            {(q.type === 'single_answer' || q.type === 'multiple_answer') && opts.length > 0 && (
              <div className="space-y-3 mb-5">
                {opts.map((opt, oIdx) => {
                  const sel = q.type === 'multiple_answer'
                    ? (Array.isArray(answers[qid]) && answers[qid].includes(opt.label))
                    : answers[qid] === opt.label;

                  const click = () => {
                    if (q.type === 'multiple_answer') {
                      const cur = Array.isArray(answers[qid]) ? answers[qid] : [];
                      const next = sel ? cur.filter(l => l !== opt.label) : [...cur, opt.label];
                      setAnswers(p => ({ ...p, [qid]: next.length ? next : null }));
                      setStatuses(p => ({ ...p, [qid]: flagged[qid] ? 'flagged' : next.length ? 'answered' : 'unanswered' }));
                    } else {
                      setAnswer(qid, opt.label);
                    }
                  };

                  return (
                    <button key={opt.label} onClick={click}
                      className={`w-full text-left flex items-center gap-4 px-5 py-4 rounded-xl border-2 transition-all ${sel ? 'border-blue-500 bg-blue-50/40' : 'border-gray-100 bg-white hover:border-gray-300 hover:bg-gray-50'
                        }`}>
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-[13px] font-bold shrink-0 ${sel ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'
                        }`}>
                        {String.fromCharCode(65 + oIdx)}
                      </span>
                      <span className={`font-medium text-[15px] flex-1 ${sel ? 'text-blue-900' : 'text-gray-700'}`}>{opt.text}</span>
                      {sel && <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}

            {q.type === 'fill_up' && (
              <div className="mb-5">
                <input type="text"
                  value={typeof answers[qid] === 'string' ? answers[qid] : ''}
                  onChange={e => setAnswer(qid, e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full border-2 border-gray-200 rounded-xl px-5 py-4 text-[15px] font-medium text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-50 transition-all bg-gray-50 focus:bg-white"
                  autoComplete="off" spellCheck="false"
                />
              </div>
            )}

            {/* Bottom navigation */}
            <div className="flex items-center justify-between pt-2">
              <button onClick={() => setCurrentIdx(i => Math.max(0, i - 1))} disabled={currentIdx === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-[12px] font-bold text-gray-500 hover:border-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </button>
              <div className="flex items-center gap-2">
                <button onClick={() => handleSkip(qid)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-[12px] font-bold text-gray-500 hover:border-gray-400 transition-colors">
                  Skip <SkipForward className="w-3 h-3" />
                </button>
                {currentIdx < total - 1 ? (
                  <button onClick={() => setCurrentIdx(i => Math.min(i + 1, total - 1))}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 text-white text-[12px] font-bold hover:bg-blue-700 transition-colors">
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button onClick={() => setSubmitConfirm(true)}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-green-600 text-white text-[12px] font-bold hover:bg-green-700 transition-colors">
                    Submit <Send className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* RIGHT PANEL — Code editor (only for coding questions) */}
        {q.type === 'coding' && (
          <aside className="flex flex-col shrink-0 border-l border-gray-200 overflow-hidden bg-gray-50"
            style={{ width: '50%', minWidth: '480px', maxWidth: '800px' }}>
            <div className="flex-1 min-h-0 overflow-hidden p-3">
              <CodeEditor
                key={qid}
                assessmentId={assessmentId}
                questionId={qid}
                questionText={q.question}
                marks={q.marks}
                boilerplateCode={q.boilerplate_code || q.starter_code}
                defaultLanguage={briefingInfo?.default_coding_language || 'python'}
                onCodeSubmitted={({ passedCount, totalCount }) => {
                  setAnswer(qid, `[Code submitted: ${passedCount}/${totalCount} tests passed]`);
                }}
              />
            </div>
          </aside>
        )}
      </div>

      {/* ── Submit confirmation modal ── */}
      {submitConfirm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center border border-gray-100">
            <div className="w-14 h-14 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <AlertTriangle className="w-7 h-7 text-blue-600" />
            </div>
            <h3 className="font-bold text-[18px] text-gray-900 mb-2">Submit Assessment?</h3>
            <p className="text-[14px] text-gray-500 mb-3">
              You've answered <strong className="text-gray-900">{answeredCount}</strong> out of <strong className="text-gray-900">{total}</strong> questions.
            </p>
            {total - answeredCount > 0 && (
              <div className="bg-red-50 text-red-600 font-medium text-[12px] py-2 px-3 rounded-lg mb-4 border border-red-100">
                {total - answeredCount} unanswered question{total - answeredCount !== 1 ? 's' : ''} will be marked incorrect.
              </div>
            )}
            <div className="flex gap-3 mt-4">
              <button onClick={() => setSubmitConfirm(false)}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-bold text-[13px]">
                Return
              </button>
              <button onClick={() => handleSubmit('manual')}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-[13px] hover:bg-blue-700">
                Confirm Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TakeAssessment;