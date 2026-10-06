'use client';

import React, { useState, useEffect } from 'react';
import { useStudy } from '@/context/StudyContext';
import { useAuth } from '@/context/AuthContext';
import { getSupabase } from '@/lib/supabase';
import { StudySession } from '@/types';

export default function FixBugPage() {
  const { user, updateProfile } = useAuth();
  const { sessions, refetchSessions } = useStudy();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Sort sessions newest first
  const sortedSessions = [...sessions].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  // Take the last 50 sessions
  const recentSessions = sortedSessions.slice(0, 50);

  const handleToggle = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleFix = async () => {
    if (!user) return setResult('No user logged in.');
    if (selectedIds.size === 0) return setResult('No sessions selected.');
    
    setLoading(true);
    setResult('Deleting selected sessions...');
    
    try {
      let totalSecondsToRemove = 0;
      const sessionIdsToRemove = Array.from(selectedIds);
      
      const sessionsToDelete = sessions.filter(s => selectedIds.has(s.id));
      for (const s of sessionsToDelete) {
        totalSecondsToRemove += s.durationSeconds;
      }
      
      // 1. Delete from Supabase
      const supabase = getSupabase();
      if (supabase) {
        const { error } = await supabase
          .from('study_sessions')
          .delete()
          .in('id', sessionIdsToRemove);
          
        if (error) throw error;
      }
      
      // 2. Delete from LocalStorage
      const localSessionsStr = localStorage.getItem(`study_io_sessions_${user.id}`) || localStorage.getItem('studypulse_sessions');
      if (localSessionsStr) {
        let localSess = JSON.parse(localSessionsStr);
        localSess = localSess.filter((s: any) => !selectedIds.has(s.id));
        localStorage.setItem(`study_io_sessions_${user.id}`, JSON.stringify(localSess));
        localStorage.setItem('studypulse_sessions', JSON.stringify(localSess));
      }
      
      // 3. Deduct XP and RP
      const xpToRemove = Math.floor(totalSecondsToRemove / 60) * 10;
      const rpToRemove = Math.floor(totalSecondsToRemove / 36);
      
      const prevXp = user.lifetime_xp || 0;
      const prevRp = user.seasonRp || user.rp || 0;
      
      const newXp = Math.max(0, prevXp - xpToRemove);
      const newRp = Math.max(0, prevRp - rpToRemove);
      
      const getLevelFromLifetimeXP = (xp: number) => {
        if (xp < 500) return 1;
        if (xp < 1500) return 2;
        if (xp < 3000) return 3;
        if (xp < 5000) return 4;
        if (xp < 8000) return 5;
        if (xp < 12000) return 6;
        if (xp < 18000) return 7;
        if (xp < 25000) return 8;
        if (xp < 35000) return 9;
        return 10;
      };
      const newLevel = getLevelFromLifetimeXP(newXp);
      
      await updateProfile({
        lifetime_xp: newXp,
        lifetimeXp: newXp,
        xp: newXp,
        rp: newRp,
        seasonRp: newRp,
        level: newLevel
      });
      
      await refetchSessions();
      setSelectedIds(new Set());
      setResult(`Success! Deleted ${sessionIdsToRemove.length} sessions. Removed ${xpToRemove} XP and ${rpToRemove} RP.`);
    } catch (err: any) {
      console.error(err);
      setResult('Error: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="p-8 text-white min-h-screen bg-black">
      <h1 className="text-2xl font-bold text-red-500 mb-4">Session History Editor</h1>
      <p className="mb-4">
        Select the bogus sessions you want to delete. This will also refund the incorrectly gained XP and RP from these sessions.
      </p>
      
      <div className="bg-neutral-900 p-4 rounded-xl mb-6 max-h-[60vh] overflow-y-auto">
        <h2 className="font-bold mb-4">Recent Sessions:</h2>
        {recentSessions.length === 0 ? (
          <p className="text-neutral-400">No sessions found.</p>
        ) : (
          <div className="space-y-2">
            {recentSessions.map(s => (
              <label key={s.id} className="flex items-center space-x-3 p-3 bg-black/40 rounded-lg cursor-pointer hover:bg-black/60 border border-white/5">
                <input 
                  type="checkbox" 
                  checked={selectedIds.has(s.id)}
                  onChange={() => handleToggle(s.id)}
                  className="w-5 h-5 rounded border-neutral-600 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-black bg-black"
                />
                <div className="flex-1">
                  <div className="font-bold">{s.subjectName}</div>
                  <div className="text-sm text-neutral-400">
                    {new Date(s.startTime).toLocaleString()} - Duration: <span className={s.durationSeconds > 18000 ? "text-red-400 font-bold" : ""}>{Math.floor(s.durationSeconds / 3600)}h {Math.floor((s.durationSeconds % 3600) / 60)}m</span>
                  </div>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>
      
      <button 
        onClick={handleFix} 
        disabled={loading || selectedIds.size === 0}
        className="px-6 py-3 bg-red-600 hover:bg-red-700 font-bold rounded-lg disabled:opacity-50"
      >
        {loading ? 'Deleting...' : `Delete ${selectedIds.size} Selected Sessions & Revert Stats`}
      </button>
      
      {result && (
        <div className="mt-6 p-4 bg-emerald-900/50 text-emerald-400 rounded-lg">
          {result}
        </div>
      )}
    </div>
  );
}
