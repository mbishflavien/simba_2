import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { MapPin, Clock, Phone, Mail, Sparkles, Store, Coffee, ShieldCheck, Gamepad2, ChevronDown, HelpCircle } from 'lucide-react';

interface BranchInfo {
  id: string;
  name: string;
  hours: string;
  address: string;
  phone: string;
  features: string[];
  description: string;
  image: string;
}

export default function Branches() {
  const { t, i18n } = useTranslation();
  const [activeFAQ, setActiveFAQ] = useState<number | null>(null);

  const branchesList: BranchInfo[] = [
    {
      id: 'town-center',
      name: 'Simba Centenary (Town Center)',
      hours: 'Open 24/7 (365 Days)',
      address: 'Centenary House, KN 82 St, Kigali City Center',
      phone: '+250 788 345 001',
      features: ['Trucillo Café', 'Decentralized Bakery', 'Premium Butchery', 'Imported Goods Section'],
      description: 'Our flagship and largest retail experience in the heart of Kigali City. Operating non-stop to fulfill all your grocery and luxury needs.',
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600'
    },
    {
      id: 'kigali-heights',
      name: 'Simba Kigali Heights',
      hours: '7:00 AM - 11:30 PM Everyday',
      address: 'Kigali Heights Mall, Floor 1, KG 7 Ave, Kacyiru',
      phone: '+250 788 345 002',
      features: ['Corporate Lounge', 'Premium Imports', 'Self-Checkout Lane', 'Coffee Bar'],
      description: 'A modern, high-tech shopping center nestled in the commercial heart of Kacyiru. Featuring elite customer lounges and organic produce.',
      image: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=600'
    },
    {
      id: 'gisozi',
      name: 'Simba Gisozi',
      hours: '8:00 AM - 10:00 PM Everyday',
      address: 'Gisozi Main Road, Opposite Sector Office, Kigali',
      phone: '+250 788 345 003',
      features: ['Fresh Farm Produce Hub', 'Affordable Family Packs', 'Household Utilities', 'Local Crafts'],
      description: 'Conveniently located for the Gisozi community, offering direct farm-gate fresh produce and affordable household essentials.',
      image: 'https://images.unsplash.com/photo-1554433607-66b5eed9d504?auto=format&fit=crop&q=80&w=600'
    },
    {
      id: 'gacuriro',
      name: 'Simba Gacuriro (Vision City)',
      hours: '7:00 AM - Midnight Everyday',
      address: 'Vision City Commercial Arcade, Gacuriro',
      phone: '+250 788 345 004',
      features: ['Arcade Zone', 'Trucillo Cafe', 'Bulk Grocery Store', 'Home Electronics Hub'],
      description: 'Perfect for family days, this branch blends premium home electronics with arcade games and a state-of-the-art cafe.',
      image: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&q=80&w=600'
    },
    {
      id: 'kimironko',
      name: 'Simba Kimironko',
      hours: '7:00 AM - 11:00 PM',
      address: 'KG 12 Ave, Near Kimironko Market, Kigali',
      phone: '+250 788 345 005',
      features: ['Decentralized Spices Marketplace', 'Rwandan Tea & Coffee Hub', 'Full Bakery'],
      description: 'Serving the energetic neighborhood of Kimironko with rich selections of local and imported spices, fresh artisanal breads, and specialized tea collections.',
      image: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&q=80&w=600'
    },
    {
      id: 'utc',
      name: 'Simba U.T.C (Union Trade Center)',
      hours: 'Open 24/7 (365 Days)',
      address: 'UTC Mall, KN 2 Ave, Kigali City Center',
      phone: '+250 788 345 006',
      features: ['24-Hour Pharmacy Access', 'International Stationery', 'Electronics'],
      description: 'A Kigali retail landmark located inside UTC Mall. Highly convenient with non-stop operations and premium cosmetics selections.',
      image: 'https://images.unsplash.com/photo-1516594798947-e65505dbb29d?auto=format&fit=crop&q=80&w=600'
    }
  ];

  const faqs = [
    {
      q: i18n.language === 'rw' ? "Mbese mukora mu biruhuko rusange cyangwa iminsi mikuru?" : "Do you deliver on public holidays and Sundays?",
      a: i18n.language === 'rw' 
        ? "Yego rwose! Amashami yacu ya Town Center (Centenary) na UTC akora iminsi 7 ku yindi, masaha 24/24 harimo n’iminsi mikuru rusange n’iminsi y’ikiruhuko. Ibyo mutumije hano ku rubuga na byo bihita bikugeraho mu biruhuko mu minota 30 gusa."
        : "Yes, absolutely! Our flagship branches (Simba Town Center and Simba UTC) open 24/7, including on public holidays and Sundays. Online deliveries are fully operational as well, ensuring you get your groceries in under 30 minutes, even on holidays."
    },
    {
      q: i18n.language === 'rw' ? "Nshobora gusubiza imboga nshya cyangwa ibiribwa byangije?" : "Can I return fresh vegetables, fruits, or dairy products?",
      a: i18n.language === 'rw'
        ? "Turinda cyane ireme ry'ibiribwa byacu byose. Mu gihe habaye ikibazo mu byo mwashyikirijwe, mushobora kubigarura mu isaha imwe gusa uhereye igihe mwatumiriye bikagirwa nshya cyangwa mugahabwa amafaranga yanyu."
        : "We take extreme pride in our cold-chain system. If fresh food or dairy is damaged during transportation, please notify us within 1 hour of delivery at care@simba.rw (or via call line +250 788 000 000) for an instant replacement or refund."
    },
    {
      q: i18n.language === 'rw' ? "Igihe mutumirije ibiribwa ku rubuga, biba bivuye mu rihe shami?" : "Which store branch is my online order delivered from?",
      a: i18n.language === 'rw'
        ? "Ibyo mutumije bihita bitokanwa n'amashami yacu yegereye aho muri Kigali kugira ngo bikugereho mu buryo bwihuse kandi bishyuxe ugereranyije n'igihe."
        : "Your order is intelligently routed to the nearest operational Simba branch (e.g., Gacuriro for Kinyinya area, Kigali Heights for Kacyiru) using high-precision geolocation mapping. This ensures fast delivery in under 30 minutes with intact cold-chain safety!"
    },
    {
      q: i18n.language === 'rw' ? "Ni ubuhe buryo bw'ingemu nshobora gukoresha mu kwishyura?" : "Are there alternative offline payment methods?",
      a: i18n.language === 'rw'
        ? "Uretse MTN Mobile Money na Visa/Mastercard kuri murandasi, twakira kandi kwishyura mu ntoki (Cash on Delivery) cyangwa kubyishura ku ntoki mugiye kubifatira ishami (Pay on Collection)."
        : "Yes, you can select Cash on Delivery (CoD) or Pay on Collection (at your chosen branch) during the checkout step. We accept MTN Mobile Money push notifications, credit/debit cards, and physical cash."
    },
    {
      q: i18n.language === 'rw' ? "Ese muha abaguzi inyemezabuguzi?" : "Do you provide printable invoices or receipts?",
      a: i18n.language === 'rw'
        ? "Yego! Mukirangiza kwishyura neza mwijyana mu gice cy'inyemezabuguzi mwashyiriweho kugira ngo muyidinbe (download/print PDF invoice) isange amakuru yanyu yose."
        : "Yes! Upon successful completion of your order, a printable HTML invoice/receipt is instantly generated. You can click 'Download / Print Receipt' on the order success screen to print or save a clean, high-contrast, professional transaction record."
    }
  ];

  const infoEmails = "info@simbasupermarket.rw";
  const contactPhones = "+250 788 000 000 / +250 788 345 001";

  return (
    <div className="min-h-screen pt-32 pb-32">
      {/* Hero section */}
      <section className="max-w-7xl mx-auto px-4 mb-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-6 py-2 bg-brand-primary/10 rounded-full border border-brand-primary/20 mb-8"
        >
          <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-primary italic">
            {i18n.language === 'rw' ? 'AMASHAMI YACU' : 'OUR RETAIL NETWORK'}
          </span>
        </motion.div>
        
        <h1 className="massive-header text-[var(--brand-text)] uppercase italic mb-8 sm:text-[110px] leading-[0.85] tracking-tighter">
          {i18n.language === 'rw' ? 'KIGALI' : 'STORES &'}<br/>
          <span className="text-brand-primary">
            {i18n.language === 'rw' ? 'AMASHAMI' : 'HOURS'}
          </span>
        </h1>
        
        <p className="micro-label max-w-2xl mx-auto opacity-60 leading-relaxed uppercase italic">
          {i18n.language === 'rw'
            ? 'Simba Supermarket imaze imyaka irenga 15 icuruza ibiribwa bifite ireme n’ubuziranenge buhebuje mu bice bitandukanye by’i Kigali. Dufite amashami 11 ahagutse agutegereje.'
            : 'Simba Supermarket has stood as the premier retail hallmark in Kigali since 2007. We operate beautiful, modern brick-and-mortar stores across key nodes alongside high-speed 30-minute residential logistics.'}
        </p>
      </section>

      {/* Grid of branches with hours and features */}
      <section className="max-w-7xl mx-auto px-4 mb-32">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {branchesList.map((branch, index) => (
            <motion.div
              layoutId={`branch-card-${branch.id}`}
              whileHover={{ y: -8 }}
              transition={{ duration: 0.3 }}
              key={branch.id}
              className="card-gradient overflow-hidden flex flex-col justify-between group"
            >
              <div>
                {/* Branch Image */}
                <div className="h-64 overflow-hidden relative">
                  <img 
                    src={branch.image} 
                    alt={branch.name}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 ease-out"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6">
                    <div>
                      <span className="text-[10px] uppercase font-black bg-brand-primary px-3 py-1.5 rounded-md text-white tracking-widest italic flex items-center gap-1.5 w-fit">
                        <Clock className="w-3 h-3" /> {branch.hours}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-8">
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter text-[var(--brand-text)] mb-3 group-hover:text-brand-primary transition-colors">
                    {branch.name}
                  </h3>
                  
                  <div className="flex gap-2.5 items-start text-xs text-[var(--brand-text-muted)] font-bold uppercase tracking-wider mb-6">
                    <MapPin className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
                    <span>{branch.address}</span>
                  </div>

                  <p className="text-xs uppercase font-extrabold text-[var(--brand-text)] opacity-60 leading-relaxed mb-8">
                    {branch.description}
                  </p>
                </div>
              </div>

              {/* Unique Branch Features */}
              <div className="p-8 pt-0 border-t border-brand-border/40 mt-auto bg-black/[0.02] dark:bg-white/[0.02]">
                <div className="mt-6">
                  <p className="text-[9px] font-black tracking-widest text-[#9d9d9d] uppercase mb-3">UNIQUE AMENITIES</p>
                  <div className="flex flex-wrap gap-1.5">
                    {branch.features.map((feature, fIdx) => (
                      <span key={fIdx} className="text-[8px] font-black tracking-wider uppercase px-2.5 py-1 bg-brand-primary/10 text-brand-primary rounded-md">
                        ✦ {feature}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-brand-border/30 flex justify-between items-center">
                  <span className="text-[9px] font-black uppercase opacity-40">Direct Phone:</span>
                  <span className="text-[10px] font-mono font-black text-brand-primary tracking-widest">{branch.phone}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Head Office Highlight / Contact Support */}
      <section className="max-w-7xl mx-auto px-4 mb-32">
        <div className="p-12 sm:p-20 bg-black/5 dark:bg-zinc-950 border border-brand-border rounded-[48px] grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="micro-label bg-brand-primary/10 border border-brand-primary/30 px-4 py-1.5 rounded-full text-brand-primary italic inline-block mb-6">
              {i18n.language === 'rw' ? 'FONDATION SIMBA' : 'FOUNDED IN 2007'}
            </span>
            <h2 className="text-4xl sm:text-5xl font-black italic uppercase tracking-tighter text-[var(--brand-text)] leading-none mb-6">
              {i18n.language === 'rw' ? 'DUHAMAKARE KURI' : 'SIMBA HQ & CONTACT'}
            </h2>
            <p className="text-xs font-bold leading-relaxed opacity-60 uppercase tracking-widest mb-10 leading-loose">
              {i18n.language === 'rw' 
                ? 'Ibitekerezo byanyu ni bimwe mu bidufasha kurushaho gutera imbere. Amashami yacu yose bafite abakozi biteguye guhaka neza abaguzi bacu n’ibibazo byabo.'
                : 'Simba Supermarket (SIMBA SUPERMARKET LTD) is registered and incorporated in Kigali, Rwanda. We offer full-stack catering, butchery, bakeries, stationary, toys, and Trucillo Café franchises.'}
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-brand-primary/15 rounded-xl flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-brand-primary" />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest opacity-40">SUPPORT EMAIL</p>
                  <a href={`mailto:${infoEmails}`} className="text-sm font-black text-brand-primary italic hover:underline uppercase tracking-wide">{infoEmails}</a>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <div className="w-10 h-10 bg-brand-primary/15 rounded-xl flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-brand-primary" />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest opacity-40">CENTRAL DISPATCH HOTLINE</p>
                  <p className="text-sm font-black text-brand-primary tracking-widest">{contactPhones}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-brand-primary/5 border border-brand-primary/10 rounded-[36px] p-8 sm:p-12 text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary opacity-10 rounded-full blur-2xl" />
            <h3 className="text-2xl font-black italic uppercase tracking-tighter text-[var(--brand-text)] mb-6 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-brand-primary" /> Secure Operations
            </h3>
            <ul className="space-y-4 text-xs font-bold uppercase tracking-wider leading-relaxed opacity-60">
              <li>✓ Hand-Inspected Food Safety Guarantee</li>
              <li>✓ Direct Farm-to-Shelf Cold Chain System (Inyange, Kinazi)</li>
              <li>✓ Secure Mobile Money API & Credit Card Checkout</li>
              <li>✓ Rapid delivery from the closest physical branch location</li>
            </ul>
          </div>
        </div>
      </section>

      {/* INERACTIVE FAQ ACCORDION */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-black italic uppercase tracking-tighter text-[var(--brand-text)] leading-none mb-4">
            FREQUENTLY <span className="text-brand-primary">ASKED QUESTIONS</span>
          </h2>
          <p className="micro-label opacity-40 uppercase tracking-widest italic mt-2">COLLAPSIBLE SERVICE FAQ ACCORDIONS</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = activeFAQ === index;
            return (
              <div 
                key={index} 
                className="bg-black/5 dark:bg-white/5 border border-brand-border rounded-[28px] overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => setActiveFAQ(isOpen ? null : index)}
                  className="w-full text-left p-6 sm:p-8 flex items-center justify-between gap-4 select-none outline-none focus:text-brand-primary transition-colors"
                >
                  <div className="flex gap-4 items-center">
                    <HelpCircle className="w-6 h-6 text-brand-primary shrink-0 opacity-80" />
                    <span className="font-extrabold italic uppercase tracking-tight text-sm sm:text-base text-[var(--brand-text)]">
                      {faq.q}
                    </span>
                  </div>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="shrink-0 text-zinc-400"
                  >
                    <ChevronDown className="w-5 h-5" />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                      <div className="p-8 pt-0 text-xs sm:text-sm text-[var(--brand-text)] opacity-70 font-semibold leading-relaxed border-t border-brand-border/30 bg-black/[0.01]">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
