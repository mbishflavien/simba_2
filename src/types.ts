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
