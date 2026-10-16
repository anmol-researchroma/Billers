'use client';

import React, { useState } from 'react';
import { InvoiceItem, PaymentMode } from '@/types/billing';
import { 
  Trash2, 
  CreditCard, 
  Banknote, 
  QrCode, 
  FileText, 
  Camera, 
  Printer, 
  User, 
  Phone, 
  ShoppingBag,
  Receipt,
  Flame,
  Shield,
  Plus,
  Minus,
  UserCheck,
  ArrowRightLeft,
  HandCoins,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { formatCurrency, numberToIndianWords } from '@/utils/numberToWords';

interface InvoiceCartProps {
  items: InvoiceItem[];
  customerName: string;
  customerPhone: string;
  sellerName: string;
  paymentMode: PaymentMode;
  invoiceNumber: string;
  onUpdateCustomerName: (name: string) => void;
  onUpdateCustomerPhone: (phone: string) => void;
  onUpdateSellerName: (seller: string) => void;
  onUpdatePaymentMode: (mode: PaymentMode) => void;
  onUpdateItemRate: (id: string, rateVal: string) => void;
  onUpdateItemQty: (id: string, newQty: number) => void;
  onUpdateItemDiscount: (id: string, discountVal: string, discountType?: 'percentage' | 'fixed') => void;
  onRemoveItem: (id: string) => void;
  onBatchApplyPrice?: (priceStr: string, onlyEmpty: boolean) => void;
  onBatchApplyDiscount?: (discountStr: string, discountType: 'percentage' | 'fixed') => void;
  onSubmitAndDownload: (cashGiven?: number, upiGiven?: number) => void;
  onPrintOnly: () => void;
}

export const InvoiceCart: React.FC<InvoiceCartProps> = ({
  items,
  customerName,
  customerPhone,
  sellerName,
  paymentMode,
  invoiceNumber,
  onUpdateCustomerName,
  onUpdateCustomerPhone,
  onUpdateSellerName,
  onUpdatePaymentMode,
  onUpdateItemRate,
  onUpdateItemQty,
  onUpdateItemDiscount,
  onRemoveItem,
  onSubmitAndDownload,
  onPrintOnly,
}) => {
  // Cash & UPI received state for split/partial payments
  const [cashReceived, setCashReceived] = useState<string>('');
  const [upiReceived, setUpiReceived] = useState<string>('');

  // Calculations (preserved exact business formulas)
  const subtotal = items.reduce((acc, it) => acc + it.grossAmount, 0);
  const totalDiscount = items.reduce((acc, it) => acc + it.discountAmount, 0);
  const grandTotal = items.reduce((acc, it) => acc + it.totalAmount, 0);

  // Numeric values for payments
  const cashNum = parseFloat(cashReceived) || 0;
  const upiNum = parseFloat(upiReceived) || 0;
  
  // Change due if cash was tendered above total
  const changeDue = paymentMode === 'CASH' && cashNum > grandTotal
    ? cashNum - grandTotal
    : (paymentMode === 'SPLIT' || paymentMode === 'CASH_UPI_CREDIT') && (cashNum + upiNum) > grandTotal
    ? (cashNum + upiNum) - grandTotal
    : 0;

  // Credit / Due amount for CASH_UPI_CREDIT or DUE
  const creditDue = (paymentMode === 'CASH_UPI_CREDIT' || paymentMode === 'DUE')
    ? paymentMode === 'DUE'
      ? grandTotal
      : Math.max(0, grandTotal - (cashNum + upiNum))
    : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    const unpriced = items.filter((it) => it.rate <= 0);
    if (unpriced.length > 0) {
      const confirmProceed = confirm(
        `${unpriced.length} product(s) have ₹0 rate entered. Do you want to submit anyway?`
      );
      if (!confirmProceed) return;
    }

    const actualCash = paymentMode === 'CASH'
      ? (cashNum > 0 ? cashNum : grandTotal)
      : (paymentMode === 'SPLIT' || paymentMode === 'CASH_UPI_CREDIT')
      ? (cashNum > 0 ? cashNum : 0)
      : undefined;

    const actualUpi = paymentMode === 'UPI'
      ? grandTotal
      : paymentMode === 'SPLIT'
      ? (upiNum > 0 ? upiNum : Math.max(0, grandTotal - (cashNum > 0 ? cashNum : 0)))
      : paymentMode === 'CASH_UPI_CREDIT'
      ? (upiNum > 0 ? upiNum : 0)
      : undefined;

    onSubmitAndDownload(actualCash, actualUpi);
  };

  return (
    <div className="rounded-xl backdrop-blur-xl bg-[#10182A] border border-[#26344A] p-3.5 sm:p-5 shadow-lg flex flex-col gap-3.5 sm:gap-4.5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#26344A]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#151F33] text-[#00C8FF] border border-[#26344A] shadow-xs">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#F1F5F9] tracking-tight">
              Active Bill / Invoice
            </h2>
            <p className="text-[11px] text-[#94A3B8]">
              {items.length} product{items.length === 1 ? '' : 's'} in current invoice
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-[#00C8FF] bg-[#080D19] px-2.5 py-1 rounded-md border border-[#26344A]">
            #{invoiceNumber}
          </span>
        </div>
      </div>

      {/* Seller, Customer & Phone Details */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
        {/* 1. Seller Name */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1.5" htmlFor="seller-name-input">
            Seller Name
          </label>
          <div className="flex items-center h-10 px-3 bg-[#080D19] border border-[#26344A] rounded-lg focus-within:border-[#00C8FF] focus-within:ring-1 focus-within:ring-[#00C8FF]/20 transition-all">
            <UserCheck className="w-3.5 h-3.5 text-[#00C8FF] mr-2 shrink-0" />
            <input
              type="text"
              id="seller-name-input"
              className="w-full bg-transparent px-1 text-xs sm:text-sm text-[#F1F5F9] placeholder-[#94A3B8]/50 outline-none font-medium"
              placeholder="e.g. Anand, Staff 1"
              value={sellerName}
              onChange={(e) => onUpdateSellerName(e.target.value)}
            />
          </div>
        </div>

        {/* 2. Customer Name */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1.5" htmlFor="cust-name-input">
            Customer Name
          </label>
          <div className="flex items-center h-10 px-3 bg-[#080D19] border border-[#26344A] rounded-lg focus-within:border-[#00C8FF] focus-within:ring-1 focus-within:ring-[#00C8FF]/20 transition-all">
            <User className="w-3.5 h-3.5 text-[#94A3B8] mr-2 shrink-0" />
            <input
              type="text"
              id="cust-name-input"
              className="w-full bg-transparent px-1 text-xs sm:text-sm text-[#F1F5F9] placeholder-[#94A3B8]/50 outline-none font-medium"
              placeholder="e.g. Ramesh Kumar"
              value={customerName}
              onChange={(e) => onUpdateCustomerName(e.target.value)}
            />
          </div>
        </div>

        {/* 3. Customer Phone */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1.5" htmlFor="cust-phone-input">
            Phone / Contact
          </label>
          <div className="flex items-center h-10 px-3 bg-[#080D19] border border-[#26344A] rounded-lg focus-within:border-[#00C8FF] focus-within:ring-1 focus-within:ring-[#00C8FF]/20 transition-all">
            <Phone className="w-3.5 h-3.5 text-[#94A3B8] mr-2 shrink-0" />
            <input
              type="tel"
              id="cust-phone-input"
              className="w-full bg-transparent px-1 text-xs sm:text-sm text-[#F1F5F9] placeholder-[#94A3B8]/50 outline-none font-medium"
              placeholder="e.g. 98765 43210"
              value={customerPhone}
              onChange={(e) => onUpdateCustomerPhone(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Cart Items Section */}
      {items.length === 0 ? (
        <div className="p-8 sm:p-12 text-center rounded-xl border border-dashed border-[#26344A] bg-[#080D19]/50 flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[#151F33] border border-[#26344A] text-[#00C8FF]/70 shadow-sm">
            <Receipt className="w-6 h-6 stroke-[1.5]" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-[#F1F5F9]">
              Your Active Bill is Empty
            </h3>
            <p className="text-xs text-[#94A3B8] max-w-sm mt-1">
              Select products from the catalog on the left or press <kbd className="px-1.5 py-0.5 bg-[#151F33] border border-[#26344A] rounded text-[10px] text-[#00C8FF] font-mono">/</kbd> to search items.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* ========================================================
              MOBILE VIEW: TOUCH-FRIENDLY ITEM CARDS
              ======================================================== */}
          <div className="flex flex-col gap-2.5 md:hidden max-h-[440px] overflow-y-auto custom-scrollbar pr-0.5">
            {items.map((item, idx) => {
              const isMak = item.company === 'MAK';
              return (
                <div
                  key={item.id}
                  className="p-3 sm:p-3.5 rounded-xl border border-[#26344A] bg-[#080D19] flex flex-col gap-2.5 shadow-xs"
                >
                  {/* Card Header: Brand, Name, Delete */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-start gap-2 min-w-0">
                      <span className="text-xs font-mono font-bold text-[#94A3B8] mt-0.5">
                        {idx + 1}.
                      </span>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider ${
                              isMak
                                ? 'bg-[#F59E0B]/15 text-[#FDE68A] border border-[#F59E0B]/30'
                                : 'bg-[#3B82F6]/15 text-[#BAE6FD] border border-[#3B82F6]/30'
                            }`}
                          >
                            {isMak ? <Flame className="w-2.5 h-2.5 text-[#F59E0B]" /> : <Shield className="w-2.5 h-2.5 text-[#3B82F6]" />}
                            {item.company}
                          </span>
                          {item.productCode && (
                            <span className="text-[10px] font-mono text-[#94A3B8]">
                              #{item.productCode}
                            </span>
                          )}
                        </div>
                        <span className="text-xs sm:text-sm font-bold text-[#F1F5F9] leading-snug">
                          {item.name}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.id)}
                      className="p-1.5 text-[#94A3B8] hover:text-[#EF4444] active:bg-[#EF4444]/10 transition-colors cursor-pointer rounded-lg shrink-0 border border-[#26344A] bg-[#151F33]"
                      title="Remove product"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Card Controls: Clean Price Box & Quantity Stepper */}
                  <div className="grid grid-cols-2 gap-2 items-center">
                    <div>
                      <label className="block text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1">
                        Price (₹)
                      </label>
                      <div className="flex items-center h-10 bg-[#151F33] border border-[#26344A] rounded-lg px-3 focus-within:border-[#00C8FF] focus-within:ring-1 focus-within:ring-[#00C8FF]/20 transition-all shadow-xs">
                        <span className="text-[#94A3B8] font-bold text-xs mr-1.5 select-none">₹</span>
                        <input
                          type="number"
                          inputMode="decimal"
                          className="w-full bg-transparent px-1 text-sm font-bold text-[#F1F5F9] placeholder-[#94A3B8]/50 outline-none"
                          placeholder="0.00"
                          min="0"
                          step="any"
                          value={item.rateStr ?? (item.rate > 0 ? String(item.rate) : '')}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => onUpdateItemRate(item.id, e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-1 text-center">
                        Quantity
                      </label>
                      <div className="flex items-center h-10 bg-[#151F33] border border-[#26344A] rounded-lg overflow-hidden shadow-xs">
                        <button
                          type="button"
                          className="w-10 h-full flex items-center justify-center text-[#94A3B8] hover:text-white active:bg-[#26344A] transition-colors"
                          onClick={() => onUpdateItemQty(item.id, Math.max(1, item.qty - 1))}
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="flex-1 text-center font-bold text-xs sm:text-sm text-[#F1F5F9] font-mono">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          className="w-10 h-full flex items-center justify-center text-[#94A3B8] hover:text-white active:bg-[#26344A] transition-colors"
                          onClick={() => onUpdateItemQty(item.id, item.qty + 1)}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom: Discount & Line Total */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#26344A] gap-3">
                    {/* Optional Discount */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-[#94A3B8] uppercase">Disc:</span>
                      <div className="flex items-center h-8.5 w-28 bg-[#151F33] border border-[#26344A] rounded-lg overflow-hidden focus-within:border-[#00C8FF]">
                        <input
                          type="number"
                          inputMode="decimal"
                          className="w-full bg-transparent px-2.5 text-xs font-bold text-[#F1F5F9] outline-none"
                          placeholder="0"
                          value={item.discountStr ?? (item.discount > 0 ? String(item.discount) : '')}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => onUpdateItemDiscount(item.id, e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateItemDiscount(
                              item.id,
                              item.discountStr ?? (item.discount > 0 ? String(item.discount) : ''),
                              item.discountType === 'percentage' ? 'fixed' : 'percentage'
                            )
                          }
                          className="px-2 h-full bg-[#10182A] border-l border-[#26344A] text-[#94A3B8] text-xs font-bold hover:text-white"
                        >
                          {item.discountType === 'percentage' ? '%' : '₹'}
                        </button>
                      </div>
                    </div>

                    {/* Line Total */}
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[10px] text-[#94A3B8] font-medium">Total:</span>
                      <span className="font-mono font-bold text-[#00C8FF] text-sm sm:text-base">
                        {formatCurrency(item.totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ========================================================
              DESKTOP VIEW: CLEAN, SPACIOUS TABLE
              ======================================================== */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-[#26344A] bg-[#080D19]/80 max-h-[460px] lg:max-h-[540px] custom-scrollbar shadow-inner">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead className="bg-[#10182A] text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] sticky top-0 z-10 border-b border-[#26344A]">
                <tr>
                  <th className="px-3.5 py-3 min-w-[180px]">Product Description</th>
                  <th className="px-3.5 py-3 w-36">Unit Price (₹)</th>
                  <th className="px-3.5 py-3 w-28 text-center">Qty</th>
                  <th className="px-3.5 py-3 w-32">Discount</th>
                  <th className="px-3.5 py-3 w-32 text-right">Line Total</th>
                  <th className="px-3.5 py-3 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#26344A]/60">
                {items.map((item) => {
                  const isMak = item.company === 'MAK';
                  return (
                    <tr key={item.id} className="hover:bg-[#151F33]/50 transition-colors">
                      {/* Product Name */}
                      <td className="px-3.5 py-2.5 sm:py-3">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                              isMak
                                ? 'bg-[#F59E0B]/15 text-[#FDE68A] border border-[#F59E0B]/30'
                                : 'bg-[#3B82F6]/15 text-[#BAE6FD] border border-[#3B82F6]/30'
                            }`}
                          >
                            {isMak ? <Flame className="w-2.5 h-2.5 text-[#F59E0B]" /> : <Shield className="w-2.5 h-2.5 text-[#3B82F6]" />}
                            {item.company}
                          </span>
                          {item.productCode && (
                            <span className="text-[11px] text-[#94A3B8] font-mono">
                              #{item.productCode}
                            </span>
                          )}
                        </div>
                        <div className="font-bold text-[#F1F5F9] text-xs sm:text-sm leading-snug">
                          {item.name}
                        </div>
                      </td>

                      {/* Clean Price Input Group */}
                      <td className="px-3.5 py-2.5 sm:py-3">
                        <div className="flex items-center h-9.5 w-36 sm:w-38 bg-[#151F33] border border-[#26344A] rounded-lg px-3 focus-within:border-[#00C8FF] focus-within:ring-1 focus-within:ring-[#00C8FF]/20 transition-all shadow-xs">
                          <span className="text-[#94A3B8] font-bold text-xs mr-1.5 select-none">
                            ₹
                          </span>
                          <input
                            type="number"
                            inputMode="decimal"
                            className="w-full bg-transparent px-1 text-xs sm:text-sm font-bold text-[#F1F5F9] placeholder-[#94A3B8]/50 outline-none"
                            placeholder="0.00"
                            min="0"
                            step="any"
                            value={item.rateStr ?? (item.rate > 0 ? String(item.rate) : '')}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => onUpdateItemRate(item.id, e.target.value)}
                          />
                        </div>
                      </td>

                      {/* Quantity Stepper */}
                      <td className="px-3.5 py-2.5 sm:py-3 text-center">
                        <div className="inline-flex items-center h-9.5 border border-[#26344A] rounded-lg bg-[#151F33] overflow-hidden shadow-xs">
                          <button
                            type="button"
                            className="w-8 h-full flex items-center justify-center text-[#94A3B8] hover:text-white hover:bg-[#26344A] transition-colors cursor-pointer"
                            onClick={() => onUpdateItemQty(item.id, Math.max(1, item.qty - 1))}
                            title="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-8 text-center font-bold font-mono text-xs sm:text-sm text-[#F1F5F9]">
                            {item.qty}
                          </span>
                          <button
                            type="button"
                            className="w-8 h-full flex items-center justify-center text-[#94A3B8] hover:text-white hover:bg-[#26344A] transition-colors cursor-pointer"
                            onClick={() => onUpdateItemQty(item.id, item.qty + 1)}
                            title="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Discount */}
                      <td className="px-3.5 py-2.5 sm:py-3">
                        <div className="flex items-center h-9.5 w-32 sm:w-34 border border-[#26344A] rounded-lg bg-[#151F33] overflow-hidden focus-within:border-[#00C8FF] focus-within:ring-1 focus-within:ring-[#00C8FF]/20 shadow-xs">
                          <input
                            type="number"
                            inputMode="decimal"
                            className="w-full bg-transparent px-2.5 text-xs font-bold text-[#F1F5F9] outline-none"
                            placeholder="0"
                            min="0"
                            step="any"
                            value={item.discountStr ?? (item.discount > 0 ? String(item.discount) : '')}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => onUpdateItemDiscount(item.id, e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateItemDiscount(
                                item.id,
                                item.discountStr ?? (item.discount > 0 ? String(item.discount) : ''),
                                item.discountType === 'percentage' ? 'fixed' : 'percentage'
                              )
                            }
                            className="h-full px-2.5 bg-[#10182A] border-l border-[#26344A] text-[#94A3B8] hover:text-white hover:bg-[#26344A] transition-colors cursor-pointer flex items-center justify-center text-xs font-bold"
                            title="Toggle % or ₹"
                          >
                            {item.discountType === 'percentage' ? '%' : '₹'}
                          </button>
                        </div>
                      </td>

                      {/* Line Total */}
                      <td className="px-3.5 py-2.5 sm:py-3 text-right font-mono font-bold text-[#00C8FF] text-xs sm:text-sm whitespace-nowrap">
                        {formatCurrency(item.totalAmount)}
                      </td>

                      {/* Delete */}
                      <td className="px-3.5 py-2.5 sm:py-3 text-center">
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.id)}
                          className="p-1.5 text-[#94A3B8] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors cursor-pointer rounded"
                          title="Remove product from bill"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Payment Mode Selector */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
            Payment Mode
          </label>
          <span className="text-[10px] text-[#94A3B8]/80">
            {paymentMode === 'SPLIT' 
              ? 'Split: Cash + UPI' 
              : paymentMode === 'CASH_UPI_CREDIT'
              ? 'Multi-Tender: Cash + UPI + Credit'
              : paymentMode === 'DUE'
              ? '100% Credit / Udhar'
              : 'Select mode'}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5">
          {/* CASH */}
          <button
            type="button"
            onClick={() => onUpdatePaymentMode('CASH')}
            className={`flex flex-col items-center justify-center gap-1 min-h-[56px] p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              paymentMode === 'CASH'
                ? 'bg-[#10B981]/15 border-[#10B981] text-[#10B981] shadow-md shadow-[#10B981]/10 ring-1 ring-[#10B981]/30'
                : 'bg-[#080D19] border-[#26344A] text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#151F33]'
            }`}
          >
            <Banknote className="w-4 h-4" />
            <span>Cash</span>
          </button>

          {/* UPI */}
          <button
            type="button"
            onClick={() => onUpdatePaymentMode('UPI')}
            className={`flex flex-col items-center justify-center gap-1 min-h-[56px] p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              paymentMode === 'UPI'
                ? 'bg-[#00C8FF]/15 border-[#00C8FF] text-[#00C8FF] shadow-md shadow-[#00C8FF]/10 ring-1 ring-[#00C8FF]/30'
                : 'bg-[#080D19] border-[#26344A] text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#151F33]'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>UPI / QR</span>
          </button>

          {/* SPLIT (CASH + UPI) */}
          <button
            type="button"
            onClick={() => onUpdatePaymentMode('SPLIT')}
            className={`flex flex-col items-center justify-center gap-1 min-h-[56px] p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer relative ${
              paymentMode === 'SPLIT'
                ? 'bg-[#F59E0B]/15 border-[#F59E0B] text-[#F59E0B] shadow-md shadow-[#F59E0B]/10 ring-1 ring-[#F59E0B]/30'
                : 'bg-[#080D19] border-[#26344A] text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#151F33]'
            }`}
            title="Split payment between Cash and UPI"
          >
            <ArrowRightLeft className="w-4 h-4 text-[#F59E0B]" />
            <span className="whitespace-nowrap">Cash + UPI</span>
          </button>

          {/* CASH + UPI + CREDIT (NEW!) */}
          <button
            type="button"
            onClick={() => onUpdatePaymentMode('CASH_UPI_CREDIT')}
            className={`flex flex-col items-center justify-center gap-1 min-h-[56px] p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer relative ${
              paymentMode === 'CASH_UPI_CREDIT'
                ? 'bg-gradient-to-br from-amber-500/25 via-rose-500/20 to-purple-500/25 border-amber-400 text-amber-300 shadow-md shadow-amber-500/20 ring-1 ring-amber-400/50'
                : 'bg-[#080D19] border-[#26344A] text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#151F33]'
            }`}
            title="Split payment: Cash + UPI + remaining balance on Credit / Due"
          >
            <HandCoins className="w-4 h-4 text-amber-400" />
            <span className="whitespace-nowrap text-[11px] font-black">Cash+UPI+Credit</span>
          </button>

          {/* CARD */}
          <button
            type="button"
            onClick={() => onUpdatePaymentMode('CARD')}
            className={`flex flex-col items-center justify-center gap-1 min-h-[56px] p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              paymentMode === 'CARD'
                ? 'bg-[#3B82F6]/15 border-[#3B82F6] text-[#3B82F6] shadow-md shadow-[#3B82F6]/10 ring-1 ring-[#3B82F6]/30'
                : 'bg-[#080D19] border-[#26344A] text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#151F33]'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Card</span>
          </button>

          {/* DUE */}
          <button
            type="button"
            onClick={() => onUpdatePaymentMode('DUE')}
            className={`flex flex-col items-center justify-center gap-1 min-h-[56px] p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              paymentMode === 'DUE'
                ? 'bg-[#EF4444]/15 border-[#EF4444] text-[#EF4444] shadow-md shadow-[#EF4444]/10 ring-1 ring-[#EF4444]/30'
                : 'bg-[#080D19] border-[#26344A] text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#151F33]'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Credit / Due</span>
          </button>
        </div>
      </div>

      {/* SPLIT PAYMENT BOX (Cash + UPI) */}
      {paymentMode === 'SPLIT' && items.length > 0 && (
        <div className="p-3.5 sm:p-4 rounded-xl bg-[#F59E0B]/5 border border-[#F59E0B]/30 flex flex-col gap-3 shadow-inner animate-in fade-in duration-100">
          <div className="flex items-center justify-between pb-2 border-b border-[#26344A]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse" />
              <span className="text-xs font-bold text-[#F59E0B] uppercase tracking-wider">
                Split Tender (Enter Cash &amp; UPI amounts)
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-[#94A3B8]">
              Target: <strong className="text-[#00C8FF]">{formatCurrency(grandTotal)}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Cash Tender Input */}
            <div className="flex flex-col gap-1.5 bg-[#080D19] p-3 rounded-lg border border-[#26344A]">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-[#10B981] flex items-center gap-1.5">
                  <Banknote className="w-3.5 h-3.5" /> Cash Received
                </label>
                {cashNum > 0 && grandTotal > cashNum && (
                  <button
                    type="button"
                    onClick={() => {
                      const rem = Math.max(0, grandTotal - cashNum);
                      setUpiReceived(String(Math.round(rem * 100) / 100));
                    }}
                    className="text-[10px] text-[#00C8FF] hover:underline font-bold cursor-pointer"
                  >
                    Rest in UPI (₹{Math.max(0, grandTotal - cashNum).toFixed(0)}) →
                  </button>
                )}
              </div>
              <div className="flex items-center h-9.5 bg-[#10182A] border border-[#26344A] focus-within:border-[#10B981] focus-within:ring-1 focus-within:ring-[#10B981]/20 rounded-md px-2.5">
                <span className="text-xs text-[#10B981] font-bold mr-1.5 select-none">₹</span>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={cashReceived}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setCashReceived(e.target.value)}
                  className="w-full bg-transparent text-sm font-bold text-[#F1F5F9] outline-none"
                />
              </div>
              <div className="flex items-center gap-1 flex-wrap pt-0.5">
                <span className="text-[10px] text-[#94A3B8]">Quick:</span>
                {['100', '200', '500', '1000'].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      setCashReceived(amt);
                      const rem = Math.max(0, grandTotal - Number(amt));
                      setUpiReceived(rem > 0 ? String(Math.round(rem * 100) / 100) : '');
                    }}
                    className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#151F33] text-[#94A3B8] hover:text-[#10B981] hover:bg-[#1A263D] transition-colors cursor-pointer"
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>
            </div>

            {/* UPI Tender Input */}
            <div className="flex flex-col gap-1.5 bg-[#080D19] p-3 rounded-lg border border-[#26344A]">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-[#00C8FF] flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5" /> UPI / Online Received
                </label>
                {upiNum > 0 && grandTotal > upiNum && (
                  <button
                    type="button"
                    onClick={() => {
                      const rem = Math.max(0, grandTotal - upiNum);
                      setCashReceived(String(Math.round(rem * 100) / 100));
                    }}
                    className="text-[10px] text-[#10B981] hover:underline font-bold cursor-pointer"
                  >
                    ← Rest in Cash (₹{Math.max(0, grandTotal - upiNum).toFixed(0)})
                  </button>
                )}
              </div>
              <div className="flex items-center h-9.5 bg-[#10182A] border border-[#26344A] focus-within:border-[#00C8FF] focus-within:ring-1 focus-within:ring-[#00C8FF]/20 rounded-md px-2.5">
                <span className="text-xs text-[#00C8FF] font-bold mr-1.5 select-none">₹</span>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={upiReceived}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setUpiReceived(e.target.value)}
                  className="w-full bg-transparent text-sm font-bold text-[#F1F5F9] outline-none"
                />
              </div>
              <div className="flex items-center justify-between pt-0.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => {
                    const rem = Math.max(0, grandTotal - cashNum);
                    setUpiReceived(String(Math.round(rem * 100) / 100));
                  }}
                  className="text-[#00C8FF] hover:underline font-bold cursor-pointer"
                >
                  Fill Remaining: ₹{Math.max(0, grandTotal - cashNum).toFixed(2)}
                </button>
              </div>
            </div>
          </div>

          {/* Payment Status Summary Bar */}
          <div className="flex flex-wrap items-center justify-between pt-2 border-t border-[#26344A] gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[#94A3B8]">Total Received:</span>
              <span className="font-mono font-bold text-[#F1F5F9]">
                {formatCurrency(cashNum + upiNum)}
              </span>
              {(cashNum + upiNum) >= grandTotal ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                  Fully Paid ✓
                </span>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30">
                    Pending: {formatCurrency(Math.max(0, grandTotal - (cashNum + upiNum)))}
                  </span>
                  <button
                    type="button"
                    onClick={() => onUpdatePaymentMode('CASH_UPI_CREDIT')}
                    className="text-[11px] font-bold text-amber-400 hover:text-amber-300 underline cursor-pointer"
                  >
                    Leave as Credit (Due)? Switch to Cash+UPI+Credit →
                  </button>
                </div>
              )}
            </div>

            {changeDue > 0 && (
              <div className="text-right">
                <span className="text-[#94A3B8] text-[11px] mr-1.5 font-bold">Change to Return:</span>
                <span className="font-mono font-black text-[#10B981] text-sm">
                  {formatCurrency(changeDue)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CASH + UPI + CREDIT PAYMENT BOX */}
      {paymentMode === 'CASH_UPI_CREDIT' && items.length > 0 && (
        <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-b from-[#151F33]/90 to-[#0F172A] border border-amber-500/35 flex flex-col gap-3 shadow-xl animate-in fade-in duration-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-[#26344A] gap-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs font-extrabold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <HandCoins className="w-3.5 h-3.5 text-amber-400" />
                Cash + UPI + Credit Tender
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-[#94A3B8]">Target Total:</span>
              <strong className="text-[#00C8FF] text-sm">{formatCurrency(grandTotal)}</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Cash Tender Input */}
            <div className="flex flex-col gap-1.5 bg-[#080D19] p-3 rounded-xl border border-[#26344A] focus-within:border-[#10B981]/60 transition-colors">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-[#10B981] flex items-center gap-1.5">
                  <Banknote className="w-3.5 h-3.5" /> Cash Received
                </label>
                {cashNum > 0 && (
                  <button
                    type="button"
                    onClick={() => setCashReceived('')}
                    className="text-[10px] text-[#94A3B8] hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="flex items-center h-10 bg-[#10182A] border border-[#26344A] focus-within:border-[#10B981] focus-within:ring-1 focus-within:ring-[#10B981]/20 rounded-lg px-2.5">
                <span className="text-sm text-[#10B981] font-bold mr-1.5 select-none">₹</span>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={cashReceived}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setCashReceived(e.target.value)}
                  className="w-full bg-transparent text-sm font-bold text-[#F1F5F9] outline-none"
                />
              </div>
              <div className="flex items-center gap-1 flex-wrap pt-0.5">
                <span className="text-[10px] text-[#94A3B8] font-semibold">Quick:</span>
                {['100', '200', '500', '1000'].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setCashReceived(amt)}
                    className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#151F33] text-[#94A3B8] hover:text-[#10B981] hover:bg-[#1A263D] transition-colors cursor-pointer border border-[#26344A]"
                  >
                    ₹{amt}
                  </button>
                ))}
                {grandTotal > 0 && (
                  <button
                    type="button"
                    onClick={() => setCashReceived(String(Math.round(grandTotal / 2)))}
                    className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#151F33] text-[#94A3B8] hover:text-[#10B981] hover:bg-[#1A263D] transition-colors cursor-pointer border border-[#26344A]"
                  >
                    50% (₹{Math.round(grandTotal / 2)})
                  </button>
                )}
              </div>
            </div>

            {/* UPI Tender Input */}
            <div className="flex flex-col gap-1.5 bg-[#080D19] p-3 rounded-xl border border-[#26344A] focus-within:border-[#00C8FF]/60 transition-colors">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-[#00C8FF] flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5" /> UPI / Online Received
                </label>
                {upiNum > 0 && (
                  <button
                    type="button"
                    onClick={() => setUpiReceived('')}
                    className="text-[10px] text-[#94A3B8] hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="flex items-center h-10 bg-[#10182A] border border-[#26344A] focus-within:border-[#00C8FF] focus-within:ring-1 focus-within:ring-[#00C8FF]/20 rounded-lg px-2.5">
                <span className="text-sm text-[#00C8FF] font-bold mr-1.5 select-none">₹</span>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={upiReceived}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setUpiReceived(e.target.value)}
                  className="w-full bg-transparent text-sm font-bold text-[#F1F5F9] outline-none"
                />
              </div>
              <div className="flex items-center gap-1 flex-wrap pt-0.5">
                <span className="text-[10px] text-[#94A3B8] font-semibold">Quick:</span>
                {['100', '200', '500', '1000'].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setUpiReceived(amt)}
                    className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#151F33] text-[#94A3B8] hover:text-[#00C8FF] hover:bg-[#1A263D] transition-colors cursor-pointer border border-[#26344A]"
                  >
                    ₹{amt}
                  </button>
                ))}
                {cashNum > 0 && grandTotal > cashNum && (
                  <button
                    type="button"
                    onClick={() => {
                      const rem = Math.max(0, grandTotal - cashNum);
                      setUpiReceived(String(Math.round(rem * 100) / 100));
                    }}
                    className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#00C8FF]/15 text-[#00C8FF] hover:bg-[#00C8FF]/25 transition-colors cursor-pointer border border-[#00C8FF]/30"
                  >
                    Fill Rest in UPI (₹{Math.max(0, grandTotal - cashNum).toFixed(0)})
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 3-Way Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            {/* Cash Paid */}
            <div className="p-2.5 rounded-lg bg-[#080D19] border border-[#10B981]/30 flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#10B981] flex items-center gap-1">
                <Banknote className="w-3 h-3" /> Cash Paid
              </span>
              <span className="text-base font-black font-mono text-[#F1F5F9] mt-0.5">
                {formatCurrency(cashNum)}
              </span>
            </div>

            {/* UPI Paid */}
            <div className="p-2.5 rounded-lg bg-[#080D19] border border-[#00C8FF]/30 flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#00C8FF] flex items-center gap-1">
                <QrCode className="w-3 h-3" /> UPI Paid
              </span>
              <span className="text-base font-black font-mono text-[#F1F5F9] mt-0.5">
                {formatCurrency(upiNum)}
              </span>
            </div>

            {/* Credit / Balance Due */}
            <div className="p-2.5 rounded-lg bg-[#080D19] border border-rose-500/40 flex flex-col relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
                  <FileText className="w-3 h-3" /> Balance on Credit
                </span>
                {creditDue > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                )}
              </div>
              <span className="text-base font-black font-mono text-rose-300 mt-0.5">
                {formatCurrency(creditDue)}
              </span>
            </div>
          </div>

          {/* Credit Guidance Note & Alert */}
          {creditDue > 0 ? (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/25 flex items-start gap-2 text-xs text-rose-200">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold">
                  ₹{creditDue.toFixed(2)} will remain as Customer Credit (Due).
                </span>
                {!customerName.trim() && (
                  <span className="block text-[11px] text-amber-300 font-semibold mt-0.5">
                    ⚠️ Enter Customer Name &amp; Phone above to track this credit in the Khata / Due ledger!
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-2 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-bold">
                100% Covered by Cash &amp; UPI. No credit balance remaining.
              </span>
            </div>
          )}

          {changeDue > 0 && (
            <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300">
              <span className="font-bold">Cash Overpayment:</span>
              <span className="font-mono font-black text-sm">
                Change to Return: {formatCurrency(changeDue)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Cash Calculator & Quick Tender Chips if CASH is selected */}
      {paymentMode === 'CASH' && items.length > 0 && (
        <div className="p-3 sm:p-3.5 rounded-xl bg-[#10B981]/10 border border-[#10B981]/30 flex flex-col gap-2.5 animate-in fade-in duration-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#10B981] whitespace-nowrap">Cash Received:</span>
                <div className="flex items-center h-9.5 w-40 sm:w-44 bg-[#080D19] border border-[#10B981]/50 rounded-lg px-3 focus-within:ring-1 focus-within:ring-[#10B981]">
                  <span className="text-[#94A3B8] font-bold text-xs mr-1.5 select-none">₹</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    className="w-full bg-transparent px-1 text-sm font-bold text-[#F1F5F9] outline-none"
                    placeholder={grandTotal > 0 ? grandTotal.toFixed(0) : '0.00'}
                    value={cashReceived}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setCashReceived(e.target.value)}
                  />
                </div>
              </div>
              {/* Quick cash shortcut chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-[#94A3B8] font-bold">Quick Tender:</span>
                <button
                  type="button"
                  onClick={() => setCashReceived(String(Math.ceil(grandTotal)))}
                  className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#151F33] hover:bg-[#1A263D] text-[#F1F5F9] border border-[#26344A] cursor-pointer transition-colors"
                >
                  Exact
                </button>
                <button
                  type="button"
                  onClick={() => setCashReceived('500')}
                  className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#151F33] hover:bg-[#1A263D] text-[#F1F5F9] border border-[#26344A] cursor-pointer transition-colors"
                >
                  ₹500
                </button>
                <button
                  type="button"
                  onClick={() => setCashReceived('1000')}
                  className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#151F33] hover:bg-[#1A263D] text-[#F1F5F9] border border-[#26344A] cursor-pointer transition-colors"
                >
                  ₹1000
                </button>
                <button
                  type="button"
                  onClick={() => setCashReceived('2000')}
                  className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#151F33] hover:bg-[#1A263D] text-[#F1F5F9] border border-[#26344A] cursor-pointer transition-colors"
                >
                  ₹2000
                </button>
              </div>
            </div>

            <div className="text-left sm:text-right pt-2.5 sm:pt-0 border-t sm:border-t-0 border-[#10B981]/20">
              <span className="text-[11px] text-[#94A3B8] block font-bold">Change to Return:</span>
              <div className="text-lg sm:text-xl font-bold font-mono text-[#10B981]">
                {formatCurrency(changeDue)}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#10B981]/20 flex items-center justify-between text-xs">
            <span className="text-[11px] text-[#94A3B8]">Paying some cash and some UPI?</span>
            <button
              type="button"
              onClick={() => onUpdatePaymentMode('SPLIT')}
              className="text-[#00C8FF] hover:underline font-bold text-xs flex items-center gap-1 cursor-pointer"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Switch to Split (Cash + UPI)</span>
            </button>
          </div>
        </div>
      )}

      {/* UPI Info confirmation when UPI selected */}
      {paymentMode === 'UPI' && items.length > 0 && (
        <div className="p-3 rounded-xl bg-[#00C8FF]/10 border border-[#00C8FF]/30 flex items-center justify-between gap-3 text-xs animate-in fade-in duration-100">
          <div className="flex items-center gap-2">
            <QrCode className="w-4 h-4 text-[#00C8FF]" />
            <span className="text-[#F1F5F9]">
              Full payment via <strong>UPI / QR Code</strong>: <span className="font-mono text-[#00C8FF] font-bold">{formatCurrency(grandTotal)}</span>
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              onUpdatePaymentMode('SPLIT');
            }}
            className="text-[#94A3B8] hover:text-[#00C8FF] underline font-bold cursor-pointer whitespace-nowrap"
          >
            Split with Cash?
          </button>
        </div>
      )}

      {/* Bill Financial Summary */}
      <div className="p-3.5 sm:p-4 rounded-xl bg-[#080D19] border border-[#26344A] flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-[#94A3B8]">
          <span>Subtotal:</span>
          <span className="font-mono font-bold text-[#F1F5F9]">{formatCurrency(subtotal)}</span>
        </div>
        {totalDiscount > 0 && (
          <div className="flex items-center justify-between text-xs text-[#10B981]">
            <span>Total Discount:</span>
            <span className="font-mono font-bold">-{formatCurrency(totalDiscount)}</span>
          </div>
        )}
        <div className="flex items-center justify-between pt-2.5 border-t border-[#26344A]">
          <div>
            <span className="text-xs uppercase tracking-wider font-extrabold text-[#94A3B8] block">
              Grand Total
            </span>
            <span className="text-[10px] text-[#94A3B8]/80 italic">
              {grandTotal > 0 ? numberToIndianWords(grandTotal) : 'Zero Rupees'}
            </span>
          </div>
          <div className="text-right">
            <span className="font-mono font-black text-xl sm:text-2xl lg:text-3xl text-[#00C8FF] drop-shadow-[0_0_12px_rgba(0,200,255,0.25)]">
              {formatCurrency(grandTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* Primary and Secondary Billing Actions */}
      <div className="flex flex-col sm:flex-row items-stretch gap-2 pt-1">
        <button
          type="button"
          disabled={items.length === 0}
          onClick={handleSubmit}
          className={`flex-1 flex items-center justify-center gap-2 h-11 sm:h-12 px-5 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer ${
            items.length === 0
              ? 'opacity-40 cursor-not-allowed bg-[#151F33] text-[#94A3B8] border border-[#26344A]'
              : 'bg-[#10B981] hover:bg-[#059669] text-[#080D19] shadow-[#10B981]/20 active:scale-[0.99] font-extrabold'
          }`}
          id="btn-submit-download-bill"
        >
          <Camera className="w-4 h-4 shrink-0" />
          <span>Submit &amp; Download Screenshot (PNG)</span>
        </button>

        <button
          type="button"
          disabled={items.length === 0}
          onClick={onPrintOnly}
          className="flex items-center justify-center gap-2 h-11 sm:h-12 px-4 rounded-xl text-xs sm:text-sm font-bold text-[#F1F5F9] bg-[#151F33] hover:bg-[#1A263D] border border-[#26344A] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
          title="Print or Save as PDF directly"
        >
          <Printer className="w-4 h-4 text-[#00C8FF]" />
          <span>Print / Save PDF</span>
        </button>
      </div>
    </div>
  );
};
