'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { dashboardService } from '@/services/dashboardService';

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  url: string;
}

interface ResultGroup {
  label: string;
  icon: string;
  items: SearchResult[];
}

export default function GlobalSearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Record<string, ResultGroup>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (query.length < 2) {
      setResults({});
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await dashboardService.search(query);
        setResults(data?.results ?? {});
      } catch {
        setResults({});
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const hasResults = Object.keys(results).length > 0;
  const totalCount = Object.values(results).reduce((sum, g) => sum + g.items.length, 0);

  const handleSelect = (url: string) => {
    setQuery('');
    setIsOpen(false);
    router.push(url);
  };

  return (
    <div className="relative flex-1 max-w-sm">
      <div className="flex items-center border border-gray-300 rounded bg-gray-50 px-3 py-1.5 gap-2 focus-within:border-[#1a2b4c] focus-within:bg-white transition-colors">
        <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search customers, leads, products..."
          className="flex-1 text-sm bg-transparent outline-none text-gray-700 placeholder-gray-400"
        />
        {query && (
          <button onClick={() => { setQuery(''); setResults({}); }}>
            <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
          </button>
        )}
        {isLoading && (
          <div className="w-4 h-4 border-2 border-gray-300 border-t-[#1a2b4c] rounded-full animate-spin" />
        )}
      </div>

      {/* Results dropdown */}
      {isOpen && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
          {!hasResults && !isLoading ? (
            <div className="py-4 text-center text-sm text-gray-500">
              No results for &quot;{query}&quot;
            </div>
          ) : (
            <div>
              {hasResults && (
                <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100">
                  <span className="text-[10px] text-gray-500">{totalCount} result{totalCount !== 1 ? 's' : ''}</span>
                </div>
              )}
              {Object.entries(results).map(([key, group]) => (
                <div key={key}>
                  <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 border-b border-gray-100">
                    {group.label}
                  </div>
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item.url)}
                      className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors"
                    >
                      <p className="text-sm font-medium text-gray-800">{item.title}</p>
                      {item.subtitle && (
                        <p className="text-xs text-gray-500">{item.subtitle}</p>
                      )}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
