// pages/CollegeAdmin/Assessments/ReviewPublish.jsx
// Step 5 of 5 — Review summary and publish / save draft
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, CheckCircle2, AlertCircle, Edit2,
  BookOpen, Layers, ListChecks, Award, Users, Send, Save,
  Clock, Calendar, Tag, Eye, Zap,
} from 'lucide-react';
import CollegeAdminLayout from '../../../components/layout/CollegeAdminLayout';
import { InlineSkeleton } from '../../../components/common/SkeletonLoader';
import { assessmentAPI, sectionAPI } from '../../../api/Api';
import WizardProgress from '../../../components/assessment/WizardProgress';

// ── Shared UI primitives ──────────────────────────────────────────────────────
const SummaryCard = ({ title, icon: Icon, step, children, onEdit, gradientFrom = '#003399', gradientTo = '#00A9CE' }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
    <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
          style={{ background: `linear-gradient(135deg,${gradientFrom},${gradientTo})` }}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="font-black text-slate-800 text-sm">{title}</span>
      </div>
      {onEdit && (
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 text-xs font-bold text-[#003399] hover:bg-[#003399]/5 px-2.5 py-1.5 rounded-lg transition-colors"
        >
          <Edit2 className="w-3 h-3" /> Edit
        </button>
      )}
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const Row = ({ label, value, highlight }) => (
  <div className="flex items-start justify-between py-1.5 border-b border-slate-50 last:border-0 gap-2">
    <span className="text-xs text-slate-500 font-semibold flex-shrink-0">{label}</span>
    <span className={`text-xs font-black text-right max-w-[65%] truncate ${highlight ? 'text-[#003399]' : 'text-slate-800'}`}>
      {value || '—'}
    </span>
  </div>
);

// ── Main page ─────────────────────────────────────────────────────────────────
const ReviewPublish = () => {
  const { assessmentId } = useParams();
  const navigate = useNavigate();

  const [assessment, setAssessment]   = useState(null);
  const [sections, setSections]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [publishing, setPublishing]   = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [error, setError]             = useState('');
  const [done, setDone]               = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [aRes, sRes] = await Promise.all([
          assessmentAPI.getAssessment(assessmentId),
          sectionAPI.getSections(assessmentId).catch(() => ({ success: true, sections: [] })),
        ]);
        if (aRes.success) setAssessment(aRes.assessment);
        setSections(sRes.sections || []);
      } catch {
        setError('Failed to load assessment data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [assessmentId]);

  const handlePublish = async (publish) => {
    setError('');
    publish ? setPublishing(true) : setSavingDraft(true);
    try {
      if (publish && assessment?.scheduled_date) {
        const res = await assessmentAPI.transitionStatus(assessmentId, 'scheduled');
        if (!res.success) throw new Error(res.message || 'Failed to schedule');
      } else if (publish) {
        // No date set — just mark active
        const res = await assessmentAPI.transitionStatus(assessmentId, 'active');
        if (!res.success) throw new Error(res.message || 'Failed to publish');
      }
      // draft: no status change needed — it's already a draft
      setDone(true);
      setTimeout(() => navigate('/dashboard/college-admin/assessments'), 1500);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setPublishing(false);
      setSavingDraft(false);
    }
  };

  if (loading) return (
    <CollegeAdminLayout>
      <div className="flex items-center justify-center py-24 min-h-screen bg-slate-50">
        <InlineSkeleton rows={6} />
      </div>
    </CollegeAdminLayout>
  );

  if (done) return (
    <CollegeAdminLayout>
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4 p-8">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-black text-slate-900">Assessment Saved!</h2>
          <p className="text-sm text-slate-500">Redirecting to assessments list…</p>
        </div>
      </div>
    </CollegeAdminLayout>
  );

  const a = assessment || {};
  const totalQuestions  = sections.reduce((s, sec) => s + (sec.configuration?.question_count || 0), 0);
  const totalSectionMks = sections.reduce((s, sec) => s + (sec.scoring?.total_marks || 0), 0);
  const eligibleCount   = a.eligible_students?.length || 0;
  const sectionTypes    = sections.map(s => s.type).join(', ') || '—';

  const formatDate = (d) => d ? new Date(d).toDateString() : null;

  return (
    <CollegeAdminLayout>
      <div className="min-h-screen bg-slate-50">

        {/* ── Wizard progress bar ── */}
        <WizardProgress currentStep={4} assessmentId={assessmentId} />

        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5 pb-10">

          {/* Back */}
          <button
            onClick={() => navigate(`/dashboard/college-admin/assessments/${assessmentId}/questions`)}
            className="flex items-center gap-1.5 text-slate-500 hover:text-[#003399] text-sm font-semibold transition-colors group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Questions
          </button>

          {/* Header */}
          <div>
            <h2 className="text-xl font-black text-slate-900">Review & Publish</h2>
            <p className="text-sm text-slate-500 mt-0.5">Check everything before saving or publishing.</p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          {/* ── Summary cards ── */}

          {/* Assessment Details */}
          <SummaryCard
            title="Assessment Details"
            icon={BookOpen}
            onEdit={() => navigate(`/dashboard/college-admin/assessments/${assessmentId}/edit`)}
          >
            <Row label="Title"         value={a.title}       highlight />
            <Row label="Level"         value={a.level} />
            <Row label="Total Marks"   value={a.total_marks ? String(a.total_marks) : null} />
            <Row label="Duration"      value={a.duration_minutes ? `${a.duration_minutes} min` : null} />
            {a.scheduled_date && (
              <Row label="Starts"
                value={`${formatDate(a.scheduled_date)}${a.start_time ? ' at ' + a.start_time : ''}`} />
            )}
            {a.end_date && (
              <Row label="Ends"
                value={`${formatDate(a.end_date)}${a.end_time ? ' at ' + a.end_time : ''}`} />
            )}
            {a.tags?.length > 0 && (
              <Row label="Tags" value={Array.isArray(a.tags) ? a.tags.join(', ') : a.tags} />
            )}
            <div className="flex gap-2 mt-3 flex-wrap">
              {a.shuffle_questions && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#003399]/5 text-[#003399] border border-[#003399]/20 px-2 py-0.5 rounded-full">
                  Shuffle On
                </span>
              )}
              {a.camera_proctoring_enabled && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full">
                  <Eye className="w-3 h-3" /> Camera Proctoring
                </span>
              )}
            </div>
          </SummaryCard>

          {/* Sections */}
          <SummaryCard
            title="Sections"
            icon={Layers}
            gradientFrom="#7c3aed"
            gradientTo="#6d28d9"
            onEdit={() => navigate(`/dashboard/college-admin/assessments/${assessmentId}/sections`)}
          >
            {sections.length === 0 ? (
              <p className="text-sm text-amber-600 font-semibold">No sections configured yet.</p>
            ) : (
              <>
                <Row label="Total Sections"   value={String(sections.length)} />
                <Row label="Section Types"    value={sectionTypes} />
                <Row label="Total Questions"  value={String(totalQuestions)} />
                <Row label="Marks (sections)" value={`${totalSectionMks} / ${a.total_marks || '?'}`}
                  highlight={totalSectionMks === a.total_marks} />
                <div className="mt-3 space-y-1.5">
                  {sections.map((sec, i) => {
                    const clr = sec.type === 'coding' ? 'bg-violet-50 border-violet-200 text-violet-700'
                      : sec.type === 'sql' ? 'bg-amber-50 border-amber-200 text-amber-700'
                      : 'bg-blue-50 border-blue-200 text-blue-700';
                    return (
                      <div key={sec._id} className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-semibold ${clr}`}>
                        <span>{sec.title}</span>
                        <span>{sec.configuration?.question_count} Qs · {sec.scoring?.total_marks} marks</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </SummaryCard>

          {/* Students */}
          <SummaryCard
            title="Assigned Students"
            icon={Users}
            gradientFrom="#059669"
            gradientTo="#10b981"
            onEdit={() => navigate(`/dashboard/college-admin/assessments/${assessmentId}/questions`, { state: { openAssignStudents: true } })}
          >
            <Row label="Assignment Mode"
              value={a.assignment_type || (eligibleCount > 0 ? 'manual' : 'class')} />
            <Row label="Students Assigned" value={eligibleCount > 0 ? String(eligibleCount) : 'Auto on publish'} />
            {eligibleCount === 0 && (
              <div className="mt-3 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-700">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                No students assigned yet — you can assign after publishing too.
              </div>
            )}
          </SummaryCard>

          {/* ── Publish actions ── */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">
              What would you like to do?
            </h4>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => navigate(`/dashboard/college-admin/assessments/${assessmentId}/questions`)}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-bold hover:bg-slate-50 transition-all">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>

              <button
                onClick={() => handlePublish(false)}
                disabled={savingDraft || publishing}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-bold hover:bg-slate-50 disabled:opacity-50 flex-1 sm:flex-none transition-all"
              >
                {savingDraft
                  ? <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                  : <Save className="w-4 h-4" />}
                {savingDraft ? 'Saving…' : 'Keep as Draft'}
              </button>

              <button
                onClick={() => handlePublish(true)}
                disabled={savingDraft || publishing}
                className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-black shadow-md transition-all hover:opacity-90 disabled:opacity-50 flex-1"
                style={{ background: 'linear-gradient(135deg,#003399,#00A9CE)' }}
              >
                {publishing
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Send className="w-4 h-4" />}
                {publishing ? 'Publishing…' : a.scheduled_date ? 'Schedule & Publish' : 'Publish Now'}
              </button>
            </div>

            <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
              <strong>Keep as Draft</strong> — visible only to admins. You can edit and publish later.<br />
              {a.scheduled_date
                ? <><strong>Schedule & Publish</strong> — marks it as Scheduled; students see it when the start date/time arrives.</>
                : <><strong>Publish Now</strong> — immediately visible and accessible to assigned students.</>}
            </p>
          </div>

          {/* Quick links */}
          <div className="flex flex-wrap gap-2 text-xs">
            <button
              onClick={() => navigate(`/dashboard/college-admin/assessments/${assessmentId}/attempts`)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-[#003399] hover:border-[#003399]/30 bg-white transition-all"
            >
              <Zap className="w-3 h-3" /> View Attempts
            </button>
            <button
              onClick={() => navigate('/dashboard/college-admin/assessments')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-[#003399] hover:border-[#003399]/30 bg-white transition-all"
            >
              Back to All Assessments
            </button>
          </div>

        </div>
      </div>
    </CollegeAdminLayout>
  );
};

export default ReviewPublish;