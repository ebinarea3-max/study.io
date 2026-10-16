'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Sparkles, Calendar, Clock, BarChart3 } from 'lucide-react';

interface CellInfo {
  dateStr: string;
  minutes: number;
  level: number;
  label: string;
}

export function DemoInsightsTile() {
  const [inView, setInView] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<CellInfo | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // 12 columns x 7 rows sample grid
  const gridWeeks = useMemo(() => {
    const weeks: CellInfo[][] = [];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    for (let w = 0; w < 12; w++) {
      const col: CellInfo[] = [];
      for (let d = 0; d < 7; d++) {
        // Deterministic sample pattern
        const seed = (w * 7 + d * 13) % 19;
        let mins = 0;
        let level = 0;

        if (seed > 4) {
          mins = ((seed * 23) % 150) + 30; // 30m to 180m
          if (mins <= 60) level = 1;
          else if (mins <= 100) level = 2;
          else if (mins <= 140) level = 3;
          else level = 4;
        }

        col.push({
          dateStr: `W${w + 1}-${days[d]}`,
          minutes: mins,
          level,
          label: `${days[d]} (Week ${w + 1})`,
        });
      }
      weeks.push(col);
    }
    return weeks;
  }, []);

  return (
    <div
      ref={containerRef}
      className="h-full flex flex-col justify-between p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-card transition-all"
    >
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-3.5 h-3.5 text-[#E6C15A]" />
            <h4 className="font-hud font-bold text-xs uppercase tracking-wider text-[var(--text)]">
              Study Insights
            </h4>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.05] text-[var(--text-dim)] border border-[var(--border)]">
            Live Demo
          </span>
        </div>

        <p className="text-xs text-[var(--text-dim)] mb-3">
          12-week study heatmaps, peak focus windows, and weekday efficiency telemetry.
        </p>

        {/* Plain Sentence Highlights */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
            <div className="text-[10px] font-hud uppercase tracking-wider text-[var(--text-dim)] flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#E6C15A]" />
              <span>Peak Window</span>
            </div>
            <div className="text-xs font-semibold text-[var(--text)] mt-0.5">
              7 to 8 PM
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
            <div className="text-[10px] font-hud uppercase tracking-wider text-[var(--text-dim)] flex items-center gap-1">
              <Calendar className="w-3 h-3 text-[#E6C15A]" />
              <span>Top Day</span>
            </div>
            <div className="text-xs font-semibold text-[var(--text)] mt-0.5">
              Thursday (14.2h)
            </div>
          </div>
        </div>

        {/* Heatmap Tooltip readout */}
        <div className="h-5 text-[11px] font-mono text-[var(--text-dim)] flex items-center mb-2">
          {hoveredCell ? (
            <span className="text-[var(--text)] font-medium animate-in fade-in duration-100">
              {hoveredCell.label}:{' '}
              <span className="text-[#E6C15A] font-semibold">
                {hoveredCell.minutes > 0 ? `${hoveredCell.minutes} mins` : 'Rest day'}
              </span>
            </span>
          ) : (
            <span className="text-[10px] text-[var(--text-dim)]">
              Hover cell to inspect focus minutes
            </span>
          )}
        </div>

        {/* 12-Week Heatmap Grid (cell-by-cell staggered appearance) */}
        <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex justify-center">
          <div className="flex gap-1">
            {gridWeeks.map((col, colIdx) => (
              <div key={colIdx} className="flex flex-col gap-1">
                {col.map((cell, rowIdx) => {
                  const isHovered = hoveredCell?.dateStr === cell.dateStr;
                  const delayMs = inView ? (colIdx * 7 + rowIdx) * 5 : 0;

                  return (
                    <button
                      key={cell.dateStr}
                      type="button"
                      onMouseEnter={() => setHoveredCell(cell)}
                      onMouseLeave={() => setHoveredCell(null)}
                      onClick={() => setHoveredCell(cell)}
                      aria-label={`${cell.label}: ${cell.minutes} mins`}
                      className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-[2px] transition-all cursor-pointer ${
                        isHovered ? 'scale-125 z-10 ring-1 ring-[#E6C15A]' : ''
                      }`}
                      style={{
                        opacity: inView ? 1 : 0,
                        transform: inView ? 'scale(1)' : 'scale(0.8)',
                        transition: `opacity 0.25s ease ${delayMs}ms, transform 0.25s ease ${delayMs}ms`,
                        backgroundColor:
                          cell.level === 0
                            ? 'rgba(255, 255, 255, 0.05)'
                            : cell.level === 1
                            ? 'rgba(230, 193, 90, 0.25)'
                            : cell.level === 2
                            ? 'rgba(230, 193, 90, 0.50)'
                            : cell.level === 3
                            ? 'rgba(230, 193, 90, 0.75)'
                            : '#E6C15A',
                        boxShadow:
                          cell.level === 4
                            ? '0 0 6px rgba(230, 193, 90, 0.4)'
                            : 'none',
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between text-[10px] font-mono text-[var(--text-dim)]">
        <span>12-Week Consistency</span>
        <div className="flex items-center gap-1">
          <span>Less</span>
          <span className="w-2 h-2 rounded-[2px] bg-white/[0.05]" />
          <span className="w-2 h-2 rounded-[2px] bg-[#E6C15A]/25" />
          <span className="w-2 h-2 rounded-[2px] bg-[#E6C15A]/50" />
          <span className="w-2 h-2 rounded-[2px] bg-[#E6C15A]/75" />
          <span className="w-2 h-2 rounded-[2px] bg-[#E6C15A]" />
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
