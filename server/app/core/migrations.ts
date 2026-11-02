import mongoose, {Model} from 'mongoose';
import type {RedisClientType} from 'redis';

import {Conversation, Message} from '../models/chat';
import {ConversationMongooseSchema, MessageMongooseSchema, UserMongooseSchema} from '../schemas/models';
import {User} from '../services/user_service';

const asString = (value: unknown): string => {
    if (value == null) {return '';}
    if (typeof value === 'string') {return value;}
    if (Buffer.isBuffer(value)) {return value.toString('utf8');}
    return String(value);
};

const asJson = <T extends object = Record<string, unknown>>(value: unknown): T => {
    try {
        const parsed = JSON.parse(asString(value)) as T | null;
        if (parsed === null || typeof parsed !== 'object') {
            return {} as T;
        }
        return parsed;
    } catch {
        return {} as T;
    }
};

interface MigrationStats {
    total: number;
    success: number;
    failed: number;
    skipped: number;
    errors: string[];
}

interface MigrationResult {
    users: MigrationStats;
    conversations: MigrationStats;
    messages: MigrationStats;
    timestamp: string;
}

export class RedisToMongoMigrator {
    private UserModel: Model<User>;
    private ConversationModel: Model<Conversation>;
    private MessageModel: Model<Message>;

    constructor(connection: mongoose.Connection, private redis: RedisClientType) {
        this.UserModel = connection.model<User>('User', UserMongooseSchema);
        this.ConversationModel = connection.model<Conversation>('Conversation', ConversationMongooseSchema);
        this.MessageModel = connection.model<Message>('Message', MessageMongooseSchema);
    }

    async migrateUsers(): Promise<MigrationStats> {
        const stats: MigrationStats = {total: 0, success: 0, failed: 0, skipped: 0, errors: []};

        const userIdsRaw = await this.redis.sMembers('users:all');
        if (!userIdsRaw.length) {
            return stats;
        }

        const userIds = userIdsRaw.map(asString);
        stats.total = userIds.length;

        for (const userId of userIds) {
            try {
                const exists = await this.UserModel.exists({id: userId});
                if (exists) {
                    stats.skipped++;
                    continue;
                }

                const raw = await this.redis.get(`user:${userId}`);
                if (!raw) {
                    stats.failed++;
                    stats.errors.push(`User ${userId} not found in Redis`);
                    continue;
                }

                const data = asJson<Record<string, unknown>>(raw);
                if (!data) {
                    stats.failed++;
                    stats.errors.push(`User ${userId}: invalid JSON`);
                    continue;
                }

                const now = new Date();
                await this.UserModel.create({
                    id: String(data.id ?? userId),
                    username: String(data.username ?? ''),
                    email: String(data.email ?? ''),
                    hashed_password: String(data.hashed_password ?? ''),
                    first_name: data.first_name ? String(data.first_name) : undefined,
                    last_name: data.last_name ? String(data.last_name) : undefined,
                    role: String(data.role ?? 'user'),
                    is_active: data.is_active !== false,
                    timezone: String(data.timezone ?? 'UTC'),
                    language: String(data.language ?? 'ru'),
                    created_at: data.created_at ? new Date(data.created_at as string) : now,
                    updated_at: data.updated_at ? new Date(data.updated_at as string) : now,
                    last_login: data.last_login ? new Date(data.last_login as string) : undefined,
                    last_activity: data.last_activity ? new Date(data.last_activity as string) : undefined,
                });

                stats.success++;
            } catch (error) {
                if (error instanceof mongoose.mongo.MongoServerError && error.code === 11000) {
                    stats.skipped++;
                } else {
                    stats.failed++;
                    stats.errors.push(`User ${userId}: ${error instanceof Error ? error.message : String(error)}`);
                }
            }
        }

        return stats;
    }

