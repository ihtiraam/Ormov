'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface AuthContextType {
  isLoggedIn: boolean;
  role: string | null;
  username: string | null;
  login: (user: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  // Cek sesi saat aplikasi dimuat di browser
  useEffect(() => {
    const sessionActive = sessionStorage.getItem('ormov_session_active');
    const sessionRole = sessionStorage.getItem('ormov_user_role');
    const sessionUser = sessionStorage.getItem('ormov_username');

    if (sessionActive === 'true' && sessionUser) {
      setIsLoggedIn(true);
      setRole(sessionRole);
      setUsername(sessionUser);
    }
  }, []);

  const login = async (inputUsername: string, inputPass: string) => {
    try {
      // Menggunakan .maybeSingle() agar aman dari error 406 / exception jika data tidak ditemukan
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('username', inputUsername.trim())
        .eq('password', inputPass)
        .maybeSingle();

      if (error || !data) {
        return { success: false, message: 'Username atau kata sandi salah.' };
      }

      // Jika cocok, simpan ke sessionStorage
      sessionStorage.setItem('ormov_session_active', 'true');
      sessionStorage.setItem('ormov_user_role', data.role);
      sessionStorage.setItem('ormov_username', data.username);

      // Perbarui state global secara sinkron
      setIsLoggedIn(true);
      setRole(data.role);
      setUsername(data.username);

      return { success: true };
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, message: 'Terjadi kesalahan pada sistem.' };
    }
  };

  const logout = () => {
    sessionStorage.removeItem('ormov_session_active');
    sessionStorage.removeItem('ormov_user_role');
    sessionStorage.removeItem('ormov_username');
    setIsLoggedIn(false);
    setRole(null);
    setUsername(null);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, role, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider');
  }
  return context;
}