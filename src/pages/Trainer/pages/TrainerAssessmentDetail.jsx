// pages/Trainer/pages/TrainerAssessmentDetail.jsx
// Hub page — trainer jumps to Sections, Questions, or views Attempts
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Layers, BookOpen, BarChart2,
  Clock, Hash, Award, AlertCircle, Users,
  ArrowRight, Edit3, CheckCircle2, Tag,
} from 'lucide-react';
import TrainerDashboardLayout from '../../../components/layout/Trainerdashboardlayout';
import { assessmentAPI } from '../../../api/Api';

/* ─── Status badge ─────────────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  const map = {
    published: { bg: '#ECFDF5', text: '#059669', label: 'Published' },
    draft:     { bg: '#F8FAFC', text: '#64748B', label: 'Draft' },
    archived:  { bg: '#FFF7ED', text: '#D97706', label: 'Archived' },
    closed:    { bg: '#FEF2F2', text: '#DC2626', label: 'Closed' },
  };
  const s = map[status] || map.draft;
  return (
    <span
      className="text-[11px] font-black px-2.5 py-0.5 rounded-full"
      style={{ backgroundColor: s.bg, color: s.text }}
    >
      {s.label}
    </span>
  );
};

/* ─── Action Card ──────────────────────────────────────────────────── */
const ActionCard = ({ icon: Icon, title, desc, color, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all group
      ${disabled
        ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
        : `${color.border} bg-white hover:shadow-md hover:-translate-y-0.5`
      }`}
  >
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color.icon}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-black text-gray-800 text-sm">{title}</p>
      <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
    </div>
    {!disabled && (
      <ArrowRight className={`w-4 h-4 flex-shrink-0 text-slate-400 group-hover:translate-x-0.5 transition-transform ${color.arrow}`} />
    )}
  </button>
);

/* ─── Main ─────────────────────────────────────────────────────────── */
const TrainerAssessmentDetail = () => {
  const { assessmentId } = useParams();
  const navigate         = useNavigate();

  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await assessmentAPI.getAssessment(assessmentId);
        if (!res.success) throw new Error(res.message || 'Assessment not found');
        setAssessment(res.assessment);
      } catch (e) {
        setError(e.message || 'Failed to load assessment');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [assessmentId]);

  if (loading) return (
    <TrainerDashboardLayout>
      <div className="max-w-2xl mx-auto py-16 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#003399] border-t-transparent rounded-full animate-spin" />
      </div>
    </TrainerDashboardLayout>
  );

  if (error) return (
    <TrainerDashboardLayout>
      <div className="max-w-2xl mx-auto py-10">
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-5 text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0" /> {error}
        </div>
      </div>
    </TrainerDashboardLayout>
  );

  const questionCount  = assessment?.questions_id?.length ?? assessment?.num_questions ?? 0;
  const totalMarks     = assessment?.total_marks    ?? 0;
  const duration       = assessment?.duration_minutes ?? 0;
  const studentCount   = assessment?.eligible_students?.length ?? 0;

  const actions = [
    {
      icon:     Layers,
      title:    'Manage Sections',
      desc:     'Add, edit, or delete Coding / SQL / Quiz sections',
      color:    { border: 'border-[#003399]/20', icon: 'bg-gradient-to-br from-[#003399] to-[#00A9CE]', arrow: 'group-hover:text-[#003399]' },
      onClick:  () => navigate(`/dashboard/trainer/assessments/${assessmentId}/sections`),
      disabled: false,
    },
    {
      icon:     BookOpen,
      title:    'Manage Questions',
      desc:     'Add, edit, or remove questions for each section',
      color:    { border: 'border-violet-200', icon: 'bg-gradient-to-br from-violet-600 to-purple-500', arrow: 'group-hover:text-violet-600' },
      onClick:  () => navigate(`/dashboard/trainer/assessments/${assessmentId}/questions`),
      disabled: false,
    },
    {
      icon:     BarChart2,
      title:    'View Attempts',
      desc:     'See student attempt history and scores',
      color:    { border: 'border-green-200', icon: 'bg-gradient-to-br from-green-500 to-emerald-400', arrow: 'group-hover:text-green-600' },
      onClick:  () => navigate(`/dashboard/trainer/assessments/${assessmentId}/attempts`),
      disabled: true, // placeholder — build separately
    },
  ];

  return (
    <TrainerDashboardLayout>
      <div className="max-w-2xl mx-auto space-y-5 py-2">

        {/* Back */}
        <button
          onClick={() => navigate('/dashboard/trainer/assessments')}
          className="flex items-center gap-1.5 text-gray-500 hover:text-[#003399] text-sm font-semibold transition-colors group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Assessments
        </button>

        {/* Hero */}
        <div className="relative bg-gradient-to-r from-[#003399] via-[#003399]/80 to-[#00A9CE] rounded-2xl px-6 py-5 shadow-lg overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{ backgroundImage: 'radial-gradient(circle,white 1px,transparent 1px)', backgroundSize: '18px 18px' }}
          />
          <div className="relative">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <StatusBadge status={assessment.status} />
                  {assessment.level && (
                    <span className="text-[11px] font-bold text-white/60">{assessment.level}</span>
                  )}
                </div>
                <h1 className="text-white font-black text-xl leading-tight truncate">
                  {assessment.title || 'Untitled Assessment'}
                </h1>
                {assessment.skill_id?.name && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Tag className="w-3 h-3 text-white/50" />
                    <span className="text-xs text-white/60">{assessment.skill_id.name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap gap-4 mt-4">
              {[
                { icon: Hash,  val: questionCount, label: 'Questions' },
                { icon: Award, val: totalMarks,    label: 'Marks'     },
                { icon: Clock, val: duration ? `${duration} min` : '—', label: 'Duration' },
                { icon: Users, val: studentCount,  label: 'Students'  },
              ].map(({ icon: Icon, val, label }) => (
                <div key={label} className="flex items-center gap-2 text-white/80">
                  <Icon className="w-4 h-4 text-white/40" />
                  <span className="text-sm font-bold text-white">{val}</span>
                  <span className="text-xs text-white/50">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Published hint */}
        {assessment.status === 'published' && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-4 py-3 text-green-700 text-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>This assessment is <strong>live</strong> — students can see it. Changes to questions will apply immediately.</span>
          </div>
        )}

        {/* Action cards */}
        <div className="space-y-3">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Manage</p>
          {actions.map(a => (
            <ActionCard key={a.title} {...a} />
          ))}
        </div>

      </div>
    </TrainerDashboardLayout>
  );
};

export default TrainerAssessmentDetail;