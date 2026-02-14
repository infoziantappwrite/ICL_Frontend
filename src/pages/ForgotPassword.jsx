// src/pages/ForgotPassword.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api/Api';
import {
  Mail,
  KeyRound,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  Zap,
  Lock,
  CheckCircle2
} from 'lucide-react';
import AuthBackground from '../components/auth/AuthBackground';
import AuthFooter from '../components/auth/AuthFooter';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validateEmail = () => {
    const newErrors = {};
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validateEmail();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      // Replace with real API call when available:
      // await authAPI.forgotPassword(email);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsSubmitted(true);
    } catch (error) {
      setErrors({ submit: error.message || 'Failed to send reset email. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  // ── Success State ─────────────────────────────────────────────────────────────
  if (isSubmitted) {
    return (
      <div className="min-h-screen flex overflow-hidden bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 relative">
        <AuthBackground />

        <div className="flex items-center justify-center w-full relative z-10 p-6">
          <div className="max-w-md w-full space-y-6">
            {/* Logo */}
            <div className="text-center">
              <div className="inline-flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/40">
                  <span className="text-white font-bold text-2xl">I</span>
                </div>
                <span className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent">
                  ICL
                </span>
              </div>
            </div>

            {/* Success Card */}
            <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-3xl p-8 shadow-2xl shadow-blue-500/10">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
              </div>

              <h2 className="text-center text-3xl font-bold text-gray-900 mb-3">
                Check Your Email
              </h2>
              <p className="text-center text-gray-500 text-sm mb-6">
                We've sent a password reset link to{' '}
                <span className="font-semibold text-blue-600">{email}</span>
              </p>

              {/* Info box */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
                <p className="text-sm text-gray-600 text-center">
                  <strong className="text-gray-800">Didn't receive it?</strong> Check your spam folder or{' '}
                  <button
                    onClick={() => setIsSubmitted(false)}
                    className="font-semibold text-blue-600 hover:text-blue-700 underline transition-colors"
                  >
                    try another email
                  </button>
                </p>
              </div>

              <button
                onClick={() => navigate('/login')}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-700 hover:via-blue-600 hover:to-cyan-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/40 hover:shadow-blue-500/60 transition-all duration-300 hover:scale-105"
              >
                <span className="flex items-center justify-center gap-2">
                  <ArrowLeft className="w-5 h-5" />
                  Back to Login
                </span>
              </button>
            </div>

            <AuthFooter />
          </div>
        </div>
      </div>
    );
  }

  // ── Main Form ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex overflow-hidden bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 relative">
      <AuthBackground />

      <div className="flex w-full max-w-7xl mx-auto relative z-10">
        {/* Left Side — Branding (hidden on mobile) */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center p-12 xl:p-20">
          <div className="space-y-8">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/40">
                <span className="text-white font-bold text-2xl">I</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent">
                  ICL
                </h1>
                <p className="text-sm text-blue-600 font-medium">Innovation & Career Launch</p>
              </div>
            </div>

            {/* Heading */}
            <div className="space-y-4">
              <h2 className="text-5xl font-bold text-gray-900 leading-tight">
                Forgot Your
                <span className="block bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
                  Password?
                </span>
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                No worries! We'll help you reset it and get you back to learning in no time.
              </p>
            </div>

            {/* Feature points */}
            <div className="space-y-4 pt-2">
              {[
                { icon: ShieldCheck, title: 'Secure Process',       desc: 'Your account security is our priority' },
                { icon: Zap,         title: 'Quick Reset',          desc: 'Receive reset link within minutes' },
                { icon: Mail,        title: 'Email Verification',   desc: "We'll verify your identity first" },
                { icon: Lock,        title: 'New Password',         desc: 'Create a strong new password' },
              ].map(({ icon: Icon, title, desc }, idx) => (
                <div
                  key={idx}
                  className="flex items-start space-x-4 group hover:translate-x-2 transition-transform duration-300"
                >
                  <div className="text-blue-600 mt-1 bg-white p-2 rounded-lg shadow-sm flex-shrink-0">
                    <Icon size={22} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-gray-900 font-semibold group-hover:text-blue-600 transition-colors">
                      {title}
                    </h3>
                    <p className="text-sm text-gray-500">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Support note */}
            <div className="px-6 py-4 bg-white/60 backdrop-blur-sm border border-blue-100 rounded-2xl shadow-sm">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">Need help?</span> Contact our support team at{' '}
                <a
                  href="mailto:support@icl.com"
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  support@icl.com
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Right Side — Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="inline-flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/40">
                  <span className="text-white font-bold text-xl">I</span>
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent">
                  ICL
                </span>
              </div>
            </div>

            {/* Card */}
            <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-3xl p-8 shadow-2xl shadow-blue-500/10">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-2xl mb-4 border border-blue-100">
                  <KeyRound className="w-8 h-8 text-blue-600" strokeWidth={1.5} />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Reset Password</h2>
                <p className="text-gray-500 text-sm">Enter your email to receive a reset link</p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {errors.submit && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{errors.submit}</span>
                  </div>
                )}

                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors({});
                      }}
                      className={`w-full pl-12 pr-4 py-3.5 bg-white/70 border ${
                        errors.email ? 'border-red-300 focus:ring-red-100' : 'border-gray-200 focus:ring-blue-100'
                      } rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:border-blue-500 transition-all duration-200`}
                      placeholder="you@example.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-700 hover:via-blue-600 hover:to-cyan-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/40 hover:shadow-blue-500/60 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Sending Reset Link...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Send Reset Link
                      <ArrowRight className="w-5 h-5" />
                    </span>
                  )}
                </button>

                {/* Back to Login */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors inline-flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Login
                  </button>
                </div>
              </form>

              {/* Sign Up Link */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <p className="text-center text-sm text-gray-500">
                  Don't have an account?{' '}
                  <button
                    onClick={() => navigate('/signup')}
                    className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Create Account
                  </button>
                </p>
              </div>
            </div>

            <div className="mt-6">
              <AuthFooter />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;