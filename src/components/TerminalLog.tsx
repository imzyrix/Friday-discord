import React, { useState } from 'react';
import { Terminal, ShieldAlert, BadgeInfo, Save, RefreshCw, Layers } from 'lucide-react';
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

  const getSeverityBadge = (severity: AuditLog['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-950/40 text-red-400 border-red-500/50 shadow-[0_0_8px_rgba(239,68,68,0.3)] animate-pulse';
      case 'high':
        return 'bg-orange-950/40 text-orange-400 border-orange-500/30';
      case 'medium':
        return 'bg-yellow-950/40 text-yellow-500 border-yellow-500/20';
      default:
        return 'bg-cyan-950/40 text-cyan-400 border-cyan-500/20';
    }
  };

  const getCategoryColor = (cat: AuditLog['category']) => {
    switch (cat) {
      case 'security': return 'text-red-400 font-bold';
      case 'backup': return 'text-orange-400';
      case 'moderation': return 'text-yellow-400';
      case 'role': return 'text-purple-400';
      default: return 'text-cyan-400';
    }
  };

  return (
    <div id="terminal-log-panel" className="bg-zinc-950 border border-cyan-500/30 p-6 rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.15)] relative overflow-hidden flex flex-col gap-4">
      {/* Dynamic CRT Scanline Layer */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0)_50%,rgba(6,182,212,0.02)_50%)] bg-[size:100%_4px] pointer-events-none opacity-40"></div>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-cyan-500/15 pb-4 z-10">
        <div>
          <h2 className="text-sm font-bold text-white tracking-widest font-mono flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400 animate-pulse animate-duration-1000" />
            STARK-NET SECURITY PROTOCOL STREAM
          </h2>
          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
            Real-time feed output of encrypted event log blocks over secure connection.
          </p>
        </div>

        {/* Categories togglers row */}
        <div className="flex flex-wrap gap-1.5 font-mono text-[9px]">
          {['all', 'security', 'moderation', 'role', 'backup', 'bot'].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-2 py-1 rounded border uppercase transition-all ${
                activeCategory === cat
                  ? 'bg-cyan-950/50 border-cyan-500 text-cyan-300 shadow-[0_0_6px_rgba(6,182,212,0.3)]'
                  : 'bg-transparent border-zinc-850 text-zinc-500 hover:text-zinc-350 hover:border-zinc-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Primary diagnostic details & stream */}
      <div className="z-10 flex flex-col gap-3">
        {/* Severity selection panel */}
        <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500">
          <span className="flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-zinc-500" />
            FILTER LEVEL:
          </span>
          <div className="flex gap-2">
            {['all', 'low', 'medium', 'high', 'critical'].map((sev) => (
              <button
                key={sev}
                onClick={() => setActiveSeverity(sev)}
                className={`transition-colors uppercase hover:text-white ${
                  activeSeverity === sev ? 'text-cyan-400 font-bold' : ''
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        {/* Terminal Text box scroll */}
        <div className="bg-zinc-950/90 border border-cyan-500/10 rounded-xl p-4 font-mono text-[11px] leading-relaxed max-h-[300px] overflow-y-auto space-y-2 select-text custom-terminal-scroll">
          {filteredLogs.map((log) => (
            <div 
              key={log.id} 
              className="flex items-start text-zinc-300 gap-2 font-mono hover:bg-cyan-500/[0.02] p-1.5 rounded transition-all"
            >
              {/* Timestamp block in grey */}
              <span className="text-zinc-500 shrink-0 select-none">
                [{new Date(log.timestamp).toLocaleTimeString()}]
              </span>

              {/* Executor identification */}
              <span className="text-cyan-300 font-semibold shrink-0">
                &lt;{log.executor}&gt;
              </span>

              {/* Categorization tag */}
              <span className={`shrink-0 select-none uppercase text-[9px] px-1 rounded border border-cyan-500/10 bg-zinc-900/40 ${getCategoryColor(log.category)}`}>
                {log.category}
              </span>

              {/* Action content description */}
              <span className="flex-1 text-zinc-300 text-left">
                {log.action}
                {log.target && (
                  <span className="text-cyan-300 underline underline-offset-2 ml-1">
                    (@{log.target})
                  </span>
                )}
              </span>

              {/* Severity badge block */}
              <span className={`text-[9.5px] px-1.5 py-0.2 select-none uppercase rounded border ${getSeverityBadge(log.severity)}`}>
                {log.severity}
              </span>
            </div>
          ))}

          {filteredLogs.length === 0 && (
            <div className="py-12 text-center text-zinc-650 font-semibold uppercase tracking-wider animate-pulse">
              No audit records matching selected level diagnostics in block queue.
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center font-mono text-[9px] text-zinc-600 mt-1 z-10 border-t border-cyan-500/5 pt-2">
        <span>SECURITY CORE SCAN: ACTIVE</span>
        <span className="uppercase flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
          Telemetry Verified
        </span>
      </div>
    </div>
  );
}
