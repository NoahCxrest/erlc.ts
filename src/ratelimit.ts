/**
 * Utility class for handling rate limit retries.
 */
export class RateLimiter {
    /**
     * Waits for the specified retry-after time.
     * @param retryAfter - The number of seconds to wait.
     */
    static async waitForRetryAfter(retryAfter: number): Promise<void> {
        if (typeof retryAfter === 'number' && retryAfter > 0) {
            await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        }
    }
}