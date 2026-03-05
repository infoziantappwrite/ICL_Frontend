// pages/CollegeAdmin/Assessments/QuestionManager.jsx
// Fully fixed to match backend Question schema:
//   - field: "question" (not questionText)
//   - options: [{label: "A", text: "..."}, ...] (not plain strings)
//   - correct_answer: "A" (label string for single_answer)
//   - level: Beginner|Intermediate|Advanced (not difficulty Easy/Medium/Hard)
//   - type: single_answer | multiple_answer | fill_up | coding
//
// Admin flow:
//   POST /api/assessment/:id/add-question → creates question AND attaches to assessment
//   PUT  /api/assessment/question/:id     → updates question
//   DELETE /api/assessment/question/:id  → soft deletes question

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Plus, Trash2, Edit, Save, X, ChevronLeft,
  AlertCircle, CheckCircle2, BookOpen, Users, UserPlus,
  Mail, Phone, Search, ChevronLeft as ChevronLeftIcon, ChevronRight, Eye
} from 'lucide-react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { assessmentAPI } from '../../../api/Api';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

// Convert backend question doc → form state
const questionToForm = (q) => ({
  question: q.question || '',
  type: q.type || 'single_answer',
  level: q.level || 'Beginner',
  options: q.options?.length
    ? q.options.map(o => o.text || '')
    : ['', '', '', ''],
  correct_answer: Array.isArray(q.correct_answer)
    ? q.correct_answer
    : (q.correct_answer ? q.correct_answer : 'A'),
  explanation: q.explanation || '',
  marks: q.marks || 1,
});

const BLANK_FORM = {
  question: '',
  type: 'single_answer',
  level: 'Beginner',
  options: ['', '', '', ''],
  correct_answer: 'A',
  explanation: '',
  marks: 1,
};

