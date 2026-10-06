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
  
  const badSessions = sessions.filter(s => {
    // Look for extremely long sessions from today
    return s.durationSeconds > 5 * 3600; // longer than 5 hours
  });

  const handleFix = async () => {
    if (!user) return setResult('No user logged in.');
    setLoading(true);
    setResult('Fixing...');
    
    try {
      let totalSecondsToRemove = 0;
      const sessionIdsToRemove: string[] = [];
      
      for (const s of badSessions) {
        totalSecondsToRemove += s.durationSeconds;
        sessionIdsToRemove.push(s.id);
      }
      
      if (sessionIdsToRemove.length === 0) {
        setResult('No bad sessions found.');
        setLoading(false);
        return;
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
        localSess = localSess.filter((s: any) => !sessionIdsToRemove.includes(s.id));
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
      
      // Calculate new level
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
      
      setResult(`Success! Deleted ${sessionIdsToRemove.length} bogus sessions. Removed ${xpToRemove} XP and ${rpToRemove} RP.`);
    } catch (err: any) {
      console.error(err);
      setResult('Error: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="p-8 text-white min-h-screen bg-black">
      <h1 className="text-2xl font-bold text-red-500 mb-4">Fix Timer Bug Tool</h1>
      <p className="mb-4">
        This tool will automatically detect and delete the buggy sessions (longer than 5 hours) and refund the erroneously gained XP and RP.
      </p>
      
      <div className="bg-neutral-900 p-4 rounded-xl mb-6">
        <h2 className="font-bold mb-2">Detected Buggy Sessions:</h2>
        {badSessions.length === 0 ? (
          <p className="text-neutral-400">None found.</p>
        ) : (
          <ul className="list-disc pl-5">
            {badSessions.map(s => (
              <li key={s.id}>
                {s.subjectName} - {Math.floor(s.durationSeconds / 3600)}h {Math.floor((s.durationSeconds % 3600) / 60)}m
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <button 
        onClick={handleFix} 
        disabled={loading || badSessions.length === 0}
        className="px-6 py-3 bg-red-600 hover:bg-red-700 font-bold rounded-lg disabled:opacity-50"
      >
        {loading ? 'Fixing...' : 'Delete Buggy Sessions & Revert Stats'}
      </button>
      
      {result && (
        <div className="mt-6 p-4 bg-emerald-900/50 text-emerald-400 rounded-lg">
          {result}
        </div>
      )}
    </div>
  );
}
