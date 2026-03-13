import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { 
  User, UserCreateRequest, UserUpdateRequest, UserResponse, Token, 
  LoginRequest, ChangePasswordRequest, PasswordResetRequest,
  UserPaginatedResponse
} from '../types/user';
import {
  SendMessageRequest, SendMessageResponse, CreateConversationRequest,
  Conversation, Message, ConversationListResponse, SearchResults,
  ChatSettings, UserChatPreferences, ChatAnalytics
} from '../types/chat';

// Базовые типы для API ответов
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  error_code?: string;
}

// Конфигурация API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const API_TIMEOUT = 30000; // 30 seconds

/**
 * Сервис для работы с API
 */
class ApiService {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
    this.loadTokenFromStorage();
  }

  /**
   * Настройка интерцепторов для запросов и ответов
   */
  private setupInterceptors(): void {
    // Интерцептор запросов - добавляем токен авторизации
    this.client.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Интерцептор ответов - обработка ошибок
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        this.handleApiError(error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Обработка ошибок API
   */
  private handleApiError(error: AxiosError): void {
    if (error.response) {
      // Сервер ответил с ошибкой
      const status = error.response.status;
      const data = error.response.data as any;

      switch (status) {
        case 401:
          console.error('Unauthorized access - redirect to login');
          this.clearToken();
          // Можно добавить редирект на страницу логина
          break;
        case 403:
          console.error('Forbidden - insufficient permissions');
          break;
        case 404:
          console.error('Resource not found');
          break;
        case 429:
          console.error('Rate limit exceeded');
          break;
        case 500:
          console.error('Internal server error');
          break;
        default:
          console.error('API error:', error.message);
      }

      console.error('Error details:', data);
    } else if (error.request) {
      // Запрос был сделан, но ответ не получен
      console.error('Network error - no response received:', error.request);
    } else {
      // Что-то пошло не так при настройке запроса
      console.error('Request setup error:', error.message);
    }
  }

  /**
   * Загрузка токена из localStorage
   */
  private loadTokenFromStorage(): void {
    this.token = localStorage.getItem('access_token');
  }

  /**
   * Установка токена авторизации
   */
  public setToken(token: string): void {
    this.token = token;
    localStorage.setItem('access_token', token);
  }

  /**
   * Очистка токена
   */
  public clearToken(): void {
    this.token = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  }

  /**
   * Базовый метод для выполнения запросов
   */
  private async request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.client(config);
      
      if (response.data.success) {
        return response.data.data as T;
      } else {
        throw new Error(response.data.message || 'API request failed');
      }
    } catch (error) {
      throw error;
    }
  }

  // ==================== АУТЕНТИФИКАЦИЯ ====================

  /**
   * Вход в систему
   */
  public async login(credentials: LoginRequest): Promise<Token> {
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    const response = await this.client.post<ApiResponse<Token>>(
      '/api/auth/login',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    if (response.data.success && response.data.data) {
      this.setToken(response.data.data.access_token);
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Login failed');
    }
  }

  /**
   * Регистрация нового пользователя
   */
  public async register(userData: UserCreateRequest): Promise<UserResponse> {
    return this.request<UserResponse>({
      method: 'POST',
      url: '/api/auth/register',
      data: userData,
    });
  }

  /**
   * Выход из системы
   */
  public async logout(): Promise<void> {
    await this.request({
      method: 'POST',
      url: '/api/auth/logout',
    });
    this.clearToken();
  }

  /**
   * Обновление токена
   */
  public async refreshToken(refreshToken: string): Promise<Token> {
    const response = await this.request<Token>({
      method: 'POST',
      url: '/api/auth/refresh',
      data: { refresh_token: refreshToken },
    });

    if (response.access_token) {
      this.setToken(response.access_token);
    }

    return response;
  }

  /**
   * Запрос сброса пароля
   */
  public async forgotPassword(email: string): Promise<void> {
    return this.request({
      method: 'POST',
      url: '/api/auth/forgot-password',
      data: { email },
    });
  }

  /**
   * Сброс пароля с токеном
   */
  public async resetPassword(token: string, newPassword: string): Promise<void> {
    return this.request({
      method: 'POST',
      url: '/api/auth/reset-password',
      data: {
        token,
        new_password: newPassword,
      },
    });
  }

  /**
   * Изменение пароля
   */
  public async changePassword(data: ChangePasswordRequest): Promise<void> {
    return this.request({
      method: 'POST',
      url: '/api/auth/change-password',
      data,
    });
  }

  /**
   * Получение информации о текущем пользователе
   */
  public async getCurrentUser(): Promise<UserResponse> {
    return this.request<UserResponse>({
      method: 'GET',
      url: '/api/auth/me',
    });
  }

  /**
   * Обновление профиля пользователя
   */
  public async updateProfile(userData: Partial<UserUpdateRequest>): Promise<UserResponse> {
    return this.request<UserResponse>({
      method: 'PUT',
      url: '/api/auth/me',
      data: userData,
    });
  }

  // ==================== ЧАТ И СООБЩЕНИЯ ====================

  /**
   * Отправка сообщения (не потоковое)
   */
  public async sendMessage(messageData: SendMessageRequest): Promise<SendMessageResponse> {
    return this.request<SendMessageResponse>({
      method: 'POST',
      url: '/api/chat/message',
      data: messageData,
    });
  }

  /**
   * Создание нового диалога
   */
  public async createConversation(conversationData: CreateConversationRequest): Promise<Conversation> {
    return this.request<Conversation>({
      method: 'POST',
      url: '/api/chat/conversations',
      data: conversationData,
    });
  }

  /**
   * Получение списка диалогов
   */
  public async getConversations(params?: {
    skip?: number;
    limit?: number;
    search?: string;
    tags?: string[];
    pinned_only?: boolean;
    archived_only?: boolean;
  }): Promise<ConversationListResponse> {
    return this.request<ConversationListResponse>({
      method: 'GET',
      url: '/api/chat/conversations',
      params,
    });
  }

  /**
   * Получение конкретного диалога с сообщениями
   */
  public async getConversation(conversationId: string): Promise<Conversation> {
    return this.request<Conversation>({
      method: 'GET',
      url: `/api/chat/conversations/${conversationId}`,
    });
  }

  /**
   * Обновление диалога
   */
  public async updateConversation(
    conversationId: string,
    updateData: Partial<Conversation>
  ): Promise<Conversation> {
    return this.request<Conversation>({
      method: 'PUT',
      url: `/api/chat/conversations/${conversationId}`,
      data: updateData,
    });
  }

  /**
   * Удаление диалога
   */
  public async deleteConversation(conversationId: string): Promise<void> {
    return this.request({
      method: 'DELETE',
      url: `/api/chat/conversations/${conversationId}`,
    });
  }

  /**
   * Закрепление/открепление диалога
   */
  public async pinConversation(conversationId: string): Promise<Conversation> {
    return this.request<Conversation>({
      method: 'POST',
      url: `/api/chat/conversations/${conversationId}/pin`,
    });
  }

  /**
   * Архивация диалога
   */
  public async archiveConversation(conversationId: string): Promise<Conversation> {
    return this.request<Conversation>({
      method: 'POST',
      url: `/api/chat/conversations/${conversationId}/archive`,
    });
  }

  /**
   * Поиск сообщений
   */
  public async searchMessages(query: string, conversationId?: string): Promise<SearchResults> {
    return this.request<SearchResults>({
      method: 'GET',
      url: '/api/chat/search',
      params: {
        q: query,
        conversation_id: conversationId,
      },
    });
  }

  // ==================== НАСТРОЙКИ ЧАТА ====================

  /**
   * Получение настроек чата пользователя
   */
  public async getChatSettings(): Promise<UserChatPreferences> {
    return this.request<UserChatPreferences>({
      method: 'GET',
      url: '/api/chat/settings',
    });
  }

  /**
   * Обновление настроек чата
   */
  public async updateChatSettings(settings: Partial<ChatSettings>): Promise<UserChatPreferences> {
    return this.request<UserChatPreferences>({
      method: 'PUT',
      url: '/api/chat/settings',
      data: settings,
    });
  }

  // ==================== АДМИНИСТРИРОВАНИЕ ====================

  /**
   * Получение списка всех пользователей (админ)
   */
  public async getUsers(params?: {
    skip?: number;
    limit?: number;
    active_only?: boolean;
  }): Promise<UserPaginatedResponse<User>> {
    return this.request<UserPaginatedResponse<User>>({
      method: 'GET',
      url: '/api/auth/admin/users',
      params,
    });
  }

  /**
   * Создание пользователя (админ)
   */
  public async createUser(userData: UserCreateRequest): Promise<UserResponse> {
    return this.request<UserResponse>({
      method: 'POST',
      url: '/api/auth/admin/users',
      data: userData,
    });
  }

  /**
   * Обновление пользователя (админ)
   */
  public async updateUser(userId: string, userData: Partial<UserUpdateRequest>): Promise<UserResponse> {
    return this.request<UserResponse>({
      method: 'PUT',
      url: `/api/auth/admin/users/${userId}`,
      data: userData,
    });
  }

  /**
   * Удаление пользователя (админ)
   */
  public async deleteUser(userId: string): Promise<void> {
    return this.request({
      method: 'DELETE',
      url: `/api/auth/admin/users/${userId}`,
    });
  }

  /**
   * Активация пользователя (админ)
   */
  public async activateUser(userId: string): Promise<UserResponse> {
    return this.request<UserResponse>({
      method: 'POST',
      url: `/api/auth/admin/users/${userId}/activate`,
    });
  }

  /**
   * Деактивация пользователя (админ)
   */
  public async deactivateUser(userId: string): Promise<UserResponse> {
    return this.request<UserResponse>({
      method: 'POST',
      url: `/api/auth/admin/users/${userId}/deactivate`,
    });
  }

  /**
   * Сброс пароля пользователя (админ)
   */
  public async resetUserPassword(userId: string): Promise<void> {
    return this.request({
      method: 'POST',
      url: `/api/auth/admin/users/${userId}/reset-password`,
    });
  }

  /**
   * Получение аналитики чата (админ)
   */
  public async getChatAnalytics(): Promise<ChatAnalytics> {
    return this.request<ChatAnalytics>({
      method: 'GET',
      url: '/api/chat/analytics',
    });
  }

  // ==================== ФАЙЛЫ И МЕДИА ====================

  /**
   * Загрузка файла
   */
  public async uploadFile(file: File, onProgress?: (progress: number) => void): Promise<{ url: string; id: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.client.post<ApiResponse<{ url: string; id: string }>>(
      '/api/files/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      }
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'File upload failed');
    }
  }

  /**
   * Удаление файла
   */
  public async deleteFile(fileId: string): Promise<void> {
    return this.request({
      method: 'DELETE',
      url: `/api/files/${fileId}`,
    });
  }

  // ==================== УТИЛИТЫ ====================

  /**
   * Проверка здоровья API
   */
  public async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await this.client.get<{ status: string; timestamp: string }>(
      '/api/health'
    );
    return response.data;
  }

  /**
   * Получение CSRF токена (если используется)
   */
  public async getCsrfToken(): Promise<string> {
    const response = await this.client.get<{ csrf_token: string }>('/api/csrf-token');
    return response.data.csrf_token;
  }
}

