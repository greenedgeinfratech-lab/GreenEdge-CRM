'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Building2, UserPlus, FileText, ShoppingCart, Package } from 'lucide-react';
import api from '@/lib/api';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Record<string, SearchGroup>>({});
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  type SearchItem = { id: string; title: string; subtitle?: string; url: string };
  type SearchGroup = { label: string; items: SearchItem[] };

  const handleSearch = async () => {
    const term = query.trim();
    if (term.length < 2) {
      setResults({});
      setHasSearched(false);
      return;
    }
    setSearching(true);
    try {
      const res = await api.get(`/dashboard/search/?q=${encodeURIComponent(term)}`);
      setResults(res.data?.results || {});
      setHasSearched(true);
    } catch {
      setResults({});
      setHasSearched(true);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(handleSearch, 350);
    return () => clearTimeout(timer);
  // Search as the user types; handleSearch intentionally reads the latest query.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const resultGroups = Object.entries(results) as [string, SearchGroup][];

  return (
    <div className="flex flex-col gap-4 max-w-[1600px] mx-auto p-2">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-3 border-b border-gray-200">
        <div className="flex items-center space-x-4 text-xl text-gray-800">
          <span>Search</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search leads, customers, invoices, products..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={searching || query.length < 2}
            className="px-6 py-3 bg-[#c85a17] text-white rounded-lg text-sm font-medium hover:bg-[#b04a10] disabled:opacity-50"
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {/* Results */}
      {resultGroups.length > 0 && (
        <div className="space-y-4">
          {resultGroups.map(([type, group]) => (
            <div key={type} className="bg-white border rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b bg-gray-50 flex items-center gap-2">
                {type === 'leads' && <UserPlus className="w-4 h-4 text-blue-500" />}
                {type === 'customers' && <Building2 className="w-4 h-4 text-green-500" />}
                {type === 'quotations' && <FileText className="w-4 h-4 text-purple-500" />}
                {type === 'orders' && <ShoppingCart className="w-4 h-4 text-orange-500" />}
                {type === 'invoices' && <FileText className="w-4 h-4 text-red-500" />}
                {type === 'products' && <Package className="w-4 h-4 text-teal-500" />}
                <span className="font-semibold text-gray-800">{group.label}</span>
                <span className="text-xs text-gray-500">({group.items?.length || 0})</span>
              </div>
              <div className="divide-y divide-gray-100">
                {group.items.map((item) => (
                  <Link
                    key={item.id}
                    href={item.url}
                    className="flex items-center px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-800">{item.title}</div>
                      {item.subtitle && (
                        <div className="text-xs text-gray-500">{item.subtitle}</div>
                      )}
                    </div>
                    <span className="text-xs text-blue-600">View →</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {resultGroups.length === 0 && !searching && hasSearched && (
        <div className="bg-white border rounded-lg p-8 text-center text-gray-500">
          No results found for &quot;{query}&quot;
        </div>
      )}

      {/* Quick Links */}
      {resultGroups.length === 0 && !searching && query.length < 2 && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Quick Links</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Leads', icon: UserPlus, href: '/crm' },
              { label: 'Customers', icon: Building2, href: '/customers' },
              { label: 'Invoices', icon: FileText, href: '/invoices' },
              { label: 'Products', icon: Package, href: '/inventory' },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <link.icon className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-700">{link.label}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
