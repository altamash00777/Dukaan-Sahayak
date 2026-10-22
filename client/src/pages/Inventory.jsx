// import React, { useState, useEffect, useCallback } from 'react';
// import {
//   Boxes,
//   AlertTriangle,
//   Plus,
//   History,
//   Sparkles,
//   ShoppingBag,
//   ArrowUpRight,
//   ArrowDownLeft,
//   CheckCircle,
// } from 'lucide-react';
// import Modal from '../components/Modal';
// import Alert from '../components/Alert';
// import LoadingSpinner from '../components/LoadingSpinner';
// import { inventory as inventoryApi, purchases as purchasesApi, products as productsApi } from '../services/api';

// const SAMPLE_INVENTORY = [
//   {
//     _id: 'p1',
//     name: 'Aashirvaad Shudh Chakki Atta 10kg',
//     category: 'Flour & Grains',
//     unit: 'bag',
//     currentStock: 3,
//     reorderLevel: 10,
//     costPrice: 380,
//     supplier: 'Delhi Wholesale Depot',
//   },
//   {
//     _id: 'p2',
//     name: 'Tata Salt 1kg',
//     category: 'Groceries',
//     unit: 'packet',
//     currentStock: 5,
//     reorderLevel: 25,
//     costPrice: 24,
//     supplier: 'Tata Consumer Distributors',
//   },
//   {
//     _id: 'p3',
//     name: 'Fortune Mustard Oil 1L',
//     category: 'Edible Oils',
//     unit: 'pouch',
//     currentStock: 0,
//     reorderLevel: 15,
//     costPrice: 135,
//     supplier: 'Adani Wilmar Agency',
//   },
//   {
//     _id: 'p4',
//     name: 'Parle-G 80g Biscuits',
//     category: 'Snacks',
//     unit: 'packet',
//     currentStock: 54,
//     reorderLevel: 20,
//     costPrice: 8.5,
//     supplier: 'Parle Agency',
//   },
//   {
//     _id: 'p5',
//     name: 'Madhur Sugar 1kg',
//     category: 'Groceries',
//     unit: 'kg',
//     currentStock: 22,
//     reorderLevel: 20,
//     costPrice: 40,
//     supplier: 'Shree Sugar Mills',
//   },
//   {
//     _id: 'p6',
//     name: 'Maggi 2-Minute Noodles 70g',
//     category: 'Snacks',
//     unit: 'pack',
//     currentStock: 8,
//     reorderLevel: 40,
//     costPrice: 12,
//     supplier: 'Nestle Distributors',
//   },
// ];

// const Inventory = () => {
//   const [inventoryList, setInventoryList] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [filter, setFilter] = useState('all'); // all, low, out
//   const [alert, setAlert] = useState({ type: '', message: '' });

//   // Purchase Modal
//   const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
//   const [purchaseForm, setPurchaseForm] = useState({
//     supplier: '',
//     productId: '',
//     productName: '',
//     quantity: '',
//     costPrice: '',
//   });

//   // Movement history modal
//   const [selectedProductHistory, setSelectedProductHistory] = useState(null);
//   const [historyList, setHistoryList] = useState([]);

//   const fetchInventory = useCallback(async () => {
//     setLoading(true);
//     try {
//       const res = await inventoryApi.getAll();
//       const data = res.data?.inventory || res.data?.products || res.data || [];
//       if (Array.isArray(data) && data.length > 0) {
//         setInventoryList(data);
//       } else {
//         setInventoryList(SAMPLE_INVENTORY);
//       }
//     } catch (err) {
//       console.warn('Inventory fetch fallback:', err);
//       setInventoryList(SAMPLE_INVENTORY);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     fetchInventory();
//   }, [fetchInventory]);

//   const filteredItems = inventoryList.filter((item) => {
//     const stock = Number(item.currentStock !== undefined ? item.currentStock : item.stock || 0);
//     const reorder = Number(item.reorderLevel || 10);

//     if (filter === 'out') return stock === 0;
//     if (filter === 'low') return stock > 0 && stock <= reorder;
//     return true;
//   });

//   const handleOpenPurchase = (product = null) => {
//     if (product) {
//       setPurchaseForm({
//         supplier: product.supplier || 'Local Wholesale Market',
//         productId: product._id || product.id,
//         productName: product.name,
//         quantity: Math.max(10, (product.reorderLevel || 10) * 2),
//         costPrice: product.costPrice || product.purchaseCost || '',
//       });
//     } else {
//       setPurchaseForm({
//         supplier: '',
//         productId: '',
//         productName: '',
//         quantity: '',
//         costPrice: '',
//       });
//     }
//     setIsPurchaseModalOpen(true);
//   };

