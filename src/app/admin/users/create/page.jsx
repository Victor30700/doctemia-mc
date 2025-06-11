'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { useTheme } from '@/context/ThemeContext'; // 1. Importar el hook de tema

export default function CreateUserPage() {
  const router = useRouter();
  const { isDark } = useTheme(); // 2. Obtener el estado del tema
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

  // 3. Definir estilos para SweetAlert2
  const swalTheme = {
    background: isDark ? '#1f2937' : '#ffffff',
    color: isDark ? '#f9fafb' : '#111827',
    confirmButtonColor: '#3b82f6',
    cancelButtonColor: '#ef4444',
  };

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
      await Swal.fire({ title: 'Campos incompletos', text: `Por favor, rellena los siguientes campos: ${missing.join(', ')}`, icon: 'warning', ...swalTheme });
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
        throw new Error(data.error || 'No se pudo crear el usuario.');
      }

      await Swal.fire({ title: '¡Usuario Creado!', text: 'El usuario ha sido registrado correctamente.', icon: 'success', ...swalTheme });
      router.push('/admin/users');
    } catch (err) {
      await Swal.fire({ title: 'Error', text: err.message, icon: 'error', ...swalTheme });
    }
  };
  
  // 4. Definir objetos de estilo para reutilizarlos y mantener el código limpio
  const inputStyle = {
    backgroundColor: isDark ? '#374151' : '#f9fafb',
    color: isDark ? '#f9fafb' : '#111827',
    borderColor: isDark ? '#4b5563' : '#d1d5db'
  };

  return (
    <div 
      className="min-h-screen p-4 md:p-8 transition-colors duration-300"
      style={{ backgroundColor: isDark ? '#111827' : '#f9fafb' }}
    >
      <div 
        className="max-w-4xl mx-auto p-6 md:p-8 rounded-lg shadow-lg border"
        style={{ 
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
          borderColor: isDark ? '#374151' : '#e5e7eb'
        }}
      >
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold" style={{ color: isDark ? '#60a5fa' : '#3b82f6' }}>
            Crear Nuevo Usuario
          </h1>
          <button onClick={() => router.push('/admin/users')} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition">
            Volver
          </button>
        </div>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nombre Completo */}
          <input
            name="fullName"
            placeholder="Nombre completo"
            value={form.fullName}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg"
            style={inputStyle}
          />
          {/* Fecha de Nacimiento */}
          <input
            name="fechaNacimiento"
            type="date"
            value={form.fechaNacimiento}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg"
            style={inputStyle}
          />
          {/* Sexo */}
          <select
            name="sexo"
            value={form.sexo}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg"
            style={inputStyle}
          >
            <option value="">Selecciona el sexo</option>
            <option value="Masculino">Masculino</option>
            <option value="Femenino">Femenino</option>
            <option value="Prefiero no decirlo">Prefiero no decirlo</option>
          </select>
          {/* Teléfono */}
          <input
            name="telefono"
            placeholder="Teléfono"
            value={form.telefono}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg"
            style={inputStyle}
          />
          {/* Universidad */}
          <input
            name="universidad"
            placeholder="Universidad"
            value={form.universidad}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg"
            style={inputStyle}
          />
          {/* Profesión */}
          <input
            name="profesion"
            placeholder="Profesión / Cargo"
            value={form.profesion}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg"
            style={inputStyle}
          />
          {/* Email */}
          <input
            name="email"
            type="email"
            placeholder="Correo electrónico"
            value={form.email}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg md:col-span-2"
            style={inputStyle}
          />
          {/* Contraseña */}
          <input
            name="password"
            type="password"
            placeholder="Contraseña"
            value={form.password}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg md:col-span-2"
            style={inputStyle}
          />
          {/* Botón de Enviar */}
          <button
            type="submit"
            className="md:col-span-2 mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200"
          >
            Crear Usuario
          </button>
        </form>
      </div>
    </div>
  );
}