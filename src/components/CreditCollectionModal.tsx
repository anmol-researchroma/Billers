'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  HandCoins, 
  Search, 
  CheckCircle2, 
  Printer, 
  Camera, 
  User, 
  Phone, 
  Banknote, 
  QrCode, 
  CreditCard, 
  ArrowRightLeft, 
  FileText, 
  RefreshCw, 
  RotateCcw,
  Trash2
} from 'lucide-react';
import { CreditCollectionRecord } from '@/types/billing';
import { 
  getSalesHistory, 
  saveCreditCollection, 
  getCreditCollections, 
  deleteCreditCollectionRecord,
  SavedSaleRecord 
} from '@/services/firebaseService';
import { formatCurrency, numberToIndianWords } from '@/utils/numberToWords';
import { toPng } from 'html-to-image';
import confetti from 'canvas-confetti';

interface CreditCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sellerName?: string;
}

export const CreditCollectionModal: React.FC<CreditCollectionModalProps> = ({
  isOpen,
  onClose,
  sellerName = '',
}) => {
  // Tabs: 'new' | 'history'
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');

  // Pending due sales from Firestore
  const [dueSales, setDueSales] = useState<SavedSaleRecord[]>([]);
  const [loadingSales, setLoadingSales] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Past collections history
  const [collectionHistory, setCollectionHistory] = useState<CreditCollectionRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  // Selected Sale for settlement
  const [selectedSale, setSelectedSale] = useState<SavedSaleRecord | null>(null);

  // Form Fields
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [originalDue, setOriginalDue] = useState<string>('');
  const [collectAmount, setCollectAmount] = useState<string>('');
  const [collectPaymentMode, setCollectPaymentMode] = useState<'CASH' | 'UPI' | 'CARD' | 'SPLIT'>('CASH');
  const [cashPart, setCashPart] = useState<string>('');
  const [upiPart, setUpiPart] = useState<string>('');
  const [collectorName, setCollectorName] = useState<string>(sellerName);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Generated Voucher Preview
  const [completedVoucher, setCompletedVoucher] = useState<CreditCollectionRecord | null>(null);
  const voucherCaptureRef = useRef<HTMLDivElement>(null);

  const [prevSeller, setPrevSeller] = useState(sellerName);
  if (sellerName !== prevSeller) {
    setPrevSeller(sellerName);
    setCollectorName(sellerName);
  }

  const loadDueSales = async () => {
    setLoadingSales(true);
    try {
      const allSales = await getSalesHistory(150);
      // Filter sales that are marked DUE or have balanceDue > 0
      const dues = allSales.filter((s) => {
        if (s.balanceDue !== undefined && s.balanceDue > 0) return true;
        if (s.paymentMode === 'DUE') return true;
        return false;
      });
      setDueSales(dues);
    } catch (err) {
      console.error('Failed to load due sales:', err);
    } finally {
      setLoadingSales(false);
    }
  };

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const hist = await getCreditCollections(60);
      setCollectionHistory(hist);
    } catch (err) {
      console.error('Failed to load credit collection history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Load due sales when modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        loadDueSales();
        loadHistory();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleDeleteCollectionRecord = async (col: CreditCollectionRecord) => {
    if (!col.id) return;
    if (!confirm(`Are you sure you want to permanently delete payment record #${col.voucherNumber} (Amount: ${formatCurrency(col.amountCollected)})?`)) {
      return;
    }

    try {
      const ok = await deleteCreditCollectionRecord(col.id);
      if (ok) {
        setCollectionHistory((prev) => prev.filter((c) => c.id !== col.id));
      } else {
        alert('Failed to delete payment record from database.');
      }
    } catch (err) {
      console.error('Delete collection record error:', err);
      alert('Error occurred while deleting payment record.');
    }
  };

  // Helper to select a pending invoice
  const handleSelectInvoice = (sale: SavedSaleRecord) => {
    setSelectedSale(sale);
    setCustomerName(sale.customerName || '');
    setCustomerPhone(sale.customerPhone || '');
    const due = sale.balanceDue ?? sale.grandTotal ?? 0;
    setOriginalDue(String(due));
    setCollectAmount(String(due)); // Default to full due settlement
    setCashPart(String(due));
    setUpiPart('');
  };

  const handleClearSelection = () => {
    setSelectedSale(null);
    setCustomerName('');
    setCustomerPhone('');
    setOriginalDue('');
    setCollectAmount('');
    setCashPart('');
    setUpiPart('');
  };

  // Calculations
  const dueNum = parseFloat(originalDue) || 0;
  const collectNum = parseFloat(collectAmount) || 0;
  const remainingDue = Math.max(0, dueNum - collectNum);

  const cashNum = parseFloat(cashPart) || 0;
  const upiNum = parseFloat(upiPart) || 0;

  // Filtered due sales
  const filteredDueSales = dueSales.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.invoiceNumber.toLowerCase().includes(q) ||
      s.customerName.toLowerCase().includes(q) ||
      s.customerPhone.includes(q)
    );
  });

  // Submit and save collection
  const handleSubmitCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      alert('Please enter or select a customer name.');
      return;
    }
    if (collectNum <= 0) {
      alert('Please enter a valid collection amount greater than ₹0.');
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      const timeStr = now.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const randomSeq = Math.floor(1000 + Math.random() * 9000);
      const voucherNumber = `COL-${now.getFullYear().toString().slice(2)}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${randomSeq}`;

      const record: CreditCollectionRecord = {
        voucherNumber,
        invoiceId: selectedSale?.id,
        invoiceNumber: selectedSale?.invoiceNumber || '',
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        sellerName: (collectorName || sellerName || 'Staff').trim(),
        totalDueBefore: dueNum,
        amountCollected: collectNum,
        remainingDue,
        paymentMode: collectPaymentMode,
        cashAmount: collectPaymentMode === 'CASH' ? collectNum : collectPaymentMode === 'SPLIT' ? cashNum : undefined,
        upiAmount: collectPaymentMode === 'UPI' ? collectNum : collectPaymentMode === 'SPLIT' ? upiNum : undefined,
        notes: notes.trim(),
        date: dateStr,
        time: timeStr,
      };

      const docId = await saveCreditCollection(record);
      record.id = docId || undefined;

      setCompletedVoucher(record);

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#10B981', '#00C8FF', '#F59E0B'],
      });

      // Refresh data
      loadDueSales();
      loadHistory();
    } catch (err) {
      console.error('Error saving collection:', err);
      alert('Failed to save credit collection. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Download Voucher PNG
  const handleDownloadVoucher = async () => {
    if (!voucherCaptureRef.current || !completedVoucher) return;
    try {
      const dataUrl = await toPng(voucherCaptureRef.current, {
        quality: 0.98,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });
      const link = document.createElement('a');
      link.download = `Voucher_${completedVoucher.voucherNumber}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download voucher PNG:', err);
      window.print();
    }
  };

  const handlePrintVoucher = () => {
    window.print();
  };

  const handleResetForNext = () => {
    setCompletedVoucher(null);
    handleClearSelection();
    setNotes('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
      <div className="bg-[#10182A] border border-[#26344A] rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col text-[#F1F5F9] shadow-2xl overflow-hidden ring-1 ring-white/10">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#26344A] bg-[#080D19]/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow-sm">
              <HandCoins className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[#F1F5F9] tracking-tight">
                  Credit / Due Collection
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Udhaar Collection
                </span>
              </div>
              <p className="text-xs text-[#94A3B8]">
                Collect payments against customer credit balances and generate payment vouchers
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#151F33] rounded-xl transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-[#26344A] bg-[#080D19]/30">
          <button
            type="button"
            onClick={() => setActiveTab('new')}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-colors cursor-pointer border-b-2 flex items-center gap-2 ${
              activeTab === 'new'
                ? 'border-[#00C8FF] text-[#00C8FF] bg-[#151F33]/80'
                : 'border-transparent text-[#94A3B8] hover:text-[#F1F5F9]'
            }`}
          >
            <HandCoins className="w-3.5 h-3.5" />
            <span>Record New Collection</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-colors cursor-pointer border-b-2 flex items-center gap-2 ${
              activeTab === 'history'
                ? 'border-[#00C8FF] text-[#00C8FF] bg-[#151F33]/80'
                : 'border-transparent text-[#94A3B8] hover:text-[#F1F5F9]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Collection History ({collectionHistory.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 custom-scrollbar">
          {activeTab === 'new' && (
            <>
              {completedVoucher ? (
                /* ========================================================
                   COMPLETED VOUCHER SCREEN & RECEIPT PREVIEW
                   ======================================================== */
                <div className="flex flex-col items-center gap-5">
                  <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 rounded-xl text-sm font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Payment Collection Recorded Successfully!</span>
                  </div>

                  {/* Printable Voucher Element */}
                  <div 
                    ref={voucherCaptureRef}
                    className="w-full max-w-lg bg-white text-slate-900 p-6 rounded-lg shadow-xl border border-slate-200 font-sans"
                  >
                    <div className="text-center pb-3 border-b-2 border-slate-900">
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">
                        BILLER PRO AUTOMOTIVE
                      </h3>
                      <p className="text-xs text-slate-600 font-semibold uppercase tracking-wider">
                        Official Payment Voucher / Due Collection Receipt
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs py-3 border-b border-slate-200">
                      <div>
                        <span className="text-slate-500 block text-[10px] font-bold uppercase">Voucher No</span>
                        <strong className="font-mono text-sm text-slate-900">{completedVoucher.voucherNumber}</strong>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-500 block text-[10px] font-bold uppercase">Date &amp; Time</span>
                        <strong className="text-slate-800">{completedVoucher.date} {completedVoucher.time}</strong>
                      </div>
                      {completedVoucher.invoiceNumber && (
                        <div>
                          <span className="text-slate-500 block text-[10px] font-bold uppercase">Against Bill No</span>
                          <strong className="font-mono text-slate-800">{completedVoucher.invoiceNumber}</strong>
                        </div>
                      )}
                      <div className={completedVoucher.invoiceNumber ? 'text-right' : ''}>
                        <span className="text-slate-500 block text-[10px] font-bold uppercase">Payment Mode</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          {completedVoucher.paymentMode}
                        </span>
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="py-3 border-b border-slate-200 text-xs">
                      <div className="flex justify-between">
                        <div>
                          <span className="text-slate-500 text-[10px] font-bold uppercase block">Received From Customer</span>
                          <strong className="text-sm text-slate-900">{completedVoucher.customerName}</strong>
                          {completedVoucher.customerPhone && (
                            <span className="block text-slate-600">Mob: +91 {completedVoucher.customerPhone}</span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-slate-500 text-[10px] font-bold uppercase block">Collected By</span>
                          <strong className="text-slate-800">{completedVoucher.sellerName}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="py-3.5 space-y-2 text-xs border-b border-slate-200">
                      {completedVoucher.totalDueBefore > 0 && (
                        <div className="flex justify-between text-slate-600 font-mono">
                          <span>Total Pending Due Before:</span>
                          <span>₹{completedVoucher.totalDueBefore.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-baseline text-base font-black text-slate-900 font-mono pt-1">
                        <span>AMOUNT RECEIVED NOW:</span>
                        <span className="text-xl text-emerald-700">₹{completedVoucher.amountCollected.toFixed(2)}</span>
                      </div>
                      <div className="text-[11px] text-slate-600 italic">
                        Amount in words: {numberToIndianWords(completedVoucher.amountCollected)}
                      </div>
                      {completedVoucher.paymentMode === 'SPLIT' && (
                        <div className="p-2 bg-slate-50 rounded border border-slate-200 text-[11px] flex justify-between">
                          <span>Cash: ₹{(completedVoucher.cashAmount || 0).toFixed(2)}</span>
                          <span>UPI: ₹{(completedVoucher.upiAmount || 0).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-xs pt-1 border-t border-dashed border-slate-300 font-mono">
                        <span className="font-bold text-slate-700">Remaining Balance Due:</span>
                        <strong className={completedVoucher.remainingDue === 0 ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                          {completedVoucher.remainingDue === 0 ? '₹0.00 (Fully Settled ✓)' : `₹${completedVoucher.remainingDue.toFixed(2)}`}
                        </strong>
                      </div>
                    </div>

                    {completedVoucher.notes && (
                      <div className="py-2 text-[11px] text-slate-600 italic">
                        Note: {completedVoucher.notes}
                      </div>
                    )}

                    <div className="pt-6 flex justify-between items-end text-[10px] text-slate-500">
                      <span>Computer Generated Receipt</span>
                      <div className="text-right">
                        <div className="w-32 border-b border-slate-400 mb-1" />
                        <span>Authorized Signatory</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleDownloadVoucher}
                      className="flex items-center gap-2 h-10 px-4 rounded-xl text-xs font-bold text-[#080D19] bg-[#00C8FF] hover:bg-[#00B4E6] cursor-pointer shadow-md transition-all active:scale-95"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Download Voucher (PNG)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handlePrintVoucher}
                      className="flex items-center gap-2 h-10 px-4 rounded-xl text-xs font-bold text-[#F1F5F9] bg-[#151F33] hover:bg-[#1A263D] border border-[#26344A] cursor-pointer transition-all"
                    >
                      <Printer className="w-4 h-4 text-[#00C8FF]" />
                      <span>Print Voucher</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleResetForNext}
                      className="flex items-center gap-2 h-10 px-4 rounded-xl text-xs font-bold text-[#F1F5F9] bg-slate-800 hover:bg-slate-700 cursor-pointer transition-all"
                    >
                      <RotateCcw className="w-4 h-4 text-emerald-400" />
                      <span>Record Another Collection</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* ========================================================
                   NEW COLLECTION FORM
                   ======================================================== */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Left Column: Select from Pending Due Bills (5 cols) */}
                  <div className="lg:col-span-5 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#F1F5F9] uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-amber-400" />
                        Pending Due Bills ({dueSales.length})
                      </span>
                      <button
                        type="button"
                        onClick={loadDueSales}
                        className="text-[11px] text-[#00C8FF] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Refresh</span>
                      </button>
                    </div>

                    {/* Search */}
                    <div className="flex items-center h-9 px-3 bg-[#080D19] border border-[#26344A] rounded-lg focus-within:border-[#00C8FF] transition-all">
                      <Search className="w-3.5 h-3.5 text-[#94A3B8] mr-2 shrink-0" />
                      <input
                        type="text"
                        placeholder="Search customer, phone, bill #..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-transparent text-xs text-[#F1F5F9] placeholder-[#94A3B8]/60 outline-none"
                      />
                    </div>

                    {/* Due list */}
                    <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto custom-scrollbar pr-0.5">
                      {loadingSales ? (
                        <div className="p-8 text-center text-xs text-[#94A3B8]">
                          Loading pending due records...
                        </div>
                      ) : filteredDueSales.length === 0 ? (
                        <div className="p-6 text-center text-xs text-[#94A3B8] border border-dashed border-[#26344A] rounded-xl">
                          No pending due bills found. You can enter a customer directly on the right!
                        </div>
                      ) : (
                        filteredDueSales.map((sale) => {
                          const isSelected = selectedSale?.id === sale.id;
                          const currentPending = sale.balanceDue ?? sale.grandTotal ?? 0;
                          return (
                            <div
                              key={sale.id}
                              onClick={() => handleSelectInvoice(sale)}
                              className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex flex-col gap-1.5 ${
                                isSelected
                                  ? 'bg-amber-500/15 border-amber-500/50 shadow-md ring-1 ring-amber-500/30'
                                  : 'bg-[#080D19] border-[#26344A] hover:border-[#00C8FF]/50 hover:bg-[#151F33]'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-[#F1F5F9] truncate">
                                  {sale.customerName}
                                </span>
                                <span className="font-mono font-black text-rose-400 text-xs">
                                  {formatCurrency(currentPending)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-[11px] text-[#94A3B8]">
                                <span>{sale.customerPhone || 'No phone'}</span>
                                <span className="font-mono text-[10px]">#{sale.invoiceNumber}</span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {selectedSale && (
                      <button
                        type="button"
                        onClick={handleClearSelection}
                        className="text-xs text-rose-400 hover:underline text-left cursor-pointer pt-1"
                      >
                        ✕ Clear invoice link (Record manual customer collection)
                      </button>
                    )}
                  </div>

                  {/* Right Column: Collection Entry Form (7 cols) */}
                  <form 
                    onSubmit={handleSubmitCollection}
                    className="lg:col-span-7 flex flex-col gap-3.5 bg-[#080D19]/80 border border-[#26344A] p-4 sm:p-5 rounded-xl shadow-inner"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-[#26344A]">
                      <span className="text-xs font-bold text-[#00C8FF] uppercase tracking-wider">
                        Collection Details
                      </span>
                      {selectedSale && (
                        <span className="text-[11px] text-amber-400 font-mono">
                          Linked to #{selectedSale.invoiceNumber}
                        </span>
                      )}
                    </div>

                    {/* Customer Name & Phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1">
                          Customer Name *
                        </label>
                        <div className="flex items-center h-10 px-3 bg-[#10182A] border border-[#26344A] rounded-lg focus-within:border-[#00C8FF]">
                          <User className="w-3.5 h-3.5 text-[#94A3B8] mr-2" />
                          <input
                            type="text"
                            required
                            placeholder="e.g. Ramesh Kumar"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="w-full bg-transparent text-xs sm:text-sm text-[#F1F5F9] outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1">
                          Phone Number
                        </label>
                        <div className="flex items-center h-10 px-3 bg-[#10182A] border border-[#26344A] rounded-lg focus-within:border-[#00C8FF]">
                          <Phone className="w-3.5 h-3.5 text-[#94A3B8] mr-2" />
                          <input
                            type="tel"
                            placeholder="e.g. 98765 43210"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            className="w-full bg-transparent text-xs sm:text-sm text-[#F1F5F9] outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Due Amount vs Amount to Collect */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1">
                          Total Due Balance (₹)
                        </label>
                        <div className="flex items-center h-10 px-3 bg-[#10182A] border border-[#26344A] rounded-lg">
                          <span className="text-xs text-[#94A3B8] font-bold mr-1">₹</span>
                          <input
                            type="number"
                            inputMode="decimal"
                            placeholder="0.00"
                            value={originalDue}
                            onChange={(e) => setOriginalDue(e.target.value)}
                            className="w-full bg-transparent text-xs sm:text-sm text-[#F1F5F9] outline-none font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                            Collecting Now (₹) *
                          </label>
                          {dueNum > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setCollectAmount(String(dueNum));
                                setCashPart(String(dueNum));
                                setUpiPart('');
                              }}
                              className="text-[10px] text-emerald-400 hover:underline font-bold cursor-pointer"
                            >
                              Full Settle (₹{dueNum.toFixed(0)})
                            </button>
                          )}
                        </div>
                        <div className="flex items-center h-10 px-3 bg-[#10182A] border border-emerald-500/50 rounded-lg focus-within:ring-1 focus-within:ring-emerald-500">
                          <span className="text-xs text-emerald-400 font-bold mr-1">₹</span>
                          <input
                            type="number"
                            required
                            inputMode="decimal"
                            placeholder="0.00"
                            value={collectAmount}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCollectAmount(val);
                              setCashPart(val);
                              setUpiPart('');
                            }}
                            className="w-full bg-transparent text-sm font-black text-emerald-400 outline-none font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Quick tender amount chips */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-[#94A3B8]">Quick:</span>
                      {['500', '1000', '2000', '5000'].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => {
                            setCollectAmount(amt);
                            setCashPart(amt);
                            setUpiPart('');
                          }}
                          className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#151F33] hover:bg-[#1A263D] text-[#94A3B8] hover:text-[#00C8FF] border border-[#26344A] cursor-pointer"
                        >
                          ₹{amt}
                        </button>
                      ))}
                    </div>

                    {/* Payment Mode Selector */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1.5">
                        Collection Payment Mode
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <button
                          type="button"
                          onClick={() => setCollectPaymentMode('CASH')}
                          className={`flex items-center justify-center gap-1.5 h-10 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                            collectPaymentMode === 'CASH'
                              ? 'bg-[#10B981]/20 border-[#10B981] text-[#10B981]'
                              : 'bg-[#10182A] border-[#26344A] text-[#94A3B8] hover:text-[#F1F5F9]'
                          }`}
                        >
                          <Banknote className="w-3.5 h-3.5" />
                          <span>Cash</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCollectPaymentMode('UPI')}
                          className={`flex items-center justify-center gap-1.5 h-10 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                            collectPaymentMode === 'UPI'
                              ? 'bg-[#00C8FF]/20 border-[#00C8FF] text-[#00C8FF]'
                              : 'bg-[#10182A] border-[#26344A] text-[#94A3B8] hover:text-[#F1F5F9]'
                          }`}
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>UPI / QR</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCollectPaymentMode('SPLIT')}
                          className={`flex items-center justify-center gap-1.5 h-10 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                            collectPaymentMode === 'SPLIT'
                              ? 'bg-[#F59E0B]/20 border-[#F59E0B] text-[#F59E0B]'
                              : 'bg-[#10182A] border-[#26344A] text-[#94A3B8] hover:text-[#F1F5F9]'
                          }`}
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          <span>Cash + UPI</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setCollectPaymentMode('CARD')}
                          className={`flex items-center justify-center gap-1.5 h-10 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                            collectPaymentMode === 'CARD'
                              ? 'bg-[#3B82F6]/20 border-[#3B82F6] text-[#3B82F6]'
                              : 'bg-[#10182A] border-[#26344A] text-[#94A3B8] hover:text-[#F1F5F9]'
                          }`}
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Card</span>
                        </button>
                      </div>
                    </div>

                    {/* Split details if SPLIT */}
                    {collectPaymentMode === 'SPLIT' && (
                      <div className="grid grid-cols-2 gap-2.5 p-3 rounded-lg bg-[#10182A] border border-amber-500/30">
                        <div>
                          <label className="block text-[10px] font-bold text-[#10B981] mb-1">
                            Cash Received (₹)
                          </label>
                          <input
                            type="number"
                            inputMode="decimal"
                            placeholder="0.00"
                            value={cashPart}
                            onChange={(e) => {
                              const c = e.target.value;
                              setCashPart(c);
                              const rem = Math.max(0, collectNum - Number(c));
                              setUpiPart(rem > 0 ? String(rem) : '');
                            }}
                            className="w-full h-8 px-2.5 rounded bg-[#080D19] border border-[#26344A] text-xs font-bold text-[#F1F5F9] outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-[#00C8FF] mb-1">
                            UPI Received (₹)
                          </label>
                          <input
                            type="number"
                            inputMode="decimal"
                            placeholder="0.00"
                            value={upiPart}
                            onChange={(e) => setUpiPart(e.target.value)}
                            className="w-full h-8 px-2.5 rounded bg-[#080D19] border border-[#26344A] text-xs font-bold text-[#F1F5F9] outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {/* Remaining Due Status */}
                    <div className="p-3 rounded-lg bg-[#10182A] border border-[#26344A] flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[#94A3B8] block text-[10px] font-bold uppercase">
                          Remaining Due After Payment
                        </span>
                        <strong className="text-sm font-mono text-[#F1F5F9]">
                          {formatCurrency(remainingDue)}
                        </strong>
                      </div>
                      {dueNum > 0 && (
                        <div>
                          {remainingDue === 0 ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Full Settlement ✓
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Partial Payment
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Seller & Notes */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1">
                          Collected By (Staff)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Anand"
                          value={collectorName}
                          onChange={(e) => setCollectorName(e.target.value)}
                          className="w-full h-9 px-3 rounded-lg bg-[#10182A] border border-[#26344A] text-xs text-[#F1F5F9] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1">
                          Notes / Ref
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Cheque / UPI Ref / Cash memo"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="w-full h-9 px-3 rounded-lg bg-[#10182A] border border-[#26344A] text-xs text-[#F1F5F9] outline-none"
                        />
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting || collectNum <= 0}
                      className="w-full h-11 rounded-xl text-xs sm:text-sm font-extrabold text-[#080D19] bg-emerald-400 hover:bg-emerald-300 shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isSubmitting ? 'Saving...' : `Record Collection of ${formatCurrency(collectNum)} & Generate Voucher`}</span>
                    </button>
                  </form>
                </div>
              )}
            </>
          )}

          {/* ========================================================
             TAB 2: COLLECTION HISTORY
             ======================================================== */}
          {activeTab === 'history' && (
            <div className="flex flex-col gap-4">
              {/* Metric Card */}
              <div className="p-4 rounded-xl bg-[#080D19] border border-[#26344A] flex items-center justify-between">
                <div>
                  <span className="text-xs text-[#94A3B8] font-bold uppercase tracking-wider block">
                    Total Credit Collected
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                    {formatCurrency(collectionHistory.reduce((acc, c) => acc + (c.amountCollected || 0), 0))}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={loadHistory}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#151F33] hover:bg-[#1A263D] border border-[#26344A] text-[#00C8FF] flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh</span>
                </button>
              </div>

              {/* Records List */}
              {loadingHistory ? (
                <div className="p-10 text-center text-xs text-[#94A3B8]">
                  Loading collection history...
                </div>
              ) : collectionHistory.length === 0 ? (
                <div className="p-10 text-center text-xs text-[#94A3B8] border border-dashed border-[#26344A] rounded-xl">
                  No credit collections recorded yet.
                </div>
              ) : (
                <div className="flex flex-col gap-2.5 max-h-[460px] overflow-y-auto custom-scrollbar pr-0.5">
                  {collectionHistory.map((col) => (
                    <div
                      key={col.id || col.voucherNumber}
                      className="p-3.5 rounded-xl bg-[#080D19] border border-[#26344A] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#00C8FF]">
                            #{col.voucherNumber}
                          </span>
                          <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                            {col.paymentMode}
                          </span>
                          {col.invoiceNumber && (
                            <span className="text-[11px] text-[#94A3B8]">
                              Bill: #{col.invoiceNumber}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[#F1F5F9] font-bold">
                          <span>{col.customerName}</span>
                          {col.customerPhone && (
                            <span className="text-[#94A3B8] font-normal font-mono">
                              ({col.customerPhone})
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#94A3B8]">
                          Date: {col.date} {col.time} • Collected by: <strong>{col.sellerName}</strong>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-left sm:text-right">
                          <span className="text-[10px] text-[#94A3B8] block">Amount Collected:</span>
                          <span className="text-base font-black text-emerald-400 font-mono">
                            {formatCurrency(col.amountCollected)}
                          </span>
                          {col.remainingDue !== undefined && (
                            <span className="text-[11px] text-[#94A3B8] block">
                              Remaining: {formatCurrency(col.remainingDue)}
                            </span>
                          )}
                        </div>

                        {/* Delete Payment Record Button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteCollectionRecord(col)}
                          className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0 ml-1"
                          title="Delete collection payment record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#26344A] bg-[#080D19]/60 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-[#F1F5F9] bg-[#151F33] hover:bg-[#1A263D] border border-[#26344A] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
