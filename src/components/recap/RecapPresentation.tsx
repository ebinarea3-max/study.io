"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RankCrestBadge } from '../common/RankCrestBadge';
import { RankTierName } from '../../lib/rankedSystem';
import Link from 'next/link';

interface RecapPresentationProps {
  totalSeconds: number;
  topSubject: string;
  topSubjectSeconds: number;
  rp: number;
  rankTitle: string;
  level: number;
  previousRank?: string | null;
  currentRank?: string | null;
  isFirstSeason?: boolean;
}

export default function RecapPresentation({
  totalSeconds,
  topSubject,
  topSubjectSeconds,
  rp,
  rankTitle,
  level,
  previousRank,
  currentRank,
  isFirstSeason
}: RecapPresentationProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [resetPhase, setResetPhase] = useState<'peak' | 'drop' | 'grind'>('peak');

  const totalHours = (totalSeconds / 3600).toFixed(1);
  const topSubjectHours = (topSubjectSeconds / 3600).toFixed(1);

  // Parse Rank Title (e.g. "BRONZE II" -> "Bronze", "II")
  const parseRank = (title: string) => {
    const parts = title.split(' ');
    const tierRaw = parts[0] || 'Bronze';
    const tier = (tierRaw.charAt(0).toUpperCase() + tierRaw.slice(1).toLowerCase()) as RankTierName;
    const division = parts[1] || '';
    return { tier, division };
  };

  const currentParsed = parseRank(rankTitle);
  const resetPrevParsed = previousRank ? parseRank(previousRank) : null;
  const resetCurrParsed = currentRank ? parseRank(currentRank) : currentParsed;

  React.useEffect(() => {
    // Automatically mark the recap as seen for this season as soon as they visit
    try {
      const currentSeason = new Date().toISOString().substring(0, 7);
      localStorage.setItem(`has_seen_recap_${currentSeason}`, 'true');
    } catch {}

    if (currentSlide === (isFirstSeason ? 2 : 3) || (currentSlide === 2 && !isFirstSeason)) {
      // If we are on the reset slide, trigger the sequence
      const dropTimer = setTimeout(() => {
        setResetPhase('drop');
      }, 2000);

      const grindTimer = setTimeout(() => {
        setResetPhase('grind');
      }, 2500);

      return () => {
        clearTimeout(dropTimer);
        clearTimeout(grindTimer);
      };
    }
  }, [currentSlide, isFirstSeason]);

  const slides = [
    // SLIDE 0: Welcome / Hook
    <motion.div
      key="slide0"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="flex flex-col items-center justify-center text-center space-y-8"
    >
      <motion.h2 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 1 }}
        className="text-2xl md:text-3xl font-hud text-slate-400 tracking-widest uppercase"
      >
        This season, you locked in for...
      </motion.h2>
      <motion.div 
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.5, type: "spring", bounce: 0.4, duration: 1.2 }}
        className="text-7xl md:text-9xl font-black font-hud text-transparent bg-clip-text bg-gradient-to-br from-amber-200 to-amber-600 drop-shadow-[0_0_40px_rgba(217,119,6,0.5)]"
      >
        {totalHours} <span className="text-4xl md:text-6xl">HRS</span>
      </motion.div>
    </motion.div>,

    // SLIDE 1: Top Subject
    <motion.div
      key="slide1"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 0.6 }}
      className="flex flex-col items-center justify-center text-center space-y-6"
    >
      <h2 className="text-xl md:text-2xl font-hud text-slate-400 tracking-widest uppercase">
        Your ultimate focus was
      </h2>
      <div className="text-5xl md:text-7xl font-bold font-hud text-white drop-shadow-lg">
        {topSubject}
      </div>
      <div className="text-2xl md:text-3xl font-hud text-amber-400 mt-4">
        {topSubjectHours} HRS
      </div>
    </motion.div>,

    // SLIDE 2: The Rank (Only shown if isFirstSeason)
    ...(isFirstSeason ? [
      <motion.div
        key="slide2_first"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8 }}
        className="flex flex-col items-center justify-center text-center space-y-12"
      >
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl md:text-3xl font-hud text-slate-400 tracking-widest uppercase"
        >
          You reached...
        </motion.h2>

        <motion.div
          initial={{ scale: 0, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", bounce: 0.5, duration: 1.5, delay: 0.8 }}
          className="relative"
        >
          {/* Glow behind badge */}
          <div className="absolute inset-0 bg-amber-500/20 blur-[100px] rounded-full" />
          <RankCrestBadge tier={currentParsed.tier} division={currentParsed.division} size={240} className="relative z-10" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
          className="flex flex-col items-center space-y-2"
        >
          <div className="text-4xl md:text-5xl font-black font-hud text-white tracking-widest uppercase text-shadow-lg">
            {rankTitle}
          </div>
          <div className="text-xl text-amber-400 font-bold font-hud uppercase tracking-wider">
            {rp} RP
          </div>
        </motion.div>
      </motion.div>
    ] : [
      // SLIDE 2 (Not First Season): The Reset Animation
      <motion.div
        key="slide2_reset"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8 }}
        className="flex flex-col items-center justify-center text-center space-y-12"
      >
        <div className="h-16 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {resetPhase === 'peak' && (
              <motion.h2 
                key="text-peak"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-2xl md:text-3xl font-hud text-slate-400 tracking-widest uppercase absolute"
              >
                You ended the season at
              </motion.h2>
            )}
            {resetPhase === 'grind' && (
              <motion.h2 
                key="text-grind"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl md:text-3xl font-hud text-amber-400 tracking-widest uppercase absolute"
              >
                The reset is here. You start at
              </motion.h2>
            )}
          </AnimatePresence>
        </div>

        <div className="relative h-[300px] flex items-center justify-center">
          <AnimatePresence mode="popLayout">
            {(resetPhase === 'peak' || resetPhase === 'drop') && resetPrevParsed && (
              <motion.div
                key="badge-prev"
                initial={{ scale: 0, rotate: -15 }}
                animate={resetPhase === 'peak' ? { scale: 1, rotate: 0 } : { scale: 0.5, rotate: 15, opacity: 0, filter: "blur(10px)" }}
                transition={resetPhase === 'peak' ? { type: "spring", bounce: 0.5, duration: 1.5, delay: 0.3 } : { duration: 0.5 }}
                className="absolute z-10"
              >
                <RankCrestBadge tier={resetPrevParsed.tier} division={resetPrevParsed.division} size={240} />
              </motion.div>
            )}
            
            {resetPhase === 'grind' && (
              <motion.div
                key="badge-new"
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", bounce: 0.6, duration: 1.5 }}
                className="absolute z-20"
              >
                <div className="absolute inset-0 bg-red-500/20 blur-[100px] rounded-full" />
                <RankCrestBadge tier={resetCurrParsed.tier} division={resetCurrParsed.division} size={240} className="relative z-10" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="h-16 flex items-center justify-center">
          <AnimatePresence mode="wait">
             {resetPhase === 'peak' && (
                <motion.div 
                  key="title-prev"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: 0.8 }}
                  className="text-4xl md:text-5xl font-black font-hud text-white tracking-widest uppercase text-shadow-lg absolute"
                >
                  {previousRank}
                </motion.div>
             )}
             {resetPhase === 'grind' && (
                <motion.div 
                  key="title-new"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-4xl md:text-5xl font-black font-hud text-white tracking-widest uppercase text-shadow-lg absolute"
                >
                  {currentRank}
                </motion.div>
             )}
          </AnimatePresence>
        </div>
      </motion.div>
    ])
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-[#07090e] text-slate-100 relative overflow-hidden cursor-pointer selection:bg-amber-500/30 selection:text-amber-400"
      onClick={handleNext}
    >
      {/* Background Ambience matches the app */}
      <div className="fixed inset-0 pointer-events-none bg-dot-grid z-0" />
      <div className="fixed inset-0 pointer-events-none bg-hud-grid opacity-[0.03] z-0" />
      <div className="absolute inset-0 bg-gradient-to-t from-amber-900/10 via-transparent to-transparent pointer-events-none" />

      {/* Slide Content */}
      <div className="relative z-10 w-full max-w-4xl px-4 flex flex-col items-center justify-center min-h-[60vh]">
        <AnimatePresence mode="wait">
          {slides[currentSlide]}
        </AnimatePresence>
      </div>

      {/* Tap to continue overlay / indicators */}
      <div className="absolute top-8 left-0 w-full px-4 flex justify-center gap-2 z-20 pointer-events-none">
        {slides.map((_, i) => (
          <div 
            key={i} 
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === currentSlide ? 'w-12 bg-white' : i < currentSlide ? 'w-8 bg-white/50' : 'w-8 bg-white/20'
            }`} 
          />
        ))}
      </div>
      
      {currentSlide < slides.length - 1 && (
        <div className="absolute bottom-12 left-0 w-full text-center text-slate-500 font-hud tracking-widest text-sm animate-pulse pointer-events-none z-20">
          TAP TO CONTINUE
        </div>
      )}

      {currentSlide === slides.length - 1 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: isFirstSeason ? 2.5 : 4.0 }}
          className="absolute bottom-12 left-0 w-full text-center z-30 flex justify-center"
        >
          <Link 
            href="/"
            onClick={(e) => e.stopPropagation()}
            className="inline-block px-10 py-5 bg-amber-500 hover:bg-amber-400 rounded-xl text-black font-hud font-bold tracking-widest transition-all shadow-lg shadow-amber-500/20 active:scale-95"
          >
            {isFirstSeason ? "RETURN TO DASHBOARD" : "START THE GRIND"}
          </Link>
        </motion.div>
      )}
    </div>
  );
}
