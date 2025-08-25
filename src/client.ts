import { RateLimiter } from './ratelimit.js';
import { Cache } from './cache.js';
import { PRCAPIError } from './errors.js';
import {
  PRCClientOptions,
  APIResponse,
  RateLimitInfo,
  ServerStatus,
  Player,
  JoinLog,
  KillLog,
  CommandLog,
  ModCall,
  Vehicle,
  ServerBans,
  ServerStaff
} from './types.js';

/**
 * PRCClient provides methods to interact with the Police Roleplay Community API.
 * Handles caching, rate limiting, and error management for API requests.
 */
export class PRCClient {
  private readonly baseURL: string;
  private readonly serverKey: string | undefined;
  private readonly globalKey: string | undefined;
  private readonly cache: Cache | null;

  /**
   * Creates a new PRCClient instance.
   * @param {PRCClientOptions} options - Configuration options for the client.
   * @throws {Error} If neither serverKey nor globalKey is provided.
   */
  constructor(options: PRCClientOptions = {}) {
    if (!options.serverKey && !options.globalKey) {
      throw new Error('Either serverKey or globalKey must be provided');
    }

    this.baseURL = options.baseURL || 'https://api.policeroleplay.community/v1';
    this.serverKey = options.serverKey;
    this.globalKey = options.globalKey;
    this.cache = options.cache !== false ? new Cache(options.cacheMaxAge) : null;
  }

