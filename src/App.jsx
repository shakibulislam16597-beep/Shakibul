import React, { useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { ensureUserProfile, getUserProfile } from './lib/userAuth';
import { safeGetItem, safeRemoveItem } from './utils/storage';

import SplashScreen from './components/SplashScreen';
import Home from './components/Home';
import TrackOrder from './components/TrackOrder';
import AccountPages from './components/AccountPages';
import AdminLogin from './admin/AdminLogin';
import AdminLayout from './admin/AdminLayout';

export default function App() {
  const [showSplash, setShowSplash] = useState(() => {
    try {
      const seen = sessionStorage.getItem('extrovat_splash_seen');
      return !seen;
    } catch (e) {
      console.warn('sessionStorage check error:', e);
      return false;
    }
  });
  const [currentHash, setCurrentHash] = useState(window.location.hash || '#/');
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isAdminActive, setIsAdminActive] = useState(false);
  const [adminDocData, setAdminDocData] = useState(null);
  const [adminCheckError, setAdminCheckError] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [adminChecking, setAdminChecking] = useState(false);

  // Check email link sign-in on app start
  useEffect(() => {
    if (!auth) return;

    const completeEmailLinkSignIn = async () => {
      try {
        if (isSignInWithEmailLink(auth, window.location.href)) {
          let email = safeGetItem('emailForSignIn', '');
          if (!email) {
            email = window.prompt('Please confirm your email address for sign-in:');
          }
          if (email) {
            const result = await signInWithEmailLink(auth, email, window.location.href);
            safeRemoveItem('emailForSignIn');
            if (result?.user) {
              await ensureUserProfile(result.user);
            }
          }
          // Clean URL query params while keeping HashRouter hash
          const cleanUrl = window.location.origin + window.location.pathname + window.location.hash;
          window.history.replaceState({}, document.title, cleanUrl);
        }
      } catch (err) {
        console.warn('Error completing email link sign in:', err);
      }
    };

    completeEmailLinkSignIn();
  }, []);

  // Hash listener for HashRouter navigation
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash || '#/');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Firebase auth state listener + admins/{uid} check with full error catch resilience
  useEffect(() => {
    if (!auth || !db) {
      setUser(null);
      setIsAdminActive(false);
      setAdminDocData(null);
      setAdminCheckError(null);
      setAuthChecking(false);
      setAdminChecking(false);
      return;
    }

    let unsubscribe = () => {};
    try {
      unsubscribe = onAuthStateChanged(
        auth,
        async (currentUser) => {
          setUser(currentUser);
          if (currentUser) {
            setAdminChecking(true);
            setAdminCheckError(null);

            try {
              const adminDocRef = doc(db, 'admins', currentUser.uid);
              const adminDocSnap = await getDoc(adminDocRef);
              if (adminDocSnap.exists()) {
                const data = adminDocSnap.data();
                setAdminDocData(data);
                if (data?.active === true) {
                  setIsAdminActive(true);
                } else {
                  setIsAdminActive(false);
                }
              } else {
                setAdminDocData(null);
                setIsAdminActive(false);
              }
            } catch (adminErr) {
              console.error('Error checking admins/{uid}:', adminErr);
              setAdminDocData(null);
              setIsAdminActive(false);
              setAdminCheckError(adminErr);
            } finally {
              setAdminChecking(false);
            }

            // Non-blocking sync for customer profile
            try {
              ensureUserProfile(currentUser)
                .then((profile) => setUserProfile(profile))
                .catch((pErr) => console.warn('Customer profile sync warning:', pErr));
            } catch (pErr) {
              console.warn('ensureUserProfile call warning:', pErr);
            }
          } else {
            setUserProfile(null);
            setIsAdminActive(false);
            setAdminDocData(null);
            setAdminCheckError(null);
            setAdminChecking(false);
          }
          setAuthChecking(false);
        },
        (error) => {
          console.warn('Auth state listener error:', error);
          setUser(null);
          setIsAdminActive(false);
          setAdminDocData(null);
          setAdminCheckError(error);
          setAuthChecking(false);
          setAdminChecking(false);
        }
      );
    } catch (err) {
      console.warn('Firebase Auth initialization error:', err);
      setUser(null);
      setIsAdminActive(false);
      setAdminDocData(null);
      setAdminCheckError(err);
      setAuthChecking(false);
      setAdminChecking(false);
    }

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const handleSplashFinish = () => {
    try {
      sessionStorage.setItem('extrovat_splash_seen', 'true');
    } catch (e) {
      console.warn('sessionStorage set error:', e);
    }
    setShowSplash(false);
  };

  const handleResetSplash = () => {
    try {
      sessionStorage.removeItem('extrovat_splash_seen');
    } catch (e) {
      console.warn('sessionStorage remove error:', e);
    }
    setShowSplash(true);
  };

  // Route handling
  const isTrackRoute = currentHash.startsWith('#/track');
  if (isTrackRoute) {
    return (
      <div className="min-h-screen bg-white text-gray-900 selection:bg-black selection:text-white font-sans">
        <TrackOrder onOpenCart={() => { window.location.hash = '#/'; }} />
      </div>
    );
  }

  const isAccountRoute = currentHash.startsWith('#/account');
  if (isAccountRoute) {
    if (!user) {
      // If unauthenticated on account route, redirect to home
      window.location.hash = '#/';
    }
    return (
      <div className="min-h-screen bg-white text-gray-900 selection:bg-black selection:text-white font-sans">
        <AccountPages
          currentHash={currentHash}
          user={user}
          userProfile={userProfile}
          onOpenCart={() => { window.location.hash = '#/'; }}
        />
      </div>
    );
  }

  // Determine if navigating to admin route
  const isAdminRoute = currentHash.startsWith('#/admin');

  if (isAdminRoute) {
    if (authChecking || adminChecking) {
      return (
        <div className="min-h-screen bg-[#F7F8FC] flex items-center justify-center font-sans text-[#0E1330]">
          <div className="text-center space-y-2">
            <div className="w-8 h-8 border-4 border-[#2436F5] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-heading font-bold text-[#5B6079]">Authenticating admin...</p>
          </div>
        </div>
      );
    }

    if (currentHash === '#/admin/login') {
      return (
        <AdminLogin
          user={user}
          isAdminActive={isAdminActive}
          authChecking={authChecking || adminChecking}
          adminDocData={adminDocData}
          adminCheckError={adminCheckError}
        />
      );
    }

    // Protected Admin Routes
    if (!user || !isAdminActive || adminCheckError) {
      return (
        <AdminLogin
          user={user}
          isAdminActive={isAdminActive}
          authChecking={authChecking || adminChecking}
          adminDocData={adminDocData}
          adminCheckError={adminCheckError}
        />
      );
    }

    return <AdminLayout currentHash={currentHash} user={user} />;
  }

  const handleCustomerLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
      setIsAdminActive(false);
      window.location.hash = '#/';
    } catch (err) {
      console.warn('Logout error:', err);
    }
  };

  // Storefront view
  return (
    <div className="min-h-screen bg-white text-gray-900 selection:bg-black selection:text-white font-sans">
      {showSplash ? (
        <SplashScreen onFinish={handleSplashFinish} />
      ) : (
        <Home
          onResetSplash={handleResetSplash}
          isAdmin={user && isAdminActive}
          user={user}
          userProfile={userProfile}
          onLogout={handleCustomerLogout}
        />
      )}
    </div>
  );
}
