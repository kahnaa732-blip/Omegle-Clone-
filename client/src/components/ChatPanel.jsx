import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Zap, 
  Sparkles, 
  Lightbulb, 
  MessageCircle, 
  Lock, 
  AlertTriangle, 
  ShieldCheck,
  Smile
} from 'lucide-react';
import { getRandomIcebreaker } from '../utils/icebreakers.js';
import { inspectMessageForSafety } from '../utils/safetyFilter.js';

export function ChatPanel({
  messages,
  onSendMessage,
  onTyping,
  isPartnerTyping = false,
  isConnected,
  dataChannelReady,
  isE2EEReady = false,
  fingerprint = null,
  onOpenE2EEModal,
  isTextOnlyMode = false
}) {
  const [inputText, setInputText] = useState('');
  const [safetyNotice, setSafetyNotice] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPartnerTyping]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputText(val);

    if (isConnected && onTyping) {
      onTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 1500);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const clean = inputText.trim();
    if (!clean || !isConnected) return;

    // Safety & anti-phishing filter
    const safetyCheck = inspectMessageForSafety(clean);
    if (!safetyCheck.isAllowed) {
      setSafetyNotice(safetyCheck.blockedReason);
      setTimeout(() => setSafetyNotice(null), 4000);
      return;
    }

    if (safetyCheck.warnings && safetyCheck.warnings.length > 0) {
      setSafetyNotice(safetyCheck.warnings[0]);
      setTimeout(() => setSafetyNotice(null), 4000);
    }

    onSendMessage(clean);
    setInputText('');
    if (onTyping) onTyping(false);
  };

  const handleInsertIcebreaker = () => {
    if (!isConnected) return;
    const q = getRandomIcebreaker();
    onSendMessage(q);
  };

  const handleQuickPrompt = (prompt) => {
    if (!isConnected) return;
    onSendMessage(prompt);
  };

  return (
    <div className={`flex flex-col h-full bg-[#090d19]/95 backdrop-blur-xl border-l border-white/[0.08] text-slate-100 select-none ${
      isTextOnlyMode ? 'w-full max-w-4xl mx-auto border-x border-white/[0.08]' : 'w-full md:w-96'
    }`}>
      {/* Header */}
      <div className="p-3.5 sm:p-4 border-b border-white/[0.06] flex items-center justify-between bg-[#0b1122]/60">
        <div className="flex items-center gap-2">
          <div className="relative">
            <MessageCircle className="w-4 h-4 text-cyan-400" />
            <span className={`absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ${
              isConnected ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'
            }`} />
          </div>
          <h2 className="text-xs sm:text-sm font-bold tracking-wide text-white">Live Chat</h2>

          {isE2EEReady && fingerprint ? (
            <button
              onClick={onOpenE2EEModal}
              title="Click to view E2EE cryptographic verification"
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 font-mono text-[10px] border border-cyan-500/30 transition cursor-pointer"
            >
              <Lock className="w-2.5 h-2.5" />
              <span>#{fingerprint.slice(0, 4)}</span>
            </button>
          ) : (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] text-slate-400 font-mono border border-white/[0.06]">
              {dataChannelReady ? 'P2P Direct' : isConnected ? 'Encrypted' : 'Standby'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Zap className={`w-3.5 h-3.5 ${dataChannelReady ? 'text-cyan-400' : 'text-slate-600'}`} />
          <span className="text-[11px] font-mono text-slate-400">{dataChannelReady ? '< 15ms' : '--'}</span>
        </div>
      </div>

      {/* Safety Notice Banner */}
      {safetyNotice && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-3.5 py-2 flex items-center gap-2 text-xs text-amber-300 animate-fade-in">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
          <span className="flex-1 text-[11px]">{safetyNotice}</span>
          <button onClick={() => setSafetyNotice(null)} className="text-amber-400 hover:text-white cursor-pointer">
            &times;
          </button>
        </div>
      )}

      {/* Messages List Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          /* Empty-state Illustration */
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="relative">
              <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500 to-fuchsia-500 rounded-3xl blur-lg opacity-30 animate-glow-pulse" />
              <div className="relative w-14 h-14 rounded-2xl bg-[#0e162a] border border-white/[0.1] flex items-center justify-center text-cyan-300 shadow-xl">
                <Sparkles className="w-7 h-7" />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-bold text-white">Say hello to start!</p>
              <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
                Messages are 256-bit encrypted with zero logs stored on servers.
              </p>
            </div>

            {/* Quick Prompt Starters */}
            {isConnected && (
              <div className="flex flex-col gap-1.5 pt-2 w-full max-w-xs">
                {[
                  '👋 Hey! Where are you from?',
                  'What music do you listen to? 🎵',
                  'What hobbies do you enjoy? ✨'
                ].map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickPrompt(prompt)}
                    className="text-[11px] text-left px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] hover:text-cyan-300 text-slate-300 border border-white/[0.06] transition cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          messages.map((msg, index) => {
            if (msg.type === 'system') {
              return (
                <div key={index} className="flex items-center justify-center my-2">
                  <div className="px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] text-slate-300 text-center max-w-[90%] shadow-sm">
                    {msg.text}
                  </div>
                </div>
              );
            }

            const isYou = msg.sender === 'you';
            return (
              <div
                key={index}
                className={`flex flex-col animate-message ${isYou ? 'items-end' : 'items-start'}`}
              >
                <span className="text-[10px] text-slate-500 mb-0.5 px-1 font-medium">
                  {isYou ? 'You' : 'Stranger'}
                </span>
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed break-words shadow-md ${
                    isYou
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-xs shadow-cyan-600/20'
                      : 'bg-[#12192e] border border-fuchsia-500/20 text-slate-100 rounded-tl-xs shadow-fuchsia-950/20'
                  }`}
                >
                  <div className="flex items-end gap-1.5 justify-between">
                    <span>{msg.text}</span>
                    {msg.e2ee && (
                      <Lock 
                        className={`w-2.5 h-2.5 flex-shrink-0 mb-0.5 ${isYou ? 'text-cyan-200' : 'text-fuchsia-300'}`} 
                        title="End-to-End Encrypted (AES-GCM-256)" 
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Stranger Typing Animated Indicator */}
        {isPartnerTyping && (
          <div className="flex flex-col items-start animate-message">
            <span className="text-[10px] text-slate-500 mb-0.5 px-1 font-medium">Stranger is typing...</span>
            <div className="px-3 py-2 rounded-2xl bg-[#12192e] border border-white/[0.08] text-slate-300 rounded-tl-xs flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Icebreaker Action Bar */}
      {isConnected && (
        <div className="px-3 py-2 border-t border-white/[0.06] flex items-center justify-between gap-2 bg-[#0b101f]/70">
          <button
            onClick={handleInsertIcebreaker}
            className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-xl bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 border border-cyan-500/25 font-semibold transition cursor-pointer"
          >
            <Lightbulb className="w-3.5 h-3.5 text-cyan-400" />
            <span>Random Question</span>
          </button>

          <div className="flex gap-1 overflow-x-auto scrollbar-none">
            {['👋 Hey!', 'What music do you like?', 'Favorite game?'].map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleQuickPrompt(prompt)}
                className="text-[10px] whitespace-nowrap px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.06] transition cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Modern Chat Input Form */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-white/[0.06] bg-[#070b16] flex items-center gap-2">
        <div className="flex-1 flex items-center bg-[#10172b] border border-white/[0.1] rounded-2xl px-3 py-1 focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-500/20 transition-all">
          <input
            type="text"
            maxLength={500}
            value={inputText}
            onChange={handleInputChange}
            placeholder={isConnected ? 'Type an encrypted message...' : 'Waiting for connection...'}
            disabled={!isConnected}
            className="w-full bg-transparent py-2 text-xs text-white placeholder-slate-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <button
          type="submit"
          disabled={!inputText.trim() || !isConnected}
          className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-600 hover:from-cyan-400 hover:to-fuchsia-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 text-white shadow-md shadow-cyan-500/20 transition-all cursor-pointer group"
          aria-label="Send message"
        >
          <Send className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </form>
    </div>
  );
}
