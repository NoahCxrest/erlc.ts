import { ErrorCode, PRCError } from './types.js';

/**
 * Custom error class for PRC API errors.
 * Extends the built-in Error class with additional properties.
 */
export class PRCAPIError extends Error {
    public readonly code: number | undefined;
    public readonly retryAfter: number | undefined;

    /**
     * Creates a new PRCAPIError instance.
     * @param error - The PRC error object.
     */
    constructor(error: PRCError) {
        super(error.message);
        this.name = 'PRCAPIError';
        this.code = error.code;
        this.retryAfter = error.retryAfter;
    }

    /**
     * Creates a PRCAPIError from a Response object.
     * @param response - The fetch Response object.
     * @param body - Optional response body.
     * @returns A new PRCAPIError instance.
     */
    static fromResponse(response: Response, body?: any): PRCAPIError {
        const code = body?.code || 0;
        const message = body?.message || `HTTP ${response.status}: ${response.statusText}`;
        const retryAfter = body?.retry_after;

        return new PRCAPIError({ code, message, retryAfter });
    }

    /**
     * Checks if the error is a rate limit error.
     * @returns True if the error code is RATE_LIMITED.
     */
    get isRateLimit(): boolean {
        return this.code === ErrorCode.RATE_LIMITED;
    }

    /**
     * Checks if the error is due to server being offline.
     * @returns True if the error code is SERVER_OFFLINE.
     */
    get isServerOffline(): boolean {
        return this.code === ErrorCode.SERVER_OFFLINE;
    }

    /**
     * Checks if the error is an authentication error.
     * @returns True if the error code is an auth-related code.
     */
    get isAuthError(): boolean {
        return [
            ErrorCode.NO_SERVER_KEY,
            ErrorCode.INVALID_SERVER_KEY_FORMAT,
            ErrorCode.INVALID_SERVER_KEY,
            ErrorCode.INVALID_GLOBAL_KEY,
            ErrorCode.BANNED_SERVER_KEY
        ].includes(this.code as ErrorCode);
    }

    /**
     * Checks if the error is retryable.
     * @returns True if the error can be retried.
     */
    get isRetryable(): boolean {
        return [
            ErrorCode.ROBLOX_ERROR,
            ErrorCode.INTERNAL_ERROR,
            ErrorCode.RATE_LIMITED,
            ErrorCode.SERVER_OFFLINE
        ].includes(this.code as ErrorCode);
    }
}