// pages/CollegeAdmin/Assessments/AssessmentAttempts.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Users, Award, TrendingUp, Target,
  AlertCircle, RefreshCw, Download, CheckCircle2,
  BarChart2, ChevronRight, ClipboardList, Clock,
  X, ChevronDown, ChevronUp, Check, FileText,
  Eye, BookOpen, Trophy,
} from 'lucide-react';
import CollegeAdminLayout from '../../../components/layout/CollegeAdminLayout';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { assessmentAPI, assessmentAttemptAPI } from '../../../api/Api';

/* ─── Score bar ──────────────────────────────────────────────────────── */
const ScoreBar = ({ pct }) => {
  const color = pct >= 70 ? 'from-green-500 to-emerald-400' : pct >= 40 ? 'from-blue-400 to-blue-500' : 'from-red-400 to-red-500';
  const textColor = pct >= 70 ? 'text-green-700' : pct >= 40 ? 'text-blue-600' : 'text-red-600';
  return (
    <div className="flex items-center gap-2 w-36">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full bg-gradient-to-r ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-sm font-bold ${textColor} tabular-nums w-10 text-right`}>{pct}%</span>
    </div>
  );
};

/* ─── Q&A Detail Modal ───────────────────────────────────────────────── */
const AttemptDetailModal = ({ attempt, assessmentId, onClose }) => {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedQ, setExpandedQ] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await assessmentAPI.getAttemptDetail(assessmentId, attempt._id);
        if (res.success) setDetail(res);
        else setError(res.message || 'Failed to load');
      } catch (e) {
        setError(e.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [assessmentId, attempt._id]);

  const formatAnswer = (ans) => {
    if (!ans && ans !== 0) return <span className="text-gray-400 italic">Not answered</span>;
    if (Array.isArray(ans)) return ans.join(', ');
    return String(ans);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <div>
            <h2 className="font-black text-gray-900">Answer Sheet</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {attempt.student_id?.fullName || '—'} · {attempt.score_percentage ?? 0}% · {attempt.earned_marks ?? 0}/{attempt.total_marks ?? 0} marks
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          {loading && <div className="flex justify-center py-10"><LoadingSpinner /></div>}
          {error && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          {detail && (
            <div className="space-y-4">
              {/* Summary row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Total Qs', value: detail.summary.total_questions, color: 'bg-blue-50 text-blue-700 border-blue-100' },
                  { label: 'Correct', value: detail.summary.correct_answers, color: 'bg-green-50 text-green-700 border-green-100' },
                  { label: 'Marks', value: `${detail.summary.earned_marks}/${detail.summary.total_marks}`, color: 'bg-amber-50 text-amber-700 border-amber-100' },
                  { label: 'Score', value: `${detail.summary.score_percentage}%`, color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
                ].map(s => (
                  <div key={s.label} className={`px-4 py-3 rounded-xl border text-center ${s.color}`}>
                    <p className="text-lg font-black">{s.value}</p>
                    <p className="text-[10px] font-semibold opacity-60">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Questions */}
              <div className="space-y-3">
                {detail.answers.map((ans, idx) => {
                  const isOpen = expandedQ === idx;
                  return (
                    <div key={idx} className={`rounded-xl border-2 overflow-hidden transition-all
                      ${ans.is_correct ? 'border-green-200 bg-green-50/40' : 'border-red-200 bg-red-50/40'}`}>
                      <button
                        className="w-full flex items-start gap-3 p-4 text-left"
                        onClick={() => setExpandedQ(isOpen ? null : idx)}>
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5
                          ${ans.is_correct ? 'bg-green-500' : 'bg-red-500'}`}>
                          {ans.is_correct ? <Check className="w-4 h-4" /> : idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 leading-snug">{ans.question_text}</p>
                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full
                              ${ans.is_correct ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                              {ans.is_correct ? `+${ans.marks_earned} marks` : '0 marks'}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              Student: <strong className="text-gray-700">{formatAnswer(ans.student_answer)}</strong>
                            </span>
                            {!ans.is_correct && (
                              <span className="text-[10px] text-gray-400">
                                Correct: <strong className="text-green-700">{formatAnswer(ans.correct_answer)}</strong>
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="shrink-0 text-gray-400 mt-1">
                          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </button>

                      {isOpen && (
                        <div className="px-4 pb-4 space-y-3">
                          {/* Options */}
                          {ans.options?.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {ans.options.map(opt => {
                                const isCorrectOpt = Array.isArray(ans.correct_answer)
                                  ? ans.correct_answer.includes(opt.label)
                                  : ans.correct_answer === opt.label;
                                const isStudentOpt = Array.isArray(ans.student_answer)
                                  ? ans.student_answer.includes(opt.label)
                                  : ans.student_answer === opt.label;
                                return (
                                  <div key={opt.label} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs border
                                    ${isCorrectOpt ? 'bg-green-50 border-green-200 text-green-800' :
                                      isStudentOpt ? 'bg-red-50 border-red-200 text-red-700' :
                                      'bg-gray-50 border-gray-100 text-gray-600'}`}>
                                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0
                                      ${isCorrectOpt ? 'bg-green-500 text-white' :
                                        isStudentOpt ? 'bg-red-400 text-white' :
                                        'bg-gray-200 text-gray-500'}`}>
                                      {opt.label}
                                    </span>
                                    <span className="flex-1">{opt.text}</span>
                                    {isCorrectOpt && <Check className="w-3 h-3 text-green-600" />}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          {/* Explanation */}
                          {ans.explanation && (
                            <div className="flex items-start gap-2 bg-blue-50/80 border border-blue-100 rounded-xl p-3">
                              <span className="text-base shrink-0">💡</span>
                              <p className="text-xs text-blue-800 leading-relaxed">{ans.explanation}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════ */
const AssessmentAttempts = () => {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const [assessment,    setAssessment]    = useState(null);
  const [attempts,      setAttempts]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [page,          setPage]          = useState(1);
  const [totalPages,    setTotalPages]    = useState(1);
  const [total,         setTotal]         = useState(0);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => { fetchData(); }, [assessmentId, page]);

  const fetchData = async () => {
    setLoading(true); setError('');
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
    avg: attempts.length > 0 ? Math.round(attempts.reduce((s, a) => s + (a.score_percentage || 0), 0) / attempts.length) : 0,
    passed: attempts.filter(a => (a.score_percentage || 0) >= 70).length,
    topScore: attempts.length > 0 ? Math.max(...attempts.map(a => a.score_percentage || 0)) : 0,
  };

  /* ─── CSV Export ─────────────────────────────────────────────────── */
  const handleExportCSV = () => {
    const headers = ['Rank','Name','Email','Score(%)','Correct','Total Qs','Earned Marks','Total Marks','Submitted'];
    const rows = [...attempts]
      .sort((a, b) => (b.score_percentage || 0) - (a.score_percentage || 0))
      .map((a, i) => [
        i + 1,
        a.student_id?.fullName || '—',
        a.student_id?.email || '—',
        a.score_percentage ?? 0,
        a.correct_answers ?? 0,
        a.total_questions ?? 0,
        a.earned_marks ?? 0,
        a.total_marks ?? 0,
        a.submitted_at ? new Date(a.submitted_at).toLocaleString() : '—',
      ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report-${assessment?.title || assessmentId}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  /* ─── Full Report with Styling ───────────────────────────────────── */
  const handleDownloadReport = async () => {
    setGeneratingReport(true);
    try {
      const res = await assessmentAPI.getAssessmentReport(assessmentId);
      if (!res.success) { alert(res.message || 'Report failed'); return; }

      const { assessment: meta, report } = res;
      const sorted = [...report].sort((a, b) => a.rank - b.rank);

      const passCount = sorted.filter(r => r.score_percentage >= 70).length;
      const avgScore  = sorted.length > 0
        ? Math.round(sorted.reduce((s, r) => s + (r.score_percentage || 0), 0) / sorted.length)
        : 0;
      const topScore  = sorted.length > 0
        ? Math.max(...sorted.map(r => r.score_percentage || 0))
        : 0;

      const assessTitle = meta.title || assessmentTitle;
      const totalQs     = meta.total_questions || (sorted[0]?.total_questions ?? '—');
      const totalMarks  = meta.total_marks || (sorted[0]?.total_marks ?? '—');

      const rows = sorted.map(r => {
        const diffMarks = r.earned_marks !== r.correct_answers; // marks and questions differ?
        return `
        <tr class="${r.rank % 2 === 0 ? 'even' : ''}">
          <td class="rank-cell">${r.rank}</td>
          <td><strong>${r.student_name}</strong><br><span style="color:#94a3b8;font-size:11px">${r.email}</span></td>
          <td>${r.correct_answers} / ${r.total_questions || totalQs}</td>
          <td>${r.earned_marks} / ${r.total_marks || totalMarks}</td>
          <td>
            <div class="score-bar">
              <div class="score-fill ${r.score_percentage >= 70 ? 'pass' : r.score_percentage >= 40 ? 'avg' : 'fail'}"
                style="width:${r.score_percentage}%"></div>
            </div>
            <span class="${r.score_percentage >= 70 ? 'badge-pass' : r.score_percentage >= 40 ? 'badge-avg' : 'badge-fail'}">${r.score_percentage}%</span>
          </td>
          <td>${r.submitted_at ? new Date(r.submitted_at).toLocaleDateString('en-IN') : '—'}</td>
        </tr>`;
      }).join('');

      const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
      <title>Assessment Report — ${assessTitle}</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Segoe UI',Arial,sans-serif;background:#f8fafc;color:#1e293b;padding:32px}
        .header{background:linear-gradient(135deg,#1d4ed8,#0891b2);color:white;padding:24px 32px;border-radius:16px;margin-bottom:24px}
        .header h1{font-size:20px;font-weight:900}
        .header p{font-size:12px;opacity:.8;margin-top:4px}
        .meta{display:flex;gap:10px;margin-top:12px;flex-wrap:wrap}
        .meta span{background:rgba(255,255,255,.2);padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700}
        .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px}
        .stat{background:white;border-radius:12px;padding:16px;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,.06);border:1px solid #e2e8f0}
        .stat .val{font-size:28px;font-weight:900;color:#1d4ed8}
        .stat .lbl{font-size:11px;color:#94a3b8;font-weight:600;margin-top:2px}
        .note-box{background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:12px 16px;margin-bottom:20px;font-size:12px;color:#1e40af;line-height:1.6}
        table{width:100%;border-collapse:collapse;background:white;border-radius:14px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.06)}
        thead tr{background:linear-gradient(135deg,#1d4ed8,#0891b2);color:white}
        th{padding:12px 14px;text-align:left;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.05em}
        td{padding:11px 14px;font-size:12px;border-bottom:1px solid #f1f5f9;vertical-align:middle}
        tr.even td{background:#f8fafc}
        .rank-cell{font-weight:900;font-size:14px;color:#1d4ed8;text-align:center}
        .score-bar{height:6px;background:#e2e8f0;border-radius:3px;width:70px;display:inline-block;vertical-align:middle;margin-right:8px;overflow:hidden}
        .score-fill{height:100%;border-radius:3px}
        .score-fill.pass{background:linear-gradient(90deg,#22c55e,#16a34a)}
        .score-fill.avg{background:linear-gradient(90deg,#3b82f6,#1d4ed8)}
        .score-fill.fail{background:linear-gradient(90deg,#ef4444,#dc2626)}
        .badge-pass{background:#dcfce7;color:#16a34a;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700}
        .badge-avg{background:#dbeafe;color:#1d4ed8;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700}
        .badge-fail{background:#fee2e2;color:#dc2626;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700}
        .footer{text-align:center;margin-top:24px;font-size:11px;color:#94a3b8}
        @media print{body{padding:16px}.header{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
      </style></head><body>

      <div class="header">
        <h1>📊 ${assessTitle} — Results Report</h1>
        <p>Generated on ${new Date().toLocaleString('en-IN')}</p>
        <div class="meta">
          <span>Level: ${meta.level}</span>
          ${meta.jd ? `<span>JD: ${meta.jd}</span>` : ''}
          ${meta.scheduled_date ? `<span>Date: ${new Date(meta.scheduled_date).toLocaleDateString('en-IN')}</span>` : ''}
          <span>Total Questions: ${totalQs}</span>
          <span>Total Marks: ${totalMarks}</span>
        </div>
      </div>

      <div class="stats">
        <div class="stat"><div class="val">${sorted.length}</div><div class="lbl">Total Attempts</div></div>
        <div class="stat"><div class="val">${avgScore}%</div><div class="lbl">Average Score</div></div>
        <div class="stat"><div class="val">${passCount}</div><div class="lbl">Passed (≥70%)</div></div>
        <div class="stat"><div class="val">${topScore}%</div><div class="lbl">Top Score</div></div>
      </div>

      <div class="note-box">
        <strong>How to read this report:</strong>
        <br>• <strong>Correct Answers</strong> = number of questions answered correctly (e.g. 3/5 means 3 out of 5 questions correct)
        <br>• <strong>Marks Earned</strong> = actual marks scored based on per-question weightage (differs from correct answers when questions carry different marks)
        <br>• <strong>Score %</strong> = (Marks Earned ÷ Total Marks) × 100
      </div>

      <table>
        <thead><tr>
          <th style="text-align:center">Rank</th>
          <th>Student</th>
          <th>Correct Answers</th>
          <th>Marks Earned</th>
          <th>Score %</th>
          <th>Submitted</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>

      <div class="footer">ICL Assessment System · ${assessTitle} · Confidential</div>
      </body></html>`;

      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const w = window.open(url, '_blank');
      if (w) setTimeout(() => w.print(), 800);
    } catch (e) {
      alert(e.message || 'Report generation failed');
    } finally {
      setGeneratingReport(false);
    }
  };

  if (loading) return (
    <CollegeAdminLayout>
      <div className="flex items-center justify-center py-24"><LoadingSpinner /></div>
    </CollegeAdminLayout>
  );

  const assessmentTitle = assessment?.title || `${assessment?.skill_id?.name || 'Assessment'} — ${assessment?.level || ''}`;
  const isCompleted = assessment?.status === 'completed';

  return (
    <CollegeAdminLayout>
      <div className="max-w-5xl mx-auto space-y-5">

        {/* Back */}
        <button onClick={() => navigate('/dashboard/college-admin/assessments')}
          className="flex items-center gap-1.5 text-gray-500 hover:text-blue-600 text-sm font-medium transition-colors group">
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Back to Assessments
        </button>

        {/* Hero Banner */}
        <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 rounded-2xl px-5 py-4 shadow-xl shadow-blue-500/20 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle,white 1px,transparent 1px)', backgroundSize: '18px 18px' }} />
          </div>
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center border border-white/20 flex-shrink-0">
                <BarChart2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-white font-black text-lg leading-tight">Student Attempts</h1>
                <p className="text-blue-200 text-xs mt-0.5 max-w-xs truncate">{assessmentTitle}</p>
                {assessment?.status && (
                  <span className={`mt-1 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full
                    ${isCompleted ? 'bg-green-400/30 text-green-100' : 'bg-white/20 text-white'}`}>
                    {assessment.status.charAt(0).toUpperCase() + assessment.status.slice(1)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={handleExportCSV} disabled={attempts.length === 0}
                className="flex items-center gap-1.5 px-3 py-2 bg-white/15 hover:bg-white/25 border border-white/20 text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-40">
                <Download className="w-3.5 h-3.5" /> CSV
              </button>
              <button
                onClick={handleDownloadReport}
                disabled={attempts.length === 0 || generatingReport}
                className="flex items-center gap-1.5 px-4 py-2 bg-white text-blue-700 rounded-xl text-xs font-bold hover:bg-blue-50 shadow-md transition-all disabled:opacity-40">
                {generatingReport ? (
                  <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Generating…</>
                ) : (
                  <><FileText className="w-3.5 h-3.5" /> Full Report</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Attempts', value: stats.total,    color: 'bg-blue-50 border-blue-100 text-blue-700' },
            { label: 'Avg Score',      value: `${stats.avg}%`, color: 'bg-cyan-50 border-cyan-100 text-cyan-700' },
            { label: 'Passed (≥70%)', value: stats.passed,    color: 'bg-green-50 border-green-100 text-green-700' },
            { label: 'Top Score',      value: `${stats.topScore}%`, color: 'bg-indigo-50 border-indigo-100 text-indigo-700' },
          ].map(s => (
            <div key={s.label} className={`px-4 py-3 rounded-xl border ${s.color} text-center`}>
              <p className="text-2xl font-black tabular-nums">{s.value}</p>
              <p className="text-[10px] font-semibold opacity-60 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {!isCompleted && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            The Full Report is available once the assessment status changes to <strong className="ml-1">Completed</strong>. You can still view attempts and export CSV.
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {/* Attempts Table */}
        {attempts.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-16 text-center">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-7 h-7 text-blue-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-700 mb-1">No Attempts Yet</h3>
            <p className="text-gray-400 text-sm">Students haven't taken this assessment yet.</p>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
                  <ClipboardList className="w-3 h-3 text-white" />
                </div>
                <p className="font-bold text-gray-800 text-sm">{total} Attempt{total !== 1 ? 's' : ''}</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/40">
                    {['Rank', 'Student', 'Score %', 'Marks Earned', 'Correct Answers', 'Submitted', 'Actions'].map(h => (
                      <th key={h} className="text-left text-[9px] font-black text-gray-400 uppercase tracking-wider px-5 py-3 last:text-right last:pr-5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {[...attempts]
                    .sort((a, b) => (b.score_percentage || 0) - (a.score_percentage || 0))
                    .map((a, idx) => (
                      <tr key={a._id} className="hover:bg-blue-50/20 transition-colors group">
                        <td className="px-5 py-3">
                          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black
                            ${idx === 0 ? 'bg-amber-100 text-amber-700' : idx === 1 ? 'bg-gray-100 text-gray-600' : idx === 2 ? 'bg-orange-100 text-orange-600' : 'bg-gray-50 text-gray-400'}`}>
                            {idx + 1}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-bold text-gray-900 text-sm">{a.student_id?.fullName || '—'}</p>
                          <p className="text-[10px] text-gray-400">{a.student_id?.email || '—'}</p>
                        </td>
                        <td className="px-4 py-3"><ScoreBar pct={a.score_percentage || 0} /></td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-bold text-gray-900">{a.earned_marks ?? 0}<span className="text-gray-400 font-normal">/{a.total_marks ?? 0}</span></div>
                          <div className="text-[10px] text-gray-400">marks</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-bold text-gray-900">{a.correct_answers ?? 0}<span className="text-gray-400 font-normal">/{a.total_questions ?? 0}</span></div>
                          <div className="text-[10px] text-gray-400">questions</div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">
                          {a.submitted_at ? new Date(a.submitted_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => setSelectedAttempt(a)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-all opacity-60 group-hover:opacity-100">
                            <Eye className="w-3 h-3" /> View Answers
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/40">
                <span className="text-xs text-gray-400">Page {page} of {totalPages}</span>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:border-blue-300 disabled:opacity-40 transition-colors">
                    <ChevronLeft className="w-3.5 h-3.5" /> Prev
                  </button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:border-blue-300 disabled:opacity-40 transition-colors">
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Q&A Detail Modal */}
      {selectedAttempt && (
        <AttemptDetailModal
          attempt={selectedAttempt}
          assessmentId={assessmentId}
          onClose={() => setSelectedAttempt(null)}
        />
      )}
    </CollegeAdminLayout>
  );
};

export default AssessmentAttempts;