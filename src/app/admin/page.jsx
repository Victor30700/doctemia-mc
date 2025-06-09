//src/app/admin/page.jsx
'use client';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

export default function AdminHomePage() {
  const { user } = useAuth();
  const { isDark, isLoaded } = useTheme();

  if (!isLoaded) {
    return (
      <section className="min-h-screen flex items-center justify-center">
        <div 
          className="p-8 rounded-lg shadow-lg"
          style={{ 
            backgroundColor: isDark ? '#1f2937' : '#ffffff',
            color: isDark ? '#f9fafb' : '#111827'
          }}
        >
          <p className="text-lg animate-pulse">
            Cargando...
          </p>
        </div>
      </section>
    );
  }

  const cardItems = [
    { 
      href: '/admin', 
      title: 'Página Principal', 
      desc: 'Accede a la página principal del administrador',
      icon: '🏠'
    },
    { 
      href: '/admin/courses', 
      title: 'Cursos', 
      desc: 'Gestiona y administra los cursos disponibles',
      icon: '📚'
    },
    { 
      href: '/admin/users', 
      title: 'Usuarios', 
      desc: 'Administra los usuarios registrados',
      icon: '👥'
    },
    { 
      href: '/admin/bank-preguntas', 
      title: 'Exámenes', 
      desc: 'Gestiona el banco de preguntas y exámenes',
      icon: '📝'
    },
    { 
      href: '/admin/solicitudes', 
      title: 'Solicitudes', 
      desc: 'Revisa y gestiona las solicitudes pendientes',
      icon: '💼'
    },
    { 
      href: '/admin/live-classes', 
      title: 'Clases en Vivo', 
      desc: 'Administra las clases en tiempo real',
      icon: '🎥'
    }
  ];

  return (
    <section className="px-4 py-6 md:px-6 min-h-screen transition-all duration-300">
      {/* Header Section */}
      <div 
        className="mb-8 p-6 rounded-xl shadow-sm border transition-all duration-300"
        style={{
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
          borderColor: isDark ? '#374151' : '#e5e7eb'
        }}
      >
        <h1 
          className="text-3xl md:text-4xl font-bold mb-3"
          style={{ color: isDark ? '#f9fafb' : '#111827' }}
        >
          Panel de Administración
        </h1>
        <p 
          className="text-lg"
          style={{ color: isDark ? '#d1d5db' : '#6b7280' }}
        >
          Bienvenido, <span className="font-semibold">{user?.email}</span>
        </p>
      </div>

      {/* Cards Grid */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {cardItems.map(({ href, title, desc, icon }) => (
          <Link
            key={href}
            href={href}
            className="group block transform transition-all duration-200 hover:scale-105"
          >
            <div
              className="p-6 rounded-xl shadow-lg border transition-all duration-300 hover:shadow-xl"
              style={{
                backgroundColor: isDark ? '#1f2937' : '#ffffff',
                borderColor: isDark ? '#374151' : '#e5e7eb'
              }}
            >
              <div className="flex items-center mb-4">
                <span className="text-3xl mr-3">{icon}</span>
                <h2 
                  className="text-xl font-semibold group-hover:underline"
                  style={{ color: isDark ? '#f9fafb' : '#111827' }}
                >
                  {title}
                </h2>
              </div>
              <p 
                className="text-sm leading-relaxed"
                style={{ color: isDark ? '#d1d5db' : '#6b7280' }}
              >
                {desc}
              </p>
              
              {/* Hover indicator */}
              <div 
                className="mt-4 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                style={{ color: isDark ? '#60a5fa' : '#3b82f6' }}
              >
                Acceder →
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Statistics Section */}
      <div 
        className="mt-12 p-6 rounded-xl shadow-sm border transition-all duration-300"
        style={{
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
          borderColor: isDark ? '#374151' : '#e5e7eb'
        }}
      >
        <h3 
          className="text-2xl font-semibold mb-4"
          style={{ color: isDark ? '#f9fafb' : '#111827' }}
        >
          Estado del Sistema
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div 
            className="p-4 rounded-lg border"
            style={{
              backgroundColor: isDark ? '#374151' : '#f9fafb',
              borderColor: isDark ? '#4b5563' : '#e5e7eb'
            }}
          >
            <div 
              className="text-2xl font-bold"
              style={{ color: isDark ? '#10b981' : '#059669' }}
            >
              Online
            </div>
            <div 
              className="text-sm"
              style={{ color: isDark ? '#d1d5db' : '#6b7280' }}
            >
              Sistema funcionando
            </div>
          </div>
          
          <div 
            className="p-4 rounded-lg border"
            style={{
              backgroundColor: isDark ? '#374151' : '#f9fafb',
              borderColor: isDark ? '#4b5563' : '#e5e7eb'
            }}
          >
            <div 
              className="text-2xl font-bold"
              style={{ color: isDark ? '#f59e0b' : '#d97706' }}
            >
              {new Date().toLocaleDateString()}
            </div>
            <div 
              className="text-sm"
              style={{ color: isDark ? '#d1d5db' : '#6b7280' }}
            >
              Fecha actual
            </div>
          </div>
          
          <div 
            className="p-4 rounded-lg border"
            style={{
              backgroundColor: isDark ? '#374151' : '#f9fafb',
              borderColor: isDark ? '#4b5563' : '#e5e7eb'
            }}
          >
            <div 
              className="text-2xl font-bold"
              style={{ color: isDark ? '#8b5cf6' : '#7c3aed' }}
            >
              Admin
            </div>
            <div 
              className="text-sm"
              style={{ color: isDark ? '#d1d5db' : '#6b7280' }}
            >
              Rol actual
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}