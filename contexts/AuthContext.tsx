import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔐 AuthProvider 초기화 시작');
    console.log('🔐 auth 객체:', auth);

    // 타임아웃 안전장치: 5초 후에도 loading이 true면 강제로 false 설정
    const timeoutId = setTimeout(() => {
      console.warn('⚠️ Auth 초기화 타임아웃 (5초 경과)');
      setLoading(false);
    }, 5000);

    try {
      console.log('🔐 onAuthStateChanged 리스너 등록 시도');
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        console.log('🔐 onAuthStateChanged 콜백 실행!', user ? '로그인됨' : '로그아웃됨');
        clearTimeout(timeoutId);
        setUser(user);
        setLoading(false);
      });

      console.log('🔐 onAuthStateChanged 리스너 등록 완료');

      return () => {
        console.log('🔐 AuthProvider 정리');
        clearTimeout(timeoutId);
        unsubscribe();
      };
    } catch (error) {
      console.error('❌ AuthProvider 에러:', error);
      clearTimeout(timeoutId);
      setLoading(false);
      return () => {};
    }
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
