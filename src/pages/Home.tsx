import { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import productsData from '../data/products.json';
import { ProductCard } from '../components/ProductCard';
import CategoryBar from '../components/CategoryBar';
import { Product } from '../types';
import { useTranslation } from 'react-i18next';
import { Search, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Home() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(16);
  
  const products = productsData.products as Product[];
  const categories = useMemo(() => {
    const rawCategories = Array.from(new Set(products.map(p => {
       const name = p.name.toLowerCase();
       // Primary Keyword Overrides for common misclassifications
       if (name.includes('tape') || name.includes('scoth') || name.includes('paper') || name.includes('pencil') || name.includes('drawing board') || name.includes('staple')) return 'Office Supplies';
       if (name.includes('oil') && !name.includes('shampoo') && !name.includes('beard')) return 'Food & Groceries';
       if (name.includes('heater') || name.includes('shovel') || name.includes('scoop') || name.includes('iron') || name.includes('pan') || name.includes('broom')) return 'Household';
       if (name.includes('dog') || name.includes('cat') || name.includes('pet')) return 'Pet Care';
       if (name.includes('milk') || name.includes('bread') || name.includes('flour') || name.includes('cake') || name.includes('meat') || name.includes('sausag') || name.includes('honey') || name.includes('salt') || name.includes('ketchup') || name.includes('mustard') || name.includes('sauce') || name.includes('mayonnaise') || name.includes('rice') || name.includes('noodle') || name.includes('spaghetti') || name.includes('sugar') || name.includes('coffee') || name.includes('tea')) return 'Food & Groceries';
       if (name.includes('wine') || name.includes('beer') || name.includes('spirit') || name.includes('vodka') || name.includes('whisky') || name.includes('gin') || name.includes('liqueur')) return 'Alcohol';
       if (name.includes('soap') || name.includes('shampoo') || name.includes('toothpaste') || name.includes('brush') || name.includes('lotion') || name.includes('deodorant') || name.includes('razor') || name.includes('gel')) return 'Personal Care';
       if (name.includes('diaper') || name.includes('wipe') || name.includes('baby') || name.includes('infant')) return 'Baby & Kids';

       // Basic Mapping
       if (p.category === 'Cosmetics & Personal Care') return 'Personal Care';
       if (p.category === 'Alcoholic Drinks') return 'Alcohol';
       if (p.category === 'Food Products') return 'Food & Groceries';
       if (p.category === 'Kitchenware & Electronics') return 'Kitchenware';
       if (p.category === 'Baby Products') return 'Baby & Kids';
       if (p.category === 'Sports & Wellness') return 'Personal Care';
       if (p.category === 'General') return 'Other';
       
       return p.category;
    })));
    return rawCategories;
  }, [products]);

  const searchQuery = searchParams.get('search')?.toLowerCase() || '';

  const filteredProducts = useMemo(() => {
    let result = products.map(p => {
       const name = p.name.toLowerCase();
       let cat = p.category;

       // Override logic
       if (name.includes('tape') || name.includes('scoth') || name.includes('paper') || name.includes('pencil') || name.includes('drawing board') || name.includes('staple')) cat = 'Office Supplies';
       else if (name.includes('oil') && !name.includes('shampoo') && !name.includes('beard')) cat = 'Food & Groceries';
       else if (name.includes('heater') || name.includes('shovel') || name.includes('scoop') || name.includes('iron') || name.includes('pan') || name.includes('broom')) cat = 'Household';
       else if (name.includes('dog') || name.includes('cat') || name.includes('pet')) cat = 'Pet Care';
       else if (name.includes('milk') || name.includes('bread') || name.includes('flour') || name.includes('cake') || name.includes('meat') || name.includes('sausag') || name.includes('honey') || name.includes('salt') || name.includes('ketchup') || name.includes('mustard') || name.includes('sauce') || name.includes('mayonnaise') || name.includes('rice') || name.includes('noodle') || name.includes('spaghetti') || name.includes('sugar') || name.includes('coffee') || name.includes('tea')) cat = 'Food & Groceries';
       else if (name.includes('wine') || name.includes('beer') || name.includes('spirit') || name.includes('vodka') || name.includes('whisky') || name.includes('gin') || name.includes('liqueur')) cat = 'Alcohol';
       else if (name.includes('soap') || name.includes('shampoo') || name.includes('toothpaste') || name.includes('brush') || name.includes('lotion') || name.includes('deodorant') || name.includes('razor') || name.includes('gel')) cat = 'Personal Care';
       else if (name.includes('diaper') || name.includes('wipe') || name.includes('baby') || name.includes('infant')) cat = 'Baby & Kids';
       else if (p.category === 'Cosmetics & Personal Care') cat = 'Personal Care';
       else if (p.category === 'Alcoholic Drinks') cat = 'Alcohol';
       else if (p.category === 'Food Products') cat = 'Food & Groceries';
       else if (p.category === 'Kitchenware & Electronics') cat = 'Kitchenware';
       else if (p.category === 'Baby Products') cat = 'Baby & Kids';
       else if (p.category === 'Sports & Wellness') cat = 'Personal Care';
       else if (p.category === 'General') cat = 'Other';

       return { ...p, category: cat };
    });

    return result.filter(product => {
      const matchesCategory = !selectedCategory || product.category === selectedCategory;
      const matchesSearch = !searchQuery || 
        product.name.toLowerCase().includes(searchQuery) || 
        product.category.toLowerCase().includes(searchQuery);
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const displayedProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount]);

  const loadMore = () => {
    setVisibleCount(prev => prev + 16);
  };

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
          categories={categories} 
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
        <div className="flex justify-between items-end mb-16 px-4">
          <div>
            <h2 className="text-4xl sm:text-6xl font-black tracking-tight italic uppercase leading-none text-[var(--brand-text)]">
              {searchQuery ? `${t('searching')} "${searchQuery}"` : (selectedCategory ? getCategoryLabel(selectedCategory) : t('market_aisles'))}
            </h2>
            <div className="h-1.5 w-32 bg-brand-primary mt-6" />
            <p className="micro-label mt-8 !opacity-60">
              {t('products_found', { count: filteredProducts.length })}
            </p>
          </div>
        </div>

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
    </div>
  );
}
