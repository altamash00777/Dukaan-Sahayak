// import React, { useState, useEffect, useCallback } from 'react';
// import {
//   BookOpen,
//   Search,
//   IndianRupee,
//   MessageCircle,
//   PlusCircle,
//   CheckCircle,
//   Clock,
//   Phone,
//   AlertCircle,
//   Plus,
//   Trash2,
//   UserPlus,
// } from 'lucide-react';
// import Modal from '../components/Modal';
// import Alert from '../components/Alert';
// import LoadingSpinner from '../components/LoadingSpinner';
// import { customers as customersApi, payments as paymentsApi } from '../services/api';

// // ── Sample fallback data shown if backend has no customers ────────────
// const SAMPLE_KHATA_CUSTOMERS = [
//   { _id: 'c1', name: 'Rajesh Gupta',             phone: '9812345678', balance: 4500, address: 'Near Old Bus Stand' },
//   { _id: 'c2', name: 'Vikas Tiwari',             phone: '9898765432', balance: 2150, address: 'Shop No 14, Ward 2' },
//   { _id: 'c3', name: 'Sanjay Kumar Masterji',    phone: '9845012345', balance: 1800, address: 'Govt School Road' },
//   { _id: 'c4', name: 'Manoj Tailor',             phone: '9822334455', balance: 950,  address: 'Tailor Gali' },
//   { _id: 'c5', name: 'Anita Devi (Panchayat)',   phone: '9811223344', balance: 650,  address: 'Block Colony' },
// ];

// const Khata = () => {
//   const [customersList,      setCustomersList]      = useState([]);
//   const [loading,            setLoading]            = useState(true);
//   const [searchQuery,        setSearchQuery]        = useState('');
//   const [selectedCustomerId, setSelectedCustomerId] = useState(null);
//   const [ledgerEntries,      setLedgerEntries]      = useState([]);
//   const [ledgerLoading,      setLedgerLoading]      = useState(false);
//   const [alert,              setAlert]              = useState({ type: '', message: '' });

//   // Payment Modal
//   const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
//   const [paymentAmount,      setPaymentAmount]      = useState('');
//   const [paymentMode,        setPaymentMode]        = useState('cash');

//   // ── Quick Add to Khata form (for demo / judges) ───────────────────
//   const [quickName,   setQuickName]   = useState('');
//   const [quickAmount, setQuickAmount] = useState('');
//   const [quickPhone,  setQuickPhone]  = useState('');
//   const [addingQuick, setAddingQuick] = useState(false);

//   // ── Fetch customers ───────────────────────────────────────────────
//   const fetchKhataCustomers = useCallback(async () => {
//     setLoading(true);
//     try {
//       const res  = await customersApi.getAll();
//       const data = res.data?.data || res.data?.customers || res.data || [];
//       if (Array.isArray(data) && data.length > 0) {
//         // Normalise balance field (API uses outstandingBalance)
//         const normalised = data.map((c) => ({
//           ...c,
//           balance: Number(c.outstandingBalance || c.balance || 0),
//         }));
//         setCustomersList(normalised);
//         const firstDebtor = normalised.find((c) => c.balance > 0) || normalised[0];
//         if (firstDebtor) setSelectedCustomerId(firstDebtor._id || firstDebtor.id);
//       } else {
//         setCustomersList(SAMPLE_KHATA_CUSTOMERS);
//         setSelectedCustomerId(SAMPLE_KHATA_CUSTOMERS[0]._id);
//       }
//     } catch {
//       setCustomersList(SAMPLE_KHATA_CUSTOMERS);
//       setSelectedCustomerId(SAMPLE_KHATA_CUSTOMERS[0]._id);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => { fetchKhataCustomers(); }, [fetchKhataCustomers]);

//   const selectedCustomer = customersList.find(
//     (c) => (c._id || c.id) === selectedCustomerId
//   );

//   // ── Fetch ledger for selected customer ────────────────────────────
//   const fetchLedger = useCallback(async (customerId) => {
//     if (!customerId) return;
//     setLedgerLoading(true);
//     try {
//       const res     = await customersApi.getLedger(customerId);
//       const entries = res.data?.data?.ledger || res.data?.ledger || res.data?.transactions || res.data || [];
//       if (Array.isArray(entries) && entries.length > 0) {
//         setLedgerEntries(entries);
//       } else {
//         throw new Error('empty');
//       }
//     } catch {
//       // Fallback sample ledger
//       const target = customersList.find((c) => (c._id || c.id) === customerId);
//       const curBal = target ? (target.balance || 2000) : 2000;
//       setLedgerEntries([
//         { _id: 'l1', date: '14/10/2026', title: 'Credit Sale: Basmati Rice & Mustard Oil', debit: 1200, credit: 0,    balance: curBal },
//         { _id: 'l2', date: '08/10/2026', title: 'Cash Payment Jama',                        debit: 0,    credit: 1500, balance: curBal - 1200 },
//         { _id: 'l3', date: '01/10/2026', title: 'Monthly Ration Bill (INV-1045)',            debit: curBal - 1200 + 1500, credit: 0, balance: curBal - 1200 + 1500 },
//       ]);
//     } finally {
//       setLedgerLoading(false);
//     }
//   }, [customersList]);

//   useEffect(() => {
//     if (selectedCustomerId) fetchLedger(selectedCustomerId);
//   }, [selectedCustomerId, fetchLedger]);

//   // ── Totals ────────────────────────────────────────────────────────
//   const totalOutstanding = customersList.reduce(
//     (sum, c) => sum + Math.max(0, Number(c.balance || 0)), 0
//   );
//   const debtorCount = customersList.filter((c) => (c.balance || 0) > 0).length;

