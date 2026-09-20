'use client';

import React from 'react';
import { X, Smartphone, Share, MoreVertical, PlusSquare, Monitor, CheckCircle2 } from 'lucide-react';

interface InstallInstructionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InstallInstructionModal({ isOpen, onClose }: InstallInstructionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0c0d10] border border-white/[0.1] rounded-3xl shadow-2xl p-6 overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute -top-20 -right-20 w-44 h-44 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-sm">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white tracking-tight">Install study.io</h3>
              <p className="text-xs text-neutral-400">Add to your Home Screen</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-xl hover:bg-white/[0.06] transition-colors cursor-pointer"
            aria-label="Close installation instructions"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="py-4 space-y-4">
          {/* Highlighted primary instruction as requested */}
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-200 leading-relaxed flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <span>
              To install study.io, tap the browser menu (...) and select <strong>&apos;Install app&apos;</strong> or <strong>&apos;Add to Home Screen&apos;</strong>.
            </span>
          </div>

          {/* Quick Platform Guides */}
          <div className="space-y-2.5">
            {/* iOS Safari Guide */}
            <div className="p-3 rounded-2xl bg-neutral-900/50 border border-white/[0.06] space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Share className="w-3.5 h-3.5 text-cyan-400" />
                <span>Apple iOS (Safari)</span>
              </div>
              <ol className="text-[11px] text-neutral-400 space-y-1 list-decimal list-inside pl-1 leading-normal">
                <li>Tap the <strong className="text-neutral-200">Share</strong> icon at the bottom of Safari.</li>
                <li>Scroll down and select <strong className="text-neutral-200">&apos;Add to Home Screen&apos;</strong>.</li>
                <li>Tap <strong className="text-neutral-200">&apos;Add&apos;</strong> in the top-right corner.</li>
              </ol>
            </div>

            {/* Android / Chrome / Edge Guide */}
            <div className="p-3 rounded-2xl bg-neutral-900/50 border border-white/[0.06] space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <MoreVertical className="w-3.5 h-3.5 text-teal-400" />
                <span>Android / Chrome / Edge</span>
              </div>
              <ol className="text-[11px] text-neutral-400 space-y-1 list-decimal list-inside pl-1 leading-normal">
                <li>Tap the <strong className="text-neutral-200">three dots (...)</strong> menu in the upper right.</li>
                <li>Tap <strong className="text-neutral-200">&apos;Install app&apos;</strong> or <strong className="text-neutral-200">&apos;Add to Home screen&apos;</strong>.</li>
              </ol>
            </div>

            {/* Desktop Guide */}
            <div className="p-3 rounded-2xl bg-neutral-900/50 border border-white/[0.06] space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Monitor className="w-3.5 h-3.5 text-emerald-400" />
                <span>Desktop (Chrome / Edge)</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-normal pl-1">
                Click the <strong className="text-neutral-200">Install icon</strong> in your browser&apos;s address bar or open the browser menu and click <strong className="text-neutral-200">&apos;Install study.io&apos;</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/[0.08]">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-neutral-200 text-slate-950 font-bold text-sm transition-all active:scale-[0.99] shadow-lg shadow-white/5 cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
