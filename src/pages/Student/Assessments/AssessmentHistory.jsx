// pages/Student/Assessments/AssessmentHistory.jsx
// Fixed to match backend AssessmentAttempt schema:
//   attempt.assessment_id (populated: level, skill_id, source_type, duration_minutes)
//   attempt.score_percentage, attempt.correct_answers, attempt.total_questions
//   attempt.earned_marks, attempt.total_marks, attempt.submitted_at, attempt.status

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, Clock, Target, Award, ChevronRight,
  BookOpen, RefreshCw, AlertCircle, Calendar
} from 'lucide-react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { assessmentAttemptAPI } from '../../../api/Api';

const LEVEL_CONFIG = {
  Beginner:     { label: 'Beginner',     color: 'bg-green-100 text-green-700' },
  Intermediate: { label: 'Intermediate', color: 'bg-blue-100 text-blue-700'  },
  Advanced:     { label: 'Advanced',     color: 'bg-purple-100 text-purple-700' },
};

const AttemptRow = ({ attempt, onViewResult }) => {
  const pct = Math.round(attempt.score_percentage || 0);
  const barColor = pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-blue-500' : 'bg-red-500';
  const level = attempt.assessment_id?.level || '';
  const levelCfg = LEVEL_CONFIG[level] || LEVEL_CONFIG.Beginner;
  const skillName = attempt.assessment_id?.skill_id?.name || '—';
  const submittedDate = attempt.submitted_at || attempt.createdAt;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{skillName}</h3>
          <p className="text-sm text-gray-500">{level} level</p>
        </div>
        {level && (
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${levelCfg.color}`}>
            {levelCfg.label}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-2 ${barColor} rounded-full transition-all`} style={{ width: `${pct}%` }} />
        </div>
        <span className="text-sm font-bold text-gray-700">{pct}%</span>
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
        <span className="flex items-center gap-1">
          <Target className="w-3 h-3" />
          {attempt.correct_answers ?? 0} / {attempt.total_questions ?? 0} correct
        </span>
        <span className="flex items-center gap-1">
          <Award className="w-3 h-3" />
          {attempt.earned_marks ?? 0} / {attempt.total_marks ?? 0} marks
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {submittedDate ? new Date(submittedDate).toLocaleDateString() : '—'}
        </span>
      </div>

      <button
        onClick={() => onViewResult(attempt._id)}
        className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
      >
        View Details <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

const AssessmentHistory = () => {
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { fetchAttempts(); }, []);

  const fetchAttempts = async () => {
    setLoading(true);
    setError('');
    try {
      // getMyAssignedAssessments returns the list of assessments the student is eligible for.
      // For attempts history we need a different approach — we fetch attempts per assessment
      // OR we use getSingleAttempt. However backend doesn't have a "get all my attempts" endpoint.
      // Best available: getMyAssignedAssessments gives assessment list, then for each we fetch attempts.
      // For simplicity, we use assessmentAttemptAPI.getMyAttempts but that requires an assessmentId.
      // 
      // Actually looking at the backend: getMyAttempts(assessmentId) is per-assessment.
      // There is no "get all my attempts" endpoint in the backend.
      // We'll use getMyAssignedAssessments to get assessments, then fetch attempts for each.

      const assRes = await assessmentAttemptAPI.getMyAssignedAssessments();
      if (!assRes.success) { setError(assRes.message || 'Failed to load'); return; }

      const assessmentList = assRes.assessments || [];

      // Fetch attempts for each assessment in parallel
      const attemptResults = await Promise.allSettled(
        assessmentList.map(a =>
          assessmentAttemptAPI.getMyAttempts(a._id).catch(() => ({ success: false, attempts: [] }))
        )
      );

      const allAttempts = attemptResults
        .filter(r => r.status === 'fulfilled' && r.value?.success)
        .flatMap(r => r.value.attempts || []);

      // Sort by newest first
      allAttempts.sort((a, b) => new Date(b.submitted_at || b.createdAt) - new Date(a.submitted_at || a.createdAt));

      setAttempts(allAttempts);
    } catch (err) {
      setError(err.message || 'Failed to load attempts');
    } finally {
      setLoading(false);
    }
  };

  const handleViewResult = (attemptId) => {
    navigate(`/dashboard/student/assessments/attempts/${attemptId}`);
  };

  // Best score per skill
  const skillSummary = {};
  attempts.forEach(a => {
    const key = a.assessment_id?.skill_id?.name || a.assessment_id?._id;
    if (!key) return;
    const pct = a.score_percentage || 0;
    if (!skillSummary[key] || pct > skillSummary[key].score_percentage) {
      skillSummary[key] = a;
    }
  });

  return (
    <DashboardLayout title="Assessment History">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Assessment History</h1>
            <p className="text-gray-500 text-sm mt-1">Track your progress over time</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchAttempts}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 text-sm font-medium transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={() => navigate('/dashboard/student/assessments')}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl text-sm font-medium hover:from-blue-700 hover:to-cyan-700"
            >
              <BookOpen className="w-4 h-4" />
              Take Assessment
            </button>
          </div>
        </div>

        {/* Best scores */}
        {Object.keys(skillSummary).length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">Best Scores by Skill</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(skillSummary).map(([key, a]) => {
                const pct = Math.round(a.score_percentage || 0);
                const scoreColor = pct >= 70 ? 'text-green-600' : pct >= 40 ? 'text-blue-600' : 'text-red-600';
                return (
                  <div key={key} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                    <p className="text-xs text-gray-500 mb-1 truncate">{key}</p>
                    <p className={`text-2xl font-black ${scoreColor}`}>{pct}%</p>
                    {a.assessment_id?.level && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${(LEVEL_CONFIG[a.assessment_id.level] || LEVEL_CONFIG.Beginner).color}`}>
                        {a.assessment_id.level}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Attempts List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            {error}
          </div>
        ) : attempts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Attempts Yet</h3>
            <p className="text-gray-500 text-sm mb-4">You haven't taken any assessments yet.</p>
            <button
              onClick={() => navigate('/dashboard/student/assessments')}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-cyan-700"
            >
              Take Your First Assessment
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">{attempts.length} attempt{attempts.length !== 1 ? 's' : ''}</p>
            {attempts.map(a => (
              <AttemptRow key={a._id} attempt={a} onViewResult={handleViewResult} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AssessmentHistory;