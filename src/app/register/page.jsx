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
      await Swal.fire('Error', `Faltan campos: ${missing.join(', ')}`, 'warning');
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

      await Swal.fire(
        '¡Registrado!',
        'Tu cuenta ha sido creada. Espera a que el administrador habilite tu acceso.',
        'success'
      );
      router.push('/login');
    } catch (err) {
      await Swal.fire('Error', err.message, 'error');
    }
  };

  return (
    <section className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Registro de Usuario</h1>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          name="fullName"
          placeholder="Nombre completo"
          value={form.fullName}
          onChange={handleChange}
          className="input"
        />
        <input
          name="fechaNacimiento"
          type="date"
          value={form.fechaNacimiento}
          onChange={handleChange}
          className="input"
        />
        <select
          name="sexo"
          value={form.sexo}
          onChange={handleChange}
          className="input"
        >
          <option value="">Sexo</option>
          <option value="Masculino">Masculino</option>
          <option value="Femenino">Femenino</option>
          <option value="Prefiero no decirlo">Prefiero no decirlo</option>
        </select>
        <input
          name="telefono"
          placeholder="Teléfono"
          value={form.telefono}
          onChange={handleChange}
          className="input"
        />
        <input
          name="universidad"
          placeholder="Universidad"
          value={form.universidad}
          onChange={handleChange}
          className="input"
        />
        <input
          name="profesion"
          placeholder="Profesión / Cargo"
          value={form.profesion}
          onChange={handleChange}
          className="input"
        />
        <input
          name="email"
          type="email"
          placeholder="Correo electrónico"
          value={form.email}
          onChange={handleChange}
          className="input col-span-full"
        />
        <input
          name="password"
          type="password"
          placeholder="Contraseña"
          value={form.password}
          onChange={handleChange}
          className="input col-span-full"
        />
        <button
          type="submit"
          className="btn-primary md:col-span-2 mt-4"
        >
          Crear Cuenta
        </button>
      </form>

      <div className="text-center mt-4">
        <button
          type="button"
          onClick={() => router.push('/login')}
          className="text-gray-600 hover:text-gray-900 dark:text-gray-400 underline"
        >
          Volver al Login
        </button>
      </div>
    </section>
  );
}
