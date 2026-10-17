import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Plus, Minus, Trash2, AlertCircle, Package, ChevronRight, CheckCircle } from 'lucide-react';
import { products as productsApi } from '../services/api';

const ProductSelector = ({ onSelect, selectedItems = [], onRemove, onUpdateQuantity }) => {
  const [searchTerm, setSearchTerm]           = useState('');
  const [results, setResults]                 = useState([]);
  const [allProducts, setAllProducts]         = useState([]);
  const [loading, setLoading]                 = useState(false);
  const [isOpen, setIsOpen]                   = useState(false);
  const [hasSearched, setHasSearched]         = useState(false);
  const [inventoryLoaded, setInventoryLoaded] = useState(false);

  // Last selected product from inventory — shown as a info card
  const [lastSelected, setLastSelected] = useState(null);

  // Manual add form — only Name + Price (no unit)
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [manualProduct, setManualProduct] = useState({ name: '', price: '' });

  const dropdownRef = useRef(null);
  const inputRef    = useRef(null);

  // ── Load all inventory products once on mount ─────────────────────
  const loadInventory = useCallback(async () => {
    if (inventoryLoaded) return;
    try {
      const res  = await productsApi.getAll('');
      const data = res.data?.data;
      setAllProducts(Array.isArray(data) ? data : []);
    } catch (_) {
      setAllProducts([]);
    }
    setInventoryLoaded(true);
  }, [inventoryLoaded]);

  useEffect(() => { loadInventory(); }, [loadInventory]);

  // ── Debounced search ──────────────────────────────────────────────
  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      setHasSearched(true);
      try {
        const res  = await productsApi.getAll(searchTerm);
        const data = res.data?.data;
        setResults(Array.isArray(data) ? data : []);
        setIsOpen(true);
      } catch {
        // local fallback
        const lower = searchTerm.toLowerCase();
        setResults(
          allProducts.filter((p) =>
            p.name?.toLowerCase().includes(lower) ||
            (Array.isArray(p.aliases) ? p.aliases.join(' ') : p.aliases || '').toLowerCase().includes(lower) ||
            p.category?.toLowerCase().includes(lower)
          )
        );
        setIsOpen(true);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, allProducts]);

  // ── Close dropdown on outside click ──────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Select product from inventory ─────────────────────────────────
  const handleSelectProduct = (product) => {
    onSelect(product);
    setLastSelected(product);      // ← show the product card
    setSearchTerm('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // ── Manual add — save product to DB, then use real _id ─────────────
  const handleAddManual = async () => {
    if (!manualProduct.name.trim() || !manualProduct.price) return;

    const price = parseFloat(manualProduct.price) || 0;
    let product;

    try {
      // Save product to inventory database first
      const res = await productsApi.create({
        name: manualProduct.name.trim(),
        sellingPrice: price,
        purchaseCost: price,
        unit: 'pcs',
        currentStock: 999,
        reorderLevel: 10,
        category: 'General',
        taxRate: 0,
      });
      const saved = res.data?.data;
      if (saved?._id) {
        product = saved;
      }
    } catch (err) {
      console.error('Could not save product to DB:', err);
    }

    // Use real DB product if saved, otherwise fallback
    if (!product) {
      product = {
        _id:          'manual-' + Date.now(),
        name:         manualProduct.name.trim(),
        sellingPrice: price,
        unit:         'pcs',
        currentStock: 999,
        isManual:     true,
      };
    }

    onSelect(product);
    setLastSelected(null);
    setManualProduct({ name: '', price: '' });
    setShowManualAdd(false);
    setSearchTerm('');
    // Reload inventory so the new product appears in search
    setInventoryLoaded(false);
  };

  // Dropdown display list
  const displayList  = searchTerm.trim() ? results : allProducts;
  const selectedIds  = new Set(selectedItems.map((i) => i.productId));
  const filteredList = displayList.filter((p) => !selectedIds.has(p._id));
  const noProductsInDB = inventoryLoaded && allProducts.length === 0;

  return (
    <div className="product-selector-component" ref={dropdownRef}>

      {/* ── Search Input ──────────────────────────────────────────── */}
      <div className="form-group" style={{ marginBottom: '0.75rem' }}>
        <label className="form-label">Search &amp; Add Products / सामान खोजें</label>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>

          {/* input wrapper — dropdown anchors to this */}
          <div style={{ position: 'relative', flex: 1 }}>
            <Search
              size={16}
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}
            />
            <input
              ref={inputRef}
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.25rem' }}
              placeholder={noProductsInDB ? 'No products yet — use Manual Add →' : 'Type to search or click to browse inventory…'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsOpen(true)}
            />

            {/* ── Dropdown ────────────────────────────────────────── */}
            {isOpen && (
              <div className="selector-dropdown">

                {/* inventory count header */}
                {!searchTerm.trim() && allProducts.length > 0 && (
                  <div style={{
                    padding: '0.5rem 0.85rem', fontSize: '0.72rem', fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)',
                    background: '#f8fafc', borderBottom: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <Package size={12} /> Inventory ({allProducts.length} products)
                  </div>
                )}

                {loading ? (
                  <div style={{ padding: '0.85rem 1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    🔍 Searching…
                  </div>

                ) : filteredList.length > 0 ? (
                  filteredList.map((prod) => {
                    const isOutOfStock = prod.currentStock <= 0;
                    const isLowStock   = !isOutOfStock && prod.currentStock <= (prod.reorderLevel || 5);
                    return (
                      <div
                        key={prod._id}
                        className="selector-option"
                        onMouseDown={(e) => { e.preventDefault(); handleSelectProduct(prod); }}
                        style={{ opacity: isOutOfStock ? 0.55 : 1 }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="selector-option-main">
                            {prod.name}
                            {prod.category && (
                              <span style={{ marginLeft: 6, fontSize: '0.68rem', background: '#f1f5f9', padding: '1px 5px', borderRadius: 4, color: 'var(--text-muted)' }}>
                                {prod.category}
                              </span>
                            )}
                          </div>
                          <div className="selector-option-sub" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ color: isOutOfStock ? 'var(--danger)' : isLowStock ? '#d97706' : 'var(--text-secondary)' }}>
                              {isOutOfStock ? '❌ Out of stock' : `Stock: ${prod.currentStock} ${prod.unit || ''}`}
                            </span>
                            {isLowStock && <span style={{ color: '#d97706', fontSize: '0.7rem' }}>⚠ Low</span>}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.95rem' }}>₹{prod.sellingPrice}</div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>per {prod.unit || 'unit'}</div>
                        </div>
                        <ChevronRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      </div>
                    );
                  })

                ) : noProductsInDB ? (
                  <div style={{ padding: '1rem', textAlign: 'center' }}>
                    <AlertCircle size={20} color="var(--warning)" style={{ marginBottom: 6 }} />
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: 4 }}>
                      No products in inventory yet!
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 10 }}>
                      Go to <strong>Products</strong> page to add inventory, or use Manual Add.
                    </div>
                    <button
                      type="button" className="btn btn-outline btn-sm" style={{ width: '100%' }}
                      onMouseDown={(e) => { e.preventDefault(); setShowManualAdd(true); setIsOpen(false); }}
                    >
                      <Plus size={13} /> Add manually for this bill
                    </button>
                  </div>

                ) : hasSearched ? (
                  <div style={{ padding: '1rem', textAlign: 'center' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 8 }}>
                      No match for <strong>"{searchTerm}"</strong>
                    </div>
                    <button
                      type="button" className="btn btn-outline btn-sm" style={{ width: '100%' }}
                      onMouseDown={(e) => { e.preventDefault(); setManualProduct({ name: searchTerm, price: '' }); setShowManualAdd(true); setIsOpen(false); }}
                    >
                      <Plus size={13} /> Add "{searchTerm}" manually
                    </button>
                  </div>

                ) : (
                  <div style={{ padding: '0.85rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Loading inventory…
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Manual add toggle button */}
          <button
            type="button"
            className="btn btn-outline btn-sm"
            style={{ whiteSpace: 'nowrap', flexShrink: 0, alignSelf: 'flex-start' }}
            onClick={() => setShowManualAdd((v) => !v)}
            title="Add product manually"
          >
            <Plus size={14} /> Manual
          </button>
        </div>
      </div>

      {/* ── Last-selected Inventory Product Card ─────────────────── */}
      {lastSelected && !String(lastSelected._id).startsWith('manual-') && (
        <div style={{
          background: '#f0fdf4',
          border: '1px solid #86efac',
          borderRadius: 'var(--radius-sm)',
          padding: '0.75rem 1rem',
          marginBottom: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          <CheckCircle size={18} color="#16a34a" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#15803d' }}>
              {lastSelected.name}
              {lastSelected.category && (
                <span style={{ marginLeft: 6, fontSize: '0.7rem', background: '#dcfce7', color: '#166534', padding: '1px 6px', borderRadius: 99, fontWeight: 600 }}>
                  {lastSelected.category}
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#166534', marginTop: 2, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <span>💰 Price: <strong>₹{lastSelected.sellingPrice}</strong></span>
              <span>
                📦 Stock:{' '}
                <strong style={{ color: lastSelected.currentStock <= 0 ? '#dc2626' : lastSelected.currentStock <= (lastSelected.reorderLevel || 5) ? '#d97706' : '#15803d' }}>
                  {lastSelected.currentStock} {lastSelected.unit || ''}
                </strong>
              </span>
              {lastSelected.reorderLevel && (
                <span>🔁 Reorder at: {lastSelected.reorderLevel}</span>
              )}
            </div>
          </div>
          <button
            type="button"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#6b7280', padding: '2px 4px' }}
            onClick={() => setLastSelected(null)}
            title="Dismiss"
          >✕</button>
        </div>
      )}

      {/* ── Manual Add Form — only Name + Price, NO unit ─────────── */}
      {showManualAdd && (
        <div style={{
          background: '#fffbeb', border: '1px solid #fde68a',
          borderRadius: 'var(--radius-sm)', padding: '0.85rem', marginBottom: '0.75rem',
        }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#92400e', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertCircle size={14} /> Manual Add (not saved to inventory)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.5rem', alignItems: 'end' }}>
            {/* Product Name */}
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 3 }}>Product Name</label>
              <input
                type="text"
                className="form-input"
                style={{ height: '36px', fontSize: '0.875rem' }}
                placeholder="e.g. Parle-G"
                value={manualProduct.name}
                onChange={(e) => setManualProduct({ ...manualProduct, name: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleAddManual()}
                autoFocus
              />
            </div>
            {/* Price only — no unit */}
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 3 }}>Price (₹)</label>
              <input
                type="number"
                className="form-input"
                style={{ height: '36px', fontSize: '0.875rem' }}
                placeholder="0"
                value={manualProduct.price}
                onChange={(e) => setManualProduct({ ...manualProduct, price: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleAddManual()}
                min="0"
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem' }}>
            <button
              type="button" className="btn btn-primary btn-sm" style={{ flex: 1 }}
              onClick={handleAddManual}
              disabled={!manualProduct.name.trim() || !manualProduct.price}
            >
              <Plus size={14} /> Add to Bill
            </button>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowManualAdd(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Selected Items List ───────────────────────────────────── */}
      {selectedItems.length > 0 && (
        <div style={{ marginTop: '0.5rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Added Items ({selectedItems.length})
          </div>

          {selectedItems.map((item, index) => {
            const unitPrice    = Number(item.sellingPrice || item.price || 0);
            const qty          = Number(item.quantity || 1);
            const lineTotal    = unitPrice * qty;
            const isManual     = String(item.productId).startsWith('manual-');
            const isOutOfStock = !isManual && item.currentStock !== undefined && item.currentStock <= 0;
            const isLowStock   = !isManual && !isOutOfStock && item.currentStock !== undefined && item.currentStock <= (item.reorderLevel || 5);

            return (
              <div key={item.productId || item._id || index} className="item-row">

                {/* Product info */}
                <div className="item-row-info">
                  <div className="item-row-name" style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                    <span>{item.name}</span>
                    {/* Inventory vs Manual badge */}
                    {isManual ? (
                      <span style={{ fontSize: '0.62rem', background: '#fef3c7', color: '#92400e', padding: '1px 5px', borderRadius: 99, fontWeight: 700 }}>
                        Manual
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.62rem', background: '#eff6ff', color: '#1d4ed8', padding: '1px 5px', borderRadius: 99, fontWeight: 700 }}>
                        📦 Inventory
                      </span>
                    )}
                    {isOutOfStock && (
                      <span style={{ fontSize: '0.62rem', background: '#fef2f2', color: '#dc2626', padding: '1px 5px', borderRadius: 99 }}>❌ Out of stock</span>
                    )}
                    {isLowStock && (
                      <span style={{ fontSize: '0.62rem', background: '#fffbeb', color: '#d97706', padding: '1px 5px', borderRadius: 99 }}>⚠ Low stock</span>
                    )}
                  </div>

                  {/* Price + stock info */}
                  <div className="item-row-unit-price">
                    ₹{unitPrice} / {item.unit || 'pc'}
                    {!isManual && item.currentStock !== undefined && (
                      <span style={{ marginLeft: 8, color: isOutOfStock ? 'var(--danger)' : isLowStock ? '#d97706' : 'var(--text-muted)' }}>
                        • Stock: {item.currentStock} {item.unit || ''}
                      </span>
                    )}
                    {item.category && (
                      <span style={{ marginLeft: 6, color: 'var(--text-muted)' }}>• {item.category}</span>
                    )}
                  </div>
                </div>

                {/* Quantity controls */}
                <div className="item-row-qty">
                  <button
                    type="button" className="btn-icon"
                    onClick={() => onUpdateQuantity && onUpdateQuantity(item.productId, Math.max(1, qty - 1))}
                  >
                    <Minus size={13} />
                  </button>
                  <input
                    type="number" min="1" value={qty}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (onUpdateQuantity && !isNaN(val) && val >= 1) onUpdateQuantity(item.productId, val);
                    }}
                  />
                  <button
                    type="button" className="btn-icon"
                    onClick={() => onUpdateQuantity && onUpdateQuantity(item.productId, qty + 1)}
                  >
                    <Plus size={13} />
                  </button>
                </div>

                {/* Line total */}
                <div className="item-row-price">₹{lineTotal.toFixed(2)}</div>

                {/* Remove */}
                <button
                  type="button" className="item-row-delete"
                  onClick={() => onRemove && onRemove(item.productId)}
                  title="Remove"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProductSelector;
