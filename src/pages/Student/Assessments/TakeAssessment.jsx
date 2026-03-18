// pages/Student/Assessments/TakeAssessment.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Clock, ChevronLeft, ChevronRight, Flag, Send,
  AlertTriangle, CheckCircle2, SkipForward, X,
  Loader2, BookOpen, Target, Zap, Award, RotateCcw, TrendingUp,
  PanelRight, PanelRightClose, Calendar
} from 'lucide-react';
import { assessmentAPI, assessmentAttemptAPI } from '../../../api/Api';

const LEVEL_CONFIG = {
  Beginner:     { label: 'Beginner',     color: 'bg-green-50 text-green-700 border-green-200',   dot: 'bg-green-500' },
  Intermediate: { label: 'Intermediate', color: 'bg-blue-50 text-blue-700 border-blue-200',      dot: 'bg-blue-500'  },
  Advanced:     { label: 'Advanced',     color: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
};

// ── Shared Card Wrapper ────────────────────────────────────────────
const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 ${className}`}>
    {children}
  </div>
);

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
  const isRed = remaining < 60, isAmber = remaining < 300;
  
  return (
    <div className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-bold font-mono transition-all
      ${isRed ? 'bg-red-50 text-red-600 border border-red-200 animate-pulse'
               : isAmber ? 'bg-amber-50 text-amber-700 border border-amber-200'
               : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
      <Clock className="w-4 h-4 shrink-0" />
      {String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}
    </div>
  );
};

// ── Loading screen ─────────────────────────────────────────────────
const FullLoader = ({ title, sub, pct }) => (
  <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
    <Card className="text-center w-full max-w-sm py-12 px-6">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-6 border border-blue-100">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
      <h2 className="text-[18px] font-bold text-gray-900 mb-1">{title}</h2>
      {sub && <p className="text-[13px] text-gray-500 mb-6">{sub}</p>}
      {pct !== undefined && (
        <div className="px-4">
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
            <div className="h-2 bg-blue-600 rounded-full transition-all duration-300" style={{width:`${pct}%`}} />
          </div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{pct}% loaded</p>
        </div>
      )}
    </Card>
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
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [submitConfirm, setSubmitConfirm] = useState(false);
  const [fetchProgress, setFetchProgress] = useState({ loaded: 0, total: 0 });

  useEffect(() => {
    assessmentAPI.getAssessmentDetails(assessmentId)
      .then(res => { if (res.success) setBriefingInfo(res.assessment); })
      .catch(() => {});

    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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

  // ── Desktop Restriction Overlay ──
  if (!isDesktop) {
    return (
      <div className="fixed inset-0 bg-[#0f172a] z-[9999] flex flex-col items-center justify-center p-8 text-center overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-600/10 blur-[120px] rounded-full" />
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-24 h-24 bg-gradient-to-tr from-blue-600/20 to-cyan-500/20 rounded-[2rem] flex items-center justify-center mb-8 border border-white/10 backdrop-blur-sm shadow-2xl">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 shrink-0">
              <AlertTriangle className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          
          <h1 className="text-white text-3xl md:text-4xl font-black mb-4 tracking-tight">
            Desktop Access Required
          </h1>
          
          <div className="w-16 h-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full mb-8" />
          
          <p className="text-slate-400 max-w-md text-[15px] md:text-[16px] leading-relaxed mb-10 font-medium">
            To ensure a fair and stable testing environment, skill assessments can only be attended on a 
            <span className="text-blue-400 font-bold"> desktop or laptop device</span>. 
            Mobile and tablet access is restricted.
          </p>
          
          <button 
            onClick={() => navigate('/dashboard/student/assessments')}
            className="group px-8 py-4 bg-white text-[#0f172a] rounded-2xl font-extrabold hover:bg-blue-50 transition-all shadow-[0_20px_40px_rgba(0,0,0,0.3)] flex items-center gap-3 active:scale-95"
          >
            <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" /> Back to Assessments
          </button>
          
          <p className="mt-12 text-slate-500 text-xs font-bold uppercase tracking-[0.2em]">
            Controlled Testing Environment
          </p>
        </div>
      </div>
    );
  }

  // ── Loading phases ──
  if (phase === 'loading') return <FullLoader title="Starting Assessment" sub="Preparing your environment..." />;
  if (phase === 'fetching') {
    const pct = fetchProgress.total > 0 ? Math.round((fetchProgress.loaded / fetchProgress.total) * 100) : 0;
    return <FullLoader title="Loading Questions" sub={`Fetching ${fetchProgress.loaded} of ${fetchProgress.total}`} pct={pct} />;
  }
  if (phase === 'submitting') return <FullLoader title="Submitting Assessment" sub="Please do not close this tab or window." />;

  // ── Briefing ──
  if (phase === 'briefing') {
    const skill = briefingInfo?.skill_id?.name || briefingInfo?.skill || 'Skill Assessment';
    const levelStr = briefingInfo?.level || 'Beginner';
    const levelCfg = LEVEL_CONFIG[levelStr] || LEVEL_CONFIG.Beginner;
    const duration = briefingInfo?.duration_minutes;
    const totalQ = briefingInfo?.questions_id?.length || briefingInfo?.total_questions || 0;
    
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <Card className="p-0 overflow-hidden">
            {/* Header Area */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-8 text-white relative">
              <div className="flex items-start gap-5 relative z-10">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 shrink-0">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-[24px] font-bold text-white mb-2 leading-tight">{skill}</h1>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold border flex items-center gap-1.5 ${levelCfg.color.replace('bg-', 'bg-white/90 text-').replace('border-', 'border-white/20 text-').replace('text-', 'text-')}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${levelCfg.dot}`}></span>
                      {levelCfg.label}
                    </span>
                    <span className="text-[13px] text-blue-100 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4" /> Comprehensive Test
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8">
              {/* Stats Row */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm shrink-0">
                    <BookOpen className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <div className="text-[12px] font-bold text-gray-500 uppercase tracking-wide">Questions</div>
                    <div className="text-[18px] font-bold text-gray-900">{totalQ}</div>
                  </div>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm shrink-0">
                    <Clock className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <div className="text-[12px] font-bold text-blue-600 uppercase tracking-wide">Duration</div>
                    <div className="text-[18px] font-bold text-blue-900">{duration ? `${duration} Min` : 'Flexible'}</div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="flex gap-3 items-start bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-[13px] text-red-700 font-medium">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
                </div>
              )}

              {/* Instructions */}
              <div className="mb-8">
                <h3 className="text-[14px] font-bold text-gray-900 mb-4 uppercase tracking-wide">Important Instructions</h3>
                <div className="space-y-3">
                  {[
                    'The timer starts immediately after clicking Begin Assessment and cannot be paused.',
                    'You can navigate freely between questions using the Question Palette.',
                    'The assessment will auto-submit when the time expires.',
                    "Do not refresh or close this tab during the assessment.",
                  ].map((t, i) => (
                    <div key={i} className="flex gap-3 items-start p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <span className="w-5 h-5 bg-blue-100 rounded text-blue-600 flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">{i+1}</span>
                      <span className="text-[13px] text-gray-700 font-medium">{t}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4 border-t border-gray-100">
                <button 
                  onClick={() => navigate(-1)} 
                  className="w-1/3 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold text-[14px] hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleBegin} 
                  className="w-2/3 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold text-[14px] hover:shadow-lg hover:shadow-blue-200 transition-all flex items-center justify-center gap-2"
                >
                  Begin Assessment <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // ── Result (Scores Hidden Pending Publication) ──
  if (phase === 'done') {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <Card className="p-0 overflow-hidden text-center">
            <div className="py-12 px-8 bg-green-50 border-b border-green-100">
              <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-[20px] font-bold text-gray-900 mb-2">
                Assessment Submitted Successfully!
              </h2>
              <p className="text-[14px] text-gray-500">
                Your answers have been securely recorded. Your score and detailed results will be available once published by your college admin.
              </p>
            </div>
            
            <div className="p-8">
              <div className="flex gap-4">
                <button 
                  onClick={() => navigate('/dashboard/student/assessments/history')} 
                  className="w-1/2 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold text-[14px] hover:bg-gray-50 transition-colors"
                >
                  View History
                </button>
                <button 
                  onClick={() => navigate('/dashboard/student/assessments')} 
                  className="w-1/2 py-3 rounded-xl bg-blue-600 text-white font-bold text-[14px] hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Back to Assessments
                </button>
              </div>
            </div>
          </Card>
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

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fa]">

      {/* ── Top bar ── */}
      <header className="bg-white border-b border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.02)] sticky top-0 z-40">
        {/* Progress line */}
        <div className="h-1 bg-gray-100">
          <div className="h-1 bg-blue-600 transition-all duration-300" style={{width:`${progress}%`}} />
        </div>
        <div className="px-4 lg:px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-gray-900 text-[15px] truncate">
                {briefingInfo?.skill_id?.name || briefingInfo?.skill || 'Assessment'}
              </h2>
              <p className="text-[12px] font-medium text-gray-500">
                Question {currentIdx + 1} of {total} <span className="mx-1.5 text-gray-300">|</span> {answeredCount} Answered
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:block">
              <Timer totalSeconds={(briefingInfo?.duration_minutes || 60) * 60} onExpire={handleTimerExpire} />
            </div>
            <button
              onClick={() => setSidebarOpen(p => !p)}
              className={`p-2.5 rounded-lg border transition-all hidden lg:flex items-center justify-center ${sidebarOpen ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
              title={sidebarOpen ? 'Hide Question Palette' : 'Show Question Palette'}
            >
              {sidebarOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRight className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setSubmitConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg text-[13px] font-bold hover:shadow-md transition-shadow"
            >
              <Send className="w-3.5 h-3.5" /> Submit Assessment
            </button>
          </div>
        </div>
      </header>
      
      {/* Mobile timer bar (visible only on small screens) */}
      <div className="sm:hidden bg-white border-b border-gray-200 px-4 py-2 flex justify-center">
         <Timer totalSeconds={(briefingInfo?.duration_minutes || 60) * 60} onExpire={handleTimerExpire} />
      </div>

      {error && (
        <div className="mx-4 mt-4 lg:mx-8 flex gap-3 items-center bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-[13px] font-medium shadow-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" /><span className="flex-1">{error}</span>
          <button onClick={() => setError('')} className="p-1 hover:bg-red-100 rounded-md"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* ── Question area ── */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-[800px] mx-auto px-4 py-6 lg:px-8">
            <Card className="p-0 overflow-hidden mb-6">
              {/* Question Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-[12px] font-bold rounded-md border border-blue-200">
                    Question {currentIdx + 1}
                  </span>
                  <span className="text-[12px] font-medium text-gray-500 bg-white border border-gray-200 px-2.5 py-1 rounded-md">
                    {q.marks ?? 1} Mark{(q.marks ?? 1) !== 1 ? 's' : ''}
                  </span>
                  {q.type === 'multiple_answer' && (
                    <span className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 text-[12px] font-bold rounded-md">
                      Multiple Choice
                    </span>
                  )}
                  {flagged[qid] && (
                    <span className="px-2.5 py-1 bg-red-50 text-red-600 border border-red-200 text-[12px] font-bold rounded-md flex items-center gap-1">
                      <Flag className="w-3 h-3" /> Flagged
                    </span>
                  )}
                </div>
                <button
                  onClick={() => toggleFlag(qid)}
                  className={`flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-md border font-bold transition-colors
                    ${flagged[qid] ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                >
                  <Flag className="w-3 h-3" /> {flagged[qid] ? 'Unflag' : 'Flag'}
                </button>
              </div>

              {/* Question text */}
              <div className="px-6 py-6">
                <h3 className="text-gray-900 font-bold text-[16px] leading-relaxed">{questionText}</h3>
              </div>

              {/* Options */}
              {(q.type === 'single_answer' || q.type === 'multiple_answer') && opts.length > 0 && (
                <div className="px-6 pb-8 space-y-3">
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
                        className={`w-full text-left flex items-center gap-4 px-4 py-4 rounded-xl border-2 transition-all
                          ${sel ? 'border-blue-500 bg-blue-50/50 shadow-[0_2px_8px_rgba(59,130,246,0.1)]'
                                : 'border-gray-100 bg-white hover:border-gray-300 hover:bg-gray-50'}`}>
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-[13px] font-bold shrink-0 transition-colors
                          ${sel ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <span className={`font-medium text-[14px] flex-1 ${sel ? 'text-blue-900' : 'text-gray-700'}`}>{opt.text}</span>
                        {sel && <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                           <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        </div>}
                      </button>
                    );
                  })}
                  {q.type === 'multiple_answer' && <p className="text-[12px] font-medium text-gray-500 mt-4 flex items-center gap-2">
                     <AlertTriangle className="w-4 h-4 text-amber-500" /> Selective multiple options to proceed.
                  </p>}
                </div>
              )}

              {q.type === 'fill_up' && (
                <div className="px-6 pb-8">
                  <input type="text"
                    value={typeof answers[qid] === 'string' ? answers[qid] : ''}
                    onChange={e => setAnswer(qid, e.target.value)}
                    placeholder="Type your answer here..."
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-4 text-[14px] font-medium text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-50 transition-all bg-gray-50 focus:bg-white"
                  />
                </div>
              )}
            </Card>

            {/* Navigation Bar */}
            <div className="flex items-center justify-between">
              <button onClick={() => setCurrentIdx(i => Math.max(i-1,0))} disabled={currentIdx===0}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-[13px] font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all">
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              
              <div className="flex items-center gap-3">
                <button onClick={() => handleSkip(qid)}
                  className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-[13px] font-bold text-gray-600 hover:bg-gray-50 shadow-sm transition-all">
                  Skip <SkipForward className="w-4 h-4" />
                </button>
                
                {currentIdx < total - 1 ? (
                  <button onClick={() => setCurrentIdx(i => Math.min(i+1,total-1))}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-[13px] font-bold hover:bg-blue-700 shadow-sm shadow-blue-200 transition-all">
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button onClick={() => setSubmitConfirm(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl text-[13px] font-bold hover:bg-green-700 shadow-sm shadow-green-200 transition-all">
                    Submit <Send className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* ── Fixed Sidebar Palette ── */}
        <aside className={`hidden lg:flex flex-col bg-white border-l border-gray-200 shadow-[0_0_15px_rgba(0,0,0,0.03)] transition-all duration-300 overflow-hidden shrink-0 ${sidebarOpen ? 'w-[300px]' : 'w-0'}`}>
          <div className="w-[300px] flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="px-5 py-5 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-bold text-[14px] text-gray-900 mb-1 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-gray-500" /> Question Palette
              </h3>
              <p className="text-[12px] font-medium text-gray-500">{answeredCount} of {total} Answered</p>
            </div>

            {/* Legend */}
            <div className="px-5 py-4 grid grid-cols-2 gap-3 border-b border-gray-100 bg-white text-[12px] font-medium">
              {[
                { label: 'Answered', s: 'answered', bg: 'bg-blue-600', text: 'text-white', border: 'border-transparent' },
                { label: 'Skipped',  s: 'skipped',  bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
                { label: 'Flagged',  s: 'flagged',  bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
                { label: 'Pending',  s: 'unanswered', bg: 'bg-white', text: 'text-gray-600', border: 'border-gray-200' },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded flex items-center justify-center text-[11px] font-bold border ${l.bg} ${l.text} ${l.border}`}>
                    {Object.values(statuses).filter(s => s === l.s).length}
                  </span>
                  <span className="text-gray-600">{l.label}</span>
                </div>
              ))}
            </div>

            {/* Grid */}
            <div className="p-5 flex-1 overflow-y-auto bg-gray-50/30">
              <div className="grid grid-cols-5 gap-2.5">
                {questions.map((sq, idx) => {
                  const st = statuses[sq.question_id] || 'unanswered';
                  
                  // Map statuses to new styles
                  let styleClass = '';
                  if (st === 'answered') styleClass = 'bg-blue-600 text-white border-transparent shadow-[0_2px_4px_rgba(37,99,235,0.2)]';
                  else if (st === 'skipped') styleClass = 'bg-amber-100 text-amber-700 border-amber-200';
                  else if (st === 'flagged') styleClass = 'bg-red-100 text-red-600 border-red-200';
                  else styleClass = 'bg-white text-gray-600 border-gray-200 hover:border-gray-300';
                  
                  return (
                    <button key={sq.question_id} onClick={() => setCurrentIdx(idx)}
                      className={`w-10 h-10 rounded-lg text-[13px] font-bold border transition-all flex items-center justify-center
                        ${currentIdx === idx ? 'ring-2 ring-blue-600 ring-offset-2 scale-105' : 'hover:scale-105'}
                        ${styleClass}`}>
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer submit */}
            <div className="p-5 border-t border-gray-200 bg-white">
              <button 
                onClick={() => setSubmitConfirm(true)}
                className="w-full py-3.5 bg-blue-600 text-white rounded-xl text-[13px] font-bold hover:bg-blue-700 hover:shadow-lg transition-all flex items-center justify-center gap-2">
                <Send className="w-4 h-4" /> Submit Assessment
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile palette toggle tab */}
        <button
          onClick={() => setSidebarOpen(p => !p)}
          className="lg:hidden fixed right-0 top-1/2 -translate-y-1/2 z-50 bg-white border border-gray-200 border-r-0 text-gray-700 rounded-l-xl px-2 py-4 shadow-[-4px_0_15px_rgba(0,0,0,0.05)]"
        >
          {sidebarOpen ? <ChevronRight className="w-5 h-5 text-gray-400" /> : <PanelRight className="w-5 h-5 text-blue-600" />}
        </button>
      </div>

      {/* ── Submit modal ── */}
      {submitConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-sm p-8 text-center animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <AlertTriangle className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-bold text-[18px] text-gray-900 mb-2">Submit Assessment?</h3>
            <p className="text-[14px] text-gray-500 mb-3">
              You've answered <strong className="text-gray-900">{answeredCount}</strong> out of <strong className="text-gray-900">{total}</strong> questions.
            </p>
            {total - answeredCount > 0 && (
              <div className="bg-red-50 text-red-600 font-medium text-[12px] py-2 px-3 rounded-lg mb-6 border border-red-100">
                {total - answeredCount} unanswered questions will be marked incorrect.
              </div>
            )}
            <div className="flex gap-3 mt-4">
              <button onClick={() => setSubmitConfirm(false)}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-bold text-[13px] transition-colors">
                Return
              </button>
              <button onClick={handleSubmit}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-[13px] hover:bg-blue-700 shadow-sm transition-colors">
                Confirm Submit
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TakeAssessment;