//   const filteredCustomers = customersList.filter((c) => {
//     const q = searchQuery.toLowerCase();
//     return c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q));
//   });

//   // ── Quick Add handler ─────────────────────────────────────────────
//   const handleQuickAdd = (e) => {
//     e.preventDefault();
//     if (!quickName.trim() || !quickAmount) return;
//     const newEntry = {
//       _id:     'demo-' + Date.now(),
//       name:    quickName.trim(),
//       phone:   quickPhone.trim() || '—',
//       balance: parseFloat(quickAmount) || 0,
//       address: 'Manual entry',
//       isDemo:  true,
//     };
//     setCustomersList((prev) => [newEntry, ...prev]);
//     setSelectedCustomerId(newEntry._id);
//     setQuickName('');
//     setQuickAmount('');
//     setQuickPhone('');
//     setAddingQuick(false);
//     setAlert({ type: 'success', message: `✅ "${newEntry.name}" added to Khata — ₹${newEntry.balance} pending!` });
//   };

//   // ── Delete quick-add entry ────────────────────────────────────────
//   const handleDeleteEntry = (id) => {
//     setCustomersList((prev) => prev.filter((c) => (c._id || c.id) !== id));
//     if (selectedCustomerId === id) setSelectedCustomerId(null);
//   };

//   // ── Record Payment ────────────────────────────────────────────────
//   const handleRecordPayment = async (e) => {
//     e.preventDefault();
//     const amt = Number(paymentAmount);
//     if (!amt || amt <= 0 || !selectedCustomer) return;

//     try {
//       // Try real API (may fail for demo entries — that's fine)
//       try {
//         await paymentsApi.record({
//           customerId: selectedCustomer._id || selectedCustomer.id,
//           amount: amt,
//           paymentMode,
//         });
//       } catch { /* ignore for demo entries */ }

//       const newBal = Math.max(0, (selectedCustomer.balance || 0) - amt);
//       setCustomersList((prev) =>
//         prev.map((c) =>
//           (c._id || c.id) === (selectedCustomer._id || selectedCustomer.id)
//             ? { ...c, balance: newBal }
//             : c
//         )
//       );
//       setLedgerEntries((prev) => [
//         {
//           _id:     'pay_' + Date.now(),
//           date:    new Date().toLocaleDateString('en-IN'),
//           title:   `Jama received (${paymentMode.toUpperCase()})`,
//           debit:   0,
//           credit:  amt,
//           balance: newBal,
//         },
//         ...prev,
//       ]);
//       setIsPaymentModalOpen(false);
//       setPaymentAmount('');
//       setAlert({ type: 'success', message: `₹${amt} payment recorded for ${selectedCustomer.name}!` });
//     } catch (err) {
//       console.error('Payment error:', err);
//     }
//   };

//   // ── WhatsApp Reminder ─────────────────────────────────────────────
//   const handleSendReminder = (cust) => {
//     const c    = cust || selectedCustomer;
//     if (!c) return;
//     const text = `Namaste ${c.name} ji, aapki dukaan ka hisaab-kitaab baki hai: ₹${c.balance}. Kripya jald se jald jama karwayein. Dhanyawad! 🙏`;
//     window.open(`https://wa.me/91${c.phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
//     setAlert({ type: 'success', message: `WhatsApp reminder sent to ${c.name}!` });
//   };

//   // ─────────────────────────────────────────────────────────────────
//   return (
//     <div>
//       {/* Page Header */}
//       <div className="page-header">
//         <div>
//           <h1 className="page-title">Digital Khata / उधार खाता</h1>
//           <p className="page-subtitle">Zero paper loss: track customer credit, record jama, and send auto reminders</p>
//         </div>
//         <button
//           type="button"
//           className="btn btn-primary"
//           onClick={() => setAddingQuick((v) => !v)}
//         >
//           <UserPlus size={16} /> Add to Khata
//         </button>
//       </div>

//       {alert.message && (
//         <Alert type={alert.type} message={alert.message} onClose={() => setAlert({ type: '', message: '' })} />
//       )}

//       {/* ── Quick Add Form ──────────────────────────────────────────── */}
//       {addingQuick && (
//         <div style={{
//           background: '#fffbeb',
//           border: '2px solid #fbbf24',
//           borderRadius: 'var(--radius)',
//           padding: '1.25rem 1.5rem',
//           marginBottom: '1.5rem',
//           animation: 'fadeIn 0.2s ease',
//         }}>
//           <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
//             <UserPlus size={18} color="#d97706" />
//             <span style={{ fontWeight: 700, fontSize: '1rem', color: '#92400e' }}>
//               Khata Mein Jodon / Add Customer to Ledger
//             </span>
//             <span style={{
//               marginLeft: 'auto', fontSize: '0.72rem', background: '#fef3c7',
//               color: '#92400e', padding: '2px 8px', borderRadius: 99, fontWeight: 600,
//             }}>
//               Demo / Judge View
//             </span>
//           </div>

//           <form onSubmit={handleQuickAdd}>
//             <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1.2fr auto', gap: '0.75rem', alignItems: 'end' }}>

//               {/* Customer Name */}
//               <div>
//                 <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#92400e', display: 'block', marginBottom: 4 }}>
//                   Customer Name / ग्राहक का नाम *
//                 </label>
//                 <input
//                   type="text"
//                   className="form-input"
//                   placeholder="e.g. Ramesh Yadav"
//                   value={quickName}
//                   onChange={(e) => setQuickName(e.target.value)}
//                   required
//                   autoFocus
//                   style={{ border: '1px solid #fbbf24' }}
//                 />
//               </div>

