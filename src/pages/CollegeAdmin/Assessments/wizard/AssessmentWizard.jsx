// src/pages/CollegeAdmin/Assessments/wizard/AssessmentWizard.jsx
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, ChevronLeft } from 'lucide-react';
import CollegeAdminLayout from '../../../../components/layout/CollegeAdminLayout';
import { AssessmentWizardProvider, useAssessmentWizard, validateStep } from '../../../../hooks/useAssessmentWizard.jsx';
import { assessmentAPI } from '../../../../api/Api';
import AssessmentStep1 from './AssessmentStep1';
import AssessmentStep2 from './AssessmentStep2';
import AssessmentStep3 from './AssessmentStep3';
import AssessmentStep4 from './AssessmentStep4';
import AssessmentStep5 from './AssessmentStep5';

const STEPS = [
  { n: 1, label: 'Basic Info' },
  { n: 2, label: 'Questions' },
  { n: 3, label: 'Grading' },
  { n: 4, label: 'Students' },
  { n: 5, label: 'Review' },
];

// ── Progress bar ──────────────────────────────────────────────────────────────
const ProgressBar = ({ currentStep, completedSteps, onStepClick }) => (
  <div className="bg-white border-b border-slate-100 px-4 sm:px-6 py-3">
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center">
        {STEPS.map((step, i) => {
          const done = completedSteps.includes(step.n);
          const active = currentStep === step.n;
          const canNav = done || step.n < currentStep;
          return (
            <div key={step.n} className="flex items-center flex-1 min-w-0">
              <button
                onClick={() => canNav && onStepClick(step.n)}
                disabled={!canNav}
                className="flex flex-col items-center gap-1 min-w-0 flex-shrink-0 group"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all flex-shrink-0 ${
                  done
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : active
                      ? 'text-white shadow-lg shadow-blue-200'
                      : 'bg-slate-100 text-slate-400'
                }`}
                style={active ? { background: '#003399' } : {}}>
                  {done ? <CheckCircle2 className="w-4 h-4" /> : step.n}
                </div>
                <span className={`text-[9px] font-black uppercase tracking-wider hidden sm:block ${
                  active ? 'text-[#003399]' : done ? 'text-emerald-600' : 'text-slate-400'
                }`}>
                  {step.label}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 rounded-full transition-colors ${
                  completedSteps.includes(step.n) ? 'bg-emerald-400' : 'bg-slate-200'
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

// ── Inner wizard (has access to context) ─────────────────────────────────────
const WizardInner = () => {
  const navigate = useNavigate();
  const { assessmentId: urlId } = useParams();
  const { state, dispatch, goToStep } = useAssessmentWizard();

  // Load existing assessment for edit mode
  useEffect(() => {
    if (!urlId) return;
    assessmentAPI.getAssessment(urlId).then(res => {
      if (!res.success) return;
      const a = res.assessment;
      dispatch({ type: 'SET_ASSESSMENT_ID', id: urlId });
      const fields = {
        title: a.title || '',
        subject: a.subject || '',
        classSection: a.class_section || '',
        startDate: a.scheduled_date ? new Date(a.scheduled_date).toISOString().split('T')[0] : '',
        endDate: a.end_date ? new Date(a.end_date).toISOString().split('T')[0] : '',
        startTime: a.start_time || '',
        endTime: a.end_time || '',
        duration_minutes: a.duration_minutes || 60,
        level: a.level || 'Beginner',
        tags: Array.isArray(a.tags) ? a.tags.join(', ') : '',
        shuffle_questions: a.shuffle_questions ?? false,
        camera_proctoring_enabled: a.camera_proctoring_enabled ?? true,
        total_marks: a.total_marks || '',
        pass_marks: a.pass_marks || '',
      };
      Object.entries(fields).forEach(([field, value]) =>
        dispatch({ type: 'SET_FIELD', field, value })
      );
    }).catch(() => {});
  }, [urlId, dispatch]);

  const handleStepClick = (targetStep) => {
    if (targetStep < state.currentStep) {
      dispatch({ type: 'SET_STEP', step: targetStep });
    }
  };

  const handleNext = () => {
    const errors = validateStep(state.currentStep, state);
    if (Object.keys(errors).length > 0) {
      dispatch({ type: 'SET_ERRORS', errors });
      return;
    }
    dispatch({ type: 'SET_ERRORS', errors: {} });
    goToStep(state.currentStep + 1, state);
  };

  const handleBack = () => {
    if (state.currentStep > 1) {
      dispatch({ type: 'SET_STEP', step: state.currentStep - 1 });
    }
  };

  const stepProps = { onNext: handleNext, onBack: handleBack };

  return (
    <CollegeAdminLayout>
      <div className="min-h-screen bg-slate-50">

        {/* Sticky progress bar */}
        <div className="sticky top-[60px] z-20">
          <ProgressBar
            currentStep={state.currentStep}
            completedSteps={state.completedSteps}
            onStepClick={handleStepClick}
          />
          {/* Auto-save indicator */}
          <div className="bg-white border-b border-slate-100 px-4 sm:px-6 py-1.5 flex items-center gap-2">
            <div className="max-w-4xl mx-auto flex items-center gap-3 w-full">
              <button
                onClick={() => navigate('/dashboard/college-admin/assessments')}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-[#003399] transition-colors font-semibold group"
              >
                <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                Back to Assessments
              </button>
              <div className="flex-1" />
              {state.isSaving && (
                <span className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold">
                  <div className="w-2.5 h-2.5 border border-slate-300 border-t-[#003399] rounded-full animate-spin" />
                  Saving draft…
                </span>
              )}
              {state.saveError && (
                <span className="text-[10px] text-rose-500 font-semibold">{state.saveError}</span>
              )}
            </div>
          </div>
        </div>

        {/* Step content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          {state.currentStep === 1 && <AssessmentStep1 {...stepProps} />}
          {state.currentStep === 2 && <AssessmentStep2 {...stepProps} />}
          {state.currentStep === 3 && <AssessmentStep3 {...stepProps} />}
          {state.currentStep === 4 && <AssessmentStep4 {...stepProps} />}
          {state.currentStep === 5 && <AssessmentStep5 onBack={handleBack} />}
        </div>
      </div>
    </CollegeAdminLayout>
  );
};

// ── Public export wrapped in provider ─────────────────────────────────────────
const AssessmentWizard = () => (
  <AssessmentWizardProvider>
    <WizardInner />
  </AssessmentWizardProvider>
);

export default AssessmentWizard;
