'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Lock, 
  PlusCircle, 
  History, 
  LogOut, 
  ShieldCheck, 
  Trash2, 
  CheckCircle2, 
  Flame, 
  Shield, 
  Search,
  Package,
  Phone,
  User as UserIcon,
  CreditCard,
  Banknote,
  QrCode,
  FileText,
  Eye,
  EyeOff,
  Mail,
  AlertCircle,
  KeyRound,
  ArrowLeft,
  Download,
  Printer,
  Receipt,
  ChevronDown,
  ChevronUp,
  HandCoins,
  RefreshCw,
  ArrowRightLeft
} from 'lucide-react';
import { auth } from '@/lib/firebase';
import { 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  signOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { 
  addCustomProduct, 
  deleteCustomProduct, 
  getSalesHistory, 
  updateSalePaymentMode,
  deleteSaleRecord,
  saveCreditCollection,
  getCreditCollections,
  deleteCreditCollectionRecord,
  SavedSaleRecord 
} from '@/services/firebaseService';
import { Product, Company, PaymentMode, InvoiceItem, CreditCollectionRecord } from '@/types/billing';
import { PrintableBill } from '@/components/PrintableBill';
import { toPng } from 'html-to-image';
import { formatCurrency, numberToIndianWords } from '@/utils/numberToWords';

// ========================================================
// OFFICIAL PAYMENT VOUCHER SLIP (FOR PRINT & PNG CAPTURE)
// ========================================================
const PaymentVoucherSlip: React.FC<{
  voucher: CreditCollectionRecord;
  innerRef?: React.Ref<HTMLDivElement>;
}> = ({ voucher, innerRef }) => {
  return (
    <div 
      ref={innerRef}
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
          <strong className="font-mono text-sm text-slate-900">{voucher.voucherNumber}</strong>
        </div>
        <div className="text-right">
          <span className="text-slate-500 block text-[10px] font-bold uppercase">Date &amp; Time</span>
          <strong className="text-slate-800">{voucher.date} {voucher.time}</strong>
        </div>
        {voucher.invoiceNumber && (
          <div>
            <span className="text-slate-500 block text-[10px] font-bold uppercase">Against Bill No</span>
            <strong className="font-mono text-slate-800">#{voucher.invoiceNumber}</strong>
          </div>
        )}
        <div className={voucher.invoiceNumber ? 'text-right' : ''}>
          <span className="text-slate-500 block text-[10px] font-bold uppercase">Payment Mode</span>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            {voucher.paymentMode}
          </span>
        </div>
      </div>

      {/* Customer Info */}
      <div className="py-3 border-b border-slate-200 text-xs">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-slate-500 text-[10px] font-bold uppercase block">Received From Customer</span>
            <strong className="text-sm text-slate-900 block">{voucher.customerName}</strong>
            {voucher.customerPhone && (
              <span className="block text-slate-600 font-mono text-xs">Mob: +91 {voucher.customerPhone}</span>
            )}
          </div>
          <div className="text-right">
            <span className="text-slate-500 text-[10px] font-bold uppercase block">Collected By</span>
            <strong className="text-slate-800">{voucher.sellerName || 'Admin'}</strong>
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="py-3.5 space-y-2 text-xs border-b border-slate-200">
        {voucher.totalDueBefore > 0 && (
          <div className="flex justify-between text-slate-600 font-mono">
            <span>Total Pending Due Before:</span>
            <span>₹{voucher.totalDueBefore.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between items-baseline text-base font-black text-slate-900 font-mono pt-1">
          <span>AMOUNT RECEIVED NOW:</span>
          <span className="text-xl text-emerald-700 font-mono">₹{voucher.amountCollected.toFixed(2)}</span>
        </div>
        <div className="text-[11px] text-slate-600 italic">
          Amount in words: {numberToIndianWords(voucher.amountCollected)}
        </div>
        {voucher.paymentMode === 'SPLIT' && (
          <div className="p-2 bg-slate-50 rounded border border-slate-200 text-[11px] flex justify-between">
            <span>Cash: ₹{(voucher.cashAmount || 0).toFixed(2)}</span>
            <span>UPI: ₹{(voucher.upiAmount || 0).toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-xs pt-2 border-t border-dashed border-slate-300 font-mono">
          <span className="font-bold text-slate-700">
            {voucher.remainingDue <= 0 ? 'Payment Settlement Status:' : 'Remaining Balance Due Left:'}
          </span>
          <strong className={voucher.remainingDue <= 0 ? 'text-emerald-700 font-bold' : 'text-amber-700 font-black'}>
            {voucher.remainingDue <= 0 ? 'PAID IN FULL (₹0.00 Cleared ✓)' : `₹${voucher.remainingDue.toFixed(2)} (Due Remaining)`}
          </strong>
        </div>
      </div>

      {voucher.notes && (
        <div className="py-2 text-[11px] text-slate-600 italic">
          Note: {voucher.notes}
        </div>
      )}

      <div className="pt-6 flex justify-between items-end text-[10px] text-slate-500">
        <span>Computer Generated Receipt • Biller Pro</span>
        <div className="text-right">
          <div className="w-28 border-b border-slate-400 mb-1" />
          <span>Authorized Signatory</span>
        </div>
      </div>
    </div>
  );
};

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded: (newProduct: Product) => void;
  onProductDeleted: (productId: number) => void;
  customProducts: Product[];
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  onProductAdded,
  onProductDeleted,
  customProducts,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Auth form state: 'login' | 'forgot'
  const [authMode, setAuthMode] = useState<'login' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [authSuccessMsg, setAuthSuccessMsg] = useState('');
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  // Active admin tab: 'salesHistory' | 'creditCollections' | 'addProduct'
  const [activeTab, setActiveTab] = useState<'salesHistory' | 'creditCollections' | 'addProduct'>('salesHistory');

  // Add Product form state
  const [prodName, setProdName] = useState('');
  const [prodCompany, setProdCompany] = useState<Company>('MAK');
  const [prodCode, setProdCode] = useState('');
  const [prodCategory, setProdCategory] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodHsn, setProdHsn] = useState('');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [productSuccessMsg, setProductSuccessMsg] = useState('');

  // Sales History state
  const [salesRecords, setSalesRecords] = useState<SavedSaleRecord[]>([]);
  const [loadingSales, setLoadingSales] = useState(false);
  const [salesSearchQuery, setSalesSearchQuery] = useState('');
  const [salesFilterMode, setSalesFilterMode] = useState<'ALL' | 'DUE' | 'PARTIAL_DUE' | 'PAID'>('ALL');

  // Credit Collections state
  const [creditCollections, setCreditCollections] = useState<CreditCollectionRecord[]>([]);
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [collectionsSearchQuery, setCollectionsSearchQuery] = useState('');
  const [collectionsFilterMode, setCollectionsFilterMode] = useState<'ALL' | 'DUE_REMAINING' | 'SETTLED'>('ALL');

  // Credit Collection Voucher Slip Preview & Direct Download state
  const [previewVoucher, setPreviewVoucher] = useState<CreditCollectionRecord | null>(null);
  const [directCaptureVoucher, setDirectCaptureVoucher] = useState<CreditCollectionRecord | null>(null);
  const [isDownloadingVoucherId, setIsDownloadingVoucherId] = useState<string | null>(null);
  const [isGeneratingVoucherFromPreview, setIsGeneratingVoucherFromPreview] = useState(false);
  const [deletingVoucherId, setDeletingVoucherId] = useState<string | null>(null);
  const voucherPreviewCaptureRef = useRef<HTMLDivElement>(null);
  const voucherDirectCaptureRef = useRef<HTMLDivElement>(null);

  // Record Credit Collection Popup Dialog state
  const [collectingSale, setCollectingSale] = useState<SavedSaleRecord | null>(null);
  const [isOpeningNewCollection, setIsOpeningNewCollection] = useState(false);
  const [collectCustomerName, setCollectCustomerName] = useState('');
  const [collectCustomerPhone, setCollectCustomerPhone] = useState('');
  const [collectTotalDue, setCollectTotalDue] = useState('');
  const [collectAmount, setCollectAmount] = useState('');
  const [collectPaymentMode, setCollectPaymentMode] = useState<'CASH' | 'UPI' | 'SPLIT'>('CASH');
  const [collectCashPart, setCollectCashPart] = useState('');
  const [collectUpiPart, setCollectUpiPart] = useState('');
  const [collectNotes, setCollectNotes] = useState('');
  const [isSubmittingCollection, setIsSubmittingCollection] = useState(false);

  // Status change state for DUE to PAID
  const [settlingSale, setSettlingSale] = useState<SavedSaleRecord | null>(null);
  const [settleMode, setSettleMode] = useState<PaymentMode>('CASH');
  const [settleNote, setSettleNote] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // View Items state: track which sale cards have itemized breakdown expanded
  const [expandedSaleIds, setExpandedSaleIds] = useState<Set<string>>(new Set());

  // Slip Preview & Direct Download state
  const [previewSlipSale, setPreviewSlipSale] = useState<SavedSaleRecord | null>(null);
  const [activeSlipSale, setActiveSlipSale] = useState<SavedSaleRecord | null>(null);
  const [isDownloadingSlipId, setIsDownloadingSlipId] = useState<string | null>(null);
  const [isGeneratingSlipFromPreview, setIsGeneratingSlipFromPreview] = useState(false);
  const slipPreviewCaptureRef = useRef<HTMLDivElement>(null);
  const captureSlipRef = useRef<HTMLDivElement>(null);

  // Delete Payment Record state
  const [deletingSaleId, setDeletingSaleId] = useState<string | null>(null);
  const [salesActionSuccessMsg, setSalesActionSuccessMsg] = useState('');

  // Listen for auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const loadSales = async () => {
    setLoadingSales(true);
    const data = await getSalesHistory(150);
    setSalesRecords(data);
    setLoadingSales(false);
  };

  const loadCollections = async () => {
    setLoadingCollections(true);
    const data = await getCreditCollections(150);
    setCreditCollections(data);
    setLoadingCollections(false);
  };

  // Fetch sales records & credit collections when admin is open
  useEffect(() => {
    if (isOpen && currentUser) {
      const timer = setTimeout(() => {
        loadSales();
        loadCollections();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, currentUser, activeTab]);

  const handleFirebaseError = (err: unknown) => {
    const errorObj = err as { code?: string; message?: string };
    const code = errorObj?.code || '';
    if (code === 'auth/operation-not-allowed') {
      setLoginError(
        'Email/Password sign-in is disabled in Firebase Console. Go to Firebase Console -> Authentication -> Sign-in method -> Enable Email/Password.'
      );
    } else if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
      setLoginError('Incorrect email or password. Please verify and try again.');
    } else if (code === 'auth/user-not-found') {
      setLoginError('No admin account found with this email address.');
    } else if (code === 'auth/invalid-email') {
      setLoginError('Please enter a valid email address.');
    } else if (code === 'auth/too-many-requests') {
      setLoginError('Too many failed attempts. Access is temporarily disabled. Please wait a moment.');
    } else if (code === 'auth/network-request-failed') {
      setLoginError('Network connection error. Please verify your internet connection.');
    } else {
      setLoginError(errorObj?.message || 'Authentication failed. Please try again.');
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setAuthSuccessMsg('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setLoginError('Please enter a valid email address.');
      return;
    }

    if (authMode === 'forgot') {
      setIsSubmittingAuth(true);
      try {
        await sendPasswordResetEmail(auth, trimmedEmail);
        setAuthSuccessMsg(`Password reset link sent to ${trimmedEmail}! Please check your email inbox.`);
      } catch (err: unknown) {
        console.error(err);
        handleFirebaseError(err);
      } finally {
        setIsSubmittingAuth(false);
      }
      return;
    }

    if (!password) {
      setLoginError('Please enter your password.');
      return;
    }

    // Sign in flow
    setIsSubmittingAuth(true);
    try {
      await signInWithEmailAndPassword(auth, trimmedEmail, password);
      setEmail('');
      setPassword('');
    } catch (err: unknown) {
      console.error(err);
      handleFirebaseError(err);
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) {
      alert('Please enter a product name');
      return;
    }

    setIsAddingProduct(true);
    setProductSuccessMsg('');

    try {
      const created = await addCustomProduct({
        name: prodName.trim(),
        company: prodCompany,
        productCode: prodCode.trim() || undefined,
        category: prodCategory.trim() || undefined,
        unitPrice: parseFloat(prodPrice) || 0,
        hsn: prodHsn.trim() || undefined,
      });

      if (created) {
        onProductAdded(created);
        setProductSuccessMsg(`"${created.name}" added successfully to ${created.company}!`);
        setProdName('');
        setProdCode('');
        setProdCategory('');
        setProdPrice('');
        setProdHsn('');

        setTimeout(() => setProductSuccessMsg(''), 4000);
      }
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Unknown error';
      alert('Failed to add product: ' + msg);
    } finally {
      setIsAddingProduct(false);
    }
  };

  const handleDeleteProduct = async (prod: Product) => {
    if (!prod.firestoreDocId) return;
    if (!confirm(`Are you sure you want to delete "${prod.name}"?`)) return;

    const ok = await deleteCustomProduct(prod.firestoreDocId);
    if (ok) {
      onProductDeleted(prod.id);
    } else {
      alert('Failed to delete product from database.');
    }
  };

  const handleInitiateSettle = (sale: SavedSaleRecord) => {
    setSettlingSale(sale);
    setSettleMode(sale.paymentMode === 'DUE' ? 'CASH' : sale.paymentMode);
    setSettleNote('');
  };

  const handleConfirmStatusChange = async () => {
    if (!settlingSale || !settlingSale.id) return;
    setIsUpdatingStatus(true);
    try {
      const ok = await updateSalePaymentMode(
        settlingSale.id, 
        settleMode, 
        settleMode === 'CASH' ? settlingSale.grandTotal : undefined,
        settleNote
      );
      if (ok) {
        setSalesRecords((prev) =>
          prev.map((s) =>
            s.id === settlingSale.id
              ? { 
                  ...s, 
                  paymentMode: settleMode, 
                  balanceDue: settleMode === 'DUE' ? s.grandTotal : 0 
                }
              : s
          )
        );
        setSettlingSale(null);
        setSettleNote('');
      } else {
        alert('Failed to update status in database.');
      }
    } catch (err) {
      console.error('Failed to change status:', err);
      alert('An error occurred while updating status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const toggleExpandSale = (id: string) => {
    setExpandedSaleIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getInvoiceItemsForSale = (sale: SavedSaleRecord): InvoiceItem[] => {
    return (sale.items || []).map((it, idx) => ({
      id: `item-${sale.id || 'sale'}-${idx}`,
      productId: idx + 1,
      name: it.name || 'Product',
      company: (it.company as Company) || sale.company || 'MAK',
      productCode: it.productCode || '',
      rate: it.rate || 0,
      rateStr: String(it.rate || 0),
      qty: it.qty || 1,
      discount: it.discount || 0,
      discountStr: String(it.discount || 0),
      discountType: it.discountType || 'percentage',
      grossAmount: it.grossAmount ?? ((it.rate || 0) * (it.qty || 1)),
      discountAmount: it.discountAmount ?? 0,
      totalAmount: it.totalAmount ?? ((it.rate || 0) * (it.qty || 1)),
    }));
  };

  const handleDownloadSlip = async (sale: SavedSaleRecord) => {
    const saleKey = sale.id || sale.invoiceNumber;
    setIsDownloadingSlipId(saleKey);
    setActiveSlipSale(sale);

    try {
      // Allow PrintableBill DOM element to mount and render with sale's data
      await new Promise((resolve) => setTimeout(resolve, 200));

      const el = captureSlipRef.current;
      if (!el) {
        throw new Error('Capture element not ready');
      }

      const dataUrl = await toPng(el, {
        quality: 0.98,
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#ffffff',
      });

      const downloadLink = document.createElement('a');
      downloadLink.download = `Bill_${sale.company || 'MAK'}_${sale.invoiceNumber}.png`;
      downloadLink.href = dataUrl;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      setSalesActionSuccessMsg(`Bill Slip #${sale.invoiceNumber} downloaded successfully!`);
      setTimeout(() => setSalesActionSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Direct slip capture failed, opening preview modal instead:', err);
      // Fallback: open the preview modal where the user can inspect & print
      setPreviewSlipSale(sale);
    } finally {
      setIsDownloadingSlipId(null);
    }
  };

  const handleDownloadSlipFromPreview = async () => {
    if (!previewSlipSale || !slipPreviewCaptureRef.current) return;
    setIsGeneratingSlipFromPreview(true);
    try {
      const dataUrl = await toPng(slipPreviewCaptureRef.current, {
        quality: 0.98,
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#ffffff',
      });
      const downloadLink = document.createElement('a');
      downloadLink.download = `Bill_${previewSlipSale.company || 'MAK'}_${previewSlipSale.invoiceNumber}.png`;
      downloadLink.href = dataUrl;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      setSalesActionSuccessMsg(`Bill Slip #${previewSlipSale.invoiceNumber} downloaded successfully!`);
      setTimeout(() => setSalesActionSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed to capture slip from preview:', err);
      alert('Unable to capture slip as image. Please use the Print Slip option.');
    } finally {
      setIsGeneratingSlipFromPreview(false);
    }
  };

  const handlePrintSlipFromPreview = () => {
    if (!slipPreviewCaptureRef.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups in your browser to print invoice slip.');
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Retail Bill Slip - ${previewSlipSale?.invoiceNumber || ''}</title>
          <style>
            @page { margin: 8mm; size: auto; }
            body { margin: 0; padding: 0; background: #ffffff; font-family: system-ui, -apple-system, sans-serif; }
          </style>
        </head>
        <body>
          ${slipPreviewCaptureRef.current.innerHTML}
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDeleteSale = async (sale: SavedSaleRecord) => {
    if (!sale.id) {
      alert('Unable to identify record ID.');
      return;
    }

    const isConfirmed = window.confirm(
      `Are you sure you want to permanently delete this bill?\n\n` +
      `Invoice #: ${sale.invoiceNumber}\n` +
      `Customer: ${sale.customerName}\n` +
      `Total: ₹${sale.grandTotal}\n` +
      `Payment Mode: ${sale.paymentMode}\n\n` +
      `This will permanently remove the payment record from Firebase cloud database and recalculate totals.`
    );
    if (!isConfirmed) return;

    setDeletingSaleId(sale.id);
    try {
      const ok = await deleteSaleRecord(sale.id);
      if (ok) {
        setSalesRecords((prev) => prev.filter((s) => s.id !== sale.id));
        setSalesActionSuccessMsg(`Invoice #${sale.invoiceNumber} permanently deleted.`);
        setTimeout(() => setSalesActionSuccessMsg(''), 4000);
      } else {
        alert('Failed to delete payment record from database.');
      }
    } catch (err: unknown) {
      console.error('Delete error:', err);
      const msg = (err as { message?: string })?.message || 'Unknown error';
      alert('Error while deleting: ' + msg);
    } finally {
      setDeletingSaleId(null);
    }
  };

  // Credit Collection Voucher Download Handlers
  const handleDownloadVoucherSlip = async (col: CreditCollectionRecord) => {
    const voucherKey = col.id || col.voucherNumber;
    setIsDownloadingVoucherId(voucherKey);
    setDirectCaptureVoucher(col);

    try {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const el = voucherDirectCaptureRef.current;
      if (!el) throw new Error('Voucher capture element not ready');

      const dataUrl = await toPng(el, {
        quality: 0.98,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });

      const downloadLink = document.createElement('a');
      downloadLink.download = `Voucher_${col.voucherNumber}.png`;
      downloadLink.href = dataUrl;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      setSalesActionSuccessMsg(`Payment Voucher Slip #${col.voucherNumber} downloaded successfully!`);
      setTimeout(() => setSalesActionSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Direct voucher capture failed, opening preview modal instead:', err);
      setPreviewVoucher(col);
    } finally {
      setIsDownloadingVoucherId(null);
    }
  };

  const handleDownloadVoucherFromPreview = async () => {
    if (!previewVoucher || !voucherPreviewCaptureRef.current) return;
    setIsGeneratingVoucherFromPreview(true);
    try {
      const dataUrl = await toPng(voucherPreviewCaptureRef.current, {
        quality: 0.98,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });
      const downloadLink = document.createElement('a');
      downloadLink.download = `Voucher_${previewVoucher.voucherNumber}.png`;
      downloadLink.href = dataUrl;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      setSalesActionSuccessMsg(`Payment Voucher Slip #${previewVoucher.voucherNumber} downloaded successfully!`);
      setTimeout(() => setSalesActionSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed to capture voucher from preview:', err);
      alert('Unable to capture voucher slip as image. Please use Print Slip.');
    } finally {
      setIsGeneratingVoucherFromPreview(false);
    }
  };

  const handlePrintVoucherFromPreview = () => {
    if (!voucherPreviewCaptureRef.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups in your browser to print payment voucher slip.');
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payment Voucher Slip - ${previewVoucher?.voucherNumber || ''}</title>
          <style>
            @page { margin: 8mm; size: auto; }
            body { margin: 0; padding: 20px; background: #ffffff; font-family: system-ui, -apple-system, sans-serif; display: flex; justify-content: center; }
          </style>
        </head>
        <body>
          ${voucherPreviewCaptureRef.current.innerHTML}
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDeleteCollectionRecord = async (col: CreditCollectionRecord) => {
    if (!col.id) return;
    const isConfirmed = window.confirm(
      `Are you sure you want to delete Payment Record #${col.voucherNumber}?\n\n` +
      `Customer: ${col.customerName}\n` +
      `Amount Collected: ${formatCurrency(col.amountCollected)}\n` +
      `Date: ${col.date} ${col.time}`
    );
    if (!isConfirmed) return;

    setDeletingVoucherId(col.id);
    try {
      const ok = await deleteCreditCollectionRecord(col.id);
      if (ok) {
        setCreditCollections((prev) => prev.filter((c) => c.id !== col.id));
        setSalesActionSuccessMsg(`Payment Record #${col.voucherNumber} deleted.`);
        setTimeout(() => setSalesActionSuccessMsg(''), 4000);
      } else {
        alert('Failed to delete payment record from database.');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Error while deleting payment record.');
    } finally {
      setDeletingVoucherId(null);
    }
  };

  // Helper to compute pending balance due for any sale record
  const getSalePendingDue = (sale: SavedSaleRecord): number => {
    // 1. Fully settled payment modes are ALWAYS 0 due
    if (sale.paymentMode === 'CASH' || sale.paymentMode === 'UPI' || sale.paymentMode === 'CARD') {
      return 0;
    }

    // 2. Explicitly zeroed out balanceDue is 0 due
    if (sale.balanceDue === 0) {
      return 0;
    }

    // 3. Cross-reference linked credit collection vouchers
    const cleanInv = (sale.invoiceNumber || '').trim().toLowerCase().replace(/^#/, '');
    const cleanCust = (sale.customerName || '').trim().toLowerCase();

    const linked = creditCollections.filter((c) => {
      if (c.invoiceId && sale.id && c.invoiceId === sale.id) return true;
      const cInv = (c.invoiceNumber || '').trim().toLowerCase().replace(/^#/, '');
      if (cInv && cleanInv && cInv === cleanInv) return true;
      if (!cInv && cleanCust && (c.customerName || '').trim().toLowerCase() === cleanCust) return true;
      return false;
    });

    if (linked.length > 0) {
      // If ANY collection against this bill or customer has cleared the balance:
      if (linked.some((c) => c.remainingDue <= 0)) {
        return 0;
      }

      // Check total paid (initial + all collections)
      const totalCollected = linked.reduce((sum, c) => sum + (c.amountCollected || 0), 0);
      const initialPaid = (sale.cashReceived || 0) + (sale.upiReceived || 0);
      const totalPaid = initialPaid + totalCollected;

      if (totalPaid >= (sale.grandTotal || 0)) {
        return 0;
      }

      // Return the lowest remaining due recorded across vouchers
      const minDue = Math.min(...linked.map((c) => c.remainingDue));
      return Math.max(0, Math.min(minDue, (sale.grandTotal || 0) - totalPaid));
    }

    // 4. If explicit balanceDue is set on the sale document (> 0)
    if (sale.balanceDue !== undefined && sale.balanceDue !== null) {
      return Math.max(0, sale.balanceDue);
    }

    // 5. Fallback calculation by paymentMode
    if (sale.paymentMode === 'DUE') {
      return sale.grandTotal || 0;
    }

    if (sale.paymentMode === 'CASH_UPI_CREDIT') {
      const paid = (sale.cashReceived || 0) + (sale.upiReceived || 0);
      return Math.max(0, (sale.grandTotal || 0) - paid);
    }

    return 0;
  };

  // Open Quick Credit Collection popup
  const handleInitiateCreditCollection = (sale?: SavedSaleRecord) => {
    if (sale) {
      setCollectingSale(sale);
      setCollectCustomerName(sale.customerName || '');
      setCollectCustomerPhone(sale.customerPhone || '');
      const due = getSalePendingDue(sale);
      setCollectTotalDue(String(due));
      setCollectAmount(String(due));
      setCollectCashPart(String(due));
      setCollectUpiPart('');
    } else {
      setCollectingSale(null);
      setCollectCustomerName('');
      setCollectCustomerPhone('');
      setCollectTotalDue('');
      setCollectAmount('');
      setCollectCashPart('');
      setCollectUpiPart('');
    }
    setCollectPaymentMode('CASH');
    setCollectNotes('');
    setIsOpeningNewCollection(true);
  };

  // Submit Credit Collection
  const handleSubmitAdminCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    const collectNum = parseFloat(collectAmount) || 0;
    const dueNum = parseFloat(collectTotalDue) || 0;
    if (!collectCustomerName.trim()) {
      alert('Please enter a customer name.');
      return;
    }
    if (collectNum <= 0) {
      alert('Please enter a collection amount greater than ₹0.');
      return;
    }

    const cashNum = parseFloat(collectCashPart) || 0;
    const upiNum = parseFloat(collectUpiPart) || 0;
    if (collectPaymentMode === 'SPLIT' && (cashNum + upiNum) !== collectNum) {
      alert(`Split Cash (₹${cashNum}) + UPI (₹${upiNum}) must equal Total Collected (₹${collectNum})`);
      return;
    }

    const remainingDue = Math.max(0, dueNum - collectNum);
    setIsSubmittingCollection(true);

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
        invoiceId: collectingSale?.id,
        invoiceNumber: collectingSale?.invoiceNumber || '',
        customerName: collectCustomerName.trim(),
        customerPhone: collectCustomerPhone.trim(),
        sellerName: 'Admin',
        totalDueBefore: dueNum,
        amountCollected: collectNum,
        remainingDue,
        paymentMode: collectPaymentMode,
        cashAmount: collectPaymentMode === 'CASH' ? collectNum : collectPaymentMode === 'SPLIT' ? cashNum : undefined,
        upiAmount: collectPaymentMode === 'UPI' ? collectNum : collectPaymentMode === 'SPLIT' ? upiNum : undefined,
        notes: collectNotes.trim(),
        date: dateStr,
        time: timeStr,
      };

      const docId = await saveCreditCollection(record);
      record.id = docId || undefined;

      // Close input modal and open slip preview
      setIsOpeningNewCollection(false);
      setCollectingSale(null);
      setPreviewVoucher(record);

      setSalesActionSuccessMsg(
        `Credit payment of ${formatCurrency(collectNum)} recorded successfully! Remaining Due Left: ${formatCurrency(remainingDue)}`
      );
      setTimeout(() => setSalesActionSuccessMsg(''), 5000);

      // Refresh data
      loadSales();
      loadCollections();
    } catch (err) {
      console.error('Error saving credit collection:', err);
      alert('Failed to save credit payment. Please try again.');
    } finally {
      setIsSubmittingCollection(false);
    }
  };

  // Filtered sales
  const filteredSales = salesRecords.filter((sale) => {
    const currentDue = getSalePendingDue(sale);
    const isDueSale = currentDue > 0;
    const isPartialDue = isDueSale && currentDue < (sale.grandTotal || 0);

    if (salesFilterMode === 'DUE' && !isDueSale) return false;
    if (salesFilterMode === 'PARTIAL_DUE' && !isPartialDue) return false;
    if (salesFilterMode === 'PAID' && isDueSale) return false;

    if (!salesSearchQuery.trim()) return true;
    const q = salesSearchQuery.toLowerCase();
    return (
      sale.invoiceNumber.toLowerCase().includes(q) ||
      sale.customerName.toLowerCase().includes(q) ||
      (sale.sellerName && sale.sellerName.toLowerCase().includes(q)) ||
      sale.customerPhone.includes(q) ||
      sale.paymentMode.toLowerCase().includes(q)
    );
  });

  // Helper to determine if a credit collection voucher represents a cleared / settled balance
  const isCollectionCleared = (col: CreditCollectionRecord): boolean => {
    // 1. If voucher itself was recorded with remainingDue <= 0:
    if (col.remainingDue <= 0) return true;

    const cleanInv = (col.invoiceNumber || '').trim().toLowerCase().replace(/^#/, '');
    const cleanCust = (col.customerName || '').trim().toLowerCase();

    // 2. Check if linked sale invoice is fully paid / cleared:
    if (cleanInv || col.invoiceId) {
      const linkedSale = salesRecords.find((s) => {
        if (col.invoiceId && s.id === col.invoiceId) return true;
        const sInv = (s.invoiceNumber || '').trim().toLowerCase().replace(/^#/, '');
        if (cleanInv && sInv && cleanInv === sInv) return true;
        return false;
      });
      if (linkedSale && getSalePendingDue(linkedSale) === 0) {
        return true;
      }
    }

    // 3. Check if any OTHER collection voucher for the same invoice/customer cleared the balance:
    const otherCols = creditCollections.filter((c) => {
      if (c.id === col.id || c.voucherNumber === col.voucherNumber) return false;
      const cInv = (c.invoiceNumber || '').trim().toLowerCase().replace(/^#/, '');
      if (cleanInv && cInv && cleanInv === cInv) return true;
      if (!cleanInv && cleanCust && (c.customerName || '').trim().toLowerCase() === cleanCust) return true;
      return false;
    });

    if (otherCols.some((c) => c.remainingDue <= 0)) {
      return true;
    }

    return false;
  };

  // Filtered credit collections
  const filteredCollections = creditCollections.filter((col) => {
    const isCleared = isCollectionCleared(col);
    if (collectionsFilterMode === 'DUE_REMAINING' && isCleared) return false;
    if (collectionsFilterMode === 'SETTLED' && !isCleared) return false;
    if (!collectionsSearchQuery.trim()) return true;
    const q = collectionsSearchQuery.toLowerCase();
    return (
      col.voucherNumber.toLowerCase().includes(q) ||
      col.customerName.toLowerCase().includes(q) ||
      (col.customerPhone && col.customerPhone.includes(q)) ||
      (col.invoiceNumber && col.invoiceNumber.toLowerCase().includes(q)) ||
      (col.sellerName && col.sellerName.toLowerCase().includes(q)) ||
      col.paymentMode.toLowerCase().includes(q)
    );
  });

  // Calculate totals
  const totalSalesRevenue = salesRecords.reduce((acc, s) => acc + (s.grandTotal || 0), 0);
  const totalDuePending = salesRecords.reduce((acc, s) => {
    const due = getSalePendingDue(s);
    return acc + (due > 0 ? due : 0);
  }, 0);
  const totalCreditCollected = creditCollections.reduce((acc, c) => acc + (c.amountCollected || 0), 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150">
      {loadingAuth ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-10 text-center shadow-2xl flex flex-col items-center justify-center gap-3">
          <div className="w-6 h-6 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
          <p className="text-xs text-slate-400">Connecting to Firebase...</p>
        </div>
      ) : !currentUser ? (
        /* ========================================================
           AUTHENTICATION MODAL DIALOG (LOGIN & FORGOT PASSWORD)
           ======================================================== */
        <div className="relative bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-[500px] shadow-2xl overflow-hidden flex flex-col text-slate-100 ring-1 ring-white/10 animate-in zoom-in-95 duration-150">
          
          {/* Close button in top-right */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer z-10"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header (Centered Hero Brand) */}
          <div className="pt-9 pb-6 px-8 sm:px-10 flex flex-col items-center text-center border-b border-slate-800/80 bg-slate-900/60">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border mb-3.5 shadow-lg ${
              authMode === 'forgot'
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 shadow-amber-500/10'
                : 'bg-sky-500/15 text-sky-400 border-sky-500/30 shadow-sky-500/10'
            }`}>
              {authMode === 'forgot' ? (
                <KeyRound className="w-7 h-7" />
              ) : (
                <Lock className="w-7 h-7" />
              )}
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {authMode === 'forgot' ? 'Reset Password' : 'Admin Portal'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xs leading-relaxed">
              {authMode === 'forgot'
                ? 'Enter your email to receive a password reset link'
                : 'Sign in to access store controls, products & cloud sales'}
            </p>
          </div>

          {/* Modal Body with Generous Padding */}
          <div className="p-8 sm:p-10 bg-slate-950/60 flex flex-col gap-6">
            {loginError && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs font-medium flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span className="leading-relaxed">{loginError}</span>
              </div>
            )}

            {authSuccessMsg && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-medium flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                <span className="leading-relaxed">{authSuccessMsg}</span>
              </div>
            )}

            {authMode === 'forgot' ? (
              <form onSubmit={handleAuthSubmit} className="flex flex-col gap-5">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Enter your registered admin email address. We will send you a secure link to reset your password.
                </p>

                <div>
                  <label htmlFor="admin-email-reset" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Admin Email Address
                  </label>
                  <div className="flex items-center w-full h-12 px-4.5 sm:px-5 bg-slate-900 border border-slate-700/80 rounded-xl focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/20 shadow-xs transition-all">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0 mr-3" />
                    <input
                      id="admin-email-reset"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="admin@makboss.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (loginError) setLoginError('');
                      }}
                      className="w-full bg-transparent px-1 text-sm text-slate-100 placeholder-slate-500 outline-none font-medium"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingAuth}
                  className="mt-2 w-full h-12 rounded-xl font-semibold text-sm text-white bg-sky-600 hover:bg-sky-500 active:bg-sky-700 shadow-lg shadow-sky-600/25 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmittingAuth ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Sending link...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      <span>Send Reset Link</span>
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setLoginError('');
                      setAuthSuccessMsg('');
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Sign In</span>
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleAuthSubmit} className="flex flex-col gap-5">
                {/* Email Field */}
                <div>
                  <label htmlFor="admin-email-input" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <div className="flex items-center w-full h-12 px-4.5 sm:px-5 bg-slate-900 border border-slate-700/80 rounded-xl focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/20 shadow-xs transition-all">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0 mr-3" />
                    <input
                      id="admin-email-input"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="admin@makboss.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (loginError) setLoginError('');
                      }}
                      className="w-full bg-transparent px-1 text-sm text-slate-100 placeholder-slate-500 outline-none font-medium"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="admin-password-input" className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('forgot');
                        setLoginError('');
                        setAuthSuccessMsg('');
                      }}
                      className="text-xs text-sky-400 hover:text-sky-300 font-semibold transition-colors cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="flex items-center w-full h-12 px-4.5 sm:px-5 bg-slate-900 border border-slate-700/80 rounded-xl focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/20 shadow-xs transition-all">
                    <Lock className="w-4 h-4 text-slate-400 shrink-0 mr-3" />
                    <input
                      id="admin-password-input"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (loginError) setLoginError('');
                      }}
                      className="w-full bg-transparent px-1 text-sm text-slate-100 placeholder-slate-500 outline-none font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer shrink-0 ml-1.5"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmittingAuth}
                  className="mt-3 w-full h-12 rounded-xl font-semibold text-sm text-white bg-sky-600 hover:bg-sky-500 active:bg-sky-700 shadow-lg shadow-sky-600/25 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmittingAuth ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Sign In to Admin Panel</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-8 py-4 sm:px-10 sm:py-4.5 border-t border-slate-800/80 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-2 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Firebase Protected
            </span>
            <span className="font-mono text-[11px] text-slate-400">biller-pro</span>
          </div>
        </div>
      ) : (
        /* ========================================================
           AUTHENTICATED ADMIN DASHBOARD
           ======================================================== */
        <div className="relative bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100 ring-1 ring-white/10 animate-in zoom-in-95 duration-150">
          
          {/* Dashboard Header */}
          <div className="flex items-center justify-between px-6 py-5 sm:px-9 sm:py-6 border-b border-slate-800 bg-slate-900 shrink-0">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 flex items-center justify-center shrink-0 shadow-inner">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  Admin &amp; Store Management
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                    Live Firebase
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Logged in as: <span className="text-slate-300 font-medium">{currentUser.email}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 transition-colors cursor-pointer"
                title="Log out of Admin"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation / Tabs Bar (Sticky below header) */}
          <div className="px-6 sm:px-9 py-3.5 bg-slate-900/90 border-b border-slate-800 shrink-0">
            <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-950/70 border border-slate-800 rounded-2xl">
              <button
                type="button"
                onClick={() => setActiveTab('salesHistory')}
                className={`flex items-center justify-center gap-2 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                  activeTab === 'salesHistory'
                    ? 'bg-slate-800 text-sky-400 shadow-sm border border-slate-700/80 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Sales &amp; Invoices ({salesRecords.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('creditCollections')}
                className={`flex items-center justify-center gap-2 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer relative ${
                  activeTab === 'creditCollections'
                    ? 'bg-slate-800 text-amber-400 shadow-sm border border-slate-700/80 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <HandCoins className="w-4 h-4" />
                <span>Credit Payments</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
                  activeTab === 'creditCollections' 
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/35' 
                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}>
                  {creditCollections.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('addProduct')}
                className={`flex items-center justify-center gap-2 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                  activeTab === 'addProduct'
                    ? 'bg-slate-800 text-sky-400 shadow-sm border border-slate-700/80 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>Products ({customProducts.length})</span>
              </button>
            </div>
          </div>

          {/* Modal Body with Generous Margins & Padding */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-9 bg-slate-950/40 custom-scrollbar">
            <div className="flex flex-col gap-8">

              {/* TAB 1: ADD NEW PRODUCT */}
              {activeTab === 'addProduct' && (
                <div className="flex flex-col gap-8">
                  {/* Form Container Card */}
                  <div className="p-7 sm:p-9 rounded-2xl bg-slate-900/90 border border-slate-700/70 shadow-xl flex flex-col gap-7">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-5 border-b border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/25 flex items-center justify-center shrink-0">
                          <Package className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-base sm:text-lg font-bold text-white tracking-tight">
                            Add Product to Store (Firebase Cloud)
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5">
                            New items are immediately accessible across billing catalogs
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-slate-400 self-start sm:self-auto">
                        Cloud Sync Enabled
                      </span>
                    </div>

                    {productSuccessMsg && (
                      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-semibold flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                        <span>{productSuccessMsg}</span>
                      </div>
                    )}

                    <form onSubmit={handleCreateProduct} className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-7">
                      {/* Product Name */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2.5">
                          Product Name <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. MAK Titanium 15W-40 5L or BOSS Disc Brake Pad"
                          value={prodName}
                          onChange={(e) => setProdName(e.target.value)}
                          className="w-full h-12 px-4.5 sm:px-5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all font-medium"
                        />
                      </div>

                      {/* Brand / Division Toggle */}
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2.5">
                          Brand / Division <span className="text-rose-400">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setProdCompany('MAK')}
                            className={`flex items-center justify-center gap-2 h-12 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                              prodCompany === 'MAK'
                                ? 'bg-amber-600/20 border-amber-500/60 text-amber-300 ring-2 ring-amber-500/20 shadow-xs'
                                : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                            }`}
                          >
                            <Flame className="w-4 h-4 text-amber-400 shrink-0" />
                            <span>MAK (MAK &amp; Honda)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setProdCompany('BOSS')}
                            className={`flex items-center justify-center gap-2 h-12 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                              prodCompany === 'BOSS'
                                ? 'bg-sky-600/20 border-sky-500/60 text-sky-300 ring-2 ring-sky-500/20 shadow-xs'
                                : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                            }`}
                          >
                            <Shield className="w-4 h-4 text-sky-400 shrink-0" />
                            <span>BOSS Automotive</span>
                          </button>
                        </div>
                      </div>

                      {/* Product Code */}
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2.5">
                          Product Code / Part No.
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. MAK-TIT-15W40 or 0986AB..."
                          value={prodCode}
                          onChange={(e) => setProdCode(e.target.value)}
                          className="w-full h-12 px-4.5 sm:px-5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all font-mono"
                        />
                      </div>

                      {/* Category */}
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2.5">
                          Category
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Engine Oil, Brake Fluid, Filter"
                          value={prodCategory}
                          onChange={(e) => setProdCategory(e.target.value)}
                          className="w-full h-12 px-4.5 sm:px-5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all font-medium"
                        />
                      </div>

                      {/* Default Unit Price */}
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2.5">
                          Default Unit Price (₹)
                        </label>
                        <div className="flex items-center h-12 px-4.5 sm:px-5 bg-slate-950/80 border border-slate-700/80 rounded-xl focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/20 transition-all">
                          <span className="text-slate-400 font-semibold mr-2.5 text-sm">₹</span>
                          <input
                            type="number"
                            step="any"
                            placeholder="0.00"
                            value={prodPrice}
                            onChange={(e) => setProdPrice(e.target.value)}
                            className="w-full bg-transparent px-1 text-sm text-white placeholder-slate-500 outline-none font-semibold"
                          />
                        </div>
                      </div>

                      {/* Submit Button */}
                      <div className="sm:col-span-2 flex justify-end pt-5 border-t border-slate-800">
                        <button
                          type="submit"
                          disabled={isAddingProduct}
                          className="flex items-center justify-center gap-2 px-8 h-12 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 shadow-md shadow-emerald-600/25 transition-all cursor-pointer disabled:opacity-50"
                        >
                          <PlusCircle className="w-4 h-4" />
                          <span>{isAddingProduct ? 'Saving to Firebase...' : 'Save Product to Firebase'}</span>
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Existing Custom Products List Card */}
                  <div className="p-7 sm:p-9 rounded-2xl bg-slate-900/90 border border-slate-700/70 shadow-xl flex flex-col gap-5">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                      <h4 className="text-base font-bold text-white flex items-center gap-2.5">
                        <span>Custom Added Products in Firebase</span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/25">
                          {customProducts.length} items
                        </span>
                      </h4>
                    </div>

                    {customProducts.length === 0 ? (
                      <div className="p-10 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-2xl">
                        No custom products added yet. Products added here will sync to Firebase and merge with your static catalog.
                      </div>
                    ) : (
                      <div className="max-h-72 overflow-y-auto custom-scrollbar divide-y divide-slate-800/80 border border-slate-800 rounded-2xl">
                        {customProducts.map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center justify-between p-4 hover:bg-slate-800/40 transition-colors gap-3"
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <span
                                className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                                  p.company === 'MAK'
                                    ? 'bg-amber-500/10 text-amber-300 border border-amber-500/25'
                                    : 'bg-sky-500/10 text-sky-300 border border-sky-500/25'
                                }`}
                              >
                                {p.company}
                              </span>
                              <div className="flex flex-col min-w-0">
                                <span className="text-sm font-bold text-white truncate">
                                  {p.name}
                                </span>
                                <span className="text-xs text-slate-400 font-mono">
                                  {p.productCode ? `Code: ${p.productCode}` : p.category}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3.5 shrink-0">
                              <span className="text-sm font-semibold text-sky-400">
                                {p.unitPrice ? formatCurrency(p.unitPrice) : 'Manual Rate'}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(p)}
                                className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                title="Delete product"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 1: SALES & INVOICES */}
              {activeTab === 'salesHistory' && (
                <div className="flex flex-col gap-7">
                  {/* Financial Overview Cards (4 Cards Grid) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div 
                      onClick={() => setSalesFilterMode('ALL')}
                      className={`p-5 rounded-2xl bg-slate-900/90 border shadow-sm flex flex-col gap-2 cursor-pointer transition-all ${
                        salesFilterMode === 'ALL' ? 'border-sky-500/60 ring-1 ring-sky-500/20' : 'border-slate-700/70 hover:border-slate-600'
                      }`}
                    >
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Total Cloud Invoices
                      </span>
                      <span className="text-2xl font-extrabold text-white tracking-tight">
                        {salesRecords.length} Bills
                      </span>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-700/70 shadow-sm flex flex-col gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Total Recorded Revenue
                      </span>
                      <span className="text-2xl font-extrabold text-sky-400 tracking-tight">
                        {formatCurrency(totalSalesRevenue)}
                      </span>
                    </div>

                    <div 
                      onClick={() => setSalesFilterMode(salesFilterMode === 'DUE' ? 'ALL' : 'DUE')}
                      className={`p-5 rounded-2xl bg-slate-900/90 border shadow-sm flex flex-col gap-2 cursor-pointer transition-all ${
                        salesFilterMode === 'DUE' ? 'border-rose-500 ring-2 ring-rose-500/30 bg-rose-500/10' : 'border-rose-500/30 hover:border-rose-500/60'
                      }`}
                      title="Click to view only pending due / credit bills"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">
                          Pending Credit / Due
                        </span>
                        <span className="text-[10px] text-rose-400 font-bold underline">
                          {salesFilterMode === 'DUE' ? 'Showing Due' : 'Filter Due →'}
                        </span>
                      </div>
                      <span className="text-2xl font-extrabold text-rose-400 tracking-tight">
                        {formatCurrency(totalDuePending)}
                      </span>
                    </div>

                    <div 
                      onClick={() => setActiveTab('creditCollections')}
                      className="p-5 rounded-2xl bg-slate-900/90 border border-amber-500/30 hover:border-amber-500/60 shadow-sm flex flex-col gap-2 cursor-pointer transition-all group"
                      title="Click to view all credit payment collection vouchers"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                          Credit Collected
                        </span>
                        <span className="text-[10px] text-amber-400 font-bold underline group-hover:text-amber-300">
                          View Payments →
                        </span>
                      </div>
                      <span className="text-2xl font-extrabold text-amber-400 tracking-tight font-mono">
                        {formatCurrency(totalCreditCollected)}
                      </span>
                    </div>
                  </div>

                  {/* Search Bar & Filter Buttons */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 flex items-center h-12 px-4.5 sm:px-5 bg-slate-900/90 border border-slate-700/80 rounded-xl focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/20 transition-all">
                        <Search className="w-4 h-4 text-slate-400 mr-3 shrink-0" />
                        <input
                          type="text"
                          placeholder="Search sales by Invoice #, Customer Name, or Phone..."
                          value={salesSearchQuery}
                          onChange={(e) => setSalesSearchQuery(e.target.value)}
                          className="w-full bg-transparent px-1 text-sm text-white placeholder-slate-500 outline-none font-medium"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => { loadSales(); loadCollections(); }}
                        className="h-12 px-6 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer shrink-0 flex items-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>Refresh</span>
                      </button>
                    </div>

                    {/* Filter Mode Pills */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setSalesFilterMode('ALL')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          salesFilterMode === 'ALL'
                            ? 'bg-sky-500 text-slate-950 shadow-xs'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        All Bills ({salesRecords.length})
                      </button>

                      <button
                        type="button"
                        onClick={() => setSalesFilterMode('DUE')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          salesFilterMode === 'DUE'
                            ? 'bg-rose-500 text-white shadow-xs'
                            : 'bg-slate-800 text-rose-300 hover:bg-rose-500/20'
                        }`}
                      >
                        <span>Pending Due / Credit</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-950/60 font-mono">
                          {salesRecords.filter((s) => getSalePendingDue(s) > 0).length}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSalesFilterMode('PARTIAL_DUE')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          salesFilterMode === 'PARTIAL_DUE'
                            ? 'bg-amber-500 text-slate-950 shadow-xs'
                            : 'bg-slate-800 text-amber-300 hover:bg-amber-500/20'
                        }`}
                      >
                        <span>Partial Paid (With Due Left)</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-950/60 font-mono">
                          {salesRecords.filter((s) => {
                            const d = getSalePendingDue(s);
                            return d > 0 && d < (s.grandTotal || 0);
                          }).length}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSalesFilterMode('PAID')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          salesFilterMode === 'PAID'
                            ? 'bg-emerald-500 text-slate-950 shadow-xs'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        Fully Paid ({salesRecords.filter((s) => getSalePendingDue(s) === 0).length})
                      </button>
                    </div>
                  </div>

                  {/* Action Notification Toast Banner */}
                  {salesActionSuccessMsg && (
                    <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-between gap-2.5 animate-in fade-in duration-150">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                        <span>{salesActionSuccessMsg}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSalesActionSuccessMsg('')}
                        className="text-emerald-400 hover:text-white p-1 rounded-lg hover:bg-emerald-500/20 transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Invoices List */}
                  {loadingSales ? (
                    <div className="p-14 text-center text-xs text-slate-400">
                      Loading sales history from Firestore...
                    </div>
                  ) : filteredSales.length === 0 ? (
                    <div className="p-14 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-2xl">
                      No sales records found. Invoices will automatically appear here whenever you submit and download a bill!
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3.5 max-h-[460px] sm:max-h-[520px] overflow-y-auto custom-scrollbar pr-0.5">
                      {filteredSales.map((sale) => {
                        const saleKey = sale.id || sale.invoiceNumber;
                        const isExpanded = expandedSaleIds.has(saleKey);
                        const isDownloading = isDownloadingSlipId === saleKey;
                        const isDeleting = deletingSaleId === sale.id;

                        const cleanInv = (sale.invoiceNumber || '').trim().toLowerCase().replace(/^#/, '');
                        const cleanCust = (sale.customerName || '').trim().toLowerCase();
                        const linkedCollections = creditCollections.filter((c) => {
                          if (c.invoiceId && sale.id && c.invoiceId === sale.id) return true;
                          const cInv = (c.invoiceNumber || '').trim().toLowerCase().replace(/^#/, '');
                          if (cInv && cleanInv && cInv === cleanInv) return true;
                          if (!cInv && cleanCust && (c.customerName || '').trim().toLowerCase() === cleanCust) return true;
                          return false;
                        });

                        const currentDue = getSalePendingDue(sale);
                        const totalPaidSoFar = Math.max(0, (sale.grandTotal || 0) - currentDue);
                        const isDueSale = currentDue > 0;
                        const isClearedDue = currentDue === 0 && (
                          sale.paymentMode === 'DUE' || 
                          sale.paymentMode === 'CASH_UPI_CREDIT' || 
                          (sale.balanceDue !== undefined && sale.balanceDue !== null) || 
                          linkedCollections.length > 0
                        );

                        return (
                          <div
                            key={saleKey}
                            className={`p-5 rounded-2xl bg-slate-900/90 border transition-all ${
                              isExpanded 
                                ? 'border-sky-500/50 ring-1 ring-sky-500/20 shadow-md' 
                                : isDueSale 
                                ? 'border-amber-500/30 hover:border-amber-500/50 shadow-xs' 
                                : 'border-slate-800 hover:border-slate-700 shadow-xs'
                            } flex flex-col gap-3.5`}
                          >
                            {/* Card Top Row: Invoice #, Badges, Amount & Action Buttons */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-2.5 flex-wrap">
                                <span className="font-mono text-sm font-bold text-sky-400">
                                  #{sale.invoiceNumber}
                                </span>
                                <span
                                  className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                    sale.paymentMode === 'CASH'
                                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/25'
                                      : sale.paymentMode === 'UPI'
                                      ? 'bg-sky-500/10 text-sky-300 border border-sky-500/25'
                                      : sale.paymentMode === 'SPLIT'
                                      ? 'bg-amber-500/10 text-amber-300 border border-amber-500/25'
                                      : sale.paymentMode === 'CASH_UPI_CREDIT'
                                      ? 'bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-purple-500/15 text-amber-300 border border-amber-500/35'
                                      : sale.paymentMode === 'DUE'
                                      ? 'bg-rose-500/10 text-rose-300 border border-rose-500/25'
                                      : 'bg-purple-500/10 text-purple-300 border border-purple-500/25'
                                  }`}
                                >
                                  {sale.paymentMode === 'SPLIT'
                                    ? `SPLIT (Cash: ₹${sale.cashReceived || 0} + UPI: ₹${sale.upiReceived || 0})`
                                    : sale.paymentMode === 'CASH_UPI_CREDIT'
                                    ? (currentDue === 0 ? 'CASH+UPI+CREDIT (CLEARED ✓)' : `CASH+UPI+CREDIT (Due: ₹${currentDue})`)
                                    : sale.paymentMode === 'DUE'
                                    ? (currentDue === 0 ? 'CREDIT CLEARED ✓' : currentDue < (sale.grandTotal || 0) ? `PARTIAL DUE (₹${currentDue} LEFT)` : 'CREDIT / DUE')
                                    : sale.paymentMode}
                                </span>
                                <span className="text-xs text-slate-400">
                                  • {sale.company}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                                <span className="text-base sm:text-lg font-bold text-white font-mono mr-1.5">
                                  {formatCurrency(sale.grandTotal)}
                                </span>

                                {/* Download Slip Button */}
                                <button
                                  type="button"
                                  disabled={isDownloading}
                                  onClick={() => handleDownloadSlip(sale)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 transition-all cursor-pointer disabled:opacity-50"
                                  title="Download Slip (PNG Image)"
                                >
                                  {isDownloading ? (
                                    <div className="w-3.5 h-3.5 border-2 border-sky-400/30 border-t-sky-400 rounded-full animate-spin" />
                                  ) : (
                                    <Download className="w-3.5 h-3.5 text-sky-400" />
                                  )}
                                  <span>Download Slip</span>
                                </button>

                                {/* Slip Preview / Print Button */}
                                <button
                                  type="button"
                                  onClick={() => setPreviewSlipSale(sale)}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition-colors cursor-pointer"
                                  title="Preview & Print Bill Slip"
                                >
                                  <Receipt className="w-3.5 h-3.5 text-sky-400" />
                                  <span className="hidden sm:inline">Preview</span>
                                </button>

                                {/* Action to Accept Credit Payment */}
                                {isDueSale && (
                                  <button
                                    type="button"
                                    onClick={() => handleInitiateCreditCollection(sale)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 shadow-sm transition-all cursor-pointer active:scale-95"
                                    title="Accept credit payment against this invoice"
                                  >
                                    <HandCoins className="w-3.5 h-3.5 text-slate-950" />
                                    <span>Accept Credit</span>
                                  </button>
                                )}

                                {/* Power of Admin to change DUE to PAID */}
                                {isDueSale ? (
                                  <button
                                    type="button"
                                    onClick={() => handleInitiateSettle(sale)}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow-sm transition-all cursor-pointer active:scale-95"
                                    title="Quick 1-Click: Mark this Due bill as fully Paid"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Mark Paid</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleInitiateSettle(sale)}
                                    className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-sky-300 hover:bg-slate-800 transition-colors cursor-pointer border border-slate-800"
                                    title="Admin: Change payment status"
                                  >
                                    Status
                                  </button>
                                )}

                                {/* Delete Payment Record Button */}
                                <button
                                  type="button"
                                  disabled={isDeleting}
                                  onClick={() => handleDeleteSale(sale)}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 hover:border-rose-500/40 transition-all cursor-pointer disabled:opacity-50"
                                  title="Delete Payment Record permanently"
                                >
                                  {isDeleting ? (
                                    <div className="w-3.5 h-3.5 border-2 border-rose-400/30 border-t-rose-400 rounded-full animate-spin" />
                                  ) : (
                                    <Trash2 className="w-3.5 h-3.5" />
                                  )}
                                  <span>Delete</span>
                                </button>
                              </div>
                            </div>

                            {/* Credit & Due Status Banner */}
                            {isDueSale ? (
                              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="px-2 py-0.5 rounded font-extrabold text-[10px] uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/35">
                                      {totalPaidSoFar > 0 ? 'PARTIAL CREDIT PAID' : 'PENDING CREDIT / DUE'}
                                    </span>
                                    <span className="text-slate-300">
                                      Total Bill: <strong className="text-white font-mono">{formatCurrency(sale.grandTotal)}</strong>
                                    </span>
                                    {totalPaidSoFar > 0 && (
                                      <span className="text-emerald-400">
                                        • Paid So Far: <strong className="font-mono">{formatCurrency(totalPaidSoFar)}</strong>
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs">
                                    <span className="text-amber-300 font-bold">
                                      Remaining Due Left to Collect:
                                    </span>{' '}
                                    <strong className="text-sm font-mono text-rose-400 font-black">
                                      {formatCurrency(currentDue)}
                                    </strong>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleInitiateCreditCollection(sale)}
                                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 shadow-sm transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-auto shrink-0 active:scale-95"
                                >
                                  <HandCoins className="w-3.5 h-3.5" />
                                  <span>Accept Credit Payment</span>
                                </button>
                              </div>
                            ) : isClearedDue ? (
                              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between text-xs text-emerald-300">
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                  <span>
                                    <strong>Credit Payment Cleared ✓</strong> — Paid in Full (No Due Left)
                                  </span>
                                </div>
                                {sale.lastCollectionVoucher && (
                                  <span className="font-mono text-[11px] text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30">
                                    Voucher: #{sale.lastCollectionVoucher}
                                  </span>
                                )}
                              </div>
                            ) : null}

                            {/* Linked Credit Collections List */}
                            {linkedCollections.length > 0 && (
                              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col gap-2 text-xs">
                                <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                                  <Receipt className="w-3.5 h-3.5" />
                                  <span>Credit Payments Received Against This Bill ({linkedCollections.length})</span>
                                </span>
                                <div className="flex flex-col gap-1.5">
                                  {linkedCollections.map((col) => (
                                    <div key={col.id || col.voucherNumber} className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-mono font-bold text-sky-300">#{col.voucherNumber}</span>
                                        <span className="text-slate-400">{col.date} {col.time}</span>
                                        <span className="text-emerald-400 font-bold font-mono">Paid {formatCurrency(col.amountCollected)}</span>
                                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700 font-bold">{col.paymentMode}</span>
                                        <span className={`text-[11px] font-mono ${col.remainingDue <= 0 || currentDue === 0 ? 'text-emerald-400 font-bold' : 'text-amber-400'}`}>
                                          {col.remainingDue <= 0 || currentDue === 0 ? '(Payment Cleared ✓)' : `(Remaining Due: ${formatCurrency(col.remainingDue)})`}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1.5 shrink-0">
                                        <button
                                          type="button"
                                          onClick={() => setPreviewVoucher(col)}
                                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 transition-colors cursor-pointer"
                                        >
                                          View Slip
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDownloadVoucherSlip(col)}
                                          disabled={isDownloadingVoucherId === (col.id || col.voucherNumber)}
                                          className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
                                          title="Download Slip (PNG)"
                                        >
                                          <Download className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Card Middle Row: Customer, Seller, Date, and View Items Button */}
                            <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800/80 gap-2">
                              <div className="flex items-center gap-3 flex-wrap">
                                <span className="text-slate-200 font-semibold flex items-center gap-1.5">
                                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                                  {sale.customerName}
                                </span>
                                {sale.customerPhone && (
                                  <span className="flex items-center gap-1 font-mono text-xs">
                                    <Phone className="w-3 h-3 text-slate-500" />
                                    {sale.customerPhone}
                                  </span>
                                )}
                                {sale.sellerName && (
                                  <span className="px-2 py-0.5 rounded bg-slate-800/80 text-[11px] text-sky-300 border border-slate-700/60 font-medium">
                                    Sold by: <strong>{sale.sellerName}</strong>
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-3 font-mono text-xs">
                                <span className="text-slate-500">{sale.date} {sale.time}</span>

                                {/* View Item Toggle Button */}
                                <button
                                  type="button"
                                  onClick={() => toggleExpandSale(saleKey)}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                                    isExpanded 
                                      ? 'bg-sky-500 text-slate-950 font-bold shadow-xs' 
                                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60'
                                  }`}
                                >
                                  <Package className="w-3.5 h-3.5" />
                                  <span>{isExpanded ? 'Hide Items' : `View Items (${sale.items?.length || sale.itemsCount || 0})`}</span>
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>

                            {/* Collapsible Itemized Breakdown */}
                            {isExpanded && (
                              <div className="mt-1 pt-3 border-t border-slate-800/80 flex flex-col gap-3 animate-in fade-in duration-150">
                                <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                                  <span className="flex items-center gap-2 text-slate-200 font-bold">
                                    <Package className="w-4 h-4 text-sky-400" />
                                    <span>Billed Items List ({sale.items?.length || sale.itemsCount || 0} Products)</span>
                                  </span>
                                  <div className="flex items-center gap-3">
                                    <button
                                      type="button"
                                      onClick={() => setPreviewSlipSale(sale)}
                                      className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 font-semibold underline cursor-pointer"
                                    >
                                      <Receipt className="w-3.5 h-3.5" />
                                      <span>Open Slip Preview &amp; Print</span>
                                    </button>
                                  </div>
                                </div>

                                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/80">
                                  <table className="w-full text-left text-xs text-slate-300">
                                    <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800 text-[11px] uppercase tracking-wider">
                                      <tr>
                                        <th className="py-2.5 px-3">#</th>
                                        <th className="py-2.5 px-3">Product Name</th>
                                        <th className="py-2.5 px-3">Brand</th>
                                        <th className="py-2.5 px-3 text-right">Rate</th>
                                        <th className="py-2.5 px-3 text-center">Qty</th>
                                        <th className="py-2.5 px-3 text-right">Discount</th>
                                        <th className="py-2.5 px-3 text-right">Total</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/60">
                                      {(sale.items && sale.items.length > 0) ? (
                                        sale.items.map((it, idx) => (
                                          <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="py-2.5 px-3 font-mono text-slate-500">{idx + 1}</td>
                                            <td className="py-2.5 px-3 font-medium text-white">
                                              <div>{it.name}</div>
                                              {it.productCode && (
                                                <div className="text-[10px] font-mono text-slate-400">Code: {it.productCode}</div>
                                              )}
                                            </td>
                                            <td className="py-2.5 px-3">
                                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                it.company === 'MAK' 
                                                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' 
                                                  : 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                                              }`}>
                                                {it.company || sale.company}
                                              </span>
                                            </td>
                                            <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                                              ₹{it.rate}
                                            </td>
                                            <td className="py-2.5 px-3 text-center font-bold text-white">
                                              {it.qty}
                                            </td>
                                            <td className="py-2.5 px-3 text-right font-mono text-amber-400">
                                              {it.discount ? `${it.discount}${it.discountType === 'percentage' ? '%' : '₹'}` : '—'}
                                            </td>
                                            <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                                              ₹{it.totalAmount}
                                            </td>
                                          </tr>
                                        ))
                                      ) : (
                                        <tr>
                                          <td colSpan={7} className="py-4 text-center text-slate-500 text-xs">
                                            No item details recorded for this invoice.
                                          </td>
                                        </tr>
                                      )}
                                    </tbody>
                                    <tfoot className="bg-slate-900/90 font-semibold border-t border-slate-800 text-xs">
                                      <tr>
                                        <td colSpan={4} className="py-2 px-3 text-slate-400 text-right">Subtotal:</td>
                                        <td colSpan={3} className="py-2 px-3 text-right font-mono text-white">
                                          {formatCurrency(sale.subtotal || sale.grandTotal)}
                                        </td>
                                      </tr>
                                      {sale.totalDiscount > 0 && (
                                        <tr>
                                          <td colSpan={4} className="py-1 px-3 text-amber-400 text-right">Discount:</td>
                                          <td colSpan={3} className="py-1 px-3 text-right font-mono text-amber-400">
                                            -{formatCurrency(sale.totalDiscount)}
                                          </td>
                                        </tr>
                                      )}
                                      <tr>
                                        <td colSpan={4} className="py-2.5 px-3 text-emerald-400 font-bold text-right">Grand Total:</td>
                                        <td colSpan={3} className="py-2.5 px-3 text-right font-mono font-extrabold text-emerald-400 text-sm">
                                          {formatCurrency(sale.grandTotal)}
                                        </td>
                                      </tr>
                                    </tfoot>
                                  </table>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: CREDIT & DUE PAYMENTS */}
              {activeTab === 'creditCollections' && (
                <div className="flex flex-col gap-7">
                  {/* Financial Overview Cards (3 Cards Grid) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Card 1: Total Credit Collected */}
                    <div 
                      className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Total Credit Collected
                        </span>
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                          <HandCoins className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="mt-3">
                        <h4 className="text-2xl font-black text-white font-mono tracking-tight">
                          {formatCurrency(totalCreditCollected)}
                        </h4>
                        <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Recovered from customer dues</span>
                        </p>
                      </div>
                    </div>

                    {/* Card 2: Total Dues Still Pending */}
                    <div 
                      onClick={() => {
                        setActiveTab('salesHistory');
                        setSalesFilterMode('DUE');
                      }}
                      className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-rose-500/40 cursor-pointer transition-all"
                      title="Click to view all unpaid credit bills"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Remaining Unpaid Dues
                        </span>
                        <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
                          <AlertCircle className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="mt-3">
                        <h4 className="text-2xl font-black text-rose-400 font-mono tracking-tight">
                          {formatCurrency(totalDuePending)}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-medium">
                          <span>Across active credit bills &rarr;</span>
                        </p>
                      </div>
                    </div>

                    {/* Card 3: Total Vouchers Issued */}
                    <div 
                      className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Payment Vouchers
                        </span>
                        <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
                          <Receipt className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="mt-3">
                        <h4 className="text-2xl font-black text-white font-mono tracking-tight">
                          {creditCollections.length}
                        </h4>
                        <p className="text-[11px] text-sky-400 mt-1 flex items-center gap-1 font-medium">
                          <span>Official payment receipts issued</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Filter & Action Controls Bar */}
                  <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80">
                    {/* Search Input */}
                    <div className="relative flex-1 max-w-md">
                      <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search voucher #, customer, phone, bill #..."
                        value={collectionsSearchQuery}
                        onChange={(e) => setCollectionsSearchQuery(e.target.value)}
                        className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500 transition-all"
                      />
                      {collectionsSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setCollectionsSearchQuery('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    {/* Filter Pills & Actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                        <button
                          type="button"
                          onClick={() => setCollectionsFilterMode('ALL')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                            collectionsFilterMode === 'ALL'
                              ? 'bg-slate-800 text-white shadow-sm'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          All ({creditCollections.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setCollectionsFilterMode('DUE_REMAINING')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 ${
                            collectionsFilterMode === 'DUE_REMAINING'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                          <span>Still Due Left ({creditCollections.filter((c) => !isCollectionCleared(c)).length})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setCollectionsFilterMode('SETTLED')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 ${
                            collectionsFilterMode === 'SETTLED'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Fully Settled ({creditCollections.filter(isCollectionCleared).length})</span>
                        </button>
                      </div>

                      {/* New Credit Payment Button */}
                      <button
                        type="button"
                        onClick={() => handleInitiateCreditCollection()}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 active:scale-95 shadow-md shadow-emerald-400/20 transition-all cursor-pointer"
                      >
                        <HandCoins className="w-4 h-4" />
                        <span>+ Accept Credit Payment</span>
                      </button>

                      {/* Refresh Button */}
                      <button
                        type="button"
                        onClick={loadCollections}
                        disabled={loadingCollections}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                        title="Refresh Collections"
                      >
                        <RefreshCw className={`w-4 h-4 ${loadingCollections ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Collections List */}
                  {loadingCollections ? (
                    <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center gap-3 bg-slate-900/30 rounded-2xl border border-slate-800/60">
                      <div className="w-7 h-7 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
                      <p className="text-xs text-slate-400 font-medium">Loading credit payment records...</p>
                    </div>
                  ) : filteredCollections.length === 0 ? (
                    <div className="p-14 text-center text-slate-400 flex flex-col items-center justify-center gap-3 bg-slate-900/40 rounded-2xl border border-slate-800/80">
                      <div className="w-14 h-14 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-500 border border-slate-700/60">
                        <Receipt className="w-7 h-7" />
                      </div>
                      <h4 className="text-base font-bold text-white">No Credit Payment Records Found</h4>
                      <p className="text-xs text-slate-400 max-w-md">
                        {collectionsSearchQuery || collectionsFilterMode !== 'ALL'
                          ? 'No payments match your active search and filter criteria. Try clearing filters.'
                          : 'No credit payment collections have been recorded yet. Click "Accept Credit Payment" to record a payment received from a buyer.'}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleInitiateCreditCollection()}
                        className="mt-2 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-all cursor-pointer shadow-lg"
                      >
                        <HandCoins className="w-4 h-4" />
                        <span>Accept First Credit Payment</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3.5">
                      {filteredCollections.map((col) => {
                        const isSettled = isCollectionCleared(col);
                        return (
                          <div
                            key={col.id || col.voucherNumber}
                            className={`p-5 rounded-2xl border transition-all flex flex-col gap-4 shadow-lg ${
                              isSettled
                                ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                                : 'bg-slate-900/90 border-amber-500/30 hover:border-amber-500/50 ring-1 ring-amber-500/10'
                            }`}
                          >
                            {/* Card Top Row: Voucher Number, Payment Mode, Linked Bill, Date, Actions */}
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="flex items-center gap-2.5 flex-wrap">
                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 font-mono text-xs font-bold">
                                  <Receipt className="w-3.5 h-3.5" />
                                  <span>#{col.voucherNumber}</span>
                                </div>

                                {col.invoiceNumber && (
                                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs">
                                    <span className="text-slate-400 text-[10px] uppercase font-bold">Bill:</span>
                                    <strong className="text-white">#{col.invoiceNumber}</strong>
                                  </div>
                                )}

                                <span
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border ${
                                    col.paymentMode === 'CASH'
                                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                      : col.paymentMode === 'UPI'
                                      ? 'bg-sky-500/15 text-sky-400 border-sky-500/30'
                                      : 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                                  }`}
                                >
                                  {col.paymentMode === 'CASH' && <Banknote className="w-3.5 h-3.5" />}
                                  {col.paymentMode === 'UPI' && <QrCode className="w-3.5 h-3.5" />}
                                  {col.paymentMode === 'SPLIT' && <ArrowRightLeft className="w-3.5 h-3.5" />}
                                  <span>{col.paymentMode}</span>
                                </span>

                                <span className="text-xs text-slate-400 font-medium">
                                  {col.date} at {col.time}
                                </span>

                                {col.sellerName && (
                                  <span className="text-[11px] text-slate-400 px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                                    Staff: <strong className="text-slate-300">{col.sellerName}</strong>
                                  </span>
                                )}
                              </div>

                              {/* Action Buttons: View Slip, Download PNG, Print, Delete */}
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setPreviewVoucher(col)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 transition-colors cursor-pointer"
                                  title="View Official Payment Slip"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>View Slip</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDownloadVoucherSlip(col)}
                                  disabled={isDownloadingVoucherId === (col.id || col.voucherNumber)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
                                  title="Download Slip (PNG Image)"
                                >
                                  {isDownloadingVoucherId === (col.id || col.voucherNumber) ? (
                                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  ) : (
                                    <Download className="w-3.5 h-3.5" />
                                  )}
                                  <span className="hidden sm:inline">Download Slip</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setPreviewVoucher(col);
                                    setTimeout(handlePrintVoucherFromPreview, 300);
                                  }}
                                  className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
                                  title="Print Payment Slip"
                                >
                                  <Printer className="w-4 h-4" />
                                </button>

                                {col.id && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCollectionRecord(col)}
                                    disabled={deletingVoucherId === col.id}
                                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                                    title="Delete Record"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Card Middle: Customer Details & Notes */}
                            <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
                              <div className="flex items-center gap-4 flex-wrap">
                                <span className="text-slate-100 font-bold text-sm flex items-center gap-1.5">
                                  <UserIcon className="w-4 h-4 text-slate-400" />
                                  {col.customerName}
                                </span>
                                {col.customerPhone && (
                                  <a
                                    href={`tel:${col.customerPhone}`}
                                    className="flex items-center gap-1 font-mono text-slate-400 hover:text-sky-400 transition-colors"
                                  >
                                    <Phone className="w-3.5 h-3.5" />
                                    <span>+91 {col.customerPhone}</span>
                                  </a>
                                )}
                              </div>

                              {col.notes && (
                                <div className="text-slate-400 italic text-[11px] bg-slate-950 px-3 py-1 rounded-lg border border-slate-800/80">
                                  Note: {col.notes}
                                </div>
                              )}
                            </div>

                            {/* Card Bottom: Financial Breakdown & REMAINING DUE LEFT BANNER */}
                            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                              {/* Total Due Before */}
                              <div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                  Total Due Before Payment
                                </span>
                                <span className="text-sm font-bold font-mono text-slate-300">
                                  {col.totalDueBefore > 0 ? formatCurrency(col.totalDueBefore) : '—'}
                                </span>
                              </div>

                              {/* Amount Paid Now */}
                              <div>
                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                                  Paid in This Payment
                                </span>
                                <div className="flex items-baseline gap-2">
                                  <span className="text-base font-extrabold font-mono text-emerald-400">
                                    {formatCurrency(col.amountCollected)}
                                  </span>
                                  {col.paymentMode === 'SPLIT' && (
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      (Cash ₹{col.cashAmount || 0} + UPI ₹{col.upiAmount || 0})
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* EXACT REMAINING DUE LEFT */}
                              <div className={`p-2.5 rounded-lg border flex flex-col justify-center ${
                                isSettled
                                  ? 'bg-emerald-500/10 border-emerald-500/30'
                                  : 'bg-amber-500/15 border-amber-500/40'
                              }`}>
                                <span className={`text-[10px] font-black uppercase tracking-wider block ${
                                  isSettled ? 'text-emerald-400' : 'text-amber-400'
                                }`}>
                                  {isSettled ? 'Payment Cleared' : 'Remaining Due Left'}
                                </span>
                                <div className="flex items-center justify-between">
                                  <span className={`text-base font-black font-mono tracking-tight ${
                                    isSettled ? 'text-emerald-300' : 'text-amber-300'
                                  }`}>
                                    {isSettled ? '₹0.00 Cleared ✓' : formatCurrency(col.remainingDue)}
                                  </span>
                                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                                    isSettled
                                      ? 'bg-emerald-500/20 text-emerald-300'
                                      : 'bg-amber-500/25 text-amber-200'
                                  }`}>
                                    {isSettled ? 'Paid in Full ✓' : 'Pending Due'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ========================================================
             ADMIN PAYMENT STATUS SETTLEMENT POPUP DIALOG
             (Overlays cleanly inside dashboard)
             ======================================================== */}
          {settlingSale && (
            <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 rounded-3xl animate-in fade-in duration-100">
              <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md p-6 shadow-2xl flex flex-col gap-4 text-slate-100 ring-1 ring-white/10 animate-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-base font-bold text-white tracking-tight">
                      Admin: Update Payment Status
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettlingSale(null)}
                    className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Invoice:</span>
                    <strong className="font-mono text-sky-400">#{settlingSale.invoiceNumber}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Customer:</span>
                    <strong className="text-white">{settlingSale.customerName}</strong>
                  </div>
                  {settlingSale.customerPhone && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Contact:</span>
                      <span className="font-mono text-slate-300">+91 {settlingSale.customerPhone}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-baseline pt-1.5 border-t border-slate-800/80">
                    <span className="text-slate-400 font-bold">Bill Total:</span>
                    <strong className="text-base font-mono text-emerald-400 font-bold">
                      {formatCurrency(settlingSale.grandTotal)}
                    </strong>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Select New Payment Status:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSettleMode('CASH')}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                        settleMode === 'CASH'
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/30'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Banknote className="w-4 h-4 text-emerald-400" />
                      <span>Paid in Cash</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSettleMode('UPI')}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                        settleMode === 'UPI'
                          ? 'bg-sky-500/20 border-sky-500 text-sky-300 ring-1 ring-sky-500/30'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      <QrCode className="w-4 h-4 text-sky-400" />
                      <span>Paid via UPI</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSettleMode('CARD')}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                        settleMode === 'CARD'
                          ? 'bg-purple-500/20 border-purple-500 text-purple-300 ring-1 ring-purple-500/30'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 text-purple-400" />
                      <span>Paid via Card</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSettleMode('DUE')}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                        settleMode === 'DUE'
                          ? 'bg-rose-500/20 border-rose-500 text-rose-300 ring-1 ring-rose-500/30'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      <FileText className="w-4 h-4 text-rose-400" />
                      <span>Mark as DUE</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Admin Note / Remarks (Optional):
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Settle approved by Admin, Cash received at office"
                    value={settleNote}
                    onChange={(e) => setSettleNote(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSettlingSale(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isUpdatingStatus}
                    onClick={handleConfirmStatusChange}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-400 hover:bg-emerald-300 text-slate-950 shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isUpdatingStatus ? (
                      <span>Saving...</span>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirm &amp; Set to {settleMode}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
             RETAIL BILL SLIP PREVIEW & DOWNLOAD / PRINT MODAL
             (Overlays cleanly inside dashboard)
             ======================================================== */}
          {previewSlipSale && (
            <div className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-md rounded-3xl flex flex-col overflow-hidden animate-in fade-in duration-150">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-sky-500/15 text-sky-400 border border-sky-500/25 flex items-center justify-center shrink-0">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>Retail Bill Slip Preview</span>
                      <span className="font-mono text-xs text-sky-400 font-semibold px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20">
                        #{previewSlipSale.invoiceNumber}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      {previewSlipSale.customerName} • {previewSlipSale.date} {previewSlipSale.time}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  {/* Download PNG Button */}
                  <button
                    type="button"
                    disabled={isGeneratingSlipFromPreview}
                    onClick={handleDownloadSlipFromPreview}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 active:bg-sky-700 shadow-md shadow-sky-600/25 transition-all cursor-pointer disabled:opacity-50"
                    title="Download Slip as PNG Image"
                  >
                    {isGeneratingSlipFromPreview ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Slip (PNG)</span>
                      </>
                    )}
                  </button>

                  {/* Print Slip Button */}
                  <button
                    type="button"
                    onClick={handlePrintSlipFromPreview}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
                    title="Open Print Dialog"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-300" />
                    <span className="hidden sm:inline">Print Slip</span>
                  </button>

                  {/* Close Button */}
                  <button
                    type="button"
                    onClick={() => setPreviewSlipSale(null)}
                    className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer ml-1"
                    aria-label="Close Preview"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Slip Container Body (Centered, Scrollable) */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950 flex justify-center items-start custom-scrollbar">
                <div className="shadow-2xl rounded-sm overflow-hidden bg-white max-w-full">
                  <PrintableBill
                    ref={slipPreviewCaptureRef}
                    company={previewSlipSale.company || 'MAK'}
                    invoiceNumber={previewSlipSale.invoiceNumber}
                    date={previewSlipSale.date}
                    time={previewSlipSale.time}
                    customerName={previewSlipSale.customerName}
                    customerPhone={previewSlipSale.customerPhone}
                    sellerName={previewSlipSale.sellerName}
                    items={getInvoiceItemsForSale(previewSlipSale)}
                    paymentMode={previewSlipSale.paymentMode}
                    cashReceived={previewSlipSale.cashReceived}
                    upiReceived={previewSlipSale.upiReceived}
                    balanceDue={previewSlipSale.balanceDue}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
             ADMIN QUICK CREDIT COLLECTION POPUP MODAL
             (Accept buyer credit payment & compute remaining due live)
             ======================================================== */}
          {isOpeningNewCollection && (
            <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 rounded-3xl animate-in fade-in duration-100">
              <form
                onSubmit={handleSubmitAdminCollection}
                className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg p-6 shadow-2xl flex flex-col gap-4 text-slate-100 ring-1 ring-white/10 animate-in zoom-in-95 duration-100 max-h-[90vh] overflow-y-auto custom-scrollbar"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <HandCoins className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-base font-bold text-white tracking-tight">
                      Accept Buyer Credit Payment
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOpeningNewCollection(false)}
                    className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Linked Bill info if initiated from a bill */}
                {collectingSale && (
                  <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-xs flex justify-between items-center">
                    <div>
                      <span className="text-sky-400 font-bold block">Collecting for Invoice:</span>
                      <strong className="font-mono text-white text-sm">#{collectingSale.invoiceNumber}</strong>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block text-[11px]">Bill Total:</span>
                      <strong className="font-mono text-emerald-400 font-bold">{formatCurrency(collectingSale.grandTotal)}</strong>
                    </div>
                  </div>
                )}

                {/* Customer Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Buyer / Client name"
                      value={collectCustomerName}
                      onChange={(e) => setCollectCustomerName(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      placeholder="10-digit mobile"
                      value={collectCustomerPhone}
                      onChange={(e) => setCollectCustomerPhone(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500 font-mono"
                    />
                  </div>
                </div>

                {/* Due & Payment Amounts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Total Due Before Payment (₹)
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="e.g. 1500"
                      value={collectTotalDue}
                      onChange={(e) => setCollectTotalDue(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
                      Amount Paying Now (₹) *
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="1"
                      required
                      placeholder="e.g. 500"
                      value={collectAmount}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCollectAmount(val);
                        if (collectPaymentMode === 'CASH') setCollectCashPart(val);
                        if (collectPaymentMode === 'UPI') setCollectUpiPart(val);
                      }}
                      className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-emerald-500/50 text-emerald-400 text-sm font-bold font-mono placeholder-slate-500 outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                {/* LIVE DYNAMIC REMAINING DUE CALCULATION BOX */}
                {(() => {
                  const dueNum = parseFloat(collectTotalDue) || 0;
                  const payNum = parseFloat(collectAmount) || 0;
                  const remNum = Math.max(0, dueNum - payNum);
                  return (
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Total Due Before:</span>
                        <span className="font-mono">{formatCurrency(dueNum)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-emerald-400 font-semibold">
                        <span>Paying Now:</span>
                        <span className="font-mono">- {formatCurrency(payNum)}</span>
                      </div>
                      <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                          Remaining Due Left:
                        </span>
                        <strong className={`text-base font-mono font-extrabold ${
                          remNum === 0 ? 'text-emerald-400' : 'text-amber-400'
                        }`}>
                          {remNum === 0 ? '₹0.00 (Fully Settled ✓)' : formatCurrency(remNum)}
                        </strong>
                      </div>
                    </div>
                  );
                })()}

                {/* Payment Tender Mode: CASH / UPI / SPLIT */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Payment Mode:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCollectPaymentMode('CASH');
                        setCollectCashPart(collectAmount);
                        setCollectUpiPart('');
                      }}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                        collectPaymentMode === 'CASH'
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/30'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Banknote className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Cash</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCollectPaymentMode('UPI');
                        setCollectUpiPart(collectAmount);
                        setCollectCashPart('');
                      }}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                        collectPaymentMode === 'UPI'
                          ? 'bg-sky-500/20 border-sky-500 text-sky-300 ring-1 ring-sky-500/30'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      <QrCode className="w-3.5 h-3.5 text-sky-400" />
                      <span>UPI</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCollectPaymentMode('SPLIT')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                        collectPaymentMode === 'SPLIT'
                          ? 'bg-purple-500/20 border-purple-500 text-purple-300 ring-1 ring-purple-500/30'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5 text-purple-400" />
                      <span>Split</span>
                    </button>
                  </div>
                </div>

                {/* If Split: Cash & UPI breakdown */}
                {collectPaymentMode === 'SPLIT' && (
                  <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                        Cash Portion (₹)
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        placeholder="0"
                        value={collectCashPart}
                        onChange={(e) => setCollectCashPart(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                        UPI Portion (₹)
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        placeholder="0"
                        value={collectUpiPart}
                        onChange={(e) => setCollectUpiPart(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Notes / Remarks (Optional):
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Received partial credit via GPay, rest promised next week"
                    value={collectNotes}
                    onChange={(e) => setCollectNotes(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500"
                  />
                </div>

                {/* Submit / Cancel Actions */}
                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsOpeningNewCollection(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingCollection}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-400 hover:bg-emerald-300 text-slate-950 shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isSubmittingCollection ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                        <span>Saving Payment...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Save &amp; Generate Slip</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================
             PAYMENT VOUCHER SLIP PREVIEW & DOWNLOAD / PRINT MODAL
             (Overlays cleanly inside dashboard)
             ======================================================== */}
          {previewVoucher && (
            <div className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-md rounded-3xl flex flex-col overflow-hidden animate-in fade-in duration-150">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 flex items-center justify-center shrink-0">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>Credit Payment Voucher Slip</span>
                      <span className="font-mono text-xs text-sky-400 font-semibold px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20">
                        #{previewVoucher.voucherNumber}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      {previewVoucher.customerName} • {previewVoucher.date} {previewVoucher.time}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  {/* Download PNG Button */}
                  <button
                    type="button"
                    disabled={isGeneratingVoucherFromPreview}
                    onClick={handleDownloadVoucherFromPreview}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 shadow-md shadow-emerald-600/25 transition-all cursor-pointer disabled:opacity-50"
                    title="Download Payment Slip as PNG Image"
                  >
                    {isGeneratingVoucherFromPreview ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Slip (PNG)</span>
                      </>
                    )}
                  </button>

                  {/* Print Slip Button */}
                  <button
                    type="button"
                    onClick={handlePrintVoucherFromPreview}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
                    title="Open Print Dialog"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-300" />
                    <span className="hidden sm:inline">Print Slip</span>
                  </button>

                  {/* Close Button */}
                  <button
                    type="button"
                    onClick={() => setPreviewVoucher(null)}
                    className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer ml-1"
                    aria-label="Close Voucher Slip"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Slip Container Body (Centered, Scrollable) */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950 flex justify-center items-start custom-scrollbar">
                <div className="shadow-2xl rounded-sm overflow-hidden bg-white max-w-full">
                  <PaymentVoucherSlip
                    voucher={previewVoucher}
                    innerRef={voucherPreviewCaptureRef}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Offscreen element for direct 1-click PNG sales slip download */}
      <div
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          width: '820px',
          opacity: 1,
          pointerEvents: 'none',
          zIndex: -999,
        }}
        aria-hidden="true"
      >
        {activeSlipSale && (
          <PrintableBill
            ref={captureSlipRef}
            company={activeSlipSale.company || 'MAK'}
            invoiceNumber={activeSlipSale.invoiceNumber}
            date={activeSlipSale.date}
            time={activeSlipSale.time}
            customerName={activeSlipSale.customerName}
            customerPhone={activeSlipSale.customerPhone}
            sellerName={activeSlipSale.sellerName}
            items={getInvoiceItemsForSale(activeSlipSale)}
            paymentMode={activeSlipSale.paymentMode}
            cashReceived={activeSlipSale.cashReceived}
            upiReceived={activeSlipSale.upiReceived}
            balanceDue={activeSlipSale.balanceDue}
          />
        )}
      </div>

      {/* Offscreen element for direct 1-click PNG credit voucher slip download */}
      <div
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          width: '600px',
          opacity: 1,
          pointerEvents: 'none',
          zIndex: -999,
        }}
        aria-hidden="true"
      >
        {directCaptureVoucher && (
          <PaymentVoucherSlip
            voucher={directCaptureVoucher}
            innerRef={voucherDirectCaptureRef}
          />
        )}
      </div>
    </div>
  );
};
