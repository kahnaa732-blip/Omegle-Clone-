# 🚀 Go-to-Market (GTM) Production Checklist

A battle-tested production operations guide for launching Omegal Modern safely, legally, and cost-effectively.

---

## 1. Traffic Firewall & Cloudflare Protection
- [ ] **Cloudflare Proxying:** Ensure the root domain and `turn` subdomains are registered in Cloudflare. (Note: Coturn TURN UDP relay traffic on ports 3478/49152+ must connect directly to the VPS IP, not proxied through standard Cloudflare HTTP CDN).
- [ ] **Cloudflare Turnstile:**
  - Create a Turnstile widget in Cloudflare Dashboard under **Turnstile > Add Site**.
  - Set Widget Mode to **Managed** (invisible challenge unless suspicious).
  - Add `TURNSTILE_SECRET_KEY` into `server/.env`.
  - Add your Turnstile Site Key into `client/src/components/TurnstileModal.jsx`.
- [ ] **WAF Rate Limiting:**
  - Create a custom WAF rate limiting rule on `/socket.io/`:
    - Action: Block or Challenge
    - Threshold: > 25 requests per 10 seconds per IP.
  - This prevents botnets and automated scrapers from flooding the matchmaking queue.

---

## 2. Zero-Retention Log Management (Privacy & Legal Compliance)
- [ ] **No IP-to-Session Database Records:**
  - Omegal stores **zero** user profiles, chat history, or persistent IP addresses in any database.
  - Redis runs in purely ephemeral RAM mode:
    ```bash
    redis-server --save "" --appendonly no
    ```
- [ ] **24-Hour Strict Log Rotation:**
  - Deploy `deploy/logrotate.conf` to `/etc/logrotate.d/omegal`:
    ```bash
    sudo cp deploy/logrotate.conf /etc/logrotate.d/omegal
    sudo chmod 644 /etc/logrotate.d/omegal
    ```
  - This ensures logs rotate daily and old logs are automatically purged after 24 hours.

---

## 3. Bandwidth Cap & Cost Optimization on Coturn (STUN/TURN)
Direct P2P connections consume **zero server bandwidth** because video and audio packets flow directly between browsers. However, when users are behind strict symmetric NATs (cellular data, university firewalls), Coturn relays media.

- [ ] **Relay Lifetime Cap (10 Minutes):**
  - In `/etc/turnserver.conf`, ensure:
    ```ini
    max-allocate-lifetime=600
    stale-nonce=600
    ```
  - This terminates TURN relay media after 10 continuous minutes. If users chat longer, direct P2P remains active or they re-authenticate, eliminating indefinite multi-gigabyte relay streaming from unattended tabs.
- [ ] **Ephemeral Secret Rotation:**
  - Use a strong 256-bit secret for `TURN_SECRET`.
  - Credentials expire automatically every 10 minutes (TTL enforced via RFC 5766 HMAC timestamp tokens).

---

## 4. Client-Side Video Guard & Moderation Architecture
- [ ] **On-Device Frame Processing:**
  - Runs 100% locally via WebGL/WASM in `@tensorflow/tfjs`.
  - Video frames are **never** uploaded to external servers, protecting user privacy and eliminating server-side vision AI inference costs ($0 CPU/GPU cloud bill for moderation).
- [ ] **Dynamic Canvas Shield:**
  - Automatically engages a heavy blur filter when suspicious skin-tone saturation or visual anomalies are detected.
  - User retains an override review button and a quick report button.
- [ ] **Skip-Rate Quarantine:**
  - Users skipping faster than 3-5 seconds repeatedly are quarantined in the `FAST_SKIPPER` queue, isolating trolls from standard users.
