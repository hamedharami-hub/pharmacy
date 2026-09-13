'use client';

import React from 'react';

interface ModuleLoadingSkeletonProps {
  title?: string;
}

export const ModuleLoadingSkeleton: React.FC<ModuleLoadingSkeletonProps> = ({ title }) => {
  return (
    <div className="w-full space-y-4 animate-pulse p-2 sm:p-4">
      {/* Top Header Placeholder */}
      <div className="flex items-center justify-between p-3 bg-black/10 dark:bg-slate-900/60 rounded-2xl border app-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800/80 shrink-0" />
          <div className="space-y-2">
            <div className="h-4 w-40 sm:w-56 bg-slate-800/90 rounded-md" />
            <div className="h-3 w-28 bg-slate-800/50 rounded-md" />
          </div>
        </div>
        <div className="h-8 w-24 bg-slate-800/60 rounded-xl hidden sm:block" />
      </div>

      {/* Tabs / Filter Row Placeholder */}
      <div className="flex items-center gap-2 overflow-hidden">
        <div className="h-9 w-28 bg-slate-800/70 rounded-xl shrink-0" />
        <div className="h-9 w-32 bg-slate-800/60 rounded-xl shrink-0" />
        <div className="h-9 w-24 bg-slate-800/50 rounded-xl shrink-0" />
        <div className="h-9 w-36 bg-slate-800/40 rounded-xl shrink-0" />
      </div>

      {/* Content Grid Cards Placeholder */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="p-4 rounded-2xl border app-border bg-slate-900/40 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-28 bg-slate-800 rounded-md" />
              <div className="h-5 w-14 bg-slate-800/80 rounded-full" />
            </div>
            <div className="space-y-1.5 pt-1">
              <div className="h-3 w-full bg-slate-800/60 rounded-md" />
              <div className="h-3 w-4/5 bg-slate-800/40 rounded-md" />
            </div>
            <div className="pt-2 flex items-center gap-2">
              <div className="h-6 w-16 bg-slate-800/50 rounded-lg" />
              <div className="h-6 w-16 bg-slate-800/50 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
