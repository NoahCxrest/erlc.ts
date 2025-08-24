export interface RateLimitBucket {
    limit: number;
    remaining: number;
    reset: number;
}

export class RateLimitManager {
    private buckets = new Map<string, RateLimitBucket>();

    updateBucket(bucket: string, limit: number, remaining: number, reset: number): void {
        this.buckets.set(bucket, { limit, remaining, reset });
    }

    canMakeRequest(bucket: string): boolean {
        const bucketInfo = this.buckets.get(bucket);
        if (!bucketInfo) return true;

        const now = Date.now() / 1000;
        if (now >= bucketInfo.reset) {
            this.buckets.delete(bucket);
            return true;
        }

        return bucketInfo.remaining > 0;
    }

    getTimeUntilReset(bucket: string): number {
        const bucketInfo = this.buckets.get(bucket);
        if (!bucketInfo) return 0;

        const now = Date.now() / 1000;
        return Math.max(0, (bucketInfo.reset - now) * 1000);
    }

    getBucketInfo(bucket: string): RateLimitBucket | null {
        return this.buckets.get(bucket) || null;
    }

    async waitForReset(bucket: string): Promise<void> {
        const waitTime = this.getTimeUntilReset(bucket);
        if (waitTime > 0) {
            await new Promise(resolve => setTimeout(resolve, waitTime + 500)); // +100ms buffer
        }
    }
}