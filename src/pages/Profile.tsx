import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthProvider';
import { useWishlist } from '../hooks/useWishlist';
import { db, handleFirestoreError } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { Order, Product } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { SIMBA_BRANCHES } from '../components/BranchMap';
import { ProductCard } from '../components/ProductCard';
import { 
  Package, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  Truck, 
  AlertCircle, 
  User as UserIcon,
  MapPin,
  Mail,
  Calendar,
  Settings,
  Heart
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Profile() {
  const { user, profile } = useAuth();
  const { wishlistIds, loading: wishlistLoading } = useWishlist();
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist'>('orders');

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        ...doc.data()
      })) as Order[];
      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching orders:", error);
      handleFirestoreError(error, 'list', 'orders');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (wishlistIds.length === 0) {
      setWishlistProducts([]);
      return;
    }

    // Fetch products that are in the wishlist
    // Note: 'in' query limited to 30 items
    const productIds = wishlistIds.map(id => Number(id));
    const q = query(
      collection(db, 'products'),
      where('id', 'in', productIds.slice(0, 30))
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prods = snapshot.docs.map(doc => ({ ...doc.data() } as Product));
      setWishlistProducts(prods);
    }, (error) => {
      console.error("Error fetching wishlist products:", error);
    });

    return () => unsubscribe();
  }, [wishlistIds]);

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-32 text-center">
        <h2 className="massive-header opacity-20 uppercase italic mb-8">{t('access_denied')}</h2>
        <p className="micro-label !opacity-60">{t('please_login_to_view_profile')}</p>
      </div>
    );
  }

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'delivered': return 'text-green-500 bg-green-500/10';
      case 'cancelled': return 'text-red-500 bg-red-500/10';
      case 'pending': return 'text-amber-500 bg-amber-500/10';
      default: return 'text-brand-primary bg-brand-primary/10';
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'delivered': return <CheckCircle2 className="h-4 w-4" />;
      case 'cancelled': return <AlertCircle className="h-4 w-4" />;
      case 'shipped': return <Truck className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-16 sm:py-24">
      {/* Profile Header */}
      <div className="mb-16 border-b border-brand-border pb-12">
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
          <div className="w-32 h-32 rounded-[40px] bg-brand-primary/10 flex items-center justify-center border-2 border-brand-primary/20">
            <UserIcon className="h-16 w-16 text-brand-primary" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-5xl sm:text-7xl font-black italic uppercase tracking-tighter text-[var(--brand-text)] mb-4">
              {profile?.displayName || user.email?.split('@')[0]}
            </h1>
            {profile?.isAdmin && (
              <Link 
                to="/admin" 
                className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-primary/10 text-brand-primary border border-brand-primary/20 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-brand-primary hover:text-white transition-all mb-4"
              >
                <Settings className="h-3 w-3" />
                Admin Dashboard
              </Link>
            )}
            <div className="flex flex-wrap justify-center md:justify-start gap-6 opacity-60">
              <div className="flex items-center gap-2 micro-label">
                <Mail className="h-3 w-3" />
                {user.email}
              </div>
              {profile?.address && (
                <div className="flex items-center gap-2 micro-label">
                  <MapPin className="h-3 w-3" />
                  {profile.address}
                </div>
              )}
              <div className="flex items-center gap-2 micro-label">
                <Calendar className="h-3 w-3" />
                Joined {user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'Recently'}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex gap-12 mb-16 border-b border-brand-border">
          <button 
            onClick={() => setActiveTab('orders')}
            className={cn(
              "pb-6 text-[10px] font-black uppercase tracking-[0.2em] italic transition-all relative flex items-center gap-2",
              activeTab === 'orders' ? "text-brand-primary" : "text-[var(--brand-text)] opacity-40 hover:opacity-100"
            )}
          >
            <Package className="h-4 w-4" />
            {t('order_history')} ({orders.length})
            {activeTab === 'orders' && <motion.div layoutId="profile-tab" className="absolute bottom-[-1px] left-0 right-0 h-1 bg-brand-primary rounded-full" />}
          </button>
          <button 
            onClick={() => setActiveTab('wishlist')}
            className={cn(
              "pb-6 text-[10px] font-black uppercase tracking-[0.2em] italic transition-all relative flex items-center gap-2",
              activeTab === 'wishlist' ? "text-brand-primary" : "text-[var(--brand-text)] opacity-40 hover:opacity-100"
            )}
          >
            <Heart className="h-4 w-4" />
            {t('my_wishlist')} ({wishlistIds.length})
            {activeTab === 'wishlist' && <motion.div layoutId="profile-tab" className="absolute bottom-[-1px] left-0 right-0 h-1 bg-brand-primary rounded-full" />}
          </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
        {/* Order List */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {activeTab === 'orders' ? (
              <motion.div
                key="orders-list"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-3xl font-black italic uppercase tracking-tighter text-[var(--brand-text)]">
                    {t('order_history')} <span className="text-brand-primary">({orders.length})</span>
                  </h2>
                </div>

                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-32 bg-black/5 dark:bg-white/5 rounded-[30px] animate-pulse" />
                    ))}
                  </div>
                ) : orders.length === 0 ? (
                  <div className="card-gradient p-12 text-center">
                    <Package className="h-12 w-12 text-zinc-500 mx-auto mb-4 opacity-20" />
                    <p className="micro-label opacity-40 uppercase">{t('no_orders_yet')}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <motion.button
                        key={order.orderId}
                        onClick={() => setSelectedOrder(order)}
                        layoutId={order.orderId}
                        className={cn(
                          "w-full text-left card-gradient p-6 sm:p-8 flex items-center gap-6 transition-all group",
                          selectedOrder?.orderId === order.orderId ? "ring-2 ring-brand-primary" : "hover:scale-[1.01]"
                        )}
                      >
                        <div className="w-16 h-16 bg-black/5 dark:bg-black rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-brand-primary/10 transition-colors">
                          <Package className="h-8 w-8 text-brand-primary opacity-40 group-hover:opacity-100" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="micro-label text-[10px] !opacity-40 uppercase tracking-widest mb-1">
                                #{order.orderId.slice(-8).toUpperCase()}
                              </p>
                              <h3 className="font-black text-lg sm:text-xl italic uppercase tracking-tight text-[var(--brand-text)]">
                                {order.createdAt instanceof Timestamp ? order.createdAt.toDate().toLocaleDateString() : new Date(order.createdAt).toLocaleDateString()}
                              </h3>
                            </div>
                            <div className={cn(
                              "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5",
                              getStatusColor(order.status)
                            )}>
                              {getStatusIcon(order.status)}
                              {order.status}
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-end">
                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-tight italic">
                              {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                            </p>
                            <p className="text-xl font-black italic tracking-tighter text-brand-primary">
                              {order.total.toLocaleString()} <span className="text-[9px] not-italic font-bold opacity-30 tracking-widest text-[var(--brand-text)]">RWF</span>
                            </p>
                          </div>
                        </div>
                        
                        <ChevronRight className="h-6 w-6 text-zinc-500 opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      </motion.button>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="wishlist-list"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="flex justify-between items-center mb-12">
                  <div>
                    <h2 className="text-4xl font-black italic uppercase tracking-tighter text-[var(--brand-text)] mb-2">
                      {t('my_wishlist')} <span className="text-rose-500">({wishlistIds.length})</span>
                    </h2>
                    <p className="micro-label opacity-40">{t('wishlist_desc')}</p>
                  </div>
                </div>

                {wishlistLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="aspect-[4/5] bg-black/5 dark:bg-white/5 rounded-[40px] animate-pulse" />
                    ))}
                  </div>
                ) : wishlistProducts.length === 0 ? (
                  <div className="text-center py-32 bg-black/5 dark:bg-white/5 rounded-[64px] border border-dashed border-brand-border px-8">
                    <Heart className="h-16 w-16 text-rose-500 mx-auto mb-8 opacity-20" />
                    <p className="text-xl font-black uppercase italic opacity-40 leading-tight max-w-xs mx-auto mb-10">
                      {t('no_wishlist_items')}
                    </p>
                    <Link to="/" className="btn-primary inline-block">
                      {t('start_shopping')}
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-12">
                    {wishlistProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Detail Side Board (Only for Orders) */}
        <div className="lg:col-span-1">
          <AnimatePresence mode="wait">
            {activeTab === 'orders' ? (
              selectedOrder ? (
                <motion.div
                  key={selectedOrder.orderId}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-black/5 dark:bg-white/5 border border-brand-border p-8 sm:p-10 rounded-[40px] sticky top-32"
                >
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter text-[var(--brand-text)]">
                      {t('order_details')}
                    </h3>
                    <button 
                      onClick={() => setSelectedOrder(null)}
                      className="micro-label hover:text-brand-primary transition-colors uppercase"
                    >
                      {t('close')}
                    </button>
                  </div>

                  <div className="space-y-6 mb-8 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex gap-4 items-center">
                        <div className="w-12 h-12 bg-black/5 dark:bg-black rounded-xl overflow-hidden shrink-0">
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            className="w-full h-full object-contain p-2 grayscale" 
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-xs uppercase italic truncate text-[var(--brand-text)]">
                            {item.name}
                          </h4>
                          <p className="text-[10px] font-bold opacity-40 uppercase">
                            {item.quantity} x {formatCurrency(item.price)}
                          </p>
                        </div>
                        <div className="font-black italic text-xs text-[var(--brand-text)]">
                          {formatCurrency(item.price * item.quantity)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4 pt-6 border-t border-brand-border">
                    <div className="flex justify-between micro-label !opacity-40 uppercase">
                      <span>{t('payment')}</span>
                      <span className="text-[var(--brand-text)] font-black italic">{selectedOrder.paymentMethod.toUpperCase()}</span>
                    </div>
                    {selectedOrder.pickupBranch && (
                      <div className="flex justify-between micro-label !opacity-40 uppercase">
                        <span>{t('pickup_branch')}</span>
                        <span className="text-brand-primary font-black italic">
                          {SIMBA_BRANCHES.find(b => b.id === selectedOrder.pickupBranch)?.name || selectedOrder.pickupBranch}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between micro-label !opacity-40 uppercase">
                      <span>{selectedOrder.pickupBranch ? 'PICKUP' : t('shipping')}</span>
                      <span className="text-[var(--brand-text)] truncate max-w-[150px]" title={selectedOrder.address}>
                        {selectedOrder.address}
                      </span>
                    </div>
                    <div className="flex justify-between items-end pt-4">
                      <span className="font-black italic uppercase tracking-tighter text-xl text-[var(--brand-text)]">
                        {t('total')}
                      </span>
                      <span className="text-3xl font-black italic tracking-tighter text-brand-primary">
                        {formatCurrency(selectedOrder.total)}
                      </span>
                    </div>
                    
                    {selectedOrder.paymentMethod === 'cash' && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 p-4 bg-brand-primary/5 border border-brand-primary/20 rounded-2xl flex gap-3 items-start"
                      >
                        <AlertCircle className="h-4 w-4 text-brand-primary shrink-0 mt-0.5" />
                        <p className="text-[10px] font-bold uppercase leading-tight text-brand-primary italic">
                          {t('pickup_reception_note')}
                        </p>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <div className="h-full flex items-center justify-center p-12 bg-black/5 dark:bg-white/5 border border-dashed border-brand-border rounded-[40px] min-h-[300px]">
                  <p className="micro-label opacity-20 uppercase italic text-center">
                    {t('select_order_to_view_details')}
                  </p>
                </div>
              )
            ) : (
              <div className="bg-rose-500/5 border border-rose-500/10 rounded-[40px] p-10 sticky top-32">
                <h4 className="text-xl font-black italic uppercase tracking-tighter text-[var(--brand-text)] mb-6">
                  WHY WISHLIST?
                </h4>
                <div className="space-y-8">
                  <div className="flex gap-4">
                    <CheckCircle2 className="h-5 w-5 text-rose-500 shrink-0" />
                    <p className="text-[10px] font-bold uppercase leading-snug tracking-tight text-[var(--brand-text)] opacity-60">
                      Save products for later when you are ready to buy.
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <CheckCircle2 className="h-5 w-5 text-rose-500 shrink-0" />
                    <p className="text-[10px] font-bold uppercase leading-snug tracking-tight text-[var(--brand-text)] opacity-60">
                      Monitor price changes and restock updates easily.
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <CheckCircle2 className="h-5 w-5 text-rose-500 shrink-0" />
                    <p className="text-[10px] font-bold uppercase leading-snug tracking-tight text-[var(--brand-text)] opacity-60">
                      Access your favorite items from any device.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
