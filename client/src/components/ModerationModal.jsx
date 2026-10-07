import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  X, 
  CheckCircle, 
  AlertTriangle, 
  Ban, 
  Trash2, 
  RefreshCw, 
  Activity, 
  Clock, 
  Users, 
  Key, 
  Layers,
  ChevronRight,
  ShieldCheck,
  Server
} from 'lucide-react';

export function ModerationModal({ isOpen, onClose }) {
  const [adminKey, setAdminKey] = useState(
    localStorage.getItem('haven_admin_key') || 'haven_admin_secret_key_2026'
  );
  const [activeTab, setActiveTab] = useState('reports'); // 'reports' | 'stats' | 'bans'
  const [reports, setReports] = useState([]);
  const [bans, setBans] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionNotice, setActionNotice] = useState(null);

  const fetchModerationData = async () => {
    setLoading(true);
    try {
      // 1. Fetch stats
      const statsRes = await fetch('/api/moderation/stats', {
        headers: { 'X-Admin-Key': adminKey }
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // 2. Fetch reports
      const reportsRes = await fetch('/api/moderation/reports?limit=50', {
        headers: { 'X-Admin-Key': adminKey }
      });
      if (reportsRes.ok) {
        const reportsData = await reportsRes.json();
        setReports(reportsData.reports || []);
      }

      // 3. Fetch active bans
      const bansRes = await fetch('/api/moderation/bans', {
        headers: { 'X-Admin-Key': adminKey }
      });
      if (bansRes.ok) {
        const bansData = await bansRes.json();
        setBans(bansData.bans || []);
      }
    } catch (err) {
      console.warn('Moderation fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchModerationData();
    }
  }, [isOpen, adminKey]);

  if (!isOpen) return null;

  const handleAction = async (reportId, action, targetSessionId) => {
    try {
      const res = await fetch('/api/moderation/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': adminKey
        },
        body: JSON.stringify({
          reportId,
          action,
          targetSessionId,
          reason: action === 'BAN' ? 'Community Safety Violation (Admin Action)' : 'Dismissed'
        })
      });

      if (res.ok) {
        setActionNotice(`Report ${action === 'BAN' ? 'Actioned & Session Banned' : 'Dismissed'}`);
        setTimeout(() => setActionNotice(null), 3000);
        fetchModerationData();
      }
    } catch (err) {
      console.error('Moderation action failed:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in select-none">
      <div className="bg-dark-800 border border-slate-700/80 rounded-3xl max-w-4xl w-full shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-700/60 flex items-center justify-between bg-dark-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center shadow-md">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">OMNEXLO MODERATION CONSOLE</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-mono font-semibold">
                  CONFIDENTIAL
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Incident Review, Telemetry & Safety Enforcement</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchModerationData}
              title="Refresh Telemetry"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action Notice Toast */}
        {actionNotice && (
          <div className="bg-emerald-500/15 border-b border-emerald-500/30 px-4 py-2 flex items-center gap-2 text-xs text-emerald-300 animate-fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* Sub-Navigation */}
        <div className="flex items-center justify-between px-6 py-2 border-b border-slate-700/60 bg-dark-900/40">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'reports'
                  ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Safety Reports ({reports.length})
            </button>
            <button
              onClick={() => setActiveTab('bans')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'bans'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Active Bans ({bans.length})
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'stats'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              System Health & Telemetry
            </button>
          </div>

          {/* Admin Token Key Input */}
          <div className="hidden sm:flex items-center gap-1.5 bg-dark-900 px-2.5 py-1 rounded-xl border border-slate-700/60">
            <Key className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="password"
              value={adminKey}
              onChange={(e) => {
                setAdminKey(e.target.value);
                localStorage.setItem('haven_admin_key', e.target.value);
              }}
              placeholder="Admin API Key"
              className="bg-transparent text-[11px] text-white focus:outline-none w-28 font-mono"
            />
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: REPORTS */}
          {activeTab === 'reports' && (
            <div className="space-y-4">
              {reports.length === 0 ? (
                <div className="text-center py-16 text-slate-500 space-y-2">
                  <ShieldCheck className="w-12 h-12 text-emerald-500/40 mx-auto" />
                  <p className="text-sm font-semibold text-slate-300">Zero Pending Safety Reports</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    All conversations are operating within community parameters. Old logs are automatically pruned according to Omnexlo's 7-day retention policy.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reports.map((rep) => (
                    <div
                      key={rep.id}
                      className="p-4 rounded-2xl bg-dark-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            rep.status === 'PENDING'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : rep.status === 'ACTIONED'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-slate-700 text-slate-300'
                          }`}>
                            {rep.status}
                          </span>
                          <span className="text-xs font-semibold text-white">{rep.reason}</span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(rep.timestamp).toLocaleTimeString()} ({new Date(rep.timestamp).toLocaleDateString()})
                          </span>
                        </div>

                        {rep.details && (
                          <p className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                            "{rep.details}"
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-[10px] text-slate-500 font-mono">
                          <span>Report ID: {rep.id}</span>
                          <span>Reported Peer: {rep.reportedSessionId || rep.reported_session_id}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                        <button
                          onClick={() => handleAction(rep.id, 'DISMISS', rep.reportedSessionId || rep.reported_session_id)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
                        >
                          Dismiss
                        </button>
                        <button
                          onClick={() => handleAction(rep.id, 'BAN', rep.reportedSessionId || rep.reported_session_id)}
                          className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-md shadow-red-600/20"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Ban 24h</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ACTIVE BANS */}
          {activeTab === 'bans' && (
            <div className="space-y-4">
              {bans.length === 0 ? (
                <div className="text-center py-16 text-slate-500 space-y-2">
                  <CheckCircle className="w-12 h-12 text-emerald-500/40 mx-auto" />
                  <p className="text-sm font-semibold text-slate-300">No Active Bans</p>
                  <p className="text-xs text-slate-500">
                    Expired bans are automatically purged from the SQLite persistence layer.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {bans.map((b) => (
                    <div
                      key={b.id}
                      className="p-4 rounded-2xl bg-dark-900 border border-slate-800 flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Ban className="w-4 h-4 text-red-400" />
                          <span className="text-xs font-semibold text-white">{b.reason}</span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Target Session: <span className="font-mono text-slate-300">{b.target_session_id || 'Salted IP Block'}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Expires: {new Date(b.expires_at).toLocaleString()}
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-red-500/15 text-red-400 text-xs font-mono font-medium border border-red-500/30">
                        ACTIVE BAN
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: HEALTH & TELEMETRY */}
          {activeTab === 'stats' && stats && (
            <div className="space-y-6">
              {/* Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-dark-900 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    Online Sockets
                  </span>
                  <div className="text-2xl font-bold text-white">{stats.onlineConnections}</div>
                </div>

                <div className="p-4 rounded-2xl bg-dark-900 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-teal-400" />
                    Active Rooms
                  </span>
                  <div className="text-2xl font-bold text-white">{stats.mmStats?.activeRooms || 0}</div>
                </div>

                <div className="p-4 rounded-2xl bg-dark-900 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    In Queue
                  </span>
                  <div className="text-2xl font-bold text-white">
                    {(stats.mmStats?.waitingNormal || 0) + (stats.mmStats?.waitingFastSkipper || 0)}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-dark-900 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                    Pending Reports
                  </span>
                  <div className="text-2xl font-bold text-white">{stats.dbStats?.pendingReports || 0}</div>
                </div>
              </div>

              {/* Server Info Card */}
              <div className="p-5 rounded-2xl bg-dark-900 border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Server className="w-4 h-4 text-emerald-400" />
                  Infrastructure & Memory Footprint
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80">
                    <div className="text-[10px] text-slate-500">Uptime</div>
                    <div className="font-semibold text-slate-200 mt-0.5">{stats.uptime} seconds</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80">
                    <div className="text-[10px] text-slate-500">Node RSS Memory</div>
                    <div className="font-semibold text-slate-200 mt-0.5">
                      {Math.round((stats.memoryUsage?.rss || 0) / 1024 / 1024)} MB
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80">
                    <div className="text-[10px] text-slate-500">Heap Used</div>
                    <div className="font-semibold text-slate-200 mt-0.5">
                      {Math.round((stats.memoryUsage?.heapUsed || 0) / 1024 / 1024)} MB
                    </div>
                  </div>
                </div>
              </div>

              {/* Prometheus Export Link */}
              <div className="p-4 rounded-2xl bg-dark-900/60 border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Prometheus exposition format ready at:</span>
                <a
                  href="/metrics"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-mono text-[11px] border border-slate-700 transition"
                >
                  /metrics ↗
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
