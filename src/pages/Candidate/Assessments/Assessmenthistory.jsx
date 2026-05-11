// pages/Candidate/Assessments/AssessmentHistory.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, Clock, Target, Award, ChevronRight,
  BookOpen, RefreshCw, AlertCircle, Calendar, Lock,
  CheckCircle2, XCircle
} from 'lucide-react';
import CandidateLayout from '../../../components/layout/CandidateLayout';
import { assessmentAttemptAPI } from '../../../api/Api';

// ── Skeleton: mimics a single AttemptRow card ─────────────────────────────────
const SkeletonCard = () => (
  <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center animate-pulse">
    <div className="flex-1 w-full">
      {/* title row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="h-4 w-40 bg-gray-200 rounded mb-2" />
          <div className="h-3 w-24 bg-gray-100 rounded" />
        </div>
        <div className="h-5 w-20 bg-gray-100 rounded-full" />
      </div>
      {/* progress bar row */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 h-2 bg-gray-100 rounded-full max-w-md" />
        <div className="h-4 w-10 bg-gray-100 rounded" />
      </div>
      {/* meta pills */}
      <div className="flex gap-4">
        <div className="h-3 w-24 bg-gray-100 rounded" />
        <div className="h-3 w-20 bg-gray-100 rounded" />
        <div className="h-3 w-16 bg-gray-100 rounded" />
        <div className="h-3 w-20 bg-gray-100 rounded" />
      </div>
    </div>
    {/* CTA button */}
    <div className="h-9 w-28 bg-gray-100 rounded-xl shrink-0" />
  </div>
);

// ── Skeleton: mimics the top-scores grid ──────────────────────────────────────
const SkeletonScoreGrid = () => (
  <div>
    <div className="h-3 w-28 bg-gray-200 rounded mb-3 animate-pulse" />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center animate-pulse">
          <div className="h-3 w-20 bg-gray-100 rounded mx-auto mb-2" />
          <div className="h-8 w-16 bg-gray-200 rounded mx-auto mb-2" />
          <div className="h-4 w-14 bg-gray-100 rounded-full mx-auto" />
        </div>
      ))}
    </div>
  </div>
);

