interface CacheEntry<T> {
    data: T;
    timestamp: number;
    maxAge: number;
}

export class Cache {
    private cache = new Map<string, CacheEntry<any>>();
    private defaultMaxAge: number;

    constructor(defaultMaxAge = 30000) { // ts is 30 seconds
        this.defaultMaxAge = defaultMaxAge;
    }

    set<T>(key: string, data: T, maxAge?: number): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            maxAge: maxAge ?? this.defaultMaxAge
        });
        setTimeout(() => {
            this.cache.delete(key);
        }, maxAge ?? this.defaultMaxAge);
    }

    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        const now = Date.now();
        if (now - entry.timestamp > entry.maxAge) {
            this.cache.delete(key);
            return null;
        }

        return entry.data;
    }

    has(key: string): boolean {
        return this.get(key) !== null;
    }

    delete(key: string): boolean {
        return this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
    }

    size(): number {
        return this.cache.size;
    }
}