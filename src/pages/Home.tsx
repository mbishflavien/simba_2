import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { ProductCard } from '../components/ProductCard';
import CategoryBar from '../components/CategoryBar';
import { Product } from '../types';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';
import { Search, ShoppingBag, Sliders, Filter, CheckCircle2, PackageSearch, ArrowRight, Info, ShieldCheck, Clock, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AiAssistant from '../components/AiAssistant';
import { AiSearchIntent } from '../services/aiService';
import landingHero from '../assets/images/landing_hero_1781164991277.png';

export default function Home() {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewsList, setReviewsList] = useState<any[]>([]);
  const [categoriesList, setCategoriesList] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(16);
  
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(prods);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'productReviews'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReviewsList(snapshot.docs.map(doc => doc.data()));
    }, (error) => {
      console.error("Non-blocking error listening to productReviews:", error);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'categories'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const cats = snapshot.docs.map(doc => doc.data().name as string);
        setCategoriesList(cats);
      }
    }, (error) => {
      console.error("Non-blocking error listening to categories:", error);
    });
    return () => unsubscribe();
  }, []);

  const reviewsMap = useMemo(() => {
    const map: Record<string, { sum: number; count: number }> = {};
    reviewsList.forEach(r => {
      if (!r.productId) return;
      if (!map[r.productId]) {
        map[r.productId] = { sum: Number(r.rating) || 0, count: 1 };
      } else {
        map[r.productId].sum += Number(r.rating) || 0;
        map[r.productId].count += 1;
      }
    });
    return map;
  }, [reviewsList]);

  const enrichedProducts = useMemo(() => {
    return products.map(p => {
      const stats = reviewsMap[p.id];
      const prodPrice = typeof p.price === 'number' ? p.price : Number(p.price) || 0;
      return {
        ...p,
        price: prodPrice,
        rating: stats ? Number((stats.sum / stats.count).toFixed(1)) : 0,
        reviewCount: stats ? stats.count : 0
      };
    });
  }, [products, reviewsMap]);

  const allCategories = useMemo(() => {
    // Deduplicate and normalize categories
    const derived = products.map(p => {
      const cat = typeof p.category === 'string' ? p.category.trim() : null;
      if (!cat) return null;
      // Normalize common synonyms to avoid duplicates
      if (cat === 'Alcohol') return 'Alcoholic Drinks';
      if (cat === 'Kitchenware') return 'Kitchenware & Electronics';
      if (cat === 'Personal Care') return 'Cosmetics & Personal Care';
      if (cat === 'Baby & Kids') return 'Baby Products';
      if (cat === 'Food & Groceries') return 'Food Products';
      return cat;
    }).filter(Boolean);

    const combined = Array.from(new Set([...categoriesList, ...derived]));
    return combined.sort() as string[];
  }, [products, categoriesList]);

  const handleAiSearch = (intent: AiSearchIntent) => {
    // Apply filters from AI - resetting properties if they aren't part of the current intent to prevent stale filters
    setSelectedCategory(intent.category);
    setMinPrice(intent.minPrice !== null ? intent.minPrice : '');
    setMaxPrice(intent.maxPrice !== null ? intent.maxPrice : '');
    
    // Update URL for the search query
    const newParams = new URLSearchParams(searchParams);
    if (intent.searchQuery) {
      newParams.set('search', intent.searchQuery);
    } else {
      newParams.delete('search');
    }
    setSearchParams(newParams);
    
    // Open filter panel if we have price filters to show the user what happened, otherwise close it
    if (intent.minPrice !== null || intent.maxPrice !== null) {
      setIsFilterOpen(true);
    } else {
      setIsFilterOpen(false);
    }

    // Scroll to results
    document.getElementById('market')?.scrollIntoView({ behavior: 'smooth' });
  };

  const searchQuery = useMemo(() => 
    searchParams.get('search')?.toLowerCase() || ''
  , [searchParams]);

  const filteredProducts = useMemo(() => {
    return enrichedProducts.filter(product => {
      if (selectedCategory && product.category !== selectedCategory) return false;
      
      if (searchQuery) {
        // Split on whitespace, commas, or semicolons
        const keywords = searchQuery.split(/[\s,;]+/).map(k => k.trim()).filter(k => k.length > 0);
        const name = product.name?.toLowerCase() || '';
        const category = product.category?.toLowerCase() || '';
        
        // Expand keywords with synonyms and thematic expansions
        const expandedKeywords = keywords.flatMap(k => {
          if (k === 'liquor' || k === 'wine' || k === 'beer' || k === 'whiskey') return [k, 'alcohol', 'alcoholic'];
          if (k === 'food' || k === 'grocery' || k === 'groceries') return [k, 'groceries', 'food'];
          if (k === 'gym' || k === 'fitness' || k === 'workout') return [k, 'sports', 'wellness', 'fitness'];
          if (k === 'breakfast' || k === 'morning') return [k, 'milk', 'bread', 'egg', 'cereal', 'butter', 'coffee', 'tea', 'yogurt', 'jam', 'juice', 'banana', 'croissant', 'lactogen', 'inyange', 'mukamira', 'sandwich'];
          if (k === 'bbq' || k === 'barbecue' || k === 'braai') return [k, 'sausage', 'beef', 'chicken', 'meat', 'pork', 'charcoal', 'wings', 'beer'];
          if (k === 'baking' || k === 'baking ingredients') return [k, 'flour', 'sugar', 'egg', 'butter', 'vanilla', 'baking powder', 'baking soda', 'cream', 'milk', 'chocolate'];
          if (k === 'skincare' || k === 'cosmetics') return [k, 'lotion', 'soap', 'cream', 'shampoo', 'wash', 'beauty', 'cleanser', 'perfume'];
          if (k === 'baby' || k === 'babies') return [k, 'diapers', 'baby', 'kid', 'toy', 'milk', 'wipe', 'powder', 'lactogen'];
          if (k === 'cleaning' || k === 'laundry' || k === 'wash') return [k, 'liquid', 'soap', 'detergent', 'powder', 'cleaner', 'bleach', 'sanitizer'];
          return [k];
        });

        const matchesAny = expandedKeywords.some(keyword => {
          // Escape regex characters
          const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          // Match only at word boundaries (e.g. "tea" does not match "steamed")
          const regex = new RegExp(`\\b${escaped}`, 'i');
          return regex.test(name) || regex.test(category);
        });
        if (!matchesAny) return false;
      }
      
      if (minPrice !== '' && product.price < (minPrice as number)) return false;
      if (maxPrice !== '' && product.price > (maxPrice as number)) return false;
      if (onlyInStock && (!product.inStock || (product.stockCount !== undefined && product.stockCount <= 0))) return false;

      return true;
    });
  }, [products, selectedCategory, searchQuery, minPrice, maxPrice, onlyInStock]);

  const displayedProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount]);

  const loadMore = React.useCallback(() => {
    setVisibleCount(prev => prev + 16);
  }, []);

  const getCategoryLabel = (cat: string) => {
    const manualMap: Record<string, string> = {
      'Alcoholic Drinks': t('cat_alcohol'),
      'Kitchenware & Electronics': t('cat_kitchen'),
      'Cosmetics & Personal Care': t('cat_personal'),
      'Baby Products': t('cat_baby'),
      'Sports & Wellness': t('cat_sports'),
      'Food Products': t('cat_food'),
    };
    
    if (manualMap[cat]) return manualMap[cat];

    const key = `cat_${cat.toLowerCase().replace(/ & /g, '_').replace(/ /g, '_')}`;
    const translated = t(key);
    return translated === key ? cat : translated;
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      {!searchQuery && !selectedCategory && (
        <section className="relative min-h-[90vh] md:min-h-screen flex items-center justify-center overflow-hidden bg-white dark:bg-black w-full" id="welcome-hero-section">
          {/* Background Image on Right half on desktop, top half on mobile */}
          <div className="absolute inset-0 z-0 h-[45vh] md:h-full md:w-1/2 md:right-0 md:left-auto">
            <img 
              src={landingHero} 
              alt="Simba Supermarket Premium Storefront" 
              className="w-full h-full object-cover dark:brightness-90 object-center transition-all duration-700 ease-out"
              referrerPolicy="no-referrer"
            />
            {/* Crisp Gradient Transition overlays to handle high-contrast text rendering */}
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent dark:from-black dark:via-black/85 md:hidden" />
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/10 to-transparent dark:from-black dark:via-black/20 hidden md:block" />
          </div>

          {/* Main Content Area */}
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 z-10 flex items-center pt-[48vh] md:pt-32 pb-16 md:py-32 animate-fade-in-up">
            <div className="w-full md:w-[48%] flex flex-col justify-center text-left space-y-6 sm:space-y-10">
              
              {/* Welcome Badges */}
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex flex-wrap items-center gap-3"
              >
                <div className="inline-flex items-center gap-3 bg-brand-primary/10 border border-brand-primary/20 hover:border-brand-primary/40 px-5 py-2 rounded-full backdrop-blur-xl transition-all">
                  <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] text-brand-primary italic">
                    {i18n.language === 'rw' ? 'Murakaza neza i Kigali' : 'Murakaza Neza • A Warm Welcome'}
                  </span>
                </div>

                <div 
                  onClick={() => {
                    const lng = i18n.language === 'rw' ? 'en' : 'rw';
                    i18n.changeLanguage(lng);
                  }}
                  className="cursor-pointer inline-flex items-center gap-3 bg-brand-accent/20 backdrop-blur-xl border border-brand-accent/30 px-5 py-2 rounded-full hover:bg-brand-accent/40 transition-all group"
                >
                  <CheckCircle2 className="h-4 w-4 text-brand-accent" />
                  <span className="text-[10px] font-black uppercase text-brand-accent tracking-widest italic group-hover:scale-105 transition-transform" id="lang-switch-badge">
                    {i18n.language === 'rw' ? 'Ururimi: Kinyarwanda' : 'Kinyarwanda Support Ready'}
                  </span>
                </div>
              </motion.div>

              {/* Majestic Hero Copy */}
              <div className="space-y-4 sm:space-y-6">
                <motion.h1 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="text-4xl sm:text-6xl lg:text-7xl font-display font-black tracking-tighter uppercase italic leading-[0.9] text-zinc-900 dark:text-white"
                >
                  SIMBA <span className="text-brand-primary">SUPERMARKET</span>
                </motion.h1>
                
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.8 }}
                  className="text-xs sm:text-sm font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 italic max-w-xl"
                >
                  {i18n.language === 'rw' 
                    ? 'Guhaza ibikenerwa byanyu bya buri munsi kuva mu 2007. Ibicuruzwa byijejwe ubuziranenge.'
                    : 'Meeting your daily requirements with Rwanda’s finest retail resurgence since 2007. Freshness guaranteed.'}
                </motion.p>
              </div>

              {/* Description */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="text-zinc-655 dark:text-zinc-300 text-xs sm:text-sm leading-relaxed max-w-xl space-y-4 font-medium"
              >
                <p>
                  {i18n.language === 'rw'
                    ? 'Kuva dushyira ku mugaragaro ishami rya mbere mu gihugu, ubu Simba imaze kugera ku mashami 11 arenga mu Rwanda. Simba Supermarket Ltd izwiho ibiciro binogeye buri wese n’ubuziranenge buhebuje mu biribwa, ibikoresho byo mu nzu, imyambaro, ibikinisho, n’isuku.'
                    : 'Since inaugurating our flagship store, Simba has stood as Rwanda’s premium retail landmark, now proudly serving you across 11 major branches. We bring clean, hand-inspected local freshness and the finest international imports directly to your basket.'}
                </p>
                <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-brand-primary opacity-90 italic">
                  ✦ {i18n.language === 'rw' ? 'Ibyo mutumije bihita bikugeraho mu minota 30 gusa!' : '⚡ Fast-track, temperature-controlled delivery across Kigali in under 30 minutes!'}
                </p>
              </motion.div>

              {/* Call to Actions - Start Shopping Button with Smooth Scroll Down */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="flex flex-col sm:flex-row gap-4 sm:gap-6 pt-4 w-full sm:max-w-md lg:max-w-none"
              >
                <button 
                  onClick={() => {
                    document.getElementById('market')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="group bg-brand-primary text-white dark:text-black hover:bg-orange-600 dark:hover:bg-orange-400 py-4 px-8 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all duration-300 transform active:scale-98 shadow-xl shadow-brand-primary/20 italic cursor-pointer btn-primary"
                  id="welcome-shop-btn"
                >
                  <ShoppingBag className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  {t('start_shopping')}
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1.5 transition-transform" />
                </button>

                <Link 
                  to="/about" 
                  className="group bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 hover:border-brand-primary/50 text-zinc-800 dark:text-white py-4 px-8 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all duration-300 transform active:scale-98 italic"
                  id="welcome-about-btn"
                >
                  <Info className="h-5 w-5 text-brand-primary" />
                  {i18n.language === 'rw' ? 'Amakuru Yacu' : 'About Simba'}
                </Link>
              </motion.div>

              {/* Quick Value Preps */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 1 }}
                className="grid grid-cols-3 gap-4 pt-8 border-t border-zinc-200 dark:border-zinc-805 max-w-xl"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-brand-primary">
                    <Clock className="h-4 w-4" />
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider">30 Min Delivery</span>
                  </div>
                  <p className="text-[8px] sm:text-[9px] font-semibold text-zinc-400 uppercase">Realtime fleet</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-brand-primary">
                    <ShieldCheck className="h-4 w-4" />
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider">Quality Pick</span>
                  </div>
                  <p className="text-[8px] sm:text-[9px] font-semibold text-zinc-400 uppercase">Double-inspected</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-brand-primary">
                    <Award className="h-4 w-4" />
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider">11 Branches</span>
                  </div>
                  <p className="text-[8px] sm:text-[9px] font-semibold text-zinc-400 uppercase">Across Rwanda</p>
                </div>
              </motion.div>

            </div>
          </div>
        </section>
      )}

      <div id="market" className="sticky top-16 sm:top-20 z-40">
        <CategoryBar 
          categories={allCategories} 
          selectedCategory={selectedCategory} 
          getCategoryLabel={getCategoryLabel}
          onSelectCategory={(cat) => {
            setSelectedCategory(cat);
            setVisibleCount(16);
            if (searchQuery) setSearchParams({});
          }} 
        />
      </div>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-20 sm:py-32 w-full relative overflow-x-hidden">
        {/* Floating background decorations */}
        <div className="absolute top-1/4 -left-32 w-64 h-64 bg-brand-primary/5 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute top-3/4 -right-32 w-64 h-64 bg-brand-accent/5 blur-[100px] rounded-full pointer-events-none" />

        {/* Best Sellers Section */}
        {!searchQuery && !selectedCategory && (
          <section className="mb-48 relative">
            <div className="absolute -top-32 -left-12 text-[15vw] font-black text-zinc-100 dark:text-zinc-900/30 select-none pointer-events-none uppercase italic tracking-tighter leading-none -z-10 opacity-70">
              Selected
            </div>
            <div className="flex items-center justify-between mb-16 px-4">
              <div className="flex items-center gap-6">
                <div className="w-3 h-12 bg-brand-primary rounded-full shadow-[0_0_20px_rgba(255,107,0,0.4)]" />
                <div>
                  <h2 className="text-5xl sm:text-8xl font-display font-black tracking-tight italic uppercase text-[var(--brand-text)] leading-none">
                    Best <span className="text-brand-primary">Sellers</span>
                  </h2>
                  <p className="micro-label !opacity-30 uppercase tracking-[0.4em] italic mt-2 ml-1">Premium items highly sought after</p>
                </div>
              </div>
              <Link to="/shop?search=best" className="group text-[10px] font-black uppercase tracking-widest text-brand-primary flex items-center gap-3 italic">
                {t('view_more')} <span className="group-hover:translate-x-2 transition-transform duration-300">→</span>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-10">
              {enrichedProducts.slice(0, 4).map((product, idx) => (
                <motion.div
                  key={`best-${product.id}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.15, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Results Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-20 px-4 gap-12">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1 bg-brand-border" />
              <span className="micro-label !text-brand-primary">SINCE 2007</span>
              <div className="h-px w-8 bg-brand-border" />
            </div>
            <h2 className="text-5xl sm:text-8xl font-display font-black tracking-tight italic uppercase leading-[0.8] text-[var(--brand-text)]">
              {searchQuery ? `${t('searching')} "${searchQuery}"` : (selectedCategory ? getCategoryLabel(selectedCategory) : t('market_aisles'))}
            </h2>
            <p className="micro-label mt-10 !opacity-60 flex items-center gap-3">
              <ShoppingBag className="h-3 w-3" />
              {t('products_found', { count: filteredProducts.length })}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={cn(
                "flex items-center gap-4 px-10 py-5 rounded-full font-black uppercase tracking-[0.2em] text-[9px] border transition-all duration-500 italic",
                isFilterOpen 
                  ? "bg-brand-primary border-brand-primary text-white dark:text-black shadow-lg shadow-brand-primary/20" 
                  : "bg-white/5 dark:bg-black/20 border-brand-border hover:border-brand-primary/50 text-[var(--brand-text)]"
              )}
            >
              <Sliders className={cn("h-4 w-4 transition-transform duration-500", isFilterOpen && "rotate-180")} />
              {isFilterOpen ? t('hide_filters') : t('advanced_filters')}
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        <AnimatePresence>
          {isFilterOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-16 mx-4"
            >
              <div className="bg-black/5 dark:bg-white/5 border border-brand-border dark:border-white/10 rounded-[40px] p-8 sm:p-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12 sm:gap-20">
                  {/* Category Filter */}
                  <div className="space-y-6">
                    <h4 className="micro-label !opacity-100 italic flex items-center gap-2">
                       <ShoppingBag className="h-3 w-3 text-brand-primary" />
                       {t('select_category')}
                    </h4>
                    <select
                      value={selectedCategory || ''}
                      onChange={(e) => setSelectedCategory(e.target.value || null)}
                      className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl py-3 px-4 text-xs font-bold focus:border-brand-primary outline-none appearance-none cursor-pointer"
                    >
                      <option value="">{t('all_categories')}</option>
                      {allCategories.map(cat => (
                        <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
                      ))}
                    </select>
                  </div>

                  {/* Price Filter */}
                  <div className="space-y-6">
                    <h4 className="micro-label !opacity-100 italic flex items-center gap-2">
                       <Filter className="h-3 w-3 text-brand-primary" />
                       {t('price_range')} (RWF)
                    </h4>
                    <div className="flex items-center gap-4">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black opacity-20">MIN</span>
                        <input 
                          type="number"
                          placeholder="0"
                          value={minPrice}
                          onChange={(e) => setMinPrice(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl py-3 pl-12 pr-4 text-xs font-bold font-mono focus:border-brand-primary outline-none"
                        />
                      </div>
                      <span className="opacity-30">—</span>
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black opacity-20">MAX</span>
                        <input 
                          type="number"
                          placeholder="∞"
                          value={maxPrice}
                          onChange={(e) => setMaxPrice(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl py-3 pl-12 pr-4 text-xs font-bold font-mono focus:border-brand-primary outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Stock Filter */}
                  <div className="space-y-6">
                    <h4 className="micro-label !opacity-100 italic flex items-center gap-2">
                       <CheckCircle2 className="h-3 w-3 text-brand-primary" />
                       {t('availability')}
                    </h4>
                    <button 
                      onClick={() => setOnlyInStock(!onlyInStock)}
                      className={cn(
                        "w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all",
                        onlyInStock ? "bg-brand-primary/10 border-brand-primary text-brand-primary" : "border-brand-border hover:border-brand-primary/30 text-zinc-500"
                      )}
                    >
                      <span className="text-xs font-black uppercase tracking-widest">{t('in_stock_only')}</span>
                      <div className={cn(
                        "h-6 w-11 rounded-full relative transition-colors",
                        onlyInStock ? "bg-brand-primary" : "bg-zinc-300 dark:bg-zinc-700"
                      )}>
                        <div className={cn(
                          "absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform",
                          onlyInStock ? "translate-x-5" : ""
                        )} />
                      </div>
                    </button>
                  </div>

                  {/* Reset Actions */}
                  <div className="flex items-end">
                    <button 
                      onClick={() => {
                        setMinPrice('');
                        setMaxPrice('');
                        setOnlyInStock(false);
                        setSelectedCategory(null);
                      }}
                      className="w-full py-4 border border-zinc-200 dark:border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-primary hover:text-white dark:hover:text-black hover:border-brand-primary transition-all text-zinc-500"
                    >
                      {t('clear_all_filters')}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Product Grid */}
        <AnimatePresence mode="popLayout">
          {displayedProducts.length > 0 ? (
            <motion.div 
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10 sm:gap-y-16"
            >
              {displayedProducts.map((product, idx) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    delay: (idx % 8) * 0.08, 
                    duration: 0.7, 
                    ease: [0.16, 1, 0.3, 1] 
                  }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-32 text-zinc-400"
            >
              <Search className="h-20 w-20 mb-6 opacity-20 text-brand-primary" />
              <p className="text-xl font-black uppercase italic tracking-widest opacity-30">{t('no_units_found')}</p>
              <button 
                onClick={() => { setSelectedCategory(null); window.history.pushState({}, '', '/'); }}
                className="mt-6 text-brand-primary font-black uppercase tracking-widest text-sm hover:underline"
              >
                {t('reset_search')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* View More Button */}
        {visibleCount < filteredProducts.length && (
          <div className="mt-16 text-center">
            <button
               onClick={loadMore}
               className="bg-black/5 dark:bg-white/5 border border-brand-border dark:border-white/10 text-[var(--brand-text)] px-12 py-5 rounded-full font-black uppercase tracking-[0.2em] hover:bg-brand-primary hover:text-white dark:hover:text-black transition-all"
            >
              {t('view_more')}
            </button>
          </div>
        )}

        {/* Community Hub Section */}
        <section className="mt-48 mb-20 px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-10"
            >
              <div className="flex items-center gap-4">
                <div className="px-4 py-2 bg-brand-primary/10 rounded-full border border-brand-primary/20 text-[8px] font-black uppercase tracking-widest text-brand-primary italic">
                  Simba Hub
                </div>
                <div className="h-px flex-1 bg-brand-border" />
              </div>
              <h2 className="text-5xl lg:text-7xl font-black uppercase italic tracking-tighter leading-[0.9] text-[var(--brand-text)]">
                JOIN THE <br /><span className="text-brand-primary">COMMUNITY</span>
              </h2>
              <p className="text-sm font-bold opacity-60 uppercase tracking-widest leading-loose italic max-w-lg">
                Exclusive drops, weekend flash nodes, and premium Kigali culinary updates. Integrated directly via MoMo notifications.
              </p>
              <div className="flex gap-4">
                <input 
                  type="email" 
                  placeholder="simba@kigali.rw" 
                  className="bg-black/5 dark:bg-white/5 border border-brand-border rounded-[24px] px-8 py-5 text-[10px] uppercase font-black italic tracking-widest outline-none focus:border-brand-primary flex-1 max-w-sm"
                />
                <button className="bg-brand-primary text-white dark:text-black font-black uppercase tracking-widest text-[10px] px-10 rounded-[24px] italic shadow-2xl shadow-brand-primary/20 hover:scale-105 transition-transform">
                  Enlist
                </button>
              </div>
            </motion.div>

            <div className="grid grid-cols-2 gap-6 relative">
              <div className="absolute inset-0 bg-brand-primary opacity-5 blur-[120px] rounded-full" />
              {[
                { label: 'Trusted By', val: '50k+', sub: 'Active Shoppers' },
                { label: 'Network', val: '12', sub: 'Kigali Branches' },
                { label: 'Logistics', val: '24/7', sub: 'Realtime Support' },
                { label: 'Response', val: '<30m', sub: 'Delivery Speed' }
              ].map((stat, i) => (
                <motion.div 
                   key={i}
                   whileHover={{ y: -5, scale: 1.05 }}
                   className="card-gradient p-10 flex flex-col justify-center text-center group"
                >
                  <p className="text-[8px] font-black uppercase tracking-[0.3em] opacity-40 mb-2">{stat.label}</p>
                  <p className="text-4xl font-black italic text-brand-primary transition-transform">{stat.val}</p>
                  <p className="text-[10px] font-bold opacity-20 uppercase tracking-tighter mt-2">{stat.sub}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <AiAssistant onSearchApplied={handleAiSearch} />
    </div>
  );
}
