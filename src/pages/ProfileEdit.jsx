// src/pages/ProfileEdit.jsx - COMPLETE FINAL VERSION WITH PROFILE REFRESH FIX
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../context/Profilecontext';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Save,
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
  GraduationCap,
  Briefcase,
  Code,
  Target,
  Upload,
  FileText,
  Calendar,
  Award,
  X,
  Plus,
  PenTool
} from 'lucide-react';

const ProfileEdit = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  // FIX: Added fetchProfile to the destructured values
  const { profile, updateProfile, fetchProfile, isLoading } = useProfile();
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [activeSection, setActiveSection] = useState('personal');

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
    courseInterestedIn: '', // String field for primary course interest
    interestedCourses: [], // Array of course IDs (ObjectId references)
    preferredLearningMode: '',
    availability: '',
    expectedStartDate: '',
    dailyStudyHours: '',

    // Career Goals
    careerObjective: '',
    preferredJobRole: '',
    targetCompanies: [], // Array to match backend

    // Document Uploads - Using new structure
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

    // Legacy fields for backward compatibility
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

  // File state for document uploads
  const [files, setFiles] = useState({
    resumeFile: null,
    idProofFile: null,
  });

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

        // Documents - New structure
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

  // File change handler for document uploads
  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    if (selectedFiles && selectedFiles[0]) {
      setFiles((prev) => ({
        ...prev,
        [name]: selectedFiles[0],
      }));
    }
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

  // Target company management functions
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

  // Validate that at least one document option is provided for Resume and ID Proof
  const validateDocuments = () => {
    const errors = [];

    // Validate Resume
    if (!formData.documents.resume.url && !formData.resumeUrl && !files.resumeFile) {
      errors.push('Resume is required. Please upload a file or provide a URL.');
    }

    // Validate ID Proof
    if (!formData.documents.idProof.url && !formData.idProofUrl && !files.idProofFile) {
      errors.push('Government ID Proof is required. Please upload a file or provide a URL.');
    }

    if (errors.length > 0) {
      setErrorMessage(errors.join(' '));
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    // Validate documents before submission
    if (!validateDocuments()) {
      setSaving(false);
      return;
    }

    // Validate primary skills
    if (formData.primarySkills.length === 0) {
      setErrorMessage('At least one primary skill is required.');
      setSaving(false);
      return;
    }

    try {
      // Create FormData for file uploads
      const formDataToSend = new FormData();

      // Prepare documents structure
      const documentsData = {
        resume: {
          url: formData.resumeUrl || formData.documents.resume.url || undefined,
          filename: files.resumeFile?.name || formData.documents.resume.filename || undefined
        },
        idProof: {
          url: formData.idProofUrl || formData.documents.idProof.url || undefined,
          filename: files.idProofFile?.name || formData.documents.idProof.filename || undefined
        },
        certificates: formData.documents.certificates || []
      };

      // Add all form fields
      const profileData = {
        fullName: formData.fullName,
        email: formData.email,
        mobileNumber: formData.mobileNumber,
        whatsappNumber: formData.whatsappNumber || undefined,
        alternateMobileNumber: formData.alternateMobileNumber || undefined,
        gender: formData.gender || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        address: {
          city: formData.city || undefined,
          state: formData.state || undefined,
          country: formData.country || undefined,
          pincode: formData.pincode || undefined
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
        primarySkills: formData.primarySkills,
        secondarySkills: formData.secondarySkills,
        programmingLanguages: formData.programmingLanguages,
        toolsAndTechnologies: formData.toolsAndTechnologies,
        courseInterestedIn: formData.courseInterestedIn || undefined, // String field
        interestedCourses: formData.interestedCourses, // Array field
        preferredLearningMode: formData.preferredLearningMode || undefined,
        availability: formData.availability || undefined,
        expectedStartDate: formData.expectedStartDate || undefined,
        dailyStudyHours: formData.dailyStudyHours || undefined,
        careerObjective: formData.careerObjective || undefined,
        preferredJobRole: formData.preferredJobRole || undefined,
        targetCompanies: formData.targetCompanies, // Array
        documents: documentsData, // New structured documents
        resumeUrl: formData.resumeUrl || undefined, // Legacy field
        idProofUrl: formData.idProofUrl || undefined, // Legacy field
        certificateUrls: formData.certificateUrls, // Legacy field
        preferredCommunicationMode: formData.preferredCommunicationMode || undefined,
        declaration: {
          isCorrect: formData.declarationIsCorrect,
          acceptTerms: formData.declarationAcceptTerms,
          consentDataUsage: formData.declarationConsentDataUsage,
          signature: formData.declarationSignature || undefined,
          signatureDate: formData.declarationSignature ? new Date() : undefined
        }
      };

      // Append profile data
      formDataToSend.append('profileData', JSON.stringify(profileData));

      // Append files if they exist
      if (files.resumeFile) {
        formDataToSend.append('resumeFile', files.resumeFile);
      }
      if (files.idProofFile) {
        formDataToSend.append('idProofFile', files.idProofFile);
      }

      // Update profile
      await updateProfile(formDataToSend);
      
      // FIX: Force refetch profile to ensure fresh data in context
      await fetchProfile();
      
      setSuccessMessage('Profile updated successfully!');

      setTimeout(() => {
        // FIX: Use replace: true to prevent back button from showing stale data
        navigate('/dashboard', { replace: true });
      }, 1500);
    } catch (error) {
      setErrorMessage(error.message || 'Failed to update profile');
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Complete Your Profile</h1>
          <p className="text-gray-600 mt-2">Please fill in all required information to access courses and assessments</p>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-800">{successMessage}</p>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{errorMessage}</p>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Section Navigation */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 shadow-xl border border-white/50 sticky top-8">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Sections</h3>
              <nav className="space-y-2">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        activeSection === section.id
                          ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{section.name}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Form Content */}
          <div className="flex-1">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Details Section */}
              {activeSection === 'personal' && (
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Personal Details</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        required
                        minLength={2}
                        maxLength={100}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="John Doe"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                        placeholder="john@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mobile Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="mobileNumber"
                        value={formData.mobileNumber}
                        onChange={handleChange}
                        required
                        pattern="[0-9]{10}"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="9876543210"
                      />
                      <p className="text-xs text-gray-500 mt-1">Enter 10-digit mobile number</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        WhatsApp Number
                      </label>
                      <input
                        type="tel"
                        name="whatsappNumber"
                        value={formData.whatsappNumber}
                        onChange={handleChange}
                        pattern="[0-9]{10}"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="9876543210"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Alternate Mobile Number
                      </label>
                      <input
                        type="tel"
                        name="alternateMobileNumber"
                        value={formData.alternateMobileNumber}
                        onChange={handleChange}
                        pattern="[0-9]{10}"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="9876543211"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gender <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date of Birth <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleChange}
                        required
                        max={new Date(new Date().setFullYear(new Date().getFullYear() - 16)).toISOString().split('T')[0]}
                        min={new Date(new Date().setFullYear(new Date().getFullYear() - 100)).toISOString().split('T')[0]}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">You must be between 16 and 100 years old</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Chennai"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Tamil Nadu"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Country <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="India"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pincode <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleChange}
                        required
                        pattern="[0-9]{6}"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="600001"
                      />
                      <p className="text-xs text-gray-500 mt-1">Enter 6-digit pincode</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Educational Details Section */}
              {activeSection === 'education' && (
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-lg flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-purple-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Educational Details</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Highest Qualification <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="highestQualification"
                        value={formData.highestQualification}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Qualification</option>
                        <option value="High School (10th)">High School (10th)</option>
                        <option value="Intermediate (12th)">Intermediate (12th)</option>
                        <option value="Diploma">Diploma</option>
                        <option value="Bachelor's Degree">Bachelor's Degree</option>
                        <option value="Master's Degree">Master's Degree</option>
                        <option value="PhD">PhD</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Specialization / Branch <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="specialization"
                        value={formData.specialization}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Computer Science Engineering"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        College / Institution Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="collegeName"
                        value={formData.collegeName}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="ABC Engineering College"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        University / Board <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="university"
                        value={formData.university}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Anna University"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Graduation Year <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="graduationYear"
                        value={formData.graduationYear}
                        onChange={handleChange}
                        required
                        min="1950"
                        max={new Date().getFullYear() + 5}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="2024"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CGPA / Percentage <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="cgpaOrPercentage"
                        value={formData.cgpaOrPercentage}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="8.5 CGPA or 85%"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        10th Percentage
                      </label>
                      <input
                        type="text"
                        name="tenthPercentage"
                        value={formData.tenthPercentage}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="90%"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        12th / Diploma Percentage
                      </label>
                      <input
                        type="text"
                        name="twelfthOrDiplomaPercentage"
                        value={formData.twelfthOrDiplomaPercentage}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="85%"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Professional Details Section */}
              {activeSection === 'professional' && (
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-green-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Professional Details</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Status <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="currentStatus"
                        value={formData.currentStatus}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Status</option>
                        <option value="Student">Student</option>
                        <option value="Graduate">Graduate</option>
                        <option value="Working Professional">Working Professional</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Candidate Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="candidateType"
                        value={formData.candidateType}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Type</option>
                        <option value="FRESHER">Fresher</option>
                        <option value="EXPERIENCED">Experienced</option>
                      </select>
                    </div>

                    {formData.candidateType === 'EXPERIENCED' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Years of Experience <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            name="yearsOfExperience"
                            value={formData.yearsOfExperience}
                            onChange={handleChange}
                            required
                            min="0"
                            max="50"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="3"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Previous Organization
                          </label>
                          <input
                            type="text"
                            name="previousOrganization"
                            value={formData.previousOrganization}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="ABC Corp"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Current Role / Designation
                          </label>
                          <input
                            type="text"
                            name="currentRole"
                            value={formData.currentRole}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Software Engineer"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Skills Section */}
              {activeSection === 'skills' && (
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-red-100 rounded-lg flex items-center justify-center">
                      <Code className="w-5 h-5 text-orange-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Skills & Technical Background</h2>
                  </div>

                  <div className="space-y-6">
                    {/* Primary Skills */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Primary Skills <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={newPrimarySkill}
                          onChange={(e) => setNewPrimarySkill(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addSkill('primarySkills', newPrimarySkill, setNewPrimarySkill);
                            }
                          }}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., React, Node.js, Python"
                        />
                        <button
                          type="button"
                          onClick={() => addSkill('primarySkills', newPrimarySkill, setNewPrimarySkill)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.primarySkills.map((skill, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                          >
                            {skill}
                            <button
                              type="button"
                              onClick={() => removeSkill('primarySkills', index)}
                              className="hover:text-blue-900"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </span>
                        ))}
                      </div>
                      {formData.primarySkills.length === 0 && (
                        <p className="text-xs text-red-500 mt-1">At least one primary skill is required</p>
                      )}
                    </div>

                    {/* Secondary Skills */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Secondary Skills
                      </label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={newSecondarySkill}
                          onChange={(e) => setNewSecondarySkill(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addSkill('secondarySkills', newSecondarySkill, setNewSecondarySkill);
                            }
                          }}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., Git, Docker, AWS"
                        />
                        <button
                          type="button"
                          onClick={() => addSkill('secondarySkills', newSecondarySkill, setNewSecondarySkill)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.secondarySkills.map((skill, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                          >
                            {skill}
                            <button
                              type="button"
                              onClick={() => removeSkill('secondarySkills', index)}
                              className="hover:text-green-900"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Programming Languages */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Programming Languages Known
                      </label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={newProgrammingLanguage}
                          onChange={(e) => setNewProgrammingLanguage(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addSkill('programmingLanguages', newProgrammingLanguage, setNewProgrammingLanguage);
                            }
                          }}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., JavaScript, Python, Java"
                        />
                        <button
                          type="button"
                          onClick={() => addSkill('programmingLanguages', newProgrammingLanguage, setNewProgrammingLanguage)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.programmingLanguages.map((lang, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                          >
                            {lang}
                            <button
                              type="button"
                              onClick={() => removeSkill('programmingLanguages', index)}
                              className="hover:text-purple-900"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Tools & Technologies */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tools / Technologies Familiar With
                      </label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={newTool}
                          onChange={(e) => setNewTool(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addSkill('toolsAndTechnologies', newTool, setNewTool);
                            }
                          }}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., VS Code, Postman, MongoDB"
                        />
                        <button
                          type="button"
                          onClick={() => addSkill('toolsAndTechnologies', newTool, setNewTool)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.toolsAndTechnologies.map((tool, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm"
                          >
                            {tool}
                            <button
                              type="button"
                              onClick={() => removeSkill('toolsAndTechnologies', index)}
                              className="hover:text-orange-900"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Course Preferences Section */}
              {activeSection === 'courses' && (
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-lg flex items-center justify-center">
                      <Award className="w-5 h-5 text-cyan-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Course Preference & Availability</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Course Interested In <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="courseInterestedIn"
                        value={formData.courseInterestedIn}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Full Stack Development, Data Science, AI/ML"
                      />
                      <p className="text-xs text-gray-500 mt-1">Enter the primary course you're interested in</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Preferred Learning Mode <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="preferredLearningMode"
                        value={formData.preferredLearningMode}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Mode</option>
                        <option value="ONLINE">Online</option>
                        <option value="OFFLINE">Offline</option>
                        <option value="HYBRID">Hybrid</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Availability <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="availability"
                        value={formData.availability}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Availability</option>
                        <option value="FULL_TIME">Full Time</option>
                        <option value="PART_TIME">Part Time</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expected Start Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="expectedStartDate"
                        value={formData.expectedStartDate}
                        onChange={handleChange}
                        required
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">Must be a future date</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Daily Study Hours
                      </label>
                      <input
                        type="number"
                        name="dailyStudyHours"
                        value={formData.dailyStudyHours}
                        onChange={handleChange}
                        min="1"
                        max="24"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="4"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Career Goals Section */}
              {activeSection === 'career' && (
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-pink-100 to-rose-100 rounded-lg flex items-center justify-center">
                      <Target className="w-5 h-5 text-pink-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Career Goals</h2>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Career Objective
                      </label>
                      <textarea
                        name="careerObjective"
                        value={formData.careerObjective}
                        onChange={handleChange}
                        rows={4}
                        maxLength={1000}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Describe your career goals and aspirations..."
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {formData.careerObjective.length}/1000 characters
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Preferred Job Role
                      </label>
                      <input
                        type="text"
                        name="preferredJobRole"
                        value={formData.preferredJobRole}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Full Stack Developer, Data Scientist"
                      />
                    </div>

                    {/* Target Companies - Array */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Target Companies
                      </label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={newTargetCompany}
                          onChange={(e) => setNewTargetCompany(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addTargetCompany();
                            }
                          }}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., Google, Microsoft, Amazon"
                        />
                        <button
                          type="button"
                          onClick={addTargetCompany}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.targetCompanies.map((company, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-2 px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm"
                          >
                            {company}
                            <button
                              type="button"
                              onClick={() => removeTargetCompany(index)}
                              className="hover:text-pink-900"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Add companies one at a time</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Documents Section */}
              {activeSection === 'documents' && (
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-100 to-amber-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-yellow-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Document Uploads & Communication</h2>
                  </div>

                  <div className="space-y-6">
                    {/* Resume Section */}
                    <div className="border border-gray-200 p-4 rounded-lg bg-gray-50">
                      <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        Resume <span className="text-red-500">*</span>
                        <span className="text-xs font-normal text-gray-500">(Upload file OR provide URL)</span>
                      </h3>

                      {/* Show existing resume if available */}
                      {formData.documents.resume.url && !files.resumeFile && (
                        <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm text-green-700 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Current resume: {formData.documents.resume.filename || 'Uploaded'}
                          </p>
                        </div>
                      )}

                      {/* Resume URL */}
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Resume URL
                        </label>
                        <input
                          type="url"
                          name="resumeUrl"
                          value={formData.resumeUrl}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="https://drive.google.com/your-resume"
                        />
                      </div>

                      {/* Resume File Upload */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Upload Resume File (PDF/DOC/DOCX)
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            name="resumeFile"
                            accept=".pdf,.doc,.docx"
                            onChange={handleFileChange}
                            className="w-full px-2 py-2 border border-gray-300 rounded-lg bg-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          />
                          {files.resumeFile && (
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                          )}
                        </div>
                        {files.resumeFile && (
                          <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            File selected: {files.resumeFile.name}
                          </p>
                        )}
                      </div>

                      <p className="text-xs text-gray-500 mt-2">
                        At least one option (URL or file upload) is required.
                      </p>
                    </div>

                    {/* ID Proof Section */}
                    <div className="border border-gray-200 p-4 rounded-lg bg-gray-50">
                      <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        Government ID Proof <span className="text-red-500">*</span>
                        <span className="text-xs font-normal text-gray-500">(Upload file OR provide URL)</span>
                      </h3>

                      {/* Show existing ID proof if available */}
                      {formData.documents.idProof.url && !files.idProofFile && (
                        <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm text-green-700 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Current ID proof: {formData.documents.idProof.filename || 'Uploaded'}
                          </p>
                        </div>
                      )}

                      {/* ID Proof URL */}
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          ID Proof URL
                        </label>
                        <input
                          type="url"
                          name="idProofUrl"
                          value={formData.idProofUrl}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="https://drive.google.com/your-id"
                        />
                      </div>

                      {/* ID Proof File Upload */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Upload ID Proof File (PDF/JPG/PNG)
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            name="idProofFile"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleFileChange}
                            className="w-full px-2 py-2 border border-gray-300 rounded-lg bg-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          />
                          {files.idProofFile && (
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                          )}
                        </div>
                        {files.idProofFile && (
                          <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            File selected: {files.idProofFile.name}
                          </p>
                        )}
                      </div>

                      <p className="text-xs text-gray-500 mt-2">
                        At least one option (URL or file upload) is required.
                      </p>
                    </div>

                    {/* Communication Mode */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Preferred Communication Mode <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="preferredCommunicationMode"
                        value={formData.preferredCommunicationMode}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Mode</option>
                        <option value="Email">Email</option>
                        <option value="Phone">Phone</option>
                        <option value="WhatsApp">WhatsApp</option>
                        <option value="SMS">SMS</option>
                      </select>
                    </div>

                    {/* Declaration & Consent */}
                    <div className="border-t pt-6 mt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Declaration & Consent</h3>
                      
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            name="declarationIsCorrect"
                            checked={formData.declarationIsCorrect}
                            onChange={handleChange}
                            required
                            className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label className="text-sm text-gray-700">
                            I hereby declare that all the information provided above is true and correct to the best of my knowledge. <span className="text-red-500">*</span>
                          </label>
                        </div>

                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            name="declarationAcceptTerms"
                            checked={formData.declarationAcceptTerms}
                            onChange={handleChange}
                            required
                            className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label className="text-sm text-gray-700">
                            I accept the <a href="/terms" className="text-blue-600 hover:underline">Terms & Conditions</a> of the platform. <span className="text-red-500">*</span>
                          </label>
                        </div>

                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            name="declarationConsentDataUsage"
                            checked={formData.declarationConsentDataUsage}
                            onChange={handleChange}
                            required
                            className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label className="text-sm text-gray-700">
                            I consent to the use of my data for course-related communications and improvement of services. <span className="text-red-500">*</span>
                          </label>
                        </div>

                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Digital Signature <span className="text-red-500">*</span>
                          </label>
                          <div className="flex items-center gap-3">
                            <PenTool className="w-5 h-5 text-gray-400" />
                            <input
                              type="text"
                              name="declarationSignature"
                              value={formData.declarationSignature}
                              onChange={handleChange}
                              required
                              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-signature"
                              placeholder="Type your full name as signature"
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            By typing your name, you agree to use it as your digital signature
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-4">
                {sections.findIndex(s => s.id === activeSection) > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const currentIndex = sections.findIndex(s => s.id === activeSection);
                      setActiveSection(sections[currentIndex - 1].id);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Previous
                  </button>
                )}

                {sections.findIndex(s => s.id === activeSection) < sections.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => {
                      const currentIndex = sections.findIndex(s => s.id === activeSection);
                      setActiveSection(sections[currentIndex + 1].id);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
                  >
                    Next Section
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Saving Profile...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Complete Profile
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileEdit;