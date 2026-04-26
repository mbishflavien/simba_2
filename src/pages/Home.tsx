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
    return Array.from(new Set(products.map(p => p.category))).sort();
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
        const name = product.name.toLowerCase();
        const category = product.category.toLowerCase();
        const matchesAny = keywords.some(keyword => name.includes(keyword) || category.includes(keyword));
        if (!matchesAny) return false;
      }
      
      if (minPrice !== '' && product.price < minPrice) return false;
      if (maxPrice !== '' && product.price > maxPrice) return false;
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
    const map: Record<string, string> = {
       'Food & Groceries': t('cat_food'),
       'Household': t('cat_household'),
       'Alcohol': t('cat_alcohol'),
       'Baby & Kids': t('cat_baby'),
       'Personal Care': t('cat_personal'),
       'Kitchenware': t('cat_kitchen'),
       'Office Supplies': t('cat_office'),
       'Pet Care': t('cat_pet'),
       'Other': t('cat_other')
    };
    return map[cat] || cat;
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      {!searchQuery && !selectedCategory && (
        <section className="relative h-[60vh] sm:h-[80vh] flex items-center justify-center overflow-hidden border-b border-brand-border">
          {/* Background Image with Overlay */}
          <div className="absolute inset-0 z-0">
            <img 
              src="https://ecommercenews.eu/wp-content/uploads/2021/06/groceries_supermarket_food.jpg" 
              alt="Supermarket" 
              className="w-full h-full object-cover grayscale-[20%] dark:grayscale-[60%] transition-all duration-700"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent dark:from-black/90 dark:via-black/60 dark:to-transparent" />
          </div>

          <div className="max-w-7xl mx-auto px-4 z-10 w-full">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              className="max-w-2xl text-left"
            >
              <div className="mb-6 inline-block">
                 <span className="micro-label bg-brand-primary/10 border border-brand-primary/30 px-4 py-2 rounded-full text-brand-primary !opacity-100 italic">
                    {t('kigali_marketplace')}
                 </span>
              </div>
              <h1 className="massive-header mb-8 text-white">
                {t('curated')}<br/><span className="text-brand-primary">{t('freshness')}</span>
              </h1>
              <p className="text-white/70 text-xs sm:text-base font-bold italic uppercase tracking-[0.2em] mb-12 drop-shadow-lg">
                {t('hero_description')}
              </p>
              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={() => {
                     document.getElementById('market')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="bg-brand-primary text-white dark:text-black px-12 py-5 rounded-full font-black uppercase tracking-widest hover:bg-orange-600 dark:hover:bg-orange-400 transition-all shadow-2xl shadow-brand-primary/40 active:scale-95 italic"
                >
                  {t('start_shopping')}
                </button>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      <div id="market">
        <CategoryBar 
          categories={allCategories} 
          selectedCategory={selectedCategory} 
          getCategoryLabel={getCategoryLabel}
          onSelectCategory={(cat) => {
            setSelectedCategory(cat);
            setVisibleCount(16);
          }} 
        />
      </div>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-16 sm:py-24 w-full">
        {/* Results Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-16 px-4 gap-8">
          <div>
            <h2 className="text-4xl sm:text-6xl font-black tracking-tight italic uppercase leading-none text-[var(--brand-text)]">
              {searchQuery ? `${t('searching')} "${searchQuery}"` : (selectedCategory ? getCategoryLabel(selectedCategory) : t('market_aisles'))}
            </h2>
            <div className="h-1.5 w-32 bg-brand-primary mt-6" />
            <p className="micro-label mt-8 !opacity-60">
              {t('products_found', { count: filteredProducts.length })}
            </p>
          </div>
          
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={cn(
              "flex items-center gap-3 px-8 py-4 rounded-full font-black uppercase tracking-widest text-[10px] border-2 transition-all",
              isFilterOpen ? "bg-brand-primary border-brand-primary text-white dark:text-black" : "border-zinc-200 dark:border-white/10 hover:border-brand-primary/50"
            )}
          >
            <Sliders className="h-4 w-4" />
            {isFilterOpen ? t('hide_filters') : t('advanced_filters')}
          </button>
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
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8"
            >
              {displayedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
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
        <section className="mt-32">
           <div className="bg-brand-primary p-12 sm:p-24 rounded-[60px] relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-24 opacity-10 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                 <ShoppingBag className="h-64 w-64 text-white dark:text-black" />
              </div>
              <div className="relative z-10 max-w-2xl text-left">
                  <h2 className="text-5xl sm:text-7xl font-black italic uppercase tracking-tighter text-zinc-950 dark:text-white mb-8">
                    {t('cta_title')}
                  </h2>
                  <p className="text-zinc-950/80 dark:text-white/90 font-bold uppercase tracking-widest italic mb-12 text-sm sm:text-base leading-relaxed">
                    {t('cta_desc')}
                  </p>
                  <div className="flex flex-wrap gap-6">
                    <button 
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      className="bg-zinc-900 dark:bg-white text-white dark:text-brand-primary px-12 py-5 rounded-full font-black uppercase tracking-widest shadow-2xl hover:bg-black dark:hover:bg-zinc-100 transition-all text-xs italic active:scale-95"
                    >
                      {t('shop_now')}
                    </button>
                    <Link 
                      to="/about"
                      className="inline-flex items-center gap-2 text-zinc-900 dark:text-white font-black uppercase tracking-widest text-xs italic hover:underline"
                    >
                      {t('about_simba')} →
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
