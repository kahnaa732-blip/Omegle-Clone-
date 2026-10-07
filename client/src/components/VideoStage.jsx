import React, { useRef, useEffect, useState } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Eye, 
  VideoOff, 
  Lock, 
  Flag,
  Camera,
  Maximize,
  FlipHorizontal,
  Sparkles,
  MessageSquare,
  Monitor,
  MicOff,
  Zap,
  Radio
} from 'lucide-react';
import { ReactionsOverlay } from './ReactionsOverlay.jsx';

export function VideoStage({
  chatMode = 'video',
  localStream,
  remoteStream,
  isAudioMuted,
  isVideoMuted,
  isScreenSharing,
  connectionState,
  shieldActive,
  onOverrideShield,
  onReport,
  riskMetrics,
  iceState,
  sharedInterests = [],
  reactions = [],
  onSendReaction
}) {
  const containerRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [isMirrored, setIsMirrored] = useState(true);

  // Attach local stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const isConnected = connectionState === 'connected';
  const isWaiting = connectionState === 'waiting';

  // Snapshot Memory Feature
  const handleCaptureSnapshot = () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#07090e';
      ctx.fillRect(0, 0, 1280, 720);

      if (remoteVideoRef.current && remoteVideoRef.current.videoWidth) {
        ctx.drawImage(remoteVideoRef.current, 0, 0, 640, 720);
      }
      if (localVideoRef.current && localVideoRef.current.videoWidth) {
        ctx.drawImage(localVideoRef.current, 640, 0, 640, 720);
      }

      // Watermark
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = 'bold 24px Outfit, sans-serif';
      ctx.fillText('OMNEXLO MEMORY', 40, 670);

      const link = document.createElement('a');
      link.download = `omnexlo_chat_${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.warn('Snapshot error:', err);
    }
  };

  // Fullscreen Mode
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-full bg-[#080c16] rounded-2xl sm:rounded-3xl overflow-hidden border border-white/[0.08] shadow-2xl flex items-center justify-center select-none"
    >
      {/* Dynamic Floating Emojis Layer */}
      <ReactionsOverlay
        reactions={reactions}
        onSendReaction={onSendReaction}
        isConnected={isConnected}
      />

      {/* 1. MATCHMAKING RADAR STATE (Never left blank!) */}
      {isWaiting && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-[#080c16]/90 backdrop-blur-md overflow-hidden animate-fade-in">
          {/* Background Artwork Underlay */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30 filter blur-[2px] pointer-events-none"
            style={{ backgroundImage: "url('/background.jpg')" }}
          />
          <div className="absolute inset-0 bg-[#080c16]/80 pointer-events-none" />

          {/* Subtle Background Grid & Star Particles */}
          <div className="absolute inset-0 bg-cyber-grid opacity-30 pointer-events-none" />

          {/* Concentric Pulsing Radar Rings */}
          <div className="relative flex items-center justify-center w-72 h-72 sm:w-96 sm:h-96">
            <div className="absolute inset-0 rounded-full border border-cyan-500/25 animate-radar-1" />
            <div className="absolute inset-0 rounded-full border border-indigo-500/20 animate-radar-2" />
            <div className="absolute inset-0 rounded-full border border-fuchsia-500/25 animate-radar-3" />

            {/* Glowing Center Logo with Breathing Aura */}
            <div className="relative z-10 flex flex-col items-center justify-center">
              <div className="relative">
                <div className="absolute -inset-3 bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 rounded-3xl blur-xl opacity-70 animate-glow-pulse" />
                <img
                  src="/logo.png"
                  alt="Connecting"
                  className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover shadow-2xl ring-2 ring-white/20 animate-pulse"
                />
              </div>
            </div>
          </div>

          {/* Radar Scanning Typography */}
          <div className="relative z-10 mt-4 space-y-2 max-w-sm">
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
              <span>Finding someone new</span>
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            </h3>

            <p className="text-xs text-slate-400 leading-relaxed">
              {sharedInterests.length > 0
                ? `Prioritizing shared topics: ${sharedInterests.map(i => `#${i}`).join(' ')}`
                : 'Matching with an active conversation partner worldwide...'}
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] text-cyan-300 font-mono">
              <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>P2P Pipeline Active</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. DISCONNECTED / IDLE STATE */}
      {!isConnected && !isWaiting && (
        <div className="relative w-full h-full flex flex-col items-center justify-center text-center p-8 space-y-4 z-10 overflow-hidden">
          {/* Subtle Background Artwork */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 filter blur-[2px] pointer-events-none"
            style={{ backgroundImage: "url('/background.jpg')" }}
          />
          <div className="absolute inset-0 bg-[#080c16]/80 pointer-events-none" />

          <div className="relative">
            <div className="w-20 h-20 rounded-3xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-slate-500 shadow-xl">
              <VideoOff className="w-10 h-10 text-slate-500" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">Standby</h3>
            <p className="text-xs text-slate-400 max-w-xs">
              Press <span className="text-cyan-400 font-semibold">Next Chat</span> or hit <kbd className="px-1.5 py-0.5 rounded bg-white/[0.08] text-white text-[10px] font-mono">Space</kbd> to connect.
            </p>
          </div>
        </div>
      )}

      {/* 3. CONNECTED REMOTE STREAM (Smooth cinematic transition) */}
      {isConnected && (
        <>
          {chatMode === 'video' ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              onContextMenu={(e) => e.preventDefault()}
              className={`w-full h-full object-cover gpu-accelerated transition-all duration-500 ${
                shieldActive ? 'shield-blur' : 'shield-clear'
              }`}
            />
          ) : (
            /* Text-Only Connection Viewport */
            <div className="flex flex-col items-center justify-center text-center p-8 space-y-4">
              <div className="relative">
                <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-3xl blur-lg opacity-40 animate-pulse" />
                <div className="relative w-20 h-20 rounded-3xl bg-[#0c1222] border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-xl">
                  <MessageSquare className="w-10 h-10" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white">Anonymous Text Chat Active</h3>
                <p className="text-xs text-slate-400">Zero camera broadcasting. Chat in the side panel.</p>
              </div>
            </div>
          )}

          {/* Shared Interests Banner */}
          {sharedInterests.length > 0 && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-600/90 text-white text-xs font-semibold shadow-lg backdrop-blur-md animate-fade-in border border-cyan-400/40">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Matching interests: {sharedInterests.map(i => `#${i}`).join(' ')}</span>
            </div>
          )}

          {/* Safety Blur Overlay */}
          {shieldActive && chatMode === 'video' && (
            <div className="absolute inset-0 bg-[#080c16]/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20 animate-fade-in">
              <div className="w-14 h-14 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center mb-3 text-red-400">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1.5">Safety Shield Triggered</h3>
              <p className="text-xs text-slate-300 max-w-sm mb-4 leading-relaxed">
                Client-side vision guard detected a suspicious pattern ({Math.round((riskMetrics?.riskScore || 0) * 100)}% confidence). Stream was blurred locally.
              </p>
              <div className="flex gap-2.5">
                <button
                  onClick={onOverrideShield}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" /> Unblur
                </button>
                <button
                  onClick={onReport}
                  className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Flag className="w-3.5 h-3.5" /> Report & Next
                </button>
              </div>
            </div>
          )}

          {/* Remote Status Badges (Stranger, HD Video, E2EE) */}
          <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2 z-20">
            <div className="glass-panel px-3 py-1 rounded-full text-xs font-semibold text-white flex items-center gap-1.5 shadow-md">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>Stranger</span>
            </div>
            {chatMode === 'video' && (
              <div className="glass-panel px-2.5 py-1 rounded-full text-[11px] font-bold text-cyan-300 flex items-center gap-1 border border-cyan-500/30">
                <Zap className="w-3 h-3 text-cyan-400" />
                <span>HD Video</span>
              </div>
            )}
            <div className="glass-panel px-2.5 py-1 rounded-full text-[11px] text-slate-300 flex items-center gap-1">
              <Lock className="w-3 h-3 text-cyan-400" />
              <span>{iceState === 'connected' ? 'P2P Encrypted' : 'Negotiating'}</span>
            </div>
          </div>

          {/* Quick Tools (Snapshot & Fullscreen) */}
          <div className="absolute top-4 right-4 flex items-center gap-1.5 z-20">
            <button
              onClick={handleCaptureSnapshot}
              title="Save memory photo"
              className="p-2 rounded-xl glass-panel hover:bg-white/[0.1] text-slate-300 hover:text-white transition cursor-pointer"
            >
              <Camera className="w-4 h-4" />
            </button>
            <button
              onClick={handleToggleFullscreen}
              title="Fullscreen"
              className="p-2 rounded-xl glass-panel hover:bg-white/[0.1] text-slate-300 hover:text-white transition cursor-pointer"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </>
      )}

      {/* 4. SELF CAMERA PANEL (Floating window on Desktop, PiP on Mobile) */}
      {chatMode === 'video' && (
        <div className="absolute bottom-4 right-4 w-32 h-44 sm:w-60 sm:h-36 md:w-64 md:h-40 rounded-2xl overflow-hidden bg-[#0a0f1d]/90 backdrop-blur-md border border-white/[0.12] shadow-2xl z-30 transition-all hover:scale-[1.02] flex items-center justify-center gpu-accelerated">
          {localStream ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              onContextMenu={(e) => e.preventDefault()}
              className={`w-full h-full object-cover transition-transform gpu-accelerated ${
                isMirrored ? '-scale-x-100' : 'scale-x-100'
              } ${isVideoMuted ? 'opacity-20' : 'opacity-100'}`}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-500 gap-1.5 p-2 text-center">
              <VideoOff className="w-6 h-6 text-slate-600" />
              <span className="text-[10px]">No camera</span>
            </div>
          )}

          {/* Video Muted Overlay */}
          {isVideoMuted && localStream && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70">
              <VideoOff className="w-8 h-8 text-slate-400" />
            </div>
          )}

          {/* Screen Share Active Banner */}
          {isScreenSharing && (
            <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-cyan-600 text-white text-[10px] font-semibold flex items-center gap-1 shadow">
              <Monitor className="w-3 h-3" />
              <span className="hidden sm:inline">Screen Sharing</span>
            </div>
          )}

          {/* Self Badge & Controls */}
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
            <div className="glass-panel px-2 py-0.5 rounded-full text-[11px] font-semibold text-white flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>You</span>
            </div>
            <button
              onClick={() => setIsMirrored(!isMirrored)}
              title="Toggle mirror view"
              className="p-1 rounded-full glass-panel hover:bg-white/[0.1] text-slate-300 transition cursor-pointer"
            >
              <FlipHorizontal className="w-3 h-3" />
            </button>
          </div>

          {/* Mic Muted Badge */}
          {isAudioMuted && (
            <div className="absolute bottom-2.5 left-2.5 p-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-400">
              <MicOff className="w-3 h-3" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
