/**
 * RateLimiter provides utility for handling retry-after logic.
 */
export class RateLimiter {
	/**
	 * Waits for the specified retry_after (in seconds) before resolving.
	 * @param {number} retryAfter - The number of seconds to wait.
	 */
	static async waitForRetryAfter(retryAfter: number): Promise<void> {
		if (typeof retryAfter === 'number' && retryAfter > 0) {
			await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
		}
	}
}