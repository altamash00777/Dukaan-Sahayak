
// // import React, { useState, useEffect, useCallback, useRef } from "react";
// // import { Link } from "react-router-dom";
// // import {
// //   IndianRupee,
// //   TrendingUp,
// //   Users,
// //   AlertTriangle,
// //   Receipt,
// //   ArrowRight,
// //   BookOpen,
// //   RefreshCw,
// //   Package,
// //   Trash2,
// // } from "lucide-react";

// // import {
// //   LineChart,
// //   Line,
// //   XAxis,
// //   YAxis,
// //   CartesianGrid,
// //   Tooltip,
// //   ResponsiveContainer,
// // } from "recharts";

// // import StatCard from "../components/StatCard";
// // import LoadingSpinner from "../components/LoadingSpinner";
// // import Alert from "../components/Alert";

// // import {
// //   reports as reportsApi,
// //   inventory as inventoryApi,
// //   invoices as invoicesApi,
// //   customers as customersApi,
// // } from "../services/api";

// // // --------------------------------------------------
// // // Helpers
// // // --------------------------------------------------

// // const money = (value) =>
// //   Number(value ?? 0).toLocaleString("en-IN", {
// //     minimumFractionDigits: 0,
// //     maximumFractionDigits: 2,
// //   });

// // const unwrap = (response) =>
// //   response?.data?.data ?? response?.data ?? null;

// // const extractArray = (value, keys = []) => {
// //   if (Array.isArray(value)) return value;

// //   if (!value || typeof value !== "object") return [];

// //   for (const key of keys) {
// //     if (Array.isArray(value[key])) return value[key];
// //   }

// //   return [];
// // };

// // const formatDate = (value) => {
// //   if (!value) return "—";

// //   const date = new Date(value);

// //   if (Number.isNaN(date.getTime())) return "—";

// //   return date.toLocaleString("en-IN", {
// //     day: "2-digit",
// //     month: "short",
// //     hour: "2-digit",
// //     minute: "2-digit",
// //   });
// // };

// // const getInvoiceAmount = (invoice) =>
// //   Number(
// //     invoice.total ??
// //       invoice.totalAmount ??
// //       invoice.grandTotal ??
// //       0
// //   );

// // const getPaymentMethod = (invoice) =>
// //   invoice.paymentMethod ?? invoice.paymentMode ?? "cash";

// // const getCustomerName = (invoice) =>
// //   invoice.customerSnapshot?.name ??
// //   invoice.customer?.name ??
// //   invoice.customerName ??
// //   "Cash Customer";

// // const getCustomerBalance = (customer) =>
// //   Number(
// //     customer.outstandingBalance ??
// //       customer.balance ??
// //       customer.creditBalance ??
// //       0
// //   );

// // const getStock = (product) =>
// //   Number(
// //     product.currentStock ??
// //       product.stock ??
// //       product.stockQuantity ??
// //       product.quantity ??
// //       0
// //   );

// // const getChartData = (response) => {
// //   let data = response;

// //   if (data && !Array.isArray(data)) {
// //     data =
// //       data.chartData ??
// //       data.salesChart ??
// //       data.sales ??
// //       data.data?.chartData ??
// //       data.data ??
// //       [];
// //   }

// //   if (!Array.isArray(data)) return [];

// //   return data.map((item, index) => ({
// //     ...item,
// //     day: item.day ?? item.date ?? item.label ?? `Day ${index + 1}`,
// //     sales: Number(
// //       item.sales ?? item.totalSales ?? item.revenue ?? 0
// //     ),
// //     profit: Number(item.profit ?? item.totalProfit ?? 0),
// //   }));
// // };

// // // --------------------------------------------------
// // // Dashboard
// // // --------------------------------------------------

// // const Dashboard = () => {
// //   const [loading, setLoading] = useState(true);
// //   const [refreshing, setRefreshing] = useState(false);
// //   const [error, setError] = useState("");
// //   const [lastUpdated, setLastUpdated] = useState(null);

// //   const hasLoaded = useRef(false);
// //   const requestInProgress = useRef(false);

// //   const [stats, setStats] = useState({
// //     todaySales: 0,

// //     totalCustomers: 0,
// //     lowStockCount: 0,
// //     salesTrend: 0,
// //   });

// //   const [salesChartData, setSalesChartData] = useState([]);
// //   const [lowStockAlerts, setLowStockAlerts] = useState([]);
// //   const [recentInvoices, setRecentInvoices] = useState([]);
// //   const [pendingKhata, setPendingKhata] = useState([]);
// //   const [deletingId, setDeletingId] = useState(null);

// //   // Delete an invoice from the database.
// //   const handleDeleteInvoice = async (invoice) => {
// //     const label = invoice.invoiceNumber || String(invoice._id).slice(-6);
// //     const approved = window.confirm(
// //       `Delete invoice #${label}? This action cannot be undone.`
// //     );
// //     if (!approved) return;

// //     setDeletingId(invoice._id);
// //     try {
// //       await invoicesApi.deleteInvoice(invoice._id);
// //       setRecentInvoices((prev) =>
// //         prev.filter((item) => item._id !== invoice._id)
// //       );
// //     } catch (err) {
// //       console.error("Failed to delete invoice:", err);
// //       setError("Could not delete invoice. Try again.");
// //     } finally {
// //       setDeletingId(null);
// //     }
// //   };

// //   const fetchDashboardData = useCallback(async () => {
// //     // Prevent overlapping refresh requests.
// //     if (requestInProgress.current) return;

// //     requestInProgress.current = true;

// //     if (hasLoaded.current) {
// //       setRefreshing(true);
// //     }

// //     const requests = [
// //       ["daily sales", () => reportsApi.getDaily()],
// //       ["stock alerts", () => inventoryApi.getAlerts()],
// //       ["sales chart", () => reportsApi.getSalesChart(7)],
// //       [
// //         "recent invoices",
// //         () => invoicesApi.getAll({ page: 1, limit: 50 }),
// //       ],
// //       ["customers", () => customersApi.getAll()],
// //     ];

// //     try {
// //       const results = await Promise.allSettled(
// //         requests.map(([, request]) => request())
// //       );

// //       const failures = [];

// //       const readResult = (index) => {
// //         const result = results[index];

// //         if (result.status === "rejected") {
// //           failures.push(requests[index][0]);

// //           console.error(
// //             `Failed to fetch ${requests[index][0]}:`,
// //             result.reason
// //           );

// //           return { ok: false, data: null };
// //         }

// //         return {
// //           ok: true,
// //           data: unwrap(result.value),
// //         };
// //       };

// //       const dailyResult = readResult(0);
// //       const alertsResult = readResult(1);
// //       const chartResult = readResult(2);
// //       const invoicesResult = readResult(3);
// //       const customersResult = readResult(4);

// //       // Today's sales and profit come from the backend report.
// //       if (dailyResult.ok) {
// //         const daily = dailyResult.data ?? {};

// //         setStats((previous) => ({
// //           ...previous,
// //           todaySales: Number(
// //             daily.todaySales ??
// //               daily.totalSales ??
// //               daily.sales ??
// //               0
// //           ),
// //           salesTrend: Number(daily.salesTrend ?? 0),
// //         }));
// //       }

// //       // Low-stock alerts.
// //       if (alertsResult.ok) {
// //         const alerts = extractArray(alertsResult.data, [
// //           "alerts",
// //           "products",
// //           "items",
// //         ]);

// //         setLowStockAlerts(alerts);

// //         setStats((previous) => ({
// //           ...previous,
// //           lowStockCount: alerts.length,
// //         }));
// //       }

// //       // Seven-day sales chart.
// //       if (chartResult.ok) {
// //         setSalesChartData(getChartData(chartResult.data));
// //       }

// //       // Recent invoices — show ALL invoices from the database.
// //       if (invoicesResult.ok) {
// //         const invoices = extractArray(invoicesResult.data, [
// //           "invoices",
// //           "items",
// //           "results",
// //         ]);

// //         const sortedInvoices = invoices
// //           .sort(
// //             (a, b) =>
// //               new Date(b.createdAt ?? b.date ?? 0).getTime() -
// //               new Date(a.createdAt ?? a.date ?? 0).getTime()
// //           );

// //         setRecentInvoices(sortedInvoices.slice(0, 10));
// //       }

// //       // Customer count and outstanding balances.
// //       if (customersResult.ok) {
// //         const customers = extractArray(customersResult.data, [
// //           "customers",
// //           "items",
// //           "results",
// //         ]);

// //         const debtors = customers
// //           .filter(
// //             (customer) => getCustomerBalance(customer) > 0
// //           )
// //           .sort(
// //             (a, b) =>
// //               getCustomerBalance(b) - getCustomerBalance(a)
// //           );

// //         setPendingKhata(debtors.slice(0, 4));

// //         setStats((previous) => ({
// //           ...previous,
// //           totalCustomers: customers.length,
// //         }));
// //       }

// //       setError(
// //         failures.length
// //           ? `Unable to load ${failures.join(
// //               ", "
// //             )}. Check the backend connection and refresh.`
// //           : ""
// //       );

// //       setLastUpdated(new Date());
// //       hasLoaded.current = true;
// //     } catch (err) {
// //       console.error("Dashboard loading failed:", err);
// //       setError("Unable to refresh the dashboard. Please try again.");
// //     } finally {
// //       requestInProgress.current = false;
// //       setLoading(false);
// //       setRefreshing(false);
// //     }
// //   }, []);

// //   // Initial fetch and automatic refresh.
// //   useEffect(() => {
// //     fetchDashboardData();

// //     const intervalId = setInterval(
// //       fetchDashboardData,
// //       60 * 1000
// //     );

// //     return () => clearInterval(intervalId);
// //   }, [fetchDashboardData]);

// //   // Refresh immediately after a successful invoice confirmation.
// //   useEffect(() => {
// //     const handleInvoiceSaved = () => {
// //       fetchDashboardData();
// //     };

// //     window.addEventListener(
// //       "billing:invoice-saved",
// //       handleInvoiceSaved
// //     );

// //     return () => {
// //       window.removeEventListener(
// //         "billing:invoice-saved",
// //         handleInvoiceSaved
// //       );
// //     };
// //   }, [fetchDashboardData]);

// //   if (loading) {
// //     return (
// //       <LoadingSpinner message="Dukaan ka hisaab load ho raha hai..." />
// //     );
// //   }

// //   return (
// //     <div>
// //       {/* Header */}
// //       <div className="page-header">
// //         <div>
// //           <h1 className="page-title">
// //             Shop Dashboard / दुकान डैशबोर्ड
// //           </h1>

