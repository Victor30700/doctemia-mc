import { db } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  getDocs, 
  query, 
  where, 
  Timestamp,
  increment,
  writeBatch
} from 'firebase/firestore';

/**
 * Guarda o actualiza el progreso de una flashcard para un usuario específico.
 * @param {string} userId - ID del usuario.
 * @param {string} flashcardId - ID de la tarjeta.
 * @param {Object} revisionData - Datos calculados por el algoritmo SM-2.
 * @param {string} subtemaName - Nombre del subtema para analíticas.
 * @param {number} quality - Calificación otorgada (1-5).
 * @param {boolean} forceMastered - Si se marca manualmente como dominada.
 */
export async function saveFlashcardProgress(userId, flashcardId, revisionData, subtemaName, quality, forceMastered = false) {
  try {
    const progressRef = doc(db, 'users', userId, 'flashcards_progress', flashcardId);
    
    // Si quality es 1 o 2, es una debilidad activa.
    const esDebilidadActiva = quality <= 2;
    const isFailure = quality <= 2;
    
    // Lógica de "Regla de 3" (Auto-Mastered)
    // Si la calificación es 4 o 5 Y la racha (repetitions) es >= 3, se marca como dominada.
    let isMastered = forceMastered;
    if (!isMastered && quality >= 4 && (revisionData.repetitions || 0) >= 3) {
      isMastered = true;
    }
    
    await setDoc(progressRef, {
      ...revisionData,
      subtemaName: subtemaName || 'General',
      nextReview: Timestamp.fromDate(revisionData.nextReview),
      lastUpdated: Timestamp.now(),
      esDebilidadActiva,
      isMastered,
      // Actualización Atómica de Contadores Absolutos
      totalVistas: increment(1),
      totalFallos: increment(isFailure ? 1 : 0),
      totalAciertos: increment(!isFailure ? 1 : 0)
    }, { merge: true });
  } catch (error) {
    console.error("Error al guardar progreso de flashcard:", error);
    throw error;
  }
}

/**
 * Obtiene métricas generales de progreso para el Dashboard.
 * @param {string} userId - ID del usuario.
 */
export async function getFlashcardMetrics(userId) {
  try {
    const progressRef = collection(db, 'users', userId, 'flashcards_progress');
    const snapshot = await getDocs(progressRef);
    
    const now = new Date();
    let dueToday = 0;
    const subtemaStats = {}; 
    const criticalCards = [];
    let totalLearning = 0;

    snapshot.forEach(doc => {
      const data = doc.data();
      const cardId = doc.id;
      
      // EXCLUIR DOMINADAS de los contadores de aprendizaje activo
      if (data.isMastered) return;

      totalLearning++;

      // 1. Contador de pendientes hoy
      if (data.nextReview && data.nextReview.toDate() <= now) {
        dueToday++;
      }

      // 2. Acumular datos por subtema para rendimiento visual
      const sub = data.subtemaName || 'General';
      if (!subtemaStats[sub]) {
        subtemaStats[sub] = { name: sub, aciertos: 0, fallos: 0, count: 0 };
      }
      subtemaStats[sub].aciertos += (data.totalAciertos || 0);
      subtemaStats[sub].fallos += (data.totalFallos || 0);
      subtemaStats[sub].count++;

      // 3. Identificar tarjetas críticas (debilidad activa)
      if (data.esDebilidadActiva) {
        criticalCards.push({
          id: cardId,
          subtema: sub,
          totalFallos: data.totalFallos || 0,
          totalAciertos: data.totalAciertos || 0,
          totalVistas: data.totalVistas || 0,
          nextReview: data.nextReview,
          isMastered: data.isMastered || false,
          lastUpdated: data.lastUpdated
        });
      }
    });

    // Procesar rendimiento por subtema
    const performanceBySubtheme = Object.values(subtemaStats).map(sub => {
      const total = sub.aciertos + sub.fallos;
      const percentage = total > 0 ? Math.round((sub.aciertos / total) * 100) : 0;
      return { ...sub, percentage };
    }).sort((a, b) => a.percentage - b.percentage); // Ordenar de peor a mejor rendimiento

    // Ordenar tarjetas críticas por más fallos
    const sortedCritical = criticalCards
      .sort((a, b) => b.totalFallos - a.totalFallos)
      .slice(0, 5); // Solo las top 5 más críticas

    return {
      dueToday,
      totalLearning,
      performanceBySubtheme,
      criticalCards: sortedCritical
    };
  } catch (error) {
    console.error("Error al obtener métricas:", error);
    return { dueToday: 0, totalLearning: 0, performanceBySubtheme: [], criticalCards: [] };
  }
}

/**
 * Obtiene las tarjetas de un subtema que el usuario debe estudiar hoy.
 */
