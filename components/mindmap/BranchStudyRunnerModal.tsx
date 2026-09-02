'use client';

import React, { useState } from 'react';
import { LeitnerCard } from '@/types/leitner';
import { Language } from '@/types/pharmacy';
import { MindMapNode } from '@/types/mindmap';
import { FLAG_OPTIONS, FlagColor } from '@/components/LeitnerMindMapPanel';
import { extractCardBilingualText } from '@/components/mindmap/MindMapModals';
import {
  X,
  Eye,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  Zap,
  HelpCircle,
  Flag,
  Award,
  Sparkles,
  Check,
} from 'lucide-react';

export interface BranchStudyRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  node: MindMapNode | null;
  cards: LeitnerCard[];
  language: Language;
  cardLangMode: 'fa' | 'en' | 'bilingual';
  cardFlags: Record<string, FlagColor>;
  onSetCardFlag: (cardId: string, flag: FlagColor | null) => void;
  onRateCard?: (cardId: string, rating: 'again' | 'hard' | 'good' | 'easy') => void;
  onUpdateCardBox?: (cardId: string, newBox: 1 | 2 | 3 | 4 | 5, isCorrect: boolean) => void;
}

export const BranchStudyRunnerModal: React.FC<BranchStudyRunnerModalProps> = ({
  isOpen,
  onClose,
  node,
  cards,
  language,
  cardLangMode,
  cardFlags,
  onSetCardFlag,
  onRateCard,
  onUpdateCardBox,
}) => {
  const isFa = language === 'fa';
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [selectedMcqOption, setSelectedMcqOption] = useState<string | null>(null);
  const [reviewedResults, setReviewedResults] = useState<Record<string, 'again' | 'hard' | 'good' | 'easy'>>({});
  const [runnerLang, setRunnerLang] = useState<'bilingual' | 'fa' | 'en'>(
    cardLangMode || (language === 'fa' ? 'fa' : 'bilingual')
  );

  if (!isOpen || !node || cards.length === 0) return null;

  const currentCard = cards[currentIndex];
  const progressPercent = Math.round(((currentIndex + 1) / cards.length) * 100);

  const qObj = currentCard
    ? extractCardBilingualText(
        currentCard.question,
        (currentCard as any).questionFa || (currentCard as any).qFa,
        (currentCard as any).questionEn || (currentCard as any).qEn
      )
    : { fa: '', en: '' };

  const aObj = currentCard
    ? extractCardBilingualText(
        currentCard.answer,
        (currentCard as any).answerFa || (currentCard as any).aFa,
        (currentCard as any).answerEn || (currentCard as any).aEn
      )
    : { fa: '', en: '' };

  const pObj = currentCard
    ? extractCardBilingualText(
        currentCard.pearl,
        (currentCard as any).pearlFa || (currentCard as any).pFa,
        (currentCard as any).pearlEn || (currentCard as any).pEn
      )
    : { fa: '', en: '' };

  const flag = currentCard ? cardFlags[currentCard.id] : null;
  const isMcq = currentCard?.type === 'mcq' && currentCard.mcqOptions && currentCard.mcqOptions.length > 0;

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsAnswerRevealed(false);
      setSelectedMcqOption(null);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsAnswerRevealed(false);
      setSelectedMcqOption(null);
    }
  };

  const handleSelectOption = (key: string) => {
    setSelectedMcqOption(key);
    setIsAnswerRevealed(true);
  };

  const handleGrade = (rating: 'again' | 'hard' | 'good' | 'easy') => {
    if (!currentCard) return;
    setReviewedResults((prev) => ({
      ...prev,
      [currentCard.id]: rating,
    }));

    if (onRateCard) {
      onRateCard(currentCard.id, rating);
    } else if (onUpdateCardBox) {
      const isCorrect = rating !== 'again';
      const nextBox = isCorrect ? Math.min(5, currentCard.box + 1) : 1;
      onUpdateCardBox(currentCard.id, nextBox as 1 | 2 | 3 | 4 | 5, isCorrect);
    }

    handleNext();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-2xl p-5 sm:p-7 rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl space-y-5 max-h-[90vh] flex flex-col justify-between overflow-y-auto">
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-100">
                {isFa ? 'مرور ترتیبی شاخه یادگیری لایتنر' : 'Step-by-Step Leitner Branch Study'}
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {isFa ? node.title.fa || node.title.en : node.title.en || node.title.fa} • {currentIndex + 1} / {cards.length}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden shrink-0">
          <div
            className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Flashcard Body */}
        <div className="space-y-4 flex-1">
          {/* Question Card Box */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 shadow-inner">
            <div className="flex items-center justify-between gap-2 text-xs font-bold text-slate-400 flex-wrap">
              <div className="flex items-center gap-2">
                <span>{isFa ? 'صورت مسئله و سوال بالینی:' : 'Clinical Scenario & Question:'}</span>
                {/* Bilingual Switcher */}
                <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[10.5px]">
                  <button
                    type="button"
                    onClick={() => setRunnerLang('bilingual')}
                    className={`px-2 py-0.5 rounded transition flex items-center gap-1 cursor-pointer ${
                      runnerLang === 'bilingual' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>🌐</span>
                    <span>{isFa ? 'دوزبانه' : 'Dual'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRunnerLang('fa')}
                    className={`px-1.5 py-0.5 rounded transition cursor-pointer ${
                      runnerLang === 'fa' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    FA
                  </button>
                  <button
                    type="button"
                    onClick={() => setRunnerLang('en')}
                    className={`px-1.5 py-0.5 rounded transition cursor-pointer ${
                      runnerLang === 'en' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    EN
                  </button>
                </div>
              </div>

              <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                {isFa ? `جعبه ${currentCard.box}` : `Box ${currentCard.box}`}
              </span>
            </div>

            {runnerLang === 'bilingual' ? (
              <div className="space-y-2.5">
                {qObj.fa && (
                  <div className="text-sm sm:text-base font-bold text-slate-100 leading-relaxed break-words whitespace-normal" dir="rtl">
                    <span className="text-[10px] text-amber-400 font-mono font-bold ml-1.5 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">FA</span>
                    {qObj.fa}
                  </div>
                )}
                {qObj.en && qObj.en !== qObj.fa && (
                  <div className="text-xs sm:text-sm font-medium text-slate-300 leading-relaxed font-sans border-t border-slate-800 pt-2 break-words whitespace-normal" dir="ltr">
                    <span className="text-[10px] text-sky-400 font-mono font-bold mr-1.5 px-1.5 py-0.5 rounded bg-sky-500/10 border border-sky-500/20">EN</span>
                    {qObj.en}
                  </div>
                )}
              </div>
            ) : runnerLang === 'fa' ? (
              <div className="text-sm sm:text-base font-bold text-slate-100 leading-relaxed break-words whitespace-normal" dir="rtl">
                {qObj.fa || qObj.en}
              </div>
            ) : (
              <div className="text-xs sm:text-sm font-semibold text-slate-100 leading-relaxed font-sans break-words whitespace-normal" dir="ltr">
                {qObj.en || qObj.fa}
              </div>
            )}

            {/* Flag Selector */}
            <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800/80">
              <span className="text-[11px] text-slate-400">{isFa ? 'پرچم:' : 'Flag:'}</span>
              {(Object.keys(FLAG_OPTIONS) as FlagColor[]).map((fKey) => {
                const opt = FLAG_OPTIONS[fKey];
                const isSelected = flag === fKey;
                return (
                  <button
                    key={fKey}
                    type="button"
                    onClick={() => onSetCardFlag(currentCard.id, isSelected ? null : fKey)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition border cursor-pointer ${
                      isSelected ? opt.badge : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full inline-block me-1 ${opt.dot}`} />
                    {isFa ? opt.name.fa.split(' ')[0] : opt.name.en.split(' ')[0]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* INTERACTIVE MCQ OPTIONS (IF MCQ) */}
          {isMcq && currentCard.mcqOptions && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-300">
                {isFa ? 'گزینه‌های چهارجوابی (انتخاب پاسخ):' : 'Select Option:'}
              </div>
              <div className="space-y-2">
                {currentCard.mcqOptions.map((opt, idx) => {
                  const optObj = extractCardBilingualText(opt.text, (opt as any).textFa, (opt as any).textEn);
                  const optId = opt.id || String.fromCharCode(65 + idx);
                  const isSelected = selectedMcqOption === optId;
                  const isCorrect = opt.isCorrect;

                  let optStyle = 'bg-slate-950/80 hover:bg-slate-800 border-slate-800 text-slate-200';
                  if (isAnswerRevealed) {
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
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs shrink-0 text-slate-300">
                          {optId.toUpperCase()}
                        </span>
                        <div className="leading-relaxed break-words flex-1 space-y-1">
                          {runnerLang === 'bilingual' ? (
                            <>
                              {optObj.fa && <div dir="rtl">{optObj.fa}</div>}
                              {optObj.en && optObj.en !== optObj.fa && (
                                <div className="text-[11px] text-slate-300 font-sans opacity-90 border-t border-slate-700/60 pt-1" dir="ltr">{optObj.en}</div>
                              )}
                            </>
                          ) : (
                            <div>{runnerLang === 'fa' ? optObj.fa : optObj.en}</div>
                          )}
                        </div>
                      </div>
                      {isAnswerRevealed && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                      {isAnswerRevealed && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reveal Button or Answer */}
          {!isAnswerRevealed ? (
            <button
              type="button"
              onClick={() => setIsAnswerRevealed(true)}
              className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-900/30"
            >
              <Eye className="w-4 h-4" />
              <span>{isFa ? 'نمایش پاسخ و استدلال بالینی' : 'Show Answer & Clinical Rationale'}</span>
            </button>
          ) : (
            <div className="p-4 sm:p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>{isFa ? 'پاسخ و استدلال بالینی (Back):' : 'Answer & Rationale (Back):'}</span>
              </div>
              
              {runnerLang === 'bilingual' ? (
                <div className="space-y-2">
                  {aObj.fa && (
                    <div className="text-xs sm:text-sm text-slate-100 leading-relaxed" dir="rtl">
                      <span className="text-[10px] text-emerald-400 font-mono font-bold ml-1.5 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">FA</span>
                      {aObj.fa}
                    </div>
                  )}
                  {aObj.en && aObj.en !== aObj.fa && (
                    <div className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed border-t border-emerald-900/60 pt-2" dir="ltr">
                      <span className="text-[10px] text-sky-400 font-mono font-bold mr-1.5 px-1.5 py-0.5 rounded bg-sky-500/10 border border-sky-500/20">EN</span>
                      {aObj.en}
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className="text-xs sm:text-sm text-slate-100 leading-relaxed"
                  dir={runnerLang === 'fa' ? 'rtl' : 'ltr'}
                >
                  {runnerLang === 'fa' ? aObj.fa || aObj.en : aObj.en || aObj.fa}
                </div>
              )}

              {(pObj.fa || pObj.en) && (
                <div className="p-3 rounded-xl bg-purple-950/50 border border-purple-500/30 text-purple-200 text-xs flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                  <div className="space-y-1 flex-1">
                    <span className="font-bold text-amber-300">{isFa ? 'نکته کلیدی: ' : 'Key Point: '}</span>
                    {runnerLang === 'bilingual' ? (
                      <div className="space-y-1">
                        {pObj.fa && <div dir="rtl">{pObj.fa}</div>}
                        {pObj.en && pObj.en !== pObj.fa && <div dir="ltr" className="text-slate-300 font-sans text-xs border-t border-purple-900/40 pt-1">{pObj.en}</div>}
                      </div>
                    ) : (
                      <span>{runnerLang === 'fa' ? pObj.fa || pObj.en : pObj.en || pObj.fa}</span>
                    )}
                  </div>
                </div>
              )}

              {/* 4-Tier Leitner Rating Buttons */}
              <div className="pt-2 border-t border-purple-500/20 space-y-2">
                <div className="text-xs font-bold text-slate-300">
                  {isFa ? 'ارزیابی و درجه‌بندی لایتنر:' : 'Grade & Spaced Review:'}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleGrade('again')}
                    className="p-2.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/50 text-rose-200 font-bold text-xs flex flex-col items-center justify-center gap-0.5 transition cursor-pointer"
                  >
                    <span>{isFa ? 'تکرار (نادرست)' : 'Again'}</span>
                    <span className="text-[10px] text-rose-300/80 font-mono">{isFa ? 'جعبه ۱' : 'Box 1'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleGrade('hard')}
                    className="p-2.5 rounded-xl bg-amber-950/80 hover:bg-amber-900 border border-amber-500/50 text-amber-200 font-bold text-xs flex flex-col items-center justify-center gap-0.5 transition cursor-pointer"
                  >
                    <span>{isFa ? 'سخت' : 'Hard'}</span>
                    <span className="text-[10px] text-amber-300/80 font-mono">{isFa ? '۲-۳ روز' : '2-3d'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleGrade('good')}
                    className="p-2.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-200 font-bold text-xs flex flex-col items-center justify-center gap-0.5 transition cursor-pointer"
                  >
                    <span>{isFa ? 'خوب' : 'Good'}</span>
                    <span className="text-[10px] text-emerald-300/80 font-mono">{isFa ? '۱ هفته' : '1w'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleGrade('easy')}
                    className="p-2.5 rounded-xl bg-sky-950/80 hover:bg-sky-900 border border-sky-500/50 text-sky-200 font-bold text-xs flex flex-col items-center justify-center gap-0.5 transition cursor-pointer"
                  >
                    <span>{isFa ? 'آسان' : 'Easy'}</span>
                    <span className="text-[10px] text-sky-300/80 font-mono">{isFa ? '۲ هفته' : '2w'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-3 shrink-0">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            {isFa ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
            <span>{isFa ? 'کارت قبلی' : 'Previous'}</span>
          </button>

          <span className="text-xs font-mono text-slate-400">
            {currentIndex + 1} of {cards.length}
          </span>

          <button
            type="button"
            onClick={handleNext}
            disabled={currentIndex === cards.length - 1}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>{isFa ? 'کارت بعدی' : 'Next'}</span>
            {isFa ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
