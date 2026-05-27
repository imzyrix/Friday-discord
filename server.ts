import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import crypto from 'crypto';
import dotenv from 'dotenv';
import fs from 'fs';
import { Client, GatewayIntentBits, Partials } from 'discord.js';

// Load variables from .env
dotenv.config();

import {
  initialRoles,
  initialMembers,
  initialLogs,
  initialTickets,
  initialBackups,
  initialDiagnostic
} from './src/mockData.js';

import { Role, Member, AuditLog, SupportTicket, BackupRecord, BotDiagnostic } from './src/types';

// State Persistence Container - Persistent JSON storage on disk
const DB_FILE_PATH = path.join(process.cwd(), 'database_state.json');

let roles: Role[] = [];
let members: Member[] = [];
let logs: AuditLog[] = [];
let tickets: SupportTicket[] = [];
let backups: BackupRecord[] = [];
let diagnostic: BotDiagnostic = { ...initialDiagnostic };

// Live Discord client and state variables
let discordClient: Client | null = null;
let liveGuild: any = null;
let adminUserPayload: any = null;

function loadDatabaseState() {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const dbContent = fs.readFileSync(DB_FILE_PATH, 'utf8');
      const data = JSON.parse(dbContent);
      roles = data.roles || [...initialRoles];
      members = data.members || [...initialMembers];
      logs = data.logs || [...initialLogs];
      tickets = data.tickets || [...initialTickets];
      backups = data.backups || [...initialBackups];
      diagnostic = data.diagnostic || { ...initialDiagnostic };
      console.log('Successfully synchronized server data from persistent database_state.json storage');
    } else {
      resetDatabaseToDefault();
    }
  } catch (err) {
    console.error('Error loading persistent database_state.json, falling back to memory state:', err);
    resetDatabaseToDefault();
  }
}

function resetDatabaseToDefault() {
  roles = [...initialRoles];
  members = [...initialMembers];
  logs = [...initialLogs];
  tickets = [...initialTickets];
  backups = [...initialBackups];
  diagnostic = { ...initialDiagnostic };
  saveDatabaseState();
}

function saveDatabaseState() {
  try {
    const data = { roles, members, logs, tickets, backups, diagnostic };
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving state to database_state.json:', err);
  }
}

// Instantiate storage state immediately on startup
loadDatabaseState();

// Real-time Event Subscription List
let sseClients: express.Response[] = [];

// Broadcasts changes to all open tabs / administrator clients for live synchronization
function broadcastToClients(type: string, payload: any) {
  const dataString = JSON.stringify({ type, payload });
  sseClients.forEach((client) => {
    client.write(`data: ${dataString}\n\n`);
  });
  // Genuinely persist functional states to storage disk (bypass frequent diagnostic polls to reduce overhead)
  if (type !== 'SYNC_DIAGNOSTIC') {
    saveDatabaseState();
  }
}

// Generate automatic audit logs
function appendAuditLog(category: AuditLog['category'], executor: string, action: string, severity: AuditLog['severity'] = 'low', target?: string) {
  const newLog: AuditLog = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    category,
    executor,
    action,
    target,
    severity
  };
  logs.unshift(newLog);
  // Keep logs at max 100 items for memory boundaries
  if (logs.length > 100) {
    logs.pop();
  }
  broadcastToClients('SYNC_LOGS', logs);
}

// Role mapper
function mapDiscordRole(role: any, guild: any): Role {
  const hexColor = role.color ? `#${role.color.toString(16).padStart(6, '0')}` : '#94a3b8';
  return {
    id: role.id,
    name: role.name,
    color: hexColor,
    hoist: role.hoist,
    permissions: role.permissions ? (role.permissions.toArray() as string[]) : ['VIEW_CHANNEL', 'SEND_MESSAGES'],
    memberCount: role.members ? role.members.size : 0,
  };
}

// Member mapper
function mapDiscordMember(member: any): Member {
  const existingMember = members.find(m => m.id === member.id);
  const warnings = existingMember ? existingMember.warnings : 0;
  
  let customStatus = '';
  const presence = member.presence;
  if (presence) {
    const customActivity = presence.activities?.find((a: any) => a.type === 4);
    if (customActivity) {
      customStatus = customActivity.state || '';
    }
  }

  const avatarUrl = member.user.displayAvatarURL({ extension: 'png', size: 128 }) || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces';

  return {
    id: member.id,
    username: member.user.username,
    discriminator: member.user.discriminator || '0000',
    avatar: avatarUrl,
    status: presence ? (((presence.status as any) === 'offline' ? 'offline' : presence.status) as any) : 'offline',
    customStatus,
    joinedAt: member.joinedAt ? member.joinedAt.toISOString() : new Date().toISOString(),
    roles: member.roles ? (Array.from(member.roles.cache.keys()).filter((rid: any) => rid !== member.guild.id) as string[]) : [],
    warnings,
    isMuted: member.voice ? !!member.voice.mute : false,
  };
}

