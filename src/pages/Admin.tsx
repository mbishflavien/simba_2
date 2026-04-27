import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, Timestamp, addDoc, deleteDoc, setDoc, increment } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useAuth } from '../components/AuthProvider';
import { Order, Product } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
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
  Zap,
  Globe,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import initialProducts from '../data/products.json';

const STATUS_ICONS = {
  pending: <Clock className="h-4 w-4" />,
  processing: <RefreshCcw className="h-4 w-4 animate-spin" />,
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

const COLORS = ['#f97316', '#FFCC00', '#f59e0b', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899'];

export default function AdminDashboard() {
  const { t, i18n } = useTranslation();
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'inventory'>('overview');
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
      alert(t('update_error'));
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
      alert(t('save_error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string | number) => {
    if (!window.confirm(t('delete_confirm'))) return;
    try {
      await deleteDoc(doc(db, 'products', String(id)));
    } catch (error) {
      console.error("Error deleting product:", error);
      alert(t('delete_error'));
    }
  };

  const handleSeedData = async () => {
    if (!window.confirm(t('confirm_seed'))) return;
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
      alert(t('seed_success'));
    } catch (error) {
      console.error("Error seeding data:", error);
      alert(t('seed_error'));
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

  const stats = useMemo(() => {
    const deliveredOrders = orders.filter(o => o.status === 'delivered');
    const totalRevenue = deliveredOrders.reduce((acc, o) => acc + o.total, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayOrders = deliveredOrders.filter(o => {
      const d = o.createdAt instanceof Timestamp ? o.createdAt.toDate() : new Date();
      return d >= today;
    });

    const todayRevenue = todayOrders.reduce((acc, o) => acc + o.total, 0);

    return {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      revenue: totalRevenue,
      todayRevenue: todayRevenue,
      inventoryCount: products.length,
      outOfStock: products.filter(p => (p.stockCount !== undefined && p.stockCount <= 0)).length
    };
  }, [orders, products]);

  const salesData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      return d;
    }).reverse();

    return last7Days.map(date => {
      const dayOrders = orders.filter(o => {
        if (o.status === 'cancelled') return false;
        const d = o.createdAt instanceof Timestamp ? o.createdAt.toDate() : new Date();
        const compareDate = new Date(d);
        compareDate.setHours(0, 0, 0, 0);
        return compareDate.getTime() === date.getTime();
      });

      return {
        name: date.toLocaleDateString(undefined, { weekday: 'short' }),
        revenue: dayOrders.reduce((acc, o) => acc + o.total, 0),
        orders: dayOrders.length
      };
    });
  }, [orders]);

  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.filter(o => o.status !== 'cancelled').forEach(o => {
      o.items.forEach(item => {
        const cat = item.category || 'Other';
        counts[cat] = (counts[cat] || 0) + (item.price * item.quantity);
      });
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [orders]);

  const topProducts = useMemo(() => {
    const itemCounts: Record<string, { name: string, quantity: number, revenue: number }> = {};
    orders.filter(o => o.status === 'delivered').forEach(order => {
      order.items.forEach(item => {
        if (!itemCounts[item.id]) {
          itemCounts[item.id] = { name: item.name, quantity: 0, revenue: 0 };
        }
        itemCounts[item.id].quantity += item.quantity;
        itemCounts[item.id].revenue += item.price * item.quantity;
      });
    });
    return Object.values(itemCounts).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [orders]);

  const filteredProducts = useMemo(() => 
    products.filter(p => 
      p.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(inventorySearch.toLowerCase())) ||
      p.id.toString().includes(inventorySearch)
    )
  , [products, inventorySearch]);

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'Français' },
    { code: 'rw', name: 'Kinyarwanda' }
  ];

  return (
    <div className="min-h-screen bg-[var(--brand-bg)] text-[var(--brand-text)] font-sans">
      {/* Dedicated Admin Sidebar/Nav */}
      <nav className="border-b border-brand-border bg-white dark:bg-zinc-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-4 group">
            <div className="flex flex-col">
              <span className="font-display font-black text-2xl tracking-tighter uppercase italic text-brand-primary">
                SIMBA <span className="text-[var(--brand-text)]">ADMIN</span>
              </span>
              <span className="text-zinc-500 font-black text-[8px] tracking-[0.4em] uppercase leading-none">
                {t('admin_control_panel')}
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-4 lg:gap-6">
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-black/5 dark:bg-white/5 rounded-2xl border border-brand-border">
              <Globe className="h-3.5 w-3.5 text-brand-primary" />
              <select 
                value={i18n.language}
                onChange={(e) => i18n.changeLanguage(e.target.value)}
                className="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer"
              >
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code} className="text-black">{lang.name}</option>
                ))}
              </select>
            </div>

            {profile?.isAdmin && (
              <button 
                onClick={handleSeedData}
                disabled={isSeeding}
                className="flex items-center gap-2 px-6 py-3 bg-brand-primary text-white dark:text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg shadow-brand-primary/20 disabled:opacity-50"
              >
                {isSeeding ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                <span className="hidden md:inline">{t('seed_catalog')}</span>
              </button>
            )}
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-6 py-3 bg-rose-500/10 text-rose-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all group"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline">{t('logout')}</span>
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
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80">{t('new_order_received')}</p>
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
          <p className="micro-label mb-2 uppercase font-black text-brand-primary tracking-widest">{t('admin_control_panel')}</p>
          <h1 className="text-6xl lg:text-8xl font-black tracking-tighter uppercase italic leading-none text-[var(--brand-text)]">
            ADMIN <span className="text-brand-primary">HUB</span>
          </h1>
          
          <div className="flex flex-wrap gap-4 mt-8">
            <button 
              onClick={() => setActiveTab('overview')}
              className={cn(
                "px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-3",
                activeTab === 'overview' 
                  ? "bg-brand-primary text-white shadow-xl shadow-brand-primary/20 scale-105" 
                  : "bg-black/5 dark:bg-white/5 opacity-60 hover:opacity-100"
              )}
            >
              <TrendingUp className="h-4 w-4" />
              {t('overview')}
            </button>
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
              {t('orders')}
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
              {t('inventory')}
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full md:w-auto">
          <div className="bg-black/5 dark:bg-white/5 border border-brand-border p-4 rounded-2xl">
            <p className="text-[9px] font-black uppercase opacity-40 mb-1">{t('total_orders')}</p>
            <p className="text-2xl font-black italic">{stats.total}</p>
          </div>
          <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-2xl">
            <p className="text-[9px] font-black uppercase text-orange-500 mb-1">{t('pending')}</p>
            <p className="text-2xl font-black italic text-orange-500">{stats.pending}</p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl">
             <p className="text-[9px] font-black uppercase text-emerald-500 mb-1">{t('today_sales')}</p>
             <p className="text-2xl font-black italic text-emerald-500">{stats.todayRevenue.toLocaleString()} <span className="text-[8px] not-italic opacity-40">RWF</span></p>
          </div>
          <div className="bg-brand-primary/10 border border-brand-primary/20 p-4 rounded-2xl">
            <p className="text-[9px] font-black uppercase text-brand-primary mb-1">{t('total_revenue')}</p>
            <p className="text-2xl font-black italic text-brand-primary">{stats.revenue.toLocaleString()} <span className="text-[8px] not-italic opacity-40">RWF</span></p>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' ? (
          <motion.div
            key="overview-tab"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Sales Chart */}
              <div className="lg:col-span-2 bg-white dark:bg-black/20 border border-brand-border p-8 rounded-[48px]">
                <div className="flex items-center justify-between mb-8 px-2">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-5 w-5 text-brand-primary" />
                    <h3 className="font-black uppercase italic tracking-tighter text-xl">{t('sales_trend')}</h3>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest opacity-40">{t('last_7_days')}</span>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesData}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 10, fontWeight: 900, fill: 'currentColor', opacity: 0.4}} 
                      />
                      <YAxis 
                        hide 
                        axisLine={false} 
                        tickLine={false} 
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#000', 
                          border: 'none', 
                          borderRadius: '16px',
                          color: '#fff',
                          fontSize: '10px',
                          fontWeight: 900,
                          textTransform: 'uppercase'
                        }}
                        itemStyle={{ color: '#fff' }}
                        cursor={{ stroke: '#f97316', strokeWidth: 2 }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#f97316" 
                        strokeWidth={4}
                        fillOpacity={1} 
                        fill="url(#colorRevenue)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="bg-white dark:bg-black/20 border border-brand-border p-8 rounded-[48px]">
                <div className="flex items-center gap-3 mb-8 px-2">
                  <PieChartIcon className="h-5 w-5 text-brand-primary" />
                  <h3 className="font-black uppercase italic tracking-tighter text-xl">{t('revenue_by_category')}</h3>
                </div>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                         contentStyle={{ 
                          backgroundColor: '#000', 
                          border: 'none', 
                          borderRadius: '16px',
                          color: '#fff',
                          fontSize: '10px',
                          fontWeight: 900,
                          textTransform: 'uppercase'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-3">
                  {categoryData.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        <span className="text-[10px] font-black uppercase italic opacity-60 truncate max-w-[120px]">{item.name}</span>
                      </div>
                      <span className="text-[10px] font-black italic">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Daily Sales Table (Demonstrated on chart already above, but let's add a top-sold section) */}
              <div className="bg-white dark:bg-black/20 border border-brand-border p-8 rounded-[48px]">
                <div className="flex items-center gap-3 mb-8 px-2">
                  <ShoppingBasket className="h-5 w-5 text-brand-primary" />
                  <h3 className="font-black uppercase italic tracking-tighter text-xl">{t('top_selling_products')}</h3>
                </div>
                <div className="space-y-4">
                  {topProducts.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-brand-border group hover:border-brand-primary/50 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-brand-primary text-white rounded-xl flex items-center justify-center font-black italic">
                          #{idx + 1}
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase italic truncate max-w-[200px]">{item.name}</p>
                          <p className="text-[9px] font-bold opacity-40 uppercase tracking-widest">{item.quantity} {t('total_sold')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black italic">{formatCurrency(item.revenue)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Summary Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-black/20 border border-brand-border p-8 rounded-[40px] flex flex-col justify-between">
                  <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mb-6">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase opacity-40 mb-1">{t('delivery_vs_pickup')}</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-black italic">{orders.filter(o => o.address).length}</p>
                      <span className="text-[10px] font-bold opacity-20 uppercase tracking-widest">/ {orders.filter(o => !o.address).length}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white dark:bg-black/20 border border-brand-border p-8 rounded-[40px] flex flex-col justify-between">
                  <div className="w-12 h-12 bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center mb-6">
                    <CreditCard className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase opacity-40 mb-1">{t('average_order_value')}</p>
                    <p className="text-3xl font-black italic">
                      {Math.round(stats.revenue / (orders.length || 1)).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="bg-white dark:bg-black/20 border border-brand-border p-8 rounded-[40px] flex flex-col justify-between">
                   <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-2xl flex items-center justify-center mb-6">
                      <ShoppingBag className="h-6 w-6" />
                   </div>
                   <div>
                      <p className="text-[9px] font-black uppercase opacity-40 mb-1">{t('sales_performance')}</p>
                      <p className="text-3xl font-black italic">+{Math.round((stats.todayRevenue / (stats.revenue || 1)) * 100)}%</p>
                   </div>
                </div>
                <div className="bg-white dark:bg-black/20 border border-brand-border p-8 rounded-[40px] flex flex-col justify-between">
                   <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mb-6">
                      <RefreshCcw className="h-6 w-6" />
                   </div>
                   <div>
                      <p className="text-[9px] font-black uppercase opacity-40 mb-1">{t('inventory_status')}</p>
                      <p className="text-xl font-black italic uppercase tracking-tighter text-emerald-500">100% OK</p>
                   </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : activeTab === 'orders' ? (
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
                <p className="font-black italic uppercase text-2xl opacity-20 tracking-tighter">{t('no_orders_found')}</p>
              </div>
            ) : (
              orders.map((order) => (
                <motion.div 
                  key={order.orderId}
                  layout
                  className="card-gradient group overflow-hidden"
                >
                  <div className="p-6 lg:p-8 flex flex-col xl:flex-row gap-8">
                    {/* Order Identity */}
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
                          {t(order.status)}
                        </div>
                      </div>
                      <p className="text-xs font-bold opacity-40 uppercase mb-6">
                        {order.createdAt instanceof Timestamp ? order.createdAt.toDate().toLocaleString() : t('recent')}
                      </p>
                      
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-black/5 dark:bg-white/5 rounded-xl flex items-center justify-center">
                            <CreditCard className="h-5 w-5 text-zinc-500" />
                          </div>
                          <div>
                            <p className="text-[9px] font-black uppercase opacity-40">{t('payment')}</p>
                            <p className="text-xs font-black uppercase italic">{order.paymentMethod}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-black/5 dark:bg-white/5 rounded-xl flex items-center justify-center">
                            <MapPin className="h-5 w-5 text-zinc-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[9px] font-black uppercase opacity-40">{t('destination')}</p>
                            <p className="text-xs font-black uppercase italic truncate max-w-[180px]">{order.address}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Items List */}
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
                                <p className="text-[10px] font-bold opacity-40 uppercase tracking-tight">
                                  {item.quantity} {t('items')} @ {formatCurrency(item.price)}
                                </p>
                              </div>
                            </div>
                            <p className="text-sm font-black italic">{formatCurrency(item.price * item.quantity)}</p>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-6 pt-6 border-t border-white/10 flex justify-between items-end">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase opacity-40">{t('order_summary')}</p>
                          <p className="text-3xl font-black italic text-brand-primary tracking-tighter leading-none">{formatCurrency(order.total)}</p>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          {order.status === 'pending' && (
                            <button 
                              onClick={() => updateOrderStatus(order.orderId, 'processing')}
                              className="px-6 py-3 bg-brand-primary text-white dark:text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all hover:scale-105"
                            >
                              {t('approve_process')}
                            </button>
                          )}
                          {order.status === 'processing' && (
                            <button 
                              onClick={() => updateOrderStatus(order.orderId, 'shipped')}
                              className="px-6 py-3 bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all hover:scale-105"
                            >
                              {t('mark_shipped')}
                            </button>
                          )}
                          {order.status === 'shipped' && (
                            <button 
                              onClick={() => updateOrderStatus(order.orderId, 'delivered')}
                              className="px-6 py-3 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all hover:scale-105"
                            >
                              {t('confirm_delivery')}
                            </button>
                          )}
                          {order.status !== 'delivered' && order.status !== 'cancelled' && (
                            <button 
                              onClick={() => updateOrderStatus(order.orderId, 'cancelled')}
                              className="px-6 py-3 bg-rose-500/10 text-rose-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all text-center"
                            >
                              {t('cancel_order')}
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
                  placeholder={t('search_inventory_placeholder')}
                  className="w-full bg-black/5 dark:bg-white/5 border border-brand-border rounded-2xl py-4 pl-14 pr-6 text-sm font-black uppercase italic tracking-tight focus:outline-none focus:border-brand-primary transition-all"
                />
              </div>
              <button 
                onClick={() => setIsEditingProduct({})}
                className="w-full sm:w-auto px-8 py-4 bg-brand-primary text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-orange-600 transition-all active:scale-95 italic shadow-xl shadow-brand-primary/20"
              >
                <Plus className="h-5 w-5" />
                {t('add_product')}
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
                        {isEditingProduct.id ? t('edit_product') : t('new_product')}
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
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40 px-2">{t('product_name')}</label>
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
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40 px-2">{t('category')}</label>
                        <select 
                          required
                          value={isEditingProduct.category || ''}
                          onChange={e => setIsEditingProduct({...isEditingProduct, category: e.target.value})}
                          className="w-full bg-black/5 dark:bg-black border border-brand-border rounded-xl p-4 font-bold appearance-none"
                        >
                          <option value="">Select Category</option>
                          <option value="Food & Groceries">Food & Groceries</option>
                          <option value="Household">Household</option>
                          <option value="Alcoholic Drinks">Alcoholic Drinks</option>
                          <option value="Personal Care">Personal Care</option>
                          <option value="Baby & Kids">Baby & Kids</option>
                          <option value="Kitchenware">Kitchenware</option>
                          <option value="Pet Care">Pet Care</option>
                          <option value="Office Supplies">Office Supplies</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40 px-2">{t('image_url')}</label>
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
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40 px-2">{t('price_rwf')}</label>
                        <input 
                          required
                          type="number"
                          value={isEditingProduct.price || ''}
                          onChange={e => setIsEditingProduct({...isEditingProduct, price: Number(e.target.value)})}
                          className="w-full bg-black/5 dark:bg-black border border-brand-border rounded-xl p-4 font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40 px-2">{t('unit')}</label>
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
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-40 px-2">{t('stock_count')}</label>
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
                        {t('cancel')}
                      </button>
                      <button 
                        type="submit"
                        disabled={isSaving}
                        className="px-12 py-4 bg-brand-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3 disabled:opacity-50"
                      >
                        {isSaving ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        {t('save_product')}
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
                    <th className="px-8 py-6">{t('product_table')}</th>
                    <th className="px-8 py-6">{t('category_table')}</th>
                    <th className="px-8 py-6 text-right">{t('price_table')}</th>
                    <th className="px-8 py-6 text-center">{t('stock_table')}</th>
                    <th className="px-8 py-6 text-right w-32">{t('actions_table')}</th>
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
                  <p className="font-black italic uppercase opacity-20">{t('no_matching_products')}</p>
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
