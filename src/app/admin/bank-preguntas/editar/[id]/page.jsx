'use client';
import { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';

export default function EditarPreguntaPage() {
  const router = useRouter();
  const { id: examId } = useParams();
  const { isDark, isLoaded } = useTheme();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [currentStatus, setCurrentStatus] = useState('');
  const [numQuestions, setNumQuestions] = useState(1);
  const [questions, setQuestions] = useState([
    { questionText: '', options: ['', '', ''], correctOptionIndex: 0 }
  ]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!examId) return;
    setLoading(true);
    (async () => {
      try {
        const examDoc = await getDoc(doc(db, 'exams', examId));
        if (!examDoc.exists()) {
          alert("Examen no encontrado.");
          return router.push('/admin/bank-preguntas');
        }
        const data = examDoc.data();
        setTitle(data.title);
        setDescription(data.description || '');
        setCurrentStatus(data.status);
        if (data.scheduledAt) {
          const date = data.scheduledAt.toDate();
          const offset = date.getTimezoneOffset();
          const localDate = new Date(date.getTime() - offset * 60000);
          setScheduledAt(localDate.toISOString().slice(0,16));
        }
        setNumQuestions(data.questions.length);
        setQuestions(data.questions.map(q => ({ ...q, options: [...q.options] })));
      } catch (error) {
        console.error("Error al cargar examen:", error);
        alert("Error al cargar el examen.");
        router.push('/admin/bank-preguntas');
      } finally {
        setLoading(false);
      }
    })();
  }, [examId, router]);

  const handleNumQuestionsChange = (e) => {
    const count = parseInt(e.target.value, 10);
    if (count > 0) {
      setNumQuestions(count);
      setQuestions(qs =>
        Array.from({ length: count }, (_, i) => qs[i] || { questionText: '', options: ['', '', ''], correctOptionIndex: 0 })
      );
    }
  };

  const handleQuestionChange = (idx, field, value) => {
    setQuestions(qs => {
      const copy = [...qs];
      if (field === 'option') {
        const [oIdx, oVal] = value;
        copy[idx].options[oIdx] = oVal;
      } else {
        copy[idx][field] = value;
      }
      return copy;
    });
  };

  const addOption = (idx) => {
    setQuestions(qs => {
      const copy = [...qs];
      copy[idx].options.push('');
      return copy;
    });
  };

  const removeOption = (idx, oIdx) => {
    setQuestions(qs => {
      const copy = [...qs];
      copy[idx].options.splice(oIdx, 1);
      let ci = copy[idx].correctOptionIndex;
      if (ci === oIdx) ci = 0;
      else if (ci > oIdx) ci--;
      copy[idx].correctOptionIndex = Math.min(ci, copy[idx].options.length - 1);
      return copy;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) {
      alert("Debes estar autenticado como admin.");
      return;
    }
    setSaving(true);
    for (const q of questions) {
      if (!q.questionText.trim() || q.options.some(o => !o.trim()) ||
          q.correctOptionIndex < 0 || q.correctOptionIndex >= q.options.length) {
        setSaving(false);
        alert("Revisa que todas las preguntas y opciones estén completas y hayas seleccionado la opción correcta.");
        return;
      }
    }
    try {
      await updateDoc(doc(db, 'exams', examId), {
        title,
        description,
        scheduledAt: scheduledAt ? Timestamp.fromDate(new Date(scheduledAt)) : null,
        questions,
        updatedAt: serverTimestamp()
      });
      alert("Examen actualizado exitosamente!");
      router.push('/admin/bank-preguntas');
    } catch (error) {
      console.error("Error al actualizar examen:", error);
      alert("Error al actualizar el examen.");
    } finally {
      setSaving(false);
    }
  };

  if (!isLoaded || loading) return <p className="p-6 text-center" style={{ color: isDark ? '#f9fafb' : '#111827' }}>Cargando datos del examen...</p>;

  return (
    <div className="px-4 py-8 max-w-4xl mx-auto" style={{ backgroundColor: isDark ? '#111827' : '#f9fafb', color: isDark ? '#f9fafb' : '#111827' }}>
      <h1 className="text-3xl font-bold mb-4">Editar Examen</h1>
      <p className="mb-4">Estado Actual: <strong>{currentStatus}</strong></p>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block font-medium mb-1">Título:</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="w-full p-2 rounded border" style={{ backgroundColor: isDark ? '#1f2937' : '#ffffff', borderColor: isDark ? '#374151' : '#e5e7eb', color: isDark ? '#f9fafb' : '#111827' }} />
        </div>

        <div>
          <label className="block font-medium mb-1">Descripción:</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full p-2 rounded border" style={{ backgroundColor: isDark ? '#1f2937' : '#ffffff', borderColor: isDark ? '#374151' : '#e5e7eb', color: isDark ? '#f9fafb' : '#111827' }} />
        </div>

        <div>
          <label className="block font-medium mb-1">Fecha de Programación (opcional):</label>
          <div className="flex gap-2 items-center">
            <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} className="p-2 rounded border" style={{ backgroundColor: isDark ? '#1f2937' : '#ffffff', borderColor: isDark ? '#374151' : '#e5e7eb', color: isDark ? '#f9fafb' : '#111827' }} />
            {scheduledAt && <button type="button" onClick={() => setScheduledAt('')} className="text-sm text-blue-500">Limpiar Fecha</button>}
          </div>
        </div>

        <div>
          <label className="block font-medium mb-1">Número de Preguntas:</label>
          <input type="number" min="1" value={numQuestions} onChange={handleNumQuestionsChange} className="p-2 rounded border" style={{ backgroundColor: isDark ? '#1f2937' : '#ffffff', borderColor: isDark ? '#374151' : '#e5e7eb', color: isDark ? '#f9fafb' : '#111827' }} />
        </div>

        {questions.map((q, qi) => (
          <div key={qi} className="p-4 rounded border" style={{ backgroundColor: isDark ? '#1f2937' : '#ffffff', borderColor: isDark ? '#374151' : '#e5e7eb' }}>
            <h3 className="font-semibold mb-2">Pregunta {qi + 1}</h3>
            <input type="text" value={q.questionText} onChange={e => handleQuestionChange(qi, 'questionText', e.target.value)} required placeholder="Texto de la Pregunta" className="w-full p-2 rounded border mb-4" style={{ backgroundColor: isDark ? '#1f2937' : '#ffffff', borderColor: isDark ? '#374151' : '#e5e7eb', color: isDark ? '#f9fafb' : '#111827' }} />
            {q.options.map((opt, oi) => (
              <div key={oi} className="flex items-center gap-2 mb-2">
                <input type="text" value={opt} onChange={e => handleQuestionChange(qi, 'option', [oi, e.target.value])} className="flex-1 p-2 rounded border" style={{ backgroundColor: isDark ? '#1f2937' : '#ffffff', borderColor: isDark ? '#374151' : '#e5e7eb', color: isDark ? '#f9fafb' : '#111827' }} />
                <label className="flex items-center gap-1">
                  <input type="radio" name={`correct-${qi}`} checked={q.correctOptionIndex === oi} onChange={() => handleQuestionChange(qi, 'correctOptionIndex', oi)} />
                  <span>Correcta</span>
                </label>
                {q.options.length > 1 && (
                  <button type="button" onClick={() => removeOption(qi, oi)} className="text-sm text-red-500">Eliminar</button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => addOption(qi)} className="text-sm text-blue-500">Agregar Opción</button>
          </div>
        ))}

        <div className="flex gap-4">
          <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition">
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
          <button type="button" onClick={() => router.back()} className="text-gray-500 hover:text-red-500 px-4 py-2 rounded transition">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
