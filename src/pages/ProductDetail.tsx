import { useParams, useNavigate } from 'react-router-dom';
import productsData from '../data/products.json';
import { Product } from '../types';
import { useCart } from '../hooks/useCart';
import { formatCurrency } from '../lib/utils';
import { ArrowLeft, ShoppingCart, ShieldCheck, Truck, RefreshCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, cart, updateQuantity } = useCart();
  const { t } = useTranslation();

  const product = (productsData.products as Product[]).find(p => p.id === Number(id));
  
  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-32 text-center">
        <h2 className="text-2xl font-black mb-4 uppercase italic text-[var(--brand-text)]">{t('not_found')}</h2>
        <button 
          onClick={() => navigate('/')}
          className="text-brand-primary font-black uppercase tracking-widest hover:underline"
        >
          {t('back_to_shop')}
        </button>
      </div>
    );
  }

  const cartItem = cart.find(item => item.id === product.id);

  return (
    <div className="max-w-7xl mx-auto px-4 py-16 sm:py-24">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 micro-label mb-12 hover:text-brand-primary transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('back_to_shop')}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-24 items-start">
        {/* Image Gallery */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card-gradient overflow-hidden aspect-square relative group flex items-center justify-center p-12 sm:p-20"
        >
          <div className="absolute inset-0 bg-black/5 dark:bg-black/40 z-0" />
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-contain relative z-10 grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
          <div className="absolute top-10 left-10 z-20">
             <span className="micro-label px-4 py-2 border border-brand-border dark:border-white/10 rounded-full bg-white/50 dark:bg-black/50 backdrop-blur-md">
               {product.category}
             </span>
          </div>
          {!product.inStock && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-30">
              <span className="text-2xl font-black uppercase italic tracking-widest text-white">
                {t('out_of_stock')}
              </span>
            </div>
          )}
        </motion.div>

        {/* Content */}
        <div className="space-y-10">
          <div>
            <h1 className="text-6xl sm:text-8xl font-black tracking-tighter uppercase italic text-[var(--brand-text)] mb-6 leading-[0.9]">
              {product.name}
            </h1>
            <div className="flex items-center gap-6 mb-8">
              <span className="text-5xl font-black text-brand-primary italic tracking-tighter">
                {product.price.toLocaleString()} <span className="text-sm not-italic font-black opacity-30 tracking-widest uppercase">RWF</span>
              </span>
              <span className="micro-label border border-brand-border dark:border-white/10 px-4 py-2 rounded-full self-center">
                {t('per')} {product.unit}
              </span>
            </div>
            
            <p className="text-[var(--brand-text-muted)] leading-relaxed text-sm font-bold uppercase tracking-tight italic">
              Premium quality {product.name} sourced globally. Delivered fresh to your Kigali home in record time.
            </p>
          </div>

          {/* Action */}
          <div className="space-y-6 pt-10 border-t border-brand-border dark:border-white/10">
             <div className="flex flex-wrap items-center gap-6">
                {cartItem ? (
                  <div className="flex items-center gap-8 bg-black/5 dark:bg-black border border-brand-border dark:border-white/10 rounded-full p-2 px-6 h-20">
                    <button 
                      onClick={() => updateQuantity(product.id, cartItem.quantity - 1)}
                      className="w-12 h-12 flex items-center justify-center rounded-full bg-brand-primary text-white dark:text-black hover:bg-orange-600 dark:hover:bg-orange-400 transition-all font-black text-2xl"
                    >
                      -
                    </button>
                    <span className="text-2xl font-black min-w-[2rem] text-center text-[var(--brand-text)]">{cartItem.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}
                      className="w-12 h-12 flex items-center justify-center rounded-full bg-brand-primary text-white dark:text-black hover:bg-orange-600 dark:hover:bg-orange-400 transition-all font-black text-2xl"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => addToCart(product)}
                    disabled={!product.inStock}
                    className="flex-1 h-20 bg-brand-primary hover:bg-orange-600 dark:hover:bg-orange-400 text-white dark:text-black px-10 rounded-full font-black uppercase tracking-widest transition-all shadow-2xl shadow-brand-primary/20 active:scale-95 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 disabled:text-zinc-400 dark:disabled:text-white/10 italic"
                  >
                    {t('add_to_cart')}
                  </button>
                )}
             </div>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-10 border-t border-brand-border dark:border-white/10">
            <div className="flex items-center gap-4 group">
              <div className="p-4 bg-brand-primary/10 border border-brand-primary/20 rounded-2xl text-brand-primary group-hover:bg-brand-primary/20 transition-colors">
                <Truck className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--brand-text)] leading-tight">{t('delivery_30m')}</span>
            </div>
            <div className="flex items-center gap-4 group">
              <div className="p-4 bg-brand-primary/10 border border-brand-primary/20 rounded-2xl text-brand-primary group-hover:bg-brand-primary/20 transition-colors">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--brand-text)] leading-tight">{t('quality_pick')}</span>
            </div>
            <div className="flex items-center gap-4 group">
              <div className="p-4 bg-brand-primary/10 border border-brand-primary/20 rounded-2xl text-brand-primary group-hover:bg-brand-primary/20 transition-colors">
                <RefreshCcw className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--brand-text)] leading-tight">{t('safe_returns')}</span>
            </div>
          </div>

          <div className="bg-black/5 dark:bg-black border border-brand-border dark:border-white/10 rounded-[40px] p-10">
            <h3 className="micro-label mb-6 uppercase tracking-widest text-brand-primary !opacity-100 italic">{t('market_insight')}</h3>
            <p className="text-[var(--brand-text-muted)] text-xs leading-relaxed font-bold uppercase tracking-widest italic">
              {t('quality_guarantee')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
