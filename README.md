# OMNEXLO — Next-Gen Encrypted Omegle Clone

**Omnexlo** is a modern, high-performance, privacy-first random conversation platform engineered with zero-knowledge cryptography, WebSockets matchmaking, hardware-accelerated WebRTC, and defense-in-depth safety controls.

Built with an original dark futuristic aesthetic, neon ambient lighting, responsive 60FPS UI, and end-to-end encryption — offering a far superior, secure alternative to legacy random chat platforms like Omegle.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

---

## 🛡️ Core Principles

1. **Zero Registration & No Accounts**: No sign-up, no email verification, no passwords, and no user profiles.
2. **True End-to-End Encryption (E2EE)**: Messages and media streams are encrypted on-device via **ECDH P-256** key exchange and authenticated **AES-GCM-256**.
3. **Zero Data Retention**: The server acts strictly as an untrusted blind pipe. Conversations, messages, and video frames are never stored, logged, or monetized.
4. **Anti-Hacking IP & Topology Shield**:
   - WebRTC SDP candidates automatically scrub local private LAN addresses (`192.168.x.x`, `10.x.x.x`, `172.16-31.x.x`) and computer hostnames to prevent network topology mapping.
   - **Ghost Mode (Force TURN)**: Routes media through authenticated TURN relays (`iceTransportPolicy: 'relay'`), completely concealing the user's public IP address from network packet sniffers.
   - IP addresses for bot/ban mitigation are uninvertibly hashed with SHA-256 and a rotating daily salt — raw IPs are **never** stored.
5. **Safety by Design**:
   - 18+ Community Rules confirmation required before entry.
   - Text chat by default with optional video/audio mode.
   - Instant **Emergency Exit** button (clears RAM, destroys crypto keys, and returns to safe landing screen).
   - Categorized abuse reporting workflow with automatic peer blocking.
   - Malicious link, IP grabber, and phone/card harvesting filters.
   - Symmetric peer blocking ensures blocked users never match again.
6. **100% Free to Use**: Zero paywalls, zero coins, and zero artificial delays.

---

## 🏛️ System Architecture

```text
┌────────────────────────────────────────────────────────┐
│                        User A (Browser Client)         │
│  - Ephemeral Session ID in RAM                         │
│  - Ephemeral ECDH P-256 Keypair                        │
│  - Client-side Frame Inspection (TensorFlow.js)        │
└──────────────┬────────────────────────▲────────────────┘
               │                        │
 1. WebSocket  │          P2P Video/    │ WebRTC
 Signaling &   │          Audio Stream  │ Encrypted DataChannel
 Ephemeral Key │          (DTLS-SRTP)   │ (AES-GCM-256 E2EE)
               ▼                        │
┌──────────────┴───────────┐            │
│ Node.js Signaling Server │            │
│  - Blind Signaling Relay │            │
│  - Mode & Topic Match    │            │
│  - Language Match (Vol.) │            │
│  - Blocklist Enforcement │            │
│  - Automated Retention   │            │
└──────────────┬───────────┘            │
               │                        │
               │ 2. Match & Relay SDP   │
               ▼                        │
┌───────────────────────────────────────┴────────────────┐
│                        User B (Browser Client)         │
│  - Ephemeral ECDH P-256 Keypair                        │
│  - Identical AES-GCM-256 Key & Fingerprint             │
└────────────────────────────────────────────────────────┘
               ▲                        ▲
               │                        │
┌──────────────┴────────────────────────┴────────────────┐
│             Self-Hosted Coturn (STUN/TURN)             │
│   Conceals client public IPs when Ghost Mode is active │
└────────────────────────────────────────────────────────┘
```

---

## 🚀 Key Features & Differentiators

