#!/usr/bin/env bash
# ==============================================================================
# Automated Provisioning Script for Coturn STUN/TURN Server on Ubuntu 22.04 / 24.04
# ==============================================================================

set -euo pipefail

if [[ $EUID -ne 0 ]]; then
   echo "❌ This script must be run as root (use sudo)." 
   exit 1
fi

echo "=========================================="
echo "🚀 Setting up Coturn STUN/TURN Server"
echo "=========================================="

DOMAIN=${1:-"turn.yourdomain.com"}
SECRET=${2:-$(openssl rand -hex 32)}

echo "📌 Domain / Realm: $DOMAIN"
echo "🔑 Ephemeral Auth Secret: $SECRET"

# 1. Update and install packages
echo "📦 Updating apt and installing coturn..."
apt-get update -y
apt-get install -y coturn ufw

# 2. Enable coturn daemon in /etc/default/coturn
echo "⚙️ Enabling Coturn service daemon..."
sed -i 's/#TURNSERVER_ENABLED=1/TURNSERVER_ENABLED=1/g' /etc/default/coturn || true
echo "TURNSERVER_ENABLED=1" >> /etc/default/coturn

# 3. Create log directory
mkdir -p /var/log/turnserver
chown -R turnserver:turnserver /var/log/turnserver

# 4. Generate turnserver.conf
echo "📝 Writing /etc/turnserver.conf..."
cat <<EOF > /etc/turnserver.conf
listening-port=3478
tls-listening-port=5349
min-port=49152
max-port=65535
verbose
fingerprint
lt-cred-mech
use-auth-secret
static-auth-secret=$SECRET
realm=$DOMAIN
max-allocate-lifetime=600
stale-nonce=600
total-quota=0
user-quota=10
no-loopback-peers
no-multicast-peers
no-cli
log-file=/var/log/turnserver/turnserver.log
simple-log
EOF

# 5. Configure UFW Firewall rules
echo "🛡️ Configuring Firewall (UFW)..."
ufw allow 22/tcp || true
ufw allow 3478/tcp
ufw allow 3478/udp
ufw allow 5349/tcp
ufw allow 5349/udp
ufw allow 49152:65535/udp
ufw --force enable

# 6. Restart and enable Coturn service
echo "🔄 Starting Coturn service..."
systemctl daemon-reload
systemctl restart coturn
systemctl enable coturn

echo "=========================================="
echo "✅ Coturn setup successfully completed!"
echo "📡 TURN Ports: 3478 (UDP/TCP), 5349 (TLS)"
echo "📡 Relay Port Range: 49152-65535 (UDP)"
echo "🔑 Put this TURN_SECRET in your server .env:"
echo "TURN_SECRET=$SECRET"
echo "TURN_HOST=<your-server-public-ip>"
echo "=========================================="
