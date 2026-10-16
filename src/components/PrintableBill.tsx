'use client';

import React, { forwardRef } from 'react';
import { Company, InvoiceItem, PaymentMode } from '@/types/billing';
import { numberToIndianWords } from '@/utils/numberToWords';

export interface PrintableBillProps {
  company: Company;
  invoiceNumber: string;
  date: string;
  time: string;
  customerName: string;
  customerPhone: string;
  sellerName?: string;
  items: InvoiceItem[];
  paymentMode: PaymentMode;
  cashReceived?: number;
  upiReceived?: number;
}

export const PrintableBill = forwardRef<HTMLDivElement, PrintableBillProps>(
  (
    {
      company,
      invoiceNumber,
      date,
      time,
      customerName,
      customerPhone,
      sellerName,
      items,
      paymentMode,
      cashReceived,
      upiReceived,
    },
    ref
  ) => {
    // Dynamic brand detection based on items in bill
    const hasMak = items.some((it) => it.company === 'MAK');
    const hasBoss = items.some((it) => it.company === 'BOSS');

    let brandTitle = 'MAK & BOSS AUTOMOTIVE';
    let brandTag = 'MAK, Honda & BOSS Original Equipment Products';
    let brandClass = 'mak-text';

    if (hasMak && !hasBoss) {
      brandTitle = 'MAK LUBRICANTS & HONDA';
      brandTag = 'MAK & Honda Authorized Distributor';
      brandClass = 'mak-text';
    } else if (!hasMak && hasBoss) {
      brandTitle = 'BOSS AUTOMOTIVE';
      brandTag = 'BOSS Automotive Products & Spares';
      brandClass = 'boss-text';
    }

    // Calculations (GST Removed)
    const subtotal = items.reduce((acc, it) => acc + it.grossAmount, 0);
    const totalDiscount = items.reduce((acc, it) => acc + it.discountAmount, 0);
    const grandTotal = items.reduce((acc, it) => acc + it.totalAmount, 0);
    const changeReturn = cashReceived && cashReceived > grandTotal ? cashReceived - grandTotal : 0;

    return (
      <div className="invoice-capture-wrapper" ref={ref} id="printable-bill-element">
        <style dangerouslySetInnerHTML={{ __html: `
          .invoice-capture-wrapper {
            background: #ffffff;
            color: #0f172a;
            width: 820px;
            min-height: 850px;
            margin: 0 auto;
            padding: 36px 40px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            border-radius: 4px;
            position: relative;
            overflow: hidden;
          }
          .invoice-watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-30deg);
            font-size: 5.5rem;
            font-weight: 900;
            color: rgba(15, 23, 42, 0.03);
            pointer-events: none;
            white-space: nowrap;
            letter-spacing: 0.1em;
            user-select: none;
          }
          .bill-top-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding-bottom: 24px;
            border-bottom: 2px solid #0f172a;
          }
          .bill-company-brand {
            display: flex;
            flex-direction: column;
          }
          .bill-company-name {
            font-size: 1.85rem;
            font-weight: 900;
            letter-spacing: -0.02em;
            line-height: 1.15;
          }
          .bill-company-name.mak-text {
            color: #b45309;
          }
          .bill-company-name.boss-text {
            color: #0369a1;
          }
          .bill-company-tag {
            font-size: 0.85rem;
            font-weight: 700;
            text-transform: uppercase;
            color: #475569;
            letter-spacing: 0.06em;
            margin-top: 2px;
          }
          .bill-company-details {
            font-size: 0.78rem;
            color: #64748b;
            margin-top: 6px;
            line-height: 1.4;
          }
          .bill-meta-right {
            text-align: right;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
          }
          .bill-invoice-title {
            font-size: 1.4rem;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #0f172a;
          }
          .bill-meta-pill {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 700;
            margin-top: 4px;
          }
          .bill-meta-pill.paid-cash {
            background: #dcfce7;
            color: #15803d;
            border: 1px solid #86efac;
          }
          .bill-meta-pill.paid-upi {
            background: #e0f2fe;
            color: #0369a1;
            border: 1px solid #7dd3fc;
          }
          .bill-meta-pill.paid-card {
            background: #ede9fe;
            color: #6d28d9;
            border: 1px solid #c4b5fd;
          }
          .bill-meta-pill.paid-due {
            background: #fee2e2;
            color: #b91c1c;
            border: 1px solid #fca5a5;
          }
          .bill-meta-pill.paid-split {
            background: #fef3c7;
            color: #92400e;
            border: 1px solid #fcd34d;
          }
          .bill-number-text {
            font-family: monospace;
            font-size: 0.95rem;
            font-weight: 700;
            color: #0f172a;
            margin-top: 6px;
          }
          .bill-date-text {
            font-size: 0.82rem;
            color: #475569;
          }
          .bill-customer-bar {
            display: flex;
            justify-content: space-between;
            padding: 14px 0;
            border-bottom: 1px solid #e2e8f0;
            margin-bottom: 18px;
          }
          .bill-cust-col {
            font-size: 0.85rem;
          }
          .bill-cust-label {
            font-size: 0.72rem;
            text-transform: uppercase;
            color: #64748b;
            font-weight: 700;
            letter-spacing: 0.05em;
            margin-bottom: 2px;
          }
          .bill-cust-val {
            font-weight: 700;
            color: #0f172a;
          }
          .bill-items-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.84rem;
            margin-bottom: 20px;
          }
          .bill-items-table th {
            background: #f1f5f9;
            color: #334155;
            font-weight: 800;
            font-size: 0.74rem;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            padding: 8px 10px;
            border-top: 1px solid #cbd5e1;
            border-bottom: 1px solid #cbd5e1;
            text-align: left;
          }
          .bill-items-table th.num-col, .bill-items-table td.num-col {
            text-align: right;
          }
          .bill-items-table td {
            padding: 9px 10px;
            border-bottom: 1px solid #f1f5f9;
            color: #1e293b;
          }
          .bill-totals-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding-top: 10px;
            border-top: 2px solid #0f172a;
          }
          .bill-words-section {
            max-width: 55%;
          }
          .bill-words-title {
            font-size: 0.72rem;
            font-weight: 700;
            text-transform: uppercase;
            color: #64748b;
            letter-spacing: 0.04em;
          }
          .bill-words-text {
            font-size: 0.86rem;
            font-weight: 700;
            color: #0f172a;
            margin-top: 3px;
          }
          .bill-summary-col {
            width: 40%;
            display: flex;
            flex-direction: column;
            gap: 6px;
          }
          .bill-sum-row {
            display: flex;
            justify-content: space-between;
            font-size: 0.85rem;
            color: #475569;
          }
          .bill-grand-row {
            display: flex;
            justify-content: space-between;
            font-size: 1.25rem;
            font-weight: 900;
            color: #0f172a;
            padding-top: 8px;
            border-top: 2px solid #0f172a;
            margin-top: 4px;
          }
          .bill-footer {
            margin-top: 32px;
            padding-top: 16px;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            font-size: 0.76rem;
            color: #64748b;
          }
          .bill-signatory {
            text-align: center;
            border-top: 1px solid #94a3b8;
            padding-top: 6px;
            width: 180px;
            font-weight: 600;
            color: #334155;
          }
          @media print {
            body {
              background: #ffffff !important;
              color: #000000 !important;
            }
            .no-print, header, nav, button, input {
              display: none !important;
            }
            .invoice-capture-wrapper {
              box-shadow: none !important;
              padding: 0 !important;
              width: 100% !important;
            }
          }
        `}} />
        {/* Subtle Watermark */}
        <div className="invoice-watermark">
          {hasMak && hasBoss ? 'MAK & BOSS' : company}
        </div>

        {/* Top Header */}
        <div className="bill-top-header">
          <div className="bill-company-brand">
            <h1 className={`bill-company-name ${brandClass}`}>
              {brandTitle}
            </h1>
            <div className="bill-company-tag">
              {brandTag}
            </div>
            <div className="bill-company-details">
              Industrial Area, Main Market • Customer Care: +91 98765 43210<br />
              Email: billing@makbossindia.com
            </div>
          </div>

          <div className="bill-meta-right">
            <div className="bill-invoice-title">RETAIL BILL</div>
            <div className={`bill-meta-pill paid-${paymentMode.toLowerCase()}`}>
              {paymentMode === 'SPLIT' ? 'SPLIT (CASH + UPI)' : `PAID VIA ${paymentMode}`}
            </div>
            <div className="bill-number-text">
              Bill No: {invoiceNumber}
            </div>
            <div className="bill-date-text">
              Date: {date} {time}
            </div>
          </div>
        </div>

        {/* Customer & Billing Details Bar */}
        <div className="bill-customer-bar">
          <div className="bill-cust-col">
            <div className="bill-cust-label">Customer Details</div>
            <div className="bill-cust-val">
              {customerName.trim() ? customerName : 'Cash Customer / Retail'}
            </div>
            {customerPhone.trim() && (
              <div style={{ color: '#475569', fontSize: '0.8rem', marginTop: '2px' }}>
                Contact: +91 {customerPhone}
              </div>
            )}
            {sellerName && sellerName.trim() && (
              <div style={{ color: '#475569', fontSize: '0.8rem', marginTop: '2px' }}>
                <strong>Seller:</strong> {sellerName}
              </div>
            )}
          </div>

          <div className="bill-cust-col" style={{ textAlign: 'right' }}>
            <div className="bill-cust-label">Brand / Items</div>
            <div className="bill-cust-val" style={{ color: '#0f172a' }}>
              {hasMak && hasBoss
                ? 'MAK & BOSS Products'
                : hasMak
                ? 'MAK (MAK & Honda)'
                : 'BOSS Automotive'}
            </div>
            <div style={{ color: '#475569', fontSize: '0.8rem', marginTop: '2px' }}>
              Counter Sale Memo
            </div>
          </div>
        </div>

        {/* Items Table */}
        <table className="bill-items-table">
          <thead>
            <tr>
              <th style={{ width: '35px' }}>#</th>
              <th>Product Description</th>
              <th style={{ width: '85px' }}>Company</th>
              <th className="num-col" style={{ width: '55px' }}>Qty</th>
              <th className="num-col" style={{ width: '95px' }}>Rate (₹)</th>
              <th className="num-col" style={{ width: '80px' }}>Discount</th>
              <th className="num-col" style={{ width: '105px' }}>Total (₹)</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={item.id}>
                <td>{idx + 1}</td>
                <td>
                  <div style={{ fontWeight: '700', color: '#0f172a' }}>{item.name}</div>
                  {item.productCode && (
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      Code: {item.productCode}
                    </div>
                  )}
                </td>
                <td style={{ fontSize: '0.8rem', fontWeight: '700', color: item.company === 'MAK' ? '#b45309' : '#0369a1' }}>
                  {item.company}
                </td>
                <td className="num-col" style={{ fontWeight: '700' }}>
                  {item.qty}
                </td>
                <td className="num-col">
                  {item.rate.toFixed(2)}
                </td>
                <td className="num-col">
                  {item.discount > 0 ? (
                    item.discountType === 'percentage' ? `${item.discount}%` : `₹${item.discount}`
                  ) : '-'}
                </td>
                <td className="num-col" style={{ fontWeight: '800', color: '#0f172a' }}>
                  {item.totalAmount.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals Section */}
        <div className="bill-totals-section">
          <div className="bill-words-section">
            <div className="bill-words-title">Total in Words:</div>
            <div className="bill-words-text">
              {numberToIndianWords(grandTotal)}
            </div>

            {/* Split Payment Breakdown */}
            {paymentMode === 'SPLIT' && (
              <div style={{ marginTop: '14px', padding: '10px 12px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.8rem', color: '#1e293b' }}>
                <div style={{ fontWeight: 700, marginBottom: '4px', color: '#0f172a' }}>Payment Breakdown (Split Payment):</div>
                <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                  <span><strong>Cash:</strong> ₹{(cashReceived || 0).toFixed(2)}</span>
                  <span><strong>UPI / Online:</strong> ₹{(upiReceived || 0).toFixed(2)}</span>
                  <span><strong>Total Received:</strong> ₹{((cashReceived || 0) + (upiReceived || 0)).toFixed(2)}</span>
                </div>
                {changeReturn > 0 && (
                  <div style={{ marginTop: '4px', color: '#15803d', fontWeight: 600 }}>
                    Change Returned: ₹{changeReturn.toFixed(2)}
                  </div>
                )}
              </div>
            )}

            {paymentMode === 'CASH' && cashReceived !== undefined && cashReceived > 0 && (
              <div style={{ marginTop: '14px', padding: '8px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '0.78rem', color: '#334155' }}>
                <strong>Cash Tendered:</strong> ₹{cashReceived.toFixed(2)} &nbsp;|&nbsp; 
                <strong> Change Returned:</strong> ₹{changeReturn.toFixed(2)}
              </div>
            )}

            {paymentMode === 'UPI' && (
              <div style={{ marginTop: '14px', padding: '8px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '4px', fontSize: '0.78rem', color: '#166534' }}>
                <strong>Payment:</strong> 100% Paid via UPI / QR Code (₹{grandTotal.toFixed(2)})
              </div>
            )}

            <div style={{ marginTop: '18px', fontSize: '0.74rem', color: '#64748b', lineHeight: '1.4' }}>
              <strong>Terms & Conditions:</strong><br />
              1. Goods once sold will not be returned without this bill memo.<br />
              2. Thank you for your business. Visit again!
            </div>
          </div>

          <div className="bill-summary-col">
            <div className="bill-sum-row">
              <span>Subtotal:</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            {totalDiscount > 0 && (
              <div className="bill-sum-row" style={{ color: '#15803d' }}>
                <span>Discount:</span>
                <span>-₹{totalDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="bill-grand-row">
              <span>Grand Total:</span>
              <span>₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer Signature */}
        <div className="bill-footer">
          <div>
            Computer Generated Receipt
          </div>
          <div className="bill-signatory">
            {sellerName && sellerName.trim() && (
              <div style={{ fontSize: '0.78rem', color: '#475569', marginBottom: '6px' }}>
                Billed by: <strong>{sellerName}</strong>
              </div>
            )}
            For {hasMak && hasBoss ? 'MAK & BOSS AUTOMOTIVE' : hasMak ? 'MAK LUBRICANTS' : 'BOSS AUTOMOTIVE'}<br />
            <br />
            <span>Authorized Signatory</span>
          </div>
        </div>
      </div>
    );
  }
);

PrintableBill.displayName = 'PrintableBill';
