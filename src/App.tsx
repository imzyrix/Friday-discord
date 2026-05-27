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
  AlertTriangle,
  Radio,
  Eye,
  Menu,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Subcomponents
import HudDisplay from './components/HudDisplay';
import BackupModule from './components/BackupModule';
import RolesManager from './components/RolesManager';
import ModerationPanel from './components/ModerationPanel';
import TerminalLog from './components/TerminalLog';
import FridayConsole from './components/FridayConsole';

// React Bits animations
import ShinyText from './components/animations/ShinyText';
import SplitText from './components/animations/SplitText';
import SpotlightCard from './components/animations/SpotlightCard';
import LetterGlitch from './components/animations/LetterGlitch';

// Shared Types
import { Role, Member, AuditLog, SupportTicket, BackupRecord, BotDiagnostic } from './types';

interface LiveFeedEvent {
  id: string;
  timestamp: string;
  username: string;
  action: string;
  type: 'join' | 'leave' | 'status' | 'voice' | 'role_update';
}

// Performant digital counting ticker for bento kpi cards
function ActiveKpiCounter({ value, duration = 800 }: { value: number; duration?: number }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCurrent(Math.floor(progress * value));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCurrent(value);
      }
    };
    window.requestAnimationFrame(step);
  }, [value, duration]);

  return <span>{current}</span>;
}

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
  const [discordBotActive, setDiscordBotActive] = useState<boolean>(false);
  const [systemTime, setSystemTime] = useState<string>('');

  // Tab View Controller (Expanded with 6th tab: 'livefeed')
  const [activeTab, setActiveTab] = useState<'telemetry' | 'roles' | 'moderation' | 'logs' | 'friday' | 'livefeed'>('telemetry');

  // Sidebar Layout Control
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Real-time Presence Event Log Feed state
  const [liveFeed, setLiveFeed] = useState<LiveFeedEvent[]>([]);

  // Session Profile State (Initially TonyStark backup, then bound dynamically to authenticated Admin Discord user)
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

  // Map AuditLog items into Live Feed records
  const mapAuditToFeedEvent = (log: AuditLog): LiveFeedEvent => {
    let type: 'join' | 'leave' | 'status' | 'voice' | 'role_update' = 'status';
    const actionLower = log.action.toLowerCase();
    
    if (actionLower.includes('joined') || actionLower.includes('welcome')) {
      type = 'join';
    } else if (actionLower.includes('left') || actionLower.includes('kicked') || actionLower.includes('banned') || actionLower.includes('purged')) {
      type = 'leave';
    } else if (actionLower.includes('role') || actionLower.includes('clearance')) {
      type = 'role_update';
    } else if (actionLower.includes('voice') || actionLower.includes('speak') || actionLower.includes('mic')) {
      type = 'voice';
    }

    return {
      id: log.id,
      timestamp: log.timestamp,
      username: log.target || log.executor || 'system',
      action: log.action,
      type
    };
  };

  // Sync Feed Event lists when logs get synchronized
  useEffect(() => {
    if (logs && logs.length > 0) {
      // Pull and map 12 recent security actions for the feed
      const mapped = logs
        .filter(l => ['moderation', 'role', 'security', 'bot'].includes(l.category))
        .map(mapAuditToFeedEvent);
      setLiveFeed(mapped);
    }
  }, [logs]);

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
        // Attempt reconnections after a delay
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
              setDiscordBotActive(!!payload.discordBotActive);
              if (payload.adminUser) {
                setSessionUser({
                  username: payload.adminUser.username || 'TonyStark',
                  discriminator: payload.adminUser.discriminator || '0001',
                  role: 'Stark Administrator',
                  avatar: payload.adminUser.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces'
                });
              }
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

  // Helper calculation details for header stat pills
  const totalCitizens = members.length;
  const onlineCitizens = members.filter(m => m.status !== 'offline').length;

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans flex flex-col relative overflow-x-hidden select-none selection:bg-cyan-950 selection:text-cyan-300">
      
      {/* Background cyberpunk holographic scanlines overlay */}
      <div className="absolute inset-0 bg-radial-grid pointer-events-none z-0"></div>

      {/* HEADER SECTION LOGO */}
      <header className="relative z-20 border-b border-cyan-500/15 bg-zinc-950/85 backdrop-blur-md px-6 py-4 flex flex-col xl:flex-row items-center justify-between gap-4">
        
        {/* Title branding logo */}
        <div className="flex items-center justify-between xl:justify-start w-full xl:w-auto gap-3">
          <div className="flex items-center gap-3">
            {/* Sidebar toggle controller for portable widths */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 px-2 rounded border border-cyan-500/15 hover:border-cyan-400 text-cyan-400 bg-cyan-950/20 mr-1 cursor-pointer transition-colors"
              title="Toggle Tactical Radar Nav"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500/35 shadow-[0_0_15px_rgba(0,245,255,0.25)]">
              <Shield className="w-5 h-5 text-cyan-400 transform -rotate-12 animate-pulse" />
            </div>
            
            <div className="text-left">
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-extrabold tracking-widest font-mono text-white text-glow-cyan">
                  <LetterGlitch text="F.R.I.D.A.Y. HUD INFRASTRUCTURE" speed={45} glitchTrigger="hover" className="cursor-pointer" />
                </h1>
                <span className="text-[8px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-500/30 px-1.5 py-0.2 rounded font-bold uppercase tracking-wider">v4.2.0</span>
              </div>
              <p className="text-[9px] text-zinc-500 font-mono tracking-wider uppercase">
                <ShinyText text="STARK BROADCAST SECTOR DEPLOYMENT" speed={6} />
              </p>
            </div>
          </div>

          {/* Member stats pills in responsive widths */}
          <div className="flex xl:hidden items-center gap-2 font-mono text-[9px] text-zinc-400">
            <span className="px-1.5 py-0.5 border border-cyan-500/15 bg-zinc-950 rounded">
              CIT: <span className="text-white font-bold">{totalCitizens}</span>
            </span>
            <span className="px-1.5 py-0.5 border border-emerald-500/15 bg-zinc-950 rounded">
              ON: <span className="text-emerald-400 font-bold">{onlineCitizens}</span>
            </span>
          </div>
        </div>

        {/* Real-time status indicators stat pills */}
        <div className="flex flex-wrap items-center justify-center xl:justify-end gap-3.5 text-xs font-mono w-full xl:w-auto">
          
          {/* Reactive Discord Bot Active connection label */}
          <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900/60 border border-cyan-500/10 rounded-lg">
            <span className={`w-2 h-2 rounded-full ${discordBotActive ? 'bg-emerald-400 animate-hud-blink' : 'bg-red-500 animate-pulse'}`} />
            <span className={`text-[9.5px] uppercase tracking-wider font-bold ${discordBotActive ? 'text-emerald-400' : 'text-red-400'}`}>
              {discordBotActive ? '● DISCORD UPLINK ACTIVE' : '● OFFLINE LOCAL SIMULATOR'}
            </span>
          </div>

          {/* Member Telemetry counter capsules */}
          <div className="hidden xl:flex items-center gap-2">
            <div className="px-3 py-1 bg-zinc-900/60 border border-cyan-500/10 rounded-lg flex items-center gap-1.5 text-[10px] text-zinc-400 uppercase tracking-wider">
              <span>MEMS:</span>
              <span className="text-white font-bold text-glow-cyan text-xs">{totalCitizens}</span>
            </div>
            <div className="px-3 py-1 bg-zinc-900/60 border border-cyan-500/10 rounded-lg flex items-center gap-1.5 text-[10px] text-zinc-400 uppercase tracking-wider">
              <span>ONLINE:</span>
              <span className="text-emerald-400 font-bold text-glow-cyan text-xs">{onlineCitizens}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900/60 border border-cyan-500/10 rounded-lg">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-zinc-300 font-medium font-mono text-[10px] tracking-widest tabular-nums">{systemTime}</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900/60 border border-cyan-500/10 rounded-lg">
            <span className={`w-1.5 h-1.5 rounded-full ${
              syncStatus === 'synchronized'
                ? 'bg-cyan-400 animate-pulse-fast'
                : syncStatus === 'connecting'
                ? 'bg-yellow-400 animate-ping'
                : 'bg-red-500'
            }`} />
            <span className="text-zinc-400 uppercase tracking-widest text-[9px] font-bold">
              {syncStatus === 'synchronized' ? 'DYNAMIC STAGE: LOCKED' : syncStatus === 'connecting' ? 'SYNCING MATRIX...' : 'DISCONNECTED'}
            </span>
          </div>

          {/* Bound Admin session widget */}
          <div className="flex items-center gap-2 px-3 py-0.5 rounded-lg bg-cyan-950/20 border border-cyan-500/15">
            <img 
              src={sessionUser.avatar} 
              alt={sessionUser.username}
              referrerPolicy="no-referrer"
              className="w-7 h-7 rounded border border-cyan-400/40 object-cover bg-zinc-900" 
            />
            <div className="text-left leading-tight hidden md:block select-text">
              <div className="font-extrabold text-white text-[10px] tracking-wider">@{sessionUser.username}</div>
              <div className="text-[8px] text-cyan-400 font-bold tracking-widest uppercase">{sessionUser.role}</div>
            </div>
          </div>
        </div>
      </header>

      {/* CORE 2-COLUMN STRUCTURE: SIDEBAR RAIL + ACTIVE PANEL */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col lg:flex-row relative z-10 p-6 gap-6">

        {/* PROMINENT TACTICAL SIDEBAR */}
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 256, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="w-full lg:w-64 shrink-0 flex flex-col gap-4 relative font-mono text-xs overflow-hidden"
            >
              <div className="hud-panel p-4 flex flex-col gap-1.5 border-cyan-500/15 bg-zinc-950/95 rounded-2xl relative h-full">
                {/* Visual scanline border decor */}
                <div className="absolute inset-x-0 top-0 h-[2.5px] bg-cyan-500/50 shadow-[0_0_8px_rgba(0,245,255,0.5)]"></div>
                
                <div className="flex items-center justify-between pb-2 border-b border-cyan-500/10 mb-2">
                  <span className="text-[9px] font-extrabold text-cyan-400 uppercase tracking-widest">TACTICAL BEACON NAV</span>
                  <button 
                    onClick={() => setSidebarOpen(false)}
                    className="p-0.5 rounded hover:bg-cyan-950/50 border border-transparent hover:border-cyan-500/25 cursor-pointer text-zinc-500 hover:text-cyan-400"
                    title="Collapse Sidebar"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Sidebar Navigation Buttons */}
                <div className="flex flex-col gap-1.5 flex-1">
                  
                  <button
                    onClick={() => setActiveTab('telemetry')}
                    className={`w-full px-3 py-2.5 rounded-lg border text-left font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 text-[10px] ${
                      activeTab === 'telemetry'
                        ? 'bg-cyan-950/30 border-cyan-400/80 text-cyan-300 shadow-[0_0_12px_rgba(0,245,255,0.1)_inset] border-l-4 border-l-cyan-400'
                        : 'bg-zinc-950/40 border-cyan-500/5 text-zinc-500 hover:text-zinc-200 hover:border-cyan-500/20'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Server className="w-4 h-4 shrink-0 text-cyan-400/85" />
                      COGNITIVE RADAR
                    </span>
                    <span className="text-[7.5px] font-extrabold text-zinc-600 bg-zinc-900 border border-cyan-500/5 px-1 rounded">SYS_A</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('roles')}
                    className={`w-full px-3 py-2.5 rounded-lg border text-left font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 text-[10px] ${
                      activeTab === 'roles'
                        ? 'bg-cyan-950/30 border-cyan-400/80 text-cyan-300 shadow-[0_0_12px_rgba(0,245,255,0.1)_inset] border-l-4 border-l-cyan-400'
                        : 'bg-zinc-950/40 border-cyan-500/5 text-zinc-500 hover:text-zinc-200 hover:border-cyan-500/20'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 shrink-0 text-cyan-400/85" />
                      CLEARANCES
                    </span>
                    <span className="text-[7.5px] font-extrabold text-zinc-600 bg-zinc-900 border border-cyan-500/5 px-1 rounded">SYS_B</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('moderation')}
                    className={`w-full px-3 py-2.5 rounded-lg border text-left font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 text-[10px] ${
                      activeTab === 'moderation'
                        ? 'bg-cyan-950/30 border-cyan-400/80 text-cyan-300 shadow-[0_0_12px_rgba(0,245,255,0.1)_inset] border-l-4 border-l-cyan-400'
                        : 'bg-zinc-950/40 border-cyan-500/5 text-zinc-500 hover:text-zinc-200 hover:border-cyan-500/20'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Unlock className="w-4 h-4 shrink-0 text-cyan-400/85" />
                      CONTAINMENT
                    </span>
                    <span className="text-[7.5px] font-extrabold text-zinc-600 bg-zinc-900 border border-cyan-500/5 px-1 rounded">SYS_C</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('logs')}
                    className={`w-full px-3 py-2.5 rounded-lg border text-left font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 text-[10px] ${
                      activeTab === 'logs'
                        ? 'bg-cyan-950/30 border-cyan-400/80 text-cyan-300 shadow-[0_0_12px_rgba(0,245,255,0.1)_inset] border-l-4 border-l-cyan-400'
                        : 'bg-zinc-950/40 border-cyan-500/5 text-zinc-500 hover:text-zinc-200 hover:border-cyan-500/20'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 shrink-0 text-cyan-400/85" />
                      SECURITY STREAM
                    </span>
                    <span className="text-[7.5px] font-extrabold text-zinc-600 bg-zinc-900 border border-cyan-500/5 px-1 rounded">SYS_D</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('friday')}
                    className={`w-full px-3 py-2.5 rounded-lg border text-left font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 text-[10px] ${
                      activeTab === 'friday'
                        ? 'bg-cyan-950/30 border-cyan-400/80 text-cyan-300 shadow-[0_0_12px_rgba(0,245,255,0.1)_inset] border-l-4 border-l-cyan-400'
                        : 'bg-zinc-950/40 border-cyan-500/5 text-zinc-500 hover:text-zinc-200 hover:border-cyan-500/20'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Bot className="w-4 h-4 shrink-0 animate-pulse text-cyan-400" />
                      COGNITION PEND
                    </span>
                    <span className="text-[7.5px] font-extrabold text-zinc-600 bg-zinc-900 border border-cyan-500/5 px-1 rounded">SYS_E</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('livefeed')}
                    className={`w-full px-3 py-2.5 rounded-lg border text-left font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 text-[10px] ${
                      activeTab === 'livefeed'
                        ? 'bg-cyan-950/30 border-cyan-400/80 text-cyan-300 shadow-[0_0_12px_rgba(0,245,255,0.1)_inset] border-l-4 border-l-cyan-400'
                        : 'bg-zinc-950/40 border-cyan-500/5 text-zinc-500 hover:text-zinc-200 hover:border-cyan-500/20'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Eye className="w-4 h-4 shrink-0 text-cyan-400/85" />
                      LIVE SECURE FEED
                    </span>
                    <span className="text-[7.5px] font-extrabold text-zinc-600 bg-zinc-900 border border-cyan-500/5 px-1 rounded animate-pulse">LIVE</span>
                  </button>

                </div>

                {/* Sidebar Tactical Micro Summary info */}
                <div className="pt-3 border-t border-cyan-500/10 text-left text-[9px] text-zinc-600 flex flex-col gap-1 mt-auto">
                  <div>SECTOR_UPLINK: LOCK_D</div>
                  <div>SECURE SHIELD MATRIX</div>
                  <div className="text-cyan-400/70 font-semibold uppercase animate-pulse">TELEMETRY STEADY</div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* MAIN BODY INTERFACES PANEL */}
        <div className="flex-1 flex flex-col gap-6 select-none">
          
          {/* Quick Stats Bento Grid (Animated and Counting up smoothly!) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 relative z-10">
            {/* CARD 1: CITIZENS */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="h-full"
            >
              <LightweightBentoKpi
                title="TOTAL CITIZENS"
                value={<ActiveKpiCounter value={totalCitizens} />}
                metricLabel={`${members.filter(m => m.status !== 'offline').length} ACTIVE RADAR`}
                icon={<Users className="w-5 h-5 text-cyan-400" />}
                topBorderColor="bg-cyan-400"
              />
            </motion.div>

            {/* CARD 2: ROLES */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="h-full"
            >
              <LightweightBentoKpi
                title="CLEARANCE ROLES"
                value={<ActiveKpiCounter value={roles.length} />}
                metricLabel={`${roles.filter(r => r.hoist).length} HOIST LEVEL`}
                icon={<Shield className="w-5 h-5 text-cyan-400" />}
                topBorderColor="bg-cyan-400"
              />
            </motion.div>

            {/* CARD 3: THREAT LEVEL */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="h-full"
            >
              {(() => {
                const warnsTotal = members.reduce((sum, m) => sum + m.warnings, 0);
                const isUnderAlert = warnsTotal > 0;
                return (
                  <LightweightBentoKpi
                    title="THREAT LEVEL"
                    value={<ActiveKpiCounter value={warnsTotal} />}
                    valueClassName={isUnderAlert ? 'text-red-400 font-extrabold text-glow-red' : 'text-white'}
                    metricLabel={isUnderAlert ? 'ATTENTION REQUIRED' : 'GRID STATE: SECURE'}
                    metricLabelClassName={isUnderAlert ? 'text-red-400 animate-pulse font-bold' : 'text-emerald-400'}
                    icon={<AlertTriangle className={isUnderAlert ? 'w-5 h-5 text-red-500 animate-pulse' : 'w-5 h-5 text-cyan-400'} />}
                    topBorderColor={isUnderAlert ? 'bg-red-500 animate-pulse' : 'bg-cyan-400'}
                  />
                );
              })()}
            </motion.div>

            {/* CARD 4: FAULTS */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="h-full"
            >
              {(() => {
                const activeTicks = tickets.filter(t => t.status !== 'resolved').length;
                const isFaultPending = activeTicks > 0;
                return (
                  <LightweightBentoKpi
                    title="OPEN FAULTS"
                    value={<ActiveKpiCounter value={activeTicks} />}
                    metricLabel={isFaultPending ? 'F.R.I.D.A.Y FAULT PROCESS' : 'CHANNELS STABLE'}
                    metricLabelClassName={isFaultPending ? 'text-amber-400 font-bold' : 'text-cyan-400'}
                    icon={<Cpu className={isFaultPending ? 'w-5 h-5 text-amber-400 animate-pulse' : 'w-5 h-5 text-cyan-400'} />}
                    topBorderColor={isFaultPending ? 'bg-amber-400' : 'bg-cyan-400'}
                  />
                );
              })()}
            </motion.div>

            {/* CARD 5: SNAPSHOTS */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.25 }}
              className="h-full"
            >
              <LightweightBentoKpi
                title="SEALED SNAPSHOTS"
                value={<ActiveKpiCounter value={backups.length} />}
                metricLabel="AES-GCM ARCHIVED"
                icon={<Database className="w-5 h-5 text-orange-400" />}
                topBorderColor="bg-orange-500"
              />
            </motion.div>
          </div>

          {/* DYNAMIC TAB CONTROLLERS SCREEN DISPATCH */}
          <div className="flex-1 flex flex-col gap-6 min-h-0 relative z-10 w-full">
            
            {activeTab === 'telemetry' && (
              <div className="flex flex-col gap-6 animate-fade-in relative z-10">
                {/* Canvas-based fully reactive Radar display column */}
                <HudDisplay 
                  diagnostic={diagnostic || {
                    uptime: 0,
                    latency: 0,
                    cpuUsage: 0,
                    memoryUsage: { heapUsed: 0, heapTotal: 0 },
                    shards: []
                  }} 
                  members={members} 
                  roles={roles} 
                  liveFeed={liveFeed}
                />
                
                {/* Backups module blocks */}
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

            {activeTab === 'livefeed' && (
              <div className="animate-fade-in">
                {/* Unified systems direct decrypters terminal log */}
                <LiveFeedScreen liveFeed={liveFeed} />
              </div>
            )}

          </div>

        </div>

      </div>

      {/* System Footer Bar */}
      <footer className="relative z-10 border-t border-cyan-500/10 py-5 px-6 text-center text-[10px] text-zinc-650 font-mono tracking-widest uppercase">
        STARK COGNITIVE DIGITAL TELEMETRY INFRASTRUCTURES. ENFORCED TO SHIELD-LEVEL CLEARANCE MEMR-5.
      </footer>
    </div>
  );
}

// Custom companion widget for modular bento counters
interface BentoKpiProps {
  title: string;
  value: React.ReactNode;
  valueClassName?: string;
  metricLabel: string;
  metricLabelClassName?: string;
  icon: React.ReactNode;
  topBorderColor: string;
}

function LightweightBentoKpi({
  title,
  value,
  valueClassName = 'text-white',
  metricLabel,
  metricLabelClassName = 'text-cyan-400',
  icon,
  topBorderColor
}: BentoKpiProps) {
  return (
    <SpotlightCard
      spotlightColor="rgba(0, 245, 255, 0.08)"
      className="p-4 rounded-xl bg-zinc-950/90 border border-cyan-500/15 hover:border-cyan-400/45 shadow-[0_0_12px_rgba(0,245,255,0.03)] flex items-center justify-between gap-3 relative overflow-hidden group h-full cursor-pointer select-none"
    >
      <div className={`absolute top-0 left-0 right-0 h-[2px] ${topBorderColor}`}></div>
      <div className="text-left font-mono">
        <span className="text-[8.5px] text-zinc-500 font-bold uppercase block tracking-wider">{title}</span>
        <span className={`text-2xl font-bold tracking-tight block mt-1 select-all ${valueClassName}`}>
          {value}
        </span>
        <span className={`text-[8.5px] block mt-1 tracking-tighter uppercase ${metricLabelClassName}`}>
          {metricLabel}
        </span>
      </div>
      <div className="p-2 bg-cyan-950/20 border border-cyan-500/10 rounded-lg group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
    </SpotlightCard>
  );
}

// 6th tab layout view component
function LiveFeedScreen({ liveFeed }: { liveFeed: LiveFeedEvent[] }) {
  return (
    <div className="hud-panel p-6 border-cyan-500/15 relative overflow-hidden flex flex-col gap-4">
      {/* CRT Grid line decorator */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0)_50%,rgba(0,245,255,0.01)_50%)] bg-[size:100%_4px] pointer-events-none opacity-40"></div>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-cyan-500/10 pb-4 z-10">
        <div>
          <h3 className="text-sm font-extrabold font-mono text-cyan-400 flex items-center gap-2 text-glow-cyan">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            STARK DEPLOY DECRYPTION DECODER PANEL
          </h3>
          <p className="text-[10px] text-zinc-500 font-mono mt-0.5 uppercase tracking-wide">
            REAL-TIME DECRYPTED INTERCEPT FEED STREAM OVER SECURE SSL CHANNELS
          </p>
        </div>
        <span className="text-[8.5px] font-mono text-cyan-400 animate-pulse bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/25">SIGNAL LOCK OUT</span>
      </div>

      <div className="bg-zinc-950/80 border border-cyan-500/10 rounded-xl p-4 font-mono text-[11px] leading-relaxed max-h-[500px] overflow-y-auto space-y-2.5 select-text custom-terminal-scroll z-10">
        {liveFeed.map((evt, index) => {
          let sideBorderCol = 'border-l-2 border-cyan-500';
          if (evt.type === 'join') sideBorderCol = 'border-l-2 border-emerald-400';
          else if (evt.type === 'leave') sideBorderCol = 'border-l-2 border-red-500';
          else if (evt.type === 'voice') sideBorderCol = 'border-l-2 border-amber-400';

          return (
            <motion.div 
              key={evt.id + '-' + index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`p-3 rounded border border-cyan-500/10 bg-zinc-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono hover:border-cyan-400/25 transition-all duration-300 ${sideBorderCol}`}
            >
              <div className="flex-1 text-left">
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                  <span>[{new Date(evt.timestamp).toLocaleString()}]</span>
                  <span className="uppercase font-bold text-cyan-400/80">CHANNEL_SIG</span>
                </div>
                <div className="text-white font-bold text-xs mt-1">
                  EVENT_M_0{index}: @{evt.username} ({evt.type.toUpperCase()})
                </div>
                <p className="text-zinc-400 mt-1 leading-normal text-[11px]">
                  {evt.action}
                </p>
              </div>
              <div className="px-2.5 py-1 bg-cyan-950/30 border border-cyan-500/20 text-cyan-400 font-extrabold rounded text-[8.5px] tracking-widest uppercase self-start sm:self-center">
                DEC_SUCCESS
              </div>
            </motion.div>
          );
        })}
        {liveFeed.length === 0 && (
          <div className="py-28 text-center text-zinc-600 uppercase font-mono text-[10.5px] tracking-widest select-none animate-pulse">
            Awaiting raw telemetry signals from Discord webhooks...
          </div>
        )}
      </div>
    </div>
  );
}
