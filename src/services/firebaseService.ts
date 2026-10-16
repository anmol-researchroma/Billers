import { db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  serverTimestamp, 
  deleteDoc, 
  updateDoc,
  doc,
  limit,
  where,
  Timestamp 
} from 'firebase/firestore';
import { Product, InvoiceData, CreditCollectionRecord, PaymentMode } from '@/types/billing';

export interface SavedSaleRecord extends Omit<InvoiceData, 'items'> {
  id?: string;
  itemsCount: number;
  items: Array<{
    name: string;
    company: string;
    productCode?: string;
    rate: number;
    qty: number;
    discount?: number;
    discountType?: 'percentage' | 'fixed';
    grossAmount?: number;
    discountAmount?: number;
    totalAmount: number;
  }>;
  createdAt?: Timestamp | Date | unknown;
  lastCollectionVoucher?: string;
  settlementNote?: string;
  settledAt?: Timestamp | Date | unknown;
  updatedAt?: Timestamp | Date | unknown;
}

// ==========================================
// 1. SALES INVOICE FUNCTIONS
// ==========================================

export async function saveSaleInvoice(invoice: InvoiceData): Promise<string | null> {
  try {
    const salesRef = collection(db, 'sales');
    
    // Sanitize items for storage
    const cleanItems = invoice.items.map((it) => ({
      name: it.name,
      company: it.company,
      productCode: it.productCode || '',
      rate: it.rate,
      qty: it.qty,
      discount: it.discount,
      discountType: it.discountType,
      grossAmount: it.grossAmount,
      discountAmount: it.discountAmount,
      totalAmount: it.totalAmount,
    }));

    const docRef = await addDoc(salesRef, {
      invoiceNumber: invoice.invoiceNumber,
      date: invoice.date,
      time: invoice.time,
      company: invoice.company,
      customerName: invoice.customerName || 'Cash Customer / Retail',
      customerPhone: invoice.customerPhone || '',
      sellerName: invoice.sellerName || '',
      itemsCount: invoice.items.length,
      items: cleanItems,
      subtotal: invoice.subtotal,
      totalDiscount: invoice.totalDiscount,
      grandTotal: invoice.grandTotal,
      paymentMode: invoice.paymentMode,
      cashReceived: invoice.cashReceived !== undefined && invoice.cashReceived !== null ? Number(invoice.cashReceived) : null,
      upiReceived: invoice.upiReceived !== undefined && invoice.upiReceived !== null ? Number(invoice.upiReceived) : null,
      changeDue: invoice.changeDue !== undefined && invoice.changeDue !== null ? Number(invoice.changeDue) : null,
      balanceDue: invoice.balanceDue !== undefined && invoice.balanceDue !== null ? Number(invoice.balanceDue) : null,
      createdAt: serverTimestamp(),
    });

    return docRef.id;
  } catch (error) {
    console.error('Failed to save sales invoice to Firebase:', error);
    // Don't throw so user can still print & download the bill
    return null;
  }
}

export async function getSalesHistory(maxRecords = 150): Promise<SavedSaleRecord[]> {
  try {
    const salesRef = collection(db, 'sales');
    const q = query(salesRef, orderBy('createdAt', 'desc'), limit(maxRecords));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        invoiceNumber: data.invoiceNumber || 'N/A',
        date: data.date || '',
        time: data.time || '',
        company: data.company || 'MAK',
        customerName: data.customerName || 'Retail Customer',
        customerPhone: data.customerPhone || '',
        sellerName: data.sellerName || '',
        itemsCount: data.itemsCount || (data.items ? data.items.length : 0),
        items: data.items || [],
        subtotal: data.subtotal || 0,
        totalDiscount: data.totalDiscount || 0,
        grandTotal: data.grandTotal || 0,
        paymentMode: data.paymentMode || 'CASH',
        cashReceived: data.cashReceived !== undefined && data.cashReceived !== null ? Number(data.cashReceived) : undefined,
        upiReceived: data.upiReceived !== undefined && data.upiReceived !== null ? Number(data.upiReceived) : undefined,
        changeDue: data.changeDue !== undefined && data.changeDue !== null ? Number(data.changeDue) : undefined,
        balanceDue: data.balanceDue !== undefined && data.balanceDue !== null ? Number(data.balanceDue) : undefined,
        lastCollectionVoucher: data.lastCollectionVoucher || undefined,
        settlementNote: data.settlementNote || undefined,
        createdAt: data.createdAt,
      } as SavedSaleRecord;
    });
  } catch (error) {
    console.error('Failed to load sales history:', error);
    return [];
  }
}

