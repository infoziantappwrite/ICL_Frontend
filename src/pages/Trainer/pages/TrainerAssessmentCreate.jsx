// src/pages/Trainer/pages/TrainerAssessmentCreate.jsx
// Trainer creates a trainer_manual assessment:
//   Step 1 — Course & Group
//   Step 2 — Assessment Details (rich form matching CollegeAdmin)
//   → On save redirects to Section Manager → Question Manager → Review & Publish
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, ClipboardList, BookOpen, Users,
  AlertCircle, CheckCircle2, Loader2, Clock, Award,
  Tag, Calendar, Info, Eye, Layers, Save, Type,
} from 'lucide-react';
import TrainerDashboardLayout from '../../../components/layout/Trainerdashboardlayout';
import { trainerAPI, assessmentAPI } from '../../../api/Api';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';

/* ─── Constants ─────────────────────────────────────────────────── */
const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

/* ─── Shared Style Tokens ───────────────────────────────────────── */
const inp =
  'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm ' +
  'focus:outline-none focus:ring-2 focus:ring-[#003399]/30 focus:border-[#003399] ' +
  'bg-white transition-all placeholder:text-slate-400';

/* ─── UI Primitives ─────────────────────────────────────────────── */
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
    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
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

/* ─── Step indicator ────────────────────────────────────────────── */
const Steps = ({ current }) => {
  const steps = ['Course & Group', 'Assessment Details'];
  return (
    <div className="flex items-center mb-6">
      {steps.map((label, i) => {
        const idx = i + 1;
        const done   = idx < current;
        const active = idx === current;
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                done   ? 'bg-emerald-500 text-white' :
                active ? 'text-white shadow-lg shadow-blue-200' :
                         'bg-slate-100 text-slate-400'
              }`} style={active ? { background: 'linear-gradient(135deg,#003399,#00A9CE)' } : {}}>
                {done ? <CheckCircle2 className="w-4 h-4" /> : idx}
              </div>
              <span className={`text-[10px] font-black whitespace-nowrap ${active ? 'text-[#003399]' : 'text-slate-400'}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mb-4 rounded-full transition-all ${done ? 'bg-emerald-400' : 'bg-slate-100'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════ */
const TrainerAssessmentCreate = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast    = useToast();

  const [step, setStep] = useState(1);

  /* ── Step 1 state ────────────────────────────────────────────── */
  const [courses, setCourses]           = useState([]);
  const [groups, setGroups]             = useState([]);
  const [modules, setModules]           = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedGroup, setSelectedGroup]   = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingGroups, setLoadingGroups]   = useState(false);
  const [step1Error, setStep1Error]     = useState('');

  /* ── Step 2 state ────────────────────────────────────────────── */
  const [form, setForm] = useState({
    title:                    '',
    level:                    'Intermediate',
    total_marks:              '',
    duration_minutes:         60,
    scheduled_date:           '',
    start_time:               '',
    end_date:                 '',
    end_time:                 '',
    tags:                     '',
    shuffle_questions:        false,
    camera_proctoring_enabled: true,
  });
  const [step2Error, setStep2Error] = useState('');
  const [saving, setSaving]         = useState(false);

  /* ── Load courses ── */
  useEffect(() => {
    (async () => {
      try {
        const res  = await trainerAPI.getCourses();
        const list = res?.data || [];
        setCourses(list);
      } catch {
        setStep1Error('Failed to load your courses.');
      } finally {
        setLoadingCourses(false);
      }
    })();
  }, []);

  /* ── Load groups when course changes ── */
  useEffect(() => {
    if (!selectedCourse) { setGroups([]); setSelectedGroup(''); setModules([]); setSelectedModule(''); return; }
    setLoadingGroups(true);
    setSelectedGroup('');
    setSelectedModule('');
    setModules([]);
    setStep1Error('');
    (async () => {
      try {
        const res    = await trainerAPI.getAvailableGroups();
        const all    = res?.groups || [];
        const filtered = all.filter(g =>
          g.course_id && (g.course_id._id || g.course_id) === selectedCourse
        );
        setGroups(filtered);
        if (filtered.length === 0) {
          setStep1Error('No eligible groups found for this course. The course registration must be closed and a group must exist.');
        }
      } catch (e) {
        setStep1Error(e.message || 'Failed to load groups.');
      } finally {
        setLoadingGroups(false);
      }

      // Also fetch curriculum modules for this course
      try {
        const courseRes = await trainerAPI.getCourseById(selectedCourse);
        const curriculum = courseRes?.curriculum || courseRes?.data?.curriculum || [];
        setModules(curriculum);
      } catch {
        // Non-fatal: module selector just won't appear
      }
    })();
  }, [selectedCourse]);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  /* ── Validate step 1 ── */
  const validateStep1 = () => {
    if (!selectedCourse) { setStep1Error('Please select a course.'); return false; }
    if (!selectedGroup)  { setStep1Error('Please select a group.'); return false; }
    setStep1Error('');
    return true;
  };

  /* ── Validate + save step 2 ── */
  const handleSave = async () => {
    setStep2Error('');
    if (!form.title.trim())                              { setStep2Error('Assessment title is required.'); return; }
    if (!form.total_marks || Number(form.total_marks) < 1) { setStep2Error('Total marks must be at least 1.'); return; }
    if (!form.duration_minutes || Number(form.duration_minutes) < 1) { setStep2Error('Duration must be at least 1 minute.'); return; }

    setSaving(true);
    try {
      const payload = {
        source_type:               'trainer_manual',
        trainer_id:                user?.id || user?._id,
        course_id:                 selectedCourse,
        curriculum_id:             selectedModule || null,
        group_id:                  selectedGroup,
        title:                     form.title.trim(),
        level:                     form.level,
        total_marks:               Number(form.total_marks),
        duration_minutes:          Number(form.duration_minutes),
        scheduled_date:            form.scheduled_date  || null,
        start_time:                form.start_time      || null,
        end_date:                  form.end_date        || null,
        end_time:                  form.end_time        || null,
        tags:                      form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        shuffle_questions:         form.shuffle_questions,
        camera_proctoring_enabled: form.camera_proctoring_enabled,
        has_sections:              true,
        show_results_to_students:  false,
      };

      const res = await assessmentAPI.createAssessment(payload);
      if (!res.success) throw new Error(res.message || 'Failed to create assessment');

      const id = res.assessment?._id;
      if (!id) throw new Error('Assessment created but ID not returned.');

      // Auto-assign all students from the selected group immediately.
      // Selecting a group at Step 1 means those students should be enrolled.
      try {
        await assessmentAPI.assignStudentsFromGroup(id, selectedGroup);
      } catch {
        // Non-fatal: assessment is created, group assignment can be retried from QM
      }

      toast.success('Assessment Created!', `"${form.title}" saved as draft — now set up sections.`);
      navigate(`/dashboard/trainer/assessments/${id}/sections`);
    } catch (e) {
      setStep2Error(e.message || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  /* ── Derived UI values ── */
  const selectedCourseName = courses.find(c => c._id === selectedCourse)?.title || '';
  const selectedGroupName  = groups.find(g => g._id === selectedGroup)?.name   || '';
  const selectedModuleName = modules.find(m => m._id === selectedModule)?.module
    || modules.find(m => m._id === selectedModule)?.title || '';

  /* ══════ RENDER ══════ */
  return (
    <TrainerDashboardLayout>
      <div className="w-full py-2 space-y-5">

        {/* Back */}
        <button
          onClick={() => step > 1 ? setStep(s => s - 1) : navigate('/dashboard/trainer/assessments')}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#003399] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          {step > 1 ? 'Back' : 'Back to Assessments'}
        </button>

        {/* Header */}
        <div className="relative rounded-2xl p-5 overflow-hidden" style={{ background: 'linear-gradient(135deg,#003399 0%,#00A9CE 100%)' }}>
          <div className="absolute inset-0 opacity-[0.06]"
            style={{ backgroundImage: 'radial-gradient(circle,white 1px,transparent 1px)', backgroundSize: '18px 18px' }} />
          <div className="relative flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-black text-white">Create Assessment</h1>
              <p className="text-blue-100 text-xs mt-0.5">trainer_manual · course → sections → questions → review</p>
            </div>
          </div>
        </div>

        {/* Steps */}
        <Steps current={step} />

        {/* ─── STEP 1: Course & Group ─── */}
        {step === 1 && (
          <div className="space-y-4">

            {step1Error && (
              <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{step1Error}</span>
              </div>
            )}

            {/* Course selector */}
            <Card>
              <CardHead icon={BookOpen} title="Select Course" />
              <CardBody>
                {loadingCourses ? (
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading courses…
                  </div>
                ) : courses.length === 0 ? (
                  <p className="text-sm text-slate-400">You have no courses assigned yet.</p>
                ) : (
                  <div className="space-y-2">
                    {courses.map(c => {
                      const selected = selectedCourse === c._id;
                      return (
                        <button
                          key={c._id}
                          onClick={() => { setSelectedCourse(c._id); setStep1Error(''); }}
                          className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                            selected
                              ? 'border-[#003399] bg-[#003399]/5 shadow-sm'
                              : 'border-slate-100 hover:border-[#003399]/30 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <p className={`text-sm font-bold ${selected ? 'text-[#003399]' : 'text-slate-800'}`}>
                              {c.title}
                            </p>
                            {selected && <CheckCircle2 className="w-4 h-4 text-[#003399]" />}
                          </div>
                          {c.category && (
                            <p className="text-[11px] text-slate-400 mt-0.5">{c.category}</p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Group selector */}
            {selectedCourse && (
              <Card>
                <CardHead icon={Users} title="Select Group" color="from-[#00A9CE] to-[#003399]" />
                <CardBody>
                  {loadingGroups ? (
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Loader2 className="w-4 h-4 animate-spin" /> Loading groups…
                    </div>
                  ) : groups.length === 0 ? (
                    <div className="text-xs text-slate-500 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                      No eligible groups for this course. Groups become available once course registration is closed.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {groups.map(g => {
                        const selected = selectedGroup === g._id;
                        return (
                          <button
                            key={g._id}
                            onClick={() => { setSelectedGroup(g._id); setStep1Error(''); }}
                            className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                              selected
                                ? 'border-[#003399] bg-[#003399]/5 shadow-sm'
                                : 'border-slate-100 hover:border-[#003399]/30 bg-white'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <p className={`text-sm font-bold ${selected ? 'text-[#003399]' : 'text-slate-800'}`}>
                                {g.name}
                              </p>
                              {selected && <CheckCircle2 className="w-4 h-4 text-[#003399]" />}
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {g.student_count ?? 0} students{g.description ? ` · ${g.description}` : ''}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </CardBody>
              </Card>
            )}

            {/* Module selector (optional) */}
            {selectedCourse && modules.length > 0 && (
              <Card>
                <CardHead icon={Layers} title="Link to Module (Optional)" color="from-slate-500 to-slate-700" />
                <CardBody>
                  <Field label="Curriculum Module" hint="Attach this assessment to a specific module so students can see it in their course view">
                    <select
                      value={selectedModule}
                      onChange={e => setSelectedModule(e.target.value)}
                      className={inp}
                    >
                      <option value="">— No specific module —</option>
                      {modules.map((mod, i) => (
                        <option key={mod._id || i} value={mod._id}>
                          {mod.module || mod.title || `Module ${i + 1}`}
                        </option>
                      ))}
                    </select>
                  </Field>
                </CardBody>
              </Card>
            )}

            <button
              onClick={() => validateStep1() && setStep(2)}
              disabled={!selectedCourse || !selectedGroup}
              className="w-full py-3 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg,#003399,#00A9CE)' }}
            >
              Next: Assessment Details <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ─── STEP 2: Assessment Details ─── */}
        {step === 2 && (
          <div className="space-y-4">

            {/* Selected context strip */}
            <div className="flex items-center gap-3 bg-[#003399]/5 border border-[#003399]/20 rounded-xl px-4 py-3">
              <BookOpen className="w-4 h-4 text-[#003399] flex-shrink-0" />
              <div className="text-xs">
                <span className="font-black text-[#003399]">{selectedCourseName}</span>
                <span className="text-slate-400 mx-1.5">·</span>
                <span className="font-semibold text-slate-600">{selectedGroupName}</span>
                {selectedModuleName && (
                  <>
                    <span className="text-slate-400 mx-1.5">·</span>
                    <span className="font-semibold text-slate-500">📚 {selectedModuleName}</span>
                  </>
                )}
              </div>
              <button onClick={() => setStep(1)}
                className="ml-auto text-[10px] font-bold text-[#003399] hover:underline">
                Change
              </button>
            </div>

            {step2Error && (
              <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{step2Error}</span>
              </div>
            )}

            {/* Two-column on large screens */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

              {/* LEFT */}
              <div className="space-y-4">

                {/* Card: Assessment Details */}
                <Card>
                  <CardHead icon={BookOpen} title="Assessment Details" />
                  <CardBody>

                    <Field label="Assessment Title" required hint="Give a clear, descriptive name">
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

                    <Field label="Tags" hint="Comma-separated — e.g. frontend, javascript, react">
                      <div className="relative">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                        <input type="text" value={form.tags} onChange={e => set('tags', e.target.value)}
                          placeholder="react, hooks, components" className={`${inp} pl-10`} />
                      </div>
                    </Field>
                  </CardBody>
                </Card>

                {/* Card: Overall Marks */}
                <Card>
                  <CardHead icon={Award} title="Overall Marks" color="from-[#003399] to-[#00A9CE]" />
                  <CardBody>
                    <Field label="Total Marks" required
                      hint="You will distribute these marks across sections in the next step.">
                      <div className="relative">
                        <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                        <input type="number" min={1} value={form.total_marks}
                          onChange={e => set('total_marks', e.target.value)}
                          placeholder="e.g. 100" className={`${inp} pl-10`} />
                      </div>
                    </Field>

                    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
                      <Layers className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                      <span>
                        In the <strong>Section Manager</strong>, you'll divide these marks into sections —
                        e.g. 60 marks for Coding + 40 marks for Quiz.
                      </span>
                    </div>
                  </CardBody>
                </Card>
              </div>

              {/* RIGHT */}
              <div className="space-y-4">

                {/* Card: Schedule & Duration */}
                <Card>
                  <CardHead icon={Calendar} title="Schedule & Duration" color="from-[#00A9CE] to-[#003399]" />
                  <CardBody>

                    <Field label="Duration (minutes)" required>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                        <input type="number" min={1} max={600} value={form.duration_minutes}
                          onChange={e => set('duration_minutes', e.target.value)}
                          className={`${inp} pl-10`} />
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
                      <Field label="Start Time" hint="Auto-activates at this time">
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

                {/* Card: Settings */}
                <Card>
                  <CardHead icon={Eye} title="Assessment Settings" />
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
                          ? 'ON — students must allow camera access'
                          : 'OFF — only tab-switch and copy-paste proctoring runs'}
                      />
                    </div>

                    <div className="flex items-start gap-3 bg-[#003399]/5 border border-[#003399]/20 rounded-xl px-4 py-3 text-sm text-[#003399] mt-3">
                      <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#003399]/40" />
                      <span>
                        The <strong>default coding language</strong> is configured per-question in the Question Manager.
                      </span>
                    </div>
                  </CardBody>
                </Card>
              </div>
            </div>

            {/* Next-step hint */}
            <div className="flex items-start gap-3 bg-[#003399]/5 border border-[#003399]/20 rounded-2xl px-4 py-4 text-sm text-[#003399]">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#003399]/40" />
              <span>
                After saving, you'll go to the <strong>Section Manager</strong> to divide this assessment
                into Coding &amp; Quiz sections. The assessment starts as a <strong>Draft</strong> — it
                won't be visible to students until you publish it from the Review page.
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pb-6">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 rounded-2xl text-sm font-black border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
              >
                Back
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#003399,#00A9CE)' }}
              >
                {saving
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Save className="w-4 h-4" />}
                {saving ? 'Creating…' : 'Save & Setup Sections →'}
              </button>
            </div>
          </div>
        )}

      </div>
    </TrainerDashboardLayout>
  );
};

export default TrainerAssessmentCreate;