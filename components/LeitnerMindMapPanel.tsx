'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Language } from '@/types/pharmacy';
import { LeitnerCard } from '@/types/leitner';
import {
  MindMapNode,
  MindMapLevel,
  MindMapTextDisplay,
  MindMapLineStyle,
  MindMapViewMode,
} from '@/types/mindmap';
import {
  computeMindMapLayout,
  MINDMAP_THEMES,
  DOMAIN_COLOR_PALETTES,
} from '@/lib/mindmapLayout';
import { MindMapCanvas } from '@/components/mindmap/MindMapCanvas';
import { BranchStudyRunnerModal } from '@/components/mindmap/BranchStudyRunnerModal';
import {
  QuestionDetailModal,
  RenameNodeModal,
  ColorPickerModal,
} from '@/components/mindmap/MindMapModals';
import { MindMapSettingsModal } from '@/components/mindmap/MindMapSettingsModal';
import { getClientAiConfig, saveClientAiConfig } from '@/lib/aiConfigStorage';
import {
  Sparkles,
  Search,
  BookOpen,
  FolderTree,
  Network,
  ListTree,
  Languages,
  Layers,
  Filter,
  Check,
  X,
  Pencil,
  Palette,
  Play,
  RotateCcw,
  Sliders,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  HelpCircle,
  Flag,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  Folder,
  Stethoscope,
  Pill,
  Zap,
  Download,
  Maximize2,
  Minimize2,
  Share2,
  Settings,
} from 'lucide-react';

export interface LeitnerMindMapPanelProps {
  language: Language;
  cards: LeitnerCard[];
  onStartStudyBranch: (params: {
    title: string;
    domain?: string;
    system?: string;
    subsystem?: string;
    subClass?: string;
    microTopic?: string;
    module?: number | 'ALL';
    cardIds?: string[];
  }) => void;
  onOpenAiGenerator?: (snippetText?: string) => void;
  onAddSampleCards?: () => void;
  onDeleteCard?: (cardId: string) => void;
  onRateCard?: (cardId: string, rating: 'again' | 'hard' | 'good' | 'easy') => void;
  onUpdateCardBox?: (cardId: string, box: 1 | 2 | 3 | 4 | 5) => void;
  showLeitnerGrading?: boolean;
}

export type { MindMapNode };

// Storage keys
const NODE_ALIASES_STORAGE_KEY = 'AU_PHARMACY_NODE_ALIASES_V2';
const NODE_COLORS_STORAGE_KEY = 'AU_PHARMACY_NODE_COLORS_V2';
const CARD_FLAGS_STORAGE_KEY = 'AU_PHARMACY_MINDMAP_FLAGS_V1';

// Flags definition
export type FlagColor = 'red' | 'amber' | 'green' | 'blue' | 'purple';

export const FLAG_OPTIONS: Record<
  FlagColor,
  {
    name: { fa: string; en: string };
    badge: string;
    pill: string;
    dot: string;
    iconColor: string;
  }
> = {
  red: {
    name: { fa: 'قرمز (نیاز به توجه / ضعف)', en: 'Red (High Priority)' },
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    pill: 'bg-rose-500 text-white',
    dot: 'bg-rose-500',
    iconColor: 'text-rose-400',
  },
  amber: {
    name: { fa: 'زرد (مرور مجدد)', en: 'Amber (Review Soon)' },
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    pill: 'bg-amber-500 text-slate-950',
    dot: 'bg-amber-400',
    iconColor: 'text-amber-400',
  },
  green: {
    name: { fa: 'سبز (تسلط کامل)', en: 'Green (Mastered)' },
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    pill: 'bg-emerald-500 text-white',
    dot: 'bg-emerald-400',
    iconColor: 'text-emerald-400',
  },
  blue: {
    name: { fa: 'آبی (نیازمند بررسی رفرنس)', en: 'Blue (Check Reference)' },
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    pill: 'bg-blue-500 text-white',
    dot: 'bg-blue-400',
    iconColor: 'text-blue-400',
  },
  purple: {
    name: { fa: 'بنفش (نکته کلیدی آزمون)', en: 'Purple (Exam Pearl)' },
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    pill: 'bg-purple-500 text-white',
    dot: 'bg-purple-400',
    iconColor: 'text-purple-400',
  },
};

