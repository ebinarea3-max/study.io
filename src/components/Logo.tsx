import React from 'react';

export function Logo({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      <svg
        viewBox="0 0 64 64"
        fill="none"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Dark Squircle Background */}
        <rect
          width="64"
          height="64"
          rx="16"
          fill="#0F172A"
          stroke="#1E293B"
          strokeWidth="1.5"
        />

        {/* Book Left Page */}
        <path
          d="M 29.5 19 C 25.5 16.5 20.5 16.5 16 18.5 V 43 C 20.5 41.5 25.5 42 29.5 45.5"
          stroke="#94A3B8"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Book Right Page */}
        <path
          d="M 34.5 19 C 38.5 16.5 43.5 16.5 48 18.5 V 43 C 43.5 41.5 38.5 42 34.5 45.5"
          stroke="#94A3B8"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Green "i" dot */}
        <circle cx="32" cy="13.5" r="3.75" fill="#10B981" />

        {/* Green "i" vertical spine */}
        <line
          x1="32"
          y1="19"
          x2="32"
          y2="46.5"
          stroke="#10B981"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
