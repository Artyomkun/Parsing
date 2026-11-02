import type { Model } from 'mongoose';
import { ConversationMongooseSchema, MessageMongooseSchema } from '../schemas/models';
import { Database } from '../core/db';

export interface Conversation {
    id: string;
    user_id: string;
    title: string;
    conversation_type: string;
    tags: string[];
    is_pinned: boolean;
    is_archived: boolean;
    message_count: number;
    last_message_at?: Date;
    last_message?: string;
    created_at: Date;
    updated_at: Date;
}

export interface Message {
    id: string;
    conversation_id: string;
    user_id: string;
    content: string;
    role: 'user' | 'assistant' | 'system';
    message_type: string;
    status: string;
    parent_message_id?: string;
    complete?: boolean;
    moderation_passed: boolean;
    moderation_notes: string[];
    usage_data?: {
        prompt_tokens?: number;
        completion_tokens?: number;
        total_tokens?: number;
        model?: string;
    };
    metadata?: Record<string, unknown>;
    created_at: Date;
    updated_at: Date;
}

let ConversationModel: Model<Conversation> | null = null;
let MessageModel: Model<Message> | null = null;

export const getConversationModel = (): Model<Conversation> => {
    if (!ConversationModel) {
        ConversationModel = Database.getConnection().model<Conversation>(
        'Conversation',
        ConversationMongooseSchema
        );
    }
    return ConversationModel;
};

export const getMessageModel = (): Model<Message> => {
    if (!MessageModel) {
        MessageModel = Database.getConnection().model<Message>('Message', MessageMongooseSchema);
    }
    return MessageModel;
};
