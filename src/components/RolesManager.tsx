import React, { useState } from 'react';
import { Shield, Plus, Trash2, Eye, Compass, Settings, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { Role } from '../types';

import ShinyText from './animations/ShinyText';
import LetterGlitch from './animations/LetterGlitch';

interface RolesManagerProps {
  roles: Role[];
  onCreateRole: (role: Partial<Role>) => Promise<any>;
  onUpdateRole: (id: string, updates: Partial<Role>) => Promise<any>;
  onDeleteRole: (id: string) => Promise<any>;
}

const DISCORD_PERMISSIONS = [
  'ADMINISTRATOR',
  'MANAGE_GUILD',
  'MANAGE_ROLES',
  'MANAGE_CHANNELS',
  'KICK_MEMBERS',
  'BAN_MEMBERS',
  'MUTE_MEMBERS',
  'VIEW_AUDIT_LOG',
  'SEND_MESSAGES',
  'EMBED_LINKS'
];

const PRESET_COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#10b981', // Green
  '#06b6d4', // Cyan
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#94a3b8'  // grey
];

export default function RolesManager({ roles, onCreateRole, onUpdateRole, onDeleteRole }: RolesManagerProps) {
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleColor, setNewRoleColor] = useState('#06b6d4');
  const [newRoleHoist, setNewRoleHoist] = useState(false);
  const [newRolePerms, setNewRolePerms] = useState<string[]>(['SEND_MESSAGES']);

  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;

    try {
      await onCreateRole({
        name: newRoleName,
        color: newRoleColor,
        hoist: newRoleHoist,
        permissions: newRolePerms
      });
      // Reset
      setNewRoleName('');
      setNewRoleColor('#06b6d4');
      setNewRoleHoist(false);
      setNewRolePerms(['SEND_MESSAGES']);
      setActiveTab('list');
    } catch (err) {
      console.error(err);
    }
  };

  const handleTogglePermission = (role: Role, perm: string) => {
    const isGranted = role.permissions.includes(perm);
    const updatedPerms = isGranted
      ? role.permissions.filter(p => p !== perm)
      : [...role.permissions, perm];
    onUpdateRole(role.id, { permissions: updatedPerms });
  };

  const toggleNewRolePermission = (perm: string) => {
    setNewRolePerms(prev =>
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    );
  };

  return (
    <div id="roles-manager-panel" className="bg-zinc-950/80 border border-cyan-500/30 p-6 rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.15)] relative overflow-hidden">
      {/* Grid backlight */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0)_50%,rgba(6,182,212,0.01)_50%)] bg-[size:100%_4px] pointer-events-none opacity-40"></div>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 z-10">
        <div>
          <h2 className="text-lg font-bold text-white tracking-wide font-sans flex flex-wrap items-center gap-2">
            <span className="p-1 px-2 text-xs font-mono font-bold uppercase rounded bg-cyan-950/50 text-cyan-400 border border-cyan-500/20">Access Grid</span>
            <LetterGlitch text="GUILD ADMINISTRATIVE ROLES" speed={45} glitchTrigger="hover" className="cursor-pointer" />
          </h2>
          <p className="text-xs text-zinc-400 font-mono mt-1">
            <ShinyText text="Reconfigure permissions, hierarchy, and cryptographic hoist tags." speed={7} />
          </p>
        </div>

        <div className="flex bg-zinc-900 border border-cyan-500/20 rounded-lg p-1 z-10 font-mono text-xs w-full md:w-auto self-stretch md:self-auto justify-center">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 md:flex-initial text-center px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
              activeTab === 'list'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/20'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            ROLES INDEX
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 md:flex-initial text-center px-3 py-1.5 rounded-md font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'create'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/20'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            SYNTHESIZE NEW ROLE
          </button>
        </div>
      </div>

      <div className="z-10">
        {activeTab === 'list' ? (
          <div className="space-y-4">
            {roles.map((role) => (
              <div
                key={role.id}
                className="border border-cyan-400/10 hover:border-cyan-400/30 rounded-xl bg-zinc-900/10 p-4 transition-all flex flex-col gap-3 relative overflow-hidden"
              >
                {/* Holographic background glow from role color */}
                <div 
                  className="absolute -right-20 -top-20 w-40 h-40 rounded-full blur-[80px] opacity-10" 
                  style={{ backgroundColor: role.color }}
                ></div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex items-center gap-2.5">
                    {/* Glowing role color indicators tag */}
                    <div 
                      className="w-3.5 h-3.5 rounded-full shadow-[0_0_8px_currentColor] shrink-0" 
                      style={{ color: role.color, backgroundColor: role.color }}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-white font-mono font-semibold text-sm">{role.name}</span>
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-500/20 px-1.5 py-0.5 rounded">
                        {role.memberCount} citizens
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 font-mono text-xs text-zinc-400 w-full sm:w-auto justify-between sm:justify-end">
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={role.hoist}
                        onChange={(e) => onUpdateRole(role.id, { hoist: e.target.checked })}
                        className="rounded border-cyan-500/30 text-cyan-500 bg-zinc-950 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                      />
                      <span>HOIST ACCESS</span>
                    </label>

                    <div className="flex gap-2.5">
                      <button
                        onClick={() => setEditingRoleId(editingRoleId === role.id ? null : role.id)}
                        className="p-1.5 px-2.5 bg-zinc-900 border border-cyan-500/20 rounded text-cyan-300 hover:bg-cyan-950/40 hover:border-cyan-400/40 transition-colors flex items-center gap-1 text-[10px] cursor-pointer font-bold"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        PERMS MATRIX
                      </button>

                      <button
                        onClick={() => onDeleteRole(role.id)}
                        disabled={role.id === 'role-admin'}
                        className="p-1.5 bg-zinc-900 border border-red-500/20 rounded text-red-400 hover:bg-red-950/20 hover:border-red-500/40 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                        title="Delete Role"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded matrix permissions builder */}
                {editingRoleId === role.id && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="mt-2 pt-4 border-t border-cyan-500/10 overflow-hidden"
                  >
                    <span className="text-[10px] font-mono tracking-wider text-cyan-400 block mb-3 uppercase">
                      Security Clearance Permissions Matrix (Interactive)
                    </span>
                    <div className="flex flex-wrap gap-1.5 pb-1">
                      {DISCORD_PERMISSIONS.map((perm) => {
                        const hasPerm = role.permissions.includes(perm);
                        return (
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            key={perm}
                            onClick={() => handleTogglePermission(role, perm)}
                            className={`px-2 py-1 rounded text-[10px] font-mono border transition-all flex items-center gap-1 cursor-pointer ${
                              hasPerm
                                ? 'bg-cyan-950/50 border-cyan-400 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.15)]'
                                : 'bg-transparent border-zinc-500/20 text-zinc-500 hover:border-zinc-500/40 hover:text-zinc-300'
                            }`}
                          >
                            {hasPerm && <Check className="w-2.5 h-2.5 text-cyan-400" />}
                            {perm.replace('_', ' ')}
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <form onSubmit={handleCreateSubmit} className="space-y-4 max-w-xl font-mono text-xs">
            <div className="space-y-1.5">
              <label className="text-zinc-400 block text-[10px] tracking-wider uppercase">ROLE IDENTITY MODULE (NAME)</label>
              <input
                type="text"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="e.g. LAB MODERATOR Alpha"
                required
                className="w-full bg-zinc-950 border border-cyan-500/30 p-2.5 rounded-lg text-white focus:outline-none focus:border-cyan-400 text-xs text-semibold placeholder-zinc-600"
              />
            </div>

            <div className="space-y-2">
              <label className="text-zinc-400 block text-[10px] tracking-wider uppercase">RGB SPECTRAL GLOW tag (COLOR)</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={newRoleColor}
                  onChange={(e) => setNewRoleColor(e.target.value)}
                  className="w-10 h-10 border-0 bg-transparent rounded cursor-pointer"
                />
                <div className="flex flex-wrap gap-1.5 flex-1 p-2 rounded bg-zinc-950 border border-cyan-500/10">
                  {PRESET_COLORS.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setNewRoleColor(col)}
                      className="w-5 h-5 rounded-full shadow-sm hover:scale-110 active:scale-95 transition-all"
                      style={{ backgroundColor: col }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="p-3 bg-zinc-900/30 border border-cyan-500/5 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-white block font-semibold">Hoist Clearance Level</span>
                <span className="text-[10px] text-zinc-500">Enable dashboard users to sort this role separately in active telemetry views.</span>
              </div>
              <input
                type="checkbox"
                checked={newRoleHoist}
                onChange={(e) => setNewRoleHoist(e.target.checked)}
                className="rounded border-cyan-500/30 text-cyan-500 bg-zinc-950 focus:ring-0 w-4 h-4"
              />
            </div>

            <div className="space-y-2">
              <label className="text-zinc-400 block text-[10px] tracking-wider uppercase">INITIAL SYSTEM PERMISSIONS (SECURITY BLOCKS)</label>
              <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto p-2 rounded bg-zinc-950 border border-cyan-500/10">
                {DISCORD_PERMISSIONS.map((perm) => {
                  const hasPerm = newRolePerms.includes(perm);
                  return (
                    <button
                      type="button"
                      key={perm}
                      onClick={() => toggleNewRolePermission(perm)}
                      className={`p-2 rounded text-left font-mono text-[9px] border transition-all flex items-center justify-between ${
                        hasPerm
                          ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-300'
                          : 'bg-transparent border-zinc-800 text-zinc-600 hover:border-zinc-700 hover:text-zinc-400'
                      }`}
                    >
                      <span>{perm.replace('_', ' ')}</span>
                      {hasPerm && <Check className="w-3 h-3 text-cyan-400" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              className="w-full p-3 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-400 font-bold tracking-widest text-[11px] rounded-lg transition-all hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]"
            >
              COMPILE ACCESS PRIVILEGES
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
