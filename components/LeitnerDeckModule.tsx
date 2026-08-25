'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Language } from '@/types/pharmacy';
import {
  LeitnerCard,
  LeitnerCardType,
  LEITNER_INTERVALS,
  LEITNER_BOX_NAMES,
} from '@/types/leitner';
import {
  Sparkles,
  Layers,
  CheckCircle2,
  XCircle,
  RotateCw,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Trash2,
  Play,
  Filter,
  Search,
  BookOpen,
  Tag,
  MessageSquare,
  HelpCircle,
  AlertCircle,
  Calendar,
  Award,
  Zap,
  FolderTree,
  Calculator,
  AlertTriangle,
  Flame,
  ShieldAlert,
  BarChart2,
  Download,
  Upload,
  Shuffle,
  Eye,
  EyeOff,
  Plus,
  ArrowLeft,
  ArrowRight,
  Maximize2,
  SlidersHorizontal,
  FileText,
  Volume2,
  X,
  Copy,
  Check,
  PanelRightClose,
  PanelRightOpen,
  CornerUpLeft,
  Network,
  Share2,
  Activity,
  Clock,
  ThumbsUp,
  RotateCcw,
  Compass,
  Sun,
  Moon,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import {
  calculateFSRSRetention,
  scheduleFSRSNextReview,
  getFSRSEstimatedIntervals,
  FSRSRating,
} from '@/lib/fsrs';
import { INITIAL_SAMPLE_LEITNER_CARDS } from '@/lib/sample-leitner-cards';
import { haptic } from '@/lib/haptics';

interface LeitnerDeckModuleProps {
  language: Language;
  cards: LeitnerCard[];
  onUpdateCards: (updatedCards: LeitnerCard[]) => void;
  initialView?: 'anki_study' | 'decks_manager';
  onOpenAiGenerator?: (snippetText?: string) => void;
  onOpenAiLeitner?: (snippetText?: string, moduleNum?: 1 | 2 | 4) => void;
}

export const LeitnerDeckModule: React.FC<LeitnerDeckModuleProps> = ({
  language,
  cards,
  onUpdateCards,
  initialView = 'anki_study',
  onOpenAiGenerator,
  onOpenAiLeitner,
}) => {
  const triggerAiGenerator = onOpenAiGenerator || onOpenAiLeitner || (() => {});
  const isFa = language === 'fa';
  const fileInputRef = useRef<HTMLInputElement>(null);

  // View state: 'anki_study' (minimalist AnkiDroid review) | 'decks_manager' (folders, settings, analytics)
  const [internalView, setInternalView] = useState<'anki_study' | 'decks_manager' | null>(null);
  const [prevPropView, setPrevPropView] = useState<'anki_study' | 'decks_manager'>(initialView);

  if (initialView !== prevPropView) {
    setPrevPropView(initialView);
    setInternalView(initialView);
  }

  const currentView = internalView ?? initialView;
  const setCurrentView = (v: 'anki_study' | 'decks_manager') => setInternalView(v);

  // Study Configuration & Filter Scope
  const [studyScopeName, setStudyScopeName] = useState<string>('همه کارت‌های امروز (Due)');
  const [studyFilterDomain, setStudyFilterDomain] = useState<string>('ALL');
  const [studyFilterSystem, setStudyFilterSystem] = useState<string>('ALL');
  const [studyFilterSubsystem, setStudyFilterSubsystem] = useState<string>('ALL');
  const [studyFilterBox, setStudyFilterBox] = useState<number | 'ALL'>('ALL');
  const [studyFilterSingleCardId, setStudyFilterSingleCardId] = useState<string | null>(null);
  const [isCramMode, setIsCramMode] = useState<boolean>(false);

  // Anki Study Session State
  const [studyQueueIndex, setStudyQueueIndex] = useState<number>(0);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState<boolean>(false);
  const [selectedMcqOption, setSelectedMcqOption] = useState<string | null>(null);
  const [sessionCompleted, setSessionCompleted] = useState<boolean>(false);
  const [showSourceViewer, setShowSourceViewer] = useState<boolean>(false);
  const [copiedSourceSnippet, setCopiedSourceSnippet] = useState<boolean>(false);
  const [sessionStats, setSessionStats] = useState({
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
  });

  // Zen / Deep Focus Mode state
  const [isZenMode, setIsZenMode] = useState<boolean>(false);
  const [zenTheme, setZenTheme] = useState<'oled' | 'paper'>('oled');

  // Tinder-Style Touch & Drag Swipe State
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Manager state: search, folder expansion, filters
  const [searchQuery, setSearchQuery] = useState('');
  const [managerActiveTab, setManagerActiveTab] = useState<'folders' | 'all_cards' | 'boxes' | 'add_card' | 'stats'>('folders');
  const [managerFilterDomain, setManagerFilterDomain] = useState<string>('ALL');
  const [managerFilterBox, setManagerFilterBox] = useState<number | 'ALL'>('ALL');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [newCardForm, setNewCardForm] = useState<{
    domain: string;
    system: string;
    subsystem: string;
    question: string;
    answer: string;
    pearl: string;
    type: LeitnerCardType;
  }>({
    domain: 'داروسازی بالینی OPRA',
    system: 'قلب و عروق (Cardiovascular)',
    subsystem: 'داروهای فشار خون و نارسایی قلبی',
    question: '',
    answer: '',
    pearl: '',
    type: 'clinical_pearl',
  });

  // Text helpers
  const getQuestionText = (c: LeitnerCard) => {
    if (!c || !c.question) return '';
    if (typeof c.question === 'string') return c.question;
    return isFa ? c.question.fa || c.question.en || '' : c.question.en || c.question.fa || '';
  };

  const getAnswerText = (c: LeitnerCard) => {
    if (!c || !c.answer) return '';
    if (typeof c.answer === 'string') return c.answer;
    return isFa ? c.answer.fa || c.answer.en || '' : c.answer.en || c.answer.fa || '';
  };

  const getPearlText = (c: LeitnerCard) => {
    if (!c || !c.pearl) return '';
    if (typeof c.pearl === 'string') return c.pearl;
    return isFa ? c.pearl.fa || c.pearl.en || '' : c.pearl.en || c.pearl.fa || '';
  };

  const getModuleName = (c: LeitnerCard) => {
    if (!c) return '';
    if (typeof c.moduleName === 'string') return c.moduleName;
    if (c.moduleName) {
      return isFa
        ? c.moduleName.fa || c.moduleName.en || `ماژول ${c.module}`
        : c.moduleName.en || c.moduleName.fa || `Module ${c.module}`;
    }
    return isFa ? `ماژول ${c.module}` : `Module ${c.module}`;
  };

  // Type metadata badge helper
  const getTypeBadge = (type: LeitnerCardType) => {
    const map: Record<string, { label: string; bg: string; icon: any }> = {
      mcq: {
        label: isFa ? '📝 تست ۴ گزینه‌ای OPRA' : '📝 OPRA MCQ',
        bg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
        icon: HelpCircle,
      },
      triage_redflag: {
        label: isFa ? '🚨 تریاژ و رد فلگ' : '🚨 OTC Red Flag',
        bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        icon: ShieldAlert,
      },
      calculation: {
        label: isFa ? '🧮 محاسبات بالینی' : '🧮 Calculation',
        bg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
        icon: Calculator,
      },
      cal_warning: {
        label: isFa ? '⚠️ برچسب‌های CAL' : '⚠️ CAL Labels',
        bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        icon: AlertTriangle,
      },
      interaction: {
        label: isFa ? '⚡ تداخل دارویی' : '⚡ Interaction',
        bg: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
        icon: Flame,
      },
      conversation: {
        label: isFa ? '💬 دیالوگ بیمار' : '💬 Dialogue',
        bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        icon: MessageSquare,
      },
      clinical_pearl: {
        label: isFa ? '💡 نکته کلیدی بالینی' : '💡 Clinical Pearl',
        bg: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
        icon: Sparkles,
      },
    };

    const item = map[type] || {
      label: type,
      bg: 'bg-slate-800 text-slate-300 border-slate-700',
      icon: Sparkles,
    };
    const IconComp = item.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold border ${item.bg}`}>
        <IconComp className="w-3 h-3" />
        <span>{item.label}</span>
      </span>
    );
  };

  // Filter cards for active study session
  const activeStudyQueue = useMemo(() => {
    const nowIso = new Date().toISOString();
    return cards.filter((c) => {
      // Single card direct study
      if (studyFilterSingleCardId && c.id !== studyFilterSingleCardId) return false;

      // Scope filters based on Knowledge Tree and Leitner Box
      if (studyFilterBox !== 'ALL' && c.box !== studyFilterBox) return false;
      if (studyFilterDomain !== 'ALL') {
        const domainText = c.knowledgeTree?.domain
          ? isFa ? c.knowledgeTree.domain.fa || c.knowledgeTree.domain.en : c.knowledgeTree.domain.en || c.knowledgeTree.domain.fa
          : c.category;
        if (domainText !== studyFilterDomain) return false;
      }
      if (studyFilterSystem !== 'ALL') {
        const systemText = c.knowledgeTree?.system
          ? isFa ? c.knowledgeTree.system.fa || c.knowledgeTree.system.en : c.knowledgeTree.system.en || c.knowledgeTree.system.fa
          : c.topic;
        if (systemText !== studyFilterSystem) return false;
      }
      if (studyFilterSubsystem !== 'ALL') {
        const subText = c.knowledgeTree?.subsystem
          ? isFa ? c.knowledgeTree.subsystem.fa || c.knowledgeTree.subsystem.en : c.knowledgeTree.subsystem.en || c.knowledgeTree.subsystem.fa
          : c.knowledgeTree?.subClass
          ? isFa ? c.knowledgeTree.subClass.fa || c.knowledgeTree.subClass.en : c.knowledgeTree.subClass.en || c.knowledgeTree.subClass.fa
          : '';
        if (subText && subText !== studyFilterSubsystem) return false;
      }

      // If cram mode or single card mode, include all matching cards regardless of date
      if (isCramMode || studyFilterSingleCardId) return true;

      // Otherwise only include due cards
      if (!c.nextReviewDate) return true;
      return c.nextReviewDate <= nowIso;
    });
  }, [cards, studyFilterSingleCardId, studyFilterBox, studyFilterDomain, studyFilterSystem, studyFilterSubsystem, isCramMode, isFa]);

  const currentStudyCard = activeStudyQueue[studyQueueIndex] || null;

  // Available unique Knowledge Domains from cards for filtering
  const uniqueDomains = useMemo(() => {
    const set = new Set<string>();
    cards.forEach((c) => {
      const dName = c.knowledgeTree?.domain
        ? isFa ? c.knowledgeTree.domain.fa || c.knowledgeTree.domain.en : c.knowledgeTree.domain.en || c.knowledgeTree.domain.fa
        : c.category || (isFa ? 'داروسازی بالینی OPRA' : 'Clinical Knowledge');
      if (dName) set.add(dName);
    });
    return Array.from(set);
  }, [cards, isFa]);

  // Filtered cards for the Management -> All Cards Tab
  const filteredManagerCards = useMemo(() => {
    return cards.filter((c) => {
      if (managerFilterDomain !== 'ALL') {
        const domainText = c.knowledgeTree?.domain
          ? isFa ? c.knowledgeTree.domain.fa || c.knowledgeTree.domain.en : c.knowledgeTree.domain.en || c.knowledgeTree.domain.fa
          : c.category || (isFa ? 'داروسازی بالینی OPRA' : 'Clinical Knowledge');
        if (domainText !== managerFilterDomain) return false;
      }
      if (managerFilterBox !== 'ALL' && c.box !== managerFilterBox) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const questionFa = (c.question.fa || '').toLowerCase();
        const questionEn = (c.question.en || '').toLowerCase();
        const answerFa = (c.answer.fa || '').toLowerCase();
        const answerEn = (c.answer.en || '').toLowerCase();
        const pearlFa = (c.pearl?.fa || '').toLowerCase();
        const pearlEn = (c.pearl?.en || '').toLowerCase();
        const cat = (c.category || '').toLowerCase();
        const top = (c.topic || '').toLowerCase();
        const dom = (c.knowledgeTree?.domain?.fa || c.knowledgeTree?.domain?.en || '').toLowerCase();
        const sys = (c.knowledgeTree?.system?.fa || c.knowledgeTree?.system?.en || '').toLowerCase();

        const match =
          questionFa.includes(q) ||
          questionEn.includes(q) ||
          answerFa.includes(q) ||
          answerEn.includes(q) ||
          pearlFa.includes(q) ||
          pearlEn.includes(q) ||
          cat.includes(q) ||
          top.includes(q) ||
          dom.includes(q) ||
          sys.includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [cards, managerFilterDomain, managerFilterBox, searchQuery, isFa]);

  // Due counts for stats bar
  const nowIso = new Date().toISOString();
  const totalDueCount = cards.filter((c) => !c.nextReviewDate || c.nextReviewDate <= nowIso).length;
  const boxCounts = useMemo(() => {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    cards.forEach((c) => {
      if (c.box >= 1 && c.box <= 5) counts[c.box as 1 | 2 | 3 | 4 | 5]++;
    });
    return counts;
  }, [cards]);

  // Hierarchical Knowledge Tree computation (Level 1: Domain -> Level 2: System -> Level 3: Subsystem/Topic)
  const folderTree = useMemo(() => {
    const tree: Record<
      string,
      {
        count: number;
        dueCount: number;
        systems: Record<
          string,
          {
            count: number;
            dueCount: number;
            subsystems: Record<
              string,
              {
                count: number;
                dueCount: number;
                cards: LeitnerCard[];
              }
            >;
          }
        >;
      }
    > = {};

    const now = new Date().toISOString();

    cards.forEach((card) => {
      const isDue = !card.nextReviewDate || card.nextReviewDate <= now;

      const dName = card.knowledgeTree?.domain
        ? isFa ? card.knowledgeTree.domain.fa || card.knowledgeTree.domain.en : card.knowledgeTree.domain.en || card.knowledgeTree.domain.fa
        : card.category || (isFa ? 'داروسازی بالینی OPRA' : 'Clinical Knowledge');

      const sName = card.knowledgeTree?.system
        ? isFa ? card.knowledgeTree.system.fa || card.knowledgeTree.system.en : card.knowledgeTree.system.en || card.knowledgeTree.system.fa
        : card.topic || (isFa ? 'مباحث بالینی عمومی' : 'General Clinical');

      const subName = card.knowledgeTree?.subsystem
        ? isFa ? card.knowledgeTree.subsystem.fa || card.knowledgeTree.subsystem.en : card.knowledgeTree.subsystem.en || card.knowledgeTree.subsystem.fa
        : card.knowledgeTree?.subClass
        ? isFa ? card.knowledgeTree.subClass.fa || card.knowledgeTree.subClass.en : card.knowledgeTree.subClass.en || card.knowledgeTree.subClass.fa
        : isFa ? 'نکات کلیدی و داروها' : 'Key Concepts & Drugs';

      if (!tree[dName]) {
        tree[dName] = { count: 0, dueCount: 0, systems: {} };
      }
      tree[dName].count++;
      if (isDue) tree[dName].dueCount++;

      if (!tree[dName].systems[sName]) {
        tree[dName].systems[sName] = { count: 0, dueCount: 0, subsystems: {} };
      }
      tree[dName].systems[sName].count++;
      if (isDue) tree[dName].systems[sName].dueCount++;

      if (!tree[dName].systems[sName].subsystems[subName]) {
        tree[dName].systems[sName].subsystems[subName] = { count: 0, dueCount: 0, cards: [] };
      }
      tree[dName].systems[sName].subsystems[subName].count++;
      if (isDue) tree[dName].systems[sName].subsystems[subName].dueCount++;
      tree[dName].systems[sName].subsystems[subName].cards.push(card);
    });

    return tree;
  }, [cards, isFa]);

  // Launch study session for a specific target folder or cram
  const startStudyForScope = (params: {
    title: string;
    domain?: string;
    system?: string;
    subsystem?: string;
    box?: number | 'ALL';
    singleCardId?: string;
    cram?: boolean;
  }) => {
    setStudyScopeName(params.title);
    setStudyFilterDomain(params.domain ?? 'ALL');
    setStudyFilterSystem(params.system ?? 'ALL');
    setStudyFilterSubsystem(params.subsystem ?? 'ALL');
    setStudyFilterBox(params.box ?? 'ALL');
    setStudyFilterSingleCardId(params.singleCardId ?? null);
    setIsCramMode(params.cram ?? false);
    setStudyQueueIndex(0);
    setIsAnswerRevealed(false);
    setSelectedMcqOption(null);
    setSessionCompleted(false);
    setSessionStats({ again: 0, hard: 0, good: 0, easy: 0 });
    setCurrentView('anki_study');
  };

  // Shared helper for calculating Leitner box, interval, and FSRS parameters
  const calculateNextLeitnerState = useCallback((
    card: LeitnerCard,
    rating: 'again' | 'hard' | 'good' | 'easy'
  ) => {
    const fsrsState = {
      stability: card.fsrsStability || (card.box === 1 ? 1.0 : card.box === 2 ? 3.0 : card.box === 3 ? 7.0 : card.box === 4 ? 14.0 : 30.0),
      difficulty: card.fsrsDifficulty || 4.5,
      lapses: card.fsrsLapses || 0,
      lastReviewedDate: card.lastReviewed || card.lastReviewedDate,
      reps: card.fsrsReps || card.reviewCount || 0,
    };

    const fsrsResult = scheduleFSRSNextReview(fsrsState, rating, card.box);

    let targetBox: 1 | 2 | 3 | 4 | 5 = card.box;
    if (rating === 'again') {
      targetBox = 1;
    } else if (rating === 'hard') {
      targetBox = Math.max(1, Math.min(5, card.box)) as 1 | 2 | 3 | 4 | 5;
    } else if (rating === 'good') {
      targetBox = Math.min(5, Math.max(1, card.box + 1)) as 1 | 2 | 3 | 4 | 5;
    } else if (rating === 'easy') {
      targetBox = Math.min(5, Math.max(1, card.box + 2)) as 1 | 2 | 3 | 4 | 5;
    }

    return {
      targetBox,
      nextReviewDate: fsrsResult.nextReviewDate,
      fsrsStability: fsrsResult.newStability,
      fsrsDifficulty: fsrsResult.newDifficulty,
      fsrsLapses: fsrsResult.lapses,
      fsrsReps: (card.fsrsReps || 0) + 1,
    };
  }, []);

  // Handle SM-2 & FSRS Rating: Again (1), Hard (2), Good (3), Easy (4)
  const handleRateCard = useCallback((rating: 'again' | 'hard' | 'good' | 'easy') => {
    if (!currentStudyCard) return;

    if (rating === 'again') {
      haptic.warning();
    } else if (rating === 'easy') {
      haptic.success();
    } else {
      haptic.medium();
    }

    const { targetBox, nextReviewDate, fsrsStability, fsrsDifficulty, fsrsLapses, fsrsReps } =
      calculateNextLeitnerState(currentStudyCard, rating);

    const updated = cards.map((c) => {
      if (c.id === currentStudyCard.id) {
        return {
          ...c,
          box: targetBox as 1 | 2 | 3 | 4 | 5,
          lastReviewed: new Date().toISOString(),
          nextReviewDate: nextReviewDate,
          fsrsStability,
          fsrsDifficulty,
          fsrsLapses,
          fsrsReps,
          reviewCount: (c.reviewCount || 0) + 1,
          successCount: rating !== 'again' ? (c.successCount || 0) + 1 : (c.successCount || 0),
          consecutiveCorrect: rating === 'again' ? 0 : (c.consecutiveCorrect || 0) + 1,
          history: [
            ...(c.history || []),
            {
              date: new Date().toISOString(),
              result: (rating === 'again' ? 'incorrect' : 'correct') as 'correct' | 'incorrect',
              rating,
              boxFrom: c.box,
              boxTo: targetBox,
            },
          ],
        };
      }
      return c;
    });

    onUpdateCards(updated);

    setSessionStats((prev) => ({
      ...prev,
      [rating]: prev[rating] + 1,
    }));

    if (studyQueueIndex + 1 < activeStudyQueue.length) {
      setStudyQueueIndex((prev) => prev + 1);
      setIsAnswerRevealed(false);
      setSelectedMcqOption(null);
    } else {
      haptic.success();
      setSessionCompleted(true);
    }
  }, [currentStudyCard, calculateNextLeitnerState, cards, onUpdateCards, studyQueueIndex, activeStudyQueue.length]);

  // Rate a specific card directly by ID (used by Mind Map modals)
  const handleRateSpecificCard = useCallback((cardId: string, rating: 'again' | 'hard' | 'good' | 'easy') => {
    const targetCard = cards.find((c) => c.id === cardId);
    if (!targetCard) return;

    const { targetBox, nextReviewDate, fsrsStability, fsrsDifficulty, fsrsLapses, fsrsReps } =
      calculateNextLeitnerState(targetCard, rating);

    const updated = cards.map((c) => {
      if (c.id === cardId) {
        return {
          ...c,
          box: targetBox,
          lastReviewed: new Date().toISOString(),
          nextReviewDate: nextReviewDate,
          fsrsStability,
          fsrsDifficulty,
          fsrsLapses,
          fsrsReps,
          reviewCount: (c.reviewCount || 0) + 1,
          successCount: rating !== 'again' ? (c.successCount || 0) + 1 : (c.successCount || 0),
          consecutiveCorrect: rating === 'again' ? 0 : (c.consecutiveCorrect || 0) + 1,
          history: [
            ...(c.history || []),
            {
              date: new Date().toISOString(),
              result: (rating === 'again' ? 'incorrect' : 'correct') as 'correct' | 'incorrect',
              rating,
              boxFrom: c.box,
              boxTo: targetBox,
            },
          ],
        };
      }
      return c;
    });

    onUpdateCards(updated);
  }, [cards, calculateNextLeitnerState, onUpdateCards]);

  // Direct move card to specific box
  const handleMoveCardToBox = useCallback((cardId: string, targetBox: 1 | 2 | 3 | 4 | 5) => {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + (LEITNER_INTERVALS[targetBox] || 1));

    const updated = cards.map((c) => {
      if (c.id === cardId) {
        return {
          ...c,
          box: targetBox,
          lastReviewed: new Date().toISOString(),
          nextReviewDate: nextDate.toISOString(),
        };
      }
      return c;
    });

    onUpdateCards(updated);
  }, [cards, onUpdateCards]);

  // Keyboard shortcuts listener for AnkiDroid experience:
  // Space / Enter => Reveal Answer
  // 1 => Again, 2 => Hard, 3 => Good, 4 => Easy
  useEffect(() => {
    if (currentView !== 'anki_study' || sessionCompleted || !currentStudyCard) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input/textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'z' || e.key === 'Z') {
        e.preventDefault();
        setIsZenMode((prev) => !prev);
      } else if (e.key === 'Escape' && isZenMode) {
        e.preventDefault();
        setIsZenMode(false);
      } else if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault();
        if (!isAnswerRevealed) {
          setIsAnswerRevealed(true);
        }
      } else if (isAnswerRevealed) {
        if (e.key === '1') {
          e.preventDefault();
          handleRateCard('again');
        } else if (e.key === '2') {
          e.preventDefault();
          handleRateCard('hard');
        } else if (e.key === '3') {
          e.preventDefault();
          handleRateCard('good');
        } else if (e.key === '4') {
          e.preventDefault();
          handleRateCard('easy');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentView, isAnswerRevealed, sessionCompleted, currentStudyCard, handleRateCard, isZenMode]);

  // Tinder Touch & Drag Gesture Handlers
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('input')) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragStartRef.current = { x: clientX, y: clientY, time: Date.now() };
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!dragStartRef.current || !isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const deltaX = clientX - dragStartRef.current.x;
    const deltaY = clientY - dragStartRef.current.y;
    setDragOffset({ x: deltaX, y: deltaY });
  };

  const handleTouchEnd = () => {
    if (!dragStartRef.current || !isDragging) return;
    const deltaX = dragOffset.x;
    const threshold = Math.min(110, window.innerWidth * 0.25);

    setIsDragging(false);

    if (deltaX > threshold) {
      // Swiped Right -> GOOD (بلدم)
      if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
        try { navigator.vibrate(15); } catch {}
      }
      setDragOffset({ x: window.innerWidth, y: dragOffset.y });
      setTimeout(() => {
        handleRateCard('good');
        setDragOffset({ x: 0, y: 0 });
      }, 150);
    } else if (deltaX < -threshold) {
      // Swiped Left -> AGAIN (مرور مجدد)
      if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
        try { navigator.vibrate(25); } catch {}
      }
      setDragOffset({ x: -window.innerWidth, y: dragOffset.y });
      setTimeout(() => {
        handleRateCard('again');
        setDragOffset({ x: 0, y: 0 });
      }, 150);
    } else {
      // Snap back smoothly
      setDragOffset({ x: 0, y: 0 });
    }
    dragStartRef.current = null;
  };

  // Export JSON
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(cards, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `leitner_anki_cards_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          const existingIds = new Set(cards.map((c) => c.id));
          const newOnes = parsed.filter((p: any) => p.id && !existingIds.has(p.id));
          onUpdateCards([...newOnes, ...cards]);
          alert(isFa ? `✅ تعداد ${newOnes.length} کارت جدید وارد شد.` : `✅ Imported ${newOnes.length} new cards.`);
        }
      } catch {
        alert(isFa ? '❌ فایل نامعتبر است.' : '❌ Invalid JSON file.');
      }
    };
    reader.readAsText(file);
  };

  // Add default sample cards with 6-level taxonomy
  const handleAddSampleCards = () => {
    const existingIds = new Set(cards.map((c) => c.id));
    const newOnes = INITIAL_SAMPLE_LEITNER_CARDS.filter((c) => !existingIds.has(c.id));
    if (newOnes.length > 0) {
      onUpdateCards([...cards, ...newOnes]);
    }
  };

  // Add custom manual card
  const handleAddManualCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardForm.question.trim() || !newCardForm.answer.trim()) return;

    const domainName = newCardForm.domain.trim() || (isFa ? 'داروسازی بالینی OPRA' : 'Clinical Knowledge');
    const systemName = newCardForm.system.trim() || (isFa ? 'مباحث بالینی عمومی' : 'General Clinical');
    const subName = newCardForm.subsystem.trim() || (isFa ? 'نکات کلیدی و داروها' : 'Key Concepts & Drugs');

    const newCard: LeitnerCard = {
      id: `custom_${Date.now()}`,
      userId: 'user-local',
      module: 4,
      moduleName: {
        fa: domainName,
        en: domainName,
      },
      category: domainName,
      topic: systemName,
      knowledgeTree: {
        domain: { fa: domainName, en: domainName },
        system: { fa: systemName, en: systemName },
        subsystem: { fa: subName, en: subName },
        path: {
          fa: [domainName, systemName, subName],
          en: [domainName, systemName, subName],
        },
      },
      box: 1,
      nextReviewDate: new Date().toISOString(),
      reviewCount: 0,
      successCount: 0,
      tags: ['Manual', domainName, systemName],
      createdAt: new Date().toISOString(),
      type: newCardForm.type,
      question: {
        fa: newCardForm.question,
        en: newCardForm.question,
      },
      answer: {
        fa: newCardForm.answer,
        en: newCardForm.answer,
      },
      pearl: newCardForm.pearl ? { fa: newCardForm.pearl, en: newCardForm.pearl } : undefined,
    };

    onUpdateCards([newCard, ...cards]);
    setNewCardForm({
      domain: domainName,
      system: systemName,
      subsystem: subName,
      question: '',
      answer: '',
      pearl: '',
      type: 'clinical_pearl',
    });
    alert(isFa ? '✅ کارت جدید بر اساس درخت دانش با موفقیت ذخیره شد.' : '✅ New knowledge tree card created successfully.');
  };

  const handleDeleteCard = (cardId: string) => {
    const targetCard = cards.find((c) => c.id === cardId);
    const cardQ = targetCard
      ? isFa
        ? targetCard.question.fa || targetCard.question.en
        : targetCard.question.en || targetCard.question.fa
      : '';
    const preview = cardQ.length > 80 ? cardQ.slice(0, 80) + '...' : cardQ;
    const confirmMsg = isFa
      ? `آیا از حذف این فلش‌کارت از جعبه لایتنر اطمینان دارید؟\n\n"${preview}"`
      : `Are you sure you want to delete this card from Leitner?\n\n"${preview}"`;

    if (window.confirm(confirmMsg)) {
      const updated = cards.filter((c) => c.id !== cardId);
      onUpdateCards(updated);
      setIsAnswerRevealed(false);
      setSelectedMcqOption(null);
    }
  };

  const handleDeleteAllCards = () => {
    if (
      window.confirm(
        isFa
          ? '⚠️ آیا مطمئن هستید که می‌خواهید تمام کارت‌های لایتنر را پاکسازی کنید؟ این عمل غیرقابل بازگشت است.'
          : '⚠️ Are you sure you want to clear all Leitner cards? This action cannot be undone.'
      )
    ) {
      onUpdateCards([]);
      setIsAnswerRevealed(false);
      setSelectedMcqOption(null);
    }
  };

  // Session Progress Calculations
  const totalInQueue = activeStudyQueue.length;
  const currentCardNum = Math.min(totalInQueue, studyQueueIndex + 1);
  const remainingCount = Math.max(0, totalInQueue - studyQueueIndex);
  const estimatedMinsRemaining = Math.max(1, Math.ceil((remainingCount * 18) / 60));
  const totalReviewedSoFar = sessionStats.again + sessionStats.hard + sessionStats.good + sessionStats.easy;
  const correctSoFar = sessionStats.good + sessionStats.easy;
  const accuracyPercent = totalReviewedSoFar > 0 ? Math.round((correctSoFar / totalReviewedSoFar) * 100) : 100;

  // Current Card FSRS & Recall Metrics
  const recallProbability = currentStudyCard
    ? calculateFSRSRetention(
        currentStudyCard.fsrsStability,
        currentStudyCard.lastReviewed || currentStudyCard.lastReviewedDate,
        currentStudyCard.box
      )
    : 100;

  const fsrsIntervals = currentStudyCard
    ? getFSRSEstimatedIntervals(
        currentStudyCard.fsrsStability,
        currentStudyCard.fsrsDifficulty,
        currentStudyCard.lastReviewed || currentStudyCard.lastReviewedDate,
        currentStudyCard.box,
        isFa
      )
    : { again: '< 10m', hard: '3d', good: '7d', easy: '15d' };

  return (
    <div className="space-y-3 min-w-0" dir={isFa ? 'rtl' : 'ltr'}>
      {/* 1. TOP HEADER & SWITCH BAR */}
      <div className="app-card border border-purple-500/30 rounded-2xl p-3 sm:p-4 bg-slate-900/90 backdrop-blur-md shadow-lg flex flex-wrap items-center justify-between gap-3">
        {/* Left Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-purple-600 via-indigo-600 to-sky-600 flex items-center justify-center text-white shadow-md shadow-purple-900/30 shrink-0">
            <Layers className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-black text-white tracking-tight">
                {isFa ? 'ماژول ۵: جعبه لایتنر و مرور هوشمند (FSRS & SM-2)' : 'Module 5: Smart Spaced Review (FSRS & Anki)'}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[11px] font-mono font-bold">
                FSRS v5 + SM-2
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {isFa
                ? `${cards.length} کارت در حافظه | ${totalDueCount} کارت نیازمند مرور امروز`
                : `${cards.length} Total Cards | ${totalDueCount} Cards Due Today`}
            </p>
          </div>
        </div>

        {/* View Switcher: Study Mode vs Decks & Settings */}
        <div className="flex items-center gap-2 flex-wrap ms-auto">
          <button
            type="button"
            onClick={() => triggerAiGenerator()}
            className="px-3 py-1.5 rounded-xl bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
            title={isFa ? 'تولید کارت جدید از متن با هوش مصنوعی' : 'Generate flashcards from text with AI'}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span className="hidden sm:inline">{isFa ? 'ساخت کارت با AI' : 'AI Card Studio'}</span>
          </button>

          <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800 flex-wrap gap-1">
            <button
              type="button"
              onClick={() => setCurrentView('anki_study')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                currentView === 'anki_study'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Play className="w-3.5 h-3.5 text-amber-300" />
              <span>{isFa ? 'مرور کارت‌ها (Study)' : 'Study Mode'}</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentView('decks_manager')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                currentView === 'decks_manager'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5 text-indigo-300" />
              <span>{isFa ? 'دسته‌ها و پوشه‌های دانش (Decks)' : 'Decks & Folders'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. MAIN VIEW SWITCHER */}
      {currentView === 'anki_study' ? (
        /* ========================================================================= */
        /* ANKIDROID MINIMALIST STUDY CANVAS                                         */
        /* ========================================================================= */
        <div className="space-y-3">
          {/* Top Bar for Study Mode: Clean Breadcrumb & Scope */}
          <div className="flex items-center justify-between text-xs px-2 text-slate-400 gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-purple-300 flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-purple-400" />
                <span>{studyScopeName}</span>
              </span>
              {activeStudyQueue.length > 0 && !sessionCompleted && (
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono text-[11px] font-bold">
                  {isFa ? `کارت ${studyQueueIndex + 1} از ${activeStudyQueue.length}` : `Card ${studyQueueIndex + 1} of ${activeStudyQueue.length}`}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Zen Mode Button */}
              {activeStudyQueue.length > 0 && !sessionCompleted && (
                <button
                  type="button"
                  onClick={() => setIsZenMode(true)}
                  className="px-2.5 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/35 text-purple-300 border border-purple-500/40 text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title={isFa ? 'ورود به حالت تمرکز کامل بدون حواس‌پرتی (کلید Z)' : 'Enter Zen Deep Focus Mode (Z)'}
                >
                  <Maximize2 className="w-3.5 h-3.5 text-purple-300" />
                  <span>{isFa ? 'تمرکز کامل (Zen)' : 'Zen Mode'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() =>
                  startStudyForScope({
                    title: isCramMode ? 'مرور کارت‌های امروز (Due)' : 'تمرین فشرده (همه کارت‌ها)',
                    cram: !isCramMode,
                  })
                }
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition flex items-center gap-1 cursor-pointer ${
                  isCramMode
                    ? 'bg-amber-500/20 text-amber-200 border-amber-500/40'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
                title={isFa ? 'تغییر بین کارت‌های نیازمند مرور و کل کارت‌ها' : 'Toggle Cram / Due Mode'}
              >
                <Zap className="w-3 h-3 text-amber-300" />
                <span>{isCramMode ? (isFa ? 'حالت فشرده (فعال)' : 'Cram Mode (Active)') : isFa ? 'تمرین فشرده' : 'Cram All'}</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentView('decks_manager')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <FolderTree className="w-3 h-3 text-indigo-400" />
                <span>{isFa ? 'تغییر دسته / فیلتر' : 'Change Deck'}</span>
              </button>
            </div>
          </div>

          {/* LIVE SESSION PROGRESS BAR */}
          {activeStudyQueue.length > 0 && !sessionCompleted && (
            <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 shadow-md">
              <div className="flex items-center justify-between text-xs font-semibold gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-mono font-bold">
                    {isFa ? `کارت ${currentCardNum} از ${totalInQueue}` : `Card ${currentCardNum} of ${totalInQueue}`}
                  </span>
                  <span className="text-slate-400 text-[11px] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isFa ? `زمان تخمینی: ~${estimatedMinsRemaining} دقیقه` : `~${estimatedMinsRemaining}m left`}</span>
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-emerald-400 font-mono font-bold flex items-center gap-1" title={isFa ? 'پاسخ درست' : 'Correct'}>
                    <Check className="w-3.5 h-3.5" />
                    <span>{correctSoFar}</span>
                  </span>
                  <span className="text-slate-600">|</span>
                  <span className="text-rose-400 font-mono font-bold flex items-center gap-1" title={isFa ? 'تکرار مجدد' : 'Again'}>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{sessionStats.again}</span>
                  </span>
                  <span className="text-slate-400 font-mono text-[10.5px]">
                    ({accuracyPercent}%)
                  </span>
                </div>
              </div>

              {/* Multi-segment visual progress track */}
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex shadow-inner">
                <div
                  className="bg-emerald-500 transition-all duration-300"
                  style={{ width: `${totalInQueue > 0 ? (correctSoFar / totalInQueue) * 100 : 0}%` }}
                  title={isFa ? `درست: ${correctSoFar}` : `Correct: ${correctSoFar}`}
                />
                <div
                  className="bg-rose-500 transition-all duration-300"
                  style={{ width: `${totalInQueue > 0 ? (sessionStats.again / totalInQueue) * 100 : 0}%` }}
                  title={isFa ? `تکرار: ${sessionStats.again}` : `Again: ${sessionStats.again}`}
                />
                <div
                  className="bg-amber-500 transition-all duration-300"
                  style={{ width: `${totalInQueue > 0 ? (sessionStats.hard / totalInQueue) * 100 : 0}%` }}
                  title={isFa ? `سخت: ${sessionStats.hard}` : `Hard: ${sessionStats.hard}`}
                />
              </div>
            </div>
          )}

          {/* EMPTY QUEUE OR SESSION COMPLETE */}
          {activeStudyQueue.length === 0 ? (
            <div className="app-card border border-slate-800 rounded-2xl p-8 sm:p-12 text-center space-y-4 max-w-xl mx-auto my-6 bg-slate-900/90 shadow-xl">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 mx-auto animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">
                  {isFa ? '🎉 عالیه! هیچ کارتی برای مرور امروز باقی نمانده است.' : '🎉 All Caught Up! No Cards Due Today.'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isFa
                    ? 'تمام کارت‌های موعددار برای این دسته مرور شدند. می‌توانید به ساخت کارت‌های بیشتر بپردازید یا حالت تمرین فشرده را فعال کنید.'
                    : 'You have reviewed all due cards in this deck. You can generate new cards or switch to Cram mode.'}
                </p>
              </div>

              <div className="flex gap-2 justify-center pt-2 flex-wrap">
                <button
                  type="button"
                  onClick={() =>
                    startStudyForScope({
                      title: isFa ? 'تمرین فشرده (همه کارت‌ها)' : 'Cram All Cards',
                      cram: true,
                    })
                  }
                  className="px-4 py-2 rounded-xl bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/40 text-amber-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  <span>{isFa ? 'تمرین فشرده (مرور همه کارت‌ها)' : 'Cram All Flashcards'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => triggerAiGenerator()}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>{isFa ? 'تولید کارت جدید با AI' : 'Generate More Cards'}</span>
                </button>
              </div>
            </div>
          ) : sessionCompleted ? (
            /* SESSION STATS SUMMARY */
            <div className="app-card border border-purple-500/40 rounded-2xl p-6 sm:p-8 text-center space-y-4 max-w-xl mx-auto my-6 bg-slate-900/95 shadow-2xl animate-in zoom-in-95">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 mx-auto">
                <Award className="w-8 h-8 text-amber-300" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {isFa ? 'جلسه مرور با موفقیت به پایان رسید!' : 'Study Session Completed!'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isFa
                    ? `تعداد ${activeStudyQueue.length} کارت طبق الگوریتم هوشمند FSRS / SM-2 زمان‌بندی شدند.`
                    : `${activeStudyQueue.length} cards scheduled according to FSRS v5 & Anki SM-2 algorithms.`}
                </p>
              </div>

              {/* 4-GRADE STATS GRID */}
              <div className="grid grid-cols-4 gap-2 text-xs py-2">
                <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300">
                  <div className="text-lg font-mono font-bold">{sessionStats.again}</div>
                  <div className="text-[10.5px]">{isFa ? 'تکرار (Again)' : 'Again'}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300">
                  <div className="text-lg font-mono font-bold">{sessionStats.hard}</div>
                  <div className="text-[10.5px]">{isFa ? 'سخت (Hard)' : 'Hard'}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">
                  <div className="text-lg font-mono font-bold">{sessionStats.good}</div>
                  <div className="text-[10.5px]">{isFa ? 'خوب (Good)' : 'Good'}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-sky-950/40 border border-sky-500/30 text-sky-300">
                  <div className="text-lg font-mono font-bold">{sessionStats.easy}</div>
                  <div className="text-[10.5px]">{isFa ? 'آسان (Easy)' : 'Easy'}</div>
                </div>
              </div>

              <div className="flex gap-2 justify-center pt-2 flex-wrap">
                <button
                  type="button"
                  onClick={() =>
                    startStudyForScope({
                      title: studyScopeName,
                      domain: studyFilterDomain,
                      system: studyFilterSystem,
                      box: studyFilterBox,
                      cram: false,
                    })
                  }
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>{isFa ? 'شروع دوباره مرور' : 'Review Again'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentView('decks_manager')}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  {isFa ? 'مشاهده دسته‌ها و پوشه‌ها' : 'View Decks'}
                </button>
              </div>
            </div>
          ) : currentStudyCard ? (
            /* =============================================================== */
            /* ANKIDROID ACTIVE FLASHCARD SURFACE (WITH TINDER SWIPE & FSRS)   */
            /* =============================================================== */
            <div className="w-full mx-auto max-w-3xl transition-all duration-200">
              <div className="w-full space-y-3">
                {/* ACTIVE CARD & CONTROLS */}
                <div className="space-y-3 w-full relative">
                  {/* TINDER SWIPE STAMP OVERLAYS */}
                  {dragOffset.x > 35 && (
                    <div
                      className="absolute top-6 end-6 z-30 px-4 py-2 rounded-2xl border-4 border-emerald-400 bg-emerald-950/90 text-emerald-300 font-black text-sm sm:text-base tracking-wider uppercase shadow-2xl rotate-12 flex items-center gap-2 pointer-events-none animate-in fade-in zoom-in-95"
                      style={{ opacity: Math.min(1, dragOffset.x / 100) }}
                    >
                      <ThumbsUp className="w-5 h-5 text-emerald-400" />
                      <span>{isFa ? 'بلدم (GOOD)' : 'GOOD'}</span>
                    </div>
                  )}

                  {dragOffset.x < -35 && (
                    <div
                      className="absolute top-6 start-6 z-30 px-4 py-2 rounded-2xl border-4 border-rose-500 bg-rose-950/90 text-rose-300 font-black text-sm sm:text-base tracking-wider uppercase shadow-2xl -rotate-12 flex items-center gap-2 pointer-events-none animate-in fade-in zoom-in-95"
                      style={{ opacity: Math.min(1, Math.abs(dragOffset.x) / 100) }}
                    >
                      <RotateCcw className="w-5 h-5 text-rose-400" />
                      <span>{isFa ? 'مرور مجدد (AGAIN)' : 'AGAIN'}</span>
                    </div>
                  )}

                  {/* THE CARD (WITH TOUCH / DRAG PHYSICS) */}
                  <div
                    ref={cardRef}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onMouseDown={handleTouchStart}
                    onMouseMove={handleTouchMove}
                    onMouseUp={handleTouchEnd}
                    style={{
                      transform: `translateX(${dragOffset.x}px) translateY(${dragOffset.y * 0.12}px) rotate(${dragOffset.x * 0.04}deg)`,
                      transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                      touchAction: 'pan-y',
                      cursor: isDragging ? 'grabbing' : 'grab',
                    }}
                    className={`app-card border rounded-2xl p-5 sm:p-7 space-y-5 shadow-2xl relative min-h-[340px] flex flex-col justify-between select-none ${
                      isAnswerRevealed
                        ? 'bg-slate-900 border-purple-500/50 ring-1 ring-purple-500/30'
                        : 'bg-slate-900 border-slate-700 hover:border-purple-500/40'
                    }`}
                  >
                    {/* CARD TOP INFO BAR */}
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-400 border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10.5px] font-bold">
                          {getModuleName(currentStudyCard)}
                        </span>
                        {getTypeBadge(currentStudyCard.type)}
                        <span className="text-slate-500">•</span>
                        <span className="font-bold text-slate-300">{currentStudyCard.category}</span>
                        <span className="text-slate-600">/</span>
                        <span className="text-slate-400">{currentStudyCard.topic}</span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* FSRS Retention Recall Probability Pill */}
                        <div
                          className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border shadow-xs transition-colors"
                          style={{
                            backgroundColor:
                              recallProbability >= 80
                                ? 'rgba(16, 185, 129, 0.15)'
                                : recallProbability >= 60
                                ? 'rgba(245, 158, 11, 0.15)'
                                : 'rgba(244, 63, 94, 0.15)',
                            borderColor:
                              recallProbability >= 80
                                ? 'rgba(16, 185, 129, 0.4)'
                                : recallProbability >= 60
                                ? 'rgba(245, 158, 11, 0.4)'
                                : 'rgba(244, 63, 94, 0.4)',
                            color:
                              recallProbability >= 80
                                ? '#34d399'
                                : recallProbability >= 60
                                ? '#fbbf24'
                                : '#fb7185',
                          }}
                          title={
                            isFa
                              ? `احتمال یادآوری بر اساس مدل علمی FSRS: ${recallProbability}٪`
                              : `FSRS Recall Probability: ${recallProbability}%`
                          }
                        >
                          <Activity className="w-3 h-3 animate-pulse" />
                          <span>{isFa ? `یادآوری: ${recallProbability}٪` : `Recall: ${recallProbability}%`}</span>
                        </div>

                        {/* Delete Card button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCard(currentStudyCard.id);
                          }}
                          className="px-2 py-0.5 rounded-md text-[11px] font-bold border border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/25 hover:text-rose-200 transition flex items-center gap-1 cursor-pointer"
                          title={isFa ? 'حذف این کارت از لایتنر' : 'Delete this flashcard'}
                        >
                          <Trash2 className="w-3 h-3 text-rose-400" />
                          <span className="hidden sm:inline">{isFa ? 'حذف' : 'Delete'}</span>
                        </button>

                        <span
                          className={`text-[10.5px] font-bold px-2 py-0.5 rounded-md border ${
                            LEITNER_BOX_NAMES[currentStudyCard.box].color
                          }`}
                        >
                          {LEITNER_BOX_NAMES[currentStudyCard.box][isFa ? 'fa' : 'en']}
                        </span>
                      </div>
                    </div>

                    {/* CARD FRONT: QUESTION */}
                    <div className="space-y-3 py-1 flex-1">
                      <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                        <HelpCircle className="w-4 h-4 text-amber-400" />
                        <span>{isFa ? 'پرسش سناریو / سوال کارت (Front):' : 'Question / Scenario (Front):'}</span>
                      </div>
                      <p className="text-base sm:text-lg text-white leading-relaxed font-semibold">
                        {getQuestionText(currentStudyCard)}
                      </p>

                      {/* SPECIALIZED RENDER: MCQ OPTIONS */}
                      {currentStudyCard.type === 'mcq' && currentStudyCard.mcqOptions && currentStudyCard.mcqOptions.length > 0 && (
                        <div className="space-y-2 pt-2">
                          <span className="text-[11px] font-bold text-slate-400 block">
                            {isFa ? 'گزینه‌ها (یک گزینه را انتخاب کنید):' : 'Choose an option:'}
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            {currentStudyCard.mcqOptions.map((opt, oIdx) => {
                              const optLetter = String.fromCharCode(65 + oIdx);
                              const isSelected = selectedMcqOption === opt.id;
                              let optStyle = 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-800';

                              if (isAnswerRevealed) {
                                if (opt.isCorrect) {
                                  optStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500 font-bold';
                                } else if (isSelected && !opt.isCorrect) {
                                  optStyle = 'bg-rose-950/80 border-rose-500 text-rose-200 ring-1 ring-rose-500 line-through';
                                }
                              } else if (isSelected) {
                                optStyle = 'bg-purple-900/60 border-purple-500 text-purple-200 ring-1 ring-purple-500 font-bold';
                              }

                              return (
                                <button
                                  key={opt.id || oIdx}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedMcqOption(opt.id);
                                    if (!isAnswerRevealed) setIsAnswerRevealed(true);
                                  }}
                                  className={`p-3 rounded-xl border text-start transition cursor-pointer flex items-start gap-2.5 ${optStyle}`}
                                >
                                  <span className="w-5 h-5 rounded-full bg-black/50 border border-white/20 flex items-center justify-center font-bold text-[11px] shrink-0">
                                    {optLetter}
                                  </span>
                                  <span className="leading-relaxed text-xs sm:text-[13px]">
                                    {isFa ? opt.text.fa || opt.text.en : opt.text.en || opt.text.fa}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* SPECIALIZED RENDER: CAL LABELS */}
                      {currentStudyCard.type === 'cal_warning' && currentStudyCard.calLabels && currentStudyCard.calLabels.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                            <span>{isFa ? 'برچسب‌های استرالیایی CAL:' : 'Australian CAL Labels:'}</span>
                          </span>
                          {currentStudyCard.calLabels.map((lbl, lIdx) => (
                            <span
                              key={lIdx}
                              className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-200 border border-amber-500/50 font-bold text-xs shadow-sm"
                            >
                              {lbl}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* SPECIALIZED RENDER: TRIAGE OUTCOME BADGE */}
                      {currentStudyCard.type === 'triage_redflag' && currentStudyCard.triageOutcome && (
                        <div className="pt-1">
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-lg border inline-flex items-center gap-1.5 ${
                              currentStudyCard.triageOutcome === 'urgent_referral'
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                                : currentStudyCard.triageOutcome === 'gp_referral'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                            }`}
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>
                              {currentStudyCard.triageOutcome === 'urgent_referral'
                                ? isFa ? '🚨 ارجاع اورژانسی (ED / 000)' : '🚨 Urgent Referral (Emergency)'
                                : currentStudyCard.triageOutcome === 'gp_referral'
                                ? isFa ? '⚠️ ارجاع به پزشک عمومی (GP)' : '⚠️ GP Referral Required'
                                : isFa ? '🟢 درمان در داروخانه (OTC Treatment)' : '🟢 Pharmacy OTC Supply'}
                            </span>
                          </span>
                        </div>
                      )}

                      {/* SPECIALIZED RENDER: CALCULATION METHOD */}
                      {currentStudyCard.type === 'calculation' && currentStudyCard.calculationFormula && (
                        <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-200 text-xs font-mono">
                          <span className="font-bold text-cyan-300 block text-[11px] mb-1">
                            {isFa ? '📐 فرمول و متغیرهای محاسبه:' : '📐 Formula & Variables:'}
                          </span>
                          <span>
                            {isFa
                              ? currentStudyCard.calculationFormula.fa || currentStudyCard.calculationFormula.en
                              : currentStudyCard.calculationFormula.en || currentStudyCard.calculationFormula.fa}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* CARD BACK: REVEALED ANSWER & PEARL */}
                    {isAnswerRevealed && (
                      <div className="border-t border-purple-500/30 pt-4 space-y-3.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <div className="space-y-1.5">
                          <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>{isFa ? 'پاسخ صحیح و استدلال بالینی (Back):' : 'Correct Answer & Clinical Rationale (Back):'}</span>
                          </div>
                          <p className="text-sm sm:text-base text-slate-100 leading-relaxed bg-emerald-950/30 border border-emerald-500/30 p-3.5 rounded-xl">
                            {getAnswerText(currentStudyCard)}
                          </p>
                        </div>

                        {/* Distractor rationale and clinical distinctions */}
                        {currentStudyCard.distractorRationale && (
                          <div className="text-xs p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-300 space-y-1">
                            <span className="font-bold text-amber-300 flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                              <span>{isFa ? 'نکات تمایز گزینه‌ها و تحلیل بالینی:' : 'Clinical Distinctions & Pitfalls:'}</span>
                            </span>
                            <p className="leading-relaxed">
                              {isFa
                                ? typeof currentStudyCard.distractorRationale === 'object'
                                  ? currentStudyCard.distractorRationale.fa || currentStudyCard.distractorRationale.en
                                  : String(currentStudyCard.distractorRationale)
                                : typeof currentStudyCard.distractorRationale === 'object'
                                ? currentStudyCard.distractorRationale.en || currentStudyCard.distractorRationale.fa
                                : String(currentStudyCard.distractorRationale)}
                            </p>
                          </div>
                        )}

                        {/* High Yield Clinical Pearl */}
                        {getPearlText(currentStudyCard) && (
                          <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-200 text-xs flex items-start gap-2">
                            <Sparkles className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-amber-300">{isFa ? 'نکته طلایی بالینی: ' : 'Key Clinical Point: '}</span>
                              <span>{getPearlText(currentStudyCard)}</span>
                            </div>
                          </div>
                        )}

                        {/* End of Answer Section */}
                      </div>
                    )}
                  </div>

                  {/* ANKIDROID BOTTOM CONTROLS */}
                  {!isAnswerRevealed ? (
                    /* SHOW ANSWER BUTTON */
                    <button
                      type="button"
                      onClick={() => setIsAnswerRevealed(true)}
                      className="w-full py-4 rounded-2xl bg-linear-to-r from-purple-600 via-indigo-600 to-sky-600 hover:from-purple-500 hover:to-sky-500 text-white text-sm sm:text-base font-bold shadow-xl shadow-purple-900/30 transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Eye className="w-5 h-5" />
                      <span>{isFa ? 'نمایش پاسخ (کلید Space یا سوایپ)' : 'Show Answer (Space or Swipe)'}</span>
                    </button>
                  ) : (
                    /* ANKI & FSRS 4-RATING BUTTON BAR */
                    <div className="space-y-1.5">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {/* 1. AGAIN */}
                        <button
                          type="button"
                          onClick={() => handleRateCard('again')}
                          className="p-3 sm:p-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white transition flex flex-col items-center justify-center gap-0.5 cursor-pointer shadow-md group"
                        >
                          <div className="flex items-center gap-1 text-xs font-bold">
                            <span className="w-4 h-4 rounded-full bg-black/30 flex items-center justify-center text-[10px] font-mono">1</span>
                            <span>{isFa ? 'تکرار مجدد' : 'Again'}</span>
                          </div>
                          <span className="text-[10px] text-rose-200/90 font-mono">{fsrsIntervals.again}</span>
                        </button>

                        {/* 2. HARD */}
                        <button
                          type="button"
                          onClick={() => handleRateCard('hard')}
                          className="p-3 sm:p-3.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white transition flex flex-col items-center justify-center gap-0.5 cursor-pointer shadow-md group"
                        >
                          <div className="flex items-center gap-1 text-xs font-bold">
                            <span className="w-4 h-4 rounded-full bg-black/30 flex items-center justify-center text-[10px] font-mono">2</span>
                            <span>{isFa ? 'سخت بود' : 'Hard'}</span>
                          </div>
                          <span className="text-[10px] text-amber-200/90 font-mono">{fsrsIntervals.hard}</span>
                        </button>

                        {/* 3. GOOD */}
                        <button
                          type="button"
                          onClick={() => handleRateCard('good')}
                          className="p-3 sm:p-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white transition flex flex-col items-center justify-center gap-0.5 cursor-pointer shadow-md group"
                        >
                          <div className="flex items-center gap-1 text-xs font-bold">
                            <span className="w-4 h-4 rounded-full bg-black/30 flex items-center justify-center text-[10px] font-mono">3</span>
                            <span>{isFa ? 'خوب بود' : 'Good'}</span>
                          </div>
                          <span className="text-[10px] text-emerald-200/90 font-mono">{fsrsIntervals.good}</span>
                        </button>

                        {/* 4. EASY */}
                        <button
                          type="button"
                          onClick={() => handleRateCard('easy')}
                          className="p-3 sm:p-3.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white transition flex flex-col items-center justify-center gap-0.5 cursor-pointer shadow-md group"
                        >
                          <div className="flex items-center gap-1 text-xs font-bold">
                            <span className="w-4 h-4 rounded-full bg-black/30 flex items-center justify-center text-[10px] font-mono">4</span>
                            <span>{isFa ? 'آسان (عالی)' : 'Easy'}</span>
                          </div>
                          <span className="text-[10px] text-sky-200/90 font-mono">{fsrsIntervals.easy}</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[10.5px] text-slate-500 px-1 pt-1">
                        <span>{isFa ? '📱 راهنمای سوایپ: کشیدن به راست = بلدم | کشیدن به چپ = تکرار' : '📱 Swipe Right = Good | Swipe Left = Again'}</span>
                        <span className="hidden sm:inline">{isFa ? '⌨️ کلیدها: ۱، ۲، ۳، ۴ | کلید Z: تمرکز کامل' : '⌨️ Hotkeys: 1, 2, 3, 4 | Z: Zen Mode'}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        /* ========================================================================= */
        /* DECKS, KNOWLEDGE TREE FOLDERS & LEITNER BOXES MANAGEMENT VIEW             */
        /* ========================================================================= */
        <div className="space-y-4">
          {/* Sub Navigation Bar for Management */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 flex-wrap">
              <button
                type="button"
                onClick={() => setManagerActiveTab('folders')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  managerActiveTab === 'folders'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FolderTree className="w-3.5 h-3.5 text-purple-300" />
                <span>{isFa ? 'درخت و دسته‌های دانش (Knowledge Tree)' : 'Knowledge Folders'}</span>
              </button>

              <button
                type="button"
                onClick={() => setManagerActiveTab('all_cards')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  managerActiveTab === 'all_cards'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-300" />
                <span>{isFa ? `مدیریت و حذف کارت‌ها (${cards.length})` : `Manage & Delete (${cards.length})`}</span>
              </button>

              <button
                type="button"
                onClick={() => setManagerActiveTab('boxes')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  managerActiveTab === 'boxes'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-indigo-300" />
                <span>{isFa ? 'جعبه‌های ۵ گانه' : '5 Leitner Boxes'}</span>
              </button>

              <button
                type="button"
                onClick={() => setManagerActiveTab('add_card')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  managerActiveTab === 'add_card'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Plus className="w-3.5 h-3.5 text-emerald-300" />
                <span>{isFa ? 'افزودن کارت دستی' : 'Add Card'}</span>
              </button>
            </div>

            {/* JSON Backup Tools */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportJson}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-700"
                title={isFa ? 'پشتیبان‌گیری از تمام کارت‌ها در قالب JSON' : 'Export all flashcards to JSON'}
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isFa ? 'خروجی JSON' : 'Export'}</span>
              </button>

              <label className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-700">
                <Upload className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isFa ? 'ورود JSON' : 'Import'}</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImportJson}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* TAB 1: PURE KNOWLEDGE TREE FOLDERS & SYSTEM DECKS */}
          {managerActiveTab === 'folders' && (
            <div className="space-y-3">
              {/* KNOWLEDGE FOLDER ACCORDION TREE */}
              <div className="app-card border border-slate-800 rounded-2xl p-4 bg-slate-900/90 shadow-md space-y-3">
                <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <FolderTree className="w-4 h-4 text-purple-400" />
                    <h3 className="text-xs sm:text-sm font-bold text-white">
                      {isFa ? 'دسته‌بندی موضوعی بر اساس درخت دانش (Knowledge Tree):' : 'Categorization by Knowledge Tree:'}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono">
                      {Object.keys(folderTree).length} {isFa ? 'حوزه کلان دانش' : 'Domains'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const allExpanded = Object.keys(folderTree).every((k) => expandedFolders[k]);
                        const next: Record<string, boolean> = {};
                        Object.keys(folderTree).forEach((k) => {
                          next[k] = !allExpanded;
                        });
                        setExpandedFolders(next);
                      }}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold transition cursor-pointer"
                    >
                      {Object.keys(folderTree).every((k) => expandedFolders[k])
                        ? isFa ? 'بستن همه' : 'Collapse All'
                        : isFa ? 'باز کردن همه' : 'Expand All'}
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {Object.entries(folderTree).map(([domainName, domainData]) => {
                    const isExpanded = !!expandedFolders[domainName];

                    return (
                      <div key={domainName} className="rounded-xl border border-slate-800 bg-slate-950/70 overflow-hidden shadow-sm">
                        {/* Level 1: Domain Row */}
                        <div
                          onClick={() =>
                            setExpandedFolders((prev) => ({ ...prev, [domainName]: !prev[domainName] }))
                          }
                          className="p-3.5 flex items-center justify-between gap-2 hover:bg-slate-900 cursor-pointer transition text-xs select-none"
                        >
                          <div className="flex items-center gap-2.5 font-bold text-slate-200">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-purple-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-500" />
                            )}
                            <FolderOpen className="w-4 h-4 text-amber-400" />
                            <span className="text-sm font-black text-white">{domainName}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                              {domainData.count} {isFa ? 'کارت' : 'cards'}
                              {domainData.dueCount > 0 && (
                                <span className="ms-1 text-amber-400 font-bold">({domainData.dueCount} {isFa ? 'موعد' : 'due'})</span>
                              )}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                startStudyForScope({
                                  title: domainName,
                                  domain: domainName,
                                  cram: domainData.dueCount === 0,
                                });
                              }}
                              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                            >
                              <Play className="w-3 h-3 text-amber-300" />
                              <span>{domainData.dueCount > 0 ? (isFa ? 'مرور موعددارها' : 'Study Due') : isFa ? 'مرور فشرده' : 'Cram'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Level 2: Systems inside Domain */}
                        {isExpanded && (
                          <div className="p-3 bg-slate-900/90 border-t border-slate-800 space-y-2 text-xs">
                            {Object.entries(domainData.systems).map(([systemName, systemData]) => (
                              <div
                                key={systemName}
                                className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col gap-2"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 text-slate-200 ps-2">
                                    <Folder className="w-4 h-4 text-indigo-400" />
                                    <span className="font-bold text-xs">{systemName}</span>
                                    <span className="text-[10.5px] text-slate-400 font-mono">
                                      ({systemData.count} {isFa ? 'کارت' : 'cards'}
                                      {systemData.dueCount > 0 && (
                                        <span className="text-amber-400 font-bold ms-1">| {systemData.dueCount} {isFa ? 'موعد' : 'due'}</span>
                                      )})
                                    </span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      startStudyForScope({
                                        title: `${domainName} / ${systemName}`,
                                        domain: domainName,
                                        system: systemName,
                                        cram: systemData.dueCount === 0,
                                      })
                                    }
                                    className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                                  >
                                    <Play className="w-2.5 h-2.5 text-amber-300" />
                                    <span>{systemData.dueCount > 0 ? (isFa ? 'مرور' : 'Study') : isFa ? 'مرور فشرده' : 'Cram'}</span>
                                  </button>
                                </div>

                                {/* Level 3: Subsystems / Topics Chips */}
                                <div className="flex items-center gap-1.5 flex-wrap ps-6 pt-1">
                                  {Object.entries(systemData.subsystems).map(([subName, subData]) => (
                                    <button
                                      key={subName}
                                      type="button"
                                      onClick={() =>
                                        startStudyForScope({
                                          title: `${domainName} > ${systemName} > ${subName}`,
                                          domain: domainName,
                                          system: systemName,
                                          subsystem: subName,
                                          cram: subData.dueCount === 0,
                                        })
                                      }
                                      className="px-2 py-0.5 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10.5px] text-slate-300 hover:text-white transition flex items-center gap-1 cursor-pointer"
                                    >
                                      <span>{subName}</span>
                                      <span className="text-[9.5px] px-1 rounded bg-slate-800 text-slate-400 font-mono">
                                        {subData.count}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ALL CARDS & INDIVIDUAL DELETE MANAGEMENT */}
          {managerActiveTab === 'all_cards' && (
            <div className="space-y-4">
              {/* Filter and Search Toolbar */}
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={isFa ? 'جستجو در درخت دانش، سوال، پاسخ یا نکته...' : 'Search knowledge tree, question, answer...'}
                      className="w-full ps-9 pe-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute end-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Knowledge Tree Domain Filter */}
                  <select
                    value={managerFilterDomain}
                    onChange={(e) => setManagerFilterDomain(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-purple-500 max-w-[200px]"
                  >
                    <option value="ALL">{isFa ? 'همه حوزه‌های درخت دانش' : 'All Knowledge Domains'}</option>
                    {uniqueDomains.map((dom) => (
                      <option key={dom} value={dom}>
                        {dom}
                      </option>
                    ))}
                  </select>

                  {/* Box Filter */}
                  <select
                    value={managerFilterBox}
                    onChange={(e) => setManagerFilterBox(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-purple-500"
                  >
                    <option value="ALL">{isFa ? 'همه جعبه‌ها (۱ تا ۵)' : 'All Boxes (1-5)'}</option>
                    <option value={1}>{isFa ? 'جعبه ۱ (روزانه)' : 'Box 1 (Daily)'}</option>
                    <option value={2}>{isFa ? 'جعبه ۲ (۳ روز)' : 'Box 2 (3 Days)'}</option>
                    <option value={3}>{isFa ? 'جعبه ۳ (۷ روز)' : 'Box 3 (7 Days)'}</option>
                    <option value={4}>{isFa ? 'جعبه ۴ (۱۴ روز)' : 'Box 4 (14 Days)'}</option>
                    <option value={5}>{isFa ? 'جعبه ۵ (۳۰ روز)' : 'Box 5 (30 Days)'}</option>
                  </select>

                  {/* Reset Filters */}
                  {(searchQuery || managerFilterDomain !== 'ALL' || managerFilterBox !== 'ALL') && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setManagerFilterDomain('ALL');
                        setManagerFilterBox('ALL');
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCw className="w-3 h-3 text-slate-400" />
                      <span>{isFa ? 'ریست فیلتر' : 'Reset'}</span>
                    </button>
                  )}

                  {/* Clear All Cards Button */}
                  {cards.length > 0 && (
                    <button
                      type="button"
                      onClick={handleDeleteAllCards}
                      className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      title={isFa ? 'پاکسازی کامل همه کارت‌های لایتنر' : 'Clear all Leitner cards'}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span className="hidden sm:inline">{isFa ? 'حذف همه کارت‌ها' : 'Clear All'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Cards Count Header */}
              <div className="flex items-center justify-between px-1 text-xs text-slate-400">
                <span>
                  {isFa
                    ? `نمایش ${filteredManagerCards.length} کارت از مجموع ${cards.length} کارت لایتنر`
                    : `Showing ${filteredManagerCards.length} of ${cards.length} Leitner flashcards`}
                </span>
                {filteredManagerCards.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (filteredManagerCards.length > 0) {
                        setStudyScopeName(
                          isFa
                            ? `مرور سفارشی (${filteredManagerCards.length} کارت فیلتر شده)`
                            : `Filtered Study (${filteredManagerCards.length} Cards)`
                        );
                        setStudyFilterDomain(managerFilterDomain);
                        setStudyFilterSystem('ALL');
                        setStudyFilterSubsystem('ALL');
                        setStudyFilterBox(managerFilterBox);
                        setIsCramMode(true);
                        setStudyQueueIndex(0);
                        setIsAnswerRevealed(false);
                        setSelectedMcqOption(null);
                        setSessionCompleted(false);
                        setSessionStats({ again: 0, hard: 0, good: 0, easy: 0 });
                        setCurrentView('anki_study');
                      }
                    }}
                    className="text-purple-300 hover:text-purple-200 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 text-amber-300" />
                    <span>{isFa ? 'مرور فشرده این موارد فیلتر شده' : 'Study Filtered Cards'}</span>
                  </button>
                )}
              </div>

              {/* Cards List */}
              {filteredManagerCards.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-500 mx-auto flex items-center justify-center">
                    <FileText className="w-6 h-6" />
                  </div>
                  <p className="text-sm text-slate-400">
                    {isFa ? 'هیچ کارتی با این مشخصات یافت نشد.' : 'No flashcards matched your filters.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setManagerFilterDomain('ALL');
                      setManagerFilterBox('ALL');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold cursor-pointer"
                  >
                    {isFa ? 'نمایش همه کارت‌ها' : 'Show All Cards'}
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredManagerCards.map((card, idx) => {
                    const qText = getQuestionText(card);
                    const aText = getAnswerText(card);
                    const pText = getPearlText(card);
                    const domainLabel = typeof card.knowledgeTree?.domain === 'object'
                      ? isFa ? card.knowledgeTree.domain.fa || card.knowledgeTree.domain.en : card.knowledgeTree.domain.en || card.knowledgeTree.domain.fa
                      : card.knowledgeTree?.domain || card.category || (isFa ? 'دانش بالینی OPRA' : 'Clinical Knowledge');
                    const systemLabel = typeof card.knowledgeTree?.system === 'object'
                      ? isFa ? card.knowledgeTree.system.fa || card.knowledgeTree.system.en : card.knowledgeTree.system.en || card.knowledgeTree.system.fa
                      : card.knowledgeTree?.system || card.topic || (isFa ? 'مورد بالینی' : 'Clinical Case');
                    const subsystemLabel = typeof card.knowledgeTree?.subsystem === 'object'
                      ? isFa ? card.knowledgeTree.subsystem.fa || card.knowledgeTree.subsystem.en : card.knowledgeTree.subsystem.en || card.knowledgeTree.subsystem.fa
                      : card.knowledgeTree?.subsystem || '';

                    return (
                      <div
                        key={card.id}
                        className="p-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 transition shadow-sm space-y-2.5"
                      >
                        {/* Header: Badges & Actions */}
                        <div className="flex items-center justify-between gap-2 flex-wrap border-b border-slate-800/80 pb-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] font-mono font-bold text-slate-500">#{idx + 1}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border bg-purple-500/10 text-purple-300 border-purple-500/30">
                              {domainLabel}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border bg-indigo-500/10 text-indigo-300 border-indigo-500/30">
                              {systemLabel}
                            </span>
                            {getTypeBadge(card.type)}
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                LEITNER_BOX_NAMES[card.box].color
                              }`}
                            >
                              {LEITNER_BOX_NAMES[card.box][isFa ? 'fa' : 'en']}
                            </span>
                            {subsystemLabel && (
                              <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                                › {subsystemLabel}
                              </span>
                            )}
                          </div>

                          {/* Fast Action Buttons */}
                          <div className="flex items-center gap-1.5 ms-auto">
                            {/* Study this card */}
                            <button
                              type="button"
                              onClick={() =>
                                startStudyForScope({
                                  title: qText,
                                  singleCardId: card.id,
                                  cram: true,
                                })
                              }
                              className="px-2.5 py-1 rounded-lg bg-purple-600/90 hover:bg-purple-600 text-white text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                              title={isFa ? 'مرور اختصاصی این کارت' : 'Study this card'}
                            >
                              <Play className="w-3 h-3 text-amber-300" />
                              <span>{isFa ? 'مرور کارت' : 'Study'}</span>
                            </button>

                            {/* Delete this card */}
                            <button
                              type="button"
                              onClick={() => handleDeleteCard(card.id)}
                              className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 text-rose-300 hover:text-rose-200 border border-rose-500/30 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                              title={isFa ? 'حذف این کارت از لایتنر' : 'Delete this flashcard'}
                            >
                              <Trash2 className="w-3 h-3 text-rose-400" />
                              <span>{isFa ? 'حذف' : 'Delete'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Question Text */}
                        <div>
                          <div className="text-[11px] font-bold text-amber-400/90 flex items-center gap-1 mb-0.5">
                            <HelpCircle className="w-3 h-3 text-amber-400" />
                            <span>{isFa ? 'صورت سوال (Question):' : 'Question:'}</span>
                          </div>
                          <p className="text-xs sm:text-sm font-semibold text-slate-100 leading-relaxed">
                            {qText}
                          </p>
                        </div>

                        {/* Answer Text */}
                        <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1 text-xs">
                          <div className="text-[11px] font-bold text-purple-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>{isFa ? 'پاسخ و تحلیل بالینی (Answer):' : 'Target Answer:'}</span>
                          </div>
                          <p className="text-slate-300 leading-relaxed font-medium">
                            {aText}
                          </p>
                        </div>

                        {/* Pearl or Source (if present) */}
                        {pText && (
                          <div className="p-2 rounded-lg bg-amber-950/20 border border-amber-500/20 text-[11.5px] text-amber-200/90 flex items-start gap-1.5">
                            <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-amber-400">{isFa ? 'نکته طلایی: ' : 'Clinical Pearl: '}</span>
                              <span>{pText}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: LEITNER 5 BOXES DISTRIBUTION */}
          {managerActiveTab === 'boxes' && (
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
              {([1, 2, 3, 4, 5] as const).map((boxNum) => {
                const count = boxCounts[boxNum];
                const boxInfo = LEITNER_BOX_NAMES[boxNum];
                const interval = LEITNER_INTERVALS[boxNum];

                return (
                  <div
                    key={boxNum}
                    className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between gap-3 shadow-md"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400">
                          {isFa ? `جعبه ${boxNum}` : `Box ${boxNum}`}
                        </span>
                        <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded border ${boxInfo.color}`}>
                          {boxInfo[isFa ? 'fa' : 'en']}
                        </span>
                      </div>
                      <div className="text-2xl font-mono font-black text-white pt-1">{count}</div>
                      <div className="text-[11px] text-slate-500">
                        {isFa ? `فاصله مرور: هر ${interval} روز` : `Interval: every ${interval} days`}
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={count === 0}
                      onClick={() =>
                        startStudyForScope({
                          title: isFa ? `مرور جعبه ${boxNum} (${boxInfo.fa})` : `Box ${boxNum} Review`,
                          box: boxNum,
                          cram: true,
                        })
                      }
                      className="w-full py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-30 text-white text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <Play className="w-3 h-3 text-amber-300" />
                      <span>{isFa ? 'مرور این جعبه' : 'Study Box'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: ADD MANUAL CARD FORM */}
          {managerActiveTab === 'add_card' && (
            <div className="app-card border border-slate-800 rounded-2xl p-4 sm:p-5 bg-slate-900/90 shadow-md max-w-2xl mx-auto space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>{isFa ? 'افزودن دستی فلش‌کارت جدید به جعبه ۱:' : 'Create Custom Flashcard in Box 1:'}</span>
              </h3>

              <form onSubmit={handleAddManualCard} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1">{isFa ? 'حوزه درخت دانش (Domain):' : 'Knowledge Domain:'}</label>
                    <input
                      type="text"
                      value={newCardForm.domain}
                      onChange={(e) => setNewCardForm({ ...newCardForm, domain: e.target.value })}
                      className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200"
                      placeholder="e.g. Clinical Pharmacotherapy"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">{isFa ? 'سیستم / دستگاه (System):' : 'System:'}</label>
                    <input
                      type="text"
                      value={newCardForm.system}
                      onChange={(e) => setNewCardForm({ ...newCardForm, system: e.target.value })}
                      className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200"
                      placeholder="e.g. Respiratory & Asthma"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">{isFa ? 'زیرشاخه (Subsystem):' : 'Subsystem / Topic:'}</label>
                    <input
                      type="text"
                      value={newCardForm.subsystem}
                      onChange={(e) => setNewCardForm({ ...newCardForm, subsystem: e.target.value })}
                      placeholder="e.g. Inhaler Technique"
                      className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">{isFa ? 'پرسش کارت (روی کارت):' : 'Question (Front):'}</label>
                  <textarea
                    rows={3}
                    value={newCardForm.question}
                    onChange={(e) => setNewCardForm({ ...newCardForm, question: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200"
                    placeholder={isFa ? 'پرسش سناریو یا مفهوم بالینی...' : 'Enter question or scenario...'}
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">{isFa ? 'پاسخ صحیح (پشت کارت):' : 'Answer (Back):'}</label>
                  <textarea
                    rows={3}
                    value={newCardForm.answer}
                    onChange={(e) => setNewCardForm({ ...newCardForm, answer: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200"
                    placeholder={isFa ? 'پاسخ و تحلیل بالینی کامل...' : 'Enter detailed answer...'}
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">{isFa ? 'نکته کلیدی بالینی (اختیاری):' : 'Key Clinical Point (Optional):'}</label>
                  <input
                    type="text"
                    value={newCardForm.pearl}
                    onChange={(e) => setNewCardForm({ ...newCardForm, pearl: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200"
                    placeholder={isFa ? 'نکته کلیدی و تمایز بالینی...' : 'Key clinical point or pearl...'}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isFa ? 'ذخیره و افزودن به جعبه ۱' : 'Save Flashcard'}</span>
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* 3. ZEN / DEEP FOCUS MODE FULLSCREEN PORTAL */}
      {isZenMode && typeof document !== 'undefined' && createPortal(
        <div
          className={`fixed inset-0 z-50 overflow-y-auto flex flex-col justify-between p-4 sm:p-8 transition-colors duration-300 ${
            zenTheme === 'oled'
              ? 'bg-black text-slate-100'
              : 'bg-[#F5EFE6] text-[#1F1B18]'
          }`}
          dir={isFa ? 'rtl' : 'ltr'}
        >
          {/* Top Zen HUD Toolbar */}
          <div
            className="max-w-3xl w-full mx-auto flex items-center justify-between gap-3 text-xs border-b pb-3 mb-3 shrink-0"
            style={{ borderColor: zenTheme === 'oled' ? '#27272a' : '#dcd1c4' }}
          >
            <div className="flex items-center gap-3">
              <span
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${
                  zenTheme === 'oled'
                    ? 'bg-purple-950/60 border-purple-500/40 text-purple-300'
                    : 'bg-[#e8ded0] border-[#cbbca9] text-[#4a3f35]'
                }`}
              >
                {isFa ? `کارت ${currentCardNum} از ${totalInQueue}` : `Card ${currentCardNum} / ${totalInQueue}`}
              </span>
              <span className="text-[11px] flex items-center gap-1 opacity-70">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>{isFa ? `~${estimatedMinsRemaining} د باقی‌مانده` : `~${estimatedMinsRemaining}m left`}</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Theme Switcher: OLED vs Paper */}
              <div
                className={`p-1 rounded-xl flex items-center gap-1 border ${
                  zenTheme === 'oled' ? 'bg-slate-950 border-slate-800' : 'bg-[#e4d8c7] border-[#ccbea9]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setZenTheme('oled')}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                    zenTheme === 'oled' ? 'bg-slate-800 text-white shadow-xs' : 'opacity-60 hover:opacity-100'
                  }`}
                  title={isFa ? 'تم تاریک مطلق OLED' : 'OLED Pitch Black'}
                >
                  <Moon className="w-3 h-3 text-indigo-400" />
                  <span>OLED</span>
                </button>
                <button
                  type="button"
                  onClick={() => setZenTheme('paper')}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                    zenTheme === 'paper' ? 'bg-[#fcf9f2] text-[#1F1B18] shadow-xs' : 'opacity-60 hover:opacity-100'
                  }`}
                  title={isFa ? 'تم کاغذ گرم مطالعه' : 'Warm Paper'}
                >
                  <Sun className="w-3 h-3 text-amber-600" />
                  <span>Paper</span>
                </button>
              </div>

              {/* Exit Zen Mode */}
              <button
                type="button"
                onClick={() => setIsZenMode(false)}
                className={`p-2 rounded-xl border transition cursor-pointer flex items-center gap-1 font-bold ${
                  zenTheme === 'oled'
                    ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                    : 'bg-[#e2d5c2] border-[#ccbea9] text-[#332a22] hover:bg-[#d6c7b2]'
                }`}
                title={isFa ? 'خروج از تمرکز مطلق (Esc / Z)' : 'Exit Zen Mode (Esc / Z)'}
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline text-xs">{isFa ? 'خروج' : 'Exit'}</span>
              </button>
            </div>
          </div>

          {/* Center: Fullscreen Flashcard Canvas with Swipe Physics */}
          {currentStudyCard && !sessionCompleted ? (
            <div className="max-w-3xl w-full mx-auto flex-1 flex flex-col justify-center py-2 sm:py-6">
              <div className="relative w-full">
                {/* Tinder Swipe Stamp Overlays */}
                {dragOffset.x > 35 && (
                  <div
                    className="absolute top-6 end-6 z-30 px-4 py-2 rounded-2xl border-4 border-emerald-400 bg-emerald-950/95 text-emerald-300 font-black text-sm sm:text-base tracking-wider uppercase shadow-2xl rotate-12 flex items-center gap-2 pointer-events-none"
                    style={{ opacity: Math.min(1, dragOffset.x / 100) }}
                  >
                    <ThumbsUp className="w-5 h-5 text-emerald-400" />
                    <span>{isFa ? 'بلدم (GOOD)' : 'GOOD'}</span>
                  </div>
                )}

                {dragOffset.x < -35 && (
                  <div
                    className="absolute top-6 start-6 z-30 px-4 py-2 rounded-2xl border-4 border-rose-500 bg-rose-950/95 text-rose-300 font-black text-sm sm:text-base tracking-wider uppercase shadow-2xl -rotate-12 flex items-center gap-2 pointer-events-none"
                    style={{ opacity: Math.min(1, Math.abs(dragOffset.x) / 100) }}
                  >
                    <RotateCcw className="w-5 h-5 text-rose-400" />
                    <span>{isFa ? 'مرور مجدد (AGAIN)' : 'AGAIN'}</span>
                  </div>
                )}

                {/* Zen Card Body */}
                <div
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onMouseDown={handleTouchStart}
                  onMouseMove={handleTouchMove}
                  onMouseUp={handleTouchEnd}
                  style={{
                    transform: `translateX(${dragOffset.x}px) translateY(${dragOffset.y * 0.12}px) rotate(${dragOffset.x * 0.04}deg)`,
                    transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    touchAction: 'pan-y',
                    cursor: isDragging ? 'grabbing' : 'grab',
                  }}
                  className={`rounded-3xl p-6 sm:p-10 border shadow-2xl space-y-6 select-none transition-colors ${
                    zenTheme === 'oled'
                      ? isAnswerRevealed
                        ? 'bg-zinc-950 border-purple-500/50 ring-1 ring-purple-500/30'
                        : 'bg-zinc-950 border-zinc-800'
                      : isAnswerRevealed
                      ? 'bg-[#FCF9F2] border-amber-600/50 ring-1 ring-amber-600/30 shadow-[#e0d3be]'
                      : 'bg-[#FCF9F2] border-[#D9CEBF] shadow-[#e0d3be]'
                  }`}
                >
                  {/* Top Card Info & FSRS Recall Badge */}
                  <div
                    className="flex items-center justify-between text-xs pb-3 border-b border-opacity-30"
                    style={{ borderColor: zenTheme === 'oled' ? '#27272a' : '#e0d3be' }}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold opacity-80">{currentStudyCard.category}</span>
                      <span>/</span>
                      <span className="opacity-60">{currentStudyCard.topic}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div
                        className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border shadow-xs"
                        style={{
                          backgroundColor:
                            recallProbability >= 80
                              ? 'rgba(16, 185, 129, 0.2)'
                              : recallProbability >= 60
                              ? 'rgba(245, 158, 11, 0.2)'
                              : 'rgba(244, 63, 94, 0.2)',
                          borderColor:
                            recallProbability >= 80
                              ? 'rgba(16, 185, 129, 0.5)'
                              : recallProbability >= 60
                              ? 'rgba(245, 158, 11, 0.5)'
                              : 'rgba(244, 63, 94, 0.5)',
                          color:
                            recallProbability >= 80
                              ? '#10b981'
                              : recallProbability >= 60
                              ? '#d97706'
                              : '#e11d48',
                        }}
                      >
                        <Activity className="w-3.5 h-3.5 animate-pulse" />
                        <span>{isFa ? `احتمال یادآوری: ${recallProbability}٪` : `Retention: ${recallProbability}%`}</span>
                      </div>
                    </div>
                  </div>

                  {/* Question */}
                  <div className="space-y-3">
                    <p
                      className={`text-lg sm:text-2xl font-bold leading-relaxed ${
                        zenTheme === 'oled' ? 'text-white' : 'text-[#1A1412]'
                      }`}
                    >
                      {getQuestionText(currentStudyCard)}
                    </p>

                    {/* MCQ Options if available */}
                    {currentStudyCard.type === 'mcq' && currentStudyCard.mcqOptions && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-xs sm:text-sm">
                        {currentStudyCard.mcqOptions.map((opt, oIdx) => {
                          const optLetter = String.fromCharCode(65 + oIdx);
                          const isSelected = selectedMcqOption === opt.id;
                          return (
                            <button
                              key={opt.id || oIdx}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedMcqOption(opt.id);
                                if (!isAnswerRevealed) setIsAnswerRevealed(true);
                              }}
                              className={`p-3.5 rounded-2xl border text-start transition cursor-pointer flex items-start gap-2.5 ${
                                isAnswerRevealed && opt.isCorrect
                                  ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-bold'
                                  : isAnswerRevealed && isSelected && !opt.isCorrect
                                  ? 'bg-rose-950/60 border-rose-500 text-rose-300 line-through'
                                  : isSelected
                                  ? 'bg-purple-900/40 border-purple-500 text-purple-300 font-bold'
                                  : zenTheme === 'oled'
                                  ? 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                                  : 'bg-[#F2E8D8] border-[#D9CEBF] text-[#2C241E] hover:bg-[#EBDDCA]'
                              }`}
                            >
                              <span className="w-5 h-5 rounded-full bg-black/40 border border-white/20 flex items-center justify-center font-bold text-[11px] shrink-0">
                                {optLetter}
                              </span>
                              <span className="leading-relaxed">
                                {isFa ? opt.text.fa || opt.text.en : opt.text.en || opt.text.fa}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Revealed Answer in Zen Mode */}
                  {isAnswerRevealed && (
                    <div className="pt-4 border-t border-purple-500/30 space-y-4 animate-in fade-in duration-200">
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-emerald-500 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{isFa ? 'پاسخ صحیح و تحلیل بالینی:' : 'Correct Rationale:'}</span>
                        </div>
                        <p
                          className={`text-base sm:text-lg leading-relaxed p-4 rounded-2xl border ${
                            zenTheme === 'oled'
                              ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-100'
                              : 'bg-[#EBF7EE] border-emerald-400 text-[#144723]'
                          }`}
                        >
                          {getAnswerText(currentStudyCard)}
                        </p>
                      </div>

                      {getPearlText(currentStudyCard) && (
                        <div
                          className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2 ${
                            zenTheme === 'oled'
                              ? 'bg-purple-950/30 border-purple-500/30 text-purple-200'
                              : 'bg-[#F5EFFB] border-purple-300 text-[#432360]'
                          }`}
                        >
                          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-amber-500">{isFa ? 'نکته کلیدی: ' : 'Key Point: '}</span>
                            <span>{getPearlText(currentStudyCard)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          {/* Bottom Controls in Zen Mode */}
          <div className="max-w-3xl w-full mx-auto shrink-0 pt-2">
            {!isAnswerRevealed ? (
              <button
                type="button"
                onClick={() => setIsAnswerRevealed(true)}
                className="w-full py-4 rounded-2xl bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-base font-bold shadow-2xl transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Eye className="w-5 h-5" />
                <span>{isFa ? 'نمایش پاسخ (Space / Swipe)' : 'Show Answer (Space / Swipe)'}</span>
              </button>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleRateCard('again')}
                  className="p-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white transition flex flex-col items-center justify-center gap-0.5 cursor-pointer shadow-lg"
                >
                  <div className="flex items-center gap-1 text-xs font-bold">
                    <span className="w-4 h-4 rounded-full bg-black/30 flex items-center justify-center text-[10px]">1</span>
                    <span>{isFa ? 'تکرار' : 'Again'}</span>
                  </div>
                  <span className="text-[10px] opacity-90">{fsrsIntervals.again}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRateCard('hard')}
                  className="p-3.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white transition flex flex-col items-center justify-center gap-0.5 cursor-pointer shadow-lg"
                >
                  <div className="flex items-center gap-1 text-xs font-bold">
                    <span className="w-4 h-4 rounded-full bg-black/30 flex items-center justify-center text-[10px]">2</span>
                    <span>{isFa ? 'سخت' : 'Hard'}</span>
                  </div>
                  <span className="text-[10px] opacity-90">{fsrsIntervals.hard}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRateCard('good')}
                  className="p-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white transition flex flex-col items-center justify-center gap-0.5 cursor-pointer shadow-lg"
                >
                  <div className="flex items-center gap-1 text-xs font-bold">
                    <span className="w-4 h-4 rounded-full bg-black/30 flex items-center justify-center text-[10px]">3</span>
                    <span>{isFa ? 'خوب' : 'Good'}</span>
                  </div>
                  <span className="text-[10px] opacity-90">{fsrsIntervals.good}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRateCard('easy')}
                  className="p-3.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white transition flex flex-col items-center justify-center gap-0.5 cursor-pointer shadow-lg"
                >
                  <div className="flex items-center gap-1 text-xs font-bold">
                    <span className="w-4 h-4 rounded-full bg-black/30 flex items-center justify-center text-[10px]">4</span>
                    <span>{isFa ? 'آسان' : 'Easy'}</span>
                  </div>
                  <span className="text-[10px] opacity-90">{fsrsIntervals.easy}</span>
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