// ── Question Modal ────────────────────────────────────────────────────────────
const QuestionModal = ({ question, onSave, onClose, saving }) => {
  const [form, setForm] = useState(question ? questionToForm(question) : { ...BLANK_FORM });

  const setOpt = (idx, val) => setForm(prev => {
    const opts = [...prev.options];
    opts[idx] = val;
    return { ...prev, options: opts };
  });

  const isChoiceType = form.type === 'single_answer' || form.type === 'multiple_answer';
  const isFillUp = form.type === 'fill_up';

  const toggleMultiAnswer = (label) => {
    setForm(prev => {
      const current = Array.isArray(prev.correct_answer) ? prev.correct_answer : [];
      const next = current.includes(label)
        ? current.filter(l => l !== label)
        : [...current, label];
      return { ...prev, correct_answer: next };
    });
  };

  const handleSave = () => {
    if (!form.question.trim()) return;
    if (isChoiceType && form.options.some(o => !o.trim())) return;

    // Build the payload matching Question schema
    const payload = {
      question: form.question.trim(),
      type: form.type,
      level: form.level,
      marks: Number(form.marks) || 1,
      explanation: form.explanation || undefined,
    };

    if (isChoiceType) {
      payload.options = form.options.map((text, i) => ({
        label: OPTION_LABELS[i],
        text: text.trim(),
      }));
      payload.correct_answer = form.type === 'multiple_answer'
        ? (Array.isArray(form.correct_answer) ? form.correct_answer : [form.correct_answer])
        : (typeof form.correct_answer === 'string' ? form.correct_answer : 'A');
    }

    if (isFillUp) {
      payload.correct_answer = typeof form.correct_answer === 'string'
        ? form.correct_answer
        : '';
    }

    onSave(payload);
  };

  const canSave = form.question.trim() &&
    (!isChoiceType || form.options.every(o => o.trim())) &&
    (!isFillUp || (typeof form.correct_answer === 'string' && form.correct_answer.trim()));

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full my-8 p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-gray-900 text-lg">{question ? 'Edit Question' : 'Add Question'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Question text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Question <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={form.question}
              onChange={e => setForm(prev => ({ ...prev, question: e.target.value }))}
              placeholder="Enter the question..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Type + Level */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
              <select
                value={form.type}
                onChange={e => setForm(prev => ({
                  ...prev,
                  type: e.target.value,
                  correct_answer: e.target.value === 'multiple_answer' ? [] : 'A',
                }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="single_answer">Single Answer (MCQ)</option>
                <option value="multiple_answer">Multiple Answer</option>
                <option value="fill_up">Fill in the Blank</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Level</label>
              <select
                value={form.level}
                onChange={e => setForm(prev => ({ ...prev, level: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>

          {/* Options for MCQ types */}
          {isChoiceType && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Options <span className="text-red-500">*</span>
                <span className="text-xs text-gray-400 ml-1 font-normal">
                  {form.type === 'multiple_answer' ? '(check all correct)' : '(click radio for correct answer)'}
                </span>
              </label>
              <div className="space-y-2">
                {OPTION_LABELS.map((label, idx) => {
                  const isCorrect = form.type === 'multiple_answer'
                    ? (Array.isArray(form.correct_answer) ? form.correct_answer.includes(label) : false)
                    : form.correct_answer === label;

                  return (
                    <div key={label} className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all
                      ${isCorrect ? 'border-green-400 bg-green-50' : 'border-gray-100 bg-gray-50'}`}>
                      {form.type === 'multiple_answer' ? (
                        <input
                          type="checkbox"
                          checked={isCorrect}
                          onChange={() => toggleMultiAnswer(label)}
                          className="w-4 h-4 text-green-600 rounded"
                        />
                      ) : (
                        <input
                          type="radio"
                          name="correctAnswer"
                          checked={isCorrect}
                          onChange={() => setForm(prev => ({ ...prev, correct_answer: label }))}
                          className="w-4 h-4 text-green-600"
                        />
                      )}
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                        ${isCorrect ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                        {label}
                      </span>
                      <input
                        type="text"
                        value={form.options[idx]}
                        onChange={e => setOpt(idx, e.target.value)}
                        placeholder={`Option ${label}`}
                        className="flex-1 bg-transparent text-sm focus:outline-none text-gray-700 placeholder-gray-400"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Fill-up correct answer */}
          {isFillUp && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Correct Answer <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={typeof form.correct_answer === 'string' ? form.correct_answer : ''}
                onChange={e => setForm(prev => ({ ...prev, correct_answer: e.target.value }))}
                placeholder="Enter the exact correct answer"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Marks + Explanation */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Marks</label>
              <input
                type="number"
                min={0.25}
                step={0.25}
                value={form.marks}
                onChange={e => setForm(prev => ({ ...prev, marks: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Explanation (optional)</label>
              <input
                type="text"
                value={form.explanation}
                onChange={e => setForm(prev => ({ ...prev, explanation: e.target.value }))}
                placeholder="Brief explanation..."
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-medium">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !canSave}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 disabled:opacity-60"
          >
            {saving ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Question'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Assign Students Modal ─────────────────────────────────────────────────────
const AssignStudentsModal = ({ assessmentId, onClose }) => {
  const [mode, setMode] = useState('jd'); // 'jd' | 'manual'
  const [studentEmails, setStudentEmails] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');

  const handleAssign = async () => {
    setLoading(true);
    setErr('');
    setResult(null);
    try {
      let res;
      if (mode === 'jd') {
        res = await assessmentAPI.assignStudentsFromJD(assessmentId);
      } else {
        const emails = studentEmails.split(/[\n,]+/).map(s => s.trim().toLowerCase()).filter(Boolean);
        if (!emails.length) { setErr('Enter at least one student email'); setLoading(false); return; }
        const invalidEmails = emails.filter(e => !e.includes('@'));
        if (invalidEmails.length > 0) { setErr(`Invalid emails: ${invalidEmails.join(', ')}`); setLoading(false); return; }
        res = await assessmentAPI.assignStudentsManual(assessmentId, emails);
      }
      if (res.success) {
        setResult(res.message || `Assigned ${res.assigned || 0} students`);
      } else {
        setErr(res.message || 'Assignment failed');
      }
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-gray-900">Assign Students</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMode('jd')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${mode === 'jd' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Auto from JD
          </button>
          <button
            onClick={() => setMode('manual')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${mode === 'manual' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Manual (Emails)
          </button>
        </div>

        {mode === 'jd' ? (
          <p className="text-sm text-gray-600 bg-blue-50 rounded-xl p-4 mb-4">
            Automatically assigns students who match the eligibility criteria of the linked Job Description.
            Requires a JD to be linked to this assessment.
          </p>
        ) : (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Student Emails (one per line or comma-separated)
            </label>
            <textarea
              rows={5}
              value={studentEmails}
              onChange={e => setStudentEmails(e.target.value)}
              placeholder={"student1@college.edu\nstudent2@college.edu"}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        )}

        {err && (
          <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
            <AlertCircle className="w-4 h-4" /> {err}
          </div>
        )}
        {result && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl p-3 mb-4">
            <CheckCircle2 className="w-4 h-4" /> {result}
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-700 font-medium">Cancel</button>
          <button
            onClick={handleAssign}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold disabled:opacity-60"
          >
            {loading ? <LoadingSpinner size="sm" /> : <UserPlus className="w-4 h-4" />}
            {loading ? 'Assigning...' : 'Assign'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── View Assigned Students Modal ──────────────────────────────────────────────
const ViewAssignedStudentsModal = ({ assessmentId, assessmentName, onClose }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchStudents(1); }, []);

  const fetchStudents = async (p = 1) => {
    setLoading(true);
    setError('');
    try {
      const res = await assessmentAPI.getEligibleStudents(assessmentId, { page: p, limit: 10 });
      if (res.success) {
        setStudents(res.students || []);
        setTotal(res.total || 0);
        setTotalPages(res.pages || 1);
        setPage(p);
      } else {
        setError(res.message || 'Failed to load students');
      }
    } catch (e) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const filtered = search.trim()
    ? students.filter(s =>
        s.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        s.email?.toLowerCase().includes(search.toLowerCase()) ||
        s.mobileNumber?.includes(search)
      )
    : students;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Assigned Students</h3>
            <p className="text-sm text-gray-500 mt-0.5">{assessmentName} · {total} student{total !== 1 ? 's' : ''} assigned</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-gray-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, or phone..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
              <p className="text-red-600 font-medium">{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-700 font-semibold mb-1">
                {search ? 'No matching students' : 'No students assigned yet'}
              </p>
              <p className="text-gray-400 text-sm">
                {search ? 'Try a different search term' : 'Use "Assign Students" to add students to this assessment'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((s, idx) => (
                <div key={s._id || idx}
                  className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-blue-50 rounded-xl border border-gray-100 hover:border-blue-200 transition-all group">
                  {/* Avatar */}
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    <span className="text-white font-bold text-sm">
                      {(s.fullName || 'S').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                    </span>
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{s.fullName || '—'}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                      {s.email && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Mail className="w-3 h-3" />{s.email}
                        </span>
                      )}
                      {s.mobileNumber && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Phone className="w-3 h-3" />{s.mobileNumber}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Badge */}
                  <span className="flex-shrink-0 px-2.5 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                    Assigned
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && !error && total > 10 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <span className="text-xs text-gray-500">
              Page {page} of {totalPages} · {total} total
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchStudents(page - 1)}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-all"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => fetchStudents(page + 1)}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-all text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const QuestionManager = () => {
  const { assessmentId } = useParams();
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // null | { type: 'add'|'edit'|'assign'|'view-students', question? }
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => { fetchData(); }, [assessmentId]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await assessmentAPI.getAssessment(assessmentId);
      if (res.success) {
        setAssessment(res.assessment);
        // questions_id is populated array of Question docs when fetching single assessment
        setQuestions(
          (res.assessment.questions_id || []).filter(q => q && q.status !== 'inactive')
        );
      } else {
        setError(res.message || 'Failed to load assessment');
      }
    } catch (err) {
      setError(err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveQuestion = async (payload) => {
    setSaving(true);
    try {
      let res;
      if (modal?.type === 'edit' && modal.question) {
        res = await assessmentAPI.updateQuestion(modal.question._id, payload);
        if (res.success) showToast('Question updated!');
      } else {
        // add-question: creates AND attaches to assessment
        res = await assessmentAPI.addQuestionToAssessment(assessmentId, payload);
        if (res.success) showToast('Question added!');
      }
      if (res?.success) {
        fetchData();
        setModal(null);
      } else {
        showToast(res?.message || 'Operation failed', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Error', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (qId) => {
    try {
      const res = await assessmentAPI.deleteQuestion(qId);
      if (res.success) {
        showToast('Question deleted');
        setQuestions(prev => prev.filter(q => q._id !== qId));
      } else {
        showToast(res.message || 'Delete failed', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Error', 'error');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const getCorrectDisplay = (q) => {
    if (q.type === 'fill_up') return `"${q.correct_answer}"`;
    if (q.type === 'multiple_answer') {
      const ans = Array.isArray(q.correct_answer) ? q.correct_answer : [q.correct_answer];
      return ans.join(', ');
    }
    return q.correct_answer || '—';
  };

  if (loading) return (
    <DashboardLayout title="Manage Questions">
      <div className="flex items-center justify-center py-24"><LoadingSpinner /></div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout title="Manage Questions">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Toast */}
        {toast && (
          <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-medium
            ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
            {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            {toast.msg}
          </div>
        )}

        {/* Back */}
        <button
          onClick={() => navigate('/dashboard/college-admin/assessments')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Assessments
        </button>

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {assessment?.skill_id?.name || 'Assessment'} — {assessment?.level}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {questions.length} question{questions.length !== 1 ? 's' : ''}
                {' · '}
                {assessment?.eligible_students?.length || 0} eligible student{assessment?.eligible_students?.length !== 1 ? 's' : ''}
                {' · '}
                <span className={`font-medium ${assessment?.status === 'active' ? 'text-green-600' : 'text-gray-500'}`}>
                  {assessment?.status}
                </span>
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setModal({ type: 'view-students' })}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all"
              >
                <Eye className="w-4 h-4" /> View Students
                {(assessment?.eligible_students?.length || 0) > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                    {assessment.eligible_students.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setModal({ type: 'assign' })}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
              >
                <Users className="w-4 h-4" /> Assign Students
              </button>
              <button
                onClick={() => setModal({ type: 'add' })}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl text-sm font-medium hover:from-blue-700 hover:to-cyan-700 transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" /> Add Question
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />{error}
          </div>
        )}

        {/* Questions list */}
        {!error && questions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Questions Yet</h3>
            <p className="text-gray-500 text-sm mb-5">Add questions to this assessment.</p>
            <button
              onClick={() => setModal({ type: 'add' })}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-cyan-700"
            >
              <Plus className="w-4 h-4" /> Add First Question
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {questions.map((q, idx) => (
              <div key={q._id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start gap-3">
                  <span className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{q.type?.replace('_', ' ')}</span>
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{q.level}</span>
                      <span className="text-xs text-gray-400">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
                    </div>
                    <p className="font-medium text-gray-900 text-sm">{q.question}</p>

                    {/* Options for MCQ */}
                    {(q.type === 'single_answer' || q.type === 'multiple_answer') && q.options?.length > 0 && (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {q.options.map((opt) => {
                          const isCorrect = Array.isArray(q.correct_answer)
                            ? q.correct_answer.includes(opt.label)
                            : q.correct_answer === opt.label;
                          return (
                            <div key={opt.label} className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg
                              ${isCorrect ? 'bg-green-100 text-green-800 font-medium' : 'bg-gray-50 text-gray-600'}`}>
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                                ${isCorrect ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                {opt.label}
                              </span>
                              {opt.text}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Fill-up answer */}
                    {q.type === 'fill_up' && (
                      <p className="mt-2 text-xs text-green-700 bg-green-50 px-3 py-1.5 rounded-lg inline-block">
                        ✓ Answer: {q.correct_answer}
                      </p>
                    )}

                    {q.explanation && (
                      <p className="mt-2 text-xs text-gray-500 italic">💡 {q.explanation}</p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => setModal({ type: 'edit', question: q })}
                      className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(q._id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {(modal?.type === 'add' || modal?.type === 'edit') && (
        <QuestionModal
          question={modal.question}
          onSave={handleSaveQuestion}
          onClose={() => setModal(null)}
          saving={saving}
        />
      )}
      {modal?.type === 'assign' && (
        <AssignStudentsModal
          assessmentId={assessmentId}
          onClose={() => { setModal(null); fetchData(); }}
        />
      )}
      {modal?.type === 'view-students' && (
        <ViewAssignedStudentsModal
          assessmentId={assessmentId}
          assessmentName={`${assessment?.skill_id?.name || 'Assessment'} — ${assessment?.level}`}
          onClose={() => setModal(null)}
        />
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-1">Delete Question?</h3>
            <p className="text-gray-500 text-sm mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-medium">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default QuestionManager;