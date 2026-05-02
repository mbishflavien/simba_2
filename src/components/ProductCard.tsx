import React, { useMemo, useCallback } from 'react';
import { Product } from '../types';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';
import { useAuth } from '../components/AuthProvider';
import { formatCurrency, cn } from '../lib/utils';
import { ShoppingCart, Plus, Minus, Info, Check, Star, Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';

export interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = React.memo(({ product }) => {
  const { addToCart, cart, updateQuantity } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [isAdded, setIsAdded] = React.useState(false);

  const cartItem = useMemo(() => 
    cart.find(item => item.id === product.id)
  , [cart, product.id]);

  const handleAddToCart = useCallback(() => {
    addToCart(product);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  }, [addToCart, product]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-gradient p-5 flex flex-col group"
    >
      <Link to={`/product/${product.id}`} className="flex-1 bg-white dark:bg-zinc-950 rounded-[32px] mb-6 flex items-center justify-center relative overflow-hidden group shadow-[0_12px_40px_rgba(0,0,0,0.1)] dark:shadow-none border border-zinc-200 dark:border-white/10">
        <motion.img
          whileHover={{ scale: 1.12 }}
          src={product.image}
          alt={product.name}
          className="w-full h-full object-contain p-4 transition-transform duration-700"
          referrerPolicy="no-referrer"
        />
        {!product.inStock && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="micro-label text-white !opacity-100">
              {t('out_of_stock')}
            </span>
          </div>
        )}
        {user && (
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleWishlist(product);
            }}
            className={cn(
              "absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all backdrop-blur-md border border-white/20 group/heart hover:scale-110 active:scale-95 z-20",
              isInWishlist(product.id) 
                ? "bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/30" 
                : "bg-black/20 text-white/60 hover:text-white"
            )}
            aria-label={isInWishlist(product.id) ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart className={cn("h-5 w-5 transition-transform", isInWishlist(product.id) ? "fill-white" : "fill-none scale-90 group-hover/heart:scale-100")} />
          </button>
        )}
      </Link>

      <div className="flex flex-col gap-1 px-1">
        <div className="flex justify-between items-start mb-0.5">
          <div className="flex items-center gap-2">
            <span className="micro-label">
              {product.category ? t(`cat_${product.category.toLowerCase().replace(/ & /g, '_').replace(/ /g, '_')}`) : t('cat_other')}
            </span>
            {product.price > 100000 && (
              <span className="text-[8px] font-black bg-brand-accent/20 text-brand-accent px-2 py-0.5 rounded-md uppercase tracking-widest italic animate-pulse">
                {t('premium_quality')}
              </span>
            )}
            {product.category?.toLowerCase().includes('food') && (
              <span className="text-[8px] font-black bg-green-500/20 text-green-500 px-2 py-0.5 rounded-md uppercase tracking-widest italic">
                {t('freshness_guaranteed')}
              </span>
            )}
          </div>
          {product.rating && (
            <div className="flex items-center gap-1" aria-label={`Rating: ${product.rating} stars, ${product.reviewCount} reviews`}>
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="text-[10px] font-black italic text-[var(--brand-text)] opacity-80">{product.rating}</span>
            </div>
          )}
        </div>
        <Link to={`/product/${product.id}`} className="block mb-4">
          <h3 className="text-xl font-display font-black tracking-tight group-hover:text-brand-primary transition-colors line-clamp-2 uppercase italic text-[var(--brand-text)] leading-[1.05]">
            {product.name}
          </h3>
        </Link>

        <div className="flex justify-between items-center mt-auto pt-6 border-t border-zinc-100 dark:border-white/10 gap-3 min-h-[4rem]">
          <div className="flex-1 min-w-0">
            <p className="text-2xl sm:text-3xl font-display font-black italic tracking-tighter text-brand-primary leading-none drop-shadow-sm truncate">
              {formatCurrency(product.price)}
            </p>
            {product.stockCount !== undefined && (
               <p className={cn(
                 "text-[8px] font-black uppercase tracking-widest italic mt-2 leading-none truncate",
                 product.stockCount <= 10 ? "text-red-500" : "opacity-30"
               )}>
                 {product.stockCount < 10 ? `Only ${product.stockCount} left!` : `${product.stockCount} ${product.unit} ${t('available')}`}
               </p>
            )}
          </div>
 
          <div className="flex-shrink-0">
            {cartItem ? (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-2xl p-1 shadow-inner"
              >
                <button
                  onClick={(e) => { e.preventDefault(); updateQuantity(product.id, cartItem.quantity - 1); }}
                  className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 hover:bg-brand-primary hover:text-white transition-all shadow-sm"
                >
                  <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                </button>
                <span className="w-6 sm:w-8 text-center font-black text-[10px] sm:text-xs text-[var(--brand-text)] italic">{cartItem.quantity}</span>
                <button
                  onClick={(e) => { e.preventDefault(); updateQuantity(product.id, cartItem.quantity + 1); }}
                  className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 hover:bg-brand-primary hover:text-white transition-all shadow-sm"
                >
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                </button>
              </motion.div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                   e.preventDefault();
                   e.stopPropagation();
                   handleAddToCart();
                }}
                disabled={!product.inStock}
                className={cn(
                  "px-4 sm:px-8 h-10 sm:h-12 rounded-2xl flex items-center justify-center gap-2 sm:gap-3 transition-all duration-500 relative font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] italic text-[9px] sm:text-[10px] shadow-xl whitespace-nowrap",
                  product.inStock
                    ? isAdded 
                      ? "bg-green-500 text-white shadow-green-500/20"
                      : "bg-black dark:bg-white text-white dark:text-black hover:bg-brand-primary dark:hover:bg-brand-primary hover:text-white dark:hover:text-white shadow-black/10"
                    : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed"
                )}
              >
                <AnimatePresence mode="wait">
                  {isAdded ? (
                    <motion.div
                      key="check"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-1.5"
                    >
                      <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span>{t('added')}</span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="add-label"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-1.5"
                    >
                      <span>Add+</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

ProductCard.displayName = 'ProductCard';
