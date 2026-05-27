export interface Role {
  id: string;
  name: string;
  color: string;
  hoist: boolean;
  permissions: string[];
  memberCount: number;
}

export interface Member {
  id: string;
  username: string;
  discriminator: string;
  avatar: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  customStatus?: string;
  joinedAt: string;
  roles: string[]; // Role IDs
  warnings: number;
  isMuted: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  category: 'security' | 'moderation' | 'role' | 'backup' | 'bot';
  executor: string;
  action: string;
  target?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface SupportTicket {
  id: string;
  author: string;
  channelName: string;
  title: string;
  description: string;
  status: 'open' | 'assigned' | 'resolved';
  createdAt: string;
  category: string;
  conversation: {
    sender: 'user' | 'friday';
    message: string;
    timestamp: string;
  }[];
}

export interface BackupRecord {
  id: string;
  timestamp: string;
  snapshotSize: number;
  encryptedHash: string;
  rolesCount: number;
  membersCount: number;
  status: 'success' | 'corrupted';
}

export interface BotDiagnostic {
  status: 'optimal' | 'warning' | 'degraded';
  latency: number;
  cpuUsage: number;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
  };
  uptime: number; // in seconds
  shards: {
    id: number;
    status: 'connected' | 'reconnecting' | 'disconnected';
    latency: number;
  }[];
}

export interface RealtimeMessage {
  type: 'SYNC_ROLES' | 'SYNC_MEMBERS' | 'SYNC_LOGS' | 'SYNC_TICKETS' | 'SYNC_BACKUPS' | 'SYNC_DIAGNOSTIC';
  payload: any;
}
