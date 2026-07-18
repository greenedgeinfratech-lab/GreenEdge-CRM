'use client';

import React, { Component, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  widgetName?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class WidgetErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[Dashboard Widget Error] ${this.props.widgetName}:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="bg-white border border-red-200 rounded shadow-sm p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div>
            <div className="text-sm font-medium text-red-600">
              {this.props.widgetName ?? 'Widget'} unavailable
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              This widget encountered an error. Other widgets continue working normally.
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/** Inline error state for async widget failures (not React errors). */
export function WidgetError({
  message,
  widgetName,
}: {
  message?: string;
  widgetName?: string;
}) {
  return (
    <div className="flex-1 flex items-center justify-center gap-2 py-6 text-center">
      <div>
        <AlertTriangle className="w-8 h-8 text-orange-400 mx-auto mb-2" />
        <div className="text-sm font-medium text-gray-600">
          {widgetName ?? 'Widget'} temporarily unavailable
        </div>
        <div className="text-xs text-gray-400 mt-1">
          {message ?? 'Could not load data. Please refresh the page.'}
        </div>
      </div>
    </div>
  );
}
