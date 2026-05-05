// src/components/trainers/TrainerForm.jsx
// Works as both Create and Edit form.
// Pass `initialData` for edit mode. `onSubmit(formData)` receives the form values.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Mail, Phone, BookOpen, Award, Briefcase,
  GraduationCap, FileText, ChevronLeft, Save, X,
  Lock, Eye, EyeOff, ShieldCheck,
} from 'lucide-react';
import SuperAdminDashboardLayout from '../../components/layout/SuperAdminDashboardLayout';
import { useToast } from '../../context/ToastContext';

/* ─── Sample trainer for edit preview ─────────────── */
export const SAMPLE_TRAINER = {
  fullName:        'Arjun Kumar',
  email:           'arjun@trainpro.in',
  phone:           '+91 98765 43210',
  specialization:  'React & Node.js',
  experienceYears: '5',
  qualification:   'B.Tech Computer Science',
  bio:             'Passionate full-stack developer with 5 years of training experience.',
  isActive:        true,
};

/* ─── Field wrapper ────────────────────────────────── */
const Field = ({ label, required, error, hint, children, className = '' }) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    <label className="text-xs font-bold text-slate-600 flex items-center gap-0.5">
      {label}{required && <span className="text-rose-400 ml-0.5">*</span>}
    </label>
    {children}
    {hint && !error && <p className="text-[11px] text-slate-400">{hint}</p>}
    {error && <p className="text-[11px] text-rose-500 font-medium">{error}</p>}
  </div>
);

/* ─── Input ────────────────────────────────────────── */
const Input = ({ icon: Icon, error, ...props }) => (
  <div className="relative">
    {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />}
    <input
      {...props}
      className={`w-full ${Icon ? 'pl-10' : 'pl-3.5'} pr-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003399]/20 focus:border-[#003399]/50 bg-white transition-all placeholder:text-slate-300 text-slate-700 ${
        error ? 'border-rose-300 bg-rose-50/40 focus:ring-rose-200' : 'border-slate-200 hover:border-slate-300'
      }`}
    />
  </div>
);

/* ─── Password Input ───────────────────────────────── */
const PasswordInput = ({ icon: Icon = Lock, error, showToggle = true, show, onToggle, ...props }) => (
  <div className="relative">
    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
    <input
      {...props}
      type={show ? 'text' : 'password'}
      className={`w-full pl-10 pr-10 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003399]/20 focus:border-[#003399]/50 bg-white transition-all placeholder:text-slate-300 text-slate-700 ${
        error ? 'border-rose-300 bg-rose-50/40 focus:ring-rose-200' : 'border-slate-200 hover:border-slate-300'
      }`}
    />
    {showToggle && (
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    )}
  </div>
);

/* ─── Textarea ─────────────────────────────────────── */
const Textarea = ({ error, ...props }) => (
  <textarea
    {...props}
    rows={4}
    className={`w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003399]/20 focus:border-[#003399]/50 bg-white transition-all placeholder:text-slate-300 resize-none text-slate-700 ${
      error ? 'border-rose-300 bg-rose-50/40' : 'border-slate-200 hover:border-slate-300'
    }`}
  />
);

