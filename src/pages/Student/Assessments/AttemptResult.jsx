// pages/Student/Assessments/AttemptResult.jsx
// Fixed to match backend getSingleAttempt response:
//   attempt.assessment_id (populated: level, skill_id, source_type, duration_minutes)
//   attempt.answers[].question_id (populated Question doc)
//   attempt.answers[].selected_answer, .is_correct, .marks_earned, .coding_result
//   attempt.score_percentage, .correct_answers, .total_questions, .earned_marks, .total_marks

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle2, XCircle, MinusCircle, Clock, Target,
  Award, ChevronLeft, AlertCircle, TrendingUp
} from 'lucide-react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { assessmentAttemptAPI } from '../../../api/Api';

const LEVEL_CONFIG = {
  Beginner:     { label: 'Beginner',     color: 'text-green-600', bg: 'bg-green-100' },
  Intermediate: { label: 'Intermediate', color: 'text-blue-600',  bg: 'bg-blue-100'  },
  Advanced:     { label: 'Advanced',     color: 'text-purple-600', bg: 'bg-purple-100' },
};

const AttemptResult = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showBreakdown, setShowBreakdown] = useState(false);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const res = await assessmentAttemptAPI.getSingleAttempt(attemptId);
        if (res.success) setAttempt(res.attempt);
        else setError(res.message || 'Failed to load result');
      } catch (err) {
        setError(err.message || 'Failed to load result');
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [attemptId]);

  if (loading) return (
    <DashboardLayout title="Assessment Result">
      <div className="flex items-center justify-center py-24"><LoadingSpinner /></div>
    </DashboardLayout>
  );

  if (error) return (
    <DashboardLayout title="Assessment Result">
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center text-red-700">
          <AlertCircle className="w-10 h-10 mx-auto mb-3" />
          <p className="font-semibold">{error}</p>
          <button onClick={() => navigate(-1)} className="mt-4 text-sm underline">Go Back</button>
        </div>
      </div>
    </DashboardLayout>
  );

  if (!attempt) return null;

  const pct = Math.round(attempt.score_percentage || 0);
  const level = attempt.assessment_id?.level || '';
  const levelCfg = LEVEL_CONFIG[level] || LEVEL_CONFIG.Beginner;
  const skillName = attempt.assessment_id?.skill_id?.name || 'Assessment';
  const scoreColor = pct >= 70 ? 'text-green-600' : pct >= 40 ? 'text-blue-600' : 'text-red-600';

  return (
    <DashboardLayout title="Assessment Result">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back */}
        <button
          onClick={() => navigate('/dashboard/student/assessments/history')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium"
        >
          <ChevronLeft className="w-4 h-4" /> Back to History
        </button>

        {/* Score card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <p className="text-sm text-gray-500 mb-1">{skillName}</p>
          {level && (
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-3 ${levelCfg.bg} ${levelCfg.color}`}>
              {level} Level
            </div>
          )}
          <div className={`text-7xl font-black ${scoreColor} mb-2`}>{pct}%</div>
          <p className="text-gray-500 text-sm">
            {pct >= 70 ? '🎉 Excellent! Well done.' : pct >= 40 ? '📚 Good effort. Keep practicing.' : '💪 Keep learning and try again.'}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {[
              { icon: CheckCircle2, label: 'Correct',    value: attempt.correct_answers ?? 0,    color: 'text-green-600', bg: 'bg-green-50'  },
              { icon: XCircle,      label: 'Wrong',      value: (attempt.total_questions || 0) - (attempt.correct_answers || 0), color: 'text-red-600',   bg: 'bg-red-50'    },
              { icon: Award,        label: 'Marks',      value: `${attempt.earned_marks ?? 0}/${attempt.total_marks ?? 0}`, color: 'text-blue-600',  bg: 'bg-blue-50'   },
              { icon: Target,       label: 'Total Qs',   value: attempt.total_questions ?? 0,    color: 'text-purple-600', bg: 'bg-purple-50' },
            ].map(s => (
              <div key={s.label} className={`${s.bg} rounded-xl p-4 text-center`}>
                <s.icon className={`w-6 h-6 ${s.color} mx-auto mb-2`} />
                <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>

          {attempt.submitted_at && (
            <p className="text-xs text-gray-400 mt-4">
              Submitted: {new Date(attempt.submitted_at).toLocaleString()}
            </p>
          )}
        </div>

        {/* Question-by-question breakdown */}
        {attempt.answers && attempt.answers.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <button
              onClick={() => setShowBreakdown(prev => !prev)}
              className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
            >
              <span className="font-semibold text-gray-800">Question Breakdown</span>
              <TrendingUp className={`w-5 h-5 text-gray-400 transition-transform ${showBreakdown ? 'rotate-180' : ''}`} />
            </button>

            {showBreakdown && (
              <div className="border-t border-gray-100 divide-y divide-gray-50">
                {attempt.answers.map((ans, idx) => {
                  const q = ans.question_id; // populated Question doc
                  // question text: model field is "question"
                  const qText = q?.question || q?.question_text || `Question ${idx + 1}`;

                  return (
                    <div key={idx} className={`p-4 flex items-start gap-3 ${
                      ans.is_correct ? 'bg-green-50/50' : 'bg-red-50/50'
                    }`}>
                      <div className="mt-0.5 shrink-0">
                        {ans.is_correct
                          ? <CheckCircle2 className="w-5 h-5 text-green-600" />
                          : ans.selected_answer === null
                          ? <MinusCircle className="w-5 h-5 text-gray-400" />
                          : <XCircle className="w-5 h-5 text-red-600" />}
                      </div>
                      <div className="flex-1 text-sm min-w-0">
                        <p className="font-medium text-gray-700 mb-1 text-xs uppercase tracking-wide text-gray-400">Q{idx + 1}</p>
                        <p className="text-gray-800 mb-2 text-sm">{qText}</p>
                        <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                          <span>
                            Your answer:{' '}
                            <span className={ans.is_correct ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                              {ans.selected_answer !== null && ans.selected_answer !== undefined
                                ? Array.isArray(ans.selected_answer)
                                  ? ans.selected_answer.join(', ')
                                  : String(ans.selected_answer)
                                : 'Skipped'}
                            </span>
                          </span>
                          {!ans.is_correct && q?.correct_answer !== undefined && (
                            <span className="text-green-600 font-medium">
                              Correct: {Array.isArray(q.correct_answer) ? q.correct_answer.join(', ') : String(q.correct_answer)}
                            </span>
                          )}
                          <span className="ml-auto font-medium">
                            {ans.marks_earned > 0 ? `+${ans.marks_earned}` : '0'} / {q?.marks ?? 1} marks
                          </span>
                        </div>
                        {q?.explanation && (
                          <p className="mt-2 text-xs text-gray-500 italic bg-gray-50 rounded px-2 py-1">
                            💡 {q.explanation}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pb-6">
          <button
            onClick={() => navigate('/dashboard/student/assessments')}
            className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-medium"
          >
            Take Another Assessment
          </button>
          <button
            onClick={() => navigate('/dashboard/student')}
            className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AttemptResult;