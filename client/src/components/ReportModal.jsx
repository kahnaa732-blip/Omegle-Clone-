import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, X, CheckCircle2, Lock, ArrowRight, Loader2, Ban } from 'lucide-react';

const REPORT_REASONS = [
  { id: 'harassment', label: 'Harassment or Bullying', desc: 'Aggressive, hateful, or derogatory speech' },
  { id: 'inappropriate', label: 'Inappropriate Content', desc: 'Sexually explicit or non-consensual material' },
  { id: 'threats', label: 'Threats or Violence', desc: 'Threats to personal safety or violent behavior' },
  { id: 'personal_info', label: 'Personal Info Solicitation', desc: 'Attempting to harvest phone, address, or accounts' },
  { id: 'scam_phishing', label: 'Scam or Malicious Links', desc: 'Deceptive links, phishing, or financial scams' },
  { id: 'spam_bot', label: 'Bot or Spam Activity', desc: 'Automated script, copypasta, or repetitive flood' }
];

export function ReportModal({ isOpen, onClose, onSubmitReport }) {
  const [selectedReason, setSelectedReason] = useState('harassment');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (onSubmitReport) {
        await onSubmitReport({
          reason: selectedReason,
          details: additionalDetails.trim()
        });
      }
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.warn('Report submission error:', err);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in select-none">
      <div className="bg-dark-800 border border-slate-700/80 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-6">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/60 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center shadow-lg shadow-red-500/10">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Report & Block Stranger</h2>
            <p className="text-xs text-slate-400">Help keep Omnexlo safe and constructive</p>
          </div>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <h3 className="text-base font-semibold text-white">Report Submitted & Peer Blocked</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Thank you for keeping our community safe. You will never be matched with this session again.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Reasons List */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Select Violation Category:</label>
              <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-1">
                {REPORT_REASONS.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedReason(r.id)}
                    className={`flex items-start text-left p-2.5 rounded-xl border transition-all ${
                      selectedReason === r.id
                        ? 'bg-red-500/15 border-red-500/40 text-white'
                        : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-medium">{r.label}</div>
                      <div className="text-[10px] text-slate-500">{r.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Optional details */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Optional Context / Comments:</label>
              <textarea
                value={additionalDetails}
                onChange={(e) => setAdditionalDetails(e.target.value)}
                placeholder="Describe what occurred (optional)..."
                maxLength={300}
                rows={2}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 resize-none"
              />
            </div>

            {/* Explanatory Safety Notice */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
              <Ban className="w-4 h-4 text-red-400 shrink-0" />
              <span>Submitting this report immediately disconnects, reports the incident, and blocks this user.</span>
            </div>

            {/* Submit Action */}
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition shadow-lg shadow-red-600/30 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Report & Disconnect</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