export async function deleteSaleRecord(saleDocId: string): Promise<boolean> {
  try {
    const docRef = doc(db, 'sales', saleDocId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error('Failed to delete sale record from Firestore:', error);
    return false;
  }
}


// ==========================================
// 2. CUSTOM PRODUCT FUNCTIONS
// ==========================================

export async function getCustomProducts(): Promise<Product[]> {
  try {
    const productsRef = collection(db, 'custom_products');
    const q = query(productsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: data.numericId || Date.now() + Math.floor(Math.random() * 1000),
        firestoreDocId: d.id,
        name: data.name,
        company: data.company,
        category: data.category || 'General',
        productCode: data.productCode || '',
        hsn: data.hsn || '',
        unitPrice: data.unitPrice || 0,
        units: data.units || 'NOS',
        isCustom: true,
      } as Product & { firestoreDocId?: string; isCustom?: boolean };
    });
  } catch (error) {
    console.error('Failed to fetch custom products from Firestore:', error);
    return [];
  }
}

export async function addCustomProduct(product: {
  name: string;
  company: 'MAK' | 'BOSS';
  category?: string;
  productCode?: string;
  unitPrice?: number;
  hsn?: string;
}): Promise<Product | null> {
  try {
    const productsRef = collection(db, 'custom_products');
    const numericId = Date.now();

    const docData = {
      numericId,
      name: product.name.trim(),
      company: product.company,
      category: product.category?.trim() || 'General',
      productCode: product.productCode?.trim() || '',
      unitPrice: product.unitPrice || 0,
      hsn: product.hsn?.trim() || '',
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(productsRef, docData);

    return {
      id: numericId,
      firestoreDocId: docRef.id,
      name: docData.name,
      company: docData.company,
      category: docData.category,
      productCode: docData.productCode,
      unitPrice: docData.unitPrice,
      hsn: docData.hsn,
      isCustom: true,
    } as Product & { firestoreDocId?: string; isCustom?: boolean };
  } catch (error) {
    console.error('Failed to add custom product to Firestore:', error);
    throw error;
  }
}

export async function deleteCustomProduct(firestoreDocId: string): Promise<boolean> {
  try {
    const docRef = doc(db, 'custom_products', firestoreDocId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error('Failed to delete custom product:', error);
    return false;
  }
}

// ==========================================
// 3. CREDIT / DUE COLLECTION FUNCTIONS
// ==========================================

export async function saveCreditCollection(record: CreditCollectionRecord): Promise<string | null> {
  try {
    const collectionsRef = collection(db, 'credit_collections');
    const docRef = await addDoc(collectionsRef, {
      voucherNumber: record.voucherNumber,
      invoiceId: record.invoiceId || null,
      invoiceNumber: record.invoiceNumber || '',
      customerName: record.customerName || 'Customer',
      customerPhone: record.customerPhone || '',
      sellerName: record.sellerName || '',
      totalDueBefore: record.totalDueBefore,
      amountCollected: record.amountCollected,
      remainingDue: record.remainingDue,
      paymentMode: record.paymentMode,
      cashAmount: record.cashAmount !== undefined && record.cashAmount !== null ? Number(record.cashAmount) : null,
      upiAmount: record.upiAmount !== undefined && record.upiAmount !== null ? Number(record.upiAmount) : null,
      notes: record.notes || '',
      date: record.date,
      time: record.time,
      createdAt: serverTimestamp(),
    });

    // Helper to apply invoice updates
    const applyInvoiceUpdate = async (docId: string) => {
      const isCleared = record.remainingDue <= 0;
      const invoiceDocRef = doc(db, 'sales', docId);
      const updateData: Record<string, unknown> = {
        balanceDue: isCleared ? 0 : record.remainingDue,
        lastCollectionVoucher: record.voucherNumber,
        updatedAt: serverTimestamp(),
      };
      if (isCleared) {
        updateData.paymentMode = record.paymentMode === 'UPI' ? 'UPI' : 'CASH';
        updateData.settledAt = serverTimestamp();
      } else {
        updateData.paymentMode = 'CASH_UPI_CREDIT';
      }
      await updateDoc(invoiceDocRef, updateData);
    };

    // If an associated invoice ID exists, update its remaining due status
    if (record.invoiceId) {
      try {
        await applyInvoiceUpdate(record.invoiceId);
      } catch (updErr) {
        console.warn('Could not update invoice by invoiceId, collection record saved:', updErr);
      }
    } else if (record.invoiceNumber && record.invoiceNumber.trim()) {
      try {
        const rawInv = record.invoiceNumber.trim();
        const cleanInv = rawInv.replace(/^#/, '');
        const salesRef = collection(db, 'sales');
        
        // Try clean invoice number
        let q = query(salesRef, where('invoiceNumber', '==', cleanInv), limit(1));
        let snap = await getDocs(q);
        
        // If not found, try with hash prefix
        if (snap.empty) {
          q = query(salesRef, where('invoiceNumber', '==', `#${cleanInv}`), limit(1));
          snap = await getDocs(q);
        }

        if (!snap.empty) {
          await applyInvoiceUpdate(snap.docs[0].id);
        }
      } catch (err) {
        console.warn('Could not query invoice by invoiceNumber:', err);
      }
    } else if (record.customerName && record.customerName.trim()) {
      // If no invoice was specified, find open DUE sales for this customer and update them
      try {
        const salesRef = collection(db, 'sales');
        const q = query(salesRef, where('customerName', '==', record.customerName.trim()), limit(5));
        const snap = await getDocs(q);
        for (const docSnap of snap.docs) {
          const d = docSnap.data();
          if (d.paymentMode === 'DUE' || d.paymentMode === 'CASH_UPI_CREDIT' || (d.balanceDue && d.balanceDue > 0)) {
            await applyInvoiceUpdate(docSnap.id);
            break; // update the matching open bill
          }
        }
      } catch (custErr) {
        console.warn('Could not link collection to customer sale:', custErr);
      }
    }

    return docRef.id;
  } catch (error) {
    console.error('Failed to save credit collection record:', error);
    return null;
  }
}

export async function getCreditCollections(maxRecords = 150): Promise<CreditCollectionRecord[]> {
  try {
    const collRef = collection(db, 'credit_collections');
    const q = query(collRef, orderBy('createdAt', 'desc'), limit(maxRecords));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        voucherNumber: data.voucherNumber || 'N/A',
        invoiceId: data.invoiceId || undefined,
        invoiceNumber: data.invoiceNumber || '',
        customerName: data.customerName || '',
        customerPhone: data.customerPhone || '',
        sellerName: data.sellerName || '',
        totalDueBefore: data.totalDueBefore !== undefined ? Number(data.totalDueBefore) : 0,
        amountCollected: data.amountCollected !== undefined ? Number(data.amountCollected) : 0,
        remainingDue: data.remainingDue !== undefined ? Number(data.remainingDue) : 0,
        paymentMode: data.paymentMode || 'CASH',
        cashAmount: data.cashAmount !== undefined && data.cashAmount !== null ? Number(data.cashAmount) : undefined,
        upiAmount: data.upiAmount !== undefined && data.upiAmount !== null ? Number(data.upiAmount) : undefined,
        notes: data.notes || '',
        date: data.date || '',
        time: data.time || '',
        createdAt: data.createdAt,
      } as CreditCollectionRecord;
    });
  } catch (error) {
    console.error('Failed to get credit collections:', error);
    return [];
  }
}

