// src/app/admin/live-classes/page.jsx
'use client';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import Link from 'next/link';
import Swal from 'sweetalert2';
import dayjs from 'dayjs';

export default function AdminClasesEnVivo() {
  const [clases, setClases] = useState({ pasadas: [], hoy: [], futuras: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarClases = async () => {
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
      setLoading(false);
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
      cancelButtonText: 'Cancelar'
    }).then(async result => {
      if (result.isConfirmed) {
        await deleteDoc(doc(db, 'clasesEnVivo', id));
        setClases(prev => ({
          pasadas: prev.pasadas.filter(c => c.id !== id),
          hoy: prev.hoy.filter(c => c.id !== id),
          futuras: prev.futuras.filter(c => c.id !== id),
        }));
        Swal.fire('Eliminado', 'La clase ha sido eliminada.', 'success');
      }
    });
  };

  const renderClaseCard = (clase) => (
    <div key={clase.id} className="bg-white shadow-md rounded-lg p-4 flex flex-col gap-2">
      <h3 className="text-lg font-semibold text-blue-700">{clase.titulo}</h3>
      <p><span className="font-medium">Fecha:</span> {clase.fecha}</p>
      <p><span className="font-medium">Hora:</span> {clase.hora}</p>
      <p><span className="font-medium">Duración:</span> {clase.duracion}</p>
      <p><span className="font-medium">Expositor:</span> {clase.expositor}</p>
      <div className="flex flex-wrap gap-2 mt-2">
        <Link href={`/admin/live-classes/editar/${clase.id}`} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded">Editar</Link>
        <button onClick={() => eliminarClase(clase.id)} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded">Eliminar</button>
      </div>
    </div>
  );

  if (loading) return <div className="p-8 text-center">Cargando clases...</div>;

  return (
    <section className="p-6 min-h-screen bg-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-blue-700">Clases en Vivo Programadas</h1>
        <Link href="/admin/live-classes/nueva" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">Programar Clase en Vivo</Link>
      </div>

      <div className="space-y-6">
        {['hoy', 'futuras', 'pasadas'].map(tipo => (
          <div key={tipo}>
            <h2 className="text-xl font-semibold mb-2 text-gray-800">
              {tipo === 'hoy' ? '📆 Clases de Hoy' : tipo === 'futuras' ? '📅 Clases Futuras' : '🕓 Clases Pasadas'}
            </h2>
            {clases[tipo].length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {clases[tipo].map(renderClaseCard)}
              </div>
            ) : (
              <p className="text-gray-500">No hay clases {tipo === 'hoy' ? 'para hoy' : tipo}.</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
