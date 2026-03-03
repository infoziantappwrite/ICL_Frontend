// src/pages/CollegeAdmin/StudentManagement.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useToast } from '../../context/ToastContext';
import { collegeAdminStudentAPI } from '../../api/studentAPI';
import {
  GraduationCap, Search, SlidersHorizontal, Upload, RefreshCw,
  X, ChevronLeft, ChevronRight, CheckCircle, AlertTriangle,
  AlertCircle, FileText, Download, CloudUpload, FileDown,
  ClipboardCheck, Users, UserCheck, UserX, TrendingUp,
  Layers, Info, Plus, Trash2, UserPlus, UsersRound,
  KeyRound, Mail, Hash, BookOpen, Star, Calendar, Phone,
} from 'lucide-react';

const BRANCHES = ['CSE','ECE','EEE','MECH','CIVIL','IT','AI/ML','DS','Other'];
const SEMESTERS = ['1','2','3','4','5','6','7','8'];
const PER_PAGE  = 25;

// ── Atoms ──────────────────────────────────────────────────────────────────────
const Spin = ({ size = 'md', color = 'blue' }) => {
  const sz = { sm:'w-4 h-4', md:'w-6 h-6', lg:'w-10 h-10' }[size];
  const cl = { blue:'border-blue-500', white:'border-white', slate:'border-slate-400', green:'border-emerald-500' }[color];
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

const Overlay = ({ children, onClose, size = 'md' }) => {
  const w = { sm:'max-w-md', md:'max-w-lg', lg:'max-w-2xl', xl:'max-w-4xl' }[size];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"/>
      <div className={`relative w-full ${w} max-h-[92vh] flex flex-col`} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};

// ── Field component ─────────────────────────────────────────────────────────────
const Field = ({ label, required, icon: Icon, children, hint }) => (
  <div>
    <label className="text-xs font-bold text-slate-700 block mb-1.5">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    <div className="relative">
      {Icon && <Icon size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10"/>}
      {children}
    </div>
    {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
  </div>
);

const inputCls = (hasIcon = true) =>
  `w-full text-sm border border-slate-200 rounded-xl ${hasIcon ? 'pl-9' : 'px-3'} pr-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition`;

const selectCls = (hasIcon = true) =>
  `w-full text-sm border border-slate-200 rounded-xl ${hasIcon ? 'pl-9' : 'px-3'} pr-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition appearance-none`;

// ── Add Single Student Modal ────────────────────────────────────────────────────
const EMPTY_STUDENT = {
  fullName: '', email: '', rollNumber: '', branch: '',
  semester: '', cgpa: '', batch: '', phone: '',
};

const AddSingleModal = ({ onClose, onDone }) => {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY_STUDENT);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [successData, setSuccessData] = useState(null); // { fullName, email, temporaryPassword }

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
    if (form.cgpa && (isNaN(form.cgpa) || +form.cgpa < 0 || +form.cgpa > 10)) e.cgpa = 'CGPA must be 0.0 – 10.0';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
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
      };
      const res = await collegeAdminStudentAPI.addStudent(payload);
      // Show success screen with temporary password
      setSuccessData(res.data || { fullName: form.fullName, email: form.email });
      onDone?.();
    } catch(err) {
      toast.error('Failed to add student', err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Success screen ─────────────────────────────────────────────────────────
  if (successData) {
    return (
      <Overlay onClose={onClose} size="md">
        <div className="bg-white rounded-2xl overflow-hidden flex flex-col shadow-2xl p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-9 h-9 text-emerald-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Student Added Successfully!</h3>
          <p className="text-sm text-gray-500 mb-6">{successData.fullName} has been registered.</p>

          {successData.temporaryPassword && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 text-left">
              <p className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <KeyRound size={13}/> Temporary Password
              </p>
              <div className="flex items-center justify-between gap-2">
                <code className="text-base font-mono font-bold text-amber-900 tracking-widest">
                  {successData.temporaryPassword}
                </code>
                <button
                  onClick={() => { navigator.clipboard.writeText(successData.temporaryPassword); toast.success('Copied!', 'Temporary password copied to clipboard'); }}
                  className="text-xs px-3 py-1 bg-amber-200 text-amber-800 rounded-lg hover:bg-amber-300 transition font-medium"
                >
                  Copy
                </button>
              </div>
              <p className="text-xs text-amber-700 mt-2">
                Share this with the student. They will be prompted to change it on first login.
              </p>
            </div>
          )}

          <div className="bg-gray-50 rounded-xl p-3 text-left mb-5 space-y-1">
            <p className="text-xs text-gray-500"><span className="font-semibold text-gray-700">Email:</span> {successData.email}</p>
            {successData.rollNumber && <p className="text-xs text-gray-500"><span className="font-semibold text-gray-700">Roll No:</span> {successData.rollNumber}</p>}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setSuccessData(null); setForm(EMPTY_STUDENT); }}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
            >
              Add Another
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
            >
              Done
            </button>
          </div>
        </div>
      </Overlay>
    );
  }

  return (
    <Overlay onClose={onClose} size="md">
      <div className="bg-white rounded-2xl overflow-hidden flex flex-col max-h-[92vh] shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <UserPlus size={18} className="text-white"/>
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Add Single Student</h2>
              <p className="text-xs text-blue-200">Password will be auto-generated and sent to the student</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center text-white transition-colors">
            <X size={14}/>
          </button>
        </div>

        {/* Password notice */}
        <div className="mx-6 mt-5 flex items-center gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <KeyRound size={13} className="text-amber-600 flex-shrink-0"/>
          <p className="text-xs text-amber-700">
            A <strong>secure password is auto-generated</strong> by the system — you do not need to provide one.
            The student can reset it after first login.
          </p>
        </div>

        {/* Form */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="space-y-5">
            {/* Name + Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full Name" required icon={UserPlus}>
                <input
                  className={`${inputCls()} ${errors.fullName ? 'border-red-400 focus:ring-red-400' : ''}`}
                  placeholder="e.g. Ravi Kumar"
                  value={form.fullName}
                  onChange={e => setF('fullName', e.target.value)}
                />
                {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
              </Field>
              <Field label="Email Address" required icon={Mail}>
                <input
                  type="email"
                  className={`${inputCls()} ${errors.email ? 'border-red-400 focus:ring-red-400' : ''}`}
                  placeholder="student@college.edu"
                  value={form.email}
                  onChange={e => setF('email', e.target.value)}
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </Field>
            </div>

            {/* Roll Number + Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Roll Number" required icon={Hash}
                hint="Must be unique within this college">
                <input
                  className={`${inputCls()} font-mono ${errors.rollNumber ? 'border-red-400 focus:ring-red-400' : ''}`}
                  placeholder="e.g. 21CSE001"
                  value={form.rollNumber}
                  onChange={e => setF('rollNumber', e.target.value)}
                />
                {errors.rollNumber && <p className="text-xs text-red-500 mt-1">{errors.rollNumber}</p>}
              </Field>
              <Field label="Phone Number" icon={Phone}>
                <input
                  type="tel"
                  className={inputCls()}
                  placeholder="10-digit mobile number"
                  value={form.phone}
                  onChange={e => setF('phone', e.target.value)}
                />
              </Field>
            </div>

            <div className="h-px bg-slate-100"/>

            {/* Department + Semester */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Department / Branch" icon={BookOpen}>
                <select className={selectCls()} value={form.branch} onChange={e => setF('branch', e.target.value)}>
                  <option value="">Select department</option>
                  {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </Field>
              <Field label="Semester" icon={Layers}>
                <select className={selectCls()} value={form.semester} onChange={e => setF('semester', e.target.value)}>
                  <option value="">Select semester</option>
                  {SEMESTERS.map(s => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </Field>
            </div>

            {/* CGPA + Batch */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="CGPA" icon={Star}
                hint="Scale 0.0 – 10.0">
                <input
                  type="number" step="0.01" min="0" max="10"
                  className={`${inputCls()} ${errors.cgpa ? 'border-red-400 focus:ring-red-400' : ''}`}
                  placeholder="e.g. 8.50"
                  value={form.cgpa}
                  onChange={e => setF('cgpa', e.target.value)}
                />
                {errors.cgpa && <p className="text-xs text-red-500 mt-1">{errors.cgpa}</p>}
              </Field>
              <Field label="Batch (Graduation Year)" icon={Calendar}>
                <input
                  type="text"
                  className={inputCls()}
                  placeholder="e.g. 2026"
                  value={form.batch}
                  onChange={e => setF('batch', e.target.value)}
                />
              </Field>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl disabled:opacity-50 transition-colors shadow-sm shadow-blue-200">
            {saving ? <><Spin size="sm" color="white"/>Adding Student…</> : <><UserPlus size={14}/>Add Student</>}
          </button>
        </div>
      </div>
    </Overlay>
  );
};

// ── Add Multiple Students Modal ─────────────────────────────────────────────────
const EMPTY_ROW = () => ({
  id: Math.random().toString(36).slice(2),
  fullName: '', email: '', rollNumber: '', branch: '',
  semester: '', cgpa: '', batch: '', phone: '',
});

const AddMultipleModal = ({ onClose, onDone }) => {
  const toast = useToast();
  const [rows, setRows] = useState([EMPTY_ROW(), EMPTY_ROW(), EMPTY_ROW()]);
  const [saving, setSaving] = useState(false);
  const [rowErrors, setRowErrors] = useState({});
  const [result, setResult] = useState(null);

  const addRow = () => setRows(p => [...p, EMPTY_ROW()]);
  const removeRow = (id) => setRows(p => p.filter(r => r.id !== id));
  const setCell = (id, field, value) => {
    setRows(p => p.map(r => r.id === id ? {...r, [field]: value} : r));
    setRowErrors(p => {
      const next = {...p};
      if (next[id]) delete next[id][field];
      return next;
    });
  };

  const validate = () => {
    const errs = {};
    const emails = new Set(); const rolls = new Set();
    const filled = rows.filter(r => r.fullName.trim() || r.email.trim() || r.rollNumber.trim());
    if (!filled.length) {
      toast.error('No data', 'Please fill in at least one student row.');
      return null;
    }
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

  const handleSubmit = async () => {
    const v = validate();
    if (!v) return;
    if (Object.keys(v.errs).length) { setRowErrors(v.errs); toast.error('Validation errors', 'Fix the highlighted cells first.'); return; }
    setSaving(true);
    try {
      const students = v.filled.map(r => ({
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
    } catch(err) {
      toast.error('Failed', err.message);
    } finally {
      setSaving(false);
    }
  };

  const filledCount = rows.filter(r => r.fullName.trim() || r.email.trim() || r.rollNumber.trim()).length;

  // ── Success screen ──
  if (result) {
    return (
      <Overlay onClose={onClose} size="lg">
        <div className="bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4 flex items-center gap-3 flex-shrink-0">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <CheckCircle size={18} className="text-white"/>
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Students Added — {result.count} created</h2>
              <p className="text-xs text-emerald-100">Share temporary passwords with each student</p>
            </div>
          </div>
          <div className="overflow-y-auto flex-1 p-6">
            {result.passwords.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <KeyRound size={12}/> Temporary Passwords
                </p>
                {result.passwords.map((s, i) => (
                  <div key={s.id || i} className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-xl gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800 truncate">{s.fullName}</p>
                      <p className="text-xs text-slate-500 truncate">{s.email}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <code className="text-sm font-mono font-bold text-amber-900 bg-amber-100 px-2 py-1 rounded-lg">
                        {s.temporaryPassword}
                      </code>
                      <button
                        onClick={() => navigator.clipboard.writeText(s.temporaryPassword)}
                        className="text-xs px-2 py-1 bg-amber-200 text-amber-800 rounded-lg hover:bg-amber-300 transition"
                        title="Copy password"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <UsersRound size={32} className="text-emerald-500 mx-auto mb-3"/>
                <p className="text-2xl font-black text-slate-800">{result.count}</p>
                <p className="text-sm text-slate-500">students added with auto-generated passwords</p>
              </div>
            )}
          </div>
          <div className="flex justify-end px-6 pb-6 pt-4 border-t border-slate-100 flex-shrink-0">
            <button onClick={() => { onDone?.(); onClose(); }}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors">
              Done
            </button>
          </div>
        </div>
      </Overlay>
    );
  }

  // ── Table columns config ──
  const cols = [
    { key: 'fullName',   label: 'Full Name',   required: true,  width: 'w-36',  placeholder: 'Ravi Kumar',    type: 'text' },
    { key: 'email',      label: 'Email',        required: true,  width: 'w-44',  placeholder: 'email@edu.in',  type: 'email' },
    { key: 'rollNumber', label: 'Roll Number',  required: true,  width: 'w-28',  placeholder: '21CSE001',      type: 'text' },
    { key: 'branch',     label: 'Department',   required: false, width: 'w-28',  type: 'select', options: BRANCHES },
    { key: 'semester',   label: 'Semester',     required: false, width: 'w-24',  type: 'select', options: SEMESTERS.map(s => ({ value: s, label: `Sem ${s}` })) },
    { key: 'cgpa',       label: 'CGPA',         required: false, width: 'w-20',  placeholder: '8.50',          type: 'number' },
    { key: 'batch',      label: 'Batch',        required: false, width: 'w-20',  placeholder: '2026',          type: 'text' },
    { key: 'phone',      label: 'Phone',        required: false, width: 'w-28',  placeholder: '9876543210',    type: 'tel' },
  ];

  return (
    <Overlay onClose={onClose} size="xl">
      <div className="bg-white rounded-2xl overflow-hidden flex flex-col max-h-[92vh] shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <UsersRound size={18} className="text-white"/>
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Add Multiple Students</h2>
              <p className="text-xs text-violet-200">Fill in the table — passwords are auto-generated for all students</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center text-white transition-colors">
            <X size={14}/>
          </button>
        </div>

        {/* Info strip */}
        <div className="mx-6 mt-4 flex items-center gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl flex-shrink-0">
          <KeyRound size={13} className="text-amber-600 flex-shrink-0"/>
          <p className="text-xs text-amber-700 flex-1">
            <strong>Passwords are auto-generated</strong> — you only need Name, Email, and Roll Number per student.
            Fields marked <span className="text-red-500 font-bold">*</span> are required.
          </p>
          <span className="text-xs font-bold text-amber-600 flex-shrink-0">{filledCount} filled</span>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto px-6 py-4">
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
                              <select
                                className={`${base} appearance-none`}
                                value={row[col.key]}
                                onChange={e => setCell(row.id, col.key, e.target.value)}
                              >
                                <option value="">—</option>
                                {col.options?.map(o => typeof o === 'string'
                                  ? <option key={o} value={o}>{col.key === 'semester' ? `Sem ${o}` : o}</option>
                                  : <option key={o.value} value={o.value}>{o.label}</option>
                                )}
                              </select>
                            ) : (
                              <input
                                type={col.type}
                                placeholder={col.placeholder}
                                className={`${base} ${col.key === 'rollNumber' ? 'font-mono' : ''}`}
                                value={row[col.key]}
                                onChange={e => setCell(row.id, col.key, e.target.value)}
                              />
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

          {/* Add row */}
          <button onClick={addRow}
            className="mt-3 flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors px-2">
            <Plus size={13}/>
            Add another row
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={() => setRows([EMPTY_ROW(), EMPTY_ROW(), EMPTY_ROW()])}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors underline underline-offset-2">
              Reset rows
            </button>
            <span className="text-slate-200">|</span>
            <span className="text-xs text-slate-400">{filledCount} student{filledCount !== 1 ? 's' : ''} ready</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={saving || filledCount === 0}
              className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold rounded-xl disabled:opacity-40 transition-colors shadow-sm shadow-violet-200">
              {saving
                ? <><Spin size="sm" color="white"/>Adding Students…</>
                : <><UsersRound size={14}/>Add {filledCount > 0 ? filledCount : ''} Student{filledCount !== 1 ? 's' : ''}</>}
            </button>
          </div>
        </div>
      </div>
    </Overlay>
  );
};

// ── Bulk Upload Modal (Excel/CSV) ───────────────────────────────────────────────
const BulkUploadModal = ({ onClose, onDone }) => {
  const toast   = useToast();
  const fileRef = useRef(null);
  const [step, setStep]   = useState(0);
  const [file, setFile]   = useState(null);
  const [drag, setDrag]   = useState(false);
  const [vr,   setVr]     = useState(null);
  const [ur,   setUr]     = useState(null);
  const [err,  setErr]    = useState('');
  const [tmpl, setTmpl]   = useState(false);

  const accept = f => {
    if (!f) return;
    const ext = f.name.split('.').pop().toLowerCase();
    if (!['xlsx','xls','csv'].includes(ext)) { setErr('Only .xlsx, .xls, or .csv files.'); return; }
    setFile(f); setErr(''); setVr(null); setStep(0);
  };

  const getTemplate = async () => {
    setTmpl(true);
    try { await collegeAdminStudentAPI.downloadTemplate(); toast.success('Downloaded!', 'Template saved.'); }
    catch(e) { toast.error('Error', e.message); }
    finally { setTmpl(false); }
  };

  const doValidate = async () => {
    setStep(1); setErr('');
    try { const r = await collegeAdminStudentAPI.validateBulkUpload(file); setVr(r.data||r); setStep(2); }
    catch(e) { setErr(e.message||'Validation failed.'); setStep(0); }
  };

  const doUpload = async () => {
    setStep(3); setErr('');
    try { const r = await collegeAdminStudentAPI.bulkUpload(file); setUr(r.data||r); setStep(4); }
    catch(e) { setErr(e.message||'Upload failed.'); setStep(2); }
  };

  const reset = () => { setFile(null); setStep(0); setVr(null); setUr(null); setErr(''); };
  const STEPS = ['Select File', 'Validate', 'Upload'];

  return (
    <Overlay onClose={onClose} size="lg">
      <div className="bg-white rounded-2xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
              <CloudUpload size={16} className="text-white"/>
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Bulk Upload via Excel / CSV</h2>
              <p className="text-xs text-blue-200">Upload up to 500 students at once</p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center text-white transition-colors">
            <X size={14}/>
          </button>
        </div>

        {/* Step pills */}
        <div className="px-6 pt-5 pb-1 flex items-center gap-1 flex-shrink-0">
          {STEPS.map((s,i) => {
            const past   = (step > 1 && i === 0) || (step >= 3 && i === 1) || step === 4;
            const active = (step <= 1 && i === 0) || (step === 2 && i === 1) || (step >= 3 && i === 2);
            return (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full transition-colors
                  ${past ? 'bg-emerald-100 text-emerald-700' : active ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>
                  {past ? <CheckCircle size={11}/> : <span>{i+1}</span>}
                  <span className="hidden sm:block">{s}</span>
                </div>
                {i < 2 && <div className="flex-1 h-px bg-slate-200 mx-1"/>}
              </React.Fragment>
            );
          })}
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* Template strip */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <FileText size={14} className="text-slate-400 flex-shrink-0"/>
            <div className="flex-1">
              <p className="text-xs font-semibold text-slate-600">Download the Excel template</p>
              <p className="text-xs text-slate-400 mt-0.5">Password column is not needed — auto-generated by system</p>
            </div>
            <button onClick={getTemplate} disabled={tmpl}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg disabled:opacity-50 flex-shrink-0 transition-colors">
              {tmpl ? <Spin size="sm" color="white"/> : <Download size={11}/>}
              Template
            </button>
          </div>

          {step <= 1 && (
            <div className="space-y-3">
              <div
                onDragOver={e=>{e.preventDefault();setDrag(true);}}
                onDragLeave={()=>setDrag(false)}
                onDrop={e=>{e.preventDefault();setDrag(false);accept(e.dataTransfer.files[0]);}}
                onClick={()=>fileRef.current?.click()}
                className={`rounded-xl border-2 border-dashed p-10 flex flex-col items-center gap-2 cursor-pointer transition-all
                  ${drag ? 'border-blue-400 bg-blue-50'
                    : file ? 'border-emerald-400 bg-emerald-50'
                    : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50/80'}`}>
                <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
                       onChange={e=>accept(e.target.files[0])}/>
                {file ? (
                  <>
                    <CheckCircle size={32} className="text-emerald-500"/>
                    <p className="text-sm font-bold text-emerald-700">{file.name}</p>
                    <p className="text-xs text-slate-400">{(file.size/1024).toFixed(1)} KB — click to replace</p>
                  </>
                ) : (
                  <>
                    <CloudUpload size={32} className="text-slate-300"/>
                    <p className="text-sm font-semibold text-slate-500">Drop your file here or click to browse</p>
                    <p className="text-xs text-slate-400">.xlsx · .xls · .csv · max 500 rows</p>
                  </>
                )}
              </div>
              {err && (
                <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                  <AlertCircle size={14} className="flex-shrink-0 mt-0.5"/>{err}
                </div>
              )}
              <div className="flex justify-end">
                <button onClick={doValidate} disabled={!file || step===1}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl disabled:opacity-40 transition-colors">
                  {step===1 ? <><Spin size="sm" color="white"/>Validating…</> : <><ClipboardCheck size={15}/>Validate File</>}
                </button>
              </div>
            </div>
          )}

          {step === 2 && vr && (
            <div className="space-y-4">
              <div className={`rounded-xl p-4 border ${vr.canProceed ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center gap-2 mb-3">
                  {vr.canProceed ? <CheckCircle size={15} className="text-emerald-500"/> : <AlertTriangle size={15} className="text-red-500"/>}
                  <p className={`text-sm font-bold ${vr.canProceed ? 'text-emerald-700' : 'text-red-700'}`}>{vr.message}</p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[['Total', vr.totalRows??0, 'slate'], ['Valid', vr.validRows??0, 'emerald'], ['Errors', vr.errorRows??0, 'red']].map(([l,v,c]) => (
                    <div key={l} className="bg-white rounded-lg py-2 border">
                      <div className={`text-xl font-black text-${c}-600`}>{v}</div>
                      <div className="text-xs text-slate-500">{l}</div>
                    </div>
                  ))}
                </div>
              </div>
              {vr.validationErrors?.length > 0 && (
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  <p className="text-xs font-bold text-red-500 uppercase tracking-wide">Errors to fix:</p>
                  {vr.validationErrors.map((e,i) => (
                    <div key={i} className="flex gap-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-1.5 border border-red-100">
                      <X size={10} className="flex-shrink-0 mt-0.5"/>{e}
                    </div>
                  ))}
                </div>
              )}
              {vr.warnings?.map((w,i) => (
                <div key={i} className="flex gap-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-1.5 border border-amber-100">
                  <AlertTriangle size={10} className="flex-shrink-0 mt-0.5"/>{w}
                </div>
              ))}
              {vr.preview?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Preview — first {vr.preview.length} rows:</p>
                  <div className="overflow-x-auto rounded-xl border border-slate-100">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 text-left">
                        <tr>{['Name','Email','Roll No','Branch','Batch','Sem'].map(h=>(
                          <th key={h} className="px-3 py-2 font-semibold text-slate-500">{h}</th>
                        ))}</tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {vr.preview.map((r,i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="px-3 py-2 font-semibold text-slate-800">{r.name}</td>
                            <td className="px-3 py-2 text-slate-500">{r.email}</td>
                            <td className="px-3 py-2 font-mono text-blue-600">{r.rollNumber}</td>
                            <td className="px-3 py-2">{r.branch||'—'}</td>
                            <td className="px-3 py-2">{r.batch||'—'}</td>
                            <td className="px-3 py-2">{r.semester ? `Sem ${r.semester}` : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {err && <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600"><AlertCircle size={14} className="mt-0.5 flex-shrink-0"/>{err}</div>}
              <div className="flex items-center justify-between pt-2">
                <button onClick={reset} className="text-sm text-slate-400 hover:text-slate-600 underline underline-offset-2">← Use different file</button>
                <button onClick={doUpload} disabled={!vr.canProceed}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl disabled:opacity-40 transition-colors">
                  <Upload size={14}/> Upload {vr.validRows} Students
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="py-12 flex flex-col items-center gap-4">
              <Spin size="lg"/>
              <p className="text-sm font-bold text-slate-700">Uploading students…</p>
              <p className="text-xs text-slate-400">Running inside a database transaction — all rows succeed or none do</p>
            </div>
          )}

          {step === 4 && ur && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 flex flex-col items-center text-center gap-2">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center">
                  <CheckCircle size={28} className="text-emerald-500"/>
                </div>
                <p className="text-lg font-black text-emerald-800">Upload Complete!</p>
                <p className="text-sm text-emerald-600">{ur.successCount ?? ur.totalUploaded ?? '?'} students added successfully</p>
              </div>
              {ur.students?.slice(0,5).map((s,i) => (
                <div key={i} className="flex items-center gap-3 text-xs bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-xs">{(s.fullName||'?').charAt(0)}</span>
                  </div>
                  <span className="font-semibold text-slate-800 flex-1 truncate">{s.fullName}</span>
                  <span className="text-slate-400 truncate">{s.email}</span>
                  <span className="font-mono text-blue-600">{s.rollNumber}</span>
                </div>
              ))}
              {(ur.students?.length||0) > 5 && <p className="text-xs text-center text-slate-400">…and {ur.students.length-5} more</p>}
              <div className="flex justify-end">
                <button onClick={() => { onDone?.(); onClose(); }}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors">
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Overlay>
  );
};

// ── Export Modal ───────────────────────────────────────────────────────────────
const ExportModal = ({ onClose }) => {
  const toast = useToast();
  const [filters, setFilters] = useState({ branch:'', batch:'', isPlaced:'', format:'xlsx' });
  const [preview,   setPreview]   = useState(null);
  const [prevLoad,  setPrevLoad]  = useState(false);
  const [exporting, setExporting] = useState(false);

  const setF = (k, v) => setFilters(p => ({...p, [k]:v}));

  const fetchPreview = useCallback(async () => {
    setPrevLoad(true);
    try {
      const p = Object.fromEntries(Object.entries(filters).filter(([k,v]) => v !== '' && k !== 'format'));
      const r = await collegeAdminStudentAPI.getExportPreview(p);
      setPreview(r.data || r);
    } catch(e) { toast.error('Preview error', e.message); }
    finally { setPrevLoad(false); }
  }, [filters.branch, filters.batch, filters.isPlaced]);

  useEffect(() => { fetchPreview(); }, [fetchPreview]);

  const doExport = async () => {
    setExporting(true);
    try {
      await collegeAdminStudentAPI.exportStudents(Object.fromEntries(Object.entries(filters).filter(([,v]) => v !== '')));
      toast.success('Exported','File downloaded!'); onClose();
    } catch(e) { toast.error('Export failed', e.message); }
    finally { setExporting(false); }
  };

  return (
    <Overlay onClose={onClose} size="md">
      <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
              <FileDown size={16} className="text-white"/>
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Export Students</h2>
              <p className="text-xs text-emerald-100">Download filtered student records</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center text-white">
            <X size={14}/>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              {label:'Branch',  k:'branch',   type:'sel', opts:['','CSE','ECE','EEE','MECH','CIVIL','IT','AI/ML','DS','Other'], labels:['All Branches','CSE','ECE','EEE','MECH','CIVIL','IT','AI/ML','DS','Other']},
              {label:'Status',  k:'isPlaced', type:'sel', opts:['','true','false'], labels:['All Students','Placed','Not Placed']},
              {label:'Batch',   k:'batch',    type:'txt', placeholder:'e.g. 2024'},
              {label:'Format',  k:'format',   type:'sel', opts:['xlsx','csv'], labels:['Excel (.xlsx) — 3 sheets','CSV — flat table']},
            ].map(({label,k,type,opts,labels,placeholder}) => (
              <div key={k}>
                <label className="text-xs font-bold text-slate-600 block mb-1.5">{label}</label>
                {type === 'sel' ? (
                  <select value={filters[k]} onChange={e=>setF(k,e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400">
                    {opts.map((o,i) => <option key={o} value={o}>{labels?.[i]||o}</option>)}
                  </select>
                ) : (
                  <input type="text" placeholder={placeholder} value={filters[k]} onChange={e=>setF(k,e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"/>
                )}
              </div>
            ))}
          </div>
          <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 min-h-[4rem]">
            {prevLoad ? (
              <div className="flex justify-center py-2"><Spin size="sm" color="slate"/></div>
            ) : preview ? (
              <div>
                <p className="text-sm font-bold text-slate-700 mb-2">{preview.message}</p>
                {preview.sample?.slice(0,3).map((s,i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-500 py-1 border-b border-slate-100 last:border-0">
                    <span className="font-semibold text-slate-700 truncate">{s.name}</span>
                    <span className="font-mono text-blue-600 flex-shrink-0">{s.rollNumber}</span>
                    <span className="flex-shrink-0">{s.branch||'—'}</span>
                    {s.isPlaced && <Tag variant="green"><UserCheck size={9}/>Placed</Tag>}
                  </div>
                ))}
                {(preview.totalRecords||0) > 3 && <p className="text-xs text-slate-400 mt-1.5">…and {preview.totalRecords-3} more students</p>}
              </div>
            ) : null}
          </div>
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-600">
            <Info size={12} className="flex-shrink-0"/>
            Excel includes 3 sheets: student data · branch summary stats · export metadata
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700">Cancel</button>
          <button onClick={doExport} disabled={exporting || !preview?.totalRecords}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl disabled:opacity-40 transition-colors">
            {exporting ? <><Spin size="sm" color="white"/>Downloading…</> : <><FileDown size={14}/>Export{preview?.totalRecords ? ` (${preview.totalRecords})` : ''}</>}
          </button>
        </div>
      </div>
    </Overlay>
  );
};

// ── Student Row ────────────────────────────────────────────────────────────────
const StudentRow = ({ s, n }) => {
  const si = s.studentInfo || {};
  const initial = (s.fullName || '?').charAt(0).toUpperCase();
  const hue = initial.charCodeAt(0) % 360;
  return (
    <tr className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
      <td className="pl-4 pr-3 py-3 text-xs text-slate-300 font-mono w-10">{n}</td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
               style={{background:`hsl(${hue},60%,55%)`}}>
            {initial}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate leading-tight">{s.fullName||'—'}</p>
            <p className="text-xs text-slate-400 truncate">{s.email}</p>
          </div>
        </div>
      </td>
      <td className="px-3 py-3 font-mono text-xs text-blue-600 whitespace-nowrap">{si.rollNumber||'—'}</td>
      <td className="px-3 py-3">{si.branch ? <Tag variant="blue">{si.branch}</Tag> : <span className="text-slate-300 text-xs">—</span>}</td>
      <td className="px-3 py-3 text-xs text-slate-600 whitespace-nowrap">{si.batch||'—'}</td>
      <td className="px-3 py-3 text-xs text-slate-600">{si.semester ? `Sem ${si.semester}` : '—'}</td>
      <td className="px-3 py-3 text-xs font-bold text-slate-700">{si.cgpa != null ? si.cgpa : '—'}</td>
      <td className="px-3 py-3">
        {si.isPlaced
          ? <Tag variant="green"><UserCheck size={9}/>Placed</Tag>
          : <Tag variant="slate"><UserX size={9}/>Unplaced</Tag>}
      </td>
    </tr>
  );
};

// ── Page ───────────────────────────────────────────────────────────────────────
export default function StudentManagement() {
  const toast = useToast();
  const [students,   setStudents]   = useState([]);
  const [pagination, setPagination] = useState({ total:0, page:1, pages:1 });
  const [loading,    setLoading]    = useState(false);
  const [modal,      setModal]      = useState(null); // 'single' | 'multiple' | 'upload' | 'export'
  const [showFilter, setShowFilter] = useState(false);
  const [page,       setPage]       = useState(1);
  const [filters,    setFilters]    = useState({ search:'', branch:'', batch:'', isPlaced:'' });

  const setF = (k, v) => { setFilters(p => ({...p,[k]:v})); setPage(1); };
  const clearAll = () => { setFilters({ search:'', branch:'', batch:'', isPlaced:'' }); setPage(1); };
  const filterCount = Object.entries(filters).filter(([k,v]) => v && k !== 'search').length;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: PER_PAGE,
        ...Object.fromEntries(Object.entries(filters).filter(([,v]) => v)) };
      const r = await collegeAdminStudentAPI.getStudents(params);
      // Filter out soft-deleted records (isDeleted: true)
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

  return (
    <DashboardLayout title="Students">
      <div className="h-full flex flex-col gap-4 min-h-0">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Student Management</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {pagination.total > 0 ? `${pagination.total} students enrolled` : 'Manage, add, and upload student records'}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={load} disabled={loading}
              className="h-9 px-3 flex items-center gap-1.5 text-sm text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl disabled:opacity-50 transition-colors">
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''}/>
              <span className="hidden sm:block">Refresh</span>
            </button>
            <button onClick={() => setModal('export')}
              className="h-9 px-3 flex items-center gap-1.5 text-sm font-semibold text-emerald-700 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors">
              <FileDown size={13}/> Export
            </button>

            {/* Divider */}
            <div className="h-5 w-px bg-slate-200 hidden sm:block"/>

            {/* Add buttons */}
            <button onClick={() => setModal('single')}
              className="h-9 px-3 flex items-center gap-1.5 text-sm font-semibold text-blue-700 border border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors">
              <UserPlus size={14}/> Add Student
            </button>
            <button onClick={() => setModal('multiple')}
              className="h-9 px-3 flex items-center gap-1.5 text-sm font-semibold text-violet-700 border border-violet-200 bg-violet-50 hover:bg-violet-100 rounded-xl transition-colors">
              <UsersRound size={14}/> Add Multiple
            </button>
            <button onClick={() => setModal('upload')}
              className="h-9 px-4 flex items-center gap-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-200 transition-colors">
              <CloudUpload size={14}/> Bulk Upload
            </button>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Users,     label: 'Total',     val: pagination.total, clr: 'bg-blue-500'    },
            { icon: UserCheck, label: 'Placed',    val: placed,           clr: 'bg-emerald-500' },
            { icon: Layers,    label: 'This Page', val: students.length,  clr: 'bg-amber-500'   },
            { icon: TrendingUp,label: 'Pages',     val: pagination.pages, clr: 'bg-slate-500'   },
          ].map(({icon:Icon,label,val,clr}) => (
            <div key={label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
              <div className={`w-9 h-9 ${clr} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <Icon size={16} className="text-white"/>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">{label}</p>
                <p className="text-xl font-black text-slate-800 leading-none mt-0.5">{val ?? '—'}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Search + filter bar ── */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
            <input type="text" placeholder="Search name, email or roll number…"
              value={filters.search} onChange={e => setF('search', e.target.value)}
              className="w-full h-9 pl-9 pr-8 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 transition"/>
            {filters.search && (
              <button onClick={() => setF('search', '')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                <X size={12}/>
              </button>
            )}
          </div>
          <button onClick={() => setShowFilter(p => !p)}
            className={`h-9 px-3 flex items-center gap-1.5 text-sm border rounded-xl transition-colors
              ${showFilter || filterCount > 0 ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            <SlidersHorizontal size={13}/>
            Filters
            {filterCount > 0 && (
              <span className="w-4 h-4 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-bold">{filterCount}</span>
            )}
          </button>
          {filterCount > 0 && (
            <button onClick={clearAll} className="h-9 px-3 flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-700 transition-colors">
              <X size={11}/> Clear
            </button>
          )}
        </div>

        {/* ── Filter panel ── */}
        {showFilter && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-wrap items-end gap-4">
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1.5">Branch</label>
              <select value={filters.branch} onChange={e => setF('branch', e.target.value)}
                className="text-sm border border-slate-200 bg-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400">
                <option value="">All Branches</option>
                {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1.5">Batch Year</label>
              <input type="text" placeholder="e.g. 2024" value={filters.batch} onChange={e => setF('batch', e.target.value)}
                className="text-sm border border-slate-200 bg-white rounded-lg px-3 py-2 w-28 focus:outline-none focus:ring-2 focus:ring-blue-400"/>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1.5">Placement</label>
              <select value={filters.isPlaced} onChange={e => setF('isPlaced', e.target.value)}
                className="text-sm border border-slate-200 bg-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400">
                <option value="">All</option>
                <option value="true">Placed</option>
                <option value="false">Not Placed</option>
              </select>
            </div>
          </div>
        )}

        {/* ── Table ── */}
        <div className="flex-1 min-h-0 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <Spin size="lg"/>
              <p className="text-sm text-slate-400">Loading students…</p>
            </div>
          ) : students.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 py-16">
              <div className="w-20 h-20 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center">
                <GraduationCap size={32} className="text-slate-300"/>
              </div>
              <div className="text-center">
                <p className="text-base font-bold text-slate-400">No students found</p>
                <p className="text-sm text-slate-300 mt-1">
                  {Object.values(filters).some(Boolean)
                    ? 'Try clearing your search or filters'
                    : 'Add students using the buttons above'}
                </p>
              </div>
              {!Object.values(filters).some(Boolean) && (
                <div className="flex items-center gap-2 flex-wrap justify-center">
                  <button onClick={() => setModal('single')}
                    className="flex items-center gap-2 px-4 py-2 border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-semibold rounded-xl transition-colors">
                    <UserPlus size={14}/> Add Single Student
                  </button>
                  <button onClick={() => setModal('upload')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors">
                    <CloudUpload size={14}/> Bulk Upload
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-auto">
                <table className="w-full">
                  <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-100">
                    <tr>
                      {['#','Student','Roll No','Branch','Batch','Sem','CGPA','Placement'].map(h => (
                        <th key={h} className={`py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap ${h==='#'?'pl-4 pr-3 w-10':'px-3'}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s,i) => (
                      <StudentRow key={s._id} s={s} n={(page-1)*PER_PAGE + i + 1}/>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/60 flex-shrink-0">
                <p className="text-xs text-slate-500">
                  Showing <b className="text-slate-700">{(page-1)*PER_PAGE+1}–{Math.min(page*PER_PAGE, pagination.total)}</b> of <b className="text-slate-700">{pagination.total}</b>
                </p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}
                    className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    <ChevronLeft size={13}/>
                  </button>
                  <span className="text-xs font-semibold text-slate-600 px-1">
                    {page} / {pagination.pages}
                  </span>
                  <button onClick={() => setPage(p => Math.min(pagination.pages, p+1))} disabled={page===pagination.pages}
                    className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    <ChevronRight size={13}/>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {modal==='single'   && <AddSingleModal   onClose={()=>setModal(null)} onDone={() => { setPage(1); load(); }}/>}
      {modal==='multiple' && <AddMultipleModal onClose={()=>setModal(null)} onDone={() => { setPage(1); load(); }}/>}
      {modal==='upload'   && <BulkUploadModal  onClose={()=>setModal(null)} onDone={() => { setPage(1); load(); }}/>}
      {modal==='export'   && <ExportModal      onClose={()=>setModal(null)}/>}
    </DashboardLayout>
  );
}