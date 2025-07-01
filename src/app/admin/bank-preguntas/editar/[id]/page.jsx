'use client';
import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import Swal from 'sweetalert2';

export default function EditarPreguntaPage() {
  const router = useRouter();
  const { id: examId } = useParams();
  const { isDark } = useTheme();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [currentStatus, setCurrentStatus] = useState('');
  const [timer, setTimer] = useState(0); // Estado para el temporizador
  const [numQuestions, setNumQuestions] = useState(1);
  const [questions, setQuestions] = useState([
    { questionText: '', type: 'multiple-choice', options: ['', '', ''], correctOptionIndex: 0, correctAnswer: '' }
  ]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!examId) return;

    const fetchExam = async () => {
      setLoading(true);
      try {
        const examDocRef = doc(db, 'exams', examId);
        const examDoc = await getDoc(examDocRef);

        if (!examDoc.exists()) {
          Swal.fire({ icon: 'error', title: 'Error', text: 'Examen no encontrado.' });
          return router.push('/admin/bank-preguntas');
        }

        const data = examDoc.data();
        setTitle(data.title);
        setDescription(data.description || '');
        setCurrentStatus(data.status);
        setTimer(data.timer || 0); // Cargar el temporizador

        if (data.scheduledAt) {
          const date = data.scheduledAt.toDate();
          const offset = date.getTimezoneOffset();
          const localDate = new Date(date.getTime() - (offset * 60000));
          setScheduledAt(localDate.toISOString().slice(0, 16));
        }

        // Asegurar que las preguntas tengan todos los campos necesarios
        const loadedQuestions = data.questions.map(q => ({
            questionText: q.questionText || '',
            type: q.type || 'multiple-choice',
            options: q.options || (q.type !== 'open-ended' ? ['', '', ''] : []),
            correctOptionIndex: q.correctOptionIndex !== undefined ? q.correctOptionIndex : 0,
            correctAnswer: q.correctAnswer || ''
        }));
        
        setQuestions(loadedQuestions);
        setNumQuestions(loadedQuestions.length);

      } catch (error) {
        console.error("Error al cargar examen:", error);
        Swal.fire({ icon: 'error', title: 'Error', text: 'Error al cargar el examen.' });
        router.push('/admin/bank-preguntas');
      } finally {
        setLoading(false);
      }
    };

    fetchExam();
  }, [examId, router]);

  const handleNumQuestionsChange = (e) => {
    const count = parseInt(e.target.value, 10);
    if (count > 0) {
      setNumQuestions(count);
      const newQuestions = Array(count)
        .fill(null)
        .map((_, i) => questions[i] || { questionText: '', type: 'multiple-choice', options: ['', '', ''], correctOptionIndex: 0, correctAnswer: '' });
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
        if (value === 'open-ended') {
            newQuestions[index].options = [];
            newQuestions[index].correctOptionIndex = -1;
            newQuestions[index].correctAnswer = newQuestions[index].correctAnswer || ''; // Mantener si ya existe
        } else {
            newQuestions[index].options = newQuestions[index].options.length ? newQuestions[index].options : ['', '', ''];
            newQuestions[index].correctOptionIndex = 0;
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
    let corr = newQuestions[questionIndex].correctOptionIndex;
    if (corr === optionIndex) {
      corr = 0;
    } else if (corr > optionIndex) {
      corr--;
    }
    newQuestions[questionIndex].correctOptionIndex = Math.max(0, Math.min(corr, newQuestions[questionIndex].options.length - 1));
    setQuestions(newQuestions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) {
      return Swal.fire({ icon: 'error', title: 'Error', text: 'Debes estar autenticado como admin.' });
    }
    setSaving(true);

    for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.questionText.trim()) {
            setSaving(false);
            return Swal.fire({ icon: 'error', title: 'Error', text: `El texto de la pregunta ${i + 1} no puede estar vacío.` });
        }
        if (q.type === 'multiple-choice') {
            if (q.options.some(opt => !opt.trim())) {
                setSaving(false);
                return Swal.fire({ icon: 'error', title: 'Error', text: `Todas las opciones de la pregunta ${i + 1} deben tener texto.` });
            }
            if (q.correctOptionIndex < 0 || q.correctOptionIndex >= q.options.length) {
                setSaving(false);
                return Swal.fire({ icon: 'error', title: 'Error', text: `Selecciona una opción correcta válida para la pregunta ${i + 1}.` });
            }
        } else if (q.type === 'open-ended') {
            if (!q.correctAnswer || !q.correctAnswer.trim()) {
                setSaving(false);
                return Swal.fire({ icon: 'error', title: 'Error', text: `La respuesta correcta para la pregunta de desarrollo #${i + 1} no puede estar vacía.` });
            }
        }
    }

    try {
      await updateDoc(doc(db, 'exams', examId), {
        title,
        description,
        scheduledAt: scheduledAt ? Timestamp.fromDate(new Date(scheduledAt)) : null,
        timer: timer > 0 ? timer : null,
        questions,
        updatedAt: serverTimestamp()
      });
      await Swal.fire({ icon: 'success', title: '¡Éxito!', text: 'Examen actualizado exitosamente.' });
      router.push('/admin/bank-preguntas');
    } catch (error) {
      console.error("Error al actualizar examen:", error);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Error al actualizar el examen.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-800'}`}>Cargando datos del examen...</div>;
  }

  return (
    <div className={`min-h-screen px-4 py-8 transition-colors duration-200 ${isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-800'}`}>
      <div className="max-w-4xl mx-auto">
        <h1 className={`text-2xl font-bold mb-2 text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>Editar Examen</h1>
        <p className={`text-center mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Estado Actual: <strong className="font-semibold">{currentStatus}</strong>
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Campos de Título y Descripción */}
          <div>
            <label className={`block font-semibold mb-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Título:</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className={`w-full px-4 py-2 border rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
          </div>
          <div>
            <label className={`block font-semibold mb-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Descripción:</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} className={`w-full px-4 py-2 border rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
          </div>

          {/* Campo de Temporizador */}
          <div>
            <label className={`block font-semibold mb-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Tiempo del Examen (minutos):</label>
            <input type="number" min="0" value={timer} onChange={e => setTimer(parseInt(e.target.value, 10) || 0)} className={`w-full px-4 py-2 border rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Dejar en 0 para tiempo ilimitado.</p>
          </div>

          {/* Campo de Fecha de Programación */}
          <div>
            <label className={`block font-semibold mb-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Fecha de Programación (opcional):</label>
            <div className="flex gap-2 items-center">
              <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} className={`flex-grow px-4 py-2 border rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
              {scheduledAt && <button type="button" onClick={() => setScheduledAt('')} className={`text-sm transition-colors duration-200 ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}>Limpiar</button>}
            </div>
          </div>

          {/* Campo de Número de Preguntas */}
          <div>
            <label className={`block font-semibold mb-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Número de Preguntas:</label>
            <input type="number" min="1" value={numQuestions} onChange={handleNumQuestionsChange} className={`w-full px-4 py-2 border rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
          </div>

          {/* Mapeo de Preguntas */}
          <div className="space-y-8">
            {questions.map((q, qIndex) => (
              <div key={qIndex} className={`p-4 border rounded-lg transition-colors duration-200 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Pregunta {qIndex + 1}</h3>
                
                <div className="mb-4">
                    <label className={`block mb-1 font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Tipo de Pregunta:</label>
                    <select value={q.type || 'multiple-choice'} onChange={(e) => handleQuestionChange(qIndex, 'type', e.target.value)} className={`w-full px-4 py-2 border rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-gray-900 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                        <option value="multiple-choice">Opción Múltiple</option>
                        <option value="open-ended">Desarrollo (Respuesta Abierta)</option>
                    </select>
                </div>

                <div className="mb-4">
                  <label className={`block mb-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Texto de la Pregunta:</label>
                  <input type="text" value={q.questionText} onChange={e => handleQuestionChange(qIndex, 'questionText', e.target.value)} required className={`w-full px-4 py-2 border rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-gray-900 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
                </div>

                {q.type === 'open-ended' ? (
                    <div>
                        <label className={`block mb-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Respuesta Correcta (para revisión):</label>
                        <textarea value={q.correctAnswer} onChange={e => handleQuestionChange(qIndex, 'correctAnswer', e.target.value)} required rows="3" className={`w-full px-4 py-2 border rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-gray-900 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}></textarea>
                    </div>
                ) : (
                    <>
                        {q.options.map((option, oIndex) => (
                          <div key={oIndex} className="flex items-center gap-2 mb-2">
                            <label className={`w-24 shrink-0 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Opción {String.fromCharCode(97 + oIndex)}):</label>
                            <input type="text" value={option} onChange={e => handleQuestionChange(qIndex, 'option', [oIndex, e.target.value])} required className={`flex-1 px-3 py-2 border rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-gray-900 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
                            <input type="radio" name={`correctOption-${qIndex}`} checked={q.correctOptionIndex === oIndex} onChange={() => handleQuestionChange(qIndex, 'correctOptionIndex', oIndex)} className={`w-4 h-4 ${isDark ? 'text-blue-500' : 'text-blue-600'}`} />
                            <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Correcta</span>
                            {q.options.length > 1 && <button type="button" onClick={() => removeOption(qIndex, oIndex)} className={`text-sm ${isDark ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-600'}`}>Eliminar</button>}
                          </div>
                        ))}
                        <button type="button" onClick={() => addOption(qIndex)} className={`mt-2 text-sm transition-colors duration-200 ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}>Añadir Opción</button>
                    </>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-4 pt-4">
            <button type="submit" disabled={saving} className="w-full md:w-auto flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 font-semibold rounded-md transition disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
            <button type="button" onClick={() => router.back()} className={`w-full md:w-auto flex-1 px-4 py-2 font-semibold rounded-md transition ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
