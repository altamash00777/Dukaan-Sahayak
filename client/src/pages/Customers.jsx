// import React, { useState, useEffect, useCallback } from 'react';
// import {
//   Users,
//   Search,
//   UserPlus,
//   Phone,
//   MessageCircle,
//   Eye,
//   IndianRupee,
// } from 'lucide-react';
// import Modal from '../components/Modal';
// import Alert from '../components/Alert';
// import LoadingSpinner from '../components/LoadingSpinner';
// import {
//   customers as customersApi,
//   payments as paymentsApi,
// } from '../services/api';

// const CUSTOMER_STORAGE_KEY = 'dukaan_sahayak_customers';
// const LEDGER_STORAGE_KEY = 'dukaan_sahayak_customer_ledgers';

// const SAMPLE_CUSTOMERS = [
//   { _id: 'c1', name: 'Rajesh Gupta', phone: '9812345678', address: 'Near Shiv Mandir, Ward 4', balance: 4500, whatsappOptIn: true },
//   { _id: 'c2', name: 'Vikas Tiwari', phone: '9898765432', address: 'House No 45, Railway Road', balance: 2150, whatsappOptIn: true },
//   { _id: 'c3', name: 'Sanjay Kumar', phone: '9845012345', address: 'Purani Basti', balance: 1800, whatsappOptIn: false },
//   { _id: 'c4', name: 'Sunil Sharma', phone: '9876500001', address: 'Civil Lines', balance: 0, whatsappOptIn: true },
//   { _id: 'c5', name: 'Anita Devi', phone: '9811223344', address: 'Krishna Nagar', balance: 650, whatsappOptIn: true },
// ];

// const readStorage = (key, fallback = []) => {
//   try {
//     const value = localStorage.getItem(key);
//     if (!value) return fallback;

//     const parsed = JSON.parse(value);
//     return parsed ?? fallback;
//   } catch (error) {
//     console.warn(`Could not read ${key}:`, error);
//     return fallback;
//   }
// };

// const writeStorage = (key, value) => {
//   try {
//     localStorage.setItem(key, JSON.stringify(value));
//     return true;
//   } catch (error) {
//     console.error(`Could not save ${key}:`, error);
//     return false;
//   }
// };

// const getLocalCustomers = () => {
//   const customers = readStorage(CUSTOMER_STORAGE_KEY, []);
//   return Array.isArray(customers) ? customers : [];
// };

// const getLocalLedgers = () => {
//   const ledgers = readStorage(LEDGER_STORAGE_KEY, {});
//   return ledgers && typeof ledgers === 'object' && !Array.isArray(ledgers)
//     ? ledgers
//     : {};
// };

// const saveLocalCustomers = (customers) =>
//   writeStorage(CUSTOMER_STORAGE_KEY, customers);

// const saveLocalLedgers = (ledgers) =>
//   writeStorage(LEDGER_STORAGE_KEY, ledgers);

// const normaliseCustomer = (customer) => {
//   const balance = Number(
//     customer?.balance ?? customer?.outstandingBalance ?? 0
//   );

//   return {
//     ...customer,
//     _id: customer?._id || customer?.id || `local_${Date.now()}`,
//     name: customer?.name || 'Unnamed customer',
//     phone: String(customer?.phone || ''),
//     address: customer?.address || '',
//     whatsappOptIn: customer?.whatsappOptIn ?? true,
//     balance: Number.isFinite(balance) ? balance : 0,
//     outstandingBalance: Number.isFinite(balance) ? balance : 0,
//   };
// };

// // First entry wins, so locally saved records take precedence.
// const mergeCustomers = (...groups) => {
//   const result = [];
//   const seenPhones = new Set();
//   const seenIds = new Set();

//   groups.flat().forEach((rawCustomer) => {
//     if (!rawCustomer?.name) return;

//     const customer = normaliseCustomer(rawCustomer);
//     const phoneKey = customer.phone.replace(/\D/g, '');
//     const id = String(customer._id);

//     if (phoneKey && seenPhones.has(phoneKey)) return;
//     if (id && seenIds.has(id)) return;

//     if (phoneKey) seenPhones.add(phoneKey);
//     if (id) seenIds.add(id);

//     result.push(customer);
//   });

//   return result;
// };

// const extractApiCustomers = (response) => {
//   const data = response?.data;

//   if (Array.isArray(data?.data)) return data.data;
//   if (Array.isArray(data?.data?.customers)) return data.data.customers;
//   if (Array.isArray(data?.customers)) return data.customers;
//   if (Array.isArray(data)) return data;

//   return [];
// };

// const extractApiCustomer = (response) => {
//   const data = response?.data;
//   const customer =
//     data?.data?.customer ||
//     data?.data ||
//     data?.customer ||
//     null;

//   if (
//     customer &&
//     !Array.isArray(customer) &&
//     typeof customer === 'object' &&
//     (customer.name || customer._id || customer.id)
//   ) {
//     return customer;
//   }

