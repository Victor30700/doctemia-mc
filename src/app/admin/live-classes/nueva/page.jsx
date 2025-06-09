// src/app/admin/live-classes/nueva/page.jsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import Swal from 'sweetalert2';

export default function CrearClaseEnVivo() {
  const router = useRouter();
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { titulo, fecha, hora, duracion, expositor, enlace } = form;

    if (!titulo || !fecha || !hora || !duracion || !expositor || !enlace) {
      Swal.fire('Faltan campos requeridos', 'Por favor completa todos los campos obligatorios.', 'warning');
      return;
    }

    try {
      await addDoc(collection(db, 'clasesEnVivo'), form);
      Swal.fire('Clase programada', 'La clase en vivo ha sido registrada.', 'success');
      router.push('/admin/live-classes');
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo registrar la clase.', 'error');
    }
  };

  return (
    <section className="p-6 max-w-3xl mx-auto bg-white shadow rounded-lg">
      <h1 className="text-2xl font-bold mb-4 text-blue-700">Programar Clase en Vivo</h1>
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
                value={form[name]}
                onChange={handleChange}
                rows={3}
                className="w-full border border-gray-300 rounded px-3 py-2"
              ></textarea>
            ) : (
              <input
                type={type}
                name={name}
                value={form[name]}
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
            Guardar Clase
          </button>
        </div>
      </form>
    </section>
  );
}
