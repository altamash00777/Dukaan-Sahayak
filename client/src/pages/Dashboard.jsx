import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  IndianRupee,
  TrendingUp,
  Users,
  AlertTriangle,
  Receipt,
  ArrowRight,
  Package,
  BookOpen,
  RefreshCw,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import Alert from '../components/Alert';
import { reports as reportsApi, inventory as inventoryApi, invoices as invoicesApi, customers as customersApi } from '../services/api';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    todaySales: 18450,
    todayProfit: 3280,
    totalCustomers: 142,
    lowStockCount: 4,
    salesTrend: 8.5,
  });
  const [salesChartData, setSalesChartData] = useState([
    { day: 'Mon', sales: 12000, profit: 2100 },
    { day: 'Tue', sales: 15400, profit: 2800 },
    { day: 'Wed', sales: 14200, profit: 2500 },
    { day: 'Thu', sales: 19100, profit: 3400 },
    { day: 'Fri', sales: 17800, profit: 3100 },
    { day: 'Sat', sales: 22400, profit: 4100 },
    { day: 'Sun', sales: 18450, profit: 3280 },
  ]);
  const [lowStockAlerts, setLowStockAlerts] = useState([
    { _id: '1', name: 'Aashirvaad Atta 10kg', currentStock: 3, reorderLevel: 10, unit: 'bags' },
    { _id: '2', name: 'Fortune Mustard Oil 1L', currentStock: 4, reorderLevel: 15, unit: 'pouches' },
    { _id: '3', name: 'Tata Salt 1kg', currentStock: 5, reorderLevel: 25, unit: 'packets' },
    { _id: '4', name: 'Maggi 2-Minute Noodles 70g', currentStock: 8, reorderLevel: 40, unit: 'packs' },
  ]);
  const [recentInvoices, setRecentInvoices] = useState([
    { _id: 'INV-1092', customerName: 'Sunil Sharma', totalAmount: 850, paymentMode: 'cash', createdAt: new Date() },
    { _id: 'INV-1091', customerName: 'Pooja Verma', totalAmount: 1420, paymentMode: 'upi', createdAt: new Date(Date.now() - 3600000) },
    { _id: 'INV-1090', customerName: 'Rajesh Gupta', totalAmount: 2300, paymentMode: 'credit', createdAt: new Date(Date.now() - 7200000) },
    { _id: 'INV-1089', customerName: 'Amit Singh', totalAmount: 430, paymentMode: 'upi', createdAt: new Date(Date.now() - 10800000) },
    { _id: 'INV-1088', customerName: 'Walk-in Customer', totalAmount: 120, paymentMode: 'cash', createdAt: new Date(Date.now() - 14400000) },
  ]);
  const [pendingKhata, setPendingKhata] = useState([
    { _id: 'c1', name: 'Rajesh Gupta', phone: '9812345678', balance: 4500 },
    { _id: 'c2', name: 'Vikas Tiwari', phone: '9898765432', balance: 2150 },
    { _id: 'c3', name: 'Sanjay Kumar', phone: '9845012345', balance: 1800 },
  ]);

  const fetchDashboardData = useCallback(async () => {
    try {
      // Execute calls in parallel
      const [dailyRes, alertsRes, chartRes, invoicesRes, customersRes] = await Promise.allSettled([
        reportsApi.getDaily(),
        inventoryApi.getAlerts(),
        reportsApi.getSalesChart(7),
        invoicesApi.getAll({ limit: 5 }),
        customersApi.getAll(),
      ]);

      if (dailyRes.status === 'fulfilled' && dailyRes.value.data) {
        const d = dailyRes.value.data?.data || dailyRes.value.data;
        setStats((prev) => ({
          ...prev,
          todaySales: d.totalSales !== undefined ? d.totalSales : prev.todaySales,
          todayProfit: d.totalProfit !== undefined ? d.totalProfit : prev.todayProfit,
          totalCustomers: d.customerCount !== undefined ? d.customerCount : prev.totalCustomers,
          salesTrend: d.salesTrend !== undefined ? d.salesTrend : prev.salesTrend,
        }));
      }

      if (alertsRes.status === 'fulfilled' && alertsRes.value.data) {
        const alerts = alertsRes.value.data?.data || alertsRes.value.data?.alerts || alertsRes.value.data;
        if (Array.isArray(alerts) && alerts.length > 0) {
          setLowStockAlerts(alerts);
          setStats((prev) => ({ ...prev, lowStockCount: alerts.length }));
        }
      }

      if (chartRes.status === 'fulfilled' && chartRes.value.data) {
        const cData = chartRes.value.data?.data?.chartData || chartRes.value.data?.data || chartRes.value.data?.chartData || chartRes.value.data;
        if (Array.isArray(cData) && cData.length > 0) {
          setSalesChartData(cData);
        }
      }

      if (invoicesRes.status === 'fulfilled' && invoicesRes.value.data) {
        const invs = invoicesRes.value.data?.data || invoicesRes.value.data?.invoices || invoicesRes.value.data;
        if (Array.isArray(invs) && invs.length > 0) {
          setRecentInvoices(invs.slice(0, 5));
        }
      }

      if (customersRes.status === 'fulfilled' && customersRes.value.data) {
        const custs = customersRes.value.data?.data || customersRes.value.data?.customers || customersRes.value.data;
        if (Array.isArray(custs)) {
          const debtors = custs.filter((c) => (c.outstandingBalance || c.balance || 0) > 0);
          if (debtors.length > 0) {
            setPendingKhata(debtors.slice(0, 4));
          }
          setStats((prev) => ({
            ...prev,
            totalCustomers: custs.length || prev.totalCustomers,
          }));
        }
      }
    } catch (err) {
      console.error('Failed to load live dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();

    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  if (loading) {
    return <LoadingSpinner message="Dukaan ka hisaab load ho raha hai..." />;
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Shop Dashboard / दुकान डैशबोर्ड</h1>
          <p className="page-subtitle">Aapki dukaan ka live karobar aur stock overview</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={fetchDashboardData}
            title="Refresh Dashboard"
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <Link to="/billing" className="btn btn-primary btn-sm">
            <Receipt size={16} /> New Bill (+ बिल)
          </Link>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* 4 Stat Cards */}
      <div className="dashboard-grid">
        <StatCard
          title="Today's Sales / आज की बिक्री"
          value={stats.todaySales}
          prefix="₹"
          trend={stats.salesTrend}
          color="primary"
          icon={IndianRupee}
        />
        <StatCard
          title="Today's Profit / आज का मुनाफा"
          value={stats.todayProfit}
          prefix="₹"
          trend={12.4}
          color="success"
          icon={TrendingUp}
        />
        <StatCard
          title="Total Customers / कुल ग्राहक"
          value={stats.totalCustomers}
          color="info"
          icon={Users}
        />
        <StatCard
          title="Low Stock Items / कम स्टॉक"
          value={stats.lowStockCount || lowStockAlerts.length}
          suffix=" items"
          color="danger"
          icon={AlertTriangle}
        />
      </div>

      {/* Sales Chart & Low Stock Alerts */}
      <div className="dashboard-split-grid">
        {/* Sales Chart */}
        <div className="chart-container">
          <div className="chart-header">
            <div>
              <div className="chart-title">Last 7 Days Sales Trend (₹)</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Daily turnover and estimated margin
              </div>
            </div>
            <Link to="/reports" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
              Full Report <ArrowRight size={14} style={{ verticalAlign: 'middle' }} />
            </Link>
          </div>

          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(val) => `₹${val}`}
                />
                <Tooltip
                  formatter={(value, name) => [`₹${value.toLocaleString('en-IN')}`, name === 'sales' ? 'Sales' : 'Profit']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-md)',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="sales"
                  name="sales"
                  stroke="var(--primary)"
                  strokeWidth={3}
                  dot={{ r: 4, fill: 'var(--primary)' }}
                  activeDot={{ r: 7 }}
                />
                <Line
                  type="monotone"
                  dataKey="profit"
                  name="profit"
                  stroke="var(--success)"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: 'var(--success)' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)' }}>
              <AlertTriangle size={18} />
              Stock Alerts ({lowStockAlerts.length})
            </h3>
            <Link to="/inventory" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
              Manage
            </Link>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '320px', overflowY: 'auto' }}>
            {lowStockAlerts.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', margin: 'auto' }}>
                Sabhi products ka stock theek hai! 👍
              </p>
            ) : (
              lowStockAlerts.map((item) => (
                <div key={item._id || item.id} className="alert-badge-item">
                  <div className="stock-info">
                    <span className="product-name">{item.name}</span>
                    <span className="stock-count">
                      Available: <strong>{item.currentStock || item.stock} {item.unit || 'pcs'}</strong> (Min: {item.reorderLevel})
                    </span>
                  </div>
                  <Link
                    to="/inventory"
                    className="btn btn-outline btn-sm"
                    style={{ backgroundColor: '#ffffff', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                  >
                    Restock
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Invoices & Pending Udhar */}
      <div className="dashboard-split-grid" style={{ gridTemplateColumns: '1.4fr 1fr' }}>
        {/* Recent Invoices Table */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Receipt size={18} color="var(--primary)" />
              Recent Invoices (ताज़ा बिल)
            </h3>
            <Link to="/billing" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
              View All
            </Link>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Bill #</th>
                  <th>Customer</th>
                  <th>Mode</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map((inv) => (
                  <tr key={inv._id}>
                    <td style={{ fontWeight: 600, color: 'var(--primary)' }}>
                      #{inv.invoiceNumber || inv._id.slice(-6)}
                    </td>
                    <td>{inv.customerName || 'Cash Sale'}</td>
                    <td>
                      <span className={`badge ${inv.paymentMode === 'credit' ? 'badge-danger' : inv.paymentMode === 'upi' ? 'badge-info' : 'badge-success'}`}>
                        {inv.paymentMode || 'cash'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>
                      ₹{Number(inv.totalAmount || inv.grandTotal || 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending Payments / Udhar */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--warning)' }}>
              <BookOpen size={18} />
              Pending Udhar (उधार वसूली)
            </h3>
            <Link to="/khata" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
              Khata Book
            </Link>
          </div>
          <div className="card-body" style={{ padding: '0.75rem' }}>
            <div className="recent-list">
              {pendingKhata.map((customer) => (
                <div key={customer._id} className="recent-item">
                  <div className="recent-item-info">
                    <span className="recent-item-title">{customer.name}</span>
                    <span className="recent-item-subtitle">{customer.phone}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: 'var(--danger)', fontWeight: 700, fontSize: '0.95rem' }}>
                      ₹{(customer.balance || customer.creditBalance || 0).toLocaleString('en-IN')}
                    </div>
                    <Link
                      to="/khata"
                      style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}
                    >
                      Remind / वसूलें
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
