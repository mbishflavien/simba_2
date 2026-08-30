import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ShoppingBag, 
  ArrowRight, 
  Info, 
  Clock, 
  ShieldCheck, 
  Award
} from 'lucide-react';
import landingHero from '../assets/images/landing_hero_1781164991277.png';
import FluidGradientMesh from './FluidGradientMesh';

interface HeroVideoSectionProps {
  onStartShopping?: () => void;
}

export default function HeroVideoSection({ onStartShopping }: HeroVideoSectionProps) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  const videoSourceUrl = 'https://assets.mixkit.co/videos/preview/mixkit-vegetables-and-fruits-arranged-in-a-market-stall-41031-large.mp4';

  // Pause video when scrolled out of view to optimize performance
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  const handleScrollToMarket = () => {
    if (onStartShopping) {
      onStartShopping();
    } else {
      const marketEl = document.getElementById('market');
      if (marketEl) {
        marketEl.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <section 
      className="relative min-h-[88vh] md:min-h-[92vh] flex items-center justify-center overflow-hidden bg-neutral-950 w-full" 
      id="welcome-hero-section"
      aria-label="Simba Supermarket Welcome Hero"
    >
      {/* 
        ========================================================================
        LAYER 1: FLUID GRADIENT MESH FILL FOR AMBIENT SURROUNDING
        ========================================================================
      */}
      <div className="absolute inset-0 z-0 w-full h-full overflow-hidden pointer-events-none select-none">
        <FluidGradientMesh 
          intensity={0.85} 
          speed={1.0} 
          interactive={true}
          blurAmount="40px"
        />
        {/* Ambient Dark Overlay */}
        <div className="absolute inset-0 bg-neutral-950/40 dark:bg-black/55 backdrop-blur-[3px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/60 via-transparent to-neutral-950/90" />
      </div>

      {/* 
        ========================================================================
        LAYER 2: BACKGROUND VIDEO WITH SEAMLESS GRADIENT INTEGRATION
        ========================================================================
      */}
      <div className="absolute inset-0 z-[1] w-full h-full overflow-hidden pointer-events-none select-none">
        {!videoFailed ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            onLoadedData={() => setVideoLoaded(true)}
            onError={() => setVideoFailed(true)}
            poster={landingHero}
            className={`w-full h-full object-cover object-center filter brightness-100 contrast-[1.08] saturate-[1.25] transform-gpu transition-all duration-1000 ${
              videoLoaded ? 'opacity-70 md:opacity-75' : 'opacity-40'
            }`}
          >
            <source src={videoSourceUrl} type="video/mp4" />
            <img 
              src={landingHero} 
              alt="Simba Supermarket Fresh Products" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </video>
        ) : (
          /* Fallback image with subtle motion */
          <motion.img 
            src={landingHero} 
            alt="Simba Supermarket Fresh Products" 
            initial={{ scale: 1.02 }}
            animate={{ 
              scale: [1.02, 1.07, 1.03, 1.06, 1.02],
              x: [0, -4, 4, -2, 0],
              y: [0, 3, -3, 3, 0]
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut"
            }}
            className="w-full h-full object-cover object-center filter brightness-95 contrast-[1.05] saturate-[1.2] transform-gpu"
            referrerPolicy="no-referrer"
          />
        )}

        {/* Soft edge blends to integrate video seamlessly with ambient gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-neutral-950/60" />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/70 via-transparent to-neutral-950/70" />
        <div className="absolute inset-0 bg-radial-[at_center_center] from-transparent via-neutral-950/30 to-neutral-950/75" />
      </div>

      {/* 
        ========================================================================
        LAYER 3: MAIN HERO TYPOGRAPHY & ACTIONS
        ========================================================================
      */}
      <div className="relative w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 z-10 flex flex-col items-center justify-center text-center py-20 md:py-28">
        
        {/* Ambient aura glow behind hero title */}
        <div className="absolute w-72 sm:w-[520px] h-72 sm:h-[520px] bg-brand-primary/25 rounded-full blur-[130px] pointer-events-none -z-10 animate-pulse" />

        <div className="w-full flex flex-col items-center justify-center text-center space-y-6 sm:space-y-8 relative">
          {/* Headline Typography */}
          <div className="space-y-3 sm:space-y-4 max-w-4xl mx-auto relative z-10">
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-black tracking-tighter uppercase italic leading-[0.9] text-white drop-shadow-[0_8px_32px_rgba(0,0,0,0.95)]"
            >
              SIMBA{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-brand-primary to-amber-300 drop-shadow-[0_4px_24px_rgba(255,107,0,0.5)]">
                SUPERMARKET
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-xs sm:text-sm md:text-base font-bold uppercase tracking-widest text-zinc-100 italic max-w-2xl mx-auto drop-shadow-[0_3px_12px_rgba(0,0,0,0.95)]"
            >
              Meeting your daily requirements with Rwanda’s finest retail resurgence. Freshness guaranteed since 2007.
            </motion.p>
          </div>

          {/* Action Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-5 pt-2 w-full max-w-md mx-auto relative z-10"
          >
            <motion.button 
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleScrollToMarket}
              className="w-full sm:w-auto group bg-brand-primary hover:bg-orange-600 text-white py-3.5 sm:py-4 px-8 sm:px-9 rounded-full font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all duration-200 shadow-2xl shadow-brand-primary/50 italic cursor-pointer relative overflow-hidden"
              id="welcome-shop-btn"
            >
              <ShoppingBag className="h-4 w-4 group-hover:rotate-12 transition-transform duration-300" />
              {t('start_shopping')}
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform duration-300" />
            </motion.button>

            <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
              <Link 
                to="/about" 
                className="w-full sm:w-auto group bg-black/50 hover:bg-black/70 text-white border border-white/40 backdrop-blur-2xl py-3.5 sm:py-4 px-8 sm:px-9 rounded-full font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all duration-200 italic shadow-2xl"
                id="welcome-about-btn"
              >
                <Info className="h-4 w-4 text-brand-primary group-hover:scale-110 transition-transform duration-300" />
                About Simba
              </Link>
            </motion.div>
          </motion.div>

          {/* Quick Value Metrics with Frosted Glass Borders */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="grid grid-cols-3 gap-3 sm:gap-6 pt-6 border-t border-white/20 max-w-xl w-full mx-auto relative z-10"
          >
            <motion.div whileHover={{ y: -2, scale: 1.05 }} className="space-y-0.5 text-center cursor-default transition-all p-2 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
              <div className="flex items-center justify-center gap-1.5 text-brand-primary drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                <Clock className="h-3.5 w-3.5 animate-bounce" />
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-white">30 Min Delivery</span>
              </div>
              <p className="text-[8px] sm:text-[9px] font-semibold text-zinc-300 uppercase drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">Realtime fleet</p>
            </motion.div>
            
            <motion.div whileHover={{ y: -2, scale: 1.05 }} className="space-y-0.5 text-center cursor-default transition-all p-2 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
              <div className="flex items-center justify-center gap-1.5 text-brand-primary drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-white">Quality Pick</span>
              </div>
              <p className="text-[8px] sm:text-[9px] font-semibold text-zinc-300 uppercase drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">Double-inspected</p>
            </motion.div>
            
            <motion.div whileHover={{ y: -2, scale: 1.05 }} className="space-y-0.5 text-center cursor-default transition-all p-2 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
              <div className="flex items-center justify-center gap-1.5 text-brand-primary drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                <Award className="h-3.5 w-3.5" />
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-white">11 Branches</span>
              </div>
              <p className="text-[8px] sm:text-[9px] font-semibold text-zinc-300 uppercase drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">Across Rwanda</p>
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
