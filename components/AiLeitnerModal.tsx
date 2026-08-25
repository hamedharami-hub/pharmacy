'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Language } from '@/types/pharmacy';
import {
  CandidateCard,
  LeitnerCard,
  KnowledgeTreeItem,
  FlashcardGenerationMode,
  McqOption,
} from '@/types/leitner';
import { getClientAiConfig } from '@/lib/aiConfigStorage';
import {
  Sparkles,
  X,
  Bot,
  CheckSquare,
  Square,
  Plus,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldAlert,
  Tag,
  BookOpen,
  ArrowRight,
  ClipboardPaste,
  Calculator,
  ListChecks,
  AlertTriangle,
  Flame,
  ChevronDown,
  ChevronUp,
  Pencil,
} from 'lucide-react';

interface AiLeitnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  initialText: string;
  initialModule?: 1 | 2 | 3 | 4;
  initialCategory?: string;
  initialTopic?: string;
  userId?: string;
  onAddCardsToLeitner: (newCards: LeitnerCard[]) => void;
  onOpenLeitnerBox?: () => void;
}

interface AiLeitnerModalInnerProps {
  onClose: () => void;
  language: Language;
  initialText: string;
  initialModule?: 1 | 2 | 3 | 4;
  initialCategory?: string;
  initialTopic?: string;
  userId?: string;
  onAddCardsToLeitner: (newCards: LeitnerCard[]) => void;
  onOpenLeitnerBox?: () => void;
}

