import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Facebook, 
  Instagram, 
  Twitter, 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard,
  Truck
} from 'lucide-react';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-zinc-950 border-t border-white/10 text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 py-16 sm:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 sm:gap-16">
          {/* Brand Info */}
          <div className="space-y-8 text-left">
            <Link to="/" className="flex items-center gap-3 group">
              <img 
                src="https://isokko.com/m/media/upload/photos/2024/10/Untitleddesign6_6712450111ff0.png" 
                alt="Simba Logo" 
                className="h-10 sm:h-12 w-auto object-contain brightness-110 group-hover:scale-105 transition-transform"
                referrerPolicy="no-referrer"
              />
              <div className="flex flex-col">
                <span className="font-display font-black text-xl tracking-tighter uppercase italic text-white leading-[0.8]">
                  SIMBA
                </span>
                <span className="text-brand-primary font-black text-[8px] tracking-[0.3em] uppercase leading-none ml-0.5">
                  SUPERMARKET
                </span>
              </div>
            </Link>
            <p className="text-sm leading-relaxed font-bold uppercase tracking-tight italic text-zinc-400">
              {t('footer_desc')}
            </p>
            <div className="flex gap-4">
              <a href="https://www.facebook.com/simbasupermarket/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center hover:bg-brand-primary hover:text-black transition-colors text-white">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://www.instagram.com/simba_supermarket/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center hover:bg-brand-primary hover:text-black transition-colors text-white">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://x.com/SimbaRwanda" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center hover:bg-brand-primary hover:text-black transition-colors text-white">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="text-left">
            <h4 className="font-black mb-8 uppercase tracking-[0.3em] text-[10px] text-brand-primary">{t('categories')}</h4>
            <ul className="space-y-4 text-sm font-bold uppercase tracking-tight italic text-zinc-100">
              <li><Link to="/?search=Food" className="hover:text-brand-primary transition-colors hover:translate-x-1 inline-block transform duration-300">Food Products</Link></li>
              <li><Link to="/?search=Personal" className="hover:text-brand-primary transition-colors hover:translate-x-1 inline-block transform duration-300">Personal Care</Link></li>
              <li><Link to="/?search=Kitchen" className="hover:text-brand-primary transition-colors hover:translate-x-1 inline-block transform duration-300">Electronics</Link></li>
              <li><Link to="/?search=Baby" className="hover:text-brand-primary transition-colors hover:translate-x-1 inline-block transform duration-300">Baby Care</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div className="text-left">
            <h4 className="font-black mb-8 uppercase tracking-[0.3em] text-[10px] text-brand-primary">{t('support')}</h4>
            <ul className="space-y-4 text-sm font-bold uppercase tracking-tight italic text-zinc-100">
              <li><Link to="/about" className="hover:text-brand-primary transition-colors hover:translate-x-1 inline-block transform duration-300">{t('about_us')}</Link></li>
              <li><Link to="/support/contact" className="hover:text-brand-primary transition-colors hover:translate-x-1 inline-block transform duration-300">{t('contact_support')}</Link></li>
              <li><Link to="/support/delivery" className="hover:text-brand-primary transition-colors hover:translate-x-1 inline-block transform duration-300">{t('delivery_tc')}</Link></li>
              <li><Link to="/support/momo-guide" className="hover:text-brand-primary transition-colors hover:translate-x-1 inline-block transform duration-300">{t('momo_guide')}</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-8 text-left">
            <h4 className="font-black mb-8 uppercase tracking-[0.3em] text-[10px] text-brand-primary">{t('location')}</h4>
            <div className="space-y-6 text-sm font-bold uppercase tracking-tight italic text-zinc-100">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-brand-primary shrink-0" />
                <span className="leading-relaxed">KN 34 Street, Kiyovu, Kigali, Nyarugenge District.<br/><span className="text-brand-primary not-italic tracking-widest text-[10px]">U.T.C Building, 5th Floor</span></span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-brand-primary shrink-0" />
                <span>+250 788 000 000</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-brand-primary shrink-0" />
                <span className="lowercase">info@simbasupermarket.rw</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Banner */}
          <div className="mt-16 sm:mt-24 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-6 text-zinc-400">
          <div className="flex items-center gap-8">
             <div className="flex items-center gap-2 text-xs opacity-60 uppercase tracking-widest font-bold">
               <Truck className="h-4 w-4" />
               {t('daily_delivery')}
             </div>
             <div className="flex items-center gap-2 text-xs opacity-60 uppercase tracking-widest font-bold">
               <CreditCard className="h-4 w-4" />
               {t('momo_accepted')}
             </div>
          </div>
          <p className="opacity-60 text-xs font-black uppercase tracking-widest italic">
            &copy; {new Date().getFullYear()} Simba Supermarket.
          </p>
        </div>
      </div>
    </footer>
  );
}
