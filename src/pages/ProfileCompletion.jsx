// src/pages/ProfileCompletion.jsx — First-Login Profile Completion
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { profileAPI } from '../api/Api';
import {
  User, GraduationCap, Code, Loader2, CheckCircle2,
  ArrowRight, ArrowLeft, Sparkles, AlertCircle, MapPin,
  Phone, BookOpen, Star, ChevronRight,
} from 'lucide-react';

// ── Reusable field components ────────────────────────────────────────────────
const FieldLabel = ({ children, required }) => (
  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
    {children}
    {required && <span className="text-red-500 ml-0.5">*</span>}
  </label>
);

const Input = ({ label, required, error, className = '', ...props }) => (
  <div className={className}>
    {label && <FieldLabel required={required}>{label}</FieldLabel>}
    <input
      {...props}
      className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 transition ${
        error
          ? 'border-red-400 focus:ring-red-300 bg-red-50'
          : 'border-gray-200 focus:ring-blue-400 focus:border-transparent bg-white'
      }`}
    />
    {error && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{error}</p>}
  </div>
);

const Select = ({ label, required, error, options = [], className = '', ...props }) => (
  <div className={className}>
    {label && <FieldLabel required={required}>{label}</FieldLabel>}
    <select
      {...props}
      className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 transition appearance-none bg-white ${
        error ? 'border-red-400 focus:ring-red-300' : 'border-gray-200 focus:ring-blue-400 focus:border-transparent'
      }`}
    >
      <option value="">Select…</option>
      {options.map(o => (
        <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
      ))}
    </select>
    {error && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{error}</p>}
  </div>
);

