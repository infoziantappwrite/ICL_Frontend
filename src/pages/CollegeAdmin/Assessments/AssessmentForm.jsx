// pages/CollegeAdmin/Assessments/AssessmentForm.jsx
// Fixed to match backend Assessment model:
//   skill_id (ObjectId ref), level (Beginner|Intermediate|Advanced),
//   source_type (college_admin_manual|college_admin_ai|student_skill_based),
//   status (active|inactive), duration_minutes, scheduled_date, start_time, end_time, tags, jd_id

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft, Save, BookOpen, AlertCircle, CheckCircle2,
  Clock, Calendar, Tag, Info, Link2
} from 'lucide-react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
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

const FormField = ({ label, children, required, hint }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
    {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
  </div>
);

const AssessmentForm = () => {
  const navigate = useNavigate();
  const { assessmentId } = useParams();
  const isEdit = !!assessmentId;

  const [form, setForm] = useState(INITIAL_FORM);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load JDs for the JD-linked dropdown
  useEffect(() => {
    jobAPI.getAllJobs({ limit: 100 })
      .then(res => { if (res.success) setJobs(res.jobs || res.data || []); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    const loadAssessment = async () => {
      try {
        const res = await assessmentAPI.getAssessment(assessmentId);
        if (res.success) {
          const a = res.assessment;
          setForm({
            level: a.level || 'Beginner',
            source_type: a.source_type || 'college_admin_manual',
            status: a.status || 'active',
            duration_minutes: a.duration_minutes || 60,
            scheduled_date: a.scheduled_date
              ? new Date(a.scheduled_date).toISOString().split('T')[0]
              : '',
            start_time: a.start_time || '',
            end_time: a.end_time || '',
            tags: Array.isArray(a.tags) ? a.tags.join(', ') : '',
            jd_id: a.jd_id?._id || a.jd_id || '',
          });
        } else {
          setError(res.message || 'Failed to load assessment');
        }
      } catch (err) {
        setError(err.message || 'Failed to load assessment');
      } finally {
        setLoading(false);
      }
    };
    loadAssessment();
  }, [assessmentId, isEdit]);

  const setField = (field, value) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.level) { setError('Level is required'); return; }
    if (!form.duration_minutes || Number(form.duration_minutes) < 1) {
      setError('Duration must be at least 1 minute'); return;
    }

    // Build payload matching Assessment mongoose schema exactly
    const payload = {
      level: form.level,
      source_type: form.source_type,
      status: form.status,
      duration_minutes: Number(form.duration_minutes),
      scheduled_date: form.scheduled_date || null,
      start_time: form.start_time || null,
      end_time: form.end_time || null,
      tags: form.tags
        ? form.tags.split(',').map(t => t.trim()).filter(Boolean)
        : [],
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
    <DashboardLayout title={isEdit ? 'Edit Assessment' : 'Create Assessment'}>
      <div className="flex items-center justify-center py-24"><LoadingSpinner /></div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout title={isEdit ? 'Edit Assessment' : 'Create Assessment'}>
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/dashboard/college-admin/assessments')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium mb-6"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Assessments
        </button>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* ── Basic Details ───────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <h2 className="font-semibold text-gray-800">Assessment Details</h2>
            </div>

            {error && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <pre className="whitespace-pre-wrap font-sans">{error}</pre>
              </div>
            )}
            {success && (
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4 text-green-700 text-sm">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {success}
              </div>
            )}

            <FormField label="Difficulty Level" required>
              <div className="grid grid-cols-3 gap-3">
                {['Beginner', 'Intermediate', 'Advanced'].map(lvl => (
                  <label
                    key={lvl}
                    className={`cursor-pointer text-center px-4 py-3 rounded-xl border-2 transition-all
                      ${form.level === lvl
                        ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                  >
                    <input
                      type="radio"
                      name="level"
                      value={lvl}
                      checked={form.level === lvl}
                      onChange={() => setField('level', lvl)}
                      className="sr-only"
                    />
                    <span className="text-sm">{lvl}</span>
                  </label>
                ))}
              </div>
            </FormField>

            <FormField
              label="Source Type"
              hint="How this assessment was created"
            >
              <select
                value={form.source_type}
                onChange={e => setField('source_type', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="college_admin_manual">College Admin — Manual</option>
                <option value="college_admin_ai">College Admin — AI Generated</option>
                <option value="student_skill_based">Student Skill Based</option>
              </select>
            </FormField>

            <FormField
              label="Link to Job Description (optional)"
              hint="Students eligible for this JD will be auto-assigned to the assessment"
            >
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={form.jd_id}
                  onChange={e => setField('jd_id', e.target.value)}
                  className="w-full pl-10 pr-4 border border-gray-200 rounded-xl py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">— No JD linked —</option>
                  {jobs.map(j => (
                    <option key={j._id} value={j._id}>
                      {j.jobTitle} {j.jobCode ? `(${j.jobCode})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </FormField>

            <FormField label="Status">
              <div className="flex gap-3">
                {[
                  { value: 'active', label: 'Active', desc: 'Visible to students' },
                  { value: 'inactive', label: 'Inactive', desc: 'Hidden from students' },
                ].map(s => (
                  <label
                    key={s.value}
                    className={`flex-1 cursor-pointer px-4 py-3 rounded-xl border-2 transition-all
                      ${form.status === s.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300'}`}
                  >
                    <input
                      type="radio"
                      name="status"
                      value={s.value}
                      checked={form.status === s.value}
                      onChange={() => setField('status', s.value)}
                      className="sr-only"
                    />
                    <p className={`text-sm font-semibold ${form.status === s.value ? 'text-blue-700' : 'text-gray-700'}`}>
                      {s.label}
                    </p>
                    <p className="text-xs text-gray-500">{s.desc}</p>
                  </label>
                ))}
              </div>
            </FormField>

            <FormField
              label="Tags"
              hint="Comma-separated — e.g. frontend, javascript, react"
            >
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={form.tags}
                  onChange={e => setField('tags', e.target.value)}
                  placeholder="react, hooks, components"
                  className="w-full pl-10 pr-4 border border-gray-200 rounded-xl py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </FormField>
          </div>

          {/* ── Schedule ─────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h2 className="font-semibold text-gray-800">Schedule & Duration</h2>
            </div>

            <FormField label="Duration (minutes)" required>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  min={1}
                  max={600}
                  value={form.duration_minutes}
                  onChange={e => setField('duration_minutes', e.target.value)}
                  className="w-full pl-10 pr-4 border border-gray-200 rounded-xl py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </FormField>

            <FormField
              label="Scheduled Date"
              hint="Optional — leave blank for on-demand access"
            >
              <input
                type="date"
                value={form.scheduled_date}
                onChange={e => setField('scheduled_date', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Start Time">
                <input
                  type="time"
                  value={form.start_time}
                  onChange={e => setField('start_time', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </FormField>
              <FormField label="End Time">
                <input
                  type="time"
                  value={form.end_time}
                  onChange={e => setField('end_time', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </FormField>
            </div>
          </div>

          {/* Info */}
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              After saving, you'll be taken to the <strong>Question Manager</strong> to add questions.
              You can also assign students to this assessment from the Question Manager.
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pb-8">
            <button
              type="button"
              onClick={() => navigate('/dashboard/college-admin/assessments')}
              className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 disabled:opacity-60 shadow transition-all"
            >
              {saving ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : isEdit ? 'Update Assessment' : 'Create & Add Questions'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default AssessmentForm;