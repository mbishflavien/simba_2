import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ProductCard } from '../components/ProductCard';
import CategoryBar from '../components/CategoryBar';
import { Product } from '../types';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';
import { Search, ShoppingBag, Sliders, Filter, CheckCircle2, PackageSearch } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AiAssistant from '../components/AiAssistant';
import { AiSearchIntent } from '../services/aiService';

export default function Home() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(16);
  
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prods = snapshot.docs.map(doc => ({ ...doc.data() } as Product));
      setProducts(prods);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const allCategories = useMemo(() => {
    // Deduplicate and normalize categories
    return Array.from(new Set(products.map(p => {
      const cat = p.category?.trim();
      if (!cat) return null;
      // Normalize common synonyms to avoid duplicates
      if (cat === 'Alcohol') return 'Alcoholic Drinks';
      if (cat === 'Kitchenware') return 'Kitchenware & Electronics';
      if (cat === 'Personal Care') return 'Cosmetics & Personal Care';
      if (cat === 'Baby & Kids') return 'Baby Products';
      if (cat === 'Food & Groceries') return 'Food Products';
      return cat;
    }).filter(Boolean))).sort() as string[];
  }, [products]);

  const handleAiSearch = (intent: AiSearchIntent) => {
    // Apply filters from AI
    if (intent.category) setSelectedCategory(intent.category);
    if (intent.minPrice !== null) setMinPrice(intent.minPrice);
    if (intent.maxPrice !== null) setMaxPrice(intent.maxPrice);
    
    // Update URL for the search query
    const newParams = new URLSearchParams(searchParams);
    if (intent.searchQuery) {
      newParams.set('search', intent.searchQuery);
    } else {
      newParams.delete('search');
    }
    setSearchParams(newParams);
    
    // Open filter panel if we have price filters to show the user what happened
    if (intent.minPrice !== null || intent.maxPrice !== null) {
      setIsFilterOpen(true);
    }

    // Scroll to results
    document.getElementById('market')?.scrollIntoView({ behavior: 'smooth' });
  };

  const searchQuery = useMemo(() => 
    searchParams.get('search')?.toLowerCase() || ''
  , [searchParams]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      if (selectedCategory && product.category !== selectedCategory) return false;
      
      if (searchQuery) {
        const keywords = searchQuery.split(/\s+/).filter(k => k.length > 0);
        const name = product.name?.toLowerCase() || '';
        const category = product.category?.toLowerCase() || '';
        
        // Expand keywords with synonyms
        const expandedKeywords = keywords.flatMap(k => {
          if (k === 'liquor' || k === 'wine' || k === 'beer' || k === 'whiskey') return [k, 'alcohol'];
          if (k === 'food' || k === 'grocery') return [k, 'groceries'];
          if (k === 'gym' || k === 'fitness') return [k, 'sports', 'wellness'];
          return [k];
        });

        const matchesAny = expandedKeywords.some(keyword => name.includes(keyword) || category.includes(keyword));
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
        <section className="relative h-[70vh] sm:h-[85vh] flex items-center justify-center overflow-hidden">
          {/* Background Image with Overlay */}
          <div className="absolute inset-0 z-0">
            <img 
              src="https://ecommercenews.eu/wp-content/uploads/2021/06/groceries_supermarket_food.jpg" 
              alt="Supermarket" 
              className="w-full h-full object-cover grayscale-[30%] opacity-40 scale-105"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--brand-bg)]/80 to-[var(--brand-bg)]" />
          </div>

          <div className="max-w-7xl mx-auto px-4 z-10 w-full">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-3xl text-center mx-auto"
            >
              <div className="mb-8 inline-flex items-center gap-4 bg-white/5 backdrop-blur-xl border border-white/10 px-6 py-2.5 rounded-full">
                 <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
                 <span className="micro-label !text-brand-primary !opacity-100">
                    {t('kigali_marketplace')}
                 </span>
              </div>
              <h1 className="massive-header text-[var(--brand-text)]">
                {t('curated')}<br/><span className="text-brand-primary">{t('freshness')}</span>
              </h1>
              <p className="text-[var(--brand-text)] opacity-40 text-xs sm:text-base font-bold italic uppercase tracking-[0.3em] mb-12 max-w-xl mx-auto">
                {t('hero_description')}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-6">
                <button 
                  onClick={() => {
                     document.getElementById('market')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="btn-primary scale-110"
                >
                  {t('start_shopping')}
                </button>
              </div>
            </motion.div>
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

      <main className="flex-1 max-w-7xl mx-auto px-4 py-20 sm:py-32 w-full relative">
        {/* Floating background decorations */}
        <div className="absolute top-1/4 -left-64 w-96 h-96 bg-brand-primary/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-3/4 -right-64 w-96 h-96 bg-brand-accent/5 blur-[120px] rounded-full pointer-events-none" />

        {/* Best Sellers Section (Only on main home) */}
        {!searchQuery && !selectedCategory && (
          <section className="mb-32">
            <div className="flex items-center justify-between mb-12 px-4">
              <div className="flex items-center gap-4">
                <div className="w-2 h-10 bg-brand-primary rounded-full" />
                <h2 className="text-4xl sm:text-6xl font-display font-black tracking-tight italic uppercase text-[var(--brand-text)]">
                  {t('best_selling')}<span className="text-brand-primary">.</span>
                </h2>
              </div>
              <Link to="/?search=best" className="text-[10px] font-black uppercase tracking-widest text-brand-primary hover:gap-3 transition-all flex items-center gap-2 italic">
                {t('view_more')} <span>→</span>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {products.slice(0, 4).map((product, idx) => (
                <motion.div
                  key={`best-${product.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 sm:gap-20">
                  {/* Price Filter */}
                  <div className="space-y-6">
                    <h4 className="micro-label !opacity-100 italic flex items-center gap-2">
                       <Filter className="h-3 w-3 text-brand-primary" />
                       {t('price_range')} (RWF)
                    </h4>
                    <div className="flex items-center gap-4">
                      <input 
                        type="number"
                        placeholder="Min"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl py-3 px-4 text-xs font-bold font-mono focus:border-brand-primary outline-none"
                      />
                      <span className="opacity-30">—</span>
                      <input 
                        type="number"
                        placeholder="Max"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl py-3 px-4 text-xs font-bold font-mono focus:border-brand-primary outline-none"
                      />
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
                      }}
                      className="w-full py-4 border border-zinc-200 dark:border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-100 dark:hover:bg-white/5 transition-all text-zinc-500"
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
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12 sm:gap-y-20"
            >
              {displayedProducts.map((product, idx) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (idx % 4) * 0.1, duration: 0.5 }}
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

        {/* Home CTA Section */}
        <section className="mt-48 mb-20 px-4">
           <div className="bg-brand-primary p-12 sm:p-24 rounded-[80px] relative overflow-hidden group shadow-2xl shadow-brand-primary/20">
              <div className="absolute top-0 right-0 p-32 opacity-10 group-hover:scale-110 transition-transform duration-1000 pointer-events-none">
                 <ShoppingBag className="h-96 w-96 text-white dark:text-black" />
              </div>
              <div className="relative z-10 max-w-2xl text-left">
                  <div className="mb-8 inline-flex items-center gap-3 micro-label !text-zinc-950 dark:text-white bg-black/10 px-4 py-2 rounded-full">
                    {t('premium_quality')}
                  </div>
                  <h2 className="text-5xl sm:text-[100px] font-display font-black italic uppercase tracking-tighter text-zinc-950 dark:text-white mb-10 leading-[0.8]">
                    {t('cta_title')}
                  </h2>
                  <p className="text-zinc-950/70 dark:text-white/80 font-bold uppercase tracking-[0.25em] italic mb-16 text-sm sm:text-base leading-snug max-w-lg">
                    {t('cta_desc')}
                  </p>
                  <div className="flex flex-wrap items-center gap-10">
                    <button 
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      className="bg-zinc-950 dark:bg-white text-white dark:text-brand-primary px-16 py-6 rounded-full font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-black dark:hover:bg-zinc-100 transition-all text-xs italic active:scale-95"
                    >
                      {t('shop_all')}
                    </button>
                    <Link 
                      to="/about"
                      className="inline-flex items-center gap-3 text-zinc-950 dark:text-white font-black uppercase tracking-widest text-[10px] italic hover:gap-5 transition-all group/link"
                    >
                      {t('about_simba')} <span className="group-hover:translate-x-2 transition-transform">→</span>
                    </Link>
                  </div>
              </div>
           </div>
        </section>
      </main>
      <AiAssistant onSearchApplied={handleAiSearch} />
    </div>
  );
}
