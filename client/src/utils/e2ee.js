/**
 * End-to-End Encryption (E2EE) Engine for Omegal
 * 
 * Cryptographic Standard:
 * - Key Agreement: ECDH (Elliptic Curve Diffie-Hellman) using NIST P-256 (secp256r1)
 * - Cipher: Authenticated AES-GCM (Galois/Counter Mode) with 256-bit symmetric keys
 * - Nonce/IV: Cryptographically secure 96-bit (12-byte) random initialization vectors per message
 * - Safety Fingerprint: SHA-256 digest of canonically ordered public keys formatted as 4-block verification codes
 * - Zero Knowledge: Ephemeral private keys never leave browser memory and are destroyed on disconnect
 */

// Helper to convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Helper to convert Base64 to ArrayBuffer
function base64ToArrayBuffer(base64) {
  const binary = window.atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export class E2EESession {
  constructor() {
    this.keyPair = null;
    this.localPublicKeyB64 = null;
    this.remotePublicKeyB64 = null;
    this.sharedAesKey = null;
    this.fingerprint = null;
    this.isReady = false;
  }

  /**
   * Generates a new ephemeral ECDH P-256 key pair.
   * Private key is non-extractable for maximum security against memory extraction.
   */
  async init() {
    if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
      console.warn('⚠️ Web Crypto API is unavailable in this environment.');
      return null;
    }

    try {
      this.keyPair = await window.crypto.subtle.generateKey(
        {
          name: 'ECDH',
          namedCurve: 'P-256'
        },
        false, // Non-extractable private key
        ['deriveKey', 'deriveBits']
      );

      const exportedPub = await window.crypto.subtle.exportKey('raw', this.keyPair.publicKey);
      this.localPublicKeyB64 = arrayBufferToBase64(exportedPub);
      return this.localPublicKeyB64;
    } catch (err) {
      console.error('Failed to initialize E2EE key pair:', err);
      return null;
    }
  }

  /**
   * Returns this peer's public key in Base64 string format for exchange.
   */
  getPublicKey() {
    return this.localPublicKeyB64;
  }

  /**
   * Imports the stranger's public key and computes ECDH shared secret to derive a 256-bit AES-GCM key.
   */
  async setRemotePublicKey(remoteKeyB64) {
    if (!remoteKeyB64 || !this.keyPair) {
      return false;
    }

    try {
      this.remotePublicKeyB64 = remoteKeyB64;
      const remoteRaw = base64ToArrayBuffer(remoteKeyB64);

      const importedRemoteKey = await window.crypto.subtle.importKey(
        'raw',
        remoteRaw,
        {
          name: 'ECDH',
          namedCurve: 'P-256'
        },
        true,
        []
      );

      // Derive AES-GCM 256-bit symmetric session key
      this.sharedAesKey = await window.crypto.subtle.deriveKey(
        {
          name: 'ECDH',
          public: importedRemoteKey
        },
        this.keyPair.privateKey,
        {
          name: 'AES-GCM',
          length: 256
        },
        false, // Non-extractable derived symmetric key
        ['encrypt', 'decrypt']
      );

      this.fingerprint = await this.calculateFingerprint();
      this.isReady = true;
      return true;
    } catch (err) {
      console.error('Failed to derive E2EE shared key:', err);
      return false;
    }
  }

  /**
   * Generates a deterministic SHA-256 safety fingerprint code.
   * Both peers generate the identical fingerprint regardless of who initiated the call.
   */
  async calculateFingerprint() {
    if (!this.localPublicKeyB64 || !this.remotePublicKeyB64) return null;

    try {
      const sortedKeys = [this.localPublicKeyB64, this.remotePublicKeyB64].sort().join('::');
      const encoder = new TextEncoder();
      const digest = await window.crypto.subtle.digest('SHA-256', encoder.encode(sortedKeys));
      const hashArray = Array.from(new Uint8Array(digest));
      const hex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();

      // Return a sleek 16-character safety number formatted in 4 distinct blocks: "ABCD-EF01-2345-6789"
      return `${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}`;
    } catch (err) {
      console.warn('Fingerprint computation failed:', err);
      return null;
    }
  }

  /**
   * Encrypts plaintext string or JSON payload into an authenticated AES-GCM ciphertext package.
   */
  async encrypt(data) {
    if (!this.isReady || !this.sharedAesKey) {
      // Fallback if keys are still negotiating
      return { e2ee: false, plain: data };
    }

    try {
      // 12-byte cryptographically random IV (NIST recommendation for GCM)
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const str = typeof data === 'string' ? data : JSON.stringify(data);
      const encoded = new TextEncoder().encode(str);

      const ciphertext = await window.crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv
        },
        this.sharedAesKey,
        encoded
      );

      return {
        e2ee: true,
        iv: arrayBufferToBase64(iv.buffer),
        data: arrayBufferToBase64(ciphertext)
      };
    } catch (err) {
      console.error('E2EE encryption error:', err);
      return { e2ee: false, plain: data };
    }
  }

  /**
   * Decrypts an authenticated AES-GCM ciphertext package.
   * Throws if tampered with or if authentication tag fails.
   */
  async decrypt(payload) {
    if (!payload) return null;

    // Check if the payload is an E2EE encrypted bundle
    if (!payload.e2ee || !payload.iv || !payload.data) {
      return payload.plain !== undefined ? payload.plain : payload;
    }

    if (!this.isReady || !this.sharedAesKey) {
      throw new Error('E2EE session key is not established yet');
    }

    try {
      const ivBuffer = base64ToArrayBuffer(payload.iv);
      const dataBuffer = base64ToArrayBuffer(payload.data);

      const decrypted = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: new Uint8Array(ivBuffer)
        },
        this.sharedAesKey,
        dataBuffer
      );

      const decodedStr = new TextDecoder().decode(decrypted);
      try {
        return JSON.parse(decodedStr);
      } catch {
        return decodedStr;
      }
    } catch (err) {
      console.error('E2EE authentication failed (tampered data or mismatched key):', err);
      throw new Error('Message authenticity verification failed');
    }
  }

  /**
   * Securely resets the session and clears all keys from memory.
   */
  destroy() {
    this.keyPair = null;
    this.localPublicKeyB64 = null;
    this.remotePublicKeyB64 = null;
    this.sharedAesKey = null;
    this.fingerprint = null;
    this.isReady = false;
  }
}
