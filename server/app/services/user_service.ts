import mongoose, { type Model } from 'mongoose';
import bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { RedisManager } from '../core/redis';
import { Database } from '../core/db';
import { UserFiltersSchema } from '../schemas/auth';
import { UserMongooseSchema } from '../schemas/models';

mongoose.set('sanitizeFilter', true);

export interface User {
    id: string;
    username: string;
    email: string;
    email_verified: boolean;
    hashed_password: string;
    first_name?: string;
    last_name?: string;
    role: string;
    is_active: boolean;
    timezone: string;
    language: string;
    created_at: Date;
    updated_at: Date;
    last_login?: Date;
    last_activity?: Date;
}

export type UserCreateInput = {
    username: string;
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
};

export type UserFilters = Partial<z.infer<typeof UserFiltersSchema>> & { search?: string };

export let UserModel: Model<User>;

const getModel = (): Model<User> => {
    if (!UserModel) {
        UserModel = Database.getConnection().model<User>('User', UserMongooseSchema);
    }
    return UserModel;
};

const USER_CACHE_TTL = 300;
const USER_CACHE_KEY = (id: string) => `cache:user:${id}`;

export const UserService = {
    get model(): Model<User> {
        return getModel();
    },

    async getById(userId: string): Promise<User | null> {
        if (typeof userId !== 'string' || userId.length === 0 || userId.length > 128) {
            return null;
        }
        const cached = await RedisManager.get(USER_CACHE_KEY(userId));

        if (cached) {
            const restored = await this.tryRestoreUser(cached);
            if (restored) {return restored;}
            console.warn(`Corrupted cache for user ${userId}, removing`);
            await RedisManager.delete(USER_CACHE_KEY(userId));
        }

        const user = await this.model.findOne({id: String(userId)}).lean() as User | null;
        if (!user) {return null;}

        await RedisManager.setex(
            USER_CACHE_KEY(userId),
            USER_CACHE_TTL,
            JSON.stringify(user)
        );

        return user;
    },

    async tryRestoreUser(cached: Buffer): Promise<User | null> {
        const raw = cached.toString('utf-8');

        try {
            const parsed: unknown = JSON.parse(raw);
            if (await this.isValidUser(parsed)) {return parsed as User;}
        } catch {}

        try {
            const inner: unknown = JSON.parse(raw);
            if (typeof inner === 'string') {
                const parsed: unknown = JSON.parse(inner);
                if (await this.isValidUser(parsed)) {return parsed as User;}
            }
        } catch {}

        try {
            const decoded = Buffer.from(raw, 'base64').toString('utf-8');
            const parsed: unknown = JSON.parse(decoded);
            if (await this.isValidUser(parsed)) {return parsed as User;}
        } catch {}

        return null;
    },

    async isValidUser(obj: unknown): Promise<boolean> {
        if (!obj || typeof obj !== 'object') {return false;}
        const u = obj as unknown as Record<string, unknown>;
        return (
            typeof u.id === 'string' &&
            typeof u.username === 'string' &&
            typeof u.email === 'string'
        );
    },

    async getByUsername(username: string): Promise<User> {
        if (typeof username !== 'string' || username.length === 0) {
            throw new Error('Invalid username');
        }
        return this.model.findOne({username: String(username)}).lean() as Promise<User>;
    },

    async getByEmail(email: string): Promise<User> {
        if (typeof email !== 'string' || email.length === 0) {
            throw new Error('Invalid email');
        }
        return this.model.findOne({email: String(email)}).lean() as Promise<User>;
    },

    async userExists(username: string, email: string): Promise<boolean> {
        const count = await this.model.countDocuments({$or: [{username: String(username)}, {email: String(email)}]});
        return count > 0;
    },

    async create(data: UserCreateInput): Promise<User> {
        if (await this.userExists(data.username, data.email)) {
            throw new Error('User with this username or email already exists');
        }

        const hashed = await bcrypt.hash(data.password, 12);
        const now = new Date();

        const user = await this.model.create({
            id: randomUUID(),
            username: data.username,
            email: data.email,
            hashed_password: hashed,
            first_name: data.first_name,
            last_name: data.last_name,
            role: 'user',
            is_active: true,
            email_verified: false,
            timezone: 'UTC',
            language: 'ru',
            created_at: now,
            updated_at: now,
        });

        return user.toObject() as User;
    },

    async update(
        userId: string,
        patch: Partial<User> & { password?: string }
    ): Promise<User | null> {
        if (typeof userId !== 'string' || userId.length === 0) {
            throw new Error('Invalid user ID');
        }
        if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
            throw new Error('Invalid update data');
        }
        for (const [key, value] of Object.entries(patch)) {
            if (key.startsWith('$') || key === '__proto__' || key === 'constructor' || key === 'prototype') {
                throw new Error(`Invalid update field: ${key}`);
            }
            // sanitizeFilter не проверяет update-документы, поэтому операторы
            // внутри значений отсекаем здесь: { role: { $set: 'admin' } }.
            if (value !== null && typeof value === 'object' &&
                Object.keys(value).some((nested) => nested.startsWith('$'))) {
                throw new Error(`Invalid update value for field: ${key}`);
            }
        }
        const { password, ...rest } = patch;

        // Явный allowlist вместо spread: patch не может дописать служебные поля
        // (hashed_password, id, created_at и т.п.).
        const update: Record<string, unknown> = {};
        const allowedFields = [
            'username', 'email', 'first_name', 'last_name',
            'role', 'is_active', 'timezone', 'language', 'email_verified',
        ] as const;
        for (const field of allowedFields) {
            const value = (rest as Record<string, unknown>)[field];
            if (value !== undefined) {update[field] = value;}
        }
        update.updated_at = new Date();

        if (password) {
            update.hashed_password = await bcrypt.hash(String(password), 12);
        }

        const user = await this.model
            .findOneAndUpdate({id: String(userId)}, update, { new: true })
            .lean();

        if (user) {await this.invalidateCache(userId);}
        return user as User;
    },

    async updateLastLogin(userId: string): Promise<void> {
        if (typeof userId !== 'string' || userId.length === 0) {return;}
        const now = new Date();
        await this.model.updateOne(
            { id: String(userId) },
            { $set: { last_login: now, last_activity: now } }
        );
        await this.invalidateCache(userId);
    },

    async updateActivity(userId: string): Promise<void> {
        if (typeof userId !== 'string' || userId.length === 0) {return;}
        await this.model.updateOne(
            { id: String(userId) },
            { $set: { last_activity: new Date() } }
        );
    },

    async activate(userId: string): Promise<boolean> {
        if (typeof userId !== 'string' || userId.length === 0) {return false;}
        const res = await this.model.updateOne(
            { id: String(userId) },
            { $set: { is_active: true, updated_at: new Date() } }
        );
        await this.invalidateCache(userId);
        return res.modifiedCount > 0;
    },

    async deactivate(userId: string): Promise<boolean> {
        if (typeof userId !== 'string' || userId.length === 0) {return false;}
        const res = await this.model.updateOne(
            { id: String(userId) },
            { $set: { is_active: false, updated_at: new Date() } }
        );
        await this.invalidateCache(userId);
        return res.modifiedCount > 0;
    },

    async verifyEmail(userId: string): Promise<boolean> {
        if (typeof userId !== 'string' || userId.length === 0) {return false;}
        const res = await this.model.updateOne(
            { id: String(userId) },
            { $set: { email_verified: true, updated_at: new Date() } }
        );
        await this.invalidateCache(userId);
        return res.modifiedCount > 0;
    },

    async delete(userId: string): Promise<boolean> {
        if (typeof userId !== 'string' || userId.length === 0) {return false;}
        const res = await this.model.deleteOne({ id: String(userId) });
        await this.invalidateCache(userId);
        return res.deletedCount > 0;
    },

    async authenticate(
        usernameOrEmail: string,
        password: string
    ): Promise<User | null> {
        if (typeof usernameOrEmail !== 'string' || usernameOrEmail.length === 0) {
            return null;
        }
        if (typeof password !== 'string' || password.length === 0) {
            return null;
        }
        const user = await this.model
            .findOne({
                $or: [
                    {username: String(usernameOrEmail)},
                    {email: String(usernameOrEmail)},
                ],
            })
            .lean();

        if (!user) {return null;}
        if (!user.is_active) {return null;}

        const valid = await bcrypt.compare(password, user.hashed_password);
        if (!valid) {return null;}

        await this.updateLastLogin(String(user.id));
        return user as User;
    },

    async changePassword(
        userId: string,
        currentPassword: string,
        newPassword: string
    ): Promise<boolean> {
        const user = await this.getById(userId);
        if (!user) {return false;}

        const valid = await bcrypt.compare(currentPassword, user.hashed_password);
        if (!valid) {return false;}

        return (await this.update(String(userId), {password: String(newPassword)})) !== null;
    },

    async resetPassword(userId: string, newPassword: string): Promise<boolean> {
        return (await this.update(String(userId), {password: String(newPassword)})) !== null;
    },

    async adminResetPassword(userId: string): Promise<string | null> {
        const user = await this.getById(userId);
        if (!user) {return null;}

        const newPassword = randomUUID().replace(/-/g, '').slice(0, 16);
        await this.update(userId, { password: newPassword });
        return newPassword;
    },

    async list(options: {
        skip?: number;
        limit?: number;
        activeOnly?: boolean;
        filters?: UserFilters;
    } = {}): Promise<{ users: User[]; total: number }> {
        const { skip = 0, limit = 100, activeOnly = false, filters } = options;

        const query: Record<string, unknown> = {};
        if (activeOnly) {query.is_active = true;}
        if (typeof filters?.role === 'string' && filters.role.length > 0) {query.role = filters.role;}
        if (typeof filters?.is_active === 'boolean') {query.is_active = filters.is_active;}
        if (filters?.created_at_start || filters?.created_at_end) {
            const range: Record<string, Date> = {};
            if (filters.created_at_start) {range.$gte = filters.created_at_start;}
            if (filters.created_at_end) {range.$lte = filters.created_at_end;}
            // Легитимный диапазон дат: помечаем как доверенный, иначе
            // sanitizeFilter обернёт его в $eq и выборка опустеет.
            query.created_at = mongoose.trusted(range);
        }

        const [users, total] = await Promise.all([
            this.model.find(query).skip(skip).limit(limit).lean(),
            this.model.countDocuments(query),
        ]);

        return { users: users as User[], total };
    },

    async search(query: string, limit = 10): Promise<User[]> {
        if (typeof query !== 'string' || query.length === 0 || query.length > 100) {
            return [];
        }
        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escaped, 'i');
        const safeLimit = Number.isInteger(limit) && limit > 0 ? Math.min(limit, 100) : 10;
        return this.model
        .find({
            $or: [
                { username: regex },
                { email: regex },
                { first_name: regex },
                { last_name: regex },
            ],
        })
        .limit(safeLimit)
        .lean() as Promise<User[]>;
    },

    async getByRole(role: string): Promise<User[]> {
        if (typeof role !== 'string' || role.length === 0 || role.length > 64) {
            return [];
        }
        return this.model.find({role: String(role)}).lean() as Promise<User[]>;
    },

    async getActiveCount(): Promise<number> {
        return this.model.countDocuments({ is_active: true });
    },

    async getRecent(days = 7): Promise<User[]> {
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        return this.model.find({ created_at: mongoose.trusted({ $gte: since }) }).lean() as Promise<User[]>;
    },

    async createEmailVerificationToken(userId: string, token: string): Promise<void> {
        await RedisManager.setex(`email_verification:${token}`, 86400, userId);
        await this.update(userId, { email_verified: false });
    },

    async verifyEmailToken(token: string): Promise<boolean> {
        const userId = await RedisManager.get(`email_verification:${token}`);
        if (!userId) {return false;}

        const ok = await this.verifyEmail(userId.toString());
        if (ok) {await RedisManager.delete(`email_verification:${token}`);}
        return ok;
    },

    async createPasswordResetToken(userId: string, token: string): Promise<void> {
        await RedisManager.setex(`password_reset:${token}`, 3600, userId);
    },

    async resetPasswordWithToken(token: string, newPassword: string): Promise<boolean> {
        const userId = await RedisManager.get(`password_reset:${token}`);
        if (!userId) {return false;}

        const ok = await this.resetPassword(userId.toString(), newPassword);
        if (ok) {await RedisManager.delete(`password_reset:${token}`);}
        return ok;
    },

    async updateUsage(userId: string, usage: {
        prompt_tokens?: number;
        completion_tokens?: number;
        total_tokens?: number;
    }): Promise<void> {
        const { prompt_tokens = 0, completion_tokens = 0, total_tokens = 0 } = usage;
        if (!total_tokens) {return;}

        const today = new Date().toISOString().slice(0, 10);
        const key = `user_stats:${userId}`;
        const todayKey = `${key}:${today}`;

        await Promise.all([
            RedisManager.hincrby(key, 'ai_tokens_used', total_tokens),
            RedisManager.hincrby(key, 'ai_requests_total', 1),
            RedisManager.hincrby(key, 'prompt_tokens_total', prompt_tokens),
            RedisManager.hincrby(key, 'completion_tokens_total', completion_tokens),
            RedisManager.hincrby(todayKey, 'ai_requests_today', 1),
            RedisManager.hincrby(todayKey, 'tokens_today', total_tokens),
            RedisManager.expire(todayKey, 86400),
            RedisManager.hset(key, { last_usage_date: today }),
        ]);
    },

    async getUsageStats(userId: string): Promise<Record<string, number | string>> {
        const stats = await RedisManager.hgetall(`user_stats:${userId}`);
        const num = (key: string): number => {
            const v = stats[key];
            return v ? Number.parseInt(v.toString(), 10) : 0;
        };
        return {
            ai_tokens_used: num('ai_tokens_used'),
            ai_requests_total: num('ai_requests_total'),
            prompt_tokens_total: num('prompt_tokens_total'),
            completion_tokens_total: num('completion_tokens_total'),
            last_usage_date: stats['last_usage_date']?.toString(),
        };
    },

    async invalidateCache(userId: string): Promise<void> {
        await RedisManager.delete(USER_CACHE_KEY(userId));
    }
}
