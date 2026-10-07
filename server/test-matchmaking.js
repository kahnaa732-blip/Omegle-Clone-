import assert from 'assert';
import { Matchmaker } from './matchmaking.js';
import { ReputationManager } from './reputation.js';
import { getIceServers } from './turnAuth.js';

console.log('🧪 Running Unit & Integration Tests for Omegal Core Logic...');

// 1. Test TURN Auth
const iceConfig = getIceServers('test_socket_123');
assert(Array.isArray(iceConfig.iceServers), 'iceServers should be an array');
assert(iceConfig.iceServers.length > 0, 'Should contain default STUN servers');
console.log('✅ TURN Auth & STUN config generated successfully');

// 2. Test Reputation Manager
const rep = new ReputationManager();
const sessA = 'session_alpha';
await rep.recordMatchStart(sessA);

// Simulate 7 rapid skips within 60s
for (let i = 0; i < 7; i++) {
  await rep.recordSkip(sessA);
}

const status = await rep.getReputation(sessA);
assert.strictEqual(status.tier, 'FAST_SKIPPER', 'User should be placed into FAST_SKIPPER queue');
console.log('✅ Reputation Manager: Fast-skipper sliding window detected correctly');

// 3. Test Matchmaker Dual-Queue Pairing
const mm = new Matchmaker();
const user1 = { socketId: 'sock_1', sessionId: 'sess_1', tier: 'NORMAL' };
const user2 = { socketId: 'sock_2', sessionId: 'sess_2', tier: 'NORMAL' };

// Enqueue user 1
const res1 = await mm.findMatch(user1);
assert.strictEqual(res1, null, 'User 1 should wait in queue');

// Enqueue user 2 -> should pair immediately!
const res2 = await mm.findMatch(user2);
assert(res2 !== null, 'User 2 should trigger immediate match');
assert(res2.roomId.startsWith('room_'), 'Room ID should start with room_');
console.log('✅ Matchmaker: Atomic pair formed:', res2.roomId);

// Cleanup & Leave room
const leave = mm.leaveRoom('sock_1');
assert.strictEqual(leave.partnerId, 'sock_2', 'Partner ID should match sock_2');
console.log('✅ Matchmaker: Room teardown and partner lookup verified');

// 4. Test Interest-based Matching
const gamerA = { socketId: 'gamer_1', sessionId: 's_g1', tier: 'NORMAL', mode: 'video', interests: ['gaming', 'anime'] };
const coderB = { socketId: 'coder_1', sessionId: 's_c1', tier: 'NORMAL', mode: 'video', interests: ['coding'] };
const gamerC = { socketId: 'gamer_2', sessionId: 's_g2', tier: 'NORMAL', mode: 'video', interests: ['gaming', 'music'] };

await mm.findMatch(gamerA);
await mm.findMatch(coderB);
// gamerC joins -> should pair with gamerA because of shared 'gaming' interest!
const interestMatch = await mm.findMatch(gamerC);
assert(interestMatch !== null, 'Should match immediately');
assert(interestMatch.userA === 'gamer_2' && interestMatch.userB === 'gamer_1', 'Should prioritize shared interest partner');
assert(interestMatch.sharedInterests.includes('gaming'), 'Should identify shared interest');
// 5. Test Blocked Pair Prevention
const mmBlock = new Matchmaker();
const userX = { socketId: 'sock_x', sessionId: 'sess_x', tier: 'NORMAL', mode: 'text' };
const userY = { socketId: 'sock_y', sessionId: 'sess_y', tier: 'NORMAL', mode: 'text' };
const userZ = { socketId: 'sock_z', sessionId: 'sess_z', tier: 'NORMAL', mode: 'text' };

// Block userX and userY
mmBlock.blockPair('sess_x', 'sess_y');
assert.strictEqual(mmBlock.isBlocked('sess_x', 'sess_y'), true, 'Should confirm pair is blocked');
assert.strictEqual(mmBlock.isBlocked('sess_y', 'sess_x'), true, 'Symmetric block check');

// User Y enqueues
await mmBlock.findMatch(userY);
// User X enqueues -> should NOT match user Y because they are blocked!
const blockedMatch = await mmBlock.findMatch(userX);
assert.strictEqual(blockedMatch, null, 'User X must not match with blocked user Y');

// User Z enqueues -> should match user Y (not blocked)
const validMatch = await mmBlock.findMatch(userZ);
assert(validMatch !== null, 'User Z should match with user Y');
console.log('✅ Matchmaker: Blocked pair protection verified (users never meet again)');

console.log('🎉 ALL INTEGRATION TESTS PASSED!');
