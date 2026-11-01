'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toPng } from 'html-to-image';
import { toast } from 'react-hot-toast';
import {
  Download,
  Share2,
  Lock,
  Sparkles,
  Clock,
  Calendar,
  BookOpen,
  RefreshCw,
} from 'lucide-react';
import { usePremium } from '../../context/PremiumContext';
import { RankTierName, getRankBadgePath } from '../../lib/rankedSystem';
import { formatHoursAndMins } from '../../lib/utils';
import { Logo } from '../Logo';

export type SeasonCardStyle = 'dark' | 'gold' | 'theme';

export interface SeasonShareCardProps {
  seasonKey: string;
  seasonDisplayName: string;
  totalSeconds: number;
  activeDays: number;
  topSubject: string;
  previousRank: string | null;
  currentRank: string;
  username?: string;
  isFirstSeason?: boolean;
  // Overrides for dev tool
  forcePremium?: boolean;
  forceLocked?: boolean;
  onUnlockClick?: () => void;
}

// Parse Rank Title (e.g. "PLATINUM I" -> { tier: "Platinum", division: "I" })
function parseRank(title?: string | null): { tier: RankTierName; division: string } {
  if (!title) return { tier: 'Bronze', division: 'I' };
  const parts = title.trim().split(/\s+/);
  const rawTier = parts[0] || 'Bronze';
  const tier = (rawTier.charAt(0).toUpperCase() + rawTier.slice(1).toLowerCase()) as RankTierName;
  const rawDivision = parts[1] || '';
  const divMap: Record<string, string> = { '1': 'I', '2': 'II', '3': 'III', '4': 'IV' };
  const division = divMap[rawDivision] || rawDivision.toUpperCase();
  return { tier, division };
}

function getTierAccent(tier: RankTierName): string {
  switch (tier) {
    case 'Bronze': return '#f59e0b';
    case 'Silver': return '#cbd5e1';
    case 'Gold': return '#fbbf24';
    case 'Platinum': return '#22d3ee';
    case 'Diamond': return '#c084fc';
    case 'Champion': return '#f472b6';
    case 'Master': return '#818cf8';
    case 'Grandmaster': return '#f87171';
    default: return '#f59e0b';
  }
}

/**
 * The pure 1080x1920 Season Card Canvas
 * Rendered at exact 1080x1920 resolution for export, and scaled via CSS transform for on-screen preview.
 * (Unchanged template and export logic to preserve exact export fidelity)
 */
