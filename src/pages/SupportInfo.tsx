import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Mail, Phone, MapPin, Truck, ShieldCheck, Clock, CreditCard, Smartphone, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export function ContactSupport() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen pt-32 pb-32 max-w-7xl mx-auto px-4">
      <div className="max-w-4xl mx-auto mb-24 text-center">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="inline-flex items-center gap-2 px-6 py-2 bg-brand-primary/10 rounded-full border border-brand-primary/20 mb-8"
        >
          <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-primary italic">Connected Center</span>
        </motion.div>
        <h1 className="massive-header text-[var(--brand-text)] uppercase italic mb-8 sm:text-[120px] leading-[0.85]">
          GET IN <br /><span className="text-brand-primary">TOUCH</span>
        </h1>
        <p className="micro-label max-w-xl mx-auto opacity-60 leading-relaxed uppercase italic">
          Experience Simba's unmatched hospitality and support. Our logistics team is active 24/7 across the Kigali metropolitan zone.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <motion.div 
          whileHover={{ y: -10 }}
          className="card-gradient p-12 text-left group"
        >
          <div className="w-16 h-16 bg-brand-primary/10 rounded-3xl flex items-center justify-center mb-8 group-hover:bg-brand-primary group-transition-colors">
            <Phone className="h-8 w-8 text-brand-primary group-hover:text-white transition-colors" />
          </div>
          <h3 className="text-2xl font-black uppercase italic mb-4 text-[var(--brand-text)] tracking-tighter">Line Alpha</h3>
          <p className="text-xl font-display font-black tracking-widest text-brand-primary">+250 788 000 000</p>
          <p className="text-[10px] uppercase font-bold opacity-40 mt-4 leading-relaxed tracking-widest leading-loose">Primary logistics & delivery coordination. Real-time fleet tracking.</p>
        </motion.div>

        <motion.div 
          whileHover={{ y: -10 }}
          className="card-gradient p-12 text-left group"
        >
          <div className="w-16 h-16 bg-brand-primary/10 rounded-3xl flex items-center justify-center mb-8 group-hover:bg-brand-primary group-transition-colors">
            <Mail className="h-8 w-8 text-brand-primary group-hover:text-white transition-colors" />
          </div>
          <h3 className="text-2xl font-black uppercase italic mb-4 text-[var(--brand-text)] tracking-tighter">Support Node</h3>
          <p className="text-xl font-display font-black tracking-widest text-brand-primary">care@simba.rw</p>
          <p className="text-[10px] uppercase font-bold opacity-40 mt-4 leading-relaxed tracking-widest leading-loose">Corporate inquiries, bulk logistics, and vendor partnership support.</p>
        </motion.div>

        <motion.div 
          whileHover={{ y: -10 }}
          className="card-gradient p-12 text-left group"
        >
          <div className="w-16 h-16 bg-brand-primary/10 rounded-3xl flex items-center justify-center mb-8 group-hover:bg-brand-primary group-transition-colors">
            <MapPin className="h-8 w-8 text-brand-primary group-hover:text-white transition-colors" />
          </div>
          <h3 className="text-2xl font-black uppercase italic mb-4 text-[var(--brand-text)] tracking-tighter">Command HQ</h3>
          <p className="text-[10px] font-black uppercase tracking-widest leading-loose text-zinc-500">
            KN 34 Street, Kiyovu, Kigali.<br/>U.T.C Building, 5th Floor
          </p>
          <button className="mt-8 text-[10px] font-black uppercase tracking-widest text-brand-primary hover:underline italic">Open Map Integration →</button>
        </motion.div>
      </div>
    </div>
  );
}

