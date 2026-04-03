// pages/CollegeAdmin/Assessments/AssessmentForm.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ChevronLeft, Save, BookOpen, AlertCircle, CheckCircle2,
  Clock, Calendar, Tag, Info, Link2, ClipboardList,
  Sparkles, SquarePen, Type, Hash, Eye, Shuffle,
  Award, Code2,
} from 'lucide-react';
import CollegeAdminLayout from '../../../components/layout/CollegeAdminLayout';
import { InlineSkeleton } from '../../../components/common/SkeletonLoader';
import { assessmentAPI, jobAPI } from '../../../api/Api';

const INITIAL_FORM = {
  title: '',
  level: 'Beginner',
  source_type: 'college_admin_manual',
  duration_minutes: 60,
  scheduled_date: '',
  start_time: '',
  end_date: '',
  end_time: '',
  tags: '',
  jd_id: '',
  num_questions: '',
  marks_per_question: '',
  total_marks: '',       // auto-calculated: num_questions × marks_per_question
  show_results_to_students: false,
  shuffle_questions: false,
  default_coding_language: 'python',  // college admin sets default; students can override
};

const inp = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white/80 backdrop-blur transition-all";

const Section = ({ icon: Icon, title, children }) => (
  <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm overflow-hidden">
    <div className="px-5 py-3 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-100 flex items-center gap-2">
      <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
        <Icon className="w-3 h-3 text-white" />
      </div>
      <h2 className="font-bold text-gray-800 text-sm">{title}</h2>
    </div>
    <div className="p-5 space-y-5">{children}</div>
  </div>
);

