"use client";
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  onSnapshot,
  getDocs
} from 'firebase/firestore';
import { deleteFlashcardCompleta } from '@/lib/flashcardServices';
import Link from 'next/link';
import Swal from 'sweetalert2';
import { useTheme } from '@/context/ThemeContext';
import { Plus, Edit, Trash2, Search, Filter, ListChecks, X } from 'lucide-react';

export default function FlashcardsAdminPage() {
  const [flashcards, setFlashcards] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEspecialidad, setSelectedEspecialidad] = useState('Todas');
  const [selectedCards, setSelectedCards] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  
  const { isDark, isLoaded } = useTheme();

  useEffect(() => {
    // Fetch categories for the filter
    const fetchCategories = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'course_categories'));
        const cats = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        cats.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        setCategories(cats);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();

    setLoading(true);
    const q = collection(db, 'flashcards');
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const data = [];
        querySnapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() });
        });
        // Ordenar por fecha de creación descendente si existe
        data.sort((a, b) => {
          if (a.createdAt && b.createdAt) {
            return b.createdAt.seconds - a.createdAt.seconds;
          }
          return 0;
        });
        setFlashcards(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching flashcards: ", error);
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

  const filteredFlashcards = flashcards.filter(card => {
    const searchLower = searchTerm.toLowerCase();
    
    // Filtro por especialidad
    const matchesEspecialidad = selectedEspecialidad === 'Todas' || card.especialidadNombre === selectedEspecialidad;
    if (!matchesEspecialidad) return false;

    // Normalización de campos para búsqueda segura y case-insensitive
    const pregunta = (card.pregunta || '').toLowerCase();
    const especialidad = (card.especialidadNombre || '').toLowerCase();
    const subtema = (card.subtema || '').toLowerCase();
    const subtemaName = (card.subtemaName || '').toLowerCase();
    const tipo = (card.tipo || '').toLowerCase();
    
    // Manejo de tags: Si es un array se une en un string, de lo contrario se usa el valor directamente
    const tags = Array.isArray(card.tags) 
      ? card.tags.join(' ').toLowerCase() 
      : (card.tags || '').toLowerCase();

    return (
      pregunta.includes(searchLower) ||
      especialidad.includes(searchLower) ||
      subtema.includes(searchLower) ||
      subtemaName.includes(searchLower) ||
      tipo.includes(searchLower) ||
      tags.includes(searchLower)
    );
  });

  const toggleSelectCard = (cardId) => {
    setSelectedCards(prev => 
      prev.includes(cardId) ? prev.filter(id => id !== cardId) : [...prev, cardId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedCards.length === filteredFlashcards.length) {
      setSelectedCards([]);
    } else {
      setSelectedCards(filteredFlashcards.map(c => c.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCards.length === 0) return;

    if (selectedCards.length > 1) {
      const { value: password } = await Swal.fire({
        title: 'Acción Protegida',
        text: `Se eliminarán ${selectedCards.length} tarjetas filtradas. Ingrese la contraseña maestra:`,
        input: 'password',
        inputPlaceholder: 'Contraseña de administrador',
        showCancelButton: true,
        confirmButtonText: 'Confirmar Borrado Masivo',
        cancelButtonText: 'Cancelar',
        ...swalTheme,
      });

      if (!password) return;

      if (password !== '1234567890') {
        return Swal.fire({
          title: 'Acceso Denegado',
          text: 'La contraseña es incorrecta.',
          icon: 'error',
          ...swalTheme
        });
      }
    } else {
      const result = await Swal.fire({
        title: '¿Eliminar tarjeta seleccionada?',
        text: 'Esta acción no se puede deshacer.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        ...swalTheme
      });
      if (!result.isConfirmed) return;
    }

    try {
      Swal.fire({ 
        title: 'Procesando...', 
        text: 'Eliminando tarjetas y su progreso...',
        allowOutsideClick: false, 
        didOpen: () => Swal.showLoading(), 
        ...swalTheme 
      });

      // Eliminar una por una usando deleteFlashcardCompleta para asegurar borrado en cascada
      for (const cardId of selectedCards) {
        await deleteFlashcardCompleta(cardId);
      }

      setSelectedCards([]);
      setIsSelectionMode(false);
      Swal.fire({ 
        title: 'Eliminadas', 
        text: 'Las tarjetas filtradas han sido borradas con éxito.', 
        icon: 'success', 
        ...swalTheme 
      });
    } catch (err) {
      Swal.fire({ 
        title: 'Error', 
        text: 'Hubo un problema al eliminar algunas tarjetas: ' + err.message, 
        icon: 'error', 
        ...swalTheme 
      });
    }
  };

  const handleDelete = async (id, pregunta) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `Vas a eliminar la tarjeta: "${pregunta}"`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      ...swalTheme
    });

    if (result.isConfirmed) {
      try {
        await deleteFlashcardCompleta(id);
        Swal.fire({
          icon: 'success',
          title: '¡Eliminado!',
          text: 'La tarjeta y su progreso asociado han sido eliminados.',
          ...swalTheme
        });
      } catch (error) {
        console.error("Error al eliminar flashcard: ", error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo eliminar la tarjeta por completo.',
          ...swalTheme
        });
      }
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen" style={{ backgroundColor: isDark ? '#111827' : '#f9fafb' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p style={{ color: isDark ? '#f9fafb' : '#111827' }} className="text-lg font-medium">Cargando flashcards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 min-h-screen transition-colors duration-300" style={{ backgroundColor: isDark ? '#111827' : '#f8fafc' }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-3xl font-bold" style={{ color: isDark ? '#60a5fa' : '#1e40af' }}>Gestión de Flashcards</h1>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>Administra las tarjetas de estudio y repetición espaciada.</p>
            </div>
            {isSelectionMode && (
              <span className="bg-red-500 text-white text-[10px] px-2 py-1 rounded-full animate-pulse font-bold whitespace-nowrap">MODO SELECCIÓN</span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {!isSelectionMode ? (
              <button
                onClick={() => setIsSelectionMode(true)}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl transition duration-200 shadow font-semibold ${
                  isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                <ListChecks className="w-5 h-5" />
                Selección Múltiple
              </button>
            ) : (
              <>
                <button
                  onClick={handleBulkDelete}
                  disabled={selectedCards.length === 0}
                  className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl transition duration-200 shadow font-semibold ${
                    selectedCards.length > 0 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  }`}
                >
                  <Trash2 className="w-5 h-5" />
                  Eliminar ({selectedCards.length})
                </button>
                <button
                  onClick={() => { setIsSelectionMode(false); setSelectedCards([]); }}
                  className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl transition duration-200 shadow font-semibold ${
                    isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <X className="w-5 h-5" />
                  Cancelar
                </button>
              </>
            )}

            <Link 
              href="/admin/flashcards/new" 
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl transition duration-200 shadow font-semibold"
            >
              <Plus className="w-5 h-5" />
              Nueva Tarjeta
            </Link>
          </div>
        </div>

        {/* Sección de Filtros y Búsqueda */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* Input de Búsqueda */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className={`w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            </div>
            <input
              type="text"
              placeholder="Buscar por pregunta, tema, tipo o tags..."
              className={`block w-full pl-10 pr-3 py-3 border rounded-xl leading-5 transition duration-150 ease-in-out focus:ring-2 focus:ring-blue-500 outline-none ${
                isDark 
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' 
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
              }`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Select de Filtro por Especialidad */}
          <div className="relative min-w-[250px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className={`w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            </div>
            <select
              value={selectedEspecialidad}
              onChange={(e) => setSelectedEspecialidad(e.target.value)}
              className={`block w-full pl-10 pr-10 py-3 border rounded-xl leading-5 transition duration-150 ease-in-out focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer ${
                isDark 
                  ? 'bg-gray-800 border-gray-700 text-white' 
                  : 'bg-white border-gray-200 text-gray-900'
              }`}
            >
              <option value="Todas">Todas las especialidades</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
            {/* Flecha personalizada para el select */}
            <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
              <svg className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
          </div>
        </div>

        {filteredFlashcards.length === 0 ? (
          <div className={`text-center py-20 rounded-2xl border-2 border-dashed ${isDark ? 'border-gray-800 bg-gray-900/50' : 'border-gray-100 bg-white'}`}>
            <p className={isDark ? 'text-gray-500' : 'text-gray-400'}>
              {searchTerm || selectedEspecialidad !== 'Todas' 
                ? 'No se encontraron tarjetas que coincidan con la búsqueda o filtro.' 
                : 'No hay tarjetas registradas aún.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl shadow-sm border custom-scrollbar" style={{ borderColor: isDark ? '#374151' : '#e5e7eb' }}>
            <table className="w-full text-left border-collapse min-w-[1000px]" style={{ backgroundColor: isDark ? '#1f2937' : '#ffffff' }}>
              <thead>
                <tr className={isDark ? 'bg-gray-800/50' : 'bg-gray-50'}>
                  {isSelectionMode && (
                    <th className="p-4 text-left w-10">
                      <input 
                        type="checkbox" 
                        checked={selectedCards.length === filteredFlashcards.length && filteredFlashcards.length > 0}
                        onChange={toggleSelectAll}
                        className="w-5 h-5 cursor-pointer accent-blue-500"
                      />
                    </th>
                  )}
                  <th className={`p-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Pregunta</th>
                  <th className={`p-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Tipo</th>
                  <th className={`p-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Especialidad</th>
                  <th className={`p-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Identificador (Tema)</th>
                  <th className={`p-4 font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Tags</th>
                  <th className={`p-4 font-semibold text-center ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Acciones</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-100'}`}>
                {filteredFlashcards.map((card) => (
                  <tr 
                    key={card.id} 
                    className={`transition-colors duration-150 ${
                      selectedCards.includes(card.id)
                        ? (isDark ? 'bg-blue-900/20' : 'bg-blue-50')
                        : (isDark ? 'hover:bg-gray-800/30' : 'hover:bg-blue-50/30')
                    }`}
                  >
                    {isSelectionMode && (
                      <td className="p-4">
                        <input 
                          type="checkbox" 
                          checked={selectedCards.includes(card.id)}
                          onChange={() => toggleSelectCard(card.id)}
                          className="w-5 h-5 cursor-pointer accent-blue-600"
                        />
                      </td>
                    )}
                    <td className="p-4 min-w-[300px] max-w-md">
                      <div className={`font-medium line-clamp-2 break-words ${isDark ? 'text-gray-100' : 'text-gray-900'}`} title={card.pregunta}>{card.pregunta}</div>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                        isDark ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {card.tipo || 'Pregunta'}
                      </span>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {card.especialidadNombre || 'Sin especialidad'}
                      </span>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {card.subtema || 'Sin identificador'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {card.tags?.map((tag, idx) => (
                          <span key={idx} className={`text-[10px] px-2 py-0.5 rounded border ${
                            isDark ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-500'
                          }`}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center items-center gap-2">
                        <Link 
                          href={`/admin/flashcards/edit/${card.id}`}
                          className={`p-2 rounded-lg transition-colors ${
                            isDark ? 'text-blue-400 hover:bg-blue-400/10' : 'text-blue-600 hover:bg-blue-50'
                          }`}
                          title="Editar"
                        >
                          <Edit className="w-5 h-5" />
                        </Link>
                        <button 
                          onClick={() => handleDelete(card.id, card.pregunta)}
                          className={`p-2 rounded-lg transition-colors ${
                            isDark ? 'text-red-400 hover:bg-red-400/10' : 'text-red-600 hover:bg-red-50'
                          }`}
                          title="Eliminar"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}