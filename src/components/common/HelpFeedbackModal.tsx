'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  HelpCircle,
  Bug,
  MessageSquare,
  Sparkles,
  Paperclip,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { submitReport } from '../../app/actions/report';
import { getSupabase } from '../../lib/supabase';
import { useRankTheme } from '../../hooks/useRankTheme';

interface HelpFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  { id: 'Bug', label: 'Bug Report', icon: Bug },
  { id: 'Feedback', label: 'Feature & Feedback', icon: MessageSquare },
  { id: 'Timer', label: 'Timer & RP', icon: Sparkles },
  { id: 'UI Glitch', label: 'UI Glitch', icon: AlertCircle },
];

export function HelpFeedbackModal({ isOpen, onClose }: HelpFeedbackModalProps) {
  const { theme } = useRankTheme();
  const [category, setCategory] = useState('Bug');
  const [message, setMessage] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isSubmitting]);

  // Reset form when opened
  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      setIsSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('Screenshot file size must be under 5MB.');
        return;
      }
      setScreenshot(file);
      const url = URL.createObjectURL(file);
      setScreenshotPreview(url);
      setErrorMessage('');
    }
  };

  const clearScreenshot = () => {
    setScreenshot(null);
    if (screenshotPreview) {
      URL.revokeObjectURL(screenshotPreview);
      setScreenshotPreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      let uploadedImageUrl: string | null = null;

      if (screenshot) {
        const supabase = getSupabase();
        if (supabase) {
          const fileExt = screenshot.name.split('.').pop() || 'png';
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          const { error: uploadError } = await supabase.storage
            .from('report-screenshots')
            .upload(fileName, screenshot);

          if (!uploadError) {
            const { data: publicUrlData } = supabase.storage
              .from('report-screenshots')
              .getPublicUrl(fileName);
            uploadedImageUrl = publicUrlData?.publicUrl || null;
          }
        }
      }

      const formData = new FormData();
      formData.append('category', category);
      formData.append('message', message.trim());
      if (uploadedImageUrl) {
        formData.append('imageUrl', uploadedImageUrl);
      }

      const res = await submitReport(formData);

      if (res.success) {
        setIsSuccess(true);
        toast.success('Thank you! Your feedback has been sent.');
        setTimeout(() => {
          setMessage('');
          clearScreenshot();
          onClose();
        }, 1800);
      } else {
        setErrorMessage(res.error || 'Failed to submit report. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred while sending.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-modal-title"
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl p-6 sm:p-7 overflow-hidden flex flex-col"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-5 right-5 p-2 rounded-xl text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
          aria-label="Close help modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-xs"
            style={{
              backgroundColor: 'var(--surface-2)',
              borderColor: 'var(--border)',
              color: theme.accent,
            }}
          >
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 id="help-modal-title" className="text-lg font-hud font-bold tracking-wider uppercase text-[var(--text)]">
              Help &amp; Feedback
            </h2>
            <p className="text-xs text-[var(--text-dim)] font-mono">
              Report a bug, suggest an improvement, or share feedback
            </p>
          </div>
        </div>

        {/* Success Feedback View */}
        {isSuccess ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-hud font-bold uppercase text-[var(--text)]">
              Report Submitted
            </h3>
            <p className="text-xs text-[var(--text-dim)] max-w-sm">
              Thank you for helping us improve study.io! Our team reviews all incoming reports and feedback.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Category Selector Chips */}
            <div>
              <label className="block text-[10px] font-hud uppercase tracking-wider text-[var(--text-dim)] mb-2">
                Select Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CATEGORIES.map((cat) => {
                  const isSelected = category === cat.id;
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`px-2.5 py-2 rounded-xl text-xs font-hud font-semibold flex items-center justify-center gap-1.5 transition-all border cursor-pointer ${
                        isSelected
                          ? 'border-[var(--accent)] text-[var(--text)] shadow-xs'
                          : 'bg-[var(--surface-2)]/60 text-[var(--text-dim)] border-[var(--border)] hover:text-[var(--text)] hover:border-[var(--border-strong)]'
                      }`}
                      style={
                        isSelected
                          ? {
                              backgroundColor: 'var(--surface-2)',
                              borderColor: theme.accent,
                              color: theme.accent,
                            }
                          : undefined
                      }
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description Textarea */}
            <div>
              <label className="block text-[10px] font-hud uppercase tracking-wider text-[var(--text-dim)] mb-2">
                Description &amp; Details
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What happened? What did you expect to happen? Any detail helps us solve it quickly..."
                rows={4}
                required
                className="w-full px-3.5 py-2.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-xs text-[var(--text)] placeholder-[var(--text-dim)] focus:outline-hidden focus:border-[var(--accent)] transition-colors font-mono resize-none"
              />
            </div>

            {/* Screenshot Attachment */}
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
              />
              {!screenshotPreview ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/60 hover:bg-[var(--surface-2)] text-xs font-hud font-bold tracking-wider text-[var(--text-dim)] hover:text-[var(--text)] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>Attach Screenshot (Optional)</span>
                </button>
              ) : (
                <div className="flex items-center gap-2.5">
                  <div className="relative group">
                    <img
                      src={screenshotPreview}
                      alt="Preview"
                      className="h-12 w-12 object-cover rounded-lg border border-[var(--border)] shadow-md"
                    />
                    <button
                      type="button"
                      onClick={clearScreenshot}
                      className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-0.5 shadow-md hover:bg-rose-600 transition-colors"
                      title="Remove screenshot"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="text-[11px] font-mono text-[var(--text-dim)] truncate max-w-[200px]">
                    {screenshot?.name}
                  </span>
                </div>
              )}
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-mono text-rose-400">
                {errorMessage}
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-hud font-semibold text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !message.trim()}
                className="px-5 py-2.5 rounded-xl font-hud font-bold text-xs uppercase tracking-wider text-[var(--accent-contrast)] bg-[var(--accent)] hover:brightness-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Report</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
