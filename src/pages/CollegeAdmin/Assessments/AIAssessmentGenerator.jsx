// pages/CollegeAdmin/Assessments/AIAssessmentGenerator.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, ChevronLeft, Briefcase, Layers, Hash, Check,
  AlertCircle, PenLine, Save, Trash2, X, ArrowRight,
  BookOpen, RefreshCw, Loader2, ChevronDown, ChevronUp,
  ClipboardList, Zap, Sprout, Flame, Timer, ClipboardCheck,
  Trophy, CheckCircle2,
} from 'lucide-react';
import CollegeAdminLayout from '../../../components/layout/CollegeAdminLayout';
import apiCall from '../../../api/Api';
import { jobAPI } from '../../../api/Api';

/* ─── Difficulty config (blue-cyan theme throughout) ────────────────── */
const LEVEL_CONFIG = {
  Beginner: {
    Icon: Sprout,
    iconColor: 'text-cyan-600', iconBg: 'bg-cyan-100',
    desc: 'Foundational concepts & basic recall',
    active: 'border-cyan-400 bg-gradient-to-br from-cyan-50 to-blue-50 text-cyan-800',
    badge: 'bg-cyan-100 text-cyan-700',
  },
  Intermediate: {
    Icon: Zap,
    iconColor: 'text-blue-600', iconBg: 'bg-blue-100',
    desc: 'Applied knowledge & problem solving',
    active: 'border-blue-400 bg-gradient-to-br from-blue-50 to-cyan-50 text-blue-800',
    badge: 'bg-blue-100 text-blue-700',
  },
  Advanced: {
    Icon: Flame,
    iconColor: 'text-indigo-600', iconBg: 'bg-indigo-100',
    desc: 'Complex analysis & expert-level',
    active: 'border-indigo-400 bg-gradient-to-br from-indigo-50 to-blue-50 text-indigo-800',
    badge: 'bg-indigo-100 text-indigo-700',
  },
};

/* ─── Glass card ─────────────────────────────────────────────────────── */
const Card = ({ children, className = '' }) => (
  <div className={`bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-white/60 ${className}`}>
    {children}
  </div>
);

/* ─── Card section with icon header ─────────────────────────────────── */
const CardSection = ({ icon: Icon, iconBg, iconColor, title, subtitle, children }) => (
  <div className="p-6 space-y-5">
    <div className="flex items-center gap-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
      <div>
        <h3 className="font-bold text-gray-900 text-sm">{title}</h3>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {children}
  </div>
);

/* ─── Step Bar ───────────────────────────────────────────────────────── */
const StepBar = ({ stage }) => {
  const current = { config: 0, loading: 1, review: 2, saving: 2, done: 2 }[stage] ?? 0;
  return (
    <div className="hidden sm:flex items-center gap-1">
      {['Configure', 'Generate', 'Review & Save'].map((label, i) => {
        const done = current > i, active = current === i;
        return (
          <div key={label} className="flex items-center gap-1">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all
              ${active ? 'bg-white text-blue-700 shadow-md' : done ? 'bg-white/25 text-white' : 'bg-white/10 text-blue-200'}`}>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold
                ${active ? 'bg-gradient-to-br from-blue-600 to-cyan-500 text-white' : done ? 'bg-blue-400 text-white' : 'bg-white/20 text-white'}`}>
                {done ? '✓' : i + 1}
              </span>
              {label}
            </div>
            {i < 2 && <div className="w-4 h-px bg-white/25" />}
          </div>
        );
      })}
    </div>
  );
};

