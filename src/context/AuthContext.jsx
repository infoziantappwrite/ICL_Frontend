import { createContext, useContext, useState, useEffect } from 'react';
import { tokenManager } from '../api/Api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    const token = tokenManager.getToken();
    const userData = tokenManager.getUserData();

    if (token && userData) {
      setUser(userData);
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const login = (userData, token) => {
    tokenManager.setToken(token);
    tokenManager.setUserData(userData);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    tokenManager.removeToken();
    tokenManager.removeUserData();
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (userData) => {
    tokenManager.setUserData(userData);
    setUser(userData);
  };

  // Helper: update just the college sub-object (used after fetching college profile)
  const updateCollege = (collegeData) => {
    const updatedUser = { ...user, college: collegeData };
    tokenManager.setUserData(updatedUser);
    setUser(updatedUser);
  };

  // Convenience getters
  const college = user?.college || null;
  const collegeName = college?.name || null;

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateUser,
    updateCollege,
    college,
    collegeName,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};