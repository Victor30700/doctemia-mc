// src/lib/firebase-admin.js
import { initializeApp, getApps, cert, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function getServiceAccount() {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const projectId = process.env.FIREBASE_PROJECT_ID;

  if (!privateKey || !clientEmail || !projectId) {
    return null;
  }

  return {
    projectId,
    clientEmail,
    // Limpieza profunda de la clave privada para Vercel
    privateKey: privateKey.replace(/\\n/g, '\n').replace(/^"|"$/g, ''),
  };
}

function initAdmin() {
  const apps = getApps();
  if (apps.length > 0) {
    return apps[0];
  }

  const serviceAccount = getServiceAccount();
  if (!serviceAccount) {
    console.error('CRÍTICO: Faltan variables de entorno para Firebase Admin.');
    return null;
  }

  try {
    return initializeApp({
      credential: cert(serviceAccount),
    });
  } catch (error) {
    console.error('Error al inicializar Firebase Admin:', error.message);
    return null;
  }
}

const app = initAdmin();

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
