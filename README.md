# erlc.ts — PRC API Client [![CodeFactor](https://www.codefactor.io/repository/github/noahcxrest/erlc.ts/badge)](https://www.codefactor.io/repository/github/noahcxrest/erlc.ts)

> A minimal, type-safe TypeScript client for the Police Roleplay Community (PRC) API.
> No dependencies. No bullshit.

---

## Installation

```bash
npm install erlc.ts
```

---

## Quick Start

```ts
import { PRCClient } from 'erlc.ts';

const client = new PRCClient({ serverKey: 'your-server-key' });

const { data: status } = await client.getServerStatus();
console.log(status);

await client.executeCommand(':h Check out Melonly!');
```

---

## Table of Contents

* [Features](#features)
* [Usage](#usage)

  * [Basic Example](#basic-example)
  * [Error Handling](#error-handling)
  * [Cache Control](#cache-control)
  * [Rate Limit Handling](#rate-limit-handling)
  * [Advanced Usage & Type Safety](#advanced-usage--type-safety)
* [API Reference](#api-reference)

  * [PRCClient](#prcclient-methods)
  * [PRCHelpers](#prchelpers-methods)
* [License](#license)

---

## Features

* 100% TypeScript support
* Built-in caching (in-memory or Redis)
* Automatic rate limit handling
* Fully typed API responses
* 100% API coverage
* Extremely low memory footprint
* Minimal, predictable API

---

## Usage

### Basic Example

```ts
import { PRCClient } from 'erlc.ts';

const client = new PRCClient({ serverKey: 'your-server-key' });

const { data: players } = await client.getPlayers();
players.forEach(p => console.log(p.Player, p.Team));
```

---

### Error Handling

All API calls may throw a `PRCAPIError`. You can inspect the error type for more detail:

```ts
import { PRCClient, PRCAPIError } from 'erlc.ts';

try {
  const { data } = await client.getPlayers();
} catch (err) {
  if (err instanceof PRCAPIError) {
    if (err.isRateLimit) console.error('Rate limited!');
    else if (err.isAuthError) console.error('Bad server key!');
    else console.error('API error:', err.message);
  }
}
```

---

### Cache Control

The client caches GET requests by default. Supports both in-memory and Redis caching.

* Default: **30s**
* Disable: `cache: false`
* Custom: `cacheMaxAge` (ms)
* Redis: `redisUrl` (e.g., `redis://localhost:6379`)
* Clear manually: `client.clearCache()`
* Inspect: `client.getCacheSize()`

```ts
// In-memory caching
const client = new PRCClient({
  serverKey: 'your-server-key',
  cacheMaxAge: 120_000, // 2 mins
});

// Redis caching
const redisClient = new PRCClient({
  serverKey: 'your-server-key',
  redisUrl: 'redis://localhost:6379',
  cacheMaxAge: 300_000, // 5 mins
});

client.clearCache();
console.log('Cache size:', client.getCacheSize());
```

---

### Rate Limit Handling

Handled automatically:

* Detects `retry_after` from the API
* Retries up to **3 times**
* Throws `PRCAPIError` with `isRateLimit = true` if still exceeded

```ts
try {
  await client.getPlayers();
} catch (err) {
  if (err instanceof PRCAPIError && err.isRateLimit) {
    console.error('Slow down!');
  }
}
```

---

### Advanced Usage & Type Safety

```ts
import { PRCHelpers, Player } from 'erlc.ts';

const helpers = new PRCHelpers(client);

const cops: Player[] = await helpers.getPlayersByTeam('Police');
for (const cop of cops) {
  await helpers.sendPM(cop.Player, 'get ur ass to hq rookie');
}

const stats = await helpers.getServerStats(12);
console.log(`Current players: ${stats.current.players}/${stats.current.maxPlayers}`);
```

---

## API Reference

### PRCClient Methods

| Method                | Description               | Returns                              |
| --------------------- | ------------------------- | ------------------------------------ |
| `getServerStatus()`   | Get current server status | `Promise<APIResponse<ServerStatus>>` |
| `getPlayers()`        | Get all players           | `Promise<APIResponse<Player[]>>`     |
| `getQueue()`          | Get server queue          | `Promise<APIResponse<number[]>>`     |
| `getVehicles()`       | Get all vehicles          | `Promise<APIResponse<Vehicle[]>>`    |
| `getBans()`           | Get all bans              | `Promise<APIResponse<ServerBans>>`   |
| `getStaff()`          | Get staff info            | `Promise<APIResponse<ServerStaff>>`  |
| `getJoinLogs()`       | Get join/leave logs       | `Promise<APIResponse<JoinLog[]>>`    |
| `getKillLogs()`       | Get kill logs             | `Promise<APIResponse<KillLog[]>>`    |
| `getCommandLogs()`    | Get command logs          | `Promise<APIResponse<CommandLog[]>>` |
| `getModCalls()`       | Get mod calls             | `Promise<APIResponse<ModCall[]>>`    |
| `executeCommand(cmd)` | Run a server command      | `Promise<APIResponse<null>>`         |
| `clearCache()`        | Clear cache               | `void`                               |
| `getCacheSize()`      | Cache size                | `number`                             |

---

### PRCHelpers Methods

| Method                                             | Description               |
| -------------------------------------------------- | ------------------------- |
| `findPlayer(nameOrId)` → `Player \| null`          | Find player by name or ID |
| `getPlayersByTeam(team)` → `Player[]`              | Players on a team         |
| `getStaff()` → `Player[]`                          | All staff players         |
| `getOnlineCount()` → `number`                      | Current online count      |
| `isServerFull()` → `boolean`                       | Is server full?           |
| `sendMessage(msg)` → `void`                        | Send global message       |
| `sendPM(player, msg)` → `void`                     | Send private message      |
| `kickPlayer(player, reason?)` → `void`             | Kick a player             |
| `banPlayer(player, reason?)` → `void`              | Ban a player              |
| `teleportPlayer(player, target)` → `void`          | Teleport player           |
| `setTeam(player, team)` → `void`                   | Set team                  |
| `getRecentJoins(mins?)` → `JoinLog[]`              | Recent joins              |
| `getRecentLeaves(mins?)` → `JoinLog[]`             | Recent leaves             |
| `getPlayerKills(player, hrs?)` → `KillLog[]`       | Player kills              |
| `getPlayerDeaths(player, hrs?)` → `KillLog[]`      | Player deaths             |
| `getPlayerCommands(player, hrs?)` → `CommandLog[]` | Player commands           |
| `getUnansweredModCalls(hrs?)` → `ModCall[]`        | Unanswered mod calls      |
| `waitForPlayer(nameOrId, timeout?)` → `Player`     | Wait for player           |
| `waitForPlayerCount(count, timeout?)` → `void`     | Wait for count            |
| `kickAllFromTeam(team, reason?)` → `string[]`      | Kick all team players     |
| `messageAllStaff(msg)` → `void`                    | Message all staff         |
| `getServerStats(hrs?)` → `{ current, recent }`     | Server stats summary      |

---

## License

MIT
