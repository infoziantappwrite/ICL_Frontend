// src/api/Api.js - COMPLETE FIX with comprehensive logging and error handling
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ─── SECURE: In-memory token store (replaces localStorage for access token) ───
// Stored in JS module memory — invisible to XSS scripts unlike localStorage.
let _accessToken = null;

export const tokenStore = {
  get: () => _accessToken,
  set: (token) => {
    _accessToken = token;
    // Broadcast so groupAPI.js (no circular dep) can sync its local copy
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:tokenSet', { detail: { token } }));
    }
  },
  clear: () => { _accessToken = null; },
};
// Expose globally so aux API files can share the same token without a circular import
if (typeof window !== 'undefined') window.__tokenStore = tokenStore;

// ─── Refresh logic ─────────────────────────────────────────────────────────────
// Prevents multiple parallel refresh calls when several requests expire at once.
let _refreshPromise = null;

const refreshAccessToken = async () => {
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
    try {
      console.log('🔄 Refreshing access token...');
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // sends the httpOnly refresh token cookie
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (response.ok && data.accessToken) {
        tokenStore.set(data.accessToken);
        console.log('✅ Access token refreshed');
        return data.accessToken;
      } else {
        tokenStore.clear();
        console.warn('⚠️ Refresh failed — session ended:', data.message);
        // Notify AuthContext to clear user state and redirect to login
        window.dispatchEvent(new CustomEvent('auth:sessionExpired'));
        return null;
      }
    } catch (err) {
      tokenStore.clear();
      window.dispatchEvent(new CustomEvent('auth:sessionExpired'));
      return null;
    } finally {
      _refreshPromise = null;
    }
  })();

  return _refreshPromise;
};

