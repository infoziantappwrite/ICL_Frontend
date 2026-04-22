// src/pages/SuperAdmin/StudentManagement.jsx
// FIXED: MHead onClose props, live student list, export preview, response normalization
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import SuperAdminDashboardLayout from '../../components/layout/SuperAdminDashboardLayout';
import { useToast } from '../../context/ToastContext';
import { superAdminStudentAPI } from '../../api/studentAPI';
import {
  GraduationCap, CloudUpload, FileDown, Download, X,
  CheckCircle, AlertTriangle, AlertCircle, FileText, Info,
  Upload, Building2, ChevronRight, UserPlus, UsersRound,
  Plus, Mail, Hash, BookOpen, Star, Calendar, Phone, Eye,
  Trash2, ArrowLeft, Check, UploadCloud, Loader2, Search,
  ChevronLeft, ChevronDown, Users, Filter, SortAsc, SortDesc, TrendingUp, KeyRound, RefreshCw,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════════ */
const BRANCHES = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AI/ML', 'DS', 'Other'];
const SEMESTERS = ['1', '2', '3', '4', '5', '6', '7', '8'];
const REQUIRED_COLS = ['name', 'email', 'roll_number'];

/* ══════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════ */
const Spin = ({ size = 'md', color = 'white' }) => {
  const sz = { sm: 'w-3.5 h-3.5', md: 'w-5 h-5', lg: 'w-8 h-8' }[size];
  const cl = { white: 'border-white', blue: 'border-blue-500', slate: 'border-slate-400', indigo: 'border-indigo-500' }[color];
  return <div className={`${sz} ${cl} border-2 border-t-transparent rounded-full animate-spin flex-shrink-0`} />;
};

const BASE_INPUT = 'w-full text-sm border-0 rounded-xl py-2.5 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white border border-slate-200/50 focus:border-blue-400 transition-all placeholder:text-slate-300';
const I_ICON = `${BASE_INPUT} pl-9 pr-3`;
const I_PLAIN = `${BASE_INPUT} px-3`;
const OK_CLS = 'border-slate-200/50';
const ERR_CLS = 'border-red-200 bg-red-50/30';
const BTN_PRI = 'bg-[#003399] text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-2.5 rounded-xl hover:bg-[#002d8b] transition-all shadow-lg shadow-blue-500/10 active:scale-95 inline-flex items-center gap-2 whitespace-nowrap';
const BTN_SEC = 'bg-white text-slate-500 text-[10px] font-black uppercase tracking-wider px-3.5 py-2.5 rounded-xl border border-slate-100 hover:border-[#003399]/30 hover:text-[#003399] transition-all inline-flex items-center gap-2 whitespace-nowrap';

const Field = ({ label, required, icon: Icon, error, hint, children }) => (
  <div>
    <label className="text-xs font-bold text-slate-700 block mb-1.5">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    <div className="relative">
      {Icon && <Icon size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />}
      {children}
    </div>
    {error && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{error}</p>}
    {!error && hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
  </div>
);

/* ── Portal Modal (renders to document.body → above sidebar z-50) ── */
const Modal = ({ children, onClose, size = 'lg' }) => {
  const w = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-2xl', xl: 'max-w-4xl', full: 'max-w-6xl' }[size];

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-[9999]"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-all animate-in fade-in" />
      <div
        className={`relative w-full ${w} max-h-[92vh] flex flex-col bg-white rounded-[32px] shadow-2xl border border-white/20 animate-in zoom-in-95 duration-200`}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};

/* ── Gradient modal header ── */
const MHead = ({ icon: Icon, title, sub, onClose, color = '#003399' }) => (
  <div className="px-6 py-6 border-b border-slate-50 flex-shrink-0 bg-white/50 backdrop-blur-sm rounded-t-[32px]">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center border flex-shrink-0 shadow-sm"
          style={{ backgroundColor: `${color}15`, borderColor: `${color}30` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div>
          <h2 className="text-slate-900 font-black text-lg tracking-tight leading-tight">{title}</h2>
          {sub && <p className="text-slate-400 text-xs font-medium mt-0.5">{sub}</p>}
        </div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="w-9 h-9 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all border border-slate-200/50"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  </div>
);

/* ── Preview field ── */
const PField = ({ label, value, full, icon: Icon }) => (
  <div className={`p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-start gap-3 ${full ? 'col-span-2' : ''}`}>
    {Icon && (
      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0 border border-slate-100">
        <Icon className="w-4 h-4 text-slate-400" />
      </div>
    )}
    <div className="min-w-0 flex-1">
      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1 leading-none">{label}</p>
      <p className="text-sm font-black text-slate-800 break-all leading-tight">
        {value != null && value !== '' ? value : <span className="text-slate-300 italic font-medium text-xs">—</span>}
      </p>
    </div>
  </div>
);

/* ── Section heading ── */
const SHead = ({ icon: Icon, title, sub, color = '#003399' }) => (
  <div className="flex items-center gap-3">
    <div
      className="w-8 h-8 rounded-xl flex items-center justify-center border flex-shrink-0 shadow-sm transition-all"
      style={{ backgroundColor: `${color}15`, borderColor: `${color}30` }}
    >
      <Icon className="w-4 h-4" style={{ color }} />
    </div>
    <div className="min-w-0">
      <h3 className="text-sm font-black text-slate-800 leading-none tracking-tight">{title}</h3>
      {sub && <p className="text-[10px] text-slate-400 font-medium mt-1 leading-none">{sub}</p>}
    </div>
  </div>
);

const Section = ({ icon, title, sub, color, children, className = "" }) => (
  <div className={`space-y-4 ${className}`}>
    <SHead icon={icon} title={title} sub={sub} color={color} />
    <div className="pl-0 sm:pl-11">
      {children}
    </div>
  </div>
);

/* ── Client-side row validator (mirrors backend) ── */
const validateRow = (row) => {
  const e = {};
  const name = (row['name'] || row['full_name'] || '').trim();
  const email = (row['email'] || '').trim().toLowerCase();
  const roll = (row['roll_number'] || row['rollnumber'] || row['roll_no'] || '').trim();
  if (!name) e['name'] = 'Name is required';
  if (!email) e['email'] = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e['email'] = 'Invalid email format';
  if (!roll) e['roll_number'] = 'Roll number is required';
  const phone = (row['phone'] || '').trim();
  if (phone && !/^[0-9]{10}$/.test(phone)) e['phone'] = 'Must be 10 digits';
  const branch = (row['branch'] || '').trim().toUpperCase();
  if (branch && !BRANCHES.map(b => b.toUpperCase()).includes(branch)) e['branch'] = `Must be: ${BRANCHES.join(', ')}`;
  const sem = row['semester'];
  if (sem && sem !== '' && (isNaN(sem) || +sem < 1 || +sem > 10)) e['semester'] = 'Must be 1–10';
  const cgpa = row['cgpa'];
  if (cgpa && cgpa !== '' && (isNaN(cgpa) || +cgpa < 0 || +cgpa > 10)) e['cgpa'] = 'Must be 0.0–10.0';
  return e;
};

/* ── Download helper: generate Excel from result data ── */
const downloadResultsAsExcel = (students, filename = 'students_created.xlsx') => {
  const rows = students.map((s, i) => ({
    '#': i + 1,
    'Full Name': s.fullName || '',
    'Email': s.email || '',
    'Roll Number': s.rollNumber || '',
    'Branch': s.branch || '',
    'Batch': s.batch || '',
    'Phone': s.phone || '',
    'Temporary Password': s.temporaryPassword || '',
    'Email Sent': s.emailSent ? 'Yes' : 'No',
    'First Login': 'Required',
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 4 }, { wch: 22 }, { wch: 30 }, { wch: 16 }, { wch: 10 }, { wch: 8 }, { wch: 14 }, { wch: 18 }, { wch: 12 }, { wch: 14 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Created Students');
  XLSX.writeFile(wb, filename);
};

/* ══════════════════════════════════════════════════════════
   MODAL 1 — ADD SINGLE STUDENT
══════════════════════════════════════════════════════════ */
const EMPTY_FORM = {
  fullName: '', email: '', rollNumber: '', collegeId: '',
  branch: '', semester: '', cgpa: '', batch: '', phone: '',
};

function AddSingleModal({ colleges, onClose, onDone }) {
  const toast = useToast();
  const [step, setStep] = useState('form');
  const [form, setForm] = useState(EMPTY_FORM);
  const [errs, setErrs] = useState({});
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); if (errs[k]) setErrs(p => ({ ...p, [k]: '' })); };

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Required';
    if (!form.email.trim()) e.email = 'Required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
    if (!form.rollNumber.trim()) e.rollNumber = 'Required';
    if (!form.collegeId) e.collegeId = 'Please select a college';
    if (form.phone && !/^[0-9]{10}$/.test(form.phone)) e.phone = 'Must be 10 digits';
    if (form.cgpa && (isNaN(form.cgpa) || +form.cgpa < 0 || +form.cgpa > 10)) e.cgpa = '0.0–10.0';
    if (form.semester && (isNaN(form.semester) || +form.semester < 1 || +form.semester > 10)) e.semester = '1–10';
    return e;
  };

  const goPreview = () => { const e = validate(); if (Object.keys(e).length) { setErrs(e); return; } setStep('preview'); };

  const confirm = async () => {
    setSaving(true);
    try {
      const payload = {
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        rollNumber: form.rollNumber.trim(),
        collegeId: form.collegeId,
        ...(form.branch && { branch: form.branch }),
        ...(form.batch && { batch: form.batch.trim() }),
        ...(form.phone && { phone: form.phone.trim() }),
        ...(form.semester && { semester: parseInt(form.semester) }),
        ...(form.cgpa && { cgpa: parseFloat(form.cgpa) }),
      };
      const r = await superAdminStudentAPI.addStudent(payload);
      setResult(r.data); setStep('done');
      toast.success('Student Added', r.message);
      onDone?.();
    } catch (e) { toast.error('Failed', e.message); }
    finally { setSaving(false); }
  };

  const college = colleges.find(c => c._id === form.collegeId);

  /* DONE */
  if (step === 'done') return (
    <Modal onClose={onClose} size="md">
      <MHead icon={CheckCircle} title="Student Created!" sub="A welcome email has been sent" onClose={onClose} color="#10b981" />
      <div className="p-8 space-y-6 overflow-y-auto">
        <div className="flex items-center gap-5 p-6 bg-slate-50 border border-slate-100 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-8 -mt-8 transition-all group-hover:scale-110" />
          <div className="w-16 h-16 bg-gradient-to-br from-[#003399] to-[#00A9CE] rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg flex-shrink-0">
            {result?.fullName?.charAt(0)?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <h4 className="text-xl font-black text-slate-800 leading-tight">{result?.fullName}</h4>
            <p className="text-sm text-slate-500 mt-1 truncate font-medium">{result?.email}</p>
            {result?.rollNumber && <p className="text-xs text-blue-600 font-black mt-2 tracking-widest uppercase">{result?.rollNumber}</p>}
          </div>
        </div>

        {result?.temporaryPassword && (
          <div className="bg-amber-50/50 border border-amber-100 rounded-3xl p-6 relative">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
                <KeyRound size={12} /> Temporary Password
              </p>
              <button
                onClick={() => { navigator.clipboard.writeText(result.temporaryPassword); toast.success('Copied!'); }}
                className="text-[10px] font-black px-3 py-1 bg-white border border-amber-200 text-amber-700 rounded-lg hover:bg-amber-100 transition-all shadow-sm">
                COPY PASSWORD
              </button>
            </div>
            <code className="text-2xl font-mono font-black text-amber-900 tracking-[0.2em] block text-center py-2">
              {result.temporaryPassword}
            </code>
            <div className="mt-4 flex items-center gap-2 text-[10px] text-amber-600 font-medium">
              <Info size={12} />
              Share this password with the student manually if needed.
            </div>
          </div>
        )}

        <div className={`flex items-start gap-3 p-4 rounded-2xl border ${result?.emailSent ? 'bg-emerald-50/50 border-emerald-100 text-emerald-700' : 'bg-amber-50/50 border-amber-100 text-amber-700'}`}>
          {result?.emailSent ? <CheckCircle size={16} className="mt-0.5" /> : <AlertTriangle size={16} className="mt-0.5" />}
          <p className="text-xs font-semibold leading-relaxed">
            {result?.emailSent
              ? 'Credentials and login instructions have been successfully sent to the student.'
              : 'Email delivery failed. Please provide the temporary password to the student manually.'}
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <button
            onClick={() => downloadResultsAsExcel([result], `student_${result?.rollNumber || Date.now()}.xlsx`)}
            className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-black rounded-2xl transition-all shadow-sm group">
            <Download size={16} className="text-slate-400 group-hover:text-[#003399]" />
            Download Student Record (Excel)
          </button>
          <div className="flex gap-3 mt-2">
            <button
              onClick={() => { setForm(EMPTY_FORM); setResult(null); setStep('form'); }}
              className="flex-1 py-3.5 bg-slate-100/50 hover:bg-slate-100 text-slate-600 text-sm font-black rounded-2xl transition-all"
            >
              Add Another
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3.5 bg-[#003399] text-white text-sm font-black rounded-2xl shadow-lg shadow-blue-200 hover:bg-[#002d8b] transition-all uppercase tracking-widest"
            >
              Finish
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );

  /* PREVIEW */
  if (step === 'preview') return (
    <Modal onClose={onClose} size="lg">
      <MHead icon={Eye} title="Preview Details" sub="Double check student information" onClose={onClose} />
      <div className="p-8 space-y-6 overflow-y-auto">
        <div className="flex items-center gap-5 p-6 bg-slate-50 border border-slate-100 rounded-3xl">
          <div className="w-16 h-16 bg-gradient-to-br from-[#003399] to-[#00A9CE] rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg flex-shrink-0">
            {form.fullName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xl font-black text-slate-800 leading-tight">{form.fullName}</h4>
            <p className="text-sm text-slate-400 mt-1 truncate font-medium">{form.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <PField label="Registration Details" value={form.rollNumber} icon={Hash} />
          <PField label="Assigned Institution" value={college?.name} icon={Building2} />
          <PField label="Academic Branch" value={form.branch} icon={BookOpen} />
          <PField label="Target Batch" value={form.batch} icon={Calendar} />
          <PField label="Current Semester" value={form.semester} icon={TrendingUp} />
          <PField label="Academic CGPA" value={form.cgpa} icon={Star} />
          <PField label="Contact Info" value={form.phone} icon={Phone} full />
        </div>

        <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-2xl flex items-start gap-3">
          <Mail size={16} className="text-amber-600 mt-0.5" />
          <p className="text-xs text-amber-700 font-medium leading-relaxed">
            Upon confirmation, a <strong>temporary password</strong> will be auto-generated and emailed to the student immediately.
          </p>
        </div>
      </div>
      <div className="p-6 border-t border-slate-50 bg-slate-50/30 flex items-center gap-3">
        <button
          onClick={() => setStep('form')}
          className="flex items-center gap-2 px-6 py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-black rounded-2xl transition-all shadow-sm"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <button
          onClick={confirm}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-[#003399] text-white text-sm font-black rounded-2xl shadow-lg shadow-blue-200 hover:bg-[#002d8b] disabled:opacity-50 transition-all uppercase tracking-widest"
        >
          {saving ? <><Spin size="sm" />Saving Student...</> : <><Check size={16} />Confirm & Create Account</>}
        </button>
      </div>
    </Modal>
  );

  /* FORM */
  return (
    <Modal onClose={onClose} size="lg">
      <MHead icon={UserPlus} title="Add Single Student" sub="Complete the student profile" onClose={onClose} />
      <div className="p-8 space-y-8 overflow-y-auto">
        {/* Personal Details */}
        <Section icon={UserPlus} title="Personal Information" sub="Base student identification" color="#2563eb">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Field label="Full Name" required icon={GraduationCap} error={errs.fullName}>
                <input className={`${I_ICON} ${errs.fullName ? ERR_CLS : OK_CLS}`} placeholder="e.g. Rahul Sharma" value={form.fullName} onChange={e => set('fullName', e.target.value)} />
              </Field>
            </div>
            <Field label="Email Address" required icon={Mail} error={errs.email}>
              <input type="email" className={`${I_ICON} ${errs.email ? ERR_CLS : OK_CLS}`} placeholder="student@email.com" value={form.email} onChange={e => set('email', e.target.value)} />
            </Field>
            <Field label="Roll Number" required icon={Hash} error={errs.rollNumber}>
              <input className={`${I_ICON} ${errs.rollNumber ? ERR_CLS : OK_CLS}`} placeholder="e.g. CS2024001" value={form.rollNumber} onChange={e => set('rollNumber', e.target.value)} />
            </Field>
          </div>
        </Section>

        {/* Academic Details */}
        <Section icon={Building2} title="Academic Association" sub="College and course details" color="#003399">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Field label="Target College" required icon={Building2} error={errs.collegeId}>
                <select className={`${I_ICON} ${errs.collegeId ? ERR_CLS : OK_CLS} appearance-none`} value={form.collegeId} onChange={e => set('collegeId', e.target.value)}>
                  <option value="">Select college…</option>
                  {colleges.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Branch / Stream" icon={BookOpen}>
              <select className={`${I_ICON} ${OK_CLS} appearance-none`} value={form.branch} onChange={e => set('branch', e.target.value)}>
                <option value="">Select branch…</option>
                {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </Field>
            <Field label="Batch Year" icon={Calendar}>
              <select className={`${I_ICON} ${OK_CLS} appearance-none`} value={form.batch} onChange={e => set('batch', e.target.value)}>
                <option value="">Select batch...</option>
                {[2023, 2024, 2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </Field>
            <Field label="Current Semester" icon={TrendingUp} error={errs.semester}>
              <select className={`${I_ICON} ${errs.semester ? ERR_CLS : OK_CLS} appearance-none`} value={form.semester} onChange={e => set('semester', e.target.value)}>
                <option value="">Select semester…</option>
                {SEMESTERS.map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </Field>
            <Field label="Academic CGPA" icon={Star} error={errs.cgpa}>
              <input className={`${I_ICON} ${errs.cgpa ? ERR_CLS : OK_CLS}`} placeholder="e.g. 8.5" value={form.cgpa} onChange={e => set('cgpa', e.target.value)} />
            </Field>
          </div>
        </Section>

        {/* Other Info */}
        <Section icon={Phone} title="Additional Information" sub="Contact and other records" color="#7c3aed">
          <Field label="Contact Phone Number" icon={Phone} error={errs.phone}>
            <input className={`${I_ICON} ${errs.phone ? ERR_CLS : OK_CLS}`} placeholder="10-digit mobile number" value={form.phone} onChange={e => set('phone', e.target.value)} />
          </Field>
        </Section>

        <div className="bg-blue-50/50 p-4 rounded-2xl flex items-start gap-3 border border-blue-100/50">
          <Info size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-[11px] text-blue-600 font-medium leading-relaxed">
            The student's login password will be automatically generated and delivered to their email address upon confirmation.
          </p>
        </div>
      </div>
      <div className="p-6 border-t border-slate-50 bg-slate-50/30 flex items-center justify-end gap-3">
        <button
          onClick={onClose}
          className="px-8 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-black rounded-2xl transition-all shadow-sm"
        >
          Cancel
        </button>
        <button
          onClick={goPreview}
          className="px-10 py-3.5 bg-[#003399] hover:bg-[#002d8b] text-white text-sm font-black rounded-2xl shadow-lg shadow-blue-200 transition-all flex items-center gap-3 uppercase tracking-widest"
        >
          Preview Details <ChevronRight size={18} />
        </button>
      </div>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════════════
   TC — TABLE CELL (moved outside, memoized)
══════════════════════════════════════════════════════════ */
const TC = React.memo(function TC({ id, field, value, placeholder, options, error, setCell }) {
  return (
    <td className={`p-1.5 transition-colors ${error ? 'bg-red-50/50' : 'group-hover:bg-slate-50/50'}`}>
      <div className="relative group/input">
        {options ? (
          <select
            value={value || ""}
            onChange={e => setCell(id, field, e.target.value)}
            className={`w-full text-[11px] border rounded-xl px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${error ? 'border-red-300 ring-2 ring-red-500/10' : 'border-slate-200 focus:border-blue-400'
              }`}
          >
            <option value="">—</option>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : (
          <input
            value={value || ""}
            placeholder={placeholder}
            onChange={e => setCell(id, field, e.target.value)}
            className={`w-full text-[11px] border rounded-xl px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-300 ${error ? 'border-red-300 ring-2 ring-red-500/10' : 'border-slate-200 focus:border-blue-400'
              }`}
          />
        )}
        {error && (
          <div className="absolute bottom-full left-0 mb-2 z-30 bg-slate-900 text-white text-[9px] font-black px-2 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover/input:opacity-100 transition-opacity shadow-xl pointer-events-none border border-white/10 uppercase tracking-widest">
            {error}
          </div>
        )}
      </div>
    </td>
  );
});

/* ══════════════════════════════════════════════════════════
   MODAL 2 — ADD MULTIPLE STUDENTS
══════════════════════════════════════════════════════════ */
const newRow = () => ({
  id: Date.now() + Math.random(),
  fullName: '', email: '', rollNumber: '',
  branch: '', batch: '', phone: '', cgpa: '', semester: ''
});

function AddMultipleModal({ colleges, onClose, onDone }) {
  const toast = useToast();
  const [step, setStep] = useState('form');
  const [rows, setRows] = useState([newRow(), newRow(), newRow()]);
  const [collegeId, setCollegeId] = useState('');
  const [rowErrs, setRowErrs] = useState({});
  const [topErr, setTopErr] = useState('');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  const addRow = () => setRows(p => [...p, newRow()]);
  const delRow = (id) => setRows(p => p.filter(r => r.id !== id));

  const setCell = useCallback((id, k, v) => {
    setRows(p => p.map(r => r.id === id ? { ...r, [k]: v } : r));
    if (rowErrs[id]?.[k]) setRowErrs(p => ({ ...p, [id]: { ...p[id], [k]: undefined } }));
  }, [rowErrs]);

  const filledRows = rows.filter(r => r.fullName || r.email || r.rollNumber);

  const validateAll = () => {
    if (!collegeId) { setTopErr('Please select a college first.'); return false; }
    setTopErr('');
    if (!filledRows.length) { setTopErr('Add at least one student row.'); return false; }
    let ok = true;
    const errs = {};
    const emailsSeen = {}, rollsSeen = {};
    filledRows.forEach(r => {
      const e = {};
      if (!r.fullName.trim()) e.fullName = 'Required';
      if (!r.email.trim()) e.email = 'Required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email)) e.email = 'Invalid email';
      if (!r.rollNumber.trim()) e.rollNumber = 'Required';
      if (r.phone && !/^[0-9]{10}$/.test(r.phone.trim())) e.phone = '10 digits';
      if (r.cgpa && (isNaN(r.cgpa) || +r.cgpa < 0 || +r.cgpa > 10)) e.cgpa = '0–10';
      if (r.semester && (isNaN(r.semester) || +r.semester < 1 || +r.semester > 10)) e.semester = '1–10';
      const em = r.email.trim().toLowerCase();
      const roll = r.rollNumber.trim();
      if (em && emailsSeen[em] !== undefined) e.email = 'Duplicate email in list';
      else if (em) emailsSeen[em] = r.id;
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
      const payload = filledRows.map(r => ({
        fullName: r.fullName.trim(),
        email: r.email.trim().toLowerCase(),
        rollNumber: r.rollNumber.trim(),
        ...(r.branch && { branch: r.branch }),
        ...(r.batch && { batch: r.batch.trim() }),
        ...(r.phone && { phone: r.phone.trim() }),
        ...(r.semester && { semester: parseInt(r.semester) }),
        ...(r.cgpa && { cgpa: parseFloat(r.cgpa) }),
      }));
      const res = await superAdminStudentAPI.addStudents(payload, collegeId);
      setResult(res.data); setStep('done');
      toast.success('Students Added', res.message);
      onDone?.();
    } catch (e) { toast.error('Failed', e.message); }
    finally { setSaving(false); }
  };

  const college = colleges.find(c => c._id === collegeId);

  /* ── DONE ─────────────────────────────────────────────── */
  if (step === 'done') return (
    <Modal onClose={onClose} size="lg">
      <MHead icon={CheckCircle} title={`${result?.length ?? 0} Students Created!`} sub="Batch operation completed successfully" onClose={onClose} color="#10b981" />
      <div className="p-8 space-y-6 overflow-hidden flex flex-col max-h-[80vh]">
        <div className="overflow-y-auto flex-1 space-y-3 pr-2 custom-scrollbar">
          {result?.map((s, i) => (
            <div key={i} className="flex items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl group transition-all hover:bg-white hover:shadow-sm">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 bg-gradient-to-br from-[#003399] to-[#00A9CE] rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-sm leading-none">
                  {s.fullName?.charAt(0)?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black text-slate-800 truncate leading-tight">{s.fullName}</p>
                  <p className="text-[10px] text-slate-400 font-bold tracking-wider truncate mt-1 uppercase">
                    {s.rollNumber} • {s.email.split('@')[0]}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {s.temporaryPassword && (
                  <div className="group/pass relative">
                    <span className="text-[10px] font-mono font-black bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg border border-amber-100 cursor-help transition-all group-hover/pass:bg-amber-100">
                      {s.temporaryPassword}
                    </span>
                    <button
                      onClick={() => { navigator.clipboard.writeText(s.temporaryPassword); toast.success(`Copied for ${s.fullName}`); }}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-amber-200 text-amber-800 rounded-full flex items-center justify-center opacity-0 group-hover/pass:opacity-100 transition-all shadow-sm"
                    >
                      <Plus size={8} className="rotate-45" />
                    </button>
                  </div>
                )}
                {s.emailSent
                  ? <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-100"><CheckCircle size={14} className="text-emerald-500" /></div>
                  : <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center border border-amber-100"><AlertTriangle size={14} className="text-amber-500" /></div>}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-slate-50 space-y-3">
          <button
            onClick={() => downloadResultsAsExcel(result || [], `students_batch_${Date.now()}.xlsx`)}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-black rounded-2xl transition-all shadow-sm group">
            <Download size={18} className="text-slate-300 group-hover:text-[#003399] transition-colors" />
            Export Batch Result (Excel)
          </button>
          <button
            onClick={onClose}
            className="w-full py-4 bg-[#003399] text-white text-sm font-black rounded-2xl hover:bg-[#002d8b] shadow-lg shadow-blue-200 transition-all uppercase tracking-widest"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    </Modal>
  );

  /* ── PREVIEW ──────────────────────────────────────────── */
  if (step === 'preview') return (
    <Modal onClose={onClose} size="xl">
      <MHead icon={Eye} title={`Review Batch — ${filledRows.length} Students`} sub={`Assigned Institution: ${college?.name || '—'}`} onClose={onClose} />
      <div className="overflow-auto flex-1 custom-scrollbar">
        <table className="w-full text-[11px] border-collapse bg-white">
          <thead className="sticky top-0 z-20">
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="py-4 px-4 text-left font-black text-slate-400 uppercase tracking-widest w-12">#</th>
              {['Full Name', 'Email Address', 'Roll Number', 'Branch', 'Batch', 'Sem.', 'CGPA', 'Phone'].map(h => (
                <th key={h} className="text-left py-4 px-4 font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filledRows.map((r, i) => (
              <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3 px-4 text-slate-300 font-bold">{i + 1}</td>
                <td className="py-3 px-4 font-black text-slate-800">{r.fullName}</td>
                <td className="py-3 px-4 text-slate-500 font-medium">{r.email}</td>
                <td className="py-3 px-4 font-black text-blue-600 tracking-wider uppercase">{r.rollNumber}</td>
                {['branch', 'batch', 'semester', 'cgpa', 'phone'].map(f => (
                  <td key={f} className="py-3 px-4 text-slate-500 font-medium italic">{r[f] || '—'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-3 bg-amber-50/50 border-t border-amber-100 flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 animate-pulse">
          <Mail size={14} className="text-amber-600" />
        </div>
        <p className="text-[10px] text-amber-900 font-black tracking-wide uppercase leading-none">
          Automatic email delivery: <span className="font-normal normal-case text-amber-700 ml-1">Temporary passwords will be generated and dispatched instantly upon confirmation.</span>
        </p>
      </div>
      <div className="flex gap-4 p-6 border-t border-slate-50 flex-shrink-0 bg-white shadow-[0_-8px_30px_rgb(0,0,0,0.02)]">
        <button
          onClick={() => setStep('form')}
          className="flex items-center gap-2 px-8 py-3.5 bg-slate-100/80 hover:bg-slate-100 text-slate-600 text-sm font-black rounded-2xl transition-all shadow-sm"
        >
          <ArrowLeft size={18} /> Modify List
        </button>
        <button
          onClick={confirm}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-[#003399] to-[#00A9CE] text-white text-sm font-black rounded-2xl shadow-lg shadow-blue-200 hover:opacity-90 disabled:opacity-50 transition-all uppercase tracking-widest"
        >
          {saving ? <><Spin size="sm" />Creating Accounts...</> : <><Check size={18} />Confirm & Create Batch</>}
        </button>
      </div>
    </Modal>
  );

  /* ── FORM ─────────────────────────────────────────────── */
  return (
    <Modal onClose={onClose} size="full">
      <MHead icon={UsersRound} title="Add Multiple Students" sub="Enter details manually in the interactive grid" onClose={onClose} />

      <div className="px-8 pt-6 pb-4 flex-shrink-0 flex items-center justify-between border-b border-slate-50 bg-slate-50/30">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-80 relative group">
            <Building2 size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 z-10 transition-colors group-focus-within:text-[#003399]" />
            <select
              className={`w-full text-xs font-black border-0 rounded-2xl pl-10 pr-10 py-3 bg-white shadow-sm ring-1 focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none ${!collegeId && topErr ? 'ring-red-300' : 'ring-slate-200 focus:ring-blue-400'}`}
              value={collegeId}
              onChange={e => { setCollegeId(e.target.value); setTopErr(''); }}
            >
              <option value="">Select college for all students…</option>
              {colleges.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          {topErr && (
            <p className="text-xs text-red-500 font-bold animate-in slide-in-from-left-2 flex items-center gap-2">
              <AlertCircle size={14} /> {topErr}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end mr-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filled Rows</span>
            <span className="text-sm font-black text-[#003399] tracking-tighter">{filledRows.length}</span>
          </div>
          <button onClick={addRow} className="flex items-center gap-2 px-6 py-3 bg-[#003399] text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-blue-200 hover:bg-[#002d8b] transition-all">
            <Plus size={14} /> Add Row
          </button>
        </div>
      </div>

      <div className="overflow-auto flex-1 p-6 custom-scrollbar">
        <div className="rounded-2xl border border-slate-100 overflow-hidden shadow-sm bg-white">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="py-4 px-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest w-12 border-r border-slate-100/50">#</th>
                {[
                  { k: 'fullName', l: 'Full Name *', w: 'min-w-[180px]' },
                  { k: 'email', l: 'Email Address *', w: 'min-w-[200px]' },
                  { k: 'rollNumber', l: 'Roll Number *', w: 'min-w-[130px]' },
                  { k: 'branch', l: 'Branch', w: 'min-w-[100px]' },
                  { k: 'batch', l: 'Batch', w: 'min-w-[100px]' },
                  { k: 'semester', l: 'Sem.', w: 'min-w-[80px]' },
                  { k: 'cgpa', l: 'CGPA', w: 'min-w-[80px]' },
                  { k: 'phone', l: 'Phone', w: 'min-w-[130px]' },
                ].map(h => (
                  <th key={h.k} className={`py-4 px-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap ${h.w} border-r border-slate-100/50 last:border-r-0`}>{h.l}</th>
                ))}
                <th className="py-4 px-3 w-12" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rows.map((r, i) => (
                <tr key={r.id} className="group transition-colors odd:bg-white even:bg-slate-50/30">
                  <td className="py-2 px-2 text-slate-300 font-black text-[10px] text-center border-r border-slate-100/50">{i + 1}</td>
                  <TC id={r.id} field="fullName" value={r.fullName} placeholder="Ex: Sanjay S" setCell={setCell} error={rowErrs[r.id]?.fullName} />
                  <TC id={r.id} field="email" value={r.email} placeholder="sanjay@icl.com" setCell={setCell} error={rowErrs[r.id]?.email} />
                  <TC id={r.id} field="rollNumber" value={r.rollNumber} placeholder="21MID0228" setCell={setCell} error={rowErrs[r.id]?.rollNumber} />
                  <TC id={r.id} field="branch" value={r.branch} options={BRANCHES} setCell={setCell} error={rowErrs[r.id]?.branch} />
                  <TC id={r.id} field="batch" value={r.batch} placeholder="2026" setCell={setCell} error={rowErrs[r.id]?.batch} />
                  <TC id={r.id} field="semester" value={r.semester} options={SEMESTERS} setCell={setCell} error={rowErrs[r.id]?.semester} />
                  <TC id={r.id} field="cgpa" value={r.cgpa} placeholder="0–10.0" setCell={setCell} error={rowErrs[r.id]?.cgpa} />
                  <TC id={r.id} field="phone" value={r.phone} placeholder="10 Digits" setCell={setCell} error={rowErrs[r.id]?.phone} />
                  <td className="py-2 px-2 text-center">
                    {rows.length > 1 && (
                      <button onClick={() => delRow(r.id)} className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all border border-slate-100 hover:border-red-100 group/del">
                        <Trash2 size={14} className="group-hover/del:scale-110 transition-transform" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={addRow} className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100/50 hover:bg-white text-[#003399] text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-[#003399]/20 hover:border-[#003399] hover:shadow-sm group">
            <Plus size={14} className="group-hover:rotate-90 transition-transform" /> Add Row
          </button>
        </div>
        <div className="flex items-center justify-between gap-3 p-5 border-t border-slate-100 flex-shrink-0 bg-blue-50/40">
          <span className="text-xs text-slate-400">{filledRows.length} filled row(s)</span>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl">Cancel</button>
            <button onClick={goPreview} className="flex items-center gap-3 px-8 py-3.5 bg-[#003399] hover:bg-[#002d8b] text-white text-sm font-black rounded-2xl shadow-lg shadow-blue-200 transition-all uppercase tracking-widest">
              <Eye size={18} /> Preview Selection
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
  const toast = useToast();
  const fileRef = useRef(null);

  const [step, setStep] = useState('upload');
  const [collegeId, setCollegeId] = useState('');
  const [parsedRows, setParsedRows] = useState([]);
  const [rowErrors, setRowErrors] = useState({});
  const [headers, setHeaders] = useState([]);
  const [fileName, setFileName] = useState('');
  const [validating, setValidating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [serverValidated, setServerValidated] = useState(false);

  const parseFile = (file) => {
    setFileName(file.name);
    setServerValidated(false);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' });
        if (raw.length < 2) { toast.error('Empty file', 'No data rows found.'); return; }

        const hdrs = raw[0].map(h => String(h).trim().toLowerCase().replace(/\s+/g, '_'));
        setHeaders(hdrs);

        const rows = [];
        for (let i = 1; i < raw.length; i++) {
          const row = raw[i];
          if (row.every(c => c === '' || c == null)) continue;
          const obj = { _rowIndex: i + 1 };
          hdrs.forEach((h, idx) => { obj[h] = String(row[idx] || '').trim(); });
          rows.push(obj);
        }

        const errs = {};
        const emailsSeen = {}, rollsSeen = {};
        rows.forEach((row, i) => {
          const e = validateRow(row);
          const em = (row['email'] || '').toLowerCase().trim();
          const roll = (row['roll_number'] || row['rollnumber'] || row['roll_no'] || '').trim();
          if (em && emailsSeen[em] !== undefined) e['email'] = `Duplicate of row ${emailsSeen[em] + 2}`;
          else if (em) emailsSeen[em] = i;
          if (roll && rollsSeen[roll] !== undefined) e['roll_number'] = `Duplicate of row ${rollsSeen[roll] + 2}`;
          else if (roll) rollsSeen[roll] = i;
          if (Object.keys(e).length) errs[i] = e;
        });

        setParsedRows(rows);
        setRowErrors(errs);
        setStep('preview');
      } catch (err) { toast.error('Parse failed', err.message); }
    };
    reader.readAsArrayBuffer(file);
  };

  const runServerValidation = useCallback(async (rows, cId) => {
    if (!cId || rows.length === 0) return;
    setValidating(true);
    try {
      const normalized = rows.map((row, i) => ({
        name: row['name'] || row['full_name'] || row['fullname'] || '',
        email: row['email'] || '',
        roll_number: row['roll_number'] || row['rollnumber'] || row['roll_no'] || '',
        _rowIndex: row._rowIndex || i + 2,
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
              if (lm.includes('email')) newErrs[rowIdx]['email'] = msg.replace(/^Row \d+:\s*/, '');
              else if (lm.includes('roll')) newErrs[rowIdx]['roll_number'] = msg.replace(/^Row \d+:\s*/, '');
              else if (lm.includes('phone')) newErrs[rowIdx]['phone'] = msg.replace(/^Row \d+:\s*/, '');
              else if (lm.includes('branch')) newErrs[rowIdx]['branch'] = msg.replace(/^Row \d+:\s*/, '');
              else if (lm.includes('cgpa')) newErrs[rowIdx]['cgpa'] = msg.replace(/^Row \d+:\s*/, '');
              else if (lm.includes('semester')) newErrs[rowIdx]['semester'] = msg.replace(/^Row \d+:\s*/, '');
              else newErrs[rowIdx]['_general'] = msg.replace(/^Row \d+:\s*/, '');
            }
          }
        });
      }

      if (Array.isArray(data.warnings) && data.warnings.length) {
        data.warnings.forEach(w => {
          if (w.toLowerCase().includes('email')) {
            const parts = w.split(':');
            const emailPart = parts.slice(1).join(':').trim();
            const conflictEmails = new Set(emailPart?.split(',').map(e => e.trim().toLowerCase()) || []);
            rows.forEach((row, i) => {
              const em = (row['email'] || '').toLowerCase().trim();
              if (conflictEmails.has(em)) {
                newErrs[i] = newErrs[i] || {};
                newErrs[i]['email'] = '⚠ Email already registered in database';
              }
            });
          }
          if (w.toLowerCase().includes('roll')) {
            const parts = w.split(':');
            const rollPart = parts.slice(1).join(':').trim();
            const conflictRolls = new Set(rollPart?.split(',').map(r => r.trim()) || []);
            rows.forEach((row, i) => {
              const roll = (row['roll_number'] || row['rollnumber'] || '').trim();
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
          merged[idx] = { ...(merged[idx] || {}), ...errs };
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
    } catch (err) {
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
    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) { toast.error('Wrong file type', 'Use .xlsx, .xls, or .csv'); return; }
    parseFile(file);
  };

  const confirmUpload = async () => {
    if (!collegeId) { toast.error('College required', 'Select a college before uploading.'); return; }
    if (Object.keys(rowErrors).length > 0) {
      toast.error('Fix errors first', `${Object.keys(rowErrors).length} row(s) have errors. Fix the file and re-upload.`);
      return;
    }
    setUploading(true);
    try {
      const normalized = parsedRows.map((row, i) => ({
        name: row['name'] || row['full_name'] || row['fullname'] || '',
        email: row['email'] || '',
        roll_number: row['roll_number'] || row['rollnumber'] || row['roll_no'] || '',
        phone: row['phone'] || '',
        branch: row['branch'] || '',
        batch: row['batch'] || '',
        semester: row['semester'] || '',
        cgpa: row['cgpa'] || '',
        _rowIndex: row._rowIndex || i + 2,
      }));
      const res = await superAdminStudentAPI.bulkUploadJSON(normalized, collegeId);
      const resultData = res.data || res;
      setUploadResult(resultData);
      setStep('done');
      toast.success('Upload Complete', res.message);
      onDone?.();
    } catch (err) {
      toast.error('Upload Failed', err.message);
      if (err.message && err.message.toLowerCase().includes('email')) {
        const emailMatches = err.message.match(/[\w.+-]+@[\w.-]+\.\w+/g);
        if (emailMatches) {
          const conflictSet = new Set(emailMatches.map(e => e.toLowerCase()));
          setRowErrors(prev => {
            const updated = { ...prev };
            parsedRows.forEach((row, i) => {
              const em = (row['email'] || '').toLowerCase();
              if (conflictSet.has(em)) {
                updated[i] = { ...(updated[i] || {}), email: '⚠ Already registered in database' };
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

  const errorCount = Object.keys(rowErrors).length;
  const validCount = parsedRows.length - errorCount;
  const dbConflictCount = Object.values(rowErrors).filter(e => Object.values(e).some(msg => msg?.includes('⚠'))).length;
  const canUpload = errorCount === 0 && parsedRows.length > 0 && !!collegeId && serverValidated;
  const college = colleges.find(c => c._id === collegeId);

  /* DONE */
  if (step === 'done') return (
    <Modal onClose={onClose} size="md">
      <MHead icon={CheckCircle} title="Bulk Upload Complete!" sub="System records have been updated" onClose={onClose} color="#10b981" />
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { l: 'Processed', v: uploadResult?.totalRows || parsedRows.length, color: '#31572c', bg: '#ecf39e', icon: FileText },
            { l: 'Inserted', v: uploadResult?.inserted || 0, color: '#065f46', bg: '#dcfce7', icon: UserPlus },
            { l: 'Updated', v: uploadResult?.updated || 0, color: '#92400e', bg: '#fef3c7', icon: RefreshCw },
          ].map(s => (
            <div key={s.l} className="p-5 text-center rounded-[24px] border border-white shadow-sm flex flex-col items-center gap-2" style={{ backgroundColor: s.bg }}>
              <div className="w-8 h-8 rounded-full bg-white/50 flex items-center justify-center mb-1">
                <s.icon size={14} style={{ color: s.color }} />
              </div>
              <p className="text-2xl font-black leading-none" style={{ color: s.color }}>{s.v}</p>
              <p className="text-[9px] font-black uppercase tracking-widest leading-none" style={{ color: s.color, opacity: 0.6 }}>{s.l}</p>
            </div>
          ))}
        </div>

        <div className="flex items-start gap-3 p-4 bg-blue-50/50 border border-blue-100 rounded-2xl">
          <Mail size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs font-semibold text-blue-700 leading-relaxed">
            Onboarding emails containing temporary passwords and platform instructions have been successfully dispatched to all new students.
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <button
            onClick={() => {
              const rows = (uploadResult?.students && uploadResult.students.length > 0)
                ? uploadResult.students
                : parsedRows.map(r => ({
                  fullName: r['name'] || r['full_name'] || '',
                  email: r['email'] || '',
                  rollNumber: r['roll_number'] || r['rollnumber'] || '',
                  branch: r['branch'] || '',
                  batch: r['batch'] || '',
                  phone: r['phone'] || '',
                  temporaryPassword: '(System Generated)',
                  emailSent: true,
                }));
              downloadResultsAsExcel(rows, `bulk_upload_report_${Date.now()}.xlsx`);
            }}
            className="w-full flex items-center justify-center gap-3 py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-black rounded-2xl transition-all shadow-sm group">
            <Download size={18} className="text-slate-400 group-hover:text-[#003399]" />
            Download Manifest (Excel)
          </button>
          <button onClick={onClose} className="w-full py-4 bg-[#003399] text-white text-sm font-black rounded-2xl shadow-lg shadow-blue-200 hover:bg-[#002d8b] transition-all uppercase tracking-[0.2em]">
            Back to Students
          </button>
        </div>
      </div>
    </Modal>
  );

  /* PREVIEW TABLE */
  if (step === 'preview') {
    const displayHdrs = headers.filter(h => !h.startsWith('_'));
    return (
      <Modal onClose={onClose} size="full">
        <MHead icon={FileText} title={fileName} sub={`${parsedRows.length} total rows detected in archive`} onClose={onClose} />

        <div className="px-8 py-5 flex-shrink-0 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-80 relative group">
              <Building2 size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 z-10 group-focus-within:text-blue-500 transition-colors" />
              <select
                className="w-full text-xs font-black border border-slate-200 rounded-2xl pl-10 pr-10 py-3 bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 appearance-none shadow-sm transition-all"
                value={collegeId}
                onChange={e => { setCollegeId(e.target.value); setServerValidated(false); }}
              >
                <option value="">Select target institution…</option>
                {colleges.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            {validating && (
              <div className="flex items-center gap-3 px-4 py-2.5 bg-white border border-slate-100 rounded-xl shadow-sm">
                <Spin size="sm" color="blue" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest animate-pulse">Syncing with database…</span>
              </div>
            )}
            {serverValidated && !validating && (
              <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-black text-[10px] uppercase tracking-widest ${errorCount > 0 ? 'bg-red-50 border-red-100 text-red-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                {errorCount > 0 ? <><AlertTriangle size={14} /> Conflicts Detected</> : <><CheckCircle size={14} /> Database Ready</>}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-white rounded-xl border border-slate-100 flex flex-col items-center">
              <span className="font-black text-slate-400 text-[9px] uppercase tracking-tighter">Valid</span>
              <span className="font-black text-emerald-600 text-sm leading-none">{validCount}</span>
            </div>
            <div className="px-4 py-2 bg-white rounded-xl border border-slate-100 flex flex-col items-center">
              <span className="font-black text-slate-400 text-[9px] uppercase tracking-tighter">Errors</span>
              <span className="font-black text-red-600 text-sm leading-none">{errorCount}</span>
            </div>
          </div>
        </div>

        <div className="overflow-auto flex-1 p-6 custom-scrollbar">
          <div className="rounded-3xl border border-slate-100 overflow-hidden shadow-sm bg-white">
            <table className="w-full border-collapse text-[11px]">
              <thead className="sticky top-0 z-20">
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-center py-4 px-4 font-black text-slate-400 uppercase tracking-widest w-16 border-r border-slate-100/50">Row</th>
                  <th className="text-center py-4 px-4 font-black text-slate-400 uppercase tracking-widest w-12 border-r border-slate-100/50">Stat</th>
                  {displayHdrs.map(h => (
                    <th key={h} className="text-left py-4 px-4 font-black text-slate-400 uppercase tracking-widest whitespace-nowrap border-r border-slate-100/50">
                      {h.replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {parsedRows.map((row, i) => {
                  const rowErr = rowErrors[i] || {};
                  const hasErr = Object.keys(rowErr).length > 0;
                  const hasDbConflict = Object.values(rowErr).some(m => m?.includes('⚠'));
                  return (
                    <tr key={i} className={`group transition-all hover:bg-slate-50/50 ${hasErr ? (hasDbConflict ? 'bg-amber-50/20' : 'bg-red-50/20') : ''}`}>
                      <td className="py-2.5 px-4 text-center text-slate-300 font-bold border-r border-slate-100/50">{row._rowIndex || i + 2}</td>
                      <td className="py-2.5 px-4 text-center border-r border-slate-100/50">
                        {hasErr
                          ? (hasDbConflict
                            ? <AlertTriangle size={14} className="text-amber-500 mx-auto" />
                            : <AlertCircle size={14} className="text-red-500 mx-auto" title={Object.values(rowErr).join('\n')} />)
                          : <CheckCircle size={14} className="text-emerald-500 mx-auto" />}
                      </td>
                      {displayHdrs.map(h => {
                        const cellErr = rowErr[h] || (h === 'roll_number' && (rowErr['rollnumber'] || rowErr['roll_no'])) || rowErr['_general'];
                        const isDbConflict = cellErr?.includes('⚠');
                        return (
                          <td key={h} className={`py-2.5 px-4 border-r border-slate-100/30 last:border-r-0 ${cellErr ? 'relative group/err' : ''}`}>
                            <div className="flex items-center gap-2">
                              <span className={`font-medium ${cellErr ? (isDbConflict ? 'text-amber-700 font-bold' : 'text-red-700 font-bold') : 'text-slate-600'}`}>
                                {row[h] || <span className="opacity-20 italic">null</span>}
                              </span>
                              {cellErr && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-40 px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-[10px] font-bold shadow-2xl opacity-0 group-hover/err:opacity-100 pointer-events-none transition-all scale-95 group-hover/err:scale-100 translate-y-1">
                                  {cellErr}
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900" />
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
        </div>

        <div className="flex items-center justify-between gap-6 p-8 border-t border-slate-100 bg-white shadow-[0_-8px_30px_rgb(0,0,0,0.02)]">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200">
              <Info size={18} className="text-slate-400" />
            </div>
            <p className="text-[11px] text-slate-500 font-medium max-w-md leading-relaxed">
              System validation checks for email syntax, roll number formatting, and database conflicts.
              <span className="font-black text-red-500"> Rows with conflicts cannot be uploaded.</span>
            </p>
          </div>
          <div className="flex gap-4">
            <button onClick={resetUpload} className="px-8 py-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-black rounded-2xl transition-all shadow-sm flex items-center gap-3">
              <ArrowLeft size={18} /> Re-upload File
            </button>
            <button
              onClick={confirmUpload}
              disabled={!canUpload || uploading}
              className={`flex items-center gap-3 px-10 py-4 text-sm font-black rounded-2xl shadow-lg transition-all uppercase tracking-widest ${canUpload && !uploading
                ? 'bg-[#003399] hover:bg-[#002d8b] text-white shadow-blue-200'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none border border-slate-200'
                }`}
            >
              {uploading ? <><Spin size="sm" />Uploading...</> : <><UploadCloud size={20} />Initialize Upload ({validCount})</>}
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  /* DROP ZONE */
  return (
    <Modal onClose={onClose} size="lg">
      <MHead icon={CloudUpload} title="Bulk Student Upload" sub="High-velocity data ingestion with validation" onClose={onClose} />
      <div className="p-8 space-y-6 overflow-y-auto">
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`group border-3 border-dashed rounded-[40px] p-12 flex flex-col items-center gap-6 cursor-pointer transition-all duration-300 relative overflow-hidden ${dragOver ? 'border-[#003399] bg-blue-50/50 scale-[0.98]' : 'border-slate-200 hover:border-blue-400/50 hover:bg-slate-50'}`}
        >
          <div className={`absolute inset-0 bg-gradient-to-br from-[#003399]/5 to-[#00A9CE]/5 opacity-0 group-hover:opacity-100 transition-opacity`} />

          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-xl border border-slate-100 group-hover:scale-110 transition-transform duration-500 z-10">
            <Upload size={32} className="text-[#003399]" />
          </div>

          <div className="text-center z-10">
            <h4 className="text-lg font-black text-slate-800 tracking-tight">Drop your manifest here</h4>
            <p className="text-sm text-slate-400 mt-2 font-medium">Excel (.xlsx, .xls) or CSV files supported</p>
          </div>

          <div className="px-6 py-2 bg-[#003399] text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full z-10 shadow-lg group-hover:scale-105 transition-transform">
            Browse Locals
          </div>

          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) parseFile(f); e.target.value = ''; }} />
        </div>

        <div className="flex items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-3xl group cursor-pointer hover:bg-white hover:shadow-md transition-all" onClick={() => superAdminStudentAPI.downloadTemplate()}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
              <FileText size={20} className="text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-800 leading-none">Standard Template</p>
              <p className="text-[11px] text-slate-400 mt-1.5 font-medium">Download template with pre-defined headers</p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white border border-slate-100 text-[#003399] group-hover:bg-[#003399] group-hover:text-white transition-all">
            <Download size={16} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm">
            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <AlertCircle size={12} /> Key Constraints
            </p>
            <div className="space-y-3">
              {[
                { k: 'name', d: 'Legal student identity' },
                { k: 'email', d: 'Unique credential' },
                { k: 'roll_no', d: 'Primary registry ID' }
              ].map(x => (
                <div key={x.k} className="flex items-center gap-3">
                  <code className="text-[10px] font-mono font-black bg-red-50 text-red-600 px-2 py-0.5 rounded-lg border border-red-100">{x.k}</code>
                  <span className="text-[10px] font-bold text-slate-400 leading-none">{x.d}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Plus size={12} /> Extended Data
            </p>
            <div className="space-y-3">
              {[
                { k: 'branch', d: 'Academic stream' },
                { k: 'batch', d: 'Pass-out year' },
                { k: 'cgpa', d: 'Performance metric' }
              ].map(x => (
                <div key={x.k} className="flex items-center gap-3">
                  <code className="text-[10px] font-mono font-black bg-slate-50 text-slate-600 px-2 py-0.5 rounded-lg border border-slate-200">{x.k}</code>
                  <span className="text-[10px] font-bold text-slate-400 leading-none">{x.d}</span>
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
  const [f, setF_] = useState({ collegeId: '', branch: '', batch: '', isPlaced: '', format: 'xlsx' });
  const setF = (k, v) => setF_(p => ({ ...p, [k]: v }));
  const [preview, setPrev] = useState(null);
  const [prevLoad, setPL] = useState(false);
  const [exporting, setEx] = useState(false);

  const fetchPreview = useCallback(async () => {
    setPL(true);
    try {
      const p = Object.fromEntries(Object.entries(f).filter(([k, v]) => v && k !== 'format'));
      const r = await superAdminStudentAPI.getExportPreview(p);
      setPrev(r.data || r);
    } catch (e) { toast.error('Preview failed', e.message); }
    finally { setPL(false); }
  }, [f, toast]);

  const doExport = async () => {
    setEx(true);
    try {
      await superAdminStudentAPI.exportStudents(Object.fromEntries(Object.entries(f).filter(([, v]) => v)));
      toast.success('Exported', 'File downloaded!');
      onClose();
    } catch (e) { toast.error('Export failed', e.message); }
    finally { setEx(false); }
  };

  return (
    <Modal onClose={onClose} size="md">
      <MHead icon={FileDown} title="Export Student Records" sub="Generate custom datasets from the platform" onClose={onClose} />
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Field label="Filter by Institution" icon={Building2}>
              <select className={`${I_ICON} appearance-none ${OK_CLS}`} value={f.collegeId} onChange={e => setF('collegeId', e.target.value)}>
                <option value="">All Institutions</option>
                {colleges.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Academic Branch" icon={BookOpen}>
            <select className={`${I_ICON} appearance-none ${OK_CLS}`} value={f.branch} onChange={e => setF('branch', e.target.value)}>
              <option value="">All Branches</option>{BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </Field>
          <Field label="Placement Status" icon={GraduationCap}>
            <select className={`${I_ICON} appearance-none ${OK_CLS}`} value={f.isPlaced} onChange={e => setF('isPlaced', e.target.value)}>
              <option value="">All Students</option><option value="true">Placed Only</option><option value="false">Unplaced Only</option>
            </select>
          </Field>
          <Field label="Output Format" icon={FileText}>
            <select className={`${I_ICON} appearance-none ${OK_CLS}`} value={f.format} onChange={e => setF('format', e.target.value)}>
              <option value="xlsx">Microsoft Excel (.xlsx)</option><option value="csv">Comma Separated (.csv)</option>
            </select>
          </Field>
          <div className="flex items-end">
            <button onClick={fetchPreview} disabled={prevLoad} className="w-full flex items-center justify-center gap-2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-2xl disabled:opacity-60 transition-all border border-slate-200/50">
              {prevLoad ? <Spin size="sm" color="slate" /> : <RefreshCw size={14} />} Refresh Count
            </button>
          </div>
        </div>

        {preview ? (
          <div className="p-5 bg-blue-50 border border-blue-100 rounded-3xl animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-blue-100 flex items-center justify-center shadow-sm">
                <Users size={18} className="text-[#003399]" />
              </div>
              <div>
                <p className="text-xl font-black text-[#003399] leading-none tracking-tight">{(preview.totalRecords || 0).toLocaleString()}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">Students ready for export</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-5 bg-slate-50 border border-slate-100 rounded-3xl text-center">
            <p className="text-xs font-semibold text-slate-400">Configure filters and refresh to see matches</p>
          </div>
        )}

        <div className="flex gap-4 pt-2">
          <button onClick={onClose} className="flex-1 py-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-black rounded-[20px] transition-all">Cancel</button>
          <button
            onClick={doExport}
            disabled={exporting || prevLoad}
            className="flex-[2] flex items-center justify-center gap-3 py-4 bg-[#003399] hover:bg-[#002d8b] text-white text-sm font-black rounded-[20px] shadow-lg shadow-blue-200 transition-all uppercase tracking-widest"
          >
            {exporting ? <><Spin size="sm" />Encoding...</> : <><Download size={20} />Download Dataset</>}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════════════
   STUDENT LIST SECTION — live data from DB
   Displays all students across colleges with college-wise grouping
══════════════════════════════════════════════════════════ */
function StudentListSection({ colleges }) {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [branches, setBranches] = useState([]);
  const [batches, setBatches] = useState([]);
  const [collegeStats, setCollegeStats] = useState(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const limit = 15;

  // Read filter values from URL query params
  const selectedCollege = searchParams.get('college') || '';
  const search = searchParams.get('search') || '';
  const branch = searchParams.get('branch') || '';
  const batch = searchParams.get('batch') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);

  // Build college map for quick lookup
  const collegeMap = useMemo(() => {
    const map = {};
    colleges.forEach(c => { map[c._id] = c; });
    return map;
  }, [colleges]);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await superAdminStudentAPI.getStudents({
        ...(selectedCollege && { collegeId: selectedCollege }),
        page,
        limit,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(branch && { branch }),
        ...(batch && { batch }),
      });
      setStudents(res.students || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
      if (res.filters?.branches?.length) setBranches(res.filters.branches);
      if (res.filters?.batches?.length) setBatches(res.filters.batches);
      if (res.collegeStats) setCollegeStats(res.collegeStats);
    } catch (e) {
      toast.error('Failed to load students', e.message);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCollege, page, debouncedSearch, branch, batch, toast]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  // Update URL params helper
  const updateParams = (updates) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === '' || value === null || value === undefined) {
        newParams.delete(key);
      } else {
        newParams.set(key, String(value));
      }
    });
    setSearchParams(newParams);
  };

  const handleCollegeChange = (id) => {
    updateParams({ college: id || null, branch: null, batch: null, search: null, page: null });
    setBranches([]); setBatches([]); setBranch(''); setBatch('');
    setSearch(''); setStudents([]); setCollegeStats(null);
  };

  const handleSearchChange = (value) => {
    updateParams({ search: value || null, page: null });
  };

  const handleBranchChange = (value) => {
    updateParams({ branch: value || null, page: null });
  };

  const handleBatchChange = (value) => {
    updateParams({ batch: value || null, page: null });
  };

  const handlePageChange = (newPage) => {
    updateParams({ page: newPage });
  };

  if (!colleges.length) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

      {/* Filters row */}
      <div className="p-4 border-b border-slate-100 flex items-center gap-3 flex-wrap bg-slate-50/50">
        {/* College picker */}
        <div className="relative min-w-[200px]">
          <Building2 size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select
            className="w-full text-sm border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 appearance-none"
            value={selectedCollege}
            onChange={e => handleCollegeChange(e.target.value)}
          >
            <option value="">All Colleges</option>
            {colleges.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            className="w-full text-sm border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Search name, email, roll no…"
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
          />
        </div>

        {/* Branch filter */}
        <select
          className="text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 appearance-none"
          value={branch}
          onChange={e => handleBranchChange(e.target.value)}
        >
          <option value="">All Branches</option>
          {(branches.length ? branches : BRANCHES).map(b => <option key={b} value={b}>{b}</option>)}
        </select>

        {/* Batch filter */}
        {batches.length > 0 && (
          <select
            className="text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 appearance-none"
            value={batch}
            onChange={e => handleBatchChange(e.target.value)}
          >
            <option value="">All Batches</option>
            {batches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        )}
      </div>

      {/* Stats bar */}
      {collegeStats && (
        <div className="px-4 py-3 bg-white border-b border-slate-100 flex items-center gap-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
            {[
              { icon: Users, label: 'Total Students', value: collegeStats.totalStudents, bg: 'bg-[#003399]/5', border: 'border-[#003399]/10', text: 'text-[#003399]' },
              { icon: CheckCircle, label: 'Active Students', value: collegeStats.totalActive, bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-600' },
              { icon: GraduationCap, label: 'Placed Students', value: collegeStats.totalPlaced, bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-600' },
              { icon: TrendingUp, label: 'Placement Rate', value: `${collegeStats.placementRate}%`, bg: 'bg-indigo-50', border: 'border-indigo-100', text: 'text-indigo-600' },
            ].map(({ icon: Icon, label, value, bg, border, text }) => (
              <div key={label} className={`flex items-center gap-4 px-4 py-3 rounded-2xl border ${bg} ${border}`}>
                <div className="w-10 h-10 bg-white border border-white/50 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Icon className={`w-5 h-5 ${text}`} />
                </div>
                <div className="min-w-0">
                  <p className={`text-xl font-black ${text} leading-none tracking-tight`}>{value}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">{label}</p>
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
            <Spin size="md" color="blue" />
            <span className="text-sm text-slate-500">Loading students…</span>
          </div>
        ) : students.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <GraduationCap size={40} className="mb-3 opacity-30" />
            <p className="text-sm font-semibold">No students found</p>
            <p className="text-xs mt-1">{(search || selectedCollege || branch || batch) ? 'Try adjusting your filters' : 'Add students using the buttons above'}</p>
          </div>
        ) : (
          <table className="w-full table-fixed text-xs">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-[60px]">S.No</th>
                <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Name</th>
                <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-[120px] hidden lg:table-cell">Roll No.</th>
                <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-[100px] hidden md:table-cell">Branch</th>
                <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-[100px] hidden xl:table-cell">Batch</th>
                {!selectedCollege && <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-[150px] hidden lg:table-cell">College</th>}
                <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-[100px]">Status</th>
                <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-[120px] hidden xl:table-cell">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((s, i) => {
                const si = s.studentInfo || {};
                const sNo = (page - 1) * limit + i + 1;
                const college = s.collegeId;
                return (
                  <tr key={s._id} className="hover:bg-blue-50/10 transition-colors group">
                    <td className="px-5 py-4 text-xs font-bold text-slate-400">
                      {String(sNo).padStart(2, '0')}
                    </td>
                    <td className="px-5 py-4">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate" title={s.fullName}>
                          {s.fullName || '—'}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate max-w-[140px]">{s.email}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono text-slate-600 font-medium tracking-tight truncate hidden lg:table-cell">
                      {si.rollNumber || '—'}
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      {si.branch
                        ? <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-md text-[10px] font-bold">{si.branch}</span>
                        : <span className="text-slate-300 italic">—</span>}
                    </td>
                    <td className="px-5 py-4 text-slate-500 font-medium hidden xl:table-cell">
                      {si.batch || '—'}
                    </td>
                    {!selectedCollege && (
                      <td className="px-5 py-4 hidden lg:table-cell">
                        {college?.name
                          ? <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-md text-[10px] font-bold">{college.name}</span>
                          : <span className="text-slate-300 italic">—</span>}
                      </td>
                    )}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.isActive ? 'bg-green-400' : 'bg-red-400'}`} />
                        <span className={`text-[10px] font-bold ${s.isActive ? 'text-green-600' : 'text-red-500'} uppercase tracking-tight`}>
                          {s.isActive ? (si.isPlaced ? 'Placed' : 'Active') : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-400 font-medium whitespace-nowrap hidden xl:table-cell">
                      {s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}

      {/* Pagination */}
      {totalPages > 1 && !loading && students.length > 0 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/50">
          <span className="text-xs text-slate-400">
            Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} of {total.toLocaleString()}
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => handlePageChange(page - 1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs font-bold text-slate-600">{page} / {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => handlePageChange(page + 1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={14} />
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
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null);
  const [refreshList, setRefresh] = useState(0);

  const loadColleges = useCallback(async () => {
    setLoading(true);
    try {
      const r = await superAdminStudentAPI.getColleges();
      setColleges(r.colleges || r.data || []);
    } catch (e) { toast.error('Error loading colleges', e.message); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { loadColleges(); }, [loadColleges]);

  const handleDone = () => {
    // DO NOT close modal here — let user see the success card first.
    // The modal closes only when user clicks "Done" or "Add Another" (via onClose).
    setRefresh(n => n + 1); // refresh student list in background
  };

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
      icon: UsersRound, gradient: 'from-blue-600 to-cyan-500', border: 'border-blue-100',
      light: 'from-blue-50 to-cyan-50/50',
      title: 'Add Multiple Students',
      desc: 'Fill a spreadsheet-like table in the browser. Preview all rows before saving.',
      tips: ['Inline table — no file needed', 'Preview all rows before confirm', 'All students emailed passwords'],
      action: () => setModal('multiple'), btnLabel: 'Add Multiple Students',
    },
    {
      icon: CloudUpload, gradient: 'from-blue-600 to-cyan-500', border: 'border-blue-100',
      light: 'from-blue-50 to-cyan-50/50',
      title: 'Bulk Excel Upload',
      desc: 'Upload .xlsx or .csv. Full preview with error highlighting + DB conflict detection.',
      tips: ['Instant client-side Excel parsing', 'DB conflict detection before upload', 'Confirm only when all rows valid'],
      action: () => setModal('upload'), btnLabel: 'Bulk Upload',
    },
  ];

  return (
    <SuperAdminDashboardLayout>
      <div className="px-6 py-4 md:px-8 md:py-6 space-y-5 font-sans">

        {/* ══ HEADER SECTION ══ */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="min-w-0">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2 h-8 bg-gradient-to-b from-[#003399] to-[#00A9CE] rounded-full" />
              Student Management
            </h1>
            <p className="text-sm text-slate-400 mt-1 font-medium italic">Global student operations across {colleges.length} registered colleges.</p>
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
            <button onClick={() => setModal('export')} className={BTN_SEC}>
              <FileDown className="w-3.5 h-3.5" /> Export
            </button>
            <button onClick={() => setModal('single')} className={BTN_SEC}>
              <UserPlus className="w-3.5 h-3.5" /> Add Student
            </button>
            <button onClick={() => setModal('multiple')} className={BTN_SEC}>
              <UsersRound className="w-3.5 h-3.5" /> Add Multiple
            </button>
            <button onClick={() => setModal('upload')} className={BTN_PRI}>
              <CloudUpload className="w-4 h-4" /> Bulk Upload
            </button>
          </div>
        </div>

        {/* Colleges bar */}



        {/* ── LIVE STUDENT LIST ── */}
        <StudentListSection colleges={colleges} key={refreshList} />
      </div>

      {/* ── Modals render via portal above sidebar ── */}
      {modal === 'single' && <AddSingleModal colleges={colleges} onClose={() => setModal(null)} onDone={handleDone} />}
      {modal === 'multiple' && <AddMultipleModal colleges={colleges} onClose={() => setModal(null)} onDone={handleDone} />}
      {modal === 'upload' && <BulkUploadModal colleges={colleges} onClose={() => setModal(null)} onDone={handleDone} />}
      {modal === 'export' && <ExportModal colleges={colleges} onClose={() => setModal(null)} />}
    </SuperAdminDashboardLayout>
  );
}