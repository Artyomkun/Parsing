import { useState, useContext, createContext, ReactNode } from 'react';
import { authApi } from '../services/api';
import { User, Token, LoginRequest } from '../types/user';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  isAuthenticated: boolean;
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
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState<string | null>(localStorage.getItem('access_token'));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Функция входа
  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Исправлено: передаем объект LoginRequest вместо FormData
      const loginData: LoginRequest = {
        username,
        password
      };

      const response = await authApi.login(loginData);
      
      // В зависимости от структуры ответа API
      const tokenData: Token = response.data || response;

      // Сохраняем токен и пользователя
      setToken(tokenData.access_token);
      setUser(tokenData.user);

      // Сохраняем в localStorage
      localStorage.setItem('access_token', tokenData.access_token);
      localStorage.setItem('refresh_token', tokenData.refresh_token);
      localStorage.setItem('user', JSON.stringify(tokenData.user));

      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Ошибка входа';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Функция выхода
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  };

  // Очистка ошибок
  const clearError = () => {
    setError(null);
  };

  // Проверка аутентификации
  const isAuthenticated = !!token && !!user;

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    error,
    login,
    logout,
    clearError,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};