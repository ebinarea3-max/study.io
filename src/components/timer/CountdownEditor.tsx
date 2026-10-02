import React, { useState, useEffect, useRef, WheelEvent } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CountdownEditorProps {
  initialSeconds: number;
  onSave: (seconds: number) => void;
  onCancel: () => void;
}

export function CountdownEditor({ initialSeconds, onSave, onCancel }: CountdownEditorProps) {
  const [hours, setHours] = useState(Math.floor(initialSeconds / 3600));
  const [minutes, setMinutes] = useState(Math.floor((initialSeconds % 3600) / 60));
  const [seconds, setSeconds] = useState(initialSeconds % 60);

  const [direction, setDirection] = useState<'up' | 'down'>('up');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        handleSave();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [hours, minutes, seconds]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSave();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [hours, minutes, seconds]);
  
  // Attach non-passive wheel listener to prevent body scroll natively
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    
    const preventScroll = (e: globalThis.WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };
    
    el.addEventListener('wheel', preventScroll, { passive: false });
    return () => el.removeEventListener('wheel', preventScroll);
  }, []);

  const handleSave = () => {
    const total = hours * 3600 + minutes * 60 + seconds;
    if (total > 0) {
      onSave(total);
    } else {
      onCancel();
    }
  };

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

  const Segment = ({ val, type }: { val: number, type: 'h' | 'm' | 's' }) => (
    <div className="flex flex-col items-center group">
      <button 
        type="button" 
        onClick={() => updateSegment(type, true)}
        className="text-neutral-600 hover:text-white active:text-sky-400 active:scale-90 transition-all p-0.5 sm:p-1 outline-none"
      >
        <ChevronUp className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>
      
      <div 
        className="relative overflow-hidden w-16 h-20 sm:w-20 sm:h-20 bg-white/[0.02] hover:bg-white/[0.05] rounded-2xl flex items-center justify-center transition-all border border-white/[0.02] hover:border-white/10 group-focus-within:bg-white/[0.08]"
        onWheel={(e) => handleWheel(e, type)}
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
        className="text-neutral-600 hover:text-white active:text-sky-400 active:scale-90 transition-all p-0.5 sm:p-1 outline-none"
      >
        <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>
    </div>
  );

  return (
    <div ref={containerRef} className="flex flex-col items-center bg-[#0c0d12]/95 backdrop-blur-md p-3 sm:p-4 rounded-[2rem] shadow-2xl border border-white/[0.08] relative pointer-events-auto mx-auto scale-90 sm:scale-100 origin-center max-w-[95%]">
      {/* Accent Highlight Line at Bottom matching screenshot */}
      <div className="absolute bottom-0 left-6 right-6 h-[3px] bg-sky-400 rounded-t-full shadow-[0_0_12px_rgba(56,189,248,0.6)]" />
      
      <div className="flex items-center gap-1 sm:gap-2 mb-2">
        <Segment val={hours} type="h" />
        <span className="text-2xl sm:text-3xl font-mono tabular-nums font-bold text-neutral-600 pb-1 sm:pb-2 -translate-y-0.5">:</span>
        <Segment val={minutes} type="m" />
        <span className="text-2xl sm:text-3xl font-mono tabular-nums font-bold text-neutral-600 pb-1 sm:pb-2 -translate-y-0.5">:</span>
        <Segment val={seconds} type="s" />
      </div>
      
      <div className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold mt-1">
        Scroll or Click
      </div>
    </div>
  );
}
