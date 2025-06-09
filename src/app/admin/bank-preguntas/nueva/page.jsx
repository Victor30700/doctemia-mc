"use client";
import { useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import '@/app/styles/exam-form.css';

export default function NuevaPreguntaPage() {
  const router = useRouter();
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
    // Ajustar índice de correcta
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

    // Validaciones
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
    <div className="exam-container">
      <h1 className="exam-title">Registrar Nuevo Examen</h1>
      <form onSubmit={handleSubmit} className="exam-form">
        <div className="form-group">
          <label>Título:</label>
          <input
            type="text"
            className="form-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Descripción:</label>
          <textarea
            className="form-input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Fecha de Programación (opcional):</label>
          <input
            type="datetime-local"
            className="form-input"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            disabled={activateManually}
          />
        </div>

        <div className="toggle-group">
          <input
            type="checkbox"
            checked={activateManually}
            onChange={(e) => {
              setActivateManually(e.target.checked);
              if (e.target.checked) setScheduledAt('');
            }}
          />
          <label>Activar manualmente ahora (ignora fecha de programación)</label>
        </div>

        <div className="form-group">
          <label>Número de Preguntas:</label>
          <input
            type="number"
            className="form-input"
            min="1"
            value={numQuestions}
            onChange={handleNumQuestionsChange}
          />
        </div>

        <div className="questions-container">
          {questions.map((q, qIndex) => (
            <div key={qIndex} className="question-block">
              <h3>Pregunta {qIndex + 1}</h3>
              <div className="form-group">
                <label>Texto de la Pregunta:</label>
                <input
                  type="text"
                  className="form-input"
                  value={q.questionText}
                  onChange={(e) => handleQuestionChange(qIndex, 'questionText', e.target.value)}
                  required
                />
              </div>

              {q.options.map((option, oIndex) => (
                <div key={oIndex} className="option-group">
                  <label>Opción {String.fromCharCode(97 + oIndex)})</label>
                  <input
                    type="text"
                    className="form-input"
                    value={option}
                    onChange={(e) => handleQuestionChange(qIndex, 'option', [oIndex, e.target.value])}
                    required
                  />
                  <input
                    type="radio"
                    name={`correctOption-${qIndex}`}
                    checked={q.correctOptionIndex === oIndex}
                    onChange={() => handleQuestionChange(qIndex, 'correctOptionIndex', oIndex)}
                  />
                  <label>Correcta</label>
                  {q.options.length > 1 && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => removeOption(qIndex, oIndex)}
                    >
                      Eliminar Opción
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => addOption(qIndex)}
              >
                Añadir Opción
              </button>
            </div>
          ))}
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar Examen'}
        </button>
      </form>
    </div>
  );
}
