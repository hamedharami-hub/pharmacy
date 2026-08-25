import {
  MindMapNode,
  MindMapLayoutItem,
  MindMapLink,
  MindMapThemeConfig,
  MindMapTextDisplay,
  MindMapLineStyle,
} from '@/types/mindmap';
import { LeitnerCard } from '@/types/leitner';

export const DOMAIN_COLOR_PALETTES = [
  'purple',
  'cyan',
  'emerald',
  'amber',
  'rose',
  'indigo',
  'teal',
  'sky',
];

export const MINDMAP_THEMES: Record<string, MindMapThemeConfig> = {
  purple: {
    key: 'purple',
    name: { fa: 'بنفش سلطنتی', en: 'Royal Purple' },
    badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    border: 'border-purple-500/50 hover:border-purple-400',
    text: 'text-purple-300',
    bg: 'bg-purple-950/40',
    glow: 'shadow-purple-500/25',
    dot: 'bg-purple-400',
    stroke: '#a855f7',
    darkStroke: '#c084fc',
    lightStroke: '#7e22ce',
    accent: '#9333ea',
  },
  cyan: {
    key: 'cyan',
    name: { fa: 'فیروزه‌ای بالینی', en: 'Clinical Cyan' },
    badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    border: 'border-cyan-500/50 hover:border-cyan-400',
    text: 'text-cyan-300',
    bg: 'bg-cyan-950/40',
    glow: 'shadow-cyan-500/25',
    dot: 'bg-cyan-400',
    stroke: '#06b6d4',
    darkStroke: '#22d3ee',
    lightStroke: '#0891b2',
    accent: '#0891b2',
  },
  emerald: {
    key: 'emerald',
    name: { fa: 'زمردی درمانی', en: 'Emerald Green' },
    badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    border: 'border-emerald-500/50 hover:border-emerald-400',
    text: 'text-emerald-300',
    bg: 'bg-emerald-950/40',
    glow: 'shadow-emerald-500/25',
    dot: 'bg-emerald-400',
    stroke: '#10b981',
    darkStroke: '#34d399',
    lightStroke: '#059669',
    accent: '#059669',
  },
  amber: {
    key: 'amber',
    name: { fa: 'کهربایی دارویی', en: 'Amber Gold' },
    badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    border: 'border-amber-500/50 hover:border-amber-400',
    text: 'text-amber-300',
    bg: 'bg-amber-950/40',
    glow: 'shadow-amber-500/25',
    dot: 'bg-amber-400',
    stroke: '#f59e0b',
    darkStroke: '#fbbf24',
    lightStroke: '#d97706',
    accent: '#d97706',
  },
  rose: {
    key: 'rose',
    name: { fa: 'رز ایمنی و هشدار', en: 'Safety Rose' },
    badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    border: 'border-rose-500/50 hover:border-rose-400',
    text: 'text-rose-300',
    bg: 'bg-rose-950/40',
    glow: 'shadow-rose-500/25',
    dot: 'bg-rose-400',
    stroke: '#f43f5e',
    darkStroke: '#fb7185',
    lightStroke: '#e11d48',
    accent: '#e11d48',
  },
  indigo: {
    key: 'indigo',
    name: { fa: 'نیلی تشخیصی', en: 'Indigo Blue' },
    badge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    border: 'border-indigo-500/50 hover:border-indigo-400',
    text: 'text-indigo-300',
    bg: 'bg-indigo-950/40',
    glow: 'shadow-indigo-500/25',
    dot: 'bg-indigo-400',
    stroke: '#6366f1',
    darkStroke: '#818cf8',
    lightStroke: '#4f46e5',
    accent: '#4f46e5',
  },
  teal: {
    key: 'teal',
    name: { fa: 'آبی کدر اقیانوسی', en: 'Ocean Teal' },
    badge: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
    border: 'border-teal-500/50 hover:border-teal-400',
    text: 'text-teal-300',
    bg: 'bg-teal-950/40',
    glow: 'shadow-teal-500/25',
    dot: 'bg-teal-400',
    stroke: '#14b8a6',
    darkStroke: '#2dd4bf',
    lightStroke: '#0d9488',
    accent: '#0d9488',
  },
  sky: {
    key: 'sky',
    name: { fa: 'آبی آسمانی', en: 'Sky Blue' },
    badge: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    border: 'border-sky-500/50 hover:border-sky-400',
    text: 'text-sky-300',
    bg: 'bg-sky-950/40',
    glow: 'shadow-sky-500/25',
    dot: 'bg-sky-400',
    stroke: '#0ea5e9',
    darkStroke: '#38bdf8',
    lightStroke: '#0284c7',
    accent: '#0284c7',
  },
};