//   const handleRecordPurchase = async (e) => {
//     e.preventDefault();
//     const qty = Number(purchaseForm.quantity);
//     const cost = Number(purchaseForm.costPrice);

//     if (!purchaseForm.productName || qty <= 0) {
//       setAlert({ type: 'error', message: 'Valid product name and quantity are required.' });
//       return;
//     }

//     try {
//       try {
//         await purchasesApi.create({
//           supplier: purchaseForm.supplier,
//           productId: purchaseForm.productId,
//           productName: purchaseForm.productName,
//           quantity: qty,
//           costPrice: cost,
//           totalAmount: qty * cost,
//         });
//       } catch (e) {
//         console.warn('Purchase API fallback:', e);
//       }

//       setInventoryList((prev) =>
//         prev.map((item) => {
//           if (
//             (item._id && item._id === purchaseForm.productId) ||
//             item.name.toLowerCase() === purchaseForm.productName.toLowerCase()
//           ) {
//             const cur = Number(item.currentStock || item.stock || 0);
//             return { ...item, currentStock: cur + qty };
//           }
//           return item;
//         })
//       );

//       setIsPurchaseModalOpen(false);
//       setAlert({
//         type: 'success',
//         message: `Successfully restocked ${qty} units of "${purchaseForm.productName}"!`,
//       });
//     } catch (err) {
//       console.error('Purchase record failed:', err);
//     }
//   };

//   const handleViewHistory = (prod) => {
//     setSelectedProductHistory(prod);
//     setHistoryList([
//       {
//         date: new Date().toLocaleDateString('en-IN'),
//         type: 'IN',
//         label: 'Purchase Restock',
//         qty: '+20',
//         balance: prod.currentStock,
//       },
//       {
//         date: new Date(Date.now() - 86400000).toLocaleDateString('en-IN'),
//         type: 'OUT',
//         label: 'Sale (INV-1088)',
//         qty: '-2',
//         balance: Math.max(0, prod.currentStock - 2),
//       },
//       {
//         date: new Date(Date.now() - 86400000 * 3).toLocaleDateString('en-IN'),
//         type: 'OUT',
//         label: 'Sale (INV-1075)',
//         qty: '-5',
//         balance: Math.max(0, prod.currentStock + 3),
//       },
//     ]);
//   };

//   return (
//     <div>
//       <div className="page-header">
//         <div>
//           <h1 className="page-title">Inventory & Stock / स्टॉक प्रबंधन</h1>
//           <p className="page-subtitle">Track low stock items, record inward wholesale purchases, and AI reorders</p>
//         </div>
//         <button
//           type="button"
//           className="btn btn-primary"
//           onClick={() => handleOpenPurchase()}
//         >
//           <Plus size={18} /> Record Purchase / नया माल जोड़ें
//         </button>
//       </div>

//       {alert.message && (
//         <Alert
//           type={alert.type}
//           message={alert.message}
//           onClose={() => setAlert({ type: '', message: '' })}
//         />
//       )}

//       {/* AI Smart Reorder Suggestions Banner */}
//       <div
//         style={{
//           backgroundColor: '#fffbeb',
//           border: '1px solid #fde68a',
//           borderRadius: 'var(--radius)',
//           padding: '1.25rem',
//           marginBottom: '1.5rem',
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'space-between',
//           flexWrap: 'wrap',
//           gap: '1rem',
//         }}
//       >
//         <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
//           <div
//             style={{
//               width: 40,
//               height: 40,
//               borderRadius: '8px',
//               backgroundColor: 'var(--secondary)',
//               color: '#ffffff',
//               display: 'flex',
//               alignItems: 'center',
//               justifyContent: 'center',
//             }}
//           >
//             <Sparkles size={20} />
//           </div>
//           <div>
//             <div style={{ fontWeight: 700, color: '#92400e', fontSize: '1rem' }}>
//               AI Reorder Recommendations (स्मार्ट सुझाव)
//             </div>
//             <div style={{ color: '#b45309', fontSize: '0.85rem' }}>
//               3 fast-selling items are predicted to run out this weekend based on weekly sales velocity.
//             </div>
//           </div>
//         </div>

