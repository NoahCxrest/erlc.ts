import { PRCClient } from './client.js';
import { CommandLog, JoinLog, KillLog, ModCall, Player } from './types.js';

/**
 * Helper utilities for interacting with the PRCClient and managing player/server data.
 * Provides methods for player management, messaging, server stats, and log retrieval.
 * All methods handle API errors by propagating them to the caller.
 */
export class PRCHelpers {
    /**
     * Creates an instance of PRCHelpers.
     * @param client - The PRCClient instance to use for API calls.
     */
    constructor(private client: PRCClient) { }

    /**
     * Finds a player by name or ID using partial match (case-insensitive).
     * Searches both the player name and the full Player string.
     * @param nameOrId - The player's name or ID to search for.
     * @returns The found player or null if not found.
     */
    async findPlayer(nameOrId: string): Promise<Player | null> {
        const { data: players } = await this.client.getPlayers();
        const lowerQuery = nameOrId.toLowerCase();
        return players.find(p =>
            p.Player.toLowerCase().includes(lowerQuery)
        ) || null;
    }

    /**
     * Retrieves all players on a specific team.
     * @param team - The team name to filter by (case-insensitive).
     * @returns Array of players on the specified team.
     */
    async getPlayersByTeam(team: string): Promise<Player[]> {
        const { data: players } = await this.client.getPlayers();
        const lowerTeam = team.toLowerCase();
        return players.filter(p => p.Team.toLowerCase() === lowerTeam);
    }

    /**
     * Retrieves all staff members (players with non-Normal permission).
     * @returns Array of staff players.
     */
    async getStaff(): Promise<Player[]> {
        const { data: players } = await this.client.getPlayers();
        return players.filter(p => p.Permission !== 'Normal');
    }

    /**
     * Retrieves the current number of online players.
     * @returns The number of online players.
     */
    async getOnlineCount(): Promise<number> {
        const { data: status } = await this.client.getServerStatus();
        return status.CurrentPlayers;
    }

    /**
     * Checks if the server is at maximum capacity.
     * @returns True if the server is full, false otherwise.
     */
    async isServerFull(): Promise<boolean> {
        const { data: status } = await this.client.getServerStatus();
        return status.CurrentPlayers >= status.MaxPlayers;
    }

    /**
     * Sends a global message to all players on the server.
     * @param message - The message to broadcast.
     */
    async sendMessage(message: string): Promise<void> {
        await this.client.executeCommand(`:h ${message}`);
    }

    /**
     * Sends a private message to a specific player.
     * @param player - The name of the player to message.
     * @param message - The content of the private message.
     */
    async sendPM(player: string, message: string): Promise<void> {
        await this.client.executeCommand(`:pm ${player} ${message}`);
    }

    /**
     * Kicks a player from the server.
     * @param player - The name of the player to kick.
     * @param reason - Optional reason for the kick.
     */
    async kickPlayer(player: string, reason?: string): Promise<void> {
        const cmd = reason ? `:kick ${player} ${reason}` : `:kick ${player}`;
        await this.client.executeCommand(cmd);
    }

    /**
     * Bans a player from the server.
     * @param player - The name of the player to ban.
     * @param reason - Optional reason for the ban.
     */
    async banPlayer(player: string, reason?: string): Promise<void> {
        const cmd = reason ? `:ban ${player} ${reason}` : `:ban ${player}`;
        await this.client.executeCommand(cmd);
    }

    /**
     * Teleports a player to another player or location.
     * @param player - The name of the player to teleport.
     * @param target - The target player name or location coordinates.
     */
    async teleportPlayer(player: string, target: string): Promise<void> {
        await this.client.executeCommand(`:tp ${player} ${target}`);
    }

    /**
     * Sets a player's team.
     * @param player - The name of the player to change teams.
     * @param team - The name of the team to assign.
     */
    async setTeam(player: string, team: string): Promise<void> {
        await this.client.executeCommand(`:team ${player} ${team}`);
    }

    /**
     * Retrieves recent join logs within the specified time frame.
     * @param minutes - Number of minutes to look back (default: 10).
     * @returns Array of join log entries.
     */
    async getRecentJoins(minutes: number = 10): Promise<JoinLog[]> {
        const { data: logs } = await this.client.getJoinLogs();
        const cutoff = Date.now() / 1000 - (minutes * 60);
        return logs.filter(log => log.Join && log.Timestamp > cutoff);
    }

