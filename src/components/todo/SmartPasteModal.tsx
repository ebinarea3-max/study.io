'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Sparkles, X, ClipboardPaste, CheckCircle2, Trash2 } from 'lucide-react';
import { parseSmartTasks } from '../../lib/smartTaskParser';
import { soundFx } from '../../lib/audio';

interface SmartPasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (tasks: string[]) => Promise<void> | void;
}

export function SmartPasteModal({ isOpen, onClose, onImport }: SmartPasteModalProps) {
  const [inputText, setInputText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Automatically parse tasks as input changes
  const parsedTasks = useMemo(() => {
    return parseSmartTasks(inputText);
  }, [inputText]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 50);
    } else {
      setInputText('');
    }
  }, [isOpen]);

  // Handle ESC and Ctrl+Enter keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        if (parsedTasks.length > 0) {
          handleImportSubmit();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, parsedTasks]);

  const handlePasteFromClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setInputText(text);
          soundFx.playReactionPop();
        }
      }
    } catch (err) {
      console.warn('Clipboard read error:', err);
    }
  };

  const handleImportSubmit = async () => {
    if (parsedTasks.length === 0 || isImporting) return;
    setIsImporting(true);
    try {
      await onImport(parsedTasks);
      onClose();
    } finally {
      setIsImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[var(--border)] bg-[var(--surface-2)]/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-hud font-bold tracking-wider uppercase text-[var(--text)] flex items-center gap-2">
                Smart Task Importer
              </h3>
              <p className="text-[11px] text-[var(--text-dim)] font-sans">
                Paste WhatsApp messages, syllabi, or notes. Bullets and line-wraps are auto-cleaned.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-fg/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
          {/* Action Bar */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-hud-mono uppercase tracking-wider text-[var(--text-dim)]">
              Paste raw text below:
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePasteFromClipboard}
                className="px-2.5 py-1 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-3)] text-xs font-hud-mono font-bold tracking-wider uppercase flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
              >
                <ClipboardPaste className="w-3.5 h-3.5 text-amber-400" />
                <span>Paste from Clipboard</span>
              </button>
              {inputText && (
                <button
                  type="button"
                  onClick={() => setInputText('')}
                  className="px-2 py-1 rounded-lg text-[var(--text-dim)] hover:text-rose-400 text-xs font-hud-mono flex items-center gap-1 transition-colors cursor-pointer"
                  title="Clear text"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Raw Text Input */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              rows={6}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder={`e.g. Paste here:\n1. Digital Electronics Module 3\n   a) State table\n   b) Reduced state table\n6. All flipflops characteristic equation\nand excitation table design using\nnand gate\n7. Shift registers:\n- SISO\n- SIPO`}
              className="w-full p-3 rounded-xl bg-[var(--surface-2)]/60 border border-[var(--border)] text-[var(--text)] text-xs sm:text-sm font-sans placeholder:text-[var(--text-faint)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30 resize-none transition-all leading-relaxed"
            />
          </div>

          {/* Live Parsed Preview */}
          {parsedTasks.length > 0 && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs font-hud-mono uppercase tracking-wider">
                <span className="text-amber-400 font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  {parsedTasks.length} {parsedTasks.length === 1 ? 'Task' : 'Tasks'} Detected
                </span>
                <span className="text-[var(--text-faint)] text-[10px]">Ready to add</span>
              </div>

              <div className="max-h-48 overflow-y-auto rounded-xl bg-[var(--surface-2)]/40 border border-[var(--border)] p-2 space-y-1.5 divide-y divide-[var(--border)]/30">
                {parsedTasks.map((task, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 pt-1.5 first:pt-0 text-xs text-[var(--text)]"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5 opacity-80" />
                    <span className="leading-snug break-words flex-1">{task}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-t border-[var(--border)] bg-[var(--surface-2)]/40">
          <div className="text-[11px] text-[var(--text-dim)] font-mono hidden sm:block">
            Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-[var(--surface-3)] border border-[var(--border)] text-[10px]">Ctrl+Enter</kbd> to add
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[var(--border)] text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] text-xs font-hud-mono font-bold tracking-wider uppercase transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={parsedTasks.length === 0 || isImporting}
              onClick={handleImportSubmit}
              className="px-5 py-2 rounded-xl text-xs font-hud-mono font-bold tracking-wider uppercase transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50 active:scale-95 hover:brightness-110"
              style={{
                backgroundColor: 'var(--accent)',
                color: 'var(--accent-contrast)',
              }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {isImporting
                  ? 'Adding...'
                  : `Add ${parsedTasks.length > 0 ? parsedTasks.length : ''} Task${parsedTasks.length === 1 ? '' : 's'}`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

