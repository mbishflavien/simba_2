import React from 'react';
import { Product } from '../types';
import { useCart } from '../hooks/useCart';
import { formatCurrency, cn } from '../lib/utils';
import { ShoppingCart, Plus, Minus, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, cart, updateQuantity } = useCart();
  const { t } = useTranslation();

  const cartItem = cart.find(item => item.id === product.id);

  return (
    <motion.div
      layout
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
      </Link>

      <div className="flex flex-col gap-1 px-1">
        <div className="mb-0.5">
          <span className="micro-label">
            {product.category}
          </span>
        </div>
        <Link to={`/product/${product.id}`} className="block mb-2">
          <h3 className="font-bold tracking-tight group-hover:text-brand-primary transition-colors line-clamp-1 uppercase italic text-[var(--brand-text)]">
            {product.name}
          </h3>
        </Link>

        <div className="flex justify-between items-center mt-2">
          <div>
            <p className="text-2xl font-black italic tracking-tighter text-[var(--brand-text)]">
              {product.price.toLocaleString()} <span className="text-[10px] not-italic font-bold opacity-30 tracking-widest uppercase text-[var(--brand-text)]">RWF</span>
            </p>
          </div>

          {cartItem ? (
            <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 rounded-full p-1 border border-brand-border">
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
            </div>
          ) : (
            <button
              onClick={() => addToCart(product)}
              disabled={!product.inStock}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                product.inStock
                  ? "bg-brand-primary text-white dark:text-black hover:bg-orange-600 dark:hover:bg-orange-400 active:scale-95 shadow-xl shadow-brand-primary/20"
                  : "bg-black/5 dark:bg-white/5 text-black/20 dark:text-white/20 cursor-not-allowed"
              )}
            >
              <Plus className="h-5 w-5 font-black" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
