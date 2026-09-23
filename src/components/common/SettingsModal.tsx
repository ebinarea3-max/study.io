'use client';

import React, { useState } from 'react';
import {
  X,
  Volume2,
  ShieldCheck,
  Sparkles,
  Download,
  User,
  AlertTriangle,
  Loader2,
  Trash2,
  Smartphone,
  CheckCircle2,
} from 'lucide-react';
import { soundFx } from '../../lib/audio';
import { useAuth } from '../../context/AuthContext';
import { usePwaInstall } from '../../hooks/usePwaInstall';
import { InstallInstructionModal } from './InstallInstructionModal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { user, deleteAccount } = useAuth();
  const { canInstall, isInstalled, isPrompting, deferredPrompt, triggerInstall } = usePwaInstall();

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [typedEmail, setTypedEmail] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [showInstallInstructions, setShowInstallInstructions] = useState(false);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt || canInstall) {
      await triggerInstall();
    } else {
      setShowInstallInstructions(true);
    }
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-[var(--surface)] border border-slate-200 dark:border-[var(--border)] rounded-3xl shadow-2xl p-6 sm:p-7 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Ambient background lighting */}
        <div className="absolute -top-24 -right-24 w-52 h-52 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-52 h-52 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-[var(--border)] flex items-center justify-center text-emerald-500 dark:text-emerald-400 shadow-sm">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white tracking-tight">Settings &amp; Preferences</h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400">Audio synthesizer, preferences, and account management</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-4">
          {/* Section 1: Account & Profile Status */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-neutral-900/40 border border-slate-200 dark:border-white/[0.06] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-400 flex items-center justify-center font-bold text-slate-950 text-sm flex-shrink-0 shadow-md">
                {user.displayName ? user.displayName.slice(0, 2).toUpperCase() : <User className="w-5 h-5" />}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-slate-900 dark:text-white truncate tracking-tight">{user.displayName}</div>
                <div className="text-xs text-slate-500 dark:text-neutral-400 font-mono truncate">{user.email}</div>
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
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-neutral-900/40 border border-slate-200 dark:border-white/[0.06] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 dark:text-emerald-400 flex-shrink-0">
                <Volume2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white tracking-tight">Audio &amp; Focus Synthesizer</div>
                <div className="text-[11px] text-slate-500 dark:text-neutral-400">Zero-latency Web Audio soundscapes &amp; session bells</div>
              </div>
            </div>
            <button
              type="button"
              onClick={testAudio}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/[0.1] border border-slate-200 dark:border-[var(--border)] text-xs font-semibold text-slate-700 dark:text-white transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
              <span>Test Chimes</span>
            </button>
          </div>

          {/* Section: Install App / Add to Home Screen */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-neutral-900/40 border border-slate-200 dark:border-white/[0.06] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 dark:text-emerald-400 flex-shrink-0">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white tracking-tight">Install App / Add to Home Screen</div>
                <div className="text-[11px] text-slate-500 dark:text-neutral-400">Install study.io on your device for standalone distraction-free focus</div>
              </div>
            </div>

            {isInstalled ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold flex-shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Installed</span>
              </div>
            ) : canInstall ? (
              <button
                type="button"
                onClick={handleInstallClick}
                disabled={isPrompting}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50 flex-shrink-0"
              >
                {isPrompting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>Install App</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleInstallClick}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.12] border border-slate-200 dark:border-[var(--border)] text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-200 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-sm flex-shrink-0"
                title="View manual install instructions"
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Add to Home Screen</span>
              </button>
            )}
          </div>


          {/* Section 4: High-Security Danger Zone (Delete Account) */}
          <div className="p-4 rounded-2xl bg-rose-500/[0.04] border border-rose-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-500 dark:text-rose-400 flex-shrink-0" />
                <div>
                  <div className="text-xs font-bold text-rose-600 dark:text-rose-300 tracking-tight">Danger Zone</div>
                  <div className="text-[11px] text-slate-500 dark:text-neutral-400">Permanent account and data removal</div>
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
        <div className="pt-3 border-t border-slate-200 dark:border-[var(--border)]">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-neutral-200 text-white dark:text-slate-950 font-bold text-sm transition-all active:scale-[0.99] shadow-lg shadow-black/10 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>

      {/* Fallback Install / Add to Home Screen Instructions Modal */}
      <InstallInstructionModal
        isOpen={showInstallInstructions}
        onClose={() => setShowInstallInstructions(false)}
      />
    </div>
  );
}