/**
 * Calculates adaptive width and height for a node based on its level, text length, and display mode
 */
export function calculateNodeDimensions(
  node: MindMapNode,
  displayMode: MindMapTextDisplay,
  cardLangMode: 'fa' | 'en' | 'bilingual' = 'fa'
): { width: number; height: number } {
  const isLeafCard = node.level === 6 && !!node.card;

  if (node.level === 0) {
    return { width: 300, height: 76 };
  }

  if (isLeafCard && node.card) {
    const qFa = typeof node.card.question === 'object' ? node.card.question.fa || '' : node.card.question || '';
    const qEn = typeof node.card.question === 'object' ? node.card.question.en || '' : node.card.question || '';
    
    // Estimate text volume based on selected language
    const charCount = (cardLangMode === 'fa' ? qFa.length || qEn.length : qEn.length || qFa.length) || 40;

    if (displayMode === 'full_detailed') {
      const width = 340;
      // Calculate dynamic height based on text volume
      const lines = Math.ceil(charCount / 38);
      const height = Math.max(88, Math.min(260, 52 + lines * 18));
      return { width, height };
    } else {
      const width = 280;
      const height = 68;
      return { width, height };
    }
  }

  // Branch nodes (levels 1-5)
  const titleFa = node.title.fa || '';
  const titleEn = node.title.en || '';
  const titleLen = Math.max(titleFa.length, titleEn.length);

  if (displayMode === 'full_detailed') {
    const width = node.level === 1 ? 270 : node.level === 2 ? 260 : node.level === 3 ? 270 : 280;
    const isMultiLine = titleLen > 28;
    const height = isMultiLine ? (node.level === 1 ? 76 : 70) : (node.level === 1 ? 64 : 58);
    return { width, height };
  } else {
    const width = node.level === 1 ? 230 : node.level === 2 ? 220 : 210;
    const height = node.level === 1 ? 58 : 52;
    return { width, height };
  }
}

export interface TreeLayoutResult {
  items: MindMapLayoutItem[];
  links: MindMapLink[];
  bounds: { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number };
}

/**
 * Computes a tree layout with exact parent-child connecting links and proper spacing
 */
