'use client';

import React, { useState, useMemo } from 'react';
import { Company, Product } from '@/types/billing';
import { getCompanyProducts } from '@/data/products';
import { Flame, Shield, Search, CheckSquare, Square, Check, Layers, Filter } from 'lucide-react';

interface ProductBrowserProps {
  currentCompany: Company;
  onCompanyChange: (comp: Company) => void;
  selectedProductIds: Set<number>;
  onToggleProduct: (product: Product) => void;
  onSelectMultiple: (products: Product[]) => void;
  onDeselectMultiple: (productIds: number[]) => void;
  customProducts?: Product[];
}

export const ProductBrowser: React.FC<ProductBrowserProps> = ({
  currentCompany,
  onCompanyChange,
  selectedProductIds,
  onToggleProduct,
  onSelectMultiple,
  onDeselectMultiple,
  customProducts = [],
}) => {
  // Filter search query within active company
  const [filterQuery, setFilterQuery] = useState('');

  // Products of MAK (MAK & Honda) and BOSS, combined with custom products
  const makList = useMemo(() => {
    const custom = customProducts.filter((p) => p.company === 'MAK');
    return [...custom, ...getCompanyProducts('MAK')];
  }, [customProducts]);

  const bossList = useMemo(() => {
    const custom = customProducts.filter((p) => p.company === 'BOSS');
    return [...custom, ...getCompanyProducts('BOSS')];
  }, [customProducts]);

  const activeList = currentCompany === 'MAK' ? makList : bossList;

  // Count how many from each company are in the active bill
  const makSelectedCount = useMemo(() => {
    return makList.filter((p) => selectedProductIds.has(p.id)).length;
  }, [makList, selectedProductIds]);

  const bossSelectedCount = useMemo(() => {
    return bossList.filter((p) => selectedProductIds.has(p.id)).length;
  }, [bossList, selectedProductIds]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    if (!filterQuery.trim()) return activeList;
    const q = filterQuery.toLowerCase().trim();
    return activeList.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.productCode && p.productCode.toLowerCase().includes(q))
    );
  }, [activeList, filterQuery]);

  // Check if all filtered are selected
  const allFilteredSelected =
    filteredProducts.length > 0 &&
    filteredProducts.every((p) => selectedProductIds.has(p.id));

  const handleToggleAllFiltered = () => {
    if (allFilteredSelected) {
      onDeselectMultiple(filteredProducts.map((p) => p.id));
    } else {
      const toAdd = filteredProducts.filter((p) => !selectedProductIds.has(p.id));
      onSelectMultiple(toAdd);
    }
  };

  return (
    <div className="rounded-xl backdrop-blur-xl bg-[#10182A] border border-[#26344A] p-3.5 sm:p-5 shadow-lg flex flex-col gap-3.5 sm:gap-4">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#26344A]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#151F33] text-[#00C8FF] border border-[#26344A] shadow-xs">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#F1F5F9] tracking-tight">
              Product Catalog
            </h2>
            <p className="text-[11px] text-[#94A3B8]">
              Browse &amp; multi-select lubricants &amp; parts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-right">
          <span className="text-[11px] text-[#94A3B8]">In Bill:</span>
          <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-[#151F33] text-[#00C8FF] border border-[#26344A]">
            {selectedProductIds.size}
          </span>
        </div>
      </div>

      {/* Company Switcher Tabs */}
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#080D19] rounded-xl border border-[#26344A] shadow-inner">
        {/* MAK & Honda Tab */}
        <button
          type="button"
          onClick={() => onCompanyChange('MAK')}
          className={`flex items-center justify-center gap-1.5 sm:gap-2 min-h-[44px] py-2 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            currentCompany === 'MAK'
              ? 'bg-[#F59E0B] text-[#080D19] shadow-md shadow-[#F59E0B]/20 font-extrabold'
              : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#151F33]/60'
          }`}
        >
          <Flame
            className={`w-3.5 h-3.5 shrink-0 ${
              currentCompany === 'MAK' ? 'text-[#080D19]' : 'text-[#F59E0B]'
            }`}
          />
          <span className="whitespace-nowrap">MAK &amp; Honda</span>
          <span
            className={`text-[10px] sm:text-xs font-semibold px-1.5 py-0.2 rounded-full ${
              currentCompany === 'MAK'
                ? 'bg-[#080D19]/30 text-[#080D19]'
                : 'bg-[#151F33] text-[#94A3B8]'
            }`}
          >
            {makList.length}
          </span>
          {makSelectedCount > 0 && (
            <span
              className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                currentCompany === 'MAK'
                  ? 'bg-[#080D19] text-[#F59E0B]'
                  : 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40'
              }`}
            >
              {makSelectedCount} in bill
            </span>
          )}
        </button>

        {/* BOSS Auto Tab */}
        <button
          type="button"
          onClick={() => onCompanyChange('BOSS')}
          className={`flex items-center justify-center gap-1.5 sm:gap-2 min-h-[44px] py-2 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            currentCompany === 'BOSS'
              ? 'bg-[#3B82F6] text-[#080D19] shadow-md shadow-[#3B82F6]/20 font-extrabold'
              : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#151F33]/60'
          }`}
        >
          <Shield
            className={`w-3.5 h-3.5 shrink-0 ${
              currentCompany === 'BOSS' ? 'text-[#080D19]' : 'text-[#3B82F6]'
            }`}
          />
          <span className="whitespace-nowrap">BOSS Auto</span>
          <span
            className={`text-[10px] sm:text-xs font-semibold px-1.5 py-0.2 rounded-full ${
              currentCompany === 'BOSS'
                ? 'bg-[#080D19]/30 text-[#080D19]'
                : 'bg-[#151F33] text-[#94A3B8]'
            }`}
          >
            {bossList.length}
          </span>
          {bossSelectedCount > 0 && (
            <span
              className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                currentCompany === 'BOSS'
                  ? 'bg-[#080D19] text-[#3B82F6]'
                  : 'bg-[#3B82F6]/20 text-[#3B82F6] border border-[#3B82F6]/40'
              }`}
            >
              {bossSelectedCount} in bill
            </span>
          )}
        </button>
      </div>

      {/* Filter and Select All Toolbar */}
      <div className="flex items-center gap-2">
        <div className="flex items-center flex-1 h-10 px-3.5 bg-[#080D19] border border-[#26344A] rounded-lg focus-within:border-[#00C8FF] focus-within:ring-1 focus-within:ring-[#00C8FF]/20 transition-all">
          <Search className="w-3.5 h-3.5 text-[#94A3B8] mr-2 shrink-0" />
          <input
            type="text"
            className="w-full bg-transparent px-1 text-xs text-[#F1F5F9] placeholder-[#94A3B8]/60 outline-none font-medium"
            placeholder={`Filter ${activeList.length} ${currentCompany === 'MAK' ? 'MAK & Honda' : 'BOSS'} items...`}
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
          />
        </div>

        <button
          type="button"
          onClick={handleToggleAllFiltered}
          className="flex items-center gap-1.5 h-10 px-3 rounded-lg text-xs font-semibold text-[#F1F5F9] bg-[#151F33] hover:bg-[#1A263D] border border-[#26344A] transition-all cursor-pointer whitespace-nowrap shadow-xs shrink-0 active:scale-95"
        >
          {allFilteredSelected ? (
            <>
              <Square className="w-3.5 h-3.5 text-[#94A3B8]" />
              <span>Deselect All</span>
            </>
          ) : (
            <>
              <CheckSquare className="w-3.5 h-3.5 text-[#00C8FF]" />
              <span>Select All</span>
            </>
          )}
        </button>
      </div>

      {/* Multi-Product Checklist */}
      <div className="max-h-[420px] sm:max-h-[490px] lg:max-h-[580px] overflow-y-auto rounded-xl border border-[#26344A] bg-[#080D19]/70 divide-y divide-[#26344A]/50 custom-scrollbar">
        {filteredProducts.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#94A3B8] flex flex-col items-center gap-2">
            <Filter className="w-5 h-5 text-[#94A3B8]/60" />
            <span>No products match &ldquo;{filterQuery}&rdquo; in {currentCompany === 'MAK' ? 'MAK & Honda' : 'BOSS Auto'}.</span>
          </div>
        ) : (
          filteredProducts.map((product) => {
            const isSelected = selectedProductIds.has(product.id);
            const isMak = product.company === 'MAK';

            return (
              <div
                key={product.id}
                onClick={() => onToggleProduct(product)}
                className={`flex items-center justify-between px-3 py-2.5 sm:py-3 transition-colors cursor-pointer select-none min-h-[46px] ${
                  isSelected
                    ? isMak
                      ? 'bg-[#F59E0B]/10 hover:bg-[#F59E0B]/15'
                      : 'bg-[#3B82F6]/10 hover:bg-[#3B82F6]/15'
                    : 'hover:bg-[#151F33]/60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  {/* Custom Checkbox */}
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center shrink-0 transition-all ${
                      isSelected
                        ? isMak
                          ? 'bg-[#F59E0B] text-[#080D19]'
                          : 'bg-[#3B82F6] text-[#080D19]'
                        : 'border border-[#26344A] bg-[#151F33] text-transparent'
                    }`}
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>

                  {/* Product Details */}
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className={`text-xs sm:text-sm truncate leading-snug ${
                          isSelected ? 'font-bold text-[#F1F5F9]' : 'font-medium text-[#F1F5F9]/90'
                        }`}
                      >
                        {product.name}
                      </span>
                      {product.isCustom && (
                        <span className="shrink-0 px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                          Custom
                        </span>
                      )}
                    </div>
                    {product.productCode && (
                      <span className="text-[11px] text-[#94A3B8] font-mono mt-0.5">
                        Code: #{product.productCode}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Status Badge */}
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-md shrink-0 transition-all ${
                    isSelected
                      ? isMak
                        ? 'bg-[#F59E0B]/20 text-[#FDE68A] border border-[#F59E0B]/40'
                        : 'bg-[#3B82F6]/20 text-[#BAE6FD] border border-[#3B82F6]/40'
                      : 'text-[#94A3B8] bg-[#151F33] border border-[#26344A] hover:text-[#F1F5F9]'
                  }`}
                >
                  {isSelected ? 'In Bill ✓' : '+ Add'}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-[11px] text-[#94A3B8] pt-1">
        <span>💡 Switch divisions freely; selected products remain in active bill.</span>
        <span className="font-mono font-semibold text-[#F1F5F9]">{filteredProducts.length} items</span>
      </div>
    </div>
  );
};
