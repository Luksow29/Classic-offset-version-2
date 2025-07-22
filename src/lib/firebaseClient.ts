// src/lib/firebaseClient.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth'; // 1. ADDED: Auth import

// உங்கள் Firebase திட்டத்தின் விவரங்கள்.
const firebaseConfig = {
  apiKey: "AIzaSyBqbrtGmDkzKNpyMpAYp57CYfvZxSCwuWE",
  authDomain: "classic-offset-cards.firebaseapp.com",
  projectId: "classic-offset-cards",
  storageBucket: "classic-offset-cards.appspot.com",
  messagingSenderId: "723894732778",
  appId: "1:723894732778:web:524ff4af317750fe14d493"
};

// Firebase-ஐ தொடங்குதல் (Re-initialization-ஐத் தவிர்க்க)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Firestore சேவையைப் பெறுதல்
const db = getFirestore(app);

// 2. ADDED: Auth சேவையைப் பெறுதல்
const auth = getAuth(app);

// 3. UPDATED: db மற்றும் auth இரண்டையும் export செய்யவும்
export { db, auth };