import { useState, useEffect, useRef } from 'react';
import { Search, X, FileText, Wrench, HardHat, Layers, ClipboardList, FolderOpen } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: 'hk' | 'fm' | 'retrofit' | 'inquiry';
  icon: any;
  color: string;
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (type: 'hk' | 'fm' | 'retrofit' | 'inquiries', projectId?: string) => void;
}

export default function GlobalSearch({ isOpen, onClose, onNavigate }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === 'Enter' && results.length > 0) {
        e.preventDefault();
        handleSelect(results[selectedIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      await performSearch(query);
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    try {
      const searchPattern = `%${searchQuery}%`;
      const results: SearchResult[] = [];

      const [hkProjects, fmProjects, retrofitProjects, inquiries] = await Promise.all([
        supabase
          .from('hk_projects')
          .select('id, project_name, client_name')
          .or(`project_name.ilike.${searchPattern},client_name.ilike.${searchPattern}`)
          .limit(5),
        supabase
          .from('fm_projects')
          .select('id, project_name, client_name')
          .or(`project_name.ilike.${searchPattern},client_name.ilike.${searchPattern}`)
          .limit(5),
        supabase
          .from('retrofit_projects')
          .select('id, project_name, client_name')
          .or(`project_name.ilike.${searchPattern},client_name.ilike.${searchPattern}`)
          .limit(5),
        supabase
          .from('inquiries')
          .select('id, project_name, client_name')
          .or(`project_name.ilike.${searchPattern},client_name.ilike.${searchPattern}`)
          .limit(5)
      ]);

      if (hkProjects.data) {
        results.push(...hkProjects.data.map(p => ({
          id: p.id,
          title: p.project_name,
          subtitle: p.client_name || 'No client',
          type: 'hk' as const,
          icon: Layers,
          color: 'text-green-600'
        })));
      }

      if (fmProjects.data) {
        results.push(...fmProjects.data.map(p => ({
          id: p.id,
          title: p.project_name,
          subtitle: p.client_name || 'No client',
          type: 'fm' as const,
          icon: Wrench,
          color: 'text-orange-600'
        })));
      }

      if (retrofitProjects.data) {
        results.push(...retrofitProjects.data.map(p => ({
          id: p.id,
          title: p.project_name,
          subtitle: p.client_name || 'No client',
          type: 'retrofit' as const,
          icon: HardHat,
          color: 'text-blue-600'
        })));
      }

      if (inquiries.data) {
        results.push(...inquiries.data.map(p => ({
          id: p.id,
          title: p.project_name,
          subtitle: p.client_name || 'No client',
          type: 'inquiry' as const,
          icon: ClipboardList,
          color: 'text-yellow-600'
        })));
      }

      setResults(results);
      setSelectedIndex(0);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (result: SearchResult) => {
    if (result.type === 'inquiry') {
      onNavigate('inquiries');
    } else {
      onNavigate(result.type, result.id);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl mx-4">
        <div className="flex items-center gap-3 p-4 border-b border-gray-200">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects, inquiries... (Press ESC to close)"
            className="flex-1 outline-none text-lg"
          />
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Searching...
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((result, index) => {
                const Icon = result.icon;
                return (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleSelect(result)}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                      index === selectedIndex ? 'bg-blue-50' : ''
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${result.color}`} />
                    <div className="flex-1 text-left">
                      <div className="font-medium text-gray-900">{result.title}</div>
                      <div className="text-sm text-gray-500">{result.subtitle}</div>
                    </div>
                    <div className="text-xs text-gray-400 uppercase">
                      {result.type === 'inquiry' ? 'Inquiry' : `${result.type.toUpperCase()} Project`}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : query.trim().length >= 2 ? (
            <div className="p-8 text-center text-gray-500">
              <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              No results found for "{query}"
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              Type at least 2 characters to search
            </div>
          )}
        </div>

        <div className="p-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span>
              <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">↑↓</kbd> Navigate
            </span>
            <span>
              <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">Enter</kbd> Select
            </span>
            <span>
              <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">ESC</kbd> Close
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
