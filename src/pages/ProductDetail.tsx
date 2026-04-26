import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, collection, query, where, orderBy, addDoc, serverTimestamp, updateDoc, increment, getDoc, runTransaction } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product } from '../types';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../components/AuthProvider';
import { formatCurrency, cn } from '../lib/utils';
import { ArrowLeft, ShoppingCart, ShieldCheck, Truck, RefreshCcw, Star, Send, MessageSquare, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';

interface ProductReview {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: any;
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, cart, updateQuantity } = useCart();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;

    // Fetch product
    const unsubscribeProd = onSnapshot(doc(db, 'products', id), (doc) => {
      if (doc.exists()) {
        setProduct({ id: doc.id, ...doc.data() } as unknown as Product);
      }
      setIsLoading(false);
    });

    // Fetch reviews
    const q = query(
      collection(db, 'productReviews'),
      where('productId', '==', id),
      orderBy('createdAt', 'desc')
    );
    const unsubscribeReviews = onSnapshot(q, (snapshot) => {
      const revs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductReview));
      setReviews(revs);
    });

    return () => {
      unsubscribeProd();
      unsubscribeReviews();
    };
  }, [id]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim() || isSubmitting || !product || !id) return;

    setIsSubmitting(true);
    try {
      const reviewRef = collection(db, 'productReviews');
      const productRef = doc(db, 'products', id);

      await runTransaction(db, async (transaction) => {
        const prodDoc = await transaction.get(productRef);
        if (!prodDoc.exists()) throw new Error("Product not found");

        const prodData = prodDoc.data();
        const currentRating = prodData.rating || 0;
        const currentCount = prodData.reviewCount || 0;
        const newCount = currentCount + 1;
        const totalRating = (currentRating * currentCount) + newRating;
        const newAverage = Number((totalRating / newCount).toFixed(1));

        // 1. Add Review
        transaction.set(doc(reviewRef), {
          productId: id,
          userId: user.uid,
          userName: user.displayName || 'Kigali Shopper',
          rating: newRating,
          comment: newComment,
          createdAt: serverTimestamp()
        });

        // 2. Update Product Aggregates
        transaction.update(productRef, {
          rating: newAverage,
          reviewCount: newCount
        });
      });

      setNewComment('');
      setNewRating(5);
    } catch (err) {
      console.error("Error adding review:", err);
      alert("Failed to post review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-32 text-center">
        <RefreshCcw className="h-12 w-12 animate-spin text-brand-primary mx-auto mb-4" />
        <p className="micro-label uppercase tracking-widest italic">{t('loading')}...</p>
      </div>
    );
  }

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-24 items-start mb-32">
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
          {(!product.inStock || (product.stockCount !== undefined && product.stockCount <= 0)) && (
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
            <div className="flex flex-wrap items-center gap-6 mb-8">
              <span className="text-5xl font-black text-brand-primary italic tracking-tighter">
                {product.price.toLocaleString()} <span className="text-sm not-italic font-black opacity-30 tracking-widest uppercase">RWF</span>
              </span>
              <span className="micro-label border border-brand-border dark:border-white/10 px-4 py-2 rounded-full self-center">
                {t('per')} {product.unit}
              </span>
              {product.stockCount !== undefined && (
                <span className={cn(
                  "micro-label px-4 py-2 rounded-full flex items-center gap-2",
                  product.stockCount <= 10 ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : "bg-green-500/10 text-green-500 border border-green-500/20"
                )}>
                  <Package className="h-3 w-3" />
                  {product.stockCount > 0 ? `${product.stockCount} ${t('in_stock')}` : t('out_of_stock')}
                </span>
              )}
            </div>
            
            {(product.rating !== undefined) && (
              <div className="flex items-center gap-4 mb-8">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={cn(
                        "h-5 w-5",
                        i < Math.floor(product.rating || 0) 
                          ? "fill-amber-400 text-amber-400" 
                          : "fill-zinc-200 text-zinc-200 dark:fill-zinc-800 dark:text-zinc-800"
                      )} 
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black italic text-[var(--brand-text)]">{product.rating || '0.0'}</span>
                  <span className="text-xs font-bold opacity-40 text-[var(--brand-text)] uppercase tracking-widest">/ {product.reviewCount || 0} {t('reviews')}</span>
                </div>
              </div>
            )}
            
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
                      disabled={product.stockCount !== undefined && cartItem.quantity >= product.stockCount}
                      className="w-12 h-12 flex items-center justify-center rounded-full bg-brand-primary text-white dark:text-black hover:bg-orange-600 dark:hover:bg-orange-400 transition-all font-black text-2xl disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => addToCart(product)}
                    disabled={!product.inStock || (product.stockCount !== undefined && product.stockCount <= 0)}
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
        </div>
      </div>

      {/* Reviews Section */}
      <section className="mt-32">
        <div className="text-left mb-16 px-6 border-l-8 border-brand-primary">
          <h2 className="text-5xl sm:text-6xl font-black italic uppercase tracking-tighter text-[var(--brand-text)] leading-none">
            REVIEWS <span className="text-brand-primary">& RATINGS</span>
          </h2>
          <p className="micro-label mt-4 opacity-40 uppercase tracking-widest italic">{t('customer_stories')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          {/* Review Form */}
          <div className="lg:col-span-1">
            {user ? (
              <form onSubmit={handleSubmitReview} className="bg-black/5 dark:bg-white/5 border border-brand-border rounded-[40px] p-8 sm:p-10 sticky top-32">
                <h4 className="font-black italic uppercase tracking-tighter text-xl mb-6">{t('review_title')}</h4>
                
                <div className="flex items-center gap-2 mb-8">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewRating(star)}
                      className="focus:outline-none"
                    >
                      <Star className={cn("h-8 w-8 transition-all", star <= newRating ? "fill-amber-400 text-amber-400 scale-110" : "text-zinc-300 dark:text-zinc-700")} />
                    </button>
                  ))}
                </div>

                <textarea
                  required
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder={t('review_placeholder')}
                  className="w-full bg-white dark:bg-zinc-900 border border-brand-border rounded-3xl p-6 text-sm font-bold placeholder:text-zinc-500 outline-none focus:border-brand-primary transition-colors min-h-[150px] mb-6"
                />

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-brand-primary text-white dark:text-black py-5 rounded-full font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-orange-600 transition-all disabled:opacity-50 active:scale-95 italic"
                >
                  {isSubmitting ? <RefreshCcw className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  {t('post_review')}
                </button>
              </form>
            ) : (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-[40px] p-10 text-center sticky top-32">
                 <p className="text-[var(--brand-text)] font-black uppercase italic tracking-widest">{t('login_to_review')}</p>
                 <button onClick={() => navigate('/login')} className="mt-4 text-brand-primary font-black uppercase tracking-widest text-xs hover:underline">LOGIN NOW →</button>
              </div>
            )}
          </div>

          {/* List of Reviews */}
          <div className="lg:col-span-2 space-y-8">
            {reviews.length === 0 ? (
              <div className="text-center py-32 bg-black/5 dark:bg-white/5 rounded-[50px] border border-dashed border-brand-border">
                <MessageSquare className="h-16 w-16 mx-auto mb-6 opacity-10" />
                <p className="font-black italic uppercase opacity-20 tracking-tighter text-2xl">{t('no_reviews_yet')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {reviews.map(rev => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={rev.id}
                    className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border border-brand-border p-8 rounded-[40px] relative group"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={cn("h-3 w-3", i < rev.rating ? "fill-amber-400 text-amber-400" : "text-zinc-200 dark:text-zinc-800")} />
                        ))}
                      </div>
                      <span className="text-[8px] font-black uppercase opacity-30 italic">
                        {rev.createdAt?.toDate?.() ? rev.createdAt.toDate().toLocaleDateString() : 'Just now'}
                      </span>
                    </div>
                    <p className="text-[var(--brand-text)] font-bold italic uppercase tracking-tight text-base leading-relaxed mb-8">
                      "{rev.comment}"
                    </p>
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-2xl bg-brand-primary/10 flex items-center justify-center font-black text-brand-primary uppercase italic">
                         {rev.userName[0]}
                       </div>
                       <div>
                         <span className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">{rev.userName}</span>
                       </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
