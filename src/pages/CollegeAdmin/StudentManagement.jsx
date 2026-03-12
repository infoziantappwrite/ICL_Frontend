// src/pages/CollegeAdmin/StudentManagement.jsx
// Redesigned to match SuperAdmin portal theme — blue/cyan gradient, portal modals, action cards
import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import CollegeAdminLayout from '../../components/layout/CollegeAdminLayout';
import { useToast } from '../../context/ToastContext';
import { collegeAdminStudentAPI } from '../../api/studentAPI';
import {
  GraduationCap, Search, SlidersHorizontal, Upload, RefreshCw,
  X, ChevronLeft, ChevronRight, CheckCircle, AlertTriangle,
  AlertCircle, FileText, Download, CloudUpload, FileDown,
  ClipboardCheck, Users, UserCheck, UserX, TrendingUp,
  Layers, Info, Plus, Trash2, UserPlus, UsersRound,
  KeyRound, Mail, Hash, BookOpen, Star, Calendar, Phone,
  Eye, ArrowLeft, UploadCloud, Building2,
} from 'lucide-react';

const BRANCHES  = ['CSE','ECE','EEE','MECH','CIVIL','IT','AI/ML','DS','Other'];
const SEMESTERS = ['1','2','3','4','5','6','7','8'];
const REQUIRED_COLS = ['name','email','roll_number'];
const PER_PAGE  = 25;

/* ══════════════════════════════════════════════════════════
   ATOMS
══════════════════════════════════════════════════════════ */
const Spin = ({ size = 'md', color = 'blue' }) => {
  const sz = { sm:'w-3.5 h-3.5', md:'w-5 h-5', lg:'w-8 h-8' }[size];
  const cl = { white:'border-white', blue:'border-blue-500', slate:'border-slate-400', green:'border-emerald-500', indigo:'border-indigo-500' }[color];
  return <div className={`${sz} ${cl} border-2 border-t-transparent rounded-full animate-spin flex-shrink-0`}/>;
};

