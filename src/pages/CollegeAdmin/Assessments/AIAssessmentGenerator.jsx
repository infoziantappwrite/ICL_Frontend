// pages/CollegeAdmin/Assessments/AIAssessmentGenerator.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, ChevronLeft, Briefcase, Layers, Hash, Check,
  AlertCircle, PenLine, Save, Trash2, X, ArrowRight,
  BookOpen, RefreshCw, Loader2, ChevronDown, ChevronUp,
  ClipboardList, Zap, Sprout, Flame, Timer, ClipboardCheck,
  Trophy, CheckCircle2, Tag, Calendar, Clock, Link2, Type,
  Award, Eye, Shuffle, Info, FileText, Pencil, Plus, Hash as HashIcon,
  PlusCircle, XCircle, BookMarked,
} from 'lucide-react';
import CollegeAdminLayout from '../../../components/layout/CollegeAdminLayout';
import apiCall from '../../../api/Api';
import { jobAPI } from '../../../api/Api';

/* ─── Level config ───────────────────────────────────────────────────── */
const LEVEL_CONFIG = {
  Beginner:     { Icon: Sprout, iconColor: 'text-cyan-600',   iconBg: 'bg-cyan-100',   desc: 'Foundational concepts & basic recall',     active: 'border-cyan-400 bg-cyan-50/80 text-cyan-800',     badge: 'bg-cyan-100 text-cyan-700' },
  Intermediate: { Icon: Zap,    iconColor: 'text-blue-600',   iconBg: 'bg-blue-100',   desc: 'Applied knowledge & problem solving',       active: 'border-blue-400 bg-blue-50/80 text-blue-800',     badge: 'bg-blue-100 text-blue-700' },
  Advanced:     { Icon: Flame,  iconColor: 'text-indigo-600', iconBg: 'bg-indigo-100', desc: 'Complex analysis & expert-level',           active: 'border-indigo-400 bg-indigo-50/80 text-indigo-800', badge: 'bg-indigo-100 text-indigo-700' },
};

const inp = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white/80 transition-all";

/* ─── Shared UI atoms ─────────────────────────────────────────────────── */
const Card = ({ children, className = '' }) => (
  <div className={`bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-white/60 ${className}`}>{children}</div>
);