//   return null;
// };

// const formatRupees = (amount) =>
//   Number(amount || 0).toLocaleString('en-IN', {
//     maximumFractionDigits: 2,
//   });

// const Customers = () => {
//   const [customerList, setCustomerList] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [alert, setAlert] = useState({ type: '', message: '' });

//   const [isAddModalOpen, setIsAddModalOpen] = useState(false);
//   const [formData, setFormData] = useState({
//     name: '',
//     phone: '',
//     address: '',
//     unpaidAmount: '0',
//     whatsappOptIn: true,
//   });

//   const [selectedCustomer, setSelectedCustomer] = useState(null);
//   const [customerLedger, setCustomerLedger] = useState([]);
//   const [ledgerLoading, setLedgerLoading] = useState(false);

//   const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
//   const [paymentAmount, setPaymentAmount] = useState('');
//   const [paymentMode, setPaymentMode] = useState('cash');

//   const showAlert = (type, message) => {
//     setAlert({ type, message });
//   };

//   const fetchCustomers = useCallback(async (query = '') => {
//     setLoading(true);

//     const localCustomers = getLocalCustomers();
//     let apiCustomers = [];

//     try {
//       const response = await customersApi.getAll();
//       apiCustomers = extractApiCustomers(response);
//     } catch (error) {
//       console.warn(
//         'Customer API unavailable; using demo data:',
//         error?.message
//       );
//     }

//     const allCustomers = mergeCustomers(
//       localCustomers,
//       apiCustomers,
//       SAMPLE_CUSTOMERS
//     );

//     const search = query.trim().toLowerCase();

//     const filtered = search
//       ? allCustomers.filter((customer) =>
//           `${customer.name} ${customer.phone} ${customer.address}`
//             .toLowerCase()
//             .includes(search)
//         )
//       : allCustomers;

//     setCustomerList(filtered);
//     setLoading(false);
//   }, []);

//   useEffect(() => {
//     fetchCustomers();
//   }, [fetchCustomers]);

//   const handleSearchChange = (event) => {
//     const value = event.target.value;
//     setSearchTerm(value);
//     fetchCustomers(value);
//   };

//   const handleCreateCustomer = async (event) => {
//     event.preventDefault();

//     const name = formData.name.trim();
//     const phone = formData.phone.trim();
//     const address = formData.address.trim();
//     const unpaidAmount = Number(formData.unpaidAmount || 0);
//     const whatsappOptIn = formData.whatsappOptIn;

//     if (!name || !phone) {
//       showAlert('error', 'Customer name and phone number are required.');
//       return;
//     }

//     if (!Number.isFinite(unpaidAmount) || unpaidAmount < 0) {
//       showAlert('error', 'Enter a valid unpaid amount of ₹0 or more.');
//       return;
//     }

//     const phoneDigits = phone.replace(/\D/g, '');

//     const existingCustomers = mergeCustomers(
//       getLocalCustomers(),
//       customerList
//     );

//     const duplicate = existingCustomers.some(
//       (customer) =>
//         customer.phone.replace(/\D/g, '') === phoneDigits
//     );

//     if (duplicate) {
//       showAlert(
//         'error',
//         'A customer with this phone number already exists.'
//       );
//       return;
//     }

//     const newCustomer = {
//       _id: `local_${Date.now()}`,
//       name,
//       phone,
//       address,
//       whatsappOptIn,
//       balance: unpaidAmount,
//       outstandingBalance: unpaidAmount,
//       isLocal: true,
//       createdAt: new Date().toISOString(),
//     };

//     // Save locally before making any network request.
//     const storedCustomers = getLocalCustomers();
//     const saved = saveLocalCustomers([
//       newCustomer,
//       ...storedCustomers,
//     ]);

//     if (!saved) {
//       showAlert(
//         'error',
//         'Browser storage failed. Please check your browser storage settings.'
//       );
//       return;
//     }

//     setCustomerList((previous) =>
//       mergeCustomers([newCustomer], previous)
//     );

//     setSearchTerm('');
//     setIsAddModalOpen(false);
//     setFormData({
//       name: '',
//       phone: '',
//       address: '',
//       unpaidAmount: '0',
//       whatsappOptIn: true,
//     });

//     showAlert(
//       'success',
//       `Customer "${name}" added successfully! Initial udhar: ₹${formatRupees(unpaidAmount)}.`
//     );

//     // Attempt backend sync without making the demo dependent on it.
//     try {
//       const response = await customersApi.create({
//         name,
//         phone,
//         address,
//         whatsappOptIn,
//         outstandingBalance: unpaidAmount,
//       });

//       const apiCustomer = extractApiCustomer(response);