// ── Skeleton: full page loading state ─────────────────────────────────────────
const AssessmentHistorySkeleton = () => (
  <CandidateLayout title="Assessment History">
    <div className="min-h-[calc(100vh-65px)] flex flex-col">
    <div className="max-w-4xl mx-auto w-full space-y-6 px-4 md:px-0 py-6 flex-1">
      {/* header row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="animate-pulse">
          <div className="h-7 w-56 bg-gray-200 rounded mb-2" />
          <div className="h-4 w-48 bg-gray-100 rounded" />
        </div>
        <div className="flex gap-3 animate-pulse">
          <div className="h-9 w-24 bg-gray-100 rounded-xl" />
          <div className="h-9 w-36 bg-gray-200 rounded-xl" />
        </div>
      </div>

      {/* top scores grid skeleton */}
      <SkeletonScoreGrid />

      {/* attempts label */}
      <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />

      {/* attempt cards */}
      {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
    </div>
    </div>
  </CandidateLayout>
);

// ── Constants ─────────────────────────────────────────────────────────────────
const LEVEL_CONFIG = {
  Beginner:     { label: 'Beginner',     color: 'bg-green-100 text-green-700'   },
  Intermediate: { label: 'Intermediate', color: 'bg-blue-100 text-blue-700'    },
  Advanced:     { label: 'Advanced',     color: 'bg-purple-100 text-purple-700' },
};

const formatTime = (secs) => {
  if (secs == null) return '—';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

// ── AttemptRow ────────────────────────────────────────────────────────────────
// jdLeaderboard: { eligible: bool } | null  (only provided for JD-based attempts)
const AttemptRow = ({ attempt, onViewResult, jdLeaderboard }) => {
  const isPublished = attempt.assessment_id?.leaderboard_published === true;
  const isJD = !!attempt.assessment_id?.jd_id;

  const pct = Math.round(attempt.score_percentage || 0);
  const barColor = pct >= 50 ? 'bg-green-500' : pct >= 35 ? 'bg-blue-500' : 'bg-red-500';
  const level = attempt.assessment_id?.level || '';
  const levelCfg = LEVEL_CONFIG[level] || LEVEL_CONFIG.Beginner;
  const skillName = attempt.assessment_id?.skill_id?.name || attempt.assessment_id?.title || 'Assessment';
  const submittedDate = attempt.submitted_at || attempt.createdAt;

  // ── what to render inside the card body ──────────────────────────────────
  const renderBody = () => {
    // ── JD-based assessment: NEVER show any marks/score info ──────────────
    if (isJD) {
      if (!isPublished) {
        // Not yet published → pending message without any score hint
        return (
          <div className="flex items-center gap-3 flex-wrap">
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center gap-3">
              <Lock className="w-4 h-4 text-gray-400 shrink-0" />
              <div className="text-sm">
                <p className="font-bold text-gray-700">Results Pending</p>
                <p className="text-xs text-gray-500 font-medium">
                  Leaderboard will be visible once published by the college admin.
                </p>
              </div>
            </div>
            <span className="flex items-center gap-1.5 text-[13px] text-gray-500 font-medium">
              <Calendar className="w-4 h-4 text-gray-400" />
              {submittedDate ? new Date(submittedDate).toLocaleDateString() : '—'}
            </span>
          </div>
        );
      }
      // Published JD → eligibility badge only, no marks/score
      const eligible = jdLeaderboard?.eligible ?? false;
      return (
        <div className="flex items-center gap-3 flex-wrap">
          {eligible ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-sm font-bold text-green-700">Eligible</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg">
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm font-bold text-red-600">Not Eligible</span>
            </div>
          )}
          <span className="flex items-center gap-1.5 text-[13px] text-gray-500 font-medium">
            <Calendar className="w-4 h-4 text-gray-400" />
            {submittedDate ? new Date(submittedDate).toLocaleDateString() : '—'}
          </span>
        </div>
      );
    }

    // ── Non-JD assessment ─────────────────────────────────────────────────
    if (!isPublished) {
      return (
        <div className="mb-2 p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center gap-3 w-fit">
          <Lock className="w-4 h-4 text-gray-400" />
          <div className="text-sm">
            <p className="font-bold text-gray-700">Results Pending</p>
            <p className="text-xs text-gray-500 font-medium">
              Scores will be visible once published by the college admin.
            </p>
          </div>
        </div>
      );
    }

    // Published + non-JD → original marks/score display
    return (
      <>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden max-w-md">
            <div className={`h-2 ${barColor} rounded-full transition-all`} style={{ width: `${pct}%` }} />
          </div>
          <span className="text-sm font-black text-gray-700 w-10">{pct}%</span>
        </div>

        <div className="flex items-center gap-4 text-[13px] text-gray-500 flex-wrap font-medium">
          <span className="flex items-center gap-1.5">
            <Target className="w-4 h-4 text-gray-400" />
            {attempt.correct_answers ?? 0} / {attempt.total_questions ?? 0} correct
          </span>
          <span className="flex items-center gap-1.5">
            <Award className="w-4 h-4 text-gray-400" />
            {attempt.earned_marks ?? 0} / {attempt.total_marks ?? 0} marks
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-gray-400" />
            {formatTime(attempt.time_taken_seconds)}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-gray-400" />
            {submittedDate ? new Date(submittedDate).toLocaleDateString() : '—'}
          </span>
        </div>
      </>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-sm transition-all flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
      <div className="flex-1 w-full">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="font-bold text-gray-900">{skillName}</h3>
            <p className="text-sm text-gray-500 mt-0.5">{level} level</p>
          </div>
          {level && (
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${levelCfg.color}`}>
              {levelCfg.label}
            </span>
          )}
        </div>

        {renderBody()}
      </div>

      <button
        onClick={() => onViewResult(attempt._id)}
        className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 text-sm font-bold transition-colors w-full sm:w-auto justify-center"
      >
        View Details <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

// ── AssessmentHistory ─────────────────────────────────────────────────────────
const AssessmentHistory = () => {
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Map of assessmentId → { eligible: bool }
  const [jdLeaderboards, setJdLeaderboards] = useState({});

  useEffect(() => { fetchAttempts(); }, []);

  const fetchAttempts = async () => {
    setLoading(true);
    setError('');
    setJdLeaderboards({});
    try {
      // Direct call — returns ALL submitted attempts regardless of assessment status
      const histRes = await assessmentAttemptAPI.getMyHistory();
      if (!histRes.success) { setError(histRes.message || 'Failed to load'); return; }

      // Filter out attempts linked to cancelled assessments — they should not appear in history
      const allAttempts = (histRes.attempts || []).filter(
        a => a.assessment_id?.status !== 'cancelled'
      );
      setAttempts(allAttempts);

      // For each published JD-based attempt, fetch leaderboard to determine eligibility
      const jdAssessmentIds = [
        ...new Set(
          allAttempts
            .filter(a => !!a.assessment_id?.jd_id && a.assessment_id?.leaderboard_published === true)
            .map(a => a.assessment_id?._id)
            .filter(Boolean)
        ),
      ];

      if (jdAssessmentIds.length > 0) {
        const lbResults = await Promise.allSettled(
          jdAssessmentIds.map(id =>
            assessmentAttemptAPI.getLeaderboard(id)
              .then(res => ({ id, res }))
              .catch(() => ({ id, res: null }))
          )
        );

        const lbMap = {};
        lbResults.forEach(r => {
          if (r.status !== 'fulfilled' || !r.value?.res?.success) return;
          const { id, res } = r.value;
          const eligible = (res.leaderboard || []).some(entry => entry.is_me === true);
          lbMap[id] = { eligible };
        });
        setJdLeaderboards(lbMap);
      }
    } catch (err) {
      setError(err.message || 'Failed to load attempts');
    } finally {
      setLoading(false);
    }
  };

  // ── Full-page skeleton while loading ─────────────────────────────────────
  if (loading) return <AssessmentHistorySkeleton />;

  // Best score summary — strictly only non-JD published attempts
  const skillSummary = {};
  attempts.forEach(a => {
    const isPublished = a.assessment_id?.leaderboard_published === true;
    const isJD = !!a.assessment_id?.jd_id;
    if (!isPublished || isJD) return; // exclude JD assessments from top-score summary

    const key = a.assessment_id?.skill_id?.name || a.assessment_id?.title || a.assessment_id?._id;
    if (!key) return;

    const pct = a.score_percentage || 0;
    if (!skillSummary[key] || pct > skillSummary[key].score_percentage) {
      skillSummary[key] = a;
    }
  });

  const handleViewResult = (attemptId) => {
    navigate(`/dashboard/candidate/assessments/attempts/${attemptId}`);
  };

  return (
    // ✅ Uses CandidateLayout — same structure as Student version
    <CandidateLayout title="Assessment History">
      <div className="min-h-[calc(100vh-65px)] flex flex-col">
      <div className="max-w-4xl mx-auto w-full space-y-6 px-4 md:px-0 py-6 flex-1">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900">My Assessment History</h1>
            <p className="text-gray-500 text-sm mt-1 font-medium">Track your progress and past results</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchAttempts}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl text-gray-700 text-sm font-bold shadow-sm transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={() => navigate('/dashboard/candidate/assessments')}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl text-sm font-bold shadow-md hover:opacity-90 transition-opacity"
            >
              <BookOpen className="w-4 h-4" />
              Take Assessment
            </button>
          </div>
        </div>

        {/* ── Top scores — non-JD published only ── */}
        {Object.keys(skillSummary).length > 0 && (
          <div>
            <h2 className="text-xs font-black text-gray-400 mb-3 uppercase tracking-wider">Top Published Scores</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(skillSummary).map(([key, a]) => {
                const pct = Math.round(a.score_percentage || 0);
                const scoreColor = pct >= 50 ? 'text-green-600' : pct >= 35 ? 'text-blue-600' : 'text-red-600';
                return (
                  <div key={key} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
                    <p className="text-xs font-bold text-gray-500 mb-1 truncate">{key}</p>
                    <p className={`text-3xl font-black ${scoreColor} mb-1`}>{pct}%</p>
                    {a.assessment_id?.level && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${(LEVEL_CONFIG[a.assessment_id.level] || LEVEL_CONFIG.Beginner).color}`}>
                        {a.assessment_id.level}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Error state ── */}
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700 font-medium">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
            {error}
          </div>
        ) : attempts.length === 0 ? (
          /* ── Empty state ── */
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-100">
              <TrendingUp className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No Attempts Found</h3>
            <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto font-medium">
              You haven't taken any assessments yet, or your past assessments are currently unavailable.
            </p>
            <button
              onClick={() => navigate('/dashboard/candidate/assessments')}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-sm transition-colors"
            >
              Take Your First Assessment
            </button>
          </div>
        ) : (
          /* ── Attempts list ── */
          <div className="space-y-4">
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">
              {attempts.length} attempt{attempts.length !== 1 ? 's' : ''}
            </p>
            {attempts.map(a => {
              const assessmentId = a.assessment_id?._id;
              const isJD = !!a.assessment_id?.jd_id;
              return (
                <AttemptRow
                  key={a._id}
                  attempt={a}
                  onViewResult={handleViewResult}
                  jdLeaderboard={isJD && assessmentId ? jdLeaderboards[assessmentId] : null}
                />
              );
            })}
          </div>
        )}
      </div>
      </div>
    </CandidateLayout>
  );
};

export default AssessmentHistory;