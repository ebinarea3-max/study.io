'use client';

import React, { useState } from 'react';
import {
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
  Trophy,
} from 'lucide-react';
import { soundFx } from '../../lib/audio';
import { useAuth } from '../../context/AuthContext';
import { usePwaInstall } from '../../hooks/usePwaInstall';
import { InstallInstructionModal } from './InstallInstructionModal';
import { useRankTheme } from '../../hooks/useRankTheme';

export function SettingsTabContent() {
  const { user, deleteAccount } = useAuth();
  const { canInstall, isInstalled, isPrompting, deferredPrompt, triggerInstall } = usePwaInstall();
  const { theme, userRank } = useRankTheme();

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [typedEmail, setTypedEmail] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [showInstallInstructions, setShowInstallInstructions] = useState(false);

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
    } catch {
      setDeleteError('Account deletion encountered an issue. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5 pb-24 md:pb-8">
      {/* HUD Header Banner */}
      <div className="relative p-5 sm:p-6 rounded-2xl hud-surface hud-corner-frame overflow-hidden">
        <div className="hud-corner-bracket hud-corner-tl" />
        <div className="hud-corner-bracket hud-corner-tr" />
        <div className="hud-corner-bracket hud-corner-bl" />
        <div className="hud-corner-bracket hud-corner-br" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center font-hud text-slate-950 text-base font-black shadow-md flex-shrink-0"
              style={{ background: theme.gradient, boxShadow: `0 0 16px ${theme.glow}` }}
            >
              <ShieldCheck className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-hud text-lg sm:text-xl font-black text-white tracking-wider uppercase">
                  SYSTEM CONFIG &amp; PREFERENCES
                </h2>
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-hud font-bold tracking-widest uppercase border"
                  style={{
                    backgroundColor: theme.badgeBg,
                    borderColor: `${theme.accent}50`,
                    color: theme.accent,
                  }}
                >
                  ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Device telemetry, audio synthesizers, rank protocols, and security parameters.
              </p>
            </div>
          </div>

          <div
            className="px-3.5 py-1.5 rounded-xl border flex items-center gap-2 self-start sm:self-auto"
            style={{
              backgroundColor: theme.badgeBg,
              borderColor: `${theme.accent}40`,
            }}
          >
            <Trophy className="w-4 h-4" style={{ color: theme.accent }} />
            <span className="font-hud text-xs font-bold tracking-wider" style={{ color: theme.textAccent }}>
              {userRank.fullTitle} // {userRank.rp} RP
            </span>
          </div>
        </div>
      </div>

      {/* Account & Session Telemetry */}
      <div className="p-5 rounded-2xl hud-surface border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center font-hud font-black text-slate-950 text-base flex-shrink-0 shadow-md"
            style={{ background: theme.gradient }}
          >
            {user.displayName ? user.displayName.slice(0, 2).toUpperCase() : <User className="w-6 h-6" />}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-hud font-bold text-white tracking-wide truncate">
              {user.displayName || 'Focus Operator'}
            </div>
            <div className="text-xs font-mono text-slate-400 truncate">{user.email}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-hud font-bold tracking-wider uppercase"
            style={{
              backgroundColor: theme.badgeBg,
              borderColor: `${theme.accent}40`,
              color: theme.textAccent,
            }}
          >
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: theme.accent }} />
            <span>CLOUD SYNCHRONIZED</span>
          </span>
        </div>
      </div>

      {/* Audio Synthesizer */}
      <div className="p-5 rounded-2xl hud-surface border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border"
            style={{
              backgroundColor: theme.badgeBg,
              borderColor: `${theme.accent}30`,
              color: theme.accent,
            }}
          >
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-hud font-bold text-white tracking-wider uppercase">
              AUDIO &amp; CHIME SYNTHESIZER
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Zero-latency Web Audio focus frequencies and milestone alerts
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={testAudio}
          className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-xs font-hud font-bold tracking-wider text-white transition-all active:scale-95 flex items-center gap-2 cursor-pointer shadow-sm self-start sm:self-auto"
        >
          <Sparkles className="w-3.5 h-3.5" style={{ color: theme.accent }} />
          <span>TEST CHIMES</span>
        </button>
      </div>

      {/* PWA / Device Installation */}
      <div className="p-5 rounded-2xl hud-surface border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border"
            style={{
              backgroundColor: theme.badgeBg,
              borderColor: `${theme.accent}30`,
              color: theme.accent,
            }}
          >
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-hud font-bold text-white tracking-wider uppercase">
              STANDALONE CLIENT / PWA
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Launch study.io directly from your home screen in distraction-free mode
            </div>
          </div>
        </div>

        {isInstalled ? (
          <div
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-hud font-bold tracking-wider self-start sm:self-auto"
            style={{
              backgroundColor: theme.badgeBg,
              borderColor: `${theme.accent}40`,
              color: theme.accent,
            }}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>INSTALLED</span>
          </div>
        ) : canInstall ? (
          <button
            type="button"
            onClick={handleInstallClick}
            disabled={isPrompting}
            className="px-4 py-2 rounded-xl text-slate-950 text-xs font-hud font-bold tracking-wider transition-all active:scale-95 flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50 flex-shrink-0 self-start sm:self-auto"
            style={{ background: theme.gradient, boxShadow: `0 0 16px ${theme.glow}` }}
          >
            {isPrompting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>INSTALL CLIENT</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleInstallClick}
            className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-xs font-hud font-bold tracking-wider text-slate-200 transition-all active:scale-95 flex items-center gap-2 cursor-pointer shadow-sm flex-shrink-0 self-start sm:self-auto"
          >
            <Smartphone className="w-3.5 h-3.5" style={{ color: theme.accent }} />
            <span>ADD TO HOME SCREEN</span>
          </button>
        )}
      </div>

      {/* Security & Danger Zone */}
      <div className="p-5 rounded-2xl bg-rose-500/[0.05] border border-rose-500/20 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            <div>
              <div className="text-xs font-hud font-bold text-rose-300 tracking-wider uppercase">
                DANGER PROTOCOL
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Irreversible account deletion and profile data purge
              </div>
            </div>
          </div>

          {!showDeleteConfirmation && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirmation(true)}
              className="px-3.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/35 text-rose-300 text-xs font-hud font-bold tracking-wider transition-all active:scale-95 flex items-center gap-2 cursor-pointer self-start sm:self-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>PURGE ACCOUNT</span>
            </button>
          )}
        </div>

        {showDeleteConfirmation && (
          <div className="pt-3 border-t border-rose-500/20 space-y-3">
            <p className="text-xs text-rose-200 font-medium">
              Confirm by typing your email address <span className="font-mono text-white font-bold">{user.email}</span>:
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="email"
                value={typedEmail}
                onChange={(e) => setTypedEmail(e.target.value)}
                placeholder={user.email || ''}
                className="flex-1 px-3 py-2 rounded-xl bg-black/50 border border-rose-500/30 text-white text-xs font-mono focus:outline-none focus:border-rose-400"
              />
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={!canDelete || isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-hud font-bold tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>CONFIRM PURGE</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirmation(false);
                  setTypedEmail('');
                }}
                className="px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 text-xs font-hud font-bold tracking-wider"
              >
                CANCEL
              </button>
            </div>
            {deleteError && <div className="text-xs text-rose-400 font-medium">{deleteError}</div>}
          </div>
        )}
      </div>

      <InstallInstructionModal
        isOpen={showInstallInstructions}
        onClose={() => setShowInstallInstructions(false)}
      />
    </div>
  );
}
