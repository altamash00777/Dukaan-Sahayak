
import React, { useState, useCallback, useEffect } from 'react';
import {
  Receipt,
  CheckCircle,
  Plus,
  Send,
  RefreshCw,
  Trash2,
  Package,
  User,
  MessageCircle,
  Smartphone,
} from 'lucide-react';

import CustomerSelector from '../components/CustomerSelector';
import ProductSelector from '../components/ProductSelector';
import InvoicePreview from '../components/InvoicePreview';
import Modal from '../components/Modal';
import Alert from '../components/Alert';

import {
  invoices as invoicesApi,
  customers as customersApi,
  whatsapp as whatsappApi,
} from '../services/api';

const Billing = () => {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [items, setItems] = useState([]);
  const [paymentMode, setPaymentMode] = useState('cash');
  const [discount, setDiscount] = useState('');
  const [notes, setNotes] = useState('');

  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [draftInvoice, setDraftInvoice] = useState(null);
  const [confirmedInvoice, setConfirmedInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [alertInfo, setAlertInfo] = useState({ type: '', message: '' });

  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustForm, setNewCustForm] = useState({
    name: '',
    phone: '',
    address: '',
  });

  const [showWAModal, setShowWAModal] = useState(false);
  const [waPhone, setWaPhone] = useState('');
  const [waSending, setWaSending] = useState(false);
  const [waInvoiceRef, setWaInvoiceRef] = useState(null);

  // Invoice history
  const [invoiceHistory, setInvoiceHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [deletingInvoiceId, setDeletingInvoiceId] = useState(null);

  // Frontend totals are estimates for the live summary.
  // The saved backend invoice is authoritative, including tax.
  const subtotal = items.reduce(
    (sum, item) =>
      sum + Number(item.sellingPrice || 0) * Number(item.quantity || 0),
    0
  );

  const discountVal = Math.min(
    Math.max(Number.parseFloat(discount) || 0, 0),
    subtotal
  );

  const grandTotal = Math.round((subtotal - discountVal) * 100) / 100;

  const getErrorMessage = (error, fallback) =>
    error.response?.data?.message || error.message || fallback;

  // Load actual invoices from the backend.
  const loadInvoiceHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError('');

    try {
      const response = await invoicesApi.getAll({ page: 1, limit: 50 });
      const savedInvoices = response.data?.data;

      if (!Array.isArray(savedInvoices)) {
        throw new Error('Unexpected invoice history response from the server.');
      }

      setInvoiceHistory(savedInvoices);
    } catch (error) {
      setHistoryError(
        getErrorMessage(error, 'Could not load invoice history.')
      );
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInvoiceHistory();
  }, [loadInvoiceHistory]);

  // Product selection
  const handleSelectProduct = useCallback((product) => {
    const productId = product._id || product.id;

    if (!productId) {
      setAlertInfo({
        type: 'error',
        message: 'This product has no database ID. Save it in Products first.',
      });
      return;
    }

    setItems((previousItems) => {
      const existingIndex = previousItems.findIndex(
        (item) => String(item.productId) === String(productId)
      );

      if (existingIndex !== -1) {
        return previousItems.map((item, index) =>
          index === existingIndex
            ? { ...item, quantity: Number(item.quantity) + 1 }
            : item
        );
      }

      return [
        ...previousItems,
        {
          productId,
          name: product.name,
          unit: product.unit || 'pcs',
          sellingPrice: Number(product.sellingPrice || 0),
          quantity: 1,
          currentStock: product.currentStock,
          reorderLevel: product.reorderLevel,
          category: product.category || '',
        },
      ];
    });
  }, []);

  const handleUpdateQuantity = useCallback((productId, newQuantity) => {
    const quantity = Number(newQuantity);

    if (!Number.isFinite(quantity) || quantity < 1) return;

    setItems((previousItems) =>
      previousItems.map((item) =>
        String(item.productId) === String(productId)
          ? { ...item, quantity }
          : item
      )
    );
  }, []);

  const handleRemoveItem = useCallback((productId) => {
    setItems((previousItems) =>
      previousItems.filter(
        (item) => String(item.productId) !== String(productId)
      )
    );
  }, []);

  // Create a real customer. Never silently create a local-only customer.
  const handleCreateCustomer = async (event) => {
    event.preventDefault();

    const name = newCustForm.name.trim();

    if (!name) {
      setAlertInfo({
        type: 'error',
        message: 'Customer name is required.',
      });
      return;
    }

    setLoading(true);

    try {
      const response = await customersApi.create({
        name,
        phone: newCustForm.phone.trim(),
        address: newCustForm.address.trim(),
      });

      const created = response.data?.data;

      if (!created?._id) {
        throw new Error('The server did not return a saved customer.');
      }

      setSelectedCustomer(created);
      setShowAddCustomerModal(false);
      setNewCustForm({ name: '', phone: '', address: '' });

      setAlertInfo({
        type: 'success',
        message: `Customer "${created.name || name}" saved successfully.`,
      });
    } catch (error) {
      setAlertInfo({
        type: 'error',
        message: getErrorMessage(
          error,
          'Customer could not be saved. Please try again.'
        ),
      });
    } finally {
      setLoading(false);
    }
  };

  // Create a draft in MongoDB before displaying the preview.
  const handleOpenPreview = async () => {
    if (items.length === 0) {
      setAlertInfo({
        type: 'warning',
        message: 'Please add at least one product.',
      });
      return;
    }

    const invalidItem = items.some(
      (item) => !item.productId
    );

    if (invalidItem) {
      setAlertInfo({
        type: 'error',
        message: 'One or more products have no ID. Please remove and re-add them.',
      });
      return;
    }

    // If a customer is selected but has no real DB id, just treat as cash sale
    const effectiveCustomer =
      selectedCustomer && selectedCustomer._id && !String(selectedCustomer._id).startsWith('local-')
        ? selectedCustomer
        : null;


    setLoading(true);
    setAlertInfo({ type: '', message: '' });

    try {
      const payload = {
        ...(selectedCustomer?._id
          ? { customerId: selectedCustomer._id }
          : {}),
        items: items.map((item) => ({
          productId: String(item.productId),
          quantity: Number(item.quantity),
          unitPrice: Number(item.sellingPrice),
          unit: item.unit || 'pcs',
        })),
        discountAmount: discountVal,
        notes: notes.trim(),
      };

      const response = await invoicesApi.createDraft(payload);
      const savedDraft = response.data?.data;

      if (!savedDraft?._id) {
        throw new Error('The server did not return a saved invoice draft.');
      }

      setDraftInvoice(savedDraft);
      setShowPreviewModal(true);
      await loadInvoiceHistory();
    } catch (error) {
      setAlertInfo({
        type: 'error',
        message: getErrorMessage(
          error,
          'Could not save the invoice draft. No local invoice was created.'
        ),
      });
    } finally {
      setLoading(false);
    }
  };

  // Confirm only a real draft returned by the backend.
  const handleConfirmInvoice = async (invoiceId) => {
    if (
      !invoiceId ||
      !draftInvoice?._id ||
      String(draftInvoice._id) !== String(invoiceId)
    ) {
      setAlertInfo({
        type: 'error',
        message: 'Invalid saved draft. Please create the draft again.',
      });
      return;
    }

    setLoading(true);
    setAlertInfo({ type: '', message: '' });

    try {
      // Use the backend's calculated total, which can include tax.
      const amountDue = Number(draftInvoice.total ?? grandTotal);

      const paymentData = {
        paymentStatus: paymentMode === 'credit' ? 'pending' : 'paid',
        paymentMethod: paymentMode,
        amountPaid: paymentMode === 'credit' ? 0 : amountDue,
        notes: notes.trim(),
      };

      const response = await invoicesApi.confirmInvoice(
        invoiceId,
        paymentData
      );

      const confirmed = response.data?.data;

      if (!confirmed?._id) {
        throw new Error('The server did not return a confirmed invoice.');
      }

      setConfirmedInvoice(confirmed);
      setDraftInvoice(null);
      setShowPreviewModal(false);

      setAlertInfo({
        type: 'success',
        message: `Invoice ${confirmed.invoiceNumber || confirmed._id} confirmed and saved.`,
      });

      await loadInvoiceHistory();
    } catch (error) {
      setAlertInfo({
        type: 'error',
        message: getErrorMessage(
          error,
          'Invoice confirmation failed. Please try again.'
        ),
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete a saved draft only.
  const handleDeleteDraft = async (invoice) => {
    if (invoice.paymentStatus !== 'draft') {
      setAlertInfo({
        type: 'error',
        message: 'Only draft invoices can be deleted.',
      });
      return;
    }

    const approved = window.confirm(
      `Delete draft ${invoice.invoiceNumber || invoice._id}? This cannot be undone.`
    );

    if (!approved) return;

    setDeletingInvoiceId(invoice._id);
    setAlertInfo({ type: '', message: '' });

    try {
      await invoicesApi.deleteDraft(invoice._id);

      setInvoiceHistory((previous) =>
        previous.filter((item) => item._id !== invoice._id)
      );

      if (String(draftInvoice?._id) === String(invoice._id)) {
        setDraftInvoice(null);
        setShowPreviewModal(false);
      }

      setAlertInfo({
        type: 'success',
        message: 'Draft invoice deleted successfully.',
      });
    } catch (error) {
      setAlertInfo({
        type: 'error',
        message: getErrorMessage(
          error,
          'Could not delete the draft invoice.'
        ),
      });
    } finally {
      setDeletingInvoiceId(null);
    }
  };

  // WhatsApp
  const handleSendWhatsApp = (invoice) => {
    const selectedInvoice =
      invoice || confirmedInvoice || draftInvoice;

    setWaInvoiceRef(selectedInvoice);

    const phone =
      selectedInvoice?.customerSnapshot?.phone ||
      selectedInvoice?.customerId?.phone ||
      selectedInvoice?.customerPhone ||
      selectedCustomer?.phone ||
      '';

    setWaPhone(String(phone).replace(/\D/g, '').slice(-10));
    setShowWAModal(true);
  };

  const buildWhatsAppMessage = (invoice) => {
    const shopName = localStorage.getItem('shopName') || 'Dukaan Sahayak';
    const invoiceNumber =
      invoice?.invoiceNumber || invoice?._id || 'BILL';

    const total = Number(
      invoice?.total ??
        invoice?.totalAmount ??
        invoice?.grandTotal ??
        grandTotal
    );

    const invoiceItems = Array.isArray(invoice?.items)
      ? invoice.items
      : items;

    const lines = invoiceItems.map((item) => {
      const name =
        item.productSnapshot?.name ||
        item.name ||
        item.productId?.name ||
        'Product';

      const quantity = Number(item.quantity || 0);
      const price = Number(
        item.unitPrice ?? item.sellingPrice ?? 0
      );

      return `• ${name} × ${quantity} = ₹${(price * quantity).toFixed(2)}`;
    });

    return (
      `*${shopName}*\n` +
      `Invoice: *${invoiceNumber}*\n` +
      `Total: *₹${total.toFixed(2)}*\n` +
      `Payment: ${(invoice?.paymentMethod || paymentMode).toUpperCase()}\n\n` +
      `Items:\n${lines.join('\n')}\n\nThank you!`
    );
  };

  const openWhatsAppLink = () => {
    const number = waPhone.replace(/\D/g, '');

    if (number.length !== 10) {
      setAlertInfo({
        type: 'error',
        message: 'Enter a valid 10-digit Indian mobile number.',
      });
      return;
    }

    const message = buildWhatsAppMessage(waInvoiceRef);

    window.open(
      `https://wa.me/91${number}?text=${encodeURIComponent(message)}`,
      '_blank',
      'noopener,noreferrer'
    );

    setShowWAModal(false);
  };

  const handleWASend = async () => {
    const number = waPhone.replace(/\D/g, '');

    if (number.length !== 10) {
      setAlertInfo({
        type: 'error',
        message: 'Enter a valid 10-digit Indian mobile number.',
      });
      return;
    }

    if (!waInvoiceRef?._id) {
      setAlertInfo({
        type: 'error',
        message: 'No saved invoice was selected.',
      });
      return;
    }

    if (waInvoiceRef.paymentStatus === 'draft') {
      setAlertInfo({
        type: 'warning',
        message: 'Confirm the invoice before sending it as a final bill.',
      });
      return;
    }

    setWaSending(true);

    try {
      await whatsappApi.sendInvoice(waInvoiceRef._id, number);

      setAlertInfo({
        type: 'success',
        message: 'Invoice sent successfully through the WhatsApp service.',
      });

      setShowWAModal(false);
    } catch (error) {
      setAlertInfo({
        type: 'warning',
        message:
          'Automatic WhatsApp delivery failed. You can open WhatsApp and send the bill manually.',
      });
    } finally {
      setWaSending(false);
    }
  };

  const handleResetBill = () => {
    setSelectedCustomer(null);
    setItems([]);
    setPaymentMode('cash');
    setDiscount('');
    setNotes('');
    setDraftInvoice(null);
    setConfirmedInvoice(null);
    setShowPreviewModal(false);
    setAlertInfo({ type: '', message: '' });
  };

  const formatMoney = (value) =>
    Number(value || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const getCustomerName = (invoice) =>
    invoice.customerSnapshot?.name ||
    invoice.customerId?.name ||
    invoice.customerName ||
    'Cash Customer';

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">New Sale / नया बिल</h1>
          <p className="page-subtitle">
            Add products, select customer, and generate your invoice.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={handleResetBill}
        >
          <RefreshCw size={14} /> New Bill
        </button>
      </div>

      {alertInfo.message && (
        <Alert
          type={alertInfo.type}
          message={alertInfo.message}
          onClose={() => setAlertInfo({ type: '', message: '' })}
        />
      )}

      {confirmedInvoice && (
        <div className="invoice-confirmed-banner">
          <div className="invoice-confirmed-left">
            <CheckCircle size={36} color="var(--success)" />
            <div>
              <div className="invoice-confirmed-title">
                Bill #{confirmedInvoice.invoiceNumber || confirmedInvoice._id} Saved!
              </div>
              <div className="invoice-confirmed-sub">
                ₹{formatMoney(confirmedInvoice.total)}
                {' • '}
                {(confirmedInvoice.paymentMethod || paymentMode).toUpperCase()}
                {' • '}
                {getCustomerName(confirmedInvoice)}
              </div>
            </div>
          </div>

          <div className="invoice-confirmed-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => handleSendWhatsApp(confirmedInvoice)}
            >
              <Send size={15} /> WhatsApp Bill
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleResetBill}
            >
              <Plus size={15} /> Next Bill
            </button>
          </div>
        </div>
      )}

      <div className="billing-grid">
        <div className="billing-section">
          <div className="card">
            <div className="billing-card-header">
              <User size={18} color="var(--primary)" />
              <span>Customer / ग्राहक</span>
              {!selectedCustomer && (
                <span className="billing-optional-badge">
                  Optional — cash sale
                </span>
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

          <div className="card">
            <div className="billing-card-header">
              <Package size={18} color="var(--primary)" />
              <span>Products / सामान जोड़ें</span>
              {items.length > 0 && (
                <span className="billing-items-count">
                  {items.length} item{items.length !== 1 ? 's' : ''}
                </span>
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
                  Search and add products from your inventory.
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <label className="form-label">Notes / टिप्पणी (Optional)</label>
              <input
                type="text"
                className="form-input"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="e.g. Home delivery, partial payment..."
              />
            </div>
          </div>
        </div>

        <div className="billing-summary-box">
          <div className="billing-summary-title">
            <Receipt size={18} /> Bill Summary / रसीद
          </div>

          {items.length > 0 ? (
            <div className="billing-mini-items">
              {items.map((item) => (
                <div key={item.productId} className="billing-mini-row">
                  <span className="billing-mini-name">{item.name}</span>
                  <span className="billing-mini-detail">
                    {item.quantity} × ₹{formatMoney(item.sellingPrice)} ={' '}
                    <strong>
                      ₹{formatMoney(item.quantity * item.sellingPrice)}
                    </strong>
                  </span>
                </div>
              ))}
              <div className="billing-mini-divider" />
            </div>
          ) : (
            <div className="billing-no-items">No items added yet</div>
          )}

          <div className="summary-row">
            <span>
              Subtotal ({items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)} items):
            </span>
            <span style={{ fontWeight: 600 }}>₹{formatMoney(subtotal)}</span>
          </div>

          <div className="summary-discount-row">
            <label
              className="form-label"
              style={{ fontSize: '0.85rem', marginBottom: '4px' }}
            >
              Discount / छूट (₹)
            </label>
            <input
              type="number"
              min="0"
              max={subtotal}
              className="form-input"
              style={{ height: '38px', fontSize: '1rem', fontWeight: 600 }}
              value={discount}
              onChange={(event) => setDiscount(event.target.value)}
              onBlur={() => {
                const value = Number.parseFloat(discount);
                if (!Number.isFinite(value) || value < 0) {
                  setDiscount('');
                } else {
                  setDiscount(String(Math.min(value, subtotal)));
                }
              }}
              placeholder="Enter discount amount"
            />
          </div>

          {discountVal > 0 && (
            <div className="summary-row" style={{ color: 'var(--danger)' }}>
              <span>Discount:</span>
              <span>-₹{formatMoney(discountVal)}</span>
            </div>
          )}

          <div className="summary-row total-row">
            <span>Estimated Total:</span>
            <span style={{ color: 'var(--primary-dark)', fontSize: '1.5rem' }}>
              ₹{formatMoney(grandTotal)}
            </span>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Final total and applicable tax are calculated by the server.
          </p>

          <div style={{ marginTop: '1.25rem' }}>
            <label
              className="form-label"
              style={{ marginBottom: '0.5rem' }}
            >
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
                  className={`btn btn-sm ${
                    paymentMode === value ? color : 'btn-outline'
                  }`}
                  onClick={() => setPaymentMode(value)}
                >
                  {label}
                </button>
              ))}
            </div>

            {paymentMode === 'credit' && (
              <div className="billing-credit-note">
                Credit sale — the amount will remain pending.
              </div>
            )}
          </div>

          <button
            type="button"
            className="btn btn-primary billing-confirm-btn"
            disabled={items.length === 0 || loading}
            onClick={handleOpenPreview}
          >
            {loading ? (
              'Saving draft...'
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

      {/* Database-backed invoice history */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div
          className="billing-card-header"
          style={{ justifyContent: 'space-between' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Receipt size={18} />
            <span>Invoice History / बिल इतिहास</span>
          </div>

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={loadInvoiceHistory}
            disabled={historyLoading}
          >
            <RefreshCw size={14} />
            {historyLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        <div className="card-body">
          {historyError && (
            <Alert
              type="error"
              message={historyError}
              onClose={() => setHistoryError('')}
            />
          )}

          {historyLoading && invoiceHistory.length === 0 ? (
            <p>Loading saved invoices...</p>
          ) : invoiceHistory.length === 0 ? (
            <p>No saved invoices found.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                }}
              >
                <thead>
                  <tr>
                    {['Invoice', 'Customer', 'Date', 'Total', 'Status', 'Action'].map(
                      (heading) => (
                        <th
                          key={heading}
                          style={{
                            textAlign: 'left',
                            padding: '0.75rem',
                            borderBottom: '1px solid var(--border)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {heading}
                        </th>
                      )
                    )}
                  </tr>
                </thead>

                <tbody>
                  {invoiceHistory.map((invoice) => (
                    <tr key={invoice._id}>
                      <td style={{ padding: '0.75rem' }}>
                        {invoice.invoiceNumber || 'Draft'}
                      </td>

                      <td style={{ padding: '0.75rem' }}>
                        {getCustomerName(invoice)}
                      </td>

                      <td
                        style={{
                          padding: '0.75rem',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {invoice.createdAt
                          ? new Date(invoice.createdAt).toLocaleDateString('en-IN')
                          : '—'}
                      </td>

                      <td
                        style={{
                          padding: '0.75rem',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        ₹{formatMoney(invoice.total)}
                      </td>

                      <td style={{ padding: '0.75rem' }}>
                        {invoice.paymentStatus || 'unknown'}
                      </td>

                      <td style={{ padding: '0.75rem' }}>
                        {invoice.paymentStatus === 'draft' ? (
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            disabled={deletingInvoiceId === invoice._id}
                            onClick={() => handleDeleteDraft(invoice)}
                          >
                            <Trash2 size={14} />
                            {deletingInvoiceId === invoice._id
                              ? 'Deleting...'
                              : 'Delete Draft'}
                          </button>
                        ) : (
                          <span>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
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
              onChange={(event) =>
                setNewCustForm({ ...newCustForm, name: event.target.value })
              }
              placeholder="e.g. Ramesh Kumar"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Phone (WhatsApp)</label>
            <input
              type="tel"
              className="form-input"
              value={newCustForm.phone}
              onChange={(event) =>
                setNewCustForm({ ...newCustForm, phone: event.target.value })
              }
              placeholder="e.g. 9876543210"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Address (Optional)</label>
            <input
              type="text"
              className="form-input"
              value={newCustForm.address}
              onChange={(event) =>
                setNewCustForm({ ...newCustForm, address: event.target.value })
              }
              placeholder="Street / Colony"
            />
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              marginTop: '1.25rem',
            }}
          >
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setShowAddCustomerModal(false)}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Customer'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showWAModal}
        onClose={() => setShowWAModal(false)}
        title="📱 Send Bill via WhatsApp"
        size="sm"
      >
        <div>
          <div
            style={{
              background: '#ecfdf5',
              border: '1px solid #6ee7b7',
              borderRadius: 'var(--radius-sm)',
              padding: '0.75rem 1rem',
              marginBottom: '1.25rem',
              fontSize: '0.85rem',
              color: '#065f46',
            }}
          >
            Automatic delivery requires a working WhatsApp service. You can
            also open WhatsApp to send the bill manually.
          </div>

          <div className="form-group">
            <label className="form-label">Customer WhatsApp Number (10 digits)</label>
            <div style={{ position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  fontWeight: 600,
                }}
              >
                +91
              </span>

              <input
                type="tel"
                className="form-input"
                style={{ paddingLeft: '2.6rem' }}
                value={waPhone}
                onChange={(event) =>
                  setWaPhone(event.target.value.replace(/\D/g, '').slice(0, 10))
                }
                placeholder="9876543210"
                maxLength={10}
              />
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem',
              marginTop: '1rem',
            }}
          >
            <button
              type="button"
              className="btn btn-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                gap: '0.6rem',
              }}
              onClick={handleWASend}
              disabled={waSending || waPhone.length !== 10}
            >
              <MessageCircle size={17} />
              {waSending ? 'Sending...' : 'Send via WhatsApp Service'}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              style={{
                width: '100%',
                justifyContent: 'center',
                gap: '0.6rem',
              }}
              onClick={openWhatsAppLink}
              disabled={waPhone.length !== 10}
            >
              <Smartphone size={17} />
              Open WhatsApp &amp; Send Manually
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
        </div>
      </Modal>
    </div>
  );
};

export default Billing;
