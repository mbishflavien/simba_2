import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, query, orderBy, onSnapshot, doc, getDoc, updateDoc, Timestamp, addDoc, deleteDoc, setDoc, increment, getDocs } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../components/AuthProvider';
import { Order, Product, Supplier, PurchaseOrder, Promotion, StaffMember, InventoryAlert, Shift, StaffNotification } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { sendOrderShipping, sendOrderDelivery, sendSupplierDemand, sendSupplierShipmentConfirm, sendSupplierGoodsReceived, sendPromotionEmail, buildEmailHtml } from '../lib/emailService';
import { categorizeProductByName } from '../services/aiService';
import RwandanCatalogSeeder from '../components/RwandanCatalogSeeder';
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

  // New Category & Transfer Management State
  const [categoriesList, setCategoriesList] = useState<string[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [transferSource, setTransferSource] = useState('');
  const [transferTarget, setTransferTarget] = useState('');
  const [transferSelectedProducts, setTransferSelectedProducts] = useState<string[]>([]);
  const [isTransferring, setIsTransferring] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

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
  const [isResettingRatings, setIsResettingRatings] = useState(false);

  // New Management State
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [staffNotifications, setStaffNotifications] = useState<StaffNotification[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [emails, setEmails] = useState<any[]>([]);

  // Sub tabs state
  const [activeSupplierTab, setActiveSupplierTab] = useState<'directory' | 'po' | 'messages'>('directory');
  const [activeStaffTab, setActiveStaffTab] = useState<'directory' | 'shifts' | 'messages'>('directory');
  
  // Adding / Editing entities
  const [isEditingSupplier, setIsEditingSupplier] = useState<Partial<Supplier> | null>(null);
  const [isEditingStaff, setIsEditingStaff] = useState<Partial<StaffMember> | null>(null);

  // Shift Schedule state
  const [isCreatingShift, setIsCreatingShift] = useState(false);
  const [shiftStaffId, setShiftStaffId] = useState('');
  const [shiftDate, setShiftDate] = useState(new Date().toISOString().split('T')[0]);
  const [shiftTimeSlot, setShiftTimeSlot] = useState<'morning' | 'afternoon' | 'night'>('morning');

  // Staff Message/Memo dispatch states
  const [isCreatingStaffMemo, setIsCreatingStaffMemo] = useState(false);
  const [memoStaffId, setMemoStaffId] = useState('all');
  const [memoTitle, setMemoTitle] = useState('');
  const [memoMessage, setMemoMessage] = useState('');
  const [memoType, setMemoType] = useState<'general' | 'shift_change' | 'announcement' | 'alert'>('general');
  
  // Promotion refinement states
  const [isEditingPromo, setIsEditingPromo] = useState<any | null>(null);
  const [sendingPromoEmail, setSendingPromoEmail] = useState<Promotion | null>(null);
  const [customerUsers, setCustomerUsers] = useState<any[]>([]);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailBlastStatus, setEmailBlastStatus] = useState<string | null>(null);

  // New states for Purchase Orders (Supplier Demands) and Emails logs
  const [activeCommunicationsSubTab, setActiveCommunicationsSubTab] = useState<'po' | 'history' | 'campaign'>('po');
  const [isCreatingPO, setIsCreatingPO] = useState(false);
  const [selectedPOSupplierId, setSelectedPOSupplierId] = useState('');
  const [poLineItems, setPoLineItems] = useState<{ productId: string; quantity: number | ''; wholesaleCost: number | '' }[]>([]);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [formShiftStatus, setFormShiftStatus] = useState<'scheduled' | 'active' | 'absent' | 'completed'>('scheduled');

  useEffect(() => {
    if (editingShift) {
      setShiftStaffId(editingShift.staffId);
      setShiftDate(editingShift.date);
      setShiftTimeSlot(editingShift.timeSlot);
      setFormShiftStatus(editingShift.status);
    }
  }, [editingShift]);

  const handleSaveShiftSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftStaffId || !shiftDate || !shiftTimeSlot) return;

    try {
      if (editingShift) {
        await updateDoc(doc(db, 'shifts', editingShift.id), {
          staffId: shiftStaffId,
          staffName: staff.find(s => s.id === shiftStaffId)?.name || editingShift.staffName,
          date: shiftDate,
          timeSlot: shiftTimeSlot,
          status: formShiftStatus,
          updatedAt: Timestamp.now()
        });
        if (formShiftStatus === 'active') {
          await updateDoc(doc(db, 'staff', shiftStaffId), { shiftStatus: 'on_duty' });
        } else if (formShiftStatus === 'completed' || formShiftStatus === 'absent') {
          await updateDoc(doc(db, 'staff', shiftStaffId), { shiftStatus: 'off_duty' });
        }
        alert("Shift updated successfully!");
        setEditingShift(null);
      } else {
        await handleCreateShift(shiftStaffId, shiftDate, shiftTimeSlot);
        setIsCreatingShift(false);
      }
    } catch (err) {
      console.error("Error saving shift schedule:", err);
      alert("Failed to save shift. Check your database connection.");
    }
  };

  const [editingMemoId, setEditingMemoId] = useState<string | null>(null);
  const [poExpectedDelivery, setPoExpectedDelivery] = useState('');
  const [viewingEmail, setViewingEmail] = useState<any | null>(null);

  const [isAiCategorizing, setIsAiCategorizing] = useState(false);

  const handleAiCategorizeAllProducts = async () => {
    if (!window.confirm("Run background Gemini AI check and automatically categorize all products in your catalogue matching common sense rules (e.g. putting olive oil and flours in Food Products)?")) return;
    setIsAiCategorizing(true);
    try {
      let count = 0;
      for (const prod of products) {
        const correctCategory = await categorizeProductByName(prod.name);
        if (prod.category !== correctCategory) {
          await updateDoc(doc(db, 'products', String(prod.id)), {
            category: correctCategory,
            updatedAt: Timestamp.now()
          });
          count++;
        }
      }
      alert(`Success! Auto-categorized entire catalogue. Corrected ${count} product categories.`);
    } catch (err) {
      console.error("AI Catalog Categorization Failed:", err);
      alert("Failed to run AI catalog categorization.");
    } finally {
      setIsAiCategorizing(false);
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/');
  };

  // Realtime Category Subscription & Auto-seeding
  useEffect(() => {
    if (!profile?.isAdmin) return;
    const q = query(collection(db, 'categories'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        const defaults = [
          'Food Products',
          'Household',
          'Alcoholic Drinks',
          'Cosmetics & Personal Care',
          'Baby Products',
          'Kitchenware & Electronics',
          'Sports & Wellness',
          'Pet Care',
          'Office Supplies'
        ];
        try {
          const promises = defaults.map(name => {
            const id = name.toLowerCase().replace(/ & /g, '_').replace(/ /g, '_');
            return setDoc(doc(db, 'categories', id), { name, id, createdAt: Timestamp.now() });
          });
          await Promise.all(promises);
        } catch (err) {
          console.error("Non-blocking error seeding default categories:", err);
        }
      } else {
        const cats = snapshot.docs.map(doc => doc.data().name as string);
        setCategoriesList(cats);
      }
    }, (error) => {
      console.error("Error listening to categories in admin:", error);
    });
    return () => unsubscribe();
  }, [profile?.isAdmin]);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim() || isCreatingCategory) return;
    setIsCreatingCategory(true);
    try {
      const name = newCategoryName.trim();
      const id = name.toLowerCase().replace(/ & /g, '_').replace(/ /g, '_');
      
      const categoryRef = doc(db, 'categories', id);
      await setDoc(categoryRef, {
        name,
        id,
        createdAt: Timestamp.now()
      });
      
      setNewCategoryName('');
      alert(`Category "${name}" created successfully!`);
    } catch (error) {
      console.error("Error creating category:", error);
      alert("Failed to create category. Please try again.");
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleTransferProducts = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferSource || !transferTarget || transferSelectedProducts.length === 0 || isTransferring) {
      alert("Please select a source category, select some products, and choose a target category.");
      return;
    }
    if (transferSource === transferTarget) {
      alert("Source and target categories must be different!");
      return;
    }

    if (!window.confirm(`Are you sure you want to transfer ${transferSelectedProducts.length} product(s) from "${transferSource}" to "${transferTarget}"?`)) {
      return;
    }

    setIsTransferring(true);
    try {
      const dbPromises = transferSelectedProducts.map(prodId => {
        const productRef = doc(db, 'products', prodId);
        return updateDoc(productRef, {
          category: transferTarget,
          updatedAt: Timestamp.now()
        });
      });

      await Promise.all(dbPromises);
      setTransferSelectedProducts([]);
      alert(`Successfully transferred ${dbPromises.length} products to "${transferTarget}"!`);
    } catch (error) {
      console.error("Error transferring products:", error);
      alert("Failed to transfer products. Please try again.");
    } finally {
      setIsTransferring(false);
    }
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
      const prodsMap = new Map<string | number, Product>();
      snapshot.docs.forEach(doc => {
        const prod = { ...doc.data(), id: doc.id } as Product;
        prodsMap.set(prod.id, prod);
      });
      setProducts(Array.from(prodsMap.values()));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
    });

    // Fetch Suppliers
    const unsubscribeSuppliers = onSnapshot(query(collection(db, 'suppliers')), (snapshot) => {
      setSuppliers(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Supplier)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'suppliers');
    });

    // Fetch Staff
    const unsubscribeStaff = onSnapshot(query(collection(db, 'staff')), (snapshot) => {
      setStaff(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as StaffMember)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'staff');
    });

    // Fetch Promotions
    const unsubscribePromos = onSnapshot(query(collection(db, 'promotions')), (snapshot) => {
      setPromotions(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Promotion)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'promotions');
    });

    // Fetch Customers (Users) for Email Alerts/Promos
    const unsubscribeUsers = onSnapshot(query(collection(db, 'users')), (snapshot) => {
      setCustomerUsers(snapshot.docs.map(d => ({ ...d.data(), id: d.id })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    // Fetch Alerts
    const unsubscribeAlerts = onSnapshot(query(collection(db, 'inventoryAlerts'), orderBy('createdAt', 'desc')), (snapshot) => {
      setAlerts(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as InventoryAlert)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'inventoryAlerts');
    });

    // Fetch Purchase Orders (Supplier Demands)
    const unsubscribePurchaseOrders = onSnapshot(query(collection(db, 'purchaseOrders'), orderBy('createdAt', 'desc')), (snapshot) => {
      setPurchaseOrders(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as PurchaseOrder)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'purchaseOrders');
    });

    // Fetch Emails log list
    const unsubscribeEmails = onSnapshot(query(collection(db, 'emails'), orderBy('createdAt', 'desc')), (snapshot) => {
      setEmails(snapshot.docs.map(d => ({ ...d.data(), id: d.id })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'emails');
    });

    // Fetch Shifts
    const unsubscribeShifts = onSnapshot(query(collection(db, 'shifts'), orderBy('createdAt', 'desc')), (snapshot) => {
      setShifts(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as any)));
    }, (error) => {
      console.error("error fetching shifts", error);
    });

    // Fetch Staff Notifications
    const unsubscribeStaffNotifications = onSnapshot(query(collection(db, 'staffNotifications'), orderBy('createdAt', 'desc')), (snapshot) => {
      setStaffNotifications(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as any)));
    }, (error) => {
      console.error("error fetching staff notifications", error);
    });

    return () => {
      unsubscribeOrders();
      unsubscribeProducts();
      unsubscribeSuppliers();
      unsubscribeStaff();
      unsubscribeShifts();
      unsubscribeStaffNotifications();
      unsubscribePromos();
      unsubscribeUsers();
      unsubscribeAlerts();
      unsubscribePurchaseOrders();
      unsubscribeEmails();
    };
  }, [profile?.isAdmin]);

  const handleCreateStaffMemo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memoTitle || !memoMessage) return;

    try {
      const selectedStaff = staff.find(s => s.id === memoStaffId);
      const recipientName = memoStaffId === 'all' ? 'All Staff Members' : (selectedStaff?.name || 'Unknown Staff');
      
      if (editingMemoId) {
        // Edit mode
        await updateDoc(doc(db, 'staffNotifications', editingMemoId), {
          staffId: memoStaffId,
          staffName: recipientName,
          title: memoTitle,
          message: memoMessage,
          type: memoType,
          updatedAt: Timestamp.now()
        });
        alert("Memo Directive successfully updated!");
        setEditingMemoId(null);
      } else {
        // Create mode
        const newMemo: StaffNotification = {
          id: `MEMO-${Date.now()}`.toUpperCase(),
          staffId: memoStaffId,
          staffName: recipientName,
          title: memoTitle,
          message: memoMessage,
          type: memoType,
          sentBy: profile?.displayName || profile?.email || 'System Administrator',
          createdAt: Timestamp.now()
        };

        // Save to Firestore
        await setDoc(doc(db, 'staffNotifications', newMemo.id), newMemo);

        // Create simulated transactional email record in emails list log
        const emailId = `EML-${Date.now()}`.toUpperCase();
        const emailHtml = buildEmailHtml(
          `📌 [${memoType.toUpperCase()}] SIMBA TEAM DIRECTIVE: ${memoTitle}`,
          `
          <p>Dear ${recipientName},</p>
          <p>This is an official administrative directive broadcasted on behalf of the Simba Logistics Operations Board.</p>
          <div style="background-color: #f5f5f5; border-left: 4px solid #f97316; padding: 15px; margin: 15px 0; font-family: monospace;">
            <strong>Subject:</strong> ${memoTitle}<br/>
            <strong>Message:</strong><br/>
            ${memoMessage}
          </div>
          <p>This notification is logged persistently in your staff ledger. Please sign off on your roster portal immediately.</p>
          `,
          "Open Staff Roster Portal",
          "/admin"
        );

        await setDoc(doc(db, 'emails', emailId), {
          id: emailId,
          recipient: memoStaffId === 'all' ? 'staff-broadcast@simba.com' : (selectedStaff?.phone || 'staff-member@simba.com'),
          recipientName: recipientName,
          subject: `📌 [${memoType.toUpperCase()}] Simba Duty Memo: ${memoTitle}`,
          body: emailHtml,
          type: 'staff_broadcast',
          referenceId: newMemo.id,
          createdAt: Timestamp.now()
        });

        alert("Memo successfully transmitted to staff and logged in communication channels!");
      }

      // Clear state
      setMemoTitle('');
      setMemoMessage('');
      setMemoStaffId('all');
      setMemoType('general');
    } catch (error) {
      console.error("Error broadcasting staff memo:", error);
      alert("Broadcast failed, please check your network connection.");
    }
  };

  const handleCreateShift = async (sId: string, sDate: string, sSlot: 'morning' | 'afternoon' | 'night') => {
    const selectedStaff = staff.find(s => s.id === sId);
    if (!selectedStaff) return;

    try {
      const shiftId = `SHF-${Date.now()}`.toUpperCase();
      const newShift: Shift = {
        id: shiftId,
        staffId: sId,
        staffName: selectedStaff.name,
        role: selectedStaff.role,
        date: sDate,
        timeSlot: sSlot,
        status: 'scheduled',
        createdAt: Timestamp.now()
      };

      await setDoc(doc(db, 'shifts', shiftId), newShift);

      // Send automated transactional notification
      const dispatchId = `MEMO-SHF-${Date.now()}`.toUpperCase();
      const autoMemo: StaffNotification = {
        id: dispatchId,
        staffId: sId,
        staffName: selectedStaff.name,
        title: "⚡ Duty Shift Assigned",
        message: `You have been allocated a new duty shift:\n- Date: ${sDate}\n- Timeslot: ${sSlot.toUpperCase()} shift.\n\nPlease log in to check in.`,
        type: 'shift_change',
        sentBy: 'Simba Auto-Scheduler',
        createdAt: Timestamp.now()
      };
      await setDoc(doc(db, 'staffNotifications', dispatchId), autoMemo);

      // Save email entry as transaction record
      const emailId = `EML-${Date.now()}`.toUpperCase();
      const emailHtml = buildEmailHtml(
        `📅 Duty Shift Roster Notice - Simba Operations`,
        `
        <p>Hello ${selectedStaff.name},</p>
        <p>A new shift has been scheduled for you on the Simba duties roster calendar.</p>
        <ul>
          <li><strong>Shift Date:</strong> ${sDate}</li>
          <li><strong>Allocated Timeslot:</strong> ${sSlot.toUpperCase()}</li>
          <li><strong>Current Role:</strong> ${selectedStaff.role}</li>
        </ul>
        <p>Please double-check your calendar and sign-off on your duty checkins.</p>
        `,
        "View Schedule",
        "/admin"
      );
      await setDoc(doc(db, 'emails', emailId), {
        id: emailId,
        recipient: selectedStaff.phone || 'staff@simba.com',
        recipientName: selectedStaff.name,
        subject: `📅 Duty Shift Assigned: ${sDate} (${sSlot.toUpperCase()})`,
        body: emailHtml,
        type: 'staff_shift',
        referenceId: shiftId,
        createdAt: Timestamp.now()
      });

      alert("Shift successfully scheduled and assigned!");
    } catch (err) {
      console.error("error creating shift", err);
    }
  };

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

      // Trigger Email Notification for status transitions (non-blocking)
      const clickedOrder = orders.find(o => o.orderId === orderId);
      if (clickedOrder && (newStatus === 'shipped' || newStatus === 'delivered')) {
        try {
          const userSnap = await getDoc(doc(db, 'users', clickedOrder.userId));
          if (userSnap.exists()) {
            const uData = userSnap.data();
            const emailAddr = uData.email || '';
            const dispName = uData.displayName || 'Simba Valued Customer';
            if (emailAddr) {
              if (newStatus === 'shipped') {
                sendOrderShipping(clickedOrder, emailAddr, dispName).catch(e => console.error(e));
              } else if (newStatus === 'delivered') {
                sendOrderDelivery(clickedOrder, emailAddr, dispName).catch(e => console.error(e));
              }
            }
          }
        } catch (emailErr) {
          console.error("Non-blocking order update email issue:", emailErr);
        }
      }
    } catch (error) {
      console.error("Error updating order:", error);
      alert(t('update_error'));
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const handleCreatePurchaseOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPOSupplierId || poLineItems.length === 0 || !poExpectedDelivery) {
      alert("Please specify supplier, items to order, and delivery SLA target.");
      return;
    }

    // Validate empty values explicitly and ask user to fill them
    const hasEmptyValue = poLineItems.some(item => item.quantity === '' || item.wholesaleCost === '');
    if (hasEmptyValue) {
      alert("Please enter a valid Quantity and Wholesale Cost for all items on your purchase order.");
      return;
    }

    try {
      const targetSupplier = suppliers.find(s => s.id === selectedPOSupplierId);
      if (!targetSupplier) {
        alert("Selected supplier invalid.");
        return;
      }

      // Compute totals with parsed numbers
      const compiledItems = poLineItems.map(lineItem => {
        const prod = products.find(p => p.id === lineItem.productId);
        return {
          id: lineItem.productId,
          name: prod ? prod.name : "Unknown Item",
          quantity: Number(lineItem.quantity),
          cost: Number(lineItem.wholesaleCost)
        };
      });

      const totalCost = compiledItems.reduce((acc, current) => acc + (current.cost * current.quantity), 0);
      const poId = `PO-${Date.now()}`;

      const newPO: PurchaseOrder = {
        id: poId,
        supplierId: selectedPOSupplierId,
        items: compiledItems,
        totalCost,
        status: 'ordered',
        expectedDelivery: poExpectedDelivery,
        createdAt: Timestamp.now()
      };

      // 1. Write to firestore purchaseOrders
      await setDoc(doc(db, 'purchaseOrders', poId), {
        ...newPO,
        createdAt: Timestamp.now()
      });

      // 2. Trigger automated restock email logs (supplier + internal copy)
      await sendSupplierDemand(newPO, targetSupplier, compiledItems);

      // 3. Clear states
      setIsCreatingPO(false);
      setPoLineItems([]);
      setSelectedPOSupplierId('');
      setPoExpectedDelivery('');
      alert(`Success! Purchase Order ${poId} launched. Automated supply demand logs transmitted!`);
    } catch (err) {
      console.error("Failed to construct restock PO demand:", err);
      alert("Encountered exception generating PO.");
    }
  };

  const handleMarkPOShipped = async (po: PurchaseOrder) => {
    try {
      const supplierObj = suppliers.find(s => s.id === po.supplierId);
      if (!supplierObj) {
        alert("Supplier not found.");
        return;
      }

      await updateDoc(doc(db, 'purchaseOrders', po.id), {
        status: 'shipped',
        updatedAt: Timestamp.now()
      });

      await sendSupplierShipmentConfirm(po, supplierObj);
      alert(`Purchase Order ${po.id} marked in transit. Courier tracking notification dispatched!`);
    } catch (err) {
      console.error(err);
      alert("Failed to confirm supplier shipment.");
    }
  };

  const handleConfirmPOReceived = async (po: PurchaseOrder) => {
    try {
      const supplierObj = suppliers.find(s => s.id === po.supplierId);
      if (!supplierObj) {
        alert("Supplier reference error.");
        return;
      }

      // 1. Increment inventory levels for each product in the PO
      const promises = po.items.map((item: any) => {
        const productRef = doc(db, 'products', String(item.id));
        return updateDoc(productRef, {
          stockCount: increment(Number(item.quantity)),
          warehouseStockCount: increment(Number(item.quantity)),
          updatedAt: Timestamp.now()
        });
      });
      await Promise.all(promises);

      // 2. Update status to received
      await updateDoc(doc(db, 'purchaseOrders', po.id), {
        status: 'received',
        updatedAt: Timestamp.now()
      });

      // 3. Trigger receipt confirmation logs
      await sendSupplierGoodsReceived(po, supplierObj);

      // 4. Create an inventory log notification alert
      const alertRef = collection(db, 'inventoryAlerts');
      await addDoc(alertRef, {
        id: `INV-${Date.now()}`,
        type: 'low_stock',
        message: `Restock received for Order #${po.id}! Added bulk supply counts from ${supplierObj.name} to central warehouse.`,
        severity: 'low',
        isRead: false,
        createdAt: Timestamp.now()
      });

      alert(`Success! Goods for Purchase Order ${po.id} received and checked in. Inventory balances updated.`);
    } catch (err) {
      console.error(err);
      alert("Failed to confirm goods check-in.");
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

      rawProductData.rating = isEditingProduct.rating !== undefined ? Number(isEditingProduct.rating) : 0;
      rawProductData.reviewCount = isEditingProduct.reviewCount !== undefined ? Number(isEditingProduct.reviewCount) : 0;
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

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditingSupplier || isSaving) return;
    setIsSaving(true);

    try {
      const isNew = !isEditingSupplier.id;
      const targetId = isNew ? `SUP-${Date.now()}`.toUpperCase() : isEditingSupplier.id;
      const supplierRef = doc(db, 'suppliers', targetId);

      const rawSupplierData = {
        id: targetId,
        name: isEditingSupplier.name || '',
        contactName: isEditingSupplier.contactName || '',
        email: isEditingSupplier.email || '',
        phone: isEditingSupplier.phone || '',
        category: isEditingSupplier.category || 'General',
        active: isEditingSupplier.active !== undefined ? isEditingSupplier.active : true
      };

      await setDoc(supplierRef, rawSupplierData);
      setIsEditingSupplier(null);
      alert("Supplier profile successfully saved!");
    } catch (error) {
      console.error("Error saving supplier:", error);
      alert("Failed to save supplier profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditingStaff || isSaving) return;
    setIsSaving(true);

    try {
      const isNew = !isEditingStaff.id;
      const targetId = isNew ? `STF-${Date.now()}`.toUpperCase() : isEditingStaff.id;
      const staffRef = doc(db, 'staff', targetId);

      const rawStaffData = {
        id: targetId,
        name: isEditingStaff.name || '',
        role: isEditingStaff.role || 'Cashier',
        phone: isEditingStaff.phone || '',
        active: isEditingStaff.active !== undefined ? isEditingStaff.active : true,
        salary: Number(isEditingStaff.salary || 450000),
        tasksCompleted: Number(isEditingStaff.tasksCompleted || 0),
        rating: Number(isEditingStaff.rating || 5.0)
      };

      await setDoc(staffRef, rawStaffData);
      setIsEditingStaff(null);
      alert("Staff profile successfully updated!");
    } catch (error) {
      console.error("Error saving staff:", error);
      alert("Failed to save staff profile");
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
    setEmailBlastStatus("Initializing SMTP connections...");

    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      setEmailBlastStatus(`Generating gorgeous brand HTML templates for ${customerUsers.length > 0 ? customerUsers.length : 1} customers...`);
      await new Promise(resolve => setTimeout(resolve, 300));

      const maxUsers = customerUsers.length > 0 ? customerUsers : [{ displayName: "Test Customer", email: "flavmbish@gmail.com" }];
      
      // Dispatch real email rendering and persistence in Firestore 'emails'
      setEmailBlastStatus("Transmitting and logging secure campaign letters in Firestore database...");
      const count = await sendPromotionEmail(promo, maxUsers);

      const alertRef = collection(db, 'inventoryAlerts');
      await addDoc(alertRef, {
        id: `PROMO-${Date.now()}`,
        type: 'info',
        message: `Promotion broadcast for "${promo.name}" logged and dispatched to ${count} customers.`,
        severity: 'low',
        isRead: false,
        createdAt: Timestamp.now()
      });

      alert(`Success! Promotion broadcast dispatched successfully! ${count} email logs written.`);
      setSendingPromoEmail(null);
    } catch (error) {
      console.error("Error sending promo emails:", error);
      alert("Failed to send promotion emails");
    } finally {
      setIsSendingEmail(false);
      setEmailBlastStatus(null);
    }
  };

  const handleResetReviewsAndRatings = async () => {
    if (!window.confirm("Are you sure you want to delete all customer reviews and reset all product ratings to 0?")) return;
    setIsResettingRatings(true);
    try {
      // 1. Delete all documents in productReviews
      const reviewsSnapshot = await getDocs(collection(db, 'productReviews'));
      if (!reviewsSnapshot.empty) {
        const deletePromises = reviewsSnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
      }

      // 2. Fetch all products and update them to rating 0, reviewCount 0
      const productsSnapshot = await getDocs(collection(db, 'products'));
      if (!productsSnapshot.empty) {
        const productPromises = productsSnapshot.docs.map(doc => 
          updateDoc(doc.ref, {
            rating: 0,
            reviewCount: 0
          })
        );
        await Promise.all(productPromises);
      }

      alert("All reviews have been successfully removed and product ratings have been reset to 0!");
    } catch (error) {
      console.error("Error resetting reviews and ratings:", error);
      alert("Failed to reset reviews and ratings. Please try again.");
    } finally {
      setIsResettingRatings(false);
    }
  };

  const handleSeedData = async () => {
    if (!window.confirm(t('confirm_seed'))) return;
    setIsSeeding(true);
    try {
      // Clear all existing product reviews (removes fake/old reviews)
      try {
        const reviewsSnapshot = await getDocs(collection(db, 'productReviews'));
        if (!reviewsSnapshot.empty) {
          const deletePromises = reviewsSnapshot.docs.map(doc => deleteDoc(doc.ref));
          await Promise.all(deletePromises);
        }
      } catch (revErr) {
        console.error("Non-blocking error clearing product reviews:", revErr);
      }

      // Seed Products
      const productPromises = initialProducts.products.map(async (p: any) => {
        const productRef = doc(db, 'products', String(p.id));
        const { rating, reviewCount, ...prodWithoutRating } = p;
        
        // Dynamic taxonomy categorization via AI rules mapping
        const correctCategory = await categorizeProductByName(p.name);

        return setDoc(productRef, {
          ...prodWithoutRating,
          category: correctCategory,
          rating: 0,
          reviewCount: 0,
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
    ).sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base', numeric: true }))
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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <RefreshCcw className="h-8 w-8 animate-spin text-brand-primary" />
    </div>
  );

  if (!profile?.isAdmin) {
    return <Navigate to="/" replace />;
  }

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
              <>
                <button 
                  onClick={handleSeedData}
                  disabled={isSeeding || isResettingRatings}
                  className="flex items-center gap-2 px-6 py-3 bg-brand-primary text-white dark:text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg shadow-brand-primary/20 disabled:opacity-50"
                >
                  {isSeeding ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                  <span className="hidden md:inline">{t('seed_catalog')}</span>
                </button>
                <button 
                  onClick={handleResetReviewsAndRatings}
                  disabled={isSeeding || isResettingRatings}
                  className="flex items-center gap-2 px-6 py-3 bg-rose-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20 disabled:opacity-50"
                  title="Delete all reviews and reset ratings to 0"
                >
                  {isResettingRatings ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  <span className="hidden md:inline">CLEAR REVIEWS / RATINGS</span>
                </button>
              </>
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
          {newOrderAlerts.map((alert, idx) => (
            <motion.div 
              key={`alert-${alert.orderId}-${idx}`}
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

          {deliveredAlerts.map((alert, idx) => (
            <motion.div 
              key={`delivered-${alert.orderId}-${idx}`}
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
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
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
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
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
            {/* Gemini Rwanda AI Catalog Seeder */}
            <RwandanCatalogSeeder 
              categoriesList={categoriesList}
              onSeedingComplete={() => {
                // Success state handled in child, auto-updating via Firestore snapshot
              }}
            />

            {/* Category Management Block */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-black/5 dark:bg-zinc-900/40 p-8 sm:p-10 rounded-[48px] border border-brand-border">
              {/* Card 1: Create Category */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-black uppercase italic tracking-tighter text-brand-primary">Create New Categories</h3>
                  <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest mt-1">Add custom inventory classification aisles</p>
                </div>
                
                <form onSubmit={handleCreateCategory} className="flex gap-4">
                  <input 
                    type="text"
                    required
                    value={newCategoryName}
                    onChange={e => setNewCategoryName(e.target.value)}
                    placeholder="e.g. Wines & Spirits"
                    className="flex-1 bg-white dark:bg-black border border-brand-border rounded-xl p-4 text-xs font-bold"
                  />
                  <button 
                    type="submit"
                    disabled={isCreatingCategory}
                    className="px-8 bg-brand-primary text-white font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-orange-600 transition-all flex items-center gap-2 italic"
                  >
                    {isCreatingCategory ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Create
                  </button>
                </form>

                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest opacity-40">Active Store Categories ({categoriesList.length})</label>
                  <div className="flex flex-wrap gap-2 max-h-[140px] overflow-y-auto p-4 bg-white/50 dark:bg-black/50 border border-brand-border rounded-2xl custom-scrollbar">
                    {categoriesList.map(cat => (
                      <span key={cat} className="text-[8px] font-black uppercase tracking-widest bg-zinc-500/10 border border-zinc-500/15 p-2 py-1 rounded-md italic">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card 2: Bulk Transfer Category */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-black uppercase italic tracking-tighter text-brand-primary">Aisle Transfer Tool</h3>
                  <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest mt-1">Re-classify and transfer products between categories</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest opacity-40">Source Category</label>
                    <select
                      value={transferSource}
                      onChange={e => {
                        setTransferSource(e.target.value);
                        setTransferSelectedProducts([]);
                      }}
                      className="w-full bg-white dark:bg-black border border-brand-border rounded-xl p-3 text-xs font-bold text-zinc-800 dark:text-zinc-200"
                    >
                      <option value="">Select Source</option>
                      {categoriesList.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest opacity-40">Target Category</label>
                    <select
                      value={transferTarget}
                      onChange={e => setTransferTarget(e.target.value)}
                      className="w-full bg-white dark:bg-black border border-brand-border rounded-xl p-3 text-xs font-bold text-zinc-800 dark:text-zinc-200"
                    >
                      <option value="">Select Target</option>
                      {categoriesList.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {transferSource && (
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest opacity-40">Select Units to Transfer ({products.filter(p => p.category === transferSource).length} Available)</label>
                    <div className="max-h-[120px] overflow-y-auto p-4 bg-white/50 dark:bg-black/50 border border-brand-border rounded-2xl space-y-2 custom-scrollbar">
                      {products.filter(p => p.category === transferSource).map(prod => {
                        const isChecked = transferSelectedProducts.includes(prod.id);
                        return (
                          <label key={prod.id} className="flex items-center gap-3 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 p-1 rounded-lg transition-colors">
                            <input 
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setTransferSelectedProducts(prev => prev.filter(id => id !== prod.id));
                                } else {
                                  setTransferSelectedProducts(prev => [...prev, prod.id]);
                                }
                              }}
                              className="accent-brand-primary rounded"
                            />
                            <span className="text-[10px] font-bold uppercase tracking-wide truncate">{prod.name}</span>
                          </label>
                        );
                      })}
                      {products.filter(p => p.category === transferSource).length === 0 && (
                        <p className="text-[9px] font-bold opacity-30 text-center uppercase py-4">No products in this category</p>
                      )}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleTransferProducts}
                  disabled={isTransferring || !transferSource || !transferTarget || transferSelectedProducts.length === 0}
                  className="w-full py-4 bg-brand-primary text-white dark:text-black font-black uppercase tracking-widest text-[9px] rounded-xl flex items-center justify-center gap-2 hover:bg-orange-600 transition-all disabled:opacity-30 italic cursor-pointer"
                >
                  {isTransferring ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Layers className="h-4 w-4" />}
                  Transfer {transferSelectedProducts.length > 0 ? `${transferSelectedProducts.length} ` : ''}Selected Units
                </button>
              </div>
            </div>

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
                onClick={handleAiCategorizeAllProducts}
                disabled={isAiCategorizing}
                type="button"
                className="w-full sm:w-auto px-8 py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 italic shadow-xl shadow-zinc-800/20 disabled:opacity-50 cursor-pointer"
              >
                <span>{isAiCategorizing ? "Categorizing..." : "🪄 AI Auto-Categorize"}</span>
              </button>
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
                        <div className="flex justify-between items-center px-1">
                          <label className="text-[10px] font-black uppercase tracking-widest opacity-40">{t('category')}</label>
                          <button
                            type="button"
                            onClick={async () => {
                              if (!isEditingProduct.name) {
                                alert("Please enter a product name first!");
                                return;
                              }
                              try {
                                const aiCat = await categorizeProductByName(isEditingProduct.name);
                                setIsEditingProduct(prev => prev ? { ...prev, category: aiCat } : null);
                              } catch (err) {
                                console.error("Error auto classifying:", err);
                              }
                            }}
                            className="text-[9px] font-black uppercase tracking-wider text-brand-primary hover:bg-brand-primary/5 px-2 py-0.5 rounded border border-brand-primary/25 transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <span>🪄 AI SUGGEST</span>
                          </button>
                        </div>
                        <select 
                          required
                          value={isEditingProduct.category || ''}
                          onChange={e => setIsEditingProduct({...isEditingProduct, category: e.target.value})}
                          className="w-full bg-black/5 dark:bg-black border border-brand-border rounded-xl p-4 font-bold appearance-none text-xs sm:text-sm uppercase tracking-wider"
                        >
                          <option value="">Select Category</option>
                          {categoriesList.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                          <option value="Other">{t('cat_other')}</option>
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
            {/* Staff & Roster Section Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-2xl font-black uppercase italic tracking-tighter text-zinc-900 dark:text-white">{t('portal_staff')} & Shifts</h3>
                <p className="text-xs text-zinc-500 font-bold uppercase">Schedule staff rosters, toggle operational shift statuses, and dispatch alerts</p>
              </div>
              <div className="flex gap-2">
                {activeStaffTab === 'directory' && (
                  <button 
                    onClick={() => setIsEditingStaff({ name: '', role: 'cashier', phone: '', shiftStatus: 'off_duty', performanceScore: 92 })}
                    className="px-6 py-3 bg-brand-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 italic hover:scale-105 transition-all shadow-lg shadow-brand-primary/10"
                  >
                    <Plus className="h-4 w-4" /> {t('add_staff')}
                  </button>
                )}
                {activeStaffTab === 'shifts' && (
                  <button 
                    onClick={() => {
                      if (staff.length > 0) {
                        setShiftStaffId(staff[0]?.id || '');
                        setIsCreatingShift(true);
                      } else {
                        alert("Please register at least one staff member first!");
                      }
                    }}
                    className="px-6 py-3 bg-brand-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 italic hover:scale-105 transition-all shadow-lg shadow-brand-primary/10"
                  >
                    <Plus className="h-4 w-4" /> Assign New Shift
                  </button>
                )}
                {activeStaffTab === 'messages' && (
                  <button 
                    onClick={() => setIsCreatingStaffMemo(true)}
                    className="px-6 py-3 bg-brand-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 italic hover:scale-105 transition-all shadow-lg shadow-brand-primary/10"
                  >
                    <Megaphone className="h-4 w-4" /> Dispatch Alert Memo
                  </button>
                )}
              </div>
            </div>

            {/* Sub Tabs Selection */}
            <div className="flex border-b border-brand-border pb-1 gap-2 flex-wrap">
              <button
                onClick={() => setActiveStaffTab('directory')}
                className={cn(
                  "px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border",
                  activeStaffTab === 'directory'
                    ? "bg-brand-primary text-white border-brand-primary shadow-lg shadow-brand-primary/10"
                    : "bg-black/5 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800"
                )}
              >
                Team Directory
              </button>
              <button
                onClick={() => setActiveStaffTab('shifts')}
                className={cn(
                  "px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border",
                  activeStaffTab === 'shifts'
                    ? "bg-brand-primary text-white border-brand-primary shadow-lg shadow-brand-primary/10"
                    : "bg-black/5 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800"
                )}
              >
                Duty Shifts Planner ({shifts.length})
              </button>
              <button
                onClick={() => setActiveStaffTab('messages')}
                className={cn(
                  "px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border",
                  activeStaffTab === 'messages'
                    ? "bg-brand-primary text-white border-brand-primary shadow-lg shadow-brand-primary/10"
                    : "bg-black/5 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800"
                )}
              >
                Memos & Logs ({staffNotifications.length})
              </button>
            </div>

            {/* Tab contents (1) TEAM DIRECTORY */}
            {activeStaffTab === 'directory' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {staff.map(member => (
                  <div key={member.id} className="bg-white dark:bg-black/20 border border-brand-border p-6 rounded-[32px] group hover:border-brand-primary/50 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-6">
                        <div className="w-16 h-16 bg-black/5 dark:bg-white/5 rounded-2xl flex items-center justify-center font-black text-2xl italic text-brand-primary">
                          {member.name.charAt(0)}
                        </div>
                        <button
                          onClick={async () => {
                            const newStatus = member.shiftStatus === 'on_duty' ? 'off_duty' : 'on_duty';
                            await updateDoc(doc(db, 'staff', member.id), { shiftStatus: newStatus });
                          }}
                          className={cn(
                            "px-3 py-1 rounded-full text-[8px] font-black uppercase italic border transition-all cursor-pointer hover:scale-102",
                            member.shiftStatus === 'on_duty' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-black/5 text-zinc-500 border-black/10 text-neutral-500"
                          )}
                          title="Toggle duty status"
                        >
                          {t(member.shiftStatus)}
                        </button>
                      </div>
                      <h4 className="text-lg font-black uppercase italic tracking-tight">{member.name}</h4>
                      <p className="text-[10px] font-black uppercase opacity-40 mb-1">{t(member.role)}</p>
                      {member.phone && <p className="font-mono text-xs text-zinc-400 mb-4">{member.phone}</p>}
                      
                      <div className="space-y-2 mb-6">
                        <div className="flex justify-between text-[9px] font-bold uppercase italic opacity-60">
                          <span>{t('attendance')}</span>
                          <span>{member.performanceScore || 90}% Score</span>
                        </div>
                        <div className="w-full bg-black/5 dark:bg-white/5 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-brand-primary h-full" style={{ width: `${member.performanceScore || 90}%` }} />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setShiftStaffId(member.id);
                          setShiftDate(new Date().toISOString().split('T')[0]);
                          setIsCreatingShift(true);
                        }}
                        className="flex-1 py-3 bg-black/5 dark:bg-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-brand-primary hover:text-white transition-all italic text-center"
                      >
                        {t('schedule')}
                      </button>
                      <button 
                        onClick={() => setIsEditingStaff(member)}
                        className="p-3 bg-black/5 dark:bg-white/5 rounded-xl text-[var(--brand-text)] hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all"
                        title="Edit profile"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={async () => {
                          if (window.confirm(`Are you sure you want to delete ${member.name}?`)) {
                            await deleteDoc(doc(db, 'staff', member.id));
                          }
                        }}
                        className="p-3 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all"
                        title="Delete staff member"
                      >
                        <Trash2 className="h-4 w-4" />
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
            )}

            {/* Tab contents (2) SHIFTS SCHEDULER */}
            {activeStaffTab === 'shifts' && (
              <div className="bg-[#1c1c1e]/5 dark:bg-zinc-900/40 p-6 md:p-8 rounded-[40px] border border-zinc-200 dark:border-zinc-800">
                <div className="mb-6">
                  <h4 className="text-lg font-black uppercase italic tracking-tight">Assigned Duty Shift Planner</h4>
                  <p className="text-xs text-zinc-500">Live roster capturing all team schedules, timeslots, and attendance coverage</p>
                </div>

                <div className="space-y-4">
                  {shifts.map((sh) => (
                    <div key={sh.id} className="bg-white dark:bg-zinc-950 p-6 rounded-[32px] border border-zinc-200 dark:border-zinc-900 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="font-mono text-[10px] text-zinc-400 font-bold uppercase">{sh.id}</span>
                          <span className="text-xs font-black uppercase tracking-widest bg-brand-primary/10 text-brand-primary px-2.5 py-0.5 rounded-full border border-brand-primary/15">{sh.timeSlot} shift</span>
                          <span className={cn(
                            "text-[8px] font-black uppercase px-2 py-0.5 rounded-full border",
                            sh.status === 'completed' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                            sh.status === 'active' ? "bg-amber-500/15 text-amber-500 border-amber-500/20 animate-pulse" :
                            sh.status === 'absent' ? "bg-rose-500/10 text-rose-500 border-rose-500/20" :
                            "bg-blue-500/10 text-blue-500 border-blue-500/25"
                          )}>
                            {sh.status}
                          </span>
                        </div>
                        <h5 className="font-black text-base uppercase italic tracking-tight dark:text-white truncate">{sh.staffName}</h5>
                        <p className="text-xs text-zinc-400 font-bold uppercase">Role: {t(sh.role || 'cashier')} • Assigned Date: {sh.date}</p>
                      </div>

                      <div className="flex gap-2 self-stretch md:self-auto shrink-0 flex-wrap">
                        {sh.status === 'scheduled' && (
                          <>
                            <button
                              onClick={async () => {
                                await updateDoc(doc(db, 'shifts', sh.id), { status: 'active' });
                                // Toggle actual shift status under staff
                                await updateDoc(doc(db, 'staff', sh.staffId), { shiftStatus: 'on_duty' });
                              }}
                              className="px-4 py-2.5 text-zinc-800 dark:text-zinc-200 bg-amber-500/10 hover:bg-amber-500 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-colors"
                            >
                              START SHIFT
                            </button>
                            <button
                              onClick={async () => {
                                await updateDoc(doc(db, 'shifts', sh.id), { status: 'absent' });
                                await updateDoc(doc(db, 'staff', sh.staffId), { shiftStatus: 'off_duty' });
                              }}
                              className="px-4 py-2.5 text-rose-600 bg-rose-500/10 hover:bg-rose-500 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all"
                            >
                              MARK ABSENT
                            </button>
                          </>
                        )}
                        {sh.status === 'active' && (
                          <button
                            onClick={async () => {
                              await updateDoc(doc(db, 'shifts', sh.id), { status: 'completed' });
                              await updateDoc(doc(db, 'staff', sh.staffId), { shiftStatus: 'off_duty' });
                            }}
                            className="px-4 py-2.5 text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all"
                          >
                            COMPLETE SHIFT ✔
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setEditingShift(sh);
                          }}
                          className="p-2.5 text-blue-500 bg-blue-500/10 hover:bg-blue-500 hover:text-white rounded-xl transition-all cursor-pointer"
                          title="Edit roster shift details"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={async () => {
                            if (window.confirm("Delete this shift schedule entry?")) {
                              await deleteDoc(doc(db, 'shifts', sh.id));
                            }
                          }}
                          className="p-2.5 text-rose-500 bg-rose-500/10 hover:bg-rose-500 hover:text-white rounded-xl transition-all cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {shifts.length === 0 && (
                    <div className="py-20 text-center text-zinc-500 italic opacity-40 uppercase font-black">
                      No team shifts allocated or active on custom roster.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab contents (3) STAFF MESSAGES & DISPATCH */}
            {activeStaffTab === 'messages' && (
              <div className="space-y-6">
                {/* Draft Outbox Compose Form */}
                <div id="memo-composer-terminal" className="bg-white dark:bg-zinc-950 p-6 md:p-8 rounded-[40px] border border-brand-border shadow-xl shadow-zinc-100/5 select-text">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center">
                      <Megaphone className="h-5 w-5 text-brand-primary" />
                    </div>
                    <div>
                      <h4 className="text-base font-black uppercase italic tracking-tight">Staff Memo Broadcast terminal</h4>
                      <p className="text-[10px] text-zinc-400 font-bold uppercase">Send internal directives, rules, or safety bulletins instantly</p>
                    </div>
                  </div>

                  <form onSubmit={handleCreateStaffMemo} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1.5">Target Audience</label>
                        <select
                          value={memoStaffId}
                          onChange={e => setMemoStaffId(e.target.value)}
                          className="w-full bg-black/5 dark:bg-black/30 border border-brand-border rounded-xl px-4 py-3.5 text-xs text-[var(--brand-text)] focus:outline-none focus:border-brand-primary italic font-bold uppercase"
                        >
                          <option value="all">All Registree Staff</option>
                          {staff.map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({t(s.role)})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1.5">Directive Severity Type</label>
                        <select
                          value={memoType}
                          onChange={e => setMemoType(e.target.value as any)}
                          className="w-full bg-black/5 dark:bg-black/30 border border-brand-border rounded-xl px-4 py-3.5 text-xs text-[var(--brand-text)] focus:outline-none focus:border-brand-primary italic font-bold uppercase"
                        >
                          <option value="general">Regular Directive Memo</option>
                          <option value="shift_change">Shift Scheduling Notification</option>
                          <option value="announcement">New Store Policy / Announcement</option>
                          <option value="alert">🚨 High Alert Urgent Directive</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1.5">Memo Header Summary</label>
                        <input
                          type="text"
                          required
                          value={memoTitle}
                          onChange={e => setMemoTitle(e.target.value)}
                          placeholder="e.g. Safety procedure review, System maintenance alert"
                          className="w-full bg-black/5 dark:bg-black/30 border border-brand-border rounded-xl px-4 py-3 text-xs text-[var(--brand-text)] focus:outline-none focus:border-brand-primary font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1.5">Message Body Content</label>
                      <textarea
                        required
                        rows={3}
                        value={memoMessage}
                        onChange={e => setMemoMessage(e.target.value)}
                        placeholder="Type standard email or SMS text to dispatch..."
                        className="w-full bg-black/5 dark:bg-black/30 border border-brand-border rounded-2xl px-4 py-3 text-xs text-[var(--brand-text)] focus:outline-none focus:border-brand-primary"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                      {editingMemoId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingMemoId(null);
                            setMemoTitle('');
                            setMemoMessage('');
                            setMemoStaffId('all');
                            setMemoType('general');
                          }}
                          className="px-6 py-4 bg-zinc-650 hover:bg-zinc-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest italic cursor-pointer"
                        >
                          Cancel Edit
                        </button>
                      )}
                      <button
                        type="submit"
                        className="px-6 py-4 bg-brand-primary hover:bg-orange-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest italic flex items-center gap-2 shadow-lg shadow-brand-primary/20 transform hover:scale-101 transition-all cursor-pointer pointer-events-auto"
                      >
                        <Send className="h-4 w-4" /> {editingMemoId ? "SAVE UPDATED MEMO DIRECTIVE" : "TRANSMIT DISPATCH ALERT MEMO"}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Dispatch Journal Lists */}
                <div className="bg-[#1c1c1e]/5 dark:bg-zinc-900/40 p-6 md:p-8 rounded-[40px] border border-zinc-200 dark:border-zinc-800">
                  <h4 className="text-base font-black uppercase italic tracking-tight mb-4 text-zinc-900 dark:text-white">Directive Transmissions Journal</h4>
                  <div className="space-y-4">
                    {staffNotifications.map((notif) => (
                      <div key={notif.id} className="bg-white dark:bg-zinc-950 p-6 rounded-[32px] border border-zinc-200 dark:border-zinc-900 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-zinc-400 font-bold block text-[10px]">{notif.id}</span>
                            <span className={cn(
                              "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border",
                              notif.type === 'alert' ? "bg-rose-500/10 text-rose-500 border-rose-500/15" :
                              notif.type === 'shift_change' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                              "bg-zinc-500/10 text-zinc-500 border-zinc-500/15 text-zinc-500"
                            )}>
                              {notif.type}
                            </span>
                            <span className="text-[10px] font-black text-emerald-500 uppercase flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block animate-pulse" /> DISPATCHED
                            </span>
                          </div>
                          <h5 className="font-black text-base uppercase italic tracking-tight text-zinc-950 dark:text-white">{notif.title}</h5>
                          <blockquote className="text-xs text-zinc-650 dark:text-zinc-300 border-l-2 border-brand-primary pl-3 py-1 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-r-md leading-relaxed whitespace-pre-line">{notif.message}</blockquote>
                          <p className="text-[10px] text-zinc-550 dark:text-zinc-400 font-bold uppercase">To: {notif.staffName} ({notif.staffId}) • Dispatched By: {notif.sentBy} • On: {notif.createdAt?.toDate ? notif.createdAt.toDate().toLocaleString() : new Date(notif.createdAt).toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 self-stretch md:self-auto justify-end">
                          <button
                            onClick={() => {
                              setEditingMemoId(notif.id);
                              setMemoStaffId(notif.staffId);
                              setMemoType(notif.type);
                              setMemoTitle(notif.title);
                              setMemoMessage(notif.message);
                              setIsCreatingStaffMemo(true);
                              // Smooth scroll up to composer
                              const composerEl = document.getElementById('memo-composer-terminal');
                              if (composerEl) {
                                composerEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              } else {
                                window.scrollTo({ top: 380, behavior: 'smooth' });
                              }
                            }}
                            className="p-3 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white rounded-xl transition-all scale-90 flex items-center justify-center cursor-pointer"
                            title="Edit this directive"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={async () => {
                              if (window.confirm("Archive this notification entry?")) {
                                await deleteDoc(doc(db, 'staffNotifications', notif.id));
                              }
                            }}
                            className="p-3 bg-rose-500/10 text-[#f43f5e] hover:bg-rose-500 hover:text-white rounded-xl transition-all scale-90 flex items-center justify-center cursor-pointer"
                            title="Delete this directive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {staffNotifications.length === 0 && (
                      <div className="py-16 text-center text-zinc-500 italic opacity-40 uppercase font-black">
                        No team announcements or memos logged.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
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

            {/* Direct Customer Email Campaign Broadcast Panel */}
            <div className="bg-[#1c1c1e]/5 dark:bg-zinc-900/40 p-6 md:p-8 rounded-[40px] border border-zinc-200 dark:border-zinc-800 mt-10">
              <div className="mb-6">
                <h4 className="text-lg font-black uppercase italic tracking-tight text-zinc-900 dark:text-white">Active Promotion Broadcasts Center</h4>
                <p className="text-xs text-zinc-500">Deliver exquisite, styled digital checkout codes directly to the email of registered customers</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {promotions.map((promo) => (
                  <div key={promo.id} className="bg-white dark:bg-zinc-950 p-6 rounded-[32px] border border-[#2d2d2d] dark:border-zinc-900 flex flex-col justify-between gap-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] font-black uppercase px-2.5 py-1 rounded-full text-brand-primary bg-brand-primary/10 border border-brand-primary/25">
                          {promo.type === 'percentage' ? `${promo.value}% discount` : `value RWF ${promo.value}`}
                        </span>
                        <span className="font-mono text-zinc-500 text-[10px]">#{promo.id}</span>
                      </div>

                      <h5 className="font-black text-lg text-zinc-900 dark:text-white uppercase italic tracking-tight">{promo.name}</h5>
                      <p className="text-xs text-zinc-500 leading-relaxed">Runs from {promo.startDate ? (promo.startDate.toDate ? promo.startDate.toDate().toLocaleDateString() : new Date(promo.startDate).toLocaleDateString()) : ''} to {promo.endDate ? (promo.endDate.toDate ? promo.endDate.toDate().toLocaleDateString() : new Date(promo.endDate).toLocaleDateString()) : ''}. Applicable on select premium Kigali merchandise stores.</p>
                    </div>

                    <button
                      onClick={() => setSendingPromoEmail(promo)}
                      className="w-full py-4 bg-brand-primary hover:bg-orange-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest text-center flex items-center justify-center gap-2 italic transform transition-transform hover:scale-102"
                    >
                      <Megaphone className="h-4 w-4" /> Broadcast campaign via email
                    </button>
                  </div>
                ))}

                {promotions.length === 0 && (
                  <div className="col-span-1 md:col-span-2 py-20 text-center text-zinc-505 italic opacity-40 uppercase font-black">
                    Configure a Promotion before initiating broadcasts
                  </div>
                )}
              </div>
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
            {/* Suppliers Section Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-2xl font-black uppercase italic tracking-tighter text-zinc-900 dark:text-white">{t('portal_suppliers')} & Logistics</h3>
                <p className="text-xs text-zinc-500 font-bold uppercase">Oversee direct Kigali vendor partnerships, dispatch replenishment requests, and audit logistics channels</p>
              </div>
              <div className="flex gap-2">
                {activeSupplierTab === 'directory' && (
                  <button 
                    onClick={() => setIsEditingSupplier({ name: '', contactName: '', email: '', phone: '', category: 'General', active: true })}
                    className="px-6 py-3 bg-brand-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 italic hover:scale-105 transition-all shadow-lg shadow-brand-primary/10"
                  >
                    <Plus className="h-4 w-4" /> {t('add_supplier')}
                  </button>
                )}
                {activeSupplierTab === 'po' && (
                  <button
                    onClick={() => {
                      setPoLineItems([{ productId: products[0]?.id || '', quantity: '', wholesaleCost: '' }]);
                      setIsCreatingPO(true);
                    }}
                    className="px-6 py-3 bg-brand-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 italic hover:scale-105 transition-all shadow-lg shadow-brand-primary/10"
                  >
                    <Plus className="h-4 w-4" /> Create PO restock demand
                  </button>
                )}
              </div>
            </div>

            {/* Sub Tabs Selection */}
            <div className="flex border-b border-brand-border pb-1 gap-2 flex-wrap">
              <button
                onClick={() => setActiveSupplierTab('directory')}
                className={cn(
                  "px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border",
                  activeSupplierTab === 'directory'
                    ? "bg-brand-primary text-white border-brand-primary shadow-lg shadow-brand-primary/10"
                    : "bg-black/5 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800"
                )}
              >
                Supplier Directory ({suppliers.length})
              </button>
              <button
                onClick={() => setActiveSupplierTab('po')}
                className={cn(
                  "px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border",
                  activeSupplierTab === 'po'
                    ? "bg-brand-primary text-white border-brand-primary shadow-lg shadow-brand-primary/10"
                    : "bg-black/5 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800"
                )}
              >
                Logistics & Restocking (POs) ({purchaseOrders.length})
              </button>
              <button
                onClick={() => setActiveSupplierTab('messages')}
                className={cn(
                  "px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border",
                  activeSupplierTab === 'messages'
                    ? "bg-brand-primary text-white border-brand-primary shadow-lg shadow-brand-primary/10"
                    : "bg-black/5 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800"
                )}
              >
                SMTP Logistics Messages ({emails.filter(e => e.type?.startsWith('supplier')).length})
              </button>
            </div>

            {/* TAB CONTENTS (1) DIRECTORY */}
            {activeSupplierTab === 'directory' && (
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
                            <span className="block font-mono text-[9px] text-zinc-450 uppercase">{supplier.id}</span>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold">{supplier.contactName}</span>
                              <span className="text-[9px] opacity-40 uppercase select-all">{supplier.email}</span>
                              {supplier.phone && <span className="text-[9px] font-mono select-all text-zinc-455">{supplier.phone}</span>}
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className="text-[10px] font-black uppercase tracking-widest bg-zinc-500/10 text-zinc-500 px-3 py-1 rounded-full italic">
                              {supplier.category}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-center">
                            <button
                              onClick={async () => {
                                await updateDoc(doc(db, 'suppliers', supplier.id), { active: !supplier.active });
                              }}
                              className={cn(
                                "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase italic border transition-all cursor-pointer hover:scale-103",
                                supplier.active ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                              )}
                              title="Toggle active status"
                            >
                              {supplier.active ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Create restock PO for this supplier specifically */}
                              <button
                                onClick={() => {
                                  setSelectedPOSupplierId(supplier.id);
                                  setPoLineItems([{ productId: products[0]?.id || '', quantity: '', wholesaleCost: '' }]);
                                  setIsCreatingPO(true);
                                }}
                                className="p-3 bg-brand-primary/10 text-brand-primary rounded-xl hover:bg-brand-primary hover:text-white transition-all scale-90"
                                title="File restocking request (PO)"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setIsEditingSupplier(supplier)}
                                className="p-3 bg-[#e0e7ff]/30 text-indigo-500 rounded-xl hover:bg-indigo-550 hover:text-white transition-all scale-90"
                                title="Edit partnership profile"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={async () => {
                                  if (window.confirm(`Dissolve partnership with vendor "${supplier.name}"? This removes them from system archives.`)) {
                                    await deleteDoc(doc(db, 'suppliers', supplier.id));
                                  }
                                }}
                                className="p-3 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all scale-90"
                                title="Delete supplier description"
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
            )}

            {/* TAB CONTENTS (2) LOGISTICS & POs */}
            {activeSupplierTab === 'po' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white dark:bg-zinc-900 p-6 rounded-[32px] border border-zinc-200 dark:border-zinc-805 shadow-xl shadow-zinc-200/5">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Total Issued Demands</p>
                    <p className="text-3xl font-black italic text-zinc-900 dark:text-white mt-1">{purchaseOrders.length} Orders</p>
                  </div>
                  <div className="bg-white dark:bg-zinc-900 p-6 rounded-[32px] border border-zinc-200 dark:border-zinc-805 shadow-xl shadow-zinc-200/5">
                    <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Awaiting Deliveries (Open)</p>
                    <p className="text-3xl font-black italic text-zinc-900 dark:text-white mt-1">
                      {purchaseOrders.filter(po => po.status === 'ordered' || po.status === 'shipped').length} Open
                    </p>
                  </div>
                  <div className="bg-white dark:bg-zinc-900 p-6 rounded-[32px] border border-zinc-200 dark:border-zinc-850 shadow-xl shadow-zinc-200/5">
                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Goods Checked In (Restocked)</p>
                    <p className="text-3xl font-black italic text-zinc-900 dark:text-white mt-1">
                      {purchaseOrders.filter(po => po.status === 'received').length} Completed
                    </p>
                  </div>
                </div>

                <div className="bg-[#1c1c1e]/5 dark:bg-zinc-900/40 p-6 md:p-8 rounded-[40px] border border-zinc-200 dark:border-zinc-800">
                  <div className="mb-6">
                    <h4 className="text-lg font-black uppercase italic tracking-tight text-zinc-950 dark:text-white">Supply restock requests</h4>
                    <p className="text-xs text-zinc-500">Demanded replenishment items linked directly to premium Kigali suppliers</p>
                  </div>

                  <div className="space-y-4">
                    {purchaseOrders.map((po) => {
                      const supplierOfPO = suppliers.find(s => s.id === po.supplierId);
                      return (
                        <div key={po.id} className="bg-white dark:bg-zinc-950 p-6 rounded-[32px] border border-zinc-200 dark:border-zinc-900 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                          <div className="space-y-3 flex-1 w-full">
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className="font-mono text-zinc-400 font-bold block select-all text-xs">{po.id}</span>
                              <span className="text-zinc-500 dark:text-zinc-400 font-black uppercase italic tracking-wide text-sm">• {supplierOfPO ? supplierOfPO.name : `Supplier ID ${po.supplierId}`}</span>
                              <span className={cn(
                                "text-[9px] font-black uppercase px-2.5 py-1 rounded-full border tracking-wider",
                                po.status === 'received' 
                                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/10" 
                                  : po.status === 'shipped'
                                  ? "bg-orange-500/10 text-orange-500 border-orange-500/10 animate-pulse"
                                  : "bg-amber-500/10 text-amber-500 border-amber-500/10 animate-pulse"
                              )}>
                                {po.status}
                              </span>
                            </div>

                            <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 max-w-xl">
                              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Requested Goods:</p>
                              <div className="flex flex-col gap-1">
                                {po.items && po.items.map((line: any, lIdx: number) => (
                                  <div key={lIdx} className="text-xs flex justify-between">
                                    <span className="text-zinc-700 dark:text-zinc-300">• {line.name} <strong className="opacity-60 text-[10px] font-mono">x{line.quantity}</strong></span>
                                    <span className="font-mono text-zinc-500">{formatCurrency(line.cost)}/ea</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="flex gap-4 text-xs font-semibold text-zinc-500 flex-wrap">
                              <span>SLA target: <strong className="text-zinc-700 dark:text-zinc-350">{po.expectedDelivery}</strong></span>
                              <span>Total Quote: <strong className="text-zinc-900 dark:text-white font-black">{formatCurrency(po.totalCost)}</strong></span>
                            </div>
                          </div>

                          <div className="flex gap-2 self-stretch md:self-auto flex-col w-full md:w-auto shrink-0">
                            {po.status === 'ordered' && (
                              <>
                                <button
                                  onClick={() => handleMarkPOShipped(po)}
                                  className="px-5 py-3 text-white bg-orange-500 hover:bg-orange-600 rounded-xl text-[10px] font-black uppercase tracking-widest italic flex items-center justify-center gap-2 transition-transform hover:scale-[1.02]"
                                >
                                  <Truck className="h-4 w-4" /> MARK SHIPPED 🚚
                                </button>
                                <button
                                  onClick={() => handleConfirmPOReceived(po)}
                                  className="px-5 py-3 text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-widest italic flex items-center justify-center gap-2 transition-transform hover:scale-[1.02]"
                                >
                                  <CheckCircle className="h-4 w-4" /> VERIFY & RECEIVE ✔
                                </button>
                              </>
                            )}
                            {po.status === 'shipped' && (
                              <button
                                onClick={() => handleConfirmPOReceived(po)}
                                className="px-5 py-3 text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-widest italic flex items-center justify-center gap-2 transition-transform hover:scale-[1.02]"
                              >
                                <CheckCircle className="h-4 w-4" /> VERIFY & RECEIVE ✔
                              </button>
                            )}
                            {po.status === 'received' && (
                              <div className="text-[10px] font-black text-emerald-500 border border-emerald-500/20 bg-emerald-500/5 p-3 rounded-xl uppercase tracking-widest text-center">
                                Checked In & Restocked
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {purchaseOrders.length === 0 && (
                      <div className="py-20 text-center text-zinc-500 italic opacity-40 uppercase font-black">
                        No purchase restock orders filed yet
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENTS (3) SMTP MESSAGES LOGS */}
            {activeSupplierTab === 'messages' && (
              <div className="space-y-6">
                <div className="bg-[#1c1c1e]/5 dark:bg-zinc-900/40 p-6 md:p-8 rounded-[40px] border border-zinc-200 dark:border-zinc-800">
                  <div className="mb-6">
                    <h4 className="text-lg font-black uppercase italic tracking-tight text-zinc-900 dark:text-white">Supplier Communications Ledger</h4>
                    <p className="text-xs text-zinc-500">Live journal recording all system SMTP mail dispatches concerning order placements, supplier shipment approvals, and cargo receipts</p>
                  </div>

                  <div className="space-y-4">
                    {emails
                      .filter(e => e.type?.startsWith('supplier') || e.recipient?.includes('supplier') || e.subject?.toUpperCase().includes('RESTOCK') || e.subject?.toUpperCase().includes('DEMAND') || e.subject?.toUpperCase().includes('CARGO'))
                      .map((email) => (
                        <div key={email.id} className="bg-white dark:bg-zinc-950 p-6 rounded-[32px] border border-zinc-200 dark:border-zinc-900 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                          <div className="space-y-2 flex-1 w-full">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-zinc-400 font-bold block text-xs">{email.id}</span>
                              <span className="text-[10px] font-black uppercase italic text-zinc-500">• {email.type ? email.type.replace('_', ' ') : 'notification'}</span>
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse ml-2" />
                              <span className="text-[10px] font-black text-emerald-500 uppercase">TRANSMITTED</span>
                            </div>

                            <h5 className="font-black text-base uppercase italic text-zinc-950 dark:text-white select-all">{email.subject}</h5>

                            <div className="flex gap-4 text-xs font-semibold text-zinc-500 flex-wrap">
                              <span>To: <strong className="text-zinc-700 dark:text-zinc-300 select-all">{email.recipientName} &lt;{email.recipient || email.to}&gt;</strong></span>
                              <span>On: <strong>{email.createdAt?.toDate ? email.createdAt.toDate().toLocaleString() : new Date(email.createdAt).toLocaleString()}</strong></span>
                            </div>
                          </div>

                          <button
                            onClick={() => setViewingEmail(email)}
                            className="px-5 py-3 text-white bg-zinc-900 border border-zinc-800 dark:bg-zinc-900 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2 italic self-stretch md:self-auto text-center justify-center shrink-0"
                          >
                            <ExternalLink className="h-3.5 w-3.5" /> View Letter Layout
                          </button>
                        </div>
                    ))}

                    {emails.filter(e => e.type?.startsWith('supplier') || e.recipient?.includes('supplier') || e.subject?.toUpperCase().includes('RESTOCK') || e.subject?.toUpperCase().includes('DEMAND') || e.subject?.toUpperCase().includes('CARGO')).length === 0 && (
                      <div className="py-24 text-center text-zinc-500 italic opacity-40 uppercase font-black">
                        No transactional transmissions logged yet for suppliers
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
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

      {/* Supplier Profile Editor Modal Overlay */}
      <AnimatePresence>
        {isEditingSupplier && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
            id="supplier-edit-modal"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-zinc-950 border border-zinc-805 w-full max-w-lg rounded-[40px] p-6 md:p-8 shadow-2xl relative text-white"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-black uppercase italic tracking-tight text-white">
                    {isEditingSupplier.id ? "Edit Vendor Profile" : "Register New Kigali Supplier"}
                  </h3>
                  <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wide">Enter official business registries and SLA points</p>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsEditingSupplier(null)}
                  className="p-3 bg-zinc-900 border border-zinc-800 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all scale-90"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveSupplier} className="space-y-5">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">Supplier Name / Enterprise</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Inyange Industries Rwanda"
                    value={isEditingSupplier.name || ''}
                    onChange={e => setIsEditingSupplier({ ...isEditingSupplier, name: e.target.value })}
                    className="w-full bg-black/40 border border-[#2d2d2d] rounded-2xl px-5 py-3.5 text-sm text-white focus:outline-none focus:border-brand-primary font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">Key Logistics Contact Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Jean Pierre Nsabimana"
                    value={isEditingSupplier.contactName || ''}
                    onChange={e => setIsEditingSupplier({ ...isEditingSupplier, contactName: e.target.value })}
                    className="w-full bg-black/40 border border-[#2d2d2d] rounded-2xl px-5 py-3.5 text-sm text-white focus:outline-none focus:border-brand-primary font-bold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">SMTP Contact Email</label>
                    <input 
                      type="email" 
                      required
                      placeholder="e.g. logistics@inyange.rw"
                      value={isEditingSupplier.email || ''}
                      onChange={e => setIsEditingSupplier({ ...isEditingSupplier, email: e.target.value })}
                      className="w-full bg-black/40 border border-[#2d2d2d] rounded-2xl px-5 py-3.5 text-sm text-white focus:outline-none focus:border-brand-primary font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">Corporate Phone</label>
                    <input 
                      type="text" 
                      placeholder="e.g. +250 788 340 000"
                      value={isEditingSupplier.phone || ''}
                      onChange={e => setIsEditingSupplier({ ...isEditingSupplier, phone: e.target.value })}
                      className="w-full bg-black/40 border border-[#2d2d2d] rounded-2xl px-5 py-3.5 text-sm text-white focus:outline-none focus:border-brand-primary font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">Merchandise Category</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Dairy & Beverages"
                    value={isEditingSupplier.category || ''}
                    onChange={e => setIsEditingSupplier({ ...isEditingSupplier, category: e.target.value })}
                    className="w-full bg-black/40 border border-[#2d2d2d] rounded-2xl px-5 py-3.5 text-sm text-white focus:outline-none focus:border-brand-primary font-bold"
                  />
                </div>

                <div className="flex items-center gap-3 bg-black/35 border border-[#2d2d2d] p-4 rounded-2xl">
                  <input 
                    type="checkbox"
                    id="supplier-active-chk"
                    checked={isEditingSupplier.active !== false}
                    onChange={e => setIsEditingSupplier({ ...isEditingSupplier, active: e.target.checked })}
                    className="w-5 h-5 accent-brand-primary rounded"
                  />
                  <label htmlFor="supplier-active-chk" className="text-xs font-black uppercase text-white cursor-pointer select-none">
                    Supplier Partnership is Active & Eligible for PO demands
                  </label>
                </div>

                <div className="flex gap-4 pt-2">
                  <button 
                    type="button"
                    onClick={() => setIsEditingSupplier(null)}
                    className="flex-1 py-4 bg-[#232323] text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-[#323232] transition-colors italic"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 py-4 bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-orange-600 transition-colors disabled:opacity-40 italic shadow-lg shadow-brand-primary/20"
                  >
                    {isSaving ? "Saving..." : "Save Supplier"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Staff Profile Editor Modal Overlay */}
      <AnimatePresence>
        {isEditingStaff && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
            id="staff-edit-modal"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-zinc-950 border border-zinc-805 w-full max-w-lg rounded-[40px] p-6 md:p-8 shadow-2xl relative text-white"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-black uppercase italic tracking-tight text-white">
                    {isEditingStaff.id ? "Edit Staff Account" : "Register Team Associate"}
                  </h3>
                  <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wide">Enter duty configurations and shift wage scales</p>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsEditingStaff(null)}
                  className="p-3 bg-zinc-900 border border-zinc-800 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all scale-90"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveStaff} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-440 block">Full Legal Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Keza Gisele"
                    value={isEditingStaff.name || ''}
                    onChange={e => setIsEditingStaff({ ...isEditingStaff, name: e.target.value })}
                    className="w-full bg-black/40 border border-[#2d2d2d] rounded-2xl px-5 py-3.5 text-sm text-white focus:outline-none focus:border-brand-primary font-bold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-440 block">Allocated Job Role</label>
                    <select
                      value={isEditingStaff.role || 'Cashier'}
                      onChange={e => setIsEditingStaff({ ...isEditingStaff, role: e.target.value as any })}
                      className="w-full bg-black/40 border border-[#2d2d2d] rounded-2xl px-5 py-3.5 text-sm text-white focus:outline-none focus:border-brand-primary font-bold"
                    >
                      <option value="Manager">Manager</option>
                      <option value="Cashier">Cashier</option>
                      <option value="Stockist">Stockist</option>
                      <option value="Courier">Courier</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-440 block">Designated Mobile No.</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. +250 788 123 456"
                      value={isEditingStaff.phone || ''}
                      onChange={e => setIsEditingStaff({ ...isEditingStaff, phone: e.target.value })}
                      className="w-full bg-black/40 border border-[#2d2d2d] rounded-2xl px-5 py-3.5 text-sm text-white focus:outline-none focus:border-brand-primary font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-440 block">Salary Scale (RWF)</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 450000"
                      value={isEditingStaff.salary || ''}
                      onChange={e => setIsEditingStaff({ ...isEditingStaff, salary: Number(e.target.value) })}
                      className="w-full bg-black/40 border border-[#2d2d2d] rounded-2xl px-5 py-3.5 text-sm text-white focus:outline-none focus:border-brand-primary font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-440 block">Tasks Done</label>
                    <input 
                      type="number" 
                      value={isEditingStaff.tasksCompleted || 0}
                      onChange={e => setIsEditingStaff({ ...isEditingStaff, tasksCompleted: Number(e.target.value) })}
                      className="w-full bg-black/40 border border-[#2d2d2d] rounded-2xl px-5 py-3.5 text-sm text-white focus:outline-none focus:border-brand-primary font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-440 block">Rating (0-5)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      min="0"
                      max="5"
                      value={isEditingStaff.rating || 5.0}
                      onChange={e => setIsEditingStaff({ ...isEditingStaff, rating: Number(e.target.value) })}
                      className="w-full bg-black/40 border border-[#2d2d2d] rounded-2xl px-5 py-3.5 text-sm text-white focus:outline-none focus:border-brand-primary font-bold"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-black/35 border border-[#2d2d2d] p-4 rounded-2xl">
                  <input 
                    type="checkbox"
                    id="staff-active-chk"
                    checked={isEditingStaff.active !== false}
                    onChange={e => setIsEditingStaff({ ...isEditingStaff, active: e.target.checked })}
                    className="w-5 h-5 accent-brand-primary rounded"
                  />
                  <label htmlFor="staff-active-chk" className="text-xs font-black uppercase text-white cursor-pointer select-none">
                    Roster Active (Available on shift scheduler lists)
                  </label>
                </div>

                <div className="flex gap-4 pt-2">
                  <button 
                    type="button"
                    onClick={() => setIsEditingStaff(null)}
                    className="flex-1 py-4 bg-[#232323] text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-[#323232] transition-colors italic"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 py-4 bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-orange-600 transition-colors disabled:opacity-40 italic shadow-lg shadow-brand-primary/20"
                  >
                    {isSaving ? "Saving..." : "Save Member"}
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
                    <div key={`customer-recip-${user.id || idx}-${idx}`} className="bg-[#1f1f1f] border border-[#2d2d2d] px-3 py-1.5 rounded-md text-[9px] font-mono text-zinc-300 shrink-0 select-text max-w-[170px] truncate">
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

      {/* Email Log Visualizer Modal */}
      <AnimatePresence>
        {viewingEmail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
            id="email-preview-modal"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-neutral-900 border border-[#27272a] w-full max-w-3xl rounded-[40px] p-6 shadow-2xl relative text-white"
            >
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-xl font-black uppercase italic tracking-tighter">Simba Mail Log Visualizer</h3>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase">Interactive SMTP HTML Sandbox</p>
                </div>
                <button
                  onClick={() => setViewingEmail(null)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-full text-[10px] font-bold uppercase tracking-wider"
                >
                  Close
                </button>
              </div>

              <div className="bg-[#141414] border border-[#27272a] rounded-2xl overflow-hidden p-4 mb-4 font-mono text-zinc-400 text-xs">
                <p className="mb-1"><strong>To:</strong> {viewingEmail.to}</p>
                <p className="mb-1"><strong>Subject:</strong> {viewingEmail.subject}</p>
                <p><strong>Type:</strong> <span className="text-brand-primary font-bold uppercase">{viewingEmail.type}</span></p>
              </div>

              {/* Structured HTML iframe sandboxing to display perfect design! */}
              <div className="w-full bg-white rounded-2xl overflow-hidden shadow-inner border border-zinc-800" style={{ height: "450px" }}>
                <iframe
                  srcDoc={viewingEmail.body}
                  title="Rendered Email Preview"
                  className="w-full h-full border-none"
                  sandbox="allow-popups"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Purchase Order Modal */}
      <AnimatePresence>
        {isCreatingPO && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
            id="create-po-modal"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-neutral-900 border border-brand-primary/20 w-full max-w-2xl rounded-[40px] p-6 md:p-8 shadow-2xl relative text-white"
            >
              <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
                <div>
                  <h3 className="text-xl font-black uppercase italic tracking-tighter">Draft restock purchase order</h3>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase">Construct bulk replenishment demand slips</p>
                </div>
                <button
                  onClick={() => setIsCreatingPO(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-full text-[10px] font-bold uppercase"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleCreatePurchaseOrder} className="space-y-6">
                {/* Supplier Selector */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#9a9a9a] block mb-2">Select Restock Supplier Partner</label>
                  <select
                    value={selectedPOSupplierId}
                    onChange={(e) => {
                      setSelectedPOSupplierId(e.target.value);
                      const chosenCategory = suppliers.find(s => s.id === e.target.value)?.category;
                      const matchingProds = products.filter(p => !chosenCategory || p.category.toLowerCase() === chosenCategory.toLowerCase());
                      const defaultProdId = matchingProds[0]?.id || products[0]?.id || '';
                      setPoLineItems([{ productId: defaultProdId, quantity: '', wholesaleCost: '' }]);
                    }}
                    required
                    className="w-full px-5 py-3.5 bg-black/40 border border-[#2d2d2d] rounded-2xl text-xs font-bold text-white uppercase"
                  >
                    <option value="" className="text-zinc-500">-- SELECT SUPPLIER --</option>
                    {suppliers.filter(s => s.active).map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                    ))}
                  </select>
                </div>

                {/* Expected delivery Target */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#9a9a9a] block mb-2">Expected Logistics SLA Delivery Date</label>
                  <input
                    type="date"
                    value={poExpectedDelivery}
                    onChange={(e) => setPoExpectedDelivery(e.target.value)}
                    required
                    className="w-full px-5 py-3.5 bg-black/40 border border-[#2d2d2d] rounded-2xl text-xs font-bold text-white uppercase"
                  />
                </div>

                {/* Dynamic List Items */}
                {selectedPOSupplierId && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#9a9a9a] block text-left">Quantity & Wholesale cost Line Details</label>
                      <button
                        type="button"
                        onClick={() => {
                          setPoLineItems([...poLineItems, { productId: products[0]?.id || '', quantity: '', wholesaleCost: '' }]);
                        }}
                        className="text-[9px] font-black uppercase tracking-wider text-brand-primary h-8 px-3 border border-brand-primary/20 rounded-lg hover:bg-brand-primary/5 transition-all text-center"
                      >
                        + Add items line
                      </button>
                    </div>

                    {poLineItems.map((item, idx) => (
                      <div key={idx} className="flex gap-2 items-center flex-wrap md:flex-nowrap">
                        {/* Product spec */}
                        <select
                          value={item.productId}
                          onChange={(e) => {
                            const newItems = [...poLineItems];
                            newItems[idx].productId = e.target.value;
                            setPoLineItems(newItems);
                          }}
                          className="bg-black/40 border border-[#2d2d2d] px-3 py-2.5 rounded-xl text-xs text-white max-w-full md:flex-1"
                        >
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({formatCurrency(p.price)})</option>
                          ))}
                        </select>

                        {/* Qty count */}
                        <div className="w-24">
                          <input
                            type="text"
                            value={item.quantity === 0 ? '' : item.quantity}
                            placeholder="Qty"
                            onChange={(e) => {
                              const newItems = [...poLineItems];
                              const val = e.target.value;
                              newItems[idx].quantity = val === '' ? '' : (isNaN(Number(val)) ? '' : Number(val));
                              setPoLineItems(newItems);
                            }}
                            required
                            className="w-full bg-black/40 border border-[#2d2d2d] px-3 py-2.5 rounded-xl text-xs text-white uppercase"
                          />
                        </div>

                        {/* Wholesale spec */}
                        <div className="w-32">
                          <input
                            type="text"
                            value={item.wholesaleCost === 0 ? '' : item.wholesaleCost}
                            placeholder="Cost (RWF)"
                            onChange={(e) => {
                              const newItems = [...poLineItems];
                              const val = e.target.value;
                              newItems[idx].wholesaleCost = val === '' ? '' : (isNaN(Number(val)) ? '' : Number(val));
                              setPoLineItems(newItems);
                            }}
                            required
                            className="w-full bg-black/40 border border-[#2d2d2d] px-3 py-2.5 rounded-xl text-xs text-white uppercase"
                          />
                        </div>

                        {/* Remove button */}
                        <button
                          type="button"
                          onClick={() => {
                            const newItems = poLineItems.filter((_, i) => i !== idx);
                            setPoLineItems(newItems);
                          }}
                          className="p-2 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl transition-all h-10 w-10 flex items-center justify-center shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quote Total Summary section */}
                {selectedPOSupplierId && poLineItems.length > 0 && (
                  <div className="bg-[#17181c] p-4 rounded-2xl border border-zinc-800 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-[#9a9a9a] uppercase">Calculated wholesale Quote Total</span>
                    <span className="text-base font-black italic text-brand-primary font-mono">
                      {formatCurrency(poLineItems.reduce((acc, current) => acc + (current.wholesaleCost * current.quantity), 0))}
                    </span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!selectedPOSupplierId || poLineItems.length === 0}
                  className="w-full py-4 bg-brand-primary hover:bg-orange-600 disabled:opacity-40 text-white text-[10px] font-black uppercase tracking-widest italic tracking-wider transition-colors"
                >
                  Submit Slips & Broadcast Restock Demands via SMTP
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Assign & Edit Shift Modal */}
      <AnimatePresence>
        {(isCreatingShift || editingShift) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
            id="assign-shift-modal"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-neutral-900 border border-brand-primary/20 w-full max-w-md rounded-[40px] p-6 md:p-8 shadow-2xl relative text-white"
            >
              <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
                <div>
                  <h3 className="text-xl font-black uppercase italic tracking-tighter">
                    {editingShift ? "Edit Staff Shift" : "Schedule Staff Shift"}
                  </h3>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase">
                    {editingShift ? "Modify timeslot and status parameters" : "Assign a new calendar block to staff"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingShift(false);
                    setEditingShift(null);
                  }}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-full text-[10px] font-bold uppercase cursor-pointer"
                >
                  Close
                </button>
              </div>

              <form onSubmit={handleSaveShiftSchedule} className="space-y-6">
                {/* Staff Member Selector */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#9a9a9a] block mb-2">
                    Staff Member
                  </label>
                  <select
                    value={shiftStaffId}
                    onChange={(e) => setShiftStaffId(e.target.value)}
                    required
                    disabled={!!editingShift}
                    className="w-full px-5 py-3.5 bg-black/40 border border-[#2d2d2d] rounded-2xl text-xs font-bold text-white uppercase"
                  >
                    <option value="">Select Staff Member</option>
                    {staff.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                    ))}
                  </select>
                </div>

                {/* Day of Duty */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#9a9a9a] block mb-2">
                    Day of Duty
                  </label>
                  <input
                    type="date"
                    value={shiftDate}
                    onChange={(e) => setShiftDate(e.target.value)}
                    required
                    className="w-full px-5 py-3.5 bg-black/40 border border-[#2d2d2d] rounded-2xl text-xs font-bold text-white uppercase font-mono"
                  />
                </div>

                {/* Daily Shift timeslot */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#9a9a9a] block mb-2">
                    Daily Shift timeslot
                  </label>
                  <select
                    value={shiftTimeSlot}
                    onChange={(e) => setShiftTimeSlot(e.target.value as any)}
                    required
                    className="w-full px-5 py-3.5 bg-black/40 border border-[#2d2d2d] rounded-2xl text-xs font-bold text-white uppercase"
                  >
                    <option value="morning">Morning Shift (06:00 - 14:00)</option>
                    <option value="afternoon">Afternoon Shift (14:00 - 22:00)</option>
                    <option value="night">Night Shift (22:00 - 06:00)</option>
                  </select>
                </div>

                {/* Status selector - only visible when editing */}
                {editingShift && (
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#9a9a9a] block mb-2">
                      Roster shift status
                    </label>
                    <select
                      value={formShiftStatus}
                      onChange={(e) => setFormShiftStatus(e.target.value as any)}
                      required
                      className="w-full px-5 py-3.5 bg-black/40 border border-[#2d2d2d] rounded-2xl text-xs font-bold text-white uppercase"
                    >
                      <option value="scheduled">Scheduled (Awaiting Check-in)</option>
                      <option value="active">Active (Currently on Duty)</option>
                      <option value="absent">Absent (Skipped / Sick Leave)</option>
                      <option value="completed">Completed (Successfully Signed-off)</option>
                    </select>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-4 bg-brand-primary hover:bg-orange-600 text-white text-[10px] font-black uppercase tracking-widest italic tracking-wide transition-colors rounded-2xl cursor-pointer"
                >
                  {editingShift ? "Save Shift Overrides" : "Authorize & Lock Shift Schedule"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </div>
  );
}
