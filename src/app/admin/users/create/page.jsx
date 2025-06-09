'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

export default function CreateUserPage() { // Puedes cambiar el nombre si quieres, ej: CreateUserPage
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: '',
    fechaNacimiento: '',
    sexo: '',
    telefono: '',
    universidad: '',
    profesion: '',
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const missing = Object.entries(form)
      .filter(([, v]) => !v || String(v).trim() === '')
      .map(([k]) => k);

    if (missing.length) {
      await Swal.fire('Campos incompletos', `Por favor, rellena los siguientes campos: ${missing.join(', ')}`, 'warning');
      return;
    }

    try {
      const res = await fetch('/api/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, rol: 'user' }), // Se asigna rol 'user' por defecto
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'No se pudo crear el usuario.');
      }

      await Swal.fire(
        '¡Usuario Creado!',
        'El usuario ha sido registrado correctamente.',
        'success'
      );
      // Redirige de vuelta a la lista de usuarios tras crear uno nuevo.
      router.push('/admin/users');
    } catch (err) {
      await Swal.fire('Error', err.message, 'error');
    }
  };

  return (
    // Se ha añadido un estilo de fondo y contenedor para que se vea mejor en el layout de admin
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-gray-800 p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-6">Crear Nuevo Usuario</h1>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <input
            name="fullName"
            placeholder="Nombre completo"
            value={form.fullName}
            onChange={handleChange}
            className="input-style"
          />
          <input
            name="fechaNacimiento"
            type="date"
            value={form.fechaNacimiento}
            onChange={handleChange}
            className="input-style"
          />
          <select
            name="sexo"
            value={form.sexo}
            onChange={handleChange}
            className="input-style"
          >
            <option value="">Selecciona el sexo</option>
            <option value="Masculino">Masculino</option>
            <option value="Femenino">Femenino</option>
            <option value="Prefiero no decirlo">Prefiero no decirlo</option>
          </select>
          <input
            name="telefono"
            placeholder="Teléfono"
            value={form.telefono}
            onChange={handleChange}
            className="input-style"
          />
          <input
            name="universidad"
            placeholder="Universidad"
            value={form.universidad}
            onChange={handleChange}
            className="input-style"
          />
          <input
            name="profesion"
            placeholder="Profesión / Cargo"
            value={form.profesion}
            onChange={handleChange}
            className="input-style"
          />
          <input
            name="email"
            type="email"
            placeholder="Correo electrónico"
            value={form.email}
            onChange={handleChange}
            className="input-style md:col-span-2"
          />
          <input
            name="password"
            type="password"
            placeholder="Contraseña"
            value={form.password}
            onChange={handleChange}
            className="input-style md:col-span-2"
          />
          <button
            type="submit"
            className="md:col-span-2 mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200"
          >
            Crear Usuario
          </button>
        </form>
      </div>
      {/* Estilos para los inputs, puedes moverlos a un archivo CSS global */}
      <style jsx>{`
        .input-style {
          background-color: #374151;
          color: white;
          border: 1px solid #4b5563;
          border-radius: 8px;
          padding: 12px;
          width: 100%;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .input-style:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
        }
        .input-style::placeholder {
            color: #9ca3af;
        }
      `}</style>
    </div>
  );
}
