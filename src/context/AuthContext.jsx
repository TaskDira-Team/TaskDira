import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getCurrentUser().then((u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const login = useCallback(async (email, password) => {
    setError(null);
    try {
      const loggedIn = await api.login(email, password);
      setUser(loggedIn);
      return loggedIn;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const register = useCallback(async (onboardingData) => {
    setError(null);
    try {
      const newUser = await api.registerWithOnboarding({
        ...onboardingData,
        fullName: onboardingData.fullName || onboardingData.name,
        avatarState: onboardingData.avatarState || onboardingData.avatarConfig,
      });
      setUser(newUser);
      return newUser;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const updateProfile = useCallback(async (updates) => {
    if (!user) return;
    const updated = await api.updateProfile(user.id, updates);
    setUser(updated);
    return updated;
  }, [user]);

  const uploadAvatarImage = useCallback(async (file) => {
    if (!user) return;
    const updated = await api.uploadAvatarImage(user.id, file);
    setUser(updated);
    return updated;
  }, [user]);

  const syncUser = useCallback(async () => {
    const refreshed = await api.refreshCurrentUser();
    if (refreshed) setUser(refreshed);
    return refreshed;
  }, []);

  const logout = useCallback(async () => {
    setError(null);
    await api.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, updateProfile, uploadAvatarImage, syncUser, logout, setError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
