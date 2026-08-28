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
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-md"
          />

          {/* Sliding Drawer Container */}
          <motion.div
            ref={drawerRef}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed top-0 right-0 h-full w-full sm:max-w-md bg-white/85 dark:bg-zinc-950/85 backdrop-blur-3xl border-l border-white/20 dark:border-white/10 shadow-2xl z-[101] flex flex-col overflow-hidden"
            id="wishlist-drawer"
          >
            {/* Header */}
            <div className="py-5 px-6 flex justify-between items-center border-b border-black/5 dark:border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-500 flex items-center justify-center font-black backdrop-blur-md border border-rose-500/20">
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
                className="p-3 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 border border-black/5 dark:border-white/10 rounded-full transition-all hover:scale-105 active:scale-95 flex items-center justify-center backdrop-blur-md"
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
                    <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mx-auto backdrop-blur-md border border-rose-500/20">
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
                      className="px-6 py-3 bg-brand-primary text-white rounded-full font-black text-xs uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg shadow-brand-primary/25 italic"
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
                          className="flex items-center gap-4 p-3.5 bg-white/60 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl group relative overflow-hidden backdrop-blur-xl shadow-sm"
                        >
                          {/* Image */}
                          <div className="w-16 h-16 shrink-0 bg-white/80 dark:bg-black/60 rounded-xl p-2 border border-black/5 dark:border-white/10 flex items-center justify-center backdrop-blur-md">
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
                            <p className="font-bold text-xs text-brand-primary">
                              {formatCurrency(product.price)}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col gap-2 shrink-0">
                            {/* Add to Cart button */}
                            {product.inStock ? (
                              <button
                                onClick={() => addToCart(product)}
                                className={`p-2 rounded-full transition-all flex items-center justify-center backdrop-blur-md ${
                                  isInCart 
                                    ? 'bg-green-500/15 text-green-500 border border-green-500/30' 
                                    : 'bg-brand-primary text-white hover:bg-orange-600 shadow-md shadow-brand-primary/20'
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
                              className="p-2 bg-black/5 dark:bg-white/5 text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-full border border-black/5 dark:border-white/10 transition-all flex items-center justify-center backdrop-blur-md"
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
              <div className="p-6 border-t border-black/5 dark:border-white/10 bg-white/40 dark:bg-zinc-950/40 backdrop-blur-xl shrink-0 space-y-3">
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full bg-brand-primary hover:bg-orange-600 text-white font-black py-4 px-6 rounded-2xl text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-brand-primary/25 transition-all italic duration-300"
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
