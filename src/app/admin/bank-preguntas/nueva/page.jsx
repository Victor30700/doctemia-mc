"use client";
import { useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import Swal from 'sweetalert2';

export default function NuevaPreguntaPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [activateManually, setActivateManually] = useState(false);
  const [numQuestions, setNumQuestions] = useState(1);
  const [questions, setQuestions] = useState([
    { questionText: '', options: ['', '', ''], correctOptionIndex: 0 }
  ]);
  const [loading, setLoading] = useState(false);

  const handleNumQuestionsChange = (e) => {
    const count = parseInt(e.target.value, 10);
    if (count > 0) {
      setNumQuestions(count);
      const newQuestions = Array(count)
        .fill(null)
        .map((_, i) => questions[i] || { questionText: '', options: ['', '', ''], correctOptionIndex: 0 });
      setQuestions(newQuestions);
    }
  };

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...questions];
    if (field === 'option') {
      const [optIndex, optValue] = value;
      newQuestions[index].options[optIndex] = optValue;
    } else {
      newQuestions[index][field] = value;
    }
    setQuestions(newQuestions);
  };

  const addOption = (questionIndex) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options.push('');
    setQuestions(newQuestions);
  };

  const removeOption = (questionIndex, optionIndex) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options.splice(optionIndex, 1);
    const opts = newQuestions[questionIndex].options;
    let corr = newQuestions[questionIndex].correctOptionIndex;
    if (corr === optionIndex) {
      corr = 0;
    } else if (corr > optionIndex) {
      corr--;
    }
    newQuestions[questionIndex].correctOptionIndex = Math.min(corr, opts.length - 1);
    setQuestions(newQuestions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) {
      return Swal.fire({ icon: 'error', title: 'Error', text: 'Debes estar autenticado como admin.' });
    }
    setLoading(true);

    let examStatus = 'inactive';
    let scheduleTimestamp = null;

    if (activateManually) {
      examStatus = 'active';
    } else if (scheduledAt) {
      scheduleTimestamp = Timestamp.fromDate(new Date(scheduledAt));
      if (new Date(scheduledAt) <= new Date()) {
        examStatus = 'active';
      }
    }

    for (const q of questions) {
      if (!q.questionText.trim()) {
        setLoading(false);
        return Swal.fire({ icon: 'error', title: 'Error', text: 'El texto de una pregunta no puede estar vacío.' });
      }
      if (q.options.some(opt => !opt.trim())) {
        setLoading(false);
        return Swal.fire({ icon: 'error', title: 'Error', text: 'Todas las opciones deben tener texto.' });
      }
      const idx = q.correctOptionIndex;
      if (idx < 0 || idx >= q.options.length) {
        setLoading(false);
        return Swal.fire({ icon: 'error', title: 'Error', text: 'Selecciona una opción correcta válida.' });
      }
    }

    try {
      await addDoc(collection(db, 'exams'), {
        title,
        description,
        status: examStatus,
        scheduledAt: scheduleTimestamp,
        questions,
        creatorUid: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await Swal.fire({ icon: 'success', title: '¡Éxito!', text: 'Examen registrado exitosamente.' });
      router.push('/admin/bank-preguntas');
    } catch (error) {
      console.error('Error al registrar examen:', error);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Error al registrar el examen.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen px-4 py-8 transition-colors duration-200 ${
      isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-800'
    }`}>
      <div className="max-w-4xl mx-auto">
        <h1 className={`text-2xl font-bold mb-6 text-center ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          Registrar Nuevo Examen
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className={`block font-semibold mb-1 ${
              isDark ? 'text-gray-200' : 'text-gray-700'
            }`}>
              Título:
            </label>
            <input
              type="text"
              className={`w-full px-4 py-2 border rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isDark 
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label className={`block font-semibold mb-1 ${
              isDark ? 'text-gray-200' : 'text-gray-700'
            }`}>
              Descripción:
            </label>
            <textarea
              className={`w-full px-4 py-2 border rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isDark 
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className={`block font-semibold mb-1 ${
              isDark ? 'text-gray-200' : 'text-gray-700'
            }`}>
              Fecha de Programación (opcional):
            </label>
            <input
              type="datetime-local"
              className={`w-full px-4 py-2 border rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${
                isDark 
                  ? 'bg-gray-800 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              disabled={activateManually}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              className={`w-4 h-4 rounded border transition-colors duration-200 focus:ring-2 focus:ring-blue-500 ${
                isDark 
                  ? 'bg-gray-800 border-gray-600 text-blue-600 focus:ring-blue-500' 
                  : 'bg-white border-gray-300 text-blue-600 focus:ring-blue-500'
              }`}
              checked={activateManually}
              onChange={(e) => {
                setActivateManually(e.target.checked);
                if (e.target.checked) setScheduledAt('');
              }}
            />
            <label className={`${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
              Activar manualmente ahora (ignora fecha de programación)
            </label>
          </div>

          <div>
            <label className={`block font-semibold mb-1 ${
              isDark ? 'text-gray-200' : 'text-gray-700'
            }`}>
              Número de Preguntas:
            </label>
            <input
              type="number"
              className={`w-full px-4 py-2 border rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isDark 
                  ? 'bg-gray-800 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              min="1"
              value={numQuestions}
              onChange={handleNumQuestionsChange}
            />
          </div>

          <div className="space-y-8">
            {questions.map((q, qIndex) => (
              <div 
                key={qIndex} 
                className={`p-4 border rounded-lg transition-colors duration-200 ${
                  isDark 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <h3 className={`text-lg font-semibold mb-2 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Pregunta {qIndex + 1}
                </h3>
                <div className="mb-4">
                  <label className={`block mb-1 ${
                    isDark ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    Texto de la Pregunta:
                  </label>
                  <input
                    type="text"
                    className={`w-full px-4 py-2 border rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDark 
                        ? 'bg-gray-900 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    value={q.questionText}
                    onChange={(e) => handleQuestionChange(qIndex, 'questionText', e.target.value)}
                    required
                  />
                </div>

                {q.options.map((option, oIndex) => (
                  <div key={oIndex} className="flex items-center gap-2 mb-2">
                    <label className={`w-24 ${
                      isDark ? 'text-gray-200' : 'text-gray-700'
                    }`}>
                      Opción {String.fromCharCode(97 + oIndex)}):
                    </label>
                    <input
                      type="text"
                      className={`flex-1 px-3 py-2 border rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDark 
                          ? 'bg-gray-900 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                      value={option}
                      onChange={(e) => handleQuestionChange(qIndex, 'option', [oIndex, e.target.value])}
                      required
                    />
                    <input
                      type="radio"
                      className={`w-4 h-4 transition-colors duration-200 focus:ring-2 focus:ring-blue-500 ${
                        isDark 
                          ? 'bg-gray-800 border-gray-600 text-blue-600' 
                          : 'bg-white border-gray-300 text-blue-600'
                      }`}
                      name={`correctOption-${qIndex}`}
                      checked={q.correctOptionIndex === oIndex}
                      onChange={() => handleQuestionChange(qIndex, 'correctOptionIndex', oIndex)}
                    />
                    <span className={`text-sm ${
                      isDark ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      Correcta
                    </span>
                    {q.options.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeOption(qIndex, oIndex)}
                        className={`text-sm transition-colors duration-200 hover:underline ${
                          isDark 
                            ? 'text-red-400 hover:text-red-300' 
                            : 'text-red-500 hover:text-red-600'
                        }`}
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => addOption(qIndex)}
                  className={`mt-2 text-sm transition-colors duration-200 hover:underline ${
                    isDark 
                      ? 'text-blue-400 hover:text-blue-300' 
                      : 'text-blue-600 hover:text-blue-700'
                  }`}
                >
                  Añadir Opción
                </button>
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 px-4 font-semibold rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
              isDark 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {loading ? 'Guardando...' : 'Guardar Examen'}
          </button>
        </form>
      </div>
    </div>
  );
}