//       if (apiCustomer) {
//         const syncedCustomer = normaliseCustomer({
//           ...newCustomer,
//           ...apiCustomer,
//           // Retain the local ID to keep demo ledger keys stable.
//           _id: newCustomer._id,
//           name: apiCustomer.name || name,
//           phone: apiCustomer.phone || phone,
//           address: apiCustomer.address ?? address,
//           whatsappOptIn: apiCustomer.whatsappOptIn ?? whatsappOptIn,
//           balance:
//             apiCustomer.outstandingBalance ??
//             apiCustomer.balance ??
//             unpaidAmount,
//           isLocal: true,
//         });

//         const latest = getLocalCustomers().filter(
//           (customer) =>
//             customer.phone.replace(/\D/g, '') !== phoneDigits
//         );

//         saveLocalCustomers([syncedCustomer, ...latest]);

//         setCustomerList((previous) =>
//           mergeCustomers(
//             [syncedCustomer],
//             previous.filter(
//               (customer) =>
//                 customer.phone.replace(/\D/g, '') !== phoneDigits
//             )
//           )
//         );
//       }
//     } catch (error) {
//       console.warn(
//         'Backend customer creation failed; local demo record retained:',
//         error?.response?.data?.message || error?.message
//       );
//     }
//   };

//   const handleOpenDetail = async (customer) => {
//     const currentCustomer = normaliseCustomer(customer);

//     setSelectedCustomer(currentCustomer);
//     setCustomerLedger([]);
//     setLedgerLoading(true);

//     try {
//       const localLedgers = getLocalLedgers();
//       const localLedger =
//         localLedgers[currentCustomer._id] || [];

//       if (currentCustomer.isLocal || String(currentCustomer._id).startsWith('local_')) {
//         setCustomerLedger(localLedger);
//         return;
//       }

//       const response = await customersApi.getLedger(
//         currentCustomer._id
//       );

//       const data =
//         response?.data?.ledger ||
//         response?.data?.transactions ||
//         response?.data?.data;

//       const apiLedger = Array.isArray(data) ? data : [];

//       setCustomerLedger([...localLedger, ...apiLedger]);
//     } catch (error) {
//       console.warn('Ledger API unavailable:', error?.message);

//       const localLedgers = getLocalLedgers();
//       setCustomerLedger(localLedgers[currentCustomer._id] || []);
//     } finally {
//       setLedgerLoading(false);
//     }
//   };

//   const handleRecordPayment = async (event) => {
//     event.preventDefault();

//     if (!selectedCustomer) return;

//     const amount = Number(paymentAmount);

//     if (!Number.isFinite(amount) || amount <= 0) {
//       showAlert('error', 'Enter a valid payment amount greater than ₹0.');
//       return;
//     }

//     const customerId = selectedCustomer._id;
//     const currentBalance = Number(selectedCustomer.balance || 0);

//     if (amount > currentBalance) {
//       showAlert(
//         'error',
//         `Payment cannot exceed the outstanding balance of ₹${formatRupees(currentBalance)}.`
//       );
//       return;
//     }

//     const updatedBalance = Math.max(0, currentBalance - amount);
//     const updatedCustomer = {
//       ...selectedCustomer,
//       balance: updatedBalance,
//       outstandingBalance: updatedBalance,
//     };

//     // Persist the new balance locally.
//     const storedCustomers = getLocalCustomers();
//     const updatedStoredCustomers = storedCustomers.map((customer) =>
//       customer._id === customerId ||
//       customer.phone === selectedCustomer.phone
//         ? {
//             ...customer,
//             balance: updatedBalance,
//             outstandingBalance: updatedBalance,
//           }
//         : customer
//     );

//     const saved = saveLocalCustomers(updatedStoredCustomers);

//     if (!saved) {
//       showAlert('error', 'Could not save the updated balance locally.');
//       return;
//     }

//     const transaction = {
//       _id: `payment_${Date.now()}`,
//       date: new Date().toLocaleDateString('en-IN'),
//       type: 'payment',
//       description: `Payment received (${paymentMode.toUpperCase()})`,
//       debit: 0,
//       credit: amount,
//       balance: updatedBalance,
//       paymentMode,
//     };

//     const ledgers = getLocalLedgers();
//     const customerTransactions = ledgers[customerId] || [];

//     const updatedLedgers = {
//       ...ledgers,
//       [customerId]: [transaction, ...customerTransactions],
//     };

//     saveLocalLedgers(updatedLedgers);

//     setSelectedCustomer(updatedCustomer);

//     setCustomerList((previous) =>
//       previous.map((customer) =>
//         customer._id === customerId ||
//         customer.phone === selectedCustomer.phone
//           ? {
//               ...customer,
//               balance: updatedBalance,
//               outstandingBalance: updatedBalance,
//             }
//           : customer
//       )
//     );

//     setCustomerLedger((previous) => [transaction, ...previous]);