//               {/* Amount Pending */}
//               <div>
//                 <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#92400e', display: 'block', marginBottom: 4 }}>
//                   Udhar Baaki (₹) / Amount Pending *
//                 </label>
//                 <input
//                   type="number"
//                   className="form-input"
//                   placeholder="e.g. 1500"
//                   value={quickAmount}
//                   onChange={(e) => setQuickAmount(e.target.value)}
//                   required
//                   min="1"
//                   style={{ border: '1px solid #fbbf24' }}
//                 />
//               </div>

//               {/* Phone (optional) */}
//               <div>
//                 <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#92400e', display: 'block', marginBottom: 4 }}>
//                   Phone (Optional)
//                 </label>
//                 <input
//                   type="tel"
//                   className="form-input"
//                   placeholder="e.g. 9876543210"
//                   value={quickPhone}
//                   onChange={(e) => setQuickPhone(e.target.value)}
//                   maxLength={10}
//                   style={{ border: '1px solid #fbbf24' }}
//                 />
//               </div>

//               {/* Submit */}
//               <div style={{ display: 'flex', gap: '0.5rem' }}>
//                 <button
//                   type="submit"
//                   className="btn btn-primary"
//                   disabled={!quickName.trim() || !quickAmount}
//                   style={{ whiteSpace: 'nowrap' }}
//                 >
//                   <Plus size={15} /> Add
//                 </button>
//                 <button
//                   type="button"
//                   className="btn btn-outline"
//                   onClick={() => { setAddingQuick(false); setQuickName(''); setQuickAmount(''); setQuickPhone(''); }}
//                 >
//                   Cancel
//                 </button>
//               </div>
//             </div>

//             <div style={{ marginTop: '0.6rem', fontSize: '0.75rem', color: '#92400e', opacity: 0.8 }}>
//               💡 This entry is added instantly for demo. For permanent records, use the Customers page or create a sale with Udhar payment mode.
//             </div>
//           </form>
//         </div>
//       )}

//       {/* ── Summary Banner ──────────────────────────────────────────── */}
//       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
//         <div style={{
//           background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
//           color: '#fff', borderRadius: 'var(--radius)', padding: '1.25rem', boxShadow: 'var(--shadow)',
//         }}>
//           <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Total Market Udhar / कुल बकाया</div>
//           <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.25rem' }}>
//             ₹{totalOutstanding.toLocaleString('en-IN')}
//           </div>
//           <div style={{ fontSize: '0.75rem', opacity: 0.85, marginTop: '0.25rem' }}>
//             Across {debtorCount} active customers
//           </div>
//         </div>

//         <div style={{
//           background: '#ffffff', border: '1px solid var(--border)',
//           borderRadius: 'var(--radius)', padding: '1.25rem', boxShadow: 'var(--shadow)',
//         }}>
//           <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Customers with Udhar</div>
//           <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
//             {debtorCount}
//           </div>
//           <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.25rem', fontWeight: 600 }}>
//             Active Khata Accounts
//           </div>
//         </div>

//         <div style={{
//           background: '#ffffff', border: '1px solid var(--border)',
//           borderRadius: 'var(--radius)', padding: '1.25rem', boxShadow: 'var(--shadow)',
//           display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 8,
//         }}>
//           <button
//             type="button"
//             className="btn btn-primary"
//             style={{ width: '100%', justifyContent: 'center' }}
//             onClick={() => setAddingQuick(true)}
//           >
//             <UserPlus size={15} /> Add Customer to Khata
//           </button>
//           <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center' }}>
//             Quick add for demo / instant entry
//           </div>
//         </div>
//       </div>

//       {/* ── Main Split Layout ───────────────────────────────────────── */}
//       <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '1.5rem', alignItems: 'start' }}>

//         {/* LEFT: Customer List */}
//         <div className="card" style={{ height: '700px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
//           {/* Search */}
//           <div className="card-header" style={{ padding: '0.85rem 1rem' }}>
//             <div style={{ position: 'relative', width: '100%' }}>
//               <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
//               <input
//                 type="text"
//                 className="form-input"
//                 style={{ paddingLeft: '2.2rem', fontSize: '0.85rem' }}
//                 placeholder="Search khata..."
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//               />
//             </div>
//           </div>

//           {/* List */}
//           <div style={{ flex: 1, overflowY: 'auto' }}>
//             {loading ? (
//               <LoadingSpinner message="Loading khata accounts..." />
//             ) : filteredCustomers.length === 0 ? (
//               <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
//                 No khata customers found.
//                 <br />
//                 <button type="button" className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => setAddingQuick(true)}>
//                   <Plus size={13} /> Add First Entry
//                 </button>
//               </div>
//             ) : (
//               filteredCustomers.map((cust) => {
//                 const isSelected = (cust._id || cust.id) === selectedCustomerId;
//                 const bal        = Number(cust.balance || 0);

