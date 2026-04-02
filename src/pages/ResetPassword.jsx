// src/pages/ResetPassword.jsx — Password reset using token from email link
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authAPI } from '../api/Api';
import {
  KeyRound, Eye, EyeOff, ArrowLeft, Loader2,
  ShieldCheck, AlertCircle, CheckCircle2,
} from 'lucide-react';
import AuthBackground from '../components/auth/AuthBackground';
import AuthFooter from '../components/auth/AuthFooter';

// ── strength helper ────────────────────────────────────────────────────────
const getStrength = (pwd) => {
  let score = 0;
  if (pwd.length >= 8)            score++;
  if (/[A-Z]/.test(pwd))         score++;
  if (/[0-9]/.test(pwd))         score++;
  if (/[^A-Za-z0-9]/.test(pwd))  score++;
  return score;
};
const strengthLabel = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];
const strengthColor  = ['bg-red-400','bg-orange-400','bg-yellow-400','bg-blue-500','bg-green-500'];

const Rule = ({ met, text }) => (
  <li className={`flex items-center gap-2 text-xs transition-colors ${met ? 'text-green-600' : 'text-gray-400'}`}>
    <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${met ? 'text-green-500' : 'text-gray-300'}`} />
    {text}
  </li>
);

const ResetPassword = () => {
  const { token } = useParams();
  const navigate  = useNavigate();

  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew,         setShowNew]         = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [isLoading,       setIsLoading]       = useState(false);
  const [isSuccess,       setIsSuccess]       = useState(false);
  const [error,           setError]           = useState('');

  const strength = getStrength(newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters.'); return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.'); return;
    }
    if (!token) {
      setError('Invalid reset link. Please request a new one.'); return;
    }

    setIsLoading(true);
    try {
      await authAPI.resetPassword(token, newPassword);
      setIsSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Success state ──────────────────────────────────────────────────────────
  if (isSuccess) {
    return (
      <div className="min-h-screen flex overflow-hidden bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 relative">
        <AuthBackground />
        <div className="flex items-center justify-center w-full relative z-10 p-6">
          <div className="max-w-md w-full space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/40">
                  <span className="text-white font-bold text-2xl">I</span>
                </div>
                <span className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent">ICL</span>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-3xl p-8 shadow-2xl shadow-blue-500/10">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
              </div>
              <h2 className="text-center text-3xl font-bold text-gray-900 mb-3">Password Reset!</h2>
              <p className="text-center text-gray-500 text-sm mb-6">
                Your password has been reset successfully. You can now log in with your new password.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-700 hover:via-blue-600 hover:to-cyan-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/40 transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" /> Go to Login
              </button>
            </div>
            <AuthFooter />
          </div>
        </div>
      </div>
    );
  }

  // ── Main form ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex overflow-hidden bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 relative">
      <AuthBackground />

      <div className="flex w-full max-w-7xl mx-auto relative z-10">
        {/* Left branding */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center p-12 xl:p-20">
          <div className="space-y-8">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/40">
                <span className="text-white font-bold text-2xl">I</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent">ICL</h1>
                <p className="text-sm text-blue-600 font-medium">Innovation & Career Launch</p>
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-5xl font-bold text-gray-900 leading-tight">
                Create a New
                <span className="block bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
                  Password
                </span>
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Choose a strong password to keep your account secure.
              </p>
            </div>
            <div className="space-y-4 pt-2">
              {[
                { icon: ShieldCheck, title: 'At least 8 characters',      desc: 'Longer passwords are stronger' },
                { icon: KeyRound,    title: 'Mix uppercase & lowercase',   desc: 'Combine letters for more security' },
                { icon: ShieldCheck, title: 'Add numbers & symbols',       desc: 'Special chars make it harder to guess' },
                { icon: ShieldCheck, title: 'Keep it unique',              desc: "Don't reuse passwords from other sites" },
              ].map(({ icon: Icon, title, desc }, idx) => (
                <div key={idx} className="flex items-start space-x-4 group hover:translate-x-2 transition-transform duration-300">
                  <div className="text-blue-600 mt-1 bg-white p-2 rounded-lg shadow-sm flex-shrink-0">
                    <Icon size={22} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-gray-900 font-semibold group-hover:text-blue-600 transition-colors">{title}</h3>
                    <p className="text-sm text-gray-500">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="inline-flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/40">
                  <span className="text-white font-bold text-xl">I</span>
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent">ICL</span>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-3xl p-8 shadow-2xl shadow-blue-500/10">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-2xl mb-4 border border-blue-100">
                  <KeyRound className="w-8 h-8 text-blue-600" strokeWidth={1.5} />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Set New Password</h2>
                <p className="text-gray-500 text-sm">Enter and confirm your new password below</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* New password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                  <div className="relative">
                    <input
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => { setNewPassword(e.target.value); setError(''); }}
                      placeholder="At least 6 characters"
                      autoComplete="new-password"
                      className="w-full px-4 py-3.5 pr-12 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition bg-white/70"
                    />
                    <button type="button" onClick={() => setShowNew(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition">
                      {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {/* Strength bar */}
                  {newPassword && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[0,1,2,3].map(i => (
                          <div key={i} className={`flex-1 h-1.5 rounded-full transition-all ${i < strength ? strengthColor[strength] : 'bg-gray-200'}`} />
                        ))}
                      </div>
                      <p className="text-xs text-gray-500">{strengthLabel[strength]}</p>
                    </div>
                  )}
                  {/* Rules */}
                  <ul className="mt-2 space-y-1">
                    <Rule met={newPassword.length >= 8}       text="At least 8 characters" />
                    <Rule met={/[A-Z]/.test(newPassword)}     text="One uppercase letter" />
                    <Rule met={/[0-9]/.test(newPassword)}     text="One number" />
                  </ul>
                </div>

                {/* Confirm password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
                      placeholder="Re-enter your new password"
                      autoComplete="new-password"
                      className={`w-full px-4 py-3.5 pr-12 border rounded-xl text-sm focus:outline-none focus:ring-2 transition bg-white/70 ${
                        confirmPassword && confirmPassword !== newPassword
                          ? 'border-red-300 focus:ring-red-300'
                          : 'border-gray-200 focus:ring-blue-400 focus:border-transparent'
                      }`}
                    />
                    <button type="button" onClick={() => setShowConfirm(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition">
                      {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== newPassword && (
                    <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Passwords do not match
                    </p>
                  )}
                  {confirmPassword && confirmPassword === newPassword && (
                    <p className="mt-1.5 text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Passwords match
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !newPassword || !confirmPassword}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-700 hover:via-blue-600 hover:to-cyan-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/40 hover:shadow-blue-500/60 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin" /> Resetting Password...
                    </span>
                  ) : 'Reset Password'}
                </button>

                <div className="text-center">
                  <button type="button" onClick={() => navigate('/login')}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors inline-flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" /> Back to Login
                  </button>
                </div>
              </form>
            </div>

            <div className="mt-6"><AuthFooter /></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;