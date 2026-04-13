// pages/CollegeAdmin/Assessments/SectionManager.jsx
// Step 2 of 3: divide assessment marks into sections (Coding / Quiz)
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Plus, Trash2, Edit2, Save, X,
  Code2, BookOpen, AlertCircle, CheckCircle2,
  Clock, Hash, Award, Info, Layers, ArrowRight, BarChart2,
} from 'lucide-react';
import CollegeAdminLayout from '../../../components/layout/CollegeAdminLayout';
import { InlineSkeleton } from '../../../components/common/SkeletonLoader';
import { assessmentAPI, sectionAPI } from '../../../api/Api';

// ─── Section type metadata ────────────────────────────────────────────────────
const SECTION_TYPES = [
  {
    value:  'coding',
    label:  'Coding',
    icon:   Code2,
    color:  'from-violet-600 to-purple-500',
    bg:     'bg-violet-50',
    border: 'border-violet-300',
    text:   'text-violet-700',
    badge:  'bg-violet-100 text-violet-700',
    desc:   'Algorithm & programming problems with test cases',
  },
  {
    value:  'quiz',
    label:  'Quiz / MCQ',
    icon:   BookOpen,
    color:  'from-blue-600 to-cyan-500',
    bg:     'bg-blue-50',
    border: 'border-blue-300',
    text:   'text-blue-700',
    badge:  'bg-blue-100 text-blue-700',
    desc:   'Multiple-choice, fill-in-the-blank questions',
  },
];

const BLANK = {
  title: '',
  description: '',
  type: 'quiz',
  configuration: { duration_minutes: 30, question_count: 10, shuffle_questions: false, allow_skip: true },
  scoring: { total_marks: 0, marks_per_question: 1, negative_marking: false },
};

const typeOf = (type) => SECTION_TYPES.find(t => t.value === type) || SECTION_TYPES[1];

// ─── UI primitives ────────────────────────────────────────────────────────────
const inp = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm ' +
  'focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white transition-all placeholder:text-gray-400';

const Field = ({ label, children, hint, required }) => (
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
      ${checked ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
    <div className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0
      ${checked ? 'bg-blue-600' : 'bg-gray-200'}`}>
      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-transform
        ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
    </div>
    <div>
      <p className={`text-sm font-bold ${checked ? 'text-blue-700' : 'text-gray-600'}`}>{label}</p>
      {desc && <p className="text-xs text-gray-400 mt-0.5">{desc}</p>}
    </div>
  </button>
);

// ─── Steps ────────────────────────────────────────────────────────────────────
const Steps = ({ active }) => (
  <div className="flex items-center bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
    {[
      { n: 1, label: 'Assessment Details' },
      { n: 2, label: 'Sections' },
      { n: 3, label: 'Questions' },
    ].map((step, i) => (
      <div key={step.n} className="flex items-center flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0
            ${step.n < active
              ? 'bg-green-500 text-white'
              : step.n === active
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                : 'bg-gray-100 text-gray-400'}`}>
            {step.n < active ? <CheckCircle2 className="w-4 h-4" /> : step.n}
          </div>
          <span className={`text-xs font-bold truncate
            ${step.n === active ? 'text-blue-700' : step.n < active ? 'text-green-600' : 'text-gray-400'}`}>
            {step.label}
          </span>
        </div>
        {i < 2 && <ChevronRight className="w-4 h-4 text-gray-200 flex-shrink-0 mx-1" />}
      </div>
    ))}
  </div>
);

