import React, { useState } from 'react';
import { useCart } from '../hooks/useCart';
import { formatCurrency, cn } from '../lib/utils';
import { Trash2, Plus, Minus, ArrowLeft, CreditCard, RefreshCcw, Smartphone, CheckCircle, Wifi } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, totalPrice, totalItems, clearCart } = useCart();
  const { t } = useTranslation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'method' | 'momo' | 'card' | 'waiting'>('cart');
  const [paymentMethod, setPaymentMethod] = useState<'momo' | 'card'>('momo');
  const [phoneNumber, setPhoneNumber] = useState('078');
  const [address, setAddress] = useState('');
  const [cardType, setCardType] = useState<'visa' | 'mastercard'>('visa');
  const [cardData, setCardData] = useState({ number: '', expiry: '', cvv: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateCard = () => {
    const errors: Record<string, string> = {};
    const cleanNumber = cardData.number.replace(/\s+/g, '');
    
    if (!/^\d{16}$/.test(cleanNumber)) {
      errors.number = 'Invalid card number (16 digits required)';
    }
    
    if (!/^\d{2}\/\d{2}$/.test(cardData.expiry)) {
      errors.expiry = 'Use MM/YY format';
    } else {
      const [m, y] = cardData.expiry.split('/').map(Number);
      if (m < 1 || m > 12) errors.expiry = 'Invalid month';
    }
    
    if (!/^\d{3}$/.test(cardData.cvv)) {
      errors.cvv = '3 digits';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCheckout = () => {
    setCheckoutStep('method');
  };

  const startPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) {
      setFormErrors({ address: t('address_required') });
      return;
    }
    setFormErrors({});
    if (paymentMethod === 'momo') {
      setCheckoutStep('momo');
    } else {
      setCheckoutStep('card');
    }
  };

  const confirmMomo = (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutStep('waiting');
    // Simulate waiting for MoMo confirmation
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      clearCart();
    }, 4500);
  };

  const confirmCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCard()) return;
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      clearCart();
    }, 3000);
  };

  if (isSuccess) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-32 text-center text-[var(--brand-text)]">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-24 h-24 bg-brand-primary rounded-full flex items-center justify-center mx-auto mb-8"
        >
          <CreditCard className="h-10 w-10 text-white dark:text-black" />
        </motion.div>
        <h2 className="massive-header mb-8 tracking-widest leading-none text-[var(--brand-text)]">{t('order_received')}!</h2>
        <p className="opacity-60 mb-10 text-lg font-black uppercase tracking-widest italic text-[var(--brand-text)]">{t('kigali_delivery')}.</p>
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 bg-brand-primary text-white dark:text-black px-12 py-5 rounded-full font-black uppercase tracking-widest hover:bg-orange-600 dark:hover:bg-orange-400 transition-colors shadow-2xl shadow-brand-primary/20"
        >
          {t('track_order')}
        </Link>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-32 text-center">
        <h2 className="massive-header text-[var(--brand-text)] opacity-20 mb-8 uppercase italic">{t('empty_cart_title')}</h2>
        <p className="micro-label mb-12 !opacity-60">{t('empty_cart_message')}</p>
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 border border-brand-border text-[var(--brand-text)] px-10 py-4 rounded-full font-black uppercase tracking-widest hover:bg-brand-primary hover:text-white dark:hover:text-black transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('back_to_shop')}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-16 sm:py-24">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-16 px-4">
        <div>
          <h1 className="text-6xl sm:text-8xl font-black tracking-tighter uppercase italic leading-none text-[var(--brand-text)]">
            YOUR <span className="text-brand-primary">{t('cart')}</span>
          </h1>
          <p className="micro-label mt-4 uppercase">
            {t('checkout_ready')} — {totalItems} {t('items')}
          </p>
        </div>
        <Link to="/" className="text-[var(--brand-text-muted)] hover:text-brand-primary micro-label flex items-center gap-2 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          {t('back_to_shop')}
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 sm:gap-20 items-start">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence mode="popLayout">
            {cart.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="card-gradient p-6 sm:p-8 flex gap-8 items-center group"
              >
                <div className="w-24 h-24 sm:w-40 sm:h-40 bg-black/5 dark:bg-black rounded-[30px] overflow-hidden shrink-0 flex items-center justify-center">
                  <img src={item.image} alt={item.name} className="w-full h-full object-contain p-4 grayscale group-hover:grayscale-0 transition-all duration-500" referrerPolicy="no-referrer" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div>
                      <p className="micro-label mb-2 uppercase tracking-widest text-[10px] !opacity-60">{item.category}</p>
                      <h3 className="font-black text-[var(--brand-text)] text-xl sm:text-2xl tracking-tight leading-none truncate italic uppercase">{item.name}</h3>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="p-2 text-[var(--brand-text-muted)] hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-6 w-6" />
                    </button>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4 bg-black/5 dark:bg-black border border-brand-border dark:border-white/10 rounded-full p-1.5 px-4 font-black">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="opacity-40 hover:opacity-100 transition-opacity"
                      >
                         -
                      </button>
                      <span className="text-sm">{item.quantity}</span>
                      <button 
                         onClick={() => updateQuantity(item.id, item.quantity + 1)}
                         className="opacity-40 hover:opacity-100 transition-opacity"
                      >
                         +
                      </button>
                    </div>
                    <p className="text-2xl font-black italic tracking-tighter text-[var(--brand-text)]">
                      {(item.price * item.quantity).toLocaleString()} <span className="text-[10px] not-italic font-bold opacity-30 tracking-widest uppercase">RWF</span>
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Summary / Checkout Procedure */}
        <div className="lg:col-span-1">
          <div className="bg-black/5 dark:bg-white/5 border border-brand-border dark:border-white/10 p-10 rounded-[40px] sticky top-32">
            {checkoutStep === 'cart' && (
              <>
                <h2 className="text-2xl font-black mb-10 uppercase tracking-tighter italic text-[var(--brand-text)] leading-none">
                  {t('checkout')}<span className="text-brand-primary">.</span>
                </h2>
                
                <div className="space-y-6 mb-12">
                  <div className="flex justify-between micro-label uppercase tracking-widest !opacity-60">
                    <span>{t('items')}</span>
                    <span className="text-[var(--brand-text)]">{formatCurrency(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between micro-label uppercase tracking-widest !opacity-60">
                    <span>{t('logistics')}</span>
                    <span className={cn("text-[var(--brand-text)]", totalPrice > 50000 && "text-brand-primary font-black")}>
                      {totalPrice > 50000 ? "FREE" : formatCurrency(2000)}
                    </span>
                  </div>
                  <div className="pt-6 border-t border-brand-border dark:border-white/10 flex justify-between items-end">
                    <span className="font-black uppercase tracking-tighter italic text-[var(--brand-text)]">{t('total')}</span>
                    <span className="text-4xl font-black text-brand-primary tracking-tighter italic">
                      {(totalPrice + (totalPrice > 50000 ? 0 : 2000)).toLocaleString()}
                    </span>
                  </div>
                </div>

                <button 
                  onClick={handleCheckout}
                  className="w-full bg-brand-primary hover:bg-orange-600 dark:hover:bg-orange-400 text-white dark:text-black py-6 rounded-full font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-2xl shadow-brand-primary/20 active:scale-95 italic"
                >
                  <CreditCard className="h-5 w-5 font-black" />
                  {t('pay_with_momo')}
                </button>
              </>
            )}

            {checkoutStep === 'method' && (
              <div className="space-y-8">
                 <h2 className="text-2xl font-black uppercase tracking-tighter italic text-[var(--brand-text)] leading-none mb-8">
                    {t('shipping_address')}<span className="text-brand-primary">.</span>
                 </h2>

                 <div className="space-y-4 text-left mb-8">
                    <label className="micro-label uppercase tracking-widest block ml-4">{t('shipping_address')}</label>
                    <textarea 
                      required
                      rows={2}
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      placeholder={t('enter_address')}
                      className={cn(
                        "w-full bg-black/5 dark:bg-white/5 border rounded-3xl py-4 px-6 text-sm font-bold text-[var(--brand-text)] outline-none transition-colors resize-none",
                        formErrors.address ? "border-red-500" : "border-brand-border dark:border-white/10 focus:border-brand-primary"
                      )}
                    />
                    {formErrors.address && <p className="text-[10px] text-red-500 font-bold uppercase ml-4">{formErrors.address}</p>}
                 </div>

                 <h2 className="text-2xl font-black uppercase tracking-tighter italic text-[var(--brand-text)] leading-none mb-4">
                    {t('payment_method')}<span className="text-brand-primary">.</span>
                 </h2>
                 <div className="grid grid-cols-1 gap-4">
                    <button 
                      onClick={() => setPaymentMethod('momo')}
                      className={cn(
                        "p-6 rounded-[30px] border-2 text-left transition-all relative overflow-hidden group",
                        paymentMethod === 'momo' ? "border-brand-primary bg-brand-primary/5" : "border-brand-border hover:border-brand-primary/30"
                      )}
                    >
                      <Smartphone className={cn("h-8 w-8 mb-4", paymentMethod === 'momo' ? "text-brand-primary" : "opacity-40")} />
                      <p className="font-black italic uppercase tracking-tighter text-xl">MTN MoMo</p>
                      <p className="text-[10px] uppercase font-bold opacity-40">Fast & Integrated</p>
                      {paymentMethod === 'momo' && <CheckCircle className="absolute top-4 right-4 h-5 w-5 text-brand-primary" />}
                    </button>
                    <button 
                      onClick={() => setPaymentMethod('card')}
                      className={cn(
                        "p-6 rounded-[30px] border-2 text-left transition-all relative overflow-hidden group",
                        paymentMethod === 'card' ? "border-brand-primary bg-brand-primary/5" : "border-brand-border hover:border-brand-primary/30"
                      )}
                    >
                      <CreditCard className={cn("h-8 w-8 mb-4", paymentMethod === 'card' ? "text-brand-primary" : "opacity-40")} />
                      <p className="font-black italic uppercase tracking-tighter text-xl">Credit / Debit Card</p>
                      <p className="text-[10px] uppercase font-bold opacity-40">Visa & Mastercard</p>
                      {paymentMethod === 'card' && <CheckCircle className="absolute top-4 right-4 h-5 w-5 text-brand-primary" />}
                    </button>
                 </div>
                 
                 {paymentMethod === 'momo' ? (
                   <div className="space-y-4">
                      <label className="micro-label uppercase tracking-widest block ml-4">MoMo Number</label>
                      <input 
                        required
                        type="tel"
                        value={phoneNumber}
                        onChange={e => setPhoneNumber(e.target.value)}
                        className="w-full bg-black/5 dark:bg-white/5 border border-brand-border dark:border-white/10 rounded-3xl py-5 px-6 italic font-black text-xl text-[var(--brand-text)] outline-none focus:border-brand-primary"
                      />
                   </div>
                 ) : (
                   <div className="flex gap-4">
                     <button 
                      onClick={() => setCardType('visa')}
                      className={cn("flex-1 p-4 rounded-2xl border font-black italic uppercase text-xs transition-all", cardType === 'visa' ? "bg-brand-primary text-white border-brand-primary" : "border-brand-border text-[var(--brand-text)] opacity-40")}
                     >
                       Visa
                     </button>
                     <button 
                      onClick={() => setCardType('mastercard')}
                      className={cn("flex-1 p-4 rounded-2xl border font-black italic uppercase text-xs transition-all", cardType === 'mastercard' ? "bg-brand-primary text-white border-brand-primary" : "border-brand-border text-[var(--brand-text)] opacity-40")}
                     >
                       Mastercard
                     </button>
                   </div>
                 )}

                 <button 
                   onClick={(e) => startPayment(e as any)}
                   className="w-full bg-brand-primary hover:bg-orange-600 dark:hover:bg-orange-400 text-white dark:text-black py-6 rounded-full font-black uppercase tracking-widest transition-all italic"
                 >
                   {t('proceed')}
                 </button>
                 <button onClick={() => setCheckoutStep('cart')} className="w-full py-4 micro-label text-[var(--brand-text-muted)] hover:text-brand-primary uppercase tracking-widest transition-colors">
                   {t('cancel')}
                 </button>
              </div>
            )}

            {checkoutStep === 'momo' && (
              <form onSubmit={confirmMomo} className="space-y-8">
                 <h2 className="text-2xl font-black uppercase tracking-tighter italic text-[var(--brand-text)] leading-none mb-8">
                    MOMO PAY<span className="text-brand-primary">.</span>
                 </h2>
                 <div className="p-8 bg-black/10 dark:bg-zinc-900 rounded-[30px] border border-brand-border dark:border-white/5 text-center mb-10">
                    <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest mb-4">Dial via Phone:</p>
                    <p className="text-3xl font-black italic text-brand-primary mb-2">*182*8*1*123456#</p>
                    <p className="text-[10px] opacity-40 italic uppercase">Merchant: SIMBA SUPERMARKET</p>
                 </div>
                 <div className="space-y-4 text-left">
                    <label className="micro-label uppercase tracking-widest block ml-4">Enter PIN on Phone</label>
                    <p className="text-sm opacity-60 font-bold uppercase tracking-tight ml-4">
                      A request has been sent to <span className="text-brand-primary">{phoneNumber}</span>. 
                      Please confirm on your device.
                    </p>
                 </div>
                 <button 
                   type="submit"
                   className="w-full bg-brand-primary hover:bg-orange-600 dark:hover:bg-orange-400 text-white dark:text-black py-6 rounded-full font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 italic"
                 >
                   I'VE ENTERED THE PIN
                 </button>
                 <button onClick={() => setCheckoutStep('method')} className="w-full py-4 micro-label text-[var(--brand-text-muted)] hover:text-brand-primary uppercase tracking-widest transition-colors text-center">
                   {t('back')}
                 </button>
              </form>
            )}

            {checkoutStep === 'card' && (
              <form onSubmit={confirmCard} className="space-y-6">
                 <h2 className="text-2xl font-black uppercase tracking-tighter italic text-[var(--brand-text)] leading-none mb-8">
                    CARD INFO<span className="text-brand-primary">.</span>
                 </h2>
                 <div className="space-y-4 text-left">
                    <label className="micro-label uppercase tracking-widest block ml-4">Card Number</label>
                    <input 
                      required 
                      type="text" 
                      placeholder="XXXX XXXX XXXX XXXX" 
                      value={cardData.number}
                      onChange={e => setCardData({...cardData, number: e.target.value.replace(/[^\d\s]/g, '')})}
                      className={cn(
                        "w-full bg-black/5 dark:bg-white/5 border rounded-2xl py-4 px-6 text-[var(--brand-text)] transition-colors",
                        formErrors.number ? "border-red-500" : "border-brand-border dark:border-white/10"
                      )} 
                    />
                    {formErrors.number && <p className="text-[10px] text-red-500 font-bold uppercase ml-4">{formErrors.number}</p>}
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-4 text-left">
                      <label className="micro-label uppercase tracking-widest block ml-4">Expiry</label>
                      <input 
                        required 
                        type="text" 
                        placeholder="MM/YY" 
                        value={cardData.expiry}
                        onChange={e => setCardData({...cardData, expiry: e.target.value})}
                        className={cn(
                          "w-full bg-black/5 dark:bg-white/5 border rounded-2xl py-4 px-6 text-[var(--brand-text)] transition-colors",
                          formErrors.expiry ? "border-red-500" : "border-brand-border dark:border-white/10"
                        )} 
                      />
                      {formErrors.expiry && <p className="text-[10px] text-red-500 font-bold uppercase ml-4">{formErrors.expiry}</p>}
                   </div>
                   <div className="space-y-4 text-left">
                      <label className="micro-label uppercase tracking-widest block ml-4">CVV</label>
                      <input 
                        required 
                        type="password" 
                        maxLength={3} 
                        placeholder="XXX" 
                        value={cardData.cvv}
                        onChange={e => setCardData({...cardData, cvv: e.target.value.replace(/[^\d]/g, '')})}
                        className={cn(
                          "w-full bg-black/5 dark:bg-white/5 border rounded-2xl py-4 px-6 text-[var(--brand-text)] text-center tracking-widest transition-colors",
                          formErrors.cvv ? "border-red-500" : "border-brand-border dark:border-white/10"
                        )} 
                      />
                      {formErrors.cvv && <p className="text-[10px] text-red-500 font-bold uppercase ml-4 text-center">{formErrors.cvv}</p>}
                   </div>
                 </div>
                 <button 
                   type="submit"
                   disabled={isProcessing}
                   className="w-full bg-brand-primary hover:bg-orange-600 dark:hover:bg-orange-400 text-white dark:text-black py-6 rounded-full font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 italic"
                 >
                   {isProcessing ? <RefreshCcw className="h-5 w-5 animate-spin" /> : `PAY ${formatCurrency(totalPrice + (totalPrice > 50000 ? 0 : 2000))}`}
                 </button>
                 <button onClick={() => setCheckoutStep('method')} className="w-full py-4 micro-label text-[var(--brand-text-muted)] hover:text-brand-primary uppercase tracking-widest transition-colors text-center">
                   {t('back')}
                 </button>
              </form>
            )}

            {checkoutStep === 'waiting' && (
              <div className="py-12 text-center">
                 <div className="relative w-24 h-24 mx-auto mb-8">
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 bg-brand-primary rounded-full blur-xl"
                    />
                    <div className="relative flex items-center justify-center h-full">
                       <Wifi className="h-10 w-10 text-brand-primary animate-pulse" />
                    </div>
                 </div>
                 <h3 className="text-xl font-black uppercase italic text-brand-primary mb-2">WAITING FOR PIN</h3>
                 <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest mb-8 text-center px-4">Detecting signals from {phoneNumber}. Please do not close this window.</p>
                 <div className="w-full h-1 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 4.5 }}
                      className="h-full bg-brand-primary"
                    />
                 </div>
              </div>
            )}

            <div className="mt-8 p-5 bg-brand-accent/10 border border-brand-accent/20 rounded-3xl group">
              <div className="flex items-center gap-3 mb-2 text-[10px] font-black text-brand-accent uppercase tracking-widest">
                <div className="w-6 h-6 bg-brand-accent rounded-lg flex items-center justify-center text-black font-black group-hover:animate-bounce">M</div>
                MoMo Active
              </div>
              <p className="text-[10px] opacity-40 leading-relaxed font-bold uppercase tracking-tight">Kigali delivery zone 1-3 enabled. Real-time confirmation.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
