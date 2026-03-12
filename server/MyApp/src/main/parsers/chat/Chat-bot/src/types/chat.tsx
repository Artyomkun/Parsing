// Базовые типы сообщений
export interface Message {
  id: string;
  content: string;
  role: MessageRole;
  timestamp: Date;
  type?: MessageType;
  status?: MessageStatus;
  complete?: boolean;
  conversation_id?: string;
  parent_message_id?: string;
  metadata?: MessageMetadata;
}

export enum MessageRole {
  USER = "user",
  ASSISTANT = "assistant",
  SYSTEM = "system"
}

export enum MessageType {
  TEXT = "text",
  IMAGE = "image",
  FILE = "file",
  CODE = "code"
}

export enum MessageStatus {
  SENDING = "sending",
  SENT = "sent",
  DELIVERED = "delivered",
  READ = "read",
  ERROR = "error"
}

export interface MessageMetadata {
  tokens?: number;
  model?: string;
  processingTime?: number;
  sources?: SourceReference[];
  isInappropriate?: boolean;
  filteredReason?: string;
  confidence?: number;
  language?: string;
}

export interface SourceReference {
  title: string;
  url: string;
  snippet: string;
  confidence: number;
  source_type?: string;
}

// Типы для потоковой генерации
export interface StreamChunk {
  chunk: string;
  done: boolean;
  message_id?: string;
  event_type?: StreamEventType;
  tokens?: number;
}

export enum StreamEventType {
  CHUNK = "chunk",
  COMPLETE = "complete",
  ERROR = "error",
  USAGE = "usage"
}

export interface StreamResponse {
  event: StreamEventType;
  data: StreamChunk;
  conversation_id?: string;
}

export interface StreamUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  model: string;
}

// Типы диалогов и истории
export interface Conversation {
  message: string;
  data: any;
  success: any;
  id: string;
  title: string;
  messages: Message[];
  created_at: Date;
  updated_at: Date;
  last_message_at?: Date;
  last_message?: Message;
  is_pinned?: boolean;
  is_archived?: boolean;
  tags?: string[];
  message_count: number;
  user_id?: string;
  conversation_type?: ConversationType;
}

export enum ConversationType {
  DIRECT = "direct",
  GROUP = "group",
  SUPPORT = "support",
  TRAINING = "training"
}

export interface ChatHistory {
  conversations: Conversation[];
  total_messages: number;
  storage_used: number;
}

// Типы для WebSocket
export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: number;
  message_id?: string;
}

export interface ChatMessagePayload {
  content: string;
  conversation_id?: string;
  message_id: string;
  parent_message_id?: string;
  stream?: boolean;
}

export interface TypingIndicatorPayload {
  is_typing: boolean;
  user_id: string;
  conversation_id: string;
}

