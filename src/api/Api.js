// src/api/Api.js - FIXED VERSION
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function to handle API calls
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
    const response = await fetch(url, config);
    
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
      throw new Error(data.message || data.error || `Error: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
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
  },
};


// ==========================================
// CANDIDATE PROFILE API - FIXED FOR BACKEND
// ==========================================
export const profileAPI = {
  // Get profile
  getProfile: async () => {
    return apiCall('/candidate/profile');
  },

  // Create or update full profile with file handling
  createOrUpdateProfile: async (profileDataOrFormData) => {
    try {
      let profileData;
      let resumeFile = null;
      let idProofFile = null;

      // Check if it's FormData (from ProfileEdit.jsx)
      if (profileDataOrFormData instanceof FormData) {
        // Extract profile data JSON
        const profileDataString = profileDataOrFormData.get('profileData');
        profileData = JSON.parse(profileDataString);
        
        // Extract files
        resumeFile = profileDataOrFormData.get('resumeFile');
        idProofFile = profileDataOrFormData.get('idProofFile');
      } else {
        // Direct JSON object
        profileData = profileDataOrFormData;
      }

      // Step 1: Upload resume file if provided
      if (resumeFile) {
        const resumeFormData = new FormData();
        resumeFormData.append('resume', resumeFile);

        const token = localStorage.getItem('authToken');
        const resumeResponse = await fetch(`${API_URL}/upload/resume`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: resumeFormData,
        });

        const resumeData = await resumeResponse.json();
        if (!resumeResponse.ok) {
          throw new Error(resumeData.message || 'Resume upload failed');
        }

        // Update profile data with resume URL
        profileData.resumeUrl = resumeData.file.url;
      }

      // Step 2: Upload ID proof file if provided
      if (idProofFile) {
        const idProofFormData = new FormData();
        idProofFormData.append('document', idProofFile);

        const token = localStorage.getItem('authToken');
        const idProofResponse = await fetch(`${API_URL}/upload/document/id-proof`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: idProofFormData,
        });

        const idProofData = await idProofResponse.json();
        if (!idProofResponse.ok) {
          throw new Error(idProofData.message || 'ID proof upload failed');
        }

        // Update profile data with ID proof URL
        profileData.idProofUrl = idProofData.file.url;
      }

      // Step 3: Check if profile exists to determine POST vs PUT
      let method = 'POST'; // Default to create
      try {
        const existingProfile = await apiCall('/candidate/profile');
        if (existingProfile && existingProfile.profile) {
          method = 'PUT'; // Profile exists, update it
        }
      } catch (error) {
        // Profile doesn't exist (404), use POST
        if (!error.message?.includes('404') && !error.message?.includes('not found')) {
          throw error; // Re-throw if it's not a 404 error
        }
      }

      // Step 4: Create or update profile with JSON data
      return apiCall('/candidate/profile', {
        method: method,
        body: JSON.stringify(profileData),
      });

    } catch (error) {
      console.error('Error in createOrUpdateProfile:', error);
      throw error;
    }
  },

  // Update specific section (if backend supports it)
  updateSection: async (section, data) => {
    return apiCall(`/candidate/profile/section/${section}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Get profile completeness
  getProfileCompleteness: async () => {
    return apiCall('/candidate/profile/completion');
  },

  // Delete profile
  deleteProfile: async () => {
    return apiCall('/candidate/profile', {
      method: 'DELETE',
    });
  },
};

// File Upload API calls
export const uploadAPI = {
  uploadProfilePicture: async (file) => {
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
      throw new Error(data.message || 'Upload failed');
    }
    return data;
  },

  uploadResume: async (file) => {
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
      throw new Error(data.message || 'Upload failed');
    }
    return data;
  },

  uploadDocument: async (file, type = 'other') => {
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
      throw new Error(data.message || 'Upload failed');
    }
    return data;
  },

  deleteFile: async (type, filename) => {
    return apiCall(`/upload/file/${type}/${filename}`, {
      method: 'DELETE',
    });
  },

  getFileUrl: (type, filename) => {
    return `${API_URL}/upload/file/${type}/${filename}`;
  },
};

// Helper functions for token management
export const tokenManager = {
  setToken: (token) => {
    localStorage.setItem('authToken', token);
  },

  getToken: () => {
    return localStorage.getItem('authToken');
  },

  removeToken: () => {
    localStorage.removeItem('authToken');
  },

  setUserData: (userData) => {
    localStorage.setItem('userData', JSON.stringify(userData));
  },

  getUserData: () => {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  },

  removeUserData: () => {
    localStorage.removeItem('userData');
  },
};

export default apiCall;