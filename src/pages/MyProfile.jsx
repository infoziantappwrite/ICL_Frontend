// src/pages/MyProfile.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../context/Profilecontext';
import { useAuth } from '../context/AuthContext';
import StudentLayout from '../components/layout/StudentLayout';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  GraduationCap,
  Code,
  Edit,
  Shield,
  CheckCircle,
  Clock,
  Target,
  Award
} from 'lucide-react';
 
const MyProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, profileCompleteness } = useProfile();
 
  // Helper function to get user's display name
  const getUserName = () => {
    if (profile?.fullName) return profile.fullName;
    if (user?.fullName) return user.fullName;
    if (user?.name) return user.name;
    return 'User';
  };
 
  // Helper function to get initials
  const getUserInitials = () => {
    const fullName = getUserName();
    const names = fullName.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  };
 
  // Helper function to get user role
  const getUserRole = () => {
    if (user?.role) {
      return user.role.charAt(0).toUpperCase() + user.role.slice(1);
    }
    return 'Candidate';
  };
 
  // Helper function to get status badge color
  const getStatusColor = () => {
    if (user?.isActive) return 'bg-green-100 text-green-700';
    return 'bg-gray-100 text-gray-700';
  };
 
  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
 
  return (
    <StudentLayout title="My Profile">
      {/* Profile Header Card */}
      <div className="max-w-5xl mx-auto">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl shadow-blue-500/10 border border-white/50 overflow-hidden mb-8">
          {/* Cover/Banner */}
          <div className="h-32 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 relative">
            <div className="absolute inset-0 opacity-10" style={{backgroundImage:'linear-gradient(to right, rgb(255 255 255 / 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgb(255 255 255 / 0.1) 1px, transparent 1px)', backgroundSize:'20px 20px'}}></div>
          </div>
 
          {/* Profile Info */}
          <div className="relative px-6 pb-6">
            {/* Avatar */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between -mt-16 mb-4">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center shadow-2xl border-4 border-white">
                  <span className="text-white font-bold text-4xl">{getUserInitials()}</span>
                </div>
                <div className="text-center sm:text-left mb-4 sm:mb-0">
                  <h1 className="text-3xl font-bold text-gray-900">{getUserName()}</h1>
                  <p className="text-gray-600 mt-1">{profile?.email || user?.email}</p>
                  <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
                    <div className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      <Shield className="w-3 h-3" />
                      {getUserRole()}
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
                      {user?.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                </div>
              </div>
 
              {/* Edit Profile Button + Completeness */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/profile/edit')}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit Profile
                </button>
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-100">
                  <div className="text-center">
                    <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                      {profileCompleteness}%
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Profile Complete</p>
                  </div>
                </div>
              </div>
            </div>
 
            {/* Bio/Summary */}
            {profile?.careerObjective && (
              <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">About Me</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{profile.careerObjective}</p>
              </div>
            )}
          </div>
        </div>
 
        {/* Profile Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <InfoCard title="Personal Information" icon={User}>
            <InfoRow label="Full Name" value={getUserName()} />
            <InfoRow
              label="Date of Birth"
              value={profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'Not specified'}
            />
            <InfoRow label="Gender" value={profile?.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : 'Not specified'} />
          </InfoCard>
 
          {/* Contact Information */}
          <InfoCard title="Contact Information" icon={Phone}>
            <InfoRow label="Email" value={profile?.email || user?.email} icon={Mail} />
            <InfoRow label="Mobile" value={profile?.mobileNumber || 'Not specified'} icon={Phone} />
            {profile?.whatsappNumber && (
              <InfoRow label="WhatsApp" value={profile.whatsappNumber} icon={Phone} />
            )}
            {profile?.address?.city && (
              <InfoRow
                label="Location"
                value={`${profile.address.city}, ${profile.address.state}, ${profile.address.country}`}
                icon={MapPin}
              />
            )}
          </InfoCard>
 
          {/* Educational Details */}
          <InfoCard title="Educational Background" icon={GraduationCap}>
            <InfoRow
              label="Highest Qualification"
              value={profile?.highestQualification ? profile.highestQualification.toUpperCase() : 'Not specified'}
            />
            <InfoRow label="Specialization" value={profile?.specialization || 'Not specified'} />
            <InfoRow label="Institution" value={profile?.collegeName || 'Not specified'} />
            <InfoRow label="University" value={profile?.university || 'Not specified'} />
            <InfoRow
              label="Graduation Year"
              value={profile?.graduationYear || 'Not specified'}
            />
            <InfoRow label="CGPA/Percentage" value={profile?.cgpaOrPercentage || 'Not specified'} />
          </InfoCard>
 
          {/* Professional Details */}
          <InfoCard title="Professional Information" icon={Briefcase}>
            <InfoRow label="Candidate Type" value={profile?.candidateType || 'Not specified'} />
            <InfoRow label="Current Status" value={profile?.currentStatus?.replace('-', ' ') || 'Not specified'} />
            {profile?.candidateType === 'EXPERIENCED' && (
              <>
                <InfoRow label="Experience" value={`${profile?.yearsOfExperience || 0} years`} />
                <InfoRow label="Current Role" value={profile?.currentRole || 'Not specified'} />
                <InfoRow label="Previous Organization" value={profile?.previousOrganization || 'Not specified'} />
              </>
            )}
          </InfoCard>
 
          {/* Skills */}
          <InfoCard title="Skills & Expertise" icon={Code}>
            {profile?.primarySkills && profile.primarySkills.length > 0 ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Primary Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.primarySkills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                {profile?.programmingLanguages && profile.programmingLanguages.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Programming Languages</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.programmingLanguages.map((lang, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                        >
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No skills added yet</p>
            )}
          </InfoCard>
 
          {/* Career Goals */}
          <InfoCard title="Career Goals & Preferences" icon={Target}>
            <InfoRow label="Preferred Role" value={profile?.preferredJobRole || 'Not specified'} />
            <InfoRow label="Target Companies" value={profile?.targetCompanies || 'Not specified'} />
            {profile?.preferredLearningMode && (
              <InfoRow
                label="Learning Mode"
                value={profile.preferredLearningMode.replace('_', ' ')}
              />
            )}
            {profile?.availability && (
              <InfoRow
                label="Availability"
                value={profile.availability.replace('_', ' ')}
              />
            )}
          </InfoCard>
 
          {/* Account Information */}
          <InfoCard title="Account Information" icon={Clock} fullWidth>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow
                label="Created At"
                value={formatDate(user?.createdAt)}
                icon={Calendar}
              />
              <InfoRow
                label="Last Updated"
                value={formatDate(user?.updatedAt)}
                icon={Clock}
              />
            </div>
          </InfoCard>
 
          {/* Permissions */}
          {user?.role === 'admin' && (
            <InfoCard title="Permissions" icon={Award} fullWidth>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <PermissionBadge label="Create Assessments" allowed={true} />
                <PermissionBadge label="Assign Tests" allowed={true} />
                <PermissionBadge label="View Analytics" allowed={true} />
                <PermissionBadge label="Export Reports" allowed={true} />
              </div>
            </InfoCard>
          )}
        </div>
      </div>
    </StudentLayout>
  );
};
 
// Reusable Components
const InfoCard = ({ title, icon: Icon, children, fullWidth = false }) => (
  <div className={`bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl shadow-blue-500/10 border border-white/50 ${fullWidth ? 'lg:col-span-2' : ''}`}>
    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
      <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg flex items-center justify-center">
        <Icon className="w-5 h-5 text-blue-600" />
      </div>
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
    </div>
    <div className="space-y-3">
      {children}
    </div>
  </div>
);
 
const InfoRow = ({ label, value, icon: Icon }) => (
  <div className="flex items-start justify-between py-2 border-b border-gray-50 last:border-0">
    <div className="flex items-center gap-2">
      {Icon && <Icon className="w-4 h-4 text-gray-400" />}
      <span className="text-sm font-medium text-gray-600">{label}:</span>
    </div>
    <span className="text-sm text-gray-900 font-medium text-right max-w-[60%] capitalize">
      {value || 'Not specified'}
    </span>
  </div>
);
 
const PermissionBadge = ({ label, allowed }) => (
  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
    <CheckCircle className={`w-4 h-4 ${allowed ? 'text-green-600' : 'text-gray-400'}`} />
    <div>
      <p className="text-xs text-gray-600">{label}</p>
      <p className={`text-xs font-medium ${allowed ? 'text-green-600' : 'text-gray-500'}`}>
        {allowed ? 'Yes' : 'No'}
      </p>
    </div>
  </div>
);
 
export default MyProfile;