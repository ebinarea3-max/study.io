'use client';

import React from 'react';
import { useRoom } from '../../context/RoomContext';

export function FloatingReactions() {
  const { floatingReactions } = useRoom();

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {floatingReactions.map(reaction => (
        <div
          key={reaction.id}
          className="absolute flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 px-3 py-1.5 rounded-full shadow-2xl animate-float-up pointer-events-none"
          style={{
            left: `${reaction.x}%`,
            top: `${reaction.y}%`,
          }}
        >
          <span className="text-2xl">{reaction.emoji}</span>
          <div className="text-xs">
            <span className="font-semibold text-emerald-400">{reaction.fromName}</span>
            <span className="text-slate-400"> cheered </span>
            <span className="font-semibold text-cyan-400">{reaction.toName}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
