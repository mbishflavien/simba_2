import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowUp } from 'lucide-react';

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.pageYOffset || document.documentElement.scrollTop;
          const totalHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
          
          // Show button after scrolling past 320px
          setIsVisible(currentScrollY > 320);

          // Calculate percentage for circular progress ring
          if (totalHeight > 0) {
            const progress = Math.min(100, Math.max(0, (currentScrollY / totalHeight) * 100));
            setScrollProgress(progress);
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Circular progress calculations for 44px circle with radius 18
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scrollProgress / 100) * circumference;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.7, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.7, y: 20 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          onClick={scrollToTop}
          className="fixed bottom-8 left-6 sm:left-8 z-[85] p-3 rounded-full bg-white/80 dark:bg-zinc-900/80 hover:bg-brand-primary dark:hover:bg-brand-primary text-[var(--brand-text)] hover:text-white dark:hover:text-white border border-black/10 dark:border-white/15 backdrop-blur-2xl shadow-xl hover:shadow-2xl hover:shadow-brand-primary/30 transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer group flex items-center justify-center"
          title="Back to Top"
          aria-label="Back to Top"
          id="back-to-top-btn"
        >
          {/* Circular progress SVG */}
          <svg className="absolute w-12 h-12 -rotate-90 pointer-events-none" viewBox="0 0 44 44">
            <circle
              cx="22"
              cy="22"
              r={radius}
              className="stroke-black/5 dark:stroke-white/10"
              strokeWidth="2.5"
              fill="transparent"
            />
            <circle
              cx="22"
              cy="22"
              r={radius}
              className="stroke-brand-primary group-hover:stroke-white transition-colors duration-300"
              strokeWidth="2.5"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          {/* Arrow Icon */}
          <ArrowUp className="w-5 h-5 transition-transform duration-300 group-hover:-translate-y-0.5 relative z-10" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