// Создаем экземпляр сервиса
export const apiService = new ApiService();

// Экспортируем отдельные сервисы для удобства
export const authApi = {
  login: (credentials: LoginRequest) => apiService.login(credentials),
  register: (userData: UserCreateRequest) => apiService.register(userData),
  logout: () => apiService.logout(),
  refreshToken: (refreshToken: string) => apiService.refreshToken(refreshToken),
  forgotPassword: (email: string) => apiService.forgotPassword(email),
  resetPassword: (token: string, newPassword: string) => apiService.resetPassword(token, newPassword),
  changePassword: (data: ChangePasswordRequest) => apiService.changePassword(data),
  getCurrentUser: () => apiService.getCurrentUser(),
  updateProfile: (userData: Partial<UserUpdateRequest>) => apiService.updateProfile(userData),
};

export const chatApi = {
  sendMessage: (messageData: SendMessageRequest) => apiService.sendMessage(messageData),
  createConversation: (conversationData: CreateConversationRequest) => apiService.createConversation(conversationData),
  getConversations: (params?: any) => apiService.getConversations(params),
  getConversation: (conversationId: string) => apiService.getConversation(conversationId),
  updateConversation: (conversationId: string, updateData: Partial<Conversation>) => 
    apiService.updateConversation(conversationId, updateData),
  deleteConversation: (conversationId: string) => apiService.deleteConversation(conversationId),
  pinConversation: (conversationId: string) => apiService.pinConversation(conversationId),
  archiveConversation: (conversationId: string) => apiService.archiveConversation(conversationId),
  searchMessages: (query: string, conversationId?: string) => apiService.searchMessages(query, conversationId),
  getChatSettings: () => apiService.getChatSettings(),
  updateChatSettings: (settings: Partial<ChatSettings>) => apiService.updateChatSettings(settings),
};

export const adminApi = {
  getUsers: (params?: any) => apiService.getUsers(params),
  createUser: (userData: UserCreateRequest) => apiService.createUser(userData),
  updateUser: (userId: string, userData: Partial<UserUpdateRequest>) => apiService.updateUser(userId, userData),
  deleteUser: (userId: string) => apiService.deleteUser(userId),
  activateUser: (userId: string) => apiService.activateUser(userId),
  deactivateUser: (userId: string) => apiService.deactivateUser(userId),
  resetUserPassword: (userId: string) => apiService.resetUserPassword(userId),
  getChatAnalytics: () => apiService.getChatAnalytics(),
};

export const filesApi = {
  uploadFile: (file: File, onProgress?: (progress: number) => void) => apiService.uploadFile(file, onProgress),
  deleteFile: (fileId: string) => apiService.deleteFile(fileId),
};

// Экспортируем базовый сервис для кастомных запросов
export default apiService;