export const LeitnerMindMapPanel: React.FC<LeitnerMindMapPanelProps> = ({
  language,
  cards,
  onStartStudyBranch,
  onOpenAiGenerator,
  onAddSampleCards,
  onDeleteCard,
  onRateCard,
  onUpdateCardBox,
  showLeitnerGrading = false,
}) => {
  const isFa = language === 'fa';
  const containerRef = useRef<HTMLDivElement>(null);

  // View modes
  const [viewMode, setViewMode] = useState<MindMapViewMode>('interactive_canvas');
  const [textDisplayMode, setTextDisplayMode] = useState<MindMapTextDisplay>('full_detailed');
  const [lineStyle, setLineStyle] = useState<MindMapLineStyle>('smooth_bezier');
  const [isZenMode, setIsZenMode] = useState(false);
  const [cardLangMode, setCardLangMode] = useState<'fa' | 'en' | 'bilingual'>('bilingual');

  // AI Config & Selected Model for Mind Map
  const [currentAiModel, setCurrentAiModel] = useState<string>(() => {
    return getClientAiConfig().flashcardModel || 'gemini-2.5-flash';
  });

  const handleSetAiModel = useCallback((modelId: string) => {
    setCurrentAiModel(modelId);
    const existing = getClientAiConfig();
    saveClientAiConfig({ ...existing, flashcardModel: modelId });
  }, []);

  // Settings Modal State
  const [isMindMapSettingsOpen, setIsMindMapSettingsOpen] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [filterModule, setFilterModule] = useState<number | 'ALL'>('ALL');
  const [filterBox, setFilterBox] = useState<number | 'ALL'>('ALL');
  const [selectedFlagFilters, setSelectedFlagFilters] = useState<string[]>([]);
  const [onlyDueToday, setOnlyDueToday] = useState(false);

  // Total Due Count across current cards
  const totalDueCount = useMemo(() => {
    const nowIso = new Date().toISOString();
    return cards.filter((c) => !c.nextReviewDate || c.nextReviewDate <= nowIso).length;
  }, [cards]);

  // Expanded Nodes state
  const [expandedNodeIds, setExpandedNodeIds] = useState<Record<string, boolean>>({
    root: true,
  });

  // Outliner revealed answers
  const [revealedAnswerIds, setRevealedAnswerIds] = useState<Record<string, boolean>>({});

  // Stored Card Flags
  const [cardFlags, setCardFlags] = useState<Record<string, FlagColor>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const saved = localStorage.getItem(CARD_FLAGS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Custom Node Aliases
  const [customAliases, setCustomAliases] = useState<Record<string, string>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const saved = localStorage.getItem(NODE_ALIASES_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Custom Node Colors
  const [customColors, setCustomColors] = useState<Record<string, string>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const saved = localStorage.getItem(NODE_COLORS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Modals & Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    node: MindMapNode | null;
  }>({
    isOpen: false,
    x: 0,
    y: 0,
    node: null,
  });

  const [renameModal, setRenameModal] = useState<{
    isOpen: boolean;
    node: MindMapNode | null;
    currentText: string;
  }>({
    isOpen: false,
    node: null,
    currentText: '',
  });

  const [colorPickerModal, setColorPickerModal] = useState<{
    isOpen: boolean;
    node: MindMapNode | null;
  }>({
    isOpen: false,
    node: null,
  });

  const [ratedCardMap, setRatedCardMap] = useState<Record<string, { rating: string; timestamp: number }>>({});

  const [selectedQuestionCard, setSelectedQuestionCard] = useState<LeitnerCard | null>(null);

  const [branchRunnerState, setBranchRunnerState] = useState<{
    isOpen: boolean;
    node: MindMapNode | null;
    cards: LeitnerCard[];
  }>({
    isOpen: false,
    node: null,
    cards: [],
  });

  // Close context menu on window click
  useEffect(() => {
    const handleOutsideClick = () => {
      if (contextMenu.isOpen) {
        setContextMenu((prev) => ({ ...prev, isOpen: false }));
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [contextMenu.isOpen]);

  // Set card flag handler
  const handleSetCardFlag = useCallback((cardId: string, flag: FlagColor | null) => {
    setCardFlags((prev) => {
      const updated = { ...prev };
      if (!flag) {
        delete updated[cardId];
      } else {
        updated[cardId] = flag;
      }
      try {
        localStorage.setItem(CARD_FLAGS_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save flag:', err);
      }
      return updated;
    });
  }, []);

  const handleSaveAlias = useCallback((canonicalKey: string, newTitle: string) => {
    setCustomAliases((prev) => {
      const updated = { ...prev };
      const trimmed = newTitle.trim();
      if (!trimmed) {
        delete updated[canonicalKey];
      } else {
        updated[canonicalKey] = trimmed;
      }
      try {
        localStorage.setItem(NODE_ALIASES_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save alias:', err);
      }
      return updated;
    });
    setRenameModal({ isOpen: false, node: null, currentText: '' });
  }, []);

  const handleResetAlias = useCallback((canonicalKey: string) => {
    setCustomAliases((prev) => {
      const updated = { ...prev };
      delete updated[canonicalKey];
      try {
        localStorage.setItem(NODE_ALIASES_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to reset alias:', err);
      }
      return updated;
    });
    setRenameModal({ isOpen: false, node: null, currentText: '' });
  }, []);

  const handleSaveColor = useCallback((canonicalKey: string, colorKey: string) => {
    setCustomColors((prev) => {
      const updated = { ...prev };
      if (!colorKey || colorKey === 'default') {
        delete updated[canonicalKey];
      } else {
        updated[canonicalKey] = colorKey;
      }
      try {
        localStorage.setItem(NODE_COLORS_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save color:', err);
      }
      return updated;
    });
    setColorPickerModal({ isOpen: false, node: null });
  }, []);

  const getNodeDisplayTitle = useCallback(
    (node: MindMapNode) => {
      if (node.canonicalKey && customAliases[node.canonicalKey]) {
        return customAliases[node.canonicalKey];
      }
      if (cardLangMode === 'en') {
        return node.title.en || node.title.fa;
      }
      if (cardLangMode === 'fa') {
        return node.title.fa || node.title.en;
      }
      return isFa ? node.title.fa || node.title.en : node.title.en || node.title.fa;
    },
    [isFa, customAliases, cardLangMode]
  );

  const getNodeColorTheme = useCallback(
    (node: MindMapNode) => {
      if (node.canonicalKey && customColors[node.canonicalKey]) {
        const custom = customColors[node.canonicalKey];
        if (MINDMAP_THEMES[custom]) return custom;
      }
      return node.colorTheme || 'purple';
    },
    [customColors]
  );

  // Context Menu trigger
  const handleOpenContextMenu = useCallback(
    (e: React.MouseEvent | React.TouchEvent, node: MindMapNode) => {
      e.preventDefault();
      e.stopPropagation();

      let clientX = 0;
      let clientY = 0;
      if ('clientX' in e) {
        clientX = e.clientX;
        clientY = e.clientY;
      } else if ('touches' in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      }

      const sw = typeof window !== 'undefined' ? window.innerWidth : 1000;
      const sh = typeof window !== 'undefined' ? window.innerHeight : 800;
      const posX = clientX + 260 > sw ? Math.max(10, sw - 275) : clientX;
      const posY = clientY + 300 > sh ? Math.max(10, sh - 310) : clientY;

      setContextMenu({
        isOpen: true,
        x: posX,
        y: posY,
        node,
      });
    },
    []
  );

  // Filter Cards
  const filteredCards = useMemo(() => {
    const nowIso = new Date().toISOString();
    return cards.filter((card) => {
      if (filterModule !== 'ALL' && card.module !== filterModule) return false;
      if (filterBox !== 'ALL' && card.box !== filterBox) return false;

      // Filter by due date if "Today's Due Map" mode is enabled (Module 5 only)
      if (showLeitnerGrading && onlyDueToday) {
        const isDue = !card.nextReviewDate || card.nextReviewDate <= nowIso;
        if (!isDue) return false;
      }

      // Filter by flags (Module 6 only)
      if (!showLeitnerGrading && selectedFlagFilters.length > 0) {
        const flag = cardFlags[card.id];
        const matchFlag = flag ? selectedFlagFilters.includes(flag) : selectedFlagFilters.includes('none');
        if (!matchFlag) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const qText =
          typeof card.question === 'object' && card.question !== null
            ? `${card.question.fa || ''} ${card.question.en || ''}`.toLowerCase()
            : String(card.question || '').toLowerCase();
        const aText =
          typeof card.answer === 'object' && card.answer !== null
            ? `${card.answer.fa || ''} ${card.answer.en || ''}`.toLowerCase()
            : String(card.answer || '').toLowerCase();
        const match =
          qText.includes(q) ||
          aText.includes(q) ||
          (card.topic ? card.topic.toLowerCase().includes(q) : false) ||
          (card.category ? card.category.toLowerCase().includes(q) : false) ||
          (card.tags?.some((t) => t.toLowerCase().includes(q)) ?? false);
        if (!match) return false;
      }

      return true;
    });
  }, [cards, filterModule, filterBox, showLeitnerGrading, onlyDueToday, selectedFlagFilters, cardFlags, searchQuery]);

  // Build Mind Map Tree
  const mindMapTree = useMemo<MindMapNode>(() => {
    const rootNode: MindMapNode = {
      id: 'root',
      level: 0,
      canonicalKey: 'ROOT_AU_CLINICAL_MINDMAP',
      title: {
        fa: 'نقشه جامع یادگیری و فارماکوتراپی استرالیا',
        en: 'Australian Pharmacy Practice Knowledge Tree',
      },
      children: [],
      cardCount: filteredCards.length,
      dueCount: 0,
      boxCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      colorTheme: 'purple',
    };

    type MicroTopicEntry = { title: { fa: string; en: string }; cards: LeitnerCard[] };
    type SubClassEntry = { title: { fa: string; en: string }; isGeneric: boolean; microTopics: Map<string, MicroTopicEntry> };
    type ConditionEntry = { title: { fa: string; en: string }; subClasses: Map<string, SubClassEntry> };
    type SystemEntry = { title: { fa: string; en: string }; conditions: Map<string, ConditionEntry> };
    type DomainEntry = { title: { fa: string; en: string }; module?: 1 | 2 | 3 | 4 | 5 | 6; systems: Map<string, SystemEntry> };

    const domainMap = new Map<string, DomainEntry>();

    filteredCards.forEach((card) => {
      // 1. Domain
      const domainKey =
        card.knowledgeTree?.domain?.en ||
        card.knowledgeTree?.domain?.fa ||
        card.moduleName?.en ||
        `Module ${card.module}`;
      const domainFa = card.knowledgeTree?.domain?.fa || card.moduleName?.fa || `ماژول ${card.module}`;
      const domainEn = card.knowledgeTree?.domain?.en || card.moduleName?.en || `Module ${card.module}`;

      if (!domainMap.has(domainKey)) {
        domainMap.set(domainKey, {
          title: { fa: domainFa, en: domainEn },
          module: card.module,
          systems: new Map(),
        });
      }
      const dEntry = domainMap.get(domainKey)!;

      // 2. System
      const systemKey = card.knowledgeTree?.system?.en || card.knowledgeTree?.system?.fa || card.category || 'General Pharmacology';
      const systemFa = card.knowledgeTree?.system?.fa || card.category || 'سیستم و مباحث کلان';
      const systemEn = card.knowledgeTree?.system?.en || card.category || 'General Organ Systems';

      if (!dEntry.systems.has(systemKey)) {
        dEntry.systems.set(systemKey, {
          title: { fa: systemFa, en: systemEn },
          conditions: new Map(),
        });
      }
      const sEntry = dEntry.systems.get(systemKey)!;

      // 3. Condition
      const conditionKey = card.knowledgeTree?.subsystem?.en || card.knowledgeTree?.condition?.en || card.topic || 'Core Therapeutics';
      const conditionFa = card.knowledgeTree?.subsystem?.fa || card.knowledgeTree?.condition?.fa || card.topic || 'رده درمانی و بیماری‌ها';
      const conditionEn = card.knowledgeTree?.subsystem?.en || card.knowledgeTree?.condition?.en || card.topic || 'Therapeutics & Conditions';

      if (!sEntry.conditions.has(conditionKey)) {
        sEntry.conditions.set(conditionKey, {
          title: { fa: conditionFa, en: conditionEn },
          subClasses: new Map(),
        });
      }
      const cEntry = sEntry.conditions.get(conditionKey)!;

      // 4. Subclass
      const rawScKey = card.knowledgeTree?.subClass?.en || card.knowledgeTree?.drugGroup?.en || '';
      const rawScFa = card.knowledgeTree?.subClass?.fa || card.knowledgeTree?.drugGroup?.fa || '';
      const rawScEn = card.knowledgeTree?.subClass?.en || card.knowledgeTree?.drugGroup?.en || '';
      const isDirect = !rawScKey || rawScKey.toLowerCase().includes('pharmacology') || rawScFa.includes('فارماکولوژی');
      const scKey = isDirect ? '__DIRECT__' : rawScKey;

      if (!cEntry.subClasses.has(scKey)) {
        cEntry.subClasses.set(scKey, {
          title: { fa: isDirect ? conditionFa : rawScFa || conditionFa, en: isDirect ? conditionEn : rawScEn || conditionEn },
          isGeneric: isDirect,
          microTopics: new Map(),
        });
      }
      const scEntry = cEntry.subClasses.get(scKey)!;

      // 5. Microtopic
      const microKey = card.knowledgeTree?.microTopic?.en || (card.tags && card.tags.length > 0 ? card.tags[0] : 'Clinical Pearls');
      const microFa = card.knowledgeTree?.microTopic?.fa || (card.tags && card.tags.length > 0 ? card.tags[0] : 'نکات کلیدی و بالینی');
      const microEn = card.knowledgeTree?.microTopic?.en || (card.tags && card.tags.length > 0 ? card.tags[0] : 'Clinical Pearls');

      if (!scEntry.microTopics.has(microKey)) {
        scEntry.microTopics.set(microKey, {
          title: { fa: microFa, en: microEn },
          cards: [],
        });
      }
      scEntry.microTopics.get(microKey)!.cards.push(card);
    });

    let domainIdx = 0;

    domainMap.forEach((dVal, dKey) => {
      const domainColor = DOMAIN_COLOR_PALETTES[domainIdx % DOMAIN_COLOR_PALETTES.length];
      domainIdx++;

      const domainNode: MindMapNode = {
        id: `dom-${dKey}`,
        level: 1,
        parentId: 'root',
        canonicalKey: `DOMAIN_${dKey}`,
        title: dVal.title,
        module: dVal.module,
        domainName: dKey,
        children: [],
        cardCount: 0,
        dueCount: 0,
        boxCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        colorTheme: domainColor,
      };

      dVal.systems.forEach((sVal, sKey) => {
        const sysNode: MindMapNode = {
          id: `sys-${dKey}-${sKey}`,
          level: 2,
          parentId: domainNode.id,
          canonicalKey: `SYSTEM_${sKey}`,
          title: sVal.title,
          module: dVal.module,
          domainName: dKey,
          systemName: sKey,
          children: [],
          cardCount: 0,
          dueCount: 0,
          boxCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          colorTheme: domainColor,
        };

        sVal.conditions.forEach((cVal, cKey) => {
          const condNode: MindMapNode = {
            id: `cond-${dKey}-${sKey}-${cKey}`,
            level: 3,
            parentId: sysNode.id,
            canonicalKey: `COND_${cKey}`,
            title: cVal.title,
            module: dVal.module,
            domainName: dKey,
            systemName: sKey,
            subsystemName: cKey,
            children: [],
            cardCount: 0,
            dueCount: 0,
            boxCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            colorTheme: domainColor,
          };

          cVal.subClasses.forEach((scVal, scKey) => {
            scVal.microTopics.forEach((mVal, mKey) => {
              const microNode: MindMapNode = {
                id: `micro-${dKey}-${sKey}-${cKey}-${scKey}-${mKey}`,
                level: 5,
                parentId: condNode.id,
                canonicalKey: `MICRO_${mKey}`,
                title: mVal.title,
                module: dVal.module,
                domainName: dKey,
                systemName: sKey,
                subsystemName: cKey,
                microTopicName: mKey,
                children: [],
                cardCount: mVal.cards.length,
                dueCount: 0,
                boxCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
                colorTheme: domainColor,
              };

              mVal.cards.forEach((card) => {
                const nowIso = new Date().toISOString();
                const isDue = !card.nextReviewDate || card.nextReviewDate <= nowIso;
                if (isDue) microNode.dueCount++;
                microNode.boxCounts[card.box] = (microNode.boxCounts[card.box] || 0) + 1;

                const qNode: MindMapNode = {
                  id: `card-${card.id}`,
                  level: 6,
                  parentId: microNode.id,
                  canonicalKey: `CARD_${card.id}`,
                  title: {
                    fa: typeof card.question === 'object' ? card.question.fa || '' : card.question || '',
                    en: typeof card.question === 'object' ? card.question.en || '' : card.question || '',
                  },
                  module: card.module,
                  domainName: dKey,
                  systemName: sKey,
                  subsystemName: cKey,
                  microTopicName: mKey,
                  card,
                  children: [],
                  cardCount: 1,
                  dueCount: isDue ? 1 : 0,
                  boxCounts: {
                    1: card.box === 1 ? 1 : 0,
                    2: card.box === 2 ? 1 : 0,
                    3: card.box === 3 ? 1 : 0,
                    4: card.box === 4 ? 1 : 0,
                    5: card.box === 5 ? 1 : 0,
                  },
                  colorTheme: domainColor,
                };
                microNode.children.push(qNode);
              });

              condNode.children.push(microNode);
              condNode.cardCount += microNode.cardCount;
              condNode.dueCount += microNode.dueCount;
              for (let b = 1; b <= 5; b++) {
                condNode.boxCounts[b as 1 | 2 | 3 | 4 | 5] += microNode.boxCounts[b as 1 | 2 | 3 | 4 | 5];
              }
            });
          });

          sysNode.children.push(condNode);
          sysNode.cardCount += condNode.cardCount;
          sysNode.dueCount += condNode.dueCount;
          for (let b = 1; b <= 5; b++) {
            sysNode.boxCounts[b as 1 | 2 | 3 | 4 | 5] += condNode.boxCounts[b as 1 | 2 | 3 | 4 | 5];
          }
        });

        domainNode.children.push(sysNode);
        domainNode.cardCount += sysNode.cardCount;
        domainNode.dueCount += sysNode.dueCount;
        for (let b = 1; b <= 5; b++) {
          domainNode.boxCounts[b as 1 | 2 | 3 | 4 | 5] += sysNode.boxCounts[b as 1 | 2 | 3 | 4 | 5];
        }
      });

      rootNode.children.push(domainNode);
      rootNode.dueCount += domainNode.dueCount;
      for (let b = 1; b <= 5; b++) {
        rootNode.boxCounts[b as 1 | 2 | 3 | 4 | 5] += domainNode.boxCounts[b as 1 | 2 | 3 | 4 | 5];
      }
    });

    return rootNode;
  }, [filteredCards]);

  // Memoized recursive card mapping for high-performance matrix and outliner rendering (prevents UI freeze)
  const nodeCardsMap = useMemo(() => {
    const map: Record<string, LeitnerCard[]> = {};
    function populate(node: MindMapNode): LeitnerCard[] {
      const list: LeitnerCard[] = [];
      if (node.level === 6 && node.card) {
        list.push(node.card);
      }
      for (const ch of node.children) {
        list.push(...populate(ch));
      }
      map[node.id] = list;
      return list;
    }
    populate(mindMapTree);
    return map;
  }, [mindMapTree]);

  // Fast O(1) Helper to collect cards under node
  const collectCardsUnderNode = useCallback((node: MindMapNode): LeitnerCard[] => {
    return nodeCardsMap[node.id] || [];
  }, [nodeCardsMap]);

  // Open Sequential Study Runner
  const handleStartStudyRunner = useCallback(
    (node: MindMapNode) => {
      const subCards = collectCardsUnderNode(node);
      setBranchRunnerState({
        isOpen: true,
        node,
        cards: subCards,
      });
    },
    [collectCardsUnderNode]
  );

  // Compute Layout (Nodes & Curved Connections)
  const layoutResult = useMemo(() => {
    return computeMindMapLayout(
      mindMapTree,
      expandedNodeIds,
      textDisplayMode,
      cardLangMode,
      lineStyle,
      true,
      viewMode
    );
  }, [mindMapTree, expandedNodeIds, textDisplayMode, cardLangMode, lineStyle, viewMode]);

  // Toggle node expand/collapse
  const toggleNode = useCallback((nodeId: string) => {
    setExpandedNodeIds((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  }, []);

  const expandAll = useCallback(() => {
    const all: Record<string, boolean> = {};
    const traverse = (n: MindMapNode) => {
      all[n.id] = true;
      n.children.forEach(traverse);
    };
    traverse(mindMapTree);
    setExpandedNodeIds(all);
  }, [mindMapTree]);

  const collapseAll = useCallback(() => {
    setExpandedNodeIds({ root: true });
  }, []);

  // Expand to specific level
  const expandToLevel = useCallback((targetLevel: number) => {
    const res: Record<string, boolean> = { root: true };
    const traverse = (n: MindMapNode) => {
      if (n.level < targetLevel) {
        res[n.id] = true;
        n.children.forEach(traverse);
      }
    };
    traverse(mindMapTree);
    setExpandedNodeIds(res);
  }, [mindMapTree]);

  // Toggle multi-color flag
  const toggleFlagFilter = (flag: string) => {
    setSelectedFlagFilters((prev) => {
      if (prev.includes(flag)) {
        return prev.filter((f) => f !== flag);
      } else {
        return [...prev, flag];
      }
    });
  };

  // Export Mind Map to JSON
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(mindMapTree, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `AU_Pharmacy_MindMap_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // =========================================================================
  // RENDER: OUTLINER TREE VIEW (FULL TEXT DISPLAY)
  // =========================================================================
  const renderOutlinerNode = (node: MindMapNode, depth: number = 0) => {
    const isExpanded = !!expandedNodeIds[node.id];
    const hasChildren = node.children.length > 0;
    const themeKey = getNodeColorTheme(node);
    const theme = MINDMAP_THEMES[themeKey] || MINDMAP_THEMES.purple;
    const displayTitle = getNodeDisplayTitle(node);

    // Leaf Question Card
    if (node.level === 6 && node.card) {
      const card = node.card;
      const isRevealed = !!revealedAnswerIds[card.id];
      const qFa = typeof card.question === 'object' ? card.question.fa || card.question.en : card.question;
      const qEn = typeof card.question === 'object' ? card.question.en || card.question.fa : card.question;
      const aFa = typeof card.answer === 'object' ? card.answer.fa || card.answer.en : card.answer;
      const aEn = typeof card.answer === 'object' ? card.answer.en || card.answer.fa : card.answer;
      const pFa = card.pearl ? (typeof card.pearl === 'object' ? card.pearl.fa : card.pearl) : null;
      const pEn = card.pearl ? (typeof card.pearl === 'object' ? card.pearl.en : card.pearl) : null;
      const flag = cardFlags[card.id];
      const flagInfo = flag ? FLAG_OPTIONS[flag] : null;

      return (
        <div
          key={node.id}
          className={`rounded-2xl border transition-all duration-200 overflow-hidden mb-3 ${
            isRevealed
              ? 'bg-slate-900 border-purple-500/60 shadow-xl ring-1 ring-purple-500/30'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
          }`}
          onContextMenu={(e) => handleOpenContextMenu(e, node)}
        >
          <div
            onClick={() => setRevealedAnswerIds((prev) => ({ ...prev, [card.id]: !prev[card.id] }))}
            className="p-3.5 sm:p-4 flex items-start justify-between gap-3 cursor-pointer select-none"
          >
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0 mt-0.5">
                <HelpCircle className="w-4 h-4 text-cyan-400" />
              </div>

              {/* Full Text Display in Selected Single Language */}
              <div className="space-y-1 flex-1 min-w-0">
                {isFa ? (
                  <div className="font-bold text-xs sm:text-sm text-slate-100 leading-relaxed break-words whitespace-normal" dir="rtl">
                    {qFa || qEn}
                  </div>
                ) : (
                  <div className="font-semibold text-xs sm:text-sm text-slate-100 leading-relaxed font-sans break-words whitespace-normal" dir="ltr">
                    {qEn || qFa}
                  </div>
                )}

                <div className="flex items-center flex-wrap gap-2 pt-1 text-[10px]">
                  {flagInfo && (
                    <span className={`px-2 py-0.5 rounded-md border font-bold flex items-center gap-1 ${flagInfo.badge}`}>
                      <Flag className="w-3 h-3 fill-current" />
                      <span>{isFa ? flagInfo.name.fa : flagInfo.name.en}</span>
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono font-bold">
                    {isFa ? `جعبه ${card.box}` : `Box ${card.box}`}
                  </span>
                  <span className="text-slate-400 font-mono">#{card.topic || 'Clinical'}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedQuestionCard(card);
                }}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                title={isFa ? 'مشاهده در پنجره اختصاصی' : 'Open Detail Modal'}
              >
                <Eye className="w-4 h-4 text-cyan-400" />
              </button>

              {onDeleteCard && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(isFa ? 'حذف این فلش‌کارت؟' : 'Delete card?')) onDeleteCard(card.id);
                  }}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700 transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Revealed Answer */}
          {isRevealed && (
            <div className="p-4 border-t border-purple-500/20 bg-purple-950/20 space-y-3 text-xs animate-in fade-in">
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-purple-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isFa ? 'پاسخ بالینی و استدلال:' : 'Target Answer:'}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 leading-relaxed">
                  {isFa ? (
                    <div dir="rtl">{aFa || aEn}</div>
                  ) : (
                    <div dir="ltr" className="font-sans">
                      {aEn || aFa}
                    </div>
                  )}
                </div>
              </div>

              {(isFa ? pFa || pEn : pEn || pFa) && (
                <div className="p-3 rounded-xl bg-amber-950/25 border border-amber-500/30 text-amber-200 space-y-1">
                  <div className="font-bold flex items-center gap-1 text-[11px] text-amber-400">
                    <Zap className="w-3.5 h-3.5" />
                    <span>{isFa ? 'نکته کلیدی و مروارید بالینی (Pearl):' : 'Key Pearl:'}</span>
                  </div>
                  <div dir={isFa ? 'rtl' : 'ltr'}>{isFa ? pFa || pEn : pEn || pFa}</div>
                </div>
              )}

              {/* LEITNER SM-2 RATING CONTROLS IN OUTLINER (MODULE 5) */}
              {showLeitnerGrading && onRateCard && (
                <div className="pt-2.5 border-t border-purple-500/30 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                    <span className="flex items-center gap-1.5 text-purple-300">
                      <Layers className="w-3.5 h-3.5" />
                      <span>{isFa ? 'ارزیابی و ثبت مستقیم در جعبه لایتنر:' : 'Leitner Spaced Review Rating:'}</span>
                    </span>
                    {ratedCardMap[card.id] && (
                      <span className="text-emerald-400 text-[10px] font-bold flex items-center gap-1 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-500/40 animate-in fade-in">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{isFa ? `ثبت شد: ${ratedCardMap[card.id].rating}` : `Rated: ${ratedCardMap[card.id].rating}`}</span>
                      </span>
                    )}
                  </div>

                  {/* 4 Leitner / Anki Buttons */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRateCard(card.id, 'again');
                        setRatedCardMap((prev) => ({
                          ...prev,
                          [card.id]: { rating: isFa ? 'تکرار / جعبه ۱' : 'Again / Box 1', timestamp: Date.now() },
                        }));
                      }}
                      className="p-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-200 text-center transition flex flex-col items-center justify-center gap-0.5 cursor-pointer shadow-sm active:scale-95"
                    >
                      <span className="text-xs font-bold">{isFa ? 'تکرار (نادرست)' : 'Again'}</span>
                      <span className="text-[9px] text-rose-300/80 font-mono">{isFa ? 'جعبه ۱ (فردا)' : 'Box 1 (1d)'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRateCard(card.id, 'hard');
                        setRatedCardMap((prev) => ({
                          ...prev,
                          [card.id]: { rating: isFa ? 'سخت' : 'Hard', timestamp: Date.now() },
                        }));
                      }}
                      className="p-2 rounded-xl bg-amber-950/60 hover:bg-amber-900 border border-amber-500/40 text-amber-200 text-center transition flex flex-col items-center justify-center gap-0.5 cursor-pointer shadow-sm active:scale-95"
                    >
                      <span className="text-xs font-bold">{isFa ? 'سخت (با تردید)' : 'Hard'}</span>
                      <span className="text-[9px] text-amber-300/80 font-mono">{isFa ? `جعبه ${card.box} (+۲ روز)` : `Box ${card.box} (+2d)`}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRateCard(card.id, 'good');
                        setRatedCardMap((prev) => ({
                          ...prev,
                          [card.id]: { rating: isFa ? 'خوب' : 'Good', timestamp: Date.now() },
                        }));
                      }}
                      className="p-2 rounded-xl bg-blue-950/60 hover:bg-blue-900 border border-blue-500/40 text-blue-200 text-center transition flex flex-col items-center justify-center gap-0.5 cursor-pointer shadow-sm active:scale-95"
                    >
                      <span className="text-xs font-bold">{isFa ? 'خوب (درست)' : 'Good'}</span>
                      <span className="text-[9px] text-blue-300/80 font-mono">{isFa ? `جعبه ${Math.min(5, card.box + 1)} (+۶ روز)` : `Box ${Math.min(5, card.box + 1)} (+6d)`}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRateCard(card.id, 'easy');
                        setRatedCardMap((prev) => ({
                          ...prev,
                          [card.id]: { rating: isFa ? 'آسان' : 'Easy', timestamp: Date.now() },
                        }));
                      }}
                      className="p-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-200 text-center transition flex flex-col items-center justify-center gap-0.5 cursor-pointer shadow-sm active:scale-95"
                    >
                      <span className="text-xs font-bold">{isFa ? 'آسان (مسلط)' : 'Easy'}</span>
                      <span className="text-[9px] text-emerald-300/80 font-mono">{isFa ? `جعبه ${Math.min(5, card.box + 2)} (+۱۴ روز)` : `Box ${Math.min(5, card.box + 2)} (+14d)`}</span>
                    </button>
                  </div>

                  {/* Direct Box Jump */}
                  {onUpdateCardBox && (
                    <div className="flex items-center justify-between gap-2 pt-1.5 text-[10px] text-slate-400">
                      <span>{isFa ? 'انتقال سریع به جعبه:' : 'Direct Box Jump:'}</span>
                      <div className="flex items-center gap-1">
                        {([1, 2, 3, 4, 5] as const).map((b) => (
                          <button
                            key={b}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateCardBox(card.id, b);
                              setRatedCardMap((prev) => ({
                                ...prev,
                                [card.id]: { rating: isFa ? `جعبه ${b}` : `Box ${b}`, timestamp: Date.now() },
                              }));
                            }}
                            className={`w-6 h-5 rounded flex items-center justify-center font-mono font-bold transition cursor-pointer ${
                              card.box === b
                                ? 'bg-purple-600 text-white shadow ring-1 ring-white/30'
                                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
                            }`}
                          >
                            {b}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* KNOWLEDGE MAP / CONCEPT VIEW CONTROLS (MODULE 6) */}
              {!showLeitnerGrading && (
                <div className="pt-2 border-t border-purple-500/20 flex flex-wrap items-center justify-between gap-2 text-xs">
                  {/* Flag Selector */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1">
                      <Flag className="w-3 h-3 text-purple-400" />
                      <span>{isFa ? 'نشانه‌گذاری پرچم:' : 'Flag:'}</span>
                    </span>
                    {(Object.keys(FLAG_OPTIONS) as FlagColor[]).map((fKey) => {
                      const opt = FLAG_OPTIONS[fKey];
                      const isSelected = cardFlags[card.id] === fKey;
                      return (
                        <button
                          key={fKey}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetCardFlag(card.id, isSelected ? null : fKey);
                          }}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition flex items-center gap-1 cursor-pointer ${
                            isSelected ? `${opt.badge} ring-1 ring-white/30 shadow-sm` : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-800'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${opt.dot}`} />
                          <span>{isFa ? opt.name.fa.split(' ')[0] : opt.name.en.split(' ')[0]}</span>
                        </button>
                      );
                    })}
                  </div>

                  {onStartStudyBranch && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onStartStudyBranch({
                          title: isFa ? qFa || qEn : qEn || qFa,
                          cardIds: [card.id],
                        });
                      }}
                      className="px-2.5 py-1 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Play className="w-3 h-3 text-purple-400" />
                      <span>{isFa ? 'تمرین با لایتنر (ماژول ۵)' : 'Drill in Leitner Deck'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    // Branch Node
    return (
      <div key={node.id} className="w-full mb-1.5">
        <div
          onClick={() => toggleNode(node.id)}
          onContextMenu={(e) => handleOpenContextMenu(e, node)}
          className={`flex items-center justify-between gap-2 p-2.5 rounded-xl border transition cursor-pointer select-none ${
            node.level === 0
              ? 'bg-slate-900 border-purple-500/60 text-slate-100 font-extrabold text-sm sm:text-base'
              : node.level === 1
              ? 'bg-slate-900/90 border-slate-800 hover:border-purple-500/40 text-purple-200 font-bold text-xs sm:text-sm'
              : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 text-slate-200 font-semibold text-xs'
          }`}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {hasChildren && (
              <span className="text-slate-400">
                {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : isFa ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </span>
            )}
            <span className="break-words whitespace-normal">{displayTitle}</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {node.cardCount > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono font-bold">
                {node.cardCount}
              </span>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleStartStudyRunner(node);
              }}
              className="p-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition shadow"
              title={isFa ? 'مرور ترتیبی این شاخه' : 'Study branch'}
            >
              <Play className="w-3 h-3" />
            </button>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className={`mt-1 space-y-1 ps-3 sm:ps-5 border-s-2 ${theme.border}`}>
            {node.children.map((child) => renderOutlinerNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Dropdown states for compact header controls
  const [openDropdown, setOpenDropdown] = useState<'view' | 'text' | 'lines' | 'flags' | 'module' | 'box' | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-mindmap-dropdown]')) {
        setOpenDropdown(null);
      }
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`space-y-3 transition-all duration-300 ${
        isZenMode
          ? 'fixed inset-0 z-50 app-bg p-3 sm:p-4 overflow-y-auto flex flex-col'
          : ''
      }`}
    >
      {/* Ultra-Minimal Top Bar: [ 🔍 Search | ✨ AI | ⚙️ Settings ] */}
      <div className="flex items-center justify-between gap-2 p-1.5 sm:p-2 rounded-2xl app-card border app-border shadow-xs bg-slate-900/70 backdrop-blur-md">
        {/* Expandable Search Trigger */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {isSearchExpanded || searchQuery ? (
            <div className="relative flex-1 max-w-xs animate-in fade-in duration-150">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute start-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isFa ? 'جستجو در مفاهیم...' : 'Search...'}
                className="w-full ps-8 pe-7 py-1 rounded-xl app-bg border app-border text-xs app-text placeholder-slate-400 focus:outline-none focus:border-purple-500 transition"
              />
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchExpanded(false);
                }}
                className="absolute end-2 top-1/2 -translate-y-1/2 text-slate-400 hover:app-text cursor-pointer p-0.5"
                title={isFa ? 'بستن جستجو' : 'Close search'}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsSearchExpanded(true)}
              className="p-1.5 rounded-xl app-bg hover:bg-black/5 dark:hover:bg-slate-800 app-text border app-border transition cursor-pointer flex items-center gap-1 text-xs"
              title={isFa ? 'جستجو در نقشه ذهنی' : 'Search Mind Map'}
            >
              <Search className="w-3.5 h-3.5 text-slate-300" />
            </button>
          )}

          {/* Active Filter Indicators (if set via Settings) */}
          {(filterModule !== 'ALL' || filterBox !== 'ALL' || selectedFlagFilters.length > 0) && (
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title={isFa ? 'فیلتر فعال است' : 'Filter active'} />
              <button
                type="button"
                onClick={() => {
                  setFilterModule('ALL');
                  setFilterBox('ALL');
                  setSelectedFlagFilters([]);
                }}
                className="text-[10px] text-slate-400 hover:text-rose-300 underline cursor-pointer"
              >
                {isFa ? 'حذف فیلتر' : 'Clear'}
              </button>
            </div>
          )}
        </div>

        {/* Right Section: [ ✨ AI Button | ⚙️ Settings Gear ] */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* ✨ AI Generator Button */}
          {onOpenAiGenerator && (
            <button
              type="button"
              onClick={() => onOpenAiGenerator()}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition cursor-pointer"
              title={isFa ? 'تولید کارت جدید با هوش مصنوعی' : 'Generate with AI'}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">AI</span>
            </button>
          )}

          {/* ⚙️ Mind Map Settings Gear Button */}
          <button
            type="button"
            onClick={() => setIsMindMapSettingsOpen(true)}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl app-bg hover:bg-black/5 dark:hover:bg-slate-800 app-text border app-border text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
            title={isFa ? 'تنظیمات چیدمان، ساختار و فیلترهای نقشه ذهنی' : 'Mind Map Settings'}
          >
            <Settings className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
            <span className="hidden sm:inline">{isFa ? 'تنظیمات' : 'Settings'}</span>
          </button>
        </div>
      </div>

      {/* Main Mind Map Body */}
      {['interactive_canvas', 'radial_circle', 'vertical_tree'].includes(viewMode) ? (
        <MindMapCanvas
          language={language}
          layoutItems={layoutResult.items}
          layoutLinks={layoutResult.links}
          bounds={layoutResult.bounds}
          expandedNodeIds={expandedNodeIds}
          onToggleNode={toggleNode}
          onOpenContextMenu={handleOpenContextMenu}
          onSelectQuestionCard={(card) => setSelectedQuestionCard(card)}
          onStartStudyBranch={handleStartStudyRunner}
          getNodeDisplayTitle={getNodeDisplayTitle}
          cardFlags={cardFlags}
          cardLangMode={cardLangMode}
          onSetCardLangMode={setCardLangMode}
          textDisplayMode={textDisplayMode}
          onSetTextDisplayMode={(mode) => setTextDisplayMode(mode)}
          lineStyle={lineStyle}
          onSetLineStyle={setLineStyle}
          onExpandAll={expandAll}
          onCollapseAll={collapseAll}
          viewMode={viewMode}
          onSetViewMode={(mode) => setViewMode(mode)}
          isDarkTheme={true}
          onOpenSettings={() => setIsMindMapSettingsOpen(true)}
        >
          {/* Context Menu Popup */}
          {contextMenu.isOpen && contextMenu.node && (
            <div
              style={{ position: 'fixed', left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }}
              className="z-[80] w-64 p-2 rounded-2xl app-card border app-border shadow-2xl space-y-1 animate-in fade-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-3 py-1.5 text-[11px] font-bold app-muted border-b app-border flex items-center justify-between">
                <span className="truncate">{getNodeDisplayTitle(contextMenu.node)}</span>
                <span className="text-[9px] font-mono">L{contextMenu.node.level}</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  handleStartStudyRunner(contextMenu.node!);
                  setContextMenu((prev) => ({ ...prev, isOpen: false }));
                }}
                className="w-full px-3 py-2 rounded-xl hover:bg-purple-600 text-slate-200 hover:text-white text-xs font-bold flex items-center gap-2 transition"
              >
                <Play className="w-3.5 h-3.5 text-purple-400 group-hover:text-white" />
                <span>{isFa ? 'مرور ترتیبی سوالات این شاخه' : 'Step-by-Step Study'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRenameModal({
                    isOpen: true,
                    node: contextMenu.node,
                    currentText: getNodeDisplayTitle(contextMenu.node!),
                  });
                  setContextMenu((prev) => ({ ...prev, isOpen: false }));
                }}
                className="w-full px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200 text-xs font-medium flex items-center gap-2 transition"
              >
                <Pencil className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isFa ? 'تغییر نام شاخه (Alias)' : 'Rename Branch Alias'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setColorPickerModal({
                    isOpen: true,
                    node: contextMenu.node,
                  });
                  setContextMenu((prev) => ({ ...prev, isOpen: false }));
                }}
                className="w-full px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200 text-xs font-medium flex items-center gap-2 transition"
              >
                <Palette className="w-3.5 h-3.5 text-amber-400" />
                <span>{isFa ? 'انتخاب رنگ شاخه' : 'Change Color Palette'}</span>
              </button>

              {onOpenAiGenerator && (
                <button
                  type="button"
                  onClick={() => {
                    if (contextMenu.node) {
                      onOpenAiGenerator(
                        `موضوع: ${getNodeDisplayTitle(contextMenu.node)}\nمسیر: ${[
                          contextMenu.node.domainName,
                          contextMenu.node.systemName,
                          contextMenu.node.subsystemName,
                          contextMenu.node.subClassName,
                          contextMenu.node.microTopicName,
                        ].filter(Boolean).join(' > ')}`
                      );
                    }
                    setContextMenu((prev) => ({ ...prev, isOpen: false }));
                  }}
                  className="w-full px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200 text-xs font-medium flex items-center gap-2 transition border-t border-slate-800/80 mt-1"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>{isFa ? 'تولید سوالات با هوش مصنوعی' : 'Generate AI Cards for Branch'}</span>
                </button>
              )}
            </div>
          )}

          {/* Question Detail Modal */}
          {selectedQuestionCard && (
            <QuestionDetailModal
              isOpen={!!selectedQuestionCard}
              onClose={() => setSelectedQuestionCard(null)}
              card={selectedQuestionCard}
              language={language}
              cardLangMode={cardLangMode}
              cardFlags={cardFlags}
              onSetCardFlag={handleSetCardFlag}
              onRateCard={onRateCard}
              showLeitnerGrading={showLeitnerGrading}
            />
          )}

          {/* Sequential Study Runner Modal */}
          {branchRunnerState.isOpen && branchRunnerState.node && (
            <BranchStudyRunnerModal
              isOpen={branchRunnerState.isOpen}
              onClose={() => setBranchRunnerState({ isOpen: false, node: null, cards: [] })}
              node={branchRunnerState.node}
              cards={branchRunnerState.cards}
              language={language}
              cardLangMode={cardLangMode}
              cardFlags={cardFlags}
              onSetCardFlag={handleSetCardFlag}
              onRateCard={onRateCard}
              onUpdateCardBox={onUpdateCardBox}
            />
          )}

          {/* Rename Modal */}
          <RenameNodeModal
            isOpen={renameModal.isOpen}
            onClose={() => setRenameModal({ isOpen: false, node: null, currentText: '' })}
            node={renameModal.node}
            currentText={renameModal.currentText}
            onSave={handleSaveAlias}
            onReset={handleResetAlias}
            language={language}
          />

          {/* Color Picker Modal */}
          <ColorPickerModal
            isOpen={colorPickerModal.isOpen}
            onClose={() => setColorPickerModal({ isOpen: false, node: null })}
            node={colorPickerModal.node}
            onSaveColor={handleSaveColor}
            language={language}
          />

          {/* ⚙️ MIND MAP SETTINGS MODAL (Inside Canvas for Fullscreen Support) */}
          <MindMapSettingsModal
            isOpen={isMindMapSettingsOpen}
            onClose={() => setIsMindMapSettingsOpen(false)}
            language={language}
            viewMode={viewMode}
            onChangeViewMode={(mode) => setViewMode(mode)}
            lineStyle={lineStyle}
            onChangeLineStyle={(style) => setLineStyle(style)}
            textDisplayMode={textDisplayMode}
            onChangeTextDisplayMode={(mode) => setTextDisplayMode(mode)}
            filterModule={filterModule}
            onChangeFilterModule={(mod) => setFilterModule(mod)}
            filterBox={filterBox}
            onChangeFilterBox={(box) => setFilterBox(box)}
            selectedFlagFilters={selectedFlagFilters as any}
            onToggleFlagFilter={(flag) => toggleFlagFilter(flag)}
            onResetFlagFilters={() => setSelectedFlagFilters([])}
            onExpandAll={expandAll}
            onCollapseAll={collapseAll}
            onExportJson={handleExportJson}
            totalNodesCount={cards.length}
          />
        </MindMapCanvas>
      ) : viewMode === 'matrix_grid' ? (
        /* Matrix Grid View Mode */
        <div className="p-3 sm:p-5 rounded-3xl app-card border app-border shadow-inner space-y-4 animate-fadeIn">
          {/* Matrix Top Header Bar */}
          <div className="flex items-center justify-between flex-wrap gap-2.5 pb-3 border-b app-border">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="text-xs sm:text-sm font-black app-text">
                {isFa ? 'ماتریس شبکه‌ای مفاهیم و سیستم‌های بالینی' : 'Therapeutics & Knowledge Matrix'}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {filteredCards.length} {isFa ? 'کارت' : 'cards'}
              </span>
            </div>

            {/* Matrix Header Action Controls */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* View Mode Switcher Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsMindMapSettingsOpen(true)}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-purple-600/20 text-purple-300 border border-purple-500/40 hover:bg-purple-600 hover:text-white transition flex items-center gap-1 cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>{isFa ? 'تنظیمات و چیدمان' : 'Settings'}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={expandAll}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-purple-600 text-white shadow-sm hover:bg-purple-500 transition cursor-pointer"
              >
                {isFa ? '➕ باز کردن همه' : '➕ Expand All'}
              </button>

              <button
                type="button"
                onClick={collapseAll}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold app-bg app-border app-text hover:border-slate-400 transition cursor-pointer"
              >
                {isFa ? '➖ بستن همه' : '➖ Collapse All'}
              </button>
            </div>
          </div>

          {/* Matrix Grid Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {mindMapTree.children.map((domainChild) => {
              const theme = MINDMAP_THEMES[domainChild.colorTheme] || MINDMAP_THEMES.purple;
              const isDomainExpanded = expandedNodeIds[domainChild.id] !== false;

              return (
                <div
                  key={domainChild.id}
                  className={`rounded-2xl border ${theme.border} ${theme.bg} p-4 space-y-3 shadow-sm transition hover:shadow-md`}
                >
                  <div
                    onClick={() => toggleNode(domainChild.id)}
                    className="flex items-center justify-between pb-2 border-b app-border cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${theme.dot}`} />
                      <h4 className={`text-xs sm:text-sm font-black ${theme.text}`}>
                        {getNodeDisplayTitle(domainChild)}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold app-muted px-2 py-0.5 rounded-md bg-black/20">
                        {domainChild.cardCount} {isFa ? 'مفهوم' : 'cards'}
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          isDomainExpanded ? 'rotate-180 text-purple-400' : 'text-slate-400'
                        }`}
                      />
                    </div>
                  </div>

                  {isDomainExpanded && (
                    <div className="space-y-2 animate-fadeIn">
                      {domainChild.children.map((sysChild) => {
                        const isSysExpanded = expandedNodeIds[sysChild.id] !== false;
                        const subCards = collectCardsUnderNode(sysChild);

                        return (
                          <div
                            key={sysChild.id}
                            className="rounded-xl app-card border app-border p-2.5 space-y-2"
                          >
                            <div
                              onClick={() => toggleNode(sysChild.id)}
                              className="flex items-center justify-between text-xs font-bold app-text cursor-pointer select-none"
                            >
                              <span>{getNodeDisplayTitle(sysChild)}</span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-mono text-purple-400">
                                  {sysChild.cardCount}
                                </span>
                                <ChevronDown
                                  className={`w-3 h-3 transition-transform ${
                                    isSysExpanded ? 'rotate-180 text-purple-400' : 'text-slate-500'
                                  }`}
                                />
                              </div>
                            </div>

                            {isSysExpanded && (
                              <div className="flex flex-wrap gap-1.5 pt-1 animate-fadeIn">
                                {subCards.slice(0, 10).map((c) => {
                                  const qFa = typeof c.question === 'object' ? c.question.fa || c.question.en : c.question;
                                  const qEn = typeof c.question === 'object' ? c.question.en || c.question.fa : c.question;
                                  const qText = cardLangMode === 'en' ? (qEn || qFa) : (qFa || qEn);
                                  const flag = cardFlags[c.id];

                                  return (
                                    <button
                                      key={c.id}
                                      type="button"
                                      onClick={() => setSelectedQuestionCard(c)}
                                      className="px-2 py-1 rounded-lg text-[11px] font-medium app-bg border app-border hover:border-purple-500 app-text text-start max-w-full truncate transition cursor-pointer flex items-center gap-1.5"
                                      title={qText}
                                    >
                                      {flag && <span className={`w-2 h-2 rounded-full shrink-0 ${FLAG_OPTIONS[flag]?.dot || 'bg-slate-400'}`} />}
                                      <span className="truncate">{qText}</span>
                                    </button>
                                  );
                                })}
                                {subCards.length > 10 && (
                                  <button
                                    type="button"
                                    onClick={() => handleStartStudyRunner(sysChild)}
                                    className="px-2 py-1 rounded-lg text-[10px] font-bold bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600 hover:text-white transition cursor-pointer"
                                  >
                                    +{subCards.length - 10} {isFa ? 'بیشتر...' : 'more...'}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Outliner Tree View Mode */
        <div className="p-4 rounded-3xl app-card border app-border shadow-inner space-y-2 animate-fadeIn">
          {/* Outliner Top Header Bar */}
          <div className="flex items-center justify-between flex-wrap gap-2.5 pb-3 border-b app-border">
            <div className="flex items-center gap-2">
              <ListTree className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs sm:text-sm font-black app-text">
                {isFa ? 'ساختار فهرستی اوت‌لاینر' : 'Collapsible Outliner View'}
              </h3>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setIsMindMapSettingsOpen(true)}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-purple-600/20 text-purple-300 border border-purple-500/40 hover:bg-purple-600 hover:text-white transition flex items-center gap-1 cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>{isFa ? 'تنظیمات و چیدمان' : 'Settings'}</span>
              </button>

              <button
                type="button"
                onClick={expandAll}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-purple-600 text-white shadow-sm hover:bg-purple-500 transition cursor-pointer"
              >
                {isFa ? '➕ باز کردن همه' : '➕ Expand All'}
              </button>

              <button
                type="button"
                onClick={collapseAll}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold app-bg app-border app-text hover:border-slate-400 transition cursor-pointer"
              >
                {isFa ? '➖ بستن همه' : '➖ Collapse All'}
              </button>
            </div>
          </div>

          {mindMapTree.children.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-3">
              <FolderTree className="w-10 h-10 mx-auto text-slate-600" />
              <p className="text-xs">
                {onlyDueToday
                  ? isFa
                    ? '🎉 هیچ کارتی برای مرور امروز در این شاخه‌ها باقی نمانده است!'
                    : '🎉 No cards due for review today in these branches!'
                  : isFa
                  ? 'موردی یافت نشد.'
                  : 'No flashcards found.'}
              </p>
              {onlyDueToday ? (
                <button
                  type="button"
                  onClick={() => setOnlyDueToday(false)}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold cursor-pointer"
                >
                  {isFa ? 'مشاهده تمام شاخه‌های نقشه' : 'Show All Mind Map Branches'}
                </button>
              ) : onAddSampleCards ? (
                <button
                  type="button"
                  onClick={onAddSampleCards}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow"
                >
                  {isFa ? 'بارگذاری کارت‌های نمونه' : 'Load Samples'}
                </button>
              ) : null}
            </div>
          ) : (
            mindMapTree.children.map((domNode) => renderOutlinerNode(domNode, 0))
          )}

          {/* Context Menu Popup in Outliner */}
          {contextMenu.isOpen && contextMenu.node && (
            <div
              style={{ position: 'fixed', left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }}
              className="z-[80] w-64 p-2 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl space-y-1 animate-in fade-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 border-b border-slate-800 flex items-center justify-between">
                <span className="truncate">{getNodeDisplayTitle(contextMenu.node)}</span>
                <span className="text-[9px] font-mono">L{contextMenu.node.level}</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  handleStartStudyRunner(contextMenu.node!);
                  setContextMenu((prev) => ({ ...prev, isOpen: false }));
                }}
                className="w-full px-3 py-2 rounded-xl hover:bg-purple-600 text-slate-200 hover:text-white text-xs font-bold flex items-center gap-2 transition"
              >
                <Play className="w-3.5 h-3.5 text-purple-400 group-hover:text-white" />
                <span>{isFa ? 'مرور ترتیبی سوالات این شاخه' : 'Step-by-Step Study'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRenameModal({
                    isOpen: true,
                    node: contextMenu.node,
                    currentText: getNodeDisplayTitle(contextMenu.node!),
                  });
                  setContextMenu((prev) => ({ ...prev, isOpen: false }));
                }}
                className="w-full px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200 text-xs font-medium flex items-center gap-2 transition"
              >
                <Pencil className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isFa ? 'تغییر نام شاخه (Alias)' : 'Rename Branch Alias'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setColorPickerModal({
                    isOpen: true,
                    node: contextMenu.node,
                  });
                  setContextMenu((prev) => ({ ...prev, isOpen: false }));
                }}
                className="w-full px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200 text-xs font-medium flex items-center gap-2 transition"
              >
                <Palette className="w-3.5 h-3.5 text-amber-400" />
                <span>{isFa ? 'انتخاب رنگ شاخه' : 'Change Color Palette'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SHARED MODALS (MOUNTED & AVAILABLE ACROSS ALL 5 VIEW MODES)               */}
      {/* ========================================================================= */}
      {selectedQuestionCard && (
        <QuestionDetailModal
          isOpen={!!selectedQuestionCard}
          onClose={() => setSelectedQuestionCard(null)}
          card={selectedQuestionCard}
          language={language}
          cardLangMode={cardLangMode}
          cardFlags={cardFlags}
          onSetCardFlag={handleSetCardFlag}
          onRateCard={onRateCard}
          showLeitnerGrading={showLeitnerGrading}
        />
      )}

      {branchRunnerState.isOpen && branchRunnerState.node && (
        <BranchStudyRunnerModal
          isOpen={branchRunnerState.isOpen}
          onClose={() => setBranchRunnerState({ isOpen: false, node: null, cards: [] })}
          node={branchRunnerState.node}
          cards={branchRunnerState.cards}
          language={language}
          cardLangMode={cardLangMode}
          cardFlags={cardFlags}
          onSetCardFlag={handleSetCardFlag}
          onRateCard={onRateCard}
          onUpdateCardBox={onUpdateCardBox}
        />
      )}

      {renameModal.isOpen && (
        <RenameNodeModal
          isOpen={renameModal.isOpen}
          onClose={() => setRenameModal({ isOpen: false, node: null, currentText: '' })}
          node={renameModal.node}
          currentText={renameModal.currentText}
          onSave={handleSaveAlias}
          onReset={handleResetAlias}
          language={language}
        />
      )}

      {colorPickerModal.isOpen && (
        <ColorPickerModal
          isOpen={colorPickerModal.isOpen}
          onClose={() => setColorPickerModal({ isOpen: false, node: null })}
          node={colorPickerModal.node}
          onSaveColor={handleSaveColor}
          language={language}
        />
      )}

      <MindMapSettingsModal
        isOpen={isMindMapSettingsOpen}
        onClose={() => setIsMindMapSettingsOpen(false)}
        language={language}
        viewMode={viewMode}
        onChangeViewMode={(mode) => setViewMode(mode)}
        lineStyle={lineStyle}
        onChangeLineStyle={(style) => setLineStyle(style)}
        textDisplayMode={textDisplayMode}
        onChangeTextDisplayMode={(mode) => setTextDisplayMode(mode)}
        filterModule={filterModule}
        onChangeFilterModule={(mod) => setFilterModule(mod)}
        filterBox={filterBox}
        onChangeFilterBox={(box) => setFilterBox(box)}
        selectedFlagFilters={selectedFlagFilters as any}
        onToggleFlagFilter={(flag) => toggleFlagFilter(flag)}
        onResetFlagFilters={() => setSelectedFlagFilters([])}
        onExpandAll={expandAll}
        onCollapseAll={collapseAll}
        onExportJson={handleExportJson}
        totalNodesCount={cards.length}
      />
    </div>
  );
};
