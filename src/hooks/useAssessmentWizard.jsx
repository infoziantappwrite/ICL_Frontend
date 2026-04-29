// src/hooks/useAssessmentWizard.jsx
import { createContext, useContext, useReducer, useRef, useCallback } from 'react';
import { assessmentAPI } from '../api/Api';

// ── Initial state ─────────────────────────────────────────────────────────────
export const INITIAL_WIZARD_STATE = {
  currentStep: 1,
  completedSteps: [],
  assessmentId: null,
  isSaving: false,
  saveError: null,

  // Step 1 – Basic Info
  title: '',
  subject: '',
  classSection: '',
  startDate: '',
  endDate: '',
  startTime: '',
  endTime: '',
  duration_minutes: 60,
  level: 'Beginner',
  tags: '',
  shuffle_questions: false,
  camera_proctoring_enabled: true,

  // Step 2 – Question Builder
  questions: [],
  // Each question: { id, type: 'mcq'|'short_answer'|'true_false', text, options: ['','','',''], correct_answer: '', marks: 1 }

  // Step 3 – Grading Rules
  total_marks: '',
  pass_marks: '',
  marks_per_question: '',

  // Step 4 – Assign Students
  assignment_mode: 'class',   // 'class' | 'group' | 'individual'
  selectedGroup: '',
  selectedStudents: [],       // array of { _id, name, email }

  // Per-step field errors
  errors: {},
};

// ── Reducer ───────────────────────────────────────────────────────────────────
function wizardReducer(state, action) {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value, errors: { ...state.errors, [action.field]: undefined } };

    case 'SET_STEP':
      return { ...state, currentStep: action.step };

    case 'MARK_STEP_COMPLETE':
      return {
        ...state,
        completedSteps: state.completedSteps.includes(action.step)
          ? state.completedSteps
          : [...state.completedSteps, action.step],
      };

    case 'SET_ASSESSMENT_ID':
      return { ...state, assessmentId: action.id };

    case 'SET_ERRORS':
      return { ...state, errors: action.errors };

    case 'SET_SAVING':
      return { ...state, isSaving: action.value, saveError: action.value ? null : state.saveError };

    case 'SET_SAVE_ERROR':
      return { ...state, saveError: action.error, isSaving: false };

    case 'ADD_QUESTION': {
      const newQ = {
        id: Date.now(),
        type: action.qtype || 'mcq',
        text: '',
        options: ['', '', '', ''],
        correct_answer: '',
        marks: 1,
      };
      return { ...state, questions: [...state.questions, newQ] };
    }

    case 'UPDATE_QUESTION': {
      const updated = state.questions.map((q, i) =>
        i === action.index ? { ...q, ...action.data } : q
      );
      return { ...state, questions: updated };
    }

    case 'DELETE_QUESTION':
      return { ...state, questions: state.questions.filter((_, i) => i !== action.index) };

    case 'REORDER_QUESTION_UP': {
      if (action.index === 0) return state;
      const qs = [...state.questions];
      [qs[action.index - 1], qs[action.index]] = [qs[action.index], qs[action.index - 1]];
      return { ...state, questions: qs };
    }

    case 'REORDER_QUESTION_DOWN': {
      if (action.index >= state.questions.length - 1) return state;
      const qs = [...state.questions];
      [qs[action.index + 1], qs[action.index]] = [qs[action.index], qs[action.index + 1]];
      return { ...state, questions: qs };
    }

    case 'RESET':
      return { ...INITIAL_WIZARD_STATE };

    default:
      return state;
  }
}

// ── Step validators ──────────────────────────────────────────────────────────
export function validateStep(step, state) {
  const errors = {};

  if (step === 1) {
    if (!state.title.trim()) errors.title = 'Assessment title is required';
    if (!state.subject.trim()) errors.subject = 'Subject is required';
    if (!state.startDate) errors.startDate = 'Start date is required';
    if (state.endDate && state.startDate && state.endDate < state.startDate)
      errors.endDate = 'End date must be after start date';
    if (state.duration_minutes < 1)
      errors.duration_minutes = 'Duration must be at least 1 minute';
  }

  if (step === 2) {
    if (state.questions.length === 0)
      errors.questions = 'Add at least one question';
    state.questions.forEach((q, i) => {
      if (!q.text.trim())
        errors[`q_text_${i}`] = 'Question text is required';
      if (q.type === 'mcq') {
        const filled = q.options.filter(o => o.trim()).length;
        if (filled < 2) errors[`q_options_${i}`] = 'Provide at least 2 options';
        if (!q.correct_answer && q.correct_answer !== 0)
          errors[`q_answer_${i}`] = 'Select the correct option';
      }
      if (q.type === 'true_false' && !q.correct_answer)
        errors[`q_answer_${i}`] = 'Select True or False';
    });
  }

  if (step === 3) {
    if (!state.total_marks || Number(state.total_marks) < 1)
      errors.total_marks = 'Total marks is required (min 1)';
    if (!state.pass_marks || Number(state.pass_marks) < 1)
      errors.pass_marks = 'Pass marks is required (min 1)';
    if (Number(state.pass_marks) > Number(state.total_marks))
      errors.pass_marks = 'Pass marks cannot exceed total marks';
  }

  if (step === 4) {
    if (state.assignment_mode === 'individual' && state.selectedStudents.length === 0)
      errors.selectedStudents = 'Select at least one student';
    if (state.assignment_mode === 'group' && !state.selectedGroup)
      errors.selectedGroup = 'Select a group';
  }

  return errors;
}

