'use client';

import React, { useState } from 'react';
import { Share2, Sparkles, Trophy } from 'lucide-react';

export function DemoSeasonCardTile() {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = -((y - centerY) / centerY) * 7; // max 7 deg
    const rotY = ((x - centerX) / centerX) * 7;
    setTilt({ x: rotX, y: rotY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
  };

  return (
    <div className="h-full flex flex-col justify-between p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-card transition-all">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Share2 className="w-3.5 h-3.5 text-[#E6C15A]" />
            <h4 className="font-hud font-bold text-xs uppercase tracking-wider text-[var(--text)]">
              Season Share Card
            </h4>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.05] text-[var(--text-dim)] border border-[var(--border)]">
            3D Tilt
          </span>
        </div>

        <p className="text-xs text-[var(--text-dim)] mb-4">
          Export high-resolution 1080&times;1920 seasonal recap cards tailored for stories and milestones.
        </p>

        {/* 9:16 Mini Card with 3D Tilt Container */}
        <div className="flex justify-center py-2" style={{ perspective: '800px' }}>
          <div
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={handleMouseLeave}
            className="w-44 h-72 rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden transition-transform duration-200 cursor-pointer shadow-xl select-none"
            style={{
              background: 'linear-gradient(160deg, #161820 0%, #0A0C10 100%)',
              border: isHovered
                ? '1px solid rgba(230, 193, 90, 0.6)'
                : '1px solid rgba(230, 193, 90, 0.25)',
              transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${isHovered ? 1.03 : 1})`,
              boxShadow: isHovered
                ? '0 16px 32px -8px rgba(230, 193, 90, 0.25)'
                : '0 8px 24px -4px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Ambient gold glow */}
            <div className="absolute -top-12 -right-12 w-28 h-28 bg-[#E6C15A]/20 rounded-full blur-2xl pointer-events-none" />

            {/* Header */}
            <div>
              <div className="flex items-center justify-between text-[9px] font-hud uppercase tracking-widest text-[#E6C15A]">
                <span>study.io</span>
                <span>2026-10</span>
              </div>
              <div className="text-xs font-bold text-[var(--text)] mt-1 truncate">
                Alex Rivers
              </div>
              <div className="text-[9px] font-mono text-[var(--text-dim)]">
                @scholar_alex
              </div>
            </div>

            {/* Crest representation */}
            <div className="flex flex-col items-center justify-center my-auto">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#F5E6A8] via-[#E6C15A] to-[#B8892B] p-0.5 shadow-lg flex items-center justify-center">
                <div className="w-full h-full rounded-[14px] bg-[#0E1017] flex items-center justify-center">
                  <Trophy className="w-7 h-7 text-[#E6C15A]" />
                </div>
              </div>
              <span className="font-hud font-extrabold text-[11px] text-[var(--text)] tracking-wider uppercase mt-2">
                DIAMOND II
              </span>
            </div>

            {/* Bottom Stats */}
            <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-1 text-[9px] font-mono">
              <div>
                <span className="text-[var(--text-dim)] block">Focus</span>
                <span className="text-[var(--text)] font-semibold">142.5 hrs</span>
              </div>
              <div>
                <span className="text-[var(--text-dim)] block">Streak</span>
                <span className="text-orange-400 font-semibold">28 days</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[var(--border)] text-[11px] text-[var(--text-dim)] font-mono text-center">
        Hover card to test perspective physics
      </div>
    </div>
  );
}
