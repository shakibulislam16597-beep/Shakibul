import React, { useState, useEffect, useRef } from 'react';
import {
  signInWithPopup,
  GoogleAuthProvider,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { ensureUserProfile } from '../lib/userAuth';
import { safeSetItem, safeGetItem } from '../utils/storage';
import { X, Mail, ShieldAlert, CheckCircle2, RefreshCw, AlertCircle, ExternalLink } from 'lucide-react';

/**
 * Note: 6-digit OTP is not used because it requires a paid SMS/Email backend service.
 * Note: This captcha is a client-side deterrent; primary security is provided by Firebase App Check and rules.
 */
export default function LoginSheet({ isOpen, onClose, onLoginSuccess }) {
  if (!isOpen) return null;

  // In-app browser detection
  const isInAppBrowser = (() => {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || navigator.vendor || window.opera || '';
    return /FBAN|FBAV|Instagram|Messenger|Line/i.test(ua);
  })();

  // Email link input
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Captcha State
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaCode, setCaptchaCode] = useState('');
  const [useTextMath, setUseTextMath] = useState(false);
  const [mathNum1, setMathNum1] = useState(7);
  const [mathNum2, setMathNum2] = useState(5);
  const [honeypot, setHoneypot] = useState('');

  // Lockout / Failed Attempts
  const [failedCount, setFailedCount] = useState(0);
  const [lockoutTime, setLockoutTime] = useState(0);

  // Messages & Loading
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);

  const canvasRef = useRef(null);
  const modalRef = useRef(null);

  // Focus trap & Escape listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutTime <= 0) return;
    const timer = setInterval(() => {
      setLockoutTime((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutTime]);

  // Email resend cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Generate Canvas Captcha
  const generateCaptcha = () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(code);
    setCaptchaInput('');

    // Generate fresh math numbers
    const n1 = Math.floor(Math.random() * 9) + 1;
    const n2 = Math.floor(Math.random() * 9) + 1;
    setMathNum1(n1);
    setMathNum2(n2);
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  // Draw Captcha Canvas
  useEffect(() => {
    if (useTextMath || !canvasRef.current || !captchaCode) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset background
    ctx.fillStyle = '#F7F8FC';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Noise lines
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = i % 2 === 0 ? '#2436F5' : '#FFC933';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }

    // Draw characters with random angles & offsets
    ctx.font = 'bold 22px sans-serif';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < captchaCode.length; i++) {
      const char = captchaCode[i];
      const x = 18 + i * 22;
      const y = 20 + (Math.random() * 6 - 3);
      const angle = (Math.random() - 0.5) * 0.4;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillStyle = '#0E1330';
      ctx.fillText(char, 0, 0);
      ctx.restore();
    }

    // Noise dots
    for (let i = 0; i < 20; i++) {
      ctx.fillStyle = '#0E1330';
      ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
    }
  }, [captchaCode, useTextMath]);

  // Synchronous Captcha Validation
  const validateCaptchaSync = () => {
    if (honeypot) {
      // Honeypot bot filled
      return false;
    }

    if (lockoutTime > 0) {
      setErrorMsg(`Too many wrong attempts. Please wait ${lockoutTime}s.`);
      return false;
    }

    let isValid = false;

    if (useTextMath) {
      const expected = mathNum1 + mathNum2;
      isValid = parseInt(captchaInput.trim(), 10) === expected;
    } else {
      isValid = captchaInput.trim().toLowerCase() === captchaCode.toLowerCase();
    }

    if (!isValid) {
      const nextFailed = failedCount + 1;
      setFailedCount(nextFailed);
      generateCaptcha();

      if (nextFailed >= 3) {
        setLockoutTime(30);
        setFailedCount(0);
        setErrorMsg('3 wrong attempts. Captcha locked for 30 seconds.');
      } else {
        setErrorMsg(`Incorrect security code. ${3 - nextFailed} attempt(s) remaining.`);
      }
      return false;
    }

    setErrorMsg('');
    return true;
  };

  // Google Popup Sign In
  const handleGoogleSignIn = async () => {
    if (!validateCaptchaSync()) return;

    setLoadingGoogle(true);
    setErrorMsg('');

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);

      if (result?.user) {
        await ensureUserProfile(result.user);
        if (onLoginSuccess) onLoginSuccess(result.user);
        onClose();
      }
    } catch (err) {
      console.warn('Google sign-in error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setErrorMsg('Sign-in window was closed before completing.');
      } else if (err.code === 'auth/popup-blocked') {
        setErrorMsg('Pop-up was blocked by your browser. Please allow popups for this site.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setErrorMsg('This domain is not authorized in Firebase Auth settings.');
      } else if (err.code === 'auth/network-request-failed') {
        setErrorMsg('Network error. Please check your internet connection.');
      } else {
        setErrorMsg(err.message || 'Google sign-in failed. Please try again.');
      }
    } finally {
      setLoadingGoogle(false);
    }
  };

  // Email Link Sign In
  const handleSendEmailLink = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (!validateCaptchaSync()) return;

    setLoadingEmail(true);
    setErrorMsg('');

    try {
      const actionCodeSettings = {
        url: window.location.origin + import.meta.env.BASE_URL,
        handleCodeInApp: true
      };

      await sendSignInLinkToEmail(auth, email.trim(), actionCodeSettings);
      safeSetItem('emailForSignIn', email.trim());

      setEmailSent(true);
      setCooldown(60);
      setSuccessMsg('Sign-in link sent! Please check your inbox and spam folder.');
    } catch (err) {
      console.warn('Email link send error:', err);
      if (err.code === 'auth/invalid-email') {
        setErrorMsg('Please enter a valid email address.');
      } else if (err.code === 'auth/too-many-requests') {
        setErrorMsg('Too many requests. Please wait a few minutes before trying again.');
      } else {
        setErrorMsg(err.message || 'Failed to send sign-in link.');
      }
    } finally {
      setLoadingEmail(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0E1330]/50 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-sheet-title"
        className="bg-[#FFFFFF] rounded-[24px] max-w-md w-full p-5 sm:p-7 border-2 border-[#0E1330] shadow-[6px_6px_0px_#0E1330] relative text-[#0E1330] my-auto space-y-5"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#0E1330]">
          <div>
            <h2 id="login-sheet-title" className="text-xl font-heading font-extrabold text-[#0E1330]">
              Customer Sign In
            </h2>
            <p className="text-xs font-sans text-[#5B6079]">
              Access your orders, saved addresses, and wishlist
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close sign in sheet"
            className="p-1.5 rounded-xl border-2 border-[#0E1330] bg-[#FFFFFF] text-[#0E1330] hover:bg-[#F7F8FC] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* In-App Browser Warning Banner */}
        {isInAppBrowser && (
          <div className="bg-amber-50 border-2 border-amber-400 p-3 rounded-xl text-xs font-sans text-amber-900 space-y-1 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-heading font-bold">In-app browser detected</p>
              <p>Google sign-in may not work here. Open this page in Chrome, or use the email link below.</p>
            </div>
          </div>
        )}

        {/* Error / Success Toast Messages */}
        {errorMsg && (
          <div
            aria-live="polite"
            className="bg-rose-50 border-2 border-rose-500 p-3 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-2"
          >
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div
            aria-live="polite"
            className="bg-[#FFC933]/20 border-2 border-[#0E1330] p-3 rounded-xl text-xs font-bold text-[#0E1330] flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#0F9D6B]" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Human Check / Captcha Box */}
        <div className="bg-[#F7F8FC] p-3.5 rounded-2xl border-2 border-[#0E1330] space-y-2.5 font-sans">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-heading font-extrabold uppercase tracking-wider text-[#0E1330]">
              Security Verification
            </span>
            <button
              type="button"
              onClick={() => setUseTextMath((prev) => !prev)}
              className="text-[10px] font-heading font-bold text-[#2436F5] hover:underline cursor-pointer"
            >
              {useTextMath ? 'Use visual image captcha' : "I can't read this code"}
            </button>
          </div>

          {useTextMath ? (
            <div className="bg-[#FFFFFF] p-2.5 rounded-xl border-2 border-[#0E1330] text-xs font-bold text-[#0E1330]">
              Answer math question: What is {mathNum1} plus {mathNum2}?
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-[#FFFFFF] p-2 rounded-xl border-2 border-[#0E1330]">
              <canvas
                ref={canvasRef}
                width={130}
                height={40}
                role="img"
                aria-label="Security check captcha image"
                className="rounded border border-[#0E1330]/20 shrink-0"
              />
              <button
                type="button"
                onClick={generateCaptcha}
                aria-label="Generate new security code"
                className="p-2 bg-[#F7F8FC] border border-[#0E1330] rounded-lg text-[#0E1330] hover:bg-[#FFC933] cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Hidden Honeypot Bot Trap */}
          <input
            type="text"
            name="b_hp_field"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            style={{ display: 'none' }}
            tabIndex={-1}
            autoComplete="off"
          />

          <div>
            <input
              type="text"
              value={captchaInput}
              onChange={(e) => setCaptchaInput(e.target.value)}
              placeholder={useTextMath ? 'Enter number answer...' : 'Enter 5-character code...'}
              autoComplete="off"
              disabled={lockoutTime > 0}
              className="w-full px-3 py-2 bg-[#FFFFFF] border-2 border-[#0E1330] rounded-xl text-xs font-bold text-[#0E1330] focus:outline-none focus:border-[#2436F5]"
            />
          </div>

          {lockoutTime > 0 && (
            <p className="text-[10px] font-bold text-rose-600">
              Locked due to wrong entries. Retry in {lockoutTime} seconds.
            </p>
          )}
        </div>

        {/* 1. Google Sign In Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loadingGoogle || lockoutTime > 0}
          className="w-full py-3 bg-[#FFFFFF] text-[#0E1330] border-2 border-[#0E1330] shadow-[3px_3px_0px_#0E1330] font-heading font-extrabold text-xs uppercase tracking-wider rounded-full hover:bg-[#FFC933] transition-all cursor-pointer flex items-center justify-center gap-2.5 disabled:opacity-50"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{loadingGoogle ? 'Connecting Google...' : 'Continue with Google'}</span>
        </button>

        <div className="relative text-center my-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#0E1330]/20" />
          </div>
          <span className="relative bg-[#FFFFFF] px-3 text-[10px] font-heading font-bold uppercase tracking-widest text-[#5B6079]">
            Or email link
          </span>
        </div>

        {/* 2. Email Link Sign In Form */}
        <form onSubmit={handleSendEmailLink} className="space-y-3 font-sans">
          <div>
            <label className="block text-xs font-heading font-extrabold uppercase text-[#0E1330] mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#5B6079]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-9 pr-3 py-2.5 bg-[#F7F8FC] border-2 border-[#0E1330] rounded-xl text-xs font-bold text-[#0E1330] focus:outline-none focus:border-[#2436F5]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loadingEmail || cooldown > 0 || lockoutTime > 0}
            className="w-full py-3 bg-[#2436F5] text-[#FFFFFF] border-2 border-[#0E1330] shadow-[3px_3px_0px_#0E1330] font-heading font-extrabold text-xs uppercase tracking-wider rounded-full hover:bg-[#0E1330] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Mail className="w-4 h-4" />
            <span>
              {cooldown > 0
                ? `Resend in ${cooldown}s`
                : loadingEmail
                ? 'Sending link...'
                : 'Email me a sign-in link'}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
