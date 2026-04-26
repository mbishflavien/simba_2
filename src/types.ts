/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  subcategoryId: number;
  inStock: boolean;
  image: string;
  unit: string;
  rating?: number;
  reviewCount?: number;
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
