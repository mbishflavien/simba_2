import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { UserPlus, Mail, Lock, AlertCircle, ArrowRight, User, Eye, EyeOff } from 'lucide-react';

export default function SignUp() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const from = location.state?.from || '/';

  const createProfile = async (userId: string, email: string, name: string) => {
    const adminEmails = ['flavmbish@gmail.com', 'flavmbish@icloud.com', 'flavien.mbishibishi@a2sv.org', 'test.admin@simba.com'];
    const isAdmin = adminEmails.includes(email.toLowerCase());
    try {
      await setDoc(doc(db, 'users', userId), {
        userId,
        email,
        displayName: name,
        phoneNumber: null,
        address: null,
        isAdmin,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, `users/${userId}`);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await createProfile(userCredential.user.uid, email, displayName);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      
      const { doc, getDoc } = await import('firebase/firestore');
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await createProfile(
          user.uid, 
          user.email!, 
          user.displayName || 'Unnamed User'
        );
      }
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
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-primary/10 text-brand-primary mb-6">
            <UserPlus className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-[var(--brand-text)] mb-2">
            {t('join_simba')}
          </h1>
          <p className="text-sm font-bold uppercase tracking-widest text-zinc-500 italic opacity-60">
            {t('create_new_account')}
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl mb-8 text-red-500 text-xs font-bold uppercase italic tracking-wider">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSignUp} className="space-y-6">
          <div className="space-y-2">
            <label className="micro-label ml-2">{t('full_name')}</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input 
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Simba Customer"
                className="w-full bg-zinc-50 dark:bg-black/20 border-2 border-transparent focus:border-brand-primary rounded-2xl py-4 pl-12 pr-4 outline-none font-bold uppercase italic text-xs tracking-tight transition-all text-[var(--brand-text)] shadow-inner"
              />
            </div>
          </div>

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
            <label className="micro-label ml-2">{t('password')}</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input 
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-50 dark:bg-black/20 border-2 border-transparent focus:border-brand-primary rounded-2xl py-4 pl-12 pr-12 outline-none font-bold italic text-xs tracking-tight transition-all text-[var(--brand-text)] shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-brand-primary transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-primary text-white dark:text-black font-black uppercase italic tracking-widest py-5 rounded-2xl flex items-center justify-center gap-3 hover:bg-orange-600 transition-all disabled:opacity-50 shadow-lg shadow-brand-primary/20"
          >
            {loading ? t('signing_up') : t('create_account_now')}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-zinc-100 dark:bg-white/5" />
          <span className="micro-label opacity-40">{t('or_continue_with')}</span>
          <div className="h-px flex-1 bg-zinc-100 dark:bg-white/5" />
        </div>

        <button
          onClick={handleGoogleSignUp}
          disabled={loading}
          className="w-full mt-8 bg-white dark:bg-white/5 border border-brand-border dark:border-white/10 text-[var(--brand-text)] font-black uppercase italic tracking-widest py-5 rounded-2xl flex items-center justify-center gap-4 hover:bg-zinc-50 dark:hover:bg-white/10 transition-all disabled:opacity-50"
        >
          <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
          {t('continue_with_google')}
        </button>

        <p className="mt-8 text-center text-xs font-bold uppercase italic tracking-widest opacity-60 text-[var(--brand-text)]">
          {t('already_have_account')}{' '}
          <Link to="/login" className="text-brand-primary hover:underline underline-offset-4">
            {t('login_here')}
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
