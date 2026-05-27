import { Role, Member, AuditLog, SupportTicket, BackupRecord, BotDiagnostic } from './types';

export const initialRoles: Role[] = [
  {
    id: 'role-admin',
    name: 'Core Creator (Admin)',
    color: '#ef4444', // Red
    hoist: true,
    permissions: ['ADMINISTRATOR', 'MANAGE_GUILD', 'MANAGE_ROLES', 'MANAGE_CHANNELS', 'BAN_MEMBERS'],
    memberCount: 2,
  },
  {
    id: 'role-mod',
    name: 'Security Protocol (Mod)',
    color: '#f97316', // Orange
    hoist: true,
    permissions: ['KICK_MEMBERS', 'BAN_MEMBERS', 'MUTE_MEMBERS', 'MANAGE_MESSAGES'],
    memberCount: 3,
  },
  {
    id: 'role-engineer',
    name: 'Systems Engineer',
    color: '#06b6d4', // Cyan
    hoist: true,
    permissions: ['VIEW_AUDIT_LOG', 'MANAGE_WEBHOOKS'],
    memberCount: 4,
  },
  {
    id: 'role-agent',
    name: 'Automated Agent',
    color: '#10b981', // Green
    hoist: false,
    permissions: ['SEND_MESSAGES', 'EMBED_LINKS', 'ADD_REACTIONS'],
    memberCount: 1,
  },
  {
    id: 'role-verified',
    name: 'Verified Citizen',
    color: '#3b82f6', // Indigo
    hoist: false,
    permissions: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY'],
    memberCount: 12,
  }
];

export const initialMembers: Member[] = [
  {
    id: 'mem-1',
    username: 'TonyStark',
    discriminator: '0001',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
    status: 'online',
    customStatus: 'Testing Mark 85 core structural integrity',
    joinedAt: '2026-01-15T08:00:00Z',
    roles: ['role-admin', 'role-engineer'],
    warnings: 0,
    isMuted: false,
  },
  {
    id: 'mem-2',
    username: 'PepperPotts',
    discriminator: '0002',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces',
    status: 'online',
    customStatus: 'Reviewing Stark Industries quarterly telemetry',
    joinedAt: '2026-01-15T08:30:00Z',
    roles: ['role-admin'],
    warnings: 0,
    isMuted: false,
  },
  {
    id: 'mem-3',
    username: 'BruceBanner',
    discriminator: '0007',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces',
    status: 'dnd',
    customStatus: 'GAMMA radiation reading normal... currently',
    joinedAt: '2026-02-01T12:00:00Z',
    roles: ['role-mod', 'role-engineer'],
    warnings: 1,
    isMuted: false,
  },
  {
    id: 'mem-4',
    username: 'F.R.I.D.A.Y.',
    discriminator: '1099',
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop',
    status: 'online',
    customStatus: 'Monitoring Server Architecture v4.2.0',
    joinedAt: '2026-01-01T00:00:00Z',
    roles: ['role-agent'],
    warnings: 0,
    isMuted: false,
  },
  {
    id: 'mem-5',
    username: 'Rhodey',
    discriminator: '0004',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&h=100&fit=crop&crop=faces',
    status: 'idle',
    customStatus: 'Flight exercises completed',
    joinedAt: '2026-01-20T15:45:00Z',
    roles: ['role-mod', 'role-verified'],
    warnings: 0,
    isMuted: false,
  },
  {
    id: 'mem-6',
    username: 'PeterParker',
    discriminator: '1962',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop&crop=faces',
    status: 'online',
    customStatus: 'Doing homework / Patrol duty',
    joinedAt: '2026-03-10T19:20:00Z',
    roles: ['role-engineer', 'role-verified'],
    warnings: 2,
    isMuted: false,
  },
  {
    id: 'mem-7',
    username: 'ObadiahS',
    discriminator: '0666',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=faces',
    status: 'offline',
    customStatus: 'Planning tech retrieval',
    joinedAt: '2026-05-01T09:00:00Z',
    roles: ['role-verified'],
    warnings: 3,
    isMuted: true,
  }
];

