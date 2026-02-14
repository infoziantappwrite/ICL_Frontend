// src/context/Profilecontext.jsx - SIMPLIFIED VERSION (No forced redirects)
import { createContext, useContext, useState, useEffect } from 'react';
import { profileAPI } from '../api/Api';
import { useAuth } from './AuthContext';
 
const ProfileContext = createContext(null);
 
export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};
 
export const ProfileProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [profileCompleteness, setProfileCompleteness] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
 
  // ⚠️ CRITICAL FIX: Check for BOTH 'student' AND 'candidate' roles
  useEffect(() => {
    if (isAuthenticated && (user?.role === 'student' || user?.role === 'candidate')) {
      console.log('🔍 User authenticated with role:', user?.role);
      fetchProfile();
    } else {
      setProfile(null);
      setProfileCompleteness(0);
    }
  }, [isAuthenticated, user]);
 
  const fetchProfile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('📡 Fetching profile...');
      const response = await profileAPI.getProfile();
      
      // Backend returns: { success: true, profile: {...}, canAccessCourses: ... }
      if (response.success && response.profile) {
        console.log('✅ Profile found:', response.profile);
        setProfile(response.profile);
        setProfileCompleteness(response.profile?.profileCompletionPercentage || 0);
      }
      
    } catch (err) {
      console.error('⚠️ Error fetching profile:', err);
     
      // If profile doesn't exist (404), set a minimal placeholder
      // This allows the dashboard to load and show "Complete your profile" message
      if (err.message?.includes('not found') || 
          err.message?.includes('404') || 
          err.response?.status === 404) {
        
        console.log('ℹ️ Profile not found - showing placeholder (user can create later)');
        
        // Set a minimal placeholder state to prevent app crashes
        // Dashboard will show profile completion prompt
        setProfile({
          fullName: user?.fullName || user?.name || '',
          email: user?.email || '',
          mobileNumber: '',
          address: {
            city: '',
            state: '',
            country: '',
            pincode: ''
          },
          primarySkills: [],
          secondarySkills: [],
          programmingLanguages: [],
          toolsAndTechnologies: [],
          interestedCourses: [],
          targetCompanies: [],
          certificateUrls: [],
          profileCompletionPercentage: 0,
          profileCompleted: false
        });
        setProfileCompleteness(0);
        setError(null); // Don't show error, just placeholder
      } else {
        // Other errors - still set placeholder to prevent crashes
        setError(err.message);
        
        setProfile({
          fullName: user?.fullName || user?.name || '',
          email: user?.email || '',
          mobileNumber: '',
          address: {
            city: '',
            state: '',
            country: '',
            pincode: ''
          },
          primarySkills: [],
          secondarySkills: [],
          programmingLanguages: [],
          toolsAndTechnologies: [],
          interestedCourses: [],
          profileCompletionPercentage: 0,
          profileCompleted: false
        });
      }
    } finally {
      setIsLoading(false);
    }
  };
 
  const updateProfile = async (profileData) => {
    setIsLoading(true);
    setError(null);
    try {
      // The API.js will handle:
      // 1. Uploading files separately (if FormData is provided)
      // 2. Determining POST vs PUT based on whether profile exists
      // 3. Sending the final profile data as JSON
      const response = await profileAPI.createOrUpdateProfile(profileData);
      
      // Backend returns: { success: true, message: "...", profile: {...}, profileCompletionPercentage: ..., canAccessCourses: ... }
      if (response.success && response.profile) {
        setProfile(response.profile);
        setProfileCompleteness(response.profile?.profileCompletionPercentage || 
                              response.profileCompletionPercentage || 0);
        setError(null);
      }
      
      return response;
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
 
  const updateSection = async (section, data) => {
    setIsLoading(true);
    setError(null);
    try {
      // Backend expects section names like: personalDetails, educationalDetails, etc.
      const response = await profileAPI.updateSection(section, data);
      
      // Backend returns: { success: true, message: "...", profile: {...}, profileCompletionPercentage: ... }
      if (response.success && response.profile) {
        setProfile(response.profile);
        setProfileCompleteness(response.profile?.profileCompletionPercentage || 
                              response.profileCompletionPercentage || 0);
      }
      
      return response;
    } catch (err) {
      console.error('Error updating section:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
 
  const refreshProfileCompleteness = async () => {
    try {
      const response = await profileAPI.getProfileCompleteness();
      
      // Backend returns: { success: true, profileCompletionPercentage: ..., profileCompleted: ..., canAccessCourses: ..., message: "..." }
      if (response.success) {
        setProfileCompleteness(response.profileCompletionPercentage || 0);
      }
    } catch (err) {
      console.error('Error refreshing completeness:', err);
      // Don't throw error, just log it
    }
  };
 
  const value = {
    profile,
    profileCompleteness,
    isLoading,
    error,
    fetchProfile,
    updateProfile,
    updateSection,
    refreshProfileCompleteness,
    setProfile,
  };
 
  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};
 
export default ProfileContext;