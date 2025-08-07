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
  const [timer, setTimer] = useState(0); // Nuevo estado para el temporizador en minutos
  const [questions, setQuestions] = useState([
    { 
      questionText: '', 
      type: 'multiple-choice', 
      options: ['', '', ''], 
      correctOptionIndex: 0, 
      correctAnswer: '',
      correctOptionIndices: [], // Para múltiples opciones correctas
      explanation: '' // Explicación de por qué es correcta
    }
  ]);
  const [loading, setLoading] = useState(false);

  const handleNumQuestionsChange = (e) => {
    const count = parseInt(e.target.value, 10);
    if (count > 0) {
      setNumQuestions(count);
      const newQuestions = Array(count)
        .fill(null)
        .map((_, i) => questions[i] || { 
          questionText: '', 
          type: 'multiple-choice', 
          options: ['', '', ''], 
          correctOptionIndex: 0, 
          correctAnswer: '',
          correctOptionIndices: [],
          explanation: ''
        });
      setQuestions(newQuestions);
    }
  };

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...questions];
    if (field === 'option') {
      const [optIndex, optValue] = value;
      newQuestions[index].options[optIndex] = optValue;
    } else if (field === 'type') {
        newQuestions[index].type = value;
        // Reiniciar campos al cambiar de tipo para evitar datos inconsistentes
        if (value === 'open-ended') {
            newQuestions[index].options = [];
            newQuestions[index].correctOptionIndex = -1;
            newQuestions[index].correctOptionIndices = [];
            newQuestions[index].correctAnswer = '';
            newQuestions[index].explanation = '';
        } else { // 'multiple-choice'
            newQuestions[index].options = ['', '', ''];
            newQuestions[index].correctOptionIndex = 0;
            newQuestions[index].correctOptionIndices = [];
            newQuestions[index].correctAnswer = '';
            newQuestions[index].explanation = '';
        }
    } else if (field === 'correctOptionIndices') {
      // Manejar selección múltiple de opciones correctas
      const currentIndices = newQuestions[index].correctOptionIndices || [];
      if (currentIndices.includes(value)) {
        newQuestions[index].correctOptionIndices = currentIndices.filter(idx => idx !== value);
      } else {
        newQuestions[index].correctOptionIndices = [...currentIndices, value].sort((a, b) => a - b);
      }
      // También actualizar correctOptionIndex para compatibilidad hacia atrás
      if (newQuestions[index].correctOptionIndices.length > 0) {
        newQuestions[index].correctOptionIndex = newQuestions[index].correctOptionIndices[0];
      }
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
    let corrIndices = newQuestions[questionIndex].correctOptionIndices || [];
    
    // Ajustar correctOptionIndex
    if (corr === optionIndex) {
      corr = 0;
    } else if (corr > optionIndex) {
      corr--;
    }
    newQuestions[questionIndex].correctOptionIndex = Math.max(0, Math.min(corr, opts.length - 1));
    
    // Ajustar correctOptionIndices
    corrIndices = corrIndices
      .filter(idx => idx !== optionIndex) // Remover la opción eliminada
      .map(idx => idx > optionIndex ? idx - 1 : idx); // Ajustar índices
    
    newQuestions[questionIndex].correctOptionIndices = corrIndices;
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

    // Validación de preguntas actualizada
    for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.questionText.trim()) {
            setLoading(false);
            return Swal.fire({ icon: 'error', title: 'Error', text: `El texto de la pregunta ${i + 1} no puede estar vacío.` });
        }
        if (q.type === 'multiple-choice') {
            if (q.options.some(opt => !opt.trim())) {
                setLoading(false);
                return Swal.fire({ icon: 'error', title: 'Error', text: `Todas las opciones de la pregunta ${i + 1} deben tener texto.` });
            }
            // Validar que al menos una opción esté marcada como correcta
            if ((!q.correctOptionIndices || q.correctOptionIndices.length === 0) && (q.correctOptionIndex < 0 || q.correctOptionIndex >= q.options.length)) {
                setLoading(false);
                return Swal.fire({ icon: 'error', title: 'Error', text: `Selecciona al menos una opción correcta válida para la pregunta ${i + 1}.` });
            }
            // Validar explicación si hay opciones múltiples correctas
            if (q.correctOptionIndices && q.correctOptionIndices.length > 0 && !q.explanation.trim()) {
                setLoading(false);
                return Swal.fire({ icon: 'error', title: 'Error', text: `La explicación de la respuesta correcta es requerida para la pregunta ${i + 1}.` });
            }
            // También validar explicación para preguntas de opción múltiple en general
            if (q.type === 'multiple-choice' && !q.explanation.trim()) {
                setLoading(false);
                return Swal.fire({ icon: 'error', title: 'Error', text: `La explicación de la respuesta correcta es requerida para la pregunta ${i + 1}.` });
            }
        } else if (q.type === 'open-ended') {
            if (!q.correctAnswer || !q.correctAnswer.trim()) {
                setLoading(false);
                return Swal.fire({ icon: 'error', title: 'Error', text: `La respuesta correcta para la pregunta de desarrollo #${i + 1} no puede estar vacía.` });
            }
        }
    }

    try {
      await addDoc(collection(db, 'exams'), {
        title,
        description,
        status: examStatus,
        scheduledAt: scheduleTimestamp,
        timer: timer > 0 ? timer : null, // Guarda el temporizador, o null si es 0
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

          {/* Input para el Temporizador */}
          <div>
            <label className={`block font-semibold mb-1 ${
              isDark ? 'text-gray-200' : 'text-gray-700'
            }`}>
              Tiempo del Examen (minutos):
            </label>
            <input
              type="number"
              className={`w-full px-4 py-2 border rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isDark 
                  ? 'bg-gray-800 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              min="0"
              value={timer}
              onChange={(e) => setTimer(parseInt(e.target.value, 10) || 0)}
            />
             <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Dejar en 0 para tiempo ilimitado.
            </p>
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

                {/* Selector de Tipo de Pregunta */}
                <div className="mb-4">
                    <label className={`block mb-1 font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                        Tipo de Pregunta:
                    </label>
                    <select
                        className={`w-full px-4 py-2 border rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            isDark ? 'bg-gray-900 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        value={q.type || 'multiple-choice'}
                        onChange={(e) => handleQuestionChange(qIndex, 'type', e.target.value)}
                    >
                        <option value="multiple-choice">Opción Múltiple</option>
                        <option value="open-ended">Desarrollo (Respuesta Abierta)</option>
                    </select>
                </div>

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

                {/* Campo de explicación - se muestra para preguntas de opción múltiple */}
                {q.type === 'multiple-choice' && (
                  <div className={`mb-4 p-4 rounded-lg ${isDark ? 'bg-gray-900 border border-gray-600' : 'bg-blue-50 border border-blue-200'}`}>
                    <label className={`block mb-2 font-medium ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                      💡 Explicación de la respuesta correcta:
                    </label>
                    <textarea
                      className={`w-full px-4 py-2 border rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDark ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                      value={q.explanation || ''}
                      onChange={(e) => handleQuestionChange(qIndex, 'explanation', e.target.value)}
                      placeholder="Escribe por qué la(s) respuesta(s) correcta(s) son válidas. Este texto se mostrará a los estudiantes después del examen."
                      rows="3"
                      required={q.correctOptionIndices && q.correctOptionIndices.length > 0}
                    />
                    <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Esta explicación aparecerá en los resultados del examen para ayudar a los estudiantes a entender la respuesta.
                    </p>
                  </div>
                )}
                
                {/* Renderizado condicional basado en el tipo de pregunta */}
                {q.type === 'open-ended' ? (
                    <div>
                        <label className={`block mb-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                            Respuesta Correcta (para revisión):
                        </label>
                        <textarea
                            className={`w-full px-4 py-2 border rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                isDark ? 'bg-gray-900 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                            }`}
                            value={q.correctAnswer}
                            onChange={(e) => handleQuestionChange(qIndex, 'correctAnswer', e.target.value)}
                            required
                            rows="3"
                        ></textarea>
                    </div>
                ) : (
                    <>
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
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                className={`w-4 h-4 rounded border transition-colors duration-200 focus:ring-2 focus:ring-blue-500 ${
                                  isDark 
                                    ? 'bg-gray-800 border-gray-600 text-blue-600' 
                                    : 'bg-white border-gray-300 text-blue-600'
                                }`}
                                checked={q.correctOptionIndices && q.correctOptionIndices.includes(oIndex)}
                                onChange={() => handleQuestionChange(qIndex, 'correctOptionIndices', oIndex)}
                              />
                              <span className={`text-sm ${
                                isDark ? 'text-gray-300' : 'text-gray-600'
                              }`}>
                                Correcta
                              </span>
                            </div>
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
                    </>
                )}
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