function SeasonCardCanvas({
  cardStyle,
  seasonDisplayName,
  seasonKey,
  totalSeconds,
  activeDays,
  topSubject,
  previousRank,
  currentRank,
  username,
  isFirstSeason,
}: {
  cardStyle: SeasonCardStyle;
  seasonDisplayName: string;
  seasonKey: string;
  totalSeconds: number;
  activeDays: number;
  topSubject: string;
  previousRank: string | null;
  currentRank: string;
  username?: string;
  isFirstSeason?: boolean;
}) {
  const currParsed = parseRank(currentRank);
  const prevParsed = previousRank ? parseRank(previousRank) : null;
  const tierAccent = getTierAccent(currParsed.tier);

  const prevBadgePath = previousRank ? getRankBadgePath(previousRank) : null;
  const currBadgePath = getRankBadgePath(currentRank);

  // Compute theme colors based on selected card style
  const isGold = cardStyle === 'gold';
  const isTheme = cardStyle === 'theme';

  const bgColor = isGold ? '#0E0B04' : isTheme ? '#050811' : '#0B0C0E';
  const primaryAccent = isGold ? '#E6C15A' : isTheme ? tierAccent : '#FFFFFF';
  const borderColor = isGold
    ? 'rgba(230, 193, 90, 0.35)'
    : isTheme
    ? `${tierAccent}55`
    : 'rgba(255, 255, 255, 0.12)';
  const boxBg = isGold
    ? 'rgba(230, 193, 90, 0.04)'
    : isTheme
    ? 'rgba(255, 255, 255, 0.03)'
    : 'rgba(255, 255, 255, 0.025)';
  const glowColor = isGold
    ? 'rgba(230, 193, 90, 0.25)'
    : isTheme
    ? `${tierAccent}40`
    : 'rgba(255, 255, 255, 0.08)';

  const formattedHours = (totalSeconds / 3600).toFixed(1);
  const displayName = (username || 'Scholar').toUpperCase();
  const handle = (username || 'scholar').toLowerCase().replace(/\s+/g, '_');

  return (
    <div
      style={{
        width: 1080,
        height: 1920,
        backgroundColor: bgColor,
        borderColor: borderColor,
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
      className="relative flex flex-col justify-between p-16 border-[16px] overflow-hidden select-none"
    >
      {/* Ambient background glows */}
      <div
        className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-[140px] pointer-events-none opacity-40"
        style={{ backgroundColor: glowColor }}
      />
      <div
        className="absolute top-1/2 -right-40 w-[650px] h-[650px] rounded-full blur-[160px] pointer-events-none opacity-30"
        style={{ backgroundColor: glowColor }}
      />
      <div
        className="absolute -bottom-40 left-1/3 w-[550px] h-[550px] rounded-full blur-[140px] pointer-events-none opacity-35"
        style={{ backgroundColor: glowColor }}
      />

      {/* Subtle geometric grid background */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
          backgroundSize: '72px 72px',
        }}
      />

      {/* ══════════════════════════════════════════════════════════ */}
      {/* 1. TOP BAR: BRAND & SEASON BADGE                           */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div className="relative z-10 flex items-center justify-between pb-8 border-b" style={{ borderColor }}>
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center">
            <Logo className="w-14 h-14" />
          </div>
          <div>
            <div className="text-3xl font-hud font-extrabold tracking-wider text-white flex items-center gap-2">
              <span>STUDY.IO</span>
              <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: primaryAccent }} />
            </div>
            <div className="text-xs font-mono tracking-widest uppercase text-white/50">
              Verified Focus Architecture
            </div>
          </div>
        </div>

        <div
          className="px-6 py-2.5 rounded-full border text-sm font-mono font-bold tracking-widest uppercase flex items-center gap-2.5 shadow-sm"
          style={{
            borderColor,
            backgroundColor: boxBg,
            color: isGold ? '#F5E6A8' : '#FFFFFF',
          }}
        >
          <Sparkles className="w-4 h-4" style={{ color: primaryAccent }} />
          <span>{seasonDisplayName || 'SEASON RECAP'}</span>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* 2. USER IDENTITY HERO                                      */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div className="relative z-10 pt-4">
        <div className="text-sm font-mono tracking-widest uppercase text-white/50 mb-2">
          Scholar Dossier · Season Archive
        </div>
        <h1
          className="text-6xl font-black tracking-wider uppercase truncate"
          style={{
            color: '#FFFFFF',
            textShadow: isGold ? '0 0 24px rgba(230, 193, 90, 0.4)' : undefined,
          }}
        >
          {displayName}
        </h1>
        <div className="text-xl font-mono tracking-wide mt-2" style={{ color: primaryAccent }}>
          @{handle}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* 3. CENTRAL RANK PROGRESSION HERO                           */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div
        className="relative z-10 p-10 rounded-[36px] border flex flex-col items-center justify-center shadow-2xl overflow-hidden"
        style={{
          borderColor,
          backgroundColor: boxBg,
        }}
      >
        <div
          className="text-xs font-mono tracking-widest font-bold uppercase px-5 py-1.5 rounded-full border mb-8"
          style={{
            borderColor,
            color: primaryAccent,
            backgroundColor: 'rgba(0,0,0,0.4)',
          }}
        >
          {isFirstSeason ? 'FIRST SEASON RANK REVEAL' : 'SEASONAL RANK RESET & SETTLEMENT'}
        </div>

        {/* Previous Rank vs Current Rank */}
        <div className="flex items-center justify-around w-full gap-8">
          {prevParsed && prevBadgePath && !isFirstSeason ? (
            <>
              {/* Previous Rank */}
              <div className="flex flex-col items-center text-center opacity-70">
                <div className="w-[200px] h-[200px] flex items-center justify-center relative mb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={prevBadgePath}
                    alt={previousRank || 'Previous Rank'}
                    className="max-w-full max-h-full object-contain filter drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]"
                  />
                </div>
                <div className="text-sm font-mono uppercase text-white/50 tracking-wider">
                  Previous Division
                </div>
                <div className="text-2xl font-black uppercase text-white/80 tracking-wide mt-1">
                  {previousRank}
                </div>
              </div>

              {/* Transition Divider Arrow */}
              <div className="flex flex-col items-center justify-center px-4">
                <div className="text-5xl font-black" style={{ color: primaryAccent }}>
                  ➔
                </div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-white/40 mt-1">
                  Reset
                </span>
              </div>
            </>
          ) : null}

          {/* Current Settled Rank (Hero) */}
          <div className="flex flex-col items-center text-center">
            <div className="w-[260px] h-[260px] flex items-center justify-center relative mb-4">
              <div
                className="absolute inset-0 rounded-full blur-3xl opacity-60"
                style={{ backgroundColor: tierAccent }}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currBadgePath}
                alt={currentRank}
                className="max-w-full max-h-full object-contain relative z-10 filter drop-shadow-[0_8px_32px_rgba(0,0,0,0.9)]"
              />
            </div>
            <div className="text-sm font-mono uppercase tracking-wider font-bold" style={{ color: primaryAccent }}>
              {isFirstSeason ? 'Inaugural Placement' : 'Settled Season Rank'}
            </div>
            <div className="text-4xl font-black uppercase text-white tracking-widest mt-1">
              {currentRank}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* 4. KEY TELEMETRY 2x2 MATRIX                                */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div className="relative z-10 grid grid-cols-2 gap-6">
        {/* Cell 1: Total Focus */}
        <div
          className="p-8 rounded-[28px] border flex flex-col justify-between"
          style={{ borderColor, backgroundColor: boxBg }}
        >
          <div className="flex items-center justify-between text-white/60 mb-3">
            <span className="text-sm font-mono uppercase tracking-widest">Total Focus</span>
            <Clock className="w-6 h-6" style={{ color: primaryAccent }} />
          </div>
          <div className="text-5xl font-black text-white tracking-tight">
            {formattedHours} <span className="text-2xl font-normal text-white/60">hrs</span>
          </div>
          <div className="text-xs font-mono text-white/40 mt-2">
            Verified study sessions logged
          </div>
        </div>

        {/* Cell 2: Active Days */}
        <div
          className="p-8 rounded-[28px] border flex flex-col justify-between"
          style={{ borderColor, backgroundColor: boxBg }}
        >
          <div className="flex items-center justify-between text-white/60 mb-3">
            <span className="text-sm font-mono uppercase tracking-widest">Active Days</span>
            <Calendar className="w-6 h-6" style={{ color: primaryAccent }} />
          </div>
          <div className="text-5xl font-black text-white tracking-tight">
            {activeDays} <span className="text-2xl font-normal text-white/60">days</span>
          </div>
          <div className="text-xs font-mono text-white/40 mt-2">
            Monthly consistency record
          </div>
        </div>

        {/* Cell 3: Top Subject */}
        <div
          className="p-8 rounded-[28px] border flex flex-col justify-between"
          style={{ borderColor, backgroundColor: boxBg }}
        >
          <div className="flex items-center justify-between text-white/60 mb-3">
            <span className="text-sm font-mono uppercase tracking-widest">Top Subject</span>
            <BookOpen className="w-6 h-6" style={{ color: primaryAccent }} />
          </div>
          <div className="text-3xl font-black text-white tracking-wide truncate">
            {topSubject || 'General Study'}
          </div>
          <div className="text-xs font-mono text-white/40 mt-2">
            Dominant discipline this season
          </div>
        </div>

        {/* Cell 4: Performance Tier */}
        <div
          className="p-8 rounded-[28px] border flex flex-col justify-between"
          style={{ borderColor, backgroundColor: boxBg }}
        >
          <div className="flex items-center justify-between text-white/60 mb-3">
            <span className="text-sm font-mono uppercase tracking-widest">Season Standing</span>
            <Sparkles className="w-6 h-6" style={{ color: primaryAccent }} />
          </div>
          <div className="text-3xl font-black text-white tracking-wide">
            {currParsed.tier.toUpperCase()} TIER
          </div>
          <div className="text-xs font-mono text-white/40 mt-2">
            Competitive ladder settlement
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* 5. FOOTER: VERIFICATION BARCODE & APP URL                  */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div className="relative z-10 flex items-center justify-between pt-8 border-t" style={{ borderColor }}>
        <div className="flex items-center gap-3">
          <div className="text-sm font-mono tracking-widest uppercase text-white/60 font-bold">
            ARCHIVE · {seasonKey || 'MONTHLY'}
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
          <div className="text-xs font-mono text-white/40">
            CRYPTOGRAPHIC PROOF OF WORK
          </div>
        </div>

        <div className="text-sm font-mono tracking-widest text-white/60 font-bold">
          STUDY-IO-XI.VERCEL.APP
        </div>
      </div>
    </div>
  );
}

