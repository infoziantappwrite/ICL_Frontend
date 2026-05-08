// src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authAPI } from '../api/Api';
import { useGoogleLogin } from '@react-oauth/google';
import {
  Mail,
  AlertCircle,
  ArrowRight,
  Loader2
} from 'lucide-react';
import AuthBackground from '../components/auth/AuthBackground';
import AuthBrandingSidebar from '../components/auth/AuthBrandingSidebar';
import InputField from '../components/auth/InputField';
import PasswordField from '../components/auth/PasswordField';
import AuthFooter from '../components/auth/AuthFooter';
import infoziantLogo from '../assets/logo.png';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const toast = useToast();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [rememberMe, setRememberMe] = useState(false);
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
      const response = await authAPI.login(formData.email, formData.password);
      if (response.success) {
        login(response.user, response.accessToken);
        toast.success('Welcome back!', `Signed in as ${response.user.email}`);
        if (response.isFirstLogin && response.nextStep === 'CHANGE_PASSWORD') {
          navigate('/change-password', { replace: true });
          return;
        }
        const roleRoutes = {
          student: '/dashboard/student',
          candidate: '/dashboard/student',
          college_admin: '/dashboard/college-admin',
          super_admin: '/dashboard/super-admin',
        };
        navigate(roleRoutes[response.user.role] || '/dashboard');
      } else {
        setErrors({ submit: response.message || 'Login failed. Please try again.' });
        toast.error('Login Failed', response.message || 'Invalid credentials. Please try again.');
      }
    } catch (error) {
      setErrors({ submit: error.message || 'Login failed. Please try again.' });
      toast.error('Login Failed', error.message || 'Something went wrong. Please try again.');
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
          toast.success('Welcome back!', 'Logged in with Google successfully.');
          const roleRoutes = {
            student: '/dashboard/student',
            candidate: '/dashboard/student',
            college_admin: '/dashboard/college-admin',
            super_admin: '/dashboard/super-admin',
          };
          navigate(roleRoutes[response.user.role] || '/dashboard');
        } else {
          setErrors({ submit: response.message || 'Google login failed' });
          toast.error('Google Login Failed', response.message || 'Could not log in with Google.');
        }
      } catch (err) {
        setErrors({ submit: err.message || 'Google login failed' });
        toast.error('Google Login Failed', err.message || 'Something went wrong.');
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
          <div className="w-full max-w-[420px]">

            {/* Mobile Logo */}
            <div className="lg:hidden mb-6 text-center">
              <img src={infoziantLogo} alt="Infoziant" className="h-9 mx-auto" />
            </div>

            {/* Form Card */}
            <div
              className="bg-white rounded-2xl border border-gray-100"
              style={{
                padding: '32px 36px',
                boxShadow: '0 4px 32px rgba(13,43,140,0.09), 0 1px 4px rgba(13,43,140,0.05)',
              }}
            >
              {/* Header */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome Back</h2>
                <p className="text-sm text-gray-400">Sign in to continue your journey</p>
              </div>

              {/* Error */}
              {errors.submit && (
                <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="text-xs">{errors.submit}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
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

                <PasswordField
                  label="Password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  error={errors.password}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />

                {/* Remember + Forgot */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-3.5 w-3.5 border-gray-300 rounded cursor-pointer"
                      style={{ accentColor: '#0d2b8c' }}
                    />
                    <span className="text-xs text-gray-500">Remember me</span>
                  </label>
                  <a
                    href="/forgot-password"
                    className="text-xs font-semibold transition-colors"
                    style={{ color: '#0d2b8c' }}
                    onMouseOver={e => e.currentTarget.style.color = '#17a8c8'}
                    onMouseOut={e => e.currentTarget.style.color = '#0d2b8c'}
                  >
                    Forgot password?
                  </a>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 text-white text-sm font-semibold rounded-xl transition-all duration-300 cursor-pointer hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  style={{
                    background: 'linear-gradient(135deg, #0d2b8c 0%, #1060c0 50%, #17a8c8 100%)',
                    boxShadow: '0 4px 16px rgba(13,43,140,0.30)',
                  }}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Signing In...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Sign In <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </button>

                {/* Divider */}
                <div className="relative flex items-center gap-3 py-1">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400 whitespace-nowrap">or continue with</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* Google OAuth only */}
                <button
                  type="button"
                  onClick={() => handleGoogleLogin()}
                  className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-gray-200 rounded-xl bg-white cursor-pointer hover:bg-gray-50 transition-all duration-200 hover:border-gray-300 hover:shadow-sm"
                >
                  {/* Google SVG icon */}
                  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                  </svg>
                  <span className="text-sm font-medium text-gray-600">Continue with Google</span>
                </button>
              </form>

              {/* Sign up link */}
              <div className="mt-5 text-center">
                <p className="text-xs text-gray-400">
                  Don't have an account?{' '}
                  <a
                    href="/signup"
                    onClick={(e) => { e.preventDefault(); navigate('/signup'); }}
                    className="font-semibold transition-colors"
                    style={{ color: '#0d2b8c' }}
                    onMouseOver={e => e.currentTarget.style.color = '#17a8c8'}
                    onMouseOut={e => e.currentTarget.style.color = '#0d2b8c'}
                  >
                    Create Account
                  </a>
                </p>
              </div>
            </div>

            {/* Footer — removed Terms & Help links */}
            <div className="mt-4 text-center">
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

export default Login;