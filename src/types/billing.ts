export type Company = 'MAK' | 'BOSS';

export interface Product {
  id: number;
  name: string;
  company: Company;
  category?: string;
  hsn?: string;
  barcode?: string;
  unitPrice?: number;
  priceWithTax?: number;
  tax?: number;
  stockQty?: number;
  units?: string;
  productCode?: string;
  isCustom?: boolean;
  firestoreDocId?: string;
}

export interface InvoiceItem {
  id: string;
  productId: number;
  name: string;
  company: Company;
  productCode?: string;
  rate: number;
  rateStr?: string;
  qty: number;
  discount: number;
  discountStr?: string;
  discountType: 'percentage' | 'fixed';
  grossAmount: number;
  discountAmount: number;
  totalAmount: number;
}

export type PaymentMode = 'CASH' | 'UPI' | 'CARD' | 'SPLIT' | 'DUE' | 'CASH_UPI_CREDIT';

export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  time: string;
  company: Company;
  customerName: string;
  customerPhone: string;
  sellerName?: string;
  items: InvoiceItem[];
  subtotal: number;
  totalDiscount: number;
  grandTotal: number;
  paymentMode: PaymentMode;
  cashReceived?: number;
  upiReceived?: number;
  changeDue?: number;
  balanceDue?: number;
  notes?: string;
}

export interface CreditCollectionRecord {
  id?: string;
  voucherNumber: string;
  invoiceId?: string;
  invoiceNumber?: string;
  customerName: string;
  customerPhone: string;
  sellerName: string;
  totalDueBefore: number;
  amountCollected: number;
  remainingDue: number;
  paymentMode: 'CASH' | 'UPI' | 'CARD' | 'SPLIT';
  cashAmount?: number;
  upiAmount?: number;
  notes?: string;
  date: string;
  time: string;
  createdAt?: unknown;
}
