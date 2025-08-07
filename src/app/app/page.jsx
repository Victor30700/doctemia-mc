'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import useSWR from 'swr';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { fetcher } from '@/lib/fetcher';

import {
  FileText,
  Video,
  UserCircle,
  Clock, Cloud, CloudSun, Cloudy, CloudRain, CloudSnow, CloudLightning, Loader,
  BookMarked, Sun, ArrowRight, PlayCircle, BrainCircuit, Stethoscope, Target, Zap, Award, MapPin
} from 'lucide-react';

// --- COMPONENTE MEJORADO: Fondo Animado con Cambio de Tonalidades por Scroll ---
function AnimatedBackground({ isDark, scrollY }) {
  // Calculamos el progreso del scroll (0 a 1) con validaciones
  const getScrollProgress = () => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return 0;
    
    const scrollHeight = document.documentElement.scrollHeight;
    const windowHeight = window.innerHeight;
    const maxScroll = scrollHeight - windowHeight;
    
    // Validaciones para evitar NaN
    if (!maxScroll || maxScroll <= 0 || !scrollY || scrollY < 0) return 0;
    if (!isFinite(scrollY) || !isFinite(maxScroll)) return 0;
    
    return Math.min(Math.max(scrollY / maxScroll, 0), 1);
  };

  const scrollProgress = getScrollProgress();
  
  // Definimos las tonalidades que cambian con el scroll
  const getBackgroundStyle = () => {
    const progress = isFinite(scrollProgress) ? scrollProgress : 0;
    
    if (isDark) {
      // Modo oscuro: transiciones de negro a azul profundo a morado
      if (progress < 0.25) {
        const factor = Math.max(0, Math.min(progress, 0.25));
        return {
          background: `linear-gradient(135deg, 
            rgba(0, 0, 0, ${Math.max(0.1, 0.9 - factor * 2)}) 0%, 
            rgba(15, 23, 42, ${Math.max(0.1, 0.8 - factor * 1.5)}) 25%, 
            rgba(30, 41, 59, ${Math.max(0.1, 0.7 - factor)}) 50%, 
            rgba(51, 65, 85, ${Math.max(0.1, 0.6 - factor * 0.5)}) 75%, 
            rgba(0, 0, 0, ${Math.max(0.1, 0.9 - factor * 2)}) 100%)`
        };
      } else if (progress < 0.5) {
        const factor = Math.max(0, Math.min(progress - 0.25, 0.25));
        return {
          background: `linear-gradient(135deg, 
            rgba(15, 23, 42, 0.8) 0%, 
            rgba(30, 58, 138, ${Math.max(0.1, Math.min(0.9, 0.7 + factor * 0.4))}) 25%, 
            rgba(59, 130, 246, ${Math.max(0.1, Math.min(0.9, 0.3 + factor * 0.6))}) 50%, 
            rgba(37, 99, 235, ${Math.max(0.1, Math.min(0.9, 0.5 + factor * 0.4))}) 75%, 
            rgba(15, 23, 42, 0.8) 100%)`
        };
      } else if (progress < 0.75) {
        const factor = Math.max(0, Math.min(progress - 0.5, 0.25));
        return {
          background: `linear-gradient(135deg, 
            rgba(30, 58, 138, 0.8) 0%, 
            rgba(67, 56, 202, ${Math.max(0.1, Math.min(0.9, 0.6 + factor * 0.4))}) 25%, 
            rgba(139, 92, 246, ${Math.max(0.1, Math.min(0.9, 0.4 + factor * 0.6))}) 50%, 
            rgba(124, 58, 237, ${Math.max(0.1, Math.min(0.9, 0.5 + factor * 0.4))}) 75%, 
            rgba(30, 58, 138, 0.8) 100%)`
        };
      } else {
        const factor = Math.max(0, Math.min(progress - 0.75, 0.25));
        return {
          background: `linear-gradient(135deg, 
            rgba(67, 56, 202, 0.9) 0%, 
            rgba(139, 92, 246, ${Math.max(0.1, Math.min(0.9, 0.7 + factor * 0.3))}) 25%, 
            rgba(168, 85, 247, ${Math.max(0.1, Math.min(0.9, 0.5 + factor * 0.5))}) 50%, 
            rgba(147, 51, 234, ${Math.max(0.1, Math.min(0.9, 0.6 + factor * 0.4))}) 75%, 
            rgba(67, 56, 202, 0.9) 100%)`
        };
      }
    } else {
      // Modo claro: transiciones de blanco a azul claro a celeste
      if (progress < 0.25) {
        const factor = Math.max(0, Math.min(progress, 0.25));
        return {
          background: `linear-gradient(135deg, 
            rgba(255, 255, 255, ${Math.max(0.1, Math.min(0.98, 0.95 - factor * 0.2))}) 0%, 
            rgba(248, 250, 252, ${Math.max(0.1, Math.min(0.95, 0.9 - factor * 0.1))}) 25%, 
            rgba(241, 245, 249, ${Math.max(0.1, Math.min(0.9, 0.85 - factor * 0.1))}) 50%, 
            rgba(226, 232, 240, ${Math.max(0.1, Math.min(0.85, 0.8 - factor * 0.1))}) 75%, 
            rgba(255, 255, 255, ${Math.max(0.1, Math.min(0.98, 0.95 - factor * 0.2))}) 100%)`
        };
      } else if (progress < 0.5) {
        const factor = Math.max(0, Math.min(progress - 0.25, 0.25));
        return {
          background: `linear-gradient(135deg, 
            rgba(248, 250, 252, 0.9) 0%, 
            rgba(219, 234, 254, ${Math.max(0.1, Math.min(0.95, 0.8 + factor * 0.2))}) 25%, 
            rgba(191, 219, 254, ${Math.max(0.1, Math.min(0.9, 0.6 + factor * 0.4))}) 50%, 
            rgba(147, 197, 253, ${Math.max(0.1, Math.min(0.9, 0.7 + factor * 0.3))}) 75%, 
            rgba(248, 250, 252, 0.9) 100%)`
        };
      } else if (progress < 0.75) {
        const factor = Math.max(0, Math.min(progress - 0.5, 0.25));
        return {
          background: `linear-gradient(135deg, 
            rgba(219, 234, 254, 0.85) 0%, 
            rgba(165, 180, 252, ${Math.max(0.1, Math.min(0.9, 0.7 + factor * 0.3))}) 25%, 
            rgba(129, 140, 248, ${Math.max(0.1, Math.min(0.9, 0.5 + factor * 0.5))}) 50%, 
            rgba(139, 92, 246, ${Math.max(0.1, Math.min(0.9, 0.6 + factor * 0.4))}) 75%, 
            rgba(219, 234, 254, 0.85) 100%)`
        };
      } else {
        const factor = Math.max(0, Math.min(progress - 0.75, 0.25));
        return {
          background: `linear-gradient(135deg, 
            rgba(165, 180, 252, 0.8) 0%, 
            rgba(129, 140, 248, ${Math.max(0.1, Math.min(0.9, 0.7 + factor * 0.3))}) 25%, 
            rgba(99, 102, 241, ${Math.max(0.1, Math.min(0.9, 0.6 + factor * 0.4))}) 50%, 
            rgba(79, 70, 229, ${Math.max(0.1, Math.min(0.9, 0.5 + factor * 0.5))}) 75%, 
            rgba(165, 180, 252, 0.8) 100%)`
        };
      }
    }
  };

  // Colores de líneas que cambian con el scroll
  const getLineColor = () => {
    const progress = isFinite(scrollProgress) ? scrollProgress : 0;
    if (isDark) {
      const baseOpacity = Math.max(0.02, Math.min(0.2, 0.08 + progress * 0.12));
      return `rgba(59, 130, 246, ${baseOpacity})`;
    } else {
      const baseOpacity = Math.max(0.02, Math.min(0.16, 0.06 + progress * 0.1));
      return `rgba(59, 130, 246, ${baseOpacity})`;
    }
  };

  // Colores de orbes que cambian con el scroll
  const getOrbColors = () => {
    const progress = isFinite(scrollProgress) ? scrollProgress : 0;
    if (isDark) {
      return {
        orb1: `rgba(59, 130, 246, ${Math.max(0.05, Math.min(0.3, 0.15 + progress * 0.15))})`,
        orb2: `rgba(168, 85, 247, ${Math.max(0.04, Math.min(0.3, 0.12 + progress * 0.18))})`,
        orb3: `rgba(34, 197, 94, ${Math.max(0.03, Math.min(0.3, 0.1 + progress * 0.2))})`
      };
    } else {
      return {
        orb1: `rgba(59, 130, 246, ${Math.max(0.03, Math.min(0.2, 0.1 + progress * 0.1))})`,
        orb2: `rgba(168, 85, 247, ${Math.max(0.02, Math.min(0.2, 0.08 + progress * 0.12))})`,
        orb3: `rgba(34, 197, 94, ${Math.max(0.02, Math.min(0.2, 0.06 + progress * 0.14))})`
      };
    }
  };

  const lineColor = getLineColor();
  const orbColors = getOrbColors();
  const backgroundStyle = getBackgroundStyle();
  const progress = isFinite(scrollProgress) ? scrollProgress : 0;

  return (
    <div 
      className="fixed inset-0 -z-50 overflow-hidden transition-all duration-1000"
      style={backgroundStyle}
    >
      {/* Grid animado con opacidad variable */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(to right, ${lineColor} 1px, transparent 1px), linear-gradient(to bottom, ${lineColor} 1px, transparent 1px)`,
          backgroundSize: `${Math.max(40, 60 + progress * 20)}px ${Math.max(40, 60 + progress * 20)}px`,
          animation: 'gridMove 20s linear infinite',
          opacity: Math.max(0.2, Math.min(1, 0.6 + progress * 0.4))
        }}
      />
      
      {/* Orbes flotantes con colores cambiantes */}
      <div className="absolute inset-0">
        <div
          className="absolute w-96 h-96 rounded-full blur-3xl animate-float-slow"
          style={{
            background: `radial-gradient(circle, ${orbColors.orb1} 0%, transparent 70%)`,
            top: `${Math.max(5, Math.min(30, 20 - progress * 10))}%`,
            left: `${Math.max(5, Math.min(40, 10 + progress * 15))}%`,
            animationDelay: '0s',
            opacity: Math.max(0.1, Math.min(0.7, 0.3 + progress * 0.4))
          }}
        />
        <div
          className="absolute w-80 h-80 rounded-full blur-3xl animate-float-slow"
          style={{
            background: `radial-gradient(circle, ${orbColors.orb2} 0%, transparent 70%)`,
            top: `${Math.max(40, Math.min(80, 60 + progress * 10))}%`,
            right: `${Math.max(5, Math.min(25, 15 - progress * 5))}%`,
            animationDelay: '3s',
            opacity: Math.max(0.1, Math.min(0.7, 0.2 + progress * 0.5))
          }}
        />
        <div
          className="absolute w-64 h-64 rounded-full blur-3xl animate-float-slow"
          style={{
            background: `radial-gradient(circle, ${orbColors.orb3} 0%, transparent 70%)`,
            bottom: `${Math.max(10, Math.min(50, 20 + progress * 15))}%`,
            left: `${Math.max(20, Math.min(80, 60 - progress * 20))}%`,
            animationDelay: '6s',
            opacity: Math.max(0.1, Math.min(0.7, 0.25 + progress * 0.45))
          }}
        />
        
        {/* Orbes adicionales que aparecen con el scroll */}
        {progress > 0.3 && (
          <div
            className="absolute w-72 h-72 rounded-full blur-3xl animate-float-slow"
            style={{
              background: `radial-gradient(circle, ${isDark ? 'rgba(236, 72, 153, 0.15)' : 'rgba(236, 72, 153, 0.1)'} 0%, transparent 70%)`,
              top: `${Math.max(15, Math.min(60, 30 + progress * 20))}%`,
              right: `${Math.max(20, Math.min(70, 50 - progress * 15))}%`,
              animationDelay: '9s',
              opacity: Math.max(0.05, Math.min(0.6, (progress - 0.3) * 0.6))
            }}
          />
        )}
        
        {progress > 0.6 && (
          <div
            className="absolute w-88 h-88 rounded-full blur-3xl animate-float-slow"
            style={{
              background: `radial-gradient(circle, ${isDark ? 'rgba(251, 191, 36, 0.12)' : 'rgba(251, 191, 36, 0.08)'} 0%, transparent 70%)`,
              bottom: `${Math.max(20, Math.min(50, 40 - progress * 10))}%`,
              right: `${Math.max(10, Math.min(60, 20 + progress * 25))}%`,
              animationDelay: '12s',
              opacity: Math.max(0.05, Math.min(0.7, (progress - 0.6) * 0.7))
            }}
          />
        )}
      </div>

      {/* Partículas flotantes adicionales */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full animate-float-slow"
            style={{
              background: lineColor,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 15}s`,
              animationDuration: `${15 + Math.random() * 10}s`,
              opacity: Math.max(0.1, Math.min(0.7, 0.3 + progress * 0.4))
            }}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(60px, 60px); }
        }
        
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
          25% { transform: translateY(-20px) translateX(10px) rotate(90deg); }
          50% { transform: translateY(-10px) translateX(-15px) rotate(180deg); }
          75% { transform: translateY(-30px) translateX(5px) rotate(270deg); }
        }
        
        .animate-float-slow {
          animation: float-slow 15s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

// --- COMPONENTE MEJORADO: Tarjeta de Equipo con efecto 3D ---
function TeamMemberCard({ name, role, imageSrc, description, Icon, isDark }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const cardBaseStyle = 'w-full h-96 rounded-2xl shadow-lg transition-all duration-700 [transform-style:preserve-3d] cursor-pointer group';
  const cardFaceStyle = 'absolute w-full h-full [backface-visibility:hidden] rounded-2xl overflow-hidden flex flex-col items-center justify-center p-6 text-center';
  const cardFrontBg = isDark ? 'bg-gray-900/90 backdrop-blur-md border-gray-700/50' : 'bg-white/90 backdrop-blur-md border-gray-200/50';
  const cardBackBg = isDark ? 'bg-gray-800/95 backdrop-blur-md border-gray-700/50' : 'bg-gray-100/95 backdrop-blur-md border-gray-200/50';
  const iconColor = isDark ? 'text-blue-400' : 'text-blue-600';

  return (
    <div 
      className="w-full max-w-sm mx-auto [perspective:1000px] transform transition-all duration-300 hover:scale-105" 
      onClick={() => setIsFlipped(!isFlipped)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`${cardBaseStyle} ${isFlipped ? '[transform:rotateY(180deg)]' : ''} ${isHovered ? 'shadow-2xl shadow-blue-500/20' : ''}`}
        style={{
          transform: isHovered && !isFlipped ? 'rotateX(5deg) rotateY(-5deg)' : '',
        }}
      >
        {/* Cara Frontal */}
        <div className={`${cardFaceStyle} ${cardFrontBg} border-2 ${isDark ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
          <div className={`w-32 h-32 rounded-full overflow-hidden border-4 ${isDark ? 'border-blue-500' : 'border-blue-600'} mb-4 transition-all duration-500 ${isHovered ? 'scale-110 shadow-lg shadow-blue-500/30' : ''}`}>
            <Image
              src={imageSrc}
              alt={`Foto de ${name}`}
              width={128}
              height={128}
              className="object-cover w-full h-full transition-transform duration-500 hover:scale-110"
              onError={(e) => { e.currentTarget.src = `https://placehold.co/128x128/${isDark ? '374151/9ca3af' : 'e5e7eb/4b5563'}?text=${name.charAt(0)}`; }}
            />
          </div>
          <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>{name}</h3>
          <div className="flex items-center gap-2 mt-2">
            {Icon && <Icon className={`w-5 h-5 ${iconColor} transition-all duration-300 ${isHovered ? 'scale-110' : ''}`} />}
            <p className={`text-md font-semibold ${iconColor}`}>{role}</p>
          </div>
          <div className={`mt-4 px-3 py-1 rounded-full text-sm transition-all duration-300 ${isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-500/10 text-blue-600'} ${isHovered ? 'bg-blue-500/20 scale-105' : ''}`}>
            Toca para saber más
          </div>
        </div>

        {/* Cara Trasera */}
        <div className={`${cardFaceStyle} ${cardBackBg} [transform:rotateY(180deg)] justify-center p-8 border-2 ${isDark ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
          <h4 className={`text-xl font-semibold mb-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Sobre {name.split(' ')[0]}</h4>
          <p className={`text-base leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {description}
          </p>
          <div className={`mt-6 px-4 py-2 rounded-full text-sm transition-all duration-300 ${isDark ? 'bg-gray-700/50 text-gray-400' : 'bg-gray-200/50 text-gray-600'} hover:bg-blue-500/20`}>
            Toca para volver
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Componente para Tarjeta de Acceso ---
function AccessCard({ href, title, description, Icon, isDark }) {
  const [isHovered, setIsHovered] = useState(false);
  const cardBg = isDark ? 'bg-gray-900/80 border-gray-700/50' : 'bg-white/80 border-gray-200/50';
  const titleColor = isDark ? 'text-blue-300' : 'text-blue-700';
  const descColor = isDark ? 'text-gray-300' : 'text-gray-600';
  const iconColor = isDark ? 'text-indigo-400' : 'text-indigo-600';

  return (
    <Link
      href={href}
      className={`block border-2 ${cardBg} p-6 rounded-2xl shadow-lg backdrop-blur-lg transition-all duration-500 transform hover:-translate-y-3 hover:shadow-2xl hover:border-blue-400/50 hover:bg-opacity-90 group relative overflow-hidden`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center mb-4 relative z-10">
        {Icon && (
          <div className={`p-2 rounded-lg mr-3 transition-all duration-300 ${isHovered ? 'bg-blue-500/20 scale-110' : 'bg-blue-500/10'}`}>
            <Icon className={`w-6 h-6 ${iconColor} transition-all duration-300 ${isHovered ? 'scale-110' : ''}`} />
          </div>
        )}
        <h2 className={`text-xl font-semibold ${titleColor} transition-all duration-300 ${isHovered ? 'scale-105' : ''}`}>{title}</h2>
      </div>
      <p className={`${descColor} text-sm leading-relaxed transition-all duration-300 relative z-10`}>{description}</p>
      
      {/* Efecto de brillo en hover */}
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 opacity-0 transition-opacity duration-500 ${isHovered ? 'opacity-100' : ''}`} />
    </Link>
  );
}

// --- Componente para Tarjeta de Características ---
function FeatureCard({ Icon, title, description, isDark }) {
    const [isHovered, setIsHovered] = useState(false);
    const cardBg = isDark ? 'bg-gray-900/90 backdrop-blur-md' : 'bg-white/90 backdrop-blur-md';
    const titleColor = isDark ? 'text-white' : 'text-gray-900';
    const descColor = isDark ? 'text-gray-400' : 'text-gray-600';
    const iconColor = isDark ? 'text-blue-400' : 'text-blue-600';

    return (
        <div 
          className={`border-2 ${isDark ? 'border-gray-800/50' : 'border-gray-200/50'} rounded-2xl p-8 text-center flex flex-col items-center ${cardBg} transition-all duration-500 hover:shadow-2xl hover:-translate-y-3 hover:border-blue-400/50 group relative overflow-hidden`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
            {/* Efecto de ondas en hover */}
            <div className={`absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 opacity-0 transition-opacity duration-700 ${isHovered ? 'opacity-100' : ''}`} />
            
            <div className={`mb-6 p-4 rounded-full transition-all duration-500 ${isHovered ? 'bg-blue-500/20 scale-110 shadow-lg shadow-blue-500/30' : 'bg-blue-500/10'} relative z-10`}>
                <Icon className={`w-10 h-10 ${iconColor} transition-all duration-500 ${isHovered ? 'scale-110' : ''}`} />
            </div>
            <h3 className={`text-2xl font-bold mb-3 ${titleColor} transition-all duration-300 ${isHovered ? 'scale-105' : ''} relative z-10`}>{title}</h3>
            <p className={`${descColor} leading-relaxed transition-all duration-300 relative z-10`}>{description}</p>
        </div>
    );
}

export default function UserHomePage() {
  const { user } = useAuth();
  const { isDark, isLoaded } = useTheme();
  const [currentTime, setCurrentTime] = useState('');
  const [location, setLocation] = useState({ latitude: null, longitude: null, city: 'Cochabamba' });
  const [scrollY, setScrollY] = useState(0);

  // Geolocalización para obtener ubicación actual
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            city: 'Tu ubicación'
          });
        },
        (error) => {
          console.log('Error obteniendo ubicación:', error);
          // Mantener Cochabamba como fallback
          setLocation({
            latitude: -17.39,
            longitude: -66.16,
            city: 'Cochabamba'
          });
        }
      );
    } else {
      // Fallback a Cochabamba
      setLocation({
        latitude: -17.39,
        longitude: -66.16,
        city: 'Cochabamba'
      });
    }
  }, []);

  // URL del clima con coordenadas dinámicas
  const weatherUrl = location.latitude && location.longitude 
    ? `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,weather_code`
    : null;
  
  const { data: weatherData, isLoading: weatherLoading } = useSWR(weatherUrl, fetcher);

  // Manejo del scroll para cambio de tonalidades
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      // Validar que scrollPosition sea un número válido
      if (isFinite(scrollPosition) && scrollPosition >= 0) {
        setScrollY(scrollPosition);
      }
    };

    window.addEventListener('scroll', handleScroll);
    // Actualizar inmediatamente
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getWeatherDetails = (code) => {
    if (code === 0) return { icon: <Sun size={20}/>, description: "Despejado" };
    if (code >= 1 && code <= 3) return { icon: <CloudSun size={20}/>, description: "Parcialmente nublado" };
    if (code >= 45 && code <= 48) return { icon: <Cloudy size={20}/>, description: "Niebla" };
    if (code >= 51 && code <= 67) return { icon: <CloudRain size={20}/>, description: "Lluvia" };
    if (code >= 71 && code <= 77) return { icon: <CloudSnow size={20}/>, description: "Nieve" };
    if (code >= 95 && code <= 99) return { icon: <CloudLightning size={20}/>, description: "Tormenta" };
    return { icon: <Cloudy size={20}/>, description: "Brumoso" };
  };
  
  const weatherDetails = weatherData ? getWeatherDetails(weatherData.current.weather_code) : null;
  
  const textColor = isDark ? 'text-gray-200' : 'text-gray-800';
  const secondaryTextColor = isDark ? 'text-gray-400' : 'text-gray-600';

  const userAccessLinks = useMemo(() => [
    { href: '/app/pagoUnicoCourses', title: 'Cursos', description: 'Descubre cursos de acceso permanente.', Icon: BookMarked },
    { href: '/app/examen-test', title: 'Exámenes', description: 'Pon a prueba tus conocimientos.', Icon: FileText },
    { href: '/app/clases-en-vivo', title: 'Clases en Vivo', description: 'Participa en sesiones interactivas.', Icon: Video },
    { href: '/app/profile', title: 'Mi Perfil', description: 'Tu información personal y progreso.', Icon: UserCircle },
  ], []);

  if (!isLoaded) {
    return (
      <section className="min-h-screen flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-12 h-12 animate-spin text-blue-500" />
          <p className="text-white">Cargando experiencia...</p>
        </div>
      </section>
    );
  }

  return (
    <div className={`relative ${textColor}`}>
      <AnimatedBackground isDark={isDark} scrollY={scrollY} />
      
      <div className="relative z-10">
        {/* --- SECCIÓN 1: HERO CINEMATOGRÁFICO --- */}
        <section className="h-screen w-full flex flex-col items-center justify-center text-center text-white relative">
          <video
            src="/videos/video1.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="absolute top-0 left-0 w-full h-full object-cover z-0"
          />
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-black/60 via-black/70 to-black/80 z-10"></div>
          
          <div className="relative z-20 p-4 flex flex-col items-center animate-fade-in">
              <div className={`flex flex-wrap justify-center items-center gap-x-4 gap-y-2 mb-8 p-3 px-4 rounded-full text-sm bg-black/40 backdrop-blur-md border border-white/20 transition-all duration-500 hover:bg-black/50 hover:scale-105`}>
                  {weatherDetails && (
                    <>
                      <div className="flex items-center gap-2 transition-all duration-300 hover:scale-105" title={weatherDetails.description}>
                        <span className="text-yellow-300 animate-pulse">{weatherDetails.icon}</span>
                        <span>{Math.round(weatherData.current.temperature_2m)}°C</span>
                      </div>
                      <div className="w-px h-4 bg-gray-500 hidden sm:block"></div>
                    </>
                  )}
                  <div className="flex items-center gap-2 transition-all duration-300 hover:scale-105">
                    <MapPin size={16} className="text-blue-400"/>
                    <span className="text-blue-400">{location.city}</span>
                  </div>
                  <div className="w-px h-4 bg-gray-500 hidden sm:block"></div>
                  <div className="flex items-center gap-2 transition-all duration-300 hover:scale-105">
                    <Clock size={16} className="text-green-400"/>
                    <span className="text-green-400">{currentTime}</span>
                  </div>
              </div>

              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-tight mb-4 text-shadow-lg animate-slide-up-delay-1">
                BIENVENIDO A DOCTEMIA MC <br/> 
                <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600 bg-clip-text text-transparent animate-gradient">
                  Aprendizaje Médico
                </span>.
              </h1>
              <p className="text-lg md:text-xl max-w-2xl mx-auto text-gray-300 mb-8 animate-slide-up-delay-2">
                Hola, <span className="font-semibold text-white bg-blue-500/20 px-2 py-1 rounded-md">{user?.fullName || user?.email || 'Usuario'}</span>. listo para prepararte...
              </p>
              <a href="#introduccion" className="inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-full text-lg font-semibold transition-all duration-500 transform hover:scale-110 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 animate-slide-up-delay-3 group">
                Descubre Más
                <ArrowRight className="ml-2 w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
              </a>
          </div>

          {/* Indicador de scroll */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce z-20">
            <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
              <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-pulse"></div>
            </div>
          </div>
        </section>

        {/* --- SECCIÓN 2: VIDEO DE INTRODUCCIÓN --- */}
        <section id="introduccion" className="w-full py-24 md:py-32 bg-transparent">
          <div className="max-w-4xl mx-auto text-center px-4">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tighter animate-fade-in-up">Tu vocación. Necesita una buena prepararación.</h2>
              <p className={`mt-4 text-lg md:text-xl ${secondaryTextColor} max-w-3xl mx-auto animate-fade-in-up-delay`}>
                Clases claras. Casos reales. Simulacros tipo examen.
Hecho por médicos jóvenes, para quienes se preparan con vocación.
Estudia lo que cae. Aprende lo que importa.
Desde donde quieras, cuando quieras.
              </p>
          </div>
          <div className="w-full mt-12 animate-fade-in-up-delay-2">
            <div className={`w-full max-w-6xl mx-auto aspect-video rounded-2xl overflow-hidden shadow-2xl border-2 ${isDark ? 'border-blue-500/30 bg-black/20' : 'border-gray-200/50 bg-white/20'} p-2 backdrop-blur-sm transition-all duration-500 hover:shadow-blue-500/20 hover:scale-[1.02] group`}>
              <video
                src="/videos/video3.mp4"
                controls
                playsInline
                className="w-full h-full object-cover rounded-lg transition-all duration-500 group-hover:brightness-110"
              />
            </div>
          </div>
        </section>

        {/* --- SECCIÓN 3: NUESTRA METODOLOGÍA --- */}
        <section id="metodologia" className="py-24 md:py-32 bg-transparent">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
              <div className="text-center mb-16">
                  <h2 className="text-4xl md:text-5xl font-bold tracking-tighter animate-fade-in-up">Una Metodología Diseñada para Ti</h2>
                  <p className={`mt-4 text-lg md:text-xl max-w-3xl mx-auto ${secondaryTextColor} animate-fade-in-up-delay`}>
                      Combinamos ciencia, tecnología y pedagogía para asegurar tu éxito.
                  </p>
              </div>
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                  <div className="animate-fade-in-up" style={{animationDelay: '0.1s'}}>
                    <FeatureCard
                        Icon={Target}
                        title="Aprendizaje Enfocado"
                        description="Contenido directo y relevante. Cada clase está diseñada para maximizar tu comprensión y retención de información clave."
                        isDark={isDark}
                    />
                  </div>
                  <div className="animate-fade-in-up" style={{animationDelay: '0.2s'}}>
                    <FeatureCard
                        Icon={Zap}
                        title="Tecnología Interactiva"
                        description="Una plataforma moderna con clases en vivo, exámenes simulados y herramientas que se adaptan a tu ritmo de aprendizaje."
                        isDark={isDark}
                    />
                  </div>
                  <div className="animate-fade-in-up" style={{animationDelay: '0.3s'}}>
                    <FeatureCard
                        Icon={Award}
                        title="Calidad Comprobada"
                        description="Clases impartidas por expertos de alta calidad para darte la confianza que necesitas para superar cualquier reto."
                        isDark={isDark}
                    />
                  </div>
              </div>
          </div>
        </section>

        {/* --- SECCIÓN 4: CONOCE AL EQUIPO --- */}
        <section id="equipo" className="py-24 md:py-32 bg-transparent">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold tracking-tighter animate-fade-in-up">Guiado por Expertos</h2>
                <p className={`mt-4 text-lg md:text-xl max-w-3xl mx-auto ${secondaryTextColor} animate-fade-in-up-delay`}>
                  Profesionales apasionados y dedicados a potenciar tu carrera médica.
                </p>
              </div>
              <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-3">
                <div className="animate-fade-in-up" style={{animationDelay: '0.1s'}}>
                  <TeamMemberCard
                    name="Victor H."
                    role="Creador y Desarrollador"
                    imageSrc="/images/victor.png"
                    description="Mente maestra detrás de la plataforma. Como desarrollador Full-Stack, se encarga de que tu experiencia de aprendizaje sea fluida, intuitiva y tecnológicamente avanzada."
                    Icon={BrainCircuit}
                    isDark={isDark}
                  />
                </div>
                <div className="animate-fade-in-up" style={{animationDelay: '0.2s'}}>
                  <TeamMemberCard
                    name="Maria Jose Loaiza Marquez."
                    role="Medico"
                    imageSrc="/images/majo.png"
                    description="Médico especialista y educadora por vocación. Transforma temas médicos complejos en lecciones claras y memorables, preparándote para los desafíos del mundo real."
                    Icon={Stethoscope}
                    isDark={isDark}
                  />
                </div>
                <div className="animate-fade-in-up" style={{animationDelay: '0.3s'}}>
                  <TeamMemberCard
                    name="Chompi"
                    role="Doctor e Instructor"
                    imageSrc="/images/chompi.png"
                    description="Experto clínico con una pasión por la enseñanza. Aporta años de experiencia práctica al aula virtual, ofreciendo insights valiosos y aplicables a tu carrera médica."
                    Icon={Stethoscope}
                    isDark={isDark}
                  />
                </div>
              </div>
          </div>
        </section>

        {/* --- SECCIÓN 5: ACCESOS RÁPIDOS --- */}
        <section id="explora" className="py-24 md:py-32 relative overflow-hidden bg-transparent">
          <div className="absolute inset-0 z-0">
              <div className={`absolute w-96 h-96 bg-blue-900/20 rounded-full -top-32 -left-32 blur-3xl animate-pulse`}></div>
              <div className={`absolute w-96 h-96 bg-purple-900/20 rounded-full -bottom-32 -right-32 blur-3xl animate-pulse`} style={{animationDelay: '2s'}}></div>
          </div>
          <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tighter animate-fade-in-up">Tu Centro de Mando</h2>
              <p className={`mt-4 text-lg md:text-xl max-w-2xl mx-auto ${secondaryTextColor} animate-fade-in-up-delay`}>
                Accede a todas las herramientas que necesitas para triunfar.
              </p>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {userAccessLinks.map((linkItem, index) => (
                <div key={linkItem.href} className="animate-fade-in-up" style={{animationDelay: `${index * 0.1}s`}}>
                  <AccessCard
                    {...linkItem}
                    isDark={isDark}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Estilos CSS personalizados para animaciones */}
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slide-up {
          from { 
            opacity: 0; 
            transform: translateY(30px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }

        @keyframes fade-in-up {
          from { 
            opacity: 0; 
            transform: translateY(40px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }

        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }

        .animate-slide-up-delay-1 {
          animation: slide-up 1s ease-out 0.2s both;
        }

        .animate-slide-up-delay-2 {
          animation: slide-up 1s ease-out 0.4s both;
        }

        .animate-slide-up-delay-3 {
          animation: slide-up 1s ease-out 0.6s both;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out;
        }

        .animate-fade-in-up-delay {
          animation: fade-in-up 0.8s ease-out 0.2s both;
        }

        .animate-fade-in-up-delay-2 {
          animation: fade-in-up 0.8s ease-out 0.4s both;
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }

        .text-shadow-lg {
          text-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        }

        /* Scroll suave */
        html {
          scroll-behavior: smooth;
        }

        /* Personalización del scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.5);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.7);
        }

        /* Animaciones adicionales para elementos interactivos */
        .group:hover .group-hover\\:scale-110 {
          transform: scale(1.1);
        }

        .group:hover .group-hover\\:translate-x-1 {
          transform: translateX(0.25rem);
        }

        /* Mejoras en la responsividad */
        @media (max-width: 768px) {
          .animate-slide-up-delay-1,
          .animate-slide-up-delay-2,
          .animate-slide-up-delay-3 {
            animation-delay: 0s;
          }
        }

        /* Efecto de parallax sutil */
        .parallax {
          transform: translateZ(0);
          will-change: transform;
        }

        /* Efectos adicionales para el fondo */
        body {
          overflow-x: hidden;
        }

        /* Mejora en las transiciones de colores */
        * {
          transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </div>
  );
}