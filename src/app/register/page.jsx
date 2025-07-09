'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import Image from 'next/image'; // Importar el componente Image de Next.js

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
        confirmButtonColor: '#3b82f6',
        background: '#1f2937', // Fondo oscuro para la alerta
        color: '#f9fafb', // Texto claro para la alerta
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
        confirmButtonColor: '#3b82f6',
        background: '#1f2937', // Fondo oscuro para la alerta
        color: '#f9fafb', // Texto claro para la alerta
      });
      router.push('/login');
    } catch (err) {
      await Swal.fire({
        title: 'Error',
        text: err.message,
        icon: 'error',
        confirmButtonColor: '#3b82f6',
        background: '#1f2937', // Fondo oscuro para la alerta
        color: '#f9fafb', // Color de texto para SweetAlert2 en modo oscuro
      });
    }
  };

  return (
    // Contenedor principal con el fondo de imagen y altura completa
    <div
      className="relative flex flex-col items-center justify-center min-h-screen bg-cover bg-center p-0"
      style={{ backgroundImage: "url('/images/fondoLogin.png')" }}
    >
      {/* Overlay oscuro para mejorar la legibilidad del contenido */}
      <div className="absolute inset-0 bg-black opacity-60 z-0"></div>

      {/* Contenido principal: Formulario Centrado */}
      {/* ✅ CAMBIO: El contenedor principal de contenido ahora solo contiene el formulario y lo centra */}
      <div className="relative z-10 w-full h-full flex items-center justify-center p-4 md:p-8 lg:p-12">
        
        {/* Sección del Formulario de Registro */}
        {/* ✅ CAMBIO: max-w-2xl para hacerlo más ancho, bg-transparent en móvil, bg-gray-900/30 en desktop */}
        <section className="bg-transparent md:bg-gray-900/30 p-5 sm:p-7 rounded-xl shadow-2xl w-full max-w-sm md:max-w-xl lg:max-w-2xl transform transition-transform duration-300 hover:scale-102"
                  style={{boxShadow: '0 0 30px rgba(128, 0, 128, 0.5), 0 0 60px rgba(79, 70, 229, 0.3)'}}>
          
          {/* Logo del sistema */}
          <div className="text-center mb-4">
            <Image
              src="/icons/1-oscuro.png"
              alt="DOCTEMIA MC Logo"
              width={160}
              height={48}
              priority
              className="mx-auto"
            />
          </div>

          

          {/* ✅ CAMBIO: Todos los campos de input ahora pueden ocupar una columna */}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
            {/* Input de Nombre completo */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-1">Nombre completo</label>
              <input
                id="fullName"
                name="fullName"
                placeholder="Ej: Juan Pérez"
                value={form.fullName}
                onChange={handleChange}
                className="w-full p-3 border border-purple-600/50 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:ring-purple-500 focus:border-purple-500 transition duration-200 ease-in-out"
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
                className="w-full p-3 border border-purple-600/50 rounded-lg bg-gray-800 text-white placeholder-gray-400 appearance-none transition duration-200 ease-in-out"
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
                className="w-full p-3 border border-purple-600/50 rounded-lg bg-gray-800 text-white placeholder-gray-400 transition duration-200 ease-in-out"
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
                className="w-full p-3 border border-purple-600/50 rounded-lg bg-gray-800 text-white placeholder-gray-400 transition duration-200 ease-in-out"
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
                className="w-full p-3 border border-purple-600/50 rounded-lg bg-gray-800 text-white placeholder-gray-400 transition duration-200 ease-in-out"
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
                className="w-full p-3 border border-purple-600/50 rounded-lg bg-gray-800 text-white placeholder-gray-400 transition duration-200 ease-in-out"
                aria-label="Profesión o Cargo"
              />
            </div>
            {/* Input de Correo electrónico */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Correo electrónico</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Ej: juan.perez@example.com"
                value={form.email}
                onChange={handleChange}
                className="w-full p-3 border border-purple-600/50 rounded-lg bg-gray-800 text-white placeholder-gray-400 transition duration-200 ease-in-out"
                aria-label="Correo electrónico"
              />
            </div>
            {/* Input de Contraseña */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">Contraseña</label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Ingresa tu contraseña"
                value={form.password}
                onChange={handleChange}
                className="w-full p-3 border border-purple-600/50 rounded-lg bg-gray-800 text-white placeholder-gray-400 transition duration-200 ease-in-out"
                aria-label="Contraseña"
              />
            </div>
            {/* Botón de Crear Cuenta */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 rounded-full shadow-lg transition duration-200 ease-in-out transform hover:scale-105 sm:col-span-2 mt-3"
              style={{boxShadow: '0 5px 15px rgba(128, 0, 128, 0.4)'}}
            >
              Crear Cuenta
            </button>
          </form>

          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="font-medium text-purple-400 hover:underline hover:text-purple-300 transition duration-200 ease-in-out"
            >
              Volver al Login
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
