// src/pages/SuperAdmin/TrainerForm.jsx
//
// CREATE: POST /api/super-admin/trainer  → { fullName, email, phone }
//         Backend auto-generates password and emails credentials to trainer.
//
// EDIT:   Trainer data is passed via react-router state from TrainerManagement.
//         Falls back to fetching /super-admin/trainers/all and finding by ID
//         if state is unavailable (e.g. direct URL navigation).
//         Note: the backend currently has no super-admin PATCH endpoint for
//         trainer user-data, so edit saves will fail with 403. A clear error
//         message is shown in that case.
import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  User, Mail, Phone, ChevronLeft, Save, X,
  Info, ShieldCheck, Briefcase, CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import SuperAdminDashboardLayout from '../../components/layout/SuperAdminDashboardLayout';
import { useToast } from '../../context/ToastContext';
import apiCall from '../../api/Api';

/* ─── Shared sub-components ──────────────────────────── */
const Field = ({ label, required, error, hint, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-bold text-slate-600 flex items-center gap-0.5">
      {label}{required && <span className="text-rose-400 ml-0.5">*</span>}
    </label>
    {children}
    {hint && !error && <p className="text-[11px] text-slate-400">{hint}</p>}
    {error && <p className="text-[11px] text-rose-500 font-medium">{error}</p>}
  </div>
);

const Input = ({ icon: Icon, error, ...props }) => (
  <div className="relative">
    {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />}
    <input
      {...props}
      className={`w-full ${Icon ? 'pl-10' : 'pl-3.5'} pr-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003399]/20 focus:border-[#003399]/50 bg-white transition-all placeholder:text-slate-300 text-slate-700 ${
        error ? 'border-rose-300 bg-rose-50/40' : 'border-slate-200 hover:border-slate-300'
      } disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-50`}
    />
  </div>
);

/* ─── Validation ─────────────────────────────────────── */
const validate = (form) => {
  const errs = {};
  if (!form.fullName.trim())         errs.fullName = 'Full name is required';
  else if (form.fullName.trim().length < 2) errs.fullName = 'Minimum 2 characters';
  if (!form.email.trim())            errs.email = 'Email is required';
  else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email';
  if (form.phone && !/^[6-9]\d{9}$/.test(form.phone.replace(/\s/g, '')))
    errs.phone = 'Enter a valid 10-digit Indian mobile number';
  return errs;
};

/* ─── Component ──────────────────────────────────────── */
const TrainerForm = () => {
  const navigate    = useNavigate();
  const { trainerId } = useParams();
  const location    = useLocation();
  const isEditMode  = Boolean(trainerId);
  const { success, error: toastError } = useToast();

  const [form,        setForm]        = useState({ fullName: '', email: '', phone: '' });
  const [errors,      setErrors]      = useState({});
  const [submitting,  setSubmitting]  = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(isEditMode);
  const [created,     setCreated]     = useState(false);

  /* ── Load trainer data for edit mode ──
     Priority 1: react-router state (set by TrainerManagement when clicking Edit)
     Priority 2: fetch /super-admin/trainers/all and find by ID
     This avoids calling the wrong endpoint (/trainer/profile which returns
     TrainerProfile bio data, not User data like fullName / email).
  */
  useEffect(() => {
    if (!isEditMode) return;

    // ── Priority 1: state passed from TrainerManagement ──
    const stateTrainer = location.state?.trainer;
    if (stateTrainer && stateTrainer._id === trainerId) {
      setForm({
        fullName: stateTrainer.fullName || '',
        email:    stateTrainer.email    || '',
        phone:    stateTrainer.phone    || '',
      });
      setLoadingEdit(false);
      return;
    }

    // ── Priority 2: fetch all trainers and find by ID ──
    (async () => {
      try {
        const data = await apiCall('/super-admin/trainers/all');
        const list = Array.isArray(data.data) ? data.data : [];
        const found = list.find(t => t._id === trainerId);
        if (found) {
          setForm({
            fullName: found.fullName || '',
            email:    found.email    || '',
            phone:    found.phone    || '',
          });
        } else {
          toastError('Not Found', 'Trainer not found. Redirecting back…');
          setTimeout(() => navigate('/dashboard/super-admin/trainers'), 1500);
        }
      } catch (err) {
        toastError('Load Failed', err.message);
      } finally {
        setLoadingEdit(false);
      }
    })();
  }, [isEditMode, trainerId]); // eslint-disable-line

  const set = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) {
      setErrors(errs);
      toastError('Validation Error', 'Please fix the highlighted fields.');
      return;
    }
    setErrors({});
    setSubmitting(true);

    try {
      if (isEditMode) {
        // The backend currently has no super-admin PATCH route for trainer
        // user-data (fullName / phone). PATCH /trainer/profile is
        // authorize(Users.TRAINER) only. We attempt it and surface any error
        // clearly rather than silently faking a save.
        await apiCall('/trainer/profile', {
          method: 'PATCH',
          body: JSON.stringify({
            fullName: form.fullName.trim(),
            phone:    form.phone.trim() || undefined,
          }),
        });
        success('Saved', `${form.fullName}'s details have been updated.`);
        navigate('/dashboard/super-admin/trainers');
      } else {
        // CREATE — POST /api/super-admin/trainer
        await apiCall('/super-admin/trainer', {
          method: 'POST',
          body: JSON.stringify({
            fullName: form.fullName.trim(),
            email:    form.email.trim().toLowerCase(),
            ...(form.phone ? { phone: form.phone.trim() } : {}),
          }),
        });
        setCreated(true);
        success('Trainer Created', `Credentials emailed to ${form.email}`);
      }
    } catch (err) {
      const msg = err.message || 'Please try again.';
      // 403 means the backend doesn't allow super-admin to edit trainer details.
      if (err.statusCode === 403) {
        toastError(
          'Permission Denied',
          'The backend currently restricts trainer-profile updates to the trainer themselves. Please ask the backend team to add a super-admin PATCH endpoint.'
        );
      } else {
        toastError(isEditMode ? 'Update Failed' : 'Creation Failed', msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Success screen after create ── */
  if (created) {
    return (
      <SuperAdminDashboardLayout>
        <div className="flex items-center justify-center min-h-[70vh] px-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-[#10b981]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-[#10b981]" />
            </div>
            <h2 className="text-xl font-black text-slate-900">Trainer Added!</h2>
            <p className="text-sm text-slate-500 mt-2">
              <span className="font-bold text-slate-800">{form.fullName}</span> has been registered.
              Login credentials were emailed to <span className="font-bold text-slate-800">{form.email}</span>.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setCreated(false); setForm({ fullName: '', email: '', phone: '' }); }}
                className="flex-1 px-4 py-2.5 text-sm font-bold border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all"
              >Add Another</button>
              <button
                onClick={() => navigate('/dashboard/super-admin/trainers')}
                className="flex-1 px-4 py-2.5 text-sm font-bold bg-[#003399] text-white rounded-xl hover:bg-[#002d8b] transition-all"
              >View All Trainers</button>
            </div>
          </div>
        </div>
      </SuperAdminDashboardLayout>
    );
  }

  /* ── Loading spinner for edit mode ── */
  if (loadingEdit) {
    return (
      <SuperAdminDashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-[#003399]/20 border-t-[#003399] rounded-full animate-spin mx-auto" />
            <p className="text-sm text-slate-400 mt-3 font-medium">Loading trainer…</p>
          </div>
        </div>
      </SuperAdminDashboardLayout>
    );
  }

  /* ── Form ── */
  return (
    <SuperAdminDashboardLayout>
      <div className="px-4 py-5 sm:px-6 md:px-8 md:py-7 font-sans bg-slate-50 min-h-screen">
        <form onSubmit={handleSubmit} noValidate>

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <button type="button" onClick={() => navigate('/dashboard/super-admin/trainers')}
              className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-[#003399] hover:border-[#003399]/30 hover:bg-[#003399]/5 transition-all">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <span className="w-1.5 h-7 bg-gradient-to-b from-[#003399] to-[#00A9CE] rounded-full" />
                {isEditMode ? 'Edit Trainer' : 'Add New Trainer'}
              </h1>
              <p className="text-sm text-slate-400 ml-3.5 mt-0.5">
                {isEditMode
                  ? 'Update trainer account details'
                  : 'Credentials are auto-generated and emailed to the trainer'}
              </p>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-5 items-start">

            {/* LEFT — form fields */}
            <div className="flex-1 space-y-5 min-w-0">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#003399]/10 to-[#00A9CE]/10 flex items-center justify-center flex-shrink-0">
                    <User className="text-[#003399]" style={{ width: 18, height: 18 }} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-800">Personal Details</h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">Basic information for this trainer's account</p>
                  </div>
                </div>
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">

                  <Field label="Full Name" required error={errors.fullName}>
                    <Input icon={User} type="text" placeholder="e.g. Arjun Kumar"
                      value={form.fullName} onChange={set('fullName')} error={errors.fullName} autoComplete="name" />
                  </Field>

                  <Field label="Email Address" required error={errors.email}
                    hint={!isEditMode ? 'Login credentials will be sent to this email' : 'Email cannot be changed'}>
                    <Input icon={Mail} type="email" placeholder="trainer@example.com"
                      value={form.email} onChange={set('email')} error={errors.email}
                      autoComplete="email" disabled={isEditMode} />
                  </Field>

                  <Field label="Phone Number" error={errors.phone} hint="10-digit Indian mobile number (optional)">
                    <Input icon={Phone} type="tel" placeholder="9876543210"
                      value={form.phone} onChange={set('phone')} error={errors.phone}
                      autoComplete="tel" maxLength={10} />
                  </Field>

                </div>
              </div>

              {/* Info banners */}
              {!isEditMode && (
                <div className="flex items-start gap-3 bg-[#003399]/5 border border-[#003399]/15 rounded-2xl px-5 py-4">
                  <Info className="w-4 h-4 text-[#003399] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-black text-[#003399]">Auto-generated credentials</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      A secure password will be auto-generated and emailed to the trainer.
                      They will be prompted to change it on first login.
                    </p>
                  </div>
                </div>
              )}

              {isEditMode && (
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-2xl px-5 py-4">
                  <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-black text-amber-700">Edit limitations</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Email cannot be changed. Only name and phone can be updated.
                      If saving fails with a permissions error, ask the backend team to
                      add a super-admin PATCH endpoint for trainer user data.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT — actions sidebar */}
            <div className="w-full lg:w-72 xl:w-80 flex-shrink-0 space-y-4">

              {/* Save / Cancel */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full border-2 border-emerald-400 flex items-center justify-center flex-shrink-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                  <h2 className="text-sm font-bold text-slate-800">
                    {isEditMode ? 'Save Changes' : 'Create Trainer'}
                  </h2>
                </div>
                <div className="p-5 space-y-3">
                  <button type="submit" disabled={submitting}
                    className="w-full inline-flex items-center justify-center gap-2 bg-[#003399] text-white text-sm font-bold px-5 py-3 rounded-xl hover:bg-[#002d8b] transition-all shadow-md shadow-blue-500/15 active:scale-[0.98] disabled:opacity-60">
                    {submitting
                      ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{isEditMode ? 'Saving…' : 'Creating…'}</>
                      : <><Save className="w-4 h-4" />{isEditMode ? 'Update Trainer' : 'Create Trainer'}</>}
                  </button>
                  <button type="button" onClick={() => navigate('/dashboard/super-admin/trainers')}
                    className="w-full inline-flex items-center justify-center gap-2 text-sm font-bold px-5 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50 transition-all">
                    <X className="w-4 h-4" /> Cancel
                  </button>
                </div>
              </div>

              {/* Account info */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck style={{ width: 18, height: 18 }} className="text-amber-500" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-800">Account Access</h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">Role & permissions</p>
                  </div>
                </div>
                <div className="p-5 space-y-2.5">
                  {[
                    { label: 'Role',        value: 'Trainer',              accent: true  },
                    { label: 'Password',    value: isEditMode ? '(unchanged)' : 'Auto-generated' },
                    { label: 'First Login', value: isEditMode ? '—'        : 'Must change password' },
                  ].map(({ label, value, accent }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-medium">{label}</span>
                      <span className={`text-[11px] font-bold ${accent ? 'text-[#003399] bg-[#003399]/8 px-2 py-0.5 rounded-md' : 'text-slate-600'}`}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live preview */}
              <div className="bg-gradient-to-br from-[#003399]/5 to-[#00A9CE]/5 rounded-2xl border border-[#003399]/10 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Briefcase style={{ width: 15, height: 15 }} className="text-[#003399]" />
                  <p className="text-xs font-bold text-[#003399] uppercase tracking-wider">Preview</p>
                </div>
                <div className="space-y-2">
                  {[
                    { label: 'Name',  value: form.fullName || '—' },
                    { label: 'Email', value: form.email    || '—' },
                    { label: 'Phone', value: form.phone    || '—' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-400 font-medium">{label}</span>
                      <span className="text-[11px] font-bold text-slate-700 truncate max-w-[150px] text-right">{value}</span>
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