    async migrateConversations(): Promise<MigrationStats> {
        const stats: MigrationStats = {total: 0, success: 0, failed: 0, skipped: 0, errors: []};
        const keys = await this.redis.keys('conversation:*');
        const conversationKeys = keys.map(asString).filter((k) => !k.endsWith(':messages'));

        stats.total = conversationKeys.length;

        for (const key of conversationKeys) {
            try {
                const conversationId = key.split(':')[1];
                if (!conversationId) {
                    stats.skipped++;
                    continue;
                }

                const exists = await this.ConversationModel.exists({id: conversationId});
                if (exists) {
                    stats.skipped++;
                    continue;
                }

                const hash = await this.redis.hGetAll(key);
                if (!hash || Object.keys(hash).length === 0) {
                    stats.failed++;
                    stats.errors.push(`Conversation ${conversationId}: empty`);
                    continue;
                }

                const now = new Date();
                const raw = await this.redis.get(`key:${key}`);
                const data = asJson<Record<string, unknown>>(raw);
                await this.ConversationModel.create({
                    id: conversationId,
                    user_id: asString(hash.user_id ?? ''),
                    title: asString(hash.title ?? ''),
                    created_at: data.created_at ? new Date(data.created_at as string) : now,
                    updated_at: data.updated_at ? new Date(data.updated_at as string) : now,
                });

                stats.success++;

                const msgStats = await this.migrateMessages(conversationId);
                stats.failed += msgStats.failed;
                stats.errors.push(...msgStats.errors);
            } catch (error) {
                if (error instanceof mongoose.mongo.MongoServerError && error.code === 11000) {
                    stats.skipped++;
                } else {
                    stats.failed++;
                    stats.errors.push(`Conversation ${key}: ${ error instanceof Error ? error.message : String(error)}`);
                }
            }
        }

        return stats;
    }

    async migrateMessages(conversationId: string): Promise<MigrationStats> {
        const stats: MigrationStats = {total: 0, success: 0, failed: 0, skipped: 0, errors: []};

        const messageIdsRaw = await this.redis.lRange(`conversation:${conversationId}:messages`, 0, -1);
        if (!messageIdsRaw.length) {return stats;}

        const messageIds = messageIdsRaw.map(asString);
        stats.total = messageIds.length;

        for (const msgId of messageIds) {
            try {
                const exists = await this.MessageModel.exists({id: msgId});
                if (exists) {
                    stats.skipped++;
                    continue;
                }

                const hash = await this.redis.hGetAll(`message:${msgId}`);
                if (!hash || Object.keys(hash).length === 0) {
                    stats.failed++;
                    stats.errors.push(`Message ${msgId}: not found`);
                    continue;
                }

                const now = new Date();
                const raw = await this.redis.get(`msgId:${msgId}`);
                const data = asJson<Record<string, unknown>>(raw);

                await this.MessageModel.create({
                    id: msgId,
                    conversation_id: conversationId,
                    user_id: asString(hash.user_id ?? ''),
                    content: asString(hash.content ?? ''),
                    role: asString(hash.role ?? 'user') as Message['role'],
                    created_at: data.created_at ? new Date(data.created_at as string) : now,
                    updated_at: data.updated_at ? new Date(data.updated_at as string) : now,
                });

                stats.success++;
            } catch (error) {
                if (error instanceof mongoose.mongo.MongoServerError && error.code === 11000) {
                    stats.skipped++;
                } else {
                    stats.failed++;
                    stats.errors.push(`Message ${msgId}: ${error instanceof Error ? error.message : String(error)}`);
                }
            }
        }

        return stats;
    }

    async migrateAll(): Promise<MigrationResult> {
        const users = await this.migrateUsers();
        const conversations = await this.migrateConversations();
        const messages: MigrationStats = {
            total: 0,
            success: 0,
            failed: 0,
            skipped: 0,
            errors: [],
        };

        return {
            users,
            conversations,
            messages,
            timestamp: new Date().toISOString(),
        };
    }
}

export const runMigrations = async(connection: mongoose.Connection): Promise<void> => {
    await connection.syncIndexes();
    console.log('MongoDB indexes synced');
};