"use client";
import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import {
  doc,
  getDoc,
  addDoc,
  collection,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { useTheme } from '@/context/ThemeContext';
import Swal from 'sweetalert2';

// --- Componente del Temporizador (integrado en el panel de navegación) ---
function Timer({ initialMinutes, onTimeUp, isDark }) {
    const [timeLeft, setTimeLeft] = useState(initialMinutes * 60);

    useEffect(() => {
        if (timeLeft <= 0) {
            onTimeUp();
            return;
        }
        const intervalId = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        return () => clearInterval(intervalId);
    }, [timeLeft, onTimeUp]);

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const timeColor = timeLeft < 300 ? (isDark ? 'text-red-400' : 'text-red-500') : (isDark ? 'text-gray-200' : 'text-gray-800');

    return (
        <div className={`text-center p-4 rounded-lg mb-4 ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
            <div className="text-sm uppercase text-gray-500">Tiempo Restante</div>
            <div className={`text-4xl font-bold ${timeColor}`}>
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
        </div>
    );
}

function ExamenContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const examId = searchParams.get('examId');
  const { isDark } = useTheme();

  const [examData, setExamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [examFinished, setExamFinished] = useState(false);
  const [results, setResults] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [startTime, setStartTime] = useState(null);

  const handleSubmitExam = useCallback(async () => {
    if (submitting) return;
    if (!auth.currentUser) {
      Swal.fire({ icon: 'error', title: 'Autenticación Requerida', text: 'Debes estar autenticado para enviar el examen.' });
      return;
    }
    setSubmitting(true);

    const multipleChoiceQuestions = examData.questions.filter(q => q.type === 'multiple-choice');
    let correctCount = 0;

    const answersWithDetails = examData.questions.map((q, i) => {
      const userAnswer = userAnswers[i];
      const isCorrect = q.type === 'multiple-choice' ? userAnswer.selectedOptionIndex === q.correctOptionIndex : null;
      if (isCorrect) correctCount++;
      
      return {
        questionIndex: i, questionText: q.questionText, type: q.type, options: q.options || [],
        correctOptionIndex: q.correctOptionIndex, correctAnswer: q.correctAnswer || '',
        selectedOptionIndex: userAnswer.selectedOptionIndex, textAnswer: userAnswer.textAnswer, isCorrect: isCorrect,
      };
    });

    const score = multipleChoiceQuestions.length > 0 ? Math.round((correctCount / multipleChoiceQuestions.length) * 100) : 100;
    const resultStatus = score >= 51 ? 'aprobado' : 'reprobado';
    setResults({ score, answersWithCorrectness: answersWithDetails, resultStatus });

    try {
      await addDoc(collection(db, 'examAttempts'), {
        examId: examData.id, userId: auth.currentUser.uid, userEmail: auth.currentUser.email,
        startedAt: startTime, completedAt: serverTimestamp(), answers: userAnswers, score, resultStatus
      });
      setExamFinished(true);
    } catch (err) {
      console.error("Error al guardar intento:", err);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Error al guardar tu examen. Intenta de nuevo.' });
    } finally {
      setSubmitting(false);
    }
  }, [examData, userAnswers, startTime, submitting]);

  useEffect(() => {
    if (!examId) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'ID de examen no proporcionado.' });
      router.push('/app/examen-test');
      return;
    }
    const loadExam = async () => {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, 'exams', examId));
        if (!snap.exists() || snap.data().status !== 'active') {
          Swal.fire({ icon: 'error', title: 'No disponible', text: 'Este examen no se encuentra o no está activo.' });
          return router.push('/app/examen-test');
        }
        const data = snap.data();
        setExamData({ id: snap.id, ...data });
        setUserAnswers(
          Array(data.questions.length).fill(null).map((_, i) => ({
            questionIndex: i, selectedOptionIndex: null, textAnswer: ''
          }))
        );
        setStartTime(Timestamp.now());
      } catch (err) {
        console.error("Error al cargar el examen:", err);
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo cargar el examen.' });
        router.push('/app/examen-test');
      } finally {
        setLoading(false);
      }
    };
    loadExam();
  }, [examId, router]);

  const handleAnswerChange = (index, value) => {
    const questionType = examData.questions[index].type;
    setUserAnswers(ans =>
      ans.map(a => {
        if (a.questionIndex === index) {
          return questionType === 'open-ended' ? { ...a, textAnswer: value } : { ...a, selectedOptionIndex: value };
        }
        return a;
      })
    );
  };

  const isQuestionAnswered = (index) => {
      const answer = userAnswers[index];
      if (!answer) return false;
      const question = examData.questions[index];
      if (question.type === 'multiple-choice') return answer.selectedOptionIndex !== null;
      if (question.type === 'open-ended') return answer.textAnswer.trim() !== '';
      return false;
  };

  const finalSubmitConfirmation = async () => {
      const unansweredCount = userAnswers.filter((_, i) => !isQuestionAnswered(i)).length;

      if (unansweredCount > 0) {
          const result = await Swal.fire({
              title: '¿Estás seguro?', text: `Tienes ${unansweredCount} pregunta(s) sin responder. ¿Deseas enviar de todas formas?`,
              icon: 'warning', showCancelButton: true, confirmButtonColor: '#3085d6', cancelButtonColor: '#d33',
              confirmButtonText: 'Sí, enviar', cancelButtonText: 'Volver',
              background: isDark ? '#1f2937' : '#fff', color: isDark ? '#f9fafb' : '#111827'
          });
          if (!result.isConfirmed) return;
      }
      handleSubmitExam();
  };

  if (loading) return <div className={`flex items-center justify-center min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}><p>Cargando examen...</p></div>;
  if (!examData) return <div className={`flex items-center justify-center min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}><p>No se pudo cargar el examen.</p></div>;

  if (examFinished && results) {
    return (
      <div className={`max-w-4xl mx-auto p-4 sm:p-6 my-8 rounded-lg shadow-md ${isDark ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}`}>
        <h1 className="text-3xl font-bold mb-2">Resultados: {examData.title}</h1>
        <h2 className={`text-2xl mb-4 font-semibold ${results.resultStatus === 'aprobado' ? 'text-green-500' : 'text-red-500'}`}>
          Calificación: {results.score}/100 ({results.resultStatus.toUpperCase()})
        </h2>
        <p className={`mb-6 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Nota: Las preguntas de desarrollo no se califican automáticamente y no afectan tu puntaje.
        </p>
        <div className="space-y-4 mb-6 max-h-[60vh] overflow-y-auto pr-2">
          {results.answersWithCorrectness.map((item, idx) => (
            <div key={idx} className={`p-4 rounded-lg border ${item.type === 'multiple-choice' ? (item.isCorrect ? (isDark ? 'bg-green-900/50 border-green-700' : 'bg-green-50 border-green-300') : (isDark ? 'bg-red-900/50 border-red-700' : 'bg-red-50 border-red-300')) : (isDark ? 'bg-sky-900/50 border-sky-700' : 'bg-sky-50 border-sky-300')}`}>
              <p className="font-semibold mb-2">{idx + 1}. {item.questionText}</p>
              {item.type === 'open-ended' ? (
                <div className='space-y-3'>
                    <div>
                        <h4 className={`text-sm font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Tu respuesta:</h4>
                        <p className={`p-2 rounded text-sm ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>{item.textAnswer || <span className='italic text-gray-500'>No contestada</span>}</p>
                    </div>
                    <div>
                        <h4 className={`text-sm font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>Respuesta de referencia:</h4>
                        <p className={`p-2 rounded text-sm ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>{item.correctAnswer}</p>
                    </div>
                </div>
              ) : (
                <ul className="space-y-1 text-sm">
                  {item.options.map((opt, oi) => (
                      <li key={oi} className={`pl-2 ${ item.correctOptionIndex === oi ? 'font-bold text-green-600 dark:text-green-400' : (item.selectedOptionIndex === oi ? 'font-normal text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-400')}`}>
                          {String.fromCharCode(97 + oi)}) {opt}
                          {item.selectedOptionIndex === oi && item.correctOptionIndex !== oi && <span className='text-xs ml-2'>(Tu respuesta)</span>}
                          {item.correctOptionIndex === oi && <span className='text-xs ml-2'>(Correcta)</span>}
                      </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
        <button onClick={() => router.push('/app/examen-test')} className={`w-full px-5 py-3 rounded-md transition text-base font-semibold ${isDark ? 'bg-gray-600 hover:bg-gray-500 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}>
          Volver a Exámenes
        </button>
      </div>
    );
  }

  const question = examData.questions[currentQuestionIndex];
  const answer = userAnswers[currentQuestionIndex];

  return (
    <div className={`min-h-screen flex flex-col md:flex-row p-4 gap-4 ${isDark ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900'}`}>
        {/* Panel de Navegación (Derecha en Desktop, Arriba en Móvil) */}
        <div className={`md:w-1/4 lg:w-1/5 w-full md:order-2 p-4 rounded-lg shadow-lg flex flex-col ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            {examData.timer && <Timer initialMinutes={examData.timer} onTimeUp={handleSubmitExam} isDark={isDark} />}
            <h3 className="font-bold mb-3 text-center">Preguntas</h3>
            <div className="grid grid-cols-5 gap-2 mb-4 flex-grow overflow-y-auto">
                {examData.questions.map((_, index) => {
                    const isAnswered = isQuestionAnswered(index);
                    const isActive = currentQuestionIndex === index;
                    let buttonClass = '';
                    if (isActive) {
                        buttonClass = isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white';
                    } else if (isAnswered) {
                        buttonClass = isDark ? 'bg-green-800 hover:bg-green-700 text-green-200' : 'bg-green-200 hover:bg-green-300 text-green-800';
                    } else {
                        buttonClass = isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300';
                    }
                    return (
                        <button key={index} onClick={() => setCurrentQuestionIndex(index)} className={`h-10 w-10 flex items-center justify-center rounded font-mono transition-all duration-200 ${buttonClass}`}>
                            {index + 1}
                        </button>
                    );
                })}
            </div>
            <button onClick={finalSubmitConfirmation} disabled={submitting} className={`w-full mt-auto px-5 py-3 rounded-md transition text-white font-bold disabled:opacity-50 ${isDark ? 'bg-green-700 hover:bg-green-600' : 'bg-green-600 hover:bg-green-500'}`}>
                {submitting ? 'Enviando...' : 'Finalizar Examen'}
            </button>
        </div>

        {/* Panel de Pregunta (Izquierda en Desktop, Abajo en Móvil) */}
        <div className={`md:w-3/4 lg:w-4/5 w-full md:order-1 p-6 rounded-lg shadow-lg flex flex-col ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex-grow">
                <h2 className="text-2xl font-bold mb-1">{examData.title}</h2>
                <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Mostrando pregunta {currentQuestionIndex + 1} de {examData.questions.length}
                </p>
                <div className={`p-6 rounded-lg ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
                    <h3 className="font-semibold mb-4 text-xl leading-relaxed">{question.questionText}</h3>
                    {question.type === 'open-ended' ? (
                        <textarea
                            value={answer.textAnswer}
                            onChange={(e) => handleAnswerChange(currentQuestionIndex, e.target.value)}
                            rows="8"
                            className={`w-full p-3 rounded-md border text-base transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                            placeholder="Escribe tu respuesta aquí..."
                        />
                    ) : (
                        <ul className="space-y-3">
                        {question.options.map((opt, i) => (
                            <li key={i}>
                                <label className={`flex items-center space-x-4 p-4 rounded-lg cursor-pointer transition-all border-2 ${answer.selectedOptionIndex === i ? (isDark ? 'bg-blue-900/50 border-blue-500' : 'bg-blue-100 border-blue-500') : (isDark ? 'bg-gray-700 border-transparent hover:border-gray-500' : 'bg-gray-100 border-transparent hover:border-gray-300')}`}>
                                    <input type="radio" name={`q-${currentQuestionIndex}`} checked={answer.selectedOptionIndex === i} onChange={() => handleAnswerChange(currentQuestionIndex, i)} className="h-5 w-5 flex-shrink-0 text-blue-600 focus:ring-blue-500 border-gray-300" />
                                    <span className="text-base">{opt}</span>
                                </label>
                            </li>
                        ))}
                        </ul>
                    )}
                </div>
            </div>
            {/* Botones de navegación inferior */}
            <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button onClick={() => setCurrentQuestionIndex(i => Math.max(0, i - 1))} disabled={currentQuestionIndex === 0} className={`px-6 py-2 rounded-md transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}>
                    Anterior
                </button>
                <button onClick={() => setCurrentQuestionIndex(i => Math.min(examData.questions.length - 1, i + 1))} disabled={currentQuestionIndex === examData.questions.length - 1} className={`px-6 py-2 rounded-md transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}>
                    Siguiente
                </button>
            </div>
        </div>
    </div>
  );
}

export default function ExamenPage() {
  return (
    <Suspense fallback={<div className="text-center py-6 text-lg text-gray-700 dark:text-gray-300">Cargando...</div>}>
      <ExamenContent />
    </Suspense>
  );
}
