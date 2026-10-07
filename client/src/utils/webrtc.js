/**
 * WebRTC P2P Connection Manager
 * Handles MediaStream exchange, RTCDataChannel for encrypted text chat,
 * and ICE candidate negotiation with STUN/TURN fallback.
 * 
 * 🛡️ Security Hardening:
 * - Sanitizes SDP to strip internal LAN IP addresses (192.168.x.x, 10.x.x.x, .local).
 * - Suppresses private host ICE candidates to prevent network layout fingerprinting.
 * - Supports Ghost Mode (forceRelay) to route all media strictly through TURN, concealing public IP.
 */

function sanitizeSDP(sdp) {
  if (!sdp || typeof sdp !== 'string') return sdp;
  // Strip out local host candidate lines (typ host) so internal LAN topology is never disclosed
  return sdp.replace(/a=candidate:[^\r\n]+ typ host[^\r\n]*\r\n/g, '');
}

export class WebRTCConnection {
  constructor(config = {}) {
    this.iceServers = config.iceServers || [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ];
    this.forceRelay = !!config.forceRelay;
    this.localStream = config.localStream || null;
    this.onRemoteStream = config.onRemoteStream || (() => {});
    this.onIceCandidate = config.onIceCandidate || (() => {});
    this.onConnectionState = config.onConnectionState || (() => {});
    this.onDataChannelMessage = config.onDataChannelMessage || (() => {});
    this.onDataChannelState = config.onDataChannelState || (() => {});

    this.peerConnection = null;
    this.dataChannel = null;
  }

  initialize() {
    this.peerConnection = new RTCPeerConnection({
      iceServers: this.iceServers,
      iceTransportPolicy: this.forceRelay ? 'relay' : 'all',
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require',
      iceCandidatePoolSize: 10
    });

    // Add local media tracks if available
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        this.peerConnection.addTrack(track, this.localStream);
      });
    }

    // Remote track listener
    this.peerConnection.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        this.onRemoteStream(event.streams[0]);
      }
    };

    // 🛡️ Privacy-Preserving ICE candidate listener
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && event.candidate.candidate) {
        const str = event.candidate.candidate;
        // Drop private LAN IP addresses and local machine hostnames
        const isPrivate = /typ host/i.test(str) && (
          /192\.168\./.test(str) ||
          /10\.\d{1,3}\./.test(str) ||
          /172\.(1[6-9]|2\d|3[01])\./.test(str) ||
          /\.local/i.test(str)
        );

        if (!isPrivate) {
          this.onIceCandidate(event.candidate);
        }
      }
    };

    // Connection state listeners
    this.peerConnection.oniceconnectionstatechange = () => {
      this.onConnectionState(this.peerConnection.iceConnectionState);
    };

    this.peerConnection.onconnectionstatechange = () => {
      this.onConnectionState(this.peerConnection.connectionState);
    };

    // Setup listener for incoming DataChannel (receiver side)
    this.peerConnection.ondatachannel = (event) => {
      this.setDataChannel(event.channel);
    };
  }

  // Initiator creates DataChannel
  createDataChannel() {
    if (!this.peerConnection) return;
    const channel = this.peerConnection.createDataChannel('p2p_chat', {
      ordered: true
    });
    this.setDataChannel(channel);
  }

  setDataChannel(channel) {
    this.dataChannel = channel;
    this.dataChannel.onopen = () => {
      this.onDataChannelState('open');
    };
    this.dataChannel.onclose = () => {
      this.onDataChannelState('closed');
    };
    this.dataChannel.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed) {
          if (parsed.e2ee) {
            // Forward E2EE payload directly to handler for authenticated decryption
            this.onDataChannelMessage(parsed);
          } else if (typeof parsed.text === 'string') {
            parsed.text = parsed.text.slice(0, 500);
            this.onDataChannelMessage(parsed);
          }
        }
      } catch (err) {
        if (typeof event.data === 'string') {
          this.onDataChannelMessage({ text: event.data.slice(0, 500), timestamp: Date.now() });
        }
      }
    };
  }

  sendDataMessage(payload) {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      // Validate and limit payload size
      if (payload && typeof payload.text === 'string') {
        payload.text = payload.text.slice(0, 500);
      }
      this.dataChannel.send(JSON.stringify(payload));
      return true;
    }
    return false;
  }

  _apply60FpsParameters() {
    if (!this.peerConnection) return;
    try {
      this.peerConnection.getSenders().forEach((sender) => {
        if (sender.track && sender.track.kind === 'video' && sender.getParameters) {
          const params = sender.getParameters();
          if (params.encodings && params.encodings.length > 0) {
            params.encodings[0].maxFramerate = 60;
            params.encodings[0].maxBitrate = 2500000; // 2.5 Mbps for silky-smooth 60 FPS
            sender.setParameters(params).catch(() => {});
          }
        }
      });
    } catch (e) {
      // Graceful fallback if browser does not permit parameter adjustments yet
    }
  }

  async createOffer() {
    if (!this.peerConnection) this.initialize();
    this.createDataChannel();
    const offer = await this.peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true
    });
    await this.peerConnection.setLocalDescription(offer);
    this._apply60FpsParameters();
    return {
      type: offer.type,
      sdp: sanitizeSDP(offer.sdp)
    };
  }

  async handleOffer(offer) {
    if (!this.peerConnection) this.initialize();
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    this._apply60FpsParameters();
    return {
      type: answer.type,
      sdp: sanitizeSDP(answer.sdp)
    };
  }

  async handleAnswer(answer) {
    if (!this.peerConnection) return;
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    this._apply60FpsParameters();
  }

  async addIceCandidate(candidate) {
    if (!this.peerConnection) return;
    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.warn('Error adding ICE candidate:', err);
    }
  }

  // 📺 Dynamic screen share track replacement
  async replaceVideoTrack(newTrack) {
    if (!this.peerConnection) return false;
    try {
      const senders = this.peerConnection.getSenders();
      const videoSender = senders.find(s => s.track && s.track.kind === 'video');
      if (videoSender) {
        await videoSender.replaceTrack(newTrack);
        return true;
      }
    } catch (err) {
      console.warn('Failed to replace video track:', err);
    }
    return false;
  }

  close() {
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
  }
}
