import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, Timestamp, addDoc, deleteDoc, setDoc, increment } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useAuth } from '../components/AuthProvider';
import { Order, Product } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ShoppingBag, 
  User, 
  MapPin, 
  CreditCard, 
  Bell, 
  ExternalLink, 
  RefreshCcw, 
  Search, 
  Filter, 
  AlertTriangle, 
  Box, 
  List as ListIcon, 
  Database,
  LogOut,
  Home as HomeIcon,
  ShoppingBasket,
  Plus,
  Minus,
  Edit,
  Trash2,
  Save,
  Image as ImageIcon,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import initialProducts from '../data/products.json';

const STATUS_ICONS = {
  pending: <Clock className="h-4 w-4" />,
  processing: <RefreshCcw className="h-4 w-4 animate-spin-slow" />,
  shipped: <Truck className="h-4 w-4" />,
  delivered: <CheckCircle className="h-4 w-4" />,
  cancelled: <XCircle className="h-4 w-4" />
};

const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-900/50',
  processing: 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200 dark:border-blue-900/50',
  shipped: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50',
  delivered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50',
  cancelled: 'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border-rose-200 dark:border-rose-900/50'
};

export default function AdminDashboard() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory'>('orders');
  const [inventorySearch, setInventorySearch] = useState('');
  const [newOrderAlert, setNewOrderAlert] = useState<string | null>(null);
  const [isEditingProduct, setIsEditingProduct] = useState<Partial<Product> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/');
  };

  useEffect(() => {
    if (!profile?.isAdmin) return;

    // Fetch Orders
    const ordersQ = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    let isFirstLoad = true;
    const unsubscribeOrders = onSnapshot(ordersQ, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({ ...doc.data() } as Order));
      if (!isFirstLoad) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const newOrder = change.doc.data() as Order;
            setNewOrderAlert(newOrder.orderId);
            setTimeout(() => setNewOrderAlert(null), 10000);
          }
        });
      }
      setOrders(ordersData);
      isFirstLoad = false;
    });

    // Fetch Products
    const productsQ = query(collection(db, 'products'), orderBy('name', 'asc'));
    const unsubscribeProducts = onSnapshot(productsQ, (snapshot) => {
      const prods = snapshot.docs.map(doc => ({ ...doc.data() } as Product));
      setProducts(prods);
    });

    return () => {
      unsubscribeOrders();
      unsubscribeProducts();
    };
  }, [profile?.isAdmin]);

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      
      // If marking as delivered, decrement stock
      if (newStatus === 'delivered') {
        const order = orders.find(o => o.orderId === orderId);
        if (order && order.status !== 'delivered') {
          const promises = order.items.map(item => {
            const productRef = doc(db, 'products', String(item.id));
            return updateDoc(productRef, {
              stockCount: increment(-item.quantity),
              updatedAt: Timestamp.now()
            });
          });
          await Promise.all(promises);
        }
      }

      await updateDoc(orderRef, { status: newStatus });
    } catch (error) {
      console.error("Error updating order:", error);
      alert("Failed to update status.");
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditingProduct || isSaving) return;
    setIsSaving(true);

    try {
      const productData = {
        ...isEditingProduct,
        id: isEditingProduct.id || Math.random().toString(36).substr(2, 9),
        price: Number(isEditingProduct.price),
        stockCount: Number(isEditingProduct.stockCount),
        inStock: Number(isEditingProduct.stockCount) > 0,
        updatedAt: Timestamp.now(),
        createdAt: isEditingProduct.createdAt || Timestamp.now()
      };

      const productRef = doc(db, 'products', productData.id);
      await setDoc(productRef, productData);
      setIsEditingProduct(null);
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Failed to save product.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string | number) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await deleteDoc(doc(db, 'products', String(id)));
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to delete product.");
    }
  };

  const handleSeedData = async () => {
    if (!window.confirm("This will add all products from the local catalog to Firestore. Continue?")) return;
    setIsSeeding(true);
    try {
      const promises = initialProducts.products.map((p: any) => {
        const productRef = doc(db, 'products', String(p.id));
        return setDoc(productRef, {
          ...p,
          id: String(p.id), // Ensure it's stored as string
          stockCount: p.stockCount || 50,
          inStock: true,
          rating: 4.5,
          reviewCount: Math.floor(Math.random() * 10) + 1,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
      });
      await Promise.all(promises);
      alert("Store seeded successfully! 🦁");
    } catch (error) {
      console.error("Error seeding data:", error);
      alert("Failed to seed data.");
    } finally {
      setIsSeeding(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <RefreshCcw className="h-8 w-8 animate-spin text-brand-primary" />
    </div>
  );

  if (!profile?.isAdmin) {
    return <Navigate to="/" replace />;
  }

  const stats = useMemo(() => ({
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    revenue: orders.filter(o => o.status !== 'cancelled').reduce((acc, o) => acc + o.total, 0),
    inventoryCount: products.length,
    outOfStock: products.filter(p => (p.stockCount !== undefined && p.stockCount <= 0)).length
  }), [orders, products]);

  const filteredProducts = useMemo(() => 
    products.filter(p => 
      p.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      p.category.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      p.id.toString().includes(inventorySearch)
    )
  , [products, inventorySearch]);

  return (
    <div className="min-h-screen bg-[var(--brand-bg)] text-[var(--brand-text)] font-sans">
      {/* Dedicated Admin Sidebar/Nav */}
      <nav className="border-b border-brand-border bg-white dark:bg-zinc-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4 group">
            <div className="flex flex-col">
              <span className="font-display font-black text-2xl tracking-tighter uppercase italic text-brand-primary">
                SIMBA <span className="text-[var(--brand-text)]">ADMIN</span>
              </span>
              <span className="text-zinc-500 font-black text-[8px] tracking-[0.4em] uppercase leading-none">
                CONTROL PANEL
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {profile?.isAdmin && (
              <button 
                onClick={handleSeedData}
                disabled={isSeeding}
                className="flex items-center gap-2 px-6 py-3 bg-brand-primary text-white dark:text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all disabled:opacity-50"
              >
                {isSeeding ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                <span>Seed Catalog</span>
              </button>
            )}
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-6 py-3 bg-rose-500/10 text-rose-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all group"
            >
              <LogOut className="h-4 w-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-12 lg:py-24">
      {/* Notification Toast */}
      <AnimatePresence>
        {newOrderAlert && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-brand-primary text-white px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-4 border border-white/20 backdrop-blur-md"
          >
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center animate-bounce">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80">New Order Received!</p>
              <p className="font-black italic uppercase tracking-tighter">#{newOrderAlert}</p>
            </div>
            <button 
              onClick={() => setNewOrderAlert(null)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
        <div>
          <p className="micro-label mb-2 uppercase font-black text-brand-primary tracking-widest">Admin Control Center</p>
          <h1 className="text-6xl lg:text-8xl font-black tracking-tighter uppercase italic leading-none text-[var(--brand-text)]">
            ADMIN <span className="text-brand-primary">HUB</span>
          </h1>
          
          <div className="flex gap-4 mt-8">
            <button 
              onClick={() => setActiveTab('orders')}
              className={cn(
                "px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-3",
                activeTab === 'orders' 
                  ? "bg-brand-primary text-white shadow-xl shadow-brand-primary/20 scale-105" 
                  : "bg-black/5 dark:bg-white/5 opacity-60 hover:opacity-100"
              )}
            >
              <ShoppingBag className="h-4 w-4" />
              Orders
            </button>
            <button 
              onClick={() => setActiveTab('inventory')}
              className={cn(
                "px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-3",
                activeTab === 'inventory' 
                  ? "bg-brand-primary text-white shadow-xl shadow-brand-primary/20 scale-105" 
                  : "bg-black/5 dark:bg-white/5 opacity-60 hover:opacity-100"
              )}
            >
              <Box className="h-4 w-4" />
              Inventory
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full md:w-auto">
          <div className="bg-black/5 dark:bg-white/5 border border-brand-border p-4 rounded-2xl">
            <p className="text-[9px] font-black uppercase opacity-40 mb-1">{activeTab === 'orders' ? 'Total Orders' : 'Storewide Items'}</p>
            <p className="text-2xl font-black italic">{activeTab === 'orders' ? stats.total : stats.inventoryCount}</p>
          </div>
          {activeTab === 'orders' ? (
            <>
              <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-2xl">
                <p className="text-[9px] font-black uppercase text-orange-500 mb-1">Pending</p>
                <p className="text-2xl font-black italic text-orange-500">{stats.pending}</p>
              </div>
              <div className="bg-brand-primary/10 border border-brand-primary/20 p-4 rounded-2xl col-span-2">
                <p className="text-[9px] font-black uppercase text-brand-primary mb-1">Total Revenue</p>
                <p className="text-2xl font-black italic text-brand-primary">{stats.revenue.toLocaleString()} <span className="text-[8px] not-italic opacity-40">RWF</span></p>
              </div>
            </>
          ) : (
            <>
              <div className={cn(
                "p-4 rounded-2xl border",
                stats.outOfStock > 0 ? "bg-rose-500/10 border-rose-500/20" : "bg-emerald-500/10 border-emerald-500/20"
              )}>
                <p className={cn("text-[9px] font-black uppercase mb-1", stats.outOfStock > 0 ? "text-rose-500" : "text-emerald-500")}>
                  Out of Stock
                </p>
                <p className={cn("text-2xl font-black italic", stats.outOfStock > 0 ? "text-rose-500" : "text-emerald-500")}>
                  {stats.outOfStock}
                </p>
              </div>
              <div className="bg-black/5 dark:bg-white/5 border border-brand-border p-4 rounded-2xl col-span-2 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase opacity-40 mb-1">Inventory Status</p>
                  <p className="text-sm font-black italic opacity-60">System Operational</p>
                </div>
                <Database className="h-8 w-8 opacity-10" />
              </div>
            </>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'orders' ? (
          <motion.div 
            key="orders-tab"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {orders.length === 0 ? (
              <div className="text-center py-32 bg-black/5 dark:bg-white/5 rounded-[48px] border border-dashed border-brand-border">
                <Package className="h-16 w-16 mx-auto mb-6 opacity-10" />
                <p className="font-black italic uppercase text-2xl opacity-20 tracking-tighter">No orders found</p>
              </div>
            ) : (
              orders.map((order) => (
                <motion.div 
                  key={order.orderId}
                  layout
                  className="card-gradient group overflow-hidden"
                >
                  <div className="p-6 lg:p-8 flex flex-col xl:flex-row gap-8">
                    {/* Order Identity (same as before) */}
                    <div className="xl:w-64 shrink-0">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary bg-brand-primary/10 px-3 py-1 rounded-full italic">
                          #{order.orderId}
                        </span>
                        <div className={cn(
                          "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase italic border",
                          STATUS_COLORS[order.status]
                        )}>
                          {STATUS_ICONS[order.status]}
                          {order.status}
                        </div>
                      </div>
                      <p className="text-xs font-bold opacity-40 uppercase mb-6">
                        {order.createdAt instanceof Timestamp ? order.createdAt.toDate().toLocaleString() : 'Recent'}
                      </p>
                      
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-black/5 dark:bg-white/5 rounded-xl flex items-center justify-center">
                            <CreditCard className="h-5 w-5 text-zinc-500" />
                          </div>
                          <div>
                            <p className="text-[9px] font-black uppercase opacity-40">Payment</p>
                            <p className="text-xs font-black uppercase italic">{order.paymentMethod}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-black/5 dark:bg-white/5 rounded-xl flex items-center justify-center">
                            <MapPin className="h-5 w-5 text-zinc-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[9px] font-black uppercase opacity-40">Destination</p>
                            <p className="text-xs font-black uppercase italic truncate max-w-[180px]">{order.address}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Items List (same as before) */}
                    <div className="flex-1 bg-black/5 dark:bg-black/20 rounded-3xl p-6">
                      <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-4">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between gap-4 py-2 border-b border-white/5 last:border-0">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-white/5 rounded-lg overflow-hidden shrink-0">
                                <img src={item.image} alt={item.name} className="w-full h-full object-contain p-2" />
                              </div>
                              <div>
                                <p className="text-sm font-black uppercase italic tracking-tight">{item.name}</p>
                                <p className="text-[10px] font-bold opacity-40">{item.quantity} units @ {formatCurrency(item.price)}</p>
                              </div>
                            </div>
                            <p className="text-sm font-black italic">{formatCurrency(item.price * item.quantity)}</p>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-6 pt-6 border-t border-white/10 flex justify-between items-end">
                        <div>
                          <p className="text-[10px] font-black uppercase opacity-40 mb-1">Customer Total</p>
                          <p className="text-3xl font-black italic text-brand-primary tracking-tighter">{formatCurrency(order.total)}</p>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          {order.status === 'pending' && (
                            <button 
                              onClick={() => updateOrderStatus(order.orderId, 'processing')}
                              className="px-6 py-3 bg-brand-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all hover:scale-105"
                            >
                              Approve & Process
                            </button>
                          )}
                          {order.status === 'processing' && (
                            <button 
                              onClick={() => updateOrderStatus(order.orderId, 'shipped')}
                              className="px-6 py-3 bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all hover:scale-105"
                            >
                              Mark as Shipped
                            </button>
                          )}
                          {order.status === 'shipped' && (
                            <button 
                              onClick={() => updateOrderStatus(order.orderId, 'delivered')}
                              className="px-6 py-3 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all hover:scale-105"
                            >
                              Confirm Delivery
                            </button>
                          )}
                          {order.status !== 'delivered' && order.status !== 'cancelled' && (
                            <button 
                              onClick={() => updateOrderStatus(order.orderId, 'cancelled')}
                              className="px-6 py-3 bg-rose-500/10 text-rose-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all"
                            >
                              Cancel Order
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="inventory-tab"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-8"
          >
            {/* Inventory Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="relative flex-1 group w-full">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500 group-focus-within:text-brand-primary transition-colors" />
                <input 
                  type="text" 
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                  placeholder="Search Inventory by Name, ID or Category..."
                  className="w-full bg-black/5 dark:bg-white/5 border border-brand-border rounded-2xl py-4 pl-14 pr-6 text-sm font-black uppercase italic tracking-tight focus:outline-none focus:border-brand-primary transition-all"
                />
              </div>
              <button 
                onClick={() => setIsEditingProduct({})}
                className="w-full sm:w-auto px-8 py-4 bg-brand-primary text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-orange-600 transition-all active:scale-95 italic"
              >
                <Plus className="h-5 w-5" />
                Add Product
              </button>
            </div>

            <AnimatePresence>
              {isEditingProduct && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <form onSubmit={handleSaveProduct} className="bg-white dark:bg-zinc-900 border border-brand-primary/30 rounded-[40px] p-8 space-y-8 shadow-2xl shadow-brand-primary/10">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-black uppercase italic tracking-tighter">
                        {isEditingProduct.id ? 'Edit Product' : 'New Product'}
                      </h3>
                      <button 
                        type="button"
                        onClick={() => setIsEditingProduct(null)}
                        className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full"
                      >
                        <XCircle className="h-6 w-6" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40 px-2">Product Name</label>
                        <input 
                          required
                          type="text"
                          value={isEditingProduct.name || ''}
                          onChange={e => setIsEditingProduct({...isEditingProduct, name: e.target.value})}
                          placeholder="e.g. Fresh Avocado"
                          className="w-full bg-black/5 dark:bg-black border border-brand-border rounded-xl p-4 font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40 px-2">Category</label>
                        <select 
                          required
                          value={isEditingProduct.category || ''}
                          onChange={e => setIsEditingProduct({...isEditingProduct, category: e.target.value})}
                          className="w-full bg-black/5 dark:bg-black border border-brand-border rounded-xl p-4 font-bold appearance-none"
                        >
                          <option value="">Select Category</option>
                          <option value="Food & Groceries">Food & Groceries</option>
                          <option value="Household">Household</option>
                          <option value="Alcohol">Alcohol</option>
                          <option value="Personal Care">Personal Care</option>
                          <option value="Baby & Kids">Baby & Kids</option>
                          <option value="Kitchenware">Kitchenware</option>
                          <option value="Pet Care">Pet Care</option>
                          <option value="Office Supplies">Office Supplies</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40 px-2">Image URL</label>
                        <div className="relative">
                          <input 
                            required
                            type="url"
                            value={isEditingProduct.image || ''}
                            onChange={e => setIsEditingProduct({...isEditingProduct, image: e.target.value})}
                            placeholder="https://..."
                            className="w-full bg-black/5 dark:bg-black border border-brand-border rounded-xl p-4 pl-12 font-bold"
                          />
                          <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 opacity-40" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40 px-2">Price (RWF)</label>
                        <input 
                          required
                          type="number"
                          value={isEditingProduct.price || ''}
                          onChange={e => setIsEditingProduct({...isEditingProduct, price: Number(e.target.value)})}
                          className="w-full bg-black/5 dark:bg-black border border-brand-border rounded-xl p-4 font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40 px-2">Unit</label>
                        <input 
                          required
                          type="text"
                          value={isEditingProduct.unit || ''}
                          onChange={e => setIsEditingProduct({...isEditingProduct, unit: e.target.value})}
                          placeholder="e.g. piece, kg, box"
                          className="w-full bg-black/5 dark:bg-black border border-brand-border rounded-xl p-4 font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40 px-2">Stock Count</label>
                        <input 
                          required
                          type="number"
                          value={isEditingProduct.stockCount || 0}
                          onChange={e => setIsEditingProduct({...isEditingProduct, stockCount: Number(e.target.value)})}
                          className="w-full bg-black/5 dark:bg-black border border-brand-border rounded-xl p-4 font-bold"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-4">
                      <button 
                        type="button"
                        onClick={() => setIsEditingProduct(null)}
                        className="px-8 py-4 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 rounded-2xl font-black uppercase tracking-widest text-[10px]"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        disabled={isSaving}
                        className="px-12 py-4 bg-brand-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3 disabled:opacity-50"
                      >
                        {isSaving ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save Product
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="bg-black/5 dark:bg-white/5 rounded-[48px] overflow-hidden border border-brand-border">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-black/10 dark:bg-white/10 uppercase font-black text-[10px] tracking-widest italic">
                    <th className="px-8 py-6">Product</th>
                    <th className="px-8 py-6">Category</th>
                    <th className="px-8 py-6 text-right">Price</th>
                    <th className="px-8 py-6 text-center">Stock</th>
                    <th className="px-8 py-6 text-right w-32">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-brand-primary/5 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-lg p-1 shrink-0 border border-brand-border">
                            <img src={product.image} alt={product.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                          </div>
                          <div>
                            <span className="font-black uppercase italic text-sm tracking-tight group-hover:text-brand-primary transition-colors block">
                              {product.name}
                            </span>
                            <span className="text-[9px] font-bold opacity-30 tracking-widest">ID: #{product.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-[10px] font-black uppercase tracking-widest bg-zinc-500/10 text-zinc-500 px-3 py-1 rounded-full italic">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right font-black italic">
                        {formatCurrency(product.price)}
                      </td>
                      <td className="px-8 py-6 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <div className={cn(
                            "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase italic border",
                            (product.stockCount !== undefined && product.stockCount > 0)
                              ? (product.stockCount <= 10 ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20")
                              : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                          )}>
                            {product.stockCount ?? 0} {product.unit}
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button 
                                onClick={() => {
                                  const newStock = Math.max(0, (product.stockCount || 0) - 1);
                                  updateDoc(doc(db, 'products', String(product.id)), { stockCount: newStock, inStock: newStock > 0 });
                                }}
                                className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded"
                             >
                               <Minus className="h-3 w-3" />
                             </button>
                             <button 
                                onClick={() => {
                                  const newStock = (product.stockCount || 0) + 1;
                                  updateDoc(doc(db, 'products', String(product.id)), { stockCount: newStock, inStock: true });
                                }}
                                className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded"
                             >
                               <Plus className="h-3 w-3" />
                             </button>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setIsEditingProduct(product)}
                            className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl hover:bg-indigo-500 hover:text-white transition-all scale-90"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(product.id)}
                            className="p-3 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all scale-90"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredProducts.length === 0 && (
                <div className="py-24 text-center">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-10" />
                  <p className="font-black italic uppercase opacity-20">No matching products found</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </div>
  );
}
