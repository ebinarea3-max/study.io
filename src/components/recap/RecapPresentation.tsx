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
}

export default function RecapPresentation({
  totalSeconds,
  topSubject,
  topSubjectSeconds,
  rp,
  rankTitle,
  level
}: RecapPresentationProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const totalHours = (totalSeconds / 3600).toFixed(1);
  const topSubjectHours = (topSubjectSeconds / 3600).toFixed(1);

  // Parse Rank Title (e.g. "BRONZE II" -> "Bronze", "II")
  const parts = rankTitle.split(' ');
  const tierRaw = parts[0];
  const tier = (tierRaw.charAt(0).toUpperCase() + tierRaw.slice(1).toLowerCase()) as RankTierName;
  const division = parts[1] || '';

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

    // SLIDE 2: The Rank
    <motion.div
      key="slide2"
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
        <RankCrestBadge tier={tier} division={division} size={240} className="relative z-10" />
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
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-black text-white relative overflow-hidden cursor-pointer selection:bg-transparent"
      onClick={handleNext}
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-dot-grid opacity-20 pointer-events-none" />
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
          transition={{ delay: 2.5 }}
          className="absolute bottom-12 left-0 w-full text-center z-30"
        >
          <Link 
            href="/"
            onClick={(e) => e.stopPropagation()}
            className="inline-block px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl text-white font-hud font-bold tracking-wider transition-colors border border-white/10"
          >
            RETURN TO DASHBOARD
          </Link>
        </motion.div>
      )}
    </div>
  );
}
