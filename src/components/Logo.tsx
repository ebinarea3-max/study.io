import React from 'react';

export function Logo({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      <svg viewBox="0 0 48 48" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="ringGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="eclipseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="60%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <filter id="coreGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle cx="24" cy="24" r="20" fill="url(#ringGlow)" />
        <circle cx="24" cy="24" r="16" stroke="#1E293B" strokeWidth="3.5" strokeLinecap="round" />
        <path
          d="M 24 8 A 16 16 0 1 1 35.3 12.7"
          stroke="url(#eclipseGrad)"
          strokeWidth="3.5"
          strokeLinecap="round"
          filter="url(#coreGlow)"
        />
        <circle cx="35.3" cy="12.7" r="2.5" fill="#6EE7B7" filter="url(#coreGlow)" />
        <circle cx="24" cy="24" r="3" fill="#F8FAFC" />
      </svg>
    </div>
  );
}
