// pages/CollegeAdmin/Assessments/AssessmentForm.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Save, BookOpen, AlertCircle, CheckCircle2,
  Clock, Calendar, Tag, Info, Link2, ClipboardList,
  Sparkles, SquarePen, Type, Eye, Award, Layers,
} from 'lucide-react';
import CollegeAdminLayout from '../../../components/layout/CollegeAdminLayout';
import { InlineSkeleton } from '../../../components/common/SkeletonLoader';
import { assessmentAPI, jobAPI } from '../../../api/Api';

// ── Initial state ─────────────────────────────────────────────────────────────
// NOTE: num_questions & marks_per_question are intentionally NOT here.
// Those are section-level fields managed in SectionManager.
// total_marks is entered directly here so SectionManager can validate
// that all sections' marks sum up to it.
const INITIAL_FORM = {
  title: '',
  level: 'Beginner',
  source_type: 'college_admin_manual',
  total_marks: '',             // directly entered — sections must sum to this
  duration_minutes: 60,
  scheduled_date: '',
  start_time: '',
  end_date: '',
  end_time: '',
  tags: '',
  jd_id: '',
  shuffle_questions: false,
  camera_proctoring_enabled: true,
};

// ── Shared style tokens ───────────────────────────────────────────────────────
const inp =
  'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm ' +
  'focus:outline-none focus:ring-2 focus:ring-[#003399]/30 focus:border-[#003399] ' +
  'bg-white transition-all placeholder:text-slate-400';

// ── Reusable primitives ───────────────────────────────────────────────────────
const Card = ({ children }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
    {children}
  </div>
);

const CardHead = ({ icon: Icon, title, color = 'from-[#003399] to-[#003399]/80' }) => (
  <div className={`bg-gradient-to-r ${color} px-5 py-3.5 flex items-center gap-3`}>
    <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center border border-white/20 flex-shrink-0">
      <Icon className="w-4 h-4 text-white" />
    </div>
    <h2 className="font-bold text-white text-sm">{title}</h2>
  </div>
);

const CardBody = ({ children }) => (
  <div className="p-5 space-y-4">{children}</div>
);

const Field = ({ label, children, required, hint }) => (
  <div>
    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest tracking-wider mb-1.5">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
    {hint && <p className="text-xs text-slate-400 mt-1 leading-relaxed">{hint}</p>}
  </div>
);

const Toggle = ({ checked, onChange, label, desc }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 transition-all text-left
      ${checked ? 'border-[#003399]/40 bg-[#003399]/5' : 'border-gray-200 bg-white hover:border-gray-300'}`}
  >
    <div className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0
      ${checked ? 'bg-[#003399]' : 'bg-gray-200'}`}>
      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-transform
        ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
    </div>
    <div>
      <p className={`text-sm font-bold ${checked ? 'text-[#003399]' : 'text-gray-600'}`}>{label}</p>
      {desc && <p className="text-xs text-slate-400 mt-0.5">{desc}</p>}
    </div>
  </button>
);

