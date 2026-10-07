/**
 * Skip-Rate Reputation & Grief Prevention System
 * Separates users into tiers:
 * - 'NORMAL': Healthy conversation length and normal skipping behavior.
 * - 'FAST_SKIPPER': Users skipping faster than 3-5 seconds repeatedly (isolated in their own queue or cooldown).
 * - 'FLAGGED': Users reported for non-consensual behavior / safety violations.
 */

export class ReputationManager {
  constructor(redisClient = null) {
    this.redis = redisClient;
    // In-memory fallback
    this.memSkips = new Map(); // sessionId -> number[] (timestamps)
    this.memMatches = new Map(); // sessionId -> number (timestamp started)
    this.memReports = new Map(); // sessionId -> number
  }

  setRedis(client) {
    this.redis = client;
  }

  async recordMatchStart(sessionId) {
    const now = Date.now();
    if (this.redis) {
      try {
        await this.redis.set(`match_start:${sessionId}`, now, 'EX', 1800);
        return;
      } catch (err) {
        // Fallback to memory on Redis error
      }
    }
    this.memMatches.set(sessionId, now);
  }

  async recordSkip(sessionId) {
    const now = Date.now();
    let duration = 0;

    if (this.redis) {
      try {
        const start = await this.redis.get(`match_start:${sessionId}`);
        if (start) {
          duration = (now - parseInt(start, 10)) / 1000;
        }
        const key = `skips:${sessionId}`;
        await this.redis.zadd(key, now, `${now}`);
        // Prune skips older than 60 seconds
        await this.redis.zremrangebyscore(key, '-inf', now - 60000);
        await this.redis.expire(key, 120);
        return { duration };
      } catch (err) {
        // Fallback to memory
      }
    }

    const start = this.memMatches.get(sessionId);
    if (start) {
      duration = (now - start) / 1000;
    }

    const timestamps = this.memSkips.get(sessionId) || [];
    const valid = timestamps.filter(t => now - t < 60000);
    valid.push(now);
    this.memSkips.set(sessionId, valid);

    return { duration };
  }

  async recordReport(sessionId) {
    if (this.redis) {
      try {
        const reports = await this.redis.incr(`reports:${sessionId}`);
        await this.redis.expire(`reports:${sessionId}`, 3600);
        return reports;
      } catch (err) {
        // Fallback to memory
      }
    }
    const current = (this.memReports.get(sessionId) || 0) + 1;
    this.memReports.set(sessionId, current);
    return current;
  }

  async getReputation(sessionId) {
    const now = Date.now();
    let skipCount = 0;
    let reports = 0;

    if (this.redis) {
      try {
        const key = `skips:${sessionId}`;
        await this.redis.zremrangebyscore(key, '-inf', now - 60000);
        skipCount = await this.redis.zcard(key);
        const reportVal = await this.redis.get(`reports:${sessionId}`);
        reports = reportVal ? parseInt(reportVal, 10) : 0;
      } catch (err) {
        skipCount = (this.memSkips.get(sessionId) || []).filter(t => now - t < 60000).length;
        reports = this.memReports.get(sessionId) || 0;
      }
    } else {
      const timestamps = (this.memSkips.get(sessionId) || []).filter(t => now - t < 60000);
      skipCount = timestamps.length;
      reports = this.memReports.get(sessionId) || 0;
    }

    if (reports >= 2) {
      return {
        tier: 'FLAGGED',
        skipCount,
        reports,
        description: 'Under review due to partner reports'
      };
    }

    // High skip rate (> 6 skips in 60s)
    if (skipCount >= 6) {
      return {
        tier: 'FAST_SKIPPER',
        skipCount,
        reports,
        description: 'Rapid-skipping detected (low priority / peer quarantine queue)'
      };
    }

    return {
      tier: 'NORMAL',
      skipCount,
      reports,
      description: 'Standard reputation'
    };
  }

  cleanup(sessionId) {
    this.memSkips.delete(sessionId);
    this.memMatches.delete(sessionId);
    this.memReports.delete(sessionId);
  }
}
