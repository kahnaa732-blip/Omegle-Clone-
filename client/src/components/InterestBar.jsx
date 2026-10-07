import React, { useState } from 'react';
import { Video, MessageSquare, Plus, X, Hash, Globe } from 'lucide-react';
import { AVAILABLE_LANGUAGES } from '../utils/languages.js';

const SUGGESTIONS = [
  'gaming',
  'anime',
  'music',
  'coding',
  'movies',
  'books',
  'philosophy',
  'travel'
];

export function InterestBar({
  chatMode = 'text',
  onChangeMode,
  language = 'any',
  onChangeLanguage,
  interests = [],
  onAddInterest,
  onRemoveInterest,
  isSearching
}) {
  const [inputVal, setInputVal] = useState('');

  const handleAdd = (val) => {
    const clean = (val || inputVal).trim().toLowerCase();
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
    <div className="bg-dark-900 border-b border-slate-800/80 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 select-none text-xs">
      {/* Mode Switcher */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-xl border border-slate-800">
        <button
          onClick={() => onChangeMode('text')}
          disabled={isSearching}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all focus-visible:ring-2 focus-visible:ring-emerald-500 ${
            chatMode === 'text'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          } disabled:opacity-50`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Text Only</span>
        </button>
        <button
          onClick={() => onChangeMode('video')}
          disabled={isSearching}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all focus-visible:ring-2 focus-visible:ring-emerald-500 ${
            chatMode === 'video'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          } disabled:opacity-50`}
        >
          <Video className="w-3.5 h-3.5" />
          <span>Video Mode</span>
        </button>
      </div>

      {/* Voluntary Language Selector in Chat */}
      <div className="flex items-center gap-1.5 bg-slate-900/90 px-2.5 py-1.5 rounded-xl border border-slate-800">
        <Globe className="w-3.5 h-3.5 text-emerald-400" />
        <select
          value={language}
          onChange={(e) => onChangeLanguage && onChangeLanguage(e.target.value)}
          disabled={isSearching}
          className="bg-transparent text-slate-300 focus:outline-none text-[11px] cursor-pointer"
        >
          {AVAILABLE_LANGUAGES.map((l) => (
            <option key={l.code} value={l.code} className="bg-dark-800 text-white">
              {l.label}
            </option>
          ))}
        </select>
      </div>

      {/* Interests / Topics Filter */}
      <div className="flex-1 flex flex-wrap items-center gap-2 max-w-2xl">
        <div className="flex items-center gap-1 text-slate-400 font-medium">
          <Hash className="w-3.5 h-3.5 text-emerald-400" />
          <span>Topics:</span>
        </div>

        {/* Active Interest Chips */}
        {interests.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-medium text-[11px]"
          >
            #{tag}
            <button
              onClick={() => onRemoveInterest(tag)}
              className="hover:text-white rounded-full p-0.5 hover:bg-emerald-500/30"
              title="Remove topic"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        {/* Input Field */}
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={interests.length === 0 ? "Add topics (e.g. gaming, anime)..." : "Add more..."}
            className="bg-dark-800 border border-slate-700/80 rounded-xl px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-36 sm:w-52"
          />
          {inputVal.trim() && (
            <button
              onClick={() => handleAdd()}
              className="p-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick Suggestion Pills */}
        {interests.length < 3 && (
          <div className="hidden lg:flex items-center gap-1 text-[11px] text-slate-500">
            <span className="text-[10px] uppercase font-semibold">Try:</span>
            {SUGGESTIONS.filter(s => !interests.includes(s)).slice(0, 4).map((s) => (
              <button
                key={s}
                onClick={() => handleAdd(s)}
                className="px-2 py-0.5 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700/40 transition"
              >
                +{s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
