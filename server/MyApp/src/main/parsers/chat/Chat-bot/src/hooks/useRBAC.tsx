import { useContext, createContext, ReactNode } from 'react';
import { Role } from '../types/user';

export type Permission = 
  | 'user:read'
  | 'user:manage'
  | 'user:delete'
  | 'user:reset_password'
  | 'chat:read'
  | 'chat:write'
  | 'chat:delete'
  | 'system:config'
  | 'system:monitor'
  | 'system:backup';

interface RBACContextType {
  hasPermission: (permission: Permission) => boolean;
  hasRole: (role: Role) => boolean;
  user: { role: Role } | null;
  permissions: Permission[];
}

const RBACContext = createContext<RBACContextType | undefined>(undefined);

// Маппинг ролей на права
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    'user:read', 'user:manage', 'user:delete', 'user:reset_password',
    'chat:read', 'chat:write', 'chat:delete',
    'system:config', 'system:monitor', 'system:backup'
  ],
  manager: [
    'user:read', 'user:manage',
    'chat:read', 'chat:write', 'chat:delete'
  ],
  user: [
    'chat:read', 'chat:write'
  ],
  guest: [
    'chat:read'
  ]
};

export const useRBAC = () => {
  const context = useContext(RBACContext);
  if (context === undefined) {
    throw new Error('useRBAC must be used within an RBACProvider');
  }
  return context;
};

interface RBACProviderProps {
  children: ReactNode;
  user: { role: Role } | null;
}

export const RBACProvider: React.FC<RBACProviderProps> = ({ children, user }) => {
  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    return ROLE_PERMISSIONS[user.role]?.includes(permission) || false;
  };

  const hasRole = (role: Role): boolean => {
    return user?.role === role;
  };

  const permissions = user ? ROLE_PERMISSIONS[user.role] || [] : [];

  const value: RBACContextType = {
    hasPermission,
    hasRole,
    user,
    permissions
  };

  return (
    <RBACContext.Provider value={value}>
      {children}
    </RBACContext.Provider>
  );
};

// Утилитарные функции
export const canManageUsers = (role: Role): boolean => {
  return ['admin', 'manager'].includes(role);
};

export const canDeleteUsers = (role: Role): boolean => {
  return role === 'admin';
};

export const canResetPasswords = (role: Role): boolean => {
  return role === 'admin';
};

export const getRolePermissions = (role: Role): Permission[] => {
  return ROLE_PERMISSIONS[role] || [];
};