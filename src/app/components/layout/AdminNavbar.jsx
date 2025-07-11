'use client';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore'; // Importar doc y getDoc para obtener el nombre del usuario
import { useTheme } from '@/context/ThemeContext';
// Importamos iconos nuevos, incluyendo KeyRound para las nuevas solicitudes
import {
  Moon, Sun, Home, FileText, Users,
  Wallet, Video, QrCode, Bell, LogOut,
  Star, ShoppingBag, Tags, KeyRound
} from 'lucide-react';

export default function AdminNavbar({ children }) {
  const { signOut, user } = useAuth();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const { isDark, toggleTheme, isLoaded } = useTheme();
  const [isMobile, setIsMobile] = useState(false);
  // ✅ NUEVO ESTADO: Para almacenar el nombre del admin de Firestore
  const [adminName, setAdminName] = useState('Admin'); 

  const bellButtonRef = useRef(null);
  const notificationsPanelRef = useRef(null);

  // Hook para detectar si es vista móvil y ajustar el sidebar
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
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

  // ✅ NUEVO HOOK: Para obtener el nombre del admin de Firestore
  useEffect(() => {
    if (user && user.uid && user.role === 'admin') {
      const fetchAdminName = async () => {
        try {
          const adminDocRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(adminDocRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            // Tomar solo la primera palabra del nombre
            const firstName = data.name ? data.name.split(' ')[0] : 'Admin';
            setAdminName(firstName);
          }
        } catch (error) {
          console.error("Error al obtener el nombre del admin:", error);
          setAdminName('Admin'); // Fallback si hay error
        }
      };
      fetchAdminName();
    } else {
      setAdminName('Admin'); // Resetear si no es admin o no hay user
    }
  }, [user]); // Dependencia en el objeto user

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleNotifications = () => setShowNotifications(!showNotifications);

  // Hook para cerrar el panel de notificaciones al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationsPanelRef.current &&
        !notificationsPanelRef.current.contains(event.target) &&
        bellButtonRef.current &&
        !bellButtonRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Hook para obtener notificaciones
  useEffect(() => {
    if (!user) return;
    const unsubPremium = onSnapshot(collection(db, 'solicitudes'), (snapshot) => {
        const premiumData = snapshot.docs.map(doc => ({ ...doc.data(), type: 'Premium' }));
        setNotifications(prev => [...prev.filter(p => p.type !== 'Premium'), ...premiumData]);
    });
    const unsubPagoUnico = onSnapshot(collection(db, 'pagoUnico_solicitudes'), (snapshot) => {
        const pagoUnicoData = snapshot.docs.map(doc => ({ ...doc.data(), type: 'Acceso' }));
        setNotifications(prev => [...prev.filter(p => p.type !== 'Acceso'), ...pagoUnicoData]);
    });

    return () => {
        unsubPremium();
        unsubPagoUnico();
    };
  }, [user]);

  // --- ITEMS DE NAVEGACIÓN ---
  const navItems = [
    { type: 'link', href: '/admin', label: 'Inicio', icon: <Home className="w-5 h-5" /> },
    { type: 'link', href: '/admin/users', label: 'Usuarios', icon: <Users className="w-5 h-5" /> },
    { type: 'separator' },
    { type: 'link', href: '/admin/courses', label: 'Cursos Premium', icon: <Star className="w-5 h-5" /> },
    { type: 'link', href: '/admin/Cursos_Pago_Unico', label: 'Cursos Pago Único', icon: <ShoppingBag className="w-5 h-5" /> },
    { type: 'link', href: '/admin/Cursos_Pago_Unico/categoria', label: 'Categorías', icon: <Tags className="w-5 h-5" /> },
    { type: 'separator' },
    { type: 'link', href: '/admin/bank-preguntas', label: 'Exámenes', icon: <FileText className="w-5 h-5" /> },
    { type: 'link', href: '/admin/solicitudes', label: 'Solicitudes Premium', icon: <Wallet className="w-5 h-5" /> },
    { type: 'link', href: '/admin/solicitudes-pago-unico', label: 'Solicitudes de Acceso', icon: <KeyRound className="w-5 h-5" /> },
    { type: 'separator' },
    { type: 'link', href: '/admin/live-classes', label: 'Clases en Vivo', icon: <Video className="w-5 h-5" /> },
    { type: 'link', href: '/admin/qr-gestion', label: 'Gestión de QR', icon: <QrCode className="w-5 h-5" /> },
  ];

  // Estilos condicionales
  const headerStyle = { backgroundColor: isDark ? '#1f2937' : '#ffffff', borderBottomColor: isDark ? '#374151' : '#e5e7eb', color: isDark ? '#f9fafb' : '#111827' };
  const sidebarStyle = { backgroundColor: isDark ? '#1f2937' : '#ffffff', borderRightColor: isDark ? '#374151' : '#e5e7eb' };
  const mainStyle = { backgroundColor: isDark ? '#111827' : '#f9fafb' };
  const notificationPanelStyle = { backgroundColor: isDark ? '#2d3748' : '#ffffff', borderColor: isDark ? '#4a5568' : '#e2e8f0', color: isDark ? '#e2e8f0' : '#4a5568' };
  const notificationItemStyle = { borderBottomColor: isDark ? '#4a5568' : '#e2e8f0' };
  const emptyNotificationStyle = { color: isDark ? '#cbd5e0' : '#718096' };

  if (!isLoaded) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: isDark ? '#111827' : '#ffffff' }}>
        <div className="animate-pulse">
          <div className="h-16" style={{ backgroundColor: isDark ? '#1f2937' : '#f3f4f6' }}></div>
        </div>
      </div>
    );
  }

  return (
    <>
      {isMobile && isSidebarOpen && <div className="fixed inset-0 bg-black/60 z-30" onClick={toggleSidebar}></div>}

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
          <button ref={bellButtonRef} onClick={toggleNotifications} className={`relative p-2 rounded-lg transition-all duration-200 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
            <Bell className={`w-6 h-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
            {notifications.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">{notifications.length > 9 ? '9+' : notifications.length}</span>}
          </button>
          {showNotifications && (
            <div ref={notificationsPanelRef} className="absolute right-4 top-16 w-80 max-h-[80vh] overflow-y-auto rounded-lg shadow-xl border z-50 flex flex-col" style={notificationPanelStyle}>
              <h3 className={`text-lg font-semibold px-4 py-3 border-b ${isDark ? 'border-gray-700 text-blue-400' : 'border-gray-200 text-blue-600'}`}>Notificaciones</h3>
              <div className="flex-grow p-2">
                {notifications.length === 0 ? (
                  <p className="text-center p-4" style={emptyNotificationStyle}>No hay notificaciones pendientes.</p>
                ) : (
                  notifications.map((notification, index) => (
                    <div key={index} className="p-3 border-b last:border-b-0" style={notificationItemStyle}>
                      <p className="text-sm font-medium" style={{color: isDark ? '#e2e8f0' : '#4a5568'}}>
                        <span className="font-semibold">{notification.userName}</span> solicitó {notification.type === 'Acceso' ? 'acceso a Cursos.' : `el curso ${notification.courseName}.`}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          {/* ✅ CAMBIO: Foto de perfil y botón de cerrar sesión en el header (solo para desktop) */}
          {!isMobile && user && (
            <Link href="/admin/profile" className="flex items-center gap-2 cursor-pointer">
              <img src={user.photoURL || "/icons/user.jpg"} alt="user" className={`w-8 h-8 rounded-full border-2 ${isDark ? 'border-gray-600' : 'border-gray-200'}`} />
              <button onClick={signOut} className={`px-4 py-2 text-white rounded-lg font-medium transition-all duration-200 ${isDark ? 'bg-blue-500 hover:bg-blue-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
                Cerrar sesión
              </button>
            </Link>
          )}
        </div>
      </header>

      {/* Sidebar */}
      <div
        className="fixed top-0 left-0 h-full pt-16 border-r shadow-lg transition-all duration-300 ease-in-out flex flex-col"
        style={{
          width: isSidebarOpen ? '16rem' : '4rem',
          transform: isMobile ? (isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)',
          zIndex: isMobile ? 35 : 20,
          ...sidebarStyle
        }}
      >
        <nav className="flex-grow overflow-y-auto overflow-x-hidden">
          <ul className="space-y-1 px-2 mt-4">
            {navItems.map((item, index) => {
              if (item.type === 'separator') {
                return <li key={index}><hr className={`my-2 ${isDark ? 'border-gray-700' : 'border-gray-200'}`} /></li>;
              }
              return (
                <li key={item.href}>
                  <Link href={item.href} className={`flex items-center gap-4 px-2 py-2.5 rounded-lg transition-all duration-200 cursor-pointer group ${pathname === item.href ? (isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600') : (isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700')}`}>
                    {item.icon}
                    {isSidebarOpen && <span className="truncate font-medium">{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sección de usuario en el sidebar */}
        {user && (
          <div className={`border-t p-2 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            {/* ✅ CAMBIO: Contenedor clicable para la foto y el nombre */}
            <Link href="/admin/profile" className={`flex items-center transition-all duration-300 cursor-pointer group ${isSidebarOpen ? 'flex-row gap-3' : 'flex-col gap-2'}`}>
              <img src={user.photoURL || "/icons/user.jpg"} alt="user" className={`rounded-full border-2 transition-all duration-300 ${isDark ? 'border-gray-600' : 'border-gray-200'} ${isSidebarOpen ? 'w-10 h-10' : 'w-8 h-8'}`} />
              {isSidebarOpen && (
                <div className="flex-grow">
                  {/* ✅ CAMBIO: Mostrar adminName (primera palabra del nombre) */}
                  <span className={`block text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{adminName}</span>
                </div>
              )}
              {/* El botón de cerrar sesión se mueve al header para desktop, se mantiene oculto en mobile aquí */}
              {!isSidebarOpen && ( // Solo mostrar el icono de cerrar sesión si el sidebar está colapsado en mobile
                 <button onClick={signOut} className={`rounded-lg transition-all duration-300 p-1 text-gray-500 hover:text-red-500`}>
                   <LogOut className="w-5 h-5" />
                 </button>
              )}
            </Link>
            {isSidebarOpen && ( // Mostrar el botón de cerrar sesión completo solo si el sidebar está abierto
                <button onClick={signOut} className={`mt-2 w-full p-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-all duration-200`}>
                  Cerrar sesión
                </button>
            )}
          </div>
        )}
      </div>

      {/* Contenido Principal */}
      <main
        className="pt-16 transition-all duration-300 ease-in-out min-h-screen"
        style={{
          paddingLeft: isMobile ? '0' : (isSidebarOpen ? '16rem' : '4rem'),
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
