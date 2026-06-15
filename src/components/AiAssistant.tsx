import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Sparkles, Send, X, Bot, Loader2, MessageSquare, Trash2, Check, ShoppingBag, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { chatWithAi, AiSearchIntent } from '../services/aiService';
import { cn, formatCurrency } from '../lib/utils';
import { useTranslation } from 'react-i18next';
import { useCart } from '../hooks/useCart';
import { Product } from '../types';
import { Link } from 'react-router-dom';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  searchIntent?: AiSearchIntent;
}

interface AiAssistantProps {
  onSearchApplied: (intent: AiSearchIntent) => void;
  products?: Product[];
}

export default function AiAssistant({ onSearchApplied, products = [] }: AiAssistantProps) {
  const { t } = useTranslation();
  const { addToCart, cart } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Clean local text formatter for bullet points, bolding etc.
  const renderMessageContent = useCallback((content: string) => {
    if (!content) return null;
    const lines = content.split('\n');

    return (
      <div className="space-y-2.5">
        {lines.map((line, lIdx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={lIdx} className="h-1" />;

          // Detect bullet points or numeric lists
          const isBullet = trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.match(/^\d+\.\s/);
          let cleanText = trimmed;
          if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
            cleanText = trimmed.substring(2);
          } else {
            const matchNum = trimmed.match(/^(\d+\.\s)(.*)/);
            if (matchNum) {
              cleanText = matchNum[2];
            }
          }

          // Parse **bold** markdown within text
          const parts = [];
          let tempText = cleanText;
          const boldRegex = /\*\*(.*?)\*\*/g;
          let lastIndex = 0;
          let match;

          while ((match = boldRegex.exec(tempText)) !== null) {
            const matchIndex = match.index;
            if (matchIndex > lastIndex) {
              parts.push(tempText.substring(lastIndex, matchIndex));
            }
            parts.push(
              <strong key={matchIndex} className="font-extrabold text-zinc-900 dark:text-white">
                {match[1]}
              </strong>
            );
            lastIndex = boldRegex.lastIndex;
          }

          if (lastIndex < tempText.length) {
            parts.push(tempText.substring(lastIndex));
          }

          const formattedContent = parts.length > 0 ? parts : cleanText;

          if (isBullet) {
            return (
              <div key={lIdx} className="flex items-start gap-2 pl-1.5 py-0.5">
                <span className="text-brand-primary font-black mt-1.5 shrink-0 scale-125">•</span>
                <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                  {formattedContent}
                </span>
              </div>
            );
          }

          return (
            <p key={lIdx} className="text-zinc-700 dark:text-zinc-300 font-medium leading-relaxed">
              {formattedContent}
            </p>
          );
        })}
      </div>
    );
  }, []);

  // Filter products matching searchIntent parameters
  const getMatchingProducts = useCallback((intent?: AiSearchIntent) => {
    if (!intent || !intent.isSearch || !products || products.length === 0) return [];
    
    return products.filter(product => {
      // If category is specified, verify category (case-insensitive)
      if (intent.category && product.category) {
        if (product.category.toLowerCase().trim() !== intent.category.toLowerCase().trim()) {
          return false;
        }
      }

      // If search query is specified, split into tokens and match name or category
      if (intent.searchQuery) {
        const keywords = intent.searchQuery
          .split(/[\s,;]+/)
          .map(k => k.trim().toLowerCase())
          .filter(k => k.length > 0);

        if (keywords.length > 0) {
          const name = (product.name || '').toLowerCase();
          const cat = (product.category || '').toLowerCase();
          
          const matchesAny = keywords.some(keyword => name.includes(keyword) || cat.includes(keyword));
          if (!matchesAny) return false;
        }
      }

      // Price ranges
      if (intent.minPrice !== null && product.price < intent.minPrice) return false;
      if (intent.maxPrice !== null && product.price > intent.maxPrice) return false;

      return true;
    }).slice(0, 5); // Limit matching previews so container remains sleek
  }, [products]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg = textToSend;
    const newMessages = [...messages, { role: 'user' as const, content: userMsg }];
    setMessages(newMessages);
    setQuery('');
    setIsLoading(true);

    try {
      const result = await chatWithAi(newMessages);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: result.assistantResponse,
          searchIntent: result.isSearch ? result : undefined
        }
      ]);

      if (result.isSearch) {
        onSearchApplied(result);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: "I'm having a momentary lapse in connection. Click to try again?"
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(query);
  };

  const handleClearHistory = () => {
    setMessages([]);
  };

  return (
    <>
      {/* Floating Toggle */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 z-[100] bg-brand-primary text-white p-5 rounded-full shadow-[0_0_50px_rgba(255,102,0,0.4)] hover:scale-110 active:scale-95 transition-all group overflow-hidden"
      >
        <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700 skewed-glass" />
        <Sparkles className="h-7 w-7 animate-pulse" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            className="fixed bottom-28 right-8 z-[100] w-[90vw] max-w-[420px] h-[650px] bg-white dark:bg-zinc-950 border border-brand-border rounded-[40px] shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-8 border-b border-brand-border flex items-center justify-between bg-brand-primary/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-primary flex items-center justify-center shadow-lg shadow-brand-primary/20">
                  <Bot className="h-6 w-6 text-white animate-bounce" />
                </div>
                <div>
                  <h3 className="font-black italic uppercase tracking-tighter text-xl text-[var(--brand-text)] leading-none">SIMBA SMART</h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse border border-white dark:border-zinc-950" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 italic">ASSISTANT IS ACTIVE</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {messages.length > 0 && (
                  <button
                    onClick={handleClearHistory}
                    title="Clear Conversation"
                    className="p-3 hover:bg-black/5 dark:hover:bg-white/5 rounded-2xl transition-colors text-zinc-400 hover:text-rose-500"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-3 hover:bg-black/5 dark:hover:bg-white/5 rounded-2xl transition-colors text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Chat Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth"
              style={{ scrollbarWidth: 'thin' }}
            >
              {messages.length === 0 && (
                <div className="py-8 text-center space-y-8">
                  <div className="w-20 h-20 mx-auto rounded-full bg-brand-primary/10 flex items-center justify-center">
                    <MessageSquare className="h-10 w-10 text-brand-primary opacity-40 shrink-0" />
                  </div>
                  <div className="space-y-2">
                    <p className="font-black italic uppercase tracking-tighter text-2xl text-[var(--brand-text)]">WHAT CAN I FIND FOR YOU?</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">Try searching or asking about our supermarket</p>
                  </div>
                  <div className="grid grid-cols-1 gap-2.5">
                    {[
                      "Rwanda honey & tea coffee",
                      "Ingredients for Jollof Rice",
                      "Alcoholic drinks under 15,000 RWF",
                      "Tell me delivery times & locations"
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => handleSendMessage(suggestion)}
                        className="p-4 bg-black/5 dark:bg-white/5 border border-brand-border rounded-2xl text-[10px] font-black uppercase tracking-widest text-left hover:border-brand-primary/50 hover:bg-brand-primary/5 hover:text-brand-primary transition-all cursor-pointer"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => {
                const matchProducts = getMatchingProducts(m.searchIntent);
                return (
                  <div key={i} className="space-y-3">
                    <div className={cn("flex", m.role === 'user' ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "max-w-[85%] p-5 rounded-[24px] text-xs leading-relaxed transition-all duration-350 shadow-sm",
                        m.role === 'user' 
                          ? "bg-brand-primary text-white rounded-tr-none shadow-md shadow-brand-primary/10 font-bold" 
                          : "bg-black/5 dark:bg-white/5 border border-brand-border text-[var(--brand-text)] rounded-tl-none font-medium"
                      )}>
                        {m.role === 'user' ? (
                          <div className="font-extrabold">{m.content}</div>
                        ) : (
                          renderMessageContent(m.content)
                        )}
                      </div>
                    </div>

                    {/* Meta information tags for e-commerce parsing */}
                    {m.role === 'assistant' && m.searchIntent?.isSearch && (
                      <div className="flex flex-wrap gap-1.5 pl-2 items-center">
                        <span className="text-[8px] font-black bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-md uppercase tracking-wider italic">
                          🔍 Parsed Query
                        </span>
                        {m.searchIntent.category && (
                          <span className="text-[8px] font-black bg-neutral-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-2 py-0.5 rounded-md uppercase tracking-wider italic">
                            Category: {m.searchIntent.category}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Integrated Horizontal E-Commerce Product Carousels */}
                    {m.role === 'assistant' && matchProducts.length > 0 && (
                      <div className="pl-4 pr-1 overflow-hidden animate-fade-in">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                            Available In Catalog ({matchProducts.length})
                          </p>
                          <span className="text-[8px] font-bold text-zinc-300 dark:text-zinc-600">Swipe →</span>
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-4 scroll-smooth scrollbar-thin scrollbar-thumb-zinc-300/40 dark:scrollbar-thumb-zinc-800/40 snap-x">
                          {matchProducts.map((p) => {
                            const isItemInCart = cart.some(item => item.id === p.id);
                            return (
                              <div 
                                key={p.id} 
                                className="bg-white dark:bg-zinc-900 border border-brand-border/80 dark:border-white/5 rounded-3xl p-3.5 w-[155px] shrink-0 flex flex-col hover:border-brand-primary/40 transition-all shadow-[0_4px_15px_rgba(0,0,0,0.02)] snap-start hover:-y-1"
                              >
                                <Link 
                                  to={`/product/${p.id}`} 
                                  onClick={() => setIsOpen(false)}
                                  className="aspect-square bg-zinc-50 dark:bg-zinc-950 rounded-2xl flex items-center justify-center p-2 mb-2 relative group overflow-hidden border border-brand-border/40"
                                >
                                  <img 
                                    src={p.image} 
                                    alt={p.name} 
                                    className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                                    referrerPolicy="no-referrer"
                                  />
                                  {!p.inStock && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-2xl">
                                      <span className="text-[8px] font-black text-white uppercase tracking-wider">Out of Stock</span>
                                    </div>
                                  )}
                                </Link>
                                <div className="flex-1 flex flex-col justify-between">
                                  <Link 
                                    to={`/product/${p.id}`} 
                                    onClick={() => setIsOpen(false)}
                                    className="block"
                                  >
                                    <h4 className="text-[10px] font-extrabold line-clamp-2 uppercase italic text-[var(--brand-text)] leading-snug mb-1 hover:text-brand-primary transition-colors min-h-[2.2em]">
                                      {p.name}
                                    </h4>
                                  </Link>
                                  <div>
                                    <p className="text-[11px] font-black text-brand-primary italic leading-none mb-2.5">
                                      {formatCurrency(p.price)}
                                    </p>
                                    <button
                                      disabled={!p.inStock}
                                      onClick={() => addToCart(p)}
                                      className={cn(
                                        "w-full py-2 rounded-xl text-[8px] font-extrabold uppercase tracking-widest flex items-center justify-center gap-1 transition-all cursor-pointer",
                                        isItemInCart 
                                          ? "bg-green-500/15 text-green-500 border border-green-500/20 font-black" 
                                          : p.inStock
                                            ? "bg-brand-primary text-white hover:bg-brand-primary/95 hover:scale-105 active:scale-95 disabled:hover:scale-100 shadow-sm shadow-brand-primary/10"
                                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 border border-transparent"
                                      )}
                                    >
                                      {isItemInCart ? (
                                        <>
                                          <Check className="h-2.5 w-2.5" /> Added
                                        </>
                                      ) : p.inStock ? (
                                        <>
                                          <ShoppingBag className="h-2.5 w-2.5" /> + Cart
                                        </>
                                      ) : (
                                        "Sold Out"
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-black/5 dark:bg-white/5 border border-brand-border p-5 rounded-[24px] rounded-tl-none flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-brand-primary" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 italic">Thinking...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-8 border-t border-brand-border bg-neutral-50/50 dark:bg-zinc-900/10">
              <form onSubmit={handleSubmit} className="relative group">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask Simba Smart Assistant..."
                  disabled={isLoading}
                  className="w-full bg-white dark:bg-zinc-900 border-2 border-brand-border rounded-[24px] py-5 pl-8 pr-16 text-sm font-black italic focus:outline-none focus:border-brand-primary transition-all placeholder:opacity-40 text-[var(--brand-text)] group-hover:border-zinc-300 dark:group-hover:border-zinc-800 focus:group-hover:border-brand-primary"
                />
                <button
                  type="submit"
                  disabled={!query.trim() || isLoading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-12 w-12 bg-brand-primary text-white rounded-full flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all shadow-lg cursor-pointer"
                >
                  <Send className="h-5 w-5" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
