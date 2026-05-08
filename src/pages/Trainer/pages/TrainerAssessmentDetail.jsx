// pages/Trainer/pages/TrainerAssessmentDetail.jsx
// Full editable detail page — edit all fields except course & group (locked once created)
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Layers, BookOpen, BarChart2,
  Clock, Hash, Award, AlertCircle, Users,
  ArrowRight, Tag, Calendar, Info, Eye,
  Save, Loader2, Lock, Type, CheckCircle2,
} from 'lucide-react';
import TrainerDashboardLayout from '../../../components/layout/Trainerdashboardlayout';
import { assessmentAPI } from '../../../api/Api';

/* ─── Style tokens ──────────────────────────────────────────────────── */
const inp =
  'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm ' +
  'focus:outline-none focus:ring-2 focus:ring-[#003399]/30 focus:border-[#003399] ' +
  'bg-white transition-all placeholder:text-slate-400';

const inpLocked =
  'w-full border border-slate-100 rounded-xl px-4 py-2.5 text-sm ' +
  'bg-slate-50 text-slate-400 cursor-not-allowed select-none';

/* ─── Card primitives ───────────────────────────────────────────────── */
const Card = ({ children }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
    {children}
  </div>
);

const CardHead = ({ icon: Icon, title, color = 'from-[#003399] to-[#003399]/80', right }) => (
  <div className={`bg-gradient-to-r ${color} px-5 py-3.5 flex items-center justify-between gap-3`}>
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center border border-white/20 flex-shrink-0">
        <Icon className="w-4 h-4 text-white" />
      </div>
      <h2 className="font-bold text-white text-sm">{title}</h2>
    </div>
    {right}
  </div>
);

const CardBody = ({ children }) => (
  <div className="p-5 space-y-4">{children}</div>
);

const Field = ({ label, children, required, hint, locked }) => (
  <div>
    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
      {label}
      {required && <span className="text-red-500">*</span>}
      {locked && <Lock className="w-2.5 h-2.5 text-slate-300" />}
    </label>
    {children}
    {hint && <p className="text-xs text-slate-400 mt-1 leading-relaxed">{hint}</p>}
  </div>
);

const Toggle = ({ checked, onChange, label, desc, disabled }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={() => !disabled && onChange(!checked)}
    className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 transition-all text-left
      ${disabled ? 'opacity-50 cursor-not-allowed border-gray-100 bg-gray-50'
        : checked ? 'border-[#003399]/40 bg-[#003399]/5' : 'border-gray-200 bg-white hover:border-gray-300'}`}
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

/* ─── Status config ─────────────────────────────────────────────────── */
const STATUS_CONFIG = {
  draft:     { label: 'Draft',     bg: '#FFF7ED', text: '#D97706' },
  scheduled: { label: 'Scheduled', bg: '#F5F3FF', text: '#7C3AED' },
  active:    { label: 'Active',    bg: '#EFF6FF', text: '#003399' },
  completed: { label: 'Completed', bg: '#F0FDF4', text: '#16A34A' },
  cancelled: { label: 'Cancelled', bg: '#FEF2F2', text: '#DC2626' },
};

/* ─── Action Card ───────────────────────────────────────────────────── */
const ActionCard = ({ icon: Icon, title, desc, color, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all group
      ${disabled
        ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
        : `${color.border} bg-white hover:shadow-md hover:-translate-y-0.5`
      }`}
  >
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color.icon}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-black text-gray-800 text-sm">{title}</p>
      <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
    </div>
    {!disabled && (
      <ArrowRight className={`w-4 h-4 flex-shrink-0 text-slate-400 group-hover:translate-x-0.5 transition-transform ${color.arrow}`} />
    )}
  </button>
);

