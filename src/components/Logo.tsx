import React from 'react';

export function Logo({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg className={className} width="40" height="40" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="64" height="64" rx="16" fill="#0F172A" stroke="#1E293B" strokeWidth="2"/>
      <path d="M32 20C27 16 19 16.5 16 18V44C19 42.5 27 42 32 46C37 42 45 42.5 48 44V18C45 16.5 37 16 32 20Z" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="32" y1="20" x2="32" y2="46" stroke="#10B981" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="32" cy="14" r="3.5" fill="#10B981"/>
    </svg>
  );
}
