import React from 'react';
import { RankTierName, RANK_TIERS } from '../../lib/rankedSystem';
import { BookOpen, Feather, Brain, Trophy, Crown, Sparkles, Hexagon } from 'lucide-react';

interface RankCrestBadgeProps {
  tier: RankTierName;
  division?: string;
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
  Champion: 1.38,
  Master: 1.44,
  Grandmaster: 1.50,
};

export function RankCrestBadge({
  tier,
  division,
  size = 72,
  className = '',
  isGhost = false,
  ghostColor,
  showSheen = true,
}: RankCrestBadgeProps) {
  const config = RANK_TIERS.find(t => t.tier === tier) || RANK_TIERS[0];
  const scale = TIER_SCALES[tier] || 1.0;
  
  const actualSize = typeof size === 'number' ? size * scale : `calc(${size} * ${scale})`;

  const containerStyle: React.CSSProperties = {
    width: actualSize,
    height: actualSize,
    minWidth: actualSize,
    filter: isGhost && ghostColor ? `drop-shadow(0 0 10px ${ghostColor})` : `drop-shadow(0 4px 12px rgba(0,0,0,0.5))`,
  };

  const accentLight = `url(#tier${tier}Light-${tier})`;
  const accentDark = `url(#tier${tier}Dark-${tier})`;
  const steelLight = `url(#crestSteelLight-${tier})`;
  const steelDark = `url(#crestSteelDark-${tier})`;
  
  // Custom compositions based on tier using PERCENTAGE based scaling and positioning!
  // This ensures the icons stay perfectly inside the shield at ANY size!
  const renderComposition = () => {
    switch (tier) {
      case 'Bronze':
      case 'Silver':
      case 'Gold':
      case 'Platinum':
        return (
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Feather offset top-right */}
            <div className="absolute" style={{ top: '30%', right: '35%', width: '35%', height: '35%', transform: 'rotate(15deg)' }}>
                <Feather className="w-full h-full drop-shadow-md" stroke={accentLight} strokeWidth={2.5} />
            </div>
            {/* Book centered slightly bottom */}
            <div className="absolute" style={{ top: '45%', width: '50%', height: '50%' }}>
                <BookOpen className="w-full h-full drop-shadow-md" stroke={accentLight} strokeWidth={2} />
            </div>
          </div>
        );
      case 'Diamond':
        return (
          <div className="absolute inset-0 flex items-center justify-center">
             {/* Brain hovering above */}
            <div className="absolute drop-shadow-[0_0_15px_rgba(56,189,248,0.6)]" style={{ top: '25%', width: '40%', height: '40%' }}>
                <Brain className="w-full h-full" stroke={accentLight} strokeWidth={2.5} />
            </div>
            {/* Book centered slightly bottom */}
            <div className="absolute" style={{ top: '50%', width: '50%', height: '50%' }}>
                <BookOpen className="w-full h-full drop-shadow-md" stroke={accentLight} strokeWidth={2} />
            </div>
          </div>
        );
      case 'Champion':
        return (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute drop-shadow-[0_0_20px_rgba(239,68,68,0.6)]" style={{ top: '35%', width: '55%', height: '55%' }}>
                <Trophy className="w-full h-full" stroke={accentLight} strokeWidth={2.5} />
            </div>
            <div className="absolute animate-pulse" style={{ top: '20%', right: '25%', width: '25%', height: '25%' }}>
                <Sparkles className="w-full h-full" stroke={steelLight} strokeWidth={2} />
            </div>
          </div>
        );
      case 'Master':
        return (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute drop-shadow-[0_0_20px_rgba(245,158,11,0.6)]" style={{ top: '25%', width: '40%', height: '40%' }}>
                <Crown className="w-full h-full" stroke={accentLight} strokeWidth={2.5} />
            </div>
            <div className="absolute" style={{ top: '48%', width: '50%', height: '50%' }}>
                <BookOpen className="w-full h-full drop-shadow-md" stroke={accentLight} strokeWidth={2} />
            </div>
          </div>
        );
      case 'Grandmaster':
        return (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-[3px] border-dashed border-orange-500/30 animate-[spin_10s_linear_infinite]" />
            <div className="absolute inset-[10%] rounded-full border-[2px] border-amber-400/50 animate-[spin_7s_linear_infinite_reverse]" />
            
            <div className="absolute drop-shadow-[0_0_25px_rgba(234,88,12,0.8)]" style={{ top: '25%', width: '40%', height: '40%' }}>
                <Crown className="w-full h-full" stroke={accentLight} strokeWidth={3} />
            </div>
            <div className="absolute drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" style={{ top: '48%', width: '50%', height: '50%' }}>
                <BookOpen className="w-full h-full" stroke={accentLight} strokeWidth={2.5} />
            </div>
            
            <div className="absolute animate-pulse" style={{ top: '15%', left: '20%', width: '20%', height: '20%' }}>
                <Sparkles className="w-full h-full" stroke="#FFFBEB" strokeWidth={2} />
            </div>
            <div className="absolute animate-pulse delay-150" style={{ bottom: '20%', right: '20%', width: '20%', height: '20%' }}>
                <Sparkles className="w-full h-full" stroke="#FFFBEB" strokeWidth={2} />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      style={containerStyle}
    >
      <svg
        viewBox="0 0 340 320"
        className="absolute inset-0 w-full h-full filter transition-all duration-500"
      >
        <defs>
          <linearGradient id={`crestSteelLight-${tier}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="25%" stopColor="#F1F5F9" />
            <stop offset="60%" stopColor="#CBD5E1" />
            <stop offset="100%" stopColor="#64748B" />
          </linearGradient>
          <linearGradient id={`crestSteelDark-${tier}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#94A3B8" />
            <stop offset="40%" stopColor="#64748B" />
            <stop offset="75%" stopColor="#334155" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>

          <linearGradient id={`tierBronzeLight-${tier}`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#E2C499" /><stop offset="35%" stopColor="#C2884A" /><stop offset="100%" stopColor="#8A501F" /></linearGradient>
          <linearGradient id={`tierBronzeDark-${tier}`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#A0522D" /><stop offset="55%" stopColor="#6E2C00" /><stop offset="100%" stopColor="#3B1C06" /></linearGradient>

          <linearGradient id={`tierSilverLight-${tier}`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#FFFFFF" /><stop offset="45%" stopColor="#E2E8F0" /><stop offset="100%" stopColor="#94A3B8" /></linearGradient>
          <linearGradient id={`tierSilverDark-${tier}`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#94A3B8" /><stop offset="50%" stopColor="#64748B" /><stop offset="100%" stopColor="#1E293B" /></linearGradient>

          <linearGradient id={`tierGoldLight-${tier}`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#FEF9C3" /><stop offset="40%" stopColor="#FACC15" /><stop offset="100%" stopColor="#CA8A04" /></linearGradient>
          <linearGradient id={`tierGoldDark-${tier}`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#EAB308" /><stop offset="50%" stopColor="#A16207" /><stop offset="100%" stopColor="#713F12" /></linearGradient>

          <linearGradient id={`tierPlatinumLight-${tier}`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#E0F2FE" /><stop offset="40%" stopColor="#38BDF8" /><stop offset="100%" stopColor="#0284C7" /></linearGradient>
          <linearGradient id={`tierPlatinumDark-${tier}`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#0284C7" /><stop offset="50%" stopColor="#0369A1" /><stop offset="100%" stopColor="#075985" /></linearGradient>

          <linearGradient id={`tierDiamondLight-${tier}`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#FFFFFF" /><stop offset="30%" stopColor="#BAE6FD" /><stop offset="70%" stopColor="#38BDF8" /><stop offset="100%" stopColor="#0284C7" /></linearGradient>
          <linearGradient id={`tierDiamondDark-${tier}`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#38BDF8" /><stop offset="45%" stopColor="#0369A1" /><stop offset="85%" stopColor="#1E3A8A" /><stop offset="100%" stopColor="#0F172A" /></linearGradient>

          <linearGradient id={`tierChampionLight-${tier}`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#FEE2E2" /><stop offset="40%" stopColor="#EF4444" /><stop offset="100%" stopColor="#B91C1C" /></linearGradient>
          <linearGradient id={`tierChampionDark-${tier}`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#B91C1C" /><stop offset="50%" stopColor="#7F1D1D" /><stop offset="100%" stopColor="#450A0A" /></linearGradient>

          <linearGradient id={`tierGrandmasterLight-${tier}`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#FFFBEB" /><stop offset="40%" stopColor="#F59E0B" /><stop offset="100%" stopColor="#EA580C" /></linearGradient>
          <linearGradient id={`tierGrandmasterDark-${tier}`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#EA580C" /><stop offset="50%" stopColor="#C2410C" /><stop offset="100%" stopColor="#431407" /></linearGradient>
          
          <radialGradient id={`gemCoreGlow-${tier}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="50%" stopColor={config.badgeAccent} stopOpacity="0.5" />
            <stop offset="100%" stopColor={config.badgeSecondary} stopOpacity="0.0" />
          </radialGradient>
        </defs>
        
        {/* === CONDITIONAL ESPORTS WINGS BASED ON DIVISION === */}
        {(() => {
          let count = 0;
          if (division === 'I') count = 1;
          else if (division === 'II') count = 2;
          else if (division === 'III') count = 3;
          else if (division === 'IV') count = 4;
          
          if (tier === 'Champion' || tier === 'Master' || tier === 'Grandmaster') {
             // For apex tiers, just give them full legendary wings if they want them, or maybe 4 wings.
             count = 4;
          }
          
          if (count === 0) return null;

          return (
            <g>
              {/* WING 1: Mid Razor Blade (Always present if count >= 1) */}
              {count >= 1 && (
                <g>
                  {/* Left */}
                  <polygon points="145,160 85,115 30,105 55,140 130,188" fill={accentLight} />
                  <polygon points="130,188 55,140 30,105 45,160 125,205" fill={accentDark} />
                  {/* Right */}
                  <polygon points="195,160 255,115 310,105 285,140 210,188" fill={accentLight} />
                  <polygon points="210,188 285,140 310,105 295,160 215,205" fill={accentDark} />
                </g>
              )}

              {/* WING 2: Upper Razor Blade (Present if count >= 2) */}
              {count >= 2 && (
                <g>
                  {/* Left */}
                  <polygon points="150,140 100,75 40,48 70,88 120,150" fill={steelLight} stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
                  <polygon points="120,150 70,88 40,48 60,110 135,170" fill={steelDark} />
                  {/* Right */}
                  <polygon points="190,140 240,75 300,48 270,88 220,150" fill={steelLight} stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
                  <polygon points="220,150 270,88 300,48 280,110 205,170" fill={steelDark} />
                </g>
              )}

              {/* WING 3: Lower Blade Flange (Present if count >= 3) */}
              {count >= 3 && (
                <g>
                  {/* Left */}
                  <polygon points="140,195 90,170 45,175 75,205 135,225" fill={steelDark} />
                  {/* Right */}
                  <polygon points="200,195 250,170 295,175 265,205 205,225" fill={steelDark} />
                </g>
              )}

              {/* WING 4: Topmost Extra Blade for Division IV or Apex Tiers */}
              {count >= 4 && (
                <g>
                  {/* Left */}
                  <polygon points="160,120 120,40 60,10 90,60 130,135" fill={accentLight} stroke="rgba(255,255,255,0.6)" strokeWidth="1" />
                  <polygon points="130,135 90,60 60,10 70,75 140,145" fill={accentDark} />
                  {/* Right */}
                  <polygon points="180,120 220,40 280,10 250,60 210,135" fill={accentLight} stroke="rgba(255,255,255,0.6)" strokeWidth="1" />
                  <polygon points="210,135 250,60 280,10 270,75 200,145" fill={accentDark} />
                </g>
              )}
            </g>
          );
        })()}

        {/* Shield Frame */}
        {tier !== 'Champion' && tier !== 'Grandmaster' && (
          <g>
            <polygon points="170,30 280,75 280,210 170,290 60,210 60,75" fill={steelLight} stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
            <polygon points="170,30 280,75 280,210 170,290 170,30" fill={steelDark} />
            <polygon points="170,45 265,85 265,200 170,270 75,200 75,85" fill="#0A0F1A" stroke={accentLight} strokeWidth="3" />
            <polygon points="170,45 265,85 265,200 170,270 170,45" fill="#151A25" />
          </g>
        )}
        
        {/* Hexagon Frame for Champion */}
        {tier === 'Champion' && (
          <g>
            <polygon points="170,30 290,95 290,225 170,290 50,225 50,95" fill={steelLight} stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
            <polygon points="170,30 290,95 290,225 170,290 170,30" fill={steelDark} />
            <polygon points="170,45 275,102 275,215 170,270 65,215 65,102" fill="#0A0F1A" stroke={accentLight} strokeWidth="4" />
            <polygon points="170,45 275,102 275,215 170,270 170,45" fill="#1E0A0A" />
          </g>
        )}
        
        {/* Diamond/Grandmaster Aura */}
        {tier === 'Grandmaster' && (
          <g>
            <polygon points="170,10 320,160 170,310 20,160" fill={steelLight} stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
            <polygon points="170,10 320,160 170,310 170,10" fill={steelDark} />
            <polygon points="170,30 295,160 170,290 45,160" fill="#0A0515" stroke={accentLight} strokeWidth="5" />
            <polygon points="170,30 295,160 170,290 170,30" fill="#150505" />
          </g>
        )}
        
        {/* Core Glow */}
        <circle cx="170" cy="160" r="100" fill={`url(#gemCoreGlow-${tier})`} />
      </svg>

      {renderComposition()}

      {showSheen && !isGhost && (
        <div
          className="absolute inset-[8%] rounded-full pointer-events-none mix-blend-overlay overflow-hidden opacity-50"
          style={{ maskImage: 'radial-gradient(circle at center, black 65%, transparent 75%)', WebkitMaskImage: 'radial-gradient(circle at center, black 65%, transparent 75%)' }}
        >
          <div
            className="w-full h-full rounded-full"
            style={{
              background: 'conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(255,255,255,0.02) 40deg, rgba(255,255,255,0.6) 90deg, rgba(255,255,255,0.02) 140deg, transparent 180deg, rgba(255,255,255,0.4) 270deg, transparent 360deg)',
              animation: 'conicSheenRotate 6s linear infinite',
              willChange: 'transform',
            }}
          />
        </div>
      )}
    </div>
  );
}