/* ════════════════ MAIN ════════════════ */
const TrainerAssessmentDetail = () => {
  const { assessmentId } = useParams();
  const navigate         = useNavigate();

  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');

  /* edit form */
  const [form, setForm] = useState(null);
  const [saving, setSaving]     = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved]         = useState(false);

  const isEditable = assessment && ['draft', 'scheduled'].includes(assessment.status);

  /* ── Load ── */
  useEffect(() => {
    const load = async () => {
      try {
        const res = await assessmentAPI.getAssessment(assessmentId);
        if (!res.success) throw new Error(res.message || 'Assessment not found');
        const a = res.assessment;
        setAssessment(a);
        setForm({
          title:                    a.title || '',
          level:                    a.level || 'Intermediate',
          total_marks:              a.total_marks ?? '',
          duration_minutes:         a.duration_minutes ?? 60,
          scheduled_date:           a.scheduled_date ? a.scheduled_date.slice(0, 10) : '',
          start_time:               a.start_time || '',
          end_date:                 a.end_date ? a.end_date.slice(0, 10) : '',
          end_time:                 a.end_time || '',
          tags:                     Array.isArray(a.tags) ? a.tags.join(', ') : (a.tags || ''),
          shuffle_questions:        a.shuffle_questions ?? false,
          camera_proctoring_enabled: a.camera_proctoring_enabled ?? true,
        });
      } catch (e) {
        setError(e.message || 'Failed to load assessment');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [assessmentId]);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setSaveError('');
    if (!form.title.trim())              { setSaveError('Assessment title is required.'); return; }
    if (!form.total_marks || Number(form.total_marks) < 1) { setSaveError('Total marks must be at least 1.'); return; }
    if (!form.duration_minutes || Number(form.duration_minutes) < 1) { setSaveError('Duration must be at least 1 minute.'); return; }

    setSaving(true);
    try {
      const payload = {
        title:                     form.title.trim(),
        level:                     form.level,
        total_marks:               Number(form.total_marks),
        duration_minutes:          Number(form.duration_minutes),
        scheduled_date:            form.scheduled_date || null,
        start_time:                form.start_time || null,
        end_date:                  form.end_date || null,
        end_time:                  form.end_time || null,
        tags:                      form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        shuffle_questions:         form.shuffle_questions,
        camera_proctoring_enabled: form.camera_proctoring_enabled,
      };
      const res = await assessmentAPI.updateAssessment(assessmentId, payload);
      if (!res.success) throw new Error(res.message || 'Failed to save changes');
      setAssessment(prev => ({ ...prev, ...payload }));
      setSaved(true);
      // Navigate to Sections page (next wizard step) after a brief success flash
      setTimeout(() => {
        navigate(`/dashboard/trainer/assessments/${assessmentId}/sections`);
      }, 800);
    } catch (e) {
      setSaveError(e.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  /* ── Loading / error states ── */
  if (loading) return (
    <TrainerDashboardLayout>
      <div className="max-w-4xl mx-auto py-16 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#003399] border-t-transparent rounded-full animate-spin" />
      </div>
    </TrainerDashboardLayout>
  );

  if (error) return (
    <TrainerDashboardLayout>
      <div className="max-w-4xl mx-auto py-10">
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-5 text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0" /> {error}
        </div>
      </div>
    </TrainerDashboardLayout>
  );

  const questionCount = assessment?.questions_id?.length ?? assessment?.num_questions ?? 0;
  const totalMarks    = assessment?.total_marks ?? 0;
  const duration      = assessment?.duration_minutes ?? 0;
  const studentCount  = assessment?.eligible_students?.length ?? 0;
  const statusCfg     = STATUS_CONFIG[assessment.status] || STATUS_CONFIG.draft;

  const courseName = assessment.course_id?.title || assessment.course_id || '—';
  const groupName  = assessment.group_id?.name   || assessment.group_id   || '—';

  return (
    <TrainerDashboardLayout>
      <div className="max-w-4xl mx-auto space-y-5 py-2 px-2">

        {/* Back */}
        <button
          onClick={() => navigate('/dashboard/trainer/assessments')}
          className="flex items-center gap-1.5 text-gray-500 hover:text-[#003399] text-sm font-semibold transition-colors group">
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Assessments
        </button>

        {/* Hero banner */}
        <div className="relative bg-gradient-to-r from-[#003399] via-[#003399]/80 to-[#00A9CE] rounded-2xl px-6 py-5 shadow-lg overflow-hidden">
          <div className="absolute inset-0 opacity-[0.06]"
            style={{ backgroundImage: 'radial-gradient(circle,white 1px,transparent 1px)', backgroundSize: '18px 18px' }} />
          <div className="relative flex items-start justify-between gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full"
                  style={{ backgroundColor: statusCfg.bg, color: statusCfg.text }}>
                  {statusCfg.label}
                </span>
                {assessment.level && <span className="text-[11px] font-bold text-white/60">{assessment.level}</span>}
              </div>
              <h1 className="text-white font-black text-xl leading-tight">
                {assessment.title || 'Untitled Assessment'}
              </h1>
              <div className="flex flex-wrap gap-4 mt-3">
                {[
                  { icon: Hash,  val: questionCount, label: 'Questions' },
                  { icon: Award, val: totalMarks,    label: 'Marks' },
                  { icon: Clock, val: duration ? `${duration} min` : '—', label: 'Duration' },
                  { icon: Users, val: studentCount,  label: 'Students' },
                ].map(({ icon: Icon, val, label }) => (
                  <div key={label} className="flex items-center gap-2 text-white/80">
                    <Icon className="w-4 h-4 text-white/40" />
                    <span className="text-sm font-bold text-white">{val}</span>
                    <span className="text-xs text-white/50">{label}</span>
                  </div>
                ))}
              </div>
            </div>
            {!isEditable && (
              <div className="flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-xs font-bold text-white/70">
                <Lock className="w-3 h-3" /> Read-only
              </div>
            )}
          </div>
        </div>

        {/* Locked warning for non-editable states */}
        {!isEditable && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-amber-700 text-sm">
            <Lock className="w-4 h-4 shrink-0" />
            <span>
              This assessment is <strong>{statusCfg.label}</strong> — details are locked.
              Only draft and scheduled assessments can be edited.
            </span>
          </div>
        )}

        {saved && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-4 py-3 text-green-700 text-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Changes saved successfully!</span>
          </div>
        )}

        {/* ════ EDIT FORM ════ */}
        <div>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">
            Assessment Details {isEditable ? '— Editable' : '— View Only'}
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* LEFT */}
            <div className="space-y-4">

              {/* Locked: Course & Group */}
              <Card>
                <CardHead icon={Lock} title="Course & Group" color="from-slate-500 to-slate-400"
                  right={
                    <span className="text-[10px] font-bold text-white/60 flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> Locked after creation
                    </span>
                  }
                />
                <CardBody>
                  <Field label="Course" locked>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                      <input type="text" value={courseName} readOnly className={`${inpLocked} pl-10`} />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Course cannot be changed after creation.</p>
                  </Field>
                  <Field label="Group" locked>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                      <input type="text" value={groupName} readOnly className={`${inpLocked} pl-10`} />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Group cannot be changed after creation.</p>
                  </Field>
                </CardBody>
              </Card>

              {/* Editable: Assessment Details */}
              <Card>
                <CardHead icon={BookOpen} title="Assessment Details" />
                <CardBody>

                  <Field label="Assessment Title" required>
                    <div className="relative">
                      <Type className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                      <input type="text" value={form.title} disabled={!isEditable}
                        onChange={e => set('title', e.target.value)}
                        placeholder="e.g. React Fundamentals — Batch 2025"
                        className={`${isEditable ? inp : inpLocked} pl-10`} />
                    </div>
                  </Field>

                  <Field label="Difficulty Level" required>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'Beginner',     sel: 'border-emerald-400 bg-emerald-50 text-emerald-700 ring-emerald-300' },
                        { value: 'Intermediate', sel: 'border-[#003399]/40 bg-[#003399]/5 text-[#003399] ring-[#003399]/30' },
                        { value: 'Advanced',     sel: 'border-violet-400 bg-violet-50 text-violet-700 ring-violet-300' },
                      ].map(({ value, sel }) => (
                        <label key={value}
                          className={`cursor-pointer text-center px-3 py-2.5 text-xs rounded-xl border-2 font-bold transition-all
                            ${!isEditable ? 'cursor-not-allowed opacity-60' : ''}
                            ${form.level === value ? `${sel} ring-2` : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'}`}>
                          <input type="radio" name="level" value={value} checked={form.level === value}
                            disabled={!isEditable}
                            onChange={() => isEditable && set('level', value)} className="sr-only" />
                          {value}
                        </label>
                      ))}
                    </div>
                  </Field>

                  <Field label="Tags" hint="Comma-separated — e.g. frontend, javascript, react">
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                      <input type="text" value={form.tags} disabled={!isEditable}
                        onChange={e => set('tags', e.target.value)}
                        placeholder="react, hooks, components"
                        className={`${isEditable ? inp : inpLocked} pl-10`} />
                    </div>
                  </Field>
                </CardBody>
              </Card>

              {/* Editable: Overall Marks */}
              <Card>
                <CardHead icon={Award} title="Overall Marks" color="from-[#003399] to-[#00A9CE]" />
                <CardBody>
                  <Field label="Total Marks" required hint="Marks are distributed across sections in the Section Manager.">
                    <div className="relative">
                      <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                      <input type="number" min={1} value={form.total_marks} disabled={!isEditable}
                        onChange={e => set('total_marks', e.target.value)}
                        placeholder="e.g. 100"
                        className={`${isEditable ? inp : inpLocked} pl-10`} />
                    </div>
                  </Field>
                </CardBody>
              </Card>
            </div>

            {/* RIGHT */}
            <div className="space-y-4">

              {/* Editable: Schedule & Duration */}
              <Card>
                <CardHead icon={Calendar} title="Schedule & Duration" color="from-[#00A9CE] to-[#003399]" />
                <CardBody>

                  <Field label="Duration (minutes)" required>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                      <input type="number" min={1} max={600} value={form.duration_minutes} disabled={!isEditable}
                        onChange={e => set('duration_minutes', e.target.value)}
                        className={`${isEditable ? inp : inpLocked} pl-10`} />
                    </div>
                  </Field>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Start Date" hint="Assessment opens">
                      <input type="date" value={form.scheduled_date} disabled={!isEditable}
                        onChange={e => set('scheduled_date', e.target.value)}
                        className={isEditable ? inp : inpLocked} />
                    </Field>
                    <Field label="End Date" hint="Assessment closes">
                      <input type="date" value={form.end_date} disabled={!isEditable}
                        min={form.scheduled_date || undefined}
                        onChange={e => set('end_date', e.target.value)}
                        className={isEditable ? inp : inpLocked} />
                    </Field>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Start Time" hint="Auto-activates">
                      <input type="time" value={form.start_time} disabled={!isEditable}
                        onChange={e => set('start_time', e.target.value)}
                        className={isEditable ? inp : inpLocked} />
                    </Field>
                    <Field label="End Time" hint="Closes at this time">
                      <input type="time" value={form.end_time} disabled={!isEditable}
                        onChange={e => set('end_time', e.target.value)}
                        className={isEditable ? inp : inpLocked} />
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

                  {!form.scheduled_date && isEditable && (
                    <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800">
                      <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />
                      <span>Set start date &amp; time to enable the <strong>Schedule</strong> transition.</span>
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* Editable: Settings */}
              <Card>
                <CardHead icon={Eye} title="Assessment Settings" />
                <CardBody>
                  <div className="space-y-3">
                    <Toggle
                      checked={form.shuffle_questions}
                      onChange={v => set('shuffle_questions', v)}
                      label="Shuffle Questions"
                      desc="Questions appear in a different random order for each student"
                      disabled={!isEditable}
                    />
                    <Toggle
                      checked={form.camera_proctoring_enabled}
                      onChange={v => set('camera_proctoring_enabled', v)}
                      label="Camera Proctoring"
                      desc="Enables webcam monitoring during the assessment"
                      disabled={!isEditable}
                    />
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>

          {/* Save button */}
          {isEditable && (
            <div className="mt-4">
              {saveError && (
                <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-xs text-rose-700 mb-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{saveError}</span>
                </div>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #003399, #00A9CE)' }}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>

      </div>
    </TrainerDashboardLayout>
  );
};

export default TrainerAssessmentDetail;