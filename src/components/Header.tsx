'use client';

import React, { useEffect, useState } from 'react';
import {
  RotateCcw,
  Clock,
  ShieldCheck,
  Receipt,
  Flame,
  Shield,
  ShoppingBag,
  Calendar,
  Sparkles,
  HandCoins,
  ChevronRight,
} from 'lucide-react';
import { Company } from '@/types/billing';
import { formatCurrency } from '@/utils/numberToWords';

interface HeaderProps {
  onReset: () => void;
  itemCount: number;
  onOpenAdmin: () => void;
  onOpenCreditCollection?: () => void;
  currentCompany?: Company;
  onCompanyChange?: (company: Company) => void;
  invoiceNumber?: string;
  grandTotal?: number;
  onViewBillMobile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onReset,
  itemCount,
  onOpenAdmin,
  onOpenCreditCollection,
  currentCompany,
  onCompanyChange,
  invoiceNumber,
  grandTotal = 0,
  onViewBillMobile,
}) => {
  const [dateStr, setDateStr] = useState<string>('');
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setDateStr(
        now.toLocaleDateString('en-IN', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      );
      setTimeStr(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-1 sm:top-3 z-40 w-full rounded-xl backdrop-blur-xl bg-[#10182A]/95 border border-[#26344A] shadow-xl shadow-black/40 transition-all overflow-hidden">
      {/* Sleek multi-color hairline accent along the top border */}
      <div className="h-[2px] w-full bg-gradient-to-r from-[#F59E0B] via-[#00C8FF] to-[#3B82F6] opacity-80" />

      {/* Main Bar */}
      <div className="flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-5 lg:px-6 py-2 sm:py-3">
        {/* ==================================================================== */}
        {/* LEFT: Logo & Brand Meta                                              */}
        {/* ==================================================================== */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          {/* Logo Badge */}
          <div className="relative group shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center bg-[#151F33] border border-[#26344A] text-[#00C8FF] shadow-inner transition-transform group-hover:scale-105">
              <Receipt className="w-4 h-4 text-[#00C8FF] drop-shadow-[0_0_8px_rgba(0,200,255,0.4)]" />
            </div>
            {/* Online Live Indicator Dot */}
            <span
              className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5"
              title="POS Terminal Online & Synced"
            >
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#10B981] border-2 border-[#10182A]" />
            </span>
          </div>

          {/* Title & Brand Meta */}
          <div className="min-w-0 flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-black tracking-tight text-[#F1F5F9] whitespace-nowrap">
                  BILLER
                </span>
                <span className="px-1.5 py-0.5 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider rounded bg-gradient-to-r from-[#00C8FF] to-[#3B82F6] text-[#080D19] shadow-xs">
                  PRO
                </span>
              </div>

              {/* Division Switcher Pills on Header (Tablet & Desktop) */}
              {currentCompany && onCompanyChange && (
                <div className="hidden sm:inline-flex items-center p-0.5 rounded-lg bg-[#080D19] border border-[#26344A]">
                  <button
                    type="button"
                    onClick={() => onCompanyChange('MAK')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                      currentCompany === 'MAK'
                        ? 'bg-[#F59E0B]/20 text-[#FDE68A] border border-[#F59E0B]/40 shadow-xs'
                        : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#151F33]'
                    }`}
                    title="Switch to MAK Lubricants & Honda Parts"
                  >
                    <Flame className="w-3 h-3 text-[#F59E0B] shrink-0" />
                    <span>MAK &amp; Honda</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onCompanyChange('BOSS')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                      currentCompany === 'BOSS'
                        ? 'bg-[#3B82F6]/20 text-[#BAE6FD] border border-[#3B82F6]/40 shadow-xs'
                        : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#151F33]'
                    }`}
                    title="Switch to BOSS Automotive Spares"
                  >
                    <Shield className="w-3 h-3 text-[#3B82F6] shrink-0" />
                    <span>BOSS Auto</span>
                  </button>
                </div>
              )}
            </div>

            {/* Subtitle / Active Status (Desktop / Tablet) */}
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-[#94A3B8] truncate">
              {currentCompany ? (
                <span className="flex items-center gap-1">
                  <span>Division:</span>
                  <span
                    className={`font-semibold ${
                      currentCompany === 'MAK' ? 'text-[#F59E0B]' : 'text-[#3B82F6]'
                    }`}
                  >
                    {currentCompany === 'MAK' ? 'MAK & Honda' : 'BOSS Auto'}
                  </span>
                </span>
              ) : (
                <span className="font-medium text-[#F1F5F9]">Retail POS Counter</span>
              )}
              <span className="text-[#26344A]">•</span>
              <span className="font-mono text-[10px] text-[#94A3B8]">
                {invoiceNumber ? `#${invoiceNumber}` : 'Ready for Invoicing'}
              </span>
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* CENTER: Active Cart Quick Tracker or Station Status Banner (Desktop) */}
        {/* ==================================================================== */}
        {itemCount > 0 ? (
          <button
            type="button"
            onClick={onViewBillMobile}
            className="hidden lg:flex items-center gap-3 px-3.5 py-1.5 rounded-lg bg-[#080D19]/80 border border-[#26344A] hover:border-[#10B981]/50 hover:bg-[#080D19] transition-all cursor-pointer group shadow-inner"
            title="Active bill total. Click to jump to bill checkout"
          >
            <div className="flex items-center gap-1.5">
              <span className="flex h-2 w-2 rounded-full bg-[#10B981] animate-pulse" />
              <ShoppingBag className="w-3.5 h-3.5 text-[#10B981]" />
              <span className="text-xs font-semibold text-[#F1F5F9] group-hover:text-white transition-colors">
                {itemCount} {itemCount === 1 ? 'Item' : 'Items'}
              </span>
            </div>
            <span className="w-px h-3.5 bg-[#26344A]" />
            <span className="font-bold text-xs sm:text-sm text-[#00C8FF] font-mono tracking-tight group-hover:scale-105 transition-transform">
              {formatCurrency(grandTotal)}
            </span>
          </button>
        ) : (
          <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-full bg-[#080D19]/70 border border-[#26344A] text-[11px] text-[#94A3B8] font-medium">
            <Sparkles className="w-3 h-3 text-[#00C8FF]" />
            <span>
              POS Terminal Ready • Press{' '}
              <kbd className="px-1.5 py-0.5 bg-[#151F33] rounded text-[10px] font-mono text-[#F1F5F9] border border-[#26344A]">
                /
              </kbd>{' '}
              to search products
            </span>
          </div>
        )}

        {/* ==================================================================== */}
        {/* RIGHT: Live Clock Widget, Clear Bill & Action Buttons                */}
        {/* ==================================================================== */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Station Date & Clock Widget (Tablet & Desktop) */}
          <div className="hidden sm:flex items-center gap-2.5 h-8 sm:h-8.5 px-3 rounded-lg bg-[#080D19] border border-[#26344A] text-[#94A3B8] shadow-xs">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#94A3B8]">
              <Calendar className="w-3 h-3 text-[#94A3B8] shrink-0" />
              <span>{dateStr || 'Today'}</span>
            </div>
            <span className="w-px h-3 bg-[#26344A]" />
            <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-[#00C8FF]">
              <Clock className="w-3 h-3 text-[#00C8FF] shrink-0" />
              <span className="tabular-nums">{timeStr || 'Loading...'}</span>
            </div>
          </div>

          {/* Quick Clear Bill Button (Visible when cart has items) */}
          {itemCount > 0 && (
            <button
              type="button"
              onClick={onReset}
              className="flex items-center justify-center gap-1 h-8 sm:h-8.5 px-2 sm:px-3 rounded-lg text-xs font-semibold text-rose-300 bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 active:scale-95 transition-all cursor-pointer shadow-xs"
              title="Clear all products from current bill"
              aria-label="Clear all products from current bill"
            >
              <RotateCcw className="w-3.5 h-3.5 sm:w-3 sm:h-3 text-rose-400 shrink-0" />
              <span className="hidden sm:inline">Clear Bill</span>
            </button>
          )}

          {/* Credit / Due Collection Quick Button */}
          {onOpenCreditCollection && (
            <button
              type="button"
              onClick={onOpenCreditCollection}
              className="flex items-center gap-1.5 h-8 sm:h-8.5 px-2.5 sm:px-3 rounded-lg text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 active:scale-95 border border-amber-500/30 transition-all cursor-pointer shadow-xs group"
              title="Collect payment for pending customer credit / due"
            >
              <HandCoins className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform shrink-0" />
              <span className="hidden sm:inline">Credit Collection</span>
              <span className="sm:hidden font-bold">Due</span>
            </button>
          )}

          {/* Admin Management Button */}
          <button
            type="button"
            onClick={onOpenAdmin}
            className="flex items-center gap-1.5 h-8 sm:h-8.5 px-2.5 sm:px-3 rounded-lg text-xs font-semibold text-[#F1F5F9] bg-[#151F33] hover:bg-[#1A263D] active:scale-95 border border-[#26344A] hover:border-[#00C8FF]/50 transition-all cursor-pointer shadow-xs group"
            title="Open Admin Portal (Manage Products & Cloud Sales History)"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#00C8FF] group-hover:scale-110 transition-transform shrink-0" />
            <span className="font-bold">Admin</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] ml-0.5" />
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* MOBILE CONTROL STRIP (Visible only on phone screens < sm)             */}
      {/* ==================================================================== */}
      <div className="sm:hidden border-t border-[#26344A]/70 px-3 py-1.5 bg-[#0C1322]/90 flex items-center justify-between gap-2">
        {/* Division Switcher Segmented Pills */}
        {currentCompany && onCompanyChange && (
          <div className="flex items-center p-0.5 rounded-lg bg-[#080D19] border border-[#26344A] shrink-0">
            <button
              type="button"
              onClick={() => onCompanyChange('MAK')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                currentCompany === 'MAK'
                  ? 'bg-[#F59E0B]/25 text-[#FDE68A] border border-[#F59E0B]/50 shadow-xs'
                  : 'text-[#94A3B8] hover:text-[#F1F5F9]'
              }`}
            >
              <Flame className="w-3 h-3 text-[#F59E0B] shrink-0" />
              <span>MAK &amp; Honda</span>
            </button>

            <button
              type="button"
              onClick={() => onCompanyChange('BOSS')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                currentCompany === 'BOSS'
                  ? 'bg-[#3B82F6]/25 text-[#BAE6FD] border border-[#3B82F6]/50 shadow-xs'
                  : 'text-[#94A3B8] hover:text-[#F1F5F9]'
              }`}
            >
              <Shield className="w-3 h-3 text-[#3B82F6] shrink-0" />
              <span>BOSS Auto</span>
            </button>
          </div>
        )}

        {/* Mobile Right: Cart Quick Jump or Active Status */}
        {itemCount > 0 ? (
          <button
            type="button"
            onClick={onViewBillMobile}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#10B981]/15 border border-[#10B981]/40 text-[#10B981] hover:bg-[#10B981]/25 active:scale-95 transition-all cursor-pointer min-w-0"
            title="View Active Bill"
          >
            <ShoppingBag className="w-3 h-3 shrink-0" />
            <span className="text-[11px] font-bold whitespace-nowrap">
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </span>
            <span className="w-px h-2.5 bg-[#10B981]/40" />
            <span className="text-[11px] font-bold font-mono text-[#00C8FF] truncate">
              {formatCurrency(grandTotal)}
            </span>
            <ChevronRight className="w-3 h-3 shrink-0 text-[#10B981]" />
          </button>
        ) : (
          <div className="flex items-center gap-1.5 text-[10px] text-[#94A3B8] font-mono truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
            <span className="truncate">
              {invoiceNumber ? `#${invoiceNumber}` : 'POS Terminal Ready'}
            </span>
          </div>
        )}
      </div>
    </header>
  );
};
