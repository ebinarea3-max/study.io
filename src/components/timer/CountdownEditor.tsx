import React, { useState, useEffect, useRef, WheelEvent } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRankTheme } from '../../hooks/useRankTheme';

interface CountdownEditorProps {
  initialSeconds: number;
  onSave: (seconds: number) => void;
  onCancel: () => void;
}

export function CountdownEditor({ initialSeconds, onSave, onCancel }: CountdownEditorProps) {
  const [hours, setHours] = useState(Math.floor(initialSeconds / 3600));
  const [minutes, setMinutes] = useState(Math.floor((initialSeconds % 3600) / 60));
  const [seconds, setSeconds] = useState(initialSeconds % 60);

  const { theme } = useRankTheme();

  const [direction, setDirection] = useState<'up' | 'down'>('up');
  const containerRef = useRef<HTMLDivElement>(null);

  const stateRef = useRef({ hours, minutes, seconds });
  useEffect(() => {
    stateRef.current = { hours, minutes, seconds };
  }, [hours, minutes, seconds]);

  const propsRef = useRef({ onSave, onCancel });
  useEffect(() => {
    propsRef.current = { onSave, onCancel };
  }, [onSave, onCancel]);

  useEffect(() => {
    const handleClickOutside = (event: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        const { hours, minutes, seconds } = stateRef.current;
        const total = hours * 3600 + minutes * 60 + seconds;
        if (total > 0) {
          propsRef.current.onSave(total);
        } else {
          propsRef.current.onCancel();
        }
      }
    };
    document.addEventListener('pointerdown', handleClickOutside, true);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside, true);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        const { hours, minutes, seconds } = stateRef.current;
        const total = hours * 3600 + minutes * 60 + seconds;
        if (total > 0) {
          propsRef.current.onSave(total);
        } else {
          propsRef.current.onCancel();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, []);
  
  // Attach non-passive wheel listener to prevent body scroll natively
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    
    const preventScroll = (e: Event) => {
      e.preventDefault();
    };
    
    el.addEventListener('wheel', preventScroll, { passive: false });
    el.addEventListener('touchmove', preventScroll, { passive: false });
    return () => {
      el.removeEventListener('wheel', preventScroll);
      el.removeEventListener('touchmove', preventScroll);
    };
  }, []);

  const updateSegment = (segment: 'h' | 'm' | 's', increment: boolean) => {
    setDirection(increment ? 'up' : 'down');
    
    if (segment === 'h') {
      setHours(prev => Math.max(0, Math.min(99, prev + (increment ? 1 : -1))));
    } else if (segment === 'm') {
      setMinutes(prev => {
        let next = prev + (increment ? 1 : -1);
        if (next >= 60) next = 0;
        if (next < 0) next = 59;
        return next;
      });
    } else if (segment === 's') {
      setSeconds(prev => {
        let next = prev + (increment ? 1 : -1);
        if (next >= 60) next = 0;
        if (next < 0) next = 59;
        return next;
      });
    }
  };

  const handleWheel = (e: WheelEvent, type: 'h' | 'm' | 's') => {
    e.stopPropagation();
    if (e.deltaY < 0) {
      updateSegment(type, true);
    } else if (e.deltaY > 0) {
      updateSegment(type, false);
    }
  };

  const touchStartY = useRef<{ [key: string]: number }>({});

  const handleTouchStart = (e: React.TouchEvent, type: 'h' | 'm' | 's') => {
    touchStartY.current[type] = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent, type: 'h' | 'm' | 's') => {
    if (touchStartY.current[type] === undefined) return;
    const currentY = e.touches[0].clientY;
    const diff = touchStartY.current[type] - currentY;
    
    // Swipe threshold
    if (Math.abs(diff) > 20) {
      updateSegment(type, diff > 0);
      touchStartY.current[type] = currentY;
    }
  };

  const handleTouchEnd = (type: 'h' | 'm' | 's') => {
    delete touchStartY.current[type];
  };

  const Segment = ({ val, type }: { val: number, type: 'h' | 'm' | 's' }) => (
    <div className="flex flex-col items-center group">
      <button 
        type="button" 
        onClick={() => updateSegment(type, true)}
        className="text-neutral-500 hover:text-white active:scale-90 transition-all p-0.5 sm:p-1 outline-none"
      >
        <ChevronUp className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>
      
      <div 
        className="relative overflow-hidden w-16 h-20 sm:w-20 sm:h-20 bg-white/[0.03] hover:bg-white/[0.06] rounded-2xl flex items-center justify-center transition-all border border-white/[0.05] hover:border-white/10 group-focus-within:bg-white/[0.08] cursor-ns-resize"
        onWheel={(e) => handleWheel(e, type)}
        onTouchStart={(e) => handleTouchStart(e, type)}
        onTouchMove={(e) => handleTouchMove(e, type)}
        onTouchEnd={() => handleTouchEnd(type)}
        onTouchCancel={() => handleTouchEnd(type)}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={val}
            initial={{ y: direction === 'up' ? 40 : -40, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: direction === 'up' ? -40 : 40, opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="absolute font-mono tabular-nums text-4xl sm:text-5xl font-bold tracking-tight text-white/95"
          >
            {val.toString().padStart(2, '0')}
          </motion.div>
        </AnimatePresence>
      </div>

      <button 
        type="button" 
        onClick={() => updateSegment(type, false)}
        className="text-neutral-500 hover:text-white active:scale-90 transition-all p-0.5 sm:p-1 outline-none"
      >
        <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div ref={containerRef} className="relative w-full max-w-sm bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-8 overflow-hidden mx-auto flex flex-col items-center">
        {/* Decorative ambient illumination */}
        <div className="absolute -top-24 -right-24 w-52 h-52 rounded-full blur-3xl pointer-events-none opacity-20" style={{ backgroundColor: theme.accent }} />
        <div className="absolute -bottom-24 -left-24 w-52 h-52 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        <div className="text-xs font-hud font-bold tracking-widest text-neutral-400 mb-8 uppercase">Edit Focus Time</div>
        
        {/* Accent Highlight Line at Bottom */}
        <div 
          className="absolute bottom-0 left-8 right-8 h-[3px] rounded-t-full transition-colors duration-500" 
          style={{ backgroundColor: theme.accent, boxShadow: `0 0 12px ${theme.accent}80` }}
        />
        
        <div className="flex items-center gap-1 sm:gap-2 mb-4 relative z-10">
          <Segment val={hours} type="h" />
          <span className="text-2xl sm:text-3xl font-mono tabular-nums font-bold text-neutral-600 pb-1 sm:pb-2 -translate-y-0.5">:</span>
          <Segment val={minutes} type="m" />
          <span className="text-2xl sm:text-3xl font-mono tabular-nums font-bold text-neutral-600 pb-1 sm:pb-2 -translate-y-0.5">:</span>
          <Segment val={seconds} type="s" />
        </div>
        
        <div className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold mt-2 relative z-10">
          Scroll or Click
        </div>

        <button 
          onClick={() => {
            const { hours, minutes, seconds } = stateRef.current;
            const total = hours * 3600 + minutes * 60 + seconds;
            if (total > 0) propsRef.current.onSave(total);
            else propsRef.current.onCancel();
          }}
          className="mt-8 px-8 py-3 rounded-xl font-hud font-bold text-sm tracking-wider text-black transition-all hover:scale-105 active:scale-95 shadow-lg relative z-10"
          style={{ backgroundColor: theme.accent, boxShadow: `0 4px 14px ${theme.accent}60` }}
        >
          SAVE TIMER
        </button>
      </div>
    </div>
  );
}
