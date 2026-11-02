import {RedisManager} from '../core/redis';

export interface ModerationResult {
    is_approved: boolean;
    reasons: string[];
    warning_level: number;
    banned_words_found?: string[];
    is_too_long?: boolean;
    is_rate_limited?: boolean;
    moderation_notes?: string[];
    error?: string;
}

export const SecurityService = {
    bannedWords: new Set(['спам', 'реклама', 'оскорбление', 'мат']),
    suspiciousPatterns: ['http://', 'https://', 'www.'],
    userWarnings: new Map<string, number>(),

    async moderateText(text: string, userId: string): Promise<ModerationResult> {
        const reasons: string[] = [];
        const lower = text.toLowerCase();

        for (const word of this.bannedWords) {
            if (lower.includes(word)) {
                reasons.push(`Обнаружено запрещенное слово: ${word}`);
            }
        }

        for (const pattern of this.suspiciousPatterns) {
            if (lower.includes(pattern)) {
                reasons.push('Обнаружена подозрительная ссылка');
            }
        }

        if (text.length > 1000) {
            reasons.push('Сообщение слишком длинное');
        }

        const isApproved = reasons.length === 0;
        let warningLevel = this.userWarnings.get(userId) ?? 0;

        if (!isApproved) {
            warningLevel += 1;
            this.userWarnings.set(userId, warningLevel);
        }

        return {
            is_approved: isApproved,
            reasons,
            warning_level: warningLevel,
        };
    },

    async moderateContent(content: string, userId: string): Promise<ModerationResult> {
        try {
            const bannedWords = ['спам', 'оскорбление', 'реклама'];
            const lower = content.toLowerCase();
            const found = bannedWords.filter((w) => lower.includes(w));
            const isTooLong = content.length > 1000;

            let isRateLimited = false;
            if (RedisManager) {
                const key = `user_rate:${userId}`;
                const count = await RedisManager.incr(key);
                await RedisManager.expire(key, 60);
                isRateLimited = count > 10;
            }

            const notes: string[] = [];
            if (found.length) {notes.push(`Найдены запрещенные слова: ${found.join(', ')}`);}
            if (isTooLong) {notes.push('Сообщение слишком длинное');}
            if (isRateLimited) {notes.push('Превышен лимит сообщений');}

            return {
                is_approved: found.length === 0 && !isTooLong && !isRateLimited,
                banned_words_found: found,
                is_too_long: isTooLong,
                is_rate_limited: isRateLimited,
                moderation_notes: notes,
                reasons: notes,
                warning_level: this.userWarnings.get(userId) ?? 0,
            };
        } catch (error) {
            return {
                is_approved: true,
                banned_words_found: [],
                is_too_long: false,
                is_rate_limited: false,
                moderation_notes: [`Ошибка модерации: ${error instanceof Error ? error.message : String(error)}`],
                reasons: [],
                warning_level: 0,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    },

    async checkUserRestrictions(userId: string): Promise<boolean> {
        return (this.userWarnings.get(userId) ?? 0) < 3;
    },

    resetUserWarnings(userId: string): void {
        this.userWarnings.delete(userId);
    },

    getModerationStats(): {
        total_banned_words: number; total_warned_users: number;
        user_warnings: Record<string, number>;
    } {
        return {
            total_banned_words: this.bannedWords.size,
            total_warned_users: this.userWarnings.size,
            user_warnings: Object.fromEntries(this.userWarnings),
        };
    }
}