//src/app/admin/layout.jsx
'use client';
import { useEffect } from 'react';
import { useAuth } from 'src/context/AuthContext';
import { useRouter } from 'next/navigation';
import AdminNavbar from '@/app/components/layout/AdminNavbar';


export default function AdminLayout({ children }) {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const logoutAndRedirect = async () => {
      if (!loading) {
        if (!user) {
          try {
            // Llamar a la API de logout para limpiar cookies residuales (__session)
            await fetch('/api/logout', { method: 'POST' });
          } catch (error) {
            console.error('Error al limpiar sesión:', error);
          } finally {
            // Redirigir al login después de intentar limpiar la sesión
            router.replace('/login');
          }
          return;
        }

        const isAdmin = role === 'admin';
        if (!isAdmin) return router.replace('/app');
      }
    };

    logoutAndRedirect();
  }, [loading, user, role, router]);

  // Loading state con soporte para modo oscuro
  if (loading || !user) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 text-lg font-medium">
            {loading ? 'Cargando...' : 'Limpiando sesión e iniciando redirección al login...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">

        <AdminNavbar>{children}</AdminNavbar>

    </div>
  );
}