'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';

export default function ExamenTestPage() {
  const [availableExams, setAvailableExams] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Obtengo el estado de tema
  const { isDark, isLoaded } = useTheme();

  useEffect(() => {
    const fetchAvailableExams = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'exams'),
          where('status', '==', 'active')
        );
        const snapshot = await getDocs(q);
        const examsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAvailableExams(examsData);
      } catch (error) {
        console.error('Error al cargar exámenes disponibles:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAvailableExams();
  }, []);

  // 2. Muestro un placeholder hasta que el tema esté listo
  if (!isLoaded) {
    return (
      <div className={`min-h-screen p-8 ${isDark ? 'bg-gray-900' : 'bg-gray-50'} transition-colors`}>
        <p className={`${isDark ? 'text-gray-100' : 'text-gray-700'}`}>Cargando exámenes...</p>
      </div>
    );
  }

  // 3. Defino clases según isDark
  const containerBg = isDark ? 'bg-gray-900' : 'bg-gray-50';
  const cardBg = isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const titleText = isDark ? 'text-gray-100' : 'text-gray-900';
  const bodyText = isDark ? 'text-gray-300' : 'text-gray-700';
  const metaText = isDark ? 'text-gray-400' : 'text-gray-600';
  const actionBg = isDark ? 'bg-blue-500 hover:bg-blue-400' : 'bg-blue-600 hover:bg-blue-700';

  return (
    <div className={`min-h-screen p-8 ${containerBg} transition-colors`}>
      <h1 className={`text-3xl font-bold mb-6 ${titleText}`}>
        Exámenes Disponibles
      </h1>

      {loading ? (
        <p className={bodyText}>Cargando exámenes disponibles...</p>
      ) : availableExams.length === 0 ? (
        <p className={`text-center ${bodyText}`}>
          No hay exámenes disponibles en este momento.
        </p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {availableExams.map(exam => (
            <li
              key={exam.id}
              className={`flex flex-col ${cardBg} rounded-lg shadow p-6 transition-colors`}
            >
              <h2 className={`text-xl font-semibold mb-2 ${titleText}`}>
                {exam.title}
              </h2>
              <p className={`${bodyText} mb-4 flex-grow`}>
                {exam.description}
              </p>
              <p className={`text-sm mb-6 ${metaText}`}>
                Preguntas: {exam.questions.length}
              </p>
              <Link
                href={`/app/examen-test/examen?examId=${exam.id}`}
                className={`${actionBg} text-white rounded-lg px-4 py-2 transition`}
              >
                Comenzar Examen
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
