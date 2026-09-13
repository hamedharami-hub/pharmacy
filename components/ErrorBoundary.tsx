'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  moduleName?: string;
  isFa?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    console.error('[ErrorBoundary caught an error]:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isFa = this.props.isFa ?? true;
      const moduleLabel = this.props.moduleName || (isFa ? 'این ماژول' : 'this module');

      return (
        <div
          dir={isFa ? 'rtl' : 'ltr'}
          className="p-6 my-6 rounded-2xl bg-rose-950/20 border border-rose-500/40 text-rose-200 shadow-xl max-w-2xl mx-auto space-y-4 animate-fadeIn"
        >
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-rose-600/30 text-rose-300 border border-rose-500/50 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1 flex-1">
              <h3 className="text-base font-black text-rose-100">
                {isFa ? `خطای غیرمنتظره در بارگذاری ${moduleLabel}` : `Unexpected error in ${moduleLabel}`}
              </h3>
              <p className="text-xs text-rose-300/80 leading-relaxed">
                {isFa
                  ? 'یک خطای موقت در رندر کردن داده‌های این بخش رخ داده است. جای نگرانی نیست، پیشرفت مطالعه شما در سیستم ذخیره است.'
                  : 'A runtime error occurred while rendering this section. Your study progress remains safe.'}
              </p>
            </div>
          </div>

          {this.state.error && (
            <div className="p-3 rounded-xl bg-black/40 border border-rose-900/50 font-mono text-[11px] text-rose-300/90 overflow-x-auto">
              <span className="font-bold text-rose-400">Error: </span>
              {this.state.error.message || String(this.state.error)}
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={this.handleReset}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-md shadow-rose-900/40 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isFa ? 'تلاش مجدد و بارگذاری' : 'Retry'}</span>
            </button>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
            >
              <Home className="w-3.5 h-3.5 text-slate-400" />
              <span>{isFa ? 'تازه‌سازی کل صفحه' : 'Reload Page'}</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