//         <button
//           type="button"
//           className="btn btn-secondary btn-sm"
//           onClick={() => {
//             const item = inventoryList.find((i) => i.currentStock <= i.reorderLevel) || inventoryList[0];
//             handleOpenPurchase(item);
//           }}
//         >
//           <ShoppingBag size={14} /> 1-Click Wholesale Restock
//         </button>
//       </div>

//       {/* Filter Tabs */}
//       <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
//         <button
//           type="button"
//           className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-outline'}`}
//           onClick={() => setFilter('all')}
//         >
//           All Items ({inventoryList.length})
//         </button>
//         <button
//           type="button"
//           className={`btn btn-sm ${filter === 'low' ? 'btn-warning' : 'btn-outline'}`}
//           onClick={() => setFilter('low')}
//         >
//           ⚠️ Low Stock (
//           {
//             inventoryList.filter(
//               (i) => i.currentStock > 0 && i.currentStock <= (i.reorderLevel || 10)
//             ).length
//           }
//           )
//         </button>
//         <button
//           type="button"
//           className={`btn btn-sm ${filter === 'out' ? 'btn-danger' : 'btn-outline'}`}
//           onClick={() => setFilter('out')}
//         >
//           ❌ Out of Stock ({inventoryList.filter((i) => i.currentStock === 0).length})
//         </button>
//       </div>

//       {/* Inventory Table */}
//       <div className="card">
//         <div className="table-container">
//           {loading ? (
//             <LoadingSpinner message="Checking stock levels..." />
//           ) : filteredItems.length === 0 ? (
//             <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
//               <Boxes size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
//               <p>No inventory items match the current filter.</p>
//             </div>
//           ) : (
//             <table>
//               <thead>
//                 <tr>
//                   <th>Product Name</th>
//                   <th>Category</th>
//                   <th style={{ textAlign: 'center' }}>Stock Status</th>
//                   <th style={{ textAlign: 'center' }}>Current Stock</th>
//                   <th style={{ textAlign: 'center' }}>Reorder Threshold</th>
//                   <th>Preferred Supplier</th>
//                   <th style={{ textAlign: 'center' }}>Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {filteredItems.map((prod) => {
//                   const stock = Number(prod.currentStock !== undefined ? prod.currentStock : prod.stock || 0);
//                   const reorder = Number(prod.reorderLevel || 10);

//                   let statusBadge = (
//                     <span className="badge badge-success">In Stock</span>
//                   );
//                   if (stock === 0) {
//                     statusBadge = <span className="badge badge-danger">Out of Stock</span>;
//                   } else if (stock <= reorder) {
//                     statusBadge = <span className="badge badge-warning">Low Stock</span>;
//                   }

//                   return (
//                     <tr key={prod._id || prod.id}>
//                       <td>
//                         <div style={{ fontWeight: 600 }}>{prod.name}</div>
//                       </td>
//                       <td>
//                         <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
//                           {prod.category || 'General'}
//                         </span>
//                       </td>
//                       <td style={{ textAlign: 'center' }}>{statusBadge}</td>
//                       <td style={{ textAlign: 'center', fontWeight: 700 }}>
//                         <span
//                           style={{
//                             color: stock === 0 ? 'var(--danger)' : stock <= reorder ? 'var(--warning-dark)' : 'inherit',
//                           }}
//                         >
//                           {stock} {prod.unit || 'pcs'}
//                         </span>
//                       </td>
//                       <td style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
//                         {reorder} {prod.unit || 'pcs'}
//                       </td>
//                       <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
//                         {prod.supplier || 'Local Mandi / Wholesale'}
//                       </td>
//                       <td style={{ textAlign: 'center' }}>
//                         <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
//                           <button
//                             type="button"
//                             className="btn btn-outline-primary btn-sm"
//                             onClick={() => handleOpenPurchase(prod)}
//                           >
//                             + Restock
//                           </button>
//                           <button
//                             type="button"
//                             className="btn-icon"
//                             onClick={() => handleViewHistory(prod)}
//                             title="Stock Movement Log"
//                           >
//                             <History size={16} />
//                           </button>
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