// Helper function to handle API calls with better error handling
const apiCall = async (endpoint, options = {}, _isRetry = false) => {
  const url = `${API_URL}${endpoint}`;

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
    credentials: 'include', // SECURE: always send httpOnly refresh cookie
  };

  // SECURE: read token from memory, not localStorage
  const token = tokenStore.get();
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    console.log(`📡 API Call: ${options.method || 'GET'} ${endpoint}`);
    const response = await fetch(url, config);

    console.log(`📥 Response: ${response.status} ${response.statusText}`);

    // SECURE: Auto-refresh on TOKEN_EXPIRED, then retry once
    if (response.status === 401 && !_isRetry) {
      let errorData = {};
      try { errorData = await response.clone().json(); } catch { }

      if (errorData.code === 'TOKEN_EXPIRED') {
        const newToken = await refreshAccessToken();
        if (newToken) {
          return apiCall(endpoint, options, true); // retry with new token
        }
        throw new Error('Session expired. Please login again.');
      }
    }

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
      const err = new Error(data.message || data.error || `Error: ${response.status}`);
      err.statusCode = response.status;
      err.responseData = data;
      throw err;
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
  const token = tokenStore.get(); // SECURE: read from memory, not localStorage

  if (!token) {
    console.error('❌ No auth token found in memory');
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

  // Google OAuth — sends userInfo object { email, name, sub, picture } from Google
  googleAuth: async (userInfo) => {
    return apiCall('/auth/google-token', {
      method: 'POST',
      body: JSON.stringify(userInfo),
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

  // First-login password change (POST /api/auth/change-password)
  // If isFirstLogin, currentPassword is not required; newPassword is mandatory.
  changePassword: async (newPassword, currentPassword = null, isFirstLogin = false) => {
    const body = { newPassword };
    if (currentPassword) body.currentPassword = currentPassword;
    if (isFirstLogin) body.isFirstLogin = true;   // tells backend to skip currentPassword check
    return apiCall('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  logout: async () => {
    try {
      // Tell server to revoke this device's refresh token
      await apiCall('/auth/logout', { method: 'POST' });
    } catch (err) {
      // Proceed even if server unreachable — clear client state regardless
      console.error('Logout server error:', err.message);
    } finally {
      tokenStore.clear(); // SECURE: clear in-memory access token
      console.log('🚪 Logged out - cleared auth data');
    }
  },

  // SECURE: New — restore session from httpOnly cookie on app boot/browser refresh
  restoreSession: async () => {
    return refreshAccessToken();
  },

  // SECURE: New — logout from all devices
  logoutAll: async () => {
    try {
      await apiCall('/auth/logout-all', { method: 'POST' });
    } catch (err) {
      console.error('LogoutAll server error:', err.message);
    } finally {
      tokenStore.clear();
      console.log('🚪 Logged out from all devices');
    }
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
      const token = tokenStore.get(); // SECURE: read from memory

      // Step 1: Upload resume file if provided
      if (resumeFile) {
        console.log('\n📤 STEP 1: Uploading resume...');
        try {
          const resumeData = await uploadAPI.uploadResume(resumeFile);
          const resumeUrl = resumeData.file?.url || resumeData.url;
          if (resumeUrl) {
            profileData.resumeUrl = resumeUrl;
            if (!profileData.documents) profileData.documents = {};
            if (!profileData.documents.resume) profileData.documents.resume = {};
            profileData.documents.resume.url = resumeUrl;
            profileData.documents.resume.filename = resumeFile.name;
            profileData.documents.resume.uploadedAt = new Date().toISOString();
          }
          console.log('✅ Resume uploaded:', resumeUrl);
        } catch (uploadErr) {
          console.error('❌ Resume upload failed:', uploadErr.message);
          throw new Error(`Resume upload failed: ${uploadErr.message}`);
        }
      } else {
        console.log('\n⏭️  STEP 1: No resume to upload');
      }

      // Step 2: Upload ID proof file if provided
      if (idProofFile) {
        console.log('\n📤 STEP 2: Uploading ID proof...');
        try {
          const idProofData = await uploadAPI.uploadIdProof(idProofFile);
          const idProofUrl = idProofData.file?.url || idProofData.url;
          if (idProofUrl) {
            profileData.idProofUrl = idProofUrl;
            if (!profileData.documents) profileData.documents = {};
            if (!profileData.documents.idProof) profileData.documents.idProof = {};
            profileData.documents.idProof.url = idProofUrl;
            profileData.documents.idProof.filename = idProofFile.name;
            profileData.documents.idProof.uploadedAt = new Date().toISOString();
          }
          console.log('✅ ID proof uploaded:', idProofUrl);
        } catch (uploadErr) {
          console.error('❌ ID proof upload failed:', uploadErr.message);
          throw new Error(`ID proof upload failed: ${uploadErr.message}`);
        }
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

    const token = tokenStore.get(); // SECURE: read from memory
    const response = await fetch(`${API_URL}/upload/profile-picture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
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

    const token = tokenStore.get(); // SECURE: read from memory
    const response = await fetch(`${API_URL}/upload/resume`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
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

  uploadIdProof: async (file) => {
    console.log('🆔 Uploading ID proof...');
    const formData = new FormData();
    formData.append('document', file);

    const token = tokenStore.get();
    const response = await fetch(`${API_URL}/upload/id-proof`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      credentials: 'include',
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('❌ ID proof upload failed:', data);
      throw new Error(data.message || 'ID proof upload failed');
    }
    console.log('✅ ID proof uploaded:', data.file?.url);
    return data;
  },

  uploadDocument: async (file, type = 'other') => {
    console.log(`📎 Uploading document (${type})...`);
    const formData = new FormData();
    formData.append('document', file);

    const token = tokenStore.get(); // SECURE: read from memory
    const response = await fetch(`${API_URL}/upload/document/${type}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
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
    return apiCall(`/companies/${companyId}`, {
      method: 'PUT',
      body: JSON.stringify(companyData),
    });
  },

  // Delete company (College Admin only)
  deleteCompany: async (companyId) => {
    console.log(`🗑️  Deleting company: ${companyId}`);
    return apiCall(`/companies/${companyId}`, {
      method: 'DELETE',
    });
  },

  // Toggle company active status (College Admin only)
  toggleActiveStatus: async (companyId) => {
    console.log(`🔄 Toggling active status: ${companyId}`);
    return apiCall(`/companies/${companyId}/toggle-active`, {
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

  getJobList: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/jobs/joblist?${queryString}`);
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

  // ✅ NEW: Get skill-matched students for a JD (College Admin only)
  // Route: GET /api/jobs/:id/matched-students
  // Returns students sorted by matchPercentage desc, with breakdown per criterion
  getMatchedStudents: async (jobId) => {
    console.log(`🎯 Fetching matched students for job: ${jobId}`);
    return apiCall(`/jobs/${jobId}/matched-students`);
  },
};

// Make jobAPI globally available for existing code
window.jobAPI = jobAPI;

// Helper functions for token management
// SECURE: tokenManager now uses in-memory tokenStore instead of localStorage.
// The interface is identical so all existing callers work without changes.
export const tokenManager = {
  setToken: (token) => {
    tokenStore.set(token); // SECURE: store in memory, not localStorage
    console.log('🔑 Token saved');
  },

  getToken: () => {
    return tokenStore.get(); // SECURE: read from memory
  },

  removeToken: () => {
    tokenStore.clear(); // SECURE: clear from memory
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

  getMyCollegeProfile: async () => {
    return apiCall('/college-admin/my-college');
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

  // ── Groups ──────────────────────────────────────────────────────────────────
  getGroups: async () => {
    return apiCall('/groups');
  },

  getGroupById: async (id) => {
    return apiCall(`/groups/${id}`);
  },

  getGroupStudents: async (id) => {
    return apiCall(`/groups/${id}/students`);
  },

  getGroupsDropdown: async () => {
    return apiCall('/groups/dropdown');
  },

  createGroup: async (data) => {
    return apiCall('/groups', { method: 'POST', body: JSON.stringify(data) });
  },

  updateGroup: async (id, data) => {
    return apiCall(`/groups/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },

  addStudentsToGroup: async (id, students) => {
    return apiCall(`/groups/${id}/add-students`, {
      method: 'PATCH',
      body: JSON.stringify({ students }),
    });
  },

  removeStudentsFromGroup: async (id, userIds) => {
    return apiCall(`/groups/${id}/remove-students`, {
      method: 'PATCH',
      body: JSON.stringify({ userIds }),
    });
  },

  deleteGroup: async (id) => {
    return apiCall(`/groups/${id}`, { method: 'DELETE' });
  },
};

// Make collegeAdminAPI globally available
window.collegeAdminAPI = collegeAdminAPI;

// Export verifyAuth for external use
export { verifyAuth };



// ==========================================
// ASSESSMENT API — matches /api/assessment/* routes
// ==========================================
export const assessmentAPI = {

  // GET /api/assessment  → { success, count, assessments }
  getAllAssessments: async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiCall(`/assessment${qs ? `?${qs}` : ''}`);
  },

  // GET /api/assessment/:id  → { success, assessment }
  getAssessment: async (id) => {
    return apiCall(`/assessment/${id}`);
  },

  // POST /api/assessment  → { success, message, assessment }
  createAssessment: async (data) => {
    return apiCall('/assessment', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // PUT /api/assessment/:id  → { success, message, assessment }
  updateAssessment: async (id, data) => {
    return apiCall(`/assessment/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // PATCH /api/assessment/:id/toggle  → { success, status }
  toggleAssessmentStatus: async (id) => {
    return apiCall(`/assessment/${id}/toggle`, { method: 'PATCH' });
  },

  // DELETE /api/assessment/:id  → { success, message }
  deleteAssessment: async (id) => {
    return apiCall(`/assessment/${id}`, { method: 'DELETE' });
  },

  // POST /api/assessment/question  → { success, question }
  createQuestion: async (data) => {
    return apiCall('/assessment/question', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // PUT /api/assessment/question/:id  → { success, message, question }
  updateQuestion: async (id, data) => {
    return apiCall(`/assessment/question/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // DELETE /api/assessment/question/:id  → { success, message }
  deleteQuestion: async (id) => {
    return apiCall(`/assessment/question/${id}`, { method: 'DELETE' });
  },

  // DELETE /api/assessment/question/:id/unlink
  // Removes the question from all assessments & sections without deleting it,
  // so a subsequent deleteQuestion call will succeed.
  unlinkQuestion: async (id) => {
    return apiCall(`/assessment/question/${id}/unlink`, { method: 'DELETE' });
  },

  // POST /api/assessment/:assessmentId/add-question
  addQuestionToAssessment: async (assessmentId, data) => {
    return apiCall(`/assessment/${assessmentId}/add-question`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // GET /api/assessment/:id/eligible-students
  getEligibleStudents: async (assessmentId, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiCall(`/assessment/${assessmentId}/eligible-students${qs ? `?${qs}` : ''}`);
  },

  // GET /api/assessment/:id/group-students  (trainer only — reads students from linked group)
  getGroupStudents: async (assessmentId) => {
    return apiCall(`/assessment/${assessmentId}/group-students`);
  },

  // POST /api/assessment/:id/assign-from-jd
  assignStudentsFromJD: async (assessmentId) => {
    return apiCall(`/assessment/${assessmentId}/assign-from-jd`, { method: 'POST' });
  },

  // POST /api/assessment/:id/assign-manual
  assignStudentsManual: async (assessmentId, studentEmails) => {
    return apiCall(`/assessment/${assessmentId}/assign-manual`, {
      method: 'POST',
      body: JSON.stringify({ student_emails: studentEmails }),
    });
  },

  // POST /api/assessment/:id/assign-group
  assignStudentsFromGroup: async (assessmentId, groupId) => {
    return apiCall(`/assessment/${assessmentId}/assign-group`, {
      method: 'POST',
      body: JSON.stringify({ group_id: groupId }),
    });
  },

  // DELETE /api/assessment/:id/remove-student/:studentId
  removeEligibleStudent: async (assessmentId, studentId) => {
    return apiCall(`/assessment/${assessmentId}/remove-student/${studentId}`, {
      method: 'DELETE',
    });
  },

  // POST /api/assessment/:id/bulk-add-questions
  bulkAddQuestions: async (assessmentId, questions) => {
    return apiCall(`/assessment/${assessmentId}/bulk-add-questions`, {
      method: 'POST',
      body: JSON.stringify({ questions }),
    });
  },

  // PATCH /api/assessment/:id/status  → { success, status }
  transitionStatus: async (id, status) => {
    return apiCall(`/assessment/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  // GET /api/assessment/:id/report  → { success, assessment, report[] }
  getAssessmentReport: async (id) => {
    return apiCall(`/assessment/${id}/report`);
  },

  // GET /api/assessment/:id/attempts/:attemptId  → { success, student, summary, answers[] }
  getAttemptDetail: async (assessmentId, attemptId) => {
    return apiCall(`/assessment/${assessmentId}/attempts/${attemptId}`);
  },

  recalculateAttemptMarks: async (assessmentId, attemptId) => {
    return apiCall(`/assessment/${assessmentId}/attempts/${attemptId}/recalculate`, {
      method: 'POST',
    });
  },

  // POST /api/assessment/generate-questions (AI)
  generateQuestionsFromJD: async (data) => {
    return apiCall('/assessment/generate-questions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // GET /api/assessment/student/assessments
  getStudentAssessments: async () => {
    return apiCall('/assessment/student/assessments');
  },

  // GET /api/assessment/student/assessments/:id
  getAssessmentDetails: async (id) => {
    return apiCall(`/assessment/student/assessments/${id}`);
  },

  // POST /api/assessment/student/assessments/:id/start
  startAssessment: async (id) => {
    return apiCall(`/assessment/student/assessments/${id}/start`, { method: 'POST' });
  },

  // GET /api/assessment/student/attempt/:attemptId/question/:index
  getQuestion: async (attemptId, index) => {
    return apiCall(`/assessment/student/attempt/${attemptId}/question/${index}`);
  },

  // GET /api/assessment/available-groups  (college admin only)
  // Returns groups scoped to the admin's college — for the assign-group tab
  getAvailableGroupsForAssessment: () => apiCall('/assessment/available-groups'),
};

// ==========================================
// SKILLS API
// ==========================================
export const skillAPI = {
  getAllSkills: async () => {
    console.log("🧠 Fetching all skills...");
    return apiCall("/skills/active-skills");
  },
};

export const branchAPI = {
  getActiveBranches: async () => {
    console.log('🏫 Fetching active branches...');
    return apiCall('/branches/active-branches');
  },
};

// ==========================================
// ASSESSMENT ATTEMPT API — /api/assessment-attempt/*
// ==========================================
export const assessmentAttemptAPI = {

  // POST /api/assessment-attempt/submit
  submitAssessment: async (assessmentId, answers) => {
    return apiCall('/assessment-attempt/submit', {
      method: 'POST',
      body: JSON.stringify({ assessment_id: assessmentId, answers }),
    });
  },

  // GET /api/assessment-attempt/my-assessments
  getMyAssignedAssessments: async () => {
    return apiCall('/assessment-attempt/my-assessments');
  },

  // GET /api/assessment-attempt/my-history
  getMyHistory: async () => {
    return apiCall('/assessment-attempt/my-history');
  },

  // GET /api/assessment-attempt/my/:assessmentId/attempts
  getMyAttempts: async (assessmentId) => {
    return apiCall(`/assessment-attempt/my/${assessmentId}/attempts`);
  },

  // GET /api/assessment-attempt/:id
  getSingleAttempt: async (id) => {
    return apiCall(`/assessment-attempt/${id}`);
  },

  // GET /api/assessment-attempt/admin/:assessmentId
  getAssessmentAttempts: async (assessmentId, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiCall(`/assessment-attempt/admin/${assessmentId}${qs ? `?${qs}` : ''}`);
  },

  // POST /api/assessment-attempt/admin/:assessmentId/publish-leaderboard
  publishLeaderboard: async (assessmentId, data = {}) => {
    return apiCall(`/assessment-attempt/admin/${assessmentId}/publish-leaderboard`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // GET /api/assessment-attempt/leaderboard/:assessmentId  (student)
  getLeaderboard: async (assessmentId) => {
    return apiCall(`/assessment-attempt/leaderboard/${assessmentId}`);
  },

  // ── Trainer Results ──────────────────────────────────────────────────────
  // GET /api/assessment-attempt/trainer/results?assessment_id=&course_id=&group_id=&page=&limit=
  getTrainerResults: async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiCall(`/assessment-attempt/trainer/results${qs ? `?${qs}` : ''}`);
  },

  // GET /api/assessment-attempt/trainer/results/:attemptId?assessment_id=&course_id=&group_id=
  getTrainerAttemptDetail: async (attemptId, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiCall(`/assessment-attempt/trainer/results/${attemptId}${qs ? `?${qs}` : ''}`);
  },

  // GET /api/assessment-attempt/trainer/publish-candidates?assessment_id=&course_id=&group_id=
  getPublishCandidates: async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiCall(`/assessment-attempt/trainer/publish-candidates${qs ? `?${qs}` : ''}`);
  },

  // POST /api/assessment-attempt/trainer/publish-results
  publishResults: async (data) => {
    return apiCall('/assessment-attempt/trainer/publish-results', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

window.assessmentAPI = assessmentAPI;
window.assessmentAttemptAPI = assessmentAttemptAPI;

// ─────────────────────────────────────────────────────────────────────────────
// COURSE API
// Base: /api/courses
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// COURSE API — STUDENTS (base: /api/courses)
// Shared route open to all authenticated roles for reading.
// Write operations (enroll, progress) are student/candidate only.
// ─────────────────────────────────────────────────────────────────────────────
export const courseAPI = {
  // GET /api/courses — browse courses (role-scoped by backend)
  getAllCourses: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiCall(`/courses${qs ? `?${qs}` : ''}`);
  },

  // GET /api/courses/:id — single course with enrollment status for students
  getCourseById: (id) => apiCall(`/courses/${id}`),

  // POST /api/courses/:id/enroll — student self-enroll
  enrollInCourse: (id) =>
    apiCall(`/courses/${id}/enroll`, { method: 'POST' }),

  // GET /api/courses/my-enrollments — student enrolled courses + progress
  getMyEnrollments: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiCall(`/courses/my-enrollments${qs ? `?${qs}` : ''}`);
  },

  // PATCH /api/courses/:id/progress — mark a module complete/incomplete
  updateModuleProgress: (id, data) =>
    apiCall(`/courses/${id}/progress`, { method: 'PATCH', body: JSON.stringify(data) }),
};

// ─────────────────────────────────────────────────────────────────────────────
// COLLEGE ADMIN COURSE API (base: /api/college-admin/courses)
// All endpoints require college_admin role (enforced by backend middleware).
// ─────────────────────────────────────────────────────────────────────────────
export const collegeAdminCourseAPI = {
  // GET  /api/college-admin/courses
  getAllCourses: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiCall(`/college-admin/courses${qs ? `?${qs}` : ''}`);
  },

  // GET  /api/courses/:id  (shared — works for admins too)
  getCourseById: (id) => apiCall(`/courses/${id}`),

  // POST /api/college-admin/courses
  createCourse: (data) =>
    apiCall('/college-admin/courses', { method: 'POST', body: JSON.stringify(data) }),

  // PUT  /api/college-admin/courses/:id
  updateCourse: (id, data) =>
    apiCall(`/college-admin/courses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // DELETE /api/college-admin/courses/:id
  deleteCourse: (id) =>
    apiCall(`/college-admin/courses/${id}`, { method: 'DELETE' }),

  // GET  /api/college-admin/courses/:id/enrollments
  getCourseEnrollments: (id, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiCall(`/college-admin/courses/${id}/enrollments${qs ? `?${qs}` : ''}`);
  },

  // GET  /api/college-admin/courses/:id/analytics
  getCourseAnalytics: (id) =>
    apiCall(`/college-admin/courses/${id}/analytics`),

  // POST /api/college-admin/courses/assign-batch
  assignCourseToBatch: (data) =>
    apiCall('/college-admin/courses/assign-batch', { method: 'POST', body: JSON.stringify(data) }),

  // GET /api/courses/:id/assignable-students (college admin — no collegeId needed)
  getAssignableStudents: (courseId) =>
    apiCall(`/courses/${courseId}/assignable-students`),
};

// ─────────────────────────────────────────────────────────────────────────────
// SUPER ADMIN COURSE API (base: /api/super-admin/courses)
// All endpoints require super_admin role (enforced by backend middleware).
// ─────────────────────────────────────────────────────────────────────────────
export const superAdminCourseAPI = {
  // GET  /api/super-admin/courses
  getAllCourses: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiCall(`/super-admin/courses${qs ? `?${qs}` : ''}`);
  },

  // GET  /api/courses/:id  (shared — works for admins too)
  getCourseById: (id) => apiCall(`/courses/${id}`),

  // POST /api/super-admin/courses
  createCourse: (data) =>
    apiCall('/super-admin/courses', { method: 'POST', body: JSON.stringify(data) }),

  // PUT  /api/courses/:id  (uses shared route — super_admin auth enforced by backend)
  updateCourse: (id, data) =>
    apiCall(`/courses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // DELETE /api/super-admin/courses/:id
  deleteCourse: (id) =>
    apiCall(`/super-admin/courses/${id}`, { method: 'DELETE' }),

  // GET  /api/super-admin/courses/:id/enrollments
  getCourseEnrollments: (id, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiCall(`/super-admin/courses/${id}/enrollments${qs ? `?${qs}` : ''}`);
  },

  // GET  /api/super-admin/courses/:id/analytics
  getCourseAnalytics: (id) =>
    apiCall(`/super-admin/courses/${id}/analytics`),

  // POST /api/super-admin/courses/assign-batch
  assignCourseToBatch: (data) =>
    apiCall('/super-admin/courses/assign-batch', { method: 'POST', body: JSON.stringify(data) }),

  // GET /api/courses/:id/assignable-students?collegeId=xxx
  getAssignableStudents: (courseId, collegeId) =>
    apiCall(`/courses/${courseId}/assignable-students?collegeId=${collegeId}`),
};

// ==========================================
// CODE API — /api/code/*
// Coding-question run, submit, history, admin view
// ==========================================
export const codeAPI = {
  // GET /api/code/languages — list supported languages
  getLanguages: () => apiCall('/code/languages'),

  // POST /api/code/run — run against visible test cases only (no score impact)
  // Body: { assessment_id, question_id, code, language }
  runCode: (data) =>
    apiCall('/code/run', { method: 'POST', body: JSON.stringify(data) }),

  // POST /api/code/run-custom — run with student's own custom stdin (no test cases, raw output)
  // Body: { code, language, custom_input }
  runCustom: (data) =>
    apiCall('/code/run-custom', { method: 'POST', body: JSON.stringify(data) }),

  // POST /api/code/submit — run against ALL test cases, upserts CodeSubmission
  // Body: { assessment_id, question_id, code, language }
  submitCode: (data) =>
    apiCall('/code/submit', { method: 'POST', body: JSON.stringify(data) }),

  // GET /api/code/history?assessment_id=&question_id=
  getHistory: (assessmentId, questionId) =>
    apiCall(`/code/history?assessment_id=${assessmentId}&question_id=${questionId}`),

  // GET /api/code/admin/submission?assessment_id=&question_id=&student_id=
  getAdminSubmission: (assessmentId, questionId, studentId) =>
    apiCall(`/code/admin/submission?assessment_id=${assessmentId}&question_id=${questionId}&student_id=${studentId}`),
};

window.codeAPI = codeAPI;

// ==========================================
// REPORT API — /api/report/*
// Student report for college admin / super admin
// ==========================================
export const reportAPI = {
  // GET /api/report/student-report?student_id=<id>
  getStudentReport: (studentId) =>
    apiCall(`/report/student-report?student_id=${studentId}`),
};

window.reportAPI = reportAPI;

export default apiCall;

// ==========================================
// SECTION API — /api/sections/*
// Manages sections within an assessment
// ==========================================
export const sectionAPI = {

  // GET /api/sections/assessment/:assessmentId
  getSections: (assessmentId) =>
    apiCall(`/sections/assessment/${assessmentId}`),

  // GET /api/sections/assessment/:assessmentId/summary
  getSectionsSummary: (assessmentId) =>
    apiCall(`/sections/assessment/${assessmentId}/summary`),

  // POST /api/sections/assessment/:assessmentId
  createSection: (assessmentId, data) =>
    apiCall(`/sections/assessment/${assessmentId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // GET /api/sections/:sectionId
  getSection: (sectionId) =>
    apiCall(`/sections/${sectionId}`),

  // PUT /api/sections/:sectionId
  updateSection: (sectionId, data) =>
    apiCall(`/sections/${sectionId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // DELETE /api/sections/:sectionId
  deleteSection: (sectionId) =>
    apiCall(`/sections/${sectionId}`, { method: 'DELETE' }),

  // PATCH /api/sections/:sectionId/reorder
  reorderSection: (sectionId, sequence_order) =>
    apiCall(`/sections/${sectionId}/reorder`, {
      method: 'PATCH',
      body: JSON.stringify({ sequence_order }),
    }),

  // POST /api/sections/:sectionId/questions
  addQuestion: (sectionId, question_id) =>
    apiCall(`/sections/${sectionId}/questions`, {
      method: 'POST',
      body: JSON.stringify({ question_id }),
    }),

  // DELETE /api/sections/:sectionId/questions/:questionId
  removeQuestion: (sectionId, questionId) =>
    apiCall(`/sections/${sectionId}/questions/${questionId}`, { method: 'DELETE' }),
};

window.sectionAPI = sectionAPI;
// ==========================================
// TRAINER API — /api/trainer/*
// Updated to include analytics endpoints.
// Replace the existing trainerAPI block in Api.js with this.
// ==========================================
export const trainerAPI = {
  // GET /api/trainer/profile
  getProfile: () => apiCall('/trainer/profile'),

  // PATCH /api/trainer/profile
  updateProfile: (data) =>
    apiCall('/trainer/profile', { method: 'PATCH', body: JSON.stringify(data) }),

  // GET /api/trainer/courses
  // Returns: { trainer_profile_id, trainer_user_id, assigned_courses: [{_id, title, description, category}] }
  getCourses: () => apiCall('/trainer/courses'),

  // GET /api/trainer/courses/:courseId
  // Returns: full course object
  getCourseById: (courseId) => apiCall(`/trainer/courses/${courseId}`),

  // GET /api/assessment  (trainer sees only their own assessments)
  // Returns: { success, count, assessments }
  getAssessments: () => apiCall('/assessment'),

  // GET /api/assessment/trainer/available-groups
  // Returns: { success, count, groups } — groups linked to trainer's courses with closed registration
  getAvailableGroups: () => apiCall('/assessment/trainer/available-groups'),

  // ─── Analytics endpoints (NEW) ─────────────────────────────────────────────

  // GET /api/trainer/analytics/students
  // Query params: page, limit, group_id (optional), course_id (optional), search (optional)
  // Returns: { success, total, page, limit, totalPages, data: [...students] }
  // Student shape: { student_id, full_name, email, branch, batch, cgpa,
  //   enrolled_courses, completed_courses, avg_progress,
  //   total_attempts, avg_score, pass_rate, highest_score, lowest_score,
  //   groups: [{ group_id, group_name, course_id, course_title }] }
  getStudents: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))
    ).toString();
    return apiCall(`/trainer/analytics/students${qs ? `?${qs}` : ''}`);
  },

  // GET /api/trainer/analytics/groups?course_id=...
  // Returns: { success, count, data: [...groups] }
  // Group shape: { group_id, group_name, description, student_count, course_id, course_title,
  //   total_assessments, total_attempts, pass_rate, avg_score, course_completion_rate }
  getGroupAnalytics: (courseId) => {
    const qs = courseId ? `?course_id=${courseId}` : '';
    return apiCall(`/trainer/analytics/groups${qs}`);
  },

  // GET /api/trainer/analytics/summary
  // Returns: { success, data: { total_students, total_courses, total_groups,
  //   total_assessments, total_attempts, overall_pass_rate, avg_score, course_completion_rate } }
  getAnalyticsSummary: () => apiCall('/trainer/analytics/summary'),

  // GET /api/trainer/analytics/assessments?course_id=...
  // Returns: { success, count, data: [...assessments] }
  getAssessmentAnalytics: (courseId) => {
    const qs = courseId ? `?course_id=${courseId}` : '';
    return apiCall(`/trainer/analytics/assessments${qs}`);
  },

  // GET /api/trainer/analytics/students/:studentId
  // Returns: { success, data: { student, groups, course_progress, assessment_summary, attempts, score_trend } }
  getStudentDetail: (studentId) => apiCall(`/trainer/analytics/students/${studentId}`),

  // GET /api/trainer/analytics/score-distribution?course_id=...&assessment_id=...
  // Returns: { success, data: { buckets, pass_fail } }
  getScoreDistribution: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v != null))
    ).toString();
    return apiCall(`/trainer/analytics/score-distribution${qs ? `?${qs}` : ''}`);
  },

  // GET /api/trainer/analytics/progress-timeline?course_id=...
  // Returns: { success, data: [...months] }
  getProgressTimeline: (courseId) => {
    const qs = courseId ? `?course_id=${courseId}` : '';
    return apiCall(`/trainer/analytics/progress-timeline${qs}`);
  },
};

window.trainerAPI = trainerAPI;

// ─────────────────────────────────────────────────────────────────────────────
// COMMENT API  (base: /api/comments)
// POST   /api/comments                          — any auth user adds a comment
// GET    /api/comments/trainer/:courseId        — trainer views their course comments
// GET    /api/comments/admin/course/:courseId   — admin / college-admin views all comments for a course
// DELETE /api/comments/my/:commentId            — user deletes their own comment
// DELETE /api/comments/admin/:commentId         — admin / college-admin deletes any comment
// ─────────────────────────────────────────────────────────────────────────────
export const commentAPI = {
  // Add a comment to a course
  addComment: (course_id, comment) =>
    apiCall('/comments', { method: 'POST', body: JSON.stringify({ course_id, comment }) }),

  // Trainer: get all comments for one of their assigned courses
  getTrainerCourseComments: (courseId) =>
    apiCall(`/comments/trainer/${courseId}`),

  // Admin / college-admin: get all comments for any course
  getAdminCourseComments: (courseId) =>
    apiCall(`/comments/admin/course/${courseId}`),

  // Delete your own comment (students / candidates)
  deleteOwnComment: (commentId) =>
    apiCall(`/comments/my/${commentId}`, { method: 'DELETE' }),

  // Admin / college-admin: delete any comment
  deleteAnyComment: (commentId) =>
    apiCall(`/comments/admin/${commentId}`, { method: 'DELETE' }),
};