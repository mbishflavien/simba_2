import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, Menu, X, Globe, Moon, Sun } from 'lucide-react';
import { useCart } from '../hooks/useCart';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useMemo } from 'react';
import productsData from '../data/products.json';
import { Product } from '../types';

export default function Navbar() {
  const { totalItems } = useCart();
  const { t, i18n } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const products = productsData.products as Product[];

  const suggestions = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return [];
    
    const query = searchQuery.toLowerCase();
    
    // Extract unique categories first
    const categories = Array.from(new Set(products.map(p => p.category)));
    
    const matchingCategories = categories
      .filter(cat => cat.toLowerCase().includes(query))
      .map(cat => ({ type: 'category' as const, value: cat }));

    const matchingProducts = products
      .filter(p => p.name.toLowerCase().includes(query))
      .slice(0, 5)
      .map(p => ({ type: 'product' as const, value: p.name, id: p.id }));

    return [...matchingCategories, ...matchingProducts].slice(0, 8);
  }, [searchQuery, products]);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      return saved ? saved === 'dark' : true; // Default to dark as per aggressive bold theme
    }
    return true;
  });
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('form')) {
        setShowSuggestions(false);
      }
    };
    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSuggestions]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${searchQuery}`);
      setIsSearchOpen(false);
    }
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const languages = [
    { code: 'en', label: 'EN' },
    { code: 'fr', label: 'FR' },
    { code: 'rw', label: 'RW' },
  ];

  return (
    <nav className="nav-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-4 group">
            <div className="relative">
              <img 
                src="https://isokko.com/m/media/upload/photos/2024/10/Untitleddesign6_6712450111ff0.png" 
                alt="Simba Logo" 
                className="h-10 sm:h-14 w-auto object-contain dark:brightness-110 group-hover:scale-105 transition-transform"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-black text-2xl sm:text-3xl tracking-tighter uppercase italic text-[var(--brand-text)] leading-[0.8]">
                SIMBA
              </span>
              <span className="text-brand-primary font-black text-[9px] tracking-[0.4em] uppercase leading-none ml-1">
                SUPERMARKET
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <form onSubmit={handleSearch} className="relative group flex items-center">
              <Search className="absolute left-6 h-5 w-5 text-zinc-500 dark:text-white/30 group-focus-within:text-brand-primary transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                placeholder={t('search_placeholder')}
                className="w-80 bg-white dark:bg-zinc-900 border-2 border-zinc-300 dark:border-white/10 rounded-full py-3 pl-14 pr-16 text-sm font-bold uppercase tracking-tight focus:outline-none focus:border-brand-primary focus:ring-8 focus:ring-brand-primary/5 transition-all placeholder:text-zinc-500 dark:placeholder:text-white/20 text-black dark:text-white shadow-xl group-hover:border-zinc-400 dark:group-hover:border-white/20 italic"
              />
              {searchQuery && (
                <button 
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setShowSuggestions(false);
                    navigate('/');
                  }}
                  className="absolute right-12 top-1/2 -translate-y-1/2 text-black/50 dark:text-white/30 hover:text-brand-primary transition-colors p-2"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
              <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-black/40 dark:text-white/20 tracking-tighter uppercase border border-zinc-300 dark:border-white/10 px-2 py-1 rounded pointer-events-none hidden lg:block">⌘K</div>
              
              {/* Desktop Suggestions */}
              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 py-2"
                  >
                    <div className="px-4 py-2 border-b border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-white/5">
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 italic">{t('suggestions')}</span>
                    </div>
                    {suggestions.map((s, idx) => (
                      <button
                        key={`${s.type}-${idx}`}
                        type="button"
                        onClick={() => {
                          setSearchQuery(s.value);
                          setShowSuggestions(false);
                          navigate(`/?search=${s.value}`);
                        }}
                        className="w-full text-left px-6 py-3 hover:bg-brand-primary/10 dark:hover:bg-brand-primary/20 transition-colors flex items-center justify-between group"
                      >
                        <span className="text-xs font-bold uppercase tracking-tight italic dark:text-white truncate max-w-[200px]">
                          {s.value}
                        </span>
                        <span className="text-[8px] font-black uppercase tracking-widest text-brand-primary opacity-0 group-hover:opacity-100 transition-opacity">
                          {s.type === 'category' ? t('category') : t('product')}
                        </span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </form>

            <button 
              onClick={() => setIsDark(!isDark)}
              className="p-2.5 bg-black/5 dark:bg-white/5 border border-brand-border dark:border-white/10 rounded-full hover:text-brand-primary transition-all group"
            >
              {isDark ? <Sun className="h-4 w-4 text-brand-accent group-hover:scale-110 transition-transform" /> : <Moon className="h-4 w-4 text-black/40 group-hover:scale-110 transition-transform" />}
            </button>

            <div className="flex gap-4 micro-label">
              <Link to="/about" className="mr-4 hover:text-brand-primary transition-colors text-[var(--brand-text)] opacity-60 font-black">{t('about_us')}</Link>
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={cn(
                    "cursor-pointer transition-colors hover:text-brand-primary",
                    i18n.language === lang.code ? "text-brand-primary italic border-b border-brand-primary" : ""
                  )}
                >
                  {lang.label}
                </button>
              ))}
            </div>

            <motion.div
              key={totalItems}
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.3 }}
            >
              <Link to="/cart" className="bg-brand-primary text-white dark:text-black px-6 py-2.5 rounded-full font-black text-xs flex items-center gap-3 cursor-pointer hover:bg-orange-600 dark:hover:bg-orange-400 transition-all uppercase tracking-widest leading-none shadow-lg shadow-brand-primary/20">
                {t('cart')} ({totalItems})
              </Link>
            </motion.div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-4">
            <button 
              onClick={() => setIsDark(!isDark)}
              className="p-2 bg-black/5 dark:bg-zinc-800 rounded-full"
            >
              {isDark ? <Sun className="h-5 w-5 text-brand-accent" /> : <Moon className="h-5 w-5 text-black/40" />}
            </button>
            <button onClick={() => setIsSearchOpen(true)} className="p-2 text-[var(--brand-text)]">
              <Search className="h-6 w-6" />
            </button>
            <Link to="/cart" className="relative text-[var(--brand-text)]">
              <motion.div
                key={totalItems}
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.3 }}
              >
                <ShoppingCart className="h-6 w-6" />
                {totalItems > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 bg-brand-primary text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center"
                  >
                    {totalItems}
                  </motion.span>
                )}
              </motion.div>
            </Link>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-[var(--brand-text)]">
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute inset-0 bg-[var(--brand-card)] z-[60] flex items-center px-4 shadow-2xl"
          >
            <form onSubmit={handleSearch} className="flex-1 flex gap-3 items-center">
              <div className="flex-1 relative flex items-center">
                <Search className="absolute left-4 h-5 w-5 text-brand-primary" />
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onFocus={() => setShowSuggestions(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  placeholder={t('search_placeholder')}
                  className="w-full bg-white dark:bg-zinc-900 border-2 border-zinc-300 dark:border-transparent focus:border-brand-primary rounded-2xl py-4 pl-14 pr-4 focus:ring-8 focus:ring-brand-primary/10 outline-none text-black dark:text-white font-black italic uppercase tracking-tight transition-all placeholder:text-zinc-500 dark:placeholder:text-white/20 shadow-xl"
                />
                
                {/* Mobile Suggestions Overlay */}
                <AnimatePresence>
                  {showSuggestions && suggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute top-full left-0 right-12 mt-4 bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-white/5 py-2 max-h-[60vh] overflow-y-auto"
                    >
                      {suggestions.map((s, idx) => (
                        <button
                          key={`mobile-${s.type}-${idx}`}
                          type="button"
                          onClick={() => {
                            setSearchQuery(s.value);
                            setShowSuggestions(false);
                            setIsSearchOpen(false);
                            navigate(`/?search=${s.value}`);
                          }}
                          className="w-full text-left px-6 py-4 hover:bg-brand-primary/10 transition-colors flex items-center justify-between border-b border-zinc-100 dark:border-white/5 last:border-0"
                        >
                          <span className="text-sm font-bold uppercase tracking-tight italic dark:text-white truncate">
                            {s.value}
                          </span>
                          <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest">{s.type === 'category' ? t('cat_short') : t('prod_short')}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button type="button" onClick={() => setIsSearchOpen(false)} className="p-2 text-[var(--brand-text)] hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
                <X className="h-6 w-6" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-[var(--brand-bg)] border-t border-brand-border overflow-hidden"
          >
            <div className="px-4 py-6 space-y-6">
              <div className="flex flex-col gap-4">
                 <Link 
                   to="/about" 
                   onClick={() => setIsMenuOpen(false)}
                   className="text-2xl font-black italic uppercase tracking-tighter text-[var(--brand-text)] hover:text-brand-primary transition-colors"
                 >
                   {t('about_us')}
                 </Link>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      changeLanguage(lang.code);
                      setIsMenuOpen(false);
                    }}
                    className={cn(
                      "py-3 px-4 rounded-xl text-center font-black italic uppercase tracking-widest text-[10px]",
                      i18n.language === lang.code ? "bg-brand-primary text-white dark:text-black" : "bg-black/5 dark:bg-white/5 text-[var(--brand-text-muted)]"
                    )}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
