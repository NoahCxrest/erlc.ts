import { Cache } from './cache.js';
import { PRCAPIError } from './errors.js';
import { RateLimiter } from './ratelimit.js';
import {
  APIResponse,
  CommandLog,
  JoinLog,
  KillLog,
  MethodOptions,
  ModCall,
  Player,
  PRCClientOptions,
  ServerBans,
  ServerStaff,
  ServerStatus,
  Vehicle
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
  private readonly headers: Record<string, string>;

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
    this.cache = options.cache !== false ? new Cache(options.cacheMaxAge, options.redisUrl, options.redisKeyPrefix) : null;
    this.headers = this.buildHeaders();
  }

  /**
   * Builds the headers for API requests.
   * @returns {Record<string, string>} The headers object.
   */
  private buildHeaders(): Record<string, string> {
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
   * Retrieves cached data if available.
   * @template T
   * @param {string} cacheKey - The cache key.
   * @returns {Promise<T | null>} The cached data or null.
   */
  private async getCachedData<T>(cacheKey: string): Promise<T | null> {
    if (this.cache) {
      return await this.cache.get<T>(cacheKey);
    }
    return null;
  }

  /**
   * Sets data in the cache.
   * @template T
   * @param {string} cacheKey - The cache key.
   * @param {T} data - The data to cache.
   * @param {number} [maxAge] - Optional custom max age for this cache entry.
   */
  private async setCachedData<T>(cacheKey: string, data: T, maxAge?: number): Promise<void> {
    if (this.cache) {
      await this.cache.set(cacheKey, data, maxAge);
    }
  }

  /**
   * Builds the fetch options for the request.
   * @param {'GET' | 'POST'} method - HTTP method.
   * @param {any} [body] - Request body.
   * @returns {RequestInit} The fetch options.
   */
  private buildFetchOptions(method: 'GET' | 'POST', body?: any): RequestInit {
    const fetchOptions: RequestInit = {
      method,
      headers: this.headers,
    };
    if (method !== 'GET' && body) {
      fetchOptions.body = JSON.stringify(body);
    }
    return fetchOptions;
  }

  /**
   * Determines if the request should be retried based on the error.
   * @param {any} errorBody - The error response body.
   * @param {number} retryCount - Current retry count.
   * @param {number} maxRetries - Maximum retries.
   * @returns {Promise<boolean>} Whether to retry.
   */
  private async shouldRetry(errorBody: any, retryCount: number, maxRetries: number): Promise<boolean> {
    if (
      errorBody &&
      (errorBody.code === 4001 || errorBody.errorCode === 4001) &&
      retryCount < maxRetries
    ) {
      if (typeof errorBody.retry_after === 'number' && errorBody.retry_after > 0) {
        await RateLimiter.waitForRetryAfter(errorBody.retry_after);
      }
      return true;
    }
    return false;
  }

  /**
   * Parses the response data based on content type.
   * @template T
   * @param {Response} response - The fetch response.
   * @returns {Promise<T>} The parsed data.
   */
  private async parseResponseData<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return (await response.json()) as T;
    }
    return null as T;
  }

  /**
   * Handles error responses by throwing an appropriate error.
   * @param {Response} response - The fetch response.
   * @param {any} errorBody - The error response body.
   */
  private handleErrorResponse(response: Response, errorBody: any): void {
    throw PRCAPIError.fromResponse(response, errorBody);
  }

  /**
   * Makes an HTTP request to the API, handling caching, rate limiting, and retries.
   * @template T
   * @param {'GET' | 'POST'} method - HTTP method.
   * @param {string} endpoint - API endpoint.
   * @param {any} [body] - Request body for POST requests.
   * @param {boolean} [cacheable=false] - Whether to use cache for GET requests.
   * @param {number} [cacheMaxAge] - Optional custom cache max age for this request.
   * @param {boolean} [cacheOverride] - Optional per-method cache override.
   * @returns {Promise<APIResponse<T>>} The API response.
   * @throws {PRCAPIError} If the request fails.
   */
  private async makeRequest<T>(
    method: 'GET' | 'POST',
    endpoint: string,
    body?: any,
    cacheable: boolean = false,
    cacheMaxAge?: number,
    cacheOverride?: boolean
  ): Promise<APIResponse<T>> {

    const url = `${this.baseURL}${endpoint}`;
    const cacheKey = `${endpoint}`;
    const MAX_RETRIES = 3;

    // Determine if caching should be used for this request
    const shouldCache = method === 'GET' && (cacheOverride !== undefined ? cacheOverride : cacheable);

    if (shouldCache) {
      const cachedData = await this.getCachedData<T>(cacheKey);
      if (cachedData !== null) 
        return { data: cachedData };
    }

    let retryCount = 0;
    while (true) {
      const fetchOptions = this.buildFetchOptions(method, body);
      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        let errorBody: any = {};
        try {
          errorBody = await response.json();
        } catch { }
        if (await this.shouldRetry(errorBody, retryCount, MAX_RETRIES)) {
          retryCount++;
          continue;
        }
        this.handleErrorResponse(response, errorBody);
      }

      const data = await this.parseResponseData<T>(response);

      if (shouldCache) 
        await this.setCachedData(cacheKey, data, cacheMaxAge);

      return { data };
    }
  }

  /**
   * Gets the current server status.
   * @param {MethodOptions} [options] - Optional method options.
   * @returns {Promise<APIResponse<ServerStatus>>} The server status response.
   */
  async getServerStatus(options?: MethodOptions): Promise<APIResponse<ServerStatus>> {
    return this.makeRequest<ServerStatus>('GET', '/server', undefined, true, options?.cacheMaxAge, options?.cache);
  }

  /**
   * Gets the list of current players on the server.
   * @param {MethodOptions} [options] - Optional method options.
   * @returns {Promise<APIResponse<Player[]>>} The players response.
   */
  async getPlayers(options?: MethodOptions): Promise<APIResponse<Player[]>> {
    return this.makeRequest<Player[]>('GET', '/server/players', undefined, true, options?.cacheMaxAge, options?.cache);
  }

  /**
   * Gets the current server queue.
   * @param {MethodOptions} [options] - Optional method options.
   * @returns {Promise<APIResponse<number[]>>} The queue response.
   */
  async getQueue(options?: MethodOptions): Promise<APIResponse<number[]>> {
    return this.makeRequest<number[]>('GET', '/server/queue', undefined, true, options?.cacheMaxAge, options?.cache);
  }

  /**
   * Gets the list of vehicles on the server.
   * @param {MethodOptions} [options] - Optional method options.
   * @returns {Promise<APIResponse<Vehicle[]>>} The vehicles response.
   */
  async getVehicles(options?: MethodOptions): Promise<APIResponse<Vehicle[]>> {
    return this.makeRequest<Vehicle[]>('GET', '/server/vehicles', undefined, true, options?.cacheMaxAge, options?.cache);
  }

  /**
   * Gets the list of server bans.
   * @param {MethodOptions} [options] - Optional method options.
   * @returns {Promise<APIResponse<ServerBans>>} The bans response.
   */
  async getBans(options?: MethodOptions): Promise<APIResponse<ServerBans>> {
    return this.makeRequest<ServerBans>('GET', '/server/bans', undefined, true, options?.cacheMaxAge, options?.cache);
  }

  /**
   * Gets the list of server staff.
   * @param {MethodOptions} [options] - Optional method options.
   * @returns {Promise<APIResponse<ServerStaff>>} The staff response.
   */
  async getStaff(options?: MethodOptions): Promise<APIResponse<ServerStaff>> {
    return this.makeRequest<ServerStaff>('GET', '/server/staff', undefined, true, options?.cacheMaxAge, options?.cache);
  }

  /**
   * Gets the join logs for the server.
   * @param {MethodOptions} [options] - Optional method options.
   * @returns {Promise<APIResponse<JoinLog[]>>} The join logs response.
   */
  async getJoinLogs(options?: MethodOptions): Promise<APIResponse<JoinLog[]>> {
    const shouldCache = options?.cache === true && !!options?.cacheMaxAge;
    return this.makeRequest<JoinLog[]>('GET', '/server/joinlogs', undefined, shouldCache, options?.cacheMaxAge, options?.cache);
  }

  /**
   * Gets the kill logs for the server.
   * @param {MethodOptions} [options] - Optional method options.
   * @returns {Promise<APIResponse<KillLog[]>>} The kill logs response.
   */
  async getKillLogs(options?: MethodOptions): Promise<APIResponse<KillLog[]>> {
    const shouldCache = options?.cache === true && !!options?.cacheMaxAge;
    return this.makeRequest<KillLog[]>('GET', '/server/killlogs', undefined, shouldCache, options?.cacheMaxAge, options?.cache);
  }

  /**
   * Gets the command logs for the server.
   * @param {MethodOptions} [options] - Optional method options.
   * @returns {Promise<APIResponse<CommandLog[]>>} The command logs response.
   */
  async getCommandLogs(options?: MethodOptions): Promise<APIResponse<CommandLog[]>> {
    const shouldCache = options?.cache === true && !!options?.cacheMaxAge;
    return this.makeRequest<CommandLog[]>('GET', '/server/commandlogs', undefined, shouldCache, options?.cacheMaxAge, options?.cache);
  }

  /**
   * Gets the mod calls for the server.
   * @param {MethodOptions} [options] - Optional method options.
   * @returns {Promise<APIResponse<ModCall[]>>} The mod calls response.
   */
  async getModCalls(options?: MethodOptions): Promise<APIResponse<ModCall[]>> {
    const shouldCache = options?.cache === true && !!options?.cacheMaxAge;
    return this.makeRequest<ModCall[]>('GET', '/server/modcalls', undefined, shouldCache, options?.cacheMaxAge, options?.cache);
  }

  /**
   * Executes a command on the server.
   * @param {string} command - The command to execute.
   * @returns {Promise<APIResponse<null>>} The response from the command execution.
   */
  async executeCommand(command: string): Promise<APIResponse<null>> {
    return this.makeRequest<null>('POST', '/server/command', { command });
  }

  /**
   * Clears the internal cache.
   * @returns A promise that resolves when the cache is cleared.
   */
  async clearCache(): Promise<void> {
    if (this.cache) {
      await this.cache.clear();
    }
  }

  /**
   * Gets the current cache size.
   * @returns A promise that resolves to the number of cached items.
   */
  async getCacheSize(): Promise<number> {
    return this.cache ? await this.cache.size() : 0;
  }

  /**
   * Gets a cache entry directly for debugging purposes (only works with in-memory cache).
   * @param key - The cache key.
   * @returns The cached data or null if not found or using Redis.
   */
  getCacheEntry(key: string): any {
    if (!this.cache) return null;
    try {
      const entry = this.cache.getRawEntry(key);
      return entry ? entry.data : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Gets all cache keys for debugging purposes (only works with in-memory cache).
   * @returns Array of cache keys.
   * @throws Error if using Redis cache.
   */
  getCacheKeys(): string[] {
    if (!this.cache) return [];
    try {
      return this.cache.getAllKeys();
    } catch (error) {
      return [];
    }
  }

  /**
   * Disconnects the Redis client if using Redis cache.
   * @returns A promise that resolves when disconnected.
   */
  async disconnect(): Promise<void> {
    if (this.cache) {
      await this.cache.disconnect();
    }
  }
}