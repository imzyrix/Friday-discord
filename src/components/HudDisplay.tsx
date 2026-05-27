import React, { useState, useEffect, useRef } from 'react';
import { Shield, Radio, Activity, Cpu, Server, Volume2, HardDrive } from 'lucide-react';
import { motion } from 'motion/react';
import { BotDiagnostic, Member, Role } from '../types';

interface LiveFeedEvent {
  id: string;
  timestamp: string;
  username: string;
  action: string;
  type: 'join' | 'leave' | 'status' | 'voice' | 'role_update';
}

interface HudProps {
  diagnostic: BotDiagnostic;
  members: Member[];
  roles: Role[];
  liveFeed: LiveFeedEvent[];
}

export default function HudDisplay({ diagnostic, members = [], roles = [], liveFeed = [] }: HudProps) {
  const [pulse, setPulse] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoveredMember, setHoveredMember] = useState<{ name: string; roleName: string; x: number; y: number } | null>(null);

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

  // Stable polar position generator based on member's unique ID hash
  const getMemberCoordinates = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const angle = Math.abs(hash % 360) * (Math.PI / 180);
    const radiusScale = 0.25 + (Math.abs(hash >> 8) % 55) / 100; // between 25% and 80% range
    return { angle, radius: radiusScale };
  };

  // Performant Canvas-based military HUD sweep radar system
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let sweepAngle = 0;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }
    });

    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(centerX, centerY) - 8;

      ctx.clearRect(0, 0, width, height);

      // 1. Concentric circles & radar scope grid
      ctx.strokeStyle = 'rgba(0, 245, 255, 0.12)';
      ctx.lineWidth = 1;

      [0.35, 0.65, 0.95].forEach((scale) => {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * scale, 0, Math.PI * 2);
        ctx.stroke();

        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = 'rgba(0, 245, 255, 0.05)';
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * (scale - 0.15), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      });

      // Axis lines crossing screen centers
      ctx.beginPath();
      ctx.moveTo(centerX - radius, centerY);
      ctx.lineTo(centerX + radius, centerY);
      ctx.moveTo(centerX, centerY - radius);
      ctx.lineTo(centerX, centerY + radius);
      ctx.stroke();

      // Outer solid hull ring
      ctx.strokeStyle = 'rgba(0, 245, 255, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();

      // 2. Draw sweeping sweep vector and its trailing gradient
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, sweepAngle - 0.45, sweepAngle, false);
      ctx.closePath();

      const tailGradient = ctx.createLinearGradient(
        centerX, centerY, 
        centerX + Math.cos(sweepAngle - 0.2) * radius, 
        centerY + Math.sin(sweepAngle - 0.2) * radius
      );
      tailGradient.addColorStop(0, 'rgba(0, 245, 255, 0.01)');
      tailGradient.addColorStop(1, 'rgba(0, 245, 255, 0.15)');
      ctx.fillStyle = tailGradient;
      ctx.fill();

      // Main fluorescent sweep line
      ctx.strokeStyle = '#00f5ff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX + Math.cos(sweepAngle) * radius, centerY + Math.sin(sweepAngle) * radius);
      ctx.stroke();
      ctx.restore();

      // 3. Render active server members as glowing blip elements
      const pulseFactor = 1 + 0.15 * Math.sin(Date.now() / 180);
      
      members.forEach((m) => {
        if (m.status === 'offline') return;

        const { angle, radius: rScale } = getMemberCoordinates(m.id);
        const bX = centerX + Math.cos(angle) * (radius * rScale);
        const bY = centerY + Math.sin(angle) * (radius * rScale);

        let roleName = 'Member';
        if (m.roles && m.roles.length > 0) {
          const mainRole = roles.find(r => r.id === m.roles[0]);
          if (mainRole) roleName = mainRole.name;
        }

        const isAdm = roleName.toLowerCase().includes('admin') || roleName.toLowerCase().includes('owner') || roleName.toLowerCase().includes('creator');
        const isM = roleName.toLowerCase().includes('mod') || roleName.toLowerCase().includes('staff');
        
        let colorTheme = 'rgb(0, 245, 255)'; // cyan
        if (isAdm) colorTheme = 'rgb(239, 68, 68)'; // red
        else if (isM) colorTheme = 'rgb(249, 115, 22)'; // orange

        // Draw blip dot
        ctx.fillStyle = colorTheme;
        ctx.beginPath();
        ctx.arc(bX, bY, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Pulsing background rings
        ctx.strokeStyle = colorTheme.replace('rgb', 'rgba').replace(')', ', 0.35)');
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(bX, bY, 7.5 * pulseFactor, 0, Math.PI * 2);
        ctx.stroke();
      });

      sweepAngle = (sweepAngle + 0.015) % (Math.PI * 2);
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  }, [members, roles]);

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const scaleX = canvas.width / rect.width / dpr;
    const scaleY = canvas.height / rect.height / dpr;
    const mouseX = (event.clientX - rect.left) * scaleX;
    const mouseY = (event.clientY - rect.top) * scaleY;

    const width = canvas.width / dpr;
    const height = canvas.height / dpr;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 8;

    let match = null;

    for (const m of members) {
      if (m.status === 'offline') continue;
      const { angle, radius: rScale } = getMemberCoordinates(m.id);
      const bX = centerX + Math.cos(angle) * (radius * rScale);
      const bY = centerY + Math.sin(angle) * (radius * rScale);

      const d = Math.hypot(mouseX - bX, mouseY - bY);
      if (d < 12) {
        let rName = 'Member';
        if (m.roles && m.roles.length > 0) {
          const rObj = roles.find(r => r.id === m.roles[0]);
          if (rObj) rName = rObj.name;
        }
        match = {
          name: m.username,
          roleName: rName,
          x: (bX / width) * 100,
          y: (bY / height) * 100
        };
        break;
      }
    }
    setHoveredMember(match);
  };

  const handleMouseLeave = () => {
    setHoveredMember(null);
  };

  // Pre-configured list of mock lines for radar coordinate visual decoration
  const equalizerBars = Array.from({ length: 14 });

  return (
    <div id="hud-display-container" className="hud-panel p-6 rounded-2xl border-cyan-500/15 overflow-hidden transition-all duration-300">
      {/* Laser grid overlay decoration */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0)_50%,rgba(0,245,255,0.02)_50%)] bg-[size:100%_4px] pointer-events-none opacity-40"></div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
        
        {/* COLUMN 1: LIVE CANVAS RADAR */}
        <div className="flex flex-col items-center justify-between p-5 border border-cyan-500/15 rounded-xl bg-cyan-950/5 relative min-h-[300px] overflow-hidden group">
          <div className="w-full flex justify-between items-center pb-2 border-b border-cyan-500/10 z-10">
            <div className="text-[10px] font-mono tracking-widest text-cyan-400 flex items-center gap-1.5 font-bold">
              <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
              SATELLITE BEACON SCANNER
            </div>
            <span className="text-[8px] font-mono text-cyan-400 animate-pulse bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-500/20">LIVE TARGETING</span>
          </div>

          <div className="relative w-44 h-44 flex items-center justify-center my-3 border border-cyan-500/10 rounded-full bg-zinc-950/40">
            <canvas
              ref={canvasRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="absolute inset-0 w-full h-full cursor-crosshair"
            />

            {/* Hover Tooltip Overlay */}
            {hoveredMember && (
              <div 
                className="absolute z-50 pointer-events-none bg-zinc-950/95 border border-cyan-400/50 p-2 rounded-md font-mono text-[9px] text-cyan-300 shadow-[0_0_15px_rgba(0,245,255,0.3)] transition-all duration-150"
                style={{
                  top: `${hoveredMember.y > 50 ? hoveredMember.y - 25 : hoveredMember.y + 10}%`,
                  left: `${hoveredMember.x > 50 ? hoveredMember.x - 45 : hoveredMember.x + 10}%`,
                }}
              >
                <div className="font-bold text-white">@{hoveredMember.name}</div>
                <div className="text-[8px] text-cyan-400/80 mt-0.5 uppercase tracking-wider">{hoveredMember.roleName}</div>
              </div>
            )}

            {/* Micro Coordinates indicators for radar vibe */}
            <div className="absolute inset-0 pointer-events-none font-mono text-[7px] text-cyan-500/40 z-10">
              <div className="absolute top-4 left-4 font-semibold">AZ_901</div>
              <div className="absolute bottom-4 right-4 font-semibold">STARK_MAIN</div>
            </div>

            {/* Inner Core Pulsing Sensor */}
            <div className="w-10 h-10 rounded-full border border-cyan-400 bg-zinc-950/80 flex items-center justify-center shadow-[0_0_15px_rgba(0,245,255,0.4)] pointer-events-none z-10">
              <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
          </div>

          <div className="w-full text-center font-mono z-10 pt-1">
            <div className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">GRID TRACKER</div>
            <div className="text-[11px] font-bold text-white tracking-wider flex items-center justify-center gap-1.5 mt-0.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
              </span>
              HUD COGNIZER ACTIVE
            </div>
          </div>
        </div>

        {/* COLUMN 2: COGNITIVE SPECS */}
        <div className="flex flex-col justify-between p-5 border border-cyan-500/15 rounded-xl bg-cyan-950/5 relative min-h-[300px] group">
          <div className="w-full flex justify-between items-center pb-2 border-b border-cyan-500/10 z-10">
            <div className="text-[10px] font-mono tracking-widest text-cyan-400 flex items-center gap-1.5 font-bold">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              COGNITIVE HEALTH
            </div>
            <span className="text-[9px] font-mono text-zinc-500 tracking-tighter">COGNITION M-4</span>
          </div>

          <div className="my-auto py-2 space-y-4 font-mono text-xs text-zinc-300 z-10">
            <div>
              <div className="flex justify-between mb-1.5 h-4 items-center">
                <span className="text-zinc-400 flex items-center gap-1 text-[10px] tracking-wide">CPU TELEMETRY</span>
                <span className="text-cyan-400 font-bold">{diagnostic.cpuUsage}%</span>
              </div>
              <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-cyan-500/10 p-[1px]">
                <motion.div 
                  className="bg-gradient-to-r from-cyan-600 to-cyan-400 h-full rounded-full shadow-[0_0_8px_#06b6d4]" 
                  initial={{ width: 0 }}
                  animate={{ width: `${diagnostic.cpuUsage}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1.5 h-4 items-center">
                <span className="text-zinc-400 flex items-center gap-1 text-[10px] tracking-wide">HEAP ALLOCATION</span>
                <span className="text-cyan-400 font-bold">{formatBytes(diagnostic.memoryUsage.heapUsed)}</span>
              </div>
              <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-cyan-500/10 p-[1px]">
                {(() => {
                  const pct = Math.min(100, Math.round((diagnostic.memoryUsage.heapUsed / diagnostic.memoryUsage.heapTotal) * 100));
                  return (
                    <motion.div 
                      className="bg-gradient-to-r from-cyan-500 to-cyan-300 h-full rounded-full shadow-[0_0_8px_#22d3ee]" 
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  );
                })()}
              </div>
              <div className="flex justify-between text-[8px] text-zinc-500 mt-1 uppercase">
                <span>HEAP_USED: {formatBytes(diagnostic.memoryUsage.heapUsed)}</span>
                <span>HEAP_LIMIT: {formatBytes(diagnostic.memoryUsage.heapTotal)}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-cyan-500/10 grid grid-cols-2 gap-3 text-[10px]">
              <div>
                <span className="text-zinc-500 block text-[9px]">PING LATENCY</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1 mt-0.5 text-xs text-glow-cyan">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {diagnostic.latency} ms
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[9px]">ENCRYPTION RATIO</span>
                <span className="text-cyan-400 font-bold block mt-0.5 text-xs">AES-GCM 256</span>
              </div>
            </div>
          </div>

          <div className="w-full border-t border-cyan-500/10 pt-2 flex justify-between items-center text-[9px] text-zinc-500 font-mono z-10">
            <span>UPLINK DIAGNOSTIC</span>
            <span className="text-emerald-400 font-semibold uppercase tracking-wider">RESOLVED</span>
          </div>
        </div>

        {/* COLUMN 3: SERVER DATA AND SHARDS */}
        <div className="flex flex-col justify-between p-5 border border-cyan-500/15 rounded-xl bg-cyan-950/5 relative min-h-[300px] group">
          <div className="w-full flex justify-between items-center pb-2 border-b border-cyan-500/10 z-10">
            <div className="text-[10px] font-mono tracking-widest text-cyan-400 flex items-center gap-1.5 font-bold">
              <Server className="w-3.5 h-3.5 text-cyan-400" />
              SYSTEM SHARDS
            </div>
            <span className="text-[9px] font-mono text-cyan-400 font-semibold uppercase">SEC_D_79</span>
          </div>

          <div className="my-auto py-2 flex flex-col gap-2.5 font-mono text-xs z-10">
            <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/50 border border-cyan-500/10">
              <span className="text-zinc-500 flex items-center gap-1 text-[9px] uppercase tracking-wider font-bold">
                <HardDrive className="w-3 h-3 text-cyan-500/80" />
                SEC_UPTIME
              </span>
              <span className="text-zinc-300 font-bold text-[11px]">{formatUptime(diagnostic.uptime)}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/50 border border-cyan-500/10">
              <span className="text-zinc-500 flex items-center gap-1 text-[9px] uppercase tracking-wider font-bold">
                <Shield className="w-3 h-3 text-cyan-500/80" />
                PLATFORM
              </span>
              <span className="text-cyan-300 font-bold text-[10px]">STARK-CLOUD-RUN</span>
            </div>

            <div className="flex flex-col gap-1.5 p-2 rounded-lg bg-zinc-950/50 border border-cyan-500/10">
              <span className="text-zinc-500 text-[8px] uppercase tracking-wider block font-bold">CORES / SHARDS STATUS</span>
              <div className="flex gap-2 mt-0.5">
                {diagnostic.shards.map((shard) => (
                  <div 
                    key={shard.id} 
                    className={`flex-1 flex flex-col items-center py-1.5 px-0.5 rounded border transition-all ${
                      shard.status === 'connected' 
                        ? 'bg-cyan-950/20 border-cyan-400/25 text-cyan-300' 
                        : 'bg-red-950/30 border-red-500/25 text-red-400'
                    }`}
                  >
                    <span className="text-[7px] text-zinc-500 font-bold">SH_0{shard.id}</span>
                    <span className="font-bold text-[10px] mt-0.5">{shard.latency}ms</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="w-full pt-1.5 border-t border-cyan-500/10 flex items-center justify-between z-10">
            <div className="flex items-center gap-1">
              <Volume2 className="w-3 h-3 text-cyan-500/80" />
              <span className="text-[9px] text-zinc-500 font-mono font-bold tracking-tight uppercase">DYNAMIC EQ</span>
            </div>
            <div className="flex items-end gap-[2px] h-3">
              {equalizerBars.map((_, idx) => (
                <motion.div
                  key={idx}
                  className="w-[2px] bg-cyan-400 rounded-sm"
                  animate={{
                    height: ["15%", "100%", "35%", "75%", "15%"]
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 0.5 + (idx % 3) * 0.15,
                    ease: "easeInOut",
                    delay: idx * 0.04
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* COLUMN 4: LIVE MEMBER FEED */}
        <div className="flex flex-col justify-between p-5 border border-cyan-500/15 rounded-xl bg-cyan-950/5 relative min-h-[300px] overflow-hidden group">
          <div className="absolute inset-0 bg-radial-gradient from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

          <div className="w-full flex justify-between items-center pb-2 border-b border-cyan-500/10 z-10">
            <div className="text-[10px] font-mono tracking-widest text-cyan-400 flex items-center gap-1.5 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
              LIVE MEMBER FEED
            </div>
            <span className="text-[8px] font-mono text-zinc-500">SIGNALS_ACCUMULATED</span>
          </div>

          <div className="my-[10px] flex-1 overflow-y-auto max-h-[190px] space-y-2.5 pr-1.5 custom-terminal-scroll z-10-scroll z-10">
            {liveFeed.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-10">
                <span className="p-2 border border-dashed border-cyan-500/10 rounded-full bg-cyan-950/10 mb-2">
                  <Radio className="w-4 h-4 text-cyan-500/50 animate-pulse" />
                </span>
                <span className="font-mono text-[9px] text-zinc-500 uppercase tracking-widest">Awaiting intercepted signals...</span>
              </div>
            ) : (
              liveFeed.slice(0, 10).map((evt) => {
                let badgeColor = 'border-cyan-500/20 text-cyan-400 bg-cyan-950/20';
                if (evt.type === 'join') badgeColor = 'border-emerald-500/20 text-emerald-400 bg-emerald-950/20';
                else if (evt.type === 'leave') badgeColor = 'border-red-500/20 text-red-400 bg-red-950/20';
                else if (evt.type === 'voice') badgeColor = 'border-amber-500/20 text-amber-400 bg-amber-950/20';

                return (
                  <motion.div 
                    key={evt.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-2 rounded border border-cyan-500/10 bg-zinc-950/50 flex flex-col font-mono text-[9px] hover:border-cyan-400/20 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-300">@{evt.username}</span>
                      <span className="text-zinc-650 text-[8px]">
                        {evt.timestamp.split('T')[1]?.substring(0, 8) || evt.timestamp}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`px-1 rounded text-[7px] border font-bold uppercase ${badgeColor}`}>
                        {evt.type}
                      </span>
                      <span className="text-zinc-400 leading-tight text-[8.5px]">
                        {evt.action}
                      </span>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          <div className="w-full border-t border-cyan-500/10 pt-2 flex justify-between items-center text-[9px] text-zinc-500 font-mono z-10">
            <span>SIG_DECRYPT: SECURE</span>
            <span className="text-cyan-400 text-[8px] animate-pulse">UPLINK_STABLE</span>
          </div>
        </div>

      </div>
    </div>
  );
}
