import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, Bot, Loader2, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { chatWithAi, AiSearchIntent } from '../services/aiService';
import { cn } from '../lib/utils';
import { useTranslation } from 'react-i18next';

interface AiAssistantProps {
  onSearchApplied: (intent: AiSearchIntent) => void;
}

export default function AiAssistant({ onSearchApplied }: AiAssistantProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim() || isLoading) return;

    const userMsg = query;
    const newMessages = [...messages, { role: 'user' as const, content: userMsg }];
    setMessages(newMessages);
    setQuery('');
    setIsLoading(true);

    try {
      const result = await chatWithAi(newMessages);
      setMessages(prev => [...prev, { role: 'assistant', content: result.assistantResponse }]);
      if (result.isSearch) {
        onSearchApplied(result);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting to my central brain. Try again?" }]);
    } finally {
      setIsLoading(false);
    }
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
            className="fixed bottom-28 right-8 z-[100] w-[90vw] max-w-[400px] h-[600px] bg-white dark:bg-zinc-950 border border-brand-border rounded-[40px] shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-8 border-b border-brand-border flex items-center justify-between bg-brand-primary/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-primary flex items-center justify-center shadow-lg shadow-brand-primary/20">
                  <Bot className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-black italic uppercase tracking-tighter text-xl text-[var(--brand-text)] leading-none">SIMBA SMART</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">AI POWERED SEARCH</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-3 hover:bg-black/5 dark:hover:bg-white/5 rounded-2xl transition-colors"
              >
                <X className="h-5 w-5 opacity-40" />
              </button>
            </div>

            {/* Chat Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar"
            >
              {messages.length === 0 && (
                <div className="py-12 text-center space-y-8">
                  <div className="w-20 h-20 mx-auto rounded-full bg-brand-primary/10 flex items-center justify-center">
                    <MessageSquare className="h-10 w-10 text-brand-primary opacity-40 shrink-0" />
                  </div>
                  <div className="space-y-2">
                    <p className="font-black italic uppercase tracking-tighter text-2xl text-[var(--brand-text)]">WHAT CAN I FIND FOR YOU?</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">Try "I need ingredients for a birthday cake"</p>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      "Best items for a baby shower",
                      "Ingredients for Jollof Rice",
                      "Detergents under 15,000 RWF",
                      "Find some Rwandan coffee"
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => {
                          setQuery(suggestion);
                          // We use a small timeout to let the state update before submitting
                          setTimeout(() => {
                            const event = new Event('submit') as any;
                            handleSubmit(event);
                          }, 10);
                        }}
                        className="p-4 bg-black/5 dark:bg-white/5 border border-brand-border rounded-2xl text-[10px] font-black uppercase tracking-widest text-left hover:border-brand-primary/50 hover:bg-brand-primary/5 transition-all"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    "flex",
                    m.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  <div className={cn(
                    "max-w-[80%] p-5 rounded-[24px] text-xs font-bold leading-relaxed",
                    m.role === 'user' 
                      ? "bg-brand-primary text-white rounded-tr-none shadow-lg shadow-brand-primary/10" 
                      : "bg-black/5 dark:bg-white/5 border border-brand-border text-[var(--brand-text)] rounded-tl-none uppercase italic"
                  )}>
                    {m.content}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                   <div className="bg-black/5 dark:bg-white/5 border border-brand-border p-5 rounded-[24px] rounded-tl-none">
                     <Loader2 className="h-4 w-4 animate-spin text-brand-primary" />
                   </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-8 border-t border-brand-border">
              <form onSubmit={handleSubmit} className="relative group">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask Simba Smart Assistant..."
                  className="w-full bg-black/5 dark:bg-white/5 border-2 border-brand-border rounded-[24px] py-5 pl-8 pr-16 text-sm font-black italic focus:outline-none focus:border-brand-primary transition-all placeholder:opacity-30"
                />
                <button
                  type="submit"
                  disabled={!query.trim() || isLoading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-12 w-12 bg-brand-primary text-white rounded-full flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all shadow-lg"
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
