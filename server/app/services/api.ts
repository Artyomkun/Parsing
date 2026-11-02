import axios, { type AxiosInstance, type AxiosError, AxiosRequestConfig } from 'axios';

import type {
	LoginRequest,
	Token,
	UserCreateRequest,
	UserResponse,
	UserUpdateRequest,
	ChangePasswordRequest,
	ChatSettings,
	CreateConversationRequest,
	SendMessageRequest,
	Conversation,
	ConversationListResponse,
	SendMessageResponse,
	SearchResults,
	UserChatPreferences,
	ChatAnalytics,
	StreamChunk,
} from '../schemas/auth';

const API_BASE_URL = import.meta.env.BASE_URL;
const API_TIMEOUT = 30000;

interface ApiResponse<T> {
	success: boolean;
	data?: T;
	message?: string;
	error?: string;
}

export interface MessageStreamHandlers {
	onChunk: (chunk: StreamChunk) => void;
	onComplete: (chunk: StreamChunk, conversationId?: string) => void;
	onError: (message: string) => void;
}

const parseSseEvent = (raw: string): { event: string; data: unknown } | null => {
    let event = 'message';
    const dataLines: string[] = [];

    for (const line of raw.split('\n')) {
        if (line.startsWith('event:')) {event = line.slice(6).trim();}
        else if (line.startsWith('data:')) {dataLines.push(line.slice(5).trim());}
    }

    if (dataLines.length === 0) {return null;}

    try {
        return { event, data: JSON.parse(dataLines.join('\n')) };
    } catch {
        return null;
    }
};

class ApiService {
    private client: AxiosInstance;
    private token: string | null = null;

    constructor() {
        this.client = axios.create({
            baseURL: API_BASE_URL,
            timeout: API_TIMEOUT,
            headers: { 'Content-Type': 'application/json' },
        });

        this.client.interceptors.request.use((config) => {
            if (this.token) {config.headers.Authorization = `Bearer ${this.token}`;}
            return config;
        });

        this.client.interceptors.response.use(
            (response) => response,
            (error: AxiosError) => {
                this.handleApiError(error);
                return Promise.reject(error);
            },
        );

        this.token = localStorage.getItem('access_token');
    }

    private handleApiError(error: AxiosError): void {
        if (!error.response) {
            console.error('Network error:', error.message);
            return;
        }

        const { status, data } = error.response;

        if (status === 401) {
            this.clearToken();
        }

        console.error(`API error ${status}:`, data);
    }

    private async request<T>(config: AxiosRequestConfig): Promise<T> {
        const response = await this.client.request<ApiResponse<T>>(config);

        if (!response.data.success || response.data.data === undefined) {
            throw new Error(
                response.data.message ?? response.data.error ?? 'API request failed'
            );
        }

        return response.data.data;
    }

    public setToken(token: string): void {
        this.token = token;
        localStorage.setItem('access_token', token);
    }

    public clearToken(): void {
        this.token = null;
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
    }

    public async login(credentials: LoginRequest): Promise<Token> {
        const response = await this.client.post<Token>('/auth/login', credentials);
        const token = response.data;

        if (!token.access_token) {
            throw new Error('Login failed: no access token');
        }

        this.setToken(token.access_token);
        return token;
    }

    public async register(userData: UserCreateRequest): Promise<UserResponse> {
        return this.request<UserResponse>({
            method: 'POST',
            url: '/auth/register',
            data: userData,
        });
    }

    public async logout(): Promise<void> {
        await this.request<void>({ method: 'POST', url: '/auth/logout' });
        this.clearToken();
    }

    public async refreshToken(refreshToken: string): Promise<Token> {
        const response = await this.request<Token>({
            method: 'POST',
            url: '/auth/refresh',
            data: { refresh_token: refreshToken },
        });

        if (response.access_token) {this.setToken(response.access_token);}
        return response;
    }

    public async forgotPassword(email: string): Promise<void> {
        return this.request<void>({
            method: 'POST',
            url: '/auth/forgot-password',
            data: { email },
        });
    }

    public async resetPassword(token: string, newPassword: string): Promise<void> {
        return this.request<void>({
            method: 'POST',
            url: '/auth/reset-password',
            data: { token, new_password: newPassword },
        });
    }

    public async changePassword(data: ChangePasswordRequest): Promise<void> {
        return this.request<void>({
            method: 'POST',
            url: '/auth/change-password',
            data,
        });
    }

