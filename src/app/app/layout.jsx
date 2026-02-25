// src/app/app/layout.jsx
'use client';
import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import NavbarUser from '@/app/components/layout/NavbarUser';  // <-- Importa NavbarUser aquí

export default function UserLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const logoutAndRedirect = async () => {
      if (!loading && !user) {
        try {
          // Llamar a la API de logout para limpiar cookies residuales (__session)
          await fetch('/api/logout', { method: 'POST' });
        } catch (error) {
          console.error('Error al limpiar sesión:', error);
        } finally {
          // Redirigir al login después de intentar limpiar la sesión
          router.replace('/login');
        }
      }
    };

    logoutAndRedirect();
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Cargando...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600 font-medium">
          Limpiando sesión e iniciando redirección al login...
        </p>
      </div>
    );
  }

  // Aquí sí existe NavbarUser, porque lo has importado arriba
  return <NavbarUser>{children}</NavbarUser>;
}
