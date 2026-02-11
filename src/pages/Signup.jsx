import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api/Api';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  ArrowRight, 
  Loader2,
  User,
  CheckCircle2,
  Rocket,
  BookOpen,
  Briefcase,
  Target,
  ShieldCheck
} from 'lucide-react';

const Signup = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [receiveUpdates, setReceiveUpdates] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // OTP Verification States
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

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
    
    // If email is changed after verification, reset verification
    if (name === 'email' && isEmailVerified) {
      setIsEmailVerified(false);
      setShowOtpInput(false);
      setOtpSent(false);
      setOtp('');
    }
  };

  // Handle Send OTP
  const handleSendOtp = async () => {
    // Validate email first
    if (!formData.email) {
      setErrors(prev => ({ ...prev, email: 'Email is required' }));
      return;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setErrors(prev => ({ ...prev, email: 'Email is invalid' }));
      return;
    }

    setIsSendingOtp(true);
    setOtpError('');

    try {
      // API call to send OTP
      const response = await authAPI.sendOtp({
        email: formData.email.trim(),
        purpose: 'signup'
      });

      if (response.success) {
        setOtpSent(true);
        setShowOtpInput(true);
        // Start resend timer (60 seconds)
        setResendTimer(60);
        const interval = setInterval(() => {
          setResendTimer(prev => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setOtpError(response.message || 'Failed to send OTP. Please try again.');
      }
    } catch (error) {
      setOtpError(error.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Handle Verify OTP
  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      setOtpError('Please enter a valid 6-digit OTP');
      return;
    }

    setIsVerifyingOtp(true);
    setOtpError('');

    try {
      // API call to verify OTP
      const response = await authAPI.verifyOtp({
        email: formData.email.trim(),
        otp: otp,
        purpose: 'signup'
      });

      if (response.success) {
        setIsEmailVerified(true);
        setShowOtpInput(false);
        setOtpError('');
      } else {
        setOtpError(response.message || 'Invalid OTP. Please try again.');
      }
    } catch (error) {
      setOtpError(error.message || 'Failed to verify OTP. Please try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!isEmailVerified) {
      newErrors.email = 'Please verify your email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!acceptTerms) {
      newErrors.acceptTerms = 'You must accept the terms and conditions';
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
      // API call to register
      const response = await authAPI.signup({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        receiveUpdates,
      });

      
      if (response.success) {
        // Auto-login user after successful registration
        login(response.user, response.token);

        // Redirect to dashboard or appropriate page
        const roleRoutes = {
          candidate: '/dashboard',
          employer: '/dashboard/employer',
          admin: '/dashboard/admin',
        };

        navigate(roleRoutes[response.user.role] || '/dashboard');
      } else {
        setErrors({ submit: response.message || 'Signup failed. Please try again.' });
      }
    } catch (error) {
      setErrors({ submit: error.message || 'Signup failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    console.log('Google signup clicked');
    // TODO: Implement Google OAuth
  };

  const handleFacebookSignup = () => {
    console.log('Facebook signup clicked');
    // TODO: Implement Facebook OAuth
  };

  const handleAppleSignup = () => {
    console.log('Apple signup clicked');
    // TODO: Implement Apple OAuth
  };

  const getPasswordStrength = () => {
    const password = formData.password;
    if (!password) return { strength: 0, text: '', color: '' };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    
    if (strength <= 2) return { strength: 33, text: 'Weak', color: 'bg-red-400' };
    if (strength <= 3) return { strength: 66, text: 'Medium', color: 'bg-yellow-400' };
    return { strength: 100, text: 'Strong', color: 'bg-green-400' };
  };

  const passwordStrength = getPasswordStrength();

  const features = [
    { 
      icon: Rocket, 
      title: 'Quick Start', 
      desc: 'Get started in under 2 minutes' 
    },
    { 
      icon: BookOpen, 
      title: 'Expert Courses', 
      desc: 'Learn from industry leaders' 
    },
    { 
      icon: Briefcase, 
      title: 'Job Portal', 
      desc: 'Access exclusive opportunities' 
    },
    { 
      icon: Target, 
      title: 'Career Tools', 
      desc: 'Resume builder & more' 
    }
  ];

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
        {/* Left Side - Branding & Features (Hidden on mobile) */}
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
                Start Your
                <span className="block bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
                  Learning Journey
                </span>
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                Join thousands of students transforming their careers through our 
                comprehensive learning platform and job opportunities.
              </p>
            </div>

            {/* Features List */}
            <div className="space-y-4 pt-4">
              {features.map((feature, idx) => {
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

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8">
              {[
                { value: '10K+', label: 'Students' },
                { value: '500+', label: 'Courses' },
                { value: '95%', label: 'Success Rate' }
              ].map((stat, idx) => (
                <div key={idx} className="text-center bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-sm">
                  <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">{stat.value}</div>
                  <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Signup Form */}
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

            {/* Form Container - Glassmorphism */}
            <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-3xl p-8 shadow-2xl shadow-blue-500/10 max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
                <p className="text-gray-600">Join us and start your journey today</p>
              </div>

              {/* Form */}
              <form className="space-y-5" onSubmit={handleSubmit}>
                {/* General Error Message */}
                {errors.submit && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{errors.submit}</span>
                  </div>
                )}

                {/* Full Name Field */}
                <div>
                  <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      autoComplete="name"
                      value={formData.fullName}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-4 py-3.5 bg-white/70 border ${
                        errors.fullName ? 'border-red-300' : 'border-gray-200'
                      } rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300`}
                      placeholder="Enter your full name"
                    />
                  </div>
                  {errors.fullName && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.fullName}
                    </p>
                  )}
                </div>

                {/* Email Field with OTP Verification */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={isEmailVerified}
                        className={`w-full pl-12 pr-4 py-3.5 bg-white/70 border ${
                          errors.email ? 'border-red-300' : isEmailVerified ? 'border-green-300' : 'border-gray-200'
                        } rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                          isEmailVerified ? 'bg-green-50/50' : ''
                        }`}
                        placeholder="you@example.com"
                      />
                      {isEmailVerified && (
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        </div>
                      )}
                    </div>
                    
                    {!isEmailVerified && (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={isSendingOtp || resendTimer > 0}
                        className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        {isSendingOtp ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : resendTimer > 0 ? (
                          `${resendTimer}s`
                        ) : otpSent ? (
                          'Resend'
                        ) : (
                          'Verify'
                        )}
                      </button>
                    )}
                  </div>
                  
                  {errors.email && !showOtpInput && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.email}
                    </p>
                  )}
                  
                  {isEmailVerified && (
                    <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      Email verified successfully
                    </p>
                  )}

                  {/* OTP Input Field */}
                  {showOtpInput && !isEmailVerified && (
                    <div className="mt-3 p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <ShieldCheck className="w-5 h-5 text-blue-600" />
                        <p className="text-sm text-blue-900 font-medium">
                          Enter the 6-digit OTP sent to your email
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={otp}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                            setOtp(value);
                            setOtpError('');
                          }}
                          maxLength={6}
                          placeholder="000000"
                          className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 text-center text-lg font-semibold tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyOtp}
                          disabled={isVerifyingOtp || otp.length !== 6}
                          className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isVerifyingOtp ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            'Verify'
                          )}
                        </button>
                      </div>
                      
                      {otpError && (
                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {otpError}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-12 py-3.5 bg-white/70 border ${
                        errors.password ? 'border-red-300' : 'border-gray-200'
                      } rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300`}
                      placeholder="Create a password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      {showPassword ? (
                        <Eye className="h-5 w-5" />
                      ) : (
                        <EyeOff className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  
                  {/* Password Strength Indicator */}
                  {formData.password && (
                    <div className="mt-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${passwordStrength.color} transition-all duration-300`}
                            style={{ width: `${passwordStrength.strength}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium text-gray-600">
                          {passwordStrength.text}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {errors.password && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.password}
                    </p>
                  )}
                  
                  <p className="mt-2 text-xs text-gray-500">
                    Use 8+ characters with uppercase, lowercase, and numbers
                  </p>
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <CheckCircle2 className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`w-full pl-12 pr-12 py-3.5 bg-white/70 border ${
                        errors.confirmPassword ? 'border-red-300' : 'border-gray-200'
                      } rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300`}
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      {showConfirmPassword ? (
                        <Eye className="h-5 w-5" />
                      ) : (
                        <EyeOff className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                {/* Terms and Conditions */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-start">
                    <div className="flex items-center h-5 mt-0.5">
                      <input
                        id="acceptTerms"
                        name="acceptTerms"
                        type="checkbox"
                        checked={acceptTerms}
                        onChange={(e) => {
                          setAcceptTerms(e.target.checked);
                          if (errors.acceptTerms) {
                            setErrors(prev => ({ ...prev, acceptTerms: '' }));
                          }
                        }}
                        className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer ${
                          errors.acceptTerms ? 'border-red-300' : ''
                        }`}
                      />
                    </div>
                    <div className="ml-3">
                      <label htmlFor="acceptTerms" className="text-sm text-gray-700 cursor-pointer">
                        I agree to the{' '}
                        <a href="/terms" className="font-semibold text-blue-600 hover:text-blue-700">
                          Terms of Service
                        </a>{' '}
                        and{' '}
                        <a href="/privacy" className="font-semibold text-blue-600 hover:text-blue-700">
                          Privacy Policy
                        </a>
                      </label>
                      {errors.acceptTerms && (
                        <p className="mt-1 text-sm text-red-600">{errors.acceptTerms}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex items-center h-5 mt-0.5">
                      <input
                        id="receiveUpdates"
                        name="receiveUpdates"
                        type="checkbox"
                        checked={receiveUpdates}
                        onChange={(e) => setReceiveUpdates(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                      />
                    </div>
                    <div className="ml-3">
                      <label htmlFor="receiveUpdates" className="text-sm text-gray-700 cursor-pointer">
                        Send me updates about courses, features, and offers
                      </label>
                    </div>
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

                {/* Divider - "or sign up with" */}
                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white/80 text-gray-500">or sign up with</span>
                  </div>
                </div>

                {/* Social Signup Buttons - Horizontal */}
                <div className="grid grid-cols-3 gap-3">
                  {/* Google */}
                  <button
                    type="button"
                    onClick={handleGoogleSignup}
                    className="flex items-center justify-center p-3.5 bg-white/70 hover:bg-white border border-gray-200 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-md"
                    title="Sign up with Google"
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </button>

                  {/* Facebook */}
                  <button
                    type="button"
                    onClick={handleFacebookSignup}
                    className="flex items-center justify-center p-3.5 bg-white/70 hover:bg-white border border-gray-200 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-md"
                    title="Sign up with Facebook"
                  >
                    <svg className="w-6 h-6" fill="#1877F2" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </button>

                  {/* Apple */}
                  <button
                    type="button"
                    onClick={handleAppleSignup}
                    className="flex items-center justify-center p-3.5 bg-white/70 hover:bg-white border border-gray-200 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-md"
                    title="Sign up with Apple"
                  >
                    <svg className="w-6 h-6 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                  </button>
                </div>
              </form>

              {/* Login Link */}
              <div className="mt-8 text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <a
                    href="/login"
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

export default Signup;