// src/pages/CollegeAdmin/StudentReport.jsx
// College admin view of a single student's performance report
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, User, BookOpen, Target, Award, TrendingUp,
  Clock, CheckCircle2, XCircle, AlertCircle, Loader2,
  GraduationCap, BarChart2, FileText, Code2,
  Calendar, Star, Activity, Layers,
} from 'lucide-react';
import CollegeAdminLayout from '../../components/layout/CollegeAdminLayout';
import { reportAPI } from '../../api/Api';

// ── Atoms ─────────────────────────────────────────────────────────
const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${className}`}>
    {children}
  </div>
);

const Stat = ({ label, value, sub, icon: Icon, color = 'blue' }) => {
  const colors = {
    blue:   'bg-blue-50  text-blue-600  border-blue-100',
    green:  'bg-green-50 text-green-600 border-green-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    amber:  'bg-amber-50  text-amber-600 border-amber-100',
    red:    'bg-red-50    text-red-600   border-red-100',
  };
  return (
    <div className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${colors[color]} shrink-0`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-2xl font-black text-gray-900">{value ?? '—'}</p>
        <p className="text-sm font-semibold text-gray-700">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
};

const ScoreBar = ({ pct }) => {
  const color = pct >= 70 ? 'from-green-500 to-emerald-400' : pct >= 40 ? 'from-blue-400 to-cyan-400' : 'from-red-400 to-orange-400';
  const text  = pct >= 70 ? 'text-green-700' : pct >= 40 ? 'text-blue-600' : 'text-red-600';
  return (
    <div className="flex items-center gap-3 w-40">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full bg-gradient-to-r ${color} rounded-full`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
      <span className={`text-sm font-bold ${text} tabular-nums`}>{pct}%</span>
    </div>
  );
};

const Badge = ({ children, color = 'gray' }) => {
  const map = {
    green:  'bg-green-50 text-green-700 ring-1 ring-green-200',
    red:    'bg-red-50   text-red-700   ring-1 ring-red-200',
    blue:   'bg-blue-50  text-blue-700  ring-1 ring-blue-200',
    amber:  'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    purple: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200',
    gray:   'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[color]}`}>
      {children}
    </span>
  );
};

