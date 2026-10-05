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
  Bug,
  Send,
} from 'lucide-react';
import { submitReport } from '../../app/actions/report';
import { soundFx } from '../../lib/audio';
import { useAuth } from '../../context/AuthContext';
import { usePwaInstall } from '../../hooks/usePwaInstall';
import { InstallInstructionModal } from './InstallInstructionModal';
import { useRankTheme } from '../../hooks/useRankTheme';
import { getSupabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { user, deleteAccount, updateProfile } = useAuth();
  const { canInstall, isInstalled, isPrompting, deferredPrompt, triggerInstall } = usePwaInstall();
  const { theme } = useRankTheme();

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [typedEmail, setTypedEmail] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [showInstallInstructions, setShowInstallInstructions] = useState(false);
  
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportCategory, setReportCategory] = useState('Bug');
  const [reportMessage, setReportMessage] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const [reportError, setReportError] = useState('');

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

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsReporting(true);
    setReportError('');

    const formData = new FormData();
    formData.append('category', reportCategory);
    formData.append('message', reportMessage);

    const res = await submitReport(formData);
    setIsReporting(false);
    
    if (res.success) {
      toast.success('Report submitted successfully! Thank you.');
      setShowReportForm(false);
      setReportMessage('');
      setReportCategory('Bug');
    } else {
      setReportError(res.error || 'Failed to send report.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white/[0.07] backdrop-blur-3xl border border-white/20 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.7)] p-6 sm:p-7 overflow-hidden max-h-[90vh] overflow-y-auto"
        style={{ borderColor: `${theme.accent}30` }}
      >
        {/* Ambient background lighting */}
        <div
          className="absolute -top-24 -right-24 w-52 h-52 rounded-full blur-3xl pointer-events-none opacity-15"
          style={{ backgroundColor: theme.accent }}
        />
        <div className="absolute -bottom-24 -left-24 w-52 h-52 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center shadow-sm"
              style={{ color: theme.accent }}
            >
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-hud font-extrabold text-base text-white tracking-wider uppercase">
                Settings &amp; Preferences
              </h3>
              <p className="text-xs text-neutral-400 font-mono tracking-tight mt-0.5">
                Audio synthesizer, preferences &amp; account controls
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-white/[0.08] transition-colors cursor-pointer"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-4 relative z-10">
          {/* Section 1: Account & Avatar */}
          <div className="p-4 rounded-xl bg-white/[0.03] backdrop-blur-md border border-white/[0.08] flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative">
                  <div
                    className="w-12 h-12 rounded-xl border border-white/15 flex items-center justify-center font-bold text-slate-950 text-lg flex-shrink-0 shadow-md overflow-hidden relative"
                    style={{ background: theme.accent }}
                  >
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : user.displayName ? (
                      user.displayName.slice(0, 2).toUpperCase()
                    ) : (
                      <User className="w-6 h-6" />
                    )}
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-white truncate tracking-tight">{user.displayName || 'Scholar'}</div>
                  <div className="text-xs text-neutral-400 font-mono truncate">{user.email}</div>
                </div>
              </div>
              <div className="flex-shrink-0 self-start">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/10 text-[11px] font-mono text-zinc-300">
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: theme.accent }} />
                  <span>Cloud Synced</span>
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Audio & Focus Synthesizer */}
          <div className="p-4 rounded-xl bg-white/[0.03] backdrop-blur-md border border-white/[0.08] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center flex-shrink-0"
                style={{ color: theme.accent }}
              >
                <Volume2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-hud font-bold tracking-wider text-white uppercase">Audio &amp; Focus Synthesizer</div>
                <div className="text-[11px] text-neutral-400 font-mono">Zero-latency Web Audio soundscapes &amp; session bells</div>
              </div>
            </div>
            <button
              type="button"
              onClick={testAudio}
              className="px-3.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-hud font-bold tracking-wider text-white transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-sm flex-shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" style={{ color: theme.accent }} />
              <span>TEST CHIMES</span>
            </button>
          </div>

          {/* Section: Install App / Add to Home Screen */}
          <div className="p-4 rounded-xl bg-white/[0.03] backdrop-blur-md border border-white/[0.08] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center flex-shrink-0"
                style={{ color: theme.accent }}
              >
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-hud font-bold tracking-wider text-white uppercase">Install App / Progressive Web App</div>
                <div className="text-[11px] text-neutral-400 font-mono">Install Study.io on your device for standalone focus</div>
              </div>
            </div>

            {isInstalled ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/10 text-emerald-400 text-xs font-mono font-medium flex-shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Installed</span>
              </div>
            ) : canInstall ? (
              <button
                type="button"
                onClick={handleInstallClick}
                disabled={isPrompting}
                className="px-3.5 py-1.5 rounded-xl text-slate-950 text-xs font-hud font-extrabold tracking-wider transition-all active:scale-95 flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50 flex-shrink-0"
                style={{ background: theme.accent }}
              >
                {isPrompting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>INSTALL APP</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleInstallClick}
                className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-hud font-bold tracking-wider text-zinc-200 hover:text-white transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-sm flex-shrink-0"
                title="View manual install instructions"
              >
                <Smartphone className="w-3.5 h-3.5" style={{ color: theme.accent }} />
                <span>ADD TO HOME</span>
              </button>
            )}
          </div>

          {/* Section: Report a Problem */}
          <div className="p-4 rounded-xl bg-white/[0.03] backdrop-blur-md border border-white/[0.08] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center flex-shrink-0"
                style={{ color: theme.accent }}
              >
                <Bug className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-hud font-bold tracking-wider text-white uppercase">Report a Problem</div>
                <div className="text-[11px] text-neutral-400 font-mono">Found a bug or have feedback? Let us know.</div>
              </div>
            </div>
            
            <button
              type="button"
              onClick={() => setShowReportForm(!showReportForm)}
              className="px-3.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-hud font-bold tracking-wider text-white transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-sm flex-shrink-0"
            >
              <span>{showReportForm ? 'CANCEL' : 'REPORT'}</span>
            </button>
          </div>

          {showReportForm && (
            <div className="p-4 rounded-xl bg-white/[0.05] border border-white/10 space-y-3 animate-in fade-in zoom-in-95 duration-200">
              <form onSubmit={handleReportSubmit} className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {['Bug', 'Timer', 'UI Glitch', 'Feedback'].map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setReportCategory(cat)}
                      className={`px-3 py-1 rounded-full text-[10px] font-hud font-bold tracking-wider transition-colors border ${reportCategory === cat ? 'bg-white/20 text-white border-white/30' : 'bg-transparent text-neutral-400 border-white/10 hover:border-white/20 hover:text-white'}`}
                    >
                      {cat.toUpperCase()}
                    </button>
                  ))}
                </div>
                <textarea
                  value={reportMessage}
                  onChange={(e) => setReportMessage(e.target.value)}
                  placeholder="Describe the issue you encountered..."
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/30 transition-colors font-mono min-h-[80px]"
                  required
                />
                {reportError && (
                  <div className="text-xs text-rose-400 font-medium font-mono">{reportError}</div>
                )}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isReporting || !reportMessage.trim()}
                    className="px-4 py-2 rounded-xl text-slate-950 text-xs font-hud font-extrabold tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-md"
                    style={{ background: theme.accent }}
                  >
                    {isReporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>{isReporting ? 'SENDING...' : 'SUBMIT REPORT'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Section 4: High-Security Danger Zone (Delete Account) */}
          <div className="p-4 rounded-xl bg-rose-500/[0.03] border border-rose-500/20 backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <div>
                  <div className="text-xs font-hud font-bold tracking-wider text-rose-400 uppercase">Danger Zone</div>
                  <div className="text-[11px] text-neutral-400 font-mono">Permanent account and focus session data purge</div>
                </div>
              </div>

              {!showDeleteConfirmation && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirmation(true)}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-hud font-bold tracking-wider transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>DELETE ACCOUNT</span>
                </button>
              )}
            </div>

            {showDeleteConfirmation && (
              <div className="pt-2 border-t border-rose-500/20 space-y-3 animate-in fade-in duration-150">
                <p className="text-xs text-rose-300 leading-relaxed font-mono">
                  This action is permanent and cannot be undone. All your study sessions, streaks, and rank standings will be purged.
                </p>

                <div className="space-y-1.5">
                  <label className="block text-[11px] text-neutral-400 font-mono">
                    Type your email to confirm:{' '}
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
                  <div className="text-xs text-rose-400 font-medium font-mono">{deleteError}</div>
                )}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteConfirmation(false);
                      setTypedEmail('');
                      setDeleteError('');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-neutral-400 hover:text-white text-xs font-hud font-bold tracking-wider transition-colors cursor-pointer"
                  >
                    CANCEL
                  </button>
                  <button
                    type="button"
                    disabled={!canDelete || isDeleting}
                    onClick={handleDeleteAccount}
                    className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-hud font-bold tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-md shadow-rose-600/30 cursor-pointer"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>PURGING...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>PERMANENTLY PURGE ACCOUNT</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Action: Single Clean 'Done' Button */}
        <div className="pt-3 border-t border-white/10 relative z-10">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl text-slate-950 font-hud font-extrabold text-xs tracking-wider transition-all active:scale-[0.99] shadow-lg cursor-pointer uppercase"
            style={{ background: theme.accent }}
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
