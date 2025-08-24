export interface PRCClientOptions {
    serverKey?: string;
    globalKey?: string;
    baseURL?: string;
    cache?: boolean;
    cacheMaxAge?: number;
}

export interface RateLimitInfo {
    bucket: string;
    limit: number;
    remaining: number;
    reset: number;
}

export interface PRCError {
    code: number;
    message: string;
    retryAfter?: number;
}

export interface ServerStatus {
    Name: string;
    OwnerId: number;
    CoOwnerIds: number[];
    CurrentPlayers: number;
    MaxPlayers: number;
    JoinKey: string;
    AccVerifiedReq: string;
    TeamBalance: boolean;
}

export interface Player {
    Player: string;
    Permission: 'Normal' | 'Server Administrator' | 'Server Owner' | 'Server Moderator';
    Callsign?: string;
    Team: 'Police' | 'Jail' | 'Sheriff' | 'DOT' | 'Fire' | 'Civilian';
}

export interface JoinLog {
    Join: boolean;
    Timestamp: number;
    Player: string;
}

export interface KillLog {
    Killed: string;
    Timestamp: number;
    Killer: string;
}

export interface CommandLog {
    Player: string;
    Timestamp: number;
    Command: string;
}

export interface ModCall {
    Caller: string;
    Moderator?: string;
    Timestamp: number;
}

export interface Vehicle {
    Texture: string;
    Name: string;
    Owner: string;
}

export interface ServerBans {
    [playerId: string]: string;
}

export interface ServerStaff {
    CoOwners: number[];
    Admins: Record<string, string>;
    Mods: Record<string, string>;
}

export interface APIResponse<T = any> {
    data: T;
    rateLimit?: RateLimitInfo;
}

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
    OUTDATED_MODULE = 9999
}