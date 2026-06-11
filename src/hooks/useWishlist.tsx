import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where,
  serverTimestamp 
} from 'firebase/firestore';
import { useAuth } from '../components/AuthProvider';
import { Product } from '../types';

interface WishlistContextType {
  wishlistIds: string[];
  wishlistProducts: Product[];
  toggleWishlist: (product: Product) => Promise<void>;
  isInWishlist: (productId: number) => boolean;
  loading: boolean;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user, initialized } = useAuth();
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  // Load wishlist when user changes or key changes, merging guest wishlist if transitioning to authenticated user
  useEffect(() => {
    if (!initialized) return;
    
    if (!user) {
      // Load guest wishlist
      const savedGuest = localStorage.getItem('simba-wishlist-guest');
      if (savedGuest) {
        try {
          setWishlistIds(JSON.parse(savedGuest));
        } catch (e) {
          console.error("Failed to parse guest wishlist", e);
          setWishlistIds([]);
        }
      } else {
        setWishlistIds([]);
      }
      setLoading(false);
      return;
    }

    setLoading(true);

    // Check for guest wishlist items to merge
    const savedGuest = localStorage.getItem('simba-wishlist-guest');
    let guestIds: string[] = [];
    if (savedGuest) {
      try {
        guestIds = JSON.parse(savedGuest);
      } catch (e) {
        console.error("Failed to parse guest wishlist", e);
      }
    }

    if (guestIds.length > 0) {
      // Merge guest items into Firestore
      const mergePromises = guestIds.map(id => {
        const docRef = doc(db, 'users', user.uid, 'wishlist', id);
        return setDoc(docRef, {
          productId: id,
          userId: user.uid,
          addedAt: serverTimestamp()
        });
      });

      Promise.all(mergePromises)
        .then(() => {
          localStorage.removeItem('simba-wishlist-guest');
        })
        .catch(err => {
          console.error("Error merging guest wishlist", err);
        });
    }

    const wishlistRef = collection(db, 'users', user.uid, 'wishlist');
    const q = query(wishlistRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ids = snapshot.docs.map(doc => doc.id);
      setWishlistIds(ids);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/wishlist`);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, initialized]);

  // Sync wishlist products from products collection based on wishlistIds
  useEffect(() => {
    if (wishlistIds.length === 0) {
      setWishlistProducts([]);
      return;
    }

    const productIds = wishlistIds.map(id => Number(id));
    // Firestore 'in' query has a limit of 30 items
    const q = query(
      collection(db, 'products'),
      where('id', 'in', productIds.slice(0, 30))
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setWishlistProducts(prods);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products_wishlist_sync');
    });

    return () => unsubscribe();
  }, [wishlistIds]);

  const toggleWishlist = useCallback(async (product: Product) => {
    const productId = product.id.toString();

    if (!user) {
      // Guest logic
      setWishlistIds(prev => {
        const isAlreadyIn = prev.includes(productId);
        const next = isAlreadyIn ? prev.filter(id => id !== productId) : [...prev, productId];
        localStorage.setItem('simba-wishlist-guest', JSON.stringify(next));
        return next;
      });
      return;
    }

    const docRef = doc(db, 'users', user.uid, 'wishlist', productId);

    try {
      if (wishlistIds.includes(productId)) {
        await deleteDoc(docRef);
      } else {
        await setDoc(docRef, {
          productId,
          userId: user.uid,
          addedAt: serverTimestamp()
        });
      }
    } catch (error) {
      const type = wishlistIds.includes(productId) ? OperationType.DELETE : OperationType.CREATE;
      handleFirestoreError(error, type, `users/${user.uid}/wishlist/${productId}`);
    }
  }, [user, wishlistIds]);

  const isInWishlist = useCallback((productId: number) => {
    return wishlistIds.includes(productId.toString());
  }, [wishlistIds]);

  return (
    <WishlistContext.Provider value={{ 
      wishlistIds, 
      wishlistProducts, 
      toggleWishlist, 
      isInWishlist, 
      loading, 
      isOpen, 
      setIsOpen 
    }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