const Tag = ({ children, variant = 'default' }) => {
  const v = {
    default: 'bg-slate-100 text-slate-600',
    blue:    'bg-blue-50   text-blue-700   ring-1 ring-blue-200',
    green:   'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    red:     'bg-red-50    text-red-600    ring-1 ring-red-200',
    amber:   'bg-amber-50  text-amber-700  ring-1 ring-amber-200',
    slate:   'bg-slate-100 text-slate-500  ring-1 ring-slate-200',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${v[variant]}`}>
      {children}
    </span>
  );
};

/* ── Portal Modal (renders to document.body → above sidebar) ── */
const Modal = ({ children, onClose, size = 'lg' }) => {
  const w = { sm:'max-w-md', md:'max-w-xl', lg:'max-w-2xl', xl:'max-w-4xl', full:'max-w-6xl' }[size];

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
          <h2 className="text-white font-black text-base leading-none">{title}</h2>
          {sub && <p className="text-blue-100 text-[11px] mt-1">{sub}</p>}
        </div>
      </div>
      {onClose && (
        <button onClick={onClose}
          className="w-8 h-8 bg-white/15 hover:bg-white/30 rounded-xl flex items-center justify-center text-white transition-colors">
          <X className="w-4 h-4"/>
        </button>
      )}
    </div>
  </div>
);

/* ── Section heading ── */
const SHead = ({ icon: Icon, title, sub }) => (
  <div className="flex items-center gap-2 mb-1">
    <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
      <Icon className="w-3 h-3 text-white"/>
    </div>
    <div>
      <h3 className="text-sm font-bold text-gray-800 leading-none">{title}</h3>
      {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

/* ── Field component ── */
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

const BASE_INPUT = 'w-full text-sm border rounded-xl py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition placeholder:text-slate-300';
const I_ICON  = `${BASE_INPUT} pl-9 pr-3`;
const I_PLAIN = `${BASE_INPUT} px-3`;
const OK_CLS  = 'border-slate-200';
const ERR_CLS = 'border-red-300 bg-red-50/40';

/* ══════════════════════════════════════════════════════════
   MODAL 1 — ADD SINGLE STUDENT
══════════════════════════════════════════════════════════ */
const EMPTY_STUDENT = {
  fullName: '', email: '', rollNumber: '', branch: '',
  semester: '', cgpa: '', batch: '', phone: '',
  tenthPercentage: '', twelfthPercentage: '',
  activeBacklogs: '', totalBacklogs: '', gapYears: '',
  isEligibleForPlacements: true,
};

function AddSingleModal({ onClose, onDone }) {
  const toast = useToast();
  const [step, setStep]           = useState('form'); // 'form' | 'preview' | 'success'
  const [form, setForm]           = useState(EMPTY_STUDENT);
  const [saving, setSaving]       = useState(false);
  const [errors, setErrors]       = useState({});
  const [successData, setSuccess] = useState(null);

  const setF = (k, v) => {
    setForm(p => ({...p, [k]: v}));
    if (errors[k]) setErrors(p => ({...p, [k]: ''}));
  };

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email format';
    if (!form.rollNumber.trim()) e.rollNumber = 'Roll number is required';
    if (form.cgpa && (isNaN(form.cgpa) || +form.cgpa < 0 || +form.cgpa > 10)) e.cgpa = 'CGPA must be 0.0–10.0';
    return e;
  };

  const goPreview = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setStep('preview');
  };

  const confirm = async () => {
    setSaving(true);
    try {
      const payload = {
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        rollNumber: form.rollNumber.trim(),
        ...(form.branch && { branch: form.branch }),
        ...(form.semester && { semester: parseInt(form.semester) }),
        ...(form.cgpa && { cgpa: parseFloat(form.cgpa) }),
        ...(form.batch && { batch: form.batch.trim() }),
        ...(form.phone && { phone: form.phone.trim() }),
        ...(form.tenthPercentage && { tenthPercentage: parseFloat(form.tenthPercentage) }),
        ...(form.twelfthPercentage && { twelfthPercentage: parseFloat(form.twelfthPercentage) }),
        ...(form.activeBacklogs !== '' && { activeBacklogs: parseInt(form.activeBacklogs) || 0 }),
        ...(form.totalBacklogs !== '' && { totalBacklogs: parseInt(form.totalBacklogs) || 0 }),
        ...(form.gapYears !== '' && { gapYears: parseInt(form.gapYears) || 0 }),
        isEligibleForPlacements: form.isEligibleForPlacements,
      };
      const res = await collegeAdminStudentAPI.addStudent(payload);
      setSuccess(res.data || { fullName: form.fullName, email: form.email });
      setStep('success');
      onDone?.();
    } catch(err) {
      toast.error('Failed to add student', err.message);
      setStep('form');
    } finally {
      setSaving(false);
    }
  };

  /* ── Success ── */
  if (step === 'success' && successData) {
    return (
      <Modal onClose={onClose} size="md">
        <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
          <MHead icon={CheckCircle} title="Student Created!" sub="Temporary password sent to student's email" onClose={onClose}/>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center text-white font-black text-xl flex-shrink-0">
                {successData.fullName?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <p className="font-black text-slate-800">{successData.fullName}</p>
                <p className="text-xs text-slate-500 mt-0.5">{successData.email}</p>
                {successData.rollNumber && <p className="text-xs text-blue-600 font-mono mt-0.5">{successData.rollNumber}</p>}
              </div>
            </div>
            {successData.temporaryPassword && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <KeyRound size={12}/> Temporary Password
                </p>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-lg font-mono font-black text-amber-900 tracking-widest">
                    {successData.temporaryPassword}
                  </code>
                  <button
                    onClick={() => { navigator.clipboard.writeText(successData.temporaryPassword); toast.success('Copied!'); }}
                    className="text-xs px-3 py-1 bg-amber-200 text-amber-800 rounded-lg hover:bg-amber-300 transition font-bold"
                  >Copy</button>
                </div>
                <p className="text-xs text-amber-700 mt-2">Share with student. They'll be prompted to change on first login.</p>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => { setSuccess(null); setForm(EMPTY_STUDENT); setStep('form'); }}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">
                Add Another
              </button>
              <button onClick={onClose}
                className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-bold rounded-xl hover:opacity-90">
                Done
              </button>
            </div>
          </div>
        </div>
      </Modal>
    );
  }

  /* ── Preview ── */
  if (step === 'preview') {
    const rows = [
      { label:'Full Name',    value: form.fullName,                    icon: UserPlus },
      { label:'Email',        value: form.email,                       icon: Mail },
      { label:'Roll Number',  value: form.rollNumber,                  icon: Hash },
      { label:'Branch',       value: form.branch || '—',               icon: BookOpen },
      { label:'Semester',     value: form.semester ? `Sem ${form.semester}` : '—', icon: Layers },
      { label:'CGPA',         value: form.cgpa || '—',                 icon: Star },
      { label:'Batch',        value: form.batch || '—',                icon: Calendar },
      { label:'Phone',        value: form.phone || '—',                icon: Phone },
    ];
    return (
      <Modal onClose={onClose} size="md">
        <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
          <MHead icon={Eye} title="Preview — Confirm Details" sub="Review before saving to database" onClose={onClose}/>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center text-white font-black text-xl flex-shrink-0">
                {form.fullName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-black text-slate-800">{form.fullName}</p>
                <p className="text-xs text-slate-500 mt-0.5">{form.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {rows.map(r => (
                <div key={r.label} className="flex items-center gap-2 py-2 px-3 bg-slate-50 rounded-lg border border-slate-100">
                  <r.icon size={12} className="text-slate-400 flex-shrink-0"/>
                  <div className="min-w-0">
                    <p className="text-[9px] text-slate-400 uppercase tracking-wide font-semibold">{r.label}</p>
                    <p className="text-xs font-bold text-slate-700 truncate">{r.value}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700">
              <KeyRound size={12} className="flex-shrink-0 mt-0.5"/>
              A secure password is auto-generated — the student can reset it after first login.
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep('form')}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-colors">
                <ArrowLeft size={13}/> Edit
              </button>
              <button onClick={confirm} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 text-white text-sm font-bold rounded-xl disabled:opacity-60 transition-opacity">
                {saving ? <><Spin size="sm" color="white"/>Saving…</> : <><CheckCircle size={14}/>Confirm & Add Student</>}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    );
  }

  /* ── Form ── */
  return (
    <Modal onClose={onClose} size="md">
      <div className="bg-white rounded-2xl overflow-hidden flex flex-col max-h-[92vh] shadow-2xl">
        <MHead icon={UserPlus} title="Add Single Student" sub="Fill details, preview, then confirm" onClose={onClose}/>

        <div className="mx-5 mt-4 flex items-center gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl flex-shrink-0">
          <KeyRound size={13} className="text-amber-600 flex-shrink-0"/>
          <p className="text-xs text-amber-700">
            A <strong>secure password is auto-generated</strong> by the system. The student can reset it after first login.
          </p>
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name" required icon={UserPlus} error={errors.fullName}>
              <input className={`${I_ICON} ${errors.fullName ? ERR_CLS : OK_CLS}`} placeholder="e.g. Ravi Kumar"
                value={form.fullName} onChange={e => setF('fullName', e.target.value)}/>
            </Field>
            <Field label="Email Address" required icon={Mail} error={errors.email}>
              <input type="email" className={`${I_ICON} ${errors.email ? ERR_CLS : OK_CLS}`} placeholder="student@college.edu"
                value={form.email} onChange={e => setF('email', e.target.value)}/>
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Roll Number" required icon={Hash} error={errors.rollNumber} hint="Must be unique within this college">
              <input className={`${I_ICON} font-mono ${errors.rollNumber ? ERR_CLS : OK_CLS}`} placeholder="e.g. 21CSE001"
                value={form.rollNumber} onChange={e => setF('rollNumber', e.target.value)}/>
            </Field>
            <Field label="Phone Number" icon={Phone}>
              <input type="tel" className={`${I_ICON} ${OK_CLS}`} placeholder="10-digit mobile number"
                value={form.phone} onChange={e => setF('phone', e.target.value)}/>
            </Field>
          </div>
          <div className="h-px bg-slate-100"/>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Department / Branch" icon={BookOpen}>
              <select className={`${I_ICON} ${OK_CLS} appearance-none`} value={form.branch} onChange={e => setF('branch', e.target.value)}>
                <option value="">Select department</option>
                {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </Field>
            <Field label="Semester" icon={Layers}>
              <select className={`${I_ICON} ${OK_CLS} appearance-none`} value={form.semester} onChange={e => setF('semester', e.target.value)}>
                <option value="">Select semester</option>
                {SEMESTERS.map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="CGPA" icon={Star} error={errors.cgpa} hint="Scale 0.0–10.0">
              <input type="number" step="0.01" min="0" max="10" className={`${I_ICON} ${errors.cgpa ? ERR_CLS : OK_CLS}`}
                placeholder="e.g. 8.50" value={form.cgpa} onChange={e => setF('cgpa', e.target.value)}/>
            </Field>
            <Field label="Batch (Graduation Year)" icon={Calendar}>
              <input type="text" className={`${I_ICON} ${OK_CLS}`} placeholder="e.g. 2026"
                value={form.batch} onChange={e => setF('batch', e.target.value)}/>
            </Field>
          </div>
          <div className="h-px bg-slate-100"/>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Academic Records</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="10th Percentage (%)" icon={BookOpen}>
              <input type="number" step="0.01" min="0" max="100" className={`${I_ICON} ${OK_CLS}`}
                placeholder="e.g. 88.5" value={form.tenthPercentage} onChange={e => setF('tenthPercentage', e.target.value)}/>
            </Field>
            <Field label="12th Percentage (%)" icon={BookOpen}>
              <input type="number" step="0.01" min="0" max="100" className={`${I_ICON} ${OK_CLS}`}
                placeholder="e.g. 85.0" value={form.twelfthPercentage} onChange={e => setF('twelfthPercentage', e.target.value)}/>
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Active Backlogs" icon={AlertTriangle}>
              <input type="number" min="0" className={`${I_ICON} ${OK_CLS}`} placeholder="0"
                value={form.activeBacklogs} onChange={e => setF('activeBacklogs', e.target.value)}/>
            </Field>
            <Field label="Total Backlogs" icon={AlertTriangle}>
              <input type="number" min="0" className={`${I_ICON} ${OK_CLS}`} placeholder="0"
                value={form.totalBacklogs} onChange={e => setF('totalBacklogs', e.target.value)}/>
            </Field>
            <Field label="Gap Years" icon={Calendar}>
              <input type="number" min="0" className={`${I_ICON} ${OK_CLS}`} placeholder="0"
                value={form.gapYears} onChange={e => setF('gapYears', e.target.value)}/>
            </Field>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <input type="checkbox" id="eligible" checked={form.isEligibleForPlacements}
              onChange={e => setF('isEligibleForPlacements', e.target.checked)}
              className="w-4 h-4 rounded text-blue-600"/>
            <label htmlFor="eligible" className="text-sm font-medium text-slate-700 cursor-pointer">
              Eligible for Placements
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-slate-100 bg-slate-50 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors">Cancel</button>
          <button onClick={goPreview}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 text-white text-sm font-bold rounded-xl transition-opacity shadow-sm shadow-blue-500/20">
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
const EMPTY_ROW = () => ({
  id: Math.random().toString(36).slice(2),
  fullName: '', email: '', rollNumber: '', branch: '',
  semester: '', cgpa: '', batch: '', phone: '',
});

function AddMultipleModal({ onClose, onDone }) {
  const toast = useToast();
  const [step, setStep]         = useState('table'); // 'table' | 'preview' | 'success'
  const [rows, setRows]         = useState([EMPTY_ROW(), EMPTY_ROW(), EMPTY_ROW()]);
  const [saving, setSaving]     = useState(false);
  const [rowErrors, setRowErr]  = useState({});
  const [result, setResult]     = useState(null);
  const [filledRows, setFilled] = useState([]);

  const addRow = () => setRows(p => [...p, EMPTY_ROW()]);
  const removeRow = (id) => setRows(p => p.filter(r => r.id !== id));
  const setCell = (id, field, value) => {
    setRows(p => p.map(r => r.id === id ? {...r, [field]: value} : r));
    setRowErr(p => { const n = {...p}; if (n[id]) delete n[id][field]; return n; });
  };

  const validate = () => {
    const errs = {};
    const emails = new Set(); const rolls = new Set();
    const filled = rows.filter(r => r.fullName.trim() || r.email.trim() || r.rollNumber.trim());
    if (!filled.length) { toast.error('No data', 'Fill in at least one student row.'); return null; }
    filled.forEach(r => {
      const e = {};
      if (!r.fullName.trim()) e.fullName = 'Required';
      if (!r.email.trim()) e.email = 'Required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email)) e.email = 'Invalid';
      else if (emails.has(r.email.toLowerCase())) e.email = 'Duplicate';
      else emails.add(r.email.toLowerCase());
      if (!r.rollNumber.trim()) e.rollNumber = 'Required';
      else if (rolls.has(r.rollNumber.toLowerCase())) e.rollNumber = 'Duplicate';
      else rolls.add(r.rollNumber.toLowerCase());
      if (r.cgpa && (isNaN(r.cgpa) || +r.cgpa < 0 || +r.cgpa > 10)) e.cgpa = '0–10';
      if (Object.keys(e).length) errs[r.id] = e;
    });
    return { errs, filled };
  };

  const goPreview = () => {
    const v = validate();
    if (!v) return;
    if (Object.keys(v.errs).length) { setRowErr(v.errs); toast.error('Validation errors', 'Fix highlighted cells first.'); return; }
    setFilled(v.filled);
    setStep('preview');
  };

  const confirm = async () => {
    setSaving(true);
    try {
      const students = filledRows.map(r => ({
        fullName: r.fullName.trim(),
        email: r.email.trim().toLowerCase(),
        rollNumber: r.rollNumber.trim(),
        ...(r.branch && { branch: r.branch }),
        ...(r.semester && { semester: parseInt(r.semester) }),
        ...(r.cgpa && { cgpa: parseFloat(r.cgpa) }),
        ...(r.batch && { batch: r.batch.trim() }),
        ...(r.phone && { phone: r.phone.trim() }),
      }));
      const res = await collegeAdminStudentAPI.addStudents(students);
      setResult({ count: res.totalCreated || res.data?.length || students.length, passwords: res.data || [] });
      setStep('success');
      onDone?.();
    } catch(err) {
      toast.error('Failed', err.message);
      setStep('table');
    } finally {
      setSaving(false);
    }
  };

  const filledCount = rows.filter(r => r.fullName.trim() || r.email.trim() || r.rollNumber.trim()).length;

  /* ── Success ── */
  if (step === 'success' && result) {
    return (
      <Modal onClose={onClose} size="lg">
        <div className="bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
          <MHead icon={CheckCircle} title={`${result.count} Students Created!`} sub="Temporary passwords emailed to each student" onClose={onClose}/>
          <div className="overflow-y-auto flex-1 p-6">
            {result.passwords.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <KeyRound size={12}/> Temporary Passwords
                </p>
                {result.passwords.map((s, i) => (
                  <div key={s.id || i} className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-xl gap-3">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center text-white font-black text-[11px] flex-shrink-0">
                        {s.fullName?.charAt(0)?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{s.fullName}</p>
                        <p className="text-xs text-slate-500 truncate">{s.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <code className="text-sm font-mono font-bold text-amber-900 bg-amber-100 px-2 py-1 rounded-lg">
                        {s.temporaryPassword}
                      </code>
                      <button onClick={() => navigator.clipboard.writeText(s.temporaryPassword)}
                        className="text-xs px-2 py-1 bg-amber-200 text-amber-800 rounded-lg hover:bg-amber-300 transition font-bold">
                        Copy
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <UsersRound size={32} className="text-blue-500 mx-auto mb-3"/>
                <p className="text-2xl font-black text-slate-800">{result.count}</p>
                <p className="text-sm text-slate-500">students added with auto-generated passwords</p>
              </div>
            )}
          </div>
          <div className="flex justify-end px-6 pb-6 pt-4 border-t border-slate-100 flex-shrink-0">
            <button onClick={() => { onDone?.(); onClose(); }}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 text-white text-sm font-bold rounded-xl">
              Done
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  /* ── Preview ── */
  if (step === 'preview') {
    return (
      <Modal onClose={onClose} size="xl">
        <div className="bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
          <MHead icon={Eye} title={`Preview — ${filledRows.length} Students`} sub="Passwords auto-generated on confirm" onClose={onClose}/>
          <div className="overflow-auto flex-1">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['#','Name','Email','Roll No','Branch','Batch','Sem','CGPA','Phone'].map(h => (
                    <th key={h} className="py-2.5 px-3 text-left font-bold text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filledRows.map((r, i) => (
                  <tr key={r.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="py-2 px-3 text-slate-300 font-mono">{i+1}</td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-md flex items-center justify-center text-white font-black text-[10px] flex-shrink-0">
                          {r.fullName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-800">{r.fullName}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-slate-500">{r.email}</td>
                    <td className="py-2 px-3 font-mono text-blue-600">{r.rollNumber}</td>
                    <td className="py-2 px-3">{r.branch || '—'}</td>
                    <td className="py-2 px-3">{r.batch || '—'}</td>
                    <td className="py-2 px-3 text-center">{r.semester || '—'}</td>
                    <td className="py-2 px-3">{r.cgpa || '—'}</td>
                    <td className="py-2 px-3">{r.phone || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between gap-3 p-4 border-t border-slate-100 bg-slate-50 flex-shrink-0">
            <button onClick={() => setStep('table')}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-colors">
              <ArrowLeft size={13}/> Edit Table
            </button>
            <button onClick={confirm} disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 text-white text-sm font-bold rounded-xl disabled:opacity-60">
              {saving ? <><Spin size="sm" color="white"/>Adding Students…</> : <><CheckCircle size={14}/>Confirm & Add {filledRows.length} Students</>}
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  /* ── Table ── */
  const cols = [
    { key: 'fullName',   label: 'Full Name',  required: true,  width: 'w-36', placeholder: 'Ravi Kumar',   type: 'text' },
    { key: 'email',      label: 'Email',       required: true,  width: 'w-44', placeholder: 'email@edu.in', type: 'email' },
    { key: 'rollNumber', label: 'Roll Number', required: true,  width: 'w-28', placeholder: '21CSE001',     type: 'text' },
    { key: 'branch',     label: 'Department',  required: false, width: 'w-28', type: 'select', options: BRANCHES },
    { key: 'semester',   label: 'Semester',    required: false, width: 'w-24', type: 'select', options: SEMESTERS.map(s => ({ value: s, label: `Sem ${s}` })) },
    { key: 'cgpa',       label: 'CGPA',        required: false, width: 'w-20', placeholder: '8.50',         type: 'number' },
    { key: 'batch',      label: 'Batch',       required: false, width: 'w-20', placeholder: '2026',         type: 'text' },
    { key: 'phone',      label: 'Phone',       required: false, width: 'w-28', placeholder: '9876543210',   type: 'tel' },
  ];

  return (
    <Modal onClose={onClose} size="xl">
      <div className="bg-white rounded-2xl overflow-hidden flex flex-col max-h-[92vh] shadow-2xl">
        <MHead icon={UsersRound} title="Add Multiple Students" gradient="from-violet-600 via-purple-600 to-violet-500"
          sub="Fill the table, preview, then confirm — passwords auto-generated" onClose={onClose}/>

        <div className="mx-5 mt-4 flex items-center gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl flex-shrink-0">
          <KeyRound size={13} className="text-amber-600 flex-shrink-0"/>
          <p className="text-xs text-amber-700 flex-1">
            <strong>Passwords are auto-generated</strong> — you only need Name, Email, and Roll Number per student.
            Fields marked <span className="text-red-500 font-bold">*</span> are required.
          </p>
          <span className="text-xs font-bold text-amber-600 flex-shrink-0">{filledCount} filled</span>
        </div>

        <div className="flex-1 overflow-auto px-5 py-4">
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 text-left font-bold text-slate-400 uppercase tracking-wide w-10">#</th>
                    {cols.map(c => (
                      <th key={c.key} className={`py-2.5 px-2 text-left font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap ${c.width}`}>
                        {c.label}{c.required && <span className="text-red-500 ml-0.5">*</span>}
                      </th>
                    ))}
                    <th className="py-2.5 px-2 w-8"/>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row, idx) => (
                    <tr key={row.id} className={`group transition-colors ${rowErrors[row.id] ? 'bg-red-50/40' : 'hover:bg-slate-50/60'}`}>
                      <td className="py-1.5 px-3 text-slate-300 font-mono text-xs w-10">{idx + 1}</td>
                      {cols.map(col => {
                        const err = rowErrors[row.id]?.[col.key];
                        const base = `w-full text-xs border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400 transition ${
                          err ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white focus:border-blue-400'
                        }`;
                        return (
                          <td key={col.key} className="py-1.5 px-2">
                            {col.type === 'select' ? (
                              <select className={`${base} appearance-none`} value={row[col.key]}
                                onChange={e => setCell(row.id, col.key, e.target.value)}>
                                <option value="">—</option>
                                {col.options?.map(o => typeof o === 'string'
                                  ? <option key={o} value={o}>{col.key === 'semester' ? `Sem ${o}` : o}</option>
                                  : <option key={o.value} value={o.value}>{o.label}</option>
                                )}
                              </select>
                            ) : (
                              <input type={col.type} placeholder={col.placeholder}
                                className={`${base} ${col.key === 'rollNumber' ? 'font-mono' : ''}`}
                                value={row[col.key]} onChange={e => setCell(row.id, col.key, e.target.value)}/>
                            )}
                            {err && <p className="text-red-500 mt-0.5 text-xs leading-tight">{err}</p>}
                          </td>
                        );
                      })}
                      <td className="py-1.5 px-2">
                        {rows.length > 1 && (
                          <button onClick={() => removeRow(row.id)}
                            className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-lg bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 flex items-center justify-center transition-all">
                            <Trash2 size={11}/>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <button onClick={addRow}
            className="mt-3 flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors px-2">
            <Plus size={13}/> Add another row
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-slate-100 bg-slate-50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={() => setRows([EMPTY_ROW(), EMPTY_ROW(), EMPTY_ROW()])}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors underline underline-offset-2">
              Reset rows
            </button>
            <span className="text-slate-200">|</span>
            <span className="text-xs text-slate-400">{filledCount} student{filledCount !== 1 ? 's' : ''} ready</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors">Cancel</button>
            <button onClick={goPreview} disabled={filledCount === 0}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:opacity-90 text-white text-sm font-bold rounded-xl disabled:opacity-40 transition-opacity">
              <Eye size={14}/> Preview {filledCount > 0 ? filledCount : ''} Student{filledCount !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════════════
   MODAL 3 — BULK UPLOAD (Excel/CSV)
══════════════════════════════════════════════════════════ */
function BulkUploadModal({ onClose, onDone }) {
  const toast   = useToast();
  const fileRef = useRef(null);
  const [step, setStep]             = useState('drop'); // 'drop' | 'preview' | 'validating' | 'results' | 'uploading' | 'done'
  const [file, setFile]             = useState(null);
  const [dragOver, setDragOver]     = useState(false);
  const [parsedRows, setParsed]     = useState(null);
  const [headers, setHeaders]       = useState([]);
  const [rowErrors, setRowErrors]   = useState({});
  const [vr, setVr]                 = useState(null);
  const [ur, setUr]                 = useState(null);
  const [parseLoading, setParsing]  = useState(false);
  const [tmpl, setTmpl]             = useState(false);

  const errorCount = Object.values(rowErrors).filter(e => Object.keys(e).length > 0).length;
  const validCount = parsedRows ? parsedRows.length - errorCount : 0;

  const parseFile = async (f) => {
    setParsing(true);
    try {
      const XLSX = await import('xlsx');
      const buffer = await f.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array', raw: false });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json(ws, { raw: false, defval: '' });
      if (!rawRows.length) { toast.error('Empty file', 'No data rows found.'); return; }
      const normalized = rawRows.map((row, idx) => {
        const n = { _rowIndex: idx + 2 };
        Object.keys(row).forEach(k => { n[k.trim().toLowerCase().replace(/\s+/g, '_')] = String(row[k] ?? '').trim(); });
        return n;
      });
      const hdrs = Object.keys(normalized[0]).filter(k => !k.startsWith('_'));
      setHeaders(hdrs);
      // Client-side validation
      const errs = {};
      const emails = new Set(); const rolls = new Set();
      normalized.forEach((row, i) => {
        const e = {};
        const name = row['name'] || row['full_name'] || row['fullname'] || '';
        const email = row['email'] || '';
        const roll = row['roll_number'] || row['rollnumber'] || row['roll_no'] || '';
        if (!name.trim()) e['name'] = 'Required';
        if (!email.trim()) e['email'] = 'Required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e['email'] = 'Invalid email';
        else if (emails.has(email.toLowerCase())) e['email'] = 'Duplicate in file';
        else emails.add(email.toLowerCase());
        if (!roll.trim()) e['roll_number'] = 'Required';
        else if (rolls.has(roll.toLowerCase())) e['roll_number'] = 'Duplicate in file';
        else rolls.add(roll.toLowerCase());
        if (Object.keys(e).length) errs[i] = e;
      });
      setParsed(normalized);
      setRowErrors(errs);
      setFile(f);
      setStep('preview');
    } catch(e) {
      toast.error('Parse error', e.message);
    } finally {
      setParsing(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) accept(f);
  };

  const accept = (f) => {
    const ext = f.name.split('.').pop().toLowerCase();
    if (!['xlsx','xls','csv'].includes(ext)) { toast.error('Invalid file', 'Only .xlsx, .xls, .csv files.'); return; }
    parseFile(f);
  };

  const doValidate = async () => {
    setStep('validating');
    try {
      const r = await collegeAdminStudentAPI.validateBulkUploadJSON(parsedRows);
      setVr(r.data || r);
      setStep('results');
    } catch(e) { toast.error('Validation failed', e.message); setStep('preview'); }
  };

  const doUpload = async () => {
    setStep('uploading');
    try {
      const r = await collegeAdminStudentAPI.bulkUploadJSON(parsedRows);
      setUr(r.data || r);
      setStep('done');
      onDone?.();
    } catch(e) { toast.error('Upload failed', e.message); setStep('results'); }
  };

  const getTemplate = async () => {
    setTmpl(true);
    try { await collegeAdminStudentAPI.downloadTemplate(); toast.success('Downloaded!', 'Template saved.'); }
    catch(e) { toast.error('Error', e.message); }
    finally { setTmpl(false); }
  };

  const reset = () => { setFile(null); setParsed(null); setHeaders([]); setRowErrors({}); setVr(null); setUr(null); setStep('drop'); };

  /* ── Done ── */
  if (step === 'done' && ur) {
    return (
      <Modal onClose={onClose} size="lg">
        <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
          <MHead icon={CheckCircle} title="Bulk Upload Complete!" sub="Students created and welcome emails sent" onClose={onClose}/>
          <div className="p-6 space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 flex flex-col items-center text-center gap-2">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle size={28} className="text-emerald-500"/>
              </div>
              <p className="text-lg font-black text-emerald-800">Upload Complete!</p>
              <p className="text-sm text-emerald-600">{ur.inserted ?? 0} new · {ur.updated ?? 0} updated · {ur.successCount ?? 0} total</p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[['New Students', ur.inserted ?? 0, 'text-emerald-600'], ['Updated', ur.updated ?? 0, 'text-blue-600'], ['Batches Run', ur.batchCount ?? 1, 'text-slate-600']].map(([l,v,c]) => (
                <div key={l} className="bg-white rounded-xl border border-slate-100 py-3">
                  <div className={`text-2xl font-black ${c}`}>{v}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{l}</div>
                </div>
              ))}
            </div>
            <button onClick={() => { onDone?.(); onClose(); }}
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 text-white text-sm font-bold rounded-xl">
              Done
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  /* ── Preview table ── */
  if (step === 'preview' && parsedRows) {
    const displayHdrs = headers.filter(h => !h.startsWith('_'));
    return (
      <Modal onClose={onClose} size="full">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
          <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 px-6 py-4 flex-shrink-0 rounded-t-2xl">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center"><FileText className="w-4 h-4 text-white"/></div>
                <div>
                  <h2 className="text-white font-black text-sm">{file?.name}</h2>
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

          {errorCount > 0 && (
            <div className="px-5 py-2.5 flex items-start gap-2 bg-red-50 border-b border-red-100 flex-shrink-0">
              <AlertTriangle size={13} className="text-red-500 flex-shrink-0 mt-0.5"/>
              <span className="text-xs text-red-700 font-medium">
                <strong>{errorCount} row(s) have errors</strong> — highlighted in red. Fix the source file and re-upload.
              </span>
            </div>
          )}

          <div className="overflow-auto flex-1">
            <table className="w-full text-xs border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-800 text-white">
                  <th className="text-left py-2.5 px-3 font-semibold text-[11px] w-10 border-r border-slate-700">Row</th>
                  <th className="text-center py-2.5 px-2 font-semibold text-[11px] w-8 border-r border-slate-700">✓</th>
                  {displayHdrs.map(h => (
                    <th key={h} className={`text-left py-2.5 px-3 font-semibold text-[11px] whitespace-nowrap min-w-[100px] border-r border-slate-700 last:border-r-0 ${REQUIRED_COLS.includes(h) ? 'text-yellow-300' : ''}`}>
                      {h.replace(/_/g,' ').toUpperCase()}{REQUIRED_COLS.includes(h) && <span className="ml-1 opacity-60">*</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsedRows.map((row, i) => {
                  const rowErr = rowErrors[i] || {};
                  const hasErr = Object.keys(rowErr).length > 0;
                  return (
                    <tr key={i} className={`border-b ${hasErr ? 'border-red-100 bg-red-50/20' : 'border-slate-100 ' + (i%2===0 ? 'bg-white' : 'bg-slate-50/30')}`}>
                      <td className="py-2 px-3 text-slate-400 font-mono text-[11px] border-r border-slate-100">{row._rowIndex || i+2}</td>
                      <td className="py-2 px-2 text-center border-r border-slate-100">
                        {hasErr
                          ? <AlertCircle size={12} className="text-red-500 mx-auto"/>
                          : <CheckCircle size={12} className="text-green-500 mx-auto"/>}
                      </td>
                      {displayHdrs.map(h => {
                        const cellErr = rowErr[h];
                        return (
                          <td key={h} className={`py-2 px-3 border-r border-slate-50 last:border-r-0 ${cellErr ? 'bg-red-100 border border-red-300' : ''}`}>
                            <div className="relative group">
                              <span className={cellErr ? 'text-red-700 font-semibold' : 'text-slate-700'}>
                                {row[h] || <span className="text-slate-300 text-[10px]">—</span>}
                              </span>
                              {cellErr && (
                                <div className="absolute bottom-full left-0 mb-1 z-30 bg-red-700 text-white text-[10px] px-2.5 py-1.5 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none shadow-xl transition-opacity">
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
              <span className="text-xs text-slate-400">{parsedRows.length} total</span>
            </div>
            <div className="flex gap-2">
              <button onClick={reset} className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-colors">
                <ArrowLeft size={13}/> Re-upload
              </button>
              <button onClick={doValidate} disabled={errorCount > 0}
                className={`flex items-center gap-2 px-6 py-2 text-sm font-bold rounded-xl transition-all ${
                  errorCount === 0
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}>
                <ClipboardCheck size={14}/> Validate {validCount} Rows
              </button>
            </div>
          </div>
        </div>
      </Modal>
    );
  }

  /* ── Validating/Uploading loader ── */
  if (step === 'validating' || step === 'uploading') {
    const msg = step === 'validating' ? 'Validating data…' : 'Uploading students…';
    const sub = step === 'validating' ? `Checking all ${parsedRows?.length} rows` : 'Processing in batches';
    return (
      <Modal onClose={() => {}} size="md">
        <div className="bg-white rounded-2xl overflow-hidden shadow-2xl p-10 flex flex-col items-center gap-4">
          <Spin size="lg" color="blue"/>
          <p className="text-sm font-bold text-slate-700">{msg}</p>
          <p className="text-xs text-slate-400">{sub}</p>
        </div>
      </Modal>
    );
  }

  /* ── Validation Results ── */
  if (step === 'results' && vr) {
    return (
      <Modal onClose={onClose} size="md">
        <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
          <MHead icon={ClipboardCheck} title="Validation Results" sub="Check errors before uploading" onClose={onClose}/>
          <div className="p-6 space-y-4">
            <div className={`rounded-xl p-4 border ${vr.canProceed ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center gap-2 mb-3">
                {vr.canProceed ? <CheckCircle size={15} className="text-emerald-500"/> : <AlertTriangle size={15} className="text-red-500"/>}
                <p className={`text-sm font-bold ${vr.canProceed ? 'text-emerald-700' : 'text-red-700'}`}>{vr.message}</p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[['Total', vr.totalRows ?? 0, 'slate'], ['Valid', vr.validRows ?? 0, 'emerald'], ['Errors', vr.errorRows ?? 0, 'red']].map(([l,v,c]) => (
                  <div key={l} className="bg-white rounded-lg py-2 border">
                    <div className={`text-xl font-black text-${c}-600`}>{v}</div>
                    <div className="text-xs text-slate-500">{l}</div>
                  </div>
                ))}
              </div>
            </div>
            {vr.validationErrors?.length > 0 && (
              <div className="space-y-1 max-h-36 overflow-y-auto">
                <p className="text-xs font-bold text-red-500 uppercase tracking-wide">Errors to fix:</p>
                {vr.validationErrors.map((e, i) => (
                  <div key={i} className="flex gap-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-1.5 border border-red-100">
                    <X size={10} className="flex-shrink-0 mt-0.5"/>{e}
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between pt-2">
              <button onClick={() => setStep('preview')} className="text-sm text-slate-400 hover:text-slate-600 underline underline-offset-2">← Back to preview</button>
              <button onClick={doUpload} disabled={!vr.canProceed}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 text-white text-sm font-bold rounded-xl disabled:opacity-40 transition-opacity">
                <Upload size={14}/> Upload {vr.validRows} Students
              </button>
            </div>
          </div>
        </div>
      </Modal>
    );
  }

  /* ── Drop zone ── */
  return (
    <Modal onClose={onClose} size="lg">
      <div className="bg-white rounded-2xl overflow-hidden flex flex-col max-h-[92vh] shadow-2xl">
        <MHead icon={CloudUpload} title="Bulk Excel Upload" sub="Client-side preview + validation before saving" onClose={onClose}/>
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center gap-4 cursor-pointer transition-all ${dragOver ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'}`}
          >
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center">
              {parseLoading ? <Spin size="lg" color="blue"/> : <Upload size={28} className="text-blue-600"/>}
            </div>
            <div className="text-center">
              <p className="font-bold text-slate-700">
                {parseLoading ? 'Reading file…' : <>Drop your Excel file here, or <span className="text-blue-600">click to browse</span></>}
              </p>
              <p className="text-xs text-slate-400 mt-1.5">Supports .xlsx, .xls, .csv · Up to 5,000 students</p>
            </div>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) accept(f); e.target.value = ''; }}/>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <p className="text-sm font-bold text-slate-700">Download Template</p>
              <p className="text-xs text-slate-400 mt-0.5">Excel with correct columns and sample rows</p>
            </div>
            <button onClick={getTemplate} disabled={tmpl}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50">
              {tmpl ? <Spin size="sm" color="white"/> : <Download size={13}/>} Template
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 p-4 bg-white border border-slate-100 rounded-xl text-xs">
            <div>
              <p className="text-[10px] font-black text-red-500 uppercase tracking-wider mb-2">Required Columns</p>
              {[['name','Full student name'],['email','Unique — existing emails blocked'],['roll_number','Unique per college']].map(([c,d]) => (
                <div key={c} className="flex items-start gap-2 mb-1.5">
                  <code className="px-1.5 py-0.5 bg-red-50 text-red-700 rounded text-[10px] font-mono border border-red-100 whitespace-nowrap mt-0.5">{c}</code>
                  <span className="text-slate-400">{d}</span>
                </div>
              ))}
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Optional Columns</p>
              {[['phone','10-digit'],['branch','CSE/ECE/…'],['batch','e.g. 2026'],['semester','1–8'],['cgpa','0.0–10.0']].map(([c,d]) => (
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
function ExportModal({ onClose }) {
  const toast = useToast();
  const [f, setF_]       = useState({ branch:'', batch:'', isPlaced:'', format:'xlsx' });
  const setF = (k,v)     => setF_(p => ({...p, [k]: v}));
  const [preview, setPrev] = useState(null);
  const [prevLoad, setPL]  = useState(false);
  const [exporting, setEx] = useState(false);

  const fetchPreview = useCallback(async () => {
    setPL(true);
    try {
      const p = Object.fromEntries(Object.entries(f).filter(([k,v]) => v && k !== 'format'));
      const r = await collegeAdminStudentAPI.getExportPreview(p);
      setPrev(r.data || r);
    } catch(e) { toast.error('Preview failed', e.message); }
    finally { setPL(false); }
  }, [f]);

  const doExport = async () => {
    setEx(true);
    try {
      await collegeAdminStudentAPI.exportStudents(Object.fromEntries(Object.entries(f).filter(([,v]) => v)));
      toast.success('Exported', 'File downloaded!');
      onClose();
    } catch(e) { toast.error('Export failed', e.message); }
    finally { setEx(false); }
  };

  return (
    <Modal onClose={onClose} size="md">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
        <MHead icon={FileDown} title="Export Students" sub="Filter and download as Excel or CSV" gradient="from-emerald-600 to-teal-500" onClose={onClose}/>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Branch</label>
              <select className={`${I_PLAIN} ${OK_CLS}`} value={f.branch} onChange={e => setF('branch', e.target.value)}>
                <option value="">All Branches</option>{BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Placement</label>
              <select className={`${I_PLAIN} ${OK_CLS}`} value={f.isPlaced} onChange={e => setF('isPlaced', e.target.value)}>
                <option value="">All</option><option value="true">Placed</option><option value="false">Unplaced</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Batch Year</label>
              <input type="text" className={`${I_PLAIN} ${OK_CLS}`} placeholder="e.g. 2024" value={f.batch} onChange={e => setF('batch', e.target.value)}/>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Format</label>
              <select className={`${I_PLAIN} ${OK_CLS}`} value={f.format} onChange={e => setF('format', e.target.value)}>
                <option value="xlsx">Excel (.xlsx)</option><option value="csv">CSV (.csv)</option>
              </select>
            </div>
          </div>
          <button onClick={fetchPreview} disabled={prevLoad}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl disabled:opacity-60 transition-colors">
            {prevLoad ? <Spin size="sm" color="slate"/> : <RefreshCw size={13}/>} Preview Count
          </button>
          {preview ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <p className="text-sm font-black text-emerald-700">{(preview.totalRecords || 0).toLocaleString()} records match</p>
              <p className="text-xs text-emerald-500 mt-0.5">Will download as {f.format.toUpperCase()}</p>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center text-xs text-slate-400">
              Click "Preview Count" to see how many records match your filters
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={onClose} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl">Cancel</button>
            <button onClick={doExport} disabled={exporting || prevLoad}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:opacity-90 text-white text-sm font-bold rounded-xl disabled:opacity-50">
              {exporting ? <><Spin size="sm"/>Downloading…</> : <><FileDown size={14}/>Export{preview?.totalRecords ? ` (${preview.totalRecords})` : ''}</>}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════════════
   STUDENT TABLE ROW
══════════════════════════════════════════════════════════ */
function StudentRow({ s, n }) {
  const si = s.studentInfo || {};
  const initial = (s.fullName || '?').charAt(0).toUpperCase();
  return (
    <tr className="border-b border-slate-50 hover:bg-blue-50/30 transition-colors">
      <td className="pl-4 pr-3 py-3 text-xs text-slate-300 font-mono w-10">{n}</td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center text-white text-xs font-black flex-shrink-0">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate leading-tight">{s.fullName || '—'}</p>
            <p className="text-xs text-slate-400 truncate">{s.email}</p>
          </div>
        </div>
      </td>
      <td className="px-3 py-3 font-mono text-xs text-blue-600 whitespace-nowrap">{si.rollNumber || '—'}</td>
      <td className="px-3 py-3">{si.branch ? <Tag variant="blue">{si.branch}</Tag> : <span className="text-slate-300 text-xs">—</span>}</td>
      <td className="px-3 py-3 text-xs text-slate-600 whitespace-nowrap">{si.batch || '—'}</td>
      <td className="px-3 py-3 text-xs text-slate-600">{si.semester ? `Sem ${si.semester}` : '—'}</td>
      <td className="px-3 py-3 text-xs font-bold text-slate-700">{si.cgpa != null ? si.cgpa : '—'}</td>
      <td className="px-3 py-3">
        {si.isPlaced
          ? <Tag variant="green"><UserCheck size={9}/>Placed</Tag>
          : <Tag variant="slate"><UserX size={9}/>Unplaced</Tag>}
      </td>
    </tr>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════ */
export default function StudentManagement() {
  const toast = useToast();
  const [students,   setStudents]   = useState([]);
  const [pagination, setPagination] = useState({ total:0, page:1, pages:1 });
  const [loading,    setLoading]    = useState(false);
  const [modal,      setModal]      = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [page,       setPage]       = useState(1);
  const [filters,    setFilters]    = useState({ search:'', branch:'', batch:'', isPlaced:'' });

  const setF = (k, v) => { setFilters(p => ({...p, [k]:v})); setPage(1); };
  const clearAll = () => { setFilters({ search:'', branch:'', batch:'', isPlaced:'' }); setPage(1); };
  const filterCount = Object.entries(filters).filter(([k,v]) => v && k !== 'search').length;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: PER_PAGE, sort: '-createdAt',
        ...Object.fromEntries(Object.entries(filters).filter(([,v]) => v)) };
      const r = await collegeAdminStudentAPI.getStudents(params);
      const active = (r.students || []).filter(s => !s.isDeleted);
      setStudents(active);
      setPagination(r.pagination || { total:0, page:1, pages:1 });
    } catch(e) {
      toast.error('Load error', e.message);
      setStudents([]);
    } finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { load(); }, [load]);

  const placed = students.filter(s => s.studentInfo?.isPlaced).length;

  const CARDS = [
    {
      icon: UserPlus, gradient: 'from-blue-600 to-cyan-500', border: 'border-blue-100',
      light: 'from-blue-50 to-cyan-50/50',
      title: 'Add Single Student',
      desc: 'Add one student with a form. Preview all details before saving to database.',
      tips: ['Full data preview before insert', 'Auto-generated temporary password', 'Welcome email sent instantly'],
      action: () => setModal('single'), btnLabel: 'Add Single Student',
    },
    {
      icon: UsersRound, gradient: 'from-violet-600 to-purple-500', border: 'border-violet-100',
      light: 'from-violet-50 to-purple-50/50',
      title: 'Add Multiple Students',
      desc: 'Fill a spreadsheet-like table in the browser. Preview all rows before saving.',
      tips: ['Inline table — no file needed', 'Preview all rows before confirm', 'All students emailed passwords'],
      action: () => setModal('multiple'), btnLabel: 'Add Multiple Students',
    },
    {
      icon: CloudUpload, gradient: 'from-indigo-600 to-blue-500', border: 'border-indigo-100',
      light: 'from-indigo-50 to-blue-50/50',
      title: 'Bulk Excel Upload',
      desc: 'Upload .xlsx or .csv. Full preview with error highlighting before saving.',
      tips: ['Instant client-side Excel parsing', 'Client-side error detection', 'Confirm only when all rows valid'],
      action: () => setModal('upload'), btnLabel: 'Bulk Upload',
    },
  ];

  return (
    <CollegeAdminLayout>
      <div className="w-full space-y-4">

        {/* ══ HERO BANNER ══ */}
        <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 rounded-2xl px-5 py-4 shadow-xl shadow-blue-500/20 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-10 -right-10 w-44 h-44 bg-white/10 rounded-full"/>
            <div className="absolute -bottom-8 left-1/3 w-28 h-28 bg-white/10 rounded-full"/>
            <div className="absolute inset-0 opacity-[0.04]"
              style={{ backgroundImage:'radial-gradient(circle,white 1px,transparent 1px)', backgroundSize:'18px 18px'}}/>
          </div>
          <div className="relative flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center border border-white/20 flex-shrink-0">
                <GraduationCap className="w-6 h-6 text-white"/>
              </div>
              <div>
                <h1 className="text-white font-black text-xl">Student Management</h1>
                <p className="text-blue-200 text-[11px] mt-0.5">
                  {pagination.total > 0 ? `${pagination.total} students enrolled` : 'Manage, add, and upload student records'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
              <button onClick={load} disabled={loading}
                className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-2 rounded-xl border border-white/20 transition-all disabled:opacity-50">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}/> Refresh
              </button>
              <button onClick={() => setModal('export')}
                className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-2 rounded-xl border border-white/20 transition-all">
                <FileDown className="w-3.5 h-3.5"/> Export
              </button>
              <button onClick={() => setModal('single')}
                className="inline-flex items-center gap-1.5 bg-white text-blue-600 text-xs font-bold px-3 py-2 rounded-xl shadow-md hover:bg-blue-50 transition-all">
                <UserPlus className="w-3.5 h-3.5"/> Add Student
              </button>
              <button onClick={() => setModal('multiple')}
                className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-2 rounded-xl border border-white/20 transition-all">
                <UsersRound className="w-3.5 h-3.5"/> Add Multiple
              </button>
              <button onClick={() => setModal('upload')}
                className="inline-flex items-center gap-1.5 bg-white text-blue-600 text-xs font-bold px-3 py-2 rounded-xl shadow-md hover:bg-blue-50 transition-all">
                <CloudUpload className="w-3.5 h-3.5"/> Bulk Upload
              </button>
            </div>
          </div>
        </div>

        {/* ══ STAT PILLS ══ */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { icon:Users,      label:'Total Students', value:pagination.total,  color:'bg-blue-50 border-blue-100 text-blue-600'      },
              { icon:UserCheck,  label:'Placed',         value:placed,            color:'bg-emerald-50 border-emerald-100 text-emerald-600' },
              { icon:Layers,     label:'This Page',      value:students.length,   color:'bg-cyan-50 border-cyan-100 text-cyan-600'       },
              { icon:TrendingUp, label:'Total Pages',    value:pagination.pages,  color:'bg-indigo-50 border-indigo-100 text-indigo-600' },
            ].map(({ icon:Icon, label, value, color }) => (
              <div key={label} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${color}`}>
                <Icon className="w-4 h-4 flex-shrink-0 opacity-70"/>
                <div>
                  <p className="text-xl font-black leading-none">{value ?? '—'}</p>
                  <p className="text-[10px] font-semibold opacity-60 mt-0.5">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ══ ACTION CARDS ══ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {CARDS.map(card => (
            <div key={card.title} className={`bg-white rounded-2xl border ${card.border} shadow-sm overflow-hidden hover:shadow-md transition-shadow`}>
              <div className={`bg-gradient-to-r ${card.gradient} px-5 py-4 flex items-center gap-3`}>
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center"><card.icon size={18} className="text-white"/></div>
                <h3 className="text-sm font-black text-white">{card.title}</h3>
              </div>
              <div className={`bg-gradient-to-b ${card.light} p-5 space-y-4`}>
                <p className="text-sm text-slate-600 leading-relaxed">{card.desc}</p>
                <ul className="space-y-2">
                  {card.tips.map((t, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-slate-600">
                      <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center text-[9px] font-black text-slate-500 flex-shrink-0 mt-0.5 shadow-sm border border-slate-100">{i+1}</div>
                      {t}
                    </li>
                  ))}
                </ul>
                <button onClick={card.action}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-white bg-gradient-to-r ${card.gradient} hover:opacity-90 rounded-xl transition-opacity shadow-md`}>
                  <card.icon size={13}/> {card.btnLabel}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ══ EXPORT CARD ══ */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-500 px-5 py-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center"><FileDown size={18} className="text-white"/></div>
            <div>
              <h3 className="text-sm font-black text-white">Export Students</h3>
              <p className="text-emerald-200 text-[11px] mt-0.5">Download filtered records as Excel or CSV</p>
            </div>
          </div>
          <div className="p-5 flex items-center gap-5 flex-wrap">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-600">Export your college's students filtered by branch, batch, or placement status.</p>
              <div className="flex items-center gap-4 mt-3 flex-wrap">
                {['Filter by branch / batch', 'Preview count before download', 'Excel or CSV format'].map((t, i) => (
                  <span key={i} className="flex items-center gap-1.5 text-xs text-slate-400"><ChevronRight size={11} className="text-slate-300 flex-shrink-0"/>{t}</span>
                ))}
              </div>
            </div>
            <button onClick={() => setModal('export')}
              className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:opacity-90 text-white text-sm font-bold rounded-xl shadow-md shadow-emerald-500/20">
              <FileDown size={14}/> Open Export
            </button>
          </div>
        </div>

        {/* ══ SEARCH & FILTER BAR ══ */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"/>
              <input type="text" placeholder="Search name, email or roll number…"
                value={filters.search} onChange={e => setF('search', e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white transition"/>
              {filters.search && (
                <button onClick={() => setF('search', '')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-3.5 h-3.5"/>
                </button>
              )}
            </div>
            <button onClick={() => setShowFilter(p => !p)}
              className={`inline-flex items-center gap-1.5 px-3 py-2.5 text-sm border rounded-xl transition-colors ${
                showFilter || filterCount > 0 ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              <SlidersHorizontal className="w-3.5 h-3.5"/>
              Filters
              {filterCount > 0 && <span className="w-4 h-4 bg-blue-600 text-white text-[9px] rounded-full flex items-center justify-center font-black">{filterCount}</span>}
            </button>
            {filterCount > 0 && (
              <button onClick={clearAll} className="inline-flex items-center gap-1 px-3 py-2.5 text-xs font-semibold text-red-500 hover:text-red-700 transition-colors">
                <X className="w-3 h-3"/> Clear
              </button>
            )}
          </div>
          {showFilter && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-end gap-3">
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1.5">Branch</label>
                <select value={filters.branch} onChange={e => setF('branch', e.target.value)}
                  className="text-sm border border-gray-200 bg-white rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 appearance-none">
                  <option value="">All Branches</option>
                  {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1.5">Batch Year</label>
                <input type="text" placeholder="e.g. 2024" value={filters.batch} onChange={e => setF('batch', e.target.value)}
                  className="text-sm border border-gray-200 bg-white rounded-xl px-3 py-2 w-28 focus:outline-none focus:ring-2 focus:ring-blue-400"/>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1.5">Placement</label>
                <select value={filters.isPlaced} onChange={e => setF('isPlaced', e.target.value)}
                  className="text-sm border border-gray-200 bg-white rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 appearance-none">
                  <option value="">All</option>
                  <option value="true">Placed</option>
                  <option value="false">Not Placed</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* ══ STUDENT TABLE ══ */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/>
              <p className="text-sm text-gray-400">Loading students…</p>
            </div>
          ) : students.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 py-16">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center">
                <GraduationCap className="w-7 h-7 text-blue-200"/>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-600">No students found</p>
                <p className="text-xs text-gray-400 mt-1">
                  {Object.values(filters).some(Boolean) ? 'Try clearing your search or filters' : 'Add students using the buttons above'}
                </p>
              </div>
              {!Object.values(filters).some(Boolean) && (
                <div className="flex items-center gap-2 flex-wrap justify-center">
                  <button onClick={() => setModal('single')}
                    className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition-colors">
                    <UserPlus className="w-3.5 h-3.5"/> Add Single Student
                  </button>
                  <button onClick={() => setModal('upload')}
                    className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl shadow-sm hover:scale-105 transition-all">
                    <CloudUpload className="w-3.5 h-3.5"/> Bulk Upload
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-auto flex-1">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-100">
                      {['#','Student','Roll No','Branch','Batch','Sem','CGPA','Placement'].map(h => (
                        <th key={h} className={`py-2.5 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider whitespace-nowrap ${h==='#' ? 'pl-4 pr-3 w-10' : 'px-3'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s, i) => (
                      <StudentRow key={s._id} s={s} n={(page-1)*PER_PAGE + i + 1}/>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-4 py-3 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between flex-shrink-0">
                <span className="text-[11px] text-gray-500">
                  Showing <b className="text-gray-700">{(page-1)*PER_PAGE+1}–{Math.min(page*PER_PAGE, pagination.total)}</b> of <b className="text-gray-700">{pagination.total}</b>
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 disabled:opacity-40 transition-colors">
                    <ChevronLeft className="w-3.5 h-3.5"/>
                  </button>
                  <span className="text-xs font-semibold text-gray-600 px-2">{page} / {pagination.pages}</span>
                  <button onClick={() => setPage(p => Math.min(pagination.pages, p+1))} disabled={page===pagination.pages}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 disabled:opacity-40 transition-colors">
                    <ChevronRight className="w-3.5 h-3.5"/>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ══ COLUMN REFERENCE ══ */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="mb-4">
            <SHead icon={Info} title="Excel Upload — Column Reference" sub="Use exact header names in your spreadsheet"/>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-[10px] font-black text-red-500 uppercase tracking-wider mb-3">Required Columns</p>
              <div className="space-y-2">
                {[['name','Full student name (min 2 chars)'],['email','Unique — existing emails will be BLOCKED'],['roll_number','Unique per college — duplicates blocked']].map(([c,d]) => (
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
                {[['phone','10-digit mobile number'],['branch','CSE/ECE/EEE/MECH/CIVIL/IT/AI/ML/DS/Other'],['batch','Graduation year e.g. 2026'],['semester','Integer 1–8'],['cgpa','Decimal 0.0–10.0']].map(([c,d]) => (
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
              <strong>No password column needed</strong> — passwords are auto-generated.
              Existing emails and roll numbers are <strong>detected and blocked</strong> before upload is confirmed.
            </span>
          </div>
        </div>

      </div>

      {/* ── Modals render via portal above sidebar ── */}
      {modal==='single'   && <AddSingleModal   onClose={() => setModal(null)} onDone={() => { setPage(1); load(); }}/>}
      {modal==='multiple' && <AddMultipleModal onClose={() => setModal(null)} onDone={() => { setPage(1); load(); }}/>}
      {modal==='upload'   && <BulkUploadModal  onClose={() => setModal(null)} onDone={() => { setPage(1); load(); }}/>}
      {modal==='export'   && <ExportModal      onClose={() => setModal(null)}/>}
    </CollegeAdminLayout>
  );
}