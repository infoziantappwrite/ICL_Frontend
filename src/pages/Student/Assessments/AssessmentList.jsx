// pages/Student/Assessments/AssessmentList.jsx
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Clock, Target, TrendingUp, RefreshCw, AlertCircle, 
  Calendar, Search, Filter, X, ChevronRight, Award, Zap
} from 'lucide-react';
import StudentLayout from '../../../components/layout/StudentLayout';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { assessmentAttemptAPI } from '../../../api/Api';

const LEVEL_CONFIG = {
  Beginner:     { label: 'Beginner',     color: 'bg-green-50 text-green-700 border-green-200',   dot: 'bg-green-500' },
  Intermediate: { label: 'Intermediate', color: 'bg-blue-50 text-blue-700 border-blue-200',      dot: 'bg-blue-500'  },
  Advanced:     { label: 'Advanced',     color: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
};

const SOURCE_LABEL = {
  college_admin_manual: 'Admin',
  college_admin_ai:     'AI',
  student_skill_based:  'Skill-Based',
};

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 ${className}`}>
    {children}
  </div>
);

const AssessmentCard = ({ assessment, onStart }) => {
  const levelCfg = LEVEL_CONFIG[assessment.level] || LEVEL_CONFIG.Beginner;
  const sourceLabel = SOURCE_LABEL[assessment.source_type] || assessment.source_type;

  return (
    <div
      onClick={() => onStart(assessment)}
      className="bg-white rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full"
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 border border-gray-100 rounded-xl flex items-center justify-center bg-blue-50 flex-shrink-0">
            <Target className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h3 className="font-bold text-[16px] text-gray-900 leading-tight hover:text-blue-600 transition-colors line-clamp-2">
              {assessment.title || assessment.skill_id?.name || 'Skill Assessment'}
            </h3>
            <p className="text-[13px] text-gray-600 mt-1 flex items-center gap-1.5 line-clamp-1">
              {sourceLabel} Assessment
              <Award className="w-3.5 h-3.5 text-amber-500" />
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-5">
        <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold border ${levelCfg.color} flex items-center gap-1.5`}>
          <span className={`w-1.5 h-1.5 rounded-full ${levelCfg.dot}`}></span>
          {levelCfg.label}
        </span>
        {assessment.tags?.slice(0, 2).map((t, idx) => (
          <span key={idx} className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-gray-50 text-gray-600 border border-gray-200">
            {t}
          </span>
        ))}
      </div>

      <div className="space-y-2 mb-5 mt-auto">
        <div className="flex items-center gap-2 text-[13px] text-gray-500 font-medium">
          <Clock className="w-4 h-4 text-gray-400" />
          <span>
            {assessment.duration_minutes ? `${assessment.duration_minutes} Minutes Duration` : 'Flexible Duration'}
          </span>
        </div>
        
        {assessment.scheduled_date ? (
          <div className="flex items-center gap-2 text-[13px] text-gray-500 font-medium">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>Scheduled: {new Date(assessment.scheduled_date).toLocaleDateString()}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[13px] text-green-600 font-medium">
            <Zap className="w-4 h-4 text-green-500" />
            <span>On-demand Access</span>
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
        <button className="text-[13px] font-bold text-blue-600 flex items-center gap-1 hover:text-blue-700 transition-colors">
          Start Assessment <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const AssessmentList = () => {
  const navigate = useNavigate();
  const [allAssessments, setAllAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

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
    navigate(`/dashboard/student/assessments/${assessment._id}/take`);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setLevelFilter('');
    setSourceFilter('');
  };

  const filteredAssessments = useMemo(() => {
    return allAssessments.filter(a => {
      // HIDE COMPLETED ASSESSMENTS FROM THIS LIST
      if (a.status !== 'active') return false; 
      
      const titleMatch = a.title || a.skill_id?.name || '';
      const matchSearch = searchTerm === '' || titleMatch.toLowerCase().includes(searchTerm.toLowerCase());
      const matchLevel = levelFilter === '' || a.level === levelFilter;
      const matchSource = sourceFilter === '' || a.source_type === sourceFilter;
      return matchSearch && matchLevel && matchSource;
    });
  }, [allAssessments, searchTerm, levelFilter, sourceFilter]);

  return (
    <StudentLayout title="Skill Assessments">
      <div className="min-h-screen bg-[#f8f9fa] px-4 md:px-6 lg:px-8 py-6">
        <div className="max-w-[1240px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-6">
          
          {/* ─────── LEFT SIDEBAR: FILTERS (col-span-3) ─────── */}
          <div className="md:col-span-3 md:sticky md:top-[100px] self-start space-y-5">
            <div className="md:hidden">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 font-bold shadow-sm"
              >
                <Filter className="w-5 h-5" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
            </div>

            <div className={`space-y-5 ${showFilters ? 'block' : 'hidden md:block'}`}>
              <Card className="p-5">
                <h3 className="font-bold text-gray-900 text-[16px] mb-4 flex items-center gap-2">
                  <Filter className="w-5 h-5 text-blue-600" /> All Filters
                </h3>

                <div className="mb-5">
                  <label className="block text-[12px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Skill name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-[13px] border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[12px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Level</label>
                    <select
                      value={levelFilter}
                      onChange={(e) => setLevelFilter(e.target.value)}
                      className="w-full px-3 py-2 text-[13px] font-medium border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                    >
                      <option value="">All Levels</option>
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Source</label>
                    <select
                      value={sourceFilter}
                      onChange={(e) => setSourceFilter(e.target.value)}
                      className="w-full px-3 py-2 text-[13px] font-medium border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                    >
                      <option value="">All Sources</option>
                      <option value="college_admin_manual">Admin Assigned</option>
                      <option value="college_admin_ai">AI Generated</option>
                      <option value="student_skill_based">Skill-Based</option>
                    </select>
                  </div>
                </div>

                {(searchTerm || levelFilter || sourceFilter) && (
                  <button
                    onClick={clearFilters}
                    className="w-full mt-6 py-2 border border-gray-200 text-gray-600 text-[13px] font-bold rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" /> Clear filters
                  </button>
                )}
              </Card>

              <Card className="p-5 bg-gradient-to-br from-blue-600 to-cyan-600 border-none text-white">
                <Target className="w-8 h-8 mb-3 text-blue-100" />
                <h3 className="font-bold text-[16px] mb-2">Track Your Progress</h3>
                <p className="text-[13px] text-blue-100 mb-4">View your past assessment scores and analytics to improve.</p>
                <button
                  onClick={() => navigate('/dashboard/student/assessments/history')}
                  className="w-full py-2 bg-white text-blue-600 text-[13px] font-bold rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                >
                  <TrendingUp className="w-4 h-4" /> My History
                </button>
              </Card>
            </div>
          </div>

          {/* ─────── RIGHT MAIN FEED (col-span-9) ─────── */}
          <div className="md:col-span-9 space-y-5 md:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h1 className="text-[24px] md:text-[28px] font-bold text-gray-900 leading-tight">
                  Skill Assessments
                </h1>
                <p className="text-[14px] text-gray-600 mt-1">
                  Take assessments to verify your skills and improve your placement profile
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-[13px] font-medium text-gray-500 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm inline-flex w-fit">
                  {filteredAssessments.length} {filteredAssessments.length === 1 ? 'assessment' : 'assessments'} available
                </div>
                <button
                  onClick={fetchAssessments}
                  className="bg-white border border-gray-200 text-gray-600 p-1.5 rounded-full hover:bg-gray-50 hover:text-blue-600 transition-colors shadow-sm"
                  title="Refresh"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-red-800 text-[14px]">{error}</p>
                </div>
                <button onClick={fetchAssessments} className="text-sm text-red-700 underline font-medium">Retry</button>
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-[220px] bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0" />
                      <div className="flex-1">
                        <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                        <div className="h-4 bg-gray-100 rounded w-1/2" />
                      </div>
                    </div>
                    <div className="flex gap-2 mb-4">
                      <div className="h-5 w-16 bg-gray-100 rounded" />
                      <div className="h-5 w-20 bg-gray-100 rounded" />
                    </div>
                    <div className="space-y-2 mt-auto">
                      <div className="h-4 bg-gray-50 rounded w-full" />
                      <div className="h-4 bg-gray-50 rounded w-5/6" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredAssessments.length === 0 && !error ? (
              <Card className="text-center py-16">
                <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-[18px] font-bold text-gray-900 mb-2">
                  No pending assessments right now!
                </h3>
                <p className="text-[14px] text-gray-500">
                  You have completed all your active assessments. Check the "My History" tab to view your past results.
                </p>
                {allAssessments.length > 0 && (
                  <button
                    onClick={clearFilters}
                    className="mt-6 px-6 py-2 bg-blue-50 text-blue-600 text-[13px] font-bold rounded-full hover:bg-blue-100 transition-colors"
                  >
                    Reset parameters
                  </button>
                )}
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredAssessments.map(a => (
                  <AssessmentCard key={a._id} assessment={a} onStart={handleStart} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};

export default AssessmentList;