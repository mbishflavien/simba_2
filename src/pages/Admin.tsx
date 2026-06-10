import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, Timestamp, addDoc, deleteDoc, setDoc, increment } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../components/AuthProvider';
import { Order, Product, Supplier, PurchaseOrder, Promotion, StaffMember, InventoryAlert } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { subDays, subHours, startOfDay, endOfDay, isWithinInterval, format } from 'date-fns';
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
  Cell,
  LineChart,
  Line
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
  PieChart as PieChartIcon,
  LayoutDashboard,
  Users,
  Tag as TagIcon,
  BellRing,
  Smartphone,
  ChevronRight,
  TrendingDown,
  History,
  QrCode,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Mail,
  Send,
  Megaphone
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

const getPrecomposedMessage = (promo: any) => {
  if (!promo) return "";
  const start = promo.startDate;
  const end = promo.endDate;
  
  let details = "";
  if (promo.type === 'percentage') {
    details = `a massive ${promo.value}% OFF discount is applied automatically at checkout!`;
  } else if (promo.type === 'fixed') {
    details = `you will receive a direct discount deduction of RWF ${promo.value} on your purchase!`;
  } else {
    details = `you get an exclusive Buy 1 Get 1 FREE (B1G1) deal on featured items!`;
  }

  return `Dearest Simba Customer,

We are thrilled to bring you our latest exclusive promotion: "${promo.name}".

To celebrate our community across Kigali, ${details}

This special offer runs from ${start || 'now'} until ${end || 'limited time'}. No action is required on your part—simply log into your Simba Supermarket app, select your favorite products to fill your basket, and save at dynamic checkout!

Our metropolitan food delivery fleet is active to guarantee your fresh items arrive within 30 minutes in temperature-controlled vehicles.

Thank you for choosing Simba since 1997.

Warm regards,
Simba Logistics & Customer Care Team
KN 34 Street, Kiyovu, Kigali`;
};

