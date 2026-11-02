import Redis from 'ioredis';
import { settings } from './config';

class MemoryStorage {
    private storage = new Map<string, string>();
    private expiry = new Map<string, number>();
    private counters = new Map<string, number>();
    private lists = new Map<string, string[]>();
    private sets = new Map<string, Set<string>>();
    private zsets = new Map<string, Map<string, number>>();
    private hashes = new Map<string, Map<string, string>>();

    private isExpired(key: string): boolean {
        const exp = this.expiry.get(key);
        if (exp !== undefined && exp < Date.now() / 1000) {
            this.storage.delete(key);
            this.expiry.delete(key);
            this.counters.delete(key);
            this.lists.delete(key);
            this.sets.delete(key);
            this.zsets.delete(key);
            this.hashes.delete(key);
            return true;
        }
        return false;
    }

    async get(key: string): Promise<Buffer | null> {
        if (this.isExpired(key)) {return null;}
        const value = this.storage.get(key);
        return value !== undefined ? Buffer.from(value, 'utf-8') : null;
    }

    async set(key: string, value: string): Promise<void> {
        this.storage.set(key, value);
    }

    async setex(key: string, seconds: number, value: string): Promise<void> {
        this.storage.set(key, value);
        this.expiry.set(key, Date.now() / 1000 + seconds);
    }

    async incr(key: string): Promise<number> {
        const current = this.counters.get(key) ?? 0;
        this.counters.set(key, current + 1);
        return current + 1;
    }

    async delete(...keys: string[]): Promise<number> {
        let count = 0;
        for (const key of keys) {
            if (this.storage.has(key)) {
                this.storage.delete(key);
                count++;
            }
            this.expiry.delete(key);
            this.counters.delete(key);
            this.lists.delete(key);
            this.sets.delete(key);
            this.zsets.delete(key);
            this.hashes.delete(key);
        }
        return count;
    }

    async exists(key: string): Promise<boolean> {
        return this.storage.has(key) && !this.isExpired(key);
    }

    async expire(key: string, seconds: number): Promise<boolean> {
        if (!this.storage.has(key) && !this.hashes.has(key) && !this.lists.has(key)) {
            return false;
        }
        this.expiry.set(key, Date.now() / 1000 + seconds);
        return true;
    }

    async ttl(key: string): Promise<number> {
        const exp = this.expiry.get(key);
        if (exp === undefined) {return -1;}
        const ttl = Math.floor(exp - Date.now() / 1000);
        return ttl > 0 ? ttl : -2;
    }

    async ping(): Promise<boolean> {
        return true;
    }

    async sadd(key: string, ...members: string[]): Promise<number> {
        let set = this.sets.get(key);
        if (!set) {
            set = new Set();
            this.sets.set(key, set);
        }
        let added = 0;
        for (const m of members) {
            if (!set.has(m)) {
                set.add(m);
                added++;
            }
        }
        return added;
    }

    async srem(key: string, ...members: string[]): Promise<number> {
        const set = this.sets.get(key);
        if (!set) {return 0;}
        let removed = 0;
        for (const m of members) {
            if (set.delete(m)) {removed++;}
        }
        if (set.size === 0) {this.sets.delete(key);}
        return removed;
    }

    async smembers(key: string): Promise<Set<Buffer>> {
        const set = this.sets.get(key) ?? new Set();
        return new Set([...set].map((m) => Buffer.from(m, 'utf-8')));
    }

    async sismember(key: string, member: string): Promise<boolean> {
        return this.sets.get(key)?.has(member) ?? false;
    }

    async lpush(key: string, ...values: string[]): Promise<number> {
        const list = this.lists.get(key) ?? [];
        list.unshift(...values);
        this.lists.set(key, list);
        return list.length;
    }

    async rpush(key: string, ...values: string[]): Promise<number> {
        const list = this.lists.get(key) ?? [];
        list.push(...values);
        this.lists.set(key, list);
        return list.length;
    }

    async lrange(key: string, start: number, end: number): Promise<Buffer[]> {
        const list = this.lists.get(key) ?? [];
        const sliced = end === -1 ? list.slice(start) : list.slice(start, end + 1);
        return sliced.map((s) => Buffer.from(s, 'utf-8'));
    }

