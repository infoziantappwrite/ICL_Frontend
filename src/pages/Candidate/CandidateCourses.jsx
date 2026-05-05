// src/pages/Candidate/CandidateCourses.jsx - Enhanced version
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Search, Star, Clock, Users, RefreshCw,
  AlertCircle, CheckCircle2, BarChart3, Layers, Globe,
  Cpu, Shield, Smartphone, Database, X, SlidersHorizontal,
  BookMarked, TrendingUp, Zap,
} from 'lucide-react';
import CandidateLayout from '../../components/layout/CandidateLayout';
import { courseAPI } from '../../api/Api';

const CATEGORIES = [
  'All', 'Full Stack Development', 'Data Science', 'AI/ML',
  'DevOps', 'Cloud Computing', 'Mobile Development', 'Cybersecurity', 'Blockchain', 'Other',
];

const CATEGORY_ICONS = {
  'Full Stack Development': Layers, 'Data Science': BarChart3, 'AI/ML': Cpu,
  'DevOps': RefreshCw, 'Cloud Computing': Globe, 'Mobile Development': Smartphone,
  'Cybersecurity': Shield, 'Blockchain': Database, 'Other': BookOpen,
};

const LEVELS = ['All', 'Beginner', 'Intermediate', 'Advanced'];

const LEVEL_COLOR = {
  Beginner:     'bg-green-50 text-green-700 border-green-200',
  Intermediate: 'bg-blue-50 text-blue-700 border-blue-200',
  Advanced:     'bg-purple-50 text-purple-700 border-purple-200',
};

const formatDuration = (d) => {
  if (!d) return null;
  if (typeof d === 'object') {
    if (d.hours != null) return `${d.hours}h`;
    if (d.weeks != null) return `${d.weeks}w`;
    return null;
  }
  return `${d}h`;
};

const CourseCard = ({ course, onClick }) => {
  const CatIcon = CATEGORY_ICONS[course.category] || BookOpen;
  const price = course.price?.discounted || course.price?.original || 0;
  const isEnrolled = course.enrollmentStatus === 'active' || course.enrollmentStatus === 'completed';
  const isCompleted = course.enrollmentStatus === 'completed';
  const progress = course.enrollmentProgress || 0;

  return (
    <div
      onClick={course.status === 'Coming Soon' ? undefined : onClick}
      className={`group bg-white rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col h-full ${
        course.status === 'Coming Soon'
          ? 'border-violet-200 cursor-default opacity-90'
          : 'border-gray-100 hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] cursor-pointer hover:-translate-y-1'
      }`}
    >
      {/* Thumbnail */}
      <div className="relative aspect-[16/9] bg-gray-100 overflow-hidden flex-shrink-0">
        {course.thumbnail ? (
          <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-cyan-50 to-indigo-50 group-hover:scale-105 transition-transform duration-500">
            <CatIcon className="w-10 h-10 text-blue-200" />
          </div>
        )}

        {/* Overlays */}
        {course.status === 'Coming Soon' && (
          <div className="absolute inset-0 bg-violet-900/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-violet-500 text-white text-xs font-black px-3 py-1.5 rounded-full animate-pulse">Coming Soon</span>
          </div>
        )}
        {isCompleted && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
            <CheckCircle2 className="w-3 h-3" /> Completed
          </div>
        )}
        {isEnrolled && !isCompleted && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
            <BookOpen className="w-3 h-3" /> Enrolled
          </div>
        )}
        {course.isFeatured && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
            <Zap className="w-3 h-3" /> Featured
          </div>
        )}

        {/* Progress bar (if enrolled) */}
        {isEnrolled && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-200/80">
            <div className={`h-full transition-all ${isCompleted ? 'bg-emerald-500' : 'bg-gradient-to-r from-cyan-500 to-blue-500'}`}
              style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-2 gap-2">
          {course.level && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${LEVEL_COLOR[course.level] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
              {course.level}
            </span>
          )}
          {course.averageRating > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-amber-500 font-bold ml-auto">
              <Star className="w-3 h-3 fill-amber-400" /> {course.averageRating.toFixed(1)}
            </span>
          )}
        </div>

        <h3 className="font-bold text-gray-900 text-[13px] leading-snug mb-1 group-hover:text-blue-600 transition-colors line-clamp-2">
          {course.title}
        </h3>
        <p className="text-[11px] text-gray-400 mb-3">{course.category}</p>

        <div className="mt-auto space-y-2">
          {/* Enrolled progress (if active) */}
          {isEnrolled && !isCompleted && progress > 0 && (
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[10px] text-gray-400">Progress</span>
                <span className="text-[10px] font-bold text-cyan-600">{progress}%</span>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between text-[11px] text-gray-400">
            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {(course.totalEnrollments || 0).toLocaleString()}</span>
            {formatDuration(course.duration) && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDuration(course.duration)}</span>}
            <span className="font-bold text-gray-700">{price === 0 ? 'Free' : `₹${price}`}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
    <div className="aspect-[16/9] bg-gray-200" />
    <div className="p-4 space-y-2">
      <div className="h-3 bg-gray-200 rounded w-1/3" />
      <div className="h-4 bg-gray-200 rounded w-4/5" />
      <div className="h-3 bg-gray-200 rounded w-2/5" />
      <div className="h-3 bg-gray-200 rounded w-3/5" />
    </div>
  </div>
);

