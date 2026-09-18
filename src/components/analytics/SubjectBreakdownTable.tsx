'use client';

import React from 'react';
import { formatHoursAndMins } from '../../lib/utils';
import { BookOpen, Layers, Award } from 'lucide-react';

interface SubjectBreakdownTableProps {
  data: {
    name: string;
    seconds: number;
    color: string;
    percentage: number;
    sessionCount: number;
    targetMinutes: number;
  }[];
  totalSeconds: number;
}

export function SubjectBreakdownTable({ data, totalSeconds }: SubjectBreakdownTableProps) {
  if (data.length === 0 || totalSeconds === 0) {
    return (
      <div className="p-8 text-center text-slate-500 text-xs rounded-2xl bg-slate-950/60 border border-slate-800">
        No study records found in this timeframe.
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-slate-950/80 border border-slate-800/80 overflow-hidden shadow-xl">
      <div className="overflow-x-auto pb-2 scrollbar-thin">
        <table className="w-full text-left text-xs border-collapse min-w-[560px]">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
              <th className="py-3 px-4">Subject Name</th>
              <th className="py-3 px-4">Total Hours</th>
              <th className="py-3 px-4">% Distribution</th>
              <th className="py-3 px-4">Sessions</th>
              <th className="py-3 px-4">Avg Session</th>
              <th className="py-3 px-4 text-right">Visual Share</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {data.map(item => {
              const avgSeconds = item.sessionCount > 0 ? Math.round(item.seconds / item.sessionCount) : 0;
              return (
                <tr key={item.name} className="hover:bg-slate-900/50 transition-colors">
                  {/* Subject Name with Color Badge */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5 font-semibold text-white">
                      <span
                        className="w-3.5 h-3.5 rounded-md flex-shrink-0 shadow-sm"
                        style={{ backgroundColor: item.color }}
                      />
                      <span>{item.name}</span>
                    </div>
                  </td>

                  {/* Total Hours Studied */}
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                    {formatHoursAndMins(item.seconds)}
                  </td>

                  {/* % Distribution */}
                  <td className="py-3.5 px-4">
                    <span className="inline-flex px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 font-mono font-bold text-slate-200 text-[11px]">
                      {item.percentage}%
                    </span>
                  </td>

                  {/* Sessions Count */}
                  <td className="py-3.5 px-4 text-slate-300 font-medium">
                    {item.sessionCount} sessions
                  </td>

                  {/* Avg Session */}
                  <td className="py-3.5 px-4 text-slate-400 font-mono">
                    {formatHoursAndMins(avgSeconds)}
                  </td>

                  {/* Visual Share Bar */}
                  <td className="py-3.5 px-4 text-right w-40">
                    <div className="h-2 w-full rounded-full bg-slate-900 overflow-hidden ml-auto">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-900/90 font-bold text-white border-t border-slate-800">
              <td className="py-3 px-4">Total Time Logged</td>
              <td className="py-3 px-4 font-mono text-emerald-400">
                {formatHoursAndMins(totalSeconds)}
              </td>
              <td className="py-3 px-4">100%</td>
              <td className="py-3 px-4">
                {data.reduce((sum, d) => sum + d.sessionCount, 0)} sessions
              </td>
              <td className="py-3 px-4 text-slate-400">-</td>
              <td className="py-3 px-4 text-right text-emerald-400 text-[11px]">Complete</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