//     // Record payment with the backend when this isn't a local-only record.
//     try {
//       if (!String(customerId).startsWith('local_')) {
//         await paymentsApi.record({
//           customerId,
//           amount,
//           paymentMode,
//         });
//       }
//     } catch (error) {
//       console.warn(
//         'Backend payment recording failed; local payment retained:',
//         error?.response?.data?.message || error?.message
//       );
//     }

//     setIsPaymentModalOpen(false);
//     setPaymentAmount('');

//     showAlert(
//       'success',
//       `₹${formatRupees(amount)} payment recorded for ${selectedCustomer.name}. Remaining udhar: ₹${formatRupees(updatedBalance)}.`
//     );
//   };

//   const handleSendReminder = (customer) => {
//     if (!customer) return;

//     if (customer.whatsappOptIn === false) {
//       showAlert(
//         'error',
//         'This customer has opted out of WhatsApp reminders.'
//       );
//       return;
//     }

//     const phone = String(customer.phone || '').replace(/\D/g, '');

//     if (phone.length < 10) {
//       showAlert(
//         'error',
//         'Please check the customer phone number before sending a reminder.'
//       );
//       return;
//     }

//     const balance = Number(customer.balance || 0);

//     const message =
//       `Namaste ${customer.name} ji,\n\n` +
//       `Aapka hamari dukaan par kul udhar ₹${formatRupees(balance)} baaki hai.\n` +
//       `Kripya apni suvidha ke anusaar payment jama karwayein.\n\n` +
//       `Dhanyawad!`;

//     const internationalPhone = phone.startsWith('91')
//       ? phone
//       : `91${phone}`;

//     const whatsappUrl =
//       `https://wa.me/${internationalPhone}?text=${encodeURIComponent(message)}`;

//     window.open(whatsappUrl, '_blank', 'noopener,noreferrer');

//     showAlert(
//       'success',
//       `WhatsApp reminder prepared for ${customer.name}. Review and send it in WhatsApp.`
//     );
//   };

//   return (
//     <div>
//       <div className="page-header">
//         <div>
//           <h1 className="page-title">Customers / ग्राहक सूची</h1>
//           <p className="page-subtitle">
//             Manage customer ledger, khata balance, and WhatsApp notifications
//           </p>
//         </div>

//         <button
//           type="button"
//           className="btn btn-primary"
//           onClick={() => setIsAddModalOpen(true)}
//         >
//           <UserPlus size={18} /> Add Customer / नया ग्राहक
//         </button>
//       </div>

//       {alert.message && (
//         <Alert
//           type={alert.type}
//           message={alert.message}
//           onClose={() => setAlert({ type: '', message: '' })}
//         />
//       )}

//       {/* Search */}
//       <div className="card" style={{ marginBottom: '1.25rem' }}>
//         <div className="card-body" style={{ padding: '0.85rem 1.25rem' }}>
//           <div style={{ position: 'relative' }}>
//             <Search
//               size={18}
//               style={{
//                 position: 'absolute',
//                 left: '12px',
//                 top: '50%',
//                 transform: 'translateY(-50%)',
//                 color: 'var(--text-secondary)',
//               }}
//             />
//             <input
//               type="text"
//               className="form-input"
//               style={{ paddingLeft: '2.5rem' }}
//               placeholder="Search customers by name, phone or address..."
//               value={searchTerm}
//               onChange={handleSearchChange}
//             />
//           </div>
//         </div>
//       </div>

//       {/* Customers table */}
//       <div className="card">
//         <div className="table-container">
//           {loading ? (
//             <LoadingSpinner message="Loading customer directory..." />
//           ) : customerList.length === 0 ? (
//             <div
//               style={{
//                 padding: '3rem',
//                 textAlign: 'center',
//                 color: 'var(--text-secondary)',
//               }}
//             >
//               <Users
//                 size={40}
//                 style={{ margin: '0 auto 0.75rem', opacity: 0.5 }}
//               />
//               <p>No customers found.</p>
//               <button
//                 type="button"
//                 className="btn btn-outline-primary btn-sm"
//                 style={{ marginTop: '0.75rem' }}
//                 onClick={() => setIsAddModalOpen(true)}
//               >
//                 + Add New Customer
//               </button>
//             </div>
//           ) : (
//             <table>
//               <thead>
//                 <tr>
//                   <th>Customer Name</th>
//                   <th>Phone Number</th>
//                   <th>Address</th>
//                   <th style={{ textAlign: 'right' }}>Outstanding Khata</th>
//                   <th style={{ textAlign: 'center' }}>WhatsApp</th>
//                   <th style={{ textAlign: 'center' }}>Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {customerList.map((customer) => {
//                   const balance = Number(customer.balance || 0);
//                   const hasDebt = balance > 0;

