'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Swal from 'sweetalert2';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';

// Función para convertir de forma segura Timestamps de Firestore a formato yyyy-MM-dd
const firestoreTimestampToInputDate = (timestamp) => {
  if (!timestamp) return '';
  try {
    // Si el timestamp tiene el método toDate (propio de Firestore), úsalo.
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    // Valida que la fecha no sea inválida
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.error("Error convirtiendo fecha:", error);
    return '';
  }
};

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const { userId } = params;

  // El estado del formulario ahora incluye el campo de contraseña
  const [form, setForm] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Carga todos los usuarios. Para una app más grande, sería ideal tener un endpoint /api/users/[id]
  const { data: usersData, error: usersError } = useSWR('/api/users', fetcher);

  // Inicializa el formulario cuando los datos se cargan
  useEffect(() => {
    if (usersData && userId) {
      const currentUser = usersData.find(u => u.id === userId);
      if (currentUser) {
        setForm({
          ...currentUser,
          // Usa la función de conversión segura para la fecha de nacimiento
          fechaNacimiento: firestoreTimestampToInputDate(currentUser.fechaNacimiento),
          // Se inicializa el campo de contraseña vacío. No se carga la contraseña existente por seguridad.
          password: '',
        });
      }
    }
  }, [usersData, userId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form || isSubmitting) return;

    setIsSubmitting(true);

    // Prepara los datos para la actualización
    const updateData = { ...form };
    
    // Si la contraseña está vacía, no se envía para no sobreescribir la existente.
    if (!updateData.password || updateData.password.trim() === '') {
      delete updateData.password;
    }

    try {
      const res = await fetch('/api/users/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Envía el ID de usuario y los datos del formulario (sin contraseña si está vacía)
        body: JSON.stringify({ userId, ...updateData }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error desconocido del servidor');
      }

      Swal.fire('¡Actualizado!', 'El usuario ha sido actualizado correctamente.', 'success');
      router.push('/admin/users');
      router.refresh();
    } catch (err) {
      Swal.fire('Error', err.message || 'No se pudo actualizar el usuario.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (usersError) return <div className="p-8 text-center text-red-500">Error al cargar datos del usuario.</div>;
  if (!form) return <div className="p-8 text-center">Cargando datos del usuario...</div>;

  return (
    <section className="p-4 md:p-8 max-w-4xl mx-auto bg-gray-900 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-4 text-yellow-400">Editar Usuario</h1>
      <p className="mb-8 text-gray-400">Modificando perfil de: <span className="font-semibold text-white">{form.fullName}</span></p>
      
      <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-x-6 gap-y-4">
        {/* Columna 1 */}
        <div className="space-y-4">
          <input name="fullName" value={form.fullName || ''} placeholder="Nombre completo" onChange={handleChange} className="input-dark" required />
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Fecha de Nacimiento</label>
            <input name="fechaNacimiento" value={form.fechaNacimiento || ''} type="date" onChange={handleChange} className="input-dark" />
          </div>
          <select name="sexo" value={form.sexo || ''} onChange={handleChange} className="input-dark">
            <option value="">Seleccione Sexo</option>
            <option value="Masculino">Masculino</option>
            <option value="Femenino">Femenino</option>
            <option value="Prefiero no decirlo">Prefiero no decirlo</option>
          </select>
          <input name="telefono" value={form.telefono || ''} placeholder="Teléfono (+591...)" onChange={handleChange} className="input-dark" />
          <input name="universidad" value={form.universidad || ''} placeholder="Universidad" onChange={handleChange} className="input-dark" />
          <input name="profesion" value={form.profesion || ''} placeholder="Profesión / Cargo" onChange={handleChange} className="input-dark" />
        </div>

        {/* Columna 2 */}
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Correo Electrónico (no editable)</label>
            <input name="email" value={form.email || ''} type="email" className="input-dark bg-gray-800 cursor-not-allowed" readOnly />
          </div>

          {/* Campo de contraseña añadido */}
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Nueva Contraseña</label>
            <input 
              name="password" 
              value={form.password} 
              type="password" 
              onChange={handleChange} 
              className="input-dark" 
              placeholder="Dejar en blanco para no cambiar"
            />
          </div>
        </div>

        <div className="md:col-span-2 mt-6 flex justify-end gap-4">
            <button type="button" onClick={() => router.back()} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-800 disabled:cursor-wait">
                {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
        </div>
      </form>

      <style jsx global>{`
        .input-dark {
          width: 100%;
          padding: 0.75rem;
          border-radius: 0.5rem;
          background-color: #1f2937;
          color: white;
          border: 1px solid #374151;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .input-dark:focus {
          outline: none;
          border-color: #f59e0b;
          box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.5);
        }
        .btn-primary, .btn-secondary {
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          color: white;
          font-weight: 600;
          transition: background-color 0.2s, transform 0.1s;
        }
        .btn-primary:active, .btn-secondary:active {
            transform: scale(0.98);
        }
        .btn-secondary {
            background-color: #374151;
        }
        .btn-secondary:hover {
            background-color: #4b5563;
        }
      `}</style>
    </section>
  );
}