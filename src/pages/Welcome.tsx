import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { ShoppingBag, ArrowRight, Info, ShieldCheck, Clock, Award } from 'lucide-react';
import landingHero from '../assets/images/landing_hero_1781164991277.png';

export default function Welcome() {
  const { t, i18n } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col relative bg-neutral-50 dark:bg-zinc-950 overflow-hidden w-full" id="welcome-page">
      {/* Dynamic Background Image Section - High quality, completely crisp and unblurred */}
      <div className="absolute inset-0 z-0 h-[45vh] md:h-full md:w-1/2 md:right-0 md:left-auto">
        <img 
          src={landingHero} 
          alt="Simba Supermarket Premium Storefront" 
          className="w-full h-full object-cover dark:brightness-90 object-center transition-all duration-700 ease-out"
          referrerPolicy="no-referrer"
        />
        {/* Crisp Gradient Transition overlays to handle high-contrast text rendering */}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-50 via-neutral-50/80 to-transparent dark:from-zinc-950 dark:via-zinc-950/85 md:hidden" />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-50 via-neutral-50/10 to-transparent dark:from-zinc-950 dark:via-zinc-950/20 hidden md:block" />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 z-10 flex items-center pt-[50vh] md:pt-32 pb-16 sm:pb-32">
        <div className="w-full md:w-[48%] flex flex-col justify-center text-left space-y-6 sm:space-y-10">
          
          {/* Welcome Badge */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex"
          >
            <div className="inline-flex items-center gap-3 bg-brand-primary/10 border border-brand-primary/20 hover:border-brand-primary/40 px-5 py-2 rounded-full backdrop-blur-xl transition-all">
              <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] text-brand-primary italic">
                {i18n.language === 'rw' ? 'Murakaza neza i Kigali' : 'Murakaza Neza • A Warm Welcome'}
              </span>
            </div>
          </motion.div>

          {/* Majestic Hero Copy */}
          <div className="space-y-4 sm:space-y-6">
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="text-4xl sm:text-6xl lg:text-7xl font-display font-black tracking-tighter uppercase italic leading-[0.9] text-zinc-90 w-full text-zinc-900 dark:text-white"
            >
              SIMBA <span className="text-brand-primary">SUPERMARKET</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-sm sm:text-base font-bold uppercase tracking-widest text-zinc-500 italic max-w-xl"
            >
              {i18n.language === 'rw' 
                ? 'Guhaza ibikenerwa byanyu bya buri munsi kuva mu 2007. Ibicuruzwa byijejwe ubuziranenge.'
                : 'Meeting your daily requirements with Rwanda’s finest retail resurgence since 2007. Freshness guaranteed.'}
            </motion.p>
          </div>

          {/* Warm Description of Simba */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-zinc-650 dark:text-zinc-300 text-xs sm:text-sm leading-relaxed max-w-xl space-y-4 font-medium"
          >
            <p>
              {i18n.language === 'rw'
                ? 'Kuva dushyira ku mugaragaro ishami rya mbere mu gihugu, ubu Simba imaze kugera ku mashami 11 arenga mu Rwanda. Simba Supermarket Ltd izwiho ibiciro binogeye buri wese n’ubuziranenge buhebuje mu biribwa, ibikoresho byo mu nzu, imyambaro, ibikinisho, n’isuku.'
                : 'Since inaugurating our flagship store, Simba has stood as Rwanda’s premium retail landmark, now proudly serving you across 11 major branches. We bring clean, hand-inspected local freshness and the finest international imports directly to your basket.'}
            </p>
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-brand-primary opacity-90 italic">
              ✦ {i18n.language === 'rw' ? 'Ibyo mutumije bihita bikugeraho mu minota 30 gusa!' : '⚡ Fast-track, temperature-controlled delivery across Kigali in under 30 minutes!'}
            </p>
          </motion.div>

          {/* Call to Actions - Proceed to Shop or About */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 sm:gap-6 pt-4 w-full sm:max-w-md lg:max-w-none"
          >
            <Link 
              to="/shop" 
              className="group bg-brand-primary text-white dark:text-black hover:bg-orange-600 dark:hover:bg-orange-400 py-4.5 px-8 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all duration-300 transform active:scale-98 shadow-xl shadow-brand-primary/20 italic"
              id="welcome-shop-btn"
            >
              <ShoppingBag className="h-5 w-5 group-hover:scale-110 transition-transform" />
              {t('start_shopping')}
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1.5 transition-transform" />
            </Link>

            <Link 
              to="/about" 
              className="group bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 hover:border-brand-primary/50 text-zinc-800 dark:text-white py-4.5 px-8 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all duration-300 transform active:scale-98 italic"
              id="welcome-about-btn"
            >
              <Info className="h-5 w-5 text-brand-primary" />
              {i18n.language === 'rw' ? 'Amakuru Yacu' : 'About Simba'}
            </Link>
          </motion.div>

          {/* Quick Value Preps */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 1 }}
            className="grid grid-cols-3 gap-4 pt-8 border-t border-zinc-200 dark:border-zinc-850 max-w-xl"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-brand-primary">
                <Clock className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-wider">30 Min Delivery</span>
              </div>
              <p className="text-[9px] font-semibold text-zinc-400 uppercase">Realtime fleet</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-brand-primary">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-wider">Quality Pick</span>
              </div>
              <p className="text-[9px] font-semibold text-zinc-400 uppercase">Double-inspected</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-brand-primary">
                <Award className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-wider">11 Branches</span>
              </div>
              <p className="text-[9px] font-semibold text-zinc-400 uppercase">Across Rwanda</p>
            </div>
          </motion.div>

        </div>
      </main>
    </div>
  );
}
