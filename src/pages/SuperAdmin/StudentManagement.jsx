// src/pages/SuperAdmin/StudentManagement.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useToast } from '../../context/ToastContext';
import { superAdminStudentAPI } from '../../api/studentAPI';
import {
  GraduationCap, CloudUpload, FileDown, Download, RefreshCw, X,
  CheckCircle, AlertTriangle, AlertCircle, FileText, Info,
  ClipboardCheck, Upload, Building2, Users, ChevronRight, Layers,
  UserPlus, UsersRound, KeyRound, Trash2, Plus, Mail, Hash,
  BookOpen, Star, Calendar, Phone,
} from 'lucide-react';

const BRANCHES  = ['CSE','ECE','EEE','MECH','CIVIL','IT','AI/ML','DS','Other'];
const SEMESTERS = ['1','2','3','4','5','6','7','8'];

const Spin = ({ size='md', color='blue' }) => {
  const sz = { sm:'w-4 h-4', md:'w-6 h-6', lg:'w-10 h-10' }[size];
  const cl = { blue:'border-blue-500', white:'border-white', indigo:'border-indigo-500', slate:'border-slate-400' }[color];
  return <div className={`${sz} ${cl} border-2 border-t-transparent rounded-full animate-spin flex-shrink-0`}/>;
};