const AiLeitnerModalContent: React.FC<AiLeitnerModalInnerProps> = ({
  onClose,
  language,
  initialText,
  initialModule = 4,
  initialCategory = 'Clinical Knowledge',
  initialTopic = 'Pharmacy Topic',
  userId = 'guest',
  onAddCardsToLeitner,
  onOpenLeitnerBox,
}) => {
  const isFa = language === 'fa';

  const [selectedModule, setSelectedModule] = useState<1 | 2 | 3 | 4>(initialModule);
  const [generationMode, setGenerationMode] = useState<FlashcardGenerationMode>('auto');
  const [category, setCategory] = useState(initialCategory || 'Clinical Knowledge');
  const [topic, setTopic] = useState(initialTopic || 'Pharmacy Topic');
  const [snippetText, setSnippetText] = useState(initialText);
  const [customPrompt, setCustomPrompt] = useState('');
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [isInputCollapsed, setIsInputCollapsed] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [candidateCards, setCandidateCards] = useState<CandidateCard[]>([]);
  const [successSavedCount, setSuccessSavedCount] = useState<number | null>(null);

  const handleGenerateCards = useCallback(
    async (
      textToUse: string,
      mod: 1 | 2 | 3 | 4,
      cat: string,
      top: string,
      prompt: string,
      mode: FlashcardGenerationMode
    ) => {
      if (!textToUse || !textToUse.trim()) {
        setErrorMsg(isFa ? 'لطفاً متن یا مبحثی برای تولید کارت وارد کنید.' : 'Please enter context or text.');
        return;
      }

      setIsGenerating(true);
      setErrorMsg(null);
      setSuccessSavedCount(null);

      try {
        const aiCfg = getClientAiConfig();
        const activeModel = aiCfg.flashcardModel || 'gemini-3.7-flash';
        const activeProvider =
          activeModel.startsWith('llama') ||
          activeModel.startsWith('deepseek') ||
          activeModel.startsWith('qwen') ||
          activeModel.startsWith('mixtral')
            ? 'groq'
            : (aiCfg.preferredProvider || 'gemini');
        const customKey = activeProvider === 'groq' ? aiCfg.groqApiKey : aiCfg.geminiApiKey;

        const res = await fetch('/api/gemini/generate-flashcards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contextSnippet: textToUse,
            moduleNumber: mod,
            category: cat,
            topic: top,
            customPrompt: prompt,
            generationMode: mode,
            language,
            provider: activeProvider,
            model: activeModel,
            apiKey: customKey || undefined,
            temperature: aiCfg.temperature ?? 0.2,
          }),
        });

        const data = await res.json();
        if (!res.ok || data.error) {
          throw new Error(data.error || 'Failed to generate flashcards');
        }

        if (Array.isArray(data.cards) && data.cards.length > 0) {
          const mappedCards: CandidateCard[] = data.cards.map((c: any, idx: number) => {
            const rawTree = c.knowledgeTree;
            const ktDomainFa = rawTree?.domain?.fa || c.category || cat;
            const ktDomainEn = rawTree?.domain?.en || c.category || cat;
            const ktSystemFa = rawTree?.system?.fa || c.topic || top;
            const ktSystemEn = rawTree?.system?.en || c.topic || top;
            const ktSubsystemFa = rawTree?.subsystem?.fa || (c.type ? String(c.type).replace('_', ' ') : 'نکات درمانی');
            const ktSubsystemEn = rawTree?.subsystem?.en || (c.type ? String(c.type).replace('_', ' ') : 'Clinical Pearls');
            const ktMicroTopicFa = rawTree?.microTopic?.fa || (typeof c.pearl === 'object' ? c.pearl?.fa : '') || 'مفهوم آزمون';
            const ktMicroTopicEn = rawTree?.microTopic?.en || (typeof c.pearl === 'object' ? c.pearl?.en : '') || 'Exam Node';

            const ktPathFa = Array.isArray(rawTree?.path?.fa) && rawTree.path.fa.length > 0
              ? rawTree.path.fa
              : [ktDomainFa, ktSystemFa, ktSubsystemFa, ktMicroTopicFa].filter(Boolean);

            const ktPathEn = Array.isArray(rawTree?.path?.en) && rawTree.path.en.length > 0
              ? rawTree.path.en
              : [ktDomainEn, ktSystemEn, ktSubsystemEn, ktMicroTopicEn].filter(Boolean);

            const ktSubClassFa = rawTree?.subClass?.fa || rawTree?.drugGroup?.fa || '';
            const ktSubClassEn = rawTree?.subClass?.en || rawTree?.drugGroup?.en || '';

            const knowledgeTree: KnowledgeTreeItem = {
              domain: { fa: ktDomainFa, en: ktDomainEn },
              system: { fa: ktSystemFa, en: ktSystemEn },
              subsystem: { fa: ktSubsystemFa, en: ktSubsystemEn },
              subClass: ktSubClassFa || ktSubClassEn ? { fa: ktSubClassFa, en: ktSubClassEn } : undefined,
              microTopic: { fa: ktMicroTopicFa, en: ktMicroTopicEn },
              path: { fa: ktPathFa, en: ktPathEn },
            };

            return {
              id: `cand-${Date.now()}-${idx}`,
              question: {
                fa: c.question?.fa || c.question || '',
                en: c.question?.en || c.question || '',
              },
              answer: {
                fa: c.answer?.fa || c.answer || '',
                en: c.answer?.en || c.answer || '',
              },
              pearl: {
                fa: c.pearl?.fa || c.pearl || '',
                en: c.pearl?.en || c.pearl || '',
              },
              type: c.type || (mode === 'mcq' ? 'mcq' : mode === 'triage_redflag' ? 'triage_redflag' : mode === 'calculation' ? 'calculation' : 'clinical_pearl'),
              category: c.category || cat,
              topic: c.topic || top,
              tags: Array.isArray(c.tags) ? c.tags : [cat, top],
              knowledgeTree,
              sourceSnippet: c.sourceSnippet || snippetText || textToUse,
              mcqOptions: Array.isArray(c.mcqOptions) ? c.mcqOptions : undefined,
              distractorRationale: c.distractorRationale || undefined,
              calculationFormula: c.calculationFormula || undefined,
              calLabels: Array.isArray(c.calLabels) ? c.calLabels : undefined,
              triageOutcome: c.triageOutcome || undefined,
              selected: true,
            };
          });

          setCandidateCards(mappedCards);
          setIsInputCollapsed(true);
        } else {
          throw new Error('No flashcards were generated by AI.');
        }
      } catch (err: any) {
        console.error('Error generating Leitner cards:', err);
        setErrorMsg(err.message || (isFa ? 'خطا در ارتباط با هوش مصنوعی. مجدداً تلاش کنید.' : 'Error generating flashcards.'));
      } finally {
        setIsGenerating(false);
      }
    },
    [isFa, language]
  );

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Auto-generate on mount if initialText exists
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (initialText && initialText.trim().length > 10) {
      timer = setTimeout(() => {
        handleGenerateCards(initialText, initialModule, initialCategory, initialTopic, '', 'auto');
      }, 500);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [initialText, initialModule, initialCategory, initialTopic, handleGenerateCards]);

  const toggleCardSelection = (index: number) => {
    setCandidateCards((prev) =>
      prev.map((c, i) => (i === index ? { ...c, selected: !c.selected } : c))
    );
  };

  const handleToggleSelectAll = (select: boolean) => {
    setCandidateCards((prev) => prev.map((c) => ({ ...c, selected: select })));
  };

  const handleSaveSelectedToLeitner = () => {
    const selected = candidateCards.filter((c) => c.selected);
    if (selected.length === 0) return;

    const newLeitnerCards: LeitnerCard[] = selected.map((cand, idx) => ({
      id: `ai_${Date.now()}_${idx}`,
      userId: userId || 'guest',
      module: selectedModule,
      moduleName: {
        fa:
          selectedModule === 1
            ? 'ماژول ۱: تریاژ OTC'
            : selectedModule === 2
            ? 'ماژول ۲: قفسه دارو'
            : selectedModule === 3
            ? 'ماژول ۳: Fred Dispense'
            : 'ماژول ۴: بانک دانش',
        en:
          selectedModule === 1
            ? 'Module 1: OTC Triage'
            : selectedModule === 2
            ? 'Module 2: Drug Shelf'
            : selectedModule === 3
            ? 'Module 3: Fred Dispense'
            : 'Module 4: Clinical Bank',
      },
      category: cand.category,
      topic: cand.topic,
      box: 1,
      nextReviewDate: new Date().toISOString(),
      reviewCount: 0,
      successCount: 0,
      createdAt: new Date().toISOString(),
      type: cand.type,
      question: cand.question,
      answer: cand.answer,
      pearl: cand.pearl,
      knowledgeTree: cand.knowledgeTree,
      sourceSnippet: cand.sourceSnippet || snippetText || undefined,
      mcqOptions: cand.mcqOptions,
      distractorRationale: cand.distractorRationale,
      calculationFormula: cand.calculationFormula,
      calLabels: cand.calLabels,
      triageOutcome: cand.triageOutcome,
      tags: cand.tags,
    }));

    onAddCardsToLeitner(newLeitnerCards);
    setSuccessSavedCount(newLeitnerCards.length);
  };

  // Type badge helper
  const getTypeBadge = (type: string) => {
    const map: Record<string, { label: string; bg: string }> = {
      mcq: { label: isFa ? '📝 تست ۴ گزینه‌ای' : '📝 MCQ', bg: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
      triage_redflag: { label: isFa ? '🚨 تریاژ و رد فلگ' : '🚨 Red Flag', bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
      calculation: { label: isFa ? '🧮 محاسبات دوزاژ' : '🧮 Calculation', bg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' },
      cal_warning: { label: isFa ? '⚠️ برچسب‌های CAL' : '⚠️ CAL Labels', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
      interaction: { label: isFa ? '⚡ تداخل دارویی' : '⚡ Interaction', bg: 'bg-orange-500/20 text-orange-300 border-orange-500/40' },
      clinical_pearl: { label: isFa ? '💡 نکته طلایی' : '💡 Pearl', bg: 'bg-sky-500/20 text-sky-300 border-sky-500/40' },
    };
    const item = map[type] || { label: type, bg: 'bg-slate-800 text-slate-300 border-slate-700' };
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${item.bg}`}>
        {item.label}
      </span>
    );
  };

  const selectedCount = candidateCards.filter((c) => c.selected).length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isFa ? 'تولید هوشمند کارت لایتنر' : 'AI Flashcard Generator'}
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="app-card border border-purple-500/40 w-full max-w-4xl h-[100dvh] sm:h-auto sm:max-h-[92vh] sm:rounded-2xl rounded-none flex flex-col shadow-2xl bg-slate-900 text-white overflow-hidden"
        dir={isFa ? 'rtl' : 'ltr'}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. TOP HEADER BAR */}
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between gap-3 bg-linear-to-r from-purple-950/80 via-slate-900 to-indigo-950/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/25 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0 shadow-sm">
              <Sparkles className="w-4.5 h-4.5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>{isFa ? 'تولید هوشمند کارت‌های لایتنر و نقشه ذهنی' : 'AI Leitner & Mind Map Generator'}</span>
              </h2>
              <span className="text-[10px] text-purple-300 font-mono hidden sm:inline-block">
                ⚡ {getClientAiConfig().flashcardModel || 'gemini-3.7-flash'} (Clinical Reasoning Engine)
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={isFa ? 'بستن' : 'Close'}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. INPUT & GENERATION CONFIG (COLLAPSIBLE FOR MOBILE SCREEN SPACE) */}
        <div className="border-b border-slate-800 bg-slate-950/90 shrink-0">
          {candidateCards.length > 0 && isInputCollapsed ? (
            /* COLLAPSED CONTEXT BAR */
            <div className="px-3.5 py-2 flex items-center justify-between gap-2 text-xs bg-purple-950/20 border-b border-purple-500/20">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-bold text-purple-300 shrink-0">{isFa ? '📄 متن مبنا:' : '📄 Context:'}</span>
                <span className="text-slate-400 truncate text-[11.5px] max-w-xs sm:max-w-md">{snippetText}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsInputCollapsed(false)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 text-[11px] font-bold transition flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <Pencil className="w-3 h-3" />
                <span>{isFa ? 'ویرایش متن یا تولید مجدد' : 'Edit / Regenerate'}</span>
              </button>
            </div>
          ) : (
            /* EXPANDED INPUT FORM */
            <div className="p-3 sm:p-4 space-y-3">
              <div className="relative">
                <textarea
                  value={snippetText}
                  onChange={(e) => setSnippetText(e.target.value)}
                  placeholder={
                    isFa
                      ? 'متن سناریو، دستورالعمل دارویی، دوزاژ یا نکته بالینی مورد نظر را اینجا وارد یا Paste کنید...'
                      : 'Paste or type clinical text, dosage guidelines or pharmacology pearl here...'
                  }
                  rows={3}
                  className="w-full p-3 pe-20 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-purple-500 leading-relaxed font-sans shadow-inner placeholder:text-slate-500"
                />
                <div className="absolute top-2.5 end-2.5 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const clip = await navigator.clipboard.readText();
                        if (clip) setSnippetText(clip);
                      } catch {}
                    }}
                    className="text-[11px] px-2 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 flex items-center gap-1 cursor-pointer transition shadow-xs"
                    title={isFa ? 'چسباندن متن از کلیپ‌بورد' : 'Paste from clipboard'}
                  >
                    <ClipboardPaste className="w-3.5 h-3.5" />
                    <span>Paste</span>
                  </button>
                  {snippetText && (
                    <button
                      type="button"
                      onClick={() => setSnippetText('')}
                      className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-300 transition cursor-pointer"
                      title={isFa ? 'پاک کردن' : 'Clear'}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Controls Row */}
              <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Generation Mode Select */}
                  <select
                    value={generationMode}
                    onChange={(e) => setGenerationMode(e.target.value as FlashcardGenerationMode)}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-purple-200 text-xs font-bold focus:outline-none focus:border-purple-500 cursor-pointer shadow-xs"
                  >
                    <option value="auto">{isFa ? '✨ ترکیب هوشمند و جامع' : '✨ Comprehensive Mix'}</option>
                    <option value="mcq">{isFa ? '📝 سناریوی ۴ گزینه‌ای بالینی' : '📝 Clinical MCQs'}</option>
                    <option value="triage_redflag">{isFa ? '🛑 تریاژ OTC و رد فلگ‌ها' : '🛑 Triage & Red Flags'}</option>
                    <option value="calculation">{isFa ? '🧮 محاسبات دوزاژ و کلیرانس' : '🧮 Calculations'}</option>
                    <option value="cal_warning">{isFa ? '⚠️ برچسب‌های هشدار CAL' : '⚠️ CAL Labels'}</option>
                    <option value="interaction">{isFa ? '⚡ تداخلات و منع مصرف' : '⚡ Interactions'}</option>
                  </select>

                  {/* Module Target Select */}
                  <select
                    value={selectedModule}
                    onChange={(e) => setSelectedModule(Number(e.target.value) as 1 | 2 | 3 | 4)}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-indigo-200 text-xs font-bold focus:outline-none focus:border-indigo-500 cursor-pointer shadow-xs"
                  >
                    <option value={1}>{isFa ? 'ماژول ۱: تریاژ OTC' : 'Mod 1: OTC Triage'}</option>
                    <option value={2}>{isFa ? 'ماژول ۲: قفسه S2/S3' : 'Mod 2: S2/S3 Shelf'}</option>
                    <option value={3}>{isFa ? 'ماژول ۳: نرم‌افزار Fred' : 'Mod 3: Fred Dispense'}</option>
                    <option value={4}>{isFa ? 'ماژول ۴: دانشنامه بالینی' : 'Mod 4: Clinical Hub'}</option>
                  </select>

                  {/* Advanced settings toggle */}
                  <button
                    type="button"
                    onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                    className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                  >
                    <span>{isFa ? 'تنظیمات بیشتر' : 'More'}</span>
                    {showAdvancedSettings ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Generate Button */}
                <button
                  type="button"
                  disabled={isGenerating || !snippetText.trim()}
                  onClick={() =>
                    handleGenerateCards(snippetText, selectedModule, category, topic, customPrompt, generationMode)
                  }
                  className="px-4 py-2 rounded-xl bg-linear-to-r from-purple-600 via-indigo-600 to-sky-600 hover:from-purple-500 hover:to-sky-500 text-white font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow-md shadow-purple-900/30 disabled:opacity-40"
                >
                  <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                  <span>{isGenerating ? (isFa ? 'در حال طراحی کارت‌ها...' : 'Generating...') : isFa ? 'تولید کارت‌های هوشمند' : 'Generate Cards'}</span>
                </button>
              </div>

              {/* Advanced Collapsible Settings */}
              {showAdvancedSettings && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 animate-in fade-in duration-150 text-xs">
                  <div>
                    <input
                      type="text"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder={isFa ? 'دسته‌بندی (Category)' : 'Category'}
                      className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder={isFa ? 'مبحث یا بیماری (Topic)' : 'Topic'}
                      className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder={isFa ? 'دستور خاص به AI (Prompt)...' : 'Custom AI Prompt...'}
                      className="w-full p-2 rounded-lg bg-slate-900 border border-purple-500/40 text-slate-200 placeholder:text-slate-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. MAIN SCROLLABLE CONTENT: GENERATED QUESTIONS & CARDS */}
        <div className="p-3 sm:p-5 overflow-y-auto space-y-4 flex-1 overscroll-contain">
          {/* ERROR ALERT */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2.5 animate-in shake">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* SUCCESS MESSAGE */}
          {successSavedCount !== null && (
            <div className="p-4 sm:p-5 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in zoom-in-95">
              <div className="flex items-center gap-3.5">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold text-sm sm:text-base text-white">
                    {isFa
                      ? `🎉 تعداد ${successSavedCount} کارت با موفقیت به جعبه ۱ لایتنر افزوده شد!`
                      : `🎉 ${successSavedCount} flashcards added to Leitner Box 1!`}
                  </div>
                  <div className="text-xs text-emerald-300/80 mt-0.5">
                    {isFa ? 'هم‌اکنون این سوالات در صف مرور روزانه و نقشه ذهنی شما قرار گرفتند.' : 'Cards are now available in your Leitner review queue.'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                {onOpenLeitnerBox && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenLeitnerBox();
                    }}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
                  >
                    <span>{isFa ? 'شروع مرور در لایتنر' : 'Open Leitner'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  {isFa ? 'بستن' : 'Done'}
                </button>
              </div>
            </div>
          )}

          {/* LOADING STATE */}
          {isGenerating && (
            <div className="p-8 sm:p-12 text-center space-y-4 bg-slate-950/50 rounded-2xl border border-purple-500/30">
              <div className="inline-block p-3.5 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/40 animate-bounce">
                <Sparkles className="w-8 h-8 text-amber-300" />
              </div>
              <div className="text-sm sm:text-base font-bold text-purple-200">
                {isFa ? 'هوش مصنوعی در حال تحلیل بالینی و استخراج سوالات آزمونی...' : 'AI is extracting exam questions & clinical points...'}
              </div>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                {isFa
                  ? 'طراحی سناریوهای کیس‌محور، تمایز گزینه‌های تستی، استخراج هشدارهای CAL استرالیا و نکات طلایی فارماکولوژی'
                  : 'Generating MCQs, distractor analysis, Australian CAL warnings and pearls'}
              </p>
            </div>
          )}

          {/* CANDIDATE CARDS LIST */}
          {!isGenerating && candidateCards.length > 0 && (
            <div className="space-y-4">
              {/* Batch Actions & Counter */}
              <div className="flex items-center justify-between gap-2 text-xs px-1 text-slate-400 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5 text-xs sm:text-sm">
                    <CheckSquare className="w-4 h-4 text-purple-400" />
                    <span>
                      {isFa
                        ? `کارت‌های پیشنهادی (${selectedCount} از ${candidateCards.length} انتخاب شده):`
                        : `Cards Generated (${selectedCount} of ${candidateCards.length} selected):`}
                    </span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleSelectAll(true)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 font-bold transition cursor-pointer"
                  >
                    {isFa ? 'انتخاب همه' : 'Select All'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleSelectAll(false)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 font-bold transition cursor-pointer"
                  >
                    {isFa ? 'لغو همه' : 'Deselect All'}
                  </button>
                </div>
              </div>

              {/* Individual Question Cards */}
              <div className="space-y-4">
                {candidateCards.map((card, idx) => (
                  <div
                    key={card.id}
                    onClick={() => toggleCardSelection(idx)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleCardSelection(idx);
                      }
                    }}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer space-y-3.5 shadow-md ${
                      card.selected
                        ? 'bg-slate-800/95 border-purple-500/60 ring-1 ring-purple-500/30'
                        : 'bg-slate-950/40 border-slate-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    {/* Header Row */}
                    <div className="flex items-center justify-between gap-2 flex-wrap border-b border-slate-700/60 pb-2.5">
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCardSelection(idx);
                          }}
                          className="text-purple-400 hover:text-purple-300 cursor-pointer"
                          aria-label={isFa ? 'تغییر وضعیت انتخاب کارت' : 'Toggle card selection'}
                        >
                          {card.selected ? (
                            <CheckSquare className="w-5 h-5 text-purple-400" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-500" />
                          )}
                        </button>
                        <span className="font-bold text-white text-xs sm:text-sm">
                          {isFa ? `پرسش ${idx + 1}` : `Question ${idx + 1}`}
                        </span>
                        {getTypeBadge(card.type)}
                      </div>

                      <div className="text-[11px] text-slate-400 font-mono">
                        <span>{card.category}</span> • <span>{card.topic}</span>
                      </div>
                    </div>

                    {/* Question (Front) */}
                    <div className="space-y-1.5">
                      <div className="text-[11.5px] font-bold text-amber-300 flex items-center gap-1.5">
                        <HelpCircle className="w-4 h-4 text-amber-400" />
                        <span>{isFa ? 'صورت سوال / سناریوی بالینی (Front):' : 'Clinical Scenario / Question (Front):'}</span>
                      </div>
                      <p className="text-sm sm:text-base text-slate-100 font-bold leading-relaxed bg-slate-900/90 p-3 sm:p-3.5 rounded-xl border border-slate-700/80 shadow-inner">
                        {isFa ? card.question.fa || card.question.en : card.question.en || card.question.fa}
                      </p>
                    </div>

                    {/* MCQ Options List (Full Width, No Truncate, Highly Readable) */}
                    {card.mcqOptions && card.mcqOptions.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <div className="text-[11px] font-bold text-purple-300">
                          {isFa ? 'گزینه‌های پاسخ (MCQ Options):' : 'MCQ Options:'}
                        </div>
                        <div className="grid grid-cols-1 gap-2 text-xs sm:text-sm">
                          {card.mcqOptions.map((opt) => (
                            <div
                              key={opt.id}
                              className={`p-3 rounded-xl border flex items-start gap-3 transition ${
                                opt.isCorrect
                                  ? 'bg-emerald-950/60 border-emerald-500/70 text-emerald-100 font-bold ring-1 ring-emerald-500/30'
                                  : 'bg-slate-900/80 border-slate-800 text-slate-200'
                              }`}
                            >
                              <span
                                className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5 ${
                                  opt.isCorrect
                                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                                }`}
                              >
                                {opt.id}
                              </span>
                              <div className="flex-1 min-w-0 leading-relaxed break-words">
                                <span>{isFa ? opt.text.fa || opt.text.en : opt.text.en || opt.text.fa}</span>
                              </div>
                              {opt.isCorrect && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
                                  {isFa ? '✓ گزینه صحیح' : '✓ Correct Answer'}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Answer & Clinical Analysis (Back) */}
                    <div className="space-y-1.5 border-t border-slate-700/60 pt-3">
                      <div className="text-[11.5px] font-bold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>{isFa ? 'پاسخ تشریحی و تحلیل بالینی (Back):' : 'Detailed Clinical Rationale (Back):'}</span>
                      </div>
                      <div className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-slate-950/80 p-3 sm:p-3.5 rounded-xl border border-slate-800 space-y-2">
                        <p>{isFa ? card.answer.fa || card.answer.en : card.answer.en || card.answer.fa}</p>

                        {/* Distractor Rationale (Exam Traps) */}
                        {card.distractorRationale && (card.distractorRationale.fa || card.distractorRationale.en) && (
                          <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-500/30 text-rose-200 text-xs mt-2">
                            <span className="font-bold text-rose-300 block mb-1">
                              {isFa ? '⚠️ چرا سایر گزینه‌ها نادرست هستند (تله‌های آزمون):' : '⚠️ Distractor Analysis (Exam Traps):'}
                            </span>
                            <p className="leading-relaxed">
                              {isFa
                                ? card.distractorRationale.fa || card.distractorRationale.en
                                : card.distractorRationale.en || card.distractorRationale.fa}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* High-Yield Clinical Pearl */}
                    {card.pearl && (card.pearl.fa || card.pearl.en) && (
                      <div className="p-2.5 sm:p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-200 text-xs sm:text-sm flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                        <div className="leading-relaxed">
                          <span className="font-bold text-amber-300">
                            {isFa ? 'نکته طلایی فارماکولوژی: ' : 'High-Yield Pearl: '}
                          </span>
                          <span>{isFa ? card.pearl.fa || card.pearl.en : card.pearl.en || card.pearl.fa}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 4. STICKY BOTTOM ACTIONS BAR */}
        <div className="p-3.5 sm:p-4 border-t border-slate-800 flex items-center justify-between gap-3 bg-slate-950/95 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-bold transition cursor-pointer"
          >
            {isFa ? 'انصراف' : 'Cancel'}
          </button>

          {candidateCards.length > 0 && successSavedCount === null && (
            <button
              type="button"
              disabled={selectedCount === 0}
              onClick={handleSaveSelectedToLeitner}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-linear-to-r from-purple-600 via-indigo-600 to-sky-600 hover:from-purple-500 hover:to-sky-500 text-white text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-900/40 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>
                {isFa
                  ? `افزودن ${selectedCount} کارت به جعبه لایتنر`
                  : `Add ${selectedCount} Cards to Leitner`}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const AiLeitnerModal: React.FC<AiLeitnerModalProps> = ({
  isOpen,
  onClose,
  language,
  initialText,
  initialModule = 4,
  initialCategory = 'Clinical Knowledge',
  initialTopic = 'Pharmacy Topic',
  userId = 'guest',
  onAddCardsToLeitner,
  onOpenLeitnerBox,
}) => {
  if (!isOpen) return null;

  return (
    <AiLeitnerModalContent
      key={`${initialModule}-${initialCategory}-${initialTopic}-${initialText.slice(0, 30)}`}
      onClose={onClose}
      language={language}
      initialText={initialText}
      initialModule={initialModule}
      initialCategory={initialCategory}
      initialTopic={initialTopic}
      userId={userId}
      onAddCardsToLeitner={onAddCardsToLeitner}
      onOpenLeitnerBox={onOpenLeitnerBox}
    />
  );
};
