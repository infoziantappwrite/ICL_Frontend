// src/api/Api.js - COMPLETE FIX with comprehensive logging and error handling
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function to handle API calls with better error handling
const apiCall = async (endpoint, options = {}) => {
  const url = `${API_URL}${endpoint}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Add auth token if available
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    console.log(`📡 API Call: ${options.method || 'GET'} ${endpoint}`);
    const response = await fetch(url, config);
    
    console.log(`📥 Response: ${response.status} ${response.statusText}`);
    
    // Parse response
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { message: text };
    }

    if (!response.ok) {
      console.error(`❌ API Error ${response.status}:`, data);
      throw new Error(data.message || data.error || `Error: ${response.status}`);
    }

    console.log('✅ API Success:', data);
    return data;
  } catch (error) {
    console.error('❌ API Call Failed:', error);
    throw error;
  }
};

// Verify authentication token
const verifyAuth = async () => {
  const token = localStorage.getItem('authToken');
  
  if (!token) {
    console.error('❌ No auth token found in localStorage');
    return { valid: false, error: 'No token' };
  }

  try {
    console.log('🔍 Verifying authentication token...');
    const response = await fetch(`${API_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Auth valid - User:', data.user?.email, 'Role:', data.user?.role);
      return { valid: true, user: data.user };
    } else {
      const errorData = await response.json();
      console.error('❌ Auth invalid:', response.status, errorData);
      return { valid: false, error: errorData.message, status: response.status };
    }
  } catch (error) {
    console.error('❌ Auth verification failed:', error);
    return { valid: false, error: error.message };
  }
};