    public async getCurrentUser(): Promise<UserResponse> {
        return this.request<UserResponse>({ method: 'GET', url: '/auth/me' });
    }

    public async updateProfile(userData: Partial<UserUpdateRequest>): Promise<UserResponse> {
        return this.request<UserResponse>({
            method: 'PUT',
            url: '/auth/me',
            data: userData,
        });
    }

    public async sendMessage(messageData: SendMessageRequest): Promise<SendMessageResponse> {
        return this.request<SendMessageResponse>({
            method: 'POST',
            url: '/chat/message',
            data: messageData,
        });
    }

    public sendMessageStream(
        messageData: SendMessageRequest,
        handlers: MessageStreamHandlers,
    ): () => void {
        const controller = new AbortController();

        const run = async (): Promise<void> => {
            try {
                const response = await fetch(`${API_BASE_URL}/chat/message/stream`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'text/event-stream',
                        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
                    },
                    body: JSON.stringify(messageData),
                    signal: controller.signal,
                });

                if (!response.ok || !response.body) {
                    throw new Error(`Stream failed (${response.status})`);
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';

                const handleEvent = (raw: string): void => {
                    const parsed = parseSseEvent(raw);
                    if (!parsed) {return;}

                    const { event, data } = parsed;
                    const payload = (data as { data?: unknown })?.data ?? data;

                    if (event === 'chunk') {
                        handlers.onChunk(payload as StreamChunk);
                    } else if (event === 'complete') {
                        handlers.onComplete(payload as StreamChunk, (data as { conversation_id?: string })?.conversation_id);
                    } else if (event === 'error') {
                        const message = (payload as { chunk?: string })?.chunk ?? 'Stream error';
                        handlers.onError(message);
                    }
                };

                while (true) {
                    const { value, done } = await reader.read();
                    if (done) {break;}

                    buffer += decoder.decode(value, { stream: true });
                    const events = buffer.split('\n\n');
                    buffer = events.pop() ?? '';

                    for (const raw of events) {handleEvent(raw);}
                }

                if (buffer.trim()) {handleEvent(buffer);}
            } catch (err: unknown) {
                if (controller.signal.aborted) {return;}
                handlers.onError(err instanceof Error ? err.message : 'Stream error');
            }
        };

        void run();
        return () => controller.abort();
    }

    public async createConversation(data: CreateConversationRequest): Promise<Conversation> {
        const response = await this.request<{ conversation: Conversation }>({
            method: 'POST',
            url: '/chat/conversations',
            data,
        });
        return response.conversation;
    }

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
            url: '/chat/conversations',
            params,
        });
    }

    public async getConversation(conversationId: string): Promise<Conversation> {
        return this.request<Conversation>({
            method: 'GET',
            url: `/chat/conversations/${conversationId}`,
        });
    }

    public async updateConversation(
        conversationId: string,
        updateData: Partial<Conversation>,
    ): Promise<Conversation> {
        return this.request<Conversation>({
            method: 'PUT',
            url: `/chat/conversations/${conversationId}`,
            data: updateData,
        });
    }

    public async deleteConversation(conversationId: string): Promise<void> {
        return this.request<void>({
            method: 'DELETE',
            url: `/chat/conversations/${conversationId}`,
        });
    }

    public async searchMessages(query: string, conversationId?: string): Promise<SearchResults> {
        return this.request<SearchResults>({
            method: 'GET',
            url: '/chat/search',
            params: { q: query, conversation_id: conversationId },
        });
    }

    public async getChatSettings(): Promise<UserChatPreferences> {
        return this.request<UserChatPreferences>({ method: 'GET', url: '/chat/settings' });
    }

    public async updateChatSettings(settings: Partial<ChatSettings>): Promise<UserChatPreferences> {
        return this.request<UserChatPreferences>({
            method: 'PUT',
            url: '/chat/settings',
            data: settings,
        });
    }

    public async getChatAnalytics(): Promise<ChatAnalytics> {
        return this.request<ChatAnalytics>({ method: 'GET', url: '/chat/analytics' });
    }

    public async getUsers(params?: {
        skip?: number;
        limit?: number;
        active_only?: boolean;
    }): Promise<{ users: UserResponse[]; total: number }> {
        return this.request({
            method: 'GET',
            url: '/auth/admin/users',
            params,
        });
    }

    public async createUser(userData: UserCreateRequest): Promise<UserResponse> {
        return this.request<UserResponse>({
            method: 'POST',
            url: '/auth/admin/users',
            data: userData,
        });
    }

    public async updateUser(userId: string, userData: Partial<UserUpdateRequest>): Promise<UserResponse> {
        return this.request<UserResponse>({
            method: 'PUT',
            url: `/auth/admin/users/${userId}`,
            data: userData,
        });
    }

    public async deleteUser(userId: string): Promise<void> {
        return this.request<void>({
            method: 'DELETE',
            url: `/auth/admin/users/${userId}`,
        });
    }

    public async activateUser(userId: string): Promise<UserResponse> {
        return this.request<UserResponse>({
            method: 'POST',
            url: `/auth/admin/users/${userId}/activate`,
        });
    }

    public async deactivateUser(userId: string): Promise<UserResponse> {
        return this.request<UserResponse>({
            method: 'POST',
            url: `/auth/admin/users/${userId}/deactivate`,
        });
    }

    public async resetUserPassword(userId: string): Promise<void> {
        return this.request<void>({
            method: 'POST',
            url: `/auth/admin/users/${userId}/reset-password`,
        });
    }

    public async uploadFile(
        file: File,
        onProgress?: (progress: number) => void,
    ): Promise<{ url: string; id: string }> {
        const formData = new FormData();
        formData.append('file', file);

        const response = await this.client.post<ApiResponse<{ url: string; id: string }>>(
            '/files/upload',
            formData,
            {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (event) => {
                    if (onProgress && event.total) {
                      onProgress(Math.round((event.loaded * 100) / event.total));
                    }
                },
            },
        );

        if (!response.data.success || !response.data.data) {
            throw new Error(response.data.message ?? 'File upload failed');
        }

        return response.data.data;
    }

    public async deleteFile(fileId: string): Promise<void> {
        return this.request<void>({
            method: 'DELETE',
            url: `/files/${fileId}`,
        });
    }

    public async healthCheck(): Promise<{ status: string; timestamp: string }> {
        const response = await this.client.get<{ status: string; timestamp: string }>('/health');
        return response.data;
    }
}

