import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Ensure users/{uid} document exists on login.
 * Creates initial profile on first sign-in without overwriting existing data.
 */
export async function ensureUserProfile(user) {
  if (!db || !user?.uid) return null;

  try {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      const initialProfile = {
        displayName: user.displayName || '',
        email: user.email || '',
        photoURL: user.photoURL || '',
        phone: '',
        addresses: [],
        wishlist: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await setDoc(userRef, initialProfile);
      return initialProfile;
    } else {
      return userSnap.data();
    }
  } catch (err) {
    console.warn('Error ensuring user profile:', err);
    return null;
  }
}

/**
 * Fetch user profile from users/{uid}
 */
export async function getUserProfile(uid) {
  if (!db || !uid) return null;
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    return snap.exists() ? snap.data() : null;
  } catch (err) {
    console.warn('Error fetching user profile:', err);
    return null;
  }
}
