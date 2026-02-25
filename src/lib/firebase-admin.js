// src/lib/firebase-admin.js
import { initializeApp, getApps, cert, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let app;
let serviceAccount;

try {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const projectId = process.env.FIREBASE_PROJECT_ID;

  if (privateKey && clientEmail && projectId) {
    serviceAccount = {
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n').replace(/^"|"$/g, ''),
    };
  } else {
    // Intento de fallback a archivo local (solo desarrollo)
    try {
      const fs = require('fs');
      const path = require('path');
      const jsonPath = path.join(process.cwd(), 'serviceAccountKey.json');
      if (fs.existsSync(jsonPath)) {
        const file = fs.readFileSync(jsonPath, 'utf8');
        serviceAccount = JSON.parse(file);
      }
    } catch (fsErr) {
      // Ignorar errores de fs en entornos donde no esté disponible
    }
  }
} catch (err) {
  console.error('Error al preparar serviceAccount de Firebase:', err.message);
}

if (serviceAccount) {
  if (!getApps().length) {
    try {
      app = initializeApp({
        credential: cert(serviceAccount),
      });
      console.log('Firebase Admin inicializado correctamente.');
    } catch (error) {
      console.error('Error al inicializar Firebase Admin:', error.message);
    }
  } else {
    app = getApp();
  }
} else {
  console.warn('Faltan variables de entorno de Firebase Admin (FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL, FIREBASE_PROJECT_ID).');
}

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;

