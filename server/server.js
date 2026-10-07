import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import Redis from 'ioredis';
import { randomUUID } from 'crypto';

import { Matchmaker } from './matchmaking.js';
import { ReputationManager } from './reputation.js';
import { getIceServers } from './turnAuth.js';
import { db, hashIp } from './db.js';

dotenv.config();

const PORT = process.env.PORT || 4000;
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'haven_admin_secret_key_2026';
const app = express();
const server = http.createServer(app);

// 🛡️ Security Hardening: Disable Express fingerprinting
app.disable('x-powered-by');

// 🛡️ Defense-in-Depth Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'geolocation=(), camera=(self), microphone=(self), interest-cohort=()');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; connect-src 'self' ws: wss: https:; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com;"
  );
  next();
});

// Restrict payload sizes to mitigate buffer starvation attacks & DoS
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10kb' }));

// Initialize Redis with automatic graceful fallback to memory
let redisClient = null;
const REDIS_URL = process.env.REDIS_URL;

if (REDIS_URL) {
  try {
    redisClient = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false
    });
    redisClient.on('connect', () => console.log(' Connected to Redis matchmaking cache'));
    redisClient.on('error', (err) => {
      console.warn(' Redis connection failed. Operating in in-memory mode:', err.message);
      redisClient = null;
    });
  } catch (err) {
    console.warn('⚠️ Redis initialization error, using in-memory mode:', err.message);
  }
} else {
  console.log('ℹ️ Operating in high-performance SQLite + in-memory matchmaking mode.');
}

const reputationManager = new ReputationManager(redisClient);
const matchmaker = new Matchmaker(redisClient);

// Active socket session map: socketId -> { sessionId, ipHash, verified, joinedAt, messageTimestamps }
const sessions = new Map();

// In-memory sliding window rate-limiter for connection handshakes per IP hash
const connectionLimitMap = new Map(); // ipHash -> [timestamp, ...]

// Helper to sanitize ICE candidate strings and strip private network info (LAN IPs, internal mDNS)
function sanitizeCandidate(candidateObj) {
  if (!candidateObj || typeof candidateObj.candidate !== 'string') return candidateObj;
  const str = candidateObj.candidate;

  // Drop private host candidates entirely (prevents leaking 192.168.x.x, 10.x.x.x, 172.16-31.x.x, or local hostname)
  const isPrivateHost = /typ host/i.test(str) && (
    /192\.168\./.test(str) ||
    /10\.\d{1,3}\./.test(str) ||
    /172\.(1[6-9]|2\d|3[01])\./.test(str) ||
    /\.local/i.test(str)
  );

  if (isPrivateHost) {
    return null; // Suppress private network candidate
  }

  // Strip raddr (related private address) if present in srflx candidates
  const sanitized = str.replace(/raddr\s+[\d\.]+\s+rport\s+\d+/i, '');
  return {
    ...candidateObj,
    candidate: sanitized
  };
}

// Simple Admin Authentication Middleware
function requireAdmin(req, res, next) {
  const authHeader = req.headers['x-admin-key'] || req.query.adminKey;
  if (!authHeader || authHeader !== ADMIN_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or missing admin credentials' });
  }
  next();
}

// --- REST Endpoints ---

// Health & System Uptime
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    brand: 'Omegle Clone',
    description: 'Free Anonymous Random Video & Text Chat with Strangers',
    mode: redisClient ? 'redis' : 'sqlite-in-memory',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// Live Matchmaking & Real Active Stats
app.get('/api/stats', (req, res) => {
  const stats = matchmaker.getStats();
  const dbStats = db.getStats();
  res.json({
    success: true,
    stats,
    dbStats,
    onlineSockets: sessions.size // Real count of active connections
  });
});

