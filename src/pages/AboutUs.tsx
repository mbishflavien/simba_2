import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../components/AuthProvider';
import { Award, Target, Users, Zap, MapPin, Store, Coffee, Gamepad2, GraduationCap, Star, Send, MessageSquare, RefreshCcw } from 'lucide-react';
import { SIMBA_BRANCHES } from '../components/BranchMap';
import { cn } from '../lib/utils';

interface BranchReview {
  id: string;
  branchId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: any;
}

export default function AboutUs() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [selectedBranchId, setSelectedBranchId] = useState<string>(SIMBA_BRANCHES[0].id);
  const [reviews, setReviews] = useState<BranchReview[]>([]);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReviewsLoading, setIsReviewsLoading] = useState(true);

  const achievements = [
    { year: '2013', title: t('ach_2013') },
    { year: '2014', title: t('ach_2014') },
    { year: '2015', title: t('ach_2015') },
    { year: '2020', title: t('ach_2020') },
  ];

  const branches = [
    'Simba Centenary', 'Simba Gishushu', 'Simba Kimironko', 'Simba Kicukiro',
    'Simba Kigali Heights', 'Simba UTC', 'Simba Gacuriro', 'Simba Gikondo',
    'Simba Sonatube', 'Simba Kisimenti', 'Simba Rebero'
  ];

  // Fetch reviews for selected branch
  useEffect(() => {
    setIsReviewsLoading(true);
    const q = query(
      collection(db, 'branchReviews'), 
      where('branchId', '==', selectedBranchId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const revs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BranchReview));
      setReviews(revs);
      setIsReviewsLoading(false);
    });

    return () => unsubscribe();
  }, [selectedBranchId]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'branchReviews'), {
        branchId: selectedBranchId,
        userId: user.uid,
        userName: user.displayName || 'Kigali Shopper',
        rating: newRating,
        comment: newComment,
        createdAt: serverTimestamp()
      });
      setNewComment('');
      setNewRating(5);
    } catch (err) {
      console.error("Error adding review:", err);
      alert("Failed to post review. Please ensure you are logged in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const sections = [
    {
      title: t('about_simba'),
      content: t('company_profile_desc'),
      icon: Users
    },
    {
      title: t('origin_history_title'),
      content: t('origin_history_desc'),
      icon: GraduationCap
    }
  ];

  const values = [
    {
      title: t('respect_title'),
      description: t('respect_desc'),
      icon: Target
    },
    {
      title: t('service_title'),
      description: t('service_desc'),
      icon: Zap
    },
    {
      title: t('excellence_title'),
      description: t('excellence_desc'),
      icon: Award
    }
  ];

  const categories = [
    { name: t('cat_fruits_veg'), key: 'Food & Groceries' },
    { name: t('cat_meats'), key: 'Food & Groceries' },
    { name: t('cat_frozen'), key: 'Food & Groceries' },
    { name: t('cat_wines_spirits'), key: 'Alcoholic Drinks' },
    { name: t('cat_furniture'), key: 'Household' },
    { name: t('cat_electronic'), key: 'Kitchenware' },
    { name: t('cat_utensils'), key: 'Household' },
    { name: t('cat_homecare'), key: 'Household' },
    { name: t('cat_baby_prod'), key: 'Baby & Kids' },
    { name: t('cat_gym_sports'), key: 'Personal Care' },
    { name: t('cat_health_beauty'), key: 'Personal Care' },
    { name: t('cat_bakery'), key: 'Food & Groceries' }
  ];

  const handleCategoryClick = (key: string) => {
    navigate(`/?search=${encodeURIComponent(key)}`);
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen pt-24 pb-20">
      {/* Hero Header */}
      <section className="max-w-7xl mx-auto px-4 mb-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-block mb-6"
        >
          <span className="micro-label bg-brand-primary/10 border border-brand-primary/30 px-4 py-2 rounded-full text-brand-primary italic">
            {t('since_2007')}
          </span>
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="massive-header text-[var(--brand-text)]"
        >
          {t('about_us').split(' ')[0]} <span className="text-brand-primary">{t('about_us').split(' ').slice(1).join(' ') || 'SIMBA'}</span>
        </motion.h1>
      </section>

      {/* Profile & History */}
      <section className="max-w-7xl mx-auto px-4 mb-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-20">
          {sections.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="card-gradient p-8 sm:p-12"
            >
              <section.icon className="h-12 w-12 text-brand-primary mb-8" />
              <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-6 text-[var(--brand-text)]">
                {section.title}
              </h2>
              <p className="text-[var(--brand-text)] opacity-70 leading-relaxed font-bold italic uppercase tracking-tight text-sm">
                {section.content}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Branch Feedback Section (New) */}
      <section className="max-w-7xl mx-auto px-4 mb-32">
        <div className="text-left mb-16 px-6 border-l-8 border-brand-primary">
          <h2 className="text-5xl sm:text-6xl font-black italic uppercase tracking-tighter text-[var(--brand-text)] leading-none">
            BRANCH <span className="text-brand-primary">EXPERIENCE</span>
          </h2>
          <p className="micro-label mt-4 opacity-40 uppercase tracking-widest italic">{t('share_your_thoughts')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          {/* Branch Selector */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-brand-primary mb-6 italic">{t('select_branch')}</h3>
            <div className="bg-black/5 dark:bg-white/5 rounded-[40px] p-4 border border-brand-border h-[500px] overflow-y-auto custom-scrollbar">
              {SIMBA_BRANCHES.map(branch => (
                <button
                  key={branch.id}
                  onClick={() => setSelectedBranchId(branch.id)}
                  className={cn(
                    "w-full text-left p-6 rounded-[30px] mb-2 transition-all flex flex-col gap-1 border-2",
                    selectedBranchId === branch.id 
                      ? "bg-brand-primary border-brand-primary text-white shadow-xl shadow-brand-primary/20 scale-[1.02]" 
                      : "bg-white/50 dark:bg-black/40 border-transparent hover:border-brand-primary/30"
                  )}
                >
                  <span className="font-black italic uppercase tracking-tighter text-lg">{branch.name}</span>
                  <span className={cn("text-[9px] font-bold uppercase opacity-50", selectedBranchId === branch.id ? "text-white" : "text-zinc-500")}>
                    {branch.address}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Reviews & Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* Review Form */}
            {user ? (
               <form onSubmit={handleSubmitReview} className="bg-black/5 dark:bg-white/5 border border-brand-border rounded-[40px] p-8 sm:p-12">
                  <div className="flex items-center gap-6 mb-8">
                    <div className="w-16 h-16 bg-brand-primary rounded-full flex items-center justify-center text-white text-2xl font-black uppercase italic">
                      {user.displayName?.[0] || 'K'}
                    </div>
                    <div>
                      <h4 className="font-black italic uppercase tracking-tighter text-xl">{t('review_title')}</h4>
                      <div className="flex items-center gap-2 mt-2">
                        {[1, 2, 3, 4, 5].map(star => (
                           <button
                             key={star}
                             type="button"
                             onClick={() => setNewRating(star)}
                             className="focus:outline-none"
                           >
                             <Star className={cn("h-6 w-6 transition-all", star <= newRating ? "fill-amber-400 text-amber-400 scale-110" : "text-zinc-300 dark:text-zinc-700")} />
                           </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <textarea
                    required
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder={t('review_placeholder')}
                    className="w-full bg-white dark:bg-zinc-900 border border-brand-border rounded-3xl p-6 text-sm font-bold placeholder:text-zinc-500 outline-none focus:border-brand-primary transition-colors min-h-[120px] mb-6"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-brand-primary text-white dark:text-black px-12 py-5 rounded-full font-black uppercase tracking-widest flex items-center gap-3 hover:bg-orange-600 transition-all disabled:opacity-50 active:scale-95 italic"
                    >
                      {isSubmitting ? (
                        <RefreshCcw className="h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                      {t('post_review')}
                    </button>
                  </div>
               </form>
            ) : (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-[40px] p-10 text-center">
                 <p className="text-[var(--brand-text)] font-black uppercase italic tracking-widest">{t('login_to_review')}</p>
              </div>
            )}

            {/* Reviews List */}
            <div className="space-y-6">
              <h4 className="micro-label uppercase tracking-widest font-black italic border-b border-brand-border pb-4 flex items-center gap-3">
                <MessageSquare className="h-4 w-4" />
                {reviews.length} {t('customer_stories')}
              </h4>
              
              {isReviewsLoading ? (
                <div className="flex justify-center p-20">
                   <RefreshCcw className="h-10 w-10 animate-spin text-brand-primary" />
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-20 bg-black/5 dark:bg-white/5 rounded-[40px] border border-dashed border-brand-border">
                  <p className="font-black italic uppercase opacity-20 tracking-tighter text-xl">{t('no_reviews_yet')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {reviews.map(rev => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={rev.id}
                      className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border border-brand-border p-8 rounded-[40px] relative group overflow-hidden"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={cn("h-3 w-3", i < rev.rating ? "fill-amber-400 text-amber-400" : "text-zinc-200 dark:text-zinc-800")} />
                          ))}
                        </div>
                        <span className="text-[8px] font-black uppercase opacity-30 italic">
                          {rev.createdAt instanceof Timestamp ? rev.createdAt.toDate().toLocaleDateString() : 'Just now'}
                        </span>
                      </div>
                      <p className="text-[var(--brand-text)] font-bold italic uppercase tracking-tight text-sm leading-relaxed mb-6">
                        "{rev.comment}"
                      </p>
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-xl bg-brand-primary/10 flex items-center justify-center font-black text-brand-primary uppercase italic text-xs">
                           {rev.userName[0]}
                         </div>
                         <span className="text-[10px] font-black uppercase tracking-widest opacity-60 italic">{rev.userName}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Beliefs & Values */}
      <section className="bg-black/5 dark:bg-black/50 py-24 mb-32 border-y border-brand-border">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-black italic uppercase tracking-tighter text-[var(--brand-text)]">
              {t('beliefs_values').split(' ').slice(0, -1).join(' ')} <span className="text-brand-primary">{t('beliefs_values').split(' ').slice(-1)}</span>
            </h2>
            <div className="h-1.5 w-32 bg-brand-primary mx-auto mt-6" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((v, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 text-center flex flex-col items-center"
              >
                <div className="w-16 h-16 rounded-3xl bg-brand-primary/10 flex items-center justify-center mb-8 border border-brand-primary/20">
                  <v.icon className="h-8 w-8 text-brand-primary" />
                </div>
                <h3 className="text-xl font-bold uppercase italic tracking-tighter mb-4 text-[var(--brand-text)]">
                  {v.title}
                </h3>
                <p className="text-xs font-bold uppercase tracking-tight opacity-50 leading-loose">
                  {v.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Detail Sections */}
      <div className="max-w-7xl mx-auto px-4 mb-32">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-20">
          {/* Categories */}
          <div>
            <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-10 text-[var(--brand-text)] border-l-4 border-brand-primary pl-6">
              {t('shop_by_category')}
            </h2>
            <div className="flex flex-wrap gap-3">
              {categories.map((c, i) => (
                <button 
                  key={i} 
                  onClick={() => handleCategoryClick(c.key)}
                  className="px-4 py-2 bg-black/5 dark:bg-white/5 border border-brand-border rounded-full text-[10px] font-black uppercase tracking-widest text-[var(--brand-text)] opacity-60 hover:opacity-100 hover:border-brand-primary hover:text-brand-primary transition-all active:scale-95"
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Achievements */}
          <div>
            <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-10 text-[var(--brand-text)] border-l-4 border-brand-primary pl-6">
              {t('achievements')}
            </h2>
            <div className="space-y-6">
              {achievements.map((a, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="text-brand-primary font-black italic text-xl tracking-tighter">{a.year}</div>
                  <div className="text-xs font-bold uppercase tracking-widest text-[var(--brand-text)] opacity-60 mt-1">{a.title}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Branches */}
          <div>
            <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-10 text-[var(--brand-text)] border-l-4 border-brand-primary pl-6">
              {t('branches')}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {branches.map((b, i) => (
                <div key={i} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--brand-text)] opacity-50 hover:text-brand-primary transition-colors cursor-default">
                  <MapPin className="h-3 w-3 text-brand-primary" />
                  {b}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Services Detail */}
      <section className="max-w-7xl mx-auto px-4 mb-32">
        <div className="text-left mb-16 px-6 border-l-8 border-brand-primary">
          <h2 className="text-6xl sm:text-7xl font-black italic uppercase tracking-tighter text-[var(--brand-text)] leading-none">
            {t('services_detail').split(' ')[0]} <span className="text-brand-primary">{t('services_detail').split(' ').slice(1).join(' ')}</span>
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ServiceCard 
            icon={Store}
            title={t('supermarket_service_title')}
            desc={t('supermarket_service_desc')}
          />
          <ServiceCard 
            icon={Coffee}
            title={t('restaurant_service_title')}
            desc={t('restaurant_service_desc')}
          />
          <ServiceCard 
            icon={Gamepad2}
            title={t('arcade_service_title')}
            desc={t('arcade_service_desc')}
          />
          <ServiceCard 
            icon={Zap}
            title={t('online_sales_title')}
            desc={t('online_sales_desc')}
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4">
         <div className="bg-brand-primary p-12 sm:p-20 rounded-[50px] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-20 opacity-10 group-hover:scale-110 transition-transform duration-700">
               <Store className="h-64 w-64 text-zinc-900 dark:text-black" />
            </div>
            <div className="relative z-10 max-w-2xl">
               <h2 className="text-5xl sm:text-7xl font-black italic uppercase tracking-tighter text-zinc-950 dark:text-white mb-8">
                  {t('simba_is_everywhere').split(' ').slice(0, 2).join(' ')} <br/>{t('simba_is_everywhere').split(' ').slice(2).join(' ')}
               </h2>
               <p className="text-zinc-950/80 dark:text-white/80 font-bold uppercase tracking-widest italic mb-12 text-sm leading-relaxed">
                  {t('cta_about_desc')}
               </p>
               <button 
                onClick={() => navigate('/')}
                className="bg-zinc-900 dark:bg-white text-white dark:text-brand-primary px-12 py-5 rounded-full font-black uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all text-xs italic"
               >
                  {t('back_to_shopping')}
               </button>
            </div>
         </div>
      </section>
    </div>
  );
}

function ServiceCard({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="card-gradient p-8"
    >
      <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center mb-6">
        <Icon className="h-6 w-6 text-brand-primary" />
      </div>
      <h3 className="text-lg font-black uppercase italic tracking-tighter mb-4 text-[var(--brand-text)]">
        {title}
      </h3>
      <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 leading-relaxed">
        {desc}
      </p>
    </motion.div>
  );
}
