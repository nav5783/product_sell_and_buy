import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('marketplace_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('marketplace_token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
          localStorage.setItem('marketplace_user', JSON.stringify(res.data));
        } catch (err) {
          console.error('Session expired or invalid:', err);
          setUser(null);
          localStorage.removeItem('marketplace_token');
          localStorage.removeItem('marketplace_user');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, ...userData } = res.data;
    localStorage.setItem('marketplace_token', token);
    localStorage.setItem('marketplace_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const register = async (formData) => {
    const res = await api.post('/auth/register', formData);
    const { token, ...userData } = res.data;
    localStorage.setItem('marketplace_token', token);
    localStorage.setItem('marketplace_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('marketplace_token');
    localStorage.removeItem('marketplace_user');
    setUser(null);
  };

  const updateProfile = async (formData) => {
    const res = await api.put('/auth/profile', formData);
    const { token, ...userData } = res.data;
    if (token) {
      localStorage.setItem('marketplace_token', token);
    }
    localStorage.setItem('marketplace_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateProfile,
        isAdmin: user?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
