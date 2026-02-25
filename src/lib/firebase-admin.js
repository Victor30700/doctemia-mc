// src/lib/firebase-admin.js
import { initializeApp, getApps, cert, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function getServiceAccount() {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const projectId = process.env.FIREBASE_PROJECT_ID;

  if (!privateKey || !clientEmail || !projectId) return null;

  return {
    projectId,
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, '\n').replace(/^"|"$/g, ''),
  };
}

let app;

if (!getApps().length) {
  const serviceAccount = getServiceAccount();
  if (serviceAccount) {
    try {
      app = initializeApp({
        credential: cert(serviceAccount),
      });
      // La configuración de Firestore se debe hacer INMEDIATAMENTE después de inicializar la app
      // y solo una vez.
      const dbInstance = getFirestore(app);
      dbInstance.settings({ ignoreUndefinedProperties: true });
      console.log('Firebase Admin y Firestore inicializados con éxito.');
    } catch (error) {
      console.error('Error al inicializar Firebase Admin:', error.message);
    }
  } else {
    console.warn('Faltan variables de entorno para Firebase Admin.');
  }
} else {
  app = getApp();
}

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
