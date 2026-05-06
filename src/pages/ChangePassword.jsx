// src/pages/ChangePassword.jsx — First-Login Mandatory Password Change
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authAPI } from '../api/Api';
import {
  KeyRound, Eye, EyeOff, ArrowRight, Loader2,
  ShieldCheck, AlertCircle, CheckCircle2,
} from 'lucide-react';
import AuthBackground from '../components/auth/AuthBackground';
 
// ── strength helper ──────────────────────────────────────────────────────────
const getStrength = (pwd) => {
  let score = 0;
  if (pwd.length >= 8)              score++;
  if (/[A-Z]/.test(pwd))           score++;
  if (/[0-9]/.test(pwd))           score++;
  if (/[^A-Za-z0-9]/.test(pwd))   score++;
  return score; // 0-4
};
 
const strengthLabel = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];
const strengthColor = [
  'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-blue-500', 'bg-green-500',
];
 
const Rule = ({ met, text }) => (
  <li className={`flex items-center gap-2 text-xs transition-colors ${met ? 'text-green-600' : 'text-gray-400'}`}>
    <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${met ? 'text-green-500' : 'text-gray-300'}`} />
    {text}
  </li>
);
 
const PwdField = ({ label, name, value, onChange, show, onToggle, error, placeholder }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete="new-password"
        className={`w-full px-4 py-3 pr-12 border rounded-xl text-sm focus:outline-none focus:ring-2 transition ${
          error
            ? 'border-red-400 focus:ring-red-300 bg-red-50'
            : 'border-gray-200 focus:ring-blue-400 focus:border-transparent'
        }`}
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition"
      >
        {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
      </button>
    </div>
    {error && (
      <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
        <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
      </p>
    )}
  </div>
);
 
// ── Main component ───────────────────────────────────────────────────────────
const ChangePassword = () => {
  const navigate  = useNavigate();
  const { user, updateUser } = useAuth();
  const toast     = useToast();
 
  const [form, setForm]   = useState({ newPassword: '', confirm: '' });
  const [show, setShow]   = useState({ new: false, confirm: false });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
 
  const strength = getStrength(form.newPassword);
 
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
  };
 
  const validate = () => {
    const e = {};
    if (!form.newPassword)               e.newPassword = 'New password is required';
    else if (form.newPassword.length < 6) e.newPassword = 'Must be at least 6 characters';
    if (!form.confirm)                    e.confirm = 'Please confirm your password';
    else if (form.confirm !== form.newPassword) e.confirm = 'Passwords do not match';
    return e;
  };
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
 
    setLoading(true);
    try {
      // For first-login, currentPassword is NOT required by backend
      const res = await authAPI.changePassword(form.newPassword, null, true); // isFirstLogin=true → skip currentPassword check
 
      if (res.success) {
        // Clear isFirstLogin flag from local user context
        if (user) updateUser({ ...user, isFirstLogin: false });
 
        toast.success('Password updated!', user?.role === 'trainer' ? 'Redirecting to your dashboard.' : 'Please complete your profile to get started.');
 
        // Backend returns nextStep: 'COMPLETE_PROFILE'
        if (res.nextStep === 'COMPLETE_PROFILE') {
          navigate('/profile-completion', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      } else {
        setErrors({ submit: res.message || 'Failed to change password.' });
      }
    } catch (err) {
      setErrors({ submit: err.message || 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 relative overflow-hidden p-4">
      <AuthBackground />
 
      <div className="relative z-10 w-full max-w-md">
        {/* Card */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-blue-500/10 border border-white/50 p-8 sm:p-10">
 
          {/* Icon + Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl shadow-lg shadow-blue-400/40 mb-4">
              <KeyRound className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Set Your Password</h1>
            <p className="text-gray-500 text-sm mt-1.5 leading-relaxed">
              Welcome{user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}! For security, please
              create a new password before continuing.
            </p>
          </div>
 
          {/* Info banner */}
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-700">
              Your account was created with a temporary password. You must set a permanent
              password to access the platform.
            </p>
          </div>
 
          {/* Global error */}
          {errors.submit && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-red-700 text-sm">
              <AlertCircle className="w-4.5 h-4.5 shrink-0" /> {errors.submit}
            </div>
          )}
 
          <form onSubmit={handleSubmit} className="space-y-5">
 
            {/* New password */}
            <PwdField
              label="New Password"
              name="newPassword"
              value={form.newPassword}
              onChange={handleChange}
              show={show.new}
              onToggle={() => setShow(p => ({ ...p, new: !p.new }))}
              error={errors.newPassword}
              placeholder="Create a strong password"
            />
 
            {/* Strength bar */}
            {form.newPassword && (
              <div className="-mt-2">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4].map(i => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-all ${
                        i <= strength ? strengthColor[strength] : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <p className={`text-xs font-medium ${
                  strength <= 1 ? 'text-red-500' :
                  strength === 2 ? 'text-yellow-600' :
                  strength === 3 ? 'text-blue-600' : 'text-green-600'
                }`}>
                  {strengthLabel[strength]}
                </p>
              </div>
            )}
 
            {/* Rules checklist */}
            <ul className="space-y-1 pl-0.5">
              <Rule met={form.newPassword.length >= 8}   text="At least 8 characters" />
              <Rule met={/[A-Z]/.test(form.newPassword)} text="One uppercase letter" />
              <Rule met={/[0-9]/.test(form.newPassword)} text="One number" />
              <Rule met={/[^A-Za-z0-9]/.test(form.newPassword)} text="One special character (optional but recommended)" />
            </ul>
 
            {/* Confirm password */}
            <PwdField
              label="Confirm Password"
              name="confirm"
              value={form.confirm}
              onChange={handleChange}
              show={show.confirm}
              onToggle={() => setShow(p => ({ ...p, confirm: !p.confirm }))}
              error={errors.confirm}
              placeholder="Re-enter your password"
            />
 
            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-700 hover:via-blue-600 hover:to-cyan-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-400/40 hover:shadow-blue-400/60 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Saving…</>
              ) : (
                <>Set Password <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>
        </div>
 
        {/* Step indicator — trainers skip 'Complete Profile' */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {(user?.role === 'trainer' ? ['Set Password', 'Dashboard'] : ['Set Password', 'Complete Profile', 'Dashboard']).map((step, i, arr) => (
            <div key={step} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                i === 0
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/70 text-gray-400'
              }`}>
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  i === 0 ? 'bg-white text-blue-600' : 'bg-gray-200 text-gray-400'
                }`}>{i + 1}</span>
                {step}
              </div>
              {i < arr.length - 1 && <div className="w-4 h-px bg-gray-300" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
 
export default ChangePassword;