export const initialLogs: AuditLog[] = [
  {
    id: 'log-1',
    timestamp: '2026-05-27T14:15:00Z',
    category: 'security',
    executor: 'F.R.I.D.A.Y.',
    action: 'Anomalous access request blocked from remote IP [198.51.100.42]',
    severity: 'high',
  },
  {
    id: 'log-2',
    timestamp: '2026-05-27T13:45:00Z',
    category: 'backup',
    executor: 'F.R.I.D.A.Y.',
    action: 'Automated encrypted snapshot STARK-BKP-10294 compiled cleanly',
    severity: 'low',
  },
  {
    id: 'log-3',
    timestamp: '2026-05-27T11:30:00Z',
    category: 'moderation',
    executor: 'PepperPotts',
    action: 'Muted user ObadiahS for duplicate spam warnings in core channels',
    target: 'ObadiahS',
    severity: 'medium',
  },
  {
    id: 'log-4',
    timestamp: '2026-05-27T10:15:00Z',
    category: 'role',
    executor: 'TonyStark',
    action: 'Modified permissions for core security protocol role',
    target: 'Security Protocol (Mod)',
    severity: 'medium',
  },
  {
    id: 'log-5',
    timestamp: '2026-05-27T08:00:00Z',
    category: 'bot',
    executor: 'F.R.I.D.A.Y.',
    action: 'Quantum diagnostic scan reports all system shards nominal',
    severity: 'low',
  }
];

export const initialTickets: SupportTicket[] = [
  {
    id: 'tkt-1',
    author: 'PeterParker',
    channelName: 'ticket-0982-nanotech',
    title: 'Inquiry: Nanotech mesh override coordinates',
    description: 'F.R.I.D.A.Y. is requesting administrative verification to deploy the carbon nanotech weave parameters to my suit. The firmware checksum fails.',
    status: 'open',
    createdAt: '2026-05-27T14:02:00Z',
    category: 'technical_assistance',
    conversation: [
      {
        sender: 'user',
        message: 'Hello F.R.I.D.A.Y., I cannot download the nanotech calibration patch. It keeps saying Checksum Verification Error 0x892A.',
        timestamp: '2026-05-27T14:02:00Z',
      },
      {
        sender: 'friday',
        message: 'Understood, Mr. Parker. The Stark Secure Core requires an authorized administrative signature to deploy version 4.1.2 patches. I have logged ticket #0982 and alerted Mr. Stark.',
        timestamp: '2026-05-27T14:03:00Z',
      }
    ]
  },
  {
    id: 'tkt-2',
    author: 'BruceBanner',
    channelName: 'ticket-0129-gamma-shields',
    title: 'Fault: Lab chamber magnetic shield leak',
    description: 'Minor containment field fluctuations in chamber beta-3. Sensor arrays are reporting mild neutron flux.',
    status: 'assigned',
    createdAt: '2026-05-27T12:10:00Z',
    category: 'facility_status',
    conversation: [
      {
        sender: 'user',
        message: 'The laboratory shield coils in sector B are showing 3% variance. I might need a physical bypass.',
        timestamp: '2026-05-27T12:10:00Z',
      },
      {
        sender: 'friday',
        message: 'Analyzing coil parameters Dr. Banner. I am increasing power routing to auxiliary stabilizers to offset the neutron variance by 4% immediately.',
        timestamp: '2026-05-27T12:12:00Z',
      }
    ]
  }
];

export const initialBackups: BackupRecord[] = [
  {
    id: 'BKP-0941',
    timestamp: '2026-05-27T00:00:00Z',
    snapshotSize: 765432,
    encryptedHash: '8b7f83e2da0d139caef38901ebad92f4cce9b1ff3aa0182ce94ff9c88bc3b231',
    rolesCount: 5,
    membersCount: 7,
    status: 'success'
  },
  {
    id: 'BKP-0940',
    timestamp: '2026-05-26T00:00:00Z',
    snapshotSize: 764980,
    encryptedHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    rolesCount: 5,
    membersCount: 6,
    status: 'success'
  }
];

export const initialDiagnostic: BotDiagnostic = {
  status: 'optimal',
  latency: 14, // milliseconds
  cpuUsage: 8.4, // percentage
  memoryUsage: {
    heapUsed: 42394012, // ~40mb
    heapTotal: 104857600, // 100mb
  },
  uptime: 432105, // ~5 days in seconds
  shards: [
    { id: 0, status: 'connected', latency: 12 },
    { id: 1, status: 'connected', latency: 15 },
    { id: 2, status: 'connected', latency: 15 }
  ]
};
export const MOCK_CHANNELS = ['announcements', 'general-lounge', 'secure-telemetry', 'core-command-logs', 'support-queue'];
