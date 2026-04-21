import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Mail, Phone, MapPin, Truck, ShieldCheck, Clock, CreditCard, Smartphone, HelpCircle } from 'lucide-react';

export function ContactSupport() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen pt-32 pb-20 max-w-4xl mx-auto px-4">
      <h1 className="massive-header mb-12 text-[var(--brand-text)] uppercase italic">
        CONTACT <span className="text-brand-primary">SUPPORT</span>
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="card-gradient p-8 text-left">
          <Phone className="h-8 w-8 text-brand-primary mb-6" />
          <h3 className="text-xl font-black uppercase italic mb-4 text-[var(--brand-text)]">Call Us</h3>
          <p className="text-sm opacity-60 font-bold uppercase tracking-widest">+250 788 000 000</p>
          <p className="text-xs opacity-40 mt-2">Available 24/7 for delivery support.</p>
        </div>
        <div className="card-gradient p-8 text-left">
          <Mail className="h-8 w-8 text-brand-primary mb-6" />
          <h3 className="text-xl font-black uppercase italic mb-4 text-[var(--brand-text)]">Email</h3>
          <p className="text-sm opacity-60 font-bold uppercase tracking-widest">info@simbasupermarket.rw</p>
          <p className="text-xs opacity-40 mt-2">Feedback and bulk order inquiries.</p>
        </div>
      </div>
      <div className="mt-12 card-gradient p-8 text-left">
        <MapPin className="h-8 w-8 text-brand-primary mb-6" />
        <h3 className="text-xl font-black uppercase italic mb-4 text-[var(--brand-text)]">Visit HQ</h3>
        <p className="text-sm opacity-60 font-bold uppercase tracking-widest leading-relaxed">
          KN 34 Street, Kiyovu, Kigali, Nyarugenge District.<br/>U.T.C Building, 5th Floor
        </p>
      </div>
    </div>
  );
}

export function DeliveryTC() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen pt-32 pb-20 max-w-4xl mx-auto px-4">
      <h1 className="massive-header mb-12 text-[var(--brand-text)] uppercase italic text-left">
        DELIVERY <span className="text-brand-primary">T&C</span>
      </h1>
      <div className="space-y-8">
        <div className="flex gap-6 items-start text-left">
          <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center shrink-0 border border-brand-primary/20">
            <Clock className="h-6 w-6 text-brand-primary" />
          </div>
          <div>
            <h3 className="text-lg font-black uppercase italic text-[var(--brand-text)]">30-Minute Speed</h3>
            <p className="text-sm opacity-50 leading-relaxed font-bold uppercase tracking-tight">We guarantee delivery within 30 minutes for addresses within Kigali city limits. Delays due to weather or traffic will be communicated.</p>
          </div>
        </div>
        <div className="flex gap-6 items-start text-left">
          <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center shrink-0 border border-brand-primary/20">
            <Truck className="h-6 w-6 text-brand-primary" />
          </div>
          <div>
            <h3 className="text-lg font-black uppercase italic text-[var(--brand-text)]">Delivery Radius</h3>
            <p className="text-sm opacity-50 leading-relaxed font-bold uppercase tracking-tight">Currently serving Nyarugenge, Gasabo, and Kicukiro. Rural areas may incur additional fees.</p>
          </div>
        </div>
        <div className="flex gap-6 items-start text-left">
          <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center shrink-0 border border-brand-primary/20">
            <ShieldCheck className="h-6 w-6 text-brand-primary" />
          </div>
          <div>
            <h3 className="text-lg font-black uppercase italic text-[var(--brand-text)]">Safety & Integrity</h3>
            <p className="text-sm opacity-50 leading-relaxed font-bold uppercase tracking-tight">All fresh items are hand-inspected. Customers have the right to refuse items at the point of delivery if quality is not met.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MoMoGuide() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen pt-32 pb-20 max-w-4xl mx-auto px-4">
      <h1 className="massive-header mb-12 text-[var(--brand-text)] uppercase italic text-left">
        MOMO <span className="text-brand-primary">GUIDE</span>
      </h1>
      <div className="bg-brand-primary/10 border-2 border-brand-primary/30 p-8 rounded-3xl mb-12 text-left">
        <h3 className="text-2xl font-black uppercase italic text-brand-primary mb-4">SIMBA MERCHANT CODE</h3>
        <p className="text-4xl font-black tracking-widest text-[var(--brand-text)] italic">123456</p>
        <p className="text-xs opacity-50 mt-4 font-bold uppercase">Use this if paying via dial-in code.</p>
      </div>
      <div className="space-y-12 text-left">
        <div className="space-y-4">
          <h3 className="text-xl font-black uppercase italic text-[var(--brand-text)] border-b border-brand-border pb-2">Easy App Checkout</h3>
          <p className="text-sm opacity-60 font-bold uppercase tracking-tight leading-relaxed">
            1. Enter your MoMo number during checkout.<br/>
            2. Receive a push notification on your phone.<br/>
            3. Enter your PIN and confirm.<br/>
            4. Wait for the app to detect 'Payment Confirmed' automatically.
          </p>
        </div>
        <div className="space-y-4">
          <h3 className="text-xl font-black uppercase italic text-[var(--brand-text)] border-b border-brand-border pb-2">Manual Dial-In</h3>
          <p className="text-sm opacity-60 font-bold uppercase tracking-tight leading-relaxed">
            1. Dial *182#<br/>
            2. Select 'Pay Merchant'<br/>
            3. Enter Merchant Code: <span className="text-brand-primary">123456</span><br/>
            4. Enter Amount and confirm with PIN.
          </p>
        </div>
      </div>
    </div>
  );
}