// //           <p className="page-subtitle">
// //             Aapki dukaan ka sales aur stock overview
// //           </p>

// //           {lastUpdated && (
// //             <p
// //               style={{
// //                 fontSize: "0.78rem",
// //                 color: "var(--text-secondary)",
// //                 marginTop: "0.35rem",
// //               }}
// //             >
// //               Last updated: {lastUpdated.toLocaleTimeString("en-IN")}
// //               {" · "}Auto-refresh every 60 seconds
// //             </p>
// //           )}
// //         </div>

// //         <div
// //           style={{
// //             display: "flex",
// //             gap: "0.75rem",
// //             alignItems: "center",
// //             flexWrap: "wrap",
// //           }}
// //         >
// //           <button
// //             type="button"
// //             className="btn btn-outline btn-sm"
// //             onClick={fetchDashboardData}
// //             disabled={refreshing}
// //           >
// //             <RefreshCw size={14} />
// //             {refreshing ? "Refreshing..." : "Refresh"}
// //           </button>

// //           <Link to="/billing" className="btn btn-primary btn-sm">
// //             <Receipt size={16} />
// //             New Bill (+ बिल)
// //           </Link>
// //         </div>
// //       </div>

// //       {error && (
// //         <Alert
// //           type="error"
// //           message={error}
// //           onClose={() => setError("")}
// //         />
// //       )}

// //       {/* Statistics */}
// //       <div className="dashboard-grid">
// //         <StatCard
// //           title="Today's Sales / आज की बिक्री"
// //           value={stats.todaySales}
// //           prefix="₹"
// //           trend={stats.salesTrend}
// //           color="primary"
// //           icon={IndianRupee}
// //         />

// //         <StatCard
// //           title="Today's Profit / आज का मुनाफा"
// //           value={stats.todayProfit}
// //           prefix="₹"
// //           color="success"
// //           icon={TrendingUp}
// //         />

// //         <StatCard
// //           title="Total Customers / कुल ग्राहक"
// //           value={stats.totalCustomers}
// //           color="info"
// //           icon={Users}
// //         />

// //         <StatCard
// //           title="Low Stock Items / कम स्टॉक"
// //           value={stats.lowStockCount}
// //           suffix=" items"
// //           color="danger"
// //           icon={AlertTriangle}
// //         />
// //       </div>

// //       {/* Sales Chart and Stock Alerts */}
// //       <div className="dashboard-split-grid">
// //         <div className="chart-container">
// //           <div className="chart-header">
// //             <div>
// //               <div className="chart-title">
// //                 Last 7 Days Sales Trend (₹)
// //               </div>

// //               <div
// //                 style={{
// //                   fontSize: "0.8rem",
// //                   color: "var(--text-secondary)",
// //                 }}
// //               >
// //                 Recorded sales and profit
// //               </div>
// //             </div>

// //             <Link
// //               to="/reports"
// //               style={{ fontSize: "0.85rem", fontWeight: 600 }}
// //             >
// //               Full Report <ArrowRight size={14} />
// //             </Link>
// //           </div>

// //           <div
// //             className="chart-wrapper"
// //             style={{ minHeight: "280px" }}
// //           >
// //             {salesChartData.length === 0 ? (
// //               <div
// //                 style={{
// //                   height: "280px",
// //                   display: "flex",
// //                   flexDirection: "column",
// //                   alignItems: "center",
// //                   justifyContent: "center",
// //                   gap: "0.75rem",
// //                   textAlign: "center",
// //                   color: "var(--text-secondary)",
// //                   padding: "1rem",
// //                 }}
// //               >
// //                 <TrendingUp size={32} />
// //                 <strong>No sales recorded yet</strong>
// //                 <span>
// //                   Create your first bill to see the sales trend here.
// //                 </span>
// //                 <Link
// //                   to="/billing"
// //                   className="btn btn-primary btn-sm"
// //                 >
// //                   Create First Bill
// //                 </Link>
// //               </div>
// //             ) : (
// //               <ResponsiveContainer width="100%" height={280}>
// //                 <LineChart
// //                   data={salesChartData}
// //                   margin={{
// //                     top: 10,
// //                     right: 20,
// //                     left: 0,
// //                     bottom: 0,
// //                   }}
// //                 >
// //                   <CartesianGrid
// //                     strokeDasharray="3 3"
// //                     stroke="#e2e8f0"
// //                   />

// //                   <XAxis
// //                     dataKey="day"
// //                     stroke="#94a3b8"
// //                     fontSize={12}
// //                     tickLine={false}
// //                   />

// //                   <YAxis
// //                     stroke="#94a3b8"
// //                     fontSize={12}
// //                     tickLine={false}
// //                     tickFormatter={(value) =>
// //                       `₹${Number(value).toLocaleString("en-IN")}`
// //                     }
// //                   />

// //                   <Tooltip
// //                     formatter={(value, name) => [
// //                       `₹${money(value)}`,
// //                       name === "sales" ? "Sales" : "Profit",
// //                     ]}
// //                   />

// //                   <Line
// //                     type="monotone"
// //                     dataKey="sales"
// //                     name="sales"
// //                     stroke="var(--primary)"
// //                     strokeWidth={3}
// //                     dot={{ r: 4 }}
// //                     activeDot={{ r: 7 }}
// //                   />

// //                   <Line
// //                     type="monotone"
// //                     dataKey="profit"
// //                     name="profit"
// //                     stroke="var(--success)"
// //                     strokeWidth={2}
// //                     strokeDasharray="4 4"
// //                     dot={{ r: 3 }}
// //                   />
// //                 </LineChart>
// //               </ResponsiveContainer>
// //             )}
// //           </div>
// //         </div>

// //         {/* Stock Alerts */}
// //         <div className="card">
// //           <div className="card-header">
// //             <h3
// //               className="card-title"
// //               style={{
// //                 display: "flex",
// //                 alignItems: "center",
// //                 gap: "0.5rem",
// //                 color: "var(--danger)",
// //               }}
// //             >
// //               <AlertTriangle size={18} />
// //               Stock Alerts ({lowStockAlerts.length})
// //             </h3>

// //             <Link
// //               to="/inventory"
// //               style={{ fontSize: "0.85rem", fontWeight: 600 }}
// //             >
// //               Manage
// //             </Link>
// //           </div>

// //           <div
// //             className="card-body"
// //             style={{
// //               display: "flex",
// //               flexDirection: "column",
// //               gap: "0.75rem",
// //               maxHeight: "320px",
// //               overflowY: "auto",
// //             }}
// //           >
// //             {lowStockAlerts.length === 0 ? (
// //               <div
// //                 style={{
// //                   padding: "2rem 1rem",
// //                   textAlign: "center",
// //                   color: "var(--text-secondary)",
// //                 }}
// //               >
// //                 <Package size={28} />
// //                 <p>No low-stock products found.</p>
// //                 <Link to="/inventory">Manage inventory</Link>
// //               </div>
// //             ) : (
// //               lowStockAlerts.map((item) => (
// //                 <div
// //                   key={item._id || item.id}
// //                   className="alert-badge-item"
// //                 >
// //                   <div className="stock-info">
// //                     <span className="product-name">
// //                       {item.name ||
// //                         item.productName ||
// //                         "Unnamed product"}
// //                     </span>

// //                     <span className="stock-count">
// //                       Available:{" "}
// //                       <strong>
// //                         {getStock(item)} {item.unit || "pcs"}
// //                       </strong>
// //                       {" · "}Min: {item.reorderLevel ?? 0}
// //                     </span>
// //                   </div>

// //                   <Link
// //                     to="/inventory"
// //                     className="btn btn-outline btn-sm"
// //                   >
// //                     Restock
// //                   </Link>
// //                 </div>
// //               ))
// //             )}
// //           </div>
// //         </div>
// //       </div>

// //       {/* Recent Invoices and Pending Udhar */}
// //       <div
// //         className="dashboard-split-grid"
// //         style={{ gridTemplateColumns: "1.4fr 1fr" }}
// //       >
// //         {/* Recent Invoices */}
// //         <div className="card">
// //           <div className="card-header">
// //             <h3
// //               className="card-title"
// //               style={{
// //                 display: "flex",
// //                 alignItems: "center",
// //                 gap: "0.5rem",
// //               }}
// //             >
// //               <Receipt size={18} color="var(--primary)" />
// //               Recent Invoices (ताज़ा बिल)
// //             </h3>

// //             <Link
// //               to="/billing"
// //               style={{ fontSize: "0.85rem", fontWeight: 600 }}
// //             >
// //               View All
// //             </Link>
// //           </div>

// //           <div className="table-container">
// //             <table>
// //               <thead>
// //                 <tr>
// //                   <th>Bill #</th>
// //                   <th>Customer</th>
// //                   <th>Mode</th>
// //                   <th>Status</th>
// //                   <th style={{ textAlign: "right" }}>Amount</th>
// //                   <th style={{ textAlign: "center" }}>Action</th>
// //                 </tr>
// //               </thead>

// //               <tbody>
// //                 {recentInvoices.length === 0 ? (
// //                   <tr>
// //                     <td
// //                       colSpan={6}
// //                       style={{
// //                         textAlign: "center",
// //                         padding: "2rem 1rem",
// //                         color: "var(--text-secondary)",
// //                       }}
// //                     >
// //                       No invoices yet. Bills you create will appear here.
// //                       <br />
// //                       <Link to="/billing">Create your first bill</Link>
// //                     </td>
// //                   </tr>
// //                 ) : (
// //                   recentInvoices.map((invoice) => {
// //                     const method = getPaymentMethod(invoice);
// //                     const status = invoice.paymentStatus || "unknown";

// //                     return (
// //                       <tr
// //                         key={
// //                           invoice._id ||
// //                           invoice.invoiceNumber
// //                         }
// //                       >
// //                         <td
// //                           style={{
// //                             fontWeight: 600,
// //                             color: "var(--primary)",
// //                           }}
// //                         >
// //                           #
// //                           {invoice.invoiceNumber ||
// //                             String(invoice._id || "").slice(-6) ||
// //                             "—"}
// //                         </td>

// //                         <td>
// //                           {getCustomerName(invoice)}
// //                           <div
// //                             style={{
// //                               fontSize: "0.75rem",
// //                               color: "var(--text-secondary)",
// //                             }}
// //                           >
// //                             {formatDate(
// //                               invoice.createdAt || invoice.date
// //                             )}
// //                           </div>
// //                         </td>

