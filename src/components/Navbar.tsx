import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, ShoppingCart, Search, Menu, X, Globe, Moon, Sun, User as UserIcon, LogOut, Zap, Heart, ChevronDown, Home, Info, ChevronRight } from 'lucide-react';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';
import { useAuth } from './AuthProvider';
import { useTranslation } from 'react-i18next';
import { auth } from '../lib/firebase';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useMemo } from 'react';
import { get789Products } from '../services/catalogLoader';
import { Product } from '../types';

export default function Navbar() {
  const { totalItems } = useCart();
  const { user, profile } = useAuth();
  const { t, i18n } = useTranslation();
  const { setIsOpen: setIsWishlistOpen, wishlistIds } = useWishlist();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isDesktopLangOpen, setIsDesktopLangOpen] = useState(false);
  const [isMobileLangOpen, setIsMobileLangOpen] = useState(false);
  
  const products = get789Products();


  const handleSignOut = () => {
    auth.signOut();
    navigate('/');
  };

  const suggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase().trim();
    
    // Extract unique categories first (filter out any undefined/null)
    const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean))) as string[];
    
    const matchingCategories = categories
      .filter(cat => {
        const lowerCat = cat.toLowerCase();
        if (lowerCat.includes(query)) return true;
        
        // Category synonyms
        if (query === 'liquor' || query === 'alcohol' || query === 'beer' || query === 'wine' || query === 'whiskey') {
          return lowerCat.includes('alcohol');
        }
        if (query === 'skincare' || query === 'beauty' || query === 'soap') {
          return lowerCat.includes('cosmetics') || lowerCat.includes('personal care');
        }
        if (query === 'gym' || query === 'fitness' || query === 'health') {
          return lowerCat.includes('sports') || lowerCat.includes('wellness');
        }
        
        return false;
      })
      .map(cat => ({ type: 'category' as const, value: cat }));

    // Product suggestions usually need a bit more context if there are many
    const matchingProducts = products
      .filter(p => p.name.toLowerCase().includes(query))
      .filter(p => !categories.some(cat => cat.toLowerCase() === p.name.toLowerCase())) // Avoid duplicate names if they exist as categories
      .slice(0, 5)
      .map(p => ({ type: 'product' as const, value: p.name, id: p.id }));

    // Re-order to show categories first if it's a short query, then products
    const combined = [...matchingCategories, ...matchingProducts];
    
    return combined.slice(0, 8);
  }, [searchQuery, products]);

  const [activeIndex, setActiveIndex] = useState(-1);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev + 1) % (suggestions.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev - 1 + (suggestions.length || 1)) % (suggestions.length || 1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      const s = suggestions[activeIndex];
      if (s) {
        setSearchQuery(s.value);
        setShowSuggestions(false);
        navigate(`/shop?search=${s.value}`);
      }
    }
  };

  useEffect(() => {
    setActiveIndex(-1);
  }, [searchQuery]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isInputFocused = document.activeElement && ['input', 'textarea', 'select'].includes(document.activeElement.tagName.toLowerCase());
      if (isInputFocused) return;

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const firstSearchInput = document.querySelector('input[placeholder*="Search"]') || document.querySelector('input[placeholder*="search"]') || document.querySelector('input[type="text"]');
        if (firstSearchInput) {
          (firstSearchInput as HTMLInputElement).focus();
          setShowSuggestions(true);
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);
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
      navigate(`/shop?search=${searchQuery}`);
      setIsSearchOpen(false);
    }
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const languages = [
    { code: 'en', label: 'English', short: 'EN' },
    { code: 'fr', label: 'Français', short: 'FR' },
    { code: 'rw', label: 'Kinyarwanda', short: 'RW' },
  ];

  return (
    <>
      <nav className="nav-blur sticky top-0 z-[100]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-24">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 sm:gap-4 group shrink-0">
            <div className="relative">
              <img 
                src="https://isokko.com/m/media/upload/photos/2024/10/Untitleddesign6_6712450111ff0.png" 
                alt="Simba Logo" 
                className="h-10 sm:h-14 w-auto object-contain dark:brightness-110 group-hover:scale-105 transition-transform"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-black text-xl sm:text-3xl tracking-tighter uppercase italic text-[var(--brand-text)] leading-[0.8]">
                SIMBA
              </span>
              <span className="text-brand-primary font-black text-[7px] sm:text-[9px] tracking-[0.4em] uppercase leading-none ml-0.5 sm:ml-1">
                SUPERMARKET
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden xl:flex items-center gap-2 xl:gap-8 min-w-0">
            <form onSubmit={handleSearch} className="relative group flex items-center flex-1 max-w-[200px] xl:max-w-xs transition-all">
              <Search className="absolute left-6 h-5 w-5 text-zinc-500 dark:text-white/30 group-focus-within:text-brand-primary transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onKeyDown={handleKeyDown}
                placeholder={t('search_placeholder')}
                className="w-full bg-white dark:bg-zinc-900 border-2 border-zinc-300 dark:border-white/10 rounded-full py-3 pl-14 pr-16 text-xs xl:text-sm font-bold uppercase tracking-tight focus:outline-none focus:border-brand-primary focus:ring-8 focus:ring-brand-primary/5 transition-all placeholder:text-zinc-400 dark:placeholder:text-white/20 text-black dark:text-white shadow-xl group-hover:border-zinc-400 dark:group-hover:border-white/20 italic"
              />
              {searchQuery && (
                <button 
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setShowSuggestions(false);
                    navigate('/shop');
                  }}
                  className="absolute right-12 top-1/2 -translate-y-1/2 text-black/50 dark:text-white/30 hover:text-brand-primary transition-colors p-2"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
              <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-black/40 dark:text-white/20 tracking-tighter uppercase border border-zinc-300 dark:border-white/10 px-2 py-1 rounded pointer-events-none hidden xl:block">⌘K</div>
              
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
                          navigate(`/shop?search=${s.value}`);
                        }}
                        onMouseEnter={() => setActiveIndex(idx)}
                        className={cn(
                          "w-full text-left px-6 py-3 transition-colors flex items-center justify-between group",
                          activeIndex === idx ? "bg-brand-primary/10 dark:bg-brand-primary/20" : "hover:bg-zinc-50 dark:hover:bg-white/5"
                        )}
                      >
                        <span className={cn(
                          "text-xs font-bold uppercase tracking-tight italic truncate max-w-[200px]",
                          activeIndex === idx ? "text-brand-primary" : "dark:text-white"
                        )}>
                          {s.value}
                        </span>
                        <span className={cn(
                          "text-[8px] font-black uppercase tracking-widest text-brand-primary transition-opacity",
                          activeIndex === idx ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        )}>
                          {s.type === 'category' ? t('category') : t('product')}
                        </span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </form>

            <button 
              onClick={() => setIsWishlistOpen(true)}
              className="relative p-2.5 bg-black/5 dark:bg-white/5 border border-brand-border dark:border-white/10 rounded-full hover:text-brand-primary transition-all group text-zinc-800 dark:text-zinc-200"
              title={t('my_wishlist', 'My Wishlist')}
              id="desktop-wishlist-toggle"
            >
              <Heart className="h-4 w-4 text-zinc-500 dark:text-zinc-400 group-hover:scale-110 group-hover:text-rose-500 transition-all" />
              {wishlistIds.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-zinc-100 dark:border-zinc-900 shadow-md">
                  {wishlistIds.length}
                </span>
              )}
            </button>

            <button 
              onClick={() => setIsDark(!isDark)}
              className="p-2.5 bg-black/5 dark:bg-white/5 border border-brand-border dark:border-white/10 rounded-full hover:text-brand-primary transition-all group"
            >
              {isDark ? <Sun className="h-4 w-4 text-brand-accent group-hover:scale-110 transition-transform" /> : <Moon className="h-4 w-4 text-black/40 group-hover:scale-110 transition-transform" />}
            </button>

            <div className="flex items-center gap-3 xl:gap-8 micro-label">
              <Link to="/shop" className="hover:text-brand-primary transition-colors text-zinc-800 dark:text-zinc-200 font-black tracking-widest uppercase">{t('shop') || 'Shop'}</Link>
              <Link to="/about" className="hover:text-brand-primary transition-colors text-zinc-850 dark:text-zinc-200 font-black tracking-widest uppercase">{t('about_us')}</Link>
              
              {profile?.isAdmin && (
                <Link 
                  to="/admin" 
                  className="mr-2 px-4 py-1.5 bg-brand-primary text-white dark:text-black rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all flex items-center gap-2 shadow-lg shadow-brand-primary/20 rotate-1 hover:rotate-0"
                >
                  <Zap className="h-3 w-3" />
                  {t('admin_hub')}
                </Link>
              )}

              {user ? (
                <div className="flex items-center gap-4">
                  <Link 
                    to="/profile"
                    className="text-brand-primary font-black italic uppercase tracking-widest text-[10px] hover:scale-105 transition-transform"
                  >
                    {profile?.displayName || user.email?.split('@')[0]}
                  </Link>
                  <button 
                    onClick={handleSignOut}
                    className="hover:text-brand-primary transition-colors text-zinc-500"
                    title={t('logout')}
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <Link to="/login" className="flex items-center gap-2 hover:text-brand-primary transition-colors text-[var(--brand-text)] opacity-60 font-black uppercase tracking-widest">
                  <UserIcon className="h-4 w-4" />
                  {t('login')}
                </Link>
              )}

              {/* Desktop Language Selector Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDesktopLangOpen(!isDesktopLangOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-black/5 dark:bg-white/5 border border-brand-border dark:border-white/10 rounded-full hover:text-brand-primary font-black uppercase tracking-wider text-[10px] transition-all cursor-pointer"
                >
                  <Globe className="h-3.5 w-3.5 text-zinc-500" />
                  <span>{languages.find(l => l.code === i18n.language)?.short || i18n.language.toUpperCase()}</span>
                  <ChevronDown className={cn("h-3 w-3 text-zinc-400 transition-transform", isDesktopLangOpen && "rotate-180")} />
                </button>
                <AnimatePresence>
                  {isDesktopLangOpen && (
                    <>
                      {/* Clicking outside closes the dropdown list */}
                      <div className="fixed inset-0 z-40 cursor-default" onClick={() => setIsDesktopLangOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className="absolute right-0 mt-2 w-36 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl z-50 py-1 overflow-hidden"
                      >
                        {languages.map((lang) => (
                          <button
                            key={lang.code}
                            type="button"
                            onClick={() => {
                              changeLanguage(lang.code);
                              setIsDesktopLangOpen(false);
                            }}
                            className={cn(
                              "w-full text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest hover:bg-black/5 dark:hover:bg-white/5 flex justify-between items-center transition-colors cursor-pointer",
                              i18n.language === lang.code ? "text-brand-primary italic bg-brand-primary/5" : "text-zinc-700 dark:text-zinc-300"
                            )}
                          >
                            <span>{lang.label}</span>
                            <span className="opacity-40 text-[8px]">{lang.short}</span>
                          </button>
                        ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <motion.div
              key={totalItems}
              initial={{ scale: 1 }}
              animate={totalItems > 0 ? { scale: [1, 1.25, 0.9, 1] } : { scale: 1 }}
              transition={{ 
                duration: 0.4,
                times: [0, 0.4, 0.7, 1],
                ease: "easeOut"
              }}
            >
              <Link to="/cart" className="bg-brand-primary text-white dark:text-black px-6 py-2.5 rounded-full font-black text-xs flex items-center gap-3 cursor-pointer hover:bg-orange-600 dark:hover:bg-orange-400 transition-all uppercase tracking-widest leading-none shadow-lg shadow-brand-primary/20">
                {t('cart')} 
                <motion.span
                  key={`count-${totalItems}`}
                  initial={{ y: 5, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="bg-black/20 dark:bg-black/10 px-2 py-0.5 rounded-md"
                >
                  {totalItems}
                </motion.span>
              </Link>
            </motion.div>
          </div>

          {/* Mobile Buttons */}
          <div className="flex xl:hidden items-center gap-2 sm:gap-4">
            <button 
              onClick={() => setIsSearchOpen(true)} 
              className="p-2 sm:p-3 text-zinc-800 dark:text-white bg-zinc-100/90 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-full hover:scale-110 active:scale-95 transition-all shadow-md"
              aria-label="Search"
            >
              <Search className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
            <button 
              onClick={() => setIsWishlistOpen(true)} 
              className="relative text-zinc-800 dark:text-white bg-zinc-100/90 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 p-2 sm:p-3 rounded-full hover:scale-110 active:scale-95 transition-all shadow-md flex items-center justify-center"
              aria-label={t('my_wishlist', 'Wishlist')}
              id="mobile-wishlist-toggle"
            >
              <Heart className="h-5 w-5 sm:h-6 sm:w-6 text-rose-500" />
              {wishlistIds.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-zinc-100 dark:border-zinc-900 shadow-md">
                  {wishlistIds.length}
                </span>
              )}
            </button>
            <Link to="/cart" className="relative text-zinc-800 dark:text-white bg-zinc-100/90 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 p-2 sm:p-3 rounded-full hover:scale-110 active:scale-95 transition-all shadow-md flex items-center justify-center">
              <motion.div
                key={totalItems}
                initial={{ scale: 1 }}
                animate={totalItems > 0 ? { scale: [1, 1.4, 0.8, 1] } : { scale: 1 }}
                transition={{ 
                  duration: 0.5,
                  times: [0, 0.4, 0.8, 1],
                  ease: "backOut"
                }}
              >
                <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />
                {totalItems > 0 && (
                  <motion.span 
                    key={`badge-${totalItems}`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-brand-primary text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-zinc-100 dark:border-zinc-900 shadow-md"
                  >
                    {totalItems}
                  </motion.span>
                )}
              </motion.div>
            </Link>
            <button 
              onClick={() => setIsMenuOpen(true)} 
              className="p-2 sm:p-3 text-brand-primary bg-zinc-100/95 dark:bg-zinc-900/95 border-2 border-brand-primary hover:border-brand-primary/80 rounded-full hover:scale-110 active:scale-95 transition-all shadow-md"
              aria-label="Menu"
            >
              <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </div>
        </div>
      </div>
    </nav>

      {/* Mobile Search Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-md xl:hidden"
          >
            <motion.div
              initial={{ y: -50 }}
              animate={{ y: 0 }}
              exit={{ y: -50 }}
              className="bg-[var(--brand-bg)] p-6 pt-12 shadow-2xl rounded-b-[40px]"
            >
              <div className="flex gap-4 items-center mb-6">
                <button onClick={() => setIsSearchOpen(false)} className="p-2 text-zinc-500">
                  <X className="h-6 w-6" />
                </button>
                <h2 className="text-xl font-black italic uppercase tracking-tighter text-[var(--brand-text)]">
                  {t('search_products')}
                </h2>
              </div>
              <form onSubmit={handleSearch} className="relative flex items-center mb-8">
                <Search className="absolute left-6 h-5 w-5 text-brand-primary" />
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onFocus={() => setShowSuggestions(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={t('search_placeholder')}
                  className="w-full bg-black/5 dark:bg-white/5 border-2 border-transparent focus:border-brand-primary rounded-full py-4 pl-14 pr-4 transition-all text-black dark:text-white font-bold italic uppercase tracking-tight"
                />
              </form>
              
              {/* Mobile Recent Categories / Suggestions */}
              <div className="space-y-4 max-h-[50vh] overflow-y-auto custom-scrollbar pb-8">
                {suggestions.length > 0 ? (
                  suggestions.map((s, idx) => (
                    <button
                      key={`mobile-search-${idx}`}
                      onClick={() => {
                        setSearchQuery(s.value);
                        setShowSuggestions(false);
                        setIsSearchOpen(false);
                        navigate(`/shop?search=${s.value}`);
                      }}
                      className="w-full text-left p-4 rounded-2xl bg-black/5 dark:bg-white/5 flex justify-between items-center group active:scale-[0.98] transition-all"
                    >
                      <span className="font-bold uppercase italic tracking-tight text-sm dark:text-white opacity-80 group-hover:opacity-100">{s.value}</span>
                      <span className="text-[9px] font-black text-brand-primary uppercase tracking-widest">{s.type === 'category' ? t('category') : t('product')}</span>
                    </button>
                  ))
                ) : (
                  <p className="text-center text-xs font-bold uppercase italic opacity-30 py-8 tracking-widest">
                    {t('start_typing_to_search')}
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Right Slide-in Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] xl:hidden"
          >
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute top-0 right-0 h-full w-[85%] max-w-sm bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="py-4 px-6 sm:py-6 sm:px-8 flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 shrink-0">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-brand-primary flex items-center justify-center text-white dark:text-black font-black italic shadow-md">S</div>
                   <span className="font-display font-black italic uppercase tracking-tighter text-xl text-zinc-900 dark:text-white">MENU</span>
                </div>
                <button onClick={() => setIsMenuOpen(false)} className="p-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-full transition-all hover:scale-105 active:scale-95 flex items-center justify-center">
                  <X className="h-5 w-5 text-zinc-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto drawer-scrollbar px-6 sm:px-8 py-6 sm:py-10 space-y-10 relative">
                {/* Scroll continue hint mask */}
                <div className="sticky bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white dark:from-zinc-950 to-transparent pointer-events-none z-10 -mx-8 -my-10" />
                
                {/* Profile Section */}
                <div className="space-y-6">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 italic mb-4">{t('account')}</h3>
                  {user ? (
                    <div className="space-y-4">
                      <Link 
                        to="/profile" 
                        onClick={() => setIsMenuOpen(false)} 
                        className="flex items-center gap-4 group"
                      >
                        <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 border-2 border-brand-primary/20 flex items-center justify-center text-2xl font-black text-brand-primary italic">
                          {(profile?.displayName || user.email || '?')[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black italic text-xl uppercase tracking-tighter text-zinc-900 dark:text-white truncate">{profile?.displayName || user.email?.split('@')[0]}</p>
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest truncate">{user.email}</p>
                        </div>
                      </Link>
                      <div className="grid grid-cols-2 gap-4 pt-4">
                        <Link 
                          to="/profile" 
                          onClick={() => setIsMenuOpen(false)}
                          className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-black/5 dark:bg-white/5 text-center active:scale-95 transition-transform"
                        >
                          <UserIcon className="h-5 w-5 text-brand-primary" />
                          <span className="text-[9px] font-black uppercase tracking-widest">{t('profile')}</span>
                        </Link>
                        <button 
                          onClick={() => {
                            handleSignOut();
                            setIsMenuOpen(false);
                          }}
                          className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-black/5 dark:bg-white/5 text-center active:scale-95 transition-transform text-zinc-500"
                        >
                          <LogOut className="h-5 w-5" />
                          <span className="text-[9px] font-black uppercase tracking-widest">{t('logout')}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <Link 
                      to="/login" 
                      onClick={() => setIsMenuOpen(false)}
                      className="w-full flex items-center justify-between p-6 rounded-3xl bg-brand-primary text-white dark:text-black group hover:bg-orange-600 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-xl">
                          <UserIcon className="h-6 w-6" />
                        </div>
                        <span className="text-xl font-black italic uppercase tracking-tighter">{t('login_signup')}</span>
                      </div>
                      <Zap className="h-5 w-5 opacity-40 group-hover:rotate-12 transition-transform" />
                    </Link>
                  )}
                </div>

                {/* Primary Nav Links */}
                <div className="space-y-6">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 italic mb-4">{t('navigation')}</h3>
                  <div className="grid grid-cols-1 gap-2.5">
                    <Link 
                      to="/" 
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-4 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 hover:bg-brand-primary/5 border border-zinc-100 dark:border-zinc-900 hover:border-brand-primary/20 transition-all group cursor-pointer"
                    >
                      <div className="p-2.5 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800 rounded-xl group-hover:bg-brand-primary/10 group-hover:border-brand-primary/20 transition-colors">
                        <Home className="h-4.5 w-4.5 text-zinc-600 dark:text-zinc-400 group-hover:text-brand-primary transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-extrabold italic uppercase tracking-wider text-xs text-zinc-900 dark:text-white group-hover:text-brand-primary transition-colors">{t('home')}</p>
                        <p className="text-[9px] font-medium text-zinc-500 uppercase tracking-wide mt-0.5">{t('home_desc', 'Main Storefront')}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-zinc-400 group-hover:text-brand-primary group-hover:translate-x-1 transition-all" />
                    </Link>

                    <Link 
                      to="/shop" 
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-4 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 hover:bg-brand-primary/5 border border-zinc-100 dark:border-zinc-900 hover:border-brand-primary/20 transition-all group cursor-pointer"
                    >
                      <div className="p-2.5 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800 rounded-xl group-hover:bg-brand-primary/10 group-hover:border-brand-primary/20 transition-colors">
                        <ShoppingBag className="h-4.5 w-4.5 text-zinc-600 dark:text-zinc-400 group-hover:text-brand-primary transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-extrabold italic uppercase tracking-wider text-xs text-zinc-900 dark:text-white group-hover:text-brand-primary transition-colors">{t('shop') || 'Shop'}</p>
                        <p className="text-[9px] font-medium text-zinc-500 uppercase tracking-wide mt-0.5">{t('shop_desc', 'Browse Products')}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-zinc-400 group-hover:text-brand-primary group-hover:translate-x-1 transition-all" />
                    </Link>

                    <Link 
                      to="/about" 
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-4 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 hover:bg-brand-primary/5 border border-zinc-100 dark:border-zinc-900 hover:border-brand-primary/20 transition-all group cursor-pointer"
                    >
                      <div className="p-2.5 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800 rounded-xl group-hover:bg-brand-primary/10 group-hover:border-brand-primary/20 transition-colors">
                        <Info className="h-4.5 w-4.5 text-zinc-600 dark:text-zinc-400 group-hover:text-brand-primary transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-extrabold italic uppercase tracking-wider text-xs text-zinc-900 dark:text-white group-hover:text-brand-primary transition-colors">{t('about_us')}</p>
                        <p className="text-[9px] font-medium text-zinc-500 uppercase tracking-wide mt-0.5">{t('about_desc', 'Our Heritage')}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-zinc-400 group-hover:text-brand-primary group-hover:translate-x-1 transition-all" />
                    </Link>

                    <Link 
                      to="/cart" 
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-4 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 hover:bg-brand-primary/5 border border-zinc-100 dark:border-zinc-900 hover:border-brand-primary/20 transition-all group cursor-pointer"
                    >
                      <div className="p-2.5 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800 rounded-xl group-hover:bg-brand-primary/10 group-hover:border-brand-primary/20 transition-colors relative">
                        <ShoppingCart className="h-4.5 w-4.5 text-zinc-600 dark:text-zinc-400 group-hover:text-brand-primary transition-colors" />
                        {totalItems > 0 && (
                          <span className="absolute -top-1 -right-1 bg-brand-primary text-white text-[8px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white dark:border-zinc-950 animate-bounce">{totalItems}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-extrabold italic uppercase tracking-wider text-xs text-zinc-900 dark:text-white group-hover:text-brand-primary transition-colors">{t('my_cart')}</p>
                        <p className="text-[9px] font-medium text-zinc-500 uppercase tracking-wide mt-0.5">{t('cart_desc', 'Your Shopping Items')}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-zinc-400 group-hover:text-brand-primary group-hover:translate-x-1 transition-all" />
                    </Link>

                    <button 
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsWishlistOpen(true);
                      }}
                      className="flex items-center gap-4 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 hover:bg-brand-primary/5 border border-zinc-100 dark:border-zinc-900 hover:border-brand-primary/20 transition-all group cursor-pointer text-left w-full"
                    >
                      <div className="p-2.5 bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800 rounded-xl group-hover:bg-rose-500/10 group-hover:border-rose-500/20 transition-colors relative">
                        <Heart className="h-4.5 w-4.5 text-zinc-600 dark:text-zinc-400 group-hover:text-rose-500 transition-colors" />
                        {wishlistIds.length > 0 && (
                          <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[8px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white dark:border-zinc-950">{wishlistIds.length}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-extrabold italic uppercase tracking-wider text-xs text-zinc-900 dark:text-white group-hover:text-rose-500 transition-colors">{t('my_wishlist', 'Wishlist')}</p>
                        <p className="text-[9px] font-medium text-zinc-500 uppercase tracking-wide mt-0.5">{t('wishlist_desc', 'Saved and Loved Items')}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-zinc-400 group-hover:text-brand-primary group-hover:translate-x-1 transition-all" />
                    </button>

                    {profile?.isAdmin && (
                      <Link 
                        to="/admin" 
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-4 p-3.5 rounded-2xl bg-brand-primary/5 hover:bg-brand-primary/10 border border-brand-primary/10 hover:border-brand-primary/30 transition-all group cursor-pointer w-full"
                      >
                        <div className="p-2.5 bg-white dark:bg-zinc-900 border border-brand-primary/20 rounded-xl">
                          <Zap className="h-4.5 w-4.5 text-brand-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-extrabold italic uppercase tracking-wider text-xs text-brand-primary">{t('admin_hub')}</p>
                          <p className="text-[9px] font-medium text-brand-primary/60 uppercase tracking-wide mt-0.5">{t('admin_desc', 'Supermarket Portal')}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-brand-primary group-hover:translate-x-1 transition-all" />
                      </Link>
                    )}
                  </div>
                </div>

                 {/* Preferences */}
                 <div className="space-y-6">
                   <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 italic mb-4">{t('preferences')}</h3>
                   <div className="flex flex-col sm:flex-row gap-3">
                     <button 
                       onClick={() => setIsDark(!isDark)}
                       className="flex-1 p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-brand-border flex items-center justify-center gap-3 active:scale-95 transition-transform cursor-pointer"
                     >
                       {isDark ? <Sun className="h-5 w-5 text-brand-accent" /> : <Moon className="h-5 w-5" />}
                       <span className="text-[9px] font-black uppercase tracking-widest">{isDark ? 'LIGHT' : 'DARK'}</span>
                     </button>
                     <div className="flex-1">
                       <button
                         type="button"
                         onClick={() => setIsMobileLangOpen(!isMobileLangOpen)}
                         className="w-full p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-brand-border flex items-center justify-between gap-2 active:scale-95 transition-transform font-black uppercase text-[9px] tracking-widest cursor-pointer"
                       >
                         <span className="truncate">{languages.find(l => l.code === i18n.language)?.label || 'Language'}</span>
                         <ChevronDown className={cn("h-4 w-4 text-zinc-400 transition-transform duration-200", isMobileLangOpen && "rotate-180")} />
                       </button>
                       <AnimatePresence>
                         {isMobileLangOpen && (
                           <motion.div
                             initial={{ opacity: 0, height: 0 }}
                             animate={{ opacity: 1, height: 'auto' }}
                             exit={{ opacity: 0, height: 0 }}
                             className="overflow-hidden bg-black/5 dark:bg-white/5 border border-zinc-200 dark:border-zinc-800 rounded-2xl mt-2 py-1"
                           >
                             {languages.map((lang) => (
                               <button
                                 key={`mobile-lang-${lang.code}`}
                                 type="button"
                                 onClick={() => {
                                   changeLanguage(lang.code);
                                   setIsMobileLangOpen(false);
                                   setIsMenuOpen(false);
                                 }}
                                 className={cn(
                                   "w-full text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-black/5 dark:hover:bg-white/5 flex justify-between items-center transition-colors cursor-pointer",
                                   i18n.language === lang.code ? "text-brand-primary bg-brand-primary/5" : "text-zinc-700 dark:text-zinc-300"
                                 )}
                               >
                                 <span>{lang.label}</span>
                                 <span className="opacity-40">{lang.short}</span>
                               </button>
                             ))}
                           </motion.div>
                         )}
                       </AnimatePresence>
                     </div>
                   </div>
                 </div>
              </div>

              {/* Footer */}
              <div className="p-8 border-t border-brand-border bg-black/5 dark:bg-black/20">
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-center opacity-30 leading-snug">
                  SIMBA SUPERMARKET<br/>EST 1980 • RWANDA
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
