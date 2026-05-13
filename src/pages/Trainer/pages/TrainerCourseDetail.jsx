import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BookOpen, ChevronLeft, Clock, Users, Layers,
  Tag, BarChart2, AlertCircle, MessageSquare,
  User, RefreshCw,
} from 'lucide-react';
import TrainerDashboardLayout from '../../../components/layout/Trainerdashboardlayout';
import { trainerAPI, commentAPI } from '../../../api/Api';

/* ── Info row ── */
const InfoRow = ({ label, value }) => (
  <div className="flex items-start justify-between py-2.5 border-b border-slate-50 last:border-0">
    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide w-32 flex-shrink-0">{label}</span>
    <span className="text-sm font-semibold text-slate-700 text-right">{value || '—'}</span>
  </div>
);

/* ── Level badge ── */
const LevelBadge = ({ level }) => {
  const map = {
    Beginner:     { bg: '#ECFDF5', text: '#059669' },
    Intermediate: { bg: '#FFF7ED', text: '#D97706' },
    Advanced:     { bg: '#FEF2F2', text: '#DC2626' },
  };
  const s = map[level] || { bg: '#F1F5F9', text: '#475569' };
  return (
    <span className="text-xs font-black px-2.5 py-1 rounded-full" style={{ backgroundColor: s.bg, color: s.text }}>
      {level}
    </span>
  );
};

