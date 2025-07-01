"use client";
import { useState, useEffect, Suspense, useMemo } from 'react';
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
import Swal from 'sweetalert2';

// --- Modal Component ---
function AttemptDetailsModal({ attempt, exam, onClose, isDark }) {
    if (!attempt || !exam) return null;

    const answersWithDetails = useMemo(() => {
        return exam.questions.map((question, index) => {
            const userAnswer = attempt.answers?.[index];
            return { question, userAnswer };
        });
    }, [exam, attempt]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 transition-opacity duration-300">
            <div className={`rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col ${isDark ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}`}>
                <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    <h2 className="text-2xl font-bold">Detalles del Intento</h2>
                    <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Usuario: <span className='font-medium'>{attempt.userEmail}</span></p>
                    <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Puntaje: <span className='font-medium'>{attempt.score}/100</span></p>
                </div>

                <div className="overflow-y-auto p-6 space-y-6">
                    {answersWithDetails.map(({ question, userAnswer }, index) => (
                        <div key={index} className={`p-4 rounded-md ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <p className="font-semibold mb-2">P{index + 1}: {question.questionText}</p>
                            
                            {question.type === 'open-ended' ? (
                                <div className='space-y-2'>
                                    <div>
                                        <h4 className={`text-sm font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Respuesta del Usuario:</h4>
                                        <p className={`p-2 rounded ${isDark ? 'bg-gray-800' : 'bg-white'}`}>{userAnswer?.textAnswer || <span className='italic text-gray-500'>No contestada</span>}</p>
                                    </div>
                                    <div>
                                        <h4 className={`text-sm font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>Respuesta Correcta de Referencia:</h4>
                                        <p className={`p-2 rounded ${isDark ? 'bg-gray-800' : 'bg-white'}`}>{question.correctAnswer}</p>
                                    </div>
                                </div>
                            ) : (
                                <ul className='space-y-1'>
                                    {question.options.map((option, optIndex) => {
                                        const isUserAnswer = userAnswer?.selectedOptionIndex === optIndex;
                                        const isCorrectAnswer = question.correctOptionIndex === optIndex;
                                        let optionClass = isDark ? 'bg-gray-800' : 'bg-white';
                                        if (isUserAnswer && isCorrectAnswer) optionClass = isDark ? 'bg-green-800 border-green-500' : 'bg-green-100 border-green-500';
                                        else if (isUserAnswer && !isCorrectAnswer) optionClass = isDark ? 'bg-red-800 border-red-500' : 'bg-red-100 border-red-500';
                                        else if (isCorrectAnswer) optionClass = isDark ? 'bg-green-800 border-green-500' : 'bg-green-100 border-green-500';

                                        return (
                                            <li key={optIndex} className={`p-2 rounded border ${isDark ? 'border-gray-600' : 'border-gray-300'} ${optionClass}`}>
                                                {option}
                                                {isUserAnswer && <span className='text-xs font-bold ml-2'> (Tu respuesta)</span>}
                                                {isCorrectAnswer && !isUserAnswer && <span className='text-xs font-bold ml-2'> (Correcta)</span>}
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    ))}
                </div>
                
                <div className={`px-6 py-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} text-right`}>
                    <button onClick={onClose} className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${isDark ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}>
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}


function ResultadosContent() {
  const { examId } = useParams();
  const router = useRouter();
  const { isDark } = useTheme();

  const [attempts, setAttempts] = useState([]);
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [selectedAttempt, setSelectedAttempt] = useState(null);

  useEffect(() => {
    if (!examId) return;

    const fetchResults = async () => {
      setLoading(true);
      try {
        const examSnap = await getDoc(doc(db, 'exams', examId));
        if (examSnap.exists()) {
          setExam({ id: examSnap.id, ...examSnap.data() });
        } else {
          Swal.fire('Error', 'El examen que buscas no existe.', 'error');
          router.push('/admin/bank-preguntas');
          return;
        }

        const q = query(collection(db, 'examAttempts'), where('examId', '==', examId));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        data.sort((a, b) => b.score - a.score);
        setAttempts(data);
      } catch (error) {
        console.error("Error al cargar resultados:", error);
        Swal.fire('Error', 'Hubo un error al cargar los resultados.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [examId, router]);

  const handleDeleteAttempt = async (attemptId, userEmail) => {
    const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: `Se eliminará permanentemente el intento de ${userEmail}.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        background: isDark ? '#1f2937' : '#fff',
        color: isDark ? '#f9fafb' : '#111827'
    });

    if (result.isConfirmed) {
      setDeletingId(attemptId);
      try {
        await deleteDoc(doc(db, 'examAttempts', attemptId));
        setAttempts(prevAttempts => prevAttempts.filter(attempt => attempt.id !== attemptId));
        Swal.fire({
            title: '¡Eliminado!',
            text: 'La respuesta ha sido eliminada.',
            icon: 'success',
            background: isDark ? '#1f2937' : '#fff',
            color: isDark ? '#f9fafb' : '#111827'
        });
      } catch (error) {
        console.error("Error al eliminar respuesta:", error);
        Swal.fire('Error', 'No se pudo eliminar la respuesta. Inténtalo de nuevo.', 'error');
      } finally {
        setDeletingId(null);
      }
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <p className="text-lg font-medium">Cargando resultados...</p>
      </div>
    );
  }

  return (
    <>
      <div className={`min-h-screen p-4 sm:p-6 transition-colors duration-200 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`max-w-7xl mx-auto ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg transition-colors duration-200`}>
          <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <h1 className={`text-xl sm:text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Resultados del Examen: {exam?.title || `ID: ${examId}`}
            </h1>
            <button
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
              onClick={() => router.back()}
            >
              Volver
            </button>
          </div>

          <div className="p-4 sm:p-6">
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
                      <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Usuario</th>
                      <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Puntaje</th>
                      <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Estado</th>
                      <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Fecha</th>
                      <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attempts.map((attempt) => (
                      <tr key={attempt.id} className={`transition-colors duration-150 border-b ${isDark ? 'hover:bg-gray-700 border-gray-600' : 'hover:bg-gray-50 border-gray-200'}`}>
                        <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>{attempt.userEmail}</td>
                        <td className={`px-6 py-4 text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{attempt.score}/100</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${attempt.resultStatus === 'aprobado' ? (isDark ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800') : (isDark ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800')}`}>
                            {attempt.resultStatus}
                          </span>
                        </td>
                        <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          {attempt.completedAt ? new Date(attempt.completedAt.seconds * 1000).toLocaleString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm space-x-2">
                          <button onClick={() => setSelectedAttempt(attempt)} className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${isDark ? 'bg-sky-600 hover:bg-sky-700 text-white' : 'bg-sky-500 hover:bg-sky-600 text-white'}`}>
                            Detalles
                          </button>
                          <button onClick={() => handleDeleteAttempt(attempt.id, attempt.userEmail)} disabled={deletingId === attempt.id} className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${deletingId === attempt.id ? (isDark ? 'bg-gray-600 cursor-not-allowed' : 'bg-gray-300 cursor-not-allowed') : (isDark ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white')}`}>
                            {deletingId === attempt.id ? '...' : 'Eliminar'}
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
      {selectedAttempt && <AttemptDetailsModal attempt={selectedAttempt} exam={exam} onClose={() => setSelectedAttempt(null)} isDark={isDark} />}
    </>
  );
}

export default function ResultadosPage() {
  const { isDark, isLoaded } = useTheme();

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
        <div className="text-lg font-medium">Cargando...</div>
      </div>
    }>
      <ResultadosContent />
    </Suspense>
  );
}
