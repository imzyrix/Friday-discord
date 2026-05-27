import React, { useState } from 'react';
import { 
  Terminal, 
  Layers, 
  Shield, 
  AlertTriangle, 
  Key, 
  HardDrive, 
  Cpu 
} from 'lucide-react';
import { motion } from 'motion/react';
import { AuditLog } from '../types';

interface TerminalLogProps {
  logs: AuditLog[];
}

export default function TerminalLog({ logs }: TerminalLogProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeSeverity, setActiveSeverity] = useState<string>('all');

  const filteredLogs = logs.filter((log) => {
    const matchesCat = activeCategory === 'all' ? true : log.category === activeCategory;
    const matchesSev = activeSeverity === 'all' ? true : log.severity === activeSeverity;
    return matchesCat && matchesSev;
  });

  // Get lucide-react icons based on category
  const getCategoryIcon = (category: AuditLog['category']) => {
    switch (category) {
      case 'security':
        return <Shield className="w-3.5 h-3.5 text-red-400" />;
      case 'moderation':
        return <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />;
      case 'role':
        return <Key className="w-3.5 h-3.5 text-yellow-400" />;
      case 'backup':
        return <HardDrive className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Cpu className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  const getSeverityStyles = (severity: AuditLog['severity']) => {
    switch (severity) {
      case 'critical':
        return {
          rowClass: 'border-l-2 border-red-500 bg-red-950/10 shadow-[0_0_10px_rgba(239,68,68,0.05)_inset]',
          badgeClass: 'bg-red-950/50 text-red-400 border-red-500/40 shadow-[0_0_8px_rgba(239,68,68,0.35)] animate-pulse font-bold',
          iconGlow: 'shadow-[0_0_8px_rgba(239,68,68,0.4)]'
        };
      case 'high':
        return {
          rowClass: 'border-l-2 border-orange-500 bg-orange-950/5',
          badgeClass: 'bg-orange-950/40 text-orange-400 border-orange-500/30',
          iconGlow: ''
        };
      case 'medium':
        return {
          rowClass: 'border-l-2 border-yellow-500 bg-yellow-950/5',
          badgeClass: 'bg-yellow-950/30 text-yellow-500 border-yellow-500/20',
          iconGlow: ''
        };
      default:
        return {
          rowClass: 'border-l-2 border-cyan-500 bg-cyan-950/5',
          badgeClass: 'bg-cyan-950/30 text-cyan-400 border-cyan-500/20',
          iconGlow: ''
        };
    }
  };

  const getCategoryColor = (cat: AuditLog['category']) => {
    switch (cat) {
      case 'security': return 'text-red-400 font-bold';
      case 'backup': return 'text-emerald-400';
      case 'moderation': return 'text-orange-400';
      case 'role': return 'text-yellow-400';
      default: return 'text-cyan-400';
    }
  };

  return (
    <div id="terminal-log-panel" className="hud-panel p-6 rounded-2xl border-cyan-500/15 overflow-hidden flex flex-col gap-4">
      {/* Laser grid backing scan lines */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0)_50%,rgba(0,245,255,0.01)_50%)] bg-[size:100%_4px] pointer-events-none opacity-40"></div>
      
      {/* Header section with double columns */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-b border-cyan-500/10 pb-4 z-10">
        <div>
          <h2 className="text-sm font-bold text-white tracking-widest font-mono flex items-center gap-2 text-glow-cyan">
            <Terminal className="w-4 h-4 text-cyan-400 animate-pulse" />
            STARK SECTOR WAR ROOM AUDIT UPLINK
          </h2>
          <p className="text-[10px] text-zinc-500 font-mono mt-0.5 uppercase tracking-wide">
            Intercepting logs and live authorization records over encrypted network protocols.
          </p>
        </div>

        {/* Categories togglers row */}
        <div className="flex flex-wrap gap-1.5 font-mono text-[9px]">
          <span className="text-zinc-650 self-center font-bold tracking-wider mr-1">CATEGORY:</span>
          {['all', 'security', 'moderation', 'role', 'backup', 'bot'].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-2.5 py-1 rounded border uppercase transition-all duration-200 cursor-pointer ${
                activeCategory === cat
                  ? 'bg-cyan-950/50 border-cyan-400 text-cyan-300 shadow-[0_0_8px_rgba(0,245,255,0.3)]'
                  : 'bg-zinc-950/40 border-cyan-500/10 text-zinc-500 hover:text-zinc-300 hover:border-cyan-500/30'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* FILTER BY SEVERITY ROW */}
      <div className="flex flex-wrap items-center gap-2 font-mono text-[9px] border-b border-cyan-500/5 pb-3 z-10">
        <span className="text-zinc-650 font-bold tracking-wider mr-1 flex items-center gap-1">
          <Layers className="w-3 h-3" />
          FILTER BY SEVERITY:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {['all', 'low', 'medium', 'high', 'critical'].map((sev) => {
            let activeStyle = 'bg-cyan-950/50 border-cyan-400 text-cyan-300 shadow-[0_0_8px_rgba(0,245,255,0.3)]';
            if (activeSeverity === sev) {
              if (sev === 'critical') activeStyle = 'bg-red-950/50 border-red-500 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.3)]';
              else if (sev === 'high') activeStyle = 'bg-orange-950/50 border-orange-500 text-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.3)]';
              else if (sev === 'medium') activeStyle = 'bg-yellow-950/50 border-yellow-500 text-yellow-400 shadow-[0_0_8px_rgba(234,179,8,0.3)]';
            }

            return (
              <button
                key={sev}
                onClick={() => setActiveSeverity(sev)}
                className={`px-2.5 py-1 rounded border uppercase transition-all duration-200 cursor-pointer ${
                  activeSeverity === sev
                    ? activeStyle
                    : 'bg-zinc-950/40 border-cyan-500/10 text-zinc-500 hover:text-zinc-350 hover:border-cyan-500/25'
                }`}
              >
                {sev}
              </button>
            );
          })}
        </div>
      </div>

      {/* Stream Terminal Display box */}
      <div className="z-10 bg-zinc-950/80 border border-cyan-500/10 rounded-xl p-4 font-mono text-[11px] leading-relaxed max-h-[350px] overflow-y-auto space-y-2 select-text custom-terminal-scroll">
        {filteredLogs.map((log) => {
          const styles = getSeverityStyles(log.severity);
          return (
            <motion.div 
              key={log.id} 
              layout
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className={`flex flex-col sm:flex-row items-start sm:items-center text-zinc-300 gap-2 font-mono p-2 rounded transition-all hover:bg-cyan-500/[0.03] ${styles.rowClass}`}
            >
              {/* Timestamp block */}
              <span className="text-zinc-500 shrink-0 select-none text-[10px]">
                [{new Date(log.timestamp).toLocaleTimeString()}]
              </span>

              {/* Executor context */}
              <span className="text-cyan-400 font-bold shrink-0 min-w-[100px] text-left">
                &lt;{log.executor}&gt;
              </span>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* Category Icon */}
                <span className={`p-1 rounded bg-zinc-900/80 border border-cyan-500/10 ${styles.iconGlow}`}>
                  {getCategoryIcon(log.category)}
                </span>

                {/* Categorization tag label */}
                <span className={`shrink-0 select-none uppercase text-[8px] px-1.5 py-0.5 rounded border border-cyan-500/10 bg-zinc-900/60 ${getCategoryColor(log.category)}`}>
                  {log.category}
                </span>
              </div>

              {/* Action content description */}
              <span className="flex-1 text-zinc-300 text-left text-[10.5px]">
                {log.action}
                {log.target && (
                  <span className="text-cyan-400 font-bold ml-1">
                    (@{log.target})
                  </span>
                )}
              </span>

              {/* Severity badge info */}
              <span className={`text-[8px] px-2 py-0.5 select-none uppercase rounded border ${styles.badgeClass}`}>
                {log.severity}
              </span>
            </motion.div>
          );
        })}

        {filteredLogs.length === 0 && (
          <div className="py-16 text-center text-zinc-550 font-mono text-[10px] uppercase tracking-wider animate-pulse">
            No secure tactical logs resolved in this diagnostic sector.
          </div>
        )}
      </div>

      <div className="flex justify-between items-center font-mono text-[9px] text-zinc-650 mt-1 z-10 border-t border-cyan-500/5 pt-2">
        <span>GRID_STREAM_RECON: VERIFIED</span>
        <span className="uppercase flex items-center gap-1 text-cyan-400 tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-hud-blink"></span>
          Telemetry Synchronized
        </span>
      </div>
    </div>
  );
}