// //                         <td>
// //                           <span
// //                             className={`badge ${
// //                               method === "credit" ||
// //                               status === "pending"
// //                                 ? "badge-danger"
// //                                 : method === "upi"
// //                                   ? "badge-info"
// //                                   : "badge-success"
// //                             }`}
// //                           >
// //                             {method}
// //                           </span>
// //                         </td>

// //                         <td>
// //                           <span
// //                             className={`badge ${
// //                               status === "paid"
// //                                 ? "badge-success"
// //                                 : status === "draft"
// //                                   ? "badge-warning"
// //                                   : status === "pending" || status === "partial"
// //                                     ? "badge-danger"
// //                                     : "badge-info"
// //                             }`}
// //                           >
// //                             {status}
// //                           </span>
// //                         </td>

// //                         <td
// //                           style={{
// //                             textAlign: "right",
// //                             fontWeight: 700,
// //                           }}
// //                         >
// //                           ₹{money(getInvoiceAmount(invoice))}
// //                         </td>

// //                         <td style={{ textAlign: "center" }}>
// //                           <button
// //                             type="button"
// //                             className="btn btn-outline btn-sm"
// //                             style={{
// //                               color: "var(--danger)",
// //                               borderColor: "var(--danger)",
// //                               padding: "0.25rem 0.5rem",
// //                             }}
// //                             disabled={deletingId === invoice._id}
// //                             onClick={() =>
// //                               handleDeleteInvoice(invoice)
// //                             }
// //                           >
// //                             <Trash2 size={14} />
// //                             {deletingId === invoice._id
// //                               ? " ..."
// //                               : ""}
// //                           </button>
// //                         </td>
// //                       </tr>
// //                     );
// //                   })
// //                 )}
// //               </tbody>
// //             </table>
// //           </div>
// //         </div>

// //         {/* Pending Udhar */}
// //         <div className="card">
// //           <div className="card-header">
// //             <h3
// //               className="card-title"
// //               style={{
// //                 display: "flex",
// //                 alignItems: "center",
// //                 gap: "0.5rem",
// //                 color: "var(--warning)",
// //               }}
// //             >
// //               <BookOpen size={18} />
// //               Pending Udhar (उधार वसूली)
// //             </h3>

// //             <Link
// //               to="/khata"
// //               style={{ fontSize: "0.85rem", fontWeight: 600 }}
// //             >
// //               Khata Book
// //             </Link>
// //           </div>

// //           <div className="card-body" style={{ padding: "0.75rem" }}>
// //             <div className="recent-list">
// //               {pendingKhata.length === 0 ? (
// //                 <div
// //                   style={{
// //                     padding: "2rem 1rem",
// //                     textAlign: "center",
// //                     color: "var(--text-secondary)",
// //                   }}
// //                 >
// //                   <BookOpen size={28} />
// //                   <p>No pending payments recorded.</p>
// //                   <Link to="/khata">Open Khata Book</Link>
// //                 </div>
// //               ) : (
// //                 pendingKhata.map((customer) => (
// //                   <div
// //                     key={customer._id || customer.id}
// //                     className="recent-item"
// //                   >
// //                     <div className="recent-item-info">
// //                       <span className="recent-item-title">
// //                         {customer.name ||
// //                           customer.customerName}
// //                       </span>

// //                       <span className="recent-item-subtitle">
// //                         {customer.phone || "No phone number"}
// //                       </span>
// //                     </div>

// //                     <div style={{ textAlign: "right" }}>
// //                       <div
// //                         style={{
// //                           color: "var(--danger)",
// //                           fontWeight: 700,
// //                           fontSize: "0.95rem",
// //                         }}
// //                       >
// //                         ₹{money(getCustomerBalance(customer))}
// //                       </div>

// //                       <Link
// //                         to="/khata"
// //                         style={{
// //                           fontSize: "0.75rem",
// //                           color: "var(--primary)",
// //                           fontWeight: 600,
// //                         }}
// //                       >
// //                         View Khata
// //                       </Link>
// //                     </div>
// //                   </div>
// //                 ))
// //               )}
// //             </div>
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // };

// // export default Dashboard;

// import React, { useCallback, useEffect, useState } from 'react';
// import { Link } from 'react-router-dom';
// import {
//   Activity,
//   AlertTriangle,
//   ArrowRight,
//   Boxes,
//   IndianRupee,
//   Receipt,
//   RefreshCw,
//   ShoppingBag,
//   Users,
//   Wallet,
//   X,
// } from 'lucide-react';

// import {
//   ResponsiveContainer,
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
// } from 'recharts';

// import LoadingSpinner from '../components/LoadingSpinner';
// import {
//   reports as reportsApi,
//   inventory as inventoryApi,
//   invoices as invoicesApi,
//   customers as customersApi,
// } from '../services/api';

// const money = (value) =>
//   new Intl.NumberFormat('en-IN', {
//     style: 'currency',
//     currency: 'INR',
//     maximumFractionDigits: 2,
//   }).format(Number(value) || 0);

// const unwrap = (response) => response?.data ?? response;

// const extractArray = (response) => {
//   const data = unwrap(response);

//   if (Array.isArray(data)) return data;

//   for (const key of [
//     'data',
//     'items',
//     'invoices',
//     'customers',
//     'alerts',
//     'results',
//   ]) {
//     if (Array.isArray(data?.[key])) return data[key];
//   }

//   return [];
// };

// const getInvoiceId = (invoice) =>
//   invoice?._id ?? invoice?.id ?? invoice?.invoiceId;

// const getInvoiceAmount = (invoice) =>
//   Number(
//     invoice?.total ??
//       invoice?.totalAmount ??
//       invoice?.grandTotal ??
//       invoice?.amount ??
//       invoice?.billAmount ??
//       0
//   );

// const getInvoiceDate = (invoice) =>
//   invoice?.createdAt ??
//   invoice?.invoiceDate ??
//   invoice?.date ??
//   invoice?.updatedAt ??
//   null;

// const getCustomerName = (invoice) => {
//   const customer =
//     invoice?.customerSnapshot ??
//     invoice?.customerId ??
//     invoice?.customer;

//   if (typeof customer === 'string') {
//     return invoice?.customerName || 'Cash Customer';
//   }

//   return (
//     customer?.name ??
//     customer?.fullName ??
//     invoice?.customerName ??
//     'Cash Customer'
//   );
// };

// const getInvoiceNumber = (invoice) =>
//   invoice?.invoiceNumber ??
//   invoice?.billNumber ??
//   invoice?.invoiceNo ??
//   invoice?.number ??
//   getInvoiceId(invoice) ??
//   '—';

// const getCustomerBalance = (customer) =>
//   Number(
//     customer?.outstandingBalance ??
//       customer?.totalDue ??
//       customer?.dueAmount ??
//       customer?.balance ??
//       customer?.udhar ??
//       0
//   );

// const getStock = (item) =>
//   Number(
//     item?.quantity ??
//       item?.stock ??
//       item?.stockQuantity ??
//       item?.currentStock ??
//       0
//   );

// const formatDate = (value) => {
//   if (!value) return '—';

//   const date = new Date(value);

//   if (Number.isNaN(date.getTime())) return '—';

//   return date.toLocaleDateString('en-IN', {
//     day: '2-digit',
//     month: 'short',
//     year: 'numeric',
//   });
// };

// const formatTime = (value) => {
//   if (!value) return '—';

//   const date = new Date(value);

//   if (Number.isNaN(date.getTime())) return '—';

//   return date.toLocaleTimeString('en-IN', {
//     hour: '2-digit',
//     minute: '2-digit',
//   });
// };

// const getIndiaDateKey = (value = new Date()) =>
//   new Intl.DateTimeFormat('en-CA', {
//     timeZone: 'Asia/Kolkata',
//     year: 'numeric',
//     month: '2-digit',
//     day: '2-digit',
//   }).format(new Date(value));

// const isTodayInIndia = (date) =>
//   Boolean(date) && getIndiaDateKey(date) === getIndiaDateKey();

// const getReportSales = (response) => {
//   const data = unwrap(response);
//   const report = data?.data ?? data?.report ?? data;

//   return Number(
//     report?.todaySales ??
//       report?.totalSales ??
//       report?.sales ??
//       report?.totalRevenue ??
//       report?.revenue ??
//       0
//   );
// };

// const getChartData = (response) => {
//   const data = unwrap(response);

//   const rows = Array.isArray(data)
//     ? data
//     : data?.data ??
//       data?.chartData ??
//       data?.salesTrend ??
//       data?.dailySales ??
//       data?.sales ??
//       [];

//   if (!Array.isArray(rows)) return [];

//   return rows.map((item, index) => {
//     const rawDate =
//       item?.date ??
//       item?.day ??
//       item?._id?.date ??
//       item?._id ??
//       item?.label;

//     const parsedDate = rawDate ? new Date(rawDate) : null;

//     const day =
//       parsedDate && !Number.isNaN(parsedDate.getTime())
//         ? parsedDate.toLocaleDateString('en-IN', {
//             day: '2-digit',
//             month: 'short',
//             timeZone: 'Asia/Kolkata',
//           })
//         : String(rawDate ?? `Day ${index + 1}`);

//     return {
//       day,
//       sales: Number(
//         item?.sales ??
//           item?.totalSales ??
//           item?.revenue ??
//           item?.amount ??
//           item?.total ??
//           0
//       ),
//     };
//   });
// };

// const getStatus = (invoice) => {
//   const status = String(
//     invoice?.paymentStatus ??
//       invoice?.status ??
//       invoice?.payment?.status ??
//       ''
//   ).toLowerCase();

//   if (
//     status.includes('paid') ||
//     status.includes('complete') ||
//     status.includes('settled')
//   ) {
//     return 'Paid';
//   }

//   if (
//     status.includes('partial') ||
//     status.includes('pending') ||
//     status.includes('unpaid') ||
//     status.includes('due')
//   ) {
//     return 'Pending';
//   }

//   const due = Number(
//     invoice?.dueAmount ??
//       invoice?.remainingAmount ??
//       invoice?.balanceDue ??
//       0
//   );

//   if (due > 0) return 'Pending';

//   return '—';
// };

// function StatCard({ icon: Icon, title, value, subtitle, to }) {
//   const content = (
//     <div className="dashboard-stat-card">
//       <div className="dashboard-stat-top">
//         <span className="dashboard-stat-title">{title}</span>
//         <span className="dashboard-stat-icon">
//           <Icon size={20} />
//         </span>
//       </div>

//       <div className="dashboard-stat-value">{value}</div>
//       <div className="dashboard-stat-subtitle">{subtitle}</div>
//     </div>
//   );

