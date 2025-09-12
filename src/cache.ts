import { createClient, RedisClientType } from 'redis';

/**
 * Internal cache entry structure.
 * @template T The type of the cached data.
 */
/**
 * Internal cache entry structure.
 * @template T The type of the cached data.
 */
interface CacheEntry<T> {
    data: T;
    timestamp: number;
    maxAge: number;
}

/**
 * Cache class for storing data in memory or Redis.
 * Supports automatic expiration and optional Redis backend.
 */
export class Cache {
    private cache = new Map<string, CacheEntry<any>>();
    private defaultMaxAge: number;
    private redisClient?: RedisClientType;
    private isRedis: boolean;
    private redisKeyPrefix?: string | undefined;

    /**
     * Creates a new Cache instance.
     * @param defaultMaxAge - Default maximum age for cache entries in milliseconds (default: 30000).
     * @param redisUrl - Optional Redis URL for Redis-based caching.
     */
    constructor(defaultMaxAge = 30000, redisUrl?: string, redisKeyPrefix?: string) { // 30 seconds
        this.defaultMaxAge = defaultMaxAge;
        this.isRedis = !!redisUrl;
        this.redisKeyPrefix = redisKeyPrefix;
        if (this.isRedis && redisUrl) {
            this.redisClient = createClient({ url: redisUrl });
            this.redisClient.connect().catch(console.error);
        }
    }

    /**
     * Sets a value in the cache.
     * @template T The type of the data.
     * @param rawKey - The cache key.
     * @param data - The data to cache.
     * @param maxAge - Optional maximum age for this entry in milliseconds.
     */
    async set<T>(rawKey: string, data: T, maxAge?: number): Promise<void> {
        const key = this.redisKeyPrefix ? `${this.redisKeyPrefix}:${rawKey}` : rawKey;
        const age = maxAge ?? this.defaultMaxAge;
        if (this.isRedis && this.redisClient) {
            await this.redisClient.setEx(key, Math.ceil(age / 1000), JSON.stringify(data));
        } else {
            this.cache.set(key, {
                data,
                timestamp: Date.now(),
                maxAge: age
            });
            setTimeout(() => {
                this.cache.delete(key);
            }, age);
        }
    }

    /**
     * Gets a value from the cache.
     * @template T The type of the data.
     * @param rawKey - The cache key.
     * @returns The cached data or null if not found or expired.
     */
    async get<T>(rawKey: string): Promise<T | null> {
        const key = this.redisKeyPrefix ? `${this.redisKeyPrefix}:${rawKey}` : rawKey;
        if (this.isRedis && this.redisClient) {
            const data = await this.redisClient.get(key);
            return data ? JSON.parse(data) : null;
        } else {
            const entry = this.cache.get(key);
            if (!entry) return null;

            const now = Date.now();
            if (now - entry.timestamp > entry.maxAge) {
                this.cache.delete(key);
                return null;
            }

            return entry.data;
        }
    }

    /**
     * Checks if a key exists in the cache.
     * @param key - The cache key.
     * @returns True if the key exists and is not expired.
     */
    async has(key: string): Promise<boolean> {
        return (await this.get(this.redisKeyPrefix ? `${this.redisKeyPrefix}:${key}` : key)) !== null;
    }

    /**
     * Deletes a key from the cache.
     * @param rawKey - The cache key.
     * @returns True if the key was deleted.
     */
    async delete(rawKey: string): Promise<boolean> {
        const key = this.redisKeyPrefix ? `${this.redisKeyPrefix}:${rawKey}` : rawKey
        if (this.isRedis && this.redisClient) {
            const result = await this.redisClient.del(rawKey);
            return result > 0;
        } else {
            return this.cache.delete(rawKey);
        }
    }

    /**
     * Clears all entries from the cache.
     */
    async clear(): Promise<void> {
        if (this.isRedis && this.redisClient) {
            await this.redisClient.flushAll();
        } else {
            this.cache.clear();
        }
    }

    /**
     * Gets the number of entries in the cache.
     * @returns The number of cached entries.
     */
    async size(): Promise<number> {
        if (this.isRedis && this.redisClient) {
            const keys = await this.redisClient.keys('*');
            return keys.length;
        } else {
            return this.cache.size;
        }
    }

    /**
     * Gets the raw cache entry for debugging (in-memory only).
     * @template T The type of the data.
     * @param key - The cache key.
     * @returns The raw cache entry or null.
     * @throws Error if using Redis.
     */
    getRawEntry<T>(key: string): CacheEntry<T> | null {
        if (this.isRedis) {
            throw new Error('Cannot get raw entry from Redis cache');
        }
        return this.cache.get(this.redisKeyPrefix ? `${this.redisKeyPrefix}:${key}` : key) || null;
    }

        /**
     * Gets all cache keys for debugging (in-memory only).
     * @returns Array of cache keys.
     * @throws Error if using Redis.
     */
    getAllKeys(): string[] {
        if (this.isRedis) {
            throw new Error('Cannot get all keys from Redis cache');
        }
        return Array.from(this.cache.keys());
    }

    /**
     * Disconnects the Redis client if connected.
     */
    async disconnect(): Promise<void> {
        if (this.redisClient) {
            await this.redisClient.disconnect();
        }
    }
}