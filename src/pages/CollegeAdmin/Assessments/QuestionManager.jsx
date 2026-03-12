// pages/CollegeAdmin/Assessments/QuestionManager.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Plus, Trash2, Edit, Save, X, ChevronLeft,
  AlertCircle, CheckCircle2, BookOpen, Users, UserPlus,
  Mail, Phone, Search, ChevronRight, Eye, ListChecks,
  Target, Clock, ChevronLeft as ChevronLeftIcon,
} from 'lucide-react';
import CollegeAdminLayout from '../../../components/layout/CollegeAdminLayout';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { assessmentAPI } from '../../../api/Api';

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

const questionToForm = (q) => ({
  question: q.question || '',
  type: q.type || 'single_answer',
  level: q.level || 'Beginner',
  options: q.options?.length ? q.options.map(o => o.text || '') : ['', '', '', ''],
  correct_answer: Array.isArray(q.correct_answer) ? q.correct_answer : (q.correct_answer || 'A'),
  explanation: q.explanation || '',
  marks: q.marks || 1,
});

const BLANK_FORM = { question:'', type:'single_answer', level:'Beginner', options:['','','',''], correct_answer:'A', explanation:'', marks:1 };

const inp = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white/80 transition-all";

/* ─── Question Modal ─────────────────────────────────────────────────── */
const QuestionModal = ({ question, onSave, onClose, saving }) => {
  const [form, setForm] = useState(question ? questionToForm(question) : { ...BLANK_FORM });

  const setOpt = (idx, val) => setForm(prev => { const opts=[...prev.options]; opts[idx]=val; return {...prev,options:opts}; });
  const isChoiceType = form.type==='single_answer'||form.type==='multiple_answer';
  const isFillUp = form.type==='fill_up';

  const toggleMulti = (label) => setForm(prev => {
    const cur = Array.isArray(prev.correct_answer) ? prev.correct_answer : [];
    return { ...prev, correct_answer: cur.includes(label) ? cur.filter(l=>l!==label) : [...cur,label] };
  });

  const handleSave = () => {
    if (!form.question.trim()) return;
    if (isChoiceType && form.options.some(o=>!o.trim())) return;
    const payload = { question:form.question.trim(), type:form.type, level:form.level, marks:Number(form.marks)||1, explanation:form.explanation||undefined };
    if (isChoiceType) {
      payload.options = form.options.map((text,i)=>({ label:OPTION_LABELS[i], text:text.trim() }));
      payload.correct_answer = form.type==='multiple_answer'
        ? (Array.isArray(form.correct_answer)?form.correct_answer:[form.correct_answer])
        : (typeof form.correct_answer==='string'?form.correct_answer:'A');
    }
    if (isFillUp) payload.correct_answer = typeof form.correct_answer==='string'?form.correct_answer:'';
    onSave(payload);
  };

  const canSave = form.question.trim() &&
    (!isChoiceType||form.options.every(o=>o.trim())) &&
    (!isFillUp||(typeof form.correct_answer==='string'&&form.correct_answer.trim()));

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-500/20 border border-white/60 max-w-xl w-full my-8">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              {question ? <Edit className="w-4 h-4 text-white" /> : <Plus className="w-4 h-4 text-white" />}
            </div>
            <h3 className="font-bold text-white">{question ? 'Edit Question' : 'Add Question'}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-all"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Question <span className="text-red-500">*</span></label>
            <textarea rows={3} value={form.question} onChange={e => setForm(prev=>({...prev,question:e.target.value}))}
              placeholder="Enter the question..." className={`${inp} resize-none`} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Type</label>
              <select value={form.type} onChange={e => setForm(prev=>({...prev,type:e.target.value,correct_answer:e.target.value==='multiple_answer'?[]:'A'}))} className={inp}>
                <option value="single_answer">Single Answer (MCQ)</option>
                <option value="multiple_answer">Multiple Answer</option>
                <option value="fill_up">Fill in the Blank</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Level</label>
              <select value={form.level} onChange={e => setForm(prev=>({...prev,level:e.target.value}))} className={inp}>
                <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
              </select>
            </div>
          </div>

          {isChoiceType && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Options <span className="text-red-500">*</span>
                <span className="text-xs text-gray-400 ml-1 font-normal">{form.type==='multiple_answer'?'(check all correct)':'(click radio for correct)'}</span>
              </label>
              <div className="space-y-2">
                {OPTION_LABELS.map((label,idx) => {
                  const isCorrect = form.type==='multiple_answer'
                    ? (Array.isArray(form.correct_answer)?form.correct_answer.includes(label):false)
                    : form.correct_answer===label;
                  return (
                    <div key={label} className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all
                      ${isCorrect?'border-blue-400 bg-blue-50':'border-gray-100 bg-gray-50'}`}>
                      {form.type==='multiple_answer'
                        ? <input type="checkbox" checked={isCorrect} onChange={()=>toggleMulti(label)} className="w-4 h-4 text-blue-600 rounded" />
                        : <input type="radio" name="correctAnswer" checked={isCorrect} onChange={()=>setForm(prev=>({...prev,correct_answer:label}))} className="w-4 h-4 text-blue-600" />}
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                        ${isCorrect?'bg-gradient-to-br from-blue-500 to-cyan-500 text-white':'bg-gray-200 text-gray-600'}`}>{label}</span>
                      <input type="text" value={form.options[idx]} onChange={e=>setOpt(idx,e.target.value)}
                        placeholder={`Option ${label}`} className="flex-1 bg-transparent text-sm focus:outline-none text-gray-700 placeholder-gray-400" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {isFillUp && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Correct Answer <span className="text-red-500">*</span></label>
              <input type="text" value={typeof form.correct_answer==='string'?form.correct_answer:''} onChange={e=>setForm(prev=>({...prev,correct_answer:e.target.value}))}
                placeholder="Enter the exact correct answer" className={inp} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Marks</label>
              <input type="number" min={0.25} step={0.25} value={form.marks} onChange={e=>setForm(prev=>({...prev,marks:e.target.value}))} className={inp} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Explanation (optional)</label>
              <input type="text" value={form.explanation} onChange={e=>setForm(prev=>({...prev,explanation:e.target.value}))} placeholder="Brief explanation…" className={inp} />
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold text-sm">Cancel</button>
          <button onClick={handleSave} disabled={saving||!canSave}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl font-bold text-sm disabled:opacity-60 hover:opacity-90 transition-all shadow-md shadow-blue-500/20">
            {saving ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving…' : 'Save Question'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Assign Students Modal ──────────────────────────────────────────── */
const AssignStudentsModal = ({ assessmentId, onClose }) => {
  const [mode, setMode] = useState('jd');
  const [studentEmails, setStudentEmails] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');

  const handleAssign = async () => {
    setLoading(true); setErr(''); setResult(null);
    try {
      let res;
      if (mode==='jd') {
        res = await assessmentAPI.assignStudentsFromJD(assessmentId);
      } else {
        const emails = studentEmails.split(/[\n,]+/).map(s=>s.trim().toLowerCase()).filter(Boolean);
        if (!emails.length) { setErr('Enter at least one student email'); setLoading(false); return; }
        const invalid = emails.filter(e=>!e.includes('@'));
        if (invalid.length) { setErr(`Invalid emails: ${invalid.join(', ')}`); setLoading(false); return; }
        res = await assessmentAPI.assignStudentsManual(assessmentId, emails);
      }
      if (res.success) setResult(res.message || `Assigned ${res.assigned||0} students`);
      else setErr(res.message || 'Assignment failed');
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-500/20 border border-white/60 max-w-md w-full">
        <div className="px-5 py-4 bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center"><UserPlus className="w-4 h-4 text-white" /></div>
            <h3 className="font-bold text-white">Assign Students</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex gap-2">
            {['jd','manual'].map(m => (
              <button key={m} onClick={()=>setMode(m)}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all
                  ${mode===m ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-500/20' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                {m==='jd' ? 'Auto from JD' : 'Manual (Emails)'}
              </button>
            ))}
          </div>

          {mode==='jd' ? (
            <div className="flex items-start gap-3 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
              <Users className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
              Automatically assigns students who match the eligibility criteria of the linked Job Description. Requires a JD to be linked.
            </div>
          ) : (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Student Emails (one per line or comma-separated)</label>
              <textarea rows={5} value={studentEmails} onChange={e=>setStudentEmails(e.target.value)}
                placeholder={"student1@college.edu\nstudent2@college.edu"}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none bg-white/80" />
            </div>
          )}

          {err && <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3"><AlertCircle className="w-4 h-4" />{err}</div>}
          {result && <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-xl p-3"><CheckCircle2 className="w-4 h-4" />{result}</div>}

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-semibold text-sm hover:bg-gray-50">Cancel</button>
            <button onClick={handleAssign} disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl font-bold text-sm disabled:opacity-60 hover:opacity-90 shadow-md shadow-blue-500/20">
              {loading ? <LoadingSpinner size="sm" /> : <UserPlus className="w-4 h-4" />}
              {loading ? 'Assigning…' : 'Assign'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── View Assigned Students Modal ───────────────────────────────────── */
const ViewAssignedStudentsModal = ({ assessmentId, assessmentName, onClose }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchStudents(1); }, []);

  const fetchStudents = async (p=1) => {
    setLoading(true); setError('');
    try {
      const res = await assessmentAPI.getEligibleStudents(assessmentId, { page:p, limit:10 });
      if (res.success) { setStudents(res.students||[]); setTotal(res.total||0); setTotalPages(res.pages||1); setPage(p); }
      else setError(res.message||'Failed to load students');
    } catch (e) { setError(e.message||'Failed to load'); }
    finally { setLoading(false); }
  };

  const filtered = search.trim()
    ? students.filter(s => s.fullName?.toLowerCase().includes(search.toLowerCase()) || s.email?.toLowerCase().includes(search.toLowerCase()) || s.mobileNumber?.includes(search))
    : students;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-500/20 border border-white/60 w-full max-w-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 rounded-t-2xl flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center"><Users className="w-4 h-4 text-white" /></div>
            <div>
              <h3 className="font-bold text-white">Assigned Students</h3>
              <p className="text-blue-200 text-[11px] mt-0.5">{assessmentName} · {total} student{total!==1?'s':''}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white"><X className="w-4 h-4" /></button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-gray-100 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Search by name, email or phone…"
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white/80" />
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="w-10 h-10 text-red-400 mb-3" /><p className="text-red-600 font-medium">{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center mb-4"><Users className="w-8 h-8 text-blue-400" /></div>
              <p className="text-gray-700 font-bold mb-1">{search?'No matching students':'No students assigned yet'}</p>
              <p className="text-gray-400 text-sm">{search?'Try a different search term':'Use "Assign Students" to add students to this assessment'}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((s,idx) => (
                <div key={s._id||idx} className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-blue-50/60 rounded-xl border border-gray-100 hover:border-blue-200 transition-all group">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                    <span className="text-white font-bold text-sm">{(s.fullName||'S').split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{s.fullName||'—'}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                      {s.email && <span className="flex items-center gap-1 text-xs text-gray-500"><Mail className="w-3 h-3" />{s.email}</span>}
                      {s.mobileNumber && <span className="flex items-center gap-1 text-xs text-gray-500"><Phone className="w-3 h-3" />{s.mobileNumber}</span>}
                    </div>
                  </div>
                  <span className="flex-shrink-0 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-100 text-xs font-bold rounded-full">Assigned</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && !error && total>10 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 shrink-0">
            <span className="text-xs text-gray-400">Page {page} of {totalPages} · {total} total</span>
            <div className="flex items-center gap-2">
              <button onClick={()=>fetchStudents(page-1)} disabled={page<=1} className="p-1.5 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-all"><ChevronLeftIcon className="w-4 h-4" /></button>
              <button onClick={()=>fetchStudents(page+1)} disabled={page>=totalPages} className="p-1.5 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-all"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}

        <div className="px-5 py-4 border-t border-gray-100 shrink-0">
          <button onClick={onClose} className="w-full py-2.5 border border-gray-200 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-all text-sm">Close</button>
        </div>
      </div>
    </div>
  );
};

/* ─── Main ───────────────────────────────────────────────────────────── */
const QuestionManager = () => {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const [assessment,    setAssessment]    = useState(null);
  const [questions,     setQuestions]     = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [modal,         setModal]         = useState(null);
  const [saving,        setSaving]        = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast,         setToast]         = useState(null);

  useEffect(() => { fetchData(); }, [assessmentId]);

  const fetchData = async () => {
    setLoading(true); setError('');
    try {
      const res = await assessmentAPI.getAssessment(assessmentId);
      if (res.success) {
        setAssessment(res.assessment);
        setQuestions((res.assessment.questions_id||[]).filter(q=>q&&q.status!=='inactive'));
      } else { setError(res.message||'Failed to load assessment'); }
    } catch (err) { setError(err.message||'Failed to load'); }
    finally { setLoading(false); }
  };

  const showToast = (msg, type='success') => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  const handleSaveQuestion = async (payload) => {
    setSaving(true);
    try {
      let res;
      if (modal?.type==='edit'&&modal.question) {
        res = await assessmentAPI.updateQuestion(modal.question._id, payload);
        if (res.success) showToast('Question updated!');
      } else {
        res = await assessmentAPI.addQuestionToAssessment(assessmentId, payload);
        if (res.success) showToast('Question added!');
      }
      if (res?.success) { fetchData(); setModal(null); }
      else showToast(res?.message||'Operation failed','error');
    } catch (err) { showToast(err.message||'Error','error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (qId) => {
    try {
      const res = await assessmentAPI.deleteQuestion(qId);
      if (res.success) { showToast('Question deleted'); setQuestions(prev=>prev.filter(q=>q._id!==qId)); }
      else showToast(res.message||'Delete failed','error');
    } catch (err) { showToast(err.message||'Error','error'); }
    finally { setDeleteConfirm(null); }
  };

  const totalMarks = questions.reduce((s,q)=>s+(Number(q.marks)||0),0);

  if (loading) return <CollegeAdminLayout><div className="flex items-center justify-center py-24"><LoadingSpinner /></div></CollegeAdminLayout>;

  return (
    <CollegeAdminLayout>
      <div className="max-w-4xl mx-auto space-y-5 pb-8">

        {/* Toast */}
        {toast && (
          <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold
            ${toast.type==='error'?'bg-red-600 text-white':'bg-green-600 text-white'}`}>
            {toast.type==='error'?<AlertCircle className="w-4 h-4"/>:<CheckCircle2 className="w-4 h-4"/>}{toast.msg}
          </div>
        )}

        {/* Back */}
        <button onClick={()=>navigate('/dashboard/college-admin/assessments')}
          className="flex items-center gap-1.5 text-gray-500 hover:text-blue-600 text-sm font-medium transition-colors group">
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Back to Assessments
        </button>

        {/* Hero Banner */}
        <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 rounded-2xl px-5 py-4 shadow-xl shadow-blue-500/20 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute inset-0 opacity-[0.06]" style={{backgroundImage:'radial-gradient(circle,white 1px,transparent 1px)',backgroundSize:'18px 18px'}} />
          </div>
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center border border-white/20 flex-shrink-0">
                <ListChecks className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-white font-black text-lg leading-tight">
                  {assessment?.skill_id?.name || 'Assessment'} — {assessment?.level}
                </h1>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  <span className="inline-flex items-center gap-1 bg-white/15 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white border border-white/20">
                    <Target className="w-3 h-3" /> {questions.length} Questions
                  </span>
                  <span className="inline-flex items-center gap-1 bg-white/15 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white border border-white/20">
                    <Users className="w-3 h-3" /> {assessment?.eligible_students?.length||0} Students
                  </span>
                  {assessment?.duration_minutes && (
                    <span className="inline-flex items-center gap-1 bg-white/15 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white border border-white/20">
                      <Clock className="w-3 h-3" /> {assessment.duration_minutes}m
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
              <button onClick={()=>setModal({type:'view-students'})}
                className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-2 rounded-xl border border-white/30 transition-all">
                <Eye className="w-3.5 h-3.5" /> View Students
                {(assessment?.eligible_students?.length||0)>0 && (
                  <span className="ml-0.5 px-1.5 py-0.5 bg-white/30 text-white text-[10px] font-bold rounded-full">{assessment.eligible_students.length}</span>
                )}
              </button>
              <button onClick={()=>setModal({type:'assign'})}
                className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-2 rounded-xl border border-white/30 transition-all">
                <Users className="w-3.5 h-3.5" /> Assign Students
              </button>
              <button onClick={()=>setModal({type:'add'})}
                className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-2 rounded-xl border border-white/30 transition-all">
                <Plus className="w-3.5 h-3.5" /> Add Question
              </button>
            </div>
          </div>
        </div>

        {/* Stat pills */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { icon:ListChecks, label:'Questions',   value:questions.length },
              { icon:Target,     label:'Total Marks', value:totalMarks       },
              { icon:Users,      label:'Students',    value:assessment?.eligible_students?.length||0 },
              { icon:Clock,      label:'Duration',    value:`${assessment?.duration_minutes||0}m`    },
            ].map(({icon:Icon,label,value}) => (
              <div key={label} className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl">
                <Icon className="w-4 h-4 flex-shrink-0 opacity-70" />
                <div className="min-w-0">
                  <p className="text-sm font-black leading-none">{value}</p>
                  <p className="text-[9px] font-medium opacity-60 mt-0.5 leading-none truncate">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-700"><AlertCircle className="w-8 h-8 mx-auto mb-2"/>{error}</div>}

        {/* Questions */}
        {!error && questions.length===0 ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-700 mb-2">No Questions Yet</h3>
            <p className="text-gray-400 text-sm mb-6">Add questions to this assessment.</p>
            <button onClick={()=>setModal({type:'add'})}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 hover:opacity-90">
              <Plus className="w-4 h-4" /> Add First Question
            </button>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-100 flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
                <ListChecks className="w-3 h-3 text-white" />
              </div>
              <p className="font-bold text-gray-800 text-sm">{questions.length} Question{questions.length!==1?'s':''}</p>
            </div>
            <div className="divide-y divide-gray-50">
              {questions.map((q,idx) => (
                <div key={q._id} className="p-5 hover:bg-blue-50/20 transition-colors group">
                  <div className="flex items-start gap-3">
                    <span className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 text-white rounded-xl flex items-center justify-center text-sm font-bold shrink-0 shadow-sm">
                      {idx+1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full font-semibold capitalize">{q.type?.replace('_',' ')}</span>
                        <span className="text-[10px] bg-cyan-50 text-cyan-600 border border-cyan-100 px-2 py-0.5 rounded-full font-semibold">{q.level}</span>
                        <span className="text-[10px] text-gray-400 font-medium">{q.marks} mark{q.marks!==1?'s':''}</span>
                      </div>
                      <p className="font-semibold text-gray-900 text-sm">{q.question}</p>

                      {(q.type==='single_answer'||q.type==='multiple_answer')&&q.options?.length>0 && (
                        <div className="mt-3 grid grid-cols-2 gap-1.5">
                          {q.options.map(opt => {
                            const isCorrect = Array.isArray(q.correct_answer)?q.correct_answer.includes(opt.label):q.correct_answer===opt.label;
                            return (
                              <div key={opt.label} className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg
                                ${isCorrect?'bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 text-blue-800 font-medium':'bg-gray-50 border border-gray-100 text-gray-600'}`}>
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                                  ${isCorrect?'bg-gradient-to-br from-blue-500 to-cyan-500 text-white':'bg-gray-200 text-gray-500'}`}>{opt.label}</span>
                                {opt.text}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {q.type==='fill_up' && (
                        <p className="mt-2 text-xs text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg inline-block">
                          ✓ Answer: {q.correct_answer}
                        </p>
                      )}
                      {q.explanation && <p className="mt-2 text-xs text-gray-400 italic">💡 {q.explanation}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button onClick={()=>setModal({type:'edit',question:q})} className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"><Edit className="w-4 h-4"/></button>
                      <button onClick={()=>setDeleteConfirm(q._id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {(modal?.type==='add'||modal?.type==='edit') && <QuestionModal question={modal.question} onSave={handleSaveQuestion} onClose={()=>setModal(null)} saving={saving} />}
      {modal?.type==='assign' && <AssignStudentsModal assessmentId={assessmentId} onClose={()=>{setModal(null);fetchData();}} />}
      {modal?.type==='view-students' && <ViewAssignedStudentsModal assessmentId={assessmentId} assessmentName={`${assessment?.skill_id?.name||'Assessment'} — ${assessment?.level}`} onClose={()=>setModal(null)} />}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
            <div className="w-12 h-12 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-1">Delete Question?</h3>
            <p className="text-gray-400 text-sm mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={()=>setDeleteConfirm(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold text-sm">Cancel</button>
              <button onClick={()=>handleDelete(deleteConfirm)} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </CollegeAdminLayout>
  );
};

export default QuestionManager;