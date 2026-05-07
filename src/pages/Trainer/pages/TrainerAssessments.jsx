import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList, Plus, Search, ChevronRight, Clock,
  CheckCircle2, Users, BarChart2, Tag, Layers,
  AlertCircle,
} from 'lucide-react';
import TrainerDashboardLayout from '../../../components/layout/Trainerdashboardlayout';
import { trainerAPI, assessmentAPI } from '../../../api/Api';
import { useToast } from '../../../context/ToastContext';

/* ─── Status badge ─── */
const StatusBadge = ({ status }) => {
  const map = {
    published: { bg: '#ECFDF5', text: '#059669', label: 'Published' },
    draft:     { bg: '#F8FAFC', text: '#64748B', label: 'Draft' },
    archived:  { bg: '#FFF7ED', text: '#D97706', label: 'Archived' },
    closed:    { bg: '#FEF2F2', text: '#DC2626', label: 'Closed' },
  };
  const s = map[status] || map.draft;
  return (
    <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ backgroundColor: s.bg, color: s.text }}>
      {s.label}
    </span>
  );
};

/* ─── Level badge ─── */
const LevelBadge = ({ level }) => {
  const map = {
    Beginner:     { bg: '#ECFDF5', text: '#059669' },
    Intermediate: { bg: '#FFF7ED', text: '#D97706' },
    Advanced:     { bg: '#FEF2F2', text: '#DC2626' },
  };
  const s = map[level] || { bg: '#F1F5F9', text: '#475569' };
  return (
    <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ backgroundColor: s.bg, color: s.text }}>
      {level}
    </span>
  );
};

/* ─── Assessment Card ─── */
const AssessmentCard = ({ assessment, onToggle }) => {
  const totalAttempts   = assessment.totalAttempts   || 0;
  const completedAttempts = assessment.completedAttempts || 0;
  const pct = totalAttempts > 0 ? Math.round((completedAttempts / totalAttempts) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 p-5">
      {/* Top */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-black text-slate-800 truncate">{assessment.title || 'Untitled Assessment'}</h3>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <StatusBadge status={assessment.status} />
            <LevelBadge level={assessment.level} />
            {assessment.skill_id?.name && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#003399]/8 text-[#003399]">
                {assessment.skill_id.name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { icon: Layers, val: assessment.num_questions || 0, label: 'Questions' },
          { icon: Users,  val: totalAttempts,                  label: 'Attempts' },
          { icon: CheckCircle2, val: `${pct}%`,               label: 'Completed' },
        ].map(({ icon: Icon, val, label }) => (
          <div key={label} className="bg-slate-50 rounded-xl p-2 text-center">
            <Icon className="w-3.5 h-3.5 mx-auto mb-0.5 text-slate-400" />
            <p className="text-xs font-black text-slate-800">{val}</p>
            <p className="text-[9px] text-slate-400">{label}</p>
          </div>
        ))}
      </div>

      {/* Completion bar */}
      {totalAttempts > 0 && (
        <div className="mb-4">
          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #003399, #00A9CE)' }} />
          </div>
          <p className="text-[10px] text-slate-400 mt-1">{completedAttempts}/{totalAttempts} completed</p>
        </div>
      )}

      {/* Created date */}
      <p className="text-[10px] text-slate-400 mb-3">
        Created {new Date(assessment.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
      </p>

      {/* Toggle status button */}
      <button
        onClick={() => onToggle(assessment._id)}
        className="w-full py-2 rounded-xl text-xs font-black transition-all border"
        style={
          assessment.status === 'published'
            ? { background: '#FFF7ED', color: '#D97706', borderColor: '#FDE68A' }
            : { background: 'linear-gradient(135deg, #003399, #00A9CE)', color: '#fff', borderColor: 'transparent' }
        }
      >
        {assessment.status === 'published' ? 'Unpublish' : 'Publish'}
      </button>
    </div>
  );
};

/* ════════ MAIN ════════ */
const TrainerAssessments = () => {
  const navigate = useNavigate();
  const toast    = useToast();
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [filter, setFilter]           = useState('all');
  const [error, setError]             = useState('');

  const fetchAssessments = async () => {
    setLoading(true);
    try {
      const res = await trainerAPI.getAssessments();
      setAssessments(res.data || []);
    } catch (e) {
      setError('Failed to load assessments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAssessments(); }, []);

  const handleToggle = async (id) => {
    try {
      await assessmentAPI.toggleAssessmentStatus(id);
      toast.success('Updated', 'Assessment status changed.');
      fetchAssessments();
    } catch (e) {
      toast.error('Error', e.message || 'Failed to update status.');
    }
  };

  const filtered = assessments.filter(a => {
    const matchSearch = (a.title || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || a.status === filter || a.level === filter;
    return matchSearch && matchFilter;
  });

  return (
    <TrainerDashboardLayout>
      <div className="max-w-screen-xl mx-auto space-y-5 py-2">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-black text-slate-800">Assessments</h1>
            <p className="text-xs text-slate-400 mt-0.5">{assessments.length} assessments created by you</p>
          </div>
          <button
            onClick={() => navigate('/dashboard/college-admin/assessments/create')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #003399, #00A9CE)' }}
          >
            <Plus className="w-3.5 h-3.5" /> New Assessment
          </button>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search assessments..."
              className="bg-transparent text-sm outline-none flex-1 text-slate-700"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {['all', 'draft', 'published', 'Beginner', 'Intermediate', 'Advanced'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all capitalize ${
                  filter === f
                    ? 'bg-[#003399] text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-[#003399]/30'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse">
                <div className="h-4 bg-slate-100 rounded w-3/4 mb-3" />
                <div className="h-3 bg-slate-100 rounded w-1/2 mb-4" />
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[0,1,2].map(j => <div key={j} className="h-14 bg-slate-100 rounded-xl" />)}
                </div>
                <div className="h-8 bg-slate-100 rounded-xl" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <ClipboardList className="w-12 h-12 mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 font-bold text-sm">
              {assessments.length === 0 ? 'No assessments created yet.' : 'No assessments match your search.'}
            </p>
            <button
              onClick={() => navigate('/dashboard/college-admin/assessments/create')}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-black text-white"
              style={{ background: 'linear-gradient(135deg, #003399, #00A9CE)' }}
            >
              Create Your First Assessment
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((a, i) => (
              <AssessmentCard key={a._id || i} assessment={a} onToggle={handleToggle} />
            ))}
          </div>
        )}
      </div>
    </TrainerDashboardLayout>
  );
};

export default TrainerAssessments;