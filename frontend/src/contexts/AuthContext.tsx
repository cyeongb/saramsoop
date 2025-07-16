// contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { TokenManager } from '../utils/tokenUtils';

interface User {
  userId?: string;
  id?: number;
  name?: string;
  role: string;
  email?: string;
  empNo?: string;
  phone?: string;
  department?: string;
  position?: string;
  status?: string;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;  // 로딩 상태 추가
  login: (token: string, user: User) => void;
  logout: () => void;
  initializeDevToken: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);  // 로딩 상태 추가

  // localStorage 키
  const TOKEN_KEY = 'token';
  const USER_KEY = 'user';

  // localStorage에서 직접 읽기
  const getTokenFromStorage = (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  };

  const getUserFromStorage = (): User | null => {
    try {
      const userStr = localStorage.getItem(USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  };

  // 초기화 - localStorage에서 직접 읽기
  useEffect(() => {
    setIsLoading(true);  // 로딩 시작
    
    const savedToken = getTokenFromStorage();
    const savedUser = getUserFromStorage();
    
    console.log('🔍 AuthProvider 초기화 (localStorage 직접 동기화)');
    console.log('   localStorage 토큰:', savedToken ? `${savedToken.substring(0, 20)}...` : 'null');
    console.log('   localStorage 사용자:', savedUser);

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(savedUser);
      console.log('✅ localStorage에서 인증 정보 동기화됨');
    } else {
      console.log('❌ localStorage에 저장된 인증 정보 없음');
    }

    setIsInitialized(true);
    setIsLoading(false);  // 로딩 완료
  }, []);

  // localStorage 변경 감지 (다른 탭에서 로그아웃 시 동기화)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === TOKEN_KEY || e.key === USER_KEY) {
        console.log('🔄 localStorage 변경 감지:', e.key, e.newValue);
        
        const newToken = getTokenFromStorage();
        const newUser = getUserFromStorage();
        
        if (!newToken || !newUser) {
          console.log('🚪 다른 탭에서 로그아웃됨, 상태 동기화');
          setToken(null);
          setUser(null);
        } else {
          console.log('🔄 다른 탭에서 로그인됨, 상태 동기화');
          setToken(newToken);
          setUser(newUser);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // 개발용 토큰 자동 설정
  const initializeDevToken = (): boolean => {
    if (import.meta.env.NODE_ENV !== 'development') {
      return false;
    }

    const devToken = import.meta.env.VITE_DEV_TOKEN;
    console.log('개발용 토큰:', devToken);

    if (!token && devToken) {
      const devUser: User = {
        id: 1,
        userId: 'EMP001',
        name: '김관리',
        role: 'Admin',
        email: 'kim.admin@example.com',
        empNo: 'DEV001',
        department: 'IT',
        position: 'Developer',
        status: 'Active'
      };

      // localStorage에 직접 저장하고 Context 상태 업데이트
      localStorage.setItem(TOKEN_KEY, devToken);
      localStorage.setItem(USER_KEY, JSON.stringify(devUser));
      
      setToken(devToken);
      setUser(devUser);
      
      // TokenManager도 함께 업데이트 (기존 호환성 유지)
      TokenManager.setToken(devToken);
      TokenManager.setUser(devUser);
      
      console.log('🔧 개발용 토큰 자동 설정됨 (localStorage + Context + TokenManager)');
      return true;
    }

    return false;
  };

  // 로그인 (localStorage 직접 저장)
  const login = (newToken: string, newUser: User) => {
    // localStorage에 직접 저장
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    
    // Context 상태 업데이트
    setToken(newToken);
    setUser(newUser);
    
    // TokenManager도 함께 업데이트 (기존 호환성 유지)
    TokenManager.setToken(newToken);
    TokenManager.setUser(newUser);
    
    console.log('✅ 로그인 성공 (localStorage + Context + TokenManager)');
    console.log('   토큰:', newToken ? `${newToken.substring(0, 20)}...` : 'null');
    console.log('   사용자:', newUser.name);
  };

  // 로그아웃 (localStorage 직접 제거)
  const logout = () => {
    // localStorage에서 직접 제거
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    
    // Context 상태 업데이트
    setToken(null);
    setUser(null);
    
    // TokenManager도 함께 업데이트 (기존 호환성 유지)
    TokenManager.removeToken();
    
    console.log('🗑️ 로그아웃 완료 (localStorage + Context + TokenManager)');
  };

  // 로그인 상태 확인
  const isLoggedIn = Boolean(token);

  // 상태 로그 (디버깅용)
  useEffect(() => {
    if (isInitialized) {
      console.log('🔍 AuthContext 상태 업데이트:');
      console.log('   토큰:', token ? `${token.substring(0, 20)}...` : 'null');
      console.log('   사용자:', user?.name || 'null');
      console.log('   로그인 상태:', isLoggedIn);
    }
  }, [token, user, isLoggedIn, isInitialized]);

  // 개발환경에서 전역 접근 가능하게 설정
  useEffect(() => {
    if (import.meta.env.NODE_ENV === 'development') {
      (window as any).authContext = {
        token,
        user,
        isLoggedIn,
        login,
        logout,
        initializeDevToken,
        // 디버깅용 함수들
        getTokenFromStorage,
        getUserFromStorage
      };
    }
  }, [token, user, isLoggedIn]);

  const value: AuthContextType = {
    token,
    user,
    isLoggedIn,
    isLoading,  // 로딩 상태 추가
    login,
    logout,
    initializeDevToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};