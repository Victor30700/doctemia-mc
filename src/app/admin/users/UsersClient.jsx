'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import { fetcher } from '@/lib/fetcher';

export default function UsersClient() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);

  const { data: usersData, error, isLoading } = useSWR('/api/users', fetcher, {
    refreshInterval: 5000,
  });

  useEffect(() => {
    if (!usersData) return;
    const term = searchTerm.toLowerCase();
    setFilteredUsers(
      usersData.filter(user =>
        (user.fullName && user.fullName.toLowerCase().includes(term)) ||
        (user.email && user.email.toLowerCase().includes(term)) ||
        (user.profesion && user.profesion.toLowerCase().includes(term))
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
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: `Sí, ${actionText}`,
      cancelButtonText: 'Cancelar',
    });

    if (result.isConfirmed) {
      try {
        await fetch('/api/toggle-active', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });
        mutate('/api/users');
        Swal.fire('Estado actualizado', 'El estado del usuario ha sido cambiado.', 'success');
      } catch (err) {
        Swal.fire('Error', 'No se pudo cambiar el estado del usuario.', 'error');
      }
    }
  };
  
  // FUNCIÓN ACTUALIZADA: Ahora elimina al usuario por completo.
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
    });

    if (result.isConfirmed) {
      try {
        // Se llama al nuevo endpoint de la API usando el método DELETE.
        await fetch('/api/delete-user', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        });
        mutate('/api/users');
        Swal.fire('Usuario Eliminado', 'El usuario ha sido eliminado correctamente.', 'success');
      } catch (err) {
        Swal.fire('Error', 'No se pudo eliminar el usuario.', 'error');
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Fecha inválida';
    return date.toLocaleDateString('es-ES');
  };

  if (isLoading) return <p className="p-6 text-center">Cargando usuarios...</p>;
  if (error) return <p className="p-6 text-center text-red-500">Error al cargar usuarios. Intenta recargar la página.</p>;

  return (
    <div className="p-4 md:p-6 bg-gray-900 min-h-screen text-white">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
        <button
          onClick={() => router.push('/admin/users/create')}
          className="bg-blue-600 hover:bg-blue-700 transition-all duration-200 px-4 py-2 rounded-lg shadow-lg font-semibold w-full md:w-auto"
        >
          + Nuevo Usuario
        </button>
      </div>

      <input
        type="text"
        placeholder="Buscar por nombre, correo o profesión..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full mb-6 p-3 rounded-lg bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="overflow-x-auto rounded-lg shadow-lg">
        <table className="min-w-full bg-gray-800">
          <thead className="bg-gray-700">
            <tr>
              {['Nombre', 'Correo', 'Profesión', 'Estado', 'Inicio Sus.', 'Fin Sus.', 'Acciones'].map(header => (
                <th key={header} className="py-3 px-4 text-left text-sm font-semibold uppercase tracking-wider">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-700/50 transition-colors duration-200">
                <td className="py-3 px-4 whitespace-nowrap">{user.fullName}</td>
                <td className="py-3 px-4 whitespace-nowrap">{user.email}</td>
                <td className="py-3 px-4 whitespace-nowrap">{user.profesion || 'N/A'}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${user.active ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                    {user.active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="py-3 px-4 whitespace-nowrap">{formatDate(user.fechaSuscripcion)}</td>
                <td className="py-3 px-4 whitespace-nowrap">{formatDate(user.fechaVencimiento)}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => router.push(`/admin/users/edit/${user.id}`)} className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md text-sm font-medium">Editar</button>
                    <button 
                      onClick={() => handleToggleActive(user.id, user.active)} 
                      className={`text-white px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 ${user.active ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>
                      {user.active ? 'Inactive' : 'Active'}
                    </button>
                    {/* BOTÓN ACTUALIZADO: Llama a handleDeleteUser y tiene un nuevo título. */}
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