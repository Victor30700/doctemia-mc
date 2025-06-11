'use client';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import Link from 'next/link';
import Swal from 'sweetalert2';
import dayjs from 'dayjs';
import { useTheme } from '@/context/ThemeContext'; // 1. Importar el hook

export default function AdminClasesEnVivo() {
  const [clases, setClases] = useState({ pasadas: [], hoy: [], futuras: [] });
  const [loading, setLoading] = useState(true);
  const { isDark, isLoaded } = useTheme(); // 2. Obtener el estado del tema

  // 3. Definir estilos para SweetAlert2
  const swalTheme = {
    background: isDark ? '#1f2937' : '#ffffff',
    color: isDark ? '#f9fafb' : '#111827',
    confirmButtonColor: '#3b82f6',
    cancelButtonColor: '#ef4444',
  };

  // 4. Estilos reutilizables para la UI
  const sectionStyle = {
    backgroundColor: isDark ? '#111827' : '#f9fafb',
  };
  const headingStyle = {
    color: isDark ? '#60a5fa' : '#3b82f6',
  };
  const subHeadingStyle = {
    color: isDark ? '#f9fafb' : '#111827',
  };
  const cardStyle = {
    backgroundColor: isDark ? '#1f2937' : '#ffffff',
    borderColor: isDark ? '#374151' : '#e5e7eb',
    color: isDark ? '#d1d5db' : '#6b7280', // Default text color for card content
  };
  const cardTitleStyle = {
    color: isDark ? '#93c5fd' : '#1d4ed8', // A lighter blue for dark mode titles
  };
  const cardLabelStyle = {
    color: isDark ? '#f9fafb' : '#111827', // Stronger color for labels
  };
  const noClassesStyle = {
    color: isDark ? '#9ca3af' : '#6b7280', // Lighter grey for messages
  };

  useEffect(() => {
    const cargarClases = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'clasesEnVivo'));
        const hoy = dayjs().format('YYYY-MM-DD');
        const todas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const pasadas = [], hoyClases = [], futuras = [];

        todas.forEach(clase => {
          if (!clase.fecha) return;
          const fecha = dayjs(clase.fecha);
          if (fecha.isBefore(hoy, 'day')) pasadas.push(clase);
          else if (fecha.isSame(hoy, 'day')) hoyClases.push(clase);
          else futuras.push(clase);
        });

        setClases({ pasadas, hoy: hoyClases, futuras });
      } catch (error) {
        console.error("Error cargando clases:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarClases();
  }, []);

  const eliminarClase = async (id) => {
    Swal.fire({
      title: '¿Eliminar clase?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      ...swalTheme, // Apply theme to SweetAlert2
    }).then(async result => {
      if (result.isConfirmed) {
        try {
          await deleteDoc(doc(db, 'clasesEnVivo', id));
          setClases(prev => ({
            pasadas: prev.pasadas.filter(c => c.id !== id),
            hoy: prev.hoy.filter(c => c.id !== id),
            futuras: prev.futuras.filter(c => c.id !== id),
          }));
          Swal.fire({
            title: 'Eliminado',
            text: 'La clase ha sido eliminada.',
            icon: 'success',
            ...swalTheme, // Apply theme to SweetAlert2
          });
        } catch (error) {
          console.error("Error al eliminar clase:", error);
          Swal.fire({
            title: 'Error',
            text: 'No se pudo eliminar la clase.',
            icon: 'error',
            ...swalTheme, // Apply theme to SweetAlert2
          });
        }
      }
    });
  };

  const renderClaseCard = (clase) => (
    <div key={clase.id} className="shadow-md rounded-lg p-4 flex flex-col gap-2 border" style={cardStyle}>
      <h3 className="text-lg font-semibold" style={cardTitleStyle}>{clase.titulo}</h3>
      <p style={cardStyle}><span className="font-medium" style={cardLabelStyle}>Fecha:</span> {clase.fecha}</p>
      <p style={cardStyle}><span className="font-medium" style={cardLabelStyle}>Hora:</span> {clase.hora}</p>
      <p style={cardStyle}><span className="font-medium" style={cardLabelStyle}>Duración:</span> {clase.duracion}</p>
      <p style={cardStyle}><span className="font-medium" style={cardLabelStyle}>Expositor:</span> {clase.expositor}</p>
      <div className="flex flex-wrap gap-2 mt-2">
        <Link href={`/admin/live-classes/editar/${clase.id}`} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded">Editar</Link>
        <button onClick={() => eliminarClase(clase.id)} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded">Eliminar</button>
      </div>
    </div>
  );

  if (loading || !isLoaded) {
    return (
      <section style={sectionStyle} className="p-8 min-h-screen text-center">
        <p style={subHeadingStyle} className="animate-pulse">Cargando clases...</p>
      </section>
    );
  }

  return (
    <section className="p-6 min-h-screen" style={sectionStyle}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold" style={headingStyle}>Clases en Vivo Programadas</h1>
        <Link href="/admin/live-classes/nueva" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">Programar Clase en Vivo</Link>
      </div>

      <div className="space-y-6">
        {['hoy', 'futuras', 'pasadas'].map(tipo => (
          <div key={tipo}>
            <h2 className="text-xl font-semibold mb-2" style={subHeadingStyle}>
              {tipo === 'hoy' ? '📆 Clases de Hoy' : tipo === 'futuras' ? '📅 Clases Futuras' : '🕓 Clases Pasadas'}
            </h2>
            {clases[tipo].length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {clases[tipo].map(renderClaseCard)}
              </div>
            ) : (
              <p style={noClassesStyle}>No hay clases {tipo === 'hoy' ? 'para hoy' : tipo}.</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
