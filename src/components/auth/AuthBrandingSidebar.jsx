import {
  BookOpen,
  Briefcase,
  FileText,
  GraduationCap,
  User,
  Shield,
  Zap,
  Target
} from 'lucide-react';
import { useLocation } from 'react-router-dom';

const AuthBrandingSidebar = () => {
  const location = useLocation();
  const isSignupPage = location.pathname === '/signup';

  // Features for Login page
  const loginFeatures = [
    {
      icon: BookOpen,
      title: 'Expert-Led Courses',
      desc: 'Learn from industry professionals'
    },
    {
      icon: Briefcase,
      title: 'Job Opportunities',
      desc: 'Connect with top employers'
    },
    {
      icon: FileText,
      title: 'Resume Builder',
      desc: 'Create stunning resumes in minutes'
    },
    {
      icon: GraduationCap,
      title: 'Career Growth',
      desc: 'Track and accelerate your progress'
    }
  ];

  // Features for Signup page
  const signupFeatures = [
    {
      icon: User,
      title: 'Free Account',
      desc: 'Get started with no credit card required'
    },
    {
      icon: Shield,
      title: 'Secure Platform',
      desc: 'Your data is protected with encryption'
    },
    {
      icon: Zap,
      title: 'Instant Access',
      desc: 'Start learning immediately after signup'
    },
    {
      icon: Target,
      title: 'Personalized Path',
      desc: 'Custom learning journey based on your goals'
    }
  ];

  // Stats for Login page
  const loginStats = [
    { value: '10K+', label: 'Students' },
    { value: '500+', label: 'Courses' },
    { value: '2K+', label: 'Jobs' }
  ];

  // Stats for Signup page
  const signupStats = [
    { value: '5K+', label: 'New Users' },
    { value: '100+', label: 'Free Courses' },
    { value: '24/7', label: 'Support' }
  ];

  const features = isSignupPage ? signupFeatures : loginFeatures;
  const stats = isSignupPage ? signupStats : loginStats;

  return (
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
            <p className="text-sm text-blue-600 font-medium">
              Innovation & Career Launch
            </p>
          </div>
        </div>

        {/* Main Heading */}
        <div className="space-y-4">
          <h2 className="text-5xl font-bold text-gray-900 leading-tight">
            Shape Your
            <span className="block bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
              Future 
            </span>
          </h2>
          <p className="text-lg text-gray-700 leading-relaxed">
            Unlock endless opportunities with our comprehensive learning platform,
            job portal, and professional tools.
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
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="text-center bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-sm"
            >
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AuthBrandingSidebar;