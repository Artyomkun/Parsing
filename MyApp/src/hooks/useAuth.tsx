import { LoginRequest, TokenDataSchema } from '@server/app/schemas/auth';
import { authApi } from '@server/app/services/api';
import { User } from '@server/app/services/user_service';
import { useState, useContext, createContext, ReactNode } from 'react';

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
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const login = async (username: string, password: string): Promise<boolean> => {
        setIsLoading(true);
        setError(null);

        try {
            const loginData: LoginRequest = {username, password};
            const response = await authApi.login(loginData);
            const tokenData = TokenDataSchema.parse(response);
            setToken(tokenData.access_token);
            setUser(tokenData.user as User);
            return true;
        } catch (err: any) {
            const errorMessage = err.response?.data?.detail || err.message || 'Ошибка входа';
            setError(errorMessage);
            return false;
        } finally {
            setIsLoading(false);
        }
    };
    const logout = () => {
        setUser(null);
        setToken(null);
    };
    const clearError = () => {setError(null);};
    const isAuthenticated = Boolean(token) && Boolean(user);
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