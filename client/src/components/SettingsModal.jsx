import React, { useState, useEffect } from 'react';
import { X, Camera, Mic, Shield, Sliders, CheckCircle, Server, Lock, EyeOff } from 'lucide-react';

export function SettingsModal({
  isOpen,
  onClose,
  shieldEnabled,
  onToggleShield,
  sensitivity,
  onChangeSensitivity,
  ghostMode,
  onToggleGhostMode,
  selectedVideoDevice,
  selectedAudioDevice,
  onChangeVideoDevice,
  onChangeAudioDevice
}) {
  const [videoDevices, setVideoDevices] = useState([]);
  const [audioDevices, setAudioDevices] = useState([]);

  useEffect(() => {
    if (!isOpen) return;

    // Enumerate media devices
    navigator.mediaDevices?.enumerateDevices()
      .then((devices) => {
        setVideoDevices(devices.filter(d => d.kind === 'videoinput'));
        setAudioDevices(devices.filter(d => d.kind === 'audioinput'));
      })
      .catch((err) => console.warn('Could not enumerate devices:', err));
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in select-none">
      <div className="bg-dark-800 border border-slate-700/80 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700/60 pb-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Security & App Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 🛡️ Background Security & Anti-Hacking IP Shield */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>Anti-Hacking IP & Privacy Shield</span>
          </h3>

          <div className="p-4 rounded-2xl bg-dark-900 border border-slate-700/50 space-y-4">
            {/* Automatic LAN Sanitization Status */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <div className="text-xs font-medium text-white flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Internal LAN IP Sanitizer</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  Automatically scrubs local IP addresses (192.168.x.x, 10.x.x.x) and computer hostnames from WebRTC SDP to prevent network topology mapping.
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono shrink-0">
                Active
              </span>
            </div>

            {/* Ghost Mode Toggle */}
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <div className="text-xs font-medium text-white flex items-center gap-1.5">
                  <EyeOff className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Ghost Mode (Force TURN Relay)</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  Routes all audio/video packets exclusively through the Coturn relay server. The peer and network sniffers will only ever see the relay server IP, never your real public IP.
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={ghostMode}
                  onChange={(e) => onToggleGhostMode(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* End-to-End Encryption (E2EE) Status */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-medium text-white flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>End-to-End Encryption (E2EE)</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  Hardware-accelerated AES-256-GCM + ECDH P-256 zero-knowledge encryption. Text messages and user data are encrypted on-device before transmission.
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono shrink-0">
                256-Bit GCM
              </span>
            </div>
          </div>
        </div>

        {/* Vision Guard Settings */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Client-Side Vision Guard (TensorFlow.js)</span>
          </h3>

          <div className="p-4 rounded-2xl bg-dark-900 border border-slate-700/50 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-white">Dynamic Canvas Shield</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Automatically blur remote stream if potential explicit content is detected
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={shieldEnabled}
                  onChange={(e) => onToggleShield(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">Detection Sensitivity:</span>
                <span className="text-indigo-400 font-mono font-medium">
                  {sensitivity === 0.5 ? 'High (Strict)' : sensitivity === 0.65 ? 'Medium (Balanced)' : 'Low (Relaxed)'}
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="0.8"
                step="0.15"
                value={sensitivity}
                onChange={(e) => onChangeSensitivity(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>High (0.50)</span>
                <span>Medium (0.65)</span>
                <span>Low (0.80)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Media Devices */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-indigo-400" />
            <span>Hardware Devices</span>
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-300 mb-1">Camera Input</label>
              <select
                value={selectedVideoDevice}
                onChange={(e) => onChangeVideoDevice(e.target.value)}
                className="w-full bg-dark-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {videoDevices.map((d, i) => (
                  <option key={d.deviceId || i} value={d.deviceId}>
                    {d.label || `Camera ${i + 1}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1">Microphone Input</label>
              <select
                value={selectedAudioDevice}
                onChange={(e) => onChangeAudioDevice(e.target.value)}
                className="w-full bg-dark-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {audioDevices.map((d, i) => (
                  <option key={d.deviceId || i} value={d.deviceId}>
                    {d.label || `Microphone ${i + 1}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Traversal Diagnostics */}
        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Server className="w-4 h-4 text-emerald-400" />
            <span>NAT Traversal: STUN & Coturn TURN</span>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
            Encrypted
          </span>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
        >
          Save & Close
        </button>
      </div>
    </div>
  );
}
