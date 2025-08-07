'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import Image from 'next/image';

export default function RegisterPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(1);
  const [form, setForm] = useState({
    fullName: '',
    fechaNacimiento: '',
    sexo: '',
    telefono: '',
    universidad: '',
    profesion: '',
    fechaExamen: '',
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
        confirmButtonColor: '#5483B3',
        background: '#FFFFFF',
        color: '#052659',
      });
      return;
    }

    try {
      const res = await fetch('/api/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, rol: 'user', active: true }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'No se pudo registrar');
      }

      await Swal.fire({
        title: '¡Registrado!',
        text: 'Tu cuenta ha sido creada exitosamente. Ahora puedes iniciar sesión.',
        icon: 'success',
        confirmButtonColor: '#5483B3',
        background: '#FFFFFF',
        color: '#052659',
      });
      router.push('/login');
    } catch (err) {
      await Swal.fire({
        title: 'Error',
        text: err.message,
        icon: 'error',
        confirmButtonColor: '#5483B3',
        background: '#FFFFFF',
        color: '#052659',
      });
    }
  };

  // Validar si se puede avanzar a la siguiente pestaña (solo para móviles)
  const canProceedToTab2 = () => {
    const tab1Fields = ['fullName', 'fechaNacimiento', 'sexo', 'telefono'];
    return tab1Fields.every(field => form[field] && form[field].trim() !== '');
  };

  const handleNextTab = () => {
    if (canProceedToTab2()) {
      setActiveTab(2);
    } else {
      Swal.fire({
        title: 'Campos Requeridos',
        text: 'Por favor, completa todos los campos de información personal antes de continuar.',
        icon: 'warning',
        background: '#FFFFFF',
        color: '#052659',
        confirmButtonColor: '#5483B3',
      });
    }
  };

  const goToLogin = () => {
    router.push('/login');
  };

  return (
    <>
      {/* Estilos personalizados */}
      <style jsx global>{`
        @keyframes slideInFromLeft {
          from { transform: translateX(-50px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideInFromRight {
          from { transform: translateX(50px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideInLeft {
          animation: slideInFromLeft 0.7s ease-out forwards;
        }
        .animate-slideInRight {
          animation: slideInFromRight 0.7s ease-out forwards;
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out forwards;
        }
        .input-underline::after {
          content: '';
          position: absolute;
          left: 0;
          bottom: 0;
          width: 100%;
          height: 2px;
          background-color: #A0BBDC;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.4s ease-out;
        }
        .input-wrapper:focus-within .input-underline::after {
          transform: scaleX(1);
          background-image: linear-gradient(to right, #052659, #5483B3);
        }
        
        /* Ocultar pestañas en pantallas grandes */
        @media (min-width: 1024px) {
          .mobile-tabs {
            display: none !important;
          }
          .tab-content {
            display: block !important;
          }
        }
      `}</style>

      <main className="flex items-center justify-center min-h-screen bg-[#C1E8FF]/40 p-4 md:p-8">
        <div className="relative w-full max-w-6xl flex rounded-2xl shadow-2xl overflow-hidden">
          
          {/* --- PANEL IZQUIERDO: Información (Solo en pantallas grandes) --- */}
          <div className="hidden lg:flex flex-col justify-center w-2/5 p-12 bg-[#052659] animate-slideInLeft">
            <h1 className="text-5xl font-bold text-[#C1E8FF] mb-6">
              Únete a Nosotros
            </h1>
            <p className="text-[#7DA0CA] text-lg mb-8">
              Crea tu cuenta para acceder a nuestra plataforma médica.
            </p>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-[#7DA0CA] rounded-full"></div>
                <span className="text-[#A0BBDC]">Cursos de preparación</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-[#C1E8FF] rounded-full"></div>
                <span className="text-[#A0BBDC]">Clases en Vivo</span>
              </div>
            </div>
          </div>

          {/* --- PANEL DERECHO: Formulario --- */}
          <div className="w-full lg:w-3/5 p-6 sm:p-8 lg:p-12 bg-white text-gray-800 animate-slideInRight">
            
            {/* Header */}
            <div className="text-center mb-8">
              <Image
                src="/icons/1.png" // Cambiado a una versión para fondo claro
                alt="DOCTEMIA MC Logo"
                width={240}
                height={70}
                priority
                className="mx-auto mb-4"
              />
              <h2 className="text-2xl lg:text-3xl font-bold text-[#052659] mb-2">Crear Cuenta</h2>
              <p className="text-gray-500 text-sm lg:text-base">Completa todos los campos para registrarte</p>
            </div>

            {/* Sistema de Pestañas (Solo móviles) */}
            <div className="mobile-tabs mb-8 lg:hidden">
              <div className="flex justify-center space-x-1 bg-gray-200 p-1 rounded-xl">
                <button
                  onClick={() => setActiveTab(1)}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold text-sm transition-all duration-300 ${
                    activeTab === 1 
                      ? 'bg-gradient-to-r from-[#052659] to-[#5483B3] text-white' 
                      : 'text-gray-500 hover:text-[#052659]'
                  }`}
                >
                  Datos Personales
                </button>
                <button
                  onClick={() => setActiveTab(2)}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold text-sm transition-all duration-300 ${
                    activeTab === 2 
                      ? 'bg-gradient-to-r from-[#052659] to-[#5483B3] text-white' 
                      : 'text-gray-500 hover:text-[#052659]'
                  }`}
                >
                  Datos Académicos
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Pestaña 1: Información Personal (Móviles) / Parte 1 (Desktop) */}
              <div className={`tab-content space-y-6 ${activeTab === 1 ? 'block' : 'hidden'} lg:block`}>
                
                {/* Título para desktop */}
                <h3 className="hidden lg:block text-xl font-semibold text-[#052659] mb-4 border-b border-gray-300 pb-2">
                  Información Personal
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Nombre completo */}
                  <div className="relative input-wrapper">
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-500 mb-2">
                      Nombre Completo
                    </label>
                    <input
                      id="fullName"
                      name="fullName"
                      placeholder="Ej: Juan Pérez"
                      value={form.fullName}
                      onChange={handleChange}
                      className="w-full bg-transparent border-b-2 border-gray-300 pb-2 outline-none text-gray-800 transition-colors duration-300 focus:border-transparent placeholder:text-gray-400"
                      aria-label="Nombre completo"
                    />
                    <span className="input-underline"></span>
                  </div>

                  {/* Fecha de Nacimiento */}
                  <div className="relative input-wrapper">
                    <label htmlFor="fechaNacimiento" className="block text-sm font-medium text-gray-500 mb-2">
                      Fecha de Nacimiento
                    </label>
                    <input
                      id="fechaNacimiento"
                      name="fechaNacimiento"
                      type="date"
                      value={form.fechaNacimiento}
                      onChange={handleChange}
                      className="w-full bg-transparent border-b-2 border-gray-300 pb-2 outline-none text-gray-800 transition-colors duration-300 focus:border-transparent appearance-none"
                      aria-label="Fecha de Nacimiento"
                    />
                    <span className="input-underline"></span>
                  </div>

                  {/* Sexo */}
                  <div className="relative input-wrapper">
                    <label htmlFor="sexo" className="block text-sm font-medium text-gray-500 mb-2">
                      Sexo
                    </label>
                    <select
                      id="sexo"
                      name="sexo"
                      value={form.sexo}
                      onChange={handleChange}
                      className="w-full bg-transparent border-b-2 border-gray-300 pb-2 outline-none text-gray-800 transition-colors duration-300 focus:border-transparent appearance-none"
                      aria-label="Sexo"
                    >
                      <option value="" disabled className="bg-white">Selecciona tu sexo</option>
                      <option value="Masculino" className="bg-white">Masculino</option>
                      <option value="Femenino" className="bg-white">Femenino</option>
                      <option value="Prefiero no decirlo" className="bg-white">Prefiero no decirlo</option>
                    </select>
                    <span className="input-underline"></span>
                  </div>

                  {/* Teléfono */}
                  <div className="relative input-wrapper">
                    <label htmlFor="telefono" className="block text-sm font-medium text-gray-500 mb-2">
                      Teléfono
                    </label>
                    <input
                      id="telefono"
                      name="telefono"
                      placeholder="Ej: 71234567"
                      value={form.telefono}
                      onChange={handleChange}
                      className="w-full bg-transparent border-b-2 border-gray-300 pb-2 outline-none text-gray-800 transition-colors duration-300 focus:border-transparent placeholder:text-gray-400"
                      aria-label="Teléfono"
                    />
                    <span className="input-underline"></span>
                  </div>

                </div>

                {/* Botón Siguiente (Solo móviles) */}
                <div className="flex justify-end mt-8 lg:hidden">
                  <button
                    type="button"
                    onClick={handleNextTab}
                    className="px-8 py-3 font-bold rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
                    style={{
                      background: 'linear-gradient(to right, #052659, #5483B3)',
                      color: 'white',
                    }}
                  >
                    Siguiente →
                  </button>
                </div>
              </div>

              {/* Pestaña 2: Datos Académicos (Móviles) / Parte 2 (Desktop) */}
              <div className={`tab-content space-y-6 ${activeTab === 2 ? 'block' : 'hidden'} lg:block`}>
                
                {/* Título para desktop */}
                <h3 className="hidden lg:block text-xl font-semibold text-[#052659] mb-4 border-b border-gray-300 pb-2">
                  Información Académica
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Universidad */}
                  <div className="relative input-wrapper">
                    <label htmlFor="universidad" className="block text-sm font-medium text-gray-500 mb-2">
                      Universidad
                    </label>
                    <input
                      id="universidad"
                      name="universidad"
                      placeholder="Ej: UMSA"
                      value={form.universidad}
                      onChange={handleChange}
                      className="w-full bg-transparent border-b-2 border-gray-300 pb-2 outline-none text-gray-800 transition-colors duration-300 focus:border-transparent placeholder:text-gray-400"
                      aria-label="Universidad"
                    />
                    <span className="input-underline"></span>
                  </div>

                  {/* Profesión / Cargo */}
                  <div className="relative input-wrapper">
                    <label htmlFor="profesion" className="block text-sm font-medium text-gray-500 mb-2">
                      Profesión / Cargo
                    </label>
                    <input
                      id="profesion"
                      name="profesion"
                      placeholder="Ej: Estudiante de Medicina"
                      value={form.profesion}
                      onChange={handleChange}
                      className="w-full bg-transparent border-b-2 border-gray-300 pb-2 outline-none text-gray-800 transition-colors duration-300 focus:border-transparent placeholder:text-gray-400"
                      aria-label="Profesión o Cargo"
                    />
                    <span className="input-underline"></span>
                  </div>

                  {/* Fecha de Examen */}
                  <div className="relative input-wrapper">
                    <label htmlFor="fechaExamen" className="block text-sm font-medium text-gray-500 mb-2">
                      Fecha de Examen
                    </label>
                    <input
                      id="fechaExamen"
                      name="fechaExamen"
                      type="date"
                      value={form.fechaExamen}
                      onChange={handleChange}
                      className="w-full bg-transparent border-b-2 border-gray-300 pb-2 outline-none text-gray-800 transition-colors duration-300 focus:border-transparent appearance-none"
                      aria-label="Fecha de Examen"
                    />
                    <span className="input-underline"></span>
                  </div>

                  {/* Correo electrónico */}
                  <div className="relative input-wrapper">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-500 mb-2">
                      Correo Electrónico
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Ej: juan.perez@example.com"
                      value={form.email}
                      onChange={handleChange}
                      className="w-full bg-transparent border-b-2 border-gray-300 pb-2 outline-none text-gray-800 transition-colors duration-300 focus:border-transparent placeholder:text-gray-400"
                      aria-label="Correo electrónico"
                    />
                    <span className="input-underline"></span>
                  </div>

                </div>

                {/* Contraseña (ancho completo) */}
                <div className="relative input-wrapper">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-500 mb-2">
                    Contraseña
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Ingresa tu contraseña"
                    value={form.password}
                    onChange={handleChange}
                    className="w-full bg-transparent border-b-2 border-gray-300 pb-2 outline-none text-gray-800 transition-colors duration-300 focus:border-transparent placeholder:text-gray-400"
                    aria-label="Contraseña"
                  />
                  <span className="input-underline"></span>
                </div>

                {/* Botones de navegación */}
                <div className="flex justify-between items-center mt-8">
                  {/* Botón Anterior (Solo móviles) */}
                  <button
                    type="button"
                    onClick={() => setActiveTab(1)}
                    className="lg:hidden px-6 py-3 font-semibold text-gray-500 hover:text-[#052659] transition-all duration-300 hover:bg-gray-200 rounded-lg"
                  >
                    ← Anterior
                  </button>
                  
                  {/* Espaciador para desktop */}
                  <div className="hidden lg:block"></div>
                  
                  {/* Botón Crear Cuenta */}
                  <button
                    type="submit"
                    className="px-8 py-3 font-bold rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-blue-900/30"
                    style={{
                      background: 'linear-gradient(to right, #052659, #5483B3)',
                      color: 'white',
                    }}
                  >
                    Crear Cuenta
                  </button>
                </div>
              </div>

            </form>

            {/* Enlace para volver al login */}
            <div className="text-center mt-8">
              <p className="text-sm text-gray-500">
                ¿Ya tienes una cuenta?{' '}
                <button
                  type="button"
                  onClick={goToLogin}
                  className="font-semibold text-[#052659] hover:text-[#5483B3] transition-colors duration-300"
                >
                  Inicia Sesión
                </button>
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
