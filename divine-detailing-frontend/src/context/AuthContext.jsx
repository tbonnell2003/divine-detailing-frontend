// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);   // { id, email, role }
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('dd_auth');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed.user);
        setToken(parsed.token);
      } catch {}
    }
    setLoading(false);
  }, []);

  const login = (user, token) => {
    setUser(user);
    setToken(token);
    localStorage.setItem('dd_auth', JSON.stringify({ user, token }));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('dd_auth');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
