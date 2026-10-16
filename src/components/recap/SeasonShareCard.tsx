'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { toPng } from 'html-to-image';
import { toast } from 'react-hot-toast';
import {
  Download,
  Share2,
  Lock,
  Sparkles,
  Check,
  Trophy,
  Clock,
  Calendar,
  BookOpen,
  ShieldCheck,
  Star,
  RefreshCw,
} from 'lucide-react';
import { usePremium } from '../../context/PremiumContext';
import { RankTierName, getRankBadgePath } from '../../lib/rankedSystem';
import { formatHoursAndMins } from '../../lib/utils';

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
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg"
            style={{
              backgroundColor: isGold ? '#E6C15A' : isTheme ? tierAccent : '#FFFFFF',
              color: '#000000',
            }}
          >
            S
          </div>
          <div>
            <div className="text-3xl font-black tracking-widest text-white flex items-center gap-2">
              <span>study.io</span>
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
          backdropFilter: 'blur(20px)',
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
                    crossOrigin="anonymous"
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
                crossOrigin="anonymous"
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

        {/* Cell 4: Verified Status */}
        <div
          className="p-8 rounded-[28px] border flex flex-col justify-between"
          style={{ borderColor, backgroundColor: boxBg }}
        >
          <div className="flex items-center justify-between text-white/60 mb-3">
            <span className="text-sm font-mono uppercase tracking-widest">Scholar Standing</span>
            <ShieldCheck className="w-6 h-6" style={{ color: primaryAccent }} />
          </div>
          <div
            className="text-3xl font-black tracking-wide uppercase"
            style={{ color: isGold ? '#F5E6A8' : primaryAccent }}
          >
            VERIFIED PRO
          </div>
          <div className="text-xs font-mono text-white/40 mt-2">
            study.io authentic telemetry
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* 5. FOOTER WATERMARK                                        */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div className="relative z-10 flex items-center justify-between pt-6 border-t" style={{ borderColor }}>
        <div className="text-sm font-mono uppercase tracking-widest text-white/50 flex items-center gap-2">
          <span>VERIFIED TELEMETRY</span>
          <span>·</span>
          <span>APP.STUDY.IO</span>
        </div>
        <div className="text-xs font-mono uppercase tracking-widest text-white/40">
          SEASON KEY: {seasonKey}
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
  isFirstSeason = false,
  forcePremium,
  forceLocked,
  onUnlockClick,
}: SeasonShareCardProps) {
  const { isPremium: contextPremium, openPremiumModal } = usePremium();
  const isPremium = forceLocked ? false : forcePremium !== undefined ? forcePremium : contextPremium;

  const [cardStyle, setCardStyle] = useState<SeasonCardStyle>('gold');
  const [isExporting, setIsExporting] = useState(false);
  const [hasShared, setHasShared] = useState(false);

  // Hidden 1080x1920 export target container
  const exportTargetRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.28);

  // Compute responsive preview scale to fit neatly in on-screen cards
  useEffect(() => {
    const updateScale = () => {
      if (previewContainerRef.current) {
        const containerWidth = previewContainerRef.current.clientWidth;
        // Target 1080px width
        const computedScale = Math.min(0.35, Math.max(0.22, containerWidth / 1080));
        setScale(computedScale);
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  // Pre-load all images inside the node to prevent blank crests in canvas export
  const ensureImagesLoaded = async (container: HTMLElement) => {
    const images = Array.from(container.querySelectorAll('img'));
    await Promise.all(
      images.map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) {
              resolve();
            } else {
              img.onload = () => resolve();
              img.onerror = () => resolve(); // don't fail completely
            }
          })
      )
    );
  };

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
      await ensureImagesLoaded(exportTargetRef.current);

      const dataUrl = await toPng(exportTargetRef.current, {
        cacheBust: true,
        pixelRatio: 1, // exact 1080x1920 resolution
        width: 1080,
        height: 1920,
      });

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
  }, [isPremium, onUnlockClick, openPremiumModal, seasonKey]);

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
      await ensureImagesLoaded(exportTargetRef.current);

      const dataUrl = await toPng(exportTargetRef.current, {
        cacheBust: true,
        pixelRatio: 1,
        width: 1080,
        height: 1920,
      });

      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const fileName = `study-io-${seasonKey || 'season'}-card.png`;
      const file = new File([blob], fileName, { type: 'image/png' });

      if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `study.io Season Card · ${seasonDisplayName}`,
          text: `Completed my ${seasonDisplayName} on study.io with ${(totalSeconds / 3600).toFixed(1)} focus hours!`,
          files: [file],
        });
        setHasShared(true);
      } else {
        // Fall back to direct download if file sharing not supported
        handleDownload();
      }
    } catch (err: any) {
      // Abort errors occur when user closes the native share modal, don't show error
      if (err?.name !== 'AbortError') {
        console.error('Failed to share season card:', err);
        toast.error('Sharing not supported on this browser. Downloading instead.');
        handleDownload();
      }
    } finally {
      setIsExporting(false);
    }
  }, [isPremium, onUnlockClick, openPremiumModal, seasonKey, seasonDisplayName, totalSeconds, handleDownload]);

  const canWebShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  return (
    <div className="w-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
      {/* ══════════════════════════════════════════════════════════ */}
      {/* OFF-SCREEN 1080x1920 EXPORT TARGET CONTAINER              */}
      {/* Rendered at full 1080x1920 for crystal clear export       */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div
        ref={exportTargetRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          width: 1080,
          height: 1920,
          zIndex: -999,
          pointerEvents: 'none',
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

      {/* ══════════════════════════════════════════════════════════ */}
      {/* ON-SCREEN SCALED 9:16 PREVIEW                              */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div className="relative w-full max-w-[340px] flex flex-col items-center">
        {/* Style Switcher Pill Bar (Premium Only) */}
        {isPremium && (
          <div className="w-full flex items-center justify-center gap-1.5 p-1 mb-4 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-md">
            <button
              type="button"
              onClick={() => setCardStyle('gold')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-hud font-bold tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                cardStyle === 'gold'
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Imperial Gold</span>
              {cardStyle === 'gold' && <Check className="w-3 h-3 ml-auto text-amber-300" />}
            </button>

            <button
              type="button"
              onClick={() => setCardStyle('dark')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-hud font-bold tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                cardStyle === 'dark'
                  ? 'bg-white/15 text-white border border-white/30 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-zinc-400" />
              <span>Obsidian</span>
              {cardStyle === 'dark' && <Check className="w-3 h-3 ml-auto text-white" />}
            </button>

            <button
              type="button"
              onClick={() => setCardStyle('theme')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-hud font-bold tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                cardStyle === 'theme'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>Theme Neon</span>
              {cardStyle === 'theme' && <Check className="w-3 h-3 ml-auto text-cyan-300" />}
            </button>
          </div>
        )}

        {/* Scaled Preview Frame */}
        <div
          ref={previewContainerRef}
          className="relative w-full aspect-[9/16] overflow-hidden rounded-3xl shadow-[0_16px_48px_rgba(0,0,0,0.8)] border border-white/15 bg-black"
          style={{ maxHeight: '540px' }}
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
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-black/70 backdrop-blur-md z-20">
              <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-300 mb-3 shadow-[0_0_24px_rgba(230,193,90,0.2)]">
                <Lock className="w-6 h-6 stroke-[2]" />
              </div>

              <div className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-white/[0.08] text-white/70 border border-white/10 mb-2 font-bold">
                Sample Preview · 1080x1920
              </div>

              <h3 className="text-lg font-black font-hud text-white uppercase tracking-wider mb-1">
                Save Your Season Card
              </h3>

              <p className="text-xs text-zinc-400 font-mono max-w-[240px] mb-5 leading-relaxed">
                Export crisp 9:16 vertical story cards with previous &amp; settled rank crests, verified hours, and custom frame styles.
              </p>

              <button
                type="button"
                onClick={() => {
                  if (onUnlockClick) onUnlockClick();
                  else openPremiumModal();
                }}
                className="w-full py-3 px-4 rounded-xl font-hud font-bold text-xs uppercase tracking-widest text-black bg-gradient-to-r from-[#F5E6A8] via-[#E6C15A] to-[#B8892B] hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(230,193,90,0.3)] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 fill-current" />
                <span>Unlock with Premium</span>
              </button>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* ACTION BUTTONS (DOWNLOAD & SHARE)                          */}
        {/* ══════════════════════════════════════════════════════════ */}
        {isPremium && (
          <div className="w-full flex items-center gap-2 mt-4">
            <button
              type="button"
              onClick={handleDownload}
              disabled={isExporting}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:brightness-110 text-black font-hud font-bold text-xs tracking-widest uppercase rounded-xl transition-all active:scale-95 shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  <span>Download Image</span>
                </>
              )}
            </button>

            {canWebShare && (
              <button
                type="button"
                onClick={handleShare}
                disabled={isExporting}
                className="py-3 px-4 bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 text-white font-hud font-bold text-xs tracking-widest uppercase rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                title="Share to Stories or Apps"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Share</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
