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
  PlusCircle, XCircle, BookMarked, Code2, Terminal, TestTube,
  AlignLeft, ListChecks, Braces, EyeOff, ChevronRight,
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

const CODING_LANGUAGES = [
  { id: 'python',     label: 'Python',      icon: '🐍' },
  { id: 'javascript', label: 'JavaScript',  icon: '🟨' },
  { id: 'java',       label: 'Java',        icon: '☕' },
  { id: 'c++',        label: 'C++',         icon: '⚙️' },
  { id: 'c',          label: 'C',           icon: '🔧' },
];

const PROBLEM_CATEGORIES = [
  'Arrays', 'Strings', 'Linked Lists', 'Trees & Binary Search',
  'Dynamic Programming', 'Graphs', 'Math & Number Theory',
  'Sorting & Searching', 'Stack & Queue', 'Recursion & Backtracking',
  'Hashing', 'Greedy', 'Bit Manipulation', 'Two Pointers',
];

const inp = "w-full border border-gray-200 rounded-lg px-4 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors placeholder:text-gray-400";

/* ─── Shared UI atoms ─────────────────────────────────────────────────── */
const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-100 ${className}`}>{children}</div>
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
    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
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
              ${active ? 'bg-blue-50 text-blue-700 border border-blue-200' : done ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-400'}`}>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold
                ${active ? 'bg-blue-600 text-white' : done ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                {done ? '✓' : i + 1}
              </span>
              {label}
            </div>
            {i < 2 && <div className="w-4 h-px bg-gray-200" />}
          </div>
        );
      })}
    </div>
  );
};

