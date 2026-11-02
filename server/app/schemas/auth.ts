import {z} from 'zod';

import type {Message} from '../models/chat';

export const EmailSchema = z.email();

export const LoginRequestSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export const UserResponseSchema = z.object({
  id: z.uuid(),
  username: z.string(),
  email: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  role: z.string(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  last_login: z.coerce.date(),
  last_activity: z.coerce.date(),
});

export const TokenSchema = z.object({
  access_token: z.string(),
  token_type: z.string(),
});

export const TokenDataSchema = z.object({
	access_token: z.string(),
	refresh_token: z.string(),
	token_type: z.string(),
	user: UserResponseSchema.nullable(),
});

export const UserCreateSchema = z.object({
  username: z.string(),
  email: EmailSchema,
  password: z.string(),
  first_name: z.string(),
  last_name: z.string(),
});

export const UserProfileUpdateSchema = z.object({
  first_name: z.string(),
  last_name: z.string(),
  email: EmailSchema,
  phone: z.string(),
  address: z.string(),
  city: z.string(),
  state: z.string(),
  zip_code: z.string(),
  country: z.string(),
  profile_picture: z.string(),
  bio: z.string(),
  skills: z.array(z.string()),
  preferences: z.record(z.string(), z.unknown()),
  timezone: z.string().default('UTC'),
  language: z.string().default('en'),
});

export const UserSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string(),
  hashed_password: z.string(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  role: z.string(),
  is_active: z.boolean(),
  timezone: z.string(),
  language: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  last_login: z.coerce.date(),
  last_activity: z.coerce.date().optional(),
});

export const UserUpdateSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  email: z.email().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  role: z.enum(['admin', 'manager', 'user', 'guest']).optional(),
  is_active: z.boolean().optional(),
});

export type UserUpdate = z.infer<typeof UserUpdateSchema>;

export const UserPreferencesSchema = z.object({
  theme: z.string(),
  language: z.string(),
  notifications: z.boolean(),
  email_notifications: z.boolean(),
  sms_notifications: z.boolean(),
  push_notifications: z.boolean(),
  email_notifications_frequency: z.string(),
  sms_notifications_frequency: z.string(),
  push_notifications_frequency: z.string(),
  email_notifications_channels: z.array(z.string()),
  sms_notifications_channels: z.array(z.string()),
  push_notifications_channels: z.array(z.string()),
});

export const PasswordResetRequestSchema = z.object({email: EmailSchema});
export const PasswordResetConfirmSchema =
    z.object({token: z.string(), new_password: z.string()});
export const ChangePasswordRequestSchema =
    z.object({old_password: z.string(), new_password: z.string()});
export const AdminUserCreateSchema =
    UserCreateSchema.extend({role: z.string(), status: z.string()});

export const AdminUserUpdateSchema = z.object({
  username: z.string(),
  email: EmailSchema,
  password: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  role: z.string(),
  status: z.string(),
});

export const UserFiltersSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  role: z.string(),
  is_active: z.boolean(),
  created_at_start: z.coerce.date(),
  created_at_end: z.coerce.date(),
});

export const UserPaginatedResponseSchema = z.object({
  users: z.array(UserResponseSchema),
  total: z.number().int(),
  page: z.number().int(),
  size: z.number().int(),
});

export const BulkUserOperationSchema = z.object({
  users: z.array(UserResponseSchema),
  operation: z.string(),
  status: z.string(),
  created_at: z.coerce.date(),
});

export const UserAuditLogSchema = z.object({
  id: z.uuid(),
  user_id: z.uuid(),
  action: z.string(),
  data: z.record(z.string(), z.unknown()),
  created_at: z.coerce.date(),
  user_agent: z.string(),
  ip_address: z.string(),
});

export const UserStatsSchema = z.object({
  total_users: z.number().int(),
  active_users: z.number().int(),
  inactive_users: z.number().int(),
  total_messages: z.number().int(),
  total_conversations: z.number().int(),
  total_tokens: z.number().int(),
  total_cost: z.number(),
});

export const UserSummarySchema = UserResponseSchema.extend({
  total_messages: z.number().int(),
  total_conversations: z.number().int(),
  total_tokens: z.number().int(),
});

