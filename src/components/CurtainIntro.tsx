import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface CurtainIntroProps {
  onComplete?: () => void;
}

export default function CurtainIntro({ onComplete }: CurtainIntroProps) {
  // Phase state: 'intro' (logo shines) -> 'rising' (veil rises up) -> 'done' (unmounted)
  const [phase, setPhase] = useState<'intro' | 'rising' | 'done'>('intro');

  useEffect(() => {
    // 0.8s: Start lifting the translucent curtain upwards
    const openTimer = setTimeout(() => {
      setPhase('rising');
    }, 800);

    // 1.7s: Fully lifted, complete and unmount
    const doneTimer = setTimeout(() => {
      setPhase('done');
      if (onComplete) onComplete();
    }, 1750);

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
    >
      {/* Translucent Curtain Screen that rises from bottom to top */}
      <motion.div
        initial={{ y: '0%' }}
        animate={{ y: phase === 'rising' ? '-100%' : '0%' }}
        transition={{ 
          duration: 0.95, 
          ease: [0.76, 0, 0.24, 1] 
        }}
        className="absolute inset-0 w-full h-full bg-zinc-950/85 backdrop-blur-xl flex flex-col items-center justify-center shadow-[0_25px_60px_rgba(0,0,0,0.8)] border-b-2 border-brand-primary/50"
      >
        {/* Ambient Center Glow */}
        <div className="absolute w-72 sm:w-96 h-72 sm:h-96 bg-brand-primary/20 rounded-full blur-[100px] pointer-events-none animate-pulse" />

        {/* Center Content: Simba Logo and Name Only */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="relative z-20 flex flex-col items-center text-center space-y-4 px-6"
        >
          {/* Logo with Soft Dynamic Glow */}
          <motion.div 
            animate={{ 
              scale: [1, 1.04, 1],
              rotate: [0, 1, -1, 0]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="relative"
          >
            <img 
              src="https://isokko.com/m/media/upload/photos/2024/10/Untitleddesign6_6712450111ff0.png" 
              alt="Simba Supermarket" 
              className="h-20 sm:h-28 w-auto object-contain filter drop-shadow-[0_8px_24px_rgba(238,98,40,0.6)]"
              referrerPolicy="no-referrer"
            />
          </motion.div>

          {/* Simba Name */}
          <div className="space-y-1">
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="font-display font-black text-4xl sm:text-6xl uppercase italic tracking-widest text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]"
            >
              SIMBA
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="text-xs sm:text-sm font-black uppercase tracking-[0.35em] text-brand-primary drop-shadow-[0_2px_8px_rgba(238,98,40,0.5)]"
            >
              SUPERMARKET
            </motion.p>
          </div>
        </motion.div>

        {/* Bottom Curtain Hem with Warm Light Trim */}
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-600 via-amber-400 to-brand-primary shadow-[0_0_20px_rgba(245,158,11,0.8)]" />
      </motion.div>
    </div>
  );
}
