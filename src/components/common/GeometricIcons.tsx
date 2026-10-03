import React from 'react';

/**
 * Geometric, faceted crest trophy matching Study.io's RPG HUD visual language.
 * Uses sharp angular cuts and bevels rather than generic rounded stock outlines.
 */
export function FacetedTrophyIcon({ className = 'w-4 h-4', ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Faceted angular chalice cup */}
      <path d="M6 3h12l-1.5 8.5L12 15l-4.5-3.5L6 3z" />
      {/* Angular geometric handles */}
      <path d="M6 5H3.5l1.5 4.5H7" />
      <path d="M18 5h2.5l-1.5 4.5H17" />
      {/* Stem and beveled geometric base */}
      <path d="M12 15v4" />
      <path d="M8 21h8l-1.5-2h-5L8 21z" />
    </svg>
  );
}

/**
 * Geometric, faceted tech cog / gear matching the angular HUD aesthetic.
 */
export function FacetedGearIcon({ className = 'w-4 h-4', ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Angular faceted outer gear teeth */}
      <polygon points="12 2 15 4 19 4 20 8 23 10 22 14 23 18 19 19 17 22 13 21 11 22 7 19 5 19 2 15 3 11 2 7 6 4 9 4" />
      {/* Inner hexagonal core */}
      <polygon points="12 9 14.6 10.5 14.6 13.5 12 15 9.4 13.5 9.4 10.5" />
    </svg>
  );
}
