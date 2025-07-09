'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebase'; // Asegúrate que la ruta sea correcta
import Swal from 'sweetalert2';
import Image from 'next/image'; // Importar el componente Image de Next.js

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Autenticar con Firebase en el cliente
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Obtener el ID Token del usuario
      const idToken = await user.getIdToken(true); // Forzar refresco para obtener claims actualizados

      // 3. Llamar a la API backend para verificar estado, rol y establecer cookies
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`, // Enviar token en el header (opcional, pero buena práctica)
        },
        body: JSON.stringify({ token: idToken }), // O enviar solo en el body
      });

      const data = await response.json();

      if (!response.ok) {
        // La API retornó un error (ej: usuario inactivo, no encontrado, token inválido)
        throw new Error(data.error || 'Error en el servidor durante el login');
      }

      // 4. Si la API fue exitosa (usuario activo, cookies establecidas)
      // await Swal.fire({
      //   icon: 'success',
      //   title: '¡Bienvenido!',
      //   text: 'Has iniciado sesión correctamente.',
      //   timer: 1200,
      //   showConfirmButton: false,
      //   background: '#1f2937', // Fondo oscuro para la alerta
      //   color: '#f9fafb', // Texto claro para la alerta
      //   confirmButtonColor: '#3b82f6',
      // });

      // 5. Redirigir basado en el rol devuelto por la API
      router.replace(data.role === 'admin' ? '/admin' : '/app');

    } catch (err) {
      // Captura errores de Firebase Auth o de la llamada a la API
      let errorMessage = 'Ocurrió un error inesperado.';
      if (err.code) { // Error de Firebase Auth
        switch (err.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential': // Nueva versión de Firebase SDK
            errorMessage = 'Correo o contraseña incorrectos.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'El formato del correo es inválido.';
            break;
          default:
            errorMessage = 'Error de autenticación: ' + err.message;
        }
      } else { // Error de la API u otro error
        errorMessage = err.message;
      }
      await Swal.fire({
        title: 'Error de Inicio de Sesión',
        text: errorMessage,
        icon: 'error',
        background: '#1f2937', // Fondo oscuro para la alerta
        color: '#f9fafb', // Texto claro para la alerta
        confirmButtonColor: '#3b82f6',
      });
    } finally {
      setLoading(false);
    }
  };

  const goToRegister = () => {
    router.push('/register');
  };

  return (
    // Contenedor principal con el fondo de imagen y altura completa
    <div
      className="relative flex flex-col items-center justify-center min-h-screen bg-cover bg-center"
      style={{ backgroundImage: "url('/images/fondoLogin.png')" }}
    >
      {/* Overlay oscuro para mejorar la legibilidad del contenido */}
      <div className="absolute inset-0 bg-black opacity-60 z-0"></div>

      {/* Contenido principal: Logo, Formulario y Texto de Bienvenida */}
      <div className="relative z-10 w-full h-full flex flex-col md:flex-row items-center justify-center p-4 md:p-8 lg:p-12 max-w-screen-xl mx-auto">
        
        {/* Sección Izquierda: Formulario de Login */}
        <div className="bg-gray-900/80 p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-sm md:max-w-md border border-purple-700/50 transform transition-transform duration-300 hover:scale-105 md:mr-8 lg:mr-16 mb-8 md:mb-0"
             style={{boxShadow: '0 0 30px rgba(128, 0, 128, 0.5), 0 0 60px rgba(79, 70, 229, 0.3)'}}>
          
          {/* Logo del sistema dentro del formulario */}
          <div className="text-center mb-6">
            <Image
              src="/icons/1-oscuro.png" // Logo para modo oscuro (letras claras)
              alt="DOCTEMIA MC Logo"
              width={160}
              height={48}
              priority
              className="mx-auto"
            />
          </div>

          

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 w-full p-3.5 border border-purple-600/50 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:ring-purple-500 focus:border-purple-500 transition duration-200 ease-in-out"
                placeholder="correo@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 w-full p-3.5 border border-purple-600/50 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:ring-purple-500 focus:border-purple-500 transition duration-200 ease-in-out"
                placeholder="password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3.5 rounded-full shadow-lg transition duration-200 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{boxShadow: '0 5px 15px rgba(128, 0, 128, 0.4)'}}
            >
              {loading ? 'Cargando...' : 'Ingresar'}
            </button>
          </form>

          <div className="text-center mt-5">
            <p className="text-sm text-gray-400">
              ¿No tienes cuenta?{' '}
              <button
                type="button"
                onClick={goToRegister}
                className="font-medium text-purple-400 hover:underline hover:text-purple-300 transition duration-200 ease-in-out"
              >
                Regístrate
              </button>
            </p>
          </div>
        </div>

        {/* Sección Derecha: Texto de Bienvenida */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
            Iniciar sesion
          </h2>
          <h1 className="text-2xl font-extrabold text-center text-white mb-6 tracking-wide">
            Welcome
          </h1>
          <button
            type="button"
            onClick={goToRegister} // Reutilizamos goToRegister para el botón "Sign up now"
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold rounded-full shadow-lg hover:from-blue-700 hover:to-cyan-600 transition duration-200 ease-in-out transform hover:scale-105"
            style={{boxShadow: '0 5px 15px rgba(59, 130, 246, 0.4)'}}
          >
            Regístrate ahora
          </button>
        </div>
      </div>
    </div>
  );
}