/* ─── Section card ─────────────────────────────────── */
const Section = ({ title, subtitle, icon: Icon, children, fullWidth = false }) => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
    <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#003399]/10 to-[#00A9CE]/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4.5 h-4.5 text-[#003399]" style={{ width: 18, height: 18 }} />
      </div>
      <div>
        <h2 className="text-sm font-bold text-slate-800">{title}</h2>
        {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
    <div className={`p-6 grid gap-4 ${fullWidth ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
      {children}
    </div>
  </div>
);

/* ─── Validate ─────────────────────────────────────── */
const validate = (form, isEditMode) => {
  const errs = {};
  if (!form.fullName.trim())       errs.fullName = 'Full name is required';
  if (!form.email.trim())          errs.email    = 'Email is required';
  else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email';
  if (!form.specialization.trim()) errs.specialization = 'Specialization is required';
  if (form.experienceYears !== '' && isNaN(Number(form.experienceYears)))
    errs.experienceYears = 'Must be a number';

  if (!isEditMode) {
    if (!form.password)              errs.password = 'Password is required';
    else if (form.password.length < 8) errs.password = 'Minimum 8 characters';
    if (!form.confirmPassword)       errs.confirmPassword = 'Please confirm password';
    else if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
  } else {
    // In edit mode, only validate if user typed something
    if (form.password && form.password.length < 8)
      errs.password = 'Minimum 8 characters';
    if (form.password && form.password !== form.confirmPassword)
      errs.confirmPassword = 'Passwords do not match';
  }

  return errs;
};

/* ─── Main Component ───────────────────────────────── */
const TrainerForm = ({
  initialData = {},
  onSubmit,
  isEditMode = false,
}) => {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [form, setForm] = useState({
    fullName:        initialData.fullName        ?? '',
    email:           initialData.email           ?? '',
    phone:           initialData.phone           ?? '',
    specialization:  initialData.specialization  ?? '',
    experienceYears: initialData.experienceYears != null ? String(initialData.experienceYears) : '',
    qualification:   initialData.qualification   ?? '',
    bio:             initialData.bio             ?? '',
    password:        '',
    confirmPassword: '',
    isActive:        initialData.isActive        ?? true,
  });

  const [errors,      setErrors]      = useState({});
  const [submitting,  setSubmitting]  = useState(false);
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const set = (key) => (e) =>
    setForm(prev => ({ ...prev, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(form, isEditMode);
    if (Object.keys(errs).length) {
      setErrors(errs);
      toastError('Validation Error', 'Please fix the errors before submitting.');
      return;
    }
    setErrors({});
    setSubmitting(true);

    try {
      await new Promise(r => setTimeout(r, 900));
      setSubmitting(false);

      if (onSubmit) onSubmit({ ...form, experienceYears: Number(form.experienceYears) || null });

      success(
        isEditMode ? 'Trainer Updated' : 'Trainer Created',
        isEditMode
          ? `${form.fullName}'s profile has been updated successfully.`
          : `${form.fullName} has been added as a trainer.`
      );

      // navigate('/dashboard/super-admin/trainers');
    } catch {
      setSubmitting(false);
      toastError('Something went wrong', 'Could not save trainer. Please try again.');
    }
  };

  return (
    <SuperAdminDashboardLayout>
      <div className="px-4 py-5 sm:px-6 md:px-8 md:py-7 font-sans bg-slate-50 min-h-screen">
        <form onSubmit={handleSubmit} noValidate>

          {/* ── Page Header ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-[#003399] hover:border-[#003399]/30 hover:bg-[#003399]/5 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-1.5 h-7 bg-gradient-to-b from-[#003399] to-[#00A9CE] rounded-full" />
                  {isEditMode ? 'Edit Trainer' : 'Add New Trainer'}
                </h1>
                <p className="text-sm text-slate-400 ml-3.5 mt-0.5">
                  {isEditMode ? 'Update trainer profile information' : 'Fill in the details to register a new trainer'}
                </p>
              </div>
            </div>
          </div>

          {/* ── Two-column layout ── */}
          <div className="flex flex-col lg:flex-row gap-5 items-start">

            {/* ── LEFT: Main form ── */}
            <div className="flex-1 space-y-5 min-w-0">

              {/* Personal Details */}
              <Section title="Personal Details" subtitle="Administrator's basic information" icon={User}>
                <Field label="Full Name" required error={errors.fullName}>
                  <Input
                    icon={User}
                    type="text"
                    placeholder="Enter full name"
                    value={form.fullName}
                    onChange={set('fullName')}
                    error={errors.fullName}
                  />
                </Field>

                <Field label="Email Address" required error={errors.email}>
                  <Input
                    icon={Mail}
                    type="email"
                    placeholder="Enter email address"
                    value={form.email}
                    onChange={set('email')}
                    error={errors.email}
                  />
                </Field>

                <Field label="Phone Number" error={errors.phone}>
                  <Input
                    icon={Phone}
                    type="tel"
                    placeholder="Enter phone number"
                    value={form.phone}
                    onChange={set('phone')}
                    error={errors.phone}
                  />
                </Field>

                <Field label="Specialization" required error={errors.specialization}>
                  <Input
                    icon={BookOpen}
                    type="text"
                    placeholder="e.g. React & Node.js"
                    value={form.specialization}
                    onChange={set('specialization')}
                    error={errors.specialization}
                  />
                </Field>

                <Field label="Years of Experience" error={errors.experienceYears}>
                  <Input
                    icon={Award}
                    type="number"
                    min="0"
                    max="50"
                    placeholder="e.g. 5"
                    value={form.experienceYears}
                    onChange={set('experienceYears')}
                    error={errors.experienceYears}
                  />
                </Field>

                <Field label="Highest Qualification" error={errors.qualification}>
                  <Input
                    icon={GraduationCap}
                    type="text"
                    placeholder="e.g. B.Tech Computer Science"
                    value={form.qualification}
                    onChange={set('qualification')}
                    error={errors.qualification}
                  />
                </Field>
              </Section>

              {/* Set Password */}
              <Section
                title="Set Password"
                subtitle={isEditMode ? 'Leave blank to keep current password' : 'Create a secure password for this account'}
                icon={Lock}
              >
                <Field
                  label="Password"
                  required={!isEditMode}
                  error={errors.password}
                  hint="Minimum 8 characters"
                >
                  <PasswordInput
                    placeholder="Enter password"
                    value={form.password}
                    onChange={set('password')}
                    show={showPass}
                    onToggle={() => setShowPass(p => !p)}
                    error={errors.password}
                    autoComplete="new-password"
                  />
                </Field>

                <Field
                  label="Confirm Password"
                  required={!isEditMode}
                  error={errors.confirmPassword}
                >
                  <PasswordInput
                    placeholder="Confirm password"
                    value={form.confirmPassword}
                    onChange={set('confirmPassword')}
                    show={showConfirm}
                    onToggle={() => setShowConfirm(p => !p)}
                    error={errors.confirmPassword}
                    autoComplete="new-password"
                  />
                </Field>
              </Section>

              {/* Bio */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#003399]/10 to-[#00A9CE]/10 flex items-center justify-center flex-shrink-0">
                    <FileText style={{ width: 18, height: 18 }} className="text-[#003399]" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-800">Bio / About</h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">A short introduction about this trainer</p>
                  </div>
                </div>
                <div className="p-6">
                  <Textarea
                    placeholder="Describe the trainer's background, teaching style, and areas of focus…"
                    value={form.bio}
                    onChange={set('bio')}
                  />
                  <p className="text-[10px] text-slate-300 mt-1.5 text-right">{form.bio.length} characters</p>
                </div>
              </div>
            </div>

            {/* ── RIGHT: Sidebar ── */}
            <div className="w-full lg:w-72 xl:w-80 flex-shrink-0 space-y-4">

              {/* Account Settings */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck style={{ width: 18, height: 18 }} className="text-amber-500" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-800">Account Settings</h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">Access and permissions</p>
                  </div>
                </div>
                <div className="p-5">
                  <div className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-colors ${form.isActive ? 'bg-blue-50/60' : 'bg-slate-50'}`}>
                    {/* Toggle */}
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, isActive: !prev.isActive }))}
                      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                        form.isActive ? 'bg-[#003399]' : 'bg-slate-200'
                      }`}
                      role="switch"
                      aria-checked={form.isActive}
                    >
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        form.isActive ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                    <div>
                      <p className={`text-sm font-bold ${form.isActive ? 'text-[#003399]' : 'text-slate-400'}`}>
                        {form.isActive ? 'Account Active' : 'Account Inactive'}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {form.isActive ? 'Trainer can log in and access the system' : 'Trainer access is disabled'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Actions */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full border-2 border-emerald-400 flex items-center justify-center flex-shrink-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                  <h2 className="text-sm font-bold text-slate-800">Save Changes</h2>
                </div>
                <div className="p-5 space-y-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full inline-flex items-center justify-center gap-2 bg-[#003399] text-white text-sm font-bold px-5 py-3 rounded-xl hover:bg-[#002d8b] transition-all shadow-md shadow-blue-500/15 active:scale-[0.98] disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving…
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        {isEditMode ? 'Update Trainer' : 'Create Trainer'}
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="w-full inline-flex items-center justify-center gap-2 text-sm font-bold px-5 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50 transition-all"
                  >
                    <X className="w-4 h-4" /> Cancel
                  </button>
                </div>
              </div>

              {/* Professional summary card */}
              <div className="bg-gradient-to-br from-[#003399]/5 to-[#00A9CE]/5 rounded-2xl border border-[#003399]/10 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Briefcase style={{ width: 15, height: 15 }} className="text-[#003399]" />
                  <p className="text-xs font-bold text-[#003399] uppercase tracking-wider">Quick Info</p>
                </div>
                <div className="space-y-2">
                  {[
                    { label: 'Name',           value: form.fullName        || '—' },
                    { label: 'Specialization', value: form.specialization  || '—' },
                    { label: 'Experience',     value: form.experienceYears ? `${form.experienceYears} yrs` : '—' },
                    { label: 'Status',         value: form.isActive ? 'Active' : 'Inactive', color: form.isActive ? 'text-emerald-600' : 'text-rose-400' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-400 font-medium">{label}</span>
                      <span className={`text-[11px] font-bold text-slate-700 truncate max-w-[140px] text-right ${color || ''}`}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </SuperAdminDashboardLayout>
  );
};

export default TrainerForm;

/* ─── Usage examples ───────────────────────────────────────────────────────────

// Wrap your app (or page) with ToastProvider:
import { ToastProvider } from '../../context/ToastContext';
<ToastProvider>
  <TrainerForm onSubmit={(data) => console.log('create', data)} />
</ToastProvider>

// Create mode (route: /trainers/create)
<TrainerForm onSubmit={(data) => console.log('create', data)} />

// Edit mode (route: /trainers/edit/:id)
import { SAMPLE_TRAINER } from './TrainerForm';
<TrainerForm initialData={SAMPLE_TRAINER} isEditMode onSubmit={(data) => console.log('update', data)} />
*/