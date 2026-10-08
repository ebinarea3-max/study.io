import React from 'react';
import { ChevronLeft } from 'lucide-react';

interface ActiveRoomProps {
  roomId: string;
  onBack: () => void;
}

export default function ActiveRoom({ roomId, onBack }: ActiveRoomProps) {
  return (
    <div className="w-full h-full min-h-[80vh] bg-[#07090e] flex flex-col relative text-slate-200">
      <header className="flex items-center p-4 border-b border-white/5 bg-white/[0.02]">
        <button 
          onClick={onBack}
          className="p-2 -ml-2 rounded-xl hover:bg-white/10 transition-colors flex items-center gap-2"
        >
          <ChevronLeft className="w-6 h-6 text-slate-300" />
          <span className="font-bold text-slate-300">Back</span>
        </button>
      </header>
      
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Room: {roomId}</h2>
          <p className="text-slate-400">Inside the study room...</p>
        </div>
      </div>
    </div>
  );
}
