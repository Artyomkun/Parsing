
import { Role } from '@modelcontextprotocol/sdk/spec.types';
import { Permission, getRolePermissions } from '@server/app/core/rbac';
import { User } from '@server/app/services/user_service';
import { useContext, createContext, ReactNode } from 'react';

export type RBACUser = Pick<User, 'id' | 'role'>;

interface RBACContextType {
	hasPermission: (permission: Permission) => boolean;
	hasRole: (role: Role) => boolean;
	user: RBACUser | null;
	permissions: Set<Permission>;
}

const RBACContext = createContext<RBACContextType | undefined>(undefined);

export const useRBAC = () => {
	const context = useContext(RBACContext);
	if (context === undefined) {
		throw new Error('useRBAC must be used within an RBACProvider');
	}
	return context;
};

interface RBACProviderProps {
	children: ReactNode;
	user: RBACUser | null;
}

export const RBACProvider: React.FC<RBACProviderProps> = ({ children, user }) => {
	const permissions = user ? getRolePermissions(user.role) : new Set<Permission>();

	const hasPermission = (permission: Permission): boolean => {
		return permissions.has(permission);
	};

	const hasRole = (role: Role): boolean => {
		return user?.role === role;
	};

	const value: RBACContextType = {
		hasPermission,
		hasRole,
		user,
		permissions,
	};

	return (
		<RBACContext.Provider value={value}>
			{children}
		</RBACContext.Provider>
	);
};

export const canManageUsers = (role: Role): boolean => getRolePermissions(role).has(Permission.USER_MANAGE);
export const canDeleteUsers = (role: Role): boolean => getRolePermissions(role).has(Permission.USER_DELETE);
export const canResetPasswords = (role: Role): boolean => getRolePermissions(role).has(Permission.USER_RESET_PASSWORD);
