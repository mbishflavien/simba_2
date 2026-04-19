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
    <footer className="bg-black/5 dark:bg-black border-t border-brand-border dark:border-white/10 text-[var(--brand-text)] mt-20">
      <div className="max-w-7xl mx-auto px-4 py-16 sm:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 sm:gap-16">
          {/* Brand Info */}
          <div className="space-y-6 text-left">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center">
                <span className="text-white dark:text-black font-black text-lg italic">S</span>
              </div>
              <span className="font-display font-bold text-lg tracking-tight uppercase italic">
                SIMBA <span className="text-brand-primary">SUPERMARKET</span>
              </span>
            </div>
            <p className="opacity-60 text-sm leading-relaxed font-bold uppercase tracking-tight italic">
              Rwanda's most popular online supermarket. Quality products delivered fast to your doorstep.
            </p>
            <div className="flex gap-4">
              <a href="https://www.facebook.com/simbasupermarket/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-black/5 dark:bg-zinc-800 rounded-xl flex items-center justify-center hover:bg-brand-primary hover:text-white dark:hover:text-black transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://www.instagram.com/simba_supermarket/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-black/5 dark:bg-zinc-800 rounded-xl flex items-center justify-center hover:bg-brand-primary hover:text-white dark:hover:text-black transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://x.com/SimbaRwanda" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-black/5 dark:bg-zinc-800 rounded-xl flex items-center justify-center hover:bg-brand-primary hover:text-white dark:hover:text-black transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="text-left">
            <h4 className="font-bold mb-6 uppercase tracking-widest text-xs opacity-40">{t('categories')}</h4>
            <ul className="space-y-4 opacity-60 text-sm font-bold uppercase tracking-tight italic">
              <li><a href="#" className="hover:text-brand-primary transition-colors">Food Products</a></li>
              <li><a href="#" className="hover:text-brand-primary transition-colors">Personal Care</a></li>
              <li><a href="#" className="hover:text-brand-primary transition-colors">Electronics</a></li>
              <li><a href="#" className="hover:text-brand-primary transition-colors">Baby Care</a></li>
            </ul>
          </div>

          {/* Support */}
          <div className="text-left">
            <h4 className="font-bold mb-6 uppercase tracking-widest text-xs text-[var(--brand-text-muted)] opacity-80">{t('support')}</h4>
            <ul className="space-y-4 opacity-70 text-sm font-bold uppercase tracking-tight italic">
              <li><Link to="/about" className="hover:text-brand-primary transition-colors">{t('about_us')}</Link></li>
              <li><a href="#" className="hover:text-brand-primary transition-colors">{t('contact_support')}</a></li>
              <li><a href="#" className="hover:text-brand-primary transition-colors">{t('delivery_tc')}</a></li>
              <li><a href="#" className="hover:text-brand-primary transition-colors">{t('momo_guide')}</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-6 text-left">
            <h4 className="font-bold mb-6 uppercase tracking-widest text-xs text-[var(--brand-text-muted)] opacity-80">{t('location')}</h4>
            <div className="space-y-4 text-sm opacity-70 font-bold uppercase tracking-tight italic">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-brand-primary shrink-0" />
                <span>KN 34 Street, Kiyovu, Kigali, Nyarugenge District.<br/>U.T.C Building, 5th Floor</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-brand-primary shrink-0" />
                <span>+250 788 000 000</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-brand-primary shrink-0" />
                <span>info@Simbasupermarket.rw</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Banner */}
        <div className="mt-16 sm:mt-24 pt-8 border-t border-brand-border dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-8">
             <div className="flex items-center gap-2 text-xs opacity-30 uppercase tracking-widest font-bold">
               <Truck className="h-4 w-4" />
               {t('daily_delivery')}
             </div>
             <div className="flex items-center gap-2 text-xs opacity-30 uppercase tracking-widest font-bold">
               <CreditCard className="h-4 w-4" />
               {t('momo_accepted')}
             </div>
          </div>
          <p className="opacity-30 text-xs font-black uppercase tracking-widest italic">
            &copy; {new Date().getFullYear()} Simba Supermarket.
          </p>
        </div>
      </div>
    </footer>
  );
}
