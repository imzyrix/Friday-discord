import React, { useState, useEffect } from 'react';
import {
  Shield,
  Activity,
  LogOut,
  Sliders,
  Clock,
  Unlock,
  Bot,
  Terminal,
  Server,
  Database,
  RefreshCw,
  Cpu,
  Users,
  AlertTriangle
} from 'lucide-react';
import { motion } from 'motion/react';

// Subcomponents
import HudDisplay from './components/HudDisplay';
import BackupModule from './components/BackupModule';
import RolesManager from './components/RolesManager';
import ModerationPanel from './components/ModerationPanel';
import TerminalLog from './components/TerminalLog';
import FridayConsole from './components/FridayConsole';

// Shared Types
import { Role, Member, AuditLog, SupportTicket, BackupRecord, BotDiagnostic } from './types';

export default function App() {
  // Sync States
  const [roles, setRoles] = useState<Role[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [diagnostic, setDiagnostic] = useState<BotDiagnostic | null>(null);

  // Connection System Status
  const [syncStatus, setSyncStatus] = useState<'connecting' | 'synchronized' | 'disconnected'>('connecting');
  const [systemTime, setSystemTime] = useState<string>('');

  // Tab View Controller
  const [activeTab, setActiveTab] = useState<'telemetry' | 'roles' | 'moderation' | 'logs' | 'friday'>('telemetry');

  // Simulated authorized session info
  const [sessionUser, setSessionUser] = useState({
    username: 'TonyStark',
    discriminator: '0001',
    role: 'Creator & Lead Engineer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces'
  });

  // Ticking secure UTC clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setSystemTime(now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Initialize and maintain Real-time Server SSE Stream
  useEffect(() => {
    let sse: EventSource | null = null;

    const connectSSE = () => {
      setSyncStatus('connecting');
      sse = new EventSource('/api/realtime/stream');

      sse.onopen = () => {
        setSyncStatus('synchronized');
      };

      sse.onerror = (err) => {
        console.error('SSE sync disruption, retrying connection...', err);
        setSyncStatus('disconnected');
        // Attempt reconnections
        setTimeout(() => {
          if (sse?.readyState === EventSource.CLOSED) {
            connectSSE();
          }
        }, 5000);
      };

      sse.onmessage = (event) => {
        try {
          const packet = JSON.parse(event.data);
          const { type, payload } = packet;

          switch (type) {
            case 'INIT':
              setRoles(payload.roles);
              setMembers(payload.members);
              setLogs(payload.logs);
              setTickets(payload.tickets);
              setBackups(payload.backups);
              setDiagnostic(payload.diagnostic);
              break;
            case 'SYNC_ROLES':
              setRoles(payload);
              break;
            case 'SYNC_MEMBERS':
              setMembers(payload);
              break;
            case 'SYNC_LOGS':
              setLogs(payload);
              break;
            case 'SYNC_TICKETS':
              setTickets(payload);
              break;
            case 'SYNC_BACKUPS':
              setBackups(payload);
              break;
            case 'SYNC_DIAGNOSTIC':
              setDiagnostic(payload);
              break;
            case 'SYNC_RELOAD':
              setRoles(payload.roles);
              setMembers(payload.members);
              break;
            default:
              console.log('Unrecognized sync packet pattern: ', type);
          }
        } catch (e) {
          console.error('Failure parsing synchronization stream packet', e);
        }
      };
    };

    connectSSE();

    return () => {
      if (sse) {
        sse.close();
      }
    };
  }, []);

  // Dispatch API Call Actions
  const handleCreateRole = async (roleData: Partial<Role>) => {
    const res = await fetch('/api/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(roleData)
    });
    return await res.json();
  };

  const handleUpdateRole = async (id: string, updates: Partial<Role>) => {
    const res = await fetch(`/api/roles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return await res.json();
  };

  const handleDeleteRole = async (id: string) => {
    const res = await fetch(`/api/roles/${id}`, { method: 'DELETE' });
    return await res.json();
  };

  const handleUpdateMember = async (id: string, updates: Partial<Member>) => {
    const res = await fetch(`/api/members/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return await res.json();
  };

  const handleRemoveMember = async (id: string, type: 'kick' | 'ban') => {
    const res = await fetch(`/api/members/${id}?type=${type}`, { method: 'DELETE' });
    return await res.json();
  };

  const handleSubmitTicketReply = async (id: string, text: string, sender: 'user' | 'friday') => {
    const res = await fetch(`/api/tickets/${id}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, sender })
    });
    return await res.json();
  };

  const handleCloseTicket = async (id: string, status: 'resolved' | 'assigned') => {
    const res = await fetch(`/api/tickets/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return await res.json();
  };

  const handleSynthesizeTicket = async () => {
    // Inject a random system fault ticket automatically to debug
    const titles = [
      'Fault: Repulsor containment cooling malfunction',
      'Alert: Arc reactor core plasma variance detected',
      'Inquiry: Deep-space satellite orbital bypass schedule',
      'Warning: Auxiliary backup grid offline in sub-basement B'
    ];
    const descriptions = [
      'Core thermal sensors show a 12% rise in sector G cooling tubes. Standard cooling coils are not responding to local reboot signals.',
      'Minor magnetic flux on the main output transformer block. Requesting automatic shutdown of phase-2 collectors before saturation.',
      'I am currently unable to synchronize the orbit alignments of the STARK-V satellite payload with local arrays. Please override access restriction 0x93.',
      'Emergency fuel arrays report empty readings. If auxiliary power does not activate within 30 minutes, mainframe vaults will drop authorization protocols.'
    ];
    const categories = ['Facility Alerts', 'Quantum Integrity', 'Space Telemetry', 'Auxiliary Systems'];
    const authors = ['BruceBanner', 'PeterParker', 'TonyStark', 'Rhodey'];

    const idx = Math.floor(Math.random() * titles.length);

    const res = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        author: authors[idx],
        title: titles[idx],
        description: descriptions[idx],
        category: categories[idx]
      })
    });
    return await res.json();
  };

  const handleCreateEncryptedBackup = async () => {
    const res = await fetch('/api/backups', { method: 'POST' });
    return await res.json();
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans flex flex-col relative overflow-x-hidden select-none selection:bg-cyan-950 selection:text-cyan-300">
      
      {/* Background cyberpunk holographic scanlines overlay */}
      <div className="absolute inset-0 bg-radial-grid pointer-events-none z-0"></div>

      {/* Main Terminal Header Rail */}
      <header className="relative z-10 border-b border-cyan-500/20 bg-zinc-950/80 backdrop-blur-md px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Title branding logo */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <Shield className="w-5.5 h-3.5 text-cyan-400 transform -rotate-12 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-widest font-mono text-white">F.R.I.D.A.Y. ADMIN UNIT</h1>
              <span className="text-[9px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-500/30 px-1.5 py-0.2 rounded font-bold uppercase tracking-wider">v4.2.0</span>
            </div>
            <p className="text-[10px] text-zinc-500 font-mono tracking-wider">SECURITY & MODERATION COGNITIVE CORE</p>
          </div>
        </div>

        {/* Real-time sync heartbeats & time display */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-cyan-500/10">
            <Clock className="w-4 h-4 text-zinc-500" />
            <span className="text-zinc-300 font-medium font-mono tabular-nums">{systemTime}</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-cyan-500/10">
            <span className={`w-2 h-2 rounded-full ${
              syncStatus === 'synchronized'
                ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse'
                : syncStatus === 'connecting'
                ? 'bg-yellow-400 shadow-[0_0_8px_#fbbf24] animate-ping'
                : 'bg-red-500 shadow-[0_0_8px_#f87171]'
            }`} />
            <span className="text-zinc-400 uppercase tracking-wider text-[10px] font-bold">
              {syncStatus === 'synchronized' ? 'DYNAMIC TELEMETRY ACTIVE' : syncStatus === 'connecting' ? 'SYNCING MATRIX...' : 'DISCONNECTED'}
            </span>
          </div>

          {/* Connected Admin identity profile widget */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-cyan-950/20 border border-cyan-500/20">
            <img 
              src={sessionUser.avatar} 
              alt={sessionUser.username}
              referrerPolicy="no-referrer"
              className="w-6 h-6 rounded border border-cyan-400/40 object-cover" 
            />
            <div className="text-left leading-tight hidden sm:block">
              <div className="font-bold text-white text-[10px] tracking-wider">@{sessionUser.username}</div>
              <div className="text-[8.5px] text-cyan-400 font-bold tracking-tighter uppercase">{sessionUser.role}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Futuristic workspace grids layout with tab items */}
      <main className="flex-1 relative z-10 p-6 max-w-7xl w-full mx-auto flex flex-col gap-6">
        
        {/* Top-level Holographic Bento KPI Counters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="p-4 rounded-xl bg-zinc-950/80 border border-cyan-500/20 hover:border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.06)] hover:shadow-[0_0_20px_rgba(6,182,212,0.12)] transition-all flex items-center justify-between gap-3 relative overflow-hidden group"
          >
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-cyan-400/65"></div>
            <div>
              <span className="text-[9px] font-mono text-zinc-500 font-bold uppercase block tracking-wider">TOTAL CITIZENS</span>
              <span className="text-2xl font-bold font-mono tracking-tight text-white mt-1 block select-all">{members.length}</span>
              <span className="text-[8.5px] font-mono text-cyan-400 block mt-1 tracking-tighter">
                {members.filter(m => m.status === 'online').length} SECTOR CONTACTS
              </span>
            </div>
            <div className="p-2 bg-cyan-950/40 rounded-lg border border-cyan-500/20 text-cyan-400 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="p-4 rounded-xl bg-zinc-950/80 border border-cyan-500/20 hover:border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.06)] hover:shadow-[0_0_20px_rgba(6,182,212,0.12)] transition-all flex items-center justify-between gap-3 relative overflow-hidden group"
          >
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-cyan-400/65"></div>
            <div>
              <span className="text-[9px] font-mono text-zinc-500 font-bold uppercase block tracking-wider">CLEARANCE ROLES</span>
              <span className="text-2xl font-bold font-mono tracking-tight text-white mt-1 block select-all">{roles.length}</span>
              <span className="text-[8.5px] font-mono text-cyan-400 block mt-1 tracking-tighter">
                {roles.filter(r => r.hoist).length} HOIST PRIVILEGES
              </span>
            </div>
            <div className="p-2 bg-cyan-950/40 rounded-lg border border-cyan-500/20 text-cyan-400 group-hover:scale-110 transition-transform">
              <Shield className="w-5 h-5" />
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className={`p-4 rounded-xl bg-zinc-950/80 border hover:border-red-400/50 transition-all flex items-center justify-between gap-3 relative overflow-hidden group ${
              members.reduce((sum, m) => sum + m.warnings, 0) > 0 
                ? 'border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.08)]' 
                : 'border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.06)]'
            }`}
          >
            <div className={`absolute top-0 left-0 right-0 h-[2px] ${
              members.reduce((sum, m) => sum + m.warnings, 0) > 0 ? 'bg-red-500/75 animate-pulse' : 'bg-cyan-400/65'
            }`}></div>
            <div>
              <span className="text-[9px] font-mono text-zinc-500 font-bold uppercase block tracking-wider">THREAT LEVEL</span>
              <span className={`text-2xl font-bold font-mono tracking-tight mt-1 block select-all ${
                members.reduce((sum, m) => sum + m.warnings, 0) > 0 ? 'text-red-400' : 'text-white'
              }`}>
                {members.reduce((sum, m) => sum + m.warnings, 0)} WARNS
              </span>
              <span className={`text-[8.5px] font-mono block mt-1 tracking-tighter ${
                members.reduce((sum, m) => sum + m.warnings, 0) > 0 ? 'text-red-400 animate-pulse font-bold' : 'text-emerald-400'
              }`}>
                {members.reduce((sum, m) => sum + m.warnings, 0) > 0 ? 'ATTENTION REQUIRED' : 'GRID STAT: SECURE'}
              </span>
            </div>
            <div className={`p-2 rounded-lg border text-cyan-400 group-hover:scale-110 transition-transform ${
              members.reduce((sum, m) => sum + m.warnings, 0) > 0 
                ? 'bg-red-950/30 border-red-500/30 text-red-400' 
                : 'bg-cyan-950/40 border-cyan-500/20 text-cyan-400'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className={`p-4 rounded-xl bg-zinc-950/80 border hover:border-cyan-400/50 transition-all flex items-center justify-between gap-3 relative overflow-hidden group ${
              tickets.filter(t => t.status !== 'resolved').length > 0
                ? 'border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.08)]'
                : 'border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.06)]'
            }`}
          >
            <div className={`absolute top-0 left-0 right-0 h-[2px] ${
              tickets.filter(t => t.status !== 'resolved').length > 0 ? 'bg-amber-400/75' : 'bg-cyan-400/65'
            }`}></div>
            <div>
              <span className="text-[9px] font-mono text-zinc-500 font-bold uppercase block tracking-wider">OPEN CONDUITS</span>
              <span className="text-2xl font-bold font-mono tracking-tight text-white mt-1 block select-all">
                {tickets.filter(t => t.status !== 'resolved').length}
              </span>
              <span className={`text-[8.5px] font-mono block mt-1 tracking-tighter ${
                tickets.filter(t => t.status !== 'resolved').length > 0 ? 'text-amber-400 font-bold' : 'text-cyan-400'
              }`}>
                {tickets.filter(t => t.status !== 'resolved').length > 0 ? 'F.R.I.D.A.Y TASK PENDING' : 'CHANNELS STABLE'}
              </span>
            </div>
            <div className={`p-2 rounded-lg border group-hover:scale-110 transition-transform ${
              tickets.filter(t => t.status !== 'resolved').length > 0
                ? 'bg-amber-950/30 border-amber-500/30 text-amber-400'
                : 'bg-cyan-950/40 border-cyan-500/20 text-cyan-400'
            }`}>
              <Cpu className="w-5 h-5" />
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.25 }}
            className="p-4 rounded-xl bg-zinc-950/80 border border-orange-500/20 hover:border-orange-400/50 shadow-[0_0_15px_rgba(249,115,22,0.06)] hover:shadow-[0_0_20px_rgba(249,115,22,0.12)] transition-all flex items-center justify-between gap-3 relative overflow-hidden group sm:col-span-2 lg:col-span-1"
          >
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-orange-400/65"></div>
            <div>
              <span className="text-[9px] font-mono text-zinc-500 font-bold uppercase block tracking-wider">SEALED SNAPSHOTS</span>
              <span className="text-2xl font-bold font-mono tracking-tight text-white mt-1 block select-all">{backups.length}</span>
              <span className="text-[8.5px] font-mono text-orange-400 block mt-1 tracking-tighter">
                AES-GCM ENCRYPTED
              </span>
            </div>
            <div className="p-2 bg-orange-950/40 rounded-lg border border-orange-500/20 text-orange-400 group-hover:scale-110 transition-transform">
              <Database className="w-5 h-5" />
            </div>
          </motion.div>
        </div>

        {/* Horizontal glowing navigator tab controls */}
        <div className="flex flex-wrap gap-2 border-b border-cyan-500/10 pb-4">
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`px-4 py-2 text-xs font-mono font-bold tracking-widest rounded-lg border transition-all flex items-center gap-2 ${
              activeTab === 'telemetry'
                ? 'bg-cyan-950/40 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                : 'bg-zinc-950/40 border-zinc-850 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
            }`}
          >
            <Server className="w-4 h-4" />
            COGNITIVE DIAGNOSTICS & BACKUPS
          </button>
          
          <button
            onClick={() => setActiveTab('roles')}
            className={`px-4 py-2 text-xs font-mono font-bold tracking-widest rounded-lg border transition-all flex items-center gap-2 ${
              activeTab === 'roles'
                ? 'bg-cyan-950/40 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                : 'bg-zinc-950/40 border-zinc-850 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
            }`}
          >
            <Sliders className="w-4 h-4" />
            CLEARANCES & ROLE DEPLOY
          </button>
          
          <button
            onClick={() => setActiveTab('moderation')}
            className={`px-4 py-2 text-xs font-mono font-bold tracking-widest rounded-lg border transition-all flex items-center gap-2 ${
              activeTab === 'moderation'
                ? 'bg-cyan-950/40 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                : 'bg-zinc-950/40 border-zinc-850 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
            }`}
          >
            <Unlock className="w-4 h-4" />
            CITIZENS SECURITY PROFILE
          </button>
          
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 text-xs font-mono font-bold tracking-widest rounded-lg border transition-all flex items-center gap-2 ${
              activeTab === 'logs'
                ? 'bg-cyan-950/40 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                : 'bg-zinc-950/40 border-zinc-850 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
            }`}
          >
            <Terminal className="w-4 h-4" />
            SECURITY AUDIT STREAM
          </button>
          
          <button
            onClick={() => setActiveTab('friday')}
            className={`px-4 py-2 text-xs font-mono font-bold tracking-widest rounded-lg border transition-all flex items-center gap-2 ${
              activeTab === 'friday'
                ? 'bg-cyan-950/40 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                : 'bg-zinc-950/40 border-zinc-850 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
            }`}
          >
            <Bot className="w-4 h-4 animate-pulse text-cyan-400" />
            F.R.I.D.A.Y COGNITION TICKETS
          </button>
        </div>

        {/* Dynamic workspace containers tab content */}
        <div className="flex-1 flex flex-col gap-6">
          {activeTab === 'telemetry' && (
            <div className="flex flex-col gap-6 animate-fade-in">
              {/* Core HUD Diagnostics display */}
              {diagnostic && <HudDisplay diagnostic={diagnostic} />}
              
              {/* Backups module block */}
              <BackupModule backups={backups} onCreateBackup={handleCreateEncryptedBackup} />
            </div>
          )}

          {activeTab === 'roles' && (
            <div className="animate-fade-in">
              <RolesManager 
                roles={roles} 
                onCreateRole={handleCreateRole}
                onUpdateRole={handleUpdateRole}
                onDeleteRole={handleDeleteRole}
              />
            </div>
          )}

          {activeTab === 'moderation' && (
            <div className="animate-fade-in">
              <ModerationPanel 
                members={members}
                roles={roles}
                onUpdateMember={handleUpdateMember}
                onRemoveMember={handleRemoveMember}
              />
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="animate-fade-in">
              <TerminalLog logs={logs} />
            </div>
          )}

          {activeTab === 'friday' && (
            <div className="animate-fade-in">
              <FridayConsole 
                tickets={tickets}
                onSubmitTicketReply={handleSubmitTicketReply}
                onCloseTicket={handleCloseTicket}
                onSynthesizeTicket={handleSynthesizeTicket}
              />
            </div>
          )}
        </div>
      </main>

      {/* System Footer Bar */}
      <footer className="relative z-10 border-t border-cyan-500/10 py-4 px-6 text-center text-[10px] text-zinc-650 font-mono tracking-widest uppercase">
        STARK COGNITIVE DIGITAL INFRASTRUCTURES. ENFORCED TO SHIELD-LEVEL CLEARANCE MEMR-5.
      </footer>
    </div>
  );
}
