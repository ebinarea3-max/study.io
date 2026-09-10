'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatHoursAndMins } from '../../lib/utils';

interface SubjectDonutChartProps {
  data: {
    name: string;
    seconds: number;
    color: string;
    percentage: number;
  }[];
}

export function SubjectDonutChart({ data }: SubjectDonutChartProps) {
  if (data.length === 0 || data.every(d => d.seconds === 0)) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-xs">
        <span>No study sessions logged in this timeframe</span>
      </div>
    );
  }

  const chartData = data.filter(d => d.seconds > 0);

  return (
    <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
      {/* Donut Pie */}
      <div className="w-full lg:w-1/2 h-64 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={95}
              paddingAngle={4}
              dataKey="seconds"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="#0F172A" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-2xl text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-white mb-1">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span>{item.name}</span>
                      </div>
                      <div className="text-emerald-400 font-mono font-bold">
                        {formatHoursAndMins(item.seconds)} ({item.percentage}%)
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend & Breakdown List */}
      <div className="w-full lg:w-1/2 space-y-2.5">
        {chartData.map(item => (
          <div
            key={item.name}
            className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
              <span className="font-semibold text-slate-200 truncate">{item.name}</span>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="font-mono text-slate-300 font-bold">{formatHoursAndMins(item.seconds)}</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-emerald-400 font-bold">
                {item.percentage}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
