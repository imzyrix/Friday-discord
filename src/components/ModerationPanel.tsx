import React, { useState } from 'react';
import { 
  ShieldAlert, 
  ShieldX, 
  VolumeX, 
  Volume2, 
  UserMinus, 
  Search, 
  Radio, 
  Clock, 
  HelpCircle,
  Check,
  X
} from 'lucide-react';
import { motion } from 'motion/react';
import { Member, Role } from '../types';
import ShinyText from './animations/ShinyText';
import LetterGlitch from './animations/LetterGlitch';

interface ModerationPanelProps {
  members: Member[];
  roles: Role[];
  onUpdateMember: (id: string, updates: Partial<Member>) => Promise<any>;
  onRemoveMember: (id: string, type: 'kick' | 'ban') => Promise<any>;
}

export default function ModerationPanel({ members = [], roles = [], onUpdateMember, onRemoveMember }: ModerationPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('');
  // State for administrative confirmation popovers
  const [confirmAction, setConfirmAction] = useState<{ memberId: string; type: 'kick' | 'ban' } | null>(null);

  const getStatusColor = (status: Member['status']) => {
    switch (status) {
      case 'online': return 'bg-emerald-400 shadow-[0_0_10px_#10b981] animate-pulse';
      case 'idle': return 'bg-amber-400 shadow-[0_0_10px_#f59e0b]';
      case 'dnd': return 'bg-red-500 shadow-[0_0_10px_#ef4444] animate-pulse';
      default: return 'bg-zinc-600';
    }
  };

  const getStatusText = (status: Member['status']) => {
    switch (status) {
      case 'online': return 'ONLINE';
      case 'idle': return 'IDLE SENSOR';
      case 'dnd': return 'DO NOT DISTURB';
      default: return 'LOST TELEMETRY (OFFLINE)';
    }
  };

  const filteredMembers = members.filter((member) => {
    const matchesSearch = member.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRoleFilter ? member.roles.includes(selectedRoleFilter) : true;
    return matchesSearch && matchesRole;
  });

  const handleIncrementWarning = (member: Member) => {
    const nextWarnings = Math.min(3, member.warnings + 1);
    const updates: Partial<Member> = { warnings: nextWarnings };
    if (nextWarnings === 3) {
      updates.isMuted = true;
    }
    onUpdateMember(member.id, updates);
  };

  const handleClearWarnings = (member: Member) => {
    onUpdateMember(member.id, { warnings: 0 });
  };

  const handleToggleMute = (member: Member) => {
    onUpdateMember(member.id, { isMuted: !member.isMuted });
  };

  const executeExpulsion = async (memberId: string, type: 'kick' | 'ban') => {
    try {
      await onRemoveMember(memberId, type);
    } catch (err) {
      console.error(err);
    } finally {
      setConfirmAction(null);
    }
  };

  return (
    <div id="moderation-panel" className="hud-panel p-6 rounded-2xl border-cyan-500/15 overflow-hidden">
      {/* Laser grid scanline overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0)_50%,rgba(0,245,255,0.01)_50%)] bg-[size:100%_4px] pointer-events-none opacity-40"></div>

      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6 z-10 relative">
        <div>
          <h2 className="text-sm font-bold text-white tracking-widest font-mono flex items-center gap-2">
            <span className="p-1 px-2 text-[10px] font-mono font-bold uppercase rounded bg-red-950/50 text-red-400 border border-red-500/15 animate-hud-blink-red">DANGER SECTION</span>
            <LetterGlitch text="CITIZEN CONTAINMENT CONSOLE" speed={45} glitchTrigger="hover" className="cursor-pointer font-bold text-glow-red" />
          </h2>
          <p className="text-[10px] text-zinc-500 font-mono mt-1 uppercase tracking-wide">
            <ShinyText text="Monitor active clearance operators, verify presence, and deploy sector quarantine parameters." speed={9} />
          </p>
        </div>

        {/* Search and filter controls */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto font-mono text-xs">
          <div className="relative flex-1 sm:flex-none">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="SEARCH BY OPERATIVE..."
              className="w-full sm:w-56 bg-zinc-950/70 border border-cyan-500/15 pl-9 pr-3 py-2 rounded-lg text-white focus:outline-none focus:border-cyan-400/50 text-xs placeholder-zinc-600 font-mono uppercase tracking-wider"
            />
          </div>

          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="bg-zinc-950 border border-cyan-500/15 px-3 py-2 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-cyan-400/50 cursor-pointer uppercase tracking-wider"
          >
            <option value="">ALL CLEARANCES</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>{r.name.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </div>

      {/* OPERATIVES CARD GRID DESIGN */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMembers.map((member) => {
          const memberRoles = roles.filter((r) => member.roles.includes(r.id));
          const isQuarantined = member.warnings >= 3 || member.isMuted;
          const isConfirming = confirmAction?.memberId === member.id;

          // Format beautiful sector join timestamp
          const sectorJoinedDate = member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : 'VERIFY_FAIL';

          return (
            <motion.div
              layout
              key={member.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className={`relative p-5 border rounded-xl overflow-hidden backdrop-blur-md transition-all duration-300 flex flex-col justify-between ${
                isQuarantined
                  ? 'bg-red-950/10 border-red-500/30 shadow-[0_0_15px_rgba(248,113,113,0.1)_inset]'
                  : 'bg-zinc-950/40 border-cyan-500/15 hover:border-cyan-400/35 hover:shadow-[0_0_15px_rgba(0,245,255,0.05)_inset]'
              }`}
            >
              {/* Left indicator glowing bar */}
              <div className={`absolute top-0 left-0 w-[4px] h-full ${
                isQuarantined ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)]' : 'bg-cyan-500/30'
              }`} />

              {/* CARD IDENTITY HEADER */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-cyan-500/5">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={member.avatar}
                      alt={member.username}
                      referrerPolicy="no-referrer"
                      className="w-11 h-11 rounded-lg border border-cyan-500/20 object-cover bg-zinc-900"
                    />
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-zinc-950 ${getStatusColor(member.status)}`} />
                  </div>

                  <div className="font-mono">
                    <div className="flex items-center gap-1">
                      <span className="text-white font-bold text-xs">@{member.username}</span>
                      <span className="text-zinc-600 text-[9px]">#{member.discriminator}</span>
                    </div>
                    {member.customStatus ? (
                      <span className="text-[9px] text-zinc-500 truncate max-w-[140px] block mt-0.5" title={member.customStatus}>
                        "{member.customStatus}"
                      </span>
                    ) : (
                      <span className="text-[8px] text-zinc-650 block mt-0.5 uppercase tracking-wider">SEC_CHANNEL: ACTIVE</span>
                    )}
                  </div>
                </div>

                {/* Warning Counter and Mute state Badges */}
                <div className="flex flex-col items-end gap-1 font-mono">
                  {member.warnings > 0 && (
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-bold border border-red-500/30 text-red-400 bg-red-950/30 animate-pulse">
                      WARN {member.warnings}/3
                    </span>
                  )}
                  {member.isMuted && (
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-bold border border-orange-500/30 text-orange-400 bg-orange-950/30">
                      QUARANTINE
                    </span>
                  )}
                </div>
              </div>

              {/* ROLE CLEARANCES BADGE CONTAINER */}
              <div className="my-4 font-mono text-left">
                <div className="text-[8px] text-zinc-650 font-bold uppercase tracking-wider mb-1.5">SEC clearance profile:</div>
                <div className="flex flex-wrap gap-1.5 h-10 overflow-y-auto custom-terminal-scroll pr-1">
                  {memberRoles.map((r) => (
                    <span 
                      key={r.id} 
                      className="px-2 py-0.5 rounded text-[8px] font-semibold border uppercase leading-tight"
                      style={{ 
                        color: r.color, 
                        borderColor: `${r.color}33`, 
                        backgroundColor: `${r.color}11` 
                      }}
                    >
                      {r.name.split(' (')[0]}
                    </span>
                  ))}
                  {memberRoles.length === 0 && (
                    <span className="text-zinc-650 text-[9px] uppercase tracking-widest font-semibold">GUEST ACCESS LEVEL</span>
                  )}
                </div>
              </div>

              {/* METADATA LAST SEEN & RECON TIMESTAMPS */}
              <div className="bg-zinc-950/50 border border-cyan-500/5 p-2 rounded-lg mb-4 font-mono text-[9px] space-y-1 text-left">
                <div className="flex justify-between items-center text-zinc-500">
                  <span className="flex items-center gap-1 uppercase">
                    <Radio className="w-3 h-3 text-cyan-400/60" />
                    SIGNAL STATS:
                  </span>
                  <span className={member.status !== 'offline' ? 'text-emerald-400 font-bold' : 'text-zinc-650'}>
                    {getStatusText(member.status)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-zinc-500">
                  <span className="flex items-center gap-1 uppercase">
                    <Clock className="w-3 h-3 text-cyan-400/60" />
                    SECTOR ENTRY:
                  </span>
                  <span className="text-zinc-400">{sectorJoinedDate}</span>
                </div>
              </div>

              {/* ACTIONS WORKFLOW BLOCK AND DOUBLE ACTION CONFIRMATIONS */}
              <div className="mt-auto font-mono text-[9px]">
                {isConfirming ? (
                  /* Confirmatory tactical buttons in high-frequency danger states */
                  <div className="p-2 border border-red-500/30 bg-red-950/15 rounded-lg flex flex-col items-center justify-center gap-2 animate-pulse text-center">
                    <div className="font-bold text-red-400 flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5" />
                      CONFIRM {confirmAction.type.toUpperCase()} PROTOCOL?
                    </div>
                    <div className="flex gap-2 w-full mt-1">
                      <button
                        onClick={() => executeExpulsion(member.id, confirmAction.type)}
                        className="flex-1 py-1.5 bg-red-600 border border-red-500 text-white font-bold rounded hover:bg-red-700 transition-colors uppercase cursor-pointer flex items-center justify-center gap-1 text-[8.5px]"
                      >
                        <Check className="w-3 h-3" />
                        CONFIRM
                      </button>
                      <button
                        onClick={() => setConfirmAction(null)}
                        className="flex-1 py-1.5 bg-zinc-900 border border-cyan-500/20 text-zinc-400 font-bold rounded hover:text-white transition-colors uppercase cursor-pointer flex items-center justify-center gap-1 text-[8.5px]"
                      >
                        <X className="w-3 h-3" />
                        ABORT
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Primary tactical dials and switches */
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      {/* Mute and warning adjustments */}
                      <button
                        onClick={() => handleToggleMute(member)}
                        className={`flex-1 py-1.5 rounded border font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                          member.isMuted
                            ? 'bg-red-950/30 border-red-500/40 text-red-400'
                            : 'bg-zinc-950 border border-cyan-500/10 text-zinc-400 hover:border-cyan-400/30 hover:text-white'
                        }`}
                      >
                        {member.isMuted ? (
                          <>
                            <VolumeX className="w-3.5 h-3.5 text-red-400" />
                            UNMUTE
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5 text-cyan-400/85" />
                            QUARANTINE
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleIncrementWarning(member)}
                        disabled={member.warnings >= 3}
                        className="flex-1 py-1.5 bg-zinc-950 border border-yellow-500/15 text-yellow-500 hover:bg-yellow-950/20 hover:border-yellow-400/40 disabled:border-zinc-900 disabled:text-zinc-700 disabled:bg-transparent rounded flex items-center justify-center gap-1 transition-all cursor-pointer font-bold"
                        title="Issue warning strike to user log"
                      >
                        <ShieldAlert className="w-3.5 h-3.5 text-yellow-500/80" />
                        WARN (+1)
                      </button>

                      {member.warnings > 0 && (
                        <button
                          onClick={() => handleClearWarnings(member)}
                          className="px-2 py-1.5 bg-zinc-950 border border-emerald-500/15 text-emerald-400 hover:bg-emerald-950/20 hover:border-emerald-400/40 rounded flex items-center justify-center transition-colors cursor-pointer font-bold"
                          title="Reset warnings to zero"
                        >
                          RESET
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-cyan-500/5">
                      {/* Expulsion tactical switches with safety steps */}
                      <button
                        onClick={() => setConfirmAction({ memberId: member.id, type: 'kick' })}
                        className="py-1 bg-transparent border border-orange-500/25 text-orange-400 hover:bg-orange-950/15 hover:border-orange-400/45 rounded flex items-center justify-center gap-1 transition-colors cursor-pointer font-bold text-[8.5px] uppercase"
                      >
                        <UserMinus className="w-3 h-3 text-orange-500/80" />
                        KICK PROTOCOL
                      </button>
                      <button
                        onClick={() => setConfirmAction({ memberId: member.id, type: 'ban' })}
                        className="py-1 bg-transparent border border-red-500/25 text-red-500 hover:bg-red-950/15 hover:border-red-400/45 rounded flex items-center justify-center gap-1 transition-colors cursor-pointer font-bold text-[8.5px] uppercase shadow-[0_0_4px_rgba(239,68,68,0.05)]"
                      >
                        <ShieldX className="w-3 h-3 text-red-500/80" />
                        BAN PROTOCOL
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}

        {filteredMembers.length === 0 && (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 py-16 text-center text-zinc-650 font-mono text-[10px] uppercase tracking-wider animate-pulse border border-dashed border-cyan-500/10 rounded-xl">
            No secure citizen telemetry lines resolved for this index filter search.
          </div>
        )}
      </div>
    </div>
  );
}
