import React, { useEffect, useState } from 'react';
import { signInWithRedirect, getRedirectResult, GoogleAuthProvider } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Loader2, ShieldAlert, Chrome, ArrowRight } from 'lucide-react';

export default function GoogleAuthHelper() {
  const [status, setStatus] = useState<'idle' | 'authenticating' | 'saving' | 'success' | 'error'>('authenticating');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const checkRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          const user = result.user;
          setStatus('saving');

          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);

          const adminEmails = [
            'flavmbish@gmail.com', 
            'flavmbish@icloud.com', 
            'flavien.mbishibishi@a2sv.org', 
            'test.admin@simba.com', 
            'admin@test.com'
          ];
          const email = user.email || '';
          const isAdmin = adminEmails.includes(email.toLowerCase());

          if (!userSnap.exists()) {
            await setDoc(userRef, {
              userId: user.uid,
              email,
              displayName: user.displayName || 'Unnamed User',
              phoneNumber: null,
              address: null,
              isAdmin,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          } else {
            await setDoc(userRef, {
              displayName: userSnap.data()?.displayName || user.displayName || 'Unnamed User',
              isAdmin,
              updatedAt: serverTimestamp(),
            }, { merge: true });
          }

          setStatus('success');
          
          // Notify parent window
          if (window.opener) {
            window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', user: { email: user.email, uid: user.uid } }, window.location.origin);
          }
          
          // Close the popup after a brief delay
          setTimeout(() => {
            window.close();
          }, 1500);
        } else {
          // No redirect result found, we are idle and waiting for user to click button
          setStatus('idle');
        }
      } catch (err: any) {
        console.error('Google Redirect Callback Error:', err);
        setErrorMsg(err.message || 'Failed to authenticate');
        setStatus('error');
        if (window.opener) {
          window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: err.message }, window.location.origin);
        }
      }
    };

    checkRedirectResult();
  }, []);

  const handleSignIn = async () => {
    setStatus('authenticating');
    const provider = new GoogleAuthProvider();
    // Enforce select_account to let the user select their account
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    try {
      // Use redirect directly inside this helper window.
      // This navigates the helper window to Google, which redirects back to this same helper window.
      // This completely prevents popup blockers because there is no secondary popup window!
      await signInWithRedirect(auth, provider);
    } catch (err: any) {
      console.error('Google Redirect Launch Error:', err);
      setErrorMsg(err.message || 'Failed to initialize sign-in redirect');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0F12] text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-sm bg-[#111217] border border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Glow decorative effect */}
        <div className="absolute -top-16 -left-16 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-white/5 mx-auto mb-6">
          <img src="https://www.google.com/favicon.ico" className="w-8 h-8" alt="Google Logo" />
        </div>

        <h2 className="font-sans font-black uppercase tracking-wider text-lg mb-2">Simba Supermarket</h2>
        <p className="text-[11px] text-zinc-500 uppercase tracking-widest font-semibold mb-6">Secure Portal</p>
        
        {status === 'idle' && (
          <div className="space-y-6">
            <div className="bg-zinc-900/50 rounded-2xl p-4 border border-zinc-800 text-left">
              <p className="text-xs text-zinc-300 leading-relaxed">
                To complete your registration or login securely, please click the button below to connect with your Google Account.
              </p>
            </div>
            
            <button
              onClick={handleSignIn}
              className="w-full bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white text-xs font-bold uppercase tracking-wider py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-3 group shadow-lg shadow-orange-500/10"
            >
              <Chrome className="w-4 h-4 text-white" />
              <span>Continue with Google</span>
              <ArrowRight className="w-4 h-4 text-white transition-transform group-hover:translate-x-0.5" />
            </button>
            
            <p className="text-[10px] text-zinc-600">
              By continuing, you authorize Simba Supermarket to secure your session.
            </p>
          </div>
        )}

        {status === 'authenticating' && (
          <div className="space-y-4 py-6">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto" />
            <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Signing you in with Google...</p>
            <p className="text-[10px] text-zinc-600">Please complete authentication in the external window.</p>
          </div>
        )}

        {status === 'saving' && (
          <div className="space-y-4 py-6">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto" />
            <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Securing your profile...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-3 py-6">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto mb-2 text-xl">
              ✔
            </div>
            <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Authentication Successful!</p>
            <p className="text-[10px] text-zinc-500">Connecting you to Simba Supermarket...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4 py-4">
            <ShieldAlert className="w-8 h-8 text-red-500 mx-auto" />
            <p className="text-xs text-red-400 font-bold uppercase tracking-wider">Authentication Failed</p>
            <p className="text-[11px] text-zinc-400 max-h-24 overflow-y-auto bg-zinc-950 p-2 rounded-lg border border-zinc-900">{errorMsg}</p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setStatus('idle')}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold uppercase tracking-wider py-3 rounded-xl transition-all"
              >
                Try Again
              </button>
              <button
                onClick={() => window.close()}
                className="flex-1 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-white text-xs font-bold uppercase tracking-wider py-3 rounded-xl transition-all border border-zinc-800"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
