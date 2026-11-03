import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Organization } from '../types';
import { api } from '../api/client';

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  signup: (payload: {
    email: string;
    password: string;
    confirmPassword: string;
    organizationName: string;
  }) => Promise<void>;
  logout: () => void;
  updateOrganization: (org: Partial<Organization>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('stockflow_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('stockflow_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.getMe();
        if (response.success && response.data) {
          setUser(response.data.user);
          setOrganization(response.data.organization);
        } else {
          logout();
        }
      } catch (err) {
        console.error('Session validation failed:', err);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      const response = await api.login(credentials);
      const { token: newToken, user: userData, organization: orgData } = response.data;
      localStorage.setItem('stockflow_token', newToken);
      setToken(newToken);
      setUser(userData);
      setOrganization(orgData);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (payload: {
    email: string;
    password: string;
    confirmPassword: string;
    organizationName: string;
  }) => {
    setIsLoading(true);
    try {
      const response = await api.signup(payload);
      const { token: newToken, user: userData, organization: orgData } = response.data;
      localStorage.setItem('stockflow_token', newToken);
      setToken(newToken);
      setUser(userData);
      setOrganization(orgData);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('stockflow_token');
    setToken(null);
    setUser(null);
    setOrganization(null);
  };

  const updateOrganization = (updated: Partial<Organization>) => {
    setOrganization((prev) => (prev ? { ...prev, ...updated } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        signup,
        logout,
        updateOrganization,
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