//   return to ? (
//     <Link to={to} className="dashboard-stat-link">
//       {content}
//     </Link>
//   ) : (
//     content
//   );
// }

// export default function Dashboard() {
//   const [stats, setStats] = useState({
//     todaySales: 0,
//     totalCustomers: 0,
//     lowStockCount: 0,
//   });

//   const [chartData, setChartData] = useState([]);
//   const [recentInvoices, setRecentInvoices] = useState([]);
//   const [pendingCustomers, setPendingCustomers] = useState([]);
//   const [lowStockItems, setLowStockItems] = useState([]);

//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [error, setError] = useState('');
//   const [notice, setNotice] = useState('');

//   const fetchDashboardData = useCallback(
//     async (isRefresh = false, options = {}) => {
//       if (isRefresh) {
//         setRefreshing(true);
//       } else {
//         setLoading(true);
//       }

//       setError('');

//       try {
//         const results = await Promise.allSettled([
//           reportsApi.getDaily(),
//           inventoryApi.getAlerts(),
//           reportsApi.getSalesChart(7),
//           invoicesApi.getAll({ page: 1, limit: 50 }),
//           customersApi.getAll(),
//         ]);

//         const [
//           dailyResult,
//           stockResult,
//           chartResult,
//           invoicesResult,
//           customersResult,
//         ] = results;

//         const failedSections = [];

//         if (!options.skipDaily) {
//           if (dailyResult.status === 'fulfilled') {
//             setStats((previous) => ({
//               ...previous,
//               todaySales: getReportSales(dailyResult.value),
//             }));
//           } else {
//             failedSections.push("today's sales");
//             console.error(
//               'Daily report failed:',
//               dailyResult.reason
//             );
//           }
//         }

//         if (stockResult.status === 'fulfilled') {
//           const stockItems = extractArray(stockResult.value);

//           setLowStockItems(stockItems);
//           setStats((previous) => ({
//             ...previous,
//             lowStockCount: stockItems.length,
//           }));
//         } else {
//           failedSections.push('low-stock alerts');
//           console.error(
//             'Low-stock request failed:',
//             stockResult.reason
//           );
//         }

//         if (chartResult.status === 'fulfilled') {
//           setChartData(getChartData(chartResult.value));
//         } else {
//           failedSections.push('sales trend');
//           console.error(
//             'Sales chart failed:',
//             chartResult.reason
//           );
//         }

//         if (invoicesResult.status === 'fulfilled') {
//           const invoices = extractArray(invoicesResult.value);

//           const sorted = [...invoices].sort((a, b) => {
//             const dateA = new Date(getInvoiceDate(a) || 0).getTime();
//             const dateB = new Date(getInvoiceDate(b) || 0).getTime();

//             return dateB - dateA;
//           });

//           setRecentInvoices(sorted.slice(0, 5));
//         } else {
//           failedSections.push('recent invoices');
//           console.error(
//             'Invoice request failed:',
//             invoicesResult.reason
//           );
//         }

//         if (customersResult.status === 'fulfilled') {
//           const customers = extractArray(customersResult.value);

//           setStats((previous) => ({
//             ...previous,
//             totalCustomers: customers.length,
//           }));

//           setPendingCustomers(
//             customers
//               .filter((customer) => getCustomerBalance(customer) > 0)
//               .sort(
//                 (a, b) =>
//                   getCustomerBalance(b) - getCustomerBalance(a)
//               )
//               .slice(0, 5)
//           );
//         } else {
//           failedSections.push('customers and pending udhar');
//           console.error(
//             'Customers request failed:',
//             customersResult.reason
//           );
//         }

//         if (failedSections.length > 0) {
//           setError(
//             `Unable to load ${failedSections.join(
//               ', '
//             )}. Please check your connection and try refreshing.`
//           );
//         }
//       } catch (err) {
//         console.error('Dashboard loading error:', err);

//         setError(
//           err?.response?.data?.message ??
//             'Unable to load dashboard data. Please try again.'
//         );
//       } finally {
//         setLoading(false);
//         setRefreshing(false);
//       }
//     },
//     []
//   );

//   // Initial load and periodic refresh.
//   useEffect(() => {
//     fetchDashboardData();

//     const intervalId = setInterval(() => {
//       fetchDashboardData(true);
//     }, 60_000);

//     return () => clearInterval(intervalId);
//   }, [fetchDashboardData]);

//   // Update the sales card immediately after a bill is confirmed.
//   useEffect(() => {
//     const handleInvoiceSaved = (event) => {
//       const invoice = event.detail?.invoice;

//       if (!invoice) {
//         fetchDashboardData(true);
//         return;
//       }

//       const invoiceDate = getInvoiceDate(invoice);

//       // A late event for an older invoice must not change today's total.
//       if (invoiceDate && !isTodayInIndia(invoiceDate)) {
//         fetchDashboardData(true);
//         return;
//       }

//       // If the server returns no usable total, get the authoritative total
//       // from the report endpoint rather than guessing.
//       const amount = getInvoiceAmount(invoice);

//       if (!Number.isFinite(amount) || amount < 0) {
//         fetchDashboardData(true);
//         return;
//       }

//       setStats((previous) => ({
//         ...previous,
//         todaySales: previous.todaySales + amount,
//       }));

//       // Update other panels. The immediate amount is retained until the
//       // next normal report refresh.
//       fetchDashboardData(true, { skipDaily: true });
//     };

//     window.addEventListener(
//       'billing:invoice-saved',
//       handleInvoiceSaved
//     );

//     return () => {
//       window.removeEventListener(
//         'billing:invoice-saved',
//         handleInvoiceSaved
//       );
//     };
//   }, [fetchDashboardData]);

//   // Schedule a local display reset at midnight in India.
//   useEffect(() => {
//     let timeoutId;

//     const scheduleNextMidnight = () => {
//       const now = new Date();

//       const parts = new Intl.DateTimeFormat('en-GB', {
//         timeZone: 'Asia/Kolkata',
//         year: 'numeric',
//         month: '2-digit',
//         day: '2-digit',
//       }).formatToParts(now);

//       const values = Object.fromEntries(
//         parts.map(({ type, value }) => [type, value])
//       );

//       // India is UTC+05:30 and does not observe daylight saving time.
//       const nextMidnightUTC =
//         Date.UTC(
//           Number(values.year),
//           Number(values.month) - 1,
//           Number(values.day) + 1,
//           0,
//           0,
//           0
//         ) -
//         330 * 60 * 1000;

//       const delay = Math.max(1000, nextMidnightUTC - Date.now());

//       timeoutId = setTimeout(() => {
//         setStats((previous) => ({
//           ...previous,
//           todaySales: 0,
//         }));

//         // The backend report remains the source of truth.
//         fetchDashboardData(true);

//         scheduleNextMidnight();
//       }, delay);
//     };

//     scheduleNextMidnight();

//     return () => clearTimeout(timeoutId);
//   }, [fetchDashboardData]);

//   const handleDeleteInvoice = async (invoice) => {
//     const invoiceId = getInvoiceId(invoice);

//     if (!invoiceId) {
//       setNotice('This invoice does not have a valid ID.');
//       return;
//     }

//     if (
//       !window.confirm(
//         `Delete invoice ${getInvoiceNumber(invoice)}?`
//       )
//     ) {
//       return;
//     }

//     try {
//       await invoicesApi.deleteInvoice(invoiceId);
//       setNotice('Invoice deleted successfully.');
//       await fetchDashboardData(true);
//     } catch (err) {
//       console.error('Invoice deletion failed:', err);
//       setNotice(
//         err?.response?.data?.message ??
//           'Could not delete this invoice.'
//       );
//     }
//   };

//   if (loading) {
//     return <LoadingSpinner />;
//   }

//   return (
//     <div className="dashboard-page">
//       <style>{`
//         .dashboard-page {
//           width: 100%;
//           color: var(--text-primary, #172033);
//         }

//         .dashboard-page * {
//           box-sizing: border-box;
//         }

//         .dashboard-header {
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//           flex-wrap: wrap;
//           gap: 16px;
//           margin-bottom: 24px;
//         }

//         .dashboard-heading {
//           margin: 0;
//           font-size: clamp(1.45rem, 2.5vw, 1.9rem);
//           font-weight: 750;
//           letter-spacing: -.045em;
//         }

//         .dashboard-description {
//           margin: 6px 0 0;
//           color: var(--text-secondary, #64748b);
//           font-size: .92rem;
//         }

//         .dashboard-header-actions {
//           display: flex;
//           align-items: center;
//           gap: 10px;
//         }

//         .dashboard-action {
//           display: inline-flex;
//           align-items: center;
//           justify-content: center;
//           gap: 8px;
//           min-height: 40px;
//           padding: 9px 14px;
//           border: 1px solid var(--border-color, #dce2ea);
//           border-radius: 6px;
//           background: var(--card-bg, #fff);
//           color: var(--text-primary, #172033);
//           text-decoration: none;
//           font: inherit;
//           font-size: .88rem;
//           font-weight: 650;
//           cursor: pointer;
//         }

//         .dashboard-action:hover {
//           border-color: var(--primary-color, #4f46e5);
//         }

//         .dashboard-stat-grid {
//           display: grid;
//           grid-template-columns: repeat(3, minmax(0, 1fr));
//           gap: 14px;
//           margin-bottom: 22px;
//         }

//         .dashboard-stat-link {
//           display: block;
//           min-width: 0;
//           color: inherit;
//           text-decoration: none;
//         }

//         .dashboard-stat-card {
//           min-height: 140px;
//           height: 100%;
//           padding: 19px;
//           border: 1px solid var(--border-color, #e0e5ed);
//           border-radius: 7px;
//           background: var(--card-bg, #fff);
//           box-shadow: 0 2px 5px rgba(15, 23, 42, .035);
//           transition: border-color .18s, box-shadow .18s;
//         }

//         .dashboard-stat-link:hover .dashboard-stat-card {
//           border-color: #a5b4fc;
//           box-shadow: 0 4px 12px rgba(15, 23, 42, .07);
//         }

//         .dashboard-stat-top {
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//           gap: 10px;
//         }

//         .dashboard-stat-title {
//           color: var(--text-secondary, #64748b);
//           font-size: .87rem;
//           font-weight: 600;
//         }

//         .dashboard-stat-icon {
//           display: inline-flex;
//           align-items: center;
//           justify-content: center;
//           width: 38px;
//           height: 38px;
//           border: 1px solid var(--border-color, #e5e7eb);
//           border-radius: 6px;
//           color: var(--primary-color, #4f46e5);
//           background: var(--subtle-bg, #f8fafc);
//           flex-shrink: 0;
//         }

