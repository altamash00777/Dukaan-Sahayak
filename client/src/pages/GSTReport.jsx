import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Download, TrendingUp, IndianRupee, RefreshCw } from 'lucide-react';
import { reports as reportsApi } from '../services/api';

const SAMPLE_GST = {
  month: 'October 2026',
  totalSales: 189700,
  taxableSales: 95300,
  exemptSales: 94400,
  slabs: [
    { rate: '0%',  label: 'Exempt (Rice, Atta, Salt)',    taxable: 94400, cgst: 0,    sgst: 0,    total: 0    },
    { rate: '5%',  label: 'Kirana Basics (Tea, Spices)',  taxable: 52400, cgst: 1310, sgst: 1310, total: 2620 },
    { rate: '12%', label: 'Packaged Food (Ghee, Pickle)', taxable: 18600, cgst: 1116, sgst: 1116, total: 2232 },
    { rate: '18%', label: 'Home Care (Soap, Shampoo)',    taxable: 24300, cgst: 2187, sgst: 2187, total: 4374 },
  ],
  totalCgst: 4613,
  totalSgst: 4613,
  totalGst: 9226,
  netPayable: 9226,
};

const SLAB_COLOR = { '0%': '#10b981', '5%': '#2563eb', '12%': '#f59e0b', '18%': '#ef4444', '28%': '#8b5cf6' };