const Field = ({ label, children, required, hint }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
    {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
  </div>
);

const Toggle = ({ checked, onChange, label, desc }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 transition-all text-left
      ${checked ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white/60 hover:border-gray-300'}`}
  >
    <div className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0
      ${checked ? 'bg-gradient-to-r from-blue-600 to-cyan-500' : 'bg-gray-200'}`}>
      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform
        ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
    </div>
    <div>
      <p className={`text-sm font-bold ${checked ? 'text-blue-700' : 'text-gray-600'}`}>{label}</p>
      {desc && <p className="text-xs text-gray-400">{desc}</p>}
    </div>
  </button>
);

const AssessmentForm = () => {
  const navigate = useNavigate();
  const { assessmentId } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = !!assessmentId;

  // source_type comes from URL param when creating new
  const urlSourceType = searchParams.get('type') || 'college_admin_manual';

  const [form, setForm]       = useState({ ...INITIAL_FORM, source_type: urlSourceType });
  const [jobs, setJobs]       = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    jobAPI.getAllJobs({ limit: 100 })
      .then(res => { if (res.success) setJobs(res.jobs || res.data || []); })
      .catch(() => {});
  }, []);

  // When JD changes, auto-fill title if blank
  const handleJdChange = (jdId) => {
    const job = jobs.find(j => j._id === jdId);
    setForm(prev => ({
      ...prev,
      jd_id: jdId,
      title: prev.title || (job?.jobTitle ?? ''),
    }));
  };

  useEffect(() => {
    if (!isEdit) return;
    const load = async () => {
      try {
        const res = await assessmentAPI.getAssessment(assessmentId);
        if (res.success) {
          const a = res.assessment;
          setForm({
            title: a.title || '',
            level: a.level || 'Beginner',
            source_type: a.source_type || 'college_admin_manual',
            duration_minutes: a.duration_minutes || 60,
            scheduled_date: a.scheduled_date ? new Date(a.scheduled_date).toISOString().split('T')[0] : '',
            start_time: a.start_time || '',
            end_date: a.end_date ? new Date(a.end_date).toISOString().split('T')[0] : '',
            end_time: a.end_time || '',
            tags: Array.isArray(a.tags) ? a.tags.join(', ') : '',
            jd_id: a.jd_id?._id || a.jd_id || '',
            num_questions: a.num_questions || '',
            marks_per_question: a.num_questions && a.total_marks
              ? String(a.total_marks / a.num_questions)
              : '',
            total_marks: a.total_marks || '',
            show_results_to_students: a.show_results_to_students ?? false,
            shuffle_questions: a.shuffle_questions ?? false,
            default_coding_language: a.default_coding_language || 'python',
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

  // Auto-calculate total_marks whenever num_questions or marks_per_question changes
  const set = (field, value) => setForm(prev => {
    const updated = { ...prev, [field]: value };
    const nq  = parseFloat(field === 'num_questions'      ? value : updated.num_questions)      || 0;
    const mpq = parseFloat(field === 'marks_per_question' ? value : updated.marks_per_question) || 0;
    if (nq > 0 && mpq > 0) updated.total_marks = String(nq * mpq);
    return updated;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (!form.title.trim())                                  { setError('Assessment title is required'); return; }
    if (!form.level)                                         { setError('Difficulty level is required'); return; }
    if (!form.total_marks || Number(form.total_marks) < 1)  { setError('Total marks is required'); return; }
    if (!form.num_questions || Number(form.num_questions) < 1) { setError('Number of questions is required'); return; }
    if (!form.duration_minutes || Number(form.duration_minutes) < 1) {
      setError('Duration must be at least 1 minute'); return;
    }

    const payload = {
      title:                    form.title.trim(),
      level:                    form.level,
      source_type:              form.source_type,
      duration_minutes:         Number(form.duration_minutes),
      scheduled_date:           form.scheduled_date || null,
      start_time:               form.start_time     || null,
      end_date:                 form.end_date        || null,
      end_time:                 form.end_time        || null,
      tags:                     form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      jd_id:                    form.jd_id || null,
      total_marks:              Number(form.total_marks),
      num_questions:            Number(form.num_questions),
      show_results_to_students: form.show_results_to_students,
      shuffle_questions:        form.shuffle_questions,
      default_coding_language:  form.default_coding_language || 'python',
    };

    setSaving(true);
    try {
      const res = isEdit
        ? await assessmentAPI.updateAssessment(assessmentId, payload)
        : await assessmentAPI.createAssessment(payload);

      if (res.success) {
        const id = res.assessment?._id || assessmentId;
        setSuccess(isEdit ? 'Updated successfully!' : 'Created! Now add questions.');
        // Pass ?new=1 only on first creation so QuestionManager shows the "Create Assessment" button
        setTimeout(() => navigate(`/dashboard/college-admin/assessments/${id}/questions${isEdit ? '' : '?new=1'}`), 800);
      } else {
        setError(res.message || 'Operation failed');
      }
    } catch (err) {
      setError(err.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  // FIX: fullScreen={false} prevents the full-screen gradient box artifact
  // inside CollegeAdminLayout
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
      <div className="space-y-5 pb-8 w-full">

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
          <div className="relative flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center border border-white/20 flex-shrink-0">
              {isAI ? <Sparkles className="w-5 h-5 text-white" /> : (isEdit ? <SquarePen className="w-5 h-5 text-white" /> : <ClipboardList className="w-5 h-5 text-white" />)}
            </div>
            <div>
              <h1 className="text-white font-black text-lg leading-tight">
                {isEdit ? 'Edit Assessment' : isAI ? 'New AI-Generated Assessment' : 'New Manual Assessment'}
              </h1>
              <p className="text-blue-200 text-xs mt-0.5">
                {isEdit ? 'Update assessment settings' : 'Fill in details — questions come next'}
              </p>
            </div>
            {!isEdit && (
              <div className={`ml-auto px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 border
                ${isAI ? 'bg-violet-500/20 border-violet-300/30 text-violet-100' : 'bg-white/20 border-white/20 text-white'}`}>
                {isAI ? <><Sparkles className="w-3 h-3" /> AI Generated</> : <><SquarePen className="w-3 h-3" /> Manual</>}
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Alerts */}
          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <pre className="whitespace-pre-wrap font-sans">{error}</pre>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4 text-blue-700 text-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0" /> {success}
            </div>
          )}

          {/* Assessment Info */}
          <Section icon={BookOpen} title="Assessment Details">

            {/* Title */}
            <Field label="Assessment Title" required
              hint={form.jd_id ? 'Auto-filled from the linked Job Description — you can override it' : 'Give a clear name for this assessment'}>
              <div className="relative">
                <Type className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={form.title}
                  onChange={e => set('title', e.target.value)}
                  placeholder={form.jd_id ? 'Auto-filled from JD…' : 'e.g. React Fundamentals Assessment'}
                  className={`${inp} pl-10`}
                />
              </div>
            </Field>

            {/* JD Link */}
            <Field label="Link to Job Description (optional)" hint="Linking a JD auto-assigns eligible students and sets the title">
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
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

            {/* Level */}
            <Field label="Difficulty Level" required>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'Beginner',     color: 'border-cyan-400 bg-cyan-50 text-cyan-700' },
                  { value: 'Intermediate', color: 'border-blue-400 bg-blue-50 text-blue-700' },
                  { value: 'Advanced',     color: 'border-indigo-400 bg-indigo-50 text-indigo-700' },
                ].map(({ value, color }) => (
                  <label key={value} className={`cursor-pointer text-center px-4 py-3 rounded-xl border-2 transition-all
                    ${form.level === value ? color + ' font-bold shadow-sm' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                    <input type="radio" name="level" value={value} checked={form.level === value}
                      onChange={() => set('level', value)} className="sr-only" />
                    <span className="text-sm">{value}</span>
                  </label>
                ))}
              </div>
            </Field>

            {/* Questions + Marks per question → auto total */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="No. of Questions" required hint="Total number of questions in the assessment">
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="number" min={1} value={form.num_questions}
                    onChange={e => set('num_questions', e.target.value)}
                    placeholder="e.g. 10"
                    className={`${inp} pl-10`} />
                </div>
              </Field>
              <Field label="Marks per Question" required hint="Each question carries equal marks">
                <div className="relative">
                  <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="number" min={0.5} step={0.5} value={form.marks_per_question}
                    onChange={e => set('marks_per_question', e.target.value)}
                    placeholder="e.g. 5"
                    className={`${inp} pl-10`} />
                </div>
              </Field>
            </div>

            {/* Auto-calculated Total Marks */}
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all
              ${form.total_marks ? 'border-blue-200 bg-blue-50' : 'border-gray-100 bg-gray-50'}`}>
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Award className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Total Marks (Auto-calculated)</p>
                <p className={`text-xl font-black ${form.total_marks ? 'text-blue-700' : 'text-gray-300'}`}>
                  {form.total_marks
                    ? `${form.total_marks} marks`
                    : 'Enter questions & marks per question above'}
                </p>
                {form.num_questions && form.marks_per_question && (
                  <p className="text-[11px] text-blue-500 font-medium mt-0.5">
                    {form.num_questions} questions × {form.marks_per_question} marks = {form.total_marks}
                  </p>
                )}
              </div>
            </div>

            {/* Tags */}
            <Field label="Tags" hint="Comma-separated — e.g. frontend, javascript, react">
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" value={form.tags} onChange={e => set('tags', e.target.value)}
                  placeholder="react, hooks, components" className={`${inp} pl-10`} />
              </div>
            </Field>
          </Section>

          {/* Schedule */}
          <Section icon={Calendar} title="Schedule & Duration">
            <Field label="Duration (minutes)" required>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="number" min={1} max={600} value={form.duration_minutes}
                  onChange={e => set('duration_minutes', e.target.value)} className={`${inp} pl-10`} />
              </div>
            </Field>

            {/* Start date + End date */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Start Date" hint="Assessment opens on this date">
                <input type="date" value={form.scheduled_date}
                  onChange={e => set('scheduled_date', e.target.value)} className={inp} />
              </Field>
              <Field label="End Date" hint="Assessment closes on this date">
                <input type="date" value={form.end_date}
                  min={form.scheduled_date || undefined}
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
              <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                  Starts: <strong>{new Date(form.scheduled_date).toDateString()}</strong> at <strong>{form.start_time}</strong>
                  {form.end_date && form.end_time && (
                    <> &nbsp;·&nbsp; Ends: <strong>{new Date(form.end_date).toDateString()}</strong> at <strong>{form.end_time}</strong></>
                  )}
                </span>
              </div>
            )}
          </Section>

          {/* Settings */}
          <Section icon={Eye} title="Assessment Settings">
            <div className="space-y-3">
              <Toggle
                checked={form.shuffle_questions}
                onChange={v => set('shuffle_questions', v)}
                label="Shuffle Questions"
                desc="Questions appear in a different random order for each student"
              />
            </div>

            {/* Default coding language */}
            <Field
              label="Default Coding Language"
              hint="Students start with this language pre-selected in the code editor. They can still switch to any other language during the assessment."
            >
              <div className="relative">
                <Code2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={form.default_coding_language}
                  onChange={e => set('default_coding_language', e.target.value)}
                  className={`${inp} pl-10`}
                >
                  <option value="python">Python 3</option>
                  <option value="javascript">JavaScript (Node.js)</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++ (GCC)</option>
                  <option value="c">C (GCC)</option>
                </select>
              </div>
            </Field>
          </Section>

          {/* Info tip */}
          <div className="flex items-start gap-3 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
            <span>
              After saving, you'll be taken to the <strong>Question Manager</strong>.
              The assessment starts as a <strong>Draft</strong> — preview it before scheduling.
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button type="button" onClick={() => navigate('/dashboard/college-admin/assessments')}
              className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold text-sm transition-all bg-white/80">
              Cancel
            </button>
            {/* FIX: replaced <LoadingSpinner size="sm" /> (unsupported prop, causes box artifact)
                with an inline CSS spinner that stays contained within the button */}
            <button type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl font-bold text-sm hover:opacity-90 disabled:opacity-60 shadow-md shadow-blue-500/20 transition-all">
              {saving
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Save className="w-4 h-4" />}
              {saving ? 'Saving…' : isEdit ? 'Update Assessment' : 'Save & Add Questions'}
            </button>
          </div>
        </form>
      </div>
    </CollegeAdminLayout>
  );
};

export default AssessmentForm;