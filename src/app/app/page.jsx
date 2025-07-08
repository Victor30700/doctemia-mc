'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import useSWR from 'swr'; // Importar useSWR
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { fetcher } from '@/lib/fetcher'; // Asegúrate de tener este fetcher en tu lib

import {
  Home as HomeIcon,
  Star,
  ShoppingBag,
  FileText,
  Video,
  UserCircle,
  BookmarkCheck,
  Clock, Cloud, CloudSun, Cloudy, CloudRain, CloudSnow, CloudLightning, Loader,
  BookMarked,
} from 'lucide-react';

// --- Componente para Tarjeta de Acceso Mejorada ---
function AccessCard({ href, title, description, Icon, isDark }) {
  const cardBg = isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const titleColor = isDark ? 'text-blue-400' : 'text-blue-600';
  const descColor = isDark ? 'text-gray-300' : 'text-gray-700';
  const iconColor = isDark ? 'text-indigo-400' : 'text-indigo-600';

  return (
    <Link
      href={href}
      className={`block border ${cardBg} p-6 rounded-xl shadow-lg hover:shadow-2xl transition-transform transform hover:-translate-y-1`}>
      <div className="flex items-center mb-4">
        {Icon && <Icon className={`w-8 h-8 mr-3 ${iconColor}`} />}
        <h2 className={`text-xl font-semibold ${titleColor}`}>{title}</h2>
      </div>
      <p className={`${descColor} text-sm leading-relaxed`}>{description}</p>
    </Link>
  );
}

