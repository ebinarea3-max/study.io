import React, { useState, useEffect, useRef } from 'react';
import { ChevronUp, ChevronDown, Check } from 'lucide-react';

interface CountdownEditorProps {
  initialSeconds: number;
  onSave: (seconds: number) => void;
  onCancel: () => void;
}

export function CountdownEditor({ initialSeconds, onSave, onCancel }: CountdownEditorProps) {
  const [hours, setHours] = useState(Math.floor(initialSeconds / 3600));
  const [minutes, setMinutes] = useState(Math.floor((initialSeconds % 3600) / 60));
  const [seconds, setSeconds] = useState(initialSeconds % 60);

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

  const handleSave = () => {
    const total = hours * 3600 + minutes * 60 + seconds;
    if (total > 0) {
      onSave(total);
    } else {
      onCancel();
    }
  };

  const updateSegment = (segment: 'h' | 'm' | 's', increment: boolean) => {
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

  const Segment = ({ val, type }: { val: number, type: 'h' | 'm' | 's' }) => (
    <div className="flex flex-col items-center group">
      <button 
        type="button" 
        onClick={() => updateSegment(type, true)}
        className="text-neutral-500 hover:text-white transition-colors p-0.5 sm:p-1"
      >
        <ChevronUp className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>
      
      <div className="w-14 h-16 sm:w-20 sm:h-20 bg-white/[0.02] hover:bg-white/[0.06] rounded-xl flex items-center justify-center transition-colors border border-white/[0.02] hover:border-white/10 group-focus-within:bg-white/[0.08]">
        <span className="font-mono text-4xl sm:text-5xl font-bold text-neutral-300 transition-colors">
          {val.toString().padStart(2, '0')}
        </span>
      </div>

      <button 
        type="button" 
        onClick={() => updateSegment(type, false)}
        className="text-neutral-500 hover:text-white transition-colors p-0.5 sm:p-1"
      >
        <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>
    </div>
  );

  return (
    <div ref={containerRef} className="flex flex-col items-center bg-[#0c0d12]/95 backdrop-blur-md p-3 sm:p-4 rounded-3xl shadow-2xl border border-white/[0.08] relative pointer-events-auto">
      {/* Accent Highlight Line at Bottom matching screenshot */}
      <div className="absolute bottom-0 left-4 right-4 h-[2px] bg-sky-400 rounded-t-full shadow-[0_0_8px_rgba(56,189,248,0.5)]" />
      
      <div className="flex items-center gap-1 sm:gap-3 mb-1">
        <Segment val={hours} type="h" />
        <span className="text-3xl sm:text-4xl font-mono font-bold text-neutral-500 pb-1 sm:pb-2">:</span>
        <Segment val={minutes} type="m" />
        <span className="text-3xl sm:text-4xl font-mono font-bold text-neutral-500 pb-1 sm:pb-2">:</span>
        <Segment val={seconds} type="s" />
      </div>

      <div className="absolute top-3 right-3 flex items-center">
         <button onClick={handleSave} className="p-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 rounded-lg transition-colors border border-sky-500/20">
            <Check className="w-4 h-4" />
         </button>
      </div>
    </div>
  );
}
