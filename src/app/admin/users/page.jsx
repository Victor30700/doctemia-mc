'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import { fetcher } from '@/lib/fetcher';
import { useTheme } from '@/context/ThemeContext';
import { CheckCircle, XCircle, Phone } from 'lucide-react'; // Importar iconos para hasPagoUnicoAccess y teléfono

export default function UsersClient() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const { isDark, isLoaded } = useTheme();

  const { data: usersData, error } = useSWR('/api/users', fetcher, {
    refreshInterval: 5000, // Mantener el refresco para ver cambios rápidamente
  });

  const swalTheme = {
    background: isDark ? '#1f2937' : '#ffffff',
    color: isDark ? '#f9fafb' : '#111827',
    confirmButtonColor: '#3b82f6',
    cancelButtonColor: '#ef4444',
  };

  useEffect(() => {
    if (!usersData) return;
    const term = searchTerm.toLowerCase();
    setFilteredUsers(
      usersData
        .filter(user => user.role !== 'admin') // ✅ CAMBIO CLAVE: Filtrar usuarios con rol 'admin'
        .filter(user =>
          (user.fullName && user.fullName.toLowerCase().includes(term)) ||
          (user.email && user.email.toLowerCase().includes(term)) ||
          (user.profesion && user.profesion.toLowerCase().includes(term)) ||
          (user.telefono && user.telefono.toLowerCase().includes(term))
        )
    );
  }, [searchTerm, usersData]);

  const handleToggleActive = async (userId, currentStatus) => {
    const actionText = currentStatus ? 'desactivar' : 'activar';
    const result = await Swal.fire({
      title: `¿${actionText.charAt(0).toUpperCase() + actionText.slice(1)} usuario?`,
      text: 'Esto cambiará el estado de acceso del usuario.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: `Sí, ${actionText}`,
      cancelButtonText: 'Cancelar',
      ...swalTheme,
    });

    if (result.isConfirmed) {
      try {
        await fetch('/api/toggle-active', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });
        mutate('/api/users'); // Revalida los datos para actualizar la UI
        Swal.fire({ title: 'Estado actualizado', text: 'El estado del usuario ha sido cambiado.', icon: 'success', ...swalTheme });
      } catch (err) {
        Swal.fire({ title: 'Error', text: 'No se pudo cambiar el estado del usuario.', icon: 'error', ...swalTheme });
      }
    }
  };
  
  const handleDeleteUser = async (user) => {
    const result = await Swal.fire({
      title: `¿Eliminar a ${user.fullName}?`,
      text: '¡Esta acción es irreversible! Se eliminará la cuenta de autenticación y todos los datos del usuario.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      ...swalTheme,
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch('/api/delete-user', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error al eliminar usuario');
        }

        mutate('/api/users'); 
        Swal.fire({ title: 'Usuario Eliminado', text: 'El usuario ha sido eliminado correctamente.', icon: 'success', ...swalTheme });
      } catch (err) {
        console.error("Error al eliminar usuario:", err);
        Swal.fire({ title: 'Error', text: err.message || 'No se pudo eliminar el usuario.', icon: 'error', ...swalTheme });
      }
    }
  };

  if (!isLoaded || !usersData) {
      return (
        <section 
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor: isDark ? '#111827' : '#f9fafb' }}
        >
          <p style={{ color: isDark ? '#f9fafb' : '#111827' }} className="text-lg animate-pulse">
            Cargando usuarios...
          </p>
        </section>
      );
  }

  if (error) {
    return (
      <section 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: isDark ? '#111827' : '#f9fafb' }}
      >
        <p className="text-lg text-red-500">
          Error al cargar usuarios. Intenta recargar la página.
        </p>
      </section>
    );
  }

  const containerStyle = { backgroundColor: isDark ? '#111827' : '#f9fafb' };
  const textStyle = { color: isDark ? '#f9fafb' : '#111827' };
  const inputStyle = {
    backgroundColor: isDark ? '#1f2937' : '#ffffff',
    color: isDark ? '#f9fafb' : '#111827',
    borderColor: isDark ? '#374151' : '#e5e7eb',
    '--tw-ring-color': isDark ? '#60a5fa' : '#3b82f6'
  };
  const tableBgStyle = { backgroundColor: isDark ? '#1f2937' : '#ffffff' };
  const tableHeaderStyle = { backgroundColor: isDark ? '#374151' : '#f3f4f6' };
  const tableCellStyle = { color: isDark ? '#d1d5db' : '#374151' };
  const rowHoverStyle = isDark ? 'rgba(55, 65, 81, 0.5)' : '#f9fafb';

  return (
    <div 
      className="p-4 md:p-6 min-h-screen transition-colors duration-300"
      style={containerStyle}
    >
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold" style={{ color: isDark ? '#60a5fa' : '#3b82f6' }}>Gestión de Usuarios</h1>
        <button
          onClick={() => router.push('/admin/users/create')}
          className="bg-blue-600 hover:bg-blue-700 transition-all duration-200 px-4 py-2 rounded-lg shadow-lg font-semibold w-full md:w-auto text-white"
        >
          + Nuevo Usuario
        </button>
      </div>

      <input
        type="text"
        placeholder="Buscar por nombre, correo, profesión o teléfono..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full mb-6 p-3 rounded-lg border focus:outline-none focus:ring-2"
        style={inputStyle}
      />

      <div className="overflow-x-auto rounded-lg shadow-lg border" style={{borderColor: inputStyle.borderColor}}>
        <table className="min-w-full" style={tableBgStyle}>
          <thead style={tableHeaderStyle}>
            <tr>
              {['Nombre', 'Correo', 'Profesión', 'Estado', 'Pago Único', 'Teléfono', 'Acciones'].map(header => (
                <th key={header} className="py-3 px-4 text-left text-sm font-semibold uppercase tracking-wider" style={{ color: isDark ? '#f9fafb' : '#374151' }}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y" style={{borderColor: inputStyle.borderColor}}>
            {filteredUsers.map((user) => (
              <tr 
                key={user.id} 
                className="transition-colors duration-200"
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = rowHoverStyle}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = ''}
              >
                <td className="py-3 px-4 whitespace-nowrap" style={tableCellStyle}>{user.fullName}</td>
                <td className="py-3 px-4 whitespace-nowrap" style={tableCellStyle}>{user.email}</td>
                <td className="py-3 px-4 whitespace-nowrap" style={tableCellStyle}>{user.profesion || 'N/A'}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${user.active ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                    {user.active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {user.hasPagoUnicoAccess ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-sm font-medium" style={tableCellStyle}>Sí</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-red-500" />
                        <span className="text-sm font-medium" style={tableCellStyle}>No</span>
                      </>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4 whitespace-nowrap" style={tableCellStyle}>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{user.telefono || 'N/A'}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => router.push(`/admin/users/edit/${user.id}`)} className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md text-sm font-medium">Editar</button>
                    <button 
                      onClick={() => handleToggleActive(user.id, user.active)} 
                      className={`text-white px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 ${user.active ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>
                      {user.active ? 'Inactivar' : 'Activar'}
                    </button>
                    <button onClick={() => handleDeleteUser(user)} className="bg-gray-600 hover:bg-red-800 text-white p-2 rounded-md transition-colors duration-200" title="Borrar usuario">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/><path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