const Overlay = ({ children, onClose, size='md' }) => {
  const w = { sm:'max-w-md', md:'max-w-lg', lg:'max-w-2xl', xl:'max-w-4xl' }[size];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"/>
      <div className={`relative w-full ${w} max-h-[92vh] flex flex-col`} onClick={e=>e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};

const inputCls = (hasIcon = true) =>
  `w-full text-sm border border-slate-200 rounded-xl ${hasIcon ? 'pl-9' : 'px-3'} pr-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition`;

const selectCls = (hasIcon = true) =>
  `w-full text-sm border border-slate-200 rounded-xl ${hasIcon ? 'pl-9' : 'px-3'} pr-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition appearance-none`;

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

// ── SA Add Single Modal ────────────────────────────────────────────────────────
const EMPTY_FORM = {
  fullName:'', email:'', rollNumber:'', branch:'',
  semester:'', cgpa:'', batch:'', phone:'', collegeId:'',
};

const SAAddSingleModal = ({ colleges, onClose, onDone }) => {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const setF = (k, v) => { setForm(p => ({...p,[k]:v})); if (errors[k]) setErrors(p => ({...p,[k]:''})); };

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Required';
    if (!form.email.trim()) e.email = 'Required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
    if (!form.rollNumber.trim()) e.rollNumber = 'Required';
    if (!form.collegeId) e.collegeId = 'Select a college';
    if (form.cgpa && (isNaN(form.cgpa) || +form.cgpa < 0 || +form.cgpa > 10)) e.cgpa = '0.0 – 10.0';
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
        collegeId: form.collegeId,
        ...(form.branch   && { branch: form.branch }),
        ...(form.semester && { semester: parseInt(form.semester) }),
        ...(form.cgpa     && { cgpa: parseFloat(form.cgpa) }),
        ...(form.batch    && { batch: form.batch.trim() }),
        ...(form.phone    && { phone: form.phone.trim() }),
      };
      await superAdminStudentAPI.addStudent(payload);
      toast.success('Student Added!', `${form.fullName} registered with auto-generated password.`);
      onDone?.();
      onClose();
    } catch(err) {
      toast.error('Failed', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Overlay onClose={onClose} size="md">
      <div className="bg-white rounded-2xl overflow-hidden flex flex-col max-h-[92vh] shadow-2xl">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <UserPlus size={18} className="text-white"/>
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Add Single Student</h2>
              <p className="text-xs text-indigo-200">Password auto-generated — no need to set one</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center text-white">
            <X size={14}/>
          </button>
        </div>

        <div className="mx-6 mt-5 flex items-center gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl flex-shrink-0">
          <KeyRound size={13} className="text-amber-600 flex-shrink-0"/>
          <p className="text-xs text-amber-700">
            <strong>Auto-generated password</strong> — student can reset on first login.
          </p>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="space-y-5">
            {/* College */}
            <Field label="College" required icon={Building2}>
              <select
                className={`${selectCls()} ${errors.collegeId ? 'border-red-400' : ''}`}
                value={form.collegeId}
                onChange={e => setF('collegeId', e.target.value)}>
                <option value="">Select college</option>
                {colleges.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
              {errors.collegeId && <p className="text-xs text-red-500 mt-1">{errors.collegeId}</p>}
            </Field>

            <div className="h-px bg-slate-100"/>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Full Name" required icon={UserPlus}>
                <input className={`${inputCls()} ${errors.fullName ? 'border-red-400' : ''}`}
                  placeholder="e.g. Ravi Kumar" value={form.fullName} onChange={e=>setF('fullName',e.target.value)}/>
                {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
              </Field>
              <Field label="Email" required icon={Mail}>
                <input type="email" className={`${inputCls()} ${errors.email ? 'border-red-400' : ''}`}
                  placeholder="student@college.edu" value={form.email} onChange={e=>setF('email',e.target.value)}/>
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Roll Number" required icon={Hash} hint="Unique within selected college">
                <input className={`${inputCls()} font-mono ${errors.rollNumber ? 'border-red-400' : ''}`}
                  placeholder="e.g. 21CSE001" value={form.rollNumber} onChange={e=>setF('rollNumber',e.target.value)}/>
                {errors.rollNumber && <p className="text-xs text-red-500 mt-1">{errors.rollNumber}</p>}
              </Field>
              <Field label="Phone" icon={Phone}>
                <input type="tel" className={inputCls()}
                  placeholder="10-digit mobile" value={form.phone} onChange={e=>setF('phone',e.target.value)}/>
              </Field>
            </div>

            <div className="h-px bg-slate-100"/>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Department" icon={BookOpen}>
                <select className={selectCls()} value={form.branch} onChange={e=>setF('branch',e.target.value)}>
                  <option value="">Select</option>
                  {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </Field>
              <Field label="Semester" icon={Layers}>
                <select className={selectCls()} value={form.semester} onChange={e=>setF('semester',e.target.value)}>
                  <option value="">Select</option>
                  {SEMESTERS.map(s => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="CGPA" icon={Star} hint="0.0 – 10.0">
                <input type="number" step="0.01" min="0" max="10"
                  className={`${inputCls()} ${errors.cgpa ? 'border-red-400' : ''}`}
                  placeholder="8.50" value={form.cgpa} onChange={e=>setF('cgpa',e.target.value)}/>
                {errors.cgpa && <p className="text-xs text-red-500 mt-1">{errors.cgpa}</p>}
              </Field>
              <Field label="Batch Year" icon={Calendar}>
                <input type="text" className={inputCls()} placeholder="e.g. 2026"
                  value={form.batch} onChange={e=>setF('batch',e.target.value)}/>
              </Field>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700">Cancel</button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl disabled:opacity-50 transition-colors shadow-sm shadow-indigo-200">
            {saving ? <><Spin size="sm" color="white"/>Adding…</> : <><UserPlus size={14}/>Add Student</>}
          </button>
        </div>
      </div>
    </Overlay>
  );
};

// ── SA Add Multiple Modal ──────────────────────────────────────────────────────
const EMPTY_ROW = () => ({
  id: Math.random().toString(36).slice(2),
  fullName:'', email:'', rollNumber:'', branch:'',
  semester:'', cgpa:'', batch:'',
});

const SAAddMultipleModal = ({ colleges, onClose, onDone }) => {
  const toast = useToast();
  const [rows, setRows] = useState([EMPTY_ROW(), EMPTY_ROW(), EMPTY_ROW()]);
  const [defaultCollegeId, setDefaultCollegeId] = useState('');
  const [saving, setSaving] = useState(false);
  const [rowErrors, setRowErrors] = useState({});
  const [result, setResult] = useState(null);

  const addRow = () => setRows(p => [...p, EMPTY_ROW()]);
  const removeRow = (id) => setRows(p => p.filter(r => r.id !== id));
  const setCell = (id, field, value) => {
    setRows(p => p.map(r => r.id === id ? {...r, [field]: value} : r));
    setRowErrors(p => { const n={...p}; if(n[id]) delete n[id][field]; return n; });
  };

  const validate = () => {
    const errs = {};
    const emails = new Set(); const rolls = new Set();
    const filled = rows.filter(r => r.fullName.trim() || r.email.trim() || r.rollNumber.trim());
    if (!filled.length) { toast.error('No data','Fill at least one row.'); return null; }
    if (!defaultCollegeId) { toast.error('College required','Select a default college.'); return null; }
    filled.forEach(r => {
      const e = {};
      if (!r.fullName.trim())   e.fullName = 'Required';
      if (!r.email.trim())      e.email = 'Required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email)) e.email = 'Invalid';
      else if (emails.has(r.email.toLowerCase())) e.email = 'Duplicate';
      else emails.add(r.email.toLowerCase());
      if (!r.rollNumber.trim()) e.rollNumber = 'Required';
      else if (rolls.has(r.rollNumber.toLowerCase())) e.rollNumber = 'Duplicate';
      else rolls.add(r.rollNumber.toLowerCase());
      if (r.cgpa && (isNaN(r.cgpa)||+r.cgpa<0||+r.cgpa>10)) e.cgpa = '0–10';
      if (Object.keys(e).length) errs[r.id] = e;
    });
    return { errs, filled };
  };

  const handleSubmit = async () => {
    const v = validate();
    if (!v) return;
    if (Object.keys(v.errs).length) { setRowErrors(v.errs); toast.error('Fix errors','Check highlighted cells.'); return; }
    setSaving(true);
    try {
      const students = v.filled.map(r => ({
        fullName: r.fullName.trim(),
        email: r.email.trim().toLowerCase(),
        rollNumber: r.rollNumber.trim(),
        ...(r.branch   && { branch: r.branch }),
        ...(r.semester && { semester: parseInt(r.semester) }),
        ...(r.cgpa     && { cgpa: parseFloat(r.cgpa) }),
        ...(r.batch    && { batch: r.batch.trim() }),
      }));
      const res = await superAdminStudentAPI.addStudents(students, defaultCollegeId);
      setResult({ count: res.successCount || res.totalCreated || students.length, students: res.students || students });
    } catch(err) {
      toast.error('Failed', err.message);
    } finally {
      setSaving(false);
    }
  };

  const filledCount = rows.filter(r => r.fullName.trim() || r.email.trim() || r.rollNumber.trim()).length;

  if (result) {
    return (
      <Overlay onClose={onClose} size="md">
        <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <CheckCircle size={18} className="text-white"/>
            </div>
            <h2 className="text-base font-bold text-white">Students Added</h2>
          </div>
          <div className="p-8 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center">
              <UsersRound size={30} className="text-emerald-600"/>
            </div>
            <div>
              <p className="text-2xl font-black text-slate-800">{result.count}</p>
              <p className="text-sm text-slate-500 mt-0.5">students created</p>
            </div>
            <p className="text-xs text-slate-400 bg-slate-50 rounded-xl p-3 border border-slate-100">
              Auto-generated passwords assigned. Students can reset on first login.
            </p>
          </div>
          <div className="flex justify-end px-6 pb-6">
            <button onClick={() => { onDone?.(); onClose(); }}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors">
              Done
            </button>
          </div>
        </div>
      </Overlay>
    );
  }

  const cols = [
    { key:'fullName',   label:'Full Name',  required:true,  width:'w-36', placeholder:'Ravi Kumar',   type:'text' },
    { key:'email',      label:'Email',       required:true,  width:'w-44', placeholder:'email@edu.in', type:'email' },
    { key:'rollNumber', label:'Roll No',     required:true,  width:'w-28', placeholder:'21CSE001',     type:'text' },
    { key:'branch',     label:'Branch',      required:false, width:'w-24', type:'select', options:BRANCHES },
    { key:'semester',   label:'Sem',         required:false, width:'w-20', type:'select', options:SEMESTERS },
    { key:'cgpa',       label:'CGPA',        required:false, width:'w-20', placeholder:'8.50',         type:'number' },
    { key:'batch',      label:'Batch',       required:false, width:'w-20', placeholder:'2026',         type:'text' },
  ];

  return (
    <Overlay onClose={onClose} size="xl">
      <div className="bg-white rounded-2xl overflow-hidden flex flex-col max-h-[92vh] shadow-2xl">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <UsersRound size={18} className="text-white"/>
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Add Multiple Students</h2>
              <p className="text-xs text-indigo-200">Passwords auto-generated for all students</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center text-white">
            <X size={14}/>
          </button>
        </div>

        {/* College selector */}
        <div className="px-6 pt-4 flex-shrink-0">
          <label className="text-xs font-bold text-slate-700 block mb-1.5">
            Default College <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Building2 size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
            <select value={defaultCollegeId} onChange={e=>setDefaultCollegeId(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 appearance-none">
              <option value="">Select college for all rows</option>
              {colleges.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        {/* Info strip */}
        <div className="mx-6 mt-3 flex items-center gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl flex-shrink-0">
          <KeyRound size={13} className="text-amber-600 flex-shrink-0"/>
          <p className="text-xs text-amber-700 flex-1">
            <strong>Auto-generated passwords</strong>. Fields marked <span className="text-red-500 font-bold">*</span> are required.
          </p>
          <span className="text-xs font-bold text-amber-600">{filledCount} filled</span>
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
                      <td className="py-1.5 px-3 text-slate-300 font-mono">{idx+1}</td>
                      {cols.map(col => {
                        const err = rowErrors[row.id]?.[col.key];
                        const base = `w-full text-xs border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400 transition ${
                          err ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white focus:border-indigo-400'
                        }`;
                        return (
                          <td key={col.key} className="py-1.5 px-2">
                            {col.type === 'select' ? (
                              <select className={`${base} appearance-none`} value={row[col.key]} onChange={e=>setCell(row.id,col.key,e.target.value)}>
                                <option value="">—</option>
                                {col.options?.map(o => <option key={o} value={o}>{col.key==='semester'?`Sem ${o}`:o}</option>)}
                              </select>
                            ) : (
                              <input type={col.type} placeholder={col.placeholder}
                                className={`${base} ${col.key==='rollNumber'?'font-mono':''}`}
                                value={row[col.key]} onChange={e=>setCell(row.id,col.key,e.target.value)}/>
                            )}
                            {err && <p className="text-red-500 mt-0.5 text-xs">{err}</p>}
                          </td>
                        );
                      })}
                      <td className="py-1.5 px-2">
                        {rows.length > 1 && (
                          <button onClick={()=>removeRow(row.id)}
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
            className="mt-3 flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors px-2">
            <Plus size={13}/>Add another row
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={()=>setRows([EMPTY_ROW(),EMPTY_ROW(),EMPTY_ROW()])}
              className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2">Reset rows</button>
            <span className="text-slate-200">|</span>
            <span className="text-xs text-slate-400">{filledCount} student{filledCount!==1?'s':''} ready</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700">Cancel</button>
            <button onClick={handleSubmit} disabled={saving||filledCount===0}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl disabled:opacity-40 transition-colors shadow-sm shadow-indigo-200">
              {saving ? <><Spin size="sm" color="white"/>Adding…</> : <><UsersRound size={14}/>Add {filledCount>0?filledCount:''} Students</>}
            </button>
          </div>
        </div>
      </div>
    </Overlay>
  );
};

// ── SA Bulk Upload ─────────────────────────────────────────────────────────────
const SABulkModal = ({ colleges, onClose }) => {
  const toast   = useToast();
  const fileRef = useRef(null);
  const [step, setStep] = useState(0);
  const [file, setFile] = useState(null);
  const [cid,  setCid]  = useState('');
  const [drag, setDrag] = useState(false);
  const [vr,   setVr]   = useState(null);
  const [ur,   setUr]   = useState(null);
  const [err,  setErr]  = useState('');
  const [tmpl, setTmpl] = useState(false);

  const accept = f => {
    if (!f) return;
    const ext = f.name.split('.').pop().toLowerCase();
    if (!['xlsx','xls','csv'].includes(ext)) { setErr('Only .xlsx, .xls, .csv allowed.'); return; }
    setFile(f); setErr(''); setVr(null); setStep(0);
  };

  const getTemplate = async () => {
    setTmpl(true);
    try { await superAdminStudentAPI.downloadTemplate(); toast.success('Downloaded!','Template saved.'); }
    catch(e) { toast.error('Error', e.message); }
    finally { setTmpl(false); }
  };

  const doValidate = async () => {
    if (!cid) { setErr('Please select a default college first.'); return; }
    setStep(1); setErr('');
    try { const r = await superAdminStudentAPI.validateBulkUpload(file, cid||null); setVr(r.data||r); setStep(2); }
    catch(e) { setErr(e.message||'Validation failed.'); setStep(0); }
  };

  const doUpload = async () => {
    setStep(3); setErr('');
    try { const r = await superAdminStudentAPI.bulkUpload(file, cid||null); setUr(r.data||r); setStep(4); }
    catch(e) { setErr(e.message||'Upload failed.'); setStep(2); }
  };

  const reset = () => { setFile(null); setStep(0); setVr(null); setUr(null); setErr(''); };
  const STEPS = ['Select File','Validate','Upload'];

  return (
    <Overlay onClose={onClose} size="lg">
      <div className="bg-white rounded-2xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
              <CloudUpload size={16} className="text-white"/>
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Bulk Upload via Excel / CSV</h2>
              <p className="text-xs text-indigo-200">Cross-college upload · max 500/file</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center text-white"><X size={14}/></button>
        </div>

        {/* Step pills */}
        <div className="px-6 pt-4 pb-1 flex items-center gap-1 flex-shrink-0">
          {STEPS.map((s,i) => {
            const past   = (step>1&&i===0)||(step>=3&&i===1)||step===4;
            const active = (step<=1&&i===0)||(step===2&&i===1)||(step>=3&&i===2);
            return (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full
                  ${past?'bg-emerald-100 text-emerald-700':active?'bg-indigo-100 text-indigo-700':'bg-slate-100 text-slate-400'}`}>
                  {past?<CheckCircle size={11}/>:<span>{i+1}</span>}
                  <span className="hidden sm:block">{s}</span>
                </div>
                {i<2&&<div className="flex-1 h-px bg-slate-200 mx-1"/>}
              </React.Fragment>
            );
          })}
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* Template */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <FileText size={13} className="text-slate-400 flex-shrink-0"/>
            <div className="flex-1">
              <p className="text-xs font-semibold text-slate-600">Download the Excel template</p>
              <p className="text-xs text-slate-400 mt-0.5">Set a default college below</p>
            </div>
            <button onClick={getTemplate} disabled={tmpl}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg disabled:opacity-50 flex-shrink-0">
              {tmpl?<Spin size="sm" color="white"/>:<Download size={11}/>} Template
            </button>
          </div>

          {/* Default college */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Default College <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Building2 size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
              <select value={cid} onChange={e=>setCid(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 appearance-none">
                <option value="">Select college for all uploaded rows</option>
                {colleges.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          {/* File picker */}
          {step <= 1 && (
            <div className="space-y-3">
              <div
                onDragOver={e=>{e.preventDefault();setDrag(true);}}
                onDragLeave={()=>setDrag(false)}
                onDrop={e=>{e.preventDefault();setDrag(false);accept(e.dataTransfer.files[0]);}}
                onClick={()=>fileRef.current?.click()}
                className={`rounded-xl border-2 border-dashed p-10 flex flex-col items-center gap-2 cursor-pointer transition-all
                  ${drag?'border-indigo-400 bg-indigo-50':file?'border-emerald-400 bg-emerald-50':'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'}`}>
                <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e=>accept(e.target.files[0])}/>
                {file ? (
                  <><CheckCircle size={32} className="text-emerald-500"/><p className="text-sm font-bold text-emerald-700">{file.name}</p><p className="text-xs text-slate-400">{(file.size/1024).toFixed(1)} KB</p></>
                ) : (
                  <><CloudUpload size={32} className="text-slate-300"/><p className="text-sm font-semibold text-slate-500">Drop file or click to browse</p><p className="text-xs text-slate-400">.xlsx · .xls · .csv · max 500 rows</p></>
                )}
              </div>
              {err && <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600"><AlertCircle size={14} className="mt-0.5 flex-shrink-0"/>{err}</div>}
              <div className="flex justify-end">
                <button onClick={doValidate} disabled={!file||!cid||step===1}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl disabled:opacity-40 transition-colors">
                  {step===1?<><Spin size="sm" color="white"/>Validating…</>:<><ClipboardCheck size={15}/>Validate File</>}
                </button>
              </div>
            </div>
          )}

          {step===2 && vr && (
            <div className="space-y-4">
              <div className={`rounded-xl p-4 border ${vr.canProceed?'bg-emerald-50 border-emerald-200':'bg-red-50 border-red-200'}`}>
                <div className="flex items-center gap-2 mb-3">
                  {vr.canProceed?<CheckCircle size={15} className="text-emerald-500"/>:<AlertTriangle size={15} className="text-red-500"/>}
                  <p className={`text-sm font-bold ${vr.canProceed?'text-emerald-700':'text-red-700'}`}>{vr.message}</p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[['Total',vr.totalRows??0,'slate'],['Valid',vr.validRows??0,'emerald'],['Errors',vr.errorRows??0,'red']].map(([l,v,c]) => (
                    <div key={l} className="bg-white rounded-lg py-2 border">
                      <div className={`text-xl font-black text-${c}-600`}>{v}</div>
                      <div className="text-xs text-slate-500">{l}</div>
                    </div>
                  ))}
                </div>
              </div>
              {vr.validationErrors?.length>0 && (
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {vr.validationErrors.map((e,i) => (
                    <div key={i} className="flex gap-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-1.5 border border-red-100"><X size={10} className="flex-shrink-0 mt-0.5"/>{e}</div>
                  ))}
                </div>
              )}
              {vr.preview?.length>0 && (
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 text-left"><tr>{['Name','Email','Roll No','Branch','Batch'].map(h=><th key={h} className="px-3 py-2 font-semibold text-slate-500">{h}</th>)}</tr></thead>
                    <tbody className="divide-y divide-slate-50">
                      {vr.preview.map((r,i) => (
                        <tr key={i} className="hover:bg-slate-50"><td className="px-3 py-2 font-semibold">{r.name}</td><td className="px-3 py-2 text-slate-500">{r.email}</td><td className="px-3 py-2 font-mono text-indigo-600">{r.rollNumber}</td><td className="px-3 py-2">{r.branch||'—'}</td><td className="px-3 py-2">{r.batch||'—'}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {err && <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600"><AlertCircle size={14} className="mt-0.5 flex-shrink-0"/>{err}</div>}
              <div className="flex items-center justify-between pt-2">
                <button onClick={reset} className="text-sm text-slate-400 hover:text-slate-600 underline underline-offset-2">← Different file</button>
                <button onClick={doUpload} disabled={!vr.canProceed}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl disabled:opacity-40 transition-colors">
                  <Upload size={14}/> Upload {vr.validRows} Students
                </button>
              </div>
            </div>
          )}

          {step===3 && <div className="py-12 flex flex-col items-center gap-4"><Spin size="lg" color="indigo"/><p className="text-sm font-bold text-slate-700">Uploading…</p><p className="text-xs text-slate-400">Database transaction — all succeed or all rollback</p></div>}

          {step===4 && ur && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 flex flex-col items-center gap-2">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center">
                  <CheckCircle size={28} className="text-emerald-500"/>
                </div>
                <p className="text-lg font-black text-emerald-800">Upload Complete!</p>
                <p className="text-sm text-emerald-600">{ur.successCount??ur.totalUploaded??'?'} students created</p>
              </div>
              <div className="flex justify-end">
                <button onClick={onClose} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors">Done</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Overlay>
  );
};

// ── SA Export Modal ────────────────────────────────────────────────────────────
const SAExportModal = ({ colleges, onClose }) => {
  const toast = useToast();
  const [f, setF_]     = useState({ collegeId:'', branch:'', batch:'', isPlaced:'', format:'xlsx' });
  const setF = (k,v)   => setF_(p => ({...p,[k]:v}));
  const [preview,   setPreview]   = useState(null);
  const [prevLoad,  setPrevLoad]  = useState(false);
  const [exporting, setExporting] = useState(false);

  const fetchPreview = useCallback(async () => {
    setPrevLoad(true);
    try {
      const p = Object.fromEntries(Object.entries(f).filter(([k,v]) => v && k !== 'format'));
      p.role = 'student'; // Add role: 'student' here to filter out candidates
      const r = await superAdminStudentAPI.getExportPreview(p);
      setPreview(r.data||r);
    } catch(e) { toast.error('Preview error', e.message); }
    finally { setPrevLoad(false); }
  }, [f.collegeId, f.branch, f.batch, f.isPlaced]);

  useEffect(() => { fetchPreview(); }, [fetchPreview]);

  const doExport = async () => {
    setExporting(true);
    try {
      const payload = Object.fromEntries(Object.entries(f).filter(([,v]) => v));
      payload.role = 'student'; // Add role: 'student' here to filter out candidates
      await superAdminStudentAPI.exportStudents(payload);
      toast.success('Exported','File downloaded!'); onClose();
    } catch(e) { toast.error('Export failed', e.message); }
    finally { setExporting(false); }
  };

  return (
    <Overlay onClose={onClose} size="md">
      <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center"><FileDown size={16} className="text-white"/></div>
            <div><h2 className="text-base font-bold text-white">Export Students</h2><p className="text-xs text-emerald-100">All colleges or filter by one</p></div>
          </div>
          <button onClick={onClose} className="w-7 h-7 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center text-white"><X size={14}/></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-bold text-slate-600 block mb-1.5">College</label>
              <div className="relative">
                <Building2 size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                <select value={f.collegeId} onChange={e=>setF('collegeId',e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl pl-9 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 appearance-none">
                  <option value="">All Colleges</option>
                  {colleges.map(c=><option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            {[
              {label:'Branch',  k:'branch',   opts:['','CSE','ECE','EEE','MECH','CIVIL','IT','AI/ML','DS','Other'], lbls:['All Branches','CSE','ECE','EEE','MECH','CIVIL','IT','AI/ML','DS','Other']},
              {label:'Status',  k:'isPlaced', opts:['','true','false'], lbls:['All','Placed','Not Placed']},
              {label:'Batch',   k:'batch',    txt:true, placeholder:'e.g. 2024'},
              {label:'Format',  k:'format',   opts:['xlsx','csv'], lbls:['Excel (.xlsx)','CSV']},
            ].map(({label,k,opts,lbls,txt,placeholder}) => (
              <div key={k}>
                <label className="text-xs font-bold text-slate-600 block mb-1.5">{label}</label>
                {txt ? (
                  <input type="text" placeholder={placeholder} value={f[k]} onChange={e=>setF(k,e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-400"/>
                ) : (
                  <select value={f[k]} onChange={e=>setF(k,e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400">
                    {opts.map((o,i) => <option key={o} value={o}>{lbls?.[i]||o}</option>)}
                  </select>
                )}
              </div>
            ))}
          </div>
          <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 min-h-14">
            {prevLoad ? <div className="flex justify-center"><Spin size="sm" color="slate"/></div>
              : preview && (
              <div>
                <p className="text-sm font-bold text-slate-700 mb-2">{preview.message}</p>
                {preview.sample?.slice(0,3).map((s,i) => (
                  <div key={i} className="text-xs text-slate-500 py-1 border-b border-slate-100 last:border-0 flex items-center gap-2">
                    <span className="font-semibold text-slate-700">{s.name}</span>
                    <span className="font-mono text-blue-600">{s.rollNumber}</span>
                    <span>{s.branch||'—'}</span>
                    {s.college && <span className="text-slate-400 truncate">· {s.college}</span>}
                  </div>
                ))}
                {(preview.totalRecords||0)>3 && <p className="text-xs text-slate-400 mt-1">…and {preview.totalRecords-3} more</p>}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700">Cancel</button>
          <button onClick={doExport} disabled={exporting||!preview?.totalRecords}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl disabled:opacity-40 transition-colors">
            {exporting?<><Spin size="sm" color="white"/>Downloading…</>:<><FileDown size={14}/>Export{preview?.totalRecords?` (${preview.totalRecords})`:''}</>}
          </button>
        </div>
      </div>
    </Overlay>
  );
};

// ── Page ───────────────────────────────────────────────────────────────────────
export default function SuperAdminStudentManagement() {
  const toast = useToast();
  const [colleges, setColleges] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [modal,    setModal]    = useState(null); // 'single'|'multiple'|'upload'|'export'

  const loadColleges = useCallback(async () => {
    setLoading(true);
    try {
      const r = await superAdminStudentAPI.getColleges();
      setColleges(r?.data?.colleges || r?.colleges || r?.data || []);
    } catch(e) { toast.error('Error', e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadColleges(); }, [loadColleges]);

  return (
    <DashboardLayout title="Students">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Student Management</h1>
            <p className="text-sm text-slate-400 mt-0.5">Global student operations across all colleges</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={loadColleges} disabled={loading}
              className="h-9 px-3 flex items-center gap-1.5 text-sm text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl disabled:opacity-50 transition-colors">
              <RefreshCw size={13} className={loading?'animate-spin':''}/> Refresh
            </button>
            <button onClick={()=>setModal('export')}
              className="h-9 px-3 flex items-center gap-1.5 text-sm font-semibold text-emerald-700 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors">
              <FileDown size={13}/> Export
            </button>
            <div className="h-5 w-px bg-slate-200 hidden sm:block"/>
            <button onClick={()=>setModal('single')}
              className="h-9 px-3 flex items-center gap-1.5 text-sm font-semibold text-indigo-700 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors">
              <UserPlus size={14}/> Add Student
            </button>
            <button onClick={()=>setModal('multiple')}
              className="h-9 px-3 flex items-center gap-1.5 text-sm font-semibold text-violet-700 border border-violet-200 bg-violet-50 hover:bg-violet-100 rounded-xl transition-colors">
              <UsersRound size={14}/> Add Multiple
            </button>
            <button onClick={()=>setModal('upload')}
              className="h-9 px-4 flex items-center gap-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm shadow-indigo-200 transition-colors">
              <CloudUpload size={14}/> Bulk Upload
            </button>
          </div>
        </div>

        {/* Colleges banner */}
        <div className="flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
          <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Building2 size={16} className="text-slate-500"/>
          </div>
          {loading ? (
            <div className="flex items-center gap-2"><Spin size="sm" color="slate"/><span className="text-sm text-slate-500">Loading colleges…</span></div>
          ) : (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800">{colleges.length} College{colleges.length!==1?'s':''} Available</p>
              <p className="text-xs text-slate-400 mt-0.5 truncate">
                {colleges.length > 0 ? colleges.slice(0,3).map(c=>c.name).join(' · ') + (colleges.length>3?` · +${colleges.length-3} more`:'') : 'No colleges found'}
              </p>
            </div>
          )}
        </div>

        {/* How to add students guide */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: UserPlus,
              gradient: 'from-indigo-600 to-violet-600',
              title: 'Single Student',
              desc: 'Add one student at a time with a form. Best for individual enrollments or corrections.',
              tips: ['Fill all details including college assignment','Password auto-generated by system','Student can reset on first login'],
              action: () => setModal('single'),
              btnLabel: 'Add Single Student',
              btnColor: 'bg-gradient-to-r from-indigo-600 to-violet-600',
            },
            {
              icon: UsersRound,
              gradient: 'from-violet-600 to-purple-600',
              title: 'Multiple Students',
              desc: 'Fill a table to add many students at once — no file needed.',
              tips: ['Enter rows directly in browser','Validates before submitting','All passwords auto-generated'],
              action: () => setModal('multiple'),
              btnLabel: 'Add Multiple Students',
              btnColor: 'bg-gradient-to-r from-violet-600 to-purple-600',
            },
            {
              icon: CloudUpload,
              gradient: 'from-blue-600 to-indigo-600',
              title: 'Bulk Excel Upload',
              desc: 'Upload hundreds at once via .xlsx or .csv file with validate-before-upload.',
              tips: ['Download template first','Validate then upload','Up to 500 students per file'],
              action: () => setModal('upload'),
              btnLabel: 'Open Bulk Upload',
              btnColor: 'bg-gradient-to-r from-blue-600 to-indigo-600',
            },
          ].map(card => (
            <div key={card.title} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className={`bg-gradient-to-r ${card.gradient} px-5 py-4 flex items-center gap-3`}>
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                  <card.icon size={18} className="text-white"/>
                </div>
                <h3 className="text-base font-bold text-white">{card.title}</h3>
              </div>
              <div className="p-5 space-y-3">
                <p className="text-sm text-slate-500 leading-relaxed">{card.desc}</p>
                <ul className="space-y-1.5">
                  {card.tips.map((t,i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                      <div className="w-4 h-4 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i+1}</div>
                      {t}
                    </li>
                  ))}
                </ul>
                <button onClick={card.action}
                  className={`w-full mt-2 flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-white ${card.btnColor} hover:opacity-90 rounded-xl transition-opacity`}>
                  <card.icon size={14}/>{card.btnLabel}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Export card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center"><FileDown size={18} className="text-white"/></div>
            <h3 className="text-base font-bold text-white">Export Students</h3>
          </div>
          <div className="p-5 flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm text-slate-600">Export student records across all colleges or filter by college, branch, batch, or placement status.</p>
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                {['Filter by college / branch / batch','Preview count before downloading','Excel: 3 sheets · CSV: flat table'].map((t,i) => (
                  <span key={i} className="flex items-center gap-1.5 text-xs text-slate-500">
                    <ChevronRight size={11} className="text-slate-300"/>{t}
                  </span>
                ))}
              </div>
            </div>
            <button onClick={()=>setModal('export')}
              className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 text-white text-sm font-bold rounded-xl transition-opacity">
              <FileDown size={14}/> Open Export
            </button>
          </div>
        </div>

        {/* Column reference */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center"><Info size={13} className="text-blue-600"/></div>
            <h3 className="text-sm font-bold text-slate-800">Excel Upload — Column Reference</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-black text-red-500 uppercase tracking-wider mb-3">Required</p>
              <div className="space-y-2">
                {[
                  ['name',        'Full student name (min 2 characters)'],
                  ['email',       'Unique email address'],
                  ['roll_number', 'Unique roll number per college'],
                ].map(([c,d]) => (
                  <div key={c} className="flex items-center gap-3">
                    <code className="px-2 py-0.5 bg-red-50 text-red-700 rounded text-xs font-mono border border-red-100 flex-shrink-0">{c}</code>
                    <span className="text-xs text-slate-400">{d}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Optional</p>
              <div className="space-y-2">
                {[
                  ['phone',      '10-digit mobile number'],
                  ['branch',     'CSE / ECE / EEE / MECH / CIVIL / IT / AI/ML / DS / Other'],
                  ['batch',      'Graduation year e.g. 2026'],
                  ['semester',   'Integer 1–8'],
                  ['cgpa',       'Decimal 0.0–10.0'],
                ].map(([c,d]) => (
                  <div key={c} className="flex items-center gap-3">
                    <code className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-mono border border-slate-200 flex-shrink-0">{c}</code>
                    <span className="text-xs text-slate-400">{d}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 flex gap-2">
            <AlertTriangle size={13} className="flex-shrink-0 mt-0.5"/>
            <span>
              <strong>No password column needed</strong> — passwords are auto-generated by the system.
              If any row fails validation, the <strong>entire upload is rejected</strong>.
            </span>
          </div>
        </div>
      </div>

      {modal==='single'   && <SAAddSingleModal   colleges={colleges} onClose={()=>setModal(null)} onDone={()=>{}}/>}
      {modal==='multiple' && <SAAddMultipleModal colleges={colleges} onClose={()=>setModal(null)} onDone={()=>{}}/>}
      {modal==='upload'   && <SABulkModal        colleges={colleges} onClose={()=>setModal(null)}/>}
      {modal==='export'   && <SAExportModal      colleges={colleges} onClose={()=>setModal(null)}/>}
    </DashboardLayout>
  );
}