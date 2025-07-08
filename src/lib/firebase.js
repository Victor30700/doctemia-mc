// src/lib/firebase.js

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// --- INICIALIZACIÓN SEGURA ---
// Esto previene que Firebase se reinicialice en cada recarga en caliente en desarrollo
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// --- SERVICIOS ---
// Inicializa todos los servicios que usarás en tu app y expórtalos desde aquí.
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
let analytics;

// Inicializa Analytics solo en el navegador si es compatible
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

// --- EXPORTACIONES ---
// Exporta todo desde este archivo central.
export { app, auth, db, storage, analytics };