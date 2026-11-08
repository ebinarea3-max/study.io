'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useStudyMode } from '@/context/StudyModeContext';
import { useIntro } from '@/context/IntroContext';
import { StudyModeOnboarding } from './StudyModeOnboarding';

// Dynamic import for the intro walkthrough so it is only loaded on demand
const DynamicWelcomeIntro = dynamic(
  () => import('../intro/WelcomeIntro').then((mod) => mod.WelcomeIntro),
  { ssr: false }
);

export function OnboardingFlow() {
  const { needsOnboarding: needsStudyMode, loading: studyModeLoading } = useStudyMode();
  const { needsIntro, isReplayOpen, closeReplay } = useIntro();

  // Step 1: Study Mode Onboarding (unchanged)
  if (!studyModeLoading && needsStudyMode) {
    return <StudyModeOnboarding />;
  }

  // Step 2: First-time Welcome Intro Walkthrough (or Settings Replay)
  if (needsIntro || isReplayOpen) {
    return (
      <DynamicWelcomeIntro
        isOpen={true}
        isReplay={isReplayOpen}
        onClose={isReplayOpen ? closeReplay : undefined}
      />
    );
  }

  return null;
}