//                   return (
//                     <tr
//                       key={customer._id}
//                       style={{ cursor: 'pointer' }}
//                       onClick={() => handleOpenDetail(customer)}
//                     >
//                       <td>
//                         <div style={{ fontWeight: 600 }}>
//                           {customer.name}
//                         </div>
//                       </td>
//                       <td>
//                         <div
//                           style={{
//                             display: 'flex',
//                             alignItems: 'center',
//                             gap: '0.35rem',
//                           }}
//                         >
//                           <Phone size={13} color="var(--text-secondary)" />
//                           <span>{customer.phone || 'N/A'}</span>
//                         </div>
//                       </td>
//                       <td
//                         style={{
//                           color: 'var(--text-secondary)',
//                           fontSize: '0.85rem',
//                         }}
//                       >
//                         {customer.address || 'N/A'}
//                       </td>
//                       <td style={{ textAlign: 'right', fontWeight: 700 }}>
//                         {hasDebt ? (
//                           <span
//                             style={{
//                               color: 'var(--danger)',
//                               fontSize: '1rem',
//                             }}
//                           >
//                             ₹{formatRupees(balance)}
//                           </span>
//                         ) : (
//                           <span
//                             style={{
//                               color: 'var(--success)',
//                               fontSize: '0.9rem',
//                             }}
//                           >
//                             ₹0 (Clear)
//                           </span>
//                         )}
//                       </td>
//                       <td style={{ textAlign: 'center' }}>
//                         {customer.whatsappOptIn !== false ? (
//                           <span className="badge badge-success">Active</span>
//                         ) : (
//                           <span className="badge badge-warning">Opt-out</span>
//                         )}
//                       </td>
//                       <td
//                         style={{ textAlign: 'center' }}
//                         onClick={(event) => event.stopPropagation()}
//                       >
//                         <div
//                           style={{
//                             display: 'inline-flex',
//                             gap: '0.5rem',
//                           }}
//                         >
//                           <button
//                             type="button"
//                             className="btn-icon"
//                             onClick={() => handleOpenDetail(customer)}
//                             title="View Ledger"
//                           >
//                             <Eye size={16} />
//                           </button>

//                           {hasDebt && customer.whatsappOptIn !== false && (
//                             <button
//                               type="button"
//                               className="btn-icon"
//                               style={{ color: '#25D366' }}
//                               onClick={() => handleSendReminder(customer)}
//                               title="Prepare WhatsApp Reminder"
//                             >
//                               <MessageCircle size={16} />
//                             </button>
//                           )}
//                         </div>
//                       </td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           )}
//         </div>
//       </div>

//       {/* Customer detail / ledger modal */}
//       <Modal
//         isOpen={Boolean(selectedCustomer)}
//         onClose={() => setSelectedCustomer(null)}
//         title={
//           selectedCustomer
//             ? `Customer Ledger - ${selectedCustomer.name}`
//             : 'Customer Details'
//         }
//         size="lg"
//       >
//         {selectedCustomer && (
//           <div>
//             <div
//               style={{
//                 display: 'flex',
//                 alignItems: 'center',
//                 justifyContent: 'space-between',
//                 padding: '1.25rem',
//                 backgroundColor: 'var(--bg-primary)',
//                 borderRadius: 'var(--radius)',
//                 marginBottom: '1.5rem',
//                 flexWrap: 'wrap',
//                 gap: '1rem',
//               }}
//             >
//               <div>
//                 <h3
//                   style={{
//                     fontSize: '1.3rem',
//                     marginBottom: '0.25rem',
//                   }}
//                 >
//                   {selectedCustomer.name}
//                 </h3>
//                 <div
//                   style={{
//                     fontSize: '0.875rem',
//                     color: 'var(--text-secondary)',
//                   }}
//                 >
//                   Phone: {selectedCustomer.phone} •{' '}
//                   {selectedCustomer.address || 'Address not listed'}
//                 </div>
//               </div>

//               <div style={{ textAlign: 'right' }}>
//                 <div
//                   style={{
//                     fontSize: '0.8rem',
//                     color: 'var(--text-secondary)',
//                     textTransform: 'uppercase',
//                     fontWeight: 600,
//                   }}
//                 >
//                   Current Udhar / बकाया
//                 </div>
//                 <div
//                   style={{
//                     fontSize: '1.8rem',
//                     fontWeight: 800,
//                     color:
//                       selectedCustomer.balance > 0
//                         ? 'var(--danger)'
//                         : 'var(--success)',
//                   }}
//                 >
//                   ₹{formatRupees(selectedCustomer.balance)}
//                 </div>
//               </div>
//             </div>

//             <div
//               style={{
//                 display: 'flex',
//                 gap: '0.75rem',
//                 marginBottom: '1.5rem',
//                 flexWrap: 'wrap',
//               }}
//             >
//               <button
//                 type="button"
//                 className="btn btn-success btn-sm"
//                 onClick={() => setIsPaymentModalOpen(true)}
//               >
//                 <IndianRupee size={16} /> Record Payment (जमा करें)
//               </button>

