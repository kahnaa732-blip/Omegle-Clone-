import { randomUUID } from 'crypto';
import { db } from './db.js';

/**
 * Haven Matchmaking Engine
 * 
 * Safety & Privacy Design:
 * - Safety eligibility verification (bans & quarantine isolation)
 * - Symmetric peer blocklist (blocked pairs never match)
 * - Multi-criteria scoring: Shared Topics > Voluntary Language > Wait-time fairness
 * - Fair queue scheduling to prevent queue manipulation
 * - Separate quarantine queue for detected fast-skippers
 */
export class Matchmaker {
  constructor(redisClient = null) {
    this.redis = redisClient;
    // In-memory queues
    this.normalQueue = [];       // array of { socketId, sessionId, tier, mode, interests, language, joinedAt }
    this.fastSkipperQueue = [];  // array of { socketId, sessionId, tier, mode, interests, language, joinedAt }
    
    // Active rooms: roomId -> { userA, userB, mode, sharedInterests, language, createdAt }
    this.activeRooms = new Map();
    // Socket to room mapping: socketId -> roomId
    this.socketToRoom = new Map();
    // In-memory fast cache of blocked session pairs: Set("sessionId1::sessionId2")
    this.blockedPairs = new Set();
  }

  setRedis(client) {
    this.redis = client;
  }

  blockPair(sessionA, sessionB) {
    if (!sessionA || !sessionB) return;
    const key = [sessionA, sessionB].sort().join('::');
    this.blockedPairs.add(key);
    db.blockPair(sessionA, sessionB);
  }

  isBlocked(sessionA, sessionB) {
    if (!sessionA || !sessionB) return false;
    const key = [sessionA, sessionB].sort().join('::');
    if (this.blockedPairs.has(key)) return true;
    return db.isBlocked(sessionA, sessionB);
  }

  /**
   * Enqueue a user or attempt immediate pairing
   * @param {Object} user { socketId, sessionId, tier, mode, interests, language }
   * @returns {Object|null} Match result if paired immediately, or null if queued
   */
  async findMatch(user) {
    this.leaveRoom(user.socketId);
    this.dequeue(user.socketId);

    const mode = user.mode || 'text';
    const userLang = (user.language || 'any').toLowerCase().trim();
    const userInterests = (user.interests || []).map(i => i.toLowerCase().trim()).filter(Boolean);
    const now = Date.now();

    const targetQueue = user.tier === 'FAST_SKIPPER' 
      ? this.fastSkipperQueue 
      : this.normalQueue;

    let partnerIndex = -1;
    let sharedInterests = [];
    let bestScore = -1;

    // Evaluate all candidates in queue to find the highest compatibility match
    for (let i = 0; i < targetQueue.length; i++) {
      const candidate = targetQueue[i];

      // Fundamental safety & compatibility invariants
      if (candidate.socketId === user.socketId) continue;
      if (candidate.sessionId === user.sessionId) continue;
      if (candidate.mode !== mode) continue;
      if (this.isBlocked(user.sessionId, candidate.sessionId)) continue;

      const waitTimeSeconds = (now - candidate.joinedAt) / 1000;
      const candLang = (candidate.language || 'any').toLowerCase().trim();

      // Language check: Match if either user selected 'any' or both selected same language
      const langMatch = userLang === 'any' || candLang === 'any' || userLang === candLang;
      if (!langMatch && waitTimeSeconds < 8) {
        // If language strictly mismatches and wait time < 8s, defer candidate to allow same-language pairing
        continue;
      }

      // Check common topics
      const candInterests = candidate.interests || [];
      const common = candInterests.filter(t => userInterests.includes(t));

      // If both users specified interests but have zero in common, defer match if wait time < 8s
      if (userInterests.length > 0 && candInterests.length > 0 && common.length === 0 && waitTimeSeconds < 8) {
        continue;
      }
      
      // Calculate matchmaking score
      let score = 0;
      if (common.length > 0) {
        score += 100 + (common.length * 20); // Prioritize shared interests heavily
      }
      if (userLang !== 'any' && userLang === candLang) {
        score += 30; // Bonus for explicit voluntary language match
      }
      // Wait-time fairness bonus: Candidate waiting longer gets prioritized
      score += Math.min(waitTimeSeconds * 2, 40);

      if (score > bestScore) {
        bestScore = score;
        partnerIndex = i;
        sharedInterests = common;
      }
    }

    // If no candidate available, enqueue user
    if (partnerIndex === -1) {
      targetQueue.push({
        socketId: user.socketId,
        sessionId: user.sessionId,
        tier: user.tier,
        mode,
        language: userLang,
        interests: userInterests,
        joinedAt: now
      });
      return null;
    }

    // Extract selected partner from queue
    const partner = targetQueue.splice(partnerIndex, 1)[0];

    // Compute shared interests if not already calculated
    if (sharedInterests.length === 0 && partner.interests) {
      sharedInterests = partner.interests.filter(t => userInterests.includes(t));
    }

    // Create paired room
    const roomId = `room_${randomUUID()}`;
    const roomData = {
      id: roomId,
      userA: user.socketId,
      userB: partner.socketId,
      sessionA: user.sessionId,
      sessionB: partner.sessionId,
      mode,
      sharedInterests,
      language: userLang !== 'any' ? userLang : partner.language,
      createdAt: now
    };

    this.activeRooms.set(roomId, roomData);
    this.socketToRoom.set(user.socketId, roomId);
    this.socketToRoom.set(partner.socketId, roomId);

    return {
      roomId,
      userA: user.socketId,
      userB: partner.socketId,
      mode,
      sharedInterests
    };
  }

  dequeue(socketId) {
    this.normalQueue = this.normalQueue.filter(u => u.socketId !== socketId);
    this.fastSkipperQueue = this.fastSkipperQueue.filter(u => u.socketId !== socketId);
  }

  leaveRoom(socketId) {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return null;

    const room = this.activeRooms.get(roomId);
    if (!room) {
      this.socketToRoom.delete(socketId);
      return null;
    }

    const partnerId = room.userA === socketId ? room.userB : room.userA;

    this.activeRooms.delete(roomId);
    this.socketToRoom.delete(socketId);
    this.socketToRoom.delete(partnerId);

    return {
      roomId,
      partnerId,
      leftUserId: socketId,
      duration: (Date.now() - room.createdAt) / 1000
    };
  }

  getRoom(socketId) {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return null;
    return this.activeRooms.get(roomId);
  }

  getStats() {
    return {
      waitingNormal: this.normalQueue.length,
      waitingFastSkipper: this.fastSkipperQueue.length,
      activeRooms: this.activeRooms.size,
      activeUsers: this.activeRooms.size * 2 + this.normalQueue.length + this.fastSkipperQueue.length
    };
  }
}
