export type Role = 'admin' | 'manager' | 'user' | 'guest';

export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  role: Role;
  isActive: boolean;
  emailVerified: boolean;
  avatarUrl?: string;
  bio?: string;
  timezone: string;
  language: string;
  preferences?: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  lastActivity?: Date;
}

export interface UserPreferences {
  chatTheme: 'light' | 'dark' | 'auto';
  chatFontSize: 'small' | 'medium' | 'large';
  messageSound: boolean;
  typingIndicators: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  desktopNotifications: boolean;
  showOnlineStatus: boolean;
  allowDirectMessages: boolean;
  profileVisibility: 'public' | 'private' | 'friends';
}

export interface UserCreateRequest {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role: Role;
  isActive?: boolean;
}

export interface UserUpdateRequest {
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  role?: Role;
  isActive?: boolean;
  avatarUrl?: string;
  bio?: string;
  timezone?: string;
  language?: string;
  preferences?: Partial<UserPreferences>;
}

export interface UserStats {
  totalMessages: number;
  totalConversations: number;
  avgMessageLength: number;
  activeDays: number;
  lastActive?: Date;
  aiRequestsTotal: number;
  aiTokensUsed: number;
  aiRequestsToday: number;
}

export interface UserSearchResults {
  users: User[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface BulkUserOperation {
  userIds: string[];
  operation: 'activate' | 'deactivate' | 'delete';
}

// Auth related types
export interface LoginRequest {
  username: string;
  password: string;
}

// Исправлено: убрана рекурсия в Token
export interface Token {
  data: Token;
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface TokenResponse {
  success: boolean;
  data: Token;
  message?: string;
}

export interface TokenPayload {
  sub: string;
  role: Role;
  exp: number;
  iat: number;
  type: 'access' | 'refresh';
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// Admin types
export interface AdminUserCreate extends UserCreateRequest {
  emailVerified?: boolean;
}

export interface AdminUserUpdate extends UserUpdateRequest {
  emailVerified?: boolean;
}

// Response types
export interface UserResponse {
  success: boolean;
  data?: User | User[] | UserSearchResults;
  message?: string;
  error?: string;
}

// Utility types
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending';

export interface UserFilters {
  search: string;
  role: string;
  status: string;
}

export const UserRoleLabels: Record<Role, string> = {
  admin: 'Администратор',
  manager: 'Менеджер',
  user: 'Пользователь',
  guest: 'Гость'
};

export const UserStatusLabels: Record<UserStatus, string> = {
  active: 'Активный',
  inactive: 'Неактивный',
  suspended: 'Заблокирован',
  pending: 'Ожидает'
};

// Type guards
export const isUser = (obj: any): obj is User => {
  return obj && typeof obj === 'object' && 'id' in obj && 'email' in obj && 'role' in obj;
};

export const isUserArray = (obj: any): obj is User[] => {
  return Array.isArray(obj) && obj.every(isUser);
};

// Utility functions
export const getUserFullName = (user: User): string => {
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  return user.firstName || user.lastName || user.username;
};

export const getUserInitials = (user: User): string => {
  if (user.firstName && user.lastName) {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  }
  return user.username.substring(0, 2).toUpperCase();
};

export const canManageUsers = (role: Role): boolean => {
  return role === 'admin' || role === 'manager';
};

export const canDeleteUsers = (role: Role): boolean => {
  return role === 'admin';
};

export const canResetPasswords = (role: Role): boolean => {
  return role === 'admin';
};

// Default values
export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  chatTheme: 'auto',
  chatFontSize: 'medium',
  messageSound: true,
  typingIndicators: true,
  emailNotifications: true,
  pushNotifications: true,
  desktopNotifications: true,
  showOnlineStatus: true,
  allowDirectMessages: true,
  profileVisibility: 'public'
};

export const EMPTY_USER: User = {
  id: '',
  email: '',
  username: '',
  role: 'user',
  isActive: true,
  emailVerified: false,
  timezone: 'UTC',
  language: 'ru',
  preferences: DEFAULT_USER_PREFERENCES,
  createdAt: new Date(),
  updatedAt: new Date()
};

// Локальная версия PaginatedResponse для избежания циклических зависимостей
export interface UserPaginatedResponse<T = User> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}