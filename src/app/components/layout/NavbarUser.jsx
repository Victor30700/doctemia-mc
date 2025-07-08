'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
// Importamos los iconos de Lucide React para un look moderno y consistente
import {
  Home,
  Star,
  ShoppingBag,
  FileText,
  Video,
  UserCircle,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  BookmarkCheck
} from 'lucide-react';

export default function NavbarUser({ children }) {
  const { user, signOut } = useAuth();
  const { isDark, toggleTheme, isLoaded } = useTheme();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // --- ESTRUCTURA DE NAVEGACIÓN LÓGICA Y CONDICIONAL ---
  const navItems = useMemo(() => [
    { href: '/app', label: 'Inicio', Icon: Home },
    { type: 'separator', label: 'Mis Cursos' },
    { href: '/app/courses', label: 'Cursos Premium', Icon: Star },
    // El siguiente enlace es para los cursos que el usuario ya ha pagado (del modelo premium)
    { href: '/app/courses/cursosPagados', label: 'Mis Cursos Premium', Icon: BookmarkCheck },
    // Este enlace solo aparece si el admin ha concedido el permiso `hasPagoUnicoAccess` al usuario.
    { href: '/app/coursesPagoUnico', label: 'Mis Cursos Pago Unico', Icon: BookmarkCheck },
    { type: 'separator', label: 'Herramientas' },
    { href: '/app/examen-test', label: 'Exámenes', Icon: FileText },
    { href: '/app/clases-en-vivo', label: 'Clases en Vivo', Icon: Video },
    { type: 'separator', label: 'Cuenta' },
    { href: '/app/profile', label: 'Mi Perfil', Icon: UserCircle },
  ].filter(Boolean), [user]); // .filter(Boolean) elimina los elementos falsos (como el enlace condicional si el permiso no existe)

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(o => !o);

  const headerBg = isDark ? 'bg-gray-800 text-gray-100 border-gray-700' : 'bg-white text-gray-900 border-gray-200';
  const sidebarBg = isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const mainBg = isDark ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900';

  if (!isLoaded) {
    return (
      <div className={`${mainBg} min-h-screen`}>
        <div className={`animate-pulse h-16 w-full ${isDark ? 'bg-gray-800' : 'bg-white'}`}></div>
      </div>
    );
  }

  return (
    <>
      {isMobile && isSidebarOpen && <div className="fixed inset-0 bg-black/60 z-30" onClick={toggleSidebar}></div>}

      <header className={`fixed top-0 left-0 w-full flex justify-between items-center px-4 py-3 border-b z-40 shadow-sm transition-colors ${headerBg}`}>
        <div className="flex items-center gap-4">
          <button className="cursor-pointer p-2" onClick={toggleSidebar}>
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <div className="flex items-center gap-2">
            <img src="/icons/udemy.png" alt="logo" className="w-7" />
            <span className="font-bold text-lg">DOCTEMIA MC</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={toggleTheme} className={`p-2 rounded-lg transition ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}>
            {isDark ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
          </button>
          {user && (
            <>
              <Link href="/app/profile" className="hidden sm:block">
                <img src={user.photoURL || '/icons/user.jpg'} alt="user" className={`w-9 h-9 rounded-full border-2 transition-all hover:border-indigo-500 ${isDark ? 'border-gray-600' : 'border-gray-200'}`} />
              </Link>
              <button onClick={signOut} className={`hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${isDark ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}>
                <LogOut className="w-4 h-4" />
                <span>Salir</span>
              </button>
              <button onClick={signOut} className={`sm:hidden p-2 rounded-lg transition ${isDark ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}>
                <LogOut className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </header>

      <aside className={`fixed top-0 left-0 h-full pt-16 border-r shadow-lg transition-transform duration-300 ease-in-out ${sidebarBg}`} style={{ transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)', width: '16rem', zIndex: 35 }}>
        <nav className="flex-grow overflow-y-auto overflow-x-hidden mt-4">
          <ul className="space-y-1 px-2">
            {navItems.map((item, index) => {
              if (item.type === 'separator') {
                return (
                  <li key={index} className="px-2 pt-4 pb-1">
                    <span className="text-xs font-bold uppercase text-gray-500">{item.label}</span>
                  </li>
                );
              }
              const active = pathname === item.href || (item.href !== '/app' && pathname.startsWith(item.href));
              return (
                <li key={`${item.href}-${item.label}`}>
                  <Link href={item.href} className={`flex items-center gap-4 px-2 py-2.5 rounded-lg transition-colors duration-200 ${active ? (isDark ? 'bg-indigo-900/40 text-indigo-300' : 'bg-indigo-100 text-indigo-600') : (isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700')}`}>
                    <item.Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="truncate font-medium">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      <main className={`pt-16 transition-all duration-300 ease-in-out min-h-screen ${mainBg}`} style={{ paddingLeft: isMobile ? '0' : (isSidebarOpen ? '16rem' : '0') }}>
        {children}
      </main>
    </>
  );
}