// ─── SectionForm (inline) ─────────────────────────────────────────────────────
const SectionForm = ({ initial, onSave, onCancel, totalAssessmentMarks, usedMarks }) => {
  const [form, setForm] = useState(() =>
    initial ? JSON.parse(JSON.stringify(initial)) : JSON.parse(JSON.stringify(BLANK))
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState('');

  // Deep-set with dot-path + auto-calc section total marks
  const set = (path, value) => {
    setForm(prev => {
      const next  = JSON.parse(JSON.stringify(prev));
      const parts = path.split('.');
      let cur     = next;
      for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]];
      cur[parts[parts.length - 1]] = value;

      // Auto-calc section total_marks = question_count × marks_per_question
      if (path === 'configuration.question_count' || path === 'scoring.marks_per_question') {
        const qc  = Number(path === 'configuration.question_count'  ? value : next.configuration.question_count);
        const mpq = Number(path === 'scoring.marks_per_question'    ? value : next.scoring.marks_per_question);
        if (qc > 0 && mpq > 0) next.scoring.total_marks = qc * mpq;
      }
      return next;
    });
  };

  // Marks available for this section (overall budget minus what other sections already use)
  const editingOwnMarks = initial?.scoring?.total_marks || 0;
  const available       = totalAssessmentMarks - usedMarks + editingOwnMarks;

  const validate = () => {
    if (!form.title.trim())                                              return 'Section title is required';
    if (!form.configuration.duration_minutes || form.configuration.duration_minutes < 1)
                                                                         return 'Duration must be at least 1 minute';
    if (!form.configuration.question_count || form.configuration.question_count < 1)
                                                                         return 'At least 1 question is required';
    if (!form.scoring.marks_per_question || form.scoring.marks_per_question <= 0)
                                                                         return 'Marks per question must be > 0';
    if (form.scoring.total_marks < 1)                                    return 'Section total marks must be at least 1';
    if (totalAssessmentMarks > 0 && form.scoring.total_marks > available)
                                                                         return `Only ${available} marks available for this section`;
    return '';
  };

  const handleSave = async () => {
    const msg = validate();
    if (msg) { setErr(msg); return; }
    setSaving(true);
    try { await onSave(form); }
    catch (e) { setErr(e.message || 'Failed to save section'); }
    finally   { setSaving(false); }
  };

  const ti   = typeOf(form.type);
  const Icon = ti.icon;

  return (
    <div className="bg-white border-2 border-blue-200 rounded-2xl shadow-xl p-5 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${ti.color} flex items-center justify-center`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <p className="font-black text-gray-800 text-sm">{initial ? 'Edit Section' : 'Add New Section'}</p>
        </div>
        <button type="button" onClick={onCancel}
          className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Section Type */}
      <div>
        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
          Section Type <span className="text-red-500">*</span>
        </p>
        <div className="grid grid-cols-2 gap-3">
          {SECTION_TYPES.map(t => {
            const TIcon = t.icon;
            const sel   = form.type === t.value;
            return (
              <button key={t.value} type="button" onClick={() => set('type', t.value)}
                className={`flex items-start gap-3 p-3 rounded-xl border-2 transition-all text-left
                  ${sel ? `${t.border} ${t.bg}` : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${t.color} flex items-center justify-center flex-shrink-0`}>
                  <TIcon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className={`text-sm font-bold ${sel ? t.text : 'text-gray-600'}`}>{t.label}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{t.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Title & Description */}
      <div className="space-y-3">
        <Field label="Section Title" required>
          <input type="text" value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder={form.type === 'coding' ? 'e.g. Coding Round' : 'e.g. MCQ Round'}
            className={inp} />
        </Field>
        <Field label="Description (optional)">
          <input type="text" value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="Brief description of this section"
            className={inp} />
        </Field>
      </div>

      {/* Configuration */}
      <div>
        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">Configuration</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Duration (min)" required>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input type="number" min={1} value={form.configuration.duration_minutes}
                onChange={e => set('configuration.duration_minutes', Number(e.target.value))}
                className={`${inp} pl-9`} />
            </div>
          </Field>
          <Field label="No. of Questions" required>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input type="number" min={1} value={form.configuration.question_count}
                onChange={e => set('configuration.question_count', Number(e.target.value))}
                className={`${inp} pl-9`} />
            </div>
          </Field>
        </div>
        <div className="mt-3 space-y-2">
          <Toggle checked={form.configuration.shuffle_questions}
            onChange={v => set('configuration.shuffle_questions', v)}
            label="Shuffle Questions"
            desc="Randomise question order for each student" />
          <Toggle checked={form.configuration.allow_skip}
            onChange={v => set('configuration.allow_skip', v)}
            label="Allow Skip"
            desc="Students can skip and return to questions" />
        </div>
      </div>

      {/* Scoring */}
      <div>
        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">Scoring</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Marks per Question" required hint="Auto-calculates section total">
            <div className="relative">
              <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input type="number" min={0.5} step={0.5} value={form.scoring.marks_per_question}
                onChange={e => set('scoring.marks_per_question', Number(e.target.value))}
                className={`${inp} pl-9`} />
            </div>
          </Field>

          {/* Section total marks — auto-calculated, read-only display */}
          <Field label="Section Total Marks">
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-bold
              ${form.scoring.total_marks > 0 ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-gray-100 bg-gray-50 text-gray-400'}`}>
              <Award className="w-4 h-4 flex-shrink-0" />
              {form.scoring.total_marks > 0 ? `${form.scoring.total_marks} marks` : '—'}
            </div>
          </Field>
        </div>

        {/* Budget indicator — shows remaining marks from assessment total */}
        {totalAssessmentMarks > 0 && (
          <div className="mt-2 flex items-center gap-2 text-xs bg-gray-50 rounded-xl px-3 py-2.5 text-gray-500">
            <Info className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span>
              Assessment budget: <strong className="text-gray-800">{totalAssessmentMarks}</strong>
              &nbsp;·&nbsp; Used by other sections: <strong className="text-gray-800">{usedMarks - editingOwnMarks}</strong>
              &nbsp;·&nbsp; Available for this section:{' '}
              <strong className={available < 0 ? 'text-red-600' : 'text-green-600'}>{available}</strong>
            </span>
          </div>
        )}

        <div className="mt-2">
          <Toggle checked={form.scoring.negative_marking}
            onChange={v => set('scoring.negative_marking', v)}
            label="Negative Marking"
            desc="Deduct marks for wrong answers" />
        </div>
      </div>

      {/* Error */}
      {err && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {err}
        </div>
      )}

      {/* Save / Cancel */}
      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel}
          className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-all flex items-center justify-center gap-1.5">
          <X className="w-4 h-4" /> Cancel
        </button>
        <button type="button" onClick={handleSave} disabled={saving}
          className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-60 transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-blue-200">
          {saving
            ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <Save className="w-4 h-4" />}
          {saving ? 'Saving…' : initial ? 'Update Section' : 'Add Section'}
        </button>
      </div>
    </div>
  );
};

// ─── SectionCard ──────────────────────────────────────────────────────────────
const SectionCard = ({ section, index, onEdit, onDelete }) => {
  const ti   = typeOf(section.type);
  const Icon = ti.icon;
  return (
    <div className={`bg-white rounded-2xl border-2 ${ti.border} shadow-sm p-4 flex items-start gap-4`}>
      <div className={`flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${ti.color} flex items-center justify-center`}>
        <Icon className="w-5 h-5 text-white" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wide">Section {index + 1}</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ti.badge}`}>{ti.label}</span>
        </div>
        <h3 className="font-bold text-gray-800 mt-0.5 truncate text-sm">{section.title}</h3>
        {section.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{section.description}</p>}

        <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{section.configuration.duration_minutes} min</span>
          <span className="flex items-center gap-1"><Hash className="w-3 h-3" />{section.configuration.question_count} Qs</span>
          <span className="flex items-center gap-1"><Award className="w-3 h-3" />{section.scoring.total_marks} marks</span>
          <span className="flex items-center gap-1 text-gray-400">{section.scoring.marks_per_question}/Q</span>
        </div>

        <div className="flex gap-1.5 mt-2 flex-wrap">
          {section.configuration.shuffle_questions && (
            <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">Shuffle</span>
          )}
          {section.scoring.negative_marking && (
            <span className="text-[10px] bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-medium">−ve Marking</span>
          )}
          {section.configuration.allow_skip && (
            <span className="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-medium">Skip allowed</span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5 flex-shrink-0">
        <button onClick={() => onEdit(section)}
          className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all" title="Edit">
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => onDelete(section._id)}
          className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-all" title="Delete">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

// ─── Main SectionManager ──────────────────────────────────────────────────────
const SectionManager = () => {
  const { assessmentId } = useParams();
  const navigate         = useNavigate();

  const [assessment, setAssessment] = useState(null);
  const [sections, setSections]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');
  const [showForm, setShowForm]     = useState(false);
  const [editingSection, setEditing] = useState(null);
  const [deleting, setDeleting]     = useState(null);

  // Load assessment + its sections
  useEffect(() => {
    const load = async () => {
      try {
        const [aRes, sRes] = await Promise.all([
          assessmentAPI.getAssessment(assessmentId),
          sectionAPI.getSections(assessmentId).catch(() => ({ success: true, sections: [] })),
        ]);
        if (!aRes.success) throw new Error(aRes.message || 'Assessment not found');
        setAssessment(aRes.assessment);
        setSections(sRes.sections || []);
      } catch (e) {
        setError(e.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [assessmentId]);

  const totalMarks = assessment?.total_marks || 0;
  const usedMarks  = sections.reduce((sum, s) => sum + s.scoring.total_marks, 0);
  const marksLeft  = totalMarks - usedMarks;
  const balanced   = totalMarks > 0 && marksLeft === 0;

  const flash = (msg, isErr = false) => {
    if (isErr) { setError(msg);   setTimeout(() => setError(''),   4000); }
    else       { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); }
  };

  const handleCreate = async (formData) => {
    const res = await sectionAPI.createSection(assessmentId, {
      ...formData,
      sequence_order: sections.length + 1,
    });
    if (!res.success) throw new Error(res.message || 'Failed to create section');
    setSections(prev => [...prev, res.section]);
    setShowForm(false);
    flash(`Section "${res.section.title}" added!`);
  };

  const handleUpdate = async (formData) => {
    const res = await sectionAPI.updateSection(editingSection._id, formData);
    if (!res.success) throw new Error(res.message || 'Failed to update section');
    setSections(prev => prev.map(s => s._id === editingSection._id ? res.section : s));
    setEditing(null);
    flash('Section updated!');
  };

  const handleDelete = async (sectionId) => {
    if (!window.confirm('Delete this section? This cannot be undone.')) return;
    setDeleting(sectionId);
    try {
      const res = await sectionAPI.deleteSection(sectionId);
      if (!res.success) throw new Error(res.message);
      setSections(prev => prev.filter(s => s._id !== sectionId));
      flash('Section deleted');
    } catch (e) {
      flash(e.message || 'Failed to delete', true);
    } finally {
      setDeleting(null);
    }
  };

  const handleProceed = () => {
    if (sections.length === 0) { flash('Add at least one section before proceeding.', true); return; }
    navigate(`/dashboard/college-admin/assessments/${assessmentId}/questions?sections=1`);
  };

  if (loading) return (
    <CollegeAdminLayout>
      <div className="flex items-center justify-center py-24 min-h-screen bg-gray-50">
        <InlineSkeleton rows={5} />
      </div>
    </CollegeAdminLayout>
  );

  return (
    <CollegeAdminLayout>
      <div className="min-h-screen bg-gray-50 px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
        <div className="max-w-3xl mx-auto space-y-4 pb-10">

          {/* ── Back — FIX: correct route is /:assessmentId/edit not /edit/:assessmentId ── */}
          <button
            onClick={() => navigate(`/dashboard/college-admin/assessments/${assessmentId}/edit`)}
            className="flex items-center gap-1.5 text-gray-500 hover:text-blue-600 text-sm font-semibold transition-colors group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Assessment Details
          </button>

          {/* ── Hero banner ── */}
          <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 rounded-2xl px-5 py-4 shadow-lg overflow-hidden">
            <div className="absolute inset-0 opacity-[0.06]"
              style={{ backgroundImage: 'radial-gradient(circle,white 1px,transparent 1px)', backgroundSize: '18px 18px' }} />
            <div className="relative flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center border border-white/20 flex-shrink-0">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-white font-black text-lg leading-tight">Section Manager</h1>
                <p className="text-blue-200 text-xs mt-0.5 truncate">
                  {assessment?.title || 'Assessment'} — divide marks into Coding &amp; Quiz sections
                </p>
              </div>
              {totalMarks > 0 && (
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-blue-200">Total Marks</p>
                  <p className="text-2xl font-black text-white">{totalMarks}</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Steps ── */}
          <Steps active={2} />

          {/* ── Alerts ── */}
          {error && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl p-4 text-green-700 text-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0" /> {success}
            </div>
          )}

          {/* ── Marks distribution bar ── */}
          {totalMarks > 0 && (
            <div className={`bg-white rounded-2xl border-2 shadow-sm p-4 ${balanced ? 'border-green-300' : 'border-orange-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <BarChart2 className={`w-4 h-4 ${balanced ? 'text-green-500' : 'text-orange-500'}`} />
                  <p className="text-sm font-bold text-gray-700">Marks Distribution</p>
                </div>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full
                  ${balanced ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                  {balanced
                    ? '✓ Fully allocated'
                    : marksLeft > 0
                      ? `${marksLeft} marks still to assign`
                      : `Over by ${Math.abs(marksLeft)}`}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-2.5 rounded-full transition-all duration-500 ${balanced ? 'bg-green-500' : 'bg-gradient-to-r from-blue-500 to-cyan-400'}`}
                  style={{ width: `${Math.min((usedMarks / totalMarks) * 100, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1.5">
                <span>Assigned: <strong className="text-gray-700">{usedMarks}</strong></span>
                <span>Remaining: <strong className={marksLeft > 0 ? 'text-orange-600' : 'text-green-600'}>{marksLeft}</strong></span>
                <span>Total: <strong className="text-gray-700">{totalMarks}</strong></span>
              </div>
            </div>
          )}

          {/* ── Section list ── */}
          {sections.length > 0 && (
            <div className="space-y-3">
              {sections.map((sec, i) => (
                <div key={sec._id} className={deleting === sec._id ? 'opacity-40 pointer-events-none' : ''}>
                  {editingSection?._id === sec._id ? (
                    <SectionForm
                      initial={editingSection}
                      onSave={handleUpdate}
                      onCancel={() => setEditing(null)}
                      totalAssessmentMarks={totalMarks}
                      usedMarks={usedMarks}
                    />
                  ) : (
                    <SectionCard
                      section={sec}
                      index={i}
                      onEdit={s => { setEditing(s); setShowForm(false); }}
                      onDelete={handleDelete}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── Empty state ── */}
          {sections.length === 0 && !showForm && (
            <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-10 text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Layers className="w-7 h-7 text-blue-400" />
              </div>
              <h3 className="font-bold text-gray-700 text-base">No sections yet</h3>
              <p className="text-sm text-gray-400 mt-1 mb-5 max-w-xs mx-auto">
                Add sections to divide your assessment — e.g. a Coding section and a Quiz section,
                each with their own marks and question count.
              </p>
              <button onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-sm shadow-blue-200">
                <Plus className="w-4 h-4" /> Add First Section
              </button>
            </div>
          )}

          {/* ── Inline add-section form ── */}
          {showForm && !editingSection && (
            <SectionForm
              initial={null}
              onSave={handleCreate}
              onCancel={() => setShowForm(false)}
              totalAssessmentMarks={totalMarks}
              usedMarks={usedMarks}
            />
          )}

          {/* ── Add another section button ── */}
          {sections.length > 0 && !showForm && !editingSection && (
            <button onClick={() => setShowForm(true)}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 font-semibold text-sm transition-all flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Add Another Section
            </button>
          )}

          {/* ── Info hint ── */}
          {sections.length > 0 && (
            <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 text-sm text-blue-800">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
              <span>
                Questions for each section are added in the <strong>Question Manager</strong>.
                {!balanced && totalMarks > 0 && (
                  <span className="text-orange-600 font-semibold">
                    {' '}Section marks don't add up to {totalMarks} yet — you can still proceed and fix it later.
                  </span>
                )}
              </span>
            </div>
          )}

          {/* ── Proceed / Skip buttons ── */}
          {sections.length > 0 && !showForm && !editingSection && (
            <div className="flex gap-3">
              <button
                onClick={() => navigate(`/dashboard/college-admin/assessments/${assessmentId}/questions`)}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold text-sm transition-all bg-white shadow-sm">
                Skip — Go to Questions
              </button>
              <button onClick={handleProceed}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 shadow-sm shadow-blue-200 transition-all">
                Proceed to Questions <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      </div>
    </CollegeAdminLayout>
  );
};

export default SectionManager;