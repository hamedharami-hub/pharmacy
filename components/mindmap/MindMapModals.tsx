'use client';

import React, { useState, useRef, useMemo } from 'react';
import { LeitnerCard } from '@/types/leitner';
import { Language } from '@/types/pharmacy';
import { MindMapNode, NodeCustomImage } from '@/types/mindmap';
import { MINDMAP_THEMES } from '@/lib/mindmapLayout';
import { FLAG_OPTIONS, FlagColor } from '@/components/LeitnerMindMapPanel';
import {
  generateAiInfographicPrompt,
  generateStructuredMarkdown,
  generateMermaidMindmap,
  traverseBranchNodes,
} from '@/lib/mindmapExportHelpers';
import { haptic } from '@/lib/haptics';
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
  Copy,
  Upload,
  Image as ImageIcon,
  Link as LinkIcon,
  Trash2,
  ExternalLink,
  Info,
  Layers,
  ZoomIn,
} from 'lucide-react';

/* ========================================================================= */
/* 1. QUESTION DETAIL MODAL & IN-NODE QUIZ                                   */
/* ========================================================================= */
export interface QuestionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: LeitnerCard | null;
  cardImage?: NodeCustomImage | null;
  onOpenImageModal?: () => void;
  onViewImage?: (image: NodeCustomImage) => void;
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
  cardImage,
  onOpenImageModal,
  onViewImage,
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
  const [copiedAiPrompt, setCopiedAiPrompt] = useState(false);

  // Sync state with prop safely when card changes
  const [prevCardId, setPrevCardId] = useState<string | null>(null);
  if (card && card.id !== prevCardId) {
    setPrevCardId(card.id);
    setIsRevealed(false);
    setSelectedMcqOption(null);
    setRatedRating(null);
    setCopiedAiPrompt(false);
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

  const handleCopyCardAiPrompt = () => {
    const singlePrompt = `### 🎯 CLINICAL TOPIC / CARD: ${card.topic || 'Pharmacology'}
- **Clinical Question (EN)**: ${qEn}
- **Clinical Question (FA)**: ${qFa}
- **Target Clinical Answer (EN)**: ${aEn}
- **Target Clinical Answer (FA)**: ${aFa}
${pEn || pFa ? `- **High-Yield Clinical Pearl**: ${pEn || pFa}` : ''}
${isMcq && card.mcqOptions ? `- **Options**: ${card.mcqOptions.map(o => `[${o.id}] ${typeof o.text === 'object' ? o.text.en : o.text}`).join(' | ')}` : ''}

### 🎨 INFOGRAPHIC DESIGN REQUEST:
Please generate a high-yield medical infographic summary for this clinical concept.
Create a structured diagram with color-coded comparison boxes, clinical pearls, contraindications, and exam mnemonics.`;

    navigator.clipboard.writeText(singlePrompt).then(() => {
      setCopiedAiPrompt(true);
      haptic.success();
      setTimeout(() => setCopiedAiPrompt(false), 2500);
    });
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

        {/* Attached Visual Reference / Image (if present) */}
        {cardImage && (
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-purple-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs text-purple-300 font-bold">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isFa ? 'تصویر و رفرنس بصری پیوست شده:' : 'Attached Visual Reference:'}</span>
              </span>
              {onOpenImageModal && (
                <button
                  type="button"
                  onClick={onOpenImageModal}
                  className="text-[10.5px] text-purple-400 hover:underline cursor-pointer"
                >
                  {isFa ? '✏️ ویرایش یا تعویض' : 'Edit / Change'}
                </button>
              )}
            </div>
            <div
              onClick={() => onViewImage?.(cardImage)}
              className="relative rounded-xl overflow-hidden border border-purple-500/40 bg-black/60 max-h-48 flex items-center justify-center cursor-zoom-in group/cardimg"
            >
              <img src={cardImage.url} alt="Attached" className="w-full max-h-48 object-contain group-hover/cardimg:scale-102 transition" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-between p-2 text-xs text-white">
                <span className="truncate max-w-[80%]">{cardImage.caption || (isFa ? 'برای بزرگنمایی کلیک کنید' : 'Click to zoom')}</span>
                <ZoomIn className="w-4 h-4 text-cyan-300" />
              </div>
            </div>
          </div>
        )}

        {/* Quick Action Tools Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {onOpenImageModal && (
            <button
              type="button"
              onClick={onOpenImageModal}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <ImageIcon className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>
                {cardImage
                  ? isFa ? '🖼️ مدیریت تصویر پیوست' : 'Manage Image'
                  : isFa ? '🖼️ افزودن عکس / اینفوگرافیک به این کارت' : 'Attach Image to Card'}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopyCardAiPrompt}
            className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              copiedAiPrompt
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                : 'bg-purple-950/40 hover:bg-purple-900/50 border-purple-500/40 text-purple-200'
            }`}
          >
            {copiedAiPrompt ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{isFa ? '✓ پرامپت کپی شد!' : '✓ Prompt Copied!'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                <span>{isFa ? '📋 کپی پرامپت برای ساخت اینفوگرافیک' : 'Copy AI Infographic Prompt'}</span>
              </>
            )}
          </button>
        </div>

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

/* ========================================================================= */
/* 4. BRANCH EXPORT & AI INFOGRAPHIC PROMPT MODAL                           */
/* ========================================================================= */
export interface BranchExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  node: MindMapNode | null;
  language: Language;
  nodeImages?: Record<string, NodeCustomImage>;
  onOpenAiGenerator?: (text: string) => void;
}

export const BranchExportModal: React.FC<BranchExportModalProps> = ({
  isOpen,
  onClose,
  node,
  language,
  nodeImages,
  onOpenAiGenerator,
}) => {
  const isFa = language === 'fa';
  const [exportFormat, setExportFormat] = useState<'ai_infographic' | 'markdown' | 'mermaid'>('ai_infographic');
  const [copied, setCopied] = useState(false);

  const metrics = useMemo(() => {
    if (!node) return null;
    return traverseBranchNodes(node).metrics;
  }, [node]);

  const generatedContent = useMemo(() => {
    if (!node) return '';
    if (exportFormat === 'ai_infographic') {
      return generateAiInfographicPrompt(node, language, nodeImages);
    }
    if (exportFormat === 'markdown') {
      return generateStructuredMarkdown(node, language);
    }
    return generateMermaidMindmap(node);
  }, [node, exportFormat, language, nodeImages]);

  if (!isOpen || !node) return null;

  const handleCopy = async () => {
    haptic.medium();
    try {
      await navigator.clipboard.writeText(generatedContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.warn('Clipboard copy failed:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in" dir={isFa ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-3xl p-5 sm:p-7 rounded-3xl bg-slate-900 border border-purple-500/40 shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40">
                <Sparkles className="w-5 h-5 text-purple-400" />
              </span>
              <h3 className="font-bold text-base sm:text-lg text-white">
                {isFa ? 'کپی جامع مطالب شاخه (ویژه ساخت اینفوگرافیک با هوش مصنوعی)' : 'Export Branch for AI & Infographics'}
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              {isFa
                ? `شاخه هدف: ${node.title.fa} (${node.title.en}) — استخراج کل سلسله‌مراتب و کارت‌های متصل تا عمیق‌ترین سطح`
                : `Target branch: ${node.title.en} (${node.title.fa}) — recursive knowledge export down to all leaves`}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metrics Bar */}
        {metrics && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 font-bold">
              🌲 {metrics.totalSubBranches} {isFa ? 'زیرشاخه فعال' : 'Sub-branches'}
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold">
              📇 {metrics.totalCards} {isFa ? 'فلش‌کارت بالینی' : 'Clinical Cards'}
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-300 font-bold">
              📊 {isFa ? `عمق سلسله‌مراتب: سطح ${metrics.maxDepth}` : `Max Depth: Level ${metrics.maxDepth}`}
            </span>
          </div>
        )}

        {/* Format Selector Tabs */}
        <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2 text-xs">
          <button
            type="button"
            onClick={() => {
              haptic.light();
              setExportFormat('ai_infographic');
            }}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer border ${
              exportFormat === 'ai_infographic'
                ? 'bg-purple-600 text-white border-purple-500 shadow-md'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{isFa ? '🎨 پرامپت هوش مصنوعی ساخت اینفوگرافیک' : '🎨 AI Infographic Prompt'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              haptic.light();
              setExportFormat('markdown');
            }}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer border ${
              exportFormat === 'markdown'
                ? 'bg-purple-600 text-white border-purple-500 shadow-md'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-cyan-300" />
            <span>{isFa ? '📝 مارک‌داون ساختاریافته' : '📝 Structured Markdown'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              haptic.light();
              setExportFormat('mermaid');
            }}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer border ${
              exportFormat === 'mermaid'
                ? 'bg-purple-600 text-white border-purple-500 shadow-md'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <Code className="w-3.5 h-3.5 text-emerald-300" />
            <span>{isFa ? '📊 کد دیاگرام Mermaid.js' : '📊 Mermaid Graph'}</span>
          </button>
        </div>

        {/* Content Preview Box */}
        <div className="flex-1 min-h-0 bg-slate-950 rounded-2xl border border-slate-800 p-3 overflow-hidden flex flex-col">
          <textarea
            readOnly
            value={generatedContent}
            className="w-full h-full bg-transparent text-xs font-mono text-slate-200 resize-none focus:outline-none overflow-y-auto leading-relaxed select-all"
            dir="ltr"
          />
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <span className="text-[11px] text-slate-400">
            {isFa
              ? '💡 متن کپی‌شده را در ChatGPT، Claude، Midjourney، Ideogram، Canva یا ابزارهای رسم دیاگرام قرار دهید.'
              : '💡 Paste this prompt into ChatGPT, Claude, Ideogram, Napkin, Canva, or Miro for visual generation.'}
          </span>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenAiGenerator && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAiGenerator(generatedContent);
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>{isFa ? 'ارسال به هوش مصنوعی برنامه' : 'Send to AI'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCopy}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg ${
                copied
                  ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                  : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>{isFa ? 'کپی شد! (Copied)' : 'Copied!'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>{isFa ? '📋 کپی کامل پرامپت و داده‌ها' : '📋 Copy Full Content'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ========================================================================= */
/* 5. ATTACH / EDIT NODE IMAGE MODAL                                         */
/* ========================================================================= */
export interface NodeImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  node: MindMapNode | null;
  currentImage?: NodeCustomImage | null;
  onSaveImage: (canonicalKey: string, image: NodeCustomImage | null) => void;
  language: Language;
}

export const NodeImageModal: React.FC<NodeImageModalProps> = ({
  isOpen,
  onClose,
  node,
  currentImage,
  onSaveImage,
  language,
}) => {
  const isFa = language === 'fa';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageUrl, setImageUrl] = useState<string>(currentImage?.url || '');
  const [caption, setCaption] = useState<string>(currentImage?.caption || '');
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Sync state with prop safely when node changes
  const [prevNodeId, setPrevNodeId] = useState<string | null>(null);
  if (node && node.id !== prevNodeId) {
    setPrevNodeId(node.id);
    setImageUrl(currentImage?.url || '');
    setCaption(currentImage?.caption || '');
    setUploadError(null);
  }

  if (!isOpen || !node) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError(isFa ? 'لطفاً یک فایل تصویری معتبر انتخاب کنید.' : 'Please select a valid image file.');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setUploadError(isFa ? 'حجم تصویر نباید بیشتر از ۸ مگابایت باشد.' : 'Image size must be less than 8MB.');
      return;
    }

    setUploadError(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!imageUrl.trim()) {
      onSaveImage(node.canonicalKey, null);
    } else {
      onSaveImage(node.canonicalKey, {
        url: imageUrl.trim(),
        caption: caption.trim() || undefined,
        addedAt: new Date().toISOString(),
      });
    }
    onClose();
  };

  const handleRemove = () => {
    onSaveImage(node.canonicalKey, null);
    setImageUrl('');
    setCaption('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in" dir={isFa ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-lg p-5 sm:p-6 rounded-3xl bg-slate-900 border border-purple-500/40 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40">
              <ImageIcon className="w-4 h-4 text-purple-400" />
            </span>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white">
                {isFa ? 'افزودن یا ویرایش تصویر شاخه' : 'Attach / Edit Branch Image'}
              </h3>
              <p className="text-xs text-slate-400 truncate max-w-xs">
                {node.title.fa} ({node.title.en})
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs: Upload vs URL */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{isFa ? '📁 بارگذاری از حافظه گوشی / کامپیوتر' : '📁 Upload Image File'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'url'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-950 text-slate-400 hover:text-white'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>{isFa ? '🔗 آدرس اینترنتی (Image URL)' : '🔗 Image Web URL'}</span>
          </button>
        </div>

        {/* Tab 1: Upload */}
        {activeTab === 'upload' && (
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-6 rounded-2xl border-2 border-dashed border-slate-700 hover:border-purple-500/80 bg-slate-950/60 hover:bg-purple-950/20 text-center cursor-pointer transition space-y-2"
            >
              <Upload className="w-8 h-8 mx-auto text-purple-400" />
              <p className="text-xs font-bold text-slate-200">
                {isFa ? 'برای انتخاب یا عکس گرفتن کلیک کنید' : 'Click to browse image or photo'}
              </p>
              <p className="text-[11px] text-slate-400">
                PNG, JPG, WEBP, SVG (حداکثر ۸ مگابایت)
              </p>
            </div>
            {uploadError && <p className="text-xs text-rose-400 font-medium">{uploadError}</p>}
          </div>
        )}

        {/* Tab 2: URL */}
        {activeTab === 'url' && (
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-medium">
              {isFa ? 'آدرس اینترنتی مستقیم تصویر (Direct Image URL):' : 'Direct Image URL:'}
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/diagram.png"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none font-mono"
              dir="ltr"
            />
          </div>
        )}

        {/* Caption */}
        <div className="space-y-1">
          <label className="text-xs text-slate-400 font-medium">
            {isFa ? 'توضیح یا زیرنویس تصویر (اختیاری):' : 'Image Caption / Description (Optional):'}
          </label>
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder={isFa ? 'مثال: فلوچارت تریاژ سرفه یا مکانیسم اثر داروی مهارکننده سیتوکروم' : 'e.g., Triage flowchart or CYP450 mechanism diagram'}
            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
          />
        </div>

        {/* Image Live Preview */}
        {imageUrl && (
          <div className="space-y-1.5 pt-1">
            <span className="text-xs text-slate-400 font-bold">{isFa ? 'پیش‌نمایش تصویر:' : 'Preview:'}</span>
            <div className="relative rounded-2xl overflow-hidden border border-slate-700 max-h-48 bg-black/40 flex items-center justify-center">
              <img
                src={imageUrl}
                alt={caption || 'Branch Attachment'}
                className="max-h-48 w-auto object-contain rounded-xl"
                onError={() => setUploadError(isFa ? 'خطا در بارگذاری تصویر از آدرس وارد شده.' : 'Failed to load image from URL.')}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-800">
          {currentImage?.url ? (
            <button
              type="button"
              onClick={handleRemove}
              className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isFa ? 'حذف تصویر' : 'Remove'}</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
            >
              {isFa ? 'انصراف' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!imageUrl}
              className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold shadow-md transition cursor-pointer"
            >
              {isFa ? 'ذخیره و پیوست به شاخه' : 'Save & Attach'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ========================================================================= */
/* 6. FULLSCREEN HIGH-RES IMAGE VIEWER MODAL                                 */
/* ========================================================================= */
export interface ImageViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  image: NodeCustomImage | null;
  title: string;
  language: Language;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  isOpen,
  onClose,
  image,
  title,
  language,
}) => {
  const isFa = language === 'fa';
  if (!isOpen || !image) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-lg animate-in fade-in cursor-zoom-out"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center justify-center space-y-3 cursor-default"
      >
        {/* Top bar */}
        <div className="w-full flex items-center justify-between gap-3 text-white px-2">
          <div className="space-y-0.5">
            <h4 className="font-bold text-sm sm:text-base">{title}</h4>
            {image.caption && <p className="text-xs text-slate-300">{image.caption}</p>}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Image */}
        <div className="rounded-2xl overflow-hidden border border-slate-700 bg-slate-950/80 max-h-[80vh] flex items-center justify-center">
          <img
            src={image.url}
            alt={image.caption || title}
            className="max-h-[78vh] w-auto object-contain rounded-xl"
          />
        </div>
      </div>
    </div>
  );
};

