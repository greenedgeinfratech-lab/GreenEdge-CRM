'use client';

interface WidgetSkeletonProps {
  rows?: number;
  className?: string;
}

function Pulse({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${className}`}
      style={style}
    />
  );
}

export function WidgetSkeleton({ rows = 4, className = '' }: WidgetSkeletonProps) {
  return (
    <div className={`p-4 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <Pulse className="h-5 w-36" />
        <Pulse className="h-4 w-8" />
      </div>
      {/* Rows */}
      <div className="flex flex-col gap-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex justify-between items-center">
            <Pulse className="h-4 w-24" />
            <Pulse className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function FunnelSkeleton() {
  const widths = ['100%', '85%', '70%', '55%', '42%', '35%'];
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <Pulse className="h-5 w-28" />
        <Pulse className="h-4 w-8" />
      </div>
      <div className="flex flex-col gap-2 mt-2">
        {widths.map((w, i) => (
          <Pulse key={i} className="h-7 rounded" style={{ width: w }} />
        ))}
      </div>
    </div>
  );
}

export function CardGridSkeleton({ cols = 2 }: { cols?: number }) {
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <Pulse className="h-5 w-28" />
        <Pulse className="h-4 w-8" />
      </div>
      <div className={cols === 2 ? 'grid grid-cols-2 gap-3' : 'grid grid-cols-3 gap-3'}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`border border-gray-100 rounded p-2 ${i === 4 ? 'col-span-2' : ''}`}
          >
            <Pulse className="h-3 w-20 mb-2" />
            <Pulse className="h-5 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ShortcutsSkeleton() {
  return (
    <div className="p-4">
      <Pulse className="h-5 w-24 mb-4" />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 9 }).map((_, i) => (
          <Pulse key={i} className="h-7 w-28 rounded" />
        ))}
      </div>
    </div>
  );
}

export function TasksSkeleton() {
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <Pulse className="h-5 w-16" />
        <Pulse className="h-4 w-16" />
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Pulse className="h-5 w-5 rounded-full flex-shrink-0" />
            <div className="flex-1">
              <Pulse className="h-4 w-40 mb-1" />
              <Pulse className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FeedSkeleton() {
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <Pulse className="h-5 w-28" />
        <Pulse className="h-6 w-20 rounded" />
      </div>
      <div className="flex flex-col gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <Pulse className="h-6 w-6 rounded-full" />
              {i < 3 && <div className="w-0.5 h-6 bg-gray-200 mt-1" />}
            </div>
            <div className="flex-1 pb-2">
              <Pulse className="h-4 w-32 mb-1" />
              <Pulse className="h-3 w-48" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
