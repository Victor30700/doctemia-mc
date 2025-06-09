"use client";
import { useState, useEffect, Suspense } from 'react';
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

function ExamenContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const examId = searchParams.get('examId');

  const [examData, setExamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [examFinished, setExamFinished] = useState(false);
  const [results, setResults] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!examId) {
      alert("ID de examen no encontrado.");
      router.push('/app/examen-test');
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, 'exams', examId));
        if (!snap.exists() || snap.data().status !== 'active') {
          alert("Examen no encontrado o no está activo.");
          return router.push('/app/examen-test');
        }
        const data = snap.data();
        setExamData({ id: snap.id, ...data });
        setUserAnswers(
          Array(data.questions.length)
            .fill(null)
            .map((_, i) => ({ questionIndex: i, selectedOptionIndex: null }))
        );
      } catch (err) {
        console.error("Error al cargar el examen:", err);
        alert("Error al cargar el examen.");
        router.push('/app/examen-test');
      } finally {
        setLoading(false);
      }
    })();
  }, [examId, router]);

  const handleOptionSelect = (idx) => {
    setUserAnswers(ans =>
      ans.map(a =>
        a.questionIndex === currentQuestionIndex
          ? { ...a, selectedOptionIndex: idx }
          : a
      )
    );
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < examData.questions.length - 1) {
      setCurrentQuestionIndex(i => i + 1);
    }
  };
  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(i => i - 1);
    }
  };

  const handleSubmitExam = async () => {
    if (!auth.currentUser) {
      alert("Debes estar autenticado para enviar el examen.");
      return;
    }
    if (userAnswers.some(a => a.selectedOptionIndex === null)) {
      if (!confirm("Hay preguntas sin responder. ¿Deseas enviar de todas formas?")) {
        return;
      }
    }
    setSubmitting(true);

    const answersWithCorrectness = examData.questions.map((q, i) => {
      const sel = userAnswers[i].selectedOptionIndex;
      const corr = q.correctOptionIndex;
      return {
        questionIndex: i,
        questionText: q.questionText,
        options: q.options,
        selectedOptionIndex: sel,
        correctOptionIndex: corr,
        isCorrect: sel === corr
      };
    });
    const correctCount = answersWithCorrectness.filter(a => a.isCorrect).length;
    const score = Math.round((correctCount / examData.questions.length) * 100);
    const resultStatus = score >= 51 ? 'aprobado' : 'reprobado';
    setResults({ score, answersWithCorrectness, resultStatus });

    try {
      await addDoc(collection(db, 'examAttempts'), {
        examId: examData.id,
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        startedAt: Timestamp.now(),
        completedAt: serverTimestamp(),
        answers: answersWithCorrectness.map(a => ({
          questionIndex: a.questionIndex,
          selectedOptionIndex: a.selectedOptionIndex,
          isCorrect: a.isCorrect
        })),
        score,
        resultStatus
      });
      setExamFinished(true);
    } catch (err) {
      console.error("Error al guardar intento:", err);
      alert("Error al guardar tu examen. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <p className="text-center py-6 text-lg text-gray-700 dark:text-gray-300">
        Cargando examen...
      </p>
    );
  }
  if (!examData) {
    return (
      <p className="text-center py-6 text-lg text-red-600 dark:text-red-400">
        No se pudo cargar el examen.
      </p>
    );
  }

  if (examFinished && results) {
    return (
      <div className="max-w-3xl mx-auto p-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-2">
          Resultados: {examData.title}
        </h1>
        <h2 className="text-xl mb-4 text-blue-600 dark:text-blue-400">
          Tu calificación: {results.score}/100 ({results.resultStatus.toUpperCase()})
        </h2>
        <div className="space-y-4 mb-6">
          {results.answersWithCorrectness.map((item, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-lg border ${
                item.isCorrect
                  ? 'bg-green-50 dark:bg-green-900 border-green-400'
                  : 'bg-red-50 dark:bg-red-900 border-red-400'
              }`}
            >
              <p className="font-semibold mb-2">
                {idx + 1}. {item.questionText}
              </p>
              <ul className="list-disc list-inside space-y-1">
                {item.options.map((opt, oi) => (
                  <li
                    key={oi}
                    className={`pl-2 ${
                      oi === item.correctOptionIndex
                        ? 'text-green-700 dark:text-green-300'
                        : oi === item.selectedOptionIndex
                        ? 'text-yellow-700 dark:text-yellow-300'
                        : 'text-gray-700 dark:text-gray-400'
                    }`}
                  >
                    {String.fromCharCode(97 + oi)}) {opt}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <button
          onClick={() => router.push('/app/examen-test')}
          className="px-5 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500"
        >
          Volver a Exámenes
        </button>
      </div>
    );
  }

  const question = examData.questions[currentQuestionIndex];
  const answer = userAnswers[currentQuestionIndex];

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-2">{examData.title}</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Pregunta {currentQuestionIndex + 1} de {examData.questions.length}
      </p>

      <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg shadow mb-4">
        <h3 className="font-medium mb-3">{question.questionText}</h3>
        <ul className="space-y-2">
          {question.options.map((opt, i) => (
            <li key={i}>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name={`q-${currentQuestionIndex}`}
                  checked={answer.selectedOptionIndex === i}
                  onChange={() => handleOptionSelect(i)}
                  className="form-radio h-4 w-4 text-blue-600"
                />
                <span>{String.fromCharCode(97 + i)}) {opt}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex justify-between items-center mt-6">
        <button
          onClick={goToPreviousQuestion}
          disabled={currentQuestionIndex === 0}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50"
        >
          Anterior
        </button>
        <button
          onClick={goToNextQuestion}
          disabled={currentQuestionIndex === examData.questions.length - 1}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50"
        >
          Siguiente
        </button>
        {currentQuestionIndex === examData.questions.length - 1 && (
          <button
            onClick={handleSubmitExam}
            disabled={submitting}
            className="px-5 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50"
          >
            {submitting ? 'Enviando...' : 'Enviar y Finalizar'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function ExamenPage() {
  return (
    <Suspense fallback={
      <p className="text-center py-6 text-lg text-gray-700 dark:text-gray-300">
        Cargando examen…
      </p>
    }>
      <ExamenContent />
    </Suspense>
  );
}