// ── Build API payload from wizard state ──────────────────────────────────────
export function buildAssessmentPayload(state) {
  return {
    title: state.title.trim(),
    level: state.level,
    source_type: 'college_admin_manual',
    total_marks: Number(state.total_marks) || 0,
    pass_marks: Number(state.pass_marks) || 0,
    duration_minutes: Number(state.duration_minutes) || 60,
    scheduled_date: state.startDate || null,
    start_time: state.startTime || null,
    end_date: state.endDate || null,
    end_time: state.endTime || null,
    tags: state.tags ? state.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    shuffle_questions: state.shuffle_questions,
    camera_proctoring_enabled: state.camera_proctoring_enabled,
    has_sections: false,
    subject: state.subject.trim(),
    class_section: state.classSection.trim(),
  };
}

// ── Context ───────────────────────────────────────────────────────────────────
const WizardContext = createContext(null);

export function AssessmentWizardProvider({ children }) {
  const [state, dispatch] = useReducer(wizardReducer, INITIAL_WIZARD_STATE);
  const debounceRef = useRef(null);

  const setField = useCallback((field, value) =>
    dispatch({ type: 'SET_FIELD', field, value }), []);

  const addQuestion = useCallback((qtype) =>
    dispatch({ type: 'ADD_QUESTION', qtype }), []);

  const updateQuestion = useCallback((index, data) =>
    dispatch({ type: 'UPDATE_QUESTION', index, data }), []);

  const deleteQuestion = useCallback((index) =>
    dispatch({ type: 'DELETE_QUESTION', index }), []);

  const moveQuestionUp = useCallback((index) =>
    dispatch({ type: 'REORDER_QUESTION_UP', index }), []);

  const moveQuestionDown = useCallback((index) =>
    dispatch({ type: 'REORDER_QUESTION_DOWN', index }), []);

  // ── Persist draft to API (debounced 800ms) ───────────────────────────────
  const scheduleSave = useCallback((snapState) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      dispatch({ type: 'SET_SAVING', value: true });
      try {
        const payload = buildAssessmentPayload(snapState);
        let assessmentId = snapState.assessmentId;

        if (!assessmentId) {
          const res = await assessmentAPI.createAssessment(payload);
          if (res.success) {
            assessmentId = res.assessment._id;
            dispatch({ type: 'SET_ASSESSMENT_ID', id: assessmentId });
          }
        } else {
          await assessmentAPI.updateAssessment(assessmentId, payload);
        }

        // Save questions if on/past step 2
        if (assessmentId && snapState.questions.length > 0) {
          const qPayload = snapState.questions.map(q => ({
            question: q.text,
            type: q.type,
            options: q.type === 'mcq' ? q.options.filter(o => o.trim()) : undefined,
            correct_answer: q.correct_answer,
            marks: Number(q.marks) || 1,
          }));
          await assessmentAPI.bulkAddQuestions(assessmentId, qPayload);
        }

        // Assign students if on/past step 4
        if (assessmentId && snapState.assignment_mode === 'group' && snapState.selectedGroup) {
          await assessmentAPI.assignStudentsFromGroup(assessmentId, snapState.selectedGroup);
        } else if (assessmentId && snapState.assignment_mode === 'individual' && snapState.selectedStudents.length > 0) {
          await assessmentAPI.assignStudentsManual(
            assessmentId,
            snapState.selectedStudents.map(s => s.email)
          );
        }

        dispatch({ type: 'SET_SAVING', value: false });
      } catch (err) {
        dispatch({ type: 'SET_SAVE_ERROR', error: err.message || 'Auto-save failed' });
      }
    }, 800);
  }, []);

  // ── Navigate steps ────────────────────────────────────────────────────────
  const goToStep = useCallback((targetStep, currentState) => {
    dispatch({ type: 'MARK_STEP_COMPLETE', step: currentState.currentStep });
    dispatch({ type: 'SET_STEP', step: targetStep });
    scheduleSave(currentState);
  }, [scheduleSave]);

  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  return (
    <WizardContext.Provider value={{
      state, dispatch, setField,
      addQuestion, updateQuestion, deleteQuestion, moveQuestionUp, moveQuestionDown,
      goToStep, scheduleSave, reset,
    }}>
      {children}
    </WizardContext.Provider>
  );
}

export function useAssessmentWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error('useAssessmentWizard must be used inside AssessmentWizardProvider');
  return ctx;
}
