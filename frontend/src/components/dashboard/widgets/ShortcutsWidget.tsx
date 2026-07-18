'use client';

import Link from 'next/link';
import { Settings } from 'lucide-react';
import { Shortcut } from '@/interfaces/dashboard';
import { ShortcutsSkeleton } from '../skeletons/WidgetSkeleton';

interface Props {
  shortcuts?: Shortcut[];
  isLoading: boolean;
}

export default function ShortcutsWidget({ shortcuts, isLoading }: Props) {
  if (isLoading) return (
    <div className="bg-white border border-gray-200 rounded shadow-sm">
      <ShortcutsSkeleton />
    </div>
  );

  const items = shortcuts ?? [];

  return (
    <div className="bg-white border border-gray-200 rounded shadow-sm p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-gray-800 font-semibold text-lg">Shortcuts</h2>
        <Settings className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600" />
      </div>

      <div className="flex flex-wrap gap-2">
        {items.length === 0 ? (
          <p className="text-gray-400 text-sm">No shortcuts configured.</p>
        ) : (
          items.map((shortcut, idx) => (
            <Link key={idx} href={shortcut.url}>
              <button className="border border-green-500 text-green-600 px-3 py-1.5 rounded text-xs font-medium hover:bg-green-50 transition-colors">
                {shortcut.label}
              </button>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