export const MessageCreateSchema = z.object({
  content: z.string(),
  role: z.string(),
  message_type: z.string(),
  tokens_used: z.number().int(),
  ai_model: z.string(),
  temperature: z.number(),
  conversation_id: z.string(),
});

export const MessageUpdateSchema = z.object({
  content: z.string(),
  role: z.string(),
  message_type: z.string(),
  tokens_used: z.number().int(),
  ai_model: z.string(),
  temperature: z.number(),
});

export const ConversationBaseSchema = z.object({
  name: z.string(),
  description: z.string(),
});

export const ConversationCreateSchema = ConversationBaseSchema.extend({title: z.string().min(1).max(255)});

export const ConversationResponseSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  title: z.string(),
  conversation_type: z.string(),
  tags: z.array(z.string()),
  is_pinned: z.boolean(),
  is_archived: z.boolean(),
  message_count: z.number().int(),
  last_message_at: z.coerce.date().optional(),
  last_message: z.string().optional(),
  messages: z.array(z.custom<Message>()).optional(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export const ConversationUpdateSchema = z.object({name: z.string().optional(), description: z.string().optional()});

export const ConversationListResponseSchema = z.object({
  conversations: z.array(ConversationResponseSchema),
  total: z.number().int(),
});

export const MessageRole = {
  USER: 'user',
  ASSISTANT: 'assistant',
  SYSTEM: 'system',
} as const;
export type MessageRole = (typeof MessageRole)[keyof typeof MessageRole];

export const MessageStatus = {
  SENDING: 'sending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  ERROR: 'error',
} as const;
export type MessageStatus = (typeof MessageStatus)[keyof typeof MessageStatus];

export const MessageSchema = z.object({
  id: z.string(),
  conversation_id: z.string(),
  user_id: z.string(),
  content: z.string().max(10000),
  role: z.enum(['user', 'assistant', 'system']),
  message_type: z.string(),
  status: z.string().default('sent'),
  parent_message_id: z.string().optional(),
  moderation_passed: z.boolean().default(true),
  moderation_notes: z.array(z.string()),
  usage_data: z.object({
                  prompt_tokens: z.number().optional(),
                  completion_tokens: z.number().optional(),
                  total_tokens: z.number().optional(),
                  model: z.string().optional(),
                }).optional(),
  metadata: z.unknown().optional(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export const SendMessageRequestSchema = z.object({
  message: z.string(),
  conversation_id: z.string(),
  ai_model: z.string(),
  temperature: z.number(),
});
export const MessageResponseSchema = z.object({
  id: z.uuid(),
  conversation_id: z.uuid(),
  user_id: z.string(),
  content: z.string(),
  role: z.enum(['user', 'assistant', 'system']),
  message_type: z.string(),
  status: z.string(),
  parent_message_id: z.string().optional(),
  moderation_passed: z.boolean(),
  moderation_notes: z.array(z.string()),
  usage_data: z
    .object({
      prompt_tokens: z.number().optional(),
      completion_tokens: z.number().optional(),
      total_tokens: z.number().optional(),
      model: z.string().optional(),
    })
    .optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export const SendMessageResponseSchema = z.object({
  message_id: z.string(),
  conversation_id: z.string(),
  content: z.string(),
  timestamp: z.coerce.date(),
});

export const StreamChunkSchema = z.object({
  chunk: z.string(),
  done: z.boolean(),
  message_id: z.string().optional(),
});

export const StreamUsageSchema = z.object({
  prompt_tokens: z.number().int(),
  completion_tokens: z.number().int(),
  total_tokens: z.number().int(),
});

export const StreamEventTypeSchema = z.enum([
  'chunk',
  'complete',
  'error',
  'usage',
]);

export const StreamResponseSchema = z.object({
  event: StreamEventTypeSchema,
  data: StreamChunkSchema,
  conversation_id: z.string().optional(),
});

export const WebSocketMessageSchema = z.object({
  type: z.string(),
  payload: z.unknown().optional(),
  timestamp: z.number().optional(),
  message_id: z.string().optional(),
});

export const ChatMessagePayloadSchema = z.object({
  content: z.string(),
  conversation_id: z.string().optional(),
  message_id: z.string(),
  parent_message_id: z.string().optional(),
  stream: z.boolean().optional(),
});

export const TypingIndicatorPayloadSchema = z.object({
  is_typing: z.boolean(),
  user_id: z.string(),
  conversation_id: z.string(),
});

export const APIResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.record(z.string(), z.unknown()),
});

export const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  code: z.number().int(),
  details: z.record(z.string(), z.unknown()),
});

export const PaginatedResponseSchema = z.object({
  data: z.array(z.record(z.string(), z.unknown())),
  total: z.number().int(),
  page: z.number().int(),
  size: z.number().int(),
});

export const HealthCheckSchema = z.object({
  status: z.string(),
  timestamp: z.coerce.date(),
  version: z.string(),
  uptime: z.number(),
});

export const UserRoleLabelsSchema = z.object({
  USER: z.string(),
  ADMIN: z.string(),
  SUPER_ADMIN: z.string(),
  MODERATOR: z.string(),
  SUPPORT: z.string(),
});

export const UserStatusLabelsSchema = z.object({
  ACTIVE: z.string(),
  INACTIVE: z.string(),
  PENDING: z.string(),
  SUSPENDED: z.string(),
  BLOCKED: z.string(),
});

export const ValidationResultSchema = z.object({
  is_valid: z.boolean(),
  message: z.string(),
  error: z.string(),
});

export const UserValidationSchema =
    ValidationResultSchema.extend({user: UserResponseSchema});

export const UsersValidationSchema =
    ValidationResultSchema.extend({users: z.array(UserResponseSchema)});

export const PermissionCheckSchema = ValidationResultSchema.extend({
  can_manage: z.boolean(),
  can_delete: z.boolean(),
  can_reset: z.boolean(),
});

export const UserInfoSchema = z.object({
  full_name: z.string(),
  initials: z.string(),
  email: EmailSchema,
  avatar_url: z.string(),
});

export const SearchResultsSchema = z.object({
  results: z.array(z.record(z.string(), z.unknown())),
  total: z.number().int(),
  page: z.number().int(),
  size: z.number().int(),
  query: z.string(),
});

export const ExportDataSchema = z.object({
  data: z.record(z.string(), z.unknown()),
  format: z.string(),
  filename: z.string(),
});

export const ImportResultSchema = z.object({
  imported: z.number().int(),
  failed: z.number().int(),
  errors: z.array(z.string()),
  total: z.number().int(),
});

export const ChatSettingsSchema = z.object({
  max_tokens: z.number().int(),
  temperature: z.number(),
  model: z.string(),
  stream: z.boolean(),
  system_prompt: z.string(),
});

export const ModerationResultSchema = z.object({
  is_approved: z.boolean(),
  score: z.number(),
  flags: z.array(z.string()),
  reasons: z.array(z.string()),
});

export const OnlineUserSchema = z.object({
  id: z.uuid(),
  username: z.string(),
  email: EmailSchema,
  first_name: z.string(),
  last_name: z.string(),
  role: z.string(),
  is_active: z.boolean(),
  last_activity: z.coerce.date(),
  status: z.string(),
});

export const ConversationSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  title: z.string().max(200),
  conversation_type: z.string(),
  tags: z.array(z.string()),
  is_pinned: z.boolean(),
  is_archived: z.boolean(),
  message_count: z.number().int(),
  last_message_at: z.coerce.date(),
  last_message: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export const ListQuerySchema = z.object({
  skip: z.coerce.number().int().min(0),
  limit: z.coerce.number().int().min(1).max(100),
  role: z.string().optional(),
  is_active: z.coerce.boolean().optional(),
  search: z.string().optional(),
});

export const CreateConversationSchema = z.object({
  title: z.string().max(200).optional(),
  conversation_type:
      z.enum(['direct', 'group', 'support', 'training', 'general']),
  tags: z.array(z.string()),
  initial_message: z.string().optional(),
});

export const UpdateConversationSchema = z.object({
  title: z.string().max(200).optional(),
  tags: z.array(z.string()).optional(),
  is_pinned: z.boolean().optional(),
  is_archived: z.boolean().optional(),
});

export const ListConversationsQuerySchema = z.object({
  skip: z.coerce.number().int().min(0),
  limit: z.coerce.number().int().min(1).max(100),
  search: z.string().optional(),
  tags: z.union([z.string(), z.array(z.string())]),
  pinned_only: z.coerce.boolean(),
  archived_only: z.coerce.boolean(),
  use_cache: z.coerce.boolean(),
});

export const SendMessageSchema = z.object({
  message: z.string().min(1).max(4000),
  conversation_id: z.uuid().optional(),
  parent_message_id: z.uuid().optional(),
  max_tokens: z.number().int().min(1).max(4000).optional(),
  temperature: z.number().min(0).max(2),
  model: z.string(),
  stream: z.boolean(),
});

export const SearchQuerySchema = z.object({
  q: z.string().min(1).max(100),
  conversation_id: z.uuid().optional(),
});

export const RegisterSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.email(),
  password: z.string().min(8).max(100),
  first_name: z.string().max(100).optional(),
  last_name: z.string().max(100).optional(),
});

