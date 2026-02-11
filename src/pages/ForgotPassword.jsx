import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  KeyRound,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  Zap,
  Lock
} from 'lucide-react';
 
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
      newErrors.email = 'Email is invalid';
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
      console.log('Password reset email sent to:', email);
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsSubmitted(true);
    } catch (error) {
      setErrors({ submit: 'Failed to send reset email. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };
 
  if (isSubmitted) {
    return (
      <div className="min-h-screen flex overflow-hidden bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 relative">
        {/* Enhanced Background Pattern with Brand Colors */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Animated gradient orbs */}
          <div className="absolute top-0 -left-20 w-96 h-96 bg-gradient-to-br from-cyan-200 to-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute top-40 -right-20 w-96 h-96 bg-gradient-to-br from-blue-300 to-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-20 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-gradient-to-br from-cyan-300 to-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
          
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]"></div>
        </div>
 
        <div className="flex items-center justify-center w-full relative z-10 p-6">
          <div className="max-w-md w-full space-y-8">
            {/* Mobile Logo */}
            <div className="text-center">
              <div className="inline-flex items-center space-x-2 mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/40">
                  <span className="text-white font-bold text-2xl">I</span>
                </div>
                <span className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent">ICL</span>
              </div>
            </div>
 
            {/* Success Card */}
            <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-3xl p-8 shadow-2xl shadow-blue-500/10">
              {/* Success Icon */}
              <div className="flex justify-center mb-6">
                <div className="rounded-full bg-green-50 p-4 border-2 border-green-200">
                  <Mail className="h-16 w-16 text-green-600" strokeWidth={1.5} />
                </div>
              </div>
 
              <h2 className="text-center text-3xl font-bold text-gray-900 mb-4">
                Check your email
              </h2>
             
              <p className="text-center text-gray-600 mb-6">
                We have sent a password reset link to{' '}
                <span className="font-semibold text-blue-600">{email}</span>
              </p>
 
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-gray-700">
                  <strong className="text-gray-900">Did not receive the email?</strong> Check your spam folder or{' '}
                  <button
                    onClick={() => setIsSubmitted(false)}
                    className="font-semibold text-blue-600 hover:text-blue-700 underline transition-colors"
                  >
                    try another email address
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
 
            {/* Footer Links */}
            <div className="text-center">
              <div className="flex justify-center space-x-6 text-sm text-gray-600">
                <a href="/terms" className="hover:text-blue-600 transition-colors">Terms</a>
                <span>•</span>
                <a href="/privacy" className="hover:text-blue-600 transition-colors">Privacy</a>
                <span>•</span>
                <a href="/help" className="hover:text-blue-600 transition-colors">Help</a>
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes blob {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
          }
          .animate-blob {
            animation: blob 7s infinite;
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
          .animation-delay-4000 {
            animation-delay: 4s;
          }
          .bg-grid-pattern {
            background-image: 
              linear-gradient(to right, rgb(59 130 246 / 0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgb(59 130 246 / 0.1) 1px, transparent 1px);
            background-size: 40px 40px;
          }
        `}</style>
      </div>
    );
  }
 
  return (
    <div className="min-h-screen flex overflow-hidden bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 relative">
      {/* Enhanced Background Pattern with Brand Colors */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Animated gradient orbs */}
        <div className="absolute top-0 -left-20 w-96 h-96 bg-gradient-to-br from-cyan-200 to-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 -right-20 w-96 h-96 bg-gradient-to-br from-blue-300 to-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-20 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-gradient-to-br from-cyan-300 to-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]"></div>
      </div>
 
      <div className="flex w-full max-w-7xl mx-auto relative z-10">
        {/* Left Side - Branding & Info (Hidden on mobile) */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center p-12 xl:p-20">
          <div className="space-y-8">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/40">
                <span className="text-white font-bold text-2xl">I</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent">ICL</h1>
                <p className="text-sm text-blue-600 font-medium">Innovation & Career Launch</p>
              </div>
            </div>
 
            {/* Main Heading */}
            <div className="space-y-4">
              <h2 className="text-5xl font-bold text-gray-900 leading-tight">
                Forgot Your
                <span className="block bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
                  Password?
                </span>
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                No worries! We will help you reset it and get you back to learning
                in no time.
              </p>
            </div>
 
            {/* Info Points */}
            <div className="space-y-4 pt-4">
              {[
                { icon: ShieldCheck, title: 'Secure Process', desc: 'Your account security is our priority' },
                { icon: Zap, title: 'Quick Reset', desc: 'Receive reset link within minutes' },
                { icon: Mail, title: 'Email Verification', desc: 'We will verify your identity first' },
                { icon: Lock, title: 'New Password', desc: 'Create a strong new password' }
              ].map((feature, idx) => {
                const IconComponent = feature.icon;
                return (
                  <div
                    key={idx}
                    className="flex items-start space-x-4 group hover:translate-x-2 transition-transform duration-300"
                  >
                    <div className="text-blue-600 mt-1 bg-white p-2 rounded-lg shadow-sm">
                      <IconComponent size={24} strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="text-gray-900 font-semibold group-hover:text-blue-600 transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-gray-600">{feature.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
 
            {/* Help Text */}
            <div className="pt-8 px-6 py-4 bg-white/60 backdrop-blur-sm border border-blue-100 rounded-2xl shadow-sm">
              <p className="text-sm text-gray-700">
                <span className="font-semibold text-gray-900">Need help?</span> Contact our support team at{' '}
                <a href="mailto:support@ICL.com" className="text-blue-600 hover:text-blue-700 transition-colors font-medium">
                  support@ICL.com
                </a>
              </p>
            </div>
          </div>
        </div>
 
        {/* Right Side - Reset Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="inline-flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/40">
                  <span className="text-white font-bold text-xl">I</span>
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent">ICL</span>
              </div>
            </div>
 
            {/* Form Container */}
            <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-3xl p-8 shadow-2xl shadow-blue-500/10">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-2xl mb-4 border border-blue-100">
                  <KeyRound className="w-8 h-8 text-blue-600" strokeWidth={1.5} />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Reset Password</h2>
                <p className="text-gray-600">Enter your email to receive a reset link</p>
              </div>
 
              {/* Form */}
              <form className="space-y-6" onSubmit={handleSubmit}>
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
                        if (errors.email) {
                          setErrors({});
                        }
                      }}
                      className={`w-full pl-12 pr-4 py-3.5 bg-white/70 border ${
                        errors.email ? 'border-red-300' : 'border-gray-200'
                      } rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300`}
                      placeholder="you@example.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.email}
                    </p>
                  )}
                </div>
 
                {/* Submit Button */}
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
                <div className="text-center pt-2">
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
              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-center text-sm text-gray-600">
                  Don't have an account?{' '}
                  <a
                    href="/signup"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate('/signup');
                    }}
                    className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Create Account
                  </a>
                </p>
              </div>
            </div>
 
            {/* Footer Links */}
            <div className="mt-8 text-center">
              <div className="flex justify-center space-x-6 text-sm text-gray-600">
                <a href="/terms" className="hover:text-blue-600 transition-colors">Terms</a>
                <span>•</span>
                <a href="/privacy" className="hover:text-blue-600 transition-colors">Privacy</a>
                <span>•</span>
                <a href="/help" className="hover:text-blue-600 transition-colors">Help</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .bg-grid-pattern {
          background-image: 
            linear-gradient(to right, rgb(59 130 246 / 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgb(59 130 246 / 0.1) 1px, transparent 1px);
          background-size: 40px 40px;
        }
      `}</style>
    </div>
  );
};
 
export default ForgotPassword;