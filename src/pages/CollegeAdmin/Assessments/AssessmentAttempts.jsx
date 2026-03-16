// pages/CollegeAdmin/Assessments/AssessmentAttempts.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Users, Award, TrendingUp, Target,
  AlertCircle, RefreshCw, Download, CheckCircle2,
  BarChart2, ChevronRight, ClipboardList, Clock,
} from 'lucide-react';
import CollegeAdminLayout from '../../../components/layout/CollegeAdminLayout';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { assessmentAPI, assessmentAttemptAPI } from '../../../api/Api';

/* ─── Score bar helper ───────────────────────────────────────────────── */
const ScoreBar = ({ pct }) => {
  const color = pct >= 70 ? 'from-blue-500 to-cyan-400' : pct >= 40 ? 'from-blue-400 to-blue-500' : 'from-red-400 to-red-500';
  const textColor = pct >= 70 ? 'text-blue-700' : pct >= 40 ? 'text-blue-600' : 'text-red-600';
  return (
    <div className="flex items-center gap-2 w-36">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full bg-gradient-to-r ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-sm font-bold ${textColor} tabular-nums w-10 text-right`}>{pct}%</span>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════ */
const AssessmentAttempts = () => {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const [assessment,  setAssessment]  = useState(null);
  const [attempts,    setAttempts]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [page,        setPage]        = useState(1);
  const [totalPages,  setTotalPages]  = useState(1);
  const [total,       setTotal]       = useState(0);

  useEffect(() => { fetchData(); }, [assessmentId, page]);

  const fetchData = async () => {
    setLoading(true); setError('');
    try {
      const [assRes, attRes] = await Promise.all([
        assessmentAPI.getAssessment(assessmentId),
        assessmentAttemptAPI.getAssessmentAttempts(assessmentId, { page, limit: 20 }),
      ]);
      if (assRes.success) setAssessment(assRes.assessment);
      if (attRes.success) { setAttempts(attRes.attempts||[]); setTotal(attRes.total||0); setTotalPages(attRes.pages||1); }
    } catch (err) { setError(err.message||'Failed to load data'); }
    finally { setLoading(false); }
  };

  const stats = {
    total,
    avg: attempts.length>0 ? Math.round(attempts.reduce((s,a)=>s+(a.score_percentage||0),0)/attempts.length) : 0,
    passed: attempts.filter(a=>(a.score_percentage||0)>=70).length,
    topScore: attempts.length>0 ? Math.max(...attempts.map(a=>a.score_percentage||0)) : 0,
  };

  const handleExportCSV = () => {
    const headers = ['Name','Email','Score(%)','Correct','Total Qs','Earned Marks','Total Marks','Date'];
    const rows = attempts.map(a => [
      a.student_id?.fullName||'—', a.student_id?.email||'—',
      a.score_percentage??0, a.correct_answers??0, a.total_questions??0,
      a.earned_marks??0, a.total_marks??0,
      a.submitted_at ? new Date(a.submitted_at).toLocaleDateString() : '—',
    ]);
    const csv = [headers,...rows].map(r=>r.join(',')).join('\n');
    const blob = new Blob([csv],{type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href=url; link.download=`attempts-${assessmentId}.csv`; link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <CollegeAdminLayout><div className="flex items-center justify-center py-24"><LoadingSpinner /></div></CollegeAdminLayout>;

  const assessmentTitle = `${assessment?.skill_id?.name||'Assessment'} — ${assessment?.level||''}`;

  return (
    <CollegeAdminLayout>
      <div className="max-w-5xl mx-auto space-y-5">

        {/* Back */}
        <button onClick={()=>navigate('/dashboard/college-admin/assessments')}
          className="flex items-center gap-1.5 text-gray-500 hover:text-blue-600 text-sm font-medium transition-colors group">
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Back to Assessments
        </button>

        {/* Hero Banner */}
        <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 rounded-2xl px-5 py-4 shadow-xl shadow-blue-500/20 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute inset-0 opacity-[0.06]" style={{backgroundImage:'radial-gradient(circle,white 1px,transparent 1px)',backgroundSize:'18px 18px'}} />
          </div>
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center border border-white/20 flex-shrink-0">
                <BarChart2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-white font-black text-lg leading-tight">{assessmentTitle}</h1>
                <p className="text-blue-200 text-xs mt-0.5">{total} attempt{total!==1?'s':''} recorded</p>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  <span className="inline-flex items-center gap-1 bg-white/15 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white border border-white/20">
                    <Users className="w-3 h-3" /> {total} Attempts
                  </span>
                  <span className="inline-flex items-center gap-1 bg-white/15 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white border border-white/20">
                    <TrendingUp className="w-3 h-3" /> Avg {stats.avg}%
                  </span>
                  <span className="inline-flex items-center gap-1 bg-white/15 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white border border-white/20">
                    <Award className="w-3 h-3" /> Top {stats.topScore}%
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
              <button onClick={fetchData}
                className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-2 rounded-xl border border-white/30 transition-all">
                <RefreshCw className={`w-3.5 h-3.5 ${loading?'animate-spin':''}`} /> Refresh
              </button>
              {attempts.length>0 && (
                <button onClick={handleExportCSV}
                  className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-2 rounded-xl border border-white/30 transition-all">
                  <Download className="w-3.5 h-3.5" /> Export CSV
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stat Pills */}
        {total>0 && (() => {
          const PILL_COLORS = {
            'bg-blue-50 border-blue-100 text-blue-600':   'Total Attempts',
            'bg-cyan-50 border-cyan-100 text-cyan-600':    'Avg Score',
            'bg-green-50 border-green-100 text-green-600': 'Passed',
            'bg-amber-50 border-amber-100 text-amber-600': 'Top Score',
          };
          const pills = [
            { icon:Users,        label:'Total Attempts', value:stats.total,              c:'bg-blue-50 border-blue-100 text-blue-600'   },
            { icon:Target,       label:'Avg Score',      value:`${stats.avg}%`,          c:'bg-cyan-50 border-cyan-100 text-cyan-600'   },
            { icon:CheckCircle2, label:'Passed (≥70%)',  value:stats.passed,             c:'bg-green-50 border-green-100 text-green-600'},
            { icon:Award,        label:'Top Score',      value:`${stats.topScore}%`,     c:'bg-amber-50 border-amber-100 text-amber-600'},
          ];
          return (
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {pills.map(({icon:Icon,label,value,c}) => (
                  <div key={label} className={`flex items-center gap-2 px-3 py-2 border rounded-xl ${c}`}>
                    <Icon className="w-4 h-4 flex-shrink-0 opacity-70" />
                    <div className="min-w-0">
                      <p className="text-sm font-black leading-none">{value}</p>
                      <p className="text-[9px] font-medium opacity-60 mt-0.5 leading-none truncate">{label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-700">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />{error}
          </div>
        )}

        {/* Empty */}
        {!error && attempts.length===0 ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-700 mb-2">No Attempts Yet</h3>
            <p className="text-gray-400 text-sm">Students haven't taken this assessment yet.</p>
          </div>
        ) : (
          <>
            {/* Attempts Table */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm overflow-hidden">
              {/* Table header bar */}
              <div className="px-5 py-3 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-100 flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
                  <ClipboardList className="w-3 h-3 text-white" />
                </div>
                <p className="font-bold text-gray-800 text-sm">{total} Attempt{total!==1?'s':''}</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/40">
                      {['Student','Score','Correct / Total','Marks','Date'].map(h => (
                        <th key={h} className="text-left text-[9px] font-black text-gray-400 uppercase tracking-wider px-5 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {attempts.map(a => {
                      const pct = Math.round(a.score_percentage||0);
                      return (
                        <tr key={a._id} className="hover:bg-blue-50/20 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                                <span className="text-white font-bold text-xs">
                                  {(a.student_id?.fullName||'S').split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase()}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-gray-900 text-sm truncate">{a.student_id?.fullName||'—'}</p>
                                <p className="text-xs text-gray-400 truncate">{a.student_id?.email||'—'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4"><ScoreBar pct={pct} /></td>
                          <td className="px-5 py-4 text-sm">
                            <span className="font-bold text-blue-600">{a.correct_answers??0}</span>
                            <span className="text-gray-400"> / {a.total_questions??0}</span>
                          </td>
                          <td className="px-5 py-4 text-sm">
                            <span className="font-bold text-gray-900">{a.earned_marks??0}</span>
                            <span className="text-gray-400"> / {a.total_marks??0}</span>
                          </td>
                          <td className="px-5 py-4 text-xs text-gray-400">
                            {a.submitted_at ? new Date(a.submitted_at).toLocaleDateString() : a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages>1 && (
              <div className="flex items-center justify-between px-1">
                <span className="text-xs text-gray-400">Page {page} of {totalPages}</span>
                <div className="flex items-center gap-2">
                  <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    <ChevronLeft className="w-3.5 h-3.5" /> Prev
                  </button>
                  <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </CollegeAdminLayout>
  );
};

export default AssessmentAttempts;