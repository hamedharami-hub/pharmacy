'use client';

import React from 'react';
import { ClinicalDomain } from '@/types/shelf';
import { Language } from '@/types/pharmacy';
import {
  Stethoscope,
  Heart,
  Brain,
  Zap,
  Microscope,
  Pill,
  Leaf,
  Boxes,
} from 'lucide-react';

interface ShelfDomainSelectorProps {
  clinicalDomains: ClinicalDomain[];
  selectedDomainId: string;
  onSelectDomain: (id: string) => void;
  language: Language;
}

export const ShelfDomainSelector: React.FC<ShelfDomainSelectorProps> = ({
  clinicalDomains,
  selectedDomainId,
  onSelectDomain,
  language,
}) => {
  const isFa = language === 'fa';

  const renderDomainIcon = (iconType: string) => {
    switch (iconType) {
      case 'steth':
        return <Stethoscope className="w-3.5 h-3.5 text-sky-400" />;
      case 'heart':
        return <Heart className="w-3.5 h-3.5 text-rose-400" />;
      case 'brain':
        return <Brain className="w-3.5 h-3.5 text-purple-400" />;
      case 'endocr':
        return <Zap className="w-3.5 h-3.5 text-amber-400" />;
      case 'micro':
        return <Microscope className="w-3.5 h-3.5 text-emerald-400" />;
      case 'pharm':
        return <Pill className="w-3.5 h-3.5 text-indigo-400" />;
      case 'leaf':
        return <Leaf className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Boxes className="w-3.5 h-3.5 text-teal-400" />;
    }
  };

  return (
    <div className="flex items-center gap-1.5 bg-black/30 p-1.5 rounded-xl border app-border text-xs overflow-x-auto no-scrollbar max-w-full flex-wrap">
      {clinicalDomains.map((domain) => {
        const isSelected = domain.id === selectedDomainId;
        return (
          <button
            key={domain.id}
            type="button"
            onClick={() => onSelectDomain(domain.id)}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer ${
              isSelected
                ? 'bg-sky-600 text-white shadow-sm ring-1 ring-sky-400/40'
                : 'app-muted hover:app-text hover:bg-slate-800/60'
            }`}
          >
            {renderDomainIcon(domain.iconType)}
            <span>{isFa ? domain.titleFa : domain.titleEn}</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                isSelected ? 'bg-black/30 text-sky-200' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {domain.subcategories.length}
            </span>
          </button>
        );
      })}
    </div>
  );
};