//       {/* Record Purchase Modal */}
//       <Modal
//         isOpen={isPurchaseModalOpen}
//         onClose={() => setIsPurchaseModalOpen(false)}
//         title="Record Inward Wholesale Purchase / माल खरीद दर्ज करें"
//         size="md"
//       >
//         <form onSubmit={handleRecordPurchase}>
//           <div className="form-group">
//             <label className="form-label">Product Name / सामान</label>
//             <input
//               type="text"
//               className="form-input"
//               value={purchaseForm.productName}
//               onChange={(e) => setPurchaseForm({ ...purchaseForm, productName: e.target.value })}
//               placeholder="e.g. Aashirvaad Atta"
//               required
//             />
//           </div>

//           <div className="form-group">
//             <label className="form-label">Wholesale Supplier / डीलर या मंडी</label>
//             <input
//               type="text"
//               className="form-input"
//               value={purchaseForm.supplier}
//               onChange={(e) => setPurchaseForm({ ...purchaseForm, supplier: e.target.value })}
//               placeholder="e.g. Gupta Wholesale Depot"
//             />
//           </div>

//           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
//             <div className="form-group">
//               <label className="form-label">Quantity Purchased / मात्रा *</label>
//               <input
//                 type="number"
//                 min="1"
//                 className="form-input"
//                 value={purchaseForm.quantity}
//                 onChange={(e) => setPurchaseForm({ ...purchaseForm, quantity: e.target.value })}
//                 placeholder="e.g. 50"
//                 required
//               />
//             </div>

//             <div className="form-group">
//               <label className="form-label">Cost Price Per Unit (₹)</label>
//               <input
//                 type="number"
//                 step="any"
//                 min="0"
//                 className="form-input"
//                 value={purchaseForm.costPrice}
//                 onChange={(e) => setPurchaseForm({ ...purchaseForm, costPrice: e.target.value })}
//                 placeholder="0.00"
//               />
//             </div>
//           </div>

//           <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
//             <button
//               type="button"
//               className="btn btn-outline"
//               onClick={() => setIsPurchaseModalOpen(false)}
//             >
//               Cancel
//             </button>
//             <button type="submit" className="btn btn-primary">
//               Save Inward Stock
//             </button>
//           </div>
//         </form>
//       </Modal>

//       {/* Stock Movement History Modal */}
//       <Modal
//         isOpen={Boolean(selectedProductHistory)}
//         onClose={() => setSelectedProductHistory(null)}
//         title={`Stock History: ${selectedProductHistory?.name}`}
//         size="md"
//       >
//         <div className="table-container">
//           <table>
//             <thead>
//               <tr>
//                 <th>Date</th>
//                 <th>Activity</th>
//                 <th style={{ textAlign: 'center' }}>Change</th>
//                 <th style={{ textAlign: 'right' }}>Closing Stock</th>
//               </tr>
//             </thead>
//             <tbody>
//               {historyList.map((h, i) => (
//                 <tr key={i}>
//                   <td style={{ fontSize: '0.85rem' }}>{h.date}</td>
//                   <td>{h.label}</td>
//                   <td
//                     style={{
//                       textAlign: 'center',
//                       fontWeight: 700,
//                       color: h.type === 'IN' ? 'var(--success)' : 'var(--danger)',
//                     }}
//                   >
//                     {h.qty}
//                   </td>
//                   <td style={{ textAlign: 'right', fontWeight: 600 }}>{h.balance}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </Modal>
//     </div>
//   );
// };

// export default Inventory;

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Boxes,
  AlertTriangle,
  Plus,
  ShoppingBag,
  Search,
  RefreshCw,
} from 'lucide-react';

import Modal from '../components/Modal';
import Alert from '../components/Alert';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  products as productsApi,
  purchases as purchasesApi,
} from '../services/api';

const getProductId = (product) => product?._id || product?.id;

const getStock = (product) =>
  Number(product?.currentStock ?? product?.stock ?? 0);

const getReorderLevel = (product) =>
  Number(product?.reorderLevel ?? 10);

const getCostPrice = (product) =>
  Number(product?.purchaseCost ?? product?.costPrice ?? product?.cost ?? 0);