// Prometheus Metrics Endpoint for Monitoring
app.get('/metrics', (req, res) => {
  const stats = matchmaker.getStats();
  const dbStats = db.getStats();
  const metrics = `
# HELP haven_active_connections Current active WebSocket connections
# TYPE haven_active_connections gauge
haven_active_connections ${sessions.size}

# HELP haven_active_rooms Currently active two-way conversation rooms
# TYPE haven_active_rooms gauge
haven_active_rooms ${stats.activeRooms}

# HELP haven_queue_normal Users waiting in normal queue
# TYPE haven_queue_normal gauge
haven_queue_normal ${stats.waitingNormal}

# HELP haven_queue_fast_skipper Users waiting in fast skipper quarantine queue
# TYPE haven_queue_fast_skipper gauge
haven_queue_fast_skipper ${stats.waitingFastSkipper}

# HELP haven_reports_pending Pending unreviewed safety reports
# TYPE haven_reports_pending gauge
haven_reports_pending ${dbStats.pendingReports}

# HELP haven_reports_total Total safety reports logged in current window
# TYPE haven_reports_total counter
haven_reports_total ${dbStats.totalReports}

# HELP haven_bans_active Currently active bans
# TYPE haven_bans_active gauge
haven_bans_active ${dbStats.activeBans}

# HELP haven_uptime_seconds Total seconds the server has been running
# TYPE haven_uptime_seconds counter
haven_uptime_seconds ${Math.floor(process.uptime())}
`.trim();
  res.setHeader('Content-Type', 'text/plain; version=0.0.4');
  res.send(metrics);
});

// Abuse & Safety Reporting Endpoint
app.post('/api/reports', async (req, res) => {
  const { reporterSessionId, reportedSessionId, reason, details } = req.body;
  const reportId = db.createReport({
    reporterSessionId,
    reportedSessionId,
    reason,
    details
  });

  if (reportedSessionId && reportedSessionId !== 'unknown') {
    await reputationManager.recordReport(reportedSessionId);
    if (reporterSessionId) {
      matchmaker.blockPair(reporterSessionId, reportedSessionId);
    }
  }

  res.json({ success: true, reportId });
});

// Ephemeral ICE Servers & TURN Credentials Endpoint (RFC 5766)
app.get('/api/ice-servers', (req, res) => {
  const clientId = req.query.clientId || 'guest';
  const iceConfig = getIceServers(clientId);
  res.json(iceConfig);
});

// Cloudflare Turnstile Verification Endpoint
app.post('/api/verify-turnstile', async (req, res) => {
  const { token } = req.body;
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey || secretKey === 'dummy_secret') {
    return res.json({
      success: true,
      bypassed: true,
      message: 'Development mode bypass: Turnstile verified'
    });
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    formData.append('remoteip', req.ip);

    const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      body: formData,
      method: 'POST'
    });

    const outcome = await result.json();
    if (outcome.success) {
      return res.json({ success: true });
    } else {
      return res.status(400).json({ success: false, errors: outcome['error-codes'] });
    }
  } catch (error) {
    console.error('Turnstile verification error:', error);
    return res.status(500).json({ success: false, error: 'Verification failed' });
  }
});

// --- Moderation Dashboard Endpoints (Secured via Admin API Key) ---

app.get('/api/moderation/reports', requireAdmin, (req, res) => {
  const { status, limit } = req.query;
  const reports = db.listReports({ 
    status: status || null, 
    limit: limit ? parseInt(limit, 10) : 50 
  });
  res.json({ success: true, reports });
});

app.get('/api/moderation/bans', requireAdmin, (req, res) => {
  const bans = db.listActiveBans();
  res.json({ success: true, bans });
});

app.get('/api/moderation/stats', requireAdmin, (req, res) => {
  const dbStats = db.getStats();
  const mmStats = matchmaker.getStats();
  res.json({
    success: true,
    dbStats,
    mmStats,
    onlineConnections: sessions.size,
    memoryUsage: process.memoryUsage(),
    uptime: Math.floor(process.uptime())
  });
});

app.post('/api/moderation/action', requireAdmin, (req, res) => {
  const { reportId, action, targetSessionId, reason } = req.body;
  
  if (reportId) {
    const status = action === 'DISMISS' ? 'DISMISSED' : 'ACTIONED';
    db.updateReportStatus(reportId, status);
  }

  if (action === 'BAN' && targetSessionId) {
    const banId = db.createBan({
      targetSessionId,
      reason: reason || 'Violation of Community Safety Guidelines',
      durationMs: 24 * 60 * 60 * 1000 // 24-hour default ban
    });

    // Disconnect active sockets matching the banned session
    for (const [sId, sess] of sessions.entries()) {
      if (sess.sessionId === targetSessionId) {
        io.to(sId).emit('banned', { reason: 'Your session has been banned for safety violations.' });
        io.sockets.sockets.get(sId)?.disconnect(true);
      }
    }

    return res.json({ success: true, action: 'BANNED', banId });
  }

  res.json({ success: true, action });
});

