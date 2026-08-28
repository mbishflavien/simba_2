import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight, Leaf, ShieldCheck, Zap } from 'lucide-react';
import FluidGradientMesh from './FluidGradientMesh';

interface FluidDiscoveryBannerProps {
  onExplore?: () => void;
}

export default function FluidDiscoveryBanner({ onExplore }: FluidDiscoveryBannerProps) {
  return (
    <section className="my-24 relative overflow-hidden rounded-[36px] sm:rounded-[48px] border border-white/20 dark:border-white/10 shadow-2xl shadow-black/10">
      {/* Background Interactive Fluid Marble Canvas */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <FluidGradientMesh intensity={0.9} speed={1.1} interactive={true} />
        {/* Subtle glass vignette overlay to harmonize with both light and dark themes */}
        <div className="absolute inset-0 bg-white/30 dark:bg-black/45 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-r from-white/80 via-white/40 to-transparent dark:from-black/85 dark:via-black/50 dark:to-transparent" />
      </div>

      {/* Foreground Content */}
      <div className="relative z-10 p-8 sm:p-14 lg:p-16 max-w-2xl flex flex-col items-start space-y-6">
        <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-emerald-800/15 dark:bg-emerald-400/15 border border-emerald-600/30 text-emerald-800 dark:text-emerald-300 backdrop-blur-md">
          <Leaf className="h-3.5 w-3.5" />
          <span className="text-[10px] font-black uppercase tracking-[0.25em] italic">
            Rwanda Farm-Direct Reserve
          </span>
        </div>

        <div className="space-y-3">
          <h3 className="font-display font-black text-3xl sm:text-5xl uppercase italic tracking-tight text-zinc-950 dark:text-white leading-[0.95]">
            VIBRANT FRESHNESS,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-brand-primary to-amber-500 dark:from-emerald-400 dark:via-orange-400 dark:to-amber-300">
              DAILY HARVEST
            </span>
          </h3>
          <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-200 font-medium leading-relaxed max-w-lg">
            Experience organic avocados, fresh highland greens, sun-ripened tropical fruits, and hand-kneaded artisanal bakery goods inspected every sunrise across our 11 Kigali locations.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full pt-2">
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-white/60 dark:bg-black/40 backdrop-blur-md border border-black/5 dark:border-white/10">
            <Zap className="h-4 w-4 text-brand-primary flex-shrink-0" />
            <div>
              <p className="text-[9px] font-black uppercase tracking-wider text-zinc-900 dark:text-white">Cold Fleet</p>
              <p className="text-[8px] text-zinc-500 dark:text-zinc-400">Fresh & Chilled</p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-2xl bg-white/60 dark:bg-black/40 backdrop-blur-md border border-black/5 dark:border-white/10">
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <div>
              <p className="text-[9px] font-black uppercase tracking-wider text-zinc-900 dark:text-white">Certified</p>
              <p className="text-[8px] text-zinc-500 dark:text-zinc-400">100% Quality Pick</p>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 flex items-center gap-2 p-3 rounded-2xl bg-white/60 dark:bg-black/40 backdrop-blur-md border border-black/5 dark:border-white/10">
            <Sparkles className="h-4 w-4 text-amber-500 flex-shrink-0" />
            <div>
              <p className="text-[9px] font-black uppercase tracking-wider text-zinc-900 dark:text-white">Best Value</p>
              <p className="text-[8px] text-zinc-500 dark:text-zinc-400">Direct Prices</p>
            </div>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.04, y: -2 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => {
            if (onExplore) {
              onExplore();
            } else {
              document.getElementById('market')?.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          className="group bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 px-7 py-3 rounded-full font-black text-xs uppercase tracking-[0.18em] italic flex items-center gap-3 shadow-xl transition-all cursor-pointer"
        >
          <span>Explore Fresh Aisles</span>
          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
        </motion.button>
      </div>
    </section>
  );
}