const SectionHeader = ({ icon: Icon, iconBg, iconColor, title, subtitle }) => (
  <div className="flex items-center gap-3 p-5 pb-0">
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>
      <Icon className={`w-4 h-4 ${iconColor}`} />
    </div>
    <div>
      <h3 className="font-bold text-gray-900 text-sm">{title}</h3>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

const Field = ({ label, required, hint, children }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
    {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
  </div>
);

const Toggle = ({ checked, onChange, label, desc }) => (
  <button type="button" onClick={() => onChange(!checked)}
    className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 transition-all text-left
      ${checked ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white/60 hover:border-gray-300'}`}>
    <div className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-gradient-to-r from-blue-600 to-cyan-500' : 'bg-gray-200'}`}>
      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
    </div>
    <div>
      <p className={`text-sm font-bold ${checked ? 'text-blue-700' : 'text-gray-600'}`}>{label}</p>
      {desc && <p className="text-xs text-gray-400">{desc}</p>}
    </div>
  </button>
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
const AILoader = ({ numQuestions, subjectTitle }) => {
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
          {[0,1,2].map(i => (
            <div key={i} className="absolute inset-0 rounded-full border-2 border-blue-300/40"
              style={{ animation: `ripple 2.4s ease-out ${i * 0.6}s infinite` }} />
          ))}
          <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-2xl shadow-blue-500/40"
            style={{ background: 'linear-gradient(135deg,#1d4ed8 0%,#0284c7 60%,#06b6d4 100%)' }}>
            <Sparkles className="w-9 h-9 text-white" />
          </div>
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Generating your assessment</h3>
          {subjectTitle && <p className="text-sm font-semibold mt-1 bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">{subjectTitle}</p>}
        </div>
        <div className="flex items-center gap-4">
          {[
            { value: displayCount, sub: `of ${numQuestions} questions` },
            { value: <>{completedBatches}<span className="text-2xl text-gray-400">/{batches}</span></>, sub: 'batches' },
          ].map((s, i) => (
            <div key={i} className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 rounded-2xl px-6 py-4 text-center min-w-[110px]">
              <div className="text-4xl font-black bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent tabular-nums">{s.value}</div>
              <div className="text-xs text-gray-500 font-medium mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 max-w-xs">Please don't close this page.</p>
        <div className="flex gap-2">
          {[0,1,2,3,4].map(i => (
            <div key={i} className="w-2 h-2 rounded-full"
              style={{ background: 'linear-gradient(135deg,#3b82f6,#06b6d4)', animation: `bounce 1.2s ease-in-out ${i*0.15}s infinite` }} />
          ))}
        </div>
      </div>
      <style>{`@keyframes ripple{0%{transform:scale(1);opacity:.5}100%{transform:scale(2.4);opacity:0}}@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}`}</style>
    </Card>
  );
};

/* ─── Question Review Card ───────────────────────────────────────────── */
const QuestionCard = ({ question, index, onEdit, onRemove }) => {
  const [open, setOpen] = useState(false);
  const cfg = LEVEL_CONFIG[question.level] || LEVEL_CONFIG.Intermediate;
  const TYPE_LABELS = { single_answer: 'Single Choice', multiple_answer: 'Multi-Select', fill_up: 'Fill in Blank' };
  const isCorrect = (label) => Array.isArray(question.correct_answer) ? question.correct_answer.includes(label) : question.correct_answer === label;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
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
            {question.options?.length > 0 && (
              <button onClick={() => setOpen(v => !v)} className="mt-2 flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 font-medium">
                {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {open ? 'Hide options' : 'Show options'}
              </button>
            )}
            {open && (
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {question.options.map(opt => {
                  const correct = isCorrect(opt.label);
                  return (
                    <div key={opt.label} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs
                      ${correct ? 'bg-blue-50 border border-blue-200 text-blue-800 font-medium' : 'bg-gray-50 border border-gray-100 text-gray-600'}`}>
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                        ${correct ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white' : 'bg-gray-200 text-gray-500'}`}>{opt.label}</span>
                      <span className="flex-1 leading-tight">{opt.text}</span>
                      {correct && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                    </div>
                  );
                })}
              </div>
            )}
            {question.explanation && (
              <p className="mt-2 text-xs text-gray-400 italic">💡 {question.explanation}</p>
            )}
          </div>
          <div className="flex flex-col gap-1 shrink-0">
            <button onClick={() => onEdit(index)} className="p-2 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"><PenLine className="w-4 h-4" /></button>
            <button onClick={() => onRemove(index)} className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"><Trash2 className="w-4 h-4" /></button>
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

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-500/20 border border-white/60 w-full max-w-lg my-8">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center">
              <PenLine className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-900">Edit Question</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400"><X className="w-5 h-5" /></button>
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
                    <div key={label} className={`flex items-center gap-3 p-3 rounded-xl border-2 ${correct ? 'border-blue-400 bg-blue-50' : 'border-gray-100 bg-gray-50'}`}>
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
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 text-sm font-semibold">Cancel</button>
          <button onClick={handleSave} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#2563eb,#0891b2)' }}>
            <Save className="w-4 h-4" /> Save
          </button>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════ */
const COMMON_TOPICS = [
  'React.js', 'Node.js', 'Python', 'Data Structures', 'Algorithms',
  'SQL & Databases', 'Machine Learning', 'System Design', 'JavaScript',
  'Java', 'REST APIs', 'Docker & DevOps', 'HTML & CSS', 'TypeScript',
  'Git & Version Control', 'Cloud Computing (AWS/GCP/Azure)',
  'Networking Fundamentals', 'Operating Systems', 'Computer Science Basics',
  'Cyber Security',
];

const AIAssessmentGenerator = () => {
  const navigate = useNavigate();

  // ── Mode ──────────────────────────────────────────────────────────
  const [mode, setMode] = useState('jd'); // 'jd' | 'topic'

  // ── JD mode ───────────────────────────────────────────────────────
  const [jobs, setJobs]           = useState([]);
  const [jdId, setJdId]           = useState('');

  // ── Topic mode ────────────────────────────────────────────────────
  const [topic, setTopic]         = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [subtopics, setSubtopics] = useState(['']);
  const [topicDesc, setTopicDesc] = useState('');

  // ── Common ────────────────────────────────────────────────────────
  const [title, setTitle]         = useState('');
  const [level, setLevel]         = useState('Intermediate');
  const [numQuestions, setNumQuestions] = useState(10);
  const [totalMarks, setTotalMarks] = useState('');
  const [tags, setTags]           = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime]     = useState('');
  const [duration, setDuration]   = useState(60);
  const [showResults, setShowResults] = useState(false);
  const [shuffleQs, setShuffleQs] = useState(false);

  // ── Flow state ────────────────────────────────────────────────────
  const [stage, setStage]         = useState('config'); // config | loading | review | saving | done
  const [questions, setQuestions] = useState([]);
  const [savedAssessmentId, setSavedAssessmentId] = useState(null);
  const [error, setError]         = useState('');
  const [editModal, setEditModal] = useState(null);

  useEffect(() => {
    jobAPI.getAllJobs({ limit: 100 })
      .then(res => { if (res.success) setJobs(res.jobs || res.data || []); })
      .catch(() => {});
  }, []);

  const selectedJob = jobs.find(j => j._id === jdId);
  const estMarks    = questions.reduce((s, q) => s + (Number(q.marks) || 0), 0);

  // Auto-fill title from JD
  const handleJdChange = (id) => {
    setJdId(id);
    const job = jobs.find(j => j._id === id);
    if (job && !title) setTitle(job.jobTitle || '');
  };

  // Auto-fill title from topic
  const handleTopicSelect = (t) => {
    setTopic(t);
    setCustomTopic('');
    if (!title) setTitle(`${t} Assessment`);
  };

  const effectiveTopic = customTopic.trim() || topic;

  const addSubtopic = () => setSubtopics(prev => [...prev, '']);
  const removeSubtopic = (i) => setSubtopics(prev => prev.filter((_, pi) => pi !== i));
  const setSubtopic = (i, v) => setSubtopics(prev => { const c = [...prev]; c[i] = v; return c; });

  // ── Validation ────────────────────────────────────────────────────
  const canGenerate = () => {
    if (!title.trim()) return false;
    if (mode === 'jd' && !jdId) return false;
    if (mode === 'topic' && !effectiveTopic) return false;
    return true;
  };

  // ── Generate ──────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!canGenerate()) return;
    setError(''); setStage('loading');
    try {
      const payload = {
        num_questions: numQuestions,
        level,
      };
      if (mode === 'jd') {
        payload.jd_id = jdId;
      } else {
        payload.topic = effectiveTopic;
        const filledSubtopics = subtopics.map(s => s.trim()).filter(Boolean);
        if (filledSubtopics.length > 0) payload.subtopics = filledSubtopics;
        if (topicDesc.trim()) payload.description = topicDesc.trim();
      }

      const res = await apiCall('/assessment/generate-questions', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.success && res.questions?.length > 0) {
        setQuestions(res.questions);
        setStage('review');
      } else {
        setError((res.message || 'Generation failed.') + ' Please try again.');
        setStage('config');
      }
    } catch (e) {
      const msg = e.message || '';
      if (msg.includes('503') || msg.toLowerCase().includes('unavailable'))
        setError('No AI models available. Set OPENROUTER_MODEL in backend .env.');
      else if (msg.toLowerCase().includes('json') || msg.toLowerCase().includes('parse'))
        setError('AI returned a malformed response. Please try again.');
      else
        setError(msg || 'Generation failed. Check your connection.');
      setStage('config');
    }
  };

  // ── Save ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    setStage('saving');
    try {
      const asmRes = await apiCall('/assessment', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          level,
          source_type: 'college_admin_ai',
          duration_minutes: Number(duration) || Math.max(numQuestions * 2, 10),
          jd_id: mode === 'jd' ? (jdId || null) : null,
          tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : ['ai-generated'],
          total_marks: totalMarks ? Number(totalMarks) : estMarks,
          num_questions: numQuestions,
          show_results_to_students: showResults,
          shuffle_questions: shuffleQs,
          scheduled_date: scheduledDate || null,
          start_time: startTime || null,
          end_time: endTime || null,
          status: 'draft',
        }),
      });
      if (!asmRes.success) throw new Error(asmRes.message || 'Failed to create assessment');

      const assessmentId = asmRes.assessment._id;
      for (const q of questions) {
        await apiCall(`/assessment/${assessmentId}/add-question`, {
          method: 'POST',
          body: JSON.stringify({
            question: q.question, type: q.type, level: q.level,
            marks: q.marks, explanation: q.explanation,
            options: q.options, correct_answer: q.correct_answer, status: 'active',
          }),
        });
      }

      setSavedAssessmentId(assessmentId);
      setStage('done');
    } catch (e) {
      setError(e.message || 'Failed to save.');
      setStage('review');
    }
  };

  const handleReset = () => { setStage('config'); setQuestions([]); setError(''); setSavedAssessmentId(null); };

  const subjectTitle = mode === 'jd' ? (selectedJob?.jobTitle || title) : (effectiveTopic || title);

  return (
    <CollegeAdminLayout>
      <div className="w-full space-y-5 pb-16">

        {/* Back */}
        <button onClick={() => navigate('/dashboard/college-admin/assessments')}
          className="flex items-center gap-1.5 text-gray-500 hover:text-blue-600 text-sm font-medium transition-colors group">
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Back to Assessments
        </button>

        {/* Hero Banner */}
        <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 rounded-2xl px-5 py-4 shadow-xl shadow-blue-500/20 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
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
                <p className="text-blue-200 text-xs mt-0.5">Generate a full question bank using AI — from a JD or a custom topic</p>
              </div>
            </div>
            <StepBar stage={stage} />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 text-sm">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-red-700">Error</p>
              <p className="text-red-600 mt-0.5">{error}</p>
              {stage === 'config' && canGenerate() && (
                <button onClick={handleGenerate}
                  className="mt-2 flex items-center gap-1.5 text-xs font-bold text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg">
                  <RefreshCw className="w-3.5 h-3.5" /> Try Again
                </button>
              )}
            </div>
            <button onClick={() => setError('')} className="text-red-300 hover:text-red-500"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* ══ CONFIG STAGE ══ */}
        {stage === 'config' && (
          <div className="space-y-4">

            {/* ── Mode selector ── */}
            <Card>
              <div className="p-5 space-y-4">
                <div>
                  <p className="text-sm font-bold text-gray-800 mb-3">How should AI generate questions?</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      {
                        id: 'jd',
                        icon: Briefcase,
                        title: 'Based on Job Description',
                        desc: 'Questions tailored to a specific JD — skills, responsibilities and requirements',
                        badge: 'JD-linked',
                        badgeColor: 'bg-blue-100 text-blue-700',
                      },
                      {
                        id: 'topic',
                        icon: BookMarked,
                        title: 'Based on Topic / Skill',
                        desc: 'Define a subject, subtopics and context — no JD needed',
                        badge: 'Custom',
                        badgeColor: 'bg-violet-100 text-violet-700',
                      },
                    ].map(opt => (
                      <button key={opt.id} onClick={() => setMode(opt.id)}
                        className={`text-left p-4 rounded-2xl border-2 transition-all hover:shadow-sm
                          ${mode === opt.id
                            ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-sm'
                            : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                        <div className="flex items-start gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
                            ${mode === opt.id ? 'bg-gradient-to-br from-blue-600 to-cyan-500' : 'bg-gray-100'}`}>
                            <opt.icon className={`w-4 h-4 ${mode === opt.id ? 'text-white' : 'text-gray-500'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className={`text-sm font-bold ${mode === opt.id ? 'text-blue-900' : 'text-gray-800'}`}>{opt.title}</p>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${opt.badgeColor}`}>{opt.badge}</span>
                            </div>
                            <p className="text-xs text-gray-500 leading-relaxed">{opt.desc}</p>
                          </div>
                          {mode === opt.id && <Check className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* ── JD Mode inputs ── */}
            {mode === 'jd' && (
              <Card>
                <SectionHeader icon={Briefcase} iconBg="bg-gradient-to-br from-blue-100 to-cyan-100"
                  iconColor="text-blue-600" title="Job Description" subtitle="AI will tailor questions to this role's skills and responsibilities" />
                <div className="p-5 space-y-4">
                  <Field label="Select Job Description" required>
                    {jobs.length === 0 ? (
                      <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                        <AlertCircle className="w-4 h-4 shrink-0" /> No job descriptions found. Create a JD first.
                      </div>
                    ) : (
                      <div className="relative">
                        <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select value={jdId} onChange={e => handleJdChange(e.target.value)} className={`${inp} pl-10`}>
                          <option value="">— Choose a Job Description —</option>
                          {jobs.map(j => <option key={j._id} value={j._id}>{j.jobTitle}{j.jobCode ? ` (${j.jobCode})` : ''}</option>)}
                        </select>
                      </div>
                    )}
                    {selectedJob && (
                      <div className="mt-2 flex items-center gap-3 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-3">
                        <Briefcase className="w-4 h-4 text-blue-600 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-blue-900 text-sm">{selectedJob.jobTitle}</p>
                          {selectedJob.jobRole && <p className="text-xs text-blue-500">{selectedJob.jobRole}</p>}
                        </div>
                        <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full border border-blue-200">✓</span>
                      </div>
                    )}
                  </Field>
                </div>
              </Card>
            )}

            {/* ── Topic Mode inputs ── */}
            {mode === 'topic' && (
              <Card>
                <SectionHeader icon={BookMarked} iconBg="bg-gradient-to-br from-violet-100 to-blue-100"
                  iconColor="text-violet-600" title="Topic / Skill" subtitle="Define what subject the AI should generate questions about" />
                <div className="p-5 space-y-4">
                  {/* Quick-pick topics */}
                  <Field label="Pick a common topic or type your own" required>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {COMMON_TOPICS.map(t => (
                        <button key={t} onClick={() => handleTopicSelect(t)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all
                            ${topic === t && !customTopic
                              ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white border-transparent shadow-sm'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:text-blue-600'}`}>
                          {t}
                        </button>
                      ))}
                    </div>
                    <div className="relative">
                      <Pencil className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="text" value={customTopic}
                        onChange={e => { setCustomTopic(e.target.value); setTopic(''); if (!title && e.target.value) setTitle(`${e.target.value} Assessment`); }}
                        placeholder="Or type a custom topic e.g. 'Spring Boot', 'Digital Marketing'…"
                        className={`${inp} pl-10`} />
                    </div>
                    {effectiveTopic && (
                      <div className="mt-2 flex items-center gap-2 bg-violet-50 border border-violet-200 rounded-xl px-3 py-2 text-xs text-violet-700 font-semibold">
                        <BookMarked className="w-3.5 h-3.5" /> Generating for: <strong className="ml-1">{effectiveTopic}</strong>
                      </div>
                    )}
                  </Field>

                  {/* Subtopics */}
                  <Field label="Subtopics to cover (optional)" hint="Specify chapters, sections or areas for focused questions">
                    <div className="space-y-2">
                      {subtopics.map((s, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input type="text" value={s} onChange={e => setSubtopic(i, e.target.value)}
                            placeholder={`e.g. ${['useState & useEffect', 'Props & State', 'Component Lifecycle', 'Routing', 'Redux'][i % 5]}`}
                            className={inp} />
                          {subtopics.length > 1 && (
                            <button onClick={() => removeSubtopic(i)} className="p-2 text-gray-400 hover:text-red-500 transition-colors shrink-0">
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button onClick={addSubtopic}
                        className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold hover:text-blue-700 transition-colors">
                        <PlusCircle className="w-3.5 h-3.5" /> Add subtopic
                      </button>
                    </div>
                  </Field>

                  {/* Description */}
                  <Field label="Extra context (optional)" hint="Describe the audience, exam level, or any specific focus areas">
                    <textarea rows={3} value={topicDesc} onChange={e => setTopicDesc(e.target.value)}
                      placeholder="e.g. For final year students preparing for campus interviews. Focus on practical coding knowledge."
                      className={`${inp} resize-none`} />
                  </Field>
                </div>
              </Card>
            )}

            {/* ── Assessment title + tags ── */}
            <Card>
              <SectionHeader icon={FileText} iconBg="bg-gradient-to-br from-gray-100 to-blue-50"
                iconColor="text-gray-600" title="Assessment Info" subtitle="Title and tags for this assessment" />
              <div className="p-5 space-y-4">
                <Field label="Assessment Title" required hint={mode === 'jd' ? 'Auto-filled from JD — you can override' : 'Auto-filled from topic — you can override'}>
                  <div className="relative">
                    <Type className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                      placeholder="e.g. React.js Mid-Semester Assessment"
                      className={`${inp} pl-10`} />
                  </div>
                </Field>
                <Field label="Tags" hint="Comma-separated — 'ai-generated' is always included">
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" value={tags} onChange={e => setTags(e.target.value)}
                      placeholder="react, javascript, frontend"
                      className={`${inp} pl-10`} />
                  </div>
                </Field>
              </div>
            </Card>

            {/* ── Difficulty & Volume ── */}
            <Card>
              <SectionHeader icon={Layers} iconBg="bg-gradient-to-br from-indigo-100 to-blue-100"
                iconColor="text-indigo-600" title="Difficulty & Volume" subtitle="Configure AI question complexity and quantity" />
              <div className="p-5 space-y-5">
                {/* Level */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Difficulty Level</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

                {/* Number slider */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <HashIcon className="w-4 h-4 text-gray-400" /> Number of Questions
                    </label>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent tabular-nums">{numQuestions}</span>
                      <span className="text-xs text-gray-400 font-medium">questions</span>
                    </div>
                  </div>
                  <input type="range" min={5} max={50} step={5} value={numQuestions}
                    onChange={e => setNumQuestions(Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{ background: `linear-gradient(to right,#2563eb 0%,#0891b2 ${((numQuestions-5)/45)*100}%,#e5e7eb ${((numQuestions-5)/45)*100}%,#e5e7eb 100%)` }} />
                  <style>{`input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:50%;background:linear-gradient(135deg,#2563eb,#0891b2);border:3px solid white;box-shadow:0 2px 8px rgba(37,99,235,.4);cursor:pointer}`}</style>
                  <div className="flex justify-between text-xs text-gray-300 mt-1.5">
                    {[5,10,15,20,25,30,35,40,45,50].map(v => (
                      <span key={v} className={numQuestions === v ? 'text-blue-500 font-bold' : ''}>{v}</span>
                    ))}
                  </div>
                </div>

                {/* Marks + Duration */}
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Total Marks" hint="Leave blank to auto-sum">
                    <div className="relative">
                      <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="number" min={1} value={totalMarks}
                        onChange={e => setTotalMarks(e.target.value)}
                        placeholder={`~${numQuestions}`}
                        className={`${inp} pl-10`} />
                    </div>
                  </Field>
                  <Field label="Duration (minutes)">
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="number" min={1} value={duration}
                        onChange={e => setDuration(e.target.value)}
                        className={`${inp} pl-10`} />
                    </div>
                  </Field>
                </div>
              </div>
            </Card>

            {/* ── Schedule ── */}
            <Card>
              <SectionHeader icon={Calendar} iconBg="bg-gradient-to-br from-cyan-100 to-blue-100"
                iconColor="text-cyan-600" title="Schedule (optional)" subtitle="Assessment auto-activates at start time and closes at end time" />
              <div className="p-5 space-y-4">
                <Field label="Scheduled Date">
                  <input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} className={inp} />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Start Time"><input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className={inp} /></Field>
                  <Field label="End Time"><input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className={inp} /></Field>
                </div>
              </div>
            </Card>

            {/* ── Settings ── */}
            <Card>
              <SectionHeader icon={Eye} iconBg="bg-gradient-to-br from-violet-100 to-blue-100"
                iconColor="text-violet-600" title="Assessment Settings" subtitle="Visibility and behaviour options" />
              <div className="p-5 space-y-3">
                <Toggle checked={shuffleQs} onChange={setShuffleQs}
                  label="Shuffle Questions"
                  desc="Questions appear in a different order for each student" />
              </div>
            </Card>

            <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
              <Zap className="w-4 h-4 text-blue-500 shrink-0" />
              <span>Questions are AI-generated and saved as a <strong>Draft</strong>. You can edit or remove any question before saving.</span>
            </div>

            <div className="flex gap-3">
              <button onClick={() => navigate('/dashboard/college-admin/assessments')}
                className="px-6 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold text-sm bg-white/80">
                Cancel
              </button>
              <button onClick={handleGenerate} disabled={!canGenerate()}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold text-sm transition-all
                  ${canGenerate() ? 'shadow-lg shadow-blue-500/30 hover:shadow-xl ' : 'opacity-50 cursor-not-allowed'}`}
                style={canGenerate() ? { background: 'linear-gradient(135deg,#1d4ed8 0%,#0284c7 50%,#0891b2 100%)' } : { background: '#9ca3af' }}>
                <Sparkles className="w-5 h-5" />
                Generate {numQuestions} Questions with AI
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ══ LOADING STAGE ══ */}
        {stage === 'loading' && <AILoader numQuestions={numQuestions} subjectTitle={subjectTitle} />}

        {/* ══ REVIEW / SAVING STAGE ══ */}
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
                    <p className="text-sm text-gray-500 mt-0.5">
                      {title || subjectTitle} · {level} · {estMarks} marks · ~{duration} min
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={handleReset} disabled={stage === 'saving'}
                      className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50">
                      <RefreshCw className="w-4 h-4" /> Regenerate
                    </button>
                    <button onClick={handleSave} disabled={stage === 'saving'}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-60  shadow-lg shadow-blue-500/30"
                      style={{ background: 'linear-gradient(135deg,#1d4ed8,#0284c7)' }}>
                      {stage === 'saving' ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : <><Save className="w-4 h-4" />Save Assessment</>}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {[
                    { label: 'Questions',   value: questions.length,                                    Icon: ClipboardList },
                    { label: 'Total Marks', value: estMarks,                                            Icon: Trophy },
                    { label: 'Single',      value: questions.filter(q => q.type === 'single_answer').length, Icon: Check },
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
              <span>Click <strong>edit</strong> on any question to adjust before saving.</span>
            </div>

            <div className="space-y-3">
              {questions.map((q, idx) => (
                <QuestionCard key={idx} question={q} index={idx}
                  onEdit={i => setEditModal(i)}
                  onRemove={i => setQuestions(prev => prev.filter((_, pi) => pi !== i))} />
              ))}
            </div>

            {stage === 'review' && (
              <div className="sticky bottom-4 flex justify-center">
                <button onClick={handleSave}
                  className="flex items-center gap-2.5 px-8 py-3.5 rounded-2xl text-white font-bold text-sm shadow-2xl shadow-blue-500/40  transition-all"
                  style={{ background: 'linear-gradient(135deg,#1e40af,#0284c7,#0891b2)' }}>
                  <Save className="w-5 h-5" /> Save {questions.length} Questions as Assessment
                </button>
              </div>
            )}
          </div>
        )}

        {/* ══ DONE STAGE ══ */}
        {stage === 'done' && (
          <Card>
            <div className="p-16 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5 shadow-2xl shadow-blue-500/30"
                style={{ background: 'linear-gradient(135deg,#1d4ed8,#0891b2)' }}>
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-2">Assessment Created!</h2>
              <p className="text-gray-500 max-w-sm mb-1">{questions.length} AI-generated questions saved as <strong>Draft</strong>.</p>
              <p className="text-sm font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent mb-2">
                {title || subjectTitle} · {level} · {estMarks} marks
              </p>
              <p className="text-xs text-gray-400 mb-8">Schedule it from the Assessments list to go live for students.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center w-full max-w-sm">
                {savedAssessmentId && (
                  <button onClick={() => navigate(`/dashboard/college-admin/assessments/${savedAssessmentId}/questions`)}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-sm shadow-lg shadow-blue-500/30  transition-all"
                    style={{ background: 'linear-gradient(135deg,#1d4ed8,#0891b2)' }}>
                    <ClipboardList className="w-4 h-4" /> View & Edit Questions
                  </button>
                )}
                <button onClick={() => navigate('/dashboard/college-admin/assessments')}
                  className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold text-sm">
                  All Assessments
                </button>
                <button onClick={handleReset}
                  className="flex items-center justify-center gap-2 px-6 py-3 border border-blue-200 rounded-xl text-blue-700 hover:bg-blue-50 font-semibold text-sm">
                  <Sparkles className="w-4 h-4" /> Generate Another
                </button>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Edit modal */}
      {editModal !== null && (
        <EditModal question={questions[editModal]}
          onSave={updated => {
            setQuestions(prev => { const c = [...prev]; c[editModal] = { ...c[editModal], ...updated }; return c; });
            setEditModal(null);
          }}
          onClose={() => setEditModal(null)} />
      )}
    </CollegeAdminLayout>
  );
};

export default AIAssessmentGenerator;