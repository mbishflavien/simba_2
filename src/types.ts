/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  id: string | number;
  name: string;
  price: number;
  costPrice?: number;
  category: string;
  subcategoryId?: number;
  inStock: boolean;
  stockCount: number;
  warehouseStockCount?: number;
  lowStockThreshold?: number;
  barcode?: string;
  expiryDate?: string | any;
  supplierId?: string;
  image: string;
  unit: string;
  rating?: number;
  reviewCount?: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface Supplier {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  category: string;
  active: boolean;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  items: { productId: string; quantity: number; cost: number }[];
  totalCost: number;
  status: 'draft' | 'ordered' | 'received' | 'cancelled';
  expectedDelivery?: string;
  createdAt: any;
}

export interface Promotion {
  id: string;
  name: string;
  type: 'percentage' | 'fixed' | 'buy1get1';
  value: number;
  startDate: any;
  endDate: any;
  isActive: boolean;
}

export interface StaffMember {
  id: string;
  name: string;
  role: 'manager' | 'cashier' | 'inventory' | 'cleaner';
  phone: string;
  shiftStatus: 'on_duty' | 'off_duty' | 'break';
  lastClockIn?: any;
  performanceScore?: number;
}

export interface InventoryAlert {
  id: string;
  type: 'low_stock' | 'near_expiry' | 'anomaly';
  productId: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  isRead: boolean;
  createdAt: any;
}

export interface StoreInfo {
  name: string;
  tagline: string;
  location: string;
  currency: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface UserProfile {
  userId: string;
  displayName: string | null;
  email: string;
  phoneNumber: string | null;
  address: string | null;
  isAdmin?: boolean;
  preferredBranch?: string;
  createdAt: any; // Timestamp
  updatedAt: any; // Timestamp
}

export interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Order {
  orderId: string;
  userId: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: 'momo' | 'card' | 'cash';
  address: string;
  pickupBranch?: string;
  createdAt: any; // Timestamp
}
