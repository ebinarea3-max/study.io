'use client';

import React from 'react';
import { useAuth } from '../../context/AuthContext';

export function DevRankSwitcher() {
  const { user, updateProfile } = useAuth();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const handleRankChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRp = parseInt(e.target.value, 10);
    if (!isNaN(newRp)) {
      updateProfile({ seasonRp: newRp, rp: newRp });
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-slate-900 border border-slate-700 text-xs text-white p-2 rounded-lg shadow-xl">
      <div className="mb-1 text-slate-400 font-bold text-[10px] uppercase">Dev Rank Override</div>
      <select
        className="bg-slate-800 border border-slate-600 rounded px-2 py-1 outline-none text-white w-full cursor-pointer"
        value={user?.seasonRp || 0}
        onChange={handleRankChange}
      >
        <option value={user?.seasonRp || 0}>Current ({user?.seasonRp || 0} RP)</option>
        <option value={150}>Bronze I (150 RP)</option>
        <option value={1700}>Silver II (1,700 RP)</option>
        <option value={3900}>Gold III (3,900 RP)</option>
        <option value={5800}>Platinum II (5,800 RP)</option>
        <option value={10900}>Diamond IV (10,900 RP)</option>
        <option value={14000}>Champion (14,000 RP)</option>
        <option value={19500}>Master (19,500 RP)</option>
        <option value={25000}>Grandmaster (25,000 RP)</option>
      </select>
    </div>
  );
}
