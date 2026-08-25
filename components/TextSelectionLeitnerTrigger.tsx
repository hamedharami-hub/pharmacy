'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, Copy, Check, X, BookOpen, Layers } from 'lucide-react';
import { Language } from '@/types/pharmacy';

interface TextSelectionLeitnerTriggerProps {
  language: Language;
  onOpenLeitnerModal: (text: string, defaultModule?: 1 | 2 | 4, category?: string, topic?: string) => void;
}

export const TextSelectionLeitnerTrigger: React.FC<TextSelectionLeitnerTriggerProps> = ({
  language,
  onOpenLeitnerModal,
}) => {
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(() => {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  });
  const triggerRef = useRef<HTMLDivElement>(null);
  const isFa = language === 'fa';

  const inspectSelection = useCallback(() => {
    if (typeof window === 'undefined') return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) {
      // Don't immediately clear if the click is on the trigger button itself
      return;
    }

    const text = selection.toString().trim();
    // Valid text snippet: at least 3 characters, up to 4000 characters
    if (text.length < 3 || text.length > 4000) {
      setCoords(null);
      setSelectedText('');
      return;
    }

    // Ignore if selection originates inside an input, textarea, or editable element
    const anchorNode = selection.anchorNode;
    if (anchorNode) {
      const element = anchorNode.nodeType === Node.ELEMENT_NODE ? (anchorNode as Element) : anchorNode.parentElement;
      if (element?.closest('input, textarea, [contenteditable="true"], .no-leitner-trigger, .no-text-select-ai')) {
        setCoords(null);
        setSelectedText('');
        return;
      }
    }

    try {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        setCoords(null);
        setSelectedText('');
        return;
      }

      // Position floating bubble with viewport safety (fixed positioning)
      const top = Math.max(12, rect.top - 46);
      const left = Math.min(
        window.innerWidth - 190,
        Math.max(12, rect.left + rect.width / 2 - 80)
      );

      setSelectedText(text);
      setCoords({ top, left });
    } catch {
      // Range might be invalid during DOM shifts
    }
  }, []);

  useEffect(() => {
    let debounceTimer: NodeJS.Timeout;
    const handleSelectionDebounced = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(inspectSelection, 120);
    };

    const handlePointerUp = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(inspectSelection, 80);
    };

    const handleDocumentMouseDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('.leitner-selection-bubble') || target?.closest('.leitner-selection-bar')) {
        return;
      }
      // If clicking outside, check if selection was collapsed
      setTimeout(() => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed) {
          setCoords(null);
          setSelectedText('');
        }
      }, 150);
    };

    document.addEventListener('selectionchange', handleSelectionDebounced);
    document.addEventListener('mouseup', handlePointerUp);
    document.addEventListener('touchend', handlePointerUp);
    document.addEventListener('mousedown', handleDocumentMouseDown);
    document.addEventListener('touchstart', handleDocumentMouseDown, { passive: true });

    return () => {
      clearTimeout(debounceTimer);
      document.removeEventListener('selectionchange', handleSelectionDebounced);
      document.removeEventListener('mouseup', handlePointerUp);
      document.removeEventListener('touchend', handlePointerUp);
      document.removeEventListener('mousedown', handleDocumentMouseDown);
      document.removeEventListener('touchstart', handleDocumentMouseDown);
    };
  }, [inspectSelection]);

  const handleLaunchModal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedText) return;

    onOpenLeitnerModal(selectedText);
    setCoords(null);
    setSelectedText('');
  };

  const handleCopyText = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedText) return;

    navigator.clipboard.writeText(selectedText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCoords(null);
    setSelectedText('');
    window.getSelection()?.removeAllRanges();
  };

  if (!selectedText) return null;

  const wordCount = selectedText.split(/\s+/).filter(Boolean).length;
  const previewSnippet =
    selectedText.length > 55 ? `${selectedText.substring(0, 55)}...` : selectedText;

  return (
    <>
      {/* 1. Desktop Floating Quick Pill (Above/Near Selection) */}
      {coords && (
        <div
          ref={triggerRef}
          style={{
            position: 'fixed',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            zIndex: 99999,
          }}
          className="leitner-selection-bubble animate-in fade-in zoom-in-95 duration-150 hidden md:block"
        >
          <div className="flex items-center gap-1 p-1 rounded-full bg-slate-950/95 border border-purple-500/50 shadow-2xl backdrop-blur-md">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleLaunchModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-linear-to-r from-purple-600 via-indigo-600 to-sky-600 text-white font-bold text-xs shadow-md hover:shadow-purple-500/40 hover:scale-105 active:scale-95 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>{isFa ? '✨ ساخت کارت لایتنر' : '✨ AI Leitner Card'}</span>
            </button>

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleCopyText}
              className="p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title={isFa ? 'کپی متن انتخابی' : 'Copy selected text'}
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleDismiss}
              className="p-1.5 rounded-full text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
              title={isFa ? 'بستن' : 'Dismiss'}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Responsive Mobile & Global Bottom Dock (Always accessible on touch/mobile without conflicting with browser menus) */}
      <div
        style={{ zIndex: 99998 }}
        className="leitner-selection-bar fixed bottom-20 md:bottom-6 inset-x-3 sm:inset-x-auto sm:right-6 sm:max-w-md animate-in slide-in-from-bottom-5 fade-in duration-200"
      >
        <div className="p-3 rounded-2xl bg-slate-950/95 border border-purple-500/50 shadow-2xl backdrop-blur-xl flex flex-col gap-2">
          {/* Header Row: Word Count & Snippet Preview */}
          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 min-w-0 text-purple-300">
              <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
              <span className="font-bold truncate">
                {isFa ? `${wordCount} کلمه انتخاب شد:` : `${wordCount} words selected:`}
              </span>
              <span className="text-[11px] text-slate-400 truncate opacity-90 hidden xs:inline">
                «{previewSnippet}»
              </span>
            </div>

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleDismiss}
              className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition shrink-0"
              title={isFa ? 'بستن' : 'Close'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleLaunchModal}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-linear-to-r from-purple-600 via-indigo-600 to-sky-600 text-white font-bold text-xs shadow-lg hover:shadow-purple-500/30 active:scale-98 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>
                {isFa
                  ? 'تولید کارت‌های لایتنر و درخت دانش با هوش مصنوعی'
                  : 'Generate Leitner Cards & Knowledge Tree with AI'}
              </span>
            </button>

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleCopyText}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer shrink-0"
              title={isFa ? 'کپی متن' : 'Copy'}
            >
              {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
