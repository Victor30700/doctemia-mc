'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { onSnapshot, deleteDoc, doc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { singlePaymentCoursesCollectionRef } from '@/lib/db';
import { useTheme } from '@/context/ThemeContext';
import Swal from 'sweetalert2';
import { PlusIcon, SearchIcon, Tags, Eye, Edit, Trash2 } from 'lucide-react';

// Función para convertir URL de Google Drive a formato de visualización directa
const convertGoogleDriveUrl = (url) => {
  if (!url) return '/placeholder.png';
  
  // Si ya es una URL de visualización directa, la devolvemos tal como está
  if (url.includes('drive.google.com/uc?') || url.includes('drive.google.com/thumbnail?')) {
    return url;
  }
  
  // Convertir URL de formato /view a formato de visualización directa
  const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (fileIdMatch) {
    const fileId = fileIdMatch[1];
    // Usar el formato de thumbnail que funciona mejor para imágenes públicas
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
  }
  
  // Si no es una URL de Google Drive, la devolvemos tal como está
  return url;
};

export default function AdminSinglePaymentCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
 
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');

  const { isDark, isLoaded } = useTheme();

  const swalTheme = {
    background: isDark ? '#1f2937' : '#ffffff',
    color: isDark ? '#f9fafb' : '#111827',
    confirmButtonColor: '#3b82f6',
    cancelButtonColor: '#ef4444',
  };

  useEffect(() => {
    setLoading(true);
    const coursesUnsubscribe = onSnapshot(singlePaymentCoursesCollectionRef, (snapshot) => {
      const fetchedCourses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCourses(fetchedCourses);
    }, (error) => console.error('Error fetching courses:', error));

    const categoriesUnsubscribe = onSnapshot(collection(db, 'course_categories'), (snapshot) => {
      const fetchedCategories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCategories(fetchedCategories);
    });
   
    const timer = setTimeout(() => setLoading(false), 500);

    return () => {
      coursesUnsubscribe();
      categoriesUnsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const groupedCourses = useMemo(() => {
    const categoryMap = new Map(categories.map(cat => [cat.id, cat.name]));

    const filtered = courses.filter(course => {
      const categoryName = categoryMap.get(course.categoryId)?.toLowerCase() || '';
      const courseMonth = course.createdAt?.toDate().toISOString().slice(0, 7);
     
      const matchesSearch = searchTerm === '' ||
        (course.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (course.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        categoryName.includes(searchTerm.toLowerCase());
     
      const matchesCategory = filterCategory === 'all' || (course.categoryId || 'null') === filterCategory;
      const matchesMonth = filterMonth === 'all' || courseMonth === filterMonth;

      return matchesSearch && matchesCategory && matchesMonth;
    });

    const groups = {};
    filtered.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)); // Ordenar cursos por fecha
    filtered.forEach(course => {
      if (!course.createdAt?.seconds) return;
      const date = course.createdAt.toDate();
      const monthYearKey = date.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
      const capitalizedMonthYear = monthYearKey.charAt(0).toUpperCase() + monthYearKey.slice(1);
      const categoryName = categoryMap.get(course.categoryId) || 'Sin Categoría';

      if (!groups[capitalizedMonthYear]) groups[capitalizedMonthYear] = {};
      if (!groups[capitalizedMonthYear][categoryName]) groups[capitalizedMonthYear][categoryName] = [];
      groups[capitalizedMonthYear][categoryName].push(course);
    });
   
    return groups;
  }, [courses, categories, searchTerm, filterCategory, filterMonth]);

  const availableMonths = useMemo(() => {
    const monthSet = new Set(
      courses.map(c => c.createdAt?.toDate().toISOString().slice(0, 7)).filter(Boolean)
    );
    return Array.from(monthSet).sort().reverse();
  }, [courses]);

  const handleDelete = (courseId) => {
    Swal.fire({
      title: '¿Estás seguro?', text: 'Esta acción eliminará el curso permanentemente.',
      icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar', ...swalTheme
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteDoc(doc(db, 'Cursos_Pago_Unico', courseId));
          Swal.fire({ title: 'Eliminado', text: 'El curso ha sido eliminado.', icon: 'success', ...swalTheme });
        } catch (error) {
          console.error('Error eliminando el curso:', error);
          Swal.fire({ title: 'Error', text: 'No se pudo eliminar el curso.', icon: 'error', ...swalTheme });
        }
      }
    });
  };

  if (!isLoaded || loading) {
    return (
      <section className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <p className={`text-lg animate-pulse ${isDark ? 'text-white' : 'text-black'}`}>Cargando gestión de cursos...</p>
      </section>
    );
  }

  return (
    <section className={`p-4 sm:p-6 min-h-screen transition-colors duration-300 ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className={`text-2xl sm:text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Cursos</h1>
        <div className="flex gap-4">
          <Link href="/admin/Cursos_Pago_Unico/categoria" className={`inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg shadow-lg transition-transform transform hover:scale-105 ${isDark ? 'shadow-purple-500/30' : 'shadow-purple-500/50'}`}>
            <Tags className="h-5 w-5" />
            <span>Gestionar Categorías</span>
          </Link>
          <Link href="/admin/Cursos_Pago_Unico/new" className={`inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg shadow-lg transition-transform transform hover:scale-105 ${isDark ? 'shadow-blue-500/30' : 'shadow-blue-500/50'}`}>
            <PlusIcon className="h-5 w-5" />
            <span>Agregar Curso</span>
          </Link>
        </div>
      </div>

      <div className={`mb-8 p-4 rounded-lg shadow-md flex flex-col md:flex-row gap-4 items-center ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="relative w-full md:flex-grow">
          <SearchIcon className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          <input type="text" placeholder="Buscar por título, descripción o categoría..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`w-full pl-10 pr-4 py-2 border rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
        </div>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className={`w-full md:w-auto p-2 border rounded-md text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}>
          <option value="all">Todas las categorías</option>
          <option value="null">Sin Categoría</option>
          {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
        </select>
        <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className={`w-full md:w-auto p-2 border rounded-md text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}>
          <option value="all">Todos los meses</option>
          {availableMonths.map(month => (
            <option key={month} value={month}>{new Date(month + '-02').toLocaleString('es-ES', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase())}</option>
          ))}
        </select>
      </div>

      <div className="space-y-8">
        {Object.keys(groupedCourses).length === 0 ? (
          <p className={`text-center py-10 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No se encontraron cursos que coincidan con los filtros.</p>
        ) : (
          Object.entries(groupedCourses).map(([monthYear, categoriesInMonth]) => (
            <div key={monthYear}>
              <h2 className={`text-2xl font-bold mb-4 pb-2 border-b-2 ${isDark ? 'text-blue-400 border-blue-400' : 'text-blue-600 border-blue-600'}`}>{monthYear}</h2>
              <div className="space-y-6">
                {Object.entries(categoriesInMonth).map(([categoryName, coursesInCategory]) => (
                  <div key={categoryName}>
                    <h3 className={`text-xl font-semibold mb-3 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{categoryName}</h3>
                    <div className="overflow-x-auto rounded-lg shadow-md">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Curso</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Módulos</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${isDark ? 'divide-gray-700 bg-gray-800' : 'divide-gray-200 bg-white'}`}>
                          {coursesInCategory.map(course => (
                            <tr key={course.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10">
                                    <img 
                                      className="h-10 w-10 rounded-full object-cover" 
                                      src={convertGoogleDriveUrl(course.imageUrl) || '/placeholder.png'} 
                                      alt={course.title || 'Imagen del curso'}
                                      onError={(e) => {
                                        e.target.src = '/placeholder.png';
                                      }}
                                    />
                                  </div>
                                  <div className="ml-4">
                                    <div className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{course.title}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{course.modules?.length || 0}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex justify-end items-center gap-3">
                                  <Link 
                                    href={`/admin/Cursos_Pago_Unico/preview/${course.id}`} 
                                    className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 rounded-full transition-colors duration-200"
                                    title="Vista previa"
                                  >
                                    <Eye className="h-3 w-3" />
                                    <span>Preview</span>
                                  </Link>
                                  <Link 
                                    href={`/admin/Cursos_Pago_Unico/edit/${course.id}`} 
                                    className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/30 rounded-full transition-colors duration-200"
                                    title="Editar curso"
                                  >
                                    <Edit className="h-3 w-3" />
                                    <span>Editar</span>
                                  </Link>
                                  <button 
                                    onClick={() => handleDelete(course.id)} 
                                    className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 rounded-full transition-colors duration-200"
                                    title="Eliminar curso"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                    <span>Eliminar</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}