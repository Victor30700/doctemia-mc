"use client";
import { useState, useEffect, Suspense } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  deleteDoc
} from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';

function ResultadosContent() {
  const { examId } = useParams();
  const router = useRouter();
  const { isDark } = useTheme();

  const [attempts, setAttempts] = useState([]);
  const [examTitle, setExamTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (!examId) return;

    const fetchResults = async () => {
      setLoading(true);
      try {
        // Obtener título del examen
        const examSnap = await getDoc(doc(db, 'exams', examId));
        if (examSnap.exists()) {
          setExamTitle(examSnap.data().title);
        } else {
          console.warn("Título del examen no encontrado");
        }

        // Obtener intentos
        const q = query(
          collection(db, 'examAttempts'),
          where('examId', '==', examId)
        );
        const snapshot = await getDocs(q);
        const data = [];
        snapshot.forEach(d => {
          data.push({ id: d.id, ...d.data() });
        });
        // Ordenar por puntaje descendente
        data.sort((a, b) => b.score - a.score);
        setAttempts(data);
      } catch (error) {
        console.error("Error al cargar resultados:", error);
        alert("Error al cargar los resultados.");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [examId]);

  const handleDeleteAttempt = async (attemptId, userEmail) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar la respuesta de ${userEmail}?`)) {
      return;
    }

    setDeletingId(attemptId);
    try {
      await deleteDoc(doc(db, 'examAttempts', attemptId));
      
      // Actualizar el estado local removiendo el intento eliminado
      setAttempts(prevAttempts => 
        prevAttempts.filter(attempt => attempt.id !== attemptId)
      );
      
      alert("Respuesta eliminada exitosamente.");
    } catch (error) {
      console.error("Error al eliminar respuesta:", error);
      alert("Error al eliminar la respuesta. Inténtalo de nuevo.");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <p className={`text-lg font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          Cargando resultados...
        </p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 transition-colors duration-200 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className={`max-w-7xl mx-auto ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg transition-colors duration-200`}>
        <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <h1 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Resultados del Examen: {examTitle || `ID: ${examId}`}
          </h1>
          <button
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              isDark 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
            onClick={() => router.back()}
          >
            Volver
          </button>
        </div>

        <div className="p-6">
          {attempts.length === 0 ? (
            <div className="text-center py-12">
              <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Nadie ha realizado este examen todavía.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className={`w-full border-collapse rounded-lg overflow-hidden shadow-sm ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                <thead className={`${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <tr>
                    <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'} border-b ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                      Usuario (Email)
                    </th>
                    <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'} border-b ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                      Puntaje
                    </th>
                    <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'} border-b ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                      Estado
                    </th>
                    <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'} border-b ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                      Fecha Completado
                    </th>
                    <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'} border-b ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.map((attempt, index) => (
                    <tr 
                      key={attempt.id}
                      className={`transition-colors duration-150 ${
                        isDark 
                          ? 'hover:bg-gray-700 border-gray-600' 
                          : 'hover:bg-gray-50 border-gray-200'
                      } ${index !== attempts.length - 1 ? 'border-b' : ''}`}
                    >
                      <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                        {attempt.userEmail}
                      </td>
                      <td className={`px-6 py-4 text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                        {attempt.score}/100
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                          attempt.resultStatus === 'aprobado'
                            ? isDark
                              ? 'bg-green-900 text-green-200 border border-green-700'
                              : 'bg-green-100 text-green-800 border border-green-200'
                            : isDark
                              ? 'bg-red-900 text-red-200 border border-red-700'
                              : 'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                          {attempt.resultStatus}
                        </span>
                      </td>
                      <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {attempt.completedAt
                          ? new Date(
                              attempt.completedAt.seconds * 1000
                            ).toLocaleString()
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => handleDeleteAttempt(attempt.id, attempt.userEmail)}
                          disabled={deletingId === attempt.id}
                          className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
                            deletingId === attempt.id
                              ? isDark
                                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : isDark
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : 'bg-red-500 hover:bg-red-600 text-white'
                          }`}
                        >
                          {deletingId === attempt.id ? 'Eliminando...' : 'Eliminar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResultadosPage() {
  const { isDark, isLoaded } = useTheme();

  // Loading skeleton mientras se carga el tema
  if (!isLoaded) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="animate-pulse p-6">
          <div className={`max-w-7xl mx-auto ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg`}>
            <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className={`h-8 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded mb-4`}></div>
              <div className={`h-10 w-24 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded`}></div>
            </div>
            <div className="p-6">
              <div className={`h-64 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded`}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className={`flex items-center justify-center min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className={`text-lg font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          Cargando...
        </div>
      </div>
    }>
      <ResultadosContent />
    </Suspense>
  );
}