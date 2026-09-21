import React, { useState } from 'react';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Eye, EyeOff, Lock, Mail, Loader2, ShieldAlert } from 'lucide-react';

export default function AdminLogin({ onLoginSuccess, user, isAdminActive }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If a customer user is already logged in without admin permissions
  if (user && !isAdminActive) {
    return (
      <div className="min-h-screen bg-[#F7F8FC] flex items-center justify-center p-4 font-sans text-[#0E1330]">
        <div className="bg-[#FFFFFF] rounded-[24px] border-2 border-[#0E1330] shadow-[6px_6px_0px_#0E1330] p-6 sm:p-8 max-w-md w-full space-y-6 text-center">
          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl border-2 border-[#0E1330] flex items-center justify-center mx-auto shadow-[2px_2px_0px_#0E1330]">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-heading font-extrabold text-[#0E1330]">
              This account has no admin access
            </h1>
            <p className="text-xs font-sans text-[#5B6079] mt-1">
              Signed in as <strong>{user.email || 'Customer'}</strong>. This account does not have staff privileges.
            </p>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <button
              type="button"
              onClick={async () => {
                await signOut(auth);
                window.location.hash = '#/admin/login';
              }}
              className="w-full py-2.5 bg-rose-600 text-white font-heading font-extrabold text-xs uppercase tracking-wider rounded-xl border-2 border-[#0E1330] shadow-[2px_2px_0px_#0E1330] hover:bg-rose-700 cursor-pointer"
            >
              Log Out
            </button>
            <a
              href="#/"
              className="text-xs font-heading font-bold text-[#5B6079] hover:text-[#2436F5] underline underline-offset-2"
            >
              ← Return to Storefront
            </a>
          </div>
        </div>
      </div>
    );
  }

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (error) setError('');
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Read admins/{uid} document from Firestore
      const adminDocRef = doc(db, 'admins', user.uid);
      const adminDocSnap = await getDoc(adminDocRef);

      if (!adminDocSnap.exists() || adminDocSnap.data()?.active !== true) {
        await signOut(auth);
        setError('This account has no admin access.');
        setLoading(false);
        return;
      }

      setLoading(false);
      window.location.hash = '#/admin/dashboard';
      if (onLoginSuccess) onLoginSuccess();
    } catch (err) {
      console.error('Admin login error:', err);
      setLoading(false);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password.');
      } else {
        setError(err.message || 'An error occurred during sign-in.');
      }
    }
  };

  const logoSrc = import.meta.env.BASE_URL + 'extrovat-logo.png';

  return (
    <div className="min-h-screen bg-[#F7F8FC] flex items-center justify-center p-4 font-sans text-[#0E1330]">
      <div className="bg-[#FFFFFF] rounded-[24px] border-2 border-[#0E1330] shadow-[6px_6px_0px_#0E1330] p-6 sm:p-8 max-w-md w-full space-y-6">
        <div className="text-center space-y-2 flex flex-col items-center">
          <img
            src={logoSrc}
            alt="Extrovat Lifestyle logo"
            width={72}
            height={72}
            className="w-[72px] h-[72px] rounded-full border-2 border-[#0E1330] object-cover bg-white shadow-[2px_2px_0px_#0E1330] mb-1"
          />
          <h1 className="text-2xl font-heading font-extrabold text-[#0E1330]">
            Staff Portal
          </h1>
          <p className="text-xs font-sans text-[#5B6079]">
            Sign in to access Extrovat Lifestyle management console.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-500 rounded-xl p-3 flex items-start gap-2.5 text-xs text-red-700 font-bold">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-heading font-extrabold uppercase tracking-wider text-[#0E1330]">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5B6079]" />
              <input
                type="email"
                required
                value={email}
                onChange={handleEmailChange}
                placeholder="staff@extrovat.com"
                className="w-full pl-9 pr-3 py-2.5 bg-[#F7F8FC] border-2 border-[#0E1330] rounded-xl text-xs font-bold text-[#0E1330] focus:outline-none focus:border-[#2436F5]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-heading font-extrabold uppercase tracking-wider text-[#0E1330]">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5B6079]" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={handlePasswordChange}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2.5 bg-[#F7F8FC] border-2 border-[#0E1330] rounded-xl text-xs font-bold text-[#0E1330] focus:outline-none focus:border-[#2436F5]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5B6079] hover:text-[#0E1330] cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#2436F5] hover:bg-[#1B29C4] text-[#FFFFFF] font-heading font-extrabold text-xs uppercase tracking-wider rounded-xl border-2 border-[#0E1330] shadow-[3px_3px_0px_#0E1330] transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="pt-2 text-center">
          <a
            href="#/"
            className="text-xs font-heading font-bold text-[#5B6079] hover:text-[#2436F5] underline underline-offset-2 transition-colors"
          >
            ← Back to Storefront
          </a>
        </div>
      </div>
    </div>
  );
}
