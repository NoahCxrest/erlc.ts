import { Player, JoinLog, KillLog, CommandLog, ModCall } from './types.js';
import { PRCClient } from './client.js';


/**
 * Helper utilities for interacting with the PRCClient and managing player/server data.
 * Provides methods for player management, messaging, server stats, and log retrieval.
 */
export class PRCHelpers {
    /**
     * @param {PRCClient} client - The PRCClient instance to use for API calls.
     */
    constructor(private client: PRCClient) { }

    /**
     * Find a player by name or ID (partial match, case-insensitive).
     * @param {string} nameOrId - The player's name or ID to search for.
     * @returns {Promise<Player|null>} The found player or null if not found.
     */
    async findPlayer(nameOrId: string): Promise<Player | null> {
        const { data: players } = await this.client.getPlayers();
        return players.find(p =>
            p.Player.toLowerCase().includes(nameOrId.toLowerCase()) ||
            p.Player.includes(nameOrId)
        ) || null;
    }

    /**
     * Get all players on a specific team.
     * @param {string} team - The team name to filter by.
     * @returns {Promise<Player[]>} Array of players on the team.
     */
    async getPlayersByTeam(team: string): Promise<Player[]> {
        const { data: players } = await this.client.getPlayers();
        return players.filter(p => p.Team.toLowerCase() === team.toLowerCase());
    }

    /**
     * Get all staff members (players with non-Normal permission).
     * @returns {Promise<Player[]>} Array of staff players.
     */
    async getStaff(): Promise<Player[]> {
        const { data: players } = await this.client.getPlayers();
        return players.filter(p => p.Permission !== 'Normal');
    }

    /**
     * Get the current number of online players.
     * @returns {Promise<number>} The number of online players.
     */
    async getOnlineCount(): Promise<number> {
        const { data: status } = await this.client.getServerStatus();
        return status.CurrentPlayers;
    }

    /**
     * Check if the server is full.
     * @returns {Promise<boolean>} True if server is full, else false.
     */
    async isServerFull(): Promise<boolean> {
        const { data: status } = await this.client.getServerStatus();
        return status.CurrentPlayers >= status.MaxPlayers;
    }

    /**
     * Send a global message to all players.
     * @param {string} message - The message to send.
     * @returns {Promise<void>}
     */
    async sendMessage(message: string): Promise<void> {
        await this.client.executeCommand(`:h ${message}`);
    }

    /**
     * Send a private message to a player.
     * @param {string} player - The player to message.
     * @param {string} message - The message content.
     * @returns {Promise<void>}
     */
    async sendPM(player: string, message: string): Promise<void> {
        await this.client.executeCommand(`:pm ${player} ${message}`);
    }

    /**
     * Kick a player from the server.
     * @param {string} player - The player to kick.
     * @param {string} [reason] - Optional reason for kicking.
     * @returns {Promise<void>}
     */
    async kickPlayer(player: string, reason?: string): Promise<void> {
        const cmd = reason ? `:kick ${player} ${reason}` : `:kick ${player}`;
        await this.client.executeCommand(cmd);
    }

    /**
     * Ban a player from the server.
     * @param {string} player - The player to ban.
     * @param {string} [reason] - Optional reason for banning.
     * @returns {Promise<void>}
     */
    async banPlayer(player: string, reason?: string): Promise<void> {
        const cmd = reason ? `:ban ${player} ${reason}` : `:ban ${player}`;
        await this.client.executeCommand(cmd);
    }

    /**
     * Teleport a player to another player or location.
     * @param {string} player - The player to teleport.
     * @param {string} target - The target player or location.
     * @returns {Promise<void>}
     */
    async teleportPlayer(player: string, target: string): Promise<void> {
        await this.client.executeCommand(`:tp ${player} ${target}`);
    }

    /**
     * Set a player's team.
     * @param {string} player - The player to set the team for.
     * @param {string} team - The team name.
     * @returns {Promise<void>}
     */
    async setTeam(player: string, team: string): Promise<void> {
        await this.client.executeCommand(`:team ${player} ${team}`);
    }

    /**
     * Get recent join logs within the last N minutes.
     * @param {number} [minutes=10] - Minutes to look back.
     * @returns {Promise<JoinLog[]>} Array of join logs.
     */
    async getRecentJoins(minutes: number = 10): Promise<JoinLog[]> {
        const { data: logs } = await this.client.getJoinLogs();
        const cutoff = Date.now() / 1000 - (minutes * 60);
        return logs.filter(log => log.Join && log.Timestamp > cutoff);
    }

    /**
     * Get recent leave logs within the last N minutes.
     * @param {number} [minutes=10] - Minutes to look back.
     * @returns {Promise<JoinLog[]>} Array of leave logs.
     */
    async getRecentLeaves(minutes: number = 10): Promise<JoinLog[]> {
        const { data: logs } = await this.client.getJoinLogs();
        const cutoff = Date.now() / 1000 - (minutes * 60);
        return logs.filter(log => !log.Join && log.Timestamp > cutoff);
    }

