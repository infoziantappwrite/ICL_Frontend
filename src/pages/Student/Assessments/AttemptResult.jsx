// pages/Student/Assessments/AttemptResult.jsx
// JD-based assessments: show ONLY the leaderboard (no score card, no question breakdown).
// Non-JD assessments: original behaviour (score card + own marks + question breakdown).

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle2, XCircle, MinusCircle, Clock, Target,
  Award, ChevronLeft, AlertCircle, TrendingUp, Trophy, Lock
} from 'lucide-react';
import StudentLayout from '../../../components/layout/StudentLayout';
import { InlineSkeleton } from '../../../components/common/SkeletonLoader';
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

  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState(null);
  const [lbLoading, setLbLoading] = useState(false);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const res = await assessmentAttemptAPI.getSingleAttempt(attemptId);
        if (res.success) {
          setAttempt(res.attempt);
          // Fetch leaderboard for this assessment
          const assessmentId = res.attempt?.assessment_id?._id;
          if (assessmentId) {
            setLbLoading(true);
            try {
              const lbRes = await assessmentAttemptAPI.getLeaderboard(assessmentId);
              if (lbRes.success) setLeaderboard(lbRes);
            } catch (_) {}
            finally { setLbLoading(false); }
          }
        } else setError(res.message || 'Failed to load result');
      } catch (err) {
        setError(err.message || 'Failed to load result');
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [attemptId]);

  if (loading) return (
    <StudentLayout>
      <InlineSkeleton rows={6} className="py-24" />
    </StudentLayout>
  );

  if (error) return (
    <StudentLayout>
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center text-red-700">
          <AlertCircle className="w-10 h-10 mx-auto mb-3" />
          <p className="font-semibold">{error}</p>
          <button onClick={() => navigate(-1)} className="mt-4 text-sm underline">Go Back</button>
        </div>
      </div>
    </StudentLayout>
  );

  if (!attempt) return null;

  const pct = Math.round(attempt.score_percentage || 0);
  const level = attempt.assessment_id?.level || '';
  const levelCfg = LEVEL_CONFIG[level] || LEVEL_CONFIG.Beginner;
  const skillName = attempt.assessment_id?.skill_id?.name || 'Assessment';
  const scoreColor = pct >= 50 ? 'text-green-600' : pct >= 35 ? 'text-blue-600' : 'text-red-600';

  const lbPublished = leaderboard?.published === true;
  const lbType = leaderboard?.type; // 'jd' | 'non_jd'
  const isJD = lbType === 'jd';

  // ── Actions bar (shared) ──────────────────────────────────────────────────
  const actionsBar = (
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
  );

  return (
    <StudentLayout>
      <div className="max-w-3xl mx-auto space-y-6 pt-6 px-4">
        {/* Back */}
        <button
          onClick={() => navigate('/dashboard/student/assessments/history')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium"
        >
          <ChevronLeft className="w-4 h-4" /> Back to History
        </button>

        {lbLoading ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex justify-center"> <InlineSkeleton rows={5} />
          </div>
        ) : !lbPublished ? (
          /* Results not published yet */
          <>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
              <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Results Not Published</h2>
              <p className="text-gray-500 text-sm max-w-md mx-auto">
                You have successfully completed this assessment. Your score and the leaderboard will be
                visible once your college admin publishes the results.
              </p>
            </div>
            {actionsBar}
          </>
        ) : isJD ? (
          /* ── JD Assessment: leaderboard only, no score card, no breakdown ── */
          <>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="px-5 py-4 bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-100 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <div>
                  <p className="font-bold text-gray-900 text-sm">Leaderboard</p>
                  <p className="text-xs text-amber-700 font-semibold mt-0.5">
                    {leaderboard.eligibility_message}
                  </p>
                </div>
              </div>

              {/* Skill + level badge */}
              <div className="px-5 pt-4 pb-2 flex items-center gap-3">
                <p className="text-sm font-bold text-gray-700">{skillName}</p>
                {level && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${levelCfg.bg} ${levelCfg.color}`}>
                    {level}
                  </span>
                )}
              </div>

              {/* Leaderboard rows */}
              <div className="divide-y divide-gray-50">
                {leaderboard.leaderboard.map((entry) => (
                  <div
                    key={entry.rank}
                    className={`flex items-center gap-3 px-5 py-3 ${entry.is_me ? 'bg-blue-50' : ''}`}
                  >
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0
                        ${entry.rank === 1 ? 'bg-amber-100 text-amber-700'
                          : entry.rank === 2 ? 'bg-gray-100 text-gray-600'
                          : entry.rank === 3 ? 'bg-orange-100 text-orange-600'
                          : 'bg-gray-50 text-gray-400'}`}
                    >
                      {entry.rank}
                    </span>
                    <span className={`text-sm font-semibold flex-1 ${entry.is_me ? 'text-blue-700' : 'text-gray-800'}`}>
                      {entry.name}{' '}
                      {entry.is_me && (
                        <span className="text-xs font-bold text-blue-500 ml-1">(You)</span>
                      )}
                    </span>
                    {entry.rank <= 3 && (
                      <span className="text-base">
                        {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {actionsBar}
          </>
        ) : (
          /* ── Non-JD Assessment: original full view ── */
          <>
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
                {pct >= 50 ? '🎉 Excellent! Well done.' : pct >= 35 ? '📚 Good effort. Keep practicing.' : '💪 Keep learning and try again.'}
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                {[
                  { icon: CheckCircle2, label: 'Correct',  value: attempt.correct_answers ?? 0,                                                           color: 'text-green-600', bg: 'bg-green-50' },
                  { icon: XCircle,     label: 'Wrong',    value: (attempt.total_questions || 0) - (attempt.correct_answers || 0),                        color: 'text-red-600',   bg: 'bg-red-50'   },
                  { icon: Award,       label: 'Marks',    value: `${attempt.earned_marks ?? 0}/${attempt.total_marks ?? 0}`,                              color: 'text-blue-600',  bg: 'bg-blue-50'  },
                  { icon: Target,      label: 'Total Qs', value: attempt.total_questions ?? 0,                                                            color: 'text-purple-600',bg: 'bg-purple-50' },
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

            {/* Non-JD leaderboard: own result */}
            {leaderboard?.my_result && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="w-5 h-5 text-blue-500" />
                  <p className="font-bold text-gray-900">Your Result</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Marks Earned', value: `${leaderboard.my_result.earned_marks}/${leaderboard.my_result.total_marks}`, color: 'bg-blue-50 text-blue-700 border-blue-100' },
                    { label: 'Score',        value: `${leaderboard.my_result.score_percentage}%`,                                  color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
                    { label: 'Status',       value: leaderboard.my_result.score_percentage >= 50 ? 'Passed ✓' : 'Not Passed',      color: leaderboard.my_result.score_percentage >= 50 ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100' },
                  ].map(s => (
                    <div key={s.label} className={`px-4 py-3 rounded-xl border text-center ${s.color}`}>
                      <p className="text-lg font-black">{s.value}</p>
                      <p className="text-[10px] font-semibold opacity-60 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                      const q = ans.question_id;
                      const qText = q?.question || q?.question_text || `Question ${idx + 1}`;
                      return (
                        <div key={idx} className={`p-4 flex items-start gap-3 ${ans.is_correct ? 'bg-green-50/50' : 'bg-red-50/50'}`}>
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
                                    ? Array.isArray(ans.selected_answer) ? ans.selected_answer.join(', ') : String(ans.selected_answer)
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

            {actionsBar}
          </>
        )}
      </div>
    </StudentLayout>
  );
};

export default AttemptResult;