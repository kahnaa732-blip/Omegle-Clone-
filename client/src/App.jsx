import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { LandingHero } from './components/LandingHero.jsx';
import { VideoStage } from './components/VideoStage.jsx';
import { ChatPanel } from './components/ChatPanel.jsx';
import { ControlBar } from './components/ControlBar.jsx';
import { TopNavTopics } from './components/TopNavTopics.jsx';
import { SettingsModal } from './components/SettingsModal.jsx';
import { ReportModal } from './components/ReportModal.jsx';
import { LegalModal } from './components/LegalModal.jsx';
import { ModerationModal } from './components/ModerationModal.jsx';
import { E2EEModal } from './components/E2EEModal.jsx';
import { TurnstileModal } from './components/TurnstileModal.jsx';
import { VideoGuard } from './moderation/moderation.js';
import { WebRTCConnection } from './utils/webrtc.js';
import { E2EESession } from './utils/e2ee.js';
import { sounds } from './utils/soundEffects.js';
import { AVAILABLE_LANGUAGES } from './utils/languages.js';
import { 
  ShieldCheck, 
  Video, 
  Lock, 
  Sparkles, 
  MessageSquare, 
  LogOut, 
  EyeOff, 
  AlertCircle,
  Globe,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function App() {
  // Navigation Flow: Landing View vs In-Chat View
  const [isInChat, setIsInChat] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);

  // Session & Socket State
  const [socket, setSocket] = useState(null);
  const [onlineCount, setOnlineCount] = useState(1);
  const [connectionState, setConnectionState] = useState('idle'); // idle | waiting | connected
  const [iceState, setIceState] = useState('disconnected');
  const [reputation, setReputation] = useState({ tier: 'NORMAL', skipCount: 0 });
  const [turnstileVerified, setTurnstileVerified] = useState(true);
  const [isTurnstileOpen, setIsTurnstileOpen] = useState(false);

  // Conversation Mode & Topic Interests (Text Chat default)
  const [chatMode, setChatMode] = useState('text'); // 'text' (default) | 'video'
  const [interests, setInterests] = useState([]);
  const [sharedInterests, setSharedInterests] = useState([]);

  // Floating Reactions & Typing State
  const [reactions, setReactions] = useState([]);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);

  // Audio/Visual Tools
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Security & Privacy Settings
  const [ghostMode, setGhostMode] = useState(false); // Force TURN Relay to hide public IP

  // End-to-End Encryption (E2EE) State
  const [isE2EEReady, setIsE2EEReady] = useState(false);
  const [e2eeFingerprint, setE2EEFingerprint] = useState(null);

  // Modals State
  const [isE2EEModalOpen, setIsE2EEModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState('community');
  const [isModerationOpen, setIsModerationOpen] = useState(false);
  const [language, setLanguage] = useState('any');

  // Media Streams & Devices
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState('');
  const [selectedAudioDevice, setSelectedAudioDevice] = useState('');

  // Moderation & AI Shield
  const [shieldActive, setShieldActive] = useState(false);
  const [shieldEnabled, setShieldEnabled] = useState(true);
  const [sensitivity, setSensitivity] = useState(0.65);
  const [riskMetrics, setRiskMetrics] = useState({ riskScore: 0 });

  // Chat & DataChannel
  const [messages, setMessages] = useState([]);
  const [dataChannelReady, setDataChannelReady] = useState(false);

  // Stable Refs
  const rtcRef = useRef(null);
  const guardRef = useRef(null);
  const partnerIdRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const e2eeRef = useRef(null);
  const chatModeRef = useRef(chatMode);
  chatModeRef.current = chatMode;
  const interestsRef = useRef(interests);
  interestsRef.current = interests;

  // Ephemeral session ID for the browser tab
  const getSessionId = () => {
    let sid = sessionStorage.getItem('haven_sess_id');
    if (!sid) {
      sid = `client_${Math.random().toString(36).substring(2, 11)}`;
      sessionStorage.setItem('haven_sess_id', sid);
    }
    return sid;
  };

  // 1. Initialize Local Webcam & Audio (only required in video mode)
  const initMedia = useCallback(async (videoId = null, audioId = null) => {
    try {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }

      const constraints = {
        video: videoId ? { 
          deviceId: { exact: videoId },
          frameRate: { ideal: 60, min: 30, max: 60 }
        } : { 
          width: { ideal: 1920, min: 1280 }, 
          height: { ideal: 1080, min: 720 },
          frameRate: { ideal: 60, min: 30, max: 60 },
          facingMode: 'user'
        },
        audio: audioId ? { deviceId: { exact: audioId } } : {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.warn('Camera/Mic permission (text chat works independently):', err);
      return null;
    }
  }, []);

  // 2. Initialize VideoGuard AI
  useEffect(() => {
    const guard = new VideoGuard({
      threshold: sensitivity,
      fps: 3,
      onViolation: (metrics) => {
        if (shieldEnabled) {
          setShieldActive(true);
          setRiskMetrics(metrics);
        }
      },
      onSafe: (metrics) => {
        setRiskMetrics(metrics);
      },
      onScore: (score) => {
        setRiskMetrics(prev => ({ ...prev, riskScore: score }));
      }
    });

    guardRef.current = guard;
    return () => guard.stop();
  }, [sensitivity, shieldEnabled]);

  // Peer Cleanup
  const cleanupPeer = useCallback(() => {
    guardRef.current?.stop();
    if (rtcRef.current) {
      rtcRef.current.close();
      rtcRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
    }
    if (e2eeRef.current) {
      e2eeRef.current.destroy();
      e2eeRef.current = null;
    }
    setIsE2EEReady(false);
    setE2EEFingerprint(null);
    setIsScreenSharing(false);
    setRemoteStream(null);
    setDataChannelReady(false);
    setIsPartnerTyping(false);
    partnerIdRef.current = null;
  }, []);

  // Dispatch incoming message (handling E2EE authenticated decryption)
  const handleIncomingPayload = useCallback(async (raw) => {
    sounds.playMessage();

    // 1. In-band P2P E2EE key handshake
    if (raw && raw.type === 'e2ee_handshake' && raw.key) {
      if (e2eeRef.current) {
        const success = await e2eeRef.current.setRemotePublicKey(raw.key);
        if (success) {
          setIsE2EEReady(true);
          setE2EEFingerprint(e2eeRef.current.fingerprint);
        }
      }
      return;
    }

    // 2. Decrypt E2EE encrypted message
    if (raw && raw.e2ee && e2eeRef.current) {
      try {
        const decrypted = await e2eeRef.current.decrypt(raw);
        const text = typeof decrypted === 'object' ? decrypted.text : decrypted;
        setMessages(prev => [
          ...prev,
          {
            sender: 'stranger',
            text: String(text),
            timestamp: raw.timestamp || Date.now(),
            e2ee: true
          }
        ]);
      } catch (err) {
        console.warn('E2EE decryption error:', err);
        setMessages(prev => [
          ...prev,
          {
            type: 'system',
            text: '⚠️ Received unauthenticated or corrupted message.'
          }
        ]);
      }
      return;
    }

    // 3. Fallback plaintext message
    if (raw && typeof raw.text === 'string') {
      setMessages(prev => [
        ...prev,
        {
          sender: 'stranger',
          text: raw.text,
          timestamp: raw.timestamp || Date.now(),
          e2ee: false
        }
      ]);
    }
  }, []);

  // 3. Initialize Socket.IO connection
  useEffect(() => {
    const socketUrl = window.location.origin;
    const newSocket = io(socketUrl, {
      auth: { sessionId: getSessionId() },
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => {
      console.log('⚡ Connected to Haven Gateway:', newSocket.id);
    });

    // Real Online Count
    newSocket.on('online_count', ({ count }) => {
      if (typeof count === 'number') {
        setOnlineCount(count);
      }
    });

    newSocket.on('rate_limit_warning', ({ message }) => {
      setMessages(prev => [...prev, { type: 'system', text: `⚠️ ${message}` }]);
    });

    newSocket.on('reputation_status', (rep) => {
      setReputation(rep);
    });

    newSocket.on('waiting_in_queue', ({ tier, mode }) => {
      setConnectionState('waiting');
      const activeTopics = interestsRef.current;
      setMessages([{ 
        type: 'system', 
        text: activeTopics.length > 0 
          ? `Searching for stranger interested in ${activeTopics.map(t => '#' + t).join(', ')} (${mode === 'video' ? 'Video Mode' : 'Text Mode'})...`
          : `Looking for a conversation partner (${tier === 'FAST_SKIPPER' ? 'Fast-Skipper Pool' : 'Standard Pool'})...`
      }]);
    });

    newSocket.on('peer_skipped', () => {
      sounds.playSkip();
      setConnectionState('waiting');
      cleanupPeer();
    });

    newSocket.on('auto_requeue', () => {
      newSocket.emit('find_match', { 
        mode: chatModeRef.current, 
        interests: interestsRef.current 
      });
    });

    newSocket.on('partner_skipped', () => {
      sounds.playSkip();
      cleanupPeer();
      setConnectionState('waiting');
      setMessages(prev => [...prev, { type: 'system', text: 'Stranger skipped. Finding someone new...' }]);
      newSocket.emit('find_match', { 
        mode: chatModeRef.current, 
        interests: interestsRef.current 
      });
    });

    newSocket.on('partner_disconnected', ({ message }) => {
      sounds.playSkip();
      cleanupPeer();
      setConnectionState('idle');
      setMessages(prev => [...prev, { type: 'system', text: message || 'Stranger disconnected.' }]);
    });

    // Text message received via socket fallback
    newSocket.on('receive_message', (msg) => {
      handleIncomingPayload(msg);
    });

    // 🔐 E2EE Ephemeral Key Exchange via Signaling
    newSocket.on('e2ee_key', async ({ key }) => {
      if (e2eeRef.current && key) {
        const success = await e2eeRef.current.setRemotePublicKey(key);
        if (success) {
          setIsE2EEReady(true);
          setE2EEFingerprint(e2eeRef.current.fingerprint);
        }
      }
    });

    // Live Floating Reaction Receiver
    newSocket.on('receive_reaction', ({ emoji }) => {
      sounds.playReaction();
      const id = `${Date.now()}_${Math.random()}`;
      setReactions(prev => [...prev, { id, emoji, sender: 'stranger' }]);
      setTimeout(() => {
        setReactions(prev => prev.filter(r => r.id !== id));
      }, 2500);
    });

    // Stranger Typing Receiver
    newSocket.on('partner_typing', ({ isTyping }) => {
      setIsPartnerTyping(!!isTyping);
    });

    newSocket.on('match_error', ({ message }) => {
      setConnectionState('idle');
      alert(`Match notification: ${message}`);
    });

    // Handle Matched Event (Handshake with E2EE, IP Masking, & Privacy Guarantees)
    newSocket.on('matched', async ({ roomId, mode, sharedInterests: matchedShared, isInitiator, iceServers }) => {
      setConnectionState('connected');
      setShieldActive(false);
      setSharedInterests(matchedShared || []);
      sounds.playConnect();

      // Initialize fresh ephemeral ECDH keypair for End-to-End Encryption
      const e2ee = new E2EESession();
      const myPublicKey = await e2ee.init();
      e2eeRef.current = e2ee;
      setIsE2EEReady(false);
      setE2EEFingerprint(null);

      if (myPublicKey) {
        newSocket.emit('e2ee_key', { key: myPublicKey });
      }

      const welcomeMsgs = [
        { type: 'system', text: `Connected to a stranger in ${mode === 'video' ? 'Video Mode' : 'Text Mode'}! Say hi.` }
      ];

      if (matchedShared && matchedShared.length > 0) {
        welcomeMsgs.push({
          type: 'system',
          text: `🎯 Topic Match: You both like ${matchedShared.map(t => '#' + t).join(', ')}`
        });
      }

      welcomeMsgs.push({
        type: 'system',
        text: '🔒 Zero-Knowledge 256-bit AES-GCM End-to-End Encryption Active.'
      });

      setMessages(welcomeMsgs);

      // Initialize WebRTC
      const rtc = new WebRTCConnection({
        iceServers,
        forceRelay: ghostMode,
        localStream: localStreamRef.current,
        onRemoteStream: (stream) => {
          setRemoteStream(stream);
          if (mode === 'video') {
            const tempVideo = document.createElement('video');
            tempVideo.srcObject = stream;
            tempVideo.play().catch(() => {});
            guardRef.current?.start(tempVideo);
          }
        },
        onIceCandidate: (candidate) => {
          newSocket.emit('signal_ice_candidate', { candidate });
        },
        onConnectionState: (state) => {
          setIceState(state);
        },
        onDataChannelState: (state) => {
          setDataChannelReady(state === 'open');
          if (state === 'open' && e2ee.getPublicKey()) {
            rtc.sendDataMessage({
              type: 'e2ee_handshake',
              key: e2ee.getPublicKey()
            });
          }
        },
        onDataChannelMessage: (data) => {
          handleIncomingPayload(data);
        }
      });

      rtc.initialize();
      rtcRef.current = rtc;

      if (isInitiator) {
        try {
          const offer = await rtc.createOffer();
          newSocket.emit('signal_offer', { sdp: offer });
        } catch (err) {
          console.error('Failed to create offer:', err);
        }
      }
    });

    // Handle SDP Offer
    newSocket.on('signal_offer', async ({ sdp }) => {
      if (rtcRef.current) {
        try {
          const answer = await rtcRef.current.handleOffer(sdp);
          newSocket.emit('signal_answer', { sdp: answer });
        } catch (err) {
          console.error('Failed to handle offer:', err);
        }
      }
    });

    // Handle SDP Answer
    newSocket.on('signal_answer', async ({ sdp }) => {
      if (rtcRef.current) {
        try {
          await rtcRef.current.handleAnswer(sdp);
        } catch (err) {
          console.error('Failed to handle answer:', err);
        }
      }
    });

    // Handle ICE Candidate
    newSocket.on('signal_ice_candidate', async ({ candidate }) => {
      if (rtcRef.current) {
        await rtcRef.current.addIceCandidate(candidate);
      }
    });

    setSocket(newSocket);

    // Initial stats fetch
    fetch('/api/stats')
      .then(r => r.json())
      .then(d => {
        if (typeof d.onlineSockets === 'number') setOnlineCount(d.onlineSockets);
      })
      .catch(() => {});

    return () => {
      cleanupPeer();
      newSocket.disconnect();
    };
  }, [ghostMode, cleanupPeer, handleIncomingPayload]);

  // Start Matching Orchestrator
  const startMatching = (mode = chatMode, topicList = interests, lang = language) => {
    if (!socket) return;
    if (mode === 'video') {
      initMedia();
    }
    setConnectionState('waiting');
    setSharedInterests([]);
    setMessages([{ 
      type: 'system', 
      text: topicList.length > 0 
        ? `Looking for someone interested in ${topicList.map(t => '#' + t).join(', ')}...` 
        : `Looking for a conversation partner (${mode === 'video' ? 'Video Mode' : 'Text Mode'}${lang !== 'any' ? ` • ${lang.toUpperCase()}` : ''})...` 
    }]);
    socket.emit('find_match', { mode, language: lang, interests: topicList });
  };

  // Synchronize Browser Back / Forward Navigation (popstate)
  useEffect(() => {
    // Set initial history state if not already set
    const currentPath = window.location.pathname;
    const isChatPath = currentPath === '/chat';
    if (!window.history.state) {
      window.history.replaceState({ view: isChatPath ? 'chat' : 'home' }, '', currentPath);
    }
    if (isChatPath && !isInChat) {
      setIsInChat(true);
      if (socket) {
        startMatching(chatModeRef.current, interestsRef.current, language);
      }
    }

    const handlePopState = (event) => {
      const state = event.state;
      const isChat = window.location.pathname === '/chat' || state?.view === 'chat';

      if (isChat) {
        setIsInChat(true);
        setCanGoForward(false);
        startMatching(chatModeRef.current, interestsRef.current, language);
      } else {
        // Navigating back to Home / Landing
        sounds.playSkip();
        cleanupPeer();
        setMessages([]);
        setConnectionState('idle');
        if (socket) {
          socket.emit('leave_queue');
        }
        setIsInChat(false);
        setCanGoForward(true);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [socket, language, cleanupPeer]);

  // Launch from Landing Hero
  const handleStartFromLanding = () => {
    if (window.location.pathname !== '/chat') {
      window.history.pushState({ view: 'chat' }, '', '/chat');
    }
    setIsInChat(true);
    setCanGoForward(false);
    startMatching(chatMode, interests, language);
  };

  const handleNext = () => {
    if (!socket) return;
    sounds.playSkip();
    cleanupPeer();
    setConnectionState('waiting');
    socket.emit('skip_peer', { autoRequeue: true });
  };

  const handleStop = () => {
    if (!socket) return;
    sounds.playSkip();
    cleanupPeer();
    setConnectionState('idle');
    socket.emit('leave_queue');
  };

  // Navigate Forward to Chat
  const handleGoForward = () => {
    if (canGoForward && window.history.length > 1) {
      window.history.forward();
      setTimeout(() => {
        if (window.location.pathname !== '/chat') {
          handleStartFromLanding();
        }
      }, 50);
    } else {
      handleStartFromLanding();
    }
  };

  // 🚪 Emergency Exit: Sever connection, wipe memory, and return to landing
  const handleEmergencyExit = (pushHistory = true) => {
    sounds.playSkip();
    cleanupPeer();
    setMessages([]);
    setConnectionState('idle');
    if (socket) {
      socket.emit('leave_queue');
    }
    setIsInChat(false);
    setCanGoForward(true);
    if (pushHistory) {
      if (window.history.length > 1 && window.location.pathname === '/chat') {
        window.history.back();
      } else if (window.location.pathname !== '/') {
        window.history.pushState({ view: 'home' }, '', '/');
      }
    }
  };

  // 🚫 Block peer from ever matching with this session
  const handleBlock = () => {
    if (!socket) return;
    sounds.playSkip();
    socket.emit('block_peer');
    cleanupPeer();
    setConnectionState('waiting');
    setMessages([{ type: 'system', text: '🚫 Stranger blocked. Finding someone new...' }]);
    socket.emit('find_match', { mode: chatMode, interests });
  };

  // 🛡️ Submit Report
  const handleSubmitReport = async ({ reason, details }) => {
    if (socket) {
      socket.emit('report_peer', { reason, details });
    }
    fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reporterSessionId: getSessionId(),
        reason,
        details
      })
    }).catch(() => {});
    cleanupPeer();
    setConnectionState('waiting');
    socket.emit('find_match', { mode: chatMode, interests });
  };

  // 🔒 End-to-End Encrypted Message Transmission
  const handleSendMessage = async (text) => {
    if (!text || typeof text !== 'string') return;
    const cleanText = text.slice(0, 500).trim();
    if (!cleanText) return;

    const timestamp = Date.now();
    let payloadToSend = { text: cleanText, timestamp };
    let isEncrypted = false;

    if (e2eeRef.current?.isReady) {
      try {
        const enc = await e2eeRef.current.encrypt({ text: cleanText, timestamp });
        if (enc && enc.e2ee) {
          payloadToSend = { ...enc, timestamp };
          isEncrypted = true;
        }
      } catch (err) {
        console.warn('Encryption fallback:', err);
      }
    }

    const sentViaDataChannel = rtcRef.current?.sendDataMessage(payloadToSend);

    if (!sentViaDataChannel && socket && connectionState === 'connected') {
      socket.emit('send_message', { message: payloadToSend });
    }

    setMessages(prev => [
      ...prev,
      {
        sender: 'you',
        text: cleanText,
        timestamp,
        e2ee: isEncrypted
      }
    ]);
  };

  const handleSendReaction = (emoji) => {
    if (!socket || connectionState !== 'connected' || !emoji) return;
    socket.emit('send_reaction', { emoji });
    sounds.playReaction();
    const id = `${Date.now()}_${Math.random()}`;
    setReactions(prev => [...prev, { id, emoji, sender: 'you' }]);
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== id));
    }, 2500);
  };

  const handleTyping = (isTyping) => {
    if (socket && connectionState === 'connected') {
      socket.emit('typing', { isTyping });
    }
  };

  // Screen Sharing
  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      if (localStreamRef.current) {
        const camTrack = localStreamRef.current.getVideoTracks()[0];
        if (camTrack && rtcRef.current) {
          await rtcRef.current.replaceVideoTrack(camTrack);
        }
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
        screenStreamRef.current = null;
      }
      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: 'always' },
          audio: false
        });
        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];

        screenTrack.onended = () => {
          if (localStreamRef.current) {
            const camTrack = localStreamRef.current.getVideoTracks()[0];
            if (camTrack && rtcRef.current) {
              rtcRef.current.replaceVideoTrack(camTrack);
            }
          }
          screenStreamRef.current = null;
          setIsScreenSharing(false);
        };

        if (rtcRef.current) {
          await rtcRef.current.replaceVideoTrack(screenTrack);
        }
        setIsScreenSharing(true);
      } catch (err) {
        console.warn('Screen share cancelled or rejected:', err);
      }
    }
  };

  const handleToggleSound = () => {
    const next = sounds.toggle();
    setSoundEnabled(next);
  };

  const handleAddInterest = (tag) => {
    if (!interests.includes(tag)) {
      setInterests([...interests, tag]);
    }
  };

  const handleRemoveInterest = (tag) => {
    setInterests(interests.filter(t => t !== tag));
  };

  const handleChangeMode = (newMode) => {
    setChatMode(newMode);
    if (newMode === 'video' && !localStreamRef.current) {
      initMedia();
    }
    if (connectionState === 'waiting') {
      startMatching(newMode, interests);
    }
  };

  const handleOpenLegalModal = (tab = 'community') => {
    setLegalModalTab(tab);
    setIsLegalModalOpen(true);
  };

  // Keyboard Shortcuts (Esc to skip / Space to start / Alt+E panic / Alt+M moderation)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      // Emergency Exit Panic Shortcut: Alt+E
      if (e.altKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        handleEmergencyExit();
        return;
      }

      // Moderation Console Shortcut: Alt+M
      if (e.altKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        setIsModerationOpen(true);
        return;
      }

      // Report Peer Shortcut: Alt+R
      if (e.altKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        if (connectionState === 'connected') {
          setIsReportModalOpen(true);
        }
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        if (isInChat) {
          if (connectionState === 'connected' || connectionState === 'waiting') {
            handleNext();
          }
        }
      } else if (e.code === 'Space') {
        e.preventDefault();
        if (!isInChat) {
          handleStartFromLanding();
        } else if (connectionState === 'idle') {
          startMatching(chatMode, interests, language);
        } else if (connectionState === 'connected') {
          handleNext();
        }
      } else if (e.key.toLowerCase() === 'm' && !e.altKey && chatMode === 'video') {
        handleToggleMic();
      } else if (e.key.toLowerCase() === 'v' && !e.altKey && chatMode === 'video') {
        handleToggleVideo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInChat, connectionState, chatMode, interests, language, socket]);

  // Audio/Video Toggles
  const handleToggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
      }
    }
  };

  const handleToggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoMuted(!videoTrack.enabled);
      }
    }
  };

  const handleDeviceChange = async (vidId, audId) => {
    if (vidId) setSelectedVideoDevice(vidId);
    if (audId) setSelectedAudioDevice(audId);
    await initMedia(vidId || selectedVideoDevice, audId || selectedAudioDevice);
  };

  // If user is not yet in conversation, display the privacy-first Landing Hero
  if (!isInChat) {
    return (
      <div className="flex flex-col h-screen w-screen bg-dark-900 text-slate-100 overflow-hidden">
        <LandingHero
          onlineCount={onlineCount}
          chatMode={chatMode}
          onChangeChatMode={handleChangeMode}
          language={language}
          onChangeLanguage={setLanguage}
          interests={interests}
          onAddInterest={handleAddInterest}
          onRemoveInterest={handleRemoveInterest}
          onStartChat={handleStartFromLanding}
          onOpenLegalTab={handleOpenLegalModal}
          onOpenModeration={() => setIsModerationOpen(true)}
          canGoForward={canGoForward}
          onGoForward={handleGoForward}
        />

        <LegalModal
          isOpen={isLegalModalOpen}
          onClose={() => setIsLegalModalOpen(false)}
          initialTab={legalModalTab}
        />

        <ModerationModal
          isOpen={isModerationOpen}
          onClose={() => setIsModerationOpen(false)}
        />
      </div>
    );
  }

  // Active Chat Screen
  return (
    <div className="relative flex flex-col h-screen w-screen bg-[#07090e] text-slate-100 overflow-hidden">
      {/* Background Artwork Layer */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none opacity-20 filter blur-[1px]"
        style={{ backgroundImage: "url('/background.jpg')" }}
      />
      <div className="absolute inset-0 bg-[#07090e]/85 pointer-events-none" />

      {/* Top Navigation Bar */}
      <header className="relative z-30 h-16 border-b border-cyan-500/15 bg-[#060a14]/90 backdrop-blur-xl px-3 sm:px-6 flex items-center justify-between select-none">
        {/* Subtle neon ambient bottom hairline */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent pointer-events-none" />

        {/* Left: Top Navigation Controls + Brand Logo */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Top Navigation: Backward & Forward buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleEmergencyExit(true)}
              title="Go Back to Home"
              aria-label="Go Back to Home"
              className="p-1.5 rounded-xl bg-white/[0.04] hover:bg-cyan-500/20 text-cyan-300 hover:text-white border border-cyan-500/20 hover:border-cyan-400 transition-all cursor-pointer active:scale-95 shadow-sm shadow-cyan-500/10"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (window.history.length > 1) {
                  window.history.forward();
                }
              }}
              title="Forward"
              aria-label="Forward"
              className="p-1.5 rounded-xl bg-white/[0.02] text-slate-500 border border-white/5 cursor-not-allowed opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button 
            onClick={() => handleEmergencyExit(true)}
            className="flex items-center gap-2.5 group cursor-pointer text-left focus:outline-none"
            title="Return to Omnexlo Home"
          >
            <div className="relative">
              <img 
                src="/logo.png" 
                alt="Omnexlo Logo" 
                className="w-8 h-8 rounded-xl object-cover shadow-md shadow-cyan-500/20 ring-1 ring-cyan-500/30 group-hover:ring-cyan-400 group-hover:scale-105 transition-all" 
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-[#060a14]" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black tracking-wider bg-gradient-to-r from-white via-cyan-100 to-cyan-400 bg-clip-text text-transparent group-hover:to-cyan-300 transition-all">
                OMNEXLO
              </h1>
            </div>
          </button>
        </div>

        {/* Center: Language & Topics */}
        <div className="flex items-center gap-2 sm:gap-3 max-w-xl mx-2">
          {/* Voluntary Language Selector */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-cyan-500/30 transition-all text-xs">
            <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={connectionState === 'waiting'}
              className="bg-transparent text-slate-300 hover:text-white text-xs focus:outline-none cursor-pointer max-w-[100px] sm:max-w-[130px] truncate"
              title="Filter matchmaking by language"
            >
              {AVAILABLE_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} className="bg-[#0b1020] text-slate-200">
                  {l.code === 'any' ? '🌐 All Languages' : l.label}
                </option>
              ))}
            </select>
          </div>

          {/* Topics Selector & Popover */}
          <TopNavTopics
            interests={interests}
            onAddInterest={handleAddInterest}
            onRemoveInterest={handleRemoveInterest}
            disabled={connectionState === 'waiting'}
          />
        </div>

        {/* Right: Connection Status & Settings */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Clean Connection Status Indicator */}
          {connectionState === 'connected' ? (
            <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-semibold shadow-sm shadow-emerald-500/10">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Connected</span>
            </div>
          ) : connectionState === 'waiting' ? (
            <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-xs font-semibold shadow-sm shadow-cyan-500/10">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="hidden sm:inline">Finding stranger...</span>
              <span className="sm:hidden">Looking...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-slate-400 text-xs">
              <span className="w-2 h-2 rounded-full bg-slate-500" />
              <span className="hidden sm:inline">Ready</span>
            </div>
          )}

          {/* Settings Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            title="Audio, Video & Privacy Settings"
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-cyan-500/30 text-slate-300 hover:text-white transition-all active:scale-95 flex items-center gap-1.5 text-xs font-medium cursor-pointer"
          >
            <Settings className="w-4 h-4 text-cyan-400" />
            <span className="hidden md:inline">Settings</span>
          </button>
        </div>
      </header>

      {/* Main Content Area (Optimized for Mobile Phone and PC) */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {chatMode === 'video' ? (
          <>
            <div className="h-[46vh] sm:h-[50vh] md:h-full md:flex-1 shrink-0 md:shrink overflow-hidden relative">
              <VideoStage
                chatMode={chatMode}
                localStream={localStream}
                remoteStream={remoteStream}
                isAudioMuted={isAudioMuted}
                isVideoMuted={isVideoMuted}
                isScreenSharing={isScreenSharing}
                connectionState={connectionState}
                shieldActive={shieldActive}
                onOverrideShield={() => setShieldActive(false)}
                onReport={() => setIsReportModalOpen(true)}
                riskMetrics={riskMetrics}
                iceState={iceState}
                sharedInterests={sharedInterests}
                reactions={reactions}
                onSendReaction={handleSendReaction}
              />
            </div>

            <div className="flex-1 min-h-0 md:w-96 lg:w-[420px] md:flex-none h-full border-t md:border-t-0 md:border-l border-cyan-500/15">
              <ChatPanel
                messages={messages}
                onSendMessage={handleSendMessage}
                onTyping={handleTyping}
                isPartnerTyping={isPartnerTyping}
                isConnected={connectionState === 'connected'}
                dataChannelReady={dataChannelReady}
                isE2EEReady={isE2EEReady}
                fingerprint={e2eeFingerprint}
                onOpenE2EEModal={() => setIsE2EEModalOpen(true)}
                isTextOnlyMode={false}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 h-full flex justify-center bg-dark-900/60 p-2 sm:p-4 overflow-hidden">
            <ChatPanel
              messages={messages}
              onSendMessage={handleSendMessage}
              onTyping={handleTyping}
              isPartnerTyping={isPartnerTyping}
              isConnected={connectionState === 'connected'}
              dataChannelReady={dataChannelReady}
              isE2EEReady={isE2EEReady}
              fingerprint={e2eeFingerprint}
              onOpenE2EEModal={() => setIsE2EEModalOpen(true)}
              isTextOnlyMode={true}
            />
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <ControlBar
        chatMode={chatMode}
        connectionState={connectionState}
        onStart={() => startMatching(chatMode, interests)}
        onNext={handleNext}
        onStop={handleStop}
        onToggleMic={handleToggleMic}
        onToggleVideo={handleToggleVideo}
        isAudioMuted={isAudioMuted}
        isVideoMuted={isVideoMuted}
        isScreenSharing={isScreenSharing}
        onToggleScreenShare={handleToggleScreenShare}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onReport={() => setIsReportModalOpen(true)}
        onBlock={handleBlock}
        onEmergencyExit={handleEmergencyExit}
        onOpenRules={() => handleOpenLegalModal('community')}
        reputation={reputation}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        shieldEnabled={shieldEnabled}
        onToggleShield={setShieldEnabled}
        sensitivity={sensitivity}
        onChangeSensitivity={setSensitivity}
        ghostMode={ghostMode}
        onToggleGhostMode={setGhostMode}
        selectedVideoDevice={selectedVideoDevice}
        selectedAudioDevice={selectedAudioDevice}
        onChangeVideoDevice={(id) => handleDeviceChange(id, null)}
        onChangeAudioDevice={(id) => handleDeviceChange(null, id)}
      />

      {/* 🛡️ Abuse & Safety Report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmitReport={handleSubmitReport}
      />

      {/* 📜 Legal, Community Guidelines & Transparency Modal */}
      <LegalModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
        initialTab={legalModalTab}
      />

      {/* 🔐 E2EE Security Inspector & Fingerprint Modal */}
      <E2EEModal
        isOpen={isE2EEModalOpen}
        onClose={() => setIsE2EEModalOpen(false)}
        fingerprint={e2eeFingerprint}
        isConnected={connectionState === 'connected'}
        isE2EEReady={isE2EEReady}
      />

      {/* Optional Turnstile Human Gate Modal */}
      <TurnstileModal
        isOpen={isTurnstileOpen}
        onVerified={(token) => {
          setTurnstileVerified(true);
          setIsTurnstileOpen(false);
          if (socket) {
            socket.emit('auth_turnstile', { token });
            startMatching(chatMode, interests, language);
          }
        }}
      />

      {/* 🛡️ Moderation Operations Console Modal */}
      <ModerationModal
        isOpen={isModerationOpen}
        onClose={() => setIsModerationOpen(false)}
      />
    </div>
  );
}