/* ════════ MAIN ════════ */
const TrainerCourseDetail = () => {
  const { courseId } = useParams();
  const navigate     = useNavigate();
  const [course,   setCourse]  = useState(null);
  const [loading,  setLoading] = useState(true);
  const [error,    setError]   = useState('');

  // ─── Comments ─────────────────────────────────────────────────────────────
  const [comments,        setComments]        = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError,   setCommentsError]   = useState('');
  const [toast,           setToast]           = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchComments = async (cid) => {
    setCommentsLoading(true);
    setCommentsError('');
    try {
      const res = await commentAPI.getTrainerCourseComments(cid);
      if (res.success) setComments(res.data || []);
      else setCommentsError(res.message || 'Could not load comments');
    } catch (e) {
      setCommentsError(e.message || 'Could not load comments');
    } finally {
      setCommentsLoading(false);
    }
  };



  useEffect(() => {
    if (!courseId) return;
    (async () => {
      try {
        const res = await trainerAPI.getCourseById(courseId);
        setCourse(res.data);
        // Load comments after course data is confirmed
        await fetchComments(courseId);
      } catch (e) {
        setError(e.message || 'Failed to load course details.');
      } finally {
        setLoading(false);
      }
    })();
  }, [courseId]);

  return (
    <TrainerDashboardLayout>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-xl text-[12px] font-bold ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
          {toast.msg}
        </div>
      )}

      <div className="w-full space-y-5 py-2">

        {/* Back */}
        <button
          onClick={() => navigate('/dashboard/trainer/courses')}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#003399] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Courses
        </button>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-4 animate-pulse">
            <div className="h-32 bg-white rounded-2xl border border-slate-100" />
            <div className="h-48 bg-white rounded-2xl border border-slate-100" />
          </div>
        )}

        {/* Content */}
        {!loading && course && (
          <>
            {/* Hero */}
            <div
              className="rounded-2xl p-6 relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #003399 0%, #00A9CE 100%)' }}
            >
              <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/5" />
              <div className="absolute -bottom-8 right-16 w-24 h-24 rounded-full bg-white/5" />
              <div className="relative">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  {course.level && <LevelBadge level={course.level} />}
                </div>
                <h1 className="text-lg font-black text-white leading-tight">{course.title}</h1>
                {course.shortDescription && (
                  <p className="text-blue-100 text-xs mt-1.5">{course.shortDescription}</p>
                )}
                {course.category && (
                  <div className="flex items-center gap-1 mt-2">
                    <Tag className="w-3 h-3 text-blue-200" />
                    <span className="text-[11px] text-blue-200 font-semibold">{course.category}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Clock,  label: 'Duration',  value: course.duration?.hours ? `${course.duration.hours}h` : '—' },
                { icon: Layers, label: 'Modules',   value: course.modules?.length || course.curriculum?.length || '—' },
                { icon: Users,  label: 'Enrolled',  value: course.enrolledCount ?? '—' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center">
                  <Icon className="w-5 h-5 mx-auto mb-1.5 text-[#00A9CE]" />
                  <p className="text-base font-black text-slate-800">{value}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">{label}</p>
                </div>
              ))}
            </div>

            {/* Details card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                <div className="w-6 h-6 rounded-lg bg-[#003399]/10 flex items-center justify-center">
                  <BarChart2 className="w-3.5 h-3.5 text-[#003399]" />
                </div>
                <h3 className="text-sm font-black text-slate-800">Course Details</h3>
              </div>
              <InfoRow label="Category"    value={course.category} />
              <InfoRow label="Level"       value={course.level} />
              <InfoRow label="Duration"    value={course.duration?.hours ? `${course.duration.hours} hours / ${course.duration?.weeks || '—'} weeks` : undefined} />
              <InfoRow label="Status"      value={course.status} />
              <InfoRow label="Price"       value={course.price?.discounted ? `₹${course.price.discounted}` : course.price?.original ? `₹${course.price.original}` : 'Free'} />
            </div>

            {/* Description */}
            {course.description && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <h3 className="text-sm font-black text-slate-800 mb-3">Description</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{course.description}</p>
              </div>
            )}

            {/* Curriculum / Modules */}
            {(course.modules?.length > 0 || course.curriculum?.length > 0) && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <h3 className="text-sm font-black text-slate-800 mb-3">
                  Curriculum ({(course.modules || course.curriculum || []).length} modules)
                </h3>
                <div className="space-y-2">
                  {(course.modules || course.curriculum || []).map((mod, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50">
                      <div className="w-6 h-6 rounded-lg bg-[#003399]/10 flex items-center justify-center text-[10px] font-black text-[#003399] flex-shrink-0">
                        {i + 1}
                      </div>
                      <span className="text-xs font-semibold text-slate-700">{mod.module || mod.title || mod.moduleName || `Module ${i + 1}`}</span>
                      {mod.assessmentIds?.length > 0 && (
                        <span className="ml-auto text-[10px] bg-[#003399]/10 text-[#003399] px-2 py-0.5 rounded-full font-bold flex-shrink-0">
                          {mod.assessmentIds.length} assessment{mod.assessmentIds.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ─── Comments ─────────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                <div className="w-6 h-6 rounded-lg bg-[#003399]/10 flex items-center justify-center">
                  <MessageSquare className="w-3.5 h-3.5 text-[#003399]" />
                </div>
                <h3 className="text-sm font-black text-slate-800">
                  Student Comments
                  {comments.length > 0 && (
                    <span className="ml-1.5 text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      {comments.length}
                    </span>
                  )}
                </h3>
              </div>

              {commentsLoading ? (
                <div className="flex justify-center py-6">
                  <RefreshCw className="w-5 h-5 text-[#003399] animate-spin" />
                </div>
              ) : commentsError ? (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-600">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {commentsError}
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-25" />
                  <p className="text-xs">No student comments yet for this course.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {comments.map((c) => {
                    const name  = c.student_id?.fullName || 'Student';
                    const email = c.student_id?.email || '';
                    const date  = c.created_at
                      ? new Date(c.created_at).toLocaleDateString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })
                      : '';
                    return (
                      <div key={c._id} className="flex gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="w-8 h-8 rounded-full bg-[#003399]/10 flex items-center justify-center flex-shrink-0 text-[12px] font-black text-[#003399] uppercase">
                          {name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-1.5 flex-wrap mb-1">
                            <span className="text-xs font-bold text-slate-800">{name}</span>
                            {email && (
                              <span className="text-[10px] text-slate-400">{email}</span>
                            )}
                            {date && (
                              <span className="text-[10px] text-slate-400 ml-auto">{date}</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed break-words">{c.comment}</p>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </TrainerDashboardLayout>
  );
};

export default TrainerCourseDetail;