import React, { useEffect, useState } from 'react';
import { X, Wrench } from 'lucide-react';

export function UpdateBannerModal() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasSeenUpdate = localStorage.getItem('studypulse_seen_season_update_v1');
    if (!hasSeenUpdate) {
      setIsVisible(true);
    }
  }, []);

  if (!isVisible) return null;

  const handleDismiss = () => {
    localStorage.setItem('studypulse_seen_season_update_v1', 'true');
    setIsVisible(false);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg bg-[#0F1219] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500" />
        
        {/* Close Button */}
        <button 
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="p-6 sm:p-8">
          <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mb-5 border border-amber-500/20">
            <Wrench className="w-6 h-6 text-amber-500" />
          </div>
          
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 font-hud tracking-wide">
            🛠️ Season 1 Rank Calibration & Bug Fixes
          </h2>
          
          <div className="space-y-4 text-sm sm:text-base text-neutral-300 font-sans leading-relaxed">
            <p>
              We have patched timer background sleep tracking and duplicate offline session logging. 
            </p>
            <p>
              All ranks have now been calibrated to our new <strong>23-Tier Monthly RP System</strong> (1h = 100 RP). 
            </p>
            <p className="text-emerald-400 font-medium bg-emerald-500/10 px-3 py-2 rounded-lg border border-emerald-500/20">
              Your verified study time is preserved and ranks are now unified across Stats and Leaderboards!
            </p>
          </div>

          <button 
            onClick={handleDismiss}
            className="mt-8 w-full py-3.5 px-4 bg-white text-black font-bold rounded-xl hover:bg-neutral-200 transition-colors focus:ring-4 focus:ring-white/20 active:scale-[0.98]"
          >
            Got it, let's study
          </button>
        </div>
      </div>
    </div>
  );
}