export const LoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const RefreshSchema = z.object({refresh_token: z.string().min(1)});
export const ForgotPasswordSchema = z.object({email: z.email()});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  new_password: z.string().min(8),
  confirm_password: z.string().min(8),
});

export const ChangePasswordSchema = z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(8),
  confirm_password: z.string().min(8),
});

export const UpdateProfileSchema = z.object({
  email: z.email().optional(),
  username: z.string().min(3).max(50).optional(),
  first_name: z.string().max(100).optional(),
  last_name: z.string().max(100).optional(),
  phone_number: z.string().optional(),
  avatar_url: z.string().optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
  date_of_birth: z.string().optional(),
});

export const UserChatPreferencesSchema = z.object({
	user_id: z.string(),
	settings: ChatSettingsSchema,
	recent_models: z.array(z.string()).default([]),
	created_at: z.coerce.date(),
	updated_at: z.coerce.date(),
});

export const ChatAnalyticsSchema = z.object({
	total_messages: z.number().int().default(0),
	active_conversations: z.number().int().default(0),
	total_conversations: z.number().int().default(0),
	total_tokens: z.number().int().default(0),
	period_days: z.number().int().default(30),
	avg_messages_per_day: z.number().default(0),
	avg_tokens_per_day: z.number().default(0),
});

