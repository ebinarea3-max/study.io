'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { FlairFrame, FLAIR_FRAMES } from '../../lib/flair';

export function AvatarFlairRing({
  children,
}: {
  frame?: FlairFrame | null;
  children: React.ReactNode;
  className?: string;
  size?: number;
}) {
  return <>{children}</>;
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
  const flairConfig = FLAIR_FRAMES[frame] || FLAIR_FRAMES.gold;

  return (
    <Check
      style={{
        width: size,
        height: size,
        color: '#FFFFFF',
      }}
      strokeWidth={3}
      className={`shrink-0 inline text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] -ml-0.5 ${className}`}
      aria-label={`${flairConfig.name} Verified Scholar`}
    />
  );
}

// Backwards compatibility aliases for components importing FlairStar or FlairVerifiedBadge
export const FlairStar = FlairCrown;
export const FlairVerifiedBadge = FlairCrown;
export const FlairVerifiedTick = FlairCrown;
