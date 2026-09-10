'use client';

import React, { useState, useEffect } from 'react';

interface UserAvatarProps {
  src?: string | null;
  name?: string;
  size?: number;
  className?: string;
}

const GRADIENT_PALETTES = [
  'from-emerald-400 via-teal-500 to-cyan-500',
  'from-blue-500 via-indigo-500 to-purple-600',
  'from-violet-500 via-purple-500 to-fuchsia-500',
  'from-amber-400 via-orange-500 to-rose-500',
  'from-teal-400 via-emerald-500 to-green-600',
  'from-rose-400 via-pink-500 to-purple-500',
  'from-cyan-400 via-blue-500 to-indigo-600',
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

export function UserAvatar({ src, name, size = 36, className = '' }: UserAvatarProps) {
  const [hasError, setHasError] = useState(false);

  // Reset error state if the src changes
  useEffect(() => {
    setHasError(false);
  }, [src]);

  const initials = getInitials(name);
  const gradient = getAvatarGradient(name);

  // If no source provided or loading failed, display the gradient initials avatar
  if (!src || hasError) {
    return (
      <div
        className={`rounded-xl bg-gradient-to-tr ${gradient} flex items-center justify-center font-black text-slate-950 tracking-wider select-none shadow-md ${className}`}
        style={{
          width: size,
          height: size,
          fontSize: Math.max(10, Math.floor(size * 0.38)),
        }}
        title={name || 'User Profile'}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name || 'User Avatar'}
      width={size}
      height={size}
      loading="lazy"
      onError={() => setHasError(true)}
      className={`rounded-xl object-cover ${className}`}
      style={{
        width: size,
        height: size,
      }}
    />
  );
}
