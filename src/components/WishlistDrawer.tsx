import React, { useRef, useEffect } from 'react';
import { useWishlist } from '../hooks/useWishlist';
import { useCart } from '../hooks/useCart';
import { X, Heart, ShoppingCart, Trash2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency } from '../lib/utils';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export default function WishlistDrawer() {
  const { isOpen, setIsOpen, wishlistProducts, toggleWishlist } = useWishlist();
  const { addToCart, cart } = useCart();
  const { t, i18n } = useTranslation();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape-key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, setIsOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black z-[100] backdrop-blur-[2px]"
          />

          {/* Sliding Drawer Container */}
          <motion.div
            ref={drawerRef}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed top-0 right-0 h-full w-full sm:max-w-md bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl z-[101] flex flex-col overflow-hidden"
            id="wishlist-drawer"
          >
            {/* Header */}
            <div className="py-5 px-6 flex justify-between items-center border-b border-zinc-100 dark:border-zinc-900 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-black">
                  <Heart className="h-5 w-5 fill-rose-500 text-rose-500" />
                </div>
                <div>
                  <h2 className="font-display font-black text-lg sm:text-xl uppercase tracking-tight text-zinc-900 dark:text-white leading-none mb-1">
                    {t('my_wishlist', 'Wishlist')}
                  </h2>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 italic">
                    {wishlistProducts.length} {wishlistProducts.length === 1 ? t('item', 'item') : t('items', 'items')}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="p-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-805 rounded-full transition-all hover:scale-105 active:scale-95 flex items-center justify-center"
                aria-label="Close"
              >
                <X className="h-4 w-4 text-zinc-500" />
              </button>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto drawer-scrollbar p-6 space-y-6 relative">
              <AnimatePresence initial={false}>
                {wishlistProducts.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="h-full flex flex-col items-center justify-center text-center px-4 self-center space-y-6 my-auto"
                  >
                    <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mx-auto">
                      <Heart className="h-8 w-8 text-rose-500" />
                    </div>
                    <div>
                      <h3 className="font-display font-black text-base uppercase tracking-tight text-zinc-800 dark:text-zinc-150 mb-2">
                        {t('wishlist_empty', 'Wishlist is Empty')}
                      </h3>
                      <p className="text-xs text-zinc-400 max-w-xs font-semibold leading-relaxed">
                        {t('wishlist_empty_desc', 'Explore our products and tap the heart icon to save your favorite items here!')}
                      </p>
                    </div>
                    <button 
                      onClick={() => setIsOpen(false)}
                      className="px-6 py-3 bg-brand-primary text-white rounded-full font-black text-xs uppercase tracking-widest hover:bg-orange-600 transition-all shadow-md italic"
                    >
                      {t('continue_shopping', 'Explore Store')}
                    </button>
                  </motion.div>
                ) : (
                  <div className="space-y-4">
                    {wishlistProducts.map((product) => {
                      const isInCart = cart.some(item => item.id === product.id);

                      return (
                        <motion.div 
                          key={product.id}
                          layout
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="flex items-center gap-4 p-3 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/60 rounded-2xl group relative overflow-hidden"
                        >
                          {/* Image */}
                          <div className="w-16 h-16 shrink-0 bg-white dark:bg-zinc-900 rounded-xl p-2 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center">
                            <img 
                              src={product.image} 
                              alt={product.name} 
                              className="w-full h-full object-contain"
                              referrerPolicy="no-referrer"
                            />
                          </div>

                          {/* Info */}
                          <div className="flex-grow min-w-0">
                            <h4 className="font-display font-black text-xs sm:text-sm uppercase tracking-tight text-zinc-800 dark:text-white truncate">
                              {product.name}
                            </h4>
                            <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider mb-1.5">
                              {product.category && typeof product.category === 'string' ? t(`cat_${product.category.toLowerCase().replace(/ & /g, '_').replace(/ /g, '_')}`) : t('cat_other')}
                            </p>
                            <p className="font-bold text-xs text-zinc-950 dark:text-white">
                              {formatCurrency(product.price)}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col gap-2 shrink-0">
                            {/* Add to Cart button */}
                            {product.inStock ? (
                              <button
                                onClick={() => addToCart(product)}
                                className={`p-2 rounded-full transition-all flex items-center justify-center ${
                                  isInCart 
                                    ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                                    : 'bg-brand-primary text-white hover:bg-orange-600 shadow-md'
                                }`}
                                title={t('add_to_cart', 'Add to Cart')}
                              >
                                <ShoppingCart className="h-4 w-4" />
                              </button>
                            ) : (
                              <span className="text-[8px] font-black uppercase text-red-500 bg-red-500/10 px-2 py-1 rounded-md">
                                {t('sold_out', 'Sold Out')}
                              </span>
                            )}

                            {/* Remove from Wishlist */}
                            <button
                              onClick={() => toggleWishlist(product)}
                              className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-full border border-zinc-200 dark:border-zinc-700/60 transition-all flex items-center justify-center"
                              title={t('remove', 'Remove')}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom Actions */}
            {wishlistProducts.length > 0 && (
              <div className="p-6 border-t border-zinc-150 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950/50 shrink-0 space-y-3">
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full bg-brand-primary hover:bg-orange-600 text-white font-black py-4 px-6 rounded-2xl text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-brand-primary/10 hover:shadow-brand-primary/20 transition-all italic duration-300"
                >
                  <span>{t('continue_shopping', 'Back to Store')}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
