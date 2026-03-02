import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { tokenManager, tokenStore, authAPI } from '../api/Api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// ─── Module-level lock ────────────────────────────────────────────────────────
// Outside the component so it survives React's double-invoke in dev mode.
// Guarantees exactly ONE /auth/refresh call per page load.
let _sessionRestored = false;
let _sessionRestorePromise = null;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const booting = useRef(true);

  useEffect(() => {
    const restoreSession = async () => {
      // Already done — just unblock the UI
      if (_sessionRestored) {
        setIsLoading(false);
        return;
      }
      // Already in-flight — wait for it, don't make a second request
      if (_sessionRestorePromise) {
        await _sessionRestorePromise;
        setIsLoading(false);
        return;
      }

      // First caller — own the promise
      _sessionRestorePromise = (async () => {
        try {
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

          // Step 1: exchange refresh cookie for access token (plain fetch, no interceptor)
          const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          });

          if (!refreshRes.ok) {
            console.log('ℹ️  No active session found');
            return;
          }

          const refreshData = await refreshRes.json();
          const newToken = refreshData.accessToken;
          if (!newToken) return;

          // Step 2: store in memory
          tokenStore.set(newToken);

          // Step 3: fetch user (plain fetch, no interceptor)
          const meRes = await fetch(`${API_URL}/auth/me`, {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${newToken}`,
            },
          });

          if (meRes.ok) {
            const meData = await meRes.json();
            if (meData?.user) {
              tokenManager.setUserData(meData.user);
              setUser(meData.user);
              setIsAuthenticated(true);
              console.log('✅ Session restored for:', meData.user.email);
            }
          }
        } catch (err) {
          console.error('Session restore error:', err.message);
        } finally {
          _sessionRestored = true;
          booting.current = false;
        }
      })();

      await _sessionRestorePromise;
      setIsLoading(false);
    };

    restoreSession();
  }, []);

  // Listen for session-expired events fired by Api.js interceptor
  // Guard: ignore during boot to prevent false logouts
  useEffect(() => {
    const handleSessionExpired = () => {
      if (booting.current) return;
      console.warn('🔒 Session expired — logging out');
      tokenStore.clear();
      tokenManager.removeUserData();
      setUser(null);
      setIsAuthenticated(false);
      setTimeout(() => { window.location.href = '/login'; }, 100);
    };

    window.addEventListener('auth:sessionExpired', handleSessionExpired);
    return () => window.removeEventListener('auth:sessionExpired', handleSessionExpired);
  }, []);

  const login = (userData, token) => {
    tokenStore.set(token);
    tokenManager.setUserData(userData);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      console.error('Logout error:', err.message);
    } finally {
      tokenStore.clear();
      tokenManager.removeUserData();
      setUser(null);
      setIsAuthenticated(false);
      // Reset lock so next login session can restore correctly
      _sessionRestored = false;
      _sessionRestorePromise = null;
    }
  };

  const updateUser = (userData) => {
    tokenManager.setUserData(userData);
    setUser(userData);
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};