// ── Step indicator (shared between Form and SectionManager) ───────────────────
const Steps = ({ active }) => (
  <div className="flex items-center bg-white rounded-2xl border border-slate-100 shadow-sm p-3">
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
                ? 'bg-[#003399] text-white shadow-lg shadow-blue-200'
                : 'bg-gray-100 text-slate-400'
            }`}>
            {step.n < active ? <CheckCircle2 className="w-4 h-4" /> : step.n}
          </div>
          <span className={`text-xs font-bold truncate
            ${step.n === active ? 'text-[#003399]' : step.n < active ? 'text-green-600' : 'text-slate-400'}`}>
            {step.label}
          </span>
        </div>
        {i < 2 && <ChevronRight className="w-4 h-4 text-gray-200 flex-shrink-0 mx-1" />}
      </div>
    ))}
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
const AssessmentForm = () => {
  const navigate      = useNavigate();
  const { assessmentId } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit        = !!assessmentId;
  const urlSourceType = searchParams.get('type') || 'college_admin_manual';

  const [form, setForm]     = useState({ ...INITIAL_FORM, source_type: urlSourceType });
  const [jobs, setJobs]     = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState('');

  // Load JD list
  useEffect(() => {
    jobAPI.getAllJobs({ limit: 100 })
      .then(res => { if (res.success) setJobs(res.jobs || res.data || []); })
      .catch(() => {});
  }, []);

  // Auto-fill title when JD changes
  const handleJdChange = (jdId) => {
    const job = jobs.find(j => j._id === jdId);
    setForm(prev => ({ ...prev, jd_id: jdId, title: prev.title || (job?.jobTitle ?? '') }));
  };

  // Load existing assessment for edit mode
  useEffect(() => {
    if (!isEdit) return;
    const load = async () => {
      try {
        const res = await assessmentAPI.getAssessment(assessmentId);
        if (res.success) {
          const a = res.assessment;
          setForm({
            title:                    a.title || '',
            level:                    a.level || 'Beginner',
            source_type:              a.source_type || 'college_admin_manual',
            total_marks:              a.total_marks || '',
            duration_minutes:         a.duration_minutes || 60,
            scheduled_date:           a.scheduled_date ? new Date(a.scheduled_date).toISOString().split('T')[0] : '',
            start_time:               a.start_time || '',
            end_date:                 a.end_date ? new Date(a.end_date).toISOString().split('T')[0] : '',
            end_time:                 a.end_time || '',
            tags:                     Array.isArray(a.tags) ? a.tags.join(', ') : '',
            jd_id:                    a.jd_id?._id || a.jd_id || '',
            shuffle_questions:        a.shuffle_questions ?? false,
            camera_proctoring_enabled: a.camera_proctoring_enabled ?? true,
          });
        } else {
          setError(res.message || 'Failed to load assessment');
        }
      } catch (err) {
        setError(err.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [assessmentId, isEdit]);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (!form.title.trim())                                 { setError('Assessment title is required'); return; }
    if (!form.level)                                        { setError('Difficulty level is required'); return; }
    if (!form.total_marks || Number(form.total_marks) < 1) { setError('Total marks is required (min 1)'); return; }
    if (!form.duration_minutes || Number(form.duration_minutes) < 1) { setError('Duration must be at least 1 minute'); return; }

    const payload = {
      title:                    form.title.trim(),
      level:                    form.level,
      source_type:              form.source_type,
      total_marks:              Number(form.total_marks),
      duration_minutes:         Number(form.duration_minutes),
      scheduled_date:           form.scheduled_date || null,
      start_time:               form.start_time     || null,
      end_date:                 form.end_date        || null,
      end_time:                 form.end_time        || null,
      tags:                     form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      jd_id:                    form.jd_id || null,
      show_results_to_students: false,
      shuffle_questions:        form.shuffle_questions,
      camera_proctoring_enabled: form.camera_proctoring_enabled,
      has_sections:             true,   // always section-based when created here
    };

    setSaving(true);
    try {
      const res = isEdit
        ? await assessmentAPI.updateAssessment(assessmentId, payload)
        : await assessmentAPI.createAssessment(payload);

      if (res.success) {
        const id = res.assessment?._id || assessmentId;
        setSuccess(isEdit ? 'Updated! Redirecting to sections…' : 'Created! Now set up sections.');
        // ✅ Always go to Section Manager next
        setTimeout(() => navigate(`/dashboard/college-admin/assessments/${id}/sections`), 800);
      } else {
        setError(res.message || 'Operation failed');
      }
    } catch (err) {
      setError(err.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <CollegeAdminLayout>
      <div className="flex items-center justify-center py-24">
        <InlineSkeleton rows={5} />
      </div>
    </CollegeAdminLayout>
  );

  const isAI = form.source_type === 'college_admin_ai';

  return (
    <CollegeAdminLayout>
      <div className="px-6 py-4 md:px-8 md:py-6 space-y-5 font-sans">
        <div className="max-w-5xl mx-auto space-y-4">

          {/* ── Back ── */}
          <button
            onClick={() => navigate('/dashboard/college-admin/assessments')}
            className="flex items-center gap-1.5 text-gray-500 hover:text-[#003399] text-sm font-semibold transition-colors group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Assessments
          </button>

          {/* ── Page header ── */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0
                ${isAI ? 'bg-gradient-to-br from-violet-600 to-purple-500' : 'bg-gradient-to-br from-[#003399] to-[#003399]/80'}`}>
                {isAI
                  ? <Sparkles className="w-5 h-5 text-white" />
                  : isEdit
                    ? <SquarePen className="w-5 h-5 text-white" />
                    : <ClipboardList className="w-5 h-5 text-white" />}
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
                  {isEdit ? 'Edit Assessment' : isAI ? 'New AI Assessment' : 'New Manual Assessment'}
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  {isEdit ? 'Update settings — sections & questions stay intact' : 'Step 1 of 3 — fill details, then set up sections'}
                </p>
              </div>
            </div>
            <div className={`hidden sm:flex px-2.5 py-1 rounded-full text-[10px] font-bold items-center gap-1.5 border flex-shrink-0
              ${isAI ? 'bg-violet-50 border-violet-200 text-violet-700' : 'bg-[#003399]/5 border-[#003399]/20 text-[#003399]'}`}>
              {isAI ? <><Sparkles className="w-3 h-3" /> AI</> : <><SquarePen className="w-3 h-3" /> Manual</>}
            </div>
          </div>

          {/* ── Step progress ── */}
          <Steps active={1} />

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* ── Alerts ── */}
            {error && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl p-4 text-green-700 text-sm">
                <CheckCircle2 className="w-4 h-4 shrink-0" /> {success}
              </div>
            )}

            {/* ── Two-column layout on large screens ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

              {/* LEFT COLUMN */}
              <div className="space-y-4">

                {/* CARD 1 — Assessment Details */}
                <Card>
                  <CardHead icon={BookOpen} title="Assessment Details" />
                  <CardBody>

                    {/* Title */}
                    <Field label="Assessment Title" required
                      hint={form.jd_id ? 'Auto-filled from the linked Job Description — you can override it' : 'Give a clear, descriptive name'}>
                      <div className="relative">
                        <Type className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                        <input
                          type="text"
                          value={form.title}
                          onChange={e => set('title', e.target.value)}
                          placeholder="e.g. React Fundamentals — Batch 2025"
                          className={`${inp} pl-10`}
                        />
                      </div>
                    </Field>

                    {/* JD Link */}
                    <Field label="Link to Job Description (optional)"
                      hint="Linking a JD auto-assigns eligible students and prefills the title">
                      <div className="relative">
                        <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                        <select value={form.jd_id} onChange={e => handleJdChange(e.target.value)} className={`${inp} pl-10`}>
                          <option value="">— No JD linked —</option>
                          {jobs.map(j => (
                            <option key={j._id} value={j._id}>
                              {j.jobTitle}{j.jobCode ? ` (${j.jobCode})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </Field>

                    {/* Difficulty Level */}
                    <Field label="Difficulty Level" required>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { value: 'Beginner',     sel: 'border-emerald-400 bg-emerald-50 text-emerald-700 ring-emerald-300' },
                          { value: 'Intermediate', sel: 'border-[#003399]/40 bg-[#003399]/5 text-[#003399] ring-[#003399]/30' },
                          { value: 'Advanced',     sel: 'border-violet-400 bg-violet-50 text-violet-700 ring-violet-300' },
                        ].map(({ value, sel }) => (
                          <label key={value}
                            className={`cursor-pointer text-center px-3 py-2.5 text-xs rounded-xl border-2 font-bold transition-all
                              ${form.level === value ? `${sel} ring-2` : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'}`}>
                            <input type="radio" name="level" value={value} checked={form.level === value}
                              onChange={() => set('level', value)} className="sr-only" />
                            {value}
                          </label>
                        ))}
                      </div>
                    </Field>

                    {/* Tags */}
                    <Field label="Tags" hint="Comma-separated — e.g. frontend, javascript, react">
                      <div className="relative">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                        <input type="text" value={form.tags} onChange={e => set('tags', e.target.value)}
                          placeholder="react, hooks, components" className={`${inp} pl-10`} />
                      </div>
                    </Field>
                  </CardBody>
                </Card>

                {/* CARD 2 — Overall Marks */}
                <Card>
                  <CardHead icon={Award} title="Overall Marks" color="from-[#003399] to-[#00A9CE]" />
                  <CardBody>
                    <Field label="Total Marks" required
                      hint="Enter the overall marks. You will distribute these across sections in the next step.">
                      <div className="relative">
                        <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                        <input
                          type="number"
                          min={1}
                          value={form.total_marks}
                          onChange={e => set('total_marks', e.target.value)}
                          placeholder="e.g. 100"
                          className={`${inp} pl-10`}
                        />
                      </div>
                    </Field>

                    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
                      <Layers className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                      <span>
                        In the next step (<strong>Section Manager</strong>), you'll divide these marks into
                        sections — e.g. 60 marks for Coding + 40 marks for Quiz.
                      </span>
                    </div>
                  </CardBody>
                </Card>
              </div>

              {/* RIGHT COLUMN */}
              <div className="space-y-4">

                {/* CARD 3 — Schedule & Duration */}
                <Card>
                  <CardHead icon={Calendar} title="Schedule & Duration" color="from-[#00A9CE] to-[#003399]" />
                  <CardBody>

                    <Field label="Duration (minutes)" required>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                        <input type="number" min={1} max={600} value={form.duration_minutes}
                          onChange={e => set('duration_minutes', e.target.value)} className={`${inp} pl-10`} />
                      </div>
                    </Field>

                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Start Date" hint="Assessment opens on this date">
                        <input type="date" value={form.scheduled_date}
                          onChange={e => set('scheduled_date', e.target.value)} className={inp} />
                      </Field>
                      <Field label="End Date" hint="Assessment closes on this date">
                        <input type="date" value={form.end_date} min={form.scheduled_date || undefined}
                          onChange={e => set('end_date', e.target.value)} className={inp} />
                      </Field>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Start Time" hint="Auto-activates at this time on start date">
                        <input type="time" value={form.start_time}
                          onChange={e => set('start_time', e.target.value)} className={inp} />
                      </Field>
                      <Field label="End Time" hint="Closes at this time on end date">
                        <input type="time" value={form.end_time}
                          onChange={e => set('end_time', e.target.value)} className={inp} />
                      </Field>
                    </div>

                    {form.scheduled_date && form.start_time && (
                      <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-xs text-emerald-800">
                        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-500" />
                        <span>
                          Opens <strong>{new Date(form.scheduled_date).toDateString()}</strong> at <strong>{form.start_time}</strong>
                          {form.end_date && form.end_time && (
                            <> &nbsp;·&nbsp; Closes <strong>{new Date(form.end_date).toDateString()}</strong> at <strong>{form.end_time}</strong></>
                          )}
                        </span>
                      </div>
                    )}
                  </CardBody>
                </Card>

                {/* CARD 4 — Settings: only shuffle + camera (no show_results, no default_coding_language) */}
                <Card>
                  <CardHead icon={Eye} title="Assessment Settings" color="from-[#003399] to-[#003399]/80" />
                  <CardBody>
                    <div className="space-y-3">
                      <Toggle
                        checked={form.shuffle_questions}
                        onChange={v => set('shuffle_questions', v)}
                        label="Shuffle Questions"
                        desc="Questions appear in a different random order for each student"
                      />
                      <Toggle
                        checked={form.camera_proctoring_enabled}
                        onChange={v => set('camera_proctoring_enabled', v)}
                        label="Camera Proctoring"
                        desc={form.camera_proctoring_enabled
                          ? 'ON — students must allow camera; AI detects face violations'
                          : 'OFF — only tab-switch, fullscreen, and copy-paste proctoring runs'}
                      />
                    </div>

                    <div className="flex items-start gap-3 bg-[#003399]/5 border border-[#003399]/20 rounded-xl px-4 py-3 text-sm text-[#003399] mt-3">
                      <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#003399]/40" />
                      <span>
                        The <strong>default coding language</strong> is configured per-question when you add
                        coding questions in Step 3 (Question Manager).
                      </span>
                    </div>
                  </CardBody>
                </Card>

              </div>
            </div>

            {/* ── Info tip ── */}
            <div className="flex items-start gap-3 bg-[#003399]/5 border border-[#003399]/20 rounded-2xl px-4 py-4 text-sm text-[#003399]">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#003399]/40" />
              <span>
                After saving, you'll go to the <strong>Section Manager</strong> to divide this assessment
                into Coding &amp; Quiz sections. The assessment starts as a <strong>Draft</strong> — it
                won't be visible to students until you publish it.
              </span>
            </div>

            {/* ── Action buttons ── */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pb-6">
              <button type="button"
                onClick={() => navigate('/dashboard/college-admin/assessments')}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-slate-50 text-sm font-bold transition-all shadow-sm w-full sm:w-auto">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#003399] text-white rounded-xl shadow-sm shadow-blue-200 hover:bg-[#003399] text-sm font-bold disabled:opacity-50 transition-colors w-full sm:w-auto">
                {saving
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Save className="w-4 h-4" />}
                {saving ? 'Saving…' : isEdit ? 'Update & Go to Sections' : 'Save & Setup Sections'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </CollegeAdminLayout>
  );
};

export default AssessmentForm;