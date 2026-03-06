// pages/Courses/CourseDetail.jsx
// Student: View full course info, enroll, and navigate to learning
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BookOpen, Clock, Users, Award, Star, ChevronLeft, ChevronRight,
  CheckCircle2, PlayCircle, Download, Globe, AlertCircle, Layers,
  User, Tag, Calendar, BarChart3, Zap, FileText, ArrowRight, Lock,
  RefreshCw
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { courseAPI } from '../../api/Api';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const LEVEL_CONFIG = {
  Beginner:     { color: 'bg-green-100 text-green-700 border-green-200',   dot: 'bg-green-500' },
  Intermediate: { color: 'bg-blue-100 text-blue-700 border-blue-200',      dot: 'bg-blue-500'  },
  Advanced:     { color: 'bg-purple-100 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
};

const STATUS_LABEL = {
  pending:   'Enrolled',
  active:    'In Progress',
  completed: 'Completed',
  dropped:   'Dropped',
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const InfoBadge = ({ icon: Icon, children, className = '' }) => (
  <div className={`flex items-center gap-1.5 text-sm text-gray-600 ${className}`}>
    <Icon className="w-4 h-4 flex-shrink-0 text-gray-400" />
    {children}
  </div>
);

const SectionCard = ({ title, icon: Icon, iconBg, children }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
    <div className="flex items-center gap-3 mb-4">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="font-bold text-gray-900">{title}</h3>
    </div>
    {children}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const CourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [expandedModule, setExpandedModule] = useState(null);

  useEffect(() => {
    fetchCourse();
  }, [courseId]);

  const fetchCourse = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await courseAPI.getCourseById(courseId);
      if (res.success) {
        setCourse(res.data);
        setEnrollment(res.data.enrollment || null);
      } else {
        setError(res.message || 'Course not found');
      }
    } catch (err) {
      setError(err.message || 'Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      const res = await courseAPI.enrollInCourse(courseId);
      if (res.success) {
        setEnrollment(res.data);
        showToast('Successfully enrolled! Start learning now.');
      } else {
        showToast(res.message || 'Enrollment failed', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Enrollment failed', 'error');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading Course..." submessage="Fetching course details" icon={BookOpen} />;
  }

  if (error || !course) {
    return (
      <DashboardLayout title="Course Detail">
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <AlertCircle className="w-12 h-12 text-red-400" />
          <p className="text-gray-600">{error || 'Course not found'}</p>
          <button onClick={() => navigate('/dashboard/student/courses')} className="text-blue-600 hover:underline text-sm">
            ← Back to courses
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const levelCfg = LEVEL_CONFIG[course.level] || LEVEL_CONFIG.Beginner;
  const price = course.price?.discounted || course.price?.original || 0;
  const currency = course.price?.currency === 'USD' ? '$' : '₹';
  const discountPct = course.discountPercentage || 0;
  const isEnrolled = !!enrollment;
  const isCompleted = enrollment?.status === 'completed';

  return (
    <DashboardLayout title={course.title}>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-medium transition-all ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Back */}
      <button
        onClick={() => navigate('/dashboard/student/courses')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> Back to Courses
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT: Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <div className="relative bg-gradient-to-br from-blue-600 via-blue-600 to-cyan-600 rounded-3xl p-8 text-white overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute w-48 h-48 bg-white rounded-full -top-16 -right-16" />
              <div className="absolute w-32 h-32 bg-white rounded-full bottom-8 left-8" />
            </div>
            <div className="relative">
              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full">
                  {course.category}
                </span>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${levelCfg.color}`}>
                  {course.level}
                </span>
                <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full">
                  {course.deliveryMode}
                </span>
                {course.language && (
                  <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full">
                    {course.language}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold leading-tight mb-3">{course.title}</h1>
              <p className="text-blue-100 text-sm leading-relaxed mb-5">
                {course.shortDescription || course.description}
              </p>

              {/* Stats */}
              <div className="flex flex-wrap gap-5 text-sm text-blue-100">
                <InfoBadge icon={Clock} className="text-blue-100">{course.duration?.hours}h total</InfoBadge>
                {course.duration?.weeks && <InfoBadge icon={Calendar} className="text-blue-100">{course.duration.weeks} weeks</InfoBadge>}
                <InfoBadge icon={Users} className="text-blue-100">{course.enrollmentCount || 0} enrolled</InfoBadge>
                {course.rating?.count > 0 && (
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-amber-300 text-amber-300" />
                    {course.rating.average.toFixed(1)} ({course.rating.count} reviews)
                  </span>
                )}
                {course.certificateProvided && (
                  <InfoBadge icon={Award} className="text-blue-100">Certificate included</InfoBadge>
                )}
              </div>

              {/* Instructor */}
              {course.instructor?.name && (
                <div className="mt-5 pt-5 border-t border-white/20 flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold">{course.instructor.name}</p>
                    {course.instructor.experience && (
                      <p className="text-blue-200 text-xs">{course.instructor.experience} years experience</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {course.description && course.description !== course.shortDescription && (
            <SectionCard title="About This Course" icon={BookOpen} iconBg="bg-blue-100 text-blue-600">
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{course.description}</p>
              {course.instructor?.bio && (
                <div className="mt-4 pt-4 border-t border-gray-50">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">About the Instructor</p>
                  <p className="text-gray-600 text-sm leading-relaxed">{course.instructor.bio}</p>
                </div>
              )}
            </SectionCard>
          )}

          {/* Learning Outcomes */}
          {course.learningOutcomes?.length > 0 && (
            <SectionCard title="What You'll Learn" icon={CheckCircle2} iconBg="bg-green-100 text-green-600">
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {course.learningOutcomes.map((outcome, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    {outcome}
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}

          {/* Curriculum */}
          {course.curriculum?.length > 0 && (
            <SectionCard title="Course Curriculum" icon={Layers} iconBg="bg-purple-100 text-purple-600">
              <p className="text-sm text-gray-500 mb-4">{course.curriculum.length} modules • {course.duration?.hours}h total</p>
              <div className="space-y-2">
                {course.curriculum.map((mod, i) => (
                  <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedModule(expandedModule === i ? null : i)}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-blue-700">{i + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{mod.module}</p>
                          {mod.topics?.length > 0 && (
                            <p className="text-xs text-gray-400">{mod.topics.length} topics{mod.duration ? ` • ${mod.duration}h` : ''}</p>
                          )}
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${expandedModule === i ? 'rotate-90' : ''}`} />
                    </button>
                    {expandedModule === i && mod.topics?.length > 0 && (
                      <div className="px-4 pb-4 pt-1 space-y-1.5 bg-gray-50">
                        {mod.topics.map((topic, j) => (
                          <div key={j} className="flex items-center gap-2 text-sm text-gray-600 pl-10">
                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0" />
                            {topic}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Prerequisites */}
          {course.prerequisites?.length > 0 && (
            <SectionCard title="Prerequisites" icon={Lock} iconBg="bg-amber-100 text-amber-600">
              <ul className="space-y-2">
                {course.prerequisites.map((pre, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm text-gray-700">
                    <div className="w-1.5 h-1.5 bg-amber-400 rounded-full flex-shrink-0" />
                    {pre}
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}

          {/* Tags */}
          {course.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Tag className="w-4 h-4 text-gray-400 mt-0.5" />
              {course.tags.map(tag => (
                <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">{tag}</span>
              ))}
            </div>
          )}

          {/* Linked Assessment */}
          {course.assessmentId && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
              <Zap className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-800">Assessment Included</p>
                <p className="text-sm text-amber-700 mt-1">
                  <strong>{course.assessmentId.title}</strong> will be automatically triggered when you complete this course.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Enrollment Sidebar */}
        <div className="space-y-5">
          {/* Enrollment Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6 sticky top-6">
            {/* Price */}
            <div className="mb-5">
              {price === 0 ? (
                <div className="text-3xl font-bold text-green-600">Free</div>
              ) : (
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900">{currency}{price}</span>
                    {discountPct > 0 && course.price?.original !== price && (
                      <span className="text-lg text-gray-400 line-through">{currency}{course.price?.original}</span>
                    )}
                  </div>
                  {discountPct > 0 && (
                    <span className="text-sm bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full font-semibold">
                      {discountPct}% discount applied
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* CTA Buttons */}
            {!isEnrolled ? (
              <button
                onClick={handleEnroll}
                disabled={enrolling || course.status !== 'Active'}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {enrolling ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Enrolling...</>
                ) : course.status !== 'Active' ? (
                  <><Lock className="w-4 h-4" /> Enrollment Closed</>
                ) : (
                  <><PlayCircle className="w-5 h-5" /> Enroll Now</>
                )}
              </button>
            ) : (
              <div className="space-y-3">
                <div className={`flex items-center gap-2 p-3 rounded-xl ${isCompleted ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'}`}>
                  <CheckCircle2 className={`w-5 h-5 ${isCompleted ? 'text-green-500' : 'text-blue-500'}`} />
                  <div>
                    <p className={`font-semibold text-sm ${isCompleted ? 'text-green-700' : 'text-blue-700'}`}>
                      {STATUS_LABEL[enrollment.status] || enrollment.status}
                    </p>
                    {!isCompleted && enrollment.overallProgress !== undefined && (
                      <p className="text-xs text-blue-500">{enrollment.overallProgress}% complete</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/dashboard/student/courses/${courseId}/learn`)}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg shadow-blue-500/30"
                >
                  <PlayCircle className="w-5 h-5" />
                  {isCompleted ? 'Review Course' : 'Continue Learning'}
                </button>
                {enrollment.certificateUrl && (
                  <a
                    href={enrollment.certificateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-3 border border-green-300 text-green-700 font-medium rounded-xl hover:bg-green-50 transition-all text-sm"
                  >
                    <Download className="w-4 h-4" /> Download Certificate
                  </a>
                )}
              </div>
            )}

            {/* Key Details */}
            <div className="mt-6 space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Course Details</p>
              <div className="space-y-2.5 text-sm text-gray-600">
                <InfoBadge icon={Clock}>{course.duration?.hours}h {course.duration?.weeks ? `• ${course.duration.weeks} weeks` : ''}</InfoBadge>
                <InfoBadge icon={BarChart3}>{course.level}</InfoBadge>
                <InfoBadge icon={Globe}>{course.deliveryMode}</InfoBadge>
                <InfoBadge icon={FileText}>{course.language || 'English'}</InfoBadge>
                <InfoBadge icon={Layers}>{course.curriculum?.length || 0} modules</InfoBadge>
                {course.certificateProvided && <InfoBadge icon={Award}>Certificate of Completion</InfoBadge>}
                {course.startDate && <InfoBadge icon={Calendar}>Starts {new Date(course.startDate).toLocaleDateString()}</InfoBadge>}
                {course.registrationDeadline && <InfoBadge icon={Calendar}>Deadline {new Date(course.registrationDeadline).toLocaleDateString()}</InfoBadge>}
                {course.maxEnrollments && (
                  <InfoBadge icon={Users}>
                    {course.enrollmentCount}/{course.maxEnrollments} seats
                  </InfoBadge>
                )}
              </div>
            </div>

            {/* Syllabus */}
            {course.syllabusUrl && (
              <a
                href={course.syllabusUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 w-full flex items-center justify-center gap-2 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:border-blue-300 hover:text-blue-600 transition-all"
              >
                <Download className="w-4 h-4" /> Download Syllabus
              </a>
            )}
          </div>

          {/* Video Preview */}
          {course.videoUrl && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Preview</p>
              <div className="aspect-video bg-gray-900 rounded-xl overflow-hidden">
                <iframe
                  src={course.videoUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Course preview"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CourseDetail;