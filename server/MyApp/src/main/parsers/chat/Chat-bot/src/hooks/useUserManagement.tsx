import { useState, useCallback } from 'react';
import { User, UserCreateRequest, UserUpdateRequest } from '../types/user';
import { adminApi } from '../services/api';

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
      setUsers(response.data || []);
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
      if (response.success && response.data) {
        const newUser = response.data as User;
        setUsers(prev => [newUser, ...prev]);
        return newUser;
      } else {
        throw new Error(response.message || 'Ошибка создания пользователя');
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка создания пользователя');
      throw err;
    }
  }, []);

  const updateUser = useCallback(async (userId: string, userData: UserUpdateRequest): Promise<User> => {
    setError(null);
    try {
      const response = await adminApi.updateUser(userId, userData);
      if (response.success && response.data) {
        const updatedUser = response.data as User;
        setUsers(prev => prev.map(user => 
          user.id === userId ? updatedUser : user
        ));
        return updatedUser;
      } else {
        throw new Error(response.message || 'Ошибка обновления пользователя');
      }
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
    return updateUser(userId, { isActive: true });
  }, [updateUser]);

  const deactivateUser = useCallback(async (userId: string): Promise<User> => {
    return updateUser(userId, { isActive: false });
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