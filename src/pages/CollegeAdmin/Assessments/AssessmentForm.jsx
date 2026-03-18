// pages/CollegeAdmin/Assessments/AssessmentForm.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ChevronLeft, Save, BookOpen, AlertCircle, CheckCircle2,
  Clock, Calendar, Tag, Info, Link2, ClipboardList,
  Sparkles, SquarePen, Type, Hash, Eye, Shuffle,
  Award,
} from 'lucide-react';
import CollegeAdminLayout from '../../../components/layout/CollegeAdminLayout';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { assessmentAPI, jobAPI } from '../../../api/Api';

const INITIAL_FORM = {
  title: '',
  level: 'Beginner',
  source_type: 'college_admin_manual',
  duration_minutes: 60,
  scheduled_date: '',
  start_time: '',
  end_time: '',
  tags: '',
  jd_id: '',
  total_marks: '',
  num_questions: '',
  show_results_to_students: false,
  shuffle_questions: false,
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

  const [form, setForm]     = useState({ ...INITIAL_FORM, source_type: urlSourceType });
  const [jobs, setJobs]     = useState([]);
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
            end_time: a.end_time || '',
            tags: Array.isArray(a.tags) ? a.tags.join(', ') : '',
            jd_id: a.jd_id?._id || a.jd_id || '',
            total_marks: a.total_marks || '',
            num_questions: a.num_questions || '',
            show_results_to_students: a.show_results_to_students ?? false,
            shuffle_questions: a.shuffle_questions ?? false,
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

    if (!form.title.trim()) { setError('Assessment title is required'); return; }
    if (!form.level) { setError('Difficulty level is required'); return; }
    if (!form.total_marks || Number(form.total_marks) < 1) { setError('Total marks is required'); return; }
    if (!form.num_questions || Number(form.num_questions) < 1) { setError('Number of questions is required'); return; }
    if (!form.duration_minutes || Number(form.duration_minutes) < 1) {
      setError('Duration must be at least 1 minute'); return;
    }

    const payload = {
      title: form.title.trim(),
      level: form.level,
      source_type: form.source_type,
      duration_minutes: Number(form.duration_minutes),
      scheduled_date: form.scheduled_date || null,
      start_time: form.start_time || null,
      end_time: form.end_time || null,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      jd_id: form.jd_id || null,
      total_marks: Number(form.total_marks),
      num_questions: Number(form.num_questions),
      show_results_to_students: form.show_results_to_students,
      shuffle_questions: form.shuffle_questions,
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

  if (loading) return (
    <CollegeAdminLayout>
      <div className="flex items-center justify-center py-24"><LoadingSpinner /></div>
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

            {/* Total Marks + Questions count side by side */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Total Marks" required hint="Maximum marks for this assessment">
                <div className="relative">
                  <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="number" min={1} value={form.total_marks}
                    onChange={e => set('total_marks', e.target.value)}
                    placeholder="e.g. 50"
                    className={`${inp} pl-10`} />
                </div>
              </Field>
              <Field label="No. of Questions" required hint="Max questions allowed in this assessment">
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="number" min={1} value={form.num_questions}
                    onChange={e => set('num_questions', e.target.value)}
                    placeholder="e.g. 10"
                    className={`${inp} pl-10`} />
                </div>
              </Field>
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

            <Field label="Scheduled Date" hint="The assessment auto-activates at start time and closes at end time">
              <input type="date" value={form.scheduled_date}
                onChange={e => set('scheduled_date', e.target.value)} className={inp} />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Start Time" hint="Auto-activates at this time">
                <input type="time" value={form.start_time}
                  onChange={e => set('start_time', e.target.value)} className={inp} />
              </Field>
              <Field label="End Time" hint="Assessment closes automatically">
                <input type="time" value={form.end_time}
                  onChange={e => set('end_time', e.target.value)} className={inp} />
              </Field>
            </div>

            {form.scheduled_date && form.start_time && form.end_time && (
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700">
                <Info className="w-3.5 h-3.5 shrink-0" />
                Assessment will auto-activate on <strong className="mx-1">{new Date(form.scheduled_date).toDateString()}</strong>
                at <strong className="mx-1">{form.start_time}</strong> and close at <strong className="mx-1">{form.end_time}</strong>.
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
            <button type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl font-bold text-sm hover:opacity-90 disabled:opacity-60 shadow-md shadow-blue-500/20 transition-all">
              {saving ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving…' : isEdit ? 'Update Assessment' : 'Save & Add Questions'}
            </button>
          </div>
        </form>
      </div>
    </CollegeAdminLayout>
  );
};

export default AssessmentForm;