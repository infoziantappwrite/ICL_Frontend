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
import infoziantLogo from '../../assets/logo.png';

const AuthBrandingSidebar = () => {
  const location = useLocation();
  const isSignupPage = location.pathname === '/signup';

  const loginFeatures = [
    { icon: BookOpen,      title: 'Expert-Led Courses',  desc: 'Learn from industry professionals' },
    { icon: Briefcase,     title: 'Job Opportunities',   desc: 'Connect with top employers' },
    { icon: FileText,      title: 'Resume Builder',      desc: 'Create stunning resumes in minutes' },
    { icon: GraduationCap, title: 'Career Growth',       desc: 'Track and accelerate your progress' },
  ];

  const signupFeatures = [
    { icon: User,   title: 'Free Account',      desc: 'Get started with no credit card required' },
    { icon: Shield, title: 'Secure Platform',   desc: 'Your data is protected with encryption' },
    { icon: Zap,    title: 'Instant Access',    desc: 'Start learning immediately after signup' },
    { icon: Target, title: 'Personalized Path', desc: 'Custom learning journey based on your goals' },
  ];

  const loginStats  = [{ value: '10K+', label: 'Students' }, { value: '500+', label: 'Courses' }, { value: '2K+', label: 'Jobs' }];
  const signupStats = [{ value: '5K+',  label: 'New Users' }, { value: '100+', label: 'Free Courses' }, { value: '24/7', label: 'Support' }];

  const features = isSignupPage ? signupFeatures : loginFeatures;
  const stats    = isSignupPage ? signupStats    : loginStats;

  return (
    <div
      className="hidden lg:flex lg:w-1/2 self-stretch flex-col justify-center p-10 xl:p-14 relative overflow-hidden"
      style={{
        background: 'linear-gradient(145deg, #ffffff 0%, #f0f7ff 60%, #e6f3fb 100%)',
        borderRight: '1px solid #dbeafe',
      }}
    >
      {/* Subtle decorative orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-40"
          style={{ background: 'radial-gradient(circle, #bfdbfe 0%, transparent 70%)' }} />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle, #bae6fd 0%, transparent 70%)' }} />
        {/* Hex grid - subtle */}
        <div className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100'%3E%3Cpath d='M28 66L0 50V18L28 2l28 16v32z' fill='none' stroke='%230d2b8c' stroke-width='1'/%3E%3C/svg%3E")`,
            backgroundSize: '56px 100px',
          }}
        />
      </div>

      <div className="relative z-10 space-y-7">
        {/* Logo — natural colors on light background */}
        <div>
          <img src={infoziantLogo} alt="Infoziant" className="h-10" />
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h2 className="text-4xl xl:text-5xl font-bold leading-tight" style={{ color: '#0d2b8c' }}>
            Shape Your
            <span className="block" style={{ color: '#17a8c8' }}>Future Career</span>
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed max-w-sm">
            Unlock endless opportunities with our comprehensive learning platform,
            job portal, and professional tools.
          </p>
        </div>

        {/* Feature list */}
        <div className="space-y-3">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div key={idx} className="flex items-center gap-3 group hover:translate-x-1 transition-transform duration-200">
                <div
                  className="flex-shrink-0 p-2 rounded-lg"
                  style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}
                >
                  <Icon size={18} strokeWidth={1.5} style={{ color: '#0d2b8c' }} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 group-hover:text-[#0d2b8c] transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-gray-400">{feature.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="text-center rounded-xl py-3 px-2"
              style={{ background: '#f0f7ff', border: '1px solid #bfdbfe' }}
            >
              <div className="text-xl font-bold" style={{ color: '#0d2b8c' }}>{stat.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AuthBrandingSidebar;