//         .dashboard-stat-value {
//           margin-top: 17px;
//           font-size: clamp(1.35rem, 2.2vw, 1.8rem);
//           line-height: 1.15;
//           font-weight: 750;
//           letter-spacing: -.04em;
//           overflow-wrap: anywhere;
//         }

//         .dashboard-stat-subtitle {
//           margin-top: 8px;
//           color: var(--text-secondary, #64748b);
//           font-size: .8rem;
//         }

//         .dashboard-content-grid {
//           display: grid;
//           grid-template-columns: minmax(0, 1.5fr) minmax(280px, 1fr);
//           gap: 18px;
//           align-items: start;
//         }

//         .dashboard-panel {
//           min-width: 0;
//           margin-bottom: 18px;
//           overflow: hidden;
//           border: 1px solid var(--border-color, #e0e5ed);
//           border-radius: 7px;
//           background: var(--card-bg, #fff);
//           box-shadow: 0 2px 5px rgba(15, 23, 42, .03);
//         }

//         .dashboard-panel-header {
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//           gap: 12px;
//           padding: 17px 18px;
//           border-bottom: 1px solid var(--border-color, #edf0f4);
//         }

//         .dashboard-panel-title {
//           margin: 0;
//           font-size: 1rem;
//           font-weight: 700;
//           letter-spacing: -.02em;
//         }

//         .dashboard-panel-subtitle {
//           margin: 5px 0 0;
//           color: var(--text-secondary, #64748b);
//           font-size: .81rem;
//         }

//         .dashboard-panel-link {
//           display: inline-flex;
//           align-items: center;
//           gap: 5px;
//           color: var(--primary-color, #4f46e5);
//           text-decoration: none;
//           font-size: .82rem;
//           font-weight: 650;
//           white-space: nowrap;
//         }

//         .dashboard-chart {
//           width: 100%;
//           height: 280px;
//           padding: 15px 12px 10px 0;
//         }

//         .dashboard-table-wrap {
//           width: 100%;
//           overflow-x: auto;
//         }

//         .dashboard-table {
//           width: 100%;
//           border-collapse: collapse;
//           text-align: left;
//           font-size: .84rem;
//         }

//         .dashboard-table th {
//           padding: 12px 16px;
//           background: var(--subtle-bg, #f8fafc);
//           color: var(--text-secondary, #64748b);
//           font-size: .74rem;
//           font-weight: 700;
//           text-transform: uppercase;
//           letter-spacing: .045em;
//           white-space: nowrap;
//         }

//         .dashboard-table td {
//           padding: 14px 16px;
//           border-top: 1px solid var(--border-color, #edf0f4);
//           white-space: nowrap;
//         }

//         .dashboard-table tbody tr:hover {
//           background: var(--hover-bg, #fafbff);
//         }

//         .dashboard-table-primary {
//           color: var(--text-primary, #172033);
//           font-weight: 650;
//         }

//         .dashboard-table-secondary {
//           margin-top: 4px;
//           color: var(--text-secondary, #64748b);
//           font-size: .76rem;
//         }

//         .dashboard-status {
//           display: inline-flex;
//           padding: 4px 8px;
//           border: 1px solid #e2e8f0;
//           border-radius: 5px;
//           color: #475569;
//           background: #f8fafc;
//           font-size: .74rem;
//           font-weight: 650;
//         }

//         .dashboard-status-paid {
//           border-color: #bbf7d0;
//           color: #166534;
//           background: #f0fdf4;
//         }

//         .dashboard-status-pending {
//           border-color: #fed7aa;
//           color: #9a3412;
//           background: #fff7ed;
//         }

//         .dashboard-empty {
//           padding: 30px 18px;
//           text-align: center;
//           color: var(--text-secondary, #64748b);
//           font-size: .87rem;
//         }

//         .dashboard-list {
//           display: flex;
//           flex-direction: column;
//         }

//         .dashboard-list-item {
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//           gap: 12px;
//           padding: 14px 17px;
//           border-bottom: 1px solid var(--border-color, #edf0f4);
//         }

//         .dashboard-list-item:last-child {
//           border-bottom: 0;
//         }

//         .dashboard-list-main {
//           min-width: 0;
//         }

//         .dashboard-list-name {
//           overflow: hidden;
//           color: var(--text-primary, #172033);
//           font-size: .86rem;
//           font-weight: 650;
//           text-overflow: ellipsis;
//           white-space: nowrap;
//         }

//         .dashboard-list-detail {
//           margin-top: 5px;
//           color: var(--text-secondary, #64748b);
//           font-size: .77rem;
//         }

//         .dashboard-list-amount {
//           color: var(--text-primary, #172033);
//           font-size: .85rem;
//           font-weight: 750;
//           white-space: nowrap;
//         }

//         .dashboard-alert-icon {
//           display: inline-flex;
//           align-items: center;
//           justify-content: center;
//           width: 34px;
//           height: 34px;
//           border: 1px solid #fed7aa;
//           border-radius: 6px;
//           color: #c2410c;
//           background: #fff7ed;
//           flex-shrink: 0;
//         }

//         .dashboard-notice,
//         .dashboard-error {
//           margin-bottom: 16px;
//           padding: 12px 14px;
//           border-radius: 6px;
//           font-size: .87rem;
//         }

//         .dashboard-notice {
//           display: flex;
//           align-items: flex-start;
//           justify-content: space-between;
//           gap: 12px;
//           border: 1px solid #bfdbfe;
//           color: #1e40af;
//           background: #eff6ff;
//         }

//         .dashboard-error {
//           border: 1px solid #fecaca;
//           color: #991b1b;
//           background: #fef2f2;
//         }

//         .dashboard-delete-button {
//           border: 0;
//           padding: 5px;
//           border-radius: 5px;
//           color: #b91c1c;
//           background: transparent;
//           cursor: pointer;
//         }

//         .dashboard-delete-button:hover {
//           background: #fef2f2;
//         }

//         @media (max-width: 1000px) {
//           .dashboard-stat-grid {
//             grid-template-columns: repeat(2, minmax(0, 1fr));
//           }

//           .dashboard-content-grid {
//             grid-template-columns: minmax(0, 1fr);
//           }
//         }

//         @media (max-width: 520px) {
//           .dashboard-stat-grid {
//             grid-template-columns: minmax(0, 1fr);
//             gap: 10px;
//           }

//           .dashboard-stat-card {
//             min-height: 120px;
//             padding: 16px;
//           }

//           .dashboard-panel-header {
//             padding: 14px;
//           }

//           .dashboard-chart {
//             height: 240px;
//           }

//           .dashboard-header-actions {
//             width: 100%;
//           }

//           .dashboard-header-actions .dashboard-action {
//             flex: 1;
//           }
//         }
//       `}</style>

//       <div className="dashboard-header">
//         <div>
//           <h1 className="dashboard-heading">Dashboard</h1>
//           <p className="dashboard-description">
//             Here's an overview of your shop's activity.
//           </p>
//         </div>

//         <div className="dashboard-header-actions">
//           <button
//             type="button"
//             className="dashboard-action"
//             onClick={() => fetchDashboardData(true)}
//             disabled={refreshing}
//           >
//             <RefreshCw size={16} />
//             {refreshing ? 'Refreshing...' : 'Refresh'}
//           </button>

//           <Link to="/billing" className="dashboard-action">
//             <Receipt size={16} />
//             New bill
//           </Link>
//         </div>
//       </div>

//       {error && (
//         <div className="dashboard-error" role="alert">
//           {error}
//         </div>
//       )}

//       {notice && (
//         <div className="dashboard-notice" role="status">
//           <span>{notice}</span>
//           <button
//             type="button"
//             className="dashboard-delete-button"
//             aria-label="Dismiss message"
//             onClick={() => setNotice('')}
//           >
//             <X size={16} />
//           </button>
//         </div>
//       )}

//       <div className="dashboard-stat-grid">
//         <StatCard
//           icon={IndianRupee}
//           title="Today's Sales"
//           value={money(stats.todaySales)}
//           subtitle="Sales recorded today"
//           to="/reports"
//         />

//         <StatCard
//           icon={Users}
//           title="Total Customers"
//           value={stats.totalCustomers.toLocaleString('en-IN')}
//           subtitle="Registered customers"
//           to="/khata"
//         />

//         <StatCard
//           icon={AlertTriangle}
//           title="Low Stock Items"
//           value={stats.lowStockCount.toLocaleString('en-IN')}
//           subtitle="Items needing attention"
//           to="/inventory"
//         />
//       </div>

//       <div className="dashboard-content-grid">
//         <div>
//           <section className="dashboard-panel">
//             <div className="dashboard-panel-header">
//               <div>
//                 <h2 className="dashboard-panel-title">Sales Trend</h2>
//                 <p className="dashboard-panel-subtitle">
//                   Actual recorded sales over the last 7 days
//                 </p>
//               </div>

//               <Link to="/reports" className="dashboard-panel-link">
//                 Reports <ArrowRight size={15} />
//               </Link>
//             </div>

//             {chartData.length > 0 ? (
//               <div className="dashboard-chart">
//                 <ResponsiveContainer width="100%" height="100%">
//                   <LineChart
//                     data={chartData}
//                     margin={{ top: 10, right: 18, left: 8, bottom: 4 }}
//                   >
//                     <CartesianGrid
//                       strokeDasharray="3 3"
//                       vertical={false}
//                       stroke="#e8edf3"
//                     />

//                     <XAxis
//                       dataKey="day"
//                       axisLine={false}
//                       tickLine={false}
//                       tick={{ fill: '#64748b', fontSize: 12 }}
//                       dy={10}
//                     />

//                     <YAxis
//                       axisLine={false}
//                       tickLine={false}
//                       tick={{ fill: '#64748b', fontSize: 11 }}
//                       tickFormatter={(value) =>
//                         value >= 1000
//                           ? `₹${(value / 1000).toFixed(1)}k`
//                           : `₹${value}`
//                       }
//                       width={65}
//                     />

//                     <Tooltip
//                       formatter={(value) => [money(value), 'Sales']}
//                       contentStyle={{
//                         borderRadius: 6,
//                         border: '1px solid #e2e8f0',
//                         boxShadow: '0 4px 12px rgba(15,23,42,.08)',
//                       }}
//                     />