    async ltrim(key: string, start: number, end: number): Promise<boolean> {
        const list = this.lists.get(key);
        if (!list) {return false;}
        this.lists.set(key, end === -1 ? list.slice(start) : list.slice(start, end + 1));
        return true;
    }

    async hset(key: string, mapping: Record<string, string>): Promise<number> {
        let hash = this.hashes.get(key);
        if (!hash) {
            hash = new Map();
            this.hashes.set(key, hash);
        }
        let added = 0;
        for (const [field, value] of Object.entries(mapping)) {
            if (!hash.has(field)) {added++;}
            hash.set(field, value);
        }
        return added;
    }

    async hget(key: string, field: string): Promise<Buffer | null> {
        if (this.isExpired(key)) {return null;}
        const value = this.hashes.get(key)?.get(field);
        return value !== undefined ? Buffer.from(value, 'utf-8') : null;
    }

    async hgetall(key: string): Promise<Record<string, Buffer>> {
        if (this.isExpired(key)) {return {};}
        const hash = this.hashes.get(key);
        if (!hash) {return {};}
        const result: Record<string, Buffer> = {};
        for (const [k, v] of hash) {
            result[k] = Buffer.from(v, 'utf-8');
        }
        return result;
    }

    async hdel(key: string, ...fields: string[]): Promise<number> {
        const hash = this.hashes.get(key);
        if (!hash) {return 0;}
        let removed = 0;
        for (const f of fields) {
            if (hash.delete(f)) {removed++;}
        }
        if (hash.size === 0) {this.hashes.delete(key);}
        return removed;
    }

    async hincrby(key: string, field: string, increment = 1): Promise<number> {
        const current = await this.hget(key, field);
        const newValue = (current ? Number.parseInt(current.toString(), 10) : 0) + increment;
        await this.hset(key, { [field]: String(newValue) });
        return newValue;
    }

    async zadd(key: string, mapping: Record<string, number>): Promise<number> {
        let zset = this.zsets.get(key);
        if (!zset) {
            zset = new Map();
            this.zsets.set(key, zset);
        }
        let added = 0;
        for (const [member, score] of Object.entries(mapping)) {
            if (!zset.has(member) || zset.get(member) !== score) {
                zset.set(member, score);
                added++;
            }
        }
        return added;
    }

    async zrange(key: string, start: number, end: number, withScores = false): Promise<unknown[]> {
        const zset = this.zsets.get(key);
        if (!zset) {return [];}
        const sorted = [...zset.entries()].sort((a, b) => a[1] - b[1]);
        const sliced = end === -1 ? sorted.slice(start) : sorted.slice(start, end + 1);
        if (withScores) {
            return sliced.map(([m, s]) => [Buffer.from(m, 'utf-8'), s]);
        }
        return sliced.map(([m]) => Buffer.from(m, 'utf-8'));
    }

    async size(): Promise<number> {
        return this.storage.size;
    }

    async allKeys(): Promise<string[]> {
        return [...this.storage.keys()];
    }
}

interface RedisLike {
	initialize(): Promise<void>;
	close(): Promise<void>;
	isUsingMemory(): boolean;

	get(key: string): Promise<Buffer | null>;
	set(key: string, value: string): Promise<void>;
	setex(key: string, seconds: number, value: string): Promise<void>;
	incr(key: string): Promise<number>;
	delete(...keys: string[]): Promise<number>;
	exists(key: string): Promise<boolean>;
	expire(key: string, seconds: number): Promise<boolean>;
	ttl(key: string): Promise<number>;
	ping(): Promise<boolean>;
	dbsize(): Promise<number>;
	keys(pattern?: string): Promise<string[]>;

	sadd(key: string, ...members: string[]): Promise<number>;
	srem(key: string, ...members: string[]): Promise<number>;
	smembers(key: string): Promise<Set<Buffer>>;
	sismember(key: string, member: string): Promise<boolean>;

	lpush(key: string, ...values: string[]): Promise<number>;
	rpush(key: string, ...values: string[]): Promise<number>;
	lrange(key: string, start: number, end: number): Promise<Buffer[]>;
	ltrim(key: string, start: number, end: number): Promise<boolean>;