// Типы для API запросов/ответов
export interface SendMessageRequest {
  message: string;
  conversation_id?: string;
  parent_message_id?: string;
  stream?: boolean;
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

export interface SendMessageResponse {
  message: Message;
  conversation_id: string;
  usage?: StreamUsage;
  processing_time: number;
  stream_complete?: boolean;
}

export interface CreateConversationRequest {
  title?: string;
  initial_message?: string;
  tags?: string[];
  conversation_type?: ConversationType;
}

export interface UpdateConversationRequest {
  title?: string;
  tags?: string[];
  is_pinned?: boolean;
  is_archived?: boolean;
}

// Response модели
export interface ConversationListResponse {
  data: any;
  success: any;
  conversations: Conversation[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface ConversationFilter {
  search_term?: string;
  tags?: string[];
  date_range?: {
    start: Date;
    end: Date;
  };
  pinned_only?: boolean;
  archived_only?: boolean;
  conversation_type?: ConversationType;
  sort_by?: string;
  sort_order?: string;
}

export interface SearchResults {
  conversations: Conversation[];
  messages: Message[];
  total: number;
  query: string;
}

// Типы для настроек чата
export interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  context_length: number;
  max_tokens: number;
  supported_features: string[];
  description?: string;
  is_available: boolean;
}

export interface ChatSettings {
  model: string;
  temperature: number;
  max_tokens?: number;
  stream: boolean;
  show_timestamps: boolean;
  enable_markdown: boolean;
  safe_mode: boolean;
  auto_scroll: boolean;
  retain_context: boolean;
  context_window: number;
}

export interface UserChatPreferences {
  user_id: string;
  settings: ChatSettings;
  recent_models: string[];
  created_at: Date;
  updated_at: Date;
}

// Типы для модерации и безопасности
export interface ModerationResult {
  is_approved: boolean;
  flags: string[];
  score: number;
  reasons: string[];
  filtered_content?: string;
  category_scores?: Record<string, number>;
}

export interface ContentFilterConfig {
  enabled: boolean;
  strictness: string;
  blocked_patterns: string[];
  allowed_domains: string[];
}

// Типы для аналитики
export interface ChatAnalytics {
  total_messages: number;
  total_conversations: number;
  average_response_time: number;
  most_active_hours: number[];
  popular_topics: string[];
  user_satisfaction?: number;
  period_start: Date;
  period_end: Date;
}

export interface MessageStats {
  total_messages: number;
  user_messages: number;
  assistant_messages: number;
  average_message_length: number;
  busiest_day: string;
  messages_per_hour: Record<string, number>;
}

// Типы для экспорта/импорта
export interface ExportData {
  version: string;
  export_date: Date;
  conversations: Conversation[];
  settings?: UserChatPreferences;
  user_preferences?: Record<string, any>;
}

export interface ImportResult {
  success: boolean;
  imported_conversations: number;
  imported_messages: number;
  errors: string[];
  warnings: string[];
}

// Базовые response модели
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error_code?: string;
}

export interface ErrorResponse {
  success: boolean;
  error: string;
  error_code: string;
  details?: Record<string, any>;
  timestamp: Date;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

// Утилитарные типы
export interface HealthCheck {
  status: string;
  timestamp: Date;
  version: string;
  database_status: string;
  cache_status: string;
}

// Вспомогательные типы
export type LoadingStateType = 'idle' | 'loading' | 'success' | 'error';

// Хук типы
export interface UseChatReturn {
  messages: Message[];
  input: string;
  setInput: (input: string) => void;
  handleSubmit: (e?: React.FormEvent) => void;
  isLoading: boolean;
  error: Error | null;
  stop: () => void;
  reload: () => void;
}

export interface UseConversationReturn {
  conversation: Conversation | null;
  messages: Message[];
  sendMessage: (content: string) => Promise<void>;
  updateConversation: (updates: UpdateConversationRequest) => void;
  deleteConversation: () => void;
  isLoading: boolean;
  error: string | null;
}

// Константы
export const DEFAULT_CHAT_SETTINGS: ChatSettings = {
  model: 'gpt-3.5-turbo',
  temperature: 0.7,
  max_tokens: 1000,
  stream: true,
  show_timestamps: true,
  enable_markdown: true,
  safe_mode: false,
  auto_scroll: true,
  retain_context: true,
  context_window: 10
};

export const MESSAGE_STATUS_LABELS: Record<MessageStatus, string> = {
  [MessageStatus.SENDING]: 'Отправляется',
  [MessageStatus.SENT]: 'Отправлено',
  [MessageStatus.DELIVERED]: 'Доставлено',
  [MessageStatus.READ]: 'Прочитано',
  [MessageStatus.ERROR]: 'Ошибка'
};

export const MESSAGE_ROLE_LABELS: Record<MessageRole, string> = {
  [MessageRole.USER]: 'Пользователь',
  [MessageRole.ASSISTANT]: 'Ассистент',
  [MessageRole.SYSTEM]: 'Система'
};

// Утилитарные функции
export const createMessage = (content: string, role: MessageRole = MessageRole.USER): Message => ({
  id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  content,
  role,
  timestamp: new Date(),
  type: MessageType.TEXT,
  status: MessageStatus.SENT
});

export const isUserMessage = (message: Message): boolean => 
  message.role === MessageRole.USER;

export const isAssistantMessage = (message: Message): boolean => 
  message.role === MessageRole.ASSISTANT;

export const isSystemMessage = (message: Message): boolean => 
  message.role === MessageRole.SYSTEM;

// Типы для ошибок
export interface ChatError {
  code: string;
  message: string;
  details?: any;
  retryable: boolean;
  timestamp: Date;
}

export const ErrorCodes = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  CONTENT_FILTERED: 'CONTENT_FILTERED',
  MODEL_UNAVAILABLE: 'MODEL_UNAVAILABLE',
  INVALID_REQUEST: 'INVALID_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
} as const;

// Типы для уведомлений и состояния UI
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

export interface UIState {
  sidebarOpen: boolean;
  currentView: 'chat' | 'history' | 'settings' | 'admin';
  selectedConversationId: string | null;
  mobileMenuOpen: boolean;
  theme: 'light' | 'dark' | 'auto';
  fontSize: 'small' | 'medium' | 'large';
}

// Типы для контекста чата
export interface ChatContext {
  currentConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  typingUsers: string[];
}

// Типы для поиска и фильтрации
export interface ContentFilter {
  enabled: boolean;
  strictness: 'low' | 'medium' | 'high';
  blockedPatterns: string[];
  allowedDomains: string[];
}