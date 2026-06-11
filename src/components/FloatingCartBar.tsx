import React from 'react';
import { useCart } from '../hooks/useCart';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency } from '../lib/utils';
import { useTranslation } from 'react-i18next';

export default function FloatingCartBar() {
  const { totalItems, totalPrice } = useCart();
  const { t } = useTranslation();
  const location = useLocation();

  // Hide the bar on cart details or checkout views so it doesn't overlap
  const isExcludedPage = ['/cart', '/checkout', '/login', '/signup'].includes(location.pathname);

  if (totalItems === 0 || isExcludedPage) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, x: '-50%', opacity: 0, scale: 0.9 }}
        animate={{ y: 0, x: '-50%', opacity: 1, scale: 1 }}
        exit={{ y: 80, x: '-50%', opacity: 0, scale: 0.9 }}
        transition={{ type: 'spring', damping: 20, stiffness: 260 }}
        className="fixed bottom-6 left-1/2 z-[90] w-[90%] max-w-md select-none pointer-events-auto filter drop-shadow-[0_20px_50px_rgba(255,107,0,0.3)] md:left-auto md:right-8 md:translate-x-0"
        id="floating-cart-bar"
      >
        <Link 
          to="/cart"
          className="flex items-center justify-between gap-4 p-4 sm:p-5 bg-zinc-950/95 dark:bg-white/95 backdrop-blur-xl border border-white/10 dark:border-zinc-800 rounded-full text-white dark:text-black hover:scale-[1.03] active:scale-98 transition-all"
        >
          {/* Cart Icon & Item Count */}
          <div className="flex items-center gap-4 pl-2">
            <div className="relative p-2.5 sm:p-3 bg-brand-primary text-white rounded-full flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 animate-pulse" />
              <motion.span
                key={totalItems}
                initial={{ scale: 0.3 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 bg-white text-zinc-950 dark:bg-zinc-950 dark:text-white border-2 border-brand-primary text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow"
              >
                {totalItems}
              </motion.span>
            </div>
            <div>
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] opacity-50 dark:opacity-60 leading-none mb-1">
                {t('cart')}
              </p>
              <p className="font-display font-black text-sm sm:text-base leading-none">
                {formatCurrency(totalPrice)}
              </p>
            </div>
          </div>

          {/* Action text & button */}
          <div className="flex items-center gap-3 pr-2">
            <span className="hidden sm:inline-block text-[10px] font-black uppercase tracking-widest italic opacity-85">
              {t('checkout_now')}
            </span>
            <div className="w-10 h-10 rounded-full bg-brand-primary text-white flex items-center justify-center transform group-hover:translate-x-1.5 transition-transform">
              <ArrowRight className="h-5 w-5" />
            </div>
          </div>
        </Link>
      </motion.div>
    </AnimatePresence>
  );
}
