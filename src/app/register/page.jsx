'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

export default function RegisterPage() {
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

    // Validar campos obligatorios
    const missing = Object.entries(form)
      .filter(([, v]) => !v || v.trim() === '')
      .map(([k]) => k);

    if (missing.length) {
      await Swal.fire({
        title: 'Error',
        text: `Faltan campos: ${missing.join(', ')}`,
        icon: 'warning',
        confirmButtonColor: '#3b82f6', // Estilo para SweetAlert2
        background: '#1f2937', // Fondo para SweetAlert2 en modo oscuro
        color: '#f9fafb', // Color de texto para SweetAlert2 en modo oscuro
      });
      return;
    }

    try {
      const res = await fetch('/api/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, rol: 'user' }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'No se pudo registrar');
      }

      await Swal.fire({
        title: '¡Registrado!',
        text: 'Tu cuenta ha sido creada. Espera a que el administrador habilite tu acceso.',
        icon: 'success',
        confirmButtonColor: '#3b82f6', // Estilo para SweetAlert2
        background: '#1f2937', // Fondo para SweetAlert2 en modo oscuro
        color: '#f9fafb', // Color de texto para SweetAlert2 en modo oscuro
      });
      router.push('/login');
    } catch (err) {
      await Swal.fire({
        title: 'Error',
        text: err.message,
        icon: 'error',
        confirmButtonColor: '#3b82f6', // Estilo para SweetAlert2
        background: '#1f2937', // Fondo para SweetAlert2 en modo oscuro
        color: '#f9fafb', // Color de texto para SweetAlert2 en modo oscuro
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-700 p-4 sm:p-6">
      <section className="bg-gray-800 p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-700 transform hover:scale-105 transition-transform duration-300 ease-in-out">
        <h1 className="text-3xl font-extrabold text-center text-blue-400 mb-8 tracking-wide">
          Registro de Usuario
        </h1>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
          {/* Input de Nombre completo */}
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-1">Nombre completo</label>
            <input
              id="fullName"
              name="fullName"
              placeholder="Ej: Juan Pérez"
              value={form.fullName}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-700 text-gray-100 placeholder-gray-400 transition duration-200 ease-in-out"
              aria-label="Nombre completo"
            />
          </div>
          {/* Input de Fecha de Nacimiento */}
          <div>
            <label htmlFor="fechaNacimiento" className="block text-sm font-medium text-gray-300 mb-1">Fecha de Nacimiento</label>
            <input
              id="fechaNacimiento"
              name="fechaNacimiento"
              type="date"
              value={form.fechaNacimiento}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-700 text-gray-100 placeholder-gray-400 appearance-none transition duration-200 ease-in-out"
              aria-label="Fecha de Nacimiento"
            />
          </div>
          {/* Select de Sexo */}
          <div>
            <label htmlFor="sexo" className="block text-sm font-medium text-gray-300 mb-1">Sexo</label>
            <select
              id="sexo"
              name="sexo"
              value={form.sexo}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-700 text-gray-100 placeholder-gray-400 transition duration-200 ease-in-out"
              aria-label="Sexo"
            >
              <option value="" disabled>Selecciona tu sexo</option>
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
              <option value="Prefiero no decirlo">Prefiero no decirlo</option>
            </select>
          </div>
          {/* Input de Teléfono */}
          <div>
            <label htmlFor="telefono" className="block text-sm font-medium text-gray-300 mb-1">Teléfono</label>
            <input
              id="telefono"
              name="telefono"
              placeholder="Ej: 71234567"
              value={form.telefono}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-700 text-gray-100 placeholder-gray-400 transition duration-200 ease-in-out"
              aria-label="Teléfono"
            />
          </div>
          {/* Input de Universidad */}
          <div>
            <label htmlFor="universidad" className="block text-sm font-medium text-gray-300 mb-1">Universidad</label>
            <input
              id="universidad"
              name="universidad"
              placeholder="Ej: UMSA"
              value={form.universidad}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-700 text-gray-100 placeholder-gray-400 transition duration-200 ease-in-out"
              aria-label="Universidad"
            />
          </div>
          {/* Input de Profesión / Cargo */}
          <div>
            <label htmlFor="profesion" className="block text-sm font-medium text-gray-300 mb-1">Profesión / Cargo</label>
            <input
              id="profesion"
              name="profesion"
              placeholder="Ej: Ingeniero de Software"
              value={form.profesion}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-700 text-gray-100 placeholder-gray-400 transition duration-200 ease-in-out"
              aria-label="Profesión o Cargo"
            />
          </div>
          {/* Input de Correo electrónico (ocupa dos columnas en pantallas medianas y grandes) */}
          <div className="col-span-full">
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Correo electrónico</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="Ej: juan.perez@example.com"
              value={form.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-700 text-gray-100 placeholder-gray-400 transition duration-200 ease-in-out"
              aria-label="Correo electrónico"
            />
          </div>
          {/* Input de Contraseña (ocupa dos columnas en pantallas medianas y grandes) */}
          <div className="col-span-full">
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">Contraseña</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Ingresa tu contraseña"
              value={form.password}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-700 text-gray-100 placeholder-gray-400 transition duration-200 ease-in-out"
              aria-label="Contraseña"
            />
          </div>
          {/* Botón de Crear Cuenta */}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-lg md:col-span-2 mt-4"
          >
            Crear Cuenta
          </button>
        </form>

        <div className="text-center mt-6">
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="text-blue-400 hover:text-blue-200 font-medium underline transition duration-200 ease-in-out"
          >
            Volver al Login
          </button>
        </div>
      </section>
    </div>
  );
}
