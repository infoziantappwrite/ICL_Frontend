// src/pages/jobs/JobDetail.jsx - Detailed view of a single job
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  Building2,
  Users,
  Award,
  CheckCircle,
  XCircle,
  Download,
  Send,
  AlertCircle,
  TrendingUp,
  Target,
  GraduationCap,
  Home
} from 'lucide-react';

const JobDetail = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [isEligible, setIsEligible] = useState(null);
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);

  useEffect(() => {
    fetchJobDetails();
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await window.jobAPI.getJobById(jobId);

      if (response.success) {
        setJob(response.job);
        setHasApplied(response.hasApplied);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkEligibility = async () => {
    try {
      setCheckingEligibility(true);
      const response = await window.jobAPI.checkEligibility(jobId);
      setIsEligible(response.eligible);
    } catch (err) {
      console.error('Error checking eligibility:', err);
    } finally {
      setCheckingEligibility(false);
    }
  };

  const handleApply = () => {
    if (!isEligible && isEligible !== null) {
      alert('You do not meet the eligibility criteria for this job.');
      return;
    }
    setShowApplyModal(true);
  };

  const formatDeadline = (deadline) => {
    const date = new Date(deadline);
    const now = new Date();
    const daysLeft = Math.ceil((date - now) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) return { text: 'Expired', class: 'text-red-600 bg-red-50' };
    if (daysLeft === 0) return { text: 'Today', class: 'text-orange-600 bg-orange-50' };
    if (daysLeft === 1) return { text: '1 day left', class: 'text-orange-600 bg-orange-50' };
    if (daysLeft <= 7) return { text: `${daysLeft} days left`, class: 'text-yellow-600 bg-yellow-50' };
    return { text: `${daysLeft} days left`, class: 'text-green-600 bg-green-50' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Navigation */}
          <div className="mb-6 flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard/student/jobs')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Jobs
            </button>
            <span className="text-gray-400">|</span>
            <button
              onClick={() => navigate('/dashboard/student')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <Home className="w-5 h-5" />
              Dashboard
            </button>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <p className="text-red-800 text-lg">{error || 'Job not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  const deadline = formatDeadline(job.dates.applicationDeadline);
  const isExpired = deadline.text === 'Expired';
  const isClosed = job.status === 'Closed' || job.status === 'Cancelled';

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Navigation Bar */}
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard/student/jobs')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Jobs
          </button>
          <span className="text-gray-400">|</span>
          <button
            onClick={() => navigate('/dashboard/student')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-medium"
          >
            <Home className="w-5 h-5" />
            Dashboard
          </button>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-white">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                {job.companyId?.logo ? (
                  <img
                    src={job.companyId.logo}
                    alt={job.companyId.name}
                    className="w-16 h-16 rounded-xl bg-white p-2 object-contain"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center text-blue-600 font-bold text-2xl">
                    {job.companyId?.name?.charAt(0) || 'C'}
                  </div>
                )}
                <div>
                  <h1 className="text-3xl font-bold mb-2">{job.jobTitle}</h1>
                  <p className="text-blue-100 text-lg">
                    {job.companyId?.displayName || job.companyId?.name}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm">
                      {job.jobType}
                    </span>
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm">
                      {job.jobRole}
                    </span>
                  </div>
                </div>
              </div>

              {job.isPinned && (
                <div className="px-4 py-2 bg-yellow-400 text-yellow-900 rounded-lg flex items-center gap-2 font-medium">
                  <TrendingUp className="w-5 h-5" />
                  Featured
                </div>
              )}
            </div>
          </div>

          {/* Quick Info Bar */}
          <div className="border-b border-gray-200 px-8 py-4 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">CTC</p>
                  <p className="font-semibold text-gray-900">
                    ₹{job.package.ctc.min}{job.package.ctc.max ? ` - ${job.package.ctc.max}` : ''} LPA
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Location</p>
                  <p className="font-semibold text-gray-900 truncate">
                    {job.locations?.[0]?.city || 'Multiple locations'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Building2 className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Work Mode</p>
                  <p className="font-semibold text-gray-900">
                    {job.locations?.[0]?.workMode || 'On-site'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${deadline.class.replace('text-', 'bg-').replace('-600', '-100')}`}>
                  <Clock className={`w-5 h-5 ${deadline.class.split(' ')[0]}`} />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Deadline</p>
                  <p className={`font-semibold ${deadline.class.split(' ')[0]}`}>
                    {deadline.text}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="p-8">
            {/* Apply Section */}
            {!hasApplied && !isExpired && !isClosed && (
              <div className="mb-8 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Ready to Apply?
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Make sure you meet all eligibility criteria before applying
                    </p>
                    
                    {isEligible === null && !checkingEligibility && (
                      <button
                        onClick={checkEligibility}
                        className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
                      >
                        <Target className="w-4 h-4" />
                        Check my eligibility
                      </button>
                    )}

                    {checkingEligibility && (
                      <p className="text-gray-600 italic">Checking eligibility...</p>
                    )}

                    {isEligible === true && (
                      <div className="flex items-center gap-2 text-green-600 font-medium">
                        <CheckCircle className="w-5 h-5" />
                        You are eligible for this role!
                      </div>
                    )}

                    {isEligible === false && (
                      <div className="flex items-center gap-2 text-red-600 font-medium">
                        <XCircle className="w-5 h-5" />
                        You don't meet the eligibility criteria
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={handleApply}
                    className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2 shadow-lg"
                  >
                    <Send className="w-5 h-5" />
                    Apply Now
                  </button>
                </div>
              </div>
            )}

            {hasApplied && (
              <div className="mb-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-blue-900">Application Submitted</h3>
                    <p className="text-blue-700 text-sm">You have already applied to this job</p>
                  </div>
                </div>
              </div>
            )}

            {(isExpired || isClosed) && !hasApplied && (
              <div className="mb-8 bg-red-50 border border-red-200 rounded-xl p-6">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                  <div>
                    <h3 className="font-semibold text-red-900">Applications Closed</h3>
                    <p className="text-red-700 text-sm">This job posting is no longer accepting applications</p>
                  </div>
                </div>
              </div>
            )}

            {/* Job Description */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Briefcase className="w-6 h-6 text-blue-600" />
                Job Description
              </h2>
              <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                {job.description}
              </div>
            </section>

            {/* Responsibilities */}
            {job.responsibilities && job.responsibilities.length > 0 && (
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Target className="w-6 h-6 text-blue-600" />
                  Key Responsibilities
                </h2>
                <ul className="space-y-2">
                  {job.responsibilities.map((resp, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{resp}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Requirements */}
            {job.requirements && job.requirements.length > 0 && (
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Award className="w-6 h-6 text-blue-600" />
                  Requirements
                </h2>
                <ul className="space-y-2">
                  {job.requirements.map((req, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{req}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Preferred Skills */}
            {job.preferredSkills && job.preferredSkills.length > 0 && (
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Preferred Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {job.preferredSkills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Eligibility Criteria */}
            <section className="mb-8 bg-gray-50 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <GraduationCap className="w-6 h-6 text-blue-600" />
                Eligibility Criteria
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Minimum CGPA</p>
                  <p className="text-lg font-semibold text-gray-900">{job.eligibility.minCGPA}/10</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Max Backlogs</p>
                  <p className="text-lg font-semibold text-gray-900">{job.eligibility.maxBacklogs}</p>
                </div>
                {job.eligibility.branches && job.eligibility.branches.length > 0 && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600 mb-2">Eligible Branches</p>
                    <div className="flex flex-wrap gap-2">
                      {job.eligibility.branches.map((branch, index) => (
                        <span key={index} className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-sm">
                          {branch}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Selection Process */}
            {job.selectionProcess?.rounds && job.selectionProcess.rounds.length > 0 && (
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Selection Process</h2>
                <div className="space-y-3">
                  {job.selectionProcess.rounds.map((round, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{round.name}</p>
                        {round.description && (
                          <p className="text-sm text-gray-600 mt-1">{round.description}</p>
                        )}
                      </div>
                      {round.duration && (
                        <span className="text-sm text-gray-600">{round.duration}</span>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Company Info */}
            {job.companyId && (
              <section className="mb-8 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">About {job.companyId.name}</h2>
                <p className="text-gray-700 mb-4">{job.companyId.description}</p>
                {job.companyId.website && (
                  <a
                    href={job.companyId.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Visit Website →
                  </a>
                )}
              </section>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-gray-50 rounded-xl">
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">{job.stats.totalViews}</p>
                <p className="text-sm text-gray-600 mt-1">Views</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{job.stats.totalApplications}</p>
                <p className="text-sm text-gray-600 mt-1">Applications</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{job.stats.shortlisted}</p>
                <p className="text-sm text-gray-600 mt-1">Shortlisted</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600">{job.stats.selected}</p>
                <p className="text-sm text-gray-600 mt-1">Selected</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Application Modal - simplified, you can make it more detailed */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-4">Apply to {job.jobTitle}</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to apply to this position? Make sure your profile is complete.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowApplyModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Implement application logic here
                  alert('Application feature coming soon!');
                  setShowApplyModal(false);
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Confirm Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDetail;