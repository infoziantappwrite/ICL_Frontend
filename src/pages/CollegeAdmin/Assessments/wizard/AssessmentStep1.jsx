// src/pages/CollegeAdmin/Assessments/wizard/AssessmentStep1.jsx
import { useAssessmentWizard } from '../../../../hooks/useAssessmentWizard.jsx';
import {
  Type, BookOpen, Users, Calendar, Clock, Tag,
  Eye, ChevronRight, Info,
} from 'lucide-react';

const inp = 'w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003399]/30 focus:border-[#003399] bg-white transition-all placeholder:text-slate-400';

const Field = ({ label, required, hint, error, children }) => (
  <div>
    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
      {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
    {children}
    {hint && !error && <p className="text-xs text-slate-400 mt-1 leading-relaxed">{hint}</p>}
    {error && <p className="text-xs text-rose-500 mt-1 font-semibold">{error}</p>}
  </div>
);

const Toggle = ({ checked, onChange, label, desc }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 transition-all text-left ${
      checked ? 'border-[#003399]/30 bg-[#003399]/5' : 'border-slate-200 bg-white hover:border-slate-300'
    }`}
  >
    <div className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-[#003399]' : 'bg-slate-200'}`}>
      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-transform ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
    </div>
    <div>
      <p className={`text-sm font-bold ${checked ? 'text-[#003399]' : 'text-slate-600'}`}>{label}</p>
      {desc && <p className="text-xs text-slate-400 mt-0.5">{desc}</p>}
    </div>
  </button>
);

const AssessmentStep1 = ({ onNext }) => {
  const { state, setField } = useAssessmentWizard();
  const e = state.errors;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-black text-slate-900">Basic Information</h2>
        <p className="text-sm text-slate-500 mt-0.5">Set the title, subject, schedule, and settings for this assessment.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* LEFT */}
        <div className="space-y-5">

          {/* Assessment Details card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 flex items-center gap-3" style={{ background: 'linear-gradient(135deg, #003399, #00A9CE)' }}>
              <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center border border-white/20">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-bold text-white text-sm">Assessment Details</h3>
            </div>
            <div className="p-5 space-y-4">

              <Field label="Assessment Title" required error={e.title}>
                <div className="relative">
                  <Type className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                  <input
                    type="text"
                    value={state.title}
                    onChange={ev => setField('title', ev.target.value)}
                    placeholder="e.g. React Fundamentals — Batch 2025"
                    className={`${inp} pl-10 ${e.title ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-200' : ''}`}
                  />
                </div>
              </Field>

              <Field label="Subject" required error={e.subject}>
                <div className="relative">
                  <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                  <input
                    type="text"
                    value={state.subject}
                    onChange={ev => setField('subject', ev.target.value)}
                    placeholder="e.g. Computer Science, Mathematics"
                    className={`${inp} pl-10 ${e.subject ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-200' : ''}`}
                  />
                </div>
              </Field>

              <Field label="Class / Section" hint="Optional — specify the batch or section">
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                  <input
                    type="text"
                    value={state.classSection}
                    onChange={ev => setField('classSection', ev.target.value)}
                    placeholder="e.g. CS-A, Batch 2023"
                    className={`${inp} pl-10`}
                  />
                </div>
              </Field>

              <Field label="Difficulty Level" required>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'Beginner',     active: 'border-emerald-400 bg-emerald-50 text-emerald-700 ring-emerald-300' },
                    { value: 'Intermediate', active: 'border-[#003399]/50 bg-[#003399]/5 text-[#003399] ring-[#003399]/20' },
                    { value: 'Advanced',     active: 'border-violet-400 bg-violet-50 text-violet-700 ring-violet-300' },
                  ].map(({ value, active }) => (
                    <label key={value}
                      className={`cursor-pointer text-center px-3 py-2.5 text-xs rounded-xl border-2 font-bold transition-all ${
                        state.level === value ? `${active} ring-2` : 'border-slate-200 text-slate-500 hover:border-slate-300 bg-white'
                      }`}>
                      <input type="radio" name="level" value={value} checked={state.level === value}
                        onChange={() => setField('level', value)} className="sr-only" />
                      {value}
                    </label>
                  ))}
                </div>
              </Field>

              <Field label="Tags" hint="Comma-separated — e.g. frontend, javascript, react">
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                  <input type="text" value={state.tags}
                    onChange={ev => setField('tags', ev.target.value)}
                    placeholder="react, hooks, components"
                    className={`${inp} pl-10`} />
                </div>
              </Field>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-5">

          {/* Schedule card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 flex items-center gap-3 bg-gradient-to-r from-slate-700 to-slate-600">
              <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center border border-white/20">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-bold text-white text-sm">Schedule & Duration</h3>
            </div>
            <div className="p-5 space-y-4">

              <Field label="Duration (minutes)" required error={e.duration_minutes}>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                  <input type="number" min={1} max={600} value={state.duration_minutes}
                    onChange={ev => setField('duration_minutes', ev.target.value)}
                    className={`${inp} pl-10 ${e.duration_minutes ? 'border-rose-300' : ''}`} />
                </div>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Start Date" required error={e.startDate} hint="Opens on this date">
                  <input type="date" value={state.startDate}
                    onChange={ev => setField('startDate', ev.target.value)}
                    className={`${inp} ${e.startDate ? 'border-rose-300' : ''}`} />
                </Field>
                <Field label="End Date" error={e.endDate} hint="Closes on this date">
                  <input type="date" value={state.endDate}
                    min={state.startDate || undefined}
                    onChange={ev => setField('endDate', ev.target.value)}
                    className={`${inp} ${e.endDate ? 'border-rose-300' : ''}`} />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Start Time">
                  <input type="time" value={state.startTime}
                    onChange={ev => setField('startTime', ev.target.value)}
                    className={inp} />
                </Field>
                <Field label="End Time">
                  <input type="time" value={state.endTime}
                    onChange={ev => setField('endTime', ev.target.value)}
                    className={inp} />
                </Field>
              </div>

              {state.startDate && state.startTime && (
                <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-xs text-emerald-800">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-500" />
                  <span>
                    Opens <strong>{new Date(state.startDate).toDateString()}</strong> at <strong>{state.startTime}</strong>
                    {state.endDate && state.endTime && (
                      <> · Closes <strong>{new Date(state.endDate).toDateString()}</strong> at <strong>{state.endTime}</strong></>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Settings card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 flex items-center gap-3 bg-gradient-to-r from-slate-600 to-slate-500">
              <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center border border-white/20">
                <Eye className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-bold text-white text-sm">Assessment Settings</h3>
            </div>
            <div className="p-5 space-y-3">
              <Toggle
                checked={state.shuffle_questions}
                onChange={v => setField('shuffle_questions', v)}
                label="Shuffle Questions"
                desc="Questions appear in a random order for each student"
              />
              <Toggle
                checked={state.camera_proctoring_enabled}
                onChange={v => setField('camera_proctoring_enabled', v)}
                label="Camera Proctoring"
                desc={state.camera_proctoring_enabled
                  ? 'ON — students must allow camera; AI detects face violations'
                  : 'OFF — tab-switch and fullscreen proctoring only'}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-end pt-2">
        <button
          onClick={onNext}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-black shadow-sm transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #003399, #00A9CE)' }}
        >
          Next: Questions
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default AssessmentStep1;
