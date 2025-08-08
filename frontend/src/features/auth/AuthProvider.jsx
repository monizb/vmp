import { createContext, useContext, useEffect, useState } from 'react';
import { Role } from '../../types/models';
import { apiClient } from '../../api/client';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// No demo users; real backend authentication only

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userClaims, setUserClaims] = useState(null);
  const [loading, setLoading] = useState(true);

  async function login(email, password) {
    const res = await apiClient.post('/auth/login', { email, password });
    apiClient.setTokens({ accessToken: res.accessToken, refreshToken: res.refreshToken });
    setCurrentUser({ id: res.user.id, email: res.user.email, name: res.user.name });
    setUserClaims({ role: res.user.role, teamIds: res.user.teamIds });
    return { user: res.user };
  }

  function logout() {
    apiClient.clearTokens();
    setCurrentUser(null);
    setUserClaims(null);
    return Promise.resolve();
  }

  async function refreshUserClaims() {
    return userClaims;
  }

  useEffect(() => {
    const access = localStorage.getItem('accessToken');
    const refresh = localStorage.getItem('refreshToken');
    if (access && refresh) {
      apiClient.setTokens({ accessToken: access, refreshToken: refresh });
      // We do not yet know the user; fetch /me
      fetch((import.meta.env.VITE_API_URL || 'http://localhost:3001/api') + '/me', {
        headers: { Authorization: `Bearer ${access}` },
      })
        .then(async (r) => (r.ok ? r.json() : null))
        .then((me) => {
          if (me) {
            setCurrentUser({ id: me.id, email: me.email, name: me.name });
            setUserClaims({ role: me.role, teamIds: me.teamIds });
          }
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const value = {
    currentUser,
    userClaims,
    login,
    logout,
    refreshUserClaims,
    isAdmin: userClaims?.role === Role.Admin,
    isSecurity: userClaims?.role === Role.Security,
    isDev: userClaims?.role === Role.Dev,
    isProductOwner: userClaims?.role === Role.ProductOwner,
    userRole: userClaims?.role || Role.Dev,
    userTeamIds: userClaims?.teamIds || [],
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 