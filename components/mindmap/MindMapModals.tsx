'use client';

import React, { useState } from 'react';
import { LeitnerCard } from '@/types/leitner';
import { Language } from '@/types/pharmacy';
import { MindMapNode } from '@/types/mindmap';
import { MINDMAP_THEMES } from '@/lib/mindmapLayout';
import { FLAG_OPTIONS, FlagColor } from '@/components/LeitnerMindMapPanel';
import {
  X,
  Eye,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Flag,
  Zap,
  Palette,
  Pencil,
  RotateCcw,
  Download,
  FileText,
  Code,
  Check,
  Award,
  Sparkles,
} from 'lucide-react';

/* ========================================================================= */
/* 1. QUESTION DETAIL MODAL & IN-NODE QUIZ                                   */
/* ========================================================================= */
export interface QuestionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: LeitnerCard | null;
  language: Language;
  cardLangMode: 'fa' | 'en' | 'bilingual';
  cardFlags: Record<string, FlagColor>;
  onSetCardFlag: (cardId: string, flag: FlagColor | null) => void;
  onRateCard?: (cardId: string, rating: 'again' | 'hard' | 'good' | 'easy') => void;
  onOpenAiTutor?: (topic: string) => void;
  showLeitnerGrading?: boolean;
}

export const QuestionDetailModal: React.FC<QuestionDetailModalProps> = ({
  isOpen,
  onClose,
  card,
  language,
  cardLangMode,
  cardFlags,
  onSetCardFlag,
  onRateCard,
  onOpenAiTutor,
  showLeitnerGrading = false,
}) => {
  const isFa = language === 'fa';
  const [isRevealed, setIsRevealed] = useState(false);
  const [selectedMcqOption, setSelectedMcqOption] = useState<string | null>(null);
  const [ratedRating, setRatedRating] = useState<'again' | 'hard' | 'good' | 'easy' | null>(null);

  // Sync state with prop safely when card changes
  const [prevCardId, setPrevCardId] = useState<string | null>(null);
  if (card && card.id !== prevCardId) {
    setPrevCardId(card.id);
    setIsRevealed(false);
    setSelectedMcqOption(null);
    setRatedRating(null);
  }

  if (!isOpen || !card) return null;

  const qFa = typeof card.question === 'object' ? card.question.fa || card.question.en : card.question;
  const qEn = typeof card.question === 'object' ? card.question.en || card.question.fa : card.question;
  const aFa = typeof card.answer === 'object' ? card.answer.fa || card.answer.en : card.answer;
  const aEn = typeof card.answer === 'object' ? card.answer.en || card.answer.fa : card.answer;
  const pFa = card.pearl ? (typeof card.pearl === 'object' ? card.pearl.fa : card.pearl) : null;
  const pEn = card.pearl ? (typeof card.pearl === 'object' ? card.pearl.en : card.pearl) : null;

  const currentFlag = cardFlags[card.id];
  const isMcq = card.type === 'mcq' && card.mcqOptions && card.mcqOptions.length > 0;

  const handleSelectOption = (key: string) => {
    setSelectedMcqOption(key);
    setIsRevealed(true);
  };

  const handleRate = (rating: 'again' | 'hard' | 'good' | 'easy') => {
    setRatedRating(rating);
    if (onRateCard) {
      onRateCard(card.id, rating);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-xl p-5 sm:p-7 rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-100">
                {showLeitnerGrading
                  ? isFa
                    ? 'آزمون و ارزیابی سوال لایتنر در نقشه (ماژول ۵)'
                    : 'In-Node Leitner Spaced Review (Module 5)'
                  : isFa
                  ? 'بررسی سناریو و پاسخ تشریحی بالینی'
                  : 'Clinical Question & Target Answer'}
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                {card.topic || 'Pharmacotherapy'} {showLeitnerGrading && `• Box ${card.box}`}
                {showLeitnerGrading && (!card.nextReviewDate || card.nextReviewDate <= new Date().toISOString())
                  ? isFa
                    ? ' 🔥 (موعد مرور امروز)'
                    : ' 🔥 (Due Today)'
                  : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Question Text (Full Text in Single Language) */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
          <div className="text-xs font-bold text-slate-400">{isFa ? 'صورت مسئله و سناریو:' : 'Scenario & Question:'}</div>
          {isFa ? (
            <div className="text-sm sm:text-base font-bold text-slate-100 leading-relaxed break-words whitespace-normal" dir="rtl">
              {qFa || qEn}
            </div>
          ) : (
            <div
              className="text-xs sm:text-sm font-semibold text-slate-100 leading-relaxed font-sans break-words whitespace-normal"
              dir="ltr"
            >
              {qEn || qFa}
            </div>
          )}
        </div>

        {/* INTERACTIVE MCQ CHOICES (IF MCQ TYPE) */}
        {isMcq && card.mcqOptions && (
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <span>{isFa ? 'گزینه‌های پاسخ (یک مورد را انتخاب کنید):' : 'Multiple Choice Options:'}</span>
            </div>
            <div className="space-y-2">
              {card.mcqOptions.map((opt, idx) => {
                const optText = isFa ? opt.text.fa || opt.text.en : opt.text.en || opt.text.fa;
                const optId = opt.id || String.fromCharCode(65 + idx);
                const isSelected = selectedMcqOption === optId;
                const isCorrect = opt.isCorrect;

                let optStyle = 'bg-slate-950/80 hover:bg-slate-800 border-slate-800 text-slate-200';
                if (isRevealed) {
                  if (isCorrect) {
                    optStyle = 'bg-emerald-950/60 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500/50';
                  } else if (isSelected && !isCorrect) {
                    optStyle = 'bg-rose-950/60 border-rose-500 text-rose-200 ring-1 ring-rose-500/50';
                  }
                } else if (isSelected) {
                  optStyle = 'bg-purple-950/60 border-purple-500 text-purple-200';
                }

                return (
                  <button
                    key={optId}
                    type="button"
                    onClick={() => handleSelectOption(optId)}
                    className={`w-full p-3 rounded-xl border text-start transition flex items-center justify-between gap-3 text-xs sm:text-sm cursor-pointer ${optStyle}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs shrink-0 text-slate-300">
                        {optId.toUpperCase()}
                      </span>
                      <span className="leading-relaxed break-words">{optText}</span>
                    </div>
                    {isRevealed && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                    {isRevealed && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Flag Selector - Shown only in Module 6 Knowledge Studio */}
        {!showLeitnerGrading && (
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Flag className="w-3.5 h-3.5 text-purple-400" />
                <span>{isFa ? 'انتخاب و تخصیص پرچم نشانه‌گذاری:' : 'Bookmark Flag:'}</span>
              </span>
              {currentFlag && (
                <button
                  type="button"
                  onClick={() => onSetCardFlag(card.id, null)}
                  className="text-[10px] text-rose-400 hover:underline cursor-pointer"
                >
                  {isFa ? 'حذف پرچم' : 'Clear flag'}
                </button>
              )}
            </div>
            <div className="flex items-center flex-wrap gap-1.5">
              {(Object.keys(FLAG_OPTIONS) as FlagColor[]).map((fKey) => {
                const opt = FLAG_OPTIONS[fKey];
                const isSelected = currentFlag === fKey;
                return (
                  <button
                    key={fKey}
                    type="button"
                    onClick={() => onSetCardFlag(card.id, isSelected ? null : fKey)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
                      isSelected ? `${opt.badge} ring-2 ring-white/30 shadow-md` : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${opt.dot}`} />
                    <span>{isFa ? opt.name.fa.split(' ')[0] : opt.name.en.split(' ')[0]}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Answer Content & Rationale */}
        {!isRevealed ? (
          <button
            type="button"
            onClick={() => setIsRevealed(true)}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 transition cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>{isFa ? 'نمایش پاسخ تشریحی و نکته بالینی' : 'Reveal Target Answer & Clinical Pearl'}</span>
          </button>
        ) : (
          <div className="p-4 sm:p-5 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-4 animate-in fade-in">
            <div className="space-y-1.5">
              <div className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{isFa ? 'پاسخ صحیح و استدلال بالینی:' : 'Target Clinical Answer:'}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                {isFa ? (
                  <div dir="rtl" className="whitespace-pre-line">{aFa || aEn}</div>
                ) : (
                  <div dir="ltr" className="font-sans whitespace-pre-line">
                    {aEn || aFa}
                  </div>
                )}
              </div>
            </div>

            {(isFa ? pFa || pEn : pEn || pFa) && (
              <div className="p-3.5 rounded-xl bg-amber-950/25 border border-amber-500/30 text-amber-200 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5 text-xs text-amber-400">
                  <Zap className="w-4 h-4" />
                  <span>{isFa ? 'نکته کلیدی و مروارید بالینی (Clinical Pearl):' : 'Key Clinical Pearl:'}</span>
                </div>
                <div dir={isFa ? 'rtl' : 'ltr'} className="text-xs leading-relaxed">
                  {isFa ? pFa || pEn : pEn || pFa}
                </div>
              </div>
            )}

            {/* LEITNER SM-2 RATING BUTTONS - ONLY SHOWN IN MODULE 5 */}
            {showLeitnerGrading ? (
              <div className="pt-3 border-t border-purple-500/30 space-y-2">
                <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>{isFa ? 'ثبت مستقیم در جعبه لایتنر:' : 'Grade Leitner Spaced Review:'}</span>
                  {ratedRating && (
                    <span className="text-emerald-400 text-[11px] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {isFa ? 'ثبت شد!' : 'Saved!'}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {/* 1. AGAIN */}
                  <button
                    type="button"
                    onClick={() => handleRate('again')}
                    className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                      ratedRating === 'again'
                        ? 'bg-rose-600 text-white border-rose-400 shadow-md ring-2 ring-rose-400'
                        : 'bg-rose-950/50 hover:bg-rose-900/70 border-rose-500/40 text-rose-200'
                    }`}
                  >
                    <span className="text-xs font-bold">{isFa ? 'تکرار (نادرست)' : 'Again'}</span>
                    <span className="text-[10px] text-rose-300/80 font-mono">{isFa ? 'جعبه ۱' : 'Box 1'}</span>
                  </button>

                  {/* 2. HARD */}
                  <button
                    type="button"
                    onClick={() => handleRate('hard')}
                    className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                      ratedRating === 'hard'
                        ? 'bg-amber-600 text-white border-amber-400 shadow-md ring-2 ring-amber-400'
                        : 'bg-amber-950/50 hover:bg-amber-900/70 border-amber-500/40 text-amber-200'
                    }`}
                  >
                    <span className="text-xs font-bold">{isFa ? 'سخت' : 'Hard'}</span>
                    <span className="text-[10px] text-amber-300/80 font-mono">{isFa ? '۲-۳ روز' : '2-3d'}</span>
                  </button>

                  {/* 3. GOOD */}
                  <button
                    type="button"
                    onClick={() => handleRate('good')}
                    className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                      ratedRating === 'good'
                        ? 'bg-emerald-600 text-white border-emerald-400 shadow-md ring-2 ring-emerald-400'
                        : 'bg-emerald-950/50 hover:bg-emerald-900/70 border-emerald-500/40 text-emerald-200'
                    }`}
                  >
                    <span className="text-xs font-bold">{isFa ? 'خوب' : 'Good'}</span>
                    <span className="text-[10px] text-emerald-300/80 font-mono">{isFa ? '۱ هفته' : '1w'}</span>
                  </button>

                  {/* 4. EASY */}
                  <button
                    type="button"
                    onClick={() => handleRate('easy')}
                    className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                      ratedRating === 'easy'
                        ? 'bg-sky-600 text-white border-sky-400 shadow-md ring-2 ring-sky-400'
                        : 'bg-sky-950/50 hover:bg-sky-900/70 border-sky-500/40 text-sky-200'
                    }`}
                  >
                    <span className="text-xs font-bold">{isFa ? 'آسان' : 'Easy'}</span>
                    <span className="text-[10px] text-sky-300/80 font-mono">{isFa ? '۲ هفته' : '2w'}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* IN MODULE 6: CLEAN COMPLETION / CLOSE ACTION */
              <div className="pt-2 flex items-center justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isFa ? 'تایید و بستن' : 'Done & Close'}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/* ========================================================================= */
/* 2. RENAME NODE ALIAS MODAL                                                */
/* ========================================================================= */
export interface RenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  node: MindMapNode | null;
  currentText: string;
  onSave: (canonicalKey: string, newTitle: string) => void;
  onReset: (canonicalKey: string) => void;
  language: Language;
}

export const RenameNodeModal: React.FC<RenameModalProps> = ({
  isOpen,
  onClose,
  node,
  currentText,
  onSave,
  onReset,
  language,
}) => {
  const isFa = language === 'fa';
  const [val, setVal] = useState(currentText);

  // Sync state with prop safely when node changes
  const [prevNodeId, setPrevNodeId] = useState<string | null>(null);
  if (node && node.id !== prevNodeId) {
    setPrevNodeId(node.id);
    setVal(currentText);
  }

  if (!isOpen || !node) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Pencil className="w-4 h-4 text-purple-400" />
            <h3 className="font-bold text-sm text-slate-100">
              {isFa ? 'تغییر عنوان شاخه نقشه ذهنی' : 'Rename Mind Map Branch'}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-slate-400">{isFa ? 'عنوان جدید نمایشی:' : 'New Display Title:'}</label>
          <input
            type="text"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-purple-500"
            autoFocus
          />
        </div>

        <div className="flex items-center justify-between gap-2 pt-2">
          <button
            type="button"
            onClick={() => onReset(node.canonicalKey)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isFa ? 'بازنشانی به پیش‌فرض' : 'Reset to Default'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
            >
              {isFa ? 'انصراف' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={() => onSave(node.canonicalKey, val)}
              className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow transition"
            >
              {isFa ? 'ذخیره عنوان' : 'Save Title'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ========================================================================= */
/* 3. COLOR PICKER MODAL                                                     */
/* ========================================================================= */
export interface ColorPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  node: MindMapNode | null;
  onSaveColor: (canonicalKey: string, colorKey: string) => void;
  language: Language;
}

export const ColorPickerModal: React.FC<ColorPickerModalProps> = ({
  isOpen,
  onClose,
  node,
  onSaveColor,
  language,
}) => {
  const isFa = language === 'fa';
  if (!isOpen || !node) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-purple-400" />
            <h3 className="font-bold text-sm text-slate-100">
              {isFa ? 'انتخاب رنگ شاخه' : 'Select Branch Palette'}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {Object.keys(MINDMAP_THEMES).map((cKey) => {
            const th = MINDMAP_THEMES[cKey];
            return (
              <button
                key={cKey}
                type="button"
                onClick={() => onSaveColor(node.canonicalKey, cKey)}
                className={`p-3 rounded-2xl border flex items-center gap-2.5 text-xs font-bold transition text-start ${th.bg} ${th.border} ${th.text} hover:scale-105`}
              >
                <span className={`w-3.5 h-3.5 rounded-full shrink-0 ${th.dot}`} />
                <span>{isFa ? th.name.fa : th.name.en}</span>
              </button>
            );
          })}
        </div>

        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={() => onSaveColor(node.canonicalKey, 'default')}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
          >
            {isFa ? 'استفاده از رنگ پیش‌فرض' : 'Reset to Default Color'}
          </button>
        </div>
      </div>
    </div>
  );
};