//                     <Line
//                       type="monotone"
//                       dataKey="sales"
//                       name="Sales"
//                       stroke="#4f46e5"
//                       strokeWidth={2.5}
//                       dot={{ r: 3, fill: '#4f46e5', strokeWidth: 0 }}
//                       activeDot={{ r: 5 }}
//                       connectNulls
//                     />
//                   </LineChart>
//                 </ResponsiveContainer>
//               </div>
//             ) : (
//               <div className="dashboard-empty">
//                 <Activity
//                   size={28}
//                   style={{ margin: '0 auto 10px', opacity: 0.55 }}
//                 />
//                 <div>No sales trend data available.</div>
//                 <div style={{ marginTop: 5 }}>
//                   The chart will appear when the report API returns daily sales.
//                 </div>
//               </div>
//             )}
//           </section>

//           <section className="dashboard-panel">
//             <div className="dashboard-panel-header">
//               <div>
//                 <h2 className="dashboard-panel-title">Recent Invoices</h2>
//                 <p className="dashboard-panel-subtitle">
//                   Your latest recorded bills
//                 </p>
//               </div>

//               <Link to="/billing" className="dashboard-panel-link">
//                 Billing <ArrowRight size={15} />
//               </Link>
//             </div>

//             <div className="dashboard-table-wrap">
//               <table className="dashboard-table">
//                 <thead>
//                   <tr>
//                     <th>Invoice</th>
//                     <th>Customer</th>
//                     <th>Date</th>
//                     <th>Amount</th>
//                     <th>Status</th>
//                     <th>Action</th>
//                   </tr>
//                 </thead>

//                 <tbody>
//                   {recentInvoices.length > 0 ? (
//                     recentInvoices.map((invoice, index) => (
//                       <tr
//                         key={getInvoiceId(invoice) ?? `invoice-${index}`}
//                       >
//                         <td className="dashboard-table-primary">
//                           #{getInvoiceNumber(invoice)}
//                         </td>

//                         <td>{getCustomerName(invoice)}</td>

//                         <td>
//                           <div>{formatDate(getInvoiceDate(invoice))}</div>
//                           <div className="dashboard-table-secondary">
//                             {formatTime(getInvoiceDate(invoice))}
//                           </div>
//                         </td>

//                         <td className="dashboard-table-primary">
//                           {money(getInvoiceAmount(invoice))}
//                         </td>

//                         <td>
//                           <span
//                             className={`dashboard-status ${
//                               getStatus(invoice) === 'Paid'
//                                 ? 'dashboard-status-paid'
//                                 : getStatus(invoice) === 'Pending'
//                                 ? 'dashboard-status-pending'
//                                 : ''
//                             }`}
//                           >
//                             {getStatus(invoice)}
//                           </span>
//                         </td>

//                         <td>
//                           <button
//                             type="button"
//                             className="dashboard-delete-button"
//                             title="Delete invoice"
//                             aria-label={`Delete invoice ${getInvoiceNumber(invoice)}`}
//                             onClick={() => handleDeleteInvoice(invoice)}
//                           >
//                             <X size={17} />
//                           </button>
//                         </td>
//                       </tr>
//                     ))
//                   ) : (
//                     <tr>
//                       <td colSpan={6} className="dashboard-empty">
//                         No invoices found. Create your first bill to see it here.
//                       </td>
//                     </tr>
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           </section>
//         </div>

//         <div>
//           <section className="dashboard-panel">
//             <div className="dashboard-panel-header">
//               <div>
//                 <h2 className="dashboard-panel-title">Pending Udhar</h2>
//                 <p className="dashboard-panel-subtitle">
//                   Customers with outstanding balances
//                 </p>
//               </div>

//               <Link to="/khata" className="dashboard-panel-link">
//                 Khata <ArrowRight size={15} />
//               </Link>
//             </div>

//             {pendingCustomers.length > 0 ? (
//               <div className="dashboard-list">
//                 {pendingCustomers.map((customer, index) => (
//                   <div
//                     className="dashboard-list-item"
//                     key={
//                       customer?._id ??
//                       customer?.id ??
//                       `customer-${index}`
//                     }
//                   >
//                     <div className="dashboard-list-main">
//                       <div className="dashboard-list-name">
//                         {customer?.name ??
//                           customer?.fullName ??
//                           customer?.customerName ??
//                           'Unnamed customer'}
//                       </div>

//                       <div className="dashboard-list-detail">
//                         Outstanding balance
//                       </div>
//                     </div>

//                     <div className="dashboard-list-amount">
//                       {money(getCustomerBalance(customer))}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             ) : (
//               <div className="dashboard-empty">
//                 No outstanding customer balances found.
//               </div>
//             )}
//           </section>

//           <section className="dashboard-panel">
//             <div className="dashboard-panel-header">
//               <div>
//                 <h2 className="dashboard-panel-title">Low Stock Alerts</h2>
//                 <p className="dashboard-panel-subtitle">
//                   Inventory that needs attention
//                 </p>
//               </div>

//               <Link to="/inventory" className="dashboard-panel-link">
//                 Inventory <ArrowRight size={15} />
//               </Link>
//             </div>

//             {lowStockItems.length > 0 ? (
//               <div className="dashboard-list">
//                 {lowStockItems.slice(0, 6).map((item, index) => (
//                   <div
//                     className="dashboard-list-item"
//                     key={item?._id ?? item?.id ?? `stock-${index}`}
//                   >
//                     <div className="dashboard-alert-icon">
//                       <Boxes size={17} />
//                     </div>

//                     <div className="dashboard-list-main">
//                       <div className="dashboard-list-name">
//                         {item?.name ??
//                           item?.productName ??
//                           item?.title ??
//                           'Unnamed item'}
//                       </div>

//                       <div className="dashboard-list-detail">
//                         {item?.category ?? 'Inventory item'}
//                       </div>
//                     </div>

//                     <div className="dashboard-list-amount">
//                       {getStock(item)} left
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             ) : (
//               <div className="dashboard-empty">
//                 No low-stock alerts returned by the inventory API.
//               </div>
//             )}
//           </section>

//           <section className="dashboard-panel">
//             <div className="dashboard-panel-header">
//               <div>
//                 <h2 className="dashboard-panel-title">Quick Actions</h2>
//                 <p className="dashboard-panel-subtitle">
//                   Common shop tasks
//                 </p>
//               </div>
//             </div>

//             <div className="dashboard-list">
//               <Link
//                 to="/billing"
//                 className="dashboard-list-item"
//                 style={{ textDecoration: 'none' }}
//               >
//                 <div className="dashboard-list-main">
//                   <div className="dashboard-list-name">Create a bill</div>
//                   <div className="dashboard-list-detail">
//                     Record a new customer sale
//                   </div>
//                 </div>
//                 <ShoppingBag size={19} />
//               </Link>

//               <Link
//                 to="/khata"
//                 className="dashboard-list-item"
//                 style={{ textDecoration: 'none' }}
//               >
//                 <div className="dashboard-list-main">
//                   <div className="dashboard-list-name">
//                     Manage Digital Khata
//                   </div>
//                   <div className="dashboard-list-detail">
//                     Check customer balances and udhar
//                   </div>
//                 </div>
//                 <Wallet size={19} />
//               </Link>

//               <Link
//                 to="/reports"
//                 className="dashboard-list-item"
//                 style={{ textDecoration: 'none' }}
//               >
//                 <div className="dashboard-list-main">
//                   <div className="dashboard-list-name">View reports</div>
//                   <div className="dashboard-list-detail">
//                     Review recorded shop sales
//                   </div>
//                 </div>
//                 <ArrowRight size={19} />
//               </Link>
//             </div>
//           </section>
//         </div>
//       </div>
//     </div>
//   );
// }


import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Boxes,
  IndianRupee,
  Receipt,
  RefreshCw,
  ShoppingBag,
  Users,
  Wallet,
  X,
} from 'lucide-react';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

import {
  reports as reportsApi,
  inventory as inventoryApi,
  invoices as invoicesApi,
  customers as customersApi,
} from '../services/api';

const currency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const getPayload = (response) => {
  let value = response?.data ?? response;

  // Handle common API response wrappers.
  for (let i = 0; i < 3; i += 1) {
    if (
      value &&
      !Array.isArray(value) &&
      typeof value === 'object' &&
      value.data !== undefined
    ) {
      value = value.data;
    } else {
      break;
    }
  }

  return value;
};

const getArray = (response, possibleKeys = []) => {
  const payload = getPayload(response);

  if (Array.isArray(payload)) return payload;

  for (const key of possibleKeys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }

  return [];
};

const getIndiaDateKey = (date = new Date()) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(date));

const isTodayInIndia = (date) =>
  Boolean(date) && getIndiaDateKey(date) === getIndiaDateKey();

const invoiceDate = (invoice) =>
  invoice?.createdAt ??
  invoice?.invoiceDate ??
  invoice?.date ??
  null;

const invoiceAmount = (invoice) =>
  Number(
    invoice?.total ??
      invoice?.totalAmount ??
      invoice?.grandTotal ??
      invoice?.billAmount ??
      invoice?.amount ??
      0
  );

const invoiceId = (invoice) =>
  invoice?._id ?? invoice?.id ?? invoice?.invoiceId;

const invoiceNumber = (invoice) =>
  invoice?.invoiceNumber ??
  invoice?.billNumber ??
  invoice?.invoiceNo ??
  invoice?.number ??
  invoiceId(invoice) ??
  '—';

const customerName = (invoice) => {
  const customer =
    invoice?.customerSnapshot ??
    invoice?.customerId ??
    invoice?.customer;

  if (typeof customer === 'object' && customer !== null) {
    return (
      customer.name ??
      customer.fullName ??
      invoice?.customerName ??
      'Cash Customer'
    );
  }

  return invoice?.customerName ?? 'Cash Customer';
};

const customerBalance = (customer) =>
  Number(
    customer?.outstandingBalance ??
      customer?.totalDue ??
      customer?.dueAmount ??
      customer?.balance ??
      customer?.udhar ??
      0
  );

const stockQuantity = (item) =>
  Number(
    item?.quantity ??
      item?.stock ??
      item?.stockQuantity ??
      item?.currentStock ??
      0
  );

const formatDate = (value) => {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
};

const formatTime = (value) => {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  });
};

const reportSales = (response) => {
  const payload = getPayload(response);

  return Number(
    payload?.todaySales ??
      payload?.totalSales ??
      payload?.sales ??
      payload?.totalRevenue ??
      payload?.revenue ??
      payload?.total ??
      0
  );
};

