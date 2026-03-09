// pages/Courses/CourseList.jsx
// Student: Browse all available courses with search, filters, and recommendations
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Search, Filter, Star, Clock, Users, Award, ChevronRight,
  Zap, RefreshCw, AlertCircle, PlayCircle, CheckCircle2,
  BarChart3, Layers, Globe, Cpu, Shield, Smartphone, Database, X, BookMarked
} from 'lucide-react';
import StudentLayout from '../../components/layout/StudentLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { courseAPI } from '../../api/Api';

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  'All',
  'Full Stack Development',
  'Data Science',
  'AI/ML',
  'DevOps',
  'Cloud Computing',
  'Mobile Development',
  'Cybersecurity',
  'Blockchain',
  'Other',
];

const CATEGORY_ICONS = {
  'Full Stack Development': Layers,
  'Data Science': BarChart3,
  'AI/ML': Cpu,
  'DevOps': RefreshCw,
  'Cloud Computing': Globe,
  'Mobile Development': Smartphone,
  'Cybersecurity': Shield,
  'Blockchain': Database,
  'Other': BookOpen,
};

const LEVELS = ['All', 'Beginner', 'Intermediate', 'Advanced'];
const DELIVERY_MODES = ['All', 'ONLINE', 'OFFLINE', 'HYBRID'];

const LEVEL_CONFIG = {
  Beginner: { color: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500' },
  Intermediate: { color: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  Advanced: { color: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
};

const STATUS_CONFIG = {
  pending: { label: 'Enrolled', color: 'bg-amber-100 text-amber-700' },
  active: { label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700' },
};

// ─── Sub-components ──────────────────────────────────────────────────────────
const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ${className}`}>
    {children}
  </div>
);

const CourseCard = ({ course, onClick }) => {
  const levelCfg = LEVEL_CONFIG[course.level] || LEVEL_CONFIG.Beginner;
  const CatIcon = CATEGORY_ICONS[course.category] || BookOpen;
  const enrollment = course.enrollment;
  const statusCfg = enrollment ? STATUS_CONFIG[enrollment.status] : null;
  const discountPct = course.discountPercentage || 0;
  const price = course.price?.discounted || course.price?.original || 0;
  const currency = course.price?.currency === 'USD' ? '$' : '₹';

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-lg hover:shadow-blue-500/10 transition-all cursor-pointer overflow-hidden flex flex-col h-full relative"
    >
      {/* Thumbnail / Header */}
      <div className="relative h-40 bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-600 overflow-hidden flex-shrink-0">
        {course.thumbnail ? (
          <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <CatIcon className="w-16 h-16 text-white/30" />
          </div>
        )}

        {/* Recommended badge */}
        {course.isRecommended && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-yellow-400 text-yellow-900 border border-yellow-300 text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
            <Zap className="w-3 h-3" /> Recommended
          </div>
        )}

        {/* Delivery mode */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm border border-white/50 text-gray-800 text-[11px] font-bold px-2 py-0.5 rounded shadow-sm">
          {course.deliveryMode}
        </div>

        {/* Enrollment status overlay */}
        {statusCfg && (
          <div className="absolute bottom-3 left-3">
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md backdrop-blur-md border ${statusCfg.label === 'Completed' ? 'bg-green-500/90 text-white border-green-400' :
                statusCfg.label === 'In Progress' ? 'bg-blue-600/90 text-white border-blue-400' :
                  'bg-amber-500/90 text-white border-amber-400'
              }`}>
              {statusCfg.label}
              {enrollment.status === 'active' && enrollment.overallProgress !== undefined && (
                <span className="ml-1">• {enrollment.overallProgress}%</span>
              )}
            </span>
          </div>
        )}

        {/* Completed check */}
        {enrollment?.status === 'completed' && (
          <div className="absolute bottom-3 right-3 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
            <CheckCircle2 className="w-4 h-4 text-white" />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 sm:p-5 flex flex-col flex-1">
        {/* Category */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-[10px] sm:text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 sm:px-2.5 py-0.5 rounded">
            {course.category}
          </span>
          <span className={`text-[10px] sm:text-[11px] font-bold px-2 sm:px-2.5 py-0.5 rounded border ${course.level === 'Beginner' ? 'bg-green-50 text-green-700 border-green-200' :
              course.level === 'Intermediate' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                'bg-purple-50 text-purple-700 border-purple-200'
            }`}>
            {course.level}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-bold text-[15px] sm:text-[16px] text-gray-900 leading-tight mb-1.5 group-hover:text-blue-600 transition-colors line-clamp-2">
          {course.title}
        </h3>
        <p className="text-[12px] sm:text-[13px] text-gray-500 mb-3 line-clamp-2 flex-1">
          {course.shortDescription || course.description}
        </p>

        {/* Instructor */}
        {course.instructor?.name && (
          <p className="text-[11px] sm:text-[12px] text-gray-400 mb-3">by <span className="font-medium text-gray-600">{course.instructor.name}</span></p>
        )}

        {/* Stats row */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[11px] sm:text-[12px] text-gray-500 mb-4 font-medium">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-gray-400" /> {course.duration?.hours}h
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-gray-400" /> {course.enrollmentCount || 0}
          </span>
          {course.rating?.count > 0 && (
            <span className="flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
              {course.rating.average.toFixed(1)}
            </span>
          )}
        </div>

        {/* Progress bar (if enrolled) */}
        {enrollment?.status === 'active' && enrollment.overallProgress !== undefined && (
          <div className="mb-4">
            <div className="flex justify-between text-[11px] sm:text-[12px] font-bold text-gray-500 mb-1.5">
              <span>Progress</span>
              <span className="text-blue-600">{enrollment.overallProgress}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all"
                style={{ width: `${enrollment.overallProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Price + CTA */}
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
          <div>
            {price === 0 ? (
              <span className="text-[12px] sm:text-[13px] font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded border border-green-200">Free</span>
            ) : (
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="text-[13px] sm:text-[14px] font-bold text-gray-900">{currency}{price}</span>
                {discountPct > 0 && course.price?.original !== price && (
                  <span className="text-[10px] sm:text-[11px] text-gray-400 line-through">{currency}{course.price.original}</span>
                )}
                {discountPct > 0 && (
                  <span className="text-[9px] sm:text-[10px] bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded font-bold">{discountPct}% off</span>
                )}
              </div>
            )}
          </div>
          <button className="flex flex-shrink-0 items-center gap-0.5 sm:gap-1 text-[12px] sm:text-[13px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 transition-all">
            {enrollment ? 'Continue' : 'View'}
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-500 group-hover:text-blue-600 transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const CourseList = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters State
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [level, setLevel] = useState('All');
  const [deliveryMode, setDeliveryMode] = useState('All');

  // Pagination State
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  // Mobile Filter Toggle
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Assuming 9 items per page fits 3 columns better
      const params = { page, limit: 9, recommended: 'true' };
      if (search.trim()) params.search = search.trim();
      if (category !== 'All') params.category = category;
      if (level !== 'All') params.level = level;
      if (deliveryMode !== 'All') params.deliveryMode = deliveryMode;

      const res = await courseAPI.getAllCourses(params);
      if (res.success) {
        setCourses(res.data || []);
        setTotal(res.total || 0);
        setPages(res.pages || 1);
      } else {
        setError(res.message || 'Failed to load courses');
      }
    } catch (err) {
      setError(err.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  }, [search, category, level, deliveryMode, page]);

  useEffect(() => {
    const t = setTimeout(fetchCourses, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchCourses]);

  const handleClearFilters = () => {
    setCategory('All');
    setLevel('All');
    setDeliveryMode('All');
    setSearch('');
    setPage(1);
  };

  const hasActiveFilters = category !== 'All' || level !== 'All' || deliveryMode !== 'All' || search;
  const recommended = courses.filter(c => c.isRecommended);
  const regular = courses.filter(c => !c.isRecommended);

  if (loading && courses.length === 0) {
    return <LoadingSpinner message="Loading Courses..." submessage="Finding the best courses for you" icon={BookOpen} />;
  }

  return (
    <StudentLayout title="Course Library">
      <div className="min-h-screen bg-[#f8f9fa] -mx-4 lg:-mx-6 -mt-4 lg:-mt-6 px-4 md:px-6 lg:px-8 py-6 text-gray-900">
        <div className="max-w-[1240px] mx-auto">

          <div className="mt-4 lg:mt-6 grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-6">

            {/* ─── LEFT SIDEBAR (FILTERS) ─── */}
            <div className="md:col-span-3 space-y-5 md:sticky md:top-[100px] md:self-start h-fit">

              {/* Mobile Filter Toggle */}
              <button
                onClick={() => setShowFiltersMobile(!showFiltersMobile)}
                className="md:hidden w-full flex items-center justify-center gap-2 bg-white px-5 py-3 rounded-2xl border border-gray-100 text-[14px] font-bold text-gray-700 shadow-sm shadow-gray-200/50"
              >
                <Filter className="w-4 h-4" />
                {showFiltersMobile ? 'Hide Filters' : 'Show Filters'}
                {hasActiveFilters && <span className="w-2 h-2 bg-blue-600 rounded-full ml-1" />}
              </button>

              <div className={`space-y-5 ${showFiltersMobile ? 'block' : 'hidden md:block'}`}>

                {/* Search Card */}
                <Card className="p-5">
                  <h3 className="text-[13px] font-bold text-gray-900 uppercase tracking-wider mb-3">Search</h3>
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search courses..."
                      value={search}
                      onChange={e => { setSearch(e.target.value); setPage(1); }}
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:bg-white text-[13px] text-gray-900 placeholder-gray-400 transition-all"
                    />
                    {search && (
                      <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </Card>

                {/* Filters Card */}
                <Card className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[13px] font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                      <Filter className="w-4 h-4 text-gray-400" /> Filter Tools
                    </h3>
                    {hasActiveFilters && (
                      <button
                        onClick={handleClearFilters}
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  <div className="space-y-6">
                    {/* Category Filter */}
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2.5">Category</label>
                      <div className="flex flex-col gap-1">
                        {CATEGORIES.map(c => (
                          <label key={c} className="flex items-center gap-2 cursor-pointer group">
                            <input
                              type="radio"
                              name="category"
                              checked={category === c}
                              onChange={() => { setCategory(c); setPage(1); }}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                            />
                            <span className={`text-[13px] font-medium transition-colors ${category === c ? 'text-gray-900 font-bold' : 'text-gray-600 group-hover:text-gray-900'}`}>{c}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="h-px bg-gray-100 w-full" />

                    {/* Level Filter */}
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2.5">Level</label>
                      <div className="flex flex-wrap gap-2">
                        {LEVELS.map(l => (
                          <button
                            key={l}
                            onClick={() => { setLevel(l); setPage(1); }}
                            className={`px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all border ${level === l
                                ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm'
                                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                              }`}
                          >
                            {l}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="h-px bg-gray-100 w-full" />

                    {/* Delivery Mode Filter */}
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2.5">Delivery Mode</label>
                      <div className="flex flex-wrap gap-2">
                        {DELIVERY_MODES.map(m => (
                          <button
                            key={m}
                            onClick={() => { setDeliveryMode(m); setPage(1); }}
                            className={`px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all border ${deliveryMode === m
                                ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm'
                                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                              }`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>

              </div>
            </div>

            {/* ─── RIGHT MAIN CONTENT (COURSES) ─── */}
            <div className="md:col-span-9 space-y-6">

              {/* Elegant Simplified Hero Banner */}
              <Card className="p-5 md:p-8 relative overflow-hidden flex flex-col items-start justify-center min-h-[160px] bg-gradient-to-r from-white to-blue-50/30">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-blue-100/50 rounded-full blur-3xl pointer-events-none translate-x-1/3 -translate-y-1/3" />
                <div className="absolute bottom-0 right-20 w-[150px] h-[150px] bg-cyan-100/30 rounded-full blur-2xl pointer-events-none translate-y-1/2" />
                <BookMarked className="absolute bottom-4 right-6 w-24 h-24 text-blue-500/5 -rotate-12 pointer-events-none" />

                <div className="relative z-10 max-w-[600px]">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-[11px] font-bold mb-3">
                    <Zap className="w-3 h-3" /> Let's Learn Something New!
                  </div>
                  <h2 className="text-[24px] md:text-[28px] font-extrabold text-gray-900 leading-tight mb-2 tracking-tight">
                    Explore Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Premium Course Library</span>
                  </h2>
                  {/* <p className="text-[14px] text-gray-500 mb-5 font-medium">Advance your skills, earn certificates, and boost your career with certified courses taught by industry experts.</p> */}

                  <div className="flex flex-wrap items-center gap-3">
                    <button onClick={() => navigate('/dashboard/student/my-courses')} className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white px-6 py-2.5 rounded-full text-[13px] font-bold transition-all shadow-md shadow-blue-500/20 whitespace-nowrap flex items-center gap-2">
                      My Enrolled Courses <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <p className="text-[13px] text-red-800 font-medium">{error}</p>
                  <button onClick={fetchCourses} className="ml-auto text-[13px] text-red-600 font-bold hover:underline">Retry</button>
                </div>
              )}

              {loading && (
                <div className="flex justify-center py-12">
                  <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
              )}

              {/* Recommended Section (Within Content Grid) */}
              {!loading && recommended.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center shadow-sm shadow-yellow-500/20">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="font-bold text-[18px] text-gray-900 leading-tight">Hand-picked for You</h2>
                  </div>

                  {/* Because it's within a 9-col wrapper, 3 columns works perfectly for MD+ */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {recommended.map(course => (
                      <CourseCard
                        key={course._id}
                        course={course}
                        onClick={() => navigate(`/dashboard/student/courses/${course._id}`)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* All Courses Section */}
              {!loading && (
                <div>
                  {recommended.length > 0 && (
                    <div className="flex items-center gap-2 mb-4 mt-8 pt-6 border-t border-gray-100">
                      <div className="w-8 h-8 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-blue-600" />
                      </div>
                      <h2 className="font-bold text-[18px] text-gray-900 leading-tight">All Available Courses</h2>
                      <span className="text-[12px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{regular.length}</span>
                    </div>
                  )}

                  {courses.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm mt-4">
                      <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-[16px] text-gray-900 font-bold leading-tight">No courses found</p>
                      <p className="text-[13px] text-gray-500 mt-1">Try adjusting your search or filters on the left.</p>
                      {hasActiveFilters && (
                        <button onClick={handleClearFilters} className="mt-5 px-5 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-[13px] font-bold rounded-full hover:shadow-md hover:shadow-blue-500/20 transition-all inline-block">Reset filters</button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {(recommended.length > 0 ? regular : courses).map(course => (
                        <CourseCard
                          key={course._id}
                          course={course}
                          onClick={() => navigate(`/dashboard/student/courses/${course._id}`)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Pagination */}
              {pages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8 pb-6">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 rounded-lg border border-gray-200 text-[13px] font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed bg-white shadow-sm"
                  >
                    Previous
                  </button>
                  {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-9 h-9 flex items-center justify-center rounded-lg text-[13px] font-bold border transition-all shadow-sm ${p === page ? 'bg-gradient-to-r from-blue-600 to-cyan-500 border-none text-white shadow-blue-500/20' : 'border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50 bg-white'}`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage(p => Math.min(pages, p + 1))}
                    disabled={page === pages}
                    className="px-4 py-2 rounded-lg border border-gray-200 text-[13px] font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed bg-white shadow-sm"
                  >
                    Next
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};

export default CourseList;