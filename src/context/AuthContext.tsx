import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserRole, ERPUser } from '../types';

interface AuthContextType {
  user: ERPUser | null;
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ERPUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('erp_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('erp_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, role: UserRole): Promise<boolean> => {
    // Demo authentication - in production this would verify against Supabase Auth
    if (password.length < 4) return false;
    
    const demoUser: ERPUser = {
      id: crypto.randomUUID(),
      email,
      full_name: email.split('@')[0],
      role,
      created_at: new Date().toISOString(),
    };
    
    setUser(demoUser);
    localStorage.setItem('erp_user', JSON.stringify(demoUser));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('erp_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