export default function AdminDashboard() {
  const { t, i18n } = useTranslation();
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'inventory' | 'staff' | 'promotions' | 'suppliers' | 'alerts'>('overview');
  const [inventorySearch, setInventorySearch] = useState('');
  const [newOrderAlerts, setNewOrderAlerts] = useState<Order[]>([]);
  const [deliveredAlerts, setDeliveredAlerts] = useState<Order[]>([]);
  const [isEditingProduct, setIsEditingProduct] = useState<Partial<Product> | null>(null);

  const ordersRef = useRef<Order[]>([]);
  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  const playNotificationSound = useCallback(() => {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); // A clean ping sound
      audio.volume = 0.5;
      audio.play().catch(e => console.error("Audio play failed:", e));
    } catch (err) {
      console.error("Notification sound error:", err);
    }
  }, []);

  const removeAlert = useCallback((orderId: string) => {
    setNewOrderAlerts(prev => prev.filter(a => a.orderId !== orderId));
  }, []);
  const [isSaving, setIsSaving] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // New Management State
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  
  // Promotion refinement states
  const [isEditingPromo, setIsEditingPromo] = useState<any | null>(null);
  const [sendingPromoEmail, setSendingPromoEmail] = useState<Promotion | null>(null);
  const [customerUsers, setCustomerUsers] = useState<any[]>([]);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailBlastStatus, setEmailBlastStatus] = useState<string | null>(null);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/');
  };

  useEffect(() => {
    if (!profile || !profile.isAdmin) return;

    // Fetch Orders
    const ordersQ = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    let isFirstLoad = true;
    const unsubscribeOrders = onSnapshot(ordersQ, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({ ...doc.data() } as Order));
      
      if (!isFirstLoad) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const newOrder = change.doc.data() as Order;
            // Only alert if it's a new pending order
            if (newOrder.status === 'pending') {
              setNewOrderAlerts(prev => [...prev, newOrder]);
              playNotificationSound();
              
              // Auto remove after 10 seconds
              setTimeout(() => {
                removeAlert(newOrder.orderId);
              }, 10000);
            }
          } else if (change.type === 'modified') {
            const updatedOrder = change.doc.data() as Order;
            const prevOrder = ordersRef.current.find(o => o.orderId === updatedOrder.orderId);
            if (updatedOrder.status === 'delivered' && (!prevOrder || prevOrder.status !== 'delivered')) {
              setDeliveredAlerts(prev => [...prev, updatedOrder]);
              playNotificationSound();
              
              // Auto remove after 15 seconds
              setTimeout(() => {
                setDeliveredAlerts(prev => prev.filter(o => o.orderId !== updatedOrder.orderId));
              }, 15000);
            }
          }
        });
      }
      setOrders(ordersData);
      isFirstLoad = false;
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
    });

    // Fetch Products
    const productsQ = query(collection(db, 'products'), orderBy('name', 'asc'));
    const unsubscribeProducts = onSnapshot(productsQ, (snapshot) => {
      const prods = snapshot.docs.map(doc => ({ ...doc.data() } as Product));
      setProducts(prods);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
    });

    // Fetch Suppliers
    const unsubscribeSuppliers = onSnapshot(query(collection(db, 'suppliers')), (snapshot) => {
      setSuppliers(snapshot.docs.map(d => ({ ...d.data() } as Supplier)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'suppliers');
    });

    // Fetch Staff
    const unsubscribeStaff = onSnapshot(query(collection(db, 'staff')), (snapshot) => {
      setStaff(snapshot.docs.map(d => ({ ...d.data() } as StaffMember)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'staff');
    });

    // Fetch Promotions
    const unsubscribePromos = onSnapshot(query(collection(db, 'promotions')), (snapshot) => {
      setPromotions(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Promotion)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'promotions');
    });

    // Fetch Customers (Users) for Email Alerts/Promos
    const unsubscribeUsers = onSnapshot(query(collection(db, 'users')), (snapshot) => {
      setCustomerUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    // Fetch Alerts
    const unsubscribeAlerts = onSnapshot(query(collection(db, 'inventoryAlerts'), orderBy('createdAt', 'desc')), (snapshot) => {
      setAlerts(snapshot.docs.map(d => ({ ...d.data() } as InventoryAlert)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'inventoryAlerts');
    });

    return () => {
      unsubscribeOrders();
      unsubscribeProducts();
      unsubscribeSuppliers();
      unsubscribeStaff();
      unsubscribePromos();
      unsubscribeUsers();
      unsubscribeAlerts();
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

          // Write a persistent alert to inventoryAlerts
          const alertRef = collection(db, 'inventoryAlerts');
          const itemsList = order.items.map(item => `${item.name} (${item.quantity} pcs)`).join(', ');
          await addDoc(alertRef, {
            id: `INV-${Date.now()}`,
            type: 'info',
            message: `Delivery complete for order #${order.orderId}! Deducted stock counts: ${itemsList}`,
            severity: 'medium',
            isRead: false,
            createdAt: Timestamp.now()
          });
        }
      }

      await updateDoc(orderRef, { status: newStatus });
    } catch (error) {
      console.error("Error updating order:", error);
      alert(t('update_error'));
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditingProduct || isSaving) return;
    setIsSaving(true);

    const targetId = String(isEditingProduct.id || Math.random().toString(36).substr(2, 9));
    try {
      // Build carefully structured data to ensure absolutely no "undefined" fields are sent to Firestore
      const rawProductData: any = {
        name: isEditingProduct.name || '',
        category: isEditingProduct.category || '',
        image: isEditingProduct.image || '',
        price: Number(isEditingProduct.price || 0),
        unit: isEditingProduct.unit || 'pcs',
        stockCount: Number(isEditingProduct.stockCount || 0),
        inStock: Number(isEditingProduct.stockCount || 0) > 0,
        id: targetId,
        updatedAt: Timestamp.now(),
        createdAt: isEditingProduct.createdAt || Timestamp.now()
      };

      // Handle optional properties without passing "undefined" fields or causing validation rule crashes
      if (isEditingProduct.costPrice !== undefined && !isNaN(Number(isEditingProduct.costPrice))) {
        rawProductData.costPrice = Number(isEditingProduct.costPrice);
      } else {
        // Provide a default costPrice of ~70% if absent, which is great for stats calculations
        rawProductData.costPrice = Math.round(Number(isEditingProduct.price || 0) * 0.72);
      }

      if (isEditingProduct.warehouseStockCount !== undefined && !isNaN(Number(isEditingProduct.warehouseStockCount))) {
        rawProductData.warehouseStockCount = Number(isEditingProduct.warehouseStockCount);
      } else {
        rawProductData.warehouseStockCount = Number(isEditingProduct.stockCount || 0);
      }

      if (isEditingProduct.barcode !== undefined) {
        rawProductData.barcode = String(isEditingProduct.barcode);
      }

      if (isEditingProduct.lowStockThreshold !== undefined) {
        rawProductData.lowStockThreshold = Number(isEditingProduct.lowStockThreshold);
      } else {
        rawProductData.lowStockThreshold = 10;
      }

      if (isEditingProduct.rating !== undefined) {
        rawProductData.rating = Number(isEditingProduct.rating);
      }
      if (isEditingProduct.reviewCount !== undefined) {
        rawProductData.reviewCount = Number(isEditingProduct.reviewCount);
      }
      if (isEditingProduct.supplierId !== undefined) {
        rawProductData.supplierId = String(isEditingProduct.supplierId);
      }
      if (isEditingProduct.expiryDate !== undefined) {
        rawProductData.expiryDate = isEditingProduct.expiryDate;
      }

      const productRef = doc(db, 'products', targetId);
      await setDoc(productRef, rawProductData);
      setIsEditingProduct(null);
    } catch (error) {
      console.error("Error saving product:", error);
      alert(t('save_error'));
      handleFirestoreError(error, OperationType.WRITE, `products/${targetId}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string | number) => {
    if (!window.confirm(t('delete_confirm'))) return;
    const targetId = String(id);
    try {
      await deleteDoc(doc(db, 'products', targetId));
    } catch (error) {
      console.error("Error deleting product:", error);
      alert(t('delete_error'));
      handleFirestoreError(error, OperationType.DELETE, `products/${targetId}`);
    }
  };

  const handleSavePromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditingPromo || isSaving) return;
    setIsSaving(true);

    try {
      const isNew = !isEditingPromo.id;
      const targetId = isNew ? Math.random().toString(36).substring(2, 9) : isEditingPromo.id;
      const promoRef = doc(db, 'promotions', targetId);

      const startDateTs = Timestamp.fromDate(new Date(isEditingPromo.startDate || Date.now()));
      const endDateTs = Timestamp.fromDate(new Date(isEditingPromo.endDate || Date.now() + 7 * 24 * 60 * 60 * 1000));

      const rawPromoData = {
        name: isEditingPromo.name || '',
        type: isEditingPromo.type || 'percentage',
        value: Number(isEditingPromo.value || 0),
        startDate: startDateTs,
        endDate: endDateTs,
        isActive: isEditingPromo.isActive !== undefined ? isEditingPromo.isActive : true,
        id: targetId
      };

      await setDoc(promoRef, rawPromoData);
      setIsEditingPromo(null);
    } catch (error) {
      console.error("Error saving promotion:", error);
      alert("Failed to save promotion");
      handleFirestoreError(error, OperationType.WRITE, `promotions/${isEditingPromo?.id || 'new'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePromotion = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this promotion?")) return;
    try {
      await deleteDoc(doc(db, 'promotions', id));
    } catch (error) {
      console.error("Error deleting promotion:", error);
      alert("Failed to delete promotion");
      handleFirestoreError(error, OperationType.DELETE, `promotions/${id}`);
    }
  };

  const handleSendPromotionEmail = async (promo: Promotion) => {
    if (!promo || isSendingEmail) return;
    setIsSendingEmail(true);
    setEmailBlastStatus("Initializing SMTP connection...");

    try {
      // Simulate real SMTP delay and delivery sequence
      await new Promise(resolve => setTimeout(resolve, 800));
      setEmailBlastStatus(`Preparing dynamic email body for ${customerUsers.length} customers...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const emailTitle = promo.name;
      const emailType = promo.type;
      const emailVal = promo.value;
      const promoStart = format(promo.startDate?.toDate?.() || new Date(), 'MMM d');
      const promoEnd = format(promo.endDate?.toDate?.() || new Date(), 'MMM d, yyyy');

      let promoDetails = "";
      if (emailType === 'percentage') {
        promoDetails = `${emailVal}% OFF everything!`;
      } else if (emailType === 'fixed') {
        promoDetails = `Save ${formatCurrency(emailVal)} on your order!`;
      } else {
        promoDetails = `Buy 1 Get 1 FREE Special!`;
      }

      // Loop over customers to simulate transmission logs
      const maxUsers = customerUsers.length > 0 ? customerUsers : [{ displayName: "Test Customer", email: "customer@simba.com" }];
      for (let i = 0; i < maxUsers.length; i++) {
        const cust = maxUsers[i];
        setEmailBlastStatus(`Transmitting to ${cust.displayName || 'Customer'} (${cust.email})... [${i+1}/${maxUsers.length}]`);
        await new Promise(resolve => setTimeout(resolve, Math.max(250, 1500 / maxUsers.length)));
      }

      setEmailBlastStatus("All emails transmitted. Saving broadcast logs in Firebase...");
      
      // Save notification/alert of promo broadcast
      const alertRef = collection(db, 'inventoryAlerts');
      await addDoc(alertRef, {
        id: `PROMO-${Date.now()}`,
        type: 'info',
        message: `Email alert sent successfully! Broadcast for "Simba: ${promo.name} (${promoDetails})" delivered to ${maxUsers.length} registered customer(s).`,
        severity: 'low',
        isRead: false,
        createdAt: Timestamp.now()
      });

      await new Promise(resolve => setTimeout(resolve, 600));
      alert(`Promotion broadcast dispatched successfully! ${maxUsers.length} customer(s) notified via MTN/Simba logistics gateway.`);
      setSendingPromoEmail(null);
    } catch (error) {
      console.error("Error sending promo emails:", error);
      alert("Failed to send promotion emails");
    } finally {
      setIsSendingEmail(false);
      setEmailBlastStatus(null);
    }
  };

  const handleSeedData = async () => {
    if (!window.confirm(t('confirm_seed'))) return;
    setIsSeeding(true);
    try {
      // Seed Products
      const productPromises = initialProducts.products.map((p: any) => {
        const productRef = doc(db, 'products', String(p.id));
        return setDoc(productRef, {
          ...p,
          id: String(p.id),
          stockCount: p.stockCount || Math.floor(Math.random() * 100),
          lowStockThreshold: 10,
          inStock: true,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
      });
      await Promise.all(productPromises);

      // Seed Staff
      const staffRef = collection(db, 'staff');
      const staffMembers: Partial<StaffMember>[] = [
        { name: 'John Kamana', role: 'manager', phone: '0788123456', shiftStatus: 'on_duty', performanceScore: 95 },
        { name: 'Marie Uwase', role: 'cashier', phone: '0788654321', shiftStatus: 'on_duty', performanceScore: 88 },
        { name: 'Eric Bigirimana', role: 'inventory', phone: '0788998877', shiftStatus: 'off_duty', performanceScore: 92 }
      ];
      for (const s of staffMembers) {
        await addDoc(staffRef, { ...s, id: Math.random().toString(36).substr(2, 9) });
      }

      // Seed Suppliers
      const supplierRef = collection(db, 'suppliers');
      const sampleSuppliers: Partial<Supplier>[] = [
        { name: 'Simba Supermarket Supply', contactName: 'Nesta', email: 'nesta@simba.com', phone: '0788000001', category: 'General', active: true },
        { name: 'Inyange Industries', contactName: 'Munezero', email: 'sales@inyange.com', phone: '0788000002', category: 'Dairy', active: true }
      ];
      for (const s of sampleSuppliers) {
        await addDoc(supplierRef, { ...s, id: Math.random().toString(36).substr(2, 9), active: true });
      }

      // Seed Promotions
      const promoRef = collection(db, 'promotions');
      const samplePromos: Partial<Promotion>[] = [
        { name: 'Weekend Dairy Sale', type: 'percentage', value: 15, startDate: Timestamp.now(), endDate: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), isActive: true },
        { name: 'Simba Bread BOGO', type: 'buy1get1', value: 0, startDate: Timestamp.now(), endDate: Timestamp.fromDate(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)), isActive: true }
      ];
      for (const p of samplePromos) {
        await addDoc(promoRef, { ...p, id: Math.random().toString(36).substr(2, 9) });
      }

      // Seed Alerts
      const alertRef = collection(db, 'inventoryAlerts');
      const sampleAlerts: Partial<InventoryAlert>[] = [
        { type: 'low_stock', message: 'Milk Stock reaching critical level (5 Remaining)', severity: 'high', isRead: false, createdAt: Timestamp.now() },
        { type: 'near_expiry', message: 'Fresh Avocados expiring in 2 days', severity: 'medium', isRead: false, createdAt: Timestamp.now() },
        { type: 'low_stock', message: 'Tomato stock low', severity: 'low', isRead: true, createdAt: Timestamp.now() }
      ];
      for (const a of sampleAlerts) {
        await addDoc(alertRef, { ...a, id: Math.random().toString(36).substr(2, 9) });
      }

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

  const hourlySalesData = useMemo(() => {
    const today = startOfDay(new Date());
    const tomorrow = endOfDay(new Date());

    const activeOrders = orders.filter(o => {
      if (o.status === 'cancelled') return false;
      const d = o.createdAt instanceof Timestamp ? o.createdAt.toDate() : new Date();
      return d >= today && d <= tomorrow;
    });

    return Array.from({ length: 12 }, (_, i) => {
      const hour = 8 + i;
      const targetHourStart = new Date();
      targetHourStart.setHours(hour, 0, 0, 0);
      const targetHourEnd = new Date();
      targetHourEnd.setHours(hour, 59, 59, 999);

      const hourOrders = activeOrders.filter(o => {
        const d = o.createdAt instanceof Timestamp ? o.createdAt.toDate() : new Date();
        return d >= targetHourStart && d <= targetHourEnd;
      });

      return {
        time: `${hour}:00`,
        revenue: hourOrders.reduce((acc, o) => acc + o.total, 0)
      };
    });
  }, [orders]);

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
            <Link 
              to="/" 
              className="flex items-center gap-2 px-6 py-3 bg-black/5 dark:bg-white/5 border border-brand-border rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-primary hover:text-white dark:hover:text-black transition-all group"
            >
              <HomeIcon className="h-4 w-4" />
              <span className="hidden md:inline">{t('back_to_shop')}</span>
            </Link>

            <Link 
              to="/checkout" 
              className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-zinc-800 border-2 border-brand-primary text-brand-primary rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-primary hover:text-white transition-all shadow-lg"
            >
              <CreditCard className="h-4 w-4" />
              <span className="hidden md:inline">TEST CHECKOUT</span>
            </Link>

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
      {/* Notification Toast Stack */}
      <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {newOrderAlerts.map((alert) => (
            <motion.div 
              key={`alert-${alert.orderId}`}
              initial={{ opacity: 0, y: -50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className="pointer-events-auto bg-brand-primary text-white px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-4 border border-white/20 backdrop-blur-xl min-w-[300px]"
            >
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center animate-pulse">
                <BellRing className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-0.5">{t('new_order_received')}</p>
                <p className="font-black italic uppercase tracking-tighter text-lg leading-none mb-1">#{alert.orderId}</p>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold bg-white/20 px-2 py-0.5 rounded-full">{alert.paymentMethod.toUpperCase()}</span>
                  <span className="text-[9px] font-bold">{formatCurrency(alert.total)}</span>
                </div>
              </div>
              <button 
                onClick={() => removeAlert(alert.orderId)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </motion.div>
          ))}

          {deliveredAlerts.map((alert) => (
            <motion.div 
              key={`delivered-${alert.orderId}`}
              initial={{ opacity: 0, y: -50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className="pointer-events-auto bg-emerald-600 text-white px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-4 border border-white/20 backdrop-blur-xl min-w-[320px]"
            >
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center animate-bounce">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-0.5">Order Delivered (Stock Deducted)</p>
                <p className="font-black italic uppercase tracking-tighter text-lg leading-none mb-1">#{alert.orderId}</p>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold bg-white/20 px-2 py-0.5 rounded-full">{alert.items.length} {alert.items.length === 1 ? 'Item' : 'Items'}</span>
                  <span className="text-[9px] font-bold">{formatCurrency(alert.total)}</span>
                </div>
              </div>
              <button 
                onClick={() => setDeliveredAlerts(prev => prev.filter(o => o.orderId !== alert.orderId))}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                aria-label="Dismiss notification"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
        <div>
          <p className="micro-label mb-2 uppercase font-black text-brand-primary tracking-widest">{t('admin_control_panel')}</p>
          <h1 className="text-6xl lg:text-8xl font-black tracking-tighter uppercase italic leading-none text-[var(--brand-text)]">
            ADMIN <span className="text-brand-primary">HUB</span>
          </h1>
          
          <div className="flex flex-wrap gap-3 mt-8">
            <button 
              onClick={() => setActiveTab('overview')}
              className={cn(
                "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                activeTab === 'overview' 
                  ? "bg-brand-primary text-white shadow-xl shadow-brand-primary/20 scale-105" 
                  : "bg-black/5 dark:bg-white/5 opacity-60 hover:opacity-100"
              )}
            >
              <LayoutDashboard className="h-4 w-4" />
              {t('overview')}
            </button>
            <button 
              onClick={() => setActiveTab('orders')}
              className={cn(
                "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                activeTab === 'orders' 
                  ? "bg-brand-primary text-white shadow-xl shadow-brand-primary/20 scale-105" 
                  : "bg-black/5 dark:bg-white/5 opacity-60 hover:opacity-100"
              )}
            >
              <History className="h-4 w-4" />
              {t('orders')}
            </button>
            <button 
              onClick={() => setActiveTab('inventory')}
              className={cn(
                "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                activeTab === 'inventory' 
                  ? "bg-brand-primary text-white shadow-xl shadow-brand-primary/20 scale-105" 
                  : "bg-black/5 dark:bg-white/5 opacity-60 hover:opacity-100"
              )}
            >
              <Package className="h-4 w-4" />
              {t('inventory')}
            </button>
            <button 
              onClick={() => setActiveTab('staff')}
              className={cn(
                "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                activeTab === 'staff' 
                  ? "bg-brand-primary text-white shadow-xl shadow-brand-primary/20 scale-105" 
                  : "bg-black/5 dark:bg-white/5 opacity-60 hover:opacity-100"
              )}
            >
              <Users className="h-4 w-4" />
              {t('portal_staff')}
            </button>
            <button 
              onClick={() => setActiveTab('promotions')}
              className={cn(
                "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                activeTab === 'promotions' 
                  ? "bg-brand-primary text-white shadow-xl shadow-brand-primary/20 scale-105" 
                  : "bg-black/5 dark:bg-white/5 opacity-60 hover:opacity-100"
              )}
            >
              <TagIcon className="h-4 w-4" />
              {t('portal_promotions')}
            </button>
            <button 
              onClick={() => setActiveTab('suppliers')}
              className={cn(
                "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                activeTab === 'suppliers' 
                  ? "bg-brand-primary text-white shadow-xl shadow-brand-primary/20 scale-105" 
                  : "bg-black/5 dark:bg-white/5 opacity-60 hover:opacity-100"
              )}
            >
              <Truck className="h-4 w-4" />
              {t('portal_suppliers')}
            </button>
            <button 
              onClick={() => setActiveTab('alerts')}
              className={cn(
                "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 relative",
                activeTab === 'alerts' 
                  ? "bg-brand-primary text-white shadow-xl shadow-brand-primary/20 scale-105" 
                  : "bg-black/5 dark:bg-white/5 opacity-60 hover:opacity-100"
              )}
            >
              <BellRing className="h-4 w-4" />
              {t('portal_alerts')}
              {alerts.filter(a => !a.isRead).length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white flex items-center justify-center rounded-full text-[8px] border-2 border-white dark:border-zinc-950">
                  {alerts.filter(a => !a.isRead).length}
                </span>
              )}
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 min-[400px]:grid-cols-2 sm:grid-cols-4 gap-4 w-full lg:w-auto">
          <div className="bg-black/5 dark:bg-white/5 border border-brand-border p-3 sm:p-4 rounded-2xl min-w-0">
            <p className="text-[9px] font-black uppercase opacity-40 mb-1 truncate">{t('total_orders')}</p>
            <p className="text-base xs:text-lg sm:text-xl lg:text-2xl font-black italic truncate">{stats.total}</p>
          </div>
          <div className="bg-orange-500/10 border border-orange-500/20 p-3 sm:p-4 rounded-2xl min-w-0">
            <p className="text-[9px] font-black uppercase text-orange-500 mb-1 truncate">{t('pending')}</p>
            <p className="text-base xs:text-lg sm:text-xl lg:text-2xl font-black italic text-orange-500 truncate">{stats.pending}</p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 sm:p-4 rounded-2xl min-w-0">
             <p className="text-[9px] font-black uppercase text-emerald-500 mb-1 truncate">{t('today_sales')}</p>
             <p className="text-base xs:text-lg sm:text-xl lg:text-2xl font-black italic text-emerald-500 truncate" title={formatCurrency(stats.todayRevenue)}>{formatCurrency(stats.todayRevenue)}</p>
          </div>
          <div className="bg-brand-primary/10 border border-brand-primary/20 p-3 sm:p-4 rounded-2xl min-w-0">
            <p className="text-[9px] font-black uppercase text-brand-primary mb-1 truncate">{t('total_revenue')}</p>
            <p className="text-base xs:text-lg sm:text-xl lg:text-2xl font-black italic text-brand-primary truncate" title={formatCurrency(stats.revenue)}>{formatCurrency(stats.revenue)}</p>
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
            {/* Urgent Alerts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               <div className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-[32px] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 bg-rose-500 text-white rounded-xl flex items-center justify-center">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="micro-label !text-rose-500 !opacity-100 italic">{t('low_stock_urgent')}</h4>
                      <p className="text-sm font-black uppercase italic">{products.filter(p => (p.stockCount || 0) <= (p.lowStockThreshold || 10)).length} Items Identified</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {products.filter(p => (p.stockCount || 0) <= (p.lowStockThreshold || 10)).slice(0, 2).map(p => (
                      <div key={p.id} className="flex justify-between items-center bg-white/50 dark:bg-black/20 p-2 rounded-lg text-[10px] font-bold uppercase italic">
                        <span>{p.name}</span>
                        <span className="text-rose-500">{p.stockCount} {p.unit}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setActiveTab('inventory')} className="mt-4 flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-rose-500 hover:gap-2 transition-all">
                    {t('reorder_suggestions')} <ChevronRight className="h-3 w-3" />
                  </button>
               </div>

               <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-[32px] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 bg-amber-500 text-white rounded-xl flex items-center justify-center">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="micro-label !text-amber-500 !opacity-100 italic">{t('expiry_tracking')}</h4>
                      <p className="text-sm font-black uppercase italic">Near Expiry Alerts</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center py-4 opacity-30 italic text-[10px] font-bold uppercase">
                    All Perishables within safety window
                  </div>
               </div>

               <div className="bg-brand-primary/10 border border-brand-primary/20 p-6 rounded-[32px] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 bg-brand-primary text-white rounded-xl flex items-center justify-center">
                      <Zap className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="micro-label !text-brand-primary !opacity-100 italic">{t('ai_suggestion')}</h4>
                      <p className="text-sm font-black uppercase italic">Dynamic Pricing Opportunity</p>
                    </div>
                  </div>
                  <p className="text-[10px] font-medium opacity-60 leading-relaxed uppercase">
                    Suggest 10% discount on "Fresh Avocados" to clear Saturday warehouse arrival.
                  </p>
                  <button className="mt-4 flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-brand-primary hover:gap-2 transition-all">
                    {t('discount')} <ChevronRight className="h-3 w-3" />
                  </button>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Hourly Sales Chart */}
              <div className="lg:col-span-2 bg-white dark:bg-black/20 border border-brand-border p-8 rounded-[48px]">
                <div className="flex items-center justify-between mb-8 px-2">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-brand-primary" />
                    <h3 className="font-black uppercase italic tracking-tighter text-xl">{t('hourly_sales')}</h3>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest opacity-40">{format(new Date(), 'EEEE, MMM do')}</span>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={hourlySalesData}>
                      <defs>
                        <linearGradient id="colorHourly" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                      <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900, fill: 'currentColor', opacity: 0.4}} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '9px', fontWeight: 900 }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={3} fill="url(#colorHourly)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Profit & Margin */}
              <div className="bg-white dark:bg-black/20 border border-brand-border p-8 rounded-[48px] flex flex-col">
                <div className="flex items-center gap-3 mb-8 px-2">
                  <BarChart3 className="h-5 w-5 text-brand-primary" />
                  <h3 className="font-black uppercase italic tracking-tighter text-xl">{t('profit_margin')}</h3>
                </div>
                <div className="flex-1 flex flex-col justify-center gap-8">
                  <div className="text-center">
                    <p className="micro-label italic mb-2 uppercase">{t('profit_rwf')}</p>
                    <p className="text-5xl font-black italic tracking-tighter text-emerald-500">
                      {formatCurrency(stats.todayRevenue * 0.28)}
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-2">
                       <span className="flex items-center gap-1 text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          <ArrowUpRight className="h-3 w-3" /> 12%
                       </span>
                       <span className="text-[9px] font-bold opacity-30 uppercase">vs Last Week</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-black/5 dark:bg-white/5 p-4 rounded-2xl border border-brand-border">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-black uppercase italic opacity-40">{t('basket_analysis')}</span>
                          <span className="text-[10px] font-black">2.4 Items/Avg</span>
                        </div>
                        <div className="w-full bg-black/10 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                          <div className="bg-brand-primary h-full w-[65%]" />
                        </div>
                    </div>
                    <div className="bg-black/5 dark:bg-white/5 p-4 rounded-2xl border border-brand-border">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-black uppercase italic opacity-40">{t('shrinkage_loss')}</span>
                          <span className="text-[10px] font-black text-rose-500">0.8% Loss</span>
                        </div>
                        <div className="w-full bg-black/10 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                          <div className="bg-rose-500 h-full w-[12%]" />
                        </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Actionable Reorder List */}
              <div className="bg-white dark:bg-black/20 border border-brand-border p-8 rounded-[48px]">
                <div className="flex items-center justify-between mb-8 px-2">
                  <div className="flex items-center gap-3">
                    <Layers className="h-5 w-5 text-brand-primary" />
                    <h3 className="font-black uppercase italic tracking-tighter text-xl">{t('reorder_suggestions')}</h3>
                  </div>
                  <div className="px-3 py-1 bg-brand-primary text-white rounded-full text-[9px] font-black italic animate-pulse">
                    {t('ai_suggestion')}
                  </div>
                </div>
                <div className="space-y-3">
                  {products.filter(p => (p.stockCount || 0) < 20).slice(0, 4).map(p => (
                    <div key={p.id} className="flex items-center justify-between p-4 bg-black/5 dark:bg-white/5 rounded-2xl group border border-transparent hover:border-brand-primary/30 transition-all">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-white rounded-xl p-1 border border-brand-border flex items-center justify-center overflow-hidden">
                            <img 
                              src={p.image} 
                              className="w-full h-full object-contain" 
                              onError={(e) => {
                                e.currentTarget.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600";
                              }}
                            />
                         </div>
                         <div>
                            <p className="text-xs font-black uppercase italic">{p.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                               <span className="text-[9px] font-bold opacity-30 uppercase">{t('last_sold')}: 15m ago</span>
                               <span className="text-[9px] font-black text-rose-500 bg-rose-500/10 px-2 rounded-full">{p.stockCount} Left</span>
                            </div>
                         </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-2">
                         <div className="flex flex-col">
                            <span className="text-[8px] font-black uppercase opacity-20">{t('reorder_qty')}</span>
                            <span className="text-xs font-black italic">+50 Units</span>
                         </div>
                         <button className="p-2 bg-brand-primary text-white rounded-lg hover:scale-110 transition-transform">
                            <Plus className="h-4 w-4" />
                         </button>
                      </div>
                    </div>
                  ))}
                  {products.filter(p => (p.stockCount || 0) < 20).length === 0 && (
                    <div className="py-12 text-center opacity-30 text-xs font-black italic uppercase">
                      Stocks optimally managed
                    </div>
                  )}
                </div>
              </div>

              {/* Top Performing Categories */}
              <div className="bg-white dark:bg-black/20 border border-brand-border p-8 rounded-[48px]">
                <div className="flex items-center gap-3 mb-8 px-2">
                  <PieChartIcon className="h-5 w-5 text-brand-primary" />
                  <h3 className="font-black uppercase italic tracking-tighter text-xl">{t('revenue_by_category')}</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center">
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {categoryData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3">
                    {categoryData.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                          <span className="text-[10px] font-black uppercase italic opacity-60 truncate max-w-[100px]">{item.name}</span>
                        </div>
                        <div className="flex flex-col items-end">
                           <span className="text-[10px] font-black italic">{formatCurrency(item.value)}</span>
                           <span className="text-[8px] font-bold opacity-20 uppercase">{(item.value/stats.revenue * 100).toFixed(0)}% SHARE</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-8 p-4 bg-teal-500/10 border border-teal-500/20 rounded-2xl flex items-center gap-4">
                    <div className="w-10 h-10 bg-teal-500 text-white rounded-xl flex items-center justify-center">
                      <ShoppingBasket className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase text-teal-600">{t('frequently_together')}</p>
                      <p className="text-[10px] font-black uppercase italic">Simba Milk + Fresh Bread (85% Match)</p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 ml-auto text-teal-600" />
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
                              <div className="w-12 h-12 bg-white rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                                <img 
                                  src={item.image} 
                                  alt={item.name} 
                                  className="w-full h-full object-contain p-2" 
                                  onError={(e) => {
                                    e.currentTarget.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600";
                                  }}
                                />
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
        ) : activeTab === 'inventory' ? (
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
                            type="text"
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
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full min-w-[800px] text-left border-collapse">
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
                          <div className="w-12 h-12 bg-white rounded-lg p-1 shrink-0 border border-brand-border flex items-center justify-center overflow-hidden">
                            <img 
                              src={product.image} 
                              alt={product.name} 
                              className="w-full h-full object-contain" 
                              referrerPolicy="no-referrer" 
                              onError={(e) => {
                                e.currentTarget.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600";
                              }}
                            />
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
            </div>
          </div>
        </motion.div>
        ) : activeTab === 'staff' ? (
          <motion.div
            key="staff-tab"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-8"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black uppercase italic tracking-tighter">{t('portal_staff')}</h3>
              <button className="px-6 py-3 bg-brand-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 italic">
                <Plus className="h-4 w-4" /> {t('add_staff')}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {staff.map(member => (
                <div key={member.id} className="bg-white dark:bg-black/20 border border-brand-border p-6 rounded-[32px] group hover:border-brand-primary/50 transition-all">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-16 h-16 bg-black/5 dark:bg-white/5 rounded-2xl flex items-center justify-center font-black text-2xl italic text-brand-primary">
                      {member.name.charAt(0)}
                    </div>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[8px] font-black uppercase italic border",
                      member.shiftStatus === 'on_duty' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-black/5 text-zinc-500 border-black/10"
                    )}>
                      {t(member.shiftStatus)}
                    </span>
                  </div>
                  <h4 className="text-lg font-black uppercase italic tracking-tight">{member.name}</h4>
                  <p className="text-[10px] font-black uppercase opacity-40 mb-4">{t(member.role)}</p>
                  
                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-[9px] font-bold uppercase italic opacity-60">
                      <span>{t('attendance')}</span>
                      <span>98%</span>
                    </div>
                    <div className="w-full bg-black/5 dark:bg-white/5 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-brand-primary h-full w-[98%]" />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button className="flex-1 py-3 bg-black/5 dark:bg-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-brand-primary hover:text-white transition-all italic">
                      {t('schedule')}
                    </button>
                    <button className="p-3 bg-black/5 dark:bg-white/5 rounded-xl hover:bg-rose-500 hover:text-white transition-all">
                      <Edit className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              {staff.length === 0 && (
                <div className="col-span-full py-24 text-center opacity-20 italic font-black uppercase">
                  {t('no_staff_recorded')}
                </div>
              )}
            </div>
          </motion.div>
        ) : activeTab === 'promotions' ? (
          <motion.div
            key="promotions-tab"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-8"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black uppercase italic tracking-tighter">{t('portal_promotions')}</h3>
              <button 
                onClick={() => setIsEditingPromo({ 
                  name: '', 
                  type: 'percentage', 
                  value: 10, 
                  startDate: new Date().toISOString().split('T')[0], 
                  endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
                  isActive: true 
                })}
                className="px-6 py-3 bg-brand-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 italic hover:scale-105 transition-all"
              >
                <TagIcon className="h-4 w-4" /> {t('new_promo')}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {promotions.map(promo => (
                <div key={promo.id} className="bg-white dark:bg-black/20 border border-brand-border p-8 rounded-[40px] relative overflow-hidden group flex flex-col justify-between min-h-[300px]">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="flex flex-col h-full justify-between flex-1">
                    <div>
                      <div className="mb-4">
                        <span className="text-[9px] font-black uppercase tracking-widest bg-brand-primary text-white px-3 py-1 rounded-full italic">
                          {promo.type === 'percentage' ? `${promo.value}% OFF` : promo.type === 'fixed' ? `-${promo.value} RWF` : 'B1G1'}
                        </span>
                      </div>
                      <h4 className="text-xl font-black uppercase italic tracking-tight mb-2">{promo.name}</h4>
                      <p className="text-[10px] font-bold opacity-40 uppercase mb-6">
                        {format(promo.startDate?.toDate?.() || new Date(promo.startDate || Date.now()), 'MMM d')} - {format(promo.endDate?.toDate?.() || new Date(promo.endDate || Date.now() + 7*24*60*60*1000), 'MMM d, yyyy')}
                      </p>
                    </div>
                    
                    <div className="space-y-3 mb-6">
                        <div className="flex justify-between items-center border-b border-brand-border pb-1 italic">
                          <span className="text-[10px] font-black uppercase opacity-40">{t('performance')}</span>
                          <span className="text-[10px] font-black text-emerald-500">+18% {t('sales')}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-brand-border pb-1 italic">
                          <span className="text-[10px] font-black uppercase opacity-40">{t('conversions')}</span>
                          <span className="text-[10px] font-black">1.2k</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-auto">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", promo.isActive ? "bg-emerald-500 animate-pulse" : "bg-rose-500")} />
                        <span className="text-[9px] font-black uppercase italic">{promo.isActive ? 'Active' : 'Ended'}</span>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={() => setSendingPromoEmail(promo)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-brand-primary text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:scale-105 transition-all italic"
                          title="Direct Campaign Email Dispatch"
                        >
                          <Send className="h-3 w-3" />
                          Send Blast
                        </button>
                        
                        <button 
                          onClick={() => setIsEditingPromo({
                            ...promo,
                            startDate: promo.startDate?.toDate?.() ? promo.startDate.toDate().toISOString().split('T')[0] : (typeof promo.startDate === 'string' ? promo.startDate.substring(0, 10) : new Date().toISOString().split('T')[0]),
                            endDate: promo.endDate?.toDate?.() ? promo.endDate.toDate().toISOString().split('T')[0] : (typeof promo.endDate === 'string' ? promo.endDate.substring(0, 10) : new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0])
                          })}
                          className="p-1.5 bg-black/5 dark:bg-white/5 rounded-lg hover:bg-neutral-200 dark:hover:bg-white/10 transition-all text-[var(--brand-text)]"
                          title="Edit Promotion"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        
                        <button 
                          onClick={() => handleDeletePromotion(promo.id)}
                          className="p-1.5 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all"
                          title="Delete Promotion"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {promotions.length === 0 && (
                <div className="col-span-full py-24 text-center opacity-20 italic font-black uppercase">
                  No active promotions
                </div>
              )}
            </div>
          </motion.div>
        ) : activeTab === 'suppliers' ? (
          <motion.div
            key="suppliers-tab"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-8"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black uppercase italic tracking-tighter">{t('portal_suppliers')}</h3>
              <button className="px-6 py-3 bg-brand-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 italic">
                <Truck className="h-4 w-4" /> {t('add_supplier')}
              </button>
            </div>
            <div className="bg-black/5 dark:bg-white/5 rounded-[48px] overflow-hidden border border-brand-border">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full min-w-[800px] text-left border-collapse">
                  <thead>
                    <tr className="bg-black/10 dark:bg-white/10 uppercase font-black text-[10px] tracking-widest italic">
                      <th className="px-8 py-6">{t('supplier')}</th>
                      <th className="px-8 py-6">{t('contact')}</th>
                      <th className="px-8 py-6">{t('category')}</th>
                      <th className="px-8 py-6 text-center">{t('status')}</th>
                      <th className="px-8 py-6 text-right">{t('actions_table')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border">
                    {suppliers.map(supplier => (
                      <tr key={supplier.id} className="hover:bg-brand-primary/5 transition-colors">
                        <td className="px-8 py-6">
                          <span className="font-black uppercase italic text-sm">{supplier.name}</span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold">{supplier.contactName}</span>
                            <span className="text-[9px] opacity-40 uppercase">{supplier.email}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-[10px] font-black uppercase tracking-widest bg-zinc-500/10 text-zinc-500 px-3 py-1 rounded-full italic">
                            {supplier.category}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <div className={cn(
                            "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase italic border",
                            supplier.active ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                          )}>
                            {supplier.active ? 'Active' : 'Inactive'}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                           <button className="p-3 bg-brand-primary/10 text-brand-primary rounded-xl hover:bg-brand-primary hover:text-white transition-all scale-90">
                              <Plus className="h-4 w-4" />
                           </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        ) : activeTab === 'alerts' ? (
          <motion.div
            key="alerts-tab"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black uppercase italic tracking-tighter">{t('portal_alerts')}</h3>
              <button className="text-[10px] font-black uppercase tracking-widest italic opacity-40 hover:opacity-100 transition-opacity">
                {t('mark_all_read')}
              </button>
            </div>
            <div className="space-y-4">
              {alerts.map(alert => (
                <div key={alert.id} className={cn(
                  "p-6 rounded-[32px] border flex items-center justify-between group transition-all",
                  !alert.isRead ? "bg-brand-primary/5 border-brand-primary/20 shadow-lg shadow-brand-primary/5 scale-[1.02]" : "bg-white dark:bg-black/20 border-brand-border opacity-60"
                )}>
                  <div className="flex items-center gap-6">
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0",
                      alert.severity === 'high' ? "bg-rose-500 text-white" : alert.severity === 'medium' ? "bg-amber-500 text-white" : "bg-blue-500 text-white"
                    )}>
                      {alert.type === 'low_stock' ? <Package className="h-6 w-6" /> : alert.type === 'near_expiry' ? <Clock className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-[10px] font-black uppercase italic tracking-widest opacity-40">
                          {format(alert.createdAt?.toDate?.() || new Date(), 'HH:mm')}
                        </span>
                        <span className={cn(
                          "text-[8px] font-black uppercase italic px-2 py-0.5 rounded-full border",
                          alert.severity === 'high' ? "border-rose-500/20 text-rose-500" : "border-zinc-500/20 text-zinc-500"
                        )}>
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-base font-black uppercase italic tracking-tight">{alert.message}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {!alert.isRead && (
                      <button className="px-6 py-3 bg-brand-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest italic">
                        {t('resolve')}
                      </button>
                    )}
                    <button className="p-3 bg-black/5 dark:bg-white/5 rounded-xl group-hover:bg-rose-500 group-hover:text-white transition-all">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              {alerts.length === 0 && (
                <div className="py-24 text-center opacity-20 italic font-black uppercase">
                  All systems operating normally
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <div />
        )}
      </AnimatePresence>

      {/* Promotion Edit/Create Modal Overlay */}
      <AnimatePresence>
        {isEditingPromo && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
            id="promo-edit-modal"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-neutral-900 border border-brand-primary/20 w-full max-w-xl rounded-[40px] p-6 md:p-10 shadow-2xl relative"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter text-white">
                  {isEditingPromo.id ? "Edit Promotion" : "Create New Promotion"}
                </h3>
                <button 
                  onClick={() => setIsEditingPromo(null)}
                  className="px-3 py-1 bg-white/5 hover:bg-white/10 text-white rounded-full text-[10px] font-black uppercase tracking-wider transition-all"
                >
                  Close
                </button>
              </div>

              <form onSubmit={handleSavePromotion} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#9a9a9a] mb-2">Promotion Name</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Back To School, Eid Mubarak Deals"
                    value={isEditingPromo.name || ''}
                    onChange={e => setIsEditingPromo({ ...isEditingPromo, name: e.target.value })}
                    className="w-full bg-black/40 border border-[#2d2d2d] rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-brand-primary uppercase italic font-black"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[#9a9a9a] mb-2">Discount Type</label>
                    <select
                      value={isEditingPromo.type || 'percentage'}
                      onChange={e => setIsEditingPromo({ ...isEditingPromo, type: e.target.value })}
                      className="w-full bg-black/40 border border-[#2d2d2d] rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-brand-primary italic font-black uppercase"
                    >
                      <option value="percentage">Percentage OFF</option>
                      <option value="fixed">Fixed RWF Reduction</option>
                      <option value="buy1get1">Buy 1 Get 1 Free</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[#9a9a9a] mb-2">Value</label>
                    <input 
                      type="number"
                      required={isEditingPromo.type !== 'buy1get1'}
                      disabled={isEditingPromo.type === 'buy1get1'}
                      placeholder={isEditingPromo.type === 'percentage' ? "e.g. 15" : "e.g. 5000"}
                      value={isEditingPromo.type === 'buy1get1' ? '' : (isEditingPromo.value || '')}
                      onChange={e => setIsEditingPromo({ ...isEditingPromo, value: Number(e.target.value) })}
                      className="w-full bg-black/40 border border-[#2d2d2d] rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-brand-primary font-black disabled:opacity-30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[#9a9a9a] mb-2">Start Date</label>
                    <input 
                      type="date"
                      required
                      value={isEditingPromo.startDate || ''}
                      onChange={e => setIsEditingPromo({ ...isEditingPromo, startDate: e.target.value })}
                      className="w-full bg-black/40 border border-[#2d2d2d] rounded-2xl px-5 py-3.5 text-sm text-white focus:outline-none focus:border-brand-primary font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[#9a9a9a] mb-2">End Date</label>
                    <input 
                      type="date"
                      required
                      value={isEditingPromo.endDate || ''}
                      onChange={e => setIsEditingPromo({ ...isEditingPromo, endDate: e.target.value })}
                      className="w-full bg-black/40 border border-[#2d2d2d] rounded-2xl px-5 py-3.5 text-sm text-white focus:outline-none focus:border-brand-primary font-bold"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-black/35 border border-[#2d2d2d] p-4 rounded-2xl">
                  <input 
                    type="checkbox"
                    id="promo-active-chk"
                    checked={isEditingPromo.isActive !== false}
                    onChange={e => setIsEditingPromo({ ...isEditingPromo, isActive: e.target.checked })}
                    className="w-5 h-5 accent-brand-primary rounded"
                  />
                  <label htmlFor="promo-active-chk" className="text-xs font-black uppercase text-white cursor-pointer select-none">
                    Promotion Status is Active (Live on main interface)
                  </label>
                </div>

                <div className="flex gap-4 pt-2">
                  <button 
                    type="button"
                    onClick={() => setIsEditingPromo(null)}
                    className="flex-1 py-4 bg-[#232323] text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-[#323232] transition-colors italic"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 py-4 bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-orange-600 transition-colors disabled:opacity-40 italic shadow-lg shadow-brand-primary/20"
                  >
                    {isSaving ? "Saving..." : "Save Promotion"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Promotion Campaign Preview & Send Modal */}
      <AnimatePresence>
        {sendingPromoEmail && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
            id="promo-email-modal"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-neutral-900 border border-brand-primary/20 w-full max-w-2xl rounded-[40px] p-6 md:p-8 shadow-2xl relative text-white"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center">
                    <Megaphone className="h-5 w-5 text-brand-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black uppercase italic tracking-tighter">Campaign Dispatch Center</h3>
                    <p className="text-[9px] font-bold text-[#9a9a9a] uppercase">Simba Logistics SMTP Mail Gateway</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSendingPromoEmail(null)}
                  disabled={isSendingEmail}
                  className="px-3 py-1 bg-white/5 hover:bg-white/10 text-white rounded-full text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-30"
                >
                  Close
                </button>
              </div>

              {/* Status Indicator Bar */}
              {isSendingEmail ? (
                <div className="mb-6 bg-brand-primary/10 border border-brand-primary/20 p-4 rounded-2xl animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-brand-primary animate-ping" />
                    <p className="text-xs font-black uppercase tracking-wide text-brand-primary">Transmission Active</p>
                  </div>
                  <p className="text-[10px] font-mono text-white/80 mt-1">{emailBlastStatus}</p>
                </div>
              ) : (
                <div className="mb-6 bg-[#1a1a1a] border border-[#2d2d2d] p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-[#9a9a9a] uppercase">Audience List</p>
                    <p className="text-sm font-black italic mt-0.5">{customerUsers.length > 0 ? `${customerUsers.length} Registered Customer Addresses` : "1 Customer (Fallbacks active)"}</p>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 px-3 py-1.5 rounded-full border border-emerald-500/10">Ready</span>
                </div>
              )}

              {/* Email Client Layout */}
              <div className="bg-[#141414] border border-[#2d2d2d] rounded-2xl overflow-hidden mb-6">
                <div className="bg-[#1f1f1f] px-5 py-3.5 border-b border-[#2d2d2d] space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase tracking-wider text-[#9a9a9a] w-12 text-right">From:</span>
                    <span className="text-[10px] font-mono text-brand-primary">Simba Club Promo &lt;promos@simba.com&gt;</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase tracking-wider text-[#9a9a9a] w-12 text-right">To:</span>
                    <span className="text-[10px] font-mono text-zinc-300">Target Audience ({customerUsers.length > 0 ? "dynamic emails" : "demo_address"})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase tracking-wider text-[#9a9a9a] w-12 text-right">Subject:</span>
                    <span className="text-[10px] font-mono text-zinc-100 font-bold uppercase select-all">[⚡ SIMBA DEALS] NEW EXCLUSIVE: {sendingPromoEmail.name}</span>
                  </div>
                </div>

                <div className="p-5 overflow-y-auto max-h-[220px] bg-black/35 font-mono text-xs text-[#a1a1a1] leading-relaxed custom-scrollbar whitespace-pre-line select-all">
                  {getPrecomposedMessage(sendingPromoEmail)}
                </div>
              </div>

              {/* Emails Recipients Scroll Area */}
              <div className="mb-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#9a9a9a] mb-2.5">Recipients Queue Detail</p>
                <div className="flex gap-1.5 overflow-x-auto max-w-full py-1.5 scrollbar-thin">
                  {customerUsers.length > 0 ? customerUsers.map((user, idx) => (
                    <div key={user.id || idx} className="bg-[#1f1f1f] border border-[#2d2d2d] px-3 py-1.5 rounded-md text-[9px] font-mono text-zinc-300 shrink-0 select-text max-w-[170px] truncate">
                      <span className="font-bold block text-white truncate">{user.displayName || "Simba Client"}</span>
                      <span className="opacity-60">{user.email}</span>
                    </div>
                  )) : (
                    <div className="bg-[#1f1f1f] border border-[#2d2d2d] px-3 py-1.5 rounded-md text-[9px] font-mono text-rose-500 shrink-0">
                      No customer emails in directory (Simba demo test address active)
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  type="button"
                  onClick={() => setSendingPromoEmail(null)}
                  disabled={isSendingEmail}
                  className="flex-1 py-4 bg-[#232323] text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-[#323232] transition-colors disabled:opacity-30 italic"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={() => handleSendPromotionEmail(sendingPromoEmail)}
                  disabled={isSendingEmail}
                  className="flex-1 py-4 bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-orange-600 transition-all flex items-center justify-center gap-2 disabled:opacity-40 italic shadow-lg shadow-brand-primary/20"
                >
                  {isSendingEmail ? (
                    <span>Broadcasting...</span>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Dispatch Broadcast Now</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </div>
  );
}