const CandidateCourses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [level, setLevel] = useState('All');
  const [priceFilter, setPriceFilter] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // all | enrolled

  const fetchCourses = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await courseAPI.getAllCourses({ status: 'active', limit: 100 });
      if (res?.success) setCourses(res.courses || res.data || []);
      else setError(res?.message || 'Failed to load courses');
    } catch {
      setError('Failed to load courses. Please try again.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const filtered = courses.filter(c => {
    const matchSearch = !search || c.title?.toLowerCase().includes(search.toLowerCase()) || c.category?.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'All' || c.category === category;
    const matchLevel = level === 'All' || c.level === level;
    const price = c.price?.discounted || c.price?.original || 0;
    const matchPrice = priceFilter === 'All' || (priceFilter === 'Free' && price === 0) || (priceFilter === 'Paid' && price > 0);
    const isEnrolled = c.enrollmentStatus === 'active' || c.enrollmentStatus === 'completed';
    const matchTab = activeTab === 'all' || (activeTab === 'enrolled' && isEnrolled);
    return matchSearch && matchCat && matchLevel && matchPrice && matchTab;
  });

  const clearFilters = () => { setSearch(''); setCategory('All'); setLevel('All'); setPriceFilter('All'); };
  const hasFilters = search || category !== 'All' || level !== 'All' || priceFilter !== 'All';

  const enrolledCount = courses.filter(c => c.enrollmentStatus === 'active' || c.enrollmentStatus === 'completed').length;

  return (
    <CandidateLayout>
      <div className="min-h-screen bg-[#f0f4f8] px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
        <div className="max-w-[1400px] mx-auto space-y-4 sm:space-y-5">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-[22px] md:text-[28px] font-black text-gray-900 tracking-tight">
                Browse <span className="text-cyan-600">Courses</span>
              </h1>
              <p className="text-[13px] text-gray-500 mt-1">
                {loading ? 'Loading...' : `${filtered.length} courses available · ${enrolledCount} enrolled`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => navigate('/dashboard/candidate/my-courses')}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-cyan-600 text-white rounded-xl text-[13px] font-semibold hover:bg-cyan-700 transition-all shadow-sm">
                <BookMarked className="w-3.5 h-3.5" /> My Learning
              </button>
              <button onClick={() => setShowFilters(v => !v)}
                className="sm:hidden inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-xl text-[13px] font-semibold text-gray-600 shadow-sm">
                <SlidersHorizontal className="w-4 h-4" /> Filters {hasFilters && <span className="w-2 h-2 bg-cyan-500 rounded-full" />}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            {[
              { key: 'all', label: 'All Courses', count: courses.length },
              { key: 'enrolled', label: 'My Courses', count: enrolledCount },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all ${activeTab === tab.key ? 'bg-cyan-600 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:border-cyan-300 hover:text-cyan-600'}`}>
                {tab.label}
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>{tab.count}</span>
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className={`bg-white rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-100 p-3 ${showFilters ? 'block' : 'hidden sm:block'}`}>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search courses..."
                  className="w-full pl-9 pr-3 py-2 text-[13px] border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-100 focus:border-cyan-400 outline-none" />
              </div>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="px-3 py-2 text-[13px] border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-100 focus:border-cyan-400 outline-none bg-white min-w-[155px]">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <select value={level} onChange={e => setLevel(e.target.value)}
                className="px-3 py-2 text-[13px] border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-100 focus:border-cyan-400 outline-none bg-white min-w-[110px]">
                {LEVELS.map(l => <option key={l}>{l}</option>)}
              </select>
              <select value={priceFilter} onChange={e => setPriceFilter(e.target.value)}
                className="px-3 py-2 text-[13px] border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-100 focus:border-cyan-400 outline-none bg-white min-w-[90px]">
                {['All', 'Free', 'Paid'].map(p => <option key={p}>{p}</option>)}
              </select>
              {hasFilters && (
                <button onClick={clearFilters}
                  className="flex items-center gap-1 px-3 py-2 text-[12px] font-semibold text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                  <X className="w-3.5 h-3.5" /> Clear
                </button>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-[13px] text-red-700 flex-1">{error}</p>
              <button onClick={fetchCourses} className="text-[12px] font-bold text-red-600 flex items-center gap-1">
                <RefreshCw className="w-3.5 h-3.5" /> Retry
              </button>
            </div>
          )}

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <div className="w-14 h-14 bg-cyan-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-7 h-7 text-cyan-300" />
              </div>
              <p className="text-[15px] font-bold text-gray-600">No courses found</p>
              <p className="text-[13px] text-gray-400 mt-1 mb-4">Try adjusting your search or filters</p>
              {hasFilters && (
                <button onClick={clearFilters}
                  className="inline-flex items-center gap-1.5 text-[13px] font-bold text-cyan-600 bg-cyan-50 hover:bg-cyan-100 px-4 py-2 rounded-xl transition-colors">
                  <X className="w-3.5 h-3.5" /> Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map(course => (
                <CourseCard key={course._id} course={course}
                  onClick={() => navigate(`/dashboard/candidate/courses/${course._id}`)} />
              ))}
            </div>
          )}

        </div>
      </div>
    </CandidateLayout>
  );
};

export default CandidateCourses;