//               {selectedCustomer.balance > 0 &&
//                 selectedCustomer.whatsappOptIn !== false && (
//                   <button
//                     type="button"
//                     className="btn btn-secondary btn-sm"
//                     onClick={() => handleSendReminder(selectedCustomer)}
//                   >
//                     <MessageCircle size={16} /> WhatsApp Reminder Bhejo
//                   </button>
//                 )}
//             </div>

//             <h4
//               style={{
//                 marginBottom: '0.75rem',
//                 fontSize: '1.05rem',
//               }}
//             >
//               Transaction History / हिसाब-किताब
//             </h4>

//             <div
//               className="table-container"
//               style={{ border: '1px solid var(--border)' }}
//             >
//               {ledgerLoading ? (
//                 <LoadingSpinner message="Loading ledger..." />
//               ) : customerLedger.length === 0 ? (
//                 <div
//                   style={{
//                     padding: '2rem',
//                     textAlign: 'center',
//                     color: 'var(--text-secondary)',
//                   }}
//                 >
//                   No transaction history recorded yet.
//                 </div>
//               ) : (
//                 <table>
//                   <thead>
//                     <tr>
//                       <th>Date</th>
//                       <th>Description</th>
//                       <th style={{ textAlign: 'right', color: 'var(--danger)' }}>
//                         Udhar / Debit (₹)
//                       </th>
//                       <th style={{ textAlign: 'right', color: 'var(--success)' }}>
//                         Jama / Credit (₹)
//                       </th>
//                       <th style={{ textAlign: 'right' }}>Net Balance (₹)</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {customerLedger.map((transaction, index) => (
//                       <tr key={transaction._id || index}>
//                         <td style={{ fontSize: '0.85rem' }}>
//                           {transaction.date || '-'}
//                         </td>
//                         <td style={{ fontWeight: 500 }}>
//                           {transaction.description || '-'}
//                         </td>
//                         <td
//                           style={{
//                             textAlign: 'right',
//                             color:
//                               transaction.debit > 0
//                                 ? 'var(--danger)'
//                                 : 'inherit',
//                             fontWeight: transaction.debit > 0 ? 600 : 400,
//                           }}
//                         >
//                           {transaction.debit > 0
//                             ? `₹${formatRupees(transaction.debit)}`
//                             : '-'}
//                         </td>
//                         <td
//                           style={{
//                             textAlign: 'right',
//                             color:
//                               transaction.credit > 0
//                                 ? 'var(--success)'
//                                 : 'inherit',
//                             fontWeight: transaction.credit > 0 ? 600 : 400,
//                           }}
//                         >
//                           {transaction.credit > 0
//                             ? `₹${formatRupees(transaction.credit)}`
//                             : '-'}
//                         </td>
//                         <td style={{ textAlign: 'right', fontWeight: 700 }}>
//                           ₹{formatRupees(transaction.balance)}
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               )}
//             </div>
//           </div>
//         )}
//       </Modal>

//       {/* Record payment modal */}
//       <Modal
//         isOpen={isPaymentModalOpen}
//         onClose={() => setIsPaymentModalOpen(false)}
//         title={`Record Payment from ${selectedCustomer?.name || 'Customer'}`}
//         size="sm"
//       >
//         <form onSubmit={handleRecordPayment}>
//           <div className="form-group">
//             <label className="form-label">
//               Payment Amount / रकम (₹) *
//             </label>
//             <input
//               type="number"
//               min="0.01"
//               step="0.01"
//               max={selectedCustomer?.balance || 0}
//               className="form-input"
//               value={paymentAmount}
//               onChange={(event) => setPaymentAmount(event.target.value)}
//               placeholder="e.g. 500"
//               required
//             />
//             <small style={{ color: 'var(--text-secondary)' }}>
//               Outstanding balance: ₹
//               {formatRupees(selectedCustomer?.balance || 0)}
//             </small>
//           </div>

//           <div className="form-group">
//             <label className="form-label">Payment Method / माध्यम</label>
//             <select
//               className="form-select"
//               value={paymentMode}
//               onChange={(event) => setPaymentMode(event.target.value)}
//             >
//               <option value="cash">Cash (नगद)</option>
//               <option value="upi">UPI / GPay / PhonePe</option>
//               <option value="bank">Bank Transfer</option>
//             </select>
//           </div>

//           <div
//             style={{
//               display: 'flex',
//               justifyContent: 'flex-end',
//               gap: '0.75rem',
//               marginTop: '1.25rem',
//             }}
//           >
//             <button
//               type="button"
//               className="btn btn-outline"
//               onClick={() => setIsPaymentModalOpen(false)}
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               className="btn btn-success"
//               disabled={Number(selectedCustomer?.balance || 0) <= 0}
//             >
//               Save Payment (जमा दर्ज करें)
//             </button>
//           </div>
//         </form>
//       </Modal>

