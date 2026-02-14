import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api/Api';
import {
  Mail,
  User,
  AlertCircle,
  ArrowRight,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import AuthBackground from '../components/auth/AuthBackground';
import AuthBrandingSidebar from '../components/auth/AuthBrandingSidebar';
import InputField from '../components/auth/InputField';
import PasswordField from '../components/auth/PasswordField';
import SocialLoginButtons from '../components/auth/SocialLoginButtons';
import AuthFooter from '../components/auth/AuthFooter';

const Signup = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [acceptTerms, setAcceptTerms] = useState(false);
  const [receiveUpdates, setReceiveUpdates] = useState(false);
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
        receiveUpdates,
      });

      if (response.success) {
        // Redirect to OTP verification page
        navigate('/verify-otp', {
          state: { email: formData.email.trim() }
        });
      } else {
        setErrors({ submit: response.message || 'Signup failed' });
      }

    } catch (error) {
      setErrors({ submit: error.message || 'Signup failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    console.log('Google signup clicked');
    // TODO: Implement Google OAuth
  };

  const handleFacebookLogin = () => {
    console.log('Facebook signup clicked');
    // TODO: Implement Facebook OAuth
  };

  const handleAppleLogin = () => {
    console.log('Apple signup clicked');
    // TODO: Implement Apple OAuth
  };

  return (
    <div className="min-h-screen flex overflow-hidden bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 relative">
      <AuthBackground />

      <div className="flex w-full max-w-7xl mx-auto relative z-10">
        {/* Left Side - Branding & Features (Hidden on mobile) */}
        <AuthBrandingSidebar />

        {/* Right Side - Signup Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12">
          <div className="w-full max-w-md flex flex-col" style={{ maxHeight: 'calc(100vh)' }}>
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
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-blue-500/10 p-8 sm:p-10 border border-white/50">
                {/* Header */}
                <div className="text-center mb-6">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Create Account
                  </h2>
                  <p className="text-gray-600">
                    Join thousands of professionals advancing their careers
                  </p>
                </div>

                {/* Error Message */}
                {errors.submit && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{errors.submit}</span>
                  </div>
                )}

                {/* Signup Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Full Name */}
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

                  {/* Email */}
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

                  {/* Password */}
                  <PasswordField
                    label="Password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    error={errors.password}
                    placeholder="Create a password"
                    autoComplete="new-password"
                  />

                  {/* Confirm Password */}
                  <PasswordField
                    label="Confirm Password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    error={errors.confirmPassword}
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                  />

                  {/* Terms & Updates */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-start">
                      <input
                        id="accept-terms"
                        name="accept-terms"
                        type="checkbox"
                        checked={acceptTerms}
                        onChange={(e) => {
                          setAcceptTerms(e.target.checked);
                          if (errors.acceptTerms) {
                            setErrors(prev => ({ ...prev, acceptTerms: '' }));
                          }
                        }}
                        className="h-4 w-4 mt-0.5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                      />
                      <label htmlFor="accept-terms" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                        I agree to the{' '}
                        <a href="/terms" className="text-blue-600 hover:text-blue-700 font-semibold">
                          Terms of Service
                        </a>
                        {' '}and{' '}
                        <a href="/privacy" className="text-blue-600 hover:text-blue-700 font-semibold">
                          Privacy Policy
                        </a>
                      </label>
                    </div>
                    {errors.acceptTerms && (
                      <p className="text-sm text-red-600 flex items-center gap-1 ml-6">
                        <AlertCircle className="w-4 h-4" />
                        {errors.acceptTerms}
                      </p>
                    )}

                    <div className="flex items-start">
                      <input
                        id="receive-updates"
                        name="receive-updates"
                        type="checkbox"
                        checked={receiveUpdates}
                        onChange={(e) => setReceiveUpdates(e.target.checked)}
                        className="h-4 w-4 mt-0.5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                      />
                      <label htmlFor="receive-updates" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                        Send me career tips, job opportunities, and platform updates
                      </label>
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
                        Creating Account...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        Create Account
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

                {/* Sign In Link */}
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">
                    Already have an account?{' '}
                    
                    <a  href="/login"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate('/login');
                      }}
                      className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      Sign In
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
    </div>
  );
};

export default Signup;