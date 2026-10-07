import React from 'react';
import { 
  Play, 
  SkipForward, 
  Square, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Settings, 
  ShieldAlert,
  Ban,
  ShieldCheck,
  Monitor,
  Volume2,
  VolumeX,
  LogOut
} from 'lucide-react';

export function ControlBar({
  chatMode = 'text',
  connectionState,
  onStart,
  onNext,
  onStop,
  onToggleMic,
  onToggleVideo,
  isAudioMuted,
  isVideoMuted,
  isScreenSharing,
  onToggleScreenShare,
  soundEnabled,
  onToggleSound,
  onOpenSettings,
  onReport,
  onBlock,
  onEmergencyExit,
  onOpenRules,
  reputation
}) {
  const isConnected = connectionState === 'connected';
  const isWaiting = connectionState === 'waiting';
  const isIdle = connectionState === 'idle';

  return (
    <footer className="relative z-20 py-3 px-3 sm:px-6 bg-[#060a14]/90 backdrop-blur-xl border-t border-cyan-500/15 flex items-center justify-between gap-2 select-none safe-bottom transition-all">
      {/* Subtle top neon ambient hairline */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent pointer-events-none" />

      {/* Left: Leave / Stop Action (Secondary, quiet) */}
      <div className="flex items-center gap-2 shrink-0">
        {!isIdle ? (
          <button
            onClick={onStop}
            title="Leave conversation (Stop matching)"
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-rose-500/15 text-slate-300 hover:text-rose-300 border border-white/10 hover:border-rose-500/30 text-xs font-semibold tracking-wide transition-all active:scale-95"
          >
            <Square className="w-3.5 h-3.5 fill-current text-rose-400" />
            <span className="hidden sm:inline">Leave</span>
          </button>
        ) : (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Ready</span>
          </div>
        )}

        {/* In-Call Safety Block Action */}
        {isConnected && (
          <button
            onClick={onBlock}
            title="Block stranger from matching with you again"
            className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-rose-500/15 text-slate-400 hover:text-rose-300 border border-white/10 hover:border-rose-500/30 transition-all active:scale-95"
          >
            <Ban className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Center: PRIMARY HERO ACTION ("NEXT CHAT" / "START CHAT") */}
      <div className="flex items-center justify-center flex-1 max-w-md mx-auto">
        {isIdle ? (
          <button
            onClick={onStart}
            className="group relative flex items-center justify-center gap-2.5 w-full sm:w-auto px-7 sm:px-10 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-fuchsia-600 hover:from-cyan-400 hover:via-indigo-500 hover:to-fuchsia-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
            <span>START CONVERSATION</span>
            <kbd className="hidden md:inline-block ml-1 px-1.5 py-0.5 text-[10px] bg-black/30 rounded border border-white/20 text-cyan-200 font-mono">
              Space
            </kbd>
          </button>
        ) : (
          <button
            onClick={onNext}
            className="group relative flex items-center justify-center gap-2.5 w-full sm:w-auto px-7 sm:px-10 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-fuchsia-600 hover:from-cyan-400 hover:via-indigo-500 hover:to-fuchsia-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/45 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <SkipForward className="w-4 h-4 text-white group-hover:translate-x-0.5 transition-transform" />
            <span>NEXT CHAT</span>
            <kbd className="hidden md:inline-block ml-1 px-1.5 py-0.5 text-[10px] bg-black/30 rounded border border-white/20 text-cyan-200 font-mono">
              Esc
            </kbd>
          </button>
        )}
      </div>

      {/* Right: Secondary Tools & Hardware Controls (Visually Quieter) */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {chatMode === 'video' && (
          <>
            {/* Microphone Toggle */}
            <button
              onClick={onToggleMic}
              title={isAudioMuted ? 'Unmute Microphone' : 'Mute Microphone'}
              aria-label={isAudioMuted ? 'Unmute Microphone' : 'Mute Microphone'}
              className={`p-2.5 sm:p-3 rounded-xl border transition-all active:scale-95 ${
                isAudioMuted
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 shadow-sm shadow-rose-500/20'
                  : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 hover:border-cyan-500/30 text-slate-300 hover:text-white'
              }`}
            >
              {isAudioMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Camera Toggle */}
            <button
              onClick={onToggleVideo}
              title={isVideoMuted ? 'Turn Camera On' : 'Turn Camera Off'}
              aria-label={isVideoMuted ? 'Turn Camera On' : 'Turn Camera Off'}
              className={`p-2.5 sm:p-3 rounded-xl border transition-all active:scale-95 ${
                isVideoMuted
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 shadow-sm shadow-rose-500/20'
                  : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 hover:border-cyan-500/30 text-slate-300 hover:text-white'
              }`}
            >
              {isVideoMuted ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
            </button>

            {/* Screen Share (when in call) */}
            {isConnected && (
              <button
                onClick={onToggleScreenShare}
                title={isScreenSharing ? 'Stop Screen Sharing' : 'Share Screen'}
                aria-label={isScreenSharing ? 'Stop Screen Sharing' : 'Share Screen'}
                className={`p-2.5 sm:p-3 rounded-xl border transition-all active:scale-95 ${
                  isScreenSharing
                    ? 'bg-cyan-500/25 border-cyan-500/50 text-cyan-300 shadow-sm shadow-cyan-500/25'
                    : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 hover:border-cyan-500/30 text-slate-300 hover:text-white'
                }`}
              >
                <Monitor className="w-4 h-4" />
              </button>
            )}
          </>
        )}

        {/* Audio Sound FX Toggle */}
        <button
          onClick={onToggleSound}
          title={soundEnabled ? 'Mute Chimes' : 'Enable Chimes'}
          aria-label={soundEnabled ? 'Mute Chimes' : 'Enable Chimes'}
          className="p-2.5 sm:p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-cyan-500/30 text-slate-400 hover:text-slate-200 transition-all active:scale-95"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Safety Report Flag */}
        {isConnected && (
          <button
            onClick={onReport}
            title="Report violation"
            aria-label="Report violation"
            className="p-2.5 sm:p-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 transition-all active:scale-95"
          >
            <ShieldAlert className="w-4 h-4" />
          </button>
        )}

        {/* Settings Gear */}
        <button
          onClick={onOpenSettings}
          title="Audio, Video & Privacy Settings"
          aria-label="Audio, Video & Privacy Settings"
          className="p-2.5 sm:p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-cyan-500/30 text-slate-400 hover:text-slate-200 transition-all active:scale-95"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </footer>
  );
}
