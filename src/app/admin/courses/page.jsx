'use client';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Swal from 'sweetalert2';
import { collection, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useTheme } from '@/context/ThemeContext';

// --- Iconos SVG para la UI ---
const PlusIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const SearchIcon = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;

export default function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('newest'); // 'newest', 'oldest', 'name', 'price'
  const { isDark, isLoaded } = useTheme();

  const swalTheme = {
    background: isDark ? '#1f2937' : '#ffffff',
    color: isDark ? '#f9fafb' : '#111827',
    confirmButtonColor: '#3b82f6',
    cancelButtonColor: '#ef4444',
  };

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, 'courses'));
        const fetchedCourses = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCourses(fetchedCourses);
      } catch (error) {
        console.error('Error fetching courses:', error);
        Swal.fire({ title: 'Error', text: 'No se pudieron cargar los cursos.', icon: 'error', ...swalTheme });
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const filteredAndSortedCourses = useMemo(() => {
    let filtered = courses.filter(course =>
      (course.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (course.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (course.price?.toString() || '').includes(searchTerm.toLowerCase())
    );

    switch (sortOption) {
      case 'newest':
        filtered.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        break;
      case 'oldest':
        filtered.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'price':
        filtered.sort((a, b) => a.price - b.price);
        break;
      default:
        break;
    }

    return filtered;
  }, [courses, searchTerm, sortOption]);

  const handleDelete = (courseId) => {
    Swal.fire({
      title: '¿Estás seguro?', text: 'Esta acción eliminará el curso permanentemente.',
      icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar', ...swalTheme
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
      title: `¿Quieres ${newStatus ? 'activar' : 'desactivar'} este curso?`, icon: 'question',
      showCancelButton: true, confirmButtonText: 'Sí', cancelButtonText: 'Cancelar', ...swalTheme
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
  
  if (!isLoaded) {
    return (
      <section className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <p className={`text-lg animate-pulse ${isDark ? 'text-white' : 'text-black'}`}>Cargando...</p>
      </section>
    );
  }

  return (
    <section className={`p-4 sm:p-6 min-h-screen transition-colors duration-300 ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className={`text-2xl sm:text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Cursos
        </h1>
        <Link href="/admin/courses/new" className={`inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg shadow-lg transition-transform transform hover:scale-105 ${isDark ? 'shadow-blue-500/30' : 'shadow-blue-500/50'}`}>
          <PlusIcon className="h-5 w-5" />
          <span>Agregar Curso</span>
        </Link>
      </div>

      {/* --- Controles de Búsqueda y Ordenamiento --- */}
      <div className={`mb-8 p-4 rounded-lg shadow-md flex flex-col md:flex-row gap-4 items-center ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="relative w-full md:flex-grow">
            <SearchIcon className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            <input 
                type="text"
                placeholder="Buscar por título, descripción, precio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
            />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
            <label htmlFor="sort" className={`text-sm font-medium whitespace-nowrap ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Ordenar por:</label>
            <select 
                id="sort"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className={`w-full md:w-auto p-2 border rounded-md text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            >
                <option value="name">Nombre (A-Z)</option>
                <option value="price">Precio (menor a mayor)</option>
            </select>
        </div>
      </div>

      {loading ? (
        <p className={`text-center ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Cargando cursos...</p>
      ) : filteredAndSortedCourses.length === 0 ? (
        <p className={`text-center py-10 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          No se encontraron cursos que coincidan con tu búsqueda.
        </p>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredAndSortedCourses.map(course => (
            <div 
              key={course.id} 
              className={`shadow-md hover:shadow-xl rounded-lg p-4 flex flex-col transition-all duration-300 border hover:-translate-y-1 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
            >
              <img src={course.image} alt={course.name} className="w-full h-40 object-cover rounded-md" />
              <div className="flex-grow mt-3">
                <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {course.name}
                </h2>
                <p className={`text-sm mt-1 mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {course.description}
                </p>
              </div>
              <div className="mt-auto">
                <div className="flex justify-between items-center mb-3">
                    <p className={`font-bold text-lg ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Bs {course.price.toFixed(2)}</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${course.isActive ? (isDark ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800') : (isDark ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-800')}`}>
                        {course.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <button onClick={() => toggleCourseStatus(course.id, course.isActive)} className={`w-full py-2 rounded-md transition ${course.isActive ? (isDark ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-yellow-500 hover:bg-yellow-600') : (isDark ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600')} text-white`}>
                    {course.isActive ? 'Desactivar' : 'Activar'}
                  </button>
                  <Link href={`/admin/courses/edit/${course.id}`} className={`w-full text-center py-2 rounded-md transition ${isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`}>Editar</Link>
                  <Link href={`/admin/courses/preview/${course.id}`} className={`w-full text-center py-2 rounded-md transition ${isDark ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-500 hover:bg-gray-600'} text-white`}>Preview</Link>
                  <button onClick={() => handleDelete(course.id)} className={`w-full py-2 rounded-md transition ${isDark ? 'bg-red-700 hover:bg-red-800' : 'bg-red-600 hover:bg-red-700'} text-white`}>Eliminar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
