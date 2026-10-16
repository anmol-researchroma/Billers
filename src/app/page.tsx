'use client';

import React, { useState, useRef, useSyncExternalStore, useMemo, useEffect } from 'react';
import { Company, InvoiceItem, PaymentMode, Product } from '@/types/billing';
import { Header } from '@/components/Header';
import { ProductSearch } from '@/components/ProductSearch';
import { ProductBrowser } from '@/components/ProductBrowser';
import { InvoiceCart } from '@/components/InvoiceCart';
import { PrintableBill } from '@/components/PrintableBill';
import { BillModal } from '@/components/BillModal';
import { AdminModal } from '@/components/AdminModal';
import { CreditCollectionModal } from '@/components/CreditCollectionModal';
import { getCustomProducts, saveSaleInvoice } from '@/services/firebaseService';
import { toPng } from 'html-to-image';
import confetti from 'canvas-confetti';
import { Layers, ShoppingBag } from 'lucide-react';
import { formatCurrency } from '@/utils/numberToWords';

// Helper to generate invoice number
const generateNewInvoiceNumber = (comp: Company) => {
  const randomSeq = Math.floor(1000 + Math.random() * 9000);
  const now = new Date();
  const datePrefix = `${now.getFullYear().toString().slice(2)}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
  return `INV-${comp}-${datePrefix}-${randomSeq}`;
};

// Safe client hydration snapshot for current date/time
const emptySubscribe = () => () => {};
const getClientDate = () => {
  return new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};
const getClientTime = () => {
  return new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function BillerPage() {
  const [currentCompany, setCurrentCompany] = useState<Company>('MAK');
  const [items, setItems] = useState<InvoiceItem[]>([]);

  // Mobile tab view: 'catalog' | 'bill'
  const [mobileTab, setMobileTab] = useState<'catalog' | 'bill'>('catalog');

  // Customer & Payment Details
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [sellerName, setSellerName] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('CASH');
  const [cashGiven, setCashGiven] = useState<number | undefined>(undefined);
  const [upiGiven, setUpiGiven] = useState<number | undefined>(undefined);

  // Stable invoice number for prerendering
  const [invoiceNumber, setInvoiceNumber] = useState<string>('INV-MAK-1001');

  // Hidden print element ref & screenshot modal state
  const billCaptureRef = useRef<HTMLDivElement>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Admin Modal & Custom Products state from Firebase
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [isCreditCollectionOpen, setIsCreditCollectionOpen] = useState<boolean>(false);
  const [customProducts, setCustomProducts] = useState<Product[]>([]);

  // Load custom products from Firebase & persistent seller name on mount
  useEffect(() => {
    let isMounted = true;
    const loadCustom = async () => {
      const data = await getCustomProducts();
      if (isMounted) {
        setCustomProducts(data);
      }
      if (typeof window !== 'undefined') {
        const savedSeller = localStorage.getItem('biller_seller_name');
        if (savedSeller && isMounted) {
          setSellerName(savedSeller);
        }
      }
    };
    loadCustom();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleUpdateSellerName = (name: string) => {
    setSellerName(name);
    if (typeof window !== 'undefined') {
      localStorage.setItem('biller_seller_name', name);
    }
  };

  const handleProductAdded = (newProduct: Product) => {
    setCustomProducts((prev) => [newProduct, ...prev]);
  };

  const handleProductDeleted = (productId: number) => {
    setCustomProducts((prev) => prev.filter((p) => p.id !== productId));
    setItems((prev) => prev.filter((it) => it.productId !== productId));
  };

  // Date/Time via safe client store
  const currentDateStr = useSyncExternalStore(emptySubscribe, getClientDate, () => '');
  const currentTimeStr = useSyncExternalStore(emptySubscribe, getClientTime, () => '');

  // Set of selected product IDs across ALL companies in the active bill
  const selectedProductIds = useMemo(() => {
    return new Set(items.map((it) => it.productId));
  }, [items]);

  // Grand total for mobile quick bar
  const grandTotal = useMemo(() => {
    return items.reduce((acc, it) => acc + it.totalAmount, 0);
  }, [items]);

  // Tab switching in catalog
  const handleCompanyChange = (company: Company) => {
    setCurrentCompany(company);
  };

  // Toggle single product selection
  const handleToggleProduct = (product: Product) => {
    setItems((prev) => {
      const exists = prev.some((it) => it.productId === product.id);
      if (exists) {
        return prev.filter((it) => it.productId !== product.id);
      }
      const newItem: InvoiceItem = {
        id: `${Date.now()}-${product.id}-${Math.random().toString(36).substr(2, 6)}`,
        productId: product.id,
        name: product.name,
        company: product.company,
        productCode: product.productCode,
        rate: 0,
        rateStr: '',
        qty: 1,
        discount: 0,
        discountStr: '',
        discountType: 'percentage',
        grossAmount: 0,
        discountAmount: 0,
        totalAmount: 0,
      };
      return [...prev, newItem];
    });
  };

  // Bulk select multiple products
  const handleSelectMultiple = (productsToAdd: Product[]) => {
    setItems((prev) => {
      const existingIds = new Set(prev.map((it) => it.productId));
      const newItems: InvoiceItem[] = productsToAdd
        .filter((p) => !existingIds.has(p.id))
        .map((product) => ({
          id: `${Date.now()}-${product.id}-${Math.random().toString(36).substr(2, 6)}`,
          productId: product.id,
          name: product.name,
          company: product.company,
          productCode: product.productCode,
          rate: 0,
          rateStr: '',
          qty: 1,
          discount: 0,
          discountStr: '',
          discountType: 'percentage' as const,
          grossAmount: 0,
          discountAmount: 0,
          totalAmount: 0,
        }));
      return [...prev, ...newItems];
    });
  };

  // Bulk deselect multiple products
  const handleDeselectMultiple = (productIdsToRemove: number[]) => {
    const toRemoveSet = new Set(productIdsToRemove);
    setItems((prev) => prev.filter((it) => !toRemoveSet.has(it.productId)));
  };

  // Search selection: switches company and toggles/adds item
  const handleSelectProductFromSearch = (product: Product) => {
    if (product.company !== currentCompany) {
      setCurrentCompany(product.company);
    }
    if (!selectedProductIds.has(product.id)) {
      handleToggleProduct(product);
    }
  };

  // Update item rate (Price manual one by one)
  const handleUpdateItemRate = (id: string, rateVal: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id === id) {
          const numRate = parseFloat(rateVal) || 0;
          const gross = numRate * it.qty;
          const disc = it.discountType === 'percentage'
            ? gross * (it.discount / 100)
            : Math.min(it.discount, gross);
          const total = Math.max(0, gross - disc);
          return {
            ...it,
            rate: numRate,
            rateStr: rateVal,
            grossAmount: gross,
            discountAmount: disc,
            totalAmount: total,
          };
        }
        return it;
      })
    );
  };

  // Update item quantity
  const handleUpdateItemQty = (id: string, newQty: number) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id === id) {
          const validQty = Math.max(1, newQty);
          const gross = it.rate * validQty;
          const disc = it.discountType === 'percentage'
            ? gross * (it.discount / 100)
            : Math.min(it.discount, gross);
          const total = Math.max(0, gross - disc);
          return {
            ...it,
            qty: validQty,
            grossAmount: gross,
            discountAmount: disc,
            totalAmount: total,
          };
        }
        return it;
      })
    );
  };

  // Update item discount
  const handleUpdateItemDiscount = (
    id: string,
    discountVal: string,
    newType?: 'percentage' | 'fixed'
  ) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id === id) {
          const discNum = parseFloat(discountVal) || 0;
          const activeType = newType ?? it.discountType;
          const gross = it.rate * it.qty;
          const disc = activeType === 'percentage'
            ? gross * (discNum / 100)
            : Math.min(discNum, gross);
          const total = Math.max(0, gross - disc);
          return {
            ...it,
            discount: discNum,
            discountStr: discountVal,
            discountType: activeType,
            grossAmount: gross,
            discountAmount: disc,
            totalAmount: total,
          };
        }
        return it;
      })
    );
  };

  // Remove single item
  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleResetBill = () => {
    if (items.length === 0 || confirm('Are you sure you want to clear this bill?')) {
      setItems([]);
      setCustomerName('');
      setCustomerPhone('');
      setCashGiven(undefined);
      setUpiGiven(undefined);
      setInvoiceNumber(generateNewInvoiceNumber(currentCompany));
    }
  };

  // Submit and download screenshot
  const handleSubmitAndDownload = async (cashReceived?: number, upiReceived?: number) => {
    if (items.length === 0) return;
    if (cashReceived !== undefined) setCashGiven(cashReceived);
    if (upiReceived !== undefined) setUpiGiven(upiReceived);

    try {
      if (!billCaptureRef.current) return;

      await new Promise((r) => setTimeout(r, 120));

      const dataUrl = await toPng(billCaptureRef.current, {
        quality: 0.98,
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#ffffff',
      });

      setCapturedImage(dataUrl);

      const downloadLink = document.createElement('a');
      downloadLink.download = `Bill_${currentCompany}_${invoiceNumber}.png`;
      downloadLink.href = dataUrl;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      confetti({
        particleCount: 90,
        spread: 60,
        origin: { y: 0.6 },
        colors: currentCompany === 'MAK' ? ['#f59e0b', '#ef4444', '#fbbf24'] : ['#06b6d4', '#3b82f6', '#60a5fa'],
      });

      setIsModalOpen(true);

      // Asynchronously store bill in Firebase Firestore
      const calculatedGrandTotal = items.reduce((acc, it) => acc + it.totalAmount, 0);
      const calculatedSubtotal = items.reduce((acc, it) => acc + it.grossAmount, 0);
      const calculatedDiscount = items.reduce((acc, it) => acc + it.discountAmount, 0);
      const actualCash = cashReceived ?? cashGiven;
      const actualUpi = upiReceived ?? upiGiven;

      const totalCollected = (actualCash || 0) + (actualUpi || 0);

      const calculatedBalanceDue =
        paymentMode === 'DUE'
          ? calculatedGrandTotal
          : paymentMode === 'CASH_UPI_CREDIT'
          ? Math.max(0, calculatedGrandTotal - totalCollected)
          : paymentMode === 'SPLIT' && totalCollected < calculatedGrandTotal
          ? calculatedGrandTotal - totalCollected
          : undefined;

      saveSaleInvoice({
        invoiceNumber,
        date: currentDateStr || getClientDate(),
        time: currentTimeStr || getClientTime(),
        company: currentCompany,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        sellerName: sellerName.trim(),
        items,
        subtotal: calculatedSubtotal,
        totalDiscount: calculatedDiscount,
        grandTotal: calculatedGrandTotal,
        paymentMode,
        cashReceived: actualCash,
        upiReceived: actualUpi,
        changeDue: actualCash && totalCollected > calculatedGrandTotal ? totalCollected - calculatedGrandTotal : undefined,
        balanceDue: calculatedBalanceDue,
      }).catch((err) => console.error('Cloud backup error:', err));
    } catch (err) {
      console.error('Failed to generate screenshot:', err);
      alert('Unable to capture screenshot automatically. Opening print dialog instead.');
      window.print();
    }
  };

  const handleDownloadAgain = () => {
    if (!capturedImage) return;
    const downloadLink = document.createElement('a');
    downloadLink.download = `Bill_${currentCompany}_${invoiceNumber}.png`;
    downloadLink.href = capturedImage;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleStartNewBill = () => {
    setItems([]);
    setCustomerName('');
    setCustomerPhone('');
    setCashGiven(undefined);
    setUpiGiven(undefined);
    setCapturedImage(null);
    setInvoiceNumber(generateNewInvoiceNumber(currentCompany));
  };

  return (
    <main className="min-h-screen bg-[#080D19] text-[#F1F5F9] flex flex-col selection:bg-[#00C8FF]/25 selection:text-[#00C8FF]">
      {/* Background ambient subtle tones */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-30">
        <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full bg-[#F59E0B]/5 blur-[120px]" />
        <div className="absolute top-20 -right-40 w-80 h-80 rounded-full bg-[#00C8FF]/5 blur-[120px]" />
      </div>

      <div className={`relative z-10 max-w-[1600px] mx-auto w-full px-3 py-2.5 sm:px-6 sm:py-5 lg:px-8 lg:py-6 flex flex-col gap-3 sm:gap-4.5 ${items.length > 0 && mobileTab === 'catalog' ? 'pb-24 lg:pb-6' : 'pb-8 lg:pb-6'}`}>
        {/* Top Header Navigation */}
        <Header
          onReset={handleResetBill}
          itemCount={items.length}
          onOpenAdmin={() => setIsAdminModalOpen(true)}
          onOpenCreditCollection={() => setIsCreditCollectionOpen(true)}
          currentCompany={currentCompany}
          onCompanyChange={handleCompanyChange}
          invoiceNumber={invoiceNumber}
          grandTotal={grandTotal}
          onViewBillMobile={() => setMobileTab('bill')}
        />

        {/* Universal Search Bar */}
        <ProductSearch
          currentCompany={currentCompany}
          onSelectProduct={handleSelectProductFromSearch}
          customProducts={customProducts}
        />

        {/* Mobile View Switcher (Visible only on small screens / phones) */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#080D19] border border-[#26344A] rounded-xl lg:hidden shadow-xs">
          <button
            type="button"
            onClick={() => setMobileTab('catalog')}
            className={`flex items-center justify-center gap-2 min-h-[44px] py-2 px-3 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer ${
              mobileTab === 'catalog'
                ? 'bg-[#151F33] text-[#F1F5F9] shadow-xs border border-[#26344A]'
                : 'text-[#94A3B8] hover:text-[#F1F5F9]'
            }`}
          >
            <Layers className="w-4 h-4 text-[#00C8FF]" />
            <span>Catalog ({selectedProductIds.size})</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileTab('bill')}
            className={`flex items-center justify-center gap-1.5 min-h-[44px] py-2 px-3 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer ${
              mobileTab === 'bill'
                ? 'bg-[#10B981] text-[#080D19] shadow-md shadow-[#10B981]/20 font-extrabold'
                : 'text-[#94A3B8] hover:text-[#F1F5F9]'
            }`}
          >
            <ShoppingBag className="w-4 h-4 shrink-0" />
            <span className="truncate">Active Bill</span>
            {items.length > 0 && (
              <span
                className={`text-[11px] font-mono px-1.5 py-0.5 rounded-full ${
                  mobileTab === 'bill'
                    ? 'bg-[#080D19]/30 text-[#080D19] font-black'
                    : 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40'
                }`}
              >
                {items.length}
              </span>
            )}
          </button>
        </div>

        {/* Main Dual-Panel Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 items-start">
          {/* Left Column: Product Catalog Browser with MAK & BOSS Tabs (5 cols) */}
          <section
            aria-label="Product Browser"
            className={`lg:col-span-5 flex flex-col gap-4 ${
              mobileTab === 'catalog' ? 'block' : 'hidden lg:block'
            }`}
          >
            <ProductBrowser
              currentCompany={currentCompany}
              onCompanyChange={handleCompanyChange}
              selectedProductIds={selectedProductIds}
              onToggleProduct={handleToggleProduct}
              onSelectMultiple={handleSelectMultiple}
              onDeselectMultiple={handleDeselectMultiple}
              customProducts={customProducts}
            />
          </section>

          {/* Right Column: Active Bill Table with Inline Price Inputs & Batch Pricing (7 cols) */}
          <section
            aria-label="Invoice Cart and Checkout"
            className={`lg:col-span-7 flex flex-col gap-4 ${
              mobileTab === 'bill' ? 'block' : 'hidden lg:block'
            }`}
          >
            <InvoiceCart
              items={items}
              customerName={customerName}
              customerPhone={customerPhone}
              sellerName={sellerName}
              paymentMode={paymentMode}
              invoiceNumber={invoiceNumber}
              onUpdateCustomerName={setCustomerName}
              onUpdateCustomerPhone={setCustomerPhone}
              onUpdateSellerName={handleUpdateSellerName}
              onUpdatePaymentMode={setPaymentMode}
              onUpdateItemRate={handleUpdateItemRate}
              onUpdateItemQty={handleUpdateItemQty}
              onUpdateItemDiscount={handleUpdateItemDiscount}
              onRemoveItem={handleRemoveItem}
              onSubmitAndDownload={handleSubmitAndDownload}
              onPrintOnly={handlePrint}
            />
          </section>
        </div>
      </div>

      {/* Floating Bottom Action Bar on Mobile Phones (Only on catalog view so it never blocks checkout buttons) */}
      {items.length > 0 && mobileTab === 'catalog' && (
        <div className="fixed bottom-0 left-0 right-0 z-40 px-4 py-3 bg-[#10182A]/98 backdrop-blur-xl border-t border-[#26344A] lg:hidden flex items-center justify-between shadow-2xl">
          <div>
            <span className="text-[10px] text-[#94A3B8] uppercase font-bold tracking-wider block">
              Bill Total ({items.length} items):
            </span>
            <span className="text-base font-black font-mono text-[#00C8FF]">
              {formatCurrency(grandTotal)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setMobileTab('bill')}
            className="flex items-center gap-2 h-11 px-4 rounded-xl text-xs sm:text-sm font-extrabold text-[#080D19] bg-[#10B981] hover:bg-[#059669] shadow-md active:scale-95 transition-all cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>View Bill &amp; Checkout →</span>
          </button>
        </div>
      )}

      {/* Hidden Rendered Container for HTML Screenshot Capture */}
      <div
        style={{
          position: 'absolute',
          left: '-9999px',
          top: 0,
          opacity: 1,
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      >
        <PrintableBill
          ref={billCaptureRef}
          company={currentCompany}
          invoiceNumber={invoiceNumber}
          date={currentDateStr || 'Today'}
          time={currentTimeStr || ''}
          customerName={customerName}
          customerPhone={customerPhone}
          sellerName={sellerName}
          items={items}
          paymentMode={paymentMode}
          cashReceived={cashGiven}
          upiReceived={upiGiven}
          balanceDue={
            paymentMode === 'DUE'
              ? grandTotal
              : paymentMode === 'CASH_UPI_CREDIT'
              ? Math.max(0, grandTotal - ((cashGiven || 0) + (upiGiven || 0)))
              : paymentMode === 'SPLIT' && ((cashGiven || 0) + (upiGiven || 0)) < grandTotal
              ? grandTotal - ((cashGiven || 0) + (upiGiven || 0))
              : undefined
          }
        />
      </div>

      {/* Modal with Captured Screenshot Preview & Download options */}
      <BillModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onNewBill={handleStartNewBill}
        onDownloadAgain={handleDownloadAgain}
        onPrint={handlePrint}
        imageUrl={capturedImage}
        company={currentCompany}
        invoiceNumber={invoiceNumber}
      />

      {/* Admin Panel Modal for Product Management & Cloud Sales */}
      <AdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onProductAdded={handleProductAdded}
        onProductDeleted={handleProductDeleted}
        customProducts={customProducts}
      />

      {/* Credit / Due Collection Modal */}
      <CreditCollectionModal
        isOpen={isCreditCollectionOpen}
        onClose={() => setIsCreditCollectionOpen(false)}
        sellerName={sellerName}
      />
    </main>
  );
}