const chartRows = (response) => {
  const rows = getArray(response, [
    'chartData',
    'salesTrend',
    'dailySales',
    'sales',
    'results',
  ]);

  return rows.map((item, index) => {
    const date =
      item?.date ??
      item?.day ??
      item?.label ??
      item?._id?.date ??
      item?._id;

    let label = String(date ?? `Day ${index + 1}`);

    if (date && !Number.isNaN(new Date(date).getTime())) {
      label = new Date(date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        timeZone: 'Asia/Kolkata',
      });
    }

    return {
      day: label,
      sales: Number(
        item?.sales ??
          item?.totalSales ??
          item?.revenue ??
          item?.amount ??
          item?.total ??
          0
      ),
    };
  });
};

const paymentStatus = (invoice) => {
  const status = String(
    invoice?.paymentStatus ??
      invoice?.status ??
      invoice?.payment?.status ??
      ''
  ).toLowerCase();

  if (status === 'paid' || status === 'complete' || status === 'completed') {
    return 'Paid';
  }

  if (
    status === 'pending' ||
    status === 'partial' ||
    status === 'unpaid' ||
    status === 'due' ||
    status === 'credit'
  ) {
    return 'Pending';
  }

  const due = Number(
    invoice?.dueAmount ??
      invoice?.remainingAmount ??
      invoice?.balanceDue ??
      0
  );

  return due > 0 ? 'Pending' : '—';
};

