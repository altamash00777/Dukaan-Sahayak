import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  Download,
  Calendar,
  Package,
  FileSpreadsheet,
  PieChart as PieIcon,
  Plus,
  IndianRupee,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import Modal from '../components/Modal';
import Alert from '../components/Alert';
import LoadingSpinner from '../components/LoadingSpinner';
import { reports as reportsApi, expenses as expensesApi } from '../services/api';

const PIE_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const SAMPLE_DAILY_SALES = [
  { date: '08/10', sales: 14200, count: 28 },
  { date: '09/10', sales: 16800, count: 32 },
  { date: '10/10', sales: 15300, count: 30 },
  { date: '11/10', sales: 19400, count: 41 },
  { date: '12/10', sales: 18100, count: 36 },
  { date: '13/10', sales: 22800, count: 48 },
  { date: '14/10', sales: 18450, count: 39 },
];

const SAMPLE_TOP_PRODUCTS = [
  { name: 'Aashirvaad Atta', unitsSold: 124, revenue: 52080 },
  { name: 'Tata Salt 1kg', unitsSold: 98, revenue: 2744 },
  { name: 'Fortune Oil 1L', unitsSold: 86, revenue: 13330 },
  { name: 'Madhur Sugar 1kg', unitsSold: 82, revenue: 3772 },
  { name: 'Parle-G Gold', unitsSold: 75, revenue: 750 },
  { name: 'Maggi Noodles 70g', unitsSold: 64, revenue: 896 },
  { name: 'Tata Tea Gold', unitsSold: 42, revenue: 6300 },
];

const SAMPLE_SLOW_MOVERS = [
  { name: 'Kissan Pineapple Jam 500g', stock: 18, lastSold: '18 days ago', daysInStock: 45 },
  { name: 'Vim Dishwash Gel 750ml', stock: 24, lastSold: '12 days ago', daysInStock: 60 },
  { name: 'Surf Excel Matic 2kg', stock: 12, lastSold: '9 days ago', daysInStock: 38 },
];

const SAMPLE_GST_DATA = [
  { rate: '0% (Exempt)', taxableAmount: 94500, cgst: 0, sgst: 0, totalGst: 0 },
  { rate: '5% (Kirana Basics)', taxableAmount: 52400, cgst: 1310, sgst: 1310, totalGst: 2620 },
  { rate: '12% (Packaged Food)', taxableAmount: 18600, cgst: 1116, sgst: 1116, totalGst: 2232 },
  { rate: '18% (Personal & Home Care)', taxableAmount: 24200, cgst: 2178, sgst: 2178, totalGst: 4356 },
];

const SAMPLE_EXPENSES = [
  { name: 'Shop Rent (दुकान किराया)', value: 12000, category: 'Rent' },
  { name: 'Electricity Bill (बिजली बिल)', value: 3450, category: 'Utilities' },
  { name: 'Helper / Chotu Salary', value: 8000, category: 'Labor' },
  { name: 'Packaging Bags & Plastic', value: 1200, category: 'Packaging' },
  { name: 'Tea & Snacks Refreshment', value: 1500, category: 'Misc' },
];

