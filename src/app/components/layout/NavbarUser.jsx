'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
// --- ✅ MEJORA: Se importa el icono ChevronDown para el desplegable ---
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
  BookmarkCheck,
  ChevronDown,
  BookMarked
} from 'lucide-react';

export default function NavbarUser({ children }) {
  const { user, signOut } = useAuth();
  const { isDark, toggleTheme, isLoaded } = useTheme();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  // --- ✅ MEJORA: Estado para controlar el menú desplegable ---
  const [openDropdown, setOpenDropdown] = useState(null);

  // --- ✅ MEJORA: Estructura de navegación con sub-menús ---
  const navItems = useMemo(() => [
    { href: '/app', label: 'Inicio', Icon: Home },
    { type: 'separator', label: 'Contenido' },

  //Descomentar estqa linea para acceder a cursos premiun----------------------------------------------
/*
    {
      type: 'dropdown',
      label: 'Cursos Premium',
      Icon: Star,
      subItems: [
        { href: '/app/courses', label: 'Catálogo Premium', Icon: ShoppingBag },
        { href: '/app/cursosPagados', label: 'Mis Cursos Adquiridos', Icon: BookmarkCheck },
      ]
    },
*/
 //Descomentar estqa linea para acceder a cursos premiun----------------------------------------------

    /*user?.hasPagoUnicoAccess &&*/ 
    /* Se modifico el nombre de la carpeta coursesPagoUnico a pagoUnicoCourses
    no puede comenzar dos carpetas con la misma palabra porque se van a activar las dos en el sidebar*/
    { href: '/app/pagoUnicoCourses', label: 'Cursos', Icon: BookMarked },
    { type: 'separator', label: 'Herramientas' },
    { href: '/app/examen-test', label: 'Exámenes', Icon: FileText },
    { href: '/app/clases-en-vivo', label: 'Clases en Vivo', Icon: Video },
    { type: 'separator', label: 'Cuenta' },
    { href: '/app/profile', label: 'Mi Perfil', Icon: UserCircle },
  ].filter(Boolean), [user]);

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
  
  // Efecto para abrir el dropdown si una de sus rutas secundarias está activa
  useEffect(() => {
     const activeDropdown = navItems.find(item => 
        item.type === 'dropdown' && item.subItems.some(sub => pathname.startsWith(sub.href))
     );
     if (activeDropdown) {
        setOpenDropdown(activeDropdown.label);
     }
  }, [pathname, navItems]);


  const toggleSidebar = () => setIsSidebarOpen(o => !o);
  
  const handleDropdownClick = (label) => {
    setOpenDropdown(openDropdown === label ? null : label);
  };

  // --- ✅ MEJORA: Nueva paleta de colores personalizada ---
  // Paleta de colores: #73C7E3, #FFF9F0, #24B0BA, #F0F2F2, #2E4A70, #CF8A40
  const headerBg = isDark 
    ? 'text-white border-gray-700' 
    : 'text-gray-900 border-gray-200';
  
  const sidebarBg = isDark 
    ? 'border-gray-700' 
    : 'border-gray-200';
  
  const mainBg = isDark 
    ? 'bg-gray-900 text-gray-100' 
    : 'text-gray-900';

  // Estilos dinámicos para el header con la nueva paleta
  const headerStyle = isDark
    ? { backgroundColor: '#2E4A70' } // Azul oscuro para modo oscuro
    : { backgroundColor: '#73C7E3' }; // Azul claro para modo claro

  // Estilos dinámicos para el sidebar con la nueva paleta
  const sidebarStyle = isDark
    ? { backgroundColor: '#2E4A70' } // Azul oscuro para modo oscuro
    : { backgroundColor: '#FFF9F0' }; // Crema para modo claro

  // Estilos dinámicos para el main con el fondo especificado
  const mainStyle = isDark
    ? { backgroundColor: '#2E4A70' } // Azul oscuro para modo oscuro
    : { backgroundColor: '#FFF9F0' }; // Crema para modo claro (fondo solicitado)

  if (!isLoaded) {
    return (
      <div className={`min-h-screen`} style={mainStyle}>
        <div className={`animate-pulse h-16 w-full`} style={headerStyle}></div>
      </div>
    );
  }

  return (
    <>
      {isMobile && isSidebarOpen && <div className="fixed inset-0 bg-black/60 z-30" onClick={toggleSidebar}></div>}

      <header 
        className={`fixed top-0 left-0 w-full flex justify-between items-center px-4 py-3 border-b z-40 shadow-sm transition-colors ${headerBg}`}
        style={headerStyle}
      >
        <div className="flex items-center gap-4">
          <button className="cursor-pointer p-2 hover:bg-white/10 rounded-lg transition-colors" onClick={toggleSidebar}>
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <div className="flex items-center gap-2">
            <img src="/icons/udemy.png" alt="logo" className="w-7" />
            <span className="font-bold text-lg">DOCTEMIA MC</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme} 
            className={`p-2 rounded-lg transition-all hover:bg-white/10`}
            style={{ backgroundColor: isDark ? '#24B0BA' : '#F0F2F2' }}
          >
            {isDark ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-700" />}
          </button>
          {user && (
            <>
              <Link href="/app/profile" className="hidden sm:block">
                <img 
                  src={user.photoURL || '/icons/user.png'} 
                  alt="user" 
                  className={`w-9 h-9 rounded-full border-2 transition-all hover:border-opacity-80`}
                  style={{ borderColor: isDark ? '#000000ff' : '#000000ff' }}
                />
              </Link>
              <button 
                onClick={signOut} 
                className={`hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all hover:opacity-90 text-white`}
                style={{ backgroundColor: '#d8220aff' }}
              >
                <LogOut className="w-4 h-4" />
                <span>Salir</span>
              </button>
              <button 
                onClick={signOut} 
                className={`sm:hidden p-2 rounded-lg transition-all hover:opacity-90 text-white`}
                style={{ backgroundColor: '#030303ff' }}
              >
                <LogOut className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </header>

      <aside 
        className={`fixed top-0 left-0 h-full pt-16 border-r shadow-lg transition-transform duration-300 ease-in-out ${sidebarBg}`} 
        style={{ 
          transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)', 
          width: '16rem', 
          zIndex: 35,
          ...sidebarStyle
        }}
      >
        <nav className="flex-grow overflow-y-auto overflow-x-hidden mt-4">
          <ul className="space-y-1 px-2">
            {navItems.map((item, index) => {
              if (item.type === 'separator') {
                return (
                  <li key={index} className="px-2 pt-4 pb-1">
                    <span 
                      className="text-xs font-bold uppercase"
                      style={{ color: isDark ? '#73C7E3' : '#2E4A70' }}
                    >
                      {item.label}
                    </span>
                  </li>
                );
              }
              
              // --- ✅ MEJORA: Lógica para renderizar el menú desplegable ---
              if (item.type === 'dropdown') {
                const isOpen = openDropdown === item.label;
                const isParentActive = item.subItems.some(sub => pathname.startsWith(sub.href));
                
                const buttonStyle = isParentActive && !isOpen 
                  ? { 
                      backgroundColor: isDark ? '#24B0BA' : '#73C7E3', 
                      color: isDark ? '#FFF9F0' : '#2E4A70' 
                    }
                  : { color: isDark ? '#FFF9F0' : '#2E4A70' };

                return (
                  <li key={item.label}>
                    <button 
                      onClick={() => handleDropdownClick(item.label)} 
                      className={`w-full flex items-center justify-between gap-4 px-2 py-2.5 rounded-lg transition-all duration-200 hover:opacity-80`}
                      style={buttonStyle}
                      onMouseEnter={(e) => {
                        if (!(isParentActive && !isOpen)) {
                          e.target.style.backgroundColor = isDark ? '#24B0BA' : '#F0F2F2';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!(isParentActive && !isOpen)) {
                          e.target.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <item.Icon className="w-5 h-5 flex-shrink-0" />
                        <span className="truncate font-medium">{item.label}</span>
                      </div>
                      <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isOpen && (
                      <ul className="pl-6 pt-1 space-y-1">
                        {item.subItems.map(subItem => {
                          const active = pathname.startsWith(subItem.href);
                          const subItemStyle = active 
                            ? { 
                                backgroundColor: isDark ? '#24B0BA' : '#73C7E3', 
                                color: isDark ? '#FFF9F0' : '#2E4A70' 
                              }
                            : { color: isDark ? '#F0F2F2' : '#2E4A70' };

                          return (
                            <li key={subItem.href}>
                              <Link 
                                href={subItem.href} 
                                className={`flex items-center gap-4 px-2 py-2 rounded-lg transition-all duration-200 text-sm hover:opacity-80`}
                                style={subItemStyle}
                                onMouseEnter={(e) => {
                                  if (!active) {
                                    e.target.style.backgroundColor = isDark ? '#24B0BA' : '#F0F2F2';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!active) {
                                    e.target.style.backgroundColor = 'transparent';
                                  }
                                }}
                              >
                                <subItem.Icon className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate font-medium">{subItem.label}</span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              }

              const active = pathname === item.href || (item.href !== '/app' && pathname.startsWith(item.href));
              const linkStyle = active 
                ? { 
                    backgroundColor: isDark ? '#24B0BA' : '#73C7E3', 
                    color: isDark ? '#FFF9F0' : '#2E4A70' 
                  }
                : { color: isDark ? '#FFF9F0' : '#2E4A70' };

              return (
                <li key={`${item.href}-${item.label}`}>
                  <Link 
                    href={item.href} 
                    className={`flex items-center gap-4 px-2 py-2.5 rounded-lg transition-all duration-200 hover:opacity-80`}
                    style={linkStyle}
                    onMouseEnter={(e) => {
                      if (!active) {
                        e.target.style.backgroundColor = isDark ? '#24B0BA' : '#F0F2F2';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        e.target.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <item.Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="truncate font-medium">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      <main 
        className={`pt-16 transition-all duration-300 ease-in-out min-h-screen ${mainBg}`} 
        style={{ 
          paddingLeft: isMobile ? '0' : (isSidebarOpen ? '16rem' : '0'),
          ...mainStyle
        }}
      >
        {children}
      </main>
    </>
  );
}