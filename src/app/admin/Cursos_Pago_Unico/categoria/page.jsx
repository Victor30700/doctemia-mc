'use client';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import Swal from 'sweetalert2';
import { useTheme } from '@/context/ThemeContext';
import { Plus, Edit, Trash2 } from 'lucide-react';

// Referencia a la nueva colección de categorías
const categoriesCollectionRef = collection(db, 'course_categories');

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState(null); // { id, name }
  const [loading, setLoading] = useState(true);
  const { isDark } = useTheme();

  const swalTheme = {
    background: isDark ? '#1f2937' : '#ffffff',
    color: isDark ? '#f9fafb' : '#111827',
    confirmButtonColor: '#3b82f6',
    cancelButtonColor: '#ef4444',
  };

  // Obtener categorías en tiempo real
  useEffect(() => {
    const unsubscribe = onSnapshot(categoriesCollectionRef, (snapshot) => {
      const categoriesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Ordenar alfabéticamente
      categoriesData.sort((a, b) => a.name.localeCompare(b.name));
      setCategories(categoriesData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Manejador para añadir una nueva categoría
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      Swal.fire({ title: 'Error', text: 'El nombre de la categoría no puede estar vacío.', icon: 'error', ...swalTheme });
      return;
    }
    try {
      await addDoc(categoriesCollectionRef, {
        name: newCategoryName.trim(),
        createdAt: serverTimestamp()
      });
      setNewCategoryName('');
      Swal.fire({ title: 'Éxito', text: 'Categoría creada correctamente.', icon: 'success', ...swalTheme });
    } catch (error) {
      console.error("Error adding category: ", error);
      Swal.fire({ title: 'Error', text: 'No se pudo crear la categoría.', icon: 'error', ...swalTheme });
    }
  };

  // Manejador para eliminar una categoría
  const handleDeleteCategory = (id) => {
    Swal.fire({
      title: '¿Estás seguro?', text: 'Esta acción es irreversible.',
      icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar', ...swalTheme
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteDoc(doc(db, 'course_categories', id));
          Swal.fire({ title: 'Eliminada', text: 'La categoría ha sido eliminada.', icon: 'success', ...swalTheme });
        } catch (error) {
          console.error("Error deleting category: ", error);
          Swal.fire({ title: 'Error', text: 'No se pudo eliminar la categoría.', icon: 'error', ...swalTheme });
        }
      }
    });
  };

  // Manejador para editar una categoría
  const handleEditCategory = (category) => {
    Swal.fire({
      title: 'Editar Categoría',
      input: 'text',
      inputValue: category.name,
      showCancelButton: true,
      confirmButtonText: 'Guardar Cambios',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value.trim()) {
          return '¡El nombre no puede estar vacío!'
        }
      },
      ...swalTheme
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const categoryDoc = doc(db, 'course_categories', category.id);
          await updateDoc(categoryDoc, { name: result.value.trim() });
          Swal.fire({ title: 'Actualizada', text: 'La categoría ha sido actualizada.', icon: 'success', ...swalTheme });
        } catch (error) {
          console.error("Error updating category: ", error);
          Swal.fire({ title: 'Error', text: 'No se pudo actualizar la categoría.', icon: 'error', ...swalTheme });
        }
      }
    });
  };

  return (
    <div className={`container mx-auto p-4 sm:p-6 lg:p-8 min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <h1 className={`text-3xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Gestionar Categorías de Cursos</h1>

      {/* Formulario para añadir categorías */}
      <div className={`p-6 rounded-lg shadow-md mb-8 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <form onSubmit={handleAddCategory} className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Nombre de la nueva categoría"
            className={`flex-grow px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
          />
          <button type="submit" className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md shadow-lg transition-transform transform hover:scale-105">
            <Plus className="w-5 h-5" />
            <span>Añadir Categoría</span>
          </button>
        </form>
      </div>

      {/* Tabla de categorías existentes */}
      <div className={`rounded-lg shadow-md overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        {loading ? (
          <p className={`p-6 text-center ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Cargando categorías...</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {categories.length > 0 ? categories.map(cat => (
                <tr key={cat.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{cat.name}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                    <button onClick={() => handleEditCategory(cat)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 inline-flex items-center gap-1">
                      <Edit className="w-4 h-4" /> Editar
                    </button>
                    <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 inline-flex items-center gap-1">
                      <Trash2 className="w-4 h-4" /> Eliminar
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="2" className={`text-center py-10 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    No hay categorías creadas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