export async function getDueFlashcards(userId, subtemaName) {
  try {
    const cleanSubtema = subtemaName?.trim();
    const flashcardsRef = collection(db, 'flashcards');
    const qGlobal = query(flashcardsRef, where('subtema', '==', cleanSubtema));
    const globalSnapshot = await getDocs(qGlobal);
    
    const allFlashcards = globalSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const progressRef = collection(db, 'users', userId, 'flashcards_progress');
    const progressSnapshot = await getDocs(progressRef);
    
    const userProgressMap = {};
    progressSnapshot.forEach(doc => {
      userProgressMap[doc.id] = doc.data();
    });

    const now = new Date();
    now.setHours(23, 59, 59, 999);

    const dueFlashcards = allFlashcards.filter(card => {
      const progress = userProgressMap[card.id];
      // SI YA ESTÁ DOMINADA, NO SE MUESTRA
      if (progress?.isMastered) return false;
      
      if (!progress) return true;
      const nextReviewDate = progress.nextReview.toDate();
      return nextReviewDate <= now;
    });

    return dueFlashcards.map(card => ({
      ...card,
      userProgress: userProgressMap[card.id] || null
    }));

  } catch (error) {
    console.error("Error al obtener tarjetas pendientes:", error);
    throw error;
  }
}

/**
 * Obtiene TODAS las flashcards de un subtema para el Modo Estudio Intensivo.
 * EXCLUYE las ya dominadas.
 */
export async function getAllFlashcardsBySubtema(userId, subtemaName) {
  try {
    const cleanSubtema = subtemaName?.trim();
    const flashcardsRef = collection(db, 'flashcards');
    const qGlobal = query(flashcardsRef, where('subtema', '==', cleanSubtema));
    const globalSnapshot = await getDocs(qGlobal);
    
    const allFlashcards = globalSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const progressRef = collection(db, 'users', userId, 'flashcards_progress');
    const progressSnapshot = await getDocs(progressRef);
    
    const userProgressMap = {};
    progressSnapshot.forEach(doc => {
      userProgressMap[doc.id] = doc.data();
    });

    return allFlashcards
      .filter(card => !userProgressMap[card.id]?.isMastered) // Filtro de dominadas
      .map(card => ({
        ...card,
        userProgress: userProgressMap[card.id] || null
      }));
  } catch (error) {
    console.error("Error al obtener todas las tarjetas:", error);
    throw error;
  }
}

/**
 * Obtiene todas las tarjetas marcadas como debilidad activa para el usuario.
 */
export async function getWeakFlashcards(userId) {
  try {
    const progressRef = collection(db, 'users', userId, 'flashcards_progress');
    const q = query(progressRef, where('esDebilidadActiva', '==', true), where('isMastered', '==', false));
    const progressSnapshot = await getDocs(q);
    
    if (progressSnapshot.empty) return [];

    const userProgressMap = {};
    const cardIds = [];
    progressSnapshot.forEach(doc => {
      userProgressMap[doc.id] = doc.data();
      cardIds.push(doc.id);
    });

    // Como Firestore no soporta 'in' con más de 30 IDs fácilmente, 
    // y aquí solo queremos las más críticas, limitamos o traemos las necesarias.
    const flashcardsRef = collection(db, 'flashcards');
    const allFlashcards = [];
    
    // Traemos los documentos por ID (por lotes de 10 para 'in')
    for (let i = 0; i < cardIds.length; i += 10) {
      const batchIds = cardIds.slice(i, i + 10);
      const qCards = query(flashcardsRef, where('__name__', 'in', batchIds));
      const cardSnap = await getDocs(qCards);
      cardSnap.forEach(doc => {
        allFlashcards.push({
          id: doc.id,
          ...doc.data(),
          userProgress: userProgressMap[doc.id]
        });
      });
    }

    return allFlashcards;
  } catch (error) {
    console.error("Error al obtener tarjetas débiles:", error);
    throw error;
  }
}

/**
 * Restaura todas las tarjetas dominadas de un subtema específico.
 */
export async function restoreMasteredFlashcards(userId, subtemaName) {
  try {
    const progressRef = collection(db, 'users', userId, 'flashcards_progress');
    const q = query(progressRef, where('subtemaName', '==', subtemaName), where('isMastered', '==', true));
    const snapshot = await getDocs(q);
    
    const batch = writeBatch(db);
    snapshot.forEach(doc => {
      batch.update(doc.ref, { isMastered: false, esDebilidadActiva: false });
    });
    
    await batch.commit();
  } catch (error) {
    console.error("Error restaurando tarjetas:", error);
    throw error;
  }
}

/**
 * Obtiene el conteo de tarjetas dominadas por subtema.
 */
export async function getMasteredCount(userId, subtemaName) {
  try {
    const progressRef = collection(db, 'users', userId, 'flashcards_progress');
    const q = query(progressRef, where('subtemaName', '==', subtemaName), where('isMastered', '==', true));
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error("Error al obtener conteo de dominadas:", error);
    return 0;
  }
}
