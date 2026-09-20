'use client';

import React, { useState } from 'react';
import {
  X,
  Volume2,
  ShieldCheck,
  Sparkles,
  Download,
  FileSpreadsheet,
  FileJson,
  User,
  AlertTriangle,
  Loader2,
  Trash2,
  Smartphone,
} from 'lucide-react';
import { soundFx } from '../../lib/audio';
import { useAuth } from '../../context/AuthContext';
import { useStudy } from '../../context/StudyContext';
import { exportDataAsJSON, exportSessionsAsCSV } from '../../lib/exportData';
import { InstallAppButton } from './InstallAppButton';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { user, deleteAccount } = useAuth();
  const { sessions, subjects, todos } = useStudy();

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [typedEmail, setTypedEmail] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  if (!isOpen) return null;

  const testAudio = () => {
    soundFx.playStartChime();
    setTimeout(() => {
      soundFx.playMilestoneBell();
    }, 450);
  };

  const targetEmail = (user.email || '').trim().toLowerCase();
  const canDelete = targetEmail.length > 0 && typedEmail.trim().toLowerCase() === targetEmail;

  const handleDeleteAccount = async () => {
    if (!canDelete) return;
    setIsDeleting(true);
    setDeleteError('');
    try {
      await deleteAccount();
      onClose();
    } catch {
      setDeleteError('Account deletion encountered an issue. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0c0d10] border border-white/[0.08] rounded-3xl shadow-2xl p-6 sm:p-7 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Ambient background lighting */}
        <div className="absolute -top-24 -right-24 w-52 h-52 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-52 h-52 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-emerald-400 shadow-sm">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white tracking-tight">Settings & Preferences</h3>
              <p className="text-xs text-neutral-400">Audio synthesizer, data exports, and account management</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-xl hover:bg-white/[0.06] transition-colors cursor-pointer"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-4">
          {/* Section 1: Account & Profile Status */}
          <div className="p-4 rounded-2xl bg-neutral-900/40 border border-white/[0.06] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-400 flex items-center justify-center font-bold text-slate-950 text-sm flex-shrink-0 shadow-md">
                {user.displayName ? user.displayName.slice(0, 2).toUpperCase() : <User className="w-5 h-5" />}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-white truncate tracking-tight">{user.displayName}</div>
                <div className="text-xs text-neutral-400 font-mono truncate">{user.email}</div>
              </div>
            </div>
            <div className="flex-shrink-0">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-semibold text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Cloud Synced</span>
              </span>
            </div>
          </div>

          {/* Section 2: Audio & Focus Synthesizer */}
          <div className="p-4 rounded-2xl bg-neutral-900/40 border border-white/[0.06] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                <Volume2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white tracking-tight">Audio & Focus Synthesizer</div>
                <div className="text-[11px] text-neutral-400">Zero-latency Web Audio soundscapes & session bells</div>
              </div>
            </div>
            <button
              type="button"
              onClick={testAudio}
              className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-semibold text-white transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Test Chimes</span>
            </button>
          </div>

          {/* Section: Progressive Web App Installation */}
          <div className="p-4 rounded-2xl bg-neutral-900/40 border border-white/[0.06] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white tracking-tight">App Installation (PWA)</div>
                <div className="text-[11px] text-neutral-400">Install study.io on your device for standalone distraction-free focus</div>
              </div>
            </div>
            <InstallAppButton variant="settings" />
          </div>

          {/* Section 3: Export Lifetime Data (CSV / JSON) */}
          <div className="p-4 rounded-2xl bg-neutral-900/40 border border-white/[0.06] space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 flex-shrink-0">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white tracking-tight">Export Lifetime Study Data</div>
                <div className="text-[11px] text-neutral-400">Backup your complete study history, timeline logs, and subject stats</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => exportSessionsAsCSV(sessions, subjects)}
                className="py-2.5 px-3 rounded-xl bg-neutral-900/70 hover:bg-neutral-850 border border-white/[0.08] hover:border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
              <button
                type="button"
                onClick={() => exportDataAsJSON(user, subjects, sessions, todos)}
                className="py-2.5 px-3 rounded-xl bg-neutral-900/70 hover:bg-neutral-850 border border-white/[0.08] hover:border-cyan-500/40 text-cyan-300 text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <FileJson className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>
            </div>
          </div>

          {/* Section 4: High-Security Danger Zone (Delete Account) */}
          <div className="p-4 rounded-2xl bg-rose-500/[0.04] border border-rose-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <div>
                  <div className="text-xs font-bold text-rose-300 tracking-tight">Danger Zone</div>
                  <div className="text-[11px] text-neutral-400">Permanent account and data removal</div>
                </div>
              </div>

              {!showDeleteConfirmation && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirmation(true)}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Account...</span>
                </button>
              )}
            </div>

            {showDeleteConfirmation && (
              <div className="pt-2 border-t border-rose-500/20 space-y-3 animate-in fade-in duration-150">
                <p className="text-xs text-rose-300 leading-relaxed">
                  This action is permanent and cannot be undone. All your study sessions, streaks, subjects, and data will be erased immediately.
                </p>

                <div className="space-y-1.5">
                  <label className="block text-[11px] text-neutral-400">
                    To confirm, please type your email address:{' '}
                    <span className="font-mono text-xs text-white font-bold">{user.email}</span>
                  </label>
                  <input
                    type="email"
                    value={typedEmail}
                    onChange={e => setTypedEmail(e.target.value)}
                    placeholder={user.email || 'your@email.com'}
                    className="w-full px-3 py-2 bg-black/60 border border-rose-500/30 rounded-xl text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-rose-500 transition-colors font-mono"
                  />
                </div>

                {deleteError && (
                  <div className="text-xs text-rose-400 font-medium">{deleteError}</div>
                )}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteConfirmation(false);
                      setTypedEmail('');
                      setDeleteError('');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-neutral-400 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!canDelete || isDeleting}
                    onClick={handleDeleteAccount}
                    className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-md shadow-rose-600/30 cursor-pointer"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Permanently Delete Account</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Action: Single Clean 'Done' Button */}
        <div className="pt-3 border-t border-white/[0.08]">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-neutral-200 text-slate-950 font-bold text-sm transition-all active:scale-[0.99] shadow-lg shadow-white/5 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