// ── Skill tag input ──────────────────────────────────────────────────────────
const SkillInput = ({ skills, onChange }) => {
  const [input, setInput] = useState('');

  const add = () => {
    const trimmed = input.trim();
    if (trimmed && !skills.includes(trimmed)) {
      onChange([...skills, trimmed]);
    }
    setInput('');
  };

  const remove = (s) => onChange(skills.filter(x => x !== s));

  return (
    <div>
      <FieldLabel>Skills</FieldLabel>
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder="Type a skill and press Enter"
          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
        />
        <button
          type="button"
          onClick={add}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition"
        >
          Add
        </button>
      </div>
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {skills.map(s => (
            <span key={s} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-200">
              {s}
              <button type="button" onClick={() => remove(s)} className="hover:text-red-500 transition ml-0.5">×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Steps config ─────────────────────────────────────────────────────────────
const STEPS = [
  { id: 'personal',   label: 'Personal',   icon: User },
  { id: 'education',  label: 'Education',  icon: GraduationCap },
  { id: 'skills',     label: 'Skills',     icon: Code },
];

const GENDER_OPTIONS   = ['Male', 'Female', 'Other', 'Prefer not to say'].map(v => ({ value: v, label: v }));

// Must match CandidateProfile schema enum exactly
const STATUS_OPTIONS = [
  { value: 'Student',              label: 'Student (Currently studying)' },
  { value: 'Graduate',             label: 'Graduate (Completed degree)' },
  { value: 'Working Professional', label: 'Working Professional' },
];

// Must match CandidateProfile schema enum exactly
const QUALIFICATION_OPTIONS = [
  { value: "High School (10th)",   label: 'High School (10th)' },
  { value: "Intermediate (12th)",  label: 'Intermediate (12th)' },
  { value: "Diploma",              label: 'Diploma' },
  { value: "Bachelor's Degree",    label: "Bachelor's Degree (B.Tech / B.E / B.Sc etc.)" },
  { value: "Master's Degree",      label: "Master's Degree (M.Tech / M.E / M.Sc etc.)" },
  { value: "PhD",                  label: 'PhD' },
  { value: "Other",                label: 'Other' },
];

const BRANCH_OPTIONS   = ['CSE','ECE','EEE','MECH','CIVIL','IT','AI/ML','DS','MBA','Other'].map(v => ({ value: v, label: v }));
const YEAR_OPTIONS     = Array.from({ length: 10 }, (_, i) => { const y = new Date().getFullYear() - 4 + i; return { value: String(y), label: String(y) }; });

// ── Main component ───────────────────────────────────────────────────────────
const ProfileCompletion = () => {
  const navigate = useNavigate();
  const { user }  = useAuth();
  const toast     = useToast();

  const [step, setStep]       = useState(0);
  const [saving, setSaving]   = useState(false);
  const [errors, setErrors]   = useState({});

  // Pre-fill from user record (data saved by College Admin)
  const [form, setForm] = useState({
    // Personal
    fullName:    '',
    mobileNumber: '',
    gender:      '',
    dateOfBirth: '',
    city:        '',
    state:       '',
    country:     'India',

    // Education (may be pre-filled)
    highestQualification: "Bachelor's Degree",
    specialization:       '',
    collegeName:          '',
    university:           '',
    graduationYear:       '',
    cgpaOrPercentage:     '',

    // Skills
    primarySkills:   [],
    currentStatus:   'Student',
    careerObjective: '',
  });

  // Pre-fill from user data if provided by college admin
  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        fullName: user.fullName || prev.fullName,
        // studentInfo pre-fill from college admin created account
        specialization:   user.studentInfo?.branch   || prev.specialization,
        cgpaOrPercentage: user.studentInfo?.cgpa      ? String(user.studentInfo.cgpa) : prev.cgpaOrPercentage,
        graduationYear:   user.studentInfo?.batch     ? String(user.studentInfo.batch) : prev.graduationYear,
      }));
    }
  }, [user]);

  const set = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    if (errors[k]) setErrors(p => ({ ...p, [k]: '' }));
  };

  const handleChange = (e) => set(e.target.name, e.target.value);

  // Validate current step
  const validateStep = () => {
    const e = {};
    if (step === 0) {
      if (!form.fullName.trim())   e.fullName = 'Name is required';
      if (!form.mobileNumber.trim()) e.mobileNumber = 'Mobile number is required';
      else if (!/^\d{10}$/.test(form.mobileNumber.replace(/\s/g, ''))) e.mobileNumber = 'Enter a valid 10-digit number';
    }
    if (step === 1) {
      if (!form.graduationYear)    e.graduationYear = 'Graduation year is required';
    }
    return e;
  };

  const next = () => {
    const e = validateStep();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setStep(s => s + 1);
  };

  const back = () => { setErrors({}); setStep(s => s - 1); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const e2 = validateStep();
    if (Object.keys(e2).length) { setErrors(e2); return; }

    setSaving(true);
    try {
      const profileData = {
        // email is REQUIRED by CandidateProfile schema — pull from logged-in user
        email:            user?.email || '',
        fullName:         form.fullName.trim(),
        mobileNumber:     form.mobileNumber.trim(),
        gender:           form.gender || undefined,
        dateOfBirth:      form.dateOfBirth || undefined,

        // city/state must be nested under `address` to match CandidateProfile schema
        address: {
          city:    form.city.trim()    || undefined,
          state:   form.state.trim()   || undefined,
          country: form.country        || 'India',
        },

        highestQualification: form.highestQualification || undefined,
        specialization:   form.specialization || undefined,
        collegeName:      form.collegeName.trim() || undefined,
        university:       form.university.trim() || undefined,
        graduationYear:   form.graduationYear ? parseInt(form.graduationYear) : undefined,
        // Schema field is String — keep as string
        cgpaOrPercentage: form.cgpaOrPercentage ? String(form.cgpaOrPercentage) : undefined,
        primarySkills:    form.primarySkills,
        // Must match schema enum: 'Student' | 'Graduate' | 'Working Professional'
        currentStatus:    form.currentStatus || undefined,
        careerObjective:  form.careerObjective.trim() || undefined,
      };

      await profileAPI.createOrUpdateProfile(profileData);
      toast.success('Profile saved!', 'Welcome to the ICL platform.');
      navigate('/dashboard/student', { replace: true });
    } catch (err) {
      toast.error('Save failed', err.message || 'Could not save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const StepIcon = STEPS[step].icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl shadow-lg shadow-blue-400/40 mb-3">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Complete Your Profile</h1>
          <p className="text-gray-500 text-sm mt-1">
            Help us personalise your experience. You can update these details later.
          </p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-0 mb-8">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const done    = i < step;
            const current = i === step;
            return (
              <div key={s.id} className="flex items-center">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  current ? 'bg-blue-600 text-white shadow-md shadow-blue-300' :
                  done    ? 'bg-green-100 text-green-700' :
                            'bg-white/70 text-gray-400 border border-gray-200'
                }`}>
                  {done
                    ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                    : <Icon className="w-4 h-4" />}
                  {s.label}
                </div>
                {i < STEPS.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-gray-300 mx-1" />
                )}
              </div>
            );
          })}
        </div>

        {/* Card */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-8">

          {/* Step icon + title */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <StepIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">{STEPS[step].label} Details</h2>
              <p className="text-xs text-gray-500">Step {step + 1} of {STEPS.length}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* ── Step 0: Personal ── */}
            {step === 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Input
                  label="Full Name" name="fullName" value={form.fullName} onChange={handleChange}
                  placeholder="John Doe" required error={errors.fullName} className="sm:col-span-2"
                />
                <Input
                  label="Mobile Number" name="mobileNumber" value={form.mobileNumber} onChange={handleChange}
                  placeholder="10-digit number" type="tel" required error={errors.mobileNumber}
                />
                <Select
                  label="Gender" name="gender" value={form.gender}
                  onChange={handleChange} options={GENDER_OPTIONS}
                />
                <Input
                  label="Date of Birth" name="dateOfBirth" type="date"
                  value={form.dateOfBirth} onChange={handleChange}
                />
                <Input
                  label="City" name="city" value={form.city} onChange={handleChange}
                  placeholder="e.g. Chennai"
                />
                <Input
                  label="State" name="state" value={form.state} onChange={handleChange}
                  placeholder="e.g. Tamil Nadu"
                />
              </div>
            )}

            {/* ── Step 1: Education ── */}
            {step === 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Input
                  label="College / Institution" name="collegeName" value={form.collegeName}
                  onChange={handleChange} placeholder="e.g. Anna University" className="sm:col-span-2"
                />
                <Input
                  label="University" name="university" value={form.university}
                  onChange={handleChange} placeholder="e.g. Anna University"
                />
                <Select
                  label="Highest Qualification" name="highestQualification" value={form.highestQualification}
                  onChange={handleChange} options={QUALIFICATION_OPTIONS}
                />
                <Select
                  label="Branch / Specialization" name="specialization" value={form.specialization}
                  onChange={handleChange} options={BRANCH_OPTIONS}
                />
                <Select
                  label="Graduation Year" name="graduationYear" value={form.graduationYear}
                  onChange={handleChange} options={YEAR_OPTIONS} required error={errors.graduationYear}
                />
                <Input
                  label="CGPA / Percentage" name="cgpaOrPercentage" type="number" step="0.01"
                  min="0" max="10" value={form.cgpaOrPercentage}
                  onChange={handleChange} placeholder="e.g. 8.5"
                />
              </div>
            )}

            {/* ── Step 2: Skills ── */}
            {step === 2 && (
              <div className="space-y-5">
                <SkillInput
                  skills={form.primarySkills}
                  onChange={v => set('primarySkills', v)}
                />
                <Select
                  label="Current Status" name="currentStatus" value={form.currentStatus}
                  onChange={handleChange} options={STATUS_OPTIONS}
                />
                <div>
                  <FieldLabel>Career Objective</FieldLabel>
                  <textarea
                    name="careerObjective"
                    value={form.careerObjective}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Briefly describe your career goals…"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
                  />
                </div>
              </div>
            )}

            {/* Nav buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
              {step > 0 ? (
                <button type="button" onClick={back}
                  className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/dashboard/student', { replace: true })}
                  className="px-5 py-2.5 text-sm text-gray-400 hover:text-gray-600 transition"
                >
                  Skip for now
                </button>
              )}

              {step < STEPS.length - 1 ? (
                <button type="button" onClick={next}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition shadow-md shadow-blue-300">
                  Next <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button type="submit" disabled={saving}
                  className="flex items-center gap-2 px-7 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-cyan-600 transition shadow-md shadow-blue-300 disabled:opacity-50">
                  {saving
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                    : <><CheckCircle2 className="w-4 h-4" /> Complete Profile</>}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Skip entirely */}
        <p className="text-center mt-4 text-xs text-gray-400">
          You can always complete your profile later from the{' '}
          <button onClick={() => navigate('/dashboard/student', { replace: true })}
            className="underline hover:text-gray-600 transition">
            Dashboard
          </button>.
        </p>
      </div>
    </div>
  );
};

export default ProfileCompletion;