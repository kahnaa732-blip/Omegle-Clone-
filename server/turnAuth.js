import crypto from 'crypto';

/**
 * Generates ephemeral TURN credentials according to the TURN REST API specification (RFC 5766).
 * Used by Coturn with `use-auth-secret` and `static-auth-secret`.
 */
export function getIceServers(socketId = 'anon') {
  const turnSecret = process.env.TURN_SECRET || 'haven_turn_secret_key_2026';
  const turnHost = process.env.TURN_HOST || 'localhost';
  const turnPort = process.env.TURN_PORT || '3478';
  const turnsPort = process.env.TURNS_PORT || '5349';
  const ttlSeconds = parseInt(process.env.TURN_TTL || '600', 10); // 10 minutes session cap

  const timestamp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const username = `${timestamp}:${socketId}`;

  // HMAC-SHA1 signature of username using turnSecret
  const hmac = crypto.createHmac('sha1', turnSecret);
  hmac.update(username);
  const credential = hmac.digest('base64');

  const iceServers = [
    // Public Google STUN servers (primary NAT hole-punching, zero cost)
    {
      urls: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302'
      ]
    },
    // Ephemeral Authenticated TURN Relay Servers (RFC 5766)
    {
      urls: [
        `turn:${turnHost}:${turnPort}?transport=udp`,
        `turn:${turnHost}:${turnPort}?transport=tcp`
      ],
      username,
      credential
    },
    {
      urls: [
        `turns:${turnHost}:${turnsPort}?transport=tcp`
      ],
      username,
      credential
    }
  ];

  return {
    iceServers,
    expiresAt: timestamp,
    ttl: ttlSeconds
  };
}
