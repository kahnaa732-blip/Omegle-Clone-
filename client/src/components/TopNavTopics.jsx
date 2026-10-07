import React, { useState, useRef, useEffect } from 'react';
import { Hash, Plus, X, Tag } from 'lucide-react';

const SUGGESTIONS = [
  'gaming',
  'anime',
  'music',
  'coding',
  'movies',
  'books',
  'art',
  'travel'
];

export function TopNavTopics({
  interests = [],
  onAddInterest,
  onRemoveInterest,
  disabled = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const containerRef = useRef(null);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleAdd = (tag) => {
    const clean = (tag || inputVal).trim().toLowerCase().replace(/^#+/, '');
    if (!clean) return;
    if (!interests.includes(clean)) {
      onAddInterest(clean);
    }
    setInputVal('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Button & Compact Chip Display */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all ${
            interests.length > 0
              ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/15'
              : 'bg-white/[0.04] border-white/10 hover:border-cyan-500/30 text-slate-300 hover:text-white'
          }`}
          title="Filter conversation by topics & interests"
        >
          <Hash className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Topics:</span>
          {interests.length > 0 ? (
            <span className="px-1.5 py-0.2 rounded-full bg-cyan-400/20 text-cyan-200 text-[11px] font-mono font-semibold">
              {interests.length}
            </span>
          ) : (
            <span className="text-slate-400 text-[11px]">+ Add</span>
          )}
        </button>

        {/* Visible inline chips on wider screens */}
        <div className="hidden lg:flex items-center gap-1 max-w-[220px] overflow-hidden text-ellipsis whitespace-nowrap">
          {interests.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px] font-medium"
            >
              #{tag}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveInterest(tag);
                }}
                className="hover:text-white rounded p-0.5 transition"
                title={`Remove #${tag}`}
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
          {interests.length > 2 && (
            <button
              onClick={() => setIsOpen(true)}
              className="text-[10px] text-cyan-400/80 hover:text-cyan-300 px-1 font-mono"
            >
              +{interests.length - 2} more
            </button>
          )}
        </div>
      </div>

      {/* Floating Glassmorphic Topics Popover */}
      {isOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-80 sm:w-96 p-4 rounded-2xl bg-[#0b1020]/95 backdrop-blur-2xl border border-cyan-500/25 shadow-2xl shadow-cyan-950/60 z-50 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
                <Tag className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <h4 className="text-xs font-bold text-white tracking-wide uppercase">Matchmaking Topics</h4>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
            Match with people who share common topics. Leave empty to connect with anyone worldwide.
          </p>

          {/* Add Input */}
          <div className="flex items-center gap-1.5 mb-3">
            <div className="relative flex-1">
              <Hash className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add topic (e.g. gaming, anime)..."
                autoFocus
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 focus:border-cyan-400/60 focus:bg-white/[0.07] text-xs text-white placeholder-slate-500 focus:outline-none transition"
              />
            </div>
            <button
              onClick={() => handleAdd()}
              disabled={!inputVal.trim()}
              className="px-3 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-black font-bold text-xs transition flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>

          {/* Active Topics List */}
          {interests.length > 0 ? (
            <div className="mb-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">
                Active Topics ({interests.length})
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                {interests.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-medium"
                  >
                    #{tag}
                    <button
                      onClick={() => onRemoveInterest(tag)}
                      className="hover:text-rose-400 rounded transition"
                      title="Remove"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-center text-[11px] text-slate-400 mb-3">
              No topics set. Currently matching with anyone.
            </div>
          )}

          {/* Popular Suggestions */}
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">
              Popular Topics
            </span>
            <div className="flex flex-wrap gap-1">
              {SUGGESTIONS.filter((s) => !interests.includes(s)).map((s) => (
                <button
                  key={s}
                  onClick={() => handleAdd(s)}
                  className="px-2 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-cyan-500/30 text-[11px] text-slate-300 hover:text-cyan-300 transition"
                >
                  +{s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