// ── Main ──────────────────────────────────────────────────────────
const StudentReport = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();

  const [report,  setReport]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (!studentId) return;
    (async () => {
      setLoading(true);
      try {
        const res = await reportAPI.getStudentReport(studentId);
        setReport(res.report);
      } catch (e) {
        setError(e.message || 'Failed to load student report');
      } finally {
        setLoading(false);
      }
    })();
  }, [studentId]);

  // ── Loading ────────────────────────────────────────────────────
  if (loading) {
    return (
      <CollegeAdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Loading student report…</p>
          </div>
        </div>
      </CollegeAdminLayout>
    );
  }

  // ── Error ──────────────────────────────────────────────────────
  if (error) {
    return (
      <CollegeAdminLayout>
        <div className="p-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex items-start gap-3 p-5 bg-red-50 border border-red-200 rounded-2xl">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-700">Failed to load report</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </CollegeAdminLayout>
    );
  }

  if (!report) return null;

  // ── Extract data safely ────────────────────────────────────────
  const student    = report.student     || {};
  const summary    = report.summary     || {};
  const assessments = report.assessments || [];
  const courses    = report.courses     || [];
  const skills     = report.skills      || [];
  const applications = report.applications || [];

  const fullName   = student.fullName || student.name || 'Student';
  const email      = student.email || '—';
  const branch     = student.branch || student.department || '—';
  const rollNumber = student.rollNumber || student.roll_number || '—';

  const totalAssessments = summary.totalAssessments ?? assessments.length;
  const avgScore   = summary.averageScore   ?? (assessments.length
    ? Math.round(assessments.reduce((s, a) => s + (a.percentage ?? a.score_percentage ?? 0), 0) / assessments.length)
    : 0);
  const passedCount = summary.passedCount ?? assessments.filter(a => (a.percentage ?? a.score_percentage ?? 0) >= 50).length;
  const coursesEnrolled = summary.coursesEnrolled ?? courses.length;

  return (
    <CollegeAdminLayout>
      <div className="p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)}
            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-all">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Student Report</h1>
            <p className="text-sm text-gray-500 mt-0.5">Performance & activity overview</p>
          </div>
        </div>

        {/* Student info card */}
        <Card className="p-6">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shrink-0">
              <span className="text-white font-black text-2xl">
                {fullName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-black text-gray-900">{fullName}</h2>
              <p className="text-sm text-gray-500 mt-0.5">{email}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {rollNumber !== '—' && (
                  <Badge color="blue">Roll: {rollNumber}</Badge>
                )}
                {branch !== '—' && (
                  <Badge color="purple">{branch}</Badge>
                )}
                {student.semester && (
                  <Badge color="amber">Sem {student.semester}</Badge>
                )}
                {student.cgpa && (
                  <Badge color="green">CGPA {student.cgpa}</Badge>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Summary stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Stat icon={Target}       label="Assessments Taken"   value={totalAssessments}    color="blue" />
          <Stat icon={TrendingUp}   label="Average Score"       value={`${avgScore}%`}       color="green" />
          <Stat icon={CheckCircle2} label="Passed"              value={passedCount}           color="purple" sub={`of ${totalAssessments}`} />
          <Stat icon={BookOpen}     label="Courses Enrolled"    value={coursesEnrolled}       color="amber" />
        </div>

        {/* Assessments table */}
        {assessments.length > 0 && (
          <Card>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <BarChart2 className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="font-black text-gray-900">Assessment Results</h3>
              <span className="ml-auto text-xs font-semibold text-gray-400">{assessments.length} attempts</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Assessment</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Score</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Progress</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {assessments.map((a, idx) => {
                    const pct    = Math.round(a.percentage ?? a.score_percentage ?? 0);
                    const passed = pct >= 50;
                    const date   = a.submittedAt || a.createdAt;
                    return (
                      <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-900 leading-tight">
                            {a.assessmentTitle || a.title || `Assessment ${idx + 1}`}
                          </p>
                          {a.totalMarks && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              {a.obtainedMarks ?? a.scored_marks ?? '—'} / {a.totalMarks} marks
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span className="font-bold text-gray-900 tabular-nums">{pct}%</span>
                        </td>
                        <td className="px-4 py-4">
                          <ScoreBar pct={pct} />
                        </td>
                        <td className="px-4 py-4">
                          <Badge color={passed ? 'green' : 'red'}>
                            {passed ? '✓ Passed' : '✗ Failed'}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-gray-500 text-xs">
                          {date ? new Date(date).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Courses */}
        {courses.length > 0 && (
          <Card>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
              <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-green-600" />
              </div>
              <h3 className="font-black text-gray-900">Enrolled Courses</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {courses.map((c, idx) => {
                const prog = c.progressPercentage ?? c.progress ?? 0;
                return (
                  <div key={idx} className="px-6 py-4 flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
                      <Layers className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">{c.title || c.courseTitle || `Course ${idx + 1}`}</p>
                      {c.completedModules !== undefined && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {c.completedModules} / {c.totalModules ?? '?'} modules complete
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <ScoreBar pct={Math.round(prog)} />
                      {c.completed && <Badge color="green">Complete</Badge>}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                <Star className="w-4 h-4 text-purple-600" />
              </div>
              <h3 className="font-black text-gray-900">Skills</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.map((sk, idx) => (
                <span key={idx}
                  className="px-3 py-1.5 bg-purple-50 text-purple-700 ring-1 ring-purple-200 rounded-full text-sm font-semibold">
                  {typeof sk === 'string' ? sk : sk.name || sk.skill}
                </span>
              ))}
            </div>
          </Card>
        )}

        {/* Applications */}
        {applications.length > 0 && (
          <Card>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-amber-600" />
              </div>
              <h3 className="font-black text-gray-900">Job Applications</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {applications.map((ap, idx) => {
                const statusColor = {
                  applied: 'blue', shortlisted: 'purple',
                  selected: 'green', rejected: 'red',
                }[ap.status?.toLowerCase()] ?? 'gray';
                return (
                  <div key={idx} className="px-6 py-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">{ap.jobTitle || ap.position || `Application ${idx + 1}`}</p>
                      {ap.companyName && <p className="text-xs text-gray-400 mt-0.5">{ap.companyName}</p>}
                    </div>
                    <Badge color={statusColor}>
                      {ap.status ? ap.status.charAt(0).toUpperCase() + ap.status.slice(1) : 'Applied'}
                    </Badge>
                    {ap.appliedAt && (
                      <span className="text-xs text-gray-400 hidden sm:block">
                        {new Date(ap.appliedAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short' })}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Empty state */}
        {assessments.length === 0 && courses.length === 0 && applications.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Activity className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-lg font-bold text-gray-900">No activity yet</p>
            <p className="text-sm text-gray-500 mt-1">This student hasn't taken any assessments or enrolled in courses yet.</p>
          </div>
        )}

      </div>
    </CollegeAdminLayout>
  );
};

export default StudentReport;