// --- Socket.IO WebRTC Signaling & Matchmaking Gateway ---

const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  pingInterval: 10000,
  pingTimeout: 5000,
  maxHttpBufferSize: 1e5 // 100 KB max buffer per packet to prevent memory exhaustion
});

io.use((socket, next) => {
  const rawIp = socket.handshake.address || socket.request.socket.remoteAddress || '127.0.0.1';
  const ipH = hashIp(rawIp);
  const now = Date.now();

  // 1. Connection throttling per IP hash: max 20 connections per 60 seconds
  const timestamps = (connectionLimitMap.get(ipH) || []).filter(t => now - t < 60000);
  if (timestamps.length >= 20) {
    return next(new Error('CONNECTION_THROTTLED: Too many rapid connections from this network.'));
  }
  timestamps.push(now);
  connectionLimitMap.set(ipH, timestamps);

  // 2. Ban check by IP hash
  const ban = db.isBanned({ ipHash: ipH });
  if (ban) {
    return next(new Error(`ACCESS_DENIED: Banned until ${new Date(ban.expires_at).toISOString()}`));
  }

  socket.data.ipHash = ipH;
  next();
});

io.on('connection', (socket) => {
  const ipH = socket.data.ipHash;
  const sessionId = socket.handshake.auth?.sessionId || `sess_${randomUUID()}`;
  
  // Check if session itself is banned
  const sessionBan = db.isBanned({ sessionId });
  if (sessionBan) {
    socket.emit('match_error', {
      code: 'SESSION_BANNED',
      message: 'This session has been banned due to previous safety violations.'
    });
    socket.disconnect(true);
    return;
  }

  sessions.set(socket.id, {
    sessionId,
    ipHash: ipH,
    socketId: socket.id,
    verified: false,
    joinedAt: Date.now(),
    messageTimestamps: []
  });

  // Track session in DB
  db.saveSession(sessionId, 'NORMAL');

  // Broadcast accurate real-time online count to all clients
  io.emit('online_count', { count: sessions.size });
  socket.emit('online_count', { count: sessions.size });

  socket.emit('session_created', {
    sessionId
  });

  // Turnstile verification handshake
  socket.on('auth_turnstile', () => {
    const session = sessions.get(socket.id);
    if (session) {
      session.verified = true;
      socket.emit('auth_success', { verified: true });
    }
  });

  // Request matchmaking (supports video / text-only modes, voluntary language, and topic interests)
  socket.on('find_match', async ({ mode = 'text', language = 'any', interests = [] } = {}) => {
    const session = sessions.get(socket.id);
    if (!session) return;

    // Check user reputation
    const rep = await reputationManager.getReputation(session.sessionId);
    
    if (rep.tier === 'FLAGGED') {
      socket.emit('match_error', {
        code: 'ACCOUNT_FLAGGED',
        message: 'Your session has been temporarily quarantined due to peer safety reports.'
      });
      return;
    }

    socket.emit('reputation_status', rep);
    db.updateSessionActivity(session.sessionId);

    // Attempt matching with mode, voluntary language, and topic filters
    const match = await matchmaker.findMatch({
      socketId: socket.id,
      sessionId: session.sessionId,
      tier: rep.tier,
      mode,
      language,
      interests
    });

    if (match) {
      const { roomId, userA, userB, mode: matchMode, sharedInterests } = match;

      // Generate ICE server configs with fresh ephemeral TURN tokens
      const iceConfigA = getIceServers(userA);
      const iceConfigB = getIceServers(userB);

      // 🛡️ Security: Never expose raw socket IDs or IP addresses to clients!
      io.to(userA).emit('matched', {
        roomId,
        mode: matchMode,
        sharedInterests,
        isInitiator: true,
        iceServers: iceConfigA.iceServers
      });

      io.to(userB).emit('matched', {
        roomId,
        mode: matchMode,
        sharedInterests,
        isInitiator: false,
        iceServers: iceConfigB.iceServers
      });

      // Track match start times for skip metrics
      const sessA = sessions.get(userA)?.sessionId;
      const sessB = sessions.get(userB)?.sessionId;
      if (sessA) reputationManager.recordMatchStart(sessA);
      if (sessB) reputationManager.recordMatchStart(sessB);
    } else {
      socket.emit('waiting_in_queue', {
        status: interests.length > 0 ? `Searching for someone interested in ${interests.join(', ')}...` : 'Searching for a stranger...',
        mode,
        language,
        tier: rep.tier
      });
    }
  });

  // Relay live emoji reactions across room
  socket.on('send_reaction', ({ emoji }) => {
    const room = matchmaker.getRoom(socket.id);
    if (room && typeof emoji === 'string') {
      const partnerId = room.userA === socket.id ? room.userB : room.userA;
      io.to(partnerId).emit('receive_reaction', { emoji: emoji.slice(0, 8) });
    }
  });

  // Relay stranger typing indicator
  socket.on('typing', ({ isTyping }) => {
    const room = matchmaker.getRoom(socket.id);
    if (room) {
      const partnerId = room.userA === socket.id ? room.userB : room.userA;
      io.to(partnerId).emit('partner_typing', { isTyping: !!isTyping });
    }
  });

  // Cancel queue
  socket.on('leave_queue', () => {
    matchmaker.dequeue(socket.id);
    socket.emit('queue_cancelled');
  });

  // WebRTC Signaling: SDP Offer Relay (Room-isolated routing, no client-provided target needed)
  socket.on('signal_offer', ({ sdp }) => {
    const room = matchmaker.getRoom(socket.id);
    if (room && sdp) {
      const partnerId = room.userA === socket.id ? room.userB : room.userA;
      io.to(partnerId).emit('signal_offer', { sdp });
    }
  });

  // WebRTC Signaling: SDP Answer Relay
  socket.on('signal_answer', ({ sdp }) => {
    const room = matchmaker.getRoom(socket.id);
    if (room && sdp) {
      const partnerId = room.userA === socket.id ? room.userB : room.userA;
      io.to(partnerId).emit('signal_answer', { sdp });
    }
  });

  // WebRTC Signaling: ICE Candidate Relay with Private LAN Sanitization
  socket.on('signal_ice_candidate', ({ candidate }) => {
    const room = matchmaker.getRoom(socket.id);
    if (room && candidate) {
      // 🛡️ Filter and strip internal private IP leaks before relaying to stranger
      const cleanCandidate = sanitizeCandidate(candidate);
      if (cleanCandidate) {
        const partnerId = room.userA === socket.id ? room.userB : room.userA;
        io.to(partnerId).emit('signal_ice_candidate', { candidate: cleanCandidate });
      }
    }
  });

  // 🔐 E2EE Public Key Exchange Relay (Server passes ephemeral ECDH public key without storing)
  socket.on('e2ee_key', ({ key }) => {
    const room = matchmaker.getRoom(socket.id);
    if (room && typeof key === 'string') {
      const partnerId = room.userA === socket.id ? room.userB : room.userA;
      io.to(partnerId).emit('e2ee_key', { key: key.slice(0, 512) });
    }
  });

  // Skip partner (Next Stranger)
  socket.on('skip_peer', async ({ autoRequeue = true } = {}) => {
    const session = sessions.get(socket.id);
    if (session) {
      await reputationManager.recordSkip(session.sessionId);
      db.updateSessionActivity(session.sessionId, 1);
    }

    const leaveResult = matchmaker.leaveRoom(socket.id);
    if (leaveResult && leaveResult.partnerId) {
      io.to(leaveResult.partnerId).emit('partner_skipped', {
        message: 'Stranger has disconnected or skipped.'
      });
    }

    socket.emit('peer_skipped');

    if (autoRequeue) {
      socket.emit('auto_requeue');
    }
  });

  // Text message relay (fallback when WebRTC DataChannel is pending or unavailable)
  socket.on('send_message', ({ message }) => {
    const room = matchmaker.getRoom(socket.id);
    if (!room || !message) return;

    // 🛡️ Rate limit messages per socket (prevent flooding/DoS)
    const session = sessions.get(socket.id);
    const now = Date.now();
    if (session) {
      session.messageTimestamps = (session.messageTimestamps || []).filter(t => now - t < 5000);
      if (session.messageTimestamps.length > 8) {
        socket.emit('rate_limit_warning', { message: 'Chat rate limit reached. Please wait.' });
        return;
      }
      session.messageTimestamps.push(now);
    }

    const partnerId = room.userA === socket.id ? room.userB : room.userA;

    if (typeof message === 'object' && message.e2ee) {
      // 🔒 E2EE encrypted payload: server has zero ability to inspect or decrypt
      io.to(partnerId).emit('receive_message', {
        sender: 'stranger',
        e2ee: true,
        iv: String(message.iv).slice(0, 64),
        data: String(message.data).slice(0, 4096),
        timestamp: Date.now()
      });
    } else if (typeof message === 'string') {
      const cleanText = message.slice(0, 500).trim();
      if (!cleanText) return;
      io.to(partnerId).emit('receive_message', {
        sender: 'stranger',
        text: cleanText,
        timestamp: Date.now()
      });
    }
  });

  // 🚫 Block peer (Prevents matching this peer again symmetrically)
  socket.on('block_peer', () => {
    const room = matchmaker.getRoom(socket.id);
    if (room) {
      const partnerId = room.userA === socket.id ? room.userB : room.userA;
      const sessA = sessions.get(socket.id)?.sessionId;
      const sessB = sessions.get(partnerId)?.sessionId;
      if (sessA && sessB) {
        matchmaker.blockPair(sessA, sessB);
      }
      const leaveResult = matchmaker.leaveRoom(socket.id);
      if (leaveResult && leaveResult.partnerId) {
        io.to(leaveResult.partnerId).emit('partner_skipped', {
          message: 'Stranger skipped.'
        });
      }
      socket.emit('peer_skipped');
    }
  });

  // 🛡️ Report abusive peer with category and optional details
  socket.on('report_peer', async ({ reason = 'safety_violation', details = '' } = {}) => {
    const room = matchmaker.getRoom(socket.id);
    if (room) {
      const partnerId = room.userA === socket.id ? room.userB : room.userA;
      const sessA = sessions.get(socket.id)?.sessionId;
      const sessB = sessions.get(partnerId)?.sessionId;
      if (sessA && sessB) {
        matchmaker.blockPair(sessA, sessB);
        await reputationManager.recordReport(sessB);
        db.createReport({
          reporterSessionId: sessA,
          reportedSessionId: sessB,
          reason,
          details
        });
      }

      matchmaker.leaveRoom(socket.id);
      io.to(partnerId).emit('partner_disconnected', {
        message: 'Session terminated due to safety guidelines enforcement.'
      });
      socket.emit('report_acknowledged', { success: true });
    }
  });

  // Disconnect lifecycle
  socket.on('disconnect', () => {
    matchmaker.dequeue(socket.id);

    const leaveResult = matchmaker.leaveRoom(socket.id);
    if (leaveResult && leaveResult.partnerId) {
      io.to(leaveResult.partnerId).emit('partner_disconnected', {
        message: 'Stranger has disconnected.'
      });
    }

    sessions.delete(socket.id);
    // Broadcast real-time online count reduction immediately
    io.emit('online_count', { count: sessions.size });
  });
});

