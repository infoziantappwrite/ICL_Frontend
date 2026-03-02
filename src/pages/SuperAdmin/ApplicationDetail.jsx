import { useToast } from '../../context/ToastContext';
// pages/SuperAdmin/ApplicationDetail.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiCall from '../../api/Api';
import {
  ArrowLeft,
  FileText,
  User,
  Mail,
  Phone,
  Briefcase,
  Building2,
  Calendar,
  MapPin,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  GraduationCap,
  DollarSign,
  Award,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const ApplicationDetail = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const { applicationId } = useParams();
  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchApplicationDetail();
  }, [applicationId]);

  const fetchApplicationDetail = async () => {
    try {
      setLoading(true);
      const data = await apiCall(`/super-admin/applications/${applicationId}`);
      if (data.success) {
        setApplication(data.application);
      } else {
        // Mock data for demonstration
        setApplication({
          _id: applicationId,
          student: {
            fullName: 'John Doe',
            email: 'john@college.edu',
            phone: '+91 9876543210',
            rollNumber: 'CS2021001',
            branch: 'Computer Science',
            graduationYear: '2025',
            cgpa: '8.5',
          },
          job: {
            title: 'Software Engineer',
            company: {
              name: 'Tech Corp',
              location: 'Bangalore, India',
            },
            location: 'Bangalore',
            salary: '₹8-12 LPA',
            type: 'Full-time',
          },
          college: {
            name: 'MIT College',
            code: 'MIT01',
          },
          status: 'pending',
          appliedDate: new Date('2024-02-10'),
          resumeUrl: '/uploads/resumes/john-doe-resume.pdf',
          coverLetter: 'I am very interested in this position...',
          additionalInfo: {
            skills: ['React', 'Node.js', 'Python'],
            experience: '1 year internship',
            projects: 3,
          }
        });
      }
    } catch (error) {
      console.error('Error fetching application:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (newStatus) => {
    if (!confirm(`Are you sure you want to mark this application as ${newStatus}?`)) {
      return;
    }

    try {
      setUpdating(true);
      const data = await apiCall(`/super-admin/applications/${applicationId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      if (data.success) {
        toast.success('Success', `Application ${newStatus} successfully!`);
        setApplication(prev => ({ ...prev, status: newStatus }));
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Error', 'Failed to update status: ' + error.message);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      applied: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      shortlisted: 'bg-blue-100 text-blue-700 border-blue-300',
      accepted: 'bg-green-100 text-green-700 border-green-300',
      hired: 'bg-green-100 text-green-700 border-green-300',
      rejected: 'bg-red-100 text-red-700 border-red-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  if (loading) {
    return <LoadingSpinner message="Loading Application Details..." />;
  }

  if (!application) {
    return (
      <DashboardLayout title="Application Not Found">
        <div className="text-center py-16">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Application not found</p>
          <button
            onClick={() => navigate('/dashboard/super-admin/applications')}
            className="mt-6 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700"
          >
            Back to Applications
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Application Details">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/dashboard/super-admin/applications')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Applications
        </button>

        <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 rounded-3xl p-8 shadow-2xl shadow-blue-500/30">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="text-white">
              <h1 className="text-3xl font-bold mb-2">Application Details</h1>
              <p className="text-blue-100 text-lg">
                {application.student?.fullName} - {application.job?.title}
              </p>
            </div>
            <div className={`px-6 py-3 rounded-xl font-semibold text-lg border-2 ${getStatusColor(application.status)}`}>
              {application.status?.charAt(0).toUpperCase() + application.status?.slice(1)}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mb-8">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
          <h3 className="font-semibold text-gray-900 mb-4">Update Application Status</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => updateApplicationStatus('shortlisted')}
              disabled={updating || application.status === 'shortlisted'}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <FileText className="w-5 h-5" />
              Shortlist
            </button>
            <button
              onClick={() => updateApplicationStatus('accepted')}
              disabled={updating || application.status === 'accepted'}
              className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Accept
            </button>
            <button
              onClick={() => updateApplicationStatus('rejected')}
              disabled={updating || application.status === 'rejected'}
              className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <XCircle className="w-5 h-5" />
              Reject
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Student Information */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                <User className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Student Information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">Full Name</label>
                <p className="text-gray-900 font-semibold">{application.student?.fullName || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">Roll Number</label>
                <p className="text-gray-900 font-semibold">{application.student?.rollNumber || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">Email</label>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <p className="text-gray-700">{application.student?.email || 'N/A'}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">Phone</label>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <p className="text-gray-700">{application.student?.phone || 'N/A'}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">Branch</label>
                <p className="text-gray-700">{application.student?.branch || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">Graduation Year</label>
                <p className="text-gray-700">{application.student?.graduationYear || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">CGPA</label>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-yellow-500" />
                  <p className="text-gray-900 font-semibold">{application.student?.cgpa || 'N/A'}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">College</label>
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-blue-500" />
                  <p className="text-gray-700">{application.college?.name || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Job Information */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Job Information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">Job Title</label>
                <p className="text-gray-900 font-semibold">{application.job?.title || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">Company</label>
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <p className="text-gray-700">{application.job?.company?.name || 'N/A'}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">Location</label>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <p className="text-gray-700">{application.job?.location || 'N/A'}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">Salary</label>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  <p className="text-gray-900 font-semibold">{application.job?.salary || 'N/A'}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">Job Type</label>
                <p className="text-gray-700">{application.job?.type || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">Applied Date</label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <p className="text-gray-700">
                    {application.appliedDate ? new Date(application.appliedDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Cover Letter */}
          {application.coverLetter && (
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Cover Letter</h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{application.coverLetter}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Resume */}
          {application.resumeUrl && (
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Resume</h3>
              <a
                href={application.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg hover:shadow-xl"
              >
                <Download className="w-5 h-5" />
                Download Resume
              </a>
            </div>
          )}

          {/* Skills & Additional Info */}
          {application.additionalInfo && (
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Additional Information</h3>
              
              {application.additionalInfo.skills && (
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-600 mb-2 block">Skills</label>
                  <div className="flex flex-wrap gap-2">
                    {application.additionalInfo.skills.map((skill, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {application.additionalInfo.experience && (
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-600 mb-1 block">Experience</label>
                  <p className="text-gray-700">{application.additionalInfo.experience}</p>
                </div>
              )}

              {application.additionalInfo.projects && (
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">Projects</label>
                  <p className="text-gray-900 font-semibold">{application.additionalInfo.projects} Projects</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ApplicationDetail;