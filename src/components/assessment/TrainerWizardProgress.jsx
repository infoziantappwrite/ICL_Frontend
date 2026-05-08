// src/components/assessment/TrainerWizardProgress.jsx
// 4-step progress bar for the Trainer assessment flow:
// Details → Sections → Questions → Review
import { CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const TRAINER_WIZARD_STEPS = [
  { n: 1, label: 'Details',   hint: 'Assessment Info' },
  { n: 2, label: 'Sections',  hint: 'Divide into sections' },
  { n: 3, label: 'Questions', hint: 'Add questions' },
  { n: 4, label: 'Review',    hint: 'Publish' },
];

export const trainerStepRoute = (step, assessmentId) => {
  if (step === 1) return '/dashboard/trainer/assessments/create';
  if (!assessmentId) return null;
  if (step === 2) return `/dashboard/trainer/assessments/${assessmentId}/sections`;
  if (step === 3) return `/dashboard/trainer/assessments/${assessmentId}/questions`;
  if (step === 4) return `/dashboard/trainer/assessments/${assessmentId}/review`;
  return null;
};

/**
 * TrainerWizardProgress — sticky progress bar for trainer assessment pages.
 *
 * Props:
 *   currentStep  {number}  1–4
 *   assessmentId {string}  MongoDB ID (undefined before first save)
 */
const TrainerWizardProgress = ({ currentStep, assessmentId }) => {
  const navigate = useNavigate();

  const handleClick = (step) => {
    if (step >= currentStep) return;
    const route = trainerStepRoute(step, assessmentId);
    if (route) navigate(route);
  };

  return (
    <div className="bg-white border-b border-slate-100 sticky top-[60px] z-20 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center">
          {TRAINER_WIZARD_STEPS.map((step, i) => {
            const done   = step.n < currentStep;
            const active = step.n === currentStep;
            const canNav = step.n < currentStep && assessmentId;

            return (
              <div key={step.n} className="flex items-center flex-1 min-w-0">
                <button
                  onClick={() => canNav && handleClick(step.n)}
                  disabled={!canNav}
                  title={step.hint}
                  className={`flex flex-col items-center gap-1 flex-shrink-0 group ${canNav ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                      done
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : active
                          ? 'text-white shadow-lg'
                          : 'bg-slate-100 text-slate-400'
                    }`}
                    style={active ? { background: 'linear-gradient(135deg,#003399,#00A9CE)' } : {}}
                  >
                    {done ? <CheckCircle2 className="w-4 h-4" /> : step.n}
                  </div>
                  <span
                    className={`text-[9px] font-black uppercase tracking-wider hidden sm:block transition-colors ${
                      active ? 'text-[#003399]' : done ? 'text-emerald-600' : 'text-slate-400'
                    } ${canNav ? 'group-hover:text-[#003399]' : ''}`}
                  >
                    {step.label}
                  </span>
                </button>

                {i < TRAINER_WIZARD_STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 rounded-full transition-colors duration-500 ${
                      done ? 'bg-emerald-400' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TrainerWizardProgress;