//                 return (
//                   <div
//                     key={cust._id || cust.id}
//                     onClick={() => setSelectedCustomerId(cust._id || cust.id)}
//                     style={{
//                       padding: '0.85rem 1rem',
//                       borderBottom: '1px solid var(--border)',
//                       cursor: 'pointer',
//                       backgroundColor: isSelected ? 'var(--primary-light)' : '#ffffff',
//                       borderLeft: isSelected ? '4px solid var(--primary)' : '4px solid transparent',
//                       transition: 'var(--transition)',
//                       display: 'flex',
//                       justifyContent: 'space-between',
//                       alignItems: 'center',
//                     }}
//                   >
//                     <div style={{ flex: 1, minWidth: 0 }}>
//                       <div style={{ fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 6 }}>
//                         {cust.name}
//                         {cust.isDemo && (
//                           <span style={{ fontSize: '0.6rem', background: '#fef3c7', color: '#92400e', padding: '1px 5px', borderRadius: 99, fontWeight: 700 }}>
//                             Demo
//                           </span>
//                         )}
//                       </div>
//                       <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
//                         {cust.phone !== '—' ? cust.phone : 'No phone'}
//                       </div>
//                     </div>
//                     <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 8 }}>
//                       <div>
//                         <div style={{ fontWeight: 700, fontSize: '0.95rem', color: bal > 0 ? 'var(--danger)' : 'var(--success)' }}>
//                           ₹{bal.toLocaleString('en-IN')}
//                         </div>
//                         <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
//                           {bal > 0 ? 'Udhar Baaki' : 'Cleared'}
//                         </div>
//                       </div>
//                       {/* Delete button for demo entries */}
//                       {cust.isDemo && (
//                         <button
//                           type="button"
//                           style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}
//                           title="Remove entry"
//                           onClick={(e) => { e.stopPropagation(); handleDeleteEntry(cust._id || cust.id); }}
//                         >
//                           <Trash2 size={14} />
//                         </button>
//                       )}
//                     </div>
//                   </div>
//                 );
//               })
//             )}
//           </div>
//         </div>

//         {/* RIGHT: Ledger Detail */}
//         <div className="card" style={{ minHeight: '700px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
//           {selectedCustomer ? (
//             <>
//               {/* Customer Banner */}
//               <div style={{
//                 padding: '1.5rem', borderBottom: '1px solid var(--border)',
//                 backgroundColor: '#fafbfc', display: 'flex',
//                 justifyContent: 'space-between', alignItems: 'center',
//                 flexWrap: 'wrap', gap: '1rem',
//               }}>
//                 <div>
//                   <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
//                     <h2 style={{ fontSize: '1.4rem', margin: 0 }}>{selectedCustomer.name}</h2>
//                     {selectedCustomer.isDemo && (
//                       <span style={{ fontSize: '0.7rem', background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: 99, fontWeight: 700 }}>
//                         Demo Entry
//                       </span>
//                     )}
//                   </div>
//                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.3rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
//                     <Phone size={14} />
//                     <span>{selectedCustomer.phone}</span>
//                     {selectedCustomer.address && selectedCustomer.address !== 'Manual entry' && (
//                       <span>• {selectedCustomer.address}</span>
//                     )}
//                   </div>
//                 </div>

//                 <div style={{ textAlign: 'right' }}>
//                   <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
//                     Total Udhar Due / बाकी रकम
//                   </div>
//                   <div style={{
//                     fontSize: '2rem', fontWeight: 800,
//                     color: (selectedCustomer.balance || 0) > 0 ? 'var(--danger)' : 'var(--success)',
//                   }}>
//                     ₹{Number(selectedCustomer.balance || 0).toLocaleString('en-IN')}
//                   </div>
//                 </div>
//               </div>

//               {/* Action Buttons */}
//               <div style={{
//                 padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)',
//                 display: 'flex', gap: '0.75rem', backgroundColor: '#ffffff', flexWrap: 'wrap',
//               }}>
//                 <button type="button" className="btn btn-success" onClick={() => setIsPaymentModalOpen(true)}>
//                   <IndianRupee size={16} /> Record Payment (जमा मिला)
//                 </button>
//                 <button type="button" className="btn btn-secondary" onClick={() => handleSendReminder(selectedCustomer)}>
//                   <MessageCircle size={16} /> Send WhatsApp Reminder
//                 </button>
//               </div>

//               {/* Ledger Table */}
//               <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
//                 <h4 style={{ marginBottom: '1rem', fontSize: '1rem', color: 'var(--text-primary)' }}>
//                   Khata Statement / हिसाब पर्ची
//                 </h4>
//                 {ledgerLoading ? (
//                   <LoadingSpinner message="Loading statement..." />
//                 ) : (
//                   <div className="table-container" style={{ border: '1px solid var(--border)' }}>
//                     <table>
//                       <thead>
//                         <tr>
//                           <th>Date</th>
//                           <th>Details / विवरण</th>
//                           <th style={{ textAlign: 'right', color: 'var(--danger)' }}>Udhar Diya (-)</th>
//                           <th style={{ textAlign: 'right', color: 'var(--success)' }}>Jama Paya (+)</th>
//                           <th style={{ textAlign: 'right' }}>Net Balance</th>
//                         </tr>
//                       </thead>
//                       <tbody>
//                         {selectedCustomer.isDemo ? (
//                           // For demo entries, show a simple single-row ledger
//                           <tr>
//                             <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
//                               {new Date().toLocaleDateString('en-IN')}
//                             </td>
//                             <td style={{ fontWeight: 500 }}>Udhar Balance (Manual Entry)</td>
//                             <td style={{ textAlign: 'right', color: 'var(--danger)', fontWeight: 700 }}>
//                               ₹{selectedCustomer.balance}
//                             </td>
//                             <td style={{ textAlign: 'right' }}>-</td>
//                             <td style={{ textAlign: 'right', fontWeight: 700 }}>
//                               ₹{selectedCustomer.balance}
//                             </td>
//                           </tr>
//                         ) : (
//                           ledgerEntries.map((row, idx) => (
//                             <tr key={row._id || idx}>
//                               <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{row.date}</td>
//                               <td style={{ fontWeight: 500 }}>{row.title || row.description}</td>
//                               <td style={{ textAlign: 'right', color: row.debit > 0 ? 'var(--danger)' : 'inherit', fontWeight: row.debit > 0 ? 700 : 400 }}>
//                                 {row.debit > 0 ? `₹${row.debit}` : '-'}
//                               </td>
//                               <td style={{ textAlign: 'right', color: row.credit > 0 ? 'var(--success)' : 'inherit', fontWeight: row.credit > 0 ? 700 : 400 }}>
//                                 {row.credit > 0 ? `₹${row.credit}` : '-'}
//                               </td>
//                               <td style={{ textAlign: 'right', fontWeight: 700 }}>₹{row.balance}</td>
//                             </tr>
//                           ))
//                         )}
//                       </tbody>
//                     </table>
//                   </div>
//                 )}
//               </div>
//             </>
//           ) : (
//             <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem' }}>
//               <BookOpen size={40} color="var(--text-muted)" style={{ marginBottom: 12 }} />
//               <div style={{ fontWeight: 600, marginBottom: 8 }}>Select a customer to view their khata</div>
//               <button type="button" className="btn btn-primary btn-sm" onClick={() => setAddingQuick(true)}>
//                 <UserPlus size={13} /> Add First Khata Entry
//               </button>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* ── Record Payment Modal ────────────────────────────────────── */}
//       <Modal
//         isOpen={isPaymentModalOpen}
//         onClose={() => setIsPaymentModalOpen(false)}
//         title={`Payment from ${selectedCustomer?.name || ''}`}
//         size="sm"
//       >
//         <form onSubmit={handleRecordPayment}>
//           <div className="form-group">
//             <label className="form-label">Payment Amount / रकम (₹) *</label>
//             <input
//               type="number" min="1"
//               max={selectedCustomer?.balance || 999999}
//               className="form-input"
//               value={paymentAmount}
//               onChange={(e) => setPaymentAmount(e.target.value)}
//               placeholder="e.g. 1000"
//               required
//             />
//           </div>
//           <div className="form-group">
//             <label className="form-label">Payment Mode / माध्यम</label>
//             <select className="form-select" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
//               <option value="cash">Cash (नगद)</option>
//               <option value="upi">UPI / QR Code</option>
//               <option value="bank">Bank Transfer</option>
//             </select>
//           </div>
//           <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
//             <button type="button" className="btn btn-outline" onClick={() => setIsPaymentModalOpen(false)}>Cancel</button>
//             <button type="submit" className="btn btn-success">✅ Confirm Jama (दर्ज करें)</button>
//           </div>
//         </form>
//       </Modal>
//     </div>
//   );
// };