export function DeliveryTC() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen pt-32 pb-32 max-w-7xl mx-auto px-4">
      <div className="max-w-4xl mb-24 text-left">
        <div className="inline-flex items-center gap-2 px-6 py-2 bg-brand-primary/10 rounded-full border border-brand-primary/20 mb-8">
          <Truck className="h-3 w-3 text-brand-primary" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-primary italic">Logistics Matrix</span>
        </div>
        <h1 className="massive-header text-[var(--brand-text)] uppercase italic mb-12 sm:text-[120px] leading-[0.85]">
          KIGALI <br /><span className="text-brand-primary">LOGISTICS</span>
        </h1>
        <p className="micro-label max-w-xl opacity-60 leading-relaxed uppercase italic">
          Standardized delivery protocols to ensure the integrity of the cold chain and freshness of every single item.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
        <div className="space-y-16">
          <div className="flex gap-10 items-start group">
            <div className="w-20 h-20 bg-brand-primary/10 rounded-[32px] flex items-center justify-center shrink-0 border-2 border-brand-primary/20 group-hover:bg-brand-primary transition-all duration-500">
              <Clock className="h-10 w-10 text-brand-primary group-hover:text-white transition-colors" />
            </div>
            <div>
              <h3 className="text-3xl font-black uppercase italic text-[var(--brand-text)] tracking-tighter mb-4">30-Min Pulse</h3>
              <p className="text-sm opacity-50 leading-loose font-bold uppercase tracking-tight italic">
                Our fleet is decentralized across Kigali's key nodes. We guarantee arrival within 30 minutes for Zone 1/2.
              </p>
            </div>
          </div>

          <div className="flex gap-10 items-start group text-left">
            <div className="w-20 h-20 bg-brand-primary/10 rounded-[32px] flex items-center justify-center shrink-0 border-2 border-brand-primary/20 group-hover:bg-brand-primary transition-all duration-500">
              <ShieldCheck className="h-10 w-10 text-brand-primary group-hover:text-white transition-colors" />
            </div>
            <div>
              <h3 className="text-3xl font-black uppercase italic text-[var(--brand-text)] tracking-tighter mb-4">Cold-Chain Guard</h3>
              <p className="text-sm opacity-50 leading-loose font-bold uppercase tracking-tight italic">
                All fresh items are transported in temperature-controlled vessels. Relentless quality control since 1997.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-black/5 dark:bg-white/5 border border-brand-border rounded-[64px] p-16 flex flex-col justify-center">
           <MapPin className="h-12 w-12 text-brand-primary mb-12" />
           <h4 className="text-2xl font-black uppercase italic mb-6">Zone Awareness</h4>
           <div className="space-y-4">
              <div className="flex justify-between items-center py-4 border-b border-brand-border">
                 <span className="text-xs font-black uppercase italic">Zone 1 (Kigali Core)</span>
                 <span className="text-[10px] font-black text-brand-primary">30 MINS</span>
              </div>
              <div className="flex justify-between items-center py-4 border-b border-brand-border">
                 <span className="text-xs font-black uppercase italic">Zone 2 (Outer Kigali)</span>
                 <span className="text-[10px] font-black text-brand-primary">45 MINS</span>
              </div>
              <div className="flex justify-between items-center py-4 border-b border-brand-border opacity-30">
                 <span className="text-xs font-black uppercase italic">Zone 3 (Rural)</span>
                 <span className="text-[10px] font-black">SCHEDULED</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

export function MoMoGuide() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen pt-32 pb-32 max-w-7xl mx-auto px-4">
      <div className="max-w-4xl mx-auto text-center mb-24">
        <div className="inline-flex items-center gap-2 px-6 py-2 bg-brand-primary/10 rounded-full border border-brand-primary/20 mb-8">
          <Smartphone className="h-3 w-3 text-brand-primary" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-primary italic">Financial Protocol</span>
        </div>
        <h1 className="massive-header text-[var(--brand-text)] uppercase italic mb-12 sm:text-[120px] leading-[0.85]">
          MOMO <br /><span className="text-brand-primary">MATRIX</span>
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-brand-primary p-12 sm:p-20 rounded-[80px] text-white flex flex-col justify-center relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full translate-x-1/2 -translate-y-1/2" />
          <h3 className="text-3xl font-black uppercase italic mb-12 relative z-10 leading-none">MERCHANT <br/>CODE</h3>
          <p className="text-8xl sm:text-[140px] font-display font-black tracking-[-0.05em] leading-none mb-8 relative z-10 italic">
            123456
          </p>
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/20 rounded-full backdrop-blur-xl w-fit relative z-10">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-widest italic">Verified Simba Merchant</span>
          </div>
        </motion.div>

        <div className="flex flex-col justify-center space-y-12 px-8">
          <div className="space-y-4 border-l-4 border-brand-primary pl-10">
            <h3 className="text-2xl font-black uppercase italic text-[var(--brand-text)]">Instant Flow</h3>
            <p className="text-sm opacity-50 font-bold uppercase tracking-widest leading-loose italic">
              Our system is directly integrated with MTN API. As soon as you enter your PIN, the order shifts to 'Processing' automatically.
            </p>
          </div>
          
          <div className="space-y-4 border-l-4 border-zinc-200 dark:border-white/10 pl-10">
            <h3 className="text-2xl font-black uppercase italic text-[var(--brand-text)]">Safety First</h3>
            <p className="text-sm opacity-50 font-bold uppercase tracking-widest leading-loose italic">
              All transactions are encrypted. We never see your PIN. Mobile Money is the pulse of the digital nation.
            </p>
          </div>

          <Link to="/cart" className="w-fit px-12 py-6 bg-black dark:bg-white text-white dark:text-black rounded-full font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-transform shadow-2xl">
            Test Checkout Ready →
          </Link>
        </div>
      </div>
    </div>
  );
}
