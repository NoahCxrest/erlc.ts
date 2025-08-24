import { ErrorCode, PRCError } from './types.js';

export class PRCAPIError extends Error {
    public readonly code: number | undefined;
    public readonly retryAfter: number | undefined;

    constructor(error: PRCError) {
        super(error.message);
        this.name = 'PRCAPIError';
        this.code = error.code;
        this.retryAfter = error.retryAfter;
    }

    static fromResponse(response: Response, body?: any): PRCAPIError {
        const code = body?.code || 0;
        const message = body?.message || `HTTP ${response.status}: ${response.statusText}`;
        const retryAfter = body?.retry_after;

        return new PRCAPIError({ code, message, retryAfter });
    }

    get isRateLimit(): boolean {
        return this.code === ErrorCode.RATE_LIMITED;
    }

    get isServerOffline(): boolean {
        return this.code === ErrorCode.SERVER_OFFLINE;
    }

    get isAuthError(): boolean {
        return [
            ErrorCode.NO_SERVER_KEY,
            ErrorCode.INVALID_SERVER_KEY_FORMAT,
            ErrorCode.INVALID_SERVER_KEY,
            ErrorCode.INVALID_GLOBAL_KEY,
            ErrorCode.BANNED_SERVER_KEY
        ].includes(this.code as ErrorCode);
    }

    get isRetryable(): boolean {
        return [
            ErrorCode.ROBLOX_ERROR,
            ErrorCode.INTERNAL_ERROR,
            ErrorCode.RATE_LIMITED,
            ErrorCode.SERVER_OFFLINE
        ].includes(this.code as ErrorCode);
    }
}