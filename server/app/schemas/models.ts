import {Schema} from 'mongoose';

import type {Conversation, Message} from '../models/chat';
import type {User} from '../services/user_service';

export const UserMongooseSchema = new Schema<User>(
    {
      id: {type: String},
      username: {type: String, required: true, unique: true, index: true},
      email: {type: String, required: true, unique: true, index: true},
      email_verified: {type: Boolean, default: false},
      hashed_password: {type: String, required: true},
      first_name: {type: String},
      last_name: {type: String},
      role: {type: String, default: 'user', index: true},
      is_active: {type: Boolean, default: true, index: true},
      timezone: {type: String, default: 'UTC'},
      language: {type: String, default: 'ru'},
      created_at: {type: Date, default: () => new Date()},
      updated_at: {type: Date, default: () => new Date()},
      last_login: {type: Date},
      last_activity: {type: Date},
    },
    {versionKey: false});

export const ConversationMongooseSchema = new Schema<Conversation>(
    {
      id: {type: String},
      user_id: {type: String, required: true, index: true},
      title: {type: String, default: 'Новый чат'},
      conversation_type: {type: String, default: 'general'},
      tags: {type: [String], default: []},
      is_pinned: {type: Boolean, default: false},
      is_archived: {type: Boolean, default: false},
      message_count: {type: Number, default: 0},
      last_message_at: {type: Date},
      last_message: {type: String},
      created_at: {type: Date, default: () => new Date()},
      updated_at: {type: Date, default: () => new Date()},
    },
    {versionKey: false});
ConversationMongooseSchema.index({user_id: 1, updated_at: -1});
ConversationMongooseSchema.index({tags: 1});

export const MessageMongooseSchema = new Schema<Message>(
    {
      id: {type: String},
      conversation_id: {type: String, required: true, index: true},
      user_id: {type: String, default: ''},
      content: {type: String, default: ''},
      role: {
        type: String,
        enum: ['user', 'assistant', 'system'],
        default: 'user'
      },
      message_type: {type: String, default: 'text'},
      status: {type: String, default: 'sent'},
      parent_message_id: {type: String},
      moderation_passed: {type: Boolean, default: true},
      moderation_notes: {type: [String], default: []},
      usage_data: {
        prompt_tokens: {type: Number},
        completion_tokens: {type: Number},
        total_tokens: {type: Number},
        model: {type: String},
      },
      metadata: {type: Schema.Types.Mixed},
      created_at: {type: Date, default: () => new Date()},
      updated_at: {type: Date, default: () => new Date()},
    },
    {versionKey: false});
MessageMongooseSchema.index({conversation_id: 1, created_at: 1});
MessageMongooseSchema.index({content: 'text'});
