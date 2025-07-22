// src/components/search/GlobalSearch.tsx
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useDebounce } from '@/hooks/useDebounce';
import { useClickOutside } from '@/hooks/useClickOutside';
import { Link } from 'react-router-dom';
import { Search, Loader2, User, ShoppingCart, Package, AlertTriangle } from 'lucide-react';

interface SearchResult {
    type: string;
    id: string;
    title: string;
    description: string;
    link: string;
}

const getIconForType = (type: string) => {
    switch (type) {
        case 'customer': return <User className="w-5 h-5 text-blue-500" />;
        case 'order': return <ShoppingCart className="w-5 h-5 text-green-500" />;
        case 'product': return <Package className="w-5 h-5 text-purple-500" />;
        default: return <Search className="w-5 h-5 text-gray-500" />;
    }
};

const GlobalSearch: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(true);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useClickOutside(searchContainerRef, () => {
    setIsFocused(false);
  });
  
  useEffect(() => {
    const performSearch = async () => {
      if (debouncedSearchTerm.length < 2) {
        setResults([]);
        setError(null);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const { data, error: rpcError } = await supabase.rpc('global_search', { search_term: debouncedSearchTerm });
        if (rpcError) throw rpcError;
        setResults(data || []);
      } catch (err: any) {
        console.error('Global search failed:', err);
        setError(`Search failed: ${err.message || 'Please check the search function in Supabase.'}`);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };
    performSearch();
  }, [debouncedSearchTerm]);

  return (
    <div className="relative w-full max-w-md" ref={searchContainerRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search for customers, orders, products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsFocused(true)}
          className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />}
      </div>
      
      {isFocused && (searchTerm.length > 0) && (
        <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
          {error && (
            <div className="p-4 text-center text-sm text-red-600 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>{error}</span>
            </div>
          )}
          {!error && results.length > 0 ? (
            <ul>
              {results.map((result) => (
                <li key={`${result.type}-${result.id}`}>
                  <Link 
                    to={result.link} 
                    className="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => {
                        setIsFocused(false);
                        setSearchTerm('');
                    }}
                  >
                    <div className="flex-shrink-0">{getIconForType(result.type)}</div>
                    <div className="flex-grow">
                      <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">{result.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{result.description}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
             !error && (
                <div className="p-4 text-center text-sm text-gray-500">
                    {!loading && debouncedSearchTerm.length > 1 ? 'No results found.' : 'Keep typing to see results.'}
                </div>
             )
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
