'use client';

import { useState, useEffect, useMemo } from 'react'; // ✅ Importar useMemo
import { useRouter, useParams } from 'next/navigation';
import Swal from 'sweetalert2';
import useSWR, { mutate } from 'swr';
import { fetcher } from '@/lib/fetcher';
import { useTheme } from '@/context/ThemeContext';

// Función para convertir de forma segura Timestamps de Firestore a formato ISO (YYYY-MM-DD)
const firestoreTimestampToInputDate = (timestamp) => {
  if (!timestamp) return '';
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
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
  const { isDark, isLoaded } = useTheme();

  const [form, setForm] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Usamos SWR para obtener los datos de todos los usuarios
  const { data: usersData, error: usersError } = useSWR('/api/users', fetcher);
  
  // ✅ CORRECCIÓN: Memoizar swalTheme para evitar recrearlo en cada render
  const swalTheme = useMemo(() => ({
    background: isDark ? '#1f2937' : '#ffffff',
    color: isDark ? '#f9fafb' : '#111827',
    confirmButtonColor: '#f59e0b', // Amarillo para consistencia
    cancelButtonColor: '#6b7280',
  }), [isDark]); // Dependencia en isDark

  useEffect(() => {
    if (usersData && userId) {
      const currentUser = usersData.find(u => u.id === userId);
      if (currentUser) {
        setForm({
          ...currentUser,
          fechaNacimiento: firestoreTimestampToInputDate(currentUser.fechaNacimiento),
          password: '', // La contraseña siempre se inicializa vacía para no cambiarla a menos que se ingrese una nueva
        });
      } else {
        // Si el usuario no se encuentra, redirigir o mostrar un error
        Swal.fire({
          title: 'Usuario no encontrado',
          text: 'El usuario que intentas editar no existe.',
          icon: 'error',
          ...swalTheme,
        }).then(() => router.push('/admin/users'));
      }
    }
  }, [usersData, userId, router, swalTheme]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form || isSubmitting) return;

    // ✅ INICIO DE LA VALIDACIÓN DE CAMPOS
    // Se mantienen solo los campos obligatorios que deben ser editables y visibles
    const requiredFields = [
      'fullName', 'fechaNacimiento', 'sexo', 'telefono', 
      'universidad', 'profesion', 'email'
    ];
    const missingFields = [];

    for (const field of requiredFields) {
      // Trim para eliminar espacios en blanco y verificar si está vacío
      if (!form[field] || (typeof form[field] === 'string' && form[field].trim() === '')) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      const fieldNamesMap = {
        fullName: 'Nombre completo',
        fechaNacimiento: 'Fecha de Nacimiento',
        sexo: 'Sexo',
        telefono: 'Teléfono',
        universidad: 'Universidad',
        profesion: 'Profesión / Cargo',
        email: 'Correo Electrónico',
      };
      const translatedMissingFields = missingFields.map(field => fieldNamesMap[field] || field).join(', ');

      await Swal.fire({
        title: 'Campos Obligatorios',
        text: `Por favor, completa los siguientes campos: ${translatedMissingFields}.`,
        icon: 'warning',
        ...swalTheme,
      });
      return; // Detener el envío si hay campos faltantes
    }
    // ✅ FIN DE LA VALIDACIÓN DE CAMPOS

    setIsSubmitting(true);
    const updateData = { ...form };
    
    // Si la contraseña está vacía, no la enviamos para que no se cambie
    if (!updateData.password || updateData.password.trim() === '') {
      delete updateData.password;
    }

    // ✅ Eliminar los campos que no deben ser enviados si no son relevantes para la actualización
    // Aunque ya no están en el formulario, es una buena práctica asegurar que no se envíen
    delete updateData.role;
    delete updateData.active;
    delete updateData.hasPagoUnicoAccess;


    try {
      const res = await fetch('/api/users/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...updateData }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error desconocido del servidor');
      }

      await Swal.fire({ title: '¡Actualizado!', text: 'El usuario ha sido actualizado correctamente.', icon: 'success', ...swalTheme });
      router.push('/admin/users');
      mutate('/api/users'); // Revalidar la lista de usuarios después de una actualización exitosa
    } catch (err) {
      await Swal.fire({ title: 'Error', text: err.message || 'No se pudo actualizar el usuario.', icon: 'error', ...swalTheme });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (usersError || !isLoaded) {
    return (
      <section style={{ backgroundColor: isDark ? '#111827' : '#f9fafb' }} className="p-8 min-h-screen text-center">
        <p style={{ color: isDark ? '#fca5a5' : '#ef4444' }}>Error al cargar datos del usuario.</p>
      </section>
    );
  }
  if (!form) {
    return (
      <section style={{ backgroundColor: isDark ? '#111827' : '#f9fafb' }} className="p-8 min-h-screen text-center">
        <p style={{ color: isDark ? '#f9fafb' : '#111827' }} className="animate-pulse">Cargando datos del usuario...</p>
      </section>
    );
  }
  
  const labelStyle = { color: isDark ? '#9ca3af' : '#6b7280' };
  const inputStyle = {
    backgroundColor: isDark ? '#1f2937' : '#ffffff',
    color: isDark ? '#f9fafb' : '#111827',
    borderColor: isDark ? '#374151' : '#d1d5db'
  };
  const readOnlyInputStyle = { ...inputStyle, backgroundColor: isDark ? '#374151' : '#f3f4f6', cursor: 'not-allowed' };
  const secondaryButtonStyle = {
    backgroundColor: isDark ? '#374151' : '#e5e7eb',
    color: isDark ? '#f9fafb' : '#374151'
  };

  return (
    <section 
      className="p-4 md:p-8 min-h-screen"
      style={{ backgroundColor: isDark ? '#111827' : '#f9fafb' }}
    >
      <div 
        className="max-w-4xl mx-auto p-6 md:p-8 rounded-lg shadow-lg border"
        style={{
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
          borderColor: isDark ? '#374151' : '#e5e7eb'
        }}
      >
        <h1 className="text-3xl font-bold mb-2" style={{ color: isDark ? '#f59e0b' : '#d97706' }}>Editar Usuario</h1>
        <p className="mb-8" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
          Modificando perfil de: <span className="font-semibold" style={{ color: isDark ? 'white' : 'black' }}>{form.fullName}</span>
        </p>
        
        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-x-8 gap-y-5">
          {/* Columna 1 */}
          <div className="space-y-5">
            <div>
              <label htmlFor="fullName" className="text-sm mb-1 block" style={labelStyle}>Nombre completo</label>
              <input name="fullName" id="fullName" value={form.fullName || ''} placeholder="Nombre completo" onChange={handleChange} className="w-full p-3 border rounded-lg" style={inputStyle} />
            </div>
            <div>
              <label htmlFor="fechaNacimiento" className="text-sm mb-1 block" style={labelStyle}>Fecha de Nacimiento</label>
              <input name="fechaNacimiento" id="fechaNacimiento" value={form.fechaNacimiento || ''} type="date" onChange={handleChange} className="w-full p-3 border rounded-lg" style={inputStyle} />
            </div>
            <div>
              <label htmlFor="sexo" className="text-sm mb-1 block" style={labelStyle}>Sexo</label>
              <select name="sexo" id="sexo" value={form.sexo || ''} onChange={handleChange} className="w-full p-3 border rounded-lg" style={inputStyle}>
                <option value="">Seleccione Sexo</option>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="Prefiero no decirlo">Prefiero no decirlo</option>
              </select>
            </div>
            <div>
              <label htmlFor="telefono" className="text-sm mb-1 block" style={labelStyle}>Teléfono</label>
              <input name="telefono" id="telefono" value={form.telefono || ''} placeholder="Teléfono (+591...)" onChange={handleChange} className="w-full p-3 border rounded-lg" style={inputStyle} />
            </div>
            <div>
              <label htmlFor="universidad" className="text-sm mb-1 block" style={labelStyle}>Universidad</label>
              <input name="universidad" id="universidad" value={form.universidad || ''} placeholder="Universidad" onChange={handleChange} className="w-full p-3 border rounded-lg" style={inputStyle} />
            </div>
            <div>
              <label htmlFor="profesion" className="text-sm mb-1 block" style={labelStyle}>Profesión / Cargo</label>
              <input name="profesion" id="profesion" value={form.profesion || ''} placeholder="Profesión / Cargo" onChange={handleChange} className="w-full p-3 border rounded-lg" style={inputStyle} />
            </div>
          </div>

          {/* Columna 2 */}
          <div className="space-y-5">
            <div>
              <label htmlFor="email" className="text-sm mb-1 block" style={labelStyle}>Correo Electrónico (no editable)</label>
              <input name="email" id="email" value={form.email || ''} type="email" className="w-full p-3 border rounded-lg" style={readOnlyInputStyle} readOnly />
            </div>
            <div>
              <label htmlFor="password" className="text-sm mb-1 block" style={labelStyle}>Nueva Contraseña</label>
              <input 
                name="password" 
                id="password"
                value={form.password} 
                type="password" 
                onChange={handleChange} 
                className="w-full p-3 border rounded-lg" 
                style={inputStyle}
                placeholder="Dejar en blanco para no cambiar"
              />
            </div>
            {/* Los campos de rol, estado activo y acceso pago único han sido eliminados del JSX */}
          </div>

          <div className="md:col-span-2 mt-6 flex justify-end gap-4">
            <button type="button" onClick={() => router.back()} className="px-6 py-3 font-semibold rounded-lg transition hover:opacity-80" style={secondaryButtonStyle}>
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting} className="px-6 py-3 font-semibold rounded-lg text-white bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-800 disabled:cursor-wait transition">
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
