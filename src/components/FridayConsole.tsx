import React, { useState } from 'react';
import { Bot, Radio, Send, LifeBuoy, CheckCircle, PlusCircle, BrainCircuit, ShieldAlert } from 'lucide-react';
import { SupportTicket } from '../types';

interface FridayConsoleProps {
  tickets: SupportTicket[];
  onSubmitTicketReply: (id: string, text: string, sender: 'user' | 'friday') => Promise<any>;
  onCloseTicket: (id: string, status: 'resolved' | 'assigned') => Promise<any>;
  onSynthesizeTicket: () => Promise<any>;
}

export default function FridayConsole({
  tickets,
  onSubmitTicketReply,
  onCloseTicket,
  onSynthesizeTicket
}: FridayConsoleProps) {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(tickets[0]?.id || null);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSimulatingBot, setIsSimulatingBot] = useState(false);

  // General chat states for F.R.I.D.A.Y AI Assistant Prompting
  const [generativePromptType, setGenerativePromptType] = useState<'onboarding' | 'ticket-triage' | 'general'>('general');
  const [promptInput, setPromptInput] = useState('');
  const [aiOutputResult, setAiOutputResult] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId);

  const handleSendReply = async (sender: 'user' | 'friday') => {
    if (!selectedTicketId || !replyText.trim()) return;
    setIsSending(true);
    try {
      await onSubmitTicketReply(selectedTicketId, replyText, sender);
      setReplyText('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  // Triggers user prompt post that commands F.R.I.D.A.Y's cognitive Gemini core
  const handleTriggerAICommand = async (type: 'onboarding' | 'ticket-triage') => {
    setLoadingAi(true);
    setAiOutputResult(null);
    setGenerativePromptType(type);
    
    let defaultPrompt = '';
    if (type === 'onboarding') {
      defaultPrompt = "Suggest an automated verification process where a Stark Security Bot onboard a new Citizen by checking authorization tokens and assigning security matrix roles.";
    } else {
      defaultPrompt = "Propose an automated ticket sorting routine where sector integrity alerts are triaged by criticality level with automatic backup locks if critical warnings are detected.";
    }

    try {
      const response = await fetch('/api/friday/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt: defaultPrompt, currentPromptType: type })
      });
      const data = await response.json();
      setAiOutputResult(data.text || data.error || "System timed out.");
    } catch (err: any) {
      setAiOutputResult(`Cognitive exception: ${err.message || 'Failure connecting to Gemini subprocessor.'}`);
    } finally {
      setLoadingAi(false);
    }
  };

  const handleCustomPromptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim()) return;
    setLoadingAi(true);
    setAiOutputResult(null);
    setGenerativePromptType('general');

    try {
      const response = await fetch('/api/friday/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt: promptInput, currentPromptType: 'general' })
      });
      const data = await response.json();
      setAiOutputResult(data.text || data.error || "No output returned.");
      setPromptInput('');
    } catch (err: any) {
      setAiOutputResult(`Interface failure: ${err.message}`);
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div id="friday-console-panel" className="relative grid grid-cols-1 lg:grid-cols-3 gap-6 bg-zinc-950/80 border border-cyan-500/30 p-6 rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.15)] overflow-hidden">
      {/* Laser grids backing */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0)_50%,rgba(6,182,212,0.02)_50%)] bg-[size:100%_4px] pointer-events-none opacity-40"></div>

      {/* Grid Left Column: Ticket Indexer */}
      <div className="lg:border-r lg:border-cyan-500/10 lg:pr-6 flex flex-col gap-4 z-10 min-h-[350px]">
        <div className="flex justify-between items-center pb-2 border-b border-cyan-500/10">
          <div>
            <h3 className="text-xs font-bold text-cyan-400 font-mono tracking-widest uppercase flex items-center gap-1.5">
              <LifeBuoy className="w-4 h-4 text-cyan-400" />
              SUPPORT CONDUIT INDEX
            </h3>
            <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">Automated queue channels</span>
          </div>
          
          <button
            onClick={() => onSynthesizeTicket()}
            className="p-1 text-cyan-400 border border-cyan-500/20 hover:border-cyan-500/40 bg-cyan-950/20 rounded hover:shadow-[0_0_8px_rgba(6,182,212,0.2)] transition-all font-mono text-[9px] flex items-center gap-1 font-bold"
            title="Inject Random Support Ticket"
          >
            <PlusCircle className="w-3 h-3" />
            SYNTH
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-terminal-scroll max-h-[360px]">
          {tickets.map((tkt) => {
            const isSelected = selectedTicketId === tkt.id;
            return (
              <div
                key={tkt.id}
                onClick={() => setSelectedTicketId(tkt.id)}
                className={`p-3 border rounded-xl cursor-pointer transition-all flex flex-col gap-1.5 relative overflow-hidden ${
                  isSelected
                    ? 'bg-cyan-950/30 border-cyan-400/80 shadow-[0_0_10px_rgba(6,182,212,0.1)]'
                    : 'bg-zinc-900/10 border-cyan-500/10 hover:border-cyan-500/30'
                }`}
              >
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className={`font-semibold ${isSelected ? 'text-cyan-300' : 'text-zinc-400'}`}>
                    #{tkt.channelName}
                  </span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[8.5px] border uppercase ${
                    tkt.status === 'open'
                      ? 'bg-red-950/40 border-red-500/30 text-red-400 animate-pulse'
                      : tkt.status === 'assigned'
                      ? 'bg-amber-950/40 border-amber-500/30 text-amber-400'
                      : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                  }`}>
                    {tkt.status}
                  </span>
                </div>
                <span className="text-white text-xs font-semibold font-sans truncate">{tkt.title}</span>
                <span className="text-[10px] text-zinc-500 font-mono">User: @{tkt.author}</span>
              </div>
            );
          })}

          {tickets.length === 0 && (
            <div className="py-12 text-center text-zinc-650 font-mono text-[10px]">
              SUPPORT CHANNELS CLEAR. NO TICKETS DETECTED.
            </div>
          )}
        </div>
      </div>

      {/* Grid Middle Column: Active Conversation Log Log */}
      <div className="lg:col-span-2 flex flex-col gap-4 z-10 justify-between min-h-[420px]">
        {selectedTicket ? (
          <div className="flex-1 flex flex-col justify-between gap-3">
            {/* Conversations Header */}
            <div className="flex flex-wrap items-center justify-between pb-3 border-b border-cyan-500/10 gap-2">
              <div>
                <span className="text-xs font-bold text-white font-mono block uppercase">
                  ACTIVE FEED MODULE: #{selectedTicket.channelName}
                </span>
                <p className="text-[10px] text-zinc-500 font-mono mt-0.5" title={selectedTicket.description}>
                  Subject: {selectedTicket.title}
                </p>
              </div>

              {selectedTicket.status !== 'resolved' && (
                <button
                  onClick={() => onCloseTicket(selectedTicket.id, 'resolved')}
                  className="px-2.5 py-1 bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-900/30 font-mono text-[10px] font-bold rounded flex items-center gap-1 transition-colors"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  RESOLVE DIALOGUE
                </button>
              )}
            </div>

            {/* Conversation Logs Scroller SCROLLS */}
            <div className="flex-1 bg-zinc-950/50 border border-cyan-500/5 rounded-xl p-4 overflow-y-auto max-h-[220px] space-y-3 custom-terminal-scroll">
              <div className="p-3 bg-cyan-950/10 border border-cyan-500/10 rounded-lg max-w-[90%] text-zinc-300 relative text-xs">
                <span className="text-[10px] font-mono text-cyan-400 block font-semibold mb-1">
                  &lt;TICKET DESCRIPTION&gt;
                </span>
                {selectedTicket.description}
              </div>

              {selectedTicket.conversation.map((msg, idx) => {
                const isFriday = msg.sender === 'friday';
                return (
                  <div
                    key={idx}
                    className={`flex flex-col gap-1 max-w-[85%] ${
                      isFriday ? 'ml-auto items-end' : 'mr-auto items-start'
                    }`}
                  >
                    <div 
                      className={`p-3 rounded-xl text-xs leading-relaxed ${
                        isFriday
                          ? 'bg-cyan-950/40 border border-cyan-500/30 text-cyan-200'
                          : 'bg-zinc-900/60 border border-zinc-800 text-zinc-300'
                      }`}
                    >
                      <span className={`text-[9.5px] font-mono block mb-1 font-bold tracking-wider ${
                        isFriday ? 'text-cyan-400 text-right' : 'text-zinc-500'
                      }`}>
                        {isFriday ? 'F.R.I.D.A.Y. SECURE' : `@${selectedTicket.author.toUpperCase()}`}
                      </span>
                      <p className="text-left select-all">{msg.message}</p>
                    </div>
                    <span className="text-[9px] text-zinc-650 font-mono">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Response Input panel */}
            {selectedTicket.status !== 'resolved' ? (
              <div className="flex flex-col gap-2 bg-zinc-900/20 p-3.5 rounded-xl border border-cyan-500/10">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Enter support dispatch payload..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendReply('friday');
                    }}
                    className="flex-1 bg-zinc-950 border border-cyan-500/20 p-2.5 rounded-lg text-white focus:outline-none focus:border-cyan-400/50 text-xs placeholder-zinc-700 font-mono"
                  />
                  <button
                    onClick={() => handleSendReply('friday')}
                    disabled={isSending || !replyText.trim()}
                    className="px-4 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-400 font-bold rounded-lg text-xs hover:shadow-[0_0_10px_rgba(6,182,212,0.35)] disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center justify-center"
                    title="Transmit as Stark Administrator"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex justify-between items-center text-[9px] font-mono text-cyan-500/70">
                  <span>Enter transmits reply directly.</span>
                  
                  {/* F.R.I.D.A.Y. Auto Cognitive trigger bot reply */}
                  <button
                    onClick={async () => {
                      if (!replyText.trim()) return;
                      // Trigger reply as User first, which then automatically invokes F.R.I.D.A.Y's Gemini AI!
                      setIsSimulatingBot(true);
                      try {
                        await onSubmitTicketReply(selectedTicket.id, replyText, 'user');
                        setReplyText('');
                      } catch (err) {
                        console.error(err);
                      } finally {
                        setIsSimulatingBot(false);
                      }
                    }}
                    disabled={isSimulatingBot || !replyText.trim()}
                    className="hover:text-cyan-300 font-bold flex items-center gap-1 text-[10px]"
                    title="User reply triggers F.R.I.D.A.Y.'s Gemini intelligence automatically"
                  >
                    <Bot className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
                    SIMULATE USER QUERY (AUTO-REPLY BOT ACTIVE)
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-xl flex items-center justify-center text-center font-mono text-emerald-400 text-xs gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>DIALOGUE CLEAR: THIS CONDUIT IS RESOLVED AND SYSTEM BACKED UP</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 border border-dashed border-cyan-500/20 rounded-xl bg-zinc-950/20 min-h-[300px] text-zinc-500 text-center">
            <Bot className="w-10 h-10 text-cyan-500/30 animate-pulse mb-3" />
            <span className="font-mono text-xs text-zinc-400 block font-semibold">COGNITIVE SUPPORT INTERFACE DISENGAGED</span>
            <span className="font-mono text-[10px] text-zinc-650 mt-1">Select an active support ticket in the left index to engage connection.</span>
          </div>
        )}
      </div>

      {/* Grid Bottom row: Generative Training Sequencer */}
      <div className="lg:col-span-3 border-t border-cyan-500/10 pt-6 mt-4 z-10 flex flex-col gap-4">
        <div>
          <h3 className="text-xs font-bold text-cyan-400 font-mono tracking-widest uppercase flex items-center gap-1.5">
            <BrainCircuit className="w-4 h-4 text-cyan-400 animate-pulse" />
            F.R.I.D.A.Y. AUTOMATOR (GEMINI COGNITIVE ACTION PANEL)
          </h3>
          <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
            Command F.R.I.D.A.Y. to plan security parameters, onboarding sequences, or custom administrative structures.
          </p>
        </div>

        {/* Diagnostic prompt tools */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
          <button
            onClick={() => handleTriggerAICommand('onboarding')}
            disabled={loadingAi}
            className="p-3 bg-zinc-900/30 hover:bg-cyan-950/20 border border-cyan-500/10 hover:border-cyan-400/40 text-cyan-300 rounded-xl flex flex-col gap-1 items-start text-left disabled:opacity-50 transition-all shadow-sm hover:shadow-[0_0_12px_rgba(6,182,212,0.1)]"
          >
            <span className="font-bold text-white uppercase text-[10px]">DEPLOY MEMBER ONBOARDING SEQUENCE</span>
            <span className="text-[9.5px] text-zinc-500">Generate a secure multi-role clearance onboarding protocol block.</span>
          </button>

          <button
            onClick={() => handleTriggerAICommand('ticket-triage')}
            disabled={loadingAi}
            className="p-3 bg-zinc-900/30 hover:bg-cyan-950/20 border border-cyan-500/10 hover:border-cyan-400/40 text-cyan-300 rounded-xl flex flex-col gap-1 items-start text-left disabled:opacity-50 transition-all shadow-sm hover:shadow-[0_0_12px_rgba(6,182,212,0.1)]"
          >
            <span className="font-bold text-white uppercase text-[10px]">DEPLOY FAULT TRIAGING ROUTINE</span>
            <span className="text-[9.5px] text-zinc-500">Plan automated diagnostics sorting by priority parameters.</span>
          </button>
        </div>

        {/* Prompt free-form input */}
        <form onSubmit={handleCustomPromptSubmit} className="flex gap-2">
          <input
            type="text"
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            placeholder="Command F.R.I.D.A.Y. custom directives... (e.g. 'Audit role-creator capabilities')"
            className="flex-1 bg-zinc-950 border border-cyan-500/20 p-2.5 rounded-lg text-white focus:outline-none focus:border-cyan-400/50 text-xs placeholder-zinc-850 font-mono"
          />
          <button
            type="submit"
            disabled={loadingAi || !promptInput.trim()}
            className="px-4 py-2.5 bg-cyan-950/50 hover:bg-cyan-900/50 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 cursor-pointer disabled:opacity-30 disabled:pointer-events-none rounded-lg font-mono text-xs font-bold transition-all hover:shadow-[0_0_10px_rgba(6,182,212,0.25)] flex items-center justify-center shrink-0"
          >
            {loadingAi ? 'COGNIZING...' : 'TRANSMIT DIRECTIVE'}
          </button>
        </form>

        {/* Generative response drawer */}
        {(loadingAi || aiOutputResult) && (
          <div className="p-4 bg-zinc-950 border border-cyan-400/20 rounded-xl font-mono text-[11px] leading-relaxed relative overflow-hidden transition-all animate-fade-in text-zinc-300">
            {/* Holographic sweep lines */}
            <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-cyan-400/20 animate-scan"></div>
            
            <span className="text-[10px] text-cyan-400 block font-bold uppercase mb-2 tracking-wider">
              {generativePromptType === 'onboarding' ? 'Clearance Onboarding Protocol Sequence' : generativePromptType === 'ticket-triage' ? 'Subprocess Triaging Routine Guide' : 'Direct AI Cognitive Output'}
            </span>

            {loadingAi ? (
              <div className="flex items-center gap-2 text-cyan-500 animate-pulse py-4">
                <Bot className="w-5 h-5 text-cyan-400 animate-spin" />
                <span>SYNTHESIZING COGNITIVE BLOCKS FROM STARK MATRIX CORE... PLEASE STANDBY</span>
              </div>
            ) : (
              <div className="whitespace-pre-wrap select-text selection:bg-cyan-950 selection:text-cyan-300 leading-normal">
                {aiOutputResult}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
