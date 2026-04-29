// src/pages/CollegeAdmin/Assessments/wizard/AssessmentStep3.jsx
import { useAssessmentWizard } from '../../../../hooks/useAssessmentWizard.jsx';
import { Award, Target, Info, ChevronLeft, ChevronRight } from 'lucide-react';

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

const AssessmentStep3 = ({ onNext, onBack }) => {
  const { state, setField } = useAssessmentWizard();
  const e = state.errors;

  const total    = Number(state.total_marks) || 0;
  const passing  = Number(state.pass_marks) || 0;
  const perQ     = Number(state.marks_per_question) || 0;
  const qCount   = state.questions.length;
  const sumByQ   = perQ > 0 ? perQ * qCount : state.questions.reduce((s, q) => s + (Number(q.marks) || 0), 0);
  const pct      = total > 0 ? Math.round((passing / total) * 100) : 0;

  const applyPerQuestion = () => {
    if (perQ > 0) setField('total_marks', String(perQ * qCount));
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-black text-slate-900">Grading Rules</h2>
        <p className="text-sm text-slate-500 mt-0.5">Define total marks, pass threshold, and per-question scoring.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* LEFT — marks inputs */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 flex items-center gap-3" style={{ background: 'linear-gradient(135deg, #003399, #00A9CE)' }}>
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center border border-white/20">
              <Award className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-bold text-white text-sm">Mark Distribution</h3>
          </div>
          <div className="p-5 space-y-4">

            <Field label="Total Marks" required error={e.total_marks}
              hint="The maximum score a student can achieve">
              <div className="relative">
                <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                <input type="number" min={1} value={state.total_marks}
                  onChange={ev => setField('total_marks', ev.target.value)}
                  placeholder="e.g. 100"
                  className={`${inp} pl-10 ${e.total_marks ? 'border-rose-300' : ''}`} />
              </div>
            </Field>

            <Field label="Pass Marks" required error={e.pass_marks}
              hint="Minimum score required to pass">
              <div className="relative">
                <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                <input type="number" min={1} value={state.pass_marks}
                  onChange={ev => setField('pass_marks', ev.target.value)}
                  placeholder="e.g. 40"
                  className={`${inp} pl-10 ${e.pass_marks ? 'border-rose-300' : ''}`} />
              </div>
            </Field>

            <div className="border-t border-slate-100 pt-4">
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                Marks Per Question
                <span className="ml-1 text-slate-400 font-normal normal-case tracking-normal">(optional — sets equal marks for all questions)</span>
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                  <input type="number" min={1} value={state.marks_per_question}
                    onChange={ev => setField('marks_per_question', ev.target.value)}
                    placeholder={qCount > 0 ? `e.g. ${Math.ceil(100 / Math.max(qCount, 1))}` : 'e.g. 2'}
                    className={`${inp} pl-10`} />
                </div>
                {qCount > 0 && perQ > 0 && (
                  <button onClick={applyPerQuestion}
                    className="px-3 py-2.5 text-xs font-bold rounded-xl border border-[#003399]/30 text-[#003399] bg-[#003399]/5 hover:bg-[#003399]/10 transition-all whitespace-nowrap">
                    Set total to {perQ * qCount}
                  </button>
                )}
              </div>
              {qCount > 0 && perQ > 0 && (
                <p className="text-xs text-slate-400 mt-1">{perQ} marks × {qCount} questions = {perQ * qCount} total</p>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT — summary */}
        <div className="space-y-4">
          {/* Breakdown card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-4">Grading Summary</h4>
            <div className="space-y-3">
              {[
                { label: 'Total Marks',     value: total || '—',  accent: true },
                { label: 'Pass Marks',      value: passing || '—' },
                { label: 'Pass Percentage', value: total > 0 ? `${pct}%` : '—' },
                { label: 'Questions',       value: qCount || '—' },
                { label: 'Marks from Qs',  value: sumByQ > 0 ? sumByQ : '—' },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <span className="text-sm text-slate-500">{row.label}</span>
                  <span className={`text-sm font-black ${row.accent ? 'text-[#003399]' : 'text-slate-800'}`}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pass threshold bar */}
          {total > 0 && passing > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex justify-between text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
                <span>Pass Threshold</span>
                <span>{pct}%</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(pct, 100)}%`,
                    background: pct >= 60 ? 'linear-gradient(90deg, #003399, #00A9CE)' : pct >= 35 ? '#f59e0b' : '#ef4444',
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>0</span>
                <span className="text-[#003399] font-bold">{passing} (pass)</span>
                <span>{total}</span>
              </div>
            </div>
          )}

          {total > 0 && sumByQ > 0 && sumByQ !== total && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800">
              <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-500" />
              <span>
                Question marks sum to <strong>{sumByQ}</strong> but total is <strong>{total}</strong>.
                You can adjust individual question marks in Step 2.
              </span>
            </div>
          )}

          <div className="flex items-start gap-2 bg-[#003399]/5 border border-[#003399]/20 rounded-xl px-4 py-3 text-xs text-[#003399]">
            <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>
              Each question's marks can be set individually in Step 2.
              Use "Marks Per Question" above to quickly apply equal weights.
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-2">
        <button onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-bold hover:bg-slate-50 transition-all">
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        <button onClick={onNext}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-black shadow-sm transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #003399, #00A9CE)' }}>
          Next: Assign Students
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default AssessmentStep3;