//       {/* Add customer modal */}
//       <Modal
//         isOpen={isAddModalOpen}
//         onClose={() => setIsAddModalOpen(false)}
//         title="Add New Customer / नया ग्राहक जोड़ें"
//         size="md"
//       >
//         <form onSubmit={handleCreateCustomer}>
//           <div className="form-group">
//             <label className="form-label">Customer Name / नाम *</label>
//             <input
//               type="text"
//               className="form-input"
//               placeholder="e.g. Ratan Lal"
//               value={formData.name}
//               onChange={(event) =>
//                 setFormData({ ...formData, name: event.target.value })
//               }
//               required
//             />
//           </div>

//           <div className="form-group">
//             <label className="form-label">Mobile Number / फोन नंबर *</label>
//             <input
//               type="tel"
//               className="form-input"
//               placeholder="10 digit mobile number"
//               value={formData.phone}
//               onChange={(event) =>
//                 setFormData({ ...formData, phone: event.target.value })
//               }
//               required
//             />
//           </div>

//           <div className="form-group">
//             <label className="form-label">Address / पता</label>
//             <textarea
//               className="form-input"
//               placeholder="Mohalla / Gali / Landmark"
//               value={formData.address}
//               onChange={(event) =>
//                 setFormData({ ...formData, address: event.target.value })
//               }
//             />
//           </div>

//           <div className="form-group">
//             <label className="form-label">
//               Initial Unpaid Amount / शुरुआती उधार (₹)
//             </label>
//             <input
//               type="number"
//               min="0"
//               step="0.01"
//               className="form-input"
//               placeholder="e.g. 1500"
//               value={formData.unpaidAmount}
//               onChange={(event) =>
//                 setFormData({
//                   ...formData,
//                   unpaidAmount: event.target.value,
//                 })
//               }
//             />
//             <small style={{ color: 'var(--text-secondary)' }}>
//               Enter how much the customer already owes your shop.
//               Enter 0 if there is no unpaid amount.
//             </small>
//           </div>

//           <div className="form-group">
//             <label
//               style={{
//                 display: 'flex',
//                 alignItems: 'center',
//                 gap: '0.5rem',
//                 cursor: 'pointer',
//               }}
//             >
//               <input
//                 type="checkbox"
//                 checked={formData.whatsappOptIn}
//                 onChange={(event) =>
//                   setFormData({
//                     ...formData,
//                     whatsappOptIn: event.target.checked,
//                   })
//                 }
//                 style={{ accentColor: 'var(--primary)' }}
//               />
//               <span style={{ fontSize: '0.9rem' }}>
//                 Allow WhatsApp bills and payment reminders
//               </span>
//             </label>
//           </div>

//           <div
//             style={{
//               display: 'flex',
//               justifyContent: 'flex-end',
//               gap: '0.75rem',
//               marginTop: '1.25rem',
//             }}
//           >
//             <button
//               type="button"
//               className="btn btn-outline"
//               onClick={() => setIsAddModalOpen(false)}
//             >
//               Cancel
//             </button>
//             <button type="submit" className="btn btn-primary">
//               Save Customer
//             </button>
//           </div>
//         </form>
//       </Modal>
//     </div>
//   );
// };

// export default Customers;

import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  UserCheck,
  X,
  Phone,
  UserPlus,
  LoaderCircle,
} from 'lucide-react';

import { customers as customersApi } from '../services/api';

