// pages/CollegeAdmin/Assessments/AssessmentForm.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft, Save, BookOpen, AlertCircle, CheckCircle2,
  Clock, Calendar, Tag, Info, Link2, ClipboardList,
  Sparkles, SquarePen,
} from 'lucide-react';
import CollegeAdminLayout from '../../../components/layout/CollegeAdminLayout';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { assessmentAPI, jobAPI } from '../../../api/Api';

const INITIAL_FORM = {
  level: 'Beginner',
  source_type: 'college_admin_manual',
  status: 'active',
  duration_minutes: 60,
  scheduled_date: '',
  start_time: '',
  end_time: '',
  tags: '',
  jd_id: '',
};

/* ─── Shared input class ─────────────────────────────────────────────── */
const inp = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white/80 backdrop-blur transition-all";

/* ─── Section card ───────────────────────────────────────────────────── */
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

/* ─── Form field ─────────────────────────────────────────────────────── */
const Field = ({ label, children, required, hint }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
    {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
  </div>
);

/* ══════════════════════════════════════════════════════════════════════ */
const AssessmentForm = () => {
  const navigate = useNavigate();
  const { assessmentId } = useParams();
  const isEdit = !!assessmentId;

  const [form,   setForm]   = useState(INITIAL_FORM);
  const [jobs,   setJobs]   = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    jobAPI.getAllJobs({ limit: 100 }).then(res => { if (res.success) setJobs(res.jobs || res.data || []); }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    const load = async () => {
      try {
        const res = await assessmentAPI.getAssessment(assessmentId);
        if (res.success) {
          const a = res.assessment;
          setForm({
            level: a.level || 'Beginner',
            source_type: a.source_type || 'college_admin_manual',
            status: a.status || 'active',
            duration_minutes: a.duration_minutes || 60,
            scheduled_date: a.scheduled_date ? new Date(a.scheduled_date).toISOString().split('T')[0] : '',
            start_time: a.start_time || '',
            end_time: a.end_time || '',
            tags: Array.isArray(a.tags) ? a.tags.join(', ') : '',
            jd_id: a.jd_id?._id || a.jd_id || '',
          });
        } else { setError(res.message || 'Failed to load assessment'); }
      } catch (err) { setError(err.message || 'Failed to load'); }
      finally { setLoading(false); }
    };
    load();
  }, [assessmentId, isEdit]);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.level) { setError('Level is required'); return; }
    if (!form.duration_minutes || Number(form.duration_minutes) < 1) { setError('Duration must be at least 1 minute'); return; }

    const payload = {
      level: form.level, source_type: form.source_type, status: form.status,
      duration_minutes: Number(form.duration_minutes),
      scheduled_date: form.scheduled_date || null,
      start_time: form.start_time || null, end_time: form.end_time || null,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      jd_id: form.jd_id || null,
    };

    setSaving(true);
    try {
      const res = isEdit
        ? await assessmentAPI.updateAssessment(assessmentId, payload)
        : await assessmentAPI.createAssessment(payload);
      if (res.success) {
        const id = res.assessment?._id || assessmentId;
        setSuccess(isEdit ? 'Updated successfully!' : 'Created! Now add questions.');
        setTimeout(() => navigate(`/dashboard/college-admin/assessments/${id}/questions`), 800);
      } else { setError(res.message || 'Operation failed'); }
    } catch (err) { setError(err.message || 'Operation failed'); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <CollegeAdminLayout>
      <div className="flex items-center justify-center py-24"><LoadingSpinner /></div>
    </CollegeAdminLayout>
  );

  return (
    <CollegeAdminLayout>
      <div className="max-w-3xl mx-auto space-y-5 pb-8">

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
              {isEdit ? <SquarePen className="w-5 h-5 text-white" /> : <ClipboardList className="w-5 h-5 text-white" />}
            </div>
            <div>
              <h1 className="text-white font-black text-lg leading-tight">
                {isEdit ? 'Edit Assessment' : 'Create Assessment'}
              </h1>
              <p className="text-blue-200 text-xs mt-0.5">
                {isEdit ? 'Update assessment settings and schedule' : 'Set up a new skill assessment for students'}
              </p>
            </div>
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

          {/* Assessment Details */}
          <Section icon={BookOpen} title="Assessment Details">

            {/* Level */}
            <Field label="Difficulty Level" required>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'Beginner',     color: 'border-cyan-400 bg-cyan-50 text-cyan-700'   },
                  { value: 'Intermediate', color: 'border-blue-400 bg-blue-50 text-blue-700'   },
                  { value: 'Advanced',     color: 'border-indigo-400 bg-indigo-50 text-indigo-700' },
                ].map(({ value, color }) => (
                  <label key={value} className={`cursor-pointer text-center px-4 py-3 rounded-xl border-2 transition-all
                    ${form.level === value ? color + ' font-bold shadow-sm' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                    <input type="radio" name="level" value={value} checked={form.level === value} onChange={() => set('level', value)} className="sr-only" />
                    <span className="text-sm">{value}</span>
                  </label>
                ))}
              </div>
            </Field>

            {/* Source Type */}
            <Field label="Source Type" hint="How this assessment was created">
              <select value={form.source_type} onChange={e => set('source_type', e.target.value)} className={inp}>
                <option value="college_admin_manual">College Admin — Manual</option>
                <option value="college_admin_ai">College Admin — AI Generated</option>
                <option value="student_skill_based">Student Skill Based</option>
              </select>
            </Field>

            {/* JD Link */}
            <Field label="Link to Job Description (optional)" hint="Students eligible for this JD will be auto-assigned">
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select value={form.jd_id} onChange={e => set('jd_id', e.target.value)} className={`${inp} pl-10`}>
                  <option value="">— No JD linked —</option>
                  {jobs.map(j => <option key={j._id} value={j._id}>{j.jobTitle}{j.jobCode ? ` (${j.jobCode})` : ''}</option>)}
                </select>
              </div>
            </Field>

            {/* Status */}
            <Field label="Status">
              <div className="flex gap-3">
                {[
                  { value: 'active',   label: 'Active',   desc: 'Visible to students',  color: 'border-blue-400 bg-blue-50' },
                  { value: 'inactive', label: 'Inactive', desc: 'Hidden from students', color: 'border-gray-300 bg-gray-50'  },
                ].map(s => (
                  <label key={s.value} className={`flex-1 cursor-pointer px-4 py-3 rounded-xl border-2 transition-all
                    ${form.status === s.value ? s.color : 'border-gray-200 bg-white/60 hover:border-gray-300'}`}>
                    <input type="radio" name="status" value={s.value} checked={form.status === s.value} onChange={() => set('status', s.value)} className="sr-only" />
                    <p className={`text-sm font-bold ${form.status === s.value ? (s.value === 'active' ? 'text-blue-700' : 'text-gray-600') : 'text-gray-600'}`}>{s.label}</p>
                    <p className="text-xs text-gray-400">{s.desc}</p>
                  </label>
                ))}
              </div>
            </Field>

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

            <Field label="Scheduled Date" hint="Optional — leave blank for on-demand access">
              <input type="date" value={form.scheduled_date} onChange={e => set('scheduled_date', e.target.value)} className={inp} />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Start Time">
                <input type="time" value={form.start_time} onChange={e => set('start_time', e.target.value)} className={inp} />
              </Field>
              <Field label="End Time">
                <input type="time" value={form.end_time} onChange={e => set('end_time', e.target.value)} className={inp} />
              </Field>
            </div>
          </Section>

          {/* Info tip */}
          <div className="flex items-start gap-3 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
            <span>After saving, you'll be taken to the <strong>Question Manager</strong> to add questions. You can also assign students from there.</span>
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
              {saving ? 'Saving…' : isEdit ? 'Update Assessment' : 'Create & Add Questions'}
            </button>
          </div>
        </form>
      </div>
    </CollegeAdminLayout>
  );
};

export default AssessmentForm;