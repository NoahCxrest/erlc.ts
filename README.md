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

- `getServerStatus()`
- `getPlayers()`
- `getQueue()`
- `getVehicles()`
- `getBans()`
- `getStaff()`
- `getJoinLogs()`
- `getKillLogs()`
- `getCommandLogs()`
- `getModCalls()`
- `executeCommand(command: string)`
- `clearCache()`
- `getCacheSize()`
- `getRateLimitInfo(bucket?: string)`

### PRCHelpers Methods

- `findPlayer(nameOrId: string)`
- `getPlayersByTeam(team: string)`
- `getStaff()`
- `getOnlineCount()`
- `isServerFull()`
- `sendMessage(message: string)`
- `sendPM(player: string, message: string)`
- `kickPlayer(player: string, reason?: string)`
- `banPlayer(player: string, reason?: string)`
- `teleportPlayer(player: string, target: string)`
- `setTeam(player: string, team: string)`
- `getRecentJoins(minutes?: number)`
- `getRecentLeaves(minutes?: number)`
- `getPlayerKills(player: string, hours?: number)`
- `getPlayerDeaths(player: string, hours?: number)`
- `getPlayerCommands(player: string, hours?: number)`
- `getUnansweredModCalls(hours?: number)`
- `waitForPlayer(nameOrId: string, timeoutMs?: number)`
- `waitForPlayerCount(count: number, timeoutMs?: number)`
- `formatPlayerName(player: Player)`
- `formatTimestamp(timestamp: number)`
- `formatUptime(startTimestamp: number)`
- `kickAllFromTeam(team: string, reason?: string)`
- `messageAllStaff(message: string)`
- `getServerStats(hours?: number)`

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