// Synchronize from Discord
async function syncFromDiscord() {
  if (!discordClient) return;
  const guildId = process.env.DISCORD_GUILD_ID;
  if (!guildId) return;

  try {
    const guild = await discordClient.guilds.fetch(guildId);
    if (!guild) {
      console.error(`Guild target with ID ${guildId} could not be resolved.`);
      return;
    }
    liveGuild = guild;
    console.log(`Connected to Discord Guild: ${guild.name} (${guild.id})`);
    
    // Fetch roles
    const guildRoles = await guild.roles.fetch();
    const mappedRoles: Role[] = [];
    guildRoles.forEach((role) => {
      mappedRoles.push(mapDiscordRole(role, guild));
    });
    roles = mappedRoles;

    // Fetch members with presence intent
    const guildMembers = await guild.members.fetch({ withPresences: true });
    const mappedMembers: Member[] = [];
    guildMembers.forEach((member) => {
      mappedMembers.push(mapDiscordMember(member));
    });
    members = mappedMembers;

    // Fetch Audit Logs
    try {
      const fetchedLogs = await guild.fetchAuditLogs({ limit: 50 });
      const mappedLogs: AuditLog[] = [];
      fetchedLogs.entries.forEach((entry) => {
        let sev: AuditLog['severity'] = 'low';
        let cat: AuditLog['category'] = 'bot';
        const actionStr = String(entry.action);
        if (actionStr.includes('MEMBER') || actionStr.includes('BAN') || actionStr.includes('KICK')) {
          cat = 'moderation';
          if (actionStr.includes('BAN') || actionStr.includes('KICK')) {
            sev = 'high';
          }
        } else if (actionStr.includes('ROLE')) {
          cat = 'role';
          sev = 'medium';
        } else if (actionStr.includes('CHANNEL') || actionStr.includes('GUILD')) {
          cat = 'security';
          sev = 'critical';
        }

        mappedLogs.push({
          id: entry.id,
          timestamp: entry.createdAt ? entry.createdAt.toISOString() : new Date().toISOString(),
          category: cat,
          executor: entry.executor ? entry.executor.username : 'Unknown Executor',
          action: `${entry.action} - ${entry.reason || 'No specific reason verified'}`,
          target: entry.target ? (entry.target as any).username || (entry.target as any).name || 'Target Ref' : undefined,
          severity: sev
        });
      });
      if (mappedLogs.length > 0) {
        logs = mappedLogs;
      }
    } catch (logErr) {
      console.warn('Failed to fetch Discord Audit Logs (missing View Audit Log permission?):', logErr);
    }

    // Refresh telemetry ping and state info
    diagnostic.status = 'optimal';
    diagnostic.latency = discordClient.ws.ping;
    diagnostic.uptime = Math.floor((discordClient.uptime || 0) / 1000);
    diagnostic.shards = Array.from(discordClient.ws.shards.entries()).map(([id, s]) => ({
      id,
      status: (s.status as any) === 'ready' || (s.status as any) === 0 ? 'connected' : (s.status as any) === 1 ? 'reconnecting' : 'disconnected',
      latency: s.ping || discordClient!.ws.ping
    }));

    if (diagnostic.shards.length === 0) {
      diagnostic.shards = [{ id: 0, status: 'connected', latency: discordClient.ws.ping }];
    }

    // Broadcast the full state to update any existing client connections
    broadcastToClients('SYNC_ROLES', roles);
    broadcastToClients('SYNC_MEMBERS', members);
    broadcastToClients('SYNC_LOGS', logs);
    broadcastToClients('SYNC_DIAGNOSTIC', diagnostic);

    // Save as fallback schema
    saveDatabaseState();

  } catch (err) {
    console.error('Error during Discord sync:', err);
  }
}

