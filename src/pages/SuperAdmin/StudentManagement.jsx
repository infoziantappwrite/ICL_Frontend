// src/pages/SuperAdmin/StudentManagement.jsx
// FIXED: MHead onClose props, live student list, export preview, response normalization
import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import * as XLSX from 'xlsx';
import SuperAdminDashboardLayout from '../../components/layout/SuperAdminDashboardLayout';
import { useToast } from '../../context/ToastContext';
import { superAdminStudentAPI } from '../../api/studentAPI';
import apiCall from '../../api/Api';
import {
  GraduationCap, CloudUpload, FileDown, Download, RefreshCw, X,
  CheckCircle, AlertTriangle, AlertCircle, FileText, Info,
  Upload, Building2, ChevronRight, UserPlus, UsersRound,
  Plus, Mail, Hash, BookOpen, Star, Calendar, Phone, Eye,
  Trash2, ArrowLeft, Check, UploadCloud, Loader2, Search,
  ChevronLeft, Users, Filter, SortAsc, SortDesc, TrendingUp,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════════ */
const BRANCHES  = ['CSE','ECE','EEE','MECH','CIVIL','IT','AI/ML','DS','Other'];
const SEMESTERS = ['1','2','3','4','5','6','7','8'];
const REQUIRED_COLS = ['name','email','roll_number'];

// Inline API helper for student list (uses existing /colleges/:id/students endpoint)
const getCollegeStudents = (collegeId, params = {}) => {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([,v]) => v !== '' && v != null))
  ).toString();
  return apiCall(`/super-admin/colleges/${collegeId}/students${qs ? `?${qs}` : ''}`);
};

/* ══════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════ */
const Spin = ({ size='md', color='white' }) => {
  const sz = { sm:'w-3.5 h-3.5', md:'w-5 h-5', lg:'w-8 h-8' }[size];
  const cl = { white:'border-white', blue:'border-blue-500', slate:'border-slate-400', indigo:'border-indigo-500' }[color];
  return <div className={`${sz} ${cl} border-2 border-t-transparent rounded-full animate-spin flex-shrink-0`}/>;
};

const BASE_INPUT = 'w-full text-sm border rounded-xl py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition placeholder:text-slate-300';
const I_ICON     = `${BASE_INPUT} pl-9 pr-3`;
const I_PLAIN    = `${BASE_INPUT} px-3`;
const OK_CLS  = 'border-slate-200';
const ERR_CLS = 'border-red-300 bg-red-50/40';

const Field = ({ label, required, icon: Icon, error, hint, children }) => (
  <div>
    <label className="text-xs font-bold text-slate-700 block mb-1.5">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    <div className="relative">
      {Icon && <Icon size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10"/>}
      {children}
    </div>
    {error && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11}/>{error}</p>}
    {!error && hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
  </div>
);

/* ── Portal Modal (renders to document.body → above sidebar z-50) ── */
const Modal = ({ children, onClose, size = 'lg' }) => {
  const w = { sm:'max-w-md', md:'max-w-xl', lg:'max-w-2xl', xl:'max-w-4xl', full:'max-w-6xl' }[size];

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 9999 }}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm"/>
      <div
        className={`relative w-full ${w} max-h-[92vh] flex flex-col`}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};

/* ── Gradient modal header ── */
const MHead = ({ icon: Icon, title, sub, onClose, gradient = 'from-blue-700 via-blue-600 to-cyan-500' }) => (
  <div className={`bg-gradient-to-r ${gradient} px-6 py-5 flex-shrink-0 rounded-t-2xl`}>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-white"/>
        </div>
        <div>
          <h2 className="text-white font-black text-base leading-tight">{title}</h2>
          {sub && <p className="text-blue-200 text-xs mt-0.5">{sub}</p>}
        </div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="w-8 h-8 bg-white/10 hover:bg-white/25 rounded-lg flex items-center justify-center text-white transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4"/>
        </button>
      )}
    </div>
  </div>
);

/* ── Preview field ── */
const PField = ({ label, value, full }) => (
  <div className={full ? 'col-span-2' : ''}>
    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5">{label}</p>
    <p className="text-sm font-semibold text-slate-800 break-all">
      {value != null && value !== '' ? value : <span className="text-slate-300 italic text-xs">—</span>}
    </p>
  </div>
);

