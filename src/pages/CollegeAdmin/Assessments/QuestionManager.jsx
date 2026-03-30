// pages/CollegeAdmin/Assessments/QuestionManager.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus, Trash2, Edit, Save, X, ChevronLeft,
  AlertCircle, CheckCircle2, BookOpen, Users, UserPlus,
  Mail, Phone, Search, ChevronRight, Eye, ListChecks,
  Target, Clock, Hash, Award, ClipboardPaste, Send,
  FileText, Check, ChevronDown, ChevronUp, Filter,
  UserCheck, Layers, RefreshCw, Star, ShieldAlert,
  CircleDot, Circle, ArrowRight,
} from 'lucide-react';
import CollegeAdminLayout from '../../../components/layout/CollegeAdminLayout';
import { InlineSkeleton } from '../../../components/common/SkeletonLoader';
import { assessmentAPI, jobAPI, collegeAdminAPI } from '../../../api/Api';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];
const inp = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white/80 transition-all";

const questionToForm = (q) => ({
  question: q.question || '',
  type: q.type || 'single_answer',
  level: q.level || 'Beginner',
  options: q.options?.length ? q.options.map(o => o.text || '') : ['', '', '', ''],
  correct_answer: Array.isArray(q.correct_answer) ? q.correct_answer : (q.correct_answer || 'A'),
  explanation: q.explanation || '',
  marks: q.marks || 1,
});

const BLANK_FORM = {
  question: '', type: 'single_answer', level: 'Beginner',
  options: ['', '', '', ''], correct_answer: 'A', explanation: '', marks: 1,
};

const BULK_FORMAT_EXAMPLE = `1. What is React?
A. A JavaScript library
B. A CSS framework
C. A database
D. A server
Answer: A
Explanation: React is a JS library for building UIs

2. Which hook is used for side effects?
A. useState
B. useEffect
C. useContext
D. useRef
Answer: B
Explanation: useEffect handles side effects in React

3. What does JSX stand for?
A. JavaScript Syntax Extension
B. JavaScript XML
C. Java Syntax XML
D. None of the above
Answer: B`;

const parseBulkText = (text) => {
  const questions = [];
  const errors = [];
  const blocks = text.split(/\n(?=\d+[\.\)]\s)/).map(b => b.trim()).filter(Boolean);

  blocks.forEach((block, blockIdx) => {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    const q = { options: [] };
    let valid = true;

    lines.forEach(line => {
      const qMatch   = line.match(/^\d+[\.\)]\s+(.+)$/);
      const optMatch = line.match(/^([A-Da-d])[\.\):\s]\s*(.+)$/);
      const ansMatch = line.match(/^Answer:\s*([A-D,\s]+)$/i);
      const marksMatch = line.match(/^Marks:\s*(\d+(?:\.\d+)?)$/i);
      const expMatch = line.match(/^Explanation:\s*(.+)$/i);

      if (qMatch && !q.question) q.question = qMatch[1].trim();
      else if (optMatch && optMatch[1].match(/[A-Da-d]/)) {
        q.options.push({ label: optMatch[1].toUpperCase(), text: optMatch[2].trim() });
      }
      else if (ansMatch) {
        const ans = ansMatch[1].toUpperCase().replace(/\s/g, '').split(',').filter(Boolean);
        q.correct_answer = ans.length === 1 ? ans[0] : ans;
      }
      else if (marksMatch) q.marks = parseFloat(marksMatch[1]);
      else if (expMatch) q.explanation = expMatch[1].trim();
    });

    const num = blockIdx + 1;
    if (!q.question)             { errors.push(`Q${num}: Missing question text`); valid = false; }
    else if (q.options.length < 2) { errors.push(`Q${num}: Need at least 2 options (A. B. C. D.)`); valid = false; }
    else if (!q.correct_answer)  { errors.push(`Q${num}: Missing Answer line`); valid = false; }

    if (valid) {
      questions.push({
        question: q.question,
        type: Array.isArray(q.correct_answer) && q.correct_answer.length > 1 ? 'multiple_answer' : 'single_answer',
        level: 'Beginner',
        options: q.options,
        correct_answer: q.correct_answer,
        marks: q.marks || 1,
        explanation: q.explanation || '',
      });
    }
  });

  return { questions, errors };
};

