// pages/Student/Assessments/TakeAssessment.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Clock, ChevronLeft, ChevronRight, Flag, Send,
  AlertTriangle, CheckCircle2, SkipForward, X, ChevronRight as ChevronOpen,
  Loader2, BookOpen, Target, Zap, Award, RotateCcw, TrendingUp, Circle,
  PanelRight, PanelRightClose,
} from 'lucide-react';
import { assessmentAPI, assessmentAttemptAPI } from '../../../api/Api';

// ── Timer ──────────────────────────────────────────────────────────
const Timer = ({ totalSeconds, onExpire }) => {
  const [remaining, setRemaining] = useState(totalSeconds);
  const ref = useRef(null);
  useEffect(() => {
    if (!totalSeconds) return;
    setRemaining(totalSeconds);
    ref.current = setInterval(() => {
      setRemaining(p => {
        if (p <= 1) { clearInterval(ref.current); onExpire?.(); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(ref.current);
  }, [totalSeconds]);
  const m = Math.floor(remaining / 60), s = remaining % 60;
  const pct = totalSeconds > 0 ? remaining / totalSeconds : 0;
  const isRed = remaining < 60, isAmber = remaining < 300;
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold font-mono transition-all
      ${isRed ? 'bg-red-100 text-red-600 border border-red-200 animate-pulse'
               : isAmber ? 'bg-amber-50 text-amber-700 border border-amber-200'
               : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
      <Clock className="w-4 h-4 shrink-0" />
      {String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}
    </div>
  );
};

// ── Loading screen ─────────────────────────────────────────────────
const FullLoader = ({ title, sub, pct }) => (
  <div className="min-h-screen flex items-center justify-center" style={{background:'linear-gradient(135deg,#eff6ff 0%,#e0f2fe 50%,#f0fdf4 100%)'}}>
    <div className="text-center px-4">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-200">
        <Loader2 className="w-9 h-9 text-white animate-spin" />
      </div>
      <h2 className="text-xl font-bold text-gray-800 mb-1">{title}</h2>
      {sub && <p className="text-sm text-gray-500 mb-4">{sub}</p>}
      {pct !== undefined && (
        <>
          <div className="w-64 mx-auto h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
            <div className="h-2 bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full transition-all duration-300" style={{width:`${pct}%`}} />
          </div>
          <p className="text-xs text-gray-400">{pct}% loaded</p>
        </>
      )}
    </div>
  </div>
);

const TakeAssessment = () => {
  const { assessmentId } = useParams();
  const navigate = useNavigate();

  const [phase, setPhase] = useState('briefing');
  const [briefingInfo, setBriefingInfo] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [statuses, setStatuses] = useState({});
  const [flagged, setFlagged] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [submitConfirm, setSubmitConfirm] = useState(false);
  const [fetchProgress, setFetchProgress] = useState({ loaded: 0, total: 0 });

  useEffect(() => {
    assessmentAPI.getAssessmentDetails(assessmentId)
      .then(res => { if (res.success) setBriefingInfo(res.assessment); })
      .catch(() => {});
  }, [assessmentId]);

  const handleBegin = async () => {
    setPhase('loading');
    setError('');
    try {
      const startRes = await assessmentAPI.startAssessment(assessmentId);
      if (!startRes.success) throw new Error(startRes.message || 'Failed to start');
      const { attempt_id, total_questions } = startRes;
      if (!total_questions) throw new Error('This assessment has no questions yet.');

      setPhase('fetching');
      setFetchProgress({ loaded: 0, total: total_questions });
      const qs = (await Promise.all(
        Array.from({ length: total_questions }, (_, i) =>
          assessmentAPI.getQuestion(attempt_id, i + 1)
            .then(res => { setFetchProgress(p => ({ ...p, loaded: p.loaded + 1 })); return res.success ? res.question : null; })
            .catch(() => null)
        )
      )).filter(Boolean);

      if (!qs.length) throw new Error('Failed to load questions.');
      setQuestions(qs);
      const init = {};
      qs.forEach(q => { init[q.question_id] = 'unanswered'; });
      setStatuses(init);
      setPhase('in_progress');
    } catch (e) {
      setError(e.message);
      setPhase('briefing');
    }
  };

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

  const handleSubmit = useCallback(async () => {
    setSubmitConfirm(false);
    setPhase('submitting');
    try {
      const res = await assessmentAttemptAPI.submitAssessment(assessmentId,
        questions.map(q => ({ question_id: q.question_id, selected_answer: answers[q.question_id] ?? null }))
      );
      if (!res.success) throw new Error(res.message);
      setResult(res.result);
      setPhase('done');
    } catch (e) {
      setError(e.message);
      setPhase('in_progress');
    }
  }, [assessmentId, questions, answers]);

  const handleTimerExpire = useCallback(() => {
    if (phase === 'in_progress') handleSubmit();
  }, [phase, handleSubmit]);

  // ── Loading phases ──
  if (phase === 'loading') return <FullLoader title="Starting Assessment…" sub="Please wait" />;
  if (phase === 'fetching') {
    const pct = fetchProgress.total > 0 ? Math.round((fetchProgress.loaded / fetchProgress.total) * 100) : 0;
    return <FullLoader title="Loading Questions…" sub={`${fetchProgress.loaded} of ${fetchProgress.total}`} pct={pct} />;
  }
  if (phase === 'submitting') return <FullLoader title="Submitting Assessment…" sub="Please don't close this tab" />;

  // ── Briefing ──
  if (phase === 'briefing') {
    const skill = briefingInfo?.skill_id?.name || briefingInfo?.skill || 'Skill Assessment';
    const level = briefingInfo?.level || '';
    const duration = briefingInfo?.duration_minutes;
    const totalQ = briefingInfo?.questions_id?.length || briefingInfo?.total_questions || 0;
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{background:'linear-gradient(135deg,#eff6ff 0%,#e0f2fe 50%,#ecfdf5 100%)'}}>
        {/* blobs */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-300/20 blur-3xl" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-cyan-300/20 blur-3xl" />
        </div>
        <div className="relative w-full max-w-lg">
          {/* Card */}
          <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/60 overflow-hidden">
            {/* Top band */}
            <div className="relative overflow-hidden px-8 pt-8 pb-14" style={{background:'linear-gradient(135deg,#2563eb,#0ea5e9)'}}>
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/2" />
              <div className="relative">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-4 border border-white/30 backdrop-blur-sm">
                  <BookOpen className="w-7 h-7 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">{skill}</h1>
                <div className="flex flex-wrap gap-2">
                  {level && <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold text-white border border-white/30">{level} Level</span>}
                </div>
              </div>
            </div>

            {/* Stats chips overlapping the band */}
            <div className="flex gap-4 px-8 -mt-6 mb-6">
              {totalQ > 0 && (
                <div className="flex-1 bg-white rounded-2xl shadow-lg border border-gray-100 px-4 py-3 flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                    <Target className="w-4 h-4 text-blue-600" />
                  </div>
                  <div><div className="text-lg font-bold text-gray-900">{totalQ}</div><div className="text-xs text-gray-500">Questions</div></div>
                </div>
              )}
              {duration && (
                <div className="flex-1 bg-white rounded-2xl shadow-lg border border-gray-100 px-4 py-3 flex items-center gap-3">
                  <div className="w-9 h-9 bg-cyan-50 rounded-xl flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-cyan-600" />
                  </div>
                  <div><div className="text-lg font-bold text-gray-900">{duration}m</div><div className="text-xs text-gray-500">Duration</div></div>
                </div>
              )}
            </div>

            <div className="px-8 pb-8">
              {error && (
                <div className="flex gap-3 items-start bg-red-50 border border-red-200 rounded-2xl p-4 mb-5 text-sm text-red-700">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
                </div>
              )}
              <div className="space-y-2.5 mb-7">
                {[
                  'Timer starts immediately and cannot be paused.',
                  'Navigate freely between questions.',
                  'Auto-submits when time expires.',
                  "Don't refresh or close this tab.",
                ].map((t, i) => (
                  <div key={i} className="flex gap-3 items-start bg-slate-50 rounded-xl px-4 py-3">
                    <span className="w-5 h-5 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5">{i+1}</span>
                    <span className="text-sm text-gray-600">{t}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => navigate(-1)} className="flex-1 py-3.5 rounded-2xl border-2 border-gray-200 text-gray-600 font-medium text-sm hover:bg-gray-50 transition-all">Cancel</button>
                <button onClick={handleBegin} className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold text-sm shadow-lg shadow-blue-200 hover:from-blue-700 hover:to-cyan-600 transition-all active:scale-[0.98]">
                  Begin Assessment →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Result ──
  if (phase === 'done' && result) {
    const pct = result.score_percentage ?? 0;
    const passed = pct >= 70;
    const IconEl = passed ? Award : pct >= 40 ? TrendingUp : RotateCcw;
    const gradBg = passed ? 'from-emerald-500 to-green-500' : pct >= 40 ? 'from-blue-600 to-cyan-500' : 'from-red-500 to-orange-500';
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{background:'linear-gradient(135deg,#eff6ff,#e0f2fe,#ecfdf5)'}}>
        <div className="w-full max-w-md bg-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/60 overflow-hidden">
          <div className={`bg-gradient-to-br ${gradBg} px-8 py-10 text-center relative overflow-hidden`}>
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full border-2 border-white -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div className="relative">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/30"><IconEl className="w-8 h-8 text-white" /></div>
              <div className="text-6xl font-black text-white mb-1">{pct}%</div>
              <p className="text-white/80 font-medium">{passed ? '🎉 Excellent work!' : pct >= 40 ? '👍 Good effort!' : '📚 Keep practising!'}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 px-6 py-5">
            {[
              { label: 'Correct', value: result.correct_answers ?? 0, cls: 'bg-emerald-50 border-emerald-100 text-emerald-700' },
              { label: 'Earned', value: result.earned_marks ?? 0, cls: 'bg-blue-50 border-blue-100 text-blue-700' },
              { label: 'Total Marks', value: result.total_marks ?? 0, cls: 'bg-gray-50 border-gray-100 text-gray-700' },
            ].map(s => (
              <div key={s.label} className={`rounded-2xl p-4 text-center border ${s.cls}`}>
                <div className="text-2xl font-bold">{s.value}</div>
                <div className="text-xs mt-0.5 opacity-70">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="px-6 pb-6 flex gap-3">
            <button onClick={() => navigate('/dashboard/student/assessments/history')} className="flex-1 py-3.5 rounded-2xl border-2 border-gray-200 text-gray-600 font-medium text-sm hover:bg-gray-50">View History</button>
            <button onClick={() => navigate('/dashboard/student/assessments')} className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold text-sm shadow-lg shadow-blue-200">Done</button>
          </div>
        </div>
      </div>
    );
  }

  // ── In Progress ──
  const q = questions[currentIdx];
  if (!q) return null;
  const total = questions.length;
  const qid = q.question_id;
  const questionText = q.question_text || q.question || '(Question text unavailable)';
  const opts = q.options || [];
  const answeredCount = Object.values(answers).filter(v => v != null && (!Array.isArray(v) || v.length > 0)).length;
  const progress = ((currentIdx + 1) / total) * 100;

  const qStatusStyle = {
    answered:   'bg-gradient-to-br from-blue-600 to-cyan-500 text-white border-transparent shadow-md',
    skipped:    'bg-amber-100 text-amber-700 border-amber-300',
    flagged:    'bg-rose-100 text-rose-600 border-rose-300',
    unanswered: 'bg-white text-gray-500 border-gray-200',
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">

      {/* ── Top bar ── */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-40">
        {/* Thin progress line */}
        <div className="h-0.5 bg-gray-100">
          <div className="h-0.5 bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-500" style={{width:`${progress}%`}} />
        </div>
        <div className="px-4 lg:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow shrink-0">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-gray-900 text-sm truncate leading-tight">
                {briefingInfo?.skill_id?.name || briefingInfo?.skill || 'Assessment'}
              </h2>
              <p className="text-xs text-gray-400">Q {currentIdx + 1} of {total} · {answeredCount} answered</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Timer totalSeconds={(briefingInfo?.duration_minutes || 60) * 60} onExpire={handleTimerExpire} />
            <button
              onClick={() => setSidebarOpen(p => !p)}
              className={`p-2.5 rounded-xl border transition-all hidden lg:flex ${sidebarOpen ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'}`}
              title={sidebarOpen ? 'Hide palette' : 'Show palette'}
            >
              {sidebarOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRight className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setSubmitConfirm(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-cyan-600 transition-all shadow-md shadow-blue-200 active:scale-[0.98]"
            >
              <Send className="w-3.5 h-3.5" /> Submit
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="mx-4 mt-3 flex gap-2 items-center bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" /><span className="flex-1">{error}</span>
          <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">

        {/* ── Question area ── */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-2xl mx-auto px-4 py-6 lg:px-8">

            {/* Question card */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden mb-5">
              {/* Card header */}
              <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-1 bg-blue-600 text-white text-xs font-bold rounded-lg">Q{currentIdx + 1}</span>
                  <span className="text-xs text-gray-500">{q.marks ?? 1} mark{(q.marks ?? 1) !== 1 ? 's' : ''}</span>
                  {q.type === 'multiple_answer' && (
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-lg">Multiple</span>
                  )}
                  {flagged[qid] && (
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-600 text-xs font-medium rounded-lg flex items-center gap-1">
                      <Flag className="w-3 h-3" /> Flagged
                    </span>
                  )}
                </div>
                <button
                  onClick={() => toggleFlag(qid)}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-all
                    ${flagged[qid] ? 'bg-rose-100 text-rose-600 border-rose-200 hover:bg-rose-200' : 'bg-white text-gray-500 border-gray-200 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600'}`}
                >
                  <Flag className="w-3 h-3" /> {flagged[qid] ? 'Unflag' : 'Flag'}
                </button>
              </div>

              {/* Question text */}
              <div className="px-6 pt-6 pb-2">
                <p className="text-gray-900 font-medium text-base leading-relaxed">{questionText}</p>
              </div>

              {/* Options */}
              {(q.type === 'single_answer' || q.type === 'multiple_answer') && opts.length > 0 && (
                <div className="px-6 pb-6 pt-4 space-y-3">
                  {opts.map(opt => {
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
                        className={`w-full text-left flex items-center gap-4 px-4 py-3.5 rounded-xl border-2 transition-all group
                          ${sel ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-cyan-50 shadow-md shadow-blue-100'
                                : 'border-gray-100 bg-gray-50/50 hover:border-blue-200 hover:bg-blue-50/40'}`}>
                        <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 transition-all
                          ${sel ? 'bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-200'
                                : 'bg-white text-gray-500 border-2 border-gray-200 group-hover:border-blue-300'}`}>
                          {opt.label}
                        </span>
                        <span className={`font-medium text-sm flex-1 ${sel ? 'text-blue-900' : 'text-gray-700'}`}>{opt.text}</span>
                        {sel && <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />}
                      </button>
                    );
                  })}
                  {q.type === 'multiple_answer' && <p className="text-center text-xs text-gray-400 pt-1">Select all correct answers</p>}
                </div>
              )}

              {q.type === 'fill_up' && (
                <div className="px-6 pb-6 pt-4">
                  <input type="text"
                    value={typeof answers[qid] === 'string' ? answers[qid] : ''}
                    onChange={e => setAnswer(qid, e.target.value)}
                    placeholder="Type your answer here…"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 focus:bg-white transition-all"
                  />
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button onClick={() => setCurrentIdx(i => Math.max(i-1,0))} disabled={currentIdx===0}
                className="flex items-center gap-2 px-5 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-600 hover:border-blue-300 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm font-medium shadow-sm">
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <button onClick={() => handleSkip(qid)}
                className="flex items-center gap-1.5 px-4 py-3 text-amber-600 hover:bg-amber-50 rounded-xl text-sm font-medium transition-all border-2 border-transparent hover:border-amber-200">
                <SkipForward className="w-4 h-4" /> Skip
              </button>
              {currentIdx < total - 1 ? (
                <button onClick={() => setCurrentIdx(i => Math.min(i+1,total-1))}
                  className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl hover:from-blue-700 hover:to-cyan-600 text-sm font-semibold transition-all shadow-md shadow-blue-200">
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button onClick={() => setSubmitConfirm(true)}
                  className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-600 to-green-500 text-white rounded-xl text-sm font-semibold hover:from-emerald-700 hover:to-green-600 transition-all shadow-md">
                  <Send className="w-4 h-4" /> Submit
                </button>
              )}
            </div>
          </div>
        </main>

        {/* ── Fixed Sidebar Palette ── */}
        <aside className={`hidden lg:flex flex-col bg-white border-l border-gray-100 shadow-lg transition-all duration-300 overflow-hidden shrink-0 ${sidebarOpen ? 'w-64' : 'w-0'}`}>
          <div className="w-64 flex flex-col h-full overflow-auto">
            {/* Header */}
            <div className="px-4 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-cyan-50">
              <h3 className="font-bold text-gray-800 text-sm">Question Palette</h3>
              <p className="text-xs text-gray-400 mt-0.5">{answeredCount}/{total} answered</p>
              {/* Mini progress */}
              <div className="h-1.5 bg-gray-200 rounded-full mt-2 overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full transition-all" style={{width:`${(answeredCount/total)*100}%`}} />
              </div>
            </div>

            {/* Legend */}
            <div className="px-4 py-3 grid grid-cols-2 gap-1.5 border-b border-gray-50 text-xs">
              {[
                { label: 'Answered', s: 'answered', cls: 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white' },
                { label: 'Skipped',  s: 'skipped',  cls: 'bg-amber-100 text-amber-700' },
                { label: 'Flagged',  s: 'flagged',  cls: 'bg-rose-100 text-rose-600' },
                { label: 'Pending',  s: 'unanswered', cls: 'bg-gray-100 text-gray-500' },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${l.cls}`}>
                    {Object.values(statuses).filter(s => s === l.s).length}
                  </span>
                  <span className="text-gray-500 text-[11px]">{l.label}</span>
                </div>
              ))}
            </div>

            {/* Grid */}
            <div className="p-4 flex-1">
              <div className="grid grid-cols-5 gap-2">
                {questions.map((sq, idx) => {
                  const st = statuses[sq.question_id] || 'unanswered';
                  return (
                    <button key={sq.question_id} onClick={() => setCurrentIdx(idx)}
                      className={`w-10 h-10 rounded-xl text-xs font-bold border-2 transition-all
                        ${currentIdx === idx ? 'ring-2 ring-blue-400 ring-offset-1 scale-110' : 'hover:scale-105'}
                        ${qStatusStyle[st]}`}>
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer submit */}
            <div className="p-4 border-t border-gray-100">
              <button onClick={() => setSubmitConfirm(true)}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-200 hover:from-blue-700 hover:to-cyan-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                <Send className="w-4 h-4" /> Submit Assessment
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile palette toggle tab */}
        <button
          onClick={() => setSidebarOpen(p => !p)}
          className="lg:hidden fixed right-0 top-1/2 -translate-y-1/2 z-50 bg-blue-600 text-white rounded-l-xl px-2 py-4 shadow-lg"
        >
          {sidebarOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* ── Submit modal ── */}
      {submitConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-sm w-full p-7 text-center">
            <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-amber-600" />
            </div>
            <h3 className="font-bold text-gray-900 text-xl mb-2">Submit Assessment?</h3>
            <p className="text-gray-500 text-sm mb-1">
              You've answered <strong className="text-gray-800">{answeredCount}</strong> of <strong className="text-gray-800">{total}</strong> questions.
            </p>
            {total - answeredCount > 0 && (
              <p className="text-rose-500 text-sm mb-5">{total - answeredCount} unanswered will be marked wrong.</p>
            )}
            <div className="flex gap-3 mt-5">
              <button onClick={() => setSubmitConfirm(false)}
                className="flex-1 py-3.5 border-2 border-gray-200 rounded-2xl text-gray-600 hover:bg-gray-50 font-medium text-sm">Keep Going</button>
              <button onClick={handleSubmit}
                className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-2xl font-semibold text-sm shadow-lg shadow-blue-200">Submit Now</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TakeAssessment;