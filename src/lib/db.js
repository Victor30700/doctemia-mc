// src/lib/db.js

import { collection } from 'firebase/firestore';
// Importamos la instancia ÚNICA de la base de datos desde nuestro archivo de configuración
import { db } from './firebase';

// --- REFERENCIAS A COLECCIONES DE FIRESTORE ---
// Simplemente usamos la instancia 'db' importada.

/** Cursos por Suscripción (Premium) */
export const coursesCollectionRef = collection(db, 'courses');

/** Cursos de Pago Único */
export const singlePaymentCoursesCollectionRef = collection(db, 'Cursos_Pago_Unico');

/** Colección de Usuarios */
export const usersCollectionRef = collection(db, 'users');

/** Clases en Vivo */
export const liveClassesCollectionRef = collection(db, 'liveClasses');

/** Banco de Preguntas */
export const questionBankCollectionRef = collection(db, 'questionBank');