const Reports = () => {
  const [activeTab, setActiveTab] = useState('sales'); // sales, products, gst, expenses
  const [fromDate, setFromDate] = useState('2026-10-08');
  const [toDate, setToDate] = useState('2026-10-15');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Expenses Modal
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    category: 'Rent',
    amount: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [expensesList, setExpensesList] = useState(SAMPLE_EXPENSES);

  // Totals
  const totalSales = SAMPLE_DAILY_SALES.reduce((s, it) => s + it.sales, 0);
  const avgSalesPerDay = Math.round(totalSales / SAMPLE_DAILY_SALES.length);
  const totalBills = SAMPLE_DAILY_SALES.reduce((s, it) => s + it.count, 0);

  const totalGstCollected = SAMPLE_GST_DATA.reduce((s, it) => s + it.totalGst, 0);
  const totalExpenses = expensesList.reduce((s, it) => s + it.value, 0);

  // CSV Export
  const handleExportCSV = async () => {
    try {
      try {
        const res = await reportsApi.exportCSV();
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Dukaan_Report_${fromDate}_to_${toDate}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        setAlert({ type: 'success', message: 'Report exported to CSV successfully!' });
        return;
      } catch (e) {
        console.warn('Backend CSV export fallback:', e);
      }

      // Client-side CSV generation
      let csvContent = 'data:text/csv;charset=utf-8,';
      if (activeTab === 'sales') {
        csvContent += 'Date,Sales (INR),Invoices Count\n';
        SAMPLE_DAILY_SALES.forEach((d) => {
          csvContent += `${d.date},${d.sales},${d.count}\n`;
        });
      } else if (activeTab === 'gst') {
        csvContent += 'GST Slab,Taxable Value (INR),CGST (INR),SGST (INR),Total GST (INR)\n';
        SAMPLE_GST_DATA.forEach((g) => {
          csvContent += `${g.rate},${g.taxableAmount},${g.cgst},${g.sgst},${g.totalGst}\n`;
        });
      } else {
        csvContent += 'Product,Units Sold,Revenue (INR)\n';
        SAMPLE_TOP_PRODUCTS.forEach((p) => {
          csvContent += `${p.name},${p.unitsSold},${p.revenue}\n`;
        });
      }

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Dukaan_${activeTab}_report.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setAlert({ type: 'success', message: `${activeTab.toUpperCase()} CSV report downloaded!` });
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    const amt = Number(expenseForm.amount);
    if (!expenseForm.title || !amt) return;

    try {
      try {
        await expensesApi.create({
          title: expenseForm.title,
          category: expenseForm.category,
          amount: amt,
          date: expenseForm.date,
        });
      } catch (err) {
        console.warn('Expense API fallback:', err);
      }

      setExpensesList((prev) => [
        ...prev,
        { name: expenseForm.title, value: amt, category: expenseForm.category },
      ]);
      setIsExpenseModalOpen(false);
      setExpenseForm({ title: '', category: 'Rent', amount: '', date: new Date().toISOString().split('T')[0] });
      setAlert({ type: 'success', message: `Expense of ₹${amt} added!` });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports & Business Analytics / रिपोर्ट्स</h1>
          <p className="page-subtitle">Track sales margins, bestseller items, CA-ready GST returns, and expenses</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button type="button" className="btn btn-primary btn-sm" onClick={handleExportCSV}>
            <Download size={14} /> Export CSV / एक्सेल रिपोर्ट
          </button>
        </div>
      </div>

      {alert.message && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({ type: '', message: '' })}
        />
      )}

      {/* Date Range Picker Bar */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div
          className="card-body"
          style={{
            padding: '1rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Calendar size={18} color="var(--primary)" />
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Date Range / तारीख चुनें:</span>
            <input
              type="date"
              className="form-input"
              style={{ width: 'auto', padding: '0.4rem 0.75rem' }}
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
            <span style={{ color: 'var(--text-secondary)' }}>to</span>
            <input
              type="date"
              className="form-input"
              style={{ width: 'auto', padding: '0.4rem 0.75rem' }}
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'sales' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('sales')}
            >
              Sales Overview
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'products' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('products')}
            >
              Products Performance
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'gst' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('gst')}
            >
              GST Summary (CA)
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'expenses' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('expenses')}
            >
              Expenses (खर्चे)
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: SALES OVERVIEW */}
      {activeTab === 'sales' && (
        <div>
          <div className="dashboard-grid">
            <div className="stat-card stat-primary">
              <div className="stat-content">
                <span className="stat-title">Period Revenue / कुल बिक्री</span>
                <div className="stat-value">₹{totalSales.toLocaleString('en-IN')}</div>
              </div>
            </div>
            <div className="stat-card stat-success">
              <div className="stat-content">
                <span className="stat-title">Average Per Day / प्रतिदिन औसत</span>
                <div className="stat-value">₹{avgSalesPerDay.toLocaleString('en-IN')}</div>
              </div>
            </div>
            <div className="stat-card stat-info">
              <div className="stat-content">
                <span className="stat-title">Invoices Cut / कुल बिल</span>
                <div className="stat-value">{totalBills} bills</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Daily Sales Turnover (₹)</h3>
            </div>
            <div className="card-body">
              <div style={{ width: '100%', height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={SAMPLE_DAILY_SALES} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" tickFormatter={(v) => `₹${v}`} />
                    <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Sales']} />
                    <Line
                      type="monotone"
                      dataKey="sales"
                      stroke="var(--primary)"
                      strokeWidth={3}
                      dot={{ r: 5, fill: 'var(--primary)' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCTS PERFORMANCE */}
      {activeTab === 'products' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
          {/* Top 10 Bestsellers */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Top Bestselling Products (Units Sold)</h3>
            </div>
            <div className="card-body">
              <div style={{ width: '100%', height: 360 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={SAMPLE_TOP_PRODUCTS}
                    layout="vertical"
                    margin={{ top: 10, right: 20, left: 40, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" stroke="#94a3b8" />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" width={110} fontSize={12} />
                    <Tooltip formatter={(val) => [`${val} units`, 'Units Sold']} />
                    <Bar dataKey="unitsSold" fill="var(--primary)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Slow Movers Table */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title" style={{ color: 'var(--warning-dark)' }}>
                Slow Moving Items (धीमी गति के सामान)
              </h3>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th style={{ textAlign: 'center' }}>Stock</th>
                    <th>Last Sale</th>
                  </tr>
                </thead>
                <tbody>
                  {SAMPLE_SLOW_MOVERS.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{item.name}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="badge badge-warning">{item.stock} left</span>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {item.lastSold}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="card-footer" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              💡 Suggestion: Offer bundle discount or relocate items to the shop counter.
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GST SUMMARY */}
      {activeTab === 'gst' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">GST Tax Return Summary (GSTR-1 & 3B Ready)</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Grouped by tax slabs for easy copy/paste for your Tax Consultant or Accountant
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Output GST: </span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
                ₹{totalGstCollected.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Tax Slab Rate</th>
                  <th style={{ textAlign: 'right' }}>Taxable Turnover (₹)</th>
                  <th style={{ textAlign: 'right' }}>CGST (₹)</th>
                  <th style={{ textAlign: 'right' }}>SGST (₹)</th>
                  <th style={{ textAlign: 'right' }}>Total GST (₹)</th>
                </tr>
              </thead>
              <tbody>
                {SAMPLE_GST_DATA.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 700 }}>{row.rate}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>
                      ₹{row.taxableAmount.toLocaleString('en-IN')}
                    </td>
                    <td style={{ textAlign: 'right' }}>₹{row.cgst.toLocaleString('en-IN')}</td>
                    <td style={{ textAlign: 'right' }}>₹{row.sgst.toLocaleString('en-IN')}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>
                      ₹{row.totalGst.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: EXPENSES */}
      {activeTab === 'expenses' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* Expenses Chart */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Expense Category Breakdown</h3>
              <span style={{ fontWeight: 700, color: 'var(--danger)' }}>
                Total: ₹{totalExpenses.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="card-body">
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expensesList}
                      dataKey="value"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={95}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {expensesList.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Expense Log & Add Button */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Expense Log</h3>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setIsExpenseModalOpen(true)}
              >
                <Plus size={14} /> Add Expense / खर्च जोड़ें
              </button>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Expense Name</th>
                    <th>Category</th>
                    <th style={{ textAlign: 'right' }}>Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {expensesList.map((exp, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{exp.name}</td>
                      <td>
                        <span className="badge badge-info">{exp.category}</span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--danger)' }}>
                        ₹{Number(exp.value).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      <Modal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        title="Record Shop Expense / दुकान का खर्च जोड़ें"
        size="sm"
      >
        <form onSubmit={handleAddExpense}>
          <div className="form-group">
            <label className="form-label">Expense Description / खर्च का विवरण *</label>
            <input
              type="text"
              className="form-input"
              value={expenseForm.title}
              onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
              placeholder="e.g. Bijli Bill / Chotu Salary"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Category / प्रकार</label>
            <select
              className="form-select"
              value={expenseForm.category}
              onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
            >
              <option value="Rent">Shop Rent (किराया)</option>
              <option value="Utilities">Electricity & Water (बिजली/पानी)</option>
              <option value="Labor">Staff / Helper Salary (वेतन)</option>
              <option value="Packaging">Carry Bags & Packaging</option>
              <option value="Misc">Tea, Refreshment & Misc (चाय/अन्य)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Amount / राशि (₹) *</label>
            <input
              type="number"
              min="1"
              className="form-input"
              value={expenseForm.amount}
              onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
              placeholder="0.00"
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setIsExpenseModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Expense
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Reports;
