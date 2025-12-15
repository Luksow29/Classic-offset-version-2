// src/lib/firebaseClient.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth'; // 1. ADDED: Auth import

// உங்கள் Firebase திட்டத்தின் விவரங்கள்.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Firebase-ஐ தொடங்குதல் (Re-initialization-ஐத் தவிர்க்க)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Firestore சேவையைப் பெறுதல்
const db = getFirestore(app);

// 2. ADDED: Auth சேவையைப் பெறுதல்
const auth = getAuth(app);

// 3. UPDATED: db மற்றும் auth இரண்டையும் export செய்யவும்
export { db, auth };