| Feature | Legacy Chat (Omegle) | **Haven** |
| :--- | :--- | :--- |
| **Identity & Brand** | Outdated / Cloned | **Original, modern, privacy-first brand with glassmorphic UI** |
| **Encryption** | Plaintext / Unencrypted | **End-to-End Encryption (AES-GCM-256 + ECDH P-256)** |
| **Safety Fingerprint** | ❌ None | **Cryptographic 16-character verification safety number** |
| **Default Mode** | Webcam required | **Text Chat by default (Video optional)** |
| **Topic Matching** | Basic plain text | **Topic hashtag system (`#gaming`, `#music`, `#books`)** |
| **Language Filter** | ❌ None | **Voluntary language matching (English, Spanish, French, etc.)** |
| **Abuse Reporting** | Ineffective | **Categorized reporting (`/api/reports`) + Peer Blocklist** |
| **Moderation Console** | ❌ None | **Integrated operator console (`Alt+M`) with live telemetry** |
| **Emergency Exit** | ❌ None | **1-Click Panic/Emergency Exit (`Alt+E` wipes RAM immediately)** |
| **Screen Sharing** | ❌ None | **1-Click Desktop / Window / Tab streaming** |
| **Live Reactions** | ❌ None | **Floating live emoji reactions dock (`❤️`, `😂`, `🔥`, `👏`, `😮`, `💀`)** |
| **Audio Synthesizer** | ❌ None | **Web Audio Synthesizer (Connect chime, skip whoosh, message pop)** |
| **Metrics & Telemetry** | ❌ None | **Prometheus metrics endpoint (`/metrics`) for Grafana monitoring** |

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Web Crypto API (`window.crypto.subtle`), Web Audio API, WebRTC APIs.
- **Backend**: Node.js 22+, Express, Socket.IO, `node:sqlite` persistence, crypto (RFC 5766 HMAC-SHA1 TURN tokens), Redis/In-Memory Queues.
- **Database**: SQLite (built-in zero-dependency WAL mode) with PostgreSQL schema migrations (`server/db/migrations/001_init.sql`).
- **Media Traversal**: Coturn RFC 5766 STUN/TURN server.
- **Safety & Moderation**: TensorFlow.js on-device vision guard, heuristic link scanner, and operator console.

---

## 📦 Localhost Quickstart

### 1. Prerequisites
- Node.js v20+ (tested on Node 22 & 24)
- npm v9+

### 2. Start Backend Server
```bash
cd server
npm install
npm start
```
*Backend runs on port **4000**: [http://localhost:4000](http://localhost:4000)*
- Health: [http://localhost:4000/health](http://localhost:4000/health)
- Metrics: [http://localhost:4000/metrics](http://localhost:4000/metrics)

### 3. Start Frontend Client
```bash
cd client
npm install
npm run dev
```
*Frontend runs on port **3000**: [http://localhost:3000](http://localhost:3000)*

---

## 🧪 Master Test Suite

Run the full automated security and verification suite covering matchmaking, E2EE cryptography, SQLite persistence, symmetric blocking, and data retention:

```bash
cd server
npm test
```

Run frontend build verification:

```bash
cd client
npm run build
```

---

## 🐳 Docker Deployment

To spin up the complete containerized stack (Frontend, Backend, Redis, and Coturn TURN relay):

```bash
docker compose up -d --build
```

Container services:
- **`haven-client`**: Web UI on port `3000`
- **`haven-server`**: Signaling & Matchmaking API on port `4000`
- **`haven-redis`**: Ephemeral in-memory queue cache on port `6379`
- **`haven-coturn`**: STUN/TURN relay server on port `3478` (UDP/TCP)

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| <kbd>Space</kbd> / <kbd>Enter</kbd> | Start Chat from Landing / Next Chat |
| <kbd>Esc</kbd> | Next Stranger / Leave Conversation |
| <kbd>Alt</kbd> + <kbd>E</kbd> | **Emergency Panic Exit** (Instantly sever connection & wipe memory) |
| <kbd>Alt</kbd> + <kbd>R</kbd> | Report & Block Stranger |
| <kbd>Alt</kbd> + <kbd>M</kbd> | Open Moderation Console (Operators) |
| <kbd>M</kbd> / <kbd>V</kbd> | Toggle Microphone / Camera (Video Mode) |

---

## 📜 Legal & Policies

All policies are transparently available via the in-app Resource Center:
- **Community Guidelines**: Strict 18+ requirement, anti-harassment, and non-dating policy.
- **Privacy Policy**: Zero tracking cookies, zero persistent PII, salted IP hashing, and 7-day retention auto-purge.
- **Terms of Service**: Acceptable use, temporary ephemeral session rules, and peer conduct.
- **Safety Center & FAQ**: Practical guides on staying safe online and verifying cryptographic safety fingerprints.