export function SeasonShareCard({
  seasonKey,
  seasonDisplayName,
  totalSeconds,
  activeDays,
  topSubject,
  previousRank,
  currentRank,
  username,
  isFirstSeason,
  forcePremium,
  forceLocked,
  onUnlockClick,
}: SeasonShareCardProps) {
  const { isPremium: contextPremium, openPremiumModal } = usePremium();
  const isPremium = forceLocked ? false : forcePremium !== undefined ? forcePremium : contextPremium;

  const [cardStyle, setCardStyle] = useState<SeasonCardStyle>('gold');
  const [isExporting, setIsExporting] = useState(false);

  // Hidden 1080x1920 export target container
  const exportTargetRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.26);

  // Compute responsive preview scale to fit neatly in on-screen cards without scroll
  useEffect(() => {
    const updateScale = () => {
      if (previewContainerRef.current) {
        const containerWidth = previewContainerRef.current.clientWidth;
        const containerHeight = previewContainerRef.current.clientHeight;
        const scaleByWidth = containerWidth / 1080;
        const scaleByHeight = containerHeight > 0 ? containerHeight / 1920 : scaleByWidth;
        const computedScale = Math.min(scaleByWidth, scaleByHeight);
        setScale(Math.max(0.18, computedScale));
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  // Pre-load all images inside the node and inline to base64 Data URLs to prevent blank export
  const ensureImagesLoadedAndInlined = async (container: HTMLElement) => {
    const images = Array.from(container.querySelectorAll('img'));
    await Promise.all(
      images.map(async (img) => {
        await new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
          } else {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          }
        });

        // Inline to base64 data URL so html-to-image never makes network/CORS calls
        if (img.src && !img.src.startsWith('data:')) {
          try {
            const res = await fetch(img.src);
            if (res.ok) {
              const blob = await res.blob();
              const reader = new FileReader();
              await new Promise<void>((r) => {
                reader.onloadend = () => {
                  if (typeof reader.result === 'string') {
                    img.src = reader.result;
                  }
                  r();
                };
                reader.readAsDataURL(blob);
              });
            }
          } catch (e) {
            console.warn('[SeasonShareCard] Could not inline image via fetch:', img.src, e);
          }
        }
      })
    );
  };

  const generateCardDataUrl = useCallback(async (): Promise<string> => {
    if (!exportTargetRef.current) return '';
    await ensureImagesLoadedAndInlined(exportTargetRef.current);

    let dataUrl = '';
    try {
      dataUrl = await toPng(exportTargetRef.current, {
        cacheBust: false,
        pixelRatio: 1, // exact 1080x1920 resolution
        width: 1080,
        height: 1920,
        style: {
          position: 'relative',
          left: '0px',
          top: '0px',
          margin: '0px',
          transform: 'none',
          opacity: '1',
          visibility: 'visible',
        },
        skipFonts: true,
      });
    } catch (err) {
      console.warn('[SeasonShareCard] Offscreen export attempt error:', err);
    }

    // High quality fallback: if offscreen returned empty (<5000 chars), capture preview container
    if ((!dataUrl || dataUrl.length < 5000) && previewContainerRef.current) {
      try {
        dataUrl = await toPng(previewContainerRef.current, {
          pixelRatio: 3,
          skipFonts: true,
        });
      } catch (fallbackErr) {
        console.warn('[SeasonShareCard] Preview fallback error:', fallbackErr);
      }
    }

    return dataUrl;
  }, []);

  // 1. Download image handler
  const handleDownload = useCallback(async () => {
    if (!isPremium) {
      if (onUnlockClick) onUnlockClick();
      else openPremiumModal();
      return;
    }

    if (!exportTargetRef.current) return;
    setIsExporting(true);

    try {
      const dataUrl = await generateCardDataUrl();

      if (!dataUrl || dataUrl.length < 1000) {
        throw new Error('Canvas generated empty image');
      }

      const fileName = `study-io-${seasonKey || 'season'}-card.png`;
      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Season card downloaded!', {
        icon: '📥',
        style: {
          background: 'var(--surface)',
          color: 'var(--text)',
          border: '1px solid var(--border)',
        },
      });
    } catch (err) {
      console.error('Failed to export season card:', err);
      toast.error('Could not generate season card image. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [isPremium, onUnlockClick, openPremiumModal, seasonKey, generateCardDataUrl]);

  // 2. Web Share API handler
  const handleShare = useCallback(async () => {
    if (!isPremium) {
      if (onUnlockClick) onUnlockClick();
      else openPremiumModal();
      return;
    }

    if (!exportTargetRef.current) return;
    setIsExporting(true);

    try {
      const dataUrl = await generateCardDataUrl();

      if (!dataUrl || dataUrl.length < 1000) {
        throw new Error('Canvas generated empty image');
      }

      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], `study-io-${seasonKey || 'season'}-card.png`, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Study.io - ${seasonDisplayName}`,
          text: `My verified season performance on study.io: ${formatHoursAndMins(totalSeconds)} logged.`,
        });
      } else {
        handleDownload();
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Failed to share season card:', err);
        handleDownload();
      }
    } finally {
      setIsExporting(false);
    }
  }, [isPremium, onUnlockClick, openPremiumModal, seasonKey, seasonDisplayName, totalSeconds, handleDownload, generateCardDataUrl]);

  const canWebShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  return (
    <div className="w-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
      {/* ══════════════════════════════════════════════════════════ */}
      {/* OFF-SCREEN 1080x1920 EXPORT TARGET CONTAINER              */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          width: 1080,
          height: 1920,
          opacity: 0.001,
          pointerEvents: 'none',
          zIndex: -9999,
          overflow: 'hidden',
        }}
      >
        <div
          ref={exportTargetRef}
          style={{
            position: 'relative',
            left: 0,
            top: 0,
            width: 1080,
            height: 1920,
            margin: 0,
            padding: 0,
            backgroundColor: '#0B0C0E',
          }}
        >
          <SeasonCardCanvas
            cardStyle={cardStyle}
            seasonDisplayName={seasonDisplayName}
            seasonKey={seasonKey}
            totalSeconds={totalSeconds}
            activeDays={activeDays}
            topSubject={topSubject}
            previousRank={previousRank}
            currentRank={currentRank}
            username={username}
            isFirstSeason={isFirstSeason}
          />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* ON-SCREEN SCALED 9:16 PREVIEW                              */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div className="relative w-full max-w-[320px] sm:max-w-[340px] flex flex-col items-center">
        {/* Style Switcher: ONE row, sliding highlight with display labels */}
        {isPremium && (
          <div className="w-full flex items-center justify-center p-1 mb-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] relative">
            {(
              [
                { id: 'gold', label: 'Gold' },
                { id: 'dark', label: 'Dark' },
                { id: 'theme', label: 'My theme' },
              ] as const
            ).map((styleOpt) => {
              const isSelected = cardStyle === styleOpt.id;
              return (
                <button
                  key={styleOpt.id}
                  type="button"
                  onClick={() => setCardStyle(styleOpt.id)}
                  className={`relative flex-1 py-1.5 px-3 rounded-lg text-xs font-mono font-medium tracking-wide transition-colors cursor-pointer text-center z-10 ${
                    isSelected ? 'text-[var(--text)]' : 'text-[var(--text-dim)] hover:text-[var(--text)]'
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="cardStyleHighlight"
                      transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
                      className="absolute inset-0 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg shadow-sm -z-10"
                    />
                  )}
                  <span>{styleOpt.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Scaled Preview Frame: max-height at most calc(100vh - 340px) (max 560px) */}
        <div
          ref={previewContainerRef}
          className="relative w-full aspect-[9/16] overflow-hidden rounded-2xl shadow-card border border-[var(--border)] bg-[var(--surface)] flex items-center justify-center"
          style={{ maxHeight: 'min(calc(100vh - 340px), 560px)' }}
        >
          {/* Scaled Twin of the Card Canvas */}
          <div
            className={`w-[1080px] h-[1920px] origin-top-left pointer-events-none transition-filter duration-300 ${
              !isPremium ? 'blur-md opacity-40' : ''
            }`}
            style={{
              transform: `scale(${scale})`,
            }}
          >
            <SeasonCardCanvas
              cardStyle={cardStyle}
              seasonDisplayName={seasonDisplayName}
              seasonKey={seasonKey}
              totalSeconds={totalSeconds}
              activeDays={activeDays}
              topSubject={topSubject}
              previousRank={previousRank}
              currentRank={currentRank}
              username={username}
              isFirstSeason={isFirstSeason}
            />
          </div>

          {/* Locked State Overlay for Free Users */}
          {!isPremium && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-black/75 backdrop-blur-md z-20">
              <div className="w-11 h-11 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)] mb-3 shadow-sm">
                <Lock className="w-5 h-5 stroke-[1.8]" />
              </div>

              <h3 className="text-base font-bold font-hud text-[var(--text)] uppercase tracking-wider mb-1">
                Save your season card
              </h3>

              <p className="text-xs text-[var(--text-dim)] font-sans max-w-[220px] mb-4 leading-relaxed">
                Export 9:16 vertical story cards with your rank badges, verified hours, and custom frame styles.
              </p>

              <button
                type="button"
                onClick={() => {
                  if (onUnlockClick) onUnlockClick();
                  else openPremiumModal();
                }}
                className="w-full py-2.5 px-4 rounded-xl font-hud font-bold text-xs uppercase tracking-wider transition-all active:scale-95 shadow-sm flex items-center justify-center gap-2 cursor-pointer hover:brightness-110"
                style={{
                  backgroundColor: 'var(--accent, #ffffff)',
                  color: 'var(--accent-contrast, #08090C)',
                }}
              >
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                <span>Unlock with Premium</span>
              </button>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* ACTION BUTTONS (DOWNLOAD & SHARE)                          */}
        {/* ══════════════════════════════════════════════════════════ */}
        {isPremium && (
          <div className="w-full flex items-center gap-2 mt-3">
            <button
              type="button"
              onClick={handleDownload}
              disabled={isExporting}
              className="flex-1 py-3 px-4 rounded-xl font-hud font-bold text-xs tracking-wider uppercase transition-all active:scale-95 shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 hover:brightness-110"
              style={{
                backgroundColor: 'var(--accent, #ffffff)',
                color: 'var(--accent-contrast, #08090C)',
              }}
            >
              {isExporting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 stroke-[2.2]" />
                  <span>Download image</span>
                </>
              )}
            </button>

            {canWebShare && (
              <button
                type="button"
                onClick={handleShare}
                disabled={isExporting}
                className="py-3 px-4 bg-[var(--surface)] hover:bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] font-hud font-bold text-xs tracking-wider uppercase rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                title="Share to Stories or Apps"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
