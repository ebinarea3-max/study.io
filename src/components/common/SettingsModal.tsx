'use client';

import React, { useState, useEffect } from 'react';
import { X, Volume2, Database, ShieldCheck, Check, Sparkles, RotateCcw, AlertTriangle, Download, FileSpreadsheet, FileJson } from 'lucide-react';
import { saveSupabaseConfig } from '../../lib/supabase';
import { soundFx } from '../../lib/audio';
import { useAuth } from '../../context/AuthContext';
import { useStudy } from '../../context/StudyContext';
import { exportDataAsJSON, exportSessionsAsCSV } from '../../lib/exportData';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { user, resetAllData } = useAuth();
  const { sessions, subjects, todos } = useStudy();
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('studypulse_supabase_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        setSupabaseUrl(parsed.url || '');
        setSupabaseKey(parsed.key || '');
      }
    } catch {
      // ignore
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseConfig(supabaseUrl.trim(), supabaseKey.trim());
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1200);
  };

  const testAudio = () => {
    soundFx.playStartChime();
    setTimeout(() => {
      soundFx.playMilestoneBell();
    }, 400);
  };

  const handleReset = () => {
    resetAllData();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">App Settings & Storage</h3>
              <p className="text-xs text-slate-400">Configure sound, sync & database</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Audio Test */}
        <div className="my-4 p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Volume2 className="w-5 h-5 text-emerald-400" />
            <div>
              <div className="text-xs font-semibold text-white">Audio & Focus Synthesizer</div>
              <div className="text-[11px] text-slate-400">Web Audio chimes and ambient noise generators</div>
            </div>
          </div>
          <button
            type="button"
            onClick={testAudio}
            className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-medium text-emerald-400 border border-emerald-500/30 transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Test Chimes</span>
          </button>
        </div>

        {/* Supabase backend config */}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/80">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400 mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Supabase Cloud Integration (Optional)</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              study.io works out of the box with zero-config local persistent storage and real-time multi-tab sync. To connect your live Supabase project, provide your credentials below:
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Project URL</label>
                <input
                  type="text"
                  value={supabaseUrl}
                  onChange={e => setSupabaseUrl(e.target.value)}
                  placeholder="https://your-project.supabase.co"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Anon / Public API Key</label>
                <input
                  type="password"
                  value={supabaseKey}
                  onChange={e => setSupabaseKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Data Export / Lifetime Backup Block */}
          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="text-xs font-semibold text-white">Export My Lifetime Data</div>
                  <div className="text-[10px] text-slate-400">Download your study history and sessions locally</div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => exportSessionsAsCSV(sessions, subjects)}
                className="py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-750 border border-slate-700 hover:border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
              <button
                type="button"
                onClick={() => exportDataAsJSON(user, subjects, sessions, todos)}
                className="py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-750 border border-slate-700 hover:border-cyan-500/40 text-cyan-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                <FileJson className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>
            </div>
          </div>

          {/* Reset App Data Block */}
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <div>
                  <div className="text-xs font-semibold text-rose-300">Fresh Start / Reset Data</div>
                  <div className="text-[10px] text-slate-400">Clear all local sessions, tasks, and start from scratch</div>
                </div>
              </div>
              {!showConfirmReset ? (
                <button
                  type="button"
                  onClick={() => setShowConfirmReset(true)}
                  className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowConfirmReset(false)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 text-xs hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/30"
                  >
                    Confirm Reset
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-300 text-sm font-medium transition-colors"
            >
              Close
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-sm font-bold transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-1.5"
            >
              {isSaved ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Config Saved!</span>
                </>
              ) : (
                <span>Save Configuration</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