/* ─── AI Loader ──────────────────────────────────────────────────────── */
const AILoader = ({ numQuestions, jobTitle }) => {
  const batches = Math.ceil(numQuestions / 10);
  const [completedBatches, setCompletedBatches] = useState(0);
  const [displayCount, setDisplayCount] = useState(0);
  useEffect(() => {
    let b = 0;
    const tick = () => { b++; if (b <= batches) { setCompletedBatches(b); setDisplayCount(Math.min(b * 10, numQuestions)); if (b < batches) setTimeout(tick, 5000); } };
    const t = setTimeout(tick, 5000);
    return () => clearTimeout(t);
  }, [batches, numQuestions]);
  const pct = batches > 0 ? Math.min(Math.round((completedBatches / batches) * 90), 90) : 10;

  return (
    <Card className="overflow-hidden">
      <div className="h-1.5 bg-gray-100 rounded-t-2xl overflow-hidden">
        <div className="h-full bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-500 transition-all duration-1000 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <div className="p-12 flex flex-col items-center text-center gap-6">
        <div className="relative w-24 h-24 flex items-center justify-center">
          {[0, 1, 2].map(i => (
            <div key={i} className="absolute inset-0 rounded-full border-2 border-blue-300/40"
              style={{ animation: `ripple 2.4s ease-out ${i * 0.6}s infinite` }} />
          ))}
          <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-2xl shadow-blue-500/40"
            style={{ background: 'linear-gradient(135deg,#1d4ed8 0%,#0284c7 60%,#06b6d4 100%)' }}>
            <Sparkles className="w-9 h-9 text-white" />
          </div>
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-gray-900">Generating your assessment</h3>
          {jobTitle && <p className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">{jobTitle}</p>}
        </div>
        <div className="flex items-center gap-4">
          {[
            { value: displayCount, sub: `of ${numQuestions} questions` },
            { value: <>{completedBatches}<span className="text-2xl text-gray-400">/{batches}</span></>, sub: 'batches complete' },
          ].map((s, i) => (
            <div key={i} className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 rounded-2xl px-6 py-4 text-center min-w-[110px]">
              <div className="text-4xl font-black bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent tabular-nums transition-all duration-500">{s.value}</div>
              <div className="text-xs text-gray-500 font-medium mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 max-w-xs leading-relaxed">Generating in batches of 10 for accuracy. Please don't close this page.</p>
        <div className="flex gap-2">
          {[0,1,2,3,4].map(i => (
            <div key={i} className="w-2 h-2 rounded-full"
              style={{ background: 'linear-gradient(135deg,#3b82f6,#06b6d4)', animation: `bounce 1.2s ease-in-out ${i*0.15}s infinite` }} />
          ))}
        </div>
      </div>
      <style>{`@keyframes ripple{0%{transform:scale(1);opacity:.5}100%{transform:scale(2.4);opacity:0}}@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}@keyframes slideIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </Card>
  );
};

/* ─── Question Card ──────────────────────────────────────────────────── */
const QuestionCard = ({ question, index, onEdit, onRemove }) => {
  const [open, setOpen] = useState(false);
  const cfg = LEVEL_CONFIG[question.level] || LEVEL_CONFIG.Intermediate;
  const TYPE_LABELS = { single_answer: 'Single Choice', multiple_answer: 'Multi-Select', fill_up: 'Fill in Blank' };
  const isCorrect = (label) => Array.isArray(question.correct_answer) ? question.correct_answer.includes(label) : question.correct_answer === label;

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm hover:shadow-md transition-all duration-200"
      style={{ animation: `slideIn 0.3s ease-out ${Math.min(index * 0.05, 0.5)}s both` }}>
      <div className="p-5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-sm"
            style={{ background: 'linear-gradient(135deg,#2563eb,#0891b2)' }}>
            {index + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                {TYPE_LABELS[question.type] || question.type}
              </span>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${cfg.badge}`}>{question.level}</span>
              <span className="text-xs text-gray-400 font-medium">{question.marks} mark{question.marks !== 1 ? 's' : ''}</span>
            </div>
            <p className="text-gray-900 font-medium text-sm leading-relaxed">{question.question}</p>

            {(question.type === 'single_answer' || question.type === 'multiple_answer') && question.options?.length > 0 && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {question.options.map(opt => {
                  const correct = isCorrect(opt.label);
                  return (
                    <div key={opt.label} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs
                      ${correct ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 text-blue-800 font-medium' : 'bg-gray-50 border border-gray-100 text-gray-600'}`}>
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                        ${correct ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                        {opt.label}
                      </span>
                      <span className="flex-1 leading-tight">{opt.text}</span>
                      {correct && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                    </div>
                  );
                })}
              </div>
            )}

            {question.type === 'fill_up' && (
              <div className="mt-2 inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl text-xs text-blue-700 font-medium">
                <Check className="w-3.5 h-3.5" /> Answer: {question.correct_answer}
              </div>
            )}

            {question.explanation && (
              <button onClick={() => setOpen(v => !v)}
                className="mt-3 flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors">
                {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                {open ? 'Hide explanation' : 'Show explanation'}
              </button>
            )}
            {open && question.explanation && (
              <div className="mt-2 flex items-start gap-2 bg-blue-50/60 border border-blue-100 rounded-xl p-3">
                <span className="text-base shrink-0">💡</span>
                <p className="text-xs text-blue-800 leading-relaxed">{question.explanation}</p>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1 shrink-0">
            <button onClick={() => onEdit(index)} className="p-2 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all" title="Edit">
              <PenLine className="w-4 h-4" />
            </button>
            <button onClick={() => onRemove(index)} className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all" title="Remove">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Edit Modal ─────────────────────────────────────────────────────── */
const EditModal = ({ question, onSave, onClose }) => {
  const [form, setForm] = useState({
    question: question.question || '',
    type: question.type || 'single_answer',
    level: question.level || 'Intermediate',
    marks: question.marks || 1,
    explanation: question.explanation || '',
    options: question.options?.map(o => o.text) || ['', '', '', ''],
    correct_answer: question.correct_answer || 'A',
  });
  const LABELS = ['A', 'B', 'C', 'D'];
  const isChoice = form.type === 'single_answer' || form.type === 'multiple_answer';

  const toggleMulti = (label) => {
    const cur = Array.isArray(form.correct_answer) ? form.correct_answer : [];
    setForm(p => ({ ...p, correct_answer: cur.includes(label) ? cur.filter(l => l !== label) : [...cur, label] }));
  };

  const handleSave = () => onSave({
    ...form, marks: Number(form.marks),
    options: isChoice ? LABELS.map((l, i) => ({ label: l, text: form.options[i] })) : undefined,
    correct_answer: form.type === 'multiple_answer'
      ? (Array.isArray(form.correct_answer) ? form.correct_answer : [form.correct_answer])
      : form.correct_answer,
  });

  const inp = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white/80 transition-all";

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-500/20 border border-white/60 w-full max-w-lg my-8">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center">
              <PenLine className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-900">Edit Question</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 transition-all"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Question Text *</label>
            <textarea rows={3} value={form.question} onChange={e => setForm(p => ({ ...p, question: e.target.value }))} className={`${inp} resize-none`} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Type</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value, correct_answer: e.target.value === 'multiple_answer' ? [] : 'A' }))} className={inp}>
                <option value="single_answer">Single Answer</option>
                <option value="multiple_answer">Multiple Answer</option>
                <option value="fill_up">Fill in Blank</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Level</label>
              <select value={form.level} onChange={e => setForm(p => ({ ...p, level: e.target.value }))} className={inp}>
                <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
              </select>
            </div>
          </div>

          {isChoice && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Options * <span className="text-xs font-normal text-gray-400">({form.type === 'multiple_answer' ? 'check all correct' : 'select correct'})</span>
              </label>
              <div className="space-y-2">
                {LABELS.map((label, idx) => {
                  const correct = form.type === 'multiple_answer'
                    ? (Array.isArray(form.correct_answer) && form.correct_answer.includes(label))
                    : form.correct_answer === label;
                  return (
                    <div key={label} className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all
                      ${correct ? 'border-blue-400 bg-blue-50' : 'border-gray-100 bg-gray-50'}`}>
                      {form.type === 'multiple_answer'
                        ? <input type="checkbox" checked={correct} onChange={() => toggleMulti(label)} className="w-4 h-4 text-blue-600 rounded" />
                        : <input type="radio" name="ca" checked={correct} onChange={() => setForm(p => ({ ...p, correct_answer: label }))} className="w-4 h-4 text-blue-600" />}
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                        ${correct ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white' : 'bg-gray-200 text-gray-600'}`}>{label}</span>
                      <input type="text" value={form.options[idx]}
                        onChange={e => { const o = [...form.options]; o[idx] = e.target.value; setForm(p => ({ ...p, options: o })); }}
                        className="flex-1 bg-transparent text-sm focus:outline-none" placeholder={`Option ${label}`} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {form.type === 'fill_up' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Correct Answer *</label>
              <input type="text" value={form.correct_answer} onChange={e => setForm(p => ({ ...p, correct_answer: e.target.value }))} className={inp} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Marks</label>
              <input type="number" min={0.25} step={0.25} value={form.marks} onChange={e => setForm(p => ({ ...p, marks: e.target.value }))} className={inp} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Explanation</label>
              <input type="text" value={form.explanation} onChange={e => setForm(p => ({ ...p, explanation: e.target.value }))} placeholder="Optional…" className={inp} />
            </div>
          </div>
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 text-sm font-semibold transition-all">Cancel</button>
          <button onClick={handleSave} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold shadow-lg shadow-blue-500/30 hover:opacity-90 transition-all"
            style={{ background: 'linear-gradient(135deg,#2563eb,#0891b2)' }}>
            <Save className="w-4 h-4" /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Main ───────────────────────────────────────────────────────────── */
const AIAssessmentGenerator = () => {
  const navigate = useNavigate();
  const [jdId, setJdId] = useState('');
  const [numQuestions, setNumQuestions] = useState(10);
  const [level, setLevel] = useState('Intermediate');
  const [jobs, setJobs] = useState([]);
  const [stage, setStage] = useState('config');
  const [questions, setQuestions] = useState([]);
  const [savedAssessmentId, setSavedAssessmentId] = useState(null);
  const [error, setError] = useState('');
  const [editModal, setEditModal] = useState(null);

  useEffect(() => {
    jobAPI.getAllJobs({ limit: 100 }).then(res => { if (res.success) setJobs(res.jobs || res.data || []); }).catch(() => {});
  }, []);

  const selectedJob = jobs.find(j => j._id === jdId);
  const totalMarks = questions.reduce((s, q) => s + (Number(q.marks) || 0), 0);

  const handleGenerate = async () => {
    if (!jdId) { setError('Please select a Job Description first.'); return; }
    setError(''); setStage('loading');
    try {
      const res = await apiCall('/assessment/generate-questions', {
        method: 'POST', body: JSON.stringify({ jd_id: jdId, num_questions: numQuestions, level }),
      });
      if (res.success && res.questions?.length > 0) { setQuestions(res.questions); setStage('review'); }
      else {
        const hint = res.debug_hint ? ` (${res.debug_hint})` : '';
        setError((res.message || 'Generation failed.') + hint + ' Please try again.'); setStage('config');
      }
    } catch (e) {
      const msg = e.message || '';
      if (msg.includes('503') || msg.toLowerCase().includes('unavailable') || msg.toLowerCase().includes('no endpoints'))
        setError('No AI models are available on your OpenRouter account. Set OPENROUTER_MODEL=<model-id> in your backend .env and restart.');
      else if (msg.toLowerCase().includes('json') || msg.toLowerCase().includes('parse'))
        setError('The AI returned a malformed response. Please try again — this is a free-tier limitation.');
      else setError(msg || 'Generation failed. Please check your connection.');
      setStage('config');
    }
  };

  const handleSave = async () => {
    setStage('saving');
    try {
      const asmRes = await apiCall('/assessment', {
        method: 'POST', body: JSON.stringify({
          level, source_type: 'college_admin_ai', status: 'active',
          duration_minutes: Math.max(numQuestions * 2, 10), jd_id: jdId || null, tags: ['ai-generated'],
        }),
      });
      if (!asmRes.success) throw new Error(asmRes.message || 'Failed to create assessment');
      const assessmentId = asmRes.assessment._id;
      for (const q of questions) {
        await apiCall(`/assessment/${assessmentId}/add-question`, {
          method: 'POST', body: JSON.stringify({
            question: q.question, type: q.type, level: q.level,
            marks: q.marks, explanation: q.explanation,
            options: q.options, correct_answer: q.correct_answer, status: 'active',
          }),
        });
      }
      setSavedAssessmentId(assessmentId); setStage('done');
    } catch (e) { setError(e.message || 'Failed to save. Please try again.'); setStage('review'); }
  };

  const handleReset = () => { setStage('config'); setQuestions([]); setError(''); setSavedAssessmentId(null); };

  return (
    <CollegeAdminLayout>
      <div className="max-w-4xl mx-auto space-y-5 pb-16">

        {/* Back */}
        <button onClick={() => navigate('/dashboard/college-admin/assessments')}
          className="flex items-center gap-1.5 text-gray-500 hover:text-blue-600 text-sm font-medium transition-colors group">
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Back to Assessments
        </button>

        {/* Hero Banner */}
        <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 rounded-2xl px-5 py-4 shadow-xl shadow-blue-500/20 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute inset-0 opacity-[0.06]"
              style={{ backgroundImage: 'radial-gradient(circle,white 1px,transparent 1px)', backgroundSize: '18px 18px' }} />
          </div>
          <div className="relative flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center border border-white/20 flex-shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-white font-black text-lg leading-tight">AI Assessment Generator</h1>
                <p className="text-blue-200 text-xs mt-0.5">Select a JD, set parameters, and let AI craft a complete question bank</p>
              </div>
            </div>
            <StepBar stage={stage} />
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 text-sm shadow-sm">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-red-700">Generation failed</p>
              <p className="text-red-600 mt-0.5 leading-relaxed">{error}</p>
              {jdId && stage === 'config' && (
                <button onClick={handleGenerate} className="mt-2 flex items-center gap-1.5 text-xs font-bold text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg transition-colors">
                  <RefreshCw className="w-3.5 h-3.5" /> Try Again
                </button>
              )}
            </div>
            <button onClick={() => setError('')} className="text-red-300 hover:text-red-500 shrink-0"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* ── CONFIG ── */}
        {stage === 'config' && (
          <div className="space-y-4">
            {/* JD Picker */}
            <Card>
              <CardSection icon={Briefcase} iconBg="bg-gradient-to-br from-blue-100 to-cyan-100"
                iconColor="text-blue-600" title="Job Description"
                subtitle="Questions will be tailored to this role's requirements">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Select Job Description <span className="text-red-500">*</span></label>
                  {jobs.length === 0 ? (
                    <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                      <AlertCircle className="w-4 h-4 shrink-0" /> No job descriptions found. Create a JD first.
                    </div>
                  ) : (
                    <select value={jdId} onChange={e => setJdId(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white/80">
                      <option value="">— Choose a Job Description —</option>
                      {jobs.map(j => <option key={j._id} value={j._id}>{j.jobTitle}{j.jobCode ? ` (${j.jobCode})` : ''}</option>)}
                    </select>
                  )}
                  {selectedJob && (
                    <div className="mt-3 flex items-center gap-3 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg flex items-center justify-center shrink-0">
                        <Briefcase className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-blue-900 text-sm truncate">{selectedJob.jobTitle}</p>
                        <p className="text-blue-500 text-xs">{selectedJob.jobRole || selectedJob.jobType || ''}</p>
                      </div>
                      <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full border border-blue-200">✓ Selected</span>
                    </div>
                  )}
                </div>
              </CardSection>
            </Card>

            {/* Difficulty & Count */}
            <Card>
              <CardSection icon={Layers} iconBg="bg-gradient-to-br from-indigo-100 to-blue-100"
                iconColor="text-indigo-600" title="Difficulty & Volume"
                subtitle="Configure the complexity and size of the question bank">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Difficulty Level</label>
                  <div className="grid grid-cols-3 gap-3">
                    {Object.entries(LEVEL_CONFIG).map(([lvl, cfg]) => (
                      <label key={lvl} className={`cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-sm select-none
                        ${level === lvl ? cfg.active + ' shadow-sm' : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200'}`}>
                        <input type="radio" name="level" value={lvl} checked={level === lvl} onChange={() => setLevel(lvl)} className="sr-only" />
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 ${cfg.iconBg}`}>
                          <cfg.Icon className={`w-4 h-4 ${cfg.iconColor}`} />
                        </div>
                        <p className="font-bold text-sm">{lvl}</p>
                        <p className="text-xs mt-0.5 opacity-70 leading-tight">{cfg.desc}</p>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Hash className="w-4 h-4 text-gray-400" /> Number of Questions
                    </label>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent tabular-nums">{numQuestions}</span>
                      <span className="text-xs text-gray-400 font-medium">questions</span>
                    </div>
                  </div>
                  <input type="range" min={5} max={50} step={5} value={numQuestions} onChange={e => setNumQuestions(Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{ background: `linear-gradient(to right,#2563eb 0%,#0891b2 ${((numQuestions-5)/45)*100}%,#e5e7eb ${((numQuestions-5)/45)*100}%,#e5e7eb 100%)` }} />
                  <style>{`input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:50%;background:linear-gradient(135deg,#2563eb,#0891b2);border:3px solid white;box-shadow:0 2px 8px rgba(37,99,235,.4);cursor:pointer}`}</style>
                  <div className="flex justify-between text-xs text-gray-300 mt-1.5">
                    {[5,10,15,20,25,30,35,40,45,50].map(v => <span key={v} className={numQuestions===v?'text-blue-500 font-bold':''}>{v}</span>)}
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {[
                      { Icon: Timer,          label: 'Est. Duration', value: `${Math.max(numQuestions*2,10)} min` },
                      { Icon: Trophy,         label: 'Est. Marks',    value: numQuestions },
                      { Icon: ClipboardCheck, label: 'Level',         value: level },
                    ].map(s => (
                      <div key={s.label} className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 rounded-xl p-3 text-center">
                        <div className="flex justify-center mb-1"><s.Icon className="w-4 h-4 text-blue-500" /></div>
                        <div className="text-sm font-black text-gray-900">{s.value}</div>
                        <div className="text-xs text-gray-400">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardSection>
            </Card>

            <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
              <Zap className="w-4 h-4 text-blue-500 shrink-0" />
              <span>Questions are AI-generated and saved to a new assessment. You can edit or remove any question before saving.</span>
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={() => navigate('/dashboard/college-admin/assessments')}
                className="px-6 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold text-sm transition-all bg-white/80">
                Cancel
              </button>
              <button onClick={handleGenerate} disabled={!jdId}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold text-sm transition-all
                  ${jdId ? 'shadow-lg shadow-blue-500/30 hover:shadow-xl hover:scale-[1.02]' : 'opacity-50 cursor-not-allowed'}`}
                style={jdId ? { background: 'linear-gradient(135deg,#1d4ed8 0%,#0284c7 50%,#0891b2 100%)' } : { background: '#9ca3af' }}>
                <Sparkles className="w-5 h-5" />
                Generate {numQuestions} Questions with AI
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── LOADING ── */}
        {stage === 'loading' && <AILoader numQuestions={numQuestions} jobTitle={selectedJob?.jobTitle} />}

        {/* ── REVIEW / SAVING ── */}
        {(stage === 'review' || stage === 'saving') && questions.length > 0 && (
          <div className="space-y-4">
            <Card>
              <div className="p-5">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                      <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">AI Generated</span>
                    </div>
                    <h2 className="font-bold text-gray-900 text-lg">{questions.length} Questions Ready</h2>
                    <p className="text-sm text-gray-500 mt-0.5">{selectedJob?.jobTitle} · {level} · {totalMarks} marks · ~{Math.max(numQuestions*2,10)} min</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={handleReset} disabled={stage==='saving'}
                      className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-all bg-white/80">
                      <RefreshCw className="w-4 h-4" /> Regenerate
                    </button>
                    <button onClick={handleSave} disabled={stage==='saving'}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-60 transition-all hover:scale-105 shadow-lg shadow-blue-500/30"
                      style={{ background: 'linear-gradient(135deg,#1d4ed8,#0284c7)' }}>
                      {stage==='saving' ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : <><Save className="w-4 h-4" />Save Assessment</>}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {[
                    { label:'Questions',     value:questions.length,                                           Icon:ClipboardList },
                    { label:'Total Marks',   value:totalMarks,                                                 Icon:Trophy       },
                    { label:'Single Choice', value:questions.filter(q=>q.type==='single_answer').length,       Icon:Check        },
                  ].map(s => (
                    <div key={s.label} className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 rounded-xl p-3 text-center">
                      <div className="flex justify-center mb-0.5"><s.Icon className="w-4 h-4 text-blue-500" /></div>
                      <div className="text-xl font-black text-gray-900">{s.value}</div>
                      <div className="text-xs text-gray-400">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-3.5 text-sm text-blue-800">
              <PenLine className="w-4 h-4 text-blue-500 shrink-0" />
              <span>Click <strong>edit</strong> on any question to adjust wording, options or marks before saving.</span>
            </div>

            <div className="space-y-3">
              {questions.map((q, idx) => (
                <QuestionCard key={idx} question={q} index={idx}
                  onEdit={i => setEditModal(i)}
                  onRemove={i => setQuestions(prev => prev.filter((_,pi) => pi !== i))} />
              ))}
            </div>

            {stage === 'review' && (
              <div className="sticky bottom-4 flex justify-center pt-2">
                <button onClick={handleSave}
                  className="flex items-center gap-2.5 px-8 py-3.5 rounded-2xl text-white font-bold text-sm shadow-2xl shadow-blue-500/40 hover:scale-105 transition-all"
                  style={{ background: 'linear-gradient(135deg,#1e40af,#0284c7,#0891b2)' }}>
                  <Save className="w-5 h-5" /> Save {questions.length} Questions as Assessment
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── DONE ── */}
        {stage === 'done' && (
          <Card>
            <div className="p-16 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5 shadow-2xl shadow-blue-500/30"
                style={{ background: 'linear-gradient(135deg,#1d4ed8,#0891b2)' }}>
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-2">Assessment Created!</h2>
              <p className="text-gray-500 max-w-sm mb-1">{questions.length} AI-generated questions have been saved successfully.</p>
              <p className="text-sm font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent mb-8">
                {selectedJob?.jobTitle} · {level} · {totalMarks} total marks
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center w-full max-w-sm">
                {savedAssessmentId && (
                  <button onClick={() => navigate(`/dashboard/college-admin/assessments/${savedAssessmentId}/questions`)}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-sm shadow-lg shadow-blue-500/30 hover:scale-105 transition-all"
                    style={{ background: 'linear-gradient(135deg,#1d4ed8,#0891b2)' }}>
                    <ClipboardList className="w-4 h-4" /> View Assessment
                  </button>
                )}
                <button onClick={() => navigate('/dashboard/college-admin/assessments')}
                  className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold text-sm">
                  All Assessments
                </button>
                <button onClick={handleReset}
                  className="flex items-center justify-center gap-2 px-6 py-3 border border-blue-200 rounded-xl text-blue-700 hover:bg-blue-50 font-semibold text-sm bg-blue-50/50">
                  <Sparkles className="w-4 h-4" /> Generate Another
                </button>
              </div>
            </div>
          </Card>
        )}
      </div>

      {editModal !== null && (
        <EditModal question={questions[editModal]}
          onSave={updated => { setQuestions(prev => { const c=[...prev]; c[editModal]={...c[editModal],...updated}; return c; }); setEditModal(null); }}
          onClose={() => setEditModal(null)} />
      )}
    </CollegeAdminLayout>
  );
};

export default AIAssessmentGenerator;