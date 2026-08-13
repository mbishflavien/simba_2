import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface CurtainIntroProps {
  onComplete?: () => void;
}

export default function CurtainIntro({ onComplete }: CurtainIntroProps) {
  // Phase state: 'intro' (logo shines) -> 'opening' (curtains slide apart) -> 'done' (unmounted)
  const [phase, setPhase] = useState<'intro' | 'opening' | 'done'>('intro');

  useEffect(() => {
    // 0.85s: Start parting curtains
    const openTimer = setTimeout(() => {
      setPhase('opening');
    }, 850);

    // 1.8s: Curtains fully open and disappear
    const doneTimer = setTimeout(() => {
      setPhase('done');
      if (onComplete) onComplete();
    }, 1850);

    return () => {
      clearTimeout(openTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  const handleSkip = () => {
    setPhase('done');
    if (onComplete) onComplete();
  };

  if (phase === 'done') return null;

  return (
    <div 
      className="fixed inset-0 z-[99999] pointer-events-auto overflow-hidden select-none cursor-pointer"
      onClick={handleSkip}
      title="Click anywhere to open immediately"
    >
      {/* Left Opera Velvet Curtain */}
      <motion.div
        initial={{ x: '0%' }}
        animate={{ x: phase === 'opening' ? '-100%' : '0%' }}
        transition={{ duration: 0.95, ease: [0.77, 0, 0.175, 1] }}
        className="absolute top-0 bottom-0 left-0 w-1/2 bg-gradient-to-r from-red-950 via-red-900 to-amber-950 border-r-2 border-amber-500/40 shadow-2xl flex flex-col justify-between overflow-hidden"
      >
        {/* Velvet Drapery Folds Simulation */}
        <div className="absolute inset-0 opacity-35 bg-[repeating-linear-gradient(90deg,rgba(0,0,0,0.6)_0px,rgba(255,255,255,0.12)_18px,rgba(0,0,0,0.7)_36px)] pointer-events-none" />
        
        {/* Top Gold Valance Drapery Accent */}
        <div className="relative z-10 w-full h-12 bg-gradient-to-b from-amber-600/40 to-transparent border-b border-amber-400/30" />

        {/* Center Golden Trim Edge */}
        <div className="absolute right-0 top-0 bottom-0 w-2 bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-700 shadow-lg shadow-amber-500/50" />
      </motion.div>

      {/* Right Opera Velvet Curtain */}
      <motion.div
        initial={{ x: '0%' }}
        animate={{ x: phase === 'opening' ? '100%' : '0%' }}
        transition={{ duration: 0.95, ease: [0.77, 0, 0.175, 1] }}
        className="absolute top-0 bottom-0 right-0 w-1/2 bg-gradient-to-l from-red-950 via-red-900 to-amber-950 border-l-2 border-amber-500/40 shadow-2xl flex flex-col justify-between overflow-hidden"
      >
        {/* Velvet Drapery Folds Simulation */}
        <div className="absolute inset-0 opacity-35 bg-[repeating-linear-gradient(90deg,rgba(0,0,0,0.6)_0px,rgba(255,255,255,0.12)_18px,rgba(0,0,0,0.7)_36px)] pointer-events-none" />
        
        {/* Top Gold Valance Drapery Accent */}
        <div className="relative z-10 w-full h-12 bg-gradient-to-b from-amber-600/40 to-transparent border-b border-amber-400/30" />

        {/* Center Golden Trim Edge */}
        <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-l from-amber-600 via-yellow-400 to-amber-700 shadow-lg shadow-amber-500/50" />
      </motion.div>

      {/* Golden Stage Spotlight Vignette */}
      <div className="absolute inset-0 bg-radial-[at_center_center] from-amber-500/10 via-black/40 to-black/80 pointer-events-none" />

      {/* Center Golden Medallion: Simba Logo & Name */}
      <AnimatePresence>
        {phase === 'intro' && (
          <motion.div
            key="center-emblem"
            initial={{ opacity: 0, scale: 0.8, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.15, filter: 'blur(8px)', transition: { duration: 0.4 } }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-30 px-6"
          >
            {/* Ambient Aura Glow */}
            <div className="absolute w-64 sm:w-80 h-64 sm:h-80 bg-gradient-to-tr from-amber-500/30 to-brand-primary/40 rounded-full blur-[70px] pointer-events-none animate-pulse" />

            {/* Medallion Badge Container */}
            <div className="relative bg-zinc-950/85 backdrop-blur-xl border-2 border-amber-400/60 rounded-3xl p-6 sm:p-9 shadow-[0_0_50px_rgba(245,158,11,0.35)] flex flex-col items-center text-center space-y-4 max-w-sm sm:max-w-md mx-auto">
              
              {/* Gold Ribbon / Crest Accents */}
              <div className="absolute -top-3 px-4 py-0.5 bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-600 rounded-full text-black font-black text-[9px] uppercase tracking-[0.25em] shadow-md">
                Grand Opening
              </div>

              {/* Logo with Shimmer Ring */}
              <motion.div 
                animate={{ rotate: [0, 2, -2, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                className="relative p-3 rounded-2xl bg-white/5 border border-amber-400/30 shadow-inner"
              >
                <img 
                  src="https://isokko.com/m/media/upload/photos/2024/10/Untitleddesign6_6712450111ff0.png" 
                  alt="Simba Logo" 
                  className="h-16 sm:h-20 w-auto object-contain filter drop-shadow-[0_4px_12px_rgba(245,158,11,0.5)]"
                  referrerPolicy="no-referrer"
                />
              </motion.div>

              {/* Store Name Typography */}
              <div className="space-y-1">
                <motion.h1 
                  initial={{ letterSpacing: '0.05em' }}
                  animate={{ letterSpacing: '0.12em' }}
                  transition={{ duration: 0.8 }}
                  className="font-display font-black text-3xl sm:text-5xl uppercase italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-white to-amber-300 drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]"
                >
                  SIMBA
                </motion.h1>
                <div className="flex items-center justify-center gap-2">
                  <span className="h-[1px] w-6 bg-gradient-to-r from-transparent to-amber-400" />
                  <span className="text-amber-400 font-black text-[10px] sm:text-xs tracking-[0.35em] uppercase drop-shadow-md">
                    SUPERMARKET
                  </span>
                  <span className="h-[1px] w-6 bg-gradient-to-l from-transparent to-amber-400" />
                </div>
              </div>

              <p className="text-[10px] font-medium tracking-wider text-zinc-400 uppercase">
                Rwanda’s Premier Retail Experience
              </p>
            </div>

            {/* Click to skip hint */}
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ delay: 0.3 }}
              className="mt-4 text-[9px] uppercase tracking-widest text-amber-200/60 font-semibold"
            >
              Tap anywhere to enter
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
