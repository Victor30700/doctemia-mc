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
    if (!loading) {
      if (!user) {
        const timeout = setTimeout(() => {
          router.replace('/login');
        }, 1000);
        return () => clearTimeout(timeout);
      }
      const isAdmin = role === 'admin';
      if (!isAdmin) return router.replace('/app');
    }
  }, [loading, user, role, router]);

  // Loading state con soporte para modo oscuro
  if (loading || !user) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 text-lg font-medium">
            Cargando...
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