
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import {
  IndianRupee,
  TrendingUp,
  Users,
  AlertTriangle,
  Receipt,
  ArrowRight,
  BookOpen,
  RefreshCw,
  Package,
  Trash2,
} from "lucide-react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import StatCard from "../components/StatCard";
import LoadingSpinner from "../components/LoadingSpinner";
import Alert from "../components/Alert";

import {
  reports as reportsApi,
  inventory as inventoryApi,
  invoices as invoicesApi,
  customers as customersApi,
} from "../services/api";

// --------------------------------------------------
// Helpers
// --------------------------------------------------

const money = (value) =>
  Number(value ?? 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

const unwrap = (response) =>
  response?.data?.data ?? response?.data ?? null;

const extractArray = (value, keys = []) => {
  if (Array.isArray(value)) return value;

  if (!value || typeof value !== "object") return [];

  for (const key of keys) {
    if (Array.isArray(value[key])) return value[key];
  }

  return [];
};

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getInvoiceAmount = (invoice) =>
  Number(
    invoice.total ??
      invoice.totalAmount ??
      invoice.grandTotal ??
      0
  );

const getPaymentMethod = (invoice) =>
  invoice.paymentMethod ?? invoice.paymentMode ?? "cash";

const getCustomerName = (invoice) =>
  invoice.customerSnapshot?.name ??
  invoice.customer?.name ??
  invoice.customerName ??
  "Cash Customer";

const getCustomerBalance = (customer) =>
  Number(
    customer.outstandingBalance ??
      customer.balance ??
      customer.creditBalance ??
      0
  );

const getStock = (product) =>
  Number(
    product.currentStock ??
      product.stock ??
      product.stockQuantity ??
      product.quantity ??
      0
  );

const getChartData = (response) => {
  let data = response;

  if (data && !Array.isArray(data)) {
    data =
      data.chartData ??
      data.salesChart ??
      data.sales ??
      data.data?.chartData ??
      data.data ??
      [];
  }

  if (!Array.isArray(data)) return [];

  return data.map((item, index) => ({
    ...item,
    day: item.day ?? item.date ?? item.label ?? `Day ${index + 1}`,
    sales: Number(
      item.sales ?? item.totalSales ?? item.revenue ?? 0
    ),
    profit: Number(item.profit ?? item.totalProfit ?? 0),
  }));
};

// --------------------------------------------------
// Dashboard
// --------------------------------------------------

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const hasLoaded = useRef(false);
  const requestInProgress = useRef(false);

  const [stats, setStats] = useState({
    todaySales: 0,
    todayProfit: 0,
    totalCustomers: 0,
    lowStockCount: 0,
    salesTrend: 0,
  });

  const [salesChartData, setSalesChartData] = useState([]);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [pendingKhata, setPendingKhata] = useState([]);
  const [deletingId, setDeletingId] = useState(null);

  // Delete an invoice from the database.
  const handleDeleteInvoice = async (invoice) => {
    const label = invoice.invoiceNumber || String(invoice._id).slice(-6);
    const approved = window.confirm(
      `Delete invoice #${label}? This action cannot be undone.`
    );
    if (!approved) return;

    setDeletingId(invoice._id);
    try {
      await invoicesApi.deleteInvoice(invoice._id);
      setRecentInvoices((prev) =>
        prev.filter((item) => item._id !== invoice._id)
      );
    } catch (err) {
      console.error("Failed to delete invoice:", err);
      setError("Could not delete invoice. Try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const fetchDashboardData = useCallback(async () => {
    // Prevent overlapping refresh requests.
    if (requestInProgress.current) return;

    requestInProgress.current = true;

    if (hasLoaded.current) {
      setRefreshing(true);
    }

    const requests = [
      ["daily sales", () => reportsApi.getDaily()],
      ["stock alerts", () => inventoryApi.getAlerts()],
      ["sales chart", () => reportsApi.getSalesChart(7)],
      [
        "recent invoices",
        () => invoicesApi.getAll({ page: 1, limit: 50 }),
      ],
      ["customers", () => customersApi.getAll()],
    ];

    try {
      const results = await Promise.allSettled(
        requests.map(([, request]) => request())
      );

      const failures = [];

      const readResult = (index) => {
        const result = results[index];

        if (result.status === "rejected") {
          failures.push(requests[index][0]);

          console.error(
            `Failed to fetch ${requests[index][0]}:`,
            result.reason
          );

          return { ok: false, data: null };
        }

        return {
          ok: true,
          data: unwrap(result.value),
        };
      };

      const dailyResult = readResult(0);
      const alertsResult = readResult(1);
      const chartResult = readResult(2);
      const invoicesResult = readResult(3);
      const customersResult = readResult(4);

      // Today's sales and profit come from the backend report.
      if (dailyResult.ok) {
        const daily = dailyResult.data ?? {};

        setStats((previous) => ({
          ...previous,
          todaySales: Number(
            daily.todaySales ??
              daily.totalSales ??
              daily.sales ??
              0
          ),
          todayProfit: Number(
            daily.todayProfit ??
              daily.totalProfit ??
              daily.profit ??
              0
          ),
          salesTrend: Number(daily.salesTrend ?? 0),
        }));
      }

      // Low-stock alerts.
      if (alertsResult.ok) {
        const alerts = extractArray(alertsResult.data, [
          "alerts",
          "products",
          "items",
        ]);

        setLowStockAlerts(alerts);

        setStats((previous) => ({
          ...previous,
          lowStockCount: alerts.length,
        }));
      }

      // Seven-day sales chart.
      if (chartResult.ok) {
        setSalesChartData(getChartData(chartResult.data));
      }

      // Recent invoices — show ALL invoices from the database.
      if (invoicesResult.ok) {
        const invoices = extractArray(invoicesResult.data, [
          "invoices",
          "items",
          "results",
        ]);

        const sortedInvoices = invoices
          .sort(
            (a, b) =>
              new Date(b.createdAt ?? b.date ?? 0).getTime() -
              new Date(a.createdAt ?? a.date ?? 0).getTime()
          );

        setRecentInvoices(sortedInvoices.slice(0, 10));
      }

      // Customer count and outstanding balances.
      if (customersResult.ok) {
        const customers = extractArray(customersResult.data, [
          "customers",
          "items",
          "results",
        ]);

        const debtors = customers
          .filter(
            (customer) => getCustomerBalance(customer) > 0
          )
          .sort(
            (a, b) =>
              getCustomerBalance(b) - getCustomerBalance(a)
          );

        setPendingKhata(debtors.slice(0, 4));

        setStats((previous) => ({
          ...previous,
          totalCustomers: customers.length,
        }));
      }

      setError(
        failures.length
          ? `Unable to load ${failures.join(
              ", "
            )}. Check the backend connection and refresh.`
          : ""
      );

      setLastUpdated(new Date());
      hasLoaded.current = true;
    } catch (err) {
      console.error("Dashboard loading failed:", err);
      setError("Unable to refresh the dashboard. Please try again.");
    } finally {
      requestInProgress.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial fetch and automatic refresh.
  useEffect(() => {
    fetchDashboardData();

    const intervalId = setInterval(
      fetchDashboardData,
      60 * 1000
    );

    return () => clearInterval(intervalId);
  }, [fetchDashboardData]);

  // Refresh immediately after a successful invoice confirmation.
  useEffect(() => {
    const handleInvoiceSaved = () => {
      fetchDashboardData();
    };

    window.addEventListener(
      "billing:invoice-saved",
      handleInvoiceSaved
    );

    return () => {
      window.removeEventListener(
        "billing:invoice-saved",
        handleInvoiceSaved
      );
    };
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <LoadingSpinner message="Dukaan ka hisaab load ho raha hai..." />
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Shop Dashboard / दुकान डैशबोर्ड
          </h1>

          <p className="page-subtitle">
            Aapki dukaan ka sales aur stock overview
          </p>

          {lastUpdated && (
            <p
              style={{
                fontSize: "0.78rem",
                color: "var(--text-secondary)",
                marginTop: "0.35rem",
              }}
            >
              Last updated: {lastUpdated.toLocaleTimeString("en-IN")}
              {" · "}Auto-refresh every 60 seconds
            </p>
          )}
        </div>

        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={fetchDashboardData}
            disabled={refreshing}
          >
            <RefreshCw size={14} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

          <Link to="/billing" className="btn btn-primary btn-sm">
            <Receipt size={16} />
            New Bill (+ बिल)
          </Link>
        </div>
      </div>

      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => setError("")}
        />
      )}

      {/* Statistics */}
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
          value={stats.lowStockCount}
          suffix=" items"
          color="danger"
          icon={AlertTriangle}
        />
      </div>

      {/* Sales Chart and Stock Alerts */}
      <div className="dashboard-split-grid">
        <div className="chart-container">
          <div className="chart-header">
            <div>
              <div className="chart-title">
                Last 7 Days Sales Trend (₹)
              </div>

              <div
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-secondary)",
                }}
              >
                Recorded sales and profit
              </div>
            </div>

            <Link
              to="/reports"
              style={{ fontSize: "0.85rem", fontWeight: 600 }}
            >
              Full Report <ArrowRight size={14} />
            </Link>
          </div>

          <div
            className="chart-wrapper"
            style={{ minHeight: "280px" }}
          >
            {salesChartData.length === 0 ? (
              <div
                style={{
                  height: "280px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.75rem",
                  textAlign: "center",
                  color: "var(--text-secondary)",
                  padding: "1rem",
                }}
              >
                <TrendingUp size={32} />
                <strong>No sales recorded yet</strong>
                <span>
                  Create your first bill to see the sales trend here.
                </span>
                <Link
                  to="/billing"
                  className="btn btn-primary btn-sm"
                >
                  Create First Bill
                </Link>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart
                  data={salesChartData}
                  margin={{
                    top: 10,
                    right: 20,
                    left: 0,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e2e8f0"
                  />

                  <XAxis
                    dataKey="day"
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                  />

                  <YAxis
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                    tickFormatter={(value) =>
                      `₹${Number(value).toLocaleString("en-IN")}`
                    }
                  />

                  <Tooltip
                    formatter={(value, name) => [
                      `₹${money(value)}`,
                      name === "sales" ? "Sales" : "Profit",
                    ]}
                  />

                  <Line
                    type="monotone"
                    dataKey="sales"
                    name="sales"
                    stroke="var(--primary)"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 7 }}
                  />

                  <Line
                    type="monotone"
                    dataKey="profit"
                    name="profit"
                    stroke="var(--success)"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Stock Alerts */}
        <div className="card">
          <div className="card-header">
            <h3
              className="card-title"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                color: "var(--danger)",
              }}
            >
              <AlertTriangle size={18} />
              Stock Alerts ({lowStockAlerts.length})
            </h3>

            <Link
              to="/inventory"
              style={{ fontSize: "0.85rem", fontWeight: 600 }}
            >
              Manage
            </Link>
          </div>

          <div
            className="card-body"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
              maxHeight: "320px",
              overflowY: "auto",
            }}
          >
            {lowStockAlerts.length === 0 ? (
              <div
                style={{
                  padding: "2rem 1rem",
                  textAlign: "center",
                  color: "var(--text-secondary)",
                }}
              >
                <Package size={28} />
                <p>No low-stock products found.</p>
                <Link to="/inventory">Manage inventory</Link>
              </div>
            ) : (
              lowStockAlerts.map((item) => (
                <div
                  key={item._id || item.id}
                  className="alert-badge-item"
                >
                  <div className="stock-info">
                    <span className="product-name">
                      {item.name ||
                        item.productName ||
                        "Unnamed product"}
                    </span>

                    <span className="stock-count">
                      Available:{" "}
                      <strong>
                        {getStock(item)} {item.unit || "pcs"}
                      </strong>
                      {" · "}Min: {item.reorderLevel ?? 0}
                    </span>
                  </div>

                  <Link
                    to="/inventory"
                    className="btn btn-outline btn-sm"
                  >
                    Restock
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Invoices and Pending Udhar */}
      <div
        className="dashboard-split-grid"
        style={{ gridTemplateColumns: "1.4fr 1fr" }}
      >
        {/* Recent Invoices */}
        <div className="card">
          <div className="card-header">
            <h3
              className="card-title"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <Receipt size={18} color="var(--primary)" />
              Recent Invoices (ताज़ा बिल)
            </h3>

            <Link
              to="/billing"
              style={{ fontSize: "0.85rem", fontWeight: 600 }}
            >
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
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Amount</th>
                  <th style={{ textAlign: "center" }}>Action</th>
                </tr>
              </thead>

              <tbody>
                {recentInvoices.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        textAlign: "center",
                        padding: "2rem 1rem",
                        color: "var(--text-secondary)",
                      }}
                    >
                      No invoices yet. Bills you create will appear here.
                      <br />
                      <Link to="/billing">Create your first bill</Link>
                    </td>
                  </tr>
                ) : (
                  recentInvoices.map((invoice) => {
                    const method = getPaymentMethod(invoice);
                    const status = invoice.paymentStatus || "unknown";

                    return (
                      <tr
                        key={
                          invoice._id ||
                          invoice.invoiceNumber
                        }
                      >
                        <td
                          style={{
                            fontWeight: 600,
                            color: "var(--primary)",
                          }}
                        >
                          #
                          {invoice.invoiceNumber ||
                            String(invoice._id || "").slice(-6) ||
                            "—"}
                        </td>

                        <td>
                          {getCustomerName(invoice)}
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--text-secondary)",
                            }}
                          >
                            {formatDate(
                              invoice.createdAt || invoice.date
                            )}
                          </div>
                        </td>

                        <td>
                          <span
                            className={`badge ${
                              method === "credit" ||
                              status === "pending"
                                ? "badge-danger"
                                : method === "upi"
                                  ? "badge-info"
                                  : "badge-success"
                            }`}
                          >
                            {method}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`badge ${
                              status === "paid"
                                ? "badge-success"
                                : status === "draft"
                                  ? "badge-warning"
                                  : status === "pending" || status === "partial"
                                    ? "badge-danger"
                                    : "badge-info"
                            }`}
                          >
                            {status}
                          </span>
                        </td>

                        <td
                          style={{
                            textAlign: "right",
                            fontWeight: 700,
                          }}
                        >
                          ₹{money(getInvoiceAmount(invoice))}
                        </td>

                        <td style={{ textAlign: "center" }}>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            style={{
                              color: "var(--danger)",
                              borderColor: "var(--danger)",
                              padding: "0.25rem 0.5rem",
                            }}
                            disabled={deletingId === invoice._id}
                            onClick={() =>
                              handleDeleteInvoice(invoice)
                            }
                          >
                            <Trash2 size={14} />
                            {deletingId === invoice._id
                              ? " ..."
                              : ""}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending Udhar */}
        <div className="card">
          <div className="card-header">
            <h3
              className="card-title"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                color: "var(--warning)",
              }}
            >
              <BookOpen size={18} />
              Pending Udhar (उधार वसूली)
            </h3>

            <Link
              to="/khata"
              style={{ fontSize: "0.85rem", fontWeight: 600 }}
            >
              Khata Book
            </Link>
          </div>

          <div className="card-body" style={{ padding: "0.75rem" }}>
            <div className="recent-list">
              {pendingKhata.length === 0 ? (
                <div
                  style={{
                    padding: "2rem 1rem",
                    textAlign: "center",
                    color: "var(--text-secondary)",
                  }}
                >
                  <BookOpen size={28} />
                  <p>No pending payments recorded.</p>
                  <Link to="/khata">Open Khata Book</Link>
                </div>
              ) : (
                pendingKhata.map((customer) => (
                  <div
                    key={customer._id || customer.id}
                    className="recent-item"
                  >
                    <div className="recent-item-info">
                      <span className="recent-item-title">
                        {customer.name ||
                          customer.customerName}
                      </span>

                      <span className="recent-item-subtitle">
                        {customer.phone || "No phone number"}
                      </span>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          color: "var(--danger)",
                          fontWeight: 700,
                          fontSize: "0.95rem",
                        }}
                      >
                        ₹{money(getCustomerBalance(customer))}
                      </div>

                      <Link
                        to="/khata"
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--primary)",
                          fontWeight: 600,
                        }}
                      >
                        View Khata
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