export type LoginRequest = z.infer<typeof LoginSchema>;
export type RegisterRequest = z.infer<typeof RegisterSchema>;
export type RefreshRequest = z.infer<typeof RefreshSchema>;
export type Token = z.infer<typeof TokenSchema>;
export type StreamEventType = z.infer<typeof StreamEventTypeSchema>;
export type StreamChunk = z.infer<typeof StreamChunkSchema>;
export type StreamResponse = z.infer<typeof StreamResponseSchema>;
export type WebSocketMessage = z.infer<typeof WebSocketMessageSchema>;
export type ChatMessagePayload = z.infer<typeof ChatMessagePayloadSchema>;
export type TypingIndicatorPayload = z.infer<typeof TypingIndicatorPayloadSchema>;
export type CreateConversationRequest = z.infer<typeof CreateConversationSchema>;
export type UpdateConversationRequest = z.infer<typeof UpdateConversationSchema>;
export type ConversationListResponse = z.infer<typeof ConversationListResponseSchema>;
export type Conversation = z.infer<typeof ConversationResponseSchema>;
export type ListConversationsQuery = z.infer<typeof ListConversationsQuerySchema>;
export type SendMessageRequest = z.infer<typeof SendMessageSchema>;
export type SearchQuery = z.infer<typeof SearchQuerySchema>;
export type SendMessageResponse = z.infer<typeof SendMessageResponseSchema>;
export type SearchResults = z.infer<typeof SearchResultsSchema>;
export type MessageResponse = z.infer<typeof MessageResponseSchema>;
export type ChatAnalytics = z.infer<typeof ChatAnalyticsSchema>;
export type ChatSettings = z.infer<typeof ChatSettingsSchema>;
export type ModerationResult = z.infer<typeof ModerationResultSchema>;
export type UserCreateRequest = z.infer<typeof UserCreateSchema>;
export type UserUpdateRequest = z.infer<typeof UserUpdateSchema>;
export type UserResponse = z.infer<typeof UserResponseSchema>;
export type UserPaginatedResponse = z.infer<typeof UserPaginatedResponseSchema>;
export type UserChatPreferences = z.infer<typeof UserChatPreferencesSchema>;
export type ChangePasswordRequest = z.infer<typeof ChangePasswordSchema>;
export type PasswordResetRequest = z.infer<typeof PasswordResetRequestSchema>;
export type UpdateProfileRequest = z.infer<typeof UpdateProfileSchema>;