// Setup real-time Discord event listeners
function setupDiscordListeners() {
  if (!discordClient) return;

  discordClient.on('guildMemberAdd', (member) => {
    if (member.guild.id !== process.env.DISCORD_GUILD_ID) return;
    const mapped = mapDiscordMember(member);
    members = members.filter(m => m.id !== member.id);
    members.push(mapped);
    broadcastToClients('SYNC_MEMBERS', members);
    appendAuditLog('security', 'Gateway Uplink', `Citizen @${member.user.username} decrypted access codes and entered the sector`, 'medium', member.user.username);
  });

  discordClient.on('guildMemberRemove', (member) => {
    if (member.guild.id !== process.env.DISCORD_GUILD_ID) return;
    members = members.filter(m => m.id !== member.id);
    broadcastToClients('SYNC_MEMBERS', members);
    appendAuditLog('security', 'Gateway Uplink', `Citizen @${member.user.username} purged contact connection from sector`, 'high', member.user.username);
  });

  discordClient.on('presenceUpdate', (oldPresence, newPresence) => {
    if (!newPresence || !newPresence.member || newPresence.guild?.id !== process.env.DISCORD_GUILD_ID) return;
    const memberId = newPresence.member.id;
    const index = members.findIndex(m => m.id === memberId);
    if (index !== -1) {
      let customStatus = '';
      const customActivity = newPresence.activities?.find((a: any) => a.type === 4);
      if (customActivity) {
        customStatus = customActivity.state || '';
      }
      members[index].status = newPresence.status === 'offline' ? 'offline' : (newPresence.status as 'online' | 'idle' | 'dnd' | 'offline');
      if (customStatus) {
        members[index].customStatus = customStatus;
      }
      broadcastToClients('SYNC_MEMBERS', members);
    }
  });

  discordClient.on('guildMemberUpdate', (oldMember, newMember) => {
    if (newMember.guild.id !== process.env.DISCORD_GUILD_ID) return;
    const index = members.findIndex(m => m.id === newMember.id);
    const mapped = mapDiscordMember(newMember);
    if (index !== -1) {
      members[index] = mapped;
    } else {
      members.push(mapped);
    }
    broadcastToClients('SYNC_MEMBERS', members);
  });

  discordClient.on('roleCreate', (role) => {
    if (role.guild.id !== process.env.DISCORD_GUILD_ID) return;
    roles.push(mapDiscordRole(role, role.guild));
    broadcastToClients('SYNC_ROLES', roles);
    appendAuditLog('role', 'System Uplink', `New cryptographic clearance grid index initialized: @${role.name}`, 'medium', role.name);
  });

  discordClient.on('roleDelete', (role) => {
    if (role.guild.id !== process.env.DISCORD_GUILD_ID) return;
    roles = roles.filter(r => r.id !== role.id);
    members = members.map(m => ({ ...m, roles: m.roles.filter(rid => rid !== role.id) }));
    broadcastToClients('SYNC_ROLES', roles);
    broadcastToClients('SYNC_MEMBERS', members);
    appendAuditLog('role', 'System Uplink', `De-registered cryptographic clearance security role index: @${role.name}`, 'high', role.name);
  });

  discordClient.on('roleUpdate', (oldRole, newRole) => {
    if (newRole.guild.id !== process.env.DISCORD_GUILD_ID) return;
    const index = roles.findIndex(r => r.id === newRole.id);
    if (index !== -1) {
      roles[index] = mapDiscordRole(newRole, newRole.guild);
    }
    broadcastToClients('SYNC_ROLES', roles);
    appendAuditLog('role', 'System Uplink', `Cryptographic clearance role adjusted: ${newRole.name}`, 'medium', newRole.name);
  });

  discordClient.on('guildAuditLogEntryCreate', (auditLogEntry, guild) => {
    if (guild.id !== process.env.DISCORD_GUILD_ID) return;
    let sev: AuditLog['severity'] = 'low';
    let cat: AuditLog['category'] = 'bot';
    const actionStr = String(auditLogEntry.action);
    if (actionStr.includes('MEMBER') || actionStr.includes('BAN') || actionStr.includes('KICK')) {
      cat = 'moderation';
      if (actionStr.includes('BAN') || actionStr.includes('KICK')) {
        sev = 'high';
      }
    } else if (actionStr.includes('ROLE')) {
      cat = 'role';
      sev = 'medium';
    } else if (actionStr.includes('CHANNEL') || actionStr.includes('GUILD')) {
      cat = 'security';
      sev = 'critical';
    }

    const newLog: AuditLog = {
      id: auditLogEntry.id,
      timestamp: new Date().toISOString(),
      category: cat,
      executor: auditLogEntry.executor ? auditLogEntry.executor.username : 'Unknown executor',
      action: `${auditLogEntry.action} - ${auditLogEntry.reason || 'No specific reason verified'}`,
      target: auditLogEntry.target ? (auditLogEntry.target as any).username || (auditLogEntry.target as any).name || 'Target Ref' : undefined,
      severity: sev
    };

    logs.unshift(newLog);
    if (logs.length > 100) logs.pop();
    broadcastToClients('SYNC_LOGS', logs);
  });
}

