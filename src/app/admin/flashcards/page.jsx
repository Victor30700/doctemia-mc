"use client";
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot
} from 'firebase/firestore';
import Link from 'next/link';
import Swal from 'sweetalert2';
import { useTheme } from '@/context/ThemeContext';
import { Plus, Edit, Trash2, Search } from 'lucide-react';

export default function FlashcardsAdminPage() {
  const [flashcards, setFlashcards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { isDark, isLoaded } = useTheme();

  useEffect(() => {
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
        await deleteDoc(doc(db, 'flashcards', id));
        Swal.fire({
          icon: 'success',
          title: '¡Eliminado!',
          text: 'La tarjeta ha sido eliminada.',
          ...swalTheme
        });
      } catch (error) {
        console.error("Error al eliminar flashcard: ", error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo eliminar la tarjeta.',
          ...swalTheme
        });
      }
    }
  };

  const filteredFlashcards = flashcards.filter(card => 
    card.pregunta?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.subtema?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.especialidadNombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
          <div>
            <h1 className="text-3xl font-bold" style={{ color: isDark ? '#60a5fa' : '#1e40af' }}>Gestión de Flashcards</h1>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>Administra las tarjetas de estudio y repetición espaciada.</p>
          </div>
          <Link 
            href="/admin/flashcards/new" 
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition duration-200 shadow-lg font-semibold"
          >
            <Plus className="w-5 h-5" />
            Nueva Tarjeta
          </Link>
        </div>

        <div className="mb-6 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className={`w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
          </div>
          <input
            type="text"
            placeholder="Buscar por pregunta, identificador o especialidad..."
            className={`block w-full pl-10 pr-3 py-3 border rounded-xl leading-5 transition duration-150 ease-in-out focus:ring-2 focus:ring-blue-500 outline-none ${
              isDark 
                ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' 
                : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
            }`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {filteredFlashcards.length === 0 ? (
          <div className={`text-center py-20 rounded-2xl border-2 border-dashed ${isDark ? 'border-gray-800 bg-gray-900/50' : 'border-gray-100 bg-white'}`}>
            <p className={isDark ? 'text-gray-500' : 'text-gray-400'}>
              {searchTerm ? 'No se encontraron tarjetas que coincidan con la búsqueda.' : 'No hay tarjetas registradas aún.'}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl shadow-sm border" style={{ borderColor: isDark ? '#374151' : '#e5e7eb' }}>
            <table className="w-full text-left border-collapse" style={{ backgroundColor: isDark ? '#1f2937' : '#ffffff' }}>
              <thead>
                <tr className={isDark ? 'bg-gray-800/50' : 'bg-gray-50'}>
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
                  <tr key={card.id} className={`transition-colors duration-150 ${isDark ? 'hover:bg-gray-800/30' : 'hover:bg-blue-50/30'}`}>
                    <td className="p-4">
                      <div className={`font-medium line-clamp-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{card.pregunta}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                        isDark ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {card.tipo || 'Pregunta-Respuesta'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {card.especialidadNombre || 'Sin especialidad'}
                      </span>
                    </td>
                    <td className="p-4">
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
