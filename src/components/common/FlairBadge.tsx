'use client';

import React from 'react';
import { Crown } from 'lucide-react';
import { FlairFrame } from '../../lib/flair';

export function AvatarFlairRing({
  frame,
  children,
  className = '',
  size = 40,
}: {
  frame?: FlairFrame | null;
  children: React.ReactNode;
  className?: string;
  size?: number;
}) {
  if (!frame) {
    return <>{children}</>;
  }

  const badgeSize = Math.max(13, Math.round(size * 0.38));
  const crownSize = Math.max(8, Math.round(badgeSize * 0.62));

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}>
      {children}
      {/* Golden Crown Icon on the Bottom Left of Profile Icon */}
      <div
        className="absolute -bottom-0.5 -left-0.5 z-20 rounded-full bg-gradient-to-tr from-[#B8892B] via-[#E6C15A] to-[#FDF4D4] border border-[#FFE898] shadow-md flex items-center justify-center text-[#1A1405] pointer-events-none"
        style={{
          width: badgeSize,
          height: badgeSize,
          boxShadow: '0 1px 4px rgba(0,0,0,0.5), 0 0 8px rgba(230,193,90,0.4)',
        }}
        title="Premium Scholar"
      >
        <Crown
          style={{ width: crownSize, height: crownSize }}
          className="fill-current drop-shadow-sm"
        />
      </div>
    </div>
  );
}

export function FlairCrown({
  frame,
  className = '',
  size = 14,
}: {
  frame?: FlairFrame | null;
  className?: string;
  size?: number;
}) {
  if (!frame) return null;

  return (
    <Crown
      style={{
        width: size,
        height: size,
        color: '#E6C15A',
      }}
      className={`fill-current shrink-0 inline drop-shadow-sm ${className}`}
      aria-label="Premium Scholar"
    />
  );
}

// Backwards compatibility alias for components importing FlairStar
export const FlairStar = FlairCrown;

