/**
 * Algoritmo SuperMemo-2 (SM-2) optimizado.
 * Calcula el próximo intervalo de revisión basado en la calificación del usuario.
 * 
 * @param {number} quality - Calificación del 1 al 5.
 * @param {number} prevEasiness - Factor de facilidad previo (default 2.5).
 * @param {number} prevInterval - Intervalo previo en días.
 * @param {number} prevRepetitions - Número de repeticiones previas exitosas.
 */
export function calculateNextReview(quality, prevEasiness = 2.5, prevInterval = 0, prevRepetitions = 0) {
  let easiness = prevEasiness;
  let interval = 0;
  let repetitions = prevRepetitions;

  // Lógica de Intervalos y Repeticiones (Escala 1-5)
  if (quality === 1) {
    // Q=1 (Olvido): Reset total
    interval = 0;
    repetitions = 0;
    easiness -= 0.2;
  } else if (quality === 2) {
    // Q=2 (Difícil): Revisión mañana, mantiene reps o resetea levemente
    interval = 1;
    repetitions = 0; // Penalización de racha
    easiness -= 0.15;
  } else if (quality === 3) {
    // Q=3 (Normal): Mantiene easiness, escala intervalo estándar
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(prevInterval * easiness);
    repetitions++;
  } else if (quality === 4) {
    // Q=4 (Fácil): Sube easiness, escala intervalo * 1.3
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(prevInterval * easiness * 1.3);
    repetitions++;
    easiness += 0.1;
  } else if (quality === 5) {
    // Q=5 (Perfecto): Sube easiness ++, escala intervalo * 1.5
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(prevInterval * easiness * 1.5);
    repetitions++;
    easiness += 0.15;
  }

  // Limitar el factor de facilidad mínimo a 1.3
  if (easiness < 1.3) easiness = 1.3;

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  return {
    easiness,
    interval,
    repetitions,
    nextReview
  };
}