/* ── Section heading ── */
const SHead = ({ icon: Icon, title, sub }) => (
  <div className="flex items-center gap-2">
    <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
      <Icon className="w-3.5 h-3.5 text-white"/>
    </div>
    <div>
      <h3 className="text-sm font-bold text-gray-800 leading-none">{title}</h3>
      {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

/* ── Client-side row validator (mirrors backend) ── */
const validateRow = (row) => {
  const e = {};
  const name  = (row['name']||row['full_name']||'').trim();
  const email = (row['email']||'').trim().toLowerCase();
  const roll  = (row['roll_number']||row['rollnumber']||row['roll_no']||'').trim();
  if (!name)  e['name']        = 'Name is required';
  if (!email) e['email']       = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e['email'] = 'Invalid email format';
  if (!roll)  e['roll_number'] = 'Roll number is required';
  const phone = (row['phone']||'').trim();
  if (phone && !/^[0-9]{10}$/.test(phone)) e['phone'] = 'Must be 10 digits';
  const branch = (row['branch']||'').trim().toUpperCase();
  if (branch && !BRANCHES.map(b=>b.toUpperCase()).includes(branch)) e['branch'] = `Must be: ${BRANCHES.join(', ')}`;
  const sem = row['semester'];
  if (sem && sem !== '' && (isNaN(sem)||+sem<1||+sem>10)) e['semester'] = 'Must be 1–10';
  const cgpa = row['cgpa'];
  if (cgpa && cgpa !== '' && (isNaN(cgpa)||+cgpa<0||+cgpa>10)) e['cgpa'] = 'Must be 0.0–10.0';
  return e;
};

/* ── Download helper: generate Excel from result data ── */
const downloadResultsAsExcel = (students, filename = 'students_created.xlsx') => {
  const rows = students.map((s, i) => ({
    '#':                 i + 1,
    'Full Name':         s.fullName     || '',
    'Email':             s.email        || '',
    'Roll Number':       s.rollNumber   || '',
    'Branch':            s.branch       || '',
    'Batch':             s.batch        || '',
    'Phone':             s.phone        || '',
    'Temporary Password':s.temporaryPassword || '',
    'Email Sent':        s.emailSent ? 'Yes' : 'No',
    'First Login':       'Required',
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    {wch:4},{wch:22},{wch:30},{wch:16},{wch:10},{wch:8},{wch:14},{wch:18},{wch:12},{wch:14},
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Created Students');
  XLSX.writeFile(wb, filename);
};

/* ══════════════════════════════════════════════════════════
   MODAL 1 — ADD SINGLE STUDENT
══════════════════════════════════════════════════════════ */
const EMPTY_FORM = {
  fullName:'', email:'', rollNumber:'', collegeId:'',
  branch:'', semester:'', cgpa:'', batch:'', phone:'',
};

function AddSingleModal({ colleges, onClose, onDone }) {
  const toast = useToast();
  const [step, setStep]     = useState('form');
  const [form, setForm]     = useState(EMPTY_FORM);
  const [errs, setErrs]     = useState({});
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  const set = (k, v) => { setForm(p=>({...p,[k]:v})); if(errs[k]) setErrs(p=>({...p,[k]:''})); };

  const validate = () => {
    const e = {};
    if (!form.fullName.trim())   e.fullName   = 'Required';
    if (!form.email.trim())      e.email      = 'Required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
    if (!form.rollNumber.trim()) e.rollNumber = 'Required';
    if (!form.collegeId)         e.collegeId  = 'Please select a college';
    if (form.phone    && !/^[0-9]{10}$/.test(form.phone))                           e.phone    = 'Must be 10 digits';
    if (form.cgpa     && (isNaN(form.cgpa)    ||+form.cgpa<0    ||+form.cgpa>10))   e.cgpa    = '0.0–10.0';
    if (form.semester && (isNaN(form.semester)||+form.semester<1||+form.semester>10)) e.semester = '1–10';
    return e;
  };

  const goPreview = () => { const e = validate(); if(Object.keys(e).length){setErrs(e);return;} setStep('preview'); };

  const confirm = async () => {
    setSaving(true);
    try {
      const payload = {
        fullName:   form.fullName.trim(),
        email:      form.email.trim().toLowerCase(),
        rollNumber: form.rollNumber.trim(),
        collegeId:  form.collegeId,
        ...(form.branch   && { branch:   form.branch }),
        ...(form.batch    && { batch:    form.batch.trim() }),
        ...(form.phone    && { phone:    form.phone.trim() }),
        ...(form.semester && { semester: parseInt(form.semester) }),
        ...(form.cgpa     && { cgpa:     parseFloat(form.cgpa) }),
      };
      const r = await superAdminStudentAPI.addStudent(payload);
      setResult(r.data); setStep('done');
      toast.success('Student Added', r.message);
      onDone?.();
    } catch(e) { toast.error('Failed', e.message); }
    finally { setSaving(false); }
  };

  const college = colleges.find(c => c._id === form.collegeId);

  /* DONE */
  if (step === 'done') return (
    <Modal onClose={onClose} size="md">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
        <MHead icon={CheckCircle} title="Student Created!" sub="Temporary password sent to student's email" onClose={onClose}/>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center text-white font-black text-xl flex-shrink-0">
              {result?.fullName?.charAt(0)?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-black text-slate-800">{result?.fullName}</p>
              <p className="text-xs text-slate-400 mt-0.5 truncate">{result?.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl">
            <PField label="Roll Number"        value={result?.rollNumber}/>
            <PField label="Temporary Password" value={result?.temporaryPassword}/>
          </div>
          <div className={`flex items-center gap-2 text-sm p-3 rounded-xl ${result?.emailSent?'bg-blue-50 text-blue-700':'bg-amber-50 text-amber-700'}`}>
            <Mail size={14} className="flex-shrink-0"/>
            {result?.emailSent ? 'Welcome email with password delivered.' : 'Email delivery failed — share credentials manually.'}
          </div>
          <button
            onClick={() => downloadResultsAsExcel([result], `student_${result?.rollNumber}.xlsx`)}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold rounded-xl transition-colors"
          >
            <Download size={14}/> Download Student Details (Excel)
          </button>
          <div className="flex gap-2">
            <button onClick={()=>{setForm(EMPTY_FORM);setResult(null);setStep('form');}} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-colors">Add Another</button>
            <button onClick={onClose} className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-bold rounded-xl hover:opacity-90">Done</button>
          </div>
        </div>
      </div>
    </Modal>
  );

  /* PREVIEW */
  if (step === 'preview') return (
    <Modal onClose={onClose} size="md">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
        <MHead icon={Eye} title="Preview — Confirm Details" sub="Review before saving to database" onClose={onClose}/>
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center text-white font-black text-xl flex-shrink-0">
              {form.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-black text-slate-800 text-base">{form.fullName}</p>
              <p className="text-slate-400 text-xs mt-0.5 truncate">{form.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl">
            <PField label="Roll Number" value={form.rollNumber}/>
            <PField label="College"     value={college?.name}/>
            <PField label="Branch"      value={form.branch}/>
            <PField label="Batch"       value={form.batch}/>
            <PField label="Semester"    value={form.semester}/>
            <PField label="CGPA"        value={form.cgpa}/>
            <PField label="Phone"       value={form.phone} full/>
          </div>
          <div className="flex items-center gap-2 text-xs text-amber-700 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <Mail size={13} className="flex-shrink-0"/>
            A <strong>temporary password</strong> is auto-generated and emailed after confirmation.
          </div>
          <div className="flex gap-3">
            <button onClick={()=>setStep('form')} className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-colors">
              <ArrowLeft size={14}/> Edit
            </button>
            <button onClick={confirm} disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 text-white text-sm font-bold rounded-xl disabled:opacity-60 transition-opacity">
              {saving ? <><Spin size="sm"/>Saving…</> : <><Check size={14}/>Confirm & Add Student</>}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );

  /* FORM */
  return (
    <Modal onClose={onClose} size="md">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        <MHead icon={UserPlus} title="Add Single Student" sub="Fill details, preview, then confirm" onClose={onClose}/>
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Field label="Full Name" required icon={GraduationCap} error={errs.fullName}>
                <input className={`${I_ICON} ${errs.fullName?ERR_CLS:OK_CLS}`} placeholder="e.g. Rahul Sharma" value={form.fullName} onChange={e=>set('fullName',e.target.value)}/>
              </Field>
            </div>
            <Field label="Email Address" required icon={Mail} error={errs.email}>
              <input type="email" className={`${I_ICON} ${errs.email?ERR_CLS:OK_CLS}`} placeholder="student@email.com" value={form.email} onChange={e=>set('email',e.target.value)}/>
            </Field>
            <Field label="Roll Number" required icon={Hash} error={errs.rollNumber}>
              <input className={`${I_ICON} ${errs.rollNumber?ERR_CLS:OK_CLS}`} placeholder="e.g. CS2024001" value={form.rollNumber} onChange={e=>set('rollNumber',e.target.value)}/>
            </Field>
            <div className="col-span-2">
              <Field label="College" required icon={Building2} error={errs.collegeId}>
                <select className={`${I_ICON} ${errs.collegeId?ERR_CLS:OK_CLS} appearance-none`} value={form.collegeId} onChange={e=>set('collegeId',e.target.value)}>
                  <option value="">Select college…</option>
                  {colleges.map(c=><option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Branch" icon={BookOpen}>
              <select className={`${I_ICON} ${OK_CLS} appearance-none`} value={form.branch} onChange={e=>set('branch',e.target.value)}>
                <option value="">Select branch…</option>
                {BRANCHES.map(b=><option key={b} value={b}>{b}</option>)}
              </select>
            </Field>
            <Field label="Batch Year" icon={Calendar}>
              <input className={`${I_ICON} ${OK_CLS}`} placeholder="e.g. 2026" value={form.batch} onChange={e=>set('batch',e.target.value)}/>
            </Field>
            <Field label="Semester" icon={BookOpen} error={errs.semester}>
              <select className={`${I_ICON} ${errs.semester?ERR_CLS:OK_CLS} appearance-none`} value={form.semester} onChange={e=>set('semester',e.target.value)}>
                <option value="">Select…</option>
                {SEMESTERS.map(s=><option key={s} value={s}>Semester {s}</option>)}
              </select>
            </Field>
            <Field label="CGPA" icon={Star} error={errs.cgpa}>
              <input className={`${I_ICON} ${errs.cgpa?ERR_CLS:OK_CLS}`} placeholder="0.0–10.0" value={form.cgpa} onChange={e=>set('cgpa',e.target.value)}/>
            </Field>
            <div className="col-span-2">
              <Field label="Phone Number" icon={Phone} error={errs.phone}>
                <input className={`${I_ICON} ${errs.phone?ERR_CLS:OK_CLS}`} placeholder="10-digit mobile number" value={form.phone} onChange={e=>set('phone',e.target.value)}/>
              </Field>
            </div>
          </div>
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
            <Info size={13} className="flex-shrink-0 mt-0.5"/>
            Password is auto-generated and emailed to the student. They must change it on first login.
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-slate-100 flex-shrink-0 bg-blue-50/40">
          <button onClick={onClose} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-colors">Cancel</button>
          <button onClick={goPreview} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 text-white text-sm font-bold rounded-xl transition-opacity">
            <Eye size={14}/> Preview Details
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════════════
   MODAL 2 — ADD MULTIPLE STUDENTS
══════════════════════════════════════════════════════════ */
const newRow = () => ({ id: Date.now() + Math.random(), fullName:'', email:'', rollNumber:'', branch:'', batch:'', phone:'', cgpa:'', semester:'' });

function AddMultipleModal({ colleges, onClose, onDone }) {
  const toast = useToast();
  const [step, setStep]           = useState('form');
  const [rows, setRows]           = useState([newRow(), newRow(), newRow()]);
  const [collegeId, setCollegeId] = useState('');
  const [rowErrs, setRowErrs]     = useState({});
  const [topErr, setTopErr]       = useState('');
  const [saving, setSaving]       = useState(false);
  const [result, setResult]       = useState(null);

  const addRow  = () => setRows(p=>[...p, newRow()]);
  const delRow  = (id) => setRows(p=>p.filter(r=>r.id!==id));
  const setCell = (id, k, v) => {
    setRows(p=>p.map(r=>r.id===id?{...r,[k]:v}:r));
    if(rowErrs[id]?.[k]) setRowErrs(p=>({...p,[id]:{...p[id],[k]:undefined}}));
  };

  const filledRows = rows.filter(r=>r.fullName||r.email||r.rollNumber);

  const validateAll = () => {
    if (!collegeId) { setTopErr('Please select a college first.'); return false; }
    setTopErr('');
    if (!filledRows.length) { setTopErr('Add at least one student row.'); return false; }
    let ok = true;
    const errs = {};
    const emailsSeen = {}, rollsSeen = {};
    filledRows.forEach(r => {
      const e = {};
      if (!r.fullName.trim())   e.fullName   = 'Required';
      if (!r.email.trim())      e.email      = 'Required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email)) e.email = 'Invalid email';
      if (!r.rollNumber.trim()) e.rollNumber = 'Required';
      if (r.phone    && !/^[0-9]{10}$/.test(r.phone.trim()))            e.phone    = '10 digits';
      if (r.cgpa     && (isNaN(r.cgpa)    ||+r.cgpa<0    ||+r.cgpa>10)) e.cgpa    = '0–10';
      if (r.semester && (isNaN(r.semester)||+r.semester<1||+r.semester>10)) e.semester = '1–10';
      const em   = r.email.trim().toLowerCase();
      const roll = r.rollNumber.trim();
      if (em   && emailsSeen[em]   !== undefined) e.email      = 'Duplicate email in list';
      else if (em)   emailsSeen[em]   = r.id;
      if (roll && rollsSeen[roll] !== undefined) e.rollNumber = 'Duplicate roll no. in list';
      else if (roll) rollsSeen[roll] = r.id;
      if (Object.keys(e).length) { errs[r.id] = e; ok = false; }
    });
    setRowErrs(errs);
    return ok;
  };

  const goPreview = () => { if (validateAll()) setStep('preview'); };

  const confirm = async () => {
    setSaving(true);
    try {
      const payload = filledRows.map(r=>({
        fullName:   r.fullName.trim(),
        email:      r.email.trim().toLowerCase(),
        rollNumber: r.rollNumber.trim(),
        ...(r.branch   && {branch:   r.branch}),
        ...(r.batch    && {batch:    r.batch.trim()}),
        ...(r.phone    && {phone:    r.phone.trim()}),
        ...(r.semester && {semester: parseInt(r.semester)}),
        ...(r.cgpa     && {cgpa:     parseFloat(r.cgpa)}),
      }));
      const res = await superAdminStudentAPI.addStudents(payload, collegeId);
      setResult(res.data); setStep('done');
      toast.success('Students Added', res.message);
      onDone?.();
    } catch(e) { toast.error('Failed', e.message); }
    finally { setSaving(false); }
  };

  const college = colleges.find(c=>c._id===collegeId);

  /* DONE */
  if (step === 'done') return (
    <Modal onClose={onClose} size="lg">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
        <MHead icon={CheckCircle} title={`${result?.length ?? 0} Students Created!`} sub="Temporary passwords emailed to each student" onClose={onClose}/>
        <div className="overflow-y-auto max-h-[55vh] p-5 space-y-2">
          {result?.map((s,i) => (
            <div key={i} className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                  {s.fullName?.charAt(0)?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{s.fullName}</p>
                  <p className="text-xs text-slate-400 truncate">{s.email} · {s.rollNumber}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg border border-blue-100">{s.temporaryPassword}</span>
                {s.emailSent
                  ? <CheckCircle size={14} className="text-green-500"/>
                  : <AlertTriangle size={14} className="text-amber-500"/>}
              </div>
            </div>
          ))}
        </div>
        <div className="p-5 border-t border-slate-100 space-y-2">
          <button
            onClick={() => downloadResultsAsExcel(result || [], `students_${Date.now()}.xlsx`)}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold rounded-xl transition-colors"
          >
            <Download size={14}/> Download All Students + Passwords (Excel)
          </button>
          <button onClick={onClose} className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-bold rounded-xl hover:opacity-90">Done</button>
        </div>
      </div>
    </Modal>
  );

  /* PREVIEW */
  if (step === 'preview') return (
    <Modal onClose={onClose} size="xl">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        <MHead icon={Eye} title={`Preview — ${filledRows.length} Students`} sub={`College: ${college?.name || '—'} · Passwords auto-generated on confirm`} onClose={onClose}/>
        <div className="overflow-auto flex-1">
          <table className="w-full text-xs border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-blue-700 text-white">
                {['#','Full Name','Email','Roll No.','Branch','Batch','Sem.','CGPA','Phone'].map(h=>(
                  <th key={h} className="text-left py-2.5 px-3 font-semibold text-[11px] whitespace-nowrap border-r border-blue-500 last:border-r-0">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filledRows.map((r,i) => (
                <tr key={r.id} className={`border-b border-slate-100 ${i%2===0?'bg-white':'bg-slate-50/40'}`}>
                  <td className="py-2.5 px-3 text-slate-400 font-mono">{i+1}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-800">{r.fullName}</td>
                  <td className="py-2.5 px-3 text-slate-600">{r.email}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-700">{r.rollNumber}</td>
                  {['branch','batch','semester','cgpa','phone'].map(f=>(
                    <td key={f} className="py-2.5 px-3 text-slate-500">{r[f]||<span className="text-slate-300">—</span>}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center gap-2 px-5 py-2.5 bg-amber-50 border-t border-amber-100 text-xs text-amber-700 flex-shrink-0">
          <Mail size={13} className="flex-shrink-0"/>Each student will receive a temporary password by email after confirmation.
        </div>
        <div className="flex gap-3 p-5 border-t border-slate-100 flex-shrink-0">
          <button onClick={()=>setStep('form')} className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl"><ArrowLeft size={14}/> Edit</button>
          <button onClick={confirm} disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 text-white text-sm font-bold rounded-xl disabled:opacity-60">
            {saving?<><Spin size="sm"/>Adding…</>:<><Check size={14}/>Confirm & Add {filledRows.length} Students</>}
          </button>
        </div>
      </div>
    </Modal>
  );

  /* TABLE CELL */
  const TC = ({ id, field, value, placeholder, options, error }) => (
    <td className={`p-1 ${error?'bg-red-50':''}`} style={{minWidth: options?90:100}}>
      <div className="relative group">
        {options
          ? <select value={value} onChange={e=>setCell(id,field,e.target.value)}
              className={`w-full text-xs border rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 ${error?'border-red-400':'border-slate-200'}`}>
              <option value="">—</option>{options.map(o=><option key={o} value={o}>{o}</option>)}
            </select>
          : <input value={value} placeholder={placeholder} onChange={e=>setCell(id,field,e.target.value)}
              className={`w-full text-xs border rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 ${error?'border-red-400':'border-slate-200'}`}/>
        }
        {error && (
          <div className="absolute bottom-full left-0 mb-1 z-20 bg-red-700 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 pointer-events-none shadow-lg">
            {error}
          </div>
        )}
      </div>
    </td>
  );

  /* FORM */
  return (
    <Modal onClose={onClose} size="full">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        <MHead icon={UsersRound} title="Add Multiple Students" sub="Fill the table, preview, then confirm" onClose={onClose}/>
        <div className="px-5 pt-4 pb-3 flex-shrink-0 flex items-end gap-4 flex-wrap border-b border-slate-100">
          <div className="w-80">
            <label className="text-xs font-bold text-slate-700 block mb-1">College <span className="text-red-500">*</span></label>
            <div className="relative">
              <Building2 size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
              <select className={`${I_ICON} appearance-none ${!collegeId&&topErr?ERR_CLS:OK_CLS}`} value={collegeId} onChange={e=>{setCollegeId(e.target.value);setTopErr('');}}>
                <option value="">Select college for all students…</option>
                {colleges.map(c=><option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          {topErr && <p className="text-xs text-red-500 flex items-center gap-1 mb-0.5"><AlertCircle size={11}/>{topErr}</p>}
        </div>
        <div className="overflow-auto flex-1 px-5 py-3">
          <table className="w-full border-collapse text-xs">
            <thead className="sticky top-0 z-10">
              <tr className="bg-blue-700 text-white">
                <th className="py-2 px-2 text-left text-[11px] font-semibold w-8">#</th>
                {[
                  {k:'fullName',   l:'Full Name *',  w:'min-w-[140px]'},
                  {k:'email',      l:'Email *',       w:'min-w-[160px]'},
                  {k:'rollNumber', l:'Roll No. *',    w:'min-w-[110px]'},
                  {k:'branch',     l:'Branch',        w:'min-w-[95px]'},
                  {k:'batch',      l:'Batch',         w:'min-w-[80px]'},
                  {k:'semester',   l:'Sem.',          w:'min-w-[70px]'},
                  {k:'cgpa',       l:'CGPA',          w:'min-w-[70px]'},
                  {k:'phone',      l:'Phone',         w:'min-w-[110px]'},
                ].map(h=>(
                  <th key={h.k} className={`py-2 px-2 text-left text-[11px] font-semibold whitespace-nowrap ${h.w}`}>{h.l}</th>
                ))}
                <th className="py-2 px-2 w-8"/>
              </tr>
            </thead>
            <tbody>
              {rows.map((r,i) => (
                <tr key={r.id} className={`border-b border-slate-100 ${i%2===0?'bg-white':'bg-slate-50/40'}`}>
                  <td className="py-1 px-2 text-slate-400 font-mono text-center">{i+1}</td>
                  <TC id={r.id} field="fullName"   value={r.fullName}   placeholder="Full name"  error={rowErrs[r.id]?.fullName}/>
                  <TC id={r.id} field="email"      value={r.email}      placeholder="email@…"    error={rowErrs[r.id]?.email}/>
                  <TC id={r.id} field="rollNumber" value={r.rollNumber} placeholder="Roll no."   error={rowErrs[r.id]?.rollNumber}/>
                  <TC id={r.id} field="branch"     value={r.branch}     options={BRANCHES}       error={rowErrs[r.id]?.branch}/>
                  <TC id={r.id} field="batch"      value={r.batch}      placeholder="2026"       error={rowErrs[r.id]?.batch}/>
                  <TC id={r.id} field="semester"   value={r.semester}   options={SEMESTERS}      error={rowErrs[r.id]?.semester}/>
                  <TC id={r.id} field="cgpa"       value={r.cgpa}       placeholder="0–10"       error={rowErrs[r.id]?.cgpa}/>
                  <TC id={r.id} field="phone"      value={r.phone}      placeholder="10 digits"  error={rowErrs[r.id]?.phone}/>
                  <td className="py-1 px-1">
                    {rows.length > 1 && (
                      <button onClick={()=>delRow(r.id)} className="p-1 text-slate-300 hover:text-red-500 transition-colors rounded">
                        <Trash2 size={12}/>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={addRow} className="mt-3 flex items-center gap-2 text-xs text-blue-600 hover:text-blue-700 font-semibold px-3 py-2 rounded-xl hover:bg-blue-50 transition-colors border border-dashed border-blue-200">
            <Plus size={13}/> Add Row
          </button>
        </div>
        <div className="flex items-center justify-between gap-3 p-5 border-t border-slate-100 flex-shrink-0 bg-blue-50/40">
          <span className="text-xs text-slate-400">{filledRows.length} filled row(s)</span>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl">Cancel</button>
            <button onClick={goPreview} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 text-white text-sm font-bold rounded-xl">
              <Eye size={14}/> Preview
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════════════
   MODAL 3 — BULK EXCEL UPLOAD
══════════════════════════════════════════════════════════ */
function BulkUploadModal({ colleges, onClose, onDone }) {
  const toast   = useToast();
  const fileRef = useRef(null);

  const [step, setStep]               = useState('upload');
  const [collegeId, setCollegeId]     = useState('');
  const [parsedRows, setParsedRows]   = useState([]);
  const [rowErrors, setRowErrors]     = useState({});
  const [headers, setHeaders]         = useState([]);
  const [fileName, setFileName]       = useState('');
  const [validating, setValidating]   = useState(false);
  const [uploading, setUploading]     = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [dragOver, setDragOver]       = useState(false);
  const [serverValidated, setServerValidated] = useState(false);

  const parseFile = (file) => {
    setFileName(file.name);
    setServerValidated(false);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const wb  = XLSX.read(new Uint8Array(e.target.result), { type:'array' });
        const ws  = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(ws, { header:1, raw:false, defval:'' });
        if (raw.length < 2) { toast.error('Empty file','No data rows found.'); return; }

        const hdrs = raw[0].map(h=>String(h).trim().toLowerCase().replace(/\s+/g,'_'));
        setHeaders(hdrs);

        const rows = [];
        for (let i=1; i<raw.length; i++) {
          const row = raw[i];
          if (row.every(c=>c===''||c==null)) continue;
          const obj = { _rowIndex: i+1 };
          hdrs.forEach((h,idx)=>{ obj[h]=String(row[idx]||'').trim(); });
          rows.push(obj);
        }

        const errs = {};
        const emailsSeen = {}, rollsSeen = {};
        rows.forEach((row,i) => {
          const e = validateRow(row);
          const em   = (row['email']||'').toLowerCase().trim();
          const roll = (row['roll_number']||row['rollnumber']||row['roll_no']||'').trim();
          if (em   && emailsSeen[em]   !== undefined) e['email']       = `Duplicate of row ${emailsSeen[em]+2}`;
          else if (em)   emailsSeen[em]   = i;
          if (roll && rollsSeen[roll] !== undefined) e['roll_number'] = `Duplicate of row ${rollsSeen[roll]+2}`;
          else if (roll) rollsSeen[roll] = i;
          if (Object.keys(e).length) errs[i] = e;
        });

        setParsedRows(rows);
        setRowErrors(errs);
        setStep('preview');
      } catch(err) { toast.error('Parse failed', err.message); }
    };
    reader.readAsArrayBuffer(file);
  };

  const runServerValidation = useCallback(async (rows, cId) => {
    if (!cId || rows.length === 0) return;
    setValidating(true);
    try {
      const normalized = rows.map((row,i) => ({
        name:        row['name']||row['full_name']||row['fullname']||'',
        email:       row['email']||'',
        roll_number: row['roll_number']||row['rollnumber']||row['roll_no']||'',
        _rowIndex:   row._rowIndex||i+2,
      }));

      const res = await superAdminStudentAPI.validateBulkUploadJSON(normalized, cId);
      // Normalize: res may be { success, data: {...} } or { success, validationErrors, warnings }
      const data = (res && res.data) ? res.data : res;

      const newErrs = {};

      if (Array.isArray(data.validationErrors) && data.validationErrors.length) {
        data.validationErrors.forEach(msg => {
          const rowMatch = msg.match(/^Row (\d+):/);
          if (rowMatch) {
            const rowNum = parseInt(rowMatch[1]);
            const rowIdx = rowNum - 2;
            if (rowIdx >= 0) {
              newErrs[rowIdx] = newErrs[rowIdx] || {};
              const lm = msg.toLowerCase();
              if (lm.includes('email'))         newErrs[rowIdx]['email']       = msg.replace(/^Row \d+:\s*/,'');
              else if (lm.includes('roll'))     newErrs[rowIdx]['roll_number'] = msg.replace(/^Row \d+:\s*/,'');
              else if (lm.includes('phone'))    newErrs[rowIdx]['phone']       = msg.replace(/^Row \d+:\s*/,'');
              else if (lm.includes('branch'))   newErrs[rowIdx]['branch']      = msg.replace(/^Row \d+:\s*/,'');
              else if (lm.includes('cgpa'))     newErrs[rowIdx]['cgpa']        = msg.replace(/^Row \d+:\s*/,'');
              else if (lm.includes('semester')) newErrs[rowIdx]['semester']    = msg.replace(/^Row \d+:\s*/,'');
              else                              newErrs[rowIdx]['_general']    = msg.replace(/^Row \d+:\s*/,'');
            }
          }
        });
      }

      if (Array.isArray(data.warnings) && data.warnings.length) {
        data.warnings.forEach(w => {
          if (w.toLowerCase().includes('email')) {
            const parts = w.split(':');
            const emailPart = parts.slice(1).join(':').trim();
            const conflictEmails = new Set(emailPart?.split(',').map(e=>e.trim().toLowerCase())||[]);
            rows.forEach((row,i) => {
              const em = (row['email']||'').toLowerCase().trim();
              if (conflictEmails.has(em)) {
                newErrs[i] = newErrs[i] || {};
                newErrs[i]['email'] = '⚠ Email already registered in database';
              }
            });
          }
          if (w.toLowerCase().includes('roll')) {
            const parts = w.split(':');
            const rollPart = parts.slice(1).join(':').trim();
            const conflictRolls = new Set(rollPart?.split(',').map(r=>r.trim())||[]);
            rows.forEach((row,i) => {
              const roll = (row['roll_number']||row['rollnumber']||'').trim();
              if (conflictRolls.has(roll)) {
                newErrs[i] = newErrs[i] || {};
                newErrs[i]['roll_number'] = '⚠ Roll number already registered in database';
              }
            });
          }
        });
      }

      setRowErrors(prev => {
        const merged = { ...prev };
        Object.entries(newErrs).forEach(([idx, errs]) => {
          merged[idx] = { ...(merged[idx]||{}), ...errs };
        });
        return merged;
      });

      setServerValidated(true);
      const totalNewErrs = Object.keys(newErrs).length;
      if (totalNewErrs > 0) {
        toast.error('DB Conflicts Found', `${totalNewErrs} row(s) conflict with existing records.`);
      } else {
        toast.success('Validation Passed', 'No conflicts found. Ready to upload!');
      }
    } catch(err) {
      console.warn('Server validation failed:', err.message);
      setServerValidated(true); // allow proceed even if validation endpoint fails
    } finally {
      setValidating(false);
    }
  }, [toast]);

  useEffect(() => {
    if (step === 'preview' && collegeId && parsedRows.length > 0 && !serverValidated) {
      runServerValidation(parsedRows, collegeId);
    }
  }, [step, collegeId, parsedRows, serverValidated, runServerValidation]);

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) { toast.error('Wrong file type','Use .xlsx, .xls, or .csv'); return; }
    parseFile(file);
  };

  const confirmUpload = async () => {
    if (!collegeId) { toast.error('College required','Select a college before uploading.'); return; }
    if (Object.keys(rowErrors).length > 0) {
      toast.error('Fix errors first', `${Object.keys(rowErrors).length} row(s) have errors. Fix the file and re-upload.`);
      return;
    }
    setUploading(true);
    try {
      const normalized = parsedRows.map((row,i) => ({
        name:        row['name']||row['full_name']||row['fullname']||'',
        email:       row['email']||'',
        roll_number: row['roll_number']||row['rollnumber']||row['roll_no']||'',
        phone:       row['phone']||'',
        branch:      row['branch']||'',
        batch:       row['batch']||'',
        semester:    row['semester']||'',
        cgpa:        row['cgpa']||'',
        _rowIndex:   row._rowIndex||i+2,
      }));
      const res = await superAdminStudentAPI.bulkUploadJSON(normalized, collegeId);
      const resultData = res.data || res;
      setUploadResult(resultData);
      setStep('done');
      toast.success('Upload Complete', res.message);
      onDone?.();
    } catch(err) {
      toast.error('Upload Failed', err.message);
      if (err.message && err.message.toLowerCase().includes('email')) {
        const emailMatches = err.message.match(/[\w.+-]+@[\w.-]+\.\w+/g);
        if (emailMatches) {
          const conflictSet = new Set(emailMatches.map(e=>e.toLowerCase()));
          setRowErrors(prev => {
            const updated = {...prev};
            parsedRows.forEach((row,i) => {
              const em = (row['email']||'').toLowerCase();
              if (conflictSet.has(em)) {
                updated[i] = {...(updated[i]||{}), email:'⚠ Already registered in database'};
              }
            });
            return updated;
          });
        }
      }
    } finally { setUploading(false); }
  };

  const resetUpload = () => {
    setStep('upload'); setParsedRows([]); setHeaders([]); setFileName('');
    setRowErrors({}); setServerValidated(false);
  };

  const errorCount    = Object.keys(rowErrors).length;
  const validCount    = parsedRows.length - errorCount;
  const dbConflictCount = Object.values(rowErrors).filter(e => Object.values(e).some(msg=>msg?.includes('⚠'))).length;
  const canUpload     = errorCount === 0 && parsedRows.length > 0 && !!collegeId && serverValidated;
  const college       = colleges.find(c=>c._id===collegeId);

  /* DONE */
  if (step === 'done') return (
    <Modal onClose={onClose} size="md">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
        <MHead icon={CheckCircle} title="Bulk Upload Complete!" sub="Students created and welcome emails sent" onClose={onClose}/>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              {l:'Total Rows', v:uploadResult?.totalRows||parsedRows.length, bg:'bg-blue-50',    text:'text-blue-700',    border:'border-blue-100'},
              {l:'Inserted',   v:uploadResult?.inserted||0,                   bg:'bg-emerald-50', text:'text-emerald-700', border:'border-emerald-100'},
              {l:'Updated',    v:uploadResult?.updated||0,                    bg:'bg-amber-50',   text:'text-amber-700',   border:'border-amber-100'},
            ].map(s=>(
              <div key={s.l} className={`p-4 text-center rounded-xl ${s.bg} border ${s.border}`}>
                <p className={`text-2xl font-black ${s.text}`}>{s.v}</p>
                <p className={`text-xs ${s.text} font-semibold opacity-70 mt-0.5`}>{s.l}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 text-sm text-blue-700 p-3 bg-blue-50 border border-blue-100 rounded-xl">
            <Mail size={14} className="flex-shrink-0"/>Welcome emails with temporary passwords sent to all students.
          </div>
          <button
            onClick={() => {
              const rows = parsedRows.map(r => ({
                fullName:          r['name']||r['full_name']||'',
                email:             r['email']||'',
                rollNumber:        r['roll_number']||r['rollnumber']||'',
                branch:            r['branch']||'',
                batch:             r['batch']||'',
                phone:             r['phone']||'',
                temporaryPassword: '(check email)',
                emailSent:         true,
              }));
              downloadResultsAsExcel(rows, `bulk_upload_${Date.now()}.xlsx`);
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold rounded-xl transition-colors"
          >
            <Download size={14}/> Download Uploaded Students List (Excel)
          </button>
          <button onClick={onClose} className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-bold rounded-xl hover:opacity-90">Done</button>
        </div>
      </div>
    </Modal>
  );

  /* PREVIEW TABLE */
  if (step === 'preview') {
    const displayHdrs = headers.filter(h=>!h.startsWith('_'));
    return (
      <Modal onClose={onClose} size="full">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
          <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 px-6 py-4 flex-shrink-0 rounded-t-2xl">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center"><FileText className="w-4 h-4 text-white"/></div>
                <div>
                  <h2 className="text-white font-black text-sm">{fileName}</h2>
                  <p className="text-blue-200 text-[11px] mt-0.5">{parsedRows.length} rows · {errorCount} error(s) · {validCount} valid</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {errorCount > 0
                  ? <span className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-500/20 border border-red-400/30 text-white rounded-xl text-xs font-bold"><AlertTriangle size={12}/>{errorCount} errors</span>
                  : <span className="flex items-center gap-1.5 px-2.5 py-1.5 bg-green-500/20 border border-green-400/30 text-white rounded-xl text-xs font-bold"><CheckCircle size={12}/>All valid</span>
                }
                <button onClick={onClose} className="w-8 h-8 bg-white/10 hover:bg-white/25 rounded-lg flex items-center justify-center text-white transition-colors"><X className="w-4 h-4"/></button>
              </div>
            </div>
          </div>

          <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex-shrink-0 flex items-center gap-3 flex-wrap">
            <Building2 size={14} className="text-slate-400 flex-shrink-0"/>
            <div className="relative w-72">
              <select
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 appearance-none"
                value={collegeId}
                onChange={e => { setCollegeId(e.target.value); setServerValidated(false); }}
              >
                <option value="">Select college for all rows…</option>
                {colleges.map(c=><option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            {college && <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-lg">{college.name}</span>}
            {validating && (
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <Spin size="sm" color="slate"/> Checking database for conflicts…
              </span>
            )}
            {!validating && collegeId && serverValidated && errorCount === 0 && (
              <span className="flex items-center gap-1.5 text-xs text-green-700 font-semibold">
                <CheckCircle size={12}/> Database check passed
              </span>
            )}
            {!validating && !collegeId && (
              <span className="text-xs text-amber-600 flex items-center gap-1"><AlertTriangle size={11}/>Select a college to validate & enable upload</span>
            )}
          </div>

          {errorCount > 0 && (
            <div className="px-5 py-2.5 flex flex-col gap-1 bg-red-50 border-b border-red-100 flex-shrink-0">
              <div className="flex items-start gap-2">
                <AlertTriangle size={13} className="text-red-500 flex-shrink-0 mt-0.5"/>
                <span className="text-xs text-red-700 font-medium">
                  <strong>{errorCount} row(s) have errors</strong> — highlighted in red. Hover any red cell to see details.
                  {dbConflictCount > 0 && <span className="text-red-600"> <strong>{dbConflictCount}</strong> row(s) conflict with existing DB records.</span>}
                </span>
              </div>
              <p className="text-xs text-red-600 ml-5">Fix the source file and re-upload. Confirm is disabled until all errors are resolved.</p>
            </div>
          )}

          <div className="overflow-auto flex-1">
            <table className="w-full text-xs border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-blue-800 text-white">
                  <th className="text-left py-2.5 px-3 font-semibold text-[11px] w-10 border-r border-blue-600">Row</th>
                  <th className="text-center py-2.5 px-2 font-semibold text-[11px] w-8 border-r border-blue-600">✓</th>
                  {displayHdrs.map(h=>(
                    <th key={h} className={`text-left py-2.5 px-3 font-semibold text-[11px] whitespace-nowrap min-w-[100px] border-r border-blue-600 last:border-r-0 ${REQUIRED_COLS.includes(h)?'text-yellow-300':''}`}>
                      {h.replace(/_/g,' ').toUpperCase()}{REQUIRED_COLS.includes(h)&&<span className="ml-1 opacity-60">*</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsedRows.map((row,i) => {
                  const rowErr  = rowErrors[i] || {};
                  const hasErr  = Object.keys(rowErr).length > 0;
                  const hasDbConflict = Object.values(rowErr).some(m=>m?.includes('⚠'));
                  return (
                    <tr key={i} className={`border-b ${
                      hasErr
                        ? (hasDbConflict ? 'border-orange-100 bg-orange-50/20' : 'border-red-100 bg-red-50/20')
                        : 'border-slate-100 ' + (i%2===0?'bg-white':'bg-slate-50/30')
                    }`}>
                      <td className="py-2 px-3 text-slate-400 font-mono text-[11px] border-r border-slate-100">{row._rowIndex||i+2}</td>
                      <td className="py-2 px-2 text-center border-r border-slate-100">
                        {hasErr
                          ? (hasDbConflict
                              ? <AlertTriangle size={12} className="text-orange-500 mx-auto"/>
                              : <AlertCircle   size={12} className="text-red-500 mx-auto"/>)
                          : <CheckCircle size={12} className="text-green-500 mx-auto"/>}
                      </td>
                      {displayHdrs.map(h => {
                        const cellErr = rowErr[h]
                          || (h==='roll_number' && (rowErr['rollnumber']||rowErr['roll_no']))
                          || rowErr['_general'];
                        const val = row[h] || '';
                        const isDbConflict = cellErr?.includes('⚠');
                        return (
                          <td key={h} className={`py-2 px-3 border-r border-slate-50 last:border-r-0 ${
                            cellErr
                              ? (isDbConflict ? 'bg-orange-100 border border-orange-300' : 'bg-red-100 border border-red-300')
                              : ''
                          }`}>
                            <div className="relative group">
                              <span className={cellErr ? (isDbConflict?'text-orange-800 font-semibold':'text-red-700 font-semibold') : 'text-slate-700'}>
                                {val || <span className="text-slate-300 text-[10px]">—</span>}
                              </span>
                              {cellErr && (
                                <div className={`absolute bottom-full left-0 mb-1 z-30 text-white text-[10px] px-2.5 py-1.5 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none shadow-xl transition-opacity max-w-xs ${isDbConflict?'bg-orange-700':'bg-red-700'}`}>
                                  {cellErr}
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-3 p-4 border-t border-slate-100 flex-shrink-0 bg-slate-50">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 px-2.5 py-1 rounded-lg border border-green-200">
                <CheckCircle size={11}/>{validCount} valid
              </span>
              {errorCount > 0 && (
                <span className="flex items-center gap-1.5 text-xs text-red-700 bg-red-50 px-2.5 py-1 rounded-lg border border-red-200">
                  <AlertCircle size={11}/>{errorCount} errors
                </span>
              )}
              {dbConflictCount > 0 && (
                <span className="flex items-center gap-1.5 text-xs text-orange-700 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200">
                  <AlertTriangle size={11}/>{dbConflictCount} DB conflicts
                </span>
              )}
              <span className="text-xs text-slate-400">{parsedRows.length} total</span>
            </div>
            <div className="flex gap-2">
              <button onClick={resetUpload} className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-colors">
                <ArrowLeft size={13}/> Re-upload
              </button>
              <button
                onClick={confirmUpload}
                disabled={!canUpload || uploading}
                title={
                  !collegeId ? 'Select a college first'
                  : !serverValidated ? 'Wait for database validation…'
                  : errorCount > 0 ? 'Fix all errors before uploading'
                  : ''
                }
                className={`flex items-center gap-2 px-6 py-2 text-sm font-bold rounded-xl transition-all ${
                  canUpload && !uploading
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {uploading
                  ? <><Spin size="sm"/>Uploading…</>
                  : validating
                  ? <><Spin size="sm" color="slate"/>Validating…</>
                  : <><UploadCloud size={14}/>Confirm Upload ({validCount})</>
                }
              </button>
            </div>
          </div>
        </div>
      </Modal>
    );
  }

  /* DROP ZONE */
  return (
    <Modal onClose={onClose} size="lg">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        <MHead icon={CloudUpload} title="Bulk Excel Upload" sub="Client-side preview + DB conflict detection before saving" onClose={onClose}/>
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          <div
            onDragOver={e=>{e.preventDefault();setDragOver(true);}}
            onDragLeave={()=>setDragOver(false)}
            onDrop={handleDrop}
            onClick={()=>fileRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center gap-4 cursor-pointer transition-all ${dragOver?'border-blue-400 bg-blue-50':'border-slate-200 hover:border-blue-300 hover:bg-slate-50'}`}
          >
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center">
              <Upload size={28} className="text-blue-600"/>
            </div>
            <div className="text-center">
              <p className="font-bold text-slate-700">Drop your Excel file here, or <span className="text-blue-600">click to browse</span></p>
              <p className="text-xs text-slate-400 mt-1.5">Supports .xlsx, .xls, .csv · Up to 5,000 students</p>
            </div>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(f)parseFile(f);e.target.value='';}}/>
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <p className="text-sm font-bold text-slate-700">Download Template</p>
              <p className="text-xs text-slate-400 mt-0.5">Excel with correct columns and sample rows</p>
            </div>
            <button onClick={()=>superAdminStudentAPI.downloadTemplate()} className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl transition-colors">
              <Download size={13}/> Template
            </button>
          </div>
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-1.5 text-xs text-blue-700">
            <p className="font-bold flex items-center gap-1.5"><Info size={12}/>How validation works:</p>
            <p>1. File is parsed instantly in the browser — no upload needed to preview</p>
            <p>2. Every cell is validated (format, required fields, duplicates within file)</p>
            <p>3. After selecting a college, the database is checked for existing emails/roll numbers</p>
            <p>4. <strong>Confirm Upload is only enabled when zero errors remain</strong></p>
          </div>
          <div className="grid grid-cols-2 gap-4 p-4 bg-white border border-slate-100 rounded-xl text-xs">
            <div>
              <p className="text-[10px] font-black text-red-500 uppercase tracking-wider mb-2">Required Columns</p>
              {[['name','Full student name'],['email','Unique — existing emails blocked'],['roll_number','Unique per college']].map(([c,d])=>(
                <div key={c} className="flex items-start gap-2 mb-1.5">
                  <code className="px-1.5 py-0.5 bg-red-50 text-red-700 rounded text-[10px] font-mono border border-red-100 whitespace-nowrap mt-0.5">{c}</code>
                  <span className="text-slate-400">{d}</span>
                </div>
              ))}
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Optional Columns</p>
              {[['phone','10-digit'],['branch','CSE/ECE/…'],['batch','e.g. 2026'],['semester','1–10'],['cgpa','0.0–10.0']].map(([c,d])=>(
                <div key={c} className="flex items-center gap-2 mb-1.5">
                  <code className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-mono border border-slate-200 whitespace-nowrap">{c}</code>
                  <span className="text-slate-400">{d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════════════
   MODAL 4 — EXPORT
══════════════════════════════════════════════════════════ */
function ExportModal({ colleges, onClose }) {
  const toast = useToast();
  const [f, setF_]       = useState({ collegeId:'', branch:'', batch:'', isPlaced:'', format:'xlsx' });
  const setF = (k,v)     => setF_(p=>({...p,[k]:v}));
  const [preview, setPrev] = useState(null);
  const [prevLoad, setPL]  = useState(false);
  const [exporting, setEx] = useState(false);

  const fetchPreview = useCallback(async () => {
    setPL(true);
    try {
      const p = Object.fromEntries(Object.entries(f).filter(([k,v])=>v&&k!=='format'));
      const r = await superAdminStudentAPI.getExportPreview(p);
      setPrev(r.data || r);
    } catch(e) { toast.error('Preview failed', e.message); }
    finally { setPL(false); }
  }, [f, toast]);

  // Only fetch preview when user explicitly clicks the button, not on mount
  const doExport = async () => {
    setEx(true);
    try {
      await superAdminStudentAPI.exportStudents(Object.fromEntries(Object.entries(f).filter(([,v])=>v)));
      toast.success('Exported','File downloaded!');
      onClose();
    } catch(e) { toast.error('Export failed', e.message); }
    finally { setEx(false); }
  };

  return (
    <Modal onClose={onClose} size="md">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
        <MHead icon={FileDown} title="Export Students" sub="Filter and download as Excel or CSV" gradient="from-blue-700 via-blue-600 to-cyan-500" onClose={onClose}/>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">College</label>
              <select className={`${I_PLAIN} ${OK_CLS}`} value={f.collegeId} onChange={e=>setF('collegeId',e.target.value)}>
                <option value="">All Colleges</option>
                {colleges.map(c=><option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Branch</label>
              <select className={`${I_PLAIN} ${OK_CLS}`} value={f.branch} onChange={e=>setF('branch',e.target.value)}>
                <option value="">All</option>{BRANCHES.map(b=><option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Placement</label>
              <select className={`${I_PLAIN} ${OK_CLS}`} value={f.isPlaced} onChange={e=>setF('isPlaced',e.target.value)}>
                <option value="">All</option><option value="true">Placed</option><option value="false">Unplaced</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Format</label>
              <select className={`${I_PLAIN} ${OK_CLS}`} value={f.format} onChange={e=>setF('format',e.target.value)}>
                <option value="xlsx">Excel (.xlsx)</option><option value="csv">CSV (.csv)</option>
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={fetchPreview} disabled={prevLoad} className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl disabled:opacity-60 transition-colors">
                {prevLoad?<Spin size="sm" color="slate"/>:<RefreshCw size={13}/>} Preview Count
              </button>
            </div>
          </div>
          {preview && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-sm font-black text-blue-700">{(preview.totalRecords||0).toLocaleString()} records match</p>
              <p className="text-xs text-blue-500 mt-0.5">Will download as {f.format.toUpperCase()}</p>
            </div>
          )}
          {!preview && (
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center text-xs text-slate-400">
              Click "Preview Count" to see how many records match your filters
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={onClose} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl">Cancel</button>
            <button
              onClick={doExport}
              disabled={exporting || prevLoad}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 text-white text-sm font-bold rounded-xl disabled:opacity-50"
            >
              {exporting?<><Spin size="sm"/>Downloading…</>:<><FileDown size={14}/>Export{preview?.totalRecords?` (${preview.totalRecords})`:''}</>}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════════════
   STUDENT LIST SECTION — live data from DB
══════════════════════════════════════════════════════════ */
function StudentListSection({ colleges }) {
  const toast = useToast();
  const [selectedCollege, setSelectedCollege] = useState('');
  const [students, setStudents]               = useState([]);
  const [loading, setLoading]                 = useState(false);
  const [total, setTotal]                     = useState(0);
  const [page, setPage]                       = useState(1);
  const [totalPages, setTotalPages]           = useState(1);
  const [search, setSearch]                   = useState('');
  const [branch, setBranch]                   = useState('');
  const [batch, setBatch]                     = useState('');
  const [branches, setBranches]               = useState([]);
  const [batches, setBatches]                 = useState([]);
  const [collegeStats, setCollegeStats]       = useState(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const limit = 15;

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchStudents = useCallback(async () => {
    if (!selectedCollege) { setStudents([]); setTotal(0); setCollegeStats(null); return; }
    setLoading(true);
    try {
      const res = await getCollegeStudents(selectedCollege, {
        page,
        limit,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(branch && { branch }),
        ...(batch  && { batch  }),
      });
      setStudents(res.students || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
      if (res.filters?.branches?.length) setBranches(res.filters.branches);
      if (res.filters?.batches?.length)  setBatches(res.filters.batches);
      if (res.collegeStats) setCollegeStats(res.collegeStats);
    } catch (e) {
      toast.error('Failed to load students', e.message);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCollege, page, debouncedSearch, branch, batch, toast]);

  useEffect(() => { setPage(1); }, [selectedCollege, debouncedSearch, branch, batch]);
  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const handleCollegeChange = (id) => {
    setSelectedCollege(id);
    setBranches([]); setBatches([]); setBranch(''); setBatch('');
    setSearch(''); setStudents([]); setCollegeStats(null);
  };

  if (!colleges.length) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Section header */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 px-5 py-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
            <Users size={18} className="text-white"/>
          </div>
          <div>
            <h3 className="text-sm font-black text-white">Student Directory</h3>
            <p className="text-blue-200 text-[11px] mt-0.5">
              {selectedCollege && total > 0 ? `${total.toLocaleString()} student${total!==1?'s':''} found` : 'Select a college to view students'}
            </p>
          </div>
        </div>
        {selectedCollege && (
          <button
            onClick={fetchStudents}
            disabled={loading}
            className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold px-3 py-2 rounded-xl border border-white/20 transition-all"
          >
            <RefreshCw size={12} className={loading?'animate-spin':''}/> Refresh
          </button>
        )}
      </div>

      {/* Filters row */}
      <div className="p-4 border-b border-slate-100 flex items-center gap-3 flex-wrap bg-slate-50/50">
        {/* College picker */}
        <div className="relative min-w-[220px]">
          <Building2 size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
          <select
            className="w-full text-sm border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 appearance-none"
            value={selectedCollege}
            onChange={e => handleCollegeChange(e.target.value)}
          >
            <option value="">Select college…</option>
            {colleges.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>

        {/* Search */}
        {selectedCollege && (
          <>
            <div className="relative flex-1 min-w-[180px]">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
              <input
                className="w-full text-sm border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Search name, email, roll no…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Branch filter */}
            <select
              className="text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 appearance-none"
              value={branch}
              onChange={e => setBranch(e.target.value)}
            >
              <option value="">All Branches</option>
              {(branches.length ? branches : BRANCHES).map(b => <option key={b} value={b}>{b}</option>)}
            </select>

            {/* Batch filter */}
            {batches.length > 0 && (
              <select
                className="text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 appearance-none"
                value={batch}
                onChange={e => setBatch(e.target.value)}
              >
                <option value="">All Batches</option>
                {batches.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            )}
          </>
        )}
      </div>

      {/* Stats bar */}
      {collegeStats && (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { icon: Users,        label: 'Total',   value: collegeStats.totalStudents,       c: 'bg-blue-50 border-blue-100 text-blue-600'    },
              { icon: CheckCircle,  label: 'Active',  value: collegeStats.totalActive,         c: 'bg-green-50 border-green-100 text-green-600'  },
              { icon: GraduationCap,label: 'Placed',  value: collegeStats.totalPlaced,         c: 'bg-amber-50 border-amber-100 text-amber-600'  },
              { icon: TrendingUp,   label: 'Rate',    value: `${collegeStats.placementRate}%`, c: 'bg-violet-50 border-violet-100 text-violet-600'},
            ].map(({ icon: Icon, label, value, c }) => (
              <div key={label} className={`flex items-center gap-2 px-3 py-2 border rounded-xl ${c}`}>
                <Icon className="w-4 h-4 flex-shrink-0 opacity-70" />
                <div className="min-w-0">
                  <p className="text-sm font-black leading-none">{value}</p>
                  <p className="text-[9px] font-medium opacity-60 mt-0.5 leading-none truncate">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-16">
            <Spin size="md" color="blue"/>
            <span className="text-sm text-slate-500">Loading students…</span>
          </div>
        ) : !selectedCollege ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Building2 size={40} className="mb-3 opacity-30"/>
            <p className="text-sm font-semibold">Select a college above to view students</p>
          </div>
        ) : students.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <GraduationCap size={40} className="mb-3 opacity-30"/>
            <p className="text-sm font-semibold">No students found</p>
            <p className="text-xs mt-1">{(search||branch||batch) ? 'Try adjusting your filters' : 'Add students using the buttons above'}</p>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Name','Email','Roll No.','Branch','Batch','Sem.','CGPA','Status','Joined'].map(h => (
                  <th key={h} className="text-left py-2.5 px-3 font-bold text-[11px] text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => {
                const si = s.studentInfo || {};
                return (
                  <tr key={s._id} className={`border-b border-slate-50 hover:bg-blue-50/30 transition-colors ${i%2===0?'bg-white':'bg-slate-50/20'}`}>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center text-white font-black text-[11px] flex-shrink-0">
                          {s.fullName?.charAt(0)?.toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-800 whitespace-nowrap">{s.fullName}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 max-w-[160px] truncate">{s.email}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{si.rollNumber || '—'}</td>
                    <td className="py-2.5 px-3">
                      {si.branch
                        ? <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-md text-[10px] font-semibold">{si.branch}</span>
                        : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">{si.batch || '—'}</td>
                    <td className="py-2.5 px-3 text-slate-500 text-center">{si.semester || '—'}</td>
                    <td className="py-2.5 px-3 text-slate-500">{si.cgpa ?? '—'}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.isActive ? 'bg-green-400' : 'bg-red-400'}`}/>
                        <span className={`text-[10px] font-semibold ${s.isActive ? 'text-green-600' : 'text-red-500'}`}>
                          {s.isActive ? 'Active' : 'Inactive'}
                        </span>
                        {si.isPlaced && (
                          <span className="ml-1 px-1.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded text-[10px] font-semibold">Placed</span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                      {s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-IN', {day:'2-digit',month:'short',year:'numeric'}) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && !loading && students.length > 0 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/50">
          <span className="text-xs text-slate-400">
            Showing {((page-1)*limit)+1}–{Math.min(page*limit, total)} of {total.toLocaleString()}
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page<=1}
              onClick={()=>setPage(p=>p-1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={14}/>
            </button>
            <span className="text-xs font-bold text-slate-600">{page} / {totalPages}</span>
            <button
              disabled={page>=totalPages}
              onClick={()=>setPage(p=>p+1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={14}/>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════ */
export default function SuperAdminStudentManagement() {
  const toast = useToast();
  const [colleges, setColleges]   = useState([]);
  const [loading, setLoading]     = useState(false);
  const [modal, setModal]         = useState(null);
  const [refreshList, setRefresh] = useState(0);

  const loadColleges = useCallback(async () => {
    setLoading(true);
    try {
      const r = await superAdminStudentAPI.getColleges();
      setColleges(r.colleges || r.data || []);
    } catch(e) { toast.error('Error loading colleges', e.message); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(()=>{ loadColleges(); },[loadColleges]);

  const handleDone = () => {
    setModal(null);
    setRefresh(n => n + 1); // trigger student list refresh
  };

  const CARDS = [
    {
      icon: UserPlus, gradient:'from-blue-600 to-cyan-500', border:'border-blue-100',
      light:'from-blue-50 to-cyan-50/50',
      title:'Add Single Student',
      desc:'Add one student with a form. Preview all details before saving to database.',
      tips:['Full data preview before insert','Auto-generated temporary password','Welcome email sent instantly'],
      action:()=>setModal('single'), btnLabel:'Add Single Student',
    },
    {
      icon: UsersRound, gradient:'from-blue-600 to-cyan-500', border:'border-blue-100',
      light:'from-blue-50 to-cyan-50/50',
      title:'Add Multiple Students',
      desc:'Fill a spreadsheet-like table in the browser. Preview all rows before saving.',
      tips:['Inline table — no file needed','Preview all rows before confirm','All students emailed passwords'],
      action:()=>setModal('multiple'), btnLabel:'Add Multiple Students',
    },
    {
      icon: CloudUpload, gradient:'from-blue-600 to-cyan-500', border:'border-blue-100',
      light:'from-blue-50 to-cyan-50/50',
      title:'Bulk Excel Upload',
      desc:'Upload .xlsx or .csv. Full preview with error highlighting + DB conflict detection.',
      tips:['Instant client-side Excel parsing','DB conflict detection before upload','Confirm only when all rows valid'],
      action:()=>setModal('upload'), btnLabel:'Bulk Upload',
    },
  ];

  return (
    <SuperAdminDashboardLayout>
      <div className="w-full space-y-5">

        {/* Hero */}
        <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 rounded-2xl px-6 py-5 shadow-xl shadow-blue-500/25 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute inset-0 opacity-[0.06]" style={{backgroundImage:'radial-gradient(circle,white 1px,transparent 1px)',backgroundSize:'18px 18px'}}/>
          </div>
          <div className="relative flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center border border-white/20 flex-shrink-0">
                <GraduationCap className="w-6 h-6 text-white"/>
              </div>
              <div>
                <h1 className="text-white font-black text-xl">Student Management</h1>
                <p className="text-blue-200 text-xs mt-0.5">Global student operations across all colleges</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={loadColleges} disabled={loading} className="inline-flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold px-3 py-2 rounded-xl border border-white/20 transition-all disabled:opacity-50">
                <RefreshCw size={13} className={loading?'animate-spin':''}/> Refresh
              </button>
              <button onClick={()=>setModal('export')} className="inline-flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold px-3 py-2 rounded-xl border border-white/20 transition-all">
                <FileDown size={13}/> Export
              </button>
              <button onClick={()=>setModal('single')} className="inline-flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold px-3 py-2 rounded-xl border border-white/20 transition-all">
                <UserPlus size={13}/> Add Student
              </button>
              <button onClick={()=>setModal('multiple')} className="inline-flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold px-3 py-2 rounded-xl border border-white/20 transition-all">
                <UsersRound size={13}/> Add Multiple
              </button>
              <button onClick={()=>setModal('upload')} className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-2 rounded-xl border border-white/30 transition-all">
                <CloudUpload size={13}/> Bulk Upload
              </button>
            </div>
          </div>
        </div>

        {/* Colleges bar */}
        <div className="flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Building2 size={16} className="text-blue-600"/>
          </div>
          {loading ? (
            <div className="flex items-center gap-2"><Spin size="sm" color="blue"/><span className="text-sm text-slate-500">Loading colleges…</span></div>
          ) : (
            <div className="flex-1 min-w-0 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-sm font-black text-slate-800">{colleges.length} College{colleges.length!==1?'s':''} Available</p>
                <p className="text-xs text-slate-400 mt-0.5 truncate">
                  {colleges.length>0
                    ? colleges.slice(0,4).map(c=>c.name).join(' · ')+(colleges.length>4?` · +${colleges.length-4} more`:'')
                    : 'No colleges found — check backend connection'}
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {colleges.slice(0,4).map(c=>(
                  <span key={c._id} className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-[11px] font-semibold">{c.name}</span>
                ))}
                {colleges.length>4&&<span className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg text-[11px] font-semibold">+{colleges.length-4} more</span>}
              </div>
            </div>
          )}
        </div>

        {/* Action cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {CARDS.map(card=>(
            <div key={card.title} className={`bg-white rounded-2xl border ${card.border} shadow-sm overflow-hidden hover:shadow-md transition-shadow`}>
              <div className={`bg-gradient-to-r ${card.gradient} px-5 py-4 flex items-center gap-3`}>
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center"><card.icon size={18} className="text-white"/></div>
                <h3 className="text-sm font-black text-white">{card.title}</h3>
              </div>
              <div className={`bg-gradient-to-b ${card.light} p-5 space-y-4`}>
                <p className="text-sm text-slate-600 leading-relaxed">{card.desc}</p>
                <ul className="space-y-2">
                  {card.tips.map((t,i)=>(
                    <li key={i} className="flex items-start gap-2.5 text-xs text-slate-600">
                      <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center text-[9px] font-black text-slate-500 flex-shrink-0 mt-0.5 shadow-sm border border-slate-100">{i+1}</div>
                      {t}
                    </li>
                  ))}
                </ul>
                <button onClick={card.action} className={`w-full flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-white bg-gradient-to-r ${card.gradient} hover:opacity-90 rounded-xl transition-opacity shadow-md`}>
                  <card.icon size={13}/> {card.btnLabel}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Export card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 px-5 py-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center"><FileDown size={18} className="text-white"/></div>
            <div>
              <h3 className="text-sm font-black text-white">Export Students</h3>
              <p className="text-blue-100 text-[11px] mt-0.5">Download filtered records as Excel or CSV</p>
            </div>
          </div>
          <div className="p-5 flex items-center gap-5 flex-wrap">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-600">Export across all colleges or filter by college, branch, batch, or placement status.</p>
              <div className="flex items-center gap-4 mt-3 flex-wrap">
                {['Filter by college/branch/batch','Preview count before download','Excel or CSV format'].map((t,i)=>(
                  <span key={i} className="flex items-center gap-1.5 text-xs text-slate-400"><ChevronRight size={11} className="text-slate-300 flex-shrink-0"/>{t}</span>
                ))}
              </div>
            </div>
            <button onClick={()=>setModal('export')} className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-500/20">
              <FileDown size={14}/> Open Export
            </button>
          </div>
        </div>

        {/* ── LIVE STUDENT LIST ── */}
        <StudentListSection colleges={colleges} key={refreshList}/>

        {/* Column reference */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="mb-5">
            <SHead icon={Info} title="Excel Upload — Column Reference" sub="Use exact header names in your spreadsheet"/>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-[10px] font-black text-red-500 uppercase tracking-wider mb-3">Required Columns</p>
              <div className="space-y-2">
                {[
                  ['name','Full student name (min 2 chars)'],
                  ['email','Unique — existing emails will be BLOCKED'],
                  ['roll_number','Unique per college — duplicates blocked'],
                ].map(([c,d])=>(
                  <div key={c} className="flex items-start gap-3">
                    <code className="px-2 py-0.5 bg-red-50 text-red-700 rounded-md text-xs font-mono border border-red-100 flex-shrink-0 mt-0.5">{c}</code>
                    <span className="text-xs text-slate-400">{d}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3">Optional Columns</p>
              <div className="space-y-2">
                {[
                  ['phone','10-digit mobile number'],
                  ['branch','CSE/ECE/EEE/MECH/CIVIL/IT/AI/ML/DS/Other'],
                  ['batch','Graduation year e.g. 2026'],
                  ['semester','Integer 1–8'],
                  ['cgpa','Decimal 0.0–10.0'],
                ].map(([c,d])=>(
                  <div key={c} className="flex items-start gap-3">
                    <code className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-xs font-mono border border-slate-200 flex-shrink-0 mt-0.5">{c}</code>
                    <span className="text-xs text-slate-400">{d}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-5 flex items-start gap-2 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
            <AlertTriangle size={13} className="flex-shrink-0 mt-0.5"/>
            <span>
              <strong>No password column needed</strong> — passwords are auto-generated and emailed.
              Existing emails and roll numbers are <strong>automatically detected and blocked</strong> before the Confirm button is enabled.
            </span>
          </div>
        </div>
      </div>

      {/* ── Modals render via portal above sidebar ── */}
      {modal==='single'   && <AddSingleModal   colleges={colleges} onClose={()=>setModal(null)} onDone={handleDone}/>}
      {modal==='multiple' && <AddMultipleModal colleges={colleges} onClose={()=>setModal(null)} onDone={handleDone}/>}
      {modal==='upload'   && <BulkUploadModal  colleges={colleges} onClose={()=>setModal(null)} onDone={handleDone}/>}
      {modal==='export'   && <ExportModal      colleges={colleges} onClose={()=>setModal(null)}/>}
    </SuperAdminDashboardLayout>
  );
}