    /**
     * Retrieves recent leave logs within the specified time frame.
     * @param minutes - Number of minutes to look back (default: 10).
     * @returns Array of leave log entries.
     */
    async getRecentLeaves(minutes: number = 10): Promise<JoinLog[]> {
        const { data: logs } = await this.client.getJoinLogs();
        const cutoff = Date.now() / 1000 - (minutes * 60);
        return logs.filter(log => !log.Join && log.Timestamp > cutoff);
    }

    /**
     * Retrieves kill logs for a specific player within the specified time frame.
     * @param player - The name or ID of the player (partial match, case-insensitive).
     * @param hours - Number of hours to look back (default: 1).
     * @returns Array of kill log entries where the player was the killer.
     */
    async getPlayerKills(player: string, hours: number = 1): Promise<KillLog[]> {
        const { data: logs } = await this.client.getKillLogs();
        const cutoff = Date.now() / 1000 - (hours * 3600);
        const lowerPlayer = player.toLowerCase();
        return logs.filter(log =>
            log.Killer.toLowerCase().includes(lowerPlayer) &&
            log.Timestamp > cutoff
        );
    }

    /**
     * Retrieves death logs for a specific player within the specified time frame.
     * @param player - The name or ID of the player (partial match, case-insensitive).
     * @param hours - Number of hours to look back (default: 1).
     * @returns Array of kill log entries where the player was killed.
     */
    async getPlayerDeaths(player: string, hours: number = 1): Promise<KillLog[]> {
        const { data: logs } = await this.client.getKillLogs();
        const cutoff = Date.now() / 1000 - (hours * 3600);
        const lowerPlayer = player.toLowerCase();
        return logs.filter(log =>
            log.Killed.toLowerCase().includes(lowerPlayer) &&
            log.Timestamp > cutoff
        );
    }

    /**
     * Retrieves command logs for a specific player within the specified time frame.
     * @param player - The name or ID of the player (partial match, case-insensitive).
     * @param hours - Number of hours to look back (default: 1).
     * @returns Array of command log entries for the player.
     */
    async getPlayerCommands(player: string, hours: number = 1): Promise<CommandLog[]> {
        const { data: logs } = await this.client.getCommandLogs();
        const cutoff = Date.now() / 1000 - (hours * 3600);
        const lowerPlayer = player.toLowerCase();
        return logs.filter(log =>
            log.Player.toLowerCase().includes(lowerPlayer) &&
            log.Timestamp > cutoff
        );
    }

    /**
     * Retrieves unanswered mod calls within the specified time frame.
     * @param hours - Number of hours to look back (default: 1).
     * @returns Array of unanswered mod call entries.
     */
    async getUnansweredModCalls(hours: number = 1): Promise<ModCall[]> {
        const { data: logs } = await this.client.getModCalls();
        const cutoff = Date.now() / 1000 - (hours * 3600);
        return logs.filter(log => !log.Moderator && log.Timestamp > cutoff);
    }

