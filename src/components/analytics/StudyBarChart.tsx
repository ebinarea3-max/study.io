'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface StudyBarChartProps {
  data: {
    label: string;
    hours: number;
    goalHours: number;
  }[];
}

export function StudyBarChart({ data }: StudyBarChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 text-xs">
        <span>No trend data available for this range</span>
      </div>
    );
  }

  const goal = data[0]?.goalHours || 6;

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
          <XAxis
            dataKey="label"
            stroke="#64748B"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: '#334155' }}
          />
          <YAxis
            stroke="#64748B"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: '#334155' }}
            tickFormatter={val => `${val}h`}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-2xl text-xs">
                    <div className="font-bold text-white mb-1">{item.label}</div>
                    <div className="text-emerald-400 font-mono font-bold">
                      Studied: {item.hours}h
                    </div>
                    <div className="text-slate-400 text-[10px]">
                      Daily Target: {item.goalHours}h
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <ReferenceLine
            y={goal}
            stroke="#10B981"
            strokeDasharray="4 4"
            label={{
              value: `Goal: ${goal}h`,
              fill: '#10B981',
              fontSize: 10,
              position: 'top',
            }}
          />
          <Bar
            dataKey="hours"
            fill="#10B981"
            radius={[6, 6, 0, 0]}
            maxBarSize={45}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
