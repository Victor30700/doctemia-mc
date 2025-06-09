"use client";
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { useTheme } from '@/context/ThemeContext';

export default function BankPreguntasPage() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [examToDelete, setExamToDelete] = useState(null);
  const router = useRouter();
  const { isDark, isLoaded } = useTheme();

  useEffect(() => {
    setLoading(true);
    const q = collection(db, 'exams');
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const examsData = [];
        querySnapshot.forEach((doc) => {
          examsData.push({ id: doc.id, ...doc.data() });
        });
        setExams(examsData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching exams: ", error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const swalTheme = {
    background: isDark ? '#1f2937' : '#ffffff',
    color: isDark ? '#f9fafb' : '#111827',
    confirmButtonColor: '#3b82f6',
    cancelButtonColor: '#ef4444',
  };

  const handleDelete = async () => {
    if (!examToDelete) return;
    try {
      await deleteDoc(doc(db, 'exams', examToDelete.id));
      Swal.fire({ icon: 'success', title: '¡Eliminado!', text: 'Examen eliminado exitosamente.', ...swalTheme });
    } catch (error) {
      console.error("Error al eliminar examen: ", error);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Error al eliminar el examen.', ...swalTheme });
    } finally {
      setShowDeleteModal(false);
      setExamToDelete(null);
    }
  };

  const openDeleteModal = (exam) => {
    setExamToDelete(exam);
    setShowDeleteModal(true);
  };

  const toggleExamStatus = async (exam) => {
    const newStatus = exam.status === "active" ? "inactive" : "active";
    try {
      await updateDoc(doc(db, 'exams', exam.id), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      Swal.fire({
        icon: 'success',
        title: newStatus === "active" ? 'Activado' : 'Desactivado',
        text: `Examen ${newStatus === "active" ? "activado" : "desactivado"}.`,
        ...swalTheme
      });
    } catch (error) {
      console.error("Error al cambiar estado: ", error);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Error al cambiar estado del examen.', ...swalTheme });
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen" style={{ backgroundColor: isDark ? '#111827' : '#f9fafb' }}>
        <p style={{ color: isDark ? '#f9fafb' : '#111827' }} className="text-lg animate-pulse">Cargando exámenes...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 min-h-screen transition-colors duration-300" style={{ backgroundColor: isDark ? '#111827' : '#f4f4f5' }}>
      <h1 className="text-3xl font-bold mb-4" style={{ color: isDark ? '#60a5fa' : '#1e40af' }}>Banco de Preguntas</h1>

      <Link href="/admin/bank-preguntas/nueva" className="inline-block mb-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition duration-200 shadow">
        Registrar Nuevo Examen
      </Link>

      {exams.length === 0 ? (
        <p className="text-gray-500">No hay exámenes registrados.</p>
      ) : (
        <div className="overflow-auto">
          <table className="w-full text-sm rounded shadow overflow-hidden" style={{ backgroundColor: isDark ? '#1f2937' : '#ffffff' }}>
            <thead className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-100">
              <tr>
                <th className="p-3 text-left">Título</th>
                <th className="p-3 text-left">Descripción</th>
                <th className="p-3 text-left">Estado</th>
                <th className="p-3 text-left">Programado Para</th>
                <th className="p-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((exam) => (
                <tr key={exam.id} className="border-b border-gray-300 dark:border-gray-600">
                  <td className={`${isDark ? 'text-gray-100 p-3' : 'text-gray-900 p-3'}`}>{exam.title}</td>
                  <td className={`${isDark ? 'text-gray-100 p-3' : 'text-gray-900 p-3'}`}>{exam.description?.substring(0, 50)}{exam.description?.length > 50 ? '...' : ''}</td>
                  <td className={`${isDark ? 'text-gray-100 p-3 capitalize' : 'text-gray-900 p-3 capitalize'}`}>{exam.status}</td>
                  <td className={`${isDark ? 'text-gray-100 p-3' : 'text-gray-900 p-3'}`}>{exam.scheduledAt ? new Date(exam.scheduledAt.seconds * 1000).toLocaleString() : 'No programado'}</td>
                  <td className="p-3 flex flex-wrap gap-2">
                    <Link href={`/admin/bank-preguntas/editar/${exam.id}`} className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded">Editar</Link>
                    <button onClick={() => openDeleteModal(exam)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded">Eliminar</button>
                    <button onClick={() => toggleExamStatus(exam)} className={`px-3 py-1 rounded text-white ${exam.status === "active" ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'}`}>{exam.status === "active" ? 'Desactivar' : 'Activar'}</button>
                    <button onClick={() => router.push(`/admin/bank-preguntas/resultados/${exam.id}`)} className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded">Ver Resultados</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg text-center">
            <p className="mb-4">¿Estás seguro de que deseas eliminar el examen "{examToDelete?.title}"?</p>
            <div className="flex justify-center gap-4">
              <button onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">Sí, Eliminar</button>
              <button onClick={() => setShowDeleteModal(false)} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