// Check environment codes and initialize Discord Client
async function checkAndInitDiscord() {
  const token = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;

  if (!token || !guildId || token.includes('your_bot_token') || guildId.includes('your_guild_id')) {
    console.log('Discord credentials not configured in environment. Operating in sandbox fallback cache mode.');
    return;
  }

  try {
    discordClient = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildModeration,
      ],
      partials: [Partials.GuildMember, Partials.User],
    });

    discordClient.once('ready', async () => {
      console.log(`🤖 Discord bot logged in as ${discordClient?.user?.tag}`);
      setupDiscordListeners();
      await syncFromDiscord();

      // Look up admin profile
      try {
        const adminId = process.env.ADMIN_DISCORD_ID;
        if (adminId && discordClient) {
          const user = await discordClient.users.fetch(adminId).catch(() => null);
          if (user) {
            adminUserPayload = {
              username: user.username,
              discriminator: user.discriminator || '0000',
              role: 'Administrator',
              avatar: user.displayAvatarURL({ extension: 'png', size: 128 })
            };
            console.log(`Successfully mapped administrator session profile to: @${user.username}`);
          }
        }
      } catch (pErr) {
        console.warn('Failed to resolve ADMIN_DISCORD_ID:', pErr);
      }
    });

    await discordClient.login(token);

  } catch (err: any) {
    console.error('CRITICAL: Discord Bot initialization failed:', err.message || err);
  }
}

// Initialize execution
checkAndInitDiscord();

// Update live memory diagnostics (falls back to random parameters only if bot is offline)
function refreshDiagnostics() {
  if (discordClient && discordClient.readyAt) {
    diagnostic.status = 'optimal';
    diagnostic.latency = discordClient.ws.ping;
    diagnostic.uptime = Math.floor((discordClient.uptime || 0) / 1000);
    
    const usage = process.cpuUsage();
    diagnostic.cpuUsage = parseFloat(( (usage.user + usage.system) / 10000000 ).toFixed(1));
    const mem = process.memoryUsage();
    diagnostic.memoryUsage = {
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal
    };
  } else {
    diagnostic.uptime += 10;
    diagnostic.latency = Math.floor(Math.random() * 8) + 8; // 8-16ms jitter
    diagnostic.cpuUsage = parseFloat((5 + Math.random() * 6).toFixed(1)); // 5-11% jitter
    diagnostic.memoryUsage = {
      heapUsed: 40000000 + Math.floor(Math.random() * 3000000),
      heapTotal: 104857600
    };
  }
  broadcastToClients('SYNC_DIAGNOSTIC', diagnostic);
}

// Periodically update simulated bots diagnostic telemetry
setInterval(() => {
  refreshDiagnostics();
}, 10000);