const Inventory = () => {
  const [inventoryList, setInventoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingPurchase, setSavingPurchase] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [alert, setAlert] = useState({ type: '', message: '' });

  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [purchaseForm, setPurchaseForm] = useState({
    supplier: '',
    productId: '',
    quantity: '',
    costPrice: '',
  });

  // Load the same real products used by the Products page.
  const fetchInventory = useCallback(async () => {
    setLoading(true);

    try {
      const response = await productsApi.getAll();
      const data = response.data?.data;

      if (!Array.isArray(data)) {
        throw new Error('Invalid products response from server.');
      }

      setInventoryList(data);
    } catch (error) {
      console.error('Failed to load inventory:', error);

      setInventoryList([]);
      setAlert({
        type: 'error',
        message:
          error.response?.data?.message ||
          error.message ||
          'Unable to load inventory from the server.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Calculate stock status directly from real product data.
  const stockSummary = useMemo(() => {
    const lowStock = inventoryList.filter(
      (product) =>
        getStock(product) > 0 &&
        getStock(product) <= getReorderLevel(product)
    );

    const outOfStock = inventoryList.filter(
      (product) => getStock(product) <= 0
    );

    return {
      total: inventoryList.length,
      low: lowStock.length,
      out: outOfStock.length,
      lowStock,
      outOfStock,
    };
  }, [inventoryList]);

  const filteredItems = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return inventoryList.filter((product) => {
      const stock = getStock(product);
      const reorder = getReorderLevel(product);

      const matchesFilter =
        filter === 'out'
          ? stock <= 0
          : filter === 'low'
            ? stock > 0 && stock <= reorder
            : true;

      const matchesSearch =
        !query ||
        [product.name, product.category, product.hsnCode]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(query)
          );

      return matchesFilter && matchesSearch;
    });
  }, [inventoryList, filter, searchTerm]);

  const handleOpenPurchase = (product = null) => {
    if (product) {
      setPurchaseForm({
        supplier: product.supplier || '',
        productId: getProductId(product) || '',
        quantity: '',
        costPrice: String(getCostPrice(product)),
      });
    } else {
      setPurchaseForm({
        supplier: '',
        productId: '',
        quantity: '',
        costPrice: '',
      });
    }

    setIsPurchaseModalOpen(true);
  };

  const selectedProduct = useMemo(
    () =>
      inventoryList.find(
        (product) =>
          String(getProductId(product)) ===
          String(purchaseForm.productId)
      ) || null,
    [inventoryList, purchaseForm.productId]
  );

  // Save a purchase through the backend; never increase stock locally.
  const handleRecordPurchase = async (event) => {
    event.preventDefault();

    const quantity = Number(purchaseForm.quantity);
    const costPrice = Number(purchaseForm.costPrice);

    if (!selectedProduct) {
      setAlert({
        type: 'error',
        message: 'Please select a valid product from your inventory.',
      });
      return;
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setAlert({
        type: 'error',
        message: 'Enter a valid purchase quantity greater than zero.',
      });
      return;
    }

    if (!Number.isFinite(costPrice) || costPrice < 0) {
      setAlert({
        type: 'error',
        message: 'Enter a valid purchase cost.',
      });
      return;
    }

    const payload = {
      supplier: purchaseForm.supplier.trim(),
      productId: getProductId(selectedProduct),
      productName: selectedProduct.name,
      quantity,
      costPrice,
      totalAmount: quantity * costPrice,
    };

    setSavingPurchase(true);

    try {
      await purchasesApi.create(payload);

      setIsPurchaseModalOpen(false);
      setAlert({
        type: 'success',
        message: 'Purchase recorded successfully.',
      });

      // Read the latest stock from the backend.
      await fetchInventory();
    } catch (error) {
      console.error('Failed to record purchase:', error);

      setAlert({
        type: 'error',
        message:
          error.response?.data?.message ||
          'Purchase could not be recorded. Please try again.',
      });
    } finally {
      setSavingPurchase(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Inventory & Stock / स्टॉक प्रबंधन
          </h1>
          <p className="page-subtitle">
            View live product stock, low-stock alerts, and restock items.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={fetchInventory}
            disabled={loading}
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleOpenPurchase()}
            disabled={inventoryList.length === 0}
          >
            <Plus size={18} />
            Record Purchase
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

      {loading ? (
        <LoadingSpinner message="Loading real inventory from the server..." />
      ) : (
        <>
          {/* Live inventory summary */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem',
            }}
          >
            <div className="card">
              <div className="card-body">
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Total Products
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>
                  {stockSummary.total}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Low Stock Items
                </div>
                <div
                  style={{
                    fontSize: '1.8rem',
                    fontWeight: 700,
                    color: 'var(--warning-dark)',
                  }}
                >
                  {stockSummary.low}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Above zero, at or below reorder level
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Out of Stock
                </div>
                <div
                  style={{
                    fontSize: '1.8rem',
                    fontWeight: 700,
                    color: 'var(--danger)',
                  }}
                >
                  {stockSummary.out}
                </div>
              </div>
            </div>
          </div>

          {/* Real stock alert */}
          {stockSummary.lowStock.length > 0 ||
          stockSummary.outOfStock.length > 0 ? (
            <div
              style={{
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '1rem',
                marginBottom: '1.5rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  marginBottom: '0.75rem',
                }}
              >
                <AlertTriangle size={20} color="var(--danger)" />
                <h3 style={{ margin: 0 }}>
                  Stock Alerts / स्टॉक अलर्ट
                </h3>
              </div>

              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {stockSummary.outOfStock.map((product) => (
                  <div
                    key={getProductId(product)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '0.75rem',
                      flexWrap: 'wrap',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      background: 'var(--bg-secondary, #fef2f2)',
                    }}
                  >
                    <div>
                      <strong>{product.name}</strong>
                      <div style={{ fontSize: '0.85rem' }}>
                        Out of stock · Reorder at {getReorderLevel(product)}{' '}
                        {product.unit || 'pcs'}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => handleOpenPurchase(product)}
                    >
                      <ShoppingBag size={14} />
                      Restock
                    </button>
                  </div>
                ))}

                {stockSummary.lowStock.map((product) => (
                  <div
                    key={getProductId(product)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '0.75rem',
                      flexWrap: 'wrap',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      background: 'var(--bg-secondary, #fffbeb)',
                    }}
                  >
                    <div>
                      <strong>{product.name}</strong>
                      <div style={{ fontSize: '0.85rem' }}>
                        Low stock: {getStock(product)} {product.unit || 'pcs'}{' '}
                        · Limit: {getReorderLevel(product)}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => handleOpenPurchase(product)}
                    >
                      <ShoppingBag size={14} />
                      Restock
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div
              style={{
                padding: '1rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                marginBottom: '1.5rem',
              }}
            >
              <strong>All stock levels are healthy.</strong>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                No products are currently at or below their reorder limits.
              </div>
            </div>
          )}

          {/* Search */}
          <div className="card" style={{ marginBottom: '1rem' }}>
            <div className="card-body">
              <div style={{ position: 'relative' }}>
                <Search
                  size={18}
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-secondary)',
                  }}
                />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="Search products by name or category..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              flexWrap: 'wrap',
              marginBottom: '1.25rem',
            }}
          >
            <button
              type="button"
              className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setFilter('all')}
            >
              All Products ({stockSummary.total})
            </button>

            <button
              type="button"
              className={`btn btn-sm ${filter === 'low' ? 'btn-warning' : 'btn-outline'}`}
              onClick={() => setFilter('low')}
            >
              Low Stock ({stockSummary.low})
            </button>

            <button
              type="button"
              className={`btn btn-sm ${filter === 'out' ? 'btn-danger' : 'btn-outline'}`}
              onClick={() => setFilter('out')}
            >
              Out of Stock ({stockSummary.out})
            </button>
          </div>

          {/* Inventory table */}
          <div className="card">
            <div className="table-container">
              {filteredItems.length === 0 ? (
                <div
                  style={{
                    padding: '3rem',
                    textAlign: 'center',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <Boxes
                    size={40}
                    style={{ margin: '0 auto 0.75rem', opacity: 0.5 }}
                  />
                  <p>
                    {inventoryList.length === 0
                      ? 'No products found in your database. Add products from the Products page.'
                      : 'No products match this filter or search.'}
                  </p>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>Category</th>
                      <th style={{ textAlign: 'center' }}>Status</th>
                      <th style={{ textAlign: 'center' }}>Current Stock</th>
                      <th style={{ textAlign: 'center' }}>Reorder Level</th>
                      <th style={{ textAlign: 'right' }}>Purchase Cost</th>
                      <th style={{ textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredItems.map((product) => {
                      const stock = getStock(product);
                      const reorder = getReorderLevel(product);

                      const status =
                        stock <= 0
                          ? { label: 'Out of Stock', badge: 'badge-danger' }
                          : stock <= reorder
                            ? { label: 'Low Stock', badge: 'badge-warning' }
                            : { label: 'In Stock', badge: 'badge-success' };

                      return (
                        <tr key={getProductId(product)}>
                          <td>
                            <div style={{ fontWeight: 600 }}>
                              {product.name}
                            </div>
                          </td>

                          <td>
                            <span style={{ color: 'var(--text-secondary)' }}>
                              {product.category || 'General'}
                            </span>
                          </td>

                          <td style={{ textAlign: 'center' }}>
                            <span className={`badge ${status.badge}`}>
                              {status.label}
                            </span>
                          </td>

                          <td
                            style={{
                              textAlign: 'center',
                              fontWeight: 700,
                              color:
                                stock <= 0
                                  ? 'var(--danger)'
                                  : stock <= reorder
                                    ? 'var(--warning-dark)'
                                    : 'inherit',
                            }}
                          >
                            {stock} {product.unit || 'pcs'}
                          </td>

                          <td style={{ textAlign: 'center' }}>
                            {reorder} {product.unit || 'pcs'}
                          </td>

                          <td style={{ textAlign: 'right' }}>
                            ₹{getCostPrice(product).toFixed(2)}
                          </td>

                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              className="btn btn-outline-primary btn-sm"
                              onClick={() => handleOpenPurchase(product)}
                            >
                              <Plus size={14} />
                              Restock
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {/* Record purchase modal */}
      <Modal
        isOpen={isPurchaseModalOpen}
        onClose={() => !savingPurchase && setIsPurchaseModalOpen(false)}
        title="Record Purchase / माल खरीद दर्ज करें"
        size="md"
      >
        <form onSubmit={handleRecordPurchase}>
          <div className="form-group">
            <label className="form-label">Product *</label>
            <select
              className="form-select"
              value={purchaseForm.productId}
              onChange={(event) => {
                const product = inventoryList.find(
                  (item) =>
                    String(getProductId(item)) === event.target.value
                );

                setPurchaseForm((previous) => ({
                  ...previous,
                  productId: event.target.value,
                  costPrice: product
                    ? String(getCostPrice(product))
                    : '',
                }));
              }}
              required
            >
              <option value="">Select a product</option>
              {inventoryList.map((product) => (
                <option
                  key={getProductId(product)}
                  value={getProductId(product)}
                >
                  {product.name} — Stock: {getStock(product)}{' '}
                  {product.unit || 'pcs'}
                </option>
              ))}
            </select>
          </div>

          {selectedProduct && (
            <div
              style={{
                padding: '0.75rem',
                marginBottom: '1rem',
                borderRadius: '8px',
                background: 'var(--bg-secondary, #f5f5f5)',
                fontSize: '0.9rem',
              }}
            >
              Current stock: <strong>{getStock(selectedProduct)} {selectedProduct.unit || 'pcs'}</strong>
              <br />
              Reorder level: <strong>{getReorderLevel(selectedProduct)} {selectedProduct.unit || 'pcs'}</strong>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Supplier</label>
            <input
              type="text"
              className="form-input"
              value={purchaseForm.supplier}
              onChange={(event) =>
                setPurchaseForm({
                  ...purchaseForm,
                  supplier: event.target.value,
                })
              }
              placeholder="Enter supplier name"
              maxLength={150}
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: '1rem',
            }}
          >
            <div className="form-group">
              <label className="form-label">Quantity Purchased *</label>
              <input
                type="number"
                step="any"
                min="0.001"
                className="form-input"
                value={purchaseForm.quantity}
                onChange={(event) =>
                  setPurchaseForm({
                    ...purchaseForm,
                    quantity: event.target.value,
                  })
                }
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Cost Per Unit (₹) *</label>
              <input
                type="number"
                step="any"
                min="0"
                className="form-input"
                value={purchaseForm.costPrice}
                onChange={(event) =>
                  setPurchaseForm({
                    ...purchaseForm,
                    costPrice: event.target.value,
                  })
                }
                required
              />
            </div>
          </div>

          <div style={{ marginTop: '0.5rem', textAlign: 'right' }}>
            Estimated total:{' '}
            <strong>
              ₹
              {(
                Number(purchaseForm.quantity || 0) *
                Number(purchaseForm.costPrice || 0)
              ).toFixed(2)}
            </strong>
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
              disabled={savingPurchase}
              onClick={() => setIsPurchaseModalOpen(false)}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={savingPurchase || inventoryList.length === 0}
            >
              {savingPurchase ? 'Saving...' : 'Save Purchase'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Inventory;
