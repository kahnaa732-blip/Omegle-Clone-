import React from 'react';

export function ReactionsOverlay({ reactions = [], onSendReaction, isConnected }) {
  const EMOJIS = ['❤️', '😂', '🔥', '👏', '😮', '💀'];

  return (
    <>
      {/* Floating Reaction Animation Layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
        {reactions.map((r) => (
          <div
            key={r.id}
            className="absolute text-3xl select-none animate-float-fade"
            style={{
              left: `${r.x}%`,
              bottom: '15%'
            }}
          >
            {r.emoji}
          </div>
        ))}
      </div>

      {/* Interactive Reaction Dock */}
      {isConnected && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 p-1.5 rounded-2xl bg-dark-900/80 backdrop-blur-md border border-slate-700/60 shadow-xl opacity-80 hover:opacity-100 transition-opacity">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onSendReaction(emoji)}
              className="w-8 h-8 flex items-center justify-center text-lg hover:scale-125 active:scale-95 transition-transform rounded-xl hover:bg-slate-800"
              title={`React with ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
