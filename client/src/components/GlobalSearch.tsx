import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, Calendar, CreditCard, DollarSign, X, Loader2 } from 'lucide-react';
import api from '../services/api';

interface SearchResult {
  id: string;
  label: string;
  sub: string;
  type: 'employee' | 'leave' | 'payroll' | 'loan';
  href: string;
}

interface SearchResults {
  employees: SearchResult[];
  leaves: SearchResult[];
  payrolls: SearchResult[];
  loans: SearchResult[];
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  employee: <User size={14} />,
  leave: <Calendar size={14} />,
  payroll: <DollarSign size={14} />,
  loan: <CreditCard size={14} />,
};

const TYPE_COLORS: Record<string, string> = {
  employee: 'text-blue-400',
  leave: 'text-emerald-400',
  payroll: 'text-yellow-400',
  loan: 'text-purple-400',
};

const CATEGORY_LABELS: Record<string, string> = {
  employees: 'Employees',
  leaves: 'Leave Requests',
  payrolls: 'Payroll',
  loans: 'Loans',
};

export const GlobalSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  const flatResults: SearchResult[] = results
    ? [
        ...(results.employees || []),
        ...(results.leaves || []),
        ...(results.payrolls || []),
        ...(results.loans || []),
      ]
    : [];

  const hasAnyResults = flatResults.length > 0;

  const fetchResults = useCallback(async (q: string) => {
    try {
      setError(null);
      const res = await api.get(`/search?q=${encodeURIComponent(q)}`);
      setResults(res.data.results ?? null);
    } catch (e: any) {
      console.error('Search fetch error:', e);
      const msg = e.response?.data?.message || e.response?.data?.error || e.message || 'Search failed';
      setError(msg);
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim() || query.trim().length < 2) {
      setResults(null);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(() => fetchResults(query.trim()), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, fetchResults]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, flatResults.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && activeIndex >= 0 && flatResults[activeIndex]) { handleSelect(flatResults[activeIndex]); }
    else if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur(); }
  };

  const handleSelect = (result: SearchResult) => {
    setQuery('');
    setResults(null);
    setOpen(false);
    navigate(result.href);
  };

  const showDropdown = open && query.trim().length >= 2;

  // Build flat index map for rendering
  let flatIdx = -1;

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', maxWidth: '480px' }}>
      {/* Input wrapper */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280', pointerEvents: 'none', display: 'flex' }}>
          <Search size={15} />
        </span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); setActiveIndex(-1); }}
          onFocus={() => query.trim().length >= 2 && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Quick search..."
          style={{
            width: '100%',
            backgroundColor: 'rgba(30, 41, 59, 0.8)',
            border: open && query.length >= 2 ? '1px solid #3b82f6' : '1px solid #334155',
            borderRadius: '8px',
            color: '#f1f5f9',
            padding: '7px 32px 7px 34px',
            fontSize: '13px',
            outline: 'none',
            boxShadow: open && query.length >= 2 ? '0 0 0 2px rgba(59,130,246,0.15)' : 'none',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
        />
        {loading && (
          <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280', display: 'flex' }}>
            <Loader2 size={14} className="animate-spin" />
          </span>
        )}
        {!loading && query && (
          <button
            onClick={() => { setQuery(''); setResults(null); setOpen(false); inputRef.current?.focus(); }}
            style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', display: 'flex', padding: '2px', borderRadius: '4px' }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Dropdown - Fixed position to avoid being cut off by overflow:hidden parents */}
      {showDropdown && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          right: 0,
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '12px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          zIndex: 9999,
          overflow: 'hidden',
          maxHeight: '420px',
          overflowY: 'auto',
        }}>
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 16px', color: '#6b7280', fontSize: '13px' }}>
              <Loader2 size={14} className="animate-spin" />
              Searching...
            </div>
          )}

          {!loading && error && (
            <div style={{ padding: '14px 16px', color: '#f87171', fontSize: '13px', background: 'rgba(239, 68, 68, 0.05)' }}>
              ⚠ {error}
            </div>
          )}

          {!loading && !error && !hasAnyResults && results !== null && (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: '#475569', fontSize: '13px' }}>
              No results for <span style={{ color: '#94a3b8' }}>"{query}"</span>
            </div>
          )}

          {!loading && !error && hasAnyResults && results && (
            <>
              {(Object.entries(results) as [string, SearchResult[]][]).map(([cat, items]) => {
                if (!items?.length) return null;
                return (
                  <div key={cat}>
                    <div style={{
                      padding: '6px 16px 4px',
                      fontSize: '10px',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: '#475569',
                      backgroundColor: 'rgba(15,23,42,0.9)',
                      borderBottom: '1px solid #1e293b',
                    }}>
                      {CATEGORY_LABELS[cat]}
                    </div>
                    {items.map(result => {
                      flatIdx++;
                      const myIdx = flatIdx;
                      const isActive = activeIndex === myIdx;
                      return (
                        <button
                          key={result.id}
                          onClick={() => handleSelect(result)}
                          onMouseEnter={() => setActiveIndex(myIdx)}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '10px',
                            padding: '10px 16px',
                            background: isActive ? 'rgba(59,130,246,0.12)' : 'transparent',
                            border: 'none',
                            borderBottom: '1px solid #0f172a',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'background 0.1s',
                          }}
                        >
                          <span style={{ marginTop: '2px', flexShrink: 0 }} className={TYPE_COLORS[result.type]}>
                            {TYPE_ICONS[result.type]}
                          </span>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: '13px', color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {result.label}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {result.sub}
                            </div>
                          </div>
                          {isActive && (
                            <span style={{ fontSize: '10px', color: '#3b82f6', flexShrink: 0, alignSelf: 'center' }}>↵</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
              <div style={{ padding: '8px 16px', fontSize: '11px', color: '#334155', textAlign: 'center', borderTop: '1px solid #1e293b' }}>
                {flatResults.length} result{flatResults.length !== 1 ? 's' : ''} &nbsp;·&nbsp; ↑↓ navigate &nbsp;·&nbsp; ↵ open &nbsp;·&nbsp; Esc close
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
