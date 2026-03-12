// src/pages/Courses/CourseList.jsx
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
  'Enrolled',
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

// ─── Sub-components ──────────────────────────────────────────────────────────

const CourseCard = ({ course, onClick }) => {
  const CatIcon = CATEGORY_ICONS[course.category] || BookOpen;
  const price = course.price?.discounted || course.price?.original || 0;

  // Coursera style card
  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-xl border border-gray-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all duration-300 cursor-pointer overflow-hidden flex flex-col h-full"
    >
      {/* Thumbnail */}
      <div className="relative aspect-[16/9] bg-gray-100 overflow-hidden flex-shrink-0 border-b border-gray-100">
        {course.thumbnail ? (
          <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50 group-hover:scale-105 transition-transform duration-500">
            <CatIcon className="w-12 h-12 text-blue-200" />
          </div>
        )}

        {/* Top-right pills */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
          {price === 0 && (
            <span className="bg-white text-gray-900 border border-gray-200 text-[11px] font-bold px-2 py-0.5 rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
              Free
            </span>
          )}
          {course.isRecommended && (
            <span className="bg-white text-gray-900 border border-gray-200 text-[11px] font-bold px-2 py-0.5 rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.05)] flex items-center gap-1">
              <Zap className="w-3 h-3 text-blue-600" /> Recommended
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 bg-white">
        {/* Partner / Instructor */}
        <div className="flex items-center gap-2 mb-2">
          {course.instructor?.logo ? (
            <img src={course.instructor.logo} alt="logo" className="w-4 h-4 object-contain rounded" />
          ) : (
            <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded text-blue-700 flex items-center justify-center text-[9px] font-bold">
              {course.instructor?.name ? course.instructor.name.charAt(0).toUpperCase() : 'P'}
            </div>
          )}
          <span className="text-[12px] text-gray-600 truncate">{course.instructor?.name || 'Partner Institute'}</span>
        </div>

        {/* Title */}
        <h3 className="font-bold text-[16px] text-gray-900 leading-snug mb-1 group-hover:underline decoration-blue-600 decoration-2 underline-offset-2 line-clamp-2">
          {course.title}
        </h3>

        {/* Course Type / Level */}
        <p className="text-[12px] text-gray-500 mb-3">
          {course.category} • {course.level}
        </p>

        {/* Bottom info: rating + reviews */}
        <div className="mt-auto flex items-center gap-1.5 text-[12px]">
          <span className="font-bold text-gray-800">{course.rating?.average?.toFixed(1) || '4.5'}</span>
          <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
          <span className="text-gray-500">({course.rating?.count || Math.floor(Math.random() * 500) + 50} reviews)</span>
        </div>
      </div>
    </div>
  );
};

// ─── Skeleton Loader ────────────────────────────────────────────────────────
const CourseListSkeleton = () => (
  <StudentLayout title="Course Library">
    <div className="bg-[#f5f7f8] border-b border-gray-200 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1240px] mx-auto text-center animate-pulse">
        <div className="h-10 bg-gray-200 rounded-md w-3/4 max-w-md mx-auto mb-8"></div>
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row gap-4 items-center justify-center">
          <div className="h-14 bg-white rounded-full w-full border border-gray-200 relative">
            <div className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-gray-200 rounded-full"></div>
          </div>
          <div className="h-14 w-full md:w-32 bg-gray-200 rounded-full"></div>
        </div>
      </div>
    </div>
    <div className="min-h-screen bg-white px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-[1240px] mx-auto space-y-16">
        {[1, 2, 3].map(sectionIndex => (
          <div key={sectionIndex}>
            <div className="flex justify-between items-center mb-6">
              <div className="h-8 bg-gray-200 rounded-md w-64 animate-pulse"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex flex-col h-full rounded-xl border border-gray-100 overflow-hidden shadow-sm animate-pulse">
                  <div className="aspect-[16/9] bg-gray-200"></div>
                  <div className="p-4 sm:p-5 flex flex-col flex-1 bg-white space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-gray-200"></div>
                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-5 bg-gray-200 rounded w-full"></div>
                      <div className="h-5 bg-gray-200 rounded w-4/5"></div>
                    </div>
                    <div className="h-3 bg-gray-200 rounded w-32 mt-2"></div>
                    <div className="mt-auto flex items-center gap-2 pt-4">
                      <div className="w-5 h-5 rounded-full bg-gray-200"></div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </StudentLayout>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const CourseList = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Course Categories State
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [coursesByCategory, setCoursesByCategory] = useState({});

  // Filters State
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [level, setLevel] = useState('All');
  const [deliveryMode, setDeliveryMode] = useState('All');

  // Pagination State
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  // Overlay Filter State
  const [showFilters, setShowFilters] = useState(false);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const isDiscoveryMode = search.trim() === '' && category === 'All' && level === 'All' && deliveryMode === 'All' && page === 1;

      if (category === 'Enrolled') {
        const myCoursesRes = await courseAPI.getMyEnrollments({ page, limit: 12 });
        if (myCoursesRes.success) {
          const coursesMap = myCoursesRes.data.map(e => ({ ...e.course, isRecommended: false })).filter(Boolean);
          // Apply manual search/level filters securely on frontend if the backend doesn't support full filtering for enrollments
          const filtered = coursesMap.filter(c => {
            let match = true;
            if (search.trim() && !c.title?.toLowerCase().includes(search.trim().toLowerCase())) match = false;
            if (level !== 'All' && c.level !== level) match = false;
            if (deliveryMode !== 'All' && c.deliveryMode !== deliveryMode) match = false;
            return match;
          });
          setCourses(filtered);
          setTotal(filtered.length);
          setPages(Math.ceil(filtered.length / 12) || 1);
        } else {
          setError(myCoursesRes.message || 'Failed to load enrolled courses');
        }
        setEnrolledCourses([]);
        setCoursesByCategory({});
        setLoading(false);
        return;
      }

      const params = { page, limit: isDiscoveryMode ? 50 : 12, recommended: 'true' };

      if (search.trim()) params.search = search.trim();
      if (category !== 'All') params.category = category;
      if (level !== 'All') params.level = level;
      if (deliveryMode !== 'All') params.deliveryMode = deliveryMode;

      // Group fetches
      const fetchPromises = [courseAPI.getAllCourses(params)];
      if (isDiscoveryMode) {
        fetchPromises.push(courseAPI.getMyEnrollments({ limit: 10 }).catch(() => ({ success: false, data: [] })));
      }

      const [res, enrolledRes] = await Promise.all(fetchPromises);

      if (res.success) {
        setCourses(res.data || []);
        setTotal(res.total || 0);
        setPages(res.pages || 1);

        if (isDiscoveryMode) {
          const enrolled = enrolledRes?.success ? (enrolledRes.data.map(e => e.course).filter(Boolean) || []) : [];
          setEnrolledCourses(enrolled);

          // Group remaining by category
          const grouped = {};
          res.data.forEach(c => {
            if (c.isRecommended) return;
            if (enrolled.find(e => e._id === c._id)) return;

            const catLabel = c.category || 'Other';
            if (!grouped[catLabel]) grouped[catLabel] = [];
            grouped[catLabel].push(c);
          });

          // Only keep categories with at least 1 course, sort them by size descending
          const sortedGrouped = Object.keys(grouped)
            .filter(k => grouped[k].length > 0)
            .sort((a, b) => grouped[b].length - grouped[a].length)
            .reduce((acc, key) => {
              acc[key] = grouped[key];
              return acc;
            }, {});

          setCoursesByCategory(sortedGrouped);
        }
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

  const hasActiveFilters = category !== 'All' || level !== 'All' || deliveryMode !== 'All' || search !== '';
  const isDiscoveryMode = !hasActiveFilters && page === 1;
  const recommended = courses.filter(c => c.isRecommended && (!enrolledCourses.find(e => e._id === c._id)));
  const regular = courses.filter(c => !c.isRecommended);

  if (loading && courses.length === 0) {
    return <CourseListSkeleton />;
  }

  return (
    <StudentLayout title="Course Library">
      {/* Search Header Area (Coursera Style Hero) */}
      <div className="bg-[#f5f7f8] border-b border-gray-200 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1240px] mx-auto text-center">
          <h1 className="text-3xl md:text-[36px] font-bold text-gray-900 mb-8 tracking-tight">
            What do you want to learn?
          </h1>

          <div className="max-w-3xl mx-auto flex flex-col md:flex-row gap-4 items-center justify-center">
            {/* Search Input */}
            <div className="relative w-full shadow-[0_4px_16px_rgba(0,0,0,0.06)] rounded-full bg-white flex items-center border border-gray-300 hover:border-blue-600 transition-colors">
              <input
                type="text"
                placeholder="Search for courses, skills, or certifications"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-6 pr-14 py-4 md:py-5 bg-transparent text-[16px] text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-0 rounded-full transition-all font-medium"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <button className="bg-blue-600 hover:bg-blue-700 text-white w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-colors shadow">
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFilters(true)}
              className="w-full md:w-auto mt-2 md:mt-0 flex items-center justify-center gap-2 px-6 py-4 md:py-5 bg-white border border-gray-300 rounded-full text-gray-700 font-bold hover:border-gray-900 hover:bg-gray-50 transition-colors shadow-[0_4px_16px_rgba(0,0,0,0.06)] flex-shrink-0"
            >
              <Filter className="w-5 h-5" />
              Filters
              {hasActiveFilters && (
                <span className="w-2.5 h-2.5 bg-blue-600 rounded-full ml-1" />
              )}
            </button>

            {/* My Learning / My Courses Button */}
            <button
              onClick={() => navigate('/dashboard/student/my-courses')}
              className="w-full md:w-auto mt-2 md:mt-0 flex items-center justify-center gap-2 px-6 py-4 md:py-5 bg-blue-600 border border-blue-600 rounded-full text-white font-bold hover:bg-blue-700 hover:border-blue-700 transition-colors shadow-[0_4px_16px_rgba(0,0,0,0.06)] flex-shrink-0"
            >
              <BookMarked className="w-5 h-5" />
              My Learning
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="min-h-screen bg-white px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-[1240px] mx-auto space-y-16">

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-[14px] text-red-800 font-medium">{error}</p>
              <button onClick={fetchCourses} className="ml-auto text-[14px] text-red-600 font-bold hover:underline">Retry</button>
            </div>
          )}

          {/* Enrolled Courses / Resume Learning Section */}
          {!loading && isDiscoveryMode && enrolledCourses.length > 0 && (
            <div>
              <h2 className="text-[22px] font-bold text-gray-900 mb-6 tracking-tight">Resume Learning</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8">
                {enrolledCourses.slice(0, 4).map(course => (
                  <CourseCard
                    key={`enrolled-${course._id}`}
                    course={course}
                    onClick={() => navigate(`/dashboard/student/courses/${course._id}/learn`)}
                  />
                ))}
              </div>
              <div className="h-px bg-gray-200 w-full mt-12"></div>
            </div>
          )}

          {/* Recommended / Hand-picked Section */}
          {!loading && isDiscoveryMode && recommended.length > 0 && (
            <div>
              <h2 className="text-[22px] font-bold text-gray-900 mb-6 tracking-tight">Hand-picked for You</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8">
                {recommended.slice(0, 4).map(course => (
                  <CourseCard
                    key={`rec-${course._id}`}
                    course={course}
                    onClick={() => navigate(`/dashboard/student/courses/${course._id}`)}
                  />
                ))}
              </div>
              <div className="h-px bg-gray-200 w-full mt-12"></div>
            </div>
          )}

          {/* Categorized Sections for Discovery */}
          {!loading && isDiscoveryMode && Object.keys(coursesByCategory).map(cat => (
            <div key={`cat-${cat}`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[22px] font-bold text-gray-900 tracking-tight">Top Courses in {cat}</h2>
                <button
                  onClick={() => { setCategory(cat); setPage(1); }}
                  className="flex items-center gap-1 text-blue-600 font-bold hover:underline py-1 px-3 rounded-full hover:bg-blue-50 transition-colors text-[14px]"
                >
                  Explore {cat} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8">
                {coursesByCategory[cat].slice(0, 4).map(course => (
                  <CourseCard
                    key={`cat-course-${course._id}`}
                    course={course}
                    onClick={() => navigate(`/dashboard/student/courses/${course._id}`)}
                  />
                ))}
              </div>
              <div className="h-px bg-gray-200 w-full mt-12"></div>
            </div>
          ))}

          {/* All Courses Grid (For search/filter) */}
          {!loading && !isDiscoveryMode && (
            <div>

              <h2 className="text-[22px] font-bold text-gray-900 mb-6 tracking-tight">
                {search ? `Search results for "${search}"` : 'Most Popular Certificates and Courses'}
              </h2>

              {courses.length === 0 ? (
                <div className="text-center py-20 bg-[#f5f7f8] rounded-2xl border border-gray-200 mt-4">
                  <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-[18px] text-gray-900 font-bold">We couldn't find any courses</p>
                  <p className="text-[15px] text-gray-500 mt-2 max-w-md mx-auto">Try adjusting your search terms or clearing some filters to find what you're looking for.</p>
                  {hasActiveFilters && (
                    <button onClick={handleClearFilters} className="mt-6 px-6 py-3 border-2 border-gray-900 text-gray-900 font-bold rounded-full hover:bg-gray-50 transition-colors">
                      Clear all filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8">
                  {(search ? courses : (recommended.length > 0 ? regular : courses)).map(course => (
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
            <div className="flex justify-center items-center gap-2 pt-8">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold"
              >
                <span className="sr-only">Previous</span>
                &lt;
              </button>

              <div className="flex gap-1 mx-2">
                {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-10 h-10 flex items-center justify-center rounded-full text-[14px] font-bold transition-all ${p === page ? 'bg-blue-600 text-white shadow' : 'hover:bg-gray-100 text-gray-700'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setPage(p => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold"
              >
                <span className="sr-only">Next</span>
                &gt;
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter Overlay (Slide-out panel) */}
      {showFilters && (
        <div className="fixed inset-0 z-[100] flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setShowFilters(false)}
          />

          {/* Slide-out Panel */}
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">Filters</h2>
              <button
                onClick={() => setShowFilters(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-10 bg-[#fbfbfb]">
              {/* Category */}
              <div>
                <h3 className="text-[15px] font-bold text-gray-900 uppercase tracking-wider mb-4">Category</h3>
                <div className="space-y-3">
                  {CATEGORIES.map(c => (
                    <label key={c} className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${category === c ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300 group-hover:border-gray-400'}`}>
                        {category === c && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <span className={`text-[15px] ${category === c ? 'text-gray-900 font-bold' : 'text-gray-700'}`}>
                        {c}
                      </span>
                      {/* hidden actual radio input */}
                      <input
                        type="radio"
                        name="category"
                        checked={category === c}
                        onChange={() => { setCategory(c); setPage(1); }}
                        className="hidden"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Level */}
              <div>
                <h3 className="text-[15px] font-bold text-gray-900 uppercase tracking-wider mb-4">Level</h3>
                <div className="flex flex-wrap gap-2">
                  {LEVELS.map(l => (
                    <button
                      key={l}
                      onClick={() => { setLevel(l); setPage(1); }}
                      className={`px-4 py-2 rounded-full text-[14px] font-bold transition-all border ${level === l
                        ? 'bg-gray-900 border-gray-900 text-white shadow-sm'
                        : 'bg-white border-gray-300 text-gray-700 hover:border-gray-900 hover:text-gray-900'
                        }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Delivery Mode */}
              <div>
                <h3 className="text-[15px] font-bold text-gray-900 uppercase tracking-wider mb-4">Delivery Mode</h3>
                <div className="flex flex-wrap gap-2">
                  {DELIVERY_MODES.map(m => (
                    <button
                      key={m}
                      onClick={() => { setDeliveryMode(m); setPage(1); }}
                      className={`px-4 py-2 rounded-full text-[14px] font-bold transition-all border ${deliveryMode === m
                        ? 'bg-gray-900 border-gray-900 text-white shadow-sm'
                        : 'bg-white border-gray-300 text-gray-700 hover:border-gray-900 hover:text-gray-900'
                        }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center gap-4 bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.05)]">
              <button
                onClick={handleClearFilters}
                className="flex-1 py-3.5 text-[15px] font-bold text-gray-700 border-2 border-gray-300 hover:border-gray-900 rounded-full transition-colors"
              >
                Clear all
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-[15px] font-bold rounded-full transition-colors shadow-lg shadow-blue-500/20"
              >
                Show results
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Internal CSS for animation map */}
      <style>{`
        @keyframes slideInFromRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .slide-in-from-right {
          animation: slideInFromRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

    </StudentLayout>
  );
};

export default CourseList;