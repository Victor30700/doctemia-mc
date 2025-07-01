'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import { onAuthStateChanged } from 'firebase/auth';

// --- Iconos SVG para un look profesional ---
const FileTextIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </svg>
);

const ClockIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const EyeIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

// --- Modal para visualizar respuestas del intento ---
function AttemptAnswersModal({ attempt, exam, onClose, isDark }) {
    if (!attempt || !exam) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className={`rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col ${isDark ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}`} onClick={(e) => e.stopPropagation()}>
                <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    <h2 className="text-xl font-bold">Tus Respuestas del Examen</h2>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{exam.title}</p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Realizado el: {new Date(attempt.completedAt.seconds * 1000).toLocaleString()}</p>
                </div>

                <div className="overflow-y-auto p-6 space-y-4">
                    {exam.questions.map((question, index) => {
                        const userAnswer = attempt.answers.find(a => a.questionIndex === index);
                        return (
                            <div key={index} className={`p-4 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                                <p className="font-semibold mb-2">{index + 1}. {question.questionText}</p>
                                {question.type === 'open-ended' ? (
                                    <div>
                                        <p className={`p-2 rounded text-sm italic ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-700'}`}>
                                            {userAnswer?.textAnswer || "No contestada"}
                                        </p>
                                    </div>
                                ) : (
                                    <p className={`p-2 rounded text-sm italic ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-700'}`}>
                                        {userAnswer?.selectedOptionIndex !== null ?
                                            `Seleccionaste: "${question.options[userAnswer.selectedOptionIndex]}"` :
                                            "No contestada"
                                        }
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
                
                <div className={`px-6 py-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} text-right`}>
                    <button onClick={onClose} className={`px-5 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${isDark ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}>
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function ExamenTestPage() {
  const [examsWithAttempts, setExamsWithAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [viewingExam, setViewingExam] = useState(null);
  const { isDark, isLoaded } = useTheme();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const fetchExamsAndAttempts = async () => {
      setLoading(true);
      try {
        // 1. Obtener todos los intentos del usuario actual
        const attemptsQuery = query(collection(db, 'examAttempts'), where('userId', '==', currentUser.uid));
        const attemptsSnapshot = await getDocs(attemptsQuery);
        const userAttempts = {};
        attemptsSnapshot.forEach(doc => {
          const attempt = { id: doc.id, ...doc.data() };
          if (!userAttempts[attempt.examId]) {
            userAttempts[attempt.examId] = [];
          }
          userAttempts[attempt.examId].push(attempt);
        });

        // 2. Obtener todos los exámenes activos
        const examsQuery = query(collection(db, 'exams'), where('status', '==', 'active'));
        const examsSnapshot = await getDocs(examsQuery);
        const examsData = examsSnapshot.docs.map(doc => {
            const exam = { id: doc.id, ...doc.data() };
            // Ordenar intentos por fecha, el más reciente primero
            const attempts = (userAttempts[exam.id] || []).sort((a, b) => b.completedAt.seconds - a.completedAt.seconds);
            return { ...exam, attempts };
        });

        setExamsWithAttempts(examsData);
      } catch (error) {
        console.error('Error al cargar exámenes y resultados:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchExamsAndAttempts();
  }, [currentUser]);

  const handleViewAnswers = (attempt, exam) => {
      setSelectedAttempt(attempt);
      setViewingExam(exam);
  };

  if (!isLoaded || loading) {
    return (
      <div className={`min-h-screen p-8 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <h1 className={`text-3xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Exámenes Disponibles</h1>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
                <div key={i} className={`rounded-xl p-6 animate-pulse ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className={`h-6 rounded w-3/4 mb-3 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                    <div className={`h-4 rounded w-full mb-2 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                    <div className={`h-4 rounded w-5/6 mb-5 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                    <div className={`h-10 rounded w-full ${isDark ? 'bg-blue-500/50' : 'bg-blue-200'}`}></div>
                </div>
            ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`min-h-screen p-4 sm:p-8 ${isDark ? 'bg-gray-900' : 'bg-gray-100'} transition-colors`}>
        <h1 className={`text-3xl font-bold mb-8 ${isDark ? 'text-white' : 'text-gray-900'}`}>Exámenes Disponibles</h1>

        {examsWithAttempts.length === 0 ? (
          <div className="text-center py-16">
            <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              No hay exámenes disponibles en este momento.
            </p>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
            {examsWithAttempts.map(exam => (
              <div key={exam.id} className={`flex flex-col ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-lg transition-all hover:shadow-xl hover:-translate-y-1`}>
                <div className="p-6">
                    <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {exam.title}
                    </h2>
                    <p className={`text-sm mb-4 flex-grow ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {exam.description || "Este examen pondrá a prueba tus conocimientos."}
                    </p>
                    <div className="flex items-center space-x-6 text-sm mb-6">
                        <span className={`flex items-center gap-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            <FileTextIcon className="h-5 w-5" />
                            <span>{exam.questions.length} Preguntas</span>
                        </span>
                        {exam.timer && (
                             <span className={`flex items-center gap-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                <ClockIcon className="h-5 w-5" />
                                <span>{exam.timer} Minutos</span>
                            </span>
                        )}
                    </div>
                    <Link href={`/app/examen-test/examen?examId=${exam.id}`} className={`block w-full text-center font-semibold rounded-lg px-4 py-3 transition ${isDark ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
                      Comenzar Examen
                    </Link>
                </div>

                {exam.attempts.length > 0 && (
                  <div className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} p-6`}>
                      <h3 className={`text-sm font-bold uppercase mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Tus Intentos Anteriores</h3>
                      <ul className="space-y-3">
                          {exam.attempts.map(attempt => (
                              <li key={attempt.id} className={`flex justify-between items-center p-3 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                                  <div>
                                      <p className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                                          Calificación: {attempt.score}/100
                                      </p>
                                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                          {new Date(attempt.completedAt.seconds * 1000).toLocaleDateString()}
                                      </p>
                                  </div>
                                  <button onClick={() => handleViewAnswers(attempt, exam)} className={`p-2 rounded-full transition ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`} title="Ver tus respuestas">
                                      <EyeIcon className={`h-5 w-5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
                                  </button>
                              </li>
                          ))}
                      </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {selectedAttempt && viewingExam && (
          <AttemptAnswersModal
              attempt={selectedAttempt}
              exam={viewingExam}
              onClose={() => setSelectedAttempt(null)}
              isDark={isDark}
          />
      )}
    </>
  );
}