    /**
     * Get kill logs for a player within the last N hours.
     * @param {string} player - The player name or ID.
     * @param {number} [hours=1] - Hours to look back.
     * @returns {Promise<KillLog[]>} Array of kill logs.
     */
    async getPlayerKills(player: string, hours: number = 1): Promise<KillLog[]> {
        const { data: logs } = await this.client.getKillLogs();
        const cutoff = Date.now() / 1000 - (hours * 3600);
        return logs.filter(log =>
            log.Killer.toLowerCase().includes(player.toLowerCase()) &&
            log.Timestamp > cutoff
        );
    }

    /**
     * Get death logs for a player within the last N hours.
     * @param {string} player - The player name or ID.
     * @param {number} [hours=1] - Hours to look back.
     * @returns {Promise<KillLog[]>} Array of death logs.
     */
    async getPlayerDeaths(player: string, hours = 1): Promise<KillLog[]> {
        const { data: logs } = await this.client.getKillLogs();
        const cutoff = Date.now() / 1000 - (hours * 3600);
        return logs.filter(log =>
            log.Killed.toLowerCase().includes(player.toLowerCase()) &&
            log.Timestamp > cutoff
        );
    }

    /**
     * Get command logs for a player within the last N hours.
     * @param {string} player - The player name or ID.
     * @param {number} [hours=1] - Hours to look back.
     * @returns {Promise<CommandLog[]>} Array of command logs.
     */
    async getPlayerCommands(player: string, hours: number = 1): Promise<CommandLog[]> {
        const { data: logs } = await this.client.getCommandLogs();
        const cutoff = Date.now() / 1000 - (hours * 3600);
        return logs.filter(log =>
            log.Player.toLowerCase().includes(player.toLowerCase()) &&
            log.Timestamp > cutoff
        );
    }

    /**
     * Get unanswered mod calls within the last N hours.
     * @param {number} [hours=1] - Hours to look back.
     * @returns {Promise<ModCall[]>} Array of unanswered mod calls.
     */
    async getUnansweredModCalls(hours: number = 1): Promise<ModCall[]> {
        const { data: logs } = await this.client.getModCalls();
        const cutoff = Date.now() / 1000 - (hours * 3600);
        return logs.filter(log => !log.Moderator && log.Timestamp > cutoff);
    }

    /**
     * Wait for a player to appear online, polling until timeout.
     * @param {string} nameOrId - The player name or ID to wait for.
     * @param {number} [timeoutMs=30000] - Timeout in milliseconds.
     * @returns {Promise<Player>} The found player.
     * @throws {Error} If player is not found within timeout.
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
     * Wait for the server to reach a certain player count, polling until timeout.
     * @param {number} count - The player count to wait for.
     * @param {number} [timeoutMs=60000] - Timeout in milliseconds.
     * @returns {Promise<void>}
     * @throws {Error} If count is not reached within timeout.
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
     * Format a player's name with callsign if present.
     * @param {Player} player - The player object.
     * @returns {string} The formatted player name.
     */
    formatPlayerName(player: Player): string {
        const name = player.Player.split(':')[0];
        const callsign = player.Callsign ? `[${player.Callsign}]` : '';
        return `${callsign}${name}`.trim();
    }

    /**
     * Format a UNIX timestamp as a locale string.
     * @param {number} timestamp - The UNIX timestamp (seconds).
     * @returns {string} The formatted date/time string.
     */
    formatTimestamp(timestamp: number): string {
        return new Date(timestamp * 1000).toLocaleString();
    }

    /**
     * Format uptime from a start timestamp to now as hours and minutes.
     * @param {number} startTimestamp - The server start timestamp (seconds).
     * @returns {string} The formatted uptime string.
     */
    formatUptime(startTimestamp: number): string {
        const uptimeMs = Date.now() - (startTimestamp * 1000);
        const hours = Math.floor(uptimeMs / (1000 * 60 * 60));
        const minutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    }

    async kickAllFromTeam(team: string, reason?: string): Promise<string[]> {
        const players = await this.getPlayersByTeam(team);
        const userIds = players
            .map(player => player.Player.split(':')[0])
            .filter(Boolean);

        if (userIds.length > 0) {
            const cmd = reason
                ? `:kick ${userIds.join(',')} ${reason}`
                : `:kick ${userIds.join(',')}`;
            await this.client.executeCommand(cmd);
        }

        return players.map(player => player.Player);
    }

    async messageAllStaff(message: string): Promise<void> {
        const staff = await this.getStaff();
        const userIds = staff
            .map(member => member.Player.split(':')[0])
            .filter(Boolean);

        if (userIds.length > 0) {
            await this.client.executeCommand(`:pm ${userIds.join(',')} ${message}`);
        }
    }

    async getServerStats(hours = 24) {
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
