import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Lock, 
  FileText, 
  AlertCircle, 
  HelpCircle, 
  Mail, 
  UserX, 
  CheckCircle,
  EyeOff,
  Flame,
  Terminal,
  ServerOff
} from 'lucide-react';

const TABS = [
  { id: 'community', label: 'Community Guidelines', icon: ShieldCheck },
  { id: 'privacy', label: 'Privacy Policy', icon: Lock },
  { id: 'terms', label: 'Terms of Service', icon: FileText },
  { id: 'safety', label: 'Safety Center', icon: AlertCircle },
  { id: 'how_it_works', label: 'How It Works', icon: HelpCircle },
  { id: 'faq', label: 'FAQ & Contact', icon: Mail }
];

export function LegalModal({ isOpen, onClose, initialTab = 'community' }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fade-in select-none">
      <div className="bg-dark-800 border border-slate-700/80 rounded-3xl max-w-3xl w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Top Header */}
        <div className="p-5 border-b border-slate-700/60 flex items-center justify-between bg-dark-900/60">
          <div className="flex items-center gap-2.5">
            <img 
              src="/logo.png" 
              alt="Omnexlo" 
              className="w-8 h-8 rounded-xl object-cover shadow-sm ring-1 ring-white/10" 
            />
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">OMNEXLO RESOURCE & SAFETY CENTER</h2>
              <p className="text-[10px] text-slate-400">Policies, Transparency & Operational Principles</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation Navigation */}
        <div className="flex overflow-x-auto border-b border-slate-700/60 bg-dark-900/40 px-4 py-2 gap-1.5 scrollbar-none">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-300 leading-relaxed">
          {/* 1. COMMUNITY GUIDELINES */}
          {activeTab === 'community' && (
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white">Community Guidelines & Code of Conduct</h3>
                <p className="text-slate-400 text-[11px] mt-0.5">Rules every participant agrees to uphold before starting a conversation.</p>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-dark-900 border border-slate-800 space-y-1">
                  <h4 className="font-semibold text-white flex items-center gap-1.5 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    1. Minimum Age Requirement (18+)
                  </h4>
                  <p className="text-slate-400 text-[11px]">
                    Omnexlo is exclusively for adults aged 18 and older. Minor access is strictly prohibited. If we suspect a user is underage, their session will be immediately disconnected and quarantined.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-dark-900 border border-slate-800 space-y-1">
                  <h4 className="font-semibold text-white flex items-center gap-1.5 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    2. Zero Tolerance for Harassment & Hate
                  </h4>
                  <p className="text-slate-400 text-[11px]">
                    Bullying, hate speech, threats of violence, racism, misogyny, and targeted abuse are strictly prohibited. Violators are banned from the matchmaking pool.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-dark-900 border border-slate-800 space-y-1">
                  <h4 className="font-semibold text-white flex items-center gap-1.5 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    3. No Explicit or Non-Consensual Material
                  </h4>
                  <p className="text-slate-400 text-[11px]">
                    Omnexlo is built for genuine conversation, not sexual encounters or dating. Transmitting sexually explicit video, imagery, or unsolicited sexual text is an immediate ban.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-dark-900 border border-slate-800 space-y-1">
                  <h4 className="font-semibold text-white flex items-center gap-1.5 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    4. Respect Privacy & Anonymity
                  </h4>
                  <p className="text-slate-400 text-[11px]">
                    Never solicit or pressure another user for their real name, phone number, physical address, financial info, or personal social media handles.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-dark-900 border border-slate-800 space-y-1">
                  <h4 className="font-semibold text-white flex items-center gap-1.5 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    5. Freedom to Leave
                  </h4>
                  <p className="text-slate-400 text-[11px]">
                    Any user has the absolute right to leave a conversation at any second by pressing <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">Esc</kbd> or the Next button. No reason is required.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 2. PRIVACY POLICY */}
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white">Privacy-by-Design Architecture</h3>
                <p className="text-slate-400 text-[11px] mt-0.5">We don't just promise privacy; we built a system that cannot expose your identity.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300">
                <div className="p-3.5 rounded-2xl bg-dark-900 border border-slate-800 space-y-1.5">
                  <div className="text-emerald-400 font-semibold flex items-center gap-1.5">
                    <ServerOff className="w-4 h-4" />
                    <span>Zero Data Retention</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Chat messages and video streams are completely ephemeral. We never save, store, sell, or analyze your conversations on any database.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-dark-900 border border-slate-800 space-y-1.5">
                  <div className="text-indigo-400 font-semibold flex items-center gap-1.5">
                    <Lock className="w-4 h-4" />
                    <span>End-to-End Encryption</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Text messages and media use authenticated AES-GCM-256 and WebRTC DTLS. Ephemeral keys are destroyed the moment you click Next or close the tab.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-dark-900 border border-slate-800 space-y-1.5">
                  <div className="text-emerald-400 font-semibold flex items-center gap-1.5">
                    <EyeOff className="w-4 h-4" />
                    <span>No IP Address Exposure</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Our signaling server scrubs local LAN IP addresses (192.168.x.x, 10.x.x.x) and hostname identifiers from WebRTC SDP to prevent network fingerprinting.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-dark-900 border border-slate-800 space-y-1.5">
                  <div className="text-amber-400 font-semibold flex items-center gap-1.5">
                    <UserX className="w-4 h-4" />
                    <span>No Accounts or Profiles</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    No sign-up, no email verification, no tracking cookies, and no social media logins. Every session is an anonymous, ephemeral ID.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 3. TERMS OF SERVICE */}
          {activeTab === 'terms' && (
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white">Terms of Service</h3>
                <p className="text-slate-400 text-[11px] mt-0.5">Legal agreement governing use of the Omnexlo platform.</p>
              </div>

              <div className="space-y-3 text-[11px] text-slate-400 leading-relaxed">
                <p>
                  <strong className="text-slate-200">1. Acceptance of Terms:</strong> By clicking "Start Chat", you agree to be bound by these Terms of Service. If you do not agree, do not use the service.
                </p>
                <p>
                  <strong className="text-slate-200">2. Free Temporary Service:</strong> Omnexlo is provided free of charge as an open communication utility. We do not guarantee uninterrupted uptime or specific connection quality.
                </p>
                <p>
                  <strong className="text-slate-200">3. Non-Dating & Non-Sexual Platform:</strong> Omnexlo is intentionally not built around romance, dating, or sexual matching. Using the platform for commercial solicitation or adult entertainment is strictly prohibited.
                </p>
                <p>
                  <strong className="text-slate-200">4. Limitation of Liability:</strong> Omnexlo acts strictly as a decentralized peer-to-peer signaling router. We are not responsible for the conduct or speech of third-party users encountered in random matchmaking.
                </p>
                <p>
                  <strong className="text-slate-200">5. Termination:</strong> We reserve the right to temporarily quarantine or permanently terminate access to any session exhibiting automated scraping, abuse, or safety violations.
                </p>
              </div>
            </div>
          )}

          {/* 4. SAFETY CENTER */}
          {activeTab === 'safety' && (
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white">Safety Center & Stranger Advice</h3>
                <p className="text-slate-400 text-[11px] mt-0.5">Practical guidelines for safe anonymous conversations on the web.</p>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 space-y-1">
                  <h4 className="font-semibold text-xs flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    Golden Rules for Talking to Strangers
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-200/90 pl-1">
                    <li>Never reveal your full name, workplace, school, or location.</li>
                    <li>Never click strange links or download files sent by someone you just met.</li>
                    <li>If someone asks you for money, cryptocurrency, or gift cards, report them immediately.</li>
                    <li>If you feel uncomfortable for any reason, press <strong>Esc</strong> to skip or the <strong>Emergency Exit</strong> button.</li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-2xl bg-dark-900 border border-slate-800 space-y-2">
                  <h4 className="font-semibold text-white text-xs">Emergency Exit Feature</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Located in the header, the Emergency Exit button immediately severs the WebRTC connection, clears all message logs, wipes crypto keys from browser RAM, and redirects to a neutral landing screen.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 5. HOW IT WORKS */}
          {activeTab === 'how_it_works' && (
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white">How Omnexlo Works Under the Hood</h3>
                <p className="text-slate-400 text-[11px] mt-0.5">Decentralized WebRTC signaling with zero-knowledge cryptographic guarantees and hardware-accelerated video streaming.</p>
              </div>

              <div className="space-y-3 text-[11px] text-slate-300">
                <div className="p-3.5 rounded-2xl bg-dark-900 border border-slate-800 space-y-1.5">
                  <h4 className="font-semibold text-white text-xs">1. Ephemeral Matchmaking</h4>
                  <p className="text-slate-400 leading-relaxed">
                    When you click "Start Chat", a random anonymous session token is generated in browser memory. Our backend matchmaking service pairs you with another eligible user based on mode (Text or Video) and optional topic interests.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-dark-900 border border-slate-800 space-y-1.5">
                  <h4 className="font-semibold text-white text-xs">2. WebRTC P2P Direct Tunnel</h4>
                  <p className="text-slate-400 leading-relaxed">
                    Once paired, clients negotiate a direct peer-to-peer data connection using WebRTC. Media and messages flow directly between browsers rather than passing through an inspection proxy.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-dark-900 border border-slate-800 space-y-1.5">
                  <h4 className="font-semibold text-white text-xs">3. Ephemeral ECDH Key Derivation</h4>
                  <p className="text-slate-400 leading-relaxed">
                    Both browsers generate ephemeral Elliptic Curve Diffie-Hellman keys on the NIST P-256 curve. They derive a 256-bit AES-GCM symmetric session key. Neither our servers nor any intermediate router can decrypt the conversation.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 6. FAQ & CONTACT */}
          {activeTab === 'faq' && (
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white">Frequently Asked Questions & Contact</h3>
                <p className="text-slate-400 text-[11px] mt-0.5">Common questions about privacy, billing, and safety.</p>
              </div>

              <div className="space-y-3 text-[11px]">
                <div className="p-3.5 rounded-2xl bg-dark-900 border border-slate-800 space-y-1">
                  <h4 className="font-semibold text-white text-xs">What is Omnexlo?</h4>
                  <p className="text-slate-400">
                    Omnexlo is a modern, privacy-first alternative to Omegle that lets you talk to random strangers worldwide via text and video chat on Mobile and PC. It runs directly in your browser with zero registration, zero accounts, and military-grade End-to-End Encryption.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-dark-900 border border-slate-800 space-y-1">
                  <h4 className="font-semibold text-white text-xs">Is this service completely free?</h4>
                  <p className="text-slate-400">Yes, 100% free with no premium tiers, coins, or forced paywalls.</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-dark-900 border border-slate-800 space-y-1">
                  <h4 className="font-semibold text-white text-xs">Trademark Disclaimer</h4>
                  <p className="text-slate-400">
                    Omegle is a registered trademark of its respective owner. Omnexlo is an independent privacy platform created to provide a safe, encrypted alternative to talk to strangers online.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-dark-900 border border-slate-800 space-y-1">
                  <h4 className="font-semibold text-white text-xs">Do I need an account or app?</h4>
                  <p className="text-slate-400">No. Omnexlo runs directly in your standard web browser across Mobile and PC with zero registration.</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-dark-900 border border-slate-800 space-y-1">
                  <h4 className="font-semibold text-white text-xs">Can anyone see my IP address?</h4>
                  <p className="text-slate-400">No. Our signaling engine sanitizes private network details from candidates. You can also enable Ghost Mode (Force TURN) in Settings to mask your public IP address.</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-dark-900 border border-slate-800 space-y-1">
                  <h4 className="font-semibold text-white text-xs">How do I report illegal or abusive activity?</h4>
                  <p className="text-slate-400">Use the in-chat Report button or email safety@omnexlo.local with details.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Close Action */}
        <div className="p-4 border-t border-slate-700/60 bg-dark-900/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-lg shadow-emerald-600/20"
          >
            I Understand & Agree
          </button>
        </div>
      </div>
    </div>
  );
}
