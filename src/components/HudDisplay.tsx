import React, { useState, useEffect } from 'react';
import { Shield, Radio, Activity, Cpu, Server, Database, Volume2, HardDrive, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { BotDiagnostic } from '../types';

interface HudProps {
  diagnostic: BotDiagnostic;
}

export default function HudDisplay({ diagnostic }: HudProps) {
  const [pulse, setPulse] = useState(true);

  useEffect(() => {
    const pulseTimer = setInterval(() => setPulse(p => !p), 1500);
    return () => clearInterval(pulseTimer);
  }, []);

  // Format large bytes beautifully for the telemetry console
  const formatBytes = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  // Turn seconds to readable uptime string
  const formatUptime = (sec: number) => {
    const d = Math.floor(sec / (3600 * 24));
    const h = Math.floor((sec % (3600 * 24)) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${d}d ${h}h ${m}m ${s}s`;
  };

  // Generate random heights for a pulsing equalizer bar in the holographic UI
  const equalizerBars = Array.from({ length: 14 });

  return (
    <div id="hud-display-panel" className="relative grid grid-cols-1 md:grid-cols-3 gap-6 bg-zinc-950/90 border border-cyan-500/30 p-6 rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.18)] overflow-hidden">
      {/* Laser grid backing scan lines line with modern design */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0)_50%,rgba(6,182,212,0.03)_50%)] bg-[size:100%_4px] pointer-events-none opacity-50"></div>
      
      {/* Corner bracket aesthetics */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-cyan-400/40 pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-cyan-400/40 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-cyan-400/40 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-cyan-400/40 pointer-events-none"></div>

      {/* Column 1: Holographic System HUD Scanner */}
      <div className="flex flex-col items-center justify-between p-5 border border-cyan-500/20 rounded-xl bg-cyan-950/5 relative min-h-[260px] overflow-hidden group">
        <div className="absolute inset-0 bg-radial-gradient from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
        
        <div className="w-full flex justify-between items-center pb-2 border-b border-cyan-500/10 z-10">
          <div className="text-[10px] font-mono tracking-widest text-cyan-400 flex items-center gap-1.5 font-bold">
            <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
            STARK BEACON SCANNER
          </div>
          <span className="text-[8px] font-mono text-cyan-500/80 bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-500/20">SYSTEM: ACTIVE</span>
        </div>

        {/* The rotating radar visualizer */}
        <div className="relative w-44 h-44 flex items-center justify-center my-3">
          {/* Circular grid lines */}
          <div className="absolute inset-0 rounded-full border border-dashed border-cyan-500/20"></div>
          <div className="absolute inset-4 rounded-full border border-cyan-500/10"></div>
          <div className="absolute inset-10 rounded-full border border-dashed border-cyan-500/15"></div>
          <div className="absolute inset-20 rounded-full border border-cyan-400/10"></div>
          
          {/* Axis indicators */}
          <div className="absolute h-full w-[1px] bg-[linear-gradient(to_bottom,transparent,rgba(6,182,212,0.15)_20%,rgba(6,182,212,0.15)_80%,transparent)]"></div>
          <div className="absolute w-full h-[1px] bg-[linear-gradient(to_right,transparent,rgba(6,182,212,0.15)_20%,rgba(6,182,212,0.15)_80%,transparent)]"></div>

          {/* Concentric telemetry circles */}
          <div className="absolute -inset-2.5 rounded-full border border-cyan-500/5 animate-pulse"></div>

          {/* Sweeping holographic wedge using Framer Motion */}
          <motion.div 
            className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-500/0 via-cyan-500/0 to-cyan-400/20 pointer-events-none"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
          ></motion.div>

          {/* Floating HUD coordinate targets to fulfill Cyberpunk Tactical Style */}
          <div className="absolute inset-0 pointer-events-none font-mono text-[8px] text-cyan-400/60 z-10">
            <div className="absolute top-[28px] left-[24px] flex items-center gap-1">
              <span className="w-1 h-1 bg-cyan-400 rounded-full animate-ping"></span>
              <span>MALIBU_PT</span>
            </div>
            <div className="absolute bottom-[36px] right-[20px] flex items-center gap-1">
              <span className="w-1 h-1 bg-cyan-400 rounded-full animate-ping"></span>
              <span>STARK_MAIN</span>
            </div>
            <div className="absolute top-[48px] right-[14px] flex flex-col leading-none text-right">
              <span className="text-[7px] text-zinc-650">AZIMUTH</span>
              <span className="font-bold text-cyan-500/50">148.91°</span>
            </div>
          </div>

          {/* Core F.R.I.D.A.Y System Light */}
          <motion.div 
            className="relative z-10 w-16 h-16 rounded-full bg-zinc-950 border border-cyan-400 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.5)] cursor-pointer"
            animate={{ 
              boxShadow: pulse 
                ? ["0 0 15px rgba(6,182,212,0.4)", "0 0 30px rgba(6,182,212,0.7)", "0 0 15px rgba(6,182,212,0.4)"]
                : "0 0 15px rgba(6,182,212,0.4)",
              scale: pulse ? [1, 1.05, 1] : 1
            }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          >
            <Activity className="w-7 h-7 text-cyan-400" />
            
            {/* Pulsing ring */}
            <span className="absolute -inset-1.5 rounded-full border border-cyan-400/30 animate-ping"></span>
          </motion.div>

          {/* Glowing orbiting satellite bits representing Shards */}
          {diagnostic.shards.map((shard, i) => {
            const angle = (i * 120) * (Math.PI / 180);
            const r = 62; // orbital radius
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;
            return (
              <motion.div
                key={shard.id}
                className={`absolute w-2.5 h-2.5 rounded-full shadow-[0_0_10px_currentColor] z-20 ${
                  shard.status === 'connected' ? 'bg-cyan-400 text-cyan-400' : 'bg-red-500 text-red-500'
                }`}
                style={{ x, y }}
                animate={{ 
                  scale: [0.8, 1.2, 0.8],
                }}
                transition={{ 
                  duration: 1.5 + i * 0.3, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
                title={`Shard ${shard.id}: status ${shard.status}`}
              />
            );
          })}
        </div>

        <div className="w-full text-center font-mono z-10 pt-1">
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">DIGITAL CONSCIOUSNESS</div>
          <div className="text-xs font-bold text-white tracking-wider flex items-center justify-center gap-1.5 mt-0.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
            </span>
            F.R.I.D.A.Y. CORE ACTIVE
          </div>
        </div>
      </div>

      {/* Column 2: Real-time Signal Telemetry */}
      <div className="flex flex-col justify-between p-5 border border-cyan-500/20 rounded-xl bg-cyan-950/5 relative min-h-[260px] group">
        <div className="absolute inset-0 bg-radial-gradient from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

        <div className="w-full flex justify-between items-center pb-2 border-b border-cyan-500/10 z-10">
          <div className="text-[10px] font-mono tracking-widest text-cyan-400 flex items-center gap-1.5 font-bold">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            PERFORMANCE SPECS
          </div>
          <span className="text-[9px] font-mono text-zinc-500 tracking-tighter">COGNITION M-4</span>
        </div>

        <div className="my-auto py-2 space-y-4 font-mono text-xs text-zinc-300 z-10">
          <div>
            <div className="flex justify-between mb-1.5 h-4 items-center">
              <span className="text-zinc-400 flex items-center gap-1 text-[11px]">CPU THREAD LOAD</span>
              <span className="text-cyan-400 font-bold">{diagnostic.cpuUsage}%</span>
            </div>
            <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-cyan-500/20 p-[1px]">
              <motion.div 
                className="bg-gradient-to-r from-cyan-600 to-cyan-400 h-full rounded-full shadow-[0_0_8px_#06b6d4]" 
                initial={{ width: 0 }}
                animate={{ width: `${diagnostic.cpuUsage}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              ></motion.div>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1.5 h-4 items-center">
              <span className="text-zinc-400 flex items-center gap-1 text-[11px]">VIRTUALIZED RAM</span>
              <span className="text-cyan-400 font-bold">{formatBytes(diagnostic.memoryUsage.heapUsed)}</span>
            </div>
            <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-cyan-500/20 p-[1px]">
              {/* Calculate Heap percent */}
              {(() => {
                const pct = Math.min(100, Math.round((diagnostic.memoryUsage.heapUsed / diagnostic.memoryUsage.heapTotal) * 100));
                return (
                  <motion.div 
                    className="bg-gradient-to-r from-cyan-500 to-cyan-300 h-full rounded-full shadow-[0_0_8px_#22d3ee]" 
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  ></motion.div>
                );
              })()}
            </div>
            <div className="flex justify-between text-[9px] text-zinc-500 mt-1">
              <span>Heap Used: {formatBytes(diagnostic.memoryUsage.heapUsed)}</span>
              <span>Total Heap: {formatBytes(diagnostic.memoryUsage.heapTotal)}</span>
            </div>
          </div>

          <div className="pt-3 border-t border-cyan-500/10 grid grid-cols-2 gap-3 text-[10px]">
            <div>
              <span className="text-zinc-500 block text-[9px]">PING LATENCY</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1.5 mt-0.5 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                {diagnostic.latency} ms
              </span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[9px]">ENCRYPTION DEPLOYED</span>
              <span className="text-cyan-400 font-bold block mt-0.5 text-xs">AES-GCM 256</span>
            </div>
          </div>
        </div>

        <div className="w-full border-t border-cyan-500/10 pt-2 flex justify-between items-center text-[9px] text-zinc-500 font-mono z-10">
          <span>COGNITIVE CORE INTEL</span>
          <span className="text-emerald-400 font-semibold uppercase flex items-center gap-1">OPTIMAL STATE</span>
        </div>
      </div>

      {/* Column 3: Shards & Encrypted Backups Health */}
      <div className="flex flex-col justify-between p-5 border border-cyan-500/20 rounded-xl bg-cyan-950/5 relative min-h-[260px] group">
        <div className="absolute inset-0 bg-radial-gradient from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

        <div className="w-full flex justify-between items-center pb-2 border-b border-cyan-500/10 z-10">
          <div className="text-[10px] font-mono tracking-widest text-cyan-400 flex items-center gap-1.5 font-bold">
            <Server className="w-3.5 h-3.5 text-cyan-400" />
            STARK MAIN SYSTEM DATA
          </div>
          <span className="text-[9px] font-mono text-cyan-400 font-semibold uppercase flex items-center gap-1">
            USA_EAST
          </span>
        </div>

        {/* Shard status bars list / Info box */}
        <div className="my-auto py-2 flex flex-col gap-2.5 font-mono text-xs z-10">
          <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/60 border border-cyan-500/10 hover:border-cyan-400/30 transition-all duration-300">
            <span className="text-zinc-500 flex items-center gap-1 text-[10px]">
              <HardDrive className="w-3.5 h-3.5 text-cyan-500/70" />
              UPTIME TRACKER
            </span>
            <span className="text-zinc-300 font-bold">{formatUptime(diagnostic.uptime)}</span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/60 border border-cyan-500/10 hover:border-cyan-400/30 transition-all duration-300">
            <span className="text-zinc-500 flex items-center gap-1 text-[10px]">
              <Shield className="w-3.5 h-3.5 text-cyan-500/70" />
              INFRASTRUCTURE
            </span>
            <span className="text-cyan-300 font-bold text-[10px]">STARK-CLOUD-RUN</span>
          </div>

          <div className="flex flex-col gap-1.5 p-2 rounded-lg bg-zinc-950/60 border border-cyan-500/10">
            <span className="text-zinc-500 text-[9px] uppercase tracking-wider block">ACTIVE TELEMETRY SHARDS</span>
            <div className="flex gap-2.5 mt-0.5">
              {diagnostic.shards.map((shard) => (
                <div 
                  key={shard.id} 
                  title={`Shard ${shard.id}: Latency ${shard.latency}ms`}
                  className={`flex-1 flex flex-col items-center py-1.5 px-1 rounded border transition-all ${
                    shard.status === 'connected' 
                      ? 'bg-cyan-950/30 border-cyan-400/30 text-cyan-300' 
                      : 'bg-red-950/40 border-red-500/30 text-red-400'
                  }`}
                >
                  <span className="text-[8px] text-zinc-500">SH_0{shard.id}</span>
                  <span className="font-bold text-xs mt-0.5">{shard.latency}ms</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Animated Synthesizer Signal feedback purely graphical to complete the visual HUD look */}
        <div className="w-full pt-1.5 border-t border-cyan-500/10 flex items-center justify-between z-10">
          <div className="flex items-center gap-1">
            <Volume2 className="w-3.5 h-3.5 text-cyan-500/70" />
            <span className="text-[9px] text-zinc-500 font-mono font-bold tracking-tight uppercase">COGNITIVE SYNC</span>
          </div>
          <div className="flex items-end gap-[2px] h-3.5">
            {equalizerBars.map((_, idx) => (
              <motion.div
                key={idx}
                className="w-[2px] bg-cyan-400 rounded-sm"
                animate={{
                  height: [
                    "20%",
                    "100%",
                    "40%",
                    "80%",
                    "20%"
                  ]
                }}
                transition={{
                  repeat: Infinity,
                  duration: 0.6 + (idx % 4) * 0.15,
                  ease: "easeInOut",
                  delay: idx * 0.05
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