	hset(key: string, mapping: Record<string, string>): Promise<number>;
	hget(key: string, field: string): Promise<Buffer | null>;
	hgetall(key: string): Promise<Record<string, Buffer>>;
	hdel(key: string, ...fields: string[]): Promise<number>;
	hincrby(key: string, field: string, increment?: number): Promise<number>;

	zadd(key: string, mapping: Record<string, number>): Promise<number>;
	zrange(key: string, start: number, end: number, withScores?: boolean): Promise<unknown[]>;
}

export const RedisManager: RedisLike = (() => {
	const memory = new MemoryStorage();

	let client: Redis | null = null;
	let useMemory = false;
	let initialized = false;

	const markMemoryFallback = (reason: unknown): void => {
		if (!useMemory) {
			console.warn('[redis] Falling back to MemoryStorage:', reason);
		}
		useMemory = true;
		client = null;
	};

	const withFallback = async <T>(
		redisFn: (c: Redis) => Promise<T>,
		memoryFn: () => Promise<T>,
	): Promise<T> => {
		if (useMemory || !client) {return memoryFn();}

		try {
			return await redisFn(client);
		} catch (error) {
			markMemoryFallback(error);
			return memoryFn();
		}
	};

	return {
		async initialize(): Promise<void> {
			if (initialized) {return;}
			initialized = true;

			if (!settings.REDIS_HOST || !settings.REDIS_PORT) {
				markMemoryFallback('REDIS_HOST or REDIS_PORT not configured');
				return;
			}

			try {
				client = new Redis({
					host: settings.REDIS_HOST,
					port: settings.REDIS_PORT,
					db: 0,
					connectTimeout: 5000,
					commandTimeout: 5000,
					maxRetriesPerRequest: 2,
					lazyConnect: false,
					enableOfflineQueue: false,
				});

				client.on('error', (err) => {
					console.error('[redis] Client error:', err.message);
				});

				client.on('end', () => {
					console.warn('[redis] Connection closed');
				});

				const pong = await client.ping();
				if (pong !== 'PONG') {
					throw new Error(`Unexpected PING response: ${pong}`);
				}

				useMemory = false;
				console.log('[redis] Connection successful');
			} catch (error) {
				markMemoryFallback(error);
			}
		},

		async close(): Promise<void> {
			if (!client) {return;}
			try {
				await client.quit();
			} catch (error) {
				console.warn('[redis] Error during close:', error);
				client.disconnect();
			} finally {
				client = null;
			}
		},

		isUsingMemory(): boolean {
			return useMemory || !client;
		},

		async get(key: string): Promise<Buffer | null> {
			return withFallback(
				(c) => c.getBuffer(key),
				() => memory.get(key),
			);
		},

		async set(key: string, value: string): Promise<void> {
			return withFallback(
				async (c) => { await c.set(key, value); },
				() => memory.set(key, value),
			);
		},

		async setex(key: string, seconds: number, value: string): Promise<void> {
			return withFallback(
				async (c) => { await c.setex(key, seconds, value); },
				() => memory.setex(key, seconds, value),
			);
		},

		async incr(key: string): Promise<number> {
			return withFallback(
				(c) => c.incr(key),
				() => memory.incr(key),
			);
		},

		async delete(...keys: string[]): Promise<number> {
			return withFallback(
				(c) => c.del(...keys),
				() => memory.delete(...keys),
			);
		},

		async exists(key: string): Promise<boolean> {
			return withFallback(
				async (c) => (await c.exists(key)) > 0,
				() => memory.exists(key),
			);
		},

		async expire(key: string, seconds: number): Promise<boolean> {
			return withFallback(
				async (c) => (await c.expire(key, seconds)) === 1,
				() => memory.expire(key, seconds),
			);
		},

		async ttl(key: string): Promise<number> {
			return withFallback(
				(c) => c.ttl(key),
				() => memory.ttl(key),
			);
		},

		async ping(): Promise<boolean> {
			if (useMemory || !client) {return memory.ping();}
			try {
				const res = await client.ping();
				return res === 'PONG';
			} catch {
				return false;
			}
		},

		async dbsize(): Promise<number> {
			return withFallback(
				(c) => c.dbsize(),
				() => memory.size(),
			);
		},

		async keys(pattern = '*'): Promise<string[]> {
			return withFallback(
				(c) => c.keys(pattern),
				async () => {
					const all = await memory.allKeys();
					if (pattern === '*') {return all;}
					const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
					return all.filter((k) => regex.test(k));
				},
			);
		},

		async sadd(key: string, ...members: string[]): Promise<number> {
			return withFallback(
				(c) => c.sadd(key, ...members),
				() => memory.sadd(key, ...members),
			);
		},

		async srem(key: string, ...members: string[]): Promise<number> {
			return withFallback(
				(c) => c.srem(key, ...members),
				() => memory.srem(key, ...members),
			);
		},

		async smembers(key: string): Promise<Set<Buffer>> {
			return withFallback(
				async (c) => new Set((await c.smembers(key)).map((m) => Buffer.from(m, 'utf-8'))),
				() => memory.smembers(key),
			);
		},

		async sismember(key: string, member: string): Promise<boolean> {
			return withFallback(
				async (c) => (await c.sismember(key, member)) === 1,
				() => memory.sismember(key, member),
			);
		},

		async lpush(key: string, ...values: string[]): Promise<number> {
			return withFallback(
				(c) => c.lpush(key, ...values),
				() => memory.lpush(key, ...values),
			);
		},

		async rpush(key: string, ...values: string[]): Promise<number> {
			return withFallback(
				(c) => c.rpush(key, ...values),
				() => memory.rpush(key, ...values),
			);
		},

		async lrange(key: string, start: number, end: number): Promise<Buffer[]> {
			return withFallback(
				async (c) => (await c.lrangeBuffer(key, start, end)) as Buffer[],
				() => memory.lrange(key, start, end),
			);
		},

		async ltrim(key: string, start: number, end: number): Promise<boolean> {
			return withFallback(
				async (c) => { await c.ltrim(key, start, end); return true; },
				() => memory.ltrim(key, start, end),
			);
		},

		async hset(key: string, mapping: Record<string, string>): Promise<number> {
			return withFallback(
				(c) => c.hset(key, mapping),
				() => memory.hset(key, mapping),
			);
		},

		async hget(key: string, field: string): Promise<Buffer | null> {
			return withFallback(
				(c) => c.hgetBuffer(key, field),
				() => memory.hget(key, field),
			);
		},

		async hgetall(key: string): Promise<Record<string, Buffer>> {
			return withFallback(
				async (c) => {
					const raw = await c.hgetallBuffer(key);
					const result: Record<string, Buffer> = {};
					for (const [k, v] of Object.entries(raw)) {
						result[k] = v;
					}
					return result;
				},
				() => memory.hgetall(key),
			);
		},

		async hdel(key: string, ...fields: string[]): Promise<number> {
			return withFallback(
				(c) => c.hdel(key, ...fields),
				() => memory.hdel(key, ...fields),
			);
		},

		async hincrby(key: string, field: string, increment = 1): Promise<number> {
			return withFallback(
				(c) => c.hincrby(key, field, increment),
				() => memory.hincrby(key, field, increment),
			);
		},

		async zadd(key: string, mapping: Record<string, number>): Promise<number> {
			return withFallback(
				async (c) => {
					const args: (string | number)[] = [];
					for (const [member, score] of Object.entries(mapping)) {
						args.push(score, member);
					}
					return c.zadd(key, ...args);
				},
				() => memory.zadd(key, mapping),
			);
		},

		async zrange(key: string, start: number, end: number, withScores = false): Promise<unknown[]> {
			return withFallback(
				async (c) => {
					const raw = withScores
						? await c.zrange(key, String(start), String(end), 'WITHSCORES')
						: await c.zrange(key, String(start), String(end));
					return raw.map((v) => Buffer.from(v, 'utf-8'));
				},
				() => memory.zrange(key, start, end, withScores),
			);
		},
	};
})();

export const initializeRedis = async (): Promise<void> => {
	await RedisManager.initialize();
};