export async function updateSalePaymentMode(
  saleDocId: string, 
  newPaymentMode: PaymentMode, 
  cashReceived?: number, 
  notes?: string,
  balanceDue?: number
): Promise<boolean> {
  try {
    const saleDocRef = doc(db, 'sales', saleDocId);
    const updatePayload: Record<string, unknown> = {
      paymentMode: newPaymentMode,
      updatedAt: serverTimestamp(),
    };

    if (newPaymentMode === 'DUE') {
      updatePayload.balanceDue = balanceDue !== undefined ? balanceDue : null;
    } else {
      updatePayload.balanceDue = balanceDue !== undefined ? balanceDue : 0;
      updatePayload.settledAt = serverTimestamp();
      if (cashReceived !== undefined) {
        if (newPaymentMode === 'UPI') {
          updatePayload.upiReceived = cashReceived;
        } else {
          updatePayload.cashReceived = cashReceived;
        }
      }
    }

    if (notes && notes.trim()) {
      updatePayload.settlementNote = notes.trim();
    }

    await updateDoc(saleDocRef, updatePayload);
    return true;
  } catch (error) {
    console.error('Failed to update sale payment mode in Firestore:', error);
    return false;
  }
}

export async function deleteCreditCollectionRecord(collectionDocId: string): Promise<boolean> {
  try {
    const docRef = doc(db, 'credit_collections', collectionDocId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error('Failed to delete credit collection record from Firestore:', error);
    return false;
  }
}

