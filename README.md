# PRC API Client

A minimal, type-safe TypeScript client for the Police Roleplay Community (PRC) API.
No packages, no bullshit. 

## Install

```bash
npm install erlc.ts
```

## Usage


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