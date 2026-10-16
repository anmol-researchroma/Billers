'use client';

import React, { useState, useMemo } from 'react';
import { Company, Product, InvoiceItem } from '@/types/billing';
import { getCompanyProducts, allProducts } from '@/data/products';
import { Plus, Percent, IndianRupee, Layers, CheckCircle2, Search } from 'lucide-react';
import { formatCurrency } from '@/utils/numberToWords';

interface ProductFormProps {
  currentCompany: Company;
  selectedProduct: Product | null;
  onSelectProduct: (product: Product | null) => void;
  onAddItem: (item: InvoiceItem) => void;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  currentCompany,
  selectedProduct,
  onSelectProduct,
  onAddItem,
}) => {
  // All products for the currently selected company (MAK has MAK & Honda; BOSS has all rest)
  const companyProducts = useMemo(() => getCompanyProducts(currentCompany), [currentCompany]);

  // Quick filter query to help seller find items inside this company
  const [filterQuery, setFilterQuery] = useState('');

  // Filtered dropdown list
  const filteredProducts = useMemo(() => {
    if (!filterQuery.trim()) return companyProducts;
    const q = filterQuery.toLowerCase();
    return companyProducts.filter((p) =>
      p.name.toLowerCase().includes(q) || (p.productCode && p.productCode.toLowerCase().includes(q))
    );
  }, [companyProducts, filterQuery]);

  // Current active product
  const activeProduct = selectedProduct && selectedProduct.company === currentCompany
    ? selectedProduct
    : filteredProducts[0] || companyProducts[0] || null;

  // Manual seller inputs: Rate/Price and Discount
  const [rateInput, setRateInput] = useState<string>('');
  const [qty, setQty] = useState<number>(1);
  const [discountInput, setDiscountInput] = useState<string>('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [justAdded, setJustAdded] = useState(false);

  // Handle product dropdown selection
  const handleProductChange = (productIdStr: string) => {
    const id = parseInt(productIdStr, 10);
    const prod = allProducts.find((p) => p.id === id);
    if (prod) {
      onSelectProduct(prod);
    }
  };

  const rate = parseFloat(rateInput) || 0;
  const discountVal = parseFloat(discountInput) || 0;

  // Calculations (Manual price & discount, no GST)
  const gross = rate * qty;
  const discountAmount = discountType === 'percentage' 
    ? (gross * (discountVal / 100))
    : Math.min(discountVal, gross);
  
  const lineTotal = Math.max(0, gross - discountAmount);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProduct) return;
    if (rate <= 0) {
      alert('Please enter a valid price for the product.');
      return;
    }

    const newItem: InvoiceItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      productId: activeProduct.id,
      name: activeProduct.name,
      company: currentCompany,
      productCode: activeProduct.productCode,
      rate,
      qty: Math.max(1, Number(qty) || 1),
      discount: discountVal,
      discountType,
      grossAmount: gross,
      discountAmount,
      totalAmount: lineTotal,
    };

    onAddItem(newItem);
    setJustAdded(true);
    // Reset inputs for fast entry of next product
    setRateInput('');
    setDiscountInput('');
    setQty(1);
    setTimeout(() => setJustAdded(false), 1200);
  };

  return (
    <form onSubmit={handleAdd} className="panel-card animate-fade-in" id="product-configuration-panel">
      <div className="panel-card-header">
        <h2 className="panel-title">
          <Layers size={18} color={currentCompany === 'MAK' ? 'var(--mak-primary)' : 'var(--boss-primary)'} />
          <span>Product Selection & Manual Price</span>
        </h2>
        <span className={`badge ${currentCompany === 'MAK' ? 'badge-mak' : 'badge-boss'}`}>
          {currentCompany === 'MAK' ? 'MAK (MAK & Honda)' : 'BOSS Products'} ({companyProducts.length})
        </span>
      </div>

      {/* Direct Product Selection Field (No Category Section) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label className="form-label" htmlFor="product-select">
            Select Product from {currentCompany === 'MAK' ? 'MAK (MAK & Honda)' : 'BOSS'}:
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '0.3rem 0.65rem' }}>
            <Search size={12} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Filter list..."
              style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '0.78rem', outline: 'none', width: '130px', padding: '0 0.35rem' }}
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
            />
          </div>
        </div>

        <select
          id="product-select"
          className="form-select"
          size={5}
          style={{ height: '140px', padding: '0.4rem' }}
          value={activeProduct?.id || ''}
          onChange={(e) => handleProductChange(e.target.value)}
        >
          {filteredProducts.map((p) => (
            <option key={p.id} value={p.id} style={{ padding: '0.35rem 0.5rem' }}>
              {p.name} {p.productCode ? `• [${p.productCode}]` : ''}
            </option>
          ))}
        </select>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Showing {filteredProducts.length} products • Click any product to select it
        </span>
      </div>

      {/* Manual Pricing & Quantity Configuration */}
      <div className="config-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {/* Price / Rate (Manual seller input) */}
        <div className="form-group">
          <label className="form-label" htmlFor="rate-input">
            Price / Rate (₹) *
          </label>
          <input
            type="number"
            id="rate-input"
            className="form-input"
            min="0"
            step="any"
            placeholder="Enter price..."
            value={rateInput}
            onChange={(e) => setRateInput(e.target.value)}
            required
          />
        </div>

        {/* Quantity Stepper */}
        <div className="form-group">
          <label className="form-label" htmlFor="qty-input">
            Quantity
          </label>
          <div className="stepper-box">
            <button
              type="button"
              className="stepper-btn"
              onClick={() => setQty((prev) => Math.max(1, prev - 1))}
            >
              -
            </button>
            <input
              type="number"
              id="qty-input"
              className="stepper-input"
              min="1"
              value={qty}
              onChange={(e) => setQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
            />
            <button
              type="button"
              className="stepper-btn"
              onClick={() => setQty((prev) => prev + 1)}
            >
              +
            </button>
          </div>
        </div>

        {/* Discount input with type toggle */}
        <div className="form-group">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label className="form-label" htmlFor="discount-input">
              Discount
            </label>
            <button
              type="button"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.7rem',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                padding: '0 2px',
              }}
              onClick={() =>
                setDiscountType((prev) => (prev === 'percentage' ? 'fixed' : 'percentage'))
              }
              title="Toggle between % and ₹ discount"
            >
              {discountType === 'percentage' ? (
                <>
                  <Percent size={11} /> <span>(%)</span>
                </>
              ) : (
                <>
                  <IndianRupee size={11} /> <span>(₹)</span>
                </>
              )}
            </button>
          </div>
          <input
            type="number"
            id="discount-input"
            className="form-input"
            min="0"
            step="any"
            value={discountInput}
            placeholder={discountType === 'percentage' ? '0 %' : '₹ 0'}
            onChange={(e) => setDiscountInput(e.target.value)}
          />
        </div>
      </div>

      {/* Real-time Subtotal bar & Add to Bill Button */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(11, 17, 32, 0.9)',
          padding: '0.85rem 1.25rem',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Selected Item Total:
          </span>
          <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)' }}>
            {formatCurrency(lineTotal)}
          </div>
        </div>

        <button
          type="submit"
          className={`btn ${currentCompany === 'MAK' ? 'btn-primary-mak' : 'btn-primary-boss'}`}
          id="btn-add-item-to-bill"
        >
          {justAdded ? (
            <>
              <CheckCircle2 size={18} />
              <span>Added to Bill!</span>
            </>
          ) : (
            <>
              <Plus size={18} />
              <span>Add to Bill</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
