import type {NextFunction, Request, RequestHandler, Response} from 'express';

export enum Permission {
	CHAT_READ = 'chat:read',
	CHAT_WRITE = 'chat:write',
	CHAT_DELETE = 'chat:delete',
	USER_READ = 'user:read',
	USER_MANAGE = 'user:manage',
	USER_DELETE = 'user:delete',
	USER_RESET_PASSWORD = 'user:reset_password',
	SYSTEM_CONFIG = 'system:config',
	SYSTEM_MONITOR = 'system:monitor',
	SYSTEM_BACKUP = 'system:backup',
	READ = 'read',
	WRITE = 'write',
	DELETE = 'delete',
	ADMIN = 'admin',
	MODERATE = 'moderate',
}

export enum Role {
	ADMIN = 'admin',
	MANAGER = 'manager',
	USER = 'user',
	GUEST = 'guest',
}

export const ROLE_PERMISSIONS: Record<Role, Set<Permission>> = {
	[Role.ADMIN]: new Set([
		Permission.CHAT_READ,
		Permission.CHAT_WRITE,
		Permission.CHAT_DELETE,
		Permission.USER_READ,
		Permission.USER_MANAGE,
		Permission.USER_DELETE,
		Permission.USER_RESET_PASSWORD,
		Permission.SYSTEM_CONFIG,
		Permission.SYSTEM_MONITOR,
		Permission.SYSTEM_BACKUP,
	]),
	[Role.MANAGER]: new Set([
		Permission.CHAT_READ,
		Permission.CHAT_WRITE,
		Permission.CHAT_DELETE,
		Permission.USER_READ,
		Permission.USER_MANAGE,
	]),
	[Role.USER]: new Set([Permission.CHAT_READ, Permission.CHAT_WRITE]),
	[Role.GUEST]: new Set([Permission.CHAT_READ]),
};

const ROLE_HIERARCHY: Record<Role, number> = {
	[Role.ADMIN]: 4,
	[Role.MANAGER]: 3,
	[Role.USER]: 2,
	[Role.GUEST]: 1,
};

export interface AuthUser {
	id: string;
	username: string;
	email: string;
	role: string;
	is_active: boolean;
	email_verified?: boolean;
	first_name?: string;
	last_name?: string;
}

const isRole = (value: string): value is Role => Object.values(Role).includes(value as Role);

export const getRolePermissions = (role: string): Set<Permission> => {
	if (!isRole(role)) {return new Set();}
	return ROLE_PERMISSIONS[role] ?? new Set();
};

export const hasPermission = (role: string, permission: Permission): boolean =>
    getRolePermissions(role).has(permission);

export const canEscalatePrivileges = (currentRole: string, targetRole: string): boolean => {
	if (!isRole(currentRole) || !isRole(targetRole)) {return false;}
	return ROLE_HIERARCHY[currentRole] >= ROLE_HIERARCHY[targetRole];
};

export class RBAC {
	async hasPermission(role: string, permission: Permission): Promise<boolean> {
		return hasPermission(role, permission);
	}

	async getRolePermissions(role: string): Promise<Set<Permission>> {
		return getRolePermissions(role);
	}

	async canEscalatePrivileges(currentRole: string, targetRole: string): Promise<boolean> {
		return canEscalatePrivileges(currentRole, targetRole);
	}
}

export interface AuthenticatedRequest extends Request {
	user?: AuthUser;
}

export const requirePermission = (...permissions: Permission[]): RequestHandler => {
	return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		const user = req.user;

		if (!user) {
			res.status(401).json({detail: 'Authentication required'});
			return;
		}

		const userPermissions = getRolePermissions(user.role);

		for (const perm of permissions) {
			if (!userPermissions.has(perm)) {
				res.status(403).json({
					detail: `Insufficient permissions. Required: ${perm}`,
				});
				return;
			}
		}

		next();
	};
};

export const permission = (perm: Permission): RequestHandler => requirePermission(perm);

export const anyPermission = (...permissions: Permission[]): RequestHandler => {
	return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		const user = req.user;

		if (!user) {
			res.status(401).json({detail: 'Authentication required'});
			return;
		}

		const userPermissions = getRolePermissions(user.role);
		const hasAny = permissions.some((perm) => userPermissions.has(perm));

		if (!hasAny) {
			res.status(403).json({
				detail: `Insufficient permissions. Required any of: ${permissions.join(', ')}`,
			});
			return;
		}

		next();
	};
};