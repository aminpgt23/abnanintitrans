import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('abnan_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('abnan_token');
    if (token) {
      authAPI.me()
        .then((res) => {
          setUser(res.data.data);
          localStorage.setItem('abnan_user', JSON.stringify(res.data.data));
        })
        .catch(() => {
          localStorage.removeItem('abnan_token');
          localStorage.removeItem('abnan_user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    const res = await authAPI.login(credentials);
    const { token, user: userData } = res.data.data;
    localStorage.setItem('abnan_token', token);
    localStorage.setItem('abnan_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('abnan_token');
    localStorage.removeItem('abnan_user');
    setUser(null);
  };

  const hasRole = (...roles) => user && roles.includes(user.role);
  const isCustomer = () => user?.account_type === 'customer';
  const isStaff = () => user?.account_type !== 'customer';
  const canViewFinance = () => hasRole('finance', 'general_manager', 'super_admin');
  const canViewAllSales = () => hasRole('sales_manager', 'general_manager', 'super_admin');
  const isGM = () => hasRole('general_manager', 'super_admin');

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        loading,
        hasRole,
        isCustomer,
        isStaff,
        canViewFinance,
        canViewAllSales,
        isGM,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);