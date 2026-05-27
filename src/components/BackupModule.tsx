import React, { useState } from 'react';
import { Database, ShieldAlert, Cpu, Download, FileJson, CheckCircle, Brain } from 'lucide-react';
import { BackupRecord } from '../types';

interface BackupModuleProps {
  backups: BackupRecord[];
  onCreateBackup: () => Promise<any>;
}

export default function BackupModule({ backups, onCreateBackup }: BackupModuleProps) {
  const [loading, setLoading] = useState(false);
  const [selectedBackupHex, setSelectedBackupHex] = useState<string | null>(null);
  const [selectedBackupObj, setSelectedBackupObj] = useState<any | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const formatSize = (bytes: number) => {
    return (bytes / 1024).toFixed(2) + ' KB';
  };

  const executeBackupSequence = async () => {
    setLoading(true);
    setSuccessMsg(null);
    try {
      const result = await onCreateBackup();
      if (result && result.backup) {
        setSuccessMsg(`Backup snapshot ${result.backup.id} compiled and cryptographically sealed under standard SHA-256 protocol.`);
        
        // Generate mock hexadecimal stream representations representing secure encryption for our futuristic panel
        const rawHex = stringToHexDump(result.stateDump || JSON.stringify(result.backup));
        setSelectedBackupHex(rawHex);
        setSelectedBackupObj(result.stateDump ? JSON.parse(result.stateDump) : result.backup);

        setTimeout(() => {
          setSuccessMsg(null);
        }, 5000);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Turn string into simulated high density hexadecimal blocks
  const stringToHexDump = (str: string): string => {
    const arr = [];
    for (let i = 0; i < Math.min(str.length, 360); i++) {
      arr.push(str.charCodeAt(i).toString(16).padStart(2, '0').toUpperCase());
    }
    return arr.join(' ');
  };

  const handleInspectBackup = (bk: BackupRecord) => {
    // Generate static simulation parameters based on real hash parameters
    const simulatedHex = bk.encryptedHash + bk.id + "0a5b82dfc701";
    setSelectedBackupHex(simulatedHex.match(/.{1,2}/g)?.join(' ').toUpperCase() || simulatedHex);
    setSelectedBackupObj({
      id: bk.id,
      timestamp: bk.timestamp,
      snapshotSize: bk.snapshotSize,
      rolesCount: bk.rolesCount,
      membersCount: bk.membersCount,
      encryptedChecksum: bk.encryptedHash,
      recoveryProtocol: "STARK-ENCRYPT-AES-GCM"
    });
  };

  return (
    <div id="backup-module-panel" className="bg-zinc-950/80 border border-orange-500/30 p-6 rounded-2xl shadow-[0_0_20px_rgba(249,115,22,0.15)] flex flex-col gap-6 relative overflow-hidden">
      {/* Laser grids grid back pattern red */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0)_50%,rgba(249,115,22,0.02)_50%)] bg-[size:100%_4px] pointer-events-none opacity-40"></div>
      
      <div className="flex justify-between items-center z-10">
        <div>
          <h2 className="text-lg font-bold text-white tracking-wide font-sans flex items-center gap-2">
            <span className="p-1 px-2 text-xs font-mono font-bold uppercase rounded bg-orange-950/50 text-orange-400 border border-orange-500/20">Protocol</span>
            ENCRYPTED DATA ARCHIVES
          </h2>
          <p className="text-xs text-zinc-400 font-mono mt-1">
            Enforce daily snapshots with automated system integrity check.
          </p>
        </div>

        <button
          onClick={executeBackupSequence}
          disabled={loading}
          className={`px-4 py-2 font-mono text-xs font-bold rounded-lg border flex items-center gap-2 transition-all ${
            loading
              ? 'bg-orange-950/20 text-orange-500 border-orange-500/20 cursor-wait'
              : 'bg-orange-950/50 hover:bg-orange-900/50 text-orange-400 border-orange-500/40 hover:shadow-[0_0_15px_rgba(249,115,22,0.3)]'
          }`}
        >
          <Database className="w-4 h-4" />
          {loading ? 'ENCRYPTING SNAPSHOT...' : 'COMPILE NEW SNAPSHOT'}
        </button>
      </div>

      {successMsg && (
        <div className="bg-emerald-950/40 border border-emerald-500/40 p-3 rounded-lg flex gap-2 items-center text-xs text-emerald-300 font-mono z-10 animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 z-10">
        {/* Previous Snapshots table */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-mono tracking-wider text-orange-400 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-orange-400" />
            SECURE BACKUP SYSTEM INDEX
          </span>

          <div className="border border-orange-500/10 rounded-xl overflow-hidden bg-zinc-900/20 max-h-[280px] overflow-y-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-zinc-900/60 text-orange-400/80 border-b border-orange-500/10 sticky top-0">
                <tr>
                  <th className="p-3">SNAP ID</th>
                  <th className="p-3">COMPILED</th>
                  <th className="p-3">SIZE</th>
                  <th className="p-3">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-500/5">
                {backups.map((bk) => (
                  <tr 
                    key={bk.id} 
                    onClick={() => handleInspectBackup(bk)}
                    className="hover:bg-orange-500/5 cursor-pointer transition-colors"
                  >
                    <td className="p-3 font-bold text-orange-300">{bk.id}</td>
                    <td className="p-3 text-zinc-400">
                      {new Date(bk.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="p-3 text-zinc-300">{formatSize(bk.snapshotSize)}</td>
                    <td className="p-3">
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-950/50 border border-emerald-500/30 text-emerald-400">
                        Sealed
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cryptography hex stream viewer */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-mono tracking-wider text-orange-400 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-orange-400" />
            CORE SPECTROMETER CRYPTO INPSECTOR
          </span>

          {selectedBackupHex ? (
            <div className="border border-orange-500/20 rounded-xl bg-zinc-950 p-4 font-mono text-[10px] leading-relaxed relative min-h-[180px] flex flex-col justify-between">
              {/* Scanline glow effect */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-orange-500/10 animate-scan"></div>
              
              <div>
                <div className="flex justify-between items-center text-orange-500/80 mb-3 border-b border-orange-500/15 pb-2">
                  <span>AES-256 SYSTEM METRICS SHA-256 CHECKBLOCK</span>
                  <span className="text-[9px] text-zinc-500">SEAL SNAPSHOT</span>
                </div>
                
                <div className="text-zinc-500 select-all font-semibold break-all bg-zinc-900/50 p-2.5 rounded border border-orange-500/5 line-clamp-3">
                  HEX: {selectedBackupHex}
                </div>

                <div className="grid grid-cols-2 gap-4 mt-3 text-zinc-400">
                  <div>
                    <span className="text-zinc-500 block text-[9px]">ENCRYPTED HASH</span>
                    <span className="text-orange-400 tracking-tighter">
                      {selectedBackupObj?.encryptedChecksum || selectedBackupObj?.encryptedHash || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[9px]">RECORD SUMMARY</span>
                    <span className="text-white">
                      {selectedBackupObj?.rolesCount} roles, {selectedBackupObj?.membersCount} members
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-orange-500/15 flex justify-between items-center">
                <span className="text-zinc-600 text-[9px]">INTEGRITY RATIO: 1.00</span>
                <button
                  onClick={() => {
                    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(selectedBackupObj, null, 2));
                    const dlAnchorElem = document.createElement('a');
                    dlAnchorElem.setAttribute("href",     dataStr     );
                    dlAnchorElem.setAttribute("download", `StarkBackup-${selectedBackupObj?.id || 'snap'}.json`);
                    dlAnchorElem.click();
                  }}
                  className="px-2 py-1 bg-orange-950/40 border border-orange-500/30 text-orange-400 rounded text-[10px] hover:bg-orange-900/30 flex items-center gap-1 transition-colors"
                >
                  <Download className="w-3 h-3" />
                  PULL BACKUP DEPOSIT
                </button>
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-orange-500/20 rounded-xl bg-zinc-950/40 p-8 flex flex-col items-center justify-center text-center text-zinc-500 min-h-[180px]">
              <Brain className="w-8 h-8 text-orange-500/40 animate-pulse mb-3" />
              <p className="text-xs font-mono">NO ACTIVE DIAGNOSTIC CORE INSPECTED</p>
              <p className="text-[10px] font-mono text-zinc-600 mt-1">Select an encrypted snapshot to inspect its SHA-256 signature.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
