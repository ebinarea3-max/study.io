'use client';

import React, { useState, useEffect } from 'react';
import { Crown } from 'lucide-react';

interface UserAvatarProps {
  src?: string | null;
  name?: string;
  size?: number;
  className?: string;
  showCrown?: boolean;
}

const GRADIENT_PALETTES = [
  'from-cyan-500 via-teal-400 to-emerald-500',
  'from-emerald-400 via-teal-500 to-cyan-500',
  'from-indigo-500 via-violet-500 to-purple-600',
  'from-violet-500 via-purple-500 to-fuchsia-500',
  'from-amber-400 via-orange-500 to-rose-500',
  'from-teal-400 via-emerald-500 to-green-500',
  'from-cyan-400 via-teal-500 to-emerald-600',
];

export function getInitials(name?: string): string {
  if (!name) return '⚡';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '⚡';
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getAvatarGradient(name?: string): string {
  if (!name) return GRADIENT_PALETTES[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % GRADIENT_PALETTES.length;
  return GRADIENT_PALETTES[index];
}

export function UserAvatar({
  src,
  name,
  size = 36,
  className = '',
  showCrown = false,
}: UserAvatarProps) {
  const [hasError, setHasError] = useState(false);

  const cleanSrc = typeof src === 'string' && src.trim().length > 0 ? src.trim() : null;

  // Reset error state if the src changes
  useEffect(() => {
    setHasError(false);
  }, [cleanSrc]);

  const initials = getInitials(name);
  const gradient = getAvatarGradient(name);
  const roundedClass = className.includes('rounded-') ? '' : 'rounded-full';

  const badgeSize = Math.max(13, Math.round(size * 0.38));
  const crownSize = Math.max(8, Math.round(badgeSize * 0.62));

  return (
    <div
      className={`relative inline-flex shrink-0 select-none ${className}`}
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
    >
      <div className={`relative w-full h-full ${roundedClass} overflow-hidden shadow-sm`}>
        {/* Background Fallback (Initials) */}
        <div
          className={`absolute inset-0 bg-gradient-to-tr ${gradient} flex items-center justify-center font-black text-slate-950 tracking-wider shadow-inner rounded-full`}
          style={{ fontSize: Math.max(10, Math.floor(size * 0.38)) }}
          title={name || 'User Profile'}
        >
          {initials}
        </div>

        {/* Foreground Avatar Image */}
        {cleanSrc && !hasError && (
          <img
            src={cleanSrc}
            alt={name || 'User Avatar'}
            width={size}
            height={size}
            referrerPolicy="no-referrer"
            onError={() => {
              setHasError(true);
            }}
            className="absolute inset-0 w-full h-full object-cover rounded-full"
          />
        )}
      </div>

      {/* Premium Crown Icon on Bottom Left */}
      {showCrown && (
        <div
          className="absolute -bottom-0.5 -left-0.5 z-10 rounded-full bg-gradient-to-tr from-[#B8892B] via-[#E6C15A] to-[#FDF4D4] border border-[#FFE898] shadow-md flex items-center justify-center text-[#1A1405] pointer-events-none"
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
      )}
    </div>
  );
}

