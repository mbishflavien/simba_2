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
  Award,
  Sparkles,
  Volume2,
  VolumeX
} from 'lucide-react';
import landingHero from '../assets/images/landing_hero_1781164991277.png';

interface HeroVideoSectionProps {
  onStartShopping?: () => void;
}

export default function HeroVideoSection({ onStartShopping }: HeroVideoSectionProps) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  // Performance: Pause video when scrolled out of view to save battery & CPU
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
      { threshold: 0.15 }
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
      className="relative min-h-[88vh] md:min-h-[92vh] flex items-center justify-center overflow-hidden bg-zinc-950 w-full" 
      id="welcome-hero-section"
      aria-label="Simba Supermarket Welcome Hero"
    >
      {/* Background Video Layer with Zero Text / Zero Watermark Visuals */}
      <div className="absolute inset-0 z-0 w-full h-full overflow-hidden pointer-events-none select-none">
        
        {/* High-Resolution Cinematic Video Loop */}
        {!videoFailed ? (
          <video
            ref={videoRef}
            autoPlay
            muted={isMuted}
            loop
            playsInline
            preload="auto"
            onLoadedData={() => setVideoLoaded(true)}
            onError={() => setVideoFailed(true)}
            poster={landingHero}
            className={`w-full h-full object-cover object-center filter brightness-105 contrast-[1.08] saturate-[1.25] transform-gpu transition-opacity duration-1000 ${
              videoLoaded ? 'opacity-100' : 'opacity-80'
            }`}
          >
            {/* Curated pristine macro food & grocery cinematic video loops */}
            <source 
              src="https://assets.mixkit.co/videos/preview/mixkit-vegetables-and-fruits-arranged-in-a-market-stall-41031-large.mp4" 
              type="video/mp4" 
            />
            <source 
              src="https://assets.mixkit.co/videos/preview/mixkit-fresh-vegetables-and-fruits-in-a-supermarket-42999-large.mp4" 
              type="video/mp4" 
            />
            {/* Fallback image */}
            <img 
              src={landingHero} 
              alt="Simba Supermarket Fresh Products" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </video>
        ) : (
          /* Smooth Ken-Burns Fallback if video is blocked */
          <motion.img 
            src={landingHero} 
            alt="Simba Supermarket Fresh Products" 
            initial={{ scale: 1.02 }}
            animate={{ 
              scale: [1.02, 1.10, 1.05, 1.09, 1.02],
              x: [0, -8, 8, -4, 0],
              y: [0, 6, -4, 6, 0]
            }}
            transition={{
              duration: 22,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut"
            }}
            className="w-full h-full object-cover object-center filter brightness-100 contrast-[1.08] saturate-[1.2] transform-gpu"
            referrerPolicy="no-referrer"
          />
        )}

        {/* Multi-tier Intentional Dark Gradient Overlay for Supreme Text Legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/50" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60" />
        <div className="absolute inset-0 bg-radial-[at_center_center] from-transparent via-black/20 to-black/65" />
      </div>

      {/* Main Centered Content: Direct Frameless Typography & Controls */}
      <div className="relative w-full max-w-4xl mx-auto px-4 sm:px-6 md:px-8 z-10 flex flex-col items-center justify-center text-center py-20 md:py-28">
        
        {/* Ambient Floating Glow behind Text */}
        <div className="absolute w-80 sm:w-[500px] h-80 sm:h-[500px] bg-brand-primary/20 rounded-full blur-[130px] pointer-events-none -z-10 animate-pulse" />

        <div className="w-full flex flex-col items-center justify-center text-center space-y-6 sm:space-y-7 relative">
          
          {/* Brand Header */}
          <div className="space-y-3 max-w-3xl mx-auto relative z-10">
            <motion.h1 
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="text-4xl sm:text-6xl lg:text-7xl font-display font-black tracking-tighter uppercase italic leading-[0.95] text-white drop-shadow-[0_6px_28px_rgba(0,0,0,0.95)]"
            >
              SIMBA{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-brand-primary to-amber-300 drop-shadow-[0_4px_16px_rgba(249,115,22,0.4)]">
                SUPERMARKET
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-xs sm:text-sm md:text-base font-bold uppercase tracking-widest text-zinc-100 italic max-w-2xl mx-auto drop-shadow-[0_3px_12px_rgba(0,0,0,0.95)]"
            >
              Meeting your daily requirements with Rwanda’s finest retail resurgence. Freshness guaranteed.
            </motion.p>
          </div>

          {/* Value Narrative & Highlight */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-zinc-200 text-xs sm:text-sm leading-relaxed max-w-2xl mx-auto space-y-2 font-medium drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] relative z-10"
          >
            <p>
              Since inaugurating our flagship store, Simba has stood as Rwanda’s premium retail landmark, now proudly serving you across 11 major branches with clean, hand-inspected local freshness and the finest international imports.
            </p>
            <motion.p 
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-amber-300 italic drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]"
            >
              ⚡ Fast-track, temperature-controlled delivery across Kigali in under 30 minutes!
            </motion.p>
          </motion.div>

          {/* Action Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2 w-full max-w-sm mx-auto relative z-10"
          >
            <motion.button 
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleScrollToMarket}
              className="w-full sm:w-auto group bg-brand-primary hover:bg-orange-600 text-white py-3 sm:py-3.5 px-7 sm:px-8 rounded-full font-black text-xs uppercase tracking-[0.18em] flex items-center justify-center gap-2.5 transition-all duration-200 shadow-2xl shadow-brand-primary/50 italic cursor-pointer relative overflow-hidden"
              id="welcome-shop-btn"
            >
              <ShoppingBag className="h-4 w-4 group-hover:rotate-12 transition-transform duration-300" />
              {t('start_shopping')}
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform duration-300" />
            </motion.button>

            <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
              <Link 
                to="/about" 
                className="w-full sm:w-auto group bg-black/40 hover:bg-black/60 text-white border border-white/40 backdrop-blur-md py-3 sm:py-3.5 px-7 sm:px-8 rounded-full font-black text-xs uppercase tracking-[0.18em] flex items-center justify-center gap-2.5 transition-all duration-200 italic shadow-xl"
                id="welcome-about-btn"
              >
                <Info className="h-4 w-4 text-brand-primary group-hover:scale-110 transition-transform duration-300" />
                About Simba
              </Link>
            </motion.div>
          </motion.div>

          {/* Quick Value Metrics */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="grid grid-cols-3 gap-3 sm:gap-6 pt-6 border-t border-white/20 max-w-xl w-full mx-auto relative z-10"
          >
            <motion.div whileHover={{ y: -2, scale: 1.05 }} className="space-y-0.5 text-center cursor-default transition-all">
              <div className="flex items-center justify-center gap-1.5 text-brand-primary drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                <Clock className="h-3.5 w-3.5 animate-bounce" />
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-white">30 Min Delivery</span>
              </div>
              <p className="text-[8px] sm:text-[9px] font-semibold text-zinc-300 uppercase drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">Realtime fleet</p>
            </motion.div>
            
            <motion.div whileHover={{ y: -2, scale: 1.05 }} className="space-y-0.5 text-center cursor-default transition-all">
              <div className="flex items-center justify-center gap-1.5 text-brand-primary drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-white">Quality Pick</span>
              </div>
              <p className="text-[8px] sm:text-[9px] font-semibold text-zinc-300 uppercase drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">Double-inspected</p>
            </motion.div>
            
            <motion.div whileHover={{ y: -2, scale: 1.05 }} className="space-y-0.5 text-center cursor-default transition-all">
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
