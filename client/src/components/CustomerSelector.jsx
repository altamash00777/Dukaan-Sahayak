import React, { useState, useEffect, useRef } from 'react';
import { Search, UserCheck, X, Phone, UserPlus } from 'lucide-react';
import { customers as customersApi } from '../services/api';

const CustomerSelector = ({ value, onChange, onSelect, onAddNew }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results,    setResults]    = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [isOpen,     setIsOpen]     = useState(false);
  const dropdownRef = useRef(null);

  // ── Debounced search ──────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(async () => {
      const q = searchTerm.trim();
      if (q.length > 0 && (!value || searchTerm !== value.name)) {
        setLoading(true);
        try {
          const res  = await customersApi.getAll(searchTerm);
          // Backend: { success, data: [...customers] }
          const data = res.data?.data;
          setResults(Array.isArray(data) ? data : []);
          setIsOpen(true);
        } catch {
          setResults([]);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, value]);

  // ── Close on outside click ────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (customer) => {
    if (onSelect) onSelect(customer);
    if (onChange)  onChange(customer);
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleClear = () => {
    if (onSelect) onSelect(null);
    if (onChange)  onChange(null);
    setSearchTerm('');
    setIsOpen(false);
  };

  // ── Helpers ───────────────────────────────────────────────────────
  // API returns outstandingBalance; some local objects use balance
  const getBalance = (cust) => Number(cust?.outstandingBalance ?? cust?.balance ?? 0);
  const getPhone   = (cust) => cust?.phone || '';

  return (
    <div className="selector-container" ref={dropdownRef}>
      <label className="form-label">Customer / ग्राहक</label>

      {/* ── Selected customer chip ────────────────────────────────── */}
      {value ? (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.65rem 1rem',
          background: 'var(--primary-light)',
          border: '1px solid #bfdbfe',
          borderRadius: 'var(--radius-sm)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <UserCheck size={18} color="var(--primary)" />
            <div>
              {/* name — guaranteed to exist */}
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                {value.name || 'Customer'}
              </div>
              {/* phone + outstanding balance — both optional */}
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {getPhone(value) && <span>📞 {getPhone(value)}</span>}
                {getBalance(value) > 0 && (
                  <span style={{ marginLeft: getPhone(value) ? 8 : 0, color: 'var(--danger)', fontWeight: 600 }}>
                    Udhar: ₹{getBalance(value)}
                  </span>
                )}
                {!getPhone(value) && getBalance(value) === 0 && (
                  <span style={{ color: 'var(--text-muted)' }}>No phone on file</span>
                )}
              </div>
            </div>
          </div>
          <button
            type="button" onClick={handleClear}
            className="btn-icon" style={{ color: 'var(--text-secondary)' }}
            title="Change Customer"
          >
            <X size={16} />
          </button>
        </div>

      ) : (
        /* ── Search input + dropdown ─────────────────────────────── */
        <div style={{ position: 'relative' }}>
          <Search
            size={18}
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }}
          />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Search by name or phone (e.g. Ramesh, 98765…)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => { if (results.length > 0) setIsOpen(true); }}
          />

          {isOpen && (
            <div className="selector-dropdown">
              {loading ? (
                <div style={{ padding: '0.75rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  Searching customers…
                </div>

              ) : results.length > 0 ? (
                results.map((cust) => {
                  const bal   = getBalance(cust);
                  const phone = getPhone(cust);
                  return (
                    <div
                      key={cust._id || cust.id}
                      className="selector-option"
                      onMouseDown={(e) => { e.preventDefault(); handleSelect(cust); }}
                    >
                      <div style={{ flex: 1 }}>
                        <div className="selector-option-main">{cust.name}</div>
                        <div className="selector-option-sub">
                          {phone ? (
                            <><Phone size={11} style={{ display: 'inline', marginRight: 3 }} />{phone}</>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>No phone</span>
                          )}
                        </div>
                      </div>
                      {bal > 0 && (
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--danger)' }}>
                          Baki: ₹{bal}
                        </div>
                      )}
                    </div>
                  );
                })

              ) : (
                /* Not found — offer to add new */
                <div style={{ padding: '1rem', textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                    No customer found for "{searchTerm}"
                  </p>
                  {onAddNew && (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      style={{ width: '100%' }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        onAddNew(searchTerm);
                        setIsOpen(false);
                      }}
                    >
                      <UserPlus size={14} /> Add "{searchTerm}" as New Customer
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerSelector;
