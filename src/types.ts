/**
 * Configuration options for the PRCClient.
 */
export interface PRCClientOptions {
    serverKey?: string;
    globalKey?: string;
    baseURL?: string;
    cache?: boolean;
    cacheMaxAge?: number;
    redisUrl?: string;
}

/**
 * Information about the current rate limit status.
 */
export interface RateLimitInfo {
    bucket: string;
    limit: number;
    remaining: number;
    reset: number;
}

/**
 * Represents an error returned by the PRC API.
 */
export interface PRCError {
    code: number;
    message: string;
    retryAfter?: number;
}

/**
 * Represents the current status of the server.
 */
export interface ServerStatus {
    Name: string;
    OwnerId: number;
    CoOwnerIds: number[];
    CurrentPlayers: number;
    MaxPlayers: number;
    JoinKey: string;
    AccVerifiedReq: 'Disabled' | 'Enabled' | 'Phone/ID';
    TeamBalance: boolean;
}

/**
 * Represents a player on the server.
 */
export interface Player {
    /**
     * Formatted as PlayerName:ID
     */
    Player: string;
    Permission: 'Normal' | 'Server Administrator' | 'Server Owner' | 'Server Moderator';
    /**
     * Only available if player is on non-civilian team
     */
    Callsign?: string;
    Team: 'Police' | 'Jail' | 'Sheriff' | 'DOT' | 'Fire' | 'Civilian';
}

/**
 * Represents a join or leave log entry.
 */
export interface JoinLog {
    Join: boolean;
    Timestamp: number;
    /**
     * Formatted as PlayerName:ID
     */
    Player: string;
}

/**
 * Represents a kill log entry.
 */
export interface KillLog {
    /**
     * Formatted as PlayerName:ID
     */
    Killed: string;
    Timestamp: number;
    /**
     * Formatted as PlayerName:ID
     */
    Killer: string;
}

/**
 * Represents a command log entry.
 */
export interface CommandLog {
    /**
     * Formatted as PlayerName:ID
     */
    Player: string;
    Timestamp: number;
    Command: string;
}

/**
 * Represents a mod call entry.
 */
export interface ModCall {
    /**
     * Formatted as PlayerName:ID
     */
    Caller: string;
    /**
     * Only available if a moderator responded to the call
     * Formatted as PlayerName:ID
     */
    Moderator?: string;
    Timestamp: number;
}

/**
 * Represents a vehicle on the server.
 */
export interface Vehicle {
    Texture: string;
    Name: string;
    Owner: string;
}

/**
 * A record of banned players, keyed by player ID.
 */
export interface ServerBans {
    [playerId: string]: string;
}

/**
 * Represents the staff members of the server.
 */
export interface ServerStaff {
    CoOwners: number[];
    Admins: Record<string, string>;
    Mods: Record<string, string>;
}

/**
 * The response structure for API calls.
 * @template T The type of the data returned.
 */
export interface APIResponse<T = any> {
    data: T;
    rateLimit?: RateLimitInfo;
}

/**
 * Enumeration of error codes returned by the PRC API.
 */
export enum ErrorCode {
    UNKNOWN = 0,
    ROBLOX_ERROR = 1001,
    INTERNAL_ERROR = 1002,
    NO_SERVER_KEY = 2000,
    INVALID_SERVER_KEY_FORMAT = 2001,
    INVALID_SERVER_KEY = 2002,
    INVALID_GLOBAL_KEY = 2003,
    BANNED_SERVER_KEY = 2004,
    INVALID_COMMAND = 3001,
    SERVER_OFFLINE = 3002,
    RATE_LIMITED = 4001,
    RESTRICTED_COMMAND = 4002,
    PROHIBITED_MESSAGE = 4003,
    RESTRICTED_RESOURCE = 9998,
    OUTDATED_MODULE = 9999,
}