const CustomerSelector = ({
  value,
  onChange,
  onSelect,
  onCustomerCreated,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const dropdownRef = useRef(null);

  // Load real customers whenever the search term changes.
  useEffect(() => {
    const query = searchTerm.trim();

    if (!query || value || showForm) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    let cancelled = false;

    const timer = setTimeout(async () => {
      setLoading(true);
      setError('');

      try {
        const res = await customersApi.getAll(query);
        const data = res.data?.data;

        if (!cancelled) {
          setResults(Array.isArray(data) ? data : []);
          setIsOpen(true);
        }
      } catch (err) {
        if (!cancelled) {
          setResults([]);
          setError(
            err.response?.data?.message ||
              'Unable to load customers. Please try again.'
          );
          setIsOpen(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchTerm, value, showForm]);

  // Close the dropdown when clicking outside.
  useEffect(() => {
    const handler = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handler);

    return () => {
      document.removeEventListener('mousedown', handler);
    };
  }, []);

  const selectCustomer = (customer) => {
    onSelect?.(customer);
    onChange?.(customer);

    setSearchTerm('');
    setResults([]);
    setIsOpen(false);
    setShowForm(false);
    setError('');
  };

  const openAddForm = () => {
    setName(searchTerm.trim());
    setPhone('');
    setError('');
    setIsOpen(false);
    setShowForm(true);
  };

  const saveCustomer = async (event) => {
    event.preventDefault();

    const customerName = name.trim();
    const customerPhone = phone.trim();

    if (!customerName) {
      setError('Please enter the customer name.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const res = await customersApi.create({
        name: customerName,
        ...(customerPhone ? { phone: customerPhone } : {}),
      });

      const customer = res.data?.data;

      if (!res.data?.success || !customer?._id) {
        throw new Error(
          res.data?.message ||
            'Customer saved, but the server response is invalid.'
        );
      }

      // Refresh the parent Customers table using real API data.
      // The parent should provide this callback.
      if (onCustomerCreated) {
        await onCustomerCreated(customer);
      }

      // Select the newly created MongoDB customer.
      selectCustomer(customer);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Unable to save customer. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const balance = Number(
    value?.outstandingBalance ?? value?.balance ?? 0
  );

  return (
    <div className="selector-container" ref={dropdownRef}>
      <label className="form-label">Customer / ग्राहक</label>

      {value ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
            background: 'var(--primary-light)',
            border: '1px solid #bfdbfe',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
            }}
          >
            <UserCheck size={20} color="var(--primary)" />

            <div>
              <div style={{ fontWeight: 600 }}>{value.name}</div>

              <div
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                }}
              >
                {value.phone || 'No phone on file'}

                {balance > 0 && (
                  <span
                    style={{
                      marginLeft: 8,
                      color: 'var(--danger)',
                      fontWeight: 600,
                    }}
                  >
                    Baki: ₹{balance}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn-icon"
            title="Change customer"
            onClick={() => selectCustomer(null)}
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <>
          {!showForm && (
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  flex: 1,
                  minWidth: 180,
                }}
              >
                <Search
                  size={18}
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-secondary)',
                    pointerEvents: 'none',
                  }}
                />

                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem', width: '100%' }}
                  placeholder="Search customer by name or phone"
                  value={searchTerm}
                  onChange={(event) => {
                    setSearchTerm(event.target.value);
                    setError('');
                  }}
                  onFocus={() => {
                    if (searchTerm.trim()) setIsOpen(true);
                  }}
                />
              </div>

              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={openAddForm}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  whiteSpace: 'nowrap',
                  minHeight: 40,
                }}
              >
                <UserPlus size={16} />
                Add Customer
              </button>
            </div>
          )}

          {isOpen && !showForm && (
            <div className="selector-dropdown">
              {loading ? (
                <div style={{ padding: '1rem', textAlign: 'center' }}>
                  Searching customers...
                </div>
              ) : (
                <>
                  {results.map((customer) => (
                    <button
                      type="button"
                      key={customer._id}
                      className="selector-option"
                      style={{
                        display: 'flex',
                        width: '100%',
                        alignItems: 'center',
                        textAlign: 'left',
                        border: 0,
                        background: 'transparent',
                        cursor: 'pointer',
                      }}
                      onClick={() => selectCustomer(customer)}
                    >
                      <div style={{ flex: 1 }}>
                        <div className="selector-option-main">
                          {customer.name}
                        </div>

                        <div className="selector-option-sub">
                          <Phone
                            size={11}
                            style={{
                              display: 'inline',
                              marginRight: 3,
                            }}
                          />
                          {customer.phone || 'No phone'}
                        </div>
                      </div>

                      {Number(customer.outstandingBalance ?? 0) > 0 && (
                        <span style={{ color: 'var(--danger)' }}>
                          Baki: ₹{Number(customer.outstandingBalance)}
                        </span>
                      )}
                    </button>
                  ))}

                  {!results.length && !error && (
                    <p style={{ padding: '0.75rem 1rem' }}>
                      No matching customers found.
                    </p>
                  )}

                  {error && (
                    <p
                      style={{
                        padding: '0.75rem 1rem',
                        color: 'var(--danger)',
                      }}
                    >
                      {error}
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {showForm && (
            <form
              onSubmit={saveCustomer}
              style={{
                display: 'grid',
                gap: '0.75rem',
                padding: '1rem',
                marginTop: '0.75rem',
                border: '1px solid var(--border-color, #ddd)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                }}
              >
                <strong>Add New Customer</strong>

                <button
                  type="button"
                  className="btn-icon"
                  disabled={saving}
                  title="Close form"
                  onClick={() => {
                    setShowForm(false);
                    setError('');
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              <input
                type="text"
                className="form-input"
                placeholder="Customer name *"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={100}
                required
                autoFocus
              />

              <input
                type="tel"
                className="form-input"
                placeholder="Phone number (optional)"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                maxLength={20}
              />

              {error && (
                <p
                  role="alert"
                  style={{
                    color: 'var(--danger)',
                    fontSize: '0.85rem',
                    margin: 0,
                  }}
                >
                  {error}
                </p>
              )}

              <div
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  flexWrap: 'wrap',
                }}
              >
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <LoaderCircle size={14} />
                      Saving...
                    </>
                  ) : (
                    <>
                      <UserPlus size={14} />
                      Save Customer
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="btn btn-sm"
                  disabled={saving}
                  onClick={() => {
                    setShowForm(false);
                    setError('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
};

export default CustomerSelector;