'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
// Importa los iconos de react-icons, incluyendo los nuevos iconos premium
import {
  AiOutlineHome,
  AiOutlineFile,
  AiOutlineFileText,
  AiOutlineQuestionCircle,
  AiOutlineVideoCamera,
  AiOutlineUser,
  AiOutlineLogout,
  AiFillStar,      // <-- Icono Premium para Cursos
  AiFillUnlock     // <-- Icono Premium para Mis Cursos
} from 'react-icons/ai';

const navItems = [
  { href: '/app', label: 'Inicio', Icon: AiOutlineHome },
  { href: '/app/courses', label: 'Cursos Premiun', Icon: AiFillStar }, // <-- Icono actualizado
  { href: '/app/courses/cursosPagados', label: 'Mis Cursos Premiun', Icon: AiFillUnlock }, // <-- Icono actualizado
 
  //------------NEW-------------------------------------
  { href: '/app/courses', label: 'Cursos', Icon: AiOutlineFile },
  { href: '/app/courses/cursosPagados', label: 'Mis Cursos', Icon: AiOutlineFileText },
  //------------NEW-------------------------------------
  
  { href: '/app/examen-test', label: 'Exámenes', Icon: AiOutlineQuestionCircle },
  { href: '/app/clases-en-vivo', label: 'Clases en Vivo', Icon: AiOutlineVideoCamera },
  { href: '/app/profile', label: 'Perfil', Icon: AiOutlineUser },
];

export default function NavbarUser({ children }) {
  const { user, signOut } = useAuth();
  const { isDark, toggleTheme, isLoaded } = useTheme();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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

  const headerBg = isDark
    ? 'bg-gray-800 text-gray-100 border-gray-700'
    : 'bg-white text-gray-900 border-gray-200';
  const sidebarBg = isDark
    ? 'bg-gray-800 border-gray-700'
    : 'bg-white border-gray-200';
  const mainBg = isDark
    ? 'bg-gray-900 text-gray-100'
    : 'bg-gray-50 text-gray-900';

  if (!isLoaded) {
    return (
      <div className={`${mainBg} min-h-screen`}>
        <div className="animate-pulse h-16 w-full"></div>
      </div>
    );
  }

  return (
    <>
      {isMobile && isSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-30" onClick={toggleSidebar}></div>
      )}

      <header className={`fixed top-0 left-0 w-full flex justify-between items-center px-4 py-3 border-b z-40 shadow-sm transition-colors ${headerBg}`}>
        <div className="flex items-center gap-4">
          <button className="cursor-pointer p-2" onClick={toggleSidebar}>
            <div className={`w-6 h-0.5 mb-1 transition-all duration-300 ${isDark ? 'bg-gray-300' : 'bg-gray-600'} ${isSidebarOpen ? 'rotate-45 translate-y-1.5' : ''}`}></div>
            <div className={`w-6 h-0.5 transition-all duration-300 ${isDark ? 'bg-gray-300' : 'bg-gray-600'} ${isSidebarOpen ? 'opacity-0' : ''}`}></div>
            <div className={`w-6 h-0.5 mt-1 transition-all duration-300 ${isDark ? 'bg-gray-300' : 'bg-gray-600'} ${isSidebarOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></div>
          </button>
          <div className="flex items-center gap-2">
            <img src="/icons/udemy.png" alt="logo" className="w-7" />
            <span className="font-bold text-lg">DOCTEMIA MC</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={toggleTheme} className={`p-2 rounded-lg transition ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
            {isDark ? '🌞' : '🌜'}
          </button>
          {user && !isMobile && (
            <>
              <Link href="/app/profile" className="flex items-center gap-2">
              <img src={user.photoURL || '/icons/user.jpg'} alt="user" className={`w-8 h-8 rounded-full border-2 ${isDark ? 'border-gray-600' : 'border-gray-200'}`} />
              </Link>
              
              <button onClick={signOut} className={`px-4 py-2 rounded-lg font-medium transition ${isDark ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
                Cerrar sesión
              </button>
            </>
          )}
          {user && isMobile && (
            <button onClick={signOut} className={`p-2 rounded-lg transition ${isDark ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}>
              <AiOutlineLogout className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      <aside className={`fixed top-0 left-0 h-full pt-16 border-r shadow-lg transition-width duration-300 ${sidebarBg}`} style={{ width: isSidebarOpen ? '16rem' : '4rem', zIndex: isMobile ? 35 : 20 }}>
        <nav className="flex-grow overflow-y-auto overflow-x-hidden mt-4">
          <ul className="space-y-1 px-2">
            {navItems.map(({ href, label, Icon }) => {
              const active = pathname === href || (href !== '/app' && pathname.startsWith(href));
              return (
                <li key={`${href}-${label}`}>
                  <Link href={href} className={`flex items-center gap-4 px-2 py-2.5 rounded-lg transition-colors duration-200 ${active ? (isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600') : (isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700')}`}>
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {isSidebarOpen && <span className="truncate font-medium">{label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      <main className={`pt-16 transition-all duration-300 ease-in-out min-h-screen ${mainBg}`} style={{ paddingLeft: isMobile ? '4rem' : (isSidebarOpen ? '16rem' : '4rem') }}>
        {children}
      </main>
    </>
  );
}