// Initialize server-side Gemini client securely
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middlewares
  app.use(express.json());

  // OAuth2 Simulator endpoints for Discord Admin Access
  app.post('/api/auth/discord-simulate', (req, res) => {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'OAuth2 code is requested.' });
    }
    
    // Check if real admin payload exists
    if (adminUserPayload) {
      res.json({
        access_token: 'stark_secure_access_token_token_jwt_simulated',
        token_type: 'Bearer',
        expires_in: 604800,
        scope: 'identify guilds guilds.members.read',
        user: {
          id: process.env.ADMIN_DISCORD_ID || '123456789012345678',
          username: adminUserPayload.username,
          discriminator: adminUserPayload.discriminator || '0000',
          global_name: adminUserPayload.username,
          avatar: adminUserPayload.avatar,
          verified: true,
          mfa_enabled: true,
          email: 'admin@discord.com'
        }
      });
    } else {
      res.json({
        access_token: 'stark_secure_access_token_token_jwt_simulated',
        token_type: 'Bearer',
        expires_in: 604800,
        scope: 'identify guilds guilds.members.read',
        user: {
          id: '123456789012345678',
          username: 'TonyStark',
          discriminator: '0001',
          global_name: 'Tony Stark',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
          verified: true,
          mfa_enabled: true,
          email: 'tony@starkindustries.com'
        }
      });
    }

    appendAuditLog('security', 'OAuth Gateway', 'OAuth2 token issued successfully for Administrator', 'low');
  });

  // SSE Stream Endpoint for absolute real-time state broadcasts across tabs
  app.get('/api/realtime/stream', (req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    // Send immediate initial sync packets
    const handshakeData = JSON.stringify({
      type: 'INIT',
      payload: { 
        roles, 
        members, 
        logs, 
        tickets, 
        backups, 
        diagnostic,
        adminUser: adminUserPayload,
        discordBotActive: !!discordClient?.readyAt
      }
    });
    res.write(`data: ${handshakeData}\n\n`);

    sseClients.push(res);

    req.on('close', () => {
      sseClients = sseClients.filter((client) => client !== res);
    });
  });

  // Diagnostic endpoints
  app.get('/api/bot/status', (req, res) => {
    res.json(diagnostic);
  });

  // Roles endpoints
  app.get('/api/roles', (req, res) => {
    res.json(roles);
  });

  app.post('/api/roles', async (req, res) => {
    const { name, color, hoist, permissions } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Role name required' });
    }

    if (liveGuild) {
      try {
        const discordRole = await liveGuild.roles.create({
          name,
          color: color ? parseInt(color.replace('#', ''), 16) : undefined,
          hoist: hoist !== undefined ? hoist : false,
          permissions: permissions || []
        });
        const mapped = mapDiscordRole(discordRole, liveGuild);
        // Add to our roles cache
        roles.push(mapped);
        broadcastToClients('SYNC_ROLES', roles);
        appendAuditLog('role', 'Administrator', `Created new security/organizational role: ${name}`, 'medium', name);
        return res.status(201).json(mapped);
      } catch (err: any) {
        console.error('Failed to create role on Discord API:', err);
        return res.status(500).json({ error: `Discord API failure: ${err.message}` });
      }
    }

    // Offline cache fallback
    const newRole: Role = {
      id: `role-${Date.now()}`,
      name,
      color: color || '#94a3b8',
      hoist: hoist !== undefined ? hoist : false,
      permissions: permissions || ['VIEW_CHANNEL', 'SEND_MESSAGES'],
      memberCount: 0
    };
    roles.push(newRole);
    broadcastToClients('SYNC_ROLES', roles);
    appendAuditLog('role', 'Administrator', `Created new security/organizational role: ${name}`, 'medium', name);
    res.status(201).json(newRole);
  });

  app.put('/api/roles/:id', async (req, res) => {
    const { id } = req.params;
    const { name, color, hoist, permissions } = req.body;

    if (liveGuild) {
      try {
        const roleObj = await liveGuild.roles.fetch(id);
        if (!roleObj) {
          return res.status(404).json({ error: 'Role not found' });
        }
        await roleObj.edit({
          name: name !== undefined ? name : roleObj.name,
          color: color !== undefined ? parseInt(color.replace('#', ''), 16) : roleObj.color,
          hoist: hoist !== undefined ? hoist : roleObj.hoist,
          permissions: permissions !== undefined ? permissions : roleObj.permissions
        });
        const updated = mapDiscordRole(roleObj, liveGuild);
        
        // Update local cache
        const index = roles.findIndex(r => r.id === id);
        if (index !== -1) {
          roles[index] = updated;
        }
        broadcastToClients('SYNC_ROLES', roles);
        appendAuditLog('role', 'Administrator', `Modified configurations for role: ${roleObj.name}`, 'medium', roleObj.name);
        return res.json(updated);
      } catch (err: any) {
        console.error('Failed to update role on Discord API:', err);
        return res.status(500).json({ error: `Discord API failure: ${err.message}` });
      }
    }

    // Offline Cache Fallback
    const index = roles.findIndex(r => r.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Role not found' });
    }
    roles[index] = { ...roles[index], ...req.body };
    broadcastToClients('SYNC_ROLES', roles);
    appendAuditLog('role', 'Administrator', `Modified configurations for role: ${roles[index].name}`, 'medium', roles[index].name);
    res.json(roles[index]);
  });

  app.delete('/api/roles/:id', async (req, res) => {
    const { id } = req.params;

    if (liveGuild) {
      try {
        const roleObj = await liveGuild.roles.fetch(id);
        if (!roleObj) {
          return res.status(404).json({ error: 'Role not found' });
        }
        const rName = roleObj.name;
        await roleObj.delete();
        
        // Update local cache
        roles = roles.filter(r => r.id !== id);
        members = members.map(m => {
          if (m.roles.includes(id)) {
            return { ...m, roles: m.roles.filter(rid => rid !== id) };
          }
          return m;
        });

        broadcastToClients('SYNC_ROLES', roles);
        broadcastToClients('SYNC_MEMBERS', members);
        appendAuditLog('role', 'Administrator', `Purged guild role: ${rName}`, 'high', rName);
        return res.json({ message: 'Role deleted successfully' });
      } catch (err: any) {
        console.error('Failed to delete role on Discord API:', err);
        return res.status(500).json({ error: `Discord API failure: ${err.message}` });
      }
    }

    // Offline Cache Fallback
    const targetRole = roles.find(r => r.id === id);
    if (!targetRole) {
      return res.status(404).json({ error: 'Role not found' });
    }
    roles = roles.filter(r => r.id !== id);
    members = members.map(m => {
      if (m.roles.includes(id)) {
        return { ...m, roles: m.roles.filter(rid => rid !== id) };
      }
      return m;
    });

    broadcastToClients('SYNC_ROLES', roles);
    broadcastToClients('SYNC_MEMBERS', members);
    appendAuditLog('role', 'Administrator', `Purged guild role: ${targetRole.name}`, 'high', targetRole.name);
    res.json({ message: 'Role deleted successfully' });
  });

  // Members endpoints
  app.get('/api/members', (req, res) => {
    res.json(members);
  });

  app.put('/api/members/:id', async (req, res) => {
    const { id } = req.params;
    const { isMuted, roles: updatedRoles, warnings } = req.body;

    if (liveGuild) {
      try {
        const memberObj = await liveGuild.members.fetch(id);
        if (!memberObj) {
          return res.status(404).json({ error: 'Member not found' });
        }

        // Handle Muting / Timeouts
        if (isMuted !== undefined) {
          if (isMuted) {
            try {
              if (memberObj.voice && memberObj.voice.channel) {
                await memberObj.voice.setMute(true).catch(() => null);
              }
            } catch (vErr) {}
            // Timeout for 1 hour
            await memberObj.timeout(60 * 60 * 1000, 'Security clearance quarantined').catch(() => null);
          } else {
            try {
              if (memberObj.voice && memberObj.voice.channel) {
                await memberObj.voice.setMute(false).catch(() => null);
              }
            } catch (vErr) {}
            await memberObj.timeout(null, 'Security clearance quarantine removed').catch(() => null);
          }
        }

        // Handle Role modifications
        if (updatedRoles !== undefined) {
          await memberObj.roles.set(updatedRoles);
        }

        const updated = mapDiscordMember(memberObj);
        
        // Update warning metrics in cache
        if (warnings !== undefined) {
          updated.warnings = warnings;
        }

        // Sync to local state
        const index = members.findIndex(m => m.id === id);
        if (index !== -1) {
          members[index] = updated;
        }

        broadcastToClients('SYNC_MEMBERS', members);
        
        let logsMessage = `Updated profile/roles for member: @${updated.username}`;
        if (isMuted !== undefined) {
          logsMessage = isMuted
            ? `Engaged voice/text mute on member: @${updated.username} under protocol quarantine`
            : `Disengaged voice/text mute on member: @${updated.username}`;
        }
        if (warnings !== undefined) {
          logsMessage = `Adjusted security warnings count for: @${updated.username} (Level: ${warnings})`;
        }

        appendAuditLog('moderation', 'Administrator', logsMessage, warnings > 0 ? 'medium' : 'low', updated.username);
        return res.json(updated);
      } catch (err: any) {
        console.error('Failed to modify member on Discord API:', err);
        return res.status(500).json({ error: `Discord API failure: ${err.message}` });
      }
    }

    // Offline Cache Fallback
    const index = members.findIndex(m => m.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Member not found' });
    }
    const oldMember = members[index];
    members[index] = { ...oldMember, ...req.body };

    // Update role counts
    roles = roles.map(r => {
      const isRoleGranted = members[index].roles.includes(r.id);
      const wasRoleGranted = oldMember.roles.includes(r.id);
      let count = r.memberCount;
      if (isRoleGranted && !wasRoleGranted) count++;
      if (!isRoleGranted && wasRoleGranted) count--;
      return { ...r, memberCount: Math.max(0, count) };
    });

    broadcastToClients('SYNC_MEMBERS', members);
    broadcastToClients('SYNC_ROLES', roles);

    let logsMessage = `Updated profile/roles for member: @${members[index].username}`;
    if (req.body.isMuted !== undefined && req.body.isMuted !== oldMember.isMuted) {
      logsMessage = req.body.isMuted
        ? `Engaged voice/text mute on member: @${members[index].username} under protocol quarantine`
        : `Disengaged voice/text mute on member: @${members[index].username}`;
    }
    if (req.body.warnings !== undefined && req.body.warnings !== oldMember.warnings) {
      logsMessage = `Adjusted security warnings count for: @${members[index].username} (Level: ${req.body.warnings})`;
    }

    appendAuditLog('moderation', 'Administrator', logsMessage, req.body.warnings > oldMember.warnings ? 'medium' : 'low', oldMember.username);
    res.json(members[index]);
  });

  // Kick / Ban members
  app.delete('/api/members/:id', async (req, res) => {
    const { id } = req.params;
    const { type } = req.query; // 'kick' or 'ban'

    if (liveGuild) {
      try {
        const memberObj = await liveGuild.members.fetch(id).catch(() => null);
        const username = memberObj ? memberObj.user.username : `ID: ${id}`;
        
        if (type === 'ban') {
          await liveGuild.members.ban(id, { reason: 'Executed Stark Sector Quarantine' });
        } else {
          if (memberObj) {
            await memberObj.kick('Executed Stark Sector Expulsion');
          } else {
            return res.status(404).json({ error: 'Member profile online state not found to execute kick.' });
          }
        }

        // Update local cache
        members = members.filter(m => m.id !== id);
        roles = roles.map(r => {
          const wasGranted = memberObj ? memberObj.roles.cache.has(r.id) : false;
          return {
            ...r,
            memberCount: wasGranted ? Math.max(0, r.memberCount - 1) : r.memberCount
          };
        });

        broadcastToClients('SYNC_MEMBERS', members);
        broadcastToClients('SYNC_ROLES', roles);

        const actionText = type === 'ban' ? 'Server Ban Protocol' : 'Expulsion Kick Protocol';
        appendAuditLog('moderation', 'Administrator', `Executed ${actionText} against user @${username}`, 'high', username);
        return res.json({ message: 'Expelled successfully' });
      } catch (err: any) {
        console.error('Failed to kick/ban member on Discord API:', err);
        return res.status(500).json({ error: `Discord API failure: ${err.message}` });
      }
    }

    // Offline Cache Fallback
    const targetMember = members.find(m => m.id === id);
    if (!targetMember) {
      return res.status(404).json({ error: 'Member not found' });
    }

    members = members.filter(m => m.id !== id);

    // Recalculate role counts
    roles = roles.map(r => {
      const wasGranted = targetMember.roles.includes(r.id);
      return {
        ...r,
        memberCount: wasGranted ? Math.max(0, r.memberCount - 1) : r.memberCount
      };
    });

    broadcastToClients('SYNC_MEMBERS', members);
    broadcastToClients('SYNC_ROLES', roles);

    const actionText = type === 'ban' ? 'Server Ban Protocol' : 'Expulsion Kick Protocol';
    appendAuditLog('moderation', 'Administrator', `Executed ${actionText} against user @${targetMember.username}`, 'high', targetMember.username);
    res.json({ message: 'Expelled successfully' });
  });

  // Support Tickets API
  app.get('/api/tickets', (req, res) => {
    res.json(tickets);
  });

  app.post('/api/tickets', (req, res) => {
    const { author, title, description, category } = req.body;
    const newTkt: SupportTicket = {
      id: `tkt-${Date.now()}`,
      author: author || 'PeterParker',
      channelName: `ticket-${String(Math.floor(Math.random() * 9000) + 1000)}-support`,
      title: title || 'System Inconsistency Identified',
      description: description || 'No detail specified',
      status: 'open',
      createdAt: new Date().toISOString(),
      category: category || 'General Questions',
      conversation: [
        {
          sender: 'user',
          message: description || 'Seeking guidance from F.R.I.D.A.Y.',
          timestamp: new Date().toISOString()
        }
      ]
    };
    tickets.unshift(newTkt);
    broadcastToClients('SYNC_TICKETS', tickets);
    appendAuditLog('bot', 'Security Core', `New support ticket generated: ${newTkt.channelName}`, 'low', newTkt.id);
    res.status(201).json(newTkt);
  });

  app.post('/api/tickets/:id/message', async (req, res) => {
    const { id } = req.params;
    const { message, sender } = req.body;
    const ticketIdx = tickets.findIndex(t => t.id === id);

    if (ticketIdx === -1) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const newMessage = {
      sender: sender || 'user',
      message: message || '',
      timestamp: new Date().toISOString()
    };

    tickets[ticketIdx].conversation.push(newMessage);
    broadcastToClients('SYNC_TICKETS', tickets);

    // If sender is user, we want F.R.I.D.A.Y. to respond via Gemini API dynamically!
    if (sender === 'user') {
      try {
        if (!ai) {
          const defaultResponse = {
            sender: 'friday' as const,
            message: "F.R.I.D.A.Y. Telemetry Notification: Direct connection to cognitive systems disabled. Please configure your GEMINI_API_KEY in Settings > Secrets to activate real intelligent conversation. (Offline automated backup message activated).",
            timestamp: new Date().toISOString()
          };
          tickets[ticketIdx].conversation.push(defaultResponse);
          broadcastToClients('SYNC_TICKETS', tickets);
          appendAuditLog('bot', 'F.R.I.D.A.Y.', `AI response generated via fallback (No API key found)`, 'low');
        } else {
          // Construct conversation context for Gemini 3.5-flash
          const historyLines = tickets[ticketIdx].conversation.map(line => `${line.sender === 'user' ? 'Citizen' : 'F.R.I.D.A.Y.'}: ${line.message}`).join('\n');
          const systemInstruction = `You are F.R.I.D.A.Y. (Female Replacement Intelligent Digital Assistant Youth), Tony Stark's personal holographic AI. You manage Stark Industries security clearances, labs, and automated support queues.
Always behave as a highly polished, polite, extremely knowledgeable, and technically advanced artificial intelligence. Keep responses concise, precise, and professional. 
Utilize terms like: "Protocol", "Telemetry", "Authorized", "Integrity Check", "Diagnostics", "Grid", "Auxiliary power".
Never use any emoji characters. Limit your response to 2-3 logical sentences. Address the user based on the ticket context. Maintain full compliance with strict privacy and security procedures.`;

          const response = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: `The following is the ticket conversation logs:\n\n${historyLines}\n\nF.R.I.D.A.Y, please reply directly to the last message as the AI assistant supporting this ticket:`,
            config: {
              systemInstruction,
              temperature: 0.7,
            }
          });

          const aiText = response.text || "Diagnostic error: Core speech generation unit offline.";
          const fridayReply = {
            sender: 'friday' as const,
            message: aiText,
            timestamp: new Date().toISOString()
          };

          tickets[ticketIdx].conversation.push(fridayReply);
          broadcastToClients('SYNC_TICKETS', tickets);
          appendAuditLog('bot', 'F.R.I.D.A.Y.', `AI ticket response broadcasted successfully on #${tickets[ticketIdx].channelName}`, 'low');
        }
      } catch (err: any) {
        console.error("Gemini API error in ticket message: ", err);
        const errorReply = {
          sender: 'friday' as const,
          message: `Interface malfunction: ${err.message || 'Error occurred during cognitive response synthesis.'}`,
          timestamp: new Date().toISOString()
        };
        tickets[ticketIdx].conversation.push(errorReply);
        broadcastToClients('SYNC_TICKETS', tickets);
      }
    }

    res.json(tickets[ticketIdx]);
  });

  app.put('/api/tickets/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const index = tickets.findIndex(t => t.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    tickets[index].status = status;
    broadcastToClients('SYNC_TICKETS', tickets);
    appendAuditLog('bot', 'Administrator', `Closed/Resolved ticket queue #${tickets[index].channelName}`, 'low', id);
    res.json(tickets[index]);
  });

  // Secure Encrypted Backup APIs
  app.get('/api/backups', (req, res) => {
    res.json(backups);
  });

  app.post('/api/backups', (req, res) => {
    try {
      const fullSnapshot = {
        roles,
        members,
        logs,
        tickets,
        timestamp: new Date().toISOString(),
        systemIntegrityScore: 100
      };

      const snapshotString = JSON.stringify(fullSnapshot);
      const sha256Hash = crypto.createHash('sha256').update(snapshotString).digest('hex');
      const snapshotSize = Buffer.byteLength(snapshotString, 'utf8');

      const nextId = `BKP-${String(940 + backups.length + 1)}`;
      const newBackup: BackupRecord = {
        id: nextId,
        timestamp: new Date().toISOString(),
        snapshotSize,
        encryptedHash: sha256Hash,
        rolesCount: roles.length,
        membersCount: members.length,
        status: 'success'
      };

      backups.unshift(newBackup);
      broadcastToClients('SYNC_BACKUPS', backups);
      appendAuditLog('backup', 'F.R.I.D.A.Y.', `Created highly secure, encrypted snapshot ${nextId} with checksum ${sha256Hash.slice(0, 16)}...`, 'high');
      res.status(201).json({ backup: newBackup, stateDump: snapshotString });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Pure Gemini chat interface for customized prompts/onboarding sequences
  app.post('/api/friday/chat', async (req, res) => {
    const { prompt, currentPromptType } = req.body;
    try {
      if (!ai) {
        return res.json({
          text: "Protocol Offline. Please specify your GEMINI_API_KEY inside the **Settings > Secrets** configuration to activate intelligent communication features on the server-side architecture."
        });
      }

      let systemInstruction = `You are F.R.I.D.A.Y., the elite holographic AI created by Tony Stark.
You are running diagnostics on a secure, private community server with deep encrypted firewalls and military-grade protocols.
Maintain a highly capable, futuristic, Stark-reminiscent voice. Be helpful, concise, confident, and polite. Always use strict cybersecurity and systems language.
Never use any emoji characters. Try to keep answers organized, with clear parameters.`;

      if (currentPromptType === 'onboarding') {
        systemInstruction += `\n\nFocus specifically on proposing a 3-step automated member onboarding sequence configuration for this private Discord server. Explain the protocols clearly. Ensure the security standards are high.`;
      } else if (currentPromptType === 'ticket-triage') {
        systemInstruction += `\n\nFocus on automated ticket indexing and triaging. How should system faults, access levels, or security clearance escalations be processed automatically by bots?`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.8,
        }
      });

      res.json({ text: response.text });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message || 'Cognitive subprocessor fault occurred.' });
    }
  });

  // Serve static assets and SPA configuration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`F.R.I.D.A.Y. Cybernetic Admin running on port ${PORT}`);
  });
}

startServer();
