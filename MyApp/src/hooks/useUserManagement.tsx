
import { UserCreateRequest, UserUpdateRequest } from '@server/app/schemas/auth';
import { adminApi } from '@server/app/services/api';
import { User } from '@server/app/services/user_service';
import { useState, useCallback } from 'react';

export const useUserManagement = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchUsers = useCallback(async (params?: {
      skip?: number;
      limit?: number;
      active_only?: boolean;
    }) => {
        setLoading(true);
        setError(null);
        try {
            const response = await adminApi.getUsers(params);
            setUsers(response.users as unknown as User[]);
        } catch (err: any) {
            setError(err.message || 'Ошибка загрузки пользователей');
        } finally {
            setLoading(false);
        }
    }, []);

    const createUser = useCallback(async (userData: UserCreateRequest): Promise<User> => {
        setError(null);
        try {
            const response = await adminApi.createUser(userData);
            const newUser = response as unknown as User;
            setUsers(prev => [newUser, ...prev]);
            return newUser;
        } catch (err: any) {
            setError(err.message || 'Ошибка создания пользователя');
            throw err;
        }
    }, []);

    const updateUser = useCallback(async (userId: string, userData: UserUpdateRequest): Promise<User> => {
        setError(null);
        try {
            const response = await adminApi.updateUser(userId, userData);
            const updatedUser = response as unknown as User;
            setUsers(prev => prev.map(user => user.id === userId ? updatedUser : user));
            return updatedUser;
        } catch (err: any) {
            setError(err.message || 'Ошибка обновления пользователя');
            throw err;
        }
    }, []);

    const deleteUser = useCallback(async (userId: string): Promise<void> => {
        setError(null);
        try {
            await adminApi.deleteUser(userId);
            setUsers(prev => prev.filter(user => user.id !== userId));
        } catch (err: any) {
            setError(err.message || 'Ошибка удаления пользователя');
            throw err;
        }
    }, []);

    const resetUserPassword = useCallback(async (userId: string): Promise<void> => {
      setError(null);
      try {
          await adminApi.resetUserPassword(userId);
      } catch (err: any) {
          setError(err.message || 'Ошибка сброса пароля');
          throw err;
      }
    }, []);

    const activateUser = useCallback(async (userId: string): Promise<User> => {
        return updateUser(userId, { is_active: true });
    }, [updateUser]);

    const deactivateUser = useCallback(async (userId: string): Promise<User> => {
        return updateUser(userId, { is_active: false });
    }, [updateUser]);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        users,
        loading,
        error,
        fetchUsers,
        createUser,
        updateUser,
        deleteUser,
        resetUserPassword,
        activateUser,
        deactivateUser,
        clearError,
    };
};
