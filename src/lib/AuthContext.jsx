import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase, api } from '@/api/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    let active = true;

    const applySession = async (session) => {
      if (!session?.user) {
        if (active) {
          setUser(null);
          setIsAuthenticated(false);
        }
        return;
      }
      try {
        const profile = await api.auth.profileToUser(session.user);
        if (active) {
          setUser(profile);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Failed to load user profile:', error);
        if (active) {
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    };

    supabase.auth.getSession().then(async ({ data }) => {
      await applySession(data.session);
      if (active) setIsLoadingAuth(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    setAuthError(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthError({ type: 'invalid_credentials', message: error.message });
      throw error;
    }
    return data;
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    supabase.auth.signOut();
    if (shouldRedirect) window.location.href = '/';
  };

  const navigateToLogin = () => {
    window.location.href = '/Login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings: false,
        authError,
        appPublicSettings: null,
        logout,
        login,
        navigateToLogin,
        checkAppState: () => {},
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
