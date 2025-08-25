export class RateLimiter {
	static async waitForRetryAfter(retryAfter: number): Promise<void> {
		if (typeof retryAfter === 'number' && retryAfter > 0) {
			await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
		}
	}
}