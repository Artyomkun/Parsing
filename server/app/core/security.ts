import bcrypt from 'bcrypt';
import type {NextFunction, Request, RequestHandler, Response} from 'express';
import {type JWTPayload, jwtVerify, SignJWT} from 'jose';
import {randomUUID} from 'node:crypto';
import {UserService} from '../services/user_service';
import { RedisManager } from './redis';

const ALGORITHM = 'HS256';
const ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7;
const REFRESH_TOKEN_EXPIRE_DAYS = 30;

const SECRET_KEY = process.env.SECRET_KEY;
if (!SECRET_KEY) {throw new Error('SECRET_KEY is required');}
const SECRET = new TextEncoder().encode(SECRET_KEY);

export interface TokenPayload extends JWTPayload {
    sub: string;
    type: 'access'|'refresh';
    iat?: number;
    exp?: number;
}

export interface AuthUser {
    id: string;
    username: string;
    email: string;
    role: string;
    is_active: boolean;
}

export interface AuthenticatedRequest extends Request {
    user?: AuthUser;
}

export const SecurityService = {
    async verifyPassword(plain: string, hashed: string): Promise<boolean> {
        return bcrypt.compare(plain, hashed);
    },

    async getPasswordHash(password: string): Promise<string> {
        return bcrypt.hash(password, 12);
    },

    async createAccessToken(data: Record<string, unknown>, expiresInSeconds?: number): Promise<string> {
        const now = Math.floor(Date.now() / 1000);
        const exp = now + (expiresInSeconds ?? ACCESS_TOKEN_EXPIRE_MINUTES * 60);

        return new SignJWT({...data, type: 'access'})
            .setProtectedHeader({alg: ALGORITHM})
            .setSubject(String(data.sub ?? data.userId ?? ''))
            .setIssuedAt(now)
            .setExpirationTime(exp)
            .sign(SECRET);
    },

    async createRefreshToken(data: Record<string, unknown>, expiresInSeconds?: number,): Promise<string> {
        const now = Math.floor(Date.now() / 1000);
        const exp =
            now + (expiresInSeconds ?? REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60);

        return new SignJWT({...data, type: 'refresh'})
            .setProtectedHeader({alg: ALGORITHM})
            .setSubject(String(data.sub ?? data.userId ?? ''))
            .setIssuedAt(now)
            .setExpirationTime(exp)
            .sign(SECRET);
    },

    async verifyToken(token: string, isRefresh = false):
        Promise<TokenPayload|null> {
            try {
                const {payload} = await jwtVerify(token, SECRET, {algorithms: [ALGORITHM]});
                const expectedType = isRefresh ? 'refresh' : 'access';

                if (payload.type !== expectedType) {return null;}
                if (typeof payload.sub !== 'string') {return null;}
                if (typeof payload.exp !== 'number') {return null;}
                if (payload.exp < Math.floor(Date.now() / 1000)) {return null;}

                return payload as TokenPayload;
            } catch {
                return null;
            }
        },

    async generatePasswordResetToken(): Promise<string> {
        return randomUUID();
    },

    async generateEmailVerificationToken(): Promise<string> {
        return randomUUID();
    },

    async generateApiKey(): Promise<string> {
        return randomUUID().replace(/-/g, '');
    },

    async validatePasswordStrength(password: string):
        Promise<{is_valid: boolean; errors: string[]; score: number;}> {
            const errors: string[] = [];
            const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';

            if (password.length < 8)
            {errors.push('Пароль должен содержать минимум 8 символов');}
            if (!/\d/.test(password))
            {errors.push('Пароль должен содержать хотя бы одну цифру');}
            if (!/[A-Z]/.test(password))
            {errors.push('Пароль должен содержать хотя бы одну заглавную букву');}
            if (!/[a-z]/.test(password))
            {errors.push('Пароль должен содержать хотя бы одну строчную букву');}
            if (![...specialChars].some((c) => password.includes(c))) {
            errors.push(
                'Пароль должен содержать хотя бы один специальный символ');
            }

            let score = 0;
            score += Math.min(password.length * 3, 30);
            if (/\d/.test(password)) {score += 10;}
            if (/[A-Z]/.test(password)) {score += 10;}
            if (/[a-z]/.test(password)) {score += 10;}
            if ([...specialChars].some((c) => password.includes(c))) {score += 20;}
            if (/\d{3}/.test(password)) {score -= 5;}
            if (/[a-zA-Z]{3}/.test(password)) {score -= 5;}

            return {
            is_valid: errors.length === 0,
            errors,
            score: Math.min(Math.max(score, 0), 100),
            };
        },

    async validateEmail(email: string): Promise<boolean> {
        return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
    },

    async rateLimitCheck(userId: string, action: string, limit: number, windowSeconds: number,): Promise<boolean> {
        const key = `rate_limit:${userId}:${action}`;
        const count = await RedisManager.incr(key);

        if (count === 1) {
            await RedisManager.expire(key, windowSeconds);
        }

        return count <= limit;
    },

    async getRateLimitInfo(userId: string, action: string, limit: number): Promise<{
        current_requests: number; 
        remaining_requests: number; 
        limit: number;
        is_exceeded: boolean;
    }> {
        const key = `rate_limit:${userId}:${action}`;
        const current = await RedisManager.get(key);
        const count = current ? Number.parseInt(current.toString(), 10) : 0;

        return {
            current_requests: count,
            remaining_requests: Math.max(0, limit - count),
            limit,
            is_exceeded: count >= limit,
        };
    },

    async resetRateLimit(userId: string, action: string): Promise<boolean> {
        const key = `rate_limit:${userId}:${action}`;
        const deleted = await RedisManager.delete(key);
        return deleted > 0;
    }
}

export const authMiddleware = async(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({detail: 'Invalid authentication scheme'});
        return;
    }

    const token = authHeader.slice(7);
    if (!token) {
        res.status(401).json({detail: 'Invalid token format'});
        return;
    }

    const payload = await SecurityService.verifyToken(token);
    if (!payload) {
        res.status(401).json({detail: 'Invalid or expired token'});
        return;
    }

    const userId = payload.sub;
    if (!userId) {
        res.status(401).json({detail: 'Invalid token payload: missing user ID'});
        return;
    }

    try {
        const user = await UserService.getById(userId);

        if (!user) {
            res.status(401).json({detail: 'User not found'});
            return;
        }

        if (!user.is_active) {
            res.status(401).json({detail: 'User account is deactivated'});
            return;
        }

        if (!user.id || !user.username || !user.email) {
            res.status(500).json({detail: 'Invalid user data'});
            return;
        }

        req.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            is_active: user.is_active,
        };

        next();
    } catch (error) {
        console.error('Unexpected error in authMiddleware:', error);
        res.status(500).json({detail: 'Internal server error'});
    }
};

export const requireRole = (role: string): RequestHandler => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        const user = req.user;
        if (!user) {
            res.status(401).json({detail: 'Authentication required'});
            return;
        }

        if (user.role !== role) {
            res.status(403).json({detail: 'Insufficient role privileges'});
            return;
        }

        next();
    };
};