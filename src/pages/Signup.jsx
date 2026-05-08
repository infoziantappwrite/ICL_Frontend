// src/pages/Signup.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api/Api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';
import {
  Mail,
  User,
  AlertCircle,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import AuthBackground from '../components/auth/AuthBackground';
import AuthBrandingSidebar from '../components/auth/AuthBrandingSidebar';
import InputField from '../components/auth/InputField';
import PasswordField from '../components/auth/PasswordField';

import infoziantLogo from '../assets/logo.png';

const Signup = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!acceptTerms) {
      newErrors.acceptTerms = 'You must accept terms and conditions';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setIsLoading(true);
    try {
      const response = await authAPI.signup({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        receiveUpdates: false,
      });
      if (response.success) {
        toast.success('Account Created!', 'Please verify your email to continue.');
        navigate('/verify-otp', { state: { email: formData.email.trim() } });
      } else {
        setErrors({ submit: response.message || 'Signup failed' });
        toast.error('Signup Failed', response.message || 'Could not create account. Please try again.');
      }
    } catch (error) {
      setErrors({ submit: error.message || 'Signup failed' });
      toast.error('Signup Failed', error.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        }).then(r => r.json());
        const response = await authAPI.googleAuth(userInfo);
        if (response.success) {
          login(response.user, response.accessToken);
          toast.success('Account Created!', 'Signed up with Google successfully.');
          const roleRoutes = {
            student: '/dashboard/student',
            candidate: '/dashboard/student',
            college_admin: '/dashboard/college-admin',
            super_admin: '/dashboard/super-admin',
          };
          navigate(roleRoutes[response.user.role] || '/dashboard');
        } else {
          toast.error('Google Signup Failed', response.message || 'Could not sign up with Google.');
        }
      } catch (err) {
        toast.error('Google Signup Failed', err.message || 'Something went wrong.');
      }
    },
    onError: () => {
      toast.error('Google Error', 'Google sign-in was cancelled or failed.');
    },
    flow: 'implicit',
  });

  return (
    <div className="h-screen flex overflow-hidden relative bg-[#f4f8ff]">
      <AuthBackground />

      <div className="flex w-full h-full max-w-[1440px] mx-auto relative z-10">
        <AuthBrandingSidebar />

        {/* Right panel */}
        <div className="w-full lg:w-1/2 h-full flex flex-col items-center justify-center px-6 sm:px-10 lg:px-14">
          <div className="w-full max-w-[420px] py-2">

            {/* Mobile Logo */}
            <div className="lg:hidden mb-3 text-center">
              <img src={infoziantLogo} alt="Infoziant" className="h-9 mx-auto" />
            </div>

            {/* Form Card */}
            <div
              className="bg-white rounded-2xl border border-gray-100"
              style={{
                padding: '24px 28px',
                boxShadow: '0 4px 32px rgba(13,43,140,0.09), 0 1px 4px rgba(13,43,140,0.05)',
              }}
            >
              {/* Header */}
              <div className="text-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Create Account</h2>
              </div>

              {/* Error */}
              {errors.submit && (
                <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="text-xs">{errors.submit}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                <InputField
                  label="Full Name"
                  icon={User}
                  type="text"
                  name="fullName"
                  autoComplete="name"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  error={errors.fullName}
                />

                <InputField
                  label="Email Address"
                  icon={Mail}
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  error={errors.email}
                />

                {/* Password fields — side by side on md+, stacked on mobile */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <PasswordField
                    label="Password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    error={errors.password}
                    placeholder="Create a password"
                    autoComplete="new-password"
                  />
                  <PasswordField
                    label="Confirm Password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    error={errors.confirmPassword}
                    placeholder="Confirm password"
                    autoComplete="new-password"
                  />
                </div>

                {/* Terms only (removed "receive updates") */}
                <div>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      id="accept-terms"
                      name="accept-terms"
                      type="checkbox"
                      checked={acceptTerms}
                      onChange={(e) => {
                        setAcceptTerms(e.target.checked);
                        if (errors.acceptTerms) setErrors(prev => ({ ...prev, acceptTerms: '' }));
                      }}
                      className="h-3.5 w-3.5 mt-0.5 border-gray-300 rounded cursor-pointer flex-shrink-0"
                      style={{ accentColor: '#0d2b8c' }}
                    />
                    <span className="text-xs text-gray-600">
                      I agree to the{' '}
                      <a
                        href="/terms"
                        className="font-semibold transition-colors"
                        style={{ color: '#0d2b8c' }}
                        onMouseOver={e => e.currentTarget.style.color = '#17a8c8'}
                        onMouseOut={e => e.currentTarget.style.color = '#0d2b8c'}
                      >
                        Terms of Service
                      </a>
                      {' '}and{' '}
                      <a
                        href="/privacy"
                        className="font-semibold transition-colors"
                        style={{ color: '#0d2b8c' }}
                        onMouseOver={e => e.currentTarget.style.color = '#17a8c8'}
                        onMouseOut={e => e.currentTarget.style.color = '#0d2b8c'}
                      >
                        Privacy Policy
                      </a>
                    </span>
                  </label>
                  {errors.acceptTerms && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1 ml-5">
                      <AlertCircle className="w-3.5 h-3.5" />{errors.acceptTerms}
                    </p>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 text-white text-sm font-semibold rounded-xl transition-all duration-300 cursor-pointer hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  style={{
                    background: 'linear-gradient(135deg, #0d2b8c 0%, #1060c0 50%, #17a8c8 100%)',
                    boxShadow: '0 4px 16px rgba(13,43,140,0.30)',
                  }}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Creating Account...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Create Account <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </button>

                {/* Divider */}
                <div className="relative flex items-center gap-3 py-0.5">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400 whitespace-nowrap">or continue with</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* Google OAuth only */}
                <button
                  type="button"
                  onClick={() => handleGoogleLogin()}
                  className="w-full flex items-center justify-center gap-3 py-2 px-4 border border-gray-200 rounded-xl bg-white cursor-pointer hover:bg-gray-50 transition-all duration-200 hover:border-gray-300 hover:shadow-sm"
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
                    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
                  </svg>
                  <span className="text-sm font-medium text-gray-600">Continue with Google</span>
                </button>
              </form>

              {/* Sign in link */}
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-400">
                  Already have an account?{' '}
                  <a
                    href="/login"
                    onClick={(e) => { e.preventDefault(); navigate('/login'); }}
                    className="font-semibold transition-colors"
                    style={{ color: '#0d2b8c' }}
                    onMouseOver={e => e.currentTarget.style.color = '#17a8c8'}
                    onMouseOut={e => e.currentTarget.style.color = '#0d2b8c'}
                  >
                    Sign In
                  </a>
                </p>
              </div>
            </div>

            {/* Footer — removed Terms & Help links */}
            <div className="mt-2 text-center">
              <p className="text-xs text-gray-400">
                © {new Date().getFullYear()} Infoziant. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;