const GSTReport = () => {
  const [gstData, setGstData] = useState(SAMPLE_GST);
  const [dataLoading, setDataLoading] = useState(false);
  const [activeMonth, setActiveMonth] = useState('2026-10');

  const loadGstData = useCallback(async (month) => {
    setDataLoading(true);
    try {
      const [year, mon] = month.split('-');
      const res = await reportsApi.getMonthly(year, mon);
      const data = res.data?.data;
      if (data?.gst) setGstData(data.gst);
    } catch {
      // Keep fallback data if the report endpoint is unavailable.
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGstData(activeMonth);
  }, [activeMonth, loadGstData]);

  const totalGst = gstData.slabs?.reduce((sum, slab) => sum + (slab.total || 0), 0)
    || gstData.totalGst || 0;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">GST Reports 🧾</h1>
          <p className="page-subtitle">View monthly GST summaries, tax slabs, payable amounts, and filing checklist.</p>
        </div>
      </div>

      {/* Month picker */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <label style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>📅 Report Month:</label>
        <input
          type="month"
          className="form-input"
          style={{ width: 180, height: 38 }}
          value={activeMonth}
          onChange={(e) => setActiveMonth(e.target.value)}
        />
        <button type="button" className="btn btn-outline btn-sm" onClick={() => loadGstData(activeMonth)}>
          <RefreshCw size={14} /> {dataLoading ? 'Loading…' : 'Refresh'}
        </button>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => window.print()}>
          <Download size={14} /> Export / Print
        </button>
      </div>

      {/* ── TWO COLUMN LAYOUT ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '1.5rem', alignItems: 'start' }}>

        {/* LEFT: GST Data Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '0.85rem' }}>
            {[
              { label: 'Total Sales',   value: `₹${gstData.totalSales?.toLocaleString('en-IN')}`,  icon: TrendingUp,  color: '#2563eb' },
              { label: 'GST Collected', value: `₹${totalGst?.toLocaleString('en-IN')}`,            icon: FileText,    color: '#7c3aed' },
              { label: 'CGST Payable',  value: `₹${gstData.totalCgst?.toLocaleString('en-IN')}`,   icon: IndianRupee, color: '#ef4444' },
              { label: 'SGST Payable',  value: `₹${gstData.totalSgst?.toLocaleString('en-IN')}`,   icon: IndianRupee, color: '#f59e0b' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} style={{
                background: '#fff', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', padding: '1rem',
                borderTop: `3px solid ${color}`, boxShadow: 'var(--shadow)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>{label}</div>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={15} color={color} />
                  </div>
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color, marginTop: 6 }}>{value}</div>
              </div>
            ))}
          </div>

          {/* GST Net Payable Banner */}
          <div style={{
            background: 'linear-gradient(135deg,#dc2626,#b91c1c)', color: '#fff',
            borderRadius: 'var(--radius)', padding: '1.25rem 1.5rem',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem',
          }}>
            <div>
              <div style={{ fontSize: '0.82rem', opacity: 0.85, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Net GST Payable to Government
              </div>
              <div style={{ fontSize: '2.4rem', fontWeight: 900, marginTop: 4 }}>
                ₹{totalGst?.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.78rem', opacity: 0.8, marginTop: 2 }}>
                GSTR-3B Deadline: 20th of next month
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.8rem', opacity: 0.85 }}>Split:</div>
              <div style={{ fontWeight: 700 }}>CGST: ₹{gstData.totalCgst?.toLocaleString('en-IN')}</div>
              <div style={{ fontWeight: 700 }}>SGST: ₹{gstData.totalSgst?.toLocaleString('en-IN')}</div>
            </div>
          </div>

          {/* Slab-wise breakdown table */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={17} color="var(--primary)" /> GST Slab-wise Breakdown — {gstData.month}
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>GST Rate</th>
                    <th>Product Category</th>
                    <th style={{ textAlign: 'right' }}>Taxable Sales (₹)</th>
                    <th style={{ textAlign: 'right' }}>CGST (₹)</th>
                    <th style={{ textAlign: 'right' }}>SGST (₹)</th>
                    <th style={{ textAlign: 'right' }}>Total GST (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {gstData.slabs?.map((sl) => (
                    <tr key={sl.rate}>
                      <td>
                        <span style={{
                          background: `${SLAB_COLOR[sl.rate] || '#6b7280'}18`,
                          color: SLAB_COLOR[sl.rate] || '#6b7280',
                          fontWeight: 800, padding: '3px 10px', borderRadius: 99, fontSize: '0.8rem',
                        }}>
                          {sl.rate}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{sl.label}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{sl.taxable?.toLocaleString('en-IN')}</td>
                      <td style={{ textAlign: 'right', color: '#ef4444', fontWeight: 600 }}>
                        {sl.cgst > 0 ? `₹${sl.cgst?.toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td style={{ textAlign: 'right', color: '#f59e0b', fontWeight: 600 }}>
                        {sl.sgst > 0 ? `₹${sl.sgst?.toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: sl.total > 0 ? '#dc2626' : '#10b981' }}>
                        {sl.total > 0 ? `₹${sl.total?.toLocaleString('en-IN')}` : '₹0 (Exempt)'}
                      </td>
                    </tr>
                  ))}
                  {/* Totals row */}
                  <tr style={{ background: '#f8fafc', fontWeight: 800 }}>
                    <td colSpan={2} style={{ fontWeight: 800 }}>TOTAL</td>
                    <td style={{ textAlign: 'right' }}>₹{gstData.totalSales?.toLocaleString('en-IN')}</td>
                    <td style={{ textAlign: 'right', color: '#ef4444' }}>₹{gstData.totalCgst?.toLocaleString('en-IN')}</td>
                    <td style={{ textAlign: 'right', color: '#f59e0b' }}>₹{gstData.totalSgst?.toLocaleString('en-IN')}</td>
                    <td style={{ textAlign: 'right', color: '#dc2626', fontSize: '1.05rem' }}>₹{totalGst?.toLocaleString('en-IN')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Filing checklist */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', fontWeight: 700 }}>
              📋 GST Filing Checklist
            </div>
            <div style={{ padding: '1rem 1.25rem' }}>
              {[
                { done: true,  task: 'GSTR-1 — Sales invoices upload (by 11th Nov 2026)' },
                { done: false, task: 'GSTR-3B — Monthly summary + payment (by 20th Nov 2026)' },
                { done: true,  task: 'Input Tax Credit (ITC) — Purchase entries verified' },
                { done: false, task: 'GST payment challan generate karna (PMT-06)' },
              ].map(({ done, task }) => (
                <div key={task} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: done ? '#dcfce7' : '#fef2f2', color: done ? '#16a34a' : '#dc2626',
                    fontWeight: 900, fontSize: '0.85rem',
                  }}>
                    {done ? '✓' : '!'}
                  </div>
                  <span style={{ fontSize: '0.875rem', color: done ? 'var(--text-secondary)' : 'var(--text-primary)', textDecoration: done ? 'line-through' : 'none' }}>
                    {task}
                  </span>
                  <span style={{
                    marginLeft: 'auto', fontSize: '0.7rem', padding: '2px 8px', borderRadius: 99, fontWeight: 700,
                    background: done ? '#dcfce7' : '#fef2f2', color: done ? '#16a34a' : '#dc2626',
                  }}>
                    {done ? 'Done ✓' : 'Pending ⚠'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>


      </div>


    </div>
  );
};

export default GSTReport;
