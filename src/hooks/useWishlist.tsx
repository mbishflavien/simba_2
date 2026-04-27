import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db, handleFirestoreError } from '../lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  serverTimestamp 
} from 'firebase/firestore';
import { useAuth } from '../components/AuthProvider';
import { Product } from '../types';

interface WishlistContextType {
  wishlistIds: string[];
  toggleWishlist: (product: Product) => Promise<void>;
  isInWishlist: (productId: number) => boolean;
  loading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user, initialized } = useAuth();
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!initialized) return;
    
    if (!user) {
      setWishlistIds([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const wishlistRef = collection(db, 'users', user.uid, 'wishlist');
    const q = query(wishlistRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ids = snapshot.docs.map(doc => doc.id);
      setWishlistIds(ids);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, 'list', `users/${user.uid}/wishlist`);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, initialized]);

  const toggleWishlist = useCallback(async (product: Product) => {
    if (!user) return;

    const productId = product.id.toString();
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
      handleFirestoreError(error, wishlistIds.includes(productId) ? 'delete' : 'create', `users/${user.uid}/wishlist/${productId}`);
    }
  }, [user, wishlistIds]);

  const isInWishlist = useCallback((productId: number) => {
    return wishlistIds.includes(productId.toString());
  }, [wishlistIds]);

  return (
    <WishlistContext.Provider value={{ wishlistIds, toggleWishlist, isInWishlist, loading }}>
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
