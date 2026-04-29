// src/pages/CollegeAdmin/Assessments/wizard/AssessmentStep2.jsx
import { useState } from 'react';
import { useAssessmentWizard } from '../../../../hooks/useAssessmentWizard.jsx';
import {
  Plus, Trash2, ChevronUp, ChevronDown, ChevronRight, ChevronLeft,
  ListChecks, ToggleLeft, Type, AlignLeft,
} from 'lucide-react';

const inp = 'w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#003399]/30 focus:border-[#003399] bg-white transition-all placeholder:text-slate-400';

const QUESTION_TYPES = [
  { value: 'mcq',          label: 'Multiple Choice',  icon: ListChecks,  color: 'text-[#003399] bg-[#003399]/10 border-[#003399]/20' },
  { value: 'short_answer', label: 'Short Answer',     icon: AlignLeft,   color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  { value: 'true_false',   label: 'True / False',     icon: ToggleLeft,  color: 'text-violet-700 bg-violet-50 border-violet-200' },
];

const TypeBadge = ({ type }) => {
  const cfg = QUESTION_TYPES.find(t => t.value === type) || QUESTION_TYPES[0];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
};

const QuestionEditor = ({ question, index, errors, onUpdate, onDelete, onMoveUp, onMoveDown, isFirst, isLast }) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className={`bg-white rounded-2xl border transition-all ${
      errors[`q_text_${index}`] || errors[`q_options_${index}`] || errors[`q_answer_${index}`]
        ? 'border-rose-300 shadow-sm shadow-rose-100'
        : 'border-slate-100 shadow-sm'
    }`}>
      {/* Question header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
        <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black text-white flex-shrink-0"
          style={{ background: '#003399' }}>
          {index + 1}
        </span>
        <TypeBadge type={question.type} />
        <div className="flex-1 min-w-0">
          {question.text && (
            <p className="text-xs font-semibold text-slate-700 truncate">{question.text}</p>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => onMoveUp(index)} disabled={isFirst}
            className="p-1 rounded-lg text-slate-400 hover:text-[#003399] hover:bg-slate-50 disabled:opacity-30 transition-all">
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onMoveDown(index)} disabled={isLast}
            className="p-1 rounded-lg text-slate-400 hover:text-[#003399] hover:bg-slate-50 disabled:opacity-30 transition-all">
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setExpanded(p => !p)}
            className="p-1 rounded-lg text-slate-400 hover:text-[#003399] hover:bg-slate-50 transition-all">
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button onClick={() => onDelete(index)}
            className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="p-4 space-y-3">
          {/* Question type selector */}
          <div className="flex gap-2 flex-wrap">
            {QUESTION_TYPES.map(t => (
              <button key={t.value}
                onClick={() => onUpdate(index, { type: t.value, correct_answer: '', options: ['', '', '', ''] })}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                  question.type === t.value
                    ? t.color + ' ring-2 ring-offset-1 ' + t.color.split(' ')[2]
                    : 'border-slate-200 text-slate-500 bg-white hover:border-slate-300'
                }`}>
                <t.icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            ))}
          </div>

          {/* Question text */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
              Question Text <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={question.text}
              onChange={ev => onUpdate(index, { text: ev.target.value })}
              placeholder="Enter your question here…"
              rows={2}
              className={`${inp} resize-none ${errors[`q_text_${index}`] ? 'border-rose-300' : ''}`}
            />
            {errors[`q_text_${index}`] && (
              <p className="text-xs text-rose-500 mt-1 font-semibold">{errors[`q_text_${index}`]}</p>
            )}
          </div>

          {/* MCQ options */}
          {question.type === 'mcq' && (
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">
                Options <span className="text-rose-500">*</span>
              </label>
              <div className="space-y-2">
                {question.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <button
                      onClick={() => onUpdate(index, { correct_answer: String(oi) })}
                      className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all ${
                        question.correct_answer === String(oi)
                          ? 'border-[#003399] bg-[#003399]'
                          : 'border-slate-300 hover:border-[#003399]/50'
                      }`}
                    >
                      {question.correct_answer === String(oi) && (
                        <div className="w-2 h-2 rounded-full bg-white mx-auto" />
                      )}
                    </button>
                    <input
                      type="text"
                      value={opt}
                      onChange={ev => {
                        const newOpts = [...question.options];
                        newOpts[oi] = ev.target.value;
                        onUpdate(index, { options: newOpts });
                      }}
                      placeholder={`Option ${oi + 1}`}
                      className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003399]/30 focus:border-[#003399] bg-white placeholder:text-slate-400"
                    />
                  </div>
                ))}
              </div>
              {errors[`q_options_${index}`] && (
                <p className="text-xs text-rose-500 mt-1 font-semibold">{errors[`q_options_${index}`]}</p>
              )}
              {errors[`q_answer_${index}`] && (
                <p className="text-xs text-rose-500 mt-1 font-semibold">{errors[`q_answer_${index}`]}</p>
              )}
              <p className="text-[10px] text-slate-400 mt-1">Click the radio button to mark the correct answer</p>
            </div>
          )}

          {/* True / False */}
          {question.type === 'true_false' && (
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">
                Correct Answer <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-3">
                {['true', 'false'].map(val => (
                  <button key={val}
                    onClick={() => onUpdate(index, { correct_answer: val })}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                      question.correct_answer === val
                        ? 'border-[#003399] bg-[#003399] text-white shadow-md'
                        : 'border-slate-200 text-slate-600 bg-white hover:border-slate-300'
                    }`}>
                    {val.charAt(0).toUpperCase() + val.slice(1)}
                  </button>
                ))}
              </div>
              {errors[`q_answer_${index}`] && (
                <p className="text-xs text-rose-500 mt-1 font-semibold">{errors[`q_answer_${index}`]}</p>
              )}
            </div>
          )}

          {/* Short answer note */}
          {question.type === 'short_answer' && (
            <div className="flex items-start gap-2 bg-slate-50 rounded-xl px-3 py-2.5 text-xs text-slate-500">
              <AlignLeft className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              Students type a free-text answer. Manual review or keyword matching is applied during grading.
            </div>
          )}

          {/* Marks */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
              Marks for this question
            </label>
            <input type="number" min={1} max={100}
              value={question.marks}
              onChange={ev => onUpdate(index, { marks: ev.target.value })}
              className="w-28 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#003399]/30 focus:border-[#003399] bg-white" />
          </div>
        </div>
      )}
    </div>
  );
};

const AssessmentStep2 = ({ onNext, onBack }) => {
  const { state, addQuestion, updateQuestion, deleteQuestion, moveQuestionUp, moveQuestionDown } = useAssessmentWizard();
  const e = state.errors;

  const totalMarks = state.questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Question Builder</h2>
          <p className="text-sm text-slate-500 mt-0.5">Add, reorder, and configure questions for this assessment.</p>
        </div>
        <div className="flex-shrink-0 text-right">
          <p className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">{state.questions.length}</p>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Questions</p>
          {totalMarks > 0 && (
            <p className="text-xs text-slate-500 mt-0.5">{totalMarks} marks total</p>
          )}
        </div>
      </div>

      {/* Add question buttons */}
      <div className="flex gap-2 flex-wrap">
        {QUESTION_TYPES.map(t => (
          <button key={t.value}
            onClick={() => addQuestion(t.value)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed text-sm font-bold transition-all text-slate-500 border-slate-200 hover:border-[#003399]/50 hover:text-[#003399] hover:bg-[#003399]/5">
            <Plus className="w-4 h-4" />
            Add {t.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {e.questions && (
        <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm text-rose-700">
          <Type className="w-4 h-4 flex-shrink-0" />
          {e.questions}
        </div>
      )}

      {/* Question list */}
      {state.questions.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ListChecks className="w-7 h-7 text-slate-400" />
          </div>
          <h3 className="text-base font-bold text-slate-700 mb-1">No questions yet</h3>
          <p className="text-sm text-slate-400">Click a button above to add your first question.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {state.questions.map((q, i) => (
            <QuestionEditor
              key={q.id}
              question={q}
              index={i}
              errors={e}
              onUpdate={updateQuestion}
              onDelete={deleteQuestion}
              onMoveUp={moveQuestionUp}
              onMoveDown={moveQuestionDown}
              isFirst={i === 0}
              isLast={i === state.questions.length - 1}
            />
          ))}
        </div>
      )}

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
          Next: Grading
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default AssessmentStep2;
