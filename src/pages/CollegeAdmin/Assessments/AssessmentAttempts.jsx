// pages/CollegeAdmin/Assessments/AssessmentAttempts.jsx
// Fixed to match backend AssessmentAttempt schema:
//   attempt.student_id (populated: fullName, email, mobileNumber)
//   attempt.score_percentage, attempt.correct_answers, attempt.total_questions
//   attempt.earned_marks, attempt.total_marks, attempt.submitted_at

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Users, Award, TrendingUp, Target,
  AlertCircle, RefreshCw, Download, CheckCircle2, BarChart2
} from 'lucide-react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { assessmentAPI, assessmentAttemptAPI } from '../../../api/Api';

const AssessmentAttempts = () => {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => { fetchData(); }, [assessmentId, page]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [assRes, attRes] = await Promise.all([
        assessmentAPI.getAssessment(assessmentId),
        assessmentAttemptAPI.getAssessmentAttempts(assessmentId, { page, limit: 20 }),
      ]);
      if (assRes.success) setAssessment(assRes.assessment);
      if (attRes.success) {
        setAttempts(attRes.attempts || []);
        setTotal(attRes.total || 0);
        setTotalPages(attRes.pages || 1);
      }
    } catch (err) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total,
    avg: attempts.length > 0
      ? Math.round(attempts.reduce((s, a) => s + (a.score_percentage || 0), 0) / attempts.length)
      : 0,
    passed: attempts.filter(a => (a.score_percentage || 0) >= 70).length,
    topScore: attempts.length > 0 ? Math.max(...attempts.map(a => a.score_percentage || 0)) : 0,
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Score(%)', 'Correct', 'Total Qs', 'Earned Marks', 'Total Marks', 'Date'];
    const rows = attempts.map(a => [
      a.student_id?.fullName || '—',
      a.student_id?.email || '—',
      a.score_percentage ?? 0,
      a.correct_answers ?? 0,
      a.total_questions ?? 0,
      a.earned_marks ?? 0,
      a.total_marks ?? 0,
      a.submitted_at ? new Date(a.submitted_at).toLocaleDateString() : '—',
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attempts-${assessmentId}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return (
    <DashboardLayout title="Assessment Attempts">
      <div className="flex items-center justify-center py-24"><LoadingSpinner /></div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout title="Assessment Attempts">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Back */}
        <button
          onClick={() => navigate('/dashboard/college-admin/assessments')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Assessments
        </button>

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {assessment?.skill_id?.name || 'Assessment'} — {assessment?.level}
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">{total} attempt{total !== 1 ? 's' : ''} recorded</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 text-sm font-medium"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            {attempts.length > 0 && (
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl text-sm font-medium hover:from-blue-700 hover:to-cyan-700"
              >
                <Download className="w-4 h-4" /> Export CSV
              </button>
            )}
          </div>
        </div>

        {/* Stats cards */}
        {total > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Users,       label: 'Total Attempts', value: stats.total,        color: 'text-blue-600',   bg: 'bg-blue-50' },
              { icon: Target,      label: 'Avg Score',      value: `${stats.avg}%`,    color: 'text-purple-600', bg: 'bg-purple-50' },
              { icon: CheckCircle2,label: 'Passed (≥70%)',  value: stats.passed,       color: 'text-green-600',  bg: 'bg-green-50' },
              { icon: Award,       label: 'Top Score',      value: `${stats.topScore}%`,color: 'text-amber-600', bg: 'bg-amber-50' },
            ].map(s => (
              <div key={s.label} className={`${s.bg} rounded-2xl p-5`}>
                <s.icon className={`w-6 h-6 ${s.color} mb-2`} />
                <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />{error}
          </div>
        )}

        {/* Attempts table */}
        {!error && attempts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Attempts Yet</h3>
            <p className="text-gray-500 text-sm">Students haven't taken this assessment yet.</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-3">Student</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Score</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Correct / Total</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Marks</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {attempts.map(a => {
                      const pct = Math.round(a.score_percentage || 0);
                      const barColor = pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-blue-500' : 'bg-red-500';
                      const scoreText = pct >= 70 ? 'text-green-700' : pct >= 40 ? 'text-blue-700' : 'text-red-700';
                      return (
                        <tr key={a._id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-4">
                            <p className="font-medium text-gray-900 text-sm">
                              {a.student_id?.fullName || '—'}
                            </p>
                            <p className="text-xs text-gray-500">{a.student_id?.email || '—'}</p>
                            {a.student_id?.mobileNumber && (
                              <p className="text-xs text-gray-400">{a.student_id.mobileNumber}</p>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2 w-32">
                              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className={`h-2 ${barColor} rounded-full`} style={{ width: `${pct}%` }} />
                              </div>
                              <span className={`text-sm font-bold ${scoreText}`}>{pct}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-700">
                            <span className="font-medium text-green-600">{a.correct_answers ?? 0}</span>
                            <span className="text-gray-400"> / {a.total_questions ?? 0}</span>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-700">
                            <span className="font-medium">{a.earned_marks ?? 0}</span>
                            <span className="text-gray-400"> / {a.total_marks ?? 0}</span>
                          </td>
                          <td className="px-4 py-4 text-xs text-gray-500">
                            {a.submitted_at
                              ? new Date(a.submitted_at).toLocaleDateString()
                              : a.createdAt
                              ? new Date(a.createdAt).toLocaleDateString()
                              : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AssessmentAttempts;