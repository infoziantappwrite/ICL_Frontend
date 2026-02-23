// src/pages/Login.jsx - SIMPLIFIED VERSION (Always to Dashboard)
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authAPI } from '../api/Api';
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
import SocialLoginButtons from '../components/auth/SocialLoginButtons';
import AuthFooter from '../components/auth/AuthFooter';
 
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
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
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
      console.log('🔐 Attempting login...');
      // API call to login
      const response = await authAPI.login(formData.email, formData.password);
      
      if (response.success) {
        console.log('✅ Login successful for user:', response.user.email, 'with role:', response.user.role);
        
        // Login user using AuthContext
        login(response.user, response.token);

        toast.success('Welcome back!', `Signed in as ${response.user.email}`);

        // ⚠️ SIMPLIFIED FLOW: Role-based routing - ALWAYS go to respective dashboard
        const roleRoutes = {
          student: '/dashboard/student',
          candidate: '/dashboard/student', // Both student and candidate go to same dashboard
          college_admin: '/dashboard/college-admin',
          super_admin: '/dashboard/super-admin',
        };

        // Redirect to role-specific dashboard
        const redirectPath = roleRoutes[response.user.role] || '/dashboard';
        console.log('🎯 Redirecting to:', redirectPath);
        navigate(redirectPath);
      } else {
        setErrors({ submit: response.message || 'Login failed. Please try again.' });
        toast.error('Login Failed', response.message || 'Invalid credentials. Please try again.');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      setErrors({ submit: error.message || 'Login failed. Please try again.' });
      toast.error('Login Failed', error.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
 
  const handleGoogleLogin = () => {
    console.log('Google login clicked');
    // TODO: Implement Google OAuth
  };
 
  const handleFacebookLogin = () => {
    console.log('Facebook login clicked');
    // TODO: Implement Facebook OAuth
  };
 
  const handleAppleLogin = () => {
    console.log('Apple login clicked');
    // TODO: Implement Apple OAuth
  };
 
  return (
    <div className="min-h-screen flex overflow-hidden bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 relative">
      <AuthBackground />
 
      <div className="flex w-full max-w-7xl mx-auto relative z-10">
        {/* Left Side - Branding & Features (Hidden on mobile) */}
        <AuthBrandingSidebar />
 
        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12">
          <div className="w-full max-w-md h-full flex flex-col">
            {/* Mobile Logo (Visible only on mobile) */}
            <div className="lg:hidden mb-6 text-center flex-shrink-0">
              <div className="inline-flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/40">
                  <span className="text-white font-bold text-xl">I</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent">ICL</h1>
                </div>
              </div>
            </div>
 
            {/* Scrollable Form Container */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-blue-500/10 p-8 sm:p-10 border border-white/50">
                {/* Header */}
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Welcome Back
                  </h2>
                  <p className="text-gray-600">
                    Sign in to continue your journey
                  </p>
                </div>
 
                {/* Error Message */}
                {errors.submit && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{errors.submit}</span>
                  </div>
                )}
 
                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Email Field */}
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
 
                  {/* Password Field */}
                  <PasswordField
                    label="Password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    error={errors.password}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
 
                  {/* Remember Me & Forgot Password */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center">
                      <input
                        id="remember-me"
                        name="remember-me"
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                      />
                      <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                        Remember me
                      </label>
                    </div>
 
                    <div className="text-sm">
                      <a
                        href="/forgot-password"
                        className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        Forgot password?
                      </a>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-6 py-3.5 px-4 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-700 hover:via-blue-600 hover:to-cyan-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/40 hover:shadow-blue-500/60 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Signing In...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        Sign In
                        <ArrowRight className="w-5 h-5" />
                      </span>
                    )}
                  </button>
 
                  {/* Social Login */}
                  <SocialLoginButtons
                    onGoogleLogin={handleGoogleLogin}
                    onFacebookLogin={handleFacebookLogin}
                    onAppleLogin={handleAppleLogin}
                  />
                </form>
 
                {/* Sign Up Link */}
                <div className="mt-8 text-center">
                  <p className="text-sm text-gray-600">
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
            </div>
 
            {/* Footer Links - Fixed at bottom */}
            <div className="flex-shrink-0 mt-6">
              <AuthFooter />
            </div>
          </div>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.3);
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.5);
        }

        /* For Firefox */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(59, 130, 246, 0.3) transparent;
        }
      `}</style>
    </div>
  );
};
 
export default Login;