  /**
   * Constructs the headers for API requests.
   * @returns {Record<string, string>} The headers object.
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': '*/*',
    };

    if (this.globalKey) {
      headers['Authorization'] = this.globalKey;
    }

    if (this.serverKey) {
      headers['Server-Key'] = this.serverKey;
    }

    return headers;
  }

  /**
   * Extracts rate limit information from the API response headers and updates the rate limiter.
   * @param {Response} response - The fetch response object.
   * @returns {RateLimitInfo | undefined} The extracted rate limit info, if available.
   */
  // No-op: Rate limit info is not tracked client-side anymore
  private extractRateLimitInfo(_response: Response): RateLimitInfo | undefined {
    return undefined;
  }

  /**
   * Makes an HTTP request to the API, handling caching, rate limiting, and retries.
   * @template T
   * @param {'GET' | 'POST'} method - HTTP method.
   * @param {string} endpoint - API endpoint.
   * @param {any} [body] - Request body for POST requests.
   * @param {string} [bucket='global'] - Rate limit bucket.
   * @param {boolean} [cacheable=false] - Whether to use cache for GET requests.
   * @param {number} [retryCount=0] - Current retry count for rate limit errors.
   * @returns {Promise<APIResponse<T>>} The API response.
   * @throws {PRCAPIError} If the request fails.
   */
  private async makeRequest<T>(
    method: 'GET' | 'POST',
    endpoint: string,
    body?: any,
    bucket: string = 'global',
    cacheable: boolean = false,
    retryCount: number = 0
  ): Promise<APIResponse<T>> {

    const url = `${this.baseURL}${endpoint}`;
    const cacheKey = `${method}:${endpoint}`;
    const MAX_RETRIES = 3;

    if (cacheable && method === 'GET' && this.cache?.has(cacheKey)) {
      return { data: this.cache.get<T>(cacheKey)! };
    }

    // No client-side rate limit check; handled by retry_after from server


    const fetchOptions: RequestInit = {
      method,
      headers: this.getHeaders(),
    };
    if (method !== 'GET' && body) {
      fetchOptions.body = JSON.stringify(body);
    }
    const response = await fetch(url, fetchOptions);

    const rateLimitInfo = this.extractRateLimitInfo(response);


    if (!response.ok) {
      let errorBody: any = {};
      try {
        errorBody = await response.json();
      } catch { }
      if (
        errorBody &&
        ((errorBody?.code === 4001 || errorBody?.errorCode === 4001)) &&
        retryCount < MAX_RETRIES
      ) {
        if (typeof errorBody?.retry_after === 'number' && errorBody?.retry_after > 0) {
          await RateLimiter.waitForRetryAfter(errorBody.retry_after);
        }
        return this.makeRequest<T>(method, endpoint, body, bucket, cacheable, retryCount + 1);
      }
      throw PRCAPIError.fromResponse(response, errorBody);
    }


    let data: T;
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      data = (await response.json()) as T;
    } else {
      data = null as T;
    }


    if (cacheable && method === 'GET' && this.cache) {
      this.cache.set(cacheKey, data);
    }

    return { data, rateLimit: rateLimitInfo as RateLimitInfo };
  }

  /**
   * Gets the current server status.
   * @returns {Promise<APIResponse<ServerStatus>>} The server status response.
   */
  async getServerStatus(): Promise<APIResponse<ServerStatus>> {
    return this.makeRequest<ServerStatus>('GET', '/server', undefined, 'global', true);
  }

  /**
   * Gets the list of current players on the server.
   * @returns {Promise<APIResponse<Player[]>>} The players response.
   */
  async getPlayers(): Promise<APIResponse<Player[]>> {
    return this.makeRequest<Player[]>('GET', '/server/players', undefined, 'global', true);
  }

  /**
   * Gets the current server queue.
   * @returns {Promise<APIResponse<number[]>>} The queue response.
   */
  async getQueue(): Promise<APIResponse<number[]>> {
    return this.makeRequest<number[]>('GET', '/server/queue', undefined, 'global', true);
  }

  /**
   * Gets the list of vehicles on the server.
   * @returns {Promise<APIResponse<Vehicle[]>>} The vehicles response.
   */
  async getVehicles(): Promise<APIResponse<Vehicle[]>> {
    return this.makeRequest<Vehicle[]>('GET', '/server/vehicles', undefined, 'global', true);
  }

  /**
   * Gets the list of server bans.
   * @returns {Promise<APIResponse<ServerBans>>} The bans response.
   */
  async getBans(): Promise<APIResponse<ServerBans>> {
    return this.makeRequest<ServerBans>('GET', '/server/bans', undefined, 'global', true);
  }

  /**
   * Gets the list of server staff.
   * @returns {Promise<APIResponse<ServerStaff>>} The staff response.
   */
  async getStaff(): Promise<APIResponse<ServerStaff>> {
    return this.makeRequest<ServerStaff>('GET', '/server/staff', undefined, 'global', true);
  }

  /**
   * Gets the join logs for the server.
   * @returns {Promise<APIResponse<JoinLog[]>>} The join logs response.
   */
  async getJoinLogs(): Promise<APIResponse<JoinLog[]>> {
    return this.makeRequest<JoinLog[]>('GET', '/server/joinlogs', undefined, 'global', false);
  }

  /**
   * Gets the kill logs for the server.
   * @returns {Promise<APIResponse<KillLog[]>>} The kill logs response.
   */
  async getKillLogs(): Promise<APIResponse<KillLog[]>> {
    return this.makeRequest<KillLog[]>('GET', '/server/killlogs', undefined, 'global', false);
  }

  /**
   * Gets the command logs for the server.
   * @returns {Promise<APIResponse<CommandLog[]>>} The command logs response.
   */
  async getCommandLogs(): Promise<APIResponse<CommandLog[]>> {
    return this.makeRequest<CommandLog[]>('GET', '/server/commandlogs', undefined, 'global', false);
  }

  /**
   * Gets the mod calls for the server.
   * @returns {Promise<APIResponse<ModCall[]>>} The mod calls response.
   */
  async getModCalls(): Promise<APIResponse<ModCall[]>> {
    return this.makeRequest<ModCall[]>('GET', '/server/modcalls', undefined, 'global', false);
  }

  /**
   * Executes a command on the server.
   * @param {string} command - The command to execute.
   * @returns {Promise<APIResponse<null>>} The response from the command execution.
   */
  async executeCommand(command: string): Promise<APIResponse<null>> {
    const bucket = this.serverKey ? `command-${this.serverKey}` : 'command-global';
    return this.makeRequest<null>('POST', '/server/command', { command }, bucket);
  }

  /**
   * Clears the internal cache.
   */
  clearCache(): void {
    this.cache?.clear();
  }

  /**
   * Gets the current cache size.
   * @returns {number} The number of cached items.
   */
  getCacheSize(): number {
    return this.cache?.size() || 0;
  }

  /**
   * Gets the current rate limit info for a bucket.
   * @param {string} [bucket='global'] - The rate limit bucket.
   * @returns {RateLimitInfo | undefined} The rate limit info.
   */
  // getRateLimitInfo is now a no-op
  getRateLimitInfo(_bucket = 'global') {
    return undefined;
  }
}