import React, { useState, useEffect, useRef, WheelEvent } from 'react';
import { createPortal } from 'react-dom';
import { ChevronUp, ChevronDown, Check } from 'lucide-react';
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
        className="text-zinc-500 hover:text-white active:scale-90 transition-all p-1 sm:p-2 outline-none cursor-pointer"
      >
        <ChevronUp className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>
      
      <div 
        className="relative overflow-hidden w-20 h-24 sm:w-24 sm:h-28 bg-[#151822] hover:bg-[#1a1e2a] rounded-2xl flex items-center justify-center transition-all border border-white/[0.08] hover:border-white/20 group-focus-within:border-white/30 cursor-ns-resize shadow-inner"
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
            className="absolute font-mono tabular-nums text-5xl sm:text-6xl font-black tracking-tight text-white drop-shadow-md"
          >
            {val.toString().padStart(2, '0')}
          </motion.div>
        </AnimatePresence>
      </div>

      <button 
        type="button" 
        onClick={() => updateSegment(type, false)}
        className="text-zinc-500 hover:text-white active:scale-90 transition-all p-1 sm:p-2 outline-none cursor-pointer"
      >
        <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>
    </div>
  );

  const accentColor = theme?.accent || '#f59e0b';
  
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200" style={{ position: 'fixed' }}>
      <div ref={containerRef} className="relative w-full max-w-lg bg-[#0a0c10] border border-white/10 rounded-[2.5rem] shadow-2xl p-8 overflow-hidden mx-auto flex flex-col items-center animate-in zoom-in-95 duration-200">
        {/* Decorative ambient illumination */}
        <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full blur-[80px] pointer-events-none opacity-30" style={{ backgroundColor: accentColor }} />
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-white/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="text-sm font-bold tracking-[0.2em] text-zinc-400 mb-8 uppercase flex items-center gap-2">
          <span>Edit Focus Time</span>
        </div>
        
        {/* Accent Highlight Line at Bottom */}
        <div 
          className="absolute bottom-0 left-12 right-12 h-1 rounded-t-full transition-colors duration-500 opacity-80" 
          style={{ backgroundColor: accentColor, boxShadow: `0 -4px 20px ${accentColor}` }}
        />
        
        <div className="flex items-center gap-2 sm:gap-4 mb-4 relative z-10">
          <Segment val={hours} type="h" />
          <span className="text-3xl sm:text-4xl font-mono tabular-nums font-bold text-white/20 pb-1 sm:pb-2 -translate-y-1">:</span>
          <Segment val={minutes} type="m" />
          <span className="text-3xl sm:text-4xl font-mono tabular-nums font-bold text-white/20 pb-1 sm:pb-2 -translate-y-1">:</span>
          <Segment val={seconds} type="s" />
        </div>
        
        <div className="text-xs uppercase tracking-widest text-zinc-500 font-bold mt-4 mb-6 relative z-10">
          Scroll or Click
        </div>

        <button 
          onClick={() => {
            const { hours, minutes, seconds } = stateRef.current;
            const total = hours * 3600 + minutes * 60 + seconds;
            if (total > 0) propsRef.current.onSave(total);
            else propsRef.current.onCancel();
          }}
          className="mt-4 px-10 py-4 rounded-2xl font-bold text-sm tracking-widest text-black transition-all hover:scale-105 active:scale-95 shadow-xl relative z-10 flex items-center gap-2 cursor-pointer"
          style={{ backgroundColor: accentColor, boxShadow: `0 8px 30px ${accentColor}80` }}
        >
          <Check className="w-5 h-5" />
          SAVE TIMER
        </button>
      </div>
    </div>,
    document.body
  );
}
