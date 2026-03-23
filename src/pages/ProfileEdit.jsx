// src/pages/ProfileEdit.jsx - FLEXIBLE VERSION (No Required Fields)
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useProfile } from '../context/Profilecontext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import StudentLayout from '../components/layout/StudentLayout';
import {
  User,
  Loader2,
  GraduationCap,
  Briefcase,
  Code,
  Target,
  Award,
  FileText,
  Save,
  CheckCircle
} from 'lucide-react';

// Import Components
import SectionNavigation from '../components/profile/SectionNavigation';
import AlertMessage from '../components/profile/shared/AlertMessage';
import NavigationButtons from '../components/profile/shared/NavigationButtons';
import PersonalDetailsForm from '../components/profile/forms/PersonalDetailsForm';
import EducationForm from '../components/profile/forms/EducationForm';
import ProfessionalForm from '../components/profile/forms/ProfessionalForm';
import SkillsForm from '../components/profile/forms/SkillsForm';
import CoursePreferencesForm from '../components/profile/forms/CoursePreferencesForm';
import CareerGoalsForm from '../components/profile/forms/CareerGoalsForm';
import DocumentsForm from '../components/profile/forms/DocumentsForm';

const ProfileEdit = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const toast = useToast();
  const { profile, updateProfile, fetchProfile, isLoading } = useProfile();
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [activeSection, setActiveSection] = useState('personal');

  // Check if this is first-time profile creation
  const isFirstTime = location.state?.isFirstTime || false;

  // Form state
  const [formData, setFormData] = useState({
    // Personal Details
    fullName: '',
    email: '',
    mobileNumber: '',
    whatsappNumber: '',
    alternateMobileNumber: '',
    gender: '',
    dateOfBirth: '',
    city: '',
    state: '',
    country: '',
    pincode: '',

    // Educational Details
    highestQualification: '',
    specialization: '',
    collegeName: '',
    university: '',
    graduationYear: '',
    cgpaOrPercentage: '',
    tenthPercentage: '',
    twelfthOrDiplomaPercentage: '',

    // Professional Details
    currentStatus: '',
    candidateType: '',
    yearsOfExperience: 0,
    previousOrganization: '',
    currentRole: '',

    // Skills & Technical Background
    primarySkills: [],
    secondarySkills: [],
    programmingLanguages: [],
    toolsAndTechnologies: [],

    // Course Preference & Availability
    courseInterestedIn: '',
    interestedCourses: [],
    preferredLearningMode: '',
    availability: '',
    expectedStartDate: '',
    dailyStudyHours: '',

    // Career Goals
    careerObjective: '',
    preferredJobRole: '',
    targetCompanies: [],

    // Document Uploads
    documents: {
      resume: {
        filename: '',
        url: '',
        uploadedAt: null
      },
      idProof: {
        filename: '',
        url: '',
        uploadedAt: null
      },
      certificates: []
    },

    // Legacy fields
    resumeUrl: '',
    idProofUrl: '',
    certificateUrls: [],

    // Communication Preference
    preferredCommunicationMode: '',

    // Declaration & Consent
    declarationIsCorrect: false,
    declarationAcceptTerms: false,
    declarationConsentDataUsage: false,
    declarationSignature: ''
  });

  // File state no longer needed here — uploads happen inside DocumentsForm directly

  // Temporary input states for adding skills and companies
  const [newPrimarySkill, setNewPrimarySkill] = useState('');
  const [newSecondarySkill, setNewSecondarySkill] = useState('');
  const [newProgrammingLanguage, setNewProgrammingLanguage] = useState('');
  const [newTool, setNewTool] = useState('');
  const [newTargetCompany, setNewTargetCompany] = useState('');

  // Load profile data when component mounts
  useEffect(() => {
    if (profile) {
      setFormData({
        // Personal Details
        fullName: profile.fullName || '',
        email: profile.email || user?.email || '',
        mobileNumber: profile.mobileNumber || '',
        whatsappNumber: profile.whatsappNumber || '',
        alternateMobileNumber: profile.alternateMobileNumber || '',
        gender: profile.gender || '',
        dateOfBirth: profile.dateOfBirth
          ? new Date(profile.dateOfBirth).toISOString().split('T')[0]
          : '',
        city: profile.address?.city || '',
        state: profile.address?.state || '',
        country: profile.address?.country || '',
        pincode: profile.address?.pincode || '',

        // Educational Details
        highestQualification: profile.highestQualification || '',
        specialization: profile.specialization || '',
        collegeName: profile.collegeName || '',
        university: profile.university || '',
        graduationYear: profile.graduationYear || '',
        cgpaOrPercentage: profile.cgpaOrPercentage || '',
        tenthPercentage: profile.tenthPercentage || '',
        twelfthOrDiplomaPercentage: profile.twelfthOrDiplomaPercentage || '',

        // Professional Details
        currentStatus: profile.currentStatus || '',
        candidateType: profile.candidateType || '',
        yearsOfExperience: profile.yearsOfExperience || 0,
        previousOrganization: profile.previousOrganization || '',
        currentRole: profile.currentRole || '',

        // Skills
        primarySkills: profile.primarySkills || [],
        secondarySkills: profile.secondarySkills || [],
        programmingLanguages: profile.programmingLanguages || [],
        toolsAndTechnologies: profile.toolsAndTechnologies || [],

        // Course Preferences
        courseInterestedIn: profile.courseInterestedIn || '',
        interestedCourses: profile.interestedCourses || [],
        preferredLearningMode: profile.preferredLearningMode || '',
        availability: profile.availability || '',
        expectedStartDate: profile.expectedStartDate
          ? new Date(profile.expectedStartDate).toISOString().split('T')[0]
          : '',
        dailyStudyHours: profile.dailyStudyHours || '',

        // Career Goals
        careerObjective: profile.careerObjective || '',
        preferredJobRole: profile.preferredJobRole || '',
        targetCompanies: Array.isArray(profile.targetCompanies) 
          ? profile.targetCompanies 
          : (profile.targetCompanies ? [profile.targetCompanies] : []),

        // Documents
        documents: {
          resume: {
            filename: profile.documents?.resume?.filename || '',
            url: profile.documents?.resume?.url || profile.resumeUrl || '',
            uploadedAt: profile.documents?.resume?.uploadedAt || null
          },
          idProof: {
            filename: profile.documents?.idProof?.filename || '',
            url: profile.documents?.idProof?.url || profile.idProofUrl || '',
            uploadedAt: profile.documents?.idProof?.uploadedAt || null
          },
          certificates: profile.documents?.certificates || []
        },

        // Legacy fields
        resumeUrl: profile.resumeUrl || profile.documents?.resume?.url || '',
        idProofUrl: profile.idProofUrl || profile.documents?.idProof?.url || '',
        certificateUrls: profile.certificateUrls || [],

        // Communication
        preferredCommunicationMode: profile.preferredCommunicationMode || '',

        // Declarations
        declarationIsCorrect: profile.declaration?.isCorrect || false,
        declarationAcceptTerms: profile.declaration?.acceptTerms || false,
        declarationConsentDataUsage: profile.declaration?.consentDataUsage || false,
        declarationSignature: profile.declaration?.signature || ''
      });
    }
  }, [profile, user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Skill management functions
  const addSkill = (type, value, setValue) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [type]: [...prev[type], value.trim()]
      }));
      setValue('');
    }
  };

  const removeSkill = (type, index) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  // Target company management
  const addTargetCompany = () => {
    if (newTargetCompany.trim()) {
      setFormData(prev => ({
        ...prev,
        targetCompanies: [...prev.targetCompanies, newTargetCompany.trim()]
      }));
      setNewTargetCompany('');
    }
  };

  const removeTargetCompany = (index) => {
    setFormData(prev => ({
      ...prev,
      targetCompanies: prev.targetCompanies.filter((_, i) => i !== index)
    }));
  };

  // Called by DocumentsForm when a file is successfully uploaded (or removed)
  const handleDocumentUploaded = (docType, url, filename) => {
    setFormData(prev => ({
      ...prev,
      // Update the nested documents object
      documents: {
        ...prev.documents,
        [docType]: {
          ...prev.documents[docType],
          url: url || '',
          filename: filename || '',
          uploadedAt: url ? new Date().toISOString() : null,
        },
      },
      // Keep legacy flat fields in sync
      ...(docType === 'resume' ? { resumeUrl: url || '' } : {}),
      ...(docType === 'idProof' ? { idProofUrl: url || '' } : {}),
    }));
  };

  // ⚠️ REMOVED: validateDocuments() - No longer required
  // ⚠️ REMOVED: Primary skills validation - No longer required
  
  // Save handler with option to stay on page or go to dashboard
  const handleSave = async (redirectToDashboard = false) => {
    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      // Files are already uploaded via DocumentsForm — just send the profile JSON
      const documentsData = {
        resume: {
          url: formData.documents?.resume?.url || formData.resumeUrl || undefined,
          filename: formData.documents?.resume?.filename || undefined,
          uploadedAt: formData.documents?.resume?.uploadedAt || undefined,
        },
        idProof: {
          url: formData.documents?.idProof?.url || formData.idProofUrl || undefined,
          filename: formData.documents?.idProof?.filename || undefined,
          uploadedAt: formData.documents?.idProof?.uploadedAt || undefined,
        },
        certificates: formData.documents?.certificates || [],
      };

      const profileData = {
        fullName: formData.fullName || undefined,
        email: formData.email || user?.email,
        mobileNumber: formData.mobileNumber || undefined,
        whatsappNumber: formData.whatsappNumber || undefined,
        alternateMobileNumber: formData.alternateMobileNumber || undefined,
        gender: formData.gender || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        address: {
          city: formData.city || undefined,
          state: formData.state || undefined,
          country: formData.country || undefined,
          pincode: formData.pincode || undefined,
        },
        highestQualification: formData.highestQualification || undefined,
        specialization: formData.specialization || undefined,
        collegeName: formData.collegeName || undefined,
        university: formData.university || undefined,
        graduationYear: formData.graduationYear ? parseInt(formData.graduationYear) : undefined,
        cgpaOrPercentage: formData.cgpaOrPercentage || undefined,
        tenthPercentage: formData.tenthPercentage || undefined,
        twelfthOrDiplomaPercentage: formData.twelfthOrDiplomaPercentage || undefined,
        currentStatus: formData.currentStatus || undefined,
        candidateType: formData.candidateType || undefined,
        yearsOfExperience: parseInt(formData.yearsOfExperience) || 0,
        previousOrganization: formData.previousOrganization || undefined,
        currentRole: formData.currentRole || undefined,
        primarySkills: formData.primarySkills || [],
        secondarySkills: formData.secondarySkills || [],
        programmingLanguages: formData.programmingLanguages || [],
        toolsAndTechnologies: formData.toolsAndTechnologies || [],
        courseInterestedIn: formData.courseInterestedIn || undefined,
        interestedCourses: formData.interestedCourses || [],
        preferredLearningMode: formData.preferredLearningMode || undefined,
        availability: formData.availability || undefined,
        expectedStartDate: formData.expectedStartDate || undefined,
        dailyStudyHours: formData.dailyStudyHours || undefined,
        careerObjective: formData.careerObjective || undefined,
        preferredJobRole: formData.preferredJobRole || undefined,
        targetCompanies: formData.targetCompanies || [],
        documents: documentsData,
        resumeUrl: formData.resumeUrl || undefined,
        idProofUrl: formData.idProofUrl || undefined,
        certificateUrls: formData.certificateUrls || [],
        preferredCommunicationMode: formData.preferredCommunicationMode || undefined,
        declaration: {
          isCorrect: formData.declarationIsCorrect,
          acceptTerms: formData.declarationAcceptTerms,
          consentDataUsage: formData.declarationConsentDataUsage,
          signature: formData.declarationSignature || undefined,
        },
      };

      // Send as plain JSON — no files to attach (already uploaded)
      const response = await updateProfile(profileData);

      if (response.success) {
        if (redirectToDashboard) {
          setSuccessMessage('Profile saved successfully! Redirecting to dashboard...');
          toast.success('Profile Saved!', 'Redirecting to your dashboard...');
          await fetchProfile();
          setTimeout(() => {
            navigate('/dashboard/student', { replace: true });
          }, 1500);
        } else {
          setSuccessMessage('Profile saved successfully! You can continue editing or go back to dashboard.');
          toast.success('Profile Saved!', 'Your changes have been saved successfully.');
          await fetchProfile();
          // Clear the success message after 5 seconds
          setTimeout(() => {
            setSuccessMessage('');
          }, 5000);
        }
      } else {
        setErrorMessage(response.message || 'Failed to save profile');
        toast.error('Save Failed', response.message || 'Could not save your profile. Please try again.');
      }
    } catch (error) {
      setErrorMessage(error.message || 'Failed to save profile');
      toast.error('Save Failed', error.message || 'Something went wrong. Please try again.');
      console.error('Error saving profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await handleSave(false); // Save and stay on page
  };

  if (isLoading && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
          <p className="mt-4 text-gray-700">Loading profile...</p>
        </div>
      </div>
    );
  }

  const sections = [
    { id: 'personal', name: 'Personal Details', icon: User },
    { id: 'education', name: 'Education', icon: GraduationCap },
    { id: 'professional', name: 'Professional', icon: Briefcase },
    { id: 'skills', name: 'Skills', icon: Code },
    { id: 'courses', name: 'Course Preferences', icon: Award },
    { id: 'career', name: 'Career Goals', icon: Target },
    { id: 'documents', name: 'Documents', icon: FileText }
  ];

  const currentIndex = sections.findIndex(s => s.id === activeSection);

  const handleNext = () => {
    if (currentIndex < sections.length - 1) {
      setActiveSection(sections[currentIndex + 1].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setActiveSection(sections[currentIndex - 1].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <StudentLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {isFirstTime ? 'Create Your Profile' : 'Edit Your Profile'}
              </h1>
              <p className="text-gray-600 mt-2">
                Fill in the fields you want. All fields are optional - you can update them anytime.
              </p>
            </div>
            
            {/* Quick Save Buttons */}
            <div className="hidden lg:flex gap-3">
              <button
                type="button"
                onClick={() => handleSave(false)}
                disabled={saving}
                className="px-4 py-2 bg-white border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => handleSave(true)}
                disabled={saving}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle className="w-4 h-4" />
                Save & Go to Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        <AlertMessage type="success" message={successMessage} />
        <AlertMessage type="error" message={errorMessage} />

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Section Navigation */}
          <SectionNavigation
            sections={sections}
            activeSection={activeSection}
            onSectionChange={setActiveSection}
          />

          {/* Form Content */}
          <div className="flex-1">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Details Section */}
              {activeSection === 'personal' && (
                <PersonalDetailsForm 
                  formData={formData} 
                  handleChange={handleChange} 
                />
              )}

              {/* Educational Details Section */}
              {activeSection === 'education' && (
                <EducationForm 
                  formData={formData} 
                  handleChange={handleChange} 
                />
              )}

              {/* Professional Details Section */}
              {activeSection === 'professional' && (
                <ProfessionalForm 
                  formData={formData} 
                  handleChange={handleChange} 
                />
              )}

              {/* Skills Section */}
              {activeSection === 'skills' && (
                <SkillsForm
                  formData={formData}
                  newPrimarySkill={newPrimarySkill}
                  setNewPrimarySkill={setNewPrimarySkill}
                  newSecondarySkill={newSecondarySkill}
                  setNewSecondarySkill={setNewSecondarySkill}
                  newProgrammingLanguage={newProgrammingLanguage}
                  setNewProgrammingLanguage={setNewProgrammingLanguage}
                  newTool={newTool}
                  setNewTool={setNewTool}
                  addSkill={addSkill}
                  removeSkill={removeSkill}
                />
              )}

              {/* Course Preferences Section */}
              {activeSection === 'courses' && (
                <CoursePreferencesForm 
                  formData={formData} 
                  handleChange={handleChange} 
                />
              )}

              {/* Career Goals Section */}
              {activeSection === 'career' && (
                <CareerGoalsForm
                  formData={formData}
                  handleChange={handleChange}
                  newTargetCompany={newTargetCompany}
                  setNewTargetCompany={setNewTargetCompany}
                  addTargetCompany={addTargetCompany}
                  removeTargetCompany={removeTargetCompany}
                />
              )}

              {/* Documents Section */}
              {activeSection === 'documents' && (
                <DocumentsForm
                  formData={formData}
                  handleChange={handleChange}
                  onDocumentUploaded={handleDocumentUploaded}
                />
              )}

              {/* Mobile Save Buttons */}
              <div className="lg:hidden space-y-3 mt-6">
                <button
                  type="button"
                  onClick={() => handleSave(false)}
                  disabled={saving}
                  className="w-full px-4 py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-5 h-5" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => handleSave(true)}
                  disabled={saving}
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle className="w-5 h-5" />
                  Save & Go to Dashboard
                </button>
              </div>

              {/* Navigation Buttons */}
              <NavigationButtons
                currentIndex={currentIndex}
                totalSections={sections.length}
                onPrevious={handlePrevious}
                onNext={handleNext}
                saving={saving}
              />
            </form>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};

export default ProfileEdit;