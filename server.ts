import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import crypto from 'crypto';
import dotenv from 'dotenv';
import fs from 'fs';

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

// Update live memory diagnostics
function refreshDiagnostics() {
  diagnostic.uptime += 10;
  diagnostic.latency = Math.floor(Math.random() * 8) + 8; // 8-16ms jitter
  diagnostic.cpuUsage = parseFloat((5 + Math.random() * 6).toFixed(1)); // 5-11% jitter
  diagnostic.memoryUsage = {
    heapUsed: 40000000 + Math.floor(Math.random() * 3000000),
    heapTotal: 104857600
  };
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
    const { code, client_id } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'OAuth2 code is requested.' });
    }
    // Simulate token trade sequence & user inspection
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
      payload: { roles, members, logs, tickets, backups, diagnostic }
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

  app.post('/api/roles', (req, res) => {
    const { name, color, hoist, permissions } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Role name required' });
    }
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

  app.put('/api/roles/:id', (req, res) => {
    const { id } = req.params;
    const index = roles.findIndex(r => r.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Role not found' });
    }
    roles[index] = { ...roles[index], ...req.body };
    broadcastToClients('SYNC_ROLES', roles);
    appendAuditLog('role', 'Administrator', `Modified configurations for role: ${roles[index].name}`, 'medium', roles[index].name);
    res.json(roles[index]);
  });

  app.delete('/api/roles/:id', (req, res) => {
    const { id } = req.params;
    const targetRole = roles.find(r => r.id === id);
    if (!targetRole) {
      return res.status(404).json({ error: 'Role not found' });
    }
    // Delete role and clear it from members list
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

  app.put('/api/members/:id', (req, res) => {
    const { id } = req.params;
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

    broadcastToClients('SYNC_RELOAD', { roles, members });
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
  app.delete('/api/members/:id', (req, res) => {
    const { id } = req.params;
    const { type } = req.query; // 'kick' or 'ban'
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
          // Fallback if API key missing
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
      // Assemble full current server database state for strict encrypted snapshot
      const fullSnapshot = {
        roles,
        members,
        logs,
        tickets,
        timestamp: new Date().toISOString(),
        systemIntegrityScore: 100
      };

      const snapshotString = JSON.stringify(fullSnapshot);
      // Generate highly high-integrity SHA-256 Checksum values and simulate AES initialization block
      const sha256Hash = crypto.createHash('sha256').update(snapshotString).digest('hex');

      // Create Military-grade mockup block representation to display
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
    const { prompt, currentPromptType } = req.body; // promptType: 'general' | 'onboarding' | 'ticket-triage'
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