export default function UserHomePage() {
  const { user, role } = useAuth();
  const { isDark, isLoaded } = useTheme();

  const fullName = user?.fullName || '';
  const universidad = user?.universidad || '';

  const [currentTime, setCurrentTime] = useState('');

  const weatherUrl = 'https://api.open-meteo.com/v1/forecast?latitude=-21.53&longitude=-64.72&current=temperature_2m,weather_code';
  const { data: weatherData, isLoading: weatherLoading } = useSWR(weatherUrl, fetcher);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getWeatherDetails = (code) => {
    if (code === 0) return { icon: <Sun size={20}/>, description: "Despejado" };
    if (code === 1) return { icon: <CloudSun size={20}/>, description: "Principalmente despejado" };
    if (code === 2) return { icon: <Cloud size={20}/>, description: "Parcialmente nublado" };
    if (code === 3) return { icon: <Cloudy size={20}/>, description: "Nublado" };
    if (code >= 51 && code <= 67) return { icon: <CloudRain size={20}/>, description: "Lluvia" };
    if (code >= 71 && code <= 77) return { icon: <CloudSnow size={20}/>, description: "Nieve" };
    if (code >= 95 && code <= 99) return { icon: <CloudLightning size={20}/>, description: "Tormenta" };
    return { icon: <Cloudy size={20}/>, description: "Brumoso" };
  };
  
  const weatherDetails = weatherData ? getWeatherDetails(weatherData.current.weather_code) : null;

  const sectionBg = isDark ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900';
  const welcomeTextColor = isDark ? 'text-white' : 'text-gray-900';
  const infoTextColor = isDark ? 'text-gray-400' : 'text-gray-600';
  const dateTextColor = isDark ? 'text-gray-300' : 'text-gray-700';
  const timeWeatherTextColor = isDark ? 'text-white' : 'text-gray-800';

  // ✅ NUEVO: Lógica para seleccionar la imagen del logo según el tema
  const doctemiaLogoSrc = isDark ? '/icons/1-oscuro.png' : '/icons/1.png';

  const userAccessLinks = useMemo(() => [
    { href: '/app/courses', title: 'Catalogo Cursos Premium', description: 'Explora el catálogo de cursos de suscripción', Icon: Star },
    { href: '/app/cursosPagados', title: 'Mis Cursos Adquiridos', description: 'Accede a los cursos que has comprado', Icon: BookmarkCheck },
    { href: '/app/pagoUnicoCourses', title: 'Cursos Pago Único', description: 'Descubre cursos de acceso permanente', Icon: BookMarked },
    { href: '/app/examen-test', title: 'Exámenes', description: 'Pon a prueba tus conocimientos con exámenes', Icon: FileText },
    { href: '/app/clases-en-vivo', title: 'Clases en Vivo', description: 'Participa en sesiones interactivas en tiempo real', Icon: Video },
    { href: '/app/profile', title: 'Mi Perfil', description: 'Ver y editar tu información personal', Icon: UserCircle },
  ], []);

  if (!isLoaded || weatherLoading) {
    return (
      <section className="min-h-screen flex items-center justify-center" style={{ backgroundColor: isDark ? '#111827' : '#f9fafb' }}>
        <p className={`text-lg animate-pulse ${isDark ? 'text-white' : 'text-black'}`}>Cargando página de inicio...</p>
      </section>
    );
  }

  return (
    <section className={`relative min-h-screen p-8 transition-colors ${sectionBg}`}>
      {/* Esferas de fondo decorativas */}
      <div className="absolute top-10 right-10 w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full opacity-20 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-pink-500 to-yellow-400 rounded-full opacity-20 pointer-events-none"></div>

      <div className="max-w-6xl mx-auto">
        {/* Encabezado con Logo y Bienvenida */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 p-6 rounded-xl shadow-lg border"
             style={{ backgroundColor: isDark ? '#1f2937' : '#ffffff', borderColor: isDark ? '#374151' : '#e5e7eb' }}>
          
          {/* Logo DOCTEMIA en la parte superior */}
          <div className="mb-4 md:mb-0 md:mr-6">
            <Image
              src={doctemiaLogoSrc} // ✅ Logo dinámico según el tema
              alt="DOCTEMIA"
              width={200} // Ajusta el ancho según sea necesario
              height={60} // Ajusta el alto según sea necesario
              priority // Carga la imagen al principio
            />
          </div>

          <div className="flex-grow">
            <h1 className={`text-3xl md:text-4xl font-extrabold leading-tight mb-2 ${welcomeTextColor}`}>
              Bienvenido, <span className="text-blue-500">{user?.email || 'Usuario'}</span>
            </h1>
            {fullName && <p className={`text-lg ${infoTextColor}`}>Nombre: {fullName}</p>}
            {universidad && <p className={`text-lg ${infoTextColor}`}>Universidad: {universidad}</p>}
          </div>
        </div>

        {/* Barra de Información (Fecha, Hora, Clima) - Separada y más prominente */}
        <div className={`flex flex-wrap justify-center md:justify-end items-center gap-x-6 gap-y-2 mb-12 p-4 rounded-lg border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-200 border-gray-300'}`}>
          <div className="flex items-center gap-2" title={new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}>
            <span className={`font-semibold text-md ${dateTextColor}`}>
              {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>
          <div className={`w-px h-6 self-stretch ${isDark ? 'bg-gray-600' : 'bg-gray-300'} hidden sm:block`}></div>
          <div className="flex items-center gap-2">
            <Clock className={isDark ? 'text-blue-400' : 'text-blue-600'} size={20}/>
            <span className={`font-semibold text-md ${timeWeatherTextColor}`}>{currentTime}</span>
          </div>
          <div className={`w-px h-6 self-stretch ${isDark ? 'bg-gray-600' : 'bg-gray-300'} hidden sm:block`}></div>
          {weatherLoading ? <Loader className="animate-spin" size={20}/> : weatherDetails && (
            <div className="flex items-center gap-2" title={weatherDetails.description}>
              <span className={isDark ? 'text-yellow-400' : 'text-yellow-500'}>{weatherDetails.icon}</span>
              <span className={`font-semibold text-md ${timeWeatherTextColor}`}>{Math.round(weatherData.current.temperature_2m)}°C</span>
              <span className={`text-sm ${infoTextColor}`}>(Tarija, BO)</span>
            </div>
          )}
        </div>

        {/* Sección de Accesos Rápidos */}
        <h2 className={`text-3xl font-bold mb-8 ${welcomeTextColor}`}>Explora y Aprende</h2>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-16">
          {userAccessLinks.map((linkItem) => (
            <AccessCard
              key={linkItem.href}
              href={linkItem.href}
              title={linkItem.title}
              description={linkItem.description}
              Icon={linkItem.Icon}
              isDark={isDark}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
