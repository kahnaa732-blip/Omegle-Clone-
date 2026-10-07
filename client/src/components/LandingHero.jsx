import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Video, 
  Lock, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  Hash, 
  Plus, 
  X, 
  Globe, 
  Key,
  Zap,
  Shield,
  Activity,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { AVAILABLE_LANGUAGES } from '../utils/languages.js';

const SUGGESTED_TOPICS = ['gaming', 'anime', 'music', 'coding', 'movies', 'books', 'philosophy', 'travel'];

function ParticleCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // 32 lightweight animated particles with connection lines
    const particles = Array.from({ length: 32 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      radius: Math.random() * 1.5 + 0.8,
      color: Math.random() > 0.5 ? 'rgba(6, 182, 212, ' : 'rgba(236, 72, 153, '
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw delicate connection lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(99, 102, 241, ${0.16 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }

      // Draw particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color + '0.7)';
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none opacity-45" />;
}

export function LandingHero({
  onlineCount = 1,
  chatMode = 'text',
  onChangeChatMode,
  language = 'any',
  onChangeLanguage,
  interests = [],
  onAddInterest,
  onRemoveInterest,
  onStartChat,
  onOpenLegalTab,
  onOpenModeration,
  canGoForward = false,
  onGoForward
}) {
  const [rulesAccepted, setRulesAccepted] = useState(true);
  const [topicInput, setTopicInput] = useState('');

  // Global keydown listener on landing screen to start chat with Space/Enter
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        if (rulesAccepted) {
          onStartChat();
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [rulesAccepted, onStartChat]);

  const handleAddTopic = (t) => {
    const clean = (t || topicInput).trim().toLowerCase();
    if (!clean) return;
    if (!interests.includes(clean)) {
      onAddInterest(clean);
    }
    setTopicInput('');
  };

  const handleTopicKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTopic();
    }
  };

  return (
    <div className="relative flex-1 flex flex-col justify-between overflow-y-auto bg-[#07090e] bg-cyber-grid select-none">
      {/* High-Impact Atmospheric Background Artwork */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none opacity-45 sm:opacity-55 transition-opacity duration-1000"
        style={{ backgroundImage: "url('/background.jpg')" }}
      />

      {/* Atmospheric Dark Gradient & Vignette Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#060a14]/90 via-[#070b16]/75 to-[#060a14]/95 pointer-events-none" />

      {/* Background Particle Layer */}
      <ParticleCanvas />

      {/* Atmospheric Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-gradient-to-r from-cyan-600/15 via-indigo-600/15 to-fuchsia-600/15 blur-[100px] pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-10 px-4 sm:px-8 py-3.5 border-b border-white/[0.06] backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Top Navigation: Backward & Forward buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                if (window.history.length > 1) {
                  window.history.back();
                }
              }}
              title="Go Back"
              aria-label="Go Back"
              className="p-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] text-slate-400 hover:text-white border border-white/10 transition-all cursor-pointer active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (onGoForward) onGoForward();
                else if (onStartChat) onStartChat();
                else window.history.forward();
              }}
              title="Go Forward to Chat"
              aria-label="Go Forward to Chat"
              className="p-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/25 text-cyan-400 hover:text-white border border-cyan-500/25 hover:border-cyan-400 transition-all cursor-pointer active:scale-95 shadow-sm shadow-cyan-500/10"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <img 
              src="/logo.png" 
              alt="Omnexlo Logo" 
              className="w-8 h-8 rounded-xl object-cover shadow-md shadow-cyan-500/20 ring-1 ring-white/10" 
            />
            <span className="font-extrabold tracking-wider text-sm sm:text-base text-white">OMNEXLO</span>
          </div>
        </div>

        {/* Live Active Online Counter */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-white/[0.08] text-xs shadow-sm">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-slate-400 text-[11px]">Live:</span>
          <span className="font-semibold text-white">{onlineCount}</span>
        </div>
      </header>

      {/* Main Centerpiece Hero */}
      <main className="relative z-10 max-w-xl w-full mx-auto px-4 py-4 sm:py-6 flex-1 flex flex-col justify-center space-y-4">
        {/* Visual Centerpiece: Glowing Logo */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-1">
            <div className="relative group">
              {/* Pulsing Backglow Aura */}
              <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 rounded-full blur-xl opacity-60 group-hover:opacity-85 transition duration-700 animate-glow-pulse" />
              <img
                src="/logo.png"
                alt="Omnexlo Logo Centerpiece"
                className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover shadow-2xl ring-2 ring-white/20"
              />
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Meet strangers. <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-fuchsia-400">Instantly.</span>
          </h1>

          {/* Privacy Statement */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-400">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06]">
              <Lock className="w-3 h-3 text-cyan-400" />
              <span>256-Bit E2EE</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06]">
              <Shield className="w-3 h-3 text-fuchsia-400" />
              <span>Zero Registration</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06]">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Ultra-Smooth</span>
            </span>
          </div>
        </div>

        {/* Compact Settings & Matchmaking Panel */}
        <div className="bg-[#0b101e]/85 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-4 sm:p-5 shadow-2xl shadow-black/60 space-y-3.5">
          {/* Mode Selector */}
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Conversation Mode">
            <button
              type="button"
              onClick={() => onChangeChatMode('text')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                chatMode === 'text'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 border-cyan-400/40 text-white shadow-md shadow-cyan-600/30'
                  : 'bg-white/[0.03] border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.06]'
              }`}
              aria-checked={chatMode === 'text'}
              role="radio"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Text Chat</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeChatMode('video')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                chatMode === 'video'
                  ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 border-fuchsia-400/40 text-white shadow-md shadow-fuchsia-600/30'
                  : 'bg-white/[0.03] border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.06]'
              }`}
              aria-checked={chatMode === 'video'}
              role="radio"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Video Chat</span>
            </button>
          </div>

          {/* Preferences Row: Language & Topic Interests */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Language Preference */}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Globe className="w-3 h-3 text-cyan-400" />
                <span>Language (Optional)</span>
              </label>
              <select
                value={language}
                onChange={(e) => onChangeLanguage && onChangeLanguage(e.target.value)}
                className="w-full bg-[#111728] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                {AVAILABLE_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-[#0b101e] text-white">
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Topic Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Hash className="w-3 h-3 text-fuchsia-400" />
                <span>Interests (Optional)</span>
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  onKeyDown={handleTopicKeyDown}
                  placeholder={interests.length === 0 ? "Add tags (e.g. anime, music)..." : "Add tag..."}
                  className="flex-1 bg-[#111728] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-fuchsia-400"
                />
                {topicInput.trim() && (
                  <button
                    onClick={() => handleAddTopic()}
                    className="p-2 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white transition cursor-pointer"
                    aria-label="Add topic tag"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Active Interest Chips & Suggestions */}
          {(interests.length > 0 || SUGGESTED_TOPICS.length > 0) && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              {interests.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[11px] font-medium"
                >
                  #{t}
                  <button
                    onClick={() => onRemoveInterest(t)}
                    className="hover:text-white rounded-full p-0.5 cursor-pointer"
                    aria-label={`Remove tag ${t}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {interests.length < 3 && (
                <div className="flex flex-wrap items-center gap-1 text-[10px] text-slate-500">
                  {SUGGESTED_TOPICS.filter((s) => !interests.includes(s)).slice(0, 4).map((s) => (
                    <button
                      key={s}
                      onClick={() => handleAddTopic(s)}
                      className="px-2 py-0.5 rounded-md bg-white/[0.03] hover:bg-white/[0.08] text-slate-400 hover:text-white border border-white/[0.05] transition cursor-pointer"
                    >
                      +{s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Community Safety Confirmation */}
          <div className="pt-1 border-t border-white/[0.05]">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rulesAccepted}
                onChange={(e) => setRulesAccepted(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-white/20 bg-dark-900 text-cyan-500 focus:ring-cyan-400 cursor-pointer"
              />
              <span className="text-[11px] text-slate-400">
                I am 18+ and agree to the{' '}
                <button
                  type="button"
                  onClick={() => onOpenLegalTab('community')}
                  className="text-cyan-400 hover:underline inline"
                >
                  Safety Guidelines
                </button>
              </span>
            </label>
          </div>

          {/* Large Animated Start Conversation Button */}
          <div className="pt-1">
            <button
              onClick={onStartChat}
              disabled={!rulesAccepted}
              className="w-full py-3.5 sm:py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-fuchsia-600 hover:from-cyan-400 hover:via-blue-500 hover:to-fuchsia-500 text-white font-bold text-sm sm:text-base shadow-xl shadow-cyan-500/25 transition-all transform active:scale-[0.99] flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer group"
            >
              <span>Start Conversation</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-center text-[10px] text-slate-500 mt-1.5">
              Press <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.1] font-mono text-[9px] text-slate-300">Space</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.1] font-mono text-[9px] text-slate-300">Enter</kbd> to connect instantly
            </p>
          </div>
        </div>
      </main>

      {/* Sleek Minimal Footer */}
      <footer className="relative z-10 px-6 py-3 border-t border-white/[0.05] bg-[#07090e]/90 text-center space-y-1">
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-[11px] text-slate-500">
          <button onClick={() => onOpenLegalTab('community')} className="hover:text-cyan-400 transition">
            Guidelines
          </button>
          <button onClick={() => onOpenLegalTab('privacy')} className="hover:text-cyan-400 transition">
            Privacy
          </button>
          <button onClick={() => onOpenLegalTab('terms')} className="hover:text-cyan-400 transition">
            Terms
          </button>
          <button onClick={() => onOpenLegalTab('safety')} className="hover:text-cyan-400 transition">
            Safety
          </button>
          <button onClick={() => onOpenLegalTab('how_it_works')} className="hover:text-cyan-400 transition">
            How It Works
          </button>
          <button onClick={() => onOpenLegalTab('faq')} className="hover:text-cyan-400 transition">
            FAQ
          </button>
          {onOpenModeration && (
            <button 
              onClick={onOpenModeration} 
              className="hover:text-slate-300 transition flex items-center gap-1"
              title="Moderation Console"
            >
              <Key className="w-2.5 h-2.5" />
              <span>Console</span>
            </button>
          )}
        </div>
        <p className="text-[10px] text-slate-600">
          © 2026 Omnexlo • Private, encrypted random conversations worldwide.
        </p>
      </footer>
    </div>
  );
}
