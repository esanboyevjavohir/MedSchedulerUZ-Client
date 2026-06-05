import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { UserResponseModel } from '../types';
import { userService } from '../services';

interface AuthContextType {
  user: UserResponseModel | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  mustChangePassword: boolean;
  login: (accessToken: string, refreshToken: string, userId: string, mustChange: boolean) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserResponseModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  const refreshUser = async () => {
    try {
      const res = await userService.getMyProfile();
      if (res.data?.succedded) {
        setUser(res.data.result);
      }
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const mustChange = localStorage.getItem('mustChangePassword') === 'true';
    setMustChangePassword(mustChange);

    if (token) {
      refreshUser().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = (
    accessToken: string,
    refreshToken: string,
    userId: string,
    mustChange: boolean
  ) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('userId', userId);
    localStorage.setItem('mustChangePassword', String(mustChange));
    setMustChangePassword(mustChange);
    refreshUser();
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    setMustChangePassword(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        mustChangePassword,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};