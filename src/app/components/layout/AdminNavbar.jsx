'use client';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useTheme } from '@/context/ThemeContext';
import {
  Moon, Sun, Home, BookOpen, FileText, Users,
  Wallet, Video, QrCode, Bell, LogOut
} from 'lucide-react';

export default function AdminNavbar({ children }) {
  const { signOut, user } = useAuth();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const { isDark, toggleTheme, isLoaded } = useTheme();
  const [isMobile, setIsMobile] = useState(false);

  // Hook para detectar si es vista móvil y ajustar el sidebar
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768; // Usamos 768px como punto de quiebre para móvil
      setIsMobile(mobile);
      // En desktop el sidebar está abierto por defecto, en móvil cerrado.
      if (!mobile) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleNotifications = () => setShowNotifications(!showNotifications);

  // Hook para obtener notificaciones de Firebase
  useEffect(() => {
    const fetchNotifications = async () => {
      if (user) {
        try {
          const snapshot = await getDocs(collection(db, 'solicitudes'));
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setNotifications(data);
        } catch (error) {
          console.error('Error fetching notifications:', error);
        }
      }
    };
    fetchNotifications();
  }, [user]);

  // Items de navegación del sidebar
  const navItems = [
    { href: '/admin', label: 'Inicio', icon: <Home className="w-5 h-5" /> },
    { href: '/admin/courses', label: 'Cursos', icon: <BookOpen className="w-5 h-5" /> },
    { href: '/admin/bank-preguntas', label: 'Exámenes', icon: <FileText className="w-5 h-5" /> },
    { href: '/admin/users', label: 'Usuarios', icon: <Users className="w-5 h-5" /> },
    { href: '/admin/solicitudes', label: 'Solicitudes', icon: <Wallet className="w-5 h-5" /> },
    { href: '/admin/live-classes', label: 'Clases en Vivo', icon: <Video className="w-5 h-5" /> },
    { href: '/admin/qr-gestion', label: 'QR', icon: <QrCode className="w-5 h-5" /> },
  ];

  // Estilos condicionales para el tema oscuro/claro
  const headerStyle = { backgroundColor: isDark ? '#1f2937' : '#ffffff', borderBottomColor: isDark ? '#374151' : '#e5e7eb', color: isDark ? '#f9fafb' : '#111827' };
  const sidebarStyle = { backgroundColor: isDark ? '#1f2937' : '#ffffff', borderRightColor: isDark ? '#374151' : '#e5e7eb' };
  const mainStyle = { backgroundColor: isDark ? '#111827' : '#f9fafb' };

  // Loading skeleton
  if (!isLoaded) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: isDark ? '#111827' : '#ffffff', color: isDark ? '#f9fafb' : '#111827' }}>
        <div className="animate-pulse">
          <div className="h-16" style={{ backgroundColor: isDark ? '#1f2937' : '#f3f4f6' }}></div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Fondo oscuro overlay para modo móvil */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-30" 
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Header */}
      <header className="border-b px-4 py-3 flex justify-between items-center fixed top-0 left-0 w-full z-40 shadow-sm transition-colors duration-200" style={headerStyle}>
        <div className="flex items-center gap-4">
          <div className="cursor-pointer" onClick={toggleSidebar}>
            <div className={`w-6 h-0.5 mb-1 transition-all duration-300 ${isDark ? 'bg-gray-300' : 'bg-gray-600'} ${isSidebarOpen ? 'rotate-45 translate-y-1.5' : ''}`}></div>
            <div className={`w-6 h-0.5 transition-all duration-300 ${isDark ? 'bg-gray-300' : 'bg-gray-600'} ${isSidebarOpen ? 'opacity-0' : ''}`}></div>
            <div className={`w-6 h-0.5 mt-1 transition-all duration-300 ${isDark ? 'bg-gray-300' : 'bg-gray-600'} ${isSidebarOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></div>
          </div>
          <div className="flex items-center gap-1">
            <img src="/icons/udemy.png" alt="logo" className="w-7" />
            <span className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-800'}`}>DOCTEMIA MC</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={toggleTheme} className={`p-2 rounded-lg transition-all duration-200 ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}>
            {isDark ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-gray-700" />}
          </button>
          <button onClick={toggleNotifications} className={`relative p-2 rounded-lg transition-all duration-200 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
            <Bell className={`w-6 h-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
            {notifications.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">{notifications.length > 9 ? '9+' : notifications.length}</span>}
          </button>
          {!isMobile && user && (
            <>
              <img src={user.photoURL || "/icons/user.jpg"} alt="user" className={`w-8 h-8 rounded-full border-2 ${isDark ? 'border-gray-600' : 'border-gray-200'}`} />
              <button onClick={signOut} className={`px-4 py-2 text-white rounded-lg font-medium transition-all duration-200 ${isDark ? 'bg-blue-500 hover:bg-blue-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
                Cerrar sesión
              </button>
            </>
          )}
        </div>
      </header>

      {/* Sidebar */}
      <div
        className="fixed top-0 left-0 h-full pt-16 border-r shadow-lg transition-width duration-300 ease-in-out flex flex-col"
        style={{
          width: isSidebarOpen ? '16rem' : '4rem',
          zIndex: isMobile ? 35 : 20, // Mayor z-index en móvil para superponer
          ...sidebarStyle
        }}
      >
        <nav className="flex-grow overflow-y-auto overflow-x-hidden">
          <ul className="space-y-1 px-2 mt-4">
            {navItems.map(({ href, label, icon }) => (
              <li key={href}>
                <Link href={href} className={`flex items-center gap-4 px-2 py-2.5 rounded-lg transition-all duration-200 cursor-pointer group ${pathname === href ? (isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600') : (isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700')}`}>
                  {icon}
                  {isSidebarOpen && <span className="truncate font-medium">{label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sección de usuario en el sidebar */}
        {user && (
          <div className={`border-t p-2 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className={`flex items-center transition-all duration-300 ${isSidebarOpen ? 'flex-row gap-3' : 'flex-col gap-2'}`}>
              <img src={user.photoURL || "/icons/user.jpg"} alt="user" className={`rounded-full border-2 transition-all duration-300 ${isDark ? 'border-gray-600' : 'border-gray-200'} ${isSidebarOpen ? 'w-10 h-10' : 'w-8 h-8'}`} />
              {isSidebarOpen && (
                <div className="flex-grow">
                  <span className={`block text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>Admin</span>
                </div>
              )}
              <button onClick={signOut} className={`rounded-lg transition-all duration-300 ${isSidebarOpen ? 'p-2 bg-red-500 text-white hover:bg-red-600' : 'p-1 text-gray-500 hover:text-red-500'}`}>
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Contenido Principal */}
      <main 
        className="pt-16 transition-all duration-300 ease-in-out min-h-screen"
        style={{ 
            // En móvil, el padding izquierdo es fijo. En desktop, cambia con el sidebar.
            paddingLeft: isMobile ? '4rem' : (isSidebarOpen ? '16rem' : '4rem'),
            ...mainStyle 
        }}
      >
        <div className="p-0">
          {children}
        </div>
      </main>
    </>
  );
}