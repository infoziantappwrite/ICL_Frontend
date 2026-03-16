// pages/Student/Assessments/AssessmentList.jsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Clock, Star, Target, TrendingUp,
  PlayCircle, RefreshCw, AlertCircle, Calendar, Tag,
  Search, Filter, X, ChevronRight, Award, Zap, SlidersHorizontal, Briefcase
} from 'lucide-react';
import StudentLayout from '../../../components/layout/StudentLayout';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { assessmentAttemptAPI } from '../../../api/Api';

const LEVEL_CONFIG = {
  Beginner: { label: 'Beginner', color: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500' },
  Intermediate: { label: 'Intermediate', color: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  Advanced: { label: 'Advanced', color: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
};

const SOURCE_LABEL = {
  college_admin_manual: 'Admin',
  college_admin_ai: 'AI',
  student_skill_based: 'Skill-Based',
};

const formatTime12h = (timeStr) => {
  if (!timeStr) return '--:--';
  try {
    const [hours, minutes] = timeStr.split(':');
    let h = parseInt(hours, 10);
    const m = minutes.padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
  } catch (e) {
    return timeStr;
  }
};

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 ${className}`}>
    {children}
  </div>
);

// ─── Filter Panel Content (shared by sidebar + drawer) ───────────────────────
const FilterContent = ({ searchTerm, setSearchTerm, levelFilter, setLevelFilter, sourceFilter, setSourceFilter, clearFilters }) => {
  const hasFilters = searchTerm || levelFilter || sourceFilter;
  return (
    <>
      {/* Search */}
      <div className="mb-5">
        <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Search</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Skill name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-[13px] border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Level</label>
          <select
            value={levelFilter}
            onChange={e => setLevelFilter(e.target.value)}
            className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
          >
            <option value="">All Levels</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Source</label>
          <select
            value={sourceFilter}
            onChange={e => setSourceFilter(e.target.value)}
            className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
          >
            <option value="">All Sources</option>
            <option value="college_admin_manual">Admin Assigned</option>
            <option value="college_admin_ai">AI Generated</option>
            <option value="student_skill_based">Skill-Based</option>
          </select>
        </div>
      </div>

      {hasFilters && (
        <button
          onClick={clearFilters}
          className="w-full mt-5 py-2 border border-gray-200 text-gray-600 text-[13px] font-bold rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
        >
          <X className="w-4 h-4" /> Clear filters
        </button>
      )}
    </>
  );
};

// ─── Assessment Card ──────────────────────────────────────────────────────────
const AssessmentCard = ({ assessment, onStart }) => {
  const levelCfg = LEVEL_CONFIG[assessment.level] || LEVEL_CONFIG.Beginner;
  const sourceLabel = SOURCE_LABEL[assessment.source_type] || assessment.source_type;

  return (
    <div
      onClick={() => onStart(assessment)}
      className="bg-white rounded-2xl p-3 md:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full"
    >
      <div className="flex items-start gap-2 md:gap-4 mb-3 md:mb-4">
        <div className="w-9 h-9 md:w-12 md:h-12 border border-gray-100 rounded-xl flex items-center justify-center bg-blue-50 flex-shrink-0">
          <Target className="w-4 h-4 md:w-6 md:h-6 text-blue-500" />
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-[13px] md:text-[16px] text-gray-900 leading-tight hover:text-blue-600 transition-colors line-clamp-2">
            {assessment?.jd_id?.jobTitle || assessment?.title || 'Skill Assessment'}
          </h3>
          <p className="text-[11px] md:text-[13px] text-gray-600 mt-0.5 flex items-center gap-1.5 line-clamp-1">
            {sourceLabel} Assessment
            <Award className="w-3 h-3 md:w-3.5 md:h-3.5 text-amber-500 flex-shrink-0" />
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mb-3 md:mb-5">
        {assessment?.jd_id?.companyId?.name && (
          <span className="px-2 py-0.5 rounded text-[10px] md:text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100 flex items-center gap-1">
            <Briefcase className="w-3 h-3" />
            {assessment.jd_id.companyId.name}
          </span>
        )}
      </div>

      <div className="space-y-1.5 mb-3 md:mb-5 mt-auto">
        <div className="flex items-center gap-1.5 text-[11px] md:text-[13px] text-gray-500 font-medium">
          <Clock className="w-3.5 h-3.5 text-gray-400" />
          <span>
            {assessment.duration_minutes ? `${assessment.duration_minutes} min` : 'Flexible'}
          </span>
        </div>
        {assessment.scheduled_date ? (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] md:text-[13px] text-gray-500 font-medium">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <span>Scheduled: {new Date(assessment.scheduled_date).toLocaleDateString()}</span>
            </div>
            {(assessment.start_time || assessment.end_time) && (
              <div className="flex items-center gap-1.5 text-[11px] md:text-[13px] text-gray-500 font-medium ">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <span>{formatTime12h(assessment.start_time)} to {formatTime12h(assessment.end_time)}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-[11px] md:text-[13px] text-green-600 font-medium">
            <Zap className="w-3.5 h-3.5 text-green-500" />
            <span>On-demand Access</span>
          </div>
        )}
      </div>

      <div className="pt-2.5 md:pt-4 border-t border-gray-100 flex items-center justify-between">
        <button className="text-[12px] md:text-[13px] font-bold text-blue-600 flex items-center gap-1 hover:text-blue-700 transition-colors">
          Start Assessment <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
        </button>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const AssessmentList = () => {
  const navigate = useNavigate();
  const [allAssessments, setAllAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');

  // Mobile filter drawer
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  const hasFilters = !!(searchTerm || levelFilter || sourceFilter);
  const activeFilterCount = [searchTerm, levelFilter, sourceFilter].filter(Boolean).length;

  useEffect(() => { fetchAssessments(); }, []);

  const fetchAssessments = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await assessmentAttemptAPI.getMyAssignedAssessments();
      if (res.success) setAllAssessments(res.assessments || []);
      else setError(res.message || 'Failed to load assessments');
    } catch (err) {
      setError(err.message || 'Failed to load assessments');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = (assessment) => {
    if (window.innerWidth < 1024) {
      alert("Assessments can only be taken on a desktop screen for a strictly controlled environment. Please switch to a laptop or desktop.");
      return;
    }
    navigate(`/dashboard/student/assessments/${assessment._id}/take`);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setLevelFilter('');
    setSourceFilter('');
  };

  const filteredAssessments = useMemo(() => {
    return allAssessments.filter(a => {
      const title = a.jd_id?.jobTitle || a.title || '';
      const matchSearch = searchTerm === '' || title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchLevel = levelFilter === '' || a.level === levelFilter;
      const matchSource = sourceFilter === '' || a.source_type === sourceFilter;
      return matchSearch && matchLevel && matchSource;
    });
  }, [allAssessments, searchTerm, levelFilter, sourceFilter]);

  return (
    <StudentLayout title="Skill Assessments">
      <div className="min-h-screen bg-[#f8f9fa] px-3 sm:px-4 md:px-6 lg:px-8 py-3 md:py-6">
        <div className="max-w-[1240px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">

          {/* ─── LEFT SIDEBAR: FILTERS (desktop only, col-span-3) ─── */}
          <div className="hidden md:block md:col-span-3 md:sticky md:top-[100px] self-start">
            <Card className="p-4 md:p-5">
              <h3 className="font-bold text-gray-900 text-[15px] mb-4 flex items-center gap-2">
                <Filter className="w-4 h-4 text-blue-600" /> All Filters
              </h3>
              <FilterContent
                searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                levelFilter={levelFilter} setLevelFilter={setLevelFilter}
                sourceFilter={sourceFilter} setSourceFilter={setSourceFilter}
                clearFilters={clearFilters}
              />
            </Card>
          </div>

          {/* ─── MAIN FEED (col-span-9) ─── */}
          <div className="col-span-1 md:col-span-9 space-y-3 md:space-y-5">

            {/* Header */}
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-[18px] sm:text-[22px] md:text-[28px] font-bold text-gray-900 leading-tight">
                  Assessments
                </h1>
                <p className="text-[12px] md:text-[14px] text-gray-600 mt-0.5">
                  {filteredAssessments.length} {filteredAssessments.length === 1 ? 'assessment' : 'assessments'} available
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Mobile filter button */}
                <button
                  onClick={() => setShowFilterDrawer(true)}
                  className="md:hidden relative flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 text-[13px] font-semibold shadow-sm hover:border-blue-300 transition-colors"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Filter</span>
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {/* Refresh */}
                <button
                  onClick={fetchAssessments}
                  className="bg-white border border-gray-200 text-gray-600 p-1.5 md:p-2 rounded-full hover:bg-gray-50 hover:text-blue-600 transition-colors shadow-sm"
                  title="Refresh"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 md:p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <p className="text-red-800 text-[13px] md:text-[14px]">{error}</p>
                </div>
                <button onClick={fetchAssessments} className="text-[12px] text-red-700 underline font-medium flex-shrink-0">Retry</button>
              </div>
            )}

            {/* Grid / Loading / Empty */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-5">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-[180px] md:h-[220px] bg-white rounded-2xl border border-gray-100 p-3 md:p-5 animate-pulse">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-9 h-9 md:w-12 md:h-12 bg-gray-200 rounded-xl flex-shrink-0" />
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                        <div className="h-3 bg-gray-100 rounded w-1/2" />
                      </div>
                    </div>
                    <div className="flex gap-2 mb-3">
                      <div className="h-5 w-16 bg-gray-100 rounded" />
                      <div className="h-5 w-20 bg-gray-100 rounded" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-50 rounded w-full" />
                      <div className="h-3 bg-gray-50 rounded w-5/6" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredAssessments.length === 0 && !error ? (
              <Card className="text-center py-10 md:py-16 p-4">
                <Target className="w-10 h-10 md:w-12 md:h-12 text-gray-300 mx-auto mb-3 md:mb-4" />
                <h3 className="text-[16px] md:text-[18px] font-bold text-gray-900 mb-2">
                  No matching assessments found
                </h3>
                <p className="text-[13px] md:text-[14px] text-gray-500">
                  {allAssessments.length === 0
                    ? 'Check back later — your college admin will publish assessments soon.'
                    : 'Try adjusting your filters or search terms.'}
                </p>
                {allAssessments.length > 0 && (
                  <button
                    onClick={clearFilters}
                    className="mt-4 md:mt-6 px-5 py-2 bg-blue-50 text-blue-600 text-[13px] font-bold rounded-full hover:bg-blue-100 transition-colors"
                  >
                    Reset parameters
                  </button>
                )}
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-5">
                {filteredAssessments.map(a => (
                  <AssessmentCard key={a._id} assessment={a} onStart={handleStart} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ════ MOBILE FILTER DRAWER ════ */}
      {showFilterDrawer && (
        <div className="fixed inset-0 z-[100] flex md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowFilterDrawer(false)}
          />
          {/* Slide-in panel */}
          <div className="absolute right-0 top-0 bottom-0 w-[85vw] max-w-[340px] bg-white flex flex-col shadow-2xl filter-drawer-enter">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-blue-600" />
                <h2 className="text-[16px] font-bold text-gray-900">Filters</h2>
                {activeFilterCount > 0 && (
                  <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{activeFilterCount}</span>
                )}
              </div>
              <button
                onClick={() => setShowFilterDrawer(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter content */}
            <div className="flex-1 overflow-y-auto p-4">
              <FilterContent
                searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                levelFilter={levelFilter} setLevelFilter={setLevelFilter}
                sourceFilter={sourceFilter} setSourceFilter={setSourceFilter}
                clearFilters={clearFilters}
              />
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={() => setShowFilterDrawer(false)}
                className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl text-[14px] hover:bg-blue-700 transition-colors"
              >
                Show Results
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .filter-drawer-enter {
          animation: slideInRight 0.28s cubic-bezier(0.16,1,0.3,1) forwards;
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </StudentLayout>
  );
};

export default AssessmentList;