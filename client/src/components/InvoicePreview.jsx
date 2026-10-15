import React from 'react';
import { Printer, MessageCircle, CheckCircle, Edit3, X } from 'lucide-react';

const InvoicePreview = ({
  invoice,
  paymentMode,
  onConfirm,
  onEdit,
  onSendWhatsApp,
  onClose,
  loading = false,
}) => {
  if (!invoice) return null;

  const shopName   = invoice.shopName   || localStorage.getItem('shopName')    || 'Dukaan Sahayak';
  const shopPhone  = invoice.shopPhone  || localStorage.getItem('shopPhone')   || '';
  const shopAddr   = invoice.shopAddr   || localStorage.getItem('shopAddress') || '';
  const gstin      = invoice.gstin      || localStorage.getItem('gstin')       || '';

  const invoiceNumber = invoice.invoiceNumber || invoice._id || 'DRAFT';
  const dateStr = new Date(invoice.createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });

  // Normalise items — handle both DB format (productSnapshot.name) and local format (name)
  const items = (invoice.items || []).map((it) => ({
    name:     it.name || it.productSnapshot?.name || 'Product',
    quantity: Number(it.quantity || 1),
    unit:     it.unit || '',
    rate:     Number(it.unitPrice || it.sellingPrice || it.price || 0),
    total:    Number(it.lineTotal || it.total || (it.unitPrice || it.sellingPrice || it.price || 0) * (it.quantity || 1)),
  }));

  const subtotal   = Number(invoice.subtotal   ?? items.reduce((a, i) => a + i.rate * i.quantity, 0));
  const taxAmt     = Number(invoice.taxTotal   ?? invoice.tax ?? 0);
  const discAmt    = Number(invoice.discountAmount ?? invoice.discount ?? 0);
  const grandTotal = Number(invoice.total      ?? invoice.totalAmount ?? invoice.grandTotal ?? (subtotal + taxAmt - discAmt));

  const custName  = invoice.customerSnapshot?.name  || invoice.customerName  || 'Cash Customer / नगद';
  const custPhone = invoice.customerSnapshot?.phone || invoice.customerPhone || '';
  const mode      = invoice.paymentMethod || invoice.paymentMode || paymentMode || 'cash';

  return (
    <div className="invoice-preview-container">
      <div className="invoice-preview">

        {/* ── Shop Header ── */}
        <div className="invoice-preview-header">
          <div className="invoice-shop-info">
            <h2>🛒 {shopName}</h2>
            {shopAddr  && <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{shopAddr}</div>}
            {shopPhone && <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>📞 {shopPhone}</div>}
            {gstin     && <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', fontWeight: 600 }}>GSTIN: {gstin}</div>}
          </div>
          <div className="invoice-meta-info">
            <div className="badge badge-info" style={{ marginBottom: '0.4rem' }}>TAX INVOICE</div>
            <div className="invoice-meta-number">#{invoiceNumber}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '2px' }}>Date: {dateStr}</div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary)', marginTop: '2px' }}>
              {mode.toUpperCase()}
            </div>
          </div>
        </div>

        {/* ── Customer Info ── */}
        <div className="invoice-customer-details">
          <div>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>
              Billed To / ग्राहक
            </div>
            <div style={{ fontWeight: 700, fontSize: '1rem', marginTop: '3px' }}>{custName}</div>
            {custPhone && <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '1px' }}>📱 {custPhone}</div>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>
              Payment
            </div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginTop: '3px', color: mode === 'credit' ? 'var(--danger)' : 'var(--success)' }}>
              {mode === 'credit' ? '📒 Udhar / Credit' : mode === 'upi' ? '📱 UPI' : '💵 Cash'}
            </div>
          </div>
        </div>

        {/* ── Items Table ── */}
        <div className="table-container" style={{ marginBottom: '1.25rem' }}>
          <table className="invoice-table">
            <thead>
              <tr>
                <th style={{ width: '30px' }}>#</th>
                <th>Item</th>
                <th style={{ textAlign: 'center' }}>Qty</th>
                <th style={{ textAlign: 'right' }}>Rate (₹)</th>
                <th style={{ textAlign: 'right' }}>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>
                    No items
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ color: 'var(--text-muted)' }}>{idx + 1}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{item.name}</div>
                      {item.unit && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.unit}</div>}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right' }}>₹{item.rate.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>₹{item.total.toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Totals ── */}
        <div className="invoice-totals">
          <div className="tot-row">
            <span style={{ color: 'var(--text-secondary)' }}>Subtotal:</span>
            <span style={{ fontWeight: 600 }}>₹{subtotal.toFixed(2)}</span>
          </div>
          {taxAmt > 0 && (
            <div className="tot-row">
              <span style={{ color: 'var(--text-secondary)' }}>GST / Tax:</span>
              <span style={{ fontWeight: 600 }}>₹{taxAmt.toFixed(2)}</span>
            </div>
          )}
          {discAmt > 0 && (
            <div className="tot-row">
              <span style={{ color: 'var(--danger)' }}>Discount:</span>
              <span style={{ fontWeight: 600, color: 'var(--danger)' }}>-₹{discAmt.toFixed(2)}</span>
            </div>
          )}
          <div className="tot-row tot-grand">
            <span>Total Payable:</span>
            <span>₹{grandTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', borderTop: '1px dashed var(--border)', paddingTop: '1rem' }}>
          धन्यवाद! फिर पधारें 🙏 &nbsp;•&nbsp; Thank you for your business!<br />
          <span style={{ fontSize: '0.7rem' }}>This is a computer-generated invoice</span>
        </div>

        {/* ── Action Buttons ── */}
        <div className="invoice-actions">
          {onEdit && (
            <button type="button" className="btn btn-outline" onClick={onEdit} disabled={loading}>
              <Edit3 size={15} /> Edit
            </button>
          )}

          <button type="button" className="btn btn-outline" onClick={() => window.print()}>
            <Printer size={15} /> Print
          </button>

          {onSendWhatsApp && (
            <button type="button" className="btn btn-secondary" onClick={() => onSendWhatsApp(invoice)} disabled={loading}>
              <MessageCircle size={15} /> WhatsApp
            </button>
          )}

          {onConfirm && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onConfirm(invoice._id || invoice.id)}
              disabled={loading}
            >
              <CheckCircle size={15} />
              {loading ? 'Saving...' : 'Confirm & Save Bill'}
            </button>
          )}

          {onClose && (
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>
              <X size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoicePreview;
