import React from 'react';
import { RankTierName, RANK_TIERS } from '../../lib/rankedSystem';

interface RankCrestBadgeProps {
  tier: RankTierName;
  size?: number | string;
  className?: string;
  isGhost?: boolean;
  ghostColor?: string;
  showSheen?: boolean;
}

const TIER_SCALES: Record<string, number> = {
  Bronze: 1.0,
  Silver: 1.06,
  Gold: 1.12,
  Platinum: 1.18,
  Diamond: 1.25,
  Heroic: 1.32,
  Master: 1.40,
  Grandmaster: 1.50,
};

export function RankCrestBadge({
  tier,
  size = 72,
  className = '',
  isGhost = false,
  ghostColor,
  showSheen = true,
}: RankCrestBadgeProps) {
  const config = RANK_TIERS.find(t => t.tier === tier) || RANK_TIERS[0];
  const scale = TIER_SCALES[tier] || 1.0;
  
  // Use inline style for size if size is a number
  const actualSize = typeof size === 'number' ? size * scale : `calc(${size} * ${scale})`;

  const containerStyle: React.CSSProperties = {
    width: actualSize,
    height: actualSize,
    minWidth: actualSize,
    filter: isGhost && ghostColor ? `drop-shadow(0 0 10px ${ghostColor})` : undefined,
  };

  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      style={containerStyle}
    >
      <svg
        viewBox="0 0 340 320"
        className="w-full h-full filter transition-all duration-500 drop-shadow-[0_10px_25px_rgba(0,0,0,0.65)]"
      >
        <defs>
          {/* Steel Light Chrome Gradient */}
          <linearGradient id={`crestSteelLight-${tier}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="25%" stopColor="#F1F5F9" />
            <stop offset="60%" stopColor="#CBD5E1" />
            <stop offset="100%" stopColor="#64748B" />
          </linearGradient>

          {/* Steel Dark Brushed Shadow Gradient */}
          <linearGradient id={`crestSteelDark-${tier}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#94A3B8" />
            <stop offset="40%" stopColor="#64748B" />
            <stop offset="75%" stopColor="#334155" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>

          {/* Bronze Metallic Inlay */}
          <linearGradient id={`tierBronzeLight-${tier}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E2C499" />
            <stop offset="35%" stopColor="#C2884A" />
            <stop offset="100%" stopColor="#8A501F" />
          </linearGradient>
          <linearGradient id={`tierBronzeDark-${tier}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A0522D" />
            <stop offset="55%" stopColor="#6E2C00" />
            <stop offset="100%" stopColor="#3B1C06" />
          </linearGradient>

          {/* Silver Chrome Inlay */}
          <linearGradient id={`tierSilverLight-${tier}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="45%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#94A3B8" />
          </linearGradient>
          <linearGradient id={`tierSilverDark-${tier}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#94A3B8" />
            <stop offset="50%" stopColor="#64748B" />
            <stop offset="100%" stopColor="#1E293B" />
          </linearGradient>

          {/* Gold Inlay */}
          <linearGradient id={`tierGoldLight-${tier}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FEF9C3" />
            <stop offset="40%" stopColor="#FACC15" />
            <stop offset="100%" stopColor="#CA8A04" />
          </linearGradient>
          <linearGradient id={`tierGoldDark-${tier}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EAB308" />
            <stop offset="50%" stopColor="#A16207" />
            <stop offset="100%" stopColor="#713F12" />
          </linearGradient>

          {/* Platinum Inlay */}
          <linearGradient id={`tierPlatinumLight-${tier}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E0F2FE" />
            <stop offset="40%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>
          <linearGradient id={`tierPlatinumDark-${tier}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0284C7" />
            <stop offset="50%" stopColor="#0369A1" />
            <stop offset="100%" stopColor="#075985" />
          </linearGradient>

          {/* Diamond Inlay */}
          <linearGradient id={`tierDiamondLight-${tier}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="30%" stopColor="#BAE6FD" />
            <stop offset="70%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>
          <linearGradient id={`tierDiamondDark-${tier}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="45%" stopColor="#0369A1" />
            <stop offset="85%" stopColor="#1E3A8A" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>

          {/* Heroic Inlay */}
          <linearGradient id={`tierHeroicLight-${tier}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FEE2E2" />
            <stop offset="40%" stopColor="#EF4444" />
            <stop offset="100%" stopColor="#B91C1C" />
          </linearGradient>
          <linearGradient id={`tierHeroicDark-${tier}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#B91C1C" />
            <stop offset="50%" stopColor="#7F1D1D" />
            <stop offset="100%" stopColor="#450A0A" />
          </linearGradient>

          {/* Grandmaster Inlay */}
          <linearGradient id={`tierGrandmasterLight-${tier}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFBEB" />
            <stop offset="40%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#EA580C" />
          </linearGradient>
          <linearGradient id={`tierGrandmasterDark-${tier}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EA580C" />
            <stop offset="50%" stopColor="#C2410C" />
            <stop offset="100%" stopColor="#431407" />
          </linearGradient>

          {/* Faceted Gem Core Radial Glow */}
          <radialGradient id={`gemCoreGlow-${tier}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="50%" stopColor={config.badgeAccent} stopOpacity="0.8" />
            <stop offset="100%" stopColor={config.badgeSecondary} stopOpacity="0.2" />
          </radialGradient>
        </defs>

        {(() => {
          const accentLight =
            tier === 'Bronze' ? `url(#tierBronzeLight-${tier})` :
            tier === 'Silver' ? `url(#tierSilverLight-${tier})` :
            tier === 'Gold' ? `url(#tierGoldLight-${tier})` :
            tier === 'Platinum' ? `url(#tierPlatinumLight-${tier})` :
            tier === 'Diamond' ? `url(#tierDiamondLight-${tier})` :
            tier === 'Heroic' ? `url(#tierHeroicLight-${tier})` :
            `url(#tierGrandmasterLight-${tier})`;

          const accentDark =
            tier === 'Bronze' ? `url(#tierBronzeDark-${tier})` :
            tier === 'Silver' ? `url(#tierSilverDark-${tier})` :
            tier === 'Gold' ? `url(#tierGoldDark-${tier})` :
            tier === 'Platinum' ? `url(#tierPlatinumDark-${tier})` :
            tier === 'Diamond' ? `url(#tierDiamondDark-${tier})` :
            tier === 'Heroic' ? `url(#tierHeroicDark-${tier})` :
            `url(#tierGrandmasterDark-${tier})`;

          const steelLight = `url(#crestSteelLight-${tier})`;
          const steelDark = `url(#crestSteelDark-${tier})`;

          return (
            <g>
              {/* === 1. METALLIC ESPORTS WINGS === */}
              {/* LEFT WING: Upper Razor Blade */}
              <polygon
                points="150,140 100,75 40,48 70,88 120,150"
                fill={steelLight}
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="1"
              />
              <polygon
                points="120,150 70,88 40,48 60,110 135,170"
                fill={steelDark}
              />
              {/* LEFT WING: Mid Razor Blade */}
              <polygon
                points="145,160 85,115 30,105 55,140 130,188"
                fill={accentLight}
              />
              <polygon
                points="130,188 55,140 30,105 45,160 125,205"
                fill={accentDark}
              />
              {/* LEFT WING: Lower Blade Flange */}
              <polygon
                points="140,195 90,170 45,175 75,205 135,225"
                fill={steelDark}
              />

              {/* RIGHT WING: Upper Razor Blade */}
              <polygon
                points="190,140 240,75 300,48 270,88 220,150"
                fill={steelLight}
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="1"
              />
              <polygon
                points="220,150 270,88 300,48 280,110 205,170"
                fill={steelDark}
              />
              {/* RIGHT WING: Mid Razor Blade */}
              <polygon
                points="195,160 255,115 310,105 285,140 210,188"
                fill={accentLight}
              />
              <polygon
                points="210,188 285,140 310,105 295,160 215,205"
                fill={accentDark}
              />
              {/* RIGHT WING: Lower Blade Flange */}
              <polygon
                points="200,195 250,170 295,175 265,205 205,225"
                fill={steelDark}
              />

              {/* === 2. CENTER HEAVY COMBAT SHIELD === */}
              {/* Outer Chiseled Shield Frame (Left Highlight / Right Shadow) */}
              <polygon
                points="170,72 108,110 118,205 170,268 170,248 132,195 124,122 170,88"
                fill={steelLight}
              />
              <polygon
                points="170,72 232,110 222,205 170,268 170,248 208,195 216,122 170,88"
                fill={steelDark}
              />
              {/* Outer Sharp Border */}
              <polygon
                points="170,72 232,110 222,205 170,268 118,205 108,110"
                fill="none"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="1.2"
              />

              {/* Inner Recessed Obsidian Titanium Shield Plate */}
              <polygon
                points="170,88 216,122 208,195 170,248 132,195 124,122"
                fill="#070A0F"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="1"
              />

              {/* Center Crease */}
              <line
                x1="170"
                y1="88"
                x2="170"
                y2="248"
                stroke="rgba(255,255,255,0.25)"
                strokeWidth="1"
              />

              {/* === 3. TOP CROWN APEX === */}
              <polygon
                points="170,52 184,80 170,75 156,80"
                fill={accentLight}
                stroke="#FFFFFF"
                strokeWidth="1"
              />
              <polygon points="152,65 162,82 152,78 144,82" fill={steelLight} />
              <polygon points="188,65 196,82 188,78 178,82" fill={steelDark} />

              {/* === 4. FACETED DIAMOND / JEWEL CENTER === */}
              {/* Outer Gem Bevel Housing */}
              <polygon
                points="170,122 202,154 202,182 170,218 138,182 138,154"
                fill="#0B0F17"
                stroke={accentLight}
                strokeWidth="1.5"
              />

              {/* Radial Gem Glow */}
              <circle cx="170" cy="168" r="32" fill={`url(#gemCoreGlow-${tier})`} />

              {/* Faceted Cut Gem: Top-Left (Brilliant Highlight) */}
              <polygon
                points="170,126 142,156 170,168"
                fill={accentLight}
              />
              {/* Faceted Cut Gem: Top-Right (Accent Tone) */}
              <polygon
                points="170,126 198,156 170,168"
                fill={accentDark}
              />
              {/* Faceted Cut Gem: Bottom-Left (Specular Cut) */}
              <polygon
                points="142,156 170,214 170,168"
                fill={steelLight}
              />
              {/* Faceted Cut Gem: Bottom-Right (Deep Shadow Reflection) */}
              <polygon
                points="198,156 170,214 170,168"
                fill={steelDark}
              />

              {/* Inner Diamond Star Core Facet */}
              <polygon
                points="170,150 179,168 170,186 161,168"
                fill="#FFFFFF"
                opacity="0.92"
              />
              <polygon
                points="170,156 175,168 170,180 165,168"
                fill={accentLight}
              />
            </g>
          );
        })()}
      </svg>

      {/* Center of shield is left empty/faceted gem core as requested, TierIcon removed */}

      {/* Ambient Rotating Conic Sheen across badge surface (8s linear loop for metal luster) */}
      {showSheen && !isGhost && (
        <div
          className="absolute inset-[8%] rounded-full pointer-events-none mix-blend-overlay overflow-hidden opacity-35"
          style={{
            maskImage: 'radial-gradient(circle at center, black 65%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(circle at center, black 65%, transparent 75%)',
          }}
        >
          <div
            className="w-full h-full rounded-full"
            style={{
              background:
                'conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(255,255,255,0.02) 40deg, rgba(255,255,255,0.4) 90deg, rgba(255,255,255,0.02) 140deg, transparent 180deg, rgba(255,255,255,0.25) 270deg, transparent 360deg)',
              animation: 'conicSheenRotate 8s linear infinite',
              willChange: 'transform',
            }}
          />
        </div>
      )}
    </div>
  );
}
