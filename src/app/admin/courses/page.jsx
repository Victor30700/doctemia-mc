'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Swal from 'sweetalert2';
import { collection, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useTheme } from '@/context/ThemeContext';

export default function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isDark, isLoaded } = useTheme();

  // Estilos para las alertas de SweetAlert2 según el tema
  const swalTheme = {
    background: isDark ? '#1f2937' : '#ffffff',
    color: isDark ? '#f9fafb' : '#111827',
    confirmButtonColor: '#3b82f6',
    cancelButtonColor: '#ef4444',
  };

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'courses'));
        const fetchedCourses = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCourses(fetchedCourses);
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const handleDelete = (courseId) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará el curso permanentemente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      ...swalTheme
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteDoc(doc(db, 'courses', courseId));
          setCourses(courses.filter(course => course.id !== courseId));
          Swal.fire({ title: 'Eliminado', text: 'El curso ha sido eliminado.', icon: 'success', ...swalTheme });
        } catch (error) {
          console.error('Error eliminando el curso:', error);
          Swal.fire({ title: 'Error', text: 'No se pudo eliminar el curso.', icon: 'error', ...swalTheme });
        }
      }
    });
  };

  const toggleCourseStatus = (courseId, currentStatus) => {
    const newStatus = !currentStatus;
    Swal.fire({
      title: `¿Quieres ${newStatus ? 'activar' : 'desactivar'} este curso?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí',
      cancelButtonText: 'Cancelar',
      ...swalTheme
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await updateDoc(doc(db, 'courses', courseId), { isActive: newStatus });
          setCourses(courses.map(course => course.id === courseId ? { ...course, isActive: newStatus } : course));
          Swal.fire({ title: 'Actualizado', text: `El curso ha sido ${newStatus ? 'activado' : 'desactivado'}.`, icon: 'success', ...swalTheme });
        } catch (error) {
          console.error('Error actualizando el estado del curso:', error);
          Swal.fire({ title: 'Error', text: 'No se pudo actualizar el curso.', icon: 'error', ...swalTheme });
        }
      }
    });
  };
  
  // Skeleton de carga que respeta el tema
  if (!isLoaded) {
    return (
      <section 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: isDark ? '#111827' : '#f9fafb' }}
      >
        <p style={{ color: isDark ? '#f9fafb' : '#111827' }} className="text-lg animate-pulse">
          Cargando...
        </p>
      </section>
    );
  }

  return (
    <section 
      className="p-4 sm:p-6 min-h-screen transition-colors duration-300"
      style={{ backgroundColor: isDark ? '#111827' : '#f9fafb' }}
    >
      <div className="flex justify-between items-center mb-6">
        <h1 
          className="text-2xl sm:text-3xl font-bold"
          style={{ color: isDark ? '#60a5fa' : '#3b82f6' }}
        >
          Cursos
        </h1>
        <Link href="/admin/courses/new" className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg shadow transition-transform transform hover:scale-105">
          Agregar Curso
        </Link>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {courses.map(course => (
          <div 
            key={course.id} 
            className="shadow-md hover:shadow-xl rounded-lg p-4 flex flex-col transition-shadow duration-300 border"
            style={{ 
              backgroundColor: isDark ? '#1f2937' : '#ffffff',
              borderColor: isDark ? '#374151' : '#e5e7eb'
            }}
          >
            <img src={course.image} alt={course.name} className="w-full h-40 object-cover rounded-md" />
            <div className="flex-grow mt-3">
              <h2 
                className="text-lg font-bold"
                style={{ color: isDark ? '#f9fafb' : '#111827' }}
              >
                {course.name}
              </h2>
              <p 
                className="text-sm mt-1 mb-3"
                style={{ color: isDark ? '#d1d5db' : '#6b7280' }}
              >
                {course.description}
              </p>
            </div>
            <div className="mt-auto">
              <h3 
                className="font-semibold mb-2 text-sm"
                style={{ color: isDark ? '#d1d5db' : '#374151' }}
              >
                Opciones:
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => toggleCourseStatus(course.id, course.isActive)}
                  className={`px-3 py-1.5 text-sm text-white rounded-md transition-opacity ${course.isActive ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'}`}
                >
                  {course.isActive ? 'Desactivar' : 'Activar'}
                </button>
                <Link href={`/admin/courses/edit/${course.id}`} className="bg-blue-500 hover:bg-blue-600 text-white text-center px-3 py-1.5 text-sm rounded-md transition-opacity">Editar</Link>
                <button onClick={() => handleDelete(course.id)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 text-sm rounded-md transition-opacity">Eliminar</button>
                <Link href={`/admin/courses/preview/${course.id}`} className="bg-gray-500 hover:bg-gray-600 text-white text-center px-3 py-1.5 text-sm rounded-md transition-opacity">Preview</Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}