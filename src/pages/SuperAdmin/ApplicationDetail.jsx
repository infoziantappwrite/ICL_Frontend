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
import SuperAdminDashboardLayout from '../../components/layout/SuperAdminDashboardLayout';

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
    return (
      <SuperAdminDashboardLayout>
        <div className="p-8 flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-[#003399] border-t-transparent rounded-full animate-spin" />
        </div>
      </SuperAdminDashboardLayout>
    );
  }

  if (!application) {
    return (
      <SuperAdminDashboardLayout>
        <div className="p-8 text-center">
          <FileText className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-500 text-lg font-medium">Application not found</p>
          <button onClick={() => navigate('/dashboard/super-admin/applications')}
            className="mt-6 px-6 py-3 bg-[#003399] text-white rounded-xl font-bold hover:bg-[#002d8b] transition-all">
            Go to Applications List
          </button>
        </div>
      </SuperAdminDashboardLayout>
    );
  }

  return (
    <SuperAdminDashboardLayout>
      <div className="px-6 py-4 md:px-8 md:py-6 font-sans space-y-5">

        {/* Header */}
        <div className="mb-2">




          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span className="w-2 h-8 bg-gradient-to-b from-[#003399] to-[#00A9CE] rounded-full" />
            Application Details
          </h1>
          <p className="text-sm text-slate-400 font-medium mt-1">
            {application.student?.fullName} — {application.job?.title}
          </p>
        </div>

        {/* Status + Update Actions */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <h3 className="text-sm font-black text-slate-800">Application Status</h3>
            <span className={`px-3 py-1.5 rounded-lg font-black text-xs border ${getStatusColor(application.status)}`}>
              {application.status?.charAt(0).toUpperCase() + application.status?.slice(1)}
            </span>
          </div>
          <p className="text-xs font-bold text-slate-500 mb-3">Update Status</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => updateApplicationStatus('shortlisted')} disabled={updating || application.status === 'shortlisted'}
              className="px-4 py-2 bg-[#003399] text-white rounded-xl text-xs font-black hover:bg-[#002d8b] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Shortlist
            </button>
            <button onClick={() => updateApplicationStatus('accepted')} disabled={updating || application.status === 'accepted'}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" /> Accept
            </button>
            <button onClick={() => updateApplicationStatus('rejected')} disabled={updating || application.status === 'rejected'}
              className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-black hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5" /> Reject
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-5">

            {/* Student Info */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{background:'linear-gradient(135deg,#003399,#00A9CE)'}}>
                  <User className="w-3.5 h-3.5 text-white" />
                </div>
                <h3 className="text-sm font-black text-slate-800">Student Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[
                  {label:'Full Name', value: application.student?.fullName},
                  {label:'Roll Number', value: application.student?.rollNumber},
                  {label:'Email', value: application.student?.email, icon: Mail},
                  {label:'Phone', value: application.student?.phone, icon: Phone},
                  {label:'Branch', value: application.student?.branch},
                  {label:'Graduation Year', value: application.student?.graduationYear},
                  {label:'CGPA', value: application.student?.cgpa, icon: Award},
                  {label:'College', value: application.college?.name, icon: GraduationCap},
                ].map(({label, value, icon: Icon}) => (
                  <div key={label}>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">{label}</p>
                    <div className="flex items-center gap-1.5">
                      {Icon && <Icon className="w-3.5 h-3.5 text-slate-400" />}
                      <p className="text-sm font-semibold text-slate-800">{value || 'N/A'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Job Info */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{background:'linear-gradient(135deg,#003399,#00A9CE)'}}>
                  <Briefcase className="w-3.5 h-3.5 text-white" />
                </div>
                <h3 className="text-sm font-black text-slate-800">Job Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[
                  {label:'Job Title', value: application.job?.title},
                  {label:'Company', value: application.job?.company?.name, icon: Building2},
                  {label:'Location', value: application.job?.location, icon: MapPin},
                  {label:'Salary', value: application.job?.salary, icon: DollarSign},
                  {label:'Job Type', value: application.job?.type},
                  {label:'Applied Date', value: application.appliedDate ? new Date(application.appliedDate).toLocaleDateString() : null, icon: Calendar},
                ].map(({label, value, icon: Icon}) => (
                  <div key={label}>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">{label}</p>
                    <div className="flex items-center gap-1.5">
                      {Icon && <Icon className="w-3.5 h-3.5 text-slate-400" />}
                      <p className="text-sm font-semibold text-slate-800">{value || 'N/A'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cover Letter */}
            {application.coverLetter && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <h3 className="text-sm font-black text-slate-800 mb-3">Cover Letter</h3>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{application.coverLetter}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Resume */}
            {application.resumeUrl && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <h3 className="text-sm font-black text-slate-800 mb-3">Resume</h3>
                <a href={application.resumeUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#003399] text-white rounded-xl text-xs font-black hover:bg-[#002d8b] transition-all">
                  <Download className="w-3.5 h-3.5" /> Download Resume
                </a>
              </div>
            )}

            {/* Additional Info */}
            {application.additionalInfo && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <h3 className="text-sm font-black text-slate-800 mb-4">Additional Information</h3>
                {application.additionalInfo.skills && (
                  <div className="mb-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {application.additionalInfo.skills.map((skill, index) => (
                        <span key={index} className="px-2.5 py-1 bg-[#003399]/5 text-[#003399] border border-[#003399]/10 rounded-full text-xs font-bold">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {application.additionalInfo.experience && (
                  <div className="mb-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Experience</p>
                    <p className="text-sm text-slate-700">{application.additionalInfo.experience}</p>
                  </div>
                )}
                {application.additionalInfo.projects && (
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Projects</p>
                    <p className="text-sm font-black text-slate-800">{application.additionalInfo.projects} Projects</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </SuperAdminDashboardLayout>
  );
};

export default ApplicationDetail;