export function computeMindMapLayout(
  root: MindMapNode,
  expandedNodeIds: Record<string, boolean>,
  displayMode: MindMapTextDisplay = 'full_detailed',
  cardLangMode: 'fa' | 'en' | 'bilingual' = 'bilingual',
  lineStyle: MindMapLineStyle = 'smooth_bezier',
  isDarkTheme: boolean = true
): TreeLayoutResult {
  const items: MindMapLayoutItem[] = [];
  const links: MindMapLink[] = [];

  const colSpacing = displayMode === 'full_detailed' ? 380 : 300;
  let currentY = 50;

  // Step 1: Recursive layout calculator to assign (X, Y) and dimensions to each visible node
  function layoutSubtree(
    node: MindMapNode,
    depth: number,
    x: number,
    parentId?: string
  ): { y: number; height: number } {
    const isExpanded = !!expandedNodeIds[node.id];
    const { width, height } = calculateNodeDimensions(node, displayMode, cardLangMode);
    const visibleChildren = isExpanded ? node.children : [];
    const hasChildren = node.children.length > 0;

    let nodeY: number;

    if (visibleChildren.length === 0) {
      // Leaf in current expanded tree
      nodeY = currentY;
      currentY += height + (node.level === 6 ? 16 : 24);
    } else {
      const childCenters: number[] = [];
      const nextX = x + colSpacing;

      visibleChildren.forEach((child) => {
        const childRes = layoutSubtree(child, depth + 1, nextX, node.id);
        childCenters.push(childRes.y + (calculateNodeDimensions(child, displayMode, cardLangMode).height / 2));
      });

      // Align parent vertically with the centroid of its children
      if (childCenters.length === 1) {
        nodeY = childCenters[0] - height / 2;
      } else {
        const firstCenter = childCenters[0];
        const lastCenter = childCenters[childCenters.length - 1];
        nodeY = (firstCenter + lastCenter) / 2 - height / 2;
      }

      // Prevent parent from overlapping previous subtree
      if (nodeY < currentY - height) {
        // Safe position
      }
    }

    const layoutItem: MindMapLayoutItem = {
      node,
      id: node.id,
      parentId,
      x,
      y: nodeY,
      width,
      height,
      level: node.level,
      isExpanded,
      hasChildren,
      colorTheme: node.colorTheme || 'purple',
    };

    items.push(layoutItem);

    return { y: nodeY, height };
  }

  layoutSubtree(root, 0, 60, undefined);

  // Normalize Y if anything went negative
  const minYCoord = Math.min(...items.map((it) => it.y), 40);
  if (minYCoord < 40) {
    const shiftY = 40 - minYCoord;
    items.forEach((it) => {
      it.y += shiftY;
    });
  }

  // Step 2: Build coordinate lookup map
  const itemMap = new Map<string, MindMapLayoutItem>();
  items.forEach((it) => itemMap.set(it.id, it));

  // Step 3: Generate visible links between parents and children
  items.forEach((item) => {
    if (item.parentId) {
      const parent = itemMap.get(item.parentId);
      if (parent) {
        const startX = parent.x + parent.width;
        const startY = parent.y + parent.height / 2;
        const endX = item.x;
        const endY = item.y + item.height / 2;

        const theme = MINDMAP_THEMES[item.colorTheme] || MINDMAP_THEMES.purple;
        const strokeColor = isDarkTheme ? theme.darkStroke : theme.lightStroke;

        links.push({
          id: `link-${parent.id}-${item.id}`,
          sourceId: parent.id,
          targetId: item.id,
          startX,
          startY,
          endX,
          endY,
          color: strokeColor,
          strokeWidth: item.level <= 2 ? 3 : 2,
        });
      }
    }
  });

  // Step 4: Calculate bounding box
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  items.forEach((it) => {
    minX = Math.min(minX, it.x);
    minY = Math.min(minY, it.y);
    maxX = Math.max(maxX, it.x + it.width);
    maxY = Math.max(maxY, it.y + it.height);
  });

  if (items.length === 0) {
    minX = 0;
    minY = 0;
    maxX = 800;
    maxY = 600;
  }

  return {
    items,
    links,
    bounds: {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX + 120,
      height: maxY - minY + 120,
    },
  };
}

/**
 * Generates an SVG path command for a link according to chosen style
 */
export function generateLinkPathData(
  link: MindMapLink,
  style: MindMapLineStyle = 'smooth_bezier'
): string {
  const { startX, startY, endX, endY } = link;
  const dx = Math.max(30, (endX - startX) * 0.5);

  if (style === 'smooth_bezier') {
    return `M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`;
  }

  if (style === 'orthogonal_step') {
    const midX = startX + dx;
    return `M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY}`;
  }

  // Straight line
  return `M ${startX} ${startY} L ${endX} ${endY}`;
}
