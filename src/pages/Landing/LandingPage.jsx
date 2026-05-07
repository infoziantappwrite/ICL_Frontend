// src/pages/Landing/LandingPage.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import infoziantLogo from '../../assets/logo.png';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Briefcase, ClipboardList, GraduationCap, Users,
  Star, Clock, ArrowRight, ChevronRight, Menu, X,
  Zap, Shield, Target, Award, Globe, TrendingUp,
  CheckCircle2, PlayCircle, Building2, UserCheck,
  Cpu, Database, Layers, BarChart3, Smartphone,
  Sparkles, ChevronDown, Quote, MapPin, Mail, Phone,
  Linkedin, Twitter, Instagram, Facebook,
} from 'lucide-react';

// ─── FONTS & KEYFRAMES ───────────────────────────────────────────────────────

const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800;900&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');

  * { box-sizing: border-box; }
  
  .icl-font { font-family: 'DM Sans', system-ui, sans-serif; }
  .icl-display { font-family: 'Sora', system-ui, sans-serif; }

  @keyframes icl-float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    33% { transform: translateY(-18px) rotate(1deg); }
    66% { transform: translateY(-8px) rotate(-1deg); }
  }
  @keyframes icl-float2 {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-22px) rotate(-1.5deg); }
  }
  @keyframes icl-pulse-glow {
    0%, 100% { box-shadow: 0 0 0 0 rgba(13, 43, 140, 0); }
    50% { box-shadow: 0 0 40px 8px rgba(13, 43, 140, 0.25); }
  }
  @keyframes icl-gradient-shift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes icl-marquee {
    from { transform: translateX(0); }
    to { transform: translateX(-50%); }
  }
  @keyframes icl-fade-up {
    from { opacity: 0; transform: translateY(24px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes icl-fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes icl-scale-in {
    from { opacity: 0; transform: scale(0.92); }
    to { opacity: 1; transform: scale(1); }
  }
  @keyframes icl-spin-slow {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes icl-orb1 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(30px, -20px) scale(1.05); }
    66% { transform: translate(-15px, 15px) scale(0.95); }
  }
  @keyframes icl-orb2 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    40% { transform: translate(-25px, 20px) scale(1.08); }
    70% { transform: translate(20px, -10px) scale(0.96); }
  }
  @keyframes icl-shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes icl-border-spin {
    from { --angle: 0deg; }
    to { --angle: 360deg; }
  }

  .icl-animate-float { animation: icl-float 6s ease-in-out infinite; }
  .icl-animate-float2 { animation: icl-float2 8s ease-in-out infinite; }
  .icl-animate-fade-up { animation: icl-fade-up 0.7s ease both; }
  .icl-animate-fade-in { animation: icl-fade-in 0.6s ease both; }
  .icl-animate-scale-in { animation: icl-scale-in 0.5s ease both; }
  .icl-marquee { animation: icl-marquee 30s linear infinite; }
  .icl-marquee:hover { animation-play-state: paused; }

  .icl-delay-1 { animation-delay: 0.1s; }
  .icl-delay-2 { animation-delay: 0.2s; }
  .icl-delay-3 { animation-delay: 0.3s; }
  .icl-delay-4 { animation-delay: 0.4s; }
  .icl-delay-5 { animation-delay: 0.5s; }
  .icl-delay-6 { animation-delay: 0.6s; }

  .icl-gradient-text {
    background: linear-gradient(135deg, #17a8c8 0%, #1cb5d4 50%, #0d2b8c 100%);
    background-size: 200% 200%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: icl-gradient-shift 4s ease infinite;
  }
  .icl-gradient-text-warm {
    background: linear-gradient(135deg, #0d2b8c 0%, #17a8c8 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .icl-card-hover {
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  .icl-card-hover:hover {
    transform: translateY(-6px);
    box-shadow: 0 24px 48px rgba(0, 0, 0, 0.12);
  }

  .icl-shine {
    position: relative;
    overflow: hidden;
  }
  .icl-shine::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%);
    background-size: 200% 100%;
    animation: icl-shimmer 3s ease infinite;
  }

  .icl-scrolled-nav {
    background: rgba(255, 255, 255, 0.92) !important;
    backdrop-filter: blur(20px);
    box-shadow: 0 1px 0 rgba(0,0,0,0.06), 0 4px 24px rgba(0,0,0,0.06);
  }

  .icl-hero-btn-primary {
    background: linear-gradient(135deg, #0d2b8c 0%, #17a8c8 100%);
    box-shadow: 0 8px 32px rgba(13, 43, 140, 0.4);
    transition: all 0.3s ease;
  }
  .icl-hero-btn-primary:hover {
    box-shadow: 0 12px 40px rgba(23, 168, 200, 0.55);
    transform: translateY(-2px);
  }

  .icl-stat-card {
    background: white;
    border: 1px solid #eef2ff;
    box-shadow: 0 4px 12px rgba(13, 43, 140, 0.04);
    border-radius: 16px;
    transition: all 0.3s ease;
  }
  .icl-stat-card:hover {
    background: #f8faff;
    border-color: #dbeafe;
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(13, 43, 140, 0.08);
  }

  .icl-feature-card {
    background: white;
    border: 1px solid #f0f4ff;
    border-radius: 16px;
    padding: 28px;
    transition: all 0.35s ease;
    position: relative;
    overflow: hidden;
  }
  .icl-feature-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: linear-gradient(90deg, #0d2b8c, #17a8c8);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.35s ease;
    border-radius: 3px 3px 0 0;
  }
  .icl-feature-card:hover::before { transform: scaleX(1); }
  .icl-feature-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 20px 48px rgba(13, 43, 140, 0.1);
    border-color: #c7d7fd;
  }

  .icl-course-card {
    background: white;
    border-radius: 16px;
    border: 1px solid #f0f4ff;
    overflow: hidden;
    transition: all 0.35s ease;
  }
  .icl-course-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 24px 48px rgba(0,0,0,0.12);
    border-color: #c7d7fd;
  }

  .icl-testimonial-card {
    background: white;
    border: 1px solid #eef2ff;
    border-radius: 20px;
    padding: 28px;
    transition: all 0.3s ease;
  }
  .icl-testimonial-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 48px rgba(59, 130, 246, 0.08);
  }

  .icl-faq-item {
    border: 1px solid #e8edf8;
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.3s ease;
    background: white;
  }
  .icl-faq-item:hover { border-color: #bfcffd; }

  .icl-nav-link {
    position: relative;
    padding: 6px 14px;
    font-size: 14px;
    font-weight: 500;
    color: #4b5563;
    border-radius: 8px;
    transition: all 0.2s ease;
  }
  .icl-nav-link:hover { color: #0d2b8c; background: #eff6ff; }

  .icl-section-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: linear-gradient(135deg, #eff6ff, #f0f9ff);
    border: 1px solid #bfdbfe;
    color: #0d2b8c;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    padding: 5px 12px;
    border-radius: 100px;
    margin-bottom: 16px;
    text-transform: uppercase;
  }

  .icl-dark-section-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(13, 43, 140, 0.06);
    border: 1px solid rgba(13, 43, 140, 0.1);
    color: #0d2b8c;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    padding: 5px 12px;
    border-radius: 100px;
    margin-bottom: 16px;
    text-transform: uppercase;
  }
`;

// ─── Static Data ──────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: 'Home', id: 'hero' },
  { label: 'About', id: 'about' },
  { label: 'Courses', id: 'courses' },
  { label: 'How It Works', id: 'how' },
  { label: 'For You', id: 'audience' },
];

const STATS = [
  { value: 10000, suffix: '+', label: 'Students Enrolled', icon: Users, color: '#17a8c8' },
  { value: 500, suffix: '+', label: 'Courses Available', icon: BookOpen, color: '#0d2b8c' },
  { value: 2000, suffix: '+', label: 'Job Opportunities', icon: Briefcase, color: '#1cb5d4' },
  { value: 200, suffix: '+', label: 'Partner Companies', icon: Building2, color: '#0a4a8c' },
];

const FEATURES = [
  {
    icon: BookOpen,
    iconBg: 'linear-gradient(135deg, #0d2b8c, #1a5ca8)',
    title: 'Expert-Led Courses',
    desc: 'Learn from seasoned industry professionals with hands-on projects, real-world case studies, and live mentoring sessions tailored to market demand.',
    tag: 'LEARNING',
  },
  {
    icon: Briefcase,
    iconBg: 'linear-gradient(135deg, #17a8c8, #1cb5d4)',
    title: 'Job Placement Portal',
    desc: 'Connect directly with top employers. Browse intelligently curated job listings matched to your skill profile and career aspirations.',
    tag: 'CAREERS',
  },
  {
    icon: ClipboardList,
    iconBg: 'linear-gradient(135deg, #0a2370, #0d2b8c)',
    title: 'Skill Assessments',
    desc: 'Validate your knowledge through AI-proctored assessments and earn verifiable, industry-recognized certificates that employers trust.',
    tag: 'CERTIFICATION',
  },
  {
    icon: TrendingUp,
    iconBg: 'linear-gradient(135deg, #10b981, #34d399)',
    title: 'Career Tracking',
    desc: 'Track your learning trajectory and career growth with personalized dashboards, progress analytics, and milestone celebrations.',
    tag: 'ANALYTICS',
  },
  {
    icon: Shield,
    iconBg: 'linear-gradient(135deg, #0d2b8c, #17a8c8)',
    title: 'AI-Powered Proctoring',
    desc: 'Enterprise-grade security with advanced AI proctoring ensures the authenticity and integrity of every assessment you take.',
    tag: 'SECURITY',
  },
  {
    icon: Globe,
    iconBg: 'linear-gradient(135deg, #17a8c8, #0d2b8c)',
    title: 'Learn Anywhere',
    desc: 'Access all content across devices, anytime. Online, offline, and hybrid delivery modes make learning fit your schedule.',
    tag: 'FLEXIBILITY',
  },
];

const HOW_STEPS = [
  {
    step: '01',
    icon: UserCheck,
    title: 'Create Your Account',
    desc: 'Sign up as a student through your college or as an independent candidate. Takes 2 minutes. Completely free to join.',
    color: 'linear-gradient(135deg, #0d2b8c, #17a8c8)',
    glowColor: 'rgba(13, 43, 140, 0.3)',
  },
  {
    step: '02',
    icon: BookOpen,
    title: 'Explore & Enroll',
    desc: 'Browse 500+ courses across cutting-edge tech domains. Enrol instantly, learn at your own pace, and build real-world skills.',
    color: 'linear-gradient(135deg, #17a8c8, #1cb5d4)',
    glowColor: 'rgba(23, 168, 200, 0.3)',
  },
  {
    step: '03',
    icon: Award,
    title: 'Get Certified & Hired',
    desc: 'Complete assessments, earn verifiable certificates, and connect directly with top recruiters — all from one unified platform.',
    color: 'linear-gradient(135deg, #0a2370, #0d2b8c)',
    glowColor: 'rgba(10, 35, 112, 0.3)',
  },
];

const SAMPLE_COURSES = [
  { title: 'Full Stack Development', category: 'Full Stack Development', level: 'Intermediate', icon: Layers, enrollments: 1240, rating: 4.8, duration: '120h', color: 'linear-gradient(135deg, #0d2b8c, #17a8c8)' },
  { title: 'Data Science & Analytics', category: 'Data Science', level: 'Beginner', icon: BarChart3, enrollments: 980, rating: 4.7, duration: '80h', color: 'linear-gradient(135deg, #17a8c8, #0d2b8c)' },
  { title: 'AI & Machine Learning', category: 'AI / ML', level: 'Advanced', icon: Cpu, enrollments: 760, rating: 4.9, duration: '100h', color: 'linear-gradient(135deg, #0a2370, #1cb5d4)' },
  { title: 'DevOps & Cloud', category: 'DevOps', level: 'Intermediate', icon: Database, enrollments: 620, rating: 4.6, duration: '60h', color: 'linear-gradient(135deg, #10b981, #17a8c8)' },
  { title: 'Mobile App Development', category: 'Mobile Development', level: 'Beginner', icon: Smartphone, enrollments: 540, rating: 4.5, duration: '70h', color: 'linear-gradient(135deg, #f59e0b, #ef4444)' },
  { title: 'Cybersecurity Essentials', category: 'Cybersecurity', level: 'Intermediate', icon: Shield, enrollments: 430, rating: 4.7, duration: '50h', color: 'linear-gradient(135deg, #0d2b8c, #17a8c8)' },
];

const LEVEL_BADGE = {
  Beginner: 'background: #dcfce7; color: #16a34a;',
  Intermediate: 'background: #dbeafe; color: #1d4ed8;',
  Advanced: 'background: #ede9fe; color: #6d28d9;',
};

const TESTIMONIALS = [
  {
    name: 'Priya Ramanan',
    role: 'Placed at TCS Digital',
    college: 'Anna University, Chennai',
    text: 'ICL completely transformed my career journey. The courses are incredibly practical and the job portal connected me with my dream role within 3 weeks of certification.',
    stars: 5,
    initials: 'PR',
    avatarColor: 'linear-gradient(135deg, #0d2b8c, #17a8c8)',
  },
  {
    name: 'Arjun Krishnamurthy',
    role: 'Full Stack Developer at Zoho',
    college: 'PSG College of Technology',
    text: 'The Full Stack course here is the best I have seen. Real projects, industry mentors, and the AI proctored assessment gave me a certificate that Zoho genuinely respected.',
    stars: 5,
    initials: 'AK',
    avatarColor: 'linear-gradient(135deg, #17a8c8, #0d2b8c)',
  },
  {
    name: 'Divya Suresh',
    role: 'Data Analyst at Infosys',
    college: 'Independent Candidate',
    text: "As someone not from a premium college, ICL leveled the playing field for me. I built my verified skill profile and landed a job I never thought was possible before joining.",
    stars: 5,
    initials: 'DS',
    avatarColor: 'linear-gradient(135deg, #10b981, #17a8c8)',
  },
];

const TRUSTED_COLLEGES = [
  'Anna University', 'PSG College', 'Coimbatore Institute of Technology', 'SASTRA University',
  'Amrita School', 'KCT Coimbatore', 'Bannari Amman', 'Sri Krishna College',
  'Kongu Engineering', 'Tamil Nadu Engineering College', 'VIT Vellore', 'SRM Institute',
];

const FAQS = [
  {
    q: 'Is ICL free to use for students?',
    a: 'Yes! Students enrolled through their college can access the platform completely free. Independent candidates can also sign up and access many features at no cost.',
  },
  {
    q: 'How does the job matching work?',
    a: 'ICL uses your skill profile, assessments, courses, and career preferences to intelligently match you with relevant job openings from our 200+ partner companies.',
  },
  {
    q: 'Are the certificates recognised by employers?',
    a: 'Absolutely. ICL certificates are backed by AI-proctored assessments and are verified on our platform — employers can authenticate them instantly via a QR code.',
  },
  {
    q: 'Can I enroll in courses independently without a college?',
    a: 'Yes. Independent candidates can sign up directly and enroll in any publicly available course, build their profile, and apply to jobs independently.',
  },
];

// ─── Animated Counter ─────────────────────────────────────────────────────────

const useCounter = (target, duration = 2000, shouldStart = false) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!shouldStart) return;
    const startTime = performance.now();
    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target, duration, shouldStart]);
  return count;
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

const StatCard = ({ stat, shouldStart }) => {
  const Icon = stat.icon;
  const count = useCounter(stat.value, 2000, shouldStart);
  const display = count >= 1000 ? `${(count / 1000).toFixed(1)}K` : `${count}`;
  return (
    <div className="icl-stat-card text-center p-6">
      <div className="flex items-center justify-center w-12 h-12 rounded-2xl mb-4 mx-auto"
        style={{ background: `${stat.color}20`, border: `1px solid ${stat.color}40` }}>
        <Icon className="w-6 h-6" style={{ color: stat.color }} />
      </div>
      <div className="icl-display text-3xl font-black text-gray-900 mb-1">
        {display}{stat.suffix}
      </div>
      <div className="text-sm text-gray-500 font-medium">{stat.label}</div>
    </div>
  );
};

// ─── Course Card ──────────────────────────────────────────────────────────────

const CourseCard = ({ course, delay }) => {
  const Icon = course.icon;
  return (
    <div className="icl-course-card icl-animate-fade-up" style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}>
      <div className="h-40 flex items-center justify-center relative overflow-hidden" style={{ background: course.color }}>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.15), transparent)' }} />
        <Icon className="w-16 h-16 text-white/70 relative z-10" style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.2))' }} />
        <div className="absolute top-3 right-3">
          <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white bg-white/20 backdrop-blur-sm border border-white/20">
            {course.level}
          </span>
        </div>
      </div>
      <div className="p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={Object.fromEntries(
            course.level === 'Beginner' ? [['background', '#dcfce7'], ['color', '#16a34a']] :
              course.level === 'Intermediate' ? [['background', '#dbeafe'], ['color', '#1d4ed8']] :
                [['background', '#ede9fe'], ['color', '#6d28d9']]
          )}>
            {course.level}
          </span>
          <span className="flex items-center gap-1 text-xs font-bold text-amber-500">
            <Star className="w-3.5 h-3.5 fill-amber-400" /> {course.rating}
          </span>
        </div>
        <h3 className="icl-display font-bold text-gray-900 text-[15px] mb-1 leading-snug">{course.title}</h3>
        <p className="text-xs text-gray-400 mb-4 font-medium">{course.category}</p>
        <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-50">
          <span className="flex items-center gap-1.5 font-medium">
            <Users className="w-3.5 h-3.5 text-blue-400" />
            {course.enrollments.toLocaleString()} enrolled
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            {course.duration}
          </span>
        </div>
      </div>
    </div>
  );
};

// ─── FAQ Item ─────────────────────────────────────────────────────────────────

const FAQItem = ({ item, index }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="icl-faq-item">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-4 p-5 text-left"
      >
        <span className="icl-display font-semibold text-gray-900 text-[15px]">{item.q}</span>
        <span className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300"
          style={{ background: open ? '#0d2b8c' : '#f0f4ff', color: open ? 'white' : '#0d2b8c' }}>
          <ChevronDown className="w-4 h-4 transition-transform duration-300" style={{ transform: open ? 'rotate(180deg)' : 'none' }} />
        </span>
      </button>
      <div style={{
        maxHeight: open ? '200px' : '0',
        overflow: 'hidden',
        transition: 'max-height 0.35s ease',
      }}>
        <p className="px-5 pb-5 text-[14px] text-gray-600 leading-relaxed">{item.a}</p>
      </div>
    </div>
  );
};

// ─── Landing Page ─────────────────────────────────────────────────────────────

const LandingPage = () => {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef(null);

  useEffect(() => {
    // Inject font
    const style = document.createElement('style');
    style.textContent = GLOBAL_STYLES;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsVisible(true); }, { threshold: 0.3 });
    if (statsRef.current) obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  const scrollTo = useCallback((id) => {
    setMobileOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <div className="icl-font min-h-screen bg-white" style={{ overflowX: 'hidden' }}>

      {/* ── NAVBAR ────────────────────────────────────────────────────────── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
        style={{
          background: scrolled ? undefined : 'rgba(255, 255, 255, 0.8)',
          backdropFilter: scrolled ? undefined : 'blur(16px)',
          borderBottom: scrolled ? undefined : '1px solid rgba(13, 43, 140, 0.1)',
        }}
      >
        {scrolled && <div className="icl-scrolled-nav absolute inset-0" />}
        <div className="relative max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

          {/* Logo */}
          <button onClick={() => scrollTo('hero')} className="flex items-center flex-shrink-0">
            <img
              src={infoziantLogo}
              alt="Infoziant"
              className="h-9"
              style={{ filter: 'none' }}
            />
          </button>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(l => (
              <button key={l.id} onClick={() => scrollTo(l.id)}
                className="icl-nav-link"
                style={{ color: '#374151' }}>
                {l.label}
              </button>
            ))}
          </nav>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-2.5">
            <button onClick={() => navigate('/login')}
              className="px-4 py-2 text-[13px] font-semibold rounded-xl transition-all duration-200 border"
              style={{
                color: '#0d2b8c',
                borderColor: '#bfdbfe',
                background: 'white',
              }}>
              Sign In
            </button>
            <button onClick={() => navigate('/signup')}
              className="px-5 py-2 text-[13px] font-bold text-white rounded-xl icl-hero-btn-primary">
              Get Started
            </button>
          </div>

          {/* Mobile Hamburger */}
          <button onClick={() => setMobileOpen(v => !v)}
            className="md:hidden p-2 rounded-lg transition-colors"
            style={{ color: '#374151', background: '#f9fafb' }}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <div style={{
          maxHeight: mobileOpen ? '400px' : '0',
          overflow: 'hidden',
          transition: 'max-height 0.35s ease',
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px)',
        }}>
          <div className="px-4 py-4 space-y-1">
            {NAV_LINKS.map(l => (
              <button key={l.id} onClick={() => scrollTo(l.id)}
                className="w-full text-left px-4 py-3 text-[14px] font-medium text-gray-600 hover:text-[#0d2b8c] hover:bg-blue-50 rounded-xl transition-colors">
                {l.label}
              </button>
            ))}
            <div className="flex gap-2 pt-3 border-t border-white/08">
              <button onClick={() => navigate('/login')}
                className="flex-1 py-2.5 text-[13px] font-semibold text-[#0d2b8c] border border-[#bfdbfe] rounded-xl">
                Sign In
              </button>
              <button onClick={() => navigate('/signup')}
                className="flex-1 py-2.5 text-[13px] font-bold text-white rounded-xl"
                style={{ background: 'linear-gradient(135deg, #0d2b8c, #17a8c8)' }}>
                Get Started
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section id="hero" className="relative min-h-screen flex flex-col justify-center overflow-hidden pt-16"
        style={{ background: 'linear-gradient(165deg, #f8faff 0%, #eef2ff 100%)' }}>

        {/* Background orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute rounded-full opacity-30"
            style={{ width: 600, height: 600, background: 'radial-gradient(circle, #0d2b8c10, transparent)', top: '-100px', right: '-100px', animation: 'icl-orb1 15s ease-in-out infinite' }} />
          <div className="absolute rounded-full opacity-25"
            style={{ width: 500, height: 500, background: 'radial-gradient(circle, #17a8c810, transparent)', bottom: '-80px', left: '-80px', animation: 'icl-orb2 18s ease-in-out infinite' }} />
          <div className="absolute rounded-full opacity-15"
            style={{ width: 300, height: 300, background: 'radial-gradient(circle, #1cb5d408, transparent)', top: '40%', left: '20%', animation: 'icl-orb1 12s ease-in-out infinite reverse' }} />
          {/* Grid */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'linear-gradient(rgba(13, 43, 140, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(13, 43, 140, 0.2) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>

        <div className="relative w-full mx-auto px-4 sm:px-6 lg:px-12 xl:px-16">
          <div className="grid lg:grid-cols-[1.1fr_1fr] gap-8 items-center">

            {/* Left Content */}
            <div>
              <div className="icl-dark-section-badge icl-animate-fade-up" style={{ animationFillMode: 'both' }}>
                <Zap className="w-3 h-3" />
                India's #1 Campus-to-Career Platform
              </div>

              <h1 className="icl-display font-black leading-[1.08] mb-5 icl-animate-fade-up icl-delay-1"
                style={{ fontSize: 'clamp(32px, 4.5vw, 54px)', animationFillMode: 'both' }}>
                <span className="text-gray-900">Turn Learning Into</span>
                <br />
                <span className="icl-gradient-text">Your Dream Career</span>
              </h1>

              <p className="text-[16px] leading-relaxed mb-6 icl-animate-fade-up icl-delay-2"
                style={{ color: '#64748b', maxWidth: 500, animationFillMode: 'both' }}>
                ICL bridges the gap between education and employment. Access 500+ expert courses,
                apply for 2,000+ jobs, and validate skills with AI-proctored assessments — all in
                one unified platform built for India's next-gen workforce.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-8 icl-animate-fade-up icl-delay-3" style={{ animationFillMode: 'both' }}>
                <button onClick={() => navigate('/signup')}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-[15px] font-bold text-white rounded-xl icl-hero-btn-primary">
                  Start For Free <ArrowRight className="w-4 h-4" />
                </button>
                <button onClick={() => scrollTo('courses')}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-[15px] font-semibold rounded-xl transition-all duration-300 shadow-sm"
                  style={{ color: '#0d2b8c', border: '1px solid #dbeafe', background: 'white' }}
                  onMouseOver={e => { e.currentTarget.style.background = '#f1f5f9'; }}
                  onMouseOut={e => { e.currentTarget.style.background = 'white'; }}>
                  <PlayCircle className="w-4.5 h-4.5" /> Explore Courses
                </button>
              </div>

              {/* Trust Bar */}
              <div className="flex items-center gap-4 icl-animate-fade-up icl-delay-4" style={{ animationFillMode: 'both' }}>
                <div className="flex -space-x-2.5">
                  {['PK', 'AM', 'SR', 'DJ', 'NR'].map((init, i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-[9px] font-bold text-white"
                      style={{
                        borderColor: 'white',
                        background: ['#0d2b8c', '#17a8c8', '#10b981', '#1cb5d4', '#0a2370'][i],
                      }}>
                      {init}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="text-[13px] font-semibold" style={{ color: '#475569' }}>
                    10,000+ students already learning
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                    ))}
                    <span className="text-[11px] ml-1" style={{ color: '#94a3b8' }}>4.8 / 5 avg rating</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right — Floating Dashboard Cards */}
            <div className="hidden lg:block relative h-[480px]">
              {/* Main Card */}
              <div className="absolute top-10 left-0 right-0 icl-animate-float shadow-2xl"
                style={{ background: 'white', border: '1px solid #eef2ff', borderRadius: 20, padding: 24 }}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0d2b8c, #17a8c8)' }}>
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-gray-900 font-semibold text-[14px]">Career Progress</div>
                    <div className="text-[11px]" style={{ color: '#94a3b8' }}>Updated today</div>
                  </div>
                  <span className="ml-auto text-[11px] px-2.5 py-1 rounded-full font-bold" style={{ background: '#22c55e20', color: '#4ade80', border: '1px solid #22c55e30' }}>↑ 24%</span>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Full Stack Development', pct: 78, color: '#17a8c8' },
                    { label: 'Data Science', pct: 55, color: '#0d2b8c' },
                    { label: 'AI & Machine Learning', pct: 40, color: '#1cb5d4' },
                  ].map(b => (
                    <div key={b.label}>
                      <div className="flex justify-between text-[11px] mb-1.5" style={{ color: '#64748b' }}>
                        <span>{b.label}</span><span style={{ color: b.color }}>{b.pct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ background: '#f1f5f9' }}>
                        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${b.pct}%`, background: `linear-gradient(90deg, ${b.color}, ${b.color}80)` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mini Cards */}
              <div className="absolute bottom-24 left-0 w-44 icl-animate-float2 shadow-xl"
                style={{ background: 'white', border: '1px solid #eef2ff', borderRadius: 16, padding: 16 }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#22c55e20' }}>
                    <CheckCircle2 className="w-4 h-4" style={{ color: '#16a34a' }} />
                  </div>
                  <span className="text-gray-900 text-[12px] font-semibold">Job Matched!</span>
                </div>
                <div className="text-[11px]" style={{ color: '#64748b' }}>Software Engineer @ Zoho</div>
                <div className="text-[10px] mt-1" style={{ color: '#16a34a' }}>92% profile match</div>
              </div>

              <div className="absolute bottom-8 right-0 w-48 icl-animate-float shadow-xl"
                style={{ animationDelay: '3s', background: 'white', border: '1px solid #eef2ff', borderRadius: 16, padding: 16 }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#0d2b8c20' }}>
                    <Award className="w-4 h-4" style={{ color: '#17a8c8' }} />
                  </div>
                  <span className="text-gray-900 text-[12px] font-semibold">Certificate Earned</span>
                </div>
                <div className="text-[11px]" style={{ color: '#64748b' }}>Full Stack Development</div>
                <div className="flex items-center gap-1 mt-1">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
          <span className="text-[#94a3b8] text-[11px] tracking-widest uppercase font-medium">Scroll</span>
          <div className="w-5 h-8 rounded-full border border-slate-200 flex items-start justify-center pt-1.5">
            <div className="w-1 h-2 rounded-full bg-slate-400" style={{ animation: 'icl-float2 1.5s ease-in-out infinite' }} />
          </div>
        </div>
      </section>

      {/* ── TRUSTED MARQUEE ───────────────────────────────────────────────── */}
      <section className="py-10 border-y overflow-hidden" style={{ background: '#f8faff', borderColor: '#e8edf8' }}>
        <div className="mb-3 text-center text-[11px] font-bold tracking-widest uppercase" style={{ color: '#94a3b8' }}>
          Trusted by students from 50+ colleges across Tamil Nadu
        </div>
        <div className="flex items-center" style={{ overflow: 'hidden' }}>
          <div className="flex items-center gap-12 icl-marquee" style={{ width: 'max-content' }}>
            {[...TRUSTED_COLLEGES, ...TRUSTED_COLLEGES].map((college, i) => (
              <div key={i} className="flex items-center gap-2.5 flex-shrink-0">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#17a8c8' }} />
                <span className="icl-display text-[13px] font-semibold whitespace-nowrap" style={{ color: '#64748b' }}>{college}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────────────────────────── */}
      <section ref={statsRef} className="py-20 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)' }}>
        <div className="absolute inset-0 opacity-[0.05]"
          style={{ backgroundImage: 'radial-gradient(circle, #0d2b8c 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="relative max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="icl-dark-section-badge" style={{ display: 'inline-flex' }}>
              <BarChart3 className="w-3 h-3" /> Platform Metrics
            </div>
            <h2 className="icl-display text-3xl md:text-4xl font-black text-gray-900">
              Numbers That <span className="icl-gradient-text">Speak for Themselves</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {STATS.map(s => <StatCard key={s.label} stat={s} shouldStart={statsVisible} />)}
          </div>
        </div>
      </section>

      {/* ── ABOUT / FEATURES ──────────────────────────────────────────────── */}
      <section id="about" className="py-24" style={{ background: '#f8faff' }}>
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="icl-section-badge">
              <Sparkles className="w-3 h-3" /> Why ICL
            </div>
            <h2 className="icl-display text-3xl md:text-[42px] font-black text-gray-900 mb-4 leading-tight">
              Everything You Need to<br /><span className="icl-gradient-text-warm">Launch Your Career</span>
            </h2>
            <p className="text-[16px] text-gray-500 max-w-xl mx-auto leading-relaxed">
              From skill building to job placement — ICL is the complete career launchpad
              for students and independent candidates across India.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="icl-feature-card">
                  <div className="flex items-start justify-between mb-5">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                      style={{ background: f.iconBg, boxShadow: `0 8px 24px ${f.iconBg.includes('3b82f6') ? 'rgba(59,130,246,0.25)' : 'rgba(0,0,0,0.1)'}` }}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-[10px] font-bold tracking-widest px-2.5 py-1 rounded-full" style={{ background: '#eff6ff', color: '#0d2b8c' }}>
                      {f.tag}
                    </span>
                  </div>
                  <h3 className="icl-display font-bold text-gray-900 text-[16px] mb-2">{f.title}</h3>
                  <p className="text-gray-500 text-[13px] leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── COURSES ───────────────────────────────────────────────────────── */}
      <section id="courses" className="py-24 bg-white">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <div className="icl-section-badge">
                <BookOpen className="w-3 h-3" /> Popular Courses
              </div>
              <h2 className="icl-display text-3xl md:text-[42px] font-black text-gray-900 leading-tight">
                Learn the Skills<br /><span className="icl-gradient-text-warm">That Get You Hired</span>
              </h2>
            </div>
            <button onClick={() => navigate('/signup')}
              className="flex items-center gap-1.5 font-semibold text-[14px] transition-all flex-shrink-0 group"
              style={{ color: '#0d2b8c' }}>
              View All Courses
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SAMPLE_COURSES.map((c, i) => <CourseCard key={c.title} course={c} delay={i * 80} />)}
          </div>

          {/* CTA Banner */}
          <div className="mt-12 rounded-2xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #030b1a 0%, #0d2b8c 100%)' }}>
            <div className="absolute inset-0 opacity-[0.06]"
              style={{ backgroundImage: 'radial-gradient(circle,white 1px,transparent 1px)', backgroundSize: '22px 22px' }} />
            <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full opacity-10"
              style={{ background: 'radial-gradient(circle, #0d2b8c, transparent)' }} />
            <div className="relative text-center md:text-left">
              <h3 className="icl-display text-white font-black text-[22px] md:text-[24px] mb-1">
                Ready to start your learning journey?
              </h3>
              <p className="text-[14px]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Join thousands of students learning on ICL. Free forever for students.
              </p>
            </div>
            <button onClick={() => navigate('/signup')}
              className="relative inline-flex items-center gap-2 px-7 py-3.5 font-bold rounded-xl text-[14px] transition-all hover:scale-105 flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #0d2b8c, #17a8c8)', color: 'white', boxShadow: '0 8px 24px rgba(13,43,140,0.4)' }}>
              Create Free Account <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section id="how" className="py-24" style={{ background: '#f8faff' }}>
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="icl-section-badge">
              <Zap className="w-3 h-3" /> How It Works
            </div>
            <h2 className="icl-display text-3xl md:text-[42px] font-black text-gray-900 mb-4">
              3 Steps to Your <span className="icl-gradient-text-warm">Dream Job</span>
            </h2>
            <p className="text-[15px] text-gray-500 max-w-lg mx-auto">
              A streamlined path designed to take you from learner to career professional as efficiently as possible.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Connector lines */}
            <div className="hidden md:block absolute top-14 left-[calc(33.33%-20px)] right-[calc(33.33%-20px)] h-px"
              style={{ background: 'linear-gradient(90deg, #0d2b8c, #17a8c8, #1cb5d4)' }} />
            {HOW_STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={s.step} className="relative bg-white rounded-2xl p-8 text-center border hover:shadow-xl transition-all duration-300"
                  style={{ borderColor: '#eef2ff', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
                  onMouseOver={e => e.currentTarget.style.transform = 'translateY(-6px)'}
                  onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                  <div className="relative inline-flex mb-6">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
                      style={{ background: s.color, boxShadow: `0 8px 24px ${s.glowColor}` }}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-black border-2 border-white"
                      style={{ background: s.color }}>
                      {s.step}
                    </div>
                  </div>
                  <h3 className="icl-display font-bold text-gray-900 text-[18px] mb-3">{s.title}</h3>
                  <p className="text-gray-500 text-[13px] leading-relaxed">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── WHO IS IT FOR ─────────────────────────────────────────────────── */}
      <section id="audience" className="py-24 bg-white">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="icl-section-badge">
              <Users className="w-3 h-3" /> Built For Everyone
            </div>
            <h2 className="icl-display text-3xl md:text-[42px] font-black text-gray-900 mb-4">
              Your Path, <span className="icl-gradient-text-warm">Your Way</span>
            </h2>
            <p className="text-[15px] text-gray-500 max-w-lg mx-auto">
              Whether you're a college student or an independent job seeker, ICL has the right pathway for you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* College Students */}
            <div className="rounded-2xl overflow-hidden border"
              style={{ borderColor: '#bfdbfe', boxShadow: '0 4px 24px rgba(13,43,140,0.08)' }}>
              <div className="p-8 pb-6" style={{ background: 'linear-gradient(135deg, #eff6ff, #dbeafe50)' }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #0d2b8c, #17a8c8)', boxShadow: '0 8px 24px rgba(13,43,140,0.35)' }}>
                  <GraduationCap className="w-7 h-7 text-white" />
                </div>
                <h3 className="icl-display font-black text-gray-900 text-[22px] mb-2">College Students</h3>
                <p className="text-gray-600 text-[14px] leading-relaxed">
                  Enrolled through your college? Access institution-curated jobs, campus-specific assessments,
                  and placement drive notifications — all synced with your college admin.
                </p>
              </div>
              <div className="px-8 py-6 bg-white">
                <ul className="space-y-3 mb-6">
                  {[
                    'College-specific job listings and placement drives',
                    'Campus assessments assigned by your institution',
                    'Batch course assignments from your college admin',
                    'Placement drive alerts and calendar',
                    'College performance rankings and leaderboards',
                  ].map(t => (
                    <li key={t} className="flex items-start gap-3 text-[13px] text-gray-700">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#0d2b8c' }} /> {t}
                    </li>
                  ))}
                </ul>
                <button onClick={() => navigate('/signup')}
                  className="inline-flex items-center gap-2 px-6 py-3 text-white font-bold rounded-xl text-[13px] transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #0d2b8c, #17a8c8)', boxShadow: '0 6px 20px rgba(13,43,140,0.35)' }}>
                  Join as Student <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Independent Candidates */}
            <div className="rounded-2xl overflow-hidden border"
              style={{ borderColor: '#bae6fd', boxShadow: '0 4px 24px rgba(23,168,200,0.08)' }}>
              <div className="p-8 pb-6" style={{ background: 'linear-gradient(135deg, #f0f9ff, #e0f7fd50)' }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #17a8c8, #0d2b8c)', boxShadow: '0 8px 24px rgba(23,168,200,0.35)' }}>
                  <Target className="w-7 h-7 text-white" />
                </div>
                <h3 className="icl-display font-black text-gray-900 text-[22px] mb-2">Independent Candidates</h3>
                <p className="text-gray-600 text-[14px] leading-relaxed">
                  Not affiliated with a college? Sign up as an independent candidate and access the full platform
                  — browse jobs, enroll in any course, and build your verified profile independently.
                </p>
              </div>
              <div className="px-8 py-6 bg-white">
                <ul className="space-y-3 mb-6">
                  {[
                    'Browse all public job listings from 200+ companies',
                    'Enroll in any publicly available course',
                    'Earn verifiable certificates independently',
                    'Build a verified skill profile recruiters trust',
                    'Get matched to opportunities based on your skills',
                  ].map(t => (
                    <li key={t} className="flex items-start gap-3 text-[13px] text-gray-700">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#17a8c8' }} /> {t}
                    </li>
                  ))}
                </ul>
                <button onClick={() => navigate('/signup')}
                  className="inline-flex items-center gap-2 px-6 py-3 text-white font-bold rounded-xl text-[13px] transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #17a8c8, #0d2b8c)', boxShadow: '0 6px 20px rgba(23,168,200,0.35)' }}>
                  Join as Candidate <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────────────────────── */}
      <section className="py-24" style={{ background: '#f8faff' }}>
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="icl-section-badge">
              <Star className="w-3 h-3" /> Student Stories
            </div>
            <h2 className="icl-display text-3xl md:text-[42px] font-black text-gray-900 mb-4">
              Careers Changed,<br /><span className="icl-gradient-text-warm">Lives Transformed</span>
            </h2>
            <p className="text-[15px] text-gray-500 max-w-lg mx-auto">
              Real students. Real results. Hear directly from those who launched their careers with ICL.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="icl-testimonial-card">
                <Quote className="w-8 h-8 mb-4" style={{ color: '#17a8c8' }} />
                <p className="text-gray-600 text-[14px] leading-relaxed mb-6 italic">"{t.text}"</p>
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(t.stars)].map((_, j) => <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                </div>
                <div className="flex items-center gap-3 pt-4 border-t" style={{ borderColor: '#f0f4ff' }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[13px] font-bold"
                    style={{ background: t.avatarColor }}>
                    {t.initials}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-[14px]">{t.name}</div>
                    <div className="text-[12px] font-medium" style={{ color: '#0d2b8c' }}>{t.role}</div>
                    <div className="text-[11px] text-gray-400">{t.college}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-[860px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="icl-section-badge">
              <Zap className="w-3 h-3" /> FAQ
            </div>
            <h2 className="icl-display text-3xl md:text-[40px] font-black text-gray-900 mb-4">
              Frequently Asked <span className="icl-gradient-text-warm">Questions</span>
            </h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((item, i) => <FAQItem key={i} item={item} index={i} />)}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────────────── */}
      <section className="py-28 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' }}>
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'radial-gradient(circle, #0d2b8c 1px, transparent 1px)', backgroundSize: '26px 26px' }} />
        <div className="absolute rounded-full opacity-10"
          style={{ width: 500, height: 500, background: 'radial-gradient(circle, #0d2b8c30, transparent)', top: '-150px', right: '-150px' }} />
        <div className="absolute rounded-full opacity-10"
          style={{ width: 400, height: 400, background: 'radial-gradient(circle, #17a8c820, transparent)', bottom: '-100px', left: '-100px' }} />

        <div className="relative max-w-[860px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="icl-dark-section-badge" style={{ display: 'inline-flex' }}>
            <Sparkles className="w-3 h-3" /> Start Today
          </div>
          <h2 className="icl-display font-black text-gray-900 leading-tight mb-5"
            style={{ fontSize: 'clamp(30px, 5vw, 52px)' }}>
            Your Career Journey<br />
            <span className="icl-gradient-text">Starts Right Now</span>
          </h2>
          <p className="text-[16px] mb-10 max-w-lg mx-auto" style={{ color: '#64748b' }}>
            Join over 10,000 students who've already taken the first step towards a brighter career.
            It's free, it's fast, and it could change everything.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={() => navigate('/signup')}
              className="inline-flex items-center gap-2 px-8 py-4 text-[16px] font-black text-white rounded-xl transition-all icl-hero-btn-primary">
              Create Free Account <ArrowRight className="w-5 h-5" />
            </button>
            <button onClick={() => navigate('/login')}
              className="inline-flex items-center gap-2 px-8 py-4 text-[16px] font-semibold rounded-xl transition-all"
              style={{ color: '#0d2b8c', border: '1px solid #bfdbfe', background: 'white' }}
              onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
              onMouseOut={e => e.currentTarget.style.background = 'white'}>
              Already have an account? Sign in
            </button>
          </div>
          <p className="mt-6 text-[12px]" style={{ color: '#94a3b8' }}>
            No credit card required · Free for all students · Cancel anytime
          </p>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">

            {/* Brand */}
            <div className="lg:col-span-1">
              <div className="flex items-center mb-4">
                <img
                  src={infoziantLogo}
                  alt="Infoziant"
                  className="h-8"
                  style={{ filter: 'none' }}
                />
              </div>
              <p className="text-[13px] leading-relaxed mb-5" style={{ color: '#64748b' }}>
                India's leading campus-to-career platform. Connecting learners with opportunities through skills, assessments and intelligent job matching.
              </p>
              <div className="flex items-center gap-3">
                {[Linkedin, Twitter, Instagram, Facebook].map((Icon, i) => (
                  <a key={i} href="#"
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                    style={{ background: 'white', border: '1px solid #e2e8f0', color: '#64748b' }}
                    onMouseOver={e => { e.currentTarget.style.background = '#0d2b8c'; e.currentTarget.style.color = 'white'; }}
                    onMouseOut={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#64748b'; }}>
                    <Icon className="w-3.5 h-3.5" />
                  </a>
                ))}
              </div>
            </div>

            <div>
              <div className="icl-display text-gray-900 font-bold text-[14px] mb-5">Platform</div>
              <ul className="space-y-3">
                {['Browse Courses', 'Job Listings', 'Skill Assessments', 'Certifications', 'My Dashboard'].map(l => (
                  <li key={l}>
                    <button onClick={() => navigate('/login')}
                      className="text-[13px] transition-colors"
                      style={{ color: '#64748b' }}
                      onMouseOver={e => e.currentTarget.style.color = '#0d2b8c'}
                      onMouseOut={e => e.currentTarget.style.color = '#64748b'}>
                      {l}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* For You */}
            <div>
              <div className="icl-display text-gray-900 font-bold text-[14px] mb-5">For You</div>
              <ul className="space-y-3">
                {['College Students', 'Independent Candidates', 'For Colleges', 'For Employers', 'Become a Trainer'].map(l => (
                  <li key={l}>
                    <button onClick={() => navigate('/login')}
                      className="text-[13px] transition-colors"
                      style={{ color: '#64748b' }}
                      onMouseOver={e => e.currentTarget.style.color = '#0d2b8c'}
                      onMouseOut={e => e.currentTarget.style.color = '#64748b'}>
                      {l}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <div className="icl-display text-gray-900 font-bold text-[14px] mb-5">Contact</div>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#0d2b8c' }} />
                  <span className="text-[13px]" style={{ color: '#64748b' }}>
                    Coimbatore, Tamil Nadu, India
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="w-4 h-4 flex-shrink-0" style={{ color: '#0d2b8c' }} />
                  <a href="mailto:hello@icl.today" className="text-[13px] transition-colors"
                    style={{ color: '#64748b' }}
                    onMouseOver={e => e.currentTarget.style.color = '#0d2b8c'}
                    onMouseOut={e => e.currentTarget.style.color = '#64748b'}>
                    hello@icl.today
                  </a>
                </li>
              </ul>
              <div className="mt-6 p-4 rounded-xl" style={{ background: 'white', border: '1px solid #e2e8f0' }}>
                <div className="text-[12px] font-bold mb-2" style={{ color: '#0d2b8c' }}>Free for Students</div>
                <div className="text-[11px]" style={{ color: '#94a3b8' }}>
                  Students enrolled through partner colleges get full access at zero cost.
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8" style={{ borderTop: '1px solid #e2e8f0' }}>
            <p className="text-[12px]" style={{ color: '#94a3b8' }}>
              © {new Date().getFullYear()} ICL — Innovation &amp; Career Launch. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              {['Privacy Policy', 'Terms of Use', 'Cookie Policy'].map(l => (
                <a key={l} href="#"
                  className="text-[12px] transition-colors"
                  style={{ color: '#94a3b8' }}
                  onMouseOver={e => e.currentTarget.style.color = '#0d2b8c'}
                  onMouseOut={e => e.currentTarget.style.color = '#94a3b8'}>
                  {l}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;