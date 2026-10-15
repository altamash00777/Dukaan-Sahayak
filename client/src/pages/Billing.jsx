import React, { useState, useCallback } from 'react';
import {
  Receipt, CheckCircle, Plus, Send, RefreshCw,
  Trash2, Package, User, MessageCircle, Smartphone,
} from 'lucide-react';
import CustomerSelector from '../components/CustomerSelector';
import ProductSelector from '../components/ProductSelector';
import InvoicePreview from '../components/InvoicePreview';
import Modal from '../components/Modal';
import Alert from '../components/Alert';
import { invoices as invoicesApi, customers as customersApi, whatsapp as whatsappApi } from '../services/api';

const Billing = () => {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [items, setItems] = useState([]); // [{_id, productId, name, unit, sellingPrice, quantity}]
  const [paymentMode, setPaymentMode] = useState('cash');
  const [discount, setDiscount] = useState(''); // string so user can type freely
  const [notes, setNotes] = useState('');

  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [draftInvoice, setDraftInvoice] = useState(null);
  const [confirmedInvoice, setConfirmedInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alertInfo, setAlertInfo] = useState({ type: '', message: '' });

  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustForm, setNewCustForm] = useState({ name: '', phone: '', address: '' });

  const [showWAModal, setShowWAModal] = useState(false);
  const [waPhone, setWaPhone] = useState('');
  const [waSending, setWaSending] = useState(false);
  const [waInvoiceRef, setWaInvoiceRef] = useState(null); // invoice obj to send


  // ── Computed Totals ───────────────────────────────────────────
  const subtotal    = items.reduce((sum, it) => sum + Number(it.sellingPrice || 0) * Number(it.quantity || 1), 0);
  const discountVal = Math.min(Math.max(parseFloat(discount) || 0, 0), subtotal);
  const taxableAmount = subtotal - discountVal;
  const grandTotal  = Math.round(taxableAmount * 100) / 100;

  // ── Handlers ─────────────────────────────────────────────────
  const handleSelectProduct = useCallback((product) => {
    setItems((prev) => {
      const id  = product._id || product.id;
      const idx = prev.findIndex((it) => it.productId === id);
      if (idx > -1) {
        // Already in list — just bump quantity
        const updated = [...prev];
        updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + 1 };
        return updated;
      }
      return [
        ...prev,
        {
          productId:    product._id || product.id,
          name:         product.name,
          unit:         product.unit || 'pcs',
          sellingPrice: Number(product.sellingPrice || 0),
          quantity:     1,

          currentStock:  product.currentStock,
          reorderLevel:  product.reorderLevel,
          category:      product.category || '',
        },
      ];
    });
  }, []);

  const handleUpdateQuantity = useCallback((productId, newQty) => {
    if (newQty < 1) return;
    setItems((prev) => prev.map((it) => (it.productId === productId ? { ...it, quantity: newQty } : it)));
  }, []);

  const handleRemoveItem = useCallback((productId) => {
    setItems((prev) => prev.filter((it) => it.productId !== productId));
  }, []);

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    const name = newCustForm.name.trim();
    if (!name) {
      setAlertInfo({ type: 'error', message: 'Customer name is required.' });
      return;
    }
    try {
      const res = await customersApi.create({
        name,
        phone:   newCustForm.phone.trim() || '',     // phone now optional in schema
        address: newCustForm.address.trim() || '',
      });
      // Backend returns { success, data: <customer doc> }
      const created = res.data?.data || res.data;
      const customerObj = {
        _id:                created?._id   || String(Date.now()),
        name:               created?.name  || name,
        phone:              created?.phone || newCustForm.phone || '',
        address:            created?.address || newCustForm.address || '',
        outstandingBalance: created?.outstandingBalance || 0,
      };
      setSelectedCustomer(customerObj);
      setShowAddCustomerModal(false);
      setNewCustForm({ name: '', phone: '', address: '' });
      setAlertInfo({ type: 'success', message: `✅ Customer "${customerObj.name}" added!` });
    } catch (err) {
      const serverMsg = err.response?.data?.message || '';
      // Use a local fallback object so billing can still continue
      const fallback = {
        _id:                'local-' + Date.now(),
        name,
        phone:              newCustForm.phone || '',
        address:            newCustForm.address || '',
        outstandingBalance: 0,
      };
      setSelectedCustomer(fallback);
      setShowAddCustomerModal(false);
      setNewCustForm({ name: '', phone: '', address: '' });
      setAlertInfo({
        type:    'warning',
        message: serverMsg
          ? `Customer saved locally (server: ${serverMsg})`
          : `Customer "${name}" saved locally for this bill.`,
      });
    }
  };

  // ── Preview (Create Draft) ────────────────────────────────────
  const handleOpenPreview = async () => {
    if (items.length === 0) {
      setAlertInfo({ type: 'warning', message: 'Kripya kam se kam ek product add karein.' });
      return;
    }

    setLoading(true);
    setAlertInfo({ type: '', message: '' });

    // If any item is manually added (no real DB productId), skip API and use local draft
    const hasManualItems = items.some((it) => String(it.productId).startsWith('manual-'));

    if (hasManualItems) {
      const localDraft = buildLocalDraft();
      setDraftInvoice(localDraft);
      setShowPreviewModal(true);
      setLoading(false);
      return;
    }

    // All items are real DB products — create draft via API
    const draftPayload = {
      customerId: selectedCustomer?._id || null,
      items: items.map((it) => ({
        productId: it.productId,
        quantity:  Number(it.quantity),
        unitPrice: Number(it.sellingPrice),
      })),
      discountAmount: discountVal,
      notes,
    };

    try {
      const res = await invoicesApi.createDraft(draftPayload);
      const draft = res.data?.data || res.data;
      setDraftInvoice(draft);
      setShowPreviewModal(true);
    } catch (err) {
      console.warn('Draft API error — using local fallback:', err.response?.data?.message || err.message);
      // Fallback to local preview
      setDraftInvoice(buildLocalDraft());
      setShowPreviewModal(true);
      setAlertInfo({
        type: 'warning',
        message: err.response?.data?.message || 'Server error — showing local preview. Stock will not be auto-deducted.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Build a local draft object (no DB save)
  const buildLocalDraft = () => ({
    _id:          'LOCAL-' + Date.now(),
    invoiceNumber: 'DRAFT-' + Math.floor(1000 + Math.random() * 9000),
    customerName:  selectedCustomer?.name  || 'Cash Customer / नगद',
    customerPhone: selectedCustomer?.phone || '',
    createdAt:     new Date().toISOString(),
    items: items.map((it) => ({
      name:         it.name,
      quantity:     it.quantity,
      unit:         it.unit,
      sellingPrice: it.sellingPrice,
      price:        it.sellingPrice,
      total:        it.sellingPrice * it.quantity,
    })),
    subtotal,
    discount:    discountVal,
    tax:         0,
    totalAmount: grandTotal,
    grandTotal,
    paymentMode,
    notes,
    isLocal: true,
  });

  // ── Confirm Invoice ───────────────────────────────────────────
  const handleConfirmInvoice = async (invoiceId) => {
    setLoading(true);

    // If it's a local draft (not saved to DB), just show success
    if (draftInvoice?.isLocal) {
      const fakeConfirmed = {
        ...draftInvoice,
        invoiceNumber: 'INV-' + Math.floor(10000 + Math.random() * 90000),
        paymentMode,
        status: 'confirmed',
      };
      setConfirmedInvoice(fakeConfirmed);
      setShowPreviewModal(false);
      setDraftInvoice(null);
      setLoading(false);
      setAlertInfo({
        type: 'success',
        message: `Bill ${fakeConfirmed.invoiceNumber} saved! (Note: Add real products via Products page for full stock tracking)`,
      });
      return;
    }

    try {
      const paymentData = {
        paymentStatus: paymentMode === 'credit' ? 'pending' : 'paid',
        paymentMethod: paymentMode,
        amountPaid: paymentMode === 'credit' ? 0 : grandTotal,
        notes,
      };

      const res = await invoicesApi.confirmInvoice(invoiceId, paymentData);
      const confirmed = res.data?.data || res.data;

      setConfirmedInvoice(confirmed);
      setShowPreviewModal(false);
      setDraftInvoice(null);
      setAlertInfo({
        type: 'success',
        message: `✅ Invoice #${confirmed.invoiceNumber || invoiceId} saved! Stock updated.`,
      });
    } catch (err) {
      console.error('Confirm error:', err.response?.data || err.message);
      setAlertInfo({
        type: 'error',
        message: err.response?.data?.message || 'Bill confirm karne mein error aaya. Dobara try karein.',
      });
    } finally {
      setLoading(false);
    }
  };

  // ── WhatsApp — Open modal ─────────────────────────────────────
  const handleSendWhatsApp = (inv) => {
    const invoice = inv || confirmedInvoice || draftInvoice;
    setWaInvoiceRef(invoice);
    // Pre-fill phone from invoice or selected customer
    const phone = invoice?.customerPhone || invoice?.customerSnapshot?.phone || selectedCustomer?.phone || '';
    setWaPhone(phone);
    setShowWAModal(true);
  };

  // ── WhatsApp — Actually send ──────────────────────────────────
  const handleWASend = async () => {
    if (!waPhone.trim()) {
      setAlertInfo({ type: 'error', message: 'Phone number is required.' });
      return;
    }
    const invoice = waInvoiceRef;
    setWaSending(true);

    try {
      // Try Twilio first (real WhatsApp delivery)
      if (invoice?._id && !String(invoice._id).startsWith('LOCAL-') && !String(invoice._id).startsWith('AI-DRAFT-')) {
        // DB invoice → use invoiceId
        await whatsappApi.sendInvoice(invoice._id, waPhone);
      } else {
        // Local/draft invoice → send bill data
        await whatsappApi.sendBill({
          invoiceNumber: invoice?.invoiceNumber || 'DRAFT-' + Date.now(),
          customerName:  invoice?.customerName || selectedCustomer?.name || 'Customer',
          items,
          subtotal,
          discount:      discountVal,
          grandTotal,
          paymentMode,
        }, waPhone);
      }
      setAlertInfo({ type: 'success', message: `✅ Bill sent to WhatsApp +91${waPhone.replace(/\D/g,'')}!` });
      setShowWAModal(false);
    } catch (err) {
      // Fallback: open wa.me link
      console.warn('Twilio send failed, falling back to wa.me:', err.message);
      const number = waPhone.replace(/\D/g, '');
      const shopName = localStorage.getItem('shopName') || 'Dukaan Sahayak';
      const invNo    = invoice?.invoiceNumber || 'BILL';
      const total    = invoice?.totalAmount || invoice?.grandTotal || grandTotal;
      const text =
        `🛒 *${shopName}*\n` +
        `📋 Invoice: *${invNo}*\n` +
        `💰 Total: *₹${Number(total).toFixed(2)}*\n` +
        `💳 Mode: ${paymentMode.toUpperCase()}\n\n` +
        `Items:\n` +
        items.map((it) => `• ${it.name} × ${it.quantity} = ₹${(it.sellingPrice * it.quantity).toFixed(2)}`).join('\n') +
        `\n\nDhanyawad! 🙏`;
      window.open(`https://wa.me/91${number}?text=${encodeURIComponent(text)}`, '_blank');
      setAlertInfo({ type: 'warning', message: 'Twilio not configured — opened WhatsApp app directly.' });
      setShowWAModal(false);
    } finally {
      setWaSending(false);
    }
  };

  // ── wa.me direct link (instant, no server) ────────────────────
  const handleWADirect = () => {
    const invoice  = waInvoiceRef;
    const number   = waPhone.replace(/\D/g, '');
    const shopName = localStorage.getItem('shopName') || 'Dukaan Sahayak';
    const invNo    = invoice?.invoiceNumber || 'BILL';
    const total    = invoice?.totalAmount || invoice?.grandTotal || grandTotal;
    const text =
      `🛒 *${shopName}*\n` +
      `📋 Invoice: *${invNo}*\n` +
      `💰 Total: *₹${Number(total).toFixed(2)}*\n` +
      `💳 Mode: ${paymentMode.toUpperCase()}\n\n` +
      `Items:\n` +
      items.map((it) => `• ${it.name} × ${it.quantity} = ₹${(it.sellingPrice * it.quantity).toFixed(2)}`).join('\n') +
      `\n\nDhanyawad! 🙏`;
    if (!number) { alert('Enter phone number first'); return; }
    window.open(`https://wa.me/91${number}?text=${encodeURIComponent(text)}`, '_blank');
  };


  // ── Reset ─────────────────────────────────────────────────────
  const handleResetBill = () => {
    setSelectedCustomer(null);
    setItems([]);
    setPaymentMode('cash');
    setDiscount('');
    setNotes('');
    setDraftInvoice(null);
    setConfirmedInvoice(null);
    setAlertInfo({ type: '', message: '' });
  };

  // ── Render ────────────────────────────────────────────────────
  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">New Sale / नया बिल</h1>
          <p className="page-subtitle">Add products, select customer, and generate GST invoice instantly</p>
        </div>
        <button type="button" className="btn btn-outline btn-sm" onClick={handleResetBill}>
          <RefreshCw size={14} /> New Bill
        </button>
      </div>

      {/* Alert */}
      {alertInfo.message && (
        <Alert type={alertInfo.type} message={alertInfo.message} onClose={() => setAlertInfo({ type: '', message: '' })} />
      )}

      {/* ── Confirmed Invoice Banner ── */}
      {confirmedInvoice && (
        <div className="invoice-confirmed-banner">
          <div className="invoice-confirmed-left">
            <CheckCircle size={36} color="var(--success)" />
            <div>
              <div className="invoice-confirmed-title">
                Bill #{confirmedInvoice.invoiceNumber || confirmedInvoice._id} Saved!
              </div>
              <div className="invoice-confirmed-sub">
                ₹{Number(confirmedInvoice.totalAmount || confirmedInvoice.grandTotal || grandTotal).toFixed(2)}
                &nbsp;•&nbsp;
                {(confirmedInvoice.paymentMode || paymentMode).toUpperCase()}
                &nbsp;•&nbsp;
                {confirmedInvoice.customerName || selectedCustomer?.name || 'Cash Customer'}
              </div>
            </div>
          </div>
          <div className="invoice-confirmed-actions">
            <button type="button" className="btn btn-secondary" onClick={() => handleSendWhatsApp(confirmedInvoice)}>
              <Send size={15} /> WhatsApp Bill
            </button>
            <button type="button" className="btn btn-primary" onClick={handleResetBill}>
              <Plus size={15} /> Next Bill
            </button>
          </div>
        </div>
      )}

      {/* ── Main Billing Grid ── */}
      <div className="billing-grid">

        {/* LEFT — Customer + Products */}
        <div className="billing-section">

          {/* Customer Card */}
          <div className="card">
            <div className="billing-card-header">
              <User size={18} color="var(--primary)" />
              <span>Customer / ग्राहक</span>
              {!selectedCustomer && (
                <span className="billing-optional-badge">Optional — leave blank for cash sale</span>
              )}
            </div>
            <div className="card-body" style={{ paddingTop: '0.75rem' }}>
              <CustomerSelector
                value={selectedCustomer}
                onChange={setSelectedCustomer}
                onSelect={setSelectedCustomer}
                onAddNew={(name) => {
                  setNewCustForm({ name, phone: '', address: '' });
                  setShowAddCustomerModal(true);
                }}
              />
            </div>
          </div>

          {/* Products Card */}
          <div className="card">
            <div className="billing-card-header">
              <Package size={18} color="var(--primary)" />
              <span>Products / सामान जोड़ें</span>
              {items.length > 0 && (
                <span className="billing-items-count">{items.length} item{items.length > 1 ? 's' : ''}</span>
              )}
            </div>
            <div className="card-body" style={{ paddingTop: '0.75rem' }}>
              <ProductSelector
                onSelect={handleSelectProduct}
                selectedItems={items}
                onRemove={handleRemoveItem}
                onUpdateQuantity={handleUpdateQuantity}
              />
              {items.length === 0 && (
                <div className="billing-empty-hint">
                  🔍 Search and add products from your inventory
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="card">
            <div className="card-body">
              <label className="form-label">Notes / टिप्पणी (Optional)</label>
              <input
                type="text"
                className="form-input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Home delivery, partial payment..."
              />
            </div>
          </div>
        </div>

        {/* RIGHT — Summary + Checkout */}
        <div className="billing-summary-box">
          <div className="billing-summary-title">
            <Receipt size={18} /> Bill Summary / रसीद
          </div>

          {/* Live item summary */}
          {items.length > 0 ? (
            <div className="billing-mini-items">
              {items.map((it) => (
                <div key={it.productId} className="billing-mini-row">
                  <span className="billing-mini-name">{it.name}</span>
                  <span className="billing-mini-detail">
                    {it.quantity} × ₹{it.sellingPrice} = <strong>₹{(it.quantity * it.sellingPrice).toFixed(2)}</strong>
                  </span>
                </div>
              ))}
              <div className="billing-mini-divider" />
            </div>
          ) : (
            <div className="billing-no-items">No items added yet</div>
          )}

          {/* Subtotal row */}
          <div className="summary-row">
            <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items):</span>
            <span style={{ fontWeight: 600 }}>₹{subtotal.toFixed(2)}</span>
          </div>

          {/* Discount input */}
          <div className="summary-discount-row">
            <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '4px' }}>
              Discount / छूट (₹)
            </label>
            <input
              type="number"
              min="0"
              className="form-input"
              style={{ height: '38px', fontSize: '1rem', fontWeight: 600 }}
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              onBlur={(e) => {
                const val = parseFloat(e.target.value);
                if (isNaN(val) || val < 0) setDiscount('');
                else setDiscount(String(Math.min(val, subtotal)));
              }}
              placeholder="Enter discount amount"
            />
          </div>

          {discountVal > 0 && (
            <div className="summary-row" style={{ color: 'var(--danger)' }}>
              <span>Discount:</span>
              <span>-₹{discountVal.toFixed(2)}</span>
            </div>
          )}

          {/* Grand Total */}
          <div className="summary-row total-row">
            <span>Grand Total:</span>
            <span style={{ color: 'var(--primary-dark)', fontSize: '1.5rem' }}>
              ₹{grandTotal.toFixed(2)}
            </span>
          </div>

          {/* Payment Mode */}
          <div style={{ marginTop: '1.25rem' }}>
            <label className="form-label" style={{ marginBottom: '0.5rem' }}>
              Payment Mode / भुगतान
            </label>
            <div className="payment-mode-grid">
              {[
                { value: 'cash', label: '💵 Cash', color: 'btn-primary' },
                { value: 'upi', label: '📱 UPI', color: 'btn-primary' },
                { value: 'credit', label: '📒 Udhar', color: 'btn-danger' },
              ].map(({ value, label, color }) => (
                <button
                  key={value}
                  type="button"
                  className={`btn btn-sm ${paymentMode === value ? color : 'btn-outline'}`}
                  onClick={() => setPaymentMode(value)}
                >
                  {label}
                </button>
              ))}
            </div>
            {paymentMode === 'credit' && (
              <div className="billing-credit-note">
                ⚠️ Udhar — Amount will be added to customer's balance
              </div>
            )}
          </div>

          {/* Confirm Button */}
          <button
            type="button"
            className="btn btn-primary billing-confirm-btn"
            disabled={items.length === 0 || loading}
            onClick={handleOpenPreview}
          >
            {loading ? (
              <span>Loading...</span>
            ) : (
              <>
                <Receipt size={18} />
                <span>Preview &amp; Generate Bill</span>
              </>
            )}
          </button>

          {items.length > 0 && (
            <button
              type="button"
              className="btn btn-outline"
              style={{ width: '100%', marginTop: '0.5rem' }}
              onClick={handleResetBill}
            >
              <Trash2 size={14} /> Clear Bill
            </button>
          )}
        </div>
      </div>

      {/* ── Invoice Preview Modal ── */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => { setShowPreviewModal(false); }}
        title="Invoice Preview / बिल देखें"
        size="lg"
      >
        <InvoicePreview
          invoice={draftInvoice}
          paymentMode={paymentMode}
          onConfirm={handleConfirmInvoice}
          onEdit={() => setShowPreviewModal(false)}
          onSendWhatsApp={handleSendWhatsApp}
          loading={loading}
        />
      </Modal>

      {/* ── Add New Customer Modal ── */}
      <Modal
        isOpen={showAddCustomerModal}
        onClose={() => setShowAddCustomerModal(false)}
        title="Add Customer / नया ग्राहक"
        size="md"
      >
        <form onSubmit={handleCreateCustomer}>
          <div className="form-group">
            <label className="form-label">Name *</label>
            <input
              type="text"
              className="form-input"
              value={newCustForm.name}
              onChange={(e) => setNewCustForm({ ...newCustForm, name: e.target.value })}
              placeholder="e.g. Ramesh Kumar"
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Phone (WhatsApp)</label>
            <input
              type="tel"
              className="form-input"
              value={newCustForm.phone}
              onChange={(e) => setNewCustForm({ ...newCustForm, phone: e.target.value })}
              placeholder="e.g. 9876543210"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Address (Optional)</label>
            <input
              type="text"
              className="form-input"
              value={newCustForm.address}
              onChange={(e) => setNewCustForm({ ...newCustForm, address: e.target.value })}
              placeholder="Street / Colony"
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button type="button" className="btn btn-outline" onClick={() => setShowAddCustomerModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Customer</button>
          </div>
        </form>
      </Modal>

      {/* ── WhatsApp Send Modal ── */}
      <Modal
        isOpen={showWAModal}
        onClose={() => setShowWAModal(false)}
        title="📱 Send Bill via WhatsApp"
        size="sm"
      >
        <div>
          {/* Info banner */}
          <div style={{
            background: '#ecfdf5', border: '1px solid #6ee7b7', borderRadius: 'var(--radius-sm)',
            padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.85rem', color: '#065f46',
          }}>
            <strong>2 ways to send:</strong><br />
            1️⃣ <strong>Twilio</strong> — Bill delivered directly to customer's WhatsApp (needs setup)<br />
            2️⃣ <strong>wa.me</strong> — Opens WhatsApp on your phone, you forward the bill
          </div>

          <div className="form-group">
            <label className="form-label">Customer WhatsApp Number (10 digits)</label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600,
              }}>+91</span>
              <input
                type="tel"
                className="form-input"
                style={{ paddingLeft: '2.6rem' }}
                value={waPhone}
                onChange={(e) => setWaPhone(e.target.value)}
                placeholder="9876543210"
                maxLength={10}
                autoFocus
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '1rem' }}>
            {/* Primary — Twilio (auto-sends) */}
            <button
              type="button"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', gap: '0.6rem' }}
              onClick={handleWASend}
              disabled={waSending || !waPhone.trim()}
            >
              <MessageCircle size={17} />
              {waSending ? 'Sending…' : 'Send via Twilio (Auto-deliver)'}
            </button>

            {/* Fallback — wa.me link */}
            <button
              type="button"
              className="btn btn-secondary"
              style={{ width: '100%', justifyContent: 'center', gap: '0.6rem' }}
              onClick={handleWADirect}
              disabled={!waPhone.trim()}
            >
              <Smartphone size={17} />
              Open WhatsApp & Send Manually
            </button>

            <button
              type="button"
              className="btn btn-outline"
              style={{ width: '100%' }}
              onClick={() => setShowWAModal(false)}
            >
              Cancel
            </button>
          </div>

          {/* Twilio setup hint */}
          <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            For auto-delivery: add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN,<br />
            TWILIO_WHATSAPP_FROM to server/.env
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Billing;
