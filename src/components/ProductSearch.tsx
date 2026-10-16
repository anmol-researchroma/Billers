'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Product, Company } from '@/types/billing';
import { searchProducts } from '@/data/products';
import { Search, X, Flame, Shield, ArrowRight, CornerDownLeft, AlertCircle } from 'lucide-react';

interface ProductSearchProps {
  currentCompany: Company;
  onSelectProduct: (product: Product) => void;
  customProducts?: Product[];
}

export const ProductSearch: React.FC<ProductSearchProps> = ({
  currentCompany,
  onSelectProduct,
  customProducts = [],
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Directly derive search results across custom products + static catalog
  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    const tokens = q.split(/\s+/);

    const matchedCustom = customProducts.filter((product) => {
      const targetStr = `${product.name} ${product.productCode || ''} ${product.barcode || ''}`.toLowerCase();
      return tokens.every((token) => targetStr.includes(token));
    });

    const staticResults = searchProducts(query);
    // Combine custom matches first, followed by static matches
    const combined = [...matchedCustom, ...staticResults];
    // Deduplicate by ID
    const seen = new Set<number>();
    return combined.filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    }).slice(0, 50);
  }, [query, customProducts]);

  // Global keyboard shortcuts '/' and 'Cmd/Ctrl+K'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) &&
        document.activeElement !== inputRef.current
      ) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Keyboard navigation within the dropdown
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => {
        const next = prev < results.length - 1 ? prev + 1 : 0;
        scrollIndexIntoView(next);
        return next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => {
        const next = prev > 0 ? prev - 1 : results.length - 1;
        scrollIndexIntoView(next);
        return next;
      });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        handleItemClick(results[selectedIndex]);
      } else if (results.length > 0) {
        handleItemClick(results[0]);
      }
    }
  };

  const scrollIndexIntoView = (index: number) => {
    if (!dropdownRef.current) return;
    const items = dropdownRef.current.querySelectorAll('[data-search-item]');
    if (items[index]) {
      (items[index] as HTMLElement).scrollIntoView({ block: 'nearest' });
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleItemClick = (product: Product) => {
    onSelectProduct(product);
    setQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  return (
    <div className="relative w-full z-30" ref={searchRef}>
      <div className="flex items-center w-full h-11 sm:h-12 px-3.5 sm:px-4 bg-[#10182A] border border-[#26344A] rounded-xl focus-within:border-[#00C8FF] focus-within:ring-2 focus-within:ring-[#00C8FF]/20 shadow-sm transition-all duration-200">
        <Search className="w-4 h-4 text-[#94A3B8] shrink-0 mr-2.5" />
        <input
          ref={inputRef}
          type="text"
          className="w-full bg-transparent px-1 text-xs sm:text-sm text-[#F1F5F9] placeholder-[#94A3B8]/60 outline-none font-medium"
          placeholder="Search products across MAK & BOSS by name, code or grade... (Press '/' to focus)"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(-1);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
          onKeyDown={handleInputKeyDown}
          id="product-universal-search"
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setIsOpen(false);
              setSelectedIndex(-1);
            }}
            className="p-1 text-[#94A3B8] hover:text-[#F1F5F9] rounded hover:bg-[#151F33] transition-colors cursor-pointer ml-1.5 shrink-0"
            title="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <div className="hidden sm:flex items-center gap-1 shrink-0 ml-1.5">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-medium bg-[#151F33] text-[#94A3B8] border border-[#26344A] rounded shadow-xs">
              /
            </kbd>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-medium bg-[#151F33] text-[#94A3B8] border border-[#26344A] rounded shadow-xs">
              ⌘K
            </kbd>
          </div>
        )}
      </div>

      {isOpen && query.trim() && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1.5 max-h-[55vh] sm:max-h-96 overflow-y-auto bg-[#10182A]/98 backdrop-blur-xl border border-[#26344A] rounded-xl shadow-2xl z-50 divide-y divide-[#26344A]/60 custom-scrollbar animate-in fade-in duration-100"
        >
          {results.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#94A3B8] flex flex-col items-center gap-2">
              <AlertCircle className="w-5 h-5 text-[#94A3B8]/70" />
              <span>
                No products found matching &ldquo;<span className="text-[#F1F5F9] font-medium">{query}</span>&rdquo;
              </span>
              <span className="text-[11px] text-[#94A3B8]/60">
                Try searching by engine oil grade, bottle size, or product code
              </span>
            </div>
          ) : (
            <>
              <div className="px-3.5 py-2 text-[10px] uppercase font-bold tracking-wider text-[#94A3B8]/80 bg-[#080D19]/60 flex items-center justify-between">
                <span>Matching Products ({results.length})</span>
                <span className="text-[10px] lowercase font-normal flex items-center gap-1 text-[#94A3B8]">
                  <span>use</span>
                  <kbd className="px-1 bg-[#151F33] border border-[#26344A] rounded">↑↓</kbd>
                  <span>to navigate,</span>
                  <kbd className="px-1 bg-[#151F33] border border-[#26344A] rounded">enter</kbd>
                  <span>to select</span>
                </span>
              </div>
              {results.map((product, idx) => {
                const isMak = product.company === 'MAK';
                const willSwitchCompany = product.company !== currentCompany;
                const isHighlighted = idx === selectedIndex;

                return (
                  <div
                    key={product.id}
                    data-search-item
                    className={`flex items-center justify-between px-3.5 py-2.5 sm:py-3 transition-colors cursor-pointer gap-3 border-l-2 ${
                      isHighlighted
                        ? 'bg-[#151F33] border-[#00C8FF]'
                        : 'border-transparent hover:bg-[#151F33]/60'
                    }`}
                    onClick={() => handleItemClick(product)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider shrink-0 ${
                          isMak
                            ? 'bg-[#F59E0B]/15 text-[#FDE68A] border border-[#F59E0B]/30'
                            : 'bg-[#3B82F6]/15 text-[#BAE6FD] border border-[#3B82F6]/30'
                        }`}
                      >
                        {isMak ? <Flame className="w-2.5 h-2.5 text-[#F59E0B]" /> : <Shield className="w-2.5 h-2.5 text-[#3B82F6]" />}
                        {product.company}
                      </span>

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs sm:text-sm font-semibold text-[#F1F5F9] truncate">
                            {product.name}
                          </span>
                          {product.isCustom && (
                            <span className="shrink-0 px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                              Custom
                            </span>
                          )}
                        </div>
                        {product.productCode && (
                          <span className="text-[11px] text-[#94A3B8] font-mono">
                            Code: {product.productCode}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      {willSwitchCompany ? (
                        <span
                          className={`text-xs font-semibold flex items-center gap-1 ${
                            isMak ? 'text-[#F59E0B]' : 'text-[#3B82F6]'
                          }`}
                        >
                          Auto-selects {product.company} <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <span className="text-xs text-[#94A3B8] font-medium flex items-center gap-1 hover:text-[#F1F5F9]">
                          + Add to Bill {isHighlighted ? <CornerDownLeft className="w-3 h-3 text-[#00C8FF]" /> : <ArrowRight className="w-3.5 h-3.5" />}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
};