export const apiService = new ApiService();

export const authApi = {
    login: (credentials: LoginRequest) => apiService.login(credentials),
    register: (userData: UserCreateRequest) => apiService.register(userData),
    logout: () => apiService.logout(),
    refreshToken: (token: string) => apiService.refreshToken(token),
    forgotPassword: (email: string) => apiService.forgotPassword(email),
    resetPassword: (token: string, newPassword: string) => apiService.resetPassword(token, newPassword),
    changePassword: (data: ChangePasswordRequest) => apiService.changePassword(data),
    getCurrentUser: () => apiService.getCurrentUser(),
    updateProfile: (data: Partial<UserUpdateRequest>) => apiService.updateProfile(data),
};

export const chatApi = {
    sendMessage: (data: SendMessageRequest) => apiService.sendMessage(data),
    sendMessageStream: (data: SendMessageRequest, handlers: MessageStreamHandlers) => apiService.sendMessageStream(data, handlers),
    createConversation: (data: CreateConversationRequest) => apiService.createConversation(data),
    getConversations: (params?: Parameters<typeof apiService.getConversations>[0]) => apiService.getConversations(params),
    getConversation: (id: string) => apiService.getConversation(id),
    updateConversation: (id: string, data: Partial<Conversation>) => apiService.updateConversation(id, data),
    deleteConversation: (id: string) => apiService.deleteConversation(id),
    searchMessages: (query: string, conversationId?: string) => apiService.searchMessages(query, conversationId),
    getChatSettings: () => apiService.getChatSettings(),
    updateChatSettings: (settings: Partial<ChatSettings>) => apiService.updateChatSettings(settings),
    getChatAnalytics: () => apiService.getChatAnalytics(),
};

export const adminApi = {
    getUsers: (params?: Parameters<typeof apiService.getUsers>[0]) => apiService.getUsers(params),
    createUser: (data: UserCreateRequest) => apiService.createUser(data),
    updateUser: (id: string, data: Partial<UserUpdateRequest>) => apiService.updateUser(id, data),
    deleteUser: (id: string) => apiService.deleteUser(id),
    activateUser: (id: string) => apiService.activateUser(id),
    deactivateUser: (id: string) => apiService.deactivateUser(id),
    resetUserPassword: (id: string) => apiService.resetUserPassword(id),
};

export const filesApi = {
    uploadFile: (file: File, onProgress?: (progress: number) => void) => apiService.uploadFile(file, onProgress),
    deleteFile: (id: string) => apiService.deleteFile(id),
};