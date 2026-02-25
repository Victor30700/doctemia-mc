'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
// --- ✅ MEJORA: Se importa useTheme para popups consistentes ---
import { useTheme } from '@/context/ThemeContext';
// --- ✅ MEJORA: Se importan iconos para una UI más clara ---
import { UserPlus, ArrowLeft } from 'lucide-react';

// --- ✅ MEJORA: Componente reutilizable para los campos del formulario ---
const InputField = ({ id, name, type = 'text', placeholder, value, onChange, label }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1.5">
      {label}
    </label>
    <input
      id={id}
      name={name}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="w-full px-4 py-2.5 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-700 text-gray-100 placeholder-gray-400 transition duration-200 ease-in-out"
      aria-label={label}
    />
  </div>
);

const SelectField = ({ id, name, value, onChange, label, children }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1.5">
            {label}
        </label>
        <select
            id={id}
            name={name}
            value={value}
            onChange={onChange}
            className="w-full px-4 py-2.5 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-700 text-gray-100 placeholder-gray-400 transition duration-200 ease-in-out"
            aria-label={label}
        >
            {children}
        </select>
    </div>
);


export default function RegisterPage() {
  const router = useRouter();
  const { isDark } = useTheme();
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
  const [isLoading, setIsLoading] = useState(false);

  // --- ✅ MEJORA: Estilos centralizados para SweetAlert2 ---
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
    setIsLoading(true);

    const missing = Object.entries(form).filter(([, v]) => !v || String(v).trim() === '').map(([k]) => k);
    if (missing.length) {
      await Swal.fire({ title: 'Campos Incompletos', text: `Por favor, rellena los siguientes campos: ${missing.join(', ')}`, icon: 'warning', ...swalTheme });
      setIsLoading(false);
      return;
    }

    if (form.password.length < 6) {
      await Swal.fire({ title: 'Contraseña muy corta', text: 'La contraseña debe tener al menos 6 caracteres.', icon: 'warning', ...swalTheme });
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...form, 
          email: form.email.trim(),
          rol: 'user' 
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'No se pudo registrar');
      }

      await Swal.fire({
        title: '¡Registro Exitoso!',
        text: 'Tu cuenta ha sido creada. Serás redirigido para iniciar sesión. El acceso a los cursos requiere aprobación del administrador.',
        icon: 'success',
        timer: 3000,
        timerProgressBar: true,
        ...swalTheme
      });
      router.push('/admin/users');
    } catch (err) {
      await Swal.fire({ title: 'Error de Registro', text: err.message, icon: 'error', ...swalTheme });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-4 sm:p-6">
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-gray-800/50 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-2xl w-full border border-gray-700">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-blue-400 flex items-center gap-3">
              <UserPlus size={32} />
              Crear una Cuenta
            </h1>
            <button onClick={() => router.push('/login')} className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors">
                <ArrowLeft size={16} />
                Volver al Login
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <InputField id="fullName" name="fullName" label="Nombre completo" placeholder="Ej: Juan Pérez" value={form.fullName} onChange={handleChange} />
            <InputField id="fechaNacimiento" name="fechaNacimiento" type="date" label="Fecha de Nacimiento" value={form.fechaNacimiento} onChange={handleChange} />
            <SelectField id="sexo" name="sexo" label="Sexo" value={form.sexo} onChange={handleChange}>
                <option value="" disabled>Selecciona tu sexo</option>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="Prefiero no decirlo">Prefiero no decirlo</option>
            </SelectField>
            <InputField id="telefono" name="telefono" label="Teléfono" placeholder="Ej: 71234567" value={form.telefono} onChange={handleChange} />
            <InputField id="universidad" name="universidad" label="Universidad" placeholder="Ej: UMSA" value={form.universidad} onChange={handleChange} />
            <InputField id="profesion" name="profesion" label="Profesión / Cargo" placeholder="Ej: Estudiante de Medicina" value={form.profesion} onChange={handleChange} />
            
            <div className="md:col-span-2">
                <InputField id="email" name="email" type="email" label="Correo electrónico" placeholder="tu@correo.com" value={form.email} onChange={handleChange} />
            </div>
            <div className="md:col-span-2">
                <InputField id="password" name="password" type="password" label="Contraseña" placeholder="Crea una contraseña segura" value={form.password} onChange={handleChange} />
            </div>

            <div className="md:col-span-2 mt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
              >
                {isLoading ? 'Registrando...' : 'Crear Mi Cuenta'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