// Authentication API calls
export const authAPI = {
  login: async (email, password) => {
    return apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  signup: async (userData) => {
    return apiCall('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  verifyOtp: async (email, otp) => {
    return apiCall('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  },

  resendOtp: async (email) => {
    return apiCall('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  getMe: async () => {
    return apiCall('/auth/me');
  },

  forgotPassword: async (email) => {
    return apiCall('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  resetPassword: async (token, newPassword) => {
    return apiCall('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  },

  updatePassword: async (currentPassword, newPassword) => {
    return apiCall('/auth/update-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    console.log('🚪 Logged out - cleared auth data');
  },
};

// ==========================================
// CANDIDATE PROFILE API - FULLY FIXED
// ==========================================
export const profileAPI = {
  // Get profile with auth verification
  getProfile: async () => {
    console.log('📄 Getting user profile...');
    
    // Verify auth first
    const authCheck = await verifyAuth();
    if (!authCheck.valid) {
      throw new Error(`Authentication failed: ${authCheck.error}`);
    }
    
    return apiCall('/candidate/profile');
  },

  // Create or update full profile with comprehensive error handling
  createOrUpdateProfile: async (profileDataOrFormData) => {
    try {
      console.log('🚀 Starting profile save process...');
      console.log('═══════════════════════════════════════');
      
      let profileData;
      let resumeFile = null;
      let idProofFile = null;

      // Check if it's FormData (from ProfileEdit.jsx)
      if (profileDataOrFormData instanceof FormData) {
        console.log('📦 Processing FormData...');
        // Extract profile data JSON
        const profileDataString = profileDataOrFormData.get('profileData');
        profileData = JSON.parse(profileDataString);
        
        // Extract files
        resumeFile = profileDataOrFormData.get('resumeFile');
        idProofFile = profileDataOrFormData.get('idProofFile');
        
        console.log('📋 Profile data extracted');
        console.log('📄 Resume file:', resumeFile ? resumeFile.name : 'None');
        console.log('🆔 ID proof file:', idProofFile ? idProofFile.name : 'None');
      } else {
        // Direct JSON object
        profileData = profileDataOrFormData;
        console.log('📋 Using direct profile data object');
      }

      // Verify authentication before proceeding
      console.log('\n🔐 STEP 0: Verifying authentication...');
      const authCheck = await verifyAuth();
      
      if (!authCheck.valid) {
        console.error('❌ Authentication failed:', authCheck.error);
        throw new Error(`Please log in again. ${authCheck.error}`);
      }
      
      console.log('✅ Authentication verified');
      const token = localStorage.getItem('authToken');

      // Step 1: Upload resume file if provided
      if (resumeFile) {
        console.log('\n📤 STEP 1: Uploading resume...');
        const resumeFormData = new FormData();
        resumeFormData.append('resume', resumeFile);

        const resumeResponse = await fetch(`${API_URL}/upload/resume`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: resumeFormData,
        });

        console.log('📥 Resume upload response:', resumeResponse.status);

        const resumeData = await resumeResponse.json();
        if (!resumeResponse.ok) {
          console.error('❌ Resume upload failed:', resumeData);
          throw new Error(resumeData.message || 'Resume upload failed');
        }

        // Update profile data with resume URL
        profileData.resumeUrl = resumeData.file.url;
        console.log('✅ Resume uploaded:', resumeData.file.url);
      } else {
        console.log('\n⏭️  STEP 1: No resume to upload');
      }

      // Step 2: Upload ID proof file if provided
      if (idProofFile) {
        console.log('\n📤 STEP 2: Uploading ID proof...');
        const idProofFormData = new FormData();
        idProofFormData.append('document', idProofFile);

        const idProofResponse = await fetch(`${API_URL}/upload/document/id-proof`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: idProofFormData,
        });

        console.log('📥 ID proof upload response:', idProofResponse.status);

        const idProofData = await idProofResponse.json();
        if (!idProofResponse.ok) {
          console.error('❌ ID proof upload failed:', idProofData);
          throw new Error(idProofData.message || 'ID proof upload failed');
        }

        // Update profile data with ID proof URL
        profileData.idProofUrl = idProofData.file.url;
        console.log('✅ ID proof uploaded:', idProofData.file.url);
      } else {
        console.log('\n⏭️  STEP 2: No ID proof to upload');
      }

      // Step 3: Determine POST vs PUT using direct fetch with detailed error handling
      console.log('\n🔍 STEP 3: Checking if profile exists...');
      let method = 'POST'; // Default to create
      let profileExists = false;

      try {
        const checkResponse = await fetch(`${API_URL}/candidate/profile`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        console.log('📥 Profile check status:', checkResponse.status, checkResponse.statusText);

        if (checkResponse.status === 404) {
          // Profile doesn't exist - this is EXPECTED for new users
          console.log('ℹ️  Profile not found (404) - will CREATE new profile with POST');
          method = 'POST';
          profileExists = false;
        } else if (checkResponse.status === 401 || checkResponse.status === 403) {
          // Authentication or authorization issue
          const errorData = await checkResponse.json();
          console.error('🔒 Auth error:', errorData);
          throw new Error(`Authentication error: ${errorData.message}. Please log in again.`);
        } else if (checkResponse.ok) {
          // Profile exists - use PUT to update
          const existingProfileData = await checkResponse.json();
          console.log('✅ Profile found:', existingProfileData.profile ? 'Yes' : 'No');
          
          if (existingProfileData && existingProfileData.profile) {
            method = 'PUT';
            profileExists = true;
            console.log('🔄 Profile exists - will UPDATE with PUT');
          } else {
            console.log('⚠️  Unexpected response format, defaulting to POST');
            method = 'POST';
          }
        } else {
          // Some other error (500, etc)
          const errorData = await checkResponse.json();
          console.error('⚠️  Unexpected response:', checkResponse.status, errorData);
          
          // If it's a server error, we can still try to save
          console.log('⚠️  Server error during check, will attempt POST anyway');
          method = 'POST';
        }
      } catch (checkError) {
        console.error('❌ Error during profile check:', checkError);
        console.error('Error type:', checkError.name);
        console.error('Error message:', checkError.message);
        
        // Analyze the error
        const errorMsg = (checkError.message || '').toLowerCase();
        
        if (checkError.message?.includes('log in')) {
          // Authentication error - must re-throw
          throw checkError;
        } else if (errorMsg.includes('not found') || errorMsg.includes('404')) {
          // Treat as profile not existing
          console.log('ℹ️  Treating as new profile (POST)');
          method = 'POST';
        } else if (checkError.name === 'TypeError' && checkError.message?.includes('fetch')) {
          // Network error
          console.error('🌐 Network error - cannot reach server');
          throw new Error('Cannot reach server. Please check your connection.');
        } else {
          // Unknown error - default to POST and let the save attempt reveal the real issue
          console.log('⚠️  Unknown error, will attempt POST');
          method = 'POST';
        }
      }

      // Step 4: Create or update profile with detailed logging
      console.log('\n📤 STEP 4: Saving profile...');
      console.log(`   Method: ${method}`);
      console.log(`   Endpoint: ${API_URL}/candidate/profile`);
      console.log(`   Profile data keys:`, Object.keys(profileData));
      
      const saveResponse = await fetch(`${API_URL}/candidate/profile`, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      console.log('📥 Save response status:', saveResponse.status, saveResponse.statusText);

      const saveData = await saveResponse.json();
      console.log('📥 Save response data:', saveData);

      if (!saveResponse.ok) {
        // Handle specific error cases
        if (saveResponse.status === 400 && saveData.message?.includes('already exists')) {
          // Profile already exists, retry with PUT
          console.log('🔄 Profile exists (400), retrying with PUT...');
          
          const retryResponse = await fetch(`${API_URL}/candidate/profile`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(profileData),
          });

          const retryData = await retryResponse.json();
          
          if (!retryResponse.ok) {
            console.error('❌ Retry failed:', retryData);
            throw new Error(retryData.message || 'Failed to update profile');
          }
          
          console.log('✅ Profile updated successfully on retry');
          console.log('═══════════════════════════════════════\n');
          return retryData;
        } else if (saveResponse.status === 401) {
          console.error('🔒 Authentication failed during save');
          throw new Error('Session expired. Please log in again.');
        } else {
          console.error('❌ Save failed:', saveData);
          throw new Error(saveData.message || `Failed to save profile (${saveResponse.status})`);
        }
      }

      console.log('✅ Profile saved successfully!');
      console.log('═══════════════════════════════════════\n');
      return saveData;

    } catch (error) {
      console.error('\n❌ FATAL ERROR in createOrUpdateProfile:');
      console.error('   Error type:', error.name);
      console.error('   Error message:', error.message);
      console.error('   Stack trace:', error.stack);
      console.log('═══════════════════════════════════════\n');
      throw error;
    }
  },

  // Update specific section (if backend supports it)
  updateSection: async (section, data) => {
    console.log(`📝 Updating profile section: ${section}`);
    return apiCall(`/candidate/profile/section/${section}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Get profile completeness
  getProfileCompleteness: async () => {
    console.log('📊 Getting profile completeness...');
    return apiCall('/candidate/profile/completion');
  },

  // Delete profile
  deleteProfile: async () => {
    console.log('🗑️  Deleting profile...');
    return apiCall('/candidate/profile', {
      method: 'DELETE',
    });
  },
};

// File Upload API calls
export const uploadAPI = {
  uploadProfilePicture: async (file) => {
    console.log('📸 Uploading profile picture...');
    const formData = new FormData();
    formData.append('profilePicture', file);

    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/upload/profile-picture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('❌ Profile picture upload failed:', data);
      throw new Error(data.message || 'Upload failed');
    }
    console.log('✅ Profile picture uploaded');
    return data;
  },

  uploadResume: async (file) => {
    console.log('📄 Uploading resume...');
    const formData = new FormData();
    formData.append('resume', file);

    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/upload/resume`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('❌ Resume upload failed:', data);
      throw new Error(data.message || 'Upload failed');
    }
    console.log('✅ Resume uploaded');
    return data;
  },

  uploadDocument: async (file, type = 'other') => {
    console.log(`📎 Uploading document (${type})...`);
    const formData = new FormData();
    formData.append('document', file);

    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/upload/document/${type}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('❌ Document upload failed:', data);
      throw new Error(data.message || 'Upload failed');
    }
    console.log('✅ Document uploaded');
    return data;
  },

  deleteFile: async (type, filename) => {
    console.log(`🗑️  Deleting file: ${type}/${filename}`);
    return apiCall(`/upload/file/${type}/${filename}`, {
      method: 'DELETE',
    });
  },

  getFileUrl: (type, filename) => {
    return `${API_URL}/upload/file/${type}/${filename}`;
  },
};

// ==========================================
// COMPANY API
// ==========================================
export const companyAPI = {
  // Get all companies
  getAllCompanies: async (params = {}) => {
    console.log('🏢 Fetching all companies with params:', params);
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/companies?${queryString}`);
  },

  // Get single company by ID
  getCompanyById: async (companyId) => {
    console.log(`🏢 Fetching company details: ${companyId}`);
    return apiCall(`/companies/${companyId}`);
  },

  // Create new company (College Admin only)
  createCompany: async (companyData) => {
    console.log('➕ Creating new company:', companyData);
    return apiCall('/companies', {
      method: 'POST',
      body: JSON.stringify(companyData),
    });
  },

  // Update existing company (College Admin only)
  updateCompany: async (companyId, companyData) => {
    console.log(`✏️  Updating company: ${companyId}`, companyData);
    return apiCall(`/college-admin/companies/${companyId}`, {
      method: 'PUT',
      body: JSON.stringify(companyData),
    });
  },

  // Delete company (College Admin only)
  deleteCompany: async (companyId) => {
    console.log(`🗑️  Deleting company: ${companyId}`);
    return apiCall(`/college-admin/companies/${companyId}`, {
      method: 'DELETE',
    });
  },

  // Toggle company active status (College Admin only)
  toggleActiveStatus: async (companyId) => {
    console.log(`🔄 Toggling active status: ${companyId}`);
    return apiCall(`/college-admin/companies/${companyId}/toggle-active`, {
      method: 'PATCH',
    });
  },
};

// Make companyAPI globally available for existing code
window.companyAPI = companyAPI;

// ==========================================
// JOB DESCRIPTION API
// ==========================================
export const jobAPI = {
  // Get all jobs with filters
  getAllJobs: async (params = {}) => {
    console.log('📋 Fetching all jobs with params:', params);
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/jobs?${queryString}`);
  },

  // Get single job by ID
  getJobById: async (jobId) => {
    console.log(`📄 Fetching job details: ${jobId}`);
    return apiCall(`/jobs/${jobId}`);
  },

  // Create new job (College Admin only)
  createJob: async (jobData) => {
    console.log('➕ Creating new job:', jobData);
    return apiCall('/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData),
    });
  },

  // Update existing job (College Admin only)
  updateJob: async (jobId, jobData) => {
    console.log(`✏️  Updating job: ${jobId}`, jobData);
    return apiCall(`/jobs/${jobId}`, {
      method: 'PUT',
      body: JSON.stringify(jobData),
    });
  },

  // Delete job (College Admin only)
  deleteJob: async (jobId) => {
    console.log(`🗑️  Deleting job: ${jobId}`);
    return apiCall(`/jobs/${jobId}`, {
      method: 'DELETE',
    });
  },

  // Update job status (College Admin only)
  updateJobStatus: async (jobId, status) => {
    console.log(`📊 Updating job status: ${jobId} to ${status}`);
    return apiCall(`/jobs/${jobId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  // Toggle pin status (College Admin only)
  togglePinJob: async (jobId) => {
    console.log(`📌 Toggling pin status: ${jobId}`);
    return apiCall(`/jobs/${jobId}/pin`, {
      method: 'PATCH',
    });
  },

  // Get job statistics
  getJobStats: async (jobId) => {
    console.log(`📊 Fetching job stats: ${jobId}`);
    return apiCall(`/jobs/${jobId}/stats`);
  },

  // Get jobs by company
  getJobsByCompany: async (companyId) => {
    console.log(`🏢 Fetching jobs for company: ${companyId}`);
    return apiCall(`/jobs/company/${companyId}`);
  },

  // Check eligibility for a job (Student only)
  checkEligibility: async (jobId) => {
    console.log(`✅ Checking eligibility for job: ${jobId}`);
    return apiCall(`/jobs/${jobId}/check-eligibility`);
  },

<<<<<<< HEAD
  // Get matched students with match % for a JD (College Admin only)
=======
  // ✅ NEW: Get skill-matched students for a JD (College Admin only)
  // Route: GET /api/jobs/:id/matched-students
  // Returns students sorted by matchPercentage desc, with breakdown per criterion
>>>>>>> 6fb3286 (skill matching integrated and small bug has been cleared)
  getMatchedStudents: async (jobId) => {
    console.log(`🎯 Fetching matched students for job: ${jobId}`);
    return apiCall(`/jobs/${jobId}/matched-students`);
  },
};

// Make jobAPI globally available for existing code
window.jobAPI = jobAPI;

// Helper functions for token management
export const tokenManager = {
  setToken: (token) => {
    localStorage.setItem('authToken', token);
    console.log('🔑 Token saved');
  },

  getToken: () => {
    return localStorage.getItem('authToken');
  },

  removeToken: () => {
    localStorage.removeItem('authToken');
    console.log('🔑 Token removed');
  },

  setUserData: (userData) => {
    localStorage.setItem('userData', JSON.stringify(userData));
    console.log('👤 User data saved');
  },

  getUserData: () => {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  },

  removeUserData: () => {
    localStorage.removeItem('userData');
    console.log('👤 User data removed');
  },
};

// Add this to your existing Api.js file

// ==========================================
// APPLICATIONS API
// ==========================================
export const applicationAPI = {
  // Get all applications (College Admin)
  getAllApplications: async (params = {}) => {
    console.log('📋 Fetching all applications with params:', params);
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/applications?${queryString}`);
  },

  // Get single application by ID
  getApplicationById: async (applicationId) => {
    console.log(`📄 Fetching application details: ${applicationId}`);
    return apiCall(`/applications/${applicationId}`);
  },

  // Get applications for a specific job
  getApplicationsByJob: async (jobId) => {
    console.log(`📋 Fetching applications for job: ${jobId}`);
    return apiCall(`/applications/job/${jobId}`);
  },

  // Get applications for a specific student
  getApplicationsByStudent: async (studentId) => {
    console.log(`📋 Fetching applications for student: ${studentId}`);
    return apiCall(`/applications/student/${studentId}`);
  },

  // Create new application (Student)
  createApplication: async (applicationData) => {
    console.log('➕ Creating new application:', applicationData);
    return apiCall('/applications', {
      method: 'POST',
      body: JSON.stringify(applicationData),
    });
  },

  // Update application status (College Admin)
  updateApplicationStatus: async (applicationId, status) => {
    console.log(`📊 Updating application status: ${applicationId} to ${status}`);
    return apiCall(`/applications/${applicationId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  // Update application (College Admin)
  updateApplication: async (applicationId, applicationData) => {
    console.log(`✏️  Updating application: ${applicationId}`, applicationData);
    return apiCall(`/applications/${applicationId}`, {
      method: 'PUT',
      body: JSON.stringify(applicationData),
    });
  },

  // Delete application
  deleteApplication: async (applicationId) => {
    console.log(`🗑️  Deleting application: ${applicationId}`);
    return apiCall(`/applications/${applicationId}`, {
      method: 'DELETE',
    });
  },

  // Get application statistics
  getApplicationStats: async () => {
    console.log('📊 Fetching application statistics');
    return apiCall('/applications/stats');
  },
};

// Make applicationAPI globally available
window.applicationAPI = applicationAPI;

// ==========================================
// COLLEGE ADMIN API
// ==========================================
export const collegeAdminAPI = {
  // Dashboard
  getDashboard: async () => {
    console.log('📊 Fetching college admin dashboard data...');
    return apiCall('/college-admin/dashboard');
  },

  // My College Profile
  getMyCollegeProfile: async () => {
    console.log('🏫 Fetching my college profile...');
    return apiCall('/college-admin/my-college');
  },

  updateMyCollegeProfile: async (data) => {
    console.log('✏️  Updating my college profile...', data);
    return apiCall('/college-admin/my-college', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Companies (College Admin specific endpoints)
  getCompanies: async (params = {}) => {
    console.log('🏢 Fetching college admin companies with params:', params);
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/college-admin/companies${queryString ? `?${queryString}` : ''}`);
  },

  createCompany: async (companyData) => {
    console.log('➕ Creating company via college admin:', companyData);
    return apiCall('/college-admin/companies', {
      method: 'POST',
      body: JSON.stringify(companyData),
    });
  },

  updateCompany: async (companyId, companyData) => {
    console.log(`✏️  Updating company via college admin: ${companyId}`, companyData);
    return apiCall(`/college-admin/companies/${companyId}`, {
      method: 'PUT',
      body: JSON.stringify(companyData),
    });
  },

  deleteCompany: async (companyId) => {
    console.log(`🗑️  Deleting company via college admin: ${companyId}`);
    return apiCall(`/college-admin/companies/${companyId}`, {
      method: 'DELETE',
    });
  },

  // Jobs
  getJobs: async (params = {}) => {
    console.log('📋 Fetching college admin jobs with params:', params);
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/college-admin/jobs${queryString ? `?${queryString}` : ''}`);
  },

  // Students
  getStudents: async (params = {}) => {
    console.log('👥 Fetching students with params:', params);
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/college-admin/students${queryString ? `?${queryString}` : ''}`);
  },

  // Applications
  getApplications: async (params = {}) => {
    console.log('📋 Fetching college admin applications with params:', params);
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/college-admin/applications${queryString ? `?${queryString}` : ''}`);
  },

  updateApplicationStatus: async (applicationId, statusData) => {
    console.log(`📊 Updating application status: ${applicationId}`, statusData);
    return apiCall(`/college-admin/applications/${applicationId}/status`, {
      method: 'PUT',
      body: JSON.stringify(statusData),
    });
  },

  // Analytics
  getAnalytics: async () => {
    console.log('📊 Fetching college admin analytics...');
    return apiCall('/college-admin/analytics');
  },
};

// Make collegeAdminAPI globally available
window.collegeAdminAPI = collegeAdminAPI;

// Export verifyAuth for external use
export { verifyAuth };


export default apiCall;