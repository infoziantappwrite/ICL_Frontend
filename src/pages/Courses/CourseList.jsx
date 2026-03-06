// pages/Courses/CourseList.jsx
// Student: Browse all available courses with search, filters, and recommendations
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Search, Filter, Star, Clock, Users, Award, ChevronRight,
  Zap, TrendingUp, RefreshCw, AlertCircle, PlayCircle, CheckCircle2,
  BarChart3, Layers, Globe, Cpu, Shield, Smartphone, Database, X
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
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
  Beginner:     { color: 'bg-green-100 text-green-700 border-green-200',   dot: 'bg-green-500' },
  Intermediate: { color: 'bg-blue-100 text-blue-700 border-blue-200',      dot: 'bg-blue-500'  },
  Advanced:     { color: 'bg-purple-100 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
};

const STATUS_CONFIG = {
  pending:   { label: 'Enrolled',    color: 'bg-amber-100 text-amber-700'  },
  active:    { label: 'In Progress', color: 'bg-blue-100 text-blue-700'    },
  completed: { label: 'Completed',   color: 'bg-green-100 text-green-700'  },
};

// ─── Sub-components ──────────────────────────────────────────────────────────
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
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col"
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
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-amber-400 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
            <Zap className="w-3 h-3" /> Recommended
          </div>
        )}

        {/* Delivery mode */}
        <div className="absolute top-3 right-3 bg-black/30 backdrop-blur-sm text-white text-xs font-medium px-2 py-0.5 rounded-full">
          {course.deliveryMode}
        </div>

        {/* Enrollment status overlay */}
        {statusCfg && (
          <div className="absolute bottom-3 left-3">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusCfg.color}`}>
              {statusCfg.label}
              {enrollment.status === 'active' && enrollment.overallProgress !== undefined && (
                <span className="ml-1">• {enrollment.overallProgress}%</span>
              )}
            </span>
          </div>
        )}

        {/* Completed check */}
        {enrollment?.status === 'completed' && (
          <div className="absolute bottom-3 right-3 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1">
        {/* Category */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
            {course.category}
          </span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${levelCfg.color}`}>
            {course.level}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-bold text-gray-900 text-base leading-snug mb-1 group-hover:text-blue-600 transition-colors line-clamp-2">
          {course.title}
        </h3>
        <p className="text-xs text-gray-500 mb-3 line-clamp-2 flex-1">
          {course.shortDescription || course.description}
        </p>

        {/* Instructor */}
        {course.instructor?.name && (
          <p className="text-xs text-gray-400 mb-3">by {course.instructor.name}</p>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> {course.duration?.hours}h
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /> {course.enrollmentCount || 0}
          </span>
          {course.rating?.count > 0 && (
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              {course.rating.average.toFixed(1)}
            </span>
          )}
          {course.certificateProvided && (
            <span className="flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-purple-400" /> Certificate
            </span>
          )}
        </div>

        {/* Progress bar (if enrolled) */}
        {enrollment?.status === 'active' && enrollment.overallProgress !== undefined && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span>{enrollment.overallProgress}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all"
                style={{ width: `${enrollment.overallProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Price + CTA */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
          <div>
            {price === 0 ? (
              <span className="font-bold text-green-600">Free</span>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900">{currency}{price}</span>
                {discountPct > 0 && course.price?.original !== price && (
                  <span className="text-xs text-gray-400 line-through">{currency}{course.price.original}</span>
                )}
                {discountPct > 0 && (
                  <span className="text-xs bg-green-100 text-green-700 px-1.5 rounded-full font-semibold">{discountPct}% off</span>
                )}
              </div>
            )}
          </div>
          <button className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 group-hover:gap-2 transition-all">
            {enrollment ? 'Continue' : 'View'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const FilterPill = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
      active
        ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
        : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-600'
    }`}
  >
    {children}
  </button>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const CourseList = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [level, setLevel] = useState('All');
  const [deliveryMode, setDeliveryMode] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 12, recommended: 'true' };
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
    <DashboardLayout title="Course Library">
      {/* Hero Banner */}
      <div className="mb-8">
        <div className="relative bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 rounded-3xl p-8 shadow-2xl shadow-blue-500/30 overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute w-72 h-72 bg-white rounded-full -top-24 -left-24 animate-pulse" />
            <div className="absolute w-96 h-96 bg-white rounded-full -bottom-32 -right-32 animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="text-white">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <BookOpen className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">Course Library</h1>
                  <p className="text-blue-100 text-sm">Advance your skills, boost your career</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-blue-100">
                <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4" /> {total} Courses Available</span>
                <span className="flex items-center gap-1.5"><Award className="w-4 h-4" /> Certificates Included</span>
                <span className="flex items-center gap-1.5"><TrendingUp className="w-4 h-4" /> Boost Placement Chances</span>
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard/student/my-courses')}
              className="flex-shrink-0 flex items-center gap-2 bg-white text-blue-700 font-semibold px-5 py-3 rounded-xl hover:bg-blue-50 transition-all shadow-lg"
            >
              <PlayCircle className="w-5 h-5" /> My Courses
            </button>
          </div>
        </div>
      </div>

      {/* Search + Filter Bar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search courses, skills, topics..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-11 pr-4 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-sm shadow-sm"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(p => !p)}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl border font-medium text-sm transition-all ${showFilters ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'}`}
        >
          <Filter className="w-4 h-4" />
          Filters
          {hasActiveFilters && <span className="w-2 h-2 bg-amber-400 rounded-full" />}
        </button>
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm text-red-500 border border-red-200 hover:bg-red-50 transition-all"
          >
            <X className="w-4 h-4" /> Clear
          </button>
        )}
      </div>

      {/* Filter Dropdowns */}
      {showFilters && (
        <div className="mb-6 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Category</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(c => (
                  <FilterPill key={c} active={category === c} onClick={() => { setCategory(c); setPage(1); }}>
                    {c}
                  </FilterPill>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Level</label>
              <div className="flex flex-wrap gap-2">
                {LEVELS.map(l => (
                  <FilterPill key={l} active={level === l} onClick={() => { setLevel(l); setPage(1); }}>
                    {l}
                  </FilterPill>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Delivery Mode</label>
              <div className="flex flex-wrap gap-2">
                {DELIVERY_MODES.map(m => (
                  <FilterPill key={m} active={deliveryMode === m} onClick={() => { setDeliveryMode(m); setPage(1); }}>
                    {m}
                  </FilterPill>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={fetchCourses} className="ml-auto text-sm text-red-600 font-medium underline">Retry</button>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-8">
          <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
        </div>
      )}

      {/* Recommended Section */}
      {!loading && recommended.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center">
              <Zap className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Recommended for You</h2>
              <p className="text-xs text-gray-500">Based on your skill gaps</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
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

      {/* All Courses */}
      {!loading && (
        <div>
          {recommended.length > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-blue-600" />
              </div>
              <h2 className="font-bold text-gray-900">All Courses</h2>
              <span className="text-sm text-gray-500">({regular.length})</span>
            </div>
          )}
          {courses.length === 0 ? (
            <div className="text-center py-20">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No courses found</p>
              <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
              {hasActiveFilters && (
                <button onClick={handleClearFilters} className="mt-4 text-blue-600 text-sm font-medium underline">Clear all filters</button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
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
        <div className="flex justify-center items-center gap-2 mt-8">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-xl text-sm font-medium ${p === page ? 'bg-blue-600 text-white' : 'border border-gray-200 text-gray-600 hover:border-blue-300'}`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage(p => Math.min(pages, p + 1))}
            disabled={page === pages}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </DashboardLayout>
  );
};

export default CourseList;