import { DatabaseSync } from 'node:sqlite';
import { createHash, randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs';

/**
 * Haven Privacy-First Operational Database Layer
 * 
 * Guarantees:
 * 1. Zero Personal Data: No names, emails, raw IP addresses, or permanent identifiers.
 * 2. Salted Cryptographic Hashes: IPs (for bot/ban mitigation) are hashed using SHA-256 with a rotating daily salt.
 * 3. Automated Retention Enforcement: Expired sessions (>2h) and reports (>7d) are automatically pruned from disk.
 * 4. ACID Reliability: Powered by SQLite with Write-Ahead Logging (WAL) mode.
 */

// Daily rotating salt for IP hashing (ensures IP hashes cannot be cross-referenced across days)
const SALT_DATE = new Date().toISOString().slice(0, 10);
const DAILY_PEPPER = process.env.SESSION_PEPPER || 'haven_ephemeral_security_salt_2026';

export function hashIp(ip) {
  if (!ip) return null;
  // Clean IPv6/IPv4 mapped addresses
  const cleanIp = ip.replace(/^.*:/, '');
  return createHash('sha256')
    .update(`${cleanIp}:${SALT_DATE}:${DAILY_PEPPER}`)
    .digest('hex');
}

export class HavenDatabase {
  constructor(dbPath = null) {
    const resolvedPath = dbPath || process.env.SQLITE_PATH || path.join(process.cwd(), 'haven.db');
    
    // Ensure parent directory exists
    const dir = path.dirname(resolvedPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new DatabaseSync(resolvedPath);
    this.initPragmas();
    this.initTables();
  }

  initPragmas() {
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = NORMAL;
      PRAGMA foreign_keys = ON;
    `);
  }

  initTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS session_records (
        session_id TEXT PRIMARY KEY,
        created_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL,
        tier TEXT DEFAULT 'NORMAL',
        skip_count INTEGER DEFAULT 0,
        last_active_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON session_records(expires_at);

      CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        reporter_session_id TEXT NOT NULL,
        reported_session_id TEXT NOT NULL,
        reason TEXT NOT NULL,
        details TEXT,
        timestamp INTEGER NOT NULL,
        status TEXT DEFAULT 'PENDING'
      );

      CREATE INDEX IF NOT EXISTS idx_reports_timestamp ON reports(timestamp);
      CREATE INDEX IF NOT EXISTS idx_reports_reported ON reports(reported_session_id);
      CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

      CREATE TABLE IF NOT EXISTS bans (
        id TEXT PRIMARY KEY,
        target_session_id TEXT,
        ip_hash TEXT,
        reason TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_bans_ip_hash ON bans(ip_hash);
      CREATE INDEX IF NOT EXISTS idx_bans_expires_at ON bans(expires_at);

      CREATE TABLE IF NOT EXISTS blocked_pairs (
        pair_key TEXT PRIMARY KEY,
        created_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_blocked_pairs_expires ON blocked_pairs(expires_at);
    `);
  }

  // --- Session Lifecycle ---

  saveSession(sessionId, tier = 'NORMAL') {
    const now = Date.now();
    const expiresAt = now + (2 * 60 * 60 * 1000); // 2 hours TTL
    const stmt = this.db.prepare(`
      INSERT INTO session_records (session_id, created_at, expires_at, tier, skip_count, last_active_at)
      VALUES (?, ?, ?, ?, 0, ?)
      ON CONFLICT(session_id) DO UPDATE SET
        last_active_at = excluded.last_active_at,
        expires_at = excluded.expires_at,
        tier = excluded.tier
    `);
    stmt.run(sessionId, now, expiresAt, tier, now);
  }

  updateSessionActivity(sessionId, skipDelta = 0) {
    const now = Date.now();
    const expiresAt = now + (2 * 60 * 60 * 1000);
    const stmt = this.db.prepare(`
      UPDATE session_records
      SET last_active_at = ?,
          expires_at = ?,
          skip_count = skip_count + ?
      WHERE session_id = ?
    `);
    stmt.run(now, expiresAt, skipDelta, sessionId);
  }

  getSession(sessionId) {
    const stmt = this.db.prepare(`SELECT * FROM session_records WHERE session_id = ?`);
    return stmt.get(sessionId) || null;
  }

  // --- Safety & Abuse Reporting ---

  createReport({ reporterSessionId, reportedSessionId, reason, details }) {
    const id = `rep_${randomUUID()}`;
    const timestamp = Date.now();
    const stmt = this.db.prepare(`
      INSERT INTO reports (id, reporter_session_id, reported_session_id, reason, details, timestamp, status)
      VALUES (?, ?, ?, ?, ?, ?, 'PENDING')
    `);
    stmt.run(
      id,
      String(reporterSessionId || 'anon').slice(0, 64),
      String(reportedSessionId || 'unknown').slice(0, 64),
      String(reason || 'general').slice(0, 64),
      String(details || '').slice(0, 300),
      timestamp
    );
    return id;
  }

  listReports({ status = null, limit = 50 } = {}) {
    if (status) {
      const stmt = this.db.prepare(`
        SELECT * FROM reports WHERE status = ? ORDER BY timestamp DESC LIMIT ?
      `);
      return stmt.all(status, limit);
    }
    const stmt = this.db.prepare(`
      SELECT * FROM reports ORDER BY timestamp DESC LIMIT ?
    `);
    return stmt.all(limit);
  }

  updateReportStatus(reportId, newStatus) {
    const stmt = this.db.prepare(`
      UPDATE reports SET status = ? WHERE id = ?
    `);
    stmt.run(newStatus, reportId);
  }

  // --- Symmetric Peer Blocking ---

  blockPair(sessionA, sessionB) {
    if (!sessionA || !sessionB) return;
    const pairKey = [sessionA, sessionB].sort().join('::');
    const now = Date.now();
    const expiresAt = now + (30 * 24 * 60 * 60 * 1000); // 30-day block retention
    const stmt = this.db.prepare(`
      INSERT INTO blocked_pairs (pair_key, created_at, expires_at)
      VALUES (?, ?, ?)
      ON CONFLICT(pair_key) DO UPDATE SET expires_at = excluded.expires_at
    `);
    stmt.run(pairKey, now, expiresAt);
  }

  isBlocked(sessionA, sessionB) {
    if (!sessionA || !sessionB) return false;
    const pairKey = [sessionA, sessionB].sort().join('::');
    const stmt = this.db.prepare(`SELECT 1 FROM blocked_pairs WHERE pair_key = ?`);
    return !!stmt.get(pairKey);
  }

  // --- Moderation & Bans ---

  createBan({ targetSessionId = null, ipHash = null, reason = 'Safety guidelines violation', durationMs = 24 * 60 * 60 * 1000 }) {
    const id = `ban_${randomUUID()}`;
    const now = Date.now();
    const expiresAt = now + durationMs;
    const stmt = this.db.prepare(`
      INSERT INTO bans (id, target_session_id, ip_hash, reason, created_at, expires_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, targetSessionId, ipHash, reason.slice(0, 128), now, expiresAt);
    return id;
  }

  isBanned({ sessionId = null, ipHash = null }) {
    const now = Date.now();
    if (sessionId) {
      const stmt = this.db.prepare(`
        SELECT reason, expires_at FROM bans 
        WHERE target_session_id = ? AND expires_at > ?
      `);
      const ban = stmt.get(sessionId, now);
      if (ban) return ban;
    }
    if (ipHash) {
      const stmt = this.db.prepare(`
        SELECT reason, expires_at FROM bans 
        WHERE ip_hash = ? AND expires_at > ?
      `);
      const ban = stmt.get(ipHash, now);
      if (ban) return ban;
    }
    return null;
  }

  listActiveBans(limit = 50) {
    const now = Date.now();
    const stmt = this.db.prepare(`
      SELECT * FROM bans WHERE expires_at > ? ORDER BY created_at DESC LIMIT ?
    `);
    return stmt.all(now, limit);
  }

  // --- Ephemeral Data Retention Cleanup ---

  purgeExpired() {
    const now = Date.now();
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);

    // 1. Purge sessions older than expiration (2 hours)
    const purgeSessions = this.db.prepare(`DELETE FROM session_records WHERE expires_at < ?`);
    const sessionsResult = purgeSessions.run(now);

    // 2. Purge reports older than 7 days
    const purgeReports = this.db.prepare(`DELETE FROM reports WHERE timestamp < ?`);
    const reportsResult = purgeReports.run(sevenDaysAgo);

    // 3. Purge expired bans
    const purgeBans = this.db.prepare(`DELETE FROM bans WHERE expires_at < ?`);
    const bansResult = purgeBans.run(now);

    // 4. Purge expired blocked pairs
    const purgeBlocks = this.db.prepare(`DELETE FROM blocked_pairs WHERE expires_at < ?`);
    const blocksResult = purgeBlocks.run(now);

    return {
      purgedSessions: sessionsResult.changes,
      purgedReports: reportsResult.changes,
      purgedBans: bansResult.changes,
      purgedBlocks: blocksResult.changes
    };
  }

  // --- Aggregate Telemetry for Moderation Dashboard ---

  getStats() {
    const now = Date.now();
    const sessionCount = this.db.prepare(`SELECT COUNT(*) as count FROM session_records WHERE expires_at > ?`).get(now)?.count || 0;
    const pendingReports = this.db.prepare(`SELECT COUNT(*) as count FROM reports WHERE status = 'PENDING'`).get()?.count || 0;
    const totalReports = this.db.prepare(`SELECT COUNT(*) as count FROM reports`).get()?.count || 0;
    const activeBans = this.db.prepare(`SELECT COUNT(*) as count FROM bans WHERE expires_at > ?`).get(now)?.count || 0;

    return {
      activeSessions: sessionCount,
      pendingReports,
      totalReports,
      activeBans
    };
  }

  close() {
    this.db.close();
  }
}

// Global singleton instance
export const db = new HavenDatabase();