/* ─── AI Loader ──────────────────────────────────────────────────────── */
const AILoader = ({ numQuestions, subjectTitle, isCoding }) => {
  const [completed, setCompleted] = useState(0);
  useEffect(() => {
    let c = 0;
    const interval = setInterval(() => {
      c++;
      if (c <= numQuestions) setCompleted(c);
      if (c >= numQuestions) clearInterval(interval);
    }, isCoding ? 8000 : 5000);
    return () => clearInterval(interval);
  }, [numQuestions, isCoding]);
  const pct = numQuestions > 0 ? Math.min(Math.round((completed / numQuestions) * 90), 90) : 10;

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
          <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-2xl shadow-blue-500/40 bg-blue-600">
            {isCoding ? <Code2 className="w-9 h-9 text-white" /> : <Sparkles className="w-9 h-9 text-white" />}
          </div>
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            {isCoding ? 'Generating coding problems…' : 'Generating your assessment'}
          </h3>
          {subjectTitle && <p className="text-sm font-semibold mt-1 bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">{subjectTitle}</p>}
          {isCoding && <p className="text-xs text-gray-400 mt-1">Each problem takes ~8–15 s — AI builds full test cases</p>}
        </div>
        <div className="flex items-center gap-4">
          {[
            { value: completed, sub: `of ${numQuestions} ${isCoding ? 'problems' : 'questions'}` },
            { value: `${pct}%`, sub: 'complete' },
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

/* ─── MCQ Question Review Card ───────────────────────────────────────── */
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

/* ─── Coding Question Review Card ────────────────────────────────────── */
const CodingQuestionCard = ({ question, index, onEdit, onRemove }) => {
  const [open, setOpen] = useState(false);
  const cfg = LEVEL_CONFIG[question.level] || LEVEL_CONFIG.Intermediate;
  const visibleTc = (question.test_cases || []).filter(tc => !tc.is_hidden);
  const hiddenTc  = (question.test_cases || []).filter(tc => tc.is_hidden);
  const langLabel = CODING_LANGUAGES.find(l => l.id === question.language)?.label || question.language || 'Code';

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Index badge */}
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
            {index + 1}
          </div>
          <div className="flex-1 min-w-0">
            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-100">
                <Code2 className="w-3 h-3" /> Coding
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600">{langLabel}</span>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${cfg.badge}`}>{question.level}</span>
              <span className="text-xs text-gray-400 font-medium">{question.marks} marks</span>
            </div>

            {/* Title */}
            <p className="text-gray-900 font-bold text-sm">{question.question}</p>

            {/* Algorithm tags */}
            {question.algorithm_tags?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {question.algorithm_tags.map(t => (
                  <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium border border-blue-100">{t}</span>
                ))}
              </div>
            )}

            {/* Test case summary */}
            <div className="flex items-center gap-3 mt-2">
              <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full">
                <Eye className="w-3 h-3" /> {visibleTc.length} sample
              </span>
              <span className="flex items-center gap-1 text-xs text-orange-700 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full">
                <EyeOff className="w-3 h-3" /> {hiddenTc.length} hidden
              </span>
            </div>

            {/* Expand/collapse */}
            <button onClick={() => setOpen(v => !v)} className="mt-2 flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 font-medium">
              {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {open ? 'Hide details' : 'Show problem details'}
            </button>

            {open && (
              <div className="mt-3 space-y-3">
                {/* Problem description */}
                {question.problem_description && (
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Problem Statement</p>
                    <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{question.problem_description}</p>
                  </div>
                )}
                {/* Input / Output / Constraints */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {question.input_format && (
                    <div className="bg-blue-50 rounded-xl p-2.5 border border-blue-100">
                      <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wide mb-1">Input</p>
                      <p className="text-xs text-blue-800 whitespace-pre-wrap">{question.input_format}</p>
                    </div>
                  )}
                  {question.output_format && (
                    <div className="bg-cyan-50 rounded-xl p-2.5 border border-cyan-100">
                      <p className="text-[10px] font-bold text-cyan-500 uppercase tracking-wide mb-1">Output</p>
                      <p className="text-xs text-cyan-800 whitespace-pre-wrap">{question.output_format}</p>
                    </div>
                  )}
                  {question.constraints && (
                    <div className="bg-amber-50 rounded-xl p-2.5 border border-amber-100">
                      <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wide mb-1">Constraints</p>
                      <p className="text-xs text-amber-800">{question.constraints}</p>
                    </div>
                  )}
                </div>
                {/* Sample test cases */}
                {visibleTc.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Sample Test Cases</p>
                    <div className="space-y-2">
                      {visibleTc.map((tc, ti) => (
                        <div key={ti} className="grid grid-cols-2 gap-2">
                          <div className="bg-gray-900 rounded-xl p-2.5">
                            <p className="text-[10px] font-bold text-gray-400 mb-1">Input</p>
                            <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">{tc.input}</pre>
                          </div>
                          <div className="bg-gray-900 rounded-xl p-2.5">
                            <p className="text-[10px] font-bold text-gray-400 mb-1">Expected Output</p>
                            <pre className="text-xs text-cyan-400 font-mono whitespace-pre-wrap">{tc.expected_output}</pre>
                          </div>
                          {tc.explanation && (
                            <div className="col-span-2 text-[10px] text-gray-400 italic">{tc.explanation}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Boilerplate */}
                {question.boilerplate_code && (
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Starter Code</p>
                    <div className="bg-gray-900 rounded-xl p-3">
                      <pre className="text-xs text-purple-300 font-mono whitespace-pre-wrap">{question.boilerplate_code}</pre>
                    </div>
                  </div>
                )}
                {question.explanation && (
                  <p className="text-xs text-gray-400 italic">💡 {question.explanation}</p>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-1 shrink-0">
            <button onClick={() => onEdit(index)} className="p-2 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"><PenLine className="w-4 h-4" /></button>
            <button onClick={() => onRemove(index)} className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── MCQ Edit Modal ─────────────────────────────────────────────────── */
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
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Question Text *</label>
            <textarea rows={3} value={form.question} onChange={e => setForm(p => ({ ...p, question: e.target.value }))} className={`${inp} resize-none`} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Type</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value, correct_answer: e.target.value === 'multiple_answer' ? [] : 'A' }))} className={inp}>
                <option value="single_answer">Single Answer</option>
                <option value="multiple_answer">Multiple Answer</option>
                <option value="fill_up">Fill in Blank</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Level</label>
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
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Marks</label>
              <input type="number" min={0.25} step={0.25} value={form.marks} onChange={e => setForm(p => ({ ...p, marks: e.target.value }))} className={inp} />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Explanation</label>
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

/* ─── Coding Edit Modal ──────────────────────────────────────────────── */
const CodingEditModal = ({ question, onSave, onClose }) => {
  const [form, setForm] = useState({
    question:           question.question           || '',
    level:              question.level              || 'Intermediate',
    language:           question.language           || 'python',
    marks:              question.marks              || 10,
    problem_description: question.problem_description || '',
    input_format:       question.input_format       || '',
    output_format:      question.output_format      || '',
    constraints:        question.constraints        || '',
    algorithm_tags:     (question.algorithm_tags || []).join(', '),
    boilerplate_code:   question.boilerplate_code   || '',
    explanation:        question.explanation        || '',
    test_cases:         (question.test_cases || []).map(tc => ({
      input:           tc.input           || '',
      expected_output: tc.expected_output || '',
      is_hidden:       !!tc.is_hidden,
      explanation:     tc.explanation     || '',
    })),
  });

  const addTestCase = () => setForm(p => ({
    ...p,
    test_cases: [...p.test_cases, { input: '', expected_output: '', is_hidden: false, explanation: '' }],
  }));
  const removeTestCase = (i) => setForm(p => ({ ...p, test_cases: p.test_cases.filter((_, pi) => pi !== i) }));
  const setTc = (i, field, val) => setForm(p => {
    const tcs = [...p.test_cases];
    tcs[i] = { ...tcs[i], [field]: val };
    return { ...p, test_cases: tcs };
  });

  const handleSave = () => onSave({
    ...form,
    marks: Number(form.marks),
    algorithm_tags: form.algorithm_tags.split(',').map(s => s.trim()).filter(Boolean),
  });

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl shadow-violet-500/20 border border-white/60 w-full max-w-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-100 to-blue-100 flex items-center justify-center">
              <Code2 className="w-4 h-4 text-violet-600" />
            </div>
            <h3 className="font-bold text-gray-900">Edit Coding Problem</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Problem Title *</label>
            <input type="text" value={form.question} onChange={e => setForm(p => ({ ...p, question: e.target.value }))} className={inp} placeholder="e.g. Two Sum, Longest Substring Without Repeating…" />
          </div>

          {/* Level / Language / Marks */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Level</label>
              <select value={form.level} onChange={e => setForm(p => ({ ...p, level: e.target.value }))} className={inp}>
                <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Language</label>
              <select value={form.language} onChange={e => setForm(p => ({ ...p, language: e.target.value }))} className={inp}>
                {CODING_LANGUAGES.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Marks</label>
              <input type="number" min={1} value={form.marks} onChange={e => setForm(p => ({ ...p, marks: e.target.value }))} className={inp} />
            </div>
          </div>

          {/* Problem Description */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Problem Description *</label>
            <textarea rows={5} value={form.problem_description} onChange={e => setForm(p => ({ ...p, problem_description: e.target.value }))}
              className={`${inp} resize-none`} placeholder="Full problem statement with examples…" />
          </div>

          {/* Input / Output / Constraints */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Input Format</label>
              <textarea rows={3} value={form.input_format} onChange={e => setForm(p => ({ ...p, input_format: e.target.value }))}
                className={`${inp} resize-none`} placeholder="Describe input…" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Output Format</label>
              <textarea rows={3} value={form.output_format} onChange={e => setForm(p => ({ ...p, output_format: e.target.value }))}
                className={`${inp} resize-none`} placeholder="Describe expected output…" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Constraints</label>
              <textarea rows={3} value={form.constraints} onChange={e => setForm(p => ({ ...p, constraints: e.target.value }))}
                className={`${inp} resize-none`} placeholder="e.g. 1 ≤ N ≤ 10^5" />
            </div>
          </div>

          {/* Algorithm tags */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Algorithm Tags <span className="font-normal text-gray-400">(comma-separated)</span></label>
            <input type="text" value={form.algorithm_tags} onChange={e => setForm(p => ({ ...p, algorithm_tags: e.target.value }))}
              className={inp} placeholder="arrays, two-pointer, hashing" />
          </div>

          {/* Boilerplate */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Starter / Boilerplate Code</label>
            <textarea rows={5} value={form.boilerplate_code} onChange={e => setForm(p => ({ ...p, boilerplate_code: e.target.value }))}
              className={`${inp} resize-none font-mono text-xs`} placeholder="def solution(...):\n    pass" />
          </div>

          {/* Test Cases */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-gray-700">Test Cases *</label>
              <button onClick={addTestCase}
                className="flex items-center gap-1 text-xs text-blue-600 font-semibold hover:text-blue-700">
                <PlusCircle className="w-3.5 h-3.5" /> Add Test Case
              </button>
            </div>
            <div className="space-y-3">
              {form.test_cases.map((tc, i) => (
                <div key={i} className={`rounded-xl border-2 p-3 space-y-2 ${tc.is_hidden ? 'border-orange-200 bg-orange-50/40' : 'border-green-200 bg-green-50/40'}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${tc.is_hidden ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                      {tc.is_hidden ? '🔒 Hidden' : '👁 Visible'} Test {i + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setTc(i, 'is_hidden', !tc.is_hidden)}
                        className="text-xs text-gray-500 hover:text-gray-700 underline">Toggle visibility</button>
                      {form.test_cases.length > 1 && (
                        <button onClick={() => removeTestCase(i)} className="text-red-400 hover:text-red-600">
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 mb-1">Input (stdin)</p>
                      <textarea rows={2} value={tc.input} onChange={e => setTc(i, 'input', e.target.value)}
                        className={`${inp} resize-none font-mono text-xs`} placeholder="5&#10;1 2 3 4 5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 mb-1">Expected Output</p>
                      <textarea rows={2} value={tc.expected_output} onChange={e => setTc(i, 'expected_output', e.target.value)}
                        className={`${inp} resize-none font-mono text-xs`} placeholder="15" />
                    </div>
                  </div>
                  <input type="text" value={tc.explanation} onChange={e => setTc(i, 'explanation', e.target.value)}
                    className={`${inp} text-xs`} placeholder="Optional explanation…" />
                </div>
              ))}
            </div>
          </div>

          {/* Explanation */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Solution Hint (optional)</label>
            <input type="text" value={form.explanation} onChange={e => setForm(p => ({ ...p, explanation: e.target.value }))}
              className={inp} placeholder="One-line approach hint…" />
          </div>
        </div>

        <div className="flex gap-3 p-5 pt-3 border-t border-gray-100">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 text-sm font-semibold">Cancel</button>
          <button onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}>
            <Save className="w-4 h-4" /> Save Changes
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
  const [mode, setMode] = useState('jd'); // 'jd' | 'topic' | 'coding'

  // ── JD mode ───────────────────────────────────────────────────────
  const [jobs, setJobs]           = useState([]);
  const [jdId, setJdId]           = useState('');

  // ── Topic mode ────────────────────────────────────────────────────
  const [topic, setTopic]         = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [subtopics, setSubtopics] = useState(['']);
  const [topicDesc, setTopicDesc] = useState('');

  // ── Coding mode ───────────────────────────────────────────────────
  const [codingLanguage, setCodingLanguage]     = useState('python');
  const [problemCategories, setProblemCategories] = useState([]);
  const [numTestCases, setNumTestCases]          = useState(4);
  const [marksPerProblem, setMarksPerProblem]    = useState(10);

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
  const [stage, setStage]         = useState('config');
  const [questions, setQuestions] = useState([]);
  const [savedAssessmentId, setSavedAssessmentId] = useState(null);
  const [error, setError]         = useState('');
  const [editModal, setEditModal] = useState(null);

  const isCodingMode = mode === 'coding';

  useEffect(() => {
    jobAPI.getAllJobs({ limit: 100 })
      .then(res => { if (res.success) setJobs(res.jobs || res.data || []); })
      .catch(() => {});
  }, []);

  const selectedJob = jobs.find(j => j._id === jdId);
  const estMarks    = isCodingMode
    ? questions.reduce((s, q) => s + (Number(q.marks) || 0), 0)
    : questions.reduce((s, q) => s + (Number(q.marks) || 0), 0);

  const handleJdChange = (id) => {
    setJdId(id);
    const job = jobs.find(j => j._id === id);
    if (job && !title) setTitle(job.jobTitle || '');
  };

  const handleTopicSelect = (t) => {
    setTopic(t);
    setCustomTopic('');
    if (!title) setTitle(`${t} Assessment`);
  };

  const effectiveTopic = customTopic.trim() || topic;

  const addSubtopic = () => setSubtopics(prev => [...prev, '']);
  const removeSubtopic = (i) => setSubtopics(prev => prev.filter((_, pi) => pi !== i));
  const setSubtopic = (i, v) => setSubtopics(prev => { const c = [...prev]; c[i] = v; return c; });

  const toggleCategory = (cat) => {
    setProblemCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  // ── Reset topic/jd fields when switching modes ─────────────────
  const handleModeChange = (newMode) => {
    setMode(newMode);
    setTitle('');
    setError('');
    if (newMode === 'coding') {
      setNumQuestions(3); // default 3 for coding (each takes more time)
    } else {
      setNumQuestions(10);
    }
  };

  // ── Validation ────────────────────────────────────────────────────
  const canGenerate = () => {
    if (!title.trim()) return false;
    if (mode === 'jd' && !jdId) return false;
    if (mode === 'topic' && !effectiveTopic) return false;
    if (mode === 'coding' && !effectiveTopic && !jdId) return false;
    return true;
  };

  // ── Generate ──────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!canGenerate()) return;
    setError(''); setStage('loading');
    try {
      if (isCodingMode) {
        // ── Coding generation ──
        const payload = {
          num_questions: numQuestions,
          level,
          language: codingLanguage,
          problem_categories: problemCategories,
          num_test_cases: numTestCases,
        };
        if (jdId) {
          payload.jd_id = jdId;
        } else {
          payload.topic = effectiveTopic;
          const filledSubtopics = subtopics.map(s => s.trim()).filter(Boolean);
          if (filledSubtopics.length > 0) payload.subtopics = filledSubtopics;
          if (topicDesc.trim()) payload.description = topicDesc.trim();
        }
        const res = await apiCall('/assessment/generate-coding-questions', {
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
      } else {
        // ── MCQ / topic generation ──
        const payload = { num_questions: numQuestions, level };
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
          duration_minutes: Number(duration) || Math.max(numQuestions * (isCodingMode ? 15 : 2), 10),
          jd_id: jdId || null,
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
        if (isCodingMode) {
          await apiCall(`/assessment/${assessmentId}/add-question`, {
            method: 'POST',
            body: JSON.stringify({
              question:            q.question,
              type:                'coding',
              level:               q.level,
              marks:               q.marks,
              language:            q.language,
              problem_description: q.problem_description,
              input_format:        q.input_format,
              output_format:       q.output_format,
              constraints:         q.constraints,
              algorithm_tags:      q.algorithm_tags,
              boilerplate_code:    q.boilerplate_code,
              test_cases:          q.test_cases,
              explanation:         q.explanation,
              status:              'active',
            }),
          });
        } else {
          await apiCall(`/assessment/${assessmentId}/add-question`, {
            method: 'POST',
            body: JSON.stringify({
              question:       q.question,
              type:           q.type,
              level:          q.level,
              marks:          q.marks,
              explanation:    q.explanation,
              options:        q.options,
              correct_answer: q.correct_answer,
              status:         'active',
            }),
          });
        }
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

  // Coding: max 10 problems, slider 1-10; MCQ: 5-50 step 5
  const codingNumMax  = 10;
  const codingNumMin  = 1;

  return (
    <CollegeAdminLayout>
      <div className="min-h-screen bg-[#f0f4f8] px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4">
        <div className="max-w-[1400px] mx-auto space-y-3 sm:space-y-4">

        {/* Back */}
        <button onClick={() => navigate('/dashboard/college-admin/assessments')}
          className="flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-2 transition-colors group text-[13px] font-bold">
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Back to Assessments
        </button>

        {/* ── HEADER ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
          <div>
            <h1 className="text-[20px] md:text-[26px] font-bold text-gray-900 tracking-tight">
              AI Assessment Generator
            </h1>
            <p className="text-[13px] text-gray-500 mt-1">Generate MCQ or Coding questions using AI — from a JD or a custom topic</p>
          </div>
          <div className="bg-white rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-100 p-2">
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
                  <p className="text-sm font-bold text-gray-800 mb-3">What type of questions should AI generate?</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      {
                        id: 'jd',
                        icon: Briefcase,
                        title: 'Based on Job Description',
                        desc: 'MCQ questions tailored to a specific JD — skills, responsibilities and requirements',
                        badge: 'JD-linked',
                        badgeColor: 'bg-blue-100 text-blue-700',
                      },
                      {
                        id: 'topic',
                        icon: BookMarked,
                        title: 'Based on Topic / Skill',
                        desc: 'MCQ questions on a subject, subtopics and context — no JD needed',
                        badge: 'Custom MCQ',
                        badgeColor: 'bg-violet-100 text-violet-700',
                      },
                      {
                        id: 'coding',
                        icon: Code2,
                        title: 'Coding Problems',
                        desc: 'Full coding challenges with test cases, I/O format, boilerplate — in your chosen language',
                        badge: 'Coding',
                        badgeColor: 'bg-emerald-100 text-emerald-700',
                      },
                    ].map(opt => (
                      <button key={opt.id} onClick={() => handleModeChange(opt.id)}
                        className={`text-left p-4 rounded-2xl border-2 transition-all hover:shadow-sm
                          ${mode === opt.id
                            ? opt.id === 'coding'
                              ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-cyan-50 shadow-sm'
                              : 'border-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-sm'
                            : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                        <div className="flex items-start gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
                            ${mode === opt.id
                              ? opt.id === 'coding'
                                ? 'bg-gradient-to-br from-emerald-500 to-cyan-500'
                                : 'bg-gradient-to-br from-blue-600 to-cyan-500'
                              : 'bg-gray-100'}`}>
                            <opt.icon className={`w-4 h-4 ${mode === opt.id ? 'text-white' : 'text-gray-500'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <p className={`text-sm font-bold ${mode === opt.id ? (opt.id === 'coding' ? 'text-emerald-900' : 'text-blue-900') : 'text-gray-800'}`}>{opt.title}</p>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${opt.badgeColor}`}>{opt.badge}</span>
                            </div>
                            <p className="text-xs text-gray-500 leading-relaxed">{opt.desc}</p>
                          </div>
                          {mode === opt.id && <Check className={`w-5 h-5 shrink-0 mt-0.5 ${opt.id === 'coding' ? 'text-emerald-600' : 'text-blue-600'}`} />}
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

            {/* ── Topic Mode inputs (used by both 'topic' and 'coding' modes) ── */}
            {(mode === 'topic' || mode === 'coding') && (
              <Card>
                <SectionHeader
                  icon={mode === 'coding' ? Code2 : BookMarked}
                  iconBg={mode === 'coding' ? 'bg-gradient-to-br from-emerald-100 to-cyan-100' : 'bg-gradient-to-br from-violet-100 to-blue-100'}
                  iconColor={mode === 'coding' ? 'text-emerald-600' : 'text-violet-600'}
                  title={mode === 'coding' ? 'Topic / Domain for Coding Problems' : 'Topic / Skill'}
                  subtitle={mode === 'coding' ? 'What domain should the coding challenges be from?' : 'Define what subject the AI should generate questions about'} />
                <div className="p-5 space-y-4">
                  <Field label="Pick a common topic or type your own" required>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {COMMON_TOPICS.map(t => (
                        <button key={t} onClick={() => handleTopicSelect(t)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all
                            ${topic === t && !customTopic
                              ? mode === 'coding'
                                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white border-transparent shadow-sm'
                                : 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white border-transparent shadow-sm'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:text-blue-600'}`}>
                          {t}
                        </button>
                      ))}
                    </div>
                    <div className="relative">
                      <Pencil className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="text" value={customTopic}
                        onChange={e => { setCustomTopic(e.target.value); setTopic(''); if (!title && e.target.value) setTitle(`${e.target.value} ${mode === 'coding' ? 'Coding Challenge' : 'Assessment'}`); }}
                        placeholder={mode === 'coding' ? "e.g. 'Data Structures', 'Backend Development'…" : "Or type a custom topic…"}
                        className={`${inp} pl-10`} />
                    </div>
                    {effectiveTopic && (
                      <div className={`mt-2 flex items-center gap-2 border rounded-xl px-3 py-2 text-xs font-semibold
                        ${mode === 'coding' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-violet-50 border-violet-200 text-violet-700'}`}>
                        {mode === 'coding' ? <Code2 className="w-3.5 h-3.5" /> : <BookMarked className="w-3.5 h-3.5" />}
                        Generating for: <strong className="ml-1">{effectiveTopic}</strong>
                      </div>
                    )}
                  </Field>

                  {mode === 'topic' && (
                    <>
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
                      <Field label="Extra context (optional)" hint="Describe the audience, exam level, or specific focus areas">
                        <textarea rows={3} value={topicDesc} onChange={e => setTopicDesc(e.target.value)}
                          placeholder="e.g. For final year students preparing for campus interviews. Focus on practical coding knowledge."
                          className={`${inp} resize-none`} />
                      </Field>
                    </>
                  )}
                </div>
              </Card>
            )}

            {/* ── Coding-specific config ── */}
            {mode === 'coding' && (
              <Card>
                <SectionHeader icon={Terminal} iconBg="bg-gradient-to-br from-emerald-100 to-cyan-100"
                  iconColor="text-emerald-600" title="Coding Problem Settings"
                  subtitle="Configure language, problem types and test case requirements" />
                <div className="p-5 space-y-5">

                  {/* Language picker */}
                  <Field label="Programming Language" required>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {CODING_LANGUAGES.map(lang => (
                        <button key={lang.id} onClick={() => setCodingLanguage(lang.id)}
                          className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all
                            ${codingLanguage === lang.id
                              ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                              : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                          <span className="text-xl">{lang.icon}</span>
                          <span className={`text-xs font-bold ${codingLanguage === lang.id ? 'text-emerald-700' : 'text-gray-600'}`}>{lang.label}</span>
                          {codingLanguage === lang.id && <Check className="w-3 h-3 text-emerald-600" />}
                        </button>
                      ))}
                    </div>
                  </Field>

                  {/* Problem categories */}
                  <Field label="Problem Categories" hint="Select areas to focus on — leave blank for balanced variety">
                    <div className="flex flex-wrap gap-2">
                      {PROBLEM_CATEGORIES.map(cat => (
                        <button key={cat} onClick={() => toggleCategory(cat)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all
                            ${problemCategories.includes(cat)
                              ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white border-transparent shadow-sm'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-300 hover:text-emerald-600'}`}>
                          {problemCategories.includes(cat) && '✓ '}{cat}
                        </button>
                      ))}
                    </div>
                    {problemCategories.length > 0 && (
                      <p className="text-xs text-emerald-600 mt-1.5 font-medium">{problemCategories.length} categor{problemCategories.length === 1 ? 'y' : 'ies'} selected</p>
                    )}
                  </Field>

                  {/* Test cases + Marks per problem */}
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Test Cases per Problem" hint="Visible + hidden test cases">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Total: <strong>{numTestCases}</strong> ({Math.max(1, Math.floor(numTestCases * 0.4))} visible (sample), {numTestCases - Math.max(1, Math.floor(numTestCases * 0.4))} hidden (scoring))</span>
                        </div>
                        <input type="range" min={2} max={8} step={1} value={numTestCases}
                          onChange={e => setNumTestCases(Number(e.target.value))}
                          className="w-full h-2 rounded-full appearance-none cursor-pointer"
                          style={{ background: `linear-gradient(to right,#10b981 0%,#06b6d4 ${((numTestCases-2)/6)*100}%,#e5e7eb ${((numTestCases-2)/6)*100}%,#e5e7eb 100%)` }} />
                        <div className="flex justify-between text-xs text-gray-300">
                          {[2,3,4,5,6,7,8].map(v => <span key={v} className={numTestCases === v ? 'text-emerald-500 font-bold' : ''}>{v}</span>)}
                        </div>
                      </div>
                    </Field>
                    <Field label="Marks per Problem" hint="Points awarded per coding problem">
                      <div className="relative">
                        <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="number" min={1} max={100} value={marksPerProblem}
                          onChange={e => setMarksPerProblem(Number(e.target.value))}
                          className={`${inp} pl-10`} />
                      </div>
                    </Field>
                  </div>

                  <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-800">
                    <TestTube className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Each coding problem is generated with a full problem statement, input/output format, constraints, boilerplate code and test cases. Generation takes ~8–15 s per problem.</span>
                  </div>
                </div>
              </Card>
            )}

            {/* ── Assessment title + tags ── */}
            <Card>
              <SectionHeader icon={FileText} iconBg="bg-gradient-to-br from-gray-100 to-blue-50"
                iconColor="text-gray-600" title="Assessment Info" subtitle="Title and tags for this assessment" />
              <div className="p-5 space-y-4">
                <Field label="Assessment Title" required hint="Auto-filled from topic — you can override">
                  <div className="relative">
                    <Type className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                      placeholder={mode === 'coding' ? 'e.g. Python Data Structures Coding Round' : 'e.g. React.js Mid-Semester Assessment'}
                      className={`${inp} pl-10`} />
                  </div>
                </Field>
                <Field label="Tags" hint="Comma-separated — 'ai-generated' is always included">
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" value={tags} onChange={e => setTags(e.target.value)}
                      placeholder={mode === 'coding' ? 'python, dsa, coding-round' : 'react, javascript, frontend'}
                      className={`${inp} pl-10`} />
                  </div>
                </Field>
              </div>
            </Card>

            {/* ── Difficulty & Volume ── */}
            <Card>
              <SectionHeader icon={Layers} iconBg="bg-gradient-to-br from-indigo-100 to-blue-100"
                iconColor="text-indigo-600" title="Difficulty & Volume" subtitle={mode === 'coding' ? 'Set challenge complexity and number of coding problems' : 'Configure AI question complexity and quantity'} />
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
                      <HashIcon className="w-4 h-4 text-gray-400" /> Number of {mode === 'coding' ? 'Coding Problems' : 'Questions'}
                    </label>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent tabular-nums">{numQuestions}</span>
                      <span className="text-xs text-gray-400 font-medium">{mode === 'coding' ? 'problems' : 'questions'}</span>
                    </div>
                  </div>
                  {mode === 'coding' ? (
                    <>
                      <input type="range" min={codingNumMin} max={codingNumMax} step={1} value={numQuestions}
                        onChange={e => setNumQuestions(Number(e.target.value))}
                        className="w-full h-2 rounded-full appearance-none cursor-pointer"
                        style={{ background: `linear-gradient(to right,#10b981 0%,#06b6d4 ${((numQuestions-1)/9)*100}%,#e5e7eb ${((numQuestions-1)/9)*100}%,#e5e7eb 100%)` }} />
                      <div className="flex justify-between text-xs text-gray-300 mt-1.5">
                        {[1,2,3,4,5,6,7,8,9,10].map(v => (
                          <span key={v} className={numQuestions === v ? 'text-emerald-500 font-bold' : ''}>{v}</span>
                        ))}
                      </div>
                      <p className="text-xs text-amber-600 mt-2 flex items-center gap-1.5">
                        <Timer className="w-3.5 h-3.5" /> Est. generation time: ~{numQuestions * 12} seconds
                      </p>
                    </>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>

                {/* Marks + Duration */}
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Total Marks" hint="Leave blank to auto-sum">
                    <div className="relative">
                      <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="number" min={1} value={totalMarks}
                        onChange={e => setTotalMarks(e.target.value)}
                        placeholder={`~${mode === 'coding' ? numQuestions * marksPerProblem : numQuestions}`}
                        className={`${inp} pl-10`} />
                    </div>
                  </Field>
                  <Field label="Duration (minutes)">
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="number" min={1} value={duration}
                        onChange={e => setDuration(e.target.value)}
                        placeholder={mode === 'coding' ? String(numQuestions * 15) : '60'}
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
                {!isCodingMode && (
                  <Toggle checked={shuffleQs} onChange={setShuffleQs}
                    label="Shuffle Questions"
                    desc="Questions appear in a different order for each student" />
                )}
                <Toggle checked={showResults} onChange={setShowResults}
                  label="Show Results to Students"
                  desc="Students can see their score and feedback after submission" />
              </div>
            </Card>

            <div className={`flex items-center gap-3 border rounded-xl p-4 text-sm
              ${isCodingMode
                ? 'bg-gradient-to-r from-emerald-50 to-cyan-50 border-emerald-200 text-emerald-800'
                : 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 text-blue-800'}`}>
              {isCodingMode ? <Code2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <Zap className="w-4 h-4 text-blue-500 shrink-0" />}
              <span>
                {isCodingMode
                  ? <>Coding problems include <strong>full test cases, I/O format, constraints and starter code</strong>. Saved as <strong>Draft</strong> — review before publishing.</>
                  : <>Questions are AI-generated and saved as a <strong>Draft</strong>. You can edit or remove any question before saving.</>}
              </span>
            </div>

            <div className="flex gap-3">
              <button onClick={() => navigate('/dashboard/college-admin/assessments')}
                className="px-6 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold text-sm bg-white/80">
                Cancel
              </button>
              <button onClick={handleGenerate} disabled={!canGenerate()}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold text-sm transition-all
                  ${canGenerate() ? 'shadow-lg hover:shadow-xl ' : 'opacity-50 cursor-not-allowed'}`}
                style={canGenerate()
                  ? { background: isCodingMode ? 'linear-gradient(135deg,#059669 0%,#0891b2 100%)' : 'linear-gradient(135deg,#1d4ed8 0%,#0284c7 50%,#0891b2 100%)' }
                  : { background: '#9ca3af' }}>
                {isCodingMode ? <Code2 className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                Generate {numQuestions} {isCodingMode ? 'Coding Problems' : 'Questions'} with AI
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ══ LOADING STAGE ══ */}
        {stage === 'loading' && <AILoader numQuestions={numQuestions} subjectTitle={subjectTitle} isCoding={isCodingMode} />}

        {/* ══ REVIEW / SAVING STAGE ══ */}
        {(stage === 'review' || stage === 'saving') && questions.length > 0 && (
          <div className="space-y-4">
            <Card>
              <div className="p-5">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                      <span className={`text-xs font-bold uppercase tracking-wide ${isCodingMode ? 'text-emerald-600' : 'text-blue-600'}`}>AI Generated</span>
                    </div>
                    <h2 className="font-bold text-gray-900 text-lg">
                      {questions.length} {isCodingMode ? 'Coding Problems' : 'Questions'} Ready
                    </h2>
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
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-60 shadow-lg ${isCodingMode ? "bg-emerald-600 hover:bg-emerald-700" : "bg-blue-600 hover:bg-blue-700"}`}>
                      {stage === 'saving' ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : <><Save className="w-4 h-4" />Save Assessment</>}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {isCodingMode ? [
                    { label: 'Problems',     value: questions.length,  Icon: Code2 },
                    { label: 'Total Marks',  value: estMarks,          Icon: Trophy },
                    { label: 'Test Cases',   value: questions.reduce((s, q) => s + (q.test_cases?.length || 0), 0), Icon: TestTube },
                  ] : [
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

            <div className={`flex items-center gap-3 border rounded-xl p-3.5 text-sm
              ${isCodingMode ? 'bg-gradient-to-r from-emerald-50 to-cyan-50 border-emerald-200 text-emerald-800' : 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 text-blue-800'}`}>
              <PenLine className={`w-4 h-4 shrink-0 ${isCodingMode ? 'text-emerald-500' : 'text-blue-500'}`} />
              <span>Click <strong>edit</strong> on any {isCodingMode ? 'problem' : 'question'} to adjust test cases, code or details before saving.</span>
            </div>

            <div className="space-y-3">
              {questions.map((q, idx) =>
                isCodingMode ? (
                  <CodingQuestionCard key={idx} question={q} index={idx}
                    onEdit={i => setEditModal(i)}
                    onRemove={i => setQuestions(prev => prev.filter((_, pi) => pi !== i))} />
                ) : (
                  <QuestionCard key={idx} question={q} index={idx}
                    onEdit={i => setEditModal(i)}
                    onRemove={i => setQuestions(prev => prev.filter((_, pi) => pi !== i))} />
                )
              )}
            </div>

            {stage === 'review' && (
              <div className="sticky bottom-4 flex justify-center">
                <button 
                  onClick={handleSave}
                  className={`flex items-center gap-2.5 px-8 py-3.5 rounded-2xl text-white font-bold text-sm shadow-2xl ${
                    isCodingMode 
                      ? "bg-emerald-600 hover:bg-emerald-700" 
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  <Save className="w-5 h-5" /> Save {questions.length} {isCodingMode ? 'Coding Problems' : 'Questions'} as Assessment
                </button>
              </div>
            )}
          </div>
        )}

        {/* ══ DONE STAGE ══ */}
        {stage === 'done' && (
          <Card>
            <div className="p-16 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5 shadow-2xl"
                style={{ background: isCodingMode ? 'linear-gradient(135deg,#059669,#0891b2)' : 'linear-gradient(135deg,#1d4ed8,#0891b2)' }}>
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-2">Assessment Created!</h2>
              <p className="text-gray-500 max-w-sm mb-1">
                {questions.length} AI-generated {isCodingMode ? 'coding problems' : 'questions'} saved as <strong>Draft</strong>.
              </p>
              <p className={`text-sm font-bold bg-clip-text text-transparent mb-2 ${isCodingMode ? 'bg-gradient-to-r from-emerald-600 to-cyan-500' : 'bg-gradient-to-r from-blue-600 to-cyan-500'}`}>
                {title || subjectTitle} · {level} · {estMarks} marks
              </p>
              <p className="text-xs text-gray-400 mb-8">Schedule it from the Assessments list to go live for students.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center w-full max-w-sm">
                {savedAssessmentId && (
                  <button onClick={() => navigate(`/dashboard/college-admin/assessments/${savedAssessmentId}/questions`)}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-sm shadow-lg transition-all"
                    style={{ background: isCodingMode ? 'linear-gradient(135deg,#059669,#0891b2)' : 'linear-gradient(135deg,#1d4ed8,#0891b2)' }}>
                    <ClipboardList className="w-4 h-4" /> View & Edit Questions
                  </button>
                )}
                <button onClick={() => navigate('/dashboard/college-admin/assessments')}
                  className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold text-sm">
                  All Assessments
                </button>
                <button onClick={handleReset}
                  className={`flex items-center justify-center gap-2 px-6 py-3 border rounded-xl font-semibold text-sm
                    ${isCodingMode ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50' : 'border-blue-200 text-blue-700 hover:bg-blue-50'}`}>
                  {isCodingMode ? <Code2 className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />} Generate Another
                </button>
              </div>
            </div>
          </Card>
        )}
      </div>
      </div>

      {/* Edit modal — MCQ or Coding */}
      {editModal !== null && (
        isCodingMode ? (
          <CodingEditModal question={questions[editModal]}
            onSave={updated => {
              setQuestions(prev => { const c = [...prev]; c[editModal] = { ...c[editModal], ...updated }; return c; });
              setEditModal(null);
            }}
            onClose={() => setEditModal(null)} />
        ) : (
          <EditModal question={questions[editModal]}
            onSave={updated => {
              setQuestions(prev => { const c = [...prev]; c[editModal] = { ...c[editModal], ...updated }; return c; });
              setEditModal(null);
            }}
            onClose={() => setEditModal(null)} />
        )
      )}
    </CollegeAdminLayout>
  );
};

export default AIAssessmentGenerator;