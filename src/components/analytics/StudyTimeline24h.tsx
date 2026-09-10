'use client';

import React from 'react';
import { StudySession } from '../../types';
import { formatSeconds, formatHoursAndMins } from '../../lib/utils';
import { Clock, Info } from 'lucide-react';

interface StudyTimeline24hProps {
  sessions: StudySession[];
  dateStr: string;
}

export function StudyTimeline24h({ sessions, dateStr }: StudyTimeline24hProps) {
  // Filter sessions for this specific date
  const daySessions = sessions.filter(s => s.startTime.startsWith(dateStr));

  // Build 24 hour slots (0 to 23)
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Helper to check if an interval has study activity
  const getBlocksForHour = (hour: number) => {
    // 6 intervals of 10 minutes each per hour
    const blocks = [0, 10, 20, 30, 40, 50];
    return blocks.map(min => {
      const blockTime = hour * 60 + min;
      // Check if any session covers this minute
      const match = daySessions.find(s => {
        const start = new Date(s.startTime);
        const end = new Date(s.endTime);
        const startMin = start.getHours() * 60 + start.getMinutes();
        const endMin = end.getHours() * 60 + end.getMinutes();
        return blockTime >= startMin && blockTime < endMin;
      });

      return {
        minute: min,
        match,
      };
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-400" />
          <h4 className="text-sm font-bold text-white">24-Hour Study Timeline</h4>
        </div>
        <span className="text-xs text-slate-400 font-medium">
          {daySessions.length} Session{daySessions.length !== 1 ? 's' : ''} Today
        </span>
      </div>

      {/* Visual Timeline Grid */}
      <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 overflow-x-auto">
        <div className="min-w-[640px] space-y-2">
          {/* Top Hour Labels */}
          <div className="grid grid-cols-24 gap-1 text-[9px] text-slate-500 font-mono text-center">
            {hours.map(h => (
              <div key={h} className={h % 3 === 0 ? 'text-slate-300 font-bold' : ''}>
                {h % 3 === 0 ? `${h}h` : ''}
              </div>
            ))}
          </div>

          {/* 24-Hour Blocks Row */}
          <div className="grid grid-cols-24 gap-1">
            {hours.map(h => {
              const blocks = getBlocksForHour(h);
              return (
                <div key={h} className="flex gap-0.5 h-10 rounded-md bg-slate-900/90 p-0.5 border border-slate-800">
                  {blocks.map((b, idx) => (
                    <div
                      key={idx}
                      className="flex-1 rounded-sm transition-all relative group"
                      style={{
                        backgroundColor: b.match ? b.match.subjectColor : 'transparent',
                        opacity: b.match ? 0.9 : 0.2,
                      }}
                    >
                      {b.match && (
                        <div className="hidden group-hover:block absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 text-[10px] text-white p-2 rounded-xl shadow-2xl z-30 whitespace-nowrap pointer-events-none">
                          <div className="font-bold flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: b.match.subjectColor }}
                            />
                            <span>{b.match.subjectName}</span>
                          </div>
                          <div className="text-slate-400 mt-0.5">
                            {new Date(b.match.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(b.match.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="text-emerald-400 font-bold">
                            {formatHoursAndMins(b.match.durationSeconds)}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          {/* Time markers legend */}
          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
            <span>00:00 (Midnight)</span>
            <span>06:00 (Morning)</span>
            <span>12:00 (Noon)</span>
            <span>18:00 (Evening)</span>
            <span>23:59</span>
          </div>
        </div>
      </div>

      {/* Session Logs for this Day */}
      {daySessions.length > 0 && (
        <div className="space-y-2 pt-2">
          <div className="text-xs font-semibold text-slate-400">Logged Sessions Today:</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {daySessions.map(s => {
              const startStr = new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const endStr = new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <div
                  key={s.id}
                  className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: s.subjectColor }}
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-white truncate">{s.subjectName}</div>
                      <div className="text-[10px] text-slate-400">
                        {startStr} – {endStr}
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="font-mono font-bold text-emerald-400">
                      {formatHoursAndMins(s.durationSeconds)}
                    </span>
                    <div className="text-[10px] text-slate-500 uppercase">{s.mode}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
