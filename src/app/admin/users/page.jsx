'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import { fetcher } from '@/lib/fetcher';
import { useTheme } from '@/context/ThemeContext';
import { CheckCircle, XCircle, Phone, Trash2, UserPlus, ListChecks, X } from 'lucide-react';

export default function UsersClient() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false); // Nuevo: Controla la visibilidad de checkboxes
  const { isDark, isLoaded } = useTheme();

  const { data: usersData, error } = useSWR('/api/users', fetcher, {
    refreshInterval: 5000,
  });

  const swalTheme = {
    background: isDark ? '#1f2937' : '#ffffff',
    color: isDark ? '#f9fafb' : '#111827',
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
  };

  useEffect(() => {
    if (!usersData) return;
    const term = searchTerm.toLowerCase();
    const filtered = usersData
      .filter(user => user.role !== 'admin')
      .filter(user =>
        (user.fullName && user.fullName.toLowerCase().includes(term)) ||
        (user.email && user.email.toLowerCase().includes(term)) ||
        (user.telefono && user.telefono.toLowerCase().includes(term))
      );
    setFilteredUsers(filtered);
    
    // Limpiar selección si los usuarios filtrados ya no incluyen a los seleccionados
    setSelectedUsers(prev => prev.filter(id => filtered.some(u => u.id === id)));
  }, [searchTerm, usersData]);

  const toggleSelectUser = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      // SOLO selecciona los que están actualmente en la búsqueda/filtro
      setSelectedUsers(filteredUsers.map(u => u.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) return;

    // REGLA: Más de 1 usuario requiere contraseña
    if (selectedUsers.length > 1) {
      const { value: password } = await Swal.fire({
        title: 'Acción Protegida',
        text: `Se eliminarán ${selectedUsers.length} usuarios filtrados. Ingrese la contraseña maestra:`,
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
      // Confirmación simple para 1 solo usuario seleccionado en modo masivo
      const result = await Swal.fire({
        title: '¿Eliminar usuario seleccionado?',
        text: 'Esta acción no se puede deshacer.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        ...swalTheme
      });
      if (!result.isConfirmed) return;
    }

    try {
      Swal.fire({ title: 'Procesando...', allowOutsideClick: false, didOpen: () => Swal.showLoading(), ...swalTheme });

      const response = await fetch('/api/delete-user', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: selectedUsers }),
      });

      if (!response.ok) throw new Error('Error en el servidor');

      mutate('/api/users');
      setSelectedUsers([]);
      setIsSelectionMode(false);
      Swal.fire({ title: 'Eliminados', text: 'Los usuarios filtrados han sido borrados.', icon: 'success', ...swalTheme });
    } catch (err) {
      Swal.fire({ title: 'Error', text: err.message, icon: 'error', ...swalTheme });
    }
  };

  const handleToggleActive = async (userId, currentStatus) => {
    try {
      await fetch('/api/toggle-active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      mutate('/api/users');
    } catch (err) {
      Swal.fire({ title: 'Error', text: 'No se pudo cambiar el estado.', icon: 'error', ...swalTheme });
    }
  };
  
  const handleDeleteUser = async (user) => {
    const result = await Swal.fire({
      title: `¿Eliminar a ${user.fullName}?`,
      text: 'Acción individual inmediata.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      ...swalTheme,
    });

    if (result.isConfirmed) {
      try {
        await fetch('/api/delete-user', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        });
        mutate('/api/users');
        Swal.fire({ title: 'Eliminado', icon: 'success', timer: 1500, showConfirmButton: false, ...swalTheme });
      } catch (err) {
        Swal.fire({ title: 'Error', text: err.message, icon: 'error', ...swalTheme });
      }
    }
  };

  if (!isLoaded || !usersData) {
      return (
        <section className="min-h-screen flex items-center justify-center" style={{ backgroundColor: isDark ? '#111827' : '#f9fafb' }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p style={{ color: isDark ? '#f9fafb' : '#111827' }}>Sincronizando base de datos...</p>
          </div>
        </section>
      );
  }

  return (
    <div className="p-4 md:p-6 min-h-screen transition-all duration-300" style={{ backgroundColor: isDark ? '#111827' : '#f9fafb' }}>
      
      {/* HEADER DINÁMICO */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold" style={{ color: isDark ? '#60a5fa' : '#3b82f6' }}>Usuarios</h1>
            {isSelectionMode && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">MODO SELECCIÓN</span>
            )}
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          {!isSelectionMode ? (
            <button
              onClick={() => setIsSelectionMode(true)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg shadow flex items-center gap-2 transition-all"
            >
              <ListChecks className="w-4 h-4" />
              Selección Múltiple
            </button>
          ) : (
            <div className="flex gap-2 flex-1 md:flex-none">
                <button
                    onClick={handleBulkDelete}
                    disabled={selectedUsers.length === 0}
                    className={`px-4 py-2 rounded-lg shadow font-semibold flex items-center gap-2 transition-all ${selectedUsers.length > 0 ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-gray-400 text-gray-200 cursor-not-allowed'}`}
                >
                    <Trash2 className="w-4 h-4" />
                    Eliminar ({selectedUsers.length})
                </button>
                <button
                    onClick={() => { setIsSelectionMode(false); setSelectedUsers([]); }}
                    className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-all flex items-center gap-2"
                >
                    <X className="w-4 h-4" />
                    Cancelar
                </button>
            </div>
          )}
          
          <button
            onClick={() => router.push('/admin/users/create')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow flex items-center gap-2 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            Nuevo
          </button>
        </div>
      </div>

      {/* BUSCADOR */}
      <div className="relative mb-6">
        <input
          type="text"
          placeholder="Filtrar por nombre, correo o teléfono..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`w-full p-4 rounded-xl border transition-all focus:ring-2 outline-none ${isDark ? 'bg-gray-800 border-gray-700 text-white focus:ring-blue-500' : 'bg-white border-gray-200 text-gray-900 focus:ring-blue-400'}`}
        />
      </div>

      {/* TABLA */}
      <div className={`overflow-x-auto rounded-xl shadow-2xl border transition-all ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
        <table className="min-w-full" style={{ backgroundColor: isDark ? '#1f2937' : '#ffffff' }}>
          <thead style={{ backgroundColor: isDark ? '#374151' : '#f3f4f6' }}>
            <tr>
              {isSelectionMode && (
                <th className="py-4 px-4 text-left w-10">
                    <input 
                    type="checkbox" 
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onChange={toggleSelectAll}
                    className="w-5 h-5 cursor-pointer accent-blue-500"
                    />
                </th>
              )}
              {['Nombre', 'Correo', 'Estado', 'Pago Único', 'Teléfono', 'Acciones'].map(header => (
                <th key={header} className="py-4 px-4 text-left text-xs font-bold uppercase tracking-widest" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/20">
            {filteredUsers.length > 0 ? filteredUsers.map((user) => (
              <tr key={user.id} className={`transition-all ${selectedUsers.includes(user.id) ? (isDark ? 'bg-blue-900/20' : 'bg-blue-50') : 'hover:bg-black/5'}`}>
                {isSelectionMode && (
                  <td className="py-4 px-4">
                    <input 
                      type="checkbox" 
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => toggleSelectUser(user.id)}
                      className="w-5 h-5 cursor-pointer accent-blue-600"
                    />
                  </td>
                )}
                <td className="py-4 px-4 font-medium" style={{ color: isDark ? '#f3f4f6' : '#111827' }}>{user.fullName}</td>
                <td className="py-4 px-4 text-sm" style={{ color: isDark ? '#9ca3af' : '#4b5563' }}>{user.email}</td>
                <td className="py-4 px-4">
                  <span onClick={() => handleToggleActive(user.id, user.active)} className={`cursor-pointer px-3 py-1 text-xs font-bold rounded-full transition-all hover:scale-105 ${user.active ? 'bg-green-500/20 text-green-500 border border-green-500/50' : 'bg-red-500/20 text-red-500 border border-red-500/50'}`}>
                    {user.active ? 'ACTIVO' : 'INACTIVO'}
                  </span>
                </td>
                <td className="py-4 px-4">
                  {user.hasPagoUnicoAccess ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-400 opacity-30" />}
                </td>
                <td className="py-4 px-4 text-sm" style={{ color: isDark ? '#9ca3af' : '#4b5563' }}>{user.telefono || '---'}</td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => router.push(`/admin/users/edit/${user.id}`)} className="text-blue-500 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-500/10 transition-all">Editar</button>
                    <button onClick={() => handleDeleteUser(user)} className="text-red-500 hover:text-red-600 p-2 rounded-lg hover:bg-red-500/10 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="7" className="py-10 text-center text-gray-500 italic">No se encontraron usuarios que coincidan con la búsqueda.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
