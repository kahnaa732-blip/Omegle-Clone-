import React, { useState } from 'react';
import { ShieldCheck, Lock, Key, Copy, Check, Info, ServerOff, Cpu, RefreshCw, X } from 'lucide-react';

export function E2EEModal({ isOpen, onClose, fingerprint, isConnected, isE2EEReady }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (fingerprint) {
      navigator.clipboard.writeText(fingerprint);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-dark-800 border border-slate-700/80 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative space-y-6 select-none">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/60 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title & Icon */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>End-to-End Encryption</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono border border-emerald-500/30">
                ACTIVE
              </span>
            </h2>
            <p className="text-xs text-slate-400">Military-Grade Authenticated P2P Cryptography</p>
          </div>
        </div>

        {/* Cryptographic Specifications Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-indigo-400 font-medium text-[11px]">
              <Lock className="w-3.5 h-3.5" />
              <span>Symmetric Cipher</span>
            </div>
            <p className="font-semibold text-white">AES-256-GCM</p>
            <p className="text-[10px] text-slate-400">Authenticated Galois Counter Mode with 96-bit random IVs</p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-indigo-400 font-medium text-[11px]">
              <Key className="w-3.5 h-3.5" />
              <span>Key Agreement</span>
            </div>
            <p className="font-semibold text-white">ECDH P-256</p>
            <p className="text-[10px] text-slate-400">Elliptic Curve Diffie-Hellman ephemeral key derivation</p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium text-[11px]">
              <ServerOff className="w-3.5 h-3.5" />
              <span>Zero Knowledge</span>
            </div>
            <p className="font-semibold text-white">No Server Interception</p>
            <p className="text-[10px] text-slate-400">Private keys never leave browser memory</p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-amber-400 font-medium text-[11px]">
              <Cpu className="w-3.5 h-3.5" />
              <span>Hardware Accelerated</span>
            </div>
            <p className="font-semibold text-white">Web Crypto API</p>
            <p className="text-[10px] text-slate-400">Native sub-millisecond on-device encryption</p>
          </div>
        </div>

        {/* Verification Safety Number / Fingerprint */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-300 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-indigo-400" />
              <span>Session Safety Fingerprint:</span>
            </span>
            {fingerprint && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 transition"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            )}
          </div>

          {isConnected && isE2EEReady && fingerprint ? (
            <div className="p-3 bg-dark-900 rounded-xl border border-indigo-500/30 text-center">
              <span className="text-sm sm:text-base font-mono font-bold tracking-widest text-indigo-300">
                {fingerprint}
              </span>
              <p className="text-[10px] text-slate-500 mt-1">
                Both you and your chat partner share this identical hash. If it matches, no man-in-the-middle is present.
              </p>
            </div>
          ) : (
            <div className="p-3 bg-dark-900 rounded-xl border border-slate-800 text-center">
              <span className="text-xs font-mono text-slate-500">
                {isConnected ? 'Negotiating ephemeral ECDH keys...' : 'Connect to a stranger to generate session keys'}
              </span>
            </div>
          )}
        </div>

        {/* Informational Notice */}
        <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-300 leading-relaxed">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-indigo-400" />
          <span>
            Every message, audio stream, and video packet is cryptographically encrypted directly on your device. When either person skips or closes the tab, all ephemeral keys are irreversibly purged.
          </span>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-lg shadow-indigo-600/30"
        >
          Got It, Back to Chat
        </button>
      </div>
    </div>
  );
}
