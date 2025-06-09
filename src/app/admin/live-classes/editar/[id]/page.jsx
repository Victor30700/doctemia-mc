// src/app/admin/live-classes/editar/[id]/page.jsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import Swal from 'sweetalert2';

export default function EditarClaseEnVivo() {
  const router = useRouter();
  const { id } = useParams();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarClase = async () => {
      try {
        const docRef = doc(db, 'clasesEnVivo', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setForm(docSnap.data());
        } else {
          Swal.fire('Error', 'Clase no encontrada', 'error');
          router.push('/admin/live-classes');
        }
      } catch (err) {
        Swal.fire('Error', 'No se pudo cargar la clase', 'error');
      } finally {
        setLoading(false);
      }
    };
    cargarClase();
  }, [id, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, 'clasesEnVivo', id), form);
      Swal.fire('Actualizado', 'La clase ha sido actualizada.', 'success');
      router.push('/admin/live-classes');
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'No se pudo actualizar la clase.', 'error');
    }
  };

  if (loading || !form) return <div className="p-8 text-center">Cargando clase...</div>;

  return (
    <section className="p-6 max-w-3xl mx-auto bg-white shadow rounded-lg">
      <h1 className="text-2xl font-bold mb-4 text-blue-700">Editar Clase en Vivo</h1>
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
            <label className="block text-gray-700 font-medium mb-1">{label}:</label>
            {type === 'textarea' ? (
              <textarea
                name={name}
                value={form[name] || ''}
                onChange={handleChange}
                rows={3}
                className="w-full border border-gray-300 rounded px-3 py-2"
              ></textarea>
            ) : (
              <input
                type={type}
                name={name}
                value={form[name] || ''}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
                required={required}
              />
            )}
          </div>
        ))}

        <div className="flex justify-between mt-6">
          <button type="button" onClick={() => router.push('/admin/live-classes')} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded">
            Cancelar
          </button>
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded">
            Actualizar Clase
          </button>
        </div>
      </form>
    </section>
  );
}
