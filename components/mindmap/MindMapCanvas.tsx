'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  MindMapNode,
  MindMapLayoutItem,
  MindMapLink,
  MindMapTextDisplay,
  MindMapLineStyle,
} from '@/types/mindmap';
import { MINDMAP_THEMES, generateLinkPathData } from '@/lib/mindmapLayout';
import { LeitnerCard } from '@/types/leitner';
import { Language } from '@/types/pharmacy';
import { FLAG_OPTIONS, FlagColor } from '@/components/LeitnerMindMapPanel';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Move,
  ChevronRight,
  ChevronDown,
  HelpCircle,
  Flag,
  Sparkles,
  BookOpen,
  Folder,
  Stethoscope,
  Pill,
  Zap,
  RotateCcw,
  Eye,
  Sliders,
  CheckCircle2,
  ExternalLink,
  Settings,
} from 'lucide-react';

export interface MindMapCanvasProps {
  language: Language;
  layoutItems: MindMapLayoutItem[];
  layoutLinks: MindMapLink[];
  bounds: { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number };
  expandedNodeIds: Record<string, boolean>;
  onToggleNode: (nodeId: string) => void;
  onOpenContextMenu: (e: React.MouseEvent | React.TouchEvent, node: MindMapNode) => void;
  onSelectQuestionCard: (card: LeitnerCard) => void;
  onStartStudyBranch: (node: MindMapNode) => void;
  getNodeDisplayTitle: (node: MindMapNode) => string;
  cardFlags: Record<string, FlagColor>;
  cardLangMode: 'fa' | 'en' | 'bilingual';
  textDisplayMode: MindMapTextDisplay;
  lineStyle: MindMapLineStyle;
  isDarkTheme?: boolean;
  onOpenSettings?: () => void;
  children?: React.ReactNode;
}

