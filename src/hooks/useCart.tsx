import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { CartItem, Product } from '../types';
import { useAuth } from '../components/AuthProvider';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, initialized } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);

  // Construct a user-specific storage key
  const cartKey = useMemo(() => {
    return user ? `simba-cart-${user.uid}` : 'simba-cart-guest';
  }, [user]);

  // Load cart when user changes or key changes, merging guest cart if transitioning to authenticated user
  useEffect(() => {
    if (!initialized) return;
    
    const savedGuestCart = localStorage.getItem('simba-cart-guest');
    let guestItems: CartItem[] = [];
    if (savedGuestCart) {
      try {
        guestItems = JSON.parse(savedGuestCart);
      } catch (e) {
        console.error("Failed to parse guest cart", e);
      }
    }

    const savedCart = localStorage.getItem(cartKey);
    let loadedCart: CartItem[] = [];
    if (savedCart) {
      try {
        loadedCart = JSON.parse(savedCart);
      } catch (e) {
        console.error("Failed to parse cart", e);
      }
    }

    if (user && guestItems.length > 0) {
      // Merge guest items into loaded user cart
      const mergedCart = [...loadedCart];
      guestItems.forEach(guestItem => {
        const existingIdx = mergedCart.findIndex(item => item.id === guestItem.id);
        if (existingIdx > -1) {
          mergedCart[existingIdx].quantity += guestItem.quantity;
        } else {
          mergedCart.push(guestItem);
        }
      });
      
      setCart(mergedCart);
      localStorage.setItem(cartKey, JSON.stringify(mergedCart));
      localStorage.removeItem('simba-cart-guest');
    } else {
      setCart(loadedCart);
    }
  }, [cartKey, initialized, user]);

  // Save cart whenever it changes
  useEffect(() => {
    if (!initialized) return;
    // Don't save empty cart during transient states if there are saved contents
    localStorage.setItem(cartKey, JSON.stringify(cart));
  }, [cart, cartKey, initialized]);

  const addToCart = useCallback((product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((productId: number) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(item => item.id !== productId));
      return;
    }
    setCart(prev =>
      prev.map(item => (item.id === productId ? { ...item, quantity } : item))
    );
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const totalItems = useMemo(() => 
    cart.reduce((sum, item) => sum + item.quantity, 0)
  , [cart]);

  const totalPrice = useMemo(() => 
    cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  , [cart]);

  const contextValue = useMemo(() => ({
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice
  }), [cart, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice]);

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
