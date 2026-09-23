import React from 'react';
import { Flame, Coffee, Zap, Hand, Target, Dumbbell, Sparkles } from 'lucide-react';

interface CheerIconProps {
  id: string;
  className?: string;
}

export function CheerIcon({ id, className = '' }: CheerIconProps) {
  switch (id) {
    case 'flame':
    case '🔥':
      return <Flame className={className} />;
    case 'coffee':
    case '☕':
      return <Coffee className={className} />;
    case 'zap':
    case '⚡':
      return <Zap className={className} />;
    case 'clap':
    case '👏':
      return <Hand className={className} />;
    case 'target':
    case '🎯':
      return <Target className={className} />;
    case 'muscle':
    case '💪':
      return <Dumbbell className={className} />;
    case 'power':
    case '✨':
      return <Sparkles className={className} />;
    default:
      // Fallback
      return <Flame className={className} />;
  }
}