export const MindMapCanvas: React.FC<MindMapCanvasProps> = ({
  language,
  layoutItems,
  layoutLinks,
  bounds,
  expandedNodeIds,
  onToggleNode,
  onOpenContextMenu,
  onSelectQuestionCard,
  onStartStudyBranch,
  getNodeDisplayTitle,
  cardFlags,
  cardLangMode,
  textDisplayMode,
  lineStyle,
  isDarkTheme = true,
  onOpenSettings,
  children,
}) => {
  const isFa = language === 'fa';
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(0.9);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const dragStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasInitializedViewRef = useRef(false);

  // Advanced Mobile Touch & Multi-touch Gesture Ref
  const touchGestureRef = useRef<{
    mode: 'none' | 'pan' | 'pinch';
    startX: number;
    startY: number;
    startPanX: number;
    startPanY: number;
    startDist: number;
    startZoom: number;
    startMidX: number;
    startMidY: number;
  }>({
    mode: 'none',
    startX: 0,
    startY: 0,
    startPanX: 0,
    startPanY: 0,
    startDist: 0,
    startZoom: 1,
    startMidX: 0,
    startMidY: 0,
  });

  // Center canvas on first load ONLY (never reset position on node expand/collapse)
  useEffect(() => {
    if (!hasInitializedViewRef.current && bounds.width > 0 && containerRef.current) {
      const containerWidth = containerRef.current.clientWidth || 900;
      const initialScale = Math.min(1, Math.max(0.65, containerWidth / Math.max(bounds.width, 1000)));
      setZoomLevel(initialScale);
      setPanOffset({ x: 40, y: 40 });
      hasInitializedViewRef.current = true;
    }
  }, [bounds.width]);

  // Handle Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement && !isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen().then(() => {
          setIsFullscreen(true);
        }).catch(() => {
          setIsFullscreen(true);
        });
      } else {
        setIsFullscreen(true);
      }
    } else {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullscreen(false);
        }).catch(() => {
          setIsFullscreen(false);
        });
      } else {
        setIsFullscreen(false);
      }
    }
  };

  // Sync fullscreen state with browser events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Zoom handlers
  const handleZoomIn = () => setZoomLevel((z) => Math.min(2.5, +(z + 0.15).toFixed(2)));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(0.35, +(z - 0.15).toFixed(2)));
  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 40, y: 40 });
  };
  const handleFitView = () => {
    if (!containerRef.current) return;
    const cw = containerRef.current.clientWidth || 900;
    const ch = containerRef.current.clientHeight || 650;
    const scaleX = (cw - 80) / Math.max(bounds.width, 200);
    const scaleY = (ch - 80) / Math.max(bounds.height, 200);
    const optimalScale = Math.min(1.2, Math.max(0.4, Math.min(scaleX, scaleY)));
    setZoomLevel(+optimalScale.toFixed(2));
    setPanOffset({ x: 40, y: 40 });
  };

  // Mouse wheel zoom & pan
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      setZoomLevel((z) => Math.min(2.5, Math.max(0.35, +(z * zoomFactor).toFixed(2))));
    } else {
      setPanOffset((prev) => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }));
    }
  };

  // Mouse Pan Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('.mindmap-interactive-node') || target.closest('button')) {
      return;
    }
    setIsDragging(true);
    dragStartPosRef.current = {
      x: e.clientX - panOffset.x,
      y: e.clientY - panOffset.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStartPosRef.current.x,
      y: e.clientY - dragStartPosRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // -------------------------------------------------------------------------
  // HIGH-PERFORMANCE MOBILE TOUCH & PINCH GESTURE HANDLERS
  // -------------------------------------------------------------------------
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const target = e.target as HTMLElement;
      // If tapping directly on buttons, let button click handler respond
      if (target.closest('button')) {
        return;
      }
      setIsDragging(true);
      const t = e.touches[0];
      touchGestureRef.current = {
        mode: 'pan',
        startX: t.clientX,
        startY: t.clientY,
        startPanX: panOffset.x,
        startPanY: panOffset.y,
        startDist: 0,
        startZoom: zoomLevel,
        startMidX: t.clientX,
        startMidY: t.clientY,
      };
    } else if (e.touches.length >= 2) {
      setIsDragging(true);
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;

      touchGestureRef.current = {
        mode: 'pinch',
        startX: midX,
        startY: midY,
        startPanX: panOffset.x,
        startPanY: panOffset.y,
        startDist: Math.max(dist, 1),
        startZoom: zoomLevel,
        startMidX: midX,
        startMidY: midY,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;

    if (e.touches.length === 1 && touchGestureRef.current.mode === 'pan') {
      const t = e.touches[0];
      const dx = t.clientX - touchGestureRef.current.startX;
      const dy = t.clientY - touchGestureRef.current.startY;
      setPanOffset({
        x: touchGestureRef.current.startPanX + dx,
        y: touchGestureRef.current.startPanY + dy,
      });
    } else if (e.touches.length >= 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const currentMidX = (t1.clientX + t2.clientX) / 2;
      const currentMidY = (t1.clientY + t2.clientY) / 2;

      if (touchGestureRef.current.mode !== 'pinch' || touchGestureRef.current.startDist <= 0) {
        touchGestureRef.current = {
          mode: 'pinch',
          startX: currentMidX,
          startY: currentMidY,
          startPanX: panOffset.x,
          startPanY: panOffset.y,
          startDist: Math.max(currentDist, 1),
          startZoom: zoomLevel,
          startMidX: currentMidX,
          startMidY: currentMidY,
        };
        return;
      }

      const scaleMultiplier = currentDist / touchGestureRef.current.startDist;
      const newZoom = Math.min(
        2.5,
        Math.max(0.35, +(touchGestureRef.current.startZoom * scaleMultiplier).toFixed(3))
      );

      // Smooth zoom centered around the pinch focal point
      const stageRect = containerRef.current?.getBoundingClientRect();
      const originX = stageRect ? currentMidX - stageRect.left : currentMidX;
      const originY = stageRect ? currentMidY - stageRect.top : currentMidY;

      const startOriginX = stageRect
        ? touchGestureRef.current.startMidX - stageRect.left
        : touchGestureRef.current.startMidX;
      const startOriginY = stageRect
        ? touchGestureRef.current.startMidY - stageRect.top
        : touchGestureRef.current.startMidY;

      const contentX =
        (startOriginX - touchGestureRef.current.startPanX) / touchGestureRef.current.startZoom;
      const contentY =
        (startOriginY - touchGestureRef.current.startPanY) / touchGestureRef.current.startZoom;

      const newPanX = originX - contentX * newZoom;
      const newPanY = originY - contentY * newZoom;

      setZoomLevel(newZoom);
      setPanOffset({
        x: Math.round(newPanX),
        y: Math.round(newPanY),
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      setIsDragging(false);
      touchGestureRef.current.mode = 'none';
    } else if (e.touches.length === 1) {
      // Transition from pinch to single-finger pan smoothly
      const t = e.touches[0];
      touchGestureRef.current = {
        mode: 'pan',
        startX: t.clientX,
        startY: t.clientY,
        startPanX: panOffset.x,
        startPanY: panOffset.y,
        startDist: 0,
        startZoom: zoomLevel,
        startMidX: t.clientX,
        startMidY: t.clientY,
      };
    }
  };

  // Prevent browser default gesture zoom/pull-to-refresh on canvas container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const preventDefaultTouch = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    el.addEventListener('touchstart', preventDefaultTouch, { passive: false });
    el.addEventListener('touchmove', preventDefaultTouch, { passive: false });

    return () => {
      el.removeEventListener('touchstart', preventDefaultTouch);
      el.removeEventListener('touchmove', preventDefaultTouch);
    };
  }, []);

  // Helper for Level Icon
  const getNodeLevelIcon = (level: number) => {
    switch (level) {
      case 0:
        return <BookOpen className="w-4 h-4 text-purple-400 shrink-0" />;
      case 1:
        return <Folder className="w-4 h-4 text-purple-400 shrink-0" />;
      case 2:
        return <Stethoscope className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
      case 3:
        return <BookOpen className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case 4:
        return <Pill className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      case 5:
        return <Zap className="w-3 h-3 text-rose-400 shrink-0" />;
      default:
        return <HelpCircle className="w-3 h-3 text-indigo-400 shrink-0" />;
    }
  };

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      className={`relative w-full h-[720px] rounded-3xl border border-slate-800/90 overflow-hidden select-none transition-all duration-300 bg-slate-950 text-slate-100 touch-none ${
        isFullscreen ? 'fixed inset-0 z-50 h-screen w-screen rounded-none p-4' : ''
      }`}
      style={{
        backgroundColor: '#020617',
        backgroundImage: isDarkTheme
          ? 'radial-gradient(circle, rgba(148, 163, 184, 0.12) 1.5px, transparent 1.5px)'
          : 'radial-gradient(circle, rgba(100, 116, 139, 0.18) 1.5px, transparent 1.5px)',
        backgroundSize: '28px 28px',
        touchAction: 'none',
      }}
    >
      {/* Floating Canvas Controls Panel */}
      <div className="absolute top-4 start-4 z-20 flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-2xl backdrop-blur-md">
        <button
          type="button"
          onClick={handleZoomIn}
          className="p-2 rounded-xl bg-slate-800/90 hover:bg-purple-600 text-slate-200 hover:text-white transition shadow-sm cursor-pointer"
          title={isFa ? 'بزرگ‌نمایی (+)' : 'Zoom In (+)'}
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleZoomOut}
          className="p-2 rounded-xl bg-slate-800/90 hover:bg-purple-600 text-slate-200 hover:text-white transition shadow-sm cursor-pointer"
          title={isFa ? 'کوچک‌نمایی (-)' : 'Zoom Out (-)'}
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleResetZoom}
          className="px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold transition cursor-pointer"
          title={isFa ? 'بزرگ‌نمایی ۱۰۰٪' : 'Reset to 100%'}
        >
          {Math.round(zoomLevel * 100)}%
        </button>

        <button
          type="button"
          onClick={handleFitView}
          className="p-2 rounded-xl bg-slate-800/90 hover:bg-purple-600 text-slate-200 hover:text-white transition shadow-sm cursor-pointer"
          title={isFa ? 'تراز و چیدمان کامل در صفحه' : 'Fit Entire Mind Map to Screen'}
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={toggleFullscreen}
          className={`p-2 rounded-xl transition shadow-sm cursor-pointer ${
            isFullscreen
              ? 'bg-purple-600 text-white ring-2 ring-purple-400/50'
              : 'bg-slate-800/90 hover:bg-purple-600 text-slate-200 hover:text-white'
          }`}
          title={
            isFullscreen
              ? isFa
                ? 'خروج از تمام‌صفحه (ESC)'
                : 'Exit Fullscreen (ESC)'
              : isFa
              ? 'تمام‌صفحه واقعی نقشه ذهنی'
              : 'True Fullscreen'
          }
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4 text-purple-400" />}
        </button>

        {/* ⚙️ Settings Gear Button in Floating Toolbar */}
        {onOpenSettings && (
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-slate-800/90 hover:bg-purple-600 text-purple-300 hover:text-white transition shadow-sm cursor-pointer border border-purple-500/30"
            title={isFa ? 'تنظیمات چیدمان و خطوط نقشه ذهنی' : 'Mind Map Settings'}
          >
            <Settings className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Canvas Status & Touch Guidance Helper Bar */}
      <div className="absolute bottom-4 start-4 z-20 flex items-center gap-2">
        <div className="text-[11px] text-slate-300 bg-slate-900/95 px-3 py-1.5 rounded-xl border border-slate-700/80 shadow-lg backdrop-blur-md flex items-center gap-2">
          <Move className="w-3.5 h-3.5 text-purple-400" />
          <span>
            {isFa
              ? 'جابجایی با لمس/ماوس • بزرگ‌نمایی با دو انگشت (Pinch) • کلیک برای باز/بستن شاخه'
              : 'Pan with 1-finger / mouse • Pinch with 2 fingers to zoom • Tap node to expand'}
          </span>
        </div>
      </div>

      {/* Interactive Drag & Pan Stage Container */}
      <div
        ref={stageRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        className={`w-full h-full ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        } overflow-hidden touch-none`}
        style={{ touchAction: 'none' }}
      >
        <div
          className="origin-top-left transition-transform duration-75 ease-out"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
          }}
        >
          {/* ========================================================================= */}
          {/* 1. SVG HIGH-CONTRAST CONNECTING PATHS (BETWEEN NODES)                     */}
          {/* ========================================================================= */}
          <svg
            className="absolute top-0 left-0 pointer-events-none"
            style={{
              width: `${Math.max(6000, bounds.width + 1000)}px`,
              height: `${Math.max(6000, bounds.height + 1000)}px`,
              overflow: 'visible',
            }}
          >
            <defs>
              <linearGradient id="purpleGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a855f7" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#c084fc" stopOpacity="0.4" />
              </linearGradient>
            </defs>

            {layoutLinks.map((link) => {
              const pathData = generateLinkPathData(link, lineStyle);
              const isLinkActive = hoveredNodeId === link.sourceId || hoveredNodeId === link.targetId;

              return (
                <g key={link.id} className="transition-all duration-200">
                  {/* Outer Glow Halo Line (High Visibility) */}
                  <path
                    d={pathData}
                    fill="none"
                    stroke={link.color}
                    strokeWidth={isLinkActive ? 6 : link.strokeWidth + 3}
                    strokeOpacity={isLinkActive ? 0.45 : 0.22}
                    strokeLinecap="round"
                  />
                  {/* Inner Solid Sharp Line */}
                  <path
                    d={pathData}
                    fill="none"
                    stroke={link.color}
                    strokeWidth={isLinkActive ? 3 : link.strokeWidth}
                    strokeOpacity={isLinkActive ? 1 : 0.85}
                    strokeLinecap="round"
                  />
                  {/* Subtle Junction Dots */}
                  <circle
                    cx={link.startX}
                    cy={link.startY}
                    r={isLinkActive ? 4 : 3}
                    fill={link.color}
                  />
                  <circle
                    cx={link.endX}
                    cy={link.endY}
                    r={isLinkActive ? 4 : 3}
                    fill={link.color}
                  />
                </g>
              );
            })}
          </svg>

          {/* ========================================================================= */}
          {/* 2. INTERACTIVE NODE CARDS (ALL 6 LEVELS - NO TRUNCATION)                  */}
          {/* ========================================================================= */}
          {layoutItems.map((item) => {
            const node = item.node;
            const isExpanded = !!expandedNodeIds[node.id];
            const hasChildren = node.children.length > 0;
            const theme = MINDMAP_THEMES[item.colorTheme] || MINDMAP_THEMES.purple;
            const displayTitle = getNodeDisplayTitle(node);
            const isLeafQuestion = node.level === 6 && !!node.card;

            // -----------------------------------------------------------------
            // A. Leaf Flashcard Node (Question Card - Full Text Display)
            // -----------------------------------------------------------------
            if (isLeafQuestion && node.card) {
              const card = node.card;
              const flag = cardFlags[card.id];
              const flagInfo = flag ? FLAG_OPTIONS[flag] : null;
              const qFa = typeof card.question === 'object' ? card.question.fa || card.question.en : card.question;
              const qEn = typeof card.question === 'object' ? card.question.en || card.question.fa : card.question;

              return (
                <div
                  key={node.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectQuestionCard(card);
                  }}
                  onContextMenu={(e) => onOpenContextMenu(e, node)}
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                  style={{
                    position: 'absolute',
                    left: `${item.x}px`,
                    top: `${item.y}px`,
                    width: `${item.width}px`,
                    minHeight: `${item.height}px`,
                  }}
                  className={`mindmap-interactive-node group p-3 rounded-2xl border transition-all duration-200 cursor-pointer shadow-lg hover:shadow-2xl hover:scale-[1.02] flex flex-col justify-between gap-2.5 ${
                    flagInfo
                      ? `${flagInfo.badge} ring-1 ring-white/10`
                      : 'bg-slate-900/95 hover:bg-slate-850 border-slate-700/80 hover:border-purple-400'
                  }`}
                >
                  {/* Top Bar: Icon, Box Badge & Flag */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {flagInfo ? (
                        <Flag className={`w-3.5 h-3.5 shrink-0 fill-current ${flagInfo.iconColor}`} />
                      ) : (
                        <HelpCircle className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
                      )}
                      <span className="text-[10px] font-bold text-slate-400">
                        {card.topic || 'Clinical Item'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] px-2 py-0.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono font-bold">
                        B{card.box}
                      </span>
                      <Eye className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-300 transition" />
                    </div>
                  </div>

                  {/* Question Content (STRICT SINGLE LANGUAGE) */}
                  <div className="space-y-1 flex-1 min-w-0">
                    {isFa ? (
                      <div
                        className="text-xs font-bold text-slate-100 leading-relaxed break-words whitespace-normal"
                        dir="rtl"
                      >
                        {qFa || qEn}
                      </div>
                    ) : (
                      <div
                        className="text-xs font-semibold text-slate-100 leading-relaxed font-sans break-words whitespace-normal"
                        dir="ltr"
                      >
                        {qEn || qFa}
                      </div>
                    )}
                  </div>

                  {/* Card Footer: Tags & Review Hint */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px] text-slate-400">
                    <span className="font-mono text-emerald-400 font-semibold">
                      {isFa ? 'برای مشاهده پاسخ کلیک کنید' : 'Click to reveal'}
                    </span>
                    {flagInfo && (
                      <span className="font-bold">{isFa ? flagInfo.name.fa.split(' ')[0] : flagInfo.name.en.split(' ')[0]}</span>
                    )}
                  </div>
                </div>
              );
            }

            // -----------------------------------------------------------------
            // B. Branch Nodes (Levels 0 to 5 - Root, Domain, System, Condition...)
            // -----------------------------------------------------------------
            return (
              <div
                key={node.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleNode(node.id);
                }}
                onContextMenu={(e) => onOpenContextMenu(e, node)}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                style={{
                  position: 'absolute',
                  left: `${item.x}px`,
                  top: `${item.y}px`,
                  width: `${item.width}px`,
                  minHeight: `${item.height}px`,
                }}
                className={`mindmap-interactive-node group p-3 rounded-2xl border transition-all duration-200 cursor-pointer shadow-lg hover:shadow-2xl hover:scale-[1.02] flex flex-col justify-between gap-1.5 ${
                  node.level === 0
                    ? 'bg-slate-900/95 border-purple-500/80 shadow-purple-500/20 ring-2 ring-purple-500/30'
                    : `${theme.bg} ${theme.border} ${theme.glow}`
                }`}
              >
                {/* Title Content Only (Clean Minimal Cell) */}
                <div className="flex items-center justify-between gap-2 min-w-0 w-full">
                  <div className="flex-1 min-w-0">
                    {/* FULL TEXT DISPLAY - NO TRUNCATION */}
                    <div
                      className={`font-extrabold text-xs sm:text-sm leading-snug break-words whitespace-normal ${
                        node.level === 0 ? 'text-purple-200' : theme.text
                      }`}
                      dir={isFa ? 'rtl' : 'ltr'}
                    >
                      {displayTitle}
                    </div>
                  </div>

                  {node.cardCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-md bg-black/40 text-slate-300 text-[10px] font-mono font-bold shrink-0">
                      {node.cardCount}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modals & Portals rendered inside canvas container so they are visible during Fullscreen */}
      {children}
    </div>
  );
};