/* ─── Completion Checklist Modal ─────────────────────────────────────
   Shows when admin tries to leave without completing required steps.
   Blocks navigation if students are not assigned.
──────────────────────────────────────────────────────────────────── */
const CompletionChecklistModal = ({
  assessment,
  savedQs,
  onClose,
  onAssignStudents,
  onProceedAnyway,
}) => {
  const hasQuestions = savedQs.length > 0;
  const meetsQLimit  = !assessment?.num_questions || savedQs.length >= assessment.num_questions;
  const hasStudents  = (assessment?.eligible_students?.length || 0) > 0;
  const hasSchedule  = !!(assessment?.scheduled_date && assessment?.start_time && assessment?.end_time);

  const hardBlocked = !hasStudents;

  const items = [
    {
      id: 'questions',
      label: 'Questions added',
      detail: hasQuestions
        ? `${savedQs.length} question${savedQs.length !== 1 ? 's' : ''} saved${assessment?.num_questions ? ` (limit: ${assessment.num_questions})` : ''}`
        : 'No questions have been added yet',
      done: hasQuestions,
      warn: hasQuestions && !meetsQLimit,
      warnMsg: `Only ${savedQs.length}/${assessment?.num_questions} questions added`,
      required: false,
    },
    {
      id: 'students',
      label: 'Students assigned',
      detail: hasStudents
        ? `${assessment.eligible_students.length} student${assessment.eligible_students.length !== 1 ? 's' : ''} assigned`
        : "No students assigned — students won't see this assessment",
      done: hasStudents,
      required: true,
    },
    {
      id: 'schedule',
      label: 'Schedule set',
      detail: hasSchedule
        ? `Scheduled: ${new Date(assessment.scheduled_date).toLocaleDateString('en-IN')} · ${assessment.start_time} – ${assessment.end_time}`
        : 'No schedule set — assessment stays in Draft',
      done: hasSchedule,
      required: false,
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className={`px-5 py-4 flex items-center gap-3 ${hardBlocked ? 'bg-red-50 border-b border-red-200' : 'bg-amber-50 border-b border-amber-200'}`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${hardBlocked ? 'bg-red-100' : 'bg-amber-100'}`}>
            <ShieldAlert className={`w-5 h-5 ${hardBlocked ? 'text-red-600' : 'text-amber-600'}`} />
          </div>
          <div>
            <h3 className={`font-black text-base ${hardBlocked ? 'text-red-800' : 'text-amber-800'}`}>
              {hardBlocked ? 'Cannot Leave Yet' : 'Incomplete Steps'}
            </h3>
            <p className={`text-xs mt-0.5 ${hardBlocked ? 'text-red-600' : 'text-amber-600'}`}>
              {hardBlocked
                ? 'Assign students before leaving this assessment'
                : 'Some steps are incomplete — you can still leave'}
            </p>
          </div>
          <button onClick={onClose} className="ml-auto p-1.5 rounded-lg hover:bg-black/10 text-gray-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          {items.map(item => (
            <div key={item.id}
              className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all
                ${item.done
                  ? 'bg-green-50 border-green-200'
                  : item.required
                  ? 'bg-red-50 border-red-300'
                  : 'bg-amber-50 border-amber-200'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5
                ${item.done ? 'bg-green-500' : item.required ? 'bg-red-200' : 'bg-amber-200'}`}>
                {item.done
                  ? <Check className="w-3.5 h-3.5 text-white" />
                  : item.required
                  ? <X className="w-3 h-3 text-red-600" />
                  : <AlertCircle className="w-3 h-3 text-amber-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-bold
                    ${item.done ? 'text-green-800' : item.required ? 'text-red-700' : 'text-amber-800'}`}>
                    {item.label}
                  </p>
                  {item.required && !item.done && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full border border-red-200">
                      Required
                    </span>
                  )}
                </div>
                <p className={`text-xs mt-0.5
                  ${item.done ? 'text-green-600' : item.required ? 'text-red-500' : 'text-amber-600'}`}>
                  {item.warn ? item.warnMsg : item.detail}
                </p>
              </div>
              {!item.done && item.id === 'students' && (
                <button
                  onClick={() => { onClose(); onAssignStudents(); }}
                  className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0">
                  Assign Now <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold text-sm transition-all">
            Stay Here
          </button>
          {!hardBlocked ? (
            <button onClick={onProceedAnyway}
              className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-sm transition-all">
              Leave Anyway
            </button>
          ) : (
            <button
              onClick={() => { onClose(); onAssignStudents(); }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 hover:opacity-90 transition-all">
              <Users className="w-4 h-4" /> Assign Students
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Question preview card ──────────────────────────────────────────── */
const QuestionCard = ({ q, idx, onEdit, onRemove, staged = false }) => {
  const [open, setOpen] = useState(false);
  const isCorrect = (label) =>
    Array.isArray(q.correct_answer) ? q.correct_answer.includes(label) : q.correct_answer === label;

  return (
    <div className={`rounded-xl border-2 transition-all
      ${staged ? 'border-amber-200 bg-amber-50/30' : 'border-gray-100 bg-white'} shadow-sm`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 text-white shadow-sm
            ${staged ? 'bg-amber-400' : 'bg-gradient-to-br from-blue-600 to-cyan-500'}`}>
            {idx + 1}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full font-semibold capitalize">
                {q.type?.replace('_', ' ')}
              </span>
              <span className="text-[10px] bg-cyan-50 text-cyan-600 border border-cyan-100 px-2 py-0.5 rounded-full font-semibold">{q.level}</span>
              <span className="text-[10px] text-gray-400 font-medium">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
              {staged && <span className="text-[10px] bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-bold">Staged</span>}
            </div>
            <p className="font-semibold text-gray-900 text-sm leading-snug">{q.question}</p>
            {(q.type === 'single_answer' || q.type === 'multiple_answer') && q.options?.length > 0 && (
              <button onClick={() => setOpen(v => !v)}
                className="mt-2 flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 font-medium">
                {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {open ? 'Hide options' : 'Show options'}
              </button>
            )}
            {open && (
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {q.options.map(opt => {
                  const correct = isCorrect(opt.label);
                  return (
                    <div key={opt.label} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs
                      ${correct ? 'bg-blue-50 border border-blue-200 text-blue-800 font-medium' : 'bg-gray-50 border border-gray-100 text-gray-600'}`}>
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0
                        ${correct ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                        {opt.label}
                      </span>
                      <span className="flex-1 truncate">{opt.text}</span>
                      {correct && <Check className="w-3 h-3 text-blue-600 shrink-0" />}
                    </div>
                  );
                })}
              </div>
            )}
            {q.type === 'fill_up' && (
              <p className="mt-2 text-xs text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg inline-block">
                ✓ {q.correct_answer}
              </p>
            )}
            {q.explanation && <p className="mt-1.5 text-xs text-gray-400 italic">💡 {q.explanation}</p>}
          </div>
          <div className="flex gap-1 shrink-0">
            {onEdit && (
              <button onClick={() => onEdit(idx)} className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all">
                <Edit className="w-3.5 h-3.5" />
              </button>
            )}
            {onRemove && (
              <button onClick={() => onRemove(idx)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Add / Edit Modal ───────────────────────────────────────────────── */
const QuestionModal = ({ question, onSave, onClose }) => {
  const [form, setForm] = useState(question ? questionToForm(question) : { ...BLANK_FORM });
  const setOpt = (idx, val) => setForm(prev => { const opts = [...prev.options]; opts[idx] = val; return { ...prev, options: opts }; });
  const isChoice = form.type === 'single_answer' || form.type === 'multiple_answer';
  const isFill   = form.type === 'fill_up';
  const toggleMulti = (label) => setForm(prev => {
    const cur = Array.isArray(prev.correct_answer) ? prev.correct_answer : [];
    return { ...prev, correct_answer: cur.includes(label) ? cur.filter(l => l !== label) : [...cur, label] };
  });
  const handleSave = () => {
    if (!form.question.trim()) return;
    if (isChoice && form.options.some(o => !o.trim())) return;
    const payload = { question: form.question.trim(), type: form.type, level: form.level, marks: Number(form.marks) || 1, explanation: form.explanation || undefined };
    if (isChoice) {
      payload.options = form.options.map((text, i) => ({ label: OPTION_LABELS[i], text: text.trim() }));
      payload.correct_answer = form.type === 'multiple_answer'
        ? (Array.isArray(form.correct_answer) ? form.correct_answer : [form.correct_answer])
        : (typeof form.correct_answer === 'string' ? form.correct_answer : 'A');
    }
    if (isFill) payload.correct_answer = typeof form.correct_answer === 'string' ? form.correct_answer : '';
    onSave(payload);
  };
  const canSave = form.question.trim() && (!isChoice || form.options.every(o => o.trim())) && (!isFill || (typeof form.correct_answer === 'string' && form.correct_answer.trim()));

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-500/20 border border-white/60 max-w-xl w-full my-8">
        <div className="px-5 py-4 bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              {question ? <Edit className="w-4 h-4 text-white" /> : <Plus className="w-4 h-4 text-white" />}
            </div>
            <h3 className="font-bold text-white">{question ? 'Edit Question' : 'Add Question'}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Question <span className="text-red-500">*</span></label>
            <textarea rows={3} value={form.question} onChange={e => setForm(prev => ({ ...prev, question: e.target.value }))} placeholder="Enter the question..." className={`${inp} resize-none`} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Type</label>
              <select value={form.type} onChange={e => setForm(prev => ({ ...prev, type: e.target.value, correct_answer: e.target.value === 'multiple_answer' ? [] : 'A' }))} className={inp}>
                <option value="single_answer">Single Answer (MCQ)</option>
                <option value="multiple_answer">Multiple Answer</option>
                <option value="fill_up">Fill in the Blank</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Level</label>
              <select value={form.level} onChange={e => setForm(prev => ({ ...prev, level: e.target.value }))} className={inp}>
                <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
              </select>
            </div>
          </div>
          {isChoice && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Options <span className="text-red-500">*</span>{' '}
                <span className="text-xs text-gray-400 font-normal">({form.type === 'multiple_answer' ? 'check all correct' : 'click radio for correct'})</span>
              </label>
              <div className="space-y-2">
                {OPTION_LABELS.map((label, idx) => {
                  const isCorr = form.type === 'multiple_answer' ? (Array.isArray(form.correct_answer) ? form.correct_answer.includes(label) : false) : form.correct_answer === label;
                  return (
                    <div key={label} className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${isCorr ? 'border-blue-400 bg-blue-50' : 'border-gray-100 bg-gray-50'}`}>
                      {form.type === 'multiple_answer'
                        ? <input type="checkbox" checked={isCorr} onChange={() => toggleMulti(label)} className="w-4 h-4 text-blue-600 rounded" />
                        : <input type="radio" name="correctAnswer" checked={isCorr} onChange={() => setForm(prev => ({ ...prev, correct_answer: label }))} className="w-4 h-4 text-blue-600" />}
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isCorr ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white' : 'bg-gray-200 text-gray-600'}`}>{label}</span>
                      <input type="text" value={form.options[idx]} onChange={e => setOpt(idx, e.target.value)} placeholder={`Option ${label}`} className="flex-1 bg-transparent text-sm focus:outline-none text-gray-700 placeholder-gray-400" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {isFill && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Correct Answer <span className="text-red-500">*</span></label>
              <input type="text" value={typeof form.correct_answer === 'string' ? form.correct_answer : ''} onChange={e => setForm(prev => ({ ...prev, correct_answer: e.target.value }))} placeholder="Enter the exact correct answer" className={inp} />
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Explanation (optional)</label>
            <input type="text" value={form.explanation} onChange={e => setForm(prev => ({ ...prev, explanation: e.target.value }))} placeholder="Brief explanation…" className={inp} />
          </div>
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold text-sm">Cancel</button>
          <button onClick={handleSave} disabled={!canSave}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl font-bold text-sm disabled:opacity-60 hover:opacity-90 shadow-md shadow-blue-500/20">
            <Save className="w-4 h-4" />{question ? 'Update' : 'Stage Question'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Bulk Paste Modal ───────────────────────────────────────────────── */
const BulkPasteModal = ({ onAdd, onClose, remaining }) => {
  const [text, setText]       = useState('');
  const [parsed, setParsed]   = useState(null);
  const [showFormat, setShowFormat] = useState(false);
  const [error, setError]     = useState('');

  const handleParse = () => {
    setError('');
    if (!text.trim()) { setError('Paste your questions first'); return; }
    const result = parseBulkText(text);
    if (result.questions.length === 0) { setError(result.errors.length > 0 ? result.errors.join('\n') : 'No valid questions found. Check the format.'); return; }
    if (result.questions.length > remaining) { setError(`Only ${remaining} more question${remaining !== 1 ? 's' : ''} allowed. Parsed ${result.questions.length} — please reduce.`); return; }
    setParsed(result);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-500/20 border border-white/60 max-w-2xl w-full my-8">
        <div className="px-5 py-4 bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center"><ClipboardPaste className="w-4 h-4 text-white" /></div>
            <div>
              <h3 className="font-bold text-white">Bulk Paste Questions</h3>
              <p className="text-blue-200 text-[11px]">{remaining} slot{remaining !== 1 ? 's' : ''} remaining</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <button onClick={() => setShowFormat(v => !v)} className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-sm font-semibold text-blue-700 hover:bg-blue-100 transition-all">
            <span className="flex items-center gap-2"><FileText className="w-4 h-4" /> Paste Format Guide</span>
            {showFormat ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showFormat && (
            <div className="bg-gray-900 rounded-xl p-4 text-[11px] font-mono leading-relaxed overflow-auto max-h-52">
              <div className="mb-2 flex items-center gap-2 text-amber-300 text-xs font-semibold">
                <Award className="w-3.5 h-3.5" />
                Marks are auto-assigned from assessment settings — no need to add Marks: field
              </div>
              <pre className="whitespace-pre-wrap text-green-400">{BULK_FORMAT_EXAMPLE}</pre>
            </div>
          )}
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Each question starts with a number like <code className="bg-amber-100 px-1 rounded font-mono">1.</code> Options use <code className="bg-amber-100 px-1 rounded font-mono">A.</code> — <code className="bg-amber-100 px-1 rounded font-mono">D.</code> <strong>Answer:</strong> can be <code className="bg-amber-100 px-1 rounded font-mono">A</code> or <code className="bg-amber-100 px-1 rounded font-mono">A,C</code> for multiple. No separator needed.</span>
          </div>
          {!parsed ? (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Paste Questions Here</label>
                <textarea rows={14} value={text} onChange={e => setText(e.target.value)}
                  placeholder={`1. What is React?\nA. A JavaScript library\nB. A CSS framework\nC. A database\nD. A server\nAnswer: A\nExplanation: optional\n\n2. Which hook handles side effects?\n...`}
                  className={`${inp} resize-none font-mono text-xs leading-relaxed`} />
              </div>
              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-xs">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <pre className="whitespace-pre-wrap font-sans">{error}</pre>
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold text-sm">Cancel</button>
                <button onClick={handleParse} disabled={!text.trim()}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl font-bold text-sm disabled:opacity-60 hover:opacity-90 shadow-md shadow-blue-500/20">
                  <Eye className="w-4 h-4" /> Parse & Preview
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-800">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span><strong>{parsed.questions.length}</strong> question{parsed.questions.length !== 1 ? 's' : ''} parsed successfully{parsed.errors.length > 0 && ` · ${parsed.errors.length} skipped`}</span>
              </div>
              {parsed.errors.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                  <p className="font-bold mb-1">Skipped:</p>
                  <pre className="whitespace-pre-wrap font-sans">{parsed.errors.join('\n')}</pre>
                </div>
              )}
              <div className="max-h-60 overflow-y-auto space-y-2 border border-gray-100 rounded-xl p-3 bg-gray-50">
                {parsed.questions.map((q, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-gray-200">
                    <span className="w-6 h-6 bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-lg flex items-center justify-center text-xs font-bold shrink-0">{idx + 1}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 leading-snug">{q.question}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Answer: <strong className="text-blue-600">{Array.isArray(q.correct_answer) ? q.correct_answer.join(', ') : q.correct_answer}</strong>{' · '}{q.marks} mark{q.marks !== 1 ? 's' : ''}{q.options?.length > 0 && ` · ${q.options.length} options`}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setParsed(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold text-sm">← Re-edit</button>
                <button onClick={() => onAdd(parsed.questions)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl font-bold text-sm hover:opacity-90 shadow-md shadow-blue-500/20">
                  <Plus className="w-4 h-4" /> Add {parsed.questions.length} to Staging
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Assign Students Modal — 3 tabs ─────────────────────────────────── */
const AssignStudentsModal = ({ assessmentId, assessment, onClose }) => {
  const [tab, setTab]               = useState('all');
  const [allStudents, setAllStudents] = useState([]);
  const [branches, setBranches]     = useState([]);
  const [selBranch, setSelBranch]   = useState('');
  const [searchAll, setSearchAll]   = useState('');
  const [selIds, setSelIds]         = useState(new Set());
  const [loadingAll, setLoadingAll] = useState(false);
  const [jdStudents, setJdStudents] = useState([]);
  const [loadingJD, setLoadingJD]   = useState(false);
  const [selJdIds, setSelJdIds]     = useState(new Set());
  const [jdFetched, setJdFetched]   = useState(false);
  const [manualEmails, setManualEmails] = useState('');
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState(null);
  const [err, setErr]               = useState('');

  const alreadyAssignedIds = new Set(
    (assessment?.eligible_students || []).map(s =>
      typeof s === 'object' ? String(s._id || s) : String(s)
    )
  );
  const alreadyAssignedCount = alreadyAssignedIds.size;

  useEffect(() => { if (tab === 'all') fetchAllStudents(); }, [tab, selBranch]);
  useEffect(() => { if (tab === 'jd' && !jdFetched) fetchJDStudents(); }, [tab]);

  const fetchAllStudents = async () => {
    setLoadingAll(true);
    try {
      const params = { limit: 500 };
      if (selBranch) params.branch = selBranch;
      const res = await collegeAdminAPI.getStudents(params);
      if (res.success) {
        const list = res.students || [];
        setAllStudents(list);
        if (!selBranch) { const uniq = [...new Set(list.map(s => s.studentInfo?.branch).filter(Boolean))].sort(); setBranches(uniq); }
      }
    } catch {} finally { setLoadingAll(false); }
  };

  const fetchJDStudents = async () => {
    const jdId = typeof assessment?.jd_id === 'object' ? assessment?.jd_id?._id : assessment?.jd_id;
    if (!jdId) { setJdFetched(true); return; }
    setLoadingJD(true);
    try {
      const res = await jobAPI.getMatchedStudents(jdId);
      if (res.success) setJdStudents((res.matchedStudents || []).filter(s => s.isEligible));
    } catch {} finally { setLoadingJD(false); setJdFetched(true); }
  };

  const filteredAll = allStudents.filter(s => {
    const notAssigned = !alreadyAssignedIds.has(String(s._id));
    if (!notAssigned) return false;
    if (!searchAll.trim()) return true;
    const q = searchAll.toLowerCase();
    return (s.fullName || '').toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q);
  });

  const filteredJD = jdStudents.filter(s => !alreadyAssignedIds.has(String(s._id || s.userId)));

  const toggleAll = (ids, selSet, setSel) => { if (selSet.size === ids.length && ids.length > 0) setSel(new Set()); else setSel(new Set(ids)); };

  const handleAssign = async () => {
    setLoading(true); setErr(''); setResult(null);
    try {
      let res;
      if (tab === 'all') {
        if (selIds.size === 0) { setErr('Select at least one student'); setLoading(false); return; }
        const emails = allStudents.filter(s => selIds.has(s._id)).map(s => s.email);
        res = await assessmentAPI.assignStudentsManual(assessmentId, emails);
      } else if (tab === 'jd') {
        if (selJdIds.size === 0) { setErr('Select at least one student'); setLoading(false); return; }
        const emails = jdStudents.filter(s => selJdIds.has(s._id || s.userId)).map(s => s.email);
        res = await assessmentAPI.assignStudentsManual(assessmentId, emails);
      } else {
        const emails = manualEmails.split(/[\n,]+/).map(s => s.trim().toLowerCase()).filter(Boolean);
        if (!emails.length) { setErr('Enter at least one email'); setLoading(false); return; }
        const invalid = emails.filter(e => !e.includes('@'));
        if (invalid.length) { setErr(`Invalid emails: ${invalid.join(', ')}`); setLoading(false); return; }
        res = await assessmentAPI.assignStudentsManual(assessmentId, emails);
      }
      if (res.success) setResult(`✓ ${res.assigned || 0} student${(res.assigned || 0) !== 1 ? 's' : ''} assigned`);
      else setErr(res.message || 'Assignment failed');
    } catch (e) { setErr(e.message); } finally { setLoading(false); }
  };

  const jdTitle = typeof assessment?.jd_id === 'object' ? assessment?.jd_id?.jobTitle : 'linked JD';
  const tabs = [
    { id: 'all',    label: 'All Students', icon: Users },
    { id: 'jd',     label: 'JD Eligible',  icon: UserCheck },
    { id: 'manual', label: 'By Email',     icon: Mail },
  ];

  const StudentRow = ({ s, checked, onToggle, matchPct }) => {
    const id = s._id || s.userId;
    return (
      <label className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all border ${checked ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-100 hover:bg-gray-50'}`}>
        <input type="checkbox" checked={checked} onChange={() => onToggle(id)} className="w-4 h-4 text-blue-600 rounded" />
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0">
          {(s.fullName || s.studentName || 'S').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{s.fullName || s.studentName || '—'}</p>
          <p className="text-[10px] text-gray-400 truncate">{s.email}{s.studentInfo?.branch && <span className="ml-2 text-blue-500 font-medium">{s.studentInfo.branch}</span>}</p>
        </div>
        {matchPct !== undefined && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${matchPct >= 80 ? 'bg-green-100 text-green-700' : matchPct >= 50 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>{matchPct}%</span>
        )}
        {checked && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
      </label>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-500/20 border border-white/60 max-w-lg w-full my-8">
        <div className="px-5 py-4 bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center"><UserPlus className="w-4 h-4 text-white" /></div>
            <div>
              <h3 className="font-bold text-white">Assign Students</h3>
              {alreadyAssignedCount > 0 && (
                <p className="text-blue-200 text-[11px] mt-0.5">{alreadyAssignedCount} already assigned — showing remaining students only</p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex border-b border-gray-100">
          {tabs.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setErr(''); setResult(null); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-all border-b-2 ${tab === t.id ? 'border-blue-600 text-blue-700 bg-blue-50/40' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              <t.icon className="w-3.5 h-3.5" />{t.label}
            </button>
          ))}
        </div>
        <div className="p-5 space-y-3">
          {tab === 'all' && (
            <>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input value={searchAll} onChange={e => setSearchAll(e.target.value)} placeholder="Search students…" className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white/80" />
                </div>
                <select value={selBranch} onChange={e => setSelBranch(e.target.value)} className="pl-3 pr-7 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white/80">
                  <option value="">All Branches</option>
                  {branches.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 px-1">
                <button onClick={() => toggleAll(filteredAll.map(s => s._id), selIds, setSelIds)} className="font-semibold text-blue-600 hover:text-blue-700">
                  {selIds.size === filteredAll.length && filteredAll.length > 0 ? '☑ Deselect All' : '☐ Select All'}
                </button>
                <span>
                  {selIds.size} selected · {filteredAll.length} remaining
                  {alreadyAssignedCount > 0 && <span className="ml-1 text-blue-500">({alreadyAssignedCount} already assigned)</span>}
                </span>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-1.5 border border-gray-100 rounded-xl p-2 bg-gray-50">
                {/* FIX: fullScreen={false} prevents gradient box artifact inside the modal panel */}
                {loadingAll
                  ? <InlineSkeleton rows={3} className="py-6" />
                  : filteredAll.length === 0
                  ? <p className="text-center text-gray-400 text-sm py-8">No students found</p>
                  : filteredAll.map(s => <StudentRow key={s._id} s={s} checked={selIds.has(s._id)} onToggle={id => setSelIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; })} />)}
              </div>
            </>
          )}
          {tab === 'jd' && (
            <>
              {!assessment?.jd_id ? (
                <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800"><AlertCircle className="w-4 h-4 shrink-0" />No JD linked. Edit the assessment to link a JD first.</div>
              ) : loadingJD ? (
                // FIX: fullScreen={false} prevents gradient box artifact inside the modal
                <div className="flex flex-col items-center py-8 gap-3">
                  <InlineSkeleton rows={4} />
                  <p className="text-sm text-gray-500">Fetching eligible students from JD…</p>
                </div>
              ) : filteredJD.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center mb-3"><CheckCircle2 className="w-6 h-6 text-green-500" /></div>
                  <p className="font-bold text-gray-700 text-sm mb-1">
                    {jdStudents.length === 0 ? 'No eligible students found' : 'All eligible students already assigned'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {jdStudents.length === 0
                      ? `No students match the eligibility criteria of ${jdTitle}`
                      : `All ${jdStudents.length} eligible students are already assigned`}
                  </p>
                  {jdStudents.length === 0 && <button onClick={fetchJDStudents} className="mt-3 flex items-center gap-1.5 text-xs text-blue-600 font-semibold hover:underline"><RefreshCw className="w-3 h-3" /> Retry</button>}
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
                    <span className="text-xs text-blue-700 font-semibold">
                      {filteredJD.length} remaining to assign
                      {alreadyAssignedCount > 0 && <span className="text-blue-400 ml-1">({alreadyAssignedCount} already done)</span>}
                    </span>
                    <button onClick={() => toggleAll(filteredJD.map(s => s._id || s.userId), selJdIds, setSelJdIds)} className="text-xs text-blue-600 font-semibold hover:text-blue-700">{selJdIds.size === filteredJD.length ? 'Deselect All' : 'Select All'}</button>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-1.5 border border-gray-100 rounded-xl p-2 bg-gray-50">
                    {filteredJD.map(s => { const id = s._id || s.userId; return <StudentRow key={id} s={s} checked={selJdIds.has(id)} matchPct={s.matchPercentage} onToggle={id => setSelJdIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; })} />; })}
                  </div>
                  <p className="text-xs text-gray-400 px-1">{selJdIds.size} selected</p>
                </>
              )}
            </>
          )}
          {tab === 'manual' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Student Email IDs</label>
              <textarea rows={6} value={manualEmails} onChange={e => setManualEmails(e.target.value)} placeholder={'student1@college.edu\nstudent2@college.edu'} className={`${inp} resize-none font-mono text-xs`} />
              <p className="text-xs text-gray-400 mt-1">One per line or comma-separated</p>
            </div>
          )}
          {err    && <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><pre className="whitespace-pre-wrap font-sans">{err}</pre></div>}
          {result && <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl p-3"><CheckCircle2 className="w-4 h-4 shrink-0" />{result}</div>}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-semibold text-sm hover:bg-gray-50">Close</button>
            {!result && (
              <button onClick={handleAssign} disabled={loading || (tab === 'jd' && !assessment?.jd_id)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl font-bold text-sm disabled:opacity-60 hover:opacity-90 shadow-md shadow-blue-500/20">
                {/* FIX: replaced <LoadingSpinner size="sm" /> with inline CSS spinner */}
                {loading
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <UserPlus className="w-4 h-4" />}
                {loading ? 'Assigning…' : tab === 'all' ? `Assign ${selIds.size} Student${selIds.size !== 1 ? 's' : ''}` : tab === 'jd' ? `Assign ${selJdIds.size} Student${selJdIds.size !== 1 ? 's' : ''}` : 'Assign'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── View Assigned Students Modal ───────────────────────────────────── */
const ViewAssignedModal = ({ assessmentId, assessmentName, level, onClose }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [page, setPage]         = useState(1);
  const [totalPgs, setTotalPgs] = useState(1);
  const [total, setTotal]       = useState(0);
  const [search, setSearch]     = useState('');

  useEffect(() => { fetchStudents(1); }, []);
  const fetchStudents = async (p = 1) => {
    setLoading(true); setError('');
    try {
      const res = await assessmentAPI.getEligibleStudents(assessmentId, { page: p, limit: 10 });
      if (res.success) { setStudents(res.students || []); setTotal(res.total || 0); setTotalPgs(res.pages || 1); setPage(p); }
      else setError(res.message || 'Failed');
    } catch (e) { setError(e.message || 'Failed'); } finally { setLoading(false); }
  };
  const filtered = search.trim() ? students.filter(s => (s.fullName || '').toLowerCase().includes(search.toLowerCase()) || (s.email || '').toLowerCase().includes(search.toLowerCase())) : students;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-500/20 border border-white/60 w-full max-w-lg flex flex-col max-h-[85vh]">
        <div className="px-5 py-4 bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 rounded-t-2xl flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center"><Users className="w-4 h-4 text-white" /></div>
            <div>
              <h3 className="font-bold text-white">Assigned Students</h3>
              <p className="text-blue-200 text-[11px] mt-0.5">{assessmentName} · {level} · {total} student{total !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-5 py-3 border-b border-gray-100 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email…" className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white/80" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {/* FIX: fullScreen={false} prevents gradient box artifact inside the modal */}
          {loading
            ? <InlineSkeleton rows={4} className="py-10" />
            : error
            ? <div className="flex items-center gap-2 text-red-600 text-sm p-4"><AlertCircle className="w-4 h-4" />{error}</div>
            : filtered.length === 0
            ? (
              <div className="flex flex-col items-center py-10 text-center">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center mb-3"><Users className="w-7 h-7 text-blue-400" /></div>
                <p className="font-bold text-gray-700 mb-1">{search ? 'No match' : 'No students assigned yet'}</p>
                <p className="text-gray-400 text-sm">{search ? 'Try different search' : 'Use Assign Students to add students'}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((s, idx) => (
                  <div key={s._id || idx} className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-blue-50/60 rounded-xl border border-gray-100 hover:border-blue-200 transition-all">
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-xs">
                      {(s.fullName || 'S').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{s.fullName || '—'}</p>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        {s.email      && <span className="flex items-center gap-1 text-xs text-gray-500"><Mail  className="w-3 h-3" />{s.email}</span>}
                        {s.mobileNumber && <span className="flex items-center gap-1 text-xs text-gray-500"><Phone className="w-3 h-3" />{s.mobileNumber}</span>}
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-bold rounded-full shrink-0">Assigned</span>
                  </div>
                ))}
              </div>
            )}
        </div>
        {!loading && !error && total > 10 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 shrink-0 text-xs text-gray-400">
            <span>Page {page}/{totalPgs} · {total} total</span>
            <div className="flex gap-2">
              <button onClick={() => fetchStudents(page - 1)} disabled={page <= 1} className="p-1.5 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => fetchStudents(page + 1)} disabled={page >= totalPgs} className="p-1.5 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
        <div className="px-5 py-4 border-t border-gray-100 shrink-0">
          <button onClick={onClose} className="w-full py-2.5 border border-gray-200 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 text-sm">Close</button>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════ */
const QuestionManager = () => {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isNewAssessment = searchParams.get('new') === '1';

  const [assessment,    setAssessment]    = useState(null);
  const [savedQs,       setSavedQs]       = useState([]);
  const [stagedQs,      setStagedQs]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [submitting,    setSubmitting]    = useState(false);
  const [error,         setError]         = useState('');
  const [toast,         setToast]         = useState(null);
  const [modal,         setModal]         = useState(null);
  const [showChecklist, setShowChecklist] = useState(false);

  useEffect(() => { fetchData(); }, [assessmentId]);

  const fetchData = async () => {
    setLoading(true); setError('');
    try {
      const res = await assessmentAPI.getAssessment(assessmentId);
      if (res.success) {
        setAssessment(res.assessment);
        setSavedQs((res.assessment.questions_id || []).filter(q => q && q.status !== 'inactive'));
      } else setError(res.message || 'Failed to load');
    } catch (err) { setError(err.message || 'Failed to load'); }
    finally { setLoading(false); }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3500);
  };

  const handleTryLeave = () => {
    const hasStudents  = (assessment?.eligible_students?.length || 0) > 0;
    const hasQuestions = savedQs.length > 0;

    if (!hasQuestions && stagedQs.length === 0) { navigate('/dashboard/college-admin/assessments'); return; }
    if (!hasStudents) { setShowChecklist(true); return; }
    if (stagedQs.length > 0) { setShowChecklist(true); return; }
    navigate('/dashboard/college-admin/assessments');
  };

  const limit      = assessment?.num_questions || 0;
  const totalCount = savedQs.length + stagedQs.length;
  const remaining  = limit > 0 ? Math.max(0, limit - totalCount) : Infinity;
  const atLimit    = limit > 0 && totalCount >= limit;

  const marksPerQ = (() => {
    if (!assessment) return 1;
    const nq = assessment.num_questions || 0;
    const tm = assessment.total_marks   || 0;
    if (nq > 0 && tm > 0) return parseFloat((tm / nq).toFixed(2));
    return 1;
  })();

  const handleStageQuestion = (payload) => {
    const withMarks = { ...payload, marks: marksPerQ };
    if (modal?.type === 'edit-staged') {
      setStagedQs(prev => { const c = [...prev]; c[modal.idx] = withMarks; return c; });
    } else {
      setStagedQs(prev => [...prev, withMarks]);
    }
    setModal(null);
  };

  const handleBulkAdd = (questions) => {
    const withMarks = questions.map(q => ({ ...q, marks: marksPerQ }));
    setStagedQs(prev => [...prev, ...withMarks]);
    setModal(null);
    showToast(`${questions.length} questions staged (${marksPerQ} mark${marksPerQ !== 1 ? 's' : ''} each) — review and click Submit`);
  };

  const handleSubmitAll = async () => {
    if (stagedQs.length === 0) return;
    setSubmitting(true);
    try {
      const res = await assessmentAPI.bulkAddQuestions(assessmentId, stagedQs);
      if (res.success) {
        setStagedQs([]);
        await fetchData();
        showToast(`✓ ${stagedQs.length} questions saved! Now assign students to the assessment.`);
        const hasStudents = (assessment?.eligible_students?.length || 0) > 0;
        if (!hasStudents) {
          setTimeout(() => showToast('⚠ Reminder: No students assigned yet — assign students before leaving!', 'warning'), 4000);
        }
      } else {
        showToast(res.message || 'Submit failed', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Error', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const totalMarks = [...savedQs, ...stagedQs].reduce((s, q) => s + (Number(q.marks) || 0), 0);
  const marksInfo  = assessment?.num_questions && assessment?.total_marks
    ? `${(assessment.total_marks / assessment.num_questions).toFixed(assessment.total_marks % assessment.num_questions === 0 ? 0 : 2)} marks/question`
    : null;
  const hasStudents = (assessment?.eligible_students?.length || 0) > 0;

  // FIX: fullScreen={false} prevents the full-screen gradient box artifact
  // inside CollegeAdminLayout during initial page load
  if (loading) return (
    <CollegeAdminLayout>
      <div className="flex items-center justify-center py-24">
        <InlineSkeleton rows={4} />
      </div>
    </CollegeAdminLayout>
  );

  return (
    <CollegeAdminLayout>
      <div className="w-full space-y-5 pb-8">

        {/* Toast */}
        {toast && (
          <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold max-w-sm
            ${toast.type === 'error' ? 'bg-red-600 text-white' : toast.type === 'warning' ? 'bg-amber-500 text-white' : 'bg-green-600 text-white'}`}>
            {toast.type === 'error' || toast.type === 'warning'
              ? <AlertCircle className="w-4 h-4 shrink-0" />
              : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            <span className="leading-snug">{toast.msg}</span>
          </div>
        )}

        {/* Back — guarded */}
        <button onClick={handleTryLeave}
          className="flex items-center gap-1.5 text-gray-500 hover:text-blue-600 text-sm font-medium transition-colors group">
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Back to Assessments
        </button>

        {/* Missing students warning banner */}
        {!hasStudents && savedQs.length > 0 && stagedQs.length === 0 && (
          <div className="flex items-center justify-between gap-4 bg-red-50 border border-red-300 rounded-2xl px-5 py-3.5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                <ShieldAlert className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="font-bold text-red-800 text-sm">No students assigned</p>
                <p className="text-xs text-red-600 mt-0.5">Students won't see this assessment until you assign them. This is required before leaving.</p>
              </div>
            </div>
            <button onClick={() => setModal('assign')}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl whitespace-nowrap transition-colors shrink-0">
              <Users className="w-3.5 h-3.5" /> Assign Now
            </button>
          </div>
        )}

        {/* Hero Banner */}
        <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 rounded-2xl px-5 py-4 shadow-xl shadow-blue-500/20 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle,white 1px,transparent 1px)', backgroundSize: '18px 18px' }} />
          </div>
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center border border-white/20 flex-shrink-0">
                <ListChecks className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-white font-black text-lg leading-tight">
                  {assessment?.title || assessment?.skill_id?.name || 'Assessment'} — {assessment?.level}
                </h1>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  <span className="inline-flex items-center gap-1 bg-white/15 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white border border-white/20">
                    <Hash className="w-3 h-3" /> {savedQs.length}/{limit || '∞'} questions
                  </span>
                  <span className="inline-flex items-center gap-1 bg-white/15 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white border border-white/20">
                    <Award className="w-3 h-3" /> {totalMarks} marks
                  </span>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border
                    ${hasStudents ? 'bg-green-400/30 text-white border-green-300/40' : 'bg-red-400/40 text-white border-red-300/40'}`}>
                    <Users className="w-3 h-3" />
                    {hasStudents ? `${assessment.eligible_students.length} students` : '⚠ No students'}
                  </span>
                  {stagedQs.length > 0 && (
                    <span className="inline-flex items-center gap-1 bg-amber-400/40 rounded-full px-2 py-0.5 text-[10px] font-bold text-white border border-amber-300/40">
                      {stagedQs.length} staged
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
              <button onClick={() => setModal('view-students')}
                className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-2 rounded-xl border border-white/30 transition-all">
                <Eye className="w-3.5 h-3.5" /> View Students
                {hasStudents && <span className="ml-0.5 px-1.5 py-0.5 bg-white/30 text-white text-[10px] font-bold rounded-full">{assessment.eligible_students.length}</span>}
              </button>
              <button onClick={() => setModal('assign')}
                className={`inline-flex items-center gap-1.5 text-white text-xs font-semibold px-3 py-2 rounded-xl border transition-all
                  ${!hasStudents ? 'bg-red-500/70 hover:bg-red-500/90 border-red-400/50 animate-pulse' : 'bg-white/20 hover:bg-white/30 border-white/30'}`}>
                <Users className="w-3.5 h-3.5" /> {hasStudents ? 'Assign Students' : 'Assign Students ⚠'}
              </button>
              {!atLimit && (
                <>
                  <button onClick={() => setModal('bulk')} className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-2 rounded-xl border border-white/30 transition-all">
                    <ClipboardPaste className="w-3.5 h-3.5" /> Bulk Paste
                  </button>
                  <button onClick={() => setModal('add')} className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-2 rounded-xl border border-white/30 transition-all">
                    <Plus className="w-3.5 h-3.5" /> Add Question
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Question limit progress */}
        {limit > 0 && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-gray-700">Question Progress</span>
              <span className={`text-sm font-black ${atLimit ? 'text-green-600' : 'text-blue-600'}`}>{totalCount} / {limit}</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${atLimit ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-gradient-to-r from-blue-600 to-cyan-500'}`}
                style={{ width: `${Math.min((totalCount / limit) * 100, 100)}%` }} />
            </div>
            <div className="flex items-center justify-between mt-1.5 text-xs text-gray-400">
              <span>{savedQs.length} saved · {stagedQs.length} staged{marksInfo ? ` · ${marksInfo}` : ''}</span>
              <span>{atLimit ? '✓ Limit reached' : `${remaining} slot${remaining !== 1 ? 's' : ''} remaining`}</span>
            </div>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: ListChecks, label: 'Saved Qs',    value: savedQs.length,  color: 'bg-blue-50 border-blue-100 text-blue-600' },
            { icon: Layers,     label: 'Staged',      value: stagedQs.length, color: 'bg-amber-50 border-amber-100 text-amber-600' },
            { icon: Award,      label: 'Total Marks', value: totalMarks,      color: 'bg-cyan-50 border-cyan-100 text-cyan-600' },
            { icon: Clock,      label: 'Duration',    value: `${assessment?.duration_minutes || 0}m`, color: 'bg-indigo-50 border-indigo-100 text-indigo-600' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className={`flex items-center gap-2 px-3 py-2.5 border rounded-xl ${color}`}>
              <Icon className="w-4 h-4 flex-shrink-0 opacity-70" />
              <div><p className="text-sm font-black leading-none">{value}</p><p className="text-[9px] font-medium opacity-60 mt-0.5 leading-none">{label}</p></div>
            </div>
          ))}
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-700"><AlertCircle className="w-8 h-8 mx-auto mb-2" />{error}</div>}

        {/* Staged preview */}
        {stagedQs.length > 0 && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border-2 border-amber-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-amber-400 rounded-lg flex items-center justify-center"><Eye className="w-3 h-3 text-white" /></div>
                <p className="font-bold text-amber-800 text-sm">{stagedQs.length} Question{stagedQs.length !== 1 ? 's' : ''} Staged — Preview</p>
                <span className="text-xs text-amber-500">Not saved to DB yet</span>
              </div>
              {/* FIX: replaced <LoadingSpinner size="sm" /> with inline CSS spinner */}
              <button onClick={handleSubmitAll} disabled={submitting}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl text-xs font-bold disabled:opacity-60 hover:opacity-90 shadow-md shadow-blue-500/20">
                {submitting
                  ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Send className="w-3.5 h-3.5" />}
                {submitting ? 'Saving…' : `Submit ${stagedQs.length}`}
              </button>
            </div>
            <div className="p-4 space-y-3">
              {stagedQs.map((q, idx) => (
                <QuestionCard key={idx} q={q} idx={idx} staged
                  onEdit={i => setModal({ type: 'edit-staged', idx: i })}
                  onRemove={i => setStagedQs(prev => prev.filter((_, pi) => pi !== i))} />
              ))}
            </div>
          </div>
        )}

        {/* Saved questions */}
        {savedQs.length === 0 && stagedQs.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><BookOpen className="w-8 h-8 text-blue-400" /></div>
            <h3 className="text-lg font-bold text-gray-700 mb-2">No Questions Yet</h3>
            <p className="text-gray-400 text-sm mb-4">Add questions one by one or paste in bulk.</p>
            {marksInfo && (
              <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2 text-sm text-blue-700 font-semibold mb-5">
                <Award className="w-4 h-4" />
                Marks auto-assigned: <strong className="ml-1">{marksInfo}</strong>
              </div>
            )}
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <button onClick={() => setModal('bulk')} className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-blue-200 text-blue-600 rounded-xl font-semibold text-sm hover:bg-blue-50"><ClipboardPaste className="w-4 h-4" /> Bulk Paste</button>
              <button onClick={() => setModal('add')} className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 hover:opacity-90"><Plus className="w-4 h-4" /> Add Question</button>
            </div>
          </div>
        ) : savedQs.length > 0 && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-100 flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center"><ListChecks className="w-3 h-3 text-white" /></div>
              <p className="font-bold text-gray-800 text-sm">{savedQs.length} Saved Question{savedQs.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="p-4 space-y-3">
              {savedQs.map((q, idx) => (
                <QuestionCard key={q._id} q={q} idx={idx}
                  onEdit={() => setModal({ type: 'edit-saved', question: q })}
                  onRemove={() => { if (window.confirm('Delete this question?')) { assessmentAPI.deleteQuestion(q._id).then(r => { if (r.success) { showToast('Deleted'); fetchData(); } }); } }} />
              ))}
            </div>
          </div>
        )}

        {/* Finalize: show once questions saved AND students assigned AND new creation */}
        {isNewAssessment && savedQs.length > 0 && stagedQs.length === 0 && hasStudents && (
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-bold text-blue-800 text-sm">Assessment is ready!</p>
                <p className="text-xs text-blue-600 mt-0.5">
                  {savedQs.length} question{savedQs.length !== 1 ? 's' : ''} · {totalMarks} marks · {assessment?.eligible_students?.length} students assigned
                </p>
              </div>
            </div>
            <button
              onClick={() => { showToast('Assessment created successfully!'); setTimeout(() => navigate('/dashboard/college-admin/assessments'), 1200); }}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm shadow-md shadow-blue-500/20 hover:opacity-90 transition-opacity whitespace-nowrap"
              style={{ background: 'linear-gradient(135deg,#1d4ed8,#0284c7,#0891b2)' }}>
              <CheckCircle2 className="w-4 h-4" /> Create Assessment
            </button>
          </div>
        )}

        {/* Sticky submit */}
        {stagedQs.length > 0 && (
          <div className="sticky bottom-4">
            {/* FIX: replaced <LoadingSpinner size="sm" /> with inline CSS spinner */}
            <button onClick={handleSubmitAll} disabled={submitting}
              className="w-full flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl text-white font-bold text-sm shadow-xl shadow-blue-500/30 disabled:opacity-60 transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#1e40af,#0284c7,#0891b2)' }}>
              {submitting
                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Send className="w-5 h-5" />}
              {submitting ? 'Saving to database…' : `Submit ${stagedQs.length} Question${stagedQs.length !== 1 ? 's' : ''} to Assessment`}
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal === 'add' && <QuestionModal onSave={handleStageQuestion} onClose={() => setModal(null)} />}
      {modal === 'bulk' && <BulkPasteModal onAdd={handleBulkAdd} onClose={() => setModal(null)} remaining={remaining === Infinity ? 9999 : remaining} />}
      {modal?.type === 'edit-staged' && <QuestionModal question={stagedQs[modal.idx]} onSave={handleStageQuestion} onClose={() => setModal(null)} />}
      {modal?.type === 'edit-saved' && (
        <QuestionModal question={modal.question}
          onSave={async (payload) => {
            const res = await assessmentAPI.updateQuestion(modal.question._id, payload);
            if (res.success) { showToast('Updated'); fetchData(); setModal(null); }
            else showToast(res.message || 'Error', 'error');
          }}
          onClose={() => setModal(null)} />
      )}
      {modal === 'assign' && <AssignStudentsModal assessmentId={assessmentId} assessment={assessment} onClose={() => { setModal(null); fetchData(); }} />}
      {modal === 'view-students' && (
        <ViewAssignedModal assessmentId={assessmentId}
          assessmentName={assessment?.title || assessment?.skill_id?.name || 'Assessment'}
          level={assessment?.level} onClose={() => setModal(null)} />
      )}

      {showChecklist && (
        <CompletionChecklistModal
          assessment={assessment}
          savedQs={savedQs}
          onClose={() => setShowChecklist(false)}
          onAssignStudents={() => { setShowChecklist(false); setModal('assign'); }}
          onProceedAnyway={() => { setShowChecklist(false); navigate('/dashboard/college-admin/assessments'); }}
        />
      )}
    </CollegeAdminLayout>
  );
};

export default QuestionManager;