    /**
     * Waits for a player to appear online, polling at intervals until timeout.
     * @param nameOrId - The player's name or ID to wait for (partial match, case-insensitive).
     * @param timeoutMs - Timeout in milliseconds (default: 30000).
     * @returns The found player.
     * @throws Error if the player is not found within the timeout.
     */
    async waitForPlayer(nameOrId: string, timeoutMs: number = 30000): Promise<Player> {
        const startTime = Date.now();

        while (Date.now() - startTime < timeoutMs) {
            const player = await this.findPlayer(nameOrId);
            if (player) return player;

            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        throw new Error(`Player ${nameOrId} not found within timeout`);
    }

    /**
     * Waits for the server to reach a specific player count, polling at intervals until timeout.
     * @param count - The target player count to wait for.
     * @param timeoutMs - Timeout in milliseconds (default: 60000).
     * @throws Error if the count is not reached within the timeout.
     */
    async waitForPlayerCount(count: number, timeoutMs: number = 60000): Promise<void> {
        const startTime = Date.now();

        while (Date.now() - startTime < timeoutMs) {
            const currentCount = await this.getOnlineCount();
            if (currentCount >= count) return;

            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        throw new Error(`Server did not reach ${count} players within timeout`);
    }

    /**
     * Parses a player string in the format "PlayerName:ID" into an object.
     * @param player - The player string to parse.
     * @returns An object containing the player's Name and ID.
     * @throws Error if the player string is not in the expected format.
     */
    formatPlayer(player: string): { Name: string; ID: string } {
        const split = player.split(':');
        if (split.length !== 2) {
            throw new Error(`Invalid player format: ${player}. Expected "Name:ID"`);
        }
        return { Name: split[0]!, ID: split[1]! };
    }

    /**
     * Formats a UNIX timestamp into a localized date/time string.
     * @param timestamp - The UNIX timestamp in seconds.
     * @returns The formatted date/time string.
     */
    formatTimestamp(timestamp: number): string {
        return new Date(timestamp * 1000).toLocaleString();
    }

    /**
     * Formats the uptime from a start timestamp to the current time as hours and minutes.
     * @param startTimestamp - The server start timestamp in seconds.
     * @returns The formatted uptime string (e.g., "2h 30m").
     */
    formatUptime(startTimestamp: number): string {
        const uptimeMs = Date.now() - (startTimestamp * 1000);
        const hours = Math.floor(uptimeMs / (1000 * 60 * 60));
        const minutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    }

    /**
     * Kicks all players from a specific team.
     * @param team - The team name to kick players from (case-insensitive).
     * @param reason - Optional reason for kicking.
     * @returns Array of player names that were kicked.
     */
    async kickAllFromTeam(team: string, reason?: string): Promise<string[]> {
        const players = await this.getPlayersByTeam(team);
        if (players.length === 0) return [];

        const userNames = players
            .map(player => this.formatPlayer(player.Player).Name)
            .filter(Boolean);

        if (userNames.length > 0) {
            const cmd = reason
                ? `:kick ${userNames.join(',')} ${reason}`
                : `:kick ${userNames.join(',')}`;
            await this.client.executeCommand(cmd);
        }

        return players.map(player => player.Player);
    }

    /**
     * Sends a private message to all staff members.
     * @param message - The message to send to staff.
     */
    async messageAllStaff(message: string): Promise<void> {
        const staff = await this.getStaff();
        if (staff.length === 0) return;

        const userNames = staff
            .map(member => this.formatPlayer(member.Player).Name)
            .filter(Boolean);

        if (userNames.length > 0) {
            await this.client.executeCommand(`:pm ${userNames.join(',')} ${message}`);
        }
    }

    /**
     * Retrieves comprehensive server statistics for the specified time period.
     * @param hours - Number of hours to look back for recent stats (default: 24).
     * @returns An object containing current server info and recent activity stats.
     */
    async getServerStats(hours: number = 24): Promise<{
        current: {
            players: number;
            maxPlayers: number;
            name: string;
            owner: number;
        };
        recent: {
            joins: number;
            kills: number;
            commands: number;
            modCalls: number;
            uniquePlayers: number;
        };
    }> {
        const cutoff = Date.now() / 1000 - (hours * 3600);

        const [
            { data: status },
            { data: joinLogs },
            { data: killLogs },
            { data: commandLogs },
            { data: modCalls }
        ] = await Promise.all([
            this.client.getServerStatus(),
            this.client.getJoinLogs(),
            this.client.getKillLogs(),
            this.client.getCommandLogs(),
            this.client.getModCalls()
        ]);

        const recentJoins = joinLogs.filter(log => log.Join && log.Timestamp > cutoff);
        const recentKills = killLogs.filter(log => log.Timestamp > cutoff);
        const recentCommands = commandLogs.filter(log => log.Timestamp > cutoff);
        const recentModCalls = modCalls.filter(log => log.Timestamp > cutoff);

        return {
            current: {
                players: status.CurrentPlayers,
                maxPlayers: status.MaxPlayers,
                name: status.Name,
                owner: status.OwnerId
            },
            recent: {
                joins: recentJoins.length,
                kills: recentKills.length,
                commands: recentCommands.length,
                modCalls: recentModCalls.length,
                uniquePlayers: new Set(recentJoins.map(log => log.Player)).size
            }
        };
    }
}
