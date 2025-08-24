import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import API_BASE_URL, { API_ENDPOINTS } from '../config/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('sundai_token'));

  // Configure axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const response = await axios.get(`${API_BASE_URL}${API_ENDPOINTS.profile}`);
          setUser(response.data);
        } catch (error) {
          console.error('Auth check failed:', error);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.login}`, {
        email,
        password
      });
      
      const { token: newToken, user: userData } = response.data;
      
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('sundai_token', newToken);
      
      toast.success('Successfully logged in!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Login failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.register}`, userData);
      
      const { token: newToken, user: newUser } = response.data;
      
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('sundai_token', newToken);
      
      toast.success('Account created successfully!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Registration failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('sundai_token');
    delete axios.defaults.headers.common['Authorization'];
    toast.success('Logged out successfully');
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await axios.put(`${API_BASE_URL}${API_ENDPOINTS.updateProfile}`, profileData);
      setUser(response.data);
      toast.success('Profile updated successfully!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Profile update failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const generateApiKey = async (keyData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.generateKey}`, keyData);
      toast.success('API key generated successfully!');
      return { success: true, data: response.data };
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to generate API key';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const getApiKeys = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}${API_ENDPOINTS.listKeys}`);
      return { success: true, data: response.data };
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to fetch API keys';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const revokeApiKey = async (keyId) => {
    try {
      await axios.delete(`${API_BASE_URL}${API_ENDPOINTS.revokeKey}/${keyId}`);
      toast.success('API key revoked successfully!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to revoke API key';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const value = {
    user,
    loading,
    token,
    login,
    register,
    logout,
    updateProfile,
    generateApiKey,
    getApiKeys,
    revokeApiKey,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 