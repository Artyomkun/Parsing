import 'dotenv/config';

const required = (name: string, fallback?: string): string => {
    const value = process.env[name] ?? fallback;
    if (value === undefined) {
        throw new Error(`Missing required env var: ${name}`);
    }
    return value;
};

const int = (name: string, fallback: number): number => {
    const raw = process.env[name];
    if (raw === undefined) {return fallback;}
    const parsed = Number.parseInt(raw, 10);
    if (Number.isNaN(parsed)) {
        throw new Error(`Env var ${name} must be an integer, got: ${raw}`);
    }
    return parsed;
};

const list = (name: string, fallback: string[]): string[] => {
    const raw = process.env[name];
    if (raw === undefined) {return fallback;}
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
};

export const settings = {
    APP_NAME: required('APP_NAME', 'Chat Bot'),
    PORT: int('PORT', 8000),
    CORS_ORIGINS: list('CORS_ORIGINS', ['http://localhost:3000', 'http://127.0.0.1:3000']),
    DATABASE_URL: required('DATABASE_URL', 'sqlite:///./chatbot.db'),
    REDIS_HOST: required('REDIS_HOST', 'localhost'),
    REDIS_PORT: int('REDIS_PORT', 6379),
    get REDIS_URL(): string {
        return `redis://${this.REDIS_HOST}:${this.REDIS_PORT}`;
    },
    RATE_LIMIT_REQUESTS: int('RATE_LIMIT_REQUESTS', 100),
    RATE_LIMIT_WINDOW: int('RATE_LIMIT_WINDOW', 3600),
};