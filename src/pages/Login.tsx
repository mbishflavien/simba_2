import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { LogIn, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const from = location.state?.from || '/';

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-white dark:bg-black">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20 dark:opacity-40">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0] }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute -top-[20%] -left-[10%] w-[60%] aspect-square bg-brand-primary rounded-full blur-[120px] opacity-20" 
        />
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, -5, 0] }}
          transition={{ duration: 25, repeat: Infinity }}
          className="absolute -bottom-[20%] -right-[10%] w-[60%] aspect-square bg-brand-accent rounded-full blur-[120px] opacity-10" 
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-md bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl rounded-[48px] border border-brand-border dark:border-white/10 p-8 sm:p-12 shadow-[0_32px_80px_rgba(0,0,0,0.1)] dark:shadow-none relative z-10"
      >
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[28px] bg-brand-primary text-white mb-8 shadow-xl shadow-brand-primary/20 -rotate-6 scale-110">
            <LogIn className="w-10 h-10" />
          </div>
          <h1 className="text-5xl font-black italic uppercase tracking-tighter text-[var(--brand-text)] mb-3 leading-none">
            WELCOME <br/><span className="text-brand-primary">BACK</span>
          </h1>
          <p className="micro-label font-black opacity-40 italic tracking-[0.2em]">
            Access SIMBA Logistics Node 01
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl mb-8 text-red-500 text-xs font-bold uppercase italic tracking-wider">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="micro-label ml-2">{t('email')}</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="simba@example.rw"
                className="w-full bg-zinc-50 dark:bg-black/20 border-2 border-transparent focus:border-brand-primary rounded-2xl py-4 pl-12 pr-4 outline-none font-bold uppercase italic text-xs tracking-tight transition-all text-[var(--brand-text)] shadow-inner"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center px-2">
              <label className="micro-label">{t('password')}</label>
              <Link to="/forgot-password" size="sm" className="micro-label !text-brand-primary hover:opacity-75 transition-opacity underline-offset-4">
                {t('forgot_password')}
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input 
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-50 dark:bg-black/20 border-2 border-transparent focus:border-brand-primary rounded-2xl py-4 pl-12 pr-4 outline-none font-bold italic text-xs tracking-tight transition-all text-[var(--brand-text)] shadow-inner"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-primary text-white dark:text-black font-black uppercase italic tracking-widest py-5 rounded-2xl flex items-center justify-center gap-3 hover:bg-orange-600 transition-all disabled:opacity-50 shadow-lg shadow-brand-primary/20"
          >
            {loading ? t('logging_in') : t('login_now')}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-zinc-100 dark:bg-white/5" />
          <span className="micro-label opacity-40">{t('or_continue_with')}</span>
          <div className="h-px flex-1 bg-zinc-100 dark:bg-white/5" />
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full mt-8 bg-white dark:bg-white/5 border border-brand-border dark:border-white/10 text-[var(--brand-text)] font-black uppercase italic tracking-widest py-5 rounded-2xl flex items-center justify-center gap-4 hover:bg-zinc-50 dark:hover:bg-white/10 transition-all disabled:opacity-50"
        >
          <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
          {t('continue_with_google')}
        </button>

        <p className="mt-8 text-center text-xs font-bold uppercase italic tracking-widest opacity-60 text-[var(--brand-text)]">
          {t('dont_have_account')}{' '}
          <Link to="/signup" className="text-brand-primary hover:underline underline-offset-4">
            {t('signup_here')}
          </Link>
        </p>

        <div className="mt-8 pt-8 border-t border-brand-border dark:border-white/10">
          <div className="flex gap-3 items-start p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-brand-border dark:border-white/5">
            <AlertCircle className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
            <p className="text-[10px] font-bold uppercase italic tracking-wider opacity-60 leading-relaxed text-[var(--brand-text)]">
              {t('admin_auth_notice')}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
