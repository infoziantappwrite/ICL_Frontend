// src/pages/CollegeAdmin/Assessments/wizard/AssessmentStep5.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssessmentWizard, buildAssessmentPayload } from '../../../../hooks/useAssessmentWizard.jsx';
import { assessmentAPI } from '../../../../api/Api';
import {
  CheckCircle2, Edit2, BookOpen, ListChecks, Award,
  Users, Send, Save, ChevronLeft, AlertCircle,
  Calendar, Clock, Tag, GraduationCap, Layers,
} from 'lucide-react';

const SummaryCard = ({ title, icon: Icon, step, children, onEdit }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
    <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
          style={{ background: 'linear-gradient(135deg, #003399, #00A9CE)' }}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="font-black text-slate-800 text-sm">{title}</span>
      </div>
      <button
        onClick={() => onEdit(step)}
        className="flex items-center gap-1.5 text-xs font-bold text-[#003399] hover:bg-[#003399]/5 px-2.5 py-1.5 rounded-lg transition-colors"
      >
        <Edit2 className="w-3 h-3" />
        Edit
      </button>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const Row = ({ label, value }) => (
  <div className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
    <span className="text-xs text-slate-500 font-semibold">{label}</span>
    <span className="text-xs text-slate-800 font-black text-right max-w-[60%] truncate">{value || '—'}</span>
  </div>
);

const AssessmentStep5 = ({ onBack }) => {
  const navigate = useNavigate();
  const { state, dispatch } = useAssessmentWizard();
  const [publishing, setPublishing] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleEditStep = (step) => {
    dispatch({ type: 'SET_STEP', step });
  };

  const persist = async (publish = false) => {
    setError('');
    publish ? setPublishing(true) : setSavingDraft(true);
    try {
      const payload = buildAssessmentPayload(state);
      let assessmentId = state.assessmentId;

      // Create or update assessment
      if (!assessmentId) {
        const res = await assessmentAPI.createAssessment(payload);
        if (!res.success) throw new Error(res.message || 'Failed to create assessment');
        assessmentId = res.assessment._id;
        dispatch({ type: 'SET_ASSESSMENT_ID', id: assessmentId });
      } else {
        const res = await assessmentAPI.updateAssessment(assessmentId, payload);
        if (!res.success) throw new Error(res.message || 'Failed to update assessment');
      }

      // Save questions
      if (state.questions.length > 0) {
        const qPayload = state.questions.map(q => ({
          question: q.text,
          type: q.type,
          options: q.type === 'mcq' ? q.options.filter(o => o.trim()) : undefined,
          correct_answer: q.correct_answer,
          marks: Number(q.marks) || 1,
        }));
        await assessmentAPI.bulkAddQuestions(assessmentId, qPayload);
      }

      // Assign students
      if (state.assignment_mode === 'group' && state.selectedGroup) {
        await assessmentAPI.assignStudentsFromGroup(assessmentId, state.selectedGroup);
      } else if (state.assignment_mode === 'individual' && state.selectedStudents.length > 0) {
        await assessmentAPI.assignStudentsManual(
          assessmentId,
          state.selectedStudents.map(s => s.email)
        );
      }

      // Publish = transition to scheduled if dates set, else keep draft
      if (publish && state.startDate) {
        await assessmentAPI.transitionStatus(assessmentId, 'scheduled');
      }

      setDone(true);
      setTimeout(() => navigate('/dashboard/college-admin/assessments'), 1500);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setPublishing(false);
      setSavingDraft(false);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-16 h-16 rounded-full flex items-center justify-center bg-emerald-100">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-xl font-black text-slate-900">Assessment Saved!</h2>
        <p className="text-sm text-slate-500">Redirecting to assessments list…</p>
      </div>
    );
  }

  const qCount    = state.questions.length;
  const totalMarks = Number(state.total_marks) || 0;
  const passMarks  = Number(state.pass_marks) || 0;

  const assignmentSummary = {
    class:      'All enrolled students',
    group:      state.selectedGroup ? `Group: ${state.selectedGroup}` : 'No group selected',
    individual: `${state.selectedStudents.length} student(s) selected`,
  }[state.assignment_mode] || '—';

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-black text-slate-900">Review & Publish</h2>
        <p className="text-sm text-slate-500 mt-0.5">Check everything before saving or publishing.</p>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-2xl p-4 text-rose-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="space-y-4">

        {/* Step 1 summary */}
        <SummaryCard title="Basic Info" icon={BookOpen} step={1} onEdit={handleEditStep}>
          <div className="space-y-0">
            <Row label="Title"       value={state.title} />
            <Row label="Subject"     value={state.subject} />
            <Row label="Class"       value={state.classSection} />
            <Row label="Level"       value={state.level} />
            <Row label="Duration"    value={state.duration_minutes ? `${state.duration_minutes} min` : undefined} />
            {state.startDate && (
              <Row label="Schedule"  value={`${state.startDate}${state.startTime ? ` at ${state.startTime}` : ''}${state.endDate ? ` → ${state.endDate}` : ''}`} />
            )}
            {state.tags && <Row label="Tags" value={state.tags} />}
          </div>
          <div className="flex gap-3 mt-3 flex-wrap">
            {state.shuffle_questions && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#003399]/5 text-[#003399] border border-[#003399]/20 px-2 py-0.5 rounded-full">
                Shuffle On
              </span>
            )}
            {state.camera_proctoring_enabled && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full">
                Camera Proctoring
              </span>
            )}
          </div>
        </SummaryCard>

        {/* Step 2 summary */}
        <SummaryCard title="Questions" icon={ListChecks} step={2} onEdit={handleEditStep}>
          {qCount === 0 ? (
            <p className="text-sm text-rose-500 font-semibold">No questions added yet.</p>
          ) : (
            <div className="space-y-0">
              <Row label="Total Questions" value={String(qCount)} />
              <Row label="MCQ"          value={String(state.questions.filter(q => q.type === 'mcq').length)} />
              <Row label="Short Answer"  value={String(state.questions.filter(q => q.type === 'short_answer').length)} />
              <Row label="True / False"  value={String(state.questions.filter(q => q.type === 'true_false').length)} />
            </div>
          )}
          {qCount > 0 && (
            <div className="mt-3 space-y-1 max-h-32 overflow-y-auto">
              {state.questions.map((q, i) => (
                <div key={q.id} className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-black text-white flex-shrink-0"
                    style={{ background: '#003399' }}>{i + 1}</span>
                  <span className="truncate">{q.text || '(empty)'}</span>
                  <span className="text-[10px] text-slate-400 flex-shrink-0">{q.marks}m</span>
                </div>
              ))}
            </div>
          )}
        </SummaryCard>

        {/* Step 3 summary */}
        <SummaryCard title="Grading Rules" icon={Award} step={3} onEdit={handleEditStep}>
          <div className="space-y-0">
            <Row label="Total Marks"    value={totalMarks || undefined} />
            <Row label="Pass Marks"     value={passMarks || undefined} />
            <Row label="Pass %"         value={totalMarks > 0 ? `${Math.round((passMarks / totalMarks) * 100)}%` : undefined} />
          </div>
        </SummaryCard>

        {/* Step 4 summary */}
        <SummaryCard title="Assigned Students" icon={Users} step={4} onEdit={handleEditStep}>
          <Row label="Assignment Mode" value={state.assignment_mode} />
          <Row label="Assignment"      value={assignmentSummary} />
        </SummaryCard>
      </div>

      {/* Action buttons */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">What would you like to do?</h4>
        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={onBack}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-bold hover:bg-slate-50 transition-all">
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          <button
            onClick={() => persist(false)}
            disabled={savingDraft || publishing}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-bold hover:bg-slate-50 transition-all disabled:opacity-50 flex-1 sm:flex-none"
          >
            {savingDraft ? (
              <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {savingDraft ? 'Saving…' : 'Save as Draft'}
          </button>
          <button
            onClick={() => persist(true)}
            disabled={savingDraft || publishing}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-black shadow-md transition-all hover:opacity-90 disabled:opacity-50 flex-1"
            style={{ background: 'linear-gradient(135deg, #003399, #00A9CE)' }}
          >
            {publishing ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {publishing ? 'Publishing…' : 'Save & Schedule'}
          </button>
        </div>
        <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
          <strong>Save as Draft</strong> — visible only to admins. You can edit and publish later.<br />
          <strong>Save & Schedule</strong> — marks it as Scheduled; students can see it when the start date/time arrives.
        </p>
      </div>
    </div>
  );
};

export default AssessmentStep5;
