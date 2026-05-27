import React, { useState } from 'react';
import { Shield, ShieldAlert, ShieldX, VolumeX, Volume2, UserX, Trash2, Search, UserMinus } from 'lucide-react';
import { Member, Role } from '../types';

import ShinyText from './animations/ShinyText';
import LetterGlitch from './animations/LetterGlitch';

interface ModerationPanelProps {
  members: Member[];
  roles: Role[];
  onUpdateMember: (id: string, updates: Partial<Member>) => Promise<any>;
  onRemoveMember: (id: string, type: 'kick' | 'ban') => Promise<any>;
}

export default function ModerationPanel({ members, roles, onUpdateMember, onRemoveMember }: ModerationPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('');

  const getStatusColor = (status: Member['status']) => {
    switch (status) {
      case 'online': return 'bg-emerald-400 shadow-[0_0_8px_#34d399]';
      case 'idle': return 'bg-amber-400 shadow-[0_0_8px_#fbbf24]';
      case 'dnd': return 'bg-red-500 shadow-[0_0_8px_#f87171]';
      default: return 'bg-zinc-600';
    }
  };

  const filteredMembers = members.filter((member) => {
    const matchesSearch = member.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRoleFilter ? member.roles.includes(selectedRoleFilter) : true;
    return matchesSearch && matchesRole;
  });

  const handleIncrementWarning = (member: Member) => {
    const nextWarnings = Math.min(3, member.warnings + 1);
    // If warning count hits 3, automatically trigger secure server mute as warning protocol
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

  return (
    <div id="moderation-panel" className="bg-zinc-950/80 border border-cyan-500/30 p-6 rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.15)] relative overflow-hidden">
      {/* Background raster scan overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0)_50%,rgba(6,182,212,0.01)_50%)] bg-[size:100%_4px] pointer-events-none opacity-40"></div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 z-10">
        <div>
          <h2 className="text-lg font-bold text-white tracking-wide font-sans flex items-center gap-2">
            <span className="p-1 px-2 text-xs font-mono font-bold uppercase rounded bg-red-950/50 text-red-400 border border-red-500/20">Quarantine</span>
            <LetterGlitch text="CITIZEN MODERATION TERMINAL" speed={45} glitchTrigger="hover" className="cursor-pointer" />
          </h2>
          <p className="text-xs text-zinc-400 font-mono mt-1">
            <ShinyText text="Conduct status audits, security briefings, and apply containment countermeasures." speed={9} />
          </p>
        </div>

        {/* Filters search */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto font-mono text-xs z-10">
          <div className="relative flex-1 md:flex-initial">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search citizens..."
              className="w-full md:w-48 bg-zinc-950 border border-cyan-500/20 pl-8 pr-3 py-2 rounded-lg text-white focus:outline-none focus:border-cyan-400/50 text-xs placeholder-zinc-600"
            />
          </div>

          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="bg-zinc-950 border border-cyan-500/20 px-3 py-2 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-cyan-400/50 cursor-pointer"
          >
            <option value="">All Clearances</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Members responsive view container */}
      <div className="z-10">
        {/* Desktop Table View */}
        <div className="hidden md:block border border-cyan-500/10 rounded-xl overflow-hidden bg-zinc-900/20">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-zinc-900/60 text-cyan-400/80 border-b border-cyan-500/10">
                <tr>
                  <th className="p-4">CITIZEN IDENTITY</th>
                  <th className="p-4">SERVER CLEARANCE</th>
                  <th className="p-4 text-center">WARNING LEVEL</th>
                  <th className="p-4">QUARANTINE (MUTED)</th>
                  <th className="p-4 text-right">SYSTEM EXPULSION PROTOCOL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-500/5">
                {filteredMembers.map((member) => {
                  const memberRoles = roles.filter((r) => member.roles.includes(r.id));
                  const isUnderExtremeThreat = member.warnings >= 3;

                  return (
                    <tr 
                      key={member.id} 
                      className={`hover:bg-cyan-500/[0.02] transition-colors ${
                        isUnderExtremeThreat ? 'bg-red-950/5 hover:bg-red-950/10' : ''
                      }`}
                    >
                      {/* Username & Connection Telemetry Status */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <img 
                              src={member.avatar} 
                              alt={member.username} 
                              referrerPolicy="no-referrer"
                              className="w-9 h-9 rounded-lg border border-cyan-500/20 object-cover" 
                            />
                            <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-zinc-950 ${getStatusColor(member.status)}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-1">
                              <span className="text-white font-semibold flex items-center gap-1">
                                {member.username}
                              </span>
                              <span className="text-zinc-500 text-[10px]">#{member.discriminator}</span>
                            </div>
                            {member.customStatus && (
                              <span className="text-[10px] text-zinc-500 truncate max-w-[180px] block" title={member.customStatus}>
                                "{member.customStatus}"
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Roles column */}
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {memberRoles.map((r) => (
                            <span 
                              key={r.id} 
                              className="px-2 py-0.5 rounded text-[9px] font-bold border"
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
                            <span className="text-zinc-650 text-[10px]">No clearance</span>
                          )}
                        </div>
                      </td>

                      {/* Warning Levels Count */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <div 
                              key={i} 
                              className={`w-2.5 h-2.5 rounded-full border ${
                                i < member.warnings 
                                  ? 'bg-red-500 border-red-400 shadow-[0_0_5px_rgba(239,68,68,0.7)]' 
                                  : 'bg-transparent border-zinc-800'
                              }`}
                            />
                          ))}
                          <span className="text-[10px] ml-2 text-zinc-500">({member.warnings}/3)</span>
                        </div>
                      </td>

                      {/* Toggle Silence block */}
                      <td className="p-4">
                        <button
                          onClick={() => handleToggleMute(member)}
                          className={`px-2.5 py-1 rounded text-[10px] border flex items-center gap-1.5 transition-all cursor-pointer ${
                            member.isMuted
                              ? 'bg-red-950/40 border-red-500/50 text-red-400'
                              : 'bg-transparent border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
                          }`}
                        >
                          {member.isMuted ? (
                            <>
                              <VolumeX className="w-3.5 h-3.5 text-red-400" />
                              MUTED
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5 text-zinc-400" />
                              VOCAL
                            </>
                          )}
                        </button>
                      </td>

                      {/* Expel Controls */}
                      <td className="p-4 text-right">
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => handleIncrementWarning(member)}
                            disabled={member.warnings >= 3}
                            className="px-2 py-1 bg-zinc-900 border border-yellow-500/20 text-yellow-500 hover:bg-yellow-950/20 disabled:border-zinc-850 disabled:text-zinc-750 disabled:bg-transparent rounded text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                            title="Register Warning Sector"
                          >
                            <ShieldAlert className="w-3 h-3" />
                            WARN
                          </button>

                          {member.warnings > 0 && (
                            <button
                              onClick={() => handleClearWarnings(member)}
                              className="px-2 py-1 bg-zinc-900 border border-emerald-500/20 text-emerald-500 hover:bg-emerald-950/20 rounded text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              CLEAR
                            </button>
                          )}

                          <button
                            onClick={() => onRemoveMember(member.id, 'kick')}
                            disabled={member.id === 'mem-4' || member.id === 'mem-1'}
                            className="px-2 py-1 bg-zinc-900 border border-orange-500/20 text-orange-400 hover:bg-orange-950/20 disabled:border-zinc-850 disabled:text-zinc-750 disabled:bg-transparent rounded text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                            title="Execute Kick Protocol"
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                            KICK
                          </button>

                          <button
                            onClick={() => onRemoveMember(member.id, 'ban')}
                            disabled={member.id === 'mem-4' || member.id === 'mem-1'}
                            className="px-2 py-1 bg-zinc-900 border border-red-500/20 hover:border-red-500/40 text-red-500 hover:bg-red-950/30 disabled:border-zinc-850 disabled:text-zinc-750 disabled:bg-transparent rounded text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
                            title="Execute Ban Action"
                          >
                            <ShieldX className="w-3.5 h-3.5" />
                            BAN
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile/Tablet Card Stack List View */}
        <div className="md:hidden space-y-4">
          {filteredMembers.map((member) => {
            const memberRoles = roles.filter((r) => member.roles.includes(r.id));
            const isUnderExtremeThreat = member.warnings >= 3;

            return (
              <div 
                key={member.id}
                className={`p-4 border rounded-xl flex flex-col gap-4 relative overflow-hidden transition-all ${
                  isUnderExtremeThreat 
                    ? 'bg-red-950/10 border-red-500/30 shadow-[0_0_12px_rgba(239,68,68,0.1)]' 
                    : 'bg-zinc-900/40 border-cyan-500/10 hover:border-cyan-500/20'
                }`}
              >
                {/* Visual Accent Overlay */}
                <div className={`absolute top-0 left-0 w-[3px] h-full ${
                  isUnderExtremeThreat ? 'bg-red-500' : 'bg-cyan-500/40'
                }`}></div>

                {/* Identity header & Mute toggle */}
                <div className="flex items-start justify-between gap-2 pl-2">
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <img 
                        src={member.avatar} 
                        alt={member.username} 
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-lg border border-cyan-500/20 object-cover" 
                      />
                      <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-zinc-950 ${getStatusColor(member.status)}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1 font-mono text-xs">
                        <span className="text-white font-bold">{member.username}</span>
                        <span className="text-zinc-500 text-[9px]">#{member.discriminator}</span>
                      </div>
                      {member.customStatus && (
                        <p className="text-[9.5px] text-zinc-500 font-mono mt-0.5 max-w-[160px] truncate">
                          "{member.customStatus}"
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleMute(member)}
                    className={`px-2 py-1 rounded text-[9px] font-mono border flex items-center gap-1 border-opacity-60 cursor-pointer ${
                      member.isMuted
                        ? 'bg-red-950/40 border-red-500/55 text-red-400 font-bold'
                        : 'bg-transparent border-zinc-800 text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {member.isMuted ? <VolumeX className="w-3 h-3 text-red-400" /> : <Volume2 className="w-3 h-3 text-zinc-500" />}
                    {member.isMuted ? 'MUTED' : 'VOCAL'}
                  </button>
                </div>

                {/* Clearances matrix */}
                <div className="pl-2 flex flex-wrap gap-1 font-mono items-center">
                  <span className="text-[9px] text-zinc-500 mr-1 uppercase">Clearance:</span>
                  {memberRoles.map((r) => (
                    <span 
                      key={r.id} 
                      className="px-1.5 py-0.2 rounded text-[8.5px] font-bold border"
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
                    <span className="text-zinc-650 text-[9.5px]">Unassigned clearance</span>
                  )}
                </div>

                {/* Warnings indicators */}
                <div className="pl-2 py-1 border-t border-b border-cyan-500/5 flex items-center justify-between font-mono text-[10px]">
                  <span className="text-zinc-500 uppercase">Warning Register:</span>
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-2 h-2 rounded-full border ${
                          i < member.warnings 
                            ? 'bg-red-500 border-red-400 shadow-[0_0_5px_rgba(239,68,68,0.7)]' 
                            : 'bg-transparent border-zinc-800'
                        }`}
                      />
                    ))}
                    <span className="text-zinc-400 font-semibold ml-1">({member.warnings}/3)</span>
                  </div>
                </div>

                {/* Action buttons with massive comfortable touching surface */}
                <div className="grid grid-cols-2 xs:flex xs:flex-wrap gap-2 pt-1 font-mono text-[10px]">
                  <button
                    onClick={() => handleIncrementWarning(member)}
                    disabled={member.warnings >= 3}
                    className="p-2 bg-zinc-950 border border-yellow-500/20 text-yellow-500 hover:bg-yellow-950/20 disabled:border-zinc-850 disabled:text-zinc-750 disabled:bg-transparent rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 inline" />
                    WARN
                  </button>

                  {member.warnings > 0 && (
                    <button
                      onClick={() => handleClearWarnings(member)}
                      className="p-2 bg-zinc-950 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-950/20 rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      CLEAR
                    </button>
                  )}

                  <button
                    onClick={() => onRemoveMember(member.id, 'kick')}
                    disabled={member.id === 'mem-4' || member.id === 'mem-1'}
                    className="p-2 bg-zinc-950 border border-orange-500/25 text-orange-400 hover:bg-orange-950/20 disabled:border-zinc-850 disabled:text-zinc-750 disabled:bg-transparent rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <UserMinus className="w-3.5 h-3.5 inline" />
                    KICK
                  </button>

                  <button
                    onClick={() => onRemoveMember(member.id, 'ban')}
                    disabled={member.id === 'mem-4' || member.id === 'mem-1'}
                    className="p-2 col-span-2 bg-zinc-950 border border-red-500/25 hover:border-red-400/50 text-red-400 hover:bg-red-950/30 disabled:border-zinc-850 disabled:text-zinc-750 disabled:bg-transparent rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer"
                  >
                    <ShieldX className="w-3.5 h-3.5 inline" />
                    BAN CITIZEN EXPULSION
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredMembers.length === 0 && (
          <div className="p-12 text-center text-zinc-500 font-mono text-xs">
            No citizens found matching active filters in the records stream.
          </div>
        )}
      </div>
    </div>
  );
}
