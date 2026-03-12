// Реэкспорт всех типов из chat
export * from './chat';

// Реэкспорт всех типов из user (кроме PaginatedResponse)
export {
  Role,
  User,
  UserPreferences,
  UserCreateRequest,
  UserUpdateRequest,
  UserStats,
  UserSearchResults,
  BulkUserOperation,
  LoginRequest,
  Token,
  TokenPayload,
  PasswordResetRequest,
  PasswordResetConfirm,
  ChangePasswordRequest,
  AdminUserCreate,
  AdminUserUpdate,
  UserResponse,
  UserStatus,
  UserFilters,
  UserRoleLabels,
  UserStatusLabels,
  isUser,
  isUserArray,
  getUserFullName,
  getUserInitials,
  canManageUsers,
  canDeleteUsers,
  canResetPasswords,
  DEFAULT_USER_PREFERENCES,
  EMPTY_USER,
  UserPaginatedResponse
} from './user';

// Утилитарные типы
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Common types
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchParams extends PaginationParams {
  query: string;
  filters?: Record<string, any>;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

// Form types
export interface FormField<T = any> {
  value: T;
  error?: string;
  touched: boolean;
  required?: boolean;
}

export interface FormState {
  [key: string]: FormField;
}

// UI types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ModalState {
  isOpen: boolean;
  data?: any;
}

// Theme types
export type ThemeMode = 'light' | 'dark' | 'auto';

export interface ThemeSettings {
  mode: ThemeMode;
  primaryColor: string;
  fontSize: 'small' | 'medium' | 'large';
  borderRadius: number;
}

// API Response types
export interface BaseResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  error_code?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Service types
export interface ServiceHealth {
  status: 'healthy' | 'unhealthy';
  timestamp: Date;
  details?: Record<string, any>;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: Date;
}

// Event types
export interface AppEvent<T = any> {
  type: string;
  payload: T;
  timestamp: Date;
  source: string;
}