function StatCard({ icon: Icon, title, value, subtitle, to }) {
  return (
    <Link to={to} className="ds-stat-link">
      <div className="ds-stat-card">
        <div className="ds-stat-top">
          <span className="ds-muted">{title}</span>
          <span className="ds-stat-icon">
            <Icon size={20} />
          </span>
        </div>
        <div className="ds-stat-value">{value}</div>
        <div className="ds-muted ds-small">{subtitle}</div>
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    todaySales: 0,
    totalCustomers: 0,
    lowStockCount: 0,
  });

  const [chart, setChart] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [lowStock, setLowStock] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errors, setErrors] = useState([]);
  const [notice, setNotice] = useState('');

  const fetchDashboardData = useCallback(
    async (refresh = false, options = {}) => {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      const labels = [
        "Today's sales",
        'Low-stock alerts',
        'Sales trend',
        'Recent invoices',
        'Customers and udhar',
      ];

      try {
        const results = await Promise.allSettled([
          reportsApi.getDaily(),
          inventoryApi.getAlerts(),
          reportsApi.getSalesChart(7),
          invoicesApi.getAll({ page: 1, limit: 50 }),
          customersApi.getAll(),
        ]);

        const failures = [];

        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            failures.push(labels[index]);

            // Keep the actual server/network error available in DevTools.
            console.error(
              `[Dashboard] ${labels[index]} failed:`,
              result.reason?.response?.status,
              result.reason?.response?.data ?? result.reason?.message
            );
          }
        });

        if (!options.skipDaily && results[0].status === 'fulfilled') {
          setStats((previous) => ({
            ...previous,
            todaySales: reportSales(results[0].value),
          }));
        }

        if (results[1].status === 'fulfilled') {
          const stock = getArray(results[1].value, [
            'alerts',
            'items',
            'products',
            'inventory',
            'results',
          ]);

          setLowStock(stock);
          setStats((previous) => ({
            ...previous,
            lowStockCount: stock.length,
          }));
        }

        if (results[2].status === 'fulfilled') {
          setChart(chartRows(results[2].value));
        }

        if (results[3].status === 'fulfilled') {
          const list = getArray(results[3].value, [
            'invoices',
            'items',
            'results',
          ]);

          list.sort(
            (a, b) =>
              new Date(invoiceDate(b) || 0).getTime() -
              new Date(invoiceDate(a) || 0).getTime()
          );

          setInvoices(list.slice(0, 5));
        }

        if (results[4].status === 'fulfilled') {
          const list = getArray(results[4].value, [
            'customers',
            'items',
            'results',
          ]);

          setCustomers(
            list
              .filter((customer) => customerBalance(customer) > 0)
              .sort(
                (a, b) =>
                  customerBalance(b) - customerBalance(a)
              )
              .slice(0, 5)
          );

          setStats((previous) => ({
            ...previous,
            totalCustomers: list.length,
          }));
        }

        setErrors(failures);
      } catch (error) {
        console.error('[Dashboard] Unexpected error:', error);
        setErrors(['Dashboard data']);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  // Initial loading and background refresh.
  useEffect(() => {
    fetchDashboardData();

    const intervalId = setInterval(() => {
      fetchDashboardData(true);
    }, 60_000);

    return () => clearInterval(intervalId);
  }, [fetchDashboardData]);

  // IMPORTANT: This is the only invoice-saved listener in this file.
  useEffect(() => {
    const handleInvoiceSaved = (event) => {
      const invoice = event.detail?.invoice;

      if (!invoice) {
        fetchDashboardData(true);
        return;
      }

      const date = invoiceDate(invoice);

      if (date && !isTodayInIndia(date)) {
        fetchDashboardData(true);
        return;
      }

      const amount = invoiceAmount(invoice);

      if (!Number.isFinite(amount) || amount <= 0) {
        fetchDashboardData(true);
        return;
      }

      // Update the card immediately.
      setStats((previous) => ({
        ...previous,
        todaySales: previous.todaySales + amount,
      }));

      // Refresh other panels without immediately overwriting the card.
      fetchDashboardData(true, { skipDaily: true });
    };

    window.addEventListener('billing:invoice-saved', handleInvoiceSaved);

    return () => {
      window.removeEventListener(
        'billing:invoice-saved',
        handleInvoiceSaved
      );
    };
  }, [fetchDashboardData]);

  // Reset at the next midnight in India.
  useEffect(() => {
    let timeoutId;

    const scheduleReset = () => {
      const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).formatToParts(new Date());

      const values = Object.fromEntries(
        parts.map(({ type, value }) => [type, value])
      );

      const nextMidnightUTC =
        Date.UTC(
          Number(values.year),
          Number(values.month) - 1,
          Number(values.day) + 1
        ) -
        330 * 60 * 1000;

      timeoutId = setTimeout(() => {
        setStats((previous) => ({
          ...previous,
          todaySales: 0,
        }));

        fetchDashboardData(true);
        scheduleReset();
      }, Math.max(1000, nextMidnightUTC - Date.now()));
    };

    scheduleReset();

    return () => clearTimeout(timeoutId);
  }, [fetchDashboardData]);

  const handleDeleteInvoice = async (invoice) => {
    const id = invoiceId(invoice);
    if (!id) {
      setNotice('Invoice ID is missing.');
      return;
    }

    if (!window.confirm(`Delete invoice ${invoiceNumber(invoice)}?`)) {
      return;
    }

    try {
      await invoicesApi.deleteInvoice(id);
      setNotice('Invoice deleted successfully.');
      await fetchDashboardData(true);
    } catch (error) {
      console.error('Delete invoice failed:', error);
      setNotice(
        error?.response?.data?.message ??
          'Unable to delete this invoice.'
      );
    }
  };

  if (loading) {
    return (
      <div className="ds-loading">
        <RefreshCw size={22} className="ds-spin" />
        <span>Loading dashboard...</span>
        <style>{`
          .ds-loading {
            min-height: 240px;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 12px;
            color: #64748b;
          }
          .ds-spin { animation: ds-spin 1s linear infinite; }
          @keyframes ds-spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  return (
    <main className="ds-page">
      <style>{`
        .ds-page {
          width: 100%;
          color: var(--text-primary, #172033);
        }
        .ds-page * { box-sizing: border-box; }
        .ds-muted { color: var(--text-secondary, #64748b); }
        .ds-small { font-size: .8rem; }
        .ds-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 14px;
          margin-bottom: 22px;
        }
        .ds-title {
          margin: 0;
          font-size: clamp(1.5rem, 3vw, 1.9rem);
          font-weight: 750;
          letter-spacing: -.04em;
        }
        .ds-description {
          margin: 6px 0 0;
          font-size: .9rem;
          color: var(--text-secondary, #64748b);
        }
        .ds-actions { display: flex; gap: 9px; }
        .ds-button {
          display: inline-flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          min-height: 40px;
          padding: 9px 13px;
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 6px;
          background: var(--card-bg, #fff);
          color: inherit;
          text-decoration: none;
          font: inherit;
          font-size: .85rem;
          font-weight: 650;
          cursor: pointer;
        }
        .ds-button:hover { border-color: #818cf8; }
        .ds-button:disabled { opacity: .6; cursor: wait; }
        .ds-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 20px;
        }
        .ds-stat-link { display: block; color: inherit; text-decoration: none; }
        .ds-stat-card {
          height: 100%;
          min-height: 137px;
          padding: 18px;
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 7px;
          background: var(--card-bg, #fff);
          box-shadow: 0 2px 5px rgba(15, 23, 42, .035);
          transition: box-shadow .18s, border-color .18s;
        }
        .ds-stat-link:hover .ds-stat-card {
          border-color: #a5b4fc;
          box-shadow: 0 4px 13px rgba(15, 23, 42, .07);
        }
        .ds-stat-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          font-size: .86rem;
          font-weight: 600;
        }
        .ds-stat-icon {
          display: grid;
          place-items: center;
          width: 38px;
          height: 38px;
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 6px;
          color: #4f46e5;
          background: #f8fafc;
          flex-shrink: 0;
        }
        .ds-stat-value {
          margin: 16px 0 7px;
          font-size: clamp(1.4rem, 2.5vw, 1.8rem);
          font-weight: 750;
          letter-spacing: -.04em;
          overflow-wrap: anywhere;
        }
        .ds-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.5fr) minmax(270px, 1fr);
          gap: 17px;
          align-items: start;
        }
        .ds-panel {
          min-width: 0;
          margin-bottom: 17px;
          overflow: hidden;
          border: 1px solid var(--border-color, #e2e8f0);
          border-radius: 7px;
          background: var(--card-bg, #fff);
          box-shadow: 0 2px 5px rgba(15, 23, 42, .03);
        }
        .ds-panel-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding: 16px 17px;
          border-bottom: 1px solid var(--border-color, #edf0f4);
        }
        .ds-panel-title { margin: 0; font-size: 1rem; font-weight: 700; }
        .ds-panel-subtitle {
          margin: 5px 0 0;
          font-size: .8rem;
          color: var(--text-secondary, #64748b);
        }
        .ds-link {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          color: #4f46e5;
          text-decoration: none;
          font-size: .81rem;
          font-weight: 650;
          white-space: nowrap;
        }
        .ds-chart { height: 270px; padding: 15px 12px 10px 0; }
        .ds-table-wrap { width: 100%; overflow-x: auto; }
        .ds-table { width: 100%; border-collapse: collapse; text-align: left; font-size: .82rem; }
        .ds-table th {
          padding: 12px;
          background: #f8fafc;
          color: #64748b;
          font-size: .72rem;
          font-weight: 700;
          text-transform: uppercase;
          white-space: nowrap;
        }
        .ds-table td {
          padding: 13px 12px;
          border-top: 1px solid #edf0f4;
          white-space: nowrap;
        }
        .ds-table tbody tr:hover { background: #fafbff; }
        .ds-primary { font-weight: 650; }
        .ds-secondary { margin-top: 4px; color: #64748b; font-size: .75rem; }
        .ds-status {
          display: inline-flex;
          padding: 4px 7px;
          border: 1px solid #e2e8f0;
          border-radius: 5px;
          background: #f8fafc;
          color: #475569;
          font-size: .72rem;
          font-weight: 650;
        }
        .ds-paid { background: #f0fdf4; color: #166534; border-color: #bbf7d0; }
        .ds-pending { background: #fff7ed; color: #9a3412; border-color: #fed7aa; }
        .ds-empty {
          padding: 27px 16px;
          text-align: center;
          color: #64748b;
          font-size: .84rem;
        }
        .ds-list { display: flex; flex-direction: column; }
        .ds-list-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 13px 16px;
          border-bottom: 1px solid #edf0f4;
          color: inherit;
          text-decoration: none;
        }
        .ds-list-item:last-child { border-bottom: 0; }
        .ds-list-main { min-width: 0; }
        .ds-list-name {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: .85rem;
          font-weight: 650;
        }
        .ds-list-detail { margin-top: 4px; color: #64748b; font-size: .76rem; }
        .ds-list-amount { font-size: .84rem; font-weight: 750; white-space: nowrap; }
        .ds-warning-icon {
          display: grid;
          place-items: center;
          width: 34px;
          height: 34px;
          flex-shrink: 0;
          border: 1px solid #fed7aa;
          border-radius: 6px;
          color: #c2410c;
          background: #fff7ed;
        }
        .ds-error {
          margin-bottom: 15px;
          padding: 12px 14px;
          border: 1px solid #fecaca;
          border-radius: 6px;
          background: #fef2f2;
          color: #991b1b;
          font-size: .85rem;
        }
        .ds-notice {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 15px;
          padding: 12px 14px;
          border: 1px solid #bfdbfe;
          border-radius: 6px;
          background: #eff6ff;
          color: #1e40af;
          font-size: .85rem;
        }
        .ds-delete {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 5px;
          border: 0;
          border-radius: 5px;
          background: transparent;
          color: #b91c1c;
          cursor: pointer;
        }
        .ds-delete:hover { background: #fef2f2; }
        @media (max-width: 1000px) {
          .ds-grid { grid-template-columns: minmax(0, 1fr); }
        }
        @media (max-width: 650px) {
          .ds-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
          .ds-stat-card { min-height: 125px; padding: 14px; }
          .ds-stat-value { font-size: 1.4rem; }
          .ds-header { align-items: flex-start; }
          .ds-actions { width: 100%; }
          .ds-actions .ds-button { flex: 1; }
          .ds-chart { height: 235px; }
        }
        @media (max-width: 390px) {
          .ds-stats { grid-template-columns: minmax(0, 1fr); }
        }
      `}</style>

      <header className="ds-header">
        <div>
          <h1 className="ds-title">Dashboard</h1>
          <p className="ds-description">
            Here's an overview of your shop's activity.
          </p>
        </div>

        <div className="ds-actions">
          <button
            type="button"
            className="ds-button"
            disabled={refreshing}
            onClick={() => fetchDashboardData(true)}
          >
            <RefreshCw size={16} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>

          <Link to="/billing" className="ds-button">
            <Receipt size={16} />
            New bill
          </Link>
        </div>
      </header>

      {errors.length > 0 && (
        <div className="ds-error" role="alert">
          Unable to load: {errors.join(', ')}. Check the browser console for
          the actual request error, then try refreshing.
        </div>
      )}

      {notice && (
        <div className="ds-notice" role="status">
          <span>{notice}</span>
          <button
            type="button"
            className="ds-delete"
            aria-label="Dismiss message"
            onClick={() => setNotice('')}
          >
            <X size={16} />
          </button>
        </div>
      )}

      <section className="ds-stats">
        <StatCard
          icon={IndianRupee}
          title="Today's Sales"
          value={currency(stats.todaySales)}
          subtitle="Sales recorded today"
          to="/reports"
        />
        <StatCard
          icon={Users}
          title="Total Customers"
          value={stats.totalCustomers.toLocaleString('en-IN')}
          subtitle="Registered customers"
          to="/khata"
        />
        <StatCard
          icon={AlertTriangle}
          title="Low Stock Items"
          value={stats.lowStockCount.toLocaleString('en-IN')}
          subtitle="Items needing attention"
          to="/inventory"
        />
      </section>

      <div className="ds-grid">
        <div>
          <section className="ds-panel">
            <div className="ds-panel-head">
              <div>
                <h2 className="ds-panel-title">Sales Trend</h2>
                <p className="ds-panel-subtitle">
                  Recorded sales over the last 7 days
                </p>
              </div>
              <Link to="/reports" className="ds-link">
                Reports <ArrowRight size={15} />
              </Link>
            </div>

            {chart.length > 0 ? (
              <div className="ds-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chart}
                    margin={{ top: 8, right: 18, bottom: 4, left: 8 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e8edf3"
                    />
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      width={65}
                      tickFormatter={(value) =>
                        value >= 1000
                          ? `₹${(value / 1000).toFixed(1)}k`
                          : `₹${value}`
                      }
                    />
                    <Tooltip
                      formatter={(value) => [currency(value), 'Sales']}
                    />
                    <Line
                      type="monotone"
                      dataKey="sales"
                      name="Sales"
                      stroke="#4f46e5"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: '#4f46e5', strokeWidth: 0 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="ds-empty">
                <Activity size={27} style={{ marginBottom: 8 }} />
                <div>No sales trend data returned by the API.</div>
              </div>
            )}
          </section>

          <section className="ds-panel">
            <div className="ds-panel-head">
              <div>
                <h2 className="ds-panel-title">Recent Invoices</h2>
                <p className="ds-panel-subtitle">Your latest recorded bills</p>
              </div>
              <Link to="/billing" className="ds-link">
                Billing <ArrowRight size={15} />
              </Link>
            </div>

            <div className="ds-table-wrap">
              <table className="ds-table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.length > 0 ? (
                    invoices.map((invoice, index) => {
                      const status = paymentStatus(invoice);

                      return (
                        <tr key={invoiceId(invoice) ?? `invoice-${index}`}>
                          <td className="ds-primary">
                            #{invoiceNumber(invoice)}
                          </td>
                          <td>{customerName(invoice)}</td>
                          <td>
                            <div>{formatDate(invoiceDate(invoice))}</div>
                            <div className="ds-secondary">
                              {formatTime(invoiceDate(invoice))}
                            </div>
                          </td>
                          <td className="ds-primary">
                            {currency(invoiceAmount(invoice))}
                          </td>
                          <td>
                            <span
                              className={`ds-status ${
                                status === 'Paid'
                                  ? 'ds-paid'
                                  : status === 'Pending'
                                  ? 'ds-pending'
                                  : ''
                              }`}
                            >
                              {status}
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="ds-delete"
                              title="Delete invoice"
                              aria-label={`Delete invoice ${invoiceNumber(invoice)}`}
                              onClick={() => handleDeleteInvoice(invoice)}
                            >
                              <X size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="ds-empty">
                        No invoices found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <aside>
          <section className="ds-panel">
            <div className="ds-panel-head">
              <div>
                <h2 className="ds-panel-title">Pending Udhar</h2>
                <p className="ds-panel-subtitle">
                  Customers with outstanding balances
                </p>
              </div>
              <Link to="/khata" className="ds-link">
                Khata <ArrowRight size={15} />
              </Link>
            </div>

            {customers.length > 0 ? (
              <div className="ds-list">
                {customers.map((customer, index) => (
                  <div
                    className="ds-list-item"
                    key={customer?._id ?? customer?.id ?? index}
                  >
                    <div className="ds-list-main">
                      <div className="ds-list-name">
                        {customer?.name ??
                          customer?.fullName ??
                          customer?.customerName ??
                          'Unnamed customer'}
                      </div>
                      <div className="ds-list-detail">
                        Outstanding balance
                      </div>
                    </div>
                    <div className="ds-list-amount">
                      {currency(customerBalance(customer))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="ds-empty">No pending customer balances.</div>
            )}
          </section>

          <section className="ds-panel">
            <div className="ds-panel-head">
              <div>
                <h2 className="ds-panel-title">Low Stock Alerts</h2>
                <p className="ds-panel-subtitle">
                  Inventory needing attention
                </p>
              </div>
              <Link to="/inventory" className="ds-link">
                Inventory <ArrowRight size={15} />
              </Link>
            </div>

            {lowStock.length > 0 ? (
              <div className="ds-list">
                {lowStock.slice(0, 6).map((item, index) => (
                  <div
                    className="ds-list-item"
                    key={item?._id ?? item?.id ?? index}
                  >
                    <span className="ds-warning-icon">
                      <Boxes size={17} />
                    </span>
                    <div className="ds-list-main">
                      <div className="ds-list-name">
                        {item?.name ??
                          item?.productName ??
                          item?.title ??
                          'Inventory item'}
                      </div>
                      <div className="ds-list-detail">
                        {item?.category ?? 'Stock alert'}
                      </div>
                    </div>
                    <div className="ds-list-amount">
                      {stockQuantity(item)} left
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="ds-empty">No low-stock alerts.</div>
            )}
          </section>

          <section className="ds-panel">
            <div className="ds-panel-head">
              <h2 className="ds-panel-title">Quick Actions</h2>
            </div>

            <div className="ds-list">
              <Link to="/billing" className="ds-list-item">
                <div className="ds-list-main">
                  <div className="ds-list-name">Create a bill</div>
                  <div className="ds-list-detail">Record a new sale</div>
                </div>
                <ShoppingBag size={19} />
              </Link>

              <Link to="/khata" className="ds-list-item">
                <div className="ds-list-main">
                  <div className="ds-list-name">Manage Digital Khata</div>
                  <div className="ds-list-detail">
                    Check customer balances
                  </div>
                </div>
                <Wallet size={19} />
              </Link>

              <Link to="/reports" className="ds-list-item">
                <div className="ds-list-main">
                  <div className="ds-list-name">View reports</div>
                  <div className="ds-list-detail">Review shop sales</div>
                </div>
                <ArrowRight size={19} />
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
