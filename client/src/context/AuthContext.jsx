import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup,
  signOut, sendPasswordResetEmail, sendEmailVerification, updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase.js';
import { api } from '../api.js';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function friendlyAuthError(err) {
  const map = {
    'auth/invalid-credential': 'That email and password do not match. Check them and try again.',
    'auth/wrong-password': 'That email and password do not match. Check them and try again.',
    'auth/user-not-found': 'That email and password do not match. Check them and try again.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/email-already-in-use': 'An account with this email already exists. Sign in instead, or use “Continue with Google” if you signed up that way.',
    'auth/weak-password': 'Choose a stronger password (at least 8 characters).',
    'auth/too-many-requests': 'Too many attempts. Please wait a few minutes or reset your password.',
    'auth/network-request-failed': 'Network problem. Check your connection and try again.',
    'auth/popup-blocked': 'Your browser blocked the Google sign-in window. Allow pop-ups for this site and try again.',
    'auth/account-exists-with-different-credential': 'An account already exists for this email with a different sign-in method. Sign in with your original method.',
    'auth/unauthorized-domain': 'This website address is not authorised in Firebase yet (Authentication > Settings > Authorized domains).',
    'auth/user-disabled': 'This account has been disabled.',
  };
  return map[err?.code] || err?.message || 'Something went wrong. Please try again.';
}

export function AuthProvider({ children }) {
  const [state, setState] = useState({ user: null, isAdmin: false, loading: true });

  const readClaims = useCallback(async (user, force = false) => {
    if (!user) return setState({ user: null, isAdmin: false, loading: false });
    const token = await user.getIdTokenResult(force);
    setState({ user, isAdmin: token.claims.admin === true, loading: false });
  }, []);

  useEffect(() => onAuthStateChanged(auth, (u) => { readClaims(u, true).catch(() => setState({ user: u, isAdmin: false, loading: false })); }), [readClaims]);

  const syncProfile = (name) => api('/auth/profile', { method: 'POST', body: { name } }).catch(() => {});

  const value = {
    ...state,
    async register({ name, email, password }) {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      sendEmailVerification(cred.user).catch(() => {});
      await syncProfile(name);
      await readClaims(auth.currentUser, true);
    },
    async login({ email, password }) {
      await signInWithEmailAndPassword(auth, email, password);
      await syncProfile();
    },
    // Returns false if the person simply closed the Google window.
    async google() {
      try { await signInWithPopup(auth, googleProvider); } catch (e) {
        if (['auth/popup-closed-by-user', 'auth/cancelled-popup-request'].includes(e.code)) return false;
        throw e;
      }
      await syncProfile();
      return true;
    },
    logout: () => signOut(auth),
    resetPassword: (email) => sendPasswordResetEmail(auth, email),
    resendVerification: () => sendEmailVerification(auth.currentUser),
    async refresh() { await auth.currentUser?.reload(); await readClaims(auth.currentUser, true); },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
