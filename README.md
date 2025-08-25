# PRC API Client

A minimal, type-safe TypeScript client for the Police Roleplay Community (PRC) API.
No packages, no bullshit. 

## Install

```bash
npm install erlc.ts
```

## Usage
## Example: Type Safety & Advanced Usage

```typescript
import { PRCClient, PRCHelpers, Player } from 'erlc.ts';

const client = new PRCClient({ serverKey: 'your-server-key' });
const helpers = new PRCHelpers(client);

// Get all police team players and send them a message
async function messagePoliceTeam() {
	// Type-safe: players is Player[]
	const policePlayers: Player[] = await helpers.getPlayersByTeam('Police');
	for (const player of policePlayers) {
		// Type-safe: player.Player is string
		await helpers.sendPM(player.Player, 'get your ass to HQ');
	}
}

// Get server stats and print them
async function printServerStats() {
	const stats = await helpers.getServerStats(12); // last 12 hours
	console.log(`Current: ${stats.current.players}/${stats.current.maxPlayers} - ${stats.current.name}`);
	console.log(`Joins: ${stats.recent.joins}, Kills: ${stats.recent.kills}, Unique Players: ${stats.recent.uniquePlayers}`);
}

// Full type safety for all API responses
async function showTypeSafety() {
	const { data: status } = await client.getServerStatus();
	// status is fully typed as ServerStatus
	console.log('Server name:', status.Name);
}

// Run all examples
async function main() {
	await messagePoliceTeam();
	await printServerStats();
	await showTypeSafety();
}

main();
```


```typescript
import { PRCClient, PRCHelpers } from 'erlc.ts';

const client = new PRCClient({ serverKey: 'your-server-key' });
const helpers = new PRCHelpers(client);

const { data: status } = await client.getServerStatus();
console.log(status);

await client.executeCommand(':h Check out Melonly!');
```

## API Reference

### PRCClient Methods

All methods return fully typed promises. See `src/types.ts` for all type definitions.

| Method | Description | Returns |
|--------|-------------|---------|
| `getServerStatus()` | Get current server status | `Promise<APIResponse<ServerStatus>>` |
| `getPlayers()` | Get all players | `Promise<APIResponse<Player[]>>` |
| `getQueue()` | Get server queue | `Promise<APIResponse<number[]>>` |
| `getVehicles()` | Get all vehicles | `Promise<APIResponse<Vehicle[]>>` |
| `getBans()` | Get all bans | `Promise<APIResponse<ServerBans>>` |
| `getStaff()` | Get staff info | `Promise<APIResponse<ServerStaff>>` |
| `getJoinLogs()` | Get join/leave logs | `Promise<APIResponse<JoinLog[]>>` |
| `getKillLogs()` | Get kill logs | `Promise<APIResponse<KillLog[]>>` |
| `getCommandLogs()` | Get command logs | `Promise<APIResponse<CommandLog[]>>` |
| `getModCalls()` | Get mod calls | `Promise<APIResponse<ModCall[]>>` |
| `executeCommand(command: string)` | Run a server command | `Promise<APIResponse<null>>` |
| `clearCache()` | Clear internal cache | `void` |
| `getCacheSize()` | Get cache size | `number` |
| `getRateLimitInfo(bucket?: string)` | Get rate limit info (no-op) | `undefined` |

#### Example: Get all players

```typescript
const { data: players } = await client.getPlayers();
players.forEach(player => console.log(player.Player, player.Team));
```

### PRCHelpers Methods

Helper methods for common tasks. All return fully typed promises unless otherwise noted.

| Method | Description | Returns |
|--------|-------------|---------|
| `findPlayer(nameOrId: string)` | Find player by name or ID | `Promise<Player` | null>` |
| `getPlayersByTeam(team: string)` | Get all players on a team | `Promise<Player[]>` |
| `getStaff()` | Get all staff players | `Promise<Player[]>` |
| `getOnlineCount()` | Get online player count | `Promise<number>` |
| `isServerFull()` | Is server full? | `Promise<boolean>` |
| `sendMessage(message: string)` | Send global message | `Promise<void>` |
| `sendPM(player: string, message: string)` | Send private message | `Promise<void>` |
| `kickPlayer(player: string, reason?: string)` | Kick a player | `Promise<void>` |
| `banPlayer(player: string, reason?: string)` | Ban a player | `Promise<void>` |
| `teleportPlayer(player: string, target: string)` | Teleport player | `Promise<void>` |
| `setTeam(player: string, team: string)` | Set player's team | `Promise<void>` |
| `getRecentJoins(minutes?: number)` | Recent joins | `Promise<JoinLog[]>` |
| `getRecentLeaves(minutes?: number)` | Recent leaves | `Promise<JoinLog[]>` |
| `getPlayerKills(player: string, hours?: number)` | Player's kills | `Promise<KillLog[]>` |
| `getPlayerDeaths(player: string, hours?: number)` | Player's deaths | `Promise<KillLog[]>` |
| `getPlayerCommands(player: string, hours?: number)` | Player's commands | `Promise<CommandLog[]>` |
| `getUnansweredModCalls(hours?: number)` | Unanswered mod calls | `Promise<ModCall[]>` |
| `waitForPlayer(nameOrId: string, timeoutMs?: number)` | Wait for player to join | `Promise<Player>` |
| `waitForPlayerCount(count: number, timeoutMs?: number)` | Wait for player count | `Promise<void>` |
| `formatPlayerName(player: Player)` | Format player name | `string` |
| `formatTimestamp(timestamp: number)` | Format timestamp | `string` |
| `formatUptime(startTimestamp: number)` | Format uptime | `string` |
| `kickAllFromTeam(team: string, reason?: string)` | Kick all from team | `Promise<string[]>` |
| `messageAllStaff(message: string)` | Message all staff | `Promise<void>` |
| `getServerStats(hours?: number)` | Get server stats summary | `Promise<{ current, recent }>` |

#### Example: Find and message a player

```typescript
const player = await helpers.findPlayer('Melonly');
if (player) {
	await helpers.sendPM(player.Player, 'You have a call!');
}
```

## Features

- TypeScript support
- Built-in caching
- Automatic Rate limit handling
- 100% API coverage
- 100% Typed out. Type Safety for everyone!
- Extremely low memory usage
- Simple API

## License

MIT