// export default Khata;
import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  Search,
  IndianRupee,
  MessageCircle,
  CheckCircle,
  Phone,
  Plus,
  UserPlus,
  RefreshCw,
} from 'lucide-react';

import Modal from '../components/Modal';
import Alert from '../components/Alert';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  customers as customersApi,
  payments as paymentsApi,
} from '../services/api';

const formatMoney = (amount) =>
  `₹${Number(amount || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  })}`;

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  fallback;

const getCustomerId = (customer) => customer?._id || customer?.id;

const getCustomerBalance = (customer) =>
  Number(customer?.outstandingBalance ?? customer?.balance ?? 0);

const getListFromResponse = (res) => {
  const data = res?.data?.data ?? res?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.customers)) return data.customers;
  if (Array.isArray(data?.results)) return data.results;

  return [];
};

const getLedgerFromResponse = (res) => {
  const data = res?.data?.data ?? res?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.ledger)) return data.ledger;
  if (Array.isArray(data?.transactions)) return data.transactions;
  if (Array.isArray(data?.entries)) return data.entries;

  return [];
};

const getEntryAmount = (entry, type) => {
  if (type === 'debit') {
    return Number(
      entry?.debit ??
      entry?.udharAmount ??
      entry?.creditSaleAmount ??
      0
    );
  }

  return Number(
    entry?.credit ??
    entry?.paymentAmount ??
    entry?.jamaAmount ??
    0
  );
};

const formatDate = (value) => {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString('en-IN');
};

