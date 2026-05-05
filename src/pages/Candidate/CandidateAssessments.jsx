// src/pages/Candidate/CandidateAssessments.jsx - Enhanced version
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Clock, Target, TrendingUp, PlayCircle, RefreshCw,
  AlertCircle, Search, X, CheckCircle2, ClipboardList, Award,
  ChevronRight, BarChart2, Zap, Lock,
} from 'lucide-react';
import CandidateLayout from '../../components/layout/CandidateLayout';
import { assessmentAttemptAPI } from '../../api/Api';

const LEVEL_CONFIG = {
  Beginner:     { color: 'bg-green-50 text-green-700 border-green-200',  dot: 'bg-green-500'  },
  Intermediate: { color: 'bg-blue-50 text-blue-700 border-blue-200',    dot: 'bg-blue-500'   },
  Advanced:     { color: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
};

const AssessmentCard = ({ assessment, onStart, onHistory }) => {
  const levelCfg = LEVEL_CONFIG[assessment.difficulty] || LEVEL_CONFIG.Beginner;
  const durationMin = assessment.totalDuration || assessment.duration || 0;
  const totalQ = assessment.totalQuestions || 0;
  const myBest = assessment.myBestScore;
  const attempted = (assessment.attemptCount || 0) > 0;
  const maxAttempts = assessment.maxAttempts;
  const attemptsLeft = maxAttempts ? maxAttempts - (assessment.attemptCount || 0) : null;
  const canAttempt = attemptsLeft === null || attemptsLeft > 0;
  const passed = myBest != null && myBest >= (assessment.passingScore || 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all duration-300 flex flex-col h-full">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${levelCfg.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${levelCfg.dot}`} />
              {assessment.difficulty || 'Beginner'}
            </span>
            {attempted && myBest != null && (
              <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${passed ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-amber-700 bg-amber-50 border border-amber-200'}`}>
                {passed ? <CheckCircle2 className="w-3 h-3" /> : <Target className="w-3 h-3" />} Best: {myBest}%
              </span>
            )}
            {!canAttempt && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
                <Lock className="w-3 h-3" /> Max attempts
              </span>
            )}
          </div>
          <h3 className="font-bold text-[14px] text-gray-900 leading-snug line-clamp-2">{assessment.title}</h3>
          {assessment.description && (
            <p className="text-[12px] text-gray-400 mt-1 line-clamp-2">{assessment.description}</p>
          )}
        </div>
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${attempted && passed ? 'bg-gradient-to-br from-emerald-400 to-green-500' : 'bg-gradient-to-br from-cyan-500 to-blue-500'}`}>
          {attempted && passed ? <Award className="w-5 h-5 text-white" /> : <ClipboardList className="w-5 h-5 text-white" />}
        </div>
      </div>

      {/* Meta info */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-400 mb-4">
        {totalQ > 0 && <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {totalQ} Questions</span>}
        {durationMin > 0 && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {durationMin} min</span>}
        {assessment.passingScore && <span className="flex items-center gap-1"><Target className="w-3 h-3" /> Pass: {assessment.passingScore}%</span>}
        {maxAttempts && <span className="flex items-center gap-1"><RefreshCw className="w-3 h-3" /> {attemptsLeft ?? 0} left</span>}
      </div>

      {/* Score bar (if attempted) */}
      {attempted && myBest != null && (
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <span className="text-[10px] text-gray-400 font-medium">Best score</span>
            <span className={`text-[10px] font-bold ${passed ? 'text-emerald-600' : 'text-amber-600'}`}>{myBest}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${passed ? 'bg-gradient-to-r from-emerald-400 to-green-500' : 'bg-gradient-to-r from-amber-400 to-orange-500'}`}
              style={{ width: `${myBest}%` }} />
          </div>
          {assessment.passingScore && (
            <div className="relative h-0" style={{ marginTop: '-7px' }}>
              <div className="absolute h-3 w-0.5 bg-gray-400 opacity-50 rounded-full"
                style={{ left: `${assessment.passingScore}%` }} />
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 mt-auto">
        <button
          onClick={() => canAttempt && onStart(assessment._id)}
          disabled={!canAttempt}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[13px] font-bold transition-all ${
            canAttempt
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-700 hover:to-blue-700 shadow-sm hover:shadow-md hover:-translate-y-0.5'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          <PlayCircle className="w-4 h-4" />
          {canAttempt ? (attempted ? 'Retake' : 'Start Now') : 'Locked'}
        </button>
        {attempted && (
          <button onClick={() => onHistory(assessment._id)}
            className="flex items-center gap-1 px-3 py-2.5 text-[12px] font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all">
            <TrendingUp className="w-3.5 h-3.5" /> History
          </button>
        )}
      </div>
    </div>
  );
};

const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
    <div className="flex gap-3 mb-3">
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-1/3" />
        <div className="h-5 bg-gray-200 rounded w-4/5" />
        <div className="h-3 bg-gray-200 rounded w-full" />
      </div>
      <div className="w-11 h-11 bg-gray-200 rounded-2xl flex-shrink-0" />
    </div>
    <div className="h-3 bg-gray-200 rounded w-2/3 mb-5" />
    <div className="h-10 bg-gray-200 rounded-xl" />
  </div>
);

const CandidateAssessments = () => {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchAssessments = async () => {
    setLoading(true); setError('');
    try {
      const res = await assessmentAttemptAPI.getMyAssignedAssessments();
      if (res?.success) setAssessments(res.assessments || []);
      else setError(res?.message || 'Failed to load assessments');
    } catch {
      setError('Failed to load assessments. Please try again.');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAssessments(); }, []);

  const filtered = useMemo(() => assessments.filter(a => {
    const matchSearch = !search || a.title?.toLowerCase().includes(search.toLowerCase());
    const matchLevel = levelFilter === 'All' || a.difficulty === levelFilter;
    const attempted = (a.attemptCount || 0) > 0;
    const passed = a.myBestScore != null && a.myBestScore >= (a.passingScore || 0);
    const matchStatus = statusFilter === 'All'
      || (statusFilter === 'Not Started' && !attempted)
      || (statusFilter === 'Attempted' && attempted && !passed)
      || (statusFilter === 'Passed' && passed);
    return matchSearch && matchLevel && matchStatus;
  }), [assessments, search, levelFilter, statusFilter]);

  const handleStart = (id) => navigate(`/dashboard/candidate/assessments/${id}/take`);
  const handleHistory = (id) => navigate(`/dashboard/candidate/assessments/history?assessmentId=${id}`);

  // Stats
  const attempted = assessments.filter(a => (a.attemptCount || 0) > 0).length;
  const passed = assessments.filter(a => a.myBestScore != null && a.myBestScore >= (a.passingScore || 0)).length;
  const avgScore = assessments.filter(a => a.myBestScore != null).length > 0
    ? Math.round(assessments.filter(a => a.myBestScore != null).reduce((s, a) => s + a.myBestScore, 0) / assessments.filter(a => a.myBestScore != null).length)
    : 0;

  return (
    <CandidateLayout>
      <div className="min-h-screen bg-[#f0f4f8] px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
        <div className="max-w-[1400px] mx-auto space-y-4 sm:space-y-5">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-[22px] md:text-[28px] font-black text-gray-900 tracking-tight">
                Skill <span className="text-cyan-600">Assessments</span>
              </h1>
              <p className="text-[13px] text-gray-500 mt-1">
                {loading ? 'Loading...' : `${assessments.length} assessments available · ${attempted} attempted`}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={fetchAssessments}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-xl text-[13px] font-semibold text-gray-600 hover:border-cyan-300 hover:text-cyan-600 transition-all shadow-sm">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </button>
              <button onClick={() => navigate('/dashboard/candidate/assessments/history')}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-xl text-[13px] font-semibold text-gray-600 hover:border-cyan-300 hover:text-cyan-600 transition-all shadow-sm">
                <TrendingUp className="w-4 h-4" /> My History
              </button>
            </div>
          </div>

          {/* Stats strip */}
          {!loading && assessments.length > 0 && (
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Total', value: assessments.length, icon: ClipboardList, color: 'text-blue-600 bg-blue-50' },
                { label: 'Attempted', value: attempted, icon: PlayCircle, color: 'text-amber-600 bg-amber-50' },
                { label: 'Passed', value: passed, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
                { label: 'Avg Score', value: avgScore ? `${avgScore}%` : '—', icon: BarChart2, color: 'text-violet-600 bg-violet-50' },
              ].map(s => (
                <div key={s.label} className={`bg-white rounded-2xl border border-gray-100 p-3 flex items-center gap-2.5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}><s.icon className="w-4 h-4" /></div>
                  <div><p className="text-[18px] font-black text-gray-900 leading-none">{s.value}</p><p className="text-[10px] text-gray-400 font-medium">{s.label}</p></div>
                </div>
              ))}
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-100 p-3 flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search assessments..."
                className="w-full pl-9 pr-3 py-2 text-[13px] border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-100 focus:border-cyan-400 outline-none" />
            </div>
            <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)}
              className="px-3 py-2 text-[13px] border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-100 focus:border-cyan-400 outline-none bg-white min-w-[130px]">
              {['All', 'Beginner', 'Intermediate', 'Advanced'].map(l => <option key={l}>{l}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-[13px] border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-100 focus:border-cyan-400 outline-none bg-white min-w-[130px]">
              {['All', 'Not Started', 'Attempted', 'Passed'].map(s => <option key={s}>{s}</option>)}
            </select>
            {(search || levelFilter !== 'All' || statusFilter !== 'All') && (
              <button onClick={() => { setSearch(''); setLevelFilter('All'); setStatusFilter('All'); }}
                className="flex items-center gap-1 px-3 py-2 text-[12px] font-semibold text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                <X className="w-3.5 h-3.5" /> Clear
              </button>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-[13px] text-red-700 flex-1">{error}</p>
              <button onClick={fetchAssessments} className="text-[12px] font-bold text-red-600 flex items-center gap-1">
                <RefreshCw className="w-3.5 h-3.5" /> Retry
              </button>
            </div>
          )}

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <div className="w-14 h-14 bg-cyan-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ClipboardList className="w-7 h-7 text-cyan-300" />
              </div>
              <p className="text-[15px] font-bold text-gray-600">No assessments found</p>
              <p className="text-[13px] text-gray-400 mt-1">Try adjusting your search or check back later</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(a => (
                <AssessmentCard key={a._id} assessment={a} onStart={handleStart} onHistory={handleHistory} />
              ))}
            </div>
          )}

        </div>
      </div>
    </CandidateLayout>
  );
};

export default CandidateAssessments;
