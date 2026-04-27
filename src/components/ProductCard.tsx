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
      <Link to={`/product/${product.id}`} className="flex-1 bg-black/5 dark:bg-black rounded-[30px] mb-5 flex items-center justify-center relative overflow-hidden group">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-contain p-6 group-hover:scale-105 transition-transform duration-500"
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
        <Link to={`/product/${product.id}`} className="block mb-2">
          <h3 className="font-display font-black tracking-tight group-hover:text-brand-primary transition-colors line-clamp-1 uppercase italic text-[var(--brand-text)] leading-tight">
            {product.name}
          </h3>
        </Link>

        <div className="flex justify-between items-center mt-2 h-10">
          <div>
            <p className="text-2xl font-display font-black italic tracking-tighter text-[var(--brand-text)] leading-none">
              {product.price.toLocaleString()} <span className="text-[9px] not-italic font-black opacity-30 tracking-[0.2em] uppercase text-[var(--brand-text)] font-mono">RWF</span>
            </p>
            {product.stockCount !== undefined && (
               <p className={cn(
                 "text-[8px] font-black uppercase tracking-widest italic mt-1 leading-none",
                 product.stockCount <= 10 ? "text-brand-primary" : "opacity-30"
               )}>
                 {product.stockCount} {product.unit} {t('left_in_stock')}
               </p>
            )}
          </div>

          {cartItem ? (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-2 bg-black/5 dark:bg-white/5 rounded-full p-1 border border-brand-border"
            >
              <button
                onClick={() => updateQuantity(product.id, cartItem.quantity - 1)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-brand-primary hover:text-white transition-colors"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="w-6 text-center font-black text-xs text-[var(--brand-text)]">{cartItem.quantity}</span>
              <button
                onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-brand-primary hover:text-white transition-colors"
              >
                <Plus className="h-3 w-3" />
              </button>
            </motion.div>
          ) : (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleAddToCart}
              disabled={!product.inStock}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 relative overflow-hidden",
                product.inStock
                  ? isAdded 
                    ? "bg-green-500 text-white shadow-xl shadow-green-500/20"
                    : "bg-brand-primary text-white dark:text-black hover:bg-orange-600 dark:hover:bg-orange-400 shadow-xl shadow-brand-primary/20"
                  : "bg-black/5 dark:bg-white/5 text-black/20 dark:text-white/20 cursor-not-allowed"
              )}
            >
              <AnimatePresence mode="wait">
                {isAdded ? (
                  <motion.div
                    key="check"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                  >
                    <Check className="h-5 w-5 font-black" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="plus"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                  >
                    <Plus className="h-5 w-5 font-black" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
});

ProductCard.displayName = 'ProductCard';