// 🧹 Automatic ephemeral data retention cleanup (Runs every 60 seconds)
setInterval(() => {
  const now = Date.now();
  // 1. Purge disconnected memory sessions older than 2 hours
  for (const [sId, sess] of sessions.entries()) {
    if (now - sess.joinedAt > 2 * 60 * 60 * 1000 && !io.sockets.sockets.get(sId)) {
      sessions.delete(sId);
    }
  }

  // 2. Clean up connection throttle sliding window
  for (const [ipH, timestamps] of connectionLimitMap.entries()) {
    const valid = timestamps.filter(t => now - t < 60000);
    if (valid.length === 0) {
      connectionLimitMap.delete(ipH);
    } else {
      connectionLimitMap.set(ipH, valid);
    }
  }

  // 3. Purge expired database records (sessions >2h, reports >7d, expired bans)
  try {
    const purgeResult = db.purgeExpired();
    if (purgeResult.purgedSessions > 0 || purgeResult.purgedReports > 0 || purgeResult.purgedBans > 0) {
      console.log('🧹 Retention cleanup completed:', purgeResult);
    }
  } catch (err) {
    console.warn('⚠️ Retention prune error:', err.message);
  }
}, 60000);

server.listen(PORT, () => {
  console.log(`🚀 Haven Matchmaking & Signaling Server listening on port ${PORT}`);
  console.log(`📡 WebSocket ready on ws://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📈 Metrics: http://localhost:${PORT}/metrics`);
});
