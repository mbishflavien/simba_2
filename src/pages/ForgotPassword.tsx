import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, ArrowLeft, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { cn } from '../lib/utils';

const ForgotPassword = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message || 'An error occurred while trying to send the reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white dark:bg-zinc-900/50 backdrop-blur-xl p-8 sm:p-12 rounded-[40px] border border-zinc-200 dark:border-white/5 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary opacity-5 rounded-full blur-3xl -mr-16 -mt-16" />
        
        <Link 
          to="/login"
          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest italic opacity-40 hover:opacity-100 transition-all mb-8 group"
        >
          <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
          {t('back_to_login')}
        </Link>

        <div className="mb-10">
          <h1 className="text-4xl font-display font-black italic tracking-tighter text-[var(--brand-text)] mb-2 mt-2">
            {t('reset_password_title')}
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-widest italic opacity-30 text-[var(--brand-text)]">
            {t('reset_password_desc')}
          </p>
        </div>

        {success ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl text-center"
          >
            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 leading-relaxed uppercase italic">
              {t('reset_link_sent')}
            </p>
            <p className="text-[10px] font-medium text-emerald-600/60 dark:text-emerald-400/60 mt-2 uppercase italic">
              {t('check_spam')}
            </p>
            <Link 
              to="/login"
              className="mt-6 inline-block text-[10px] font-black uppercase tracking-widest italic text-brand-primary hover:underline"
            >
              {t('back_to_login')}
            </Link>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest italic text-[var(--brand-text)] opacity-40 px-6 block">
                {t('email')}
              </label>
              <div className="relative group">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--brand-text)] opacity-20 group-focus-within:opacity-100 group-focus-within:text-brand-primary transition-all" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-16 bg-black/5 dark:bg-black rounded-3xl pl-16 pr-6 font-bold text-sm focus:outline-none focus:ring-4 focus:ring-brand-primary/10 border border-transparent focus:border-brand-primary/20 transition-all text-[var(--brand-text)]"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl"
              >
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-[10px] font-bold text-red-500 uppercase italic leading-none">{error}</p>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-16 bg-brand-primary text-white dark:text-black rounded-3xl font-black uppercase tracking-[0.2em] italic text-xs shadow-xl shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3 group"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 dark:border-black/30 border-t-white dark:border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <span>{t('send_reset_link')}</span>
                  <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