const Khata = () => {
  const [customersList, setCustomersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerError, setLedgerError] = useState('');
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Add Customer form
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [addingCustomer, setAddingCustomer] = useState(false);

  // Payment modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('cash');
  const [recordingPayment, setRecordingPayment] = useState(false);

  const selectedCustomer = customersList.find(
    (customer) =>
      String(getCustomerId(customer)) === String(selectedCustomerId)
  );

  // Fetch real customers from the backend.
  const fetchKhataCustomers = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const res = await customersApi.getAll();
      const customers = getListFromResponse(res);

      setCustomersList(customers);

      setSelectedCustomerId((currentId) => {
        const stillExists = customers.some(
          (customer) =>
            String(getCustomerId(customer)) === String(currentId)
        );

        if (stillExists) return currentId;

        const firstCustomer = customers[0];
        return firstCustomer ? getCustomerId(firstCustomer) : null;
      });

      setAlert((current) =>
        current.type === 'error'
          ? { type: '', message: '' }
          : current
      );
    } catch (error) {
      setAlert({
        type: 'error',
        message: getErrorMessage(
          error,
          'Could not load customers. Please check your connection and try again.'
        ),
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchKhataCustomers();
  }, [fetchKhataCustomers]);

  // Fetch the selected customer's actual ledger.
  const fetchLedger = useCallback(async (customerId) => {
    if (!customerId) {
      setLedgerEntries([]);
      setLedgerError('');
      setLedgerLoading(false);
      return;
    }

    setLedgerLoading(true);
    setLedgerError('');

    try {
      const res = await customersApi.getLedger(customerId);
      const entries = getLedgerFromResponse(res);

      setLedgerEntries(entries);
    } catch (error) {
      setLedgerEntries([]);
      setLedgerError(
        getErrorMessage(
          error,
          'Could not load this customer’s ledger.'
        )
      );
    } finally {
      setLedgerLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLedger(selectedCustomerId);
  }, [selectedCustomerId, fetchLedger]);

  // Summary is calculated from actual customer records.
  const totalOutstanding = customersList.reduce(
    (sum, customer) =>
      sum + Math.max(0, getCustomerBalance(customer)),
    0
  );

  const debtorCount = customersList.filter(
    (customer) => getCustomerBalance(customer) > 0
  ).length;

  const filteredCustomers = customersList.filter((customer) => {
    const query = searchQuery.trim().toLowerCase();

    return (
      String(customer.name || '').toLowerCase().includes(query) ||
      String(customer.phone || '').includes(query)
    );
  });

  // Register a real customer through the backend.
  // A customer can be added without having a bill or outstanding balance.
  const handleAddCustomer = async (event) => {
    event.preventDefault();

    const name = customerName.trim();
    const phone = customerPhone.trim();
    const address = customerAddress.trim();

    if (!name) {
      setAlert({
        type: 'error',
        message: 'Please enter the customer name.',
      });
      return;
    }

    if (phone && !/^[0-9+\-\s()]{7,16}$/.test(phone)) {
      setAlert({
        type: 'error',
        message: 'Please enter a valid phone number.',
      });
      return;
    }

    setAddingCustomer(true);

    try {
      const payload = {
        name,
        phone,
        address,
      };

      const res = await customersApi.create(payload);
      const created =
        res?.data?.data?.customer ??
        res?.data?.customer ??
        res?.data?.data;

      await fetchKhataCustomers(true);

      if (created && getCustomerId(created)) {
        setSelectedCustomerId(getCustomerId(created));
      } else if (created?._id || created?.id) {
        setSelectedCustomerId(getCustomerId(created));
      }

      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
      setShowCustomerForm(false);

      setAlert({
        type: 'success',
        message: `${name} was saved successfully.`,
      });
    } catch (error) {
      setAlert({
        type: 'error',
        message: getErrorMessage(
          error,
          'Customer could not be saved. Please try again.'
        ),
      });
    } finally {
      setAddingCustomer(false);
    }
  };

  // Record a payment only through the backend.
  // Refresh the customer and ledger after the API confirms success.
  const handleRecordPayment = async (event) => {
    event.preventDefault();

    if (!selectedCustomer) return;

    const amount = Number(paymentAmount);
    const currentBalance = getCustomerBalance(selectedCustomer);

    if (!Number.isFinite(amount) || amount <= 0) {
      setAlert({
        type: 'error',
        message: 'Enter a valid payment amount greater than zero.',
      });
      return;
    }

    if (amount > currentBalance) {
      setAlert({
        type: 'error',
        message: `The payment cannot exceed the outstanding balance of ${formatMoney(currentBalance)}.`,
      });
      return;
    }

    setRecordingPayment(true);

    try {
      await paymentsApi.record({
        customerId: getCustomerId(selectedCustomer),
        amount,
        paymentMode,
      });

      setIsPaymentModalOpen(false);
      setPaymentAmount('');

      await fetchKhataCustomers(true);
      await fetchLedger(selectedCustomerId);

      setAlert({
        type: 'success',
        message: `Payment of ${formatMoney(amount)} was recorded for ${selectedCustomer.name}.`,
      });
    } catch (error) {
      setAlert({
        type: 'error',
        message: getErrorMessage(
          error,
          'Payment could not be recorded. Your displayed balance has not been changed locally.'
        ),
      });
    } finally {
      setRecordingPayment(false);
    }
  };

  const handleSendReminder = (customer) => {
    if (!customer) return;

    const phone = String(customer.phone || '').replace(/\D/g, '');

    if (!phone) {
      setAlert({
        type: 'error',
        message: 'This customer does not have a phone number.',
      });
      return;
    }

    const balance = getCustomerBalance(customer);

    if (balance <= 0) {
      setAlert({
        type: 'error',
        message: 'This customer has no outstanding balance.',
      });
      return;
    }

    const message =
      `Namaste ${customer.name} ji, aapki dukaan ka ` +
      `baki hisaab ${formatMoney(balance)} hai. ` +
      'Kripya suvidha ke anusaar jama karwayein. Dhanyawad!';

    const whatsappUrl =
      `https://wa.me/${phone.startsWith('91') ? phone : `91${phone}`}` +
      `?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Digital Khata / उधार खाता
          </h1>
          <p className="page-subtitle">
            Manage customers, credit bills, outstanding balances and payments.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => fetchKhataCustomers(true)}
            disabled={refreshing}
          >
            <RefreshCw size={16} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowCustomerForm((value) => !value)}
          >
            <UserPlus size={16} />
            Add Customer
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

      {/* Independent customer registration */}
      {showCustomerForm && (
        <div
          className="card"
          style={{ padding: '1.25rem', marginBottom: '1.5rem' }}
        >
          <h3 style={{ marginTop: 0, marginBottom: '0.35rem' }}>
            <UserPlus
              size={18}
              style={{ verticalAlign: 'middle', marginRight: 8 }}
            />
            Add Customer / ग्राहक जोड़ें
          </h3>

          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.85rem',
              marginBottom: '1rem',
            }}
          >
            Save a customer even if they have not purchased anything yet.
            Their outstanding balance will come from actual bills and payments.
          </p>

          <form onSubmit={handleAddCustomer}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
                gap: '1rem',
              }}
            >
              <div className="form-group">
                <label className="form-label">
                  Customer Name *
                </label>
                <input
                  className="form-input"
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder="Enter full name"
                  autoComplete="name"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Phone Number
                </label>
                <input
                  className="form-input"
                  type="tel"
                  value={customerPhone}
                  onChange={(event) => setCustomerPhone(event.target.value)}
                  placeholder="Enter phone number"
                  autoComplete="tel"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Address
                </label>
                <input
                  className="form-input"
                  value={customerAddress}
                  onChange={(event) => setCustomerAddress(event.target.value)}
                  placeholder="Optional address"
                  autoComplete="street-address"
                />
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                marginTop: '0.5rem',
              }}
            >
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setShowCustomerForm(false)}
                disabled={addingCustomer}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={addingCustomer || !customerName.trim()}
              >
                <Plus size={16} />
                {addingCustomer ? 'Saving...' : 'Save Customer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Live summary based on customer records */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: '#fff',
            borderRadius: 'var(--radius)',
            padding: '1.25rem',
            boxShadow: 'var(--shadow)',
          }}
        >
          <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>
            Total Outstanding / कुल बकाया
          </div>

          <div
            style={{
              fontSize: '1.8rem',
              fontWeight: 800,
              marginTop: '0.25rem',
            }}
          >
            {formatMoney(totalOutstanding)}
          </div>

          <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>
            Across {debtorCount} customers with pending balances
          </div>
        </div>

        <div
          className="card"
          style={{ padding: '1.25rem', boxShadow: 'var(--shadow)' }}
        >
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Total Customers
          </div>

          <div
            style={{
              fontSize: '1.8rem',
              fontWeight: 800,
              marginTop: '0.25rem',
            }}
          >
            {customersList.length}
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Saved customer records
          </div>
        </div>

        <div
          className="card"
          style={{ padding: '1.25rem', boxShadow: 'var(--shadow)' }}
        >
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Customers with Udhar
          </div>

          <div
            style={{
              fontSize: '1.8rem',
              fontWeight: 800,
              marginTop: '0.25rem',
            }}
          >
            {debtorCount}
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Customers with a positive balance
          </div>
        </div>
      </div>

      {/* Customer list and individual ledger */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 340px) minmax(0, 1fr)',
          gap: '1.5rem',
          alignItems: 'start',
        }}
      >
        <div
          className="card"
          style={{
            minHeight: '450px',
            maxHeight: '700px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div
            className="card-header"
            style={{ padding: '0.85rem 1rem' }}
          >
            <div style={{ position: 'relative', width: '100%' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-secondary)',
                }}
              />

              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.2rem', fontSize: '0.85rem' }}
                placeholder="Search by name or phone..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <LoadingSpinner message="Loading customers..." />
            ) : filteredCustomers.length === 0 ? (
              <div
                style={{
                  padding: '2rem 1rem',
                  textAlign: 'center',
                  color: 'var(--text-secondary)',
                }}
              >
                {customersList.length === 0
                  ? 'No customers have been saved yet.'
                  : 'No customers match your search.'}

                {customersList.length === 0 && (
                  <div>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      style={{ marginTop: 12 }}
                      onClick={() => setShowCustomerForm(true)}
                    >
                      <UserPlus size={14} />
                      Add First Customer
                    </button>
                  </div>
                )}
              </div>
            ) : (
              filteredCustomers.map((customer) => {
                const id = getCustomerId(customer);
                const balance = getCustomerBalance(customer);
                const isSelected =
                  String(id) === String(selectedCustomerId);

                return (
                  <button
                    type="button"
                    key={id}
                    onClick={() => setSelectedCustomerId(id)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '0.85rem 1rem',
                      border: 'none',
                      borderBottom: '1px solid var(--border)',
                      cursor: 'pointer',
                      backgroundColor: isSelected
                        ? 'var(--primary-light)'
                        : '#fff',
                      borderLeft: isSelected
                        ? '4px solid var(--primary)'
                        : '4px solid transparent',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: '0.92rem',
                          overflowWrap: 'anywhere',
                        }}
                      >
                        {customer.name || 'Unnamed customer'}
                      </div>

                      <div
                        style={{
                          fontSize: '0.78rem',
                          color: 'var(--text-secondary)',
                          marginTop: 3,
                        }}
                      >
                        {customer.phone || 'No phone number'}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: '0.92rem',
                          color:
                            balance > 0
                              ? 'var(--danger)'
                              : 'var(--success)',
                        }}
                      >
                        {formatMoney(balance)}
                      </div>

                      <div
                        style={{
                          fontSize: '0.7rem',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {balance > 0 ? 'Udhar Baaki' : 'No Due'}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div
          className="card"
          style={{
            minHeight: '450px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {!selectedCustomer ? (
            <div
              style={{
                margin: 'auto',
                textAlign: 'center',
                color: 'var(--text-secondary)',
                padding: '3rem 1.5rem',
              }}
            >
              <BookOpen
                size={40}
                color="var(--text-muted)"
                style={{ marginBottom: 12 }}
              />

              <div style={{ fontWeight: 600, marginBottom: 8 }}>
                Select a customer to view their khata
              </div>

              {!loading && customersList.length === 0 && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowCustomerForm(true)}
                >
                  <UserPlus size={14} />
                  Add Customer
                </button>
              )}
            </div>
          ) : (
            <>
              <div
                style={{
                  padding: '1.5rem',
                  borderBottom: '1px solid var(--border)',
                  backgroundColor: '#fafbfc',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div>
                  <h2 style={{ fontSize: '1.35rem', margin: 0 }}>
                    {selectedCustomer.name}
                  </h2>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginTop: '0.5rem',
                      color: 'var(--text-secondary)',
                      fontSize: '0.85rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    <Phone size={14} />
                    <span>{selectedCustomer.phone || 'No phone number'}</span>

                    {selectedCustomer.address && (
                      <span>• {selectedCustomer.address}</span>
                    )}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontSize: '0.78rem',
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                    }}
                  >
                    Outstanding Balance
                  </div>

                  <div
                    style={{
                      fontSize: '1.9rem',
                      fontWeight: 800,
                      color:
                        getCustomerBalance(selectedCustomer) > 0
                          ? 'var(--danger)'
                          : 'var(--success)',
                    }}
                  >
                    {formatMoney(getCustomerBalance(selectedCustomer))}
                  </div>
                </div>
              </div>

              <div
                style={{
                  padding: '1rem 1.5rem',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  gap: '0.75rem',
                  flexWrap: 'wrap',
                }}
              >
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={() => {
                    setPaymentAmount('');
                    setIsPaymentModalOpen(true);
                  }}
                  disabled={getCustomerBalance(selectedCustomer) <= 0}
                >
                  <IndianRupee size={16} />
                  Record Jama
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleSendReminder(selectedCustomer)}
                  disabled={getCustomerBalance(selectedCustomer) <= 0}
                >
                  <MessageCircle size={16} />
                  WhatsApp Reminder
                </button>

                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => fetchLedger(selectedCustomerId)}
                  disabled={ledgerLoading}
                >
                  <RefreshCw size={15} />
                  Refresh Ledger
                </button>
              </div>

              <div style={{ padding: '1.5rem', overflowX: 'auto' }}>
                <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1rem' }}>
                  Khata Statement / हिसाब-किताब
                </h3>

                {ledgerLoading ? (
                  <LoadingSpinner message="Loading ledger..." />
                ) : ledgerError ? (
                  <div
                    style={{
                      padding: '1rem',
                      color: 'var(--danger)',
                      background: '#fef2f2',
                      borderRadius: 'var(--radius)',
                    }}
                  >
                    {ledgerError}

                    <div>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        style={{ marginTop: 10 }}
                        onClick={() => fetchLedger(selectedCustomerId)}
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                ) : ledgerEntries.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '2.5rem 1rem',
                      color: 'var(--text-secondary)',
                      border: '1px dashed var(--border)',
                      borderRadius: 'var(--radius)',
                    }}
                  >
                    <BookOpen size={30} style={{ marginBottom: 10 }} />

                    <div style={{ fontWeight: 600 }}>
                      No ledger transactions yet
                    </div>

                    <p style={{ fontSize: '0.85rem', marginBottom: 0 }}>
                      Credit bills and confirmed payments will appear here
                      when they are saved by the backend.
                    </p>
                  </div>
                ) : (
                  <div
                    className="table-container"
                    style={{ border: '1px solid var(--border)' }}
                  >
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Details / विवरण</th>
                          <th style={{ textAlign: 'right' }}>
                            Udhar
                          </th>
                          <th style={{ textAlign: 'right' }}>
                            Jama
                          </th>
                          <th style={{ textAlign: 'right' }}>
                            Balance
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {ledgerEntries.map((entry, index) => {
                          const debit = getEntryAmount(entry, 'debit');
                          const credit = getEntryAmount(entry, 'credit');

                          const date =
                            entry.date ||
                            entry.createdAt ||
                            entry.transactionDate;

                          const title =
                            entry.title ||
                            entry.description ||
                            entry.notes ||
                            entry.invoiceNumber ||
                            entry.billNumber ||
                            'Transaction';

                          const balance =
                            entry.balance ??
                            entry.runningBalance ??
                            entry.outstandingBalance;

                          return (
                            <tr key={entry._id || entry.id || index}>
                              <td
                                style={{
                                  fontSize: '0.82rem',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {formatDate(date)}
                              </td>

                              <td style={{ fontWeight: 500 }}>
                                {title}
                              </td>

                              <td
                                style={{
                                  textAlign: 'right',
                                  color: debit > 0 ? 'var(--danger)' : 'inherit',
                                  fontWeight: debit > 0 ? 700 : 400,
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {debit > 0 ? formatMoney(debit) : '—'}
                              </td>

                              <td
                                style={{
                                  textAlign: 'right',
                                  color: credit > 0 ? 'var(--success)' : 'inherit',
                                  fontWeight: credit > 0 ? 700 : 400,
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {credit > 0 ? formatMoney(credit) : '—'}
                              </td>

                              <td
                                style={{
                                  textAlign: 'right',
                                  fontWeight: 700,
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {balance !== undefined && balance !== null
                                  ? formatMoney(balance)
                                  : '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Record payment modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          if (!recordingPayment) setIsPaymentModalOpen(false);
        }}
        title={`Payment from ${selectedCustomer?.name || ''}`}
        size="sm"
      >
        <form onSubmit={handleRecordPayment}>
          <div className="form-group">
            <label className="form-label">
              Payment Amount / जमा रकम (₹) *
            </label>

            <input
              type="number"
              min="0.01"
              step="0.01"
              max={getCustomerBalance(selectedCustomer)}
              className="form-input"
              value={paymentAmount}
              onChange={(event) => setPaymentAmount(event.target.value)}
              placeholder="Enter amount received"
              required
            />

            <div
              style={{
                marginTop: 6,
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
              }}
            >
              Outstanding: {formatMoney(getCustomerBalance(selectedCustomer))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Payment Mode / माध्यम
            </label>

            <select
              className="form-select"
              value={paymentMode}
              onChange={(event) => setPaymentMode(event.target.value)}
            >
              <option value="cash">Cash / नगद</option>
              <option value="upi">UPI</option>
              <option value="bank">Bank Transfer</option>
            </select>
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
              onClick={() => setIsPaymentModalOpen(false)}
              disabled={recordingPayment}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn btn-success"
              disabled={
                recordingPayment ||
                !paymentAmount ||
                Number(paymentAmount) <= 0
              }
            >
              <CheckCircle size={16} />
              {recordingPayment ? 'Recording...' : 'Confirm Jama'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Khata;