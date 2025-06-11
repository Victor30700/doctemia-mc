'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import Swal from 'sweetalert2';
import { useTheme } from '@/context/ThemeContext'; // 1. Importar el hook

export default function CrearClaseEnVivo() {
  const router = useRouter();
  const { isDark, isLoaded } = useTheme(); // 2. Obtener el estado del tema
  const [form, setForm] = useState({
    titulo: '',
    fecha: '',
    hora: '',
    duracion: '',
    expositor: '',
    descripcion: '',
    enlace: '',
    idReunion: ''
  });

  // 3. Definir estilos para SweetAlert2
  const swalTheme = {
    background: isDark ? '#1f2937' : '#ffffff',
    color: isDark ? '#f9fafb' : '#111827',
    confirmButtonColor: '#3b82f6',
    cancelButtonColor: '#ef4444',
  };

  // 4. Estilos reutilizables para la UI
  const sectionStyle = {
    backgroundColor: isDark ? '#1f2937' : '#ffffff',
    borderColor: isDark ? '#374151' : '#e5e7eb',
    color: isDark ? '#f9fafb' : '#111827', // Default text color
  };
  const headingStyle = {
    color: isDark ? '#60a5fa' : '#3b82f6',
  };
  const labelStyle = {
    color: isDark ? '#f9fafb' : '#111827',
  };
  const inputStyle = {
    backgroundColor: isDark ? '#374151' : '#ffffff',
    color: isDark ? '#f9fafb' : '#111827',
    borderColor: isDark ? '#4b5563' : '#d1d5db',
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { titulo, fecha, hora, duracion, expositor, enlace } = form;

    if (!titulo || !fecha || !hora || !duracion || !expositor || !enlace) {
      Swal.fire({
        title: 'Faltan campos requeridos',
        text: 'Por favor completa todos los campos obligatorios.',
        icon: 'warning',
        ...swalTheme, // Aplicar tema
      });
      return;
    }

    try {
      await addDoc(collection(db, 'clasesEnVivo'), form);
      Swal.fire({
        title: 'Clase programada',
        text: 'La clase en vivo ha sido registrada.',
        icon: 'success',
        ...swalTheme, // Aplicar tema
      });
      router.push('/admin/live-classes');
    } catch (error) {
      console.error(error);
      Swal.fire({
        title: 'Error',
        text: 'No se pudo registrar la clase.',
        icon: 'error',
        ...swalTheme, // Aplicar tema
      });
    }
  };

  // Ensure theme is loaded before rendering to prevent initial flicker
  if (!isLoaded) {
    return (
      <section 
        className="p-8 min-h-screen text-center" 
        style={{ backgroundColor: isDark ? '#111827' : '#f9fafb' }}
      >
        <p 
          className="animate-pulse" 
          style={{ color: isDark ? '#f9fafb' : '#111827' }}
        >
          Cargando formulario...
        </p>
      </section>
    );
  }

  return (
    <section className="p-6 max-w-3xl mx-auto shadow rounded-lg border" style={sectionStyle}>
      <h1 className="text-2xl font-bold mb-4" style={headingStyle}>Programar Clase en Vivo</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {[
          { label: 'Título', name: 'titulo', type: 'text', required: true },
          { label: 'Fecha', name: 'fecha', type: 'date', required: true },
          { label: 'Hora de Inicio', name: 'hora', type: 'time', required: true },
          { label: 'Duración Estimada', name: 'duracion', type: 'text', required: true },
          { label: 'Expositor', name: 'expositor', type: 'text', required: true },
          { label: 'Descripción (opcional)', name: 'descripcion', type: 'textarea', required: false },
          { label: 'Enlace de la Clase', name: 'enlace', type: 'text', required: true },
          { label: 'ID de la Reunión (si aplica)', name: 'idReunion', type: 'text', required: false },
        ].map(({ label, name, type, required }) => (
          <div key={name}>
            <label className="block font-medium mb-1" style={labelStyle}>{label}:</label>
            {type === 'textarea' ? (
              <textarea
                name={name}
                value={form[name]}
                onChange={handleChange}
                rows={3}
                className="w-full rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={inputStyle}
              ></textarea>
            ) : (
              <input
                type={type}
                name={name}
                value={form[name]}
                onChange={handleChange}
                className="w-full rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={inputStyle}
                required={required}
              />
            )}
          </div>
        ))}

        <div className="flex justify-between mt-6">
          <button type="button" onClick={() => router.push('/admin/live-classes')} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition">
            Cancelar
          </button>
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded transition">
            Guardar Clase
          </button>